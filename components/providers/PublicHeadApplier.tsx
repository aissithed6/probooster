"use client"

import { useEffect, useMemo } from 'react'

import { usePublicGlobalSettings } from '@/contexts/PublicGlobalSettingsContext'

function upsertMetaTag(name: string, content: string | null) {
  if (typeof document === 'undefined') return
  const key = name.trim()
  if (!key) return

  const safeId = `public-meta-${key.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`

  // IMPORTANT: on ne touche pas aux meta tags existants (souvent gérés par Next.js).
  // On gère uniquement nos tags dédiés.
  const existing = document.getElementById(safeId) as HTMLMetaElement | null
  const meta = existing ?? document.createElement('meta')
  meta.id = safeId
  meta.setAttribute('data-managed-by', 'public-global-settings')
  meta.setAttribute('name', key)
  meta.setAttribute('content', content ?? '')
  if (!existing) document.head.appendChild(meta)
}

function upsertFavicon(href: string | null) {
  if (typeof document === 'undefined') return

  // IMPORTANT: ne pas supprimer/modifier les favicons existants potentiellement gérés par Next.js.
  // On crée notre propre link dédié et on le met à jour.
  const id = 'public-favicon'
  const existing = document.getElementById(id) as HTMLLinkElement | null
  const link = existing ?? document.createElement('link')
  link.id = id
  link.setAttribute('data-managed-by', 'public-global-settings')
  link.setAttribute('rel', 'icon')
  link.setAttribute('href', href ?? '')
  if (!existing) document.head.appendChild(link)
}

function buildTitle(defaultTitle: string | null, titleTemplate: string | null): string | null {
  const t = (defaultTitle ?? '').toString().trim()
  if (!t) return null

  const template = (titleTemplate ?? '').toString().trim()
  if (!template) return t

  // Next.js template style: "%s | Brand".
  if (template.includes('%s')) {
    return template.replace('%s', t)
  }

  return t
}

/**
 * PublicHeadApplier applique (sans refresh) les champs SEO + favicon dans le DOM.
 */
export default function PublicHeadApplier() {
  const { data, updatedAt } = usePublicGlobalSettings()

  const title = useMemo(() => buildTitle(data?.seo?.defaultTitle ?? null, data?.seo?.titleTemplate ?? null), [data?.seo?.defaultTitle, data?.seo?.titleTemplate])
  const description = useMemo(() => (data?.seo?.defaultDescription ?? '').toString().trim() || null, [data?.seo?.defaultDescription])
  const keywords = useMemo(() => (data?.seo?.keywords ?? '').toString().trim() || null, [data?.seo?.keywords])
  const robots = useMemo(() => (data?.seo?.robots ?? '').toString().trim() || null, [data?.seo?.robots])

  const faviconRaw = useMemo(() => (data?.siteConfig?.faviconUrl ?? '').toString().trim() || null, [data?.siteConfig?.faviconUrl])

  const faviconHref = useMemo(() => {
    if (!faviconRaw) return null

    try {
      // Autorise chemins relatifs et URLs absolues.
      const url = faviconRaw
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        return url
      }
      const cacheBust = updatedAt ? encodeURIComponent(updatedAt) : String(Date.now())
      const hasQuery = url.includes('?')
      return `${url}${hasQuery ? '&' : '?'}v=${cacheBust}`
    } catch {
      return faviconRaw
    }
  }, [faviconRaw, updatedAt])

  useEffect(() => {
    if (typeof document === 'undefined') return

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[PublicHeadApplier] apply', {
        title,
        description,
        keywords,
        robots,
        faviconHref,
        updatedAt
      })
    }

    if (title) {
      document.title = title
    }

    upsertMetaTag('description', description)
    upsertMetaTag('keywords', keywords)
    upsertMetaTag('robots', robots)

    upsertFavicon(faviconHref)
  }, [title, description, keywords, robots, faviconHref])

  return null
}
