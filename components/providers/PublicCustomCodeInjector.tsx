"use client"

import { useEffect, useMemo } from 'react'

import { usePublicGlobalSettings } from '@/contexts/PublicGlobalSettingsContext'

function sanitizeHtmlFragment(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null

  // Refus strict des scripts et handlers inline.
  if (/<\s*script\b/i.test(raw)) return null
  if (/on\w+\s*=/i.test(raw)) return null

  return raw
}

function sanitizeCss(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null
  // Blocage basique des imports externes.
  if (/@import\s+/i.test(raw)) return null
  return raw
}

function upsertTag(id: string, tagName: string, attributes: Record<string, string>, content: string | null) {
  if (typeof document === 'undefined') return

  const existing = document.getElementById(id)

  const el = existing ?? document.createElement(tagName)
  el.id = id
  Object.entries(attributes).forEach(([k, v]) => {
    el.setAttribute(k, v)
  })

  if (tagName === 'style') {
    el.textContent = content ?? ''
  } else {
    el.innerHTML = content ?? ''
  }

  if (!existing) {
    document.head.appendChild(el)
  }
}

function upsertBodyContainer(id: string, content: string | null) {
  if (typeof document === 'undefined') return

  const existing = document.getElementById(id)

  const el = existing ?? document.createElement('div')
  el.id = id
  el.setAttribute('data-role', id)
  el.innerHTML = content ?? ''

  if (!existing) {
    document.body.appendChild(el)
  }
}

/**
 * PublicCustomCodeInjector applique les custom scripts (HTML) + CSS + chat widget en live.
 */
export default function PublicCustomCodeInjector() {
  const { data } = usePublicGlobalSettings()

  const headHtml = useMemo(() => sanitizeHtmlFragment(data?.customScripts?.head), [data?.customScripts?.head])
  const bodyHtml = useMemo(() => sanitizeHtmlFragment(data?.customScripts?.body), [data?.customScripts?.body])

  const css = useMemo(() => {
    const rawCss = (data as any)?.customCss ?? null
    const legacy = (data as any)?.customScripts?.css
    return sanitizeCss(rawCss ?? legacy)
  }, [data])

  const chatEnabled = Boolean(data?.chatWidget?.enabled)
  const chatHtml = useMemo(() => sanitizeHtmlFragment(data?.chatWidget?.embedCode), [data?.chatWidget?.embedCode])

  useEffect(() => {
    // HEAD: on injecte dans un <template> (valide dans <head>)
    upsertTag('public-custom-head-html', 'template', { 'data-role': 'public-custom-head' }, headHtml)

    // CSS: <style> dans <head>
    upsertTag('public-custom-css', 'style', { type: 'text/css' }, css)

    // BODY: conteneurs dédiés à la fin du body
    upsertBodyContainer('public-custom-body-html', bodyHtml)
    upsertBodyContainer('public-chat-widget', chatEnabled ? chatHtml : null)
  }, [headHtml, bodyHtml, css, chatEnabled, chatHtml])

  return null
}
