import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Normalise les prix pour correspondre à la sémantique WooCommerce:
 * - price = prix régulier (le plus élevé)
 * - salePrice = prix promo (le plus bas, seulement s'il est inférieur)
 */
function normalizePrices(input: { price: unknown; sale_price: unknown; original_price: unknown }): {
  price: number
  salePrice: number | null
  originalPrice: number | null
} {
  const candidatesRaw = [input.price, input.sale_price, input.original_price]
  const candidates = candidatesRaw
    .map((v) => (v === null || v === undefined ? NaN : Number(v)))
    .filter((n) => Number.isFinite(n) && n > 0)

  const regular = candidates.length > 0 ? Math.max(...candidates) : 0

  const saleCandidate =
    input.sale_price === null || input.sale_price === undefined ? NaN : Number(input.sale_price)
  const sale = Number.isFinite(saleCandidate) && saleCandidate > 0 && saleCandidate < regular ? saleCandidate : null

  return { price: regular, salePrice: sale, originalPrice: regular > 0 ? regular : null }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const normalized = trimmed.replace(',', '.')
    const direct = Number(normalized)
    if (Number.isFinite(direct)) return direct
    const match = normalized.match(/-?\d+(?:\.\d+)?/)
    if (!match) return null
    const extracted = Number(match[0])
    return Number.isFinite(extracted) ? extracted : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === 'true' || v === 't' || v === '1' || v === 'yes') return true
    if (v === 'false' || v === 'f' || v === '0' || v === 'no') return false
  }
  return Boolean(value)
}

/**
 * Extrait une estimation de délai de livraison depuis différents champs metadata (best-effort).
 * Objectif: afficher une info utile dans l'overlay sans dépendre d'un schéma unique.
 */
function extractDeliveryDelay(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null
  const m = metadata as any
  const candidates = [
    m?.delivery_delay,
    m?.deliveryDelay,
    m?.delivery_time,
    m?.deliveryTime,
    m?.shipping_delay,
    m?.shippingDelay,
    m?.shipping_time,
    m?.shippingTime,
    m?.delivery_estimate,
    m?.deliveryEstimate
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
    if (typeof c === 'number' && Number.isFinite(c) && c > 0) return `${c} jour(s)`
  }
  return null
}

type DeliveryRuleConfig = {
  id?: string
  isActive?: boolean
  mode?: 'standard' | 'express'
  zone?: 'local' | 'regional' | 'national' | 'international'
  price?: number | null
  localDistrict?: string | '*'
  department?: string | '*'
  city?: string | '*'
  arrondissement?: string | '*'
  district?: string | '*'
  etaMinDays?: number | null
  etaMaxDays?: number | null
}

type DeliveryBaseOption = {
  price: number
  etaMinDays: number | null
  etaMaxDays: number | null
}

/**
 * Sélectionne une option de base (standard/express) en se basant sur le prix le plus bas
 * parmi les règles actives de la config Super Admin.
 */
function getBaseShippingByModeFromRules(rules: DeliveryRuleConfig[], mode: 'standard' | 'express'): DeliveryBaseOption | null {
  const list = Array.isArray(rules) ? rules : []
  const active = list.filter((r) => r && r.isActive !== false && r.mode === mode)
  if (active.length === 0) return null

  const sorted = [...active].sort((a, b) => (Number(a?.price ?? 0) || 0) - (Number(b?.price ?? 0) || 0))
  const best = sorted[0] ?? null
  if (!best) return null
  return {
    price: Number(best?.price ?? 0) || 0,
    etaMinDays: typeof best?.etaMinDays === 'number' ? best.etaMinDays : null,
    etaMaxDays: typeof best?.etaMaxDays === 'number' ? best.etaMaxDays : null
  }
}

/**
 * Construit le même libellé "Livraison" que la fiche produit (ProductPageClient.shippingLabel).
 */
