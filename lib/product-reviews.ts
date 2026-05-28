import type { SupabaseClient } from '@supabase/supabase-js'

export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export type ReviewFlagRow = {
  id?: string
  review_id?: string
  reporter_id?: string
  reason?: string
  details?: string | null
  status?: string
  created_at?: string
}

export type ReviewModerationEventRow = {
  review_id?: string
  action?: string
  created_at?: string
  payload?: { reason?: string | null } | null
}

export type ReviewResponseRow = {
  id?: string
  review_id?: string
  vendor_id?: string
  content?: string
  status?: string
  created_at?: string
  updated_at?: string
}

const OPEN_FLAG_STATUSES = new Set(['open', 'investigating', 'pending'])

/**
 * Détermine si un signalement est encore ouvert.
 */
export function hasOpenReviewFlag(flags: ReviewFlagRow[] | undefined | null): boolean {
  return (flags ?? []).some((flag) => {
    const status = String(flag?.status ?? 'open').toLowerCase()
    return OPEN_FLAG_STATUSES.has(status)
  })
}

/**
 * Résout le statut effectif d'un avis à partir de la modération et des signalements.
 */
export function normalizeReviewStatus(value: unknown): ReviewModerationStatus | null {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'pending' || raw === 'approved' || raw === 'rejected' || raw === 'flagged') {
    return raw
  }
  return null
}

export function resolveReviewStatus(params: {
  storedStatus?: string | null
  latestModerationAction?: string | null
  hasOpenFlag?: boolean
}): ReviewModerationStatus {
  if (params.hasOpenFlag) {
    return 'flagged'
  }

  const stored = normalizeReviewStatus(params.storedStatus)
  if (stored) {
    return stored
  }

  const raw = String(params.latestModerationAction ?? '').trim().toLowerCase()
  if (!raw) {
    return 'approved'
  }

  if (raw === 'review_approve' || raw === 'approve') {
    return 'approved'
  }
  if (raw === 'review_reject' || raw === 'reject') {
    return 'rejected'
  }
  if (raw === 'review_flag' || raw === 'flag') {
    return 'flagged'
  }
  if (raw === 'review_edit' || raw === 'edit') {
    return 'pending'
  }

  return 'approved'
}

/**
 * Indique si un avis doit être visible sur les pages publiques et dans les agrégats note/avis.
 */
export function isPublicReviewStatus(status: ReviewModerationStatus): boolean {
  return status === 'approved'
}

/**
 * Déduit le sentiment à partir de la note.
 */
export function deriveReviewSentiment(rating: number): 'positive' | 'negative' | 'neutral' {
  if (rating >= 4) return 'positive'
  if (rating <= 2) return 'negative'
  return 'neutral'
}

/**
 * Estime l'impact d'un avis pour l'UI vendeur.
 */
export function deriveReviewImpact(
  rating: number,
  hasOpenFlag: boolean
): 'high' | 'medium' | 'low' {
  if (hasOpenFlag || rating <= 2) return 'high'
  if (rating === 3) return 'medium'
  return 'low'
}

/**
 * Charge la dernière action de modération par avis.
 */
export async function fetchLatestModerationByReviewId(
  supabase: SupabaseClient,
  reviewIds: string[]
): Promise<Map<string, ReviewModerationEventRow>> {
  const map = new Map<string, ReviewModerationEventRow>()
  if (reviewIds.length === 0) {
    return map
  }

  const { data, error } = await supabase
    .from('product_review_moderation_events')
    .select('review_id, action, created_at, payload')
    .in('review_id', reviewIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('⚠️ fetchLatestModerationByReviewId:', error.message)
    return map
  }

  ;(data ?? []).forEach((row: any) => {
    const reviewId = row?.review_id ? String(row.review_id) : ''
    if (!reviewId || map.has(reviewId)) {
      return
    }
    map.set(reviewId, row as ReviewModerationEventRow)
  })

  return map
}

/**
 * Recalcule et persiste la note moyenne / le nombre d'avis approuvés pour un produit.
 */
