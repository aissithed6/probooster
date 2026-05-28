// Types pour les produits
export interface Product {
  id: number
  name: string
  price: number
  pointsPrice: number
  originalPrice: number
  rating: number
  reviews: number
  image: string
  seller: string
  sharePoints: number
  shares: number
  inStock: boolean
  discount: number
  isHot: boolean
  isNew: boolean
  isLimited: boolean
  badges: string[]
  color: string
  description?: string
  specifications?: Record<string, string>
  features?: string[]
  warranty?: string
  shipping?: {
    cost: number
    time: string
    method: string
  }
  stock?: number
  category?: string
  tags?: string[]
  relatedProducts?: Product[]
}

// Types pour les produits étendus (avec images multiples)
export interface ExtendedProduct extends Product {
  images: string[]
  seller: Seller
  description: string
  specifications: Record<string, string>
  features: string[]
  warranty: string
  shipping: {
    cost: number
    time: string
    method: string
  }
  stock: number
  category: string
  tags: string[]
  relatedProducts: Product[]
}

// Types pour les vendeurs
export interface Seller {
  name: string
  avatar: string
  rating: number
  totalSales: number
  responseTime: string
  location: string
  phone: string
  email: string
  isOnline?: boolean
}

// Types pour les éléments du panier
export interface CartItem {
  id: number
  name: string
  price: number
  image: string
  seller: string
  quantity: number
  addedAt?: string
}

// Types pour les éléments de la liste de souhaits
export interface WishlistItem {
  id: number
  name: string
  price: number
  image: string
  seller: string
  addedAt: string
}

// Types pour les commandes
export interface Order {
  id: string
  items: CartItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  pointsUsed?: number
  deliveryOption?: string
}

// Types pour les livraisons
export interface Delivery {
  id: string
  orderId: string
  status: 'pending' | 'in_transit' | 'delivered'
  trackingNumber: string
  estimatedDelivery: string
  actualDelivery?: string
  address: string
  recipient: string
  phone: string
}

// Types pour les sessions de chat
export interface ChatSession {
  id: string
  productId: number
  sellerId: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// Types pour les messages de chat
export interface ChatMessage {
  id: string
  sender: 'user' | 'seller'
  content: string
  timestamp: string
  type: 'text' | 'image' | 'voice' | 'file'
  metadata?: {
    fileName?: string
    fileSize?: number
    duration?: number
  }
}

// Types pour les options de livraison
export interface DeliveryOption {
  id: string
  title: string
  description: string
  price: string
  icon: string
  color: string
  iconColor: string
  badge: string
}

// Types pour les codes promo
export interface PromoCode {
  code: string
  discount: string
  color: string
}

// Types pour les notifications
export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
}

// Types pour les statistiques
export interface Stats {
  totalSales: number
  totalOrders: number
  totalProducts: number
  totalUsers: number
  averageRating: number
  totalReviews: number
}

// Types pour les paramètres utilisateur
export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  currency: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

// Types pour les filtres de produits
export interface ProductFilters {
  category?: string
  priceRange?: {
    min: number
    max: number
  }
  rating?: number
  inStock?: boolean
  sortBy?: 'price' | 'rating' | 'newest' | 'popular'
  sortOrder?: 'asc' | 'desc'
}

// Types pour la pagination
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Types pour les événements personnalisés
export interface CustomEvent {
  type: string
  payload?: any
}

// Types pour les hooks personnalisés
export interface UseLocalStorageReturn<T> {
  value: T
  setValue: (value: T) => void
  removeValue: () => void
}

// Types pour les composants modaux
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
}

// Types pour les props de boutons
export interface ButtonProps {
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

// Types pour les props de cartes
export interface CardProps {
  product: Product | ExtendedProduct
  onClick?: (product: Product | ExtendedProduct) => void
  onAddToCart?: (productId: number) => void
  onAddToWishlist?: (productId: number) => void
  onCompare?: (productId: number) => void
  onChat?: (product: Product | ExtendedProduct) => void
  className?: string
}

// Types pour les services
export interface CartService {
  getCart(): CartItem[]
  addToCart(item: Omit<CartItem, 'quantity'>): void
  removeFromCart(itemId: number): void
  updateQuantity(itemId: number, quantity: number): void
  clearCart(): void
  getCartTotal(): number
  getCartCount(): number
}

export interface WishlistService {
  getWishlist(): WishlistItem[]
  addToWishlist(item: Omit<WishlistItem, 'addedAt'>): void
  removeFromWishlist(itemId: number): void
  isInWishlist(itemId: number): boolean
  clearWishlist(): void
  getWishlistCount(): number
}

export interface PointsService {
  getUserPoints(): number
  getPointsValue(): number
  addPoints(amount: number): void
  spendPoints(amount: number): boolean
  getWithdrawalThreshold(): number
  canWithdraw(): boolean
}

export interface NotificationService {
  showSuccess(message: string): void
  showError(message: string): void
  showInfo(message: string): void
  showWarning(message: string): void
}

export interface ShareService {
  shareOnFacebook(text: string, url: string): void
  shareOnTwitter(text: string, url: string): void
  shareOnWhatsApp(text: string, url: string): void
  shareOnInstagram(text: string): void
  copyToClipboard(text: string): Promise<void>
}

export interface DeliveryService {
  getDeliveries(): Delivery[]
  addDelivery(delivery: Omit<Delivery, 'id'>): void
  updateDelivery(id: string, updates: Partial<Delivery>): void
  getDeliveryById(id: string): Delivery | undefined
  getActiveDeliveries(): Delivery[]
}

export interface AuthService {
  isLoggedIn(): boolean
  login(credentials: { email: string; password: string }): Promise<boolean>
  logout(): void
  register(userData: { email: string; password: string; name: string }): Promise<boolean>
  getCurrentUser(): any | null
}

export interface SearchService {
  searchProducts(query: string, filters?: ProductFilters): Product[]
  getSuggestions(query: string): string[]
  getPopularSearches(): string[]
  getRecentSearches(): string[]
}
