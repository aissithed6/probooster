import { useEffect, useState } from 'react'
import { ClientPointsService, ClientPointsConfiguration, ClientPointsSummary } from '@/lib/services/client-points-service'
import { ClientAuthService } from '@/lib/services/client-auth-service'
import { InternalMessagingService } from '@/lib/services/internal-messaging-service'
import { supabase, type Tables, type Views } from '@/lib/supabase'

/**
 * Calcule un libellé lisible pour un profil (vendeur/partenaire chat).
 */
function computeProfileDisplayName(profile: any, fallbackId: string): string {
  const first = typeof profile?.first_name === 'string' ? String(profile.first_name).trim() : ''
  const last = typeof profile?.last_name === 'string' ? String(profile.last_name).trim() : ''
  const full = [first, last].filter(Boolean).join(' ').trim()
  if (full) return full

  const prefs = profile?.preferences && typeof profile.preferences === 'object' && !Array.isArray(profile.preferences)
    ? (profile.preferences as any)
    : null
  const vendorPublic = prefs?.vendor_public && typeof prefs.vendor_public === 'object' && !Array.isArray(prefs.vendor_public)
    ? (prefs.vendor_public as any)
    : null
  const shopName = typeof vendorPublic?.shop_name === 'string' ? String(vendorPublic.shop_name).trim() : ''
  if (shopName) return shopName

  const shortCode = typeof profile?.short_code === 'string' ? String(profile.short_code).trim() : ''
  if (shortCode) return shortCode

  return fallbackId ? `Contact ${fallbackId.slice(0, 8)}` : 'Contact inconnu'
}

/**
 * Fallback display name basé sur la table users.
 */
function computeUserDisplayName(user: any, fallbackId: string): string {
  const name = typeof user?.name === 'string' ? String(user.name).trim() : ''
  if (name) return name
  const email = typeof user?.email === 'string' ? String(user.email).trim() : ''
  if (email) return email.split('@')[0]
  return fallbackId ? `Contact ${fallbackId.slice(0, 8)}` : 'Contact inconnu'
}

function extractRecommendationKeyId(value: any): string {
  const s = typeof value === 'string' ? value.trim() : String(value ?? '').trim()
  if (!s) return ''
  const idx = s.indexOf(':')
  if (idx === -1) return ''
  return s.slice(idx + 1).trim()
}

function extractRecommendationKeyFromRow(row: any): string {
  const title = typeof row?.title === 'string' ? row.title.trim() : ''
  if (title && title.includes(':')) return title

  const reason = typeof row?.ai_reason === 'string' ? row.ai_reason.trim() : ''
  const m = reason.match(/^\s*([a-z]+:[^|\s]+)\s*\|\|\s*/i)
  if (m?.[1]) return String(m[1]).trim()

  return ''
}

function stripEncodedKeyFromReason(value: any): string {
  const reason = typeof value === 'string' ? value.trim() : String(value ?? '').trim()
  if (!reason) return ''
  return reason.replace(/^\s*[a-z]+:[^|\s]+\s*\|\|\s*/i, '').trim()
}

export interface DashboardData {
  user: Tables<'users'> | null
  userProfile: Tables<'user_profiles'> | null
  loyaltyPoints: Tables<'loyalty_points'> | null
  userStats: Views<'user_stats'> | null
  vendorStats: Views<'vendor_stats'> | null
  orders: UserOrderWithItems[]
  totalOrders: number
  totalRevenue: number
  messages: UserMessage[]
  notifications: UserNotification[]
  unreadMessages: number
  unreadNotifications: number
  chats: UserChat[]
  chatMessages: ChatMessage[]
  products: UserProduct[]
  promotions: Promotion[]
  reviews: ProductReview[]
  cartItems: UserCartItem[]
  wishlistItems: UserWishlistItem[]
  systemSettings: SystemSetting[]
  pointSettings: ClientPointsConfiguration | null
  pointsSummary: ClientPointsSummary | null
  recommendedProducts: RecommendedProduct[]
  recommendedSellers: RecommendedSeller[]
  recommendedPromotions: RecommendedPromotion[]
  sharedProducts: SharedProduct[]
  sellers: Seller[]
  chatProducts: any[]
  shopProducts: any[]
  pointsHistory: PointsTransaction[]
  withdrawals: WithdrawalRequest[]
  recentActivities: RecentActivity[]
  stats: DashboardStats
}

type UserOrderWithItems = {
  id: string
  user_id: string
  vendor_id?: string | null
  order_number: string
  status: string
  total_amount: number
  currency: string
  final_total?: number | null
  points_used?: number | null
  points_discount?: number | null
  payment_option?: string | null
  delivery_option?: string | null
  shipping_address: any | null
  billing_address: any | null
  payment_method: string | null
  payment_status: string
  notes: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, any> | null
  order_items: OrderItem[]
  return_info?: UserOrderReturnInfo
  dispute_info?: UserOrderDisputeInfo
}

type UserOrderReturnInfo = {
  status?: string
  reason?: string
  processedAt?: string
  createdAt?: string
}

type UserOrderDisputeInfo = {
  status?: string
  priority?: string
  assignedTo?: string
  subject?: string
  description?: string
  openedAt?: string
  updatedAt?: string
}

type ChatMessage = Tables<'chat_messages'>
type UserChat = Tables<'user_chats'>
type UserNotification = Tables<'user_notifications'>
type UserMessage = Tables<'user_messages'>
type UserProduct = Tables<'user_products'>
type ProductReview = Tables<'product_reviews'>
type UserCartItem = Tables<'user_carts'>
type UserWishlistItem = Tables<'user_wishlists'>
type SystemSetting = Tables<'system_settings'>
type RawPointsTransaction = Tables<'point_transactions'>
type PointTransferRequest = Tables<'point_transfer_requests'>
type WithdrawalRequest = Tables<'point_withdrawal_requests'>
type LoyaltyPoints = Tables<'loyalty_points'>
type Promotion = Tables<'promotions'>

export type PointsTransaction = {
  id: string
  type: 'earned' | 'used' | 'withdrawn'
  amount: number
  description: string
  date: string
  balance: number
}

type RecommendedProduct = {
  id: string
  name: string
  price: number
  originalPrice: number
  image: string
  category: string
  rating: number
  reviews: number
  seller: string
  sellerRating: number
  aiConfidence: number
  aiReason: string
}

type RecommendedSeller = {
  id: string
  name: string
  avatar: string
  rating: number
  totalSales: number
  responseTime: string
  specialties: string[]
  topProducts: number[]
  aiConfidence: number
  aiReason: string
}

type RecommendedPromotion = {
  id: string
  title: string
  description: string
  type: string
  value: any
  startDate: string | null
  endDate: string | null
  image: string
  usageCount: number
  maxUsage: number | null
  priority: number
  isActive: boolean
  aiConfidence: number
  aiReason: string
}

type SharedProduct = {
  id: string
  productId: number
  productName: string
  productImage: string
  shares: {
    facebook: number
    twitter: number
    whatsapp: number
    instagram: number
  }
  totalShares: number
  pointsEarned: number
  pointsUsed: number
  pointsWithdrawn: number
  pointsAvailable: number
  sharedAt: string | null
}

type Seller = {
  name: string
  avatar: string
  rating: number
  reviewsCount?: number
  totalSales: number
  responseTime: string
  location: string
  phone: string
  email: string
  isOnline: boolean
  lastSeenAt?: string | null
  userId?: string
  partnerId?: string
  lastMessage: string
}

type RecentActivity = {
  id: string
  type: string
  title: string
  description: string
  time: string
  created_at: string
}

type PointsOffer = {
  id: string
  title: string
  description: string
  points: number
  expiresAt: string | null
}

type DashboardStats = {
  totalOrders: number
  totalProducts: number
  totalPoints: number
  totalRevenue: number
  averageRating: number
  unreadMessages: number
  unreadChats: number
  pendingNotifications: number
  totalShares: number
  pointsUsed: number
  pointsWithdrawn: number
  withdrawalThreshold: number
  withdrawalFee: number
  expiredPoints: number
  avgRating: number
}

type MessagePriority = 'low' | 'medium' | 'high'

type MessageCategory = 'general' | 'support' | 'technical' | 'billing'

type UserOrder = Tables<'user_orders'>

interface ClientOrderApiResponse {
  data?: Array<ClientOrderRecord>
}

