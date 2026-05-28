import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const listQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  activeOnly: z.coerce.boolean().optional()
})

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  date: z.string().min(4),
  time: z.string().optional().nullable(),
  categoryKey: z.string().min(1),
  categoryLabel: z.string().optional().nullable(),
  categoryIcon: z.string().optional().nullable(),
  discount: z.string().optional().nullable(),
  status: z.enum(['upcoming', 'announced', 'completed', 'cancelled']).optional(),
  isActive: z.boolean().optional()
})

const deleteSchema = z.object({
  id: z.string().uuid()
})

/**
 * GET /api/super-admin/site-events
 * Liste/pagination + recherche des événements du calendrier (admin).
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const q = (parsed.data.q ?? '').trim()
    const limit = parsed.data.limit ?? 50
    const offset = parsed.data.offset ?? 0
    const activeOnly = parsed.data.activeOnly ?? false

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('site_events')
      .select(
        'id,title,description,event_date,event_time,category_key,category_label,category_icon,discount,status,is_active,created_at,updated_at',
        { count: 'exact' }
      )
      .order('event_date', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (q.length > 0) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const items = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.event_date,
      time: row.event_time,
      categoryKey: row.category_key,
      categoryLabel: row.category_label,
      categoryIcon: row.category_icon,
      discount: row.discount,
      status: row.status,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null
    }))

    return NextResponse.json({ data: { items, count: Number(count ?? items.length) } })
  } catch (error) {
    console.error('GET /api/super-admin/site-events failed:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des événements.' }, { status: 500 })
  }
}

/**
 * POST /api/super-admin/site-events
 * Crée un nouvel événement.
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
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      event_date: parsed.data.date,
      event_time: parsed.data.time ?? null,
      category_key: parsed.data.categoryKey,
      category_label: parsed.data.categoryLabel ?? null,
      category_icon: parsed.data.categoryIcon ?? null,
      discount: parsed.data.discount ?? null,
      status: parsed.data.status ?? 'upcoming',
      is_active: parsed.data.isActive ?? true,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('site_events')
      .insert(payload)
      .select(
        'id,title,description,event_date,event_time,category_key,category_label,category_icon,discount,status,is_active,created_at,updated_at'
      )
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Création échouée' }, { status: 400 })
    }

    return NextResponse.json(
      {
        data: {
          id: data.id,
          title: data.title,
          description: (data as any).description,
          date: (data as any).event_date,
          time: (data as any).event_time,
          categoryKey: (data as any).category_key,
          categoryLabel: (data as any).category_label,
          categoryIcon: (data as any).category_icon,
          discount: (data as any).discount,
          status: (data as any).status,
          isActive: Boolean((data as any).is_active),
          createdAt: (data as any).created_at ?? null,
          updatedAt: (data as any).updated_at ?? null
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/super-admin/site-events failed:', error)
    return NextResponse.json({ error: "Erreur lors de la création de l'événement." }, { status: 500 })
  }
}

/**
 * PUT /api/super-admin/site-events
 * Met à jour un événement existant.
 */
export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json().catch(() => null)
    const parsed = upsertSchema.extend({ id: z.string().uuid() }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const payload = {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      event_date: parsed.data.date,
      event_time: parsed.data.time ?? null,
      category_key: parsed.data.categoryKey,
      category_label: parsed.data.categoryLabel ?? null,
      category_icon: parsed.data.categoryIcon ?? null,
      discount: parsed.data.discount ?? null,
      status: parsed.data.status ?? 'upcoming',
      is_active: parsed.data.isActive ?? true,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('site_events')
      .update(payload)
      .eq('id', parsed.data.id)
      .select(
        'id,title,description,event_date,event_time,category_key,category_label,category_icon,discount,status,is_active,created_at,updated_at'
      )
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Mise à jour échouée' }, { status: 400 })
    }

    return NextResponse.json({
      data: {
        id: data.id,
        title: data.title,
        description: (data as any).description,
        date: (data as any).event_date,
        time: (data as any).event_time,
        categoryKey: (data as any).category_key,
        categoryLabel: (data as any).category_label,
        categoryIcon: (data as any).category_icon,
        discount: (data as any).discount,
        status: (data as any).status,
        isActive: Boolean((data as any).is_active),
        createdAt: (data as any).created_at ?? null,
        updatedAt: (data as any).updated_at ?? null
      }
    })
  } catch (error) {
    console.error('PUT /api/super-admin/site-events failed:', error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'événement." }, { status: 500 })
  }
}

/**
 * DELETE /api/super-admin/site-events
 * Supprime définitivement un événement.
 */
export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = deleteSchema.safeParse({ id: searchParams.get('id') })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('site_events').delete().eq('id', parsed.data.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/super-admin/site-events failed:', error)
    return NextResponse.json({ error: "Erreur lors de la suppression de l'événement." }, { status: 500 })
  }
}
