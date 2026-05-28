"use client"

import { useState, useEffect } from "react"

import { CartService, WishlistService } from "@/lib/services"

export default function useHeaderState() {
  // États avec valeurs par défaut sécurisées
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cartItems, setCartItems] = useState(0)
  const [wishlistItems, setWishlistItems] = useState(0)
  const [selectedCurrency, setSelectedCurrency] = useState("fcfa")
  const [showCartModal, setShowCartModal] = useState(false)
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [compareListLength, setCompareListLength] = useState(0)
  const [isClient, setIsClient] = useState(false)

  const getCartQuantityCount = (items: any[]) => {
    return (items ?? []).reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0)
  }

  // Initialisation côté client uniquement avec gestion d'erreur robuste
  useEffect(() => {
    setIsClient(true)
    
    // Fonction sécurisée pour accéder à localStorage
    const safeLocalStorage = {
      getItem: (key: string, defaultValue: any = null) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
          }
          return defaultValue
        } catch (error) {
          console.warn(`Erreur localStorage pour ${key}:`, error)
          return defaultValue
        }
      }
    }
    
    // Charger les données de manière sécurisée
    try {
      // Cart (via service, rétro-compat)
      const cart = CartService.getCart()
      setCartItems(getCartQuantityCount(Array.isArray(cart) ? cart : []))
      
      // Wishlist (via service, rétro-compat)
      const wishlist = WishlistService.getWishlist()
      setWishlistItems(Array.isArray(wishlist) ? wishlist.length : 0)
      
      // Compare list
      const compareList = safeLocalStorage.getItem('compareList', [])
      setCompareListLength(Array.isArray(compareList) ? compareList.length : 0)
      
      // User login status
      const userToken = safeLocalStorage.getItem('userToken', null)
      setIsLoggedIn(!!userToken)
      
    } catch (error) {
      console.warn('Erreur lors du chargement des données:', error)
      // Garder les valeurs par défaut en cas d'erreur
    }

    const onCartUpdated = (event: any) => {
      const nextCart = Array.isArray(event?.detail?.cart) ? event.detail.cart : null
      const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null
      if (nextCart) {
        setCartItems(nextCount ?? getCartQuantityCount(nextCart))
        return
      }
      const cartFallback = CartService.getCart()
      setCartItems(getCartQuantityCount(Array.isArray(cartFallback) ? cartFallback : []))
    }

    const onWishlistUpdated = (event: any) => {
      const nextWishlist = Array.isArray(event?.detail?.wishlist) ? event.detail.wishlist : null
      const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null
      if (nextWishlist) {
        setWishlistItems(nextCount ?? nextWishlist.length)
        return
      }
      const wishlistFallback = WishlistService.getWishlist()
      setWishlistItems(Array.isArray(wishlistFallback) ? wishlistFallback.length : 0)
    }

    window.addEventListener('cartUpdated', onCartUpdated as any)
    window.addEventListener('wishlistUpdated', onWishlistUpdated as any)

    return () => {
      window.removeEventListener('cartUpdated', onCartUpdated as any)
      window.removeEventListener('wishlistUpdated', onWishlistUpdated as any)
    }
  }, [])

  // Fonction pour gérer la comparaison
  const handleCompare = () => {
    if (!isClient) return
    
    try {
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]')
      if (compareList.length === 0) {
        alert('Votre liste de comparaison est vide. Ajoutez des produits pour les comparer.')
        return
      }
      setShowCompareModal(true)
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la comparaison:', error)
      alert('Erreur lors de l\'ouverture de la comparaison')
    }
  }

  // Fonction de déconnexion
  const handleLogout = () => {
    if (!isClient) return
    
    try {
      localStorage.removeItem('userToken')
      localStorage.removeItem('userInfo')
      setIsLoggedIn(false)
      alert('Déconnexion réussie !')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      alert('Erreur lors de la déconnexion')
    }
  }

  return {
    // États
    isLoggedIn,
    cartItems,
    wishlistItems,
    selectedCurrency,
    showCartModal,
    showWishlistModal,
    showDeliveryModal,
    showUserModal,
    showCompareModal,
    showNotificationModal,
    showThemeModal,
    showSupportModal,
    showOrderModal,
    showSettingsModal,
    showChatModal,
    showShareModal,
    showHelpModal,
    showPromoModal,
    showPaymentModal,
    showQuickActionsModal,
    showLanguageModal,
    compareListLength,
    isClient,
    
    // Setters
    setSelectedCurrency,
    setShowCartModal,
    setShowWishlistModal,
    setShowDeliveryModal,
    setShowUserModal,
    setShowCompareModal,
    setShowNotificationModal,
    setShowThemeModal,
    setShowSupportModal,
    setShowOrderModal,
    setShowSettingsModal,
    setShowChatModal,
    setShowShareModal,
    setShowHelpModal,
    setShowPromoModal,
    setShowPaymentModal,
    setShowQuickActionsModal,
    setShowLanguageModal,
    
    // Fonctions
    handleCompare,
    handleLogout
  }
}
