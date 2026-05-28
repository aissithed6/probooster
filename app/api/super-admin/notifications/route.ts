import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import {
  createInAppNotificationsAdmin,
  deleteInAppNotificationAdmin,
  fetchSuperAdminNotifications,
  markInAppNotificationReadAdmin
} from '@/app/api/super-admin/_helpers/notifications'
import { fetchSettingsAdmin } from '@/app/api/super-admin/_helpers/settings'

const querySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['all', 'read', 'unread']).optional(),
  priority: z.enum(['all', 'low', 'medium', 'high', 'critical']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
})

const createSchema = z
  .object({
    userIds: z.array(z.string().min(1)).min(1).optional(),
    recipientEmail: z.string().optional(),
    recipientEmails: z.string().optional(),
    channel: z.enum(['in-app', 'email', 'push']).optional(),
    title: z.string().min(1),
    message: z.string().min(1),
    type: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    actionUrl: z.string().nullable().optional()
  })
  .refine((value) => Boolean((value.userIds && value.userIds.length > 0) || value.recipientEmail || value.recipientEmails), {
    message: 'Fournissez soit userIds soit recipientEmail/recipientEmails.'
  })

const updateSchema = z
  .object({
    id: z.string().min(1),
    action: z.enum(['mark_read', 'update']),
    title: z.string().min(1).optional(),
    message: z.string().min(1).optional(),
    type: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    actionUrl: z.string().nullable().optional()
  })
  .refine(
    (value) => (value.action === 'mark_read' ? true : Boolean(value.title || value.message || value.type || value.priority || value.actionUrl !== undefined)),
    {
      message: "Pour l'action update, fournissez au moins un champ à modifier."
    }
  )

