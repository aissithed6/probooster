import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Configuration Supabase avec les nouvelles clés
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://csvvbcwvkqfhnjuldgow.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdnZiY3d2a3FmaG5qdWxkZ293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMjY3MzIsImV4cCI6MjA3MTgwMjczMn0.1UkHiQ_ZHTzaT_IAmnaq_sRd0D1djXV2CEMGq-DJeLU'

type SupabaseBrowserClient = SupabaseClient<any>

const globalForSupabase = globalThis as typeof globalThis & {
  __supabaseClient?: SupabaseBrowserClient
  __supabaseAdminClient?: SupabaseBrowserClient
  __supabaseAccessToken?: string | null
  __supabaseSession?: any | null
  __supabaseSessionPromise?: Promise<any | null>
  __supabaseAuthListenerInitialized?: boolean
  __supabaseAuthLockLastWarnAt?: Record<string, number>
}

/**
 * Lock best-effort pour GoTrue/Supabase Auth.
 *
 * Objectif:
 * - Éviter que les timeouts `Navigator LockManager` (ex: lock:*auth-token) déclenchent
 *   une erreur runtime (overlay Next.js) en environnement dev.
 * - Préserver le comportement normal quand le lock est disponible.
 *
 * Stratégie:
 * - Tenter `navigator.locks.request()` avec un timeout court.
 * - Si timeout/erreur: exécuter `fn()` sans lock et journaliser en warn.
 */
const createBestEffortAuthLock = () => {
  return async <T>(name: string, acquireTimeout: number, fn: () => Promise<T>): Promise<T> => {
    if (typeof window === 'undefined') {
      return await fn()
    }

    const locks = (navigator as any)?.locks
    if (!locks || typeof locks.request !== 'function') {
      return await fn()
    }

    const timeoutMs = Math.max(500, Math.min(Number(acquireTimeout) || 10_000, 2_500))

    try {
      const res = await Promise.race([
        locks.request(String(name), async () => await fn()),
        new Promise<never>((_resolve, reject) => {
          window.setTimeout(() => reject(new Error('Navigator LockManager timeout')), timeoutMs)
        })
      ])
      return res as T
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const key = String(name)
      const now = Date.now()
      const lastMap = (globalForSupabase.__supabaseAuthLockLastWarnAt ??= {})
      const last = typeof lastMap[key] === 'number' ? lastMap[key] : 0
      const shouldWarn = now - last > 15_000
      if (shouldWarn) {
        lastMap[key] = now
        if (msg.toLowerCase().includes('timeout')) {
          console.warn(`⚠️ Supabase Auth lock "${name}" timeout (${timeoutMs}ms). Fallback sans lock.`)
        } else {
          console.warn(`⚠️ Supabase Auth lock "${name}" échec. Fallback sans lock.`, error)
        }
      }
      return await fn()
    }
  }
}

const createBrowserSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      lock: createBestEffortAuthLock()
    }
  })

if (!globalForSupabase.__supabaseClient) {
  globalForSupabase.__supabaseClient = createBrowserSupabaseClient()
}

// Client Supabase pour le côté client
export const supabase = globalForSupabase.__supabaseClient

/**
 * Cache du token d'accès côté navigateur.
 * Objectif: éviter les appels répétitifs à supabase.auth.getSession() / refreshSession()
 * qui peuvent déclencher des AbortError (locks.js) en environnement dev.
 */
if (typeof window !== 'undefined' && !globalForSupabase.__supabaseAuthListenerInitialized) {
  globalForSupabase.__supabaseAuthListenerInitialized = true
  globalForSupabase.__supabaseAccessToken = null
  globalForSupabase.__supabaseSession = null
  globalForSupabase.__supabaseSessionPromise = undefined

  try {
    // Ne pas appeler getSession ici: plusieurs modules peuvent l'importer en parallèle
    // et déclencher un lock navigateur Supabase.
  } catch {
    // silencieux
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    globalForSupabase.__supabaseAccessToken = session?.access_token ?? null
    globalForSupabase.__supabaseSession = session ?? null
    globalForSupabase.__supabaseSessionPromise = undefined
  })
}

