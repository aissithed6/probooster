export type ProductSource = 'vendor' | 'admin' | 'super_admin'

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'pending_review' | 'archived'

export type ProductStockStatus = 'instock' | 'outofstock' | 'onbackorder'

export type ProductType = 'simple' | 'variable' | 'virtual' | 'downloadable'

/**
 * Métadonnées SEO communes aux formulaires super admin et vendeur.
 */
export interface SharedProductSeo {
  title?: string | null
  description?: string | null
  keywords?: string[] | null
  slug?: string | null
  autoGenerate?: boolean
}

/**
 * Informations de livraison partagées.
 */
export interface SharedProductShipping {
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  shippingClass?: string | null
  freeShipping?: boolean
  shippingCost?: number | null
}

/**
 * Options de paiement différé / échelonné.
 */
export interface SharedProductPaymentOptions {
  installmentPayment?: boolean
  installmentOptions?: number[] | null
  deferredPayment?: boolean
  deferredPaymentFees?: {
    enabled: boolean
    type: 'percentage' | 'fixed'
    value: number
    period: 'day' | 'month' | 'quarter'
    maxPeriods: number
    minAmount: number
    calculationMethod: 'simple' | 'compound'
  } | null
}

/**
 * Informations marketing et sociales.
 */
export interface SharedProductMarketing {
  socialSharing?: boolean
  socialPoints?: number | null
  referralBonus?: number | null
  favoriteNote?: string | null
}

/**
 * Gestion des promotions et mises en avant.
 */
export interface SharedProductPromotion {
  promotionStartDate?: string | null
  promotionEndDate?: string | null
  promotionAutoRestore?: boolean
  featuredBadgeText?: string | null
  featuredStartDate?: string | null
  featuredEndDate?: string | null
}

/**
 * Relations avec d'autres produits.
 */
export interface SharedProductLinkedProducts {
  upsells?: string[]
  crossSells?: string[]
  groupedProducts?: string[]
  similarProducts?: string[]
}

/**
 * Média associé à un produit (image, vidéo, document, etc.).
 */
export interface SharedProductMedia {
  id?: string
  path: string
  type?: 'image' | 'video' | 'document'
  altText?: string | null
  metadata?: Record<string, unknown>
  isPrimary?: boolean
  position?: number
}

/**
 * Variation définie sur un produit variable.
 */
export interface SharedProductVariationInput {
  id?: string
  name?: string | null
  sku?: string | null
  price?: number | null
  salePrice?: number | null
  stockQuantity?: number | null
  attributes?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

/**
 * Fichier téléchargeable lié à un produit numérique.
 */
export interface SharedProductDownloadableFile {
  id?: string
  name: string
  url: string
  expirationDate?: string | null
  maxDownloadsPerCustomer?: number | null
  maxGlobalDownloads?: number | null
  sourceType?: 'url' | 'upload'
  uploadedFileName?: string | null
  uploadedFileSize?: number | null
  uploadedFileType?: string | null
  uploadedFileDataUrl?: string | null
  uploadedAt?: string | null
}

/**
 * Données communes utilisées pour créer ou mettre à jour un produit depuis les interfaces vendeur et super admin.
 */
export interface SharedProductInput {
  id?: string
  source?: ProductSource
  vendorId?: string | null

  // Informations de base
  name: string
  description?: string | null
  shortDescription?: string | null
  sku?: string | null
  warranty?: string | null
  returnPolicy?: string | null
  price: number
  salePrice?: number | null
  costPrice?: number | null
  originalPrice?: number | null

  // Catégorisation
  category?: string | null
  subcategory?: string | null
  categoryIds?: string[]
  tagIds?: string[]
  tags?: string[] | null
  brand?: string | null

  // Inventaire et statut
  stockQuantity?: number | null
  lowStockThreshold?: number | null
  manageStock?: boolean
  allowBackorders?: boolean
  productStatus?: ProductStatus
  stockStatus?: ProductStockStatus
  isActive?: boolean

  // Typologie produit
  productType?: ProductType
  isVirtual?: boolean
  isDownloadable?: boolean
  isFeatured?: boolean
  onSale?: boolean

  // Médias
  mainImage?: string | null
  galleryImages?: string[]
  media?: SharedProductMedia[]
  videos?: string[]

  // Variations et attributs
  attributes?: Record<string, unknown> | null
  variations?: SharedProductVariationInput[]

  // Téléchargements
  downloadable?: boolean
  downloadableFiles?: SharedProductDownloadableFile[]

  // Options externes
  external?: boolean
  externalUrl?: string | null
  externalButtonText?: string | null

  // Sections spécialisées
  shipping?: SharedProductShipping
  seo?: SharedProductSeo
  payment?: SharedProductPaymentOptions
  marketing?: SharedProductMarketing
  promotion?: SharedProductPromotion
  linkedProducts?: SharedProductLinkedProducts

  // Divers
  customFields?: Record<string, string>
  metadata?: Record<string, unknown>
}

/**
 * Représentation normalisée d'un produit lu depuis la base ou l'API, réinjectable dans les interfaces.
 */
export interface SharedProduct extends SharedProductInput {
  id: string
  createdAt?: string
  updatedAt?: string
  statistics?: Record<string, unknown>
}
