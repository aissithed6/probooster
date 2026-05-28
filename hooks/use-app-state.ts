import { useState, useEffect } from 'react'
import { 
  CartService, 
  WishlistService, 
  AuthService, 
  initializeServices 
} from '@/lib/services'
import { useClientPoints } from '@/lib/hooks/use-client-points'

export function useAppState() {
  const { balance, refresh: refreshPoints } = useClientPoints()

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
      setIsLoggedIn(AuthService.isLoggedIn())
    }
  }, [isInitialized])

  useEffect(() => {
    setUserPoints(typeof balance === 'number' && Number.isFinite(balance) ? balance : 0)
  }, [balance])

  // Fonctions pour mettre à jour l'état
  const updateCartCount = () => {
    setCartItems(CartService.getCart().length)
  }

  const updateWishlistCount = () => {
    setWishlistItems(WishlistService.getWishlist().length)
  }

  const updatePoints = () => {
    void refreshPoints()
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