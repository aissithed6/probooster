import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Retourne les messages d'une conversation chat (chat_messages) pour supervision Super Admin.
 * Supporte également une action de modération simple: "soft delete" d'un message.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ chatId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { chatId } = await context.params

    if (!chatId) {
      return NextResponse.json({ error: 'Paramètre chatId manquant.' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(500, Number(limitParam) || 200)) : 200

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id,chat_id,sender_id,content,message_type,is_read,created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      throw error
    }

    const rows = (data ?? []) as any[]
    const senderIds = Array.from(new Set(rows.map((r) => r.sender_id).filter(Boolean))) as string[]

    const senderMap: Record<string, { name: string; email: string; role: string | null }> = {}

    if (senderIds.length > 0) {
      const { data: senders, error: senderError } = await supabase
        .from('users')
        .select('id,email,role,user_profiles(first_name,last_name)')
        .in('id', senderIds)

      if (senderError) {
        console.warn('GET /api/super-admin/chats/[chatId]/messages: sender lookup failed:', senderError)
      } else {
        for (const sender of senders ?? []) {
          const profile = Array.isArray((sender as any).user_profiles)
            ? (sender as any).user_profiles[0]
            : (sender as any).user_profiles
          const nameParts = [profile?.first_name, profile?.last_name].filter(Boolean)
          const name = nameParts.length > 0 ? nameParts.join(' ') : String((sender as any).email ?? 'Utilisateur')
          senderMap[String((sender as any).id)] = {
            name,
            email: String((sender as any).email ?? ''),
            role: (sender as any).role ?? null
          }
        }
      }
    }

    const payload = rows.map((row) => {
      const senderInfo = row.sender_id ? senderMap[String(row.sender_id)] : undefined
      return {
        id: String(row.id),
        chatId: String(row.chat_id),
        senderId: String(row.sender_id),
        senderName: senderInfo?.name ?? 'Utilisateur',
        senderRole: senderInfo?.role ?? null,
        content: String(row.content ?? ''),
        messageType: String(row.message_type ?? 'text'),
        isRead: Boolean(row.is_read),
        createdAt: String(row.created_at)
      }
    })

    return NextResponse.json({ data: payload })
  } catch (error) {
    console.error('GET /api/super-admin/chats/[chatId]/messages failed:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des messages du chat.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ chatId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { chatId } = await context.params

    if (!chatId) {
      return NextResponse.json({ error: 'Paramètre chatId manquant.' }, { status: 400 })
    }

    const body = (await request.json()) as { action?: 'soft_delete' | 'hard_delete'; messageId?: string }

    if ((body?.action !== 'soft_delete' && body?.action !== 'hard_delete') || !body?.messageId) {
      return NextResponse.json({ error: 'Action PATCH non supportée.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    if (body.action === 'hard_delete') {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', body.messageId)
        .eq('chat_id', chatId)

      if (error) {
        throw error
      }
    } else {
      // Soft delete: on remplace le contenu par un message neutre, sans casser l'historique.
      const { error } = await supabase
        .from('chat_messages')
        .update({
          content: '[Message supprimé par la modération]',
          message_type: 'system'
        })
        .eq('id', body.messageId)
        .eq('chat_id', chatId)

      if (error) {
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/super-admin/chats/[chatId]/messages failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la modération du message.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ chatId: string }> }) {
  try {
    const userId = await assertSuperAdmin(request)
    const { chatId } = await context.params

    if (!chatId) {
      return NextResponse.json({ error: 'Paramètre chatId manquant.' }, { status: 400 })
    }

    const body = (await request.json()) as { content?: string; messageType?: string }
    const content = String(body?.content ?? '').trim()
    if (!content) {
      return NextResponse.json({ error: 'Contenu manquant.' }, { status: 400 })
    }

    const messageType = String(body?.messageType ?? 'text').trim() || 'text'

    const supabase = getSupabaseAdmin()

    const { data: inserted, error: insertErr } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: userId,
        content,
        message_type: messageType,
        is_read: false
      })
      .select('id,chat_id,sender_id,content,message_type,is_read,created_at')
      .maybeSingle()

    if (insertErr) {
      throw insertErr
    }

    // Best-effort: met à jour la session pour refléter une activité récente.
    try {
      await supabase.from('user_chats').update({ last_message_at: new Date().toISOString() }).eq('id', chatId)
    } catch {
      // ignore
    }

    return NextResponse.json({ data: inserted })
  } catch (error) {
    console.error('POST /api/super-admin/chats/[chatId]/messages failed:', error)

    const message =
      typeof (error as any)?.message === 'string' && (error as any).message.trim()
        ? String((error as any).message)
        : 'Erreur lors de l\'envoi du message.'
    const details =
      typeof (error as any)?.details === 'string' && (error as any).details.trim() ? String((error as any).details) : undefined
    const hint = typeof (error as any)?.hint === 'string' && (error as any).hint.trim() ? String((error as any).hint) : undefined

    return NextResponse.json(
      {
        error: message,
        ...(details ? { details } : null),
        ...(hint ? { hint } : null)
      },
      { status: 500 }
    )
  }
}
