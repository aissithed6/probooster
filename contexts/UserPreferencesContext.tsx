"use client"

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { usePublicGlobalSettings } from './PublicGlobalSettingsContext'

export type UserSystemPreferences = {
  language: 'fr' | 'en' | 'es' | 'de'
  timezone: 'africa_cotonou' | 'europe_paris' | 'america_new_york' | 'asia_tokyo'
  currency: 'xof' | 'eur' | 'usd' | 'gbp'
  theme: 'light' | 'dark' | 'auto'
}

export type UserPrivacyPreferences = {
  profilePublic: boolean
  sharePurchaseHistory: boolean
  shareStats: boolean
  analyticsEnabled: boolean
  personalizedRecommendations: boolean
}

export type UserPrivacyPolicyRule = {
  locked: boolean
  forceValue: boolean | null
}

export type UserPrivacyPolicy = Record<keyof UserPrivacyPreferences, UserPrivacyPolicyRule>

type UserPreferencesContextValue = {
  systemPrefs: UserSystemPreferences
  setSystemPrefs: (updates: Partial<UserSystemPreferences>) => void
  setTheme: (theme: UserSystemPreferences['theme']) => void
  setLanguage: (language: UserSystemPreferences['language']) => void
  setTimezone: (timezone: UserSystemPreferences['timezone']) => void
  setCurrency: (currency: UserSystemPreferences['currency']) => void
  privacyPrefs: UserPrivacyPreferences
  privacyPolicy: UserPrivacyPolicy
  setPrivacyPrefs: (updates: Partial<UserPrivacyPreferences>) => void
  setProfilePublic: (enabled: boolean) => void
  setSharePurchaseHistory: (enabled: boolean) => void
  setShareStats: (enabled: boolean) => void
  setAnalyticsEnabled: (enabled: boolean) => void
  setPersonalizedRecommendations: (enabled: boolean) => void
  refreshFromProfile: () => void
}

export const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(undefined)

/**
 * Accès au contexte des préférences utilisateur.
 * Note: Retourne des valeurs par défaut si utilisé hors provider (ex: durant le SSR).
 */
export const useUserPreferences = () => {
  const ctx = useContext(UserPreferencesContext)
  if (!ctx) {
    // Fallback pour éviter les erreurs fatales durant le SSR ou si le provider est manquant
    return {
      systemPrefs: {
        language: 'fr',
        currency: 'xof',
        timezone: 'africa_cotonou',
        theme: 'light'
      },
      privacyPrefs: {
        profilePublic: true,
        sharePurchaseHistory: false,
        shareStats: true,
        analyticsEnabled: true,
        personalizedRecommendations: true
      },
      privacyPolicy: {} as any,
      setSystemPrefs: () => {},
      setTheme: () => {},
      setLanguage: () => {},
      setTimezone: () => {},
      setCurrency: () => {},
      setPrivacyPrefs: () => {},
      setProfilePublic: () => {},
      setSharePurchaseHistory: () => {},
      setShareStats: () => {},
      setAnalyticsEnabled: () => {},
      setPersonalizedRecommendations: () => {},
      refreshFromProfile: () => {}
    } as UserPreferencesContextValue
  }
  return ctx
}

/**
 * Normalise les préférences système utilisateur depuis un json quelconque.
 */
function normalizeSystemPreferences(value: unknown): UserSystemPreferences {
  const raw = (value && typeof value === 'object') ? (value as any) : {}

  const asEnum = <T extends string>(v: any, allowed: readonly T[], fallback: T): T => {
    return allowed.includes(v as T) ? (v as T) : fallback
  }

  return {
    language: asEnum(raw.language, ['fr', 'en', 'es', 'de'] as const, 'fr'),
    timezone: asEnum(raw.timezone, ['africa_cotonou', 'europe_paris', 'america_new_york', 'asia_tokyo'] as const, 'africa_cotonou'),
    currency: asEnum(raw.currency, ['xof', 'eur', 'usd', 'gbp'] as const, 'xof'),
    theme: asEnum(raw.theme, ['light', 'dark', 'auto'] as const, 'light')
  }
}

/**
 * Normalise les préférences de confidentialité depuis un json quelconque.
 */
function normalizePrivacyPreferences(value: unknown): UserPrivacyPreferences {
  const raw = (value && typeof value === 'object') ? (value as any) : {}

  const asBool = (v: any, fallback: boolean): boolean => {
    if (typeof v === 'boolean') return v
    if (v === 1 || v === '1' || v === 'true') return true
    if (v === 0 || v === '0' || v === 'false') return false
    return fallback
  }

  return {
    profilePublic: asBool(raw.profilePublic, true),
    sharePurchaseHistory: asBool(raw.sharePurchaseHistory, false),
    shareStats: asBool(raw.shareStats, true),
    analyticsEnabled: asBool(raw.analyticsEnabled, true),
    personalizedRecommendations: asBool(raw.personalizedRecommendations, true)
  }
}

