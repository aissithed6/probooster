'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'

type RecommendationType = 'product' | 'seller' | 'promotion'

type FinalRecommendation = {
  type: RecommendationType
  key: string
  confidenceScore: number
  reason: string
  data: Record<string, any>
}

/**
 * Bornage sûr d'un nombre.
 */
function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/**
 * Déduplique et normalise une liste de valeurs en chaînes non vides.
 */
function uniqueStrings(values: unknown[]): string[] {
  const set = new Set<string>()
  for (const v of values ?? []) {
    const s = typeof v === 'string' ? v.trim() : String(v ?? '').trim()
    if (s) set.add(s)
  }
  return Array.from(set)
}

/**
 * Wrapper de lecture Supabase: retourne `fallback` en cas d'erreur.
 */
async function safeSelect<T>(promise: Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await promise
    if (error) return fallback
    return (data ?? fallback) as T
  } catch {
    return fallback
  }
}

/**
 * Charge les recommandations existantes actives pour l'utilisateur.
 */
async function loadExistingActiveRecommendations(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  userId: string
}) {
  const { supabase, userId } = params

  const rows = await safeSelect<any[]>(
    supabase
      .from('historique_recommandations_ia')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('confidence_score', { ascending: false })
      .limit(50),
    []
  )

  return Array.isArray(rows) ? rows : []
}

/**
 * Charge les signaux (A+B+C+D+E) en best-effort.
 * IMPORTANT: certaines tables peuvent ne pas exister selon la configuration -> fallback vide.
 */
