"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { User, UserProfile, LoyaltyPoints } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { getClientSessionSafe } from '@/lib/supabase'
import { Session, User as SupabaseAuthUser } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loyaltyPoints: LoyaltyPoints | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; role: User['role'] }>
  signUp: (email: string, password: string, profile: Partial<UserProfile>, role?: 'client' | 'vendor' | 'admin') => Promise<{ error: any }>
  sendPasswordReset: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Fallback safe: dans certains cas (hydration/edge cases), le hook peut être appelé
    // avant que le provider ne soit disponible. On évite un crash runtime et on renvoie
    // un état invité/chargement.
    if (typeof window !== 'undefined') {
      console.warn('useAuth was called without an AuthProvider. Falling back to guest auth state.')
    }
    const stub: AuthContextType = {
      user: null,
      userProfile: null,
      loyaltyPoints: null,
      session: null,
      loading: true,
      signIn: async () => ({ error: new Error('AuthProvider manquant'), role: 'client' }),
      signUp: async () => ({ error: new Error('AuthProvider manquant') }),
      sendPasswordReset: async () => ({ error: new Error('AuthProvider manquant') }),
      updatePassword: async () => ({ error: new Error('AuthProvider manquant') }),
      signOut: async () => {
        throw new Error('AuthProvider manquant')
      },
      updateProfile: async () => ({ error: new Error('AuthProvider manquant') }),
      refreshUserData: async () => {
        // no-op
      }
    }
    return stub
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
  initialState?: {
    user?: any | null
    userProfile?: any | null
    loyaltyPoints?: any | null
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialState }) => {
  const [user, setUser] = useState<User | null>(() => (initialState?.user ?? null))
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => (initialState?.userProfile ?? null))
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints | null>(() => (initialState?.loyaltyPoints ?? null))
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => !(initialState?.user))

  const hasInitialUserRef = useRef<boolean>(Boolean(initialState?.user))

  /**
   * Synchronise le token d'accès Supabase dans un cookie pour permettre au SSR (app/layout.tsx)
   * de reconnaître l'utilisateur et rendre le même header que le client.
   */
  const syncAccessTokenCookie = (accessToken: string | null) => {
    try {
      if (typeof document === 'undefined') return
      const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:'
      const secure = isHttps ? '; Secure' : ''
      if (accessToken && accessToken.trim()) {
        document.cookie = `sb-access-token=${accessToken.trim()}; Path=/; SameSite=Lax${secure}; Max-Age=${60 * 60 * 24 * 7}`
      } else {
        document.cookie = `sb-access-token=; Path=/; SameSite=Lax${secure}; Max-Age=0`
      }
    } catch {
      // ignore
    }
  }

  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const presenceKeyRef = useRef<string | null>(null)

  // Publier la présence "en ligne" via Supabase Realtime Presence.
  useEffect(() => {
    const userId = (user as any)?.id

    if (!userId) {
      if (presenceChannelRef.current) {
        try {
          void supabase.removeChannel(presenceChannelRef.current)
        } catch {
          // ignore
        }
        presenceChannelRef.current = null
      }
      presenceKeyRef.current = null
      return
    }

    if (presenceChannelRef.current) {
      return
    }

    const tabKey = presenceKeyRef.current ?? `user:${String(userId)}:${Math.random().toString(36).slice(2)}`
    presenceKeyRef.current = tabKey

    const channel = supabase.channel('presence:users', {
      config: {
        presence: {
          key: tabKey
        }
      }
    })

    presenceChannelRef.current = channel

    const doTrack = () => {
      try {
        void channel.track({ user_id: String(userId) })
      } catch {
        // ignore
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        doTrack()
      }
    }

    let heartbeat: number | null = null

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        doTrack()
        heartbeat = window.setInterval(doTrack, 20000)
        document.addEventListener('visibilitychange', onVisibilityChange)
      }
    })

    return () => {
      if (heartbeat) {
        window.clearInterval(heartbeat)
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (presenceChannelRef.current) {
        try {
          void supabase.removeChannel(presenceChannelRef.current)
        } catch {
          // ignore
        }
        presenceChannelRef.current = null
      }
      presenceKeyRef.current = null
    }
  }, [user])

  const inflightProfilePromiseRef = useRef<Promise<UserProfile | null> | null>(null)
  const inflightPointsPromiseRef = useRef<Promise<LoyaltyPoints | null> | null>(null)

  const resolveUserRole = async (authUser: SupabaseAuthUser | null): Promise<User['role']> => {
    if (!authUser) return 'client'

    const metadataRole = authUser.user_metadata?.role as User['role'] | undefined
    if (metadataRole) {
      return metadataRole
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (!error && data?.role) {
        return data.role as User['role']
      }
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer le rôle depuis la base:', error)
    }

    return 'client'
  }

  const formatSupabaseError = (error: unknown): string => {
    if (!error) return 'Erreur inconnue.'
    if (error instanceof Error) return error.message
    try {
      const anyError = error as any
      const direct = anyError?.message ?? anyError?.hint ?? anyError?.details
      if (typeof direct === 'string' && direct.trim().length > 0) {
        return direct
      }

      // Certains objets Supabase ont des props non-enumerable => JSON.stringify donne "{}".
      const keys = Object.getOwnPropertyNames(anyError ?? {})
      const snapshot: Record<string, unknown> = {}
      for (const key of keys) {
        snapshot[key] = (anyError as any)?.[key]
      }

      const json = JSON.stringify(snapshot)
      if (json && json !== '{}' && json !== 'null') {
        return json
      }

      return String(error)
    } catch {
      return String(error)
    }
  }

  // Fonction pour récupérer le profil utilisateur
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Tentative de récupération du profil pour:', userId)

      /**
       * Sérialise la récupération du profil pour éviter les appels concurrents à Supabase
       * qui déclenchent des AbortError/locks.
       */
      if (inflightProfilePromiseRef.current) {
        return await inflightProfilePromiseRef.current
      }

      inflightProfilePromiseRef.current = (async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('ℹ️ Aucun profil trouvé pour cet utilisateur.')
            return null
          }

          console.warn('❌ Erreur lors de la récupération du profil:', formatSupabaseError(error))
          return null
        }

        if (!data) {
          console.warn('ℹ️ Aucun profil Supabase existant pour cet utilisateur.')
          return null
        }

        console.log('✅ Profil récupéré avec succès:', data)
        return data
      })().finally(() => {
        inflightProfilePromiseRef.current = null
      })

      return await inflightProfilePromiseRef.current
    } catch (error) {
      console.warn('💥 Erreur inattendue lors de la récupération du profil:', formatSupabaseError(error))
      return null
    }
  }

  // Fonction pour récupérer les points de fidélité
  const fetchLoyaltyPoints = async (userId: string) => {
    try {
      console.log('🔍 Tentative de récupération des points pour:', userId)

      /**
       * Sérialise la récupération des points pour éviter les appels concurrents à Supabase
       * qui déclenchent des AbortError/locks.
       */
      if (inflightPointsPromiseRef.current) {
        return await inflightPointsPromiseRef.current
      }

      inflightPointsPromiseRef.current = (async () => {
        const { data, error } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('ℹ️ Aucun solde fidélité trouvé pour cet utilisateur.')
          } else {
            console.warn('❌ Erreur lors de la récupération des points:', formatSupabaseError(error))
          }
        }

        // Si loyalty_points est absent ou vide/0, fallback vers users.points_balance (source visible côté Super Admin)
        const pointsBalance = Number((data as any)?.points_balance ?? 0)
        const hasPositiveBalance = Number.isFinite(pointsBalance) && pointsBalance > 0

        if (!data || !hasPositiveBalance) {
          try {
            const legacyUsers = await supabase
              .from('users')
              .select('points_balance')
              .eq('id', userId)
              .maybeSingle()

            const legacyUserBalance = Number((legacyUsers.data as any)?.points_balance ?? 0)
            if (!legacyUsers.error && Number.isFinite(legacyUserBalance) && legacyUserBalance >= 0) {
              const merged = {
                ...(data as any),
                user_id: (data as any)?.user_id ?? userId,
                points_balance: legacyUserBalance
              } as LoyaltyPoints

              console.log('✅ Points fallback users.points_balance:', legacyUserBalance)
              return merged
            }
          } catch (fallbackError) {
            console.warn('⚠️ Fallback users.points_balance échoué:', formatSupabaseError(fallbackError))
          }
        }

        if (!data) {
          console.warn('ℹ️ Aucun solde fidélité existant pour cet utilisateur.')
          return null
        }

        console.log('✅ Points récupérés avec succès:', data)
        return data as LoyaltyPoints
      })().finally(() => {
        inflightPointsPromiseRef.current = null
      })

      return await inflightPointsPromiseRef.current
    } catch (error) {
      console.warn('💥 Erreur inattendue lors de la récupération des points:', formatSupabaseError(error))
      return null
    }
  }

  // Fonction de connexion
  const signIn: AuthContextType['signIn'] = async (email: string, password: string) => {
    try {
      toast.loading('🔐 Connexion en cours...', { id: 'signin' })
      console.log('🔐 Tentative de connexion pour:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Erreur de connexion:', error)
        toast.error(`❌ Erreur de connexion: ${error.message}`, { id: 'signin' })
        return { error, role: 'client' }
      }

      // Refuser la connexion si le compte est soft-deleted côté DB.
      try {
        const userId = data?.user?.id
        if (userId) {
          const { data: userRow, error: userRowError } = await supabase
            .from('users')
            .select('status,deleted_at,deactivated_at,role')
            .eq('id', userId)
            .maybeSingle()

          if (!userRowError && userRow) {
            const status = String((userRow as any)?.status ?? '').toLowerCase().trim()
            const deletedAt = (userRow as any)?.deleted_at ?? null
            const deactivatedAt = (userRow as any)?.deactivated_at ?? null

            if (status === 'deleted' || Boolean(deletedAt) || Boolean(deactivatedAt)) {
              try {
                await supabase.auth.signOut()
              } catch {
                // ignore
              }

              const blockedError = new Error('Compte désactivé ou supprimé.')
              toast.error('❌ Compte désactivé ou supprimé.', { id: 'signin' })
              return { error: blockedError, role: 'client' }
            }
          }
        }
      } catch (guardError) {
        console.warn('⚠️ Vérification soft-delete échouée, connexion maintenue:', guardError)
      }

      console.log('✅ Connexion réussie:', data)
      toast.success('✅ Connexion réussie ! Bienvenue !', { id: 'signin' })
      const resolvedRole = await resolveUserRole(data.user ?? null)
      return { error: null, role: resolvedRole }
    } catch (error) {
      console.error('💥 Erreur inattendue lors de la connexion:', error)
      toast.error('💥 Erreur inattendue lors de la connexion', { id: 'signin' })
      return { error, role: 'client' }
    }
  }

  // Fonction d'inscription
  const signUp = async (email: string, password: string, profile: Partial<UserProfile>, role: 'client' | 'vendor' | 'admin' = 'client') => {
    try {
      toast.loading('📝 Création de votre compte...', { id: 'signup' })
      console.log('📝 Tentative d\'inscription pour:', email, 'avec le rôle:', role)
      
      // Créer l'utilisateur avec Supabase Auth et passer le rôle dans les métadonnées
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role, // Le rôle sera extrait par le trigger Supabase
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            ...profile  // Inclure le reste du profil
          }
        }
      })

      if (authError) {
        console.error('❌ Erreur lors de la création de l\'utilisateur:', authError)
        toast.error(`❌ Erreur lors de la création de l'utilisateur: ${authError.message}`, { id: 'signup' })
        return { error: authError }
      }

      console.log('✅ Utilisateur créé avec succès:', authData)
      toast.success('🎉 Compte créé avec succès ! Redirection en cours...', { id: 'signup' })
      
      // Le trigger on_auth_user_created va automatiquement :
      // 1. Créer l'entrée dans public.users avec le bon rôle
      // 2. Créer le profil utilisateur
      // 3. Créer les points de fidélité
      
      return { error: null }
    } catch (error) {
      console.error('💥 Erreur inattendue lors de l\'inscription:', error)
      toast.error('💥 Erreur inattendue lors de l\'inscription', { id: 'signup' })
      return { error }
    }
  }

  /**
   * Demande l'envoi d'un e-mail de réinitialisation de mot de passe via Supabase Auth.
   */
  const sendPasswordReset = async (email: string) => {
    try {
      toast.loading('📧 Envoi du lien de réinitialisation...', { id: 'forgot-password' })

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      if (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email de réinitialisation:', error)
        toast.error(`❌ Impossible d\'envoyer l\'email: ${error.message}`, { id: 'forgot-password' })
        return { error }
      }

      toast.success('✅ E-mail de réinitialisation envoyé !', { id: 'forgot-password' })
      return { error: null }
    } catch (error) {
      console.error('💥 Erreur inattendue lors de la demande de réinitialisation:', error)
      toast.error('💥 Erreur inattendue lors de l\'envoi', { id: 'forgot-password' })
      return { error }
    }
  }

  /**
   * Met à jour le mot de passe de l'utilisateur authentifié après vérification Supabase.
   */
  const updatePassword = async (newPassword: string) => {
    try {
      toast.loading('🔑 Mise à jour du mot de passe...', { id: 'update-password' })

      const { error, data } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du mot de passe:', error)
        toast.error(`❌ Erreur lors de la mise à jour: ${error.message}`, { id: 'update-password' })
        return { error }
      }

      console.log('✅ Mot de passe mis à jour:', data)
      toast.success('✅ Mot de passe mis à jour avec succès !', { id: 'update-password' })
      return { error: null }
    } catch (error) {
      console.error('💥 Erreur inattendue lors de la mise à jour du mot de passe:', error)
      toast.error('💥 Erreur inattendue lors de la mise à jour', { id: 'update-password' })
      return { error }
    }
  }

  // Fonction de déconnexion
  const signOut = async () => {
    toast.loading('🚪 Déconnexion en cours...', { id: 'signout' })
    console.log('🚪 Tentative de déconnexion...')

    const resetAuthState = () => {
      setUser(null)
      setUserProfile(null)
      setLoyaltyPoints(null)
      setSession(null)
    }

    try {
      await supabase.auth.signOut()
      console.log('✅ Déconnexion réussie')
      toast.success('✅ Déconnexion réussie !', { id: 'signout' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('❌ Erreur lors de la déconnexion:', error)

      if (message.toLowerCase().includes('invalid refresh token')) {
        console.warn('⚠️ Jeton de rafraîchissement invalide détecté, état local nettoyé.')
        toast.success('✅ Déconnexion réussie !', { id: 'signout' })
      } else {
        toast.error('❌ Erreur lors de la déconnexion', { id: 'signout' })
        return
      }
    } finally {
      resetAuthState()
    }
  }

  // Fonction de mise à jour du profil
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      toast.error('❌ Utilisateur non connecté')
      return { error: new Error('Utilisateur non connecté') }
    }

    try {
      toast.loading('🔍 Mise à jour du profil...', { id: 'profile' })
      console.log('🔍 Mise à jour du profil pour:', user.id, updates)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error)
        toast.error(`❌ Erreur lors de la mise à jour: ${error.message}`, { id: 'profile' })
        return { error }
      }

      console.log('✅ Profil mis à jour avec succès:', data)
      setUserProfile(data)
      toast.success('✅ Profil mis à jour avec succès !', { id: 'profile' })
      return { error: null }
    } catch (error) {
      console.error('💥 Erreur inattendue lors de la mise à jour du profil:', error)
      toast.error('💥 Erreur inattendue lors de la mise à jour', { id: 'profile' })
      return { error }
    }
  }

  // Fonction pour rafraîchir les données utilisateur
  const refreshUserData = async () => {
    if (!user) return

    try {
      toast.loading('🔄 Actualisation des données...', { id: 'refresh' })
      console.log('🔄 Rafraîchissement des données utilisateur...')
      
      const [profile, points] = await Promise.all([
        fetchUserProfile(user.id),
        fetchLoyaltyPoints(user.id)
      ])

      setUserProfile(profile)
      setLoyaltyPoints(points)
      
      console.log('✅ Données utilisateur rafraîchies')
      toast.success('✅ Données actualisées !', { id: 'refresh' })
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement des données:', error)
      toast.error('❌ Erreur lors de l\'actualisation', { id: 'refresh' })
    }
  }

  // Écouter les changements d'authentification
  useEffect(() => {
    /**
     * Objectif:
     * - Empêcher le flicker SSR (connecté) -> client (invité) -> client (connecté)
     *   qui déclenche un hydration mismatch.
     * - Si on a déjà un user initial (SSR), on évite de l'écraser avec null
     *   quand getClientSessionSafe() renvoie temporairement null.
     */
    const getSession = async () => {
      try {
        console.log('🔍 Récupération de la session...')
        const session = await getClientSessionSafe()
        setSession(session)

        syncAccessTokenCookie(session?.access_token ?? null)

        if (session?.user) {
          const resolvedRole = await resolveUserRole(session.user)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: resolvedRole,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
          })
        } else {
          // Ne pas écraser un user SSR par null tant qu'on n'a pas de preuve de logout.
          if (!hasInitialUserRef.current) {
            setUser(null)
          }
        }
        setLoading(false)
        console.log('✅ Session récupérée:', session ? 'Oui' : 'Non')
      } catch (error) {
        console.error('❌ Erreur lors de la récupération de la session:', error)
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Changement d\'état d\'authentification:', event, session?.user?.email)
        
        setSession(session)

        syncAccessTokenCookie(session?.access_token ?? null)

        if (session?.user) {
          const resolvedRole = await resolveUserRole(session.user)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: resolvedRole,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at
          })
          hasInitialUserRef.current = true
        } else {
          // Ici on a un event officiel Supabase => on peut nettoyer.
          setUser(null)
          hasInitialUserRef.current = false
          syncAccessTokenCookie(null)
        }
        setLoading(false)

        if (session?.user) {
          // Récupération RAPIDE du profil et des points en parallèle
          Promise.all([
            fetchUserProfile(session.user.id),
            fetchLoyaltyPoints(session.user.id)
          ]).then(([profile, points]) => {
            setUserProfile(profile)
            setLoyaltyPoints(points)
          }).catch(error => {
            console.error('⚠️ Erreur lors de la récupération des données:', error)
            // Ne pas bloquer l'utilisateur pour ces erreurs
          })
        } else {
          setUserProfile(null)
          setLoyaltyPoints(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    /**
     * Synchronise automatiquement la ligne loyalty_points de l'utilisateur connecté.
     * Objectif: refléter immédiatement les actions Super Admin (gel / dégel) sans reconnexion.
     */
    if (!user?.id) {
      return
    }

    let isMounted = true

    const channel = supabase
      .channel(`loyalty_points:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_points',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          try {
            if (!isMounted) return

            const next = (payload as any)?.new as LoyaltyPoints | undefined
            if (next) {
              setLoyaltyPoints(next)
              return
            }

            const refreshed = await fetchLoyaltyPoints(user.id)
            if (!isMounted) return
            setLoyaltyPoints(refreshed)
          } catch (error) {
            console.error('⚠️ Realtime loyalty_points: échec sync, fallback refetch', error)
            const refreshed = await fetchLoyaltyPoints(user.id)
            if (!isMounted) return
            setLoyaltyPoints(refreshed)
          }
        }
      )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime loyalty_points abonné')
      }
    })

    /**
     * Fallback: refetch périodique (utile si Realtime désactivé sur le projet Supabase ou en cas de pertes).
     */
    const interval = window.setInterval(async () => {
      try {
        if (!isMounted) return
        const refreshed = await fetchLoyaltyPoints(user.id)
        if (!isMounted) return
        setLoyaltyPoints(refreshed)
      } catch {
        // silence
      }
    }, 30000)

    return () => {
      isMounted = false
      window.clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const value: AuthContextType = {
    user,
    userProfile,
    loyaltyPoints,
    session,
    loading,
    signIn,
    signUp,
    sendPasswordReset,
    updatePassword,
    signOut,
    updateProfile,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
