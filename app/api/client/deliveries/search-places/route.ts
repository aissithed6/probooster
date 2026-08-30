import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { searchPlaces } from '@/lib/server/geo-coding'

/**
 * GET /api/client/deliveries/search-places?q=..&lat=..&lng=..
 * Recherche de lieu par texte (géocodage direct) : Mapbox si clé configurée,
 * sinon Nominatim. `lat`/`lng` (optionnels) biaisent les résultats vers la
 * zone actuelle du client.
 */
export async function GET(request: NextRequest) {
  try {
    await assertCustomer(request)
    const { searchParams } = new URL(request.url)
    const q = String(searchParams.get('q') ?? '').trim()
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))

    if (q.length < 3) {
      return NextResponse.json({ data: [] })
    }

    const proximity =
      Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
        ? { lat, lng }
        : undefined

    const results = await searchPlaces(q, proximity)
    return NextResponse.json({ data: results })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    console.error('❌ search-places: Erreur inattendue:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
