'use client'

import { useEffect, useMemo, useState } from 'react'

import { supabase } from '@/lib/supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type AdminCacheEntry = {
  ids: string[]
  expiresAt: number
}

const ADMIN_CACHE_TTL_MS = 5 * 60_000
let adminIdsCache: AdminCacheEntry | null = null
let adminIdsInflight: Promise<string[]> | null = null

/**
 * Charge la liste des vendeurs/admins via l'API publique (utilisé pour la présence "Boutique").
 */
async function fetchAdminIds(): Promise<string[]> {
  const res = await fetch('/api/public/vendors/list', {
    method: 'GET',
    cache: 'force-cache'
  }).catch(() => null)
  const json = await res?.json().catch(() => null)
  const rows = Array.isArray(json?.data) ? json.data : []
  const ids = rows
    .filter((v: any) => {
      const role = String(v?.role ?? '').trim().toLowerCase()
      return role === 'admin' || role === 'super_admin' || role === 'superadmin'
    })
    .map((v: any) => String(v?.id ?? '').trim())
    .filter((id: string) => UUID_REGEX.test(id))
  return ids
}

/**
 * Expose l'état "en ligne" d'un vendeur basé sur Supabase Realtime Presence.
 * Le vendeur est considéré en ligne si son userId est présent dans le channel `presence:users`.
 */
export function useVendorPresence(vendorId: string) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [adminIds, setAdminIds] = useState<string[]>([])

  const channelName = useMemo(() => 'presence:users', [])
  const normalizedVendorId = useMemo(() => String(vendorId ?? '').trim(), [vendorId])

  /**
   * Charge une fois la liste des IDs admin/super-admin pour rendre "Boutique" fiable.
   * Objectif: si l'ID affiché correspond à un admin, on considère la boutique en ligne
   * si au moins un admin est en ligne.
   */
  useEffect(() => {
    let cancelled = false
    const normalized = normalizedVendorId

    if (!normalized || !UUID_REGEX.test(normalized)) {
      setAdminIds([])
      return
    }

    ;(async () => {
      try {
        if (adminIdsCache && adminIdsCache.expiresAt > Date.now()) {
          if (!cancelled) setAdminIds(adminIdsCache.ids)
          return
        }

        if (!adminIdsInflight) {
          adminIdsInflight = fetchAdminIds()
        }

        const ids = await adminIdsInflight
        adminIdsCache = { ids, expiresAt: Date.now() + ADMIN_CACHE_TTL_MS }
        if (!cancelled) setAdminIds(ids)
      } catch {
        if (!cancelled) setAdminIds([])
      } finally {
        adminIdsInflight = null
      }
    })()

    return () => {
      cancelled = true
    }
  }, [normalizedVendorId])

  useEffect(() => {
    if (!normalizedVendorId || !UUID_REGEX.test(normalizedVendorId)) {
      setIsOnline(null)
      return
    }

    const observerKey = `observer:${normalizedVendorId}:${Math.random().toString(36).slice(2)}`

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: observerKey
        }
      }
    })

    const updateFromState = () => {
      try {
        const state = channel.presenceState() as Record<string, any>

        // Compat: ancien mode où la key presence était directement le userId.
        if (state && Object.prototype.hasOwnProperty.call(state, normalizedVendorId)) {
          setIsOnline(true)
          return
        }

        // Nouveau mode (multi-onglets): key unique + payload { user_id }.
        const online = Object.values(state ?? {}).some((entry: any) => {
          const metas = Array.isArray(entry) ? entry : []
          return metas.some((m: any) => String(m?.user_id ?? '').trim() === normalizedVendorId)
        })

        // Cas Boutique/admin: si l'ID observé est un admin, considérer "en ligne" si
        // au moins un admin est en ligne (la boutique peut être portée par plusieurs admins).
        if (!online && adminIds.length > 0 && adminIds.includes(normalizedVendorId)) {
          const anyAdminOnline = Object.values(state ?? {}).some((entry: any) => {
            const metas = Array.isArray(entry) ? entry : []
            return metas.some((m: any) => adminIds.includes(String(m?.user_id ?? '').trim()))
          })
          setIsOnline(anyAdminOnline)
          return
        }

        setIsOnline(online)
      } catch {
        setIsOnline(null)
      }
    }

    channel
      .on('presence', { event: 'sync' }, updateFromState)
      .on('presence', { event: 'join' }, updateFromState)
      .on('presence', { event: 'leave' }, updateFromState)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          try {
            void channel.track({ observer: true })
          } catch {
            // ignore
          }
          if (process.env.NODE_ENV !== 'production') {
            try {
              const state = channel.presenceState() as Record<string, any>
              console.debug('useVendorPresence SUBSCRIBED', {
                vendorId: normalizedVendorId,
                stateKeys: Object.keys(state ?? {}).length
              })
            } catch {
              // ignore
            }
          }
          updateFromState()
        }
      })

    return () => {
      try {
        void supabase.removeChannel(channel)
      } catch {
        // ignore
      }
    }
  }, [normalizedVendorId, channelName, adminIds])

  return { isOnline }
}