export function getClientAccessToken(): string | null {
  return typeof window !== 'undefined' ? (globalForSupabase.__supabaseAccessToken ?? null) : null
}

export async function getClientSessionSafe(): Promise<any | null> {
  if (typeof window === 'undefined') return null

  if (globalForSupabase.__supabaseSession) {
    return globalForSupabase.__supabaseSession
  }

  if (globalForSupabase.__supabaseSessionPromise) {
    return globalForSupabase.__supabaseSessionPromise
  }

  globalForSupabase.__supabaseSessionPromise = (async () => {
    try {
      const res = await supabase.auth.getSession()
      const session = res?.data?.session ?? null
      globalForSupabase.__supabaseSession = session
      globalForSupabase.__supabaseAccessToken = session?.access_token ?? null
      return session
    } catch {
      return null
    } finally {
      globalForSupabase.__supabaseSessionPromise = undefined
    }
  })()

  return globalForSupabase.__supabaseSessionPromise
}

export async function getClientAccessTokenSafe(): Promise<string | null> {
  const cached = getClientAccessToken()
  if (cached) return cached
  const session = await getClientSessionSafe()
  return session?.access_token ?? null
}

const createAdminSupabaseClient = () => {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    ''

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant côté serveur. Configurez la clé service role dans les variables d’environnement.')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

let serverSupabaseAdmin: SupabaseBrowserClient | null = null

export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Supabase admin client ne peut être utilisé que côté serveur.')
  }

  if (!serverSupabaseAdmin) {
    if (!globalForSupabase.__supabaseAdminClient) {
      globalForSupabase.__supabaseAdminClient = createAdminSupabaseClient()
    }

    serverSupabaseAdmin = globalForSupabase.__supabaseAdminClient
  }

  return serverSupabaseAdmin
}

