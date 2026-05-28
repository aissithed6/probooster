"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { CartService, CartItem } from '@/lib/services'
import { useNotifications } from '@/components/ui/modern-notification'
import { trackAutomationEvent } from '@/lib/client-automation-events'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotifications()
  const syncTokenRef = useRef(0)

  /**
   * Récupère warranty/returnPolicy depuis l'API publique et met à jour l'article panier si ces champs sont manquants.
   */
  const hydrateCartItemWarrantyAndReturns = useCallback(
    async (productId: string) => {
      if (typeof window === 'undefined') return
      if (!UUID_REGEX.test(productId)) return

      try {
        const resp = await fetch(`/api/public/products?id=${encodeURIComponent(productId)}`, { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = resp && resp.ok ? await resp.json().catch(() => null) : null
        const data = json?.data
        if (!data) return

        const warranty = typeof data?.warranty === 'string' ? String(data.warranty).trim() : ''
        const returnPolicy = typeof data?.return_policy === 'string' ? String(data.return_policy).trim() : ''
        if (!warranty && !returnPolicy) return

        const current = CartService.getCart()
        const list: CartItem[] = Array.isArray(current) ? current : []
        const next = list.map((item) => {
          if (String(item?.id ?? '') !== productId) return item

          const hasWarranty = Boolean(String((item as any)?.warranty ?? '').trim())
          const hasReturns = Boolean(String((item as any)?.returnPolicy ?? '').trim())
          if (hasWarranty && hasReturns) return item

          return {
            ...item,
            warranty: hasWarranty ? (item as any).warranty : (warranty || (item as any).warranty),
            returnPolicy: hasReturns ? (item as any).returnPolicy : (returnPolicy || (item as any).returnPolicy)
          }
        })

        CartService.setCart(next)
        setCartItems(next)
      } catch {
        // ignore
      }
    },
    []
  )

  const getCartQuantityCount = useCallback((items: CartItem[]) => {
    return (items ?? []).reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0)
  }, [])

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
      return
    }

    if (typeof window !== 'undefined') {
      const tokenAtStart = syncTokenRef.current
      void CartService.syncDiscountedItemsWithOffers().then((next) => {
        if (Array.isArray(next)) {
          if (tokenAtStart === syncTokenRef.current) {
            setCartItems(next)
          }
        }
      })
    }
  }, [addNotification, getCartQuantityCount])

  // Charger le panier au montage du composant
  useEffect(() => {
    loadCart()
    if (typeof window === 'undefined') return

    const onCartUpdated = (event: any) => {
      const nextCart = Array.isArray(event?.detail?.cart) ? event.detail.cart : null
      if (nextCart) {
        setCartItems(nextCart)
      } else {
        try {
          setCartItems(CartService.getCart())
        } catch {
          // silencieux
        }
      }
    }

    window.addEventListener('cartUpdated', onCartUpdated as any)
    return () => {
      window.removeEventListener('cartUpdated', onCartUpdated as any)
    }
  }, [loadCart])

  // Mettre à jour le compteur et le total quand le panier change
  useEffect(() => {
    setCartCount(getCartQuantityCount(cartItems))
    setCartTotal(CartService.getCartTotal())
  }, [cartItems, getCartQuantityCount])

  const addToCart = useCallback((product: Omit<CartItem, 'quantity'> & { inStock?: boolean }) => {
    try {
      setIsLoading(true)
      
      // Vérifier si le produit est en stock
      if (product.inStock === false) {
        addNotification({
          type: 'warning',
          title: 'Produit indisponible',
          message: 'Ce produit n\'est pas en stock'
        })
        return false
      }

      // Ajouter au panier
      const updatedCart = CartService.addToCart(product)
      const productId = String((product as any)?.id ?? '')
      const hasItem = Array.isArray(updatedCart)
        ? updatedCart.some((it: any) => String(it?.id ?? '') === productId)
        : false
      if (!Array.isArray(updatedCart) || updatedCart.length === 0 || !hasItem) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible d\'ajouter le produit au panier'
        })
        return false
      }

      syncTokenRef.current += 1
      setCartItems(updatedCart)

      try {
        const pidAdded = String((product as any)?.id ?? '').trim()
        void trackAutomationEvent({
          eventType: 'cart.item_added',
          entityType: 'cart',
          entityId: null,
          payload: {
            productId: pidAdded || null,
            quantity: 1,
            name: String((product as any)?.name ?? '').trim() || null,
            price: Number((product as any)?.price ?? 0) || 0
          },
          sourceUi: 'useCart'
        })
      } catch {
        // best-effort
      }

      // Hydratation asynchrone (garantie/retours) si le produit ajouté ne les fournit pas.
      const pid = productId.trim()
      const hasWarranty = Boolean(String((product as any)?.warranty ?? '').trim())
      const hasReturns = Boolean(String((product as any)?.returnPolicy ?? '').trim())
      if (pid && UUID_REGEX.test(pid) && (!hasWarranty || !hasReturns)) {
        void hydrateCartItemWarrantyAndReturns(pid)
      }

      // Notification de succès
      addNotification({ 
        type: 'success', 
        title: 'Produit ajouté', 
        message: `${product.name} a été ajouté au panier` 
      })

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { cart: updatedCart, count: getCartQuantityCount(updatedCart) } 
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
  }, [addNotification, hydrateCartItemWarrantyAndReturns])

  const removeFromCart = useCallback((productId: string | number) => {
    try {
      const updatedCart = CartService.removeFromCart(productId)
      syncTokenRef.current += 1
      setCartItems(updatedCart)

      try {
        const pid = String(productId ?? '').trim()
        void trackAutomationEvent({
          eventType: 'cart.item_removed',
          entityType: 'cart',
          entityId: null,
          payload: {
            productId: pid || null
          },
          sourceUi: 'useCart'
        })
      } catch {
        // best-effort
      }

      addNotification({ 
  type: 'info', 
  title: 'Produit retiré', 
  message: 'Produit retiré du panier' 
})

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { cart: updatedCart, count: getCartQuantityCount(updatedCart) } 
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
  }, [addNotification, getCartQuantityCount])

  const updateQuantity = useCallback((productId: string | number, quantity: number) => {
    try {
      const updatedCart = CartService.updateQuantity(productId, quantity)
      syncTokenRef.current += 1
      setCartItems(updatedCart)

      try {
        const pid = String(productId ?? '').trim()
        void trackAutomationEvent({
          eventType: 'cart.quantity_changed',
          entityType: 'cart',
          entityId: null,
          payload: {
            productId: pid || null,
            quantity: Number(quantity) || 0
          },
          sourceUi: 'useCart'
        })
      } catch {
        // best-effort
      }

      // Déclencher un événement personnalisé pour notifier le header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { cart: updatedCart, count: getCartQuantityCount(updatedCart) } 
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
  }, [addNotification, getCartQuantityCount])

  const clearCart = useCallback(() => {
    try {
      CartService.clearCart()
      syncTokenRef.current += 1
      setCartItems([])

      try {
        void trackAutomationEvent({
          eventType: 'cart.cleared',
          entityType: 'cart',
          entityId: null,
          payload: null,
          sourceUi: 'useCart'
        })
      } catch {
        // best-effort
      }

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

  const isInCart = useCallback((productId: string | number) => {
    return cartItems.some(item => item.id === productId)
  }, [cartItems])

  const getItemQuantity = useCallback((productId: string | number) => {
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
