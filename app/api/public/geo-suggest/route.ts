import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/public/geo-suggest
 * Proxy de suggestions géographiques (quartiers/lieux) via Nominatim (OpenStreetMap).
 * Utilisation: /api/public/geo-suggest?q=tokan&country=B%C3%A9nin&city=Abomey-Calavi&limit=8
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const q = String(url.searchParams.get('q') ?? '').trim()
    const country = String(url.searchParams.get('country') ?? '').trim()
    const city = String(url.searchParams.get('city') ?? '').trim()
    const limitParam = Number(url.searchParams.get('limit') ?? '8')
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 8

    if (!q) {
      return NextResponse.json({ data: [] }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } })
    }

    const parts = [q]
    if (city) parts.push(city)
    if (country) parts.push(country)

    const query = encodeURIComponent(parts.join(', '))
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}&addressdetails=1&limit=${limit}`

    const resp = await fetch(nominatimUrl, {
      method: 'GET',
      headers: {
        // Nominatim recommande un User-Agent explicite.
        'User-Agent': 'Probooster-MP1/1.0 (admin-config; contact: support@probooster.local)',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    })

    if (!resp.ok) {
      return NextResponse.json(
        { data: [], error: `Nominatim error (${resp.status})` },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    const json = (await resp.json().catch(() => [])) as any[]

    const data = Array.isArray(json)
      ? json.map((r) => {
          const address = r?.address ?? {}
          const name = String(address?.suburb ?? address?.neighbourhood ?? address?.quarter ?? address?.hamlet ?? address?.village ?? r?.name ?? '').trim()
          const displayName = String(r?.display_name ?? '').trim()
          const label = name.length > 0 ? name : displayName

          return {
            label,
            displayName,
            lat: r?.lat ? Number(r.lat) : null,
            lon: r?.lon ? Number(r.lon) : null,
            address
          }
        })
      : []

    return NextResponse.json({ data }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } })
  } catch (error) {
    console.error('GET /api/public/geo-suggest failed:', error)
    return NextResponse.json(
      { data: [], error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
