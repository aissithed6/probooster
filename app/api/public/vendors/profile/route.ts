import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SHORT_CODE_REGEX = /^[a-z0-9]{6,32}$/i

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v ?? '').trim()).filter(Boolean)
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
 * GET /api/public/vendors/profile?vendorId=<uuid>
 * Retourne des informations publiques détaillées d'un vendeur (profil + email).
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const vendorId = String(url.searchParams.get('vendorId') ?? '').trim()

    if (!UUID_REGEX.test(vendorId) && !SHORT_CODE_REGEX.test(vendorId)) {
      return NextResponse.json({ data: null, error: 'vendorId invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    let profileByUserId: any = null
    let profileByUserIdErr: any = null
    let user: any = null
    let userErr: any = null

    if (UUID_REGEX.test(vendorId)) {
      const [profileRes, userRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, user_id, first_name, last_name, avatar_url, phone, city, country, bio, website, social_media, preferences, short_code, created_at')
          .eq('user_id', vendorId)
          .maybeSingle(),
        supabase.from('users').select('id, email, created_at').eq('id', vendorId).maybeSingle()
      ])
      profileByUserId = profileRes.data
      profileByUserIdErr = profileRes.error
      user = userRes.data
      userErr = userRes.error
    }

    let profile = profileByUserId

    if (!profile) {
      try {
        const { data: profileById, error: profileByIdErr } = await supabase
          .from('user_profiles')
          .select('id, user_id, first_name, last_name, avatar_url, phone, city, country, bio, website, social_media, preferences, short_code, created_at')
          .eq('id', vendorId)
          .maybeSingle()

        if (profileByIdErr) {
          console.warn('⚠️ GET /api/public/vendors/profile: user_profiles lookup by id failed:', profileByIdErr)
        }

        if (profileById) {
          profile = profileById
        }
      } catch {
        // ignore
      }
    }

    if (!profile && SHORT_CODE_REGEX.test(vendorId)) {
      try {
        const { data: profileByShortCode, error: profileByShortCodeErr } = await supabase
          .from('user_profiles')
          .select('id, user_id, first_name, last_name, avatar_url, phone, city, country, bio, website, social_media, preferences, short_code, created_at')
          .eq('short_code', vendorId)
          .maybeSingle()

        if (profileByShortCodeErr) {
          console.warn('⚠️ GET /api/public/vendors/profile: user_profiles lookup by short_code failed:', profileByShortCodeErr)
        }

        if (profileByShortCode) {
          profile = profileByShortCode
        }
      } catch {
        // ignore
      }
    }

    if (profileByUserIdErr) {
      console.warn('⚠️ GET /api/public/vendors/profile: user_profiles lookup by user_id failed:', profileByUserIdErr)
    }
    if (userErr) {
      console.warn('⚠️ GET /api/public/vendors/profile: users lookup failed:', userErr)
    }

    if (!user && profile) {
      try {
        const uid = String((profile as any)?.user_id ?? '').trim()
        if (UUID_REGEX.test(uid)) {
          const { data: u2, error: u2Err } = await supabase.from('users').select('id, email, created_at').eq('id', uid).maybeSingle()
          if (u2Err) {
            console.warn('⚠️ GET /api/public/vendors/profile: users lookup by resolved user_id failed:', u2Err)
          }
          user = u2
        }
      } catch {
        // ignore
      }
    }

    const prefs = asObject((profile as any)?.preferences)
    const vendorPublic = asObject((prefs as any)?.vendor_public)
    const isProfilePublic = resolveIsProfilePublic((profile as any)?.preferences)

    const canonicalVendorId = String((profile as any)?.user_id ?? '').trim() || vendorId

    const first = String((profile as any)?.first_name ?? '').trim()
    const last = String((profile as any)?.last_name ?? '').trim()
    const shortCode = String((profile as any)?.short_code ?? '').trim()

    const displayName = (first || last) ? [first, last].filter(Boolean).join(' ') : shortCode

    const phone = isProfilePublic ? String((profile as any)?.phone ?? '').trim() : ''
    const city = isProfilePublic ? String((profile as any)?.city ?? '').trim() : ''
    const country = isProfilePublic ? String((profile as any)?.country ?? '').trim() : ''
    const location = isProfilePublic ? [city, country].filter(Boolean).join(', ') : ''

    const bio = String((profile as any)?.bio ?? '').trim()

    const specialties = asStringArray((vendorPublic as any)?.specialties)
    const deliveryTime = String((vendorPublic as any)?.delivery_time ?? '').trim()

    const createdAt =
      (typeof (user as any)?.created_at === 'string' && String((user as any).created_at).trim().length > 0)
        ? String((user as any).created_at).trim()
        : (typeof (profile as any)?.created_at === 'string' && String((profile as any).created_at).trim().length > 0)
          ? String((profile as any).created_at).trim()
          : ''

    return NextResponse.json(
      {
        data: {
          vendorId: canonicalVendorId,
          name: displayName,
          avatar: String((profile as any)?.avatar_url ?? '').trim(),
          email: isProfilePublic ? String((user as any)?.email ?? '').trim() : '',
          phone,
          location,
          city,
          country,
          description: bio,
          specialties,
          deliveryTime,
          createdAt
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
