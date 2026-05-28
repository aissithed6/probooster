import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * GET /api/client/chat/states?chatIds=id1,id2
 * Retourne des flags de conversation par chat pour le client connecté.
 * Table attendue: chat_conversation_states (customer_id, chat_id, is_important, is_to_pay, is_to_order, is_archived, is_deleted, updated_at).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const url = new URL(request.url)
    const chatIdsRaw = url.searchParams.get('chatIds') ?? ''
    const chatIds = chatIdsRaw
      .split(',')
      .map((x) => x.trim())
      .filter((x) => UUID_REGEX.test(x))

    if (chatIds.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const { data, error } = await supabase
      .from('chat_conversation_states')
      .select('chat_id,is_important,is_to_pay,is_to_order,is_archived,is_deleted,updated_at')
      .eq('customer_id', userId)
      .in('chat_id', chatIds)

    if (error) {
      const msg = String(error?.message ?? 'Erreur DB.')
      const hint = msg.toLowerCase().includes('does not exist') ? 'Table chat_conversation_states manquante.' : msg
      return NextResponse.json({ error: hint }, { status: 501 })
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 })
  } catch (error) {
    if (isClientAuthError(error)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
