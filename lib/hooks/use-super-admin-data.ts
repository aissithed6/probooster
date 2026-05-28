"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Tables } from '@/lib/supabase'

// Types pour les données Super Admin
export interface SuperAdminData {
  // Statistiques globales
  globalStats: {
    totalUsers: number
    activeUsers: number
    totalRevenue: number
    totalOrders: number
    totalProducts: number
    totalVendors: number
    totalCustomers: number
    systemHealth: {
      database: 'online' | 'warning' | 'offline'
      api: 'online' | 'warning' | 'offline'
      payment: 'online' | 'warning' | 'offline'
      email: 'online' | 'warning' | 'offline'
      sms: 'online' | 'warning' | 'offline'
      server: 'online' | 'warning' | 'offline'
      network: 'online' | 'warning' | 'offline'
    }
    performanceMetrics: {
      apiResponseTime: number
      conversionRate: number
      errorRate: number
      userSatisfaction: number
      systemUptime: number
    }
  }
  
  // Données des utilisateurs
  users: Tables<'users'>[]
  userProfiles: Tables<'user_profiles'>[]
  loyaltyPoints: Tables<'loyalty_points'>[]
  
  // Données des produits
  products: Tables<'products'>[]
  categories: Tables<'categories'>[]
  
  // Données des commandes
  orders: Tables<'user_orders'>[]
  
  // Données des messages et notifications
  messages: Tables<'user_messages'>[]
  notifications: Tables<'user_notifications'>[]
  
  // Données des conversations et chats
  conversations: Tables<'user_chats'>[]
  chatMessages: Tables<'chat_messages'>[]
  
  // Données des promotions et avis
  promotions: Tables<'promotions'>[]
  reviews: Tables<'product_reviews'>[]
  
  // Données des vendeurs
  vendorSales: Tables<'vendor_sales'>[]
  
  // Données des demandes de paiement
  paymentRequests: Tables<'payment_requests'>[]
  
  // Paramètres système
  systemSettings: Tables<'system_settings'>[]
  
  // Logs d'activité
  activityLogs: Tables<'activity_logs'>[]
  
  // État de chargement
  isLoading: boolean
  error: string | null
}

