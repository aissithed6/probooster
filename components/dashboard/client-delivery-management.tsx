"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Settings,
  ShieldCheck,
  Truck
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useNotifications } from "@/components/ui/modern-notification"
import { DeliveryChatReplacement } from "@/components/chat/DeliveryChatReplacement"

const DeliveryTrackingMap = dynamic(() => import("@/components/deliveries/DeliveryTrackingMap"), { ssr: false })
import {
  useClientDeliveries,
  useClientDeliveryPreferences
} from "@/lib/hooks/use-client-deliveries"
import {
  ClientDelivery,
  ClientDeliveryPreferences,
  ClientDeliveryService
} from "@/lib/services/client-delivery-service"
import { normalizeCoordinates } from "@/lib/services/super-admin-delivery-service"

const STATUS_META: Record<
  ClientDelivery["status"],
  { label: string; tone: string; description: string }
> = {
  pending: {
    label: "En attente",
    tone: "border-yellow-200 bg-yellow-50 text-yellow-700",
    description: "La commande est en file pour planification."
  },
  preparing: {
    label: "Préparation",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    description: "Votre commande est en préparation."
  },
  dispatched: {
    label: "Expédiée",
    tone: "border-indigo-200 bg-indigo-50 text-indigo-700",
    description: "La livraison est prise en charge par le transporteur."
  },
  "in_transit": {
    label: "En transit",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
    description: "Le colis se dirige vers l'adresse de livraison."
  },
  delivered: {
    label: "Livrée",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    description: "Le colis a été remis avec succès."
  },
  cancelled: {
    label: "Annulée",
    tone: "border-gray-200 bg-gray-50 text-gray-600",
    description: "Cette livraison a été annulée."
  },
  returned: {
    label: "Retournée",
    tone: "border-orange-200 bg-orange-50 text-orange-700",
    description: "Le colis est en cours de retour."
  },
  failed: {
    label: "Échec",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
    description: "La livraison n'a pas abouti."
  }
}

const CHANNEL_LABELS: Record<keyof ClientDeliveryPreferences["notificationChannels"], string> = {
  email: "Email",
  sms: "SMS",
  push: "Notifications push",
  soundAlerts: "Alertes sonores",
  vibrationAlerts: "Vibrations",
  gpsTracking: "Suivi GPS"
}

interface PreferenceDraft {
  preferredTimeWindow: string
  contactBeforeDelivery: boolean
  leaveAtDoor: boolean
  requireSignature: boolean
  notificationChannels: ClientDeliveryPreferences["notificationChannels"]
  instructions: string
}

/**
 * Sous-section de gestion des livraisons pour le client : suivi temps réel et préférences.
 */
