import { supabase } from '../supabase'
import { ClientAuthService } from './client-auth-service'
import { Database } from '../supabase'

type Tables = Database['public']['Tables']
type PointSettingsRow = Tables['point_settings']['Row']
type PointOperationFeeRow = Tables['point_operation_fees']['Row']
type PointOperationLimitRow = Tables['point_operation_limits']['Row']
type PointExchangeRateRow = Tables['point_exchange_rates']['Row']
type PointWithdrawalMethodRow = Tables['point_withdrawal_methods']['Row']
type PointWithdrawalMethodLimitRow = Tables['point_withdrawal_method_limits']['Row']

export type LoyaltyRewardType = 'discount' | 'free_shipping' | 'free_product' | 'cashback' | 'voucher'
export type LoyaltyRewardValueType = 'percentage' | 'fixed' | 'points'

type SupabaseError = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export interface TransferRecipient {
  id: string
  fullName: string
  email: string
  phone: string | null
  username: string | null
  shortCode: string | null
}

export interface ClientPointsConfiguration {
  settings: {
    defaultCurrency: string
    conversionRate: number
    purchaseValue: number
    purchaseFeePercent: number
    withdrawalValue: number
    socialShareValue: number
    basePointsPerFCFA: number
    minBalance: number
    maxBalance: number | null
    transferEnabled: boolean
    exchangeEnabled: boolean
    withdrawalEnabled: boolean
  }
  fees: {
    transfer: FeeConfiguration
    exchange: FeeConfiguration
    withdrawal: FeeConfiguration
  }
  limits: {
    transfer: LimitConfiguration
    exchange: LimitConfiguration
    withdrawal: LimitConfiguration
  }
  exchangeRates: Array<{
    currency: string
    rate: number
    isDefault: boolean
  }>
  withdrawalMethods: Array<{
    id: string
    name: string
    description: string | null
    isActive: boolean
    limits: Array<{
      currency: string
      minAmount: number
      maxAmount: number | null
      processingTime: string | null
    }>
  }>
}

export interface ClientPointsSummary {
  balance: number
  pointsSpent: number
  fcfaValue: number
  isFrozen: boolean
  freezeReason: string | null
}

export interface ClientRewardOption {
  id: string
  name: string
  rewardType: LoyaltyRewardType
  description: string | null
  pointsCost: number
  value: number
  valueType: LoyaltyRewardValueType
  metadata: Record<string, unknown>
  availability: {
    startDate: string | null
    endDate: string | null
    remainingUsage: number | null
  }
}

type FeeConfiguration = {
  flat: number
  percentage: number
  minimum: number
  maximum: number | null
  currency: string
}

type LimitConfiguration = {
  min: number
  max: number | null
  daily: number | null
  monthly: number | null
}

export class ClientPointsService {
  private static pointsConfigurationInFlight: {
    userId: string
    promise: Promise<ClientPointsConfiguration>
  } | null = null

