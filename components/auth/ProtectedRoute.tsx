"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'client' | 'vendor' | 'admin' | 'super_admin' | 'ops'
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  const loginUrl = redirectTo.includes('?redirect=')
    ? redirectTo
    : `${redirectTo}?redirect=${encodeURIComponent(pathname)}`

  // Rediriger vers la connexion si non connecté
  if (!user) {
    router.push(loginUrl)
    return null
  }

  // Vérifier le rôle si requis
  if (requiredRole && user.role !== requiredRole) {
    // Rediriger vers le bon tableau de bord selon le rôle
    let dashboardPath = '/dashboard'
    
    switch (user.role) {
      case 'client':
        dashboardPath = '/dashboard'
        break
      case 'vendor':
        dashboardPath = '/seller-dashboard'
        break
      case 'admin':
        dashboardPath = '/super-admin-dashboard'
        break
      case 'super_admin':
        dashboardPath = '/super-admin-dashboard'
        break
      case 'ops':
        dashboardPath = '/super-admin-dashboard'
        break
    }

    // Si l'utilisateur essaie d'accéder à une route pour un autre rôle
    if (user.role !== requiredRole) {
      router.push(dashboardPath)
      return null
    }
  }

  // Afficher le contenu protégé
  return <>{children}</>
}

// Composants spécialisés pour chaque rôle
export function ClientRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="client" redirectTo="/auth/login">
      {children}
    </ProtectedRoute>
  )
}

export function VendorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="vendor" redirectTo="/auth/login">
      {children}
    </ProtectedRoute>
  )
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" redirectTo="/auth/login">
      {children}
    </ProtectedRoute>
  )
}

export function OpsRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="ops" redirectTo="/auth/login">
      {children}
    </ProtectedRoute>
  )
}

// Composant pour les routes publiques (redirige si déjà connecté)
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      return
    }

    const redirectTarget = new URLSearchParams(window.location.search).get('redirect')
    if (redirectTarget) {
      router.replace(redirectTarget)
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
