import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type ActionName =
  | 'send_reminder'
  | 'mark_priority'
  | 'archive_request'
  | 'duplicate_request'
  | 'delete_request'
  | 'customer_validation_request'
  | 'bulk_apply'
  | 'sync_now'

function normalizeAction(value: unknown): ActionName | null {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!raw) return null

  const allowed: ActionName[] = [
    'send_reminder',
    'mark_priority',
    'archive_request',
    'duplicate_request',
    'delete_request',
    'customer_validation_request',
    'bulk_apply',
    'sync_now'
  ]

  return allowed.includes(raw as ActionName) ? (raw as ActionName) : null
}

/**
 * POST /api/vendor/orders/[id]/actions
 * Enregistre une action vendeur de manière persistée (order_status_history).
 * Important: certaines actions (suppression/duplication/archivage) sont traitées comme "demande" afin d'éviter des opérations destructrices côté vendeur.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const vendorUserId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const params = 'params' in context ? await (context as any).params : (context as any)
    const orderId = typeof params?.id === 'string' ? params.id : ''
    if (!orderId) {
      return NextResponse.json({ error: 'Identifiant commande manquant.' }, { status: 400 })
    }

    const payload = (await request.json().catch(() => ({}))) as any
    const action = normalizeAction(payload?.action)
    const message = typeof payload?.message === 'string' ? payload.message.trim() : ''

    if (!action) {
      return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
    }

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

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .select('id, vendor_id, status, payment_status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !orderRow) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    const orderVendorId = String((orderRow as any)?.vendor_id ?? '')
    if (!vendorIds.includes(orderVendorId)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const commentBase =
      action === 'send_reminder'
        ? 'Rappel envoyé au client'
        : action === 'mark_priority'
          ? 'Commande marquée prioritaire'
        : action === 'archive_request'
            ? 'Demande d’archivage'
          : action === 'duplicate_request'
            ? 'Demande de duplication'
          : action === 'delete_request'
            ? 'Demande de suppression'
            : action === 'bulk_apply'
              ? 'Action en lot appliquée'
              : action === 'sync_now'
                ? 'Synchronisation demandée'
                : 'Demande de validation client'

    const comment = message ? `${commentBase}: ${message}` : commentBase

    const previousStatus = typeof (orderRow as any)?.status === 'string' ? String((orderRow as any).status) : null
    const previousPayment = typeof (orderRow as any)?.payment_status === 'string' ? String((orderRow as any).payment_status) : null

    const { error: historyError } = await supabase.from('order_status_history').insert({
      order_id: orderId,
      actor_id: vendorUserId,
      actor_role: 'vendor',
      previous_status: previousStatus,
      new_status: previousStatus,
      previous_payment_status: previousPayment,
      new_payment_status: previousPayment,
      previous_fulfillment_status: null,
      new_fulfillment_status: null,
      comment,
      metadata: { action }
    } as any)

    if (historyError) {
      console.error('❌ POST /api/vendor/orders/[id]/actions history insert failed:', historyError)
      return NextResponse.json({ error: "Impossible d'enregistrer l'action." }, { status: 500 })
    }

    return NextResponse.json({ data: { orderId, action } }, { status: 200 })
  } catch (err) {
    console.error('❌ POST /api/vendor/orders/[id]/actions failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('token') ? 401 : message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
