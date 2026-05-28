"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePathname } from "next/navigation"
import { 
  Truck, Package, MapPin, Clock, CheckCircle, Phone, MessageCircle, 
  AlertTriangle, X, User, Star, Info, BarChart3, RefreshCw, Shield,
  Navigation, Zap, TrendingUp, Eye, Bell, Settings, HelpCircle,
  Mail, Smartphone, Wifi, Signal, Route, Calendar, Timer,
  CheckSquare, AlertCircle, PhoneCall, MessageSquare, FileText,
  Volume2, Send, Headphones
} from "lucide-react"
import { useClientDeliveries, useClientDeliveryPreferences } from "@/lib/hooks/use-client-deliveries"
import { ClientDeliveryService, type ClientDelivery } from "@/lib/services/client-delivery-service"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
// Import supprimé - composant remplacé par le nouveau système de chat global

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; badgeClass: string; textClass: string }> = {
  pending: {
    label: 'En attente',
    dotClass: 'bg-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    textClass: 'text-gray-600'
  },
  confirmed: {
    label: 'Confirmée',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    textClass: 'text-blue-600'
  },
  preparing: {
    label: 'En préparation',
    dotClass: 'bg-orange-500',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    textClass: 'text-orange-600'
  },
  ready_for_pickup: {
    label: 'Prête à retirer',
    dotClass: 'bg-indigo-500',
    badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    textClass: 'text-indigo-600'
  },
  in_transit: {
    label: 'En transit',
    dotClass: 'bg-sky-500 animate-pulse',
    badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
    textClass: 'text-sky-600'
  },
  out_for_delivery: {
    label: 'En cours de livraison',
    dotClass: 'bg-green-500 animate-pulse',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    textClass: 'text-green-600'
  },
  delayed: {
    label: 'Retardée',
    dotClass: 'bg-red-500 animate-pulse',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    textClass: 'text-red-600'
  },
  delivered: {
    label: 'Livrée',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    textClass: 'text-emerald-600'
  },
  failed: {
    label: 'Échec',
    dotClass: 'bg-rose-500',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
    textClass: 'text-rose-600'
  },
  cancelled: {
    label: 'Annulée',
    dotClass: 'bg-gray-500',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    textClass: 'text-gray-600'
  }
} as const

const PRIORITY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  high: {
    label: 'Priorité haute',
    badgeClass: 'bg-red-100 text-red-700 border-red-200'
  },
  medium: {
    label: 'Priorité moyenne',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  low: {
    label: 'Priorité basse',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200'
  }
} as const

const getPriorityConfig = (priority: string) => PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium

const getDeliveryItems = (delivery: ClientDelivery | null): string[] => {
  const items = extractMetadataField<string[] | undefined>(delivery?.metadata, 'items', undefined)
  return Array.isArray(items) ? items : []
}

const getDeliveryMetadataValue = <T,>(delivery: ClientDelivery | null, key: string, fallback: T): T => {
  return extractMetadataField<T>(delivery?.metadata, key, fallback)
}

const normalizeProgress = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

/**
 * Retourne la configuration visuelle (libellé/couleurs) pour un statut donné.
 */
const getStatusConfig = (status: string) => STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

/**
 * Formate une date/heure ETA en texte lisible.
 */
