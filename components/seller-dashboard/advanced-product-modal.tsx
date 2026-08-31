"use client"

import { useState, useEffect, useMemo } from 'react'
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react'
import type { SharedProductInput, SharedProductMedia } from '@/lib/types/shared-product'
import type { LucideIcon } from 'lucide-react'
import { 
  X, Save, Eye, EyeOff, Package, Truck, CreditCard, 
  TrendingUp, Tag, Image as ImageIcon, AppWindow, Settings, 
  Globe, Search, Zap, Users, Gift, Star, 
  AlertTriangle, CheckCircle, Clock, DollarSign,
  Plus, Minus, Trash2, Copy, RefreshCw, Target,
  BarChart3, Share2, Heart, ShoppingCart, Filter,
  Upload, Download, TrendingDown, Info, FileBadge
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatPrice, convertToPoints, formatPoints, calculateInstallmentPayment, formatInstallmentPayment, formatDeferredPaymentFees } from '@/lib/currency-utils'
import { useProductCategories } from '@/contexts/product-category-context'
import type { ProductCategoryTreeNode } from '@/lib/types/product-category'
import { supabase } from '@/lib/supabase'
import { DEFAULT_ADMIN_POINT_SETTINGS, fetchAdminPointSettings } from '@/lib/services/point-settings-service'

interface CategoryOption {
  value: string
  label: string
  depth: number
}

interface SubcategoryOption extends CategoryOption {
  parentId: string | null
}

type ProductCategoryValue = string
type ProductSubcategoryValue = string
type ProductTypeValue = 'simple' | 'variable' | 'virtual' | 'downloadable'

interface DownloadableFile {
  id: number
  name: string
  url: string
  expirationDate: string | null
  maxDownloadsPerCustomer: number
  maxGlobalDownloads: number
  sourceType: 'url' | 'upload'
  uploadedFileName: string | null
  uploadedFileSize: number | null
  uploadedFileType: string | null
  uploadedFileDataUrl: string | null
  uploadedAt: string | null
}

interface ProductTypologyOption {
  value: ProductTypeValue
  label: string
  description: string
  highlight: string
}

interface DeferredPaymentFees {
  enabled: boolean
  type: 'percentage' | 'fixed'
  value: number
  period: 'day' | 'month' | 'quarter'
  maxPeriods: number
  minAmount: number
  calculationMethod: 'simple' | 'compound'
}

interface GroupedProductItem {
  id: number
  name: string
  sku?: string
  price: number
}

interface AdvancedProductData {
  // Informations de base
  name: string
  description: string
  shortDescription: string
  sku: string
  warranty: string
  returnPolicy: string
  price: number
  salePrice: number
  costPrice: number

  // Catégorisation
  category: ProductCategoryValue | ''
  subcategory: ProductSubcategoryValue | ''
  tags: string[]
  brand: string

  // Stock et inventaire
  stockQuantity: number
  lowStockThreshold: number
  manageStock: boolean
  allowBackorders: boolean
  stockStatus: 'instock' | 'outofstock' | 'onbackorder'

  // Images et médias
  mainImage: string
  galleryImages: string[]
  videos: string[]

  // Livraison
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  shippingClass: string
  freeShipping: boolean
  shippingCost: number

  // SEO
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  seoSlug: string
  seoAutoGenerate: boolean

  // Options de produit
  productType: ProductTypeValue
  virtual: boolean
  downloadable: boolean
  featured: boolean
  onSale: boolean
  isGrouped: boolean
  external: boolean
  externalUrl: string
  externalButtonText: string

  // Paiements spéciaux
  installmentPayment: boolean
  installmentOptions: number[]
  deferredPayment: boolean
  deferredPaymentFees: DeferredPaymentFees

  // Produits liés
  upsells: any[]
  crossSells: any[]
  groupedProducts: GroupedProductItem[]
  similarProducts: any[]

  // Social et marketing
  socialSharing: boolean
  socialPoints: number
  referralBonus: number
  favoriteNote: string

  // Métadonnées avancées
  attributes: any[]
  variations: any[]
  customFields: Record<string, string>
  downloadableFiles: DownloadableFile[]
  isFavorite: boolean
  promotionStartDate: string | null
  promotionEndDate: string | null
  promotionAutoRestore: boolean
  featuredBadgeText: string
  featuredStartDate: string | null
  featuredEndDate: string | null
}

const PRODUCT_TYPE_OPTIONS: ProductTypologyOption[] = [
  {
    value: 'simple',
    label: 'Produit simple',
    description: 'Produit unique sans variations spécifiques. Idéal pour les articles classiques.',
    highlight: 'Gestion standard du stock et des prix.'
  },
  {
    value: 'variable',
    label: 'Produit variable',
    description: 'Proposez des variations (taille, couleur, matière) avec une gestion avancée.',
    highlight: 'Active la gestion des attributs et variations.'
  },
  {
    value: 'virtual',
    label: 'Produit virtuel',
    description: 'Service ou produit immatériel n’exigeant pas d’expédition.',
    highlight: 'Désactive automatiquement les options de livraison.'
  },
  {
    value: 'downloadable',
    label: 'Produit téléchargeable',
    description: 'Contenus numériques livrés via un lien de téléchargement.',
    highlight: 'Configurez vos fichiers téléchargeables.'
  }
]

const SUGGESTED_TAGS = [
  'Premium',
  'Nouveau',
  'Éco-responsable',
  'Livraison gratuite',
  'Best-seller',
  'Garantie 2 ans',
  'Edition limitée',
  'Fabriqué en France'
]

/**
 * Formate une taille de fichier exprimée en octets vers une représentation lisible.
 */
const formatFileSize = (bytes: number | null): string => {
  if (!bytes || bytes <= 0) {
    return '0 o'
  }

  const units = ['o', 'Ko', 'Mo', 'Go']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / Math.pow(1024, exponent)
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[exponent]}`
}

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

interface ProductTypologyCardProps {
  option: ProductTypologyOption
  isActive: boolean
  onSelect: () => void
}

/**
 * Affiche une carte de sélection pour une typologie de produit (type WooCommerce).
 */
const ProductTypologyCard = ({ option, isActive, onSelect }: ProductTypologyCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={`text-left rounded-lg border transition-all p-4 space-y-2 hover:shadow-sm ${
      isActive
        ? 'border-blue-500 bg-blue-50/80 shadow-inner'
        : 'border-blue-100 bg-white hover:border-blue-300'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="font-semibold text-gray-900">{option.label}</div>
      <Badge variant="outline" className={isActive ? 'border-blue-400 text-blue-600' : 'border-gray-200'}>
        {option.highlight}
      </Badge>
    </div>
    <p className="text-sm text-gray-600 leading-snug">{option.description}</p>
  </button>
)

interface DownloadableSettingsPanelProps {
  files: DownloadableFile[]
  onAddFile: () => void
  onRemoveFile: (fileId: number) => void
  onUpdateFile: (fileId: number, updates: Partial<DownloadableFile>) => void
}

/**
 * Sous-panel permettant de gérer les fichiers téléchargeables pour un produit numérique.
 */
const DownloadableSettingsPanel = ({ files, onAddFile, onRemoveFile, onUpdateFile }: DownloadableSettingsPanelProps) => {
  const handleSourceTypeChange = (fileId: number, type: DownloadableFile['sourceType']) => {
    onUpdateFile(fileId, {
      sourceType: type,
      ...(type === 'url'
        ? {
            uploadedFileName: null,
            uploadedFileSize: null,
            uploadedFileType: null,
            uploadedFileDataUrl: null,
            uploadedAt: null
          }
        : { url: '' })
    })
  }

  const handleFileSelect = (fileId: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onUpdateFile(fileId, {
        sourceType: 'upload',
        url: '',
        uploadedFileName: file.name,
        uploadedFileSize: file.size,
        uploadedFileType: file.type,
        uploadedFileDataUrl: typeof reader.result === 'string' ? reader.result : null,
        uploadedAt: new Date().toISOString()
      })
    }

    reader.readAsDataURL(file)
  }

  const handleClearUploadedFile = (fileId: number) => {
    onUpdateFile(fileId, {
      sourceType: 'url',
      uploadedFileName: null,
      uploadedFileSize: null,
      uploadedFileType: null,
      uploadedFileDataUrl: null,
      uploadedAt: null,
      url: ''
    })
  }

  return (
    <div className="space-y-4 border border-blue-100 rounded-lg bg-blue-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-blue-800">Fichiers téléchargeables</div>
          <p className="text-xs text-blue-600">Définissez les accès, les limites et la durée de disponibilité de chaque ressource.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onAddFile} className="border-blue-300 text-blue-700 hover:bg-blue-100">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un fichier
        </Button>
      </div>

      {files.length === 0 && (
        <div className="text-sm text-blue-700 bg-white border border-dashed border-blue-200 rounded-lg p-4">
          Aucun fichier défini. Ajoutez un premier lien ou téléversez une pièce jointe.
        </div>
      )}

      {files.map((file) => (
        <div key={file.id} className="space-y-4 rounded-lg border border-blue-200 bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-[repeat(2,minmax(0,1fr))_auto] md:items-end gap-3">
            <div>
              <Label htmlFor={`download-name-${file.id}`} className="text-xs uppercase text-blue-600">Nom du fichier</Label>
              <Input
                id={`download-name-${file.id}`}
                value={file.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateFile(file.id, { name: event.target.value })}
                placeholder="Guide PDF, Archive ZIP, ..."
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

            <div>
              <Label className="text-xs uppercase text-blue-600">Source du contenu</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSourceTypeChange(file.id, 'url')}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${file.sourceType === 'url' ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold' : 'border-blue-200 text-blue-600 hover:border-blue-300'}`}
                >
                  Lien externe
                </button>
                <button
                  type="button"
                  onClick={() => handleSourceTypeChange(file.id, 'upload')}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${file.sourceType === 'upload' ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold' : 'border-blue-200 text-blue-600 hover:border-blue-300'}`}
                >
                  Pièce jointe
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveFile(file.id)} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {file.sourceType === 'url' ? (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor={`download-url-${file.id}`} className="text-xs uppercase text-blue-600">URL de téléchargement</Label>
                <Input
                  id={`download-url-${file.id}`}
                  value={file.url}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateFile(file.id, { url: event.target.value })}
                  placeholder="https://..."
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-md border border-dashed border-blue-200 bg-blue-50/60 p-3">
              <input
                id={`download-upload-${file.id}`}
                type="file"
                className="hidden"
                onChange={(event) => handleFileSelect(file.id, event)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor={`download-upload-${file.id}`}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4" />
                  Choisir un fichier
                </label>

                {file.uploadedFileName && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <FileBadge className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{file.uploadedFileName}</div>
                      <div className="text-xs text-blue-500">
                        {file.uploadedFileType || 'Type inconnu'} • {formatFileSize(file.uploadedFileSize)}
                      </div>
                    </div>
                  </div>
                )}

                {file.uploadedFileName && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => handleClearUploadedFile(file.id)} className="bg-white text-blue-600 hover:bg-blue-100">
                    Supprimer la pièce jointe
                  </Button>
                )}
              </div>

              {!file.uploadedFileName && <p className="text-xs text-blue-600">Formats acceptés : PDF, ZIP, images, etc. Taille maximale recommandée : 25 Mo.</p>}
              {file.uploadedAt && (
                <p className="text-xs text-blue-500">Téléversé le {new Date(file.uploadedAt).toLocaleString('fr-FR')}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`download-expiration-${file.id}`} className="text-xs uppercase text-blue-600">Date d’expiration</Label>
              <Input
                id={`download-expiration-${file.id}`}
                type="date"
                value={file.expirationDate ? file.expirationDate : ''}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateFile(file.id, { expirationDate: event.target.value ? event.target.value : null })}
                className="border-blue-200 focus:border-blue-400"
              />
              <p className="mt-1 text-xs text-blue-500">Laissez vide pour un accès sans limite dans le temps.</p>
            </div>

            <div>
              <Label htmlFor={`download-max-customer-${file.id}`} className="text-xs uppercase text-blue-600">Téléchargements / client</Label>
              <Input
                id={`download-max-customer-${file.id}`}
                type="number"
                min={0}
                value={file.maxDownloadsPerCustomer}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateFile(file.id, { maxDownloadsPerCustomer: Number(event.target.value) })}
                className="border-blue-200 focus:border-blue-400"
              />
              <p className="mt-1 text-xs text-blue-500">0 signifie téléchargements illimités par client.</p>
            </div>

            <div>
              <Label htmlFor={`download-max-global-${file.id}`} className="text-xs uppercase text-blue-600">Téléchargements globaux</Label>
              <Input
                id={`download-max-global-${file.id}`}
                type="number"
                min={0}
                value={file.maxGlobalDownloads}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateFile(file.id, { maxGlobalDownloads: Number(event.target.value) })}
                className="border-blue-200 focus:border-blue-400"
              />
              <p className="mt-1 text-xs text-blue-500">0 signifie aucun plafond global.</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface ProductOptionToggleProps {
  icon: LucideIcon
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  footer?: ReactNode
  children?: ReactNode
}

/**
 * Toggle réutilisable pour activer/désactiver une option avancée du produit.
 */
