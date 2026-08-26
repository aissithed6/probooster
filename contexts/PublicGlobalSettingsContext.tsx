"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'

type PublicSiteConfig = {
  siteName: string | null
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  accentColor: string | null
  currency: string | null
  language: string | null
  timezone: string | null
  dateFormat: string | null
  timeFormat: string | null
}

type PublicContactInfo = {
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  city: string | null
  country: string | null
  postalCode: string | null
}

type PublicSeoConfig = {
  defaultTitle: string | null
  titleTemplate: string | null
  defaultDescription: string | null
  keywords: string | null
  robots: string | null
}

type PublicAnalyticsConfig = {
  googleAnalyticsId: string | null
  facebookPixelId: string | null
}

type PublicCustomScriptsConfig = {
  head: string | null
  body: string | null
}

type PublicPrivacyPolicyRule = {
  locked: boolean
  forceValue: boolean | null
}

type PublicPrivacyPolicyConfig = {
  profilePublic: PublicPrivacyPolicyRule
  sharePurchaseHistory: PublicPrivacyPolicyRule
  shareStats: PublicPrivacyPolicyRule
  analyticsEnabled: PublicPrivacyPolicyRule
  personalizedRecommendations: PublicPrivacyPolicyRule
}

type PublicSecurityConfig = {
  twoFactorAuth: boolean
  googleAuth: boolean
  facebookAuth: boolean
  appleAuth: boolean
  xAuth: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
  }
}

type PublicNotificationConfig = {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  orderUpdates: boolean
  securityAlerts: boolean
  newsletter: boolean
}

type PublicPaymentMethod = {
  id: string
  name: string
  type: string
  provider: string
  logo: string | null
  isActive: boolean
  fees: {
    percentage: number
    fixed: number
    currency: string
  } | null
  limits: {
    min: number
    max: number
    currency: string
  } | null
  countries: string[]
  description: string | null
  instructions: string | null
  apiKeys: {
    publicKey: string | null
    webhookUrl: string | null
  } | null
}

type PublicResponsiveBreakpoint = {
  name: string
  width: number
  isEnabled: boolean
}

type PublicResponsiveFeatures = {
  navigationMobile: boolean
  adaptiveGrids: boolean
  responsiveImages: boolean
  touchGestures: boolean
}

type PublicGlobalSettings = {
  siteConfig: PublicSiteConfig
  contactInfo: PublicContactInfo
  paymentMethods: PublicPaymentMethod[]
  securityConfig: PublicSecurityConfig
  notificationConfig: PublicNotificationConfig
  seo: PublicSeoConfig
  analytics: PublicAnalyticsConfig
  customScripts: PublicCustomScriptsConfig
  privacyPolicy: PublicPrivacyPolicyConfig
  designUx: {
    activeThemeId: string | null
    responsive: {
      breakpoints: PublicResponsiveBreakpoint[]
      features: PublicResponsiveFeatures
    }
  }
  chatWidget: {
    enabled: boolean
    provider: string | null
    embedCode: string | null
  }
}

type PublicGlobalSettingsState = {
  data: PublicGlobalSettings | null
  updatedAt: string | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const PublicGlobalSettingsContext = createContext<PublicGlobalSettingsState | null>(null)

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Erreur inconnue.'
}

function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim()
  if (!isHexColor(raw)) return null
  const normalized = raw.length === 4
    ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
    : raw

  const int = Number.parseInt(normalized.slice(1), 16)
  if (!Number.isFinite(int)) return null
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  }
}

function rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

function toCssHsl(value: string): string | null {
  const rgb = hexToRgb(value)
  if (!rgb) return null
  const { h, s, l } = rgbToHsl(rgb)
  return `${h} ${s}% ${l}%`
}

function setRootCssVar(name: string, value: string | null) {
  if (typeof document === 'undefined') return
  if (!name) return
  const root = document.documentElement
  if (!root) return
  if (!value) return
  root.style.setProperty(name, value)
}

/**
 * PublicGlobalSettingsProvider charge les réglages publics "safe" depuis /api/public/global-settings.
 */
