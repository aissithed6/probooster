'use client'

import { Loader2 } from 'lucide-react'

/**
 * Overlay de chargement plein écran.
 */
export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-sm text-gray-700">Chargement…</span>
      </div>
    </div>
  )
}
