import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Met à jour un remboursement (status, notes, etc.)
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const payload = (await req.json().catch(() => null)) as any
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const updates: any = {
    status: payload.status,
    resolution_notes: payload.resolutionNotes,
    amount: payload.amount != null ? Number(payload.amount) : undefined,
    commission_adjustment: payload.commissionAdjustment != null ? Number(payload.commissionAdjustment) : undefined,
    updated_at: new Date().toISOString()
  }

  // Nettoyer les undefined pour éviter de les écrire
  Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k])

  const { data, error } = await supabase
    .from('finance_refunds')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Remboursement introuvable' }, { status: error ? 500 : 404 })
  }

  const res = {
    id: data.id,
    orderId: data.order_id,
    vendorId: data.vendor_id,
    vendorName: data.vendor_name ?? undefined,
    customerEmail: data.customer_email ?? undefined,
    amount: Number(data.amount || 0),
    commissionAdjustment: Number(data.commission_adjustment || 0),
    status: data.status,
    openedAt: data.opened_at,
    updatedAt: data.updated_at ?? undefined,
    reason: data.reason ?? undefined,
    resolutionNotes: data.resolution_notes ?? undefined
  }

  return NextResponse.json(res)
}
