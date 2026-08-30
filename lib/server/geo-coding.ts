/**
 * Géocodage inverse "smart" : utilise Mapbox Search (plus précis en Afrique de
 * l'Ouest) si une clé publique est configurée, sinon se replie sur Nominatim
 * (OpenStreetMap, gratuit). Utilisé pour afficher l'adresse/quartier le plus
 * pertinent autour d'une coordonnée de destination.
 *
 * Côté serveur uniquement (appelé depuis les routes API).
 */

export interface ReverseGeoResult {
  /** Libellé lisible (rue, quartier, ville…). */
  label: string | null
  /** Nom court (rue / quartier prioritaire). */
  shortName: string | null
  /** Quartier / arrondissement. */
  neighborhood: string | null
  city: string | null
  country: string | null
  /** Service utilisé ('mapbox' | 'nominatim'). */
  provider: 'mapbox' | 'nominatim'
}

function getMapboxToken(): string {
  return (
    (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN ?? '').trim()
  )
}

function cleanParts(parts: (unknown)[]): string[] {
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((p) => p.length > 0 && p.toLowerCase() !== 'united states' && p.toLowerCase() !== 'united states of america')
}

function parseMapboxFeature(feat: any): ReverseGeoResult {
  const context: any[] = Array.isArray(feat?.context) ? feat.context : []
  const text = typeof feat?.text === 'string' ? feat.text : null
  const placeName = typeof feat?.place_name === 'string' ? feat.place_name : null

  const pickContext = (kind: string | RegExp): string | null => {
    for (const c of context) {
      const id = typeof c?.id === 'string' ? c.id : ''
      const ct = typeof c?.text === 'string' ? c.text : ''
      if (typeof kind === 'string' ? id.includes(kind) : kind.test(id)) return ct || null
    }
    return null
  }
  const neighborhood =
    pickContext('neighborhood') ?? pickContext('place') ?? text
  const city =
    pickContext('place') ?? pickContext('locality') ?? pickContext('district') ?? null
  const country = pickContext('country') ?? null

  const label = cleanParts([placeName]).join(', ') || text || null
  return {
    label,
    shortName: text || neighborhood,
    neighborhood,
    city,
    country,
    provider: 'mapbox'
  }
}

