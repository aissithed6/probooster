'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '../../../../lib/supabase'

interface DeliveryConversationPayload {
  orderId: string
}

interface DeliveryRow {
  id: string
  order_id: string
  customer_id: string | null
  vendor_id: string | null
  driver_id: string | null
}

interface OrderOwnerRow {
  customer_id: string | null
  vendor_id: string | null
}

interface UserProfileNameRow {
  user_id: string
  first_name: string | null
  last_name: string | null
  short_code: string | null
}

interface UserBaseRow {
  id: string
  email: string | null
}

/**
 * Extrait un token Supabase depuis l'en-tête Authorization ou depuis les cookies.
 */
async function extractAccessToken(request: NextRequest): Promise<string | undefined> {
  const bearerHeader = request.headers.get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) return token
  }

  const tokenFromCookies = request.cookies.get('sb-access-token')?.value
  if (tokenFromCookies) return tokenFromCookies

  const supabaseAuthCookie = request.cookies.get('supabase-auth-token')?.value
  if (!supabaseAuthCookie) return undefined

  const attempts = [supabaseAuthCookie]
  try {
    const decoded = decodeURIComponent(supabaseAuthCookie)
    if (decoded !== supabaseAuthCookie) attempts.push(decoded)
  } catch {
    // ignore
  }

  for (const raw of attempts) {
    try {
      const parsed = JSON.parse(raw)
      const token: unknown = parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token
      if (typeof token === 'string' && token.length > 0) return token
    } catch {
      // ignore
    }
  }

  return undefined
}

/**
 * Résout l'utilisateur authentifié et son rôle via la table public.users.
 */
