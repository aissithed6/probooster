import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { DEFAULT_BOOSTING_PRICING_CONFIG } from '@/lib/services/marketing-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/public/boosting-pricing-config
 * Retourne la configuration globale des tarifs Boostage Pro.
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('boosting_pricing_config' as any)
      .select('config_json')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      return NextResponse.json(DEFAULT_BOOSTING_PRICING_CONFIG, {
        status: 200,
        headers: {
          'cache-control': 'no-store',
          'x-boosting-pricing-fallback': '1'
        }
      })
    }

    const rawConfig = (data as any)?.[0]?.config_json
    let configJson: unknown = rawConfig

    if (typeof rawConfig === 'string') {
      try {
        configJson = JSON.parse(rawConfig)
      } catch {
        configJson = rawConfig
      }
    }

    if (!configJson || typeof configJson !== 'object') {
      return NextResponse.json(DEFAULT_BOOSTING_PRICING_CONFIG, {
        status: 200,
        headers: {
          'cache-control': 'no-store',
          'x-boosting-pricing-fallback': '1'
        }
      })
    }

    return NextResponse.json(configJson, {
      status: 200,
      headers: {
        'cache-control': 'no-store',
        'x-boosting-pricing-fallback': '0'
      }
    })
  } catch (error) {
    console.error('GET /api/public/boosting-pricing-config failed:', error)
    return NextResponse.json(DEFAULT_BOOSTING_PRICING_CONFIG, {
      status: 200,
      headers: {
        'cache-control': 'no-store',
        'x-boosting-pricing-fallback': '1'
      }
    })
  }
}
