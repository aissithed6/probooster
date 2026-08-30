"use client"

// CSS du moteur WebGL (bundled dans le chunk dynamique, pas dans le JS initial).
import 'maplibre-gl/dist/maplibre-gl.css'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// Import "namespace" : la forme la plus fiable pour maplibre-gl (évite que le
// module soit `undefined` sous certains tree-shaking/bundlers, cause de
// "Cannot read properties of undefined (reading 'Map')").
import * as maplibregl from 'maplibre-gl'
import {
  MapPin,
  Loader2,
  Maximize2,
  Minimize2,
  Bike,
  Car,
  Truck,
  Footprints,
  Route as RouteIcon,
  Timer,
  Crosshair
} from 'lucide-react'

export type DeliveryTrackingPoint = {
  lat: number
  lng: number
  label?: string
}

export type VehicleTransportMode = 'car' | 'motorcycle' | 'bicycle' | 'tricycle' | 'walking' | 'unknown'

export type DriverTrackingInfo = {
  name?: string | null
  vehiclePlate?: string | null
  transportMode?: string | null
  vehicleColor?: string | null
}

export type DeliveryTrackingMapProps = {
  driverPoint?: DeliveryTrackingPoint | null
  destinationPoint?: DeliveryTrackingPoint | null
  /** Infos métier du livreur (moyen de transport, plaque, couleur) pour le HUD. */
  driverInfo?: DriverTrackingInfo | null
  /** Libellé d'adresse saisi par le client (affiché en pied de carte). */
  destinationHint?: string | null
  heightClassName?: string
  /** thème d'affichage. `auto` suit prefers-color-scheme. Par défaut `auto`. */
  theme?: 'light' | 'dark' | 'auto'
}

const OSM_ATTRIBUTION =
  '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> · ' +
  '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

/**
 * Styles vectoriels hébergés par OpenFreeMap (gratuit, zéro clé API, CDN global).
 * ⚠️ On utilise les URLs officielles `https://tiles.openfreemap.org/styles/*`
 * (styles MapLibre complets). Les URLs raster "tiles.openfreemap.org/names/*"
 * n'existent pas et provoquent ERR_NAME_NOT_RESOLVED.
 */
