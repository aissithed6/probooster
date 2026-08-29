import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

type ExportResult = {
  generatedAt: string
  userId: string
  profile?: any
  user?: any
  loyalty_points?: any
  orders?: any
  chats?: any
  preferences?: any
}

/**
 * POST /api/client/account/export
 * Exporte les données utilisateur en JSON.
 * NB: best-effort sur certaines tables (si elles n'existent pas / RLS), pour éviter de casser l'export.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const now = new Date().toISOString()

    const safeSingle = async (table: string, where: { key: string; value: string }, select = '*') => {
      try {
        const { data, error } = await (supabase.from(table as any) as any).select(select).eq(where.key, where.value).maybeSingle()
        if (error) return { data: null, error }
        return { data, error: null }
      } catch (e) {
        return { data: null, error: e }
      }
    }

    const safeList = async (table: string, where: { key: string; value: string }, select = '*') => {
      try {
        const { data, error } = await (supabase.from(table as any) as any).select(select).eq(where.key, where.value)
        if (error) return { data: null, error }
        return { data, error: null }
      } catch (e) {
        return { data: null, error: e }
      }
    }

    const [userRow, profileRow] = await Promise.all([
      safeSingle('users', { key: 'id', value: userId }),
      safeSingle('user_profiles', { key: 'user_id', value: userId })
    ])

    const loyaltyPointsRow = await safeSingle('loyalty_points', { key: 'user_id', value: userId })

    // Tables optionnelles selon ton schéma
    const ordersRow = await safeList('orders', { key: 'user_id', value: userId })
    const chatsRow = await safeList('user_chats', { key: 'user_id', value: userId })

    const payload: ExportResult = {
      generatedAt: now,
      userId,
      user: userRow.data ?? undefined,
      profile: profileRow.data ?? undefined,
      loyalty_points: loyaltyPointsRow.data ?? undefined,
      orders: ordersRow.data ?? undefined,
      chats: chatsRow.data ?? undefined,
      preferences: (profileRow.data as any)?.preferences ?? undefined
    }

    return NextResponse.json({ data: payload }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'

    if (isClientAuthError(error)) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