function normalizePrivacyPolicyRule(value: unknown): UserPrivacyPolicyRule {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as any) : {}
  return {
    locked: raw.locked === true,
    forceValue: raw.forceValue === null || raw.forceValue === undefined
      ? null
      : (typeof raw.forceValue === 'boolean' ? raw.forceValue : (raw.forceValue === 1 || raw.forceValue === '1' || raw.forceValue === 'true'))
  }
}

function normalizePrivacyPolicy(value: unknown): UserPrivacyPolicy {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as any) : {}
  return {
    profilePublic: normalizePrivacyPolicyRule(raw.profilePublic),
    sharePurchaseHistory: normalizePrivacyPolicyRule(raw.sharePurchaseHistory),
    shareStats: normalizePrivacyPolicyRule(raw.shareStats),
    analyticsEnabled: normalizePrivacyPolicyRule(raw.analyticsEnabled),
    personalizedRecommendations: normalizePrivacyPolicyRule(raw.personalizedRecommendations)
  }
}

function applyPrivacyPolicy(prefs: UserPrivacyPreferences, policy: UserPrivacyPolicy): UserPrivacyPreferences {
  const next: UserPrivacyPreferences = { ...prefs }
  ;(Object.keys(policy) as Array<keyof UserPrivacyPreferences>).forEach((key) => {
    const rule = policy[key]
    if (rule && typeof rule.forceValue === 'boolean') {
      next[key] = rule.forceValue
    }
  })
  return next
}

function filterPrivacyUpdates(updates: Partial<UserPrivacyPreferences>, policy: UserPrivacyPolicy): Partial<UserPrivacyPreferences> {
  const next: Partial<UserPrivacyPreferences> = { ...updates }
  ;(Object.keys(next) as Array<keyof UserPrivacyPreferences>).forEach((key) => {
    const rule = policy[key]
    if (rule?.locked) {
      delete next[key]
      return
    }
    if (typeof rule?.forceValue === 'boolean') {
      delete next[key]
      return
    }
  })
  return next
}

/**
 * Compare deux objets de préférences système (égalité logique).
 */
function isSameSystemPrefs(a: UserSystemPreferences, b: UserSystemPreferences): boolean {
  return (
    a.language === b.language &&
    a.timezone === b.timezone &&
    a.currency === b.currency &&
    a.theme === b.theme
  )
}

function isSamePrivacyPrefs(a: UserPrivacyPreferences, b: UserPrivacyPreferences): boolean {
  return (
    a.profilePublic === b.profilePublic &&
    a.sharePurchaseHistory === b.sharePurchaseHistory &&
    a.shareStats === b.shareStats &&
    a.analyticsEnabled === b.analyticsEnabled &&
    a.personalizedRecommendations === b.personalizedRecommendations
  )
}

/**
 * Résout le thème 'auto' en un thème effectif.
 */
function resolveEffectiveTheme(theme: UserSystemPreferences['theme']): 'light' | 'dark' {
  if (theme === 'dark' || theme === 'light') return theme
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'
}

/**
 * Applique le thème effectif au DOM (classe `dark` sur <html>).
 */
