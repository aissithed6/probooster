"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, 
  TrendingUp, TrendingDown, Package, Star, 
  ShoppingCart, Share2, AlertTriangle, CheckCircle,
  MoreHorizontal, Download, Upload, RefreshCw,
  BarChart3, Target, Zap, Users, Gift, Copy,
  Archive, ExternalLink, Settings, BarChart,
  Heart, MessageCircle, Link, QrCode, Calendar,
  Clock, MapPin, Truck, CreditCard, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatPrice, convertToPoints, formatPoints } from '@/lib/currency-utils'
import { SellerDashboardService, type SellerProduct, type UpdateSellerProductInput } from '@/lib/services/seller-dashboard-service'
import { SellerDashboardApi } from '@/lib/services/seller-dashboard-service.api'
import { useToast } from '@/components/ui/use-toast'
import { useConfirm } from '@/components/ui/confirm-dialog'
import AdvancedProductModal from '@/components/seller-dashboard/advanced-product-modal'
import { ProductCategoryProvider } from '@/contexts/product-category-context'
import { CatalogCategoryService } from '@/lib/services/catalog-category-service'
import type { ProductCategoryRecord } from '@/lib/types/product-category'
import type { SharedProductInput } from '@/lib/types/shared-product'

interface ProductManagementProps {
  vendorId: string
  refreshSignal?: number
  onCreateProduct?: () => void
  onEditProduct?: (product: Product) => void
  onProductSelected?: (product: SellerProduct | null) => void
}

type Product = SellerProduct & {
  featured: boolean
  onSale: boolean
  seoScore: number
  socialShares: number
}