/**
 * GET /api/super-admin/notifications
 * Liste des notifications (in-app) issues de la DB.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const { data } = parsed
    const result = await fetchSuperAdminNotifications({
      q: data.q,
      status: data.status ?? 'all',
      priority: data.priority ?? 'all',
      limit: data.limit ?? 50,
      offset: data.offset ?? 0
    })

    return NextResponse.json({ data: result }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('GET /api/super-admin/notifications failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/super-admin/notifications
 * Crée des notifications in-app (DB) pour une liste d'utilisateurs.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const resolvedUserIds: string[] = Array.isArray(parsed.data.userIds) ? parsed.data.userIds : []
    const channel = parsed.data.channel ?? 'in-app'

    {
      const globalSettings = await fetchSettingsAdmin(['global'])
      const settings = (globalSettings?.[0]?.settings ?? {}) as any
      const integrations = settings?.superAdminNotifications?.globalNotifications?.integrations
      const isEnabled = (key: 'inApp' | 'email' | 'push') => {
        const v = integrations?.[key]
        return typeof v === 'boolean' ? v : true
      }

      if (channel === 'in-app' && !isEnabled('inApp')) {
        return NextResponse.json({ error: 'Le canal In-App est désactivé par la configuration globale.' }, { status: 400 })
      }
      if (channel === 'email' && !isEnabled('email')) {
        return NextResponse.json({ error: 'Le canal Email est désactivé par la configuration globale.' }, { status: 400 })
      }
      if (channel === 'push' && !isEnabled('push')) {
        return NextResponse.json({ error: 'Le canal Push est désactivé par la configuration globale.' }, { status: 400 })
      }
    }

    const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, (m) => `\\${m}`)

    /**
     * Parse une liste d'emails (séparateurs: virgule, point-virgule, espace, saut de ligne).
     */
    const parseEmailList = (raw: string): string[] => {
      return raw
        .split(/[\s,;]+/g)
        .map((v) => v.trim())
        .filter(Boolean)
    }

    const rawEmails = [parsed.data.recipientEmails, parsed.data.recipientEmail].filter(Boolean).join(',')
    const emailList = rawEmails ? parseEmailList(rawEmails).map((e) => e.toLowerCase()) : []

    let lookedUpUsersByEmail: Array<{ id: string; email: string | null }> = []

    if (resolvedUserIds.length === 0 && emailList.length > 0) {
      const { getSupabaseAdmin } = await import('@/lib/supabase')
      const supabase = getSupabaseAdmin()

      const uniqueEmails = Array.from(new Set(emailList.map((e) => String(e ?? '').trim()).filter(Boolean)))
      const orClause = uniqueEmails
        .map((email) => `email.ilike.${escapeLikePattern(email)}`)
        .join(',')

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id,email')
        .or(orClause)

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 400 })
      }

      const found = (usersData ?? []) as Array<{ id: string; email: string | null }>
      lookedUpUsersByEmail = found
      const foundEmails = new Set(found.map((u) => (u.email ?? '').toLowerCase()).filter(Boolean))
      const missing = uniqueEmails.filter((e) => !foundEmails.has(e.toLowerCase()))
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Aucun utilisateur trouvé pour: ${missing.join(', ')}` },
          { status: 404 }
        )
      }

      found.forEach((u) => {
        if (u?.id) resolvedUserIds.push(String(u.id))
      })
    }

    /**
     * Enqueue un job technique (email/push) dans `notification_jobs`.
     */
    const enqueueNotificationJob = async (payload: { channel: 'email' | 'push'; payload: any }) => {
      const { getSupabaseAdmin } = await import('@/lib/supabase')
      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from('notification_jobs' as any)
        .insert({ channel: payload.channel, status: 'pending', payload: payload.payload })

      if (error) {
        throw new Error(`Enqueue job échoué: ${error.message}`)
      }
    }

    const inserted = await createInAppNotificationsAdmin({
      userIds: resolvedUserIds,
      title: parsed.data.title,
      message: parsed.data.message,
      type: parsed.data.type,
      priority: parsed.data.priority,
      actionUrl: parsed.data.actionUrl
    })

    if (channel === 'email') {
      const { getSupabaseAdmin } = await import('@/lib/supabase')
      const supabase = getSupabaseAdmin()

      const usersData = lookedUpUsersByEmail.length
        ? lookedUpUsersByEmail.filter((u) => resolvedUserIds.includes(String(u.id)))
        : (
            (
              await supabase
                .from('users')
                .select('id,email')
                .in('id', resolvedUserIds)
            ).data ??
            []
          )

      const emails = (usersData ?? [])
        .map((u: any) => (u?.email ? String(u.email).trim() : ''))
        .filter(Boolean)

      const to = emails.length > 0 ? emails.join(',') : emailList.join(',')
      if (!to) {
        throw new Error('Aucun email destinataire résolu pour le canal email.')
      }

      await enqueueNotificationJob({
        channel: 'email',
        payload: {
          to,
          subject: parsed.data.title,
          text: parsed.data.message
        }
      })
    }

    if (channel === 'push') {
      await enqueueNotificationJob({
        channel: 'push',
        payload: {
          headings: { en: parsed.data.title },
          contents: { en: parsed.data.message },
          include_external_user_ids: resolvedUserIds
        }
      })
    }

    return NextResponse.json({ data: { inserted } }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('POST /api/super-admin/notifications failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/super-admin/notifications
 * Actions sur une notification.
 */
export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    if (parsed.data.action === 'mark_read') {
      await markInAppNotificationReadAdmin(parsed.data.id)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (parsed.data.action === 'update') {
      const { getSupabaseAdmin } = await import('@/lib/supabase')
      const supabase = getSupabaseAdmin()
      const patch: Record<string, any> = {}
      if (typeof parsed.data.title === 'string') patch.title = parsed.data.title
      if (typeof parsed.data.message === 'string') patch.message = parsed.data.message
      if (typeof parsed.data.type === 'string') patch.type = parsed.data.type
      if (typeof parsed.data.priority === 'string') patch.priority = parsed.data.priority
      if (parsed.data.actionUrl !== undefined) patch.action_url = parsed.data.actionUrl

      const { error: updateError } = await supabase.from('user_notifications').update(patch).eq('id', parsed.data.id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      return NextResponse.json({ success: true }, { status: 200 })
    }

    return NextResponse.json({ error: 'Action non supportée.' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('PUT /api/super-admin/notifications failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/super-admin/notifications?id=...
 * Suppression d'une notification in-app.
 */
export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const id = (searchParams.get('id') ?? '').trim()
    if (!id) {
      return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 })
    }

    await deleteInAppNotificationAdmin(id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('DELETE /api/super-admin/notifications failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
