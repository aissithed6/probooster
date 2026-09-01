"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Settings,
  BarChart3,
  Trophy,
  MapPin,
  Download,
  FileText,
  FileSpreadsheet,
  Mail,
  Edit,
  Eye,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  Star,
  Zap,
  ImageIcon,
  MessageCircle,
  RefreshCw,
  Play,
  Pause,
  StopCircle,
  Trash2,
  Gift,
  CheckCircle,
  XCircle,
  ChevronsUpDown,
  Check
} from 'lucide-react'
import { useMoney } from '@/lib/hooks/use-money'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useNotifications } from '@/components/ui/modern-notification'
import { useAuth } from '@/contexts/AuthContext'
import BoostingApproval from './boosting-approval'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  BoostingServiceManager,
  BoostingCampaignManager,
  BoostingPerformanceManager,
  PromotionManager,
  SpecialPromotionsManager,
  BoostingPricingManager,
  DEFAULT_BOOSTING_PRICING_CONFIG,
  type BoostingService,
  type BoostingCampaign,
  type BoostingPricingConfig,
  type Promotion,
  type SpecialPromotion,
  type PerformanceSummary
} from '@/lib/services/marketing-service'

const BOOSTING_PRICING_CACHE_KEY = 'boosting-pricing-config-cache'
const BOOSTING_PRICING_BROADCAST_KEY = 'boosting-pricing-config-broadcast'

type TargetingVendor = {
  id: string
  email: string | null
  display_name: string
}

type TargetingProduct = {
  id: string
  name: string
  price?: number
  vendor_id: string
  tags?: string[]
}

type MultiSelectOption = {
  id: string
  label: string
  description?: string
}

interface MultiSelectFieldProps {
  label?: string
  placeholder: string
  emptyMessage?: string
  options: MultiSelectOption[]
  selectedIds: string[]
  onChange: (next: string[]) => void
  searchPlaceholder?: string
}

/**
 * MultiSelectField affiche une liste filtrable d'options et permet une sélection multiple conviviale.
 */
