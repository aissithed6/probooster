import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import {
  markAllMessagesAsReadAdmin,
  markMessageAsReadAdmin,
  sendInternalMessageAdmin,
  updateMessageStatusAdmin
} from '@/app/api/super-admin/_helpers/messages'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { SuperAdminInboxMessage } from '@/lib/services/super-admin-dashboard-service'

const MESSAGE_STATUS_VALUES: SuperAdminInboxMessage['status'][] = ['active', 'archived', 'deleted']
const MESSAGE_PRIORITY_VALUES: SuperAdminInboxMessage['priority'][] = ['low', 'medium', 'high']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const recipientId = searchParams.get('recipientId')
  const limitParam = searchParams.get('limit')
  const statusParam = searchParams.get('status')

  if (!recipientId) {
    return NextResponse.json({ error: 'Paramètre "recipientId" requis.' }, { status: 400 })
  }

  const limit = limitParam ? Math.max(1, Number(limitParam) || 1) : 50
  const statusFilter = statusParam && MESSAGE_STATUS_VALUES.includes(statusParam as any) ? statusParam : undefined

  const supabase = getSupabaseAdmin()

  try {
    await assertSuperAdmin(request)
    let query = supabase
      .from('user_messages')
      .select(
        'id,sender_id,recipient_id,subject,content,type,priority,status,is_read,parent_message_id,created_at'
      )
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const rows = (data ?? []) as any[]
    const senderIds = Array.from(new Set(rows.map((row: any) => row.sender_id).filter(Boolean))) as string[]

    const senderMap: Record<string, { name: string; email: string; role: string | null }> = {}

    if (senderIds.length > 0) {
      const { data: senders, error: sendersError } = await supabase
        .from('users')
        .select('id,email,role,user_profiles(first_name,last_name)')
        .in('id', senderIds)

      if (sendersError) {
        console.error('GET /api/super-admin/messages failed to load senders:', sendersError)
      } else if (senders) {
        for (const sender of senders as any[]) {
          const profile = Array.isArray(sender.user_profiles)
            ? sender.user_profiles[0]
            : sender.user_profiles

          const nameParts = [profile?.first_name, profile?.last_name].filter(Boolean)
          const name = nameParts.length > 0 ? nameParts.join(' ') : sender.email

          senderMap[sender.id] = {
            name,
            email: sender.email,
            role: sender.role ?? null
          }
        }
      }
    }

    const messages = rows.map<SuperAdminInboxMessage>((row: any) => {
      const senderInfo = row.sender_id ? senderMap[row.sender_id] : undefined

      const priority = (() => {
        switch (row.priority) {
          case 'urgent':
          case 'high':
            return 'high'
          case 'low':
            return 'low'
          case 'normal':
          default:
            return 'medium'
        }
      })()

      return {
        id: row.id,
        senderId: row.sender_id ?? null,
        recipientId: row.recipient_id ?? recipientId,
        from: senderInfo?.name ?? 'Expéditeur inconnu',
        fromEmail: senderInfo?.email ?? 'inconnu@probooster.com',
        fromRole: senderInfo?.role ?? null,
        subject: row.subject ?? '(Sans objet)',
        message: row.content ?? '',
        timestamp: row.created_at,
        priority,
        category: row.type ?? null,
        isRead: Boolean(row.is_read),
        status: (row.status as SuperAdminInboxMessage['status']) ?? 'active',
        parentMessageId: row.parent_message_id ?? null
      }
    })

    return NextResponse.json({ data: messages })
  } catch (error) {
    console.error('GET /api/super-admin/messages failed:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des messages.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const body = (await request.json()) as {
      action?: 'mark_read' | 'mark_all_read' | 'update_status'
      messageId?: string
      recipientId?: string
      status?: SuperAdminInboxMessage['status']
    }

    switch (body.action) {
      case 'mark_read': {
        if (!body.messageId) {
          return NextResponse.json({ error: 'messageId requis pour mark_read.' }, { status: 400 })
        }
        await markMessageAsReadAdmin(body.messageId)
        return NextResponse.json({ success: true })
      }
      case 'mark_all_read': {
        if (!body.recipientId) {
          return NextResponse.json({ error: 'recipientId requis pour mark_all_read.' }, { status: 400 })
        }
        await markAllMessagesAsReadAdmin(body.recipientId)
        return NextResponse.json({ success: true })
      }
      case 'update_status': {
        if (!body.messageId || !body.status || !MESSAGE_STATUS_VALUES.includes(body.status)) {
          return NextResponse.json({ error: 'Paramètres invalides pour update_status.' }, { status: 400 })
        }
        await updateMessageStatusAdmin(body.messageId, body.status)
        return NextResponse.json({ success: true })
      }
      default:
        return NextResponse.json({ error: 'Action PATCH non supportée.' }, { status: 400 })
    }
  } catch (error) {
    console.error('PATCH /api/super-admin/messages failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour des messages.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const body = (await request.json()) as {
      senderId?: string | null
      recipientId?: string
      subject?: string
      message?: string
      priority?: SuperAdminInboxMessage['priority']
      category?: string | null
      parentMessageId?: string | null
    }

    if (!body?.recipientId || !body?.subject || !body?.message) {
      return NextResponse.json({ error: 'Champs requis manquants (recipientId, subject, message).' }, { status: 400 })
    }

    if (body.priority && !MESSAGE_PRIORITY_VALUES.includes(body.priority)) {
      return NextResponse.json({ error: 'Priorité de message invalide.' }, { status: 400 })
    }

    await sendInternalMessageAdmin({
      senderId: body.senderId ?? null,
      recipientId: body.recipientId,
      subject: body.subject,
      content: body.message,
      priority: body.priority ?? 'medium',
      category: body.category ?? null,
      parentMessageId: body.parentMessageId ?? null
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/messages failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de l'envoi du message."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
