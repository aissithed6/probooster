"use client"

import type { ReactNode } from "react"

import { AuthProvider } from "@/contexts/AuthContext"
import { PublicGlobalSettingsProvider } from "@/contexts/PublicGlobalSettingsContext"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthProvider>
      <PublicGlobalSettingsProvider initialState={{ data: null, updatedAt: null }}>
        {children}
      </PublicGlobalSettingsProvider>
    </AuthProvider>
  )
}
