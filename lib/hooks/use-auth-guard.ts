"use client"

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useNotifications } from '../../components/ui/modern-notification'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Hook centralisé pour bloquer les actions sensibles si l'utilisateur n'est pas connecté.
 * - Affiche une notification
 * - Redirige vers /auth/login?next=<url_actuelle>
 */
export function useAuthGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const { addNotification } = useNotifications()
  const { user } = useAuth()

  /**
   * Exige une session utilisateur.
   * @returns true si authentifié, sinon false (notification + redirection).
   */
  const requireAuth = useCallback(
    (message: string): boolean => {
      if (user?.id) return true

      addNotification({
        type: 'error',
        title: 'Connexion requise',
        message
      })

      const nextPath = typeof pathname === 'string' && pathname.length > 0 ? pathname : '/'
      const search = typeof window !== 'undefined' ? window.location.search : ''
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const next = `${nextPath}${search}${hash}`

      router.push(`/auth/login?next=${encodeURIComponent(next)}`)
      return false
    },
    [addNotification, pathname, router, user?.id]
  )

  return { requireAuth, user }
}
