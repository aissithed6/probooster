/**
 * Service Supabase pour la gestion complète du programme Points & Fidélité côté Super Admin.
 */

import { supabase, getSupabaseAdmin } from '@/lib/supabase'

export type LoyaltyRuleType = 'purchase' | 'bonus' | 'referral' | 'social' | 'custom'
export type LoyaltyRewardType = 'discount' | 'free_shipping' | 'free_product' | 'cashback' | 'voucher'
export type LoyaltyRewardValueType = 'percentage' | 'fixed' | 'points'
export type LoyaltyTransactionType = 'earn' | 'spend' | 'expire' | 'adjustment'
export type LoyaltySnapshotPeriod = '1month' | '3months' | '6months' | '1year'
export type LoyaltyMemberTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
export type LoyaltyMemberStatus = 'active' | 'inactive' | 'suspended'

export interface LoyaltyRule {
  id: string
  name: string
  rule_type: LoyaltyRuleType
  description: string | null
  points_value: number
  multiplier: number | null
  min_amount: number | null
  max_points: number | null
  is_active: boolean
  conditions: string[]
  metadata: Record<string, unknown>
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface LoyaltyReward {
  id: string
  name: string
  reward_type: LoyaltyRewardType
  description: string | null
  points_cost: number
  value: number
  value_type: LoyaltyRewardValueType
  min_order_amount: number | null
  max_usage: number | null
  current_usage: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  categories: string[]
  metadata: Record<string, unknown>
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface LoyaltyMember {
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  tier: LoyaltyMemberTier
  total_points: number
  available_points: number
  lifetime_points: number
  total_orders: number
  total_spent: number
  referral_count: number
  status: LoyaltyMemberStatus
  joined_at: string
  last_activity: string | null
  metadata: Record<string, unknown>
  updated_at: string
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  rule_id: string | null
  reward_id: string | null
  transaction_type: LoyaltyTransactionType
  points: number
  balance_after: number | null
  description: string | null
  reference: string | null
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  metadata: Record<string, unknown>
  created_at: string
}

export interface LoyaltyAnalyticsSnapshot {
  id: string
  snapshot_period: LoyaltySnapshotPeriod
  total_points: number
  active_members: number
  exchanged_points: number
  total_value: number
  monthly_growth: number
  member_growth: number
  point_growth: number
  value_growth: number
  metadata: Record<string, unknown>
  captured_at: string
}

/**
 * Prépare la charge utile d'une règle pour une insertion ou mise à jour Supabase.
 */
function mapRulePayload(rule: Partial<LoyaltyRule>) {
  if (!rule.name || !rule.rule_type) {
    throw new Error('Les champs "name" et "rule_type" sont obligatoires pour une règle de fidélité.')
  }

  return {
    name: rule.name,
    rule_type: rule.rule_type,
    description: rule.description ?? null,
    points_value: rule.points_value ?? 0,
    multiplier: rule.multiplier ?? null,
    min_amount: rule.min_amount ?? null,
    max_points: rule.max_points ?? null,
    is_active: rule.is_active ?? true,
    conditions: rule.conditions ?? [],
    metadata: rule.metadata ?? {},
    updated_by: rule.updated_by ?? null
  }
}

/**
 * Prépare la charge utile d'une récompense pour une insertion ou mise à jour Supabase.
 */
function mapRewardPayload(reward: Partial<LoyaltyReward>) {
  if (!reward.name || !reward.reward_type || !reward.value_type) {
    throw new Error('Les champs "name", "reward_type" et "value_type" sont obligatoires pour une récompense.')
  }

  return {
    name: reward.name,
    reward_type: reward.reward_type,
    description: reward.description ?? null,
    points_cost: reward.points_cost ?? 0,
    value: reward.value ?? 0,
    value_type: reward.value_type,
    min_order_amount: reward.min_order_amount ?? null,
    max_usage: reward.max_usage ?? null,
    current_usage: reward.current_usage ?? 0,
    is_active: reward.is_active ?? true,
    start_date: reward.start_date ?? null,
    end_date: reward.end_date ?? null,
    categories: reward.categories ?? [],
    metadata: reward.metadata ?? {},
    updated_by: reward.updated_by ?? null
  }
}

export class LoyaltyAdminService {
  // RÈGLES -------------------------------------------------------------
  /**
   * Retourne toutes les règles de fidélité triées par date de création décroissante.
   */
  static async listRules(): Promise<LoyaltyRule[]> {
    const { data, error } = await supabase
      .from('loyalty_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data ?? []
  }

  /**
   * Récupère une règle précise via son identifiant.
   */
  static async getRule(ruleId: string): Promise<LoyaltyRule | null> {
    const { data, error } = await supabase
      .from('loyalty_rules')
      .select('*')
      .eq('id', ruleId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ?? null
  }

  /**
   * Crée une nouvelle règle de fidélité et renvoie l'entité persistée.
   */
  static async createRule(rule: Partial<LoyaltyRule>, userId: string): Promise<LoyaltyRule> {
    const payload = {
      ...mapRulePayload(rule),
      created_by: userId
    }

    const { data, error } = await supabase
      .from('loyalty_rules')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Met à jour une règle de fidélité existante et retourne la version à jour.
   */
  static async updateRule(ruleId: string, updates: Partial<LoyaltyRule>): Promise<LoyaltyRule> {
    const payload = mapRulePayload(updates)

    const { data, error } = await supabase
      .from('loyalty_rules')
      .update(payload)
      .eq('id', ruleId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Désactive ou supprime définitivement une règle de fidélité.
   */
  static async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('loyalty_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      throw error
    }
  }
  /**
   * Met à jour uniquement le statut actif d'une règle sans toucher aux autres champs.
   */
  static async setRuleStatus(ruleId: string, isActive: boolean, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('loyalty_rules')
      .update({
        is_active: isActive,
        updated_by: userId ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)

    if (error) {
      throw error
    }
  }

  // RÉCOMPENSES -------------------------------------------------------
  /**
   * Retourne toutes les récompenses disponibles avec les plus récentes en premier.
   */
  static async listRewards(): Promise<LoyaltyReward[]> {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data ?? []
  }

  /**
   * Récupère une récompense spécifique via son identifiant.
   */
  static async getReward(rewardId: string): Promise<LoyaltyReward | null> {
    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('id', rewardId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ?? null
  }

  /**
   * Crée une nouvelle récompense et renvoie l'enregistrement créé.
   */
  static async createReward(reward: Partial<LoyaltyReward>, userId: string): Promise<LoyaltyReward> {
    const payload = {
      ...mapRewardPayload(reward),
      created_by: userId
    }

    const { data, error } = await supabase
      .from('loyalty_rewards')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Met à jour une récompense existante et retourne la version persistée.
   */
  static async updateReward(rewardId: string, updates: Partial<LoyaltyReward>): Promise<LoyaltyReward> {
    const payload = mapRewardPayload(updates)

    const { data, error } = await supabase
      .from('loyalty_rewards')
      .update(payload)
      .eq('id', rewardId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  /**
   * Supprime définitivement une récompense définie par son identifiant.
   */
  static async deleteReward(rewardId: string): Promise<void> {
    const { error } = await supabase
      .from('loyalty_rewards')
      .delete()
      .eq('id', rewardId)

    if (error) {
      throw error
    }
  }
  /**
   * Met à jour uniquement l'état actif d'une récompense dans Supabase.
   */
  static async setRewardStatus(rewardId: string, isActive: boolean, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('loyalty_rewards')
      .update({
        is_active: isActive,
        updated_by: userId ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', rewardId)

    if (error) {
      throw error
    }
  }

  // MEMBRES -----------------------------------------------------------
  /**
   * Liste les membres avec leurs informations de profil enrichies.
   */
  static async listMembers(): Promise<LoyaltyMember[]> {
    const { data, error } = await supabase
      .from('loyalty_members_with_profiles')
      .select('*')
      .order('total_points', { ascending: false })

    if (error) {
      throw error
    }

    return data ?? []
  }

  /**
   * Récupère un membre précis via son identifiant utilisateur.
   */
  static async getMember(userId: string): Promise<LoyaltyMember | null> {
    const { data, error } = await supabase
      .from('loyalty_members_with_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ?? null
  }

  /**
   * Met à jour les valeurs agrégées d'un membre (points, statut, métadonnées).
   */
  static async updateMember(userId: string, updates: Partial<LoyaltyMember>): Promise<LoyaltyMember> {
    const payload = {
      tier: updates.tier,
      total_points: updates.total_points,
      available_points: updates.available_points,
      lifetime_points: updates.lifetime_points,
      total_orders: updates.total_orders,
      total_spent: updates.total_spent,
      referral_count: updates.referral_count,
      status: updates.status,
      last_activity: updates.last_activity,
      metadata: updates.metadata
    }

    const { data, error } = await supabase
      .from('loyalty_members')
      .update(payload)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return {
      ...data,
      first_name: updates.first_name ?? null,
      last_name: updates.last_name ?? null,
      email: updates.email ?? null,
      phone: updates.phone ?? null
    } as LoyaltyMember
  }

  // TRANSACTIONS ------------------------------------------------------
  /**
   * Récupère les transactions les plus récentes, limitées à la taille demandée.
   */
  static async listTransactions(limit = 200): Promise<LoyaltyTransaction[]> {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data ?? []
  }

  /**
   * Récupère les transactions associées à un utilisateur donné.
   */
  static async listTransactionsByUser(userId: string, limit = 100): Promise<LoyaltyTransaction[]> {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data ?? []
  }

  /**
   * Enregistre une nouvelle transaction de points et renvoie l'entrée créée.
   */
  static async recordTransaction(transaction: Partial<LoyaltyTransaction>): Promise<LoyaltyTransaction> {
    if (!transaction.user_id || !transaction.transaction_type || transaction.points === undefined) {
      throw new Error('Les champs "user_id", "transaction_type" et "points" sont obligatoires pour une transaction.')
    }

    const payload = {
      user_id: transaction.user_id,
      rule_id: transaction.rule_id ?? null,
      reward_id: transaction.reward_id ?? null,
      transaction_type: transaction.transaction_type,
      points: transaction.points,
      balance_after: transaction.balance_after ?? null,
      description: transaction.description ?? null,
      reference: transaction.reference ?? null,
      status: transaction.status ?? 'completed',
      metadata: transaction.metadata ?? {}
    }

    const { data, error } = await supabase
      .from('loyalty_transactions')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  // ANALYTICS --------------------------------------------------------
  /**
   * Récupère les snapshots analytics les plus récents.
   */
  static async listSnapshots(limit = 12): Promise<LoyaltyAnalyticsSnapshot[]> {
    const { data, error } = await supabase
      .from('loyalty_analytics_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return data ?? []
  }

  /**
   * Crée un snapshot analytics pour une période donnée.
   */
  static async createSnapshot(snapshot: Partial<LoyaltyAnalyticsSnapshot>): Promise<LoyaltyAnalyticsSnapshot> {
    if (!snapshot.snapshot_period) {
      throw new Error('Le champ "snapshot_period" est obligatoire pour un snapshot analytics.')
    }

    const payload = {
      snapshot_period: snapshot.snapshot_period,
      total_points: snapshot.total_points ?? 0,
      active_members: snapshot.active_members ?? 0,
      exchanged_points: snapshot.exchanged_points ?? 0,
      total_value: snapshot.total_value ?? 0,
      monthly_growth: snapshot.monthly_growth ?? 0,
      member_growth: snapshot.member_growth ?? 0,
      point_growth: snapshot.point_growth ?? 0,
      value_growth: snapshot.value_growth ?? 0,
      metadata: snapshot.metadata ?? {}
    }

    const { data, error } = await supabase
      .from('loyalty_analytics_snapshots')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  // MÉTHODES SERVEUR (service role) ---------------------------------
  /**
   * Réinitialise le compteur d'utilisation d'une récompense (usage serveur).
   */
  static async resetRewardUsage(rewardId: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('loyalty_rewards')
      .update({ current_usage: 0 })
      .eq('id', rewardId)

    if (error) {
      throw error
    }
  }

  /**
   * Désactive en masse un ensemble de règles via le rôle service.
   */
  static async bulkDeactivateRules(ruleIds: string[]): Promise<void> {
    if (!ruleIds.length) {
      return
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('loyalty_rules')
      .update({ is_active: false })
      .in('id', ruleIds)

    if (error) {
      throw error
    }
  }
}
