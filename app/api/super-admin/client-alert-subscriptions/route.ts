import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const querySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  format: z.enum(['json', 'csv']).optional()
})

function toCsvValue(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value)
  const escaped = raw.replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * GET /api/super-admin/client-alert-subscriptions
 * Liste des inscriptions clients (utilisé par le tableau de bord super-admin).
 * - format=csv pour exporter.
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
    const format = parsed.data.format ?? 'json'
    const q = (parsed.data.q ?? '').trim()

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('client_alert_subscriptions')
      .select('id, phone, email, category_ids, preferences, is_active, source_page, created_at, updated_at', {
        count: 'exact'
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (q.length > 0) {
      query = query.or(`phone.ilike.%${q}%,email.ilike.%${q}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const rowsRaw = (data ?? []).map((row: any) => ({
      id: row.id,
      phone: row.phone,
      email: row.email,
      categoryIds: Array.isArray(row.category_ids) ? row.category_ids : [],
      preferences: row.preferences ?? null,
      isActive: Boolean(row.is_active),
      sourcePage: row.source_page ?? null,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null
    }))

    const categoryIdsAll = Array.from(
      new Set(
        rowsRaw
          .flatMap((r) => (Array.isArray(r.categoryIds) ? r.categoryIds : []))
          .map((x) => String(x).trim())
          .filter((x) => x.length > 0)
      )
    )

    const categoryNameById = new Map<string, string>()
    if (categoryIdsAll.length > 0) {
      const { data: cats } = await supabase
        .from('product_categories')
        .select('id,name')
        .in('id', categoryIdsAll)
      ;(cats ?? []).forEach((c: any) => {
        const id = typeof c?.id === 'string' ? String(c.id) : ''
        const name = typeof c?.name === 'string' ? String(c.name) : ''
        if (id && name) categoryNameById.set(id, name)
      })
    }

    const rows = rowsRaw.map((r) => ({
      ...r,
      categoryNames: (Array.isArray(r.categoryIds) ? r.categoryIds : [])
        .map((id) => categoryNameById.get(String(id).trim()) ?? null)
        .filter(Boolean)
    }))

    if (format === 'csv') {
      const header = ['id', 'phone', 'email', 'is_active', 'preferences', 'category_names', 'category_ids', 'source_page', 'created_at', 'updated_at']
      const lines = [header.map(toCsvValue).join(',')]
      for (const r of rows) {
        lines.push(
          [
            r.id,
            r.phone,
            r.email ?? '',
            r.isActive,
            JSON.stringify(r.preferences ?? {}),
            JSON.stringify((r as any).categoryNames ?? []),
            JSON.stringify(r.categoryIds ?? []),
            r.sourcePage ?? '',
            r.createdAt ?? '',
            r.updatedAt ?? ''
          ]
            .map(toCsvValue)
            .join(',')
        )
      }

      const csv = lines.join('\n')
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="alertes-clients.csv"',
          'Cache-Control': 'no-store'
        }
      })
    }

    return NextResponse.json(
      { data: { items: rows, count: count ?? rows.length } },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
