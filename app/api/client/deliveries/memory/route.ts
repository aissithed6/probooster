import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET  /api/client/deliveries/memory  → adresses mémorisées du client connecté.
 * POST /api/client/deliveries/memory  → mémorise (hupsert) une adresse validée.
 *
 * "Mémoire d'adresse" : après une livraison réussie, on mémorise la coordonnée
 * la plus précise (pointage manuel, GPS validé, point relais). À la prochaine
 * commande du même client, on pourra proposer automatiquement cette coordonnée
 * plutôt que de re-dépendre du GPS (±10 m) → précision réelle au point de dépôt.
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('delivery_memory')
      .select('id, address, city, latitude, longitude, source, confidence, delivery_count, last_used_at, updated_at')
      .eq('customer_id', customerId)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('❌ delivery-memory: Erreur de récupération:', error)
      return NextResponse.json({ error: 'Erreur de récupération des adresses mémorisées.' }, { status: 500 })
    }

    const normalized = (data ?? []).map((r: any) => ({
      id: r.id,
      address: r.address,
      city: r.city,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      source: r.source,
      confidence: r.confidence,
      deliveryCount: r.delivery_count,
      lastUsedAt: r.last_used_at,
      updatedAt: r.updated_at
    }))

    return NextResponse.json({ data: normalized })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    console.error('❌ delivery-memory: Erreur inattendue:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => ({}))) as {
      address?: string
      city?: string
      lat?: number
      lng?: number
      source?: string
      confidence?: number
      orderId?: string
    }

    const lat = Number(body?.lat)
    const lng = Number(body?.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Coordonnées invalides.' }, { status: 400 })
    }

    const address = typeof body?.address === 'string' ? body.address.trim() : null
    const city = typeof body?.city === 'string' ? body.city.trim() : null
    const sourceRaw = String(body?.source ?? 'gps').trim().toLowerCase()
    const source = ['gps', 'manual_pin', 'relay_point', 'previous_delivery'].includes(sourceRaw)
      ? sourceRaw
      : 'gps'
    const confidence = Math.min(5, Math.max(1, Number(body?.confidence) || 1))
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : null

    // Upsert : une coordonnée (arrondie) ne peut exister qu'une fois par client.
    const upsertPayload = {
      customer_id: customerId,
      address,
      city,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      source,
      confidence,
      order_id: orderId,
      metadata: { last_source: source, confidence }
    }

    const { data, error } = await supabase
      .from('delivery_memory')
      .upsert(upsertPayload, {
        onConflict: 'customer_id,latitude,longitude',
        ignoreDuplicates: false
      })
      .select('id, address, city, latitude, longitude, source, confidence, delivery_count, updated_at')
      .maybeSingle()

    if (error) {
      console.error('❌ delivery-memory: Mémorisation échouée:', error)
      return NextResponse.json({ error: 'Erreur lors de la mémorisation de l’adresse.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    console.error('❌ delivery-memory: Erreur inattendue:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