export async function syncProductReviewStats(
  supabase: SupabaseClient,
  productId: string
): Promise<{ averageRating: number; reviewCount: number }> {
  const normalizedProductId = String(productId || '').trim()
  if (!normalizedProductId) {
    return { averageRating: 0, reviewCount: 0 }
  }

  const { data: reviewRows, error: reviewErr } = await supabase
    .from('product_reviews')
    .select('rating')
    .eq('product_id', normalizedProductId)
    .eq('status', 'approved')

  if (reviewErr) {
    throw reviewErr
  }

  const approvedRatings = (Array.isArray(reviewRows) ? reviewRows : [])
    .map((row: any) => Number(row?.rating ?? NaN))
    .filter((rating): rating is number => Number.isFinite(rating))

  const reviewCount = approvedRatings.length
  const averageRating =
    reviewCount > 0 ? Number((approvedRatings.reduce((sum, rating) => sum + rating, 0) / reviewCount).toFixed(2)) : 0

  const nowIso = new Date().toISOString()

  await supabase.from('product_statistics').upsert(
    {
      product_id: normalizedProductId,
      average_rating: averageRating,
      review_count: reviewCount,
      updated_at: nowIso
    } as any,
    { onConflict: 'product_id' }
  )

  await supabase
    .from('user_products')
    .update({
      rating: averageRating,
      total_reviews: reviewCount,
      updated_at: nowIso
    } as any)
    .eq('id', normalizedProductId)

  return { averageRating, reviewCount }
}

/**
 * Enregistre une action de modération et synchronise les stats produit associées.
 */
export async function recordReviewModeration(params: {
  supabase: SupabaseClient
  reviewId: string
  productId: string
  action: 'approve' | 'reject' | 'flag' | 'edit'
  actorId?: string | null
  reason?: string | null
}): Promise<ReviewModerationStatus> {
  const actionKey = params.action.startsWith('review_') ? params.action : `review_${params.action}`

  const status = resolveReviewStatus({
    latestModerationAction: actionKey,
    hasOpenFlag: params.action === 'flag'
  })

  const { error } = await supabase.from('product_review_moderation_events').insert({
    review_id: String(params.reviewId),
    actor_id: params.actorId ?? null,
    action: actionKey,
    payload: { reason: params.reason ?? null }
  } as any)

  if (error) {
    throw error
  }

  const nowIso = new Date().toISOString()
  await supabase
    .from('product_reviews')
    .update({
      status,
      moderated_at: nowIso,
      moderated_by: params.actorId ?? null,
      status_reason: params.reason ?? null,
      updated_at: nowIso
    } as any)
    .eq('id', params.reviewId)

  await syncProductReviewStats(params.supabase, params.productId)

  return status
}

/**
 * Vérifie qu'un avis appartient à un produit du vendeur connecté.
 */
export async function assertVendorOwnsReview(
  supabase: SupabaseClient,
  vendorId: string,
  reviewId: string
): Promise<{ reviewId: string; productId: string }> {
  const { data: reviewRow, error: reviewErr } = await supabase
    .from('product_reviews')
    .select('id, product_id')
    .eq('id', reviewId)
    .maybeSingle()

  if (reviewErr) {
    throw reviewErr
  }

  if (!reviewRow?.product_id) {
    throw new Error('Avis introuvable.')
  }

  const productId = String(reviewRow.product_id)

  const { data: productRow, error: productErr } = await supabase
    .from('user_products')
    .select('id, vendor_id')
    .eq('id', productId)
    .maybeSingle()

  if (productErr) {
    throw productErr
  }

  if (!productRow?.vendor_id || String(productRow.vendor_id) !== String(vendorId)) {
    throw new Error('Accès refusé: cet avis ne concerne pas vos produits.')
  }

  return { reviewId: String(reviewRow.id), productId }
}

