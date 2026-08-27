import { NextResponse } from 'next/server'
import { z } from 'zod'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import {
  buildProductSelect,
  createProductSchema,
  fetchFullProduct,
  mapSharedProductInputToCreateInput,
  mapSharedProductInputToUpdateInput,
  updateProductSchema,
  upsertFullProduct
} from '@/app/api/super-admin/_helpers/products'
import type { SharedProductInput } from '@/lib/types/shared-product'
import { mapSupabaseProductToSharedProduct } from '@/lib/utils/product-transformers'
import { fetchApprovedReviewAggregates } from '@/lib/product-reviews'
import { getSupabaseAdmin } from '@/lib/supabase'
import { PAID_REVENUE_STATUSES } from '@/lib/vendor-revenue'

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional()
})

function parseSharedProductInput(body: unknown, vendorId: string): SharedProductInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Payload invalide.')
  }

  const payload = body as SharedProductInput

  return {
    ...payload,
    vendorId,
    source: 'vendor'
  }
}

function formatProductWriteError(error: unknown): { status: number; message: string } {
  const fallback = { status: 500, message: 'Erreur lors de la mise à jour du produit vendeur.' }

  if (!error) {
    return fallback
  }

  const anyErr = error as any
  const code = typeof anyErr?.code === 'string' ? anyErr.code : null
  const message = typeof anyErr?.message === 'string' ? anyErr.message : ''
  const details = typeof anyErr?.details === 'string' ? anyErr.details : ''
  const hint = typeof anyErr?.hint === 'string' ? anyErr.hint : ''

  const joined = [message, details, hint].map((s) => String(s ?? '').trim()).filter(Boolean).join(' — ')

  if (code === '23505') {
    return {
      status: 409,
      message: joined || 'Conflit: un produit avec les mêmes informations existe déjà.'
    }
  }

  if (code === '22P02') {
    return {
      status: 400,
      message: joined || 'Payload invalide.'
    }
  }

  return {
    status: 500,
    message: joined || fallback.message
  }
}

/**
 * Agrège le CA et les quantités vendues réels depuis order_items pour les commandes payées.
 */
async function fetchPaidProductAggregates(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  params: {
    productIds: string[]
    vendorIds: string[]
  }
): Promise<Record<string, { totalRevenue: number; totalSales: number }>> {
  if (params.productIds.length === 0) return {}

  const { data, error } = await supabase
    .from('order_items')
    .select(
      `
        product_id,
        quantity,
        total_price,
        orders!inner(
          payment_status,
          vendor_id
        )
      `
    )
    .in('product_id', params.productIds)
    .in('orders.vendor_id', params.vendorIds)
    .in('orders.payment_status', PAID_REVENUE_STATUSES as any)

  if (error) {
    console.warn('⚠️ fetchPaidProductAggregates failed:', error)
    return {}
  }

  const aggregates: Record<string, { totalRevenue: number; totalSales: number }> = {}

  for (const row of data ?? []) {
    const productId = (row as any)?.product_id
    if (typeof productId !== 'string' || productId.length === 0) continue

    const quantity = Number((row as any)?.quantity ?? 0)
    const totalPrice = Number((row as any)?.total_price ?? 0)

    if (!aggregates[productId]) {
      aggregates[productId] = { totalRevenue: 0, totalSales: 0 }
    }

    aggregates[productId].totalSales += Number.isFinite(quantity) ? quantity : 0
    aggregates[productId].totalRevenue += Number.isFinite(totalPrice) ? totalPrice : 0
  }

  return aggregates
}

/**
 * Agrège le nombre de partages (engagement social) depuis shares_engagement.
 */
async function fetchShareAggregates(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  params: {
    productIds: string[]
  }
): Promise<Record<string, number>> {
  if (params.productIds.length === 0) return {}

  const { data, error } = await supabase
    .from('shares_engagement')
    .select('product_id')
    .in('product_id', params.productIds)

  if (error) {
    console.warn('⚠️ fetchShareAggregates failed:', error)
    return {}
  }

  const aggregates: Record<string, number> = {}

  for (const row of data ?? []) {
    const productId = (row as any)?.product_id
    if (typeof productId !== 'string' || productId.length === 0) continue
    aggregates[productId] = (aggregates[productId] ?? 0) + 1
  }

  return aggregates
}

