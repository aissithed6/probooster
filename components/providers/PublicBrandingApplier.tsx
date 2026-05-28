"use client"

import { useEffect, useMemo } from 'react'

import { usePublicGlobalSettings } from '@/contexts/PublicGlobalSettingsContext'

function safeColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const v = value.trim()
  if (!v) return fallback
  return v
}

/**
 * PublicBrandingApplier applique immédiatement les couleurs globales sous forme de variables CSS.
 */
export default function PublicBrandingApplier() {
  const { data } = usePublicGlobalSettings()

  const primary = useMemo(() => safeColor(data?.siteConfig?.primaryColor, '#ff6600'), [data?.siteConfig?.primaryColor])
  const secondary = useMemo(() => safeColor(data?.siteConfig?.secondaryColor, '#535455'), [data?.siteConfig?.secondaryColor])
  const accent = useMemo(() => safeColor(data?.siteConfig?.accentColor, '#3b82f6'), [data?.siteConfig?.accentColor])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.style.setProperty('--brand-primary', primary)
    root.style.setProperty('--brand-secondary', secondary)
    root.style.setProperty('--brand-accent', accent)
  }, [primary, secondary, accent])

  return null
}
