import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

const unauthorized = () => NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
const forbidden = () => NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const participantId = resolvedParams.id

    if (!participantId) {
      return NextResponse.json({ error: 'Identifiant participant requis.' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const headerList = await headers()

    const cookieToken = (() => {
      const direct = cookieStore.get('sb-access-token')?.value
      if (direct) return direct

      try {
        const allCookies = (cookieStore as any).getAll?.() ?? []
        for (const cookie of allCookies as Array<{ name: string; value: string }>) {
          const name = cookie?.name ?? ''
          const value = cookie?.value
          if (!name || typeof value !== 'string' || value.length === 0) continue
          if (name.startsWith('sb-') && name.endsWith('-access-token')) {
            return value
          }
        }
      } catch {
        // ignore cookie enumeration errors
      }

      return undefined
    })()
    const authHeader = headerList.get('authorization') || headerList.get('Authorization')
    const headerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim() || null
      : null

    const accessToken = cookieToken ?? headerToken

    if (!accessToken) {
      return unauthorized()
    }

    const supabase = getSupabaseAdmin()
    const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !userResult?.user) {
      return unauthorized()
    }

    const currentUserId = userResult.user.id

    const { data: currentUserRow, error: currentUserRowError } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .maybeSingle()

    if (currentUserRowError) {
      console.warn('GET /api/internal-messaging/participants failed to load current user role:', currentUserRowError)
    }

    const currentRole = String((currentUserRow as any)?.role ?? '')
      .toLowerCase()
      .replace(/-/g, '_')
      .trim()

    const isAdminViewer = currentRole === 'admin' || currentRole === 'super_admin'

    if (participantId === currentUserId) {
      const profile = await fetchParticipantProfile(supabase, participantId)
      return NextResponse.json({ data: profile })
    }

    if (isAdminViewer) {
      const profile = await fetchParticipantProfile(supabase, participantId)
      return NextResponse.json({ data: profile })
    }

    const { data: sharedMessage, error: sharedMessageError } = await supabase
      .from('user_messages')
      .select('id')
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${participantId}),and(sender_id.eq.${participantId},recipient_id.eq.${currentUserId})`
      )
      .limit(1)
      .single()

    if (sharedMessageError || !sharedMessage) {
      return forbidden()
    }

    const profile = await fetchParticipantProfile(supabase, participantId)
    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error('GET /api/internal-messaging/participants failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement du participant.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function fetchParticipantProfile(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data: userRow, error: userRowError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userId)
    .single()

  if (userRowError || !userRow) {
    throw userRowError ?? new Error('Utilisateur introuvable.')
  }

  const { data: profileRow, error: profileRowError } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileRowError) {
    throw profileRowError
  }

  const firstName = String((profileRow as any)?.first_name ?? '').trim()
  const lastName = String((profileRow as any)?.last_name ?? '').trim()
  const displayName = `${firstName} ${lastName}`.trim()
  const fallbackName = String(userRow.email ?? '').trim() || 'Utilisateur'
  const avatarUrl = typeof (profileRow as any)?.avatar_url === 'string' ? (profileRow as any).avatar_url : null

  return {
    id: userRow.id,
    name: displayName || fallbackName,
    email: userRow.email,
    role: userRow.role,
    avatar_url: avatarUrl
  }
}