export default function ProductManagement({ vendorId, refreshSignal, onCreateProduct, onEditProduct, onProductSelected }: ProductManagementProps) {
  const { toast } = useToast()
  const { confirm } = useConfirm()

  /**
   * Calcule un score SEO simple basé sur la complétude des champs (titre, description, mots-clés, tags).
   */
  const calculateSeoScore = useCallback((product: SellerProduct): number => {
    let score = 0

    if (product.seoTitle && String(product.seoTitle).trim().length > 0) score += 25
    if (product.seoDescription && String(product.seoDescription).trim().length > 0) score += 25

    const meta = (product.metadata ?? null) as any
    const keywordsFromMeta =
      Array.isArray(meta?.seoKeywords) ? meta.seoKeywords : typeof meta?.seoKeywords === 'string' ? meta.seoKeywords.split(',') : []
    const keywordsFromLegacy = typeof (product as any)?.seoKeywords === 'string' ? String((product as any).seoKeywords).split(',') : []
    const keywords = [...keywordsFromMeta, ...keywordsFromLegacy]
      .map((k: any) => (typeof k === 'string' ? k.trim() : ''))
      .filter((k: string) => k.length > 0)

    if (keywords.length > 0) score += 25
    if (Array.isArray(product.tags) && product.tags.length > 0) score += 25

    return score
  }, [])

  /**
   * Formate un montant monétaire pour les KPI (ne doit jamais afficher "Gratuit" quand la valeur vaut 0).
   */
  const formatMoney = useCallback((amount: number) => {
    const value = Number.isFinite(amount) ? amount : 0
    const currency = 'FCFA'
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value) + ` ${currency}`
    )
  }, [])

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const [catalogCategories, setCatalogCategories] = useState<ProductCategoryRecord[]>([])
  const [dashboardAverageRating, setDashboardAverageRating] = useState<number | null>(null)
  const [dashboardRevenueAllTime, setDashboardRevenueAllTime] = useState<number | null>(null)
  const [dashboardRevenue30Days, setDashboardRevenue30Days] = useState<number | null>(null)

  useEffect(() => {
    if (!vendorId) return

    let mounted = true

    const loadDashboardStats = async () => {
      try {
        const accessToken = await SellerDashboardService.getAccessToken()
        const resp = await fetch(`/api/vendor/dashboard?vendorId=${encodeURIComponent(vendorId)}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          credentials: 'include',
          cache: 'no-store'
        })

        if (!resp.ok) {
          return
        }

        const payload = await resp.json().catch(() => ({}))
        const avg = Number(payload?.data?.stats?.averageRating ?? NaN)
        if (!mounted) return
        setDashboardAverageRating(Number.isFinite(avg) ? avg : null)

        const allTime = Number(payload?.data?.revenue?.totalRevenueAllTime ?? NaN)
        const last30 = Number(payload?.data?.revenue?.totalRevenue30Days ?? NaN)

        const resolvedAllTime = Number.isFinite(allTime) ? allTime : null
        const resolvedLast30 = Number.isFinite(last30) ? last30 : null

        // Si l'API dashboard ne retourne pas de CA (0 ou null), on se cale sur la même source que la section "Commandes & ventes"
        // (somme des totals depuis /api/vendor/orders), afin d'éviter tout écart et de ne pas introduire de régression.
        if ((resolvedAllTime === null || resolvedAllTime <= 0) && mounted) {
          /**
           * Calcule le CA total et le CA sur 30 jours à partir des commandes vendeur.
           */
          const computeRevenueFromOrders = async () => {
            const ordersResp = await fetch('/api/vendor/orders', {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
              },
              credentials: 'include',
              cache: 'no-store'
            }).catch(() => null)

            if (!ordersResp?.ok) return null
            const json = await ordersResp.json().catch(() => ({}))
            const rows = Array.isArray((json as any)?.data) ? ((json as any).data as any[]) : []

            const totalAllTime = rows.reduce((sum, o) => sum + Number(o?.total ?? o?.total_amount ?? 0), 0)

            const since = new Date()
            since.setDate(since.getDate() - 30)
            const sinceMs = since.getTime()
            const total30Days = rows.reduce((sum, o) => {
              const createdAt = o?.created_at ?? o?.order_date
              const ts = createdAt ? new Date(String(createdAt)).getTime() : NaN
              if (!Number.isFinite(ts) || ts < sinceMs) return sum
              return sum + Number(o?.total ?? o?.total_amount ?? 0)
            }, 0)

            return {
              allTime: Number.isFinite(totalAllTime) ? totalAllTime : 0,
              last30: Number.isFinite(total30Days) ? total30Days : 0
            }
          }

          const computed = await computeRevenueFromOrders()
          if (!mounted || !computed) return
          setDashboardRevenueAllTime(computed.allTime)
          setDashboardRevenue30Days(computed.last30)
          return
        }

        setDashboardRevenueAllTime(resolvedAllTime)
        setDashboardRevenue30Days(resolvedLast30)
      } catch (err) {
        console.error('Erreur chargement stats vendeur (note moyenne)', err)
      }
    }

    void loadDashboardStats()
    return () => {
      mounted = false
    }
  }, [vendorId])

  useEffect(() => {
    let mounted = true

    const loadCategories = async () => {
      try {
        const items = await CatalogCategoryService.fetchCategories()
        if (!mounted) return
        setCatalogCategories(items)
      } catch (err) {
        console.error('Erreur chargement catégories catalogue', err)
      }
    }

    void loadCategories()
    return () => {
      mounted = false
    }
  }, [])

  // États pour les modals
  const [viewProductModal, setViewProductModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null
  })
  const [quickActionsModal, setQuickActionsModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null
  })
  const [isAdvancedProductOpen, setIsAdvancedProductOpen] = useState(false)
  const [advancedModalMode, setAdvancedModalMode] = useState<'create' | 'edit'>('create')
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null)
  const [selectedSharedProductForEdit, setSelectedSharedProductForEdit] = useState<SharedProductInput | null>(null)

  // Fonction pour ouvrir le modal de visualisation
  const handleViewProduct = (product: Product) => {
    setViewProductModal({ open: true, product })
  }

  // Fonction pour fermer le modal de visualisation
  const handleCloseViewModal = () => {
    setViewProductModal({ open: false, product: null })
  }

  // Fonction pour ouvrir le modal d'actions rapides
  const handleQuickActions = (product: Product) => {
    setQuickActionsModal({ open: true, product })
  }

  // Fonction pour fermer le modal d'actions rapides
  const handleCloseQuickActionsModal = () => {
    setQuickActionsModal({ open: false, product: null })
  }

  // Fonction pour dupliquer un produit
  const mapProduct = useCallback(
    (item: SellerProduct): Product => ({
      ...item,
      featured: item.isPromoted ?? false,
      onSale: Boolean(item.salePrice && item.salePrice < item.price),
      seoScore: calculateSeoScore(item),
      socialShares: item.shares ?? 0
    }),
    [calculateSeoScore]
  )

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await SellerDashboardService.getSellerProducts(vendorId)
      const mapped = data.map(mapProduct)
      setProducts(mapped)
    } catch (err) {
      console.error('Erreur chargement produits vendeur', err)
      setError('Impossible de charger vos produits pour le moment.')
      toast({
        title: 'Erreur de chargement',
        description: "Veuillez réessayer dans quelques instants.",
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [mapProduct, toast, vendorId])

  useEffect(() => {
    if (!vendorId) return
    loadProducts()
  }, [loadProducts, vendorId])

  useEffect(() => {
    if (!vendorId) return
    loadProducts()
  }, [loadProducts, vendorId, refreshSignal])

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const payload = {
        vendorId,
        name: `${product.name} (Copie)`,
        description: product.description ?? null,
        price: product.price,
        salePrice: product.salePrice ?? null,
        category: product.category,
        stockQuantity: product.stock,
        metadata: { duplicatedFrom: product.id }
      }
      const created = await SellerDashboardApi.createProduct(payload as any)
      if (!created) {
        throw new Error('Aucun produit n’a été renvoyé après la duplication.')
      }
      await loadProducts()
      toast({
        title: 'Produit dupliqué',
        description: 'La copie est en attente de validation.'
      })
    } catch (err) {
      console.error('Erreur duplication produit', err)
      toast({
        title: 'Duplication impossible',
        description: 'Veuillez réessayer.',
        variant: 'destructive'
      })
    } finally {
      handleCloseQuickActionsModal()
    }
  }

  const handleArchiveProduct = async (product: Product) => {
    try {
      await SellerDashboardService.updateSellerProduct({
        id: product.id,
        vendorId,
        status: 'inactive'
      })
      await loadProducts()
      toast({ title: 'Produit archivé', description: 'Le produit est désormais inactif.' })
    } catch (error) {
      console.error('Erreur archive produit vendeur', error)
      toast({
        title: 'Archivage impossible',
        description: 'Veuillez réessayer plus tard.',
        variant: 'destructive'
      })
    } finally {
      handleCloseQuickActionsModal()
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    const accepted = await confirm({
      title: 'Supprimer le produit',
      message: `Êtes-vous sûr de vouloir supprimer "${product.name}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return
    try {
      await SellerDashboardService.deleteSellerProduct(product.id, vendorId)
      await loadProducts()
      toast({ title: 'Produit supprimé', description: 'Le produit a été supprimé avec succès.' })
    } catch (err) {
      console.error('Erreur suppression produit', err)
      toast({
        title: 'Suppression impossible',
        description: 'Veuillez réessayer plus tard.',
        variant: 'destructive'
      })
    } finally {
      handleCloseQuickActionsModal()
    }
  }

  /**
   * Ouvre la modale avancée en mode création et notifie le parent si nécessaire.
   */
  const handleOpenCreateModal = () => {
    setAdvancedModalMode('create')
    setSelectedProductForEdit(null)
    setSelectedSharedProductForEdit(null)
    setIsAdvancedProductOpen(true)
  }

  /**
   * Ouvre la modale avancée en mode édition avec le produit sélectionné.
   */
  const handleOpenEditModal = async (product: Product) => {
    setAdvancedModalMode('edit')
    setSelectedProductForEdit(product)
    setIsLoading(true)
    try {
      const shared = await SellerDashboardApi.getProductById(product.id)
      setSelectedSharedProductForEdit(shared)
      setIsAdvancedProductOpen(true)
    } catch (error) {
      console.error('Erreur chargement produit complet (édition vendeur)', error)
      toast({
        title: 'Chargement impossible',
        description: 'Impossible de charger toutes les informations du produit pour édition.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Ferme la modale avancée et réinitialise l’état de sélection.
   */
  const handleCloseAdvancedModal = () => {
    setIsAdvancedProductOpen(false)
  }

  /**
   * Centralise la sauvegarde avancée (création ou mise à jour) depuis la modale.
   */
  const handleAdvancedModalSubmit = async (payload: SharedProductInput & { id?: string }) => {
    setIsLoading(true)
    try {
      if (advancedModalMode === 'create') {
        await SellerDashboardApi.createProduct({
          ...payload,
          vendorId,
          source: 'vendor'
        })
        toast({ title: 'Produit créé', description: 'Le produit a été créé avec succès.' })
      } else {
        const id = payload.id ?? selectedSharedProductForEdit?.id ?? selectedProductForEdit?.id
        if (!id) {
          throw new Error('Identifiant produit manquant pour la mise à jour.')
        }

        await SellerDashboardApi.updateProduct({
          ...payload,
          id,
          vendorId,
          source: 'vendor'
        })
        toast({ title: 'Produit mis à jour', description: 'Le produit a été modifié avec succès.' })
      }

      await loadProducts()
      handleCloseAdvancedModal()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde avancée du produit', error)
      toast({
        title: 'Sauvegarde impossible',
        description: "Une erreur est survenue lors de l'enregistrement du produit.",
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFeatured = async (product: Product) => {
    try {
      const updated = await SellerDashboardService.updateSellerProduct({
        id: product.id,
        vendorId,
        isFeatured: !product.featured,
        featured: !product.featured
      })
      if (!updated) {
        throw new Error('Le service n’a renvoyé aucune donnée après la mise à jour de la mise en avant.')
      }
      await loadProducts()
      toast({
        title: 'Produit mis à jour',
        description: !product.featured ? 'Le produit est en vedette.' : 'Le produit n’est plus en vedette.'
      })
    } catch (error) {
      console.error('Erreur mise en vedette produit', error)
      toast({
        title: 'Mise à jour impossible',
        description: 'Veuillez réessayer plus tard.',
        variant: 'destructive'
      })
    }
  }

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = await SellerDashboardService.updateSellerProduct({
        id: product.id,
        vendorId,
        status: newStatus
      })
      if (!updated) {
        throw new Error('Le service n’a renvoyé aucune donnée après la mise à jour du statut.')
      }
      await loadProducts()
      toast({
        title: 'Produit mis à jour',
        description: newStatus === 'active' ? 'Produit activé.' : 'Produit désactivé.'
      })
    } catch (error) {
      console.error('Erreur changement statut produit', error)
      toast({
        title: 'Mise à jour impossible',
        description: 'Veuillez réessayer plus tard.',
        variant: 'destructive'
      })
    }
  }

  // Fonction pour partager un produit
  const handleShareProduct = (product: Product) => {
    const shareData = {
      title: product.name,
      text: `Découvrez ${product.name} sur notre boutique !`,
      url: `${window.location.origin}/product/${product.id}`
    }
    
    if (navigator.share) {
      navigator.share(shareData)
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      navigator.clipboard.writeText(shareData.url)
      alert('Lien copié dans le presse-papiers !')
    }
  }

  // Fonction pour télécharger les données du produit
  const handleDownloadProductData = (product: Product) => {
    const dataStr = JSON.stringify(product, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Fonction pour générer un QR code (simulation)
  const handleGenerateQRCode = (product: Product) => {
    // Simulation de génération de QR code
    const qrData = `${window.location.origin}/product/${product.id}`
    alert(`QR Code généré pour : ${qrData}`)
  }

  // Filtrage et tri des produits
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
        const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus
        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'price':
            return a.price - b.price
          case 'sales':
            return b.sales - a.sales
          case 'revenue':
            return b.revenue - a.revenue
          case 'rating':
            return b.rating - a.rating
          case 'stock':
            return a.stock - b.stock
          default:
            return 0
        }
      })
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy])

  // Actions en lot
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete') => {
    if (selectedProducts.length === 0) return

    try {
      if (action === 'delete') {
        const accepted = await confirm({
          title: 'Suppression groupée',
          message: `Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produit(s) ?`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          tone: 'destructive'
        })
        if (!accepted) return
        await Promise.all(
          selectedProducts.map((productId) => SellerDashboardService.deleteSellerProduct(productId, vendorId))
        )
        toast({
          title: 'Produits supprimés',
          description: `${selectedProducts.length} produit(s) ont été supprimés.`
        })
      } else {
        const updates: UpdateSellerProductInput[] = selectedProducts.map((productId) => {
          switch (action) {
            case 'activate':
              return { id: productId, vendorId, status: 'active' }
            case 'deactivate':
              return { id: productId, vendorId, status: 'inactive' }
            case 'feature':
              return { id: productId, vendorId, isFeatured: true, featured: true }
            case 'unfeature':
              return { id: productId, vendorId, isFeatured: false, featured: false }
            default:
              return { id: productId, vendorId }
          }
        })

        await Promise.all(updates.map((payload) => SellerDashboardService.updateSellerProduct(payload)))

        const messages: Record<typeof action, string> = {
          activate: 'Les produits sélectionnés sont désormais actifs.',
          deactivate: 'Les produits sélectionnés sont désormais inactifs.',
          feature: 'Les produits sélectionnés sont mis en avant.',
          unfeature: 'Les produits sélectionnés ne sont plus en avant.'
        }

        toast({ title: 'Mise à jour effectuée', description: messages[action] })
      }

      await loadProducts()
    } catch (error) {
      console.error('Erreur action en lot produits vendeur', error)
      toast({
        title: 'Action impossible',
        description: 'Une erreur est survenue lors du traitement en lot.',
        variant: 'destructive'
      })
    } finally {
      setSelectedProducts([])
    }
  }

  // Statistiques
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    totalRevenue: products.reduce((sum, p) => sum + (p.revenue || 0), 0),
    averageRating:
      products.length > 0 ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length : 0,
    totalSales: products.reduce((sum, p) => sum + (p.sales || 0), 0)
  }

  const displayedAverageRating = dashboardAverageRating ?? stats.averageRating
  const displayedRevenueAllTime = dashboardRevenueAllTime ?? stats.totalRevenue
  const displayedRevenue30Days = dashboardRevenue30Days ?? null

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      )}

      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Produits</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Produits Actifs</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeProducts}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">CA Total</p>
                <p className="text-2xl font-bold text-orange-900">{formatMoney(displayedRevenueAllTime)}</p>
                <p className="text-xs text-orange-700">{convertToPoints(displayedRevenueAllTime)} points</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">CA 30 jours</p>
                <p className="text-2xl font-bold text-amber-900">
                  {formatMoney(displayedRevenue30Days ?? 0)}
                </p>
                <p className="text-xs text-amber-800">{convertToPoints(displayedRevenue30Days ?? 0)} points</p>
              </div>
              <BarChart3 className="h-8 w-8 text-amber-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Note Moyenne</p>
                <p className="text-2xl font-bold text-purple-900">{displayedAverageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'outils */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {catalogCategories
                    .filter((category) => category.is_active)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="out_of_stock">Rupture</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="sales">Ventes</SelectItem>
                  <SelectItem value="revenue">Revenus</SelectItem>
                  <SelectItem value="rating">Note</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? 'Liste' : 'Grille'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateModal}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Produit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions en lot */}
      {selectedProducts.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {selectedProducts.length} produit(s) sélectionné(s)
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  Activer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  Désactiver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('feature')}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  Mettre en avant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des produits */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(prev => [...prev, product.id])
                        } else {
                          setSelectedProducts(prev => prev.filter(id => id !== product.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <img
                      src={product.image || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-10 h-10 rounded-md object-cover border border-gray-200 bg-gray-50"
                      onError={(e) => {
                        const target = e.currentTarget
                        if (target.src.endsWith('/placeholder.jpg')) return
                        target.src = '/placeholder.jpg'
                      }}
                    />
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {product.name}
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status === 'active' ? 'Actif' : 
                       product.status === 'inactive' ? 'Inactif' :
                       product.status === 'draft' ? 'Brouillon' : 'Rupture'}
                    </Badge>
                    {product.featured && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        <Star className="h-3 w-3 mr-1" />
                        Vedette
                      </Badge>
                    )}
                    {product.onSale && (
                      <Badge variant="outline" className="border-red-500 text-red-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Promo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Prix et informations de base */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {product.salePrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-red-600">{formatPrice(product.salePrice)}</span>
                      <span className="text-lg text-gray-500 line-through">{formatPrice(product.price)}</span>
                      <Badge variant="outline" className="border-red-500 text-red-600">
                        -{Math.round((1 - product.salePrice / product.price) * 100)}%
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                  )}
                  <div className="text-sm text-gray-600">
                    {product.salePrice ? convertToPoints(product.salePrice) : convertToPoints(product.price)} points
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{product.rating}</span>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{product.stock}</div>
                  <div className="text-xs text-gray-500">En stock</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{product.sales}</div>
                  <div className="text-xs text-gray-500">Ventes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">{formatMoney(product.revenue ?? 0)}</div>
                  <div className="text-xs text-gray-500">Revenus</div>
                  <div className="text-xs text-purple-500">{convertToPoints(product.revenue ?? 0)} points</div>
                </div>
              </div>

              {/* Score SEO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Score SEO</span>
                  <span className="font-medium">{product.seoScore}/100</span>
                </div>
                <Progress value={product.seoScore} className="h-2" />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(product)}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProduct(product)}
                    className="border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-500 text-gray-600 hover:bg-gray-50"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => handleToggleFeatured(product)}>
                      <Star className="h-4 w-4 mr-2" />
                      {product.featured ? 'Retirer des vedettes' : 'Mettre en avant'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {product.status === 'active' ? 'Désactiver' : 'Activer'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => handleShareProduct(product)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleGenerateQRCode(product)}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Générer QR Code
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleDownloadProductData(product)}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger données
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => handleArchiveProduct(product)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archiver
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => handleDeleteProduct(product)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination et informations */}
      {filteredProducts.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500 mb-4">
              Aucun produit ne correspond à vos critères de recherche.
            </p>
            <Button onClick={handleOpenCreateModal} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Créer votre premier produit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Résumé des actions */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredProducts.length} produit(s) affiché(s) sur {products.length} total
            </span>
            <span>
              Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Modal de visualisation du produit */}
      <Dialog open={viewProductModal.open} onOpenChange={handleCloseViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {viewProductModal.product?.name}
            </DialogTitle>
          </DialogHeader>
          
          {viewProductModal.product && (
            <div className="space-y-6">
              {/* En-tête avec statut et badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={viewProductModal.product.status === 'active' ? 'default' : 'secondary'}>
                    {viewProductModal.product.status === 'active' ? 'Actif' : 
                     viewProductModal.product.status === 'inactive' ? 'Inactif' :
                     viewProductModal.product.status === 'draft' ? 'Brouillon' : 'Rupture'}
                  </Badge>
                  {viewProductModal.product.featured && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                      <Star className="h-3 w-3 mr-1" />
                      Vedette
                    </Badge>
                  )}
                  {viewProductModal.product.onSale && (
                    <Badge variant="outline" className="border-red-500 text-red-600">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Promo
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewProductModal.product && handleOpenEditModal(viewProductModal.product)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewProductModal.product && handleQuickActions(viewProductModal.product)}
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Actions
                  </Button>
                </div>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Prix et disponibilité</h3>
                    <div className="space-y-2">
                      {viewProductModal.product.salePrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-red-600">{formatPrice(viewProductModal.product.salePrice)}</span>
                          <span className="text-xl text-gray-500 line-through">{formatPrice(viewProductModal.product.price)}</span>
                          <Badge variant="outline" className="border-red-500 text-red-600">
                            -{Math.round((1 - viewProductModal.product.salePrice / viewProductModal.product.price) * 100)}%
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-gray-900">{formatPrice(viewProductModal.product.price)}</span>
                      )}
                      <div className="text-lg text-gray-600">
                        {viewProductModal.product.salePrice ? convertToPoints(viewProductModal.product.salePrice) : convertToPoints(viewProductModal.product.price)} points
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Stock: {viewProductModal.product.stock} unités</span>
                        <span>Catégorie: {viewProductModal.product.category}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{viewProductModal.product.sales}</div>
                        <div className="text-sm text-blue-600">Ventes</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatMoney(viewProductModal.product.revenue ?? 0)}</div>
                        <div className="text-sm text-green-600">Revenus</div>
                        <div className="text-xs text-green-500">{convertToPoints(viewProductModal.product.revenue ?? 0)} points</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Évaluations et SEO</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor((viewProductModal.product as any)?.rating ?? 0)
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-medium">{viewProductModal.product.rating}/5</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Score SEO</span>
                          <span className="font-medium">{viewProductModal.product.seoScore}/100</span>
                        </div>
                        <Progress value={viewProductModal.product.seoScore} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Engagement social</h3>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{viewProductModal.product.socialShares}</div>
                      <div className="text-sm text-purple-600">Partages sociaux</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations détaillées</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Date de création</span>
                    </div>
                    <p className="text-gray-600">
                      {new Date(viewProductModal.product.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Statistiques</span>
                    </div>
                    <p className="text-gray-600">
                      {viewProductModal.product.sales} ventes • {viewProductModal.product.stock} en stock
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-900">Performance</span>
                    </div>
                    <p className="text-gray-600">
                      Revenus: {formatMoney(viewProductModal.product.revenue ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => viewProductModal.product && handleShareProduct(viewProductModal.product)}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
                <Button
                  variant="outline"
                  onClick={() => viewProductModal.product && handleGenerateQRCode(viewProductModal.product)}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => viewProductModal.product && handleDownloadProductData(viewProductModal.product)}
                  className="border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'actions rapides */}
      <Dialog open={quickActionsModal.open} onOpenChange={handleCloseQuickActionsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Actions rapides
            </DialogTitle>
          </DialogHeader>
          
          {quickActionsModal.product && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{quickActionsModal.product.name}</h4>
                <p className="text-sm text-gray-600">
                  Sélectionnez une action à effectuer sur ce produit
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => quickActionsModal.product && handleToggleFeatured(quickActionsModal.product)}
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                >
                  <Star className="h-4 w-4 mr-2" />
                  {quickActionsModal.product.featured ? 'Retirer' : 'Vedette'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => quickActionsModal.product && handleToggleStatus(quickActionsModal.product)}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {quickActionsModal.product.status === 'active' ? 'Désactiver' : 'Activer'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => quickActionsModal.product && handleDuplicateProduct(quickActionsModal.product)}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => quickActionsModal.product && handleShareProduct(quickActionsModal.product)}
                  className="border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => quickActionsModal.product && handleArchiveProduct(quickActionsModal.product)}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => quickActionsModal.product && handleDeleteProduct(quickActionsModal.product)}
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => quickActionsModal.product && handleOpenEditModal(quickActionsModal.product)}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le produit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProductCategoryProvider eager>
        <AdvancedProductModal
          isOpen={isAdvancedProductOpen}
          onClose={handleCloseAdvancedModal}
          product={selectedSharedProductForEdit ?? undefined}
          mode={advancedModalMode}
          onSubmit={handleAdvancedModalSubmit}
        />
      </ProductCategoryProvider>
    </div>
  )
}
