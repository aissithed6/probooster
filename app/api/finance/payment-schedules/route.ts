import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

type CommissionRuleRow = {
  id: string
  scope: 'global' | 'vendor' | 'group'
  vendor_id: string | null
  group_name: string | null
  base_percent: number | null
  base_amount: number | null
  hybrid_percent: number | null
  hybrid_amount: number | null
  updated_at: string
}

/** Calcule un montant de commission selon une règle, borné à [0, total]. */
function computeCommissionAmount(params: { totalAmount: number; rule: CommissionRuleRow | null }): number {
  const total = Number.isFinite(params.totalAmount) ? Math.max(0, params.totalAmount) : 0
  const rule = params.rule
  if (!rule || total <= 0) return 0

  const useHybrid = rule.hybrid_percent != null || rule.hybrid_amount != null
  const percent = useHybrid ? Number(rule.hybrid_percent ?? 0) : Number(rule.base_percent ?? 0)
  const fixed = useHybrid ? Number(rule.hybrid_amount ?? 0) : Number(rule.base_amount ?? 0)

  const percentSafe = Number.isFinite(percent) ? percent : 0
  const fixedSafe = Number.isFinite(fixed) ? fixed : 0
  const byPercent = total * (Math.max(0, percentSafe) / 100)
  const raw = byPercent + Math.max(0, fixedSafe)
  const commission = Number.isFinite(raw) ? raw : 0

  return Math.min(total, Math.max(0, commission))
}

type PaymentScheduleRow = {
  id: string
  vendor_id: string
  order_id: string
  customer_name: string | null
  amount: number
  due_date: string
  priority: string | null
  status: string | null
  notification_method: string | null
  reminder_frequency: string | null
  created_at: string
  updated_at: string | null
}

