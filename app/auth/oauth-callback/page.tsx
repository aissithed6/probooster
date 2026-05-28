"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/AuthContext"

/**
 * Page de callback OAuth.
 * Après redirection depuis le provider (Google/Facebook/Apple), Supabase reconstruit la session via detectSessionInUrl.
 * Cette page attend la session côté client, puis redirige selon le rôle.
 */
export default function OAuthCallbackPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [message, setMessage] = useState<string>("Connexion en cours...")

  useEffect(() => {
    if (loading) return

    if (!user?.id) {
      setMessage("Connexion OAuth incomplète. Merci de réessayer.")
      const t = window.setTimeout(() => router.replace("/auth/login"), 1200)
      return () => window.clearTimeout(t)
    }

    const role = (user as any)?.role

    if (role === "vendor") {
      router.replace("/seller-dashboard")
      return
    }

    if (role === "driver") {
      router.replace("/driver-dashboard")
      return
    }

    if (role === "admin" || role === "super_admin" || role === "ops") {
      router.replace("/super-admin-dashboard")
      return
    }

    router.replace("/dashboard")
  }, [loading, user?.id, (user as any)?.role, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-white text-sm opacity-90">{message}</div>
    </div>
  )
}
