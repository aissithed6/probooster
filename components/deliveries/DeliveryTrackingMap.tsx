"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { LatLngExpression } from 'leaflet'
import L from 'leaflet'

export type DeliveryTrackingPoint = {
  lat: number
  lng: number
  label?: string
}

export type DeliveryTrackingMapProps = {
  driverPoint?: DeliveryTrackingPoint | null
  destinationPoint?: DeliveryTrackingPoint | null
  heightClassName?: string
}

/**
 * Carte de tracking basée sur OpenStreetMap (Leaflet).
 * Affiche:
 * - Position actuelle du livreur
 * - Destination (adresse client) si coords disponibles
 * - Un tracé simple (Polyline) entre les 2 points
 */
export default function DeliveryTrackingMap({
  driverPoint,
  destinationPoint,
  heightClassName = 'h-64'
}: DeliveryTrackingMapProps): React.JSX.Element {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const instanceKeyRef = useRef<string>(
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `map_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
  )
  const containerLeafletIdRef = useRef<unknown>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Fix icônes Leaflet (sinon markers invisibles dans Next.js)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl

    L.Icon.Default.mergeOptions({
      // CDN pour éviter d'ajouter des assets dans /public
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    })
  }, [])

  useEffect(() => {
    return () => {
      try {
        const map = mapRef.current
        if (map) {
          const container = map.getContainer() as unknown as { _leaflet_id?: unknown }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapContainerId = (map as any)?._containerId ?? null
          const currentLeafletId = container._leaflet_id ?? null
          const canRemove = mapContainerId !== null && currentLeafletId !== null && mapContainerId === currentLeafletId

          if (canRemove) {
            try {
              map.remove()
            } catch {
              // ignore: cleanup must never throw
            }
          }
          try {
            delete container._leaflet_id
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      } finally {
        containerLeafletIdRef.current = null
        mapRef.current = null
      }
    }
  }, [])

  const center: LatLngExpression = useMemo(() => {
    if (driverPoint?.lat && driverPoint?.lng) return [driverPoint.lat, driverPoint.lng]
    if (destinationPoint?.lat && destinationPoint?.lng) return [destinationPoint.lat, destinationPoint.lng]
    // fallback centre Afrique/Europe (ne doit quasiment jamais arriver)
    return [0, 0]
  }, [destinationPoint?.lat, destinationPoint?.lng, driverPoint?.lat, driverPoint?.lng])

  const line: LatLngExpression[] = useMemo(() => {
    const pts: LatLngExpression[] = []
    if (driverPoint?.lat && driverPoint?.lng) pts.push([driverPoint.lat, driverPoint.lng])
    if (destinationPoint?.lat && destinationPoint?.lng) pts.push([destinationPoint.lat, destinationPoint.lng])
    return pts
  }, [destinationPoint?.lat, destinationPoint?.lng, driverPoint?.lat, driverPoint?.lng])

  const mapKey = useMemo(() => {
    const d = driverPoint ? `${driverPoint.lat},${driverPoint.lng}` : 'no-driver'
    const dest = destinationPoint ? `${destinationPoint.lat},${destinationPoint.lng}` : 'no-dest'
    return `tracking-map:${instanceKeyRef.current}:${d}:${dest}`
  }, [destinationPoint?.lat, destinationPoint?.lng, driverPoint?.lat, driverPoint?.lng])

  useEffect(() => {
    const container = containerEl
    if (!container) return

    if (mapRef.current) {
      try {
        mapRef.current.off()
      } catch {
        // ignore
      }

      try {
        mapRef.current.remove()
      } catch {
        // ignore
      }

      mapRef.current = null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((container as any)._leaflet_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (container as any)._leaflet_id
    }

    container.innerHTML = ''

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true
    }).setView(center as L.LatLngExpression, 13)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    containerLeafletIdRef.current = (map as any)?._containerId ?? (container as any)._leaflet_id ?? null

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)

    const layers: L.Layer[] = []

    if (driverPoint) {
      layers.push(L.marker([driverPoint.lat, driverPoint.lng]).addTo(map))
    }

    if (destinationPoint) {
      layers.push(L.marker([destinationPoint.lat, destinationPoint.lng]).addTo(map))
    }

    if (line.length >= 2) {
      layers.push(L.polyline(line as L.LatLngExpression[], { color: '#f97316', weight: 4 }).addTo(map))
    }

    if (line.length >= 1) {
      const bounds = L.latLngBounds(line as L.LatLngExpression[])
      map.fitBounds(bounds, { padding: [24, 24] })
    }

    try {
      resizeObserverRef.current?.disconnect()
    } catch {
      // ignore
    }

    try {
      resizeObserverRef.current = new ResizeObserver(() => {
        try {
          map.invalidateSize({ animate: false })
        } catch {
          // ignore
        }
      })
      resizeObserverRef.current.observe(container)
    } catch {
      resizeObserverRef.current = null
    }

    try {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            map.invalidateSize({ animate: false })
          } catch {
            // ignore
          }
        })
      })
    } catch {
      // ignore
    }

    mapRef.current = map

    return () => {
      try {
        resizeObserverRef.current?.disconnect()
      } catch {
        // ignore
      } finally {
        resizeObserverRef.current = null
      }

      layers.forEach((layer) => {
        try {
          layer.remove()
        } catch {
          // ignore
        }
      })

      try {
        map.off()
      } catch {
        // ignore
      }

      try {
        // Si le conteneur a déjà été réutilisé par une autre instance Leaflet,
        // ne pas retirer la carte pour éviter l'erreur "Map container is being reused by another instance".
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentLeafletId = (container as any)._leaflet_id ?? null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapContainerId = (map as any)?._containerId ?? null
        const canRemove =
          mapContainerId !== null &&
          currentLeafletId !== null &&
          mapContainerId === currentLeafletId &&
          currentLeafletId === containerLeafletIdRef.current

        if (canRemove) {
          try {
            map.remove()
          } catch {
            // ignore: cleanup must never throw
          }
        }
      } finally {
        if (mapRef.current === map) {
          mapRef.current = null
        }
        if (containerLeafletIdRef.current !== null) {
          containerLeafletIdRef.current = null
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((container as any)._leaflet_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (container as any)._leaflet_id
        }
        container.innerHTML = ''
      }
    }
  }, [mapKey, center, containerEl, destinationPoint, driverPoint, line])

  return (
    <div
      key={mapKey}
      className={`w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 ${heightClassName}`}
    >
      <div key={mapKey} ref={setContainerEl} className="h-full w-full" />
    </div>
  )
}
