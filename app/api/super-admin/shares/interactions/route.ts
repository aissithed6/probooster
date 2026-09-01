import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type InteractionRow = {
  id: string
  createdAt: string
  type: string
  shareId: string
  shareUserId: string
  productId: string
  platform: string
  ip: string
  userAgent: string
  referrer: string
}

/**
 * GET /api/super-admin/shares/interactions
 * Liste paginée des interactions, avec filtres (période, type, shareId, userId).
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const url = new URL(request.url)
    const page = Math.max(Number(url.searchParams.get('page') ?? 1) || 1, 1)
    const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 25) || 25, 1), 100)

    const start = String(url.searchParams.get('start') ?? '').trim()
    const end = String(url.searchParams.get('end') ?? '').trim()
    const type = String(url.searchParams.get('type') ?? '').trim().toLowerCase()
    const platform = String(url.searchParams.get('platform') ?? '').trim().toLowerCase()
    const shareId = String(url.searchParams.get('shareId') ?? '').trim()

    const supabase = getSupabaseAdmin()

    const baseSelect = 'id, share_id, interaction_type, created_at, ip_address, user_agent, referrer'
    const applyCommonFilters = (query: any) => {
      let q = query
      if (start) q = q.gte('created_at', start)
      if (end) q = q.lte('created_at', end)
      if (type) q = q.eq('interaction_type', type)
      if (UUID_REGEX.test(shareId)) q = q.eq('share_id', shareId)
      return q
    }

    let interactions: any[] | null = null
    let warning: string | null = null

    if (platform) {
      // Filtre plateforme appliqué côté SQL via la relation share_interactions -> product_shares (!inner).
      let embeddedQuery = applyCommonFilters(
        supabase
          .from('share_interactions')
          .select(`${baseSelect}, product_shares!inner(user_id, product_id, platform)`)
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1)
      ).eq('product_shares.platform', platform)

      const { data, error } = await embeddedQuery
      if (!error) {
        interactions = data ?? []
      } else {
        // Relation non exposée sur cette base -> fallback sans filtre plateforme (le reste fonctionne).
        warning = `Filtre plateforme non appliqué (${error.message})`
      }
    }

    if (interactions === null) {
      let query = applyCommonFilters(
        supabase
          .from('share_interactions')
          .select(baseSelect)
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1)
      )

      const { data: rows, error } = await query

      if (error) {
        return NextResponse.json({ data: { rows: [], page, pageSize }, error: error.message }, { status: 200 })
      }

      interactions = rows ?? []
    }

    const shareIds = Array.from(
      new Set((interactions ?? []).map((i: any) => String(i?.share_id ?? '').trim()).filter((id) => UUID_REGEX.test(id)))
    ).slice(0, 200)

    const shareMap = new Map<string, any>()
    if (shareIds.length > 0) {
      const { data: shares } = await supabase
        .from('product_shares')
        .select('id, user_id, product_id, platform')
        .in('id', shareIds)
        .limit(500)

      for (const s of shares ?? []) {
        shareMap.set(String((s as any)?.id ?? '').trim(), s)
      }
    }

    const rows: InteractionRow[] = (interactions ?? []).map((i: any) => {
      const sid = String(i?.share_id ?? '').trim()
      const share = shareMap.get(sid)
      return {
        id: String(i?.id ?? '').trim(),
        createdAt: String(i?.created_at ?? ''),
        type: String(i?.interaction_type ?? ''),
        shareId: sid,
        shareUserId: String(share?.user_id ?? ''),
        productId: String(share?.product_id ?? ''),
        platform: String(share?.platform ?? ''),
        ip: String(i?.ip_address ?? ''),
        userAgent: String(i?.user_agent ?? ''),
        referrer: String(i?.referrer ?? '')
      }
    })

    return NextResponse.json(
      { data: { rows, page, pageSize }, ...(warning ? { warning } : {}) },
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
