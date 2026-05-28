import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { type BoostingService } from '@/lib/services/marketing-service'

/**
 * PATCH /api/boosting-services/[id]
 * Met à jour un service de boostage à l'aide du client Supabase administrateur.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params
    const serviceId = awaitedParams?.id
    if (!serviceId) {
      return NextResponse.json({ error: 'Identifiant de service manquant.' }, { status: 400 })
    }

    const updates = (await request.json()) as Partial<BoostingService> | null
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée fournie pour la mise à jour.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('boosting_services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', serviceId)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('PATCH /api/boosting-services/[id] failed:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
