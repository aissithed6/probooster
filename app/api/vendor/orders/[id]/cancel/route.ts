'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/vendor/orders/[id]/cancel
 * Annule une commande côté vendeur (sans suppression).
 * Règles:
 * - La commande doit appartenir au vendeur authentifié.
 * - La commande ne doit pas déjà être annulée / livrée.
 * - Si une livraison existe et qu'elle est assignée à un livreur (driver_id) ou dispatchée, l'annulation est refusée.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const params = 'params' in context ? await (context as any).params : (context as any)
    const orderId = typeof params?.id === 'string' ? params.id : ''

    if (!orderId) {
      return NextResponse.json({ error: 'Identifiant commande manquant.' }, { status: 400 })
    }

    // Certains environnements stockent vendor_id avec l'id profile; on accepte les deux.
    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorId)
      .maybeSingle()

    if (vendorProfileError) {
      console.warn('⚠️ POST /api/vendor/orders/[id]/cancel: user_profiles lookup failed:', vendorProfileError)
    }

    const vendorIds = [vendorId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
      vendorIds.push(profileId)
    }

    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select('id, vendor_id, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    const orderVendorId = String((orderRow as any)?.vendor_id ?? '')
    if (!vendorIds.includes(orderVendorId)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const status = String((orderRow as any)?.status ?? 'pending').toLowerCase()
    if (status === 'cancelled') {
      return NextResponse.json({ data: { id: orderId, status: 'cancelled' } }, { status: 200 })
    }

    if (status === 'delivered') {
      return NextResponse.json({ error: "Impossible d'annuler une commande déjà livrée." }, { status: 409 })
    }

    const { data: deliveryRow } = await supabase
      .from('deliveries')
      .select('id, status, driver_id, dispatched_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const deliveryStatus = String((deliveryRow as any)?.status ?? '').toLowerCase()
    const driverId = (deliveryRow as any)?.driver_id
    const dispatchedAt = (deliveryRow as any)?.dispatched_at

    const deliveryStarted =
      Boolean(driverId) ||
      Boolean(dispatchedAt) ||
      ['dispatched', 'in_transit', 'shipped', 'delivered'].includes(deliveryStatus)

    if (deliveryStarted) {
      return NextResponse.json(
        { error: 'Annulation impossible: la livraison a déjà été lancée (commande confiée à un livreur).' },
        { status: 409 }
      )
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() } as any)
      .eq('id', orderId)
      .in('vendor_id', vendorIds as any)

    if (updateErr) {
      console.error('❌ Annulation commande vendeur update failed:', updateErr)
      return NextResponse.json({ error: "Impossible d'annuler la commande." }, { status: 500 })
    }

    return NextResponse.json({ data: { id: orderId, status: 'cancelled' } }, { status: 200 })
  } catch (err) {
    console.error('❌ POST /api/vendor/orders/[id]/cancel failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('token') ? 401 : message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
