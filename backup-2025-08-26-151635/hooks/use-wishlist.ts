"use client"

import { useState, useEffect, useCallback } from 'react'
import { WishlistService, WishlistItem } from '@/lib/services'
import { useNotifications } from '@/components/ui/modern-notification'

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotifications()

  // Charger la wishlist au montage du composant
  useEffect(() => {
    loadWishlist()
  }, [])

  // Mettre à jour le compteur quand la wishlist change
  useEffect(() => {
    setWishlistCount(wishlistItems.length)
  }, [wishlistItems])

  const loadWishlist = useCallback(() => {
    try {
      const wishlist = WishlistService.getWishlist()
      setWishlistItems(wishlist)
    } catch (error) {
      console.error('Erreur lors du chargement de la wishlist:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de charger la wishlist' 
})
    }
  }, [addNotification])

  const addToWishlist = useCallback((product: Omit<WishlistItem, 'addedAt'>) => {
    try {
      setIsLoading(true)
      
      // Vérifier si le produit est déjà dans la wishlist
      if (WishlistService.isInWishlist(product.id)) {
        addNotification({ 
  type: 'warning', 
  title: 'Déjà dans la wishlist', 
  message: 'Ce produit est déjà dans vos favoris' 
})
        return false
      }

      // Ajouter à la wishlist
      WishlistService.addToWishlist(product)
      const updatedWishlist = WishlistService.getWishlist()
      setWishlistItems(updatedWishlist)

      // Notification de succès
      addNotification({ 
        type: 'success', 
        title: 'Produit ajouté', 
        message: `${product.name} a été ajouté à vos favoris` 
      })

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
          detail: { wishlist: updatedWishlist, count: updatedWishlist.length } 
        }))
      }

      return true
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la wishlist:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le produit aux favoris'
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [addNotification])

  const removeFromWishlist = useCallback((productId: number) => {
    try {
      WishlistService.removeFromWishlist(productId)
      const updatedWishlist = WishlistService.getWishlist()
      setWishlistItems(updatedWishlist)

      addNotification({ 
  type: 'info', 
  title: 'Produit retiré', 
  message: 'Produit retiré de vos favoris' 
})

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
          detail: { wishlist: updatedWishlist, count: updatedWishlist.length } 
        }))
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de la wishlist:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de retirer le produit des favoris' 
})
      return false
    }
  }, [addNotification])

  const toggleWishlist = useCallback((product: Omit<WishlistItem, 'addedAt'>) => {
    if (WishlistService.isInWishlist(product.id)) {
      return removeFromWishlist(product.id)
    } else {
      return addToWishlist(product)
    }
  }, [addToWishlist, removeFromWishlist])

  const clearWishlist = useCallback(() => {
    try {
      WishlistService.clearWishlist()
      setWishlistItems([])

      addNotification({ 
  type: 'info', 
  title: 'Wishlist vidée', 
  message: 'Vos favoris ont été vidés' 
})

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
          detail: { wishlist: [], count: 0 } 
        }))
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de la wishlist:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de vider vos favoris' 
})
      return false
    }
  }, [addNotification])

  const isInWishlist = useCallback((productId: number) => {
    return WishlistService.isInWishlist(productId)
  }, [])

  return {
    wishlistItems,
    wishlistCount,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    isInWishlist,
    loadWishlist
  }
}
