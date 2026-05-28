import { NextRequest, NextResponse } from 'next/server'

import { fetchRecentActivities } from '@/app/api/super-admin/_helpers/dashboard'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const parsedLimit = limitParam ? Number(limitParam) : undefined
  const limit = parsedLimit && !Number.isNaN(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 20

  try {
    await assertSuperAdmin()
    const data = await fetchRecentActivities(limit)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/super-admin/activities failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des activités.' }, { status: 500 })
  }
}
