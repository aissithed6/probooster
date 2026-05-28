"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { 
  Palette, Smartphone, Monitor, Zap, Eye, Accessibility, Plus, Edit, 
  Download, RefreshCw, BarChart3, CheckCircle, Search
} from 'lucide-react'

import { useNotifications } from '@/components/ui/modern-notification'
import { getClientAccessToken, supabase } from '@/lib/supabase'

// Interfaces pour le Design & UX
interface Theme {
  id: string
  name: string
  description: string
  isActive: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
  }
  typography: {
    fontFamily: string
    fontSize: number
    lineHeight: number
  }
  spacing: {
    base: number
    small: number
    medium: number
    large: number
  }
  borderRadius: number
  shadows: string[]
}

interface Animation {
  id: string
  name: string
  type: 'fade' | 'slide' | 'bounce' | 'scale' | 'rotate' | 'custom'
  duration: number
  easing: string
  isEnabled: boolean
  description: string
}

interface ResponsiveBreakpoint {
  name: string
  width: number
  isEnabled: boolean
  customizations: Record<string, any>
}

type ResponsiveFeatures = {
  navigationMobile: boolean
  adaptiveGrids: boolean
  responsiveImages: boolean
  touchGestures: boolean
}

interface AccessibilityFeature {
  id: string
  name: string
  description: string
  isEnabled: boolean
  impact: 'high' | 'medium' | 'low'
  category: 'vision' | 'mobility' | 'cognitive' | 'hearing'
}

interface PerformanceMetric {
  name: string
  current: number
  target: number
  unit: string
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor'
}

