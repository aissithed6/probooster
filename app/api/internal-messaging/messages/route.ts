import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

import { getSupabaseAdmin } from '@/lib/supabase'

const buildUnauthorizedResponse = () =>
  NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })

const resolveAccessToken = (cookieStore: Awaited<ReturnType<typeof cookies>>, headerList: Awaited<ReturnType<typeof headers>>) => {
  const direct = cookieStore.get('sb-access-token')?.value
  if (direct) return direct

  try {
    const allCookies = (cookieStore as any).getAll?.() ?? []
    for (const cookie of allCookies as Array<{ name: string; value: string }>) {
      const name = cookie?.name ?? ''
      const value = cookie?.value
      if (!name || typeof value !== 'string' || value.length === 0) continue
      if (name.startsWith('sb-') && name.endsWith('-access-token')) {
        return value
      }
    }
  } catch {
    // ignore
  }

  const authHeader = headerList.get('authorization') || headerList.get('Authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() || null : null
  return headerToken
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const headerList = await headers()

  const accessToken = resolveAccessToken(cookieStore, headerList)

  if (!accessToken) {
    return buildUnauthorizedResponse()
  }
  const supabase = getSupabaseAdmin()
  const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken)

  if (userError || !userResult?.user) {
    return buildUnauthorizedResponse()
  }

  const currentUserId = userResult.user.id

  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') ?? 'all'
  const status = searchParams.get('status') ?? 'active'
  const limitParam = searchParams.get('limit')
  const userIdParam = searchParams.get('userId')

  if (userIdParam && userIdParam !== currentUserId) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  const parsedLimit = limitParam ? Number(limitParam) : undefined
  const limit = parsedLimit && Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 200)) : undefined

  let query = supabase
    .from('user_messages')
    .select('*')
    .order('created_at', { ascending: false })

  switch (scope) {
    case 'received':
      query = query.eq('recipient_id', currentUserId)
      break
    case 'sent':
      query = query.eq('sender_id', currentUserId)
      break
    default:
      query = query.or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      break
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('GET /api/internal-messaging/messages failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des messages.' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

/**
 * Met à jour l'état des messages internes (lecture/archivage/suppression).
 */
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const headerList = await headers()

  const accessToken = resolveAccessToken(cookieStore, headerList)

  if (!accessToken) {
    return buildUnauthorizedResponse()
  }

  const supabase = getSupabaseAdmin()
  const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken)

  if (userError || !userResult?.user) {
    return buildUnauthorizedResponse()
  }

  const currentUserId = userResult.user.id

  const normalizeRole = (raw: unknown) =>
    String(raw ?? '')
      .toLowerCase()
      .replace(/-/g, '_')
      .trim()

  try {
    const body = (await request.json()) as {
      action?: 'mark_read' | 'mark_all_read' | 'update_status' | 'toggle_important' | 'update_message'
      messageId?: string
      status?: 'active' | 'archived' | 'deleted'
      isImportant?: boolean
      subject?: string
      content?: string
      category?: 'support' | 'technical' | 'billing' | 'general' | 'account' | string
      priority?: 'low' | 'normal' | 'high' | 'urgent' | 'medium'
    }

    switch (body.action) {
      case 'mark_read': {
        const messageId = String(body.messageId ?? '').trim()
        if (!messageId) {
          return NextResponse.json({ error: 'messageId requis.' }, { status: 400 })
        }

        const { data: row, error: fetchError } = await supabase
          .from('user_messages')
          .select('id,recipient_id')
          .eq('id', messageId)
          .single()

        if (fetchError || !row) {
          return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 })
        }

        if (row.recipient_id !== currentUserId) {
          return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
        }

        const { error } = await supabase
          .from('user_messages')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('id', messageId)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      case 'mark_all_read': {
        const { error } = await supabase
          .from('user_messages')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('recipient_id', currentUserId)
          .eq('is_read', false)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      case 'update_status': {
        const messageId = String(body.messageId ?? '').trim()
        const status = body.status

        if (!messageId || (status !== 'active' && status !== 'archived' && status !== 'deleted')) {
          return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
        }

        const { data: row, error: fetchError } = await supabase
          .from('user_messages')
          .select('id,sender_id,recipient_id')
          .eq('id', messageId)
          .single()

        if (fetchError || !row) {
          return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 })
        }

        if (row.sender_id !== currentUserId && row.recipient_id !== currentUserId) {
          return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
        }

        const { error } = await supabase
          .from('user_messages')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', messageId)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      case 'toggle_important': {
        const messageId = String(body.messageId ?? '').trim()
        if (!messageId) {
          return NextResponse.json({ error: 'messageId requis.' }, { status: 400 })
        }

        const { data: row, error: fetchError } = await supabase
          .from('user_messages')
          .select('id,sender_id,recipient_id,is_important')
          .eq('id', messageId)
          .single()

        if (fetchError || !row) {
          return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 })
        }

        if (row.sender_id !== currentUserId && row.recipient_id !== currentUserId) {
          return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
        }

        const desired = typeof body.isImportant === 'boolean' ? body.isImportant : !Boolean((row as any)?.is_important)

        const { data: updated, error } = await supabase
          .from('user_messages')
          .update({ is_important: desired, updated_at: new Date().toISOString() })
          .eq('id', messageId)
          .select('*')
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: updated })
      }

      case 'update_message': {
        const messageId = String(body.messageId ?? '').trim()
        if (!messageId) {
          return NextResponse.json({ error: 'messageId requis.' }, { status: 400 })
        }

        const { data: row, error: fetchError } = await supabase
          .from('user_messages')
          .select('id,sender_id')
          .eq('id', messageId)
          .single()

        if (fetchError || !row) {
          return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 })
        }

        if (row.sender_id !== currentUserId) {
          return NextResponse.json({ error: "Seul l'expéditeur peut modifier ce message." }, { status: 403 })
        }

        const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
        const content = typeof body.content === 'string' ? body.content.trim() : ''

        if (!subject || !content) {
          return NextResponse.json({ error: 'subject et content sont requis.' }, { status: 400 })
        }

        const priority = (() => {
          const raw = String(body?.priority ?? 'normal').toLowerCase().trim()
          if (raw === 'low') return 'low'
          if (raw === 'high') return 'high'
          if (raw === 'urgent') return 'urgent'
          if (raw === 'medium') return 'normal'
          return 'normal'
        })()

        const category = (() => {
          const raw = String(body?.category ?? 'general').toLowerCase().trim()
          if (raw === 'support') return 'support'
          if (raw === 'technical') return 'technical'
          if (raw === 'billing') return 'billing'
          if (raw === 'account') return 'account'
          return 'general'
        })()

        const { data: updated, error } = await supabase
          .from('user_messages')
          .update({ subject, content, priority, category, updated_at: new Date().toISOString() })
          .eq('id', messageId)
          .select('*')
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: updated })
      }

      default:
        return NextResponse.json({ error: 'Action non supportée.' }, { status: 400 })
    }
  } catch (error) {
    console.error('PATCH /api/internal-messaging/messages failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Envoie un message interne (client/vendeur -> admin/super-admin ou réponses).
 * Le contrôle d'accès est appliqué côté serveur pour éviter les échecs RLS côté navigateur.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const headerList = await headers()

  const accessToken = resolveAccessToken(cookieStore, headerList)

  if (!accessToken) {
    return buildUnauthorizedResponse()
  }

  const supabase = getSupabaseAdmin()
  const { data: userResult, error: userError } = await supabase.auth.getUser(accessToken)

  if (userError || !userResult?.user) {
    return buildUnauthorizedResponse()
  }

  const currentUserId = userResult.user.id

  try {
    const body = (await request.json()) as {
      recipientId?: string
      subject?: string
      content?: string
      priority?: 'low' | 'normal' | 'high' | 'urgent' | 'medium'
      category?: 'support' | 'technical' | 'billing' | 'general' | 'account' | string
      type?: 'internal' | 'support'
      parentMessageId?: string | null
    }

    const recipientId = String(body?.recipientId ?? '').trim()
    const subject = String(body?.subject ?? '').trim()
    const content = String(body?.content ?? '').trim()
    const type = body?.type === 'support' ? 'support' : 'internal'

    if (!recipientId || !subject || !content) {
      return NextResponse.json({ error: 'Champs requis manquants (recipientId, subject, content).' }, { status: 400 })
    }

    const priority = (() => {
      const raw = String(body?.priority ?? 'normal').toLowerCase().trim()
      if (raw === 'low') return 'low'
      if (raw === 'high') return 'high'
      if (raw === 'urgent') return 'urgent'
      if (raw === 'medium') return 'normal'
      return 'normal'
    })()

    const category = (() => {
      const raw = String(body?.category ?? 'general').toLowerCase().trim()
      if (raw === 'support') return 'support'
      if (raw === 'technical') return 'technical'
      if (raw === 'billing') return 'billing'
      if (raw === 'account') return 'account'
      return 'general'
    })()

    const parentMessageId = body?.parentMessageId ? String(body.parentMessageId).trim() : null

    // Si c'est une initiation (pas de parentMessageId), appliquer les règles métier:
    // - client/vendor: uniquement vers admin/super_admin
    // - admin/super_admin: peut initier vers tout le monde
    if (!parentMessageId) {
      const { data: senderRow, error: senderError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUserId)
        .maybeSingle()

      if (senderError) {
        console.error('POST /api/internal-messaging/messages failed to load sender role:', senderError)
        return NextResponse.json({ error: "Impossible de vérifier l'expéditeur." }, { status: 500 })
      }

      const senderRole = normalizeRole((senderRow as any)?.role)

      if (senderRole !== 'admin' && senderRole !== 'super_admin') {
        const { data: recipientRow, error: recipientError } = await supabase
          .from('users')
          .select('role')
          .eq('id', recipientId)
          .maybeSingle()

        if (recipientError) {
          console.error('POST /api/internal-messaging/messages failed to load recipient role:', recipientError)
          return NextResponse.json({ error: 'Impossible de vérifier le destinataire.' }, { status: 500 })
        }

        const recipientRole = normalizeRole((recipientRow as any)?.role)
        if (recipientRole !== 'admin' && recipientRole !== 'super_admin') {
          return NextResponse.json({ error: "Vous ne pouvez envoyer un message qu'à l'administration." }, { status: 403 })
        }
      }
    }

    const { data, error } = await supabase
      .from('user_messages')
      .insert({
        sender_id: currentUserId,
        recipient_id: recipientId,
        subject,
        content,
        type,
        priority,
        category,
        parent_message_id: parentMessageId,
        is_read: false,
        status: 'active'
      })
      .select('*')
      .single()

    if (error) {
      console.error('POST /api/internal-messaging/messages insert failed:', error)
      return NextResponse.json({ error: error.message || "Erreur lors de l'envoi du message." }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/internal-messaging/messages failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de l'envoi du message."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