const ProductOptionToggle = ({ icon: Icon, title, description, checked, onChange, footer, children }: ProductOptionToggleProps) => (
  <div className={`space-y-3 rounded-lg border p-4 transition-colors ${checked ? 'border-orange-400 bg-orange-50/70' : 'border-gray-200 bg-white hover:border-orange-200'}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-md ${checked ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <p className="text-sm text-gray-600 leading-snug">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>

    {checked && children}
    {footer && <div className="text-sm text-gray-700 bg-white/70 rounded-md border border-orange-100 p-3">{footer}</div>}
  </div>
)

interface DeferredPaymentSummaryProps {
  price: number
  fees: DeferredPaymentFees
}

/**
 * Présente un résumé rapide des frais configurés pour le paiement différé.
 */
const DeferredPaymentSummary = ({ price, fees }: DeferredPaymentSummaryProps) => {
  if (!fees.enabled || price <= 0 || fees.value <= 0) {
    return <span className="text-sm text-gray-600">Définissez un prix et des frais pour obtenir une estimation.</span>
  }

  const { fees: formattedFees, totalAmount, feesPoints, totalPoints, breakdown } = formatDeferredPaymentFees(
    price,
    fees.value,
    fees.type,
    fees.period,
    1,
    fees.calculationMethod
  )

  return (
    <div className="space-y-1">
      <div className="font-semibold text-orange-700">Frais estimés : {formattedFees}</div>
      <div className="text-xs text-orange-600">Total TTC : {totalAmount} ({totalPoints}) – Frais convertis : {feesPoints}</div>
      <div className="text-xs text-gray-500">{breakdown}</div>
    </div>
  )
}

interface DeferredPaymentConfiguratorProps {
  fees: DeferredPaymentFees
  onChange: (fees: DeferredPaymentFees) => void
}

/**
 * Mini configurateur pour ajuster les frais de paiement différé directement depuis l’onglet Général.
 */
const DeferredPaymentConfigurator = ({ fees, onChange }: DeferredPaymentConfiguratorProps) => {
  const handleFeesChange = <Key extends keyof DeferredPaymentFees>(key: Key, value: DeferredPaymentFees[Key]) => {
    onChange({ ...fees, [key]: value })
  }

  return (
    <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/70 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs uppercase text-orange-700">Type de frais</Label>
          <Select value={fees.type} onValueChange={(value) => handleFeesChange('type', value as DeferredPaymentFees['type'])}>
            <SelectTrigger className="border-orange-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Pourcentage (%)</SelectItem>
              <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase text-orange-700">
            {fees.type === 'percentage' ? 'Pourcentage (%)' : 'Montant fixe (FCFA)'}
          </Label>
          <Input
            type="number"
            value={fees.value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => handleFeesChange('value', parseFloat(event.target.value) || 0)}
            className="border-orange-300"
            placeholder={fees.type === 'percentage' ? '10' : '100'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs uppercase text-orange-700">Période</Label>
          <Select value={fees.period} onValueChange={(value) => handleFeesChange('period', value as DeferredPaymentFees['period'])}>
            <SelectTrigger className="border-orange-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs uppercase text-orange-700">Méthode de calcul</Label>
          <Select value={fees.calculationMethod} onValueChange={(value) => handleFeesChange('calculationMethod', value as DeferredPaymentFees['calculationMethod'])}>
            <SelectTrigger className="border-orange-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Intérêts simples</SelectItem>
              <SelectItem value="compound">Intérêts composés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs uppercase text-orange-700">Périodes maximum</Label>
          <Input
            type="number"
            value={fees.maxPeriods}
            onChange={(event: ChangeEvent<HTMLInputElement>) => handleFeesChange('maxPeriods', parseInt(event.target.value, 10) || 1)}
            className="border-orange-300"
          />
        </div>

        <div>
          <Label className="text-xs uppercase text-orange-700">Montant minimum (FCFA)</Label>
          <Input
            type="number"
            value={fees.minAmount}
            onChange={(event: ChangeEvent<HTMLInputElement>) => handleFeesChange('minAmount', parseFloat(event.target.value) || 0)}
            className="border-orange-300"
          />
        </div>
      </div>
    </div>
  )
}

interface VendorSelectOption {
  id: string
  name: string
}

interface AdvancedProductModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  product?: SharedProductInput
  onSubmit: (input: SharedProductInput & { id?: string }) => Promise<void>
  context?: 'super-admin' | 'admin' | 'vendor'
  vendorOptions?: VendorSelectOption[]
  initialVendorId?: string | null
  initialStatus?: SharedProductInput['productStatus']
  onSuccess?: () => Promise<void> | void
}

const createInitialProductData = (): AdvancedProductData => ({
  // Informations de base
  name: '',
  description: '',
  shortDescription: '',
  sku: '',
  warranty: '',
  returnPolicy: '',
  price: 0,
  salePrice: 0,
  costPrice: 0,
  
  // Catégorisation
  category: '',
  subcategory: '',
  tags: [],
  brand: '',
  
  // Stock et inventaire
  stockQuantity: 0,
  lowStockThreshold: 5,
  manageStock: true,
  allowBackorders: false,
  stockStatus: 'instock',
  
  // Images et médias
  mainImage: '',
  galleryImages: [] as string[],
  videos: [] as string[],
  
  // Livraison
  weight: 0,
  dimensions: {
    length: 0,
    width: 0,
    height: 0
  },
  shippingClass: 'standard',
  freeShipping: false,
  shippingCost: 0,
  
  // SEO
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  seoSlug: '',
  seoAutoGenerate: true,
  
  // Options de produit
  productType: 'simple',
  virtual: false,
  downloadable: false,
  featured: false,
  onSale: false,
  isGrouped: false,
  external: false,
  externalUrl: '',
  externalButtonText: 'Acheter',
  
  // Paiements spéciaux
  installmentPayment: false,
  installmentOptions: [1, 3, 6, 12],
  deferredPayment: false,
  deferredPaymentFees: {
    enabled: false,
    type: 'percentage',
    value: 0,
    period: 'day',
    maxPeriods: 12,
    minAmount: 0,
    calculationMethod: 'simple'
  },
  
  // Produits liés
  upsells: [],
  crossSells: [],
  groupedProducts: [],
  similarProducts: [],
  
  // Social et marketing
  socialSharing: true,
  socialPoints: 50,
  referralBonus: 0,
  favoriteNote: '',

  // Métadonnées avancées
  attributes: [],
  variations: [],
  customFields: {},
  downloadableFiles: [],
  isFavorite: false,
  promotionStartDate: null,
  promotionEndDate: null,
  promotionAutoRestore: true,
  featuredBadgeText: '',
  featuredStartDate: null,
  featuredEndDate: null,
})

/**
 * Transforme un SharedProductInput en structure AdvancedProductData pour piloter l’UI.
 */
const SUPER_ADMIN_VENDOR_ID = '15df4c86-08d2-4fd5-8f4a-f8a1075ac422'

const mapSharedToAdvancedData = (shared: SharedProductInput): AdvancedProductData => {
  const base = createInitialProductData()

  const category = shared.category ?? base.category
  const subcategory = shared.subcategory ?? base.subcategory

  const mediaItems: SharedProductMedia[] = Array.isArray(shared.media)
    ? shared.media.filter((item): item is SharedProductMedia => Boolean(item && item.path))
    : []

  const primaryMedia = mediaItems.find((item) => item.isPrimary) ?? mediaItems[0]

  const galleryFromMedia = mediaItems
    .filter((item) => item !== primaryMedia)
    .map((item) => item.path)

  const computedMainImage = primaryMedia?.path ?? shared.mainImage ?? base.mainImage

  const computedGalleryImagesSource = galleryFromMedia.length > 0
    ? galleryFromMedia
    : shared.galleryImages ?? base.galleryImages

  const galleryWithoutPrimary = computedGalleryImagesSource
    .filter((path): path is string => Boolean(path))
    .filter((path) => path !== computedMainImage)

  const uniqueGalleryImages = Array.from(new Set(galleryWithoutPrimary))

  const mappedDownloadables: DownloadableFile[] = (shared.downloadableFiles ?? []).map((file, index) => ({
    id: index + 1,
    name: file.name,
    url: file.url,
    expirationDate: file.expirationDate ?? null,
    maxDownloadsPerCustomer: file.maxDownloadsPerCustomer ?? 0,
    maxGlobalDownloads: file.maxGlobalDownloads ?? 0,
    sourceType: file.sourceType ?? 'url',
    uploadedFileName: file.uploadedFileName ?? null,
    uploadedFileSize: file.uploadedFileSize ?? null,
    uploadedFileType: file.uploadedFileType ?? null,
    uploadedFileDataUrl: file.uploadedFileDataUrl ?? null,
    uploadedAt: file.uploadedAt ?? null
  }))

  const attributes = shared.attributes && typeof shared.attributes === 'object' && !Array.isArray(shared.attributes)
    ? Object.entries(shared.attributes).map(([key, value]) => ({ key, value }))
    : Array.isArray(shared.attributes) ? shared.attributes : base.attributes

  return {
    ...base,
    name: shared.name ?? base.name,
    description: shared.description ?? base.description,
    shortDescription: shared.shortDescription ?? base.shortDescription,
    sku: shared.sku ?? base.sku,
    warranty: shared.warranty ?? base.warranty,
    returnPolicy: shared.returnPolicy ?? base.returnPolicy,
    price: shared.price ?? base.price,
    salePrice: shared.salePrice ?? base.salePrice,
    costPrice: shared.costPrice ?? base.costPrice,
    category: (category as ProductCategoryValue | ''),
    subcategory: (subcategory as ProductSubcategoryValue | ''),
    tags: shared.tags ?? base.tags,
    brand: shared.brand ?? base.brand,
    stockQuantity: shared.stockQuantity ?? base.stockQuantity,
    lowStockThreshold: shared.lowStockThreshold ?? base.lowStockThreshold,
    manageStock: shared.manageStock ?? base.manageStock,
    allowBackorders: shared.allowBackorders ?? base.allowBackorders,
    stockStatus: shared.stockStatus ?? base.stockStatus,
    mainImage: computedMainImage ?? base.mainImage,
    galleryImages: uniqueGalleryImages,
    videos: shared.videos ?? base.videos,
    weight: shared.shipping?.weight ?? base.weight,
    dimensions: {
      length: shared.shipping?.length ?? base.dimensions.length,
      width: shared.shipping?.width ?? base.dimensions.width,
      height: shared.shipping?.height ?? base.dimensions.height
    },
    shippingClass: shared.shipping?.shippingClass ?? base.shippingClass,
    freeShipping: shared.shipping?.freeShipping ?? base.freeShipping,
    shippingCost: shared.shipping?.shippingCost ?? base.shippingCost,
    seoTitle: shared.seo?.title ?? base.seoTitle,
    seoDescription: shared.seo?.description ?? base.seoDescription,
    seoKeywords: shared.seo?.keywords?.join(', ') ?? base.seoKeywords,
    seoSlug: shared.seo?.slug ?? base.seoSlug,
    seoAutoGenerate: shared.seo?.autoGenerate ?? base.seoAutoGenerate,
    productType: shared.productType ?? base.productType,
    virtual: shared.isVirtual ?? base.virtual,
    downloadable: shared.isDownloadable ?? base.downloadable,
    featured: shared.isFeatured ?? base.featured,
    onSale: shared.onSale ?? base.onSale,
    isGrouped: Boolean(shared.linkedProducts?.groupedProducts?.length) || base.isGrouped,
    external: shared.external ?? base.external,
    externalUrl: shared.externalUrl ?? base.externalUrl,
    externalButtonText: shared.externalButtonText ?? base.externalButtonText,
    installmentPayment: shared.payment?.installmentPayment ?? base.installmentPayment,
    installmentOptions: shared.payment?.installmentOptions ?? base.installmentOptions,
    deferredPayment: shared.payment?.deferredPayment ?? base.deferredPayment,
    deferredPaymentFees: {
      enabled: shared.payment?.deferredPaymentFees?.enabled ?? base.deferredPaymentFees.enabled,
      type: shared.payment?.deferredPaymentFees?.type ?? base.deferredPaymentFees.type,
      value: shared.payment?.deferredPaymentFees?.value ?? base.deferredPaymentFees.value,
      period: shared.payment?.deferredPaymentFees?.period ?? base.deferredPaymentFees.period,
      maxPeriods: shared.payment?.deferredPaymentFees?.maxPeriods ?? base.deferredPaymentFees.maxPeriods,
      minAmount: shared.payment?.deferredPaymentFees?.minAmount ?? base.deferredPaymentFees.minAmount,
      calculationMethod: shared.payment?.deferredPaymentFees?.calculationMethod ?? base.deferredPaymentFees.calculationMethod
    },
    upsells: shared.linkedProducts?.upsells ?? base.upsells,
    crossSells: shared.linkedProducts?.crossSells ?? base.crossSells,
    groupedProducts: (shared.linkedProducts?.groupedProducts ?? base.groupedProducts).map((item, index) => ({
      id: index + 1,
      name: typeof item === 'string' ? item : (item as any)?.name ?? `Produit ${index + 1}`,
      sku: (item as any)?.sku,
      price: typeof (item as any)?.price === 'number' ? (item as any).price : 0
    })),
    similarProducts: shared.linkedProducts?.similarProducts ?? base.similarProducts,
    socialSharing: shared.marketing?.socialSharing ?? base.socialSharing,
    socialPoints: shared.marketing?.socialPoints ?? base.socialPoints,
    referralBonus: shared.marketing?.referralBonus ?? base.referralBonus,
    favoriteNote: shared.marketing?.favoriteNote ?? base.favoriteNote,
    attributes,
    variations: shared.variations ?? base.variations,
    customFields: shared.customFields ?? base.customFields,
    downloadableFiles: mappedDownloadables,
    isFavorite: Boolean(shared.metadata && typeof shared.metadata === 'object' && 'isFavorite' in shared.metadata ? shared.metadata.isFavorite : base.isFavorite),
    promotionStartDate: shared.promotion?.promotionStartDate ?? base.promotionStartDate,
    promotionEndDate: shared.promotion?.promotionEndDate ?? base.promotionEndDate,
    promotionAutoRestore: shared.promotion?.promotionAutoRestore ?? base.promotionAutoRestore,
    featuredBadgeText: shared.promotion?.featuredBadgeText ?? base.featuredBadgeText,
    featuredStartDate: shared.promotion?.featuredStartDate ?? base.featuredStartDate,
    featuredEndDate: shared.promotion?.featuredEndDate ?? base.featuredEndDate
  }
}

/**
 * Transforme l’état avancé du formulaire en payload SharedProductInput prêt pour l’API.
 */
const normalizeString = (value?: string | null) => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 ? trimmed : undefined
}

const mapAdvancedToShared = (data: AdvancedProductData, base: SharedProductInput): SharedProductInput => {
  const attributeObject = data.attributes.reduce<Record<string, unknown>>((acc, attribute) => {
    if (attribute?.key) {
      acc[attribute.key] = attribute.value
    }
    return acc
  }, {})

  const trimmedName = data.name.trim()

  return {
    ...base,
    name: trimmedName,
    description: normalizeString(data.description),
    shortDescription: normalizeString(data.shortDescription),
    sku: normalizeString(data.sku),
    warranty: normalizeString(data.warranty) ?? null,
    returnPolicy: normalizeString(data.returnPolicy) ?? null,
    price: data.price,
    salePrice: data.salePrice ?? undefined,
    costPrice: data.costPrice ?? undefined,
    category: normalizeString(data.category),
    subcategory: normalizeString(data.subcategory),
    tags: data.tags.length > 0 ? data.tags : undefined,
    brand: normalizeString(data.brand),
    stockQuantity: data.stockQuantity,
    lowStockThreshold: data.lowStockThreshold,
    manageStock: data.manageStock,
    allowBackorders: data.allowBackorders,
    stockStatus: data.stockStatus,
    mainImage: normalizeString(data.mainImage) ?? null,
    galleryImages: data.galleryImages.length > 0 ? data.galleryImages : undefined,
    videos: data.videos.length > 0 ? data.videos : undefined,
    media:
      data.mainImage || data.galleryImages.length > 0
        ? [
            ...(data.mainImage
              ? [{ path: data.mainImage, type: 'image' as const, isPrimary: true, altText: data.name?.slice(0, 120) || null }]
              : []),
            ...data.galleryImages.map((image, index) => ({
              path: image,
              type: 'image' as const,
              isPrimary: false,
              altText: data.name?.slice(0, 120) || null,
              metadata: { position: index + 1 }
            }))
          ]
        : undefined,
    shipping: {
      weight: data.weight || undefined,
      length: data.dimensions.length || undefined,
      width: data.dimensions.width || undefined,
      height: data.dimensions.height || undefined,
      shippingClass: normalizeString(data.shippingClass),
      freeShipping: data.freeShipping,
      shippingCost: data.shippingCost || undefined
    },
    seo: {
      title: normalizeString(data.seoTitle) ?? null,
      description: normalizeString(data.seoDescription) ?? null,
      keywords: data.seoKeywords
        ? data.seoKeywords
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      slug: normalizeString(data.seoSlug) ?? null,
      autoGenerate: data.seoAutoGenerate
    },
    productType: data.productType,
    isVirtual: data.virtual,
    isDownloadable: data.downloadable,
    isFeatured: data.featured,
    onSale: data.onSale,
    linkedProducts: {
      upsells: data.upsells.length > 0 ? data.upsells : undefined,
      crossSells: data.crossSells.length > 0 ? data.crossSells : undefined,
      groupedProducts: data.groupedProducts.length > 0 ? data.groupedProducts.map((item) => item.name) : undefined,
      similarProducts: data.similarProducts.length > 0 ? data.similarProducts : undefined
    },
    external: data.external,
    externalUrl: normalizeString(data.externalUrl) ?? null,
    externalButtonText: normalizeString(data.externalButtonText) ?? null,
    payment: {
      installmentPayment: data.installmentPayment,
      installmentOptions: data.installmentOptions,
      deferredPayment: data.deferredPayment,
      deferredPaymentFees: {
        enabled: data.deferredPaymentFees.enabled,
        type: data.deferredPaymentFees.type,
        value: data.deferredPaymentFees.value,
        period: data.deferredPaymentFees.period,
        maxPeriods: data.deferredPaymentFees.maxPeriods,
        minAmount: data.deferredPaymentFees.minAmount,
        calculationMethod: data.deferredPaymentFees.calculationMethod
      }
    },
    marketing: {
      socialSharing: data.socialSharing,
      socialPoints: data.socialPoints,
      referralBonus: data.referralBonus,
      favoriteNote: normalizeString(data.favoriteNote)
    },
    promotion: {
      promotionStartDate: data.promotionStartDate || undefined,
      promotionEndDate: data.promotionEndDate || undefined,
      promotionAutoRestore: data.promotionAutoRestore,
      featuredBadgeText: normalizeString(data.featuredBadgeText),
      featuredStartDate: data.featuredStartDate || undefined,
      featuredEndDate: data.featuredEndDate || undefined
    },
    attributes: Object.keys(attributeObject).length > 0 ? attributeObject : undefined,
    variations: data.variations.length > 0 ? data.variations : undefined,
    downloadable: data.downloadable,
    downloadableFiles:
      data.downloadableFiles.length > 0
        ? data.downloadableFiles.map((file) => ({
            id: file.id ? String(file.id) : undefined,
            name: file.name,
            url: file.url,
            expirationDate: file.expirationDate ?? null,
            maxDownloadsPerCustomer: file.maxDownloadsPerCustomer,
            maxGlobalDownloads: file.maxGlobalDownloads,
            sourceType: file.sourceType,
            uploadedFileName: file.uploadedFileName ?? null,
            uploadedFileSize: file.uploadedFileSize ?? null,
            uploadedFileType: file.uploadedFileType ?? null,
            uploadedFileDataUrl: file.uploadedFileDataUrl ?? null,
            uploadedAt: file.uploadedAt ?? null
          }))
        : undefined
  }
}

function AdvancedProductModal({
  isOpen,
  onClose,
  mode,
  product,
  context,
  vendorOptions = [],
  initialVendorId,
  initialStatus,
  onSubmit,
  onSuccess
}: AdvancedProductModalProps) {
  const [pointsPurchaseValue, setPointsPurchaseValue] = useState<number>(DEFAULT_ADMIN_POINT_SETTINGS.purchaseValue)

  /**
   * Convertit un montant en FCFA vers son équivalent en points selon la configuration globale (DB).
   * Règle: purchaseValue = valeur d'achat sur le site (FCFA par point) => points = montant / purchaseValue.
   * Fallback: convertToPoints() (ancien comportement) si la config est indisponible.
   */
  const convertAmountToPoints = useMemo(() => {
    const pv = Number(pointsPurchaseValue)
    if (Number.isFinite(pv) && pv > 0) {
      return (amount: number) => Math.round((Number(amount) || 0) / pv)
    }
    return (amount: number) => convertToPoints(Number(amount) || 0)
  }, [pointsPurchaseValue])

  useEffect(() => {
    let cancelled = false
    if (!isOpen) return

    const run = async () => {
      try {
        const settings = await fetchAdminPointSettings()
        const pv = Number(settings?.purchaseValue)
        if (!cancelled && Number.isFinite(pv) && pv > 0) {
          setPointsPurchaseValue(pv)
        }
      } catch {
        // Fallback silencieux: on conserve la valeur par défaut.
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [isOpen])
  const isVendorShippingReadOnly = context === 'vendor'

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [productData, setProductData] = useState<AdvancedProductData>(() => {
    if (product) {
      return mapSharedToAdvancedData(product)
    }
    return createInitialProductData()
  })

  useEffect(() => {
    if (product) {
      setProductData(mapSharedToAdvancedData(product))
    } else {
      setProductData(createInitialProductData())
    }
  }, [product?.id, mode])

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setCurrentUserId(data.user?.id ?? null)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  const resolvedInitialVendor = product?.vendorId ?? initialVendorId ?? null
  const initialSource = product?.source ?? (context === 'vendor' ? 'vendor' : undefined)
  const resolvedInitialStatus = product?.productStatus ?? initialStatus ?? (mode === 'create' ? 'draft' : undefined)

  const inferredMarketplaceOwn = (() => {
    if (context === 'vendor') {
      return false
    }

    if (typeof resolvedInitialVendor === 'string' && resolvedInitialVendor !== '') {
      return resolvedInitialVendor === SUPER_ADMIN_VENDOR_ID
    }

    if (initialSource === 'super_admin') {
      return true
    }

    return resolvedInitialVendor === null
  })()

  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(
    inferredMarketplaceOwn ? SUPER_ADMIN_VENDOR_ID : resolvedInitialVendor
  )
  const [isMarketplaceOwned, setIsMarketplaceOwned] = useState<boolean>(inferredMarketplaceOwn)
  const [productStatus, setProductStatus] = useState<SharedProductInput['productStatus'] | undefined>(resolvedInitialStatus)

  useEffect(() => {
    const vendorFromProduct = product?.vendorId ?? initialVendorId ?? null
    const sourceFromProduct = product?.source ?? (context === 'vendor' ? 'vendor' : undefined)

    const marketplaceOwnership =
      context !== 'vendor' && (vendorFromProduct === null || vendorFromProduct === SUPER_ADMIN_VENDOR_ID || sourceFromProduct === 'super_admin')

    setIsMarketplaceOwned(marketplaceOwnership)
    setSelectedVendorId(marketplaceOwnership ? SUPER_ADMIN_VENDOR_ID : vendorFromProduct)

    const statusFromProduct = product?.productStatus ?? initialStatus ?? (mode === 'create' ? 'draft' : undefined)
    setProductStatus(statusFromProduct)
  }, [product, initialStatus, mode, initialVendorId, context])

  // États pour l'interface
  const [activeTab, setActiveTab] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [seoScore, setSeoScore] = useState(85)
  const [stockAlerts, setStockAlerts] = useState<{ id: number; threshold: number; active: boolean }[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [groupedProductInput, setGroupedProductInput] = useState('')

  const { categoryTree, isLoading: isLoadingCategories } = useProductCategories()

  useEffect(() => {
    if (isOpen) {
      setActiveTab('general')
    }
  }, [isOpen, mode])

  const flattenedCategories = useMemo(() => {
    const collect: ProductCategoryTreeNode[] = []

    const traverse = (node: ProductCategoryTreeNode) => {
      collect.push(node)
      node.children.forEach(traverse)
    }

    categoryTree.forEach(traverse)
    return collect
  }, [categoryTree])

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    return flattenedCategories
      .filter((node) => node.parent_id === null)
      .map((node) => ({
        value: node.id,
        label: `${'— '.repeat(node.depth ?? 0)}${node.name}`.trim(),
        depth: node.depth ?? 0
      }))
  }, [flattenedCategories])

  const subcategoryOptions = useMemo<SubcategoryOption[]>(() => {
    return flattenedCategories
      .filter((node) => node.parent_id !== null)
      .map((node) => ({
        value: node.id,
        label: `${'— '.repeat(node.depth ?? 0)}${node.name}`.trim(),
        parentId: node.parent_id,
        depth: node.depth ?? 1
      }))
  }, [flattenedCategories])

  const availableSubcategories = useMemo(() => {
    if (!productData.category) {
      return []
    }

    return subcategoryOptions.filter((subcategory) => subcategory.parentId === productData.category)
  }, [productData.category, subcategoryOptions])

  // États pour l'IA
  const [isAIOptimizing, setIsAIOptimizing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  // États pour les boutons d'action
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDraftSaved, setIsDraftSaved] = useState(false)
  const [draftData, setDraftData] = useState<{ key: string; payload: SharedProductInput } | null>(null)

  // États pour les notifications
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }>>([])

  // Fonction pour ajouter une notification
  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, action?: { label: string; onClick: () => void }) => {
    const id = Date.now().toString()
    const notification = {
      id,
      type,
      title,
      message,
      duration: type === 'success' ? 4000 : type === 'error' ? 6000 : 5000,
      action
    }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto-remove notification
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }
  }

  // Fonction pour supprimer une notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Fonction de génération automatique du SEO
  const generateAutoSEO = () => {
    if (productData.name && productData.description) {
      const autoTitle = `${productData.name} - ${productData.brand || 'Probooster'}`
      const autoDescription = productData.description.substring(0, 160) + '...'
      const autoKeywords = `${productData.name}, ${productData.category}, ${productData.brand}, Probooster`
      
      setProductData(prev => ({
        ...prev,
        seoTitle: autoTitle,
        seoDescription: autoDescription,
        seoKeywords: autoKeywords,
        seoSlug: productData.name.toLowerCase().replace(/\s+/g, '-')
      }))
    }
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  const createLocalNumericId = () => Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`)

  /**
   * Calcule l'identifiant de dossier à utiliser pour stocker les médias dans Supabase Storage.
   */
  const resolveStorageFolderOwner = async (): Promise<string | null> => {
    const ensureUploaderId = async (): Promise<string | null> => {
      if (currentUserId) {
        return currentUserId
      }

      try {
        const {
          data: { user },
          error
        } = await supabase.auth.getUser()

        if (error) {
          console.warn('Impossible de récupérer le profil Supabase courant pour l’upload produit.', error)
        }

        if (user?.id) {
          setCurrentUserId(user.id)
          return user.id
        }
      } catch (unexpected) {
        console.warn('Erreur inattendue lors de la récupération de la session Supabase.', unexpected)
      }

      return null
    }

    const uploaderId = await ensureUploaderId()

    if (!uploaderId) {
      return null
    }

    if (context !== 'vendor') {
      if (!isMarketplaceOwned && selectedVendorId && UUID_REGEX.test(selectedVendorId)) {
        return `${uploaderId}/vendors/${selectedVendorId}`
      }

      return `${uploaderId}/marketplace`
    }

    return uploaderId
  }

  /**
   * Téléverse un fichier image produit vers Supabase Storage et retourne l'URL publique.
   */
  const uploadProductImage = async (file: File): Promise<string> => {
    const ownerFolder = await resolveStorageFolderOwner()

    if (!ownerFolder) {
      throw new Error("Impossible de déterminer le dossier de stockage pour l'image.")
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const objectPath = `${ownerFolder}/${uniqueId}.${extension}`

    const { error: uploadError } = await supabase.storage.from('product-assets').upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

    if (uploadError) {
      throw uploadError
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from('product-assets').getPublicUrl(objectPath)

    return publicUrl
  }

  /**
   * Indique si la valeur fournie correspond à une Data URL d'image.
   */
  const isImageDataUrl = (value?: string | null): value is string =>
    typeof value === 'string' && value.startsWith('data:image/')

  /**
   * Convertit une Data URL en fichier exploitable pour l'upload Supabase.
   */
  const dataUrlToFile = (dataUrl: string, fileBaseName: string): File | null => {
    const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)

    if (!matches) {
      return null
    }

    const mimeType = matches[1]
    const base64Data = matches[2]

    try {
      const binary = atob(base64Data)
      const length = binary.length
      const buffer = new Uint8Array(length)

      for (let index = 0; index < length; index += 1) {
        buffer[index] = binary.charCodeAt(index)
      }

      const extension = mimeType.split('/')[1]?.split('+')[0] ?? 'jpg'
      const fileName = `${fileBaseName}.${extension}`
      const blob = new Blob([buffer], { type: mimeType })

      return new File([blob], fileName, { type: mimeType })
    } catch (error) {
      console.error('Impossible de convertir la Data URL en fichier.', error)
      return null
    }
  }

  /**
   * Garantit que toutes les images du formulaire sont téléversées et référencées par une URL publique.
   */
  const ensureProductImagesAreUploaded = async (data: AdvancedProductData): Promise<AdvancedProductData> => {
    let hasMutated = false
    let nextMainImage = data.mainImage

    if (isImageDataUrl(data.mainImage)) {
      const file = dataUrlToFile(data.mainImage, 'product-main-image')

      if (file) {
        nextMainImage = await uploadProductImage(file)
        hasMutated = true
      }
    }

    const processedGallery = await Promise.all(
      data.galleryImages.map(async (imagePath, index) => {
        if (!isImageDataUrl(imagePath)) {
          return imagePath
        }

        const file = dataUrlToFile(imagePath, `product-gallery-image-${index + 1}`)

        if (!file) {
          return imagePath
        }

        hasMutated = true
        return await uploadProductImage(file)
      })
    )

    if (!hasMutated) {
      return data
    }

    return {
      ...data,
      mainImage: nextMainImage,
      galleryImages: processedGallery
    }
  }

  const getSharedPayload = (baseOverrides?: SharedProductInput, currentData: AdvancedProductData = productData) => {
    const shared = mapAdvancedToShared(currentData, {
      name: product?.name ?? currentData.name,
      price: product?.price ?? currentData.price,
      ...(product ?? {}),
      ...(baseOverrides ?? {})
    } as SharedProductInput)

    const primaryCategory = currentData.category || undefined
    const selectedSubcategory = currentData.subcategory || undefined

    const selectedCategoryIds: string[] = []

    if (primaryCategory) {
      selectedCategoryIds.push(primaryCategory)
    }
    if (selectedSubcategory && !selectedCategoryIds.includes(selectedSubcategory)) {
      selectedCategoryIds.push(selectedSubcategory)
    }

    const validCategoryIds = selectedCategoryIds.filter((id) => UUID_REGEX.test(id))
    const validTagIds = selectedTags.filter((tagId) => UUID_REGEX.test(tagId))

    const rawVendorId = (() => {
      if (context === 'vendor') {
        return initialVendorId ?? product?.vendorId ?? shared.vendorId ?? null
      }

      if (isMarketplaceOwned) {
        return product?.vendorId ?? shared.vendorId ?? null
      }

      return selectedVendorId ?? product?.vendorId ?? shared.vendorId ?? null
    })()

    const vendorIdForPayload =
      typeof rawVendorId === 'string' && UUID_REGEX.test(rawVendorId) ? rawVendorId : null

    const resolvedSource = (() => {
      if (context === 'vendor') return 'vendor'
      if (context === 'admin') return isMarketplaceOwned ? 'admin' : 'vendor'
      return isMarketplaceOwned ? 'super_admin' : 'vendor'
    })()

    return {
      ...shared,
      vendorId: vendorIdForPayload,
      source: resolvedSource,
      productStatus: productStatus ?? shared.productStatus,
      categoryIds: validCategoryIds.length > 0 ? validCategoryIds : undefined,
      tagIds: validTagIds.length > 0 ? validTagIds : undefined
    }
  }

  const runSubmit = async (overrides?: Partial<SharedProductInput>) => {
    setIsLoading(true)
    try {
      if (typeof onSubmit !== 'function') {
        throw new Error('Handler de soumission manquant (onSubmit).')
      }

      const sanitizedData = await ensureProductImagesAreUploaded(productData)

      if (sanitizedData !== productData) {
        setProductData(sanitizedData)
      }

      const basePayload = getSharedPayload(undefined, sanitizedData) as SharedProductInput & { id?: string }
      const mergedPayload: SharedProductInput & { id?: string } = {
        ...basePayload,
        ...overrides,
        id: product?.id ?? basePayload.id
      }
      const payloadWithStatus = {
        ...mergedPayload,
        productStatus: mergedPayload.productStatus ?? productStatus ?? product?.productStatus
      }

      await onSubmit(payloadWithStatus)
      setProductStatus(payloadWithStatus.productStatus)
      await onSuccess?.()
      addNotification('success', mode === 'create' ? 'Produit créé' : 'Produit mis à jour', 'Les modifications ont été enregistrées avec succès.')
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde avancée:', error)
      addNotification('error', 'Sauvegarde impossible', 'Une erreur est survenue lors de l’enregistrement. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction de prévisualisation améliorée
  const handlePreview = () => {
    if (!productData.name) {
      addNotification('warning', 'Prévisualisation impossible', 'Veuillez d\'abord saisir le nom du produit')
      return
    }
    
    setIsPreviewOpen(true)
    
    // Créer une prévisualisation complète
    const previewData = {
      name: productData.name,
      description: productData.description || 'Aucune description disponible',
      shortDescription: productData.shortDescription || productData.description?.substring(0, 100) + '...' || 'Aucune description courte',
      price: productData.price,
      salePrice: productData.salePrice,
      images: productData.mainImage ? [productData.mainImage, ...productData.galleryImages] : productData.galleryImages,
      category: productData.category,
      brand: productData.brand,
      stock: productData.stockQuantity,
      tags: productData.tags,
      features: productData.attributes.map((attr: any) => attr.name).filter(Boolean),
      specifications: {
        weight: `${productData.weight} kg`,
        dimensions: `${productData.dimensions.length} × ${productData.dimensions.width} × ${productData.dimensions.height} cm`,
        shipping: productData.freeShipping ? 'Livraison gratuite' : `Livraison: ${formatPrice(productData.shippingCost)}`,
        sku: productData.sku
      }
    }
    
    // Ouvrir la prévisualisation dans un nouvel onglet avec un design moderne
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Prévisualisation - ${previewData.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .product-card { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
          </style>
        </head>
        <body class="bg-gray-50 min-h-screen">
          <div class="container mx-auto px-4 py-8">
            <div class="max-w-4xl mx-auto">
              <!-- En-tête de prévisualisation -->
              <div class="text-center mb-8">
                <div class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                  </svg>
                  Mode Prévisualisation
                </div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">${previewData.name}</h1>
                <p class="text-gray-600">Ceci est une prévisualisation de votre produit</p>
              </div>

              <!-- Carte du produit -->
              <div class="product-card bg-white rounded-2xl overflow-hidden">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                  <!-- Images -->
                  <div class="space-y-4">
                    ${previewData.images && previewData.images.length > 0 ? `
                      <div class="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img src="${previewData.images[0]}" alt="${previewData.name}" class="w-full h-full object-cover">
                      </div>
                      ${previewData.images.length > 1 ? `
                        <div class="grid grid-cols-4 gap-2">
                          ${previewData.images.slice(1, 5).map((img: string) => `
                            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img src="${img}" alt="" class="w-full h-full object-cover">
                            </div>
                          `).join('')}
                        </div>
                      ` : ''}
                    ` : `
                      <div class="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                    `}
                  </div>

                  <!-- Informations -->
                  <div class="space-y-6">
                    <!-- Prix -->
                    <div class="space-y-2">
                      ${previewData.salePrice > 0 ? `
                        <div class="text-3xl font-bold text-red-600">${formatPrice(previewData.salePrice)}</div>
                        <div class="text-xl text-gray-500 line-through">${formatPrice(previewData.price)}</div>
                        <div class="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                          -${Math.round(((previewData.price - previewData.salePrice) / previewData.price) * 100)}% de réduction
                        </div>
                      ` : `
                        <div class="text-3xl font-bold text-gray-900">${formatPrice(previewData.price)}</div>
                      `}
                    </div>

                    <!-- Description -->
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <p class="text-gray-600 leading-relaxed">${previewData.description}</p>
                    </div>

                    <!-- Caractéristiques -->
                    ${previewData.features && previewData.features.length > 0 ? `
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Caractéristiques</h3>
                        <ul class="space-y-1">
                          ${previewData.features.map((feature: string) => `
                            <li class="flex items-center text-gray-600">
                              <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                              </svg>
                              ${feature}
                            </li>
                          `).join('')}
                        </ul>
                      </div>
                    ` : ''}

                    <!-- Spécifications -->
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-2">Spécifications</h3>
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div class="flex justify-between">
                          <span class="text-gray-500">Poids:</span>
                          <span class="font-medium">${previewData.specifications.weight}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-500">Dimensions:</span>
                          <span class="font-medium">${previewData.specifications.dimensions}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-500">Livraison:</span>
                          <span class="font-medium">${previewData.specifications.shipping}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-500">SKU:</span>
                          <span class="font-medium">${previewData.specifications.sku}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Boutons d'action -->
                    <div class="flex gap-3">
                      <button class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                        Ajouter au panier
                      </button>
                      <button class="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Informations supplémentaires -->
              <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-xl border border-gray-200">
                  <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    </div>
                    <h3 class="font-semibold text-gray-900">Livraison</h3>
                  </div>
                  <p class="text-gray-600 text-sm">Livraison rapide et sécurisée dans toute la région</p>
                </div>

                <div class="bg-white p-6 rounded-xl border border-gray-200">
                  <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h3 class="font-semibold text-gray-900">Garantie</h3>
                  </div>
                  <p class="text-gray-600 text-sm">Garantie de satisfaction et support client 24/7</p>
                </div>

                <div class="bg-white p-6 rounded-xl border border-gray-200">
                  <div class="flex items-center mb-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                      </svg>
                    </div>
                    <h3 class="font-semibold text-gray-900">Paiement</h3>
                  </div>
                  <p class="text-gray-600 text-sm">Paiement sécurisé et options de paiement flexibles</p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `)
      
      previewWindow.document.close()
    }
    
    addNotification('success', 'Prévisualisation ouverte', 'La prévisualisation a été ouverte dans un nouvel onglet')
  }

  // Fonction de sauvegarde en brouillon
  const handleSaveDraft = async () => {
    if (!productData.name) {
      addNotification('warning', 'Brouillon impossible', 'Veuillez d\'abord saisir le nom du produit')
      return
    }
    
    try {
      const draftPayload = getSharedPayload() as SharedProductInput
      const draftKey = `seller-product-draft-${initialVendorId ?? 'unknown'}-${draftPayload.id ?? Date.now()}`
      localStorage.setItem(draftKey, JSON.stringify(draftPayload))
      setDraftData({ key: draftKey, payload: draftPayload })
      setIsDraftSaved(true)
      
      // Notification de sauvegarde réussie
      addNotification('success', 'Brouillon sauvegardé', 'Le brouillon a été sauvegardé localement.')
    } catch (error) {
      // Gestion de l'erreur de sauvegarde
      console.error('Erreur sauvegarde brouillon', error)
      
      // Notification d'erreur de sauvegarde
      addNotification('error', 'Erreur de sauvegarde', 'Impossible de sauvegarder le brouillon. Veuillez réessayer.')
    }
  }

  // Fonction de chargement d'un brouillon
  /**
   * Charge un brouillon sauvegardé et restaure l'état du formulaire.
   */
  const handleLoadDraft = () => {
    if (draftData?.payload) {
      setProductData(mapSharedToAdvancedData(draftData.payload))
      addNotification('success', 'Brouillon chargé', 'Le brouillon a été restauré avec succès')
    } else {
      addNotification('info', 'Aucun brouillon', 'Vous n’avez pas encore de brouillon sauvegardé')
    }
  }

  // Fonction de duplication
  /**
   * Crée une copie locale du produit courant pour accélérer la saisie d'un nouvel item.
   */
  const handleDuplicate = () => {
    const duplicatedProduct: AdvancedProductData = {
      ...productData,
      name: `${productData.name} (Copie)`,
      sku: `${productData.sku}-COPY`,
      groupedProducts: productData.groupedProducts.map((product) => ({
        ...product,
        id: Date.now() + Math.random()
      })),
      downloadableFiles: productData.downloadableFiles.map((file) => ({
        ...file,
        id: Date.now() + Math.random()
      })),
      promotionStartDate: null,
      promotionEndDate: null,
      featuredStartDate: null,
      featuredEndDate: null
    }

    const duplicatedShared = {
      ...getSharedPayload(),
      id: undefined,
      name: duplicatedProduct.name,
      sku: duplicatedProduct.sku
    } as unknown as SharedProductInput
    setProductData(mapSharedToAdvancedData(duplicatedShared))
    addNotification('success', 'Produit dupliqué !', 'Le produit a été dupliqué avec succès. Modifiez les informations et sauvegardez.', {
      label: 'Modifier maintenant',
      onClick: () => {
        setActiveTab('general')
      }
    })
  }

  // Fonction de sauvegarde avec statut spécifique
  const handleSaveWithStatus = async (status: 'active' | 'inactive' | 'pending_review') => {
    if (!productData.name) {
      addNotification('warning', 'Sauvegarde impossible', 'Veuillez d\'abord saisir le nom du produit')
      return
    }

    if (!productData.price || productData.price <= 0) {
      addNotification('warning', 'Prix invalide', 'Veuillez saisir un prix valide pour le produit')
      return
    }

    setIsLoading(true)

    try {
      setProductStatus(status)
      await runSubmit({ productStatus: status })
      if (mode === 'create') {
        setProductData(createInitialProductData())
        setProductStatus('draft')
      }
    } catch (error) {
      console.error('Erreur sauvegarde statut', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction de gestion des images
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'gallery') => {
    const files = event.target.files

    if (!files || files.length === 0) {
      return
    }

    const file = files[0]

    if (!file.type.startsWith('image/')) {
      addNotification('error', 'Type de fichier invalide', 'Veuillez sélectionner une image valide (JPG, PNG, GIF, WEBP).')
      event.target.value = ''
      return
    }

    const lowerName = String(file.name ?? '').trim().toLowerCase()
    if (file.type === 'image/x-icon' || lowerName.endsWith('.ico')) {
      addNotification('error', 'Format non supporté', 'Le format ICO n’est pas supporté. Utilisez plutôt PNG, JPG ou WEBP.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification('error', 'Fichier trop volumineux', "La taille de l'image ne doit pas dépasser 5MB.")
      event.target.value = ''
      return
    }

    try {
      const publicUrl = await uploadProductImage(file)

      if (type === 'main') {
        setProductData((prev) => ({ ...prev, mainImage: publicUrl }))
        addNotification('success', 'Image principale ajoutée', "L'image principale a été mise à jour avec succès.")
      } else {
        setProductData((prev) => ({
          ...prev,
          galleryImages: [...prev.galleryImages, publicUrl]
        }))
        addNotification('success', 'Image ajoutée', "L'image a été ajoutée à la galerie.")
      }
    } catch (error) {
      console.error('Erreur upload image produit:', error)
      addNotification('error', 'Upload impossible', "Le téléversement de l'image a échoué. Veuillez réessayer.")
    } finally {
      event.target.value = ''
    }
  }

  // Fonction de suppression d'image
  const handleRemoveImage = (index: number, type: 'main' | 'gallery') => {
    if (type === 'main') {
      setProductData(prev => ({ ...prev, mainImage: '' }))
      addNotification('info', 'Image supprimée', 'L\'image principale a été supprimée')
    } else {
      setProductData(prev => ({
        ...prev,
        galleryImages: prev.galleryImages.filter((_: any, i: number) => i !== index)
      }))
      addNotification('info', 'Image supprimée', 'L\'image a été retirée de la galerie')
    }
  }

  // Fonction de gestion des tags
  const handleAddTag = (tag: string) => {
    if (tag.trim() && !productData.tags.includes(tag.trim())) {
      setProductData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
      addNotification('success', 'Tag ajouté', `Le tag "${tag.trim()}" a été ajouté avec succès`)
      setSelectedTags(prev => [...prev, tag.trim()])
      setTagInput('')
    } else if (productData.tags.includes(tag.trim())) {
      addNotification('warning', 'Tag existant', 'Ce tag existe déjà pour ce produit')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setProductData(prev => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove)
    }))
    addNotification('info', 'Tag supprimé', `Le tag "${tagToRemove}" a été supprimé`)
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputCommit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddTag(tagInput)
    }
  }

  const handleCategoryChange = (value: ProductCategoryValue) => {
    setProductData((prev) => ({
      ...prev,
      category: value,
      subcategory: ''
    }))
  }

  const formatProductTypeLabel = (type: ProductTypeValue) => {
    switch (type) {
      case 'simple':
        return 'Simple'
      case 'variable':
        return 'Variable'
      case 'virtual':
        return 'Virtuel'
      case 'downloadable':
        return 'Téléchargeable'
      default:
        return 'Produit'
    }
  }

  const handleProductTypeChange = (type: ProductTypeValue) => {
    setProductData((prev) => ({
      ...prev,
      productType: type,
      virtual: type === 'virtual',
      downloadable: type === 'downloadable',
      downloadableFiles: type === 'downloadable' ? prev.downloadableFiles : []
    }))
  }

  const handleGroupedOption = (enabled: boolean) => {
    setProductData((prev) => ({
      ...prev,
      isGrouped: enabled,
      groupedProducts: enabled ? prev.groupedProducts : []
    }))
  }

  const handleAddGroupedProduct = () => {
    const value = groupedProductInput.trim()
    if (!value) {
      return
    }

    const newProduct = {
      id: createLocalNumericId(),
      name: value,
      price: 0
    }

    setProductData((prev) => ({
      ...prev,
      groupedProducts: [...prev.groupedProducts, newProduct]
    }))

    setGroupedProductInput('')
  }

  const handleRemoveGroupedProduct = (id: number) => {
    setProductData((prev) => ({
      ...prev,
      groupedProducts: prev.groupedProducts.filter((product: any) => product.id !== id)
    }))
  }

  const handleAddDownloadableFile = () => {
    const timestamp = createLocalNumericId()
    const newFile: DownloadableFile = {
      id: timestamp,
      name: `Fichier-${timestamp}`,
      url: '',
      expirationDate: null,
      maxDownloadsPerCustomer: 0,
      maxGlobalDownloads: 0,
      sourceType: 'url',
      uploadedFileName: null,
      uploadedFileSize: null,
      uploadedFileType: null,
      uploadedFileDataUrl: null,
      uploadedAt: null
    }

    setProductData((prev) => ({
      ...prev,
      downloadable: true,
      downloadableFiles: [...(prev.downloadableFiles || []), newFile]
    }))
  }

  const handleRemoveDownloadableFile = (fileId: number) => {
    setProductData((prev) => ({
      ...prev,
      downloadableFiles: (prev.downloadableFiles || []).filter((file: DownloadableFile) => file.id !== fileId)
    }))
  }

  const handleUpdateDownloadableFile = (fileId: number, updates: Partial<DownloadableFile>) => {
    setProductData((prev) => ({
      ...prev,
      downloadableFiles: (prev.downloadableFiles || []).map((file: DownloadableFile) =>
        file.id === fileId ? { ...file, ...updates } : file
      )
    }))
  }

  const handleAddAttribute = () => {
    const newAttribute = {
      name: '',
      values: [''],
      visible: true,
      variation: false
    }
    
    setProductData(prev => ({
      ...prev,
      attributes: [...prev.attributes, newAttribute]
    }))
    
    addNotification('success', 'Attribut ajouté', 'Un nouvel attribut a été ajouté. Remplissez ses informations.')
  }

  const handleUpdateAttribute = (index: number, field: string, value: any) => {
    setProductData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr: any, i: number) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }))
  }

  const handleRemoveAttribute = (index: number) => {
    setProductData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_: any, i: number) => i !== index)
    }))
    addNotification('info', 'Attribut supprimé', 'L\'attribut a été supprimé du produit')
  }

  // Fonction de gestion des variations
  const handleAddVariation = () => {
    const newVariation = {
      id: createLocalNumericId(),
      attributes: {},
      price: productData.price,
      salePrice: 0,
      stock: productData.stockQuantity,
      sku: `${productData.sku}-VAR`,
      image: ''
    }
    
    setProductData(prev => ({
      ...prev,
      variations: [...prev.variations, newVariation]
    }))
    
    addNotification('success', 'Variation ajoutée', 'Une nouvelle variation a été ajoutée au produit')
  }

  const handleUpdateVariation = (index: number, field: string, value: any) => {
    setProductData(prev => ({
      ...prev,
      variations: prev.variations.map((variation: any, i: number) => 
        i === index ? { ...variation, [field]: value } : variation
      )
    }))
  }

  const handleRemoveVariation = (index: number) => {
    setProductData(prev => ({
      ...prev,
      variations: prev.variations.filter((_: any, i: number) => i !== index)
    }))
    addNotification('info', 'Variation supprimée', 'La variation a été supprimée du produit')
  }

  // Fonction de gestion des produits liés
  const handleAddRelatedProduct = (type: 'upsell' | 'crossSell' | 'grouped' | 'similar') => {
    const productName = prompt(`Nom du produit ${type === 'upsell' ? 'de vente croisée' : type === 'crossSell' ? 'complémentaire' : type === 'grouped' ? 'groupé' : 'similaire'} :`)
    
    if (productName) {
      const newProduct = {
        id: Date.now(),
        name: productName,
        price: 0,
        image: ''
      }
      
      setProductData(prev => ({
        ...prev,
        [type === 'upsell' ? 'upsells' : type === 'crossSell' ? 'crossSells' : type === 'grouped' ? 'groupedProducts' : 'similarProducts']: 
          [...prev[type === 'upsell' ? 'upsells' : type === 'crossSell' ? 'crossSells' : type === 'grouped' ? 'groupedProducts' : 'similarProducts'], newProduct]
      }))
      
      addNotification('success', 'Produit lié ajouté', `Le produit "${productName}" a été ajouté avec succès`)
    }
  }

  const handleRemoveRelatedProduct = (type: 'upsell' | 'crossSell' | 'grouped' | 'similar', index: number) => {
    const fieldName = type === 'upsell' ? 'upsells' : type === 'crossSell' ? 'crossSells' : type === 'grouped' ? 'groupedProducts' : 'similarProducts'
    
    setProductData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_: any, i: number) => i !== index)
    }))
    
    addNotification('info', 'Produit lié supprimé', 'Le produit lié a été supprimé avec succès')
  }

  // Fonction de gestion des champs personnalisés
  const handleAddCustomField = () => {
    const fieldName = prompt('Nom du champ personnalisé :')
    const fieldValue = prompt('Valeur du champ :')
    
    if (fieldName && fieldValue) {
      setProductData(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [fieldName]: fieldValue
        }
      }))
      
      addNotification('success', 'Champ ajouté', `Le champ personnalisé "${fieldName}" a été ajouté avec succès`)
    }
  }

  const handleRemoveCustomField = (fieldName: string) => {
    setProductData(prev => {
      const newCustomFields = { ...prev.customFields }
      delete newCustomFields[fieldName]
      return { ...prev, customFields: newCustomFields }
    })
    
    addNotification('info', 'Champ supprimé', `Le champ "${fieldName}" a été supprimé`)
  }

  // Fonction de gestion des alertes de stock
  const handleAddStockAlert = () => {
    const threshold = prompt('Seuil d\'alerte de stock :')
    if (threshold && !isNaN(Number(threshold))) {
      setStockAlerts(prev => [...prev, {
        id: Date.now(),
        threshold: Number(threshold),
        active: true
      }])
      
      addNotification('success', 'Alerte ajoutée', `Alerte de stock configurée à ${threshold} unités`)
    }
  }

  const handleToggleStockAlert = (id: number) => {
    setStockAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ))
    
    const alert = stockAlerts.find(a => a.id === id)
    if (alert) {
      addNotification('info', 'Alerte modifiée', `L'alerte de stock est maintenant ${alert.active ? 'désactivée' : 'activée'}`)
    }
  }

  const handleRemoveStockAlert = (id: number) => {
    setStockAlerts(prev => prev.filter(alert => alert.id !== id))
    addNotification('info', 'Alerte supprimée', 'L\'alerte de stock a été supprimée')
  }

  // Fonction de calcul automatique des dimensions
  const calculateDimensions = () => {
    if (productData.weight > 0) {
      // Simulation de calcul basé sur le poids
      const estimatedVolume = productData.weight * 100 // cm³
      const side = Math.cbrt(estimatedVolume)
      
      setProductData(prev => ({
        ...prev,
        dimensions: {
          length: Math.round(side),
          width: Math.round(side),
          height: Math.round(side)
        }
      }))
      
      addNotification('success', 'Dimensions calculées', 'Les dimensions ont été calculées automatiquement basées sur le poids')
    } else {
      addNotification('warning', 'Poids requis', 'Veuillez d\'abord saisir le poids du produit')
    }
  }

  // Fonction de génération automatique du SKU
  const generateSKU = () => {
    if (productData.name && productData.category) {
      const prefix = productData.category.substring(0, 3).toUpperCase()
      const nameCode = productData.name.substring(0, 3).toUpperCase()
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
      
      const newSKU = `${prefix}-${nameCode}-${randomCode}`
      setProductData(prev => ({ ...prev, sku: newSKU }))
      
      addNotification('success', 'SKU généré', `Le SKU "${newSKU}" a été généré automatiquement`)
    } else {
      addNotification('warning', 'Informations manquantes', 'Veuillez saisir le nom et la catégorie du produit')
    }
  }

  // Fonction de validation des données
  const validateForm = (): boolean => {
    const errors: string[] = []
    
    const trimmedName = productData.name.trim()

    if (!trimmedName) errors.push('Le nom du produit est obligatoire')
    if (trimmedName.length > 0 && trimmedName.length < 2) {
      errors.push('Le nom du produit doit contenir au moins 2 caractères')
    }
    if (productData.price <= 0) errors.push('Le prix doit être supérieur à 0')
    if (productData.stockQuantity < 0) errors.push('Le stock ne peut pas être négatif')
    if (productData.salePrice > 0 && productData.salePrice >= productData.price) {
      errors.push('Le prix de vente doit être inférieur au prix régulier')
    }
    
    if (errors.length > 0) {
      addNotification('error', 'Erreurs de validation', errors.join('\n'))
      return false
    }
    
    return true
  }

  // Fonction de sauvegarde avec validation
  const handleSaveWithValidation = async () => {
    if (!validateForm()) return
    await runSubmit()
  }

  // Fonction de calcul des frais de paiement différé
  const calculateDeferredPaymentFees = (
    principal: number,
    rate: number,
    type: 'percentage' | 'fixed',
    period: 'day' | 'month' | 'quarter',
    periods: number,
    method: 'simple' | 'compound'
  ): number => {
    if (type === 'fixed') {
      return rate * periods
    }
    
    if (method === 'simple') {
      return (principal * rate * periods) / 100
    } else {
      // Intérêts composés
      const multiplier = Math.pow(1 + (rate / 100), periods)
      return principal * (multiplier - 1)
    }
  }

  // Fonction de calcul du score SEO
  const calculateSEOScore = (): number => {
    let score = 0
    if (productData.seoTitle) score += 25
    if (productData.seoDescription) score += 25
    if (productData.seoKeywords) score += 25
    if (productData.tags.length > 0) score += 25
    return score
  }

  // Fonction d'optimisation IA
  const handleAIOptimization = async () => {
    setIsAIOptimizing(true)
    // Simulation d'optimisation IA
    setTimeout(() => {
      setAiSuggestions([
        `Ajoutez "Premium" dans le titre pour +15% de conversion`,
        `Utilisez "Garantie 2 ans" dans la description`,
        `Prix optimal suggéré: ${formatPrice(89990)} au lieu de ${formatPrice(95000)}`,
        `Mots-clés tendance: 'Éco-responsable', 'Made in France'`
      ])
      setIsAIOptimizing(false)
    }, 2000)
  }

  // Fonction d'analyse de marché IA
  const handleMarketAnalysis = async () => {
    setIsAIOptimizing(true)
    // Simulation d'analyse de marché
    setTimeout(() => {
      setAiSuggestions([
        `Marché en croissance: +23% de conversion estimée`,
        `Prix optimal suggéré: ${formatPrice(89990)}`,
        `Visiteurs estimés: 15k par mois`,
        `Concurrence: 3 vendeurs actifs dans cette catégorie`
      ])
      setIsAIOptimizing(false)
    }, 2000)
  }

  // Calcul du score SEO en temps réel
  useEffect(() => {
    let score = 0
    if (productData.name) score += 20
    if (productData.description) score += 20
    if (productData.seoTitle) score += 15
    if (productData.seoDescription) score += 15
    if (productData.seoKeywords) score += 10
    if (productData.mainImage) score += 10
    if (productData.tags.length > 0) score += 10
    setSeoScore(score)
  }, [productData])

  // Tags prédéfinis
  const predefinedTags = ['Premium', 'Nouveau', 'Populaire', 'Éco-responsable', 'Garantie', 'Livraison gratuite']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {mode === 'create' ? 'Créer un Nouveau Produit' : 'Modifier le Produit'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Barre d'outils principale */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'Créer un Nouveau Produit' : 'Modifier le Produit'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Bouton Aperçu */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </Button>
            
            {/* Bouton Brouillon / Rendre actif */}
            {mode === 'edit' && productStatus === 'draft' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveWithStatus('active')}
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Rendre actif
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Brouillon
              </Button>
            )}
            
            {/* Bouton Inactif */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveWithStatus('inactive')}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Inactif
            </Button>
            
            {/* Bouton En Attente */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveWithStatus('pending_review')}
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-colors"
            >
              <Clock className="h-4 w-4 mr-2" />
              En Attente
            </Button>
            
            {/* Bouton Charger Brouillon */}
            {isDraftSaved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadDraft}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Charger
              </Button>
            )}
            
            {/* Bouton Dupliquer */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
            >
              <Copy className="h-4 w-4 mr-2" />
              Dupliquer
            </Button>
            
            {/* Bouton Annuler */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            
            {/* Bouton Créer/Modifier */}
            <Button 
              onClick={() => handleSaveWithStatus('active')} 
              disabled={isLoading}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Créer' : 'Modifier'}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Barre d'onglets principale */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-9 bg-gray-100 p-1 min-w-max">
                <TabsTrigger value="general" className="text-xs whitespace-nowrap text-gray-600 hover:text-gray-800">Général</TabsTrigger>
                <TabsTrigger 
                  value="pricing" 
                  className="text-xs whitespace-nowrap bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300 text-orange-800 font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:border-orange-600"
                >
                  Prix et Paiements
                </TabsTrigger>
                <TabsTrigger value="inventory" className="text-xs whitespace-nowrap">Inventaire</TabsTrigger>
                <TabsTrigger value="shipping" className="text-xs whitespace-nowrap">Livraison</TabsTrigger>
                <TabsTrigger value="seo" className="text-xs whitespace-nowrap">SEO</TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs whitespace-nowrap">Avancé</TabsTrigger>
                <TabsTrigger value="related" className="text-xs whitespace-nowrap">Produits Liés</TabsTrigger>
                <TabsTrigger value="social" className="text-xs whitespace-nowrap">Social</TabsTrigger>
                <TabsTrigger value="ai-seo" className="text-xs whitespace-nowrap">IA & SEO</TabsTrigger>
              </TabsList>
            </div>

            {/* Onglet Général */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6">
                {/* Informations de base */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Informations de Base</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Nom du produit *</Label>
                      <Input
                        id="name"
                        value={productData.name}
                        onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom du produit"
                        className="border-blue-300 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="shortDescription">Description courte</Label>
                      <Textarea
                        id="shortDescription"
                        value={productData.shortDescription}
                        onChange={(e) => setProductData(prev => ({ ...prev, shortDescription: e.target.value }))}
                        placeholder="Description courte du produit"
                        className="border-blue-300 focus:border-blue-500"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description complète</Label>
                      <Textarea
                        id="description"
                        value={productData.description}
                        onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description détaillée du produit"
                        className="border-blue-300 focus:border-blue-500"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Suggestions de tags populaires</Label>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_TAGS.map((suggestion) => (
                          <Badge
                            key={suggestion}
                            variant="outline"
                            className="cursor-pointer border-dashed border-purple-400 text-purple-600 hover:bg-purple-50"
                            onClick={() => handleAddTag(suggestion)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tagInput">Tags et mots-clés</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tagInput"
                          placeholder="Ajouter un tag"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputCommit}
                          className="border-purple-300 focus:border-purple-500"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTag(tagInput)}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>

                      {productData.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {productData.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 cursor-pointer"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              {tag}
                              <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Catégorisation */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Catégorisation & Identifiants</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="category">Catégorie principale</Label>
                      <Select
                        value={productData.category}
                        onValueChange={(value) => handleCategoryChange(value as ProductCategoryValue)}
                        disabled={isLoadingCategories}
                      >
                        <SelectTrigger className="border-green-300">
                          <SelectValue placeholder={isLoadingCategories ? 'Chargement...' : 'Sélectionner une catégorie'} />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Aucune catégorie disponible</div>
                          ) : (
                            categoryOptions.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subcategory">Sous-catégorie</Label>
                      <Select
                        value={productData.subcategory}
                        onValueChange={(value) => setProductData((prev) => ({ ...prev, subcategory: value as ProductSubcategoryValue }))}
                        disabled={!productData.category || isLoadingCategories}
                      >
                        <SelectTrigger className="border-green-300">
                          <SelectValue placeholder={isLoadingCategories ? 'Chargement...' : 'Sélectionner une sous-catégorie'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubcategories.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              {productData.category ? 'Aucune sous-catégorie disponible' : 'Choisissez une catégorie'}
                            </div>
                          ) : (
                            availableSubcategories.map((sub) => (
                              <SelectItem key={sub.value} value={sub.value}>
                                {sub.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="brand">Marque</Label>
                      <Input
                        id="brand"
                        value={productData.brand}
                        onChange={(e) => setProductData(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="Marque du produit"
                        className="border-green-300 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <div className="flex gap-2">
                        <Input
                          id="sku"
                          value={productData.sku}
                          onChange={(e) => setProductData(prev => ({ ...prev, sku: e.target.value }))}
                          placeholder="Code SKU"
                          className="border-green-300 focus:border-green-500"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateSKU}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="warranty">Garantie</Label>
                        <Input
                          id="warranty"
                          value={productData.warranty}
                          onChange={(e) => setProductData((prev) => ({ ...prev, warranty: e.target.value }))}
                          placeholder="Ex: 1 an"
                          className="border-green-300 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="returnPolicy">Retours</Label>
                        <Input
                          id="returnPolicy"
                          value={productData.returnPolicy}
                          onChange={(e) => setProductData((prev) => ({ ...prev, returnPolicy: e.target.value }))}
                          placeholder="Ex: 30 jours satisfait ou remboursé"
                          className="border-green-300 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-dashed border-green-300 bg-green-50/60 p-4">
                    <div className="flex items-start gap-3">
                      <Info className="mt-1 h-5 w-5 text-green-500" />
                      <div className="text-sm text-green-700 space-y-1">
                        <p>
                          Sélectionnez une catégorie précise pour débloquer des suggestions d’attributs et optimiser le référencement.
                        </p>
                        <p>
                          Votre choix impacte les filtres de navigation et les recommandations produit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {context !== 'vendor' && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#ff6600]" />
                      <h3 className="text-lg font-semibold text-gray-900">Propriété du produit</h3>
                    </div>

                    <div className="rounded-lg border border-[#ff6600]/30 bg-[#ff6600]/5 p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-[#ff6600]">Produit du catalogue marketplace</p>
                          <p className="text-sm text-[#7a4c2a]">
                            Activez cette option pour créer un produit appartenant directement à l’administration. Désactivez-la pour l’associer à un vendeur spécifique.
                          </p>
                        </div>
                        <Switch
                          checked={isMarketplaceOwned}
                          onCheckedChange={(checked) => {
                            setIsMarketplaceOwned(checked)
                            setSelectedVendorId(checked ? SUPER_ADMIN_VENDOR_ID : null)
                          }}
                        />
                      </div>

                      {!isMarketplaceOwned && (
                        <div className="space-y-2">
                          <Label htmlFor="vendor-select">Associer à un vendeur</Label>
                          <Select
                            value={selectedVendorId ?? ''}
                            onValueChange={(value) => setSelectedVendorId(value)}
                            disabled={vendorOptions.length === 0}
                          >
                            <SelectTrigger id="vendor-select" className="border-[#ff6600]/50">
                              <SelectValue placeholder={vendorOptions.length === 0 ? 'Aucun vendeur disponible' : 'Sélectionner un vendeur'} />
                            </SelectTrigger>
                            <SelectContent>
                              {vendorOptions.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {vendorOptions.length === 0 && (
                            <p className="text-xs text-[#7a4c2a]">
                              Aucun vendeur n’est disponible pour le moment. Ajoutez d’abord un compte vendeur afin de lier ce produit.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Typologies & Options */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Typologies de produit */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Typologies de produit</h3>
                    </div>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      {formatProductTypeLabel(productData.productType)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRODUCT_TYPE_OPTIONS.map((option) => (
                      <ProductTypologyCard
                        key={option.value}
                        option={option}
                        isActive={productData.productType === option.value}
                        onSelect={() => handleProductTypeChange(option.value)}
                      />
                    ))}
                  </div>

                  {productData.productType === 'variable' && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        <BarChart3 className="h-5 w-5" />
                        <p className="font-medium">Gestion des variations activée</p>
                      </div>
                      <p className="text-sm text-blue-800">
                        Configurez vos attributs et variations dans l’onglet « Avancé ». Chaque variation peut disposer d’un prix, d’une image et d’un stock spécifique.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('advanced')} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        Gérer les variations
                      </Button>
                    </div>
                  )}

                  {productData.productType === 'downloadable' && (
                    <DownloadableSettingsPanel
                      files={productData.downloadableFiles || []}
                      onAddFile={handleAddDownloadableFile}
                      onRemoveFile={handleRemoveDownloadableFile}
                      onUpdateFile={handleUpdateDownloadableFile}
                    />
                  )}
                </div>

                {/* Options avancées */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Options avancées</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ProductOptionToggle
                      icon={Users}
                      title="Produit groupé"
                      description="Associez plusieurs produits pour une vente groupée ou un kit complet."
                      checked={productData.isGrouped}
                      onChange={handleGroupedOption}
                    >
                      <div className="space-y-3 rounded-md border border-purple-200 bg-purple-50/70 p-3">
                        <div className="text-sm font-semibold text-purple-800">Configuration du produit groupé</div>
                        <p className="text-xs text-purple-600">Ajoutez ou sélectionnez les produits à inclure dans ce pack. Chaque article conservera sa fiche mais sera vendu ensemble.</p>

                        <div className="grid gap-2">
                          <Label className="text-xs uppercase text-purple-700">Rechercher un produit</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nom ou SKU du produit"
                              className="border-purple-300 focus:border-purple-500"
                              value={groupedProductInput}
                              onChange={(event) => setGroupedProductInput(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  handleAddGroupedProduct()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="border-purple-300 text-purple-700 hover:bg-purple-100"
                              onClick={handleAddGroupedProduct}
                            >
                              Ajouter
                            </Button>
                          </div>
                        </div>

                        {productData.groupedProducts.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-purple-700 uppercase">Produits sélectionnés</div>
                            <div className="space-y-2">
                              {productData.groupedProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between rounded border border-purple-200 bg-white px-3 py-2 text-sm text-purple-800">
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    {product.sku && <div className="text-xs text-purple-600">SKU : {product.sku}</div>}
                                  </div>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="text-purple-500 hover:text-purple-700"
                                    onClick={() => handleRemoveGroupedProduct(product.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ProductOptionToggle>

                    <ProductOptionToggle
                      icon={Globe}
                      title="Produit externe / affiliation"
                      description="Redirigez l’utilisateur vers un site externe pour l’achat du produit."
                      checked={productData.external || false}
                      onChange={(checked) => setProductData(prev => ({ ...prev, external: checked }))}
                    >
                      <div className="space-y-3 rounded-md border border-sky-200 bg-sky-50/70 p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="external-url" className="text-xs uppercase text-sky-700">URL d’affiliation *</Label>
                            <Input
                              id="external-url"
                              value={productData.externalUrl}
                              onChange={(event) => setProductData(prev => ({ ...prev, externalUrl: event.target.value }))}
                              placeholder="https://partenaire.com/produit"
                              className="border-sky-300 focus:border-sky-500"
                            />
                          </div>

                          <div>
                            <Label htmlFor="external-button" className="text-xs uppercase text-sky-700">Texte du bouton</Label>
                            <Input
                              id="external-button"
                              value={productData.externalButtonText}
                              onChange={(event) => setProductData(prev => ({ ...prev, externalButtonText: event.target.value }))}
                              placeholder="Acheter maintenant"
                              className="border-sky-300 focus:border-sky-500"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="external-note" className="text-xs uppercase text-sky-700">Note interne</Label>
                          <Textarea
                            id="external-note"
                            value={productData.customFields?.externalNote || ''}
                            onChange={(event) => setProductData(prev => ({
                              ...prev,
                              customFields: {
                                ...prev.customFields,
                                externalNote: event.target.value
                              }
                            }))}
                            placeholder="Ajoutez des précisions sur les conditions d’affiliation."
                            className="border-sky-300 focus:border-sky-500"
                          />
                        </div>
                      </div>
                    </ProductOptionToggle>

                    <ProductOptionToggle
                      icon={Star}
                      title="Produit en vedette"
                      description="Mettez en avant ce produit sur la boutique et dans les recommandations."
                      checked={productData.featured}
                      onChange={(checked) => setProductData(prev => ({ ...prev, featured: checked }))}
                    >
                      <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/70 p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="featured-badge" className="text-xs uppercase text-amber-700">Badge personnalisé</Label>
                            <Input
                              id="featured-badge"
                              value={productData.featuredBadgeText}
                              onChange={(event) => setProductData(prev => ({ ...prev, featuredBadgeText: event.target.value }))}
                              placeholder="Coup de cœur, Best Seller, ..."
                              className="border-amber-300 focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <Label className="text-xs uppercase text-amber-700">Durée de mise en avant</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="date"
                                value={productData.featuredStartDate ?? ''}
                                onChange={(event) => setProductData(prev => ({ ...prev, featuredStartDate: event.target.value || null }))}
                                className="border-amber-300 focus:border-amber-500"
                              />
                              <Input
                                type="date"
                                value={productData.featuredEndDate ?? ''}
                                onChange={(event) => setProductData(prev => ({ ...prev, featuredEndDate: event.target.value || null }))}
                                className="border-amber-300 focus:border-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-amber-700">Après la date de fin, le produit revient automatiquement à son état standard.</p>
                      </div>
                    </ProductOptionToggle>

                    <ProductOptionToggle
                      icon={TrendingDown}
                      title="Produit en promotion"
                      description="Activez un prix promotionnel ou des règles auto de remise."
                      checked={productData.onSale}
                      onChange={(checked) => setProductData(prev => ({ ...prev, onSale: checked }))}
                    >
                      <div className="space-y-3 rounded-md border border-rose-200 bg-rose-50/70 p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="sale-price" className="text-xs uppercase text-rose-700">Prix promotionnel</Label>
                            <Input
                              id="sale-price"
                              type="number"
                              min={0}
                              value={productData.salePrice}
                              onChange={(event) => setProductData(prev => ({ ...prev, salePrice: Number(event.target.value) }))}
                              className="border-rose-300 focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <Label className="text-xs uppercase text-rose-700">Début</Label>
                            <Input
                              type="date"
                              value={productData.promotionStartDate ?? ''}
                              onChange={(event) => setProductData(prev => ({ ...prev, promotionStartDate: event.target.value || null }))}
                              className="border-rose-300 focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <Label className="text-xs uppercase text-rose-700">Fin</Label>
                            <Input
                              type="date"
                              value={productData.promotionEndDate ?? ''}
                              onChange={(event) => setProductData(prev => ({ ...prev, promotionEndDate: event.target.value || null }))}
                              className="border-rose-300 focus:border-rose-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            id="promotion-auto"
                            checked={productData.promotionAutoRestore}
                            onCheckedChange={(checked) => setProductData(prev => ({ ...prev, promotionAutoRestore: checked }))}
                          />
                          <Label htmlFor="promotion-auto" className="text-xs uppercase text-rose-700">Rétablir automatiquement le prix standard</Label>
                        </div>
                      </div>
                    </ProductOptionToggle>

                    <ProductOptionToggle
                      icon={CreditCard}
                      title="Paiement différé"
                      description="Autorisez les paiements en plusieurs fois avec frais personnalisés."
                      checked={productData.deferredPayment}
                      onChange={(checked) => setProductData(prev => ({ ...prev, deferredPayment: checked }))}
                      footer={productData.deferredPayment ? (
                        <DeferredPaymentSummary price={productData.price} fees={productData.deferredPaymentFees} />
                      ) : undefined}
                    />

                    <ProductOptionToggle
                      icon={Heart}
                      title="Produit favori"
                      description="Marquez ce produit comme favori pour le suivi marketing."
                      checked={productData.isFavorite || false}
                      onChange={(checked) => setProductData(prev => ({ ...prev, isFavorite: checked }))}
                    >
                      <div className="space-y-2 rounded-md border border-pink-200 bg-pink-50/70 p-3">
                        <Label htmlFor="favorite-note" className="text-xs uppercase text-pink-700">Note interne</Label>
                        <Textarea
                          id="favorite-note"
                          value={productData.favoriteNote}
                          onChange={(event) => setProductData(prev => ({ ...prev, favoriteNote: event.target.value }))}
                          placeholder="Ex : performer auprès des clients VIP, inclure dans la prochaine campagne."
                          className="border-pink-300 focus:border-pink-500"
                          rows={3}
                        />
                      </div>
                    </ProductOptionToggle>
                  </div>

                  {productData.deferredPayment && (
                    <DeferredPaymentConfigurator
                      fees={productData.deferredPaymentFees}
                      onChange={(fees) => setProductData(prev => ({ ...prev, deferredPaymentFees: fees }))}
                    />
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Onglet Inventaire */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gestion du stock */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Gestion du Stock</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="manageStock"
                        checked={productData.manageStock}
                        onCheckedChange={(checked) => setProductData(prev => ({ ...prev, manageStock: checked }))}
                      />
                      <Label htmlFor="manageStock">Gérer le stock</Label>
                    </div>
                    
                    {productData.manageStock && (
                      <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <Label htmlFor="stockQuantity">Quantité en stock</Label>
                          <Input
                            id="stockQuantity"
                            type="number"
                            value={productData.stockQuantity}
                            onChange={(e) => setProductData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                            className="border-blue-300"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="lowStockThreshold">Seuil d'alerte de stock</Label>
                          <Input
                            id="lowStockThreshold"
                            type="number"
                            value={productData.lowStockThreshold}
                            onChange={(e) => setProductData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 5 }))}
                            className="border-blue-300"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="allowBackorders"
                            checked={productData.allowBackorders}
                            onCheckedChange={(checked) => setProductData(prev => ({ ...prev, allowBackorders: checked }))}
                          />
                          <Label htmlFor="allowBackorders">Autoriser les commandes en attente</Label>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="stockStatus">Statut du stock</Label>
                      <Select 
                        value={productData.stockStatus} 
                        onValueChange={(value) =>
                          setProductData(prev => ({
                            ...prev,
                            stockStatus: value as AdvancedProductData['stockStatus']
                          }))
                        }
                      >
                        <SelectTrigger className="border-blue-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instock">En stock</SelectItem>
                          <SelectItem value="outofstock">Rupture de stock</SelectItem>
                          <SelectItem value="onbackorder">En commande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Alertes de stock */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Alertes de stock</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddStockAlert}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    
                    {stockAlerts.length > 0 && (
                      <div className="space-y-2">
                        {stockAlerts.map((alert) => (
                          <div key={alert.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={alert.active}
                                onCheckedChange={() => handleToggleStockAlert(alert.id)}
                              />
                              <span className="text-sm text-yellow-800">
                                Alerte à {alert.threshold} unités
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStockAlert(alert.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gestion des images */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Images et Médias</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Image principale */}
                    <div>
                      <Label>Image principale</Label>
                      <div className="mt-2">
                        {productData.mainImage ? (
                          <div className="relative">
                            <img 
                              src={productData.mainImage} 
                              alt="Image principale" 
                              className="w-full h-32 object-cover rounded-lg border border-gray-300"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveImage(0, 'main')}
                              className="absolute top-2 right-2 bg-red-600 text-white hover:bg-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">Aucune image principale</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'main')}
                              className="hidden"
                              id="mainImageUpload"
                            />
                            <Label 
                              htmlFor="mainImageUpload"
                              className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Choisir une image
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Galerie d'images */}
                    <div>
                      <Label>Galerie d'images</Label>
                      <div className="mt-2">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {productData.galleryImages.map((image: string, index: number) => (
                            <div key={index} className="relative">
                              <img 
                                src={image} 
                                alt={`Image ${index + 1}`} 
                                className="w-full h-20 object-cover rounded border border-gray-300"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveImage(index, 'gallery')}
                                className="absolute top-1 right-1 bg-red-600 text-white hover:bg-red-700 w-6 h-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'gallery')}
                          className="hidden"
                          id="galleryImageUpload"
                        />
                        <Label 
                          htmlFor="galleryImageUpload"
                          className="cursor-pointer bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
                        >
                          <Plus className="h-4 w-4 mr-1 inline" />
                          Ajouter des images
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Livraison */}
            <TabsContent value="shipping" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dimensions et poids */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Dimensions et Poids</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="weight">Poids (kg)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={productData.weight}
                          onChange={(e) => setProductData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.5"
                          className="border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={calculateDimensions}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Calculer
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="length">Longueur (cm)</Label>
                        <Input
                          id="length"
                          type="number"
                          value={productData.dimensions.length}
                          onChange={(e) => setProductData(prev => ({ 
                            ...prev, 
                            dimensions: { ...prev.dimensions, length: parseFloat(e.target.value) || 0 }
                          }))}
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="width">Largeur (cm)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={productData.dimensions.width}
                          onChange={(e) => setProductData(prev => ({ 
                            ...prev, 
                            dimensions: { ...prev.dimensions, width: parseFloat(e.target.value) || 0 }
                          }))}
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="height">Hauteur (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={productData.dimensions.height}
                          onChange={(e) => setProductData(prev => ({ 
                            ...prev, 
                            dimensions: { ...prev.dimensions, height: parseFloat(e.target.value) || 0 }
                          }))}
                          className="border-blue-300 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Calcul du volume */}
                    {productData.dimensions.length > 0 && productData.dimensions.width > 0 && productData.dimensions.height > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800 mb-2">Calculs automatiques :</div>
                        <div className="space-y-1 text-sm text-blue-700">
                          <div>Volume: {(productData.dimensions.length * productData.dimensions.width * productData.dimensions.height / 1000000).toFixed(3)} m³</div>
                          <div>Poids volumétrique: {Math.max(productData.weight, (productData.dimensions.length * productData.dimensions.width * productData.dimensions.height) / 5000).toFixed(2)} kg</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Options de livraison */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Options de Livraison</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="freeShipping"
                        checked={productData.freeShipping}
                        onCheckedChange={(checked) => {
                          if (isVendorShippingReadOnly) return
                          setProductData((prev) => ({ ...prev, freeShipping: checked }))
                        }}
                        disabled={isVendorShippingReadOnly}
                      />
                      <Label htmlFor="freeShipping">Livraison gratuite</Label>
                    </div>
                    
                    {!productData.freeShipping && (
                      <div>
                        <Label htmlFor="shippingCost">Coût de livraison (FCFA)</Label>
                        <Input
                          id="shippingCost"
                          type="number"
                          value={productData.shippingCost}
                          onChange={(e) => {
                            if (isVendorShippingReadOnly) return
                            setProductData((prev) => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))
                          }}
                          placeholder="0"
                          className={`border-green-300 focus:border-green-500 ${isVendorShippingReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                          disabled={isVendorShippingReadOnly}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Équivalent: {formatPoints(convertAmountToPoints(productData.shippingCost))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="shippingClass">Classe de livraison</Label>
                      <Select 
                        value={productData.shippingClass} 
                        onValueChange={(value) => {
                          if (isVendorShippingReadOnly) return
                          setProductData((prev) => ({ ...prev, shippingClass: value }))
                        }}
                        disabled={isVendorShippingReadOnly}
                      >
                        <SelectTrigger className={`border-green-300 ${isVendorShippingReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="express">Express</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="economy">Économique</SelectItem>
                          <SelectItem value="heavy">Lourd</SelectItem>
                          <SelectItem value="fragile">Fragile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Zones de livraison */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Zones de Livraison</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Local', cost: 0, time: '1-2 jours', color: 'green' },
                    { name: 'Régional', cost: 500, time: '2-4 jours', color: 'blue' },
                    { name: 'National', cost: 1000, time: '3-7 jours', color: 'purple' },
                    { name: 'International', cost: 5000, time: '7-21 jours', color: 'orange' },
                    { name: 'Express', cost: 2000, time: '1-3 jours', color: 'red' },
                    { name: 'Économique', cost: 300, time: '5-10 jours', color: 'gray' }
                  ].map((zone) => (
                    <div key={zone.name} className={`p-3 bg-${zone.color}-50 rounded-lg border border-${zone.color}-200`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium text-${zone.color}-800`}>{zone.name}</h4>
                        <Switch
                          defaultChecked={zone.name === 'Local'}
                          disabled={isVendorShippingReadOnly}
                        />
                      </div>
                      <div className="text-sm space-y-1">
                        <div className={`text-${zone.color}-700`}>
                          Coût: {zone.cost === 0 ? 'Gratuit' : formatPrice(zone.cost)}
                        </div>
                        <div className={`text-${zone.color}-600`}>
                          Délai: {zone.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Restrictions de livraison */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Restrictions de Livraison</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">Produits interdits</h4>
                    <div className="space-y-1 text-sm text-orange-700">
                      <div>• Produits inflammables</div>
                      <div>• Produits périssables</div>
                      <div>• Produits dangereux</div>
                      <div>• Produits illégaux</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">Limitations</h4>
                    <div className="space-y-1 text-sm text-orange-700">
                      <div>• Poids max: 30 kg</div>
                      <div>• Dimensions max: 150 cm</div>
                      <div>• Valeur max: 1 000 000 FCFA</div>
                      <div>• Zones limitées selon la classe</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet SEO */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-orange-600" />
                    Optimisation SEO
                    <Badge variant="secondary" className="ml-2">
                      Score: {seoScore}/100
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Optimisez votre produit pour les moteurs de recherche
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Génération Automatique SEO</span>
                    </div>
                    <Button onClick={generateAutoSEO} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Générer Auto
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">Titre SEO</Label>
                    <Input
                      id="seoTitle"
                      value={productData.seoTitle}
                      onChange={(e) => setProductData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="Titre optimisé pour le SEO"
                      maxLength={60}
                    />
                    <div className="text-xs text-gray-500">
                      {productData.seoTitle.length}/60 caractères
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">Description SEO</Label>
                    <Textarea
                      id="seoDescription"
                      value={productData.seoDescription}
                      onChange={(e) => setProductData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="Description optimisée pour le SEO"
                      rows={3}
                      maxLength={160}
                    />
                    <div className="text-xs text-gray-500">
                      {productData.seoDescription.length}/160 caractères
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoKeywords">Mots-clés SEO</Label>
                    <Input
                      id="seoKeywords"
                      value={productData.seoKeywords}
                      onChange={(e) => setProductData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                      placeholder="Mots-clés séparés par des virgules"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoSlug">Slug URL</Label>
                    <Input
                      id="seoSlug"
                      value={productData.seoSlug}
                      onChange={(e) => setProductData(prev => ({ ...prev, seoSlug: e.target.value }))}
                      placeholder="url-du-produit"
                    />
                  </div>

                  <Progress value={seoScore} className="w-full" />
                  
                  {/* Suggestions SEO */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Suggestions d'Amélioration SEO</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Ajoutez des mots-clés dans le titre</li>
                      <li>• Optimisez la description pour inclure des mots-clés</li>
                      <li>• Utilisez des balises H2 et H3 dans la description</li>
                      <li>• Ajoutez des images avec des alt-texts optimisés</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Avancé */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attributs du produit */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-indigo-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Attributs du Produit</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddAttribute}
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {productData.attributes.length > 0 && (
                    <div className="space-y-3">
                      {productData.attributes.map((attribute: any, index: number) => (
                        <div key={index} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-indigo-800">Attribut {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAttribute(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Input
                              placeholder="Nom de l'attribut"
                              value={attribute.name}
                              onChange={(e) => handleUpdateAttribute(index, 'name', e.target.value)}
                              className="border-indigo-300"
                            />
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={attribute.visible}
                                onCheckedChange={(checked) => handleUpdateAttribute(index, 'visible', checked)}
                              />
                              <Label className="text-sm">Visible sur la page produit</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={attribute.variation}
                                onCheckedChange={(checked) => handleUpdateAttribute(index, 'variation', checked)}
                              />
                              <Label className="text-sm">Utilisé pour les variations</Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Variations du produit */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Variations du Produit</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddVariation}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {productData.variations.length > 0 && (
                    <div className="space-y-3">
                      {productData.variations.map((variation: any, index: number) => (
                        <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-green-800">Variation {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveVariation(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm">Prix</Label>
                              <Input
                                type="number"
                                value={variation.price}
                                onChange={(e) => handleUpdateVariation(index, 'price', parseFloat(e.target.value) || 0)}
                                className="border-green-300 text-sm"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">Stock</Label>
                              <Input
                                type="number"
                                value={variation.stock}
                                onChange={(e) => handleUpdateVariation(index, 'stock', parseInt(e.target.value) || 0)}
                                className="border-green-300 text-sm"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">SKU</Label>
                              <Input
                                value={variation.sku}
                                onChange={(e) => handleUpdateVariation(index, 'sku', e.target.value)}
                                className="border-green-300 text-sm"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">Prix promo</Label>
                              <Input
                                type="number"
                                value={variation.salePrice}
                                onChange={(e) => handleUpdateVariation(index, 'salePrice', parseFloat(e.target.value) || 0)}
                                className="border-green-300 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Champs personnalisés */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Champs Personnalisés</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomField}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
                
                {Object.keys(productData.customFields).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(productData.customFields).map(([fieldName, fieldValue]) => (
                      <div key={fieldName} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <div className="font-medium text-orange-800">{fieldName}</div>
                          <div className="text-sm text-orange-600">{fieldValue as string}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCustomField(fieldName)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Onglet Produits Liés */}
            <TabsContent value="related" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Produits de vente croisée */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Produits de Vente Croisée</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddRelatedProduct('upsell')}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {productData.upsells.length > 0 && (
                    <div className="space-y-2">
                      {productData.upsells.map((product: any, index: number) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <div>
                            <div className="font-medium text-blue-800">{product.name}</div>
                            <div className="text-sm text-blue-600">{formatPrice(product.price)}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRelatedProduct('upsell', index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Produits complémentaires */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Produits Complémentaires</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddRelatedProduct('crossSell')}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {productData.crossSells.length > 0 && (
                    <div className="space-y-2">
                      {productData.crossSells.map((product: any, index: number) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <div>
                            <div className="font-medium text-green-800">{product.name}</div>
                            <div className="text-sm text-green-600">{formatPrice(product.price)}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRelatedProduct('crossSell', index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Produits groupés */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Produits Groupés</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddRelatedProduct('grouped')}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {productData.groupedProducts.length > 0 && (
                    <div className="space-y-2">
                      {productData.groupedProducts.map((product: any, index: number) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                          <div>
                            <div className="font-medium text-purple-800">{product.name}</div>
                            <div className="text-sm text-purple-600">{formatPrice(product.price)}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRelatedProduct('grouped', index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Produits similaires */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Produits Similaires</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddRelatedProduct('similar')}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {productData.similarProducts.length > 0 && (
                    <div className="space-y-2">
                      {productData.similarProducts.map((product: any, index: number) => (
                        <div key={product.id} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                          <div>
                            <div className="font-medium text-orange-800">{product.name}</div>
                            <div className="text-sm text-orange-600">{formatPrice(product.price)}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRelatedProduct('similar', index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Informations sur les produits liés */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Comment utiliser les produits liés ?</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• <strong>Vente croisée :</strong> Produits suggérés lors de l'achat</p>
                      <p>• <strong>Complémentaires :</strong> Produits qui vont bien ensemble</p>
                      <p>• <strong>Groupés :</strong> Produits vendus ensemble à prix réduit</p>
                      <p>• <strong>Similaires :</strong> Alternatives au produit actuel</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Social */}
            <TabsContent value="social" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Partage social */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Partage Social</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="socialSharing"
                        checked={productData.socialSharing}
                        onCheckedChange={(checked) => setProductData(prev => ({ ...prev, socialSharing: checked }))}
                      />
                      <Label htmlFor="socialSharing">Activer le partage social</Label>
                    </div>
                    
                    {productData.socialSharing && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-800 mb-2">Plateformes de partage :</div>
                        <div className="grid grid-cols-2 gap-2">
                          {['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'WhatsApp', 'Telegram'].map((platform) => (
                            <div key={platform} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`share-${platform.toLowerCase()}`}
                                defaultChecked
                                className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label htmlFor={`share-${platform.toLowerCase()}`} className="text-sm text-blue-700">
                                {platform}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Marketing et engagement */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Marketing et Engagement</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="socialPoints">Points sociaux</Label>
                      <Input
                        id="socialPoints"
                        type="number"
                        value={productData.socialPoints}
                        onChange={(e) => setProductData(prev => ({ ...prev, socialPoints: parseInt(e.target.value) || 0 }))}
                        className="border-green-300"
                        placeholder="50"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Points gagnés pour le partage sur les réseaux sociaux
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="referralBonus">Bonus de parrainage</Label>
                      <Input
                        id="referralBonus"
                        type="number"
                        value={productData.referralBonus}
                        onChange={(e) => setProductData(prev => ({ ...prev, referralBonus: parseFloat(e.target.value) || 0 }))}
                        className="border-green-300"
                        placeholder="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Bonus en FCFA pour chaque client parrainé
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Prévisualisation du partage social */}
              {productData.socialSharing && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Prévisualisation du Partage</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Facebook */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">f</span>
                        </div>
                        <div>
                          <div className="font-medium text-blue-800">Facebook</div>
                          <div className="text-xs text-blue-600">Il y a 2 heures</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        {productData.name || 'Nom du produit'}
                      </div>
                      {productData.mainImage && (
                        <img 
                          src={productData.mainImage} 
                          alt="Prévisualisation" 
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <div className="text-xs text-gray-500">
                        {productData.description ? productData.description.substring(0, 100) + '...' : 'Description du produit...'}
                      </div>
                    </div>
                    
                    {/* Twitter */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">🐦</span>
                        </div>
                        <div>
                          <div className="font-medium text-blue-800">Twitter</div>
                          <div className="text-xs text-blue-600">Il y a 2 heures</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        {productData.name || 'Nom du produit'} - {formatPrice(productData.price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {productData.description ? productData.description.substring(0, 100) + '...' : 'Description du produit...'}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>❤️ 0</span>
                        <span>🔄 0</span>
                        <span>💬 0</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Statistiques sociales */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Statistiques Sociales</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-xs text-green-700">Partages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-xs text-blue-700">Clics</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-xs text-purple-700">Conversions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-xs text-orange-700">Points gagnés</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet IA et SEO */}
            <TabsContent value="ai-seo" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section IA */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Intelligence Artificielle</h3>
                  </div>
                  <p className="text-sm text-gray-600">Optimisez automatiquement votre produit avec l'IA</p>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleAIOptimization}
                      disabled={isAIOptimizing}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                    >
                      {isAIOptimizing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Optimisation en cours...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Optimisation SEO IA
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleMarketAnalysis}
                      disabled={isAIOptimizing}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      {isAIOptimizing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analyse en cours...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Analyse de Marché IA
                        </>
                      )}
                    </Button>
                    
                    {aiSuggestions && (
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 mb-3">Suggestions IA :</h4>
                        <div className="space-y-2 text-sm text-yellow-700">
                          {aiSuggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span>{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Analyse Prédictive */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Analyse Prédictive IA</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="text-lg font-bold text-green-600">+23%</div>
                      <div className="text-xs text-green-700">Conversion estimée</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="text-lg font-bold text-blue-600">{formatPrice(89990)}</div>
                      <div className="text-xs text-blue-700">Prix optimal</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <div className="text-lg font-bold text-orange-600">15k</div>
                      <div className="text-xs text-orange-700">Visiteurs/mois</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Section SEO */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">SEO et Mots-clés</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="seoTitle">Titre SEO</Label>
                      <Input
                        id="seoTitle"
                        value={productData.seoTitle}
                        onChange={(e) => setProductData(prev => ({ ...prev, seoTitle: e.target.value }))}
                        placeholder="Titre optimisé pour le référencement"
                        className="border-green-300 focus:border-green-500"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {productData.seoTitle.length}/60 caractères
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="seoDescription">Description SEO</Label>
                      <Textarea
                        id="seoDescription"
                        value={productData.seoDescription}
                        onChange={(e) => setProductData(prev => ({ ...prev, seoDescription: e.target.value }))}
                        placeholder="Description optimisée pour le référencement"
                        className="border-green-300 focus:border-green-500"
                        rows={3}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {productData.seoDescription.length}/160 caractères
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="seoKeywords">Mots-clés SEO</Label>
                      <Input
                        id="seoKeywords"
                        value={productData.seoKeywords}
                        onChange={(e) => setProductData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                        placeholder="Mots-clés séparés par des virgules"
                        className="border-green-300 focus:border-green-500"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Mots-clés: {productData.seoKeywords.split(',').filter((k: string) => k.trim()).length}/10
                      </div>
                    </div>
                    
                    {/* Score SEO */}
                    <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-800">Score SEO</span>
                        <span className="text-lg font-bold text-green-600">{calculateSEOScore()}%</span>
                      </div>
                      <Progress value={calculateSEOScore()} className="h-3 bg-green-100" />
                      <div className="text-xs text-green-600 mt-1">
                        Score basé sur la complétude des informations SEO
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Prix et Paiements */}
            <TabsContent value="pricing" className="space-y-6">
              {/* En-tête spécial pour l'onglet Prix et Paiements */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Prix et Paiements</h2>
                    <p className="text-sm text-gray-600">Configurez les prix, marges et options de paiement de votre produit</p>
                  </div>
                </div>
              </div>
              
              {/* Bannière d'alerte pour attirer l'attention */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-300 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">
                    💡 <strong>Onglet Prix et Paiements</strong> - Configurez ici tous les aspects financiers de votre produit
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prix de base */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Prix de Base</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="price">Prix régulier *</Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          value={productData.price}
                          onChange={(e) => setProductData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                          className="border-orange-300 focus:border-orange-500 pr-16"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-orange-600">
                          FCFA
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Équivalent: {formatPoints(convertAmountToPoints(productData.price))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="salePrice">Prix de vente</Label>
                      <div className="relative">
                        <Input
                          id="salePrice"
                          type="number"
                          value={productData.salePrice}
                          onChange={(e) => setProductData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                          className="border-orange-300 focus:border-orange-500 pr-16"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-orange-600">
                          FCFA
                        </div>
                      </div>
                      {productData.salePrice > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Équivalent: {formatPoints(convertAmountToPoints(productData.salePrice))}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="costPrice">Prix de revient</Label>
                      <div className="relative">
                        <Input
                          id="costPrice"
                          type="number"
                          value={productData.costPrice}
                          onChange={(e) => setProductData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                          className="border-orange-300 focus:border-orange-500 pr-16"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-orange-600">
                          FCFA
                        </div>
                      </div>
                      {productData.costPrice > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Équivalent: {formatPoints(convertAmountToPoints(productData.costPrice))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Calcul de marge */}
                  {productData.costPrice > 0 && productData.price > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-sm font-medium text-orange-800 mb-2">Calcul de marge :</div>
                      <div className="space-y-1 text-sm text-orange-700">
                        <div>Marge brute: {formatPrice(productData.price - productData.costPrice)}</div>
                        <div>Marge en %: {(((productData.price - productData.costPrice) / productData.price) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Options de paiement */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Options de Paiement</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="installmentPayment"
                        checked={productData.installmentPayment}
                        onCheckedChange={(checked) => setProductData(prev => ({ ...prev, installmentPayment: checked }))}
                      />
                      <Label htmlFor="installmentPayment">Paiement en plusieurs fois</Label>
                    </div>
                    
                    {productData.installmentPayment && (
                      <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-orange-800">Options de paiement disponibles</Label>
                          <div className="flex flex-wrap gap-2">
                            {[1, 3, 6, 12].map((months) => (
                              <Button
                                key={months}
                                variant={productData.installmentOptions.includes(months) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const newOptions = productData.installmentOptions.includes(months)
                                    ? productData.installmentOptions.filter((m: number) => m !== months)
                                    : [...productData.installmentOptions, months]
                                  setProductData(prev => ({ ...prev, installmentOptions: newOptions }))
                                }}
                                className={productData.installmentOptions.includes(months) 
                                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white" 
                                  : "border-orange-300 text-orange-700 hover:bg-orange-50"
                                }
                              >
                                {months === 1 ? '1 mois' : months === 12 ? '1 an' : `${months} mois`}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {productData.price > 0 && (
                          <div className="space-y-3 p-3 bg-white rounded-lg border border-orange-200">
                            <div className="text-sm font-medium text-orange-800 mb-2">Simulation des paiements :</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {productData.installmentOptions.map((months) => (
                                <div key={months} className="text-center p-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded border border-orange-200">
                                  <div className="text-xs font-medium text-orange-700">
                                    {months === 1 ? '1 mois' : months === 12 ? '1 an' : `${months} mois`}
                                  </div>
                                  <div className="text-lg font-bold text-orange-800">
                                    {formatInstallmentPayment(productData.price, months)}
                                  </div>
                                  <div className="text-xs text-orange-600">
                                    {formatPoints(convertAmountToPoints(calculateInstallmentPayment(productData.price, months)))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="deferredPayment"
                        checked={productData.deferredPaymentFees.enabled}
                        onCheckedChange={(checked) => setProductData(prev => ({ 
                          ...prev, 
                          deferredPaymentFees: { ...prev.deferredPaymentFees, enabled: checked }
                        }))}
                      />
                      <Label htmlFor="deferredPayment">Paiement différé avec frais</Label>
                    </div>
                    
                    {productData.deferredPaymentFees.enabled && (
                      <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium text-orange-800">Type de frais</Label>
                            <Select 
                              value={productData.deferredPaymentFees.type} 
                              onValueChange={(value: 'percentage' | 'fixed') => setProductData(prev => ({
                                ...prev,
                                deferredPaymentFees: { ...prev.deferredPaymentFees, type: value }
                              }))}
                            >
                              <SelectTrigger className="border-orange-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-orange-800">
                              {productData.deferredPaymentFees.type === 'percentage' ? 'Pourcentage (%)' : 'Montant fixe (FCFA)'}
                            </Label>
                            <Input
                              type="number"
                              value={productData.deferredPaymentFees.value}
                              onChange={(e) => setProductData(prev => ({
                                ...prev,
                                deferredPaymentFees: { ...prev.deferredPaymentFees, value: parseFloat(e.target.value) || 0 }
                              }))}
                              className="border-orange-300"
                              placeholder={productData.deferredPaymentFees.type === 'percentage' ? '10' : '100'}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium text-orange-800">Période de calcul</Label>
                            <Select 
                              value={productData.deferredPaymentFees.period} 
                              onValueChange={(value: 'day' | 'month' | 'quarter') => setProductData(prev => ({
                                ...prev,
                                deferredPaymentFees: { ...prev.deferredPaymentFees, period: value }
                              }))}
                            >
                              <SelectTrigger className="border-orange-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="day">Par jour</SelectItem>
                                <SelectItem value="month">Par mois</SelectItem>
                                <SelectItem value="quarter">Par trimestre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-orange-800">Méthode de calcul</Label>
                            <Select 
                              value={productData.deferredPaymentFees.calculationMethod} 
                              onValueChange={(value: 'simple' | 'compound') => setProductData(prev => ({
                                ...prev,
                                deferredPaymentFees: { ...prev.deferredPaymentFees, calculationMethod: value }
                              }))}
                            >
                              <SelectTrigger className="border-orange-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="simple">Intérêts simples</SelectItem>
                                <SelectItem value="compound">Intérêts composés</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm font-medium text-orange-800">Périodes maximum</Label>
                            <Input
                              type="number"
                              value={productData.deferredPaymentFees.maxPeriods}
                              onChange={(e) => setProductData(prev => ({
                                ...prev,
                                deferredPaymentFees: { ...prev.deferredPaymentFees, maxPeriods: parseInt(e.target.value) || 1 }
                              }))}
                              className="border-orange-300"
                              placeholder="12"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-orange-800">Montant minimum (FCFA)</Label>
                            <Input
                              type="number"
                              value={productData.deferredPaymentFees.minAmount}
                              onChange={(e) => setProductData(prev => ({
                                ...prev,
                                deferredPaymentFees: { ...prev.deferredPaymentFees, minAmount: parseFloat(e.target.value) || 0 }
                              }))}
                              className="border-orange-300"
                              placeholder="1000"
                            />
                          </div>
                        </div>
                        
                        {/* Simulation du paiement différé */}
                        {productData.price > 0 && productData.deferredPaymentFees.value > 0 && (
                          <div className="p-3 bg-white rounded-lg border border-orange-200">
                            <div className="text-sm font-medium text-orange-800 mb-2">Simulation du paiement différé :</div>
                            <div className="space-y-2">
                              {[1, 3, 6, 12].map((periods) => {
                                const totalFees = calculateDeferredPaymentFees(
                                  productData.price,
                                  productData.deferredPaymentFees.value,
                                  productData.deferredPaymentFees.type,
                                  productData.deferredPaymentFees.period,
                                  periods,
                                  productData.deferredPaymentFees.calculationMethod
                                )
                                const totalAmount = productData.price + totalFees
                                
                                return (
                                  <div key={periods} className="flex justify-between items-center p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded border border-orange-200">
                                    <span className="text-sm text-orange-700">
                                      {periods} {productData.deferredPaymentFees.period === 'day' ? 'jour(s)' : 
                                               productData.deferredPaymentFees.period === 'month' ? 'mois' : 'trimestre(s)'}
                                    </span>
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-orange-800">
                                        {formatPrice(totalAmount)}
                                      </div>
                                      <div className="text-xs text-orange-600">
                                        Frais: {formatPrice(totalFees)} • {formatPoints(convertAmountToPoints(totalAmount))}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Résumé des prix avec les couleurs du site */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Résumé des Prix</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded border border-gray-200">
                    <div className="text-lg font-bold text-orange-600">{formatPrice(productData.price)}</div>
                    <div className="text-xs text-gray-600">Prix régulier</div>
                    <div className="text-xs text-orange-500">{formatPoints(convertAmountToPoints(productData.price))}</div>
                  </div>
                  {productData.salePrice > 0 && (
                    <div className="text-center p-3 bg-white rounded border border-gray-200">
                      <div className="text-lg font-bold text-red-600">{formatPrice(productData.salePrice)}</div>
                      <div className="text-xs text-gray-600">Prix de vente</div>
                      <div className="text-xs text-red-500">{formatPoints(convertAmountToPoints(productData.salePrice))}</div>
                    </div>
                  )}
                  {productData.costPrice > 0 && (
                    <div className="text-center p-3 bg-white rounded border border-gray-200">
                      <div className="text-lg font-bold text-gray-600">{formatPrice(productData.costPrice)}</div>
                      <div className="text-xs text-gray-600">Prix de revient</div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Barre d'actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Brouillon
            </Button>
            <Button 
              onClick={handleSaveWithValidation} 
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Créer le Produit' : 'Mettre à Jour'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Système de notifications modernes */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out
              ${notification.type === 'success' ? 'border-l-green-500' : ''}
              ${notification.type === 'error' ? 'border-l-red-500' : ''}
              ${notification.type === 'warning' ? 'border-l-yellow-500' : ''}
              ${notification.type === 'info' ? 'border-l-blue-500' : ''}
              animate-in slide-in-from-right-full
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {notification.type === 'error' && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                {notification.type === 'warning' && (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                {notification.type === 'info' && (
                  <Info className="h-5 w-5 text-blue-500" />
                )}
              </div>
              
              <div className="ml-3 flex-1">
                <h4 className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : ''
                } ${
                  notification.type === 'error' ? 'text-red-800' : ''
                } ${
                  notification.type === 'warning' ? 'text-yellow-800' : ''
                } ${
                  notification.type === 'info' ? 'text-blue-800' : ''
                }`}>
                  {notification.title}
                </h4>
                <p className={`mt-1 text-sm ${
                  notification.type === 'success' ? 'text-green-700' : ''
                } ${
                  notification.type === 'error' ? 'text-red-700' : ''
                } ${
                  notification.type === 'warning' ? 'text-yellow-700' : ''
                } ${
                  notification.type === 'info' ? 'text-blue-700' : ''
                }`}>
                  {notification.message}
                </p>
                
                {notification.action && (
                  <div className="mt-3">
                    <button
                      onClick={notification.action.onClick}
                      className={`text-sm font-medium underline ${
                        notification.type === 'success' ? 'text-green-600 hover:text-green-500' : ''
                      } ${
                        notification.type === 'error' ? 'text-red-600 hover:text-red-500' : ''
                      } ${
                        notification.type === 'warning' ? 'text-yellow-600 hover:text-yellow-500' : ''
                      } ${
                        notification.type === 'info' ? 'text-blue-600 hover:text-blue-500' : ''
                      }`}
                    >
                      {notification.action.label}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success' ? 'text-green-400 hover:bg-green-100 focus:ring-green-500' : ''
                  } ${
                    notification.type === 'error' ? 'text-red-400 hover:bg-red-100 focus:ring-red-500' : ''
                  } ${
                    notification.type === 'warning' ? 'text-yellow-400 hover:bg-yellow-100 focus:ring-yellow-500' : ''
                  } ${
                    notification.type === 'info' ? 'text-blue-400 hover:bg-blue-100 focus:ring-blue-500' : ''
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Barre de progression */}
            <div className="mt-3">
              <div className={`h-1 rounded-full ${
                notification.type === 'success' ? 'bg-green-200' : ''
              } ${
                notification.type === 'error' ? 'bg-red-200' : ''
              } ${
                notification.type === 'warning' ? 'bg-yellow-200' : ''
              } ${
                notification.type === 'info' ? 'bg-blue-200' : ''
              }`}>
                <div
                  className={`h-1 rounded-full transition-all duration-300 ease-linear ${
                    notification.type === 'success' ? 'bg-green-500' : ''
                  } ${
                    notification.type === 'error' ? 'bg-red-500' : ''
                  } ${
                    notification.type === 'warning' ? 'bg-yellow-500' : ''
                  } ${
                    notification.type === 'info' ? 'bg-blue-500' : ''
                  }`}
                  style={{
                    width: '100%',
                    animation: `shrink ${notification.duration || 5000}ms linear forwards`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        .animate-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </Dialog>
  )
}

export default AdvancedProductModal
