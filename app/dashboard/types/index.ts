// Types pour les notifications
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'promo';
export type NotificationPriority = 'low' | 'medium' | 'high';
export type NotificationCategory = 'orders' | 'shipping' | 'promotions' | 'system' | 'account';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  promoCode?: string;
}

// Types pour les produits
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  sku?: string;
  isNew?: boolean;
  isOnSale?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les articles du panier
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  maxQuantity: number;
}

// Types pour les articles de commande
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  product?: {
    name?: string;
    image?: string;
    warranty?: string;
    returnPolicy?: string;
  };
  selectedSize?: string;
  selectedColor?: string;
}

// Statuts de commande
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

// Types pour les commandes
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    address?: string;
    phone?: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  orderDate?: string;
  deliveryDate?: string;
}

// Types pour l'utilisateur
export interface UserAddress {
  id: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  last4?: string;
  expiryDate?: string;
  cvv?: string;
  nameOnCard?: string;
  email?: string; // Pour PayPal
  isDefault: boolean;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  newsletter: boolean;
  promotions: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorAuth: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  avatar: string;
  bio?: string;
  preferences: UserPreferences;
  addresses: UserAddress[];
  paymentMethods: PaymentMethod[];
  orders: Order[];
  wishlist: string[]; // IDs des produits
  createdAt: string;
  updatedAt: string;
}

// Types pour les onglets du tableau de bord
export type DashboardTab = 'overview' | 'orders' | 'wishlist' | 'settings' | 'addresses' | 'payment-methods';

// Types pour les filtres de commande
export interface OrderFilters {
  status?: OrderStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

// Types pour le tri des commandes
export type OrderSortField = 'date' | 'total' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: OrderSortField;
  direction: SortDirection;
}

// Types pour les statistiques du tableau de bord
export interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  wishlistCount: number;
  pendingOrders: number;
  recentOrders: Order[];
  recommendedProducts: Product[];
}
