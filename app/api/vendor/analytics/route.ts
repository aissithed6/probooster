import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { buildVendorAnalytics, type VendorAnalyticsPeriod } from '@/lib/vendor-analytics'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function parsePeriod(value: string | null): VendorAnalyticsPeriod {
  if (value === '7d' || value === '30d' || value === '90d' || value === '1y') {
    return value
  }
  return '30d'
}

/**
 * GET /api/vendor/analytics?period=30d
 * Retourne les métriques analytics vendeur synchronisées avec la base de données.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const { searchParams } = new URL(request.url)
    const period = parsePeriod(searchParams.get('period'))

    const supabase = getSupabaseAdmin()
    const data = await buildVendorAnalytics(supabase, vendorId, period)

    return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('token') ? 401 : lower.includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
