import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export interface SellerApplicationRow {
  id: string
  application_number: string | null
  business_name: string
  owner_name: string
  email: string
  phone: string
  category: string | null
  experience: string | null
  monthly_revenue: string | null
  description: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  submitted_at: string
  created_at: string
  updated_at: string
}

/**
 * GET /api/super-admin/seller-applications
 * Liste les candidatures "Devenir Vendeur" (filtre optionnel ?status=).
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('seller_applications')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(200)

    if (status && (status === 'pending' || status === 'approved' || status === 'rejected')) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      const message = error.message ?? error.hint ?? error.details ?? 'Impossible de charger les candidatures.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ data: (data ?? []) as SellerApplicationRow[] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
