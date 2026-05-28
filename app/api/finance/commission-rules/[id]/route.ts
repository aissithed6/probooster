import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * Met à jour une règle de commission existante.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await assertSuperAdmin(req)
  const { id } = params
  const payload = (await req.json().catch(() => null)) as any
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }
  const supabase = getSupabaseAdmin()

  const updates = {
    scope: payload.scope,
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
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Règle introuvable' }, { status: error ? 500 : 404 })
  }

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
