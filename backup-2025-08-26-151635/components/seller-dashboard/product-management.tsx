"use client"

import { useState, useEffect } from 'react'
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
import { formatPrice, convertToPoints, formatPoints, formatSalePrice } from '@/lib/currency-utils'

interface Product {
  id: number
  name: string
  price: number
  salePrice?: number
  category: string
  stock: number
  sales: number
  revenue: number
  rating: number
  status: 'active' | 'inactive' | 'draft' | 'out_of_stock'
  featured: boolean
  onSale: boolean
  seoScore: number
  socialShares: number
  createdAt: string
}

interface ProductManagementProps {
  onCreateProduct: () => void
  onEditProduct: (product: Product) => void
}

export default function ProductManagement({ onCreateProduct, onEditProduct }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "iPhone 15 Pro Max",
      price: 129900,
      salePrice: 119900,
      category: "Électronique",
      stock: 25,
      sales: 150,
      revenue: 17985000,
      rating: 4.8,
      status: "active",
      featured: true,
      onSale: true,
      seoScore: 92,
      socialShares: 1250,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      name: "MacBook Air M2",
      price: 119900,
      category: "Électronique",
      stock: 18,
      sales: 89,
      revenue: 10661100,
      rating: 4.9,
      status: "active",
      featured: true,
      onSale: false,
      seoScore: 88,
      socialShares: 890,
      createdAt: "2024-01-10"
    },
    {
      id: 3,
      name: "AirPods Pro",
      price: 24900,
      salePrice: 19900,
      category: "Électronique",
      stock: 0,
      sales: 320,
      revenue: 6368000,
      rating: 4.7,
      status: "out_of_stock",
      featured: false,
      onSale: true,
      seoScore: 85,
      socialShares: 650,
      createdAt: "2024-01-05"
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])

  // États pour les modals
  const [viewProductModal, setViewProductModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null
  })
  const [quickActionsModal, setQuickActionsModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null
  })

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
  const handleDuplicateProduct = (product: Product) => {
    const duplicatedProduct: Product = {
      ...product,
      id: Date.now(),
      name: `${product.name} (Copie)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      sales: 0,
      revenue: 0,
      stock: 0
    }
    
    setProducts(prev => [...prev, duplicatedProduct])
    handleCloseQuickActionsModal()
    
    // Notification de succès
    alert('Produit dupliqué avec succès !')
  }

  // Fonction pour archiver un produit
  const handleArchiveProduct = (product: Product) => {
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, status: 'inactive' } : p
    ))
    handleCloseQuickActionsModal()
    
    // Notification de succès
    alert('Produit archivé avec succès !')
  }

  // Fonction pour supprimer un produit
  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      setProducts(prev => prev.filter(p => p.id !== product.id))
      handleCloseQuickActionsModal()
      
      // Notification de succès
      alert('Produit supprimé avec succès !')
    }
  }

  // Fonction pour mettre en avant un produit
  const handleToggleFeatured = (product: Product) => {
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, featured: !p.featured } : p
    ))
    
    // Notification de succès
    alert(`Produit ${!product.featured ? 'mis en avant' : 'retiré des vedettes'} avec succès !`)
  }

  // Fonction pour activer/désactiver un produit
  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, status: newStatus } : p
    ))
    
    // Notification de succès
    alert(`Produit ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès !`)
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
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus
      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'price': return a.price - b.price
        case 'sales': return b.sales - a.sales
        case 'revenue': return b.revenue - a.revenue
        case 'rating': return b.rating - a.rating
        case 'stock': return a.stock - b.stock
        default: return 0
      }
    })

  // Actions en lot
  const handleBulkAction = (action: string) => {
    if (selectedProducts.length === 0) return

    switch (action) {
      case 'activate':
        setProducts(prev => prev.map(p => 
          selectedProducts.includes(p.id) ? { ...p, status: 'active' as const } : p
        ))
        break
      case 'deactivate':
        setProducts(prev => prev.map(p => 
          selectedProducts.includes(p.id) ? { ...p, status: 'inactive' as const } : p
        ))
        break
      case 'feature':
        setProducts(prev => prev.map(p => 
          selectedProducts.includes(p.id) ? { ...p, featured: true } : p
        ))
        break
      case 'unfeature':
        setProducts(prev => prev.map(p => 
          selectedProducts.includes(p.id) ? { ...p, featured: false } : p
        ))
        break
      case 'delete':
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produit(s) ?`)) {
          setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)))
        }
        break
    }
    setSelectedProducts([])
  }

  // Statistiques
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
    totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
    averageRating: products.reduce((sum, p) => sum + p.rating, 0) / products.length,
    totalSales: products.reduce((sum, p) => sum + p.sales, 0)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-sm font-medium text-orange-600">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-orange-900">{formatPrice(stats.totalRevenue)}</p>
                <p className="text-xs text-orange-700">{convertToPoints(stats.totalRevenue)} points</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Note Moyenne</p>
                <p className="text-2xl font-bold text-purple-900">{stats.averageRating.toFixed(1)}</p>
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
                  <SelectItem value="Électronique">Électronique</SelectItem>
                  <SelectItem value="Mode">Mode</SelectItem>
                  <SelectItem value="Maison">Maison</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
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
                onClick={onCreateProduct}
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
                  <div className="text-lg font-bold text-purple-600">{formatPrice(product.revenue)}</div>
                  <div className="text-xs text-gray-500">Revenus</div>
                  <div className="text-xs text-purple-500">{convertToPoints(product.revenue)} points</div>
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
                    onClick={() => onEditProduct(product)}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
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
            <Button onClick={onCreateProduct} className="bg-gradient-to-r from-blue-600 to-purple-600">
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
                    onClick={() => viewProductModal.product && onEditProduct(viewProductModal.product)}
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
                        <div className="text-2xl font-bold text-green-600">{formatPrice(viewProductModal.product.revenue)}</div>
                        <div className="text-sm text-green-600">Revenus</div>
                        <div className="text-xs text-green-500">{convertToPoints(viewProductModal.product.revenue)} points</div>
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
                                i < Math.floor(viewProductModal.product.rating)
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
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Performance</span>
                    </div>
                    <p className="text-gray-600">
                      Revenus: {formatPrice(viewProductModal.product.revenue)}
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
                  onClick={() => quickActionsModal.product && onEditProduct(quickActionsModal.product)}
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
    </div>
  )
}
