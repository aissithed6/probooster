import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET: Retourne les messages liés à un ticket (parent_message_id = ticketId) depuis user_messages.
 * POST: Ajoute un message interne lié à un ticket.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertSuperAdmin()
    const ticketId = params.id
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('user_messages')
      .select('id, sender_id, parent_message_id, content, created_at')
      .eq('parent_message_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    const rows = (data ?? []).map((row: any) => ({
      id: row.id,
      ticketId: row.parent_message_id,
      authorId: row.sender_id ?? null,
      message: row.content ?? '',
      visibility: 'internal' as const,
      createdAt: row.created_at
    }))

    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/super-admin/support-tickets/[id]/messages failed:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des messages du ticket.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertSuperAdmin()
    const ticketId = params.id
    const body = (await req.json().catch(() => null)) as { message?: string; authorId?: string | null; visibility?: 'internal' | 'public' }

    if (!body?.message || !body.message.trim()) {
      return NextResponse.json({ error: 'Message requis.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const insertPayload = {
      sender_id: body.authorId ?? null,
      recipient_id: null,
      subject: 'Note ticket',
      content: body.message,
      priority: 'low',
      type: 'support',
      status: 'active',
      category: body.visibility === 'public' ? 'ticket_public' : 'ticket_internal',
      parent_message_id: ticketId,
      is_read: true
    }

    const { data, error } = await supabase
      .from('user_messages')
      .insert(insertPayload)
      .select('id, sender_id, parent_message_id, content, created_at')
      .single()

    if (error || !data) {
      throw error || new Error('Insertion échouée')
    }

    const created = {
      id: data.id,
      ticketId: data.parent_message_id,
      authorId: data.sender_id ?? null,
      message: data.content ?? '',
      visibility: insertPayload.category === 'ticket_public' ? 'public' as const : 'internal' as const,
      createdAt: data.created_at
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/support-tickets/[id]/messages failed:', error)
    return NextResponse.json({ error: "Erreur lors de l'ajout du message du ticket." }, { status: 500 })
  }
}
