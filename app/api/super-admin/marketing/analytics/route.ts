import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type PeriodKey = '1month' | '3months' | '6months' | '1year'

/**
 * Formate une date JS en YYYY-MM-DD (UTC) pour filtrer les lignes `boosting_performance.date`.
 */
function toIsoDateUtc(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Résout une période courte en bornes start/end.
 */
function resolvePeriodBounds(period: string | null): { key: PeriodKey; start: Date; end: Date } {
  const key = (period ?? '6months') as PeriodKey
  const end = new Date()
  const start = new Date(end.getTime())

  if (key === '1month') start.setMonth(end.getMonth() - 1)
  else if (key === '3months') start.setMonth(end.getMonth() - 3)
  else if (key === '6months') start.setMonth(end.getMonth() - 6)
  else start.setFullYear(end.getFullYear() - 1)

  return { key, start, end }
}

/**
 * Additionne en sécurité une colonne numérique.
 */
function sumNumber(rows: any[], key: string): number {
  return (Array.isArray(rows) ? rows : []).reduce((acc, row) => {
    const n = typeof row?.[key] === 'number' ? row[key] : Number(row?.[key] ?? 0)
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
}

/**
 * GET /api/super-admin/marketing/analytics
 * Agrège les analytics Marketing & Promos (boostage, promotions, promotions spéciales) pour le Super Admin.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const url = new URL(request.url)
    const { key, start, end } = resolvePeriodBounds(url.searchParams.get('period'))

    const startIso = start.toISOString()
    const endIso = end.toISOString()

    const startDate = toIsoDateUtc(start)
    const endDate = toIsoDateUtc(end)

    const supabase = getSupabaseAdmin()

    const startOfTodayUtc = new Date()
    startOfTodayUtc.setUTCHours(0, 0, 0, 0)
    const startOfTodayUtcIso = startOfTodayUtc.toISOString()

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    const sevenDaysFromNowIso = sevenDaysFromNow.toISOString()

    const nowIso = new Date().toISOString()

    const [performanceRes, servicesRes, promotionUsageRes, specialPromotionUsageRes, specialPromotionsRes, activePromotionsCountRes] =
      await Promise.all([
        supabase
          .from('boosting_performance')
          .select('campaign_id, impressions, clicks, conversions, revenue')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase.from('boosting_services').select('id, is_active'),
        supabase
          .from('promotion_usage')
          .select('promotion_id, order_id, discount_amount, original_amount, final_amount, used_at')
          .gte('used_at', startIso)
          .lte('used_at', endIso),
        supabase
          .from('special_promotion_usage')
          .select('special_promotion_id, order_id, discount_amount, original_amount, final_amount, used_at')
          .gte('used_at', startIso)
          .lte('used_at', endIso),
        supabase.from('special_promotions').select('id, is_active, start_date, end_date, created_at'),
        supabase
          .from('promotions')
          .select('id', { head: true, count: 'exact' })
          .eq('status', 'active')
          .lte('start_date', nowIso)
          .gte('end_date', nowIso)
      ])

    if (performanceRes.error) throw performanceRes.error
    if (servicesRes.error) throw servicesRes.error
    if (promotionUsageRes.error) throw promotionUsageRes.error
    if (specialPromotionsRes.error) throw specialPromotionsRes.error
    if (activePromotionsCountRes.error) throw activePromotionsCountRes.error

    const performanceRows = performanceRes.data ?? []
    const services = servicesRes.data ?? []
    const promotionUsages = promotionUsageRes.data ?? []
    if (specialPromotionUsageRes.error) {
      console.error('special_promotion_usage query failed (migration manquante ?):', specialPromotionUsageRes.error)
    }
    const specialPromotionUsages = specialPromotionUsageRes.error ? [] : (specialPromotionUsageRes.data ?? [])
    const specialPromotions = specialPromotionsRes.data ?? []
    const activePromotions = activePromotionsCountRes.count ?? 0

    const performanceCampaignIds = Array.from(
      new Set(
        performanceRows
          .map((r: any) => (typeof r?.campaign_id === 'string' ? r.campaign_id : null))
          .filter((v: any) => typeof v === 'string' && v.length > 0)
      )
    )

    const campaignsRes = performanceCampaignIds.length
      ? await supabase
          .from('boosting_campaigns')
          .select('id, vendor_id, type, status, total_cost, created_at')
          .in('id', performanceCampaignIds)
      : await supabase
          .from('boosting_campaigns')
          .select('id, vendor_id, type, status, total_cost, created_at')
          .gte('created_at', startIso)
          .lte('created_at', endIso)

    if (campaignsRes.error) throw campaignsRes.error
    const campaigns = campaignsRes.data ?? []

    // Boosting
    const totalBoostages = performanceCampaignIds.length > 0 ? performanceCampaignIds.length : campaigns.length
    const activeVendors = new Set(campaigns.map((c) => c.vendor_id).filter(Boolean)).size
    const spend = sumNumber(campaigns as any[], 'total_cost')

    const impressions = sumNumber(performanceRows as any[], 'impressions')
    const clicks = sumNumber(performanceRows as any[], 'clicks')
    const conversions = sumNumber(performanceRows as any[], 'conversions')
    const revenue = sumNumber(performanceRows as any[], 'revenue')

    const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0
    const conversionRate = clicks > 0 ? parseFloat(((conversions / clicks) * 100).toFixed(2)) : 0
    const roas = spend > 0 ? parseFloat((revenue / spend).toFixed(2)) : 0

    const avgCpc = clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0
    const avgCpa = conversions > 0 ? parseFloat((spend / conversions).toFixed(2)) : 0
    const revenuePerCampaign = totalBoostages > 0 ? parseFloat((revenue / totalBoostages).toFixed(2)) : 0
    const conversionsPerCampaign = totalBoostages > 0 ? parseFloat((conversions / totalBoostages).toFixed(2)) : 0

    // Services
    const totalServices = services.length
    const activeServices = services.filter((s: any) => s?.is_active === true).length

    // Promotions
    const promotionUses = promotionUsages.length
    const promoDiscountTotal = sumNumber(promotionUsages as any[], 'discount_amount')
    const promoOriginalTotal = sumNumber(promotionUsages as any[], 'original_amount')
    const promoFinalTotal = sumNumber(promotionUsages as any[], 'final_amount')

    const promoOrders = new Set(
      promotionUsages
        .map((u: any) => (typeof u?.order_id === 'string' ? u.order_id : null))
        .filter((v: any) => typeof v === 'string' && v.length > 0)
    ).size

    const promoOrderIds = Array.from(
      new Set(
        promotionUsages
          .map((u: any) => (typeof u?.order_id === 'string' ? u.order_id : null))
          .filter((v: any) => typeof v === 'string' && v.length > 0)
      )
    )

    let promoVendorCount = 0
    if (promoOrderIds.length > 0) {
      const { data: promoOrdersRows, error: promoOrdersErr } = await supabase
        .from('orders')
        .select('id, vendor_id')
        .in('id', promoOrderIds)

      if (promoOrdersErr) {
        console.error('promo vendors query failed:', promoOrdersErr)
      } else {
        promoVendorCount = new Set((promoOrdersRows ?? []).map((row: any) => row?.vendor_id).filter(Boolean)).size
      }
    }

    // Promotions spéciales
    const specialPromotionUses = specialPromotionUsages.length
    const specialPromoDiscountTotal = sumNumber(specialPromotionUsages as any[], 'discount_amount')
    const specialPromoOriginalTotal = sumNumber(specialPromotionUsages as any[], 'original_amount')
    const specialPromoFinalTotal = sumNumber(specialPromotionUsages as any[], 'final_amount')

    const specialPromoOrders = new Set(
      specialPromotionUsages
        .map((u: any) => (typeof u?.order_id === 'string' ? u.order_id : null))
        .filter((v: any) => typeof v === 'string' && v.length > 0)
    ).size

    const specialPromoOrderIds = Array.from(
      new Set(
        specialPromotionUsages
          .map((u: any) => (typeof u?.order_id === 'string' ? u.order_id : null))
          .filter((v: any) => typeof v === 'string' && v.length > 0)
      )
    )

    let specialPromoVendorCount = 0
    if (specialPromoOrderIds.length > 0) {
      const { data: rows, error } = await supabase
        .from('orders')
        .select('id, vendor_id')
        .in('id', specialPromoOrderIds)

      if (error) {
        console.error('special promo vendors query failed:', error)
      } else {
        specialPromoVendorCount = new Set((rows ?? []).map((row: any) => row?.vendor_id).filter(Boolean)).size
      }
    }

    const now = new Date()
    const activeSpecialPromotions = specialPromotions.filter((sp: any) => {
      if (sp?.is_active !== true) return false
      const endDate = typeof sp?.end_date === 'string' ? sp.end_date : null
      if (endDate && endDate < startOfTodayUtcIso) return false

      const startRaw = sp?.start_date
      if (!startRaw) return true
      const startDateParsed = new Date(startRaw)
      if (Number.isNaN(startDateParsed.getTime())) return true
      return startDateParsed <= now
    }).length

    const expiringSpecialPromotions = specialPromotions.filter((sp: any) => {
      if (sp?.is_active !== true) return false
      const endDate = typeof sp?.end_date === 'string' ? sp.end_date : null
      if (!endDate) return false
      return endDate >= startOfTodayUtcIso && endDate <= sevenDaysFromNowIso
    }).length

    return NextResponse.json(
      {
        data: {
          period: {
            key,
            startIso,
            endIso
          },
          boosting: {
            totalBoostages,
            activeVendors,
            spend,
            impressions,
            clicks,
            conversions,
            revenue,
            ctr,
            conversionRate,
            roas,
            avgCpc,
            avgCpa,
            revenuePerCampaign,
            conversionsPerCampaign
          },
          services: {
            totalServices,
            activeServices
          },
          promotions: {
            activePromotions,
            promotionUses,
            promoOrders,
            promoVendors: promoVendorCount,
            promoDiscountTotal,
            promoOriginalTotal,
            promoFinalTotal
          },
          specialPromotions: {
            totalSpecialPromotions: specialPromotions.length,
            activeSpecialPromotions,
            expiringSpecialPromotions,
            specialPromotionUses,
            specialPromoOrders,
            specialPromoVendors: specialPromoVendorCount,
            specialPromoDiscountTotal,
            specialPromoOriginalTotal,
            specialPromoFinalTotal
          }
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
    console.error('GET /api/super-admin/marketing/analytics failed:', error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des analytics marketing." },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  }
}
