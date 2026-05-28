import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type AutomationEventRow = {
  id: string
  source: string | null
  event_type: string
  entity_type: string | null
  entity_id: string | null
  actor_user_id: string | null
  payload: Record<string, unknown> | null
  created_at: string | null
}

const listQuerySchema = z.object({
  event_type: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
})

/**
 * GET /api/super-admin/automation-events
 * Liste les événements d'automatisation (table `automation_events`) pour le super-admin.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = listQuerySchema.safeParse({
      event_type: searchParams.get('event_type') ?? undefined,
      entity_type: searchParams.get('entity_type') ?? undefined,
      entity_id: searchParams.get('entity_id') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const limit = parsed.data.limit ?? 100
    const offset = parsed.data.offset ?? 0

    let query = supabase
      .from('automation_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (parsed.data.event_type && parsed.data.event_type.trim()) {
      query = query.eq('event_type', parsed.data.event_type.trim())
    }

    if (parsed.data.entity_type && parsed.data.entity_type.trim()) {
      query = query.eq('entity_type', parsed.data.entity_type.trim())
    }

    if (parsed.data.entity_id) {
      query = query.eq('entity_id', parsed.data.entity_id)
    }

    const { data, error, count } = await query.returns<AutomationEventRow[]>()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      count: typeof count === 'number' ? count : (data ?? []).length
    })
  } catch (error) {
    console.error('GET /api/super-admin/automation-events failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des événements.'
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
