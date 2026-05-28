import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Approuve une demande de paiement: met à jour le statut et journalise l’événement.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await assertSuperAdmin(_req)
  const { id } = params
  const supabase = getSupabaseAdmin()

  const processedAt = new Date().toISOString()

  const { error: upErr, data: updated } = await supabase
    .from('finance_payment_requests')
    .update({ status: 'approved', processed_at: processedAt })
    .eq('id', id)
    .select('id, vendor_name, net_amount')
    .single()

  if (upErr || !updated) {
    return NextResponse.json({ error: upErr?.message || 'Demande introuvable' }, { status: upErr ? 500 : 404 })
  }

  await supabase.from('finance_payment_request_events').insert({
    request_id: id,
    label: 'Approuvée',
    actor: 'admin',
    occurred_at: processedAt
  })

  // Enregistre un flux sortant dans la trésorerie pour refléter le versement individuel
  try {
    await supabase.from('finance_cash_flow').insert({
      direction: 'out',
      category: 'payout',
      label: `Paiement ${((updated as any)?.vendor_name ?? '')}`.trim(),
      amount: Number(((updated as any)?.net_amount) || 0),
      occurred_at: processedAt
    })
  } catch (e) {
    // On journalise seulement: ne pas bloquer l'approbation en cas d'erreur trésorerie
    console.error('Insertion cash_flow (approbation individuelle) échouée:', e)
  }

  return NextResponse.json({ success: true, id })
}