export type VendorReviewUiItem = {
  id: string
  customerId: string
  customerName: string
  customerAvatar: string
  productId: string
  productName: string
  productImage: string
  category: string
  subcategory: string
  rating: number
  title: string
  content: string
  images: string[]
  createdAt: string
  status: ReviewModerationStatus
  isVerified: boolean
  helpfulCount: number
  replyCount: number
  sellerReply?: {
    content: string
    createdAt: string
    status: string
  }
  flags: Array<{
    id: string
    reason: string
    reporterId: string
    reporterName: string
    createdAt: string
    status: 'pending' | 'resolved' | 'dismissed'
  }>
  sentiment: 'positive' | 'negative' | 'neutral'
  impact: 'high' | 'medium' | 'low'
}

/**
 * Construit les avis enrichis pour le dashboard vendeur / super admin.
 */
export function mapReviewRowsToUiItems(params: {
  rows: any[]
  productsById: Map<string, any>
  profileByUserId: Map<string, any>
  responseByReviewId: Map<string, ReviewResponseRow>
  flagsByReviewId: Map<string, ReviewFlagRow[]>
  moderationByReviewId: Map<string, ReviewModerationEventRow>
  reporterNameByUserId?: Map<string, string>
}): VendorReviewUiItem[] {
  return params.rows.map((row: any) => {
    const reviewerId = String(row.user_id ?? '')
    const profile = params.profileByUserId.get(reviewerId)
    const product = params.productsById.get(String(row.product_id ?? ''))
    const customerName = `${String(profile?.first_name ?? '')} ${String(profile?.last_name ?? '')}`.trim()

    const rid = String(row.id)
    const flags = params.flagsByReviewId.get(rid) ?? []
    const openFlag = hasOpenReviewFlag(flags)
    const latestModeration = params.moderationByReviewId.get(rid)
    const status = resolveReviewStatus({
      storedStatus: row?.status ?? null,
      latestModerationAction: latestModeration?.action ?? null,
      hasOpenFlag: openFlag
    })

    const response = params.responseByReviewId.get(rid)
    const rating = Number(row.rating ?? 0)

    const sellerReply = response
      ? {
          content: String(response?.content ?? ''),
          createdAt: String(response?.created_at ?? response?.updated_at ?? new Date().toISOString()),
          status: String(response?.status ?? 'pending')
        }
      : undefined

    return {
      id: rid,
      customerId: reviewerId,
      customerName: customerName || 'Client',
      customerAvatar: String(profile?.avatar_url ?? ''),
      productId: String(row.product_id ?? ''),
      productName: String(product?.name ?? 'Produit'),
      productImage: String(product?.main_image ?? product?.images?.[0] ?? ''),
      category: String(product?.category ?? ''),
      subcategory: String(product?.subcategory ?? ''),
      rating,
      title: String(row.title ?? ''),
      content: String(row.comment ?? row.content ?? ''),
      images: Array.isArray(row.images) ? row.images.map((value: any) => String(value)) : [],
      createdAt: String(row.created_at ?? new Date().toISOString()),
      status,
      isVerified: Boolean(row.is_verified_purchase ?? row.isVerified ?? false),
      helpfulCount: Number(row.helpful_votes ?? row.helpfulCount ?? 0),
      replyCount: response ? 1 : 0,
      sellerReply,
      flags: flags.map((flag: any) => {
        const reporterId = String(flag?.reporter_id ?? '')
        return {
          id: String(flag?.id ?? ''),
          reason: String(flag?.reason ?? ''),
          reporterId,
          reporterName: params.reporterNameByUserId?.get(reporterId) ?? '',
          createdAt: String(flag?.created_at ?? new Date().toISOString()),
          status: (() => {
            const raw = String(flag?.status ?? 'open')
            if (raw === 'resolved') return 'resolved' as const
            if (raw === 'dismissed') return 'dismissed' as const
            return 'pending' as const
          })()
        }
      }),
      sentiment: deriveReviewSentiment(rating),
      impact: deriveReviewImpact(rating, openFlag)
    }
  })
}

/**
 * Calcule les statistiques de réputation à partir d'une liste d'avis UI.
 */
/**
 * Agrège note moyenne et nombre d'avis publics (approuvés) par produit.
 */
