'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/vendor/invoices/export?format=csv
 * Exporte une liste de "factures" (CSV) côté vendeur, basée sur les commandes payées.
 * Note: ce endpoint ne persiste pas de facture en base, il génère un export data-driven.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorUserId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const format = (url.searchParams.get('format') || 'csv').toLowerCase()

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Format non supporté.' }, { status: 400 })
    }

    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorUserId)
      .maybeSingle()

    if (vendorProfileError) {
      console.warn('⚠️ GET /api/vendor/invoices/export: user_profiles lookup failed:', vendorProfileError)
    }

    const vendorIds = [vendorUserId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorUserId) {
      vendorIds.push(profileId)
    }

    const paidLikeStatuses = ['paid', 'succeeded', 'success', 'completed', 'complete']

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_amount, currency, payment_status, created_at, vendor_id')
      .in('vendor_id', vendorIds as any)
      .in('payment_status', paidLikeStatuses as any)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (ordersErr) {
      console.error('❌ GET /api/vendor/invoices/export: orders fetch failed:', ordersErr)
      return NextResponse.json({ error: 'Impossible de charger les commandes payées.' }, { status: 500 })
    }

    const rows = Array.isArray(orders) ? orders : []

    const escapeCsv = (value: unknown) => {
      const s = String(value ?? '')
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    const csvLines = [
      'Factures (export)',
      'order_id,order_number,customer_name,total_amount,currency,created_at,pdf_url'
    ]

    for (const o of rows) {
      const id = String((o as any)?.id ?? '')
      const orderNumber = (o as any)?.order_number ?? ''
      const customerName = (o as any)?.customer_name ?? ''
      const totalAmount = Number((o as any)?.total_amount ?? 0)
      const currency = (o as any)?.currency ?? 'XOF'
      const createdAt = (o as any)?.created_at ?? ''
      const pdfUrl = id ? `/api/vendor/invoices/${id}` : ''

      csvLines.push(
        [
          escapeCsv(id),
          escapeCsv(orderNumber),
          escapeCsv(customerName),
          escapeCsv(totalAmount),
          escapeCsv(currency),
          escapeCsv(createdAt),
          escapeCsv(pdfUrl)
        ].join(',')
      )
    }

    const csvContent = csvLines.join('\n')
    const dateLabel = new Date().toISOString().split('T')[0]

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="factures_${dateLabel}.csv"`,
        'cache-control': 'no-store'
      }
    })
  } catch (err) {
    console.error('❌ GET /api/vendor/invoices/export failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('token') ? 401 : message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
