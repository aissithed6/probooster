'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertDriver } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../../lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }> | { id: string }
}

interface LocationPayload {
  lat: number
  lng: number
}

interface DeliveryRow {
  id: string
  driver_id: string | null
  status: string
}

/**
 * POST /api/driver/deliveries/:id/location — Enregistre la position GPS du livreur en temps réel.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const driverId = await assertDriver(request)
    const supabase = getSupabaseAdmin()

    const resolvedParams = await Promise.resolve(params)
    const deliveryId = resolvedParams.id
    if (!deliveryId) {
      return NextResponse.json({ error: 'Identifiant livraison requis.' }, { status: 400 })
    }

    const body = (await request.json().catch(() => null)) as LocationPayload | null
    const lat = typeof body?.lat === 'number' ? body.lat : NaN
    const lng = typeof body?.lng === 'number' ? body.lng : NaN

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Coordonnées GPS invalides.' }, { status: 400 })
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Coordonnées GPS hors limites.' }, { status: 400 })
    }

    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('id, driver_id, status')
      .eq('id', deliveryId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Livraison introuvable.' }, { status: 404 })
    }

    const row = delivery as DeliveryRow

    if (row.driver_id !== driverId) {
      return NextResponse.json({ error: 'Cette livraison ne vous est pas assignée.' }, { status: 403 })
    }

    if (['delivered', 'cancelled', 'failed'].includes(String(row.status ?? '').toLowerCase())) {
      return NextResponse.json({ error: 'Tracking désactivé: livraison terminée.' }, { status: 409 })
    }

    const { error: updateError } = await supabase
      .from('deliveries')
      .update({ live_lat: lat, live_lng: lng, last_location_at: new Date().toISOString() })
      .eq('id', deliveryId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status =
      lower.includes('token supabase manquant') ||
      lower.includes('utilisateur introuvable') ||
      lower.includes('token invalide')
        ? 401
        : lower.includes('accès réservé aux livreurs')
          ? 403
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
