import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function toInt(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

/**
 * GET /api/vendor/orders/returns
 * Liste des retours du vendeur authentifié (persisté DB).
 */
export async function GET(request: NextRequest) {
  try {
    const vendorUserId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const status = url.searchParams.get('status')?.trim() || ''
    const limit = Math.min(200, Math.max(1, toInt(url.searchParams.get('limit'), 50)))

    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorUserId)
      .maybeSingle()

    if (vendorProfileError) {
      console.warn('⚠️ GET /api/vendor/orders/returns: user_profiles lookup failed:', vendorProfileError)
    }

    const vendorIds = [vendorUserId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorUserId) {
      vendorIds.push(profileId)
    }

    let query = supabase
      .from('order_returns')
      .select(
        `
        id,
        order_id,
        customer_id,
        vendor_id,
        status,
        reason,
        resolution,
        refund_amount,
        refund_currency,
        requested_at,
        processed_at,
        metadata,
        order_return_items (
          id,
          return_id,
          order_item_id,
          quantity,
          condition,
          refund_amount,
          metadata
        )
      `
      )
      .in('vendor_id', vendorIds as any)
      .order('requested_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ GET /api/vendor/orders/returns failed:', error)
      return NextResponse.json({ error: 'Impossible de récupérer les retours.' }, { status: 500 })
    }

    return NextResponse.json({ data: Array.isArray(data) ? data : [] }, { status: 200 })
  } catch (err) {
    console.error('❌ GET /api/vendor/orders/returns unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('token') ? 401 : message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
