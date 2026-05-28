"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Star,
  Share2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Tag,
  Copy,
  EyeOff,
  Save,
  FolderTree,
  FolderPlus,
  RefreshCw,
  Sparkles,
  Layers,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useMoney } from "@/lib/hooks/use-money"
import { CategoryTreeNodeCard } from '@/components/super-admin/category-tree-node-card'
import { CategoryForm } from '@/components/super-admin/category-form'
import {
  SuperAdminDashboardService,
  type ProductQueryOptions,
  type SuperAdminProduct,
  type SuperAdminProductStatus
} from '@/lib/services/super-admin-dashboard-service'
import { SuperAdminDashboardApi } from '@/lib/services/super-admin-dashboard-service.api'
import { mapSharedProductInputToCreateInput, mapSharedProductInputToUpdateInput } from '@/app/api/super-admin/_helpers/products'
import type { SharedProduct, SharedProductInput, SharedProductMedia } from '@/lib/types/shared-product'
import { SuperAdminCategoryService } from '@/lib/services/super-admin-category-service'
import type { ProductCategoryRecord, ProductCategoryTreeNode } from '@/lib/types/product-category'

// Import du modal de création de produit existant
import AdvancedProductModal from '@/components/seller-dashboard/advanced-product-modal'
import { ProductCategoryProvider } from '@/contexts/product-category-context'

type ProductStatus = 'active' | 'inactive' | 'draft' | 'pending' | 'reported'

interface Product {
  id: string
  name: string
  description: string
  price: number
  salePrice: number | null
  costPrice: number | null
  category: string
  subcategory: string
  brand: string
  vendorId: string | null
  vendorName: string
  source: 'super_admin' | 'admin' | 'vendor'
  status: ProductStatus
  stock: number
  stockAlert: number
  rating: number
  totalSales: number
  totalRevenue: number
  featured: boolean
  images: string[]
  mainImage: string | null
  galleryImages: string[]
  media: SharedProductMedia[]
  tags: string[]
  sku: string
  createdAt: string
  updatedAt: string
  seoScore: number
  socialShares: number
}

interface VendorOption {
  id: string
  name: string
}

type TabValue =
  | 'all'
  | 'categories'
  | 'active'
  | 'pending'
  | 'reported'
  | 'featured'
  | 'low-stock'
  | 'draft'
  | 'vendor-products'

type ProductManagementProps = {
  prefetchedProducts?: { items: SuperAdminProduct[]; count: number }
}

