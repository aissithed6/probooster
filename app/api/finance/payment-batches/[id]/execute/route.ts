import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Exécute un lot: passe le lot en processing puis completed, approuve les demandes du lot,
 * et enregistre des flux sortants dans la trésorerie.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await assertSuperAdmin(req)
  const { id } = params
  const supabase = getSupabaseAdmin()

  const nowIso = new Date().toISOString()

  // Vérifier le lot
  const { data: batch, error: bErr } = await supabase
    .from('finance_payment_batches')
    .select('*')
    .eq('id', id)
    .single()
  if (bErr || !batch) return NextResponse.json({ error: bErr?.message || 'Lot introuvable' }, { status: bErr ? 500 : 404 })

  // Passer le lot en processing
  await supabase
    .from('finance_payment_batches')
    .update({ status: 'processing' })
    .eq('id', id)

  // Récupérer les demandes du lot
  const { data: requests, error: rErr } = await supabase
    .from('finance_payment_requests')
    .select('*')
    .eq('batch_id', id)
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  // Mettre à jour chaque demande et enregistrer cashflow + événement
  let total = 0
  for (const r of requests ?? []) {
    total += Number(r.net_amount || 0)
  }

  // MAJ en masse des demandes
  await supabase
    .from('finance_payment_requests')
    .update({ status: 'approved', processed_at: nowIso })
    .eq('batch_id', id)

  // Evénements + cashflow par requête (séquentiel pour simplicité)
  for (const r of requests ?? []) {
    await supabase.from('finance_payment_request_events').insert({
      request_id: r.id,
      label: 'Payé par lot',
      actor: 'batch',
      occurred_at: nowIso
    })
    await supabase.from('finance_cash_flow').insert({
      direction: 'out',
      category: 'payout',
      label: `Paiement ${r.vendor_name ?? ''}`.trim(),
      amount: Number(r.net_amount || 0),
      occurred_at: nowIso
    })
  }

  // Finaliser le lot
  await supabase
    .from('finance_payment_batches')
    .update({ status: 'completed', executed_at: nowIso, total_amount: total })
    .eq('id', id)

  return NextResponse.json({ success: true, id, total })
}
