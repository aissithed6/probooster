// Services pour les fonctionnalités des boutons du site

export interface CartItem {
  id: string | number
  name: string
  price: number
  originalPrice?: number
  warranty?: string
  returnPolicy?: string
  quantity: number
  image: string
  seller: string
  inStock?: boolean
  appliedOffer?:
    | {
        source: 'classic' | 'special'
        promotionId: string | null
      }
    | null
}

export interface WishlistItem {
  id: string | number
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

let cartMemoryCache: CartItem[] | null = null

/**
 * Émet un événement navigateur standardisé pour propager les mises à jour du panier.
 */
const emitCartUpdated = (cart: CartItem[]) => {
  if (typeof window === 'undefined') return
  try {
    const count = (cart ?? []).reduce((sum, item) => sum + (Number((item as any)?.quantity ?? 0) || 0), 0)
    try {
      if (window.localStorage?.getItem('probooster_debug_cart') === 'true') {
        console.log('[CartDebug] emitCartUpdated', {
          count,
          version: (() => {
            try {
              return safeLocalStorage.getItem('probooster_cart_version', 0 as any)
            } catch {
              return null
            }
          })(),
          cartIds: (cart ?? []).map((x: any) => String(x?.id ?? '')).slice(0, 20)
        })
      }
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart, count } }))
  } catch {
    // silencieux
  }
}

/**
 * Émet un événement navigateur standardisé pour propager les mises à jour de la wishlist.
 */
const emitWishlistUpdated = (wishlist: WishlistItem[]) => {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { wishlist, count: wishlist.length } }))
  } catch {
    // silencieux
  }
}

/**
 * Émet un événement navigateur standardisé pour propager les mises à jour des points.
 */
const emitPointsUpdated = (points: number) => {
  if (typeof window === 'undefined') return
  try {
    const safePoints = Number(points) || 0
    window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { points: safePoints, value: safePoints * 10 } }))
  } catch {
    // silencieux
  }
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