export default function ProductManagement({ prefetchedProducts }: ProductManagementProps) {
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const { formatMoney } = useMoney()

  const [products, setProducts] = useState<Product[]>([])
  const productsRef = useRef<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSharedProduct, setSelectedSharedProduct] = useState<SharedProduct | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState<'all' | string>('all')
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([])
  const [activeTab, setActiveTab] = useState<TabValue>('all')

  const hasSeededPrefetchRef = useRef(false)
  const mapProductRef = useRef<(serviceProduct: SuperAdminProduct) => Product>(() => {
    throw new Error('mapProductRef not initialized')
  })
  const loadProductsRef = useRef<(options?: { showSpinner?: boolean }) => Promise<void>>(async () => {})

  useEffect(() => {
    productsRef.current = products
  }, [products])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
  }>>([])

  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [categories, setCategories] = useState<ProductCategoryRecord[]>([])
  const [categoryTree, setCategoryTree] = useState<ProductCategoryTreeNode[]>([])
  const [isCategoryLoading, setIsCategoryLoading] = useState(false)
  const [categoryFormMode, setCategoryFormMode] = useState<'create' | 'edit'>('create')
  const [categoryFormInitial, setCategoryFormInitial] = useState<ProductCategoryRecord | null>(null)
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [categoryFormData, setCategoryFormData] = useState<{
    name: string
    slug: string
    description: string
    parentId: string | null
    icon: string
    isActive: boolean
    colorTheme: string
    displayMode: 'grid' | 'list' | 'carousel' | 'hero'
    seoTitle: string
    seoDescription: string
    seoKeywords: string
    imageUrl: string
  }>({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    icon: '',
    isActive: true,
    colorTheme: '#0ea5e9',
    displayMode: 'grid',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    imageUrl: ''
  })

  const createLocalId = () => Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`)

  const addNotification = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 4000) => {
      const uniqueId = createLocalId()
      setNotifications((prev) => [...prev, { id: uniqueId.toString(), type, title, message, duration }])

      if (duration) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((notification) => notification.id !== uniqueId.toString()))
        }, duration)
      }
    },
    []
  )

  const [isLoading, setIsLoading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const statusTabs: Record<TabValue, SuperAdminProductStatus | undefined> = {
    all: undefined,
    active: 'active',
    pending: 'pending_review',
    reported: 'archived',
    featured: undefined,
    'low-stock': undefined,
    draft: 'draft',
    'vendor-products': undefined
  }

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>()
    products.forEach((product) => {
      if (product.category) {
        categories.add(product.category)
      }
    })
    return Array.from(categories).sort((a, b) => a.localeCompare(b))
  }, [products])

  const vendorNameById = useMemo(() => {
    const map = new Map<string, string>()
    ;(vendorOptions ?? []).forEach((v) => {
      const id = String(v?.id ?? '').trim()
      if (!id) return
      map.set(id, String(v?.name ?? '').trim())
    })
    return map
  }, [vendorOptions])

  const vendorSelectOptions = useMemo(() => {
    if (vendorOptions.length > 0) {
      return vendorOptions
    }

    const fallback = new Map<string, VendorOption>()
    products.forEach((product) => {
      const key = product.vendorId ?? product.vendorName
      if (!fallback.has(key)) {
        fallback.set(key, {
          id: product.vendorId ?? key,
          name: product.vendorName
        })
      }
    })

    return Array.from(fallback.values())
  }, [products, vendorOptions])

  /**
   * Convertit un statut affiché côté UI vers le statut attendu par les services.
   */
  function mapServiceStatus(status: ProductStatus): SuperAdminProductStatus {
    switch (status) {
      case 'active':
        return 'active'
      case 'inactive':
        return 'inactive'
      case 'draft':
        return 'draft'
      case 'pending':
        return 'pending_review'
      case 'reported':
        return 'archived'
      default:
        return 'active'
    }
  }

  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (categoryFilter !== 'all') {
      list = list.filter((product) => product.category === categoryFilter)
    }

    const isVendorTab = activeTab === 'vendor-products'

    if (isVendorTab) {
      list = list.filter((product) => product.source === 'vendor')
    }

    if (statusFilter !== 'all') {
      list = list.filter((product) => product.status === statusFilter)
    } else if (!isVendorTab && activeTab === 'featured') {
      list = list.filter((product) => product.featured)
    } else if (!isVendorTab && activeTab === 'low-stock') {
      list = list.filter((product) => product.stock <= product.stockAlert)
    } else if (!isVendorTab && activeTab !== 'all') {
      const status = statusTabs[activeTab as keyof typeof statusTabs]
      if (status) {
        list = list.filter((product) => mapServiceStatus(product.status) === status)
      }
    }

    if (vendorFilter !== 'all') {
      list = list.filter(
        (product) =>
          product.vendorId === vendorFilter || (!product.vendorId && product.vendorName === vendorFilter)
      )
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      list = list.filter((product) =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.vendorName.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      )
    }

    return list
  }, [products, categoryFilter, statusFilter, activeTab, statusTabs, vendorFilter, searchTerm])

  /**
   * Formate le formulaire selon un enregistrement existant.
   */
  const syncFormWithCategory = useCallback((record: ProductCategoryRecord | null) => {
    if (!record) {
      setCategoryFormData({
        name: '',
        slug: '',
        description: '',
        parentId: null,
        icon: '',
        isActive: true,
        colorTheme: '#0ea5e9',
        displayMode: 'grid',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        imageUrl: ''
      })
      return
    }

    const metadata = record.metadata ?? {}
    setCategoryFormData({
      name: record.name,
      slug: record.slug ?? '',
      description: (metadata.description as string | undefined) ?? '',
      parentId: record.parent_id,
      icon: (metadata.icon as string | undefined) ?? record.icon ?? '',
      isActive: record.is_active,
      colorTheme: (metadata.colorTheme as string | undefined) ?? '#0ea5e9',
      displayMode: (metadata.displayMode as 'grid' | 'list' | 'carousel' | 'hero' | undefined) ?? 'grid',
      seoTitle: (metadata.seoTitle as string | undefined) ?? '',
      seoDescription: (metadata.seoDescription as string | undefined) ?? '',
      seoKeywords: Array.isArray(metadata.seoKeywords) ? metadata.seoKeywords.join(', ') : '',
      imageUrl: (metadata.imageUrl as string | undefined) ?? ''
    })
  }, [])

  /**
   * Rafraîchit l'arbre des catégories depuis Supabase.
   */
  const loadCategories = useCallback(
    async (includeInactive = true) => {
      setIsCategoryLoading(true)
      try {
        const { items, insights } = await SuperAdminCategoryService.fetchCategories({
          includeInactive,
          withStats: true
        })
        setCategories(items)
        setCategoryTree(SuperAdminCategoryService.buildTree(items, insights))
      } catch (error) {
        console.error('❌ Chargement des catégories impossible:', error)
        toast({
          title: 'Chargement catégories impossible',
          description: 'Les catégories n’ont pas pu être chargées.',
          variant: 'destructive'
        })
      } finally {
        setIsCategoryLoading(false)
      }
    },
    [toast]
  )

  /**
   * Ouvre le formulaire de catégorie (création ou édition).
   */
  const openCategoryForm = useCallback((mode: 'create' | 'edit', category?: ProductCategoryRecord) => {
    setCategoryFormMode(mode)
    setCategoryFormInitial(category ?? null)
    syncFormWithCategory(category ?? null)
    setCategoryFormOpen(true)
  }, [syncFormWithCategory])

  /**
   * Construit la payload de mutation pour Supabase.
   */
  const buildCategoryPayload = useCallback(() => {
    const keywords = categoryFormData.seoKeywords
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    return {
      name: categoryFormData.name,
      slug: categoryFormData.slug || undefined,
      description: categoryFormData.description || undefined,
      parentId: categoryFormData.parentId ?? undefined,
      icon: categoryFormData.icon || undefined,
      isActive: categoryFormData.isActive,
      metadata: {
        colorTheme: categoryFormData.colorTheme,
        displayMode: categoryFormData.displayMode,
        seoTitle: categoryFormData.seoTitle,
        seoDescription: categoryFormData.seoDescription,
        seoKeywords: keywords,
        imageUrl: categoryFormData.imageUrl,
        description: categoryFormData.description
      }
    }
  }, [categoryFormData])

  /**
   * Sauvegarde la catégorie en cours d’édition/création.
   */
  const handleSaveCategory = useCallback(async () => {
    try {
      const payload = buildCategoryPayload()

      if (categoryFormMode === 'create') {
        const created = await SuperAdminCategoryService.createCategory(payload)
        toast({ title: 'Catégorie créée', description: 'La catégorie a été ajoutée avec succès.' })
        addNotification(
          'success',
          'Nouvelle catégorie disponible',
          `« ${created.name} » rejoint immédiatement le catalogue.`
        )
      } else if (categoryFormInitial) {
        const updated = await SuperAdminCategoryService.updateCategory({ id: categoryFormInitial.id, ...payload })
        toast({ title: 'Catégorie mise à jour', description: 'Les modifications ont été sauvegardées.' })
        addNotification(
          'success',
          'Catégorie actualisée',
          `Les informations de « ${updated.name} » sont à jour pour vos vendeurs.`
        )
      }

      setCategoryFormOpen(false)
      setCategoryDrawerOpen(false)
      setCategoryFormInitial(null)
      syncFormWithCategory(null)
      void loadCategories()
    } catch (error) {
      console.error('❌ Sauvegarde catégorie impossible:', error)
      toast({
        title: 'Sauvegarde impossible',
        description: 'Impossible de sauvegarder la catégorie pour le moment.',
        variant: 'destructive'
      })
      addNotification(
        'error',
        'Échec de la sauvegarde',
        'La mise à jour de la catégorie a échoué. Réessayez ou vérifiez les champs requis.'
      )
    }
  }, [
    addNotification,
    buildCategoryPayload,
    categoryFormInitial,
    categoryFormMode,
    loadCategories,
    syncFormWithCategory,
    toast
  ])

  const handleToggleCategory = useCallback(
    async (categoryId: string, isActive: boolean) => {
      try {
        await SuperAdminCategoryService.toggleCategory(categoryId, isActive)
        const target = categories.find((category) => category.id === categoryId)
        toast({
          title: isActive ? 'Catégorie activée' : 'Catégorie masquée',
          description: isActive ? 'La catégorie est désormais visible.' : 'La catégorie est masquée du catalogue.'
        })
        addNotification(
          'success',
          isActive ? 'Visibilité restaurée' : 'Catégorie masquée',
          target
            ? `« ${target.name} » est ${isActive ? 'de nouveau accessible' : 'désormais invisibilisée'} côté marketplace.`
            : 'La visibilité de la catégorie a été mise à jour.'
        )
        void loadCategories()
      } catch (error) {
        console.error('❌ Impossible de changer le statut catégorie:', error)
        toast({
          title: 'Changement de statut impossible',
          description: 'Aucun changement n’a pu être appliqué.',
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Statut non modifié',
          'Impossible de mettre à jour la visibilité de cette catégorie pour le moment.'
        )
      }
    },
    [addNotification, categories, loadCategories, toast]
  )

  const handleDuplicateCategory = useCallback(
    async (category: ProductCategoryRecord) => {
      try {
        await SuperAdminCategoryService.duplicateCategory(category.id)
        toast({
          title: 'Catégorie dupliquée',
          description: `${category.name} a été dupliquée en brouillon.`
        })
        addNotification(
          'success',
          'Duplication effectuée',
          `Une copie de « ${category.name} » est prête à être personnalisée.`
        )
        void loadCategories()
      } catch (error) {
        console.error('❌ Duplication catégorie impossible:', error)
        toast({
          title: 'Duplication impossible',
          description: 'La catégorie n’a pas pu être dupliquée.',
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Duplication impossible',
          'La copie de la catégorie n’a pas pu être générée. Réessayez ultérieurement.'
        )
      }
    },
    [addNotification, loadCategories, toast]
  )

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        await SuperAdminCategoryService.deleteCategory(categoryId)
        const deleted = categories.find((category) => category.id === categoryId)
        toast({ title: 'Catégorie archivée', description: 'La catégorie a été désactivée.' })
        addNotification(
          'warning',
          'Catégorie archivée',
          deleted
            ? `« ${deleted.name} » est désormais retirée du catalogue public.`
            : 'La catégorie sélectionnée a été archivée.'
        )
        void loadCategories()
      } catch (error) {
        console.error('❌ Suppression catégorie impossible:', error)
        toast({
          title: 'Suppression impossible',
          description: 'La catégorie n’a pas pu être désactivée.',
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Archivage impossible',
          'La catégorie n’a pas pu être archivée. Vérifiez ses dépendances produits.'
        )
      }
    },
    [addNotification, categories, loadCategories, toast]
  )

  /**
   * Calcule le nombre de produits correspondant à un onglet donné, en se basant sur les filtres actuels.
   */
  const getTabCount = useCallback(
    (tab: TabValue): number => {
      if (tab === 'categories') {
        return categoryTree.length
      }

      return filteredProducts.filter((product) => {
        switch (tab) {
          case 'all':
            return true
          case 'active':
            return product.status === 'active'
          case 'pending':
            return product.status === 'pending'
          case 'reported':
            return product.status === 'reported'
          case 'featured':
            return product.featured
          case 'low-stock':
            return product.stock <= product.stockAlert
          case 'draft':
            return product.status === 'draft'
          case 'vendor-products':
            return product.source === 'vendor'
          default:
            return false
        }
      }).length
    },
    [categoryTree.length, filteredProducts]
  )

  const mapStatus = (status: SuperAdminProductStatus): ProductStatus => {
    switch (status) {
      case 'active':
        return 'active'
      case 'inactive':
        return 'inactive'
      case 'draft':
        return 'draft'
      case 'pending_review':
        return 'pending'
      case 'archived':
      case 'rejected':
        return 'reported'
      default:
        return 'pending'
    }
  }

  const mergeSharedProductIntoProduct = useCallback((shared: SharedProduct, fallback: Product): Product => {
    const mediaItems = Array.isArray(shared.media) ? shared.media.filter((item): item is SharedProductMedia => Boolean(item?.path)) : []
    const primary = mediaItems.find((item) => item.isPrimary) ?? mediaItems[0] ?? null
    const gallery = mediaItems.filter((item) => item !== primary).map((item) => item.path)

    return {
      ...fallback,
      name: shared.name ?? fallback.name,
      description: shared.description ?? fallback.description,
      price: shared.price ?? fallback.price,
      salePrice: shared.salePrice ?? fallback.salePrice,
      costPrice: shared.costPrice ?? fallback.costPrice,
      category: shared.category ?? fallback.category,
      subcategory: shared.subcategory ?? fallback.subcategory,
      brand: shared.brand ?? fallback.brand,
      vendorId: shared.vendorId ?? fallback.vendorId ?? null,
      source: shared.source ?? fallback.source,
      status: mapServiceStatus((shared.productStatus as ProductStatus | undefined) ?? fallback.status),
      stock: shared.stockQuantity ?? fallback.stock,
      stockAlert: shared.lowStockThreshold ?? fallback.stockAlert,
      featured: shared.isFeatured ?? fallback.featured,
      images: mediaItems.length > 0 ? mediaItems.map((item) => item.path) : shared.galleryImages ?? fallback.images,
      mainImage: primary?.path ?? shared.mainImage ?? fallback.mainImage,
      galleryImages: gallery.length > 0 ? gallery : shared.galleryImages ?? fallback.galleryImages,
      media: mediaItems.length > 0 ? mediaItems : shared.media ?? fallback.media,
      tags: shared.tags ?? fallback.tags,
      sku: shared.sku ?? fallback.sku
    }
  }, [])

  const mapProduct = useCallback((serviceProduct: SuperAdminProduct): Product => {
    const primaryCategory = serviceProduct.categories.find((c) => c.isPrimary)?.category?.name ?? 'Catégorie'
    const secondaryCategory = serviceProduct.categories.find((c) => !c.isPrimary)?.category?.name ?? 'Sous-catégorie'

    const vendorId = String(serviceProduct.vendorId ?? '').trim()
    const resolvedVendorName = vendorId ? vendorNameById.get(vendorId) : undefined

    const vendorLabel =
      serviceProduct.source === 'vendor'
        ? resolvedVendorName ?? serviceProduct.metadata?.vendorName ?? (vendorId ? vendorId : 'Vendeur inconnu')
        : serviceProduct.source === 'admin'
          ? 'Admin'
          : 'Super Admin'

    const sortedMedia = [...(serviceProduct.media ?? [])].sort((a, b) => {
      const positionA = typeof a.position === 'number' ? a.position : 0
      const positionB = typeof b.position === 'number' ? b.position : 0
      return positionA - positionB
    })

    const primaryMedia = sortedMedia.find((media) => media.isPrimary) ?? sortedMedia[0] ?? null
    const galleryImages = sortedMedia
      .filter((media) => media !== primaryMedia)
      .map((media) => media.path)

    const sharedMedia: SharedProductMedia[] = sortedMedia.map((media) => ({
      id: media.id,
      path: media.path,
      type: (media.type ?? 'image') as SharedProductMedia['type'],
      altText: media.alt ?? null,
      metadata: media.metadata ?? undefined,
      isPrimary: media.isPrimary
    }))

    const baseProduct: Product = {
      id: serviceProduct.id,
      name: serviceProduct.name,
      description: serviceProduct.description ?? 'Aucune description',
      price: serviceProduct.price,
      salePrice: serviceProduct.salePrice,
      costPrice: serviceProduct.costPrice,
      category: primaryCategory,
      subcategory: secondaryCategory,
      brand: serviceProduct.metadata?.brand ?? 'Marque inconnue',
      vendorId: serviceProduct.vendorId,
      vendorName: vendorLabel,
      source: serviceProduct.source,
      status: mapStatus(serviceProduct.productStatus),
      stock: serviceProduct.stockQuantity,
      stockAlert: serviceProduct.lowStockThreshold,
      rating: Math.round((serviceProduct.statistics?.averageRating ?? 0) * 10) / 10,
      totalSales: serviceProduct.statistics?.totalSales ?? 0,
      totalRevenue: serviceProduct.statistics?.totalRevenue ?? 0,
      featured: serviceProduct.isFeatured,
      images: sortedMedia.map((media) => media.path),
      mainImage: primaryMedia?.path ?? serviceProduct.mainImage ?? null,
      galleryImages,
      media: sharedMedia,
      tags: serviceProduct.tags ?? [],
      sku: serviceProduct.sku ?? 'N/A',
      createdAt: new Date(serviceProduct.createdAt).toLocaleDateString('fr-FR'),
      updatedAt: new Date(serviceProduct.updatedAt).toLocaleDateString('fr-FR'),
      seoScore: serviceProduct.metadata?.seoScore ?? 0,
      socialShares: serviceProduct.statistics?.shareCount ?? 0
    }

    return mergeSharedProductIntoProduct(
      {
        id: serviceProduct.id,
        name: serviceProduct.name,
        description: serviceProduct.description,
        price: serviceProduct.price,
        salePrice: serviceProduct.salePrice,
        costPrice: serviceProduct.costPrice,
        mainImage: serviceProduct.mainImage,
        galleryImages: serviceProduct.images,
        media: serviceProduct.media,
        category: primaryCategory,
        subcategory: secondaryCategory,
        vendorId: vendorId.length > 0 ? vendorId : undefined,
        source: serviceProduct.source,
        productStatus: serviceProduct.productStatus,
        stockQuantity: serviceProduct.stockQuantity,
        lowStockThreshold: serviceProduct.lowStockThreshold,
        isFeatured: serviceProduct.isFeatured,
        tags: serviceProduct.tags,
        sku: serviceProduct.sku,
        brand: serviceProduct.metadata?.brand,
        metadata: serviceProduct.metadata,
        galleryImages: serviceProduct.images,
        images: serviceProduct.images
      } as SharedProduct,
      baseProduct
    )
  }, [mergeSharedProductIntoProduct, vendorNameById])

  const loadVendors = useCallback(async () => {
    try {
      const vendorUsers = await SuperAdminDashboardService.getUsers({ role: 'vendor', limit: 200 })
      const vendors: VendorOption[] = vendorUsers.map((user) => ({
        id: user.id,
        name: user.name || user.email || 'Vendeur inconnu'
      }))
      setVendorOptions(vendors)
    } catch (error) {
      console.error('❌ Impossible de charger la liste des vendeurs:', error)
    }
  }, [])

  const buildQueryOptions = useCallback((): ProductQueryOptions => {
    const options: ProductQueryOptions = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize
    }

    if (searchTerm.trim()) {
      options.search = searchTerm.trim()
    }

    const tabStatus = statusTabs[activeTab]
    if (tabStatus) {
      options.status = tabStatus
    } else if (statusFilter !== 'all') {
      options.status = mapServiceStatus(statusFilter)
    }

    if (vendorFilter !== 'all' && vendorOptions.length > 0) {
      options.vendorId = vendorFilter
    }

    if (activeTab === 'featured') {
      options.featured = true
    }

    return options
  }, [activeTab, currentPage, pageSize, searchTerm, statusFilter, vendorFilter, statusTabs, vendorOptions])

  const loadProducts = useCallback(async (options?: { showSpinner?: boolean }) => {
    const showSpinner = options?.showSpinner ?? true
    if (showSpinner) {
      setIsLoading(true)
    }
    try {
      const options = buildQueryOptions()
      const { items, count } = await SuperAdminDashboardService.getProducts(options)
      setProducts(items.map(mapProduct))
      setTotalItems(count)
    } catch (error) {
      console.error('❌ Impossible de charger les produits:', error)
      toast({
        title: 'Chargement impossible',
        description: 'Les produits n’ont pas pu être chargés. Réessayez plus tard.',
        variant: 'destructive'
      })
      if (!productsRef.current || productsRef.current.length === 0) {
        setProducts([])
        setTotalItems(0)
      }
    } finally {
      if (showSpinner) {
        setIsLoading(false)
      }
    }
  }, [buildQueryOptions, mapProduct, toast])

  useEffect(() => {
    mapProductRef.current = mapProduct
  }, [mapProduct])

  useEffect(() => {
    loadProductsRef.current = loadProducts
  }, [loadProducts])

  useEffect(() => {
    const seeded = Boolean(prefetchedProducts && Array.isArray(prefetchedProducts.items))

    if (seeded && !hasSeededPrefetchRef.current) {
      hasSeededPrefetchRef.current = true
      setProducts(prefetchedProducts!.items.map(mapProductRef.current))
      setTotalItems(
        typeof prefetchedProducts!.count === 'number'
          ? prefetchedProducts!.count
          : prefetchedProducts!.items.length
      )

      // Refresh silencieux (sans spinner) pour synchroniser avec la DB.
      setTimeout(() => {
        void loadProductsRef.current({ showSpinner: false })
      }, 0)
      return
    }

    if (!seeded) {
      void loadProductsRef.current({ showSpinner: true })
    }
  }, [prefetchedProducts])

  useEffect(() => {
    void loadVendors()
  }, [loadVendors])

  useEffect(() => {
    if (!vendorNameById || vendorNameById.size === 0) return

    setProducts((prev) => {
      let changed = false
      const next = prev.map((product) => {
        const vid = String(product.vendorId ?? '').trim()
        if (!vid) return product
        if (product.source !== 'vendor') return product

        const resolved = vendorNameById.get(vid)
        if (!resolved) return product
        const current = String(product.vendorName ?? '').trim()
        if (current === resolved) return product

        changed = true
        return { ...product, vendorName: resolved }
      })

      return changed ? next : prev
    })
  }, [vendorNameById])

  useEffect(() => {
    // Chargement des catégories uniquement lorsque l'onglet Catégories est ouvert.
    if (activeTab !== 'categories') return
    void loadCategories(true)
  }, [activeTab, loadCategories])

  const handleCreateProduct = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditProduct = async (product: Product) => {
    try {
      // Ouvrir la modale immédiatement pour éviter tout délai perceptible.
      setSelectedProduct(product)
      setSelectedSharedProduct(null)
      setIsEditModalOpen(true)

      setIsLoading(true)
      const fallbackFetcher = SuperAdminDashboardApi.getProductById.bind(SuperAdminDashboardApi)
      const fetchProduct = SuperAdminDashboardService.getProductById ?? fallbackFetcher
      const fullProduct = await fetchProduct(product.id)

      if (!fullProduct) {
        toast({
          title: 'Produit introuvable',
          description: 'Impossible de récupérer les détails du produit. Vérifiez qu’il existe toujours.',
          variant: 'destructive'
        })
        return
      }

      const enrichedProduct = mergeSharedProductIntoProduct(fullProduct, product)

      setSelectedProduct(enrichedProduct)
      setSelectedSharedProduct(fullProduct)
    } catch (error) {
      console.error('❌ Chargement du produit complet impossible:', error)
      toast({
        title: 'Chargement impossible',
        description: 'Le produit n’a pas pu être chargé. Réessayez plus tard.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitAdvancedModal = useCallback(
    async (payload: SharedProductInput & { id?: string }) => {
      const resolvedId = payload.id ?? selectedProduct?.id
      if (resolvedId) {
        payload.id = resolvedId
      }

      if (!payload.media || payload.media.length === 0) {
        const mainImage = payload.mainImage ?? selectedSharedProduct?.mainImage ?? selectedProduct?.mainImage ?? null
        const gallery = payload.galleryImages ?? selectedSharedProduct?.galleryImages ?? selectedProduct?.galleryImages ?? []

        const media: SharedProductMedia[] = []

        if (mainImage) {
          media.push({
            path: mainImage,
            type: 'image',
            altText: payload.name,
            isPrimary: true
          })
        }

        gallery
          .filter((path): path is string => typeof path === 'string' && path.trim().length > 0)
          .forEach((path, index) => {
            media.push({
              path,
              type: 'image',
              altText: payload.name,
              isPrimary: false,
              metadata: { position: index + 1 }
            })
          })

        payload = {
          ...payload,
          media
        }
      }

      return payload
    },
    [selectedProduct, selectedSharedProduct]
  )

  const handleCreateOrUpdate = useCallback(
    async (payload: Record<string, unknown>, mode: 'create' | 'edit', productId?: string) => {
      try {
        const basePayload: SharedProductInput & { id?: string } = {
          ...(payload as SharedProductInput),
          ...(productId ? { id: productId } : {})
        }

        const reconciledPayload = await handleSubmitAdvancedModal(basePayload)

        const normalizedPayload = productId
          ? mapSharedProductInputToUpdateInput(reconciledPayload as SharedProductInput & { id: string })
          : mapSharedProductInputToCreateInput(reconciledPayload)

        const result = mode === 'create'
          ? await SuperAdminDashboardService.createProduct(normalizedPayload as any)
          : await SuperAdminDashboardService.updateProduct(normalizedPayload as any)

        if (!result) {
          throw new Error('Aucune réponse du service')
        }

        toast({
          title: mode === 'create' ? 'Produit créé' : 'Produit mis à jour',
          description: 'Les informations du produit ont été synchronisées avec succès.'
        })
        addNotification(
          'success',
          mode === 'create' ? 'Produit créé' : 'Produit mis à jour',
          `Le produit ${result.name} est maintenant ${mode === 'create' ? 'disponible pour la marketplace.' : 'à jour côté super admin.'}`
        )

        setIsCreateModalOpen(false)
        setIsEditModalOpen(false)
        setSelectedProduct(null)
        setSelectedSharedProduct(null)
        void loadProducts()
      } catch (error) {
        console.error('❌ Impossible d’enregistrer le produit:', error)

        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'La sauvegarde du produit a échoué. Vérifiez les données puis réessayez.'

        toast({
          title: 'Échec de la sauvegarde',
          description: message,
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Échec de la sauvegarde',
          message
        )
      }
    },
    [handleSubmitAdvancedModal, loadProducts, toast, addNotification]
  )

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      const accepted = await confirm({
        title: 'Supprimer le produit',
        message: 'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        tone: 'destructive'
      })
      if (!accepted) return

      try {
        const success = await SuperAdminDashboardService.deleteProduct(productId)
        if (!success) {
          throw new Error('Suppression refusée')
        }

        toast({
          title: 'Produit supprimé',
          description: 'Le produit a été retiré de la marketplace.'
        })
        addNotification(
          'success',
          'Produit supprimé',
          'Le produit a été retiré du catalogue avec succès.'
        )

        setSelectedProducts((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })

        void loadProducts()
      } catch (error) {
        console.error('❌ Erreur lors de la suppression du produit:', error)
        toast({
          title: 'Suppression échouée',
          description: 'Impossible de supprimer ce produit pour le moment.',
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Suppression échouée',
          'La suppression du produit a échoué. Veuillez réessayer plus tard.'
        )
      }
    },
    [loadProducts, toast, addNotification]
  )

  const handleToggleFeatured = useCallback(
    async (productId: string) => {
      try {
        const target = products.find((product) => product.id === productId)
        if (!target) return

        const result = await SuperAdminDashboardService.updateProduct({
          id: productId,
          isFeatured: !target.featured,
          name: target.name,
          price: target.price,
          productStatus: mapServiceStatus(target.status)
        } as any)

        if (!result) {
          throw new Error('Mise à jour vedette échouée')
        }

        toast({
          title: target.featured ? 'Produit retiré des vedettes' : 'Produit mis en vedette',
          description: `Le produit ${target.name} a été ${target.featured ? 'retiré' : 'ajouté'} des vedettes.`
        })
        addNotification(
          'success',
          target.featured ? 'Vedette retirée' : 'Produit mis en vedette',
          target.featured
            ? `Le produit ${target.name} n'apparaît plus dans les vedettes.`
            : `Le produit ${target.name} est maintenant mis en avant sur la marketplace.`
        )

        void loadProducts()
      } catch (error) {
        console.error('❌ Impossible de modifier le statut vedette:', error)
        toast({
          title: 'Action vedette échouée',
          description: 'La mise à jour du statut vedette a échoué.',
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Action vedette échouée',
          "Le statut vedette n'a pas pu être modifié."
        )
      }
    },
    [loadProducts, products, toast, addNotification]
  )

  const handleStatusChange = useCallback(
    async (productId: string, newStatus: ProductStatus) => {
      try {
        const result = await SuperAdminDashboardService.updateProduct({
          id: productId,
          productStatus: mapServiceStatus(newStatus)
        } as any)

        if (!result) {
          throw new Error('Mise à jour échouée')
        }

        toast({
          title: 'Statut mis à jour',
          description: 'Le statut du produit a été modifié avec succès.'
        })
        addNotification(
          'success',
          'Statut modifié',
          'Le nouveau statut est désormais effectif sur la marketplace.'
        )
        void loadProducts()
      } catch (error) {
        console.error('❌ Impossible de changer le statut du produit:', error)
        toast({
          title: 'Modification impossible',
          description: 'Le statut n’a pas pu être modifié. Réessayez plus tard.',
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Modification impossible',
          "Le changement de statut n'a pas été enregistré."
        )
      }
    },
    [loadProducts, toast, addNotification]
  )

  const handleReportProduct = useCallback(
    async (productId: string) => {
      try {
        const result = await SuperAdminDashboardService.reportProduct({
          productId,
          status: 'archived'
        })

        if (!result) {
          throw new Error('Signalement échoué')
        }

        toast({
          title: 'Produit signalé',
          description: 'Le produit a été signalé et déplacé en modération.'
        })

        void loadProducts()
      } catch (error) {
        console.error('❌ Impossible de signaler le produit:', error)
        toast({
          title: 'Signalement impossible',
          description: 'Le produit n’a pas pu être signalé.',
          variant: 'destructive'
        })
      }
    },
    [loadProducts, toast]
  )

  const handleBulkAction = useCallback(
    async (action: ProductStatus | 'duplicate' | 'delete') => {
      if (selectedProducts.size === 0) return

      const productIds = Array.from(selectedProducts)

      try {
        let affected = 0

        switch (action) {
          case 'duplicate':
            await Promise.all(
              productIds.map((id) =>
                SuperAdminDashboardService.duplicateProduct({ productId: id, overrides: { productStatus: 'draft' } })
              )
            )
            toast({
              title: 'Produits dupliqués',
              description: `${productIds.length} duplication(s) ont été créées en brouillon.`
            })
            addNotification(
              'success',
              'Duplication terminée',
              `${productIds.length} produit(s) ont été dupliqués en brouillon.`
            )
            break
          case 'delete': {
            const accepted = await confirm({
              title: 'Suppression groupée',
              message: `Êtes-vous sûr de vouloir supprimer ${productIds.length} produit(s) ?`,
              confirmText: 'Supprimer',
              cancelText: 'Annuler',
              tone: 'destructive'
            })
            if (!accepted) break
            await Promise.all(productIds.map((id) => SuperAdminDashboardService.deleteProduct(id)))
            toast({
              title: 'Produits supprimés',
              description: `${productIds.length} produit(s) ont été supprimés.`
            })
            addNotification(
              'success',
              'Suppression groupée',
              `${productIds.length} produit(s) ont été retirés du catalogue.`
            )
            break
          }
          case 'active':
            affected = await SuperAdminDashboardService.bulkProductAction({ action: 'activate', productIds })
            break
          case 'inactive':
            affected = await SuperAdminDashboardService.bulkProductAction({ action: 'deactivate', productIds })
            break
          case 'pending':
            affected = await SuperAdminDashboardService.bulkProductAction({ action: 'activate', productIds })
            break
          case 'draft':
            affected = await SuperAdminDashboardService.bulkProductAction({ action: 'deactivate', productIds })
            break
          case 'reported':
            affected = await SuperAdminDashboardService.bulkProductAction({ action: 'deactivate', productIds })
            break
        }

        setSelectedProducts(new Set())
        setSelectAll(false)
        setShowBulkActions(false)

        if (action !== 'duplicate' && action !== 'delete') {
          toast({
            title: 'Action groupée appliquée',
            description: `${affected} produit(s) mis à jour.`
          })
          addNotification(
            'success',
            'Mise à jour groupée',
            `${affected} produit(s) ont reçu la nouvelle action.`
          )
        }

        void loadProducts()
      } catch (error) {
        console.error('❌ Action groupée impossible:', error)
        toast({
          title: 'Action groupée échouée',
          description: 'Aucune mise à jour n’a pu être effectuée.',
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Action groupée échouée',
          "Une erreur est survenue lors de l'application de l'action groupée."
        )
      }
    },
    [loadProducts, selectedProducts, toast, addNotification]
  )

  const handleDuplicateProduct = useCallback(
    async (product: Product) => {
      try {
        const result = await SuperAdminDashboardService.duplicateProduct({
          productId: product.id,
          overrides: { productStatus: 'draft' }
        })

        if (!result) {
          throw new Error('Duplication échouée')
        }

        toast({
          title: 'Produit dupliqué',
          description: `Une copie brouillon de ${product.name} a été créée.`
        })
        addNotification(
          'success',
          'Duplication réussie',
          `Le produit ${product.name} a été dupliqué en brouillon.`
        )

        void loadProducts()
      } catch (error) {
        console.error('❌ Duplication de produit impossible:', error)
        toast({
          title: 'Duplication échouée',
          description: `Impossible de dupliquer ${product.name}.`,
          variant: 'destructive'
        })
        addNotification(
          'error',
          'Duplication échouée',
          `Le produit ${product.name} n'a pas pu être dupliqué.`
        )
      }
    },
    [loadProducts, toast, addNotification]
  )

  const flattenTree = useCallback((nodes: ProductCategoryTreeNode[], search = ''): ProductCategoryTreeNode[] => {
    const collected: ProductCategoryTreeNode[] = []
    const term = search.trim().toLowerCase()

    const visit = (node: ProductCategoryTreeNode) => {
      const matches = term.length === 0 || node.name.toLowerCase().includes(term)
      if (matches) {
        collected.push(node)
      }
      node.children.forEach(visit)
    }

    nodes.forEach(visit)
    return collected
  }, [])

  const filteredCategoryTree = useMemo(() => {
    if (!categorySearchTerm.trim()) {
      return categoryTree
    }

    const term = categorySearchTerm.trim().toLowerCase()

    const filterNode = (node: ProductCategoryTreeNode): ProductCategoryTreeNode | null => {
      const childMatches = node.children
        .map(filterNode)
        .filter((child): child is ProductCategoryTreeNode => Boolean(child))

      const selfMatches = node.name.toLowerCase().includes(term)

      if (selfMatches || childMatches.length > 0) {
        return {
          ...node,
          children: childMatches
        }
      }

      return null
    }

    return categoryTree
      .map(filterNode)
      .filter((node): node is ProductCategoryTreeNode => Boolean(node))
  }, [categorySearchTerm, categoryTree])

  const categoryOptionsForSelect = useMemo(() => {
    return flattenTree(categoryTree).map((node) => ({
      id: node.id,
      label: `${'— '.repeat(node.depth)}${node.name}`
    }))
  }, [categoryTree, flattenTree])

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }, [])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set())
      setSelectAll(false)
    } else {
      const currentTabProducts = filteredProducts
      setSelectedProducts(new Set(currentTabProducts.map((p) => p.id)))
      setSelectAll(true)
    }
  }

  useEffect(() => {
    setShowBulkActions(selectedProducts.size > 0)
  }, [selectedProducts])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu && !(event.target as Element).closest('.export-menu-container')) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  const clearSelection = () => {
    setSelectedProducts(new Set())
    setSelectAll(false)
    setShowBulkActions(false)
  }

  // Fonction d'export CSV
  const buildExportFileName = (extension: string) => {
    const base = selectedProducts.size > 0 ? 'produits_selectionnes_export' : 'produits_export'
    return `${base}_${new Date().toISOString().split('T')[0]}.${extension}`
  }

  const exportToCSV = (productsToExport: Product[]) => {
    try {
      // Préparer les données pour l'export
      const exportData = productsToExport.map(product => ({
        ID: product.id,
        Nom: product.name,
        Description: product.description,
        Prix: formatMoney(Number(product.price ?? 0)),
        'Prix de vente': product.salePrice && product.salePrice > 0 ? formatMoney(Number(product.salePrice ?? 0)) : 'N/A',
        'Prix de revient': formatMoney(Number(product.costPrice ?? 0)),
        Catégorie: product.category,
        'Sous-catégorie': product.subcategory,
        Marque: product.brand,
        Vendeur: product.vendorName,
        Statut: product.status === 'active' ? 'Actif' : 
                product.status === 'inactive' ? 'Inactif' :
                product.status === 'draft' ? 'Brouillon' :
                product.status === 'pending' ? 'En attente' :
                product.status === 'reported' ? 'Signalé' : 'Inconnu',
        Stock: product.stock,
        'Alerte stock': product.stockAlert,
        Note: `${product.rating}/5`,
        'Total ventes': product.totalSales,
        'Revenus totaux': formatMoney(Number(product.totalRevenue ?? 0)),
        Vedette: product.featured ? 'Oui' : 'Non',
        SKU: product.sku,
        'Date création': product.createdAt,
        'Date modification': product.updatedAt,
        'Score SEO': product.seoScore,
        'Partages sociaux': product.socialShares
      }))

      // Créer le contenu CSV avec gestion des caractères spéciaux
      const headers = Object.keys(exportData[0]).join(',')
      const rows = exportData.map(row => 
        Object.values(row).map(value => {
          const stringValue = String(value)
          // Échapper les guillemets et entourer de guillemets si nécessaire
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
      const csvContent = [headers, ...rows].join('\n')

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // Nom du fichier selon le type d'export
      const fileName = buildExportFileName('csv')
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Nettoyer l'URL
      URL.revokeObjectURL(url)

      // Notification de succès avec détails
      toast({
        title: 'Export CSV prêt',
        description: `${productsToExport.length} produit(s) exporté(s) avec succès.`
      })
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      toast({
        title: 'Export CSV impossible',
        description: 'Une erreur est survenue lors de la génération du fichier.',
        variant: 'destructive'
      })
    }
  }

  // Fonction d'export Excel (XLSX)
  const exportToExcel = (productsToExport: Product[]) => {
    try {
      // Préparer les données pour l'export
      const exportData = productsToExport.map(product => ({
        ID: product.id,
        Nom: product.name,
        Description: product.description,
        Prix: product.price,
        'Prix de vente': product.salePrice && product.salePrice > 0 ? product.salePrice : null,
        'Prix de revient': product.costPrice ?? 0,
        Catégorie: product.category,
        'Sous-catégorie': product.subcategory,
        Marque: product.brand,
        Vendeur: product.vendorName,
        Statut: product.status === 'active' ? 'Actif' : 
                product.status === 'inactive' ? 'Inactif' :
                product.status === 'draft' ? 'Brouillon' :
                product.status === 'pending' ? 'En attente' :
                product.status === 'reported' ? 'Signalé' : 'Inconnu',
        Stock: product.stock,
        'Alerte stock': product.stockAlert,
        Note: product.rating,
        'Total ventes': product.totalSales,
        'Revenus totaux': product.totalRevenue,
        Vedette: product.featured ? 'Oui' : 'Non',
        SKU: product.sku,
        'Date création': product.createdAt,
        'Date modification': product.updatedAt,
        'Score SEO': product.seoScore,
        'Partages sociaux': product.socialShares
      }))

      // Créer le contenu Excel (format TSV pour compatibilité)
      const headers = Object.keys(exportData[0]).join('\t')
      const rows = exportData.map(row => 
        Object.values(row).map(value => {
          const stringValue = String(value || '')
          // Échapper les tabulations et retours à la ligne
          if (stringValue.includes('\t') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join('\t')
      )
      const tsvContent = [headers, ...rows].join('\n')

      // Créer et télécharger le fichier
      const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // Nom du fichier selon le type d'export
      const fileName = buildExportFileName('xls')
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Nettoyer l'URL
      URL.revokeObjectURL(url)

      // Notification de succès avec détails
      toast({
        title: 'Export Excel prêt',
        description: `${productsToExport.length} ligne(s) disponibles au téléchargement.`
      })
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
      toast({
        title: 'Export Excel impossible',
        description: 'Impossible de générer le fichier Excel pour le moment.',
        variant: 'destructive'
      })
    }
  }

  // Fonction d'export PDF
  const exportToPDF = (productsToExport: Product[]) => {
    try {
      // Créer le contenu HTML imprimable
      const htmlContent = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Export Produits</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { color: #ff6600; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; font-size: 12px; }
            th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; }
            .meta { text-align: center; color: #6b7280; margin-top: 8px; }
            tr:nth-child(even) { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Export des produits</h1>
          <p class="meta">${new Date().toLocaleString('fr-FR')}</p>
          <p class="meta">${productsToExport.length} produit(s) préparé(s)</p>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Marque</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${productsToExport.map((product) => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.brand}</td>
                  <td>${product.category} > ${product.subcategory}</td>
                  <td>${formatPrice(product.price)}</td>
                  <td>${product.stock}</td>
                  <td>${product.status}</td>
                  <td>${product.rating}/5</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>`

      const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800')
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'export (bloqueur de popup?).')
      }

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()

      // Laisser au navigateur le temps de rendre avant d'imprimer
      setTimeout(() => {
        try {
          printWindow.print()
          toast({
            title: 'Export PDF prêt',
            description: 'La fenêtre d\'impression s\'ouvre pour générer votre PDF.'
          })
        } catch (printError) {
          console.error('Erreur impression PDF:', printError)
          toast({
            title: 'Export PDF impossible',
            description: 'Impossible de lancer l\'impression du PDF.',
            variant: 'destructive'
          })
        }
      }, 300)
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      toast({
        title: 'Export PDF impossible',
        description: error instanceof Error ? error.message : 'Erreur inconnue.',
        variant: 'destructive'
      })
    }
  }

  // Fonction principale d'export avec sélection du format
  const exportProducts = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      // Déterminer quels produits exporter (sélectionnés ou tous)
      const productsToExport = selectedProducts.size > 0 
        ? filteredProducts.filter(product => selectedProducts.has(product.id))
        : filteredProducts

      // Vérifier s'il y a des produits à exporter
      if (productsToExport.length === 0) {
        toast({
          title: 'Aucun produit sélectionné',
          description: 'Sélectionnez au moins un produit ou ajustez vos filtres avant d\'exporter.',
          variant: 'destructive'
        })
        return
      }

      // Exporter selon le format choisi
      switch (format) {
        case 'csv':
          exportToCSV(productsToExport)
          break
        case 'excel':
          exportToExcel(productsToExport)
          break
        case 'pdf':
          exportToPDF(productsToExport)
          break
        default:
          exportToCSV(productsToExport)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast({
        title: 'Export impossible',
        description: 'Une erreur inattendue est survenue.',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Actif</Badge>
      case 'inactive': return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Inactif</Badge>
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Brouillon</Badge>
      case 'pending': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En attente</Badge>
      case 'reported': return <Badge className="bg-red-100 text-red-800 border-red-200">Signalé</Badge>
      default: return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const formatPrice = (price: number) => {
    return formatMoney(price)
  }

  return (
    <div className="space-y-6">
      {/* Gestion des catégories */}
      <Card className="border-[#ff6600]/40 bg-gradient-to-br from-white to-[#ff6600]/5">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderTree className="h-5 w-5 text-[#ff6600]" />
              Gestion créative des catégories
            </CardTitle>
            <CardDescription>
              Organisez vos catégories et sous-catégories avec un contrôle total.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              onClick={() => {
                setCategorySearchTerm('')
                setCategoryDrawerOpen(true)
                void loadCategories()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Explorer
            </Button>
            <Button
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              onClick={() => {
                setCategorySearchTerm('')
                setCategoryDrawerOpen(true)
                void loadCategories(true)
                openCategoryForm('create')
              }}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-dashed border-[#ff6600]/60 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-[#ff6600]">
                  <Sparkles className="h-4 w-4" />
                  Suggestions smart
                </CardTitle>
                <CardDescription>
                  Utilisez la palette de couleurs et les modes d’affichage pour donner une identité visuelle forte à chaque catégorie.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-dashed border-[#535455]/40 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-[#535455]">
                  <Layers className="h-4 w-4" />
                  Hierarchie intuitive
                </CardTitle>
                <CardDescription>
                  Support illimité des sous-catégories, avec future option drag & drop pour des réorganisations instantanées.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-dashed border-[#ff6600]/40 bg-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-[#ff6600]">
                  <Star className="h-4 w-4" />
                  Synchronisation totale
                </CardTitle>
                <CardDescription>
                  Chaque modification est répercutée automatiquement sur tous les formulaires produits et pages publiques.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-6 rounded-xl border border-[#ff6600]/30 bg-white/80 p-5 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Aperçu rapide</h3>
                <p className="text-sm text-gray-500">
                  {isCategoryLoading
                    ? 'Chargement de la structure en cours…'
                    : categoryTree.length > 0
                      ? `${categoryTree.length} catégorie(s) racine organisée(s).`
                      : 'Aucune catégorie pour le moment. Créez-en une pour démarrer.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                onClick={() => setActiveTab('categories')}
                disabled={isCategoryLoading}
              >
                <FolderTree className="mr-2 h-4 w-4" />
                Gérer les catégories
              </Button>
            </div>

            <div className="max-h-60 overflow-auto space-y-3">
              {isCategoryLoading ? (
                <div className="flex items-center justify-center py-6 text-[#ff6600]">
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  <span>Nous récupérons vos catégories…</span>
                </div>
              ) : categoryTree.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                  Commencez par créer votre première catégorie pour alimenter la hiérarchie.
                </div>
              ) : (
                categoryTree.slice(0, 6).map((node) => (
                  <div
                    key={node.id}
                    className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm hover:border-[#ff6600]/40 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{node.name}</p>
                        <p className="text-xs text-gray-500 flex flex-wrap gap-1">
                          <span>{node.children.length} sous-catégorie(s)</span>
                          {node.stats?.totalProducts !== undefined && (
                            <>
                              <span>•</span>
                              <span>{node.stats.totalProducts} produit(s)</span>
                            </>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className={node.is_active ? 'border-emerald-400 text-emerald-600' : 'border-gray-300 text-gray-500'}>
                        {node.is_active ? 'Active' : 'Masquée'}
                      </Badge>
                    </div>
                    {node.stats?.vendors?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {node.stats.vendors.slice(0, 3).map((vendor) => (
                          <span key={`${node.id}-${vendor.vendorId ?? 'unknown'}`} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1">
                            <Users className="h-3 w-3 text-[#ff6600]" />
                            {vendor.vendorId ? (vendorNameById.get(vendor.vendorId) ?? vendor.vendorId) : 'Vendeur inconnu'}
                            <span className="font-semibold text-gray-700">×{vendor.count}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            {categoryTree.length > 6 && !isCategoryLoading && (
              <div className="text-right text-xs text-gray-500">
                … et {categoryTree.length - 6} catégorie(s) supplémentaire(s).
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drawer catégories */}
      <Dialog open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FolderTree className="h-5 w-5 text-[#ff6600]" />
              Catégories & sous-catégories
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={categorySearchTerm}
                  onChange={(event) => setCategorySearchTerm(event.target.value)}
                  placeholder="Rechercher une catégorie (nom, slug...)"
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => void loadCategories(true)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rafraîchir
                </Button>
                <Button
                  onClick={() => openCategoryForm('create')}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-[2fr,3fr] gap-4">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-700">Aperçu hiérarchique</p>
                  <Badge variant="outline" className="text-xs">
                    {isCategoryLoading ? 'Chargement...' : `${categories.length} catégorie(s)`}
                  </Badge>
                </div>
                <div className="max-h-[420px] overflow-auto p-4 space-y-3">
                  {isCategoryLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">Chargement...</div>
                  ) : filteredCategoryTree.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                      Aucune catégorie ne correspond à votre recherche.
                    </div>
                  ) : (
                    filteredCategoryTree.map((node) => (
                      <CategoryTreeNodeCard
                        key={node.id}
                        node={node}
                        onEdit={(category) => openCategoryForm('edit', category)}
                        onToggle={handleToggleCategory}
                        onDuplicate={handleDuplicateCategory}
                        onDelete={handleDeleteCategory}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <CategoryForm
                  mode={categoryFormMode}
                  formData={categoryFormData}
                  setFormData={setCategoryFormData}
                  onSubmit={handleSaveCategory}
                  onCancel={() => {
                    setCategoryFormOpen(false)
                    syncFormWithCategory(null)
                  }}
                  isOpen={categoryFormOpen}
                  categoryOptions={categoryOptionsForSelect}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications harmonisées */}
      <div className="fixed top-16 right-6 z-[9999] space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              max-w-sm w-full bg-white rounded-xl shadow-lg border-l-4 p-4
              hover:shadow-xl transition-all duration-300 ease-out
              ${notification.type === 'success' ? 'border-l-green-500' : ''}
              ${notification.type === 'error' ? 'border-l-red-500' : ''}
              ${notification.type === 'warning' ? 'border-l-yellow-500' : ''}
              ${notification.type === 'info' ? 'border-l-blue-500' : ''}
            `}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
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
                  <Clock className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* En-tête de la gestion des produits */}
      <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#535455]/10 border border-[#ff6600]/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion Complète des Produits</h2>
            <p className="text-gray-600 mt-2">
              Création, édition, suppression et modération de tous les produits de la marketplace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCreateProduct}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer Produit
            </Button>
            <div className="relative export-menu-container">
              <Button 
                variant="outline" 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={`border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors ${
                  selectedProducts.size > 0 ? 'ring-2 ring-[#ff6600]/50' : ''
                }`}
                title={selectedProducts.size > 0 ? `Exporter ${selectedProducts.size} produit(s) sélectionné(s)` : 'Exporter tous les produits'}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {selectedProducts.size > 0 ? `Exporter (${selectedProducts.size})` : 'Exporter'}
              </Button>
              
              {/* Menu déroulant des formats d'export */}
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportProducts('csv')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4 text-[#ff6600]" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        exportProducts('excel')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4 text-[#ff6600]" />
                      Export Excel
                    </button>
                    <button
                      onClick={() => {
                        exportProducts('pdf')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4 text-[#ff6600]" />
                      Export PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, description, marque ou vendeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ProductStatus | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="reported">Signalé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Vendeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les vendeurs</SelectItem>
                {vendorSelectOptions.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Barre d'actions en lot */}
      {showBulkActions && selectedProducts.size > 0 && (
        <Card className="border-[#ff6600] bg-[#ff6600]/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#ff6600]">
                  {selectedProducts.size} produit(s) sélectionné(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                >
                  Annuler la sélection
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Actions disponibles selon l'onglet */}
                {activeTab === 'all' || activeTab === 'active' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Brouillon
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('reported')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalé
                    </Button>
                  </>
                ) : activeTab === 'pending' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('active')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Actif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Brouillon
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('reported')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalé
                    </Button>
                  </>
                ) : activeTab === 'reported' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('active')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Actif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Brouillon
                    </Button>
                  </>
                ) : activeTab === 'featured' || activeTab === 'low-stock' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Brouillon
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('reported')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalé
                    </Button>
                  </>
                ) : activeTab === 'draft' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('active')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Actif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('reported')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalé
                    </Button>
                  </>
                ) : null}
                
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        <TabsList className="flex w-full items-center gap-2 overflow-x-auto rounded-lg border border-[#535455]/20 bg-[#535455]/10 px-2 py-2 scrollbar-thin scrollbar-thumb-[#ff6600]/50 scrollbar-track-transparent">
            <TabsTrigger
              value="all"
              className="min-w-[140px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              Tous ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="min-w-[140px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              Catégories
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="min-w-[140px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              Actifs ({getTabCount('active')})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="min-w-[140px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              En Attente ({getTabCount('pending')})
            </TabsTrigger>
            <TabsTrigger
              value="vendor-products"
              className="min-w-[160px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              Produits Vend ({getTabCount('vendor-products')})
            </TabsTrigger>
            <TabsTrigger
              value="reported"
              className="min-w-[140px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              Signalés ({getTabCount('reported')})
            </TabsTrigger>
            <TabsTrigger
              value="featured"
              className="min-w-[140px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              Vedettes ({getTabCount('featured')})
            </TabsTrigger>
            <TabsTrigger
              value="low-stock"
              className="min-w-[150px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              Stock Faible ({getTabCount('low-stock')})
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="min-w-[140px] whitespace-nowrap px-4 py-2 text-sm font-medium transition data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
            >
              Brouillons ({getTabCount('draft')})
            </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ProductList 
            products={filteredProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
              <Card className="border-[#ff6600]/40 bg-gradient-to-br from-white to-[#ff6600]/10">
                <CardHeader className="flex flex-col gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FolderTree className="h-5 w-5 text-[#ff6600]" />
                    Vue hiérarchique
                  </CardTitle>
                  <CardDescription>
                    Parcourez vos catégories avec leurs statistiques produits et vendeurs mises à jour.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {isCategoryLoading
                          ? 'Chargement des catégories...'
                          : `${categoryTree.length} catégorie(s) racine${categoryTree.length > 1 ? 's' : ''}`}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                        onClick={() => void loadCategories(true)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Rafraîchir
                      </Button>
                    </div>

                    <div className="rounded-xl border border-dashed border-[#ff6600]/40 bg-white/80 p-4 space-y-3 max-h-[460px] overflow-y-auto">
                      {isCategoryLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-[#ff6600]">
                          <Sparkles className="mb-2 h-6 w-6 animate-spin" />
                          <p>Nous illuminons vos catégories…</p>
                        </div>
                      ) : categoryTree.length === 0 ? (
                        <div className="text-center text-sm text-gray-500">
                          Aucune catégorie n’est encore configurée. Créez votre première catégorie pour commencer.
                        </div>
                      ) : (
                        categoryTree.map((node) => (
                          <CategoryTreeNodeCard
                            key={node.id}
                            node={node}
                            onEdit={(category) => openCategoryForm('edit', category)}
                            onToggle={handleToggleCategory}
                            onDuplicate={handleDuplicateCategory}
                            onDelete={handleDeleteCategory}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#535455]/30 bg-white/90">
                <CardHeader className="gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-[#535455]" />
                    Top vendeurs par catégorie
                  </CardTitle>
                  <CardDescription>
                    Identifiez rapidement vos vendeurs les plus actifs et leurs catégories phares.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-dashed border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                          <th className="px-4 py-3">Catégorie</th>
                          <th className="px-4 py-3">Produits</th>
                          <th className="px-4 py-3">Vendeur</th>
                          <th className="px-4 py-3">Actifs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryTree.length === 0 && !isCategoryLoading ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                              Les statistiques apparaîtront dès que des catégories seront disponibles.
                            </td>
                          </tr>
                        ) : (
                          categoryTree.flatMap((node) => {
                            const vendors = node.stats?.vendors ?? []
                            return vendors.slice(0, 3).map((vendor, index) => {
                              const product = node.stats?.products?.find((item) => item.vendorId === vendor.vendorId)
                              const isPrimaryRow = index === 0

                              return (
                                <tr key={`${node.id}-${vendor.vendorId ?? 'unknown'}-${index}`} className="border-b border-gray-100">
                                  <td className="px-4 py-3 align-top">
                                    {isPrimaryRow ? (
                                      <div>
                                        <p className="font-semibold text-gray-900">{node.name}</p>
                                        <p className="text-xs text-gray-500">{node.stats?.totalProducts ?? 0} produit(s)</p>
                                      </div>
                                    ) : null}
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    {product ? product.name : '—'}
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    <Badge variant="outline" className="flex w-fit items-center gap-1">
                                      <Users className="h-3 w-3 text-[#ff6600]" />
                                      {vendor.vendorId ? (vendorNameById.get(vendor.vendorId) ?? vendor.vendorId) : 'Vendeur inconnu'}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 align-top text-xs text-gray-500">
                                    {vendor.count} produit(s)
                                  </td>
                                </tr>
                              )
                            })
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        <TabsContent value="active" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.status === 'active')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.status === 'pending')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="vendor-products" className="mt-6">
          <ProductList 
            products={filteredProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="reported" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.status === 'reported')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.featured)}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="low-stock" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.stock <= p.stockAlert)}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.status === 'draft')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de création de produit */}
      {isCreateModalOpen && (
        <ProductCategoryProvider eager>
          <AdvancedProductModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            mode="create"
            product={null}
            context="super-admin"
            vendorOptions={vendorSelectOptions}
            initialVendorId={null}
            initialStatus="draft"
            onSubmit={async (payload) => {
              await handleCreateOrUpdate(payload, 'create')
            }}
            onSuccess={async () => {
              void loadProducts()
              addNotification('success', 'Catalogue mis à jour', 'La liste des produits a été actualisée après création.')
            }}
          />
        </ProductCategoryProvider>
      )}

      {/* Modal d'édition de produit */}
      {isEditModalOpen && selectedProduct && (
        <ProductCategoryProvider eager>
          <AdvancedProductModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            mode="edit"
            product={selectedSharedProduct ?? (selectedProduct as unknown as SharedProduct)}
            context="super-admin"
            vendorOptions={vendorSelectOptions}
            initialVendorId={selectedProduct.vendorId ?? null}
            initialStatus={selectedProduct.status as SharedProductInput['productStatus'] | undefined}
            onSubmit={async (payload) => {
              await handleCreateOrUpdate(payload, 'edit', selectedProduct.id)
            }}
            onSuccess={async () => {
              void loadProducts()
              addNotification('success', 'Fiche produit actualisée', 'Les informations du produit ont été rechargées.')
            }}
          />
        </ProductCategoryProvider>
      )}

      {/* Modal de visualisation de produit */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails du Produit</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Informations Générales</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{selectedProduct.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedProduct.brand}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedProduct.vendorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Créé le {selectedProduct.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Prix et Stock</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{formatPrice(selectedProduct.price)}</span>
                        {selectedProduct.salePrice && selectedProduct.salePrice > 0 && (
                          <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">
                            {formatPrice(selectedProduct.salePrice ?? 0)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Stock: {selectedProduct.stock} unités</span>
                        {selectedProduct.stock <= selectedProduct.stockAlert && (
                          <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">
                            Stock faible
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Performance</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedProduct.totalSales} ventes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatPrice(selectedProduct.totalRevenue)} de revenus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Note: {selectedProduct.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">SEO et Social</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Score SEO: {selectedProduct.seoScore}/100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedProduct.socialShares} partages</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewModalOpen(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                >
                  Fermer
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewModalOpen(false)
                    handleEditProduct(selectedProduct)
                  }}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant de liste des produits
interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
  onStatusChange: (productId: string, status: Product['status']) => void
  onToggleFeatured: (productId: string) => void
  onView: (product: Product) => void
  selectedProducts: Set<string>
  onSelectProduct: (productId: string) => void
  onDuplicate: (productId: string) => void
  onReport: (productId: string) => void
}

function ProductList({ products, onEdit, onDelete, onStatusChange, onToggleFeatured, onView, selectedProducts, onSelectProduct, onDuplicate, onReport }: ProductListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const { formatMoney } = useMoney()
  
  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.menu-container')) {
        setOpenMenuId(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])
  
  const formatPrice = (price: number) => {
    return formatMoney(price)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Actif</Badge>
      case 'inactive': return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Inactif</Badge>
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Brouillon</Badge>
      case 'pending': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En attente</Badge>
      case 'reported': return <Badge className="bg-red-100 text-red-800 border-red-200">Signalé</Badge>
      default: return <Badge variant="outline">Inconnu</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Checkbox de sélection */}
                <input
                  type="checkbox"
                  checked={selectedProducts.has(product.id)}
                  onChange={() => onSelectProduct(product.id)}
                  className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                />
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-r from-[#ff6600]/10 via-white to-[#535455]/10 flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        const target = event.currentTarget
                        target.style.display = 'none'
                        target.parentElement?.classList.add('bg-gradient-to-r', 'from-[#ff6600]', 'to-[#535455]')
                        target.parentElement?.classList.add('text-white')
                      }}
                    />
                  ) : (
                    <Package className="h-8 w-8 text-[#ff6600]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    {getStatusBadge(product.status)}
                    {product.featured && (
                      <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">
                        Vedette
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{product.brand}</span>
                    <span>{product.category} {'>'} {product.subcategory}</span>
                    <span>{product.vendorName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{formatPrice(product.price)}</span>
                    {product.salePrice && product.salePrice > 0 && (
                      <span className="text-[#ff6600] font-medium">
                        {formatPrice(product.salePrice ?? 0)}
                      </span>
                    )}
                    <span>Stock: {product.stock}</span>
                    <span>Note: {product.rating}/5</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onView(product)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(product)}
                  className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onToggleFeatured(product.id)}
                  className={product.featured 
                    ? 'bg-[#ff6600] border-[#ff6600] text-white hover:bg-[#ff6600]/90' 
                    : 'border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors'
                  }
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(product.id)}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                {/* Icône 3 points avec menu déroulant */}
                <div className="relative menu-container">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                    onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  
                  {/* Menu déroulant des options */}
                  {openMenuId === product.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onDuplicate(product.id)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4 text-[#ff6600]" />
                          Dupliquer
                        </button>
                        <button
                          onClick={() => {
                            onStatusChange(product.id, 'inactive')
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <EyeOff className="h-4 w-4 text-[#535455]" />
                          Inactif
                        </button>
                        <button
                          onClick={() => {
                            onStatusChange(product.id, 'pending')
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-yellow-600" />
                          En attente
                        </button>
                        {product.status === 'draft' ? (
                          <button
                            onClick={() => {
                              onStatusChange(product.id, 'active')
                              setOpenMenuId(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            Rendre actif
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onStatusChange(product.id, 'draft')
                              setOpenMenuId(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Save className="h-4 w-4 text-yellow-600" />
                            Brouillon
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onReport(product.id)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          Signalé
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {products.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600">Aucun produit ne correspond aux critères de recherche.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
