import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type AutomationExecutionRow = {
  id: string
  automation_id: string | null
  event_id: string | null
  status: string
  started_at: string | null
  finished_at: string | null
  duration_ms: number | null
  error_message: string | null
  output: Record<string, unknown> | null
  created_at: string | null
}

const listQuerySchema = z.object({
  automation_id: z.string().uuid().optional(),
  event_id: z.string().uuid().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
})

/**
 * GET /api/super-admin/automation-executions
 * Liste les exécutions d'automatisation (table `automation_executions`) pour le super-admin.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = listQuerySchema.safeParse({
      automation_id: searchParams.get('automation_id') ?? undefined,
      event_id: searchParams.get('event_id') ?? undefined,
      status: searchParams.get('status') ?? undefined,
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
      .from('automation_executions')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (parsed.data.automation_id) {
      query = query.eq('automation_id', parsed.data.automation_id)
    }

    if (parsed.data.event_id) {
      query = query.eq('event_id', parsed.data.event_id)
    }

    if (parsed.data.status && parsed.data.status.trim()) {
      query = query.eq('status', parsed.data.status.trim())
    }

    const { data, error, count } = await query.returns<AutomationExecutionRow[]>()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      count: typeof count === 'number' ? count : (data ?? []).length
    })
  } catch (error) {
    console.error('GET /api/super-admin/automation-executions failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des exécutions.'
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
