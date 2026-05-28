import type {
  SharedProduct,
  SharedProductInput,
  SharedProductMedia,
  SharedProductDownloadableFile,
  SharedProductVariationInput
} from '@/lib/types/shared-product'
import type { ProductStatus } from '@/lib/types/shared-product'
import type { ProductSource } from '@/lib/types/shared-product'

type SupabaseProductRecord = {
  id: string
  source?: string | null
  vendor_id?: string | null
  name: string
  description?: string | null
  short_description?: string | null
  sku?: string | null
  warranty?: string | null
  return_policy?: string | null
  price: number
  sale_price?: number | null
  cost_price?: number | null
  original_price?: number | null
  category?: string | null
  subcategory?: string | null
  tags?: string[] | null
  stock_quantity?: number | null
  low_stock_threshold?: number | null
  manage_stock?: boolean | null
  allow_backorders?: boolean | null
  product_status?: string | null
  is_active?: boolean | null
  is_virtual?: boolean | null
  is_downloadable?: boolean | null
  is_featured?: boolean | null
  on_sale?: boolean | null
  main_image?: string | null
  images?: string[] | null
  external_url?: string | null
  external_button_text?: string | null
  seo_title?: string | null
  seo_description?: string | null
  seo_slug?: string | null
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  shipping_class?: string | null
  free_shipping?: boolean | null
  shipping_cost?: number | null
  metadata?: Record<string, unknown> | null
  product_variations?: Array<Record<string, unknown>> | null
  product_media?: Array<Record<string, unknown>> | null
  product_statistics?: Array<Record<string, unknown>> | Record<string, unknown> | null
  product_category_assignments?: Array<Record<string, unknown>> | null
  product_tag_assignments?: Array<Record<string, unknown>> | null
  product_payment_settings?: Array<Record<string, unknown>> | Record<string, unknown> | null
  product_marketing_settings?: Array<Record<string, unknown>> | Record<string, unknown> | null
  product_promotion_settings?: Array<Record<string, unknown>> | Record<string, unknown> | null
  product_linked_products?: Array<Record<string, unknown>> | Record<string, unknown> | null
  product_downloadable_files?: Array<Record<string, unknown>> | null
  statistics?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
}

/**
 * Vérifie si une valeur est un objet de type Record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Convertit une valeur en tableau de chaînes (en filtrant les éléments non-string).
 */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

/**
 * Normalise la source d'un produit en respectant le type union `ProductSource`.
 */
function toProductSource(value: unknown, fallback: ProductSource = 'vendor'): ProductSource {
  return value === 'vendor' || value === 'admin' || value === 'super_admin' ? value : fallback
}

/**
 * Normalise une liste de fichiers téléchargeables depuis des métadonnées (runtime-safe).
 */
function toDownloadableFilesFromMetadata(value: unknown): SharedProductDownloadableFile[] {
  if (!Array.isArray(value)) return []

  return value
    .map((file: any) => {
      const sourceTypeRaw = file?.sourceType
      const sourceType = sourceTypeRaw === 'upload' || sourceTypeRaw === 'url' ? sourceTypeRaw : undefined

      const name = typeof file?.name === 'string' ? file.name : ''
      const url = typeof file?.url === 'string' ? file.url : ''

      const mapped: SharedProductDownloadableFile = {
        id: typeof file?.id === 'string' ? file.id : undefined,
        name,
        url,
        expirationDate: typeof file?.expirationDate === 'string' ? file.expirationDate : null,
        maxDownloadsPerCustomer: typeof file?.maxDownloadsPerCustomer === 'number' ? file.maxDownloadsPerCustomer : null,
        maxGlobalDownloads: typeof file?.maxGlobalDownloads === 'number' ? file.maxGlobalDownloads : null,
        sourceType,
        uploadedFileName: typeof file?.uploadedFileName === 'string' ? file.uploadedFileName : null,
        uploadedFileSize: typeof file?.uploadedFileSize === 'number' ? file.uploadedFileSize : null,
        uploadedFileType: typeof file?.uploadedFileType === 'string' ? file.uploadedFileType : null,
        uploadedFileDataUrl: typeof file?.uploadedFileDataUrl === 'string' ? file.uploadedFileDataUrl : null,
        uploadedAt: typeof file?.uploadedAt === 'string' ? file.uploadedAt : null
      }

      return mapped
    })
    .filter((file) => file.name.length > 0 && file.url.length > 0)
}

