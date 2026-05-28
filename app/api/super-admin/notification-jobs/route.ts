import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type JobChannel = 'email' | 'push'

type JobStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed'

interface NotificationJobRow {
  id: string
  channel: JobChannel
  status: JobStatus
  payload: any
  attempts: number
  last_error: string | null
  created_at: string
  updated_at: string
}

const querySchema = z.object({
  status: z.enum(['all', 'pending', 'processing', 'sent', 'delivered', 'failed']).optional(),
  channel: z.enum(['all', 'email', 'push']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
})

const retrySchema = z.object({
  id: z.string().min(1)
})

/**
 * GET /api/super-admin/notification-jobs
 * Liste la file technique `notification_jobs`.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const limit = parsed.data.limit ?? 50
    const offset = parsed.data.offset ?? 0

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('notification_jobs' as any)
      .select('id,channel,status,payload,attempts,last_error,created_at,updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (parsed.data.status && parsed.data.status !== 'all') {
      query = query.eq('status', parsed.data.status)
    }

    if (parsed.data.channel && parsed.data.channel !== 'all') {
      query = query.eq('channel', parsed.data.channel)
    }

    const { data, error, count } = await query

    if (error) {
      const msg = String(error.message ?? '')
      const isMissingTable = msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('notification_jobs')
      if (isMissingTable) {
        return NextResponse.json(
          {
            error:
              "La table 'notification_jobs' est introuvable (schema cache). Exécute le SQL de création de la table dans Supabase, puis rafraîchis le cache (attends 30-60s) et réessaie."
          },
          { status: 400 }
        )
      }

      return NextResponse.json({ error: msg || 'Erreur de lecture notification_jobs.' }, { status: 400 })
    }

    return NextResponse.json(
      {
        data: {
          items: (data ?? []) as NotificationJobRow[],
          count: count ?? (data ?? []).length
        }
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('GET /api/super-admin/notification-jobs failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/super-admin/notification-jobs
 * Relance un job (repasse à pending, reset last_error).
 */
export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json()
    const parsed = retrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('notification_jobs' as any)
      .update({ status: 'pending', last_error: null, updated_at: now })
      .eq('id', parsed.data.id)

    if (error) {
      const msg = String(error.message ?? '')
      const isMissingTable = msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('notification_jobs')
      if (isMissingTable) {
        return NextResponse.json(
          {
            error:
              "La table 'notification_jobs' est introuvable (schema cache). Exécute le SQL de création de la table dans Supabase, puis rafraîchis le cache (attends 30-60s) et réessaie."
          },
          { status: 400 }
        )
      }

      return NextResponse.json({ error: msg || 'Erreur de mise à jour notification_jobs.' }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('PUT /api/super-admin/notification-jobs failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/super-admin/notification-jobs?id=...
 * Supprime un job.
 */
export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const id = (searchParams.get('id') ?? '').trim()
    if (!id) {
      return NextResponse.json({ error: 'Identifiant requis.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('notification_jobs' as any).delete().eq('id', id)

    if (error) {
      const msg = String(error.message ?? '')
      const isMissingTable = msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('notification_jobs')
      if (isMissingTable) {
        return NextResponse.json(
          {
            error:
              "La table 'notification_jobs' est introuvable (schema cache). Exécute le SQL de création de la table dans Supabase, puis rafraîchis le cache (attends 30-60s) et réessaie."
          },
          { status: 400 }
        )
      }

      return NextResponse.json({ error: msg || 'Erreur de suppression notification_jobs.' }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('DELETE /api/super-admin/notification-jobs failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
