import { useState, useEffect } from 'react'
import { 
  CartService, 
  WishlistService, 
  PointsService, 
  AuthService, 
  initializeServices 
} from '@/lib/services'

export function useAppState() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [cartItems, setCartItems] = useState(0)
  const [wishlistItems, setWishlistItems] = useState(0)
  const [userPoints, setUserPoints] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Initialisation des services
  useEffect(() => {
    initializeServices()
    setIsInitialized(true)
  }, [])

  // Mise à jour des compteurs
  useEffect(() => {
    if (isInitialized) {
      setCartItems(CartService.getCart().length)
      setWishlistItems(WishlistService.getWishlist().length)
      setUserPoints(PointsService.getUserPoints())
      setIsLoggedIn(AuthService.isLoggedIn())
    }
  }, [isInitialized])

  // Fonctions pour mettre à jour l'état
  const updateCartCount = () => {
    setCartItems(CartService.getCart().length)
  }

  const updateWishlistCount = () => {
    setWishlistItems(WishlistService.getWishlist().length)
  }

  const updatePoints = () => {
    setUserPoints(PointsService.getUserPoints())
  }

  const updateAuthStatus = () => {
    setIsLoggedIn(AuthService.isLoggedIn())
  }

  return {
    isInitialized,
    cartItems,
    wishlistItems,
    userPoints,
    isLoggedIn,
    updateCartCount,
    updateWishlistCount,
    updatePoints,
    updateAuthStatus
  }
} 