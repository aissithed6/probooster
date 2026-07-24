"use client"

import { ReactNode, Suspense, useEffect, useRef } from "react"
import Header from "@/components/layout/header-modular"

import Footer from "@/components/layout/footer"
import { FloatingChatButton } from "@/components/chat/FloatingChatButton"
import { GlobalChatEventListener, GlobalChatSystem } from "@/components/chat"
import HotToastClient from "@/components/providers/hot-toast-client"
import { ChatProviderWrapper } from "@/components/providers/ChatProviderWrapper"
import { InternalMessagingProviderWrapper } from "@/components/providers/InternalMessagingProviderWrapper"
import { NotificationProvider, NotificationContainer } from "@/components/ui/modern-notification"
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog"
import { AuthProvider } from "@/contexts/AuthContext"
import { DeliveryConfigProvider } from "@/contexts/DeliveryConfigContext"
import { PublicGlobalSettingsProvider } from "@/contexts/PublicGlobalSettingsContext"
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext"
import PublicScriptsInjector from "@/components/providers/PublicScriptsInjector"
import PublicHeadApplier from "@/components/providers/PublicHeadApplier"
import PublicBrandingApplier from "@/components/providers/PublicBrandingApplier"
import PublicCustomCodeInjector from "@/components/providers/PublicCustomCodeInjector"

import { buildViewDedupeKey, trackAutomationEvent } from "@/lib/client-automation-events"
import { usePathname } from "next/navigation"
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

interface AppClientProvidersProps {
  children: ReactNode
  initialAuthState?: {
    user?: any | null
    userProfile?: any | null
    loyaltyPoints?: any | null
  }
  initialPublicGlobalSettings?: any | null
  initialPublicGlobalSettingsUpdatedAt?: string | null
  initialPointsConfig?: {
    withdrawalValue?: number | null
    withdrawalMinPoints?: number | null
  } | null
}

/**
 * AppClientProviders orchestre les contextes et composants strictement clients du layout global.
 */
export default function AppClientProviders({
  children,
  initialAuthState,
  initialPublicGlobalSettings,
  initialPublicGlobalSettingsUpdatedAt,
  initialPointsConfig
}: AppClientProvidersProps) {
  return (
    <AuthProvider initialState={initialAuthState}>
      <NotificationProvider>
        <ConfirmDialogProvider>
          <ChatProviderWrapper>
            <InternalMessagingProviderWrapper>
              <DeliveryConfigProvider>
                <PublicGlobalSettingsProvider
                  initialState={{
                    data: initialPublicGlobalSettings ?? null,
                    updatedAt: initialPublicGlobalSettingsUpdatedAt ?? null
                  }}
                >
                  <UserPreferencesProvider>
                    <PublicScriptsInjector />
                    <PublicHeadApplier />
                    <PublicBrandingApplier />
                    <PublicCustomCodeInjector />
                    <AutomationPageViewTracker />
                    <WebVitalsTracker />
                    <Header initialPointsConfig={initialPointsConfig ?? null} />
                    <main className="min-h-screen main-content">{children}</main>
                    <Footer />
                    <NotificationContainer />
                    <GlobalChatEventListener />
                    <GlobalChatSystem />
                    <Suspense fallback={null}>
                      <FloatingChatButton />
                    </Suspense>
                    <Suspense fallback={null}>
                      <HotToastClient />
                    </Suspense>
                  </UserPreferencesProvider>
                </PublicGlobalSettingsProvider>
              </DeliveryConfigProvider>
            </InternalMessagingProviderWrapper>
          </ChatProviderWrapper>
        </ConfirmDialogProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

/**
 * Tracker global des changements de route (App Router) pour enregistrer `page.viewed`.
 * Best-effort: ne doit jamais casser le rendu.
 */
function AutomationPageViewTracker() {
  const pathname = usePathname()
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      const path = typeof pathname === 'string' ? pathname : ''
      if (!path) return
      if (lastPathRef.current === path) return
      lastPathRef.current = path

      const dedupeKey = buildViewDedupeKey({ eventType: 'page.viewed', entityType: 'page', entityId: path, path })
      void trackAutomationEvent({
        eventType: 'page.viewed',
        entityType: 'page',
        entityId: path,
        payload: {
          pageType: 'unknown'
        },
        sourceUi: 'global_page_tracker',
        dedupeKey,
        dedupeTtlMs: 10 * 60 * 1000
      })
    } catch {
      // best-effort
    }
  }, [pathname])

  return null
}

/**
 * Tracker global Web Vitals (LCP/INP/CLS/TTFB/FCP).
 * Enregistre des événements `web.vital` (best-effort) dans `automation_events`.
 */
function WebVitalsTracker() {
  const pathname = usePathname()
  const lastPathRef = useRef<string | null>(null)
  const registeredRef = useRef<boolean>(false)

  useEffect(() => {
    try {
      const path = typeof pathname === 'string' ? pathname : ''
      if (!path) return
      lastPathRef.current = path

      if (registeredRef.current) return

      registeredRef.current = true

      const report = (metric: any) => {
        try {
          const currentPath = typeof lastPathRef.current === 'string' ? lastPathRef.current : null
          const dedupeKey = buildViewDedupeKey({
            eventType: 'web.vital',
            entityType: 'page',
            entityId: `${currentPath ?? ''}:${String(metric?.name ?? '')}:${String(metric?.id ?? '')}`,
            path: currentPath
          })
          void trackAutomationEvent({
            eventType: 'web.vital',
            entityType: 'page',
            entityId: currentPath || null,
            payload: {
              name: typeof metric?.name === 'string' ? metric.name : null,
              value: Number(metric?.value),
              delta: Number(metric?.delta),
              rating: typeof metric?.rating === 'string' ? metric.rating : null,
              id: typeof metric?.id === 'string' ? metric.id : null,
              navigationType: typeof metric?.navigationType === 'string' ? metric.navigationType : null,
              url: typeof window !== 'undefined' ? window.location.href : null
            },
            sourceUi: 'global_web_vitals_tracker',
            path: currentPath,
            dedupeKey,
            dedupeTtlMs: 10 * 60 * 1000
          })
        } catch {
          // best-effort
        }
      }

      onLCP(report)
      onINP(report)
      onCLS(report)
      onTTFB(report)
      onFCP(report)
    } catch {
      // best-effort
    }
  }, [pathname])

  return null
}