const MultiSelectField = ({
  label,
  placeholder,
  emptyMessage = 'Aucun élément trouvé',
  options,
  selectedIds,
  onChange,
  searchPlaceholder
}: MultiSelectFieldProps) => {
  const [open, setOpen] = useState(false)

  const selectedLabels = useMemo(() => {
    if (!selectedIds.length) return [] as string[]

    const labelMap = new Map(options.map((option) => [option.id, option.label]))
    return selectedIds
      .map((id) => labelMap.get(id))
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  }, [selectedIds, options])

  const summaryLabel = useMemo(() => {
    if (!selectedLabels.length) return placeholder

    const MAX_LABELS = 3
    const preview = selectedLabels.slice(0, MAX_LABELS).join(', ')
    const remaining = selectedLabels.length - MAX_LABELS
    return remaining > 0 ? `${preview} +${remaining}` : preview
  }, [selectedLabels, placeholder])

  const handleToggle = (optionId: string) => {
    const alreadySelected = selectedIds.includes(optionId)
    const nextSelection = alreadySelected
      ? selectedIds.filter((id) => id !== optionId)
      : [...selectedIds, optionId]
    onChange(nextSelection)
  }

  const handleClear = () => {
    if (selectedIds.length > 0) {
      onChange([])
    }
  }

  const fallbackLabel = (label?.toLowerCase() ?? '').trim()
  const computedPlaceholder = `Rechercher ${fallbackLabel}`.trim()
  const effectiveSearchPlaceholder = searchPlaceholder ?? (computedPlaceholder.length > 0 ? computedPlaceholder : 'Rechercher')

  return (
    <div className="space-y-2">
      {label ? <Label className="text-sm font-medium">{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between overflow-hidden"
          >
            <span className="truncate text-left">{summaryLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder={effectiveSearchPlaceholder} />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandList>
              {selectedIds.length > 0 ? (
                <CommandGroup heading="Actions">
                  <CommandItem onSelect={handleClear}>Effacer la sélection</CommandItem>
                </CommandGroup>
              ) : null}
              <CommandGroup heading="Options">
                {options.map((option) => {
                  const isSelected = selectedIds.includes(option.id)
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => handleToggle(option.id)}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0 text-primary transition-opacity',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm">{option.label}</span>
                        {option.description ? (
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        ) : null}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

type CampaignTargetPage = 'home' | 'product' | 'best_sellers' | 'new_arrivals' | 'vendor' | 'deals'
type PaymentMethod = 'feexpay' | 'card' | 'manual'
type PaymentStatus = 'pending' | 'paid' | 'failed'

type NewCampaignData = {
  vendorId: string
  vendorName: string
  serviceId: string
  serviceType: BoostingCampaign['type'] | ''
  targetPages: CampaignTargetPage[]
  budget: number
  startDate: string
  endDate: string
  productId: string
  selectedProduct: string
  description: string
  aiReload: boolean
  aiReloadFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  bannerImage: File | null
  bannerTitle: string
  bannerDescription: string
  shortDescription: string
  whatsappTargetCount: number
  whatsappCountryTarget: string
  whatsappAgeTarget: string
  whatsappProfessionTarget: string
  whatsappCustomProfession: string
  whatsappMessageTitle: string
  whatsappProductDescription: string
  whatsappProductLink: string
  whatsappSenderNumber: string
  whatsappProductImage: File | null
  targetProboosterClients: boolean
  requirePayment: boolean
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
}

const clonePricingConfig = (config: BoostingPricingConfig): BoostingPricingConfig =>
  JSON.parse(JSON.stringify(config))

const INITIAL_NEW_CAMPAIGN_DATA: NewCampaignData = {
  vendorId: '',
  vendorName: '',
  serviceId: '',
  serviceType: '',
  targetPages: ['home', 'product'],
  budget: 150000,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  productId: '',
  selectedProduct: '',
  description: '',
  aiReload: false,
  aiReloadFrequency: 'daily',
  bannerImage: null,
  bannerTitle: '',
  bannerDescription: '',
  shortDescription: '',
  whatsappTargetCount: 100,
  whatsappCountryTarget: 'all',
  whatsappAgeTarget: 'all',
  whatsappProfessionTarget: 'all',
  whatsappCustomProfession: '',
  whatsappMessageTitle: '',
  whatsappProductDescription: '',
  whatsappProductLink: '',
  whatsappSenderNumber: '+229 91505757',
  whatsappProductImage: null,
  targetProboosterClients: false,
  requirePayment: false,
  paymentMethod: 'feexpay',
  paymentStatus: 'pending'
}

type BoostingServiceType = BoostingService
type BoostingCampaignType = BoostingCampaign & {
  vendorName?: string
  vendorEmail?: string
  productName?: string
  paymentStatus?: PaymentStatus
  createdAt?: string
}
type PromotionType = Promotion

export default function MarketingPromotions() {
  const { addNotification } = useNotifications()
  const { user, session } = useAuth()
  const { confirm } = useConfirm()
  const { currencyCode, formatMoney } = useMoney()
  const [activeTab, setActiveTab] = useState('overview')
  const [activeSubTab, setActiveSubTab] = useState('campaigns')
  const [campaigns, setCampaigns] = useState<BoostingCampaignType[]>([])
  const [campaignActionStates, setCampaignActionState] = useState<Record<string, 'idle' | 'loading' | 'error'>>({})
  const [services, setServices] = useState<BoostingServiceType[]>([])
  const [promotions, setPromotions] = useState<PromotionType[]>([])
  const [specialPromotions, setSpecialPromotions] = useState<SpecialPromotion[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<BoostingCampaignType | null>(null)
  const [loading, setLoading] = useState(false)
  const loadDataInFlightRef = useRef(false)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [showNewPromotionModal, setShowNewPromotionModal] = useState(false)
  const [showEditPromotionModal, setShowEditPromotionModal] = useState(false)
  const [showViewPromotionModal, setShowViewPromotionModal] = useState(false)
  const [showSpecialPromoModal, setShowSpecialPromoModal] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionType | null>(null)
  const [showBoostingModal, setShowBoostingModal] = useState(false)
  const [boostingType, setBoostingType] = useState<'recommendation' | 'banner' | 'whatsapp' | null>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('6months')
  const [analyticsData, setAnalyticsData] = useState({
    totalBoostages: 0,
    totalRevenue: 0,
    activeVendors: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
    revenueGrowth: 0,
    vendorsGrowth: 0,
    conversionGrowth: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    roas: 0,
    spend: 0,
    avgCpc: 0,
    avgCpa: 0,
    revenuePerCampaign: 0,
    conversionsPerCampaign: 0,
    totalServices: 0,
    activeServices: 0,
    activePromotions: 0,
    promotionUses: 0,
    promoOrders: 0,
    promoDiscountTotal: 0,
    totalSpecialPromotions: 0,
    activeSpecialPromotions: 0,
    expiringSpecialPromotions: 0
  })

  // Helper pour cocher/décocher un id dans un tableau
  const toggleIdIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

  const [vendors, setVendors] = useState<TargetingVendor[]>([])
  const [vendorProducts, setVendorProducts] = useState<Record<string, TargetingProduct[]>>({})
  const [showServiceConfigModal, setShowServiceConfigModal] = useState(false)
  const [showServiceDetailsModal, setShowServiceDetailsModal] = useState(false)
  const [showServiceStatsModal, setShowServiceStatsModal] = useState(false)
  const [showNewCampaignFormModal, setShowNewCampaignFormModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedService, setSelectedService] = useState<BoostingServiceType | null>(null)
  const [serviceConfig, setServiceConfig] = useState<BoostingPricingConfig>(
    clonePricingConfig(DEFAULT_BOOSTING_PRICING_CONFIG)
  )

  const showServiceConfigModalRef = useRef(false)

  useEffect(() => {
    showServiceConfigModalRef.current = showServiceConfigModal
  }, [showServiceConfigModal])
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    pricing_model: 'fixed' as BoostingServiceType['pricing_model'],
    features: [] as string[],
    is_active: true
  })
  const [serviceFeaturesInput, setServiceFeaturesInput] = useState('')
  const [serviceConfigTab, setServiceConfigTab] = useState<'recommendation' | 'banner' | 'whatsapp'>('recommendation')
  const [newCampaignData, setNewCampaignData] = useState({
    ...INITIAL_NEW_CAMPAIGN_DATA
  })
  const [exportData, setExportData] = useState({
    format: 'csv',
    dateRange: '30days',
    includePerformance: true,
    period: '6months',
    includeCharts: true,
    includeDetails: true
  })
  const [editingSpecialPromo, setEditingSpecialPromo] = useState<SpecialPromotion | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string }>>([])
  const [productVendorFilter, setProductVendorFilter] = useState<string>('all')
  const [specialProductVendorFilter, setSpecialProductVendorFilter] = useState<string>('all')

  const vendorOptions = useMemo<MultiSelectOption[]>(() => (
    vendors.map((vendor) => ({
      id: vendor.id,
      label: vendor.display_name || vendor.email || vendor.id,
      description: vendor.email ?? undefined
    }))
  ), [vendors])

  const categoryOptionList = useMemo<MultiSelectOption[]>(() => (
    categoryOptions.map((category) => ({
      id: category.id,
      label: category.name
    }))
  ), [categoryOptions])

  const productOptionList = useMemo<MultiSelectOption[]>(() => {
    const rawProducts = productVendorFilter === 'all'
      ? Object.values(vendorProducts).flat()
      : vendorProducts[productVendorFilter] ?? []

    return rawProducts.map((product) => ({
      id: product.id,
      label: product.name,
      description: vendors.find((vendor) => vendor.id === product.vendor_id)?.display_name
    }))
  }, [vendorProducts, productVendorFilter, vendors])

  const promotionTagOptions = useMemo<MultiSelectOption[]>(() => {
    const rawProducts = productVendorFilter === 'all'
      ? Object.values(vendorProducts).flat()
      : vendorProducts[productVendorFilter] ?? []

    const tagSet = new Set<string>()
    rawProducts.forEach((product) => {
      const tags = Array.isArray(product.tags) ? product.tags : []
      tags.forEach((tag) => {
        if (typeof tag === 'string' && tag.trim().length > 0) tagSet.add(tag.trim())
      })
    })

    return Array.from(tagSet)
      .sort((a, b) => a.localeCompare(b))
      .map((tag) => ({ id: tag, label: tag }))
  }, [vendorProducts, productVendorFilter])

  const specialProductOptionList = useMemo<MultiSelectOption[]>(() => {
    const rawProducts = specialProductVendorFilter === 'all'
      ? Object.values(vendorProducts).flat()
      : vendorProducts[specialProductVendorFilter] ?? []

    return rawProducts.map((product) => ({
      id: product.id,
      label: product.name,
      description: vendors.find((vendor) => vendor.id === product.vendor_id)?.display_name
    }))
  }, [vendorProducts, specialProductVendorFilter, vendors])

  const specialTagOptions = useMemo<MultiSelectOption[]>(() => {
    const rawProducts = specialProductVendorFilter === 'all'
      ? Object.values(vendorProducts).flat()
      : vendorProducts[specialProductVendorFilter] ?? []

    const tagSet = new Set<string>()
    rawProducts.forEach((product) => {
      const tags = Array.isArray(product.tags) ? product.tags : []
      tags.forEach((tag) => {
        if (typeof tag === 'string' && tag.trim().length > 0) tagSet.add(tag.trim())
      })
    })

    return Array.from(tagSet)
      .sort((a, b) => a.localeCompare(b))
      .map((tag) => ({ id: tag, label: tag }))
  }, [vendorProducts, specialProductVendorFilter])

  type SpecialTheme = 'black_friday' | 'cyber_monday' | 'boxing_day' | 'custom'
  const specialThemePresets: Record<SpecialTheme, { from: string; to: string; text: string }> = {
    black_friday: { from: '#000000', to: '#4b5563', text: '#ffffff' },
    cyber_monday: { from: '#2563eb', to: '#7c3aed', text: '#ffffff' },
    boxing_day: { from: '#ef4444', to: '#ec4899', text: '#ffffff' },
    custom: { from: '#000000', to: '#4b5563', text: '#ffffff' }
  }


  /** Formate une date en YYYY-MM-DD (heure locale) pour alimenter un input[type="date"]. */
  function formatLocalDateInputValue(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const [specialPromoForm, setSpecialPromoForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    startDate: formatLocalDateInputValue(new Date()),
    endDate: formatLocalDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    discountType: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discountValue: 0,
    sortOrder: 1,
    is_active: true,
    theme: 'black_friday' as SpecialTheme,
    gradient_from: specialThemePresets.black_friday.from,
    gradient_to: specialThemePresets.black_friday.to,
    text_color: specialThemePresets.black_friday.text,
    applicableVendors: [] as string[],
    applicableCategories: [] as string[],
    applicableProducts: [] as string[],
    applicableTags: [] as string[],
  })
  
  /** Ouvre le modal pour créer une nouvelle promotion spéciale */
  const handleOpenNewSpecialPromo = () => {
    const preset = specialThemePresets[specialPromoForm.theme]
    setEditingSpecialPromo(null)
    setSpecialPromoForm(s => ({
      ...s,
      title: '',
      subtitle: '',
      description: '',
      startDate: formatLocalDateInputValue(new Date()),
      endDate: formatLocalDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      discountType: 'percentage',
      discountValue: 0,
      sortOrder: 1,
      is_active: true,
      gradient_from: preset.from,
      gradient_to: preset.to,
      text_color: preset.text,
      applicableVendors: [],
      applicableCategories: [],
      applicableProducts: [],
      applicableTags: [],
    }))
    setSpecialProductVendorFilter('all')
    setShowSpecialPromoModal(true)
  }

  /** Active/Désactive une promotion spéciale */
  const handleToggleSpecialPromo = async (sp: SpecialPromotion) => {
    const updated = await SpecialPromotionsManager.updateSpecialPromotion(sp.id, { is_active: !sp.is_active })
    if (updated) {
      setSpecialPromotions(list => list.map(p => p.id === sp.id ? updated : p))
      addNotification({ type: 'success', title: 'Succès', message: `Promotion ${updated.is_active ? 'activée' : 'désactivée'}.` })
    }
  }

  /** Pré-remplit le formulaire et ouvre le modal d’édition d’une promotion spéciale */
  const handleEditSpecialPromo = (sp: SpecialPromotion) => {
    setEditingSpecialPromo(sp)
    setSpecialPromoForm({
      title: sp.title ?? '',
      subtitle: sp.subtitle ?? '',
      description: sp.description ?? '',
      startDate: (sp as any).start_date?.split?.('T')?.[0] ?? formatLocalDateInputValue(new Date()),
      endDate: (sp as any).end_date?.split?.('T')?.[0] ?? formatLocalDateInputValue(new Date()),
      discountType: ((sp as any).discount_type as any) ?? 'percentage',
      discountValue: Number((sp as any).discount_value ?? 0) || 0,
      sortOrder: (sp as any).sort_order ?? 1,
      is_active: !!sp.is_active,
      theme: 'custom',
      gradient_from: (sp as any).gradient_from ?? '#000000',
      gradient_to: (sp as any).gradient_to ?? '#4b5563',
      text_color: (sp as any).text_color ?? '#ffffff',
      applicableVendors: Array.isArray((sp as any).applicable_vendors) ? (sp as any).applicable_vendors : [],
      applicableCategories: Array.isArray((sp as any).applicable_categories) ? (sp as any).applicable_categories : [],
      applicableProducts: Array.isArray((sp as any).applicable_products) ? (sp as any).applicable_products : [],
      applicableTags: [],
    })
    setSpecialProductVendorFilter('all')
    setShowSpecialPromoModal(true)
  }

  /** Supprime une promotion spéciale après confirmation */
  const handleDeleteSpecialPromo = async (sp: SpecialPromotion) => {
    const accepted = await confirm({ title: 'Supprimer', message: `Supprimer "${sp.title}" ?`, confirmText: 'Supprimer', cancelText: 'Annuler', tone: 'destructive' })
    if (!accepted) return
    const ok = await SpecialPromotionsManager.deleteSpecialPromotion(sp.id)
    if (ok) {
      setSpecialPromotions(list => list.filter(p => p.id !== sp.id))
      addNotification({ type: 'success', title: 'Supprimée', message: 'Promotion spéciale supprimée.' })
    }
  }

  /** Crée ou met à jour une promotion spéciale depuis le formulaire */
  const handleSaveSpecialPromo = async () => {
    if (!specialPromoForm.title.trim() || !specialPromoForm.endDate) {
      addNotification({ type: 'error', title: 'Champs requis', message: 'Veuillez renseigner le titre et la date de fin.' })
      return
    }

    // Validations supplémentaires
    const hex = /^#([0-9a-fA-F]{6})$/
    if (!hex.test(specialPromoForm.gradient_from) || !hex.test(specialPromoForm.gradient_to) || !hex.test(specialPromoForm.text_color)) {
      addNotification({ type: 'error', title: 'Couleurs invalides', message: 'Utilisez des couleurs hexadécimales au format #RRGGBB.' })
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startStr = (specialPromoForm.startDate || formatLocalDateInputValue(new Date())).trim()
    const [startYear, startMonth, startDay] = startStr.split('-').map((v) => Number(v))
    const startLocal = new Date(startYear, (startMonth || 1) - 1, startDay || 1)
    startLocal.setHours(0, 0, 0, 0)
    if (isNaN(startLocal.getTime())) {
      addNotification({ type: 'error', title: 'Date de début invalide', message: 'La date de début doit être valide.' })
      return
    }

    const [endYear, endMonth, endDay] = specialPromoForm.endDate.split('-').map((v) => Number(v))
    const endLocal = new Date(endYear, (endMonth || 1) - 1, endDay || 1)
    if (isNaN(endLocal.getTime()) || endLocal < today) {
      addNotification({ type: 'error', title: 'Date de fin invalide', message: 'La date de fin doit être valide et postérieure ou égale à aujourd\'hui.' })
      return
    }

    const cleanSortOrder = Number.isFinite(specialPromoForm.sortOrder) && specialPromoForm.sortOrder > 0
      ? Math.floor(specialPromoForm.sortOrder)
      : 1

    const endOfDayLocal = new Date(endYear, (endMonth || 1) - 1, endDay || 1, 23, 59, 59, 999)

    const startUtcIso = new Date(Date.UTC(startYear, (startMonth || 1) - 1, startDay || 1, 0, 0, 0, 0)).toISOString()
    const endOfDayUtcIso = new Date(Date.UTC(endYear, (endMonth || 1) - 1, endDay || 1, 23, 59, 59, 999)).toISOString()

    if (startLocal.getTime() > endOfDayLocal.getTime()) {
      addNotification({ type: 'error', title: 'Dates invalides', message: 'La date de début doit être antérieure ou égale à la date de fin.' })
      return
    }

    /**
     * Convertit les tags sélectionnés en liste de produits (union) pour stockage.
     */
    const computeProductsFromTags = (selectedTags: string[], vendorFilter: string) => {
      if (!Array.isArray(selectedTags) || selectedTags.length === 0) return []
      const tagSet = new Set(selectedTags)
      const products = vendorFilter === 'all'
        ? Object.values(vendorProducts).flat()
        : (vendorProducts[vendorFilter] ?? [])
      return products
        .filter((p) => Array.isArray(p.tags) && p.tags.some((t) => tagSet.has(t)))
        .map((p) => p.id)
    }

    const resolvedTagProducts = computeProductsFromTags(specialPromoForm.applicableTags, specialProductVendorFilter)
    const resolvedProducts = Array.from(new Set([...(specialPromoForm.applicableProducts ?? []), ...resolvedTagProducts]))

    // Détection de conflits avec les promotions classiques (non-cumul)
    let finalStartIso = startUtcIso
    try {
      const authHeader = session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}
      const resp = await fetch('/api/super-admin/promotions/special-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeader as Record<string, string>) },
        body: JSON.stringify({
          start_date: finalStartIso,
          end_date: endOfDayUtcIso,
          applicable_products: resolvedProducts,
          applicable_categories: specialPromoForm.applicableCategories ?? [],
          applicable_vendors: specialPromoForm.applicableVendors ?? []
        })
      })

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '')
        console.error('Détection conflit promo spéciale (HTTP):', resp.status, errText)
        addNotification({
          type: 'warning',
          title: 'Détection de conflit indisponible',
          message: "Impossible de vérifier les conflits avec les promotions classiques pour le moment."
        })
      }

      const json = resp.ok ? await resp.json().catch(() => ({})) : {}
      const data = json?.data ?? null
      const conflictCount = Number(data?.conflictCount ?? 0) || 0
      const suggestedStartDate = typeof data?.suggestedStartDate === 'string' ? data.suggestedStartDate : null

      if (conflictCount > 0) {
        if (suggestedStartDate) {
          const suggested = new Date(suggestedStartDate)
          const suggestedLabel = Number.isNaN(suggested.getTime())
            ? suggestedStartDate
            : suggested.toLocaleDateString('fr-FR', { timeZone: 'UTC' })

          addNotification({
            type: 'warning',
            title: 'Conflit détecté',
            message: `${conflictCount} produit(s) ciblé(s) ont déjà une promotion classique active sur la période.`
          })

          const accepted = await confirm({
            title: 'Conflit avec une promotion existante',
            message: `${conflictCount} produit(s) ciblé(s) ont déjà une promotion classique active. Début conseillé: ${suggestedLabel}. Voulez-vous décaler automatiquement la date de début ?`,
            confirmText: 'Décaler',
            cancelText: 'Garder',
          })

          if (accepted) {
            finalStartIso = suggestedStartDate
            try {
              setSpecialPromoForm((prev) => ({
                ...prev,
                startDate: suggestedStartDate.split('T')[0]
              }))
            } catch {
              // silencieux
            }
          }
        } else {
          addNotification({
            type: 'warning',
            title: 'Conflit détecté',
            message: `${conflictCount} produit(s) ciblé(s) ont déjà une promotion classique active sur la période.`
          })
        }
      }
    } catch {
      // silencieux
    }

    const payload = {
      title: specialPromoForm.title.trim(),
      subtitle: specialPromoForm.subtitle?.trim() || null,
      description: specialPromoForm.description?.trim() || null,
      start_date: finalStartIso,
      end_date: endOfDayUtcIso,
      discount_type: specialPromoForm.discountType,
      discount_value: specialPromoForm.discountType === 'free_shipping' ? 0 : Number(specialPromoForm.discountValue ?? 0) || 0,
      gradient_from: specialPromoForm.gradient_from,
      gradient_to: specialPromoForm.gradient_to,
      text_color: specialPromoForm.text_color,
      is_active: !!specialPromoForm.is_active,
      sort_order: cleanSortOrder,
      created_by: user?.id ?? null,
      applicable_vendors: specialPromoForm.applicableVendors ?? [],
      applicable_categories: specialPromoForm.applicableCategories ?? [],
      applicable_products: resolvedProducts,
    } as Omit<SpecialPromotion, 'id' | 'created_at' | 'updated_at'>

    let saved: SpecialPromotion | null = null
    if (editingSpecialPromo) saved = await SpecialPromotionsManager.updateSpecialPromotion(editingSpecialPromo.id, payload as any)
    else saved = await SpecialPromotionsManager.createSpecialPromotion(payload)

    if (saved) {
      setSpecialPromotions(list => editingSpecialPromo ? list.map(p => p.id === saved!.id ? saved! : p) : [saved!, ...list])
      addNotification({ type: 'success', title: 'Enregistrée', message: 'Promotion spéciale enregistrée.' })
      setShowSpecialPromoModal(false)
      setEditingSpecialPromo(null)
      setSpecialProductVendorFilter('all')
    } else {
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible d\'enregistrer la promotion spéciale. Vérifiez la configuration Supabase/RLS.' })
    }
  }
  const [boostingForm, setBoostingForm] = useState({
    productName: '',
    productDescription: '',
    targetAudience: {
      countries: [] as string[],
      ageRange: '',
      professions: [] as string[],
      interests: [] as string[]
    },
    budget: 0,
    startDate: '',
    endDate: '',
    messageContent: '',
    targetCustomProfession: ''
  })
  const [whatsappCustomProfession, setWhatsappCustomProfession] = useState('')
  const [targetCustomProfession, setTargetCustomProfession] = useState('')
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('campaigns')
  

  // Nouvel état pour le modal de détails de campagne
  const [showCampaignDetailsModal, setShowCampaignDetailsModal] = useState(false)

  // États pour les modals de promotion
  const [promotionForm, setPromotionForm] = useState({
    name: '',
    type: 'code' as 'code' | 'reduction' | 'flash' | 'bundle',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discountValue: 0,
    startDate: '',
    endDate: '',
    minAmount: 0,
    usageLimit: 100,
    conditions: '',
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discount_value: 0,
    maxDiscount: 0,
    usage_limit_per_user: 1,
    targetAudience: [] as string[],
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
    applicableVendors: [] as string[],
    applicableTags: [] as string[],
    isAutoApply: false
  })

  /**
   * Charge les vendeurs et leurs produits afin d'alimenter les sections de ciblage.
   */
  const loadTargetingData = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/promotions/targeting')
      if (!response.ok) {
        console.error('Échec chargement ciblage (HTTP)', response.status)
        setVendors([])
        setVendorProducts({})
        return
      }

      const json = await response.json().catch(() => ({}))
      const payload = json?.data ?? {}

      const vendorsPayload = Array.isArray(payload?.vendors) ? payload.vendors : []
      const vendorSummaries: TargetingVendor[] = vendorsPayload
        .filter((item: any) => item && typeof item.id === 'string')
        .map((item: any) => ({
          id: item.id,
          email: typeof item.email === 'string' ? item.email : null,
          display_name: typeof item.display_name === 'string' && item.display_name.trim().length > 0
            ? item.display_name.trim()
            : (typeof item.email === 'string' && item.email.trim().length > 0 ? item.email.trim() : item.id)
        }))

      const vendorProductsPayload = payload?.vendorProducts && typeof payload.vendorProducts === 'object'
        ? payload.vendorProducts
        : {}

      const normalizedProducts = Object.entries(vendorProductsPayload).reduce<Record<string, TargetingProduct[]>>((acc, [vendorId, items]) => {
        if (!Array.isArray(items) || !vendorId) return acc

        acc[vendorId] = items
          .filter((item: any) => item && typeof item.id === 'string')
          .map((item: any) => ({
            id: item.id,
            name: typeof item.name === 'string' && item.name.trim().length > 0 ? item.name.trim() : `Produit ${item.id}`,
            vendor_id: typeof item.vendor_id === 'string' ? item.vendor_id : vendorId,
            tags: Array.isArray(item.tags)
              ? item.tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
              : []
          }))
        return acc
      }, {})

      setVendors(vendorSummaries)
      setVendorProducts(normalizedProducts)
    } catch (error) {
      console.error('Erreur chargement données de ciblage :', error)
      setVendors([])
      setVendorProducts({})
    }
  }, [])

  // Charger les catégories lorsque l'un des modals de promotion est ouvert
  useEffect(() => {
    if (!(showNewPromotionModal || showEditPromotionModal || showSpecialPromoModal)) {
      return
    }

    let isMounted = true

    const loadCategories = async () => {
      try {
        const resp = await fetch('/api/catalog/categories')
        if (!resp.ok) return
        const json = await resp.json()
        const items = Array.isArray(json?.data?.items) ? json.data.items : []
        if (isMounted) {
          setCategoryOptions(items.map((c: any) => ({ id: c.id, name: c.name })))
        }
      } catch {
        void 0
      }
    }

    void loadCategories()

    return () => {
      isMounted = false
    }
  }, [showNewPromotionModal, showEditPromotionModal, showSpecialPromoModal])

  useEffect(() => {
    if (showNewPromotionModal || showEditPromotionModal) {
      setProductVendorFilter('all')
    }
  }, [showNewPromotionModal, showEditPromotionModal])

  useEffect(() => {
    if (
      (showNewPromotionModal || showEditPromotionModal || showSpecialPromoModal) &&
      (vendors.length === 0 || Object.keys(vendorProducts).length === 0)
    ) {
      void loadTargetingData()
    }
  }, [showNewPromotionModal, showEditPromotionModal, showSpecialPromoModal, vendors.length, vendorProducts, loadTargetingData])

  // Fonction utilitaire pour mapper le type du formulaire vers l'API Supabase
  const mapPromotionType = (type: typeof promotionForm.type): 'coupon' | 'discount' | 'flash_sale' | 'bundle' => {
    switch (type) {
      case 'code':
        return 'coupon'
      case 'reduction':
        return 'discount'
      case 'flash':
        return 'flash_sale'
      default:
        return 'bundle'
    }
  }

  // Fonction utilitaire pour valider les champs obligatoires du formulaire de promotion
  const validatePromotionForm = () => {
    const trimmedName = promotionForm.name.trim()
    if (!trimmedName) {
      addNotification({
        type: 'error',
        title: 'Nom requis',
        message: 'Veuillez saisir un nom pour la promotion.',
        duration: 4000
      })
      return false
    }

    if (promotionForm.type === 'code' && !promotionForm.code.trim()) {
      addNotification({
        type: 'error',
        title: 'Code requis',
        message: 'Un code promo est obligatoire pour ce type de promotion.',
        duration: 4000
      })
      return false
    }

    if (!promotionForm.startDate || !promotionForm.endDate) {
      addNotification({
        type: 'error',
        title: 'Dates requises',
        message: 'Veuillez définir une date de début et une date de fin.',
        duration: 4000
      })
      return false
    }

    if (new Date(promotionForm.endDate) < new Date(promotionForm.startDate)) {
      addNotification({
        type: 'error',
        title: 'Période invalide',
        message: 'La date de fin doit être postérieure ou égale à la date de début.',
        duration: 4000
      })
      return false
    }

    if (promotionForm.discountType !== 'free_shipping' && promotionForm.discountValue <= 0) {
      addNotification({
        type: 'error',
        title: 'Valeur de réduction invalide',
        message: 'Saisissez une valeur de réduction supérieure à 0.',
        duration: 4000
      })
      return false
    }

    if (promotionForm.usageLimit <= 0) {
      addNotification({
        type: 'error',
        title: 'Limite d\'utilisation invalide',
        message: 'La limite d\'utilisation doit être supérieure à 0.',
        duration: 4000
      })
      return false
    }

    return true
  }

  // Fonction utilitaire pour construire le payload de création de promotion
  const buildPromotionPayload = () => ({
    name: promotionForm.name.trim(),
    code: promotionForm.code.trim() ? promotionForm.code.trim() : null,
    type: mapPromotionType(promotionForm.type),
    discount_type: promotionForm.discountType,
    discount_value: promotionForm.discountType === 'free_shipping' ? 0 : promotionForm.discountValue,
    start_date: promotionForm.startDate,
    end_date: promotionForm.endDate,
    applicable_products: (() => {
      const selectedTags = Array.isArray(promotionForm.applicableTags) ? promotionForm.applicableTags : []
      if (selectedTags.length === 0) return promotionForm.applicableProducts ?? []

      const tagSet = new Set(selectedTags)
      const products = productVendorFilter === 'all'
        ? Object.values(vendorProducts).flat()
        : (vendorProducts[productVendorFilter] ?? [])
      const fromTags = products
        .filter((p) => Array.isArray(p.tags) && p.tags.some((t) => tagSet.has(t)))
        .map((p) => p.id)
      return Array.from(new Set([...(promotionForm.applicableProducts ?? []), ...fromTags]))
    })(),
    applicable_categories: promotionForm.applicableCategories ?? [],
    applicable_vendors: promotionForm.applicableVendors ?? [],
    usage_limit: promotionForm.usageLimit
  })

  // Fonction utilitaire pour construire l'objet d\'édition d\'une promotion
  const buildPromotionUpdates = (): Partial<PromotionType> => ({
    name: promotionForm.name.trim(),
    code: promotionForm.code.trim() ? promotionForm.code.trim() : null,
    discount_type: promotionForm.discountType,
    discount_value: promotionForm.discountType === 'free_shipping' ? 0 : promotionForm.discountValue,
    start_date: promotionForm.startDate,
    end_date: promotionForm.endDate,
    min_order_amount: promotionForm.minAmount || null,
    max_discount: promotionForm.maxDiscount || null,
    usage_limit: promotionForm.usageLimit,
    applicable_products: (() => {
      const selectedTags = Array.isArray(promotionForm.applicableTags) ? promotionForm.applicableTags : []
      if (selectedTags.length === 0) return promotionForm.applicableProducts ?? []

      const tagSet = new Set(selectedTags)
      const products = productVendorFilter === 'all'
        ? Object.values(vendorProducts).flat()
        : (vendorProducts[productVendorFilter] ?? [])
      const fromTags = products
        .filter((p) => Array.isArray(p.tags) && p.tags.some((t) => tagSet.has(t)))
        .map((p) => p.id)
      return Array.from(new Set([...(promotionForm.applicableProducts ?? []), ...fromTags]))
    })(),
    description: promotionForm.description || null,
    target_audience: promotionForm.targetAudience ?? [],
    applicable_categories: promotionForm.applicableCategories ?? [],
    applicable_vendors: promotionForm.applicableVendors ?? [],
    is_auto_apply: promotionForm.isAutoApply ?? false
  })

  // État pour le calcul des coûts
  const [costCalculation, setCostCalculation] = useState({
    days: 7,
    pages: 3,
    whatsappTargets: 100
  })

  // Chargement périodique des données
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!isMounted) return
      await loadData(false)
    }

    loadData()

    const intervalId = window.setInterval(fetchData, 60_000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    /**
     * Lit la configuration Boostage Pro depuis le cache localStorage (si disponible).
     */
    const readCachedPricingConfig = (): BoostingPricingConfig | null => {
      try {
        const raw = window.localStorage.getItem(BOOSTING_PRICING_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const candidate = parsed?.config ?? parsed
        if (!candidate || typeof candidate !== 'object') return null
        return clonePricingConfig(candidate as BoostingPricingConfig)
      } catch {
        return null
      }
    }

    /**
     * Applique la configuration reçue (événement) au state local.
     */
    const handleConfigUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ config?: BoostingPricingConfig }>
      const next = customEvent?.detail?.config
      if (next) {
        if (showServiceConfigModalRef.current) return
        setServiceConfig(clonePricingConfig(next))
      }
    }

    /**
     * Réagit aux mises à jour depuis d'autres onglets (storage event).
     */
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== BOOSTING_PRICING_BROADCAST_KEY) return
      if (showServiceConfigModalRef.current) return
      const cached = readCachedPricingConfig()
      if (cached) {
        setServiceConfig(cached)
        return
      }

      BoostingPricingManager.getConfig()
        .then((config) => setServiceConfig(clonePricingConfig(config)))
        .catch(() => null)
    }

    window.addEventListener('boosting-pricing-config-updated', handleConfigUpdated)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('boosting-pricing-config-updated', handleConfigUpdated)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Recalculer les analytics quand les données changent
  useEffect(() => {
    updateAnalyticsData(analyticsPeriod)
  }, [campaigns, promotions, specialPromotions, services, analyticsPeriod, session])

  // Charger les données depuis Supabase
  const loadData = async (showNotification: boolean = true) => {
    if (loadDataInFlightRef.current) return
    loadDataInFlightRef.current = true
    if (showNotification) setLoading(true)
    try {
      // Charger les services
      const servicesData = await BoostingServiceManager.getAllServices()
      setServices(servicesData)

      // Charger les campagnes
      const campaignsData = await BoostingCampaignManager.getAllCampaigns()
      setCampaigns(campaignsData)

      // Charger les promotions
      const promotionsData = await PromotionManager.getAllPromotions()
      setPromotions(promotionsData)

      // Charger les promotions spéciales
      const specials = await SpecialPromotionsManager.getAllSpecialPromotions()
      setSpecialPromotions(specials)

      // Charger les vendeurs et produits pour le ciblage
      await loadTargetingData()

      // Charger la configuration des tarifs Boostage Pro
      const pricingConfig = await BoostingPricingManager.getConfig()
      if (!showServiceConfigModalRef.current) {
        setServiceConfig(clonePricingConfig(pricingConfig))
      }

      if (showNotification) {
        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Données chargées avec succès'
        })
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
      if (showNotification) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Erreur lors du chargement des données'
        })
      }
    } finally {
      if (showNotification) setLoading(false)
      loadDataInFlightRef.current = false
    }
  }

  // Fonction loadMockData supprimée - Les données viennent maintenant de Supabase via loadData()

  // ============================================
  // FONCTIONS DE GESTION DES SERVICES
  // ============================================

  const handleCreateService = async (serviceData: {
    name: string
    description: string
    type: 'recommendation' | 'banner' | 'whatsapp'
    base_price: number
    pricing_model: 'per_page_day' | 'per_message_country' | 'fixed'
    features: string[]
  }) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Vous devez être connecté pour créer un service'
      })
      return
    }

    setLoading(true)
    try {
      const newService = await BoostingServiceManager.createService(
        {
          ...serviceData,
          is_active: true,
          pending_deactivation: false,
          pending_deactivation_at: null,
          pending_deactivation_reason: null,
          created_by: user.id
        },
        user.id
      )

      if (newService) {
        setServices([...services, newService])
        addNotification({
          type: 'success',
          title: 'Service Créé',
          message: 'Le service de boostage a été créé avec succès'
        })
        setShowServiceConfigModal(false)
      }
    } catch (error) {
      console.error('Erreur création service:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création du service'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateService = async (
    serviceId: string,
    updates: Partial<BoostingServiceType>
  ) => {
    setLoading(true)
    try {
      const updated = await BoostingServiceManager.updateService(serviceId, updates)
      
      if (updated) {
        setServices(services.map(s => s.id === serviceId ? updated : s))
        addNotification({
          type: 'success',
          title: 'Service Mis à Jour',
          message: 'Le service a été mis à jour avec succès'
        })
      }
    } catch (error) {
      console.error('Erreur mise à jour service:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour du service'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    const accepted = await confirm({
      title: 'Supprimer le service',
      message: 'Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return

    setLoading(true)
    try {
      const success = await BoostingServiceManager.updateService(serviceId, { is_active: false })
      
      if (success) {
        setServices(services.filter(s => s.id !== serviceId))
        addNotification({
          type: 'success',
          title: 'Service Supprimé',
          message: 'Le service a été supprimé avec succès'
        })
      }
    } catch (error) {
      console.error('Erreur suppression service:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression du service'
      })
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FONCTIONS DE GESTION DES CAMPAGNES
  // ============================================

  /**
   * Supprime une campagne (après confirmation) et recharge la liste.
   */
  const handleCampaignDelete = async (campaignId: string) => {
    const accepted = await confirm({
      title: 'Supprimer la campagne',
      message: 'Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })

    if (!accepted) return

    setLoading(true)
    try {
      const success = await BoostingCampaignManager.deleteCampaign(campaignId)
      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne Supprimée',
          message: 'La campagne a été supprimée avec succès'
        })
        void loadData(false)
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de supprimer la campagne. Vérifiez vos droits et réessayez.'
        })
      }
    } catch (error) {
      console.error('Erreur suppression campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression de la campagne'
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Désapprouve une campagne approuvée (Super Admin) et la repasse en attente.
   */
  const handleCampaignDisapprove = async (campaignId: string) => {
    const accepted = await confirm({
      title: 'Désapprouver la campagne',
      message: 'Voulez-vous désapprouver cette campagne ? Elle repassera en attente de validation.',
      confirmText: 'Désapprouver',
      cancelText: 'Annuler',
      tone: 'destructive'
    })

    if (!accepted) return

    setLoading(true)
    try {
      const success = await BoostingCampaignManager.disapproveAsSuperAdmin(campaignId)
      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne Désapprouvée',
          message: 'La campagne a été repassée en attente avec succès'
        })
        void loadData(false)
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de désapprouver la campagne. Veuillez réessayer.'
        })
      }
    } catch (error) {
      console.error('Erreur désapprobation campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la désapprobation de la campagne'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignApproval = async (campaignId: string) => {
    const snapshot = campaigns.map((c) => ({ ...c }))
    setLoading(true)
    try {
      setCampaignActionState(campaignId, 'loading')
      const success = await BoostingCampaignManager.approveAsSuperAdmin(campaignId, user?.id)

      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne Approuvée',
          message: 'La campagne de boostage a été approuvée et activée'
        })
        void loadData(false)
      } else {
        setCampaigns(snapshot)
        setCampaignActionState(campaignId, 'error')
        addNotification({
          type: 'error',
          title: "Échec de l'approbation",
          message: "L'approbation n'a pas abouti. Veuillez réessayer."
        })
      }
    } catch (error) {
      console.error('Erreur approbation campagne:', error)
      setCampaigns(snapshot)
      setCampaignActionState(campaignId, 'error')
      addNotification({
        type: 'error',
        title: "Échec de l'approbation",
        message: error instanceof Error ? error.message : "Une erreur est survenue lors de l'approbation de la campagne."
      })
    } finally {
      setCampaignActionState(campaignId, 'idle')
      setLoading(false)
    }
  }

  const handleCampaignRejection = async (campaignId: string, reason: string) => {
    const snapshot = campaigns.map((c) => ({ ...c }))
    setLoading(true)
    try {
      setCampaignActionState(campaignId, 'loading')
      const success = await BoostingCampaignManager.rejectCampaign(campaignId, reason)

      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne Rejetée',
          message: 'La campagne a été rejetée avec succès'
        })
        void loadData(false)
      } else {
        setCampaigns(snapshot)
        setCampaignActionState(campaignId, 'error')
        addNotification({
          type: 'error',
          title: "Échec du rejet",
          message: "Le rejet de la campagne n'a pas abouti. Veuillez réessayer."
        })
      }
    } catch (error) {
      console.error('Erreur rejet campagne:', error)
      setCampaigns(snapshot)
      setCampaignActionState(campaignId, 'error')
      addNotification({
        type: 'error',
        title: "Échec du rejet",
        message: error instanceof Error ? error.message : "Une erreur est survenue lors du rejet de la campagne."
      })
    } finally {
      setCampaignActionState(campaignId, 'idle')
      setLoading(false)
    }
  }

  const handleCampaignStatusChange = async (campaignId: string, newStatus: 'active' | 'paused' | 'completed') => {
    const snapshot = campaigns.map((c) => ({ ...c }))
    setLoading(true)
    try {
      setCampaignActionState(campaignId, 'loading')
      const success = await BoostingCampaignManager.setCampaignStatus(campaignId, newStatus)

      if (success) {
        setCampaigns((prev) =>
          prev.map((item) =>
            item.id === campaignId
              ? {
                  ...item,
                  status: newStatus,
                  end_date: newStatus === 'completed' ? new Date().toISOString() : item.end_date
                }
              : item
          )
        )
        addNotification({
          type: 'success',
          title: 'Statut Modifié',
          message: `La campagne a été ${newStatus === 'paused' ? 'mise en pause' : newStatus === 'completed' ? 'terminée' : 'reprise'}`
        })
        void loadData(false)
      } else {
        setCampaigns(snapshot)
        setCampaignActionState(campaignId, 'error')
        addNotification({
          type: 'error',
          title: 'Échec de la mise à jour',
          message: 'Impossible de mettre à jour le statut de la campagne.'
        })
      }
    } catch (error) {
      console.error('Erreur statut campagne:', error)
      setCampaigns(snapshot)
      setCampaignActionState(campaignId, 'error')
      addNotification({
        type: 'error',
        title: 'Échec de la mise à jour',
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la modification du statut.'
      })
    } finally {
      setCampaignActionState(campaignId, 'idle')
      setLoading(false)
    }
  }

  // ============================================
  // FONCTIONS DE GESTION DES PROMOTIONS
  // ============================================

  const handleCreatePromotion = async (promotionData: {
    name: string
    code: string | null
    type: 'coupon' | 'discount' | 'flash_sale' | 'bundle'
    discount_type: 'percentage' | 'fixed' | 'free_shipping'
    discount_value: number
    start_date: string
    end_date: string
    applicable_products: string[]
    applicable_categories?: string[]
    applicable_vendors?: string[]
    usage_limit: number
  }) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Vous devez être connecté pour créer une promotion'
      })
      return
    }

    setLoading(true)
    try {
      const newPromotion = await PromotionManager.createPromotion(
        {
          ...promotionData,
          status: 'draft',
          target_audience: [],
          applicable_categories: promotionData.applicable_categories ?? [],
          applicable_vendors: promotionData.applicable_vendors ?? [],
          is_auto_apply: false,
          description: null,
          min_order_amount: null,
          max_discount: null,
          usage_limit_per_user: 1,
          vendor_id: null,
          created_by: user.id
        },
        user.id
      )

      if (newPromotion) {
        setPromotions([...promotions, newPromotion])
        addNotification({
          type: 'success',
          title: 'Promotion Créée',
          message: 'La promotion a été créée avec succès'
        })
        setShowNewPromotionModal(false)
        resetPromotionForm()
      }
    } catch (error) {
      console.error('Erreur création promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création de la promotion'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePromotion = async (
    promotionId: string,
    updates: Partial<PromotionType>
  ) => {
    if (!validatePromotionForm()) {
      return
    }

    setLoading(true)
    try {
      const updated = await PromotionManager.updatePromotion(promotionId, updates)
      
      if (updated) {
        setPromotions(promotions.map(p => p.id === promotionId ? updated : p))
        addNotification({
          type: 'success',
          title: 'Promotion Mise à Jour',
          message: 'La promotion a été mise à jour avec succès'
        })
        setShowEditPromotionModal(false)
        setSelectedPromotion(null)
        resetPromotionForm()
      }
    } catch (error) {
      console.error('Erreur mise à jour promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour de la promotion'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePromotion = async (promotionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    setLoading(true)
    try {
      const updated = await PromotionManager.updatePromotion(promotionId, {
        status: newStatus as any
      })
      
      if (updated) {
        setPromotions(promotions.map(p => p.id === promotionId ? updated : p))
        addNotification({
          type: 'success',
          title: 'Statut Modifié',
          message: `Promotion ${newStatus === 'active' ? 'activée' : 'désactivée'}`
        })
      }
    } catch (error) {
      console.error('Erreur toggle promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la modification du statut'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePromotion = async (promotionId: string) => {
    const accepted = await confirm({
      title: 'Supprimer la promotion',
      message: 'Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return

    setLoading(true)
    try {
      const success = await PromotionManager.deletePromotion(promotionId)
      
      if (success) {
        setPromotions(promotions.filter(p => p.id !== promotionId))
        addNotification({
          type: 'success',
          title: 'Promotion Supprimée',
          message: 'La promotion a été supprimée avec succès'
        })
      }
    } catch (error) {
      console.error('Erreur suppression promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression de la promotion'
      })
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour ouvrir le modal de détails de campagne
  const handleViewCampaignDetails = (campaign: BoostingCampaign) => {
    setSelectedCampaign(campaign)
    setShowCampaignDetailsModal(true)
  }

  // Fonction de formatage des prix
  const formatPrice = (price: number) => {
    return formatMoney(price)
  }

  const getServiceStartingPrice = (service: BoostingServiceType) => {
    switch (service.type) {
      case 'recommendation':
        return formatPrice(serviceConfig.recommendation.homePage)
      case 'banner': {
        const recommendationBase = serviceConfig.recommendation.homePage
        const estimatedBannerCost = Math.max(
          0,
          Math.round(recommendationBase * serviceConfig.banner.multiplier + serviceConfig.banner.animationFee)
        )
        return formatPrice(estimatedBannerCost)
      }
      case 'whatsapp':
        return formatPrice(serviceConfig.whatsapp.baseCost)
      default:
        return formatPrice(service.base_price)
    }
  }

  const renderServicePricingDetails = (service: BoostingServiceType) => {
    if (service.type === 'recommendation') {
      return (
        <div className="pt-3 space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Page d'accueil</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.recommendation.homePage)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Page produit</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.recommendation.productPage)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Meilleures ventes</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.recommendation.bestSellers)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Nouvelles arrivées</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.recommendation.newArrivals)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Page vendeur</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.recommendation.vendorPage)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-blue-700">
            <span>Réduction multi-pages</span>
            <span className="font-semibold">{serviceConfig.recommendation.multiPageDiscount}%</span>
          </div>
        </div>
      )
    }

    if (service.type === 'banner') {
      const recommendationBase = serviceConfig.recommendation.homePage
      const estimatedBannerCost = Math.max(
        0,
        Math.round(recommendationBase * serviceConfig.banner.multiplier + serviceConfig.banner.animationFee)
      )

      return (
        <div className="pt-3 space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Coût estimé / jour</span>
            <span className="font-semibold text-gray-900">{formatPrice(estimatedBannerCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Multiplicateur</span>
            <span className="font-semibold text-gray-900">×{serviceConfig.banner.multiplier}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Frais animation</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.banner.animationFee)}</span>
          </div>
        </div>
      )
    }

    if (service.type === 'whatsapp') {
      return (
        <div className="pt-3 space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Coût base / msg</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.whatsapp.baseCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Majoration pays</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.whatsapp.countryCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Majoration âge</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.whatsapp.ageCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Majoration profession</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.whatsapp.professionCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Ciblage Probooster</span>
            <span className="font-semibold text-gray-900">{formatPrice(serviceConfig.whatsapp.proboosterCost)}</span>
          </div>
        </div>
      )
    }

    return null
  }

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary', text: 'En Attente', color: 'bg-yellow-100 text-yellow-800' },
      active: { variant: 'default', text: 'Active', color: 'bg-green-100 text-green-800' },
      paused: { variant: 'secondary', text: 'En Pause', color: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'default', text: 'Terminée', color: 'bg-gray-100 text-gray-800' },
      rejected: { variant: 'destructive', text: 'Rejetée', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge variant={config.variant as any} className={config.color}>
        {config.text}
      </Badge>
    )
  }

  // Fonction pour mettre à jour les données d'analytics
  const updateAnalyticsData = async (period: string) => {
    try {
      const authHeader = session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}
      const resp = await fetch(`/api/super-admin/marketing/analytics?period=${encodeURIComponent(period)}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          ...(authHeader as Record<string, string>)
        },
        cache: 'no-store'
      }).catch(() => null)

      if (!resp || !resp.ok) {
        return
      }

      const json = await resp.json().catch(() => ({}))
      const data = (json as any)?.data
      if (!data) return

      const boosting = data?.boosting ?? {}
      const servicesStats = data?.services ?? {}
      const promotionsStats = data?.promotions ?? {}
      const specialStats = data?.specialPromotions ?? {}

      setAnalyticsData((prev) => ({
        ...prev,
        totalBoostages: Number(boosting?.totalBoostages ?? 0) || 0,
        totalRevenue: Number(boosting?.revenue ?? 0) || 0,
        activeVendors: Number(boosting?.activeVendors ?? 0) || 0,
        conversionRate: Number(boosting?.conversionRate ?? 0) || 0,
        impressions: Number(boosting?.impressions ?? 0) || 0,
        clicks: Number(boosting?.clicks ?? 0) || 0,
        conversions: Number(boosting?.conversions ?? 0) || 0,
        roas: Number(boosting?.roas ?? 0) || 0,
        spend: Number(boosting?.spend ?? 0) || 0,
        avgCpc: Number(boosting?.avgCpc ?? 0) || 0,
        avgCpa: Number(boosting?.avgCpa ?? 0) || 0,
        revenuePerCampaign: Number(boosting?.revenuePerCampaign ?? 0) || 0,
        conversionsPerCampaign: Number(boosting?.conversionsPerCampaign ?? 0) || 0,
        totalServices: Number(servicesStats?.totalServices ?? 0) || 0,
        activeServices: Number(servicesStats?.activeServices ?? 0) || 0,
        activePromotions: Number(promotionsStats?.activePromotions ?? 0) || 0,
        promotionUses: Number(promotionsStats?.promotionUses ?? 0) || 0,
        promoOrders: Number(promotionsStats?.promoOrders ?? 0) || 0,
        promoDiscountTotal: Number(promotionsStats?.promoDiscountTotal ?? 0) || 0,
        totalSpecialPromotions: Number(specialStats?.totalSpecialPromotions ?? 0) || 0,
        activeSpecialPromotions: Number(specialStats?.activeSpecialPromotions ?? 0) || 0,
        expiringSpecialPromotions: Number(specialStats?.expiringSpecialPromotions ?? 0) || 0
      }))
    } catch (error) {
      console.warn('updateAnalyticsData failed:', error)
    }
  }
  
  // Fonction pour formater les grands nombres
  const formatNumber = (value: number | null | undefined) => {
    const num = typeof value === 'number' && !Number.isNaN(value) ? value : 0

    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M'
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const boostTypes = ['recommendation', 'banner', 'whatsapp'] as const
  type BoostType = typeof boostTypes[number]

  const boostTypeMeta: Record<BoostType, { label: string; color: string }> = {
    recommendation: { label: 'Recommandation Ciblée', color: 'bg-blue-500' },
    banner: { label: 'Bannière Visuelle', color: 'bg-green-500' },
    whatsapp: { label: 'WhatsApp Marketing', color: 'bg-orange-500' }
  }

  const analyticsBounds = useMemo(() => {
    const end = new Date()
    const start = new Date(end.getTime())

    if (analyticsPeriod === '1month') start.setMonth(end.getMonth() - 1)
    else if (analyticsPeriod === '3months') start.setMonth(end.getMonth() - 3)
    else if (analyticsPeriod === '6months') start.setMonth(end.getMonth() - 6)
    else start.setFullYear(end.getFullYear() - 1)

    return { start, end }
  }, [analyticsPeriod])

  const campaignsForAnalytics = useMemo(() => {
    const startMs = analyticsBounds.start.getTime()
    const endMs = analyticsBounds.end.getTime()

    return campaigns.filter((campaign) => {
      const sourceDate = campaign.start_date || campaign.created_at
      if (!sourceDate) return false
      const parsed = new Date(sourceDate)
      if (Number.isNaN(parsed.getTime())) return false
      const ms = parsed.getTime()
      return ms >= startMs && ms <= endMs
    })
  }, [campaigns, analyticsBounds])

  const campaignTypeStats = useMemo(() => {
    const typeSet = new Set<BoostType>()
    services.forEach((service) => typeSet.add(service.type))
    campaignsForAnalytics.forEach((campaign) => typeSet.add(campaign.type))

    if (typeSet.size === 0) {
      boostTypes.forEach((type) => typeSet.add(type))
    }

    const totalCampaigns = campaignsForAnalytics.length
    const counts: Record<BoostType, number> = { recommendation: 0, banner: 0, whatsapp: 0 }
    const revenues: Record<BoostType, number> = { recommendation: 0, banner: 0, whatsapp: 0 }

    campaignsForAnalytics.forEach((campaign) => {
      counts[campaign.type] += 1
      revenues[campaign.type] += campaign.total_cost || 0
    })

    const rows = Array.from(typeSet).map((type) => ({
      type,
      count: counts[type],
      revenue: revenues[type],
      percentage: totalCampaigns > 0 ? parseFloat(((counts[type] / totalCampaigns) * 100).toFixed(1)) : 0
    }))

    rows.sort((a, b) => b.count - a.count)

    return {
      total: totalCampaigns,
      rows
    }
  }, [campaignsForAnalytics, services])

  const monthlyBoostingStats = useMemo(() => {
    const periodMap: Record<string, number> = {
      '1month': 1,
      '3months': 3,
      '6months': 6,
      '1year': 6
    }

    const monthsToDisplay = periodMap[analyticsPeriod] ?? 6
    const now = new Date()
    const stats: { label: string; count: number }[] = []
    const campaignByMonth: Record<string, number> = {}

    campaignsForAnalytics.forEach((campaign) => {
      const sourceDate = campaign.start_date || campaign.created_at
      if (!sourceDate) return
      const parsed = new Date(sourceDate)
      if (Number.isNaN(parsed.getTime())) return
      const key = `${parsed.getFullYear()}-${parsed.getMonth()}`
      campaignByMonth[key] = (campaignByMonth[key] || 0) + 1
    })

    for (let i = monthsToDisplay - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      stats.push({
        label: date.toLocaleDateString('fr-FR', { month: 'short' }),
        count: campaignByMonth[key] || 0
      })
    }

    return stats
  }, [campaignsForAnalytics, analyticsPeriod])

  const monthlyBoostingMax = useMemo(() => {
    return monthlyBoostingStats.reduce((max, item) => Math.max(max, item.count), 0)
  }, [monthlyBoostingStats])

  const monthlyBoostingLabel = useMemo(() => {
    return monthlyBoostingStats.length > 1 ? `${monthlyBoostingStats.length} mois` : '1 mois'
  }, [monthlyBoostingStats])

  const topVendors = useMemo(() => {
    const vendorMap = new Map<
      string,
      {
        vendorId: string
        vendorName: string
        boostages: number
        revenue: number
        clicks: number
        conversions: number
      }
    >()

    campaignsForAnalytics.forEach((campaign) => {
      const vendorId = campaign.vendor_id || campaign.vendorName || campaign.id
      const vendorName = campaign.vendorName || 'Vendeur inconnu'
      if (!vendorId) return

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendorId,
          vendorName,
          boostages: 0,
          revenue: 0,
          clicks: 0,
          conversions: 0
        })
      }

      const entry = vendorMap.get(vendorId)!
      entry.boostages += 1
      entry.revenue += campaign.total_cost || 0

      if (campaign.performance) {
        entry.clicks += campaign.performance.clicks || 0
        entry.conversions += campaign.performance.conversions || 0
      }
    })

    const rows = Array.from(vendorMap.values()).map((entry) => {
      const conversionRate = entry.clicks > 0 ? parseFloat(((entry.conversions / entry.clicks) * 100).toFixed(1)) : 0
      let performanceLabel = 'N/A'
      if (conversionRate >= 25) performanceLabel = 'Excellent'
      else if (conversionRate >= 15) performanceLabel = 'Très Bien'
      else if (conversionRate >= 10) performanceLabel = 'Bien'
      else if (conversionRate > 0) performanceLabel = 'À améliorer'

      return {
        ...entry,
        conversionRate,
        performanceLabel
      }
    })

    rows.sort((a, b) => b.revenue - a.revenue)

    return rows.slice(0, 10)
  }, [campaignsForAnalytics])

  const getPerformanceBadgeVariant = (label: string) => {
    switch (label) {
      case 'Excellent':
        return 'default'
      case 'Très Bien':
        return 'secondary'
      case 'Bien':
        return 'outline'
      case 'À améliorer':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Fonction pour générer et télécharger un rapport PDF
  const handleExportPDF = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Génération PDF en cours...',
        message: 'Veuillez patienter pendant la génération du rapport.',
        duration: 3000
      })

      // Simulation de génération PDF
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer le contenu du PDF
      const pdfContent = `
        RAPPORT MENSUEL MARKETING - ${new Date().toLocaleDateString('fr-FR')}
        
        MÉTRIQUES PRINCIPALES:
        - Total Boostages: ${analyticsData.totalBoostages}
        - Revenus Totaux: ${formatPrice(analyticsData.totalRevenue)}
        - Vendeurs Actifs: ${analyticsData.activeVendors}
        - Taux de Conversion: ${analyticsData.conversionRate}%
        - ROAS: ${analyticsData.roas}
        - CPI moyen: ${formatPrice(analyticsData.avgCpc)}
        - CPA moyen: ${formatPrice(analyticsData.avgCpa)}
        - Revenu moyen par campagne: ${formatPrice(analyticsData.revenuePerCampaign)}
        - Conversions moyennes par campagne: ${analyticsData.conversionsPerCampaign}
        - Impressions: ${formatNumber(analyticsData.impressions)}
        - Clics: ${formatNumber(analyticsData.clicks)}
        - Conversions totales: ${analyticsData.conversions}
        
        PÉRIODE: ${analyticsPeriod === '1month' ? '1 Mois' : 
                   analyticsPeriod === '3months' ? '3 Mois' :
                   analyticsPeriod === '6months' ? '6 Mois' : '1 An'}
        
        Généré le: ${new Date().toLocaleString('fr-FR')}
      `

      // Créer et télécharger le fichier
      const blob = new Blob([pdfContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-marketing-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addNotification({
        type: 'success',
        title: 'Export PDF réussi',
        message: 'Le rapport PDF a été généré et téléchargé avec succès.',
        duration: 5000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de la génération du PDF.',
        duration: 4000
      })
    }
  }

  // Fonction pour générer et télécharger les données CSV
  const handleExportCSV = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Génération CSV en cours...',
        message: 'Veuillez patienter pendant la génération des données.',
        duration: 3000
      })

      // Simulation de génération CSV
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Créer le contenu CSV
      const csvContent = `Période,Total Boostages,Revenus Totaux,Vendeurs Actifs,Taux de Conversion,ROAS,CPI moyen,CPA moyen,Revenu moyen,Clics,Conversions,Conversions moyennes
${analyticsPeriod === '1month' ? '1 Mois' : 
  analyticsPeriod === '3months' ? '3 Mois' :
  analyticsPeriod === '6months' ? '6 Mois' : '1 An'},${analyticsData.totalBoostages},${analyticsData.totalRevenue},${analyticsData.activeVendors},${analyticsData.conversionRate}%,${analyticsData.roas},${analyticsData.avgCpc},${analyticsData.avgCpa},${analyticsData.revenuePerCampaign},${analyticsData.clicks},${analyticsData.conversions},${analyticsData.conversionsPerCampaign}`

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `donnees-marketing-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addNotification({
        type: 'success',
        title: 'Export CSV réussi',
        message: 'Les données CSV ont été générées et téléchargées avec succès.',
        duration: 5000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de la génération du CSV.',
        duration: 4000
      })
    }
  }

  // Fonction pour générer et télécharger les graphiques PNG
  const handleExportPNG = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Génération des graphiques en cours...',
        message: 'Veuillez patienter pendant la génération des graphiques.',
        duration: 3000
      })

      // Simulation de génération PNG
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Créer un canvas pour simuler un graphique
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Fond blanc
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, 800, 600)
        
        // Titre
        ctx.fillStyle = '#1f2937'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Graphiques Marketing - Analytics', 400, 40)
        
        // Sous-titre
        ctx.fillStyle = '#6b7280'
        ctx.font = '16px Arial'
        ctx.fillText(`Période: ${analyticsPeriod === '1month' ? '1 Mois' : 
                                   analyticsPeriod === '3months' ? '3 Mois' :
                                   analyticsPeriod === '6months' ? '6 Mois' : '1 An'}`, 400, 70)
        
        // Graphique en barres simple
        ctx.fillStyle = '#3b82f6'
        ctx.fillRect(100, 150, 80, 200)
        ctx.fillStyle = '#10b981'
        ctx.fillRect(200, 120, 80, 230)
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(300, 180, 80, 170)
        
        // Labels
        ctx.fillStyle = '#374151'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Boostages', 140, 380)
        ctx.fillText('Revenus', 240, 380)
        ctx.fillText('Vendeurs', 340, 380)
        
        // Légende
        ctx.font = '12px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`Total Boostages: ${analyticsData.totalBoostages}`, 500, 200)
        ctx.fillText(`Revenus: ${formatPrice(analyticsData.totalRevenue)}`, 500, 230)
        ctx.fillText(`ROAS: ${analyticsData.roas}`, 500, 260)
        ctx.fillText(`CPI moyen: ${formatPrice(analyticsData.avgCpc)}`, 500, 290)
        ctx.fillText(`CPA moyen: ${formatPrice(analyticsData.avgCpa)}`, 500, 320)
        ctx.fillText(`Conversions moyennes: ${analyticsData.conversionsPerCampaign}`, 500, 350)
      }

      // Convertir le canvas en blob et télécharger
      canvas.toBlob((blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `graphiques-marketing-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      }, 'image/png')

      addNotification({
        type: 'success',
        title: 'Export PNG réussi',
        message: 'Les graphiques PNG ont été générés et téléchargés avec succès.',
        duration: 5000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de la génération des graphiques.',
        duration: 4000
      })
    }
  }

  // Fonction pour envoyer les rapports par email
    const handleSendEmail = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Envoi du rapport en cours...',
        message: "Veuillez patienter pendant l'envoi du rapport.",
        duration: 3000
      })

      const recipients = ['admin@probooster.com', 'marketing@probooster.com', 'analytics@probooster.com']
      const reportContent = {
        period: analyticsPeriod,
        totalBoostages: analyticsData.totalBoostages,
        totalRevenue: analyticsData.totalRevenue,
        activeVendors: analyticsData.activeVendors,
        conversionRate: analyticsData.conversionRate,
        roas: analyticsData.roas,
        avgCpc: analyticsData.avgCpc,
        avgCpa: analyticsData.avgCpa,
        revenuePerCampaign: analyticsData.revenuePerCampaign,
        conversionsPerCampaign: analyticsData.conversionsPerCampaign,
        impressions: analyticsData.impressions,
        clicks: analyticsData.clicks,
        conversions: analyticsData.conversions
      }

      const resp = await fetch('/api/super-admin/marketing/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, period: analyticsPeriod, report: reportContent }),
        cache: 'no-store'
      }).catch(() => null)

      if (!resp?.ok) {
        const payload = await resp?.json().catch(() => null)
        throw new Error(payload?.error || "Réponse invalide du serveur d'envoi.")
      }

      const result = await resp.json().catch(() => null)
      addNotification({
        type: 'success',
        title: 'Export enregistré',
        message: "Le rapport a été exporté et journalisé en base (statut : " + (result?.status ?? 'logged') + ").",
        duration: 4000
      })
    } catch (error) {
      console.error('handleSendEmail failed:', error)
      addNotification({
        type: 'error',
        title: "Erreur d'envoi",
        message: "Une erreur est survenue lors de l'envoi du rapport. L'action a été journalisée.",
        duration: 4000
      })
    }
  }

  // Fonction pour activer/désactiver un service de boostage
  const handleServiceToggle = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return

    const newStatus = !service.is_active

    try {
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_active: newStatus } : s))
      const updated = await BoostingServiceManager.updateService(serviceId, { is_active: newStatus })

      if (!updated) {
        setServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_active: service.is_active } : s))
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de mettre à jour le statut du service.',
          duration: 4000
        })
        return
      }

      setServices(prev => prev.map(s => s.id === serviceId ? updated : s))
      addNotification({
        type: newStatus ? 'success' : 'warning',
        title: newStatus ? 'Service Activé' : 'Service Désactivé',
        message: `Le service "${service.name}" est désormais ${newStatus ? 'actif' : 'inactif'}.`,
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur bascule service:', error)
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_active: service.is_active } : s))
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la mise à jour.',
        duration: 4000
      })
    }
  }

  /**
   * Rafraîchit toutes les données marketing depuis Supabase.
   */
  const handleRefreshData = () => {
    addNotification({
      type: 'info',
      title: 'Actualisation en cours…',
      message: 'Rechargement des données marketing…',
      duration: 2000
    })

    setTimeout(async () => {
      await loadData(false)
      addNotification({
        type: 'success',
        title: 'Actualisation terminée',
        message: 'Les données ont été actualisées avec succès.',
        duration: 3000
      })
    }, 500)
  }

  /**
   * Prépare les paramètres et affiche le modal d’export.
   */
  const handleExportData = () => {
    setExportData(prev => ({
      ...prev,
      period: analyticsPeriod
    }))
    setShowExportModal(true)
  }

  /**
   * Initialise le formulaire pour créer une nouvelle campagne.
   */
  const handleCreateNewCampaign = () => {
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    setNewCampaignData({
      ...INITIAL_NEW_CAMPAIGN_DATA,
      startDate,
      endDate
    })
    setShowNewCampaignFormModal(true)
  }

  // Fonction pour configurer un service de boostage
  const resetServiceFormState = () => {
    setServiceForm({
      name: '',
      description: '',
      base_price: 0,
      pricing_model: 'fixed',
      features: [],
      is_active: true
    })
    setServiceFeaturesInput('')
    setServiceConfigTab('recommendation')
    setSelectedService(null)
  }

  const handleServiceConfigModalChange = (open: boolean) => {
    setShowServiceConfigModal(open)
    if (!open) {
      resetServiceFormState()
    }
  }

  const handleServiceConfigure = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedService(service)
      setServiceForm({
        name: service.name,
        description: service.description ?? '',
        base_price: service.base_price,
        pricing_model: service.pricing_model,
        features: [...(service.features ?? [])],
        is_active: service.is_active
      })
      setServiceFeaturesInput((service.features ?? []).join('\n'))
      setServiceConfigTab(service.type)
      setShowServiceConfigModal(true)
    }
  }

  // Fonction pour voir les détails d'un service
  const handleServiceViewDetails = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedService(service)
      setShowServiceDetailsModal(true)
    }
  }

  const handleViewServiceStats = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedService(service)
      setShowServiceStatsModal(true)
    }
  }

  // Fonction pour sauvegarder la configuration d'un service individuel
  const handleSaveServiceConfiguration = async () => {
    if (!selectedService) return

    const updates: Partial<BoostingServiceType> = {
      name: serviceForm.name?.trim() || selectedService.name,
      description: serviceForm.description?.trim() || selectedService.description,
      base_price: Number.isFinite(serviceForm.base_price) ? serviceForm.base_price : selectedService.base_price,
      pricing_model: serviceForm.pricing_model || selectedService.pricing_model,
      features: serviceForm.features.length > 0 ? serviceForm.features : selectedService.features,
      is_active: serviceForm.is_active
    }

    try {
      const updated = await BoostingServiceManager.updateService(selectedService.id, updates)
      if (!updated) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Échec de la sauvegarde du service.',
          duration: 4000
        })
        return
      }

      setServices(prev => prev.map(s => (s.id === updated.id ? updated : s)))

      let pricingConfigSaved = true
      if (user?.id) {
        pricingConfigSaved = await BoostingPricingManager.saveConfig(serviceConfig, user.id)
        if (!pricingConfigSaved) {
          addNotification({
            type: 'error',
            title: 'Tarifs non sauvegardés',
            message: 'La configuration Boostage Pro n’a pas pu être enregistrée.',
            duration: 4000
          })
        }
      }

      addNotification({
        type: pricingConfigSaved ? 'success' : 'info',
        title: pricingConfigSaved ? 'Configuration sauvegardée' : 'Service mis à jour',
        message: pricingConfigSaved
          ? `Les paramètres du service "${updated.name}" ont été enregistrés.`
          : `Le service "${updated.name}" a été mis à jour. Enregistrez manuellement les tarifs si nécessaire.`,
        duration: 4000
      })

      handleServiceConfigModalChange(false)
      await loadData(false)
    } catch (error) {
      console.error('Erreur sauvegarde configuration service:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la sauvegarde.',
        duration: 4000
      })
    }
  }

    // Fonction pour créer une campagne depuis le formulaire
  const handleCreateCampaignFromForm = async () => {
    if (newCampaignData.vendorId && newCampaignData.serviceId) {
      // Validation spécifique pour les bannières
      if (newCampaignData.serviceType === 'banner') {
        if (!newCampaignData.bannerImage) {
          addNotification({
            type: 'error',
            title: 'Image de bannière requise',
            message: 'Veuillez ajouter une image de bannière pour continuer.',
            duration: 4000
          })
          return
        }
        if (!newCampaignData.bannerTitle.trim()) {
          addNotification({
            type: 'error',
            title: 'Titre accrocheur requis',
            message: 'Veuillez saisir un titre accrocheur pour la bannière.',
            duration: 4000
          })
          return
        }
        if (!newCampaignData.shortDescription.trim()) {
          addNotification({
            type: 'error',
            title: 'Description courte requise',
            message: 'Veuillez saisir une description courte pour la bannière.',
            duration: 4000
          })
          return
        }
      }

      // Validation spécifique pour WhatsApp
      if (newCampaignData.serviceType === 'whatsapp') {
        if (!newCampaignData.whatsappMessageTitle.trim()) {
          addNotification({
            type: 'error',
            title: 'Titre du message requis',
            message: 'Veuillez saisir un titre de message pour la campagne WhatsApp.',
            duration: 4000
          })
          return
        }
        if (!newCampaignData.whatsappProductDescription.trim()) {
          addNotification({
            type: 'error',
            title: 'Description du produit requise',
            message: 'Veuillez saisir une description du produit pour la campagne WhatsApp.',
            duration: 4000
          })
          return
        }
        if (newCampaignData.whatsappTargetCount < 1) {
          addNotification({
            type: 'error',
            title: 'Nombre de cibles invalide',
            message: 'Le nombre de cibles doit être supérieur à 0.',
            duration: 4000
          })
          return
        }
      }
      
      setLoading(true)
      try {
        const campaignPayload: Omit<BoostingCampaignType, 'id' | 'created_at' | 'updated_at'> = {
          vendor_id: newCampaignData.vendorId,
          product_id: newCampaignData.productId || null,
          service_id: newCampaignData.serviceId,
          type: (newCampaignData.serviceType as BoostingCampaignType['type']) || 'recommendation',
          status: 'pending',
          start_date: newCampaignData.startDate || null,
          end_date: newCampaignData.endDate || null,
          target_pages: newCampaignData.targetPages,
          duration: newCampaignData.startDate && newCampaignData.endDate
            ? Math.max(1, Math.ceil((new Date(newCampaignData.endDate).getTime() - new Date(newCampaignData.startDate).getTime()) / (1000 * 60 * 60 * 24)))
            : null,
          total_cost: newCampaignData.budget,
          payment_status: newCampaignData.paymentStatus as BoostingCampaignType['payment_status'],
          payment_id: null,
          payment_method: null,
          rejection_reason: null
        }

        const created = await BoostingCampaignManager.createCampaign(campaignPayload)

        if (created) {
          addNotification({
            type: 'success',
            title: 'Campagne créée',
            message: `La campagne a été enregistrée pour le vendeur sélectionné.`
          })
          setShowNewCampaignFormModal(false)
          setNewCampaignData({ ...INITIAL_NEW_CAMPAIGN_DATA })
          await loadData(false)
        }
      } catch (error) {
        console.error('Erreur création campagne Supabase:', error)
        addNotification({
          type: 'error',
          title: 'Erreur Supabase',
          message: 'Impossible de créer la campagne pour le moment.'
        })
      } finally {
        setLoading(false)
      }
    } else {
      addNotification({
        type: 'error',
        title: 'Erreur de Validation',
        message: 'Veuillez remplir tous les champs obligatoires.',
        duration: 4000
      })
    }
  }

  // Fonction pour gérer l'upload d'image de bannière
  const handleBannerImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        addNotification({
          type: 'error',
          title: 'Type de fichier invalide',
          message: 'Veuillez sélectionner une image (JPG, PNG, GIF, etc.)',
          duration: 4000
        })
        return
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'Fichier trop volumineux',
          message: 'La taille maximale autorisée est de 5MB',
          duration: 4000
        })
        return
      }
      
      setNewCampaignData(prev => ({ ...prev, bannerImage: file }))
      addNotification({
        type: 'success',
        title: 'Image téléchargée',
        message: `${file.name} a été ajouté avec succès`,
        duration: 3000
      })
    }
  }

  // Fonction pour supprimer l'image de bannière
  const handleRemoveBannerImage = () => {
    setNewCampaignData(prev => ({ ...prev, bannerImage: null }))
    addNotification({
      type: 'info',
      title: 'Image supprimée',
      message: 'L\'image de bannière a été supprimée',
      duration: 3000
    })
  }

  // Fonction pour effectuer l'export
  const handlePerformExport = () => {
    setShowExportModal(true)
  }

  const handleConfirmExport = () => {
    addNotification({
      type: 'info',
      title: 'Export en cours...',
      message: `Génération du rapport ${exportData.format.toUpperCase()}...`,
      duration: 3000
    })

    setTimeout(() => {
      const fileName = `rapport-marketing-${exportData.period}-${new Date().toISOString().split('T')[0]}.${exportData.format}`
      addNotification({
        type: 'success',
        title: 'Export Réussi',
        message: `Le rapport a été généré et téléchargé : ${fileName}`,
        duration: 5000
      })
      setShowExportModal(false)
    }, 2000)
  }

  const handleResetToDefaults = async () => {
    const accepted = window.confirm('Voulez-vous vraiment réinitialiser la configuration aux valeurs par défaut ?')
    if (!accepted) {
      return
    }

    setServiceConfig(clonePricingConfig(DEFAULT_BOOSTING_PRICING_CONFIG))

    if (!user?.id) {
      addNotification({
        type: 'success',
        title: 'Configuration réinitialisée',
        message: 'Valeurs par défaut chargées localement.',
        duration: 3000
      })
      return
    }

    const success = await BoostingPricingManager.saveConfig(DEFAULT_BOOSTING_PRICING_CONFIG, user.id)

    if (success) {
      addNotification({
        type: 'success',
        title: 'Configuration réinitialisée',
        message: 'Les valeurs par défaut ont été restaurées et enregistrées.',
        duration: 3000
      })
    } else {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder les valeurs par défaut.',
        duration: 4000
      })
    }
  }

  const handleSaveServiceConfig = async () => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Utilisateur requis',
        message: 'Vous devez être connecté pour sauvegarder la configuration.',
        duration: 4000
      })
      return
    }

    setLoading(true)
    try {
      const success = await BoostingPricingManager.saveConfig(serviceConfig, user.id)
      if (success) {
        addNotification({
          type: 'success',
          title: 'Configuration sauvegardée',
          message: 'Les tarifs Boostage Pro ont été enregistrés.',
          duration: 4000
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de sauvegarder la configuration.',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Erreur sauvegarde Boostage Pro:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la sauvegarde.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  // Fonctions de calcul des coûts estimés
  const calculateRecommendationCost = () => {
    const baseCost = serviceConfig.recommendation.homePage + 
                    serviceConfig.recommendation.productPage + 
                    serviceConfig.recommendation.bestSellers + 
                    serviceConfig.recommendation.newArrivals + 
                    serviceConfig.recommendation.vendorPage
    
    const totalCost = baseCost * costCalculation.days * (costCalculation.pages / 5)
    const discount = totalCost * (serviceConfig.recommendation.multiPageDiscount / 100)
    return Math.round(totalCost - discount)
  }

  const calculateBannerCost = () => {
    const recommendationCost = calculateRecommendationCost()
    return Math.round(recommendationCost * serviceConfig.banner.multiplier + 
                     serviceConfig.banner.animationFee * costCalculation.days)
  }

  const calculateWhatsAppCost = () => {
    const baseCost = serviceConfig.whatsapp.baseCost
    const countryCost = serviceConfig.whatsapp.countryCost
    const ageCost = serviceConfig.whatsapp.ageCost
    const professionCost = serviceConfig.whatsapp.professionCost
    const proboosterCost = serviceConfig.whatsapp.proboosterCost
    
    return Math.round((baseCost + countryCost + ageCost + professionCost + proboosterCost) * costCalculation.whatsappTargets)
  }

  const calculateTotalCost = () => {
    return calculateRecommendationCost() + calculateBannerCost() + calculateWhatsAppCost()
  }

  // Fonctions pour gérer les promotions
  const resetPromotionForm = () => {
    setPromotionForm({
      name: '',
      type: 'code',
      discountType: 'percentage',
      discountValue: 0,
      startDate: '',
      endDate: '',
      minAmount: 0,
      usageLimit: 100,
      conditions: '',
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      maxDiscount: 0,
      usage_limit_per_user: 1,
      targetAudience: [],
      applicableProducts: [],
      applicableCategories: [],
      applicableVendors: [],
      applicableTags: [],
      isAutoApply: false
    })
  }

  const handleEditPromotion = (promotion: PromotionType) => {
    setSelectedPromotion(promotion)
    setPromotionForm(prev => ({
      ...prev,
      name: promotion.name || '',
      type: (promotion.type === 'coupon' ? 'code' : promotion.type === 'discount' ? 'reduction' : promotion.type === 'flash_sale' ? 'flash' : 'bundle') as any,
      discountType: promotion.discount_type as any,
      discountValue: promotion.discount_type === 'free_shipping' ? 0 : (promotion.discount_value || 0),
      startDate: promotion.start_date?.split?.('T')?.[0] || (promotion.start_date as any) || '',
      endDate: promotion.end_date?.split?.('T')?.[0] || (promotion.end_date as any) || '',
      minAmount: promotion.min_order_amount || 0,
      usageLimit: promotion.usage_limit || 100,
      conditions: promotion.description || '',
      code: promotion.code || '',
      description: promotion.description || '',
      discount_type: promotion.discount_type as any,
      discount_value: promotion.discount_value || 0,
      maxDiscount: promotion.max_discount || 0,
      usage_limit_per_user: promotion.usage_limit_per_user || 1,
      targetAudience: promotion.target_audience || [],
      applicableProducts: promotion.applicable_products || [],
      applicableCategories: (promotion as any).applicable_categories || [],
      applicableVendors: (promotion as any).applicable_vendors || [],
      applicableTags: [],
      isAutoApply: (promotion as any).is_auto_apply ?? false
    }))
    setShowEditPromotionModal(true)
  }

  const handleViewPromotion = (promotion: PromotionType) => {
    setSelectedPromotion(promotion)
    setShowViewPromotionModal(true)
  }

  const handleTogglePromotionStatus = async (promotionId: string) => {
    const promotion = promotions.find(p => p.id === promotionId)
    if (promotion) {
      await handleTogglePromotion(promotionId, promotion.status)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Marketing et Promotions</h2>
            <p className="text-gray-600 mt-2">
              Gestion des campagnes publicitaires, boostage et stratégies marketing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              onClick={handleRefreshData}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              variant="outline"
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              onClick={handlePerformExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button 
              size="sm"
              onClick={handleCreateNewCampaign}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Campagne
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="boosting-pro">Boostage Pro</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'Ensemble */}
        <TabsContent value="overview" className="mt-6">
          {/* En-tête avec boutons d'action */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Vue d'Ensemble du Marketing</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshData}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportData}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button 
                size="sm"
                onClick={handleCreateNewCampaign}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Campagne
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Campagnes Actives</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {campaigns.filter(c => c.status === 'active').length}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">En cours</p>
                  </div>
                  <Play className="h-12 w-12 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Revenus Boostage</p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatPrice(campaigns.reduce((sum, c) => sum + (c as any).totalCost, 0))}
                    </p>
                    <p className="text-sm text-green-700 mt-1">Total généré</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Promotions Actives</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {promotions.filter(p => p.status === 'active').length}
                    </p>
                    <p className="text-sm text-purple-700 mt-1">En cours</p>
                  </div>
                  <Gift className="h-12 w-12 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services de Boostage */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Services de Boostage Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={cn(
                    'hover:shadow-lg transition-shadow',
                    !service.is_active && 'opacity-60 grayscale'
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Switch 
                        checked={service.is_active} 
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">À partir de</span>
                        <span className="font-bold text-green-600">{getServiceStartingPrice(service)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Modèle:</span>
                        <Badge variant="outline" className="text-xs">
                          {service.pricing_model === 'per_page_day' ? 'Page × Jour' : 
                           service.pricing_model === 'per_message_country' ? 'Message × Pays' : 'Fixe'}
                        </Badge>
                      </div>
                      <div className="pt-3">
                        <h4 className="text-sm font-medium mb-2">Fonctionnalités:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {service.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <Star className="h-3 w-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {renderServicePricingDetails(service)}

                      {/* Boutons d'action */}
                      <div className="pt-4 space-y-2">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleServiceConfigure(service.id)}
                            className="flex-1 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Configurer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleServiceViewDetails(service.id)}
                            className="flex-1 border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Détails
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewServiceStats(service.id)}
                            className="flex-1 border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Stats
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Modale Promotion Spéciale */}
        <Dialog open={showSpecialPromoModal} onOpenChange={setShowSpecialPromoModal}>
          <DialogContent className="max-w-3xl w-[95vw] sm:w-full p-0 overflow-hidden">
            <div className="flex flex-col max-h-[90vh] bg-white">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
                <DialogTitle className="text-lg font-semibold">
                  {editingSpecialPromo ? 'Modifier la promotion spéciale' : 'Nouvelle promotion spéciale'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Configurez le bloc qui sera affiché dans le tableau de bord client.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input value={specialPromoForm.title} onChange={(e) => setSpecialPromoForm(s => ({ ...s, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Sous-titre</Label>
                      <Input value={specialPromoForm.subtitle} onChange={(e) => setSpecialPromoForm(s => ({ ...s, subtitle: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={specialPromoForm.description} onChange={(e) => setSpecialPromoForm(s => ({ ...s, description: e.target.value }))} rows={4} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Input type="date" value={specialPromoForm.startDate} onChange={(e) => setSpecialPromoForm(s => ({ ...s, startDate: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de fin</Label>
                        <Input type="date" value={specialPromoForm.endDate} onChange={(e) => setSpecialPromoForm(s => ({ ...s, endDate: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Ordre d'affichage</Label>
                        <Input type="number" value={specialPromoForm.sortOrder} onChange={(e) => setSpecialPromoForm(s => ({ ...s, sortOrder: parseInt(e.target.value || '0') }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type de remise</Label>
                        <Select value={specialPromoForm.discountType} onValueChange={(v) => setSpecialPromoForm(s => ({ ...s, discountType: v as any }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                            <SelectItem value="fixed">Montant fixe</SelectItem>
                            <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valeur de remise</Label>
                        <Input
                          type="number"
                          value={specialPromoForm.discountValue}
                          disabled={specialPromoForm.discountType === 'free_shipping'}
                          onChange={(e) => setSpecialPromoForm(s => ({ ...s, discountValue: Number(e.target.value || 0) }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium">Active</Label>
                      <Switch checked={specialPromoForm.is_active} onCheckedChange={(v) => setSpecialPromoForm(s => ({ ...s, is_active: v }))} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Thème</Label>
                      <Select value={specialPromoForm.theme} onValueChange={(v) => {
                        const theme = v as SpecialTheme
                        const preset = specialThemePresets[theme]
                        setSpecialPromoForm(s => ({
                          ...s,
                          theme,
                          gradient_from: preset.from,
                          gradient_to: preset.to,
                          text_color: preset.text,
                        }))
                      }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir un thème" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="black_friday">Black Friday</SelectItem>
                          <SelectItem value="cyber_monday">Cyber Monday</SelectItem>
                          <SelectItem value="boxing_day">Boxing Day</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {specialPromoForm.theme === 'custom' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Dégradé - from</Label>
                          <Input value={specialPromoForm.gradient_from} onChange={(e) => setSpecialPromoForm(s => ({ ...s, gradient_from: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Dégradé - to</Label>
                          <Input value={specialPromoForm.gradient_to} onChange={(e) => setSpecialPromoForm(s => ({ ...s, gradient_to: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Couleur texte</Label>
                          <Input value={specialPromoForm.text_color} onChange={(e) => setSpecialPromoForm(s => ({ ...s, text_color: e.target.value }))} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Aperçu</Label>
                      <div
                        className="mt-2 rounded-lg h-28 flex items-center justify-center text-sm font-semibold shadow-inner"
                        style={{ background: `linear-gradient(135deg, ${specialPromoForm.gradient_from}, ${specialPromoForm.gradient_to})`, color: specialPromoForm.text_color }}
                      >
                        {specialPromoForm.title || 'Aperçu'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-5 border rounded-xl bg-gray-50 shadow-sm">
                  <h4 className="font-semibold text-gray-900">Ciblage de la promotion spéciale</h4>

                  <MultiSelectField
                    label="Vendeurs ciblés"
                    placeholder="Tous les vendeurs"
                    emptyMessage="Aucun vendeur trouvé"
                    options={vendorOptions}
                    selectedIds={specialPromoForm.applicableVendors}
                    onChange={(next) => setSpecialPromoForm((prev) => ({
                      ...prev,
                      applicableVendors: next
                    }))}
                    searchPlaceholder="Rechercher un vendeur"
                  />

                  <MultiSelectField
                    label="Catégories ciblées"
                    placeholder="Toutes les catégories"
                    emptyMessage="Aucune catégorie trouvée"
                    options={categoryOptionList}
                    selectedIds={specialPromoForm.applicableCategories}
                    onChange={(next) => setSpecialPromoForm((prev) => ({
                      ...prev,
                      applicableCategories: next
                    }))}
                    searchPlaceholder="Rechercher une catégorie"
                  />

                  <MultiSelectField
                    label="Tags (produits)"
                    placeholder="Tous les tags"
                    emptyMessage="Aucun tag trouvé"
                    options={specialTagOptions}
                    selectedIds={specialPromoForm.applicableTags}
                    onChange={(next) => setSpecialPromoForm((prev) => ({
                      ...prev,
                      applicableTags: next
                    }))}
                    searchPlaceholder="Rechercher un tag"
                  />

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                      <div>
                        <Label className="text-sm font-medium">Produits ciblés</Label>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500 uppercase tracking-wide">Filtrer par vendeur</Label>
                        <Select value={specialProductVendorFilter} onValueChange={(val) => setSpecialProductVendorFilter(val)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner un vendeur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            {vendors.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.display_name || v.email || v.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <MultiSelectField
                      placeholder="Tous les produits"
                      emptyMessage="Aucun produit trouvé"
                      options={specialProductOptionList}
                      selectedIds={specialPromoForm.applicableProducts}
                      onChange={(next) => setSpecialPromoForm((prev) => ({
                        ...prev,
                        applicableProducts: next
                      }))}
                      searchPlaceholder="Rechercher un produit"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-white">
                <Button variant="outline" onClick={() => setShowSpecialPromoModal(false)}>Annuler</Button>
                <Button onClick={handleSaveSpecialPromo} className="bg-[#ff6600] hover:bg-[#ff6600]/90">Enregistrer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Onglet Campagnes */}
        <TabsContent value="campaigns" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gestion des Campagnes de Boostage</h3>
            </div>

            {/* Sous-onglets pour Campagnes */}
            <Tabs defaultValue="approval" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approval">Approbation</TabsTrigger>
                <TabsTrigger value="ongoing">Campagnes en cours</TabsTrigger>
              </TabsList>

              {/* Sous-onglet Approbation */}
              <TabsContent value="approval" className="mt-6">
                <BoostingApproval />
              </TabsContent>

              {/* Sous-onglet Campagnes en cours */}
              <TabsContent value="ongoing" className="mt-6">
                <div className="space-y-4">
                  {/* Filtres */}
                  <div className="flex items-center gap-4">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="recommendation">Recommandation</SelectItem>
                        <SelectItem value="banner">Bannière</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">En pause</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Liste des campagnes en cours */}
                  <div className="space-y-4">
                    {campaigns.filter(c => c.status === 'active' || c.status === 'paused').map((campaign) => (
                      <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="font-semibold text-lg">{campaign.vendorName}</h4>
                                {getStatusBadge(campaign.status)}
                                <Badge variant="outline" className="capitalize">
                                  {campaign.type}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Début:</span>
                                  <p className="font-medium">{campaign.start_date}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Fin:</span>
                                  <p className="font-medium">{campaign.end_date}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Durée:</span>
                                  <p className="font-medium">{campaign.duration} jours</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Coût:</span>
                                  <p className="font-medium text-green-600">{formatPrice(campaign.total_cost)}</p>
                                </div>
                              </div>

                              {campaign.performance && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                  <h5 className="font-medium mb-2">Performance</h5>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">Impressions:</span>
                                      <p className="font-medium">{campaign.performance.impressions.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Clics:</span>
                                      <p className="font-medium">{campaign.performance.clicks.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">CTR:</span>
                                      <p className="font-medium">{campaign.performance.ctr}%</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Conversions:</span>
                                      <p className="font-medium">{campaign.performance.conversions}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              {campaign.status === 'active' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCampaignStatusChange(campaign.id, 'paused')}
                                    className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                                    disabled={loading}
                                  >
                                    <Pause className="h-4 w-4 mr-1" />
                                    Pause
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCampaignStatusChange(campaign.id, 'completed')}
                                    className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                                    disabled={loading}
                                  >
                                    <StopCircle className="h-4 w-4 mr-1" />
                                    Stop
                                  </Button>
                                </>
                              ) : campaign.status === 'paused' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCampaignStatusChange(campaign.id, 'active')}
                                    className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                                    disabled={loading}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Reprendre
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCampaignStatusChange(campaign.id, 'completed')}
                                    className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                                    disabled={loading}
                                  >
                                    <StopCircle className="h-4 w-4 mr-1" />
                                    Stop
                                  </Button>
                                </>
                              ) : null}

                              {campaign.super_admin_approved && campaign.admin_approved ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCampaignDisapprove(campaign.id)}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  disabled={loading}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Désapprouver
                                </Button>
                              ) : null}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCampaignDelete(campaign.id)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Supprimer
                              </Button>

                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewCampaignDetails(campaign)}
                                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                                disabled={loading}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Onglet Boostage Pro */}
        <TabsContent value="boosting-pro" className="mt-6">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="text-xl font-bold text-orange-800">Système de Boostage Pro</h3>
                  <p className="text-orange-700">
                    Système modulaire, intelligent et orienté résultats pour la promotion efficace des produits
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Recommandation Ciblée
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Affichage stratégique sur 5 pages clés avec tarification flexible
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Page d'accueil:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.recommendation.homePage)}/jour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Page produit:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.recommendation.productPage)}/jour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Meilleures ventes:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.recommendation.bestSellers)}/jour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nouvelles arrivées:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.recommendation.newArrivals)}/jour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Page vendeur:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.recommendation.vendorPage)}/jour</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-green-600" />
                      Bannière Visuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Bannières miniatures animées pour maximiser la conversion
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Même pages que recommandation</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calendrier configurable</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Animations discrètes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Optimisation conversion</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Multiplicateur:</span>
                        <span className="font-medium">x{serviceConfig.banner.multiplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frais animation:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.banner.animationFee)}/jour</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-purple-600" />
                      WhatsApp Marketing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Campagnes ultra-ciblées avec ciblage socio-démographique précis et ciblage clients Probooster
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Ciblage pays:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.whatsapp.countryCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ciblage âge:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.whatsapp.ageCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ciblage profession:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.whatsapp.professionCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ciblage clients Probooster:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.whatsapp.proboosterCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coût base:</span>
                        <span className="font-medium">{formatMoney(serviceConfig.whatsapp.baseCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paiement FeexPay</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Configuration des tarifs */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration des Tarifs Boostage Pro</CardTitle>
                <CardDescription>
                  Paramétrer les tarifs et règles de calcul pour chaque service de boostage
                </CardDescription>
              </CardHeader>
              <CardContent className={cn(loading && 'pointer-events-none opacity-60')}>
                <Tabs defaultValue="recommendation" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="recommendation">Recommandation Ciblée</TabsTrigger>
                    <TabsTrigger value="banner">Bannière Visuelle</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp Marketing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="recommendation" className="mt-6">
                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <h4 className="font-semibold text-blue-800 mb-3">Recommandation Ciblée</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Page d'accueil ({currencyCode}/jour)</Label>
                          <Input
                            type="number"
                            value={serviceConfig.recommendation.homePage}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                recommendation: {
                                  ...prev.recommendation,
                                  homePage: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Page produit ({currencyCode}/jour)</Label>
                          <Input
                            type="number"
                            value={serviceConfig.recommendation.productPage}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                recommendation: {
                                  ...prev.recommendation,
                                  productPage: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Meilleures ventes ({currencyCode}/jour)</Label>
                          <Input
                            type="number"
                            value={serviceConfig.recommendation.bestSellers}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                recommendation: {
                                  ...prev.recommendation,
                                  bestSellers: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Nouvelles arrivées ({currencyCode}/jour)</Label>
                          <Input
                            type="number"
                            value={serviceConfig.recommendation.newArrivals}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                recommendation: {
                                  ...prev.recommendation,
                                  newArrivals: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Page vendeur ({currencyCode}/jour)</Label>
                          <Input
                            type="number"
                            value={serviceConfig.recommendation.vendorPage}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                recommendation: {
                                  ...prev.recommendation,
                                  vendorPage: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Réduction multi-pages (%)</Label>
                          <Input
                            type="number"
                            value={serviceConfig.recommendation.multiPageDiscount}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                recommendation: {
                                  ...prev.recommendation,
                                  multiPageDiscount: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="banner" className="mt-6">
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                      <h4 className="font-semibold text-green-800 mb-3">Bannière Visuelle Animée</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Multiplicateur par rapport à recommandation</Label>
                          <Input
                            type="number"
                            value={serviceConfig.banner.multiplier}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                banner: {
                                  ...prev.banner,
                                  multiplier: parseFloat(e.target.value) || 0
                                }
                              }))
                            }
                            step="0.1"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Frais d'animation ({currencyCode}/jour)</Label>
                          <Input
                            type="number"
                            value={serviceConfig.banner.animationFee}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                banner: {
                                  ...prev.banner,
                                  animationFee: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="whatsapp" className="mt-6">
                    <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                      <h4 className="font-semibold text-purple-800 mb-3">WhatsApp Marketing Ultra-Ciblé</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Coût par message ({currencyCode})</Label>
                          <Input
                            type="number"
                            value={serviceConfig.whatsapp.baseCost}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                whatsapp: {
                                  ...prev.whatsapp,
                                  baseCost: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Majoration pays ({currencyCode})</Label>
                          <Input
                            type="number"
                            value={serviceConfig.whatsapp.countryCost}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                whatsapp: {
                                  ...prev.whatsapp,
                                  countryCost: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Majoration âge ({currencyCode})</Label>
                          <Input
                            type="number"
                            value={serviceConfig.whatsapp.ageCost}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                whatsapp: {
                                  ...prev.whatsapp,
                                  ageCost: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Majoration profession ({currencyCode})</Label>
                          <Input
                            type="number"
                            value={serviceConfig.whatsapp.professionCost}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                whatsapp: {
                                  ...prev.whatsapp,
                                  professionCost: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Majoration clients Probooster ({currencyCode})</Label>
                          <Input
                            type="number"
                            value={serviceConfig.whatsapp.proboosterCost}
                            onChange={(e) =>
                              setServiceConfig(prev => ({
                                ...prev,
                                whatsapp: {
                                  ...prev.whatsapp,
                                  proboosterCost: parseInt(e.target.value) || 0
                                }
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-800 mb-3">Options Globales</h4>
                  <div className="flex items-center flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoReload"
                        checked={serviceConfig.autoReload}
                        onCheckedChange={(checked) =>
                          setServiceConfig(prev => ({
                            ...prev,
                            autoReload: checked
                          }))
                        }
                      />
                      <Label htmlFor="autoReload">Recharge automatique</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifications"
                        checked={serviceConfig.notifications}
                        onCheckedChange={(checked) =>
                          setServiceConfig(prev => ({
                            ...prev,
                            notifications: checked
                          }))
                        }
                      />
                      <Label htmlFor="notifications">Notifications</Label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                    onClick={handleSaveServiceConfig}
                    disabled={loading}
                  >
                    Sauvegarder les tarifs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetToDefaults}
                    disabled={loading}
                  >
                    Réinitialiser aux valeurs par défaut
                  </Button>
                </div>
              </CardContent>
              </Card>
          </div>
        </TabsContent>

        {/* Onglet Promotions (Système existant) */}
        <TabsContent value="promotions" className="mt-6">
          <div className="space-y-6">
            {/* Promotions Spéciales */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      Promotions Spéciales
                    </CardTitle>
                    <CardDescription>Blocs mis en avant dans le tableau de bord client</CardDescription>
                  </div>
                  <Button className="bg-[#ff6600] hover:bg-[#ff6600]/90" onClick={handleOpenNewSpecialPromo}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle promotion spéciale
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {specialPromotions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    Aucune promotion spéciale pour le moment
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {specialPromotions.map((sp) => (
                      <Card key={sp.id} className="overflow-hidden">
                        <div
                          className="h-24"
                          style={{ background: `linear-gradient(135deg, ${sp.gradient_from}, ${sp.gradient_to})` }}
                        />
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{sp.title}</CardTitle>
                            <Badge variant={sp.is_active ? 'default' : 'secondary'}>
                              {sp.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <CardDescription>Se termine le {new Date(sp.end_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {sp.description && (
                            <p className="text-sm text-gray-700 mb-3">{sp.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Ordre n°{sp.sort_order ?? 0}</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleToggleSpecialPromo(sp)}>
                                {sp.is_active ? 'Désactiver' : 'Activer'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditSpecialPromo(sp)}>
                                Modifier
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteSpecialPromo(sp)}>
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gestion des Promotions</h3>
              <Button onClick={() => setShowNewPromotionModal(true)} className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Promotion
              </Button>
            </div>

            {/* Liste des promotions existantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promotions.map((promotion) => (
                <Card key={promotion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{promotion.name}</CardTitle>
                      <Badge variant={promotion.status === 'active' ? 'default' : 'secondary'}>
                        {promotion.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {promotion.discount_type === 'percentage' ? `${promotion.discount_value}% de réduction` : `${formatPrice(promotion.discount_value)} de réduction`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Début:</span>
                          <p className="font-medium">{promotion.start_date}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Fin:</span>
                          <p className="font-medium">{promotion.end_date}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Utilisation:</span>
                        <span className="font-medium">{promotion.used_count} / {promotion.usage_limit}</span>
                      </div>

                      {promotion.min_order_amount && (
                        <div className="text-sm">
                          <span className="text-gray-600">Commande minimum: </span>
                          <span className="font-medium">{formatPrice(promotion.min_order_amount)}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleTogglePromotion(promotion.id, promotion.status)}
                        >
                          {promotion.status === 'active' ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditPromotion(promotion)}
                          className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewPromotion(promotion)}
                          className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* Sélecteur de période */}
            <div className="flex items-center gap-4">
              <Label htmlFor="analytics-period">Période d'analyse:</Label>
              <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Mois</SelectItem>
                  <SelectItem value="3months">3 Mois</SelectItem>
                  <SelectItem value="6months">6 Mois</SelectItem>
                  <SelectItem value="1year">1 An</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Boostages</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalBoostages)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Revenu moyen campagne : {formatPrice(analyticsData.revenuePerCampaign)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Conversions moyennes : {analyticsData.conversionsPerCampaign}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(analyticsData.totalRevenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">ROAS : {analyticsData.roas}</p>
                  <p className="text-xs text-gray-500">
                    Dépenses : {formatPrice(analyticsData.spend)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vendeurs Actifs</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.activeVendors}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    CPC moyen : {formatPrice(analyticsData.avgCpc)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Impressions : {formatNumber(analyticsData.impressions)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux de Conversion</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.conversionRate}%</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    CPA moyen : {formatPrice(analyticsData.avgCpa)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Clics : {formatNumber(analyticsData.clicks)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Services Boostage</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.activeServices)} / {formatNumber(analyticsData.totalServices)}</p>
                    </div>
                    <Zap className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Services actifs / total</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Promotions Actives</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.activePromotions)}</p>
                    </div>
                    <Gift className="h-8 w-8 text-pink-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Sur la plateforme (temps réel)</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utilisations Promos</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.promotionUses)}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Commandes: {formatNumber(analyticsData.promoOrders)}</p>
                  <p className="text-xs text-gray-500">Réductions: {formatPrice(analyticsData.promoDiscountTotal)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Promotions Spéciales</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.activeSpecialPromotions)} / {formatNumber(analyticsData.totalSpecialPromotions)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Expirent ≤ 7j: {formatNumber(analyticsData.expiringSpecialPromotions)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques et visualisations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Répartition par type de boostage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Répartition par Type de Boostage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {campaignTypeStats.total === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-6">
                      Aucune campagne disponible pour le moment. Créez une campagne pour alimenter ces statistiques.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaignTypeStats.rows.map((row) => {
                        const meta = boostTypeMeta[row.type as BoostType] ?? { label: row.type, color: 'bg-gray-400' }
                        return (
                          <div key={row.type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${meta.color}`}></div>
                                <span className="text-sm font-medium">{meta.label}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">{row.percentage}%</p>
                                <p className="text-xs text-gray-500">{row.count} campagne{row.count > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${meta.color} h-2 rounded-full`}
                                style={{ width: `${row.percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Revenus : {formatPrice(row.revenue)}</span>
                              <span>Part : {row.percentage}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Évolution temporelle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Évolution des Boostages ({monthlyBoostingLabel})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyBoostingStats.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-6">
                      Aucune campagne enregistrée sur la période sélectionnée.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        {monthlyBoostingStats.map((stat, index) => (
                          <span key={index} className="capitalize">{stat.label}</span>
                        ))}
                      </div>

                      <div className="flex items-end justify-between h-32">
                        {monthlyBoostingStats.map((stat, index) => {
                          const heightPercentage = monthlyBoostingMax > 0 ? (stat.count / monthlyBoostingMax) * 100 : 0
                          return (
                            <div
                              key={index}
                              className="w-8 bg-blue-500 rounded-t"
                              style={{ height: `${heightPercentage}%` }}
                              title={`${stat.count} campagne${stat.count > 1 ? 's' : ''}`}
                            ></div>
                          )
                        })}
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Total : {campaignTypeStats.total} campagnes</span>
                        <span>Pic mensuel : {monthlyBoostingMax}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top vendeurs et performances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top 10 Vendeurs par Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topVendors.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-6">
                    Aucune campagne approuvée. Ajoutez des campagnes pour suivre la performance des vendeurs.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Rang</th>
                          <th className="text-left py-2 font-medium">Vendeur</th>
                          <th className="text-left py-2 font-medium">Boostages</th>
                          <th className="text-left py-2 font-medium">Revenus</th>
                          <th className="text-left py-2 font-medium">Taux de Conversion</th>
                          <th className="text-left py-2 font-medium">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topVendors.map((vendor, index) => (
                          <tr key={vendor.vendorId} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              <Badge variant={index < 3 ? 'default' : 'secondary'}>
                                #{index + 1}
                              </Badge>
                            </td>
                            <td className="py-2 font-medium">{vendor.vendorName}</td>
                            <td className="py-2">{vendor.boostages}</td>
                            <td className="py-2 font-semibold">{formatPrice(vendor.revenue)}</td>
                            <td className="py-2">{vendor.conversionRate}%</td>
                            <td className="py-2">
                              <Badge variant={getPerformanceBadgeVariant(vendor.performanceLabel)}>
                                {vendor.performanceLabel}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analyses géographiques et démographiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Performance par Région
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-sm text-gray-500 py-6">
                    Pas encore de données géographiques. Connectez vos rapports d'audience pour alimenter cette vue.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Analyse Démographique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-sm text-gray-500 py-6">
                    Les données démographiques seront disponibles dès que vous activerez le suivi d'audience.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export et rapports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export et Rapports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-nowrap gap-4 overflow-x-auto">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-4 w-4" />
                    Rapport Mensuel (PDF)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={handleExportCSV}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Données Brutes (CSV)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={handleExportPNG}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Graphiques (PNG)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={handleSendEmail}
                  >
                    <Mail className="h-4 w-4" />
                    Envoyer par Email
                  </Button>
                </div>
                
                {/* Informations supplémentaires */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informations sur les Rapports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Période sélectionnée:</p>
                      <p>{analyticsPeriod === '1month' ? '1 Mois' : 
                          analyticsPeriod === '3months' ? '3 Mois' :
                          analyticsPeriod === '6months' ? '6 Mois' : '1 An'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Dernière mise à jour:</p>
                      <p>{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="font-medium">Format disponible:</p>
                      <p>PDF, CSV, PNG, Email</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Configuration des Services */}
          <Dialog open={showServiceConfigModal} onOpenChange={handleServiceConfigModalChange}>
        <DialogContent className="flex max-w-2xl max-h-[85vh] flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Configuration du Service : {selectedService?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 pb-6">
            <div className="space-y-6">
              <div className="p-4 border border-gray-200 rounded-lg bg-white space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Nom du service</Label>
                    <Input
                      value={serviceForm.name}
                      onChange={(e) =>
                        setServiceForm(prev => ({
                          ...prev,
                          name: e.target.value
                        }))
                      }
                      placeholder="Nom affiché dans l'admin"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Prix de base ({currencyCode})</Label>
                    <Input
                      type="number"
                      value={serviceForm.base_price}
                      onChange={(e) =>
                        setServiceForm(prev => ({
                          ...prev,
                          base_price: Number.parseInt(e.target.value, 10) || 0
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Modèle de tarification</Label>
                    <Select
                      value={serviceForm.pricing_model}
                      onValueChange={(value) =>
                        setServiceForm(prev => ({
                          ...prev,
                          pricing_model: value as BoostingServiceType['pricing_model']
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_page_day">Page × Jour</SelectItem>
                        <SelectItem value="per_message_country">Message × Pays</SelectItem>
                        <SelectItem value="fixed">Forfait Fixe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div>
                      <Label className="text-sm font-medium">Statut du service</Label>
                      <p className="text-xs text-gray-500">Activer ou suspendre la disponibilité</p>
                    </div>
                    <Switch
                      checked={serviceForm.is_active}
                      onCheckedChange={(checked) =>
                        setServiceForm(prev => ({
                          ...prev,
                          is_active: checked
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm(prev => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                    placeholder="Décrivez le service et les bénéfices clients"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fonctionnalités (une par ligne)</Label>
                  <Textarea
                    value={serviceFeaturesInput}
                    onChange={(e) => {
                      const value = e.target.value
                      const features = value
                        .split('\n')
                        .map(f => f.trim())
                        .filter(Boolean)
                      setServiceFeaturesInput(value)
                      setServiceForm(prev => ({
                        ...prev,
                        features
                      }))
                    }}
                    placeholder="Ex: Mise en avant page d'accueil\nAudience ciblée AI"
                    rows={3}
                  />
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Tarification Boostage Pro</h4>
                  <Badge variant="outline" className="uppercase">
                    {serviceConfigTab === 'recommendation'
                      ? 'Recommandation'
                      : serviceConfigTab === 'banner'
                        ? 'Bannière'
                        : 'WhatsApp'}
                  </Badge>
                </div>

                {serviceConfigTab === 'recommendation' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Ajustez les tarifs par page pour la recommandation ciblée.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Page d'accueil ({currencyCode}/jour)</Label>
                        <Input
                          type="number"
                          value={serviceConfig.recommendation.homePage}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              recommendation: {
                                ...prev.recommendation,
                                homePage: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Page produit ({currencyCode}/jour)</Label>
                        <Input
                          type="number"
                          value={serviceConfig.recommendation.productPage}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              recommendation: {
                                ...prev.recommendation,
                                productPage: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Meilleures ventes ({currencyCode}/jour)</Label>
                        <Input
                          type="number"
                          value={serviceConfig.recommendation.bestSellers}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              recommendation: {
                                ...prev.recommendation,
                                bestSellers: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Nouvelles arrivées ({currencyCode}/jour)</Label>
                        <Input
                          type="number"
                          value={serviceConfig.recommendation.newArrivals}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              recommendation: {
                                ...prev.recommendation,
                                newArrivals: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Page vendeur ({currencyCode}/jour)</Label>
                        <Input
                          type="number"
                          value={serviceConfig.recommendation.vendorPage}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              recommendation: {
                                ...prev.recommendation,
                                vendorPage: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Réduction multi-pages (%)</Label>
                        <Input
                          type="number"
                          value={serviceConfig.recommendation.multiPageDiscount}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              recommendation: {
                                ...prev.recommendation,
                                multiPageDiscount: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {serviceConfigTab === 'banner' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Ajustez les multiplicateurs et frais annexes pour les bannières visuelles.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Multiplicateur par rapport à recommandation</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={serviceConfig.banner.multiplier}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              banner: {
                                ...prev.banner,
                                multiplier: Number.parseFloat(e.target.value) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Frais d'animation ({currencyCode}/jour)</Label>
                        <Input
                          type="number"
                          value={serviceConfig.banner.animationFee}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              banner: {
                                ...prev.banner,
                                animationFee: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {serviceConfigTab === 'whatsapp' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Définissez les coûts unitaires pour les campagnes WhatsApp.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Coût par message ({currencyCode})</Label>
                        <Input
                          type="number"
                          value={serviceConfig.whatsapp.baseCost}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              whatsapp: {
                                ...prev.whatsapp,
                                baseCost: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Majoration pays ({currencyCode})</Label>
                        <Input
                          type="number"
                          value={serviceConfig.whatsapp.countryCost}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              whatsapp: {
                                ...prev.whatsapp,
                                countryCost: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Majoration âge ({currencyCode})</Label>
                        <Input
                          type="number"
                          value={serviceConfig.whatsapp.ageCost}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              whatsapp: {
                                ...prev.whatsapp,
                                ageCost: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Majoration profession ({currencyCode})</Label>
                        <Input
                          type="number"
                          value={serviceConfig.whatsapp.professionCost}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              whatsapp: {
                                ...prev.whatsapp,
                                professionCost: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Majoration clients Probooster ({currencyCode})</Label>
                        <Input
                          type="number"
                          value={serviceConfig.whatsapp.proboosterCost}
                          onChange={(e) =>
                            setServiceConfig(prev => ({
                              ...prev,
                              whatsapp: {
                                ...prev.whatsapp,
                                proboosterCost: Number.parseInt(e.target.value, 10) || 0
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h4 className="font-semibold text-gray-900 mb-4">Options globales</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="autoReload"
                      checked={serviceConfig.autoReload}
                      onCheckedChange={(checked) =>
                        setServiceConfig(prev => ({
                          ...prev,
                          autoReload: checked
                        }))
                      }
                    />
                    <Label htmlFor="autoReload" className="text-sm">Recharge automatique</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="notifications"
                      checked={serviceConfig.notifications}
                      onCheckedChange={(checked) =>
                        setServiceConfig(prev => ({
                          ...prev,
                          notifications: checked
                        }))
                      }
                    />
                    <Label htmlFor="notifications" className="text-sm">Notifications</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button onClick={handleSaveServiceConfiguration} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={() => handleServiceConfigModalChange(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Détails des Services */}
      <Dialog open={showServiceDetailsModal} onOpenChange={setShowServiceDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Détails du Service : {selectedService?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            {selectedService && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedService.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informations techniques</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Type:</span>
                      <p className="font-medium capitalize">{selectedService.type}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Prix de base:</span>
                      <p className="font-medium text-green-600">{formatPrice(selectedService.base_price)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Modèle de tarification:</span>
                      <p className="font-medium">
                        {selectedService.pricing_model === 'per_page_day' ? 'Page × Jour' : 
                         selectedService.pricing_model === 'per_message_country' ? 'Message × Pays' : 'Fixe'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Statut:</span>
                      <Badge variant={selectedService.is_active ? "default" : "secondary"}>
                        {selectedService.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Fonctionnalités</h4>
                  <ul className="space-y-2">
                    {(selectedService.features ?? []).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statistiques d'utilisation</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {campaigns.filter(c => c.type === selectedService.type).length}
                      </p>
                      <p className="text-sm text-gray-600">Campagnes</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {campaigns.filter(c => c.type === selectedService.type && c.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-600">Actives</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatMoney(campaigns.filter(c => c.type === selectedService.type).reduce((sum, c) => sum + (c as any).totalCost, 0))}
                      </p>
                      <p className="text-sm text-gray-600">Revenus générés</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4 sticky bottom-0">
            <Button onClick={() => setShowServiceDetailsModal(false)} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Statistiques des Services */}
      <Dialog open={showServiceStatsModal} onOpenChange={setShowServiceStatsModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Statistiques du Service : {selectedService?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            {selectedService && (
              <div className="space-y-6">
                {/* KPIs principaux */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {campaigns.filter(c => c.type === selectedService.type).length}
                      </p>
                      <p className="text-sm text-gray-600">Total Campagnes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {campaigns.filter(c => c.type === selectedService.type && c.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-600">Campagnes Actives</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatMoney(campaigns.filter(c => c.type === selectedService.type).reduce((sum, c) => sum + (c as any).totalCost, 0))}
                      </p>
                      <p className="text-sm text-gray-600">Revenus</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {campaigns.filter(c => c.type === selectedService.type && c.performance).reduce((sum, c) => sum + (c.performance?.conversionRate || 0), 0) / 
                         Math.max(campaigns.filter(c => c.type === selectedService.type && c.performance).length, 1)}
                      </p>
                      <p className="text-sm text-gray-600">Taux de Conversion (%)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique d'évolution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution des campagnes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between">
                      {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'].map((month, index) => {
                        const monthCampaigns = campaigns.filter(c => c.type === selectedService.type)
                        const height = monthCampaigns.length > 0 ? Math.min(monthCampaigns.length * 20, 200) : 20
                        return (
                          <div key={month} className="flex flex-col items-center">
                            <div 
                              className="w-8 bg-blue-500 rounded-t" 
                              style={{height: `${height}px`}}
                            ></div>
                            <span className="text-xs text-gray-600 mt-2">{month}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Détails des campagnes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dernières campagnes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {campaigns
                        .filter(c => c.type === selectedService.type)
                        .slice(0, 5)
                        .map((campaign) => (
                          <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{campaign.vendorName}</p>
                              <p className="text-sm text-gray-600">
                                {campaign.start_date} - {campaign.end_date}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={
                                campaign.status === 'active' ? 'default' :
                                campaign.status === 'pending' ? 'secondary' :
                                campaign.status === 'paused' ? 'secondary' :
                                campaign.status === 'completed' ? 'outline' : 'destructive'
                              }>
                                {campaign.status === 'active' ? 'Active' :
                                 campaign.status === 'pending' ? 'En attente' :
                                 campaign.status === 'paused' ? 'En pause' :
                                 campaign.status === 'completed' ? 'Terminée' : 'Rejetée'}
                              </Badge>
                              <p className="text-sm font-medium mt-1">{formatPrice(campaign.total_cost)}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4 sticky bottom-0">
            <Button onClick={() => setShowServiceStatsModal(false)} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nouvelle Campagne */}
      <Dialog open={showNewCampaignFormModal} onOpenChange={setShowNewCampaignFormModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Créer une Nouvelle Campagne</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Configurez et lancez une nouvelle campagne de boostage pour un vendeur
            </p>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              {/* Sélection du vendeur et Type de service sur la même ligne */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Vendeur</Label>
                  <Select value={newCampaignData.vendorId} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, vendorId: value, productId: '' }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un vendeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {(vendor as any).display_name || (vendor as any).email || vendor.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Type de service</Label>
                  <Select
                    value={newCampaignData.serviceType}
                    onValueChange={(value) => setNewCampaignData(prev => {
                      const svc = services.find(s => (s as any).type === value)
                      return { ...prev, serviceType: value as any, serviceId: svc?.id || '' }
                    })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommendation">Recommandation Ciblée</SelectItem>
                      <SelectItem value="banner">Bannière Visuelle</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>



              {/* Options spécifiques au service Recommandation */}
              {newCampaignData.serviceType === 'recommendation' && (
                <>
                  {/* Choix du produit */}
                  <div>
                    <Label className="text-sm font-medium">Produit recommandé</Label>
                    <Select value={newCampaignData.productId} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, productId: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {(vendorProducts[newCampaignData.vendorId] || []).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatPrice(product.price ?? 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calendrier avec relance IA */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="aiReload"
                        checked={newCampaignData.aiReload}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, aiReload: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="aiReload" className="text-sm font-medium">Calendrier précis avec relance automatique par IA</Label>
                    </div>
                    
                    {newCampaignData.aiReload && (
                      <div>
                        <Label className="text-sm font-medium">Fréquence de relance</Label>
                        <Select
                          value={newCampaignData.aiReloadFrequency}
                          onValueChange={(value) =>
                            setNewCampaignData(prev => ({
                              ...prev,
                              aiReloadFrequency: value as typeof prev.aiReloadFrequency
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Quotidienne</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                            <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                            <SelectItem value="monthly">Mensuelle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Options spécifiques au service Bannière */}
              {newCampaignData.serviceType === 'banner' && (
                <div className="space-y-4">
                  {/* Upload d'image de bannière */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">Image de Bannière</h4>
                    
                    {!newCampaignData.bannerImage ? (
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          id="bannerImage"
                          accept="image/*"
                          onChange={handleBannerImageUpload}
                          className="hidden"
                        />
                        <label htmlFor="bannerImage" className="cursor-pointer">
                          <div className="flex flex-col items-center space-y-2">
                            <ImageIcon className="h-12 w-12 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                Cliquez pour ajouter une image
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                JPG, PNG, GIF jusqu'à 5MB
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <img
                              src={URL.createObjectURL(newCampaignData.bannerImage)}
                              alt="Aperçu bannière"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {newCampaignData.bannerImage.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(newCampaignData.bannerImage.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveBannerImage}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Titre accrocheur */}
                  <div>
                    <Label className="text-sm font-medium">Titre accrocheur</Label>
                    <Input
                      value={newCampaignData.bannerTitle}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, bannerTitle: e.target.value }))}
                      placeholder="Ex: Offre exceptionnelle -50% !"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Titre court et percutant pour attirer l'attention
                    </p>
                  </div>

                  {/* Description courte */}
                  <div>
                    <Label className="text-sm font-medium">Description courte</Label>
                    <Textarea
                      value={newCampaignData.shortDescription}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, shortDescription: e.target.value }))}
                      placeholder="Description brève et impactante de l'offre"
                      rows={2}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Description concise qui complète le titre (max 100 caractères)
                    </p>
                  </div>

                  {/* Informations sur la configuration */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Configuration Bannière</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Affichage sur les pages sélectionnées</li>
                      <li>• Animations discrètes et optimisées</li>
                      <li>• Optimisation automatique de la conversion</li>
                      <li>• Responsive design pour tous les appareils</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Options spécifiques au service WhatsApp - Modal vendeur */}
              {newCampaignData.serviceType === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Configuration WhatsApp Marketing</h4>
                    <p className="text-sm text-green-700">
                      Configurez votre demande de boostage. Elle sera envoyée en attente d'approbation par l'administrateur.
                    </p>
                  </div>

                  {/* Configuration en 2 colonnes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nombre de cibles souhaitées</Label>
                      <Input
                        type="number"
                        value={newCampaignData.whatsappTargetCount}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappTargetCount: parseInt(e.target.value) || 100 }))}
                        min="1"
                        max="10000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ciblage pays</Label>
                      <Select value={newCampaignData.whatsappCountryTarget} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, whatsappCountryTarget: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les pays</SelectItem>
                          
                          {/* Afrique */}
                          <SelectItem value="africa" disabled className="font-semibold text-gray-500">🌍 AFRIQUE</SelectItem>
                          <SelectItem value="dz">🇩🇿 Algérie</SelectItem>
                          <SelectItem value="ao">🇦🇴 Angola</SelectItem>
                          <SelectItem value="bj">🇧🇯 Bénin</SelectItem>
                          <SelectItem value="bw">🇧🇼 Botswana</SelectItem>
                          <SelectItem value="bf">🇧🇫 Burkina Faso</SelectItem>
                          <SelectItem value="bi">🇧🇮 Burundi</SelectItem>
                          <SelectItem value="cm">🇨🇲 Cameroun</SelectItem>
                          <SelectItem value="cv">🇨🇻 Cap-Vert</SelectItem>
                          <SelectItem value="cf">🇨🇫 République centrafricaine</SelectItem>
                          <SelectItem value="td">🇹🇩 Tchad</SelectItem>
                          <SelectItem value="km">🇰🇲 Comores</SelectItem>
                          <SelectItem value="cg">🇨🇬 Congo</SelectItem>
                          <SelectItem value="cd">🇨🇩 RD Congo</SelectItem>
                          <SelectItem value="ci">🇨🇮 Côte d'Ivoire</SelectItem>
                          <SelectItem value="dj">🇩🇯 Djibouti</SelectItem>
                          <SelectItem value="eg">🇪🇬 Égypte</SelectItem>
                          <SelectItem value="gq">🇬🇶 Guinée équatoriale</SelectItem>
                          <SelectItem value="er">🇪🇷 Érythrée</SelectItem>
                          <SelectItem value="et">🇪🇹 Éthiopie</SelectItem>
                          <SelectItem value="ga">🇬🇦 Gabon</SelectItem>
                          <SelectItem value="gm">🇬🇲 Gambie</SelectItem>
                          <SelectItem value="gh">🇬🇭 Ghana</SelectItem>
                          <SelectItem value="gn">🇬🇳 Guinée</SelectItem>
                          <SelectItem value="gw">🇬🇼 Guinée-Bissau</SelectItem>
                          <SelectItem value="ke">🇰🇪 Kenya</SelectItem>
                          <SelectItem value="ls">🇱🇸 Lesotho</SelectItem>
                          <SelectItem value="lr">🇱🇷 Liberia</SelectItem>
                          <SelectItem value="ly">🇱🇾 Libye</SelectItem>
                          <SelectItem value="mg">🇲🇬 Madagascar</SelectItem>
                          <SelectItem value="mw">🇲🇼 Malawi</SelectItem>
                          <SelectItem value="ml">🇲🇱 Mali</SelectItem>
                          <SelectItem value="mr">🇲🇷 Mauritanie</SelectItem>
                          <SelectItem value="mu">🇲🇺 Maurice</SelectItem>
                          <SelectItem value="ma">🇲🇦 Maroc</SelectItem>
                          <SelectItem value="mz">🇲🇿 Mozambique</SelectItem>
                          <SelectItem value="na">🇳🇦 Namibie</SelectItem>
                          <SelectItem value="ne">🇳🇪 Niger</SelectItem>
                          <SelectItem value="ng">🇳🇬 Nigeria</SelectItem>
                          <SelectItem value="rw">🇷🇼 Rwanda</SelectItem>
                          <SelectItem value="st">🇸🇹 Sao Tomé-et-Principe</SelectItem>
                          <SelectItem value="sn">🇸🇳 Sénégal</SelectItem>
                          <SelectItem value="sc">🇸🇨 Seychelles</SelectItem>
                          <SelectItem value="sl">🇸🇱 Sierra Leone</SelectItem>
                          <SelectItem value="so">🇸🇴 Somalie</SelectItem>
                          <SelectItem value="za">🇿🇦 Afrique du Sud</SelectItem>
                          <SelectItem value="ss">🇸🇸 Soudan du Sud</SelectItem>
                          <SelectItem value="sd">🇸🇩 Soudan</SelectItem>
                          <SelectItem value="sz">🇸🇿 Eswatini</SelectItem>
                          <SelectItem value="tz">🇹🇿 Tanzanie</SelectItem>
                          <SelectItem value="tg">🇹🇬 Togo</SelectItem>
                          <SelectItem value="tn">🇹🇳 Tunisie</SelectItem>
                          <SelectItem value="ug">🇺🇬 Ouganda</SelectItem>
                          <SelectItem value="zm">🇿🇲 Zambie</SelectItem>
                          <SelectItem value="zw">🇿🇼 Zimbabwe</SelectItem>
                          
                          {/* Amérique */}
                          <SelectItem value="america" disabled className="font-semibold text-gray-500">🌎 AMÉRIQUE</SelectItem>
                          <SelectItem value="ar">🇦🇷 Argentine</SelectItem>
                          <SelectItem value="bo">🇧🇴 Bolivie</SelectItem>
                          <SelectItem value="br">🇧🇷 Brésil</SelectItem>
                          <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                          <SelectItem value="cl">🇨🇱 Chili</SelectItem>
                          <SelectItem value="co">🇨🇴 Colombie</SelectItem>
                          <SelectItem value="cr">🇨🇷 Costa Rica</SelectItem>
                          <SelectItem value="cu">🇨🇺 Cuba</SelectItem>
                          <SelectItem value="do">🇩🇴 République dominicaine</SelectItem>
                          <SelectItem value="ec">🇪🇨 Équateur</SelectItem>
                          <SelectItem value="sv">🇸🇻 El Salvador</SelectItem>
                          <SelectItem value="gt">🇬🇹 Guatemala</SelectItem>
                          <SelectItem value="gy">🇬🇾 Guyana</SelectItem>
                          <SelectItem value="ht">🇭🇹 Haïti</SelectItem>
                          <SelectItem value="hn">🇭🇳 Honduras</SelectItem>
                          <SelectItem value="jm">🇯🇲 Jamaïque</SelectItem>
                          <SelectItem value="mx">🇲🇽 Mexique</SelectItem>
                          <SelectItem value="ni">🇳🇮 Nicaragua</SelectItem>
                          <SelectItem value="pa">🇵🇦 Panama</SelectItem>
                          <SelectItem value="py">🇵🇾 Paraguay</SelectItem>
                          <SelectItem value="pe">🇵🇪 Pérou</SelectItem>
                          <SelectItem value="sr">🇸🇷 Suriname</SelectItem>
                          <SelectItem value="uy">🇺🇾 Uruguay</SelectItem>
                          <SelectItem value="us">🇺🇸 États-Unis</SelectItem>
                          <SelectItem value="ve">🇻🇪 Venezuela</SelectItem>
                          
                          {/* Asie */}
                          <SelectItem value="asia" disabled className="font-semibold text-gray-500">🌏 ASIE</SelectItem>
                          <SelectItem value="af">🇦🇫 Afghanistan</SelectItem>
                          <SelectItem value="am">🇦🇲 Arménie</SelectItem>
                          <SelectItem value="az">🇦🇿 Azerbaïdjan</SelectItem>
                          <SelectItem value="bh">🇧🇭 Bahreïn</SelectItem>
                          <SelectItem value="bd">🇧🇩 Bangladesh</SelectItem>
                          <SelectItem value="bt">🇧🇹 Bhoutan</SelectItem>
                          <SelectItem value="bn">🇧🇳 Brunei</SelectItem>
                          <SelectItem value="kh">🇰🇭 Cambodge</SelectItem>
                          <SelectItem value="cn">🇨🇳 Chine</SelectItem>
                          <SelectItem value="cy">🇨🇾 Chypre</SelectItem>
                          <SelectItem value="ge">🇬🇪 Géorgie</SelectItem>
                          <SelectItem value="in">🇮🇳 Inde</SelectItem>
                          <SelectItem value="id">🇮🇩 Indonésie</SelectItem>
                          <SelectItem value="ir">🇮🇷 Iran</SelectItem>
                          <SelectItem value="iq">🇮🇶 Irak</SelectItem>
                          <SelectItem value="il">🇮🇱 Israël</SelectItem>
                          <SelectItem value="jp">🇯🇵 Japon</SelectItem>
                          <SelectItem value="jo">🇯🇴 Jordanie</SelectItem>
                          <SelectItem value="kz">🇰🇿 Kazakhstan</SelectItem>
                          <SelectItem value="kw">🇰🇼 Koweït</SelectItem>
                          <SelectItem value="kg">🇰🇬 Kirghizistan</SelectItem>
                          <SelectItem value="la">🇱🇦 Laos</SelectItem>
                          <SelectItem value="lb">🇱🇧 Liban</SelectItem>
                          <SelectItem value="my">🇲🇾 Malaisie</SelectItem>
                          <SelectItem value="mv">🇲🇻 Maldives</SelectItem>
                          <SelectItem value="mn">🇲🇳 Mongolie</SelectItem>
                          <SelectItem value="mm">🇲🇲 Myanmar</SelectItem>
                          <SelectItem value="np">🇳🇵 Népal</SelectItem>
                          <SelectItem value="om">🇴🇲 Oman</SelectItem>
                          <SelectItem value="pk">🇵🇰 Pakistan</SelectItem>
                          <SelectItem value="ph">🇵🇭 Philippines</SelectItem>
                          <SelectItem value="qa">🇶🇦 Qatar</SelectItem>
                          <SelectItem value="sa">🇸🇦 Arabie saoudite</SelectItem>
                          <SelectItem value="sg">🇸🇬 Singapour</SelectItem>
                          <SelectItem value="lk">🇱🇰 Sri Lanka</SelectItem>
                          <SelectItem value="sy">🇸🇾 Syrie</SelectItem>
                          <SelectItem value="tw">🇹🇼 Taïwan</SelectItem>
                          <SelectItem value="tj">🇹🇯 Tadjikistan</SelectItem>
                          <SelectItem value="th">🇹🇭 Thaïlande</SelectItem>
                          <SelectItem value="tr">🇹🇷 Turquie</SelectItem>
                          <SelectItem value="tm">🇹🇲 Turkménistan</SelectItem>
                          <SelectItem value="ae">🇦🇪 Émirats arabes unis</SelectItem>
                          <SelectItem value="uz">🇺🇿 Ouzbékistan</SelectItem>
                          <SelectItem value="vn">🇻🇳 Vietnam</SelectItem>
                          <SelectItem value="ye">🇾🇪 Yémen</SelectItem>
                          
                          {/* Europe */}
                          <SelectItem value="europe" disabled className="font-semibold text-gray-500">🇪🇺 EUROPE</SelectItem>
                          <SelectItem value="al">🇦🇱 Albanie</SelectItem>
                          <SelectItem value="ad">🇦🇩 Andorre</SelectItem>
                          <SelectItem value="at">🇦🇹 Autriche</SelectItem>
                          <SelectItem value="be">🇧🇪 Belgique</SelectItem>
                          <SelectItem value="ba">🇧🇦 Bosnie-Herzégovine</SelectItem>
                          <SelectItem value="bg">🇧🇬 Bulgarie</SelectItem>
                          <SelectItem value="hr">🇭🇷 Croatie</SelectItem>
                          <SelectItem value="cz">🇨🇿 République tchèque</SelectItem>
                          <SelectItem value="dk">🇩🇰 Danemark</SelectItem>
                          <SelectItem value="ee">🇪🇪 Estonie</SelectItem>
                          <SelectItem value="fi">🇫🇮 Finlande</SelectItem>
                          <SelectItem value="fr">🇫🇷 France</SelectItem>
                          <SelectItem value="de">🇩🇪 Allemagne</SelectItem>
                          <SelectItem value="gr">🇬🇷 Grèce</SelectItem>
                          <SelectItem value="hu">🇭🇺 Hongrie</SelectItem>
                          <SelectItem value="is">🇮🇸 Islande</SelectItem>
                          <SelectItem value="ie">🇮🇪 Irlande</SelectItem>
                          <SelectItem value="it">🇮🇹 Italie</SelectItem>
                          <SelectItem value="lv">🇱🇻 Lettonie</SelectItem>
                          <SelectItem value="li">🇱🇮 Liechtenstein</SelectItem>
                          <SelectItem value="lt">🇱🇹 Lituanie</SelectItem>
                          <SelectItem value="lu">🇱🇺 Luxembourg</SelectItem>
                          <SelectItem value="mt">🇲🇹 Malte</SelectItem>
                          <SelectItem value="md">🇲🇩 Moldavie</SelectItem>
                          <SelectItem value="mc">🇲🇨 Monaco</SelectItem>
                          <SelectItem value="me">🇲🇪 Monténégro</SelectItem>
                          <SelectItem value="nl">🇳🇱 Pays-Bas</SelectItem>
                          <SelectItem value="mk">🇲🇰 Macédoine du Nord</SelectItem>
                          <SelectItem value="no">🇳🇴 Norvège</SelectItem>
                          <SelectItem value="pl">🇵🇱 Pologne</SelectItem>
                          <SelectItem value="pt">🇵🇹 Portugal</SelectItem>
                          <SelectItem value="ro">🇷🇴 Roumanie</SelectItem>
                          <SelectItem value="ru">🇷🇺 Russie</SelectItem>
                          <SelectItem value="sm">🇸🇲 Saint-Marin</SelectItem>
                          <SelectItem value="rs">🇷🇸 Serbie</SelectItem>
                          <SelectItem value="sk">🇸🇰 Slovaquie</SelectItem>
                          <SelectItem value="si">🇸🇮 Slovénie</SelectItem>
                          <SelectItem value="es">🇪🇸 Espagne</SelectItem>
                          <SelectItem value="se">🇸🇪 Suède</SelectItem>
                          <SelectItem value="ch">🇨🇭 Suisse</SelectItem>
                          <SelectItem value="ua">🇺🇦 Ukraine</SelectItem>
                          <SelectItem value="gb">🇬🇧 Royaume-Uni</SelectItem>
                          <SelectItem value="va">🇻🇦 Vatican</SelectItem>
                          
                          {/* Océanie */}
                          <SelectItem value="oceania" disabled className="font-semibold text-gray-500">🌊 OCÉANIE</SelectItem>
                          <SelectItem value="au">🇦🇺 Australie</SelectItem>
                          <SelectItem value="fj">🇫🇯 Fidji</SelectItem>
                          <SelectItem value="ki">🇰🇮 Kiribati</SelectItem>
                          <SelectItem value="mh">🇲🇭 Îles Marshall</SelectItem>
                          <SelectItem value="fm">🇫🇲 Micronésie</SelectItem>
                          <SelectItem value="nr">🇳🇷 Nauru</SelectItem>
                          <SelectItem value="nz">🇳🇿 Nouvelle-Zélande</SelectItem>
                          <SelectItem value="pw">🇵🇼 Palaos</SelectItem>
                          <SelectItem value="pg">🇵🇬 Papouasie-Nouvelle-Guinée</SelectItem>
                          <SelectItem value="ws">🇼🇸 Samoa</SelectItem>
                          <SelectItem value="sb">🇸🇧 Îles Salomon</SelectItem>
                          <SelectItem value="to">🇹🇴 Tonga</SelectItem>
                          <SelectItem value="tv">🇹🇻 Tuvalu</SelectItem>
                          <SelectItem value="vu">🇻🇺 Vanuatu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Ciblage âge</Label>
                      <Select value={newCampaignData.whatsappAgeTarget} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, whatsappAgeTarget: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous âges</SelectItem>
                          <SelectItem value="18-25">18-25 ans</SelectItem>
                          <SelectItem value="26-35">26-35 ans</SelectItem>
                          <SelectItem value="36-45">36-45 ans</SelectItem>
                          <SelectItem value="46-55">46-55 ans</SelectItem>
                          <SelectItem value="55+">55+ ans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ciblage profession</Label>
                      <Select value={newCampaignData.whatsappProfessionTarget} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, whatsappProfessionTarget: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes professions</SelectItem>
                          <SelectItem value="etudiant">Étudiant</SelectItem>
                          <SelectItem value="salarie">Salarié</SelectItem>
                          <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                          <SelectItem value="retraite">Retraité</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                          <SelectItem value="custom">Profession personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Champ pour la profession personnalisée */}
                      {newCampaignData.whatsappProfessionTarget === 'custom' && (
                        <div className="mt-2">
                          <Input
                            placeholder="Entrez votre profession"
                            value={newCampaignData.whatsappCustomProfession}
                            onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappCustomProfession: e.target.value }))}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Ex: Médecin, Avocat, Architecte, etc.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nouvelle option : Ciblé clients de Probooster */}
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="target-probooster-clients-admin"
                        checked={newCampaignData.targetProboosterClients || false}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, targetProboosterClients: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="target-probooster-clients-admin" className="text-sm font-medium">Ciblé clients de Probooster</Label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Permet de cibler spécifiquement les utilisateurs actifs de la plateforme Probooster
                    </p>
                  </div>

                  {/* Image du produit */}
                  <div>
                    <Label className="text-sm font-medium">Image du produit</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="whatsappProductImage"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setNewCampaignData(prev => ({ ...prev, whatsappProductImage: file }))
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="whatsappProductImage" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                          <div className="flex items-center justify-center space-x-2">
                            <ImageIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Choisir un fichier</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {newCampaignData.whatsappProductImage ? newCampaignData.whatsappProductImage.name : 'Aucun fichier choisi'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Titre du message */}
                  <div>
                    <Label className="text-sm font-medium">Titre du message*</Label>
                    <Input
                      value={newCampaignData.whatsappMessageTitle}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappMessageTitle: e.target.value }))}
                      placeholder="Ex: Découvrez notre nouveau produit !"
                      className="mt-1"
                    />
                  </div>

                  {/* Description du produit */}
                  <div>
                    <Label className="text-sm font-medium">Description du produit</Label>
                    <Input
                      value={newCampaignData.whatsappProductDescription}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappProductDescription: e.target.value }))}
                      placeholder="Ex: Produit de qualité exceptionnelle à prix réduit"
                      className="mt-1"
                    />
                  </div>

                  {/* Lien direct vers le produit et Numéro WhatsApp expéditeur sur la même ligne */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Lien direct vers le produit</Label>
                      <Input
                        value={newCampaignData.whatsappProductLink}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappProductLink: e.target.value }))}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Numéro WhatsApp expéditeur *</Label>
                      <Input
                        value={newCampaignData.whatsappSenderNumber}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappSenderNumber: e.target.value }))}
                        placeholder="+225 01234567"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Numéro de téléphone avec code pays (ex: +225 pour la Côte d'Ivoire)
                      </p>
                    </div>
                  </div>

                  {/* Section Coût estimé WhatsApp */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-medium text-purple-900 mb-3">Coût estimé WhatsApp</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Nombre de cibles:</span>
                        <span className="text-sm font-medium">{newCampaignData.whatsappTargetCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Coût par cible:</span>
                        <span className="text-sm font-medium">{formatMoney(0.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      {newCampaignData.targetProboosterClients && (
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700">Bonus ciblage Probooster:</span>
                          <span className="text-sm font-medium text-green-600">+{formatMoney(0.1, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-purple-200 pt-2">
                        <span className="text-sm font-bold text-purple-900">Total:</span>
                        <span className="text-sm font-bold text-purple-900">
                          {newCampaignData.targetProboosterClients 
                            ? ((newCampaignData.whatsappTargetCount * 0.6).toFixed(0))
                            : (newCampaignData.whatsappTargetCount * 0.5).toFixed(0)
                          } {currencyCode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration générale - masquée pour WhatsApp */}
              {newCampaignData.serviceType !== 'whatsapp' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Budget ({currencyCode})</Label>
                      <Input
                        type="number"
                        value={newCampaignData.budget}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                        placeholder="5000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Budget minimum. Le vendeur pourra l'augmenter dans son tableau de bord.
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de début</Label>
                      <Input
                        type="date"
                        value={newCampaignData.startDate}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de fin</Label>
                      <Input
                        type="date"
                        value={newCampaignData.endDate}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, endDate: e.target.value }))}
                        min={newCampaignData.startDate}
                      />
                    </div>
                  </div>

                  {/* Description - remplacée par Description courte pour les bannières */}
                  {newCampaignData.serviceType !== 'banner' && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        value={newCampaignData.description}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description de la campagne"
                        rows={3}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Options de paiement */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-3">Options de Paiement</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requirePayment"
                      checked={newCampaignData.requirePayment}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, requirePayment: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="requirePayment" className="text-sm font-medium">Appliquer le paiement si le vendeur n'a pas encore réglé</Label>
                  </div>
                  
                  {newCampaignData.requirePayment && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Méthode de paiement</Label>
                        <Select
                          value={newCampaignData.paymentMethod}
                          onValueChange={(value) =>
                            setNewCampaignData(prev => ({
                              ...prev,
                              paymentMethod: value as typeof prev.paymentMethod
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="feexpay">FeexPay (Mobile Money + Carte Bancaire)</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money uniquement</SelectItem>
                            <SelectItem value="card">Carte Bancaire uniquement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <p className="text-sm text-gray-700">
                          <strong>FeexPay</strong> : Agrégateur de paiement acceptant Mobile Money (Moov, MTN, Orange) 
                          et cartes bancaires (Visa, Mastercard) pour un règlement sécurisé.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!newCampaignData.requirePayment && (
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm text-green-700">
                        <strong>Campagne gratuite</strong> : La campagne démarrera automatiquement 
                        sans paiement requis. Aucune approbation supplémentaire nécessaire.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section de calcul automatique des coûts */}
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-3">Calculateur de Coûts Estimés</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nombre de jours</Label>
                    <Input 
                      type="number" 
                      value={costCalculation.days || 7}
                      onChange={(e) => setCostCalculation(prev => ({
                        ...prev,
                        days: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label>Nombre de pages (Recommandation)</Label>
                    <Input 
                      type="number" 
                      value={costCalculation.pages || 3}
                      onChange={(e) => setCostCalculation(prev => ({
                        ...prev,
                        pages: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      max="5"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label>Nombre de cibles WhatsApp</Label>
                    <Input 
                      type="number" 
                      value={costCalculation.whatsappTargets || 100}
                      onChange={(e) => setCostCalculation(prev => ({
                        ...prev,
                        whatsappTargets: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      className="mt-1" 
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded border">
                  <h5 className="font-medium mb-2">Coûts estimés :</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Recommandation ({costCalculation.pages} pages, {costCalculation.days} jours):</span>
                      <span className="font-medium">
                        {formatMoney(calculateRecommendationCost())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bannière (avec multiplicateur):</span>
                      <span className="font-medium">
                        {formatMoney(calculateBannerCost())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>WhatsApp ({costCalculation.whatsappTargets} cibles):</span>
                      <span className="font-medium">
                        {formatMoney(calculateWhatsAppCost())}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Total estimé:</span>
                      <span className="font-bold text-blue-600">
                        {formatMoney(calculateTotalCost())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button 
                  variant="outline"
                  onClick={handleResetToDefaults}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser aux valeurs par défaut
                </Button>
                <Button 
                  onClick={handleSaveServiceConfig}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Sauvegarder la Configuration
                </Button>
              </div>
            </div>
          </div>
          
          {/* Boutons d'action - Corrigés pour être bien visibles */}
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4 sticky bottom-0">
            <Button onClick={handleCreateCampaignFromForm} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Créer la Campagne
            </Button>
            <Button variant="outline" onClick={() => setShowNewCampaignFormModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'Export */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Exporter les Données Marketing</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Format d'export</Label>
                <Select value={exportData.format} onValueChange={(value) => setExportData(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Période</Label>
                <Select value={exportData.period} onValueChange={(value) => setExportData(prev => ({ ...prev, period: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 Mois</SelectItem>
                    <SelectItem value="3months">3 Mois</SelectItem>
                    <SelectItem value="6months">6 Mois</SelectItem>
                    <SelectItem value="1year">1 An</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeCharts"
                    checked={exportData.includeCharts}
                    onChange={(e) => setExportData(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includeCharts" className="text-sm">Inclure les graphiques</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeDetails"
                    checked={exportData.includeDetails}
                    onChange={(e) => setExportData(prev => ({ ...prev, includeDetails: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includeDetails" className="text-sm">Inclure les détails complets</Label>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Résumé de l'export</h4>
                <div className="text-sm text-blue-800">
                  <p>• Format: {exportData.format.toUpperCase()}</p>
                  <p>• Période: {exportData.period === '1month' ? '1 Mois' : 
                                   exportData.period === '3months' ? '3 Mois' : 
                                   exportData.period === '6months' ? '6 Mois' : '1 An'}</p>
                  <p>• Graphiques: {exportData.includeCharts ? 'Inclus' : 'Non inclus'}</p>
                  <p>• Détails: {exportData.includeDetails ? 'Complets' : 'Résumés'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button onClick={handlePerformExport} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Exporter
            </Button>
            <Button variant="outline" onClick={() => setShowExportModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nouvelle Promotion */}
      <Dialog open={showNewPromotionModal} onOpenChange={setShowNewPromotionModal}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full p-0 overflow-hidden">
          <div className="flex flex-col max-h-[90vh] bg-white">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
              <DialogTitle className="text-lg font-semibold">Créer une nouvelle promotion</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Configurez votre promotion avec tous les paramètres nécessaires.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="promo-name">Nom de la promotion *</Label>
                  <Input
                    id="promo-name"
                    value={promotionForm.name}
                    onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                    placeholder="Ex: ÉTÉ2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-type">Type de promotion</Label>
                  <Select
                    value={promotionForm.type}
                    onValueChange={(value) => setPromotionForm({ ...promotionForm, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Code promo</SelectItem>
                      <SelectItem value="reduction">Réduction</SelectItem>
                      <SelectItem value="flash">Flash sale</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-type">Type de réduction</Label>
                  <Select
                    value={promotionForm.discountType}
                    onValueChange={(value) => setPromotionForm({ ...promotionForm, discountType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="fixed">Montant fixe</SelectItem>
                      <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-value">Valeur de la réduction *</Label>
                  <Input
                    id="discount-value"
                    type="number"
                    value={promotionForm.discountValue}
                    onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: Number(e.target.value) })}
                    placeholder="20 ou 5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Date de début *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={promotionForm.startDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Date de fin *</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={promotionForm.endDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-amount">Montant minimum ({currencyCode})</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    value={promotionForm.minAmount}
                    onChange={(e) => setPromotionForm({ ...promotionForm, minAmount: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usage-limit">Limite d'utilisation</Label>
                  <Input
                    id="usage-limit"
                    type="number"
                    value={promotionForm.usageLimit}
                    onChange={(e) => setPromotionForm({ ...promotionForm, usageLimit: Number(e.target.value) })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">Conditions spéciales</Label>
                <Textarea
                  id="conditions"
                  value={promotionForm.conditions}
                  onChange={(e) => setPromotionForm({ ...promotionForm, conditions: e.target.value })}
                  placeholder={`Ex: Minimum 5000 ${currencyCode} d'achat, valable sur tous les produits`}
                  rows={4}
                />
              </div>

              <div className="p-5 border border-gray-200 rounded-xl space-y-6 bg-gray-50 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-gray-900">Ciblage de la promotion</h4>
                  <p className="text-xs text-gray-500">Sélectionnez les audiences concernées par cette offre.</p>
                </div>

                <MultiSelectField
                  label="Vendeurs ciblés"
                  placeholder="Tous les vendeurs"
                  emptyMessage="Aucun vendeur trouvé"
                  options={vendorOptions}
                  selectedIds={promotionForm.applicableVendors}
                  onChange={(next) => setPromotionForm((prev) => ({
                    ...prev,
                    applicableVendors: next
                  }))}
                  searchPlaceholder="Rechercher un vendeur"
                />

                <MultiSelectField
                  label="Catégories ciblées"
                  placeholder="Toutes les catégories"
                  emptyMessage="Aucune catégorie trouvée"
                  options={categoryOptionList}
                  selectedIds={promotionForm.applicableCategories}
                  onChange={(next) => setPromotionForm((prev) => ({
                    ...prev,
                    applicableCategories: next
                  }))}
                  searchPlaceholder="Rechercher une catégorie"
                />

                <MultiSelectField
                  label="Tags (produits)"
                  placeholder="Tous les tags"
                  emptyMessage="Aucun tag trouvé"
                  options={promotionTagOptions}
                  selectedIds={promotionForm.applicableTags}
                  onChange={(next) => setPromotionForm((prev) => ({
                    ...prev,
                    applicableTags: next
                  }))}
                  searchPlaceholder="Rechercher un tag"
                />

                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <Label className="text-sm font-medium">Produits ciblés</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Filtrer par vendeur</span>
                      <Select value={productVendorFilter} onValueChange={setProductVendorFilter}>
                        <SelectTrigger className="w-full md:w-60">
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.display_name || v.email || v.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <MultiSelectField
                    placeholder="Tous les produits"
                    emptyMessage="Aucun produit trouvé"
                    options={productOptionList}
                    selectedIds={promotionForm.applicableProducts}
                    onChange={(next) => setPromotionForm((prev) => ({
                      ...prev,
                      applicableProducts: next
                    }))}
                    searchPlaceholder="Rechercher un produit"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-white">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewPromotionModal(false)
                  resetPromotionForm()
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => handleCreatePromotion(buildPromotionPayload())}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                disabled={loading}
              >
                Créer la promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Détails de Campagne */}
      <Dialog open={showCampaignDetailsModal} onOpenChange={setShowCampaignDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Détails de la Campagne</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {selectedCampaign && (
              <div className="space-y-6">
                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span>{selectedCampaign.vendorName}</span>
                      {getStatusBadge(selectedCampaign.status)}
                      <Badge variant="outline" className="capitalize">
                        {selectedCampaign.type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date de début</Label>
                        <p className="font-medium">{(selectedCampaign as any).start_date}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date de fin</Label>
                        <p className="font-medium">{(selectedCampaign as any).end_date}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Durée</Label>
                        <p className="font-medium">{selectedCampaign.duration} jours</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Coût total</Label>
                        <p className="font-medium text-green-600">{formatPrice((selectedCampaign as any).totalCost)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pages cibles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pages Cibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {((selectedCampaign as any).target_pages || []).map((page: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {page === 'home' ? 'Accueil' : 
                           page === 'product' ? 'Produit' : 
                           page === 'best_sellers' ? 'Meilleures Ventes' : 
                           page === 'new_arrivals' ? 'Nouvelles Arrivées' : 
                           page === 'vendeur' ? 'Vendeur' : page}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance (si disponible) */}
                {selectedCampaign.performance && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance de la Campagne</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedCampaign.performance.impressions.toLocaleString()}
                          </p>
                          <p className="text-sm text-blue-800">Impressions</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedCampaign.performance.clicks.toLocaleString()}
                          </p>
                          <p className="text-sm text-green-800">Clics</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            {selectedCampaign.performance.ctr}%
                          </p>
                          <p className="text-sm text-purple-800">CTR</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">
                            {selectedCampaign.performance.conversions}
                          </p>
                          <p className="text-sm text-orange-800">Conversions</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Métriques détaillées</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Taux de conversion:</span>
                            <p className="font-medium">{selectedCampaign.performance.conversionRate}%</p>
                          </div>
                          <div>
                            <span className="text-gray-600">ROAS estimé:</span>
                            <p className="font-medium">
                              {selectedCampaign.performance.conversions > 0 
                                ? ((selectedCampaign.performance.conversions * 75000) / (selectedCampaign as any).totalCost).toFixed(2)
                                : '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informations de paiement */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de Paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={selectedCampaign.paymentStatus === 'paid' ? 'default' : 
                                selectedCampaign.paymentStatus === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {selectedCampaign.paymentStatus === 'paid' ? 'Payé' : 
                         selectedCampaign.paymentStatus === 'pending' ? 'En attente' : 'Échoué'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Créé le {selectedCampaign.createdAt}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCampaignDetailsModal(false)}
              className="flex-1"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition de Promotion */}
      <Dialog open={showEditPromotionModal} onOpenChange={setShowEditPromotionModal}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full p-0 overflow-hidden">
          <div className="flex flex-col max-h-[90vh] bg-white">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
              <DialogTitle className="text-lg font-semibold">Modifier la promotion</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Mettez à jour les paramètres de cette promotion sans perdre de vue le ciblage.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-promo-name">Nom de la promotion *</Label>
                  <Input
                    id="edit-promo-name"
                    value={promotionForm.name}
                    onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                    placeholder="Ex: ÉTÉ2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-promo-type">Type de promotion</Label>
                  <Select
                    value={promotionForm.type}
                    onValueChange={(value) => setPromotionForm({ ...promotionForm, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code">Code promo</SelectItem>
                      <SelectItem value="reduction">Réduction</SelectItem>
                      <SelectItem value="flash">Flash sale</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-discount-type">Type de réduction</Label>
                  <Select
                    value={promotionForm.discountType}
                    onValueChange={(value) => setPromotionForm({ ...promotionForm, discountType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="fixed">Montant fixe</SelectItem>
                      <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-discount-value">Valeur de la réduction *</Label>
                  <Input
                    id="edit-discount-value"
                    type="number"
                    value={promotionForm.discountValue}
                    onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: Number(e.target.value) })}
                    placeholder="20 ou 5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-date">Date de début *</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={promotionForm.startDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end-date">Date de fin *</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={promotionForm.endDate}
                    onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-min-amount">Montant minimum ({currencyCode})</Label>
                  <Input
                    id="edit-min-amount"
                    type="number"
                    value={promotionForm.minAmount}
                    onChange={(e) => setPromotionForm({ ...promotionForm, minAmount: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-usage-limit">Limite d'utilisation</Label>
                  <Input
                    id="edit-usage-limit"
                    type="number"
                    value={promotionForm.usageLimit}
                    onChange={(e) => setPromotionForm({ ...promotionForm, usageLimit: Number(e.target.value) })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-conditions">Conditions spéciales</Label>
                <Textarea
                  id="edit-conditions"
                  value={promotionForm.conditions}
                  onChange={(e) => setPromotionForm({ ...promotionForm, conditions: e.target.value })}
                  placeholder={`Ex: Minimum 5000 ${currencyCode} d'achat, valable sur tous les produits`}
                  rows={4}
                />
              </div>

              <div className="p-5 border border-gray-200 rounded-xl space-y-6 bg-gray-50 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-gray-900">Ciblage de la promotion</h4>
                  <p className="text-xs text-gray-500">Sélectionnez les audiences concernées par cette offre.</p>
                </div>

                <MultiSelectField
                  label="Vendeurs ciblés"
                  placeholder="Tous les vendeurs"
                  emptyMessage="Aucun vendeur trouvé"
                  options={vendorOptions}
                  selectedIds={promotionForm.applicableVendors}
                  onChange={(next) => setPromotionForm((prev) => ({
                    ...prev,
                    applicableVendors: next
                  }))}
                  searchPlaceholder="Rechercher un vendeur"
                />

                <MultiSelectField
                  label="Catégories ciblées"
                  placeholder="Toutes les catégories"
                  emptyMessage="Aucune catégorie trouvée"
                  options={categoryOptionList}
                  selectedIds={promotionForm.applicableCategories}
                  onChange={(next) => setPromotionForm((prev) => ({
                    ...prev,
                    applicableCategories: next
                  }))}
                  searchPlaceholder="Rechercher une catégorie"
                />

                <MultiSelectField
                  label="Tags (produits)"
                  placeholder="Tous les tags"
                  emptyMessage="Aucun tag trouvé"
                  options={promotionTagOptions}
                  selectedIds={promotionForm.applicableTags}
                  onChange={(next) => setPromotionForm((prev) => ({
                    ...prev,
                    applicableTags: next
                  }))}
                  searchPlaceholder="Rechercher un tag"
                />

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                    <div>
                      <Label className="text-sm font-medium">Produits ciblés</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500 uppercase tracking-wide">Filtrer par vendeur</Label>
                      <Select value={productVendorFilter} onValueChange={(val) => setProductVendorFilter(val)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un vendeur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.display_name || v.email || v.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <MultiSelectField
                    placeholder="Tous les produits"
                    emptyMessage="Aucun produit trouvé"
                    options={productOptionList}
                    selectedIds={promotionForm.applicableProducts}
                    onChange={(next) => setPromotionForm((prev) => ({
                      ...prev,
                      applicableProducts: next
                    }))}
                    searchPlaceholder="Rechercher un produit"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-white">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditPromotionModal(false)
                  setSelectedPromotion(null)
                  resetPromotionForm()
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => selectedPromotion && handleUpdatePromotion(selectedPromotion.id, buildPromotionUpdates())}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90"
              >
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

