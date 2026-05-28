import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Normalise une date de promotion (YYYY-MM-DD ou ISO) vers une borne UTC stable.
 * - mode=start => 00:00:00.000Z
 * - mode=end => 23:59:59.999Z
 */
function normalizePromotionDateBoundaryUtc(value: unknown, mode: 'start' | 'end'): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const datePartCandidate = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(datePartCandidate)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  const hours = mode === 'start' ? 0 : 23
  const minutes = mode === 'start' ? 0 : 59
  const seconds = mode === 'start' ? 0 : 59
  const ms = mode === 'start' ? 0 : 999

  const iso = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, ms)).toISOString()
  return iso
}

/**
 * Extrait le nom de colonne manquante depuis une erreur PostgREST (PGRST204).
 */
function extractMissingColumnFromPostgrestError(error: unknown): string | null {
  const message = typeof (error as any)?.message === 'string' ? ((error as any).message as string) : ''
  const match = message.match(/Could not find the '([^']+)' column/i)
  return match?.[1] ?? null
}

type SpecialPromotionPayload = {
  title?: string | null
  subtitle?: string | null
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  discount_type?: 'percentage' | 'fixed' | 'free_shipping' | string | null
  discount_value?: number | null
  gradient_from?: string | null
  gradient_to?: string | null
  text_color?: string | null
  is_active?: boolean | null
  sort_order?: number | null
  created_by?: string | null
  applicable_vendors?: string[] | null
  applicable_categories?: string[] | null
  applicable_products?: string[] | null
}

/**
 * GET /api/super-admin/special-promotions
 * Liste les promotions spéciales (super-admin), sans cache.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('special_promotions')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('end_date', { ascending: true })

    if (error) throw error

    return NextResponse.json(
      { data: Array.isArray(data) ? data : [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    )
  } catch (error) {
    console.error('GET /api/super-admin/special-promotions failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur interne.'
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    )
  }
}

/**
 * POST /api/super-admin/special-promotions
 * Crée une promotion spéciale (super-admin).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => null)) as SpecialPromotionPayload | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const endDateRaw = typeof body.end_date === 'string' ? body.end_date : null

    if (!title || !endDateRaw) {
      return NextResponse.json({ error: 'title et end_date requis.' }, { status: 400 })
    }

    const normalizedEndDate = normalizePromotionDateBoundaryUtc(endDateRaw, 'end')
    if (!normalizedEndDate) {
      return NextResponse.json({ error: 'end_date invalide (attendu: YYYY-MM-DD).' }, { status: 400 })
    }

    const startDateTrimmed = typeof body.start_date === 'string' ? body.start_date.trim() : ''
    const startDateProvided = startDateTrimmed.length > 0
    const normalizedStartDate = startDateProvided ? normalizePromotionDateBoundaryUtc(startDateTrimmed, 'start') : null
    if (startDateProvided && !normalizedStartDate) {
      return NextResponse.json({ error: 'start_date invalide (attendu: YYYY-MM-DD).' }, { status: 400 })
    }

    const payload = {
      ...body,
      title,
      start_date: startDateProvided ? normalizedStartDate : null,
      end_date: normalizedEndDate,
      created_by: userId
    }

    const { data, error } = await supabase
      .from('special_promotions')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      const missingColumn = error?.code === 'PGRST204' ? extractMissingColumnFromPostgrestError(error) : null
      if (missingColumn) {
        console.error('Schéma Supabase incomplet pour special_promotions. Colonne manquante:', missingColumn)
        return NextResponse.json(
          {
            error: `Schéma Supabase incomplet: la colonne '${missingColumn}' n'existe pas dans public.special_promotions. Appliquez la migration SQL qui ajoute les colonnes de ciblage (applicable_products/applicable_categories/applicable_vendors), puis rechargez le schema cache.`
          },
          {
            status: 500,
            headers: {
              'Cache-Control': 'no-store, max-age=0',
              Pragma: 'no-cache',
              Expires: '0'
            }
          }
        )
      }

      throw error
    }

    return NextResponse.json(
      { data: data ?? null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    )
  } catch (error) {
    console.error('POST /api/super-admin/special-promotions failed:', error)
    const message =
      error instanceof Error
        ? error.message
        : typeof (error as any)?.message === 'string'
          ? ((error as any).message as string)
          : 'Erreur interne.'
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    )
  }
}
