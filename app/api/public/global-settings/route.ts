import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asBoolean(value: unknown): boolean {
  return value === true
}

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Normalise designUx.responsive (breakpoints + features) en vue publique safe. */
function normalizeDesignUxResponsive(value: unknown): { breakpoints: PublicResponsiveBreakpoint[]; features: PublicResponsiveFeatures } {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as any) : {}

  const incomingBreakpoints = Array.isArray(raw?.breakpoints) ? (raw.breakpoints as any[]) : []
  const breakpoints: PublicResponsiveBreakpoint[] = incomingBreakpoints
    .filter((bp) => bp && typeof bp === 'object')
    .map((bp) => {
      const name = asString((bp as any)?.name) ?? ''
      return {
        name,
        width: Math.max(0, Math.round(asNumber((bp as any)?.width, 0))),
        isEnabled: asBoolean((bp as any)?.isEnabled)
      }
    })
    .filter((bp) => Boolean(bp.name) && bp.width > 0)

  const featuresRaw = raw?.features && typeof raw.features === 'object' && !Array.isArray(raw.features) ? (raw.features as any) : {}
  const features: PublicResponsiveFeatures = {
    navigationMobile: asBoolean(featuresRaw?.navigationMobile ?? true),
    adaptiveGrids: asBoolean(featuresRaw?.adaptiveGrids ?? true),
    responsiveImages: asBoolean(featuresRaw?.responsiveImages ?? true),
    touchGestures: asBoolean(featuresRaw?.touchGestures ?? true)
  }

  return { breakpoints, features }
}

function asNullableBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return null
}

function normalizePrivacyPolicyRule(value: unknown): PublicPrivacyPolicyRule {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as any) : {}
  return {
    locked: asBoolean(raw.locked ?? raw.lock ?? raw.isLocked),
    forceValue: asNullableBoolean(raw.forceValue ?? raw.forcedValue ?? raw.force)
  }
}

function normalizePrivacyPolicy(value: unknown): PublicPrivacyPolicyConfig {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as any) : {}
  return {
    profilePublic: normalizePrivacyPolicyRule(raw.profilePublic),
    sharePurchaseHistory: normalizePrivacyPolicyRule(raw.sharePurchaseHistory),
    shareStats: normalizePrivacyPolicyRule(raw.shareStats),
    analyticsEnabled: normalizePrivacyPolicyRule(raw.analyticsEnabled),
    personalizedRecommendations: normalizePrivacyPolicyRule(raw.personalizedRecommendations)
  }
}

function sanitizeCustomScript(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null

  // Blocage basique des balises <script> et d'injections évidentes.
  // On laisse l'admin coller uniquement du HTML "safe" (ex: <meta>, <link>, <noscript>, <style>).
  // Pour des besoins plus avancés, on ajoutera une whitelist stricte.
  if (/<\s*script\b/i.test(raw)) return null
  if (/on\w+\s*=/i.test(raw)) return null

  return raw
}

function safeTrackingId(value: unknown): string | null {
  const id = asString(value)
  if (!id) return null
  // GA4 measurement id (G-XXXX) ou UA-XXXX. On reste permissif mais on coupe les espaces.
  return id.replace(/\s+/g, '') || null
}

