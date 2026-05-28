import { NextResponse } from 'next/server'

import { fetchOverviewStats } from '@/app/api/super-admin/_helpers/dashboard'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const userId = await assertSuperAdmin()

    const url = new URL(request.url)
    const debugEnabled = url.searchParams.get('debug') === '1'

    const data = await fetchOverviewStats(userId, { debug: debugEnabled })

    const payload = debugEnabled ? { data } : { data: { ...(data as any), _debug: undefined } }
    const res = NextResponse.json(payload)
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
    return res
  } catch (error) {
    console.error('GET /api/super-admin/overview failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques.' }, { status: 500 })
  }
}
