import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { fetchSuperAdminNotificationStats } from '@/app/api/super-admin/_helpers/notifications'

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(120).optional()
})

/**
 * GET /api/super-admin/notifications/stats
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const days = parsed.data.days ?? 14
    const data = await fetchSuperAdminNotificationStats(days)

    return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('GET /api/super-admin/notifications/stats failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
