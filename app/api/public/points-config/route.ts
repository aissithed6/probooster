import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type AdminPointsConfig = {
  purchaseValue: number
  withdrawalValue: number
  socialShareValue: number
  socialSharePerNetwork: Record<string, number>
  basePointsPerFCFA: number
  withdrawalMinPoints: number
}

function toLocaleNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : NaN
  }
  return Number(value)
}

/**
 * GET /api/public/points-config
 * Retourne la configuration globale des points (Super Admin) depuis `point_settings`.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const [{ data: settingsRow, error }, { data: withdrawalLimitRow, error: withdrawalLimitError }] = await Promise.all([
      supabase
        .from('point_settings')
        .select('conversion_rate, metadata, updated_at')
        .eq('scope', 'global')
        .maybeSingle(),
      supabase
        .from('point_operation_limits')
        .select('min_amount, updated_at')
        .eq('scope', 'global')
        .eq('operation_type', 'withdrawal')
        .maybeSingle()
    ])

    if (withdrawalLimitError) {
      return NextResponse.json({ error: withdrawalLimitError.message }, { status: 500 })
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!settingsRow) {
      return NextResponse.json({ data: null }, { status: 200 })
    }

    const metadata = (settingsRow.metadata ?? {}) as Record<string, any>
    const conversion = (metadata.conversion ?? {}) as Record<string, any>
    const bonuses = (metadata.bonuses ?? {}) as Record<string, any>

    const conversionRateRaw = Number((settingsRow as any)?.conversion_rate)
    const conversionRate = Number.isFinite(conversionRateRaw) && conversionRateRaw > 0 ? conversionRateRaw : 1

    const purchaseValueRaw = toLocaleNumber(conversion.purchaseValue)
    const purchaseValue = Number.isFinite(purchaseValueRaw) && purchaseValueRaw > 0 ? purchaseValueRaw : conversionRate

    const withdrawalValueRaw = toLocaleNumber((conversion as any)?.withdrawalValue)
    const withdrawalValue = Number.isFinite(withdrawalValueRaw) && withdrawalValueRaw > 0 ? withdrawalValueRaw : conversionRate

    const socialShareValueRaw = toLocaleNumber(conversion.socialShareValue)
    const socialShareValue = Number.isFinite(socialShareValueRaw) && socialShareValueRaw >= 0 ? socialShareValueRaw : 0

    const perNetworkRaw = (metadata.socialSharePerNetwork ?? conversion.socialSharePerNetwork ?? {}) as Record<string, any>
    const socialSharePerNetwork: Record<string, number> = {}

    Object.entries(perNetworkRaw).forEach(([key, value]) => {
      const normalizedKey = String(key).toLowerCase().trim()
      const numeric = toLocaleNumber(value)
      if (!normalizedKey) return
      if (!Number.isFinite(numeric) || numeric < 0) return
      socialSharePerNetwork[normalizedKey] = numeric
    })

    const basePointsRaw = toLocaleNumber((bonuses as any)?.basePointsPerFCFA)
    const basePointsPerFCFA = Number.isFinite(basePointsRaw) && basePointsRaw > 0 ? basePointsRaw : 1

    const withdrawalMinRaw = toLocaleNumber((withdrawalLimitRow as any)?.min_amount)
    const withdrawalMinPoints = Number.isFinite(withdrawalMinRaw) && withdrawalMinRaw > 0 ? withdrawalMinRaw : 5000

    const data: AdminPointsConfig = {
      purchaseValue,
      withdrawalValue,
      socialShareValue,
      socialSharePerNetwork,
      basePointsPerFCFA,
      withdrawalMinPoints
    }

    return NextResponse.json(
      {
        data,
        debug: {
          updated_at: (settingsRow as any)?.updated_at ?? null,
          conversion_rate: (settingsRow as any)?.conversion_rate ?? null,
          metadata_conversion: (metadata as any)?.conversion ?? null,
          withdrawal_limit_updated_at: (withdrawalLimitRow as any)?.updated_at ?? null,
          withdrawal_limit_min_amount: (withdrawalLimitRow as any)?.min_amount ?? null
        }
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