export class DashboardService {
  /**
   * Met à jour les préférences de notifications dans `user_profiles.preferences`.
   *
   * Stratégie:
   * - Lire `preferences` actuelles (best-effort)
   * - Fusionner/écraser le sous-objet `notifications`
   * - Écrire le JSON final pour l'utilisateur courant
   */
  static async updateNotificationPreferences(params: {
    userId: string
    notificationSettings: {
      email: boolean
      push: boolean
      sms: boolean
      orders: boolean
      points: boolean
      chat: boolean
      promotions: boolean
      system: boolean
      ai: boolean
    }
    notificationFrequency: string
    notificationStartTime: string
    notificationEndTime: string
  }): Promise<{ preferences: any | null }> {
    const {
      userId,
      notificationSettings,
      notificationFrequency,
      notificationStartTime,
      notificationEndTime
    } = params

    const { data: currentProfile, error: readError } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    if (readError) {
      console.error('❌ Erreur lors de la lecture des préférences utilisateur:', readError)
    }

    const currentPreferences =
      currentProfile?.preferences && typeof currentProfile.preferences === 'object' && !Array.isArray(currentProfile.preferences)
        ? (currentProfile.preferences as any)
        : {}

    const nextPreferences = {
      ...(currentPreferences ?? {}),
      notifications: {
        ...(currentPreferences?.notifications && typeof currentPreferences.notifications === 'object' && !Array.isArray(currentPreferences.notifications)
          ? currentPreferences.notifications
          : {}),
        settings: { ...(notificationSettings as any) },
        frequency: notificationFrequency,
        startTime: notificationStartTime,
        endTime: notificationEndTime
      }
    }

    const { data, error: updateError } = await supabase
      .from('user_profiles')
      .update({ preferences: nextPreferences } as any)
      .eq('user_id', userId)
      .select('preferences')
      .single()

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour des préférences de notifications:', updateError)
      throw updateError
    }

