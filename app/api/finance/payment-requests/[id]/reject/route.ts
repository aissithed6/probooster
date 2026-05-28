import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Rejette une demande de paiement avec un motif et journalise l’événement.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await assertSuperAdmin(req)
  const { id } = params
  const { reason = '' } = (await req.json().catch(() => ({}))) as { reason?: string }

  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: 'Motif requis' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const processedAt = new Date().toISOString()

  const { error: upErr, data: updated } = await supabase
    .from('finance_payment_requests')
    .update({ status: 'rejected', processed_at: processedAt, notes: reason })
    .eq('id', id)
    .select('id')
    .single()

  if (upErr || !updated) {
    return NextResponse.json({ error: upErr?.message || 'Demande introuvable' }, { status: upErr ? 500 : 404 })
  }

  await supabase.from('finance_payment_request_events').insert({
    request_id: id,
    label: 'Rejetée',
    actor: 'admin',
    occurred_at: processedAt
  })

  return NextResponse.json({ success: true, id })
}
