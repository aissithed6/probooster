"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  BarChart3,
  CheckCircle2,
  MessageCircle,
  Settings,
  Truck,
  XCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useNotifications } from '@/components/ui/modern-notification'
import { DeliveryChatReplacement } from '@/components/chat/DeliveryChatReplacement'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar } from '@/components/ui/calendar'
import { supabase } from '@/lib/supabase'
import { useDateTime } from '@/lib/hooks/use-date-time'
import { normalizeCoordinates } from '@/lib/services/super-admin-delivery-service'

const DeliveryTrackingMap = dynamic(() => import('@/components/deliveries/DeliveryTrackingMap'), { ssr: false })

type DriverTab = 'deliveries' | 'chat' | 'reports' | 'settings'

type DriverDeliveryRecord = {
  id: string
  orderId: string
  orderNumber: string
  status: string
  priority: string | null
  eta: string | null
  currentLocation: string | null
  trackingNumber: string | null
  progressPercent: number
  shippingAddress: any | null
  deliveryAddress?: string | null
    coordinates?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null
  destinationCoordinates?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null
  driver: {
    userId: string | null
    name: string | null
    phone: string | null
    vehiclePlate: string | null
  }
  createdAt?: string | null
  updatedAt?: string | null
  created_at?: string | null
  updated_at?: string | null
  events?: Array<{
    id: string
    type: string | null
    status: string | null
    description: string | null
    occurredAt?: string | null
    data?: Record<string, unknown> | null
  }>
};

/**
 * Détermine la décision du livreur (accepté/refusé) à partir des events + du statut.
 */
function computeDriverDecision(delivery: DriverDeliveryRecord | null): { accepted: boolean; rejected: boolean } {
  if (!delivery) return { accepted: false, rejected: false }
  const events = Array.isArray(delivery.events) ? delivery.events : []
  const types = new Set(events.map((e) => String((e as any)?.type ?? '').toLowerCase()))
  const status = String(delivery.status ?? '').toLowerCase()

  const accepted =
    types.has('driver_accept') ||
    types.has('driver_accepted') ||
    status === 'confirmed' ||
    status === 'preparing' ||
    status === 'ready_for_pickup' ||
    status === 'in_transit' ||
    status === 'out_for_delivery' ||
    status === 'delayed' ||
    status === 'arrived' ||
    status === 'delivered' ||
    status === 'completed'

  const rejected = types.has('driver_reject') || types.has('driver_rejected')

  return { accepted, rejected }
}

/**
 * Extrait les motifs de refus depuis les events (driver_reject/driver_rejected).
 */
function extractRejectReasons(delivery: DriverDeliveryRecord): string[] {
  const events = Array.isArray(delivery.events) ? delivery.events : []
  return events
    .filter((e) => {
      const t = String((e as any)?.type ?? '').toLowerCase()
      return t === 'driver_reject' || t === 'driver_rejected'
    })
    .map((e) => {
      const data = (e as any)?.data
      const reason = typeof data?.reason === 'string' ? data.reason.trim() : ''
      return reason
    })
    .filter(Boolean)
}

function matchesAvailabilitySlotsNow(value: unknown): boolean {
  if (!value) return false
  if (!Array.isArray(value)) return false
  const now = Date.now()
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const startRaw = (entry as any).start
    const endRaw = (entry as any).end
    if (typeof startRaw !== 'string' || typeof endRaw !== 'string') continue
    const start = new Date(startRaw).getTime()
    const end = new Date(endRaw).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    if (now >= start && now <= end) return true
  }
  return false
}

function normalizeTime(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return ''
  const h = Number(match[1])
  const m = Number(match[2])
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return ''
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function dayKeyLabel(day: string): string {
  switch (day) {
    case 'mon':
      return 'Lun'
    case 'tue':
      return 'Mar'
    case 'wed':
      return 'Mer'
    case 'thu':
      return 'Jeu'
    case 'fri':
      return 'Ven'
    case 'sat':
      return 'Sam'
    case 'sun':
      return 'Dim'
    default:
      return day
  }
}

/**
 * Détermine si le livreur est disponible maintenant, uniquement selon availabilitySlots.
 */
function isDriverAvailableNow(isAvailable: boolean, availabilitySlots: unknown): boolean {
  if (!isAvailable) return false
  if (!Array.isArray(availabilitySlots) || availabilitySlots.length === 0) return false
  return matchesAvailabilitySlotsNow(availabilitySlots)
}

/**
 * Normalise une valeur JSON en liste d'URLs.
 */
function normalizeUrlList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string') as string[]
  if (typeof value === 'string') return value.length > 0 ? [value] : []
  return []
}

/**
 * Miniature image cliquable.
 */
function ImageThumb(props: { url: string; label: string }): JSX.Element {
  const { url, label } = props
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex w-20 flex-col items-center gap-1"
      title={label}
    >
      <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="h-full w-full object-cover" />
      </div>
      <span className="w-full truncate text-center text-[10px] text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200">
        {label}
      </span>
    </a>
  )
}

type DriverProfileRecord = {
  id: string
  userId: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  neighborhood: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  identityDocType: string | null
  identityDocNumber: string | null
  identityDocFrontUrl: string | null
  identityDocBackUrl: string | null
  selfieWithDocUrl: string | null
  transportMode: string | null
  vehicleBrand: string | null
  vehicleModel: string | null
  vehiclePlate: string | null
  vehicleColor: string | null
  vehiclePhotos: any | null
  zones: any | null
  availability: any | null
  availabilitySlots?: { start: string; end: string }[] | null
  isAvailable: boolean
  maxDistanceKm: number | null
  status: string
}

/**
 * Normalise la valeur zones (JSON) provenant de la base en une liste de libellés.
 */
function normalizeZonesToLabels(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => {
        if (!entry) return []
        if (typeof entry === 'string') return [entry]
        if (typeof entry === 'object') {
          const city = String((entry as any)?.city ?? '').trim()
          const neighborhoods = Array.isArray((entry as any)?.neighborhoods)
            ? ((entry as any).neighborhoods as any[]).map((n) => String(n).trim()).filter(Boolean)
            : []
          const parts = [city, neighborhoods.length > 0 ? neighborhoods.join('/') : ''].filter(Boolean)
          const label = parts.join(' - ').trim()
          return label ? [label] : []
        }
        return []
      })
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    const parsed = parseOptionalJson(trimmed)
    if (parsed) return normalizeZonesToLabels(parsed)
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
  }
  if (typeof value === 'object') {
    return normalizeZonesToLabels([value])
  }
  return []
}

/**
 * Normalise une valeur quelconque (JSON/array/string) en liste de chaînes uniques.
 */
function normalizeStringList(value: unknown): string[] {
  const list = normalizeUrlList(value)
  if (list.length > 0) {
    return Array.from(new Set(list.map((v) => v.trim()).filter(Boolean)))
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    const parsed = parseOptionalJson(trimmed)
    if (parsed) return normalizeStringList(parsed)
    return Array.from(new Set(trimmed.split(',').map((v) => v.trim()).filter(Boolean)))
  }
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((v) => (typeof v === 'string' ? v.trim() : ''))
          .filter(Boolean)
      )
    )
  }
  return []
}