type CreatePaymentSchedulesPayload = {
  orderIds?: string[]
  dueDate?: string
  priority?: string
  notificationMethod?: string
  reminderFrequency?: string
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function normalizeDateOnly(value?: string): string | null {
  if (!value) return null
  const raw = String(value).trim()
  if (!raw) return null
  // Attend un format YYYY-MM-DD (HTML date input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // Fallback: convertit ISO vers date
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * GET /api/finance/payment-schedules?mine=true
 * Liste les paiements planifiés du vendeur connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const mine = url.searchParams.get('mine')
    const all = url.searchParams.get('all')

    if (mine !== 'true' && all !== 'true') {
      return NextResponse.json({ error: 'Paramètre mine=true ou all=true requis.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    if (all === 'true') {
      await assertSuperAdmin(request)

      const { data, error } = await supabase
        .from('finance_payment_schedules')
        .select('*')
        .order('due_date', { ascending: true })
        .limit(2000)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const rows = (data ?? []) as PaymentScheduleRow[]
      return NextResponse.json(
        rows.map((r) => ({
          id: r.id,
          vendorId: r.vendor_id,
          orderId: r.order_id,
          customerName: r.customer_name ?? 'Client',
          amount: toNumber(r.amount),
          dueDate: r.due_date,
          priority: r.priority ?? 'Normale',
          status: r.status ?? 'scheduled',
          notificationMethod: r.notification_method ?? 'email',
          reminderFrequency: r.reminder_frequency ?? 'weekly',
          createdAt: r.created_at,
          updatedAt: r.updated_at ?? undefined
        }))
      )
    }

    const vendorId = await assertVendor(request)

    const { data, error } = await supabase
      .from('finance_payment_schedules')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('due_date', { ascending: true })
      .limit(500)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data ?? []) as PaymentScheduleRow[]

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        vendorId: r.vendor_id,
        orderId: r.order_id,
        customerName: r.customer_name ?? 'Client',
        amount: toNumber(r.amount),
        dueDate: r.due_date,
        priority: r.priority ?? 'Normale',
        status: r.status ?? 'scheduled',
        notificationMethod: r.notification_method ?? 'email',
        reminderFrequency: r.reminder_frequency ?? 'weekly',
        createdAt: r.created_at,
        updatedAt: r.updated_at ?? undefined
      }))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * POST /api/finance/payment-schedules
 * Crée des paiements planifiés pour les commandes sélectionnées (vendeur connecté).
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const payload = (await request.json().catch(() => ({}))) as CreatePaymentSchedulesPayload
    const orderIds = Array.isArray(payload?.orderIds)
      ? payload.orderIds.map((x) => String(x)).map((x) => x.trim()).filter((x) => x.length > 0)
      : []

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'Aucune commande fournie.' }, { status: 400 })
    }

    const dueDate = normalizeDateOnly(payload?.dueDate)
    if (!dueDate) {
      return NextResponse.json({ error: "Date d'échéance invalide." }, { status: 400 })
    }

    const priority = payload?.priority ? String(payload.priority) : 'Normale'
    const notificationMethod = payload?.notificationMethod ? String(payload.notificationMethod) : 'email'
    const reminderFrequency = payload?.reminderFrequency ? String(payload.reminderFrequency) : 'weekly'

    // Charge les commandes pour calculer le montant (net) et récupérer le nom client.
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, vendor_id, customer_name, final_total, total_amount')
      .in('id', orderIds as any)
      .limit(500)

    if (ordersErr) {
      return NextResponse.json({ error: 'Impossible de charger les commandes.' }, { status: 500 })
    }

    const rows = Array.isArray(orders) ? orders : []
    const vendorOrders = rows.filter((o: any) => String(o?.vendor_id ?? '') === vendorId)

    if (vendorOrders.length === 0) {
      return NextResponse.json({ error: 'Aucune commande valide pour ce vendeur.' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const globalRuleCache: { rule: CommissionRuleRow | null; loaded: boolean } = { rule: null, loaded: false }
    const getRuleForVendor = async (): Promise<CommissionRuleRow | null> => {
      if (globalRuleCache.loaded) return globalRuleCache.rule
      const { data: vendorRule } = await supabase
        .from('finance_commission_rules')
        .select('*')
        .eq('scope', 'vendor')
        .eq('vendor_id', vendorId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (vendorRule) {
        globalRuleCache.rule = vendorRule as any
        globalRuleCache.loaded = true
        return vendorRule as any
      }
      const { data: globalRule } = await supabase
        .from('finance_commission_rules')
        .select('*')
        .eq('scope', 'global')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      globalRuleCache.rule = (globalRule ?? null) as any
      globalRuleCache.loaded = true
      return globalRuleCache.rule
    }

    const rule = await getRuleForVendor()
    const insertRows = vendorOrders.map((o: any) => {
      const gross = o?.final_total != null ? o.final_total : o?.total_amount
      const totalAmount = toNumber(gross)
      const commission = computeCommissionAmount({ totalAmount, rule })
      const netAmount = Math.max(0, totalAmount - commission)

      return {
        vendor_id: vendorId,
        order_id: String(o?.id ?? ''),
        customer_name: o?.customer_name ? String(o.customer_name) : null,
        amount: netAmount,
        due_date: dueDate,
        priority,
        status: 'scheduled',
        notification_method: notificationMethod,
        reminder_frequency: reminderFrequency,
        created_at: now,
        updated_at: now
      }
    })

    const { data: created, error: insertErr } = await supabase
      .from('finance_payment_schedules')
      .upsert(insertRows, { onConflict: 'vendor_id,order_id' })
      .select('*')

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message || 'Création échouée.' }, { status: 500 })
    }

    const createdRows = (created ?? []) as PaymentScheduleRow[]

    return NextResponse.json(
      createdRows.map((r) => ({
        id: r.id,
        vendorId: r.vendor_id,
        orderId: r.order_id,
        customerName: r.customer_name ?? 'Client',
        amount: toNumber(r.amount),
        dueDate: r.due_date,
        priority: r.priority ?? 'Normale',
        status: r.status ?? 'scheduled',
        notificationMethod: r.notification_method ?? 'email',
        reminderFrequency: r.reminder_frequency ?? 'weekly',
        createdAt: r.created_at,
        updatedAt: r.updated_at ?? undefined
      }))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
