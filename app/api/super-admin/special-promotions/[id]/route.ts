import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type SpecialPromotionUpdatePayload = Record<string, unknown>

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

/**
 * PUT /api/super-admin/special-promotions/:id
 * Met à jour une promotion spéciale (super-admin).
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertSuperAdmin(request)
    const awaitedParams = await Promise.resolve(params)
    const id = awaitedParams?.id

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id invalide.' }, { status: 400 })
    }

    const body = (await request.json().catch(() => null)) as SpecialPromotionUpdatePayload | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    if (Object.prototype.hasOwnProperty.call(body, 'id')) delete (body as any).id
    if (Object.prototype.hasOwnProperty.call(body, 'created_at')) delete (body as any).created_at
    if (Object.prototype.hasOwnProperty.call(body, 'updated_at')) delete (body as any).updated_at
    if (Object.prototype.hasOwnProperty.call(body, 'created_by')) delete (body as any).created_by

    if (Object.prototype.hasOwnProperty.call(body, 'start_date')) {
      const raw = (body as any).start_date
      if (raw === '' || raw === null) {
        ;(body as any).start_date = null
      } else {
        const normalized = normalizePromotionDateBoundaryUtc(raw, 'start')
        if (!normalized) {
          return NextResponse.json({ error: 'start_date invalide (attendu: YYYY-MM-DD).' }, { status: 400 })
        }
        ;(body as any).start_date = normalized
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'end_date')) {
      const raw = (body as any).end_date
      if (raw === '' || raw === null) {
        return NextResponse.json({ error: 'end_date requis.' }, { status: 400 })
      }
      const normalized = normalizePromotionDateBoundaryUtc(raw, 'end')
      if (!normalized) {
        return NextResponse.json({ error: 'end_date invalide (attendu: YYYY-MM-DD).' }, { status: 400 })
      }
      ;(body as any).end_date = normalized
    }

    const { data, error } = await supabase
      .from('special_promotions')
      .update(body)
      .eq('id', id)
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
    console.error('PUT /api/super-admin/special-promotions/:id failed:', error)
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

/**
 * DELETE /api/super-admin/special-promotions/:id
 * Supprime une promotion spéciale (super-admin).
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await assertSuperAdmin(request)
    const awaitedParams = await Promise.resolve(params)
    const id = awaitedParams?.id

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('special_promotions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json(
      { data: true },
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
    console.error('DELETE /api/super-admin/special-promotions/:id failed:', error)
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
