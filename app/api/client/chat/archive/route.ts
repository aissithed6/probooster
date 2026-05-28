import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ArchiveChatBody = {
  chatId?: string
}

/**
 * POST /api/client/chat/archive
 * Archive (soft) une conversation pour le client connecté.
 * Implémentation: user_chats.is_active=false (aucune suppression).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => null)) as ArchiveChatBody | null
    const chatId = String(body?.chatId ?? '').trim()

    if (!UUID_REGEX.test(chatId)) {
      return NextResponse.json({ error: 'Conversation invalide.' }, { status: 400 })
    }

    const { data: chatRow, error: chatError } = await supabase
      .from('user_chats')
      .select('id,participant1_id,participant2_id,is_active')
      .eq('id', chatId)
      .maybeSingle()

    if (chatError) {
      return NextResponse.json({ error: chatError.message }, { status: 500 })
    }

    if (!chatRow?.id) {
      return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 })
    }

    const p1 = String((chatRow as any).participant1_id ?? '').trim()
    const p2 = String((chatRow as any).participant2_id ?? '').trim()

    if (p1 !== userId && p2 !== userId) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('user_chats')
      .update({ is_active: false, last_message_at: new Date().toISOString() } as any)
      .eq('id', chatId)
      .select('*')
      .maybeSingle()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: updated ?? { id: chatId, is_active: false } }, { status: 200 })
  } catch (error) {
    if (isClientAuthError(error)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }

    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
