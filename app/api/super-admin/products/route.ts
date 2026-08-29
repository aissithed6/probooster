type ListProductsQuery = {
  search?: string
  status?: string
  vendorId?: string
  featured?: string
  limit?: string
  offset?: string
  id?: string
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import type { DuplicateProductOverrides } from '@/app/api/super-admin/_helpers/products'
import {
  buildProductSelect,
  bulkUpdateProducts,
  createProductSchema,
  duplicateProduct,
  productStatusSchema,
  reportProduct,
  updateProductSchema,
  upsertFullProduct
} from '@/app/api/super-admin/_helpers/products'
import { getSupabaseAdmin } from '@/lib/supabase'
import { mapSupabaseProductToSharedProduct } from '@/lib/utils/product-transformers'

const bulkActionPayloadSchema = z.object({
  type: z.literal('bulk'),
  action: z.enum(['activate', 'deactivate', 'feature', 'unfeature', 'delete']),
  productIds: z.array(z.string().uuid()).min(1)
})

const duplicateOverridesSchema = createProductSchema.partial()

const duplicatePayloadSchema = z.object({
  type: z.literal('duplicate'),
  productId: z.string().uuid(),
  overrides: duplicateOverridesSchema.optional()
})

const reportPayloadSchema = z.object({
  type: z.literal('report'),
  productId: z.string().uuid(),
  reason: z.string().min(2).max(500).optional(),
  status: productStatusSchema.optional(),
  metadata: z.record(z.any()).optional()
})

const productPatchSchema = z.discriminatedUnion('type', [
  bulkActionPayloadSchema,
  duplicatePayloadSchema,
  reportPayloadSchema
])

/**
 * Liste les produits avec filtres (recherche, statut, vendeur, vedette) et pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query: ListProductsQuery = Object.fromEntries(searchParams.entries())

    try {
      await assertSuperAdmin(request)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Accès non autorisé.'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    if (query.id) {
      const { data, error } = await supabase
        .from('user_products')
        .select(buildProductSelect())
        .eq('id', query.id)
        .single()

      if (error || !data) {
        const message = error?.message ?? 'Produit introuvable.'
        return NextResponse.json({ error: message }, { status: 404 })
      }

      try {
        const sharedProduct = mapSupabaseProductToSharedProduct(data as any)
        return NextResponse.json({ data: sharedProduct }, { status: 200 })
      } catch (mappingError) {
        console.error('❌ GET /products?id mapping failed', {
          error: mappingError,
          productId: query.id,
          rawData: data
        })

        const message = mappingError instanceof Error ? mappingError.message : 'Erreur interne lors du chargement du produit.'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    let selectQuery = supabase
      .from('user_products')
      .select(buildProductSelect(), { count: 'exact' })
      .order('created_at', { ascending: false })

    if (query.search) {
      selectQuery = selectQuery.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`)
    }

    if (query.status) {
      selectQuery = selectQuery.eq('product_status', query.status)
    }

    if (query.vendorId) {
      selectQuery = selectQuery.eq('vendor_id', query.vendorId)
    }

    if (query.featured === 'true') {
      selectQuery = selectQuery.eq('is_featured', true)
    }

    const limit = query.limit ? Number(query.limit) : 50
    const offset = query.offset ? Number(query.offset) : 0

    selectQuery = selectQuery.range(offset, offset + limit - 1)

    const { data, error, count } = await selectQuery

    if (error) {
      console.error('❌ GET /products failed', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })

      return NextResponse.json(
        {
          data: { items: [], count: 0 },
          warning: 'Erreur lors du chargement des produits. Résultat vide retourné.'
        },
        { status: 200 }
      )
    }

    const rawItems = data ?? []
    const normalizedItems = rawItems.map((item) => ({
      ...(item as any),
      // Alias camelCase pour l'UI (modal), tout en conservant les champs DB (snake_case).
      warranty: (item as any)?.warranty ?? null,
      returnPolicy: (item as any)?.return_policy ?? null,
      productStatus: (item as any)?.product_status ?? null,
      isFeatured: (item as any)?.is_featured ?? false,
      salePrice: (item as any)?.sale_price ?? null,
      costPrice: (item as any)?.cost_price ?? null,
      stockQuantity: (item as any)?.stock_quantity ?? 0,
      lowStockThreshold: (item as any)?.low_stock_threshold ?? 5,
      manageStock: (item as any)?.manage_stock ?? true,
      allowBackorders: (item as any)?.allow_backorders ?? false
    }))

    return NextResponse.json({ data: { items: normalizedItems, count: count ?? 0 } })
  } catch (unexpected) {
    console.error('❌ GET /products unexpected error', unexpected)
    const message = unexpected instanceof Error ? unexpected.message : 'Erreur interne lors du chargement des produits.'
    const details =
      process.env.NODE_ENV !== 'production'
        ? {
            stack: unexpected instanceof Error ? unexpected.stack : undefined,
            raw: typeof unexpected === 'object' && unexpected !== null ? unexpected : String(unexpected)
          }
        : undefined

    return NextResponse.json(
      {
        error: message,
        ...(details ? { details } : {})
      },
      { status: 500 }
    )
  }
}

/**
 * Crée un produit super-admin/admin avec toutes ses relations associées.
 */
export async function POST(request: NextRequest) {
  let userId: string
  try {
    userId = await assertSuperAdmin(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Accès non autorisé.'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const body = await request.json().catch(() => undefined)
  const parseResult = createProductSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.message }, { status: 400 })
  }

  const payloadSource = parseResult.data.source ?? 'vendor'

  const normalizeSku = (value: unknown) => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (trimmed.toUpperCase() === 'N/A' || trimmed.toUpperCase() === 'NA') return undefined
    return trimmed
  }

  const normalizedPayload = {
    ...parseResult.data,
    sku: normalizeSku(parseResult.data.sku),
    vendorId: parseResult.data.vendorId ?? null,
    source: payloadSource
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('🧪 POST /api/super-admin/products warranty debug', {
      warranty: (normalizedPayload as any).warranty,
      returnPolicy: (normalizedPayload as any).returnPolicy
    })
  }

  try {
    const product = await upsertFullProduct(supabase, normalizedPayload, userId)
    const normalizedResponse = {
      ...(product as any),
      warranty: (product as any)?.warranty ?? null,
      returnPolicy: (product as any)?.return_policy ?? (product as any)?.returnPolicy ?? null
    }
    return NextResponse.json({ data: normalizedResponse }, { status: 201 })
  } catch (error) {
    console.error('❌ POST /products failed', error)

    const message = error instanceof Error ? error.message : 'Erreur lors de la création du produit.'
    const details =
      typeof error === 'object' && error !== null && 'details' in error ? (error as Record<string, unknown>).details : undefined

    return NextResponse.json(
      {
        error: message,
        ...(details ? { details } : {})
      },
      { status: 500 }
    )
  }
}

