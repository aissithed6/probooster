"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAdminPointSettings, DEFAULT_ADMIN_POINT_SETTINGS, AdminPointSettings } from '@/lib/services/point-settings-service'
import { Tables, UserStats, VendorStats } from '@/lib/supabase'

// Types pour les données du tableau de bord
export interface DashboardData {
  // Données utilisateur
  user: Tables<'users'> | null
  userProfile: Tables<'user_profiles'> | null
  loyaltyPoints: Tables<'loyalty_points'> | null
  
  // Statistiques
  userStats: UserStats | null
  vendorStats: VendorStats | null
  
  // Données des produits
  products: Tables<'products'>[]
  totalProducts: number
  
  // Données des commandes
  orders: Tables<'user_orders'>[]
  totalOrders: number
  totalRevenue: number
  
  // Données des messages et notifications
  messages: Tables<'user_messages'>[]
  notifications: Tables<'user_notifications'>[]
  unreadMessages: number
  unreadNotifications: number
  
  // Données des conversations et chats
  conversations: Tables<'user_chats'>[]
  chatMessages: Tables<'chat_messages'>[]
  
  // Données des promotions et avis
  promotions: Tables<'promotions'>[]
  reviews: Tables<'product_reviews'>[]
  
  // Données du panier et wishlist
  cartItems: Tables<'user_carts'>[]
  wishlistItems: Tables<'user_wishlists'>[]
  
  // Paramètres système
  systemSettings: Tables<'system_settings'>[]
  pointSettings: AdminPointSettings
  
  // État de chargement
  isLoading: boolean
  error: string | null
}

