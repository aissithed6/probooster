import { getClientAccessTokenSafe, supabase } from '../supabase'

/**
 * Service de gestion des partages et engagements
 * Synchronisé avec Supabase en temps réel
 */

export interface ProductShare {
  id: string
  user_id: string
  product_id: string
  vendor_id: string
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'instagram' | 'linkedin' | 'tiktok' | 'email' | 'copy'
  share_url: string
  points_earned: number
  created_at: string
}

export type ProductShareCounts = {
  total: number
  byPlatform: Record<string, number>
}

export interface ShareInteraction {
  id: string
  share_id: string
  interaction_type: 'view' | 'click' | 'conversion' | 'purchase'
  user_id?: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  created_at: string
}

export interface ShareAnalytics {
  total_shares: number
  shares_by_platform: Record<string, number>
  total_interactions: number
  interactions_by_type: Record<string, number>
  total_points_earned: number
  conversion_rate: number
  top_products: Array<{
    product_id: string
    product_name: string
    shares: number
    interactions: number
  }>
}

export class ShareEngagementService {
  /**
   * Cache d'éligibilité (côté client) pour éviter un aller-retour réseau à chaque clic.
   * Clé: accessToken (ou 'anon') + productId + platform.
   */
  private static eligibilityCache = new Map<
    string,
    {
      expiresAt: number
      value:
        | {
            canEarnPoints: boolean
            points: number
            alreadyRewarded: boolean
            isOwnProduct: boolean
            reason: string
          }
        | null
    }
  >()

  private static adminPointsConfigCache: {
    purchaseValue: number
    socialShareValue: number
    socialSharePerNetwork: Record<string, number>
    fetchedAt: number
  } | null = null

  private static adminPointsConfigInFlight: Promise<{
    purchaseValue: number
    socialShareValue: number
    socialSharePerNetwork: Record<string, number>
  } | null> | null = null

  private static realtimeInitialized = false

  private static sharePointsCache: {
    perNetwork: Record<string, number>
    defaultValue: number
    fetchedAt: number
  } | null = null

  private static sharePointsInFlight: Promise<{
    perNetwork: Record<string, number>
    defaultValue: number
  } | null> | null = null

  private static invalidateCaches() {
    this.adminPointsConfigCache = null
    this.sharePointsCache = null
    this.adminPointsConfigInFlight = null
    this.sharePointsInFlight = null
  }

