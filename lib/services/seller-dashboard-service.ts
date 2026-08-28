import { getSupabaseAdmin } from '@/lib/supabase'
import {
  SuperAdminOrderService,
  type SuperAdminOrderPaymentPayload,
  type SuperAdminOrderReturnPayload,
  type SuperAdminOrderDisputePayload
} from '@/lib/services/super-admin-order-service'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { DashboardService } from '@/lib/services/dashboard-service'
import { SellerDashboardApi } from '@/lib/services/seller-dashboard-service.api'
import type { SharedProduct, SharedProductInput } from '@/lib/types/shared-product'
import type { ProductStatus, ProductStockStatus } from '@/lib/types/shared-product'

// Types exacts basés sur votre base de données
type Tables = Database['public']['Tables']
type UserProfile = Tables['user_profiles']['Row']
type LoyaltyPoints = Tables['loyalty_points']['Row']
type UserOrder = Tables['user_orders']['Row']
type UserProduct = Tables['user_products']['Row']
type UserChat = Tables['user_chats']['Row']
type ChatMessage = Tables['chat_messages']['Row']
type UserMessage = Tables['user_messages']['Row']
type UserNotification = Tables['user_notifications']['Row']
type PointSettingsRow = Tables['point_settings']['Row']
type PointOperationFeeRow = Tables['point_operation_fees']['Row']
type PointOperationLimitRow = Tables['point_operation_limits']['Row']
type PointExchangeRateRow = Tables['point_exchange_rates']['Row']
type PointWithdrawalMethodRow = Tables['point_withdrawal_methods']['Row']
type PointWithdrawalMethodLimitRow = Tables['point_withdrawal_method_limits']['Row']

type SearchUserResult = {
  id: string
  fullName: string
  email: string
  phone: string | null
  username: string | null
  shortCode: string | null
}

interface SellerProductVariationInput {
  id?: string
  name?: string | null
  sku?: string | null
  price?: number | null
  salePrice?: number | null
  stockQuantity?: number | null
  attributes?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export interface CreateSellerProductInput {
  vendorId: string
  name: string
  description?: string | null
  shortDescription?: string | null
  price: number
  salePrice?: number | null
  costPrice?: number | null
  category?: string | null
  subcategory?: string | null
  sku?: string | null
  stockQuantity?: number
  lowStockThreshold?: number
  manageStock?: boolean
  allowBackorders?: boolean
  tags?: string[] | null
  images?: string[] | null
  isFeatured?: boolean
  featured?: boolean
  status?: 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'pending_review'
  metadata?: Record<string, unknown> | null
  seoTitle?: string | null
  seoDescription?: string | null
  costOfShipping?: number | null
  weight?: number | null
  dimensions?: {
    length: number
    width: number
    height: number
  } | null
  onSale?: boolean
  originalPrice?: number | null
  mainImage?: string | null
  productType?: 'simple' | 'variable'
  attributes?: Record<string, unknown> | null
  variations?: SellerProductVariationInput[]
}

export interface UpdateSellerProductInput extends Partial<CreateSellerProductInput> {
  id: string
}

// Types étendus pour le tableau de bord vendeur
export interface SellerStats {
  totalSales: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  totalRevenue: number
  totalCommissions: number
  totalPoints: number
  averageRating: number
  totalReviews: number
  totalShares: number
  ranking: number
  totalVendors: number
  responseRate: number
  averageResponseTime: number
}

export interface SellerProduct {
  id: string
  name: string
  price: number
  salePrice?: number | null
  costPrice?: number | null
  originalPrice: number
  image: string
  category: string
  stock: number
  sales: number
  revenue: number
  shares: number
  rating: number
  reviews: number
  status: 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'pending_review'
  createdAt: string
  updatedAt: string
  description?: string
  shortDescription?: string | null
  sku?: string | null
  images?: string[]
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  metadata?: Record<string, unknown> | null
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingCost?: number
  isShareable?: boolean
  isPromoted?: boolean
  productType?: 'simple' | 'variable'
  variations?: SellerProductVariationInput[]
}

export interface SellerOrder {
  id: string
  displayId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  products: Array<{
    id: string
    name: string
    price: number
    quantity: number
    image: string
    category: string
    vendor: string
    isDigital?: boolean
    downloadUrl?: string
  }>
  totalAmount: number
  commission: number
  netRevenue: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
  deliveryStatus?: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod?: string
  shippingAddress: string
  deliveryOption?: string
  shippingMethodId?: string | number
  deliveryId?: string
  shippingLat?: number
  shippingLng?: number
  orderDate: string
  deliveryDate?: string
  customerRating?: number
  customerReview?: string
  trackingNumber?: string
  shippingMethod?: string
  notes?: string
  isPaymentRequested?: boolean
  paymentRequestDate?: string | null
  returnStatus?: string
  returnReason?: string
  returnProcessedAt?: string
  disputeStatus?: string
  disputePriority?: string
  disputeAssignedTo?: string
  disputeSubject?: string
  disputeDescription?: string
  disputeOpenedAt?: string
  disputeUpdatedAt?: string
}

export interface SellerRevenue {
  totalRevenueAllTime?: number
  totalRevenue30Days?: number
  totalRevenue: number
  totalCommissions: number
  netRevenue: number
  pendingPayments: number
  completedPayments: number
  monthlyRevenue: number[]
  monthlyOrders: number[]
  monthKeys?: string[]
  salesEvolution?: Array<{
    date: string
    revenue: number
    orders?: number
  }>
  topProducts: Array<{
    id: string
    productId?: string
    name: string
    revenue: number
    sales: number
    image?: string
    shares?: number
  }>
  revenueByCategory: Array<{
    category: string
    revenue: number
    percentage: number
  }>
  paymentHistory: Array<{
    id: string
    amount: number
    date: string
    method: string
    status: string
  }>
}

export interface SellerProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  bio: string
  company: string
  website: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  socialMedia: {
    facebook: string
    twitter: string
    instagram: string
    linkedin: string
  }
  verification: {
    isVerified: boolean
    verificationDate?: string
    documents: Array<{
      id: string
      type: string
      name: string
      status: 'pending' | 'approved' | 'rejected'
      uploadedAt: string
    }>
  }
  preferences: {
    theme: 'auto' | 'light' | 'dark'
    language: string
    currency: string
    timezone: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  statistics: {
    totalSales: number
    totalOrders: number
    averageRating: number
    totalReviews: number
    responseRate: number
    averageResponseTime: number
  }
}

export interface SellerPointsData {
  balance: number
  isFallback?: boolean
  isFrozen: boolean
  freezeReason: string | null
  frozenPoints: number
  totalEarned: number
  totalSpent: number
  totalTransferred: number
  conversionRate: number
  exchangeRate: number
  pendingRequests: number
  withdrawalRequests: Array<{
    id: string
    amount: number
    method: string | null
    status: string
    timestamp: string
  }>
  sharesData: {
    totalShares: number
    sharesThisMonth: number
    pointsFromShares: number
    viralScore: number
    topSharedProducts: Array<{
      id: string
      name: string
      image: string
      shares: number
      points: number
      revenue: number
      isOwnProduct: boolean
    }>
    socialNetworkStats: {
      facebook: { shares: number; points: number; engagement: number }
      instagram: { shares: number; points: number; engagement: number }
      twitter: { shares: number; points: number; engagement: number }
      whatsapp: { shares: number; points: number; engagement: number }
      linkedin: { shares: number; points: number; engagement: number }
    }
    userEngagement: Array<{
      id: string
      name: string
      avatar: string
      totalShares: number
      pointsEarned: number
      lastShareDate: string
      favoriteCategories: string[]
      engagementScore: number
    }>
  }
  overview: {
    balanceTrend: Array<{
      date: string
      balance: number
      earned: number
      spent: number
    }>
    categoryBreakdown: Array<{
      type: 'earned' | 'spent' | 'transferred' | 'exchanged' | 'bonus' | 'share_bonus'
      value: number
    }>
  }
  history: Array<{
    id: string
    type: 'earned' | 'spent' | 'transferred' | 'exchanged' | 'bonus' | 'share_bonus'
    amount: number
    description: string
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
    source?: string
    recipient?: string
    productId?: string
    socialNetwork?: string
    shareType?: 'product' | 'category' | 'campaign'
  }>
  topEarners: Array<{
    id: string
    name: string
    avatar: string
    points: number
    shares: number
    revenue: number
    engagementScore: number
    favoriteCategories: string[]
  }>
  exchangeHistory: Array<{
    id: string
    amount: number
    rate: number
    total: number
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
  }>
  predictiveAnalytics: {
    nextMonthPrediction: number
    growthTrend: 'increasing' | 'decreasing' | 'stable'
    recommendedActions: string[]
    marketOpportunities: Array<{
      category: string
      potentialPoints: number
      difficulty: 'low' | 'medium' | 'high'
    }>
  }
  configuration: {
    settings: {
      defaultCurrency: string
      conversionRate: number
      minBalance: number
      maxBalance: number | null
      transferEnabled: boolean
      exchangeEnabled: boolean
      withdrawalEnabled: boolean
    }
    fees: {
      transfer: {
        flat: number
        percentage: number
        minimum: number
        maximum: number | null
        currency: string
      }
      exchange: {
        flat: number
        percentage: number
        minimum: number
        maximum: number | null
        currency: string
      }
      withdrawal: {
        flat: number
        percentage: number
        minimum: number
        maximum: number | null
        currency: string
      }
    }
    limits: {
      transfer: {
        min: number
        max: number | null
        daily: number | null
        monthly: number | null
      }
      exchange: {
        min: number
        max: number | null
        daily: number | null
        monthly: number | null
      }
      withdrawal: {
        min: number
        max: number | null
        daily: number | null
        monthly: number | null
      }
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
}

export interface SellerReview {
  id: string
  customerId: string
  customerName: string
  customerAvatar: string
  productId: string
  productName: string
  productImage: string
  rating: number
  title: string
  content: string
  images: string[]
  createdAt: string
  status: 'approved' | 'pending' | 'rejected' | 'flagged'
  isVerified: boolean
  helpfulCount: number
  replyCount: number
  sellerReply?: {
    content: string
    createdAt: string
  }
  flags: Array<{
    id: string
    reason: string
    reporterId: string
    reporterName: string
    createdAt: string
    status: 'pending' | 'resolved' | 'dismissed'
  }>
  sentiment: 'positive' | 'negative' | 'neutral'
  impact: 'high' | 'medium' | 'low'
}

export interface SellerRanking {
  id: string
  vendorName: string
  vendorAvatar: string
  vendorCategory: string
  salesVolume: number
  salesRank: number
  sharesCount: number
  sharesRank: number
  viewsCount: number
  viewsRank: number
  overallRank: number
  previousRank: number
  rating: number
  totalProducts: number
  totalRevenue: number
  trend: 'up' | 'down' | 'stable'
  performance: number
  badges: string[]
  lastUpdated: string
}

// Interface des données du tableau de bord vendeur
export interface SellerDashboardData {
  sellerProfile: SellerProfile | null
  loyaltyPoints: LoyaltyPoints | null
  products: SellerProduct[]
  orders: SellerOrder[]
  revenue: SellerRevenue
  pointsData: SellerPointsData
  reviews: SellerReview[]
  rankings: SellerRanking[]
  stats: SellerStats
  unreadMessages: number
  unreadChats: number
  notifications: UserNotification[]
  messages: UserMessage[]
}

// Service principal du tableau de bord vendeur
export class SellerDashboardService {
  private static cache: {
    vendorId: string
    timestamp: number
    data: SellerDashboardData
  } | null = null

  /**
   * Normalise un chemin média (storage path) en URL affichable.
   * - Si c'est déjà une URL http(s), on retourne tel quel.
   * - Sinon, on génère une URL publique depuis le bucket Supabase (par défaut: product-assets).
   */
  private static resolveMediaUrl(path: string | null | undefined, bucketName = 'product-assets'): string | null {
    if (!path) return null
    const trimmed = String(path).trim()
    if (!trimmed) return null
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }

    try {
      const {
        data: { publicUrl }
      } = supabase.storage.from(bucketName).getPublicUrl(trimmed)
      return publicUrl || trimmed
    } catch {
      return trimmed
    }
  }

  /**
   * Retourne le token d'accès Supabase courant côté navigateur.
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession()
      return data?.session?.access_token ?? null
    } catch {
      return null
    }
  }

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
   * Bloque les opérations points si le compte loyalty_points est gelé.
   */
  private static assertNotFrozen(loyaltyRow: any, operationLabel: string) {
    const frozen = Boolean(loyaltyRow?.is_frozen ?? false)
    if (!frozen) {
      return
    }

    const reason = (loyaltyRow?.freeze_reason ?? '').toString().trim()
    const suffix = reason ? ` : ${reason}` : ''
    throw new Error(`Compte gelé${suffix} — ${operationLabel} impossible`)
  }

  /**
   * Utilitaires partagés pour éviter la duplication avec ClientPointsService.
   */
  /**
   * Force une valeur numérique à être positive et tronquée à deux décimales.
   */
  private static toPositive(value: number) {
    return Number(Math.max(value, 0).toFixed(2))
  }

  /**
   * Calcule la somme des frais fixes et pourcentage pour une opération de points.
   */
  private static calculateFee(amount: number, fee: PointOperationFeeRow | null): number {
    if (!fee || amount <= 0) {
      return 0
    }

    const percentagePart = (amount * Number(fee.percentage_fee ?? 0)) / 100
    let total = Number(fee.flat_fee ?? 0) + percentagePart
    total = Math.max(total, Number(fee.minimum_fee ?? 0))

    if (fee.maximum_fee !== null && fee.maximum_fee !== undefined) {
      total = Math.min(total, Number(fee.maximum_fee))
    }

    return this.toPositive(total)
  }

  /**
   * Vérifie qu'un montant respecte les bornes (min/max) déclarées.
   */
  private static ensureLimits(amount: number, limit: PointOperationLimitRow | null, label: string) {
    if (!limit) {
      return
    }

    const min = limit.min_amount !== null && limit.min_amount !== undefined ? Number(limit.min_amount) : null
    const max = limit.max_amount !== null && limit.max_amount !== undefined ? Number(limit.max_amount) : null

    if (min !== null && amount < min) {
      throw new Error(`Le ${label} doit être supérieur ou égal à ${min}`)
    }

    if (max !== null && amount > max) {
      throw new Error(`Le ${label} ne peut pas dépasser ${max}`)
    }
  }

  /**
   * Vérifie les plafonds journaliers et mensuels à partir de l'historique des transactions.
   */
  private static async ensurePeriodLimits(
    vendorId: string,
    amount: number,
    limit: PointOperationLimitRow | null,
    transactionTypes: string[],
    label: string
  ): Promise<void> {
    if (!limit) {
      return
    }

    const dailyCap =
      limit.daily_limit !== null && limit.daily_limit !== undefined ? Number(limit.daily_limit) : null
    const monthlyCap =
      limit.monthly_limit !== null && limit.monthly_limit !== undefined ? Number(limit.monthly_limit) : null

    if ((dailyCap === null || !Number.isFinite(dailyCap)) && (monthlyCap === null || !Number.isFinite(monthlyCap))) {
      return
    }

    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data, error } = await supabase
      .from('point_transactions')
      .select('points, type, created_at')
      .eq('user_id', vendorId)
      .in('type', transactionTypes)
      .gte('created_at', startOfMonth.toISOString())

    if (error) {
      throw error
    }

    const sumSince = (from: Date) =>
      (data || []).reduce((total, row) => {
        const createdAt = new Date(String((row as any).created_at || ''))
        if (Number.isNaN(createdAt.getTime()) || createdAt < from) {
          return total
        }
        return total + Number((row as any).points ?? 0)
      }, 0)

    const dailyUsed = sumSince(startOfDay)
    const monthlyUsed = sumSince(startOfMonth)

    if (dailyCap !== null && Number.isFinite(dailyCap) && dailyUsed + amount > dailyCap) {
      throw new Error(`Limite journalière de ${label} dépassée (${dailyCap} points max)`)
    }

    if (monthlyCap !== null && Number.isFinite(monthlyCap) && monthlyUsed + amount > monthlyCap) {
      throw new Error(`Limite mensuelle de ${label} dépassée (${monthlyCap} points max)`)
    }
  }

