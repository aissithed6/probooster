'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { OrderRepository } from '@/lib/repositories/order-repository'

/**
 * POST /api/super-admin/orders/purge-cancelled
 * Purge les commandes annulées (status = cancelled) plus anciennes que X jours.
 * - Réservé au super-admin.
 * - Suppression définitive (orders + dépendances) via OrderRepository.deleteOrderById.
 *
 * Entrées:
 * - JSON { days?: number, limit?: number }
 * - ou querystring ?days=7&limit=200
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const requestSecret = request.headers.get('x-cron-secret') ?? ''
    const isCronAuthorized = Boolean(cronSecret) && requestSecret === cronSecret

    if (!isCronAuthorized) {
      await assertSuperAdmin(request)
    }

    const url = new URL(request.url)
    const body = await request.json().catch(() => ({} as any))

    const daysRaw = body?.days ?? url.searchParams.get('days')
    const limitRaw = body?.limit ?? url.searchParams.get('limit')

    const days = Number(daysRaw ?? 7)
    const limit = Number(limitRaw ?? 200)

    const resolvedDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 7
    const resolvedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 500) : 200

    const cutoff = new Date(Date.now() - resolvedDays * 24 * 60 * 60 * 1000).toISOString()

    const supabase = getSupabaseAdmin()

    const { data: rows, error } = await supabase
      .from('orders')
      .select('id, updated_at, created_at, status')
      .eq('status', 'cancelled')
      // On se base sur updated_at si présent, sinon created_at.
      .or(`updated_at.lte.${cutoff},and(updated_at.is.null,created_at.lte.${cutoff})`)
      .order('created_at', { ascending: true })
      .limit(resolvedLimit)

    if (error) {
      console.error('❌ purge-cancelled: orders select failed:', error)
      return NextResponse.json({ error: 'Impossible de charger les commandes annulées.' }, { status: 500 })
    }

    const orderIds = (rows ?? [])
      .map((r: any) => (typeof r?.id === 'string' ? r.id : null))
      .filter((v: any): v is string => typeof v === 'string' && v.length > 0)

    let deleted = 0
    const failures: Array<{ id: string; error: string }> = []

    for (const id of orderIds) {
      try {
        await OrderRepository.deleteOrderById(id)
        deleted += 1
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue.'
        failures.push({ id, error: message })
      }
    }

    return NextResponse.json(
      {
        data: {
          scanned: orderIds.length,
          deleted,
          failures,
          days: resolvedDays,
          cutoff,
          limit: resolvedLimit,
          executedAs: isCronAuthorized ? 'cron' : 'super_admin'
        }
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('❌ POST /api/super-admin/orders/purge-cancelled failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.includes('Accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
