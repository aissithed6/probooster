import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type AutomationRow = {
  id: string
  name: string
  description: string | null
  trigger_type: string
  trigger_conditions: Record<string, unknown> | null
  action_type: string
  action_config: Record<string, unknown> | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

const listQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
})

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  trigger_type: z.string().min(1),
  trigger_conditions: z.record(z.unknown()).optional().nullable(),
  action_type: z.string().min(1),
  action_config: z.record(z.unknown()).optional().nullable(),
  is_active: z.boolean().optional().nullable()
})

const deleteSchema = z.object({
  id: z.string().uuid()
})

/**
 * Liste les automatisations (table `automations`) pour le super-admin.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = listQuerySchema.safeParse({
      q: searchParams.get('q') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const limit = parsed.data.limit ?? 200
    const offset = parsed.data.offset ?? 0

    let query = supabase
      .from('automations')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (parsed.data.q && parsed.data.q.trim()) {
      const like = `%${parsed.data.q.trim()}%`
      query = query.or(`name.ilike.${like},description.ilike.${like}`)
    }

    const { data, error, count } = await query.returns<AutomationRow[]>()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data ?? [],
      count: typeof count === 'number' ? count : (data ?? []).length
    })
  } catch (error) {
    console.error('GET /api/super-admin/automations failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la récupération des automatisations."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * Crée une automatisation (table `automations`) pour le super-admin.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json().catch(() => null)
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const payload = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      trigger_type: parsed.data.trigger_type,
      trigger_conditions: parsed.data.trigger_conditions ?? null,
      action_type: parsed.data.action_type,
      action_config: parsed.data.action_config ?? null,
      is_active: typeof parsed.data.is_active === 'boolean' ? parsed.data.is_active : true
    }

    const { data, error } = await supabase
      .from('automations')
      .insert(payload)
      .select('*')
      .single()
      .returns<AutomationRow>()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Insertion échouée' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('POST /api/super-admin/automations failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la création de l'automatisation."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * Met à jour une automatisation (table `automations`) pour le super-admin.
 */
export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json().catch(() => null)
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    if (!parsed.data.id) {
      return NextResponse.json({ error: 'Champ requis manquant: id' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const payload = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      trigger_type: parsed.data.trigger_type,
      trigger_conditions: parsed.data.trigger_conditions ?? null,
      action_type: parsed.data.action_type,
      action_config: parsed.data.action_config ?? null,
      is_active: typeof parsed.data.is_active === 'boolean' ? parsed.data.is_active : null
    }

    const { data, error } = await supabase
      .from('automations')
      .update(payload)
      .eq('id', parsed.data.id)
      .select('*')
      .single()
      .returns<AutomationRow>()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Mise à jour échouée' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('PUT /api/super-admin/automations failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'automatisation."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * Supprime une automatisation (table `automations`) pour le super-admin.
 */
export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json().catch(() => null)
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase.from('automations').delete().eq('id', parsed.data.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { id: parsed.data.id } })
  } catch (error) {
    console.error('DELETE /api/super-admin/automations failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la suppression de l'automatisation."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
