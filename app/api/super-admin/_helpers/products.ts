import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'
import type { Database } from '@/lib/supabase'
import type { SharedProductInput } from '@/lib/types/shared-product'
import {
  mapDownloadablesToSupabasePayload,
  mapMediaToSupabasePayload,
  mapSharedProductInputToSupabasePayload,
  mapSupabaseProductToSharedProduct,
  mapVariationsToSupabasePayload
} from '@/lib/utils/product-transformers'

export const productStatusSchema = z.enum([
  'draft',
  'pending_review',
  'active',
  'inactive',
  'archived',
  'rejected'
])

export const productSourceSchema = z.enum(['vendor', 'admin', 'super_admin'])

const mediaSchema = z.object({
  path: z.string(),
  type: z.string().min(3),
  alt: z.string().nullable().optional(),
  position: z.number().int().min(0).optional(),
  metadata: z.union([z.record(z.any()), z.undefined()]).optional(),
  isPrimary: z.boolean().optional(),
  is_gallery: z.boolean().optional(),
  is_featured: z.boolean().optional()
})

const variationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0).optional(),
  salePrice: z.number().min(0).nullable().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  attributes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  position: z.number().int().min(0).optional()
})

const baseFields = {
  name: z.string().min(2),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  warranty: z.string().nullable().optional(),
  returnPolicy: z.string().nullable().optional(),
  barcode: z.string().optional(),
  price: z.number().min(0),
  salePrice: z.number().min(0).nullable().optional(),
  costPrice: z.number().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  manageStock: z.boolean().optional(),
  allowBackorders: z.boolean().optional(),
  productStatus: productStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
  isBundle: z.boolean().optional(),
  isVirtual: z.boolean().optional(),
  isDownloadable: z.boolean().optional(),
  weight: z.number().nullable().optional(),
  length: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  shippingClass: z.string().nullable().optional(),
  shippingCost: z.number().nullable().optional(),
  freeShipping: z.boolean().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  seoKeywords: z.string().nullable().optional(),
  seoSlug: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  vendorId: z.string().uuid().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional()
}

export const createProductSchema = z.object({
  source: productSourceSchema.optional(),
  ...baseFields,
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  media: z.array(mediaSchema).optional(),
  variations: z.array(variationSchema).optional()
})

export const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid()
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type SupabaseServerClient = SupabaseClient<any, any, any>

function buildSharedMetadata(shared: SharedProductInput) {
  const metadataPayload = mapSharedProductInputToSupabasePayload(shared).metadata ?? {}

  return metadataPayload
}