  /**
   * Convertit de façon robuste une valeur pouvant venir de Supabase (number|string) en number.
   * Supporte les saisies au format FR avec virgule (ex: "0,5").
   */
  private static toLocaleNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const normalized = value.trim().replace(',', '.')
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : NaN
    }
    return Number(value)
  }

  /**
   * Charge la ligne loyalty_points. Si les colonnes de gel ne sont pas encore déployées en base,
   * on retombe sur un select minimal (sans is_frozen/freeze_reason).
   */
  private static async fetchLoyaltyPointsRow(userId: string): Promise<{
    data: any | null
    error: any | null
    hasFreezeColumns: boolean
  }> {
    const withFreeze = await supabase
      .from('loyalty_points')
      .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
      .eq('user_id', userId)
      .single()

    if (withFreeze.error && (withFreeze.error as any)?.code === 'PGRST116') {
      try {
        await supabase
          .from('loyalty_points')
          .upsert({ user_id: userId } as any, { onConflict: 'user_id' })
      } catch {
        // ignore
      }

      const retry = await supabase
        .from('loyalty_points')
        .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
        .eq('user_id', userId)
        .maybeSingle()

      return {
        data: retry.data,
        error: retry.error,
        hasFreezeColumns: true
      }
    }

    if (withFreeze.error && this.isMissingFreezeColumnError(withFreeze.error)) {
      const withoutFreeze = await supabase
        .from('loyalty_points')
        .select('points_balance, points_spent, fcfa_value')
        .eq('user_id', userId)
        .single()

      if (withoutFreeze.error && (withoutFreeze.error as any)?.code === 'PGRST116') {
        try {
          await supabase
            .from('loyalty_points')
            .upsert({ user_id: userId } as any, { onConflict: 'user_id' })
        } catch {
          // ignore
        }

        const retry = await supabase
          .from('loyalty_points')
          .select('points_balance, points_spent, fcfa_value')
          .eq('user_id', userId)
          .maybeSingle()

        return {
          data: retry.data,
          error: retry.error,
          hasFreezeColumns: false
        }
      }

      return {
        data: withoutFreeze.data,
        error: withoutFreeze.error,
        hasFreezeColumns: false
      }
    }

    if (!withFreeze.error && !withFreeze.data) {
      try {
        await supabase
          .from('loyalty_points')
          .upsert({ user_id: userId } as any, { onConflict: 'user_id' })
      } catch {
        // ignore
      }

      const retry = await supabase
        .from('loyalty_points')
        .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
        .eq('user_id', userId)
        .maybeSingle()

      return {
        data: retry.data,
        error: retry.error,
        hasFreezeColumns: true
      }
    }

    if (!withFreeze.error && withFreeze.data) {
      const resolvedBalance = Number((withFreeze.data as any)?.points_balance ?? 0)
      const hasPositiveBalance = Number.isFinite(resolvedBalance) && resolvedBalance > 0

      if (!hasPositiveBalance) {
        try {
          const legacyUsers = await supabase
            .from('users')
            .select('points_balance')
            .eq('id', userId)
            .maybeSingle()

          const legacyUserBalance = Number((legacyUsers.data as any)?.points_balance ?? 0)
          if (!legacyUsers.error && Number.isFinite(legacyUserBalance) && legacyUserBalance > 0) {
            return {
              data: {
                ...(withFreeze.data as any),
                points_balance: legacyUserBalance
              },
              error: null,
              hasFreezeColumns: true
            }
          }
        } catch {
          // ignore users fallback errors
        }

        try {
          const legacy = await supabase
            .from('user_points')
            .select('points, fcfa_value')
            .eq('user_id', userId)
            .maybeSingle()

          const legacyPoints = Number((legacy.data as any)?.points ?? 0)
          const legacyFcfa = Number((legacy.data as any)?.fcfa_value ?? 0)

          if (!legacy.error && Number.isFinite(legacyPoints) && legacyPoints > 0) {
            return {
              data: {
                ...(withFreeze.data as any),
                points_balance: legacyPoints,
                fcfa_value: Number.isFinite(legacyFcfa) ? legacyFcfa : (withFreeze.data as any)?.fcfa_value
              },
              error: null,
              hasFreezeColumns: true
            }
          }
        } catch {
          // ignore fallback errors
        }
      }
    }

    return {
      data: withFreeze.data,
      error: withFreeze.error,
      hasFreezeColumns: true
    }
  }

  private static isMissingFreezeColumnError(error: unknown): boolean {
    const message = (error as any)?.message
    if (typeof message !== 'string') {
      return false
    }

    return message.includes('loyalty_points.is_frozen') || message.includes('loyalty_points.freeze_reason')
  }

  /**
   * Récupère la configuration complète des opérations points pour un utilisateur client.
   */
  static async getPointsConfiguration(userId: string): Promise<ClientPointsConfiguration> {
    const resolvedUserId = String(userId ?? '').trim()
    if (this.pointsConfigurationInFlight && this.pointsConfigurationInFlight.userId === resolvedUserId) {
      return this.pointsConfigurationInFlight.promise
    }

    const task = (async () => {
    try {
      const [settingsRow, transferFeeRow, exchangeFeeRow, withdrawalFeeRow, transferLimitRow, exchangeLimitRow, withdrawalLimitRow, exchangeRatesRows, withdrawalMethodRows] = await Promise.all([
        this.getPointSettings(),
        this.getOperationFee('transfer'),
        this.getOperationFee('exchange'),
        this.getOperationFee('withdrawal'),
        this.getOperationLimit('transfer'),
        this.getOperationLimit('exchange'),
        this.getOperationLimit('withdrawal'),
        this.getAllExchangeRates(),
        this.getWithdrawalMethods()
      ])

      const defaultSettings = {
        default_currency: 'XOF',
        conversion_rate: 1,
        min_balance: 0,
        max_balance: null,
        transfer_enabled: true,
        exchange_enabled: true,
        withdrawal_enabled: true
      }

      const resolvedSettings = settingsRow || (defaultSettings as unknown as PointSettingsRow)
      const defaultCurrency = resolvedSettings.default_currency || 'XOF'
      const conversionRate = Number(resolvedSettings.conversion_rate || 1)

      const metadata = (resolvedSettings as any)?.metadata ?? {}
      const conversion = (metadata?.conversion ?? {}) as Record<string, unknown>
      const bonuses = (metadata?.bonuses ?? {}) as Record<string, unknown>

      const purchaseValueRaw = this.toLocaleNumber(conversion?.purchaseValue)
      const withdrawalValueRaw = this.toLocaleNumber(conversion?.withdrawalValue)
      const socialShareValueRaw = this.toLocaleNumber(conversion?.socialShareValue)
      const purchaseFeePercentRaw = this.toLocaleNumber(conversion?.purchaseFeePercent)

      const purchaseValue = Number.isFinite(purchaseValueRaw) && purchaseValueRaw > 0 ? purchaseValueRaw : conversionRate
      const withdrawalValue = Number.isFinite(withdrawalValueRaw) && withdrawalValueRaw > 0 ? withdrawalValueRaw : conversionRate
      const socialShareValue = Number.isFinite(socialShareValueRaw) && socialShareValueRaw > 0 ? socialShareValueRaw : 0
      const purchaseFeePercent = Number.isFinite(purchaseFeePercentRaw) && purchaseFeePercentRaw >= 0 ? purchaseFeePercentRaw : 2

      const basePointsRaw = this.toLocaleNumber((bonuses as any)?.basePointsPerFCFA)
      const basePointsPerFCFA = Number.isFinite(basePointsRaw) && basePointsRaw > 0 ? basePointsRaw : 1

      return {
        settings: {
          defaultCurrency,
          conversionRate,
          purchaseValue,
          purchaseFeePercent,
          withdrawalValue,
          socialShareValue,
          basePointsPerFCFA,
          minBalance: Number(resolvedSettings.min_balance ?? 0),
          maxBalance: resolvedSettings.max_balance !== undefined && resolvedSettings.max_balance !== null ? Number(resolvedSettings.max_balance) : null,
          transferEnabled: resolvedSettings.transfer_enabled ?? true,
          exchangeEnabled: resolvedSettings.exchange_enabled ?? true,
          withdrawalEnabled: resolvedSettings.withdrawal_enabled ?? true
        },
        fees: {
          transfer: this.mapFeeConfiguration(transferFeeRow, defaultCurrency),
          exchange: this.mapFeeConfiguration(exchangeFeeRow, defaultCurrency),
          withdrawal: this.mapFeeConfiguration(withdrawalFeeRow, defaultCurrency)
        },
        limits: {
          transfer: this.mapLimitConfiguration(transferLimitRow),
          exchange: this.mapLimitConfiguration(exchangeLimitRow),
          withdrawal: this.mapLimitConfiguration(withdrawalLimitRow)
        },
        exchangeRates: exchangeRatesRows.map(rate => ({
          currency: rate.currency,
          rate: Number(rate.rate),
          isDefault: Boolean(rate.is_default)
        })),
        withdrawalMethods: withdrawalMethodRows.map(({ method, limits }) => ({
          id: method.id,
          name: method.name,
          description: method.description,
          isActive: method.is_active,
          limits: limits.map(limit => ({
            currency: limit.currency,
            minAmount: this.toPositive(Number(limit.min_amount ?? 0)),
            maxAmount: limit.max_amount !== undefined && limit.max_amount !== null ? this.toPositive(Number(limit.max_amount)) : null,
            processingTime: limit.processing_time || null
          }))
        }))
      }
    } catch (error) {
      this.handleSupabaseError(error, 'getPointsConfiguration')
      throw error instanceof Error ? error : new Error("Impossible de charger la configuration des points")
    } finally {
      if (this.pointsConfigurationInFlight?.userId === resolvedUserId) {
        this.pointsConfigurationInFlight = null
      }
    }
    })()

    this.pointsConfigurationInFlight = { userId: resolvedUserId, promise: task }
    return task
  }

  /**
   * Échange des points contre une récompense (bon d'achat, réduction, etc.).
   */
  static async redeemRewardWithPoints(userId: string, rewardId: string, amount: number): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error('Le nombre de points à échanger doit être positif')
      }

      const [loyalty, reward, settings, fee, limits] = await Promise.all([
        this.fetchLoyaltyPointsRow(userId),
        supabase
          .from('loyalty_rewards')
          .select('id, name, points_cost, reward_type, value, value_type, metadata, max_usage, current_usage, is_active')
          .eq('id', rewardId)
          .single(),
        this.getPointSettings(),
        this.getOperationFee('exchange'),
        this.getOperationLimit('exchange')
      ])

      if (loyalty.error) {
        throw loyalty.error
      }

      if (!loyalty.data) {
        throw new Error('Compte de points introuvable')
      }

      if (loyalty.hasFreezeColumns && Boolean((loyalty.data as any)?.is_frozen ?? false)) {
        const reason = ((loyalty.data as any)?.freeze_reason ?? '').toString().trim()
        throw new Error(reason ? `Compte gelé : ${reason}` : 'Compte gelé : opération impossible')
      }

      if (!reward.data || !reward.data.is_active) {
        throw new Error('Récompense indisponible ou désactivée')
      }

      if (settings && settings.exchange_enabled === false) {
        throw new Error('Les échanges de points sont temporairement désactivés')
      }

      const usageCap = reward.data.max_usage ?? null
      const currentUsage = reward.data.current_usage ?? 0
      if (usageCap !== null && usageCap !== undefined && currentUsage >= usageCap) {
        throw new Error('Cette récompense a atteint sa limite d’utilisation')
      }

      const cost = Number(reward.data.points_cost ?? 0)
      if (amount < cost) {
        throw new Error(`Cette récompense nécessite au moins ${cost} points`)
      }

      const currentBalance = loyalty.data.points_balance || 0
      const feeConfig = this.mapFeeConfiguration(fee, settings?.default_currency || 'XOF')
      const feeAmount = this.calculateFee(amount, feeConfig)
      const totalDebited = amount + feeAmount

      this.ensureLimits(totalDebited, limits, "montant d'échange")

      if (totalDebited > currentBalance) {
        throw new Error('Solde de points insuffisant pour cet échange')
      }

      const conversionRate = settings?.conversion_rate || 1

      const { error: updateRewardError } = await supabase
        .from('loyalty_rewards')
        .update({ current_usage: currentUsage + 1 })
        .eq('id', rewardId)

      if (updateRewardError) {
        throw updateRewardError
      }

      const { data: redemptionRows, error: redemptionError } = await supabase
        .from('loyalty_reward_redemptions')
        .insert({
          user_id: userId,
          reward_id: rewardId,
          points_spent: amount,
          metadata: reward.data.metadata ?? {}
        })
        .select('id')
        .single()

      if (redemptionError) {
        throw redemptionError
      }

      await supabase
        .from('point_transactions')
        .insert([
          {
            user_id: userId,
            type: 'reward_redemption',
            points: amount,
            fcfa_value: Number((amount * conversionRate).toFixed(2)),
            description: `Échange de points pour ${reward.data.name}`,
            reference_id: redemptionRows.id
          },
          ...(feeAmount > 0
            ? [
                {
                  user_id: userId,
                  type: 'exchange_fee',
                  points: feeAmount,
                  fcfa_value: Number((feeAmount * conversionRate).toFixed(2)),
                  description: "Frais d'échange de récompense",
                  reference_id: redemptionRows.id
                }
              ]
            : [])
        ])

      await supabase
        .from('loyalty_points')
        .update({
          points_balance: this.toPositive(currentBalance - totalDebited),
          points_spent: this.toPositive((loyalty.data.points_spent || 0) + totalDebited),
          fcfa_value: this.toPositive((loyalty.data.fcfa_value || 0) - (amount * conversionRate))
        })
        .eq('user_id', userId)

      await this.syncLegacyUsersBalance(userId, this.toPositive(currentBalance - totalDebited))
    } catch (error) {
      this.handleSupabaseError(error, 'redeemRewardWithPoints')
      throw error instanceof Error ? error : new Error("Erreur inattendue lors de l'échange de récompense")
    }
  }

  /**
   * Récupère le résumé du solde points/fcfa pour synchroniser le dashboard client.
   */
  static async getPointsSummary(userId: string): Promise<ClientPointsSummary | null> {
    try {
      if (typeof window !== 'undefined') {
        const headers = await ClientAuthService.buildAuthHeaders()
        const response = await fetch('/api/points/summary', {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store'
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          const message = (body as any)?.error ?? `Erreur lors de la récupération du solde (HTTP ${response.status})`
          throw new Error(message)
        }

        const payload = (await response.json().catch(() => null)) as { data?: any }
        const summary = payload?.data
        if (!summary) {
          return null
        }

        return {
          balance: Number(summary.balance ?? 0) || 0,
          pointsSpent: Number(summary.pointsSpent ?? 0) || 0,
          fcfaValue: Number(summary.fcfaValue ?? 0) || 0,
          isFrozen: Boolean(summary.isFrozen ?? false),
          freezeReason: (summary.freezeReason ?? null) as string | null
        }
      }

      const { data, error, hasFreezeColumns } = await this.fetchLoyaltyPointsRow(userId)

      if (error) {
        if ((error as SupabaseError).code === 'PGRST116') {
          return null
        }
        throw error
      }

      return {
        balance: data?.points_balance || 0,
        pointsSpent: data?.points_spent || 0,
        fcfaValue: data?.fcfa_value || 0,
        isFrozen: hasFreezeColumns ? Boolean((data as any)?.is_frozen ?? false) : false,
        freezeReason: hasFreezeColumns ? ((data as any)?.freeze_reason ?? null) : null
      }
    } catch (error) {
      this.handleSupabaseError(error, 'getPointsSummary')
      throw error instanceof Error ? error : new Error('Impossible de récupérer le solde de points')
    }
  }

  /**
   * Recherche des utilisateurs (clients/vendeurs) éligibles pour le transfert de points.
   */
  static async searchRecipients(query: string): Promise<TransferRecipient[]> {
    if (!query.trim()) {
      return []
    }

    try {
      const { data } = await supabase.auth.getSession()
      const accessToken = data?.session?.access_token ?? null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      }

      // Fallback: tente aussi via le helper si jamais la session n'est pas encore prête (auth state change).
      if (!accessToken) {
        const fallbackHeaders = await ClientAuthService.buildAuthHeaders()
        Object.assign(headers as any, fallbackHeaders)
      }

      const response = await fetch(`/api/finance/points-recipients?query=${encodeURIComponent(query.trim())}`, {
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store'
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const message = (body as any)?.error || `Erreur lors de la recherche (HTTP ${response.status})`
        throw new Error(message)
      }

      const body = (await response.json()) as { rows?: Array<any> }
      const rows = Array.isArray(body?.rows) ? body.rows : []

      return rows.map((row) => ({
        id: String(row.id),
        fullName: String(row.fullName ?? ''),
        email: String(row.email ?? ''),
        phone: row.phone ?? null,
        username: row.username ?? null,
        shortCode: row.shortCode ?? null
      }))
    } catch (error) {
      this.handleSupabaseError(error, 'searchRecipients')
      throw error instanceof Error ? error : new Error("Erreur lors de la recherche d'utilisateurs")
    }
  }

  /**
   * Récupère les récompenses actives mises à disposition par le super admin ou les vendeurs.
   */
  static async listAvailableRewards(): Promise<ClientRewardOption[]> {
    try {
      const now = new Date()
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('id, name, reward_type, description, points_cost, value, value_type, start_date, end_date, metadata, is_active, max_usage, current_usage')
        .eq('is_active', true)

      if (error) {
        throw error
      }

      return (data || [])
        .filter(reward => {
          const startsAt = reward.start_date ? new Date(reward.start_date) : null
          const endsAt = reward.end_date ? new Date(reward.end_date) : null
          const usageCap = reward.max_usage ?? null
          const currentUsage = reward.current_usage ?? 0

          if (startsAt && startsAt > now) {
            return false
          }
          if (endsAt && endsAt < now) {
            return false
          }
          if (usageCap !== null && usageCap !== undefined && currentUsage >= usageCap) {
            return false
          }
          return true
        })
        .map(reward => {
          const usageCap = reward.max_usage ?? null
          const currentUsage = reward.current_usage ?? 0
          const remainingUsage = usageCap !== null && usageCap !== undefined ? Math.max(Number(usageCap) - Number(currentUsage), 0) : null

          return {
            id: reward.id,
            name: reward.name,
            rewardType: reward.reward_type as LoyaltyRewardType,
            description: reward.description ?? null,
            pointsCost: Number(reward.points_cost ?? 0),
            value: Number(reward.value ?? 0),
            valueType: reward.value_type as LoyaltyRewardValueType,
            metadata: (reward.metadata as Record<string, unknown>) || {},
            availability: {
              startDate: reward.start_date ?? null,
              endDate: reward.end_date ?? null,
              remainingUsage
            }
          } satisfies ClientRewardOption
        })
    } catch (error) {
      const supabaseError = error as SupabaseError
      this.handleSupabaseError(error, 'listAvailableRewards')
      const message = supabaseError?.message || "Impossible de récupérer les récompenses disponibles"
      throw supabaseError?.message ? new Error(message) : error instanceof Error ? error : new Error(message)
    }
  }

  /**
   * Taux de conversion points ➝ FCFA utilisé pour la colonne fcfa_value de loyalty_points.
   * Utilise en priorité la "Valeur de retrait" configurée par le Super Admin
   * (metadata.conversion.withdrawalValue) et retombe sur settings.conversion_rate.
   * Harmonisé entre tous les chemins (RPC + fallbacks) pour éviter toute dérive du solde FCFA.
   */
  private static resolvePointsToFcfaRate(settings: { conversion_rate?: number; metadata?: Record<string, unknown> } | null | undefined): number {
    const metadata = (settings as any)?.metadata ?? {}
    const conversion = ((metadata as any)?.conversion ?? {}) as Record<string, unknown>
    const withdrawalValue = Number((conversion as any)?.withdrawalValue)
    if (Number.isFinite(withdrawalValue) && withdrawalValue > 0) {
      return withdrawalValue
    }
    const conversionRate = Number(settings?.conversion_rate)
    return Number.isFinite(conversionRate) && conversionRate > 0 ? conversionRate : 1
  }

  /**
   * Transfère des points à un autre utilisateur (client ou vendeur).
   */
  static async transferPoints(userId: string, recipientId: string, amount: number): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error('Le montant du transfert doit être positif')
      }
      if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
        throw new Error('Le montant du transfert doit être un entier')
      }
      if (userId === recipientId) {
        throw new Error('Impossible de vous transférer des points à vous-même')
      }

      const [loyalty, recipient, settings, fee, limits, senderProfileRow] = await Promise.all([
        this.fetchLoyaltyPointsRow(userId),
        this.getEligibleUserProfile(recipientId),
        this.getPointSettings(),
        this.getOperationFee('transfer'),
        this.getOperationLimit('transfer'),
        supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
      ])

      if (loyalty.error) {
        throw loyalty.error
      }

      if (!loyalty.data) {
        throw new Error('Compte de points introuvable')
      }

      if (loyalty.hasFreezeColumns && Boolean((loyalty.data as any)?.is_frozen ?? false)) {
        const reason = ((loyalty.data as any)?.freeze_reason ?? '').toString().trim()
        throw new Error(reason ? `Compte gelé : ${reason}` : 'Compte gelé : transfert impossible')
      }
      if (!recipient) {
        throw new Error('Destinataire introuvable ou non autorisé')
      }

      if (recipient.userId === userId) {
        throw new Error('Impossible de vous transférer des points à vous-même')
      }

      if (senderProfileRow?.error) {
        throw senderProfileRow.error
      }

      const senderProfileId = senderProfileRow?.data?.id ? String(senderProfileRow.data.id) : null
      if (!senderProfileId) {
        throw new Error('Profil expéditeur introuvable')
      }

      const currentBalance = loyalty.data.points_balance || 0
      const feeConfig = this.mapFeeConfiguration(fee, settings?.default_currency || 'XOF')
      const feeAmount = this.calculateFee(amount, feeConfig)
      const totalDebited = amount + feeAmount
      this.ensureLimits(totalDebited, limits, 'montant de transfert')

      if (totalDebited > currentBalance) {
        throw new Error('Solde insuffisant pour effectuer le transfert')
      }

      const conversionRate = this.resolvePointsToFcfaRate(settings)
      const currency = settings?.default_currency || 'XOF'

      const nowIso = new Date().toISOString()

      const { error } = await supabase.rpc('transfer_points_between_users', {
        p_sender_id: userId,
        p_recipient_id: recipientId,
        p_points: amount
      })

      if (error) {
        throw new Error(error.message)
      }

      const { data: loyaltyAfterRpc, error: loyaltyAfterRpcErr } = await supabase
        .from('loyalty_points')
        .select('points_balance, points_spent, fcfa_value')
        .eq('user_id', userId)
        .single()

      if (loyaltyAfterRpcErr || !loyaltyAfterRpc) {
        throw loyaltyAfterRpcErr || new Error('Impossible de relire le solde après transfert')
      }

      const approxEqual = (a: number, b: number, epsilon = 0.01) => Math.abs(a - b) <= epsilon

      const preBalance = Number(currentBalance || 0)
      const preSpent = Number(loyalty.data.points_spent || 0)
      const preFcfa = Number(loyalty.data.fcfa_value || 0)

      const postBalance = Number(loyaltyAfterRpc.points_balance || 0)
      const postSpent = Number(loyaltyAfterRpc.points_spent || 0)
      const postFcfa = Number(loyaltyAfterRpc.fcfa_value || 0)

      const balanceDelta = preBalance - postBalance
      const spentDelta = postSpent - preSpent
      const fcfaDelta = preFcfa - postFcfa

      let balanceToSubtract = totalDebited
      if (balanceDelta > 0 && approxEqual(balanceDelta, amount)) {
        balanceToSubtract = feeAmount
      } else if (balanceDelta > 0 && approxEqual(balanceDelta, totalDebited)) {
        balanceToSubtract = 0
      }

      let spentToAdd = totalDebited
      if (spentDelta > 0 && approxEqual(spentDelta, amount)) {
        spentToAdd = feeAmount
      } else if (spentDelta > 0 && approxEqual(spentDelta, totalDebited)) {
        spentToAdd = 0
      }

      const totalDebitedFcfa = totalDebited * conversionRate
      const amountFcfa = amount * conversionRate

      let fcfaToSubtract = totalDebitedFcfa
      if (fcfaDelta > 0 && approxEqual(fcfaDelta, amountFcfa)) {
        fcfaToSubtract = feeAmount * conversionRate
      } else if (fcfaDelta > 0 && approxEqual(fcfaDelta, totalDebitedFcfa)) {
        fcfaToSubtract = 0
      }

      await supabase
        .from('loyalty_points')
        .update({
          points_balance: this.toPositive(postBalance - balanceToSubtract),
          points_spent: this.toPositive(postSpent + spentToAdd),
          fcfa_value: this.toPositive(postFcfa - fcfaToSubtract)
        })
        .eq('user_id', userId)

      await this.syncLegacyUsersBalance(userId, this.toPositive(Number(postBalance) - balanceToSubtract))

      const { data: transferReqRow, error: transferReqErr } = await supabase
        .from('point_transfer_requests')
        .insert({
          sender_id: senderProfileId,
          recipient_id: recipient.id,
          points_amount: amount,
          fee_amount: feeAmount,
          status: 'completed',
          metadata: {
            currency,
            total_debited: totalDebited,
            conversion_rate: conversionRate,
            recipient_email: recipient.email,
            recipient_name: recipient.fullName
          },
          created_at: nowIso,
          processed_at: nowIso,
          processed_by: senderProfileId
        })

        .select('id')
        .single()

      if (transferReqErr) {
        throw transferReqErr
      }

      const transferRequestId = transferReqRow?.id ? String(transferReqRow.id) : null

      if (transferRequestId) {
        const { data: existingSenderTransfer } = await supabase
          .from('point_transactions')
          .select('id, points, created_at, reference_id')
          .eq('user_id', userId)
          .eq('type', 'transfer')
          .order('created_at', { ascending: false })
          .limit(5)

        const senderAlreadyLogged = (existingSenderTransfer ?? []).some((tx: any) => {
          const ref = tx?.reference_id
          if (ref && String(ref) === transferRequestId) return true
          const txPoints = Number(tx?.points || 0)
          const txCreated = new Date(String(tx?.created_at || '')).getTime()
          const targetCreated = new Date(nowIso).getTime()
          return txPoints === amount && Math.abs(txCreated - targetCreated) < 10000
        })

        if (!senderAlreadyLogged) {
          await supabase
            .from('point_transactions')
            .insert({
              user_id: userId,
              type: 'transfer',
              points: amount,
              fcfa_value: this.toPositive(amount * conversionRate),
              description: `Transfert vers ${recipient.fullName}`,
              reference_id: transferRequestId,
              created_at: nowIso
            })
        }

        const { data: existingRecipientTransfer } = await supabase
          .from('point_transactions')
          .select('id, points, created_at, reference_id')
          .eq('user_id', recipient.userId)
          .eq('type', 'transfer_in')
          .order('created_at', { ascending: false })
          .limit(5)

        const recipientAlreadyLogged = (existingRecipientTransfer ?? []).some((tx: any) => {
          const ref = tx?.reference_id
          if (ref && String(ref) === transferRequestId) return true
          const txPoints = Number(tx?.points || 0)
          const txCreated = new Date(String(tx?.created_at || '')).getTime()
          const targetCreated = new Date(nowIso).getTime()
          return txPoints === amount && Math.abs(txCreated - targetCreated) < 10000
        })

        if (!recipientAlreadyLogged) {
          await supabase
            .from('point_transactions')
            .insert({
              user_id: recipient.userId,
              type: 'transfer_in',
              points: amount,
              fcfa_value: this.toPositive(amount * conversionRate),
              description: 'Transfert reçu',
              reference_id: transferRequestId,
              created_at: nowIso
            })
        }

        const { data: recipientLoyaltyAfter } = await supabase
          .from('loyalty_points')
          .select('points_balance')
          .eq('user_id', recipient.userId)
          .maybeSingle()

        const recipientNewBalance = Number((recipientLoyaltyAfter as any)?.points_balance ?? 0)
        await this.syncLegacyUsersBalance(recipient.userId, recipientNewBalance)

        if (feeAmount > 0) {
          const { data: existingFee } = await supabase
            .from('point_transactions')
            .select('id, reference_id')
            .eq('user_id', userId)
            .eq('type', 'transfer_fee')
            .eq('reference_id', transferRequestId)
            .limit(1)
            .maybeSingle()

          if (!existingFee) {
            await supabase
              .from('point_transactions')
              .insert({
                user_id: userId,
                type: 'transfer_fee',
                points: feeAmount,
                fcfa_value: this.toPositive(feeAmount * conversionRate),
                description: `Frais de transfert vers ${recipient.fullName}`,
                reference_id: transferRequestId,
                created_at: nowIso
              })
          }
        }

        return
      }

      if (feeAmount > 0) {
        await supabase
          .from('point_transactions')
          .insert({
            user_id: userId,
            type: 'transfer_fee',
            points: feeAmount,
            fcfa_value: this.toPositive(feeAmount * conversionRate),
            description: `Frais de transfert vers ${recipient.fullName}`,
            reference_id: null
          })
      }
    } catch (error) {
      this.handleSupabaseError(error, 'transferPoints')
      throw error instanceof Error ? error : new Error('Erreur inattendue lors du transfert de points')
    }
  }

  /**
   * Échange des points contre une devise configurée (ex: XOF).
   */
  static async exchangePoints(userId: string, fromCurrency: string, toCurrency: string, amount: number): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error("Le montant de l'échange doit être positif")
      }

      // 1) Chemin atomique (recommandé): RPC PostgreSQL — voir migration
      //    20260206_points_exchange_rpc.sql. Toutes les écritures (historique,
      //    transactions, soldes, sync legacy) sont réalisées en une seule
      //    transaction côté base, avec verrouillage du compte.
      try {
        const { error: rpcError } = await supabase.rpc('exchange_points_for_currency', {
          p_user_id: userId,
          p_from_currency: fromCurrency,
          p_to_currency: toCurrency,
          p_points: amount
        })

        if (!rpcError) {
          return
        }

        const rpcMessage = String(rpcError.message ?? '')
        const rpcMissing = /does not exist|could not find the function|PGRST202/i.test(rpcMessage)
        if (!rpcMissing) {
          throw new Error(rpcMessage || "Échange impossible")
        }
        // RPC absente sur cette base → bascule vers le chemin applicatif ci-dessous.
      } catch (rpcFailure) {
        const rpcMessage = rpcFailure instanceof Error ? rpcFailure.message : String(rpcFailure)
        const rpcMissing = /does not exist|could not find the function|PGRST202/i.test(rpcMessage)
        if (!rpcMissing) {
          throw rpcFailure
        }
      }

      // 2) Fallback: chemin applicatif (écritures séparées, idempotence 10 s).
      const [loyalty, settings, fee, limits, rateRow] = await Promise.all([
        this.fetchLoyaltyPointsRow(userId),
        this.getPointSettings(),
        this.getOperationFee('exchange'),
        this.getOperationLimit('exchange'),
        this.getExchangeRate(toCurrency)
      ])

      if (loyalty.error) {
        throw loyalty.error
      }

      if (!loyalty.data) {
        throw new Error('Compte de points introuvable')
      }

      if (loyalty.hasFreezeColumns && Boolean((loyalty.data as any)?.is_frozen ?? false)) {
        const reason = ((loyalty.data as any)?.freeze_reason ?? '').toString().trim()
        throw new Error(reason ? `Compte gelé : ${reason}` : 'Compte gelé : échange impossible')
      }

      if (!rateRow) {
        throw new Error('Aucun taux de change disponible pour la devise sélectionnée')
      }

      const currentBalance = loyalty.data.points_balance || 0
      const feeConfig = this.mapFeeConfiguration(fee, settings?.default_currency || 'XOF')
      const feeAmount = this.calculateFee(amount, feeConfig)
      const totalDebited = amount + feeAmount
      this.ensureLimits(totalDebited, limits, "montant d'échange")

      if (totalDebited > currentBalance) {
        throw new Error('Solde insuffisant pour effectuer l\'échange')
      }

      const conversionRate = this.resolvePointsToFcfaRate(settings)
      const convertedAmount = Number((amount * rateRow.rate).toFixed(2))

      const { data: exchangeRow, error: exchangeErr } = await supabase
        .from('point_exchange_history')
        .insert({
          user_id: userId,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          points_amount: amount,
          converted_amount: convertedAmount,
          fee_amount: feeAmount,
          rate: rateRow.rate,
          metadata: {
            conversion_rate: conversionRate
          }
        })
        .select('id')
        .single()

      if (exchangeErr) {
        throw exchangeErr
      }

            const exchangeId = exchangeRow?.id ? String(exchangeRow.id) : null

      // Idempotence: éviter de doubler les écritures en cas de retry réseau. On
      // vérifie d'abord si un point_transactions `exchange` référence déjà un
      // échange identique (même amount + même devise cible) créé il y a < 10s.
      const idempotencyWindowStart = new Date(Date.now() - 10_000).toISOString()
      const { data: existingExchangeTx } = await supabase
        .from('point_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'exchange')
        .eq('points', amount)
        .gte('created_at', idempotencyWindowStart)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingExchangeTx?.id) {
        // Échange déjà enregistré pour ce lot → ne pas réécrire.
        return
      }

      await supabase
        .from('point_transactions')
        .insert([
          {
            user_id: userId,
            type: 'exchange',
            points: amount,
            fcfa_value: Number((amount * conversionRate).toFixed(2)),
            description: `Échange ${fromCurrency} ➝ ${toCurrency}`,
            reference_id: exchangeId
          },
          ...(feeAmount > 0
            ? [
                {
                  user_id: userId,
                  type: 'exchange_fee',
                  points: feeAmount,
                  fcfa_value: Number((feeAmount * conversionRate).toFixed(2)),
                  description: `Frais d'échange ${toCurrency}`,
                  reference_id: exchangeId
                }
              ]
            : [])
        ])

      await supabase
        .from('loyalty_points')
        .update({
          points_balance: this.toPositive(currentBalance - totalDebited),
          points_spent: this.toPositive((loyalty.data.points_spent || 0) + totalDebited),
          fcfa_value: this.toPositive((loyalty.data.fcfa_value || 0) - (amount * conversionRate))
        })
        .eq('user_id', userId)

      await this.syncLegacyUsersBalance(userId, this.toPositive(currentBalance - totalDebited))
    } catch (error) {
      this.handleSupabaseError(error, 'exchangePoints')
      throw error instanceof Error ? error : new Error("Erreur inattendue lors de l'échange de points")
    }
  }

  /**
   * Créé une demande de retrait de points pour l'utilisateur client.
   */
  static async requestWithdrawal(userId: string, amount: number, method: string, metadata: Record<string, unknown> = {}): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error('Le montant du retrait doit être positif')
      }

      const [loyalty, settings, limits] = await Promise.all([
        this.fetchLoyaltyPointsRow(userId),
        this.getPointSettings(),
        this.getOperationLimit('withdrawal')
      ])

      if (loyalty.error) {
        throw loyalty.error
      }

      if (!loyalty.data) {
        throw new Error('Compte de points introuvable')
      }

      if (loyalty.hasFreezeColumns && Boolean((loyalty.data as any)?.is_frozen ?? false)) {
        const reason = ((loyalty.data as any)?.freeze_reason ?? '').toString().trim()
        throw new Error(reason ? `Compte gelé : ${reason}` : 'Compte gelé : retrait impossible')
      }

      const methodRow = await (async () => {
        const byId = await supabase
          .from('point_withdrawal_methods')
          .select('*')
          .eq('id', method)
          .maybeSingle()

        if (!byId.error && byId.data) {
          return byId.data as PointWithdrawalMethodRow
        }

        const byName = await supabase
          .from('point_withdrawal_methods')
          .select('*')
          .eq('name', method)
          .maybeSingle()

        if (!byName.error && byName.data) {
          return byName.data as PointWithdrawalMethodRow
        }

        return undefined
      })()

      if (!methodRow) {
        throw new Error('Méthode de retrait introuvable')
      }

      const currency = settings?.default_currency || 'XOF'

      this.ensureLimits(amount, limits, 'montant de retrait')

      const currentBalance = loyalty.data.points_balance || 0
      // Règle métier: pas de frais de retrait. Total débité = points saisis.
      const feeAmount = 0
      const totalDebited = amount

      if (totalDebited > currentBalance) {
        throw new Error('Solde insuffisant pour effectuer le retrait')
      }

      const conversionRate = settings?.conversion_rate || 1
      const settingsMetadata = (settings as any)?.metadata ?? {}
      const conversion = (settingsMetadata?.conversion ?? {}) as Record<string, unknown>
      const withdrawalValueRaw = Number((conversion as any)?.withdrawalValue)
      const withdrawalValue = Number.isFinite(withdrawalValueRaw) && withdrawalValueRaw > 0 ? withdrawalValueRaw : Number(conversionRate || 1)

      const payoutAmount = Number((amount * withdrawalValue).toFixed(2))

      const { data: withdrawalRequest, error } = await supabase
        .from('point_withdrawal_requests')
        .insert({
          user_id: userId,
          method_id: methodRow.id,
          points_amount: amount,
          payout_amount: payoutAmount,
          fee_amount: feeAmount,
          currency,
          status: 'pending',
          metadata: {
            conversion_rate: conversionRate,
            withdrawal_value: withdrawalValue,
            method,
            ...metadata
          }
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      await supabase
        .from('point_transactions')
        .insert([
          {
            user_id: userId,
            type: 'withdrawal',
            points: amount,
            fcfa_value: payoutAmount,
            description: `Demande de retrait via ${method}`,
            reference_id: withdrawalRequest.id
          }
        ])

      await supabase
        .from('loyalty_points')
        .update({
          points_balance: this.toPositive(currentBalance - totalDebited),
          points_spent: this.toPositive((loyalty.data.points_spent || 0) + totalDebited),
          fcfa_value: this.toPositive((loyalty.data.fcfa_value || 0) - (totalDebited * withdrawalValue))
        })
        .eq('user_id', userId)

      await this.syncLegacyUsersBalance(userId, this.toPositive(currentBalance - totalDebited))
    } catch (error) {
      this.handleSupabaseError(error, 'requestWithdrawal')
      throw error instanceof Error ? error : new Error('Erreur inattendue lors de la demande de retrait')
    }
  }

  private static mapFeeConfiguration(feeRow: PointOperationFeeRow | null, fallbackCurrency: string): FeeConfiguration {
    return {
      flat: this.toPositive(Number(feeRow?.flat_fee ?? 0)),
      percentage: Number(feeRow?.percentage_fee ?? 0),
      minimum: this.toPositive(Number(feeRow?.minimum_fee ?? 0)),
      maximum: feeRow?.maximum_fee !== undefined && feeRow?.maximum_fee !== null ? this.toPositive(Number(feeRow.maximum_fee)) : null,
      currency: feeRow?.currency || fallbackCurrency
    }
  }

  private static mapLimitConfiguration(limitRow: PointOperationLimitRow | null): LimitConfiguration {
    return {
      min: limitRow?.min_amount !== undefined && limitRow?.min_amount !== null ? this.toPositive(Number(limitRow.min_amount)) : 0,
      max: limitRow?.max_amount !== undefined && limitRow?.max_amount !== null ? this.toPositive(Number(limitRow.max_amount)) : null,
      daily: limitRow?.daily_limit !== undefined && limitRow?.daily_limit !== null ? this.toPositive(Number(limitRow.daily_limit)) : null,
      monthly: limitRow?.monthly_limit !== undefined && limitRow?.monthly_limit !== null ? this.toPositive(Number(limitRow.monthly_limit)) : null
    }
  }

  private static calculateFee(amount: number, feeConfig: FeeConfiguration | null | undefined): number {
    if (!feeConfig || amount <= 0) {
      return 0
    }

    const percentagePart = (amount * (feeConfig.percentage || 0)) / 100

    const flat = Number(feeConfig.flat || 0)
    const minimum = Number(feeConfig.minimum || 0)
    const maximum = feeConfig.maximum !== undefined && feeConfig.maximum !== null ? Number(feeConfig.maximum) : null

    let totalFee = flat + percentagePart
    if (Number.isFinite(minimum) && minimum > 0) {
      totalFee = Math.max(totalFee, minimum)
    }
    if (maximum !== null && Number.isFinite(maximum) && maximum >= 0) {
      totalFee = Math.min(totalFee, maximum)
    }

    return this.toPositive(totalFee)
  }

  private static toPositive(value: number) {
    return Number(Math.max(value, 0).toFixed(2))
  }

  /**
   * Vérifie que le montant total débité respecte les limites min/max configurées
   * par le super-admin (table point_operation_limits) pour l'opération donnée.
   */
  private static ensureLimits(
    amount: number,
    limitRow: PointOperationLimitRow | null | undefined,
    label: string
  ): void {
    if (!limitRow) return
    const min = limitRow.min_amount !== undefined && limitRow.min_amount !== null ? Number(limitRow.min_amount) : null
    const max = limitRow.max_amount !== undefined && limitRow.max_amount !== null ? Number(limitRow.max_amount) : null

    if (min !== null && Number.isFinite(min) && min > 0 && amount < min) {
      throw new Error(`Le montant minimum pour ${label} est de ${this.toLocaleNumber(min)} points`)
    }
    if (max !== null && Number.isFinite(max) && max > 0 && amount > max) {
      throw new Error(`Le montant maximum pour ${label} est de ${this.toLocaleNumber(max)} points`)
    }
  }

  /**
   * Synchronise la colonne legacy users.points_balance afin que le solde affiché côté
   * super-admin (qui lit users.points_balance) reste cohérent avec loyalty_points.
   * Best-effort : ne doit jamais bloquer l'opération principale.
   */
  private static async syncLegacyUsersBalance(userId: string, newBalance: number): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ points_balance: this.toPositive(Number(newBalance) || 0) } as any)
        .eq('id', userId)
    } catch {
      // Ignore la synchro legacy en cas d'échec (police RLS ou autre).
    }
  }

  private static async getPointSettings(): Promise<PointSettingsRow | null> {
    try {
      const { data, error } = await supabase
        .from('point_settings')
        .select('*')
        .eq('scope', 'global')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw error
      }

      return (data as unknown as PointSettingsRow) ?? null
    } catch (error) {
      this.handleSupabaseError(error, 'getPointSettings')
      return null
    }
  }

  private static async getOperationFee(operationType: 'transfer' | 'exchange' | 'withdrawal'): Promise<PointOperationFeeRow | null> {
    try {
      const { data, error } = await supabase
        .from('point_operation_fees')
        .select('*')
        .eq('operation_type', operationType)
        .eq('scope', 'global')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw error
      }

      return (data as unknown as PointOperationFeeRow) ?? null
    } catch (error) {
      this.handleSupabaseError(error, `getOperationFee:${operationType}`)
      return null
    }
  }

  private static async getOperationLimit(operationType: 'transfer' | 'exchange' | 'withdrawal'): Promise<PointOperationLimitRow | null> {
    try {
      const { data, error } = await supabase
        .from('point_operation_limits')
        .select('*')
        .eq('operation_type', operationType)
        .eq('scope', 'global')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw error
      }

      return (data as unknown as PointOperationLimitRow) ?? null
    } catch (error) {
      this.handleSupabaseError(error, `getOperationLimit:${operationType}`)
      return null
    }
  }

  private static async getExchangeRate(currency: string): Promise<PointExchangeRateRow | null> {
    try {
      const { data, error } = await supabase
        .from('point_exchange_rates')
        .select('*')
        .eq('currency', currency)
        .limit(1)

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        return data[0]
      }

      const { data: defaults, error: defaultError } = await supabase
        .from('point_exchange_rates')
        .select('*')
        .eq('is_default', true)
        .limit(1)

      if (defaultError) {
        throw defaultError
      }

      return defaults?.[0] ?? null
    } catch (error) {
      this.handleSupabaseError(error, 'getExchangeRate')
      return null
    }
  }

  private static async getAllExchangeRates(): Promise<PointExchangeRateRow[]> {
    try {
      const { data, error } = await supabase
        .from('point_exchange_rates')
        .select('*')

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      this.handleSupabaseError(error, 'getAllExchangeRates')
      return []
    }
  }

  private static async getWithdrawalMethods(): Promise<Array<{ method: PointWithdrawalMethodRow; limits: PointWithdrawalMethodLimitRow[] }>> {
    try {
      const { data: methods, error } = await supabase
        .from('point_withdrawal_methods')
        .select('*')

      if (error) {
        throw error
      }

      if (!methods || methods.length === 0) {
        return []
      }

      const methodIds = methods.map(method => method.id)
      const { data: limits, error: limitsError } = await supabase
        .from('point_withdrawal_method_limits')
        .select('*')
        .in('method_id', methodIds)

      if (limitsError) {
        throw limitsError
      }

      const grouped = new Map<string, PointWithdrawalMethodLimitRow[]>()
      ;(limits || []).forEach(limit => {
        const current = grouped.get(limit.method_id) || []
        current.push(limit)
        grouped.set(limit.method_id, current)
      })

      return methods.map(method => ({
        method,
        limits: grouped.get(method.id) || []
      }))
    } catch (error) {
      this.handleSupabaseError(error, 'getWithdrawalMethods')
      return []
    }
  }

  private static async filterProfilesByRole<T extends { user_id: string }>(profiles: T[]): Promise<T[]> {
    if (profiles.length === 0) {
      return []
    }
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .in('id', profiles.map(profile => profile.user_id))

    if (error) {
      throw error
    }

    const allowed = new Set(['client', 'vendor'])
    const roles = new Map((data || []).map(user => [user.id, user.role]))
    return profiles.filter(profile => allowed.has((roles.get(profile.user_id) as string) || ''))
  }

  private static async getEligibleUserProfile(userProfileId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name, phone, short_code')
        .eq('id', userProfileId)
        .limit(1)

      if (error) {
        throw error
      }

      const filtered = await this.filterProfilesByRole(data || [])
      const profile = filtered[0]
      if (!profile) {
        return null
      }

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', profile.user_id)
        .single()

      if (userError) {
        throw userError
      }

      return {
        id: profile.id,
        userId: profile.user_id,
        fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || userRow.email || `Profil ${profile.id.slice(0, 8)}`,
        email: userRow.email,
        phone: profile.phone,
        username: null,
        shortCode: (profile as typeof profile & { short_code?: string | null }).short_code || null
      }
    } catch (error) {
      this.handleSupabaseError(error, 'getEligibleUserProfile')
      return null
    }
  }

  /**
   * Journalise les erreurs Supabase avec un maximum de contexte utile.
   */
  private static handleSupabaseError(error: unknown, context: string): void {
    const isObject = typeof error === 'object' && error !== null
    const supabaseError = isObject ? (error as { message?: string; code?: string; details?: string | null; hint?: string | null }) : null

    const message = error instanceof Error
      ? error.message
      : supabaseError?.message || 'Erreur Supabase inconnue'

    /**
     * Les erreurs réseau/abort sont fréquentes en dev (HMR, offline, API indisponible).
     * Next.js affiche un overlay quand on utilise console.error; on dégrade donc ces cas en warn.
     */
    const errorName = isObject ? String((error as any)?.name ?? '') : ''
    const isAbortError = errorName === 'AbortError' || message === 'AbortError'
    const isNetworkError = /failed to fetch|networkerror|load failed|fetch failed/i.test(message)
    const isAuthLockTimeout = /lockmanager lock .* timed out|acquiring an exclusive navigator lockmanager lock/i.test(message)

    const detailsPayload = supabaseError
      ? {
          code: supabaseError.code ?? null,
          details: supabaseError.details ?? null,
          hint: supabaseError.hint ?? null
        }
      : error

    if (isAbortError || isNetworkError || isAuthLockTimeout) {
      console.warn(`⚠️ [ClientPointsService:${context}] ${message}`, detailsPayload)
      return
    }

    console.error(`❌ [ClientPointsService:${context}] ${message}`, detailsPayload)
  }
}
