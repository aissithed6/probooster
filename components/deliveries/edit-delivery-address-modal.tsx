'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export interface AddressChangeDelivery {
  id: string
  status?: string
  paymentMethod?: string | null
  deliveryAddress?: string | null
  destinationCoordinates?: { lat?: number; lng?: number } | null
  shippingMethod?: { basePrice?: number | null } | null
  orders?: { shippingCost?: number | null } | null
}

interface QuoteResult {
  oldShippingCost: number
  newShippingCost: number
  supplement: number
  requiresPayment: boolean
}

const ZONES = [
  { value: 'local', label: 'Local (quartier)' },
  { value: 'national', label: 'National (ville/département)' },
  { value: 'regional', label: 'Régional' },
  { value: 'international', label: 'International' }
]

const EDITABLE_STATUSES = ['pending', 'processing', 'confirmed', 'preparing']

export function EditDeliveryAddressModal({
  delivery,
  open,
  onOpenChange,
  onUpdated
}: {
  delivery: AddressChangeDelivery | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (result: { shippingAddress: string | null; destinationCoordinates: { lat: number; lng: number } | null }) => void
}) {
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [zone, setZone] = useState('local')
  const [city, setCity] = useState('')
  const [department, setDepartment] = useState('')
  const [country, setCountry] = useState('')
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState('')
  const [isDetectingGps, setIsDetectingGps] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'form' | 'paying' | 'done'>('form')
  // Recherche de lieu exact (géocodage direct) : saisie → suggestions → point précis.
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<
    Array<{ label: string; lat: number; lng: number; neighborhood: string | null; city: string | null; country: string | null }>
  >([])
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const [showPlaceResults, setShowPlaceResults] = useState(false)

     const isEditable = useMemo(() => {
    const status = String((delivery as any)?.status ?? '').toLowerCase()
    return EDITABLE_STATUSES.includes(status)
  }, [delivery])

  // Mode de paiement de la commande : si COD, le supplément est payé à la livraison.
  const paymentMethod = String((delivery as any)?.paymentMethod ?? '').toLowerCase().trim()
  const isCod = paymentMethod === 'cod' || paymentMethod === 'cash_on_delivery' || paymentMethod === 'cash'


  const initializedDeliveryIdRef = useRef<string | null>(null)

  // À la fermeture, on oublie la livraison initialisée pour que la prochaine ouverture
  // recharge les valeurs à jour (notamment après une modification réussie).
  useEffect(() => {
    if (!open) {
      initializedDeliveryIdRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open || !delivery) return
    // Ne (ré)initialiser le formulaire QUE quand on ouvre le modal pour une NOUVELLE livraison.
    // Le parent recrée l'objet `delivery` à chaque render (objet inline) : sans ce garde,
    // chaque re-render du parent effacerait les champs (GPS/adresse) et le prix en direct.
    if (initializedDeliveryIdRef.current === delivery.id) return
    initializedDeliveryIdRef.current = delivery.id
    setAddress(String(delivery.deliveryAddress ?? ''))
    const coords = delivery.destinationCoordinates
    setLat(coords?.lat !== undefined && coords?.lat !== null ? String(coords.lat) : '')
    setLng(coords?.lng !== undefined && coords?.lng !== null ? String(coords.lng) : '')
    setQuote(null)
    setError('')
    setPaymentStep('form')
  }, [open, delivery])

  const buildPayload = useCallback(
    () => ({
      shippingAddress: address.trim() || null,
      shippingLat: lat.trim() ? Number(lat.trim().replace(',', '.')) : null,
      shippingLng: lng.trim() ? Number(lng.trim().replace(',', '.')) : null,
      zone,
      mode: 'standard',
      city: city.trim() || null,
      department: department.trim() || null,
      localDistrict: zone === 'local' ? address.trim() || null : null,
      regionDepartment: zone === 'regional' ? department.trim() || null : null,
      country: country.trim() || null
    }),
    [address, lat, lng, zone, city, department, country]
  )

  const payloadHasChange = useCallback(() => {
    if (!delivery) return false
    const p = buildPayload()
    const oldLat = delivery.destinationCoordinates?.lat ?? null
    const oldLng = delivery.destinationCoordinates?.lng ?? null
    const addressChanged = (p.shippingAddress ?? '') !== String(delivery.deliveryAddress ?? '')
    const coordsChanged =
      (p.shippingLat !== null && oldLat !== null && (Math.abs(p.shippingLat - oldLat) > 1e-6 || Math.abs((p.shippingLng ?? 0) - (oldLng ?? 0)) > 1e-6)) ||
      (p.shippingLat !== null && oldLat === null)
    return addressChanged || coordsChanged
  }, [delivery, buildPayload])

  // Quote en direct (debounce) dès que le payload change
  useEffect(() => {
    if (!open || !delivery || !isEditable) return
    if (!payloadHasChange()) {
      setQuote(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsQuoting(true)
      setError('')
      try {
        const resp = await fetch(`/api/client/deliveries/${delivery.id}/quote-change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload())
        })
        const json = await resp.json().catch(() => null)
        if (!resp.ok) {
          setQuote(null)
          setError(String(json?.error ?? 'Erreur lors du calcul du prix.'))
        } else {
          setQuote((json as any)?.data ?? null)
        }
      } catch {
        setQuote(null)
        setError('Erreur réseau lors du calcul du prix.')
      } finally {
        setIsQuoting(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [open, delivery, isEditable, buildPayload, payloadHasChange])

  const handleDetectGps = () => {
    if (typeof navigator === 'undefined' || !navigator?.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.")
      return
    }
    setIsDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude))
        setLng(String(pos.coords.longitude))
        setIsDetectingGps(false)
      },
      () => {
        setError('Impossible de détecter la position GPS (permission refusée ?).')
        setIsDetectingGps(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Recherche de lieu debouncée (≥3 caractères) : suggestions en direct.
  useEffect(() => {
    if (!open || !isEditable) return
    const q = placeQuery.trim()
    if (q.length < 3) {
      setPlaceResults([])
      setShowPlaceResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true)
      try {
        const resp = await fetch(
          `/api/client/deliveries/search-places?q=${encodeURIComponent(q)}${
            lat.trim() && lng.trim() ? `&lat=${encodeURIComponent(lat.trim())}&lng=${encodeURIComponent(lng.trim())}` : ''
          }`
        )
        const json = await resp.json().catch(() => null)
        const results: Array<any> = Array.isArray(json?.data) ? json.data : []
        setPlaceResults(results)
        setShowPlaceResults(true)
      } catch {
        setPlaceResults([])
      } finally {
        setIsSearchingPlaces(false)
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [placeQuery, open, isEditable, lat, lng])

  // Sélection d'un lieu suggéré : remplit adresse + GPS + ville/pays automatiquement.
  const handleSelectPlace = useCallback((place: { label: string; lat: number; lng: number; neighborhood: string | null; city: string | null; country: string | null }) => {
    setAddress(place.label)
    setLat(String(place.lat))
    setLng(String(place.lng))
    if (place.city) setCity(place.city)
    if (place.country) setCountry(place.country)
    setShowPlaceResults(false)
  }, [])

  const handleSubmit = async () => {
    if (!delivery) return
    setError('')

    if (!payloadHasChange()) {
      setError('Aucune modification détectée.')
      return
    }

    setIsPaying(true)
    try {
      // 1) Paiement FeexPay si un supplément est dû (désactivé en mode COD)
      let paymentReference: string | null = null

      if (quote?.requiresPayment && !isCod) {
        const initResp = await fetch('/api/client/payments/feexpay/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: quote.supplement,
            currency: 'XOF',
            method: 'mobile_money',
            description: `Supplément livraison - modification d'adresse #${delivery.id.slice(0, 8)}`,
            metadata: { deliveryId: delivery.id, type: 'address_change_supplement' }
          })
        })
        const initJson = await initResp.json().catch(() => null)
        if (!initResp.ok) {
          setError(String(initJson?.error ?? "L'initialisation du paiement a échoué."))
          setIsPaying(false)
          return
        }

        paymentReference = String(initJson?.reference ?? '')
        const paymentUrl = typeof initJson?.paymentUrl === 'string' ? initJson.paymentUrl : null

        // Mode live: ouvrir l'URL de paiement FeexPay et attendre la validation manuelle
        if (paymentUrl) {
          window.open(paymentUrl, '_blank')
          setPaymentStep('paying')
          setError("Finalisez le paiement dans l'onglet ouvert, puis recliquez sur Valider.")
          setIsPaying(false)
          return
        }
      }

      // 2) Confirmation (mise à jour + vérification paiement côté serveur)
      const confirmResp = await fetch(`/api/client/deliveries/${delivery.id}/update-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), paymentReference })
      })
      const confirmJson = await confirmResp.json().catch(() => null)

      if (!confirmResp.ok) {
        setError(String(confirmJson?.error ?? 'La mise à jour a échoué.'))
        setIsPaying(false)
        return
      }

      const data = (confirmJson as any)?.data
      setPaymentStep('done')
      onUpdated({
        shippingAddress: data?.shippingAddress ?? null,
        // L'API update-address renvoie `coordinates` (et non `destinationCoordinates`) :
        // sans ce fallback, la carte de tracking ne se rafraîchissait qu'à la réouverture.
        destinationCoordinates: data?.destinationCoordinates ?? data?.coordinates ?? null
      })
      setTimeout(() => onOpenChange(false), 600)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setIsPaying(false)
    }
  }

  if (!delivery) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;adresse de livraison</DialogTitle>
          <DialogDescription>
            Le prix de livraison sera recalculé en direct selon les zones configurées par l&apos;admin. Si un supplément est nécessaire, il vous sera demandé avant validation.{' '}
            {(() => {
              const pm = String((delivery as any)?.paymentMethod ?? '').toLowerCase().trim()
              const cod = pm === 'cod' || pm === 'cash_on_delivery' || pm === 'cash'
              return cod
                ? 'Mode paiement : paiement à la livraison (COD). Le supplément sera récupéré par le livreur.'
                : 'Mode paiement : carte en ligne (FeexPay).'
            })()}
          </DialogDescription>
        </DialogHeader>

        {!isEditable ? (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            Cette livraison ne peut plus être modifiée (elle a déjà été expédiée ou livrée).
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-address">Adresse de livraison</Label>
              <Input
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Cotonou, quartier Fidjrossè, rue..."
              />
            </div>

            {/* Recherche de lieu exact : suggestions → point précis (Mapbox/Nominatim) */}
            <div className="relative space-y-2">
              <Label htmlFor="edit-place-search">Rechercher un lieu exact</Label>
              <Input
                id="edit-place-search"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                onFocus={() => placeResults.length > 0 && setShowPlaceResults(true)}
                placeholder="Ex: Fidjrossè, Cotonou — nom de lieu, quartier, repère..."
                autoComplete="off"
              />
              {isSearchingPlaces && (
                <p className="text-xs text-gray-500">Recherche en cours...</p>
              )}
              {showPlaceResults && placeResults.length > 0 && (
                <ul className="absolute z-30 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {placeResults.map((place, idx) => (
                    <li key={`${place.lat}-${place.lng}-${idx}`}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 dark:hover:bg-orange-950/40"
                        onClick={() => handleSelectPlace(place)}
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">{place.label}</span>
                        {(place.neighborhood || place.city) && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {[place.neighborhood, place.city, place.country].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showPlaceResults && !isSearchingPlaces && placeQuery.trim().length >= 3 && placeResults.length === 0 && (
                <p className="text-xs text-gray-400">Aucun lieu trouvé. Essayez un autre terme.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Zone de livraison</Label>
            <div className="space-y-2">
              <Label>Zone de livraison</Label>
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map((z) => (
                    <SelectItem key={z.value} value={z.value}>
                      {z.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {zone === 'national' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Ville</Label>
                  <Input id="edit-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dept">Département</Label>
                  <Input id="edit-dept" value={department} onChange={(e) => setDepartment(e.target.value)} />
                </div>
              </div>
            )}

            {zone === 'regional' && (
              <div className="space-y-2">
                <Label htmlFor="edit-region">Région / Département</Label>
                <Input id="edit-region" value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
            )}

            {zone === 'international' && (
              <div className="space-y-2">
                <Label htmlFor="edit-country">Pays</Label>
                <Input id="edit-country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Coordonnées GPS</Label>
              <div className="flex gap-2">
                <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" />
                <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleDetectGps} disabled={isDetectingGps} className="w-full">
                {isDetectingGps ? 'Détection...' : '📍 Détecter ma position GPS'}
              </Button>
            </div>

            {isQuoting && <p className="text-sm text-gray-500">Calcul du prix en cours...</p>}

            {quote && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/40">
                <div className="flex items-center justify-between text-sm">
                  <span>Ancien coût livraison</span>
                  <span className="font-medium">{quote.oldShippingCost.toLocaleString()} FCFA</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Nouveau coût livraison</span>
                  <span className="font-medium">{quote.newShippingCost.toLocaleString()} FCFA</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-orange-200 pt-2 dark:border-orange-900">
                  <span className="font-semibold">{quote.requiresPayment ? 'Supplément à payer' : 'Aucun supplément'}</span>
                  <span className={`text-lg font-bold ${quote.requiresPayment ? 'text-orange-600' : 'text-green-600'}`}>
                    {quote.requiresPayment ? `${quote.supplement.toLocaleString()} FCFA` : '0 FCFA'}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</p>
            )}

            {paymentStep === 'done' && (
              <p className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                ✅ Adresse mise à jour avec succès partout (carte incluse).
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPaying}>
            Fermer
          </Button>
          {isEditable && (
            <Button
              onClick={handleSubmit}
              disabled={isPaying || isQuoting || !payloadHasChange() || (quote === null && payloadHasChange())}
            >
                          {isPaying
                ? 'Traitement...'
                : isCod
                  ? quote?.requiresPayment
                    ? `🧾 Supplément à payer à la livraison (${quote.supplement.toLocaleString()} FCFA)`
                    : "✅ Mettre à jour l'adresse"
                  : quote?.requiresPayment
                    ? `💳 Payer le supplément (${quote.supplement.toLocaleString()} FCFA)`
                    : "✅ Mettre à jour l'adresse"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

