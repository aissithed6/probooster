import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'

interface DriverApplicationRow {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  payload: Record<string, unknown> | null
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Liste les demandes "Devenir livreur" pour le Super Admin.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('driver_applications')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(200)

    if (status && (status === 'pending' || status === 'approved' || status === 'rejected')) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      const message = error.message ?? error.hint ?? error.details ?? 'Impossible de charger les demandes.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ data: (data ?? []) as DriverApplicationRow[] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
