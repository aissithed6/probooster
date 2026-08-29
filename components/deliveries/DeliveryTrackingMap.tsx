"use client"

// CSS du moteur WebGL (bundled dans le chunk dynamique, pas dans le JS initial).
import 'maplibre-gl/dist/maplibre-gl.css'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { MapPin } from 'lucide-react'

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

/** Tuiles raster OpenFreeMap : gratuit, zéro clé API, CDN global. */
function tileUrl(theme: 'light' | 'dark'): string {
  // positron (clair) / darkmatter (sombre) — style sobre, lisible pour du tracking.
  const name = theme === 'light' ? 'positron' : 'darkmatter'
  return `https://tile.openfreemap.org/names/${name}/{z}/{x}/{y}{r}.png`
}

/** Style MapLibre (vectorielle, version 8) pour le thème donné. */
function buildStyle(theme: 'light' | 'dark'): maplibregl.Style {
  return {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [tileUrl(theme)],
        attribution: OSM_ATTRIBUTION,
        tileSize: 256
      }
    },
    layers: [
      { id: 'osm-tiles', type: 'raster', source: 'osm-tiles', paint: { 'raster-opacity': 0.92 } }
    ]
  } as unknown as maplibregl.Style
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
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

  // Résolution du thème: `auto` suit le CSS prefers-color-scheme.
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme !== 'auto') return theme
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [theme])

  // true si le livreur OU la destination a des coords valides.
  const hasDriverCoords = driverPoint && isFiniteNumber(driverPoint.lat) && isFiniteNumber(driverPoint.lng)
  const hasDestinationCoords =
    destinationPoint && isFiniteNumber(destinationPoint.lat) && isFiniteNumber(destinationPoint.lng)
  const hasAnyCoords = Boolean(hasDriverCoords || hasDestinationCoords)

    // --- Montage unique (évite la recompilation WebGL). Le style (thème) est
  //     réappliqué dynamiquement par l'effet dédié ci-dessous.
  //     On n'initialise le contexte WebGL QUE s'il existe au moins une coordonnée. ---
  useEffect(() => {
    if (!containerRef.current) return
    if (!hasAnyCoords) return
    const container = containerRef.current

    const map = new maplibregl.Map({
      container,
      style: buildStyle(resolvedTheme),
      center: [13.404954, 52.520008],
      zoom: 12,
      attributionControl: true,
      antialias: true
    })
    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize()
      } catch {
        // ignore
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
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
  const fitRoute = useCallback(() => {
    const map = mapRef.current
    if (!map) return

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

    const bounds = pts.reduce(
      (b, c) => b.extend(c),
      new maplibregl.LngLatBounds(pts[0], pts[0])
    )
    map.fitBounds(bounds, { padding: 24, maxZoom: 15, duration: 700, essential: true })
  }, [driverPoint, destinationPoint])
    // --- Re-réaction aux changements de position (sans recréer la carte) ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

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
  }, [driverPoint, destinationPoint, fitRoute, hasAnyCoords, resolvedTheme])

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
    </div>
  )
}