function styleUrl(theme: 'light' | 'dark'): string {
  return theme === 'light'
    ? 'https://tiles.openfreemap.org/styles/liberty'
    : 'https://tiles.openfreemap.org/styles/dark'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Distance à vol d'oiseau (haversine) en mètres. Fallback si le routage échoue. */
function haversineMeters(latA: number, lngA: number, latB: number, lngB: number): number | null {
  if (![latA, lngA, latB, lngB].every((v) => typeof v === 'number' && Number.isFinite(v))) return null
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(latB - latA)
  const dLng = toRad(lngB - lngA)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function formatDistance(meters: number | null | undefined): string {
  const m = typeof meters === 'number' && Number.isFinite(meters) ? Math.max(0, Math.round(meters)) : undefined
  if (m === undefined) return '—'
  if (m < 1000) return `${m} m`
  return `${(m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
}

function formatDuration(seconds: number | null | undefined): string {
  const s = typeof seconds === 'number' && Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : undefined
  if (s === undefined) return '—'
  if (s < 60) return `${s} s`
  const min = Math.round(s / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const rest = min % 60
  return rest > 0 ? `${h} h ${String(rest).padStart(2, '0')}` : `${h} h`
}

function normalizeTransportMode(raw: string | null | undefined): VehicleTransportMode {
  const v = String(raw ?? '').toLowerCase().trim()
  if (!v) return 'car'
  if (
    v.includes('moto') ||
    v.includes('motorcycle') ||
    v.includes('ziem') ||
    v.includes('taxi-moto') ||
    v.includes('bike') ||
    v.includes('2 roues') ||
    v.includes('2roues')
  ) {
    return 'motorcycle'
  }
  if (v.includes('velo') || v.includes('bicycle') || v.includes('cycle')) return 'bicycle'
  if (v.includes('tricycle') || v.includes('tok') || v.includes('camionnette')) return 'tricycle'
  if (v.includes('camion') || v.includes('van') || v.includes('truck')) return 'tricycle'
  if (v.includes('pied') || v.includes('walk') || v.includes('foot') || v.includes('marche')) return 'walking'
  return 'car'
}

type VehicleMeta = {
  mode: VehicleTransportMode
  label: string
  /** Vitesse moyenne urbaine estimée (km/h), utilisée si le routage OSRM ne renvoie pas de durée. */
  speedKmh: number
  /** Profil OSRM suggéré. */
  osrmProfile: 'driving' | 'cycling' | 'foot'
  icon: 'bike' | 'car' | 'truck' | 'foot'
  accent: string
}

function resolveVehicleMeta(info: DriverTrackingInfo | null | undefined): VehicleMeta {
  const mode = normalizeTransportMode(info?.transportMode)
  const minute = (m: VehicleMeta) => m
  switch (mode) {
    case 'motorcycle':
      return minute({ mode, label: 'Moto', speedKmh: 30, osrmProfile: 'driving', icon: 'bike', accent: '#f97316' })
    case 'bicycle':
      return minute({ mode, label: 'Vélo', speedKmh: 15, osrmProfile: 'cycling', icon: 'bike', accent: '#16a34a' })
    case 'tricycle':
      return minute({ mode, label: 'Camion / Tricycle', speedKmh: 20, osrmProfile: 'driving', icon: 'truck', accent: '#2563eb' })
    case 'walking':
      return minute({ mode, label: 'À pied', speedKmh: 5, osrmProfile: 'foot', icon: 'foot', accent: '#7c3aed' })
    default:
      return minute({ mode: 'car', label: 'Voiture', speedKmh: 25, osrmProfile: 'driving', icon: 'car', accent: '#2563eb' })
  }
}

function vehicleColorHex(info: DriverTrackingInfo | null | undefined, fallback: string): string {
  const raw = String(info?.vehicleColor ?? '').trim()
  if (!raw) return fallback
  const simple = raw.toLowerCase()
  const map: Record<string, string> = {
    rouge: '#dc2626',
    red: '#dc2626',
    bleu: '#2563eb',
    blue: '#2563eb',
    vert: '#16a34a',
    green: '#16a34a',
    noir: '#111827',
    black: '#111827',
    blanc: '#f9fafb',
    white: '#f9fafb',
    gris: '#6b7280',
    gray: '#6b7280',
    jaune: '#eab308',
    yellow: '#eab308',
    orange: '#ea580c',
    rose: '#ec4899',
    violet: '#7c3aed',
    purple: '#7c3aed'
  }
  const found = Object.keys(map).find((k) => simple.includes(k))
  return found ? map[found] : fallback
}

/**
 * URL d'embed OpenStreetMap (iframe) ne nécessitant AUCUN WebGL.
 * Utilisé en mode de secours quand MapLibre (WebGL) est indisponible sur l'appareil,
 * pour afficher quand même une carte avec un marqueur de destination.
 */
function osmFallbackEmbedUrl(
  driver?: DeliveryTrackingPoint | null,
  dest?: DeliveryTrackingPoint | null
): string {
  const pts = [driver, dest].filter(
    (p): p is DeliveryTrackingPoint => Boolean(p && isFiniteNumber(p.lat) && isFiniteNumber(p.lng))
  )
  if (pts.length === 0) return ''
  const lats = pts.map((p) => p.lat)
  const lngs = pts.map((p) => p.lng)
  const pad = 0.01
  const minLat = Math.min(...lats) - pad
  const maxLat = Math.max(...lats) + pad
  const minLng = Math.min(...lngs) - pad
  const maxLng = Math.max(...lngs) + pad
  const bbox = `${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}`
  const c = pts[0]
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${c.lat}%2C${c.lng}`
}

/** Marqueur SVG ultra-léger (pas d'assets/images externes). */
function markerElement(variant: 'driver' | 'destination', label = ''): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.title = label
  const color = variant === 'driver' ? '#2563eb' : '#dc2626'
  const svg =
    variant === 'driver'
      ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="${color}" aria-hidden="true"><path d="M3 6h2.5l3-3h6l3 3H21a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="9" cy="16" r="2"/><circle cx="15" cy="16" r="2"/></svg>`
      : `<svg viewBox="0 0 24 24" width="22" height="22" fill="${color}" aria-hidden="true"><path d="M12 2l9 9h-3v9h-4v-6H10v6H6v-9H3z"/></svg>`
  wrap.innerHTML = `<div style="width:36px;height:36px;background:#fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">${svg}</div>`
  return wrap
}

/** Marqueur du livreur, icône SVG selon le moyen de transport et coloré selon le véhicule. */
function vehicleMarkerElement(
  icon: 'bike' | 'car' | 'truck' | 'foot',
  color: string,
  label = ''
): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.title = label
  let inner: string
  if (icon === 'bike') {
    inner = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-3l-2 6h5l2 5h3"/><path d="M15 6l-3.5 4.5L10 11"/></svg>`
  } else if (icon === 'truck') {
    inner = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 17h4V6H6v11"/><path d="M2 17h4M14 6h3l3 3v8h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`
  } else if (icon === 'foot') {
    inner = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="5" r="2"/><path d="M6 9l2 12M9 10l-1 3 3 0 2 3 2.5 0"/></svg>`
  } else {
    inner = `<svg viewBox="0 0 24 24" width="22" height="22" fill="${color}" aria-hidden="true"><path d="M3 6h2.5l3-3h6l3 3H21a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="9" cy="16" r="2"/><circle cx="15" cy="16" r="2"/></svg>`
  }
  wrap.innerHTML = `<div style="width:36px;height:36px;background:#fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">${inner}</div>`
  return wrap
}

