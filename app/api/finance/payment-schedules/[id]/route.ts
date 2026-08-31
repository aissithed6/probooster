import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { assertVendorOrSuperAdmin } from '@/app/api/vendor/_helpers/auth'

type UpdatePaymentSchedulePayload = {
  dueDate?: string
  priority?: string
  notificationMethod?: string
  reminderFrequency?: string
  status?: string
}

function normalizeDateOnly(value?: string): string | null {
  if (!value) return null
  const raw = String(value).trim()
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

/**
 * PUT /api/finance/payment-schedules/[id]
 * Met à jour une entrée de planification appartenant au vendeur connecté.
 */
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const vendorId = await assertVendorOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const params = await ctx.params
    const id = String(params?.id ?? '').trim()

    if (!id) {
      return NextResponse.json({ error: 'ID manquant.' }, { status: 400 })
    }

    const payload = (await request.json().catch(() => ({}))) as UpdatePaymentSchedulePayload

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    const dueDate = normalizeDateOnly(payload?.dueDate)
    if (payload?.dueDate != null && !dueDate) {
      return NextResponse.json({ error: "Date d'échéance invalide." }, { status: 400 })
    }

    if (dueDate) patch.due_date = dueDate
    if (payload?.priority != null) patch.priority = String(payload.priority)
    if (payload?.notificationMethod != null) patch.notification_method = String(payload.notificationMethod)
    if (payload?.reminderFrequency != null) patch.reminder_frequency = String(payload.reminderFrequency)
    if (payload?.status != null) patch.status = String(payload.status)

    const { data, error } = await supabase
      .from('finance_payment_schedules')
      .update(patch)
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .select('*')
      .single()

    if (error || !data) {
      const message = error?.message || 'Mise à jour échouée.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const row = data as any

    return NextResponse.json({
      id: row.id,
      vendorId: row.vendor_id,
      orderId: row.order_id,
      customerName: row.customer_name ?? 'Client',
      amount: toNumber(row.amount),
      dueDate: row.due_date,
      priority: row.priority ?? 'Normale',
      status: row.status ?? 'scheduled',
      notificationMethod: row.notification_method ?? 'email',
      reminderFrequency: row.reminder_frequency ?? 'weekly',
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? undefined
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
