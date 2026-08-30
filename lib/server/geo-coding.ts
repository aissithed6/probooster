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
