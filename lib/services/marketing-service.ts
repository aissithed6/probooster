/**
 * Service pour gérer le Marketing et les Promotions
 * Synchronisé avec Supabase
 */

import { supabase, getSupabaseAdmin } from '@/lib/supabase'

export interface BoostingService {
  id: string
  name: string
  description: string | null
  type: 'recommendation' | 'banner' | 'whatsapp'
  base_price: number
  pricing_model: 'per_page_day' | 'per_message_country' | 'fixed'
  features: string[]
  is_active: boolean
  pending_deactivation: boolean
  pending_deactivation_at: string | null
  pending_deactivation_reason: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Construit un header Authorization (Bearer) pour les appels vers les routes API Next.js.
 */
/**
 * Essaie d'extraire un access token d'une valeur stockée (souvent JSON) par Supabase dans le stockage local.
 */
function tryExtractAccessTokenFromStoredAuth(rawValue: string): string | undefined {
  const attempts = [rawValue]
  try {
    const decoded = decodeURIComponent(rawValue)
    if (decoded !== rawValue) attempts.push(decoded)
  } catch {
    // ignore
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)
      const token: unknown = Array.isArray(parsed)
        ? parsed[0]
        : (parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token)

      if (typeof token === 'string' && token.length > 0) return token
    } catch {
      // ignore
    }
  }

  return undefined
}

/**
 * Lit un access token Supabase depuis le localStorage quand supabase.auth.getSession() ne remonte rien.
 */
function readSupabaseAccessTokenFromLocalStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const storage = window.localStorage
    if (!storage) return undefined

    // Supabase-js utilise généralement une clé `sb-<projectRef>-auth-token`.
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key) continue
      if (!/^sb-.*-auth-token$/.test(key)) continue
      const raw = storage.getItem(key)
      if (!raw) continue
      const token = tryExtractAccessTokenFromStoredAuth(raw)
      if (token) return token
    }
  } catch {
    return undefined
  }
  return undefined
}

async function buildSupabaseAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {}
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token ?? readSupabaseAccessTokenFromLocalStorage()
    return accessToken ? { authorization: `Bearer ${accessToken}` } : {}
  } catch {
    const token = readSupabaseAccessTokenFromLocalStorage()
    return token ? { authorization: `Bearer ${token}` } : {}
  }
}

/**
 * Vérifie si une valeur est un objet (Record) exploitable.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Convertit une valeur unknown en string (ou undefined).
 */
function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * Convertit une valeur unknown en number (ou undefined).
 */
function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const BOOSTING_PRICING_CACHE_KEY = 'boosting-pricing-config-cache'
const BOOSTING_PRICING_BROADCAST_KEY = 'boosting-pricing-config-broadcast'

/**
 * Normalise une configuration partielle pour garantir que toutes les clés attendues existent.
 */
function normalizeBoostingPricingConfig(value: unknown): BoostingPricingConfig {
  const parsedValue = (() => {
    if (typeof value === 'string') {
      try {
        const decoded = JSON.parse(value)
        if (decoded && typeof decoded === 'object') {
          return decoded as Partial<BoostingPricingConfig>
        }
      } catch {
        // ignore JSON parse errors
      }
      return {}
    }

    if (value && typeof value === 'object') {
      return value as Partial<BoostingPricingConfig>
    }

    return {}
  })()

  const parsed = parsedValue

  return {
    recommendation: {
      homePage: parsed.recommendation?.homePage ?? DEFAULT_BOOSTING_PRICING_CONFIG.recommendation.homePage,
      productPage: parsed.recommendation?.productPage ?? DEFAULT_BOOSTING_PRICING_CONFIG.recommendation.productPage,
      bestSellers: parsed.recommendation?.bestSellers ?? DEFAULT_BOOSTING_PRICING_CONFIG.recommendation.bestSellers,
      newArrivals: parsed.recommendation?.newArrivals ?? DEFAULT_BOOSTING_PRICING_CONFIG.recommendation.newArrivals,
      vendorPage: parsed.recommendation?.vendorPage ?? DEFAULT_BOOSTING_PRICING_CONFIG.recommendation.vendorPage,
      multiPageDiscount: parsed.recommendation?.multiPageDiscount ?? DEFAULT_BOOSTING_PRICING_CONFIG.recommendation.multiPageDiscount
    },
    banner: {
      multiplier: parsed.banner?.multiplier ?? DEFAULT_BOOSTING_PRICING_CONFIG.banner.multiplier,
      animationFee: parsed.banner?.animationFee ?? DEFAULT_BOOSTING_PRICING_CONFIG.banner.animationFee
    },
    whatsapp: {
      baseCost: parsed.whatsapp?.baseCost ?? DEFAULT_BOOSTING_PRICING_CONFIG.whatsapp.baseCost,
      countryCost: parsed.whatsapp?.countryCost ?? DEFAULT_BOOSTING_PRICING_CONFIG.whatsapp.countryCost,
      ageCost: parsed.whatsapp?.ageCost ?? DEFAULT_BOOSTING_PRICING_CONFIG.whatsapp.ageCost,
      professionCost: parsed.whatsapp?.professionCost ?? DEFAULT_BOOSTING_PRICING_CONFIG.whatsapp.professionCost,
      proboosterCost: parsed.whatsapp?.proboosterCost ?? DEFAULT_BOOSTING_PRICING_CONFIG.whatsapp.proboosterCost
    },
    autoReload: parsed.autoReload ?? DEFAULT_BOOSTING_PRICING_CONFIG.autoReload,
    notifications: parsed.notifications ?? DEFAULT_BOOSTING_PRICING_CONFIG.notifications
  }
}

/**
 * Lit la configuration en cache depuis le localStorage (si disponible).
 */
function readBoostingPricingCache(): BoostingPricingConfig | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(BOOSTING_PRICING_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const candidate = parsed?.config ?? parsed
    return normalizeBoostingPricingConfig(candidate)
  } catch {
    return null
  }
}

/**
 * Écrit la configuration dans le cache localStorage et notifie le reste de l'application.
 * Si broadcast=true, propage aussi l'information aux autres onglets via l'événement storage.
 */