  /**
   * Récupère la configuration de frais pour une opération donnée (scope vendeur > global).
   */
  private static async getOperationFee(operationType: 'transfer' | 'exchange' | 'withdrawal'): Promise<PointOperationFeeRow | null> {
    try {
      for (const scope of ['vendor', 'global'] as const) {
        const { data, error } = await supabase
          .from('point_operation_fees')
          .select('*')
          .eq('operation_type', operationType)
          .eq('scope', scope)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          return data as unknown as PointOperationFeeRow
        }
      }

      return null
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des frais ${operationType} vendeur:`, error)
      return null
    }
  }

  /**
   * Récupère les limites autorisées pour une opération de points.
   */
  private static async getOperationLimit(operationType: 'transfer' | 'exchange' | 'withdrawal'): Promise<PointOperationLimitRow | null> {
    try {
      for (const scope of ['vendor', 'global'] as const) {
        const { data, error } = await supabase
          .from('point_operation_limits')
          .select('*')
          .eq('operation_type', operationType)
          .eq('scope', scope)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          return data as unknown as PointOperationLimitRow
        }
      }

      return null
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des limites ${operationType} vendeur:`, error)
      return null
    }
  }

  /**
   * Charge tous les taux de change de points disponibles pour le vendeur.
   */
  private static async getAllExchangeRates() {
    try {
      const { data, error } = await supabase
        .from('point_exchange_rates')
        .select('*')

      if (error) {
        throw error
      }

      const rows = data ?? []

      const hasScopeColumn = rows.some((row) => typeof (row as any)?.scope === 'string')
      if (!hasScopeColumn) {
        return rows
      }

      const vendorRates = rows.filter(row => (row as any).scope === 'vendor')
      return vendorRates.length > 0
        ? vendorRates
        : rows.filter(row => (row as any).scope === 'global')
    } catch (error) {
      this.handleSupabaseError(error, 'getAllExchangeRates')
      return []
    }
  }

  /**
   * Sélectionne le taux de change correspondant à une devise donnée.
   */
  private static async getExchangeRate(currency: string) {
    const rates = await this.getAllExchangeRates()
    return rates.find(rate => rate.currency === currency) ?? null
  }

  /**
   * Récupère les méthodes de retrait actives avec leurs limites associées.
   */
  private static async getWithdrawalMethods() {
    try {
      const { data, error } = await supabase
        .from('point_withdrawal_methods')
        .select('*, limits:point_withdrawal_method_limits(*)')
        .eq('is_active', true)

      if (error) {
        throw error
      }

      const rows = data ?? []
      return rows.map(row => ({
        method: row as PointWithdrawalMethodRow,
        limits: (row.limits ?? []) as PointWithdrawalMethodLimitRow[]
      }))
    } catch (error) {
      this.handleSupabaseError(error, 'getWithdrawalMethods')
      return []
    }
  }

  /**
   * Retourne un profil utilisateur éligible aux transferts (vendeur ou client).
   */
  private static async getEligibleUserProfile(userProfileId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name, phone')
        .eq('id', userProfileId)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data) {
        return null
      }

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', data.user_id)
        .maybeSingle()

      if (userError) {
        throw userError
      }

      if (!userRow || (userRow.role !== 'vendor' && userRow.role !== 'client')) {
        return null
      }

      return {
        id: data.id,
        userId: userRow.id,
        email: userRow.email ?? '',
        fullName: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || userRow.email || 'Utilisateur',
        phone: data.phone ?? null
      }
    } catch (error) {
      this.handleSupabaseError(error, 'getEligibleUserProfile')
      return null
    }
  }

  /**
   * Transforme la réponse API d'une commande en structure exploitable par l'UI vendeur.
   */
  private static mapApiOrderToSellerOrder(apiOrder: any): SellerOrder {
    const rawDisplayId =
      apiOrder?.order_number ??
      apiOrder?.orderNumber ??
      apiOrder?.order_no ??
      apiOrder?.orderNo ??
      apiOrder?.reference ??
      apiOrder?.ref ??
      apiOrder?.code ??
      apiOrder?.short_id ??
      apiOrder?.shortId ??
      null

    const resolvedDisplayId = (() => {
      if (rawDisplayId === null || rawDisplayId === undefined) return ''
      const value = String(rawDisplayId).trim()
      return value.length > 0 ? value : ''
    })()

    const orderItems = Array.isArray(apiOrder?.order_items)
      ? apiOrder.order_items.map((item: any, index: number) => ({
          id: item?.id ?? `${apiOrder?.id ?? 'order'}-item-${index}`,
          productId: item?.product_id ?? item?.productId ?? undefined,
          name: item?.product_name ?? item?.name ?? 'Produit',
          quantity: Number(item?.quantity ?? 0),
          price: Number(item?.unit_price ?? item?.price ?? 0),
          total: Number(item?.total_price ?? item?.total ?? 0),
          isDigital: Boolean(
            item?.product_is_digital ??
            item?.productIsDigital ??
            item?.product_is_virtual ??
            item?.productIsVirtual ??
            item?.product_is_downloadable ??
            item?.productIsDownloadable
          )
        }))
      : []

    const shippingAddressParts: string[] = []
    const shipping = apiOrder?.shipping_address ?? apiOrder?.shippingAddress ?? {}
    const addPart = (value?: string | null) => {
      if (value) shippingAddressParts.push(value)
    }
    const deliveryAddressRaw =
      (shipping as any)?.delivery_address ??
      (shipping as any)?.deliveryAddress ??
      (shipping as any)?.address ??
      null
    if (typeof deliveryAddressRaw === 'string') {
      addPart(deliveryAddressRaw.trim() || null)
    } else if (deliveryAddressRaw && typeof deliveryAddressRaw === 'object') {
      addPart(String((deliveryAddressRaw as any)?.street ?? (deliveryAddressRaw as any)?.line1 ?? ''))
      addPart(String((deliveryAddressRaw as any)?.line2 ?? ''))
      addPart(String((deliveryAddressRaw as any)?.city ?? ''))
      addPart(String((deliveryAddressRaw as any)?.state ?? (deliveryAddressRaw as any)?.region ?? ''))
      addPart(String((deliveryAddressRaw as any)?.postal_code ?? (deliveryAddressRaw as any)?.zip ?? ''))
      addPart(String((deliveryAddressRaw as any)?.country ?? ''))
    }

    addPart((shipping as any)?.street || (shipping as any)?.line1)
    addPart((shipping as any)?.line2)
    addPart((shipping as any)?.city)
    addPart((shipping as any)?.state)
    addPart((shipping as any)?.postal_code || (shipping as any)?.zip)
    addPart((shipping as any)?.country)

    const customer = apiOrder?.customer ?? {}
    const composedCustomerName = `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim()
    const fallbackCustomerName = composedCustomerName.length > 0 ? composedCustomerName : undefined

    const grossTotalCandidate = Number(
      apiOrder?.final_total ?? apiOrder?.total_amount ?? apiOrder?.total ?? apiOrder?.amount ?? 0
    )
    const grossTotal = Number.isFinite(grossTotalCandidate) ? grossTotalCandidate : 0

    const commissionCandidate = Number(
      apiOrder?.commission_amount ??
        apiOrder?.commissionAmount ??
        apiOrder?.commission_total ??
        apiOrder?.commissionTotal ??
        apiOrder?.commission ??
        apiOrder?.platform_fee ??
        apiOrder?.fee_amount ??
        0
    )
    const commission = Number.isFinite(commissionCandidate) ? commissionCandidate : 0

    const netCandidate = Number(
      apiOrder?.net_amount ??
        apiOrder?.netAmount ??
        apiOrder?.net_revenue ??
        apiOrder?.net_revenue_amount ??
        apiOrder?.netRevenue ??
        apiOrder?.seller_amount ??
        apiOrder?.vendor_amount ??
        NaN
    )
    const netRevenue = Number.isFinite(netCandidate) ? netCandidate : Math.max(0, grossTotal - commission)

    const isPaymentRequestedRaw =
      apiOrder?.is_payment_requested ??
      apiOrder?.isPaymentRequested ??
      apiOrder?.payment_requested ??
      apiOrder?.paymentRequested

    const paymentRequestDateRaw =
      apiOrder?.payment_request_date ??
      apiOrder?.paymentRequestDate ??
      apiOrder?.payment_requested_at ??
      apiOrder?.paymentRequestedAt ??
      apiOrder?.payment_request_created_at ??
      apiOrder?.paymentRequestCreatedAt ??
      null

    return {
      id: String(apiOrder?.id ?? apiOrder?.uuid ?? ''),
      displayId:
        resolvedDisplayId ||
        (() => {
          const id = String(apiOrder?.id ?? apiOrder?.uuid ?? '').trim()
          if (!id) return ''
          return id.length > 12 ? id.slice(0, 12) : id
        })(),
      customerName: customer?.full_name ?? fallbackCustomerName ?? apiOrder?.customer_name ?? 'Client inconnu',
      customerEmail: customer?.email ?? apiOrder?.customer_email ?? '',
      customerPhone: customer?.phone ?? apiOrder?.customer_phone ?? '',
      products: orderItems,
      totalAmount: grossTotal,
      commission,
      netRevenue,
      status: (apiOrder?.status ?? 'pending') as SellerOrder['status'],
      deliveryStatus: (apiOrder?.delivery_status ?? apiOrder?.deliveryStatus ?? undefined) as any,
      paymentStatus: (apiOrder?.payment_status ?? apiOrder?.paymentStatus ?? 'pending') as SellerOrder['paymentStatus'],
      paymentMethod: (apiOrder?.payment_method ?? apiOrder?.paymentMethod ?? undefined) as any,
      shippingAddress: shippingAddressParts.join(', '),
      deliveryOption: (apiOrder?.delivery_option ?? apiOrder?.deliveryOption ?? undefined) as any,
      shippingMethodId: (apiOrder?.shipping_method_id ?? apiOrder?.shippingMethodId ?? undefined) as any,
      deliveryId: (apiOrder?.delivery_id ?? apiOrder?.deliveryId ?? undefined) as any,
      shippingLat: (apiOrder?.shipping_lat ?? apiOrder?.shippingLat ?? undefined) as any,
      shippingLng: (apiOrder?.shipping_lng ?? apiOrder?.shippingLng ?? undefined) as any,
      orderDate: apiOrder?.created_at ?? apiOrder?.order_date ?? new Date().toISOString(),
      deliveryDate: apiOrder?.delivery_date ?? apiOrder?.delivered_at ?? undefined,
      customerRating: apiOrder?.customer_review?.rating ?? apiOrder?.customer_rating ?? undefined,
      customerReview: apiOrder?.customer_review?.comment ?? apiOrder?.customer_review ?? undefined,
      trackingNumber: apiOrder?.tracking_number ?? apiOrder?.trackingNumber ?? undefined,
      shippingMethod: apiOrder?.shipping_method ?? apiOrder?.shippingMethod ?? undefined,
      notes: apiOrder?.notes ?? apiOrder?.seller_notes ?? apiOrder?.metadata?.notes ?? undefined,
      isPaymentRequested: Boolean(isPaymentRequestedRaw),
      paymentRequestDate: paymentRequestDateRaw ? String(paymentRequestDateRaw) : null,
      returnStatus:
        apiOrder?.return_status ?? apiOrder?.returnStatus ?? apiOrder?.return?.status ?? undefined,
      returnReason:
        apiOrder?.return_reason ?? apiOrder?.returnReason ?? apiOrder?.return?.reason ?? undefined,
      returnProcessedAt:
        apiOrder?.return_processed_at ??
        apiOrder?.returnProcessedAt ??
        apiOrder?.return?.processed_at ??
        undefined,
      disputeStatus:
        apiOrder?.dispute_status ?? apiOrder?.disputeStatus ?? apiOrder?.dispute?.status ?? undefined,
      disputePriority:
        apiOrder?.dispute_priority ?? apiOrder?.disputePriority ?? apiOrder?.dispute?.priority ?? undefined,
      disputeAssignedTo:
        apiOrder?.dispute_assigned_to ??
        apiOrder?.disputeAssignedTo ??
        apiOrder?.dispute?.assigned_to ??
        undefined,
      disputeSubject:
        apiOrder?.dispute_subject ?? apiOrder?.disputeSubject ?? apiOrder?.dispute?.subject ?? undefined,
      disputeDescription:
        apiOrder?.dispute_description ??
        apiOrder?.disputeDescription ??
        apiOrder?.dispute?.description ??
        undefined,
      disputeOpenedAt:
        apiOrder?.dispute_opened_at ??
        apiOrder?.disputeOpenedAt ??
        apiOrder?.dispute?.opened_at ??
        apiOrder?.dispute?.created_at ??
        undefined,
      disputeUpdatedAt:
        apiOrder?.dispute_updated_at ??
        apiOrder?.disputeUpdatedAt ??
        apiOrder?.dispute?.updated_at ??
        apiOrder?.dispute?.resolved_at ??
        undefined
    }
  }

  /**
   * Construit le profil vendeur affiché dans Paramètres / Profil à partir du compte et de user_profiles.
   */
  static buildSellerProfileFromSources(params: {
    vendorId: string
    email?: string | null
    userProfile?: Partial<UserProfile> | null
    stats?: Partial<SellerStats> | null
    isVerified?: boolean
  }): SellerProfile {
    const profile = params.userProfile
    const firstName = String(profile?.first_name ?? '').trim()
    const lastName = String(profile?.last_name ?? '').trim()
    const fullName = `${firstName} ${lastName}`.trim()
    const email = String(params.email ?? '').trim()
    const name = fullName || email || 'Vendeur Pro'

    const prefsRaw =
      profile?.preferences && typeof profile.preferences === 'object' && !Array.isArray(profile.preferences)
        ? (profile.preferences as Record<string, unknown>)
        : {}
    const uiPrefs =
      prefsRaw.ui && typeof prefsRaw.ui === 'object' && !Array.isArray(prefsRaw.ui)
        ? (prefsRaw.ui as Record<string, unknown>)
        : prefsRaw
    const themeRaw = String(uiPrefs.theme ?? prefsRaw.theme ?? 'auto')
    const theme: SellerProfile['preferences']['theme'] =
      themeRaw === 'dark' || themeRaw === 'light' ? themeRaw : 'auto'
    const language = String(uiPrefs.language ?? prefsRaw.language ?? 'fr')
    const currency = String(uiPrefs.currency ?? prefsRaw.currency ?? 'xof')
    const timezone = String(uiPrefs.timezone ?? prefsRaw.timezone ?? 'africa_cotonou')
    const notifRaw =
      uiPrefs.notifications && typeof uiPrefs.notifications === 'object'
        ? (uiPrefs.notifications as Record<string, unknown>)
        : prefsRaw.notifications && typeof prefsRaw.notifications === 'object'
          ? (prefsRaw.notifications as Record<string, unknown>)
          : {}

    const socialRaw =
      profile?.social_media && typeof profile.social_media === 'object' && !Array.isArray(profile.social_media)
        ? (profile.social_media as Record<string, unknown>)
        : {}

    const verificationRaw =
      profile?.verification && typeof profile.verification === 'object' && !Array.isArray(profile.verification)
        ? (profile.verification as Record<string, unknown>)
        : {}

    const stats = params.stats ?? {}

    return {
      id: String(profile?.id ?? params.vendorId),
      name,
      email: email || '—',
      phone: String(profile?.phone ?? ''),
      avatar: String(profile?.avatar_url ?? ''),
      bio: String(profile?.bio ?? ''),
      company: String(prefsRaw.company ?? prefsRaw.business_name ?? ''),
      website: String(profile?.website ?? ''),
      address: {
        street: String(profile?.address ?? ''),
        city: String(profile?.city ?? ''),
        state: String(prefsRaw.address_state ?? ''),
        country: String(profile?.country ?? ''),
        postalCode: String(profile?.postal_code ?? '')
      },
      socialMedia: {
        facebook: String(socialRaw.facebook ?? ''),
        twitter: String(socialRaw.twitter ?? socialRaw.x ?? ''),
        instagram: String(socialRaw.instagram ?? ''),
        linkedin: String(socialRaw.linkedin ?? '')
      },
      verification: {
        isVerified: Boolean(verificationRaw.isVerified ?? (verificationRaw.status === 'approved') ?? params.isVerified),
        documents: Array.isArray(verificationRaw.documents) ? verificationRaw.documents : []
      },
      preferences: {
        theme,
        language,
        currency,
        timezone,
        notifications: {
          email: notifRaw.email !== false,
          sms: Boolean(notifRaw.sms),
          push: notifRaw.push !== false
        }
      },
      statistics: {
        totalSales: Number(stats.totalSales ?? 0),
        totalOrders: Number(stats.totalOrders ?? 0),
        averageRating: Number(stats.averageRating ?? 0),
        totalReviews: Number(stats.totalReviews ?? 0),
        responseRate: Number(stats.responseRate ?? prefsRaw.response_rate ?? uiPrefs.response_rate ?? 0) || 0,
        averageResponseTime: Number(stats.averageResponseTime ?? 0)
      }
    }
  }

  /**
   * Charge user_profiles + email pour alimenter la section Paramètres.
   */
  private static async resolveSellerProfileForVendor(
    vendorId: string,
    stats?: Partial<SellerStats> | null
  ): Promise<SellerProfile | null> {
    if (!vendorId) return null

    try {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .maybeSingle()

      let email = ''
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('email, role')
          .eq('id', vendorId)
          .maybeSingle()
        email = String(userRow?.email ?? '')
      } catch {
        // ignore
      }

      return this.buildSellerProfileFromSources({
        vendorId,
        email,
        userProfile: (profileRow as UserProfile | null) ?? null,
        stats,
        isVerified: false // On laisse buildSellerProfileFromSources décider via le profil réel
      })
    } catch {
      return null
    }
  }

  /**
   * Récupère l'ensemble des données du tableau de bord vendeur depuis l'API centrale.
   */
  static async getSellerDashboardData(vendorId: string): Promise<SellerDashboardData> {
    try {
      const isBrowser = typeof window !== 'undefined'

      let orders: SellerOrder[] = []

      const notificationsPromise = DashboardService.getUserNotifications(vendorId).catch(() => [])

      const dashboardPromise = SellerDashboardApi.getDashboard?.(vendorId) ?? Promise.resolve(null)

      let dashboardData: any | null = null

      if (isBrowser) {
        const accessToken = await this.getAccessToken()

        const ordersPromise = fetch('/api/vendor/orders', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          credentials: 'include',
          cache: 'no-store'
        }).catch(() => null)

        const [resp, dashboardPayload] = await Promise.all([ordersPromise, dashboardPromise])
        dashboardData = dashboardPayload

        if (resp && resp.ok) {
          const json = await resp.json().catch(() => ({}))
          const raw = (json as any)?.data
          if (Array.isArray(raw)) {
            orders = raw.map((order: any) => this.mapApiOrderToSellerOrder(order))
          }
        } else {
          const status = resp?.status
          const body = await resp?.text().catch(() => '')
          console.warn('⚠️ /api/vendor/orders failed:', status, body)
          // Important: ne pas masquer les erreurs d'auth, sinon le vendeur voit une liste vide.
          if (status === 401 || status === 403) {
            throw new Error('Accès refusé: authentification vendeur requise pour charger les commandes.')
          }
        }
      } else {
        const superAdminOrders = await SuperAdminOrderService.list({ vendorId, limit: 200 })
        orders = Array.isArray(superAdminOrders)
          ? superAdminOrders.map(order => this.mapApiOrderToSellerOrder(order))
          : []

        dashboardData = await dashboardPromise
      }

      const baseData: Partial<SellerDashboardData> = dashboardData ?? {}

      /**
       * Assure que loyalty_points est disponible même si l'API vendor ne le renvoie pas.
       * (Le header lit AuthContext -> loyalty_points, mais la section points utilise SellerDashboardData.)
       */
      let resolvedLoyaltyPoints: LoyaltyPoints | null = (baseData.loyaltyPoints as LoyaltyPoints | null) ?? null

      if (!resolvedLoyaltyPoints) {
        try {
          const { data } = await supabase
            .from('loyalty_points')
            .select('*')
            .eq('user_id', vendorId)
            .maybeSingle()

          resolvedLoyaltyPoints = (data as LoyaltyPoints | null) ?? null
        } catch {
          resolvedLoyaltyPoints = null
        }
      }

      const apiPointsData = baseData.pointsData as SellerPointsData | undefined
      const apiBalance = Number((apiPointsData as any)?.balance ?? NaN)
      const dbBalance = Number((resolvedLoyaltyPoints as any)?.points_balance ?? NaN)

      const shouldRecomputePointsData =
        !apiPointsData ||
        (Number.isFinite(dbBalance) && Number.isFinite(apiBalance) && apiBalance !== dbBalance)

      const resolvedPointsData = shouldRecomputePointsData
        ? await this.getSellerPointsData(vendorId, resolvedLoyaltyPoints, baseData.products ?? [])
        : apiPointsData

      const computedStats: SellerStats = {
        totalSales: 0,
        totalOrders: orders.length,
        totalProducts: baseData.products?.length ?? 0,
        totalCustomers: 0,
        totalRevenue: orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0),
        totalCommissions: orders.reduce((acc, order) => acc + (order.commission || 0), 0),
        totalPoints: Number((resolvedLoyaltyPoints as any)?.points_balance ?? 0),
        averageRating: 0,
        totalReviews: 0,
        totalShares: 0,
        ranking: 0,
        totalVendors: 0,
        responseRate: 0,
        averageResponseTime: 0
      }

      const apiStats = (baseData.stats ?? {}) as Partial<SellerStats>

      const mergedStats: SellerStats = {
        ...computedStats,
        ...apiStats,
        totalSales: Number.isFinite(Number(apiStats.totalSales)) && Number(apiStats.totalSales) > 0
          ? Number(apiStats.totalSales)
          : Math.max(computedStats.totalOrders, computedStats.totalSales),
        totalRevenue: Number.isFinite(Number((baseData.revenue as any)?.totalRevenue))
          ? Number((baseData.revenue as any)?.totalRevenue)
          : Number.isFinite(Number((baseData.revenue as any)?.totalRevenueAllTime))
            ? Number((baseData.revenue as any)?.totalRevenueAllTime)
            : Number.isFinite(Number(apiStats.totalRevenue))
              ? Number(apiStats.totalRevenue)
              : computedStats.totalRevenue,
        totalCommissions: Number.isFinite(Number((baseData.revenue as any)?.totalCommissions))
          ? Number((baseData.revenue as any)?.totalCommissions)
          : Number.isFinite(Number(apiStats.totalCommissions))
            ? Number(apiStats.totalCommissions)
            : computedStats.totalCommissions,
        averageRating: Number.isFinite(Number(apiStats.averageRating))
          ? Number(apiStats.averageRating)
          : computedStats.averageRating,
        totalReviews: Number.isFinite(Number(apiStats.totalReviews))
          ? Number(apiStats.totalReviews)
          : computedStats.totalReviews,
        ranking: Number.isFinite(Number(apiStats.ranking)) ? Number(apiStats.ranking) : computedStats.ranking,
        totalVendors: Number.isFinite(Number(apiStats.totalVendors))
          ? Number(apiStats.totalVendors)
          : computedStats.totalVendors,
        responseRate: Number.isFinite(Number(apiStats.responseRate))
          ? Number(apiStats.responseRate)
          : computedStats.responseRate,
        averageResponseTime: Number.isFinite(Number(apiStats.averageResponseTime))
          ? Number(apiStats.averageResponseTime)
          : computedStats.averageResponseTime
      }

      const notifications = await notificationsPromise

      const defaultRevenue: SellerRevenue = {
        totalRevenue: 0,
        totalCommissions: 0,
        netRevenue: 0,
        pendingPayments: 0,
        completedPayments: 0,
        monthlyRevenue: [],
        monthlyOrders: [],
        salesEvolution: [],
        topProducts: [],
        revenueByCategory: [],
        paymentHistory: []
      }

      // ── Filet de sécurité : si l'API /api/vendor/dashboard n'a pas répondu
      // (auth expirée, 5xx…), l'onglet Chiffre d'affaires doit quand même être
      // synchronisé avec les commandes réellement chargées (= même source que
      // la carte overview). On réutilise mergedStats.totalRevenue/Commissions.
      const apiRevenue = (baseData.revenue ?? {}) as Partial<SellerRevenue>
      const apiTotal = Number(apiRevenue.totalRevenue)
      const apiAllTime = Number(apiRevenue.totalRevenueAllTime)
      const fallbackTotal = Number.isFinite(apiTotal) && apiTotal > 0
        ? apiTotal
        : Number.isFinite(apiAllTime) && apiAllTime > 0
          ? apiAllTime
          : Number(mergedStats.totalRevenue ?? 0)
      const apiNet = Number(apiRevenue.netRevenue)
      const fallbackCommissions = (() => {
        const c = Number(apiRevenue.totalCommissions)
        return Number.isFinite(c) && c >= 0 ? c : Number(mergedStats.totalCommissions ?? 0)
      })()
      const fallbackNet = Number.isFinite(apiNet) && apiNet >= 0
        ? apiNet
        : Math.max(0, fallbackTotal - fallbackCommissions)

      const resolvedRevenue: SellerRevenue = {
        ...defaultRevenue,
        ...apiRevenue,
        totalRevenue: fallbackTotal,
        totalRevenueAllTime: fallbackTotal,
        netRevenue: fallbackNet,
        totalCommissions: fallbackCommissions,
        salesEvolution: Array.isArray((baseData.revenue as any)?.salesEvolution)
          ? ((baseData.revenue as any).salesEvolution as any)
          : defaultRevenue.salesEvolution,
        topProducts: Array.isArray((baseData.revenue as any)?.topProducts)
          ? ((baseData.revenue as any).topProducts as any)
          : defaultRevenue.topProducts
      }

      let sellerProfile = (baseData.sellerProfile as SellerProfile | null | undefined) ?? null
      if (!sellerProfile) {
        sellerProfile = await this.resolveSellerProfileForVendor(vendorId, mergedStats)
      }

      return {
        sellerProfile,
        loyaltyPoints: resolvedLoyaltyPoints,
        products: baseData.products ?? [],
        orders,
        revenue: resolvedRevenue,
        pointsData: resolvedPointsData,
        reviews: baseData.reviews ?? [],
        rankings: baseData.rankings ?? [],
        stats: mergedStats,
        unreadMessages: baseData.unreadMessages ?? 0,
        unreadChats: baseData.unreadChats ?? 0,
        notifications,
        messages: baseData.messages ?? []
      }
    } catch (error) {
      console.error('❌ [getSellerDashboardData] échec récupération dashboard vendeur:', error)
      throw error instanceof Error ? error : new Error("Impossible de récupérer les données du tableau de bord vendeur")
    }
  }

  /**
   * Initialise un retour de commande côté vendeur en s'appuyant sur le service super admin.
   */
  static async createSellerOrderReturn(orderId: string, payload: SuperAdminOrderReturnPayload) {
    // Crée un retour via l'API vendor pour éviter d'exiger un token super-admin.
    const accessToken = await this.getAccessToken()
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const resp = await fetch(`/api/vendor/orders/${orderId}/returns`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload ?? {})
    })

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}))
      const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de créer le retour.'
      throw new Error(message)
    }

    const body = await resp.json().catch(() => ({}))
    return this.mapApiOrderToSellerOrder((body as any)?.data)
  }

  /**
   * Ouvre un litige depuis l'espace vendeur en synchronisant avec le back-office.
   */
  static async createSellerOrderDispute(orderId: string, payload: SuperAdminOrderDisputePayload) {
    // Crée un litige côté vendeur (API vendor) pour éviter d'exiger un token super-admin.
    const accessToken = await this.getAccessToken()
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const resp = await fetch('/api/vendor/disputes', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        orderId,
        type: payload?.type,
        subject: payload?.subject ?? null,
        description: payload?.description ?? null,
        priority: payload?.priority ?? null,
        metadata: payload?.metadata ?? {}
      })
    })

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}))
      const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de créer le litige.'
      throw new Error(message)
    }

    const body = await resp.json().catch(() => ({}))
    return (body as any)?.data
  }

  /**
   * Enregistre un paiement vendeur (demande de paiement) via l'API super admin.
   */
  static async createSellerOrderPayment(orderId: string, payload: SuperAdminOrderPaymentPayload) {
    const accessToken = await this.getAccessToken()
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const resp = await fetch('/api/vendor/payments', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        orderId,
        provider: payload?.provider,
        reference: payload?.reference ?? null,
        amount: payload?.amount,
        currency: (payload as any)?.currency ?? null,
        status: (payload as any)?.status ?? 'pending',
        paidAt: (payload as any)?.paidAt ?? null,
        metadata: payload?.metadata ?? {}
      })
    })

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}))
      const message = typeof (body as any)?.error === 'string' ? (body as any).error : 'Impossible de créer la demande de paiement.'
      throw new Error(message)
    }

    const body = await resp.json().catch(() => ({}))
    return this.mapApiOrderToSellerOrder((body as any)?.data)
  }

  private static mapSharedProductToSellerProduct(product: SharedProduct): SellerProduct {
    const rawStatus = String(product.productStatus ?? (product.isActive ? 'active' : 'inactive'))
    const status: SellerProduct['status'] =
      rawStatus === 'active' ||
      rawStatus === 'inactive' ||
      rawStatus === 'draft' ||
      rawStatus === 'out_of_stock' ||
      rawStatus === 'pending_review'
        ? rawStatus
        : product.isActive
          ? 'active'
          : 'inactive'

    const rawType = product.productType ?? 'simple'
    const productType: SellerProduct['productType'] = rawType === 'variable' ? 'variable' : 'simple'

    const primaryMediaPath = product.media?.find((media) => media.isPrimary)?.path ?? null
    const resolvedImage =
      this.resolveMediaUrl(product.mainImage ?? null) ??
      this.resolveMediaUrl(primaryMediaPath) ??
      '/placeholder.jpg'

    const resolvedGallery = (product.galleryImages ?? [])
      .map((item) => this.resolveMediaUrl(item))
      .filter(Boolean) as string[]

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice ?? null,
      costPrice: product.costPrice ?? null,
      originalPrice: product.originalPrice ?? product.price,
      image: resolvedImage,
      category: product.category ?? 'Général',
      stock: product.stockQuantity ?? 0,
      sales: (product.statistics as Record<string, any> | undefined)?.totalSales ?? 0,
      revenue: (product.statistics as Record<string, any> | undefined)?.totalRevenue ?? 0,
      shares: (product.statistics as Record<string, any> | undefined)?.shareCount ?? 0,
      rating: (product.statistics as Record<string, any> | undefined)?.averageRating ?? 0,
      reviews: (product.statistics as Record<string, any> | undefined)?.reviewCount ?? 0,
      status,
      createdAt: product.createdAt ?? '',
      updatedAt: product.updatedAt ?? '',
      description: product.description ?? undefined,
      shortDescription: product.shortDescription ?? null,
      sku: product.sku ?? null,
      images: resolvedGallery,
      tags: product.tags ?? undefined,
      seoTitle: product.seo?.title ?? undefined,
      seoDescription: product.seo?.description ?? undefined,
      metadata: product.metadata ?? null,
      weight: product.shipping?.weight ?? undefined,
      dimensions:
        product.shipping && product.shipping.length && product.shipping.width && product.shipping.height
          ? {
              length: product.shipping.length ?? 0,
              width: product.shipping.width ?? 0,
              height: product.shipping.height ?? 0
            }
          : undefined,
      shippingCost: product.shipping?.shippingCost ?? undefined,
      isShareable: product.marketing?.socialSharing ?? false,
      isPromoted: product.isFeatured ?? false,
      productType,
      variations:
        product.variations?.map((variation) => ({
          id: variation.id ?? '',
          name: variation.name ?? null,
          sku: variation.sku ?? null,
          price: variation.price ?? null,
          salePrice: variation.salePrice ?? null,
          stockQuantity: variation.stockQuantity ?? null,
          attributes: variation.attributes ?? null,
          metadata: variation.metadata ?? null
        })) ?? []
    }
  }

  private static buildSharedProductPayload(
    base: Partial<CreateSellerProductInput>,
    options: { vendorId: string; existing?: SharedProduct | null; id?: string }
  ): SharedProductInput & { id?: string } {
    const { vendorId, existing, id } = options

    const resolvedName = base.name ?? existing?.name
    if (!resolvedName) {
      throw new Error('Le nom du produit est requis.')
    }

    const resolvedPrice = base.price ?? existing?.price
    if (resolvedPrice === undefined) {
      throw new Error('Le prix du produit est requis.')
    }

    const resolvedGallery = base.images ?? existing?.galleryImages ?? []
    const resolvedMainImage = base.mainImage ?? resolvedGallery[0] ?? existing?.mainImage ?? null
    const isFeatured = base.isFeatured ?? base.featured ?? existing?.isFeatured ?? false
    const rawProductStatus = base.status ?? existing?.productStatus ?? (existing?.isActive ? 'active' : 'draft')
    const normalizedStatusValue = String(rawProductStatus)
    const productStatus: ProductStatus =
      normalizedStatusValue === 'active' ||
      normalizedStatusValue === 'inactive' ||
      normalizedStatusValue === 'draft' ||
      normalizedStatusValue === 'pending_review' ||
      normalizedStatusValue === 'archived'
        ? (normalizedStatusValue as ProductStatus)
        : normalizedStatusValue === 'out_of_stock'
          ? 'inactive'
          : 'draft'

    const stockStatus: ProductStockStatus =
      normalizedStatusValue === 'out_of_stock'
        ? 'outofstock'
        : (existing?.stockStatus ?? 'instock')

    const metadataValue = base.metadata !== undefined ? base.metadata ?? undefined : existing?.metadata

    const shipping = {
      weight: base.weight ?? existing?.shipping?.weight,
      length: base.dimensions?.length ?? existing?.shipping?.length,
      width: base.dimensions?.width ?? existing?.shipping?.width,
      height: base.dimensions?.height ?? existing?.shipping?.height,
      shippingClass: existing?.shipping?.shippingClass,
      freeShipping: existing?.shipping?.freeShipping,
      shippingCost: base.costOfShipping ?? existing?.shipping?.shippingCost
    }

    const seo = {
      title: base.seoTitle ?? existing?.seo?.title ?? null,
      description: base.seoDescription ?? existing?.seo?.description ?? null,
      keywords: existing?.seo?.keywords ?? null,
      slug: existing?.seo?.slug ?? null,
      autoGenerate: existing?.seo?.autoGenerate ?? undefined
    }

    const media = base.images
      ? base.images.map((path, index) => ({
          id: `${id ?? existing?.id ?? vendorId}-${index}`,
          path,
          type: 'image' as const,
          isPrimary: index === 0
        }))
      : existing?.media ?? []

    const galleryImages = base.images ?? existing?.galleryImages ?? []

    const payload: SharedProductInput & { id?: string } = {
      ...(existing ?? {}),
      id,
      vendorId,
      source: 'vendor',
      name: resolvedName,
      description: base.description ?? existing?.description ?? null,
      shortDescription: base.shortDescription ?? existing?.shortDescription ?? null,
      sku: base.sku ?? existing?.sku ?? null,
      price: resolvedPrice,
      salePrice: base.salePrice ?? existing?.salePrice ?? null,
      costPrice: base.costPrice ?? existing?.costPrice ?? null,
      originalPrice: base.originalPrice ?? existing?.originalPrice ?? resolvedPrice,
      category: base.category ?? existing?.category ?? null,
      subcategory: base.subcategory ?? existing?.subcategory ?? null,
      categoryIds: existing?.categoryIds ?? [],
      tagIds: existing?.tagIds ?? [],
      tags: base.tags ?? existing?.tags ?? null,
      brand: existing?.brand ?? null,
      stockQuantity: base.stockQuantity ?? existing?.stockQuantity ?? null,
      lowStockThreshold: base.lowStockThreshold ?? existing?.lowStockThreshold ?? null,
      manageStock: base.manageStock ?? existing?.manageStock,
      allowBackorders: base.allowBackorders ?? existing?.allowBackorders,
      productStatus,
      stockStatus,
      isActive: productStatus === 'active',
      productType: base.productType ?? existing?.productType ?? 'simple',
      isVirtual: existing?.isVirtual ?? false,
      isDownloadable: existing?.isDownloadable ?? false,
      isFeatured,
      onSale: base.onSale ?? existing?.onSale ?? Boolean(base.salePrice ?? existing?.salePrice),
      mainImage: resolvedMainImage,
      galleryImages,
      media,
      videos: existing?.videos ?? [],
      attributes: base.attributes ?? existing?.attributes ?? null,
      variations: base.variations ?? existing?.variations ?? [],
      downloadable: existing?.downloadable ?? false,
      downloadableFiles: existing?.downloadableFiles ?? [],
      external: existing?.external ?? false,
      externalUrl: existing?.externalUrl ?? null,
      externalButtonText: existing?.externalButtonText ?? null,
      shipping,
      seo,
      payment: existing?.payment,
      marketing: existing?.marketing,
      promotion: existing?.promotion,
      linkedProducts: existing?.linkedProducts,
      customFields: existing?.customFields,
      metadata: metadataValue,
      // allowBackorders/downloadable déjà définis plus haut dans le payload
    }

    return payload
  }

  /**
   * Charge la liste des produits du vendeur connecté.
   * Utilise l'API vendor (protégée) et ajoute un header Authorization Bearer pour éviter les cas où les cookies ne sont pas disponibles.
   */
  static async getSellerProducts(vendorId: string): Promise<SellerProduct[]> {
    if (!vendorId) {
      return []
    }

    try {
      const accessToken = await this.getAccessToken()

      const resp = await fetch('/api/vendor/products?limit=100&offset=0', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        credentials: 'include',
        cache: 'no-store'
      })

      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        throw new Error(`Chargement produits vendeur impossible (${resp.status}): ${body}`)
      }

      const json = await resp.json().catch(() => ({}))
      const rawItems = (json as any)?.data?.items
      const items = Array.isArray(rawItems) ? rawItems : []

      return items
        .map((item: any) => {
          try {
            return this.mapSharedProductToSellerProduct(item as SharedProduct)
          } catch {
            return null
          }
        })
        .filter(Boolean) as SellerProduct[]
    } catch (error) {
      console.error('❌ [SellerDashboardService] getSellerProducts failed:', error)
      throw error instanceof Error ? error : new Error('Impossible de charger les produits vendeur')
    }
  }

  /**
   * Met à jour un produit vendeur (utilisé pour activer/désactiver, mettre en avant, etc.).
   * Cette méthode reconstruit un payload complet compatible avec l'API `/api/vendor/products`.
   */
  static async updateSellerProduct(payload: UpdateSellerProductInput): Promise<SellerProduct | null> {
    const vendorId = String(payload?.vendorId ?? '').trim()
    const productId = String(payload?.id ?? '').trim()

    if (!vendorId) {
      throw new Error('Identifiant vendeur manquant.')
    }
    if (!productId) {
      throw new Error('Identifiant produit manquant.')
    }

    const existing = await SellerDashboardApi.getProductById(productId).catch(() => null)
    if (!existing) {
      throw new Error('Produit introuvable.')
    }

    const sharedPayload = this.buildSharedProductPayload(payload, {
      vendorId,
      existing,
      id: productId
    })

    const updated = await SellerDashboardApi.updateProduct(sharedPayload as SharedProductInput & { id: string })
    return updated ? this.mapSharedProductToSellerProduct(updated) : null
  }

  /**
   * Supprime un produit du vendeur (API `/api/vendor/products`).
   */
  static async deleteSellerProduct(productId: string, _vendorId?: string): Promise<void> {
    const id = String(productId ?? '').trim()
    if (!id) {
      throw new Error('Identifiant produit manquant.')
    }

    await SellerDashboardApi.deleteProduct(id)
  }

  // Calculer les données de points du vendeur
  /**
   * Récupère et agrège toutes les données liées aux points pour un vendeur spécifique.
   */
  private static async getSellerPointsData(
    vendorId: string,
    loyaltyPoints: LoyaltyPoints | null,
    products: SellerProduct[]
  ): Promise<SellerPointsData> {
    try {
      const formatPoints = (value: number) => new Intl.NumberFormat('fr-FR').format(value)
      const balance = loyaltyPoints?.points_balance || 0
      const isFrozen = Boolean((loyaltyPoints as any)?.is_frozen ?? false)
      const freezeReason = (((loyaltyPoints as any)?.freeze_reason ?? null) as any)?.toString?.() ? String((loyaltyPoints as any)?.freeze_reason) : (loyaltyPoints as any)?.freeze_reason ?? null
      const frozenPoints = isFrozen ? balance : 0
      const totalEarned = loyaltyPoints?.points_earned || 0
      const totalSpent = loyaltyPoints?.points_spent || 0

      const { data: vendorProfileRow } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', vendorId)
        .maybeSingle()

      const vendorProfileId = vendorProfileRow?.id ? String(vendorProfileRow.id) : null

      const { data: historyData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', vendorId)
        .order('created_at', { ascending: false })

      const { data: transferRequestRows } = vendorProfileId
        ? await supabase
            .from('point_transfer_requests')
            .select('*')
            .or(`sender_id.eq.${vendorProfileId},recipient_id.eq.${vendorProfileId}`)
            .order('created_at', { ascending: false })
            .limit(200)
        : { data: [] as any[] }

      const baseHistory: SellerPointsData['history'] = (historyData || []).map((transaction: any) => {
        const rawType = String(transaction.type ?? '').toLowerCase()
        const referenceType = transaction.reference_type ? String(transaction.reference_type).toLowerCase() : ''
        let mappedType = this.mapTransactionType(rawType)
        if (rawType === 'share' || referenceType.includes('share')) {
          mappedType = 'share_bonus'
        }

        const status: SellerPointsData['history'][number]['status'] =
          rawType === 'withdrawal' ? 'pending' : 'completed'

        return {
          id: String(transaction.id),
          type: mappedType,
          amount: Number(transaction.points ?? 0),
          description: String(transaction.description || ''),
          timestamp: String(transaction.created_at || ''),
          status,
          source: transaction.reference_type ? String(transaction.reference_type) : undefined
        }
      })

      const transfers: SellerPointsData['history'] = (transferRequestRows || [])
        .filter(tr => tr && tr.id)
        .filter(tr => (vendorProfileId ? tr.sender_id === vendorProfileId || tr.recipient_id === vendorProfileId : false))
        .filter(tr => {
          const trPoints = Number(tr.points_amount || 0)
          const trCreated = new Date(tr.created_at).getTime()

          return !(historyData || []).some(tx => {
            const txType = String((tx as any).type || '').toLowerCase()
            if (txType !== 'transfer' && txType !== 'transfer_in') return false

            const ref = (tx as any).reference_id
            if (ref && String(ref) === String(tr.id)) return true

            const txPoints = Number((tx as any).points || 0)
            const txCreated = new Date((tx as any).created_at).getTime()
            return txPoints === trPoints && Math.abs(txCreated - trCreated) < 5000
          })
        })
        .map(tr => {
          const isSender = vendorProfileId ? tr.sender_id === vendorProfileId : false
          const recipientName = (tr.metadata as any)?.recipient_name
          const recipientEmail = (tr.metadata as any)?.recipient_email
          const counterparty = recipientName || recipientEmail || 'un utilisateur'

          const statusRaw = String(tr.status || '').toLowerCase()
          const mappedStatus: SellerPointsData['history'][number]['status'] =
            statusRaw === 'failed' || statusRaw === 'rejected'
              ? 'failed'
              : statusRaw === 'pending' || statusRaw === 'approved'
                ? 'pending'
                : 'completed'

          return {
            id: `tr_${tr.id}`,
            type: isSender ? 'transferred' : 'earned',
            amount: Number(tr.points_amount || 0),
            description: isSender ? `Transfert vers ${counterparty}` : 'Transfert reçu',
            timestamp: tr.created_at,
            status: mappedStatus,
            source: 'transfer'
          }
        })

      const history: SellerPointsData['history'] = [...baseHistory, ...transfers]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      const totalTransferred = history
        .filter(item => item.type === 'transferred')
        .reduce((sum, item) => sum + item.amount, 0)

      const { data: withdrawalRequestRows, error: withdrawalReqErr } = await supabase
        .from('point_withdrawal_requests')
        .select('id, status, created_at, points_amount, payout_amount, fee_amount, method_id, metadata')
        .eq('user_id', vendorId)
        .order('created_at', { ascending: false })

      if (withdrawalReqErr) {
        console.warn('⚠️ point_withdrawal_requests lookup failed:', withdrawalReqErr)
      }

      const withdrawalRequests = (withdrawalRequestRows || [])
        .filter((row: any) => row && row.id)
        .map((row: any) => {
          const rawMethod = row.method ?? row.metadata?.method ?? row.metadata?.withdrawal_method
          const method = rawMethod ? String(rawMethod) : null
          const amount = Number(row.points_amount ?? row.amount ?? 0)
          return {
            id: String(row.id),
            amount: Number.isFinite(amount) ? amount : 0,
            method,
            status: String(row.status ?? 'pending'),
            timestamp: String(row.created_at ?? '')
          }
        })

      const pendingRequests = withdrawalRequests.filter(req => String(req.status).toLowerCase() === 'pending').length

      const exchangeHistoryRaw = (historyData || [])
        .filter(item => item.type === 'exchange')
        .map(item => ({
          id: item.id,
          type: 'points_to_xof' as const,
          amount: item.points,
          rate: Number(item.fcfa_value) / Math.max(item.points, 1),
          total: Number(item.fcfa_value),
          timestamp: item.created_at,
          status: 'completed' as const
        }))

      const exchangeHistory = exchangeHistoryRaw.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // vendor_share_stats peut n'avoir aucune ligne pour ce vendeur → `.single()`
      // renverrait 406/PGRST116. On tolère 0 ligne avec maybeSingle.
      const { data: shareStats } = await supabase
        .from('vendor_share_stats')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle()

      // NB: share_interaction_stats est une vue protégée (406 côté client anonyme).
      // On passe par la fonction RPC sécurisée dédiée (auth.uid() = vendeur).
      // NB2: la fonction est « set-returning » — si le vendeur n'a aucune ligne,
      // PostgREST renvoie 406 avec `maybeSingle()` (objet attendu, 0 lignes).
      // On appelle donc SANS maybeSingle et on prend la première ligne du tableau.
      const { data: shareInteractionsRows, error: shareInteractionsErr } = await supabase
        .rpc('share_interaction_stats_for', { p_vendor: vendorId })

      if (shareInteractionsErr) {
        console.warn('⚠️ share_interaction_stats_for RPC failed:', shareInteractionsErr)
      }
      const shareInteractions = Array.isArray(shareInteractionsRows)
        ? (shareInteractionsRows[0] ?? null)
        : ((shareInteractionsRows as any) ?? null)

      const fromDate = new Date()
      fromDate.setMonth(fromDate.getMonth() - 1)

      const { data: productShares } = await supabase
        .from('product_shares')
        .select('product_id, user_id, points_earned, platform, created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      const sharesThisMonth = (productShares || []).filter(share =>
        new Date(share.created_at) >= fromDate
      ).length

      const pointsFromShares = (productShares || []).reduce((total, share) => total + (share.points_earned || 0), 0)

      const productMap = new Map(products.map(product => [product.id.toString(), product]))

      const topSharedProductsMap = new Map<string, {
        id: string
        name: string
        image: string
        shares: number
        points: number
        revenue: number
        isOwnProduct: boolean
      }>()

      ;(productShares || []).forEach(share => {
        const key = share.product_id
        const product = productMap.get(key)
        const existing = topSharedProductsMap.get(key) || {
          id: key,
          name: product?.name || 'Produit partagé',
          image: product?.image || '/placeholder.jpg',
          shares: 0,
          points: 0,
          revenue: product ? product.price * (product.sales || 0) : 0,
          isOwnProduct: !!product
        }

        existing.shares += 1
        existing.points += share.points_earned || 0

        topSharedProductsMap.set(key, existing)
      })

      const topSharedProducts = Array.from(topSharedProductsMap.values())
        .sort((a, b) => b.shares - a.shares)
        .slice(0, 5)

      const socialNetworkAccumulator = (productShares || []).reduce(
        (acc, share) => {
          const platform = String(share.platform || '').toLowerCase() as keyof SellerPointsData['sharesData']['socialNetworkStats']
          if (!acc[platform]) {
            acc[platform] = { shares: 0, points: 0, rewardedShares: 0 }
          }
          acc[platform].shares += 1
          acc[platform].points += Number(share.points_earned ?? 0) || 0
          if (Number(share.points_earned ?? 0) > 0) {
            acc[platform].rewardedShares += 1
          }
          return acc
        },
        {} as Record<string, { shares: number; points: number; rewardedShares: number }>
      )

      const defaultNetworks = {
        facebook: { shares: 0, points: 0, engagement: 0 },
        instagram: { shares: 0, points: 0, engagement: 0 },
        twitter: { shares: 0, points: 0, engagement: 0 },
        whatsapp: { shares: 0, points: 0, engagement: 0 },
        linkedin: { shares: 0, points: 0, engagement: 0 }
      } as SellerPointsData['sharesData']['socialNetworkStats']

      const socialNetworkStats = Object.keys(defaultNetworks).reduce((acc, network) => {
        const key = network as keyof typeof defaultNetworks
        const stats = socialNetworkAccumulator[network]
        const shares = stats?.shares ?? 0
        const rewarded = stats?.rewardedShares ?? 0
        acc[key] = {
          shares,
          points: stats?.points ?? 0,
          engagement: shares > 0 ? Math.round((rewarded / shares) * 100) : 0
        }
        return acc
      }, { ...defaultNetworks })

      const userShareMap = new Map<string, { shares: number; points: number; lastShareAt: string }>()
      ;(productShares || []).forEach((share: any) => {
        const userId = share?.user_id ? String(share.user_id) : ''
        if (!userId) return
        const existing = userShareMap.get(userId) || { shares: 0, points: 0, lastShareAt: '' }
        existing.shares += 1
        existing.points += Number(share.points_earned ?? 0) || 0
        const createdAt = String(share.created_at ?? '')
        if (createdAt && (!existing.lastShareAt || new Date(createdAt) > new Date(existing.lastShareAt))) {
          existing.lastShareAt = createdAt
        }
        userShareMap.set(userId, existing)
      })

      const topShareEntries = Array.from(userShareMap.entries())
        .map(([userId, stats]) => ({ userId, ...stats }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)

      const topShareUserIds = topShareEntries.map((entry) => entry.userId).filter(Boolean)
      const profileNameByUserId = new Map<string, string>()

      if (topShareUserIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', topShareUserIds)

        ;(profileRows || []).forEach((profile: any) => {
          const userId = String(profile.user_id || '')
          if (!userId) return
          const fullName = `${String(profile.first_name || '')} ${String(profile.last_name || '')}`.trim()
          if (fullName) {
            profileNameByUserId.set(userId, fullName)
          }
        })
      }

      const topEarners = topShareEntries.map((entry, index) => ({
        id: entry.userId,
        name: profileNameByUserId.get(entry.userId) || `Utilisateur ${index + 1}`,
        avatar: '/placeholder-user.jpg',
        points: entry.points,
        shares: entry.shares,
        revenue: 0,
        engagementScore: entry.shares,
        favoriteCategories: [],
        lastShareAt: entry.lastShareAt
      }))

      const sharesData = {
        totalShares: shareStats?.total_shares || 0,
        sharesThisMonth,
        pointsFromShares,
        viralScore: shareInteractions?.total_interactions || 0,
        topSharedProducts,
        socialNetworkStats,
        userEngagement: topEarners.map(earner => ({
          id: earner.id,
          name: earner.name,
          avatar: earner.avatar,
          totalShares: earner.shares,
          pointsEarned: earner.points,
          lastShareDate: (earner as any).lastShareAt || '',
          favoriteCategories: earner.favoriteCategories,
          engagementScore: earner.engagementScore
        }))
      }

      const positiveTypes = new Set<SellerPointsData['history'][number]['type']>(['earned', 'bonus', 'share_bonus'])
      const negativeTypes = new Set<SellerPointsData['history'][number]['type']>(['spent', 'transferred', 'exchanged'])

      const today = new Date()
      const recentDays = Array.from({ length: 30 }).map((_, index) => {
        const date = new Date(today)
        date.setDate(today.getDate() - (29 - index))
        const key = date.toISOString().slice(0, 10)
        const label = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        return { key, label }
      })

      const dailyMap = new Map<string, { earned: number; spent: number }>()
      recentDays.forEach(day => {
        dailyMap.set(day.key, { earned: 0, spent: 0 })
      })

      const totalsByType = new Map<SellerPointsData['history'][number]['type'], number>()

      ;(history || []).forEach(item => {
        const mappedType = item.type
        const dateKey = new Date(item.timestamp).toISOString().slice(0, 10)
        const currentDay = dailyMap.get(dateKey)
        if (currentDay) {
          if (positiveTypes.has(mappedType)) {
            currentDay.earned += item.amount
          } else if (negativeTypes.has(mappedType)) {
            currentDay.spent += item.amount
          }
        }
        const currentTotal = totalsByType.get(mappedType) || 0
        totalsByType.set(mappedType, currentTotal + item.amount)
      })

      const dailyNetTotal = Array.from(dailyMap.values()).reduce((sum, day) => sum + (day.earned - day.spent), 0)
      const startingBalance = Math.max(balance - dailyNetTotal, 0)
      let runningBalance = startingBalance

      const balanceTrend = recentDays.map(day => {
        const data = dailyMap.get(day.key) || { earned: 0, spent: 0 }
        runningBalance += data.earned - data.spent
        return {
          date: day.label,
          balance: Math.max(runningBalance, 0),
          earned: data.earned,
          spent: data.spent
        }
      })

      const categoryBreakdown = Array.from(totalsByType.entries()).map(([type, value]) => ({
        type,
        value
      }))

      const lastSevenDays = balanceTrend.slice(-7)
      const previousSevenDays = balanceTrend.slice(-14, -7)
      const lastSevenNet = lastSevenDays.reduce((sum, day) => sum + (day.earned - day.spent), 0)
      const previousSevenNet = previousSevenDays.reduce((sum, day) => sum + (day.earned - day.spent), 0)

      const growthTrend: 'increasing' | 'decreasing' | 'stable' = lastSevenNet > previousSevenNet
        ? 'increasing'
        : lastSevenNet < previousSevenNet
        ? 'decreasing'
        : 'stable'

      const averageDailyNet = balanceTrend.length > 0
        ? balanceTrend.reduce((sum, day) => sum + (day.earned - day.spent), 0) / balanceTrend.length
        : 0

      const nextMonthPrediction = Math.max(Math.round(balance + averageDailyNet * 30), 0)

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

      const settingsDefaults = {
        default_currency: 'FCFA',
        conversion_rate: 1,
        min_balance: 0,
        max_balance: null,
        transfer_enabled: true,
        exchange_enabled: true,
        withdrawal_enabled: true
      }

      const resolvedSettings = settingsRow || (settingsDefaults as unknown as PointSettingsRow)
      const defaultCurrency = resolvedSettings.default_currency || 'FCFA'
      const conversionRateSetting = Number(resolvedSettings.conversion_rate || 1)

      const metadata = (resolvedSettings as any)?.metadata ?? {}
      const bonuses = (metadata?.bonuses ?? {}) as Record<string, unknown>
      const basePointsRaw = Number((bonuses as any)?.basePointsPerFCFA)
      const basePointsPerFCFA = Number.isFinite(basePointsRaw) && basePointsRaw > 0 ? basePointsRaw : 1

      const mapFee = (feeRow: PointOperationFeeRow | null) => ({
        flat: this.toPositive(Number(feeRow?.flat_fee ?? 0)),
        percentage: Number(feeRow?.percentage_fee ?? 0),
        minimum: this.toPositive(Number(feeRow?.minimum_fee ?? 0)),
        maximum: feeRow?.maximum_fee !== undefined && feeRow?.maximum_fee !== null ? this.toPositive(Number(feeRow.maximum_fee)) : null,
        currency: feeRow?.currency || defaultCurrency
      })

      const mapLimit = (limitRow: PointOperationLimitRow | null) => ({
        min: limitRow?.min_amount !== undefined && limitRow?.min_amount !== null ? this.toPositive(Number(limitRow.min_amount)) : 0,
        max: limitRow?.max_amount !== undefined && limitRow?.max_amount !== null ? this.toPositive(Number(limitRow.max_amount)) : null,
        daily: limitRow?.daily_limit !== undefined && limitRow?.daily_limit !== null ? this.toPositive(Number(limitRow.daily_limit)) : null,
        monthly: limitRow?.monthly_limit !== undefined && limitRow?.monthly_limit !== null ? this.toPositive(Number(limitRow.monthly_limit)) : null
      })

      const configuration = {
        settings: {
          defaultCurrency,
          conversionRate: conversionRateSetting,
          minBalance: Number(resolvedSettings.min_balance ?? 0),
          maxBalance: resolvedSettings.max_balance !== undefined && resolvedSettings.max_balance !== null ? Number(resolvedSettings.max_balance) : null,
          transferEnabled: resolvedSettings.transfer_enabled ?? true,
          exchangeEnabled: resolvedSettings.exchange_enabled ?? true,
          withdrawalEnabled: resolvedSettings.withdrawal_enabled ?? true,
          withdrawalValue: (resolvedSettings.metadata?.conversion?.withdrawalValue as number | undefined) ?? 1,
          basePointsPerFCFA
        },
        fees: {
          transfer: mapFee(transferFeeRow),
          exchange: mapFee(exchangeFeeRow),
          withdrawal: mapFee(withdrawalFeeRow)
        },
        limits: {
          transfer: mapLimit(transferLimitRow),
          exchange: mapLimit(exchangeLimitRow),
          withdrawal: mapLimit(withdrawalLimitRow)
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

      const recommendedActions: string[] = []
      if ((sharesData.sharesThisMonth || 0) < 10) {
        recommendedActions.push('Renforcez vos partages ce mois-ci pour augmenter vos gains de points')
      }

      const shareRewardRate =
        (sharesData.totalShares || 0) > 0
          ? Math.round(((sharesData.pointsFromShares || 0) / (sharesData.totalShares || 1)) * 100)
          : 100

      if (shareRewardRate < 5) {
        recommendedActions.push('Optimisez vos appels à l’action sur vos liens partagés pour améliorer le taux de conversion')
      }
      if (pendingRequests > 0) {
        recommendedActions.push('Suivez vos demandes de retrait en attente pour sécuriser vos fonds')
      }

      const sortedNetworks = Object.entries(sharesData.socialNetworkStats).sort((a, b) => b[1].points - a[1].points)
      if (sortedNetworks.length > 0) {
        const [topNetwork, stats] = sortedNetworks[0]
        recommendedActions.push(`Capitalisez sur ${topNetwork} où vous gagnez déjà ${formatPoints(stats.points)} points`)
      }

      const marketOpportunities = topSharedProducts.slice(0, 3).map(product => ({
        category: product.name,
        potentialPoints: product.points,
        difficulty: product.isOwnProduct ? ('medium' as const) : ('low' as const)
      }))

      const latestExchange = exchangeHistory[0]
      const exchangeRate = latestExchange
        ? latestExchange.total / Math.max(latestExchange.amount, 1)
        : 1

      return {
        balance,
        isFallback: false,
        isFrozen,
        freezeReason: freezeReason ? String(freezeReason) : null,
        frozenPoints,
        totalEarned,
        totalSpent,
        totalTransferred,
        conversionRate: conversionRateSetting,
        exchangeRate,
        pendingRequests,
        withdrawalRequests,
        sharesData,
        overview: {
          balanceTrend,
          categoryBreakdown
        },
        history,
        topEarners,
        exchangeHistory,
        predictiveAnalytics: {
          nextMonthPrediction,
          growthTrend,
          recommendedActions,
          marketOpportunities
        },
        configuration
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données points vendeur:', error)

      const defaultConfiguration = {
        settings: {
          defaultCurrency: 'FCFA',
          conversionRate: 1,
          minBalance: 0,
          maxBalance: null,
          transferEnabled: true,
          exchangeEnabled: true,
          withdrawalEnabled: true,
          withdrawalValue: 1
        },
        fees: {
          transfer: { flat: 0, percentage: 0, minimum: 0, maximum: null, currency: 'FCFA' },
          exchange: { flat: 0, percentage: 0, minimum: 0, maximum: null, currency: 'FCFA' },
          withdrawal: { flat: 0, percentage: 0, minimum: 0, maximum: null, currency: 'FCFA' }
        },
        limits: {
          transfer: { min: 0, max: null, daily: null, monthly: null },
          exchange: { min: 0, max: null, daily: null, monthly: null },
          withdrawal: { min: 0, max: null, daily: null, monthly: null }
        },
        exchangeRates: [],
        withdrawalMethods: []
      }

      return {
        balance: loyaltyPoints?.points_balance || 0,
        isFallback: true,
        isFrozen: Boolean((loyaltyPoints as any)?.is_frozen ?? false),
        freezeReason: ((loyaltyPoints as any)?.freeze_reason ?? null) as string | null,
        frozenPoints: Boolean((loyaltyPoints as any)?.is_frozen ?? false) ? (loyaltyPoints?.points_balance || 0) : 0,
        totalEarned: loyaltyPoints?.points_earned || 0,
        totalSpent: loyaltyPoints?.points_spent || 0,
        totalTransferred: 0,
        conversionRate: 0,
        exchangeRate: 1,
        pendingRequests: 0,
        withdrawalRequests: [],
        sharesData: {
          totalShares: 0,
          sharesThisMonth: 0,
          pointsFromShares: 0,
          viralScore: 0,
          topSharedProducts: [],
          socialNetworkStats: {
            facebook: { shares: 0, points: 0, engagement: 0 },
            instagram: { shares: 0, points: 0, engagement: 0 },
            twitter: { shares: 0, points: 0, engagement: 0 },
            whatsapp: { shares: 0, points: 0, engagement: 0 },
            linkedin: { shares: 0, points: 0, engagement: 0 }
          },
          userEngagement: []
        },
        overview: {
          balanceTrend: [],
          categoryBreakdown: []
        },
        history: [],
        topEarners: [],
        exchangeHistory: [],
        predictiveAnalytics: {
          nextMonthPrediction: 0,
          growthTrend: 'stable',
          recommendedActions: [],
          marketOpportunities: []
        },
        configuration: defaultConfiguration
      }
    }
  }

  /**
   * Normalise les types de transactions Supabase vers les types attendus par l'interface UI.
   */
  private static mapTransactionType(type: string): SellerPointsData['history'][number]['type'] {
    switch (type) {
      case 'earn':
        return 'earned'
      case 'share':
        return 'share_bonus'
      case 'spend':
        return 'spent'
      case 'transfer':
        return 'transferred'
      case 'transfer_in':
        return 'earned'
      case 'exchange':
      case 'reward_redemption':
        return 'exchanged'
      case 'bonus':
      case 'reward':
        return 'bonus'
      case 'withdrawal':
      case 'transfer_fee':
      case 'exchange_fee':
      case 'withdrawal_fee':
        return 'spent'
      default:
        return 'earned'
    }
  }

  /**
   * Récupère la configuration de points pour le vendeur en privilégiant la portée « vendor » puis « global ».
   */
  private static async getPointSettings(): Promise<PointSettingsRow | null> {
    try {
      for (const scope of ['vendor', 'global'] as const) {
        const { data, error } = await supabase
          .from('point_settings')
          .select('*')
          .eq('scope', scope)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          return data as unknown as PointSettingsRow
        }
      }

      return null
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des paramètres de points vendeur:', error)
      return null
    }
  }

  /**
   * Transfère des points d'un vendeur vers un autre utilisateur.
   */
  static async transferPoints(
    vendorId: string,
    recipientId: string,
    amount: number,
    message?: string
  ): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error('Le montant du transfert doit être positif')
      }
      if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
        throw new Error('Le montant du transfert doit être un entier')
      }
      if (vendorId === recipientId) {
        throw new Error('Impossible de se transférer des points à soi-même')
      }

      const [loyalty, recipient, settings, fee, limits, senderProfileRow] = await Promise.all([
        supabase
          .from('loyalty_points')
          .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
          .eq('user_id', vendorId)
          .single(),
        this.getEligibleUserProfile(recipientId),
        this.getPointSettings(),
        this.getOperationFee('transfer'),
        this.getOperationLimit('transfer'),
        supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', vendorId)
          .maybeSingle()
      ])

      if (!loyalty.data) {
        throw new Error('Compte de points introuvable')
      }

      this.assertNotFrozen(loyalty.data, 'transfert')
      if (!recipient) {
        throw new Error('Destinataire introuvable ou non autorisé')
      }

      if (recipient.userId === vendorId) {
        throw new Error('Impossible de se transférer des points à soi-même')
      }

      if (senderProfileRow?.error) {
        throw senderProfileRow.error
      }

      const senderProfileId = senderProfileRow?.data?.id ? String(senderProfileRow.data.id) : null
      if (!senderProfileId) {
        throw new Error('Profil expéditeur introuvable')
      }

      const currentBalance = loyalty.data.points_balance || 0
      const feeAmount = this.calculateFee(amount, fee)
      const totalDebited = amount + feeAmount
      this.ensureLimits(totalDebited, limits, 'montant de transfert')
      await this.ensurePeriodLimits(vendorId, totalDebited, limits, ['transfer', 'transfer_fee'], 'transfert')

      if (totalDebited > currentBalance) {
        throw new Error('Solde insuffisant pour effectuer le transfert')
      }

      if (settings && settings.transfer_enabled === false) {
        throw new Error('Les transferts de points sont temporairement désactivés')
      }

      const conversionRate = settings?.conversion_rate || 1
      const currency = settings?.default_currency || 'FCFA'

      const nowIso = new Date().toISOString()

      const { error } = await supabase.rpc('transfer_points_between_users', {
        p_sender_id: vendorId,
        p_recipient_id: recipientId,
        p_points: amount
      })

      if (error) {
        throw new Error(error.message)
      }

      const { data: loyaltyAfterRpc, error: loyaltyAfterRpcErr } = await supabase
        .from('loyalty_points')
        .select('points_balance, points_spent, fcfa_value')
        .eq('user_id', vendorId)
        .single()

      if (loyaltyAfterRpcErr || !loyaltyAfterRpc) {
        throw loyaltyAfterRpcErr || new Error("Impossible de relire le solde après transfert")
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
        .eq('user_id', vendorId)

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
            recipient_name: recipient.fullName,
            message: message?.trim() ? message.trim() : null
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
          .eq('user_id', vendorId)
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
              user_id: vendorId,
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

        if (feeAmount > 0) {
          const { data: existingFee } = await supabase
            .from('point_transactions')
            .select('id, reference_id')
            .eq('user_id', vendorId)
            .eq('type', 'transfer_fee')
            .eq('reference_id', transferRequestId)
            .limit(1)
            .maybeSingle()

          if (!existingFee) {
            await supabase
              .from('point_transactions')
              .insert({
                user_id: vendorId,
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
            user_id: vendorId,
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
   * Recherche des utilisateurs par nom, email, téléphone ou ID.
   */
  static async searchUsers(query: string): Promise<SearchUserResult[]> {
    if (!query.trim()) {
      return []
    }

    let debugFilters: string[] = []

    try {
      const normalizedQuery = query.trim()
      const escapeValue = (value: string) => value.replace(/,/g, '').replace(/'/g, "''")

      const sanitizedDigits = normalizedQuery.replace(/[^\d+]/g, '')
      const isUuid = /^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}$/.test(normalizedQuery)

      const userFilters = [`email.ilike.%${escapeValue(normalizedQuery)}%`]
      if (isUuid) {
        userFilters.push(`id.eq.${normalizedQuery}`)
      }

      const usersById = new Map<string, { id: string; email: string; role?: string }>()
      if (userFilters.length > 0) {
        const { data: userRows, error: usersError } = await supabase
          .from('users')
          .select('id, email, role')
          .or(userFilters.join(','))
          .limit(25)

        if (usersError) {
          throw usersError
        }

        ;(userRows || []).forEach(user => {
          usersById.set(user.id, { id: user.id, email: user.email, role: user.role })
        })
      }

      const emailMatchedIds = Array.from(usersById.keys())

      const profileFilters = [
        `first_name.ilike.%${escapeValue(normalizedQuery)}%`,
        `last_name.ilike.%${escapeValue(normalizedQuery)}%`
      ]

      if (sanitizedDigits.length >= 3) {
        profileFilters.push(`phone.ilike.%${sanitizedDigits}%`)
      }

      if (isUuid) {
        profileFilters.push(`id.eq.${normalizedQuery}`)
        profileFilters.push(`user_id.eq.${normalizedQuery}`)
      }

      if (emailMatchedIds.length > 0) {
        profileFilters.push(`user_id.in.(${emailMatchedIds.join(',')})`)
      }

      debugFilters = [...profileFilters]

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name, phone, short_code')
        .or(profileFilters.join(','))
        .limit(10)

      if (error) {
        throw error
      }

      const filtered = Array.isArray(data) ? data : []

      const missingUserIds = filtered
        .map((user: any) => String(user.user_id))
        .filter((userId: string) => Boolean(userId) && !usersById.has(userId))

      if (missingUserIds.length > 0) {
        const { data: additionalUsers, error: additionalUsersError } = await supabase
          .from('users')
          .select('id, email, role')
          .in('id', missingUserIds)

        if (additionalUsersError) {
          throw additionalUsersError
        }

        ;(additionalUsers || []).forEach(user => {
          usersById.set(user.id, { id: user.id, email: user.email, role: user.role })
        })
      }

      return filtered.map((user: any) => {
        const shortCode = (user as { short_code?: string | null }).short_code || null
        return {
          id: String(user.id),
          fullName: `${String(user.first_name || '')} ${String(user.last_name || '')}`.trim()
            || usersById.get(String(user.user_id))?.email
            || String(user.phone || '')
            || `Profil ${String(user.id).slice(0, 8)}`,
          email: usersById.get(String(user.user_id))?.email || '',
          phone: user.phone ?? null,
          username: null,
          shortCode
        }
      })
    } catch (error) {
      const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string }
      console.error('❌ [searchUsers] erreur détaillée:', {
        query,
        filters: debugFilters,
        message: supabaseError?.message,
        code: supabaseError?.code,
        details: supabaseError?.details,
        hint: supabaseError?.hint
      })
      this.handleSupabaseError(error, 'searchUsers')
      const message = supabaseError?.message || "Erreur lors de la recherche d'utilisateurs"
      throw supabaseError?.message ? new Error(message) : error instanceof Error ? error : new Error(message)
    }
  }

  static async exchangePoints(
    vendorId: string,
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error("Le montant de l'échange doit être positif")
      }

      const [loyalty, settings, fee, limits, rateRow] = await Promise.all([
        supabase
          .from('loyalty_points')
          .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
          .eq('user_id', vendorId)
          .single(),
        this.getPointSettings(),
        this.getOperationFee('exchange'),
        this.getOperationLimit('exchange'),
        this.getExchangeRate(toCurrency)
      ])

      if (!loyalty.data) {
        throw new Error('Compte de points introuvable')
      }

      this.assertNotFrozen(loyalty.data, 'échange')

      if (!rateRow) {
        throw new Error('Aucun taux de change disponible pour la devise sélectionnée')
      }

      const currentBalance = loyalty.data.points_balance || 0
      const feeAmount = this.calculateFee(amount, fee)
      const totalDebited = amount + feeAmount
      this.ensureLimits(totalDebited, limits, "montant d'échange")
      await this.ensurePeriodLimits(
        vendorId,
        totalDebited,
        limits,
        ['exchange', 'exchange_fee', 'reward_redemption'],
        'échange'
      )

      if (totalDebited > currentBalance) {
        throw new Error("Solde insuffisant pour effectuer l'échange")
      }

      if (settings && settings.exchange_enabled === false) {
        throw new Error("Les échanges de points sont temporairement désactivés")
      }

      const conversionRate = settings?.conversion_rate || 1
      const convertedAmount = Number((amount * rateRow.rate).toFixed(2))

      const { data: exchangeRow, error: exchangeErr } = await supabase
        .from('point_exchange_history')
        .insert({
          user_id: vendorId,
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

      await supabase
        .from('point_transactions')
        .insert([
          {
            user_id: vendorId,
            type: 'exchange',
            points: amount,
            fcfa_value: Number((amount * conversionRate).toFixed(2)),
            description: `Échange ${fromCurrency} ➝ ${toCurrency}`,
            reference_id: exchangeId
          },
          ...(feeAmount > 0
            ? [
                {
                  user_id: vendorId,
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
        .eq('user_id', vendorId)
    } catch (error) {
      this.handleSupabaseError(error, 'exchangePoints')
      throw error instanceof Error ? error : new Error("Erreur inattendue lors de l'échange de points")
    }
  }

  /**
   * Crée une demande de retrait de points pour le vendeur.
  */
  static async requestPointsWithdrawal(
    vendorId: string,
    amount: number,
    method: string,
    phoneNumber?: string
  ): Promise<void> {
    try {
      if (amount <= 0) {
        throw new Error('Le montant du retrait doit être positif')
      }

      const [loyalty, settings, fee, limits, withdrawalMethod] = await Promise.all([
        supabase
          .from('loyalty_points')
          .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
          .eq('user_id', vendorId)
          .single(),
        this.getPointSettings(),
        this.getOperationFee('withdrawal'),
        this.getOperationLimit('withdrawal'),
        supabase
          .from('point_withdrawal_methods')
          .select('*')
          .eq('name', method)
          .limit(1)
      ])

      if (!loyalty.data) {
        throw new Error('Compte de points introuvable')
      }

      this.assertNotFrozen(loyalty.data, 'retrait')

      const methodRow = (withdrawalMethod.data || [])[0] as PointWithdrawalMethodRow | undefined
      if (!methodRow) {
        throw new Error('Méthode de retrait introuvable')
      }

      const currency = settings?.default_currency || 'FCFA'

      const { data: methodLimits, error: limitError } = await supabase
        .from('point_withdrawal_method_limits')
        .select('*')
        .eq('method_id', methodRow.id)
        .eq('currency', currency)
        .limit(1)

      if (limitError) {
        throw limitError
      }

      const limitRow = methodLimits?.[0] as PointWithdrawalMethodLimitRow | undefined

      if (settings && settings.withdrawal_enabled === false) {
        throw new Error('Les retraits de points sont temporairement désactivés')
      }

      const currentBalance = loyalty.data.points_balance || 0
      const feeAmount = this.calculateFee(amount, fee)
      const totalDebited = amount + feeAmount

      this.ensureLimits(amount, limits, 'montant de retrait')
      await this.ensurePeriodLimits(
        vendorId,
        totalDebited,
        limits,
        ['withdrawal', 'withdrawal_fee'],
        'retrait'
      )

      if (limitRow) {
        if (limitRow.min_amount !== null && limitRow.min_amount !== undefined && amount < limitRow.min_amount) {
          throw new Error(`Le montant de retrait doit être supérieur ou égal à ${limitRow.min_amount}`)
        }
        if (limitRow.max_amount !== null && limitRow.max_amount !== undefined && amount > limitRow.max_amount) {
          throw new Error(`Le montant de retrait ne peut pas dépasser ${limitRow.max_amount}`)
        }
      }

      if (totalDebited > currentBalance) {
        throw new Error('Solde insuffisant pour effectuer le retrait')
      }

      const conversionRate = settings?.conversion_rate || 1
      const payoutAmount = Number((amount * conversionRate).toFixed(2))

      const { data: withdrawalRequest, error } = await supabase
        .from('point_withdrawal_requests')
        .insert({
          user_id: vendorId,
          method_id: methodRow.id,
          points_amount: amount,
          payout_amount: payoutAmount,
          fee_amount: feeAmount,
          currency,
          status: 'pending',
          metadata: {
            conversion_rate: conversionRate,
            method,
            phone_number: phoneNumber?.trim() ? phoneNumber.trim() : null
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
            user_id: vendorId,
            type: 'withdrawal',
            points: amount,
            fcfa_value: payoutAmount,
            description: `Demande de retrait via ${method}`,
            reference_id: withdrawalRequest.id
          },
          ...(feeAmount > 0
            ? [
                {
                  user_id: vendorId,
                  type: 'withdrawal_fee',
                  points: feeAmount,
                  fcfa_value: Number((feeAmount * conversionRate).toFixed(2)),
                  description: `Frais de retrait via ${method}`,
                  reference_id: withdrawalRequest.id
                }
              ]
            : [])
        ])

      await supabase
        .from('loyalty_points')
        .update({
          points_balance: this.toPositive(currentBalance - totalDebited),
          points_spent: this.toPositive((loyalty.data.points_spent || 0) + totalDebited),
          fcfa_value: this.toPositive((loyalty.data.fcfa_value || 0) - (totalDebited * conversionRate))
        })
        .eq('user_id', vendorId)
    } catch (error) {
      this.handleSupabaseError(error, 'requestPointsWithdrawal')
      throw error instanceof Error ? error : new Error('Erreur inattendue lors de la demande de retrait')
    }
  }

  /**
   * Journalise les erreurs Supabase avec un maximum de contexte utile.
   */
  private static handleSupabaseError(error: unknown, context: string): void {
    const isObject = typeof error === 'object' && error !== null
    const supabaseError = isObject
      ? (error as { message?: string; code?: string; details?: string | null; hint?: string | null })
      : null

    const message = error instanceof Error
      ? error.message
      : supabaseError?.message || 'Erreur Supabase inconnue'

    const detailsPayload = supabaseError
      ? {
          code: supabaseError.code ?? null,
          details: supabaseError.details ?? null,
          hint: supabaseError.hint ?? null
        }
      : error

    console.error(`❌ [SellerDashboardService:${context}] ${message}`, detailsPayload)
  }

  /**
   * Met à jour le profil du vendeur.
   */
  static async updateSellerProfile(vendorId: string, updates: Partial<SellerProfile>): Promise<void> {
    try {
      if (!vendorId) throw new Error('Identifiant vendeur manquant.')

      const { data: current, error: loadError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .maybeSingle()

      if (loadError) throw loadError

      const currentProfile = current as UserProfile
      const currentPrefs = typeof currentProfile?.preferences === 'object' ? (currentProfile.preferences as any) : {}
      const currentSocial = typeof currentProfile?.social_media === 'object' ? (currentProfile.social_media as any) : {}

      // Préparer les mises à jour pour user_profiles
      const profileUpdates: any = {}

      if (updates.name) {
        const names = updates.name.split(' ')
        profileUpdates.first_name = names[0] || ''
        profileUpdates.last_name = names.slice(1).join(' ') || ''
      }

      if (updates.phone !== undefined) profileUpdates.phone = updates.phone
      if (updates.bio !== undefined) profileUpdates.bio = updates.bio
      if (updates.website !== undefined) profileUpdates.website = updates.website
      if (updates.avatar !== undefined) profileUpdates.avatar_url = updates.avatar

      if (updates.address) {
        if (updates.address.street !== undefined) profileUpdates.address = updates.address.street
        if (updates.address.city !== undefined) profileUpdates.city = updates.address.city
        if (updates.address.country !== undefined) profileUpdates.country = updates.address.country
        if (updates.address.postalCode !== undefined) profileUpdates.postal_code = updates.address.postalCode
        
        // Stocker l'état/région dans les préférences car il n'y a pas de colonne dédiée
        if (updates.address.state !== undefined) {
          const nextPrefs = typeof profileUpdates.preferences === 'object' 
            ? { ...profileUpdates.preferences } 
            : typeof currentPrefs === 'object' ? { ...currentPrefs } : {}
          nextPrefs.address_state = updates.address.state
          profileUpdates.preferences = nextPrefs
        }
      }

      // Fusionner les réseaux sociaux
      if (updates.socialMedia) {
        profileUpdates.social_media = {
          ...currentSocial,
          ...updates.socialMedia
        }
      }

      // Fusionner les préférences
      if (updates.preferences || updates.company) {
        const nextPrefs = { ...currentPrefs }
        
        if (updates.company !== undefined) {
          nextPrefs.company = updates.company
          nextPrefs.business_name = updates.company
        }

        if (updates.preferences) {
          const uiPrefs = typeof nextPrefs.ui === 'object' ? { ...nextPrefs.ui } : {}
          
          if (updates.preferences.theme) {
            nextPrefs.theme = updates.preferences.theme
            uiPrefs.theme = updates.preferences.theme
          }
          if (updates.preferences.language) {
            nextPrefs.language = updates.preferences.language
            uiPrefs.language = updates.preferences.language
          }
          if (updates.preferences.currency) {
            nextPrefs.currency = updates.preferences.currency
            uiPrefs.currency = updates.preferences.currency
          }
          if (updates.preferences.timezone) {
            nextPrefs.timezone = updates.preferences.timezone
            uiPrefs.timezone = updates.preferences.timezone
          }
          if (updates.preferences.notifications) {
            nextPrefs.notifications = {
              ...(nextPrefs.notifications || {}),
              ...updates.preferences.notifications
            }
            uiPrefs.notifications = nextPrefs.notifications
          }
          
          nextPrefs.ui = uiPrefs
        }
        
        profileUpdates.preferences = nextPrefs
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('user_id', vendorId)

      if (updateError) throw updateError

    } catch (error) {
      this.handleSupabaseError(error, 'updateSellerProfile')
      throw error
    }
  }

  /**
   * Change le mot de passe du vendeur.
   */
  static async changePassword(password: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    } catch (error) {
      this.handleSupabaseError(error, 'changePassword')
      throw error
    }
  }

  /**
   * Active ou désactive la double authentification.
   * Source principale : `user_security_settings` (partagée avec le super admin).
   * Miroir conservé dans `user_profiles.preferences.security` pour compatibilité UI.
   */
  static async toggleTwoFactor(vendorId: string, enabled: boolean): Promise<void> {
    try {
      // 1. Source de vérité partagée : user_security_settings (upsert).
      const { error: securityError } = await supabase
        .from('user_security_settings')
        .upsert(
          { user_id: vendorId, two_factor_enabled: enabled },
          { onConflict: 'user_id' }
        )
      if (securityError) {
        // Table pas encore créée (migration non appliquée) : on continue avec le miroir.
        console.warn('toggleTwoFactor: user_security_settings indisponible, miroir preferences seul.', securityError.message)
      }

      // 2. Miroir dans les préférences du profil (lecture-modification-écriture).
      const { data: current, error: loadError } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', vendorId)
        .maybeSingle()

      if (loadError) throw loadError

      const prefs = typeof (current as any)?.preferences === 'object' ? { ...(current as any).preferences } : {}
      const security = typeof prefs.security === 'object' ? { ...prefs.security } : {}
      security.two_factor_enabled = enabled

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ preferences: { ...prefs, security } } as any)
        .eq('user_id', vendorId)

      if (updateError) throw updateError
    } catch (error) {
      this.handleSupabaseError(error, 'toggleTwoFactor')
      throw error
    }
  }

  /**
   * Récupère les sessions actives du vendeur.
   */
  static async getActiveSessions(vendorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleSupabaseError(error, 'getActiveSessions')
      return []
    }
  }

  /**
   * Termine une session spécifique.
   */
  static async terminateSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false } as any)
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      this.handleSupabaseError(error, 'terminateSession')
      throw error
    }
  }

  /**
   * Termine toutes les sessions actives d'un vendeur sauf une éventuelle session spécifique.
   */
  static async terminateAllOtherSessions(vendorId: string, currentSessionId?: string): Promise<void> {
    try {
      let query = supabase
        .from('user_sessions')
        .update({ is_active: false } as any)
        .eq('user_id', vendorId)
      
      if (currentSessionId) {
        query = query.neq('id', currentSessionId)
      }

      const { error } = await query
      if (error) throw error
    } catch (error) {
      this.handleSupabaseError(error, 'terminateAllOtherSessions')
      throw error
    }
  }

  /**
   * Upload un avatar ou un document de vérification via l'API sécurisée.
   */
  static async uploadDocument(vendorId: string, file: File, type: string): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      
      const response = await fetch('/api/vendor/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du téléchargement du fichier.')
      }
      
      return result.data.publicUrl
    } catch (error) {
      this.handleSupabaseError(error, 'uploadDocument')
      throw error
    }
  }

  /**
   * Demande la suppression du compte.
   */
  static async deleteAccountRequest(vendorId: string, reason: string): Promise<void> {
    try {
      // Log l'action dans activity_logs
      await supabase.from('activity_logs').insert({
        user_id: vendorId,
        action: 'account_deletion_request',
        entity_type: 'user',
        entity_id: vendorId,
        details: { reason }
      })

      // On pourrait aussi marquer l'utilisateur comme "pending_deletion"
      // ou envoyer un email à l'admin
    } catch (error) {
      this.handleSupabaseError(error, 'deleteAccountRequest')
      throw error
    }
  }
}

import { useState, useEffect, useRef, useCallback } from 'react'

// Hook personnalisé pour utiliser le service tableau de bord vendeur
export const useSellerDashboardData = (vendorId: string | null, options?: { skip?: boolean }) => {
  const [data, setData] = useState<SellerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef<SellerDashboardData | null>(null)

  const skip = Boolean(options?.skip)

  const refreshData = useCallback(async () => {
    if (!vendorId || skip) return

    try {
      // Ne pas bloquer l'UI si on a déjà des données en cache (stale-while-revalidate).
      if (!dataRef.current) {
        setLoading(true)
      }
      setError(null)
      const dashboardData = await SellerDashboardService.getSellerDashboardData(vendorId)
      dataRef.current = dashboardData
      setData(dashboardData)

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`sellerDashboardData:${vendorId}`, JSON.stringify(dashboardData))
        }
      } catch {
        // ignore storage errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
      console.error('❌ Erreur lors du rafraîchissement:', err)
    } finally {
      setLoading(false)
    }
  }, [skip, vendorId])

  useEffect(() => {
    if (!vendorId || skip) {
      setData(null)
      dataRef.current = null
      setLoading(false)
      return
    }

    // 1) Hydrate immédiatement depuis le cache (si dispo) pour supprimer le "retard" perçu.
    try {
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem(`sellerDashboardData:${vendorId}`)
        if (raw) {
          const cached = JSON.parse(raw) as SellerDashboardData
          dataRef.current = cached
          setData(cached)
          setLoading(false)
        }
      }
    } catch {
      // ignore cache parse errors
    }

    const fetchData = async () => {
      try {
        if (!dataRef.current) {
          setLoading(true)
        }
        setError(null)
        const dashboardData = await SellerDashboardService.getSellerDashboardData(vendorId)
        dataRef.current = dashboardData
        setData(dashboardData)

        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`sellerDashboardData:${vendorId}`, JSON.stringify(dashboardData))
          }
        } catch {
          // ignore storage errors
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inattendue')
        console.error('❌ Erreur dans useSellerDashboardData:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [skip, vendorId])

  /**
   * Rafraîchit automatiquement les données du dashboard vendeur quand la configuration points
   * (settings/frais/limites) est modifiée côté Super Admin.
   */
  useEffect(() => {
    if (!vendorId || skip) {
      return
    }

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      refreshTimerRef.current = setTimeout(() => {
        void refreshData()
      }, 500)
    }

    const channel = supabase
      .channel('seller-points-config')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_settings' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_operation_limits' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_operation_fees' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        scheduleRefresh
      )
      .subscribe()

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      void supabase.removeChannel(channel)
    }
  }, [refreshData, skip, vendorId])

  return { data, loading, error, refreshData }
}
