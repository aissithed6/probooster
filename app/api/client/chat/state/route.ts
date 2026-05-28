import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type UpdateChatStateBody = {
  chatId?: string
  isImportant?: boolean
  isToPay?: boolean
  isToOrder?: boolean
  isArchived?: boolean
  isDeleted?: boolean
}

/**
 * POST /api/client/chat/state
 * Upsert des flags de conversation pour le client connecté.
 * Table attendue: chat_conversation_states.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => null)) as UpdateChatStateBody | null
    const chatId = String(body?.chatId ?? '').trim()

    if (!UUID_REGEX.test(chatId)) {
      return NextResponse.json({ error: 'Conversation invalide.' }, { status: 400 })
    }

    const payload: any = {
      customer_id: userId,
      chat_id: chatId,
      updated_at: new Date().toISOString()
    }

    if (typeof body?.isImportant === 'boolean') payload.is_important = body.isImportant
    if (typeof body?.isToPay === 'boolean') payload.is_to_pay = body.isToPay
    if (typeof body?.isToOrder === 'boolean') payload.is_to_order = body.isToOrder
    if (typeof body?.isArchived === 'boolean') payload.is_archived = body.isArchived
    if (typeof body?.isDeleted === 'boolean') payload.is_deleted = body.isDeleted

    const { data, error } = await supabase
      .from('chat_conversation_states')
      .upsert(payload, { onConflict: 'customer_id,chat_id' })
      .select('chat_id,is_important,is_to_pay,is_to_order,is_archived,is_deleted,updated_at')
      .maybeSingle()

    if (error) {
      const msg = String(error?.message ?? 'Erreur DB.')
      const hint = msg.toLowerCase().includes('does not exist') ? 'Table chat_conversation_states manquante.' : msg
      return NextResponse.json({ error: hint }, { status: 501 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    if (isClientAuthError(error)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