const formatEta = (eta: string | null) => {
  if (!eta) {
    return '—'
  }

  const date = new Date(eta)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Récupère un champ typé depuis le metadata libre de la livraison.
 */
const extractMetadataField = <T,>(metadata: Record<string, unknown> | undefined, key: string, fallback: T): T => {
  if (!metadata) {
    return fallback
  }

  const value = metadata[key as keyof typeof metadata]
  return (value as T) ?? fallback
}

/**
 * Détermine si une livraison doit être considérée comme "en cours".
 */
const isDeliveryInProgress = (status: string | null | undefined): boolean => {
  if (!status) return true
  return !['delivered', 'cancelled', 'failed'].includes(status)
}

/**
 * Calcule les compteurs "livraisons en cours" et "commandes en cours" à partir d'une liste.
 */
const computeInProgressCounts = (list: ClientDelivery[]) => {
  const inProgress = (list ?? []).filter((delivery) => isDeliveryInProgress(delivery?.status))
  const deliveriesInProgressCount = inProgress.length
  const orderKeys = new Set<string>()
  for (const delivery of inProgress) {
    const key = String(delivery?.orderNumber ?? delivery?.id ?? '')
    if (key) orderKeys.add(key)
  }
  const ordersInProgressCount = orderKeys.size
  return { deliveriesInProgressCount, ordersInProgressCount }
}

export default function HeaderDelivery() {
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const pathname = usePathname()
  const isClientUser = (user as any)?.role === 'client'
  const isAuthRoute = typeof pathname === 'string' && pathname.startsWith('/auth')
  const isSellerRoute = typeof pathname === 'string' && pathname.startsWith('/seller-dashboard')
  const shouldFetchDeliveries = isClientUser && !isAuthRoute && !isSellerRoute
  
  // Fonction showWarning personnalisée
  const showWarning = (message: string) => {
    addNotification({
      type: 'warning',
      title: 'Attention',
      message: message
    })
  }
  
  const { data: deliveriesResponse, isLoading: deliveriesLoading, error: deliveriesError, mutate: mutateDeliveries } = useClientDeliveries({ enabled: shouldFetchDeliveries })
  const deliveries = useMemo<ClientDelivery[]>(() => deliveriesResponse?.data ?? [], [deliveriesResponse])
  const [cachedDeliveries, setCachedDeliveries] = useState<ClientDelivery[]>(() => {
    try {
      if (typeof window === 'undefined') return []
      const raw = window.localStorage?.getItem('probooster_client_deliveries_cache')
      const parsed = raw ? JSON.parse(raw) : null
      const list = parsed?.data
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  })
  const effectiveDeliveries = deliveries.length > 0 ? deliveries : cachedDeliveries
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null)
  const selectedDelivery = useMemo<ClientDelivery | null>(() => {
    if (selectedDeliveryId) {
      const found = effectiveDeliveries.find((delivery: ClientDelivery) => delivery.id === selectedDeliveryId)
      if (found) {
        return found
      }
    }

    return effectiveDeliveries.length > 0 ? effectiveDeliveries[0] : null
  }, [effectiveDeliveries, selectedDeliveryId])

  const { data: preferencesResponse, isLoading: preferencesLoading, mutate: mutatePreferences } = useClientDeliveryPreferences({ enabled: shouldFetchDeliveries })
  const [deliverySettings, setDeliverySettings] = useState({
    notifications: true,
    gpsTracking: true,
    autoRefresh: true,
    soundAlerts: true,
    vibrationAlerts: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    deliveryPreferences: {
      preferredTime: '9h-18h',
      contactBeforeDelivery: true,
      leaveAtDoor: false,
      requireSignature: true
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onRefresh = () => {
      void mutateDeliveries()
    }

    window.addEventListener('clientDeliveriesRefresh', onRefresh as any)
    return () => {
      window.removeEventListener('clientDeliveriesRefresh', onRefresh as any)
    }
  }, [mutateDeliveries])
  
  // États pour les modals
  const [showGPSTrackingModal, setShowGPSTrackingModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showLiveTrackingModal, setShowLiveTrackingModal] = useState(false)
  const [showDeliveryDetailsModal, setShowDeliveryDetailsModal] = useState(false)
  const [showContactDriverModal, setShowContactDriverModal] = useState(false)
  // État supprimé - remplacé par le nouveau système de chat global
  const [showAdminChat, setShowAdminChat] = useState(false)
  
  // État pour le suivi GPS en temps réel
  const [gpsTrackingData, setGpsTrackingData] = useState({
    estimatedArrival: '—',
    distance: '—',
    speed: '—',
    lastUpdate: '',
    currentLocation: '—',
    driverName: '—',
    driverPhone: '—',
    vehiclePlate: '—',
    routeProgress: 0
  })

  /**
   * Construit les données d'affichage "suivi live" depuis une livraison réelle.
   */
  const buildGpsTrackingDataFromDelivery = useCallback((delivery: ClientDelivery | null) => {
    const etaText = formatEta(delivery?.eta ?? null)
    const location = delivery?.currentLocation ?? 'Localisation indisponible'
    const progress = normalizeProgress(delivery?.progressPercent ?? null)
    const driverName = delivery?.driver?.name ?? 'Livreur à confirmer'
    const driverPhone = delivery?.driver?.phone ?? '—'
    const vehiclePlate = delivery?.driver?.vehiclePlate ?? 'Non renseigné'

    const distance = getDeliveryMetadataValue(delivery, 'distance', '—')
    const speed = getDeliveryMetadataValue(delivery, 'speed', '—')

    return {
      estimatedArrival: etaText,
      distance: typeof distance === 'string' ? distance : String(distance ?? '—'),
      speed: typeof speed === 'string' ? speed : String(speed ?? '—'),
      lastUpdate: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      currentLocation: location,
      driverName,
      driverPhone,
      vehiclePlate,
      routeProgress: progress
    }
  }, [])

  const isLoadingState = deliveriesLoading && effectiveDeliveries.length === 0
  const activeDeliveries = effectiveDeliveries
  const activeDeliveryCount = activeDeliveries.length
  const { deliveriesInProgressCount, ordersInProgressCount } = useMemo(() => {
    return computeInProgressCounts(activeDeliveries)
  }, [activeDeliveries])
  const fallbackDelivery = selectedDelivery
  const selectedDeliveryItems = getDeliveryItems(selectedDelivery)
  const selectedDriver = selectedDelivery?.driver ?? null
  const selectedDriverName = selectedDriver?.name ?? 'Livreur à confirmer'
  const selectedDriverPhone = selectedDriver?.phone ?? null
  const selectedVehiclePlate = selectedDriver?.vehiclePlate ?? 'Non renseigné'
  const selectedCurrentLocation = selectedDelivery?.currentLocation ?? 'Localisation indisponible'
  const selectedEtaText = formatEta(selectedDelivery?.eta ?? null)
  const selectedProgress = normalizeProgress(selectedDelivery?.progressPercent ?? null)
  const selectedOrderReference = selectedDelivery?.orderNumber ?? selectedDelivery?.id ?? '—'
  const selectedPriorityConfig = selectedDelivery ? getPriorityConfig(selectedDelivery.priority ?? 'medium') : null
  const selectedStatusConfig = selectedDelivery ? getStatusConfig(selectedDelivery.status) : null
  const selectedCustomerName = getDeliveryMetadataValue(selectedDelivery, 'customerName', 'Client Probooster')
  const selectedCustomerPhone = getDeliveryMetadataValue(selectedDelivery, 'customerPhone', '+225 0987654321')
  const selectedCustomerEmail = getDeliveryMetadataValue(selectedDelivery, 'customerEmail', 'client@probooster.com')

  useEffect(() => {
    if (!Array.isArray(deliveries) || deliveries.length === 0) {
      return
    }

    if (!selectedDeliveryId) {
      setSelectedDeliveryId(deliveries[0].id)
      return
    }

    const stillExists = deliveries.some((delivery) => delivery.id === selectedDeliveryId)
    if (!stillExists) {
      setSelectedDeliveryId(deliveries[0].id)
    }
  }, [deliveries, selectedDeliveryId])

  useEffect(() => {
    setGpsTrackingData(buildGpsTrackingDataFromDelivery(selectedDelivery))
  }, [selectedDelivery, buildGpsTrackingDataFromDelivery])

  useEffect(() => {
    if (!showLiveTrackingModal) return

    if (!selectedDeliveryId) {
      const first = deliveries?.[0]
      if (first?.id) {
        setSelectedDeliveryId(first.id)
      }
    }
  }, [showLiveTrackingModal, selectedDeliveryId, deliveries])

  useEffect(() => {
    if (!showLiveTrackingModal) return
    void mutateDeliveries()
    setGpsTrackingData(prev => ({
      ...prev,
      lastUpdate: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }))
  }, [showLiveTrackingModal, mutateDeliveries])

  useEffect(() => {
    if (!showDeliveryDetailsModal) return
    void mutateDeliveries()
  }, [showDeliveryDetailsModal, mutateDeliveries])

  useEffect(() => {
    if (!showContactDriverModal) return
    void mutateDeliveries()
  }, [showContactDriverModal, mutateDeliveries])

  useEffect(() => {
    if (!showLiveTrackingModal) return
    if (!deliverySettings.autoRefresh) return
    if (typeof window === 'undefined') return

    const intervalMs = 10_000
    const id = window.setInterval(() => {
      void mutateDeliveries()
      setGpsTrackingData(prev => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }))
    }, intervalMs)

    return () => {
      window.clearInterval(id)
    }
  }, [showLiveTrackingModal, deliverySettings.autoRefresh, mutateDeliveries])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (Array.isArray(deliveries)) {
        const counts = computeInProgressCounts(deliveries)
        window.localStorage?.setItem('probooster_client_deliveries_cache', JSON.stringify({
          data: deliveries,
          cachedAt: Date.now()
        }))
        setCachedDeliveries(deliveries)
        window.dispatchEvent(new CustomEvent('clientDeliveriesUpdated', {
          detail: {
            count: deliveries.length,
            deliveriesInProgressCount: counts.deliveriesInProgressCount,
            ordersInProgressCount: counts.ordersInProgressCount
          }
        }))
      }
    } catch {
      // ignore
    }
  }, [deliveries])

  useEffect(() => {
    if (preferencesResponse?.data) {
      const pref = preferencesResponse.data
      setDeliverySettings(prev => ({
        ...prev,
        emailNotifications: pref.notificationChannels.email,
        smsNotifications: pref.notificationChannels.sms,
        pushNotifications: pref.notificationChannels.push,
        soundAlerts: pref.notificationChannels.soundAlerts,
        vibrationAlerts: pref.notificationChannels.vibrationAlerts,
        gpsTracking: pref.notificationChannels.gpsTracking,
        deliveryPreferences: {
          preferredTime: pref.preferredTimeWindow ?? '9h-18h',
          contactBeforeDelivery: pref.contactBeforeDelivery,
          leaveAtDoor: pref.leaveAtDoor,
          requireSignature: pref.requireSignature
        }
      }))
    }
  }, [preferencesResponse])

  useEffect(() => {
    if (deliveriesError) {
      showWarning("Impossible de récupérer vos livraisons pour le moment.")
    }
  }, [deliveriesError])

  const handleSettingsChange = (key: string, value: any) => {
    setDeliverySettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleDeliveryPreferenceChange = (key: string, value: any) => {
    setDeliverySettings(prev => ({
      ...prev,
      deliveryPreferences: {
        preferredTime: prev.deliveryPreferences?.preferredTime || '9h-18h',
        contactBeforeDelivery: prev.deliveryPreferences?.contactBeforeDelivery ?? true,
        leaveAtDoor: prev.deliveryPreferences?.leaveAtDoor ?? false,
        requireSignature: prev.deliveryPreferences?.requireSignature ?? true,
        [key]: value
      }
    }))
  }

  /**
   * Sauvegarde les préférences de livraison du client via l'API dédiée.
   */
  const saveSettings = useCallback(async () => {
    try {
      const payload = {
        preferredTimeWindow: deliverySettings.deliveryPreferences.preferredTime,
        contactBeforeDelivery: deliverySettings.deliveryPreferences.contactBeforeDelivery,
        leaveAtDoor: deliverySettings.deliveryPreferences.leaveAtDoor,
        requireSignature: deliverySettings.deliveryPreferences.requireSignature,
        notificationChannels: {
          email: deliverySettings.emailNotifications,
          sms: deliverySettings.smsNotifications,
          push: deliverySettings.pushNotifications,
          soundAlerts: deliverySettings.soundAlerts,
          vibrationAlerts: deliverySettings.vibrationAlerts,
          gpsTracking: deliverySettings.gpsTracking
        }
      }

      await ClientDeliveryService.updatePreferences(payload)
      await mutatePreferences()

      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Paramètres de livraison mis à jour avec succès.'
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de mettre à jour vos préférences pour le moment.'
      })
    }
  }, [deliverySettings, mutatePreferences, addNotification])

  /**
   * Déclenche un rafraîchissement complet des livraisons pour récupérer les dernières données.
   */
  const refreshDeliveryData = useCallback(async () => {
    try {
      await mutateDeliveries()
      addNotification({
        type: 'success',
        title: 'Actualisé',
        message: 'Les livraisons ont été rafraîchies.'
      })
    } catch (error) {
      console.error("Erreur lors de l'actualisation des livraisons:", error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible d'actualiser les livraisons pour le moment."
      })
    }
  }, [mutateDeliveries, addNotification])

  /**
   * Prépare l'ouverture du modal de contact avec le livreur pour une livraison donnée.
   */
  const contactDeliveryPerson = useCallback((delivery: ClientDelivery) => {
    try {
      setSelectedDeliveryId(delivery.id)
      setShowContactDriverModal(true)
    } catch (error) {
      console.error("Erreur lors de l'ouverture du modal de contact:", error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible d'afficher les informations du livreur."
      })
    }
  }, [addNotification])

  /**
   * Affiche le modal de détails pour la livraison sélectionnée.
   */
  const showDeliveryDetails = useCallback((delivery: ClientDelivery) => {
    try {
      setSelectedDeliveryId(delivery.id)
      setShowDeliveryDetailsModal(true)
    } catch (error) {
      console.error("Erreur lors de l'ouverture des détails:", error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible d'afficher les détails de la livraison."
      })
    }
  }, [addNotification])

  /**
   * Lance un appel téléphonique vers le livreur si un numéro est disponible.
   */
  const initiateCall = useCallback((phoneNumber: string | null | undefined, driverName?: string | null) => {
    try {
      if (!phoneNumber) {
        showWarning('Aucun numéro de téléphone disponible pour ce livreur.')
        return
      }

      const telUrl = `tel:${phoneNumber}`
      window.location.href = telUrl
      addNotification({
        type: 'success',
        title: 'Appel',
        message: `Appel en cours vers ${driverName ?? 'le livreur'}...`
      })
      setShowContactDriverModal(false)
    } catch (error) {
      console.error("Erreur lors de l'appel:", error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible d'initier l'appel pour le moment."
      })
    }
  }, [addNotification, showWarning])

  /**
   * Ouvre le canal de discussion global pour la livraison courante.
   */
  const openDeliveryChat = useCallback((delivery: ClientDelivery) => {
    try {
      setSelectedDeliveryId(delivery.id)
      setShowContactDriverModal(false)
      setShowAdminChat(true)
    } catch (error) {
      console.error("Erreur lors de l'ouverture du chat:", error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible d'ouvrir la conversation pour cette livraison."
      })
    }
  }, [addNotification])

  const initiateAdminCall = () => {
    try {
      // Utiliser tel: pour déclencher l'appel direct vers l'administrateur
      const adminPhone = '+225 0123456789' // Numéro de l'administrateur
      const telUrl = `tel:${adminPhone}`
      window.location.href = telUrl
              addNotification({
          type: 'success',
          title: 'Appel',
          message: 'Appel en cours vers l\'administrateur...'
        })
      setShowContactDriverModal(false)
    } catch (error) {
      console.error('Erreur lors de l\'appel vers l\'administrateur:', error)
              addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Erreur lors de l\'appel vers l\'administrateur'
        })
    }
  }

  const openAdminChat = () => {
    try {
      setShowAdminChat(true)
      setShowContactDriverModal(false)
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du chat admin:', error)
              addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Erreur lors de l\'ouverture du chat admin'
        })
    }
  }

  const initiateSupportCall = () => {
    try {
      // Utiliser tel: pour déclencher l'appel direct vers l'administrateur de support
      const supportPhone = '+225 0123456789' // Numéro de l'administrateur de support
      const telUrl = `tel:${supportPhone}`
      window.location.href = telUrl
              addNotification({
          type: 'success',
          title: 'Appel',
          message: 'Appel en cours vers l\'administrateur de support...'
        })
      setShowContactModal(false)
    } catch (error) {
      console.error('Erreur lors de l\'appel vers l\'administrateur de support:', error)
              addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Erreur lors de l\'appel vers l\'administrateur de support'
        })
    }
  }

  const openSupportChat = () => {
    try {
      setShowAdminChat(true)
      setShowContactModal(false)
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du chat de support:', error)
              addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Erreur lors de l\'ouverture du chat de support'
        })
    }
  }

  const prepareDeliveryInfoForChat = useCallback((delivery: ClientDelivery) => {
    return {
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      estimatedDelivery: formatEta(delivery.eta),
      currentLocation: delivery.currentLocation,
      driver: delivery.driver,
      shippingMethod: delivery.shippingMethod,
      carrier: delivery.carrier,
      priority: delivery.priority,
      orderNumber: delivery.orderNumber,
      metadata: delivery.metadata
    }
  }, [])

  /**
   * Signale un problème de livraison en utilisant les informations sélectionnées.
   */
  const reportIssue = async (issue: string) => {
    try {
      // Données du signalement
      const reportData = {
        issue: issue,
        timestamp: new Date().toISOString(),
        deliveryId: selectedDelivery?.id || 'N/A',
        customerName: selectedCustomerName,
        customerPhone: selectedCustomerPhone,
        customerEmail: selectedCustomerEmail,
        priority: 'high',
        status: 'nouveau'
      }

      // 1. Envoyer par email à l'administrateur et super admin
      await sendEmailReport(reportData)
      
      // 2. Envoyer par WhatsApp
      await sendWhatsAppReport(reportData)
      
      // 3. Enregistrer dans le tableau de bord
      await saveToDashboard(reportData)
      
      // 4. Envoyer une copie au client
      await sendCustomerCopy(reportData)
      
      // Notification de succès
              addNotification({
          type: 'success',
          title: 'Problème signalé',
          message: `🚨 Problème "${issue}" signalé avec succès !`
        })
        addNotification({ 
  type: 'info', 
  title: 'Information', 
  message: 'Notre équipe va vous contacter dans les plus brefs délais.' 
})
      
      // Fermer le modal
      setShowReportModal(false)
      
    } catch (error) {
      console.error('Erreur lors du signalement:', error)
              addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Erreur lors du signalement. Veuillez réessayer.' 
})
    }
  }

  const sendEmailReport = async (reportData: any) => {
    try {
      // Simulation d'envoi d'email
      const adminEmails = [
        'admin@probooster.com',
        'superadmin@probooster.com',
        'support@probooster.com'
      ]
      
      const emailContent = `
        🚨 NOUVEAU SIGNALEMENT DE PROBLÈME
        
        Type: ${reportData.issue}
        Commande: ${reportData.deliveryId}
        Client: ${reportData.customerName}
        Téléphone: ${reportData.customerPhone}
        Email: ${reportData.customerEmail}
        Date: ${new Date(reportData.timestamp).toLocaleString('fr-FR')}
        Priorité: ${reportData.priority}
        
        Action requise immédiatement !
      `
      
      console.log('📧 Email envoyé aux administrateurs:', adminEmails)
      console.log('Contenu:', emailContent)
      
      // Ici, vous intégreriez votre service d'email réel
      // await EmailService.send(adminEmails, 'Nouveau signalement', emailContent)
      
    } catch (error) {
      console.error('Erreur envoi email:', error)
      throw error
    }
  }

  const sendWhatsAppReport = async (reportData: any) => {
    try {
      // Numéros WhatsApp des administrateurs
      const adminNumbers = [
        '+225 0123456789', // Admin
        '+225 0987654321', // Super Admin
        '+225 0555666777'  // Support
      ]
      
      const whatsappMessage = `🚨 NOUVEAU SIGNALEMENT: ${reportData.issue}
      
Commande: ${reportData.deliveryId}
Client: ${reportData.customerName}
Téléphone: ${reportData.customerPhone}
Date: ${new Date(reportData.timestamp).toLocaleString('fr-FR')}

Action requise immédiatement !`
      
      // Ouvrir WhatsApp avec le message pré-rempli
      adminNumbers.forEach(number => {
        const whatsappUrl = `https://wa.me/${number.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`
        window.open(whatsappUrl, '_blank')
      })
      
      console.log('📱 Notifications WhatsApp envoyées aux administrateurs')
      
    } catch (error) {
      console.error('Erreur envoi WhatsApp:', error)
      throw error
    }
  }

  const saveToDashboard = async (reportData: any) => {
    try {
      // Simulation de sauvegarde dans le tableau de bord
      const dashboardData = {
        id: `REP-${Date.now()}`,
        ...reportData,
        assignedTo: 'À assigner',
        estimatedResolution: '2-4 heures',
        notes: '',
        attachments: []
      }
      
      // Ici, vous intégreriez votre API de tableau de bord
      // await DashboardService.createReport(dashboardData)
      
      console.log('📊 Signalement enregistré dans le tableau de bord:', dashboardData)
      
      // Sauvegarder localement pour démonstration
      const existingReports = JSON.parse(localStorage.getItem('deliveryReports') || '[]')
      existingReports.push(dashboardData)
      localStorage.setItem('deliveryReports', JSON.stringify(existingReports))
      
    } catch (error) {
      console.error('Erreur sauvegarde tableau de bord:', error)
      throw error
    }
  }

  const sendCustomerCopy = async (reportData: any) => {
    try {
      // Envoyer une copie de confirmation au client
      const customerEmail = reportData.customerEmail
      const customerMessage = `
        📋 CONFIRMATION DE VOTRE SIGNALEMENT
        
        Bonjour ${reportData.customerName},
        
        Nous avons bien reçu votre signalement concernant: ${reportData.issue}
        
        Détails:
        - Commande: ${reportData.deliveryId}
        - Date: ${new Date(reportData.timestamp).toLocaleString('fr-FR')}
        - Référence: REP-${Date.now()}
        
        Notre équipe va traiter votre demande dans les plus brefs délais.
        Vous recevrez une mise à jour par email ou téléphone.
        
        Merci de votre patience.
        L'équipe Probooster
      `
      
      // Ici, vous intégreriez votre service d'email client
      // await EmailService.send([customerEmail], 'Confirmation de signalement', customerMessage)
      
      console.log('📧 Copie envoyée au client:', customerEmail)
      
      // Notification locale pour le client
              addNotification({ 
  type: 'info', 
  title: 'Confirmation', 
  message: 'Une copie de confirmation vous a été envoyée par email.' 
})
      
    } catch (error) {
      console.error('Erreur envoi copie client:', error)
      // Ne pas faire échouer le signalement principal
    }
  }

  return (
    <>
      <div className="p-6 max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 to-yellow-50">
        {/* En-tête moderne */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg mx-auto">
              <Truck className="h-8 w-8 text-white animate-pulse" />
            </div>
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full animate-ping"></div>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">
            Suivi de Livraison
          </h1>
          <p className="text-gray-600 text-lg">
            Suivez vos commandes en temps réel et gérez vos préférences de livraison
          </p>
        </div>

        {/* Actions rapides avec design moderne */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            variant="outline"
            onClick={refreshDeliveryData}
            className="h-16 bg-white/80 backdrop-blur-sm border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transform hover:scale-105 active:scale-95 transition-all duration-300 group shadow-lg"
          >
            <RefreshCw className="h-5 w-5 mr-3 group-hover:animate-spin transition-all duration-300" />
            <span className="font-semibold">Actualiser</span>
          </Button>
          
          <Button
            onClick={() => {
              if (!selectedDeliveryId) {
                const first = deliveries?.[0]
                if (first?.id) {
                  setSelectedDeliveryId(first.id)
                }
              }
              setShowLiveTrackingModal(true)
            }}
            className="h-16 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300 group shadow-lg border-0"
          >
            <Navigation className="h-5 w-5 mr-3 group-hover:animate-pulse transition-all duration-300" />
            <span className="font-semibold">Suivi Live</span>
          </Button>
          
          <Button
            onClick={saveSettings}
            className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300 group shadow-lg border-0"
          >
            <Settings className="h-5 w-5 mr-3 group-hover:animate-spin transition-all duration-300" />
            <span className="font-semibold">Sauvegarder</span>
          </Button>
        </div>

        {/* Livraisons actives */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <Package className="h-6 w-6 text-orange-600" />
              <span>Livraisons en cours</span>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {deliveriesInProgressCount} active{deliveriesInProgressCount > 1 ? 's' : ''}
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {ordersInProgressCount} commande{ordersInProgressCount > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingState ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ) : activeDeliveryCount === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune livraison en cours</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeliveries.map((delivery: ClientDelivery) => {
                  const deliveryStatus = getStatusConfig(delivery.status)
                  const deliveryPriority = getPriorityConfig(delivery.priority ?? 'medium')
                  const deliveryEtaText = formatEta(delivery.eta)
                  const deliveryProgress = normalizeProgress(delivery.progressPercent ?? null)
                  const deliveryDriverName = delivery.driver?.name ?? 'Livreur en cours d’attribution'
                  const deliveryVehicle = delivery.driver?.vehiclePlate ?? 'Non renseigné'
                  const deliveryLocation = delivery.currentLocation ?? 'Localisation indisponible'

                  return (
                    <Card key={delivery.id} className="p-6 border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 hover:from-orange-50 hover:to-yellow-50 transform hover:scale-105 transition-all duration-300 group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${deliveryStatus.dotClass}`}></div>
                            <h4 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                              Commande #{delivery.orderNumber ?? delivery.id}
                            </h4>
                            <Badge className={deliveryPriority.badgeClass}>
                              {deliveryPriority.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium text-gray-700">Statut:</span>
                                <span className={`text-sm font-semibold ${deliveryStatus.textClass}`}>
                                  {deliveryStatus.label}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Localisation:</span>
                                <span className="text-sm text-gray-600">{deliveryLocation}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <span className="text-sm font-medium text-gray-700">Temps estimé:</span>
                                <span className="text-sm font-semibold text-purple-600">{deliveryEtaText}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-gray-700">Livreur:</span>
                                <span className="text-sm text-gray-600">{deliveryDriverName}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Truck className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-medium text-gray-700">Véhicule:</span>
                                <span className="text-sm text-gray-600">{deliveryVehicle}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-pink-500" />
                                <span className="text-sm font-medium text-gray-700">ETA:</span>
                                <span className="text-sm font-semibold text-pink-600">{deliveryEtaText}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Progression</span>
                              <span className="font-semibold text-orange-600">{deliveryProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${deliveryProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showDeliveryDetails(delivery)}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50 transform hover:scale-105 active:scale-95 transition-all duration-300"
                          >
                            <Info className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                            Détails
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => contactDeliveryPerson(delivery)}
                            className="text-green-600 border-green-300 hover:bg-green-50 transform hover:scale-105 active:scale-95 transition-all duration-300"
                          >
                            <Phone className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                            Contacter
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Dialog open={showGPSTrackingModal} onOpenChange={setShowGPSTrackingModal}>
        <DialogTrigger asChild>
          <Button onClick={() => setShowGPSTrackingModal(true)} className="fixed bottom-4 right-4 z-50">
            <Shield className="h-6 w-6 text-green-500" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suivi GPS</DialogTitle>
            <DialogDescription>
              Configurez les paramètres de suivi GPS pour votre livraison.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Notifications GPS:</span>
              <Switch
                checked={deliverySettings.gpsTracking}
                onCheckedChange={(checked) => handleSettingsChange('gpsTracking', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Alerts sonores:</span>
              <Switch
                checked={deliverySettings.soundAlerts}
                onCheckedChange={(checked) => handleSettingsChange('soundAlerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Alerts vibratoires:</span>
              <Switch
                checked={deliverySettings.vibrationAlerts}
                onCheckedChange={(checked) => handleSettingsChange('vibrationAlerts', checked)}
              />
            </div>
            <Button onClick={saveSettings} className="w-full">Sauvegarder</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogTrigger asChild>
          <Button onClick={() => setShowContactModal(true)} className="fixed bottom-4 right-4 z-50">
            <MessageCircle className="h-6 w-6 text-blue-500" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Support</DialogTitle>
            <DialogDescription>
              Contactez notre équipe de support pour toute question ou problème.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Button onClick={initiateSupportCall} className="w-full">
              <PhoneCall className="h-4 w-4 mr-2" />
              Appeler le support
            </Button>
            <Button onClick={openSupportChat} className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat avec le support
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogTrigger asChild>
          <Button onClick={() => setShowReportModal(true)} className="fixed bottom-4 right-4 z-50">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler un problème</DialogTitle>
            <DialogDescription>
              Si vous rencontrez un problème avec une livraison, veuillez le signaler.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <textarea
              placeholder="Décrivez le problème..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              rows={4}
            />
            <Button onClick={() => reportIssue('Problème de livraison')} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Signaler le problème
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Suivi Live en Temps Réel */}
      {showLiveTrackingModal && (
        <Dialog open={showLiveTrackingModal} onOpenChange={setShowLiveTrackingModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-900">
                <Navigation className="h-8 w-8 text-orange-600 animate-pulse" />
                <span>Suivi Live en Temps Réel</span>
                <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">
                  En direct
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Suivez votre livraison en temps réel avec GPS et informations détaillées
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[60vh]">
              <div className="space-y-6">
                {/* Carte de suivi GPS */}
                <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-900">
                      <MapPin className="h-6 w-6 text-blue-600" />
                      <span>Position actuelle</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Arrivée estimée</span>
                          <span className="text-lg font-bold text-green-600">{gpsTrackingData.estimatedArrival}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Distance restante</span>
                          <span className="text-lg font-bold text-blue-600">{gpsTrackingData.distance}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Vitesse actuelle</span>
                          <span className="text-lg font-bold text-purple-600">{gpsTrackingData.speed}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Dernière mise à jour</span>
                          <span className="text-sm font-semibold text-gray-600">{gpsTrackingData.lastUpdate}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Localisation</span>
                          <span className="text-sm font-semibold text-gray-600">{gpsTrackingData.currentLocation}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-gray-700">Progression route</span>
                          <span className="text-lg font-bold text-orange-600">{gpsTrackingData.routeProgress}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Barre de progression de la route */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progression de la route</span>
                        <span className="font-semibold text-orange-600">{gpsTrackingData.routeProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${gpsTrackingData.routeProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Informations du livreur */}
                <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-900">
                      <User className="h-6 w-6 text-green-600" />
                      <span>Informations du livreur</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
                          <User className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Nom</p>
                            <p className="font-semibold text-gray-900">{gpsTrackingData.driverName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
                          <Phone className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Téléphone</p>
                            <p className="font-semibold text-gray-900">{gpsTrackingData.driverPhone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
                          <Truck className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Véhicule</p>
                            <p className="font-semibold text-gray-900">{gpsTrackingData.vehiclePlate}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Note</p>
                            <p className="font-semibold text-gray-900">4.8/5</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLiveTrackingModal(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    setShowLiveTrackingModal(false)
                    if (selectedDelivery) {
                      contactDeliveryPerson(selectedDelivery)
                    } else {
                      showWarning("Aucune livraison disponible à contacter pour le moment.")
                    }
                  }}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contacter le livreur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Détails de la Livraison */}
      {showDeliveryDetailsModal && (
        <Dialog open={showDeliveryDetailsModal} onOpenChange={setShowDeliveryDetailsModal}>
          <DialogContent className="max-w-2xl">
            {selectedDelivery ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3 text-xl font-bold text-gray-900">
                    <Package className="h-6 w-6 text-orange-600" />
                    <span>Détails de la Livraison #{selectedDelivery.id}</span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <Card className="p-4 border-0 shadow-sm bg-gradient-to-r from-orange-50 to-yellow-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium text-gray-700">Statut:</span>
                          <Badge className={selectedStatusConfig?.badgeClass ?? 'bg-gray-100 text-gray-700 border-gray-200'}>
                            {selectedStatusConfig?.label ?? selectedDelivery.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">Localisation:</span>
                          <span className="text-sm text-gray-600">{selectedCurrentLocation}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-700">Temps estimé:</span>
                          <span className="text-sm font-semibold text-purple-600">{selectedEtaText}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-700">Livreur:</span>
                          <span className="text-sm text-gray-600">{selectedDriverName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm font-medium text-gray-700">Véhicule:</span>
                          <span className="text-sm text-gray-600">{selectedVehiclePlate}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-pink-500" />
                          <span className="text-sm font-medium text-gray-700">ETA:</span>
                          <span className="text-sm font-semibold text-pink-600">{selectedEtaText}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 border-0 shadow-sm">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-3">Produits commandés</CardTitle>
                    <div className="space-y-2">
                      {selectedDeliveryItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-orange-600" />
                          </div>
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  
                  <Card className="p-4 border-0 shadow-sm">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-3">Progression de la livraison</CardTitle>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progression</span>
                        <span className="font-semibold text-orange-600">{selectedProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${selectedProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeliveryDetailsModal(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeliveryDetailsModal(false)
                      if (selectedDelivery) {
                        contactDeliveryPerson(selectedDelivery)
                      }
                    }}
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Contacter le livreur
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-gray-600">
                Chargement des détails de livraison…
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Contacter le Livreur */}
      {showContactDriverModal && (
        <Dialog open={showContactDriverModal} onOpenChange={setShowContactDriverModal}>
          <DialogContent className="max-w-lg">
            {selectedDelivery ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3 text-xl font-bold text-gray-900">
                    <Phone className="h-6 w-6 text-green-600" />
                    <span>Contacter le livreur</span>
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Choisissez comment contacter {selectedDriverName} pour votre livraison #{selectedDelivery.id}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <Card className="p-4 border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{selectedDriverName ?? 'Livreur inconnu'}</h4>
                        <p className="text-sm text-gray-600">Livreur • {selectedVehiclePlate ?? 'Véhicule inconnu'}</p>
                        <p className="text-sm text-gray-600">Commande #{selectedDelivery?.id ?? 'inconnue'}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={() => initiateCall(selectedDriverPhone, selectedDriverName)}
                      className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                    >
                      <Phone className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                      <span className="font-semibold">Appeler le livreur</span>
                    </Button>
                    
                    <Button
                      onClick={() => openDeliveryChat(selectedDelivery)}
                      className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                    >
                      <MessageCircle className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                      <span className="font-semibold">Envoyer un message</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 text-center">Besoin d'aide ?</h4>
                    
                    <Button
                      onClick={() => {
                        setShowContactDriverModal(false)
                        setShowContactModal(true)
                      }}
                      variant="outline"
                      className="w-full h-12 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                    >
                      <HelpCircle className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                      <span className="font-medium">Contacter le support</span>
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setShowContactDriverModal(false)
                        setShowReportModal(true)
                      }}
                      variant="outline"
                      className="w-full h-12 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                    >
                      <AlertTriangle className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                      <span className="font-medium">Signaler un problème</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-gray-600">
                Chargement des informations du livreur…
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Contacter le Support */}
      {showContactModal && (
        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3 text-xl font-bold text-gray-900">
                <HelpCircle className="h-6 w-6 text-orange-600" />
                <span>Contacter le Support</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Notre équipe de support est là pour vous aider
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informations de support */}
              <Card className="p-4 border-0 shadow-sm bg-gradient-to-r from-orange-50 to-yellow-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Headphones className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Support Probooster</h4>
                  <p className="text-sm text-gray-600">Disponible 24h/24 et 7j/7</p>
                  <p className="text-sm text-gray-600">Temps de réponse : &lt; 5 minutes</p>
                </div>
              </Card>
              
              {/* Options de contact */}
              <div className="space-y-3">
                <Button
                  onClick={initiateSupportCall}
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                >
                  <Phone className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                  <span className="font-semibold">Appeler le support</span>
                </Button>
                
                <Button
                  onClick={openSupportChat}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                >
                  <MessageCircle className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                  <span className="font-semibold">Chat avec le support</span>
                </Button>
              </div>
              
              {/* Informations supplémentaires */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium">Informations importantes :</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Numéro gratuit depuis la France</li>
                      <li>• Support multilingue disponible</li>
                      <li>• Historique des conversations sauvegardé</li>
                      <li>• Suivi des tickets de support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Signaler un Problème */}
      {showReportModal && (
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-red-700">
                    Signaler un problème
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Décrivez le problème rencontré avec votre livraison
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informations de la livraison */}
              {selectedDelivery && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Livraison concernée</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p><strong>Commande:</strong> #{selectedOrderReference}</p>
                    <p><strong>Livreur:</strong> {selectedDriverName}</p>
                    <p><strong>Statut:</strong> {selectedStatusConfig?.label ?? selectedDelivery.status}</p>
                  </div>
                </div>
              )}
              
              {/* Options de signalement */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-center">Sélectionnez le type de problème :</h4>
                
                <Button
                  onClick={() => reportIssue('Livraison en retard')}
                  variant="outline"
                  className="w-full h-14 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 group-hover:animate-pulse" />
                    <div className="text-left">
                      <div className="font-medium">Livraison en retard</div>
                      <div className="text-xs text-red-500">Délai dépassé</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => reportIssue('Produit endommagé')}
                  variant="outline"
                  className="w-full h-14 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 group-hover:animate-pulse" />
                    <div className="text-left">
                      <div className="font-medium">Produit endommagé</div>
                      <div className="text-xs text-red-500">Colis abîmé</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => reportIssue('Livreur non trouvé')}
                  variant="outline"
                  className="w-full h-14 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transform hover:scale-105 active:scale-95 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 group-hover:animate-pulse" />
                    <div className="text-left">
                      <div className="font-medium">Livreur non trouvé</div>
                      <div className="text-xs text-red-500">Absence au point de livraison</div>
                    </div>
                  </div>
                </Button>
              </div>
              
              {/* Informations sur le processus */}
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-xs text-orange-800">
                    <p className="font-medium">Processus de signalement :</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Notification immédiate aux administrateurs</li>
                      <li>• Enregistrement dans le tableau de bord</li>
                      <li>• Copie de confirmation envoyée au client</li>
                      <li>• Suivi et résolution dans les 2-4 heures</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Chat de Livraison - Remplacé par le nouveau système de chat global */}
      {/* Le chat de livraison est maintenant géré par le système de chat global */}

      {/* Modal Chat Administrateur */}
      {showAdminChat && (
        <Dialog open={showAdminChat} onOpenChange={setShowAdminChat}>
          <DialogContent className="max-w-6xl h-[95vh] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>Chat avec l'Administrateur</DialogTitle>
              <DialogDescription>
                Support technique et assistance client
              </DialogDescription>
            </DialogHeader>
            
            {/* Header du modal */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-6 w-6 text-orange-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Chat avec l'Administrateur
                    </h2>
                    <p className="text-sm text-gray-600">
                      Support technique et assistance client
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAdminChat(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Contenu du chat avec hauteur calculée */}
            <div className="flex-1 min-h-0">
              {/* Composant DeliveryChat remplacé par le nouveau système de chat global */}
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center p-6">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chat avec l'Administrateur
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Le chat est maintenant géré par le système de chat global
                  </p>
                  <Button 
                    onClick={() => setShowAdminChat(false)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Fermer
                  </Button>
                </div>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Composant Notifications */}
              <NotificationContainer />
    </>
  )
}
