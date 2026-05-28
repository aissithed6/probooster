import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { fetchApprovedReviewAggregates } from '@/lib/product-reviews'
import { getSupabaseAdmin } from '@/lib/supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type VendorSummary = {
  vendorId: string
  averageRating: number
  reviewCount: number
  avgResponseSeconds: number | null
}

/**
 * GET /api/public/vendors/summary?vendorId=<uuid>
 * Retourne un résumé public du vendeur (note/avis + temps de réponse moyen calculé sur les messages).
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const vendorId = String(url.searchParams.get('vendorId') ?? '').trim()

    if (!UUID_REGEX.test(vendorId)) {
      return NextResponse.json({ error: 'vendorId invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1) Produits du vendeur
    const { data: products, error: productsError } = await supabase
      .from('user_products')
      .select('id')
      .eq('vendor_id', vendorId)

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const productIds = (products ?? [])
      .map((p: any) => p?.id)
      .filter((id: any) => typeof id === 'string') as string[]

    // 2) Note / avis
    let averageRating = 0
    let reviewCount = 0

    if (productIds.length > 0) {
      const aggregates = await fetchApprovedReviewAggregates(supabase, productIds)
      let weightedSum = 0
      let approvedCount = 0

      Object.values(aggregates).forEach((row) => {
        const count = Number(row?.reviewCount ?? 0)
        const avg = Number(row?.averageRating ?? 0)
        if (count <= 0) return
        weightedSum += avg * count
        approvedCount += count
      })

      reviewCount = approvedCount
      averageRating = approvedCount > 0 ? Number((weightedSum / approvedCount).toFixed(2)) : 0
    }

    // 3) Temps de réponse moyen (client -> vendeur)
    // Fenêtre: 30 jours, limite: 5000 messages
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: chats, error: chatsError } = await supabase
      .from('user_chats')
      .select('id, participant1_id, participant2_id')
      .or(`participant1_id.eq.${vendorId},participant2_id.eq.${vendorId}`)
      .limit(200)

    if (chatsError) {
      return NextResponse.json({ error: chatsError.message }, { status: 500 })
    }

    const chatIds = (chats ?? [])
      .map((c: any) => c?.id)
      .filter((id: any) => typeof id === 'string') as string[]

    let avgResponseSeconds: number | null = null

    if (chatIds.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('chat_id, sender_id, created_at')
        .in('chat_id', chatIds)
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(5000)

      if (messagesError) {
        return NextResponse.json({ error: messagesError.message }, { status: 500 })
      }

      const diffs: number[] = []
      const byChat = new Map<string, Array<{ sender_id: string; created_at: string }>>()

      ;(messages ?? []).forEach((m: any) => {
        const cid = String(m.chat_id ?? '')
        if (!cid) return
        const arr = byChat.get(cid) ?? []
        arr.push({ sender_id: String(m.sender_id ?? ''), created_at: String(m.created_at ?? '') })
        byChat.set(cid, arr)
      })

      for (const [, arr] of byChat) {
        for (let i = 0; i < arr.length - 1; i++) {
          const current = arr[i]
          const next = arr[i + 1]
          if (!current?.created_at || !next?.created_at) continue

          const currentIsVendor = current.sender_id === vendorId
          const nextIsVendor = next.sender_id === vendorId

          // On compte uniquement une réponse vendeur à un message non-vendeur
          if (!currentIsVendor && nextIsVendor) {
            const t1 = Date.parse(current.created_at)
            const t2 = Date.parse(next.created_at)
            if (Number.isFinite(t1) && Number.isFinite(t2) && t2 >= t1) {
              const seconds = Math.round((t2 - t1) / 1000)
              if (seconds >= 0 && seconds <= 7 * 24 * 60 * 60) {
                diffs.push(seconds)
              }
            }
          }
        }
      }

      if (diffs.length > 0) {
        avgResponseSeconds = Math.round(diffs.reduce((acc, v) => acc + v, 0) / diffs.length)
      }
    }

    const data: VendorSummary = {
      vendorId,
      averageRating,
      reviewCount,
      avgResponseSeconds
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
