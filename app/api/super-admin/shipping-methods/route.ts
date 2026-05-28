'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertOpsOrSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/super-admin/shipping-methods — Liste des méthodes de livraison (Super Admin).
 */
export async function GET(request: NextRequest) {
  try {
    await assertOpsOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('shipping_methods')
      .select('id,name')
      .order('name', { ascending: true })
      .limit(500)

    if (error) {
      const message = error.message ?? error.hint ?? error.details ?? 'Impossible de charger les méthodes de livraison.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const methods = (data ?? []).map((row: any) => ({
      id: String(row?.id ?? ''),
      name: String(row?.name ?? '').trim()
    }))

    return NextResponse.json({ data: methods })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
