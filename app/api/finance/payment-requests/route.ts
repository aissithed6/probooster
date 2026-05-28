import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
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

type PayoutSettingsRow = {
  auto_payout: boolean | null
  minimum_threshold: number | null
  primary_validation_day: string | null
  backup_validation_day: string | null
}

/** Calcule un montant de commission selon une règle, borné à [0, total]. */
function computeCommissionAmount(params: { totalAmount: number; rule: CommissionRuleRow | null }): number {
  const total = Number.isFinite(params.totalAmount) ? Math.max(0, params.totalAmount) : 0
  const rule = params.rule
  if (!rule || total <= 0) return 0

  const hybridPercentRaw = Number(rule.hybrid_percent ?? NaN)
  const hybridAmountRaw = Number(rule.hybrid_amount ?? NaN)

  const hasHybridPercent = Number.isFinite(hybridPercentRaw) && hybridPercentRaw > 0
  const hasHybridAmount = Number.isFinite(hybridAmountRaw) && hybridAmountRaw > 0
  const useHybrid = hasHybridPercent || hasHybridAmount

  const percent = useHybrid ? hybridPercentRaw : Number(rule.base_percent ?? 0)
  const fixed = useHybrid ? hybridAmountRaw : Number(rule.base_amount ?? 0)

  const percentSafe = Number.isFinite(percent) ? percent : 0
  const fixedSafe = Number.isFinite(fixed) ? fixed : 0
  const byPercent = total * (Math.max(0, percentSafe) / 100)
  const raw = byPercent + Math.max(0, fixedSafe)
  const commission = Number.isFinite(raw) ? raw : 0

  return Math.min(total, Math.max(0, commission))
}

/** Normalise un nom de jour (fr/en) vers une clé stable (lundi..dimanche). */
function normalizeWeekday(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!raw) return ''

  const frMap: Record<string, string> = {
    lundi: 'lundi',
    mardi: 'mardi',
    mercredi: 'mercredi',
    jeudi: 'jeudi',
    vendredi: 'vendredi',
    samedi: 'samedi',
    dimanche: 'dimanche'
  }

  const enMap: Record<string, string> = {
    monday: 'lundi',
    tuesday: 'mardi',
    wednesday: 'mercredi',
    thursday: 'jeudi',
    friday: 'vendredi',
    saturday: 'samedi',
    sunday: 'dimanche'
  }

  return frMap[raw] ?? enMap[raw] ?? raw
}

/** Détermine le jour courant (lundi..dimanche) en timezone locale serveur. */
function getTodayWeekdayKey(): string {
  const day = new Date().getDay() // 0=dimanche
  const keys = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  return keys[day] ?? ''
}

/** Heuristique livraison requise: option 1 (shipping_address) et option 2 (deliveries existantes). */
function isDeliveryRequiredFromOrder(order: any): boolean {
  const addr = (order as any)?.shipping_address
  const shippingMethodId = (order as any)?.shipping_method_id
  const deliveryId = (order as any)?.delivery_id
  const shippingLat = (order as any)?.shipping_lat
  const shippingLng = (order as any)?.shipping_lng
  const deliveryOption = (order as any)?.delivery_option

  const hasCoords =
    (typeof shippingLat === 'number' && Number.isFinite(shippingLat)) ||
    (typeof shippingLng === 'number' && Number.isFinite(shippingLng))

  const deliveryOptionRaw = typeof deliveryOption === 'string' ? deliveryOption.trim().toLowerCase() : ''
  const deliveryOptionSuggestsDelivery =
    Boolean(deliveryOptionRaw) &&
    (deliveryOptionRaw.includes('deliver') || deliveryOptionRaw.includes('livr') || deliveryOptionRaw.includes('shipping'))

  // Signaux explicites de livraison
  if (shippingMethodId) return true
  if (deliveryId) return true
  if (hasCoords) return true
  if (deliveryOptionSuggestsDelivery) return true

  if (addr == null) return false

  if (typeof addr === 'string') {
    const trimmed = addr.trim()
    if (!trimmed) return false
    if (trimmed === '{}' || trimmed === '[]') return false
    return true
  }

  if (typeof addr === 'object') {
    try {
      const json = JSON.stringify(addr)
      if (!json || json === '{}' || json === '[]') return false
    } catch {
      // Si non sérialisable, on considère qu'il y a une adresse.
    }
    return true
  }

  return Boolean(addr)
}