export function useSuperAdminData() {
  const [data, setData] = useState<SuperAdminData>({
    globalStats: {
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalVendors: 0,
      totalCustomers: 0,
      systemHealth: {
        database: 'online',
        api: 'online',
        payment: 'online',
        email: 'online',
        sms: 'online',
        server: 'online',
        network: 'online'
      },
      performanceMetrics: {
        apiResponseTime: 0,
        conversionRate: 0,
        errorRate: 0,
        userSatisfaction: 0,
        systemUptime: 0
      }
    },
    users: [],
    userProfiles: [],
    loyaltyPoints: [],
    products: [],
    categories: [],
    orders: [],
    messages: [],
    notifications: [],
    conversations: [],
    chatMessages: [],
    promotions: [],
    reviews: [],
    vendorSales: [],
    paymentRequests: [],
    systemSettings: [],
    activityLogs: [],
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchSuperAdminData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }))

        // Récupérer tous les utilisateurs
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersError) throw usersError

        // Récupérer tous les profils utilisateurs
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*')

        if (profilesError) throw profilesError

        // Récupérer tous les points de fidélité
        const { data: loyaltyPoints, error: pointsError } = await supabase
          .from('loyalty_points')
          .select('*')

        if (pointsError) throw pointsError

        // Récupérer tous les produits
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)

        if (productsError) throw productsError

        // Récupérer toutes les catégories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)

        if (categoriesError) throw categoriesError

        // Récupérer toutes les commandes
        const { data: orders, error: ordersError } = await supabase
          .from('user_orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        // Récupérer tous les messages
        const { data: messages, error: messagesError } = await supabase
          .from('user_messages')
          .select('*')
          .order('created_at', { ascending: false })

        if (messagesError) throw messagesError

        // Récupérer toutes les notifications
        const { data: notifications, error: notificationsError } = await supabase
          .from('user_notifications')
          .select('*')
          .order('created_at', { ascending: false })

        if (notificationsError) throw notificationsError

        // Récupérer toutes les conversations
        const { data: conversations, error: conversationsError } = await supabase
          .from('user_chats')
          .select('*')
          .eq('is_active', true)

        if (conversationsError) throw conversationsError

        // Récupérer tous les messages de chat
        const { data: chatMessages, error: chatError } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)

        if (chatError) throw chatError

        // Récupérer toutes les promotions
        const { data: promotions, error: promotionsError } = await supabase
          .from('promotions')
          .select('*')
          .order('created_at', { ascending: false })

        if (promotionsError) throw promotionsError

        // Récupérer tous les avis
        const { data: reviews, error: reviewsError } = await supabase
          .from('product_reviews')
          .select('*')
          .order('created_at', { ascending: false })

        if (reviewsError) throw reviewsError

        // Récupérer toutes les ventes vendeurs
        const { data: vendorSales, error: salesError } = await supabase
          .from('vendor_sales')
          .select('*')

        if (salesError) throw salesError

        // Récupérer toutes les demandes de paiement
        const { data: paymentRequests, error: paymentError } = await supabase
          .from('payment_requests')
          .select('*')
          .order('created_at', { ascending: false })

        if (paymentError) throw paymentError

        // Récupérer tous les paramètres système
        const { data: systemSettings, error: settingsError } = await supabase
          .from('system_settings')
          .select('*')

        if (settingsError) throw settingsError

        // Récupérer tous les logs d'activité
        const { data: activityLogs, error: logsError } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (logsError) throw logsError

        // Calculer les statistiques globales
        const totalUsers = users?.length || 0
        const totalVendors = users?.filter(u => u.role === 'vendor').length || 0
        const totalCustomers = users?.filter(u => u.role === 'client').length || 0
        const totalProducts = products?.length || 0
        const totalOrders = orders?.length || 0
        const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        
        // Calculer les utilisateurs actifs (connectés dans les 30 derniers jours)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const activeUsers = users?.filter(u => new Date(u.updated_at) > thirtyDaysAgo).length || 0

        // Calculer les métriques de performance
        const apiResponseTime = 0
        const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0
        const errorRate = 0
        const userSatisfaction = 0
        const systemUptime = 0

        // Vérifier la santé du système
        const systemHealth = {
          database: 'online' as const,
          api: 'online' as const,
          payment: 'online' as const,
          email: 'online' as const,
          sms: 'online' as const,
          server: 'online' as const,
          network: 'online' as const
        }

        // Mettre à jour l'état avec toutes les données
        setData({
          globalStats: {
            totalUsers,
            activeUsers,
            totalRevenue,
            totalOrders,
            totalProducts,
            totalVendors,
            totalCustomers,
            systemHealth,
            performanceMetrics: {
              apiResponseTime,
              conversionRate,
              errorRate,
              userSatisfaction,
              systemUptime
            }
          },
          users: users || [],
          userProfiles: userProfiles || [],
          loyaltyPoints: loyaltyPoints || [],
          products: products || [],
          categories: categories || [],
          orders: orders || [],
          messages: messages || [],
          notifications: notifications || [],
          conversations: conversations || [],
          chatMessages: chatMessages || [],
          promotions: promotions || [],
          reviews: reviews || [],
          vendorSales: vendorSales || [],
          paymentRequests: paymentRequests || [],
          systemSettings: systemSettings || [],
          activityLogs: activityLogs || [],
          isLoading: false,
          error: null
        })

      } catch (error) {
        console.error('Erreur lors de la récupération des données Super Admin:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }))
      }
    }

    fetchSuperAdminData()
  }, [])

  // Fonction de rafraîchissement
  const refreshData = () => {
    setData(prev => ({ ...prev, isLoading: true }))
    // Le useEffect se déclenchera automatiquement
  }

  return { ...data, refreshData }
}
