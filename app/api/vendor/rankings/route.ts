import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Parse le paramètre `range` en une valeur supportée.
 */
function parseRange(value: string | null): 'week' | 'month' | 'quarter' | 'year' {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'week' || v === 'month' || v === 'quarter' || v === 'year') return v
  return 'month'
}

/**
 * Convertit une période en nombre de jours.
 */
function getDaysForRange(range: string): number {
  if (range === 'week') return 7
  if (range === 'month') return 31
  if (range === 'quarter') return 92
  if (range === 'year') return 366
  return 31
}

/**
 * GET /api/vendor/rankings
 * Retourne les classements (table public.rankings) du vendeur authentifié.
 * Si les données sont périmées (> RECOMPUTE_MAX_AGE_HOURS, défaut 6 h) ou
 * absentes pour la période, déclenche en arrière-plan un recalcul global
 * (fire-and-forget, throttlé : au plus une fois par heure par process).
 */

// Throttle interne pour ne pas spammer le recalcul (1 max / heure / process).
let lastAutoRecomputeAt = 0
const AUTO_RECOMPUTE_MIN_INTERVAL_MS = 60 * 60 * 1000
const RECOMPUTE_MAX_AGE_MS = Number(process.env.RANKINGS_RECOMPUTE_MAX_AGE_HOURS ?? 6) * 60 * 60 * 1000

function maybeTriggerAutoRecompute(origin: string, range: string) {
  try {
    const now = Date.now()
    if (now - lastAutoRecomputeAt < AUTO_RECOMPUTE_MIN_INTERVAL_MS) return

    const secret = String(process.env.RANKINGS_RECOMPUTE_SECRET ?? '')
    if (!secret) return // pas de secret configuré → recalcul uniquement manuel par le Super Admin

    lastAutoRecomputeAt = now
    void fetch(`${origin}/api/super-admin/rankings/recompute?range=${encodeURIComponent(range)}&scope=both`, {
      method: 'POST',
      headers: { 'x-internal-recompute-secret': secret }
    })
      .then((r) => {
        if (!r.ok) console.warn(`⚠️ auto recompute rankings failed with status ${r.status}`)
      })
      .catch((e) => console.warn('⚠️ auto recompute rankings error:', e))
  } catch (e) {
    console.warn('⚠️ maybeTriggerAutoRecompute unexpected:', e)
  }
}

export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const range = parseRange(url.searchParams.get('range'))
    const days = getDaysForRange(range)
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('rankings')
      .select('*')
      .eq('user_id', vendorId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('❌ GET /api/vendor/rankings failed:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des classements.' }, { status: 500 })
    }

    const rows = data ?? []

    // Fraîcheur des données : si le dernier classement date de plus de
    // RECOMPUTE_MAX_AGE_MS (ou est absent), on planifie un recalcul global.
    const latestCreatedAt = rows.length > 0 ? String(rows[0]?.created_at ?? '') : ''
    const isStale =
      rows.length === 0 ||
      !latestCreatedAt ||
      Number.isNaN(new Date(latestCreatedAt).getTime()) ||
      Date.now() - new Date(latestCreatedAt).getTime() > RECOMPUTE_MAX_AGE_MS

    if (isStale && url.searchParams.get('noAutoRecompute') !== '1') {
      maybeTriggerAutoRecompute(url.origin, range)
    }

    return NextResponse.json({ data: rows }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/vendor/rankings unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