export function PublicGlobalSettingsProvider({
  children,
  initialState
}: {
  children: React.ReactNode
  initialState?: { data: PublicGlobalSettings | null; updatedAt: string | null }
}) {
  const [data, setData] = useState<PublicGlobalSettings | null>(() => initialState?.data ?? null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => initialState?.updatedAt ?? null)
  const [isLoading, setIsLoading] = useState(() => !(initialState?.data))
  const [error, setError] = useState<string | null>(null)

  const hasReceivedRealtimeEventRef = useRef(false)

  const refresh = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background === true
    if (!background) {
      setIsLoading(true)
    }
    setError(null)
    try {
      const response = await fetch('/api/public/global-settings', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement des réglages publics (HTTP ${response.status})`)
      }

      // Utiliser response.text() puis JSON.parse pour éviter certains bugs Web Streams observés en dev
      // (ex: TypeError: controller[kState].transformAlgorithm is not a function)
      const rawText = await response.text()
      const json = (rawText ? JSON.parse(rawText) : null) as { data?: PublicGlobalSettings | null; debug?: { updated_at?: string | null } } | null
      setData(json?.data ?? null)
      setUpdatedAt((json as any)?.debug?.updated_at ?? null)

      if (typeof window !== 'undefined') {
        ;(window as any).__publicGlobalSettings = json?.data ?? null
        ;(window as any).__publicGlobalSettingsUpdatedAt = (json as any)?.debug?.updated_at ?? null
      }

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[PublicGlobalSettings] fetched', {
          updatedAt: (json as any)?.debug?.updated_at ?? null,
          hasData: Boolean(json?.data),
          siteName: (json as any)?.data?.siteConfig?.siteName ?? null,
          hasLogo: Boolean((json as any)?.data?.siteConfig?.logoUrl),
          hasFavicon: Boolean((json as any)?.data?.siteConfig?.faviconUrl)
        })
      }
    } catch (err) {
      setError(normalizeError(err))
      setData(null)
      setUpdatedAt(null)
    } finally {
      if (!background) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const primary = data?.siteConfig?.primaryColor
    const secondary = data?.siteConfig?.secondaryColor
    const accent = data?.siteConfig?.accentColor

    const primaryHsl = typeof primary === 'string' ? toCssHsl(primary) : null
    const secondaryHsl = typeof secondary === 'string' ? toCssHsl(secondary) : null
    const accentHsl = typeof accent === 'string' ? toCssHsl(accent) : null

    // Mapping direct sur les variables shadcn/tailwind existantes.
    // Cela applique les couleurs globalement sans changer la structure de l'UI.
    setRootCssVar('--primary', primaryHsl)
    setRootCssVar('--secondary', secondaryHsl)
    setRootCssVar('--accent', accentHsl)
    // Garder aussi le ring cohérent avec la primaire.
    setRootCssVar('--ring', primaryHsl)
  }, [data?.siteConfig?.accentColor, data?.siteConfig?.primaryColor, data?.siteConfig?.secondaryColor])

  useEffect(() => {
    let pollingId: number | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

        /**
     * Polling de secours UNIQUEMENT utilisé si la Realtime est indisponible.
     *
     * Avant : 2 000 ms (0,5 req/s) lancé SYSTÉMATIQUEMENT au montage, sur
     * TOUTES les routes (PublicGlobalSettingsProvider est dans le root layout).
     * Résultat : ~43 200 req/jour/onglet -> saturation serveur -> 503 -> retry
     * -> 429. Ce polling est la cause du "tout plante en même temps" des 5
     * sections quand la Realtime n'est pas active.
     *
     * Après : 60 000 ms, démarré UNIQUEMENT si la Realtime échoue ET si
     * l'onglet est visible (pause en background / onglet caché). La Realtime
     * SUBSCRIBED arrête ce fallback; CLOSED/CHANNEL_ERROR le relance.
     */
    const startPolling = () => {
      if (pollingId) return
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      pollingId = window.setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
        refresh({ background: true })
      }, 60_000)
    }

    const stopPolling = () => {
      if (pollingId) {
        window.clearInterval(pollingId)
        pollingId = null
      }
    }

    /**
     * Abonnement Realtime sur super_admin_settings.
     * - SUBSCRIBED  -> on arrête le polling (plus besoin du fallback).
     * - CLOSED / CHANNEL_ERROR / BROKEN -> on relance le fallback 60 s.
     * Le polling n'est donc JAMAIS démarré automatiquement au montage : il ne
     * sert que si la Realtime est morte/désactivée.
     */
    const startRealtime = async () => {
      try {
        channel = supabase
          .channel('public-global-settings')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'super_admin_settings',
              filter: 'scope=eq.global'
            },
            () => {
              hasReceivedRealtimeEventRef.current = true
              // Realtime en marche: le fallback 60 s devient inutile.
              stopPolling()
              refresh({ background: true })
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              stopPolling()
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'BROKEN') {
              stopPolling()
              startPolling()
            }
          })
      } catch {
        // fallback polling uniquement en cas d'erreur de création du canal
        startPolling()
      }

      // Si la Realtime ne push rien dans les 10 s (RLS/désactivée), on active
      // le fallback 60 s — mais seulement si aucun SUBSCRIBED + event reçu.
      window.setTimeout(() => {
        if (cancelled) return
        if (!hasReceivedRealtimeEventRef.current) {
          startPolling()
        }
      }, 10_000)
    }

    startRealtime()

    return () => {
      cancelled = true
      if (pollingId) {
        window.clearInterval(pollingId)
      }
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [refresh])

  const value = useMemo<PublicGlobalSettingsState>(
    () => ({ data, updatedAt, isLoading, error, refresh }),
    [data, updatedAt, isLoading, error, refresh]
  )

  return <PublicGlobalSettingsContext.Provider value={value}>{children}</PublicGlobalSettingsContext.Provider>
}

export function usePublicGlobalSettings() {
  const ctx = useContext(PublicGlobalSettingsContext)
  if (!ctx) {
    throw new Error('usePublicGlobalSettings doit être utilisé dans un PublicGlobalSettingsProvider')
  }
  return ctx
}