/**
 * Retourne un lien OpenStreetMap centré sur des coordonnées.
 */
function buildOsmLink(coords?: { lat: number; lng: number } | null): string | null {
  if (!coords) return null
  const { lat, lng } = coords
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(lat))}&mlon=${encodeURIComponent(String(lng))}#map=16/${encodeURIComponent(
    String(lat)
  )}/${encodeURIComponent(String(lng))}`
}

/**
 * Normalise un texte JSON potentiellement vide.
 */
function safeJsonTextareaValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

/**
 * Parse une chaîne JSON saisie par l'utilisateur, sinon retourne null.
 */
function parseOptionalJson(text: string): any | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

/**
 * Parse une chaîne JSON en tableau de strings (URLs). Retourne un tableau vide si invalide.
 */
function parseStringArrayJson(text: string): string[] {
  const parsed = parseOptionalJson(text)
  if (!Array.isArray(parsed)) return []
  return parsed.filter((value) => typeof value === 'string')
}

/**
 * Champ upload (bouton) pour éviter les débordements des inputs file natifs.
 */
function UploadButtonField(props: {
  disabled?: boolean
  multiple?: boolean
  accept?: string
  label: string
  onChange: (files: FileList | null) => void
}): JSX.Element {
  const { disabled, multiple, accept, label, onChange } = props

  return (
    <label
      className={`flex w-full cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      }`}
    >
      <span className="truncate">{label}</span>
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.files)
          e.currentTarget.value = ''
        }}
      />
    </label>
  )
}

/**
 * Formatte une date ISO en format lisible.
 */
function formatDate(value?: string | null, locale: string = 'fr-FR', timeZone?: string): string {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...(timeZone ? { timeZone } : {})
    }).format(date)
  } catch {
    return value
  }
}

/**
 * Détermine si le navigateur est en mode dark.
 */
function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('pb-theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'
}

/**
 * Applique le thème sur la racine HTML.
 */
function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

/**
 * Page Driver Dashboard — mobile-first (style app native) avec navigation bottom tabs.
 */
export default function DriverDashboardPage(): JSX.Element {
  const router = useRouter()
  const { addNotification } = useNotifications()
  const { user, loading, session, userProfile, refreshUserData } = useAuth()
  const { locale, timeZone } = useDateTime()

  const formatDateWithPrefs = useCallback(
    (value?: string | null): string => formatDate(value, locale, timeZone),
    [locale, timeZone]
  )

  /**
   * Récupère un access token Supabase depuis le contexte d'auth (client).
   * On privilégie ce token car certaines configs stockent la session en localStorage (pas en cookies).
   */
  const accessToken = session?.access_token ?? null

  const [activeTab, setActiveTab] = useState<DriverTab>('deliveries')
  const [deliveries, setDeliveries] = useState<DriverDeliveryRecord[]>([])
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<DriverDeliveryRecord | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [isMarkingArrived, setIsMarkingArrived] = useState(false)
  const [isDelivering, setIsDelivering] = useState(false)
  const deliveryProofInputRef = useRef<HTMLInputElement | null>(null)

  const locationWatchIdRef = useRef<number | null>(null)
  const lastLocationSentAtRef = useRef<number>(0)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme())

  const [driverProfile, setDriverProfile] = useState<DriverProfileRecord | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const previousStatusByDeliveryIdRef = useRef<Map<string, string>>(new Map())
  const autoOpenedChatDeliveryIdsRef = useRef<Set<string>>(new Set())

  // Ouvre automatiquement le chat dès qu'une livraison est sélectionnée dans l'onglet chat.
  useEffect(() => {
    if (activeTab !== 'chat') return
    if (!selectedDelivery) return
    if (isChatOpen) return
    setIsChatOpen(true)
  }, [activeTab, selectedDelivery, isChatOpen])

  useEffect(() => {
    if (!Array.isArray(deliveries) || deliveries.length === 0) return

    const nextPrevious = new Map(previousStatusByDeliveryIdRef.current)
    const candidate = deliveries.find((d) => {
      const id = String(d?.id ?? '')
      if (!id) return false
      const prev = String(previousStatusByDeliveryIdRef.current.get(id) ?? '').toLowerCase()
      const now = String(d?.status ?? '').toLowerCase()
      return prev !== 'confirmed' && now === 'confirmed'
    })

    deliveries.forEach((d) => {
      const id = String(d?.id ?? '')
      if (!id) return
      nextPrevious.set(id, String(d?.status ?? ''))
    })
    previousStatusByDeliveryIdRef.current = nextPrevious

    if (!candidate) return
    const candidateId = String(candidate.id)
    if (autoOpenedChatDeliveryIdsRef.current.has(candidateId)) return
    autoOpenedChatDeliveryIdsRef.current.add(candidateId)

    setSelectedDelivery(candidate)
    setActiveTab('chat')
    setIsChatOpen(true)
  }, [deliveries])
  const [zonesList, setZonesList] = useState<string[]>([])
  const [zonesInput, setZonesInput] = useState('')
  const [vehiclePhotosList, setVehiclePhotosList] = useState<string[]>([])
  const [vehiclePhotosInput, setVehiclePhotosInput] = useState('')
  const [isUploadingDriverAsset, setIsUploadingDriverAsset] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<{ start: string; end: string }[]>([])
  const [rangeFrom, setRangeFrom] = useState<Date | undefined>(undefined)
  const [rangeTo, setRangeTo] = useState<Date | undefined>(undefined)
  const [slotStartTime, setSlotStartTime] = useState('08:00')
  const [slotEndTime, setSlotEndTime] = useState('18:00')

  const driverReportStats = useMemo(() => {
    const list = Array.isArray(deliveries) ? deliveries : []
    const decided = list.filter((d) => {
      const decision = computeDriverDecision(d)
      return decision.accepted || decision.rejected
    })

    const accepted = decided.filter((d) => computeDriverDecision(d).accepted)
    const rejected = decided.filter((d) => computeDriverDecision(d).rejected)

    const rate = decided.length > 0 ? Math.round((accepted.length / decided.length) * 100) : 0

    const reasonCounts = new Map<string, number>()
    rejected.forEach((d) => {
      const reasons = extractRejectReasons(d)
      if (reasons.length === 0) {
        reasonCounts.set('Motif non précisé', (reasonCounts.get('Motif non précisé') ?? 0) + 1)
        return
      }
      reasons.forEach((r) => {
        reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1)
      })
    })

    const topReasons = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }))

    return {
      total: list.length,
      decided: decided.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      acceptanceRate: rate,
      accepted,
      rejected,
      topReasons
    }
  }, [deliveries])

  /**
   * Upload l'avatar du livreur et met à jour user_profiles.avatar_url.
   */
  const uploadDriverAvatar = useCallback(
    async (file: File) => {
      if (!accessToken) {
        throw new Error('Session non prête. Réessaie dans quelques secondes.')
      }

      const maxBytes = 3 * 1024 * 1024
      if (file.size > maxBytes) {
        throw new Error('Fichier trop volumineux. Taille maximale: 3 Mo.')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/driver/avatar', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error ?? "Impossible d'uploader la photo de profil.")
      }

      await response.json().catch(() => ({}))
      await refreshUserData()
    },
    [accessToken, refreshUserData]
  )

  /**
   * Sauvegarde le profil livreur via l'API.
   */
  const saveDriverProfile = useCallback(async (profileOverride?: DriverProfileRecord) => {
    const profileToSave = profileOverride ?? driverProfile
    if (!profileToSave) return

    try {
      setIsSavingProfile(true)
      const response = await fetch('/api/driver/profile', {
        method: 'PUT',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          ...profileToSave,
          availabilitySlots: (profileToSave as any)?.availabilitySlots ?? availabilitySlots,
          zones: zonesList,
          vehiclePhotos: vehiclePhotosList
        })
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Impossible de sauvegarder le profil.')
      }

      const payload = (await response.json()) as { data?: DriverProfileRecord }
      const updated = payload.data ?? null
      setDriverProfile(updated)
      setZonesList(normalizeZonesToLabels(updated?.zones))
      setZonesInput('')
      setVehiclePhotosList(normalizeStringList(updated?.vehiclePhotos))
      setVehiclePhotosInput('')

      addNotification({
        type: 'success',
        title: 'Paramètres',
        message: 'Votre profil livreur a été mis à jour.'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      addNotification({ type: 'error', title: 'Sauvegarde', message })
    } finally {
      setIsSavingProfile(false)
    }
  }, [accessToken, addNotification, availabilitySlots, driverProfile, vehiclePhotosList, zonesList])

  /**
   * Téléverse un fichier vers Supabase Storage et retourne l'URL publique.
   * Limite: 3 Mo.
   */
  const uploadDriverAsset = useCallback(
    async (file: File, category: 'identity' | 'vehicle'): Promise<string> => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté.')
      }

      if (!accessToken) {
        throw new Error('Session non prête. Réessaie dans quelques secondes.')
      }

      const maxBytes = 3 * 1024 * 1024
      if (file.size > maxBytes) {
        throw new Error('Fichier trop volumineux. Taille maximale: 3 Mo.')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)

      const response = await fetch('/api/driver/uploads', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error ?? "Impossible d'uploader le fichier.")
      }

      const payload = (await response.json()) as { data?: { publicUrl?: string } }
      const publicUrl = payload?.data?.publicUrl

      if (!publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique du fichier.")
      }

      return publicUrl
    },
    [accessToken, user?.id]
  )

  /**
   * Upload un document (recto/verso/selfie), met à jour l'état local + persiste via API.
   */
  const uploadAndPersistIdentityDoc = useCallback(
    async (file: File, field: 'identityDocFrontUrl' | 'identityDocBackUrl' | 'selfieWithDocUrl') => {
      if (!driverProfile) return
      try {
        setIsUploadingDriverAsset(true)
        const publicUrl = await uploadDriverAsset(file, 'identity')
        const nextProfile = { ...driverProfile, [field]: publicUrl }
        setDriverProfile(nextProfile)
        addNotification({ type: 'success', title: 'Upload', message: 'Image téléversée. Sauvegarde en cours…' })

        // Persister immédiatement.
        await saveDriverProfile(nextProfile)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        addNotification({ type: 'error', title: 'Upload', message })
      } finally {
        setIsUploadingDriverAsset(false)
      }
    },
    [addNotification, driverProfile, saveDriverProfile, uploadDriverAsset]
  )

  /**
   * Upload une ou plusieurs photos véhicule, met à jour le JSON d'URLs, puis persiste.
   */
  const uploadAndPersistVehiclePhotos = useCallback(
    async (files: FileList | null) => {
      if (!driverProfile) return
      if (!files || files.length === 0) return

      try {
        setIsUploadingDriverAsset(true)
        const existingUrls = Array.isArray(vehiclePhotosList) ? vehiclePhotosList : []

        const uploadedUrls: string[] = []
        for (const file of Array.from(files)) {
          const url = await uploadDriverAsset(file, 'vehicle')
          uploadedUrls.push(url)
        }

        const nextUrls = Array.from(new Set([...existingUrls, ...uploadedUrls].map((v) => String(v).trim()).filter(Boolean)))
        setVehiclePhotosList(nextUrls)
        setVehiclePhotosInput('')
        const nextProfile = { ...driverProfile, vehiclePhotos: nextUrls }
        setDriverProfile(nextProfile)

        addNotification({ type: 'success', title: 'Upload', message: 'Photos téléversées. Sauvegarde en cours…' })
        await saveDriverProfile(nextProfile)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        addNotification({ type: 'error', title: 'Upload', message })
      } finally {
        setIsUploadingDriverAsset(false)
      }
    },
    [addNotification, driverProfile, saveDriverProfile, uploadDriverAsset, vehiclePhotosList]
  )

  /**
   * Upload une photo véhicule, met à jour le JSON d'URLs, puis persiste.
   */
  const uploadAndPersistVehiclePhoto = useCallback(
    async (file: File) => {
      if (!driverProfile) return
      try {
        setIsUploadingDriverAsset(true)
        const publicUrl = await uploadDriverAsset(file, 'vehicle')
        const existing = normalizeStringList(driverProfile.vehiclePhotos)
        const nextUrls = Array.from(new Set([...existing, publicUrl].map((v) => String(v).trim()).filter(Boolean)))
        setVehiclePhotosList(nextUrls)
        setVehiclePhotosInput('')
        const nextProfile = { ...driverProfile, vehiclePhotos: nextUrls }
        setDriverProfile(nextProfile)
        addNotification({ type: 'success', title: 'Upload', message: 'Photo téléversée. Sauvegarde en cours…' })

        // Persister immédiatement.
        await saveDriverProfile(nextProfile)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        addNotification({ type: 'error', title: 'Upload', message })
      } finally {
        setIsUploadingDriverAsset(false)
      }
    },
    [addNotification, driverProfile, saveDriverProfile, uploadDriverAsset]
  )

  /**
   * Protège la page: redirection si non connecté.
   */
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [loading, router, user])

  /**
   * Protège la page: si l'utilisateur n'est pas livreur, redirige vers le dashboard approprié.
   */
  useEffect(() => {
    if (loading) return
    if (!user) return

    if (user.role !== 'driver') {
      if (user.role === 'vendor') router.push('/seller-dashboard')
      else if (user.role === 'admin' || user.role === 'super_admin') router.push('/super-admin-dashboard')
      else router.push('/dashboard')
    }
  }, [loading, router, user])

  /**
   * Applique le thème et le persiste.
   */
  useEffect(() => {
    applyTheme(theme)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pb-theme', theme)
    }
  }, [theme])

  /**
   * Charge le profil livreur (table drivers) pour permettre l'édition des paramètres.
   */
  const loadDriverProfile = useCallback(async () => {
    if (!user?.id) return
    if (!accessToken) return

    try {
      setIsLoadingProfile(true)
      const response = await fetch('/api/driver/profile', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Impossible de charger le profil livreur.')
      }

      const payload = (await response.json()) as { data?: DriverProfileRecord }
      const profile = payload.data ?? null
      setDriverProfile(profile)
      setZonesList(normalizeZonesToLabels(profile?.zones))
      setZonesInput('')
      setVehiclePhotosList(normalizeStringList(profile?.vehiclePhotos))
      setVehiclePhotosInput('')

      const parsedSlots = (profile as any)?.availabilitySlots
      if (Array.isArray(parsedSlots)) {
        setAvailabilitySlots(
          parsedSlots
            .map((slot: any) => ({
              start: typeof slot?.start === 'string' ? slot.start : '',
              end: typeof slot?.end === 'string' ? slot.end : ''
            }))
            .filter((slot) => slot.start && slot.end)
        )
      } else {
        setAvailabilitySlots([])
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setDriverProfile(null)
      addNotification({ type: 'error', title: 'Profil livreur', message })
    } finally {
      setIsLoadingProfile(false)
    }
  }, [accessToken, addNotification, user?.id])

  useEffect(() => {
    if (!driverProfile) return
    setDriverProfile({ ...driverProfile, availabilitySlots })
  }, [availabilitySlots])

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (user.role !== 'driver') return
    if (!accessToken) return
    void loadDriverProfile()
  }, [accessToken, loadDriverProfile, loading, user])

  /**
   * Charge les livraisons assignées au livreur.
   */
  const loadDeliveries = useCallback(async () => {
    if (!accessToken) return
    try {
      setIsLoadingDeliveries(true)
      const response = await fetch('/api/driver/deliveries', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Impossible de charger les livraisons.')
      }

      const payload = (await response.json()) as { data?: DriverDeliveryRecord[] }
      setDeliveries(payload.data ?? [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setDeliveries([])
      addNotification({
        type: 'error',
        title: 'Livraisons',
        message
      })
    } finally {
      setIsLoadingDeliveries(false)
    }
  }, [accessToken, addNotification])

  useEffect(() => {
    if (!accessToken) return
    void loadDeliveries()
  }, [accessToken, loadDeliveries])

  /**
   * Démarre/stoppe le tracking GPS en temps réel pour la livraison sélectionnée.
   */
  useEffect(() => {
    if (!selectedDelivery?.id) return
    if (!accessToken) return
    if (typeof window === 'undefined') return
    if (!('geolocation' in navigator)) return

    const status = String(selectedDelivery.status ?? '').toLowerCase()
    if (['delivered', 'cancelled', 'failed'].includes(status)) return

    const deliveryId = selectedDelivery.id
    const throttleMs = 10_000

    const watchId = window.navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now()
        if (now - lastLocationSentAtRef.current < throttleMs) return
        lastLocationSentAtRef.current = now

        const lat = position.coords.latitude
        const lng = position.coords.longitude

        try {
          const res = await fetch(`/api/driver/deliveries/${encodeURIComponent(deliveryId)}/location`, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ lat, lng })
          })

          if (!res.ok) {
            // Si l'auth échoue (401/403) ou si le tracking est désactivé (409), on stoppe le watcher
            // pour éviter de spammer l'API (et dégrader l'UI, dont l'ouverture du chat).
            if ([401, 403, 409].includes(res.status)) {
              if (locationWatchIdRef.current !== null) {
                try {
                  window.navigator.geolocation.clearWatch(locationWatchIdRef.current)
                } catch {
                  // ignore
                }
              }
              locationWatchIdRef.current = null
            }
          }
        } catch {
          // silencieux: le realtime réessaiera au prochain tick
        }
      },
      () => {
        // silencieux (permissions GPS, etc.)
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 10_000 }
    )

    locationWatchIdRef.current = watchId
    return () => {
      if (locationWatchIdRef.current !== null) {
        try {
          window.navigator.geolocation.clearWatch(locationWatchIdRef.current)
        } catch {
          // ignore
        }
      }
      locationWatchIdRef.current = null
    }
  }, [accessToken, selectedDelivery?.id, selectedDelivery?.status])

  useEffect(() => {
    if (!user?.id) return
    if (!accessToken) return

    const channel = supabase
      .channel(`driver_deliveries_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `driver_id=eq.${user.id}`
        },
        () => {
          void loadDeliveries()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accessToken, loadDeliveries, user?.id])

  /**
   * Accepte une livraison.
   */
  const acceptDelivery = useCallback(
    async (deliveryId: string) => {
      try {
        const res = await fetch(`/api/driver/deliveries/${encodeURIComponent(deliveryId)}/accept`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? 'Impossible d\'accepter la livraison.')
        }

        addNotification({
          type: 'success',
          title: 'Livraison acceptée',
          message: 'La livraison a été acceptée et le chat est disponible.'
        })

        await loadDeliveries()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        addNotification({
          type: 'error',
          title: 'Acceptation',
          message
        })
      }
    },
    [accessToken, addNotification, loadDeliveries]
  )

  /**
   * Refuse une livraison.
   */
  const rejectDelivery = useCallback(
    /**
     * Refuse une livraison avec un motif (obligatoire).
     */
    async (deliveryId: string, reason: string) => {
      try {
        const trimmedReason = String(reason ?? '').trim()
        if (!trimmedReason) {
          throw new Error('Veuillez saisir un motif de refus.')
        }

        const res = await fetch(`/api/driver/deliveries/${encodeURIComponent(deliveryId)}/reject`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ reason: trimmedReason })
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? 'Impossible de refuser la livraison.')
        }

        addNotification({
          type: 'success',
          title: 'Livraison refusée',
          message: 'La livraison a été remise en attente de réassignation.'
        })

        setIsRejectDialogOpen(false)
        setRejectReason('')
        await loadDeliveries()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        addNotification({
          type: 'error',
          title: 'Refus',
          message
        })
      } finally {
        setIsRejecting(false)
      }
    },
    [accessToken, addNotification, loadDeliveries]
  )

  /**
   * Indique si la livraison sélectionnée a déjà été acceptée ou refusée.
   * Objectif: masquer les boutons Accepter / Refuser dès que le système a enregistré une décision.
   */
  const selectedDeliveryDecision = useMemo(() => {
    const events = selectedDelivery?.events ?? []
    const types = new Set(events.map((e) => String(e?.type ?? '').toLowerCase()))
    const status = String(selectedDelivery?.status ?? '').toLowerCase()

    const accepted =
      types.has('driver_accept') ||
      types.has('driver_accepted') ||
      status === 'confirmed' ||
      status === 'preparing' ||
      status === 'ready_for_pickup' ||
      status === 'in_transit' ||
      status === 'out_for_delivery' ||
      status === 'delayed' ||
      status === 'delivered'

    const rejected = types.has('driver_reject') || types.has('driver_rejected')
    const arrived = types.has('driver_arrived') || Boolean((selectedDelivery as any)?.arrivedAt) || status === 'arrived'
    const delivered =
      types.has('driver_delivered') ||
      status === 'delivered' ||
      status === 'completed'
    return { accepted, rejected, arrived, delivered }
  }, [selectedDelivery?.events, selectedDelivery?.status])

  /**
   * Marque l'arrivée à destination (GPS + bouton).
   */
  const markArrivedAtDestination = useCallback(async () => {
    if (!selectedDelivery?.id) return
    if (!accessToken) {
      addNotification({ type: 'error', title: 'Arrivée', message: 'Session non prête. Réessaie.' })
      return
    }

    try {
      setIsMarkingArrived(true)
      const res = await fetch(`/api/driver/deliveries/${encodeURIComponent(selectedDelivery.id)}/arrived`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          location: selectedDelivery.currentLocation ?? null,
          coordinates: (() => {
          const c = normalizeCoordinates(selectedDelivery.coordinates)
          return c ? { lat: c.lat, lng: c.lng } : null
        })()
        })
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error ?? "Impossible d'enregistrer l'arrivée.")
      }

      addNotification({
        type: 'success',
        title: 'Arrivée',
        message: 'Arrivée à destination enregistrée. Le client et le vendeur ont été notifiés.'
      })

      await loadDeliveries()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      addNotification({ type: 'error', title: 'Arrivée', message })
    } finally {
      setIsMarkingArrived(false)
    }
  }, [accessToken, addNotification, loadDeliveries, selectedDelivery])

  /**
   * Upload la preuve photo et confirme la livraison.
   */
  const uploadDeliveryProofAndConfirm = useCallback(
    async (file: File) => {
      if (!selectedDelivery?.id) return
      if (!accessToken) {
        throw new Error('Session non prête. Réessaie dans quelques secondes.')
      }

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/driver/deliveries/${encodeURIComponent(selectedDelivery.id)}/delivered`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        body: formData
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error ?? 'Impossible de confirmer la livraison.')
      }
    },
    [accessToken, selectedDelivery]
  )

  const deliveriesForChat = useMemo(() => deliveries.filter((d) => Boolean(d.orderId)), [deliveries])

    const destinationPoint = useMemo(() => {
    // Format natif de la base de données
    const coords = normalizeCoordinates(selectedDelivery?.destinationCoordinates)
    if (coords) return { lat: coords.lat, lng: coords.lng, label: 'Client' }

    // Fallback : adresse de livraison embarquée dans la commande
    const address = selectedDelivery?.shippingAddress
    if (!address || typeof address !== 'object') return null
    const lat = (address as any)?.lat ?? (address as any)?.latitude
    const lng = (address as any)?.lng ?? (address as any)?.longitude
    const latNum = typeof lat === 'string' ? Number(lat) : lat
    const lngNum = typeof lng === 'string' ? Number(lng) : lng
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null
    return { lat: Number(latNum), lng: Number(lngNum), label: 'Client' }
  }, [selectedDelivery?.destinationCoordinates, selectedDelivery?.shippingAddress])

  const driverActiveNow = useMemo(() => {
    if (!driverProfile) return false
    if (!driverProfile.isAvailable) return false

    const slots = (driverProfile as any)?.availabilitySlots
    if (!Array.isArray(slots) || slots.length === 0) return false
    return matchesAvailabilitySlotsNow(slots)
  }, [driverProfile])

  const driverAvatarUrl = userProfile?.avatar_url ?? null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100">
        <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Chargement…</div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'driver') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100">
        <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Redirection…</div>
        </div>
      </div>
    )
  }

  const driverPoint = useMemo(() => {
    const coords = normalizeCoordinates(selectedDelivery?.coordinates)
    if (!coords) return null
    return { lat: coords.lat, lng: coords.lng, label: 'Livreur' }
  }, [selectedDelivery?.coordinates])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100">
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Tableau de bord Livreur</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Suivi mobile — rapide, clair, opérationnel</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                  {driverAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={driverAvatarUrl} alt="Photo de profil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">PB</div>
                  )}
                </div>
                {driverActiveNow ? (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b0f19] animate-pulse" />
                ) : (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-gray-300 ring-2 ring-white dark:bg-white/20 dark:ring-[#0b0f19]" />
                )}
              </div>
              <Button variant="outline" onClick={() => void loadDeliveries()} disabled={isLoadingDeliveries}>
                Actualiser
              </Button>
            </div>
          </div>
        </header>

        {activeTab === 'deliveries' ? (
          <div className="space-y-4">
            <Card className="border-gray-200 shadow-sm dark:border-white/10 dark:bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-5 w-5 text-orange-500" />
                  Livraisons assignées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingDeliveries ? (
                  <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Chargement…</div>
                ) : deliveries.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Aucune livraison assignée.</div>
                ) : (
                  <div className="space-y-3">
                    {deliveries.map((delivery) => (
                      <button
                        key={delivery.id}
                        type="button"
                        onClick={() => setSelectedDelivery(delivery)}
                        className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Commande</p>
                            <p className="text-sm font-semibold">#{delivery.orderNumber}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">ETA: {formatDateWithPrefs(delivery.eta)}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Adresse:{' '}
                              {typeof delivery.deliveryAddress === 'string' && delivery.deliveryAddress.trim().length > 0
                                ? delivery.deliveryAddress
                                : '—'}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {delivery.status}
                          </Badge>
                        </div>
                        <Separator className="my-3 dark:bg-white/10" />
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>{delivery.currentLocation ?? 'Localisation: —'}</span>
                          <span>{delivery.progressPercent}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedDelivery ? (
              <Card className="border-gray-200 shadow-sm dark:border-white/10 dark:bg-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                      Détails
                    </span>
                    <Button variant="ghost" onClick={() => setSelectedDelivery(null)}>
                      Fermer
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Commande</span>
                      <span className="font-semibold">#{selectedDelivery.orderNumber}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Statut</span>
                      <span className="font-medium">{selectedDelivery.status}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Dernière mise à jour</span>
                      <span className="font-medium">{formatDateWithPrefs(selectedDelivery.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Tracking</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Suivi GPS temps réel (carte + tracé simple). La destination s'affiche si l'adresse client contient des coordonnées.
                    </p>

                    <div className="mt-3">
                      <DeliveryTrackingMap
                        driverPoint={driverPoint}
                        destinationPoint={destinationPoint}
                        heightClassName="h-72"
                      />
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Coordonnées actuelles</span>
                        <span className="font-medium">
                          {(() => {
                            const coord = normalizeCoordinates(selectedDelivery.coordinates)
                            return coord
                              ? `${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}`
                              : '—'
                          })()}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Adresse</span>
                        <span className="text-right font-medium">
                          {selectedDelivery.deliveryAddress ?? '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Heure (ETA)</span>
                        <span className="font-medium">{formatDate(selectedDelivery.eta)}</span>
                      </div>
                      {buildOsmLink(normalizeCoordinates(selectedDelivery.coordinates)) ? (
                        <a
                          className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                          href={buildOsmLink(normalizeCoordinates(selectedDelivery.coordinates)) ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ouvrir la carte (OpenStreetMap)
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {!selectedDeliveryDecision.accepted && !selectedDeliveryDecision.rejected ? (
                      <>
                        <Button
                          onClick={() => void acceptDelivery(selectedDelivery.id)}
                          className="h-12 bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Accepter
                        </Button>
                        <Button
                          onClick={() => {
                            setRejectReason('')
                            setIsRejectDialogOpen(true)
                          }}
                          variant="destructive"
                          className="h-12"
                        >
                          <XCircle className="mr-2 h-5 w-5" />
                          Refuser
                        </Button>
                      </>
                    ) : (
                      <div className="col-span-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                        Décision enregistrée. Actions désactivées.
                      </div>
                    )}
                  </div>

                  {selectedDeliveryDecision.accepted && !selectedDeliveryDecision.rejected && !selectedDeliveryDecision.delivered ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 w-full"
                          disabled={isMarkingArrived}
                          onClick={() => void markArrivedAtDestination()}
                        >
                          {isMarkingArrived ? 'Enregistrement…' : 'Arrivé à destination'}
                        </Button>

                        <Button
                          type="button"
                          className="h-12 w-full bg-[#ff6600] text-white hover:bg-[#e55a00]"
                          disabled={isDelivering}
                          onClick={() => {
                            deliveryProofInputRef.current?.click()
                          }}
                        >
                          {isDelivering ? 'Upload…' : 'Livraison effectuée'}
                        </Button>
                      </div>

                      <input
                        ref={deliveryProofInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null
                          e.target.value = ''
                          if (!file) return
                          void (async () => {
                            try {
                              setIsDelivering(true)
                              await uploadDeliveryProofAndConfirm(file)
                              addNotification({
                                type: 'success',
                                title: 'Livraison',
                                message: 'Bravo. Preuve enregistrée et livraison confirmée.'
                              })
                              await loadDeliveries()
                            } catch (error) {
                              const message = error instanceof Error ? error.message : 'Erreur inconnue'
                              addNotification({ type: 'error', title: 'Livraison', message })
                            } finally {
                              setIsDelivering(false)
                            }
                          })()
                        }}
                      />
                    </div>
                  ) : null}

                  <Button
                    variant="outline"
                    className="h-12 w-full"
                    onClick={() => {
                      setActiveTab('chat')
                      if (!selectedDelivery && deliveriesForChat.length > 0) {
                        setSelectedDelivery(deliveriesForChat[0])
                      }
                      setIsChatOpen(true)
                    }}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Ouvrir le chat livraison
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}

        <Dialog
          open={isRejectDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsRejectDialogOpen(false)
              setRejectReason('')
              setIsRejecting(false)
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Motif du refus</DialogTitle>
              <DialogDescription>
                Indique pourquoi tu refuses cette livraison. Ce motif sera enregistré pour le suivi et les rapports.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Motif</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: client injoignable, zone trop éloignée, indisponible..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false)
                  setRejectReason('')
                }}
                disabled={isRejecting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isRejecting}
                onClick={() => {
                  if (!selectedDelivery?.id) return
                  setIsRejecting(true)
                  void rejectDelivery(selectedDelivery.id, rejectReason)
                }}
              >
                {isRejecting ? 'Envoi…' : 'Confirmer le refus'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeTab === 'chat' ? (
          <div className="space-y-4">
            <Card className="border-gray-200 shadow-sm dark:border-white/10 dark:bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-5 w-5 text-orange-500" />
                  Chat livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deliveriesForChat.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Aucune livraison disponible pour le chat.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deliveriesForChat.map((delivery) => (
                      <button
                        key={delivery.id}
                        type="button"
                        onClick={() => {
                          setSelectedDelivery(delivery)
                          setIsChatOpen(true)
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] dark:border-white/10 dark:bg-white/5"
                      >
                        <p className="text-sm font-semibold">#{delivery.orderNumber}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{delivery.currentLocation ?? '—'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedDelivery ? (
              <DeliveryChatReplacement
                deliveryInfo={selectedDelivery}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
              />
            ) : null}
          </div>
        ) : null}

        {activeTab === 'reports' ? (
          <div className="space-y-4">
            <Card className="border-gray-200 shadow-sm dark:border-white/10 dark:bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Rapports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Livraisons (total)</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{driverReportStats.total}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Taux d’acceptation</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{driverReportStats.acceptanceRate}%</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {driverReportStats.acceptedCount} acceptées • {driverReportStats.rejectedCount} refusées
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Livraisons acceptées</div>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">{driverReportStats.acceptedCount}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {driverReportStats.accepted.length === 0 ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Aucune livraison acceptée pour l’instant.</div>
                      ) : (
                        driverReportStats.accepted.slice(0, 8).map((d) => (
                          <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
                            <div className="min-w-0">
                              <div className="truncate font-medium">#{d.orderNumber}</div>
                              <div className="truncate text-gray-500 dark:text-gray-400">Statut: {d.status}</div>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Livraisons refusées</div>
                      <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-200">{driverReportStats.rejectedCount}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {driverReportStats.rejected.length === 0 ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Aucune livraison refusée.</div>
                      ) : (
                        driverReportStats.rejected.slice(0, 8).map((d) => {
                          const reasons = extractRejectReasons(d)
                          const label = reasons.length > 0 ? reasons[0] : 'Motif non précisé'
                          return (
                            <div key={d.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
                              <div className="flex items-center justify-between">
                                <div className="truncate font-medium">#{d.orderNumber}</div>
                                <XCircle className="h-4 w-4 text-rose-600" />
                              </div>
                              <div className="mt-1 truncate text-gray-500 dark:text-gray-400">Motif: {label}</div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Motifs (top)</div>
                  <div className="mt-3 space-y-2">
                    {driverReportStats.topReasons.length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Pas encore de données de refus.</div>
                    ) : (
                      driverReportStats.topReasons.map((r) => (
                        <div key={r.label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5">
                          <div className="min-w-0 truncate">{r.label}</div>
                          <Badge className="bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200">{r.count}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === 'settings' ? (
          <div className="space-y-4">
            <Card className="border-gray-200 shadow-sm dark:border-white/10 dark:bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-5 w-5 text-orange-500" />
                  Paramètres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-semibold">Mode sombre</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Affichage adapté à la nuit</p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>

                <Card className="border-gray-200 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Profil livreur</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingProfile ? (
                      <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Chargement du profil…</div>
                    ) : !driverProfile ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                        Profil indisponible. Vérifie que ton compte est bien en rôle <span className="font-semibold">driver</span>.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                                {driverAvatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={driverAvatarUrl} alt="Photo de profil" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">PB</div>
                                )}
                              </div>
                              {driverActiveNow ? (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b0f19] animate-pulse" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {(driverProfile.firstName ?? '').trim()} {(driverProfile.lastName ?? '').trim()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {driverActiveNow ? 'Actif maintenant' : 'Inactif'}
                              </p>
                            </div>
                            <div className="ml-auto w-44 max-w-full">
                              <UploadButtonField
                                disabled={isUploadingAvatar}
                                accept="image/*"
                                label={isUploadingAvatar ? 'Upload…' : 'Modifier la photo'}
                                onChange={(files) => {
                                  const file = files?.[0]
                                  if (!file) return
                                  void (async () => {
                                    try {
                                      setIsUploadingAvatar(true)
                                      await uploadDriverAvatar(file)
                                      addNotification({
                                        type: 'success',
                                        title: 'Photo de profil',
                                        message: 'Photo mise à jour.'
                                      })
                                    } catch (error) {
                                      const message = error instanceof Error ? error.message : 'Erreur inconnue'
                                      addNotification({ type: 'error', title: 'Photo de profil', message })
                                    } finally {
                                      setIsUploadingAvatar(false)
                                    }
                                  })()
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Aperçu des documents</p>
                            <div className="mt-2 flex flex-wrap gap-3">
                              {driverProfile.identityDocFrontUrl ? (
                                <ImageThumb url={driverProfile.identityDocFrontUrl} label="Doc recto" />
                              ) : null}
                              {driverProfile.identityDocBackUrl ? (
                                <ImageThumb url={driverProfile.identityDocBackUrl} label="Doc verso" />
                              ) : null}
                              {driverProfile.selfieWithDocUrl ? (
                                <ImageThumb url={driverProfile.selfieWithDocUrl} label="Selfie" />
                              ) : null}
                              {normalizeUrlList(driverProfile.vehiclePhotos).map((url, index) => (
                                <ImageThumb key={`${url}-${index}`} url={url} label={`Véhicule ${index + 1}`} />
                              ))}
                              {!driverProfile.identityDocFrontUrl &&
                              !driverProfile.identityDocBackUrl &&
                              !driverProfile.selfieWithDocUrl &&
                              normalizeUrlList(driverProfile.vehiclePhotos).length === 0 ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Aucune image uploadée.</p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Prénom</Label>
                            <Input
                              value={driverProfile.firstName ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, firstName: e.target.value })}
                              placeholder="Ex: Amoros"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Nom</Label>
                            <Input
                              value={driverProfile.lastName ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, lastName: e.target.value })}
                              placeholder="Ex: Diallo"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Téléphone</Label>
                            <Input
                              value={driverProfile.phone ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, phone: e.target.value })}
                              placeholder="+33…"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>WhatsApp</Label>
                            <Input
                              value={driverProfile.whatsapp ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, whatsapp: e.target.value })}
                              placeholder="+33…"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Mode de transport</Label>
                            <Select
                              value={driverProfile.transportMode ?? ''}
                              onValueChange={(value) => setDriverProfile({ ...driverProfile, transportMode: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="motorbike">Moto</SelectItem>
                                <SelectItem value="car">Voiture</SelectItem>
                                <SelectItem value="tricycle">Tricycle</SelectItem>
                                <SelectItem value="bicycle">Vélo</SelectItem>
                                <SelectItem value="walking">À pied</SelectItem>
                                <SelectItem value="other">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label>Plaque (véhicule)</Label>
                            <Input
                              value={driverProfile.vehiclePlate ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, vehiclePlate: e.target.value })}
                              placeholder="AA-123-BB"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label>Marque</Label>
                            <Input
                              value={driverProfile.vehicleBrand ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, vehicleBrand: e.target.value })}
                              placeholder="Yamaha / Toyota…"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Modèle</Label>
                            <Input
                              value={driverProfile.vehicleModel ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, vehicleModel: e.target.value })}
                              placeholder="NMAX / Corolla…"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Couleur</Label>
                            <Input
                              value={driverProfile.vehicleColor ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, vehicleColor: e.target.value })}
                              placeholder="Noire…"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Contact d'urgence — Nom</Label>
                            <Input
                              value={driverProfile.emergencyContactName ?? ''}
                              onChange={(e) =>
                                setDriverProfile({ ...driverProfile, emergencyContactName: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Contact d'urgence — Téléphone</Label>
                            <Input
                              value={driverProfile.emergencyContactPhone ?? ''}
                              onChange={(e) =>
                                setDriverProfile({ ...driverProfile, emergencyContactPhone: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Type de pièce d'identité</Label>
                            <Input
                              value={driverProfile.identityDocType ?? ''}
                              onChange={(e) => setDriverProfile({ ...driverProfile, identityDocType: e.target.value })}
                              placeholder="CNI / Passeport…"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Numéro de document</Label>
                            <Input
                              value={driverProfile.identityDocNumber ?? ''}
                              onChange={(e) =>
                                setDriverProfile({ ...driverProfile, identityDocNumber: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="min-w-0 space-y-1">
                            <Label>URL Doc (recto)</Label>
                            <Input
                              value={driverProfile.identityDocFrontUrl ?? ''}
                              onChange={(e) =>
                                setDriverProfile({ ...driverProfile, identityDocFrontUrl: e.target.value })
                              }
                              placeholder="https://…"
                            />
                            <div className="pt-2">
                              <UploadButtonField
                                disabled={isUploadingDriverAsset}
                                accept="image/*"
                                label={isUploadingDriverAsset ? 'Upload…' : 'Choisir une image'}
                                onChange={(files) => {
                                  const file = files?.[0]
                                  if (file) void uploadAndPersistIdentityDoc(file, 'identityDocFrontUrl')
                                }}
                              />
                            </div>
                          </div>
                          <div className="min-w-0 space-y-1">
                            <Label>URL Doc (verso)</Label>
                            <Input
                              value={driverProfile.identityDocBackUrl ?? ''}
                              onChange={(e) =>
                                setDriverProfile({ ...driverProfile, identityDocBackUrl: e.target.value })
                              }
                              placeholder="https://…"
                            />
                            <div className="pt-2">
                              <UploadButtonField
                                disabled={isUploadingDriverAsset}
                                accept="image/*"
                                label={isUploadingDriverAsset ? 'Upload…' : 'Choisir une image'}
                                onChange={(files) => {
                                  const file = files?.[0]
                                  if (file) void uploadAndPersistIdentityDoc(file, 'identityDocBackUrl')
                                }}
                              />
                            </div>
                          </div>
                          <div className="min-w-0 space-y-1">
                            <Label>Selfie avec doc (URL)</Label>
                            <Input
                              value={driverProfile.selfieWithDocUrl ?? ''}
                              onChange={(e) =>
                                setDriverProfile({ ...driverProfile, selfieWithDocUrl: e.target.value })
                              }
                              placeholder="https://…"
                            />
                            <div className="pt-2">
                              <UploadButtonField
                                disabled={isUploadingDriverAsset}
                                accept="image/*"
                                label={isUploadingDriverAsset ? 'Upload…' : 'Choisir une image'}
                                onChange={(files) => {
                                  const file = files?.[0]
                                  if (file) void uploadAndPersistIdentityDoc(file, 'selfieWithDocUrl')
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 overflow-hidden dark:border-white/10 dark:bg-white/5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold">Disponibilités</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Active ton statut et ajoute des créneaux pour le calendrier de planification.
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Disponible</span>
                              <Switch
                                checked={Boolean(driverProfile.isAvailable)}
                                onCheckedChange={(checked) => setDriverProfile({ ...driverProfile, isAvailable: Boolean(checked) })}
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,280px)]">
                            <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-white/5">
                              <Calendar
                                mode="range"
                                className="w-full [--cell-size:--spacing(7)]"
                                selected={{ from: rangeFrom, to: rangeTo }}
                                onSelect={(range: any) => {
                                  const from = range?.from as Date | undefined
                                  const to = (range?.to as Date | undefined) ?? from
                                  setRangeFrom(from)
                                  setRangeTo(to)
                                }}
                                numberOfMonths={1}
                              />
                            </div>

                            <div className="min-w-0 space-y-3">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                  <Label>Heure début</Label>
                                  <Input
                                    value={slotStartTime}
                                    onChange={(e) => setSlotStartTime(e.target.value)}
                                    placeholder="08:00"
                                    className="h-8 px-2 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label>Heure fin</Label>
                                  <Input
                                    value={slotEndTime}
                                    onChange={(e) => setSlotEndTime(e.target.value)}
                                    placeholder="18:00"
                                    className="h-8 px-2 text-xs"
                                  />
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-full px-2 text-xs"
                                onClick={() => {
                                  if (!rangeFrom) return
                                  const start = normalizeTime(slotStartTime)
                                  const end = normalizeTime(slotEndTime)
                                  if (!start || !end) return

                                  const from = new Date(rangeFrom)
                                  const to = new Date(rangeTo ?? rangeFrom)
                                  from.setHours(0, 0, 0, 0)
                                  to.setHours(0, 0, 0, 0)

                                  const [sh, sm] = start.split(':').map(Number)
                                  const [eh, em] = end.split(':').map(Number)

                                  const next: { start: string; end: string }[] = []
                                  for (let d = new Date(from); d.getTime() <= to.getTime(); d.setDate(d.getDate() + 1)) {
                                    const slotStart = new Date(d)
                                    slotStart.setHours(sh, sm, 0, 0)

                                    const slotEnd = new Date(d)
                                    slotEnd.setHours(eh, em, 0, 0)
                                    if (slotEnd.getTime() <= slotStart.getTime()) {
                                      slotEnd.setDate(slotEnd.getDate() + 1)
                                    }

                                    next.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() })
                                  }

                                  setAvailabilitySlots((prev) => {
                                    const merged = [...prev, ...next]
                                      .filter((s) => typeof s?.start === 'string' && typeof s?.end === 'string' && s.start && s.end)
                                      .map((s) => ({ start: s.start, end: s.end }))
                                    const uniq = new Map<string, { start: string; end: string }>()
                                    for (const s of merged) {
                                      uniq.set(`${s.start}|${s.end}`, s)
                                    }
                                    return Array.from(uniq.values()).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                                  })
                                }}
                              >
                                Ajouter au calendrier
                              </Button>

                              <div className="rounded-lg border border-gray-200 bg-white p-2 text-xs overflow-hidden dark:border-white/10 dark:bg-white/5">
                                <p className="font-semibold text-gray-700 dark:text-gray-200">Créneaux enregistrés</p>
                                <div className="mt-2 space-y-2">
                                  {availabilitySlots.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400">Aucun créneau. Ajoute une date dans le calendrier.</p>
                                  ) : (
                                    availabilitySlots.map((slot) => (
                                      <div
                                        key={`${slot.start}-${slot.end}`}
                                        className="flex min-w-0 flex-col gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 dark:border-white/10 dark:bg-white/5"
                                      >
                                        <span className="min-w-0 truncate">
                                          {formatDate(slot.start)} → {formatDate(slot.end)}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 self-end px-2 text-[11px]"
                                          onClick={() =>
                                            setAvailabilitySlots((prev) =>
                                              prev.filter((s) => !(s.start === slot.start && s.end === slot.end))
                                            )
                                          }
                                        >
                                          Retirer
                                        </Button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Zone(s) couvertes</Label>
                            <div className="flex gap-2">
                              <Input
                                value={zonesInput}
                                onChange={(e) => setZonesInput(e.target.value)}
                                placeholder="Ex: Cotonou - Fidjrossè"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const trimmed = zonesInput.trim()
                                  if (!trimmed) return
                                  setZonesList((prev) => Array.from(new Set([...prev, trimmed])))
                                  setZonesInput('')
                                }}
                              >
                                Ajouter
                              </Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {zonesList.length === 0 ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Aucune zone renseignée.</p>
                              ) : (
                                zonesList.map((zone) => (
                                  <span
                                    key={zone}
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                                  >
                                    <span className="max-w-[220px] truncate">{zone}</span>
                                    <button
                                      type="button"
                                      className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                      onClick={() => setZonesList((prev) => prev.filter((z) => z !== zone))}
                                      aria-label="Supprimer"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Astuce: tu peux laisser vide si tu veux être éligible partout.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label>Photos véhicule (URLs)</Label>
                          <div className="flex gap-2">
                            <Input
                              value={vehiclePhotosInput}
                              onChange={(e) => setVehiclePhotosInput(e.target.value)}
                              placeholder="https://..."
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const trimmed = vehiclePhotosInput.trim()
                                if (!trimmed) return
                                setVehiclePhotosList((prev) => Array.from(new Set([...prev, trimmed])))
                                setVehiclePhotosInput('')
                              }}
                            >
                              Ajouter
                            </Button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {vehiclePhotosList.length === 0 ? (
                              <p className="text-xs text-gray-500 dark:text-gray-400">Aucune URL renseignée.</p>
                            ) : (
                              vehiclePhotosList.map((url) => (
                                <span
                                  key={url}
                                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                                >
                                  <span className="max-w-[220px] truncate">{url}</span>
                                  <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={() => setVehiclePhotosList((prev) => prev.filter((v) => v !== url))}
                                    aria-label="Supprimer"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                          <div className="pt-2">
                            <UploadButtonField
                              disabled={isUploadingDriverAsset}
                              accept="image/*"
                              label={isUploadingDriverAsset ? 'Upload…' : 'Ajouter une photo véhicule'}
                              onChange={(files) => {
                                const file = files?.[0]
                                if (file) void uploadAndPersistVehiclePhoto(file)
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Taille max par image: 3 Mo.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            onClick={() => void saveDriverProfile()}
                            disabled={isSavingProfile}
                            className="h-11 bg-orange-600 text-white hover:bg-orange-700"
                          >
                            {isSavingProfile ? 'Sauvegarde…' : 'Enregistrer'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => void loadDriverProfile()}
                            disabled={isLoadingProfile}
                            className="h-11"
                          >
                            Recharger
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#0b0f19]/90">
        <div className="mx-auto grid max-w-3xl grid-cols-4 px-2 py-2">
          <TabButton
            label="Livraisons"
            icon={<Truck className="h-5 w-5" />}
            active={activeTab === 'deliveries'}
            onClick={() => setActiveTab('deliveries')}
          />
          <TabButton
            label="Chat"
            icon={<MessageCircle className="h-5 w-5" />}
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          />
          <TabButton
            label="Rapports"
            icon={<BarChart3 className="h-5 w-5" />}
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
          />
          <TabButton
            label="Paramètres"
            icon={<Settings className="h-5 w-5" />}
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </nav>
    </div>
  )
}

interface TabButtonProps {
  label: string
  icon: JSX.Element
  active: boolean
  onClick: () => void
}

/**
 * Bouton de navigation bottom tab (style app native).
 */
function TabButton({ label, icon, active, onClick }: TabButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs transition ${
        active
          ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300'
          : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </button>
  )
}
