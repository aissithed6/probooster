"use client"

import { InternalMessagingProvider } from "@/contexts/InternalMessagingContext"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Wrapper client pour le InternalMessagingProvider
 * Permet de passer l'userId depuis le contexte Auth
 */
export function InternalMessagingProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return (
    <InternalMessagingProvider userId={user?.id} userRole={(user as any)?.role}>
      {children}
    </InternalMessagingProvider>
  )
}
