import { NextResponse, NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('finance_refund_settings')
      .select('*')
      .limit(1)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const res = {
      autoAdjustCommission: Boolean(data?.auto_adjust_commission),
      notifyVendor: Boolean(data?.notify_vendor),
      escalationEmail: data?.escalation_email ?? '',
      resolutionWindow: Number(data?.resolution_window ?? 7)
    }
    return NextResponse.json(res)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(req: NextRequest) {
  await assertSuperAdmin(req)
  const payload = (await req.json().catch(() => null)) as any
  if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  const supabase = getSupabaseAdmin()

  const updates = {
    auto_adjust_commission: !!payload.autoAdjustCommission,
    notify_vendor: !!payload.notifyVendor,
    escalation_email: payload.escalationEmail ?? '',
    resolution_window: Number(payload.resolutionWindow ?? 7),
    updated_at: new Date().toISOString()
  }

  const { data: existingRow, error: existingErr } = await supabase
    .from('finance_refund_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 })

  const writeQuery = existingRow?.id
    ? supabase.from('finance_refund_settings').update(updates).eq('id', existingRow.id)
    : supabase.from('finance_refund_settings').insert(updates as any)

  const { data, error } = await writeQuery.select('*').limit(1).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const res = {
    autoAdjustCommission: Boolean(data?.auto_adjust_commission),
    notifyVendor: Boolean(data?.notify_vendor),
    escalationEmail: data?.escalation_email ?? '',
    resolutionWindow: Number(data?.resolution_window ?? 7)
  }
  return NextResponse.json(res)
}
