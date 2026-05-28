import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Extrait un access token Supabase depuis Authorization: Bearer, sb-access-token ou supabase-auth-token.
 */
 /**
  * Récupère un cookie Supabase potentiellement "chunké" (ex: sb-xxx-auth-token.0, .1, ...).
  */
 function readChunkedCookie(request: NextRequest, nameRegex: RegExp): string | undefined {
   const all = request.cookies.getAll()
   const matches = all.filter((cookie) => nameRegex.test(cookie.name))
   if (matches.length === 0) return undefined
 
   const grouped = matches.reduce<Record<string, { index: number; value: string }[]>>((acc, cookie) => {
     const baseName = cookie.name.replace(/\.(\d+)$/, '')
     const idxMatch = cookie.name.match(/\.(\d+)$/)
     const index = idxMatch ? Number(idxMatch[1]) : 0
     if (!acc[baseName]) acc[baseName] = []
     acc[baseName].push({ index, value: cookie.value })
     return acc
   }, {})
 
   const bestBaseName = Object.keys(grouped).sort((a, b) => (grouped[b]?.length ?? 0) - (grouped[a]?.length ?? 0))[0]
   const parts = grouped[bestBaseName] ?? []
   if (parts.length === 0) return undefined
 
   return parts
     .sort((a, b) => a.index - b.index)
     .map((part) => part.value)
     .join('')
 }
 
function extractAccessToken(request: NextRequest): string | undefined {
  const bearerHeader = request.headers.get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) return token
  }

  const tokenFromCookie = request.cookies.get('sb-access-token')?.value
  if (tokenFromCookie) return tokenFromCookie

  // Cookies Supabase (auth helpers) : sb-<project-ref>-auth-token, parfois chunkés en .0/.1/... (limite 4KB)
  const rawChunkedSbAuth = readChunkedCookie(request, /^sb-.*-auth-token(\.\d+)?$/)
  const tokenFromSbAuth = parseSupabaseAuthCookie(rawChunkedSbAuth)
  if (tokenFromSbAuth) return tokenFromSbAuth

  // Fallback ancien nom
  const rawSupabaseAuthCookie = request.cookies.get('supabase-auth-token')?.value
  const tokenFromLegacy = parseSupabaseAuthCookie(rawSupabaseAuthCookie)
  if (tokenFromLegacy) return tokenFromLegacy

  // Certains setups stockent directement un access token dans sb-<ref>-access-token (potentiellement chunké)
  const rawChunkedSbAccess = readChunkedCookie(request, /^sb-.*-access-token(\.\d+)?$/)
  if (rawChunkedSbAccess && rawChunkedSbAccess.length > 0) return rawChunkedSbAccess

  return undefined
}

/**
 * Parse le cookie supabase-auth-token (souvent JSON encodé), et retourne access_token si présent.
 */
function parseSupabaseAuthCookie(rawValue?: string): string | undefined {
  if (!rawValue) return undefined

  const attempts = [rawValue]
  try {
    const decoded = decodeURIComponent(rawValue)
    if (decoded !== rawValue) attempts.push(decoded)
  } catch {
    // ignore decode errors
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)

      // Formats possibles:
      // - { access_token: string, ... }
      // - { currentSession: { access_token: string } }
      // - [access_token, refresh_token]
      // - { currentAccessToken: string }
      const token: unknown = Array.isArray(parsed)
        ? parsed[0]
        : (parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token)

      if (typeof token === 'string' && token.length > 0) return token
    } catch {
      // ignore JSON parse errors
    }
  }

  return undefined
}

/**
 * Vérifie que l'utilisateur courant a le droit de modifier/supprimer la campagne.
 */
