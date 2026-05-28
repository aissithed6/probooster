import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

/**
 * Lit la préférence privacy.shareStats depuis preferences (best-effort).
 */
function resolveShareStatsEnabled(preferences: unknown): boolean {
  const prefs = asObject(preferences)
  const privacy = asObject((prefs as any)?.privacy)
  const raw = (privacy as any)?.shareStats
  if (typeof raw === 'boolean') return raw
  if (raw === 1 || raw === '1' || raw === 'true') return true
  if (raw === 0 || raw === '0' || raw === 'false') return false
  return true
}

/**
 * GET /api/vendor/shares-stats
 * Retourne les statistiques de partage/interaction du vendeur.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    try {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', vendorId)
        .maybeSingle()

      const enabled = resolveShareStatsEnabled((profileRow as any)?.preferences)
      if (!enabled) {
        return NextResponse.json(
          {
            data: {
              shareStats: null,
              interactionStats: null
            }
          },
          { status: 200 }
        )
      }
    } catch {
      // Si la lecture préférences échoue, on reste permissif (comportement existant).
    }

    const [shareStatsResult, interactionStatsResult] = await Promise.all([
      supabase.from('vendor_share_stats').select('*').eq('vendor_id', vendorId).maybeSingle(),
      supabase.from('share_interaction_stats').select('*').eq('vendor_id', vendorId).maybeSingle()
    ])

    if (shareStatsResult.error) {
      console.warn('⚠️ GET /api/vendor/shares-stats: vendor_share_stats failed:', shareStatsResult.error)
    }

    if (interactionStatsResult.error) {
      console.warn('⚠️ GET /api/vendor/shares-stats: share_interaction_stats failed:', interactionStatsResult.error)
    }

    return NextResponse.json(
      {
        data: {
          shareStats: shareStatsResult.data ?? null,
          interactionStats: interactionStatsResult.data ?? null
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ GET /api/vendor/shares-stats unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
