"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Truck
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { DeliveryChatReplacement } from '@/components/chat/DeliveryChatReplacement'

const DeliveryTrackingMap = dynamic(() => import('@/components/deliveries/DeliveryTrackingMap'), { ssr: false })
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useVendorDeliveries } from '@/lib/hooks/use-vendor-deliveries'
import type { VendorDelivery } from '@/lib/services/vendor-delivery-service'

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready_for_pickup: 'Prête',
  in_transit: 'En transit',
  out_for_delivery: 'En cours de livraison',
  delayed: 'Retard',
  delivered: 'Livrée',
  failed: 'Échec',
  cancelled: 'Annulée'
}

const STATUS_BADGE_VARIANTS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready_for_pickup: 'bg-indigo-100 text-indigo-700',
  in_transit: 'bg-sky-100 text-sky-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delayed: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-700'
}

const PRIORITY_VARIANTS: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-emerald-100 text-emerald-700'
}

interface DeliveryDetailDialogProps {
  delivery: VendorDelivery | null
  open: boolean
  onOpenChange: (value: boolean) => void
  autoOpenChat?: boolean
}

/**
 * Boîte de dialogue décrivant le détail complet d'une livraison.
 */
function DeliveryDetailDialog({ delivery, open, onOpenChange, autoOpenChat }: DeliveryDetailDialogProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!autoOpenChat) return
    setIsChatOpen(true)
  }, [autoOpenChat, open])

  if (!delivery) {
    return null
  }

  const driverPoint = delivery.coordinates && Number.isFinite(delivery.coordinates.lat) && Number.isFinite(delivery.coordinates.lng)
    ? { lat: delivery.coordinates.lat, lng: delivery.coordinates.lng, label: 'Livreur' }
    : null

  const destination = (delivery as any)?.destinationCoordinates
  const destinationPoint = destination && Number.isFinite(destination.lat) && Number.isFinite(destination.lng)
    ? { lat: destination.lat, lng: destination.lng, label: 'Client' }
    : null

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          onOpenChange(value)
          if (!value) {
            setIsChatOpen(false)
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Livraison #{delivery.orderNumber ?? delivery.orderId}</span>
              <Badge className={STATUS_BADGE_VARIANTS[delivery.status] ?? 'bg-gray-100 text-gray-700'}>
                {STATUS_LABELS[delivery.status] ?? delivery.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Suivi détaillé de la livraison et informations logistiques associées.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Tracking</CardTitle>
                <CardDescription>Position du livreur et destination (coordonnées GPS).</CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryTrackingMap driverPoint={driverPoint} destinationPoint={destinationPoint} />
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Coordonnées destination</span>
                    <span className="font-medium text-foreground">
                      {destinationPoint ? `${destinationPoint.lat.toFixed(5)}, ${destinationPoint.lng.toFixed(5)}` : '—'}
                    </span>
                  </div>
                  {typeof delivery.deliveryAddress === 'string' && delivery.deliveryAddress.trim().length > 0 && (
                    <div className="flex items-start justify-between gap-4">
                      <span>Adresse</span>
                      <span className="text-right font-medium text-foreground">{delivery.deliveryAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Heure (ETA)</span>
                    <span className="font-medium text-foreground">{formatDate(delivery.eta) || '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Commande</p>
                  <p className="font-medium">#{delivery.orderNumber ?? delivery.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priorité</p>
                  <Badge className={PRIORITY_VARIANTS[delivery.priority] ?? 'bg-blue-100 text-blue-700'}>
                    {delivery.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{delivery.customerId ?? 'Client non renseigné'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Numéro de suivi</p>
                  <p className="font-medium">{delivery.trackingNumber ?? 'Non disponible'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ETA</p>
                  <p className="font-medium">{formatDate(delivery.eta) || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                  <p className="font-medium">{formatDate(delivery.updatedAt, { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
              </CardContent>
            </Card>

            {delivery.driver && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Livreur</CardTitle>
                  <CardDescription>Informations de contact pour coordonner la livraison.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{delivery.driver.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <a href={`tel:${delivery.driver.phone ?? ''}`} className="text-blue-600 hover:underline">
                      {delivery.driver.phone ?? 'Non renseigné'}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-orange-500" />
                    <span>{delivery.driver.vehiclePlate ?? 'Plaque inconnue'}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Historique de suivi</CardTitle>
                <CardDescription>Événements enregistrés pour cette livraison.</CardDescription>
              </CardHeader>
              <CardContent>
                {delivery.events.length > 0 ? (
                  <div className="space-y-4">
                    {delivery.events.map(event => (
                      <div key={event.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium">{event.type ?? 'Mise à jour'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(event.occurredAt, { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{event.description ?? 'Aucune description'}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {event.status && (
                            <span className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {STATUS_LABELS[event.status] ?? event.status}
                              </Badge>
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-6 text-sm text-muted-foreground">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Aucun évènement enregistré pour le moment.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Logistique</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold">Méthode d'expédition</p>
                  {delivery.shippingMethod ? (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{delivery.shippingMethod.name}</p>
                      <p>{delivery.shippingMethod.description ?? 'Pas de description.'}</p>
                      <p className="mt-2">
                        Délai estimé: {delivery.shippingMethod.estimatedMinMinutes ?? 'N/A'} à{' '}
                        {delivery.shippingMethod.estimatedMaxMinutes ?? 'N/A'} minutes
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Aucune méthode renseignée.</p>
                  )}
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold">Transporteur</p>
                  {delivery.carrier ? (
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{delivery.carrier.name}</p>
                      {delivery.carrier.contactPhone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-500" />
                          <a href={`tel:${delivery.carrier.contactPhone}`} className="text-blue-600 hover:underline">
                            {delivery.carrier.contactPhone}
                          </a>
                        </p>
                      )}
                      {delivery.carrier.contactEmail && <p className="text-xs">{delivery.carrier.contactEmail}</p>}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Transporteur non spécifié.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsChatOpen(true)}>
              Chat livraison
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeliveryChatReplacement deliveryInfo={delivery} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  )
}


interface DeliverySnapshotCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  tone: string
  helper?: string
}

/**
 * Carte affichant un indicateur clé de performance sur les livraisons.
 */
function DeliverySnapshotCard({ title, value, icon: Icon, tone, helper }: DeliverySnapshotCardProps) {
  return (
    <Card className={`rounded-xl border shadow-sm transition ${tone}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-orange-600">{title}</CardTitle>
        <Icon className="h-5 w-5 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {helper && <p className="mt-1 text-xs text-orange-600/80">{helper}</p>}
      </CardContent>
    </Card>
  )
}

/**
 * Formatte une date ISO en texte lisible.
 */
function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!value) {
    return ''
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', options ?? { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'ready_for_pickup', label: 'Prêtes' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'out_for_delivery', label: 'En cours' },
  { value: 'delayed', label: 'En retard' },
  { value: 'delivered', label: 'Livrées' }
]

/**
 * Interface complète de suivi des livraisons pour un vendeur.
 */
export default function VendorDeliveryManagement() {
  const { session, loading: authLoading } = useAuth()
  const deliveriesEnabled = !authLoading && !!session
  const { data, isLoading, error, mutate } = useVendorDeliveries({ enabled: deliveriesEnabled })
  const { toast } = useToast()
  const deliveries = data?.data ?? []

  const previousStatusByDeliveryIdRef = useRef<Map<string, string>>(new Map())
  const autoOpenedChatDeliveryIdsRef = useRef<Set<string>>(new Set())

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedDelivery, setSelectedDelivery] = useState<VendorDelivery | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [autoOpenChat, setAutoOpenChat] = useState(false)

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
    setIsDialogOpen(true)
    setAutoOpenChat(true)
  }, [deliveries])

  useEffect(() => {
    if (!isDialogOpen) {
      setAutoOpenChat(false)
    }
  }, [isDialogOpen])

  const filteredDeliveries = useMemo(() => {
    const normalisedTerm = searchTerm.trim().toLowerCase()

    return deliveries.filter(delivery => {
      const matchStatus = statusFilter === 'all' || delivery.status === statusFilter
      const matchSearch =
        normalisedTerm.length === 0 ||
        [delivery.orderNumber, delivery.orderId, delivery.trackingNumber]
          .filter(Boolean)
          .some(value => value?.toLowerCase().includes(normalisedTerm))

      return matchStatus && matchSearch
    })
  }, [deliveries, statusFilter, searchTerm])

  const stats = useMemo(() => {
    const total = deliveries.length
    const deliveredCount = deliveries.filter(delivery => delivery.status === 'delivered').length
    const inTransitCount = deliveries.filter(delivery => ['in_transit', 'out_for_delivery'].includes(delivery.status)).length
    const delayedCount = deliveries.filter(delivery => delivery.status === 'delayed').length
    const averageProgress = total > 0
      ? Math.round(deliveries.reduce((sum, delivery) => sum + (delivery.progressPercent ?? 0), 0) / total)
      : 0

    return {
      total,
      deliveredCount,
      inTransitCount,
      delayedCount,
      averageProgress
    }
  }, [deliveries])

  const handleRefresh = async () => {
    try {
      if (!deliveriesEnabled) {
        toast({
          title: 'Session en cours de rétablissement',
          description: 'Reconnectez-vous pour actualiser vos livraisons.',
          variant: 'destructive'
        })
        return
      }
      await mutate()
      toast({
        title: 'Livraisons actualisées',
        description: 'Les données de livraison ont été mises à jour avec succès.'
      })
    } catch (err) {
      toast({
        title: 'Erreur lors de l’actualisation',
        description: err instanceof Error ? err.message : 'Une erreur inattendue est survenue.',
        variant: 'destructive'
      })
    }
  }

  const openDetailDialog = (delivery: VendorDelivery) => {
    setSelectedDelivery(delivery)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suivi des livraisons</h2>
          <p className="text-sm text-muted-foreground">
            Analysez vos livraisons en cours, anticipez les retards et accédez à l’historique détaillé de chaque commande.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2 text-white shadow-md transition hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DeliverySnapshotCard
          title="Total suivis"
          value={stats.total}
          icon={Truck}
          tone="border-orange-200/70 bg-orange-50/60"
        />
        <DeliverySnapshotCard
          title="Livraisons livrées"
          value={stats.deliveredCount}
          icon={CheckCircle}
          tone="border-emerald-200/80 bg-emerald-50/70"
          helper="Livraisons finalisées"
        />
        <DeliverySnapshotCard
          title="En circulation"
          value={stats.inTransitCount}
          icon={Clock}
          tone="border-orange-200/60 bg-orange-50/40"
          helper="Livraisons en route"
        />
        <DeliverySnapshotCard
          title="Progression moyenne"
          value={`${stats.averageProgress}%`}
          icon={Calendar}
          tone="border-orange-200 bg-orange-50"
          helper="Pourcentage moyen de progression"
        />
      </div>

      <Card>
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>{filteredDeliveries.length} livraison(s) visible(s)</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{stats.total} au total</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Rechercher par commande ou suivi"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(filter => (
                  <Button
                    key={filter.value}
                    size="sm"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:ring-orange-500 ${
                      statusFilter === filter.value
                        ? 'border-transparent bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:from-orange-600 hover:to-orange-700'
                        : 'border-orange-200 bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 p-12 text-sm text-muted-foreground">
              Chargement des livraisons...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              {error.message}
            </div>
          )}

          {!isLoading && !error && filteredDeliveries.length === 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-200 p-12 text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Aucune livraison ne correspond à vos filtres actuels.
            </div>
          )}

          {!isLoading && !error && filteredDeliveries.length > 0 && (
            <div className="space-y-3">
              {filteredDeliveries.map(delivery => (
                <div
                  key={delivery.id}
                  className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:bg-orange-50/60 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge className={STATUS_BADGE_VARIANTS[delivery.status] ?? 'bg-gray-100 text-gray-700'}>
                          {STATUS_LABELS[delivery.status] ?? delivery.status}
                        </Badge>
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-xs font-semibold uppercase tracking-wide text-orange-700">
                          Priorité {delivery.priority}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(delivery.createdAt)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Commande #{delivery.orderNumber ?? delivery.orderId}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ETA: {formatDate(delivery.eta) || 'Non défini'} · Dernière mise à jour {formatDate(delivery.updatedAt, { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {typeof delivery.deliveryAddress === 'string' && delivery.deliveryAddress.trim().length > 0
                            ? `Adresse: ${delivery.deliveryAddress}`
                            : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground md:text-right">
                      <span className="font-semibold text-orange-600">Progression: {delivery.progressPercent}%</span>
                      <span className="flex items-center gap-1 text-xs md:justify-end">
                        <Truck className="h-3 w-3" />
                        Suivi {delivery.trackingNumber ?? 'non communiqué'}
                      </span>
                      {delivery.currentLocation && (
                        <span className="flex items-center gap-1 text-xs md:justify-end">
                          <MapPin className="h-3 w-3" />
                          {delivery.currentLocation}
                        </span>
                      )}
                      <Button
                        size="sm"
                        className="mt-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-white shadow-sm transition hover:from-orange-600 hover:to-orange-700 hover:shadow-md md:self-end"
                        onClick={() => openDetailDialog(delivery)}
                      >
                        Voir le détail
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeliveryDetailDialog
        delivery={selectedDelivery}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        autoOpenChat={autoOpenChat}
      />
    </div>
  )
}
