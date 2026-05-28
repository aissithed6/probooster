import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

import { getSupabaseAdmin } from '@/lib/supabase'

const unauthorized = () => NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })

/**
 * Retourne un ID destinataire "admin" (priorité au super_admin) pour la messagerie interne.
 * Objectif: permettre aux clients/vendeurs d'envoyer/répondre à l'équipe admin sans hardcoder "admin-id".
 */
export async function GET() {
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

  // Priorité: super_admin, sinon admin
  const { data, error } = await supabase
    .from('users')
    .select('id, role')
    .in('role', ['super_admin', 'admin'])
    .order('role', { ascending: true })
    .limit(10)

  if (error) {
    console.error('GET /api/internal-messaging/admin-recipient failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération du destinataire admin.' }, { status: 500 })
  }

  const rows = (data ?? []) as Array<{ id: string; role: string | null }>

  const superAdmin = rows.find((r) => r.role === 'super_admin')
  const admin = rows.find((r) => r.role === 'admin')
  const superAdminId = superAdmin?.id ?? null
  const adminId = admin?.id ?? null
  const recipientId = superAdminId ?? adminId ?? null

  if (!recipientId) {
    return NextResponse.json({ error: 'Aucun admin disponible.' }, { status: 404 })
  }

  return NextResponse.json({ data: { recipientId, adminId, superAdminId } })
}
