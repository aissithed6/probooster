import { supabase } from '@/lib/supabase'

export type SocialNetworkKey = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'whatsapp'

export interface AdminPointSettings {
  pointValue: number
  transferFees: number
  exchangeFee: number
  purchaseValue: number
  purchaseFeePercent: number
  withdrawalValue: number
  socialShareValue: number
  socialSharePerNetwork: Record<SocialNetworkKey, number>
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
    transfer: {
      flat: number
      percentage: number
    }
    exchange: {
      flat: number
      percentage: number
    }
    withdrawal: {
      flat: number
      percentage: number
    }
  }
}

export const DEFAULT_ADMIN_POINT_SETTINGS: AdminPointSettings = {
  pointValue: 0.01,
  transferFees: 100,
  exchangeFee: 50,
  purchaseValue: 0.01,
  purchaseFeePercent: 2,
  withdrawalValue: 0.01,
  socialShareValue: 5,
  socialSharePerNetwork: {
    facebook: 5,
    instagram: 5,
    twitter: 5,
    linkedin: 5,
    tiktok: 5,
    whatsapp: 5
  },
  transferMin: 0,
  transferMax: 0,
  transferDailyMax: 0,
  minWithdrawal: 1000,
  maxWithdrawal: 100000,
  basePointsPerFCFA: 1,
  premiumVendorBonus: 20,
  referralBonus: 10,
  firstPurchaseBonus: 50,
  weekendBonus: 15,
  bulkPurchaseBonus: 25,
  bulkPurchaseThreshold: 50000,
  categoryBonuses: {},
  fees: {
    transfer: {
      flat: 100,
      percentage: 0,
    },
    exchange: {
      flat: 50,
      percentage: 0,
    },
    withdrawal: {
      flat: 0,
      percentage: 0,
    }
  }
}

/**
 * Récupère la configuration globale des points dans Supabase et la transforme pour l'interface admin.
 */
