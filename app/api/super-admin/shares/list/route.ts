import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SharesListItem = {
  id: string
  createdAt: string
  platform: string
  shareUrl: string
  pointsEarned: number
  shareUserId: string
  shareUserName: string
  shareUserAvatar: string
  shareUserRole: string
  productId: string
  productName: string
  productImage: string
  productVendorId: string
  productVendorName: string
  interactionsCount: number
  interactionTypes: Record<string, number>
  pointsFromInteractions: number
}

type SharesListResponse = {
  rows: SharesListItem[]
  page: number
  pageSize: number
}

function safeNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function buildDisplayName(profile: any, userRow: any): string {
  const first = typeof profile?.first_name === 'string' ? String(profile.first_name).trim() : ''
  const last = typeof profile?.last_name === 'string' ? String(profile.last_name).trim() : ''
  const full = [first, last].filter(Boolean).join(' ').trim()
  if (full) return full
  const shortCode = typeof profile?.short_code === 'string' ? String(profile.short_code).trim() : ''
  if (shortCode) return shortCode
  const email = typeof userRow?.email === 'string' ? String(userRow.email).trim() : ''
  if (email && email.includes('@')) return email.split('@')[0]
  return 'Utilisateur'
}

/**
 * GET /api/super-admin/shares/list
 * Liste paginée (enrichie) des partages.
 * Filtres:
 * - page/pageSize
 * - start/end
 * - platform
 * - userId, vendorId, productId
 * - search (nom utilisateur / email / nom produit)
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const url = new URL(request.url)
    const page = Math.max(Number(url.searchParams.get('page') ?? 1) || 1, 1)
    const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 25) || 25, 1), 100)

    const start = String(url.searchParams.get('start') ?? '').trim()
    const end = String(url.searchParams.get('end') ?? '').trim()
    const platform = String(url.searchParams.get('platform') ?? '').trim().toLowerCase()
    const userId = String(url.searchParams.get('userId') ?? '').trim()
    const vendorId = String(url.searchParams.get('vendorId') ?? '').trim()
    const productId = String(url.searchParams.get('productId') ?? '').trim()
    const search = String(url.searchParams.get('search') ?? '').trim().toLowerCase()

    const supabase = getSupabaseAdmin()

    let searchUserIds: string[] = []
    let searchProductIds: string[] = []

    if (search.length >= 2) {
      const [{ data: userMatches }, { data: productMatches }] = await Promise.all([
        supabase
          .from('users')
          .select('id, email')
          .ilike('email', `%${search}%`)
          .limit(40),
        supabase
          .from('user_products')
          .select('id, name')
          .ilike('name', `%${search}%`)
          .limit(40)
      ])

      searchUserIds = (userMatches ?? []).map((u: any) => String(u?.id ?? '').trim()).filter((id) => UUID_REGEX.test(id))
      searchProductIds = (productMatches ?? []).map((p: any) => String(p?.id ?? '').trim()).filter((id) => UUID_REGEX.test(id))

      // Recherche aussi dans user_profiles (first/last/short_code)
      const { data: profileMatches } = await supabase
        .from('user_profiles')
        .select('user_id')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,short_code.ilike.%${search}%`)
        .limit(40)

      for (const row of profileMatches ?? []) {
        const id = String((row as any)?.user_id ?? '').trim()
        if (UUID_REGEX.test(id)) searchUserIds.push(id)
      }

      searchUserIds = Array.from(new Set(searchUserIds)).slice(0, 60)
      searchProductIds = Array.from(new Set(searchProductIds)).slice(0, 60)
    }

    let query = supabase
      .from('product_shares')
      .select('id, user_id, product_id, vendor_id, platform, share_url, points_earned, created_at')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1)

    if (start) query = query.gte('created_at', start)
    if (end) query = query.lte('created_at', end)
    if (platform) query = query.eq('platform', platform)
    if (UUID_REGEX.test(userId)) query = query.eq('user_id', userId)
    if (UUID_REGEX.test(vendorId)) query = query.eq('vendor_id', vendorId)
    if (productId) query = query.eq('product_id', productId)

    if (search.length >= 2) {
      const ors: string[] = []
      if (searchUserIds.length > 0) {
        ors.push(`user_id.in.(${searchUserIds.join(',')})`)
      }
      if (searchProductIds.length > 0) {
        ors.push(`product_id.in.(${searchProductIds.join(',')})`)
      }
      if (ors.length > 0) {
        query = query.or(ors.join(','))
      }
    }

    const { data: shareRows, error } = await query
    if (error) {
      return NextResponse.json({ data: { rows: [], page, pageSize }, error: error.message }, { status: 200 })
    }

    const shares = (shareRows ?? []) as any[]

    const shareUserIds = Array.from(new Set(shares.map((s) => String(s?.user_id ?? '').trim()).filter((id) => UUID_REGEX.test(id))))
    const productIds = Array.from(new Set(shares.map((s) => String(s?.product_id ?? '').trim()).filter(Boolean)))
    const vendorIds = Array.from(new Set(shares.map((s) => String(s?.vendor_id ?? '').trim()).filter((id) => UUID_REGEX.test(id))))

    const productIdsUuid = productIds.filter((id) => UUID_REGEX.test(id)).slice(0, 200)

    const [usersRes, profilesRes, productsRes, vendorsRes] = await Promise.all([
      shareUserIds.length > 0
        ? supabase.from('users').select('id, email, role').in('id', shareUserIds).limit(300)
        : Promise.resolve({ data: [] as any[] } as any),
      shareUserIds.length > 0
        ? supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name, avatar_url, short_code')
            .in('user_id', shareUserIds)
            .limit(300)
        : Promise.resolve({ data: [] as any[] } as any),
      productIdsUuid.length > 0
        ? supabase
            .from('user_products')
            .select('id, name, main_image, vendor_id')
            .in('id', productIdsUuid)
            .limit(300)
        : Promise.resolve({ data: [] as any[] } as any),
      vendorIds.length > 0
        ? supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name, avatar_url, short_code')
            .in('user_id', vendorIds)
            .limit(300)
        : Promise.resolve({ data: [] as any[] } as any)
    ])

    const userById = new Map<string, any>()
    for (const u of (usersRes as any).data ?? []) {
      userById.set(String((u as any)?.id ?? '').trim(), u)
    }

    const profileByUserId = new Map<string, any>()
    for (const p of (profilesRes as any).data ?? []) {
      profileByUserId.set(String((p as any)?.user_id ?? '').trim(), p)
    }

    const vendorProfileByUserId = new Map<string, any>()
    for (const p of (vendorsRes as any).data ?? []) {
      vendorProfileByUserId.set(String((p as any)?.user_id ?? '').trim(), p)
    }

    const productById = new Map<string, any>()
    for (const p of (productsRes as any).data ?? []) {
      productById.set(String((p as any)?.id ?? '').trim(), p)
    }

    const shareIds = shares.map((s) => String(s?.id ?? '').trim()).filter((id) => UUID_REGEX.test(id))

    const interactionsByShareId = new Map<string, { total: number; byType: Record<string, number> }>()
    if (shareIds.length > 0) {
      const { data: interactions } = await supabase
        .from('share_interactions')
        .select('share_id, interaction_type')
        .in('share_id', shareIds)
        .limit(20000)

      for (const i of interactions ?? []) {
        const sid = String((i as any)?.share_id ?? '').trim()
        if (!sid) continue
        const t = String((i as any)?.interaction_type ?? '').trim().toLowerCase() || 'unknown'
        const entry = interactionsByShareId.get(sid) ?? { total: 0, byType: {} }
        entry.total += 1
        entry.byType[t] = (entry.byType[t] ?? 0) + 1
        interactionsByShareId.set(sid, entry)
      }
    }

    const pointsByShareId = new Map<string, number>()
    if (shareIds.length > 0) {
      const { data: txRows } = await supabase
        .from('point_transactions')
        .select('reference_id, points, type')
        .in('reference_id', shareIds)
        .neq('type', 'share')
        .limit(20000)

      if (Array.isArray(txRows)) {
        for (const row of txRows) {
          const rid = String((row as any)?.reference_id ?? '').trim()
          if (!rid) continue
          const prev = pointsByShareId.get(rid) ?? 0
          pointsByShareId.set(rid, prev + safeNumber((row as any)?.points))
        }
      } else {
        const { data: legacyRows } = await supabase
          .from('user_points_transactions')
          .select('reference_id, points, type')
          .in('reference_id', shareIds)
          .neq('type', 'share')
          .limit(20000)
        for (const row of legacyRows ?? []) {
          const rid = String((row as any)?.reference_id ?? '').trim()
          if (!rid) continue
          const prev = pointsByShareId.get(rid) ?? 0
          pointsByShareId.set(rid, prev + safeNumber((row as any)?.points))
        }
      }
    }

    const rows: SharesListItem[] = shares.map((s) => {
      const shareId = String((s as any)?.id ?? '').trim()
      const shareUserId = String((s as any)?.user_id ?? '').trim()
      const productId = String((s as any)?.product_id ?? '').trim()
      const productVendorId = String((s as any)?.vendor_id ?? '').trim()

      const userRow = userById.get(shareUserId)
      const profile = profileByUserId.get(shareUserId)
      const shareUserName = buildDisplayName(profile, userRow)
      const shareUserAvatar = typeof profile?.avatar_url === 'string' ? String(profile.avatar_url).trim() : ''
      const shareUserRole = typeof userRow?.role === 'string' ? String(userRow.role).trim() : ''

      const product = UUID_REGEX.test(productId) ? productById.get(productId) : null
      const productName = product ? String((product as any)?.name ?? '').trim() || `Produit ${productId.slice(0, 8)}` : `Produit ${productId.slice(0, 8)}`
      const productImage = product ? String((product as any)?.main_image ?? '').trim() : ''
      const canonicalVendorId = product ? String((product as any)?.vendor_id ?? '').trim() : productVendorId

      const vendorProfile = vendorProfileByUserId.get(canonicalVendorId)
      const productVendorName = buildDisplayName(vendorProfile, null)

      const interactionEntry = interactionsByShareId.get(shareId) ?? { total: 0, byType: {} }
      const pointsFromInteractions = pointsByShareId.get(shareId) ?? 0

      return {
        id: shareId,
        createdAt: String((s as any)?.created_at ?? ''),
        platform: String((s as any)?.platform ?? ''),
        shareUrl: String((s as any)?.share_url ?? ''),
        pointsEarned: safeNumber((s as any)?.points_earned),
        shareUserId,
        shareUserName,
        shareUserAvatar,
        shareUserRole,
        productId,
        productName,
        productImage,
        productVendorId: canonicalVendorId,
        productVendorName,
        interactionsCount: interactionEntry.total,
        interactionTypes: interactionEntry.byType,
        pointsFromInteractions
      }
    })

    const response: SharesListResponse = { rows, page, pageSize }

    return NextResponse.json(
      { data: response },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ data: { rows: [], page: 1, pageSize: 25 }, error: message }, { status })
  }
}
