import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { OrderRepository } from '@/lib/repositories/order-repository'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/vendor/orders/[id]/returns
 * Crée un retour associé à une commande existante appartenant au vendeur authentifié.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const vendorId = await assertVendor(request)
    const orderId = String(params?.id ?? '').trim()

    if (!orderId) {
      return NextResponse.json({ error: 'Identifiant commande manquant.' }, { status: 400 })
    }

    const payload = (await request.json().catch(() => ({}))) as any

    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({ error: 'Les articles retournés sont requis.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: vendorProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorId)
      .maybeSingle()

    const vendorIds = [vendorId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
      vendorIds.push(profileId)
    }

    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .eq('id', orderId)
      .maybeSingle()

    if (orderErr) {
      console.error('❌ POST /api/vendor/orders/[id]/returns: order lookup failed:', orderErr)
      return NextResponse.json({ error: 'Erreur lors de la vérification de la commande.' }, { status: 500 })
    }

    if (!orderRow) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    const orderVendorId = String((orderRow as any)?.vendor_id ?? '')
    if (!vendorIds.includes(orderVendorId)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const order = await OrderRepository.createReturn(
      orderId,
      {
        reason: payload.reason ?? null,
        status: payload.status ?? 'pending',
        resolution: payload.resolution ?? null,
        refundAmount: payload.refundAmount ?? null,
        refundCurrency: payload.refundCurrency ?? null,
        processedAt: payload.processedAt ?? null,
        metadata: payload.metadata ?? {},
        items: payload.items.map((item: any) => ({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          condition: item.condition ?? null,
          refundAmount: item.refundAmount ?? null,
          metadata: item.metadata ?? {}
        }))
      },
      { actorId: vendorId, actorRole: 'vendor' }
    )

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('❌ POST /api/vendor/orders/[id]/returns unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('accès') ? 403 : lower.includes('token') ? 401 : lower.includes('introuvable') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
