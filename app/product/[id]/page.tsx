import { headers } from 'next/headers'

import ProductPageClient from './ProductPageClient'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const dynamic = 'force-dynamic'

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === 'true' || v === 't' || v === '1' || v === 'yes') return true
    if (v === 'false' || v === 'f' || v === '0' || v === 'no') return false
  }
  return Boolean(value)
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const normalized = trimmed.replace(',', '.')
    const direct = Number(normalized)
    if (Number.isFinite(direct)) return direct
    const match = normalized.match(/-?\d+(?:\.\d+)?/)
    if (!match) return null
    const extracted = Number(match[0])
    return Number.isFinite(extracted) ? extracted : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

async function getOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (!host) return 'http://localhost:3000'
  return `${proto}://${host}`
}

async function fetchInitialProduct(productId: string) {
  if (!UUID_REGEX.test(String(productId))) return null

  const origin = await getOrigin()
  const resp = await fetch(`${origin}/api/public/products?id=${encodeURIComponent(String(productId))}`, {
    method: 'GET',
    cache: 'no-store'
  }).catch(() => null)
  const json = await resp?.json().catch(() => null)
  const data = json?.data
  if (!resp || !resp.ok || !data) return null

  const images = [String(data?.media?.main_image ?? ''), ...(Array.isArray(data?.media?.images) ? data.media.images : [])]
    .map((x: any) => String(x ?? ''))
    .filter((x: string) => x.length > 0)

  const price = Number(data?.sale_price ?? data?.price ?? 0) || 0
  const originalPrice = Number(data?.original_price ?? data?.price ?? 0) || 0

  const manageStock = toBoolean(data?.stock?.manage_stock ?? data?.manage_stock ?? data?.manageStock)
  const stockQty = toOptionalNumber(data?.stock?.stock_quantity ?? data?.stock_quantity ?? data?.stockQuantity)
  const hasFiniteStockQty = typeof stockQty === 'number' && Number.isFinite(stockQty)
  const inStock = manageStock ? (hasFiniteStockQty ? (stockQty as number) > 0 : true) : true

  const sellerName = String(data?.seller_name ?? '').trim()
  const sellerAvatar = String(data?.seller_avatar ?? '').trim()

  const vendorId = String(data?.vendor_id ?? '').trim()
  const safeVendorId = vendorId && UUID_REGEX.test(vendorId) ? vendorId : ''

  const apiRating = Number(data?.stats?.average_rating ?? 0) || 0
  const apiReviewCount = Number(data?.stats?.review_count ?? 0) || 0
  const apiTotalSales = Number(data?.stats?.total_sales ?? 0) || 0
  const apiReviews = Array.isArray(data?.reviews) ? data.reviews : []

  const warranty = typeof data?.warranty === 'string' ? String(data.warranty).trim() : ''
  const returnPolicy = typeof data?.return_policy === 'string' ? String(data.return_policy).trim() : ''

  const categoryIds = Array.isArray(data?.category_ids)
    ? data.category_ids.map((value: any) => String(value ?? '').trim()).filter((value: string) => value.length > 0)
    : []

  return {
    id: String(data?.id ?? productId),
    name: String(data?.name ?? 'Produit'),
    vendorId: safeVendorId,
    categoryIds,
    price,
    originalPrice,
    warranty,
    returnPolicy,
    rating: apiRating,
    reviews: apiReviewCount,
    images: images.length > 0 ? images : ['/placeholder.svg'],
    seller: {
      id: safeVendorId ? safeVendorId : undefined,
      name: sellerName || 'Boutique',
      rating: apiRating,
      totalSales: apiTotalSales,
      avatar: sellerAvatar || '/placeholder-user.jpg'
    },
    sharePoints: 0,
    shares: 0,
    manageStock,
    inStock,
    stockCount: manageStock && hasFiniteStockQty ? (stockQty as number) : 0,
    discount: originalPrice > 0 && price < originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
    description: typeof data?.description === 'string' ? data.description : '',
    features: [],
    specifications: {},
    api: {
      shipping: data?.shipping ?? null,
      reviews: apiReviews
    }
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const productId = String(params?.id ?? '').trim()
  const initialProduct = await fetchInitialProduct(productId)
  return <ProductPageClient productId={productId} initialProduct={initialProduct} />
}
