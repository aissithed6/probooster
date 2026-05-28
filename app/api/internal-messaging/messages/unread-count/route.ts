import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

const buildUnauthorizedResponse = () =>
  NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })

export async function GET() {
  const cookieStore = await cookies()
  const headerList = await headers()

  const cookieToken = cookieStore.get('sb-access-token')?.value
  const authHeader = headerList.get('authorization') || headerList.get('Authorization')
  const headerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim() || null
    : null

  const accessToken = cookieToken ?? headerToken

  if (!accessToken) {
    return buildUnauthorizedResponse()
  }

  const supabase = getSupabaseAdmin()
  const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken)

  if (userError || !userResult?.user) {
    return buildUnauthorizedResponse()
  }

  const currentUserId = userResult.user.id

  const { count, error } = await supabase
    .from('user_messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', currentUserId)
    .eq('is_read', false)
    .eq('status', 'active')

  if (error) {
    console.error('GET /api/internal-messaging/messages/unread-count failed:', error)
    return NextResponse.json({ error: 'Erreur lors du comptage des messages.' }, { status: 500 })
  }

  return NextResponse.json({ data: count ?? 0 })
}
