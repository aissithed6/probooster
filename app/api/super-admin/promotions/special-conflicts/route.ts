import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type ConflictRequestBody = {
  start_date?: string | null
  end_date?: string | null
  applicable_products?: string[] | null
  applicable_categories?: string[] | null
  applicable_vendors?: string[] | null
}

/**
 * Normalise une date de promotion (YYYY-MM-DD ou ISO) vers une borne UTC stable.
 * - mode=start => 00:00:00.000Z
 * - mode=end => 23:59:59.999Z
 */
function normalizePromotionDateBoundaryUtc(value: unknown, mode: 'start' | 'end'): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const datePartCandidate = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(datePartCandidate)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  const hours = mode === 'start' ? 0 : 23
  const minutes = mode === 'start' ? 0 : 59
  const seconds = mode === 'start' ? 0 : 59
  const ms = mode === 'start' ? 0 : 999

  const iso = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, ms)).toISOString()
  return iso
}

/**
 * POST /api/super-admin/promotions/special-conflicts
 * Détecte les conflits (non-cumul) entre une promotion spéciale planifiée et les promotions classiques actives.
 * Retourne la liste des produits ciblés qui ont déjà une promo classique sur la même période, et une date conseillée.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = (await request.json().catch(() => null)) as ConflictRequestBody | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const startRaw = typeof body.start_date === 'string' && body.start_date ? body.start_date : new Date().toISOString()
    const endRaw = typeof body.end_date === 'string' && body.end_date ? body.end_date : null

    if (!endRaw) {
      return NextResponse.json({ error: 'end_date requis.' }, { status: 400 })
    }

    const startIso = normalizePromotionDateBoundaryUtc(startRaw, 'start') ?? startRaw
    const endIso = normalizePromotionDateBoundaryUtc(endRaw, 'end')
    if (!endIso) {
      return NextResponse.json({ error: 'end_date invalide (attendu: YYYY-MM-DD).' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const baseProductIds = Array.isArray(body.applicable_products) ? body.applicable_products : []
    const categories = Array.isArray(body.applicable_categories) ? body.applicable_categories : []
    const vendors = Array.isArray(body.applicable_vendors) ? body.applicable_vendors : []

    const targeted = new Set<string>()
    for (const pid of baseProductIds) {
      if (typeof pid === 'string' && pid) targeted.add(pid)
    }

    if (categories.length > 0) {
      const { data: catAssignments, error: catErr } = await supabase
        .from('product_category_assignments')
        .select('product_id')
        .in('category_id', categories)

      if (catErr) throw catErr
      for (const row of catAssignments || []) {
        const pid = (row as any)?.product_id
        if (pid) targeted.add(pid)
      }
    }

    if (vendors.length > 0) {
      if (baseProductIds.length === 0 && categories.length === 0) {
        const { data: venProds, error: venErr } = await supabase
          .from('user_products')
          .select('id')
          .in('vendor_id', vendors)
          .neq('product_status', 'archived')
        if (venErr) throw venErr
        for (const p of venProds || []) {
          const pid = (p as any)?.id
          if (pid) targeted.add(pid)
        }
      } else if (targeted.size > 0) {
        const { data: filtered, error: filterErr } = await supabase
          .from('user_products')
          .select('id')
          .in('id', Array.from(targeted))
          .in('vendor_id', vendors)
          .neq('product_status', 'archived')

        if (filterErr) throw filterErr
        targeted.clear()
        for (const p of filtered || []) {
          const pid = (p as any)?.id
          if (pid) targeted.add(pid)
        }
      }
    }

    if (targeted.size === 0) {
      return NextResponse.json({ data: { conflictCount: 0, conflicts: [], suggestedStartDate: null } }, { status: 200 })
    }

    // Promotions classiques qui chevauchent la période prévue
    const { data: promos, error: promErr } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', endIso)
      .gte('end_date', startIso)

    if (promErr) throw promErr

    const promotions = (promos ?? []) as any[]

    const conflictProductIds = new Set<string>()
    let latestPromoEnd: Date | null = null

    for (const promo of promotions) {
      const ids = new Set<string>()

      const explicitProductIds = Array.isArray(promo?.applicable_products) ? promo.applicable_products : []
      const promoCategories = Array.isArray(promo?.applicable_categories) ? promo.applicable_categories : []
      const promoVendors = Array.isArray(promo?.applicable_vendors) ? promo.applicable_vendors : []

      for (const pid of explicitProductIds) {
        if (typeof pid === 'string' && pid && targeted.has(pid)) ids.add(pid)
      }

      if (promoCategories.length > 0) {
        const { data: catAssignments, error: catErr } = await supabase
          .from('product_category_assignments')
          .select('product_id')
          .in('category_id', promoCategories)
          .in('product_id', Array.from(targeted))

        if (catErr) throw catErr
        for (const row of catAssignments || []) {
          const pid = (row as any)?.product_id
          if (pid) ids.add(pid)
        }
      }

      if (promoVendors.length > 0) {
        if (explicitProductIds.length === 0 && promoCategories.length === 0) {
          const { data: venProds, error: venErr } = await supabase
            .from('user_products')
            .select('id')
            .in('vendor_id', promoVendors)
            .in('id', Array.from(targeted))
            .neq('product_status', 'archived')
          if (venErr) throw venErr
          for (const p of venProds || []) {
            const pid = (p as any)?.id
            if (pid) ids.add(pid)
          }
        } else if (ids.size > 0) {
          const { data: filtered, error: filterErr } = await supabase
            .from('user_products')
            .select('id')
            .in('id', Array.from(ids))
            .in('vendor_id', promoVendors)
            .neq('product_status', 'archived')

          if (filterErr) throw filterErr
          ids.clear()
          for (const p of filtered || []) {
            const pid = (p as any)?.id
            if (pid) ids.add(pid)
          }
        }
      }

      if (ids.size > 0) {
        const endRaw = promo?.end_date
        if (typeof endRaw === 'string') {
          const d = new Date(endRaw)
          if (!Number.isNaN(d.getTime())) {
            latestPromoEnd = latestPromoEnd
              ? (d.getTime() > latestPromoEnd.getTime() ? d : latestPromoEnd)
              : d
          }
        }
      }

      ids.forEach((id) => conflictProductIds.add(id))
    }

    const suggestedStartDate = latestPromoEnd
      ? new Date(
          Date.UTC(
            latestPromoEnd.getUTCFullYear(),
            latestPromoEnd.getUTCMonth(),
            latestPromoEnd.getUTCDate() + 1,
            0,
            0,
            0,
            0
          )
        ).toISOString()
      : null

    return NextResponse.json(
      {
        data: {
          conflictCount: conflictProductIds.size,
          conflicts: Array.from(conflictProductIds).slice(0, 200),
          suggestedStartDate
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('POST /api/super-admin/promotions/special-conflicts failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur interne.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