function normalizeDateTimeValue(value?: string | null) {
  if (value === null) {
    return null
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return undefined
}

/**
 * Normalise les médias depuis la structure SharedProduct (UI) vers le schéma d'API (mediaSchema).
 */
function normalizeMediaFromShared(shared: SharedProductInput) {
  return shared.media?.map((item, index) => ({
    id: item.id,
    path: item.path,
    type: item.type ?? 'image',
    alt: (item as any).altText ?? (item as any).alt ?? null,
    position: typeof item.metadata?.position === 'number' ? item.metadata.position : index,
    metadata: item.metadata ?? undefined,
    isPrimary: item.isPrimary ?? index === 0,
    is_gallery:
      typeof item.metadata?.isGallery === 'boolean'
        ? item.metadata.isGallery
        : item.isPrimary
          ? false
          : index > 0,
    is_featured:
      typeof item.metadata?.isFeatured === 'boolean'
        ? item.metadata.isFeatured
        : item.isPrimary ?? index === 0
  }))
}

function sanitizeVariationId(id?: string) {
  if (!id) return undefined

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return UUID_REGEX.test(id) ? id : undefined
}

export function mapSharedProductInputToCreateInput(shared: SharedProductInput): CreateProductInput {
  const metadataPayload = buildSharedMetadata(shared)

  return {
    source: shared.source ?? (shared.vendorId ? 'vendor' : 'super_admin'),
    name: shared.name,
    description: shared.description ?? undefined,
    shortDescription: shared.shortDescription ?? undefined,
    sku: shared.sku ?? undefined,
    warranty: shared.warranty ?? null,
    returnPolicy: shared.returnPolicy ?? null,
    barcode: undefined,
    price: shared.price,
    salePrice: shared.salePrice ?? undefined,
    costPrice: shared.costPrice ?? undefined,
    currency: undefined,
    stockQuantity: shared.stockQuantity ?? undefined,
    lowStockThreshold: shared.lowStockThreshold ?? undefined,
    manageStock: shared.manageStock ?? undefined,
    allowBackorders: shared.allowBackorders ?? undefined,
    productStatus: shared.productStatus ?? (shared.isActive ? 'active' : undefined),
    isFeatured: shared.isFeatured ?? undefined,
    isBundle: undefined,
    isVirtual: shared.isVirtual ?? undefined,
    isDownloadable: shared.isDownloadable ?? shared.downloadable ?? undefined,
    weight: shared.shipping?.weight ?? undefined,
    length: shared.shipping?.length ?? undefined,
    width: shared.shipping?.width ?? undefined,
    height: shared.shipping?.height ?? undefined,
    shippingClass: shared.shipping?.shippingClass ?? undefined,
    shippingCost: shared.shipping?.shippingCost ?? undefined,
    freeShipping: shared.shipping?.freeShipping ?? undefined,
    seoTitle: shared.seo?.title ?? undefined,
    seoDescription: shared.seo?.description ?? undefined,
    seoKeywords: Array.isArray(shared.seo?.keywords) ? shared.seo?.keywords?.join(',') ?? undefined : undefined,
    seoSlug: shared.seo?.slug ?? undefined,
    tags: shared.tags ?? undefined,
    attributes: shared.attributes ?? undefined,
    metadata: metadataPayload,
    vendorId: shared.vendorId ?? null,
    publishedAt: normalizeDateTimeValue(shared.promotion?.promotionStartDate),
    archivedAt: normalizeDateTimeValue(shared.promotion?.promotionEndDate),
    categoryIds: shared.categoryIds ?? [],
    tagIds: shared.tagIds ?? [],
    media: normalizeMediaFromShared(shared),
    variations: shared.variations?.map((variation, index) => ({
      id: sanitizeVariationId(variation.id),
      name: variation.name ?? undefined,
      sku: variation.sku ?? undefined,
      price: variation.price ?? undefined,
      salePrice: variation.salePrice ?? undefined,
      stockQuantity: variation.stockQuantity ?? undefined,
      attributes: variation.attributes ?? undefined,
      metadata: variation.metadata ?? undefined,
      position: index
    }))
  }
}

export function mapSharedProductInputToUpdateInput(shared: SharedProductInput & { id: string }): UpdateProductInput {
  const createPayload = mapSharedProductInputToCreateInput(shared)

  return {
    id: shared.id,
    ...createPayload
  }
}

/**
 * Construit la clause select avec les relations complètes d'un produit.
 */
export function buildProductSelect() {
  return `*,
    product_media(*),
    product_statistics(*),
    product_variations(*),
    product_payment_settings(*),
    product_marketing_settings(*),
    product_promotion_settings(*),
    product_linked_products(*),
    product_downloadable_files(*),
    product_category_assignments(
      category_id,
      is_primary,
      product_categories(id, name, slug)
    ),
    product_tag_assignments(
      tag_id,
      product_tags(id, name, slug)
    )`
}

/**
 * Extrait une valeur booleenne depuis un metadata (fallback).
 */
function readMetadataBoolean(metadata: Record<string, unknown> | undefined, key: string, fallback = false) {
  const value = metadata?.[key]
  return typeof value === 'boolean' ? value : fallback
}

/**
 * Extrait une liste d'entiers depuis un metadata (fallback).
 */
function readMetadataNumberArray(metadata: Record<string, unknown> | undefined, key: string): number[] | null {
  const value = metadata?.[key]
  if (!Array.isArray(value)) return null
  const parsed = value.map((item) => (typeof item === 'number' ? item : Number(item))).filter((num) => Number.isFinite(num))
  return parsed.length ? parsed : []
}

/**
 * Extrait une liste d'UUID depuis un metadata (fallback).
 */
function readMetadataUuidArray(metadata: Record<string, unknown> | undefined, key: string): string[] {
  const value = metadata?.[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

/**
 * Persiste les parametres de paiement avances dans une table dediee.
 */
async function upsertPaymentSettings(client: SupabaseServerClient, productId: string, metadata?: Record<string, unknown> | null) {
  const meta = (metadata ?? {}) as Record<string, unknown>

  const installmentPayment = readMetadataBoolean(meta, 'installmentPayment', false)
  const installmentOptions = readMetadataNumberArray(meta, 'installmentOptions')
  const deferredPayment = readMetadataBoolean(meta, 'deferredPayment', false)
  const deferredPaymentFees = typeof meta.deferredPaymentFees === 'object' && meta.deferredPaymentFees !== null ? meta.deferredPaymentFees : null

  const { error } = await client.from('product_payment_settings').upsert(
    {
      product_id: productId,
      installment_payment: installmentPayment,
      installment_options: installmentOptions,
      deferred_payment: deferredPayment,
      deferred_payment_fees: deferredPaymentFees
    },
    { onConflict: 'product_id' }
  )

  if (error) {
    throw error
  }
}

/**
 * Persiste les parametres marketing/social dans une table dediee.
 */
async function upsertMarketingSettings(client: SupabaseServerClient, productId: string, metadata?: Record<string, unknown> | null) {
  const meta = (metadata ?? {}) as Record<string, unknown>

  const socialSharing = readMetadataBoolean(meta, 'socialSharing', false)
  const socialPoints = typeof meta.socialPoints === 'number' ? meta.socialPoints : meta.socialPoints != null ? Number(meta.socialPoints) : null
  const referralBonus = typeof meta.referralBonus === 'number' ? meta.referralBonus : meta.referralBonus != null ? Number(meta.referralBonus) : null
  const favoriteNote = typeof meta.favoriteNote === 'string' ? meta.favoriteNote : null

  const { error } = await client.from('product_marketing_settings').upsert(
    {
      product_id: productId,
      social_sharing: socialSharing,
      social_points: Number.isFinite(socialPoints as any) ? socialPoints : null,
      referral_bonus: Number.isFinite(referralBonus as any) ? referralBonus : null,
      favorite_note: favoriteNote
    },
    { onConflict: 'product_id' }
  )

  if (error) {
    throw error
  }
}

/**
 * Persiste les parametres de promotions/mise en avant dans une table dediee.
 */
async function upsertPromotionSettings(
  client: SupabaseServerClient,
  productId: string,
  payload: CreateProductInput,
  metadata?: Record<string, unknown> | null
) {
  const meta = (metadata ?? {}) as Record<string, unknown>

  const featuredStartDate =
    typeof meta.featuredStartDate === 'string' ? normalizeDateTimeValue(meta.featuredStartDate) ?? null : null
  const featuredEndDate =
    typeof meta.featuredEndDate === 'string' ? normalizeDateTimeValue(meta.featuredEndDate) ?? null : null

  const { error } = await client.from('product_promotion_settings').upsert(
    {
      product_id: productId,
      promotion_start_date: payload.publishedAt ?? null,
      promotion_end_date: payload.archivedAt ?? null,
      promotion_auto_restore: readMetadataBoolean(meta, 'promotionAutoRestore', false),
      featured_badge_text: typeof meta.featuredBadgeText === 'string' ? meta.featuredBadgeText : null,
      featured_start_date: featuredStartDate,
      featured_end_date: featuredEndDate
    },
    { onConflict: 'product_id' }
  )

  if (error) {
    throw error
  }
}

/**
 * Persiste les produits lies (upsells, cross-sells, etc.) dans une table dediee.
 */
async function upsertLinkedProducts(client: SupabaseServerClient, productId: string, metadata?: Record<string, unknown> | null) {
  const meta = (metadata ?? {}) as Record<string, unknown>

  const { error } = await client.from('product_linked_products').upsert(
    {
      product_id: productId,
      upsells: readMetadataUuidArray(meta, 'upsells'),
      cross_sells: readMetadataUuidArray(meta, 'crossSells'),
      grouped_products: readMetadataUuidArray(meta, 'groupedProducts'),
      similar_products: readMetadataUuidArray(meta, 'similarProducts')
    },
    { onConflict: 'product_id' }
  )

  if (error) {
    throw error
  }
}

/**
 * Persiste les fichiers telechargeables d'un produit.
 */
async function upsertDownloadableFiles(client: SupabaseServerClient, productId: string, metadata?: Record<string, unknown> | null) {
  const meta = (metadata ?? {}) as Record<string, unknown>
  const filesPayload = mapDownloadablesToSupabasePayload((meta.downloadableFiles as any) ?? [], productId)

  const { error: deleteError } = await client
    .from('product_downloadable_files')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw deleteError
  }

  if (filesPayload.length === 0) {
    return
  }

  const { error: insertError } = await client.from('product_downloadable_files').insert(filesPayload)
  if (insertError) {
    throw insertError
  }
}

async function upsertCategoryAssignments(client: SupabaseServerClient, productId: string, categoryIds?: string[]) {
  if (!categoryIds) return

  const { error: deleteError } = await client
    .from('product_category_assignments')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw deleteError
  }

  if (categoryIds.length === 0) return

  const payload = categoryIds.map((categoryId, index) => ({
    product_id: productId,
    category_id: categoryId,
    is_primary: index === 0
  }))

  const { error: insertError } = await client
    .from('product_category_assignments')
    .insert(payload)

  if (insertError) {
    throw insertError
  }
}

async function upsertTagAssignments(client: SupabaseServerClient, productId: string, tagIds?: string[]) {
  if (!tagIds) return

  const { error: deleteError } = await client
    .from('product_tag_assignments')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw deleteError
  }

  if (tagIds.length === 0) return

  const payload = tagIds.map((tagId) => ({
    product_id: productId,
    tag_id: tagId
  }))

  const { error: insertError } = await client
    .from('product_tag_assignments')
    .insert(payload)

  if (insertError) {
    throw insertError
  }
}

