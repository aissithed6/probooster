"use client"

// CSS du moteur WebGL (bundled dans le chunk dynamique, pas dans le JS initial).
import 'maplibre-gl/dist/maplibre-gl.css'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// Import "namespace" : la forme la plus fiable pour maplibre-gl (évite que le
// module soit `undefined` sous certains tree-shaking/bundlers, cause de
// "Cannot read properties of undefined (reading 'Map')").
import * as maplibregl from 'maplibre-gl'
import { MapPin, Loader2 } from 'lucide-react'

export type DeliveryTrackingPoint = {
  lat: number
  lng: number
  label?: string
}

export type DeliveryTrackingMapProps = {
  driverPoint?: DeliveryTrackingPoint | null
  destinationPoint?: DeliveryTrackingPoint | null
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

/**
 * Carte de tracking vectorielle (MapLibre GL JS + OpenFreeMap).
 * Gains vs Leaflet raster: rendu WebGL fluide, marqueur animé (easeTo),
 * polyline incrémentale. Le bundle n'est chargé qu'a l'ouverture de la carte
 * (import dynamique ssr:false chez le consommateur) => bundle initial léger.
 */
export default function DeliveryTrackingMap({
  driverPoint,
  destinationPoint,
  heightClassName = 'h-64',
  theme = 'auto'
}: DeliveryTrackingMapProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null)
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const routeSourceId = 'probooster-route'

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

  // Style MapLibre chargé ? (addSource/addLayer exigent un style chargé,
  // sinon MapLibre throw "Style is not done loading")
  const [styleReady, setStyleReady] = useState(false)
  const styleReadyRef = useRef(false)
  useEffect(() => { styleReadyRef.current = styleReady }, [styleReady])

  // La lib est-elle disponible au runtime ? (guard anti-crash "reading 'Map'")
  const [libReady, setLibReady] = useState<boolean>(() => Boolean(maplibregl && maplibregl.Map))
  const [mapFailed, setMapFailed] = useState<boolean>(false)

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

  // (Re)dessine la polyligne route + recentre la caméra.
  // IMPORTANT: ne s'exécute que si le style MapLibre est chargé,
  // sinon addSource() throw "Style is not done loading".
  const fitRoute = useCallback(() => {
    const map = mapRef.current
    if (!map || !styleReady) return

    const pts: [number, number][] = []
    if (driverPoint && isFiniteNumber(driverPoint.lat) && isFiniteNumber(driverPoint.lng))
      pts.push([driverPoint.lng, driverPoint.lat])
    if (destinationPoint && isFiniteNumber(destinationPoint.lat) && isFiniteNumber(destinationPoint.lng))
      pts.push([destinationPoint.lng, destinationPoint.lat])

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
        paint: { 'line-color': '#f97316', 'line-width': 5, 'line-opacity': 0.9 }
      })
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
  }, [driverPoint, destinationPoint, styleReady])
  // --- Re-réaction aux changements de position (sans recréer la carte) ---
  // Les marqueurs et la route ne sont posés qu'après le chargement du style.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleReady || !maplibregl || !maplibregl.Marker) return

    // Marqueur du livreur (animé via easeTo)
    if (driverPoint && isFiniteNumber(driverPoint.lat) && isFiniteNumber(driverPoint.lng)) {
      const pos = { lng: driverPoint.lng, lat: driverPoint.lat }
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new maplibregl.Marker({
          element: markerElement('driver', driverPoint.label ?? 'Livreur'),
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

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 ${heightClassName}`}
    >
      <div ref={containerRef} className="h-full w-full" />
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
              className="mt-2 h-44 w-full rounded-lg border border-gray-200 dark:border-white/10"
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