/**
 * GET /api/public/global-settings
 * Expose une vue "safe" des réglages globaux Super Admin pour consommation côté public.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('super_admin_settings')
      .select('settings, updated_at')
      .eq('scope', 'global')
      .maybeSingle()

    if (error) {
      console.error('GET /api/public/global-settings error:', error)
      return NextResponse.json({ data: null }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } })
    }

    const settings = (data as any)?.settings ?? {}

    const siteConfigRaw = (settings as any)?.siteConfig ?? {}
    const contactInfoRaw = (settings as any)?.contactInfo ?? {}
    const paymentMethodsRaw = (settings as any)?.paymentMethods ?? []
    const integrationConfigRaw = (settings as any)?.integrationConfig ?? {}
    const privacyPolicyRaw = (settings as any)?.privacyPolicy ?? {}
    const designUxRaw = (settings as any)?.designUx ?? {}

    const securityConfigRaw = (settings as any)?.securityConfig ?? {}
    const notificationConfigRaw = (settings as any)?.notificationConfig ?? {}

    const seoRaw = (integrationConfigRaw as any)?.seo ?? {}
    const googleAnalyticsRaw = (integrationConfigRaw as any)?.googleAnalytics ?? {}
    const facebookPixelRaw = (integrationConfigRaw as any)?.facebookPixel ?? {}
    const customScriptsRaw = (integrationConfigRaw as any)?.customScripts ?? {}
    const chatWidgetRaw = (integrationConfigRaw as any)?.chatWidget ?? {}

    const payload: PublicGlobalSettings = {
      siteConfig: {
        siteName: asString(siteConfigRaw?.name ?? siteConfigRaw?.siteName),
        logoUrl: asString(siteConfigRaw?.logo ?? siteConfigRaw?.logoUrl),
        faviconUrl: asString(siteConfigRaw?.favicon ?? siteConfigRaw?.faviconUrl),
        primaryColor: asString(siteConfigRaw?.primaryColor),
        secondaryColor: asString(siteConfigRaw?.secondaryColor),
        accentColor: asString(siteConfigRaw?.accentColor),
        currency: asString(siteConfigRaw?.currency),
        language: asString(siteConfigRaw?.language),
        timezone: asString(siteConfigRaw?.timezone),
        dateFormat: asString(siteConfigRaw?.dateFormat),
        timeFormat: asString(siteConfigRaw?.timeFormat)
      },
      designUx: {
        activeThemeId: asString((designUxRaw as any)?.activeThemeId),
        responsive: normalizeDesignUxResponsive((designUxRaw as any)?.responsive)
      },
      contactInfo: {
        email: asString(contactInfoRaw?.email),
        phone: asString(contactInfoRaw?.phone),
        whatsapp: asString(contactInfoRaw?.whatsapp),
        address: asString(contactInfoRaw?.address),
        city: asString(contactInfoRaw?.city),
        country: asString(contactInfoRaw?.country),
        postalCode: asString(contactInfoRaw?.postalCode)
      },
      paymentMethods: Array.isArray(paymentMethodsRaw)
        ? (paymentMethodsRaw as any[])
            .filter((m) => m && typeof m === 'object')
            .map((m) => {
              const fees = (m as any)?.fees
              const limits = (m as any)?.limits
              const apiKeys = (m as any)?.apiKeys
              return {
                id: asString((m as any)?.id) ?? '',
                name: asString((m as any)?.name) ?? '',
                type: asString((m as any)?.type) ?? 'other',
                provider: asString((m as any)?.provider) ?? '',
                logo: asString((m as any)?.logo ?? null),
                isActive: asBoolean((m as any)?.isActive),
                fees: fees
                  ? {
                      percentage: Number((fees as any)?.percentage ?? 0) || 0,
                      fixed: Number((fees as any)?.fixed ?? 0) || 0,
                      currency: asString((fees as any)?.currency) ?? 'XOF'
                    }
                  : null,
                limits: limits
                  ? {
                      min: Number((limits as any)?.min ?? 0) || 0,
                      max: Number((limits as any)?.max ?? 0) || 0,
                      currency: asString((limits as any)?.currency) ?? 'XOF'
                    }
                  : null,
                countries: Array.isArray((m as any)?.countries) ? (m as any).countries.map((c: any) => String(c)) : [],
                description: asString((m as any)?.description ?? null),
                instructions: asString((m as any)?.instructions ?? null),
                apiKeys: apiKeys
                  ? {
                      publicKey: asString((apiKeys as any)?.publicKey ?? null),
                      webhookUrl: asString((apiKeys as any)?.webhookUrl ?? null)
                    }
                  : null
              } as PublicPaymentMethod
            })
            .filter((m) => Boolean(m.id) && Boolean(m.name))
        : [],
      securityConfig: {
        twoFactorAuth: asBoolean(securityConfigRaw?.twoFactorAuth),
        googleAuth: asBoolean(securityConfigRaw?.googleAuth),
        facebookAuth: asBoolean(securityConfigRaw?.facebookAuth),
        appleAuth: asBoolean(securityConfigRaw?.appleAuth),
        xAuth: asBoolean(securityConfigRaw?.xAuth),
        passwordPolicy: {
          minLength: Math.max(6, Number((securityConfigRaw as any)?.passwordPolicy?.minLength ?? 8) || 8),
          requireUppercase: asBoolean((securityConfigRaw as any)?.passwordPolicy?.requireUppercase),
          requireNumbers: asBoolean((securityConfigRaw as any)?.passwordPolicy?.requireNumbers),
          requireSymbols: asBoolean((securityConfigRaw as any)?.passwordPolicy?.requireSymbols)
        }
      },
      notificationConfig: {
        emailNotifications: asBoolean(notificationConfigRaw?.emailNotifications),
        smsNotifications: asBoolean(notificationConfigRaw?.smsNotifications),
        pushNotifications: asBoolean(notificationConfigRaw?.pushNotifications),
        orderUpdates: asBoolean(notificationConfigRaw?.orderUpdates),
        securityAlerts: asBoolean(notificationConfigRaw?.securityAlerts),
        newsletter: asBoolean(notificationConfigRaw?.newsletter)
      },
      seo: {
        defaultTitle: asString(seoRaw?.title ?? seoRaw?.defaultTitle),
        titleTemplate: asString(seoRaw?.titleTemplate),
        defaultDescription: asString(seoRaw?.description ?? seoRaw?.defaultDescription),
        keywords: asString(seoRaw?.keywords),
        robots: asString(seoRaw?.robots)
      },
      analytics: {
        googleAnalyticsId: asBoolean(googleAnalyticsRaw?.enabled) ? safeTrackingId(googleAnalyticsRaw?.trackingId) : null,
        facebookPixelId: asBoolean(facebookPixelRaw?.enabled) ? asString(facebookPixelRaw?.pixelId) : null
      },
      customScripts: {
        head: sanitizeCustomScript(customScriptsRaw?.header ?? customScriptsRaw?.head),
        body: sanitizeCustomScript(customScriptsRaw?.body)
      },
      privacyPolicy: normalizePrivacyPolicy(privacyPolicyRaw),
      chatWidget: {
        enabled: asBoolean(chatWidgetRaw?.enabled),
        provider: asString(chatWidgetRaw?.provider),
        embedCode: sanitizeCustomScript(chatWidgetRaw?.code ?? chatWidgetRaw?.embedCode)
      }
    }

    return NextResponse.json(
      {
        data: payload,
        debug: {
          updated_at: (data as any)?.updated_at ?? null
        }
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('GET /api/public/global-settings failed:', message)
    return NextResponse.json({ data: null }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } })
  }
}