    return { preferences: data?.preferences ?? null }
  }

  // Récupérer les commandes de l'utilisateur via Supabase directement
    /**
   * Mappe une ligne brute de la table `orders` vers le format UI UserOrderWithItems.
   */
  private static mapOrderRow(order: any, userId: string): UserOrderWithItems {
    return {
      id: order.id,
      user_id: order.customer_id ?? userId,
      vendor_id: order.vendor_id,
      order_number: order.order_number ?? `ORDER-${order.id.slice(0, 8)}`,
      status: order.status ?? 'pending',
      total_amount: order.total_amount ?? 0,
      currency: order.currency ?? 'XOF',
      final_total: order.final_total,
      points_used: order.points_used,
      points_discount: order.points_discount,
      payment_option: order.payment_option,
      delivery_option: order.delivery_option,
      shipping_address: order.shipping_address ?? null,
      billing_address: order.billing_address ?? null,
      payment_method: order.payment_method ?? 'unknown',
      payment_status: order.payment_status ?? 'pending',
      notes: order.notes ?? null,
      created_at: order.created_at ?? new Date().toISOString(),
      updated_at: order.updated_at ?? order.created_at ?? new Date().toISOString(),
      metadata: order.metadata ?? null,
      order_items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity ?? 0,
        product_name: item.product_name ?? 'Produit',
        unit_price: item.unit_price ?? 0,
        total_price: item.total_price ?? (item.quantity ?? 0) * (item.unit_price ?? 0),
        metadata: item.metadata ?? null
      })),
      return_info: order.order_returns && order.order_returns.length > 0 ? {
        status: order.order_returns[0].status,
        reason: order.order_returns[0].reason,
        processedAt: order.order_returns[0].processed_at,
        createdAt: order.order_returns[0].created_at
      } : undefined,
      dispute_info: order.order_disputes && order.order_disputes.length > 0 ? {
        status: order.order_disputes[0].status,
        priority: order.order_disputes[0].priority,
        assignedTo: order.order_disputes[0].assigned_to,
        subject: order.order_disputes[0].subject,
        description: order.order_disputes[0].description,
        openedAt: order.order_disputes[0].opened_at,
        updatedAt: order.order_disputes[0].updated_at
      } : undefined
    }
  }

  /**
   * Fallback : récupère les commandes via l'API client (client admin côté
   * serveur, insensible aux policies RLS qui bloquent la lecture directe de
   * `orders` depuis le navigateur).
   */
  private static async fetchOrdersViaApi(userId: string): Promise<UserOrderWithItems[] | null> {
    try {
      if (typeof window === 'undefined') return null
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      const res = await fetch('/api/client/orders', {
        cache: 'no-store',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
      })
      if (!res.ok) return null
      const json = await res.json().catch(() => null)
      const rows = Array.isArray(json?.data) ? json.data : null
      if (!rows) return null
      return rows.map((order: any) => this.mapOrderRow(order, userId))
    } catch {
      return null
    }
  }

  static async getUserOrders(userId: string): Promise<UserOrderWithItems[]> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_returns (*),
          order_disputes (*)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        console.error('❌ Erreur lors de la récupération des commandes via Supabase:', error)
        const viaApi = await this.fetchOrdersViaApi(userId)
        return viaApi ?? []
      }

      // RLS peut bloquer la lecture directe (0 ligne) alors que des commandes
      // existent : basculer sur l'API client dans ce cas.
      if ((orders || []).length === 0) {
        const viaApi = await this.fetchOrdersViaApi(userId)
        if (viaApi && viaApi.length > 0) return viaApi
      }

      return (orders || []).map(order => this.mapOrderRow(order, userId))
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la récupération des commandes:', error)
      const viaApi = await this.fetchOrdersViaApi(userId)
      return viaApi ?? []
    }
  }

  /**
   * Crée une demande de retour pour une commande.
   */
  static async createReturnRequest(params: {
    orderId: string
    userId: string
    vendorId: string
    reason: string
    description: string
    refundCurrency: string
  }): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('order_returns')
        .insert({
          order_id: params.orderId,
          customer_id: params.userId,
          vendor_id: params.vendorId,
          status: 'pending',
          reason: params.reason,
          metadata: {
            description: params.description,
            requested_by: 'customer'
          },
          refund_currency: params.refundCurrency,
          requested_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la création de la demande de retour:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la création de la demande de retour:', error)
      return { data: null, error }
    }
  }

  // Récupérer les messages de chat pour une liste de conversations
  static async getChatMessages(chatIds: string[]): Promise<ChatMessage[]> {
    try {
      if (chatIds.length === 0) {
        return []
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        console.error('❌ Erreur lors de la récupération des messages de chat:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la récupération des messages de chat:', error)
      return []
    }
  }

  // Récupérer les produits de l'utilisateur (pour les vendeurs)
  static async getUserProducts(userId: string): Promise<UserProduct[]> {
    try {
      const { data, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('vendor_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(' Erreur lors de la récupération des produits:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error(' Erreur inattendue lors de la récupération des produits:', error)
      return []
    }
  }

  // Récupérer les chats de l'utilisateur
  static async getUserChats(userId: string): Promise<UserChat[]> {
    try {
      const { data, error } = await supabase
        .from('user_chats')
        .select('*')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error(' Erreur lors de la récupération des chats:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error(' Erreur inattendue lors de la récupération des chats:', error)
      return []
    }
  }

  // Récupérer les notifications de l'utilisateur
  static async getUserNotifications(userId: string, limit = 50): Promise<UserNotification[]> {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error(' Erreur lors de la récupération des notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error(' Erreur inattendue lors de la récupération des notifications:', error)
      return []
    }
  }

  /**
   * Récupère des compteurs synchronisés avec la base (sans dépendre du `limit` de getUserNotifications).
   */
  static async getUserNotificationStats(userId: string): Promise<{
    total: number
    unread: number
    promotions: number
    orders: number
  }> {
    try {
      const base = supabase.from('user_notifications')

      const promotionsCategories = ['promotions', 'promotion', 'promo']
      const ordersCategories = ['orders', 'order', 'payment', 'shipping', 'delivery']

      const [totalResp, unreadResp, promotionsResp, ordersResp] = await Promise.all([
        base.select('id', { count: 'exact', head: true }).eq('user_id', userId),
        base.select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false),
        base.select('id', { count: 'exact', head: true }).eq('user_id', userId).in('category', promotionsCategories),
        base.select('id', { count: 'exact', head: true }).eq('user_id', userId).in('category', ordersCategories)
      ])

      return {
        total: Number(totalResp.count ?? 0),
        unread: Number(unreadResp.count ?? 0),
        promotions: Number(promotionsResp.count ?? 0),
        orders: Number(ordersResp.count ?? 0)
      }
    } catch (error) {
      console.error(' Erreur inattendue lors de la récupération des stats notifications:', error)
      return { total: 0, unread: 0, promotions: 0, orders: 0 }
    }
  }

  static async markNotificationRead(notificationId: string, isRead: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: isRead })
      .eq('id', notificationId)

    if (error) {
      console.error(' Erreur lors de la mise à jour de la notification:', error)
      throw error
    }
  }

  static async markAllNotificationsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error(' Erreur lors du marquage des notifications comme lues:', error)
      throw error
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error(' Erreur lors de la suppression de la notification:', error)
      throw error
    }
  }

  static async deleteReadNotifications(userId: string): Promise<number> {
    const { error, count } = await supabase
      .from('user_notifications')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', true)

    if (error) {
      console.error(' Erreur lors de la suppression des notifications lues:', error)
      throw error
    }

    return count ?? 0
  }

  static async markMessageRead(messageId: string, isRead: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_messages')
      .update({ is_read: isRead })
      .eq('id', messageId)

    if (error) {
      console.error('❌ Erreur lors de la mise à jour du message:', error)
      throw error
    }
  }

  static async markChatMessageRead(messageId: string, isRead: boolean): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: isRead })
      .eq('id', messageId)

    if (error) {
      console.error('❌ Erreur lors de la mise à jour du message de chat:', error)
      throw error
    }
  }

  static async archiveChatMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_archived: true })
      .eq('id', messageId)

    if (error) {
      console.error('❌ Erreur lors de l\'archivage du message de chat:', error)
      throw error
    }
  }

  static async deleteChatMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('❌ Erreur lors de la suppression du message de chat:', error)
      throw error
    }
  }

  static async addProductToChat(params: {
    chatId: string
    senderId: string
    product: {
      id: string
      name: string
      price: number
      currency?: string
      metadata?: Record<string, any>
    }
  }): Promise<ChatMessage | null> {
    const { chatId, senderId, product } = params

    try {
      /**
       * Normalise une image produit en URL publique Supabase (bucket product-assets).
       */
      const toPublicProductAssetUrl = (value: unknown): string => {
        const raw = typeof value === 'string' ? value.trim() : ''
        if (!raw) return ''
        if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image/')) return raw
        const path = raw.replace(/^\/+/, '')
        try {
          const { data } = supabase.storage.from('product-assets').getPublicUrl(path)
          const url = typeof data?.publicUrl === 'string' ? data.publicUrl.trim() : ''
          return url || raw
        } catch {
          return raw
        }
      }

      const meta = (product.metadata ?? {}) as any
      const thumbRaw = meta?.thumbnail ?? meta?.image_url ?? meta?.imageUrl ?? meta?.image ?? meta?.mainImage ?? ''
      const thumbnailUrl = toPublicProductAssetUrl(thumbRaw)

      const payload = {
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency ?? 'XOF',
          image_url: thumbnailUrl || undefined,
          images: thumbnailUrl ? [thumbnailUrl] : undefined,
          metadata: {
            ...(meta ?? {}),
            ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {})
          } as any
        },
        text: `Produit partagé: ${product.name}`
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content: `__product__:${JSON.stringify(payload)}`,
          message_type: 'system',
          is_read: false
        })
        .select('*')
        .single()

      if (error) {
        console.error('❌ Erreur lors de l\'ajout du produit au chat:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Erreur inattendue lors de l\'ajout du produit au chat:', error)
      return null
    }
  }

  static async markAllMessagesRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_messages')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)
      .neq('status', 'deleted')

    if (error) {
      console.error('❌ Erreur lors du marquage des messages comme lus:', error)
      throw error
    }
  }

  static async updateMessagePriority(messageId: string, priority: MessagePriority): Promise<void> {
    const priorityMap: Record<MessagePriority, string> = {
      low: 'low',
      medium: 'normal',
      high: 'high'
    }

    const { error } = await supabase
      .from('user_messages')
      .update({ priority: priorityMap[priority] })
      .eq('id', messageId)

    if (error) {
      console.error('❌ Erreur lors de la mise à jour de la priorité du message:', error)
      throw error
    }
  }

  static async archiveMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('user_messages')
      .update({ status: 'archived' })
      .eq('id', messageId)

    if (error) {
      console.error('❌ Erreur lors de l\'archivage du message:', error)
      throw error
    }
  }

  static async createMessage(params: {
    senderId: string
    recipientId?: string | null
    subject: string
    content: string
    category: MessageCategory
    priority: MessagePriority
    attachments?: string[]
  }): Promise<UserMessage> {
    const { senderId, recipientId = null, subject, content, category, priority, attachments } = params

    const effectiveRecipientId = recipientId ?? (await InternalMessagingService.getAdminRecipientId())

    if (!effectiveRecipientId) {
      throw new Error('Destinataire admin introuvable pour la messagerie interne.')
    }

    const typeMap: Record<MessageCategory, 'internal' | 'support' | 'technical' | 'billing'> = {
      support: 'support',
      technical: 'internal',
      billing: 'support',
      general: 'internal'
    }

    const { data, error } = await supabase
      .from('user_messages')
      .insert({
        sender_id: senderId,
        recipient_id: effectiveRecipientId,
        subject,
        content,
        category,
        attachments: Array.isArray(attachments) ? attachments : undefined,
        type: typeMap[category] ?? 'internal',
        priority: priority === 'medium' ? 'normal' : priority,
        status: 'active',
        is_read: false
      })
      .select('*')
      .single()

    if (error || !data) {
      console.error('❌ Erreur lors de la création du message:', error)
      throw error
    }

    return data
  }

  // Récupérer les messages de l'utilisateur
  static async getUserMessages(userId: string): Promise<UserMessage[]> {
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('❌ Erreur lors de la récupération des messages:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la récupération des messages:', error)
      return []
    }
  }

  /**
   * Compteurs de messagerie synchronisés avec la base (comptes SQL exacts),
   * indépendants du `limit` de getUserMessages.
   */
  static async getUserMessageStats(userId: string): Promise<{
    total: number
    unread: number
    admin: number
    fromUser: number
  }> {
    const fallback = { total: 0, unread: 0, admin: 0, fromUser: 0 }
    if (!userId) return fallback
    try {
      const base = supabase.from('user_messages').neq('status', 'deleted')

      const [totalResp, unreadResp, adminResp, fromUserResp] = await Promise.all([
        base.select('id', { count: 'exact', head: true }).or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
        base.select('id', { count: 'exact', head: true }).eq('recipient_id', userId).eq('is_read', false),
        base.select('id', { count: 'exact', head: true }).eq('recipient_id', userId).neq('sender_id', userId),
        base.select('id', { count: 'exact', head: true }).eq('sender_id', userId)
      ])

      return {
        total: Number(totalResp.count ?? 0),
        unread: Number(unreadResp.count ?? 0),
        admin: Number(adminResp.count ?? 0),
        fromUser: Number(fromUserResp.count ?? 0)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats messagerie:', error)
      return fallback
    }
  }

  // Récupérer les produits recommandés par IA
  static async getRecommendedProducts(userId: string): Promise<RecommendedProduct[]> {
    try {
      console.log('🔍 Récupération des produits recommandés pour:', userId)
      
      // Lecture générique depuis historique_recommandations_ia
      const { data: recommendations, error: recError } = await supabase
        .from('historique_recommandations_ia')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'product')
        .eq('is_active', true)
        .order('confidence_score', { ascending: false })
        .limit(5);

      if (recError) {
        console.error('❌ Erreur lors de la récupération des recommandations IA:', recError);
      }

      // Si pas de recommandations IA ou erreur, retourner un tableau vide
      if (!recommendations || recommendations.length === 0 || recError) {
        console.log('ℹ️ Aucune recommandation IA trouvée, tableau vide retourné')
        return [];
      }

      const productIds = (recommendations || [])
        .map((rec: any) => extractRecommendationKeyId(extractRecommendationKeyFromRow(rec)))
        .filter(Boolean)

      const productById = new Map<string, any>()
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('user_products')
          .select('id, name, price, original_price, category, main_image, images, vendor_id, rating, reviews_count')
          .in('id', productIds)

        for (const p of products ?? []) {
          productById.set(String((p as any)?.id ?? '').trim(), p)
        }
      }

      return (recommendations || []).map((rec: any) => {
        const pid = extractRecommendationKeyId(extractRecommendationKeyFromRow(rec))
        const product = productById.get(pid)

        const price = Number((product as any)?.price ?? 0)
        const originalPrice = Number((product as any)?.original_price ?? price)
        const category = (product as any)?.category ?? 'Général'
        const main = typeof (product as any)?.main_image === 'string' ? String((product as any).main_image).trim() : ''
        const images = Array.isArray((product as any)?.images) ? (product as any).images : []
        const imgFallback = typeof images?.[0] === 'string' ? String(images[0]).trim() : ''

        return {
          id: pid || String(rec?.id ?? '').trim(),
          name: (product as any)?.name ?? 'Produit recommandé',
          price: Number.isFinite(price) ? price : 0,
          originalPrice: Number.isFinite(originalPrice) ? originalPrice : (Number.isFinite(price) ? price : 0),
          image: main || imgFallback || '/placeholder.jpg',
          category,
          rating: Number((product as any)?.rating ?? 0),
          reviews: Number((product as any)?.reviews_count ?? 0),
          seller: 'Vendeur Premium',
          sellerRating: 4.5,
          aiConfidence: Math.round((rec?.confidence_score || 0) * 100),
          aiReason: stripEncodedKeyFromReason(rec?.ai_reason) || 'Recommandation personnalisée'
        }
      })
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits recommandés:', error);
      return [];
    }
  }

  // Récupérer les vendeurs recommandés
  static async getRecommendedSellers(userId: string): Promise<RecommendedSeller[]> {
    try {
      console.log('🔍 Récupération des vendeurs recommandés pour:', userId)
      
      // Essayer d'abord une requête simple sans join
      const { data: recommendations, error: recError } = await supabase
        .from('historique_recommandations_ia')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'seller')
        .eq('is_active', true)
        .order('confidence_score', { ascending: false })
        .limit(3);

      if (recError) {
        console.error('❌ Erreur lors de la récupération des vendeurs recommandés:', recError);
      }

      // Si pas de recommandations IA ou erreur, retourner un tableau vide
      if (!recommendations || recommendations.length === 0 || recError) {
        console.log('ℹ️ Aucune recommandation IA trouvée, tableau vide retourné')
        return [];
      }

      const sellerIds = (recommendations || [])
        .map((rec: any) => extractRecommendationKeyId(extractRecommendationKeyFromRow(rec)))
        .filter(Boolean)

      const profileByUserId = new Map<string, any>()
      if (sellerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, avatar_url, short_code, preferences')
          .in('user_id', sellerIds)

        for (const p of profiles ?? []) {
          profileByUserId.set(String((p as any)?.user_id ?? '').trim(), p)
        }
      }

      return (recommendations || []).map((rec: any) => {
        const sid = extractRecommendationKeyId(extractRecommendationKeyFromRow(rec))
        const profile = profileByUserId.get(sid)
        const first = typeof profile?.first_name === 'string' ? String(profile.first_name).trim() : ''
        const last = typeof profile?.last_name === 'string' ? String(profile.last_name).trim() : ''
        const full = `${first} ${last}`.trim()
        const name = full || (typeof profile?.short_code === 'string' ? String(profile.short_code).trim() : '') || 'Vendeur recommandé'
        const avatar = (typeof profile?.avatar_url === 'string' && profile.avatar_url.trim()) ? profile.avatar_url.trim() : '/placeholder-user.jpg'

        return {
          id: sid || String(rec?.id ?? '').trim(),
          name,
          avatar,
          rating: 4.8,
          totalSales: 1000,
          responseTime: '2.5 min',
          specialties: ['Électronique', 'Mode', 'Maison'],
          topProducts: [1, 2, 3],
          aiConfidence: Math.round((rec?.confidence_score || 0) * 100),
          aiReason: stripEncodedKeyFromReason(rec?.ai_reason) || 'Excellent vendeur dans vos catégories préférées'
        }
      })
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des vendeurs recommandés:', error);
      return [];
    }
  }

  // Récupérer les promotions recommandées par IA (depuis historique_recommandations_ia)
  static async getRecommendedPromotions(userId: string): Promise<RecommendedPromotion[]> {
    try {
      const { data: recommendations, error: recError } = await supabase
        .from('historique_recommandations_ia')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'promotion')
        .eq('is_active', true)
        .order('confidence_score', { ascending: false })
        .limit(10)

      if (recError) {
        console.error('❌ Erreur lors de la récupération des promotions IA:', recError)
      }

      if (!recommendations || recommendations.length === 0 || recError) {
        return []
      }

      const promoIds = (recommendations || [])
        .map((rec: any) => extractRecommendationKeyId(extractRecommendationKeyFromRow(rec)))
        .filter(Boolean)

      const promoById = new Map<string, any>()
      if (promoIds.length > 0) {
        const { data: promos } = await supabase
          .from('promotions')
          .select('*')
          .in('id', promoIds)

        for (const p of promos ?? []) {
          promoById.set(String((p as any)?.id ?? '').trim(), p)
        }
      }

      return (recommendations || []).map((rec: any) => {
        const promotionId = extractRecommendationKeyId(extractRecommendationKeyFromRow(rec)) || String(rec?.id ?? '').trim()
        const promo = promoById.get(promotionId)

        const isActive = String((promo as any)?.status ?? '').trim() === 'active'
        return {
          id: promotionId,
          title: (promo as any)?.title ?? (promo as any)?.name ?? 'Promotion',
          description: (promo as any)?.description ?? '',
          type: (promo as any)?.type ?? 'discount',
          value: (promo as any)?.discount_value ?? (promo as any)?.value ?? null,
          startDate: (promo as any)?.start_date ?? null,
          endDate: (promo as any)?.end_date ?? null,
          image: (promo as any)?.image_url ?? '/placeholder.jpg',
          usageCount: Number((promo as any)?.usage_count ?? 0),
          maxUsage: (promo as any)?.max_usage ?? (promo as any)?.usage_limit ?? null,
          priority: Number((promo as any)?.priority ?? 1),
          isActive,
          aiConfidence: Math.round((rec.confidence_score || 0) * 100),
          aiReason: stripEncodedKeyFromReason(rec?.ai_reason) || 'Promotion recommandée'
        }
      })
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des promotions recommandées:', error)
      return []
    }
  }

  // ===== Interactions utilisateur persistées (favoris, follows, alertes) =====

  /**
   * Récupère les interactions persistées de l'utilisateur :
   * - favoris produits (table user_wishlists)
   * - favoris/alertes promotions, follows vendeurs, promotions appliquées (table activity_logs)
   */
  static async getUserInteractions(userId: string): Promise<{
    wishlistProductIds: string[]
    promotionFavorites: string[]
    sellerFollows: string[]
    promotionAlerts: string[]
    promotionAppliedIds: string[]
    promotionUsage: Record<string, number>
  }> {
    const empty = {
      wishlistProductIds: [] as string[],
      promotionFavorites: [] as string[],
      sellerFollows: [] as string[],
      promotionAlerts: [] as string[],
      promotionAppliedIds: [] as string[],
      promotionUsage: {} as Record<string, number>
    }
    try {
      const [wishlistRes, activityRes] = await Promise.all([
        supabase.from('user_wishlists').select('product_id').eq('user_id', userId),
        supabase
          .from('activity_logs')
          .select('action, entity_type, entity_id')
          .eq('user_id', userId)
          .in('action', ['promotion_favorite', 'seller_follow', 'promotion_alert', 'promotion_applied'])
          .order('created_at', { ascending: true })
      ])

      const result = { ...empty }
      for (const row of wishlistRes.data ?? []) {
        const pid = String((row as any)?.product_id ?? '').trim()
        if (pid) result.wishlistProductIds.push(pid)
      }

      const usage: Record<string, number> = {}
      for (const row of activityRes.data ?? []) {
        const entityId = String((row as any)?.entity_id ?? '').trim()
        if (!entityId) continue
        const action = String((row as any)?.action ?? '')
        if (action === 'promotion_favorite') result.promotionFavorites.push(entityId)
        else if (action === 'seller_follow') result.sellerFollows.push(entityId)
        else if (action === 'promotion_alert') result.promotionAlerts.push(entityId)
        else if (action === 'promotion_applied') {
          result.promotionAppliedIds.push(entityId)
          usage[entityId] = (usage[entityId] ?? 0) + 1
        }
      }
      result.promotionUsage = usage
      return result
    } catch {
      return empty
    }
  }

  /** Ajoute / retire un produit de la wishlist (table user_wishlists). */
  static async setProductWishlist(userId: string, productId: string, active: boolean): Promise<boolean> {
    try {
      if (active) {
        const { error } = await supabase
          .from('user_wishlists')
          .insert({ user_id: userId, product_id: productId } as any)
        // 23505 = doublon déjà présent : considéré comme succès
        return !error || (error as any)?.code === '23505'
      }
      const { error } = await supabase
        .from('user_wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
      return !error
    } catch {
      return false
    }
  }

  /** Ajoute / retire une interaction générique (favoris promo, follow vendeur, alerte, application). */
  static async setUserInteraction(
    userId: string,
    action: 'promotion_favorite' | 'seller_follow' | 'promotion_alert' | 'promotion_applied',
    entityType: 'promotion' | 'seller',
    entityId: string,
    active: boolean
  ): Promise<boolean> {
    try {
      if (active) {
        const { error } = await supabase.from('activity_logs').insert({
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId
        } as any)
        return !error
      }
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', userId)
        .eq('action', action)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
      return !error
    } catch {
      return false
    }
  }

  // Récupérer les promotions actives
  static async getPromotions(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Récupération des promotions pour:', userId)

      const now = new Date().toISOString()

      const { data: promotions, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.warn('⚠️ Impossible de récupérer les promotions actives:', error?.message ?? error)
        return []
      }

      if (!promotions || promotions.length === 0) {
        console.log('ℹ️ Aucune promotion trouvée, tableau vide retourné')
        return []
      }

      return promotions.map((promo: any) => ({
        id: promo.id,
        title: promo.title ?? promo.name ?? 'Promotion Pro Booster',
        description: promo.description,
        type: promo.type,
        value: promo.discount_value,
        minAmount: promo.min_amount ?? promo.min_order_amount ?? null,
        maxDiscount: promo.max_discount ?? null,
        startDate: promo.start_date,
        endDate: promo.end_date,
        products: promo.product_ids ?? promo.applicable_products ?? [],
        categories: promo.category_ids ?? promo.applicable_categories ?? [],
        isActive: promo.status === 'active',
        usageCount: promo.usage_count ?? 0,
        maxUsage: promo.max_usage ?? promo.usage_limit ?? null,
        conditions: promo.conditions ?? [],
        image: promo.image_url ?? '/placeholder.jpg',
        priority: promo.priority ?? 1
      }))
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des promotions:', error);
      return [];
    }
  }

  // Récupérer les produits partagés par l'utilisateur (source réelle: table product_shares)
  static async getSharedProducts(userId: string): Promise<SharedProduct[]> {
    try {
      // Lire les partages réels enregistrés par POST /api/shares/record
      const { data: shares, error } = await supabase
        .from('product_shares')
        .select('product_id, platform, points_earned, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erreur lors de la récupération des partages (product_shares):', error)
      }

      const rows = Array.isArray(shares) ? shares : []
      if (rows.length === 0) {
        return []
      }

      // Récupérer les infos produits pour le nom/image
      const productIds = Array.from(
        new Set(rows.map((r: any) => String(r?.product_id ?? '')).filter(Boolean))
      ).slice(0, 500)

      const productNameById = new Map<string, string>()
      const productImageById = new Map<string, string>()
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('user_products')
          .select('id, name, main_image')
          .in('id', productIds as any)
        ;(products ?? []).forEach((p: any) => {
          if (p?.id) {
            productNameById.set(String(p.id), String(p?.name ?? ''))
            productImageById.set(String(p.id), String(p?.main_image ?? ''))
          }
        })
      }

      // Agréger par produit (fréquence + total + plateformes + date la plus récente)
      const byProduct = new Map<
        string,
        {
          shares: { facebook: number; twitter: number; whatsapp: number; instagram: number }
          totalShares: number
          pointsEarned: number
          sharedAt: string | null
        }
      >()

      for (const r of rows as any[]) {
        const pid = String(r?.product_id ?? '').trim()
        if (!pid) continue
        const platform = String(r?.platform ?? '').trim().toLowerCase()
        const earned = Number(r?.points_earned ?? 0) || 0
        const created = String(r?.created_at ?? '')

        const current =
          byProduct.get(pid) ?? {
            shares: { facebook: 0, twitter: 0, whatsapp: 0, instagram: 0 },
            totalShares: 0,
            pointsEarned: 0,
            sharedAt: null
          }

        current.totalShares += 1
        current.pointsEarned += earned
        if (platform === 'facebook') current.shares.facebook += 1
        else if (platform === 'twitter') current.shares.twitter += 1
        else if (platform === 'whatsapp') current.shares.whatsapp += 1
        else if (platform === 'instagram') current.shares.instagram += 1

        if (created && (!current.sharedAt || String(current.sharedAt) < created)) {
          current.sharedAt = created
        }

        byProduct.set(pid, current)
      }

      return Array.from(byProduct.entries())
        .map(([productId, stats]) => ({
          id: productId,
          productId: Number(productId) || 0,
          productName: productNameById.get(productId) || 'Produit partagé',
          productImage: productImageById.get(productId) || '/placeholder.jpg',
          shares: stats.shares,
          totalShares: stats.totalShares,
          pointsEarned: stats.pointsEarned,
          pointsUsed: 0,
          pointsWithdrawn: 0,
          pointsAvailable: 0,
          sharedAt: stats.sharedAt
        }))
        .sort((a, b) => String(b.sharedAt ?? '').localeCompare(String(a.sharedAt ?? '')))
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits partagés:', error)
      return []
    }
  }

  // Récupérer les vendeurs
  static async getSellers(userId: string): Promise<Seller[]> {
    try {
      // Récupérer les vendeurs avec qui l'utilisateur a interagi
      const { data: chats, error: chatsError } = await supabase
        .from('user_chats')
        .select('*')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

      if (chatsError) {
        console.error('❌ Erreur lors de la récupération des chats:', chatsError);
        return [];
      }

      // Si pas de chats, retourner un tableau vide
      if (!chats || chats.length === 0) {
        console.log('ℹ️ Aucun chat trouvé, tableau vide retourné')
        return [];
      }

      const partnerIds = Array.from(
        new Set(
          (chats || [])
            .map((chat: any) => {
              const isParticipant1 = chat.participant1_id === userId
              const otherParticipantId = isParticipant1 ? chat.participant2_id : chat.participant1_id
              return String(otherParticipantId ?? '').trim()
            })
            .filter(Boolean)
        )
      )

      const profileByAnyId = new Map<string, any>()
      const resolvedPresenceUserIds = new Set<string>()
      if (partnerIds.length > 0) {
        const [byUserIdRes, byIdRes] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id, user_id, first_name, last_name, avatar_url, short_code, preferences')
            .in('user_id', partnerIds),
          supabase
            .from('user_profiles')
            .select('id, user_id, first_name, last_name, avatar_url, short_code, preferences')
            .in('id', partnerIds)
        ])

        if (byUserIdRes.error) {
          console.warn('⚠️ getSellers: impossible de récupérer user_profiles(user_id):', byUserIdRes.error)
        }
        if (byIdRes.error) {
          console.warn('⚠️ getSellers: impossible de récupérer user_profiles(id):', byIdRes.error)
        }

        const profiles = [...(byUserIdRes.data ?? []), ...(byIdRes.data ?? [])]
        for (const p of profiles) {
          const pid = String((p as any)?.id ?? '').trim()
          const uid = String((p as any)?.user_id ?? '').trim()
          if (pid) profileByAnyId.set(pid, p)
          if (uid) profileByAnyId.set(uid, p)
          if (uid) resolvedPresenceUserIds.add(uid)
        }
      }

      // Presence best-effort: si la table n'existe pas, on garde le fallback.
      const presenceByUserId = new Map<string, { isOnline: boolean; lastSeenAt: string | null }>()
      if (resolvedPresenceUserIds.size > 0) {
        try {
          const { data: presenceRows, error: presenceError } = await supabase
            .from('user_presence' as any)
            .select('user_id, is_online, last_seen_at, updated_at')
            .in('user_id', Array.from(resolvedPresenceUserIds))

          if (!presenceError) {
            ;(presenceRows ?? []).forEach((row: any) => {
              const uid = String(row?.user_id ?? '').trim()
              if (!uid) return
              const lastSeenAt = typeof row?.last_seen_at === 'string'
                ? String(row.last_seen_at)
                : (typeof row?.updated_at === 'string' ? String(row.updated_at) : null)

              const isOnlineRaw = row?.is_online
              const isOnlineBool = typeof isOnlineRaw === 'boolean' ? isOnlineRaw : null
              const lastSeenTs = lastSeenAt ? new Date(lastSeenAt).getTime() : NaN
              const onlineByRecency = Number.isFinite(lastSeenTs)
                ? (Date.now() - lastSeenTs) <= 5 * 60 * 1000
                : false
              presenceByUserId.set(uid, {
                isOnline: (isOnlineBool ?? false) || onlineByRecency,
                lastSeenAt
              })
            })
          }
        } catch {
          // ignore
        }
      }

      // vendor_stats best-effort: rating / reviews / response time.
      const vendorStatsByUserId = new Map<string, any>()
      if (resolvedPresenceUserIds.size > 0) {
        const ids = Array.from(resolvedPresenceUserIds)
        try {
          const [byIdRes, byUserIdRes] = await Promise.all([
            supabase.from('vendor_stats').select('*').in('id', ids),
            supabase.from('vendor_stats').select('*').in('user_id' as any, ids)
          ])

          const rows = [...(byIdRes.data ?? []), ...(byUserIdRes.data ?? [])]
          ;(rows ?? []).forEach((row: any) => {
            const id = String(row?.id ?? '').trim()
            const uid = String(row?.user_id ?? '').trim()
            const vid = String(row?.vendor_id ?? '').trim()
            if (id) vendorStatsByUserId.set(id, row)
            if (uid) vendorStatsByUserId.set(uid, row)
            if (vid) vendorStatsByUserId.set(vid, row)
          })
        } catch {
          // ignore
        }
      }

      // Transformer les données en format Seller
      return (chats || []).map((chat: any) => {
        const isParticipant1 = chat.participant1_id === userId
        const otherParticipantId = isParticipant1 ? chat.participant2_id : chat.participant1_id
        const otherId = String(otherParticipantId ?? '').trim()
        const profile = otherId ? profileByAnyId.get(otherId) : null

        const name = computeProfileDisplayName(profile, otherId)
        const avatar = (typeof profile?.avatar_url === 'string' && String(profile.avatar_url).trim())
          ? String(profile.avatar_url).trim()
          : '/placeholder-user.jpg'

        const vendorUserId = String((profile as any)?.user_id ?? otherId).trim()
        const presenceKey = vendorUserId
        const presence = presenceKey ? presenceByUserId.get(presenceKey) : undefined
        const isOnline = typeof presence?.isOnline === 'boolean' ? presence.isOnline : (Math.random() > 0.5)

        const vStats = vendorUserId ? vendorStatsByUserId.get(vendorUserId) : undefined
        const ratingCandidate = Number(
          (vStats as any)?.average_rating ??
            (vStats as any)?.avg_rating ??
            (vStats as any)?.rating ??
            0
        )
        const resolvedRating = Number.isFinite(ratingCandidate) && ratingCandidate > 0 ? ratingCandidate : 0

        const reviewsCandidate = Number((vStats as any)?.total_reviews ?? (vStats as any)?.reviews_count ?? (vStats as any)?.reviews ?? 0)
        const reviewsCount = Number.isFinite(reviewsCandidate) && reviewsCandidate >= 0 ? reviewsCandidate : undefined

        const responseRaw =
          (vStats as any)?.response_time ??
          (vStats as any)?.avg_response_time ??
          (vStats as any)?.response_time_minutes ??
          null

        const responseMinutes = typeof responseRaw === 'number' ? responseRaw : Number(responseRaw)
        const lastSeenAt = presence?.lastSeenAt ?? null

        const responseTime = (() => {
          if (Number.isFinite(responseMinutes) && responseMinutes > 0) {
            return `${responseMinutes.toFixed(1)} min`
          }

          if (isOnline) {
            return 'En ligne'
          }

          if (typeof lastSeenAt === 'string' && lastSeenAt.trim()) {
            const ts = new Date(lastSeenAt).getTime()
            if (Number.isFinite(ts)) {
              const diffMs = Date.now() - ts
              const mins = Math.max(0, Math.round(diffMs / (1000 * 60)))
              if (mins < 60) return `${mins} min`
              const hours = Math.max(1, Math.round(mins / 60))
              if (hours < 24) return `${hours} h`
              const days = Math.max(1, Math.round(hours / 24))
              return `${days} j`
            }
          }

          return '-'
        })()

        return {
          name,
          avatar,
          rating: resolvedRating,
          ...(typeof reviewsCount === 'number' ? { reviewsCount } : {}),
          totalSales: 1000,
          responseTime,
          location: 'Ville, Pays',
          phone: '+229 12345678',
          email: otherId ? `vendeur${otherId.slice(0, 8)}@example.com` : 'vendeur@example.com',
          isOnline,
          ...(typeof lastSeenAt === 'string' || lastSeenAt === null ? { lastSeenAt } : {}),
          ...(vendorUserId ? { userId: vendorUserId } : {}),
          ...(otherId ? { partnerId: otherId } : {}),
          lastMessage: 'Merci pour votre intérêt !'
        }
      })
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des vendeurs:', error);
      return [];
    }
  }

  // Récupérer les produits du chat
  static async getChatProducts(userId: string): Promise<any[]> {
    try {
      // Récupérer la liste des vendeurs réellement impliqués dans des conversations.
      const { data: chats, error: chatsError } = await supabase
        .from('user_chats')
        .select('participant1_id,participant2_id')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)

      if (chatsError) {
        console.error('❌ Erreur lors de la récupération des chats (produits du chat):', chatsError)
        return []
      }

      const partnerIds = Array.from(
        new Set(
          (chats ?? [])
            .map((chat: any) => {
              const p1 = String(chat?.participant1_id ?? '').trim()
              const p2 = String(chat?.participant2_id ?? '').trim()
              if (p1 === userId) return p2
              if (p2 === userId) return p1
              return ''
            })
            .filter(Boolean)
        )
      )

      if (partnerIds.length === 0) {
        return []
      }

      const vendorIdCandidates = new Set<string>(partnerIds)
      try {
        const { data: profileRows } = await supabase
          .from('user_profiles')
          .select('id,user_id')
          .in('user_id', partnerIds)

        ;(profileRows ?? []).forEach((row: any) => {
          const pid = String(row?.id ?? '').trim()
          const uid = String(row?.user_id ?? '').trim()
          if (pid) vendorIdCandidates.add(pid)
          if (uid) vendorIdCandidates.add(uid)
        })
      } catch {
      }

      // Récupérer les produits actifs des vendeurs liés aux conversations.
      // Limite haute de sécurité: évite les charges excessives tout en empêchant la troncature (ex: 1/2 produits).
      const SAFE_LIMIT = 500

      const { data: chatProducts, error } = await supabase
        .from('user_products')
        .select(`
          id,
          name,
          price,
          images,
          rating,
          is_featured,
          vendor_id,
          vendor:users!vendor_id(
            id,
            user_profiles(
              first_name,
              last_name,
              short_code,
              preferences
            )
          )
        `)
        .eq('is_active', true)
        .in('vendor_id', Array.from(vendorIdCandidates))
        .limit(SAFE_LIMIT)

      if (error) {
        console.error('❌ Erreur lors de la récupération des produits du chat:', error);
        return [];
      }

      // Si pas de produits, retourner un tableau vide
      if (!chatProducts || chatProducts.length === 0) {
        console.log('ℹ️ Aucun produit de chat trouvé, tableau vide retourné')
        return [];
      }

      // Fallback: certains produits ont vendor_id = user_profiles.id au lieu de users.id.
      // Dans ce cas la jointure users!vendor_id ne renvoie pas de user_profiles.
      // On récupère donc les profils par id OU user_id.
      const vendorIds: string[] = Array.from(
        new Set(
          (chatProducts ?? [])
            .map((p: any) => String(p?.vendor_id ?? '').trim())
            .filter(Boolean)
        )
      )

      const profileByAnyId = new Map<string, any>()
      const resolvedUserIds = new Set<string>(vendorIds)
      if (vendorIds.length > 0) {
        const [byIdRes, byUserIdRes] = await Promise.all([
          supabase.from('user_profiles').select('id,user_id,first_name,last_name,short_code,preferences').in('id', vendorIds),
          supabase.from('user_profiles').select('id,user_id,first_name,last_name,short_code,preferences').in('user_id', vendorIds)
        ])

        if (byIdRes.error) {
          console.warn('⚠️ getChatProducts: fallback user_profiles(id) échoué:', byIdRes.error)
        }
        if (byUserIdRes.error) {
          console.warn('⚠️ getChatProducts: fallback user_profiles(user_id) échoué:', byUserIdRes.error)
        }

        const profiles = [...(byIdRes.data ?? []), ...(byUserIdRes.data ?? [])]

        ;(profiles ?? []).forEach((row: any) => {
          const pid = String(row?.id ?? '').trim()
          const uid = String(row?.user_id ?? '').trim()
          const entry = row
          if (pid) profileByAnyId.set(pid, entry)
          if (uid) profileByAnyId.set(uid, entry)
          if (uid) resolvedUserIds.add(uid)
        })
      }

      // Transformer les données
      return (chatProducts || []).map((product: any) => {
        const joinProfile = Array.isArray(product?.vendor?.user_profiles)
          ? product.vendor.user_profiles[0]
          : product?.vendor?.user_profiles

        const fallbackProfile = profileByAnyId.get(String(product?.vendor_id ?? '').trim())
        const profile = joinProfile || fallbackProfile

        const fallbackId = String(product?.vendor_id ?? product?.vendor?.id ?? '').trim()
        const vendorName = computeProfileDisplayName(profile, fallbackId)

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency ?? 'XOF',
          images: Array.isArray(product.images) ? product.images : [],
          image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '/placeholder.jpg',
          vendor_id: product.vendor_id ?? product?.vendor?.id ?? null,
          vendor_name: vendorName || null,
          rating: product.rating || 0,
          is_featured: product.is_featured || false
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits du chat:', error);
      return [];
    }
  }

  // Récupérer les produits de boutique
  static async getShopProducts(userId: string): Promise<any[]> {
    try {
      // Récupérer tous les produits actifs avec informations détaillées
      const { data: products, error } = await supabase
        .from('user_products')
        .select('id, name, price, original_price, images, rating, total_reviews, is_featured, category, stock_quantity')
        .eq('is_active', true)
        .order('total_sales', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Erreur lors de la récupération des produits de boutique:', error);
        return [];
      }

      // Si pas de produits, retourner un tableau vide
      if (!products || products.length === 0) {
        console.log('ℹ️ Aucun produit de boutique trouvé, tableau vide retourné')
        return [];
      }

      // Transformer les données
      return (products || []).map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.original_price || product.price,
        image: product.images?.[0] || '/placeholder.jpg',
        seller: 'Vendeur Premium',
        rating: product.rating || 0,
        reviews: product.total_reviews || 0,
        isPromoted: product.is_featured || false,
        category: product.category || 'Général',
        stock: product.stock_quantity || 0,
        discount: product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits de boutique:', error);
      return [];
    }
  }

  // Récupérer les retraits
  static async getWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('point_withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('❌ Erreur lors de la récupération des retraits:', error)
        return []
      }

      return data ?? []
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des retraits:', error);
      return [];
    }
  }

  // Récupérer l'historique des points
  static async getPointsHistory(userId: string): Promise<PointsTransaction[]> {
    try {
      const [{ data: loyaltyRow }, { data, error }, { data: transferRows, error: transferErr }] = await Promise.all([
        supabase
          .from('loyalty_points')
          .select('points_balance')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
        supabase
          .from('point_transfer_requests')
          .select('*')
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(200)
      ])

      if (error) {
        console.error("❌ Erreur lors de la récupération de l'historique des points:", error)
        return []
      }

      const rows = (data ?? []) as RawPointsTransaction[]
      const transfers = (transferErr ? [] : (transferRows ?? [])) as PointTransferRequest[]
      const startingBalance = Number(loyaltyRow?.points_balance || 0)
      let runningBalance = startingBalance

      const transferEvents = transfers
        .filter(tr => tr && tr.id)
        .filter(tr => tr.sender_id === userId || tr.recipient_id === userId)
        .filter(tr => {
          const trPoints = Number(tr.points_amount || 0)
          const trCreated = new Date(tr.created_at).getTime()

          return !rows.some(row => {
            const rowType = String(row.type || '').toLowerCase()
            if (rowType !== 'transfer' && rowType !== 'transfer_in') return false

            const ref = (row as any).reference_id ?? row.reference_id
            if (ref && String(ref) === String(tr.id)) return true

            const rowPoints = Number(row.points || 0)
            const rowCreated = new Date(row.created_at).getTime()
            return rowPoints === trPoints && Math.abs(rowCreated - trCreated) < 5000
          })
        })
        .map(tr => {
          const isSender = tr.sender_id === userId
          const counterparty = isSender
            ? ((tr.metadata as any)?.recipient_name || (tr.metadata as any)?.recipient_email || 'un utilisateur')
            : 'un utilisateur'

          return {
            id: `tr_${tr.id}`,
            rawType: isSender ? 'transfer' : 'transfer_in',
            points: Number(tr.points_amount || 0),
            description: isSender ? `Transfert vers ${counterparty}` : 'Transfert reçu',
            createdAt: tr.created_at
          }
        })

      const txEvents = rows.map(row => ({
        id: row.id,
        rawType: String(row.type || '').toLowerCase(),
        points: Number(row.points || 0),
        description: row.description ?? String(row.type || ''),
        createdAt: row.created_at
      }))

      const events = [...txEvents, ...transferEvents].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const debitTypes = new Set<string>([
        'spend',
        'exchange',
        'withdrawal',
        'expire',
        'transfer',
        'reward_redemption',
        'transfer_fee',
        'exchange_fee',
        'withdrawal_fee'
      ])

      const creditTypes = new Set<string>([
        'earn',
        'share',
        'bonus',
        'adjustment'
      ])

      const isWithdrawalType = (type: string) => type === 'withdrawal' || type === 'withdrawal_fee'

      return events.map((event) => {
        const rawType = event.rawType
        const points = event.points

        const signedAmount = debitTypes.has(rawType)
          ? -Math.abs(points)
          : creditTypes.has(rawType)
            ? Math.abs(points)
            : Math.abs(points)

        const uiType: PointsTransaction['type'] = isWithdrawalType(rawType)
          ? 'withdrawn'
          : signedAmount >= 0
            ? 'earned'
            : 'used'

        const item: PointsTransaction = {
          id: event.id,
          type: uiType,
          amount: signedAmount,
          description: event.description ?? rawType,
          date: event.createdAt,
          balance: Math.max(runningBalance, 0)
        }

        runningBalance = runningBalance - signedAmount
        return item
      })
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  static async getPointsOffers(): Promise<PointsOffer[]> {
    try {
      // TODO: connecter la table réelle des offres de points lorsque définie
      console.log('ℹ️ Aucune offre de points implémentée, tableau vide retourné')
      return []
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des offres de points:', error)
      return []
    }
  }

  // Compter les messages non lus
  static async getUnreadMessagesCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .neq('status', 'deleted')

      if (error) {
        console.error('❌ Erreur lors du comptage des messages non lus:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('❌ Erreur inattendue lors du comptage des messages non lus:', error)
      return 0
    }
  }

  // Compter les chats non lus
  static async getUnreadChatsCount(userId: string): Promise<number> {
    try {
      console.log('🔍 Comptage des chats non lus pour l\'utilisateur:', userId)
      
      // D'abord, récupérer tous les chats de l'utilisateur
      const { data: userChats, error: chatsError } = await supabase
        .from('user_chats')
        .select('id')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)

      if (chatsError) {
        console.error('❌ Erreur lors de la récupération des chats:', chatsError)
        return 0
      }

      console.log('📱 Chats trouvés:', userChats?.length || 0)

      if (!userChats || userChats.length === 0) {
        console.log('ℹ️ Aucun chat trouvé pour l\'utilisateur')
        return 0
      }

      // Extraire les IDs des chats
      const chatIds = userChats.map(chat => chat.id)
      console.log('🆔 IDs des chats:', chatIds)

      // Compter les messages non lus dans ces chats
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('chat_id', chatIds)
        .eq('is_read', false)
        .neq('sender_id', userId) // Exclure les messages envoyés par l'utilisateur

      if (error) {
        console.error('❌ Erreur lors du comptage des messages de chat non lus:', error)
        return 0
      }

      console.log('✅ Messages de chat non lus comptés:', count || 0)
      return count || 0
    } catch (error) {
      console.error('❌ Erreur inattendue lors du comptage des chats non lus:', error)
      return 0
    }
  }

  static async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      const [
        user,
        userProfile,
        loyaltyPoints,
        userStats,
        vendorStats,
        orders,
        messages,
        notifications,
        chats,
        products,
        recommendedProducts,
        recommendedSellers,
        recommendedPromotions,
        promotions,
        sharedProducts,
        sellers,
        chatProducts,
        shopProducts,
        withdrawals,
        pointsHistory,
        unreadMessages,
        unreadChats,
        pointSettings,
        pointsSummary,
        reviews,
        cartItems,
        wishlistItems,
        systemSettings
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('loyalty_points').select('*').eq('user_id', userId).single(),
        supabase.from('user_stats').select('*').eq('id', userId).single(),
        supabase.from('vendor_stats').select('*').eq('id', userId).single(),
        this.getUserOrders(userId),
        this.getUserMessages(userId),
        this.getUserNotifications(userId),
        this.getUserChats(userId),
        this.getUserProducts(userId),
        this.getRecommendedProducts(userId),
        this.getRecommendedSellers(userId),
        this.getRecommendedPromotions(userId),
        this.getPromotions(userId),
        this.getSharedProducts(userId),
        this.getSellers(userId),
        this.getChatProducts(userId),
        this.getShopProducts(userId),
        this.getWithdrawals(userId),
        this.getPointsHistory(userId),
        this.getUnreadMessagesCount(userId),
        this.getUnreadChatsCount(userId),
        ClientPointsService.getPointsConfiguration(userId).catch(() => null),
        ClientPointsService.getPointsSummary(userId).catch(() => null),
        supabase.from('product_reviews').select('*').eq('user_id', userId),
        supabase.from('user_carts').select('*').eq('user_id', userId),
        supabase.from('user_wishlists').select('*').eq('user_id', userId),
        supabase.from('system_settings').select('*').eq('is_public', true)
      ])

      const resolvedUser = user.data ?? null
      const resolvedUserProfile = userProfile.data ?? null
      const resolvedLoyaltyPoints = loyaltyPoints.data ?? null
      const resolvedUserStats = userStats.data ?? null
      const resolvedVendorStats = vendorStats.data ?? null
      const resolvedReviews = reviews.data ?? []
      const resolvedCartItems = cartItems.data ?? []
      const resolvedWishlistItems = wishlistItems.data ?? []
      const resolvedSystemSettings = systemSettings.data ?? []

      const chatMessages = await this.getChatMessages(chats.map(chat => chat.id))

            // Total commandes EXACT (indépendant de l'ordre d'affichage de getUserOrders)
      const { count: allOrdersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', userId)

      // Montant total dépensé EXACT (toutes commandes non annulées, colonnes légères)
      const { data: allOrderAmounts } = await supabase
        .from('orders')
        .select('status, total_amount, final_total')
        .eq('customer_id', userId)

      // Si le client peut lire la table (RLS permissive), on utilise la lecture
      // dédiée (exacte, indépendante de la limite de 200 de getUserOrders).
      // Sinon on dérive les totaux de la liste fallback (getUserOrders), qui
      // elle provient de l'API admin et est fiable.
      const clientOrdersCount = Number(allOrdersCount ?? 0) || 0
      const clientAmounts = Array.isArray(allOrderAmounts) ? allOrderAmounts : []

      const totalSpentExact =
        clientAmounts.length > 0
          ? clientAmounts.reduce((sum: number, row: any) => {
              const status = String(row?.status ?? '').trim().toLowerCase()
              if (status === 'cancelled' || status === 'canceled') return sum
              const raw = row?.final_total != null ? row.final_total : row?.total_amount
              return sum + (Number(raw ?? 0) || 0)
            }, 0)
          : orders.reduce((sum: number, order: any) => {
              const status = String(order.status ?? '').trim().toLowerCase()
              if (status === 'cancelled' || status === 'canceled') return sum
              const raw = order.final_total != null ? order.final_total : order.total_amount
              return sum + (Number(raw ?? 0) || 0)
            }, 0)

      const totalOrdersExact = Math.max(
        clientOrdersCount > 0 ? clientOrdersCount : 0,
        orders.length
      )

      const stats = this.calculateStats(
        orders,
        products,
        resolvedLoyaltyPoints,
        unreadMessages,
        unreadChats,
        notifications,
        sharedProducts,
        totalOrdersExact,
        totalSpentExact,
        // Valeurs réelles Supabase pour les statistiques de points
        Number(resolvedLoyaltyPoints?.points_spent ?? 0) || 0,
        (withdrawals ?? []).reduce((sum: number, w: any) => sum + (Number(w?.points_amount ?? 0) || 0), 0),
        (pointSettings as any)?.fees?.withdrawal?.percentage ?? (pointSettings as any)?.fees?.withdrawal?.flat ?? 0,
        (pointsHistory ?? []).filter((t: any) => String(t?.type ?? '').toLowerCase() === 'expire')
          .reduce((sum: number, t: any) => sum + (Number(t?.amount ?? 0) || 0), 0),
        (pointSettings as any)?.limits?.withdrawal?.min ?? 0
      )

      const recentActivities = this.buildRecentActivities(orders, pointsHistory, sharedProducts)

      return {
        user: resolvedUser,
        userProfile: resolvedUserProfile,
        loyaltyPoints: resolvedLoyaltyPoints,
        userStats: resolvedUserStats,
        vendorStats: resolvedVendorStats,
        orders,
        totalOrders: totalOrdersExact,
        totalRevenue: totalSpentExact,
        messages,
        notifications,
        unreadMessages,
        unreadNotifications: notifications.filter(notification => !notification.is_read).length,
        chats,
        chatMessages,
        products,
        promotions,
        reviews: resolvedReviews,
        cartItems: resolvedCartItems,
        wishlistItems: resolvedWishlistItems,
        systemSettings: resolvedSystemSettings,
        pointSettings,
        pointsSummary,
        recommendedProducts,
        recommendedSellers,
        recommendedPromotions,
        sharedProducts,
        sellers,
        chatProducts,
        shopProducts,
        pointsHistory,
        withdrawals,
        recentActivities,
        stats
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données du tableau de bord:', error)
      throw error instanceof Error ? error : new Error('Erreur lors de la récupération des données du tableau de bord')
    }
  }

  // Calculer les statistiques
  private static calculateStats(
    orders: UserOrder[], 
    products: UserProduct[], 
    loyaltyPoints: LoyaltyPoints | null,
    unreadMessages: number,
    unreadChats: number,
    notifications: UserNotification[],
    sharedProducts: SharedProduct[],
    totalOrdersOverride?: number,
    totalSpentOverride?: number,
    pointsUsedOverride?: number,
    pointsWithdrawnOverride?: number,
    withdrawalFeeOverride?: number,
    expiredPointsOverride?: number,
    withdrawalLimitOverride?: number
  ): DashboardStats {
    const totalOrders = totalOrdersOverride ?? orders.length
    const totalProducts = products.length
    const totalPoints = loyaltyPoints?.points_balance || 0

    // Total dépensé : exclut les commandes annulées (ou utilise le total exact fourni)
    const totalRevenue =
      totalSpentOverride !== undefined
        ? totalSpentOverride
        : orders.reduce((sum, order) => {
            const status = String(order.status ?? '').trim().toLowerCase()
            if (status === 'cancelled' || status === 'canceled') return sum
            return sum + (order.total_amount || 0)
          }, 0)
    const totalShares = sharedProducts.reduce((sum, product) => sum + product.totalShares, 0)
    
    // Note moyenne des produits
    const productsWithRating = products.filter(p => p.rating && p.rating > 0)
    const averageRating = productsWithRating.length > 0 
      ? productsWithRating.reduce((sum, p) => sum + (p.rating || 0), 0) / productsWithRating.length
      : 0

    // Notifications en attente
    const pendingNotifications = notifications.filter(n => !n.is_read).length

    return {
      totalOrders,
      totalProducts,
      totalPoints,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      unreadMessages,
      unreadChats,
      pendingNotifications,
      totalShares,
      // Statistiques supplémentaires issues de données réelles Supabase
      pointsUsed: Number.isFinite(pointsUsedOverride ?? NaN) && (pointsUsedOverride ?? 0) >= 0 ? (pointsUsedOverride ?? 0) : 0,
      pointsWithdrawn: Number.isFinite(pointsWithdrawnOverride ?? NaN) && (pointsWithdrawnOverride ?? 0) >= 0 ? (pointsWithdrawnOverride ?? 0) : 0,
      withdrawalThreshold: Number.isFinite(withdrawalLimitOverride ?? NaN) && (withdrawalLimitOverride ?? 0) >= 0 ? (withdrawalLimitOverride ?? 0) : 0,
      withdrawalFee: Number.isFinite(withdrawalFeeOverride ?? NaN) && (withdrawalFeeOverride ?? 0) >= 0 ? (withdrawalFeeOverride ?? 0) : 0,
      expiredPoints: Number.isFinite(expiredPointsOverride ?? NaN) && (expiredPointsOverride ?? 0) >= 0 ? (expiredPointsOverride ?? 0) : 0,
      avgRating: Math.round(averageRating * 10) / 10
    }
  }

  /**
   * Construit la liste des "Activités Récentes" à partir des vraies données
   * (commandes, points, partages) au lieu d'un tableau vide codé en dur.
   */
  private static buildRecentActivities(
    orders: UserOrderWithItems[],
    pointsHistory: PointsTransaction[],
    sharedProducts: SharedProduct[]
  ): RecentActivity[] {
    const activities: RecentActivity[] = []

    for (const order of (orders ?? []).slice(0, 5)) {
      const createdAt = String(order.created_at ?? '')
      if (!createdAt) continue
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'Nouvelle commande',
        description: `${order.order_number ?? `ORDER-${String(order.id).slice(0, 8)}`} • ${this.formatRelativeTime(createdAt)}`,
        time: this.formatActivityTime(createdAt),
        created_at: createdAt
      })
    }

    for (const tx of (pointsHistory ?? []).slice(0, 5)) {
      const date = String(tx.date ?? '')
      if (!date) continue
      const title =
        tx.type === 'earned'
          ? 'Points gagnés'
          : tx.type === 'used'
            ? 'Points utilisés'
            : 'Points retirés'
      activities.push({
        id: `points-${tx.id}`,
        type: 'points',
        title,
        description: `${tx.description || 'Transaction de points'} (+${Number(tx.amount) || 0} pts)`,
        time: this.formatActivityTime(date),
        created_at: date
      })
    }

    for (const sp of (sharedProducts ?? []).slice(0, 5)) {
      const date = String(sp.sharedAt ?? '')
      if (!date) continue
      activities.push({
        id: `share-${sp.id}`,
        type: 'share',
        title: 'Produit partagé',
        description: `${sp.productName} • ${Number(sp.totalShares) || 0} partage(s)`,
        time: this.formatActivityTime(date),
        created_at: date
      })
    }

    return activities
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 6)
  }

  private static formatActivityTime(value: string | null): string {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    const diffMs = Date.now() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return "À l'instant"
    if (mins < 60) return `Il y a ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Il y a ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Il y a ${days} j`
    return d.toLocaleDateString('fr-FR')
  }

  private static formatRelativeTime(date: string | null): string {
    if (!date) {
      return '-'
    }

    const now = new Date()
    const target = new Date(date)
    const diffMs = target.getTime() - now.getTime()
    const diffMinutes = Math.round(diffMs / (1000 * 60))

    const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })
    const ranges: Array<{ unit: Intl.RelativeTimeFormatUnit; value: number }> = [
      { unit: 'year', value: diffMinutes / (60 * 24 * 365) },
      { unit: 'month', value: diffMinutes / (60 * 24 * 30) },
      { unit: 'week', value: diffMinutes / (60 * 24 * 7) },
      { unit: 'day', value: diffMinutes / (60 * 24) },
      { unit: 'hour', value: diffMinutes / 60 },
      { unit: 'minute', value: diffMinutes }
    ]

    for (const range of ranges) {
      const rounded = Math.round(range.value)
      if (Math.abs(rounded) >= 1) {
        return rtf.format(rounded, range.unit)
      }
    }

    return "À l'instant"
  }
}

// Hook personnalisé pour utiliser le service dashboard
export const useDashboardData = (userId: string | null) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setData(null)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const dashboardData = await DashboardService.getDashboardData(userId)
        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inattendue')
        console.error('❌ Erreur dans useDashboardData:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const refreshData = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await DashboardService.getDashboardData(userId)
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
      console.error('❌ Erreur lors du rafraîchissement:', err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refreshData }
}