function writeBoostingPricingCache(config: BoostingPricingConfig, broadcast: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      BOOSTING_PRICING_CACHE_KEY,
      JSON.stringify({ config, updatedAt: new Date().toISOString() })
    )
    if (broadcast) {
      window.localStorage.setItem(BOOSTING_PRICING_BROADCAST_KEY, String(Date.now()))
    }
    window.dispatchEvent(new CustomEvent('boosting-pricing-config-updated', { detail: { config } }))
  } catch {
    // ignore cache write errors
  }
}

/**
 * Gestionnaire de la configuration globale des tarifs Boostage Pro.
 */
export class BoostingPricingManager {
  /**
   * Récupère la configuration des tarifs Boostage Pro depuis une source serveur stable.
   */
  static async getConfig(): Promise<BoostingPricingConfig> {
    const cached = readBoostingPricingCache()

    try {
      if (typeof window === 'undefined') {
        const supabaseAdmin = getSupabaseAdmin()
        const { data, error } = await supabaseAdmin
          .from('boosting_pricing_config')
          .select('config_json')
          .order('updated_at', { ascending: false })
          .limit(1)

        if (error) {
          return cached ?? JSON.parse(JSON.stringify(DEFAULT_BOOSTING_PRICING_CONFIG))
        }

        const rowsRaw: unknown = data ?? []
        const firstRow = Array.isArray(rowsRaw) ? rowsRaw[0] : undefined
        const configJson = isRecord(firstRow) ? firstRow.config_json : undefined
        const normalized = normalizeBoostingPricingConfig(configJson)
        return JSON.parse(JSON.stringify(normalized))
      }

      const response = await fetch('/api/public/boosting-pricing-config', {
        method: 'GET',
        headers: {
          accept: 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        return cached ?? JSON.parse(JSON.stringify(DEFAULT_BOOSTING_PRICING_CONFIG))
      }

      const isFallback = response.headers.get('x-boosting-pricing-fallback') === '1'
      if (isFallback && cached) {
        return JSON.parse(JSON.stringify(cached))
      }

      const payload: unknown = await response.json().catch(() => undefined as unknown)
      const normalized = normalizeBoostingPricingConfig(payload)

      if (!isFallback) {
        writeBoostingPricingCache(normalized, false)
      }
      return JSON.parse(JSON.stringify(normalized))
    } catch (error) {
      console.warn('Erreur inattendue lors de la récupération de la configuration boostage, valeurs par défaut utilisées.', error)
      return cached ?? JSON.parse(JSON.stringify(DEFAULT_BOOSTING_PRICING_CONFIG))
    }
  }

  /**
   * Sauvegarde la configuration des tarifs Boostage Pro via l'API super-admin.
   */
  static async saveConfig(config: BoostingPricingConfig, userId: string): Promise<boolean> {
    try {
      const normalized = normalizeBoostingPricingConfig(config)

      if (typeof window === 'undefined') {
        const supabaseAdmin = getSupabaseAdmin()
        const configuration = {
          id: '00000000-0000-0000-0000-000000000000',
          config_json: normalized,
          updated_by: userId,
          updated_at: new Date().toISOString()
        }

        const { error } = await supabaseAdmin
          .from('boosting_pricing_config')
          .upsert(configuration, { onConflict: 'id' })
        if (error) throw error
        return true
      }

      /**
       * Ajoute un token Bearer pour que l'API super-admin puisse authentifier l'appel.
       * Sur certains setups Supabase (SPA), la session n'est pas forcément disponible en cookie.
       */
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      const response = await fetch('/api/super-admin/boosting-pricing-config', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ config: normalized }),
        credentials: 'include'
      })

      if (!response.ok) {
        return false
      }

      writeBoostingPricingCache(normalized, true)
      return true
    } catch (error) {
      console.error('Erreur sauvegarde configuration boostage:', error)
      return false
    }
  }
}

export interface BoostingCampaign {
  id: string
  vendor_id: string
  product_id: string | null
  service_id: string
  type: 'recommendation' | 'banner' | 'whatsapp'
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected'
  start_date: string | null
  end_date: string | null
  target_pages: string[]
  duration: number | null
  total_cost: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_id: string | null
  payment_method: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  is_finalized?: boolean

  // Flags d'approbation (dual-approval)
  super_admin_approved?: boolean
  admin_approved?: boolean
  approved_by_super_admin?: string | null
  approved_by_admin?: string | null
  approved_at?: string | null

  vendorName?: string
  vendorEmail?: string
  productName?: string
  performance?: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    conversionRate: number
  }
}

// ============================================
// CAMPAGNES BOOSTING
// ============================================

export class BoostingCampaignManager {
  /**
   * Récupère toutes les campagnes (admin)
   */
  static async getAllCampaigns(): Promise<BoostingCampaign[]> {
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('boosting_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (campaignsError) throw campaignsError

      const campaignsRaw: unknown = campaignsData || []
      const campaigns: BoostingCampaign[] = Array.isArray(campaignsRaw)
        ? (campaignsRaw as BoostingCampaign[])
        : []

      const vendorIds = Array.from(new Set(campaigns.map((campaign) => campaign.vendor_id).filter(Boolean)))
      const productIds = Array.from(new Set(campaigns.map((campaign) => campaign.product_id).filter(Boolean)))

      let vendorMap: Record<string, { name?: string; email?: string }> = {}
      if (vendorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', vendorIds as string[])

        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', vendorIds as string[])

        const profilesRaw: unknown = profilesData || []
        const profileMap = (Array.isArray(profilesRaw) ? profilesRaw : []).reduce<
          Record<string, { first_name?: string; last_name?: string }>
        >((acc, profileUnknown) => {
          if (!isRecord(profileUnknown)) return acc
          const userId = toOptionalString(profileUnknown.user_id)
          if (!userId) return acc
          acc[userId] = {
            first_name: toOptionalString(profileUnknown.first_name) ?? undefined,
            last_name: toOptionalString(profileUnknown.last_name) ?? undefined
          }
          return acc
        }, {})

        const usersRaw: unknown = usersData || []
        vendorMap = (Array.isArray(usersRaw) ? usersRaw : []).reduce<Record<string, { name?: string; email?: string }>>(
          (acc, userUnknown) => {
            if (!isRecord(userUnknown)) return acc
            const userId = toOptionalString(userUnknown.id)
            const email = toOptionalString(userUnknown.email)
            if (!userId) return acc

            const profile = profileMap[userId]
            const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''
            acc[userId] = {
              name: fullName || email,
              email
            }
            return acc
          },
          {}
        )
      }

      let productMap: Record<string, string> = {}
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds as string[])

        const productsRaw: unknown = productsData || []
        productMap = (Array.isArray(productsRaw) ? productsRaw : []).reduce<Record<string, string>>(
          (acc, productUnknown) => {
            if (!isRecord(productUnknown)) return acc
            const productId = toOptionalString(productUnknown.id)
            const name = toOptionalString(productUnknown.name)
            if (!productId || !name) return acc
            acc[productId] = name
            return acc
          },
          {}
        )
      }

