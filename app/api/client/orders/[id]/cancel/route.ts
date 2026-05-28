'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Annule une commande client si la livraison n'a pas démarré.
 * Règle:
 * - La commande doit appartenir au client.
 * - La commande ne doit pas déjà être annulée / livrée.
 * - Si une livraison existe et qu'elle est assignée à un livreur (driver_id) ou dispatchée, l'annulation est refusée.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const params = 'params' in context ? await (context as any).params : (context as any)
    const orderId = typeof params?.id === 'string' ? params.id : ''

    if (!orderId) {
      return NextResponse.json({ error: 'Identifiant commande manquant.' }, { status: 400 })
    }

    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select('id, customer_id, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    if (orderRow.customer_id !== userId) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const status = String(orderRow.status ?? 'pending').toLowerCase()
    if (status === 'cancelled') {
      return NextResponse.json({ data: { id: orderId, status: 'cancelled' } }, { status: 200 })
    }

    if (status === 'delivered') {
      return NextResponse.json({ error: 'Impossible d\'annuler une commande déjà livrée.' }, { status: 409 })
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

    const deliveryStarted = Boolean(driverId) || Boolean(dispatchedAt) || ['dispatched', 'in_transit', 'shipped', 'delivered'].includes(deliveryStatus)

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
      .eq('customer_id', userId)

    if (updateErr) {
      console.error('❌ Annulation commande update failed:', updateErr)
      return NextResponse.json({ error: 'Impossible d\'annuler la commande.' }, { status: 500 })
    }

    return NextResponse.json({ data: { id: orderId, status: 'cancelled' } }, { status: 200 })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    console.error('❌ POST /api/client/orders/[id]/cancel failed:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
