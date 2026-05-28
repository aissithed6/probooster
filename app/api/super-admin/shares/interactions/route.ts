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
    const shareId = String(url.searchParams.get('shareId') ?? '').trim()

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('share_interactions')
      .select('id, share_id, interaction_type, created_at, ip_address, user_agent, referrer')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1)

    if (start) query = query.gte('created_at', start)
    if (end) query = query.lte('created_at', end)
    if (type) query = query.eq('interaction_type', type)
    if (UUID_REGEX.test(shareId)) query = query.eq('share_id', shareId)

    const { data: interactions, error } = await query

    if (error) {
      return NextResponse.json({ data: { rows: [], page, pageSize }, error: error.message }, { status: 200 })
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
      { data: { rows, page, pageSize } },
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