      return campaigns.map((campaign) => ({
        ...campaign,
        vendorName: campaign.vendor_id ? vendorMap[campaign.vendor_id]?.name : undefined,
        vendorEmail: campaign.vendor_id ? vendorMap[campaign.vendor_id]?.email : undefined,
        productName: campaign.product_id ? productMap[campaign.product_id] : undefined
      }))
    } catch (error) {
      console.error('Erreur récupération campagnes:', error)
      return []
    }
  }

  /**
   * Crée une nouvelle campagne (vendeur)
   */
  static async createCampaign(
    campaign: Omit<BoostingCampaign, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BoostingCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('boosting_campaigns')
        .insert(campaign)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création campagne:', error)
      return null
    }
  }

  static async updateCampaign(
    id: string,
    updates: Partial<BoostingCampaign>
  ): Promise<BoostingCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('boosting_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur mise à jour campagne:', error)
      return null
    }
  }

  /**
   * Met à jour uniquement le contenu éditable d'une campagne depuis le client.
   * Passe par l'API interne (PUT /api/marketing/campaigns/[id]) pour appliquer les règles métier.
   */
  static async updateCampaignContent(
    id: string,
    updates: { name?: string; target_pages?: string[]; duration?: number }
  ): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false
      }

      const authHeaders = await buildSupabaseAuthHeaders()
      const payload: Record<string, unknown> = {}

      if (typeof updates.name === 'string') payload.name = updates.name
      if (Array.isArray(updates.target_pages)) payload.target_pages = updates.target_pages
      if (typeof updates.duration === 'number' && Number.isFinite(updates.duration)) payload.duration = updates.duration

      if (Object.keys(payload).length === 0) {
        return true
      }

      const resp = await fetch(`/api/marketing/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload)
      })

      return resp.ok
    } catch (error) {
      console.error('Erreur updateCampaignContent:', error)
      return false
    }
  }

  /**
   * Approuve une campagne côté Super Admin/Admin via l'API interne.
   * Utilise PUT /api/marketing/campaigns/[id] pour mettre à jour les flags d'approbation.
   */
  static async approveCampaign(id: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await buildSupabaseAuthHeaders()
        const payload = {
          // Par défaut on considère une approbation Super Admin depuis ce contexte UI
          super_admin_approved: true,
          admin_approved: true,
          approved_by_super_admin: null,
          approved_by_admin: null
        }
        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        })
        if (!resp.ok) return false
        return true
      }

      // Fallback serveur: met à jour les flags (sans activer si approbation unique)
      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({
          super_admin_approved: true,
          admin_approved: true,
          approved_by_super_admin: null,
          approved_by_admin: null,
          updated_at: nowIso
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur approbation campagne:', error)
      return false
    }
  }

  /**
   * Approuve une campagne en tant que Super Admin (flag super_admin_approved=true).
   */
  static async approveAsSuperAdmin(id: string, approvedByUserId?: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await buildSupabaseAuthHeaders()
        const payload: Record<string, unknown> = {
          super_admin_approved: true,
          admin_approved: true
        }
        if (approvedByUserId) {
          payload.approved_by_super_admin = approvedByUserId
          payload.approved_by_admin = approvedByUserId
        }

        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        })
        return resp.ok
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({
          super_admin_approved: true,
          admin_approved: true,
          approved_by_super_admin: approvedByUserId ?? null,
          approved_by_admin: approvedByUserId ?? null,
          updated_at: nowIso
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur approveAsSuperAdmin:', error)
      return false
    }
  }

  /**
   * Approuve une campagne en tant que Admin (flag admin_approved=true).
   */
  static async approveAsAdmin(id: string, approvedByUserId?: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await buildSupabaseAuthHeaders()
        const payload: Record<string, unknown> = { admin_approved: true }
        if (approvedByUserId) payload.approved_by_admin = approvedByUserId

        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        })
        return resp.ok
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({
          admin_approved: true,
          approved_by_admin: approvedByUserId ?? null,
          updated_at: nowIso
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur approveAsAdmin:', error)
      return false
    }
  }

  /**
   * Rejette une campagne via l'API interne.
   * Utilise PUT /api/marketing/campaigns/[id] avec status='rejected' et une raison.
   */
  static async rejectCampaign(id: string, reason: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await buildSupabaseAuthHeaders()
        const payload = {
          status: 'rejected',
          rejection_reason: reason
        }
        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        })
        if (!resp.ok) return false
        return true
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: nowIso
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur rejet campagne:', error)
      return false
    }
  }

  /**
   * Désapprouve une campagne en tant que Super Admin.
   * Réinitialise les flags d'approbation et repasse la campagne en attente.
   */
  static async disapproveAsSuperAdmin(id: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await buildSupabaseAuthHeaders()
        const payload: Record<string, unknown> = {
          status: 'pending',
          super_admin_approved: false,
          admin_approved: false,
          approved_by_super_admin: null,
          approved_by_admin: null,
          approved_at: null,
          start_date: null,
          end_date: null,
          rejection_reason: null
        }

        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        })
        return resp.ok
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({
          status: 'pending',
          super_admin_approved: false,
          admin_approved: false,
          approved_by_super_admin: null,
          approved_by_admin: null,
          approved_at: null,
          start_date: null,
          end_date: null,
          rejection_reason: null,
          updated_at: nowIso
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur disapproveAsSuperAdmin:', error)
      return false
    }
  }

  /**
   * Désapprouve une campagne en tant que Admin (retire uniquement l'approbation admin).
   */
  static async disapproveAsAdmin(id: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await buildSupabaseAuthHeaders()
        const payload: Record<string, unknown> = {
          status: 'pending',
          admin_approved: false,
          approved_by_admin: null,
          approved_at: null,
          start_date: null,
          end_date: null
        }

        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(payload)
        })
        return resp.ok
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({
          status: 'pending',
          admin_approved: false,
          approved_by_admin: null,
          approved_at: null,
          start_date: null,
          end_date: null,
          updated_at: nowIso
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur disapproveAsAdmin:', error)
      return false
    }
  }

  /**
   * Supprime une campagne via l'API interne (respecte les contrôles d'accès).
   */
  static async deleteCampaign(id: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await buildSupabaseAuthHeaders()
        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'DELETE',
          headers: { ...authHeaders }
        })
        return resp.ok
      }

      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur deleteCampaign:', error)
      return false
    }
  }

  /**
   * Met en pause une campagne
   */
  static async pauseCampaign(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('boosting_campaigns')
        .update({ status: 'paused' })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur pause campagne:', error)
      return false
    }
  }

  /**
   * Reprend une campagne
   */
  static async resumeCampaign(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('boosting_campaigns')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur reprise campagne:', error)
      return false
    }
  }

  /**
   * Met à jour le statut d'une campagne via l'API (service role) pour garantir la cohérence métier.
   */
  static async setCampaignStatus(
    id: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await buildSupabaseAuthHeaders()
        const payload: Record<string, unknown> = { status }
        if (status === 'completed') {
          payload.end_date = new Date().toISOString()
        }

        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify(payload)
        })

        if (!resp.ok) {
          const body = await resp.text().catch(() => '')
          console.error('Erreur setCampaignStatus (client):', resp.status, body)
          return false
        }

        return true
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const patch: Record<string, unknown> = { status, updated_at: nowIso }
      if (status === 'completed') {
        patch.end_date = nowIso
      }

      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update(patch)
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur setCampaignStatus:', error)
      return false
    }
  }

  /**
   * Compte les campagnes actives ou en attente pour un service.
   */
  static async countOngoingCampaigns(serviceId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('boosting_campaigns')
        .select('*', { head: true, count: 'exact' })
        .eq('service_id', serviceId)
        .in('status', ['pending', 'active'])

      if (error) throw error
      return count ?? 0
    } catch (error) {
      console.error('Erreur comptage campagnes en cours:', error)
      return 0
    }
  }
}

export interface BoostingPerformance {
  id: string
  campaign_id: string
  date: string
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  conversion_rate: number
  revenue: number
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  name: string
  code: string | null
  description: string | null
  type: 'coupon' | 'discount' | 'flash_sale' | 'bundle'
  status: 'draft' | 'active' | 'paused' | 'ended'
  start_date: string
  end_date: string
  discount_type: 'percentage' | 'fixed' | 'free_shipping'
  discount_value: number
  min_order_amount: number | null
  max_discount: number | null
  usage_limit: number | null
  usage_limit_per_user: number
  used_count: number
  vendor_id: string | null
  target_audience: string[]
  applicable_products: string[]
  applicable_categories: string[]
  applicable_vendors: string[]
  is_auto_apply: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  vendorName?: string
  vendorEmail?: string
}

export interface PromotionUsage {
  id: string
  promotion_id: string
  user_id: string
  order_id: string | null
  product_id: string | null
  discount_amount: number
  original_amount: number
  final_amount: number
  used_at: string
}

export interface SpecialPromotion {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  start_date?: string | null
  end_date: string
  discount_type?: 'percentage' | 'fixed' | 'free_shipping' | null
  discount_value?: number | null
  gradient_from: string
  gradient_to: string
  text_color: string
  is_active: boolean
  sort_order: number
  applicable_products?: string[] | null
  applicable_categories?: string[] | null
  applicable_vendors?: string[] | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface VendorSummary {
  id: string
  email: string
  display_name: string
  first_name?: string
  last_name?: string
}

export interface ProductSummary {
  id: string
  name: string
  price: number
  vendor_id: string
}

export interface BoostingPricingConfig {
  recommendation: {
    homePage: number
    productPage: number
    bestSellers: number
    newArrivals: number
    vendorPage: number
    multiPageDiscount: number
  }
  banner: {
    multiplier: number
    animationFee: number
  }
  whatsapp: {
    baseCost: number
    countryCost: number
    ageCost: number
    professionCost: number
    proboosterCost: number
  }
  autoReload: boolean
  notifications: boolean
}

const DEFAULT_BOOSTING_PRICING_CONFIG_INTERNAL: BoostingPricingConfig = {
  recommendation: {
    homePage: 5000,
    productPage: 4000,
    bestSellers: 3500,
    newArrivals: 3000,
    vendorPage: 2500,
    multiPageDiscount: 15
  },
  banner: {
    multiplier: 0.8,
    animationFee: 500
  },
  whatsapp: {
    baseCost: 25,
    countryCost: 100,
    ageCost: 50,
    professionCost: 75,
    proboosterCost: 10
  },
  autoReload: false,
  notifications: true
}

export const DEFAULT_BOOSTING_PRICING_CONFIG: BoostingPricingConfig = JSON.parse(JSON.stringify(DEFAULT_BOOSTING_PRICING_CONFIG_INTERNAL))

export interface PerformanceAggregate {
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  conversionRate: number
}

export interface PerformanceSummary {
  totals: PerformanceAggregate
  perCampaign: Record<string, PerformanceAggregate>
}

// ============================================
// PROMOTIONS SPÉCIALES (special_promotions)
// ============================================

export class SpecialPromotionsManager {
  /**
   * Récupère l'en-tête Authorization Supabase (côté client) afin d'appeler des routes protégées.
   */
  private static async buildAuthHeaders(): Promise<Record<string, string>> {
    return buildSupabaseAuthHeaders()
  }

  /**
   * Appelle l'API super-admin pour lister les promotions spéciales (évite les soucis RLS côté client).
   */
  static async getAllSpecialPromotions(): Promise<SpecialPromotion[]> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await this.buildAuthHeaders()
        const resp = await fetch('/api/super-admin/special-promotions', {
          method: 'GET',
          headers: {
            ...authHeaders
          },
          cache: 'no-store'
        }).catch(() => null)

        if (!resp || !resp.ok) {
          const body = await resp?.text().catch(() => '')
          console.error('Erreur récupération promotions spéciales (API):', resp?.status, body)
          return []
        }

        const json = await resp.json().catch(() => ({}))
        const raw: unknown = (json as any)?.data ?? []
        return Array.isArray(raw) ? (raw as unknown as SpecialPromotion[]) : []
      }

      const { data, error } = await getSupabaseAdmin()
        .from('special_promotions')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('end_date', { ascending: true })

      if (error) throw error
      return Array.isArray(data) ? (data as unknown as SpecialPromotion[]) : []
    } catch (error) {
      console.error('Erreur récupération promotions spéciales:', error)
      return []
    }
  }

  /**
   * Crée une promotion spéciale.
   * - Côté client: via l'API super-admin (Bearer token)
   * - Côté serveur: insertion directe via service role.
   */
  static async createSpecialPromotion(payload: Omit<SpecialPromotion, 'id' | 'created_at' | 'updated_at'>): Promise<SpecialPromotion | null> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await this.buildAuthHeaders()
        const resp = await fetch('/api/super-admin/special-promotions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify(payload)
        }).catch(() => null)

        if (!resp || !resp.ok) {
          const body = await resp?.text().catch(() => '')
          console.error('Erreur création promotion spéciale (API):', resp?.status, body)
          return null
        }

        const json = await resp.json().catch(() => ({}))
        const data: unknown = (json as any)?.data ?? null
        return (data as SpecialPromotion) ?? null
      }

      const insertPayload: Record<string, unknown> = payload as unknown as Record<string, unknown>
      const { data, error } = await getSupabaseAdmin()
        .from('special_promotions')
        .insert(insertPayload)
        .select('*')
        .single()

      if (error) throw error
      return (data as unknown as SpecialPromotion) ?? null
    } catch (error) {
      console.error('Erreur création promotion spéciale:', error)
      return null
    }
  }

  /**
   * Met à jour une promotion spéciale.
   * - Côté client: via l'API super-admin (Bearer token)
   * - Côté serveur: update service role.
   */
  static async updateSpecialPromotion(id: string, updates: Partial<SpecialPromotion>): Promise<SpecialPromotion | null> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await this.buildAuthHeaders()
        const resp = await fetch(`/api/super-admin/special-promotions/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify(updates ?? {})
        }).catch(() => null)

        if (!resp || !resp.ok) {
          const body = await resp?.text().catch(() => '')
          console.error('Erreur mise à jour promotion spéciale (API):', resp?.status, body)
          return null
        }

        const json = await resp.json().catch(() => ({}))
        const data: unknown = (json as any)?.data ?? null
        return (data as SpecialPromotion) ?? null
      }

      const updatePayload: Record<string, unknown> = updates as unknown as Record<string, unknown>
      const { data, error } = await getSupabaseAdmin()
        .from('special_promotions')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return (data as unknown as SpecialPromotion) ?? null
    } catch (error) {
      console.error('Erreur mise à jour promotion spéciale:', error)
      return null
    }
  }

  /**
   * Supprime une promotion spéciale.
   * - Côté client: via l'API super-admin (Bearer token)
   * - Côté serveur: delete service role.
   */
  static async deleteSpecialPromotion(id: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const authHeaders = await this.buildAuthHeaders()
        const resp = await fetch(`/api/super-admin/special-promotions/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            ...authHeaders
          }
        }).catch(() => null)

        if (!resp || !resp.ok) {
          const body = await resp?.text().catch(() => '')
          console.error('Erreur suppression promotion spéciale (API):', resp?.status, body)
          return false
        }

        return true
      }

      const { error } = await getSupabaseAdmin()
        .from('special_promotions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur suppression promotion spéciale:', error)
      return false
    }
  }
}

// ============================================
// VENDEURS
// ============================================

export class VendorManager {
  static async getAllVendors(): Promise<VendorSummary[]> {
    try {
      const { data: vendorUsers, error: vendorError } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'vendor')

      if (vendorError) throw vendorError

      const usersRaw: unknown = vendorUsers ?? []
      const users = Array.isArray(usersRaw) ? usersRaw : []
      if (!users.length) return []

      const vendorIds = users
        .map((userUnknown) => (isRecord(userUnknown) ? toOptionalString(userUnknown.id) : undefined))
        .filter((id): id is string => Boolean(id))

      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', vendorIds)

      const profilesRaw: unknown = profilesData ?? []
      const profileMap = (Array.isArray(profilesRaw) ? profilesRaw : []).reduce<
        Record<string, { first_name?: string; last_name?: string }>
      >((acc, profileUnknown) => {
        if (!isRecord(profileUnknown)) return acc
        const userId = toOptionalString(profileUnknown.user_id)
        if (!userId) return acc
        acc[userId] = {
          first_name: toOptionalString(profileUnknown.first_name) ?? undefined,
          last_name: toOptionalString(profileUnknown.last_name) ?? undefined
        }
        return acc
      }, {})

      return users.reduce<VendorSummary[]>((acc, userUnknown) => {
        if (!isRecord(userUnknown)) return acc
        const id = toOptionalString(userUnknown.id)
        const email = toOptionalString(userUnknown.email)
        if (!id || !email) return acc

        const profile = profileMap[id]
        const displayName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || email
          : email

        acc.push({
          id,
          email,
          display_name: displayName,
          first_name: profile?.first_name,
          last_name: profile?.last_name
        })
        return acc
      }, [])
    } catch (error) {
      console.error('Erreur récupération vendeurs:', error)
      return []
    }
  }
}

export class ProductManager {
  static async getProductsByVendor(vendorId: string): Promise<ProductSummary[]> {
    if (!vendorId) return []

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, vendor_id')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      if (error) throw error
      const raw: unknown = data ?? []
      return Array.isArray(raw) ? (raw as unknown as ProductSummary[]) : []
    } catch (error) {
      console.error('Erreur récupération produits vendeur:', error)
      return []
    }
  }
}

// ============================================
// SERVICE BOOSTING
// ============================================

export class BoostingServiceManager {
  /**
   * Récupère tous les services actifs
   */
  static async getActiveServices(): Promise<BoostingService[]> {
    try {
      const { data, error } = await supabase
        .from('boosting_services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération services:', error)
      return []
    }
  }

  /**
   * Récupère tous les services (admin)
   */
  static async getAllServices(): Promise<BoostingService[]> {
    try {
      const { data, error } = await supabase
        .from('boosting_services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération services:', error)
      return []
    }
  }

  /**
   * Crée un nouveau service (admin)
   */
  static async createService(
    service: Omit<BoostingService, 'id' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<BoostingService | null> {
    try {
      const { data, error } = await supabase
        .from('boosting_services')
        .insert({
          ...service,
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création service:', error)
      return null
    }
  }

  /**
   * Met à jour un service côté client (fetch) ou côté serveur (Supabase).
   */
  static async updateService(
    serviceId: string,
    updates: Partial<BoostingService>
  ): Promise<BoostingService | null> {
    try {
      const payload: Partial<BoostingService> = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      if (typeof window !== 'undefined') {
        const response = await fetch(`/api/boosting-services/${serviceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          console.error('Erreur mise à jour service (client):', await response.text())
          return null
        }

        const json = await response.json()
        const data = json?.data as BoostingService | undefined
        return data ?? null
      }

      const supabaseAdmin = getSupabaseAdmin()

      const { data, error } = await supabaseAdmin
        .from('boosting_services')
        .update(payload)
        .eq('id', serviceId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur mise à jour service:', error)
      return null
    }
  }

  /**
   * Planifie la désactivation d'un service tant que des campagnes sont encore actives.
   */
  static async scheduleDeactivation(
    serviceId: string,
    reason: string | null = null,
    userId?: string
  ): Promise<BoostingService | null> {
    const updates: Partial<BoostingService> & { updated_by?: string } = {
      pending_deactivation: true,
      pending_deactivation_at: new Date().toISOString(),
      pending_deactivation_reason: reason ?? null
    }

    if (userId) {
      updates.updated_by = userId
    }

    return this.updateService(serviceId, updates)
  }

  /**
   * Annule une désactivation planifiée.
   */
  static async cancelScheduledDeactivation(
    serviceId: string,
    userId?: string
  ): Promise<BoostingService | null> {
    const updates: Partial<BoostingService> & { updated_by?: string } = {
      pending_deactivation: false,
      pending_deactivation_at: null,
      pending_deactivation_reason: null
    }

    if (userId) {
      updates.updated_by = userId
    }

    return this.updateService(serviceId, updates)
  }

  /**
   * Finalise la désactivation si aucune campagne n'est encore en cours.
   */
  static async ensureDeactivationConsistency(serviceId: string): Promise<BoostingService | null> {
    const ongoing = await BoostingCampaignManager.countOngoingCampaigns(serviceId)

    if (ongoing > 0) {
      return null
    }

    return this.updateService(serviceId, {
      is_active: false,
      pending_deactivation: false,
      pending_deactivation_at: null,
      pending_deactivation_reason: null
    })
  }

  /**
   * Récupère toutes les campagnes (admin)
   */
  static async getAllCampaigns(): Promise<BoostingCampaign[]> {
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('boosting_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (campaignsError) throw campaignsError

      const campaignsRaw: unknown = campaignsData ?? []
      const campaigns: BoostingCampaign[] = Array.isArray(campaignsRaw)
        ? (campaignsRaw as unknown as BoostingCampaign[])
        : []

      const vendorIds = Array.from(new Set(campaigns.map((campaign) => campaign.vendor_id).filter(Boolean)))
      const productIds = Array.from(new Set(campaigns.map((campaign) => campaign.product_id).filter(Boolean)))

      let vendorMap: Record<string, { name?: string; email?: string }> = {}
      if (vendorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', vendorIds as string[])

        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', vendorIds as string[])

        const profilesRaw: unknown = profilesData ?? []
        const profileMap = (Array.isArray(profilesRaw) ? profilesRaw : []).reduce<
          Record<string, { first_name?: string; last_name?: string }>
        >((acc, profileUnknown) => {
          if (!isRecord(profileUnknown)) return acc
          const userId = toOptionalString(profileUnknown.user_id)
          if (!userId) return acc
          acc[userId] = {
            first_name: toOptionalString(profileUnknown.first_name) ?? undefined,
            last_name: toOptionalString(profileUnknown.last_name) ?? undefined
          }
          return acc
        }, {})

        const usersRaw: unknown = usersData ?? []
        vendorMap = (Array.isArray(usersRaw) ? usersRaw : []).reduce<Record<string, { name?: string; email?: string }>>(
          (acc, userUnknown) => {
            if (!isRecord(userUnknown)) return acc
            const userId = toOptionalString(userUnknown.id)
            const email = toOptionalString(userUnknown.email)
            if (!userId) return acc

            const profile = profileMap[userId]
            const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''
            acc[userId] = {
              name: fullName || email,
              email
            }
            return acc
          },
          {}
        )
      }

      let productMap: Record<string, string> = {}
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds as string[])

        const productsRaw: unknown = productsData ?? []
        productMap = (Array.isArray(productsRaw) ? productsRaw : []).reduce<Record<string, string>>(
          (acc, productUnknown) => {
            if (!isRecord(productUnknown)) return acc
            const productId = toOptionalString(productUnknown.id)
            const name = toOptionalString(productUnknown.name)
            if (!productId || !name) return acc
            acc[productId] = name
            return acc
          },
          {}
        )
      }

      return campaigns.map((campaign) => ({
        ...campaign,
        vendorName: campaign.vendor_id ? vendorMap[campaign.vendor_id]?.name : undefined,
        vendorEmail: campaign.vendor_id ? vendorMap[campaign.vendor_id]?.email : undefined,
        productName: campaign.product_id ? productMap[campaign.product_id] : undefined
      }))
    } catch (error) {
      console.error('Erreur récupération campagnes:', error)
      return []
    }
  }

  /**
   * Crée une nouvelle campagne (vendeur)
   */
  static async createCampaign(
    campaign: Omit<BoostingCampaign, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BoostingCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('boosting_campaigns')
        .insert(campaign)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création campagne:', error)
      return null
    }
  }

  /**
   * Met à jour une campagne
   */
  static async updateCampaign(
    id: string,
    updates: Partial<BoostingCampaign>
  ): Promise<BoostingCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('boosting_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur mise à jour campagne:', error)
      return null
    }
  }

  /**
   * Rejette une campagne via l'API interne.
   * Utilise PUT /api/marketing/campaigns/[id] avec status='rejected' et une raison.
   */
  static async rejectCampaignLegacy(id: string, reason: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const payload = { status: 'rejected', rejection_reason: reason }
        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        return resp.ok
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({ status: 'rejected', rejection_reason: reason, updated_at: nowIso })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur rejet campagne:', error)
      return false
    }
  }

  /**
   * Approuve en tant que Super Admin (flag super_admin_approved=true)
   */
  static async approveAsSuperAdminLegacy(id: string, approvedByUserId?: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const payload: Record<string, unknown> = { super_admin_approved: true }
        if (approvedByUserId) payload.approved_by_super_admin = approvedByUserId
        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        return resp.ok
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({
          super_admin_approved: true,
          approved_by_super_admin: approvedByUserId ?? null,
          updated_at: nowIso
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur approveAsSuperAdmin:', error)
      return false
    }
  }

  /**
   * Approuve en tant que Admin (flag admin_approved=true)
   */
  static async approveAsAdminLegacy(id: string, approvedByUserId?: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const payload: Record<string, unknown> = { admin_approved: true }
        if (approvedByUserId) payload.approved_by_admin = approvedByUserId
        const resp = await fetch(`/api/marketing/campaigns/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        return resp.ok
      }

      const nowIso = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin
        .from('boosting_campaigns')
        .update({
          admin_approved: true,
          approved_by_admin: approvedByUserId ?? null,
          updated_at: nowIso
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur approveAsAdmin:', error)
      return false
    }
  }

  /**
   * Met en pause une campagne
   */
  static async pauseCampaign(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('boosting_campaigns')
        .update({ status: 'paused' })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur pause campagne:', error)
      return false
    }
  }

  /**
   * Reprend une campagne
   */
  static async resumeCampaign(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('boosting_campaigns')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur reprise campagne:', error)
      return false
    }
  }

  static async countOngoingCampaigns(serviceId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('boosting_campaigns')
        .select('*', { head: true, count: 'exact' })
        .eq('service_id', serviceId)
        .in('status', ['pending', 'active'])

      if (error) throw error
      return count ?? 0
    } catch (error) {
      console.error('Erreur comptage campagnes en cours:', error)
      return 0
    }
  }
}

// ============================================
// PERFORMANCE
// ============================================

export class BoostingPerformanceManager {
  /**
   * Récupère les performances d'une campagne
   */
  static async getCampaignPerformance(campaignId: string): Promise<BoostingPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('boosting_performance')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur récupération performances:', error)
      return []
    }
  }

  /**
   * Enregistre les performances d'une journée
   */
  static async recordPerformance(
    performance: Omit<BoostingPerformance, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BoostingPerformance | null> {
    try {
      const { data, error} = await supabase
        .from('boosting_performance')
        .upsert(performance, {
          onConflict: 'campaign_id,date'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur enregistrement performance:', error)
      return null
    }
  }

  /**
   * Calcule les métriques agrégées pour un ensemble de campagnes et une période donnée
   */
  static async getAggregatedPerformance(
    campaignIds: string[],
    options?: { startDate?: string; endDate?: string }
  ): Promise<PerformanceSummary> {
    if (!campaignIds.length) {
      return {
        totals: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          ctr: 0,
          conversionRate: 0
        },
        perCampaign: {}
      }
    }

    try {
      let query = supabase
        .from('boosting_performance')
        .select('campaign_id, impressions, clicks, conversions, revenue')
        .in('campaign_id', campaignIds)

      if (options?.startDate) {
        query = query.gte('date', options.startDate)
      }

      if (options?.endDate) {
        query = query.lte('date', options.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      const perCampaign: Record<string, PerformanceAggregate> = {}

      const rowsRaw: unknown = data ?? []
      ;(Array.isArray(rowsRaw) ? rowsRaw : []).forEach((recordUnknown) => {
        if (!isRecord(recordUnknown)) return
        const campaignId = toOptionalString(recordUnknown.campaign_id)
        if (!campaignId) return

        const current = perCampaign[campaignId] || {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          ctr: 0,
          conversionRate: 0
        }

        current.impressions += toOptionalNumber(recordUnknown.impressions) ?? 0
        current.clicks += toOptionalNumber(recordUnknown.clicks) ?? 0
        current.conversions += toOptionalNumber(recordUnknown.conversions) ?? 0
        current.revenue += Number(toOptionalNumber(recordUnknown.revenue) ?? 0)
        perCampaign[campaignId] = current
      })

      Object.values(perCampaign).forEach((aggregate) => {
        aggregate.ctr = aggregate.impressions > 0
          ? parseFloat(((aggregate.clicks / aggregate.impressions) * 100).toFixed(2))
          : 0

        aggregate.conversionRate = aggregate.clicks > 0
          ? parseFloat(((aggregate.conversions / aggregate.clicks) * 100).toFixed(2))
          : 0
      })

      const totals = Object.values(perCampaign).reduce<PerformanceAggregate>((acc, aggregate) => {
        acc.impressions += aggregate.impressions
        acc.clicks += aggregate.clicks
        acc.conversions += aggregate.conversions
        acc.revenue += aggregate.revenue
        return acc
      }, {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        conversionRate: 0
      })

      totals.ctr = totals.impressions > 0
        ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2))
        : 0

      totals.conversionRate = totals.clicks > 0
        ? parseFloat(((totals.conversions / totals.clicks) * 100).toFixed(2))
        : 0

      return {
        totals,
        perCampaign
      }
    } catch (error) {
      console.error('Erreur agrégation performances:', error)
      return {
        totals: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          ctr: 0,
          conversionRate: 0
        },
        perCampaign: {}
      }
    }
  }
}

// ============================================
// PROMOTIONS
// ============================================

export class PromotionManager {
  /**
   * Récupère les promotions actives
   */
  static async getActivePromotions(): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      const raw: unknown = data ?? []
      return Array.isArray(raw) ? (raw as unknown as Promotion[]) : []
    } catch (error) {
      console.error('Erreur récupération promotions actives:', error)
      return []
    }
  }

  /**
   * Récupère toutes les promotions (admin)
   */
  static async getAllPromotions(): Promise<Promotion[]> {
    try {
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false })

      if (promotionsError) throw promotionsError

      const promotionsRaw: unknown = promotionsData ?? []
      const promotions: Promotion[] = Array.isArray(promotionsRaw)
        ? (promotionsRaw as unknown as Promotion[])
        : []
      const vendorIds = Array.from(new Set(promotions.map((promotion) => promotion.vendor_id).filter(Boolean)))

      let vendorMap: Record<string, { name?: string; email?: string }> = {}
      if (vendorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', vendorIds as string[])

        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', vendorIds as string[])

        const profilesRaw: unknown = profilesData ?? []
        const profileMap = (Array.isArray(profilesRaw) ? profilesRaw : []).reduce<
          Record<string, { first_name?: string; last_name?: string }>
        >((acc, profileUnknown) => {
          if (!isRecord(profileUnknown)) return acc
          const userId = toOptionalString(profileUnknown.user_id)
          if (!userId) return acc
          acc[userId] = {
            first_name: toOptionalString(profileUnknown.first_name) ?? undefined,
            last_name: toOptionalString(profileUnknown.last_name) ?? undefined
          }
          return acc
        }, {})

        const usersRaw: unknown = usersData ?? []
        vendorMap = (Array.isArray(usersRaw) ? usersRaw : []).reduce<Record<string, { name?: string; email?: string }>>(
          (acc, userUnknown) => {
            if (!isRecord(userUnknown)) return acc
            const userId = toOptionalString(userUnknown.id)
            const email = toOptionalString(userUnknown.email)
            if (!userId) return acc
            const profile = profileMap[userId]
            const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''
            acc[userId] = {
              name: fullName || email,
              email
            }
            return acc
          },
          {}
        )
      }

      return promotions.map((promotion) => ({
        ...promotion,
        vendorName: promotion.vendor_id ? vendorMap[promotion.vendor_id]?.name : undefined,
        vendorEmail: promotion.vendor_id ? vendorMap[promotion.vendor_id]?.email : undefined
      }))
    } catch (error) {
      console.error('Erreur récupération promotions:', error)
      return []
    }
  }

  /**
   * Récupère une promotion par code
   */
  static async getPromotionByCode(code: string): Promise<Promotion | null> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', code)
        .eq('status', 'active')
        .single()

      if (error) throw error
      return (data as unknown as Promotion) ?? null
    } catch (error) {
      console.error('Erreur récupération promotion par code:', error)
      return null
    }
  }

  /**
   * Crée une nouvelle promotion (admin)
   */
  static async createPromotion(
    promotion: Omit<Promotion, 'id' | 'used_count' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<Promotion | null> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .insert({
          ...promotion,
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error
      return (data as unknown as Promotion) ?? null
    } catch (error) {
      console.error('Erreur création promotion:', error)
      return null
    }
  }

  /**
   * Met à jour une promotion (admin)
   */
  static async updatePromotion(
    id: string,
    updates: Partial<Promotion>
  ): Promise<Promotion | null> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return (data as unknown as Promotion) ?? null
    } catch (error) {
      console.error('Erreur mise à jour promotion:', error)
      return null
    }
  }

  /**
   * Supprime une promotion (admin)
   */
  static async deletePromotion(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erreur suppression promotion:', error)
      return false
    }
  }

  /**
   * Vérifie si une promotion est applicable à un produit
   */
  static async isPromotionApplicable(
    promotionId: string,
    productId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Récupérer la promotion
      const { data: promotion, error: promoError } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', promotionId)
        .single()

      const promotionTyped = promotion as unknown as Promotion | null
      if (promoError || !promotionTyped) return false

      // Vérifier si active
      if (promotionTyped.status !== 'active') return false

      // Vérifier les dates
      const now = new Date()
      if (new Date(promotionTyped.start_date) > now || new Date(promotionTyped.end_date) < now) {
        return false
      }

      // Vérifier limite d'utilisation globale
      if (promotionTyped.usage_limit && promotionTyped.used_count >= promotionTyped.usage_limit) {
        return false
      }

      // Vérifier limite d'utilisation par utilisateur
      const { data: userUsage, error: usageError } = await supabase
        .from('promotion_usage')
        .select('id')
        .eq('promotion_id', promotionId)
        .eq('user_id', userId)

      if (usageError) return false

      const userUsageRaw: unknown = userUsage ?? []
      const userUsageCount = Array.isArray(userUsageRaw) ? userUsageRaw.length : 0
      if (userUsageCount >= promotionTyped.usage_limit_per_user) {
        return false
      }

      // Vérifier si le produit est applicable
      if (promotionTyped.applicable_products.length > 0) {
        return promotionTyped.applicable_products.includes(productId)
      }

      return true
    } catch (error) {
      console.error('Erreur vérification applicabilité promotion:', error)
      return false
    }
  }

  /**
   * Enregistre l'utilisation d'une promotion
   */
  static async recordUsage(
    usage: Omit<PromotionUsage, 'id' | 'used_at'>
  ): Promise<PromotionUsage | null> {
    try {
      const { data, error } = await supabase
        .from('promotion_usage')
        .insert(usage)
        .select()
        .single()

      if (error) throw error
      return (data as unknown as PromotionUsage) ?? null
    } catch (error) {
      console.error('Erreur enregistrement utilisation promotion:', error)
      return null
    }
  }
}
