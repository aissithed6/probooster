import { NextRequest, NextResponse } from 'next/server'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

interface AdminPointSettingsIn {
  pointValue: number
  transferFees: number
  exchangeFee: number
  purchaseValue: number
  purchaseFeePercent: number
  withdrawalValue: number
  socialShareValue: number
  socialSharePerNetwork: Record<string, number>
  transferMin: number
  transferMax: number
  transferDailyMax: number
  minWithdrawal: number
  maxWithdrawal: number
  basePointsPerFCFA: number
  premiumVendorBonus: number
  referralBonus: number
  firstPurchaseBonus: number
  weekendBonus: number
  bulkPurchaseBonus: number
  bulkPurchaseThreshold: number
  categoryBonuses: Record<string, number>
  fees: {
    transfer: { flat: number; percentage: number }
    exchange: { flat: number; percentage: number }
    withdrawal: { flat: number; percentage: number }
  }
}

const toNum = (v: unknown, fb: number): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fb
}
const toNullableNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Sauvegarde la configuration globale des points, des frais et des limites
 * avec le service-role (getSupabaseAdmin) pour garantir la persistance.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await assertSuperAdmin(request)
    const body = await request.json()
    const s: AdminPointSettingsIn = body?.settings ?? body
    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    const metadata = {
      conversion: {
        purchaseValue: s.purchaseValue,
        withdrawalValue: s.withdrawalValue,
        socialShareValue: s.socialShareValue,
        purchaseFeePercent: s.purchaseFeePercent
      },
      bonuses: {
        basePointsPerFCFA: s.basePointsPerFCFA,
        premiumVendorBonus: s.premiumVendorBonus,
        referralBonus: s.referralBonus,
        firstPurchaseBonus: s.firstPurchaseBonus,
        weekendBonus: s.weekendBonus,
        bulkPurchaseBonus: s.bulkPurchaseBonus,
        bulkPurchaseThreshold: s.bulkPurchaseThreshold,
        categoryBonuses: s.categoryBonuses
      },
      socialSharePerNetwork: s.socialSharePerNetwork
    }

    const { error: settingsErr } = await supabase
      .from('point_settings')
      .upsert(
        {
          scope: 'global',
          default_currency: 'XOF',
          conversion_rate: toNum(s.pointValue, 0.01),
          min_balance: 0,
          max_balance: null,
          transfer_enabled: true,
          exchange_enabled: true,
          withdrawal_enabled: true,
          metadata,
          updated_by: userId,
          updated_at: now
        },
        { onConflict: 'scope' }
      )
    if (settingsErr) throw settingsErr

    const feesBase = [
      { operation_type: 'transfer', flat_fee: s.fees.transfer.flat, percentage_fee: s.fees.transfer.percentage },
      { operation_type: 'exchange', flat_fee: s.fees.exchange.flat, percentage_fee: s.fees.exchange.percentage },
      { operation_type: 'withdrawal', flat_fee: s.fees.withdrawal.flat, percentage_fee: s.fees.withdrawal.percentage }
    ].map((f) => ({
      ...f,
      scope: 'global',
      minimum_fee: 0,
      maximum_fee: null,
      currency: 'points',
      metadata: {},
      updated_by: userId,
      updated_at: now
    }))
    const { error: feesErr } = await supabase
      .from('point_operation_fees')
      .upsert(feesBase, { onConflict: 'operation_type,scope' })
    if (feesErr) throw feesErr

    const limitsBase = [
      {
        operation_type: 'withdrawal',
        scope: 'global',
        min_amount: toNum(s.minWithdrawal, 1000),
        max_amount: toNullableNum(s.maxWithdrawal),
        daily_limit: null,
        monthly_limit: null,
        metadata: {},
        updated_by: userId,
        updated_at: now
      },
      {
        operation_type: 'transfer',
        scope: 'global',
        min_amount: toNum(s.transferMin, 0),
        max_amount: toNullableNum(s.transferMax),
        daily_limit: toNullableNum(s.transferDailyMax),
        monthly_limit: null,
        metadata: {},
        updated_by: userId,
        updated_at: now
      }
    ]
    const { error: limitsErr } = await supabase
      .from('point_operation_limits')
      .upsert(limitsBase, { onConflict: 'operation_type,scope' })
    if (limitsErr) throw limitsErr

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur sauvegarde configuration points.'
    const status = /accès|token/i.test(message) ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