/**
 * Convertit une valeur en booléen avec fallback.
 */
function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * Convertit une valeur en chaîne ou null.
 */
function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/**
 * Convertit une valeur en type produit attendu.
 */
function toProductType(value: unknown): 'simple' | 'variable' | 'virtual' | 'downloadable' {
  return value === 'simple' || value === 'variable' || value === 'virtual' || value === 'downloadable'
    ? value
    : 'simple'
}

/**
 * Convertit une valeur en statut de stock attendu.
 */
function toStockStatus(value: unknown): 'instock' | 'outofstock' | 'onbackorder' {
  return value === 'instock' || value === 'outofstock' || value === 'onbackorder' ? value : 'instock'
}

/**
 * Transforme un enregistrement Supabase brut en structure partagée exploitable côté UI.
 */
export function mapSupabaseProductToSharedProduct(record: SupabaseProductRecord): SharedProduct {
  const metadata = isRecord(record.metadata) ? record.metadata : {}

  const categoryIdsFromAssignments = Array.isArray(record.product_category_assignments)
    ? record.product_category_assignments
        .map((item) => (typeof (item as any)?.category_id === 'string' ? String((item as any).category_id) : ''))
        .filter((id) => id.length > 0)
    : []

  const categoryNameFromAssignments = Array.isArray(record.product_category_assignments)
    ? (() => {
        const items = record.product_category_assignments as any[]
        const primary = items.find((item) => item?.is_primary === true) ?? items[0]
        const nested = primary?.product_categories
        const name = typeof nested?.name === 'string' ? nested.name : null
        return name && name.trim().length > 0 ? name : null
      })()
    : null

  const tagIdsFromAssignments = Array.isArray(record.product_tag_assignments)
    ? record.product_tag_assignments
        .map((item) => (typeof (item as any)?.tag_id === 'string' ? String((item as any).tag_id) : ''))
        .filter((id) => id.length > 0)
    : []

  const paymentRecord = Array.isArray(record.product_payment_settings)
    ? (record.product_payment_settings[0] as any)
    : isRecord(record.product_payment_settings)
      ? (record.product_payment_settings as any)
      : null

  const marketingRecord = Array.isArray(record.product_marketing_settings)
    ? (record.product_marketing_settings[0] as any)
    : isRecord(record.product_marketing_settings)
      ? (record.product_marketing_settings as any)
      : null

  const promotionRecord = Array.isArray(record.product_promotion_settings)
    ? (record.product_promotion_settings[0] as any)
    : isRecord(record.product_promotion_settings)
      ? (record.product_promotion_settings as any)
      : null

  const linkedRecord = Array.isArray(record.product_linked_products)
    ? (record.product_linked_products[0] as any)
    : isRecord(record.product_linked_products)
      ? (record.product_linked_products as any)
      : null

  const shipping = {
    weight: record.weight ?? null,
    length: record.length ?? null,
    width: record.width ?? null,
    height: record.height ?? null,
    shippingClass: record.shipping_class ?? null,
    freeShipping: toBoolean(record.free_shipping, false),
    shippingCost: record.shipping_cost ?? null
  }

  const seo = {
    title: record.seo_title ?? null,
    description: record.seo_description ?? null,
    keywords:
      typeof (record as any).seo_keywords === 'string' && (record as any).seo_keywords.trim().length > 0
        ? (record as any).seo_keywords
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0)
        : toStringArray(metadata.seoKeywords),
    slug: record.seo_slug ?? null,
    autoGenerate: toBoolean(metadata.seoAutoGenerate, false)
  }

  const marketing = {
    socialSharing:
      marketingRecord && typeof marketingRecord.social_sharing === 'boolean'
        ? marketingRecord.social_sharing
        : toBoolean(metadata.socialSharing, false),
    socialPoints:
      marketingRecord && typeof marketingRecord.social_points === 'number'
        ? marketingRecord.social_points
        : typeof metadata.socialPoints === 'number'
          ? metadata.socialPoints
          : null,
    referralBonus:
      marketingRecord && typeof marketingRecord.referral_bonus === 'number'
        ? marketingRecord.referral_bonus
        : typeof metadata.referralBonus === 'number'
          ? metadata.referralBonus
          : null,
    favoriteNote:
      marketingRecord && typeof marketingRecord.favorite_note === 'string'
        ? marketingRecord.favorite_note
        : toNullableString(metadata.favoriteNote)
  }

  const payment = {
    installmentPayment:
      paymentRecord && typeof paymentRecord.installment_payment === 'boolean'
        ? paymentRecord.installment_payment
        : toBoolean(metadata.installmentPayment, false),
    installmentOptions:
      paymentRecord && Array.isArray(paymentRecord.installment_options)
        ? paymentRecord.installment_options.filter((value: any): value is number => typeof value === 'number')
        : Array.isArray(metadata.installmentOptions)
          ? metadata.installmentOptions.filter((value): value is number => typeof value === 'number')
          : null,
    deferredPayment:
      paymentRecord && typeof paymentRecord.deferred_payment === 'boolean'
        ? paymentRecord.deferred_payment
        : toBoolean(metadata.deferredPayment, false),
    deferredPaymentFees:
      paymentRecord && isRecord(paymentRecord.deferred_payment_fees)
        ? paymentRecord.deferred_payment_fees
        : isRecord(metadata.deferredPaymentFees)
          ? metadata.deferredPaymentFees
          : null
  }

  const promotion = {
    promotionStartDate:
      promotionRecord && typeof promotionRecord.promotion_start_date === 'string'
        ? promotionRecord.promotion_start_date
        : toNullableString(metadata.promotionStartDate),
    promotionEndDate:
      promotionRecord && typeof promotionRecord.promotion_end_date === 'string'
        ? promotionRecord.promotion_end_date
        : toNullableString(metadata.promotionEndDate),
    promotionAutoRestore:
      promotionRecord && typeof promotionRecord.promotion_auto_restore === 'boolean'
        ? promotionRecord.promotion_auto_restore
        : toBoolean(metadata.promotionAutoRestore, false),
    featuredBadgeText:
      promotionRecord && typeof promotionRecord.featured_badge_text === 'string'
        ? promotionRecord.featured_badge_text
        : toNullableString(metadata.featuredBadgeText),
    featuredStartDate:
      promotionRecord && typeof promotionRecord.featured_start_date === 'string'
        ? promotionRecord.featured_start_date
        : toNullableString(metadata.featuredStartDate),
    featuredEndDate:
      promotionRecord && typeof promotionRecord.featured_end_date === 'string'
        ? promotionRecord.featured_end_date
        : toNullableString(metadata.featuredEndDate)
  }

  const linkedProducts = {
    upsells: linkedRecord ? toStringArray(linkedRecord.upsells) : toStringArray(metadata.upsells),
    crossSells: linkedRecord ? toStringArray(linkedRecord.cross_sells) : toStringArray(metadata.crossSells),
    groupedProducts: linkedRecord ? toStringArray(linkedRecord.grouped_products) : toStringArray(metadata.groupedProducts),
    similarProducts: linkedRecord ? toStringArray(linkedRecord.similar_products) : toStringArray(metadata.similarProducts)
  }

  const variations: SharedProductVariationInput[] = Array.isArray(record.product_variations)
    ? record.product_variations.map((variation) => ({
        id: typeof variation.id === 'string' ? variation.id : undefined,
        name: typeof variation.name === 'string' ? variation.name : null,
        sku: typeof variation.sku === 'string' ? variation.sku : null,
        price: typeof variation.price === 'number' ? variation.price : null,
        salePrice: typeof variation.sale_price === 'number' ? variation.sale_price : null,
        stockQuantity: typeof variation.stock_quantity === 'number' ? variation.stock_quantity : null,
        attributes: isRecord(variation.attributes) ? variation.attributes : null,
        metadata: isRecord(variation.metadata) ? variation.metadata : null
      }))
    : Array.isArray(metadata.variations)
      ? (metadata.variations as SharedProductVariationInput[])
      : []

  const media: SharedProductMedia[] = Array.isArray(record.product_media)
    ? record.product_media.map((item) => ({
        id: typeof item.id === 'string' ? item.id : undefined,
        path: typeof item.path === 'string' ? item.path : '',
        type:
          item.type === 'image' || item.type === 'video' || item.type === 'document'
            ? item.type
            : item.media_type === 'image' || item.media_type === 'video' || item.media_type === 'document'
              ? item.media_type
              : undefined,
        altText: typeof item.alt === 'string' ? item.alt : null,
        metadata: isRecord(item.metadata) ? item.metadata : undefined,
        isPrimary: item.position === 0
      }))
    : Array.isArray(record.images)
      ? record.images.map((path: string, index: number) => ({
          id: `${record.id}-image-${index}`,
          path,
          type: 'image' as const,
          isPrimary: index === 0
        }))
      : []

  const downloadableFiles: SharedProductDownloadableFile[] = Array.isArray(record.product_downloadable_files)
    ? record.product_downloadable_files
        .map((file: any) => ({
          id: typeof file.id === 'string' ? file.id : undefined,
          name: typeof file.name === 'string' ? file.name : '',
          url: typeof file.url === 'string' ? file.url : '',
          expirationDate: typeof file.expiration_date === 'string' ? file.expiration_date : null,
          maxDownloadsPerCustomer: typeof file.max_downloads_per_customer === 'number' ? file.max_downloads_per_customer : null,
          maxGlobalDownloads: typeof file.max_global_downloads === 'number' ? file.max_global_downloads : null,
          sourceType: file.source_type === 'upload' ? ('upload' as const) : ('url' as const),
          uploadedFileName: typeof file.uploaded_file_name === 'string' ? file.uploaded_file_name : null,
          uploadedFileSize: typeof file.uploaded_file_size === 'number' ? file.uploaded_file_size : null,
          uploadedFileType: typeof file.uploaded_file_type === 'string' ? file.uploaded_file_type : null,
          uploadedFileDataUrl: typeof file.uploaded_file_data_url === 'string' ? file.uploaded_file_data_url : null,
          uploadedAt: typeof file.uploaded_at === 'string' ? file.uploaded_at : null
        }))
        .filter((file) => file.name.length > 0 && file.url.length > 0)
    : toDownloadableFilesFromMetadata(metadata.downloadableFiles)

  const statsFromRelation = Array.isArray(record.product_statistics)
    ? (record.product_statistics[0] as any)
    : isRecord(record.product_statistics)
      ? (record.product_statistics as any)
      : null

  const statistics = (record.statistics ?? (statsFromRelation as any) ?? undefined) as Record<string, unknown> | undefined

  return {
    id: record.id,
    source: toProductSource(record.source ?? undefined, 'vendor'),
    vendorId: record.vendor_id ?? null,
    name: record.name,
    description: record.description ?? null,
    shortDescription: record.short_description ?? null,
    sku: record.sku ?? null,
    warranty: record.warranty ?? null,
    returnPolicy: record.return_policy ?? null,
    price: record.price,
    salePrice: record.sale_price ?? null,
    costPrice: record.cost_price ?? null,
    originalPrice: record.original_price ?? record.price ?? 0,
    category:
      typeof record.category === 'string' && record.category.trim().length > 0
        ? record.category
        : categoryNameFromAssignments,
    subcategory: record.subcategory ?? null,
    categoryIds: categoryIdsFromAssignments.length > 0 ? categoryIdsFromAssignments : toStringArray(metadata.categoryIds),
    tagIds: tagIdsFromAssignments.length > 0 ? tagIdsFromAssignments : toStringArray(metadata.tagIds),
    tags: record.tags ?? null,
    brand: toNullableString(metadata.brand),
    stockQuantity: record.stock_quantity ?? null,
    lowStockThreshold: record.low_stock_threshold ?? null,
    manageStock: record.manage_stock ?? false,
    allowBackorders: record.allow_backorders ?? false,
    productStatus: (record.product_status ?? 'draft') as ProductStatus,
    stockStatus: toStockStatus(metadata.stockStatus),
    isActive: record.is_active ?? false,
    productType: toProductType(metadata.productType),
    isVirtual: record.is_virtual ?? false,
    isDownloadable: record.is_downloadable ?? false,
    isFeatured: record.is_featured ?? false,
    onSale: record.on_sale ?? false,
    mainImage: record.main_image ?? null,
    galleryImages: record.images ?? [],
    media,
    videos: toStringArray(metadata.videos),
    attributes: isRecord(metadata.attributes) ? metadata.attributes : null,
    variations,
    downloadable: record.is_downloadable ?? toBoolean(metadata.downloadable, false),
    downloadableFiles,
    external: toBoolean(metadata.external, false),
    externalUrl: record.external_url ?? null,
    externalButtonText: record.external_button_text ?? null,
    shipping,
    seo,
    payment,
    marketing,
    promotion,
    linkedProducts,
    customFields: isRecord(metadata.customFields)
      ? Object.entries(metadata.customFields).reduce<Record<string, string>>((acc, [key, val]) => {
          if (typeof key === 'string' && typeof val === 'string') {
            acc[key] = val
          }
          return acc
        }, {})
      : {},
    metadata,
    createdAt: record.created_at ?? undefined,
    updatedAt: record.updated_at ?? undefined,
    statistics
  }
}

