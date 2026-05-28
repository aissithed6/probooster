import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type TemplateCategory = 'transactional' | 'marketing' | 'system'

interface EmailTemplateRow {
  id: string
  key: string
  name: string
  category: TemplateCategory
  subject: string
  html: string | null
  text: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const listQuerySchema = z.object({
  category: z.enum(['all', 'transactional', 'marketing', 'system']).optional(),
  active: z.enum(['all', 'true', 'false']).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
})

const createSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['transactional', 'marketing', 'system']).optional(),
  subject: z.string().min(1),
  html: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  isActive: z.boolean().optional()
})

const updateSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  category: z.enum(['transactional', 'marketing', 'system']).optional(),
  subject: z.string().min(1).optional(),
  html: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  isActive: z.boolean().optional()
})

/**
 * GET /api/super-admin/email-templates
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const limit = parsed.data.limit ?? 50
    const offset = parsed.data.offset ?? 0

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('email_templates' as any)
      .select('id,key,name,category,subject,html,text,is_active,created_at,updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (parsed.data.category && parsed.data.category !== 'all') {
      query = query.eq('category', parsed.data.category)
    }

    if (parsed.data.active && parsed.data.active !== 'all') {
      query = query.eq('is_active', parsed.data.active === 'true')
    }

    if (parsed.data.q && parsed.data.q.trim().length > 0) {
      const q = parsed.data.q.trim()
      query = query.or(`key.ilike.%${q}%,name.ilike.%${q}%,subject.ilike.%${q}%`)
    }

    const { data, error, count } = await query

    if (error) {
      const msg = String(error.message ?? '')
      const isMissing = msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('email_templates')
      if (isMissing) {
        return NextResponse.json(
          {
            error:
              "La table 'email_templates' est introuvable (schema cache). Exécute le SQL de création dans Supabase puis attends 30-60s et réessaie."
          },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: msg || 'Erreur de lecture email_templates.' }, { status: 400 })
    }

    return NextResponse.json(
      {
        data: {
          items: (data ?? []) as EmailTemplateRow[],
          count: count ?? (data ?? []).length
        }
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('GET /api/super-admin/email-templates failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/super-admin/email-templates
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const now = new Date().toISOString()
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('email_templates' as any)
      .insert({
        key: parsed.data.key,
        name: parsed.data.name,
        category: parsed.data.category ?? 'transactional',
        subject: parsed.data.subject,
        html: parsed.data.html ?? null,
        text: parsed.data.text ?? null,
        is_active: parsed.data.isActive ?? true,
        created_at: now,
        updated_at: now
      })
      .select('id,key,name,category,subject,html,text,is_active,created_at,updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: String(error.message ?? 'Erreur de création email_templates.') }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('POST /api/super-admin/email-templates failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/super-admin/email-templates
 */
export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const patch: Record<string, any> = {}
    if (parsed.data.key !== undefined) patch.key = parsed.data.key
    if (parsed.data.name !== undefined) patch.name = parsed.data.name
    if (parsed.data.category !== undefined) patch.category = parsed.data.category
    if (parsed.data.subject !== undefined) patch.subject = parsed.data.subject
    if (parsed.data.html !== undefined) patch.html = parsed.data.html
    if (parsed.data.text !== undefined) patch.text = parsed.data.text
    if (parsed.data.isActive !== undefined) patch.is_active = parsed.data.isActive
    patch.updated_at = new Date().toISOString()

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('email_templates' as any)
      .update(patch)
      .eq('id', parsed.data.id)
      .select('id,key,name,category,subject,html,text,is_active,created_at,updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: String(error.message ?? 'Erreur de mise à jour email_templates.') }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('PUT /api/super-admin/email-templates failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/super-admin/email-templates?id=...
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
    const { error } = await supabase.from('email_templates' as any).delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: String(error.message ?? 'Erreur de suppression email_templates.') }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('DELETE /api/super-admin/email-templates failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