async function assertCanMutateCampaign(
  request: NextRequest,
  campaignVendorId: string
): Promise<{ userId: string; role: 'super_admin' | 'admin' | 'vendor' | 'client' | 'unknown' }> {
  const accessToken = extractAccessToken(request)
  if (!accessToken) {
    throw new Error('Token Supabase manquant, accès refusé.')
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
  if (authError || !authData?.user?.id) {
    throw new Error('Utilisateur introuvable ou token invalide.')
  }

  const userId = authData.user.id

  const metadataRoleRaw: unknown =
    (authData.user as any)?.app_metadata?.role ?? (authData.user as any)?.user_metadata?.role
  const metadataRole = typeof metadataRoleRaw === 'string' ? metadataRoleRaw : undefined

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (roleError) {
    console.warn('Erreur lecture rôle utilisateur:', roleError)
  }

  const roleFromUsersTable = typeof roleRow?.role === 'string' ? roleRow.role : undefined
  const normalizedRole = typeof roleFromUsersTable === 'string'
    ? (roleFromUsersTable.toLowerCase().replace(/-/g, '_') as any)
    : typeof metadataRole === 'string'
      ? (metadataRole.toLowerCase().replace(/-/g, '_') as any)
      : 'unknown'

  const role: 'super_admin' | 'admin' | 'vendor' | 'client' | 'unknown' =
    normalizedRole === 'super_admin'
      ? 'super_admin'
      : normalizedRole === 'admin'
        ? 'admin'
        : normalizedRole === 'vendor'
          ? 'vendor'
          : normalizedRole === 'client'
            ? 'client'
            : 'unknown'

  if (role === 'super_admin' || role === 'admin') {
    return { userId, role }
  }

  if (role === 'vendor') {
    if (userId !== campaignVendorId) {
      throw new Error('Accès refusé: vous ne pouvez modifier que vos propres campagnes.')
    }
    return { userId, role }
  }

  // Fallback: si le rôle n'est pas disponible mais que l'utilisateur est le propriétaire de la campagne,
  // on le traite comme un vendeur pour permettre les actions basiques (pause/play/stop/modifier contenu).
  if (userId === campaignVendorId) {
    return { userId, role: 'vendor' }
  }

  throw new Error('Accès refusé.')
}

/**
 * PUT /api/marketing/campaigns/[id]
 * Met à jour une campagne. Si les champs d’approbation changent, on ajuste le statut.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaitedParams = await params
    const id = awaitedParams?.id
    if (!id) {
      return NextResponse.json({ error: "Identifiant de campagne manquant." }, { status: 400 })
    }

    const updates = (await request.json().catch(() => null)) as Record<string, any> | null
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée fournie pour la mise à jour.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Récupère la campagne existante pour appliquer la logique métier
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('boosting_campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Fetch campaign error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let actor: { userId: string; role: 'super_admin' | 'admin' | 'vendor' | 'client' | 'unknown' }
    try {
      actor = await assertCanMutateCampaign(request, existing.vendor_id)
    } catch (error: any) {
      return NextResponse.json({ error: error?.message ?? 'Accès refusé.' }, { status: 401 })
    }

    // Calcule le nouveau statut en fonction des approbations et construit un patch sécurisé
    const merged: Record<string, any> = { ...existing, ...updates }
    const isVendor = actor.role === 'vendor'

    // Un vendeur ne doit jamais pouvoir changer les champs sensibles (approbations, paiements, vendor/service).
    merged.vendor_id = existing.vendor_id
    merged.service_id = existing.service_id
    if (isVendor) {
      merged.type = existing.type
      merged.product_id = existing.product_id
      merged.super_admin_approved = existing.super_admin_approved
      merged.admin_approved = existing.admin_approved
      merged.approved_by_super_admin = existing.approved_by_super_admin
      merged.approved_by_admin = existing.approved_by_admin
      merged.approved_at = existing.approved_at

      merged.total_cost = existing.total_cost
      merged.payment_status = existing.payment_status
      merged.payment_id = existing.payment_id
      merged.payment_method = existing.payment_method
    }

    const saApproved = !!merged.super_admin_approved
    const adApproved = !!merged.admin_approved

    const allowedTypes = new Set(['recommendation', 'banner', 'whatsapp'])
    const nextType = typeof merged.type === 'string' && allowedTypes.has(merged.type) ? merged.type : existing.type
    const canUpdateName = Object.prototype.hasOwnProperty.call(existing, 'name')
    const nextName = canUpdateName && (typeof merged.name === 'string' || merged.name === null)
      ? merged.name
      : (existing as any).name
    const nextProductId = typeof merged.product_id === 'string' || merged.product_id === null
      ? merged.product_id
      : existing.product_id

    let nextStatus = merged.status
    let nextApprovedAt = merged.approved_at
    let nextStartDate = merged.start_date
    let nextEndDate = merged.end_date

    // Le statut 'completed' doit être prioritaire et ne pas être écrasé par la logique d'approbation.
    if (nextStatus === 'completed') {
      nextEndDate = nextEndDate || new Date().toISOString()
    } else if (nextStatus === 'paused') {
      // conserver 'paused'
    } else if (nextStatus === 'rejected') {
      // conserver 'rejected'
    } else if (saApproved && adApproved) {
      nextStatus = 'active'
      nextApprovedAt = nextApprovedAt || new Date().toISOString()
      nextStartDate = nextStartDate || new Date().toISOString()
    } else {
      nextStatus = 'pending'
    }

    const patch: Record<string, any> = {
      type: nextType,
      product_id: nextProductId ?? null,
      status: nextStatus,
      start_date: nextStartDate ?? null,
      end_date: nextEndDate ?? null,
      super_admin_approved: saApproved,
      admin_approved: adApproved,
      approved_by_super_admin: merged.approved_by_super_admin ?? null,
      approved_by_admin: merged.approved_by_admin ?? null,
      approved_at: nextApprovedAt ?? null,
      target_pages: Array.isArray(merged.target_pages) ? merged.target_pages : existing.target_pages,
      duration: merged.duration ?? existing.duration,
      total_cost: typeof merged.total_cost === 'number' ? merged.total_cost : existing.total_cost,
      payment_status: merged.payment_status ?? existing.payment_status,
      payment_id: merged.payment_id ?? existing.payment_id,
      payment_method: merged.payment_method ?? existing.payment_method,
      rejection_reason: merged.rejection_reason ?? existing.rejection_reason,
      updated_at: new Date().toISOString()
    }

    if (canUpdateName) {
      patch.name = nextName ?? null
    }

    for (const key of Object.keys(patch)) {
      if (!Object.prototype.hasOwnProperty.call(existing, key)) {
        delete patch[key]
      }
    }

    const { data, error } = await supabaseAdmin
      .from('boosting_campaigns')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PUT /marketing/campaigns/[id] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('PUT /marketing/campaigns/[id] failed:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}

/**
 * DELETE /api/marketing/campaigns/[id]
 * Supprime une campagne (super_admin/admin) ou la campagne du vendeur courant.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaitedParams = await params
    const id = awaitedParams?.id
    if (!id) {
      return NextResponse.json({ error: 'Identifiant de campagne manquant.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('boosting_campaigns')
      .select('id, vendor_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      console.error('Fetch campaign error:', fetchError)
      return NextResponse.json({ error: fetchError?.message ?? 'Campagne introuvable.' }, { status: 404 })
    }

    try {
      await assertCanMutateCampaign(request, existing.vendor_id)
    } catch (error: any) {
      return NextResponse.json({ error: error?.message ?? 'Accès refusé.' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('boosting_campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DELETE /marketing/campaigns/[id] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('DELETE /marketing/campaigns/[id] failed:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
