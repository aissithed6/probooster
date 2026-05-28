"use client"

import { ChatProvider } from "@/lib/chat-context-supabase"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Wrapper client pour le ChatProvider
 * Permet de passer l'userId depuis le contexte Auth
 */
export function ChatProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return <ChatProvider userId={user?.id}>{children}</ChatProvider>
}