async function upsertMedia(client: SupabaseServerClient, productId: string, media?: CreateProductInput['media']) {
  console.log('🔍 upsertMedia appelé avec productId:', productId, 'media count:', media?.length || 0)
  
  if (!media) {
    console.log('ℹ️ upsertMedia: pas de média à traiter')
    return
  }

  console.log('🗑️ Suppression des médias existants pour productId:', productId)
  const { error: deleteError } = await client
    .from('product_media')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    console.error('❌ Erreur suppression médias:', deleteError)
    throw deleteError
  }

  if (media.length === 0) {
    console.log('ℹ️ upsertMedia: tableau média vide, fin du traitement')
    return
  }

  console.log('📝 Création payload pour', media.length, 'médias')
  const payload = media.map((item, index) => {
    console.log(`📷 Média ${index}:`, { path: item.path, type: item.type, alt: item.alt, position: item.position })
    return {
      product_id: productId,
      path: item.path,
      type: item.type ?? 'image',
      alt: item.alt ?? null,
      position: item.position ?? index,
      metadata: item.metadata ?? null
    }
  })

  console.log('💾 Insertion des médias en base...')
  const { error: insertError } = await client
    .from('product_media')
    .insert(payload)

  if (insertError) {
    const insertMessage = typeof (insertError as any)?.message === 'string' ? ((insertError as any).message as string) : ''
    const shouldRetryWithMediaType =
      insertMessage.includes("Could not find the 'type' column") ||
      insertMessage.toLowerCase().includes('column') && insertMessage.toLowerCase().includes('type')

    if (!shouldRetryWithMediaType) {
      console.error('❌ Erreur insertion médias:', insertError)
      throw insertError
    }

    console.warn("⚠️ Insertion médias: colonne 'type' absente, retry avec 'media_type'...")

    const fallbackPayload = media.map((item, index) => ({
      product_id: productId,
      path: item.path,
      media_type: item.type ?? 'image',
      alt: item.alt ?? null,
      position: item.position ?? index,
      metadata: item.metadata ?? null
    }))

    const { error: fallbackError } = await client
      .from('product_media')
      .insert(fallbackPayload)

    if (fallbackError) {
      console.error('❌ Erreur insertion médias (fallback media_type):', fallbackError)
      throw fallbackError
    }
  }

  console.log('✅ Médias insérés avec succès')
}

