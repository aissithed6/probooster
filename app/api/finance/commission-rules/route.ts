import { NextResponse, NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('finance_commission_rules')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message || 'Impossible de charger les règles.' }, { status: 500 })
    }
    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      scope: r.scope,
      vendorId: r.vendor_id ?? undefined,
      groupName: r.group_name ?? undefined,
      basePercent: r.base_percent != null ? Number(r.base_percent) : undefined,
      baseAmount: r.base_amount != null ? Number(r.base_amount) : undefined,
      hybridPercent: r.hybrid_percent != null ? Number(r.hybrid_percent) : undefined,
      hybridAmount: r.hybrid_amount != null ? Number(r.hybrid_amount) : undefined,
      updatedAt: r.updated_at
    }))
    return NextResponse.json(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  await assertSuperAdmin(req)
  const payload = (await req.json().catch(() => null)) as any
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }
  const supabase = getSupabaseAdmin()
  const insertData = {
    scope: payload.scope ?? 'global',
    vendor_id: payload.vendorId ?? null,
    group_name: payload.groupName ?? null,
    base_percent: payload.basePercent != null ? Number(payload.basePercent) : null,
    base_amount: payload.baseAmount != null ? Number(payload.baseAmount) : null,
    hybrid_percent: payload.hybridPercent != null ? Number(payload.hybridPercent) : null,
    hybrid_amount: payload.hybridAmount != null ? Number(payload.hybridAmount) : null,
    updated_at: new Date().toISOString()
  }
  const { data, error } = await supabase
    .from('finance_commission_rules')
    .insert(insertData)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const res = {
    id: data.id,
    scope: data.scope,
    vendorId: data.vendor_id ?? undefined,
    groupName: data.group_name ?? undefined,
    basePercent: data.base_percent != null ? Number(data.base_percent) : undefined,
    baseAmount: data.base_amount != null ? Number(data.base_amount) : undefined,
    hybridPercent: data.hybrid_percent != null ? Number(data.hybrid_percent) : undefined,
    hybridAmount: data.hybrid_amount != null ? Number(data.hybrid_amount) : undefined,
    updatedAt: data.updated_at
  }
  return NextResponse.json(res)
}