export function useDashboardData(userId?: string) {
  const [data, setData] = useState<DashboardData>({
    user: null,
    userProfile: null,
    loyaltyPoints: null,
    userStats: null,
    vendorStats: null,
    products: [],
    totalProducts: 0,
    orders: [],
    totalOrders: 0,
    totalRevenue: 0,
    messages: [],
    notifications: [],
    unreadMessages: 0,
    unreadNotifications: 0,
    conversations: [],
    chatMessages: [],
    promotions: [],
    reviews: [],
    cartItems: [],
    wishlistItems: [],
    systemSettings: [],
    pointSettings: {
      ...DEFAULT_ADMIN_POINT_SETTINGS,
      socialSharePerNetwork: { ...DEFAULT_ADMIN_POINT_SETTINGS.socialSharePerNetwork },
      categoryBonuses: { ...DEFAULT_ADMIN_POINT_SETTINGS.categoryBonuses },
      fees: {
        transfer: { ...DEFAULT_ADMIN_POINT_SETTINGS.fees.transfer },
        exchange: { ...DEFAULT_ADMIN_POINT_SETTINGS.fees.exchange },
        withdrawal: { ...DEFAULT_ADMIN_POINT_SETTINGS.fees.withdrawal },
      }
    },
    isLoading: true,
    error: null
  })

  useEffect(() => {
    if (!userId) {
      setData(prev => ({ ...prev, isLoading: false }))
      return
    }

    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }))

        // Récupérer les données utilisateur de base
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError) throw userError

        // Récupérer le profil utilisateur
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (profileError && profileError.code !== 'PGRST116') throw profileError

        // Récupérer les points de fidélité
        const { data: loyaltyPoints, error: pointsError } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (pointsError && pointsError.code !== 'PGRST116') throw pointsError

        // Récupérer les statistiques utilisateur
        const { data: userStats, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('id', userId)
          .single()

        if (statsError && statsError.code !== 'PGRST116') throw statsError

        // Récupérer les statistiques vendeur si applicable
        let vendorStats = null
        if (user?.role === 'vendor') {
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendor_stats')
            .select('*')
            .eq('id', userId)
            .single()

          if (!vendorError) vendorStats = vendorData
        }

        // Récupérer les produits (pour les vendeurs)
        let products: Tables<'products'>[] = []
        let totalProducts = 0
        if (user?.role === 'vendor') {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('vendor_id', userId)
            .eq('is_active', true)

          if (!productsError) {
            products = productsData || []
            totalProducts = products.length
          }
        }

        // Récupérer les commandes
        const { data: orders, error: ordersError } = await supabase
          .from('user_orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (ordersError && ordersError.code !== 'PGRST116') throw ordersError

        const totalOrders = orders?.length || 0
        const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        // Récupérer les messages
        const { data: messages, error: messagesError } = await supabase
          .from('user_messages')
          .select('*')
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false })

        if (messagesError && messagesError.code !== 'PGRST116') throw messagesError

        // Récupérer les notifications
        const { data: notifications, error: notificationsError } = await supabase
          .from('user_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (notificationsError && notificationsError.code !== 'PGRST116') throw notificationsError

        const unreadMessages = messages?.filter(msg => !msg.is_read && msg.recipient_id === userId).length || 0
        const unreadNotifications = notifications?.filter(notif => !notif.is_read).length || 0

        // Récupérer les conversations
        const { data: conversations, error: conversationsError } = await supabase
          .from('user_chats')
          .select('*')
          .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
          .eq('is_active', true)

        if (conversationsError && conversationsError.code !== 'PGRST116') throw conversationsError

        // Récupérer les messages de chat
        let chatMessages: Tables<'chat_messages'>[] = []
        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(conv => conv.id)
          const { data: chatData, error: chatError } = await supabase
            .from('chat_messages')
            .select('*')
            .in('chat_id', conversationIds)
            .order('created_at', { ascending: false })
            .limit(100)

          if (!chatError) chatMessages = chatData || []
        }

        // Récupérer les promotions actives
        const { data: promotions, error: promotionsError } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString())

        if (promotionsError && promotionsError.code !== 'PGRST116') throw promotionsError

        // Récupérer les avis
        const { data: reviews, error: reviewsError } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('user_id', userId)

        if (reviewsError && reviewsError.code !== 'PGRST116') throw reviewsError

        // Récupérer le panier
        const { data: cartItems, error: cartError } = await supabase
          .from('user_carts')
          .select('*')
          .eq('user_id', userId)

        if (cartError && cartError.code !== 'PGRST116') throw cartError

        // Récupérer la wishlist
        const { data: wishlistItems, error: wishlistError } = await supabase
          .from('user_wishlists')
          .select('*')
          .eq('user_id', userId)

        if (wishlistError && wishlistError.code !== 'PGRST116') throw wishlistError

        // Récupérer les paramètres système publics
        const { data: systemSettings, error: settingsError } = await supabase
          .from('system_settings')
          .select('*')
          .eq('is_public', true)

        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError

        // Récupérer la configuration des points
        const adminPointSettings = await fetchAdminPointSettings()

        // Mettre à jour l'état avec toutes les données
        setData({
          user,
          userProfile,
          loyaltyPoints,
          userStats,
          vendorStats,
          products: products || [],
          totalProducts,
          orders: orders || [],
          totalOrders,
          totalRevenue,
          messages: messages || [],
          notifications: notifications || [],
          unreadMessages,
          unreadNotifications,
          conversations: conversations || [],
          chatMessages: chatMessages || [],
          promotions: promotions || [],
          reviews: reviews || [],
          cartItems: cartItems || [],
          wishlistItems: wishlistItems || [],
          systemSettings: systemSettings || [],
          pointSettings: {
            ...adminPointSettings,
            socialSharePerNetwork: { ...adminPointSettings.socialSharePerNetwork },
            categoryBonuses: { ...adminPointSettings.categoryBonuses },
            fees: {
              transfer: { ...adminPointSettings.fees.transfer },
              exchange: { ...adminPointSettings.fees.exchange },
              withdrawal: { ...adminPointSettings.fees.withdrawal },
            },
          },
          isLoading: false,
          error: null
        })

      } catch (error) {
        console.error('Erreur lors de la récupération des données du tableau de bord:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }))
      }
    }

    fetchDashboardData()
  }, [userId])

  // Fonction de rafraîchissement
  const refreshData = () => {
    if (userId) {
      setData(prev => ({ ...prev, isLoading: true }))
      // Le useEffect se déclenchera automatiquement
    }
  }

  return { ...data, refreshData }
}
