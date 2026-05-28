import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

type PartnersRequestBody = {
  partnerIds?: string[]
}

type PartnerRow = {
  user_id: string
  display_name: string
  avatar_url: string | null
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function computeDisplayName(profile: any, user: any, fallbackId: string): string {
  const first = typeof profile?.first_name === 'string' ? String(profile.first_name).trim() : ''
  const last = typeof profile?.last_name === 'string' ? String(profile.last_name).trim() : ''
  const full = [first, last].filter(Boolean).join(' ').trim()
  if (full) return full

  const prefs = asObject(profile?.preferences)
  const vendorPublic = asObject((prefs as any)?.vendor_public)
  const shopName = typeof (vendorPublic as any)?.shop_name === 'string' ? String((vendorPublic as any).shop_name).trim() : ''
  if (shopName) return shopName

  const shortCode = typeof profile?.short_code === 'string' ? String(profile.short_code).trim() : ''
  if (shortCode) return shortCode

  const email = typeof user?.email === 'string' ? String(user.email).trim() : ''
  if (email) return email.split('@')[0]

  return fallbackId ? `Contact ${fallbackId.slice(0, 8)}` : 'Contact inconnu'
}

/**
 * POST /api/client/chat/partners
 * Retourne les profils (nom/prénom/avatar) des partenaires de chat.
 */
export async function POST(request: NextRequest) {
  try {
    await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => null)) as PartnersRequestBody | null
    const rawIds = Array.isArray(body?.partnerIds) ? body!.partnerIds : []

    const partnerIds = Array.from(
      new Set(
        rawIds
          .map((id) => String(id ?? '').trim())
          .filter((id) => id.length > 0)
          .slice(0, 200)
      )
    )

    if (partnerIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const [byUserIdRes, byProfileIdRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id,user_id,first_name,last_name,avatar_url,short_code,preferences')
        .in('user_id', partnerIds),
      supabase
        .from('user_profiles')
        .select('id,user_id,first_name,last_name,avatar_url,short_code,preferences')
        .in('id', partnerIds)
    ])

    if (byUserIdRes.error) {
      console.error('❌ POST /api/client/chat/partners error (user_id):', byUserIdRes.error)
      return NextResponse.json({ error: 'Impossible de récupérer les profils.' }, { status: 500 })
    }
    if (byProfileIdRes.error) {
      console.error('❌ POST /api/client/chat/partners error (id):', byProfileIdRes.error)
      return NextResponse.json({ error: 'Impossible de récupérer les profils.' }, { status: 500 })
    }

    const rows = [...(byUserIdRes.data ?? []), ...(byProfileIdRes.data ?? [])] as any[]
    const byAnyId = new Map<string, any>()
    const userIds = new Set<string>(partnerIds)
    rows.forEach((row) => {
      const pid = typeof row?.id === 'string' ? String(row.id).trim() : ''
      const uid = typeof row?.user_id === 'string' ? String(row.user_id).trim() : ''
      if (pid) byAnyId.set(pid, row)
      if (uid) byAnyId.set(uid, row)
      if (uid) userIds.add(uid)
    })

    const { data: usersRows, error: usersError } = await supabase
      .from('users')
      .select('id,email')
      .in('id', Array.from(userIds))

    if (usersError) {
      console.warn('⚠️ POST /api/client/chat/partners users fallback error:', usersError)
    }

    const userById = new Map<string, any>()
    ;(usersRows ?? []).forEach((row: any) => {
      const id = typeof row?.id === 'string' ? String(row.id).trim() : ''
      if (!id) return
      userById.set(id, row)
    })

    // Fallback final: certains IDs peuvent exister dans Supabase Auth mais pas dans la table `users`.
    // On tente alors de récupérer l'email via l'API Admin.
    const authEmailById = new Map<string, string>()
    const authLookupIds = Array.from(userIds).filter((id) => !userById.has(id))
    if (authLookupIds.length > 0) {
      const batch = authLookupIds.slice(0, 50)
      const results = await Promise.all(
        batch.map(async (id) => {
          try {
            const res = await supabase.auth.admin.getUserById(id)
            const email = typeof res?.data?.user?.email === 'string' ? String(res.data.user.email).trim() : ''
            return { id, email }
          } catch {
            return { id, email: '' }
          }
        })
      )

      results.forEach((r) => {
        if (r.id && r.email) authEmailById.set(r.id, r.email)
      })
    }

    const normalized: PartnerRow[] = partnerIds.map((id) => {
      const profile = byAnyId.get(id) ?? null
      const profileUserId = typeof profile?.user_id === 'string' ? String(profile.user_id).trim() : ''
      const baseUser = profileUserId
        ? (userById.get(profileUserId) ?? userById.get(id) ?? null)
        : (userById.get(id) ?? null)
      const authEmail = authEmailById.get(profileUserId) ?? authEmailById.get(id) ?? ''
      const user = authEmail
        ? { ...(baseUser ?? {}), email: authEmail }
        : baseUser
      return {
        user_id: id,
        display_name: computeDisplayName(profile, user, id),
        avatar_url: typeof profile?.avatar_url === 'string' ? String(profile.avatar_url).trim() : null
      }
    })

    return NextResponse.json({ data: normalized })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    console.error('❌ POST /api/client/chat/partners failed:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
