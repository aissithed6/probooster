import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertCustomer, isClientAuthError } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function haversineMeters(latA: number, lngA: number, latB: number, lngB: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(latB - latA)
  const dLng = toRad(lngB - lngA)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * GET  /api/client/deliveries/relay-points?lat=..&lng=..&radius=..
 * Retourne les points relais actifs (carrefours, échoppes, dépôts…) géo-fiable
 * autour de la destination, pour guider le livreur AU MÈTRE (points connus).
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const latRaw = Number(searchParams.get('lat'))
    const lngRaw = Number(searchParams.get('lng'))
    const radiusMeters = Math.min(
      20_000,
      Math.max(500, Number(searchParams.get('radius')) || 3000)
    )
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))

    const hasCoords = Number.isFinite(latRaw) && Number.isFinite(lngRaw)

    let query = supabase
      .from('delivery_relay_points')
      .select('id, name, description, address, latitude, longitude, relay_type, zone, city, is_active')
      .eq('is_active', true)

    // Filtre par boîte englobante (robuste, sans RPC) quand des coordonnées sont fournies.
    if (hasCoords) {
      const dLat = radiusMeters / 111_000
      const dLng = radiusMeters / (111_000 * Math.max(0.5, Math.cos((latRaw * Math.PI) / 180)))
      query = query
        .gte('latitude', latRaw - dLat)
        .lte('latitude', latRaw + dLat)
        .gte('longitude', lngRaw - dLng)
        .lte('longitude', lngRaw + dLng)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(100)

    if (error) {
      console.error('❌ relay-points: Erreur de récupération:', error)
      return NextResponse.json({ error: 'Erreur de récupération des points relais.' }, { status: 500 })
    }

    const rows = (data ?? []) as any[]
    // Tri par distance (haversine) et filtrage par rayon réel.
    let filtered = rows
    if (hasCoords) {
      filtered = rows
        .map((r) => ({
          ...r,
          _dist: haversineMeters(latRaw, lngRaw, Number(r.latitude), Number(r.longitude))
        }))
        .filter((r) => Number.isFinite(r._dist) && r._dist <= radiusMeters)
        .sort((a, b) => a._dist - b._dist)
        .slice(0, limit)
    } else {
      filtered = rows.slice(0, limit)
    }

    const normalized = filtered.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      address: r.address,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      type: r.relay_type,
      zone: r.zone,
      city: r.city,
      distanceMeters: hasCoords && Number.isFinite(r._dist) ? Math.round(r._dist) : null
    }))

    return NextResponse.json({ data: normalized })
  } catch (err) {
    if (isClientAuthError(err)) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 })
    }
    console.error('❌ relay-points: Erreur inattendue:', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}