/**
 * Crée le payload Supabase « user_products » à partir de la structure partagée.
 */
export function mapSharedProductInputToSupabasePayload(input: SharedProductInput): Record<string, unknown> {
  const metadata = {
    ...(input.metadata ?? {}),
    seoKeywords: input.seo?.keywords ?? null,
    seoAutoGenerate: input.seo?.autoGenerate ?? false,
    brand: input.brand ?? null,
    productType: input.productType ?? input.metadata?.productType ?? 'simple',
    socialSharing: input.marketing?.socialSharing ?? false,
    socialPoints: input.marketing?.socialPoints ?? null,
    referralBonus: input.marketing?.referralBonus ?? null,
    favoriteNote: input.marketing?.favoriteNote ?? null,
    installmentPayment: input.payment?.installmentPayment ?? false,
    installmentOptions: input.payment?.installmentOptions ?? null,
    deferredPayment: input.payment?.deferredPayment ?? false,
    deferredPaymentFees: input.payment?.deferredPaymentFees ?? null,
    promotionStartDate: input.promotion?.promotionStartDate ?? null,
    promotionEndDate: input.promotion?.promotionEndDate ?? null,
    promotionAutoRestore: input.promotion?.promotionAutoRestore ?? false,
    featuredBadgeText: input.promotion?.featuredBadgeText ?? null,
    featuredStartDate: input.promotion?.featuredStartDate ?? null,
    featuredEndDate: input.promotion?.featuredEndDate ?? null,
    upsells: input.linkedProducts?.upsells ?? [],
    crossSells: input.linkedProducts?.crossSells ?? [],
    groupedProducts: input.linkedProducts?.groupedProducts ?? [],
    similarProducts: input.linkedProducts?.similarProducts ?? [],
    videos: input.videos ?? [],
    attributes: input.attributes ?? null,
    downloadable: input.downloadable ?? input.isDownloadable ?? false,
    downloadableFiles: input.downloadableFiles ?? [],
    external: input.external ?? false,
    stockStatus: input.stockStatus ?? 'instock',
    categoryIds: input.categoryIds ?? [],
    tagIds: input.tagIds ?? [],
    customFields: input.customFields ?? {}
  }

  return {
    id: input.id,
    source: input.source ?? (input.vendorId ? 'vendor' : 'super_admin'),
    vendor_id: input.vendorId ?? null,
    name: input.name,
    description: input.description ?? null,
    short_description: input.shortDescription ?? null,
    sku: input.sku ?? null,
    warranty: input.warranty ?? null,
    return_policy: input.returnPolicy ?? null,
    price: input.price,
    sale_price: input.salePrice ?? null,
    cost_price: input.costPrice ?? null,
    original_price: input.originalPrice ?? input.price,
    category: input.category ?? null,
    subcategory: input.subcategory ?? null,
    tags: input.tags ?? null,
    stock_quantity: input.stockQuantity ?? null,
    low_stock_threshold: input.lowStockThreshold ?? null,
    manage_stock: input.manageStock ?? false,
    allow_backorders: input.allowBackorders ?? false,
    product_status: input.productStatus ?? 'draft',
    is_active: input.isActive ?? input.productStatus === 'active',
    is_virtual: input.isVirtual ?? false,
    is_downloadable: input.isDownloadable ?? input.downloadable ?? false,
    is_featured: input.isFeatured ?? false,
    on_sale: input.onSale ?? false,
    main_image: input.mainImage ?? input.media?.find((item) => item.isPrimary)?.path ?? null,
    images:
      input.galleryImages && input.galleryImages.length > 0
        ? input.galleryImages
        : input.media?.map((item) => item.path) ?? (input.mainImage ? [input.mainImage] : []),
    external_url: input.externalUrl ?? null,
    external_button_text: input.externalButtonText ?? null,
    weight: input.shipping?.weight ?? null,
    length: input.shipping?.length ?? null,
    width: input.shipping?.width ?? null,
    height: input.shipping?.height ?? null,
    shipping_class: input.shipping?.shippingClass ?? null,
    free_shipping: input.shipping?.freeShipping ?? false,
    shipping_cost: input.shipping?.shippingCost ?? null,
    seo_title: input.seo?.title ?? null,
    seo_description: input.seo?.description ?? null,
    seo_slug: input.seo?.slug ?? null,
    metadata
  }
}