function buildShippingLabel(params: {
  freeShipping: boolean
  shippingCost: number | null
  shippingClass: string
  std: DeliveryBaseOption | null
  exp: DeliveryBaseOption | null
}): string {
  const { freeShipping, shippingCost, shippingClass, std, exp } = params

  if (freeShipping) return 'Livraison: gratuite'

  const cost = typeof shippingCost === 'number' && Number.isFinite(shippingCost) ? shippingCost : null
  if (cost != null && cost > 0) {
    const suffix = shippingClass ? ` • ${shippingClass}` : ''
    return `Livraison: ${Math.ceil(cost).toLocaleString()} FCFA${suffix}`
  }

  const fmtEta = (min: number | null, max: number | null) => {
    if (min != null && max != null) return `${min}-${max} jours`
    if (min != null) return `${min}+ jours`
    if (max != null) return `≤ ${max} jours`
    return ''
  }

  const stdText = std
    ? `Standard: ${Math.ceil(std.price).toLocaleString()} FCFA${
        fmtEta(std.etaMinDays, std.etaMaxDays) ? ` • ${fmtEta(std.etaMinDays, std.etaMaxDays)}` : ''
      }`
    : ''
  const expText = exp
    ? `Express: ${Math.ceil(exp.price).toLocaleString()} FCFA${
        fmtEta(exp.etaMinDays, exp.etaMaxDays) ? ` • ${fmtEta(exp.etaMinDays, exp.etaMaxDays)}` : ''
      }`
    : ''

  const parts = [stdText, expText].filter(Boolean)
  return parts.length > 0 ? `Livraison (base): ${parts.join(' | ')}` : ''
}

/**
 * Tente de récupérer un délai depuis la configuration globale Super Admin (DeliveryManagement).
 * Note: sans adresse client dans l'overlay, on sélectionne une règle "générique" (ciblage '*')
 * correspondant au mode (standard/express) et au niveau de zone le plus probable.
 */
async function resolveGlobalDeliveryDelay(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  shippingClass: unknown
): Promise<string | null> {
  try {
    const shippingClassStr = typeof shippingClass === 'string' ? shippingClass.trim().toLowerCase() : ''
    const mode: 'standard' | 'express' = shippingClassStr === 'express' || shippingClassStr === 'premium' ? 'express' : 'standard'

    const { data, error } = await supabase
      .from('super_admin_settings')
      .select('settings')
      .eq('scope', 'global')
      .maybeSingle()

    if (error || !data) return null

    const settings = (data as any)?.settings ?? {}
    const deliveryConfig = (settings as any)?.deliveryConfig ?? {}
    const deliveryRulesRaw: unknown = (settings as any)?.deliveryRules ?? (deliveryConfig as any)?.deliveryRules ?? []
    const rules: DeliveryRuleConfig[] = Array.isArray(deliveryRulesRaw) ? (deliveryRulesRaw as any) : []

    const isWildcardRule = (r: DeliveryRuleConfig) => {
      const localOk = (r.localDistrict ?? '*') === '*'
      const deptOk = (r.department ?? '*') === '*'
      const cityOk = (r.city ?? '*') === '*'
      const arrOk = (r.arrondissement ?? '*') === '*'
      const districtOk = (r.district ?? '*') === '*'
      return localOk && deptOk && cityOk && arrOk && districtOk
    }

    const zoneRank: Record<string, number> = { local: 1, regional: 2, national: 3, international: 4 }

    const candidates = rules
      .filter((r) => r && r.isActive === true)
      .filter((r) => (r.mode ?? 'standard') === mode)
      .filter((r) => isWildcardRule(r))
      .filter((r) => (typeof r.etaMinDays === 'number' && r.etaMinDays > 0) || (typeof r.etaMaxDays === 'number' && r.etaMaxDays > 0))
      .sort((a, b) => (zoneRank[String(a.zone ?? 'national')] ?? 99) - (zoneRank[String(b.zone ?? 'national')] ?? 99))

    const first = candidates[0]
    if (!first) return null

    const min = typeof first.etaMinDays === 'number' && Number.isFinite(first.etaMinDays) ? first.etaMinDays : null
    const max = typeof first.etaMaxDays === 'number' && Number.isFinite(first.etaMaxDays) ? first.etaMaxDays : null

    if (min != null && max != null) {
      if (min === max) return `${min} jour(s)`
      return `${min}-${max} jour(s)`
    }
    if (min != null) return `${min} jour(s)`
    if (max != null) return `${max} jour(s)`
    return null
  } catch {
    return null
  }
}

/**
 * Récupère la liste des deliveryRules depuis la configuration globale Super Admin.
 */
async function getGlobalDeliveryRules(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<DeliveryRuleConfig[]> {
  try {
    const { data, error } = await supabase
      .from('super_admin_settings')
      .select('settings')
      .eq('scope', 'global')
      .maybeSingle()

    if (error || !data) return []
    const settings = (data as any)?.settings ?? {}
    const deliveryConfig = (settings as any)?.deliveryConfig ?? {}
    const deliveryRulesRaw: unknown = (settings as any)?.deliveryRules ?? (deliveryConfig as any)?.deliveryRules ?? []
    return Array.isArray(deliveryRulesRaw) ? (deliveryRulesRaw as any) : []
  } catch {
    return []
  }
}

/**
 * Résout un user.id représentant le super-admin.
 * Utilisé comme fallback pour les produits vendus par la boutique (vendor_id null).
 */
async function resolveSuperAdminUserId(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, role')
      .or('role.ilike.super_admin,role.ilike.superadmin,role.ilike.admin')
      .order('created_at', { ascending: true })
      .limit(1)

    const first = Array.isArray(data) ? data[0] : null
    const id = typeof (first as any)?.id === 'string' ? String((first as any).id).trim() : ''
    return id.length > 0 ? id : null
  } catch {
    return null
  }
}