async function resolveAuthenticatedUser(request: NextRequest): Promise<{ userId: string; role: string | null }> {
  const supabase = getSupabaseAdmin()
  const accessToken = await extractAccessToken(request)

  if (!accessToken) {
    throw new Error('Authentification requise.')
  }

  const { data: authData, error } = await supabase.auth.getUser(accessToken)
  if (error || !authData?.user) {
    throw new Error('Authentification requise.')
  }

  const userId = authData.user.id

  const { data: roleRow, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (roleError) {
    throw new Error("Impossible de vérifier le rôle de l'utilisateur.")
  }

  return { userId, role: roleRow?.role ?? null }
}

/**
 * POST /api/chat/delivery-conversations
 * Crée (ou récupère) la conversation livraison liée à une commande et s'assure que les participants requis existent.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as DeliveryConversationPayload | null

    const orderId = String(payload?.orderId ?? '').trim()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis.' }, { status: 400 })
    }

    const { userId, role } = await resolveAuthenticatedUser(request)
    const normalizedRole = String(role ?? '').toLowerCase().replace(/-/g, '_')
    const effectiveRole = normalizedRole === 'seller' ? 'vendor' : normalizedRole

    const supabase = getSupabaseAdmin()

    // Optimisation: charger delivery + owners en parallèle (orders est parfois la source de vérité).
    const [deliveryResult, ownersResult] = await Promise.all([
      supabase
        .from('deliveries')
        .select('id, order_id, customer_id, vendor_id, driver_id')
        .eq('order_id', orderId)
        .maybeSingle(),
      supabase
        .from('orders')
        .select('customer_id, vendor_id')
        .eq('id', orderId)
        .maybeSingle()
    ])

    const { data: delivery, error: deliveryError } = deliveryResult
    const { data: orderOwners, error: ownersError } = ownersResult

    if (deliveryError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération de la livraison.' }, { status: 500 })
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Aucune livraison trouvée pour cette commande.' }, { status: 404 })
    }

    if (ownersError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des informations de commande.' }, { status: 500 })
    }

    const row = delivery as DeliveryRow
    const owners = orderOwners as OrderOwnerRow | null

    // Compatibilité: certains schémas stockent vendor_id/customer_id uniquement sur orders.
    const effectiveCustomerId = row.customer_id ?? owners?.customer_id ?? null
    const effectiveVendorId = row.vendor_id ?? owners?.vendor_id ?? null

    // Contrôle d'accès: seuls les concernés ou le super admin peuvent initier.
    const isSuperAdmin = effectiveRole === 'super_admin'
    const isClient = effectiveRole === 'client' && effectiveCustomerId === userId
    const isVendor = effectiveRole === 'vendor' && effectiveVendorId === userId
    const isDriver = effectiveRole === 'driver' && row.driver_id === userId

    if (!isSuperAdmin && !isClient && !isVendor && !isDriver) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    // Créer ou récupérer la conversation (unique par order_id)
    const { data: existing, error: existingError } = await supabase
      .from('delivery_chat_conversations')
      .select('id, order_id')
      .eq('order_id', orderId)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération de la conversation.' }, { status: 500 })
    }

    let conversationId = existing?.id as string | undefined

    if (!conversationId) {
      const { data: created, error: createError } = await supabase
        .from('delivery_chat_conversations')
        .insert({ order_id: orderId })
        .select('id')
        .single()

      if (createError) {
        return NextResponse.json({ error: 'Erreur lors de la création de la conversation.' }, { status: 500 })
      }

      conversationId = created?.id
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Impossible de créer la conversation.' }, { status: 500 })
    }

    // Participants requis (client/vendor/driver si dispo)
    const participants: Array<{ user_id: string; role_in_conversation: 'client' | 'vendor' | 'driver' | 'super_admin' }> = []

    if (effectiveCustomerId) participants.push({ user_id: effectiveCustomerId, role_in_conversation: 'client' })
    if (effectiveVendorId) participants.push({ user_id: effectiveVendorId, role_in_conversation: 'vendor' })
    if (row.driver_id) participants.push({ user_id: row.driver_id, role_in_conversation: 'driver' })

    // Garde-fou: backfill du participant initiateur (utile si conversation créée avant la correction).
    const initiatorRole: 'client' | 'vendor' | 'driver' | 'super_admin' =
      effectiveRole === 'super_admin'
        ? 'super_admin'
        : effectiveRole === 'vendor'
          ? 'vendor'
          : effectiveRole === 'driver'
            ? 'driver'
            : 'client'

    participants.push({ user_id: userId, role_in_conversation: initiatorRole })

    const uniqueKey = new Set<string>()
    const uniqueParticipants = participants.filter((p) => {
      const key = `${p.user_id}:${p.role_in_conversation}`
      if (uniqueKey.has(key)) return false
      uniqueKey.add(key)
      return true
    })

    if (uniqueParticipants.length > 0) {
      const { error: insertParticipantsError } = await supabase
        .from('delivery_chat_participants')
        .upsert(
          uniqueParticipants.map(p => ({ conversation_id: conversationId, user_id: p.user_id, role_in_conversation: p.role_in_conversation })),
          { onConflict: 'conversation_id,user_id' }
        )

      if (insertParticipantsError) {
        return NextResponse.json({ error: 'Erreur lors de la création des participants.' }, { status: 500 })
      }
    }

    // Renvoyer des noms lisibles (sans dépendre de la RLS côté client).
    const { data: participantRows, error: participantFetchError } = await supabase
      .from('delivery_chat_participants')
      .select('user_id, role_in_conversation')
      .eq('conversation_id', conversationId)

    if (participantFetchError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des participants.' }, { status: 500 })
    }

    const rows = (participantRows ?? []) as Array<{ user_id: string; role_in_conversation: string }>
    const ids = Array.from(new Set(rows.map((r) => String(r.user_id)).filter(Boolean)))

    const [profilesResult, usersResult] = await Promise.all([
      ids.length > 0
        ? supabase.from('user_profiles').select('user_id, first_name, last_name, short_code').in('user_id', ids)
        : Promise.resolve({ data: [], error: null } as any),
      ids.length > 0
        ? supabase.from('users').select('id, email').in('id', ids)
        : Promise.resolve({ data: [], error: null } as any)
    ])

    const profileById = new Map(
      ((profilesResult.data ?? []) as any[]).map((p) => [
        String(p.user_id),
        { first_name: p.first_name ?? null, last_name: p.last_name ?? null, short_code: p.short_code ?? null } as UserProfileNameRow
      ])
    )
    const userById = new Map(
      ((usersResult.data ?? []) as any[]).map((u) => [String(u.id), { id: String(u.id), email: u.email ?? null } as UserBaseRow])
    )

    const roleLabel = (role: string) => {
      const r = String(role ?? '').toLowerCase()
      if (r === 'vendor' || r === 'seller') return 'Vendeur'
      if (r === 'client' || r === 'customer') return 'Client'
      if (r === 'driver' || r === 'livreur') return 'Livreur'
      if (r === 'super_admin') return 'Admin'
      return 'Utilisateur'
    }

    const participantsWithNames = rows.map((r) => {
      const pid = String(r.user_id)
      const profile = profileById.get(pid)
      const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
      const shortCode = String(profile?.short_code ?? '').trim()
      const email = String(userById.get(pid)?.email ?? '').trim()
      const emailLabel = email.includes('@') ? email.split('@')[0] : ''
      const fallback = `${roleLabel(r.role_in_conversation)} ${pid.slice(0, 6)}`

      const displayName =
        fullName.length > 0
          ? fullName
          : shortCode.length > 0
            ? shortCode
            : emailLabel.length > 0
              ? emailLabel
              : fallback

      return { userId: pid, role: String(r.role_in_conversation), displayName }
    })

    return NextResponse.json({ data: { conversationId, orderId, participants: participantsWithNames } }, { status: 200 })
  } catch (error) {
    console.error('❌ POST /api/chat/delivery-conversations failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('authentification requise') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