/**
 * Liste des demandes de paiement depuis la base (avec timeline et user).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const mine = url.searchParams.get('mine')
    let vendorScopeId: string | null = null

    if (mine === 'true') {
      vendorScopeId = await assertVendor(request)
    } else {
      await assertSuperAdmin(request)
    }

    // Support du vendorId + profileId (user_profiles.id), car selon le flux legacy certaines lignes portent l'ID profil.
    const vendorIds: string[] = []
    if (vendorScopeId) {
      vendorIds.push(vendorScopeId)

      const { data: vendorProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', vendorScopeId)
        .maybeSingle()

      const profileId = (vendorProfile as any)?.id
      if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorScopeId) {
        vendorIds.push(profileId)
      }
    }

    let query = supabase
      .from('finance_payment_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (vendorScopeId) {
      query = query.in('vendor_id', vendorIds as any)
    }

    const { data: rows, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message || 'Impossible de charger les demandes.' }, { status: 500 })
    }

    const requests = rows ?? []
    const ids = requests.map((r: any) => r.id)
    const userIds = Array.from(new Set((requests.map((r: any) => r.user_id).filter(Boolean)) as string[]))

    const [{ data: evts }, { data: users }] = await Promise.all([
      ids.length
        ? supabase
            .from('finance_payment_request_events')
            .select('*')
            .in('request_id', ids)
        : Promise.resolve({ data: [] as any[] } as any),
      userIds.length
        ? supabase
            .from('users')
            .select('id, email, name, full_name')
            .in('id', userIds)
        : Promise.resolve({ data: [] as any[] } as any)
    ])

    const userById = new Map<string, any>((users ?? []).map((u: any) => [u.id, u]))
    const eventsByRequest = new Map<string, any[]>()
    ;(evts ?? []).forEach((e: any) => {
      const arr = eventsByRequest.get(e.request_id) ?? []
      arr.push(e)
      eventsByRequest.set(e.request_id, arr)
    })

    const data = requests.map((r: any) => {
      const u = r.user_id ? userById.get(r.user_id) : null
      return {
        id: r.id,
        vendorId: r.vendor_id,
        vendorName: r.vendor_name,
        ordersCount: r.orders_count,
        totalAmount: Number(r.total_amount || 0),
        commissionAmount: Number(r.commission_amount || 0),
        netAmount: Number(r.net_amount || 0),
        status: r.status,
        paymentMethod: r.payment_method,
        bankDetails: r.bank_details ?? undefined,
        mobileNumber: r.mobile_number ?? undefined,
        createdAt: r.created_at,
        processedAt: r.processed_at ?? undefined,
        notes: r.notes ?? undefined,
        executionType: r.execution_type ?? undefined,
        scheduleDate: r.schedule_date ?? undefined,
        batchId: r.batch_id ?? undefined,
        payoutWindow: r.payout_window ?? undefined,
        user: u
          ? { id: u.id, fullName: u.full_name || u.name || (u.email ? u.email.split('@')[0] : ''), email: u.email }
          : undefined,
        timeline: (eventsByRequest.get(r.id) ?? [])
          .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
          .map((e: any) => ({ id: e.id, label: e.label, actor: e.actor, occurredAt: e.occurred_at }))
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

type PaymentRequestCreatePayload = {
  orderIds?: string[]
  requestedAmount?: number | null
  paymentMethod?: string
  bankDetails?: unknown
  mobileNumber?: string
  notes?: string
  executionType?: string
  scheduleDate?: string
  payoutWindow?: string
}

/**
 * Crée une demande de paiement vendeur à partir d'une liste de commandes.
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const debugEnabled = url.searchParams.get('debug') === '1'

    // Même logique vendorIds que le dashboard (userId + profileId), pour prendre en compte les commandes legacy.
    const vendorIds: string[] = [vendorId]
    const { data: vendorProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorId)
      .maybeSingle()

    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
      vendorIds.push(profileId)
    }

    const payload = (await request.json().catch(() => ({}))) as PaymentRequestCreatePayload
    const orderIds = Array.isArray(payload?.orderIds)
      ? payload.orderIds.map((x) => String(x)).filter((x) => x.trim().length > 0)
      : []

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'Aucune commande fournie.' }, { status: 400 })
    }

    const requestedOrderIdSet = new Set(orderIds.map((x) => x.trim()).filter((x) => x.length > 0))

    const { data: pendingRows, error: pendingErr } = await supabase
      .from('finance_payment_requests')
      .select('id, order_ids')
      .in('vendor_id', vendorIds as any)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50)

    if (pendingErr) {
      console.error('❌ POST /api/finance/payment-requests: pending requests lookup failed:', pendingErr)
      const pendingErrMessage = String((pendingErr as any)?.message ?? '')
      if ((pendingErr as any)?.code === '42703' && pendingErrMessage.toLowerCase().includes('order_ids')) {
        return NextResponse.json(
          {
            error:
              "Schéma incomplet: la table finance_payment_requests ne contient pas la colonne order_ids. Ajoutez-la pour permettre les demandes de paiement.",
            fix:
              "ALTER TABLE public.finance_payment_requests ADD COLUMN IF NOT EXISTS order_ids jsonb NOT NULL DEFAULT '[]'::jsonb;"
          },
          { status: 500 }
        )
      }
      const details = {
        code: String((pendingErr as any)?.code ?? ''),
        message: String((pendingErr as any)?.message ?? ''),
        details: String((pendingErr as any)?.details ?? ''),
        hint: String((pendingErr as any)?.hint ?? '')
      }
      return NextResponse.json(
        {
          error: 'Impossible de vérifier les demandes en cours.',
          ...((debugEnabled || process.env.NODE_ENV !== 'production') ? { supabase: details } : {})
        },
        { status: 500 }
      )
    }

    const pending = Array.isArray(pendingRows) ? pendingRows : []
    for (const row of pending) {
      const existingOrderIds = Array.isArray((row as any)?.order_ids) ? ((row as any).order_ids as any[]) : []
      const overlaps = existingOrderIds
        .map((x) => String(x).trim())
        .filter((x) => x.length > 0)
        .filter((id) => requestedOrderIdSet.has(id))

      if (overlaps.length > 0) {
        return NextResponse.json(
          {
            error: "Une demande de paiement est déjà en cours pour au moins une des commandes sélectionnées.",
            pendingRequestId: String((row as any)?.id ?? ''),
            overlappingOrderIds: overlaps
          },
          { status: 409 }
        )
      }
    }

    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select(
        'id, vendor_id, total_amount, final_total, currency, status, payment_status, shipping_address, shipping_method_id, delivery_id, shipping_lat, shipping_lng, delivery_option'
      )
      .in('id', orderIds as any)
      .limit(500)

    if (ordersErr) {
      console.error('❌ POST /api/finance/payment-requests: orders lookup failed:', ordersErr)
      return NextResponse.json({ error: 'Impossible de charger les commandes.' }, { status: 500 })
    }

    const rows = Array.isArray(orders) ? orders : []
    const vendorOrders = rows.filter((o: any) => vendorIds.includes(String(o?.vendor_id ?? '')))

    const debugPayload = {
      vendorId,
      vendorIds,
      receivedOrderIds: orderIds,
      ordersFoundCount: rows.length,
      vendorOrdersCount: vendorOrders.length,
      ordersVendorIdExamples: rows.slice(0, 5).map((o: any) => String(o?.vendor_id ?? ''))
    }

    if (vendorOrders.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucune commande valide pour ce vendeur.',
          ...(debugEnabled ? { debug: debugPayload } : {})
        },
        { status: 400 }
      )
    }

    // Charge les paramètres généraux finance (seuil + fenêtre de validation)
    const { data: payoutSettingsRow } = await supabase
      .from('finance_payout_settings')
      .select('auto_payout, minimum_threshold, primary_validation_day, backup_validation_day')
      .limit(1)
      .maybeSingle()

    const payoutSettings = (payoutSettingsRow ?? null) as PayoutSettingsRow | null
    const minimumThreshold = Number(payoutSettings?.minimum_threshold ?? 0)
    const allowedDays = new Set<string>()
    const primaryDay = normalizeWeekday(payoutSettings?.primary_validation_day)
    const backupDay = normalizeWeekday(payoutSettings?.backup_validation_day)
    if (primaryDay) allowedDays.add(primaryDay)
    if (backupDay) allowedDays.add(backupDay)

    if (allowedDays.size > 0) {
      const today = getTodayWeekdayKey()
      if (!allowedDays.has(today)) {
        return NextResponse.json(
          {
            error: `Demandes autorisées uniquement pendant la fenêtre de validation (${Array.from(allowedDays.values()).join(', ')}).`
          },
          { status: 403 }
        )
      }
    }

    if (debugEnabled) {
      console.warn('🧪 DEBUG POST /api/finance/payment-requests', debugPayload)
    }

    const totalAmount = vendorOrders.reduce((sum: number, o: any) => {
      const raw = o?.final_total != null ? o.final_total : o?.total_amount
      const num = Number(raw ?? 0)
      return sum + (Number.isFinite(num) ? num : 0)
    }, 0)

    const globalRuleCache: { rule: CommissionRuleRow | null; loaded: boolean } = { rule: null, loaded: false }
    const getRuleForVendor = async (): Promise<CommissionRuleRow | null> => {
      const cached = (globalRuleCache.loaded ? globalRuleCache.rule : null) as any
      if (globalRuleCache.loaded) return cached

      const { data: vendorRule } = await supabase
        .from('finance_commission_rules')
        .select('*')
        .eq('scope', 'vendor')
        .in('vendor_id', vendorIds as any)
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
    const resolveOrderItemGross = (item: any): number => {
      const totalPrice = Number(item?.total_price ?? NaN)
      const total = Number(item?.total ?? NaN)
      const qty = Number(item?.quantity ?? 0)
      const unit = Number(item?.unit_price ?? item?.price ?? 0)
      const resolved =
        Number.isFinite(totalPrice) && totalPrice > 0
          ? totalPrice
          : Number.isFinite(total) && total > 0
            ? total
            : unit * (Number.isFinite(qty) ? qty : 0)
      return Number.isFinite(resolved) ? Math.max(0, resolved) : 0
    }

    const commissionAmount = vendorOrders.reduce((sum: number, o: any) => {
      const items = Array.isArray(o?.order_items) ? o.order_items : []
      const byItems = items.reduce((acc: number, it: any) => {
        const gross = resolveOrderItemGross(it)
        return acc + computeCommissionAmount({ totalAmount: gross, rule })
      }, 0)
      return sum + byItems
    }, 0)

    const netAmount = Math.max(0, totalAmount - commissionAmount)

    if (Number.isFinite(minimumThreshold) && minimumThreshold > 0 && netAmount < minimumThreshold) {
      return NextResponse.json(
        {
          error: `Seuil minimum non atteint (${Math.round(minimumThreshold)} requis).`
        },
        { status: 403 }
      )
    }

    // Vérification livraison requise :
    // - option 1: shipping_address non vide => livraison requise
    // - option 2: une ligne deliveries existe => livraison requise
    // - option 3: si toujours indéterminable, on déduit depuis les produits (order_items -> user_products.is_virtual / is_downloadable)
    const vendorOrderIds = vendorOrders.map((o: any) => String(o?.id ?? '')).filter(Boolean)
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('order_id, status, delivered_at')
      .in('order_id', vendorOrderIds as any)
      .limit(1000)

    const deliveriesByOrderId = new Map<string, Array<{ status: string | null; delivered_at: string | null }>>()
    ;(Array.isArray(deliveries) ? deliveries : []).forEach((d: any) => {
      const oid = String(d?.order_id ?? '')
      if (!oid) return
      const list = deliveriesByOrderId.get(oid) ?? []
      list.push({ status: d?.status ?? null, delivered_at: d?.delivered_at ?? null })
      deliveriesByOrderId.set(oid, list)
    })

    const isDeliveredLikeStatus = (status: unknown) => {
      const s = String(status ?? '').trim().toLowerCase()
      if (!s) return false
      if (s === 'delivered') return true
      if (s === 'completed') return true
      if (s.includes('deliver')) return true
      if (s.includes('livr')) return true
      return false
    }

    // Option 3: déduction livraison requise via types de produits
    // - digital si is_virtual=true OU is_downloadable=true
    // - si au moins un produit non-digital => livraison requise
    const orderHasPhysicalProduct = new Map<string, boolean>()
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, product_id')
        .in('order_id', vendorOrderIds as any)
        .limit(5000)

      const items = Array.isArray(orderItems) ? orderItems : []
      const productIds = Array.from(
        new Set(items.map((it: any) => String(it?.product_id ?? '')).filter(Boolean))
      )

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('user_products')
          .select('id, is_virtual, is_downloadable')
          .in('id', productIds as any)
          .limit(5000)

        const productMap = new Map<string, { isVirtual: boolean; isDownloadable: boolean }>()
        ;(Array.isArray(products) ? products : []).forEach((p: any) => {
          const id = String(p?.id ?? '')
          if (!id) return
          productMap.set(id, {
            isVirtual: Boolean(p?.is_virtual),
            isDownloadable: Boolean(p?.is_downloadable)
          })
        })

        items.forEach((it: any) => {
          const orderId = String(it?.order_id ?? '')
          const productId = String(it?.product_id ?? '')
          if (!orderId || !productId) return

          const info = productMap.get(productId)
          if (!info) return

          const isDigital = info.isVirtual || info.isDownloadable
          if (!isDigital) {
            orderHasPhysicalProduct.set(orderId, true)
          } else if (!orderHasPhysicalProduct.has(orderId)) {
            orderHasPhysicalProduct.set(orderId, false)
          }
        })
      }
    } catch {
      // Ne pas bloquer la demande si la détection produit échoue.
    }

    const blockedForDelivery: string[] = []
    vendorOrders.forEach((o: any) => {
      const orderId = String(o?.id ?? '')
      if (!orderId) return

      const hasDeliverySignal = isDeliveryRequiredFromOrder(o) || deliveriesByOrderId.has(orderId)
      const physicalFlag = orderHasPhysicalProduct.get(orderId)

      // Important: on n'impose pas la livraison juste parce que le produit est physique,
      // car il existe des commandes simples (retrait/remise en main propre) sans livraison.
      // En revanche, si un signal de livraison existe et que la commande est 100% digitale,
      // on n'exige pas la livraison.
      const requiresDelivery = hasDeliverySignal && physicalFlag !== false
      if (!requiresDelivery) return

      const orderDeliveredLike = isDeliveredLikeStatus(o?.status)
      const deliveryRows = deliveriesByOrderId.get(orderId) ?? []
      const deliveryDelivered = deliveryRows.some((d) => isDeliveredLikeStatus(d?.status) || Boolean(d?.delivered_at))

      if (!orderDeliveredLike && !deliveryDelivered) {
        blockedForDelivery.push(orderId)
      }
    })

    if (blockedForDelivery.length > 0) {
      return NextResponse.json(
        {
          error: "Livraison non validée: certaines commandes nécessitent une livraison avant la demande de paiement.",
          blockedOrderIds: blockedForDelivery
        },
        { status: 403 }
      )
    }

    const { data: vendorProfileRow } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', vendorId)
      .maybeSingle()

    const vendorFirstName = String((vendorProfileRow as any)?.first_name ?? '').trim()
    const vendorLastName = String((vendorProfileRow as any)?.last_name ?? '').trim()
    const vendorName = `${vendorFirstName} ${vendorLastName}`.trim()

    const now = new Date().toISOString()

    /**
     * Normalise la méthode de paiement demandée afin de garantir une valeur supportée.
     */
    const normalizePaymentMethod = (raw: unknown): 'mobile_money' | 'bank_transfer' | 'bank_card' => {
      const s = String(raw ?? '').trim().toLowerCase()
      if (s === 'bank_transfer') return 'bank_transfer'
      if (s === 'bank_card') return 'bank_card'
      if (s === 'mobile_money') return 'mobile_money'
      return 'mobile_money'
    }

    const normalizedPaymentMethod = normalizePaymentMethod(payload?.paymentMethod)

    const requestedAmountCandidate = Number(payload?.requestedAmount ?? NaN)
    const requestedAmount = Number.isFinite(requestedAmountCandidate) && requestedAmountCandidate > 0
      ? requestedAmountCandidate
      : null

    const trimmedMobileNumber = payload?.mobileNumber ? String(payload.mobileNumber).trim() : ''

    const rawBankDetails = payload?.bankDetails
    const bankDetailsObject =
      rawBankDetails && typeof rawBankDetails === 'object' && !Array.isArray(rawBankDetails)
        ? (rawBankDetails as Record<string, unknown>)
        : null
    const bankName = bankDetailsObject?.bankName ? String(bankDetailsObject.bankName).trim() : ''
    const accountNumber = bankDetailsObject?.accountNumber ? String(bankDetailsObject.accountNumber).trim() : ''
    const accountName = bankDetailsObject?.accountName ? String(bankDetailsObject.accountName).trim() : ''

    if (normalizedPaymentMethod === 'mobile_money' && !trimmedMobileNumber) {
      return NextResponse.json({ error: 'Le numéro Mobile Money est obligatoire.' }, { status: 400 })
    }

    if (normalizedPaymentMethod === 'bank_transfer' && (!bankName || !accountNumber)) {
      return NextResponse.json(
        { error: 'Les informations de virement sont incomplètes (banque et numéro de compte requis).' },
        { status: 400 }
      )
    }

    if (requestedAmount != null && requestedAmount > netAmount) {
      return NextResponse.json(
        { error: "Le montant demandé ne peut pas dépasser le revenu net disponible pour ces commandes." },
        { status: 400 }
      )
    }

    const insertRow: Record<string, unknown> = {
      vendor_id: vendorId,
      vendor_name: vendorName || null,
      user_id: vendorId,
      order_ids: orderIds,
      orders_count: vendorOrders.length,
      total_amount: totalAmount,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      requested_amount: requestedAmount,
      status: 'pending',
      payment_method: normalizedPaymentMethod,
      bank_details:
        normalizedPaymentMethod === 'bank_transfer'
          ? {
              bankName,
              accountNumber,
              ...(accountName ? { accountName } : {})
            }
          : null,
      mobile_number: normalizedPaymentMethod === 'mobile_money' ? trimmedMobileNumber : null,
      notes: payload?.notes ? String(payload.notes).trim() : null,
      execution_type: payload?.executionType ? String(payload.executionType) : null,
      schedule_date: payload?.scheduleDate ? String(payload.scheduleDate) : null,
      payout_window: payload?.payoutWindow ? String(payload.payoutWindow) : null,
      created_at: now
    }

    const { data: created, error: insertErr } = await supabase
      .from('finance_payment_requests')
      .insert(insertRow)
      .select('*')
      .single()

    if (insertErr || !created) {
      console.error('❌ POST /api/finance/payment-requests: insert failed:', insertErr)
      const insertErrMessage = String((insertErr as any)?.message ?? '')
      if ((insertErr as any)?.code === '42703' && insertErrMessage.toLowerCase().includes('order_ids')) {
        return NextResponse.json(
          {
            error:
              "Schéma incomplet: la table finance_payment_requests ne contient pas la colonne order_ids. Ajoutez-la pour permettre les demandes de paiement.",
            fix:
              "ALTER TABLE public.finance_payment_requests ADD COLUMN IF NOT EXISTS order_ids jsonb NOT NULL DEFAULT '[]'::jsonb;"
          },
          { status: 500 }
        )
      }
      if ((insertErr as any)?.code === '42703' && insertErrMessage.toLowerCase().includes('requested_amount')) {
        return NextResponse.json(
          {
            error:
              "Schéma incomplet: la table finance_payment_requests ne contient pas la colonne requested_amount. Ajoutez-la pour enregistrer le montant demandé.",
            fix:
              'ALTER TABLE public.finance_payment_requests ADD COLUMN IF NOT EXISTS requested_amount numeric(12,2) NULL;'
          },
          { status: 500 }
        )
      }
      return NextResponse.json({ error: insertErr?.message || 'Création échouée.' }, { status: 500 })
    }

    await supabase.from('finance_payment_request_events').insert({
      request_id: (created as any).id,
      label: 'Créée',
      actor: 'vendor',
      occurred_at: now
    })

    return NextResponse.json({
      id: (created as any).id,
      vendorId: (created as any).vendor_id,
      vendorName: (created as any).vendor_name,
      ordersCount: Number((created as any).orders_count || 0),
      totalAmount: Number((created as any).total_amount || 0),
      commissionAmount: Number((created as any).commission_amount || 0),
      netAmount: Number((created as any).net_amount || 0),
      requestedAmount: (created as any).requested_amount != null ? Number((created as any).requested_amount) : undefined,
      status: (created as any).status,
      paymentMethod: (created as any).payment_method,
      bankDetails: (created as any).bank_details ?? undefined,
      mobileNumber: (created as any).mobile_number ?? undefined,
      createdAt: (created as any).created_at
    })
  } catch (error) {
    console.error('❌ POST /api/finance/payment-requests unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