/**
 * GET /api/public/products
 * Récupère les informations minimales d'un produit (public) pour permettre au front de
 * synchroniser un panier quand une promotion est mise en pause (retour au prix normal).
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { data: null },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('user_products')
      .select(
        `
          id,
          name,
          price,
          sale_price,
          original_price,
          description,
          short_description,
          warranty,
          return_policy,
          metadata,
          vendor_id,
          product_status,
          is_virtual,
          is_downloadable,
          main_image,
          images,
          stock_quantity,
          manage_stock,
          weight,
          free_shipping,
          shipping_cost,
          shipping_class,
          product_category_assignments (
            category_id,
            is_primary
          ),
          product_payment_settings (
            installment_payment,
            installment_options,
            deferred_payment,
            deferred_payment_fees
          ),
          product_promotion_settings (
            promotion_start_date,
            promotion_end_date,
            promotion_auto_restore,
            featured_badge_text,
            featured_start_date,
            featured_end_date
          ),
          product_marketing_settings (
            social_sharing,
            social_points,
            referral_bonus,
            favorite_note
          )
        `
      )
      .eq('id', id)
      .neq('product_status', 'archived')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { data: null },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    const rawVendorId = typeof (data as any).vendor_id === 'string' ? String((data as any).vendor_id).trim() : ''
    const superAdminUserId = rawVendorId ? null : await resolveSuperAdminUserId(supabaseAdmin)

    // Normalisation: vendor_id peut parfois contenir user_profiles.id.
    // La présence Supabase tracke auth.users.id -> on convertit vers user_profiles.user_id si possible.
    let normalizedVendorId = rawVendorId
    if (normalizedVendorId && UUID_REGEX.test(normalizedVendorId)) {
      const { data: vendorProfileLookup } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id')
        .eq('id', normalizedVendorId)
        .maybeSingle()
      const mappedUserId = typeof (vendorProfileLookup as any)?.user_id === 'string' ? String((vendorProfileLookup as any).user_id).trim() : ''
      if (mappedUserId && UUID_REGEX.test(mappedUserId)) {
        normalizedVendorId = mappedUserId
      }
    }

    const vendorId = normalizedVendorId || superAdminUserId || ''
    const [{ data: vendorProfile }, { data: vendorUser }, { data: productStats }] = await Promise.all([
      vendorId
        ? supabaseAdmin
            .from('user_profiles')
            .select('id, user_id, first_name, last_name, avatar_url, phone, city, country, created_at')
            .or(`user_id.eq.${vendorId},id.eq.${vendorId}`)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
      vendorId
        ? supabaseAdmin.from('users').select('id, email, created_at').eq('id', vendorId).maybeSingle()
        : Promise.resolve({ data: null } as any),
      supabaseAdmin.from('product_statistics').select('*').eq('product_id', id).maybeSingle()
    ])

    const stats = productStats ?? null

    // Avis produit (best-effort)
    const { data: reviewRows } = await supabaseAdmin
      .from('product_reviews')
      .select('id, product_id, user_id, rating, title, comment, is_verified_purchase, helpful_votes, created_at, status')
      .eq('product_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10)

    const reviewUserIds = Array.from(
      new Set(
        (Array.isArray(reviewRows) ? reviewRows : [])
          .map((row: any) => row?.user_id)
          .filter((value: any) => typeof value === 'string' && value.length > 0)
          .map((value: any) => String(value))
      )
    )

    const { data: reviewerProfiles } = reviewUserIds.length
      ? await supabaseAdmin
          .from('user_profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', reviewUserIds)
      : ({ data: [] } as any)

    const reviewerById = new Map<string, any>()
    ;(reviewerProfiles ?? []).forEach((profile: any) => {
      const uid = typeof profile?.user_id === 'string' ? String(profile.user_id) : ''
      if (!uid) return
      reviewerById.set(uid, profile)
    })

    const publicReviewRows = (Array.isArray(reviewRows) ? reviewRows : []).filter((row: any) => {
      const status = String(row?.status ?? 'approved').toLowerCase()
      return status === 'approved'
    })

    const reviews = publicReviewRows.map((row: any) => {
      const uid = typeof row?.user_id === 'string' ? String(row.user_id) : ''
      const profile = uid ? reviewerById.get(uid) : null
      const first = typeof profile?.first_name === 'string' ? profile.first_name : ''
      const last = typeof profile?.last_name === 'string' ? profile.last_name : ''
      const userName = `${first} ${last}`.trim()
      return {
        id: String(row?.id ?? ''),
        userId: uid,
        userName: userName || 'Client',
        userAvatar: typeof profile?.avatar_url === 'string' ? profile.avatar_url : '',
        rating: Number(row?.rating ?? 0) || 0,
        title: typeof row?.title === 'string' ? row.title : '',
        comment: typeof row?.comment === 'string' ? row.comment : '',
        verified: Boolean(row?.is_verified_purchase ?? false),
        helpful: Number(row?.helpful_votes ?? 0) || 0,
        createdAt: typeof row?.created_at === 'string' ? row.created_at : null
      }
    })

    const vendorFirst = typeof (vendorProfile as any)?.first_name === 'string' ? (vendorProfile as any).first_name : ''
    const vendorLast = typeof (vendorProfile as any)?.last_name === 'string' ? (vendorProfile as any).last_name : ''
    const vendorName = `${vendorFirst} ${vendorLast}`.trim()
    const vendorAvatar = typeof (vendorProfile as any)?.avatar_url === 'string' ? (vendorProfile as any).avatar_url : ''
    const vendorPhone = typeof (vendorProfile as any)?.phone === 'string' ? (vendorProfile as any).phone : ''
    const vendorCity = typeof (vendorProfile as any)?.city === 'string' ? (vendorProfile as any).city : ''
    const vendorCountry = typeof (vendorProfile as any)?.country === 'string' ? (vendorProfile as any).country : ''
    const vendorCreatedAt =
      (typeof (vendorUser as any)?.created_at === 'string' && String((vendorUser as any).created_at).trim().length > 0)
        ? String((vendorUser as any).created_at).trim()
        : (typeof (vendorProfile as any)?.created_at === 'string' && String((vendorProfile as any).created_at).trim().length > 0)
          ? String((vendorProfile as any).created_at).trim()
          : null
    const vendorEmail = typeof (vendorUser as any)?.email === 'string' ? (vendorUser as any).email : ''

    const isStoreProduct = !rawVendorId
    const resolvedSellerName = isStoreProduct ? 'Boutique' : vendorName

    const normalizedPrices = normalizePrices({
      price: (data as any).price,
      sale_price: (data as any).sale_price,
      original_price: (data as any).original_price
    })

    const globalRules = await getGlobalDeliveryRules(supabaseAdmin)
    const shippingClassStr = typeof (data as any)?.shipping_class === 'string' ? String((data as any).shipping_class).trim() : ''
    const baseStandard = getBaseShippingByModeFromRules(globalRules, 'standard')
    const baseExpress = getBaseShippingByModeFromRules(globalRules, 'express')

    const deliveryDelayFromGlobal = await resolveGlobalDeliveryDelay(supabaseAdmin, (data as any)?.shipping_class)
    const deliveryDelay = deliveryDelayFromGlobal ?? extractDeliveryDelay((data as any)?.metadata)

    const productFreeShipping = Boolean((data as any)?.free_shipping)
    const productShippingCost = toOptionalNumber((data as any)?.shipping_cost)
    const deliveryLabel = buildShippingLabel({
      freeShipping: productFreeShipping,
      shippingCost: productShippingCost,
      shippingClass: shippingClassStr,
      std: baseStandard,
      exp: baseExpress
    })

    const promotionSettings = Array.isArray((data as any)?.product_promotion_settings)
      ? (data as any).product_promotion_settings[0] ?? null
      : (data as any)?.product_promotion_settings ?? null

    const isPromoActive = typeof normalizedPrices.salePrice === 'number' && normalizedPrices.salePrice > 0
    const promoBadge = typeof promotionSettings?.featured_badge_text === 'string' ? String(promotionSettings.featured_badge_text).trim() : ''
    const promoStart = typeof promotionSettings?.promotion_start_date === 'string' ? String(promotionSettings.promotion_start_date).trim() : ''
    const promoEnd = typeof promotionSettings?.promotion_end_date === 'string' ? String(promotionSettings.promotion_end_date).trim() : ''

    const promotionSummary = isPromoActive
      ? {
          is_active: true,
          summary: `${normalizedPrices.salePrice} XOF au lieu de ${normalizedPrices.price} XOF`,
          badge: promoBadge || null,
          start_date: promoStart || null,
          end_date: promoEnd || null
        }
      : {
          is_active: false,
          summary: null,
          badge: promoBadge || null,
          start_date: promoStart || null,
          end_date: promoEnd || null
        }

    return NextResponse.json(
      {
        data: {
          id: data.id,
          name: data.name ?? null,
          price: normalizedPrices.price,
          sale_price: normalizedPrices.salePrice,
          original_price: normalizedPrices.originalPrice,
          description: typeof (data as any).description === 'string' ? (data as any).description : null,
          short_description: typeof (data as any).short_description === 'string' ? (data as any).short_description : null,
          warranty: typeof (data as any).warranty === 'string' ? (data as any).warranty : null,
          return_policy: typeof (data as any).return_policy === 'string' ? (data as any).return_policy : null,
          metadata:
            typeof (data as any)?.metadata === 'object' && (data as any).metadata !== null
              ? (data as any).metadata
              : null,
          vendor_id: vendorId || null,
          seller_name: resolvedSellerName,
          seller_avatar: vendorAvatar,
          seller_phone: vendorPhone,
          seller_city: vendorCity,
          seller_country: vendorCountry,
          seller_created_at: vendorCreatedAt,
          seller_email: vendorEmail,
          product_status: (data as any).product_status ?? null,
          category_ids: Array.isArray((data as any)?.product_category_assignments)
            ? (data as any).product_category_assignments
                .map((row: any) => String(row?.category_id ?? '').trim())
                .filter((value: string) => value.length > 0)
            : [],
          primary_category_id: Array.isArray((data as any)?.product_category_assignments)
            ? (() => {
                const primary = (data as any).product_category_assignments.find((row: any) => row?.is_primary === true)
                const id = primary ? String(primary?.category_id ?? '').trim() : ''
                return id.length > 0 ? id : null
              })()
            : null,
          is_virtual: Boolean((data as any).is_virtual),
          is_downloadable: Boolean((data as any).is_downloadable),
          media: {
            main_image: typeof (data as any).main_image === 'string' ? (data as any).main_image : null,
            images: Array.isArray((data as any).images) ? (data as any).images.filter((x: any) => typeof x === 'string') : []
          },
          stock: {
            manage_stock: toOptionalBoolean((data as any).manage_stock),
            stock_quantity: toOptionalNumber((data as any).stock_quantity)
          },
          shipping: {
            weight:
              typeof (data as any)?.weight === 'number'
                ? (data as any).weight
                : (data as any)?.weight == null
                  ? null
                  : Number((data as any)?.weight ?? 0) || null,
            free_shipping: Boolean((data as any)?.free_shipping),
            shipping_cost: toOptionalNumber((data as any)?.shipping_cost),
            shipping_class: typeof (data as any)?.shipping_class === 'string' ? (data as any).shipping_class : null,
            delivery_delay: deliveryDelay,
            delivery_label: deliveryLabel,
            base_options: {
              standard: baseStandard,
              express: baseExpress
            }
          },
          stats: stats
            ? {
                total_views: Number((stats as any)?.total_views ?? 0) || 0,
                total_sales: Number((stats as any)?.total_sales ?? 0) || 0,
                total_revenue: Number((stats as any)?.total_revenue ?? 0) || 0,
                average_rating: Number((stats as any)?.average_rating ?? 0) || 0,
                review_count: Number((stats as any)?.review_count ?? 0) || 0,
                share_count: Number((stats as any)?.share_count ?? 0) || 0,
                wishlist_count: Number((stats as any)?.wishlist_count ?? 0) || 0
              }
            : null,
          reviews,
          payment_settings: {
            installment_payment: Boolean((data as any)?.product_payment_settings?.installment_payment),
            installment_options: Array.isArray((data as any)?.product_payment_settings?.installment_options)
              ? (data as any).product_payment_settings.installment_options
              : null,
            deferred_payment: Boolean((data as any)?.product_payment_settings?.deferred_payment),
            deferred_payment_fees:
              typeof (data as any)?.product_payment_settings?.deferred_payment_fees === 'object' &&
              (data as any).product_payment_settings.deferred_payment_fees !== null
                ? (data as any).product_payment_settings.deferred_payment_fees
                : null
          },
          promotion_settings: promotionSettings,
          promotion_summary: promotionSummary,
          marketing_settings: Array.isArray((data as any)?.product_marketing_settings)
            ? (data as any).product_marketing_settings[0] ?? null
            : (data as any)?.product_marketing_settings ?? null
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (error) {
    console.error('GET /public/products failed:', error)
    return NextResponse.json(
      { data: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }
}
