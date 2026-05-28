"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Info,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  User
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useNotifications } from "@/components/ui/modern-notification"
import {
  SuperAdminDeliveryRecord,
  SuperAdminDeliveryService,
  SuperAdminDeliveryStatus
} from "@/lib/services/super-admin-delivery-service"
import { SuperAdminOrderService } from "@/lib/services/super-admin-order-service"

interface OrderChoice {
  id: string
  label: string
  customerId: string | null
  vendorId: string | null
}

const DELIVERY_STATUS_CONFIG: Record<SuperAdminDeliveryStatus, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  confirmed: { label: "Confirmée", tone: "border-blue-200 bg-blue-50 text-blue-700" },
  preparing: { label: "En préparation", tone: "border-purple-200 bg-purple-50 text-purple-700" },
  ready_for_pickup: { label: "Prête", tone: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  in_transit: { label: "En transit", tone: "border-sky-200 bg-sky-50 text-sky-700" },
  out_for_delivery: { label: "En cours de livraison", tone: "border-orange-200 bg-orange-50 text-orange-700" },
  delayed: { label: "Retard", tone: "border-amber-200 bg-amber-50 text-amber-700" },
  delivered: { label: "Livrée", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  failed: { label: "Échec", tone: "border-rose-200 bg-rose-50 text-rose-700" },
  cancelled: { label: "Annulée", tone: "border-gray-200 bg-gray-50 text-gray-600" }
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-rose-500/10 text-rose-600",
  high: "bg-orange-500/10 text-orange-600",
  medium: "bg-blue-500/10 text-blue-600",
  low: "bg-emerald-500/10 text-emerald-600"
}

/**
 * Formatte une date ISO en texte lisible pour l’interface.
 */
function formatDate(value?: string | null): string {
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
}

/**
 * Calcule le libellé lisible d’une progression de livraison.
 */
function formatProgressLabel(progress: number): string {
  if (progress >= 100) {
    return "Finalisé"
  }
  if (progress >= 75) {
    return "Quasi livré"
  }
  if (progress >= 50) {
    return "Mi-parcours"
  }
  if (progress >= 25) {
    return "Démarré"
  }
  return "Planifié"
}

/**
 * Section de gestion complète des livraisons côté super administrateur.
 */
export default function DeliveryManagement(): JSX.Element {
  const { addNotification } = useNotifications()
  const [deliveries, setDeliveries] = useState<SuperAdminDeliveryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  const [orderFilter, setOrderFilter] = useState<string>("all")

  const [selectedDelivery, setSelectedDelivery] = useState<SuperAdminDeliveryRecord | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [orderChoices, setOrderChoices] = useState<OrderChoice[]>([])

  const [newDeliveryForm, setNewDeliveryForm] = useState({
    orderId: "",
    customerId: "",
    status: "pending" as SuperAdminDeliveryStatus,
    priority: "medium",
    eta: "",
    trackingNumber: "",
    driverName: "",
    driverPhone: "",
    driverVehicle: ""
  })

  const vendorOptions = useMemo(() => {
    const ids = new Map<string, string>()
    deliveries.forEach(delivery => {
      if (delivery.vendorId) {
        ids.set(delivery.vendorId, delivery.vendorId)
      }
    })
    return Array.from(ids.values())
  }, [deliveries])

  const orderOptions = useMemo(() => deliveries.map(delivery => delivery.orderId), [deliveries])

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
      const matchesVendor = vendorFilter === "all" || delivery.vendorId === vendorFilter
      const matchesOrder = orderFilter === "all" || delivery.orderId === orderFilter
      const matchesSearch = searchTerm.length === 0
        ? true
        : [
            delivery.orderNumber,
            delivery.trackingNumber,
            delivery.driver?.name,
            delivery.currentLocation
          ]
            .filter(Boolean)
            .some(value => value?.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesStatus && matchesVendor && matchesOrder && matchesSearch
    })
  }, [deliveries, statusFilter, vendorFilter, orderFilter, searchTerm])

  const statusStats = useMemo(() => {
    return deliveries.reduce(
      (acc, delivery) => {
        acc.total += 1
        acc.byStatus[delivery.status] = (acc.byStatus[delivery.status] ?? 0) + 1
        if (delivery.status === "delivered") {
          acc.delivered += 1
        }
        if (delivery.status === "delayed" || delivery.status === "failed") {
          acc.issues += 1
        }
        return acc
      },
      {
        total: 0,
        delivered: 0,
        issues: 0,
        byStatus: {} as Record<SuperAdminDeliveryStatus, number>
      }
    )
  }, [deliveries])

  /**
   * Charge les livraisons depuis l’API avec gestion des erreurs et notifications.
   */
  const loadDeliveries = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadingError(null)
      const data = await SuperAdminDeliveryService.list()
      setDeliveries(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue"
      setLoadingError(message)
      addNotification({
        type: "error",
        title: "Chargement des livraisons",
        message
      })
    } finally {
      setIsLoading(false)
    }
  }, [addNotification])

  /**
   * Charge les commandes éligibles pour faciliter la création d’une livraison.
   */
  const loadOrderChoices = useCallback(async () => {
    try {
      const response = await SuperAdminOrderService.list({ limit: 100 })
      if (!Array.isArray(response)) {
        setOrderChoices([])
        return
      }

      const mapped = response.map(order => ({
        id: order.id,
        label: `${order.order_number ?? order.id} — ${order.customer_name ?? "Client"}`,
        customerId: order.customer_id ?? null,
        vendorId: order.vendor_id ?? null
      }))

      setOrderChoices(mapped)
    } catch (error) {
      console.error("❌ Impossible de récupérer les commandes disponibles", error)
    }
  }, [])

  useEffect(() => {
    void loadDeliveries()
  }, [loadDeliveries])

  useEffect(() => {
    if (isCreateOpen) {
      void loadOrderChoices()
    }
  }, [isCreateOpen, loadOrderChoices])

  /**
   * Soumet la création d’une nouvelle livraison via le service API.
   */
  const handleCreateDelivery = useCallback(async () => {
    try {
      if (!newDeliveryForm.orderId || !newDeliveryForm.customerId) {
        addNotification({
          type: "warning",
          title: "Création impossible",
          message: "Sélectionnez la commande et le client associés."
        })
        return
      }

      setIsCreating(true)
      await SuperAdminDeliveryService.create({
        orderId: newDeliveryForm.orderId,
        customerId: newDeliveryForm.customerId,
        status: newDeliveryForm.status,
        priority: newDeliveryForm.priority,
        eta: newDeliveryForm.eta || null,
        trackingNumber: newDeliveryForm.trackingNumber || null,
        driver: {
          name: newDeliveryForm.driverName || null,
          phone: newDeliveryForm.driverPhone || null,
          vehiclePlate: newDeliveryForm.driverVehicle || null
        }
      })

      addNotification({
        type: "success",
        title: "Livraison créée",
        message: "La livraison a été créée et planifiée avec succès."
      })

      setIsCreateOpen(false)
      setNewDeliveryForm({
        orderId: "",
        customerId: "",
        status: "pending",
        priority: "medium",
        eta: "",
        trackingNumber: "",
        driverName: "",
        driverPhone: "",
        driverVehicle: ""
      })

      await loadDeliveries()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la création"
      addNotification({
        type: "error",
        title: "Création échouée",
        message
      })
    } finally {
      setIsCreating(false)
    }
  }, [addNotification, loadDeliveries, newDeliveryForm])

  const handleSelectOrderChoice = useCallback(
    (orderId: string) => {
      setNewDeliveryForm(prev => ({
        ...prev,
        orderId,
        customerId: orderChoices.find(order => order.id === orderId)?.customerId ?? ""
      }))
    },
    [orderChoices]
  )

  const openDetails = useCallback((delivery: SuperAdminDeliveryRecord) => {
    setSelectedDelivery(delivery)
    setIsDetailsOpen(true)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des livraisons</h2>
          <p className="text-sm text-gray-600">
            Supervisez, configurez et suivez en temps réel toutes les livraisons de la marketplace.
          </p>
        </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => void loadDeliveries()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Actualiser
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle livraison
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-blue-200 bg-blue-50/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Livraisons actives</CardTitle>
              <Truck className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{statusStats.total}</div>
              <p className="text-xs text-blue-700/80">Surveillance continue et suivi multi-acteurs</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Livraisons livrées</CardTitle>
              <PackageCheck className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">{statusStats.delivered}</div>
              <p className="text-xs text-emerald-700/80">Total des livraisons finalisées</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Surveillances critiques</CardTitle>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">{statusStats.issues}</div>
              <p className="text-xs text-amber-700/80">Retards ou incidents en cours</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="space-y-2 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Filtrer et orchestrer</CardTitle>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher (commande, tracking, livreur…)"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {(Object.keys(DELIVERY_STATUS_CONFIG) as SuperAdminDeliveryStatus[]).map(status => (
                    <SelectItem key={status} value={status}>
                      {DELIVERY_STATUS_CONFIG[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Vendeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les vendeurs</SelectItem>
                  {vendorOptions.map(vendorId => (
                    <SelectItem key={vendorId} value={vendorId}>
                      {vendorId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={orderFilter} onValueChange={setOrderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Commande" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les commandes</SelectItem>
                  {orderOptions.map(orderId => (
                    <SelectItem key={orderId} value={orderId}>
                      {orderId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="max-h-[540px] overflow-auto">
              {isLoading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Chargement des livraisons…</span>
                </div>
              ) : loadingError ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                  <span>{loadingError}</span>
                </div>
              ) : filteredDeliveries.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
                  <Truck className="h-7 w-7" />
                  <span>Aucune livraison à afficher avec ces critères.</span>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDeliveries.map(delivery => (
                    <button
                      key={delivery.id}
                      type="button"
                      onClick={() => openDetails(delivery)}
                      className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`border ${DELIVERY_STATUS_CONFIG[delivery.status].tone}`}>
                            {DELIVERY_STATUS_CONFIG[delivery.status].label}
                          </Badge>
                          <Badge className={`text-xs capitalize ${PRIORITY_COLORS[delivery.priority] ?? PRIORITY_COLORS.medium}`}>
                            Priorité {delivery.priority}
                          </Badge>
                          {delivery.trackingNumber ? (
                            <Badge variant="outline" className="text-xs text-gray-600">
                              Tracking {delivery.trackingNumber}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Créée le {formatDate(delivery.createdAt)}</span>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase text-gray-500">Commande</p>
                          <p className="font-semibold text-gray-900">#{delivery.orderNumber ?? delivery.orderId}</p>
                          <p className="text-xs text-gray-500">Client: {delivery.customerId ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-gray-500">Livreur</p>
                          <p className="font-medium text-gray-900">{delivery.driver?.name ?? "Non assigné"}</p>
                          <p className="text-xs text-gray-500">{delivery.driver?.phone ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-gray-500">Progression</p>
                          <p className="font-medium text-gray-900">{delivery.progressPercent}%</p>
                          <p className="text-xs text-gray-500">{formatProgressLabel(delivery.progressPercent)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-gray-500">Localisation</p>
                          <p className="flex items-center gap-1 font-medium text-gray-900">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            {delivery.currentLocation ?? "—"}
                          </p>
                          <p className="text-xs text-gray-500">ETA: {formatDate(delivery.eta)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Truck className="h-5 w-5 text-orange-500" />
                Détails de la livraison
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Visualisez la chronologie, les affectations et les paramètres avancés de la livraison.
              </DialogDescription>
            </DialogHeader>

            {selectedDelivery ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-gray-500">Commande</p>
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{selectedDelivery.orderNumber ?? selectedDelivery.orderId}
                        </h3>
                      </div>
                      <Badge className={`border ${DELIVERY_STATUS_CONFIG[selectedDelivery.status].tone}`}>
                        {DELIVERY_STATUS_CONFIG[selectedDelivery.status].label}
                      </Badge>
                    </div>
                    <Separator className="my-3" />
                    <dl className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <dt>Client</dt>
                        <dd className="font-medium text-gray-900">{selectedDelivery.customerId ?? "—"}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Vendeur</dt>
                        <dd className="font-medium text-gray-900">{selectedDelivery.vendorId ?? "—"}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Tracking</dt>
                        <dd className="font-medium text-gray-900">{selectedDelivery.trackingNumber ?? "—"}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Progression</dt>
                        <dd className="font-medium text-gray-900">{selectedDelivery.progressPercent}%</dd>
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
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    </div>
                    <Separator className="my-3" />
                    <dl className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <dt>Téléphone</dt>
                        <dd className="font-medium text-gray-900">{selectedDelivery.driver?.phone ?? "—"}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Immatriculation</dt>
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
                      <h3 className="text-sm font-semibold text-gray-900">Chronologie de la livraison</h3>
                      <Badge variant="outline" className="text-xs text-gray-600">
                        {selectedDelivery.events.length} évènement(s)
                      </Badge>
                    </div>
                    <ScrollArea className="max-h-72 pr-4">
                      <div className="space-y-4">
                        {selectedDelivery.events.map(event => (
                          <div key={event.id} className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                              <ArrowUpRight className="h-4 w-4" />
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
                                {event.coordinates ? (
                                  <span>
                                    Lat {event.coordinates.lat.toFixed(4)} / Lng {event.coordinates.lng.toFixed(4)}
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
                    Aucun évènement enregistré pour cette livraison.
                  </div>
                )}
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col bg-gradient-to-br from-white to-gray-50 p-0 shadow-xl">
            <DialogHeader className="border-b border-gray-200 p-6 pb-4">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-orange-600">
                <Truck className="h-6 w-6" />
                Planification de livraison
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Configurez la livraison pour la commande <span className="font-semibold text-orange-500">{newDeliveryForm.orderId ? `#${newDeliveryForm.orderId}` : ''}</span>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] flex-1 overflow-y-auto p-6 pt-0">
              <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Package className="h-4 w-4 text-orange-500" />
                  Commande à livrer
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Select 
                    value={newDeliveryForm.orderId} 
                    onValueChange={handleSelectOrderChoice}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                      <SelectValue placeholder="Sélectionner une commande" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 shadow-lg">
                      {orderChoices.length === 0 ? (
                        <div className="py-2 text-center text-sm text-gray-500">
                          Aucune commande disponible
                        </div>
                      ) : (
                        orderChoices.map(order => (
                          <SelectItem 
                            key={order.id} 
                            value={order.id}
                            className="hover:bg-orange-50 focus:bg-orange-50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">#{order.id}</span>
                              <span className="text-gray-500">- Client: {order.customerId || 'Non spécifié'}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 border-gray-300 text-gray-500 hover:bg-orange-50 hover:text-orange-600">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Date de livraison estimée
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={newDeliveryForm.eta}
                    onChange={e => setNewDeliveryForm(prev => ({ ...prev, eta: e.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Niveau de priorité
                  </Label>
                  <Select
                    value={newDeliveryForm.priority}
                    onValueChange={value => setNewDeliveryForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 shadow-lg">
                      <SelectItem value="low" className="hover:bg-orange-50 focus:bg-orange-50">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                          <span>Basse priorité</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="hover:bg-orange-50 focus:bg-orange-50">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span>Moyenne priorité</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high" className="hover:bg-orange-50 focus:bg-orange-50">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          <span>Haute priorité</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="critical" className="hover:bg-orange-50 focus:bg-orange-50">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500"></div>
                          <span>Urgence critique</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Package className="h-4 w-4 text-orange-500" />
                  Numéro de suivi
                  <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                </Label>
                <Input
                  placeholder="Ex: 1Z999AA1234567890"
                  value={newDeliveryForm.trackingNumber}
                  onChange={e => setNewDeliveryForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 text-orange-500" />
                    Informations du livreur
                  </h3>
                  <span className="text-xs text-gray-400">Optionnel</span>
                </div>
                
                <div className="space-y-4 rounded-xl border border-orange-100 bg-orange-50/30 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="driverName" className="text-xs font-medium text-gray-600">
                        Nom du livreur
                      </Label>
                      <Input
                        id="driverName"
                        placeholder="Jean Dupont"
                        value={newDeliveryForm.driverName}
                        onChange={e => setNewDeliveryForm(prev => ({ ...prev, driverName: e.target.value }))}
                        className="h-10 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="driverPhone" className="text-xs font-medium text-gray-600">
                        Téléphone
                      </Label>
                      <Input
                        id="driverPhone"
                        placeholder="+225 XX XX XX XX"
                        value={newDeliveryForm.driverPhone}
                        onChange={e => setNewDeliveryForm(prev => ({ ...prev, driverPhone: e.target.value }))}
                        className="h-10 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="driverVehicle" className="text-xs font-medium text-gray-600">
                      Détails du véhicule
                    </Label>
                    <Input
                      id="driverVehicle"
                      placeholder="Ex: Moto rouge, 123-AB-456"
                      value={newDeliveryForm.driverVehicle}
                      onChange={e => setNewDeliveryForm(prev => ({ ...prev, driverVehicle: e.target.value }))}
                      className="h-10 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3 mt-2">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Une notification sera envoyée au client avec les détails de la livraison une fois planifiée.
                </p>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors h-11 px-6"
                disabled={isCreating}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateDelivery}
                disabled={!newDeliveryForm.orderId || isCreating}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium transition-all h-11 px-6 shadow-md hover:shadow-lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Planifier la livraison
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
