import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type ChatRow = {
  id: string
  participant1_id: string
  participant2_id: string
  last_message_at: string | null
  is_active: boolean | null
  created_at: string
}

type UserRow = {
  id: string
  email: string
  role: string | null
  user_profiles?:
    | Array<{ first_name: string | null; last_name: string | null }>
    | { first_name: string | null; last_name: string | null }
    | null
}

/**
 * Retourne une liste de conversations chat (user_chats) pour supervision Super Admin.
 * Le Super Admin peut ainsi voir toutes les conversations client↔vendeur en un seul endroit.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(200, Number(limitParam) || 50)) : 50

    const supabase = getSupabaseAdmin()

    const { data: chats, error } = await supabase
      .from('user_chats')
      .select('id,participant1_id,participant2_id,last_message_at,is_active,created_at')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    const rows = (chats ?? []) as ChatRow[]
    const userIds = Array.from(
      new Set(rows.flatMap((c) => [c.participant1_id, c.participant2_id]).filter(Boolean))
    ) as string[]

    const usersById: Record<string, { id: string; email: string; role: string | null; name: string }> = {}

    if (userIds.length > 0) {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id,email,role,user_profiles(first_name,last_name)')
        .in('id', userIds)

      if (userError) {
        console.warn('GET /api/super-admin/chats: impossible de charger les participants:', userError)
      } else {
        const typed = (users ?? []) as UserRow[]
        for (const u of typed) {
          const profile = Array.isArray(u.user_profiles) ? u.user_profiles[0] : u.user_profiles
          const nameParts = [profile?.first_name, profile?.last_name].filter(Boolean)
          const name = nameParts.length > 0 ? nameParts.join(' ') : u.email
          usersById[u.id] = { id: u.id, email: u.email, role: u.role ?? null, name }
        }
      }
    }

    // Charger un aperçu du dernier message par chat (si présent)
    const lastMessageByChat: Record<string, { content: string; created_at: string; sender_id: string } | null> = {}
    rows.forEach((r) => {
      lastMessageByChat[r.id] = null
    })

    if (rows.length > 0) {
      const chatIds = rows.map((c) => c.id)
      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('id,chat_id,sender_id,content,created_at')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })
        .limit(rows.length * 2)

      if (msgError) {
        console.warn('GET /api/super-admin/chats: impossible de charger les derniers messages:', msgError)
      } else {
        for (const msg of messages ?? []) {
          const chatId = String((msg as any).chat_id)
          if (!lastMessageByChat[chatId]) {
            lastMessageByChat[chatId] = {
              content: String((msg as any).content ?? ''),
              created_at: String((msg as any).created_at ?? ''),
              sender_id: String((msg as any).sender_id ?? '')
            }
          }
        }
      }
    }

    const payload = rows.map((chat) => {
      const p1 = usersById[chat.participant1_id]
      const p2 = usersById[chat.participant2_id]
      const last = lastMessageByChat[chat.id]
      const lastSender = last?.sender_id ? usersById[last.sender_id] : undefined

      return {
        id: chat.id,
        participant1: p1 ?? { id: chat.participant1_id, name: 'Utilisateur', email: '', role: null },
        participant2: p2 ?? { id: chat.participant2_id, name: 'Utilisateur', email: '', role: null },
        isActive: Boolean(chat.is_active ?? true),
        createdAt: chat.created_at,
        lastMessageAt: chat.last_message_at,
        lastMessagePreview: last?.content ? String(last.content).slice(0, 140) : '',
        lastMessageSenderName: lastSender?.name ?? null,
        lastMessageCreatedAt: last?.created_at ?? null
      }
    })

    return NextResponse.json({ data: payload })
  } catch (error) {
    console.error('GET /api/super-admin/chats failed:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des conversations.' }, { status: 500 })
  }
}
