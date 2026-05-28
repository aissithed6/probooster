// Types pour le tableau de bord vendeur
export interface SellerStats {
  totalSales: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  totalRevenue: number
  totalCommissions: number
  totalPoints: number
  averageRating: number
  totalReviews: number
  totalShares: number
  ranking: number
  totalVendors: number
}

export interface SellerProduct {
  id: number
  name: string
  price: number
  originalPrice: number
  image: string
  category: string
  stock: number
  sales: number
  revenue: number
  shares: number
  rating: number
  reviews: number
  status: 'active' | 'inactive' | 'draft' | 'out_of_stock'
  createdAt: string
  updatedAt: string
  description?: string
  images?: string[]
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingCost?: number
  isShareable?: boolean
  isPromoted?: boolean
}

export interface SellerOrder {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  products: Array<{
    id: number
    name: string
    quantity: number
    price: number
    total: number
  }>
  totalAmount: number
  commission: number
  netRevenue: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: string
  orderDate: string
  deliveryDate?: string
  customerRating?: number
  customerReview?: string
  trackingNumber?: string
  shippingMethod?: string
  notes?: string
}

export interface SellerRevenue {
  totalRevenue: number
  totalCommissions: number
  netRevenue: number
  pendingPayments: number
  completedPayments: number
  monthlyRevenue: number[]
  monthlyOrders: number[]
  topProducts: Array<{
    id: number
    name: string
    revenue: number
    sales: number
  }>
  revenueByCategory: Array<{
    category: string
    revenue: number
    percentage: number
  }>
  paymentHistory: Array<{
    id: string
    amount: number
    date: string
    method: string
    status: string
  }>
}

export interface SellerRanking {
  overallRank: number
  totalVendors: number
  categoryRank: number
  totalCategoryVendors: number
  salesRank: number
  sharesRank: number
  visitsRank: number
  ratingRank: number
  evolution: Array<{
    date: string
    rank: number
  }>
  competitors: Array<{
    name: string
    rank: number
    sales: number
    rating: number
  }>
  categoryRankings: Array<{
    category: string
    rank: number
    totalVendors: number
  }>
}

export interface SellerChat {
  id: string
  customerName: string
  customerAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: 'online' | 'offline' | 'away'
  isPinned: boolean
  productId?: number
  productName?: string
  messages: Array<{
    id: string
    content: string
    timestamp: string
    isFromCustomer: boolean
    attachments?: Array<{
      type: 'image' | 'file' | 'voice'
      url: string
      name: string
    }>
  }>
}

export interface SellerShare {
  id: string
  productId: number
  productName: string
  productImage: string
  customerName: string
  customerAvatar: string
  socialNetwork: 'facebook' | 'twitter' | 'whatsapp' | 'instagram' | 'linkedin'
  pointsEarned: number
  sharedAt: string
  isViral: boolean
  reach: number
  engagement: number
  clicks: number
  conversions: number
}

export interface SellerPromotion {
  id: string
  name: string
  type: 'discount' | 'flash' | 'bundle' | 'cashback' | 'free_shipping'
  value: string
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  products: number[]
  usageCount: number
  maxUsage?: number
  isActive: boolean
  revenue: number
  orders: number
  code?: string
  description?: string
  conditions?: string[]
  targetAudience?: string[]
}

export interface SellerReview {
  id: string
  customerName: string
  customerAvatar: string
  productId: number
  productName: string
  rating: number
  title: string
  comment: string
  images?: string[]
  video?: string
  createdAt: string
  isVerified: boolean
  isHelpful: number
  isReported: boolean
  status: 'pending' | 'approved' | 'rejected'
  sellerResponse?: {
    content: string
    timestamp: string
  }
}

export interface SellerNotification {
  id: string
  type: 'order' | 'review' | 'chat' | 'payment' | 'promotion' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  priority: 'low' | 'medium' | 'high'
}

export interface SellerAnalytics {
  salesAnalytics: {
    dailySales: Array<{ date: string; amount: number }>
    weeklySales: Array<{ week: string; amount: number }>
    monthlySales: Array<{ month: string; amount: number }>
    topSellingProducts: Array<{ id: number; name: string; sales: number }>
  }
  customerAnalytics: {
    newCustomers: Array<{ date: string; count: number }>
    repeatCustomers: number
    customerRetention: number
    averageOrderValue: number
  }
  productAnalytics: {
    productViews: Array<{ id: number; name: string; views: number }>
    conversionRate: number
    averageRating: number
    stockAlerts: Array<{ id: number; name: string; stock: number }>
  }
  shareAnalytics: {
    totalShares: number
    sharesByNetwork: Array<{ network: string; count: number }>
    viralShares: number
    engagementRate: number
  }
}

export interface SellerProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  address: string
  city: string
  country: string
  businessName: string
  businessDescription: string
  businessCategory: string
  businessLicense?: string
  taxId?: string
  bankInfo?: {
    accountNumber: string
    bankName: string
    accountHolder: string
  }
  twoFactorEnabled: boolean
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    orders: boolean
    reviews: boolean
    chat: boolean
    promotions: boolean
  }
  preferences: {
    language: string
    currency: string
    theme: 'light' | 'dark' | 'system'
    timezone: string
  }
  verificationStatus: 'pending' | 'verified' | 'rejected'
  subscriptionPlan: 'free' | 'basic' | 'pro' | 'enterprise'
}
