'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

/**
 * Rend le composant react-hot-toast côté client afin d'éviter les mismatches SSR.
 */
export const HotToastClient = () => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  if (!isReady) {
    return null
  }

  return (
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 9999 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
          border: '1px solid #ff6600'
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff'
          }
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff'
          }
        }
      }}
    />
  )
}

export default HotToastClient