function reverseGeocodeMapbox(lat: number, lng: number): Promise<ReverseGeoResult | null> {
  const token = getMapboxToken()
  if (!token) return Promise.resolve(null)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(token)}&limit=1&language=fr`
  return fetch(url, { signal: AbortSignal.timeout(6500) })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((json: any) => {
      const feat = json?.features?.[0]
      return feat ? parseMapboxFeature(feat) : null
    })
    .catch(() => null)
}

function reverseGeocodeNominatim(lat: number, lng: number): Promise<ReverseGeoResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=18&addressdetails=1&accept-language=fr`
  return fetch(url, {
    signal: AbortSignal.timeout(6500),
    headers: { Accept: 'application/json', 'User-Agent': 'probooster-delivery/1.0' }
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((j: any) => {
      if (!j?.display_name) return null
      const adr = j.address ?? {}
      const neighborhood =
        adr.neighbourhood ?? adr.suburb ?? adr.quarter ?? adr.district ?? adr.road ?? null
      const city = adr.city ?? adr.town ?? adr.village ?? adr.municipality ?? null
      return {
        label: String(j.display_name).slice(0, 140),
        shortName: neighborhood || city || null,
        neighborhood,
        city,
        country: adr.country ?? null,
        provider: 'nominatim' as const
      }
    })
    .catch(() => null)
}

/**
 * Géocode en inverse une coordonnée, en essayant Mapbox d'abord puis Nominatim.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeoResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const viaMapbox = await reverseGeocodeMapbox(lat, lng)
  if (viaMapbox?.label) return viaMapbox
  return reverseGeocodeNominatim(lat, lng)
}

/* ------------------------------------------------------------------ */
/* Géocodage direct (recherche de lieu par texte)                      */
/* ------------------------------------------------------------------ */

export interface SearchPlaceResult {
  /** Libellé complet lisible. */
  label: string
  /** Nom court (rue / POI). */
  shortName: string | null
  neighborhood: string | null
  city: string | null
  country: string | null
  lat: number
  lng: number
  provider: 'mapbox' | 'nominatim'
}

function parseMapboxSearchFeature(feat: any): SearchPlaceResult | null {
  const center: number[] | undefined = feat?.center
  if (!Array.isArray(center) || center.length < 2) return null
  const lng = Number(center[0])
  const lat = Number(center[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const context: any[] = Array.isArray(feat?.context) ? feat.context : []
  const pick = (kind: string): string | null => {
    for (const c of context) {
      if (typeof c?.id === 'string' && c.id.includes(kind)) {
        return typeof c?.text === 'string' ? c.text : null
      }
    }
    return null
  }
  const text = typeof feat?.text === 'string' ? feat.text : null
  return {
    label: typeof feat?.place_name === 'string' ? feat.place_name : (text ?? ''),
    shortName: text,
    neighborhood: pick('neighborhood') ?? pick('locality'),
    city: pick('place') ?? pick('district'),
    country: pick('country'),
    lat,
    lng,
    provider: 'mapbox'
  }
}

async function searchPlacesMapbox(query: string, proximity?: { lat: number; lng: number }): Promise<SearchPlaceResult[]> {
  const token = getMapboxToken()
  if (!token) return []
  const params = new URLSearchParams({
    access_token: token,
    limit: '6',
    language: 'fr'
  })
  if (proximity && Number.isFinite(proximity.lat) && Number.isFinite(proximity.lng)) {
    params.set('proximity', `${proximity.lng},${proximity.lat}`)
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6500) })
    if (!r.ok) return []
    const json: any = await r.json()
    return (json?.features ?? [])
      .map(parseMapboxSearchFeature)
      .filter((f: SearchPlaceResult | null): f is SearchPlaceResult => Boolean(f))
  } catch {
    return []
  }
}

async function searchPlacesNominatim(query: string, proximity?: { lat: number; lng: number }): Promise<SearchPlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    'accept-language': 'fr'
  })
  // Biais vers l'Afrique de l'Ouest par défaut (Bénin) si pas de proximité connue.
  const viewbox = proximity
    ? `${proximity.lng - 0.15},${proximity.lat + 0.15},${proximity.lng + 0.15},${proximity.lat - 0.15}`
    : '1.5,12.5,3.2,8.5'
  params.set('viewbox', viewbox)
  params.set('bounded', '0')
  const url = `https://nominatim.openstreetmap.org/search?${params}`
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(6500),
      headers: { Accept: 'application/json', 'User-Agent': 'probooster-delivery/1.0' }
    })
    if (!r.ok) return []
    const json: any = await r.json()
    return (Array.isArray(json) ? json : [])
      .map((j: any): SearchPlaceResult | null => {
        const lat = Number(j?.lat)
        const lng = Number(j?.lon)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
        const adr = j.address ?? {}
        const neighborhood = adr.neighbourhood ?? adr.suburb ?? adr.quarter ?? adr.road ?? null
        const city = adr.city ?? adr.town ?? adr.village ?? adr.municipality ?? null
        return {
          label: String(j?.display_name ?? '').slice(0, 160),
          shortName: j?.name ?? neighborhood ?? city ?? null,
          neighborhood,
          city,
          country: adr.country ?? null,
          lat,
          lng,
          provider: 'nominatim' as const
        }
      })
      .filter((f: SearchPlaceResult | null): f is SearchPlaceResult => Boolean(f))
  } catch {
    return []
  }
}

/**
 * Recherche de lieu par texte (saisie utilisateur), Mapbox d'abord puis
 * Nominatim. `proximity` biaise les résultats vers la zone du client.
 */
export async function searchPlaces(
  query: string,
  proximity?: { lat: number; lng: number }
): Promise<SearchPlaceResult[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const viaMapbox = await searchPlacesMapbox(q, proximity)
  if (viaMapbox.length > 0) return viaMapbox
  return searchPlacesNominatim(q, proximity)
}