export function ClientDeliveryManagement(): JSX.Element {
  const { addNotification } = useNotifications()
  const {
    data: deliveriesPayload,
    isLoading: deliveriesLoading,
    error: deliveriesError,
    mutate: refreshDeliveries
  } = useClientDeliveries()
  const {
    data: preferencesPayload,
    isLoading: preferencesLoading,
    error: preferencesError,
    mutate: refreshPreferences
  } = useClientDeliveryPreferences()

  const deliveries = useMemo<ClientDelivery[]>(
    () => deliveriesPayload?.data ?? [],
    [deliveriesPayload?.data]
  )

  const previousStatusByDeliveryIdRef = useRef<Map<string, string>>(new Map())
  const autoOpenedChatDeliveryIdsRef = useRef<Set<string>>(new Set())

  const preferences = useMemo<ClientDeliveryPreferences | null>(
    () => preferencesPayload?.data ?? null,
    [preferencesPayload?.data]
  )

  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [preferenceDraft, setPreferenceDraft] = useState<PreferenceDraft | null>(null)

  const [selectedDelivery, setSelectedDelivery] = useState<ClientDelivery | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false)
  const [deliveryProofs, setDeliveryProofs] = useState<Array<{ id: string; public_url: string | null; created_at: string | null }>>([])
  const [isLoadingProofs, setIsLoadingProofs] = useState(false)

    const driverPoint = useMemo(() => {
    const coords = normalizeCoordinates(selectedDelivery?.coordinates)
    if (!coords) return null
    return { lat: coords.lat, lng: coords.lng, label: 'Livreur' }
  }, [selectedDelivery?.coordinates])

  const destinationPoint = useMemo(() => {
    const coords = normalizeCoordinates((selectedDelivery as any)?.destinationCoordinates)
    if (!coords) return null
    return { lat: coords.lat, lng: coords.lng, label: 'Client' }
  }, [(selectedDelivery as any)?.destinationCoordinates])

  const statusStats = useMemo(() => {
    return deliveries.reduce(
      (acc, delivery) => {
        acc.total += 1
        acc.byStatus[delivery.status] = (acc.byStatus[delivery.status] ?? 0) + 1
        if (delivery.status === "delivered") {
          acc.delivered += 1
        }
        if (delivery.status === "in_transit" || delivery.status === "dispatched") {
          acc.active += 1
        }
        if (delivery.status === "failed" || delivery.status === "cancelled") {
          acc.issues += 1
        }
        return acc
      },
      {
        total: 0,
        delivered: 0,
        active: 0,
        issues: 0,
        byStatus: {} as Record<ClientDelivery["status"], number>
      }
    )
  }, [deliveries])

  /**
   * Charge les preuves photo de la livraison sélectionnée.
   */
  const loadSelectedDeliveryProofs = useCallback(async (deliveryId: string) => {
    if (!deliveryId) return
    try {
      setIsLoadingProofs(true)
      const res = await fetch(`/api/client/deliveries/${encodeURIComponent(deliveryId)}/proofs`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error ?? 'Impossible de charger les preuves.')
      }
      setDeliveryProofs((json?.data ?? []) as any)
    } catch (error) {
      setDeliveryProofs([])
    } finally {
      setIsLoadingProofs(false)
    }
  }, [])

  /**
   * Confirme la réception côté client.
   */
  const confirmDeliveryReceived = useCallback(async () => {
    if (!selectedDelivery?.id) return
    try {
      setIsConfirmingReceived(true)
      await ClientDeliveryService.markReceived(selectedDelivery.id)
      addNotification({
        type: 'success',
        title: 'Merci',
        message: 'Réception confirmée. Nous avons notifié les équipes.'
      })
      await refreshDeliveries()
      setSelectedDelivery(null)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Confirmation impossible',
        message: error instanceof Error ? error.message : 'Veuillez réessayer.'
      })
    } finally {
      setIsConfirmingReceived(false)
    }
  }, [addNotification, refreshDeliveries, selectedDelivery?.id])

  useEffect(() => {
    if (!preferences) {
      return
    }

    setPreferenceDraft({
      preferredTimeWindow: preferences.preferredTimeWindow ?? "",
      contactBeforeDelivery: preferences.contactBeforeDelivery,
      leaveAtDoor: preferences.leaveAtDoor,
      requireSignature: preferences.requireSignature,
      notificationChannels: preferences.notificationChannels,
      instructions: String(preferences.metadata?.instructions ?? "")
    })
  }, [preferences])

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshDeliveries(), refreshPreferences()])
    addNotification({
      type: "success",
      title: "Données actualisées",
      message: "Vos livraisons et préférences ont été synchronisées."
    })
  }, [addNotification, refreshDeliveries, refreshPreferences])

  const handleUpdatePreferences = useCallback(async () => {
    if (!preferenceDraft) {
      return
    }

    try {
      setIsSavingPreferences(true)
      await ClientDeliveryService.updatePreferences({
        preferredTimeWindow: preferenceDraft.preferredTimeWindow,
        contactBeforeDelivery: preferenceDraft.contactBeforeDelivery,
        leaveAtDoor: preferenceDraft.leaveAtDoor,
        requireSignature: preferenceDraft.requireSignature,
        notificationChannels: preferenceDraft.notificationChannels,
        metadata: { instructions: preferenceDraft.instructions }
      })

      addNotification({
        type: "success",
        title: "Préférences mises à jour",
        message: "Vos préférences de livraison ont été enregistrées."
      })

      setIsPreferencesModalOpen(false)
      await refreshPreferences()
    } catch (error) {
      addNotification({
        type: "error",
        title: "Sauvegarde impossible",
        message: error instanceof Error ? error.message : "Veuillez réessayer."
      })
    } finally {
      setIsSavingPreferences(false)
    }
  }, [addNotification, preferenceDraft, refreshPreferences])

  const formatDate = useCallback((value?: string | null) => {
    if (!value) {
      return "—"
    }

    try {
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value))
    } catch {
      return value
    }
  }, [])

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [deliveries])

  useEffect(() => {
    if (deliveries.length === 0) return

    const nextPrevious = new Map(previousStatusByDeliveryIdRef.current)
    const candidate = deliveries.find((d) => {
      const id = String(d.id ?? '')
      if (!id) return false
      const prev = String(previousStatusByDeliveryIdRef.current.get(id) ?? '').toLowerCase()
      const now = String(d.status ?? '').toLowerCase()
      return prev !== 'confirmed' && now === 'confirmed'
    })

    deliveries.forEach((d) => {
      const id = String(d.id ?? '')
      if (!id) return
      nextPrevious.set(id, String(d.status ?? ''))
    })
    previousStatusByDeliveryIdRef.current = nextPrevious

    if (!candidate) return
    const candidateId = String(candidate.id)
    if (autoOpenedChatDeliveryIdsRef.current.has(candidateId)) return
    autoOpenedChatDeliveryIdsRef.current.add(candidateId)

    setSelectedDelivery(candidate)
    setIsChatOpen(true)
  }, [deliveries])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gestion de mes livraisons</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Suivez vos colis en temps réel, ajustez vos préférences et contactez votre livreur facilement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => void handleRefresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={() => setIsPreferencesModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <Settings className="mr-2 h-4 w-4" />
            Préférences de livraison
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-sky-200 bg-sky-50/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sky-700">Livraisons actives</CardTitle>
            <Truck className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-900">{statusStats.active}</div>
            <p className="text-xs text-sky-700/80">En cours d'acheminement</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Livraisons reçues</CardTitle>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{statusStats.delivered}</div>
            <p className="text-xs text-emerald-700/80">Total livré</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Surveillance</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{statusStats.issues}</div>
            <p className="text-xs text-amber-700/80">Retards ou incidents</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Livraisons totales</CardTitle>
            <ShieldCheck className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{statusStats.total}</div>
            <p className="text-xs text-gray-600/80">Historique complet</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Livraisons récentes</CardTitle>
          {(deliveriesLoading || preferencesLoading) && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Chargement des données en cours…</span>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {deliveriesError ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              <span>Impossible de charger vos livraisons pour le moment.</span>
            </div>
          ) : sortedDeliveries.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
              <Truck className="h-7 w-7" />
              <span>Aucune livraison à afficher pour l'instant.</span>
              <p className="text-xs text-gray-400 dark:text-gray-500">Vos commandes en préparation s'afficheront ici dès leur expédition.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedDeliveries.map(delivery => (
                <button
                  key={delivery.id}
                  type="button"
                  onClick={() => setSelectedDelivery(delivery)}
                  className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-900/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`border ${STATUS_META[delivery.status]?.tone ?? "border-gray-200 bg-gray-50 text-gray-600"} dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100`}
                      >
                        {STATUS_META[delivery.status]?.label ?? delivery.status}
                      </Badge>
                      {delivery.priority ? (
                        <Badge variant="outline" className="text-xs capitalize text-gray-600 dark:text-gray-300 dark:border-gray-700">
                          Priorité {delivery.priority}
                        </Badge>
                      ) : null}
                      {delivery.trackingNumber ? (
                        <Badge variant="outline" className="text-xs text-gray-600 dark:text-gray-300 dark:border-gray-700">
                          Tracking {delivery.trackingNumber}
                        </Badge>
                      ) : null}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(delivery.createdAt)}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Commande</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">#{delivery.orderNumber ?? delivery.orderId}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Livreur</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{delivery.driver?.name ?? "Non assigné"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{delivery.driver?.phone ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Localisation</p>
                      <p className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
                        {delivery.currentLocation ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Adresse:{' '}
                        {typeof delivery.deliveryAddress === 'string' && delivery.deliveryAddress.trim().length > 0
                          ? delivery.deliveryAddress
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500 dark:text-gray-400">ETA</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(delivery.eta)}</p>
                    </div>
                  </div>

                  {STATUS_META[delivery.status]?.description ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {STATUS_META[delivery.status]?.description}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedDelivery)}
        onOpenChange={value => {
          if (!value) {
            setSelectedDelivery(null)
            setDeliveryProofs([])
            setIsChatOpen(false)
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Truck className="h-5 w-5 text-orange-500" />
              Détails de la livraison
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Consultez la chronologie complète et les informations de contact du livreur.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            {selectedDelivery ? (
              <div className="space-y-6 pr-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Tracking</h3>
                  <Badge variant="outline" className="text-xs text-gray-600">
                    Carte
                  </Badge>
                </div>
                <DeliveryTrackingMap driverPoint={driverPoint} destinationPoint={destinationPoint} />
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Coordonnées destination</span>
                    <span className="font-medium text-gray-900">
                      {destinationPoint ? `${destinationPoint.lat.toFixed(5)}, ${destinationPoint.lng.toFixed(5)}` : '—'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-500">Adresse</span>
                    <span className="text-right font-medium text-gray-900">
                      {selectedDelivery.deliveryAddress ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Heure (ETA)</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedDelivery.eta)}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Commande</p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{selectedDelivery.orderNumber ?? selectedDelivery.orderId}
                      </h3>
                    </div>
                    <Badge className={`border ${STATUS_META[selectedDelivery.status]?.tone ?? "border-gray-200 bg-gray-50 text-gray-600"}`}>
                      {STATUS_META[selectedDelivery.status]?.label ?? selectedDelivery.status}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <dl className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <dt>Tracking</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.trackingNumber ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Progression</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.progressPercent}%</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Méthode</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.shippingMethod?.name ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Transporteur</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.carrier?.name ?? "—"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Livreur</p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedDelivery.driver?.name ?? "Non assigné"}
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      disabled={!selectedDelivery.driver?.phone}
                      className="h-8"
                      onClick={() => {
                        if (!selectedDelivery.driver?.phone) {
                          return
                        }
                        window.open(`tel:${selectedDelivery.driver.phone}`)
                      }}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Appeler
                    </Button>
                  </div>
                  <Separator className="my-3" />
                  <dl className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <dt>Téléphone</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.driver?.phone ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Véhicule</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.driver?.vehiclePlate ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>ETA</dt>
                      <dd className="font-medium text-gray-900">{formatDate(selectedDelivery.eta)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Dernière mise à jour</dt>
                      <dd className="font-medium text-gray-900">{formatDate(selectedDelivery.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {selectedDelivery.events.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Chronologie</h3>
                    <Badge variant="outline" className="text-xs text-gray-600">
                      {selectedDelivery.events.length} évènement(s)
                    </Badge>
                  </div>
                  <ScrollArea className="max-h-60 pr-4">
                    <div className="space-y-4">
                      {selectedDelivery.events.map(event => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {event.status ?? event.type ?? "Mise à jour"}
                              </p>
                              <Badge variant="outline" className="text-xs text-gray-600">
                                {formatDate(event.occurredAt)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{event.description ?? "—"}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              {event.location ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {event.location}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-6 text-center text-sm text-gray-500">
                  Aucun évènement pour le moment.
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Preuve de livraison</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void loadSelectedDeliveryProofs(selectedDelivery.id)}
                    disabled={isLoadingProofs}
                  >
                    {isLoadingProofs ? 'Chargement…' : 'Actualiser'}
                  </Button>
                </div>

                {deliveryProofs.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Aucune preuve enregistrée pour le moment.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {deliveryProofs
                      .filter((p) => typeof p?.public_url === 'string' && p.public_url)
                      .map((proof) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={proof.id}
                          src={String(proof.public_url)}
                          alt="Preuve de livraison"
                          className="h-40 w-full rounded-lg border border-gray-200 object-cover"
                        />
                      ))}
                  </div>
                )}
              </div>
              </div>
            ) : null}
          </ScrollArea>

          <DialogFooter>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              {selectedDelivery ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsChatOpen(true)}
                >
                  Chat livraison
                </Button>
              ) : null}

              {selectedDelivery && String(selectedDelivery.status).toLowerCase() === 'delivered' ? (
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={isConfirmingReceived}
                  onClick={() => void confirmDeliveryReceived()}
                >
                  {isConfirmingReceived ? 'Confirmation…' : 'Livraison reçue'}
                </Button>
              ) : null}

              <Button
                variant="outline"
                onClick={() => setSelectedDelivery(null)}
              >
                Fermer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedDelivery ? (
        <DeliveryChatReplacement
          deliveryInfo={selectedDelivery}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      ) : null}

      <Dialog open={isPreferencesModalOpen} onOpenChange={setIsPreferencesModalOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Settings className="h-5 w-5 text-orange-500" />
              Préférences de livraison
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Ajustez vos préférences pour toutes vos prochaines livraisons.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {preferencesError ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <span>Impossible de récupérer vos préférences pour le moment.</span>
              </div>
            ) : !preferenceDraft ? (
              <div className="flex h-40 flex-col items-center justify-center gap-3 text-gray-500">
                <Truck className="h-7 w-7" />
                <span>Chargement des préférences…</span>
              </div>
            ) : (
              <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Créneau préféré</Label>
                  <Input
                    placeholder="Ex. 9h - 18h"
                    value={preferenceDraft.preferredTimeWindow}
                    onChange={event =>
                      setPreferenceDraft(prev =>
                        prev
                          ? { ...prev, preferredTimeWindow: event.target.value }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Instructions</Label>
                  <Textarea
                    placeholder="Détails supplémentaires pour le livreur"
                    value={preferenceDraft.instructions}
                    onChange={event =>
                      setPreferenceDraft(prev =>
                        prev ? { ...prev, instructions: event.target.value } : prev
                      )
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Appeler avant la livraison</p>
                    <p className="text-xs text-gray-500">Le livreur vous contactera avant d'arriver.</p>
                  </div>
                  <Switch
                    checked={preferenceDraft.contactBeforeDelivery}
                    onCheckedChange={value =>
                      setPreferenceDraft(prev =>
                        prev ? { ...prev, contactBeforeDelivery: value } : prev
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Signature requise</p>
                    <p className="text-xs text-gray-500">Assure la remise en mains propres.</p>
                  </div>
                  <Switch
                    checked={preferenceDraft.requireSignature}
                    onCheckedChange={value =>
                      setPreferenceDraft(prev =>
                        prev ? { ...prev, requireSignature: value } : prev
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Déposer devant la porte</p>
                    <p className="text-xs text-gray-500">Autorise le dépôt sans contact.</p>
                  </div>
                  <Switch
                    checked={preferenceDraft.leaveAtDoor}
                    onCheckedChange={value =>
                      setPreferenceDraft(prev =>
                        prev ? { ...prev, leaveAtDoor: value } : prev
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Canaux de notification</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {(Object.keys(CHANNEL_LABELS) as Array<keyof ClientDeliveryPreferences["notificationChannels"]>).map(channel => (
                    <div key={channel} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                      <span className="text-sm text-gray-700">{CHANNEL_LABELS[channel]}</span>
                      <Switch
                        checked={preferenceDraft.notificationChannels[channel]}
                        onCheckedChange={value =>
                          setPreferenceDraft(prev =>
                            prev
                              ? {
                                  ...prev,
                                  notificationChannels: {
                                    ...prev.notificationChannels,
                                    [channel]: value
                                  }
                                }
                              : prev
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreferencesModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleUpdatePreferences()} disabled={isSavingPreferences}>
              {isSavingPreferences ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sauvegarde…
                </span>
              ) : (
                "Sauvegarder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