async function upsertVariations(client: SupabaseServerClient, productId: string, variations?: CreateProductInput['variations']) {
  if (!variations) return

  const { error: deleteError } = await client
    .from('product_variations')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw deleteError
  }

  if (variations.length === 0) return

  const payload = variations.map((variation) => ({
    product_id: productId,
    name: variation.name ?? null,
    sku: variation.sku ?? null,
    price: variation.price ?? null,
    sale_price: variation.salePrice ?? null,
    stock_quantity: variation.stockQuantity ?? null,
    attributes: variation.attributes ?? null,
    metadata: variation.metadata ?? null
  }))

  const { error: insertError } = await client
    .from('product_variations')
    .insert(payload)

  if (insertError) {
    throw insertError
  }
}

async function ensureProductStatistics(client: SupabaseServerClient, productId: string) {
  const { error } = await client
    .from('product_statistics')
    .insert({
      product_id: productId,
      total_views: 0,
      total_sales: 0,
      total_revenue: 0,
      average_rating: 0,
      review_count: 0,
      share_count: 0,
      wishlist_count: 0
    })
    .select('product_id')
    .single()

  if (error && error.code !== '23505') {
    throw error
  }
}

/**
 * Normalise l'identifiant vendeur.
 * Certains écrans peuvent manipuler user_profiles.id au lieu de users.id.
 * On convertit donc vers users.id pour que vendor_id reste cohérent partout.
 */
