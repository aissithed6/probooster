// Services pour les fonctionnalités des boutons du site

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  seller: string
}

export interface WishlistItem {
  id: number
  name: string
  price: number
  image: string
  seller: string
  addedAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  points: number
  role: 'buyer' | 'seller'
}

export interface DeliveryInfo {
  id: string
  status: 'en_cours' | 'livré' | 'en_transit'
  location: string
  estimatedTime: string
  deliveredDate?: string
  trackingNumber: string
}

// Fonction utilitaire sécurisée pour localStorage
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
  },
  setItem: (key: string, value: any) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.warn(`Erreur localStorage pour ${key}:`, error)
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Erreur localStorage pour ${key}:`, error)
    }
  }
}

// Service de gestion du panier
export class CartService {
  static addToCart(product: Omit<CartItem, 'quantity'>) {
    try {
      const cart = safeLocalStorage.getItem('probooster_cart', [])
      const existingItem = cart.find((item: CartItem) => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
        cart.push({ ...product, quantity: 1 })
      }
      
      safeLocalStorage.setItem('probooster_cart', cart)
      return cart
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      return []
    }
  }

  static removeFromCart(productId: number) {
    try {
      const cart = safeLocalStorage.getItem('probooster_cart', [])
      const updatedCart = cart.filter((item: CartItem) => item.id !== productId)
      safeLocalStorage.setItem('probooster_cart', updatedCart)
      return updatedCart
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error)
      return []
    }
  }

  static updateQuantity(productId: number, quantity: number) {
    try {
      const cart = safeLocalStorage.getItem('probooster_cart', [])
      const item = cart.find((item: CartItem) => item.id === productId)
    if (item) {
      item.quantity = quantity
      if (quantity <= 0) {
          return this.removeFromCart(productId)
        }
      }
      safeLocalStorage.setItem('probooster_cart', cart)
      return cart
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error)
      return []
    }
  }

  static getCart() {
    try {
      return safeLocalStorage.getItem('probooster_cart', [])
    } catch (error) {
      console.error('Erreur lors de la récupération du panier:', error)
      return []
    }
  }

  static getCartTotal() {
    try {
      const cart = this.getCart()
      return cart.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0)
    } catch (error) {
      console.error('Erreur lors du calcul du total:', error)
      return 0
    }
  }

  static clearCart() {
    try {
      safeLocalStorage.setItem('probooster_cart', [])
      return []
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error)
      return []
    }
  }
}

// Service de gestion de la wishlist
export class WishlistService {
  static addToWishlist(product: Omit<WishlistItem, 'addedAt'>) {
    try {
      const wishlist = safeLocalStorage.getItem('probooster_wishlist', [])
      if (!wishlist.find((item: WishlistItem) => item.id === product.id)) {
        wishlist.push({ ...product, addedAt: new Date().toISOString() })
        safeLocalStorage.setItem('probooster_wishlist', wishlist)
      }
      return wishlist
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la wishlist:', error)
      return []
    }
  }

  static removeFromWishlist(productId: number) {
    try {
      const wishlist = safeLocalStorage.getItem('probooster_wishlist', [])
      const updatedWishlist = wishlist.filter((item: WishlistItem) => item.id !== productId)
      safeLocalStorage.setItem('probooster_wishlist', updatedWishlist)
      return updatedWishlist
    } catch (error) {
      console.error('Erreur lors de la suppression de la wishlist:', error)
      return []
    }
  }

  static getWishlist() {
    try {
      return safeLocalStorage.getItem('probooster_wishlist', [])
    } catch (error) {
      console.error('Erreur lors de la récupération de la wishlist:', error)
      return []
    }
  }

  static isInWishlist(productId: number) {
    try {
      const wishlist = this.getWishlist()
      return wishlist.some((item: WishlistItem) => item.id === productId)
    } catch (error) {
      console.error('Erreur lors de la vérification de la wishlist:', error)
      return false
    }
  }
}

// Service de gestion des points
export class PointsService {
  static getUserPoints() {
    try {
      return safeLocalStorage.getItem('probooster_user_points', 1000)
    } catch (error) {
      console.error('Erreur lors de la récupération des points:', error)
      return 1000
    }
  }

  static getPointsValue() {
    try {
      const points = this.getUserPoints()
      return points * 10 // 1 point = 10 F CFA
    } catch (error) {
      console.error('Erreur lors du calcul de la valeur des points:', error)
      return 10000
    }
  }

  static addPoints(amount: number) {
    try {
      const currentPoints = this.getUserPoints()
      const newPoints = currentPoints + amount
      safeLocalStorage.setItem('probooster_user_points', newPoints)
      return newPoints
    } catch (error) {
      console.error('Erreur lors de l\'ajout de points:', error)
      return this.getUserPoints()
    }
  }

  static usePoints(amount: number) {
    try {
      const currentPoints = this.getUserPoints()
      if (currentPoints >= amount) {
        const newPoints = currentPoints - amount
        safeLocalStorage.setItem('probooster_user_points', newPoints)
        return newPoints
      }
      return currentPoints
    } catch (error) {
      console.error('Erreur lors de l\'utilisation des points:', error)
      return this.getUserPoints()
    }
  }

  static withdrawPoints(amount: number = 500) {
    try {
      const currentPoints = this.getUserPoints()
      if (currentPoints >= amount) {
        const newPoints = currentPoints - amount
        safeLocalStorage.setItem('probooster_user_points', newPoints)
      return amount
    }
    return 0
    } catch (error) {
      console.error('Erreur lors du retrait de points:', error)
      return 0
    }
  }
}

// Service de livraison
export class DeliveryService {
  static getDeliveryInfo() {
    try {
      return safeLocalStorage.getItem('probooster_delivery_info', [])
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de livraison:', error)
      return []
    }
  }

  static addDeliveryInfo(info: DeliveryInfo) {
    try {
      const deliveryInfo = this.getDeliveryInfo()
      deliveryInfo.push(info)
      safeLocalStorage.setItem('probooster_delivery_info', deliveryInfo)
      return deliveryInfo
    } catch (error) {
      console.error('Erreur lors de l\'ajout des informations de livraison:', error)
      return this.getDeliveryInfo()
    }
  }

  static updateDeliveryStatus(trackingNumber: string, status: DeliveryInfo['status']) {
    try {
      const deliveryInfo = this.getDeliveryInfo()
      const info = deliveryInfo.find((item: DeliveryInfo) => item.trackingNumber === trackingNumber)
      if (info) {
        info.status = status
        if (status === 'livré') {
          info.deliveredDate = new Date().toISOString()
        }
        safeLocalStorage.setItem('probooster_delivery_info', deliveryInfo)
      }
      return deliveryInfo
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de livraison:', error)
      return this.getDeliveryInfo()
    }
  }
}

// Service d'authentification
export class AuthService {
  static isLoggedIn() {
    try {
      const token = safeLocalStorage.getItem('probooster_user_token', null)
      return !!token
    } catch (error) {
      console.error('Erreur lors de la vérification de connexion:', error)
      return false
    }
  }

  static login(email: string, password: string) {
    try {
      // Simulation de connexion
      const token = `token_${Date.now()}`
      safeLocalStorage.setItem('probooster_user_token', token)
      return true
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      return false
    }
  }

  static logout() {
    try {
      safeLocalStorage.removeItem('probooster_user_token')
      return true
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      return false
    }
  }

  static getCurrentUser() {
    try {
      return safeLocalStorage.getItem('probooster_current_user', {
        id: '1',
        name: 'Utilisateur',
        email: 'user@example.com',
        avatar: '/placeholder-user.jpg',
        points: 1000,
        role: 'buyer' as const
      })
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      return null
    }
  }
}

// Service de recherche
export class SearchService {
  static searchProducts(query: string) {
    try {
      // Simulation de recherche
      const recentSearches = safeLocalStorage.getItem('probooster_recent_searches', [])
      if (query.trim() && !recentSearches.includes(query)) {
        recentSearches.unshift(query)
        if (recentSearches.length > 10) {
          recentSearches.pop()
        }
        safeLocalStorage.setItem('probooster_recent_searches', recentSearches)
      }
      return recentSearches
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      return []
    }
  }

  static getRecentSearches() {
    try {
      return safeLocalStorage.getItem('probooster_recent_searches', [])
    } catch (error) {
      console.error('Erreur lors de la récupération des recherches récentes:', error)
      return []
    }
  }

  static clearRecentSearches() {
    try {
      safeLocalStorage.setItem('probooster_recent_searches', [])
      return []
    } catch (error) {
      console.error('Erreur lors de la suppression des recherches récentes:', error)
      return []
    }
  }
}

// Service de notifications
export class NotificationService {
  static showSuccess(message: string) {
    try {
      if (typeof window !== 'undefined') {
        // Utiliser une notification native ou une bibliothèque de toast
        alert(`✅ ${message}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error)
    }
  }

  static showError(message: string) {
    try {
      if (typeof window !== 'undefined') {
        alert(`❌ ${message}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'affichage de l\'erreur:', error)
    }
  }

  static showInfo(message: string) {
    try {
      if (typeof window !== 'undefined') {
        alert(`ℹ️ ${message}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'affichage de l\'info:', error)
    }
  }

  static showWarning(message: string) {
    try {
      if (typeof window !== 'undefined') {
        alert(`⚠️ ${message}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'affichage de l\'avertissement:', error)
    }
  }
}

// Fonction d'initialisation des services
export function initializeServices() {
  try {
    // Les services sont maintenant initialisés automatiquement
    // Pas besoin d'initialisation complexe
    console.log('Services initialisés avec succès')
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des services:', error)
  }
} 