export async function fetchAdminPointSettings(): Promise<AdminPointSettings> {
  /**
   * Convertit de façon robuste une valeur issue de metadata (number|string) en number.
   * Supporte les saisies avec virgule (ex: "0,5").
   */
  const toLocaleNumber = (value: unknown): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const normalized = value.trim().replace(',', '.')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : NaN
    }
    return Number(value)
  }

  const settingsPromise = supabase
    .from('point_settings')
    .select('*')
    .eq('scope', 'global')
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const feesPromise = supabase
    .from('point_operation_fees')
    .select('*')
    .in('operation_type', ['transfer', 'exchange', 'withdrawal'])
    .eq('scope', 'global')
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })

  const limitsPromise = supabase
    .from('point_operation_limits')
    .select('*')
    .in('operation_type', ['withdrawal', 'transfer'])
    .eq('scope', 'global')
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })

  const [settingsResponse, feesResponse, limitsResponse] = await Promise.all([
    settingsPromise,
    feesPromise,
    limitsPromise
  ])

  if (settingsResponse.error) {
    throw new Error(`Erreur lors du chargement des paramètres de points: ${settingsResponse.error.message}`)
  }

  if (feesResponse.error) {
    throw new Error(`Erreur lors du chargement des frais de points: ${feesResponse.error.message}`)
  }

  if (limitsResponse.error) {
    throw new Error(`Erreur lors du chargement des limites de points: ${limitsResponse.error.message}`)
  }

  const settingsRow = settingsResponse.data
  const feeRows = (feesResponse.data ?? []) as Array<{ operation_type: string; flat_fee: unknown; percentage_fee: unknown }>
  const limitRows = (limitsResponse.data ?? []) as Array<{
    operation_type: string
    min_amount: unknown
    max_amount: unknown
    daily_limit: unknown
  }>

  const withdrawalLimitRow = limitRows.find((row) => row.operation_type === 'withdrawal')
  const transferLimitRow = limitRows.find((row) => row.operation_type === 'transfer')

  const metadata = (settingsRow?.metadata ?? {}) as Record<string, any>
  const conversion = (metadata.conversion ?? {}) as Record<string, number>
  const bonuses = (metadata.bonuses ?? {}) as Record<string, any>
  const socialShares = (metadata.socialSharePerNetwork ?? {}) as Partial<Record<SocialNetworkKey, number>>

  const transferFeeRow = feeRows.find((row: { operation_type: string }) => row.operation_type === 'transfer')
  const exchangeFeeRow = feeRows.find((row: { operation_type: string }) => row.operation_type === 'exchange')
  const withdrawalFeeRow = feeRows.find((row: { operation_type: string }) => row.operation_type === 'withdrawal')

  const resolveFlat = (value: unknown, fallback: number) => {
    if (value === null || value === undefined) return fallback
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : fallback
  }
  const resolvePercentage = (value: unknown) => {
    if (value === null || value === undefined) return 0
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }
  const transferFlat = resolveFlat(transferFeeRow?.flat_fee, DEFAULT_ADMIN_POINT_SETTINGS.transferFees)
  const transferPercentage = resolvePercentage(transferFeeRow?.percentage_fee)
  const exchangeFlat = resolveFlat(exchangeFeeRow?.flat_fee, DEFAULT_ADMIN_POINT_SETTINGS.exchangeFee)
  const exchangePercentage = resolvePercentage(exchangeFeeRow?.percentage_fee)
  const withdrawalFlat = resolveFlat(withdrawalFeeRow?.flat_fee, DEFAULT_ADMIN_POINT_SETTINGS.fees.withdrawal.flat)
  const withdrawalPercentage = resolvePercentage(withdrawalFeeRow?.percentage_fee)

  const result: AdminPointSettings = {
    pointValue: settingsRow?.conversion_rate ? Number(settingsRow.conversion_rate) : DEFAULT_ADMIN_POINT_SETTINGS.pointValue,
    transferFees: transferFlat,
    exchangeFee: exchangeFlat,
    purchaseValue: (() => {
      const v = toLocaleNumber((conversion as any).purchaseValue)
      return Number.isFinite(v) && v > 0 ? v : DEFAULT_ADMIN_POINT_SETTINGS.purchaseValue
    })(),
    withdrawalValue: (() => {
      const v = toLocaleNumber((conversion as any).withdrawalValue)
      return Number.isFinite(v) && v > 0 ? v : DEFAULT_ADMIN_POINT_SETTINGS.withdrawalValue
    })(),
    socialShareValue: (() => {
      const v = toLocaleNumber((conversion as any).socialShareValue)
      return Number.isFinite(v) && v >= 0 ? v : DEFAULT_ADMIN_POINT_SETTINGS.socialShareValue
    })(),
    purchaseFeePercent: (() => {
      const v = toLocaleNumber((conversion as any).purchaseFeePercent)
      return Number.isFinite(v) && v >= 0 ? v : DEFAULT_ADMIN_POINT_SETTINGS.purchaseFeePercent
    })(),
    socialSharePerNetwork: {
      ...DEFAULT_ADMIN_POINT_SETTINGS.socialSharePerNetwork,
      ...socialShares
    },
    transferMin:
      transferLimitRow?.min_amount !== null && transferLimitRow?.min_amount !== undefined
        ? Number(transferLimitRow.min_amount)
        : DEFAULT_ADMIN_POINT_SETTINGS.transferMin,
    transferMax:
      transferLimitRow?.max_amount !== null && transferLimitRow?.max_amount !== undefined
        ? Number(transferLimitRow.max_amount)
        : DEFAULT_ADMIN_POINT_SETTINGS.transferMax,
    transferDailyMax:
      transferLimitRow?.daily_limit !== null && transferLimitRow?.daily_limit !== undefined
        ? Number(transferLimitRow.daily_limit)
        : DEFAULT_ADMIN_POINT_SETTINGS.transferDailyMax,
    minWithdrawal:
      withdrawalLimitRow?.min_amount !== null && withdrawalLimitRow?.min_amount !== undefined
        ? Number(withdrawalLimitRow.min_amount)
        : DEFAULT_ADMIN_POINT_SETTINGS.minWithdrawal,
    maxWithdrawal:
      withdrawalLimitRow?.max_amount !== null && withdrawalLimitRow?.max_amount !== undefined
        ? Number(withdrawalLimitRow.max_amount)
        : DEFAULT_ADMIN_POINT_SETTINGS.maxWithdrawal,
    basePointsPerFCFA: bonuses.basePointsPerFCFA ?? DEFAULT_ADMIN_POINT_SETTINGS.basePointsPerFCFA,
    premiumVendorBonus: bonuses.premiumVendorBonus ?? DEFAULT_ADMIN_POINT_SETTINGS.premiumVendorBonus,
    referralBonus: bonuses.referralBonus ?? DEFAULT_ADMIN_POINT_SETTINGS.referralBonus,
    firstPurchaseBonus: bonuses.firstPurchaseBonus ?? DEFAULT_ADMIN_POINT_SETTINGS.firstPurchaseBonus,
    weekendBonus: bonuses.weekendBonus ?? DEFAULT_ADMIN_POINT_SETTINGS.weekendBonus,
    bulkPurchaseBonus: bonuses.bulkPurchaseBonus ?? DEFAULT_ADMIN_POINT_SETTINGS.bulkPurchaseBonus,
    bulkPurchaseThreshold: bonuses.bulkPurchaseThreshold ?? DEFAULT_ADMIN_POINT_SETTINGS.bulkPurchaseThreshold,
    categoryBonuses: (bonuses.categoryBonuses ?? {}) as Record<string, number>,
    fees: {
      transfer: {
        flat: transferFlat,
        percentage: transferPercentage,
      },
      exchange: {
        flat: exchangeFlat,
        percentage: exchangePercentage,
      },
      withdrawal: {
        flat: withdrawalFlat,
        percentage: withdrawalPercentage,
      }
    }
  }

  return result
}