/**
 * Récupère la liste des produits d'un vendeur authentifié avec filtres et pagination.
 */
export async function GET(request: Request) {
  const vendorId = await assertVendor()
  const supabase = getSupabaseAdmin()

  const { data: vendorProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', vendorId)
    .maybeSingle()

  const vendorIds = [vendorId]
  const profileId = (vendorProfile as any)?.id
  if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
    vendorIds.push(profileId)
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('id')

  if (productId) {
    const { data, error } = await supabase
      .from('user_products')
      .select(buildProductSelect())
      .eq('id', productId)
      .in('vendor_id', vendorIds)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
    }

    const item = mapSupabaseProductToSharedProduct(data)

    const aggregates = await fetchPaidProductAggregates(supabase, {
      productIds: [item.id],
      vendorIds
    })

    const shareAgg = await fetchShareAggregates(supabase, { productIds: [item.id] })
    const reviewAgg = await fetchApprovedReviewAggregates(supabase, [item.id])

    const paidStats = aggregates[item.id]
    const nextStats: Record<string, any> = { ...((item as any).statistics ?? {}) }

    if (paidStats) {
      nextStats.totalRevenue = paidStats.totalRevenue
      nextStats.totalSales = paidStats.totalSales
    }

    if (typeof shareAgg[item.id] === 'number') {
      nextStats.shareCount = shareAgg[item.id]
    }

    const r = reviewAgg[item.id]
    if (r) {
      nextStats.averageRating = r.averageRating
      nextStats.reviewCount = r.reviewCount
    }

    ;(item as any).statistics = nextStats
    return NextResponse.json({ data: item }, { status: 200 })
  }

  const rawQuery = Object.fromEntries(searchParams.entries())
  const queryParse = listQuerySchema.safeParse(rawQuery)

  if (!queryParse.success) {
    return NextResponse.json({ error: queryParse.error.message }, { status: 400 })
  }

  const query = queryParse.data
  const limit = query.limit ?? 50
  const offset = query.offset ?? 0

  let selectQuery = supabase
    .from('user_products')
    .select(buildProductSelect(), { count: 'exact' })
    .in('vendor_id', vendorIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (query.search) {
    selectQuery = selectQuery.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`)
  }

  if (query.status) {
    selectQuery = selectQuery.eq('product_status', query.status)
  }

  if (query.featured === 'true') {
    selectQuery = selectQuery.eq('is_featured', true)
  }

  const { data, error, count } = await selectQuery

  if (error) {
    console.error('❌ GET /api/vendor/products failed', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des produits vendeur.' }, { status: 500 })
  }

  const baseItems = (data ?? []).map((record) => mapSupabaseProductToSharedProduct(record))

  const aggregates = await fetchPaidProductAggregates(supabase, {
    productIds: baseItems.map((item) => item.id),
    vendorIds
  })

  const productIds = baseItems.map((item) => item.id)
  const shareAgg = await fetchShareAggregates(supabase, { productIds })
  const reviewAgg = await fetchApprovedReviewAggregates(supabase, productIds)

  const items = baseItems.map((item) => {
    const paidStats = aggregates[item.id]

    const nextStats: Record<string, any> = { ...((item as any).statistics ?? {}) }

    if (paidStats) {
      nextStats.totalRevenue = paidStats.totalRevenue
      nextStats.totalSales = paidStats.totalSales
    }

    if (typeof shareAgg[item.id] === 'number') {
      nextStats.shareCount = shareAgg[item.id]
    }

    const r = reviewAgg[item.id]
    if (r) {
      nextStats.averageRating = r.averageRating
      nextStats.reviewCount = r.reviewCount
    }

    ;(item as any).statistics = nextStats

    return item
  })

  return NextResponse.json({ data: { items, count: count ?? 0 } }, { status: 200 })
}

/**
 * Crée un nouveau produit au nom du vendeur authentifié.
 */
export async function POST(request: Request) {
  const vendorId = await assertVendor()
  const supabase = getSupabaseAdmin()

  const body = await request.json().catch(() => undefined)

  if (!body) {
    return NextResponse.json({ error: 'Payload manquant.' }, { status: 400 })
  }

  let sharedInput: SharedProductInput

  try {
    sharedInput = parseSharedProductInput(body, vendorId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payload invalide.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const createPayload = mapSharedProductInputToCreateInput(sharedInput)
  const validation = createProductSchema.safeParse(createPayload)

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.message }, { status: 400 })
  }

  try {
    const product = await upsertFullProduct(supabase, validation.data, vendorId)
    const shared = mapSupabaseProductToSharedProduct(product)
    return NextResponse.json({ data: shared }, { status: 201 })
  } catch (error) {
    console.error('❌ POST /api/vendor/products failed', error)
    const formatted = formatProductWriteError(error)
    return NextResponse.json({ error: formatted.message }, { status: formatted.status })
  }
}

/**
 * Met à jour un produit appartenant au vendeur authentifié.
 */
export async function PUT(request: Request) {
  const vendorId = await assertVendor()
  const supabase = getSupabaseAdmin()

  const { data: vendorProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', vendorId)
    .maybeSingle()

  const vendorIds = [vendorId]
  const profileId = (vendorProfile as any)?.id
  if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
    vendorIds.push(profileId)
  }

  const body = await request.json().catch(() => undefined)

  if (!body) {
    return NextResponse.json({ error: 'Payload manquant.' }, { status: 400 })
  }

  let sharedInput: SharedProductInput & { id?: string }

  try {
    sharedInput = parseSharedProductInput(body, vendorId)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payload invalide.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (!sharedInput.id) {
    return NextResponse.json({ error: 'Identifiant produit requis pour la mise à jour.' }, { status: 400 })
  }

  const updatePayload = mapSharedProductInputToUpdateInput(sharedInput as SharedProductInput & { id: string })
  const validation = updateProductSchema.safeParse(updatePayload)

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.message }, { status: 400 })
  }

  const { data: productOwner, error: ownerError } = await supabase
    .from('user_products')
    .select('id, vendor_id')
    .eq('id', validation.data.id)
    .single()

  if (ownerError || !productOwner) {
    return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
  }

  if (!vendorIds.includes(String(productOwner.vendor_id))) {
    return NextResponse.json({ error: 'Vous ne pouvez modifier que vos propres produits.' }, { status: 403 })
  }

  try {
    const product = await upsertFullProduct(supabase, validation.data, vendorId, validation.data.id)
    const shared = mapSupabaseProductToSharedProduct(product)
    return NextResponse.json({ data: shared }, { status: 200 })
  } catch (error) {
    console.error('❌ PUT /api/vendor/products failed', error)
    const formatted = formatProductWriteError(error)
    return NextResponse.json({ error: formatted.message }, { status: formatted.status })
  }
}

/**
 * Supprime un produit appartenant au vendeur authentifié.
 */
export async function DELETE(request: Request) {
  const vendorId = await assertVendor()
  const supabase = getSupabaseAdmin()

  const { data: vendorProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', vendorId)
    .maybeSingle()

  const vendorIds = [vendorId]
  const profileId = (vendorProfile as any)?.id
  if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorId) {
    vendorIds.push(profileId)
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('id')

  if (!productId) {
    return NextResponse.json({ error: 'Identifiant produit manquant.' }, { status: 400 })
  }

  const { data: productOwner, error: ownerError } = await supabase
    .from('user_products')
    .select('id, vendor_id')
    .eq('id', productId)
    .single()

  if (ownerError || !productOwner) {
    return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
  }

  if (!vendorIds.includes(String(productOwner.vendor_id))) {
    return NextResponse.json({ error: 'Vous ne pouvez supprimer que vos propres produits.' }, { status: 403 })
  }

  const { error } = await supabase.from('user_products').delete().eq('id', productId)

  if (error) {
    console.error('❌ DELETE /api/vendor/products failed', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression du produit vendeur.' }, { status: 500 })
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 })
}
