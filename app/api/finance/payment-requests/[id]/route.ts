import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Supprime (soft delete) une demande de paiement: statut 'deleted' + journalisation.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertSuperAdmin(_req)
    const { id } = params
    const supabase = getSupabaseAdmin()
    const processedAt = new Date().toISOString()

    const { error: upErr, data: updated } = await supabase
      .from('finance_payment_requests')
      .update({ status: 'deleted', processed_at: processedAt })
      .eq('id', id)
      .select('id')
      .single()

    if (upErr || !updated) {
      return NextResponse.json({ error: upErr?.message || 'Demande introuvable' }, { status: upErr ? 500 : 404 })
    }

    await supabase.from('finance_payment_request_events').insert({
      request_id: id,
      label: 'Supprimée',
      actor: 'admin',
      occurred_at: processedAt
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