function getCartVersion(): number {
  try {
    const raw = safeLocalStorage.getItem('probooster_cart_version', 0 as any)
    const parsed = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

function bumpCartVersion(): number {
  const next = getCartVersion() + 1
  try {
    safeLocalStorage.setItem('probooster_cart_version', next)
  } catch {
    // ignore
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage?.getItem('probooster_debug_cart') === 'true') {
      console.log('[CartDebug] bumpCartVersion ->', next)
    }
  } catch {
    // ignore
  }
  return next
}

// Service de gestion du panier
export class CartService {
  static addToCart(product: Omit<CartItem, 'quantity'>) {
    try {
      try {
        if (typeof window !== 'undefined' && window.localStorage?.getItem('probooster_debug_cart') === 'true') {
          console.log('[CartDebug] addToCart:start', {
            id: String((product as any)?.id ?? ''),
            incomingPrice: (product as any)?.price,
            incomingOriginalPrice: (product as any)?.originalPrice,
            incomingSalePrice: (product as any)?.salePrice ?? (product as any)?.sale_price
          })
        }
      } catch {
        // ignore
      }
      const cart = safeLocalStorage.getItem('probooster_cart', [])
      const existingItem = cart.find((item: CartItem) => item.id === product.id)
      const incomingPrice = Number((product as any)?.price ?? 0) || 0
      const incomingOriginalPrice = Number((product as any)?.originalPrice ?? 0) || 0
      const regularPrice = incomingOriginalPrice > 0 ? incomingOriginalPrice : incomingPrice
      const salePriceRaw = (product as any)?.salePrice ?? (product as any)?.sale_price
      const salePrice = salePriceRaw === null || salePriceRaw === undefined ? 0 : Number(salePriceRaw) || 0
      const effectivePrice = salePrice > 0 && regularPrice > 0 && salePrice <= regularPrice
        ? salePrice
        : (incomingPrice > 0 ? incomingPrice : regularPrice)
    
    if (existingItem) {
      existingItem.quantity += 1

      if (existingItem.originalPrice === undefined && typeof (product as any).originalPrice === 'number') {
        existingItem.originalPrice = (product as any).originalPrice
      }

      if (typeof existingItem.originalPrice !== 'number' || !Number.isFinite(existingItem.originalPrice)) {
        existingItem.originalPrice = regularPrice
      }
      const hasAppliedOffer = Boolean((existingItem as any)?.appliedOffer)
      if (!hasAppliedOffer) {
        existingItem.price = effectivePrice
        existingItem.originalPrice = regularPrice
      } else if (typeof existingItem.price !== 'number' || !Number.isFinite(existingItem.price) || existingItem.price <= 0) {
        existingItem.price = effectivePrice
      }
    } else {
        cart.push({ ...product, price: effectivePrice, originalPrice: regularPrice, quantity: 1 } as any)
      }
      
      cartMemoryCache = Array.isArray(cart) ? cart : []
      safeLocalStorage.setItem('probooster_cart', cart)
      safeLocalStorage.setItem('cart', cart)
      bumpCartVersion()
      emitCartUpdated(cart)

      // Notifier l'UI globale (notification moderne d'ajout au panier).
      try {
        if (typeof window !== 'undefined') {
          const quantityAdded = 1
          const cartCount = (Array.isArray(cart) ? cart : []).reduce(
            (sum: number, it: any) => sum + (Number(it?.quantity ?? 0) || 0),
            0
          )
          window.dispatchEvent(
            new CustomEvent('probooster:cart-added', {
              detail: {
                product: {
                  id: (product as any)?.id,
                  name: (product as any)?.name ?? (product as any)?.title ?? 'Produit',
                  price: effectivePrice,
                  image:
                    (product as any)?.image ??
                    (Array.isArray((product as any)?.images) ? (product as any).images?.[0] : undefined) ??
                    (product as any)?.thumbnail ??
                    ''
                },
                quantityAdded,
                cartCount
              }
            })
          )
        }
      } catch {
        // ignore
      }

      try {
        if (typeof window !== 'undefined' && window.localStorage?.getItem('probooster_debug_cart') === 'true') {
          console.log('[CartDebug] addToCart:done', {
            count: (cart ?? []).reduce((sum: number, it: any) => sum + (Number(it?.quantity ?? 0) || 0), 0)
          })
        }
      } catch {
        // ignore
      }
      return cart
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      return []
    }
  }

  /**
   * Remplace entièrement le panier stocké (localStorage) par la liste fournie.
   */
  static setCart(items: CartItem[]) {
    try {
      const next = Array.isArray(items) ? items : []
      cartMemoryCache = next
      safeLocalStorage.setItem('probooster_cart', next)
      safeLocalStorage.setItem('cart', next)
      bumpCartVersion()
      emitCartUpdated(next)
      return next
    } catch (error) {
      console.error('Erreur lors de la mise à jour du panier:', error)
      return []
    }
  }

  /**
   * Synchronise les articles remisés du panier avec les offres publiques actuelles.
   * - Si la promotion a été mise en pause, l'offre n'est plus retournée et le prix revient au prix d'origine.
   * - Si l'offre existe toujours, on réapplique le prix remisé.
   */
  static async syncDiscountedItemsWithOffers() {
    try {
      const versionAtStart = getCartVersion()
      const cart = this.getCart()
      if (!Array.isArray(cart) || cart.length === 0) return cart

      let changed = false

      const next = await Promise.all(
        cart.map(async (item) => {
          const pid = encodeURIComponent(String(item.id))
          const resp = await fetch(`/api/public/offers?productId=${pid}`, { cache: 'no-store' }).catch(() => null)

          const offers: any = resp && resp.ok ? await resp.json().catch(() => []) : []
          const list = Array.isArray(offers) ? offers : []
          const best = list.reduce<any>((acc, cur) => {
            if (!cur) return acc
            const curDiscounted = typeof cur.discountedPrice === 'number' ? cur.discountedPrice : Number(cur.discountedPrice)
            const accDiscounted = acc && (typeof acc.discountedPrice === 'number' ? acc.discountedPrice : Number(acc.discountedPrice))
            if (!acc) return cur
            if (!Number.isFinite(curDiscounted)) return acc
            if (!Number.isFinite(accDiscounted)) return cur
            return curDiscounted < accDiscounted ? cur : acc
          }, null)

          // 1) Offre active -> on applique le prix remisé + on conserve le prix original
          if (best) {
            const currentOriginalFallback = typeof item.originalPrice === 'number' ? item.originalPrice : item.price
            const apiOriginal = typeof best.originalPrice === 'number' ? best.originalPrice : currentOriginalFallback
            const apiDiscounted = typeof best.discountedPrice === 'number' ? best.discountedPrice : apiOriginal
            const normalizedDiscounted = apiDiscounted > 0 && apiOriginal > 0 && apiDiscounted <= apiOriginal ? apiDiscounted : apiOriginal
            const nextPrice = Math.round(normalizedDiscounted)
            const nextOriginal = Math.round(apiOriginal)

            const appliedOffer = {
              source: 'classic' as const,
              promotionId: typeof (best as any)?.promotionId === 'string' ? (best as any).promotionId : null
            }

            if (item.price !== nextPrice || item.originalPrice !== nextOriginal || (item as any).appliedOffer?.promotionId !== appliedOffer.promotionId) {
              changed = true
              return { ...item, price: nextPrice, originalPrice: nextOriginal, appliedOffer }
            }
            if ((item as any).appliedOffer?.source !== 'classic' || (item as any).appliedOffer?.promotionId !== appliedOffer.promotionId) {
              changed = true
              return { ...item, appliedOffer }
            }
            return item
          }

          // 1bis) Pas d'offre classique -> tenter une offre issue des promotions spéciales
          const specialResp = await fetch(`/api/public/special-offers?productId=${pid}`, { cache: 'no-store' }).catch(() => null)
          const specialOffers: any = specialResp && specialResp.ok ? await specialResp.json().catch(() => []) : []
          const specialList = Array.isArray(specialOffers) ? specialOffers : []
          const bestSpecial = specialList.reduce<any>((acc, cur) => {
            if (!cur) return acc
            const curDiscounted = typeof cur.discountedPrice === 'number' ? cur.discountedPrice : Number(cur.discountedPrice)
            const accDiscounted = acc && (typeof acc.discountedPrice === 'number' ? acc.discountedPrice : Number(acc.discountedPrice))
            if (!acc) return cur
            if (!Number.isFinite(curDiscounted)) return acc
            if (!Number.isFinite(accDiscounted)) return cur
            return curDiscounted < accDiscounted ? cur : acc
          }, null)

          if (bestSpecial) {
            const currentOriginalFallback = typeof item.originalPrice === 'number' ? item.originalPrice : item.price
            const apiOriginal = typeof bestSpecial.originalPrice === 'number' ? bestSpecial.originalPrice : currentOriginalFallback
            const apiDiscounted = typeof bestSpecial.discountedPrice === 'number' ? bestSpecial.discountedPrice : apiOriginal
            const normalizedDiscounted = apiDiscounted > 0 && apiOriginal > 0 && apiDiscounted <= apiOriginal ? apiDiscounted : apiOriginal
            const nextPrice = Math.round(normalizedDiscounted)
            const nextOriginal = Math.round(apiOriginal)

            const appliedOffer = {
              source: 'special' as const,
              promotionId: typeof (bestSpecial as any)?.promotionId === 'string' ? (bestSpecial as any).promotionId : null
            }

            if (item.price !== nextPrice || item.originalPrice !== nextOriginal || (item as any).appliedOffer?.promotionId !== appliedOffer.promotionId) {
              changed = true
              return { ...item, price: nextPrice, originalPrice: nextOriginal, appliedOffer }
            }
            if ((item as any).appliedOffer?.source !== 'special' || (item as any).appliedOffer?.promotionId !== appliedOffer.promotionId) {
              changed = true
              return { ...item, appliedOffer }
            }
            return item
          }

          // 2) Pas d'offre active -> on retombe sur le prix normal côté produit
          const productResp = await fetch(`/api/public/products?id=${pid}`, { cache: 'no-store' }).catch(() => null)
          const productJson = productResp && productResp.ok ? await productResp.json().catch(() => ({})) : {}
          const serverBasePriceRaw = (productJson as any)?.data?.price
          const serverSalePriceRaw =
            (productJson as any)?.data?.sale_price ?? (productJson as any)?.data?.salePrice
          const serverOriginalPriceRaw =
            (productJson as any)?.data?.original_price ?? (productJson as any)?.data?.originalPrice

          const serverBasePrice = typeof serverBasePriceRaw === 'number' ? serverBasePriceRaw : Number(serverBasePriceRaw)
          const serverSalePrice =
            serverSalePriceRaw === null || serverSalePriceRaw === undefined
              ? null
              : typeof serverSalePriceRaw === 'number'
                ? serverSalePriceRaw
                : Number(serverSalePriceRaw)
          const serverOriginalPrice =
            serverOriginalPriceRaw === null || serverOriginalPriceRaw === undefined
              ? null
              : typeof serverOriginalPriceRaw === 'number'
                ? serverOriginalPriceRaw
                : Number(serverOriginalPriceRaw)

          const fallbackOriginal = typeof item.originalPrice === 'number' ? item.originalPrice : item.price
          const baseCandidate = Number.isFinite(serverBasePrice) && serverBasePrice > 0 ? serverBasePrice : fallbackOriginal
          const originalCandidate = Number.isFinite(serverOriginalPrice as any) && (serverOriginalPrice as number) > 0
            ? (serverOriginalPrice as number)
            : baseCandidate

          const saleCandidate = Number.isFinite(serverSalePrice as any) && (serverSalePrice as number) > 0
            ? (serverSalePrice as number)
            : null

          const effectiveNormalPrice = saleCandidate !== null && saleCandidate <= originalCandidate
            ? saleCandidate
            : baseCandidate

          const effectiveOriginal = originalCandidate

          const nextPrice = Math.round(effectiveNormalPrice)
          const nextOriginal = Math.round(effectiveOriginal)

          if (item.price !== nextPrice || item.originalPrice !== nextOriginal || (item as any).appliedOffer) {
            changed = true
            return { ...item, price: nextPrice, originalPrice: nextOriginal, appliedOffer: null }
          }

          return item
        })
      )

      if (changed) {
        if (getCartVersion() === versionAtStart) {
          this.setCart(next)
        } else {
          return this.getCart()
        }
      }

      if (getCartVersion() !== versionAtStart) {
        return this.getCart()
      }

      return next
    } catch (error) {
      console.error('Erreur lors de la synchronisation du panier avec les offres:', error)
      return this.getCart()
    }
  }

  static removeFromCart(productId: string | number) {
    try {
      const cart = safeLocalStorage.getItem('probooster_cart', [])
      const updatedCart = cart.filter((item: CartItem) => item.id !== productId)
      cartMemoryCache = updatedCart
      safeLocalStorage.setItem('probooster_cart', updatedCart)
      safeLocalStorage.setItem('cart', updatedCart)
      bumpCartVersion()
      emitCartUpdated(updatedCart)
      return updatedCart
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error)
      return []
    }
  }

  static updateQuantity(productId: string | number, quantity: number) {
    try {
      const cart = safeLocalStorage.getItem('probooster_cart', [])
      const item = cart.find((item: CartItem) => item.id === productId)
    if (item) {
      item.quantity = quantity
      if (quantity <= 0) {
          return this.removeFromCart(productId)
        }
      }
      cartMemoryCache = cart
      safeLocalStorage.setItem('probooster_cart', cart)
      safeLocalStorage.setItem('cart', cart)
      bumpCartVersion()
      emitCartUpdated(cart)
      return cart
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error)
      return []
    }
  }

  static getCart() {
    try {
      const primary = safeLocalStorage.getItem('probooster_cart', [])
      if (Array.isArray(primary) && primary.length > 0) {
        cartMemoryCache = primary
        return primary
      }

      const legacy = safeLocalStorage.getItem('cart', [])
      if (Array.isArray(legacy) && legacy.length > 0) {
        safeLocalStorage.setItem('probooster_cart', legacy)
        cartMemoryCache = legacy
        emitCartUpdated(legacy)
        return legacy
      }

      if (Array.isArray(cartMemoryCache) && cartMemoryCache.length > 0) {
        return cartMemoryCache
      }

      return []
    } catch (error) {
      console.error('Erreur lors de la récupération du panier:', error)
      if (Array.isArray(cartMemoryCache) && cartMemoryCache.length > 0) {
        return cartMemoryCache
      }
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
      cartMemoryCache = []
      safeLocalStorage.setItem('probooster_cart', [])
      safeLocalStorage.setItem('cart', [])
      bumpCartVersion()
      emitCartUpdated([])
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
        safeLocalStorage.setItem('wishlist', wishlist)
      }
      emitWishlistUpdated(wishlist)
      return wishlist
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la wishlist:', error)
      return []
    }
  }

  static removeFromWishlist(productId: string | number) {
    try {
      const wishlist = safeLocalStorage.getItem('probooster_wishlist', [])
      const updatedWishlist = wishlist.filter((item: WishlistItem) => item.id !== productId)
      safeLocalStorage.setItem('probooster_wishlist', updatedWishlist)
      safeLocalStorage.setItem('wishlist', updatedWishlist)
      emitWishlistUpdated(updatedWishlist)
      return updatedWishlist
    } catch (error) {
      console.error('Erreur lors de la suppression de la wishlist:', error)
      return []
    }
  }

  static getWishlist() {
    try {
      const primary = safeLocalStorage.getItem('probooster_wishlist', [])
      if (Array.isArray(primary) && primary.length > 0) {
        return primary
      }

      const legacy = safeLocalStorage.getItem('wishlist', [])
      if (Array.isArray(legacy) && legacy.length > 0) {
        safeLocalStorage.setItem('probooster_wishlist', legacy)
        emitWishlistUpdated(legacy)
        return legacy
      }

      return []
    } catch (error) {
      console.error('Erreur lors de la récupération de la wishlist:', error)
      return []
    }
  }

  static isInWishlist(productId: string | number) {
    try {
      const wishlist = this.getWishlist()
      return wishlist.some((item: WishlistItem) => item.id === productId)
    } catch (error) {
      console.error('Erreur lors de la vérification de la wishlist:', error)
      return false
    }
  }

  static clearWishlist() {
    try {
      safeLocalStorage.setItem('probooster_wishlist', [])
      safeLocalStorage.setItem('wishlist', [])
      emitWishlistUpdated([])
      return []
    } catch (error) {
      console.error('Erreur lors du vidage de la wishlist:', error)
      return []
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
      emitPointsUpdated(newPoints)
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
        emitPointsUpdated(newPoints)
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
        emitPointsUpdated(newPoints)
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

  static login(_email: string, _password: string) {
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
      const rawRecentSearches: unknown = safeLocalStorage.getItem('probooster_recent_searches', [])
      const recentSearches: string[] = Array.isArray(rawRecentSearches)
        ? rawRecentSearches.filter((item): item is string => typeof item === 'string')
        : []

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
      const rawRecentSearches: unknown = safeLocalStorage.getItem('probooster_recent_searches', [])
      return Array.isArray(rawRecentSearches)
        ? rawRecentSearches.filter((item): item is string => typeof item === 'string')
        : []
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