  private static ensureRealtimeInvalidation() {
    if (typeof window === 'undefined') return
    if (this.realtimeInitialized) return
    this.realtimeInitialized = true

    try {
      supabase
        .channel('share-engagement-points-settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'point_settings' }, () => {
          this.invalidateCaches()
        })
        .subscribe()
    } catch {
      // ignore
    }
  }

  /**
   * Charge la configuration de points Super Admin depuis `point_settings`.
   * Utilisable côté client même sans session (pages publiques), car la source est globale.
   */
  static async getAdminPointsConfig(): Promise<{
    purchaseValue: number
    socialShareValue: number
    socialSharePerNetwork: Record<string, number>
  } | null> {
    this.ensureRealtimeInvalidation()

    if (this.adminPointsConfigCache) {
      return {
        purchaseValue: this.adminPointsConfigCache.purchaseValue,
        socialShareValue: this.adminPointsConfigCache.socialShareValue,
        socialSharePerNetwork: this.adminPointsConfigCache.socialSharePerNetwork
      }
    }

    if (this.adminPointsConfigInFlight) {
      return await this.adminPointsConfigInFlight
    }

    const now = Date.now()
    this.adminPointsConfigInFlight = (async () => {

    const toLocaleNumber = (value: unknown): number => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const normalized = value.trim().replace(',', '.')
        const parsed = Number(normalized)
        return Number.isFinite(parsed) ? parsed : NaN
      }
      const numeric = Number(value)
      return Number.isFinite(numeric) ? numeric : NaN
    }

    // Préférer un endpoint serveur-side (Supabase admin) pour éviter les erreurs RLS côté client.
    try {
      const res = await fetch('/api/public/points-config', { method: 'GET', cache: 'no-store' })
      const json = await res.json().catch(() => null)
      const payload = json?.data

      if (res.ok && payload) {
        const purchaseValue = Number(payload.purchaseValue)
        const socialShareValue = Number(payload.socialShareValue)
        const perNetwork = (payload.socialSharePerNetwork ?? {}) as Record<string, any>

        const safePurchaseValue = Number.isFinite(purchaseValue) && purchaseValue > 0 ? purchaseValue : 1
        const safeSocialShareValue = Number.isFinite(socialShareValue) && socialShareValue >= 0 ? socialShareValue : 0

        const socialSharePerNetwork: Record<string, number> = {}
        Object.entries(perNetwork).forEach(([key, value]) => {
          const normalizedKey = String(key).toLowerCase().trim()
          const numeric = Number(value)
          if (!normalizedKey) return
          if (!Number.isFinite(numeric) || numeric < 0) return
          socialSharePerNetwork[normalizedKey] = numeric
        })

        this.adminPointsConfigCache = {
          purchaseValue: safePurchaseValue,
          socialShareValue: safeSocialShareValue,
          socialSharePerNetwork,
          fetchedAt: now
        }

        return { purchaseValue: safePurchaseValue, socialShareValue: safeSocialShareValue, socialSharePerNetwork }
      }
    } catch {
      // fallback: lecture directe Supabase
    }

    const { data: settingsRow, error } = await supabase
      .from('point_settings')
      .select('conversion_rate, metadata')
      .eq('scope', 'global')
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!settingsRow) {
      return null
    }

    const metadata = (settingsRow.metadata ?? {}) as Record<string, any>
    const conversion = (metadata.conversion ?? {}) as Record<string, any>

    const conversionRateRaw = Number((settingsRow as any)?.conversion_rate)
    const conversionRate = Number.isFinite(conversionRateRaw) && conversionRateRaw > 0 ? conversionRateRaw : 1

    const purchaseValueRaw = toLocaleNumber(conversion.purchaseValue)
    const purchaseValue = Number.isFinite(purchaseValueRaw) && purchaseValueRaw > 0 ? purchaseValueRaw : conversionRate

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

    this.adminPointsConfigCache = {
      purchaseValue,
      socialShareValue,
      socialSharePerNetwork,
      fetchedAt: now
    }

    return { purchaseValue, socialShareValue, socialSharePerNetwork }
    })().finally(() => {
      this.adminPointsConfigInFlight = null
    })

    return await this.adminPointsConfigInFlight
  }

  /**
   * Charge la configuration de points de partage depuis point_settings (Super Admin).
   * Retourne null si la configuration n'est pas disponible.
   */
  private static async getAdminSharePointsConfig(): Promise<{
    perNetwork: Record<string, number>
    defaultValue: number
  } | null> {
    this.ensureRealtimeInvalidation()

    if (this.sharePointsCache) {
      return {
        perNetwork: this.sharePointsCache.perNetwork,
        defaultValue: this.sharePointsCache.defaultValue
      }
    }

    if (this.sharePointsInFlight) {
      return await this.sharePointsInFlight
    }

    const now = Date.now()
    this.sharePointsInFlight = (async () => {

    const toLocaleNumber = (value: unknown): number => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const normalized = value.trim().replace(',', '.')
        const parsed = Number(normalized)
        return Number.isFinite(parsed) ? parsed : NaN
      }
      const numeric = Number(value)
      return Number.isFinite(numeric) ? numeric : NaN
    }

    // Préférer l'endpoint public (Supabase admin) pour éviter RLS + assurer la dernière config.
    try {
      const res = await fetch('/api/public/points-config', { method: 'GET', cache: 'no-store' })
      const json = await res.json().catch(() => null)
      const payload = json?.data
      if (res.ok && payload) {
        const defaultRaw = toLocaleNumber(payload?.socialShareValue)
        const defaultValue = Number.isFinite(defaultRaw) && defaultRaw >= 0 ? defaultRaw : 0

        const perNetworkRaw = (payload?.socialSharePerNetwork ?? {}) as Record<string, any>
        const perNetwork: Record<string, number> = {}
        Object.entries(perNetworkRaw).forEach(([key, value]) => {
          const normalizedKey = String(key).toLowerCase().trim()
          const numeric = toLocaleNumber(value)
          if (!normalizedKey) return
          if (!Number.isFinite(numeric) || numeric < 0) return
          perNetwork[normalizedKey] = numeric
        })

        this.sharePointsCache = {
          perNetwork,
          defaultValue,
          fetchedAt: now
        }

        return { perNetwork, defaultValue }
      }
    } catch {
      // fallback: lecture directe Supabase
    }

    const { data: settingsRow, error } = await supabase
      .from('point_settings')
      .select('metadata')
      .eq('scope', 'global')
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!settingsRow) {
      return null
    }

    const metadata = (settingsRow.metadata ?? {}) as Record<string, any>
    const conversion = (metadata.conversion ?? {}) as Record<string, any>

    const defaultValueRaw = conversion.socialShareValue
    const defaultNumeric = toLocaleNumber(defaultValueRaw)
    const defaultValue = Number.isFinite(defaultNumeric) && defaultNumeric >= 0 ? defaultNumeric : 5

    const perNetworkRaw = (metadata.socialSharePerNetwork ?? {}) as Record<string, any>
    const perNetwork: Record<string, number> = {}
    Object.entries(perNetworkRaw).forEach(([key, value]) => {
      const normalizedKey = String(key).toLowerCase().trim()
      const numeric = toLocaleNumber(value)
      if (!normalizedKey) {
        return
      }
      if (!Number.isFinite(numeric) || numeric < 0) {
        return
      }
      perNetwork[normalizedKey] = numeric
    })

    this.sharePointsCache = {
      perNetwork,
      defaultValue,
      fetchedAt: now
    }

    return { perNetwork, defaultValue }
    })().finally(() => {
      this.sharePointsInFlight = null
    })

    return await this.sharePointsInFlight
  }

  /**
   * Récupère les compteurs de partages d'un produit (total + par plateforme).
   * Source de vérité: table `product_shares`.
   */
  static async getProductShareCounts(productId: string): Promise<ProductShareCounts> {
    try {
      const pid = String(productId ?? '').trim()
      if (!pid) {
        return { total: 0, byPlatform: {} }
      }

      // Préférer un endpoint serveur-side (Supabase admin) pour éviter les erreurs RLS côté client.
      try {
        const res = await fetch(`/api/public/products/share-counts?productId=${encodeURIComponent(pid)}`, {
          method: 'GET',
          cache: 'no-store'
        })
        const json = await res.json().catch(() => null)
        const payload = json?.data
        if (res.ok && payload) {
          const totalRaw = Number(payload.total)
          const byPlatformRaw = (payload.byPlatform ?? {}) as Record<string, any>
          const byPlatform: Record<string, number> = {}
          Object.entries(byPlatformRaw).forEach(([key, value]) => {
            const normalizedKey = String(key).toLowerCase().trim()
            const numeric = Number(value)
            if (!normalizedKey) return
            if (!Number.isFinite(numeric) || numeric < 0) return
            byPlatform[normalizedKey] = Math.round(numeric)
          })
          const total = Number.isFinite(totalRaw) && totalRaw >= 0 ? Math.round(totalRaw) : 0
          return { total, byPlatform }
        }
      } catch {
        // fallback: lecture directe Supabase
      }

      const { data, error } = await supabase
        .from('product_shares')
        .select('platform')
        .eq('product_id', pid)

      if (error) throw error

      const byPlatform: Record<string, number> = {}
      for (const row of data ?? []) {
        const platform = String((row as any)?.platform ?? '').trim().toLowerCase()
        if (!platform) continue
        byPlatform[platform] = (byPlatform[platform] || 0) + 1
      }

      const total = Object.values(byPlatform).reduce((sum, value) => sum + (Number(value) || 0), 0)
      return { total, byPlatform }
    } catch (error) {
      console.error('Erreur récupération compteurs partages produit:', error)
      return { total: 0, byPlatform: {} }
    }
  }

  /**
   * Récupère la configuration des points depuis la base de données
   */
  static async getPointsConfig(platform: string): Promise<number> {
    try {
      const normalizedPlatform = String(platform).toLowerCase().trim()

      // 1) Source de vérité: config Super Admin (point_settings.metadata)
      try {
        const adminConfig = await this.getAdminSharePointsConfig()
        if (adminConfig) {
          const perNetworkValue = adminConfig.perNetwork[normalizedPlatform]
          if (perNetworkValue !== undefined) {
            return perNetworkValue
          }

          // Plateformes génériques (copy/email/etc) ou réseau non listé: valeur par défaut
          return adminConfig.defaultValue
        }
      } catch (error) {
        console.warn('Impossible de charger la config Super Admin des points de partage, fallback:', error)
      }

      // 2) Fallback historique: table share_points_config
      const { data, error } = await supabase
        .from('share_points_config')
        .select('points')
        .eq('platform', normalizedPlatform)
        .single()

      if (error) {
        console.warn(`Config non trouvée pour ${platform}, utilisation valeur par défaut`)
        return 5
      }

      return data?.points || 5
    } catch (error) {
      console.error('Erreur récupération config points:', error)
      return 5
    }
  }

  /**
   * Enregistre un nouveau partage
   */
  static async recordShare(
    userId: string,
    productId: string,
    vendorId: string,
    platform: string,
    shareUrl: string,
    options?: { awardPoints?: boolean }
  ): Promise<ProductShare | null> {
    try {
      try {
        const accessToken = await getClientAccessTokenSafe()
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`
        }

        const res = await fetch('/api/shares/record', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productId,
            vendorId,
            platform,
            shareUrl,
            awardPoints: options?.awardPoints
          }),
          cache: 'no-store'
        })

        const json = await res.json().catch(() => null)
        const share = json?.data?.share as ProductShare | undefined

        if (res.ok && share?.id) {
          return share
        }
      } catch {
        // noop
      }

      const pointsEarned = await this.getPointsConfig(platform)

      const { data, error } = await supabase
        .from('product_shares')
        .insert({
          user_id: userId,
          product_id: productId,
          vendor_id: vendorId,
          platform,
          share_url: shareUrl,
          points_earned: pointsEarned
        })
        .select()
        .single()

      if (error) throw error

      await this.addPointsToUser(userId, pointsEarned, 'share', data.id)

      return data
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du partage:', error)
      return null
    }
  }

  /**
   * Vérifie si l'utilisateur peut gagner des points sur un produit pour un réseau donné.
   */
  static async checkShareEligibility(
    productId: string,
    platform: string
  ): Promise<
    | {
        canEarnPoints: boolean
        points: number
        alreadyRewarded: boolean
        isOwnProduct: boolean
        reason: string
      }
    | null
  > {
    try {
      const pid = String(productId ?? '').trim()
      const p = String(platform ?? '').trim().toLowerCase()
      if (!pid || !p) return null

      const accessToken = await getClientAccessTokenSafe()
      const cacheKey = `${accessToken || 'anon'}:${pid}:${p}`
      const cached = this.eligibilityCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value
      }

      const headers: Record<string, string> = {}
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const res = await fetch(`/api/shares/eligibility?productId=${encodeURIComponent(pid)}&platform=${encodeURIComponent(p)}`, {
        method: 'GET',
        headers,
        cache: 'no-store'
      })

      const json = await res.json().catch(() => null)
      const data = json?.data
      if (!res.ok || !data) return null

      const value = {
        canEarnPoints: Boolean(data?.canEarnPoints),
        points: Math.max(0, Math.round(Number(data?.points) || 0)),
        alreadyRewarded: Boolean(data?.alreadyRewarded),
        isOwnProduct: Boolean(data?.isOwnProduct),
        reason: String(data?.reason ?? '')
      }

      this.eligibilityCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + 2 * 60 * 1000
      })

      return value
    } catch {
      return null
    }
  }

  /**
   * Précharge l'éligibilité pour réduire la latence (best effort).
   */
  static async prefetchShareEligibility(productId: string, platform: string): Promise<void> {
    try {
      await this.checkShareEligibility(productId, platform)
    } catch {
      // noop
    }
  }

  /**
   * Enregistre une interaction sur un partage
   */
  static async recordInteraction(
    shareId: string,
    interactionType: string,
    userId?: string,
    metadata?: any
  ): Promise<ShareInteraction | null> {
    try {
      const { data, error } = await supabase
        .from('share_interactions')
        .insert({
          share_id: shareId,
          interaction_type: interactionType,
          user_id: userId,
          ip_address: metadata?.ip,
          user_agent: metadata?.userAgent,
          referrer: metadata?.referrer
        })
        .select()
        .single()

      if (error) throw error

      // Si c'est une conversion, ajouter des points bonus
      if (interactionType === 'conversion' || interactionType === 'purchase') {
        const share = await this.getShareById(shareId)
        if (share) {
          await this.addPointsToUser(share.user_id, 20, 'conversion', shareId)
        }
      }

      return data
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'interaction:', error)
      return null
    }
  }

  /**
   * Récupère tous les partages d'un utilisateur
   */
  static async getUserShares(userId: string): Promise<ProductShare[]> {
    try {
      const { data, error } = await supabase
        .from('product_shares')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des partages:', error)
      return []
    }
  }

  /**
   * Récupère les partages d'un produit
   */
  static async getProductShares(productId: string): Promise<ProductShare[]> {
    try {
      const { data, error } = await supabase
        .from('product_shares')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des partages du produit:', error)
      return []
    }
  }

  /**
   * Récupère les partages d'un vendeur
   */
  static async getVendorShares(vendorId: string): Promise<ProductShare[]> {
    try {
      const { data, error } = await supabase
        .from('product_shares')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des partages du vendeur:', error)
      return []
    }
  }

  /**
   * Récupère les interactions d'un partage
   */
  static async getShareInteractions(shareId: string): Promise<ShareInteraction[]> {
    try {
      const { data, error } = await supabase
        .from('share_interactions')
        .select('*')
        .eq('share_id', shareId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des interactions:', error)
      return []
    }
  }

  /**
   * Récupère les analytics de partage pour un utilisateur
   */
  static async getUserShareAnalytics(userId: string): Promise<ShareAnalytics> {
    try {
      const shares = await this.getUserShares(userId)
      
      const sharesByPlatform: Record<string, number> = {}
      let totalPointsEarned = 0
      
      for (const share of shares) {
        sharesByPlatform[share.platform] = (sharesByPlatform[share.platform] || 0) + 1
        totalPointsEarned += share.points_earned
      }

      // Récupérer les interactions
      const { data: interactions } = await supabase
        .from('share_interactions')
        .select('*, product_shares!inner(user_id)')
        .eq('product_shares.user_id', userId)

      const interactionsByType: Record<string, number> = {}
      let totalInteractions = 0

      if (interactions) {
        for (const interaction of interactions) {
          interactionsByType[interaction.interaction_type] = 
            (interactionsByType[interaction.interaction_type] || 0) + 1
          totalInteractions++
        }
      }

      const conversionRate = shares.length > 0 
        ? ((interactionsByType.conversion || 0) / shares.length) * 100 
        : 0

      return {
        total_shares: shares.length,
        shares_by_platform: sharesByPlatform,
        total_interactions: totalInteractions,
        interactions_by_type: interactionsByType,
        total_points_earned: totalPointsEarned,
        conversion_rate: conversionRate,
        top_products: []
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics:', error)
      return {
        total_shares: 0,
        shares_by_platform: {},
        total_interactions: 0,
        interactions_by_type: {},
        total_points_earned: 0,
        conversion_rate: 0,
        top_products: []
      }
    }
  }

  /**
   * Récupère les analytics de partage pour un vendeur
   */
  static async getVendorShareAnalytics(vendorId: string): Promise<ShareAnalytics> {
    try {
      const shares = await this.getVendorShares(vendorId)
      
      const sharesByPlatform: Record<string, number> = {}
      let totalPointsEarned = 0
      
      for (const share of shares) {
        sharesByPlatform[share.platform] = (sharesByPlatform[share.platform] || 0) + 1
        totalPointsEarned += share.points_earned
      }

      const { data: interactions } = await supabase
        .from('share_interactions')
        .select('*, product_shares!inner(vendor_id)')
        .eq('product_shares.vendor_id', vendorId)

      const interactionsByType: Record<string, number> = {}
      let totalInteractions = 0

      if (interactions) {
        for (const interaction of interactions) {
          interactionsByType[interaction.interaction_type] = 
            (interactionsByType[interaction.interaction_type] || 0) + 1
          totalInteractions++
        }
      }

      const conversionRate = shares.length > 0 
        ? ((interactionsByType.conversion || 0) / shares.length) * 100 
        : 0

      return {
        total_shares: shares.length,
        shares_by_platform: sharesByPlatform,
        total_interactions: totalInteractions,
        interactions_by_type: interactionsByType,
        total_points_earned: totalPointsEarned,
        conversion_rate: conversionRate,
        top_products: []
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics vendeur:', error)
      return {
        total_shares: 0,
        shares_by_platform: {},
        total_interactions: 0,
        interactions_by_type: {},
        total_points_earned: 0,
        conversion_rate: 0,
        top_products: []
      }
    }
  }

  /**
   * S'abonne aux nouveaux partages (temps réel)
   */
  static subscribeToUserShares(
    userId: string,
    callback: (share: ProductShare) => void
  ) {
    const subscription = supabase
      .channel(`user_shares:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'product_shares',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as ProductShare)
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * S'abonne aux nouveaux partages d'un vendeur (temps réel)
   */
  static subscribeToVendorShares(
    vendorId: string,
    callback: (share: ProductShare) => void
  ) {
    const subscription = supabase
      .channel(`vendor_shares:${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'product_shares',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload) => {
          callback(payload.new as ProductShare)
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * S'abonne aux interactions (temps réel)
   */
  static subscribeToInteractions(
    shareId: string,
    callback: (interaction: ShareInteraction) => void
  ) {
    const subscription = supabase
      .channel(`share_interactions:${shareId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'share_interactions',
          filter: `share_id=eq.${shareId}`
        },
        (payload) => {
          callback(payload.new as ShareInteraction)
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * Se désabonne
   */
  static unsubscribe(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Récupère un partage par ID
   */
  private static async getShareById(shareId: string): Promise<ProductShare | null> {
    try {
      const { data, error } = await supabase
        .from('product_shares')
        .select('*')
        .eq('id', shareId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération du partage:', error)
      return null
    }
  }

  /**
   * Ajoute des points à un utilisateur
   */
  private static async addPointsToUser(
    userId: string,
    points: number,
    type: string,
    referenceId: string
  ): Promise<void> {
    try {
      let syncedToLoyaltyPoints = false

      // 1) Essayer d'alimenter le système principal (loyalty_points + point_transactions)
      try {
        let conversionRate = 1

        try {
          const { data: settingsRow } = await supabase
            .from('point_settings')
            .select('conversion_rate')
            .eq('scope', 'global')
            .maybeSingle()

          const numeric = Number(settingsRow?.conversion_rate ?? 1)
          if (Number.isFinite(numeric) && numeric > 0) {
            conversionRate = numeric
          }
        } catch {
          conversionRate = 1
        }

        const { error: upsertError } = await supabase
          .from('loyalty_points')
          .upsert({ user_id: userId }, { onConflict: 'user_id' })

        if (upsertError) {
          throw upsertError
        }

        const { data: loyaltyRow, error: loyaltyError } = await supabase
          .from('loyalty_points')
          .select('points_balance, points_earned, fcfa_value')
          .eq('user_id', userId)
          .maybeSingle()

        if (loyaltyError) {
          throw loyaltyError
        }

        const currentBalance = Number(loyaltyRow?.points_balance ?? 0)
        const currentEarned = Number(loyaltyRow?.points_earned ?? 0)
        const currentFcfaValue = Number(loyaltyRow?.fcfa_value ?? 0)

        const fcfaValue = Number((points * conversionRate).toFixed(2))
        const nextBalance = Math.max(0, currentBalance + points)
        const nextEarned = Math.max(0, currentEarned + points)
        const nextFcfaValue = Math.max(0, Number((currentFcfaValue + fcfaValue).toFixed(2)))

        const { error: updateError } = await supabase
          .from('loyalty_points')
          .update({
            points_balance: nextBalance,
            points_earned: nextEarned,
            fcfa_value: nextFcfaValue
          })
          .eq('user_id', userId)

        if (updateError) {
          throw updateError
        }

        const { error: txError } = await supabase
          .from('point_transactions')
          .insert({
            user_id: userId,
            type,
            points,
            fcfa_value: fcfaValue,
            description: `Points gagnés pour ${type}`,
            reference_id: referenceId
          })

        if (txError) {
          throw txError
        }

        syncedToLoyaltyPoints = true
      } catch (error) {
        console.warn('Impossible de synchroniser loyalty_points/point_transactions pour un partage:', error)
      }

      // 2) Fallback historique (anciens dashboards / anciens schémas)
      if (syncedToLoyaltyPoints) {
        return
      }

      await supabase
        .from('user_points_transactions')
        .insert({
          user_id: userId,
          points,
          type,
          reference_id: referenceId,
          description: `Points gagnés pour ${type}`
        })

      // Mettre à jour le solde de points
      const { data: user } = await supabase
        .from('users')
        .select('points_balance')
        .eq('id', userId)
        .single()

      if (user) {
        await supabase
          .from('users')
          .update({ points_balance: (user.points_balance || 0) + points })
          .eq('id', userId)
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de points:', error)
    }
  }

  /**
   * Récupère le classement des partageurs
   */
  static async getShareLeaderboard(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('product_shares')
        .select('user_id, users(id, email, user_profiles(first_name, last_name))')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Agréger par utilisateur
      const userShares: Record<string, any> = {}
      
      if (data) {
        for (const share of data) {
          if (!userShares[share.user_id]) {
            userShares[share.user_id] = {
              user_id: share.user_id,
              shares: 0,
              user: share.users
            }
          }
          userShares[share.user_id].shares++
        }
      }

      return Object.values(userShares)
        .sort((a, b) => b.shares - a.shares)
        .slice(0, limit)
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error)
      return []
    }
  }
}
