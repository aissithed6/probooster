import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../_helpers/auth'
import {
  deriveReviewSentiment,
  fetchLatestModerationByReviewId,
  hasOpenReviewFlag,
  resolveReviewStatus
} from '@/lib/product-reviews'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/super-admin/reviews
 * Retourne la liste des avis produits (table product_reviews) enrichis avec user_profiles + user_products.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 50), 1), 200)
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0)

    const { data: reviewRows, error: reviewErr, count } = await supabase
      .from('product_reviews')
      .select('id, product_id, user_id, rating, title, comment, is_verified_purchase, helpful_votes, created_at, updated_at, status, status_reason, moderated_at, moderated_by', {
        count: 'exact'
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (reviewErr) {
      const message = reviewErr.message ?? reviewErr.hint ?? reviewErr.details ?? 'Impossible de charger les avis.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const rows = Array.isArray(reviewRows) ? reviewRows : []

    const reviewIds = Array.from(
      new Set(rows.map((row: any) => row?.id).filter((id: any) => typeof id === 'string'))
    ) as string[]

    const productIds = Array.from(
      new Set(rows.map((row: any) => row?.product_id).filter((id: any) => typeof id === 'string'))
    ) as string[]

    const reviewerIds = Array.from(
      new Set(rows.map((row: any) => row?.user_id).filter((id: any) => typeof id === 'string'))
    ) as string[]

    const [
      { data: productRows, error: productErr },
      { data: reviewerProfiles, error: profileErr },
      { data: responseRows, error: responseErr },
      { data: flagRows, error: flagErr }
    ] = await Promise.all([
      productIds.length
        ? supabase
            .from('user_products')
            .select('id, name, main_image, vendor_id, category')
            .in('id', productIds)
        : Promise.resolve({ data: [], error: null } as any),
      reviewerIds.length
        ? supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name, avatar_url')
            .in('user_id', reviewerIds)
        : Promise.resolve({ data: [], error: null } as any),
      reviewIds.length
        ? supabase
            .from('product_review_responses')
            .select('id, review_id, vendor_id, content, status, created_at, updated_at')
            .in('review_id', reviewIds)
        : Promise.resolve({ data: [], error: null } as any),
      reviewIds.length
        ? supabase
            .from('product_review_flags')
            .select('id, review_id, reporter_id, reason, details, status, created_at, updated_at, investigating_at, resolved_at, dismissed_at')
            .in('review_id', reviewIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any)
    ])

    const vendorIds = Array.from(
      new Set((responseRows ?? []).map((row: any) => row?.vendor_id).filter((id: any) => typeof id === 'string'))
    ) as string[]

    const reporterIds = Array.from(
      new Set((flagRows ?? []).map((row: any) => row?.reporter_id).filter((id: any) => typeof id === 'string'))
    ) as string[]

    const actorIds = Array.from(new Set([...vendorIds, ...reporterIds].filter(Boolean)))

    const { data: actorProfiles, error: actorProfilesErr } = actorIds.length
      ? await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', actorIds)
      : ({ data: [], error: null } as any)

    if (actorProfilesErr) {
      console.warn('⚠️ GET /api/super-admin/reviews: actor profiles lookup failed:', actorProfilesErr)
    }

    if (productErr) {
      console.warn('⚠️ GET /api/super-admin/reviews: user_products lookup failed:', productErr)
    }
    if (profileErr) {
      console.warn('⚠️ GET /api/super-admin/reviews: reviewer profiles lookup failed:', profileErr)
    }
    if (responseErr) {
      console.warn('⚠️ GET /api/super-admin/reviews: review responses lookup failed:', responseErr)
    }
    if (flagErr) {
      console.warn('⚠️ GET /api/super-admin/reviews: review flags lookup failed:', flagErr)
    }

    const productById = new Map<string, any>()
    ;(productRows ?? []).forEach((product: any) => {
      if (product?.id) {
        productById.set(String(product.id), product)
      }
    })

    const profileByUserId = new Map<string, any>()
    ;(reviewerProfiles ?? []).forEach((profile: any) => {
      if (profile?.user_id) {
        profileByUserId.set(String(profile.user_id), profile)
      }
    })

    const actorProfileByUserId = new Map<string, any>()
    ;(actorProfiles ?? []).forEach((profile: any) => {
      if (profile?.user_id) {
        actorProfileByUserId.set(String(profile.user_id), profile)
      }
    })

    const responseByReviewId = new Map<string, any>()
    ;(responseRows ?? []).forEach((row: any) => {
      const rid = row?.review_id
      if (rid) {
        responseByReviewId.set(String(rid), row)
      }
    })

    const flagsByReviewId = new Map<string, any[]>()
    ;(flagRows ?? []).forEach((row: any) => {
      const rid = row?.review_id
      if (!rid) return
      const key = String(rid)
      const current = flagsByReviewId.get(key) ?? []
      current.push(row)
      flagsByReviewId.set(key, current)
    })

    const moderationByReviewId = await fetchLatestModerationByReviewId(supabase, reviewIds)

    const items = rows.map((row: any) => {
      const profile = profileByUserId.get(String(row.user_id))
      const product = productById.get(String(row.product_id))
      const userName = `${String(profile?.first_name ?? '')} ${String(profile?.last_name ?? '')}`.trim()

      const rid = String(row.id)
      const response = responseByReviewId.get(rid)
      const flags = flagsByReviewId.get(rid) ?? []
      const openFlag = hasOpenReviewFlag(flags)
      const status = resolveReviewStatus({
        latestModerationAction: moderationByReviewId.get(rid)?.action ?? null,
        hasOpenFlag: openFlag
      })
      const rating = Number(row.rating ?? 0)

      const responsePayload = response
        ? {
            id: String(response?.id ?? ''),
            vendorId: String(response?.vendor_id ?? ''),
            vendorName: (() => {
              const p = actorProfileByUserId.get(String(response?.vendor_id ?? ''))
              const name = `${String(p?.first_name ?? '')} ${String(p?.last_name ?? '')}`.trim()
              return name
            })(),
            content: String(response?.content ?? ''),
            date: String(response?.created_at ?? response?.updated_at ?? new Date().toISOString()),
            status: String(response?.status ?? 'pending'),
            isPublic: String(response?.status ?? 'pending') === 'approved'
          }
        : undefined

      return {
        id: String(row.id),
        userId: String(row.user_id),
        userName: userName || 'Client',
        userEmail: '',
        userAvatar: String(profile?.avatar_url ?? ''),
        productId: String(row.product_id),
        productName: String(product?.name ?? 'Produit'),
        productImage: String(product?.main_image ?? ''),
        vendorId: String(product?.vendor_id ?? ''),
        vendorName: '',
        rating,
        comment: String(row.comment ?? ''),
        date: String(row.created_at ?? new Date().toISOString()),
        verified: Boolean(row.is_verified_purchase ?? false),
        helpful: Number(row.helpful_votes ?? 0),
        unhelpful: 0,
        status,
        isVideo: false,
        tags: [],
        category: String(product?.category ?? ''),
        sentiment: deriveReviewSentiment(rating),
        language: 'fr',
        device: '',
        location: '',
        response: responsePayload
      }
    })

    const approvedItems = items.filter((item: any) => item.status === 'approved')
    const ratings = approvedItems.map((item: any) => Number(item.rating)).filter((v: any) => Number.isFinite(v)) as number[]
    const totalReviews = ratings.length
    const averageRating = totalReviews > 0 ? ratings.reduce((acc, v) => acc + v, 0) / totalReviews : 0
    const verifiedReviews = items.filter((item: any) => item.verified).length

    const flaggedReviews = items.filter((item: any) => item.status === 'flagged').length
    const pendingReviews = items.filter((item: any) => item.status === 'pending').length
    const responseApprovedCount = items.filter((item: any) => item?.response?.status === 'approved').length
    const responseRate = totalReviews > 0 ? (responseApprovedCount / totalReviews) * 100 : 0

    const distribution = [5, 4, 3, 2, 1].map((rating) => {
      const count = approvedItems.filter((item: any) => item.rating === rating).length
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
      return { rating, count, percentage: Number(percentage.toFixed(1)) }
    })

    const stats = {
      totalReviews,
      averageRating,
      totalRatings: totalReviews,
      verifiedReviews,
      pendingReviews,
      flaggedReviews,
      satisfactionRate: totalReviews > 0 ? (items.filter((i: any) => i.rating >= 4).length / totalReviews) * 100 : 0,
      responseRate: Number(responseRate.toFixed(1)),
      videoReviews: 0,
      imageReviews: 0,
      monthlyGrowth: 0,
      topCategories: [],
      ratingDistribution: distribution
    }

    const reports = (flagRows ?? []).map((flag: any) => {
      const rawStatus = String(flag?.status ?? 'open')
      const status =
        rawStatus === 'resolved'
          ? 'resolved'
          : rawStatus === 'dismissed'
            ? 'dismissed'
            : rawStatus === 'investigating'
              ? 'investigating'
              : 'pending'

      const category = String(flag?.reason ?? 'other')

      const createdAt = String(flag?.created_at ?? new Date().toISOString())
      const resolvedAt = flag?.resolved_at ? String(flag.resolved_at) : null
      const dismissedAt = flag?.dismissed_at ? String(flag.dismissed_at) : null
      const investigatingAt = flag?.investigating_at ? String(flag.investigating_at) : null
      const updatedAt = flag?.updated_at ? String(flag.updated_at) : null
      const treatedAt = resolvedAt || dismissedAt || null

      return {
        id: String(flag?.id ?? ''),
        reviewId: String(flag?.review_id ?? ''),
        reporterId: String(flag?.reporter_id ?? ''),
        reporterName: (() => {
          const p = actorProfileByUserId.get(String(flag?.reporter_id ?? ''))
          const name = `${String(p?.first_name ?? '')} ${String(p?.last_name ?? '')}`.trim()
          return name
        })(),
        reason: String(flag?.reason ?? ''),
        description: String(flag?.details ?? ''),
        date: createdAt,
        createdAt,
        updatedAt,
        investigatingAt,
        resolvedAt,
        dismissedAt,
        treatedAt,
        status,
        priority: 'medium',
        category: (['inappropriate', 'spam', 'fake', 'harassment', 'other'].includes(category) ? category : 'other') as any
      }
    })

    return NextResponse.json({ data: { items, count: Number(count ?? items.length), stats, reports } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status = lower.includes('token') ? 401 : lower.includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