/**
 * Prépare la liste des variations à insérer ou mettre à jour dans Supabase.
 */
export function mapVariationsToSupabasePayload(variations?: SharedProductVariationInput[]) {
  if (!Array.isArray(variations)) {
    return []
  }

  return variations.map((variation) => ({
    id: variation.id,
    name: variation.name ?? null,
    sku: variation.sku ?? null,
    price: variation.price ?? null,
    sale_price: variation.salePrice ?? null,
    stock_quantity: variation.stockQuantity ?? null,
    attributes: variation.attributes ?? null,
    metadata: variation.metadata ?? null
  }))
}

/**
 * Transforme la collection de médias partagés vers un format exploitable pour `product_media`.
 */
export function mapMediaToSupabasePayload(media?: SharedProductMedia[], productId?: string) {
  if (!Array.isArray(media)) {
    return []
  }

  return media.map((item) => ({
    id: item.id,
    product_id: productId,
    path: item.path,
    type: item.type ?? 'image',
    alt: item.altText ?? null,
    metadata: item.metadata ?? null,
    position: item.isPrimary ? 0 : (item.position ?? 999)
  }))
}

/**
 * Extrait les fichiers téléchargeables pour un stockage éventuel dédié.
 */
export function mapDownloadablesToSupabasePayload(files?: SharedProductDownloadableFile[], productId?: string) {
  if (!Array.isArray(files)) {
    return []
  }

  return files.map((file) => ({
    id: file.id,
    product_id: productId,
    name: file.name,
    url: file.url,
    expiration_date: file.expirationDate ?? null,
    max_downloads_per_customer: file.maxDownloadsPerCustomer ?? null,
    max_global_downloads: file.maxGlobalDownloads ?? null,
    source_type: file.sourceType ?? 'url',
    uploaded_file_name: file.uploadedFileName ?? null,
    uploaded_file_size: file.uploadedFileSize ?? null,
    uploaded_file_type: file.uploadedFileType ?? null,
    uploaded_file_data_url: file.uploadedFileDataUrl ?? null,
    uploaded_at: file.uploadedAt ?? null
  }))
}
