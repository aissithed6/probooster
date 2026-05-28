import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type VendorListItem = {
  id: string
  name: string
  avatar: string
  role: string
  createdAt: string
  shortCode?: string
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function resolveIsProfilePublic(preferences: unknown): boolean {
  const prefs = asObject(preferences)
  const privacy = asObject((prefs as any)?.privacy)
  const raw = (privacy as any)?.profilePublic
  if (typeof raw === 'boolean') return raw
  if (raw === 1 || raw === '1' || raw === 'true') return true
  if (raw === 0 || raw === '0' || raw === 'false') return false
  return true
}

/**
 * GET /api/public/vendors/list
 * Retourne une liste publique minimaliste de vendeurs (UUID, nom, avatar).
 * Objectif: permettre au front d'afficher la présence temps réel via Supabase Presence.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .or('role.eq.vendor,role.eq.super_admin,role.eq.admin,role.eq.superadmin')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ data: [], error: error.message }, { status: 200 })
    }

    const ids = (users ?? [])
      .map((u: any) => String(u?.id ?? '').trim())
      .filter((id: string) => UUID_REGEX.test(id))

    const { data: profiles } = ids.length
      ? await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, avatar_url, short_code, preferences')
          .in('user_id', ids)
      : ({ data: [] } as any)

    const profileByUser = new Map<string, any>()
    for (const p of profiles ?? []) {
      const uid = String((p as any)?.user_id ?? '').trim()
      if (!uid) continue
      profileByUser.set(uid, p)
    }

    const result: VendorListItem[] = (users ?? [])
      .map((u: any) => {
        const id = String(u?.id ?? '').trim()
        if (!UUID_REGEX.test(id)) return null

        const profile = profileByUser.get(id)
        const isPublic = resolveIsProfilePublic(profile?.preferences)
        const first = String(profile?.first_name ?? '').trim()
        const last = String(profile?.last_name ?? '').trim()
        const shortCode = String(profile?.short_code ?? '').trim()
        const email = String(u?.email ?? '').trim()

        const name = isPublic
          ? ((first || last)
              ? [first, last].filter(Boolean).join(' ')
              : shortCode
                ? shortCode
                : email
                  ? email.split('@')[0]
                  : 'Boutique')
          : 'Utilisateur'

        const avatar = isPublic ? (String(profile?.avatar_url ?? '').trim() || '/placeholder-user.jpg') : ''
        const role = String(u?.role ?? '').trim()
        const createdAt = typeof u?.created_at === 'string' ? String(u.created_at).trim() : ''

        return { id, name, avatar, role, createdAt, shortCode: shortCode || undefined }
      })
      .filter(Boolean) as VendorListItem[]

    return NextResponse.json(
      { data: result },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ data: [], error: message }, { status: 200 })
  }
}
