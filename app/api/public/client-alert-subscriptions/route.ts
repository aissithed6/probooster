import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getSupabaseAdmin } from '@/lib/supabase'

const payloadSchema = z
  .object({
  phone: z.string().min(5).optional().nullable(),
  email: z.string().email().optional().nullable(),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
  preferences: z
    .object({
      whatsapp: z.boolean().optional(),
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional()
    })
    .optional(),
  isActive: z.boolean().optional(),
  sourcePage: z.string().optional().nullable()
})
  .superRefine((value, ctx) => {
    const phone = (value.phone ?? '').toString().trim()
    const email = (value.email ?? '').toString().trim()
    if (phone.length === 0 && email.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Téléphone ou email requis.' })
    }
  })

const querySchema = z
  .object({
    phone: z.string().min(5).optional(),
    email: z.string().email().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.phone && !value.email) {
      ctx.addIssue({ code: 'custom', message: 'phone ou email requis.' })
    }
  })

/**
 * GET /api/public/client-alert-subscriptions?phone=...
 * ou /api/public/client-alert-subscriptions?email=...
 * Retourne l'inscription (si elle existe) pour pré-remplir le modal.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      phone: searchParams.get('phone') ?? undefined,
      email: searchParams.get('email') ?? undefined
    })

    if (!parsed.success) {
      return NextResponse.json({ data: null }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('client_alert_subscriptions')
      .select('id, phone, email, category_ids, preferences, is_active, created_at, updated_at')

    if (parsed.data.phone) {
      query = query.eq('phone', parsed.data.phone)
    } else if (parsed.data.email) {
      query = query.eq('email', parsed.data.email)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      return NextResponse.json({ data: null, warning: error.message }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }

    const row = data
      ? {
          id: data.id,
          phone: data.phone,
          email: data.email,
          categoryIds: Array.isArray((data as any).category_ids) ? (data as any).category_ids : [],
          preferences: (data as any).preferences ?? null,
          isActive: Boolean((data as any).is_active),
          createdAt: (data as any).created_at ?? null,
          updatedAt: (data as any).updated_at ?? null
        }
      : null

    return NextResponse.json({ data: row }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ data: null, warning: message }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}

/**
 * POST /api/public/client-alert-subscriptions
 * Upsert d'une inscription aux alertes (WhatsApp/email/sms/push) + catégories.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = payloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.message },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const supabase = getSupabaseAdmin()

    const preferences = {
      whatsapp: parsed.data.preferences?.whatsapp ?? true,
      email: parsed.data.preferences?.email ?? false,
      sms: parsed.data.preferences?.sms ?? false,
      push: parsed.data.preferences?.push ?? false
    }

    const phone = parsed.data.phone ? String(parsed.data.phone).trim() : ''
    const email = parsed.data.email ? String(parsed.data.email).trim() : ''

    const payload = {
      phone: phone.length > 0 ? phone : null,
      email: email.length > 0 ? email : null,
      category_ids: parsed.data.categoryIds,
      preferences,
      is_active: parsed.data.isActive ?? true,
      source_page: parsed.data.sourcePage ?? null
    }

    const conflictColumn = phone.length > 0 ? 'phone' : 'email'

    const { data, error } = await supabase
      .from('client_alert_subscriptions')
      .upsert(payload, { onConflict: conflictColumn })
      .select('id, phone, email, category_ids, preferences, is_active, created_at, updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        data: data
          ? {
              id: (data as any).id,
              phone: (data as any).phone,
              email: (data as any).email,
              categoryIds: Array.isArray((data as any).category_ids) ? (data as any).category_ids : [],
              preferences: (data as any).preferences ?? null,
              isActive: Boolean((data as any).is_active),
              createdAt: (data as any).created_at ?? null,
              updatedAt: (data as any).updated_at ?? null
            }
          : null
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
