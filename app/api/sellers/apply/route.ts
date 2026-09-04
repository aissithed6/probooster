import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/sellers/apply
 * Endpoint public : soumission du formulaire "Devenir Vendeur".
 * Insère la candidature dans Supabase (table seller_applications).
 * Aucune authentification requise (formulaire public).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    const businessName = String(body?.businessName ?? '').trim()
    const ownerName = String(body?.ownerName ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const phone = String(body?.phone ?? '').trim()

    if (!businessName || !ownerName || !email || !phone) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (nom entreprise, responsable, email, téléphone).' },
        { status: 400 }
      )
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailOk) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const applicationNumber = `SELL-${Date.now().toString().slice(-6)}`

    const { data, error } = await supabase
      .from('seller_applications')
      .insert({
        application_number: applicationNumber,
        business_name: businessName,
        owner_name: ownerName,
        email,
        phone,
        category: body?.category ? String(body.category).slice(0, 200) : null,
        experience: body?.experience ? String(body.experience).slice(0, 200) : null,
        monthly_revenue: body?.monthlyRevenue ? String(body.monthlyRevenue).slice(0, 200) : null,
        description: body?.description ? String(body.description).slice(0, 5000) : null,
        status: 'pending'
      })
      .select('id, application_number')
      .single()

    if (error) {
      const message = error.message ?? error.hint ?? error.details ?? 'Impossible de soumettre la candidature.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
