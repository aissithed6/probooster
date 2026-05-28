import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type PublicUserPreview = {
  id: string
  name: string
  avatar: string
}

/**
 * Lit la préférence privacy.profilePublic depuis preferences (best-effort).
 */
function resolveIsProfilePublic(profile: any): boolean {
  const prefs = profile?.preferences && typeof profile.preferences === 'object' && !Array.isArray(profile.preferences)
    ? profile.preferences
    : null
  const privacy = prefs?.privacy && typeof prefs.privacy === 'object' && !Array.isArray(prefs.privacy)
    ? prefs.privacy
    : null

  const raw = (privacy as any)?.profilePublic
  if (typeof raw === 'boolean') return raw
  if (raw === 1 || raw === '1' || raw === 'true') return true
  if (raw === 0 || raw === '0' || raw === 'false') return false
  return true
}

/**
 * Construit un nom lisible à partir de `user_profiles` (fallback email si nécessaire).
 */
function resolveDisplayName(profile: any, userRow: any): string {
  const first = typeof profile?.first_name === 'string' ? String(profile.first_name).trim() : ''
  const last = typeof profile?.last_name === 'string' ? String(profile.last_name).trim() : ''
  const full = [first, last].filter(Boolean).join(' ').trim()
  if (full) return full

  const shortCode = typeof profile?.short_code === 'string' ? String(profile.short_code).trim() : ''
  if (shortCode) return shortCode

  const email = typeof userRow?.email === 'string' ? String(userRow.email).trim() : ''
  if (email && email.includes('@')) return email.split('@')[0]

  return 'Client'
}

/**
 * GET /api/public/users/preview?ids=<csv>
 * Retourne un aperçu public minimaliste d'utilisateurs (id, name, avatar) via Supabase Admin.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const idsRaw = String(url.searchParams.get('ids') ?? '')

    const ids = idsRaw
      .split(',')
      .map((x) => String(x).trim())
      .filter((x) => UUID_REGEX.test(x))
      .slice(0, 80)

    if (ids.length === 0) {
      return NextResponse.json(
        { data: [] },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    const supabase = getSupabaseAdmin()

    const [{ data: profiles }, { data: users }] = await Promise.all([
      supabase.from('user_profiles').select('user_id, first_name, last_name, avatar_url, short_code, preferences').in('user_id', ids).limit(200),
      supabase.from('users').select('id, email').in('id', ids).limit(200)
    ])

    const profileByUserId = new Map<string, any>()
    for (const p of profiles ?? []) {
      const uid = typeof (p as any)?.user_id === 'string' ? String((p as any).user_id).trim() : ''
      if (!uid) continue
      profileByUserId.set(uid, p)
    }

    const userById = new Map<string, any>()
    for (const u of users ?? []) {
      const id = typeof (u as any)?.id === 'string' ? String((u as any).id).trim() : ''
      if (!id) continue
      userById.set(id, u)
    }

    const result: PublicUserPreview[] = ids.map((id) => {
      const profile = profileByUserId.get(id)
      const userRow = userById.get(id)
      const isPublic = resolveIsProfilePublic(profile)
      if (!isPublic) {
        return { id, name: 'Utilisateur', avatar: '' }
      }

      const name = resolveDisplayName(profile, userRow)
      const avatar = typeof profile?.avatar_url === 'string' ? String(profile.avatar_url).trim() : ''
      return { id, name, avatar }
    })

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
    return NextResponse.json(
      { data: [], error: message },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }
}
