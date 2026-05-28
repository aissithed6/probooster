import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '../../../../lib/supabase'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  activeOnly: z.coerce.boolean().optional()
})

/**
 * GET /api/public/site-events
 * Retourne les événements (calendrier marketing) pour affichage côté site.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const cacheHeaders = {
      // Cache court pour éviter les 10s à chaque ouverture, tout en restant “frais”.
      // Le client force déjà un refetch max toutes les 60s.
      'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
    }

    const limit = parsed.data.limit ?? 50
    const activeOnly = parsed.data.activeOnly ?? true

    const supabase = getSupabaseAdmin()

    /**
     * Charge les KPI / statistiques affichées dans le modal calendrier.
     */
    const loadStats = async (itemsForCategories: Array<{ categoryKey?: string }> = []) => {
      const todayIso = new Date().toISOString().slice(0, 10)

      // 'exact' peut être lent selon la taille des tables. 'estimated' est nettement plus rapide.
      const [upcomingRes, peopleRes, statsRes] = await Promise.all([
        supabase
          .from('site_events')
          .select('id', { count: 'estimated', head: true })
          .eq('is_active', true)
          .gte('event_date', todayIso),
        supabase
          .from('client_alert_subscriptions')
          .select('id', { count: 'estimated', head: true })
          .eq('is_active', true),
        supabase
          .from('site_event_stats')
          .select('people_registered,satisfaction_rate')
          .eq('id', 1)
          .maybeSingle()
      ])

      if (upcomingRes.error) throw new Error(upcomingRes.error.message)
      if (peopleRes.error) throw new Error(peopleRes.error.message)
      if (statsRes.error) throw new Error(statsRes.error.message)

      const categoriesCount = new Set(
        (itemsForCategories ?? [])
          .map((r: any) => String(r?.categoryKey ?? '').trim())
          .filter((x) => x.length > 0)
      ).size

      const peopleFromSubscriptions = Number(peopleRes.count ?? 0) || 0
      const peopleFromStats = Number((statsRes.data as any)?.people_registered ?? 0) || 0
      const peopleRegistered = Math.max(peopleFromSubscriptions, peopleFromStats)

      const satisfactionRateRaw = Number((statsRes.data as any)?.satisfaction_rate ?? 0)

      return {
        upcomingCount: Number(upcomingRes.count ?? 0) || 0,
        categoriesCount,
        peopleRegistered,
        satisfactionRate: Number.isFinite(satisfactionRateRaw) ? satisfactionRateRaw : 0
      }
    }

    let query = supabase
      .from('site_events')
      .select(
        'id,title,description,event_date,event_time,category_key,category_label,category_icon,discount,status,is_active,created_at,updated_at'
      )
      .order('event_date', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: cacheHeaders })
    }

    const items = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.event_date,
      time: row.event_time,
      categoryKey: row.category_key,
      categoryLabel: row.category_label,
      categoryIcon: row.category_icon,
      discount: row.discount,
      status: row.status,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null
    }))

    const stats = await loadStats(items)

    return NextResponse.json({ data: { items, count: items.length, stats } }, { status: 200, headers: cacheHeaders })
  } catch (error) {
    console.error('GET /api/public/site-events failed:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des événements.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