/**
 * Enregistre la configuration globale des points et synchronise les frais/limites associés dans Supabase.
 */
export async function saveAdminPointSettings(settings: AdminPointSettings, userId?: string): Promise<void> {
  /**
   * Résout l'identifiant `user_profiles.id` à partir de l'identifiant Auth (`users.id`).
   * Nécessaire car les colonnes `updated_by` pointent vers `user_profiles(id)`.
   */
  const resolveUpdatedByProfileId = async (): Promise<string | null> => {
    if (!userId) return null

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('[points-settings] Impossible de résoudre user_profiles.id (updated_by forcé à null):', error)
        return null
      }

      if (!data?.id) {
        console.warn('[points-settings] Profil introuvable (updated_by forcé à null) pour userId:', userId)
        return null
      }

      return String(data.id)
    } catch (err) {
      console.warn('[points-settings] Exception résolution profil (updated_by forcé à null):', err)
      return null
    }
  }

  const updatedByProfileId = await resolveUpdatedByProfileId()

  const updatedByCandidates = Array.from(
    new Set([
      userId ?? null,
      updatedByProfileId,
      null
    ])
  )

  console.debug('[points-settings] saveAdminPointSettings:', {
    userId: userId ?? null,
    updatedByProfileId,
    updatedByCandidates
  })

  const toNumberOrFallback = (value: unknown, fallback: number) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : fallback
  }

  /**
   * Convertit une valeur en number optionnel (null si invalide).
   */
  const toNullableNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return null
    if (numeric <= 0) return null
    return numeric
  }

  // Source de vérité UI: transferFees/exchangeFee représentent les frais fixes.
  // Les champs settings.fees.* sont conservés pour les pourcentages.
  const transferFeeConfig = {
    flat: toNumberOrFallback(settings.transferFees, DEFAULT_ADMIN_POINT_SETTINGS.transferFees),
    percentage: toNumberOrFallback(settings.fees?.transfer?.percentage, 0)
  }

  const exchangeFeeConfig = {
    flat: toNumberOrFallback(settings.exchangeFee, DEFAULT_ADMIN_POINT_SETTINGS.exchangeFee),
    percentage: toNumberOrFallback(settings.fees?.exchange?.percentage, 0)
  }

  const withdrawalFeeConfig = {
    flat: toNumberOrFallback(settings.fees?.withdrawal?.flat, DEFAULT_ADMIN_POINT_SETTINGS.fees.withdrawal.flat),
    percentage: toNumberOrFallback(settings.fees?.withdrawal?.percentage, 0)
  }

  const metadataPayload = {
    conversion: {
      purchaseValue: settings.purchaseValue,
      withdrawalValue: settings.withdrawalValue,
      socialShareValue: settings.socialShareValue,
      purchaseFeePercent: settings.purchaseFeePercent
    },
    socialSharePerNetwork: settings.socialSharePerNetwork,
    bonuses: {
      basePointsPerFCFA: settings.basePointsPerFCFA,
      premiumVendorBonus: settings.premiumVendorBonus,
      referralBonus: settings.referralBonus,
      firstPurchaseBonus: settings.firstPurchaseBonus,
      weekendBonus: settings.weekendBonus,
      bulkPurchaseBonus: settings.bulkPurchaseBonus,
      bulkPurchaseThreshold: settings.bulkPurchaseThreshold,
      categoryBonuses: settings.categoryBonuses
    }
  }

  const upsertWithUpdatedBy = async (updatedBy: string | null) => {
    const { error } = await supabase
      .from('point_settings')
      .upsert(
        {
          scope: 'global',
          default_currency: 'XOF',
          conversion_rate: settings.pointValue,
          min_balance: 0,
          max_balance: null,
          transfer_enabled: true,
          exchange_enabled: true,
          withdrawal_enabled: true,
          metadata: metadataPayload,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'scope'
        }
      )

    return error
  }

  let settingsError: any | null = null
  for (const candidate of updatedByCandidates) {
    // eslint-disable-next-line no-await-in-loop
    const err = await upsertWithUpdatedBy(candidate as any)
    if (!err) {
      settingsError = null
      break
    }
    settingsError = err
  }

  if (settingsError) {
    throw new Error(`Erreur lors de l'enregistrement des paramètres de points: ${settingsError.message}`)
  }

  const feeUpsertsBase = [
    {
      operation_type: 'transfer',
      scope: 'global',
      flat_fee: transferFeeConfig.flat,
      percentage_fee: transferFeeConfig.percentage,
      minimum_fee: 0,
      maximum_fee: null,
      currency: 'points',
      metadata: {},
      updated_at: new Date().toISOString()
    },
    {
      operation_type: 'exchange',
      scope: 'global',
      flat_fee: exchangeFeeConfig.flat,
      percentage_fee: exchangeFeeConfig.percentage,
      minimum_fee: 0,
      maximum_fee: null,
      currency: 'points',
      metadata: {},
      updated_at: new Date().toISOString()
    },
    {
      operation_type: 'withdrawal',
      scope: 'global',
      flat_fee: withdrawalFeeConfig.flat,
      percentage_fee: withdrawalFeeConfig.percentage,
      minimum_fee: 0,
      maximum_fee: null,
      currency: 'points',
      metadata: {},
      updated_at: new Date().toISOString()
    }
  ]

  const applyUpdatedBy = (updatedBy: string | null) =>
    feeUpsertsBase.map(row => ({ ...row, updated_by: updatedBy }))

  let feeError: any | null = null
  for (const candidate of updatedByCandidates) {
    // eslint-disable-next-line no-await-in-loop
    const { error } = await supabase
      .from('point_operation_fees')
      .upsert(applyUpdatedBy(candidate as any), { onConflict: 'operation_type,scope' })
    if (!error) {
      feeError = null
      break
    }
    feeError = error
  }

  if (feeError) {
    throw new Error(`Erreur lors de l'enregistrement des frais: ${feeError.message}`)
  }

  const limitUpsertsBase = [
    {
      operation_type: 'withdrawal',
      scope: 'global',
      min_amount: settings.minWithdrawal,
      max_amount: settings.maxWithdrawal,
      daily_limit: null,
      monthly_limit: null,
      metadata: {},
      updated_at: new Date().toISOString()
    },
    {
      operation_type: 'transfer',
      scope: 'global',
      min_amount: toNumberOrFallback(settings.transferMin, DEFAULT_ADMIN_POINT_SETTINGS.transferMin),
      max_amount: toNullableNumber(settings.transferMax),
      daily_limit: toNullableNumber(settings.transferDailyMax),
      monthly_limit: null,
      metadata: {},
      updated_at: new Date().toISOString()
    }
  ]

  const applyLimitUpdatedBy = (updatedBy: string | null) =>
    limitUpsertsBase.map(row => ({ ...row, updated_by: updatedBy }))

  let limitError: any | null = null
  for (const candidate of updatedByCandidates) {
    // eslint-disable-next-line no-await-in-loop
    const { error } = await supabase
      .from('point_operation_limits')
      .upsert(applyLimitUpdatedBy(candidate as any), { onConflict: 'operation_type,scope' })
    if (!error) {
      limitError = null
      break
    }
    limitError = error
  }

  if (limitError) {
    throw new Error(`Erreur lors de l'enregistrement des limites: ${limitError.message}`)
  }
}
