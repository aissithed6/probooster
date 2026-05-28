'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/vendor/invoices/list
 * Retourne une liste JSON de factures (virtuelles) pour le vendeur connecté.
 * Objectif: alimenter la modale PDF côté UI de manière robuste (sans parsing CSV).
 */
export async function GET(request: NextRequest) {
  try {
    const vendorUserId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorUserId)
      .maybeSingle()

    if (vendorProfileError) {
      console.warn('⚠️ GET /api/vendor/invoices/list: user_profiles lookup failed:', vendorProfileError)
    }

    const vendorIds = [vendorUserId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorUserId) {
      vendorIds.push(profileId)
    }

    const paidLikeStatuses = ['paid', 'succeeded', 'success', 'completed', 'complete']

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, currency, created_at, vendor_id, payment_status, status')
      .in('vendor_id', vendorIds as any)
      .in('payment_status', paidLikeStatuses as any)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (ordersErr) {
      console.error('❌ GET /api/vendor/invoices/list: orders fetch failed:', ordersErr)
      return NextResponse.json({ error: 'Impossible de charger les commandes.' }, { status: 500 })
    }

    const rows = Array.isArray(orders) ? orders : []

    return NextResponse.json(
      rows.map((o: any) => {
        const id = String(o?.id ?? '')
        return {
          orderId: id,
          orderNumber: String(o?.order_number ?? ''),
          customerName: String(o?.customer_name ?? 'Client'),
          amount: Number(o?.total_amount ?? 0),
          currency: String(o?.currency ?? 'XOF'),
          createdAt: String(o?.created_at ?? ''),
          paymentStatus: String(o?.payment_status ?? ''),
          status: String(o?.status ?? ''),
          pdfUrl: id ? `/api/vendor/invoices/${id}` : ''
        }
      })
    )
  } catch (err) {
    console.error('❌ GET /api/vendor/invoices/list failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('token') ? 401 : message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