async function resolveVendorUserId(client: SupabaseServerClient, vendorId?: string | null): Promise<string | null> {
  if (!vendorId) {
    return null
  }

  // Si vendorId correspond à un profil, récupérer son user_id.
  const { data: profile, error } = await client
    .from('user_profiles')
    .select('user_id')
    .eq('id', vendorId)
    .maybeSingle()

  if (error) {
    // Best-effort: on ne bloque pas la création du produit si la table n'est pas accessible.
    return vendorId
  }

  const userId = (profile as any)?.user_id
  return typeof userId === 'string' && userId.length > 0 ? userId : vendorId
}

/**
 * Crée ou met à jour le produit principal et synchronise toutes les relations associées.
 */
export async function upsertFullProduct(
  client: SupabaseServerClient,
  payload: CreateProductInput,
  userId: string,
  existingId?: string
) {
  const resolvedVendorId = await resolveVendorUserId(client, payload.vendorId ?? null)

  const mediaPaths = Array.isArray(payload.media)
    ? payload.media
        .map((item) => item.path)
        .filter((path): path is string => typeof path === 'string' && path.length > 0)
    : []

  const primaryMediaPath = Array.isArray(payload.media)
    ? payload.media.find((item) => item.isPrimary)?.path ?? mediaPaths[0] ?? null
    : null

  const isUpdate = Boolean(existingId)

  const baseRecord = {
    name: payload.name,
    description: payload.description ?? null,
    short_description: payload.shortDescription ?? null,
    sku: payload.sku ?? null,
    warranty: isUpdate ? (payload.warranty ?? undefined) : (payload.warranty ?? null),
    return_policy: isUpdate ? (payload.returnPolicy ?? undefined) : (payload.returnPolicy ?? null),
    barcode: payload.barcode ?? null,
    price: payload.price,
    sale_price: payload.salePrice ?? null,
    cost_price: payload.costPrice ?? null,
    currency: isUpdate ? (payload.currency ?? undefined) : (payload.currency ?? 'XOF'),
    stock_quantity: isUpdate ? (payload.stockQuantity ?? undefined) : (payload.stockQuantity ?? 0),
    low_stock_threshold: isUpdate ? (payload.lowStockThreshold ?? undefined) : (payload.lowStockThreshold ?? 5),
    manage_stock: isUpdate ? (payload.manageStock ?? undefined) : (payload.manageStock ?? true),
    allow_backorders: isUpdate ? (payload.allowBackorders ?? undefined) : (payload.allowBackorders ?? false),
    product_status: isUpdate ? (payload.productStatus ?? undefined) : (payload.productStatus ?? 'draft'),
    is_featured: isUpdate ? (payload.isFeatured ?? undefined) : (payload.isFeatured ?? false),
    is_bundle: payload.isBundle ?? false,
    is_virtual: payload.isVirtual ?? false,
    is_downloadable: payload.isDownloadable ?? false,
    weight: payload.weight ?? null,
    length: payload.length ?? null,
    width: payload.width ?? null,
    height: payload.height ?? null,
    shipping_class: payload.shippingClass ?? null,
    shipping_cost: payload.shippingCost ?? null,
    free_shipping: payload.freeShipping ?? false,
    seo_title: payload.seoTitle ?? null,
    seo_description: payload.seoDescription ?? null,
    seo_keywords: payload.seoKeywords ?? null,
    seo_slug: payload.seoSlug ?? null,
    tags: payload.tags ?? null,
    attributes: payload.attributes ?? null,
    metadata: payload.metadata ?? null,
    main_image: primaryMediaPath,
    images: mediaPaths.length > 0 ? mediaPaths : null,
    vendor_id: resolvedVendorId,
    published_at: payload.publishedAt ?? null,
    archived_at: payload.archivedAt ?? null,
    source: payload.source ?? (resolvedVendorId ? 'vendor' : 'super_admin'),
    updated_by: userId,
    ...(existingId ? {} : { created_by: userId })
  }

  const recordForWrite = existingId
    ? (Object.fromEntries(Object.entries(baseRecord).filter(([, value]) => value !== undefined)) as typeof baseRecord)
    : baseRecord

  let upsertResult
  if (existingId) {
    upsertResult = await client
      .from('user_products')
      .update(recordForWrite)
      .eq('id', existingId)
      .select('id')
      .single()
  } else {
    upsertResult = await client
      .from('user_products')
      .insert(recordForWrite)
      .select('id')
      .single()
  }

  if (upsertResult.error || !upsertResult.data) {
    throw upsertResult.error ?? new Error('Insertion produit échouée.')
  }

  const productId = existingId ?? upsertResult.data.id

  await upsertCategoryAssignments(client, productId, payload.categoryIds)
  await upsertTagAssignments(client, productId, payload.tagIds)
  await upsertMedia(client, productId, payload.media)
  await upsertVariations(client, productId, payload.variations)

  await upsertPaymentSettings(client, productId, payload.metadata ?? null)
  await upsertMarketingSettings(client, productId, payload.metadata ?? null)
  await upsertPromotionSettings(client, productId, payload, payload.metadata ?? null)
  await upsertLinkedProducts(client, productId, payload.metadata ?? null)
  await upsertDownloadableFiles(client, productId, payload.metadata ?? null)

  if (!existingId) {
    await ensureProductStatistics(client, productId)
  }

  const { data: fullProduct, error: fetchError } = await client
    .from('user_products')
    .select(buildProductSelect())
    .eq('id', productId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  return fullProduct
}

/**
 * Récupère un produit complet (avec relations) par identifiant.
 */
export async function fetchFullProduct(client: SupabaseServerClient, productId: string) {
  const { data, error } = await client
    .from('user_products')
    .select(buildProductSelect())
    .eq('id', productId)
    .single()

  if (error) {
    throw error
  }

  return data
}

function mapRecordToCreateInput(record: any): CreateProductInput {
  return {
    source: record.source ?? undefined,
    name: record.name,
    description: record.description ?? undefined,
    shortDescription: record.short_description ?? undefined,
    sku: record.sku ?? undefined,
    warranty: record.warranty ?? undefined,
    returnPolicy: record.return_policy ?? undefined,
    barcode: record.barcode ?? undefined,
    price: Number(record.price ?? 0),
    salePrice: record.sale_price ?? undefined,
    costPrice: record.cost_price ?? undefined,
    currency: record.currency ?? undefined,
    stockQuantity: record.stock_quantity ?? undefined,
    lowStockThreshold: record.low_stock_threshold ?? undefined,
    manageStock: record.manage_stock ?? undefined,
    allowBackorders: record.allow_backorders ?? undefined,
    productStatus: record.product_status ?? undefined,
    isFeatured: record.is_featured ?? undefined,
    isBundle: record.is_bundle ?? undefined,
    isVirtual: record.is_virtual ?? undefined,
    isDownloadable: record.is_downloadable ?? undefined,
    weight: record.weight ?? undefined,
    length: record.length ?? undefined,
    width: record.width ?? undefined,
    height: record.height ?? undefined,
    shippingClass: record.shipping_class ?? undefined,
    shippingCost: record.shipping_cost ?? undefined,
    freeShipping: record.free_shipping ?? undefined,
    seoTitle: record.seo_title ?? undefined,
    seoDescription: record.seo_description ?? undefined,
    seoKeywords: record.seo_keywords ?? undefined,
    seoSlug: record.seo_slug ?? undefined,
    tags: record.tags ?? undefined,
    attributes: record.attributes ?? undefined,
    metadata: record.metadata ?? undefined,
    vendorId: record.vendor_id ?? undefined,
    publishedAt: record.published_at ?? undefined,
    archivedAt: record.archived_at ?? undefined,
    categoryIds: (record.product_category_assignments ?? [])
      .map((item: any) => item.category_id)
      .filter(Boolean),
    tagIds: (record.product_tag_assignments ?? [])
      .map((item: any) => item.tag_id)
      .filter(Boolean),
    media: (record.product_media ?? []).map((media: any) => ({
      path: media.path,
      type: media.type ?? media.media_type ?? undefined,
      alt: media.alt ?? undefined,
      position: media.position ?? undefined,
      metadata: media.metadata ?? undefined,
      isPrimary: media.position === 0
    })),
    variations: (record.product_variations ?? []).map((variation: any) => ({
      name: variation.name ?? undefined,
      sku: variation.sku ?? undefined,
      price: variation.price ?? undefined,
      salePrice: variation.sale_price ?? undefined,
      stockQuantity: variation.stock_quantity ?? undefined,
      attributes: variation.attributes ?? undefined,
      metadata: variation.metadata ?? undefined
    }))
  }
}

export type DuplicateProductOverrides = Partial<Omit<CreateProductInput, 'media' | 'variations' | 'categoryIds' | 'tagIds'>> & {
  media?: CreateProductInput['media']
  variations?: CreateProductInput['variations']
  categoryIds?: string[]
  tagIds?: string[]
}

/**
 * Duplique un produit complet et retourne la nouvelle ressource.
 */
export async function duplicateProduct(
  client: SupabaseServerClient,
  productId: string,
  userId: string,
  overrides: DuplicateProductOverrides = {}
) {
  const record = await fetchFullProduct(client, productId)
  const basePayload = mapRecordToCreateInput(record)

  const duplicatedPayload: CreateProductInput = {
    ...basePayload,
    ...overrides,
    name: overrides.name ?? `${basePayload.name ?? 'Produit'} (Copie)`,
    sku: overrides.sku ?? undefined,
    productStatus: overrides.productStatus ?? 'draft',
    publishedAt: overrides.publishedAt ?? null,
    media: overrides.media ?? basePayload.media,
    variations: overrides.variations ?? basePayload.variations,
    categoryIds: overrides.categoryIds ?? basePayload.categoryIds,
    tagIds: overrides.tagIds ?? basePayload.tagIds
  }

  return upsertFullProduct(client, duplicatedPayload, userId)
}

export type ProductBulkAction = 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete'

export interface ProductBulkActionPayload {
  action: ProductBulkAction
  productIds: string[]
  userId: string
}

/**
 * Applique une action de masse sur une sélection de produits et retourne le nombre impacté.
 */
export async function bulkUpdateProducts(
  client: SupabaseServerClient,
  payload: ProductBulkActionPayload
) {
  if (!payload.productIds.length) {
    throw new Error('Aucun produit fourni pour l\'action de masse.')
  }

  const ids = payload.productIds

  switch (payload.action) {
    case 'activate': {
      const { data, error } = await client
        .from('user_products')
        .update({ product_status: 'active', updated_by: payload.userId })
        .in('id', ids)
        .select('id')
      if (error) throw error
      return { affected: data?.length ?? 0 }
    }
    case 'deactivate': {
      const { data, error } = await client
        .from('user_products')
        .update({ product_status: 'inactive', updated_by: payload.userId })
        .in('id', ids)
        .select('id')
      if (error) throw error
      return { affected: data?.length ?? 0 }
    }
    case 'feature': {
      const { data, error } = await client
        .from('user_products')
        .update({ is_featured: true, updated_by: payload.userId })
        .in('id', ids)
        .select('id')
      if (error) throw error
      return { affected: data?.length ?? 0 }
    }
    case 'unfeature': {
      const { data, error } = await client
        .from('user_products')
        .update({ is_featured: false, updated_by: payload.userId })
        .in('id', ids)
        .select('id')
      if (error) throw error
      return { affected: data?.length ?? 0 }
    }
    case 'delete': {
      const { data, error } = await client
        .from('user_products')
        .delete()
        .in('id', ids)
        .select('id')
      if (error) throw error
      return { affected: data?.length ?? 0 }
    }
    default:
      throw new Error(`Action ${payload.action} non supportée.`)
  }
}

export interface ReportProductInput {
  productId: string
  reason?: string
  moderatorId: string
  status?: z.infer<typeof productStatusSchema>
  metadata?: Record<string, any>
}

/**
 * Signale un produit, met à jour son statut et journalise l'action de modération.
 */
export async function reportProduct(
  client: SupabaseServerClient,
  { productId, reason, moderatorId, status = 'pending_review', metadata }: ReportProductInput
) {
  const { data: existing, error: fetchError } = await client
    .from('user_products')
    .select('id, product_status')
    .eq('id', productId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  const { error: updateError } = await client
    .from('user_products')
    .update({ product_status: status, updated_by: moderatorId })
    .eq('id', productId)

  if (updateError) {
    throw updateError
  }

  const { error: logError } = await client
    .from('product_moderation_logs')
    .insert({
      product_id: productId,
      action: 'report',
      previous_status: existing.product_status,
      new_status: status,
      reason: reason ?? null,
      moderator_id: moderatorId,
      metadata: metadata ?? null
    })

  if (logError) {
    throw logError
  }

  return fetchFullProduct(client, productId)
}