function applyThemeToDom(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

/**
 * Provider global: centralise langue/devise/fuseau/thème à partir de user_profiles.preferences.system,
 * et persiste automatiquement toute modification via updateProfile().
 */
export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, updateProfile } = useAuth()
  const { data: publicGlobalSettings } = usePublicGlobalSettings()

  const initialFromProfile = useMemo<UserSystemPreferences>(() => {
    const stored = (userProfile as any)?.preferences?.system
    return normalizeSystemPreferences(stored)
  }, [userProfile])

  const initialPrivacyFromProfile = useMemo<UserPrivacyPreferences>(() => {
    const stored = (userProfile as any)?.preferences?.privacy
    return normalizePrivacyPreferences(stored)
  }, [userProfile])

  const [systemPrefs, setSystemPrefsState] = useState<UserSystemPreferences>(initialFromProfile)
  const [privacyPrefs, setPrivacyPrefsState] = useState<UserPrivacyPreferences>(initialPrivacyFromProfile)

  const privacyPolicy = useMemo<UserPrivacyPolicy>(() => {
    const policyRaw = (publicGlobalSettings as any)?.privacyPolicy
    return normalizePrivacyPolicy(policyRaw)
  }, [publicGlobalSettings])

  const effectivePrivacyPrefs = useMemo<UserPrivacyPreferences>(() => {
    return applyPrivacyPolicy(privacyPrefs, privacyPolicy)
  }, [privacyPrefs, privacyPolicy])

  const hasHydratedRef = useRef(false)
  const saveTimeoutRef = useRef<number | null>(null)

  /**
   * Réhydrate depuis le profil à chaque refresh de userProfile.
   */
  useEffect(() => {
    setSystemPrefsState(initialFromProfile)
    setPrivacyPrefsState(initialPrivacyFromProfile)
    hasHydratedRef.current = true
  }, [initialFromProfile, initialPrivacyFromProfile])

  /**
   * Applique la langue au DOM.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = systemPrefs.language
  }, [systemPrefs.language])

  /**
   * Applique le thème au DOM + persistance best-effort en localStorage.
   */
  useEffect(() => {
    const effective = resolveEffectiveTheme(systemPrefs.theme)
    applyThemeToDom(effective)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pb-theme', effective)
    }
  }, [systemPrefs.theme])

  /**
   * Persiste automatiquement les préférences système dans Supabase (debounce).
   */
  useEffect(() => {
    if (!hasHydratedRef.current) return
    if (!user?.id) return

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      const existing = ((userProfile as any)?.preferences && typeof (userProfile as any).preferences === 'object')
        ? (userProfile as any).preferences
        : {}

      const existingSystemNormalized = normalizeSystemPreferences((existing as any)?.system)
      const existingPrivacyNormalized = normalizePrivacyPreferences((existing as any)?.privacy)
      if (isSameSystemPrefs(existingSystemNormalized, systemPrefs) && isSamePrivacyPrefs(existingPrivacyNormalized, privacyPrefs)) {
        return
      }

      const nextSystem = {
        ...((existing as any)?.system && typeof (existing as any).system === 'object' ? (existing as any).system : {}),
        ...systemPrefs
      }
      const nextPrivacy = {
        ...((existing as any)?.privacy && typeof (existing as any).privacy === 'object' ? (existing as any).privacy : {}),
        ...privacyPrefs
      }
      const nextPreferences = { ...existing, system: nextSystem, privacy: nextPrivacy }
      void updateProfile({ preferences: nextPreferences } as any)
    }, 600)

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [systemPrefs, privacyPrefs, updateProfile, user?.id, userProfile])

  /**
   * Met à jour partiellement les préférences système (état local).
   */
  const setSystemPrefs = (updates: Partial<UserSystemPreferences>) => {
    setSystemPrefsState((prev) => ({ ...prev, ...updates }))
  }

  /**
   * Met à jour partiellement les préférences de confidentialité (état local).
   */
  const setPrivacyPrefs = (updates: Partial<UserPrivacyPreferences>) => {
    const filtered = filterPrivacyUpdates(updates, privacyPolicy)
    if (Object.keys(filtered).length === 0) return
    setPrivacyPrefsState((prev) => ({ ...prev, ...filtered }))
  }

  /**
   * Force une relecture des valeurs depuis userProfile.
   */
  const refreshFromProfile = () => {
    setSystemPrefsState(initialFromProfile)
    setPrivacyPrefsState(initialPrivacyFromProfile)
  }

  const value = useMemo<UserPreferencesContextValue>(() => {
    return {
      systemPrefs,
      setSystemPrefs,
      setTheme: (theme) => setSystemPrefs({ theme }),
      setLanguage: (language) => setSystemPrefs({ language }),
      setTimezone: (timezone) => setSystemPrefs({ timezone }),
      setCurrency: (currency) => setSystemPrefs({ currency }),
      privacyPrefs: effectivePrivacyPrefs,
      privacyPolicy,
      setPrivacyPrefs,
      setProfilePublic: (enabled) => setPrivacyPrefs({ profilePublic: enabled }),
      setSharePurchaseHistory: (enabled) => setPrivacyPrefs({ sharePurchaseHistory: enabled }),
      setShareStats: (enabled) => setPrivacyPrefs({ shareStats: enabled }),
      setAnalyticsEnabled: (enabled) => setPrivacyPrefs({ analyticsEnabled: enabled }),
      setPersonalizedRecommendations: (enabled) => setPrivacyPrefs({ personalizedRecommendations: enabled }),
      refreshFromProfile
    }
  }, [systemPrefs, effectivePrivacyPrefs, privacyPolicy, initialFromProfile, initialPrivacyFromProfile])

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
}
