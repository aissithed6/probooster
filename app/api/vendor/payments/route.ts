import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { OrderRepository } from '@/lib/repositories/order-repository'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/vendor/payments
 * Retourne les paiements (order_payments) des commandes du vendeur authentifié.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const { data: orderRows, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (orderError) {
      console.error('❌ GET /api/vendor/payments: orders lookup failed:', orderError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des commandes.' }, { status: 500 })
    }

    const orderIds = (orderRows ?? []).map(r => (r as any).id).filter(Boolean)
    if (orderIds.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const { data, error } = await supabase
      .from('order_payments')
      .select('*')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('❌ GET /api/vendor/payments failed:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des paiements.' }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/vendor/payments unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * POST /api/vendor/payments
 * Crée une demande/paiement (order_payments) pour une commande du vendeur authentifié.
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const body = await request.json().catch(() => ({}))
    const orderId = typeof (body as any)?.orderId === 'string' ? (body as any).orderId : ''
    const provider = typeof (body as any)?.provider === 'string' ? (body as any).provider.trim() : ''
    const amount = Number((body as any)?.amount)

    if (!orderId) {
      return NextResponse.json({ error: 'Identifiant commande manquant.' }, { status: 400 })
    }
    if (!provider) {
      return NextResponse.json({ error: 'Le fournisseur de paiement est requis.' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Le montant du paiement est requis.' }, { status: 400 })
    }

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

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    const orderVendorId = String((orderRow as any)?.vendor_id ?? '')
    if (!vendorIds.includes(orderVendorId)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const rawStatus = typeof (body as any)?.status === 'string' ? String((body as any).status) : 'pending'
    const status = rawStatus.trim().length > 0 ? rawStatus : 'pending'

    // Best-effort anti doublon: si un paiement pending existe déjà, on ne réinsère pas.
    if (String(status).toLowerCase() === 'pending') {
      const { data: existingPending } = await supabase
        .from('order_payments')
        .select('id')
        .eq('order_id', orderId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingPending?.id) {
        const refreshed = await OrderRepository.getOrderById(orderId)
        return NextResponse.json({ data: refreshed }, { status: 200 })
      }
    }

    const updatedOrder = await OrderRepository.createPayment(
      orderId,
      {
        provider,
        reference: typeof (body as any)?.reference === 'string' ? (body as any).reference : null,
        amount,
        currency: typeof (body as any)?.currency === 'string' ? (body as any).currency : null,
        status,
        paidAt: typeof (body as any)?.paidAt === 'string' ? (body as any).paidAt : null,
        metadata: (body as any)?.metadata ?? {}
      },
      { actorId: vendorId, actorRole: 'vendor' }
    )

    return NextResponse.json({ data: updatedOrder }, { status: 201 })
  } catch (error) {
    console.error('❌ POST /api/vendor/payments unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('accès') ? 403 : lower.includes('token') ? 401 : lower.includes('introuvable') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
