import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { reverseGeocode } from '@/lib/server/geo-coding'

/**
 * GET /api/client/deliveries/reverse-geocode?lat=..&lng=..
 * Géocode en inverse une coordonnée via Mapbox (si clé) sinon Nominatim →
 * adresse / quartier / rue le plus pertinent autour du point de livraison.
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = await assertCustomer(request)
    const { searchParams } = new URL(request.url)
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Coordonnées invalides.' }, { status: 400 })
    }

    const result = await reverseGeocode(lat, lng)
    return NextResponse.json({ data: result })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    console.error('❌ reverse-geocode: Erreur inattendue:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
