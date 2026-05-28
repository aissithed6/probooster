'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EditableMessagesService, type EditableMessage } from '@/lib/services/editable-messages-service'

export type EditableMessagesBannerLocation =
  | 'dashboard_client'
  | 'dashboard_vendeur'
  | 'homepage'
  | 'catalog'
  | 'product_page'
  | 'cart'
  | 'checkout'
  | 'wishlist'

function typeToIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-amber-600" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

function typeToContainerClass(type: string): string {
  switch (type) {
    case 'success':
      return 'border-green-200 bg-green-50/70'
    case 'warning':
      return 'border-amber-200 bg-amber-50/70'
    case 'error':
      return 'border-red-200 bg-red-50/70'
    default:
      return 'border-blue-200 bg-blue-50/70'
  }
}

function buildDismissKey(location: string, message: EditableMessage): string {
  const id = String(message?.id ?? '').trim()
  const updatedAt = String(message?.updated_at ?? '').trim()
  return `editable_message_dismissed:${location}:${id}:${updatedAt}`
}

/**
 * Bannière discrète affichant les messages conseils selon un emplacement (`display_locations`).
 * - Ne s'affiche que si un message actif est disponible.
 * - Design non intrusif (petite carte) + responsive + s'adapte aux textes.
 * - Fermable (persisté en localStorage par message+updated_at).
 */
export function EditableMessagesBanner({
  location,
  className
}: {
  location: EditableMessagesBannerLocation
  className?: string
}) {
  const [messages, setMessages] = useState<EditableMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isDev = process.env.NODE_ENV !== 'production'

  /**
   * Charge les messages actifs pour l'emplacement.
   */
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setIsLoading(true)
        if (isDev) {
          console.log('[EditableMessagesBanner] Chargement...', { location })
        }
        const rows = await EditableMessagesService.getActiveMessagesForLocation(location)
        if (cancelled) return
        setMessages(Array.isArray(rows) ? rows : [])
        if (isDev) {
          console.log('[EditableMessagesBanner] Résultat chargement', {
            location,
            count: Array.isArray(rows) ? rows.length : 0
          })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [location])

  /**
   * Souscrit au realtime pour rafraîchir automatiquement si un message change.
   */
  useEffect(() => {
    const unsubscribe = EditableMessagesService.subscribeToAllMessages(async (_messages) => {
      if (isDev) {
        console.log('[EditableMessagesBanner] Realtime: refresh', { location })
      }
      const rows = await EditableMessagesService.getActiveMessagesForLocation(location)
      setMessages(Array.isArray(rows) ? rows : [])
    })

    return () => {
      unsubscribe()
    }
  }, [location])

  const visibleMessages = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return []

    try {
      if (typeof window === 'undefined') return messages
      return messages.filter((m) => {
        const key = buildDismissKey(location, m)
        return window.localStorage.getItem(key) !== '1'
      })
    } catch {
      return messages
    }
  }, [location, messages])

  if (isLoading) return null
  if (visibleMessages.length === 0) return null

  return (
    <div className={className ?? ''}>
      <div className="space-y-2">
        {visibleMessages.slice(0, 2).map((m) => {
          const type = String(m.message_type ?? 'info').toLowerCase()
          const title = (m.title ?? '').trim()
          const content = String(m.content ?? '').trim()

          return (
            <div
              key={m.id}
              className={`group relative w-full rounded-lg border px-3 py-2 shadow-sm backdrop-blur ${typeToContainerClass(type)}`}
            >
              <div className="flex gap-2">
                <div className="mt-0.5 flex-shrink-0">{typeToIcon(type)}</div>

                <div className="min-w-0 flex-1">
                  {title ? (
                    <div className="text-sm font-semibold text-gray-900 leading-snug">
                      {title}
                    </div>
                  ) : null}
                  {content ? (
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                      {content}
                    </div>
                  ) : null}
                </div>

                <div className="flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      try {
                        const key = buildDismissKey(location, m)
                        window.localStorage.setItem(key, '1')
                        setMessages((prev) => prev.filter((x) => x.id !== m.id))
                      } catch {
                        setMessages((prev) => prev.filter((x) => x.id !== m.id))
                      }
                    }}
                    aria-label="Fermer"
                    title="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
