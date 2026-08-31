import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { assertVendorOrSuperAdmin } from '@/app/api/vendor/_helpers/auth'

function asCsvValue(value: unknown): string {
  const raw = value == null ? '' : String(value)
  const escaped = raw.replace(/"/g, '""')
  return `"${escaped}"`
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

/**
 * GET /api/finance/payment-schedules/export?mine=true&format=csv
 * Export CSV des paiements planifiés du vendeur connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const mine = url.searchParams.get('mine')
    const format = url.searchParams.get('format') ?? 'csv'

    if (mine !== 'true') {
      return NextResponse.json({ error: 'Paramètre mine=true requis.' }, { status: 400 })
    }

    if (format !== 'csv') {
      return NextResponse.json({ error: 'Format non supporté (csv uniquement).' }, { status: 400 })
    }

    const vendorId = await assertVendorOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('finance_payment_schedules')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('due_date', { ascending: true })
      .limit(5000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data ?? []) as any[]

    const headers = [
      'ID',
      'Commande',
      'Client',
      'Montant',
      "Date d'échéance",
      'Priorité',
      'Statut',
      'Méthode de notification',
      'Fréquence de rappel',
      'Créé le'
    ]

    const csvLines = [headers.map(asCsvValue).join(',')]

    for (const r of rows) {
      csvLines.push(
        [
          asCsvValue(r.id),
          asCsvValue(r.order_id),
          asCsvValue(r.customer_name ?? 'Client'),
          asCsvValue(toNumber(r.amount)),
          asCsvValue(r.due_date),
          asCsvValue(r.priority ?? 'Normale'),
          asCsvValue(r.status ?? 'scheduled'),
          asCsvValue(r.notification_method ?? 'email'),
          asCsvValue(r.reminder_frequency ?? 'weekly'),
          asCsvValue(r.created_at)
        ].join(',')
      )
    }

    const csv = csvLines.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="planification_paiements_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