export default function DesignUX() {
  // États pour la gestion du design et UX
  const [themes, setThemes] = useState<Theme[]>([])
  const [animations, setAnimations] = useState<Animation[]>([])
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoint[]>([])
  const [responsiveFeatures, setResponsiveFeatures] = useState<ResponsiveFeatures>({
    navigationMobile: true,
    adaptiveGrids: true,
    responsiveImages: true,
    touchGestures: true
  })
  const [accessibilityFeatures, setAccessibilityFeatures] = useState<AccessibilityFeature[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [activeTab, setActiveTab] = useState('themes')
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showAnimationModal, setShowAnimationModal] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [themeDraft, setThemeDraft] = useState<Theme | null>(null)

  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [globalSettingsBase, setGlobalSettingsBase] = useState<Record<string, any>>({})
  const hasLoadedSettingsRef = useRef(false)

  const { addNotification } = useNotifications()

  /**
   * Normalise un thème venant potentiellement de la DB pour garantir une forme complète.
   */
  const normalizeTheme = useCallback((value: unknown, fallback?: Theme | null): Theme | null => {
    if (!value || typeof value !== 'object') return fallback ?? null
    const raw = value as any
    const id = typeof raw.id === 'string' ? raw.id.trim() : ''
    const name = typeof raw.name === 'string' ? raw.name : fallback?.name
    const description = typeof raw.description === 'string' ? raw.description : fallback?.description
    if (!id || !name || !description) return fallback ?? null

    const colorsRaw = raw.colors && typeof raw.colors === 'object' ? raw.colors : {}
    const typographyRaw = raw.typography && typeof raw.typography === 'object' ? raw.typography : {}
    const spacingRaw = raw.spacing && typeof raw.spacing === 'object' ? raw.spacing : {}

    const resolved: Theme = {
      id,
      name,
      description,
      isActive: Boolean(raw.isActive ?? fallback?.isActive ?? false),
      colors: {
        primary: typeof colorsRaw.primary === 'string' ? colorsRaw.primary : (fallback?.colors.primary ?? '#3B82F6'),
        secondary: typeof colorsRaw.secondary === 'string' ? colorsRaw.secondary : (fallback?.colors.secondary ?? '#6B7280'),
        accent: typeof colorsRaw.accent === 'string' ? colorsRaw.accent : (fallback?.colors.accent ?? '#10B981'),
        background: typeof colorsRaw.background === 'string' ? colorsRaw.background : (fallback?.colors.background ?? '#FFFFFF'),
        surface: typeof colorsRaw.surface === 'string' ? colorsRaw.surface : (fallback?.colors.surface ?? '#F9FAFB'),
        text: typeof colorsRaw.text === 'string' ? colorsRaw.text : (fallback?.colors.text ?? '#111827'),
        textSecondary: typeof colorsRaw.textSecondary === 'string' ? colorsRaw.textSecondary : (fallback?.colors.textSecondary ?? '#6B7280')
      },
      typography: {
        fontFamily: typeof typographyRaw.fontFamily === 'string' ? typographyRaw.fontFamily : (fallback?.typography.fontFamily ?? 'Inter'),
        fontSize: Number.isFinite(Number(typographyRaw.fontSize)) ? Number(typographyRaw.fontSize) : (fallback?.typography.fontSize ?? 16),
        lineHeight: Number.isFinite(Number(typographyRaw.lineHeight)) ? Number(typographyRaw.lineHeight) : (fallback?.typography.lineHeight ?? 1.6)
      },
      spacing: {
        base: Number.isFinite(Number(spacingRaw.base)) ? Number(spacingRaw.base) : (fallback?.spacing.base ?? 4),
        small: Number.isFinite(Number(spacingRaw.small)) ? Number(spacingRaw.small) : (fallback?.spacing.small ?? 8),
        medium: Number.isFinite(Number(spacingRaw.medium)) ? Number(spacingRaw.medium) : (fallback?.spacing.medium ?? 16),
        large: Number.isFinite(Number(spacingRaw.large)) ? Number(spacingRaw.large) : (fallback?.spacing.large ?? 24)
      },
      borderRadius: Number.isFinite(Number(raw.borderRadius)) ? Number(raw.borderRadius) : (fallback?.borderRadius ?? 8),
      shadows: Array.isArray(raw.shadows) ? raw.shadows.map((s: any) => String(s)) : (fallback?.shadows ?? [])
    }

    return resolved
  }, [])

  /**
   * Migration compat: anciens IDs mockés (1/2/3) vers des IDs stables (default/dark/custom).
   */
  const migrateThemeId = useCallback((id: string | null): string | null => {
    if (!id) return null
    const trimmed = id.trim()
    if (trimmed === '1') return 'default'
    if (trimmed === '2') return 'dark'
    if (trimmed === '3') return 'custom'
    return trimmed
  }, [])

  // Chargement des données initiales
  useEffect(() => {
    loadMockData()
    void loadGlobalSettings()
  }, [])

  /**
   * Exécute un fetch vers les endpoints Super Admin en injectant explicitement le token Supabase.
   */
  const fetchSuperAdmin = useCallback(async (path: string, init?: RequestInit) => {
    let accessToken = getClientAccessToken()

    if (!accessToken) {
      try {
        const { data } = await supabase.auth.getSession()
        accessToken = data?.session?.access_token ?? null
      } catch {
        accessToken = null
      }
    }

    if (!accessToken) {
      throw new Error('Session Supabase manquante ou expirée. Veuillez vous reconnecter.')
    }

    const headers = new Headers(init?.headers ?? {})
    headers.set('Authorization', `Bearer ${accessToken}`)

    return fetch(path, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store'
    })
  }, [])

  /**
   * Charge les réglages persistés (scope global) et synchronise :
   * - theme actif (settings.designUx.activeThemeId)
   * - couleurs globales (settings.siteConfig.primaryColor/secondaryColor/accentColor)
   */
  const loadGlobalSettings = useCallback(async () => {
    setIsLoadingSettings(true)
    try {
      const resp = await fetchSuperAdmin('/api/super-admin/settings?scopes=global', { method: 'GET' })
      const json = resp.ok ? await resp.json().catch(() => ({})) : {}

      if (!resp.ok) {
        throw new Error((json as any)?.error ?? 'Impossible de charger les réglages Design & UX.')
      }

      const data = (json as any)?.data
      const record = Array.isArray(data) ? data.find((row: any) => row?.scope === 'global') : null
      const settings = (record?.settings && typeof record.settings === 'object') ? record.settings : {}
      setGlobalSettingsBase(settings)
      hasLoadedSettingsRef.current = true

      const designUx = (settings as any)?.designUx && typeof (settings as any)?.designUx === 'object' ? (settings as any).designUx : {}
      const activeThemeIdRaw = typeof designUx?.activeThemeId === 'string' && designUx.activeThemeId.trim().length > 0 ? designUx.activeThemeId : null
      const activeThemeId = migrateThemeId(activeThemeIdRaw)

      const themesRaw: unknown = (designUx as any)?.themes

      const responsiveRaw: unknown = (designUx as any)?.responsive

      const animationsRaw: unknown = (designUx as any)?.animations
      const accessibilityRaw: unknown = (designUx as any)?.accessibilityFeatures

      const siteConfig = (settings as any)?.siteConfig && typeof (settings as any)?.siteConfig === 'object' ? (settings as any).siteConfig : {}
      const primaryColor = typeof siteConfig?.primaryColor === 'string' ? siteConfig.primaryColor : null
      const secondaryColor = typeof siteConfig?.secondaryColor === 'string' ? siteConfig.secondaryColor : null
      const accentColor = typeof siteConfig?.accentColor === 'string' ? siteConfig.accentColor : null

      setThemes((prev) => {
        const prevThemes = Array.isArray(prev) ? prev : []
        const defaults = prevThemes
        const byId = new Map<string, Theme>()
        defaults.forEach((t) => byId.set(t.id, t))

        const incomingThemes: Theme[] = Array.isArray(themesRaw)
          ? (themesRaw as any[])
              .map((t) => normalizeTheme(t, byId.get(String((t as any)?.id ?? '').trim()) ?? null))
              .filter((t): t is Theme => Boolean(t))
          : []

        const baseThemes = incomingThemes.length > 0 ? incomingThemes : defaults
        if (baseThemes.length === 0) return baseThemes

        const resolvedActiveId = activeThemeId ?? baseThemes.find((t) => t.isActive)?.id ?? baseThemes[0]?.id

        return baseThemes.map((theme) => {
          const themeId = migrateThemeId(theme.id) ?? theme.id
          const isActive = themeId === resolvedActiveId
          const nextTheme: Theme = { ...theme, id: themeId, isActive }

          // Correctif demandé: le thème "par défaut" doit refléter les couleurs actuelles du site.
          if (themeId === 'default') {
            nextTheme.colors = {
              ...nextTheme.colors,
              primary: primaryColor ?? nextTheme.colors.primary,
              secondary: secondaryColor ?? nextTheme.colors.secondary,
              accent: accentColor ?? nextTheme.colors.accent
            }
          }

          // Et si c'est le thème actif, on aligne aussi ses 3 couleurs principales sur le siteConfig,
          // afin d'éviter tout décalage visuel entre "thème actif" et "couleurs du site".
          if (isActive) {
            nextTheme.colors = {
              ...nextTheme.colors,
              primary: primaryColor ?? nextTheme.colors.primary,
              secondary: secondaryColor ?? nextTheme.colors.secondary,
              accent: accentColor ?? nextTheme.colors.accent
            }
          }

          return nextTheme
        })

      })

      setBreakpoints((prev) => {
        const current = Array.isArray(prev) ? prev : []
        const base = current.length > 0 ? current : [
          { name: 'Mobile', width: 768, isEnabled: true, customizations: {} },
          { name: 'Tablette', width: 1024, isEnabled: true, customizations: {} },
          { name: 'Desktop', width: 1440, isEnabled: true, customizations: {} },
          { name: 'Large Desktop', width: 1920, isEnabled: false, customizations: {} }
        ]

        const raw = responsiveRaw && typeof responsiveRaw === 'object' && !Array.isArray(responsiveRaw) ? (responsiveRaw as any) : {}
        const incoming = raw?.breakpoints
        if (!Array.isArray(incoming)) return base

        const byName = new Map<string, any>()
        ;(incoming as any[])
          .filter((x) => x && typeof x === 'object')
          .forEach((x) => {
            const name = String((x as any)?.name ?? '').trim()
            if (!name) return
            byName.set(name.toLowerCase(), x)
          })

        return base.map((bp) => {
          const incomingBp = byName.get(String(bp.name).toLowerCase())
          if (!incomingBp) return bp
          return {
            ...bp,
            width: Number.isFinite(Number((incomingBp as any)?.width)) ? Number((incomingBp as any).width) : bp.width,
            isEnabled: typeof (incomingBp as any)?.isEnabled === 'boolean' ? Boolean((incomingBp as any).isEnabled) : bp.isEnabled,
            customizations: (incomingBp as any)?.customizations && typeof (incomingBp as any).customizations === 'object' ? (incomingBp as any).customizations : bp.customizations
          } satisfies ResponsiveBreakpoint
        })
      })

      setResponsiveFeatures((prev) => {
        const raw = responsiveRaw && typeof responsiveRaw === 'object' && !Array.isArray(responsiveRaw) ? (responsiveRaw as any) : {}
        const incoming = raw?.features
        const features = incoming && typeof incoming === 'object' && !Array.isArray(incoming) ? (incoming as any) : {}
        return {
          navigationMobile: typeof features?.navigationMobile === 'boolean' ? features.navigationMobile : prev.navigationMobile,
          adaptiveGrids: typeof features?.adaptiveGrids === 'boolean' ? features.adaptiveGrids : prev.adaptiveGrids,
          responsiveImages: typeof features?.responsiveImages === 'boolean' ? features.responsiveImages : prev.responsiveImages,
          touchGestures: typeof features?.touchGestures === 'boolean' ? features.touchGestures : prev.touchGestures
        }
      })

      setAnimations((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev
        if (!Array.isArray(animationsRaw)) return prev

        const byId = new Map<string, any>()
        ;(animationsRaw as any[])
          .filter((x) => x && typeof x === 'object')
          .forEach((x: any) => {
            const id = String(x?.id ?? '').trim()
            if (!id) return
            byId.set(id, x)
          })

        return prev.map((a) => {
          const incoming = byId.get(a.id)
          if (!incoming) return a
          return {
            ...a,
            name: typeof incoming?.name === 'string' ? incoming.name : a.name,
            type:
              incoming?.type === 'fade' || incoming?.type === 'slide' || incoming?.type === 'bounce' || incoming?.type === 'scale' || incoming?.type === 'rotate' || incoming?.type === 'custom'
                ? incoming.type
                : a.type,
            duration: Number.isFinite(Number(incoming?.duration)) ? Number(incoming.duration) : a.duration,
            easing: typeof incoming?.easing === 'string' ? incoming.easing : a.easing,
            isEnabled: typeof incoming?.isEnabled === 'boolean' ? incoming.isEnabled : a.isEnabled,
            description: typeof incoming?.description === 'string' ? incoming.description : a.description
          } satisfies Animation
        })
      })

      setAccessibilityFeatures((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev
        if (!Array.isArray(accessibilityRaw)) return prev

        const byId = new Map<string, any>()
        ;(accessibilityRaw as any[])
          .filter((x) => x && typeof x === 'object')
          .forEach((x: any) => {
            const id = String(x?.id ?? '').trim()
            if (!id) return
            byId.set(id, x)
          })

        return prev.map((f) => {
          const incoming = byId.get(f.id)
          if (!incoming) return f
          return {
            ...f,
            name: typeof incoming?.name === 'string' ? incoming.name : f.name,
            description: typeof incoming?.description === 'string' ? incoming.description : f.description,
            isEnabled: typeof incoming?.isEnabled === 'boolean' ? incoming.isEnabled : f.isEnabled,
            impact: incoming?.impact === 'high' || incoming?.impact === 'medium' || incoming?.impact === 'low' ? incoming.impact : f.impact,
            category: incoming?.category === 'vision' || incoming?.category === 'mobility' || incoming?.category === 'cognitive' || incoming?.category === 'hearing' ? incoming.category : f.category
          } satisfies AccessibilityFeature
        })
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Design & UX',
        message: error instanceof Error ? error.message : 'Erreur lors du chargement des réglages.'
      })
    } finally {
      setIsLoadingSettings(false)
    }
  }, [addNotification, fetchSuperAdmin, migrateThemeId, normalizeTheme])

  /**
   * Sauvegarde le thème actif + les couleurs globales dans super_admin_settings (scope=global).
   */
  const saveDesignUxSettings = useCallback(async () => {
    if (!hasLoadedSettingsRef.current) {
      addNotification({
        type: 'warning',
        title: 'Design & UX',
        message: "Impossible de sauvegarder : les réglages n'ont pas été chargés (risque d'écrasement)."
      })
      return
    }

    setIsSavingSettings(true)
    try {
      const activeTheme = themes.find((t) => t.isActive) ?? null
      if (!activeTheme) {
        throw new Error('Aucun thème actif à sauvegarder.')
      }

      const normalizedActiveThemeId = migrateThemeId(activeTheme.id) ?? activeTheme.id

      const baseSiteConfig = (globalSettingsBase as any)?.siteConfig && typeof (globalSettingsBase as any).siteConfig === 'object'
        ? (globalSettingsBase as any).siteConfig
        : {}

      const mergedSettings: Record<string, unknown> = {
        ...(globalSettingsBase ?? {}),
        siteConfig: {
          ...baseSiteConfig,
          primaryColor: activeTheme.colors.primary,
          secondaryColor: activeTheme.colors.secondary,
          accentColor: activeTheme.colors.accent
        },
        designUx: {
          ...(((globalSettingsBase as any)?.designUx && typeof (globalSettingsBase as any).designUx === 'object') ? (globalSettingsBase as any).designUx : {}),
          activeThemeId: normalizedActiveThemeId,
          themes: themes.map((t) => ({
            id: migrateThemeId(t.id) ?? t.id,
            name: t.name,
            description: t.description,
            colors: t.colors,
            typography: t.typography,
            spacing: t.spacing,
            borderRadius: t.borderRadius,
            shadows: t.shadows
          })),
          responsive: {
            breakpoints: breakpoints.map((bp) => ({
              name: bp.name,
              width: bp.width,
              isEnabled: bp.isEnabled,
              customizations: bp.customizations ?? {}
            })),
            features: { ...responsiveFeatures }
          },
          animations: animations.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            duration: a.duration,
            easing: a.easing,
            isEnabled: a.isEnabled,
            description: a.description
          })),
          accessibilityFeatures: accessibilityFeatures.map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description,
            isEnabled: f.isEnabled,
            impact: f.impact,
            category: f.category
          }))
        }
      }

      const resp = await fetchSuperAdmin('/api/super-admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'global', settings: mergedSettings })
      })

      const json = resp.ok ? await resp.json().catch(() => ({})) : await resp.json().catch(() => ({}))
      if (!resp.ok) {
        throw new Error((json as any)?.error ?? 'Impossible de sauvegarder les réglages Design & UX.')
      }

      setGlobalSettingsBase(mergedSettings as Record<string, any>)
      addNotification({
        type: 'success',
        title: 'Design & UX',
        message: 'Réglages appliqués et sauvegardés.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Design & UX',
        message: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.'
      })
    } finally {
      setIsSavingSettings(false)
    }
  }, [accessibilityFeatures, addNotification, animations, breakpoints, fetchSuperAdmin, globalSettingsBase, migrateThemeId, responsiveFeatures, themes])

  /**
   * Exporte la configuration Design & UX au format JSON (ou CSV).
   */
  const exportDesignUx = useCallback(
    async (format: 'json' | 'csv' = 'json') => {
      try {
        const resp = await fetchSuperAdmin(`/api/super-admin/design-ux-export?format=${format}`, { method: 'GET' })

        if (!resp.ok) {
          const payload = await resp.json().catch(() => ({}))
          throw new Error((payload as any)?.error ?? 'Export échoué.')
        }

        const blob = await resp.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `design-ux-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${format}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)

        addNotification({
          type: 'success',
          title: 'Export',
          message: 'Export téléchargé.'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Export',
          message: error instanceof Error ? error.message : 'Erreur lors de l\'export.'
        })
      }
    },
    [addNotification, fetchSuperAdmin]
  )

  const loadMockData = () => {
    // Thèmes de démonstration
    const mockThemes: Theme[] = [
      {
        id: 'default',
        name: 'Thème Par Défaut',
        description: 'Thème principal avec couleurs modernes et professionnelles',
        isActive: true,
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#111827',
          textSecondary: '#6B7280'
        },
        typography: {
          fontFamily: 'Inter',
          fontSize: 16,
          lineHeight: 1.6
        },
        spacing: {
          base: 4,
          small: 8,
          medium: 16,
          large: 24
        },
        borderRadius: 8,
        shadows: ['0 1px 3px rgba(0,0,0,0.1)', '0 4px 6px rgba(0,0,0,0.1)']
      },
      {
        id: 'dark',
        name: 'Thème Sombre',
        description: 'Thème sombre pour une expérience nocturne confortable',
        isActive: false,
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981',
          background: '#1F2937',
          surface: '#374151',
          text: '#F9FAFB',
          textSecondary: '#D1D5DB'
        },
        typography: {
          fontFamily: 'Inter',
          fontSize: 16,
          lineHeight: 1.6
        },
        spacing: {
          base: 4,
          small: 8,
          medium: 16,
          large: 24
        },
        borderRadius: 8,
        shadows: ['0 1px 3px rgba(0,0,0,0.3)', '0 4px 6px rgba(0,0,0,0.3)']
      },
      {
        id: 'custom',
        name: 'Thème Personnalisé',
        description: 'Thème avec couleurs vives et design moderne',
        isActive: false,
        colors: {
          primary: '#9333EA',
          secondary: '#DB2777',
          accent: '#F97316',
          background: '#FFFFFF',
          surface: '#FDF2F8',
          text: '#1F2937',
          textSecondary: '#6B7280'
        },
        typography: {
          fontFamily: 'Poppins',
          fontSize: 16,
          lineHeight: 1.7
        },
        spacing: {
          base: 4,
          small: 8,
          medium: 16,
          large: 24
        },
        borderRadius: 12,
        shadows: ['0 2px 4px rgba(147,51,234,0.1)', '0 8px 16px rgba(147,51,234,0.1)']
      }
    ]

    // Animations de démonstration
    const mockAnimations: Animation[] = [
      {
        id: '1',
        name: 'Fondu d\'Entrée',
        type: 'fade',
        duration: 300,
        easing: 'ease-in-out',
        isEnabled: true,
        description: 'Animation de fondu pour l\'apparition des éléments'
      },
      {
        id: '2',
        name: 'Glissement Latéral',
        type: 'slide',
        duration: 400,
        easing: 'ease-out',
        isEnabled: true,
        description: 'Glissement horizontal des composants'
      },
      {
        id: '3',
        name: 'Rebond',
        type: 'bounce',
        duration: 600,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        isEnabled: false,
        description: 'Animation de rebond pour les interactions'
      },
      {
        id: '4',
        name: 'Mise à l\'Échelle',
        type: 'scale',
        duration: 200,
        easing: 'ease-in-out',
        isEnabled: true,
        description: 'Mise à l\'échelle des boutons et cartes'
      }
    ]

    // Points de rupture responsive
    const mockBreakpoints: ResponsiveBreakpoint[] = [
      { name: 'Mobile', width: 768, isEnabled: true, customizations: {} },
      { name: 'Tablette', width: 1024, isEnabled: true, customizations: {} },
      { name: 'Desktop', width: 1440, isEnabled: true, customizations: {} },
      { name: 'Large Desktop', width: 1920, isEnabled: false, customizations: {} }
    ]

    const mockResponsiveFeatures: ResponsiveFeatures = {
      navigationMobile: true,
      adaptiveGrids: true,
      responsiveImages: true,
      touchGestures: true
    }

    // Fonctionnalités d'accessibilité
    const mockAccessibilityFeatures: AccessibilityFeature[] = [
      {
        id: '1',
        name: 'Contraste Élevé',
        description: 'Amélioration du contraste pour une meilleure lisibilité',
        isEnabled: true,
        impact: 'high',
        category: 'vision'
      },
      {
        id: '2',
        name: 'Navigation au Clavier',
        description: 'Navigation complète via le clavier',
        isEnabled: true,
        impact: 'high',
        category: 'mobility'
      },
      {
        id: '3',
        name: 'Lecteur d\'Écran',
        description: 'Support complet des lecteurs d\'écran',
        isEnabled: true,
        impact: 'high',
        category: 'vision'
      },
      {
        id: '4',
        name: 'Réduction des Animations',
        description: 'Option pour réduire les animations',
        isEnabled: false,
        impact: 'medium',
        category: 'cognitive'
      }
    ]

    // Métriques de performance
    const mockPerformanceMetrics: PerformanceMetric[] = [
      {
        name: 'LCP (Largest Contentful Paint)',
        current: 1.2,
        target: 2.5,
        unit: 's',
        status: 'excellent'
      },
      {
        name: 'FID (First Input Delay)',
        current: 45,
        target: 100,
        unit: 'ms',
        status: 'excellent'
      },
      {
        name: 'CLS (Cumulative Layout Shift)',
        current: 0.05,
        target: 0.1,
        unit: '',
        status: 'excellent'
      },
      {
        name: 'FCP (First Contentful Paint)',
        current: 0.8,
        target: 1.8,
        unit: 's',
        status: 'excellent'
      }
    ]

    setThemes(mockThemes)
    setAnimations(mockAnimations)
    setBreakpoints(mockBreakpoints)
    setResponsiveFeatures(mockResponsiveFeatures)
    setAccessibilityFeatures(mockAccessibilityFeatures)
    setPerformanceMetrics(mockPerformanceMetrics)
  }

  const formatBreakpointLabel = useCallback((bp: ResponsiveBreakpoint) => {
    const width = Math.round(bp.width)
    const name = String(bp.name).toLowerCase()
    if (name.includes('mobile')) return `≤ ${width}px`
    if (name.includes('table')) return `${Math.max(0, width - 255)}px - ${width}px`
    if (name.includes('desktop') && name.includes('large')) return `≥ ${width}px`
    if (name.includes('desktop')) return `≥ ${width + 1}px`
    return `${width}px`
  }, [])

  // Fonctions utilitaires
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'excellent': 'default',
      'good': 'secondary',
      'needs-improvement': 'outline',
      'poor': 'destructive'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'high': 'destructive',
      'medium': 'secondary',
      'low': 'outline'
    }
    return <Badge variant={variants[impact] || 'outline'}>{impact}</Badge>
  }

  const toggleTheme = (themeId: string) => {
    const resolvedId = migrateThemeId(themeId) ?? themeId
    setThemes(prev => prev.map(theme => ({
      ...theme,
      isActive: (migrateThemeId(theme.id) ?? theme.id) === resolvedId
    })))
  }

  const toggleAnimation = (animationId: string) => {
    setAnimations(prev => prev.map(animation => ({
      ...animation,
      isEnabled: animation.id === animationId ? !animation.isEnabled : animation.isEnabled
    })))
  }

  const toggleAccessibilityFeature = (featureId: string) => {
    setAccessibilityFeatures(prev => prev.map(feature => ({
      ...feature,
      isEnabled: feature.id === featureId ? !feature.isEnabled : feature.isEnabled
    })))
  }

  const createNewTheme = () => {
    setSelectedTheme(null)
    setThemeDraft({
      id: `theme_${Date.now()}`,
      name: '',
      description: '',
      isActive: false,
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 1.6
      },
      spacing: {
        base: 4,
        small: 8,
        medium: 16,
        large: 24
      },
      borderRadius: 8,
      shadows: ['0 1px 3px rgba(0,0,0,0.1)', '0 4px 6px rgba(0,0,0,0.1)']
    })
    setShowThemeModal(true)
  }

  const editTheme = (theme: Theme) => {
    setSelectedTheme(theme)
    setThemeDraft({ ...theme })
    setShowThemeModal(true)
  }

  /**
   * Crée ou met à jour un thème dans l'état local. La persistance DB se fait via le bouton "Appliquer".
   */
  const upsertThemeDraft = useCallback(() => {
    if (!themeDraft) return

    const nextId = themeDraft.id.trim()
    if (!nextId) {
      addNotification({
        type: 'error',
        title: 'Thèmes',
        message: 'ID de thème invalide.'
      })
      return
    }

    const nextName = themeDraft.name.trim()
    if (!nextName) {
      addNotification({
        type: 'error',
        title: 'Thèmes',
        message: 'Le nom du thème est obligatoire.'
      })
      return
    }

    setThemes((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const idx = list.findIndex((t) => t.id === nextId)
      if (idx >= 0) {
        const updated = [...list]
        updated[idx] = { ...themeDraft, id: nextId, name: nextName, isActive: list[idx]?.isActive ?? false }
        return updated
      }
      return [...list, { ...themeDraft, id: nextId, name: nextName, isActive: false }]
    })

    setShowThemeModal(false)
  }, [addNotification, themeDraft])

  const createNewAnimation = () => {
    setSelectedAnimation(null)
    setShowAnimationModal(true)
  }

  const editAnimation = (animation: Animation) => {
    setSelectedAnimation(animation)
    setShowAnimationModal(true)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Design & Expérience Utilisateur</h2>
            <p className="text-gray-600 mt-2">
              Personnalisation avancée de l'interface, accessibilité complète et expérience utilisateur optimisée
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={isPreviewMode ? 'bg-purple-100 border-purple-300' : ''}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? 'Mode Prévisualisation' : 'Prévisualiser'}
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => void saveDesignUxSettings()}
              disabled={isSavingSettings || isLoadingSettings}
            >
              <Palette className="h-4 w-4 mr-2" />
              Appliquer
            </Button>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher dans les thèmes, animations, accessibilité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadGlobalSettings()} disabled={isLoadingSettings || isSavingSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
        <Button variant="outline" size="sm" onClick={() => void exportDesignUx('json')} disabled={isLoadingSettings || isSavingSettings}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{themes.length}</p>
                <p className="text-sm text-gray-600">Thèmes disponibles</p>
                <p className="text-xs text-green-600 mt-1">
                  {themes.filter(t => t.isActive).length} actif
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-gray-600">Responsive</p>
                <p className="text-xs text-blue-600 mt-1">
                  {breakpoints.filter(b => b.isEnabled).length} breakpoints
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">98.7</p>
                <p className="text-sm text-gray-600">Score Performance</p>
                <p className="text-xs text-green-600 mt-1">
                  {performanceMetrics.filter(p => p.status === 'excellent').length}/{performanceMetrics.length} excellent
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Accessibility className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">AAA</p>
                <p className="text-sm text-gray-600">Accessibilité</p>
                <p className="text-xs text-purple-600 mt-1">
                  {accessibilityFeatures.filter(a => a.isEnabled).length}/{accessibilityFeatures.length} activées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="themes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="themes">Thèmes</TabsTrigger>
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
          <TabsTrigger value="animations">Animations</TabsTrigger>
          <TabsTrigger value="accessibilite">Accessibilité</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="personnalisation">Personnalisation</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-6">
          {/* En-tête de l'onglet Thèmes */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Gestion des Thèmes</h3>
              <p className="text-sm text-gray-600">
                Configuration avancée des thèmes, palettes de couleurs et personnalisation
              </p>
            </div>
            <Button onClick={createNewTheme} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Thème
            </Button>
          </div>

          {/* Grille des thèmes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <Card key={theme.id} className={`relative ${theme.isActive ? 'ring-2 ring-purple-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {theme.isActive ? (
                        <Badge variant="default" className="bg-green-600">Actif</Badge>
                      ) : (
                        <Badge variant="outline">Inactif</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editTheme(theme)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{theme.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Aperçu des couleurs */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Palette de Couleurs</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-200" 
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                          <span className="text-xs">Primaire</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-200" 
                            style={{ backgroundColor: theme.colors.secondary }}
                          />
                          <span className="text-xs">Secondaire</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-200" 
                            style={{ backgroundColor: theme.colors.accent }}
                          />
                          <span className="text-xs">Accent</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-200" 
                            style={{ backgroundColor: theme.colors.background }}
                          />
                          <span className="text-xs">Fond</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-200" 
                            style={{ backgroundColor: theme.colors.surface }}
                          />
                          <span className="text-xs">Surface</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border border-gray-200" 
                            style={{ backgroundColor: theme.colors.text }}
                          />
                          <span className="text-xs">Texte</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typographie */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Typographie</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Police: {theme.typography.fontFamily}</div>
                      <div>Taille: {theme.typography.fontSize}px</div>
                      <div>Hauteur: {theme.typography.lineHeight}</div>
                    </div>
                  </div>

                  {/* Espacement et bordures */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Espacement & Bordures</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Base: {theme.spacing.base}px</div>
                      <div>Bordures: {theme.borderRadius}px</div>
                      <div>Ombres: {theme.shadows.length}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {!theme.isActive && (
                      <Button 
                        size="sm" 
                        onClick={() => toggleTheme(theme.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activer
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => editTheme(theme)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Statistiques des thèmes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Statistiques des Thèmes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{themes.length}</div>
                  <div className="text-sm text-blue-800">Total thèmes</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{themes.filter(t => t.isActive).length}</div>
                  <div className="text-sm text-green-800">Thèmes actifs</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {themes.filter(t => t.typography.fontFamily === 'Inter').length}
                  </div>
                  <div className="text-sm text-purple-800">Police Inter</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {themes.filter(t => t.borderRadius > 8).length}
                  </div>
                  <div className="text-sm text-orange-800">Bordures arrondies</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Design Responsive</CardTitle>
              <CardDescription>
                Configuration de l'adaptabilité sur tous les appareils
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Points de Rupture</h4>
                  <div className="space-y-3">
                    {breakpoints
                      .filter((bp) => bp.isEnabled)
                      .slice(0, 3)
                      .map((bp) => {
                        const name = String(bp.name).toLowerCase()
                        const isMobile = name.includes('mobile')
                        const isTablet = name.includes('table')
                        const Icon = isMobile ? Smartphone : Monitor
                        const iconColor = isMobile ? 'text-blue-600' : isTablet ? 'text-green-600' : 'text-purple-600'

                        return (
                          <div key={bp.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Icon className={`h-5 w-5 ${iconColor}`} />
                              <span className="text-sm">{bp.name}</span>
                            </div>
                            <span className="text-sm text-gray-600">{formatBreakpointLabel(bp)}</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Fonctionnalités Responsives</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Navigation mobile</span>
                      <input
                        type="checkbox"
                        checked={responsiveFeatures.navigationMobile}
                        onChange={(e) => setResponsiveFeatures((prev) => ({ ...prev, navigationMobile: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Grilles adaptatives</span>
                      <input
                        type="checkbox"
                        checked={responsiveFeatures.adaptiveGrids}
                        onChange={(e) => setResponsiveFeatures((prev) => ({ ...prev, adaptiveGrids: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Images responsives</span>
                      <input
                        type="checkbox"
                        checked={responsiveFeatures.responsiveImages}
                        onChange={(e) => setResponsiveFeatures((prev) => ({ ...prev, responsiveImages: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Touch gestures</span>
                      <input
                        type="checkbox"
                        checked={responsiveFeatures.touchGestures}
                        onChange={(e) => setResponsiveFeatures((prev) => ({ ...prev, touchGestures: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="animations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Animations & Transitions</CardTitle>
              <CardDescription>
                Configuration des animations et effets visuels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Types d'Animations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fade in/out</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Slide transitions</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Hover effects</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Loading spinners</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Paramètres</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Durée par défaut</span>
                      <span className="text-sm text-gray-600">300ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Easing</span>
                      <span className="text-sm text-gray-600">ease-in-out</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Réduction motion</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibilite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accessibilité</CardTitle>
              <CardDescription>
                Configuration de l'accessibilité et des standards WCAG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Standards WCAG</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">Niveau A</span>
                      <Badge variant="default">Conforme</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">Niveau AA</span>
                      <Badge variant="default">Conforme</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">Niveau AAA</span>
                      <Badge variant="outline">En cours</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Fonctionnalités</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Navigation clavier</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lecteurs d'écran</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Contraste élevé</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Taille de police</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance & Optimisation</CardTitle>
              <CardDescription>
                Métriques de performance et optimisations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Core Web Vitals</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">LCP (Largest Contentful Paint)</span>
                      <Badge variant="default">1.2s</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">FID (First Input Delay)</span>
                      <Badge variant="default">45ms</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">CLS (Cumulative Layout Shift)</span>
                      <Badge variant="default">0.05</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Optimisations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lazy loading</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Code splitting</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Image optimization</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Minification</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personnalisation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation Avancée</CardTitle>
              <CardDescription>
                Configuration des éléments d'interface personnalisables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Interface</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mode sombre automatique</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Animations personnalisées</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Icônes personnalisées</span>
                      <input type="checkbox" className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Layout personnalisable</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Contenu</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Langue par défaut</span>
                      <select className="text-sm border border-gray-300 rounded px-2 py-1">
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Format de date</span>
                      <select className="text-sm border border-gray-300 rounded px-2 py-1">
                        <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                        <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Devise</span>
                      <select className="text-sm border border-gray-300 rounded px-2 py-1">
                        <option value="XOF">FCFA (XOF)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="USD">Dollar US (USD)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de création/édition de thème */}
      <Dialog open={showThemeModal} onOpenChange={setShowThemeModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {selectedTheme ? 'Modifier le Thème' : 'Créer un Nouveau Thème'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="themeName">Nom du thème</Label>
                <Input 
                  id="themeName" 
                  placeholder="Ex: Thème Moderne"
                  value={themeDraft?.name ?? ''}
                  onChange={(e) =>
                    setThemeDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            name: e.target.value
                          }
                        : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themeDescription">Description</Label>
                <Input 
                  id="themeDescription" 
                  placeholder="Description du thème"
                  value={themeDraft?.description ?? ''}
                  onChange={(e) =>
                    setThemeDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            description: e.target.value
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            {/* Palette de couleurs */}
            <div className="space-y-4">
              <h4 className="font-medium">Palette de Couleurs</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Couleur Primaire</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="primaryColor" 
                      type="color" 
                      value={themeDraft?.colors.primary ?? '#3B82F6'}
                      onChange={(e) =>
                        setThemeDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                colors: { ...prev.colors, primary: e.target.value }
                              }
                            : prev
                        )
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input 
                      placeholder="#3B82F6"
                      value={themeDraft?.colors.primary ?? ''}
                      onChange={(e) =>
                        setThemeDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                colors: { ...prev.colors, primary: e.target.value }
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Couleur Secondaire</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="secondaryColor" 
                      type="color" 
                      value={themeDraft?.colors.secondary ?? '#6B7280'}
                      onChange={(e) =>
                        setThemeDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                colors: { ...prev.colors, secondary: e.target.value }
                              }
                            : prev
                        )
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input 
                      placeholder="#6B7280"
                      value={themeDraft?.colors.secondary ?? ''}
                      onChange={(e) =>
                        setThemeDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                colors: { ...prev.colors, secondary: e.target.value }
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Couleur d'Accent</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="accentColor" 
                      type="color" 
                      value={themeDraft?.colors.accent ?? '#10B981'}
                      onChange={(e) =>
                        setThemeDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                colors: { ...prev.colors, accent: e.target.value }
                              }
                            : prev
                        )
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input 
                      placeholder="#10B981"
                      value={themeDraft?.colors.accent ?? ''}
                      onChange={(e) =>
                        setThemeDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                colors: { ...prev.colors, accent: e.target.value }
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Couleur de Fond</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="backgroundColor" 
                      type="color" 
                      value={themeDraft?.colors.background ?? '#FFFFFF'}
                      onChange={(e) =>
                        setThemeDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                colors: { ...prev.colors, background: e.target.value }
                              }
                            : prev
                        )
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input 
                      placeholder="#FFFFFF"
                      value={themeDraft?.colors.background ?? ''}
                      onChange={(e) =>
                        setThemeDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                colors: { ...prev.colors, background: e.target.value }
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typographie */}
            <div className="space-y-4">
              <h4 className="font-medium">Typographie</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Famille de Police</Label>
                  <Select
                    value={themeDraft?.typography.fontFamily ?? 'Inter'}
                    onValueChange={(value) =>
                      setThemeDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              typography: { ...prev.typography, fontFamily: value }
                            }
                          : prev
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontSize">Taille de Police (px)</Label>
                  <Input 
                    id="fontSize" 
                    type="number" 
                    value={themeDraft?.typography.fontSize ?? 16}
                    onChange={(e) =>
                      setThemeDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              typography: { ...prev.typography, fontSize: Number(e.target.value) }
                            }
                          : prev
                      )
                    }
                    min="12"
                    max="24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineHeight">Hauteur de Ligne</Label>
                  <Input 
                    id="lineHeight" 
                    type="number" 
                    value={themeDraft?.typography.lineHeight ?? 1.6}
                    onChange={(e) =>
                      setThemeDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              typography: { ...prev.typography, lineHeight: Number(e.target.value) }
                            }
                          : prev
                      )
                    }
                    min="1"
                    max="2"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Espacement et bordures */}
            <div className="space-y-4">
              <h4 className="font-medium">Espacement et Bordures</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseSpacing">Espacement de Base (px)</Label>
                  <Input 
                    id="baseSpacing" 
                    type="number" 
                    value={themeDraft?.spacing.base ?? 4}
                    onChange={(e) =>
                      setThemeDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              spacing: { ...prev.spacing, base: Number(e.target.value) }
                            }
                          : prev
                      )
                    }
                    min="2"
                    max="8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Rayon des Bordures (px)</Label>
                  <Input 
                    id="borderRadius" 
                    type="number" 
                    value={themeDraft?.borderRadius ?? 8}
                    onChange={(e) =>
                      setThemeDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              borderRadius: Number(e.target.value)
                            }
                          : prev
                      )
                    }
                    min="0"
                    max="24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shadowCount">Nombre d'Ombres</Label>
                  <Input 
                    id="shadowCount" 
                    type="number" 
                    value={themeDraft?.shadows.length ?? 2}
                    onChange={(e) => {
                      const count = Number(e.target.value)
                      setThemeDraft((prev) => {
                        if (!prev) return prev
                        const safeCount = Number.isFinite(count) ? Math.max(0, Math.min(5, count)) : prev.shadows.length
                        const base = prev.shadows.length > 0 ? prev.shadows : ['0 1px 3px rgba(0,0,0,0.1)']
                        const nextShadows = Array.from({ length: safeCount }, (_, idx) => base[idx] ?? base[base.length - 1])
                        return { ...prev, shadows: nextShadows }
                      })
                    }}
                    min="0"
                    max="5"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowThemeModal(false)}>
                Annuler
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={upsertThemeDraft}>
                {selectedTheme ? 'Modifier' : 'Créer'} le Thème
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de création/édition d'animation */}
      <Dialog open={showAnimationModal} onOpenChange={setShowAnimationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {selectedAnimation ? 'Modifier l\'Animation' : 'Créer une Nouvelle Animation'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="animationName">Nom de l'animation</Label>
                <Input 
                  id="animationName" 
                  placeholder="Ex: Fondu d'Entrée"
                  defaultValue={selectedAnimation?.name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="animationType">Type d'animation</Label>
                <Select defaultValue={selectedAnimation?.type || 'fade'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Fondu</SelectItem>
                    <SelectItem value="slide">Glissement</SelectItem>
                    <SelectItem value="bounce">Rebond</SelectItem>
                    <SelectItem value="scale">Mise à l'échelle</SelectItem>
                    <SelectItem value="rotate">Rotation</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="animationDuration">Durée (ms)</Label>
                <Input 
                  id="animationDuration" 
                  type="number" 
                  defaultValue={selectedAnimation?.duration || 300}
                  min="100"
                  max="2000"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="animationEasing">Fonction d'Easing</Label>
                <Select defaultValue={selectedAnimation?.easing || 'ease-in-out'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                    <SelectItem value="ease-in">Ease In</SelectItem>
                    <SelectItem value="ease-out">Ease Out</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="cubic-bezier">Cubic Bezier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="animationDescription">Description</Label>
              <Textarea 
                id="animationDescription" 
                placeholder="Description de l'animation et de son utilisation"
                defaultValue={selectedAnimation?.description || ''}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="animationEnabled" 
                defaultChecked={selectedAnimation?.isEnabled || false}
              />
              <Label htmlFor="animationEnabled">Animation activée</Label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAnimationModal(false)}>
                Annuler
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {selectedAnimation ? 'Modifier' : 'Créer'} l'Animation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