async function loadSignals(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  userId: string
}) {
  const { supabase, userId } = params

  const orderItems = await safeSelect<any[]>(
    supabase
      .from('user_order_items')
      .select('product_id, product_name, unit_price, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
    []
  )

  const wishlist = await safeSelect<any[]>(
    supabase
      .from('user_wishlists')
      .select('product_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
    []
  )

  const cart = await safeSelect<any[]>(
    supabase
      .from('user_carts')
      .select('product_id, quantity, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
    []
  )

  const shares = await safeSelect<any[]>(
    supabase
      .from('product_shares')
      .select('product_id, platform, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
    []
  )

  const promotions = await safeSelect<any[]>(
    supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50),
    []
  )

  const productViews = await safeSelect<any[]>(
    // Table peut ne pas exister dans certaines configs -> fallback vide.
    supabase
      .from('product_views')
      .select('product_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
    []
  )

  const chatProducts = await safeSelect<any[]>(
    // Table peut ne pas exister -> fallback vide.
    supabase
      .from('chat_products')
      .select('product_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
    []
  )

  return {
    orderItems: Array.isArray(orderItems) ? orderItems : [],
    wishlist: Array.isArray(wishlist) ? wishlist : [],
    cart: Array.isArray(cart) ? cart : [],
    shares: Array.isArray(shares) ? shares : [],
    promotions: Array.isArray(promotions) ? promotions : [],
    productViews: Array.isArray(productViews) ? productViews : [],
    chatProducts: Array.isArray(chatProducts) ? chatProducts : []
  }
}

/**
 * Charge les produits nécessaires au scoring.
 */
async function loadProductsByIds(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  productIds: string[]
}) {
  const { supabase, productIds } = params
  const ids = uniqueStrings(productIds).slice(0, 50)
  if (ids.length === 0) return []

  const products = await safeSelect<any[]>(
    supabase
      .from('user_products')
      .select('id, name, price, original_price, category, main_image, images, vendor_id, rating, reviews_count')
      .in('id', ids),
    []
  )

  return Array.isArray(products) ? products : []
}

/**
 * Charge les profils vendeurs nécessaires au scoring.
 */
async function loadVendorsByIds(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  vendorIds: string[]
}) {
  const { supabase, vendorIds } = params
  const ids = uniqueStrings(vendorIds).slice(0, 30)
  if (ids.length === 0) return []

  const profiles = await safeSelect<any[]>(
    supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, avatar_url, short_code, preferences')
      .in('user_id', ids),
    []
  )

  return Array.isArray(profiles) ? profiles : []
}

/**
 * Résout une image produit exploitable.
 */
function resolveProductImage(row: any): string {
  const main = typeof row?.main_image === 'string' ? row.main_image.trim() : ''
  if (main) return main
  const imgs = Array.isArray(row?.images) ? row.images : []
  const first = imgs.find((x: any) => typeof x === 'string' && x.trim())
  return typeof first === 'string' ? first.trim() : '/placeholder.jpg'
}

/**
 * Résout un nom vendeur lisible depuis user_profiles.
 */
function computeVendorName(profile: any, fallback: string): string {
  const prefs = profile?.preferences && typeof profile.preferences === 'object' && !Array.isArray(profile.preferences)
    ? profile.preferences
    : null
  const vendorPublic = prefs?.vendor_public && typeof prefs.vendor_public === 'object' && !Array.isArray(prefs.vendor_public)
    ? prefs.vendor_public
    : null
  const shopName = typeof vendorPublic?.shop_name === 'string' ? vendorPublic.shop_name.trim() : ''
  if (shopName) return shopName

  const first = typeof profile?.first_name === 'string' ? profile.first_name.trim() : ''
  const last = typeof profile?.last_name === 'string' ? profile.last_name.trim() : ''
  const full = `${first} ${last}`.trim()
  if (full) return full

  const shortCode = typeof profile?.short_code === 'string' ? profile.short_code.trim() : ''
  if (shortCode) return shortCode

  return fallback ? `Vendeur ${fallback.slice(0, 8)}` : 'Vendeur'
}

/**
 * Fusionne recommandations existantes (DB) et recommandations calculées (règles),
 * avec déduplication, score max et concaténation des raisons.
 */
function mergeRecommendations(existing: any[], computed: FinalRecommendation[]): FinalRecommendation[] {
  const map = new Map<string, FinalRecommendation>()

  for (const row of existing ?? []) {
    const type = String(row?.recommendation_type ?? '').trim() as RecommendationType
    if (type !== 'product' && type !== 'seller' && type !== 'promotion') continue

    const key = (() => {
      // Compat schéma minimal: la clé stable est stockée dans `title` sous forme `type:<uuid>`.
      const titleKey = String(row?.title ?? '').trim()
      if (titleKey && titleKey.includes(':')) return titleKey

      // Compat schéma encore plus minimal: si `title` n'existe pas, on peut encoder la clé dans `ai_reason`.
      const reasonRaw = String(row?.ai_reason ?? '').trim()
      const encodedMatch = reasonRaw.match(/^\s*([a-z]+:[^|\s]+)\s*\|\|\s*/i)
      if (encodedMatch?.[1]) {
        return String(encodedMatch[1]).trim()
      }

      if (type === 'product') return `product:${String(row?.product_id ?? '').trim() || String(row?.product_name ?? '').trim()}`
      if (type === 'seller') return `seller:${String(row?.seller_id ?? '').trim() || String(row?.seller_name ?? '').trim()}`
      return `promotion:${String(row?.promotion_id ?? '').trim() || titleKey}`
    })()

    if (!key || key.endsWith(':')) continue

    const score = Number(row?.confidence_score ?? 0)
    const reason = String(row?.ai_reason ?? row?.reason ?? 'Recommandation existante').trim() || 'Recommandation existante'

    map.set(key, {
      type,
      key,
      confidenceScore: clamp(score, 0, 1),
      reason,
      data: { source: 'db', raw: row }
    })
  }

  for (const rec of computed ?? []) {
    const prev = map.get(rec.key)
    if (!prev) {
      map.set(rec.key, rec)
      continue
    }

    // Fusion: on garde le meilleur score, et on concatène les raisons.
    const bestScore = Math.max(prev.confidenceScore, rec.confidenceScore)
    const reasons = uniqueStrings([prev.reason, rec.reason])
    map.set(rec.key, {
      ...rec,
      confidenceScore: bestScore,
      reason: reasons.join(' | '),
      data: { ...prev.data, ...rec.data }
    })
  }

  return Array.from(map.values())
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 20)
}

/**
 * Calcule des recommandations basées sur règles (A+B+C+D+E) en s'appuyant sur des signaux réels.
 */
async function computeRuleBasedRecommendations(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  userId: string
}) {
  const { supabase, userId } = params

  const signals = await loadSignals({ supabase, userId })

  const allProductIds = uniqueStrings([
    ...signals.orderItems.map((x) => x?.product_id),
    ...signals.wishlist.map((x) => x?.product_id),
    ...signals.cart.map((x) => x?.product_id),
    ...signals.shares.map((x) => x?.product_id),
    ...signals.productViews.map((x) => x?.product_id),
    ...signals.chatProducts.map((x) => x?.product_id)
  ])

  const products = await loadProductsByIds({ supabase, productIds: allProductIds })
  const productById = new Map<string, any>()
  for (const p of products) {
    const id = String(p?.id ?? '').trim()
    if (id) productById.set(id, p)
  }

  const productScore = new Map<string, number>()

  const bump = (productId: string, w: number) => {
    const pid = String(productId ?? '').trim()
    if (!pid) return
    productScore.set(pid, (productScore.get(pid) ?? 0) + w)
  }

  // A: achats
  for (const row of signals.orderItems) bump(row?.product_id, 5)

  // B: vues
  for (const row of signals.productViews) bump(row?.product_id, 2)

  // C: partages
  for (const row of signals.shares) bump(row?.product_id, 3)

  // D: chat
  for (const row of signals.chatProducts) bump(row?.product_id, 2)

  // wishlist + panier
  for (const row of signals.wishlist) bump(row?.product_id, 4)
  for (const row of signals.cart) bump(row?.product_id, 4)

  const rankedProducts = Array.from(productScore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const computed: FinalRecommendation[] = []

  const topScore = rankedProducts.length > 0 ? rankedProducts[0][1] : 1

  for (const [pid, score] of rankedProducts) {
    const p = productById.get(pid)
    if (!p) continue

    const image = resolveProductImage(p)
    const conf = clamp(score / Math.max(1, topScore), 0.15, 0.95)

    computed.push({
      type: 'product',
      key: `product:${pid}`,
      confidenceScore: conf,
      reason: 'Basé sur vos achats, vues, partages, wishlist, panier et discussions chat.',
      data: {
        productId: pid,
        name: String(p?.name ?? 'Produit recommandé').trim() || 'Produit recommandé',
        price: Number(p?.price ?? 0) || 0,
        originalPrice: Number(p?.original_price ?? p?.price ?? 0) || 0,
        image,
        category: String(p?.category ?? 'Général').trim() || 'Général',
        rating: Number(p?.rating ?? 0) || 0,
        reviews: Number(p?.reviews_count ?? 0) || 0,
        vendorId: String(p?.vendor_id ?? '').trim() || null
      }
    })
  }

  const vendorScore = new Map<string, number>()
  for (const [pid, score] of rankedProducts) {
    const vendorId = String(productById.get(pid)?.vendor_id ?? '').trim()
    if (!vendorId) continue
    vendorScore.set(vendorId, (vendorScore.get(vendorId) ?? 0) + score)
  }

  const rankedVendors = Array.from(vendorScore.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const vendorProfiles = await loadVendorsByIds({ supabase, vendorIds: rankedVendors.map((v) => v[0]) })
  const profileByVendorId = new Map<string, any>()
  for (const prof of vendorProfiles) {
    const id = String(prof?.user_id ?? '').trim()
    if (id) profileByVendorId.set(id, prof)
  }

  const topVendorScore = rankedVendors.length > 0 ? rankedVendors[0][1] : 1

  for (const [vid, score] of rankedVendors) {
    const prof = profileByVendorId.get(vid)
    const name = computeVendorName(prof, vid)
    const avatar = String(prof?.avatar_url ?? '').trim() || '/placeholder-user.jpg'

    computed.push({
      type: 'seller',
      key: `seller:${vid}`,
      confidenceScore: clamp(score / Math.max(1, topVendorScore), 0.2, 0.9),
      reason: 'Basé sur vos interactions avec les produits de ce vendeur (achats, vues, chat, wishlist).',
      data: {
        sellerId: vid,
        name,
        avatar,
        rating: 4.8,
        totalSales: 0,
        responseTime: '—',
        specialties: [],
        topProducts: []
      }
    })
  }

  // E: promotions actives -> on en propose quelques unes
  for (const promo of (signals.promotions ?? []).slice(0, 5)) {
    const pid = String(promo?.id ?? '').trim()
    if (!pid) continue
    computed.push({
      type: 'promotion',
      key: `promotion:${pid}`,
      confidenceScore: 0.35,
      reason: 'Promotion active susceptible de vous intéresser (sélection automatique).',
      data: {
        promotionId: pid,
        title: promo?.title ?? promo?.name ?? 'Promotion',
        description: promo?.description ?? '',
        type: promo?.type ?? 'discount',
        value: promo?.discount_value ?? promo?.value ?? '',
        startDate: promo?.start_date ?? null,
        endDate: promo?.end_date ?? null,
        image: promo?.image_url ?? '/placeholder.jpg'
      }
    })
  }

  return computed
}

/**
 * Persiste la proposition finale en base (désactivation des anciennes + insert des nouvelles).
 */
async function persistRecommendations(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  userId: string
  finalRecs: FinalRecommendation[]
}) {
  const { supabase, userId, finalRecs } = params

  // Désactiver les anciennes
  const { error: deactivateError } = await supabase
    .from('historique_recommandations_ia')
    .update({ is_active: false } as any)
    .eq('user_id', userId)
    .eq('is_active', true)

  if (deactivateError) {
    throw new Error(
      `Erreur Supabase (désactivation anciennes recommandations): ${
        typeof deactivateError?.message === 'string' ? deactivateError.message : String(deactivateError)
      }`
    )
  }

  const now = new Date().toISOString()

  const rows = finalRecs.map((rec) => {
    const base: any = {
      user_id: userId,
      recommendation_type: rec.type,
      // Certaines versions du schéma utilisent `target_type` (NOT NULL) au lieu/en plus de `recommendation_type`.
      target_type: rec.type,
      is_active: true,
      confidence_score: rec.confidenceScore,
      // Compat schéma sans colonne `title`: on encode la clé stable dans ai_reason.
      // Format: "type:<uuid> || <raison>". La lecture côté UI retire automatiquement le préfixe.
      ai_reason: `${rec.key} || ${rec.reason}`,
      created_at: now,
    }

    return base
  })

  // Insert best-effort
  const { error: insertError, data: inserted } = await supabase
    .from('historique_recommandations_ia')
    .insert(rows as any)
    .select('id')

  if (insertError) {
    throw new Error(
      `Erreur Supabase (insert recommandations): ${
        typeof insertError?.message === 'string' ? insertError.message : String(insertError)
      }`
    )
  }

  return {
    attempted: rows.length,
    inserted: Array.isArray(inserted) ? inserted.length : 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    // Respecte la préférence de confidentialité: si l'utilisateur refuse les recommandations personnalisées,
    // on ne calcule/persiste rien (réponse vide, OK).
    try {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', userId)
        .maybeSingle()

      const prefs = (profileRow as any)?.preferences && typeof (profileRow as any).preferences === 'object' && !Array.isArray((profileRow as any).preferences)
        ? (profileRow as any).preferences
        : {}
      const privacy = (prefs as any)?.privacy && typeof (prefs as any).privacy === 'object' && !Array.isArray((prefs as any).privacy)
        ? (prefs as any).privacy
        : {}
      const enabledRaw = (privacy as any)?.personalizedRecommendations
      const enabled = typeof enabledRaw === 'boolean' ? enabledRaw : enabledRaw === 1 || enabledRaw === '1' || enabledRaw === 'true'

      if (!enabled) {
        return NextResponse.json(
          { ok: true, data: { total: 0, insertedCount: 0, attemptedInsertCount: 0, items: [] } },
          { status: 200 }
        )
      }
    } catch {
      // Si la lecture préférences échoue, on reste en mode permissif (comportement existant).
    }

    const existing = await loadExistingActiveRecommendations({ supabase, userId })
    const computed = await computeRuleBasedRecommendations({ supabase, userId })
    const finalRecs = mergeRecommendations(existing, computed)

    const persistResult = await persistRecommendations({ supabase, userId, finalRecs })

    return NextResponse.json(
      {
        ok: true,
        data: {
          total: finalRecs.length,
          insertedCount: persistResult.inserted,
          attemptedInsertCount: persistResult.attempted,
          items: finalRecs
        }
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du refresh recommandations.'

    if (isClientAuthError(error)) {
      return NextResponse.json({ ok: false, error: { message } }, { status: 401 })
    }

    return NextResponse.json({ ok: false, error: { message } }, { status: 500 })
  }
}