export async function fetchApprovedReviewAggregates(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<Record<string, { averageRating: number; reviewCount: number }>> {
  const aggregates: Record<string, { averageRating: number; reviewCount: number }> = {}
  if (productIds.length === 0) {
    return aggregates
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .select('product_id, rating')
    .in('product_id', productIds)
    .eq('status', 'approved')

  if (error) {
    console.warn('⚠️ fetchApprovedReviewAggregates:', error.message)
    return aggregates
  }

  const sums: Record<string, { sum: number; count: number }> = {}

  ;(Array.isArray(data) ? data : []).forEach((row: any) => {
    const productId = String(row?.product_id ?? '')
    if (!productId) return

    const rating = Number(row?.rating ?? NaN)
    if (!Number.isFinite(rating)) return

    if (!sums[productId]) {
      sums[productId] = { sum: 0, count: 0 }
    }
    sums[productId].sum += rating
    sums[productId].count += 1
  })

  Object.entries(sums).forEach(([productId, info]) => {
    const count = info.count
    aggregates[productId] = {
      averageRating: count > 0 ? Number((info.sum / count).toFixed(2)) : 0,
      reviewCount: count
    }
  })

  return aggregates
}

/**
 * Filtre les lignes d'avis pour l'affichage public (catalogue, fiche produit).
 */
export function filterPublicReviewRows<T extends { id?: string }>(params: {
  rows: T[]
  moderationByReviewId: Map<string, ReviewModerationEventRow>
  flagsByReviewId?: Map<string, ReviewFlagRow[]>
}): T[] {
  return params.rows.filter((row) => {
    const reviewId = String((row as any)?.id ?? '')
    if (!reviewId) return false

    const flags = params.flagsByReviewId?.get(reviewId) ?? []
    const status = resolveReviewStatus({
      latestModerationAction: params.moderationByReviewId.get(reviewId)?.action ?? null,
      hasOpenFlag: hasOpenReviewFlag(flags)
    })

    return isPublicReviewStatus(status)
  })
}

export function computeReputationStats(reviews: VendorReviewUiItem[]) {
  const approvedReviews = reviews.filter((review) => review.status === 'approved')
  const totalReviews = approvedReviews.length
  const ratings = approvedReviews.map((review) => Number(review.rating)).filter((value) => Number.isFinite(value))

  const averageRating =
    ratings.length > 0 ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2)) : 0

  const ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<'1' | '2' | '3' | '4' | '5', number>
  approvedReviews.forEach((review) => {
    const bucket = Math.round(Number(review.rating))
    if (bucket >= 1 && bucket <= 5) {
      const key = String(bucket) as keyof typeof ratingDistribution
      ratingDistribution[key] += 1
    }
  })

  const withResponse = approvedReviews.filter((review) => Boolean(review.sellerReply?.content)).length
  const withApprovedResponse = approvedReviews.filter(
    (review) => String(review.sellerReply?.status ?? '').toLowerCase() === 'approved'
  ).length

  const responseRate = withResponse > 0 ? Math.round((withApprovedResponse / withResponse) * 100) : 0
  const verifiedReviews = approvedReviews.filter((review) => review.isVerified).length

  const responseDurations: number[] = []
  approvedReviews.forEach((review) => {
    if (!review.sellerReply?.createdAt) return
    const start = new Date(review.createdAt).getTime()
    const end = new Date(review.sellerReply.createdAt).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return
    responseDurations.push((end - start) / (1000 * 60 * 60))
  })

  const averageResponseTime =
    responseDurations.length > 0
      ? Number((responseDurations.reduce((sum, hours) => sum + hours, 0) / responseDurations.length).toFixed(1))
      : 0

  return {
    overallRating: averageRating,
    totalReviews,
    ratingDistribution,
    averageResponseTime,
    responseRate,
    helpfulReviewsPercentage: 0,
    verifiedReviewsPercentage: totalReviews > 0 ? Math.round((verifiedReviews / totalReviews) * 100) : 0,
    monthlyTrends: [] as Array<{ month: string; rating: number; reviews: number }>
  }
}
