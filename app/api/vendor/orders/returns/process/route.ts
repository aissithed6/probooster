import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/vendor/orders/returns/process
 * Traite (en masse) les retours du vendeur.
 * Par défaut: passe les retours `pending` à `in_progress` (ou statut fourni).
 */
export async function POST(request: NextRequest) {
  try {
    const vendorUserId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const payload = (await request.json().catch(() => ({}))) as any
    const fromStatus = typeof payload?.fromStatus === 'string' ? payload.fromStatus.trim() : 'pending'
    const toStatus = typeof payload?.toStatus === 'string' ? payload.toStatus.trim() : 'in_progress'

    const { data: vendorProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorUserId)
      .maybeSingle()

    const vendorIds = [vendorUserId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorUserId) {
      vendorIds.push(profileId)
    }

    // Sélectionne les retours concernés
    const { data: returnsRows, error: returnsError } = await supabase
      .from('order_returns')
      .select('id')
      .in('vendor_id', vendorIds as any)
      .eq('status', fromStatus)
      .limit(500)

    if (returnsError) {
      console.error('❌ returns lookup failed:', returnsError)
      return NextResponse.json({ error: 'Impossible de récupérer les retours à traiter.' }, { status: 500 })
    }

    const ids = (returnsRows ?? []).map((r: any) => r?.id).filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ data: { updated: 0 } }, { status: 200 })
    }

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('order_returns')
      .update({ status: toStatus, processed_at: now } as any)
      .in('id', ids as any)
      .in('vendor_id', vendorIds as any)

    if (updateError) {
      console.error('❌ returns update failed:', updateError)
      return NextResponse.json({ error: 'Impossible de traiter les retours.' }, { status: 500 })
    }

    return NextResponse.json({ data: { updated: ids.length } }, { status: 200 })
  } catch (err) {
    console.error('❌ POST /api/vendor/orders/returns/process failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('token') ? 401 : message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