// Types TypeScript pour la base de données
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'client' | 'vendor' | 'admin' | 'super_admin' | 'driver' | 'ops'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'client' | 'vendor' | 'admin' | 'super_admin' | 'driver' | 'ops'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'client' | 'vendor' | 'admin' | 'super_admin' | 'driver' | 'ops'
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          avatar_url: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string
          postal_code: string | null
          bio: string | null
          website: string | null
          social_media: any | null
          preferences: any | null
          created_at: string
          updated_at: string
          short_code: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string
          postal_code?: string | null
          bio?: string | null
          website?: string | null
          social_media?: any | null
          preferences?: any | null
          created_at?: string
          updated_at?: string
          short_code?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string
          postal_code?: string | null
          bio?: string | null
          website?: string | null
          social_media?: any | null
          preferences?: any | null
          created_at?: string
          updated_at?: string
          short_code?: string
        }
      }
      user_points: {
        Row: {
          id: string
          user_id: string
          points: number
          fcfa_value: number
          withdrawal_threshold: number
          total_earned: number
          total_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points?: number
          fcfa_value?: number
          withdrawal_threshold?: number
          total_earned?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          fcfa_value?: number
          withdrawal_threshold?: number
          total_earned?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
      }
      loyalty_points: {
        Row: {
          id: string
          user_id: string
          points_balance: number
          points_earned: number
          points_spent: number
          fcfa_value: number
          withdrawal_threshold: number
          is_frozen: boolean
          frozen_at: string | null
          frozen_by: string | null
          freeze_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points_balance?: number
          points_earned?: number
          points_spent?: number
          fcfa_value?: number
          withdrawal_threshold?: number
          is_frozen?: boolean
          frozen_at?: string | null
          frozen_by?: string | null
          freeze_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points_balance?: number
          points_earned?: number
          points_spent?: number
          fcfa_value?: number
          withdrawal_threshold?: number
          is_frozen?: boolean
          frozen_at?: string | null
          frozen_by?: string | null
          freeze_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          points: number
          fcfa_value: number
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          points: number
          fcfa_value: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          points?: number
          fcfa_value?: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
      }
      point_settings: {
        Row: {
          id: string
          scope: 'global' | 'vendor' | 'customer'
          default_currency: string
          conversion_rate: number
          min_balance: number
          max_balance: number | null
          transfer_enabled: boolean
          exchange_enabled: boolean
          withdrawal_enabled: boolean
          metadata: any
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scope: 'global' | 'vendor' | 'customer'
          default_currency: string
          conversion_rate?: number
          min_balance?: number
          max_balance?: number | null
          transfer_enabled?: boolean
          exchange_enabled?: boolean
          withdrawal_enabled?: boolean
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          scope?: 'global' | 'vendor' | 'customer'
          default_currency?: string
          conversion_rate?: number
          min_balance?: number
          max_balance?: number | null
          transfer_enabled?: boolean
          exchange_enabled?: boolean
          withdrawal_enabled?: boolean
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_operation_fees: {
        Row: {
          id: string
          operation_type: 'transfer' | 'exchange' | 'withdrawal'
          scope: 'global' | 'vendor' | 'customer'
          flat_fee: number
          percentage_fee: number
          minimum_fee: number
          maximum_fee: number | null
          currency: string
          metadata: any
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          operation_type: 'transfer' | 'exchange' | 'withdrawal'
          scope: 'global' | 'vendor' | 'customer'
          flat_fee?: number
          percentage_fee?: number
          minimum_fee?: number
          maximum_fee?: number | null
          currency: string
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          operation_type?: 'transfer' | 'exchange' | 'withdrawal'
          scope?: 'global' | 'vendor' | 'customer'
          flat_fee?: number
          percentage_fee?: number
          minimum_fee?: number
          maximum_fee?: number | null
          currency?: string
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_operation_limits: {
        Row: {
          id: string
          operation_type: 'transfer' | 'exchange' | 'withdrawal'
          scope: 'global' | 'vendor' | 'customer'
          min_amount: number
          max_amount: number | null
          daily_limit: number | null
          monthly_limit: number | null
          metadata: any
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          operation_type: 'transfer' | 'exchange' | 'withdrawal'
          scope: 'global' | 'vendor' | 'customer'
          min_amount?: number
          max_amount?: number | null
          daily_limit?: number | null
          monthly_limit?: number | null
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          operation_type?: 'transfer' | 'exchange' | 'withdrawal'
          scope?: 'global' | 'vendor' | 'customer'
          min_amount?: number
          max_amount?: number | null
          daily_limit?: number | null
          monthly_limit?: number | null
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_exchange_rates: {
        Row: {
          id: string
          currency: string
          rate: number
          is_default: boolean
          metadata: any
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          currency: string
          rate: number
          is_default?: boolean
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          currency?: string
          rate?: number
          is_default?: boolean
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_withdrawal_methods: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          metadata: any
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_withdrawal_method_limits: {
        Row: {
          id: string
          method_id: string
          min_amount: number
          max_amount: number | null
          currency: string
          processing_time: string | null
          metadata: any
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          method_id: string
          min_amount?: number
          max_amount?: number | null
          currency: string
          processing_time?: string | null
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          method_id?: string
          min_amount?: number
          max_amount?: number | null
          currency?: string
          processing_time?: string | null
          metadata?: any
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      point_exchange_history: {
        Row: {
          id: string
          user_id: string
          from_currency: string
          to_currency: string
          points_amount: number
          converted_amount: number
          fee_amount: number
          rate: number
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_currency: string
          to_currency: string
          points_amount: number
          converted_amount: number
          fee_amount?: number
          rate: number
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_currency?: string
          to_currency?: string
          points_amount?: number
          converted_amount?: number
          fee_amount?: number
          rate?: number
          metadata?: any
          created_at?: string
        }
      }
      point_transfer_requests: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          points_amount: number
          fee_amount: number
          status: 'pending' | 'approved' | 'rejected' | 'failed' | 'completed'
          metadata: any
          created_at: string
          processed_at: string | null
          processed_by: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          points_amount: number
          fee_amount?: number
          status?: 'pending' | 'approved' | 'rejected' | 'failed' | 'completed'
          metadata?: any
          created_at?: string
          processed_at?: string | null
          processed_by?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          points_amount?: number
          fee_amount?: number
          status?: 'pending' | 'approved' | 'rejected' | 'failed' | 'completed'
          metadata?: any
          created_at?: string
          processed_at?: string | null
          processed_by?: string | null
        }
      }
      point_withdrawal_requests: {
        Row: {
          id: string
          user_id: string
          method_id: string
          points_amount: number
          payout_amount: number
          fee_amount: number
          currency: string
          status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed'
          metadata: any
          created_at: string
          processed_at: string | null
          processed_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          method_id: string
          points_amount: number
          payout_amount: number
          fee_amount?: number
          currency: string
          status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed'
          metadata?: any
          created_at?: string
          processed_at?: string | null
          processed_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          method_id?: string
          points_amount?: number
          payout_amount?: number
          fee_amount?: number
          currency?: string
          status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed'
          metadata?: any
          created_at?: string
          processed_at?: string | null
          processed_by?: string | null
        }
      }
      user_products: {
        Row: {
          id: string
          vendor_id: string
          name: string
          description: string | null
          price: number
          original_price: number | null
          currency: string
          category: string | null
          subcategory: string | null
          images: string[] | null
          stock_quantity: number
          is_active: boolean
          is_featured: boolean
          is_shareable: boolean
          rating: number
          total_reviews: number
          total_sales: number
          total_revenue: number
          total_shares: number
          seo_title: string | null
          seo_description: string | null
          tags: string[] | null
          weight: number | null
          dimensions: any | null
          shipping_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          description?: string | null
          price: number
          original_price?: number | null
          currency?: string
          category?: string | null
          subcategory?: string | null
          images?: string[] | null
          stock_quantity?: number
          is_active?: boolean
          is_featured?: boolean
          is_shareable?: boolean
          rating?: number
          total_reviews?: number
          total_sales?: number
          total_revenue?: number
          total_shares?: number
          seo_title?: string | null
          seo_description?: string | null
          tags?: string[] | null
          weight?: number | null
          dimensions?: any | null
          shipping_cost?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          description?: string | null
          price?: number
          original_price?: number | null
          currency?: string
          category?: string | null
          subcategory?: string | null
          images?: string[] | null
          stock_quantity?: number
          is_active?: boolean
          is_featured?: boolean
          is_shareable?: boolean
          rating?: number
          total_reviews?: number
          total_sales?: number
          total_revenue?: number
          total_shares?: number
          seo_title?: string | null
          seo_description?: string | null
          tags?: string[] | null
          weight?: number | null
          dimensions?: any | null
          shipping_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_shares: {
        Row: {
          id: string
          user_id: string
          product_id: string
          vendor_id: string
          platform: string
          share_url: string
          points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          vendor_id: string
          platform: string
          share_url: string
          points_earned?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          vendor_id?: string
          platform?: string
          share_url?: string
          points_earned?: number
          created_at?: string
        }
      }
      user_notifications: {
        Row: {
          id: string
          user_id: string
          type: 'message' | 'chat' | 'order' | 'payment' | 'system' | 'points' | 'promotion'
          title: string
          message: string
          is_read: boolean
          priority: 'low' | 'normal' | 'high' | 'urgent'
          action_url: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'message' | 'chat' | 'order' | 'payment' | 'system' | 'points' | 'promotion'
          title: string
          message: string
          is_read?: boolean
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          action_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'message' | 'chat' | 'order' | 'payment' | 'system' | 'points' | 'promotion'
          title?: string
          message?: string
          is_read?: boolean
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          action_url?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
      user_messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          subject: string
          content: string
          type: 'internal' | 'chat' | 'support'
          is_read: boolean
          priority: 'low' | 'normal' | 'high' | 'urgent'
          status: 'active' | 'archived' | 'deleted'
          parent_message_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          subject: string
          content: string
          type?: 'internal' | 'chat' | 'support'
          is_read?: boolean
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          status?: 'active' | 'archived' | 'deleted'
          parent_message_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          subject?: string
          content?: string
          type?: 'internal' | 'chat' | 'support'
          is_read?: boolean
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          status?: 'active' | 'archived' | 'deleted'
          parent_message_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_points_transactions: {
        Row: {
          id: string
          user_id: string
          points: number
          type: string
          reference_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points: number
          type: string
          reference_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          type?: string
          reference_id?: string | null
          description?: string | null
          created_at?: string
        }
      }
      user_chats: {
        Row: {
          id: string
          participant1_id: string
          participant2_id: string
          last_message_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          participant1_id: string
          participant2_id: string
          last_message_at?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          participant1_id?: string
          participant2_id?: string
          last_message_at?: string
          is_active?: boolean
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'file' | 'system'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          is_read?: boolean
          created_at?: string
        }
      }
      share_interactions: {
        Row: {
          id: string
          share_id: string
          interaction_type: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          share_id: string
          interaction_type: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          share_id?: string
          interaction_type?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
      }
      share_points_config: {
        Row: {
          id: string
          platform: string
          points: number
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          platform: string
          points?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          platform?: string
          points?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      shares_engagement: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          share_type: string
          platform: string | null
          engagement_metrics: any | null
          points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          share_type: string
          platform?: string | null
          engagement_metrics?: any | null
          points_earned?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          share_type?: string
          platform?: string | null
          engagement_metrics?: any | null
          points_earned?: number
          created_at?: string
        }
      }
      user_orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount: number
          currency: string
          shipping_address: any | null
          billing_address: any | null
          payment_method: string | null
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount: number
          currency?: string
          shipping_address?: any | null
          billing_address?: any | null
          payment_method?: string | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount?: number
          currency?: string
          shipping_address?: any | null
          billing_address?: any | null
          payment_method?: string | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      vendor_sales: {
        Row: {
          id: string
          vendor_id: string
          total_sales: number
          pending_balance: number
          available_balance: number
          currency: string
          commission_rate: number
          total_commission: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          total_sales?: number
          pending_balance?: number
          available_balance?: number
          currency?: string
          commission_rate?: number
          total_commission?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          total_sales?: number
          pending_balance?: number
          available_balance?: number
          currency?: string
          commission_rate?: number
          total_commission?: number
          created_at?: string
          updated_at?: string
        }
      }
      payment_requests: {
        Row: {
          id: string
          user_id: string
          type: 'points' | 'sales'
          amount: number
          currency: string
          status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          bank_details: any | null
          reason: string | null
          admin_notes: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'points' | 'sales'
          amount: number
          currency?: string
          status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          bank_details?: any | null
          reason?: string | null
          admin_notes?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'points' | 'sales'
          amount?: number
          currency?: string
          status?: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
          bank_details?: any | null
          reason?: string | null
          admin_notes?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          vendor_id: string
          name: string
          description: string | null
          price: number
          currency: string
          category: string | null
          subcategory: string | null
          images: string[] | null
          stock_quantity: number
          min_stock_alert: number
          is_active: boolean
          is_featured: boolean
          tags: string[] | null
          specifications: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          description?: string | null
          price: number
          currency?: string
          category?: string | null
          subcategory?: string | null
          images?: string[] | null
          stock_quantity?: number
          min_stock_alert?: number
          is_active?: boolean
          is_featured?: boolean
          tags?: string[] | null
          specifications?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          description?: string | null
          price?: number
          currency?: string
          category?: string | null
          subcategory?: string | null
          images?: string[] | null
          stock_quantity?: number
          min_stock_alert?: number
          is_active?: boolean
          is_featured?: boolean
          tags?: string[] | null
          specifications?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          parent_id: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      promotions: {
        Row: {
          id: string
          title: string
          description: string | null
          discount_type: 'percentage' | 'fixed' | 'buy_one_get_one'
          discount_value: number
          min_purchase_amount: number
          max_discount_amount: number | null
          start_date: string
          end_date: string
          is_active: boolean
          applicable_products: string[] | null
          applicable_categories: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed' | 'buy_one_get_one'
          discount_value: number
          min_purchase_amount?: number
          max_discount_amount?: number | null
          start_date: string
          end_date: string
          is_active?: boolean
          applicable_products?: string[] | null
          applicable_categories?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed' | 'buy_one_get_one'
          discount_value?: number
          min_purchase_amount?: number
          max_discount_amount?: number | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          applicable_products?: string[] | null
          applicable_categories?: string[] | null
          created_at?: string
        }
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          title: string | null
          comment: string | null
          is_verified_purchase: boolean
          helpful_votes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          title?: string | null
          comment?: string | null
          is_verified_purchase?: boolean
          helpful_votes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          title?: string | null
          comment?: string | null
          is_verified_purchase?: boolean
          helpful_votes?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          added_at?: string
        }
      }
      user_carts: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          added_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity?: number
          added_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          added_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          device_info: any | null
          ip_address: string | null
          is_active: boolean
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          device_info?: any | null
          ip_address?: string | null
          is_active?: boolean
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          device_info?: any | null
          ip_address?: string | null
          is_active?: boolean
          expires_at?: string
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: any | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: any | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_stats: {
        Row: {
          id: string
          email: string
          role: string
          first_name: string | null
          last_name: string | null
          points: number
          fcfa_value: number
          unread_notifications: number
          unread_messages: number
          total_orders: number
          total_reviews: number
        }
      }
      vendor_stats: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          total_sales: number
          pending_balance: number
          available_balance: number
          total_products: number
          total_orders: number
          average_rating: number | null
        }
      }
      user_share_stats: {
        Row: {
          user_id: string
          total_shares: number
          total_points_earned: number
          platforms_used: number
          last_share_at: string | null
        }
      }
      vendor_share_stats: {
        Row: {
          vendor_id: string
          total_shares: number
          unique_sharers: number
          products_shared: number
          last_share_at: string | null
        }
      }
      share_interaction_stats: {
        Row: {
          user_id: string | null
          vendor_id: string | null
          total_interactions: number
          views: number
          clicks: number
          conversions: number
          purchases: number
        }
      }
    }
    Functions: {
      update_updated_at_column: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_order_number: {
        Args: Record<string, unknown>
        Returns: string
      }
    }
  }
}
// Types utilitaires
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Types pour les vues
export type UserStats = Database['public']['Views']['user_stats']['Row']
export type VendorStats = Database['public']['Views']['vendor_stats']['Row']

// Types pour l'authentification
export type User = {
  id: string
  email: string
  role: 'client' | 'vendor' | 'admin' | 'super_admin'
  created_at: string
  updated_at: string
}

export type UserProfile = {
  id: string
  user_id: string
  first_name: string
  last_name: string
  avatar_url?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  postal_code?: string
  bio?: string
  website?: string
  social_media?: any
  preferences?: any
  created_at: string
  updated_at: string
}

export type LoyaltyPoints = {
  id: string
  user_id: string
  points_balance: number
  points_earned: number
  points_spent: number
  fcfa_value: number
  withdrawal_threshold: number
  created_at: string
  updated_at: string
}