/**
 * Met à jour un produit existant (données principales + relations).
 */
export async function PUT(request: NextRequest) {
  let userId: string
  try {
    userId = await assertSuperAdmin(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Accès non autorisé.'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const body = await request.json().catch(() => undefined)
  const parseResult = updateProductSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.message }, { status: 400 })
  }

  const payloadSource = parseResult.data.source ?? 'vendor'

  const normalizeSku = (value: unknown) => {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (trimmed.toUpperCase() === 'N/A' || trimmed.toUpperCase() === 'NA') return undefined
    return trimmed
  }

  const { data: existingProduct, error: existingError } = await supabase
    .from('user_products')
    .select('vendor_id, sku')
    .eq('id', parseResult.data.id)
    .single()

  if (existingError) {
    console.error('❌ PUT /products failed to fetch existing product', existingError)
    return NextResponse.json(
      {
        error: existingError.message ?? 'Produit introuvable.'
      },
      { status: 404 }
    )
  }

  const existingVendorId = (existingProduct as any)?.vendor_id ?? null
  const existingSku = normalizeSku((existingProduct as any)?.sku)

  const requestedSku = normalizeSku(parseResult.data.sku)
  const resolvedSku = requestedSku ?? existingSku

  const requestedVendorId = parseResult.data.vendorId ?? undefined
  const resolvedVendorId = requestedVendorId ?? existingVendorId ?? null

  const normalizedPayload = {
    ...parseResult.data,
    sku: resolvedSku,
    vendorId: resolvedVendorId,
    source: payloadSource
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('🧪 PUT /api/super-admin/products warranty debug', {
      productId: (normalizedPayload as any).id,
      warranty: (normalizedPayload as any).warranty,
      returnPolicy: (normalizedPayload as any).returnPolicy,
      stockQuantity: (normalizedPayload as any).stockQuantity,
      manageStock: (normalizedPayload as any).manageStock,
      lowStockThreshold: (normalizedPayload as any).lowStockThreshold,
      allowBackorders: (normalizedPayload as any).allowBackorders
    })
  }

  try {
    console.log('🔍 Début mise à jour produit avec payload:', JSON.stringify(normalizedPayload, null, 2))
    const product = await upsertFullProduct(supabase, normalizedPayload, userId, normalizedPayload.id)
    console.log('✅ Produit mis à jour avec succès:', (product as any)?.id)

    if (process.env.NODE_ENV !== 'production') {
      const { data: persisted, error: persistedError } = await supabase
        .from('user_products')
        .select('id, product_status, warranty, return_policy')
        .eq('id', normalizedPayload.id)
        .maybeSingle()

      if (persistedError) {
        console.log('🧪 Persist check failed (PUT /api/super-admin/products)', {
          productId: normalizedPayload.id,
          error: persistedError
        })
      } else {
        console.log('🧪 Persist check (PUT /api/super-admin/products)', {
          productId: persisted?.id,
          productStatus: (persisted as any)?.product_status,
          warranty: (persisted as any)?.warranty,
          returnPolicy: (persisted as any)?.return_policy
        })
      }
    }

    const normalizedResponse = {
      ...(product as any),
      warranty: (product as any)?.warranty ?? null,
      returnPolicy: (product as any)?.return_policy ?? (product as any)?.returnPolicy ?? null
    }
    return NextResponse.json({ data: normalizedResponse }, { status: 200 })
  } catch (error) {
    const errorRecord = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : undefined
    const supabaseMessage = typeof errorRecord?.message === 'string' ? (errorRecord.message as string) : undefined
    const message = error instanceof Error
      ? error.message
      : (supabaseMessage ?? 'Erreur lors de la mise à jour du produit.')

    const code = typeof errorRecord?.code === 'string' ? (errorRecord.code as string) : undefined
    const hint = typeof errorRecord?.hint === 'string' ? (errorRecord.hint as string) : undefined
    const details = errorRecord?.details

    console.error('❌ PUT /products failed', { 
      error: error instanceof Error ? error.stack : error, 
      message, 
      code,
      hint,
      details,
      payload: normalizedPayload 
    })

    return NextResponse.json(
      {
        error: message,
        ...(code ? { code } : {}),
        ...(hint ? { hint } : {}),
        ...(details ? { details } : {})
      },
      { status: 500 }
    )
  }
}