/**
 * Carte de tracking vectorielle (MapLibre GL JS + OpenFreeMap).
 * Gains vs Leaflet raster: rendu WebGL fluide, marqueur animé (easeTo),
 * polyline incrémentale. Le bundle n'est chargé qu'a l'ouverture de la carte
 * (import dynamique ssr:false chez le consommateur) => bundle initial léger.
 */
export default function DeliveryTrackingMap({
  driverPoint,
  destinationPoint,
  driverInfo = null,
  destinationHint = null,
  heightClassName = 'h-64',
  theme = 'auto'
}: DeliveryTrackingMapProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null)
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const routeSourceId = 'probooster-route'

  // --- HUD livraison : infos livreur + trajet ---
  const vehicleMeta = useMemo(() => resolveVehicleMeta(driverInfo), [driverInfo])
  const vehicleColor = useMemo(() => vehicleColorHex(driverInfo, vehicleMeta.accent), [driverInfo, vehicleMeta.accent])

  // Résultat de routage (OSRM) : distance (m), durée (s), géométrie [[lng,lat],...].
  const [route, setRoute] = useState<{
    distanceMeters: number | null
    durationSeconds: number | null
    coords: [number, number][]
    viaOsrm: boolean
  } | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [reversedDest, setReversedDest] = useState<string | null>(null)
  // Distance totale planifiée (1ère mesure), pour calculer la progression.
  const plannedDistanceRef = useRef<number | null>(null)

  // Résolution du thème: `auto` suit d'abord le thème DU SITE (classe `dark`
  // sur <html>, posée par UserPreferencesContext), sinon l'OS en dernier recours.
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme !== 'auto') return theme
    if (typeof window === 'undefined') return 'light'
    if (document.documentElement.classList.contains('dark')) return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [theme])

  // true si le livreur OU la destination a des coords valides.
  const hasDriverCoords = driverPoint && isFiniteNumber(driverPoint.lat) && isFiniteNumber(driverPoint.lng)
  const hasDestinationCoords =
    destinationPoint && isFiniteNumber(destinationPoint.lat) && isFiniteNumber(destinationPoint.lng)
  const hasAnyCoords = Boolean(hasDriverCoords || hasDestinationCoords)
  const hasBothCoords = Boolean(hasDriverCoords && hasDestinationCoords)

  // Style MapLibre chargé ? (addSource/addLayer exigent un style chargé,
  // sinon MapLibre throw "Style is not done loading")
  const [styleReady, setStyleReady] = useState(false)
  const styleReadyRef = useRef(false)
  useEffect(() => { styleReadyRef.current = styleReady }, [styleReady])

  // La lib est-elle disponible au runtime ? (guard anti-crash "reading 'Map'")
  const [libReady, setLibReady] = useState<boolean>(() => Boolean(maplibregl && maplibregl.Map))
  const [mapFailed, setMapFailed] = useState<boolean>(false)

  // Mode « Voir en grand » : la carte passe en plein écran (fixed inset-0).
  // z-[45] : en dessous des modals/chat (z-50+) pour que le chat reste accessible.
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fitRouteRef = useRef<(() => void) | null>(null)

  // Au basculement plein écran, forcer un resize + recentrage (le canvas a changé de taille).
  useEffect(() => {
    if (!isFullscreen) return
    const t1 = window.setTimeout(() => {
      try {
        mapRef.current?.resize()
      } catch { /* ignore */ }
    }, 100)
    const t2 = window.setTimeout(() => {
      try {
        mapRef.current?.resize()
        fitRouteRef.current?.()
      } catch { /* ignore */ }
    }, 400)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [isFullscreen])

  // --- Montage unique (évite la recompilation WebGL). Le style (thème) est
  //     réappliqué dynamiquement par l'effet dédié ci-dessous.
  //     On n'initialise le contexte WebGL QUE s'il existe au moins une coordonnée. ---
  useEffect(() => {
    if (!containerRef.current) return
    if (!hasAnyCoords) return
    if (!maplibregl || !maplibregl.Map) {
      // La lib n'a pas été résolue : on bascule en fallback au lieu de crasher.
      setLibReady(false)
      return
    }
    setLibReady(true)
    const container = containerRef.current

    const map = new maplibregl.Map({
      container,
      style: styleUrl(resolvedTheme),
      center: [13.404954, 52.520008],
      zoom: 12,
      canvasContextAttributes: { antialias: true }
    })

    // Timeout de récupération : si le style/tuiles n'arrivent pas sous 15s,
    // le canvas WebGL opaque resterait noir -> on bascule en fallback.
    const recoverTimer = window.setTimeout(() => {
      if (!styleReadyRef.current) {
        setMapFailed(true)
      }
    }, 15_000)

    let hasFailedOnce = false
    map.on('error', (e) => {
      const msg = String(e?.error?.message ?? '')
      // Échec irrécupérable (contexte WebGL) : on bascule en fallback.
      if (/webgl|context/i.test(msg)) {
        setMapFailed(true)
        return
      }
      // Les échecs de chargement du style/de la source (réseau, CDN, CSP) laissent
      // le canvas opaque par défaut -> écran noir. On affiche le fallback à la place.
      if (/failed to (fetch|load)|style|tile|source|network|timeout|resolve/i.test(msg)) {
        if (!hasFailedOnce) {
          hasFailedOnce = true
          // Petite latence : une tuile qui rate seul n'est pas fatale, on laisse
          // une chance au reste du style de charger.
          window.setTimeout(() => {
            if (!styleReadyRef.current) setMapFailed(true)
          }, 4000)
        }
      }
    })

    // addSource/addLayer ne sont autorisés qu'une fois le style chargé.
    setStyleReady(false)
    map.on('load', () => setStyleReady(true))

    mapRef.current = map

    // --- Resize différé : si la carte est montée dans un modal (portal) ou pendant
    //     une animation, le conteneur peut avoir une hauteur 0 -> canvas noir.
    //     On force plusieurs resize juste après le montage. ---
    const fixTimers: number[] = []
    fixTimers.push(
      window.setTimeout(() => { try { map.resize() } catch { /* ignore */ } }, 250),
      window.setTimeout(() => { try { map.resize() } catch { /* ignore */ } }, 800)
    )

    const resizeObserver = new ResizeObserver(() => {
      try {
        map.resize()
      } catch {
        // ignore
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      window.clearTimeout(recoverTimer)
      fixTimers.forEach((id) => window.clearTimeout(id))
      driverMarkerRef.current?.remove()
      destinationMarkerRef.current?.remove()
      driverMarkerRef.current = null
      destinationMarkerRef.current = null
      try {
        map.remove()
      } catch {
        // ignore: cleanup must never throw
      }
      mapRef.current = null
    }
  }, [resolvedTheme, hasAnyCoords])

  // --- Routage du trajet (OSRM public gratuit). Fournit un itinéraire routier réel,
  //     la distance et la durée estimée. Fallback: à vol d'oiseau si OSRM échoue. ---
  useEffect(() => {
    if (!hasBothCoords || !driverPoint || !destinationPoint) {
      setRoute(null)
      setRouteLoading(false)
      return
    }
    const dLat = driverPoint.lat
    const dLng = driverPoint.lng
    const tLat = destinationPoint.lat
    const tLng = destinationPoint.lng
    const profile = vehicleMeta.osrmProfile
    setRouteLoading(true)

    let cancelled = false
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => ctrl.abort(), 9000)
    const url = `https://router.project-osrm.org/route/v1/${profile}/${dLng},${dLat};${tLng},${tLat}?overview=full&geometries=geojson&steps=false`

    const fallback = () => {
      if (cancelled) return
      const hv = haversineMeters(dLat, dLng, tLat, tLng)
      const dur = hv !== null ? (hv / (vehicleMeta.speedKmh * 1000)) * 3600 : null
      setRoute({
        distanceMeters: hv,
        durationSeconds: dur,
        coords: [[dLng, dLat], [tLng, tLat]],
        viaOsrm: false
      })
    }

    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: any) => {
        if (cancelled) return
        const rte = json?.routes?.[0]
        const geom: any[] = Array.isArray(rte?.geometry?.coordinates) ? rte.geometry.coordinates : []
        if (!geom.length) {
          fallback()
          return
        }
        const coords = geom
          .map((c) => [Number(c[0]), Number(c[1])] as [number, number])
          .filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]))
        setRoute({
          distanceMeters: typeof rte.distance === 'number' ? rte.distance : null,
          durationSeconds: typeof rte.duration === 'number' ? rte.duration : null,
          coords: coords.length ? coords : [[dLng, dLat], [tLng, tLat]],
          viaOsrm: coords.length > 0
        })
      })
      .catch(() => fallback())
      .finally(() => {
        if (!cancelled) setRouteLoading(false)
      })

    return () => {
      cancelled = true
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [hasBothCoords, driverPoint?.lat, driverPoint?.lng, destinationPoint?.lat, destinationPoint?.lng, vehicleMeta])

  // Distance totale planifiée mémorisée (pour le calcul de progression).
  useEffect(() => {
    if (route?.distanceMeters && plannedDistanceRef.current === null) {
      plannedDistanceRef.current = route.distanceMeters
    }
  }, [route?.distanceMeters])

  // Géocodage inverse de la destination (quartier / rue) — "adresse la plus proche".
  useEffect(() => {
    if (!hasDestinationCoords || !destinationPoint) return
    let cancelled = false
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => ctrl.abort(), 8000)
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${destinationPoint.lat}&lon=${destinationPoint.lng}&format=jsonv2&zoom=18&addressdetails=1`
    fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' }
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: any) => {
        if (cancelled || !j?.display_name) return
        setReversedDest(String(j.display_name).slice(0, 140))
      })
      .catch(() => {
        /* best-effort : on garde destinationHint si fourni */
      })
    return () => {
      cancelled = true
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [hasDestinationCoords, destinationPoint?.lat, destinationPoint?.lng])

  // Points de la polyligne : trajet OSRM si disponible, sinon ligne droite.
  const routeLinePoints = useMemo<[number, number][]>(() => {
    if (route?.coords && route.coords.length) return route.coords
    const pts: [number, number][] = []
    if (hasDriverCoords && driverPoint) pts.push([driverPoint.lng, driverPoint.lat])
    if (hasDestinationCoords && destinationPoint) pts.push([destinationPoint.lng, destinationPoint.lat])
    return pts
  }, [route, hasDriverCoords, hasDestinationCoords, driverPoint, destinationPoint])

  // (Re)dessine la polyligne route + recentre la caméra.
  // IMPORTANT: ne s'exécute que si le style MapLibre est chargé,
  // sinon addSource() throw "Style is not done loading".
  const fitRoute = useCallback(() => {
    const map = mapRef.current
    if (!map || !styleReady) return

    const pts: [number, number][] = routeLinePoints
    if (pts.length === 0) return

    if (!map.getSource(routeSourceId)) {
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} }
      })
      map.addLayer({
        id: 'probooster-route-line',
        type: 'line',
        source: routeSourceId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': route?.viaOsrm ? '#f97316' : '#94a3b8',
          'line-width': 5,
          'line-opacity': 0.9
        }
      })
    } else {
      try {
        map.setPaintProperty('probooster-route-line', 'line-color', route?.viaOsrm ? '#f97316' : '#94a3b8')
      } catch { /* ignore */ }
    }
    const geo = map.getSource(routeSourceId) as maplibregl.GeoJSONSource
    if (geo) {
      geo.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: pts },
        properties: {}
      })
    }

    let bounds: maplibregl.LngLatBounds | null = null
    for (const c of pts) {
      if (!bounds) {
        bounds = maplibregl.LngLatBounds ? new maplibregl.LngLatBounds(c, c) : null
      } else {
        bounds = bounds.extend(c)
      }
    }
    if (bounds) {
      map.fitBounds(bounds, { padding: 24, maxZoom: 15, duration: 700, essential: true })
    }
  }, [routeLinePoints, styleReady, route?.viaOsrm])
  // --- Re-réaction aux changements de position (sans recréer la carte) ---
  // Les marqueurs et la route ne sont posés qu'après le chargement du style.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleReady || !maplibregl || !maplibregl.Marker) return

    // Marqueur du livreur (animé via easeTo) — icône et couleur adaptées au véhicule.
    if (driverPoint && isFiniteNumber(driverPoint.lat) && isFiniteNumber(driverPoint.lng)) {
      const pos = { lng: driverPoint.lng, lat: driverPoint.lat }
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new maplibregl.Marker({
          element: vehicleMarkerElement(vehicleMeta.icon, vehicleColor, driverPoint.label ?? 'Livreur'),
          anchor: 'center'
        })
          .setLngLat(pos)
          .addTo(map)
      } else {
        driverMarkerRef.current.setLngLat(pos)
      }
      // Centre la carte derrière le livreur, légèrement au-dessus.
      map.easeTo({
        center: [driverPoint.lng, driverPoint.lat],
        offset: [0, 60],
        duration: 700,
        essential: true
      })
    } else {
      driverMarkerRef.current?.remove()
      driverMarkerRef.current = null
    }

    // Marqueur de destination
    if (destinationPoint && isFiniteNumber(destinationPoint.lat) && isFiniteNumber(destinationPoint.lng)) {
      const pos = { lng: destinationPoint.lng, lat: destinationPoint.lat }
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = new maplibregl.Marker({
          element: markerElement('destination', destinationPoint.label ?? 'Destination'),
          anchor: 'center'
        })
          .setLngLat(pos)
          .addTo(map)
      } else {
        destinationMarkerRef.current.setLngLat(pos)
      }
    } else {
      destinationMarkerRef.current?.remove()
      destinationMarkerRef.current = null
    }

    fitRoute()
  }, [driverPoint, destinationPoint, fitRoute, hasAnyCoords, resolvedTheme, styleReady])

  // Toujours exposer la dernière version de fitRoute au mode plein écran.
  useEffect(() => {
    fitRouteRef.current = fitRoute
  }, [fitRoute])

  // --- Dérivés HUD ---
  const distanceLeft = route?.distanceMeters ?? null
  const durationLeft = route?.durationSeconds ?? null
  const planned = plannedDistanceRef.current
  const progressPct = useMemo(() => {
    if (planned === null || distanceLeft === null || !Number.isFinite(planned) || !Number.isFinite(distanceLeft)) return null
    const pct = (1 - distanceLeft / planned) * 100
    return Math.max(0, Math.min(100, pct))
  }, [planned, distanceLeft])
  const isFallbackRoute = Boolean(hasBothCoords && route && !route.viaOsrm)
  const VehicleGlyph =
    vehicleMeta.icon === 'bike' ? Bike : vehicleMeta.icon === 'truck' ? Truck : vehicleMeta.icon === 'foot' ? Footprints : Car

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[45] flex flex-col bg-white dark:bg-gray-950'
          : `relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 ${heightClassName}`
      }
    >
      {/* Bouton « Voir en grand » / « Réduire » — toujours visible dès qu'il y a une carte */}
      <button
        type="button"
        onClick={() => setIsFullscreen((v) => !v)}
        className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-md ring-1 ring-gray-200 backdrop-blur transition hover:bg-white hover:text-orange-600 dark:bg-gray-900/95 dark:text-gray-200 dark:ring-white/10 dark:hover:text-orange-400"
        title={isFullscreen ? 'Réduire la carte' : 'Voir en grand'}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        {isFullscreen ? 'Réduire' : 'Voir en grand'}
      </button>
      <div ref={containerRef} className={isFullscreen ? 'min-h-0 w-full flex-1' : 'h-full w-full'} />

      {/* --- HUD livraison : véhicule + trajet + progression --- */}
      {hasBothCoords && (
        <div className="pointer-events-auto absolute top-3 left-3 z-20 w-[240px] max-w-[92%] space-y-2 rounded-xl border border-white/10 bg-white/95 p-2.5 shadow-lg backdrop-blur dark:bg-gray-900/95">
          {/* Ligne 1 : véhicule + plaque */}
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: vehicleColor }}
            >
              <VehicleGlyph className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
                {driverInfo?.name || vehicleMeta.label}
              </p>
              <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                {vehicleMeta.label}
                {driverInfo?.vehiclePlate ? ` · ${driverInfo.vehiclePlate}` : ''}
                {driverInfo?.vehicleColor ? ` · ${driverInfo.vehicleColor}` : ''}
              </p>
            </div>
          </div>

          {/* Progression */}
          {progressPct !== null && (
            <div>
              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                <span>Progression</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{Math.round(progressPct)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, backgroundColor: vehicleColor }}
                />
              </div>
            </div>
          )}

          {/* Distance + temps */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-gray-100 pt-2 dark:border-white/10">
            {!routeLoading && distanceLeft !== null && (
              <div className="rounded-lg bg-white/60 px-2 py-1 dark:bg-white/5">
                <p className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                  <RouteIcon className="h-3 w-3" /> Restant
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDistance(distanceLeft)}</p>
              </div>
            )}
            {!routeLoading && durationLeft !== null && (
              <div className="rounded-lg bg-white/60 px-2 py-1 dark:bg-white/5">
                <p className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                  <Timer className="h-3 w-3" /> ETA
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDuration(durationLeft)}</p>
              </div>
            )}
            {routeLoading && (
              <div className="col-span-2 flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Calcul du trajet…
              </div>
            )}
          </div>

          {hasDestinationCoords && (
            <div className="flex items-start gap-1 border-t border-gray-100 pt-1.5 dark:border-white/10">
              <Crosshair className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
              <p className="line-clamp-2 text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                {reversedDest || destinationHint || 'Destination'}
              </p>
            </div>
          )}
        </div>
      )}
      {hasBothCoords && isFallbackRoute && !routeLoading && distanceLeft !== null && (
        <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md bg-white/70 px-2 py-0.5 text-[10px] text-gray-500 backdrop-blur dark:bg-gray-900/70 dark:text-gray-300">
          {(route?.coords?.length ?? 0) > 2 ? 'Itinéraire routier estimé' : 'À vol d’oiseau (routage indisponible)'}
        </p>
      )}

      {!hasAnyCoords && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 p-4 text-center backdrop-blur-sm dark:bg-gray-900/80">
          <MapPin className="h-7 w-7 text-gray-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Localisation GPS indisponible
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            La position de suivi sera affichée dès que le livreur sera localisé.
          </p>
        </div>
      )}
      {hasAnyCoords && !libReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 p-4 text-center backdrop-blur-sm dark:bg-gray-900/80">
          <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Chargement de la carte…</p>
        </div>
      )}
      {/* Le canvas WebGL MapLibre est opaque (noir) tant que le style n'est pas rendu :
          on le masque par un overlay de chargement pour éviter un écran noir. */}
      {hasAnyCoords && libReady && !mapFailed && !styleReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/85 p-4 text-center backdrop-blur-sm dark:bg-gray-900/85">
          <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Chargement de la carte…</p>
        </div>
      )}
      {/* Mode de secours sans WebGL : le canvas MapLibre a échoué (pas de WebGL / style).
          On affiche une carte OpenStreetMap via iframe (fonctionne partout). */}
      {hasAnyCoords && mapFailed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/90 p-3 text-center dark:bg-gray-900/90">
          <MapPin className="h-6 w-6 text-orange-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Suivi (mode simplifié)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Carte de secours sans WebGL
          </p>
          {osmFallbackEmbedUrl(driverPoint, destinationPoint) ? (
            <iframe
              title="Carte de suivi"
              loading="lazy"
              className={`mt-2 w-full rounded-lg border border-gray-200 dark:border-white/10 ${isFullscreen ? 'h-full min-h-0 flex-1' : 'h-44'}`}
              src={osmFallbackEmbedUrl(driverPoint, destinationPoint)}
            />
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Affichage du suivi indisponible sur cet appareil
            </p>
          )}
        </div>
      )}
    </div>
  )
}