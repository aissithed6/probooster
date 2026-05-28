"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ShareEngagementService } from '@/lib/services/share-engagement-service'
import type { ProductShare, ShareInteraction, ShareAnalytics } from '@/lib/services/share-engagement-service'

interface ShareEngagementContextType {
  shares: ProductShare[]
  analytics: ShareAnalytics | null
  isLoading: boolean
  isSyncing: boolean
  
  recordShare: (productId: string, vendorId: string, platform: string, shareUrl: string) => Promise<boolean>
  recordInteraction: (shareId: string, interactionType: string, metadata?: any) => Promise<boolean>
  refreshShares: () => Promise<void>
  refreshAnalytics: () => Promise<void>
}

const ShareEngagementContext = createContext<ShareEngagementContextType | undefined>(undefined)

export const useShareEngagement = () => {
  const context = useContext(ShareEngagementContext)
  if (!context) {
    throw new Error('useShareEngagement must be used within a ShareEngagementProvider')
  }
  return context
}

interface ShareEngagementProviderProps {
  children: ReactNode
  userId?: string
  vendorId?: string
  mode?: 'user' | 'vendor'
}

export const ShareEngagementProvider: React.FC<ShareEngagementProviderProps> = ({ 
  children, 
  userId,
  vendorId,
  mode = 'user'
}) => {
  const { toast } = useToast()
  
  const [shares, setShares] = useState<ProductShare[]>([])
  const [analytics, setAnalytics] = useState<ShareAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const interactionSubscriptionsRef = useRef(new Map<string, any>())
  const analyticsRefreshTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (mode === 'user' && userId) {
      loadUserShares()
      loadUserAnalytics()
    } else if (mode === 'vendor' && vendorId) {
      loadVendorShares()
      loadVendorAnalytics()
    }
  }, [userId, vendorId, mode])

  useEffect(() => {
    if (!userId && !vendorId) return

    const id = mode === 'user' ? userId : vendorId
    if (!id) return

    const subscription = mode === 'user'
      ? ShareEngagementService.subscribeToUserShares(id, handleNewShare)
      : ShareEngagementService.subscribeToVendorShares(id, handleNewShare)

    return () => {
      ShareEngagementService.unsubscribe(subscription)
    }
  }, [userId, vendorId, mode])

  useEffect(() => {
    const cleanupAll = () => {
      const subs = interactionSubscriptionsRef.current
      for (const sub of subs.values()) {
        try {
          ShareEngagementService.unsubscribe(sub)
        } catch {
          // noop
        }
      }
      subs.clear()

      if (analyticsRefreshTimerRef.current) {
        window.clearTimeout(analyticsRefreshTimerRef.current)
        analyticsRefreshTimerRef.current = null
      }
    }

    const scheduleAnalyticsRefresh = () => {
      if (analyticsRefreshTimerRef.current) return

      analyticsRefreshTimerRef.current = window.setTimeout(async () => {
        analyticsRefreshTimerRef.current = null
        try {
          if (mode === 'user' && userId) {
            await loadUserAnalytics()
          } else if (mode === 'vendor' && vendorId) {
            await loadVendorAnalytics()
          }
        } catch {
          // noop
        }
      }, 300)
    }

    const subscribeToShareIds = (shareIds: string[]) => {
      const subs = interactionSubscriptionsRef.current
      const desired = new Set(shareIds)

      for (const [shareId, sub] of subs.entries()) {
        if (!desired.has(shareId)) {
          try {
            ShareEngagementService.unsubscribe(sub)
          } catch {
            // noop
          }
          subs.delete(shareId)
        }
      }

      for (const shareId of shareIds) {
        if (subs.has(shareId)) continue
        try {
          const sub = ShareEngagementService.subscribeToInteractions(shareId, (_interaction: ShareInteraction) => {
            scheduleAnalyticsRefresh()
          })
          subs.set(shareId, sub)
        } catch {
          // noop
        }
      }
    }

    if (!userId && !vendorId) {
      cleanupAll()
      return
    }

    const shareIds = shares.slice(0, 50).map((s) => s.id).filter(Boolean)
    subscribeToShareIds(shareIds)

    return () => {
      cleanupAll()
    }
  }, [shares, userId, vendorId, mode])

  const loadUserShares = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const data = await ShareEngagementService.getUserShares(userId)
      setShares(data)
    } catch (error) {
      console.error('Erreur chargement partages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadVendorShares = async () => {
    if (!vendorId) return
    setIsLoading(true)
    try {
      const data = await ShareEngagementService.getVendorShares(vendorId)
      setShares(data)
    } catch (error) {
      console.error('Erreur chargement partages vendeur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserAnalytics = async () => {
    if (!userId) return
    try {
      const data = await ShareEngagementService.getUserShareAnalytics(userId)
      setAnalytics(data)
    } catch (error) {
      console.error('Erreur chargement analytics:', error)
    }
  }

  const loadVendorAnalytics = async () => {
    if (!vendorId) return
    try {
      const data = await ShareEngagementService.getVendorShareAnalytics(vendorId)
      setAnalytics(data)
    } catch (error) {
      console.error('Erreur chargement analytics vendeur:', error)
    }
  }

  const handleNewShare = (share: ProductShare) => {
    setIsSyncing(true)
    setShares(prev => [share, ...prev])
    
    toast({
      title: "Nouveau partage enregistré!",
      description: `+${share.points_earned} points gagnés`,
      variant: "default",
    })

    if (mode === 'user' && userId) {
      loadUserAnalytics()
    } else if (mode === 'vendor' && vendorId) {
      loadVendorAnalytics()
    }
    
    setIsSyncing(false)
  }

  const recordShare = async (
    productId: string,
    vendorId: string,
    platform: string,
    shareUrl: string
  ): Promise<boolean> => {
    const id = mode === 'user' ? userId : vendorId
    if (!id) return false

    try {
      const share = await ShareEngagementService.recordShare(
        id,
        productId,
        vendorId,
        platform,
        shareUrl
      )

      if (share) {
        toast({
          title: "Partage enregistré!",
          description: `Vous avez gagné ${share.points_earned} points`,
          variant: "default",
        })
        return true
      }

      return false
    } catch (error) {
      console.error('Erreur enregistrement partage:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le partage",
        variant: "destructive",
      })
      return false
    }
  }

  const recordInteraction = async (
    shareId: string,
    interactionType: string,
    metadata?: any
  ): Promise<boolean> => {
    try {
      const interaction = await ShareEngagementService.recordInteraction(
        shareId,
        interactionType,
        userId,
        metadata
      )

      return !!interaction
    } catch (error) {
      console.error('Erreur enregistrement interaction:', error)
      return false
    }
  }

  const refreshShares = async () => {
    if (mode === 'user') {
      await loadUserShares()
    } else {
      await loadVendorShares()
    }
  }

  const refreshAnalytics = async () => {
    if (mode === 'user') {
      await loadUserAnalytics()
    } else {
      await loadVendorAnalytics()
    }
  }

  const contextValue: ShareEngagementContextType = {
    shares,
    analytics,
    isLoading,
    isSyncing,
    recordShare,
    recordInteraction,
    refreshShares,
    refreshAnalytics
  }

  return (
    <ShareEngagementContext.Provider value={contextValue}>
      {children}
    </ShareEngagementContext.Provider>
  )
}