/**
 * Actions avancées sur les produits (bulk, duplication, signalement).
 */
export async function PATCH(request: Request) {
  let userId: string
  try {
    userId = await assertSuperAdmin()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Accès non autorisé.'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const body = await request.json().catch(() => undefined)
  const parseResult = productPatchSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.message }, { status: 400 })
  }

  const payload = parseResult.data

  try {
    switch (payload.type) {
      case 'bulk': {
        const result = await bulkUpdateProducts(supabase, {
          action: payload.action,
          productIds: payload.productIds,
          userId
        })
        return NextResponse.json({ data: result }, { status: 200 })
      }
      case 'duplicate': {
        const product = await duplicateProduct(
          supabase,
          payload.productId,
          userId,
          (payload.overrides ?? {}) as DuplicateProductOverrides
        )
        return NextResponse.json({ data: product }, { status: 201 })
      }
      case 'report': {
        const product = await reportProduct(supabase, {
          productId: payload.productId,
          reason: payload.reason,
          moderatorId: userId,
          status: payload.status,
          metadata: payload.metadata
        })
        return NextResponse.json({ data: product }, { status: 200 })
      }
      default:
        return NextResponse.json({ error: 'Action non supportée.' }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ PATCH /products failed', error)
    return NextResponse.json({ error: 'Erreur lors de l\'action produit.' }, { status: 500 })
  }
}

/**
 * Supprime définitivement un produit et ses dépendances.
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Identifiant produit manquant.' }, { status: 400 })
  }

  try {
    await assertSuperAdmin()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Accès non autorisé.'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('user_products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('❌ DELETE /products failed', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression du produit.' }, { status: 500 })
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 })
}
