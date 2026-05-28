import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type CreateWarningBody = {
  userId?: string
  chatId?: string | null
  warningMessage?: string
  // Optionnel: injecter un message système dans le chat pour traçabilité côté participants.
  alsoPostSystemMessage?: boolean
}

/**
 * Création d'un avertissement (warning) pour un utilisateur.
 */
export async function POST(request: NextRequest) {
  try {
    const superAdminId = await assertSuperAdmin(request)
    const body = (await request.json()) as CreateWarningBody

    if (!body?.userId || !body?.warningMessage?.trim()) {
      return NextResponse.json({ error: 'Champs requis manquants (userId, warningMessage).' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { error: warnError } = await supabase.from('chat_user_warnings').insert({
      user_id: body.userId,
      chat_id: body.chatId ?? null,
      warning_message: body.warningMessage.trim(),
      created_by: superAdminId
    })

    if (warnError) {
      throw warnError
    }

    if (body.alsoPostSystemMessage && body.chatId) {
      const { error: msgError } = await supabase.from('chat_messages').insert({
        chat_id: body.chatId,
        sender_id: superAdminId,
        content: `⚠️ Avertissement modération: ${body.warningMessage.trim()}`,
        message_type: 'system',
        is_read: false
      })

      if (msgError) {
        throw msgError
      }

      await supabase
        .from('user_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', body.chatId)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/chat-moderation/warnings failed:', error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de l'avertissement." }, { status: 500 })
  }
}
