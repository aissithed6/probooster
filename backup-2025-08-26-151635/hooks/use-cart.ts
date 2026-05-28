"use client"

import { useState, useEffect, useCallback } from 'react'
import { CartService, CartItem } from '@/lib/services'
import { useNotifications } from '@/components/ui/modern-notification'

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotifications()

  // Charger le panier au montage du composant
  useEffect(() => {
    loadCart()
  }, [])

  // Mettre à jour le compteur et le total quand le panier change
  useEffect(() => {
    setCartCount(cartItems.length)
    setCartTotal(CartService.getCartTotal())
  }, [cartItems])

  const loadCart = useCallback(() => {
    try {
      const cart = CartService.getCart()
      setCartItems(cart)
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de charger le panier' 
})
    }
  }, [addNotification])

  const addToCart = useCallback((product: Omit<CartItem, 'quantity'>) => {
    try {
      setIsLoading(true)
      
      // Vérifier si le produit est en stock
      if (!product.inStock) {
        addNotification({
          type: 'warning',
          title: 'Produit indisponible',
          message: 'Ce produit n\'est pas en stock'
        })
        return false
      }

      // Ajouter au panier
      const updatedCart = CartService.addToCart(product)
      setCartItems(updatedCart)

      // Notification de succès
      addNotification({ 
        type: 'success', 
        title: 'Produit ajouté', 
        message: `${product.name} a été ajouté au panier` 
      })

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { cart: updatedCart, count: updatedCart.length } 
        }))
      }

      return true
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le produit au panier'
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [addNotification])

  const removeFromCart = useCallback((productId: number) => {
    try {
      const updatedCart = CartService.removeFromCart(productId)
      setCartItems(updatedCart)

      addNotification({ 
  type: 'info', 
  title: 'Produit retiré', 
  message: 'Produit retiré du panier' 
})

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { cart: updatedCart, count: updatedCart.length } 
        }))
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de retirer le produit du panier' 
})
      return false
    }
  }, [addNotification])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    try {
      const updatedCart = CartService.updateQuantity(productId, quantity)
      setCartItems(updatedCart)

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { cart: updatedCart, count: updatedCart.length } 
        }))
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de mettre à jour la quantité' 
})
      return false
    }
  }, [addNotification])

  const clearCart = useCallback(() => {
    try {
      CartService.clearCart()
      setCartItems([])

      addNotification({ 
  type: 'info', 
  title: 'Panier vidé', 
  message: 'Votre panier a été vidé' 
})

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { cart: [], count: 0 } 
        }))
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de vider le panier' 
})
      return false
    }
  }, [addNotification])

  const isInCart = useCallback((productId: number) => {
    return cartItems.some(item => item.id === productId)
  }, [cartItems])

  const getItemQuantity = useCallback((productId: number) => {
    const item = cartItems.find(item => item.id === productId)
    return item ? item.quantity : 0
  }, [cartItems])

  return {
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    loadCart
  }
}
