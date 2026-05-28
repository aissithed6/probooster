"use client"

import { useState, useEffect } from 'react'
import { 
  Package, Plus, Search, Filter, MoreHorizontal, 
  Eye, Edit, Trash2, Star, Heart, Share2,
  ShoppingCart, TrendingUp, AlertTriangle, CheckCircle,
  Clock, MapPin, DollarSign, Tag, Image, Settings
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

// Import du modal de création de produit existant
import AdvancedProductModal from '@/components/seller-dashboard/advanced-product-modal'

interface Product {
  id: string
  name: string
  description: string
  price: number
  salePrice: number
  costPrice: number
  category: string
  subcategory: string
  brand: string
  vendor: string
  status: 'active' | 'inactive' | 'draft' | 'pending' | 'reported'
  stock: number
  stockAlert: number
  rating: number
  totalSales: number
  totalRevenue: number
  featured: boolean
  images: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  seoScore: number
  socialShares: number
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    // Simulation du chargement des produits
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'iPhone 15 Pro Max',
        description: 'Le dernier iPhone avec des fonctionnalités avancées',
        price: 850000,
        salePrice: 800000,
        costPrice: 700000,
        category: 'Électronique',
        subcategory: 'Smartphones',
        brand: 'Apple',
        vendor: 'TechStore Pro',
        status: 'active',
        stock: 25,
        stockAlert: 5,
        rating: 4.8,
        totalSales: 156,
        totalRevenue: 124800000,
        featured: true,
        images: ['/iphone15.jpg'],
        tags: ['smartphone', 'apple', '5G', 'camera'],
        createdAt: '2024-09-15',
        updatedAt: '2024-12-19',
        seoScore: 92,
        socialShares: 1250
      },
      {
        id: '2',
        name: 'Samsung Galaxy S24',
        description: 'Flagship Android avec IA intégrée',
        price: 750000,
        salePrice: 0,
        costPrice: 600000,
        category: 'Électronique',
        subcategory: 'Smartphones',
        brand: 'Samsung',
        vendor: 'Electronics Plus',
        status: 'active',
        stock: 18,
        stockAlert: 3,
        rating: 4.6,
        totalSales: 89,
        totalRevenue: 66750000,
        featured: false,
        images: ['/galaxy-s24.jpg'],
        tags: ['smartphone', 'samsung', 'AI', '5G'],
        createdAt: '2024-10-20',
        updatedAt: '2024-12-18',
        seoScore: 88,
        socialShares: 890
      },
      {
        id: '3',
        name: 'MacBook Air M2',
        description: 'Ordinateur portable ultra-léger et performant',
        price: 1200000,
        salePrice: 1100000,
        costPrice: 950000,
        category: 'Informatique',
        subcategory: 'Ordinateurs portables',
        brand: 'Apple',
        vendor: 'TechStore Pro',
        status: 'active',
        stock: 12,
        stockAlert: 2,
        rating: 4.9,
        totalSales: 67,
        totalRevenue: 73700000,
        featured: true,
        images: ['/macbook-air.jpg'],
        tags: ['laptop', 'apple', 'M2', 'ultrabook'],
        createdAt: '2024-08-10',
        updatedAt: '2024-12-17',
        seoScore: 95,
        socialShares: 2100
      }
    ]

    setProducts(mockProducts)
    setFilteredProducts(mockProducts)
  }, [])

  // Filtrage des produits
  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    if (vendorFilter !== 'all') {
      filtered = filtered.filter(product => product.vendor === vendorFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, statusFilter, categoryFilter, vendorFilter])

  const handleCreateProduct = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(products.filter(product => product.id !== productId))
    }
  }

  const handleStatusChange = (productId: string, newStatus: Product['status']) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, status: newStatus } : product
    ))
  }

  const handleToggleFeatured = (productId: string) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, featured: !product.featured } : product
    ))
  }

  const exportProducts = () => {
    console.log('Export des produits')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactif</Badge>
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Brouillon</Badge>
      case 'pending': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En attente</Badge>
      case 'reported': return <Badge className="bg-red-100 text-red-800 border-red-200">Signalé</Badge>
      default: return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la gestion des produits */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
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
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer Produit
            </Button>
            <Button variant="outline" onClick={exportProducts}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Exporter
            </Button>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                <SelectItem value="Électronique">Électronique</SelectItem>
                <SelectItem value="Informatique">Informatique</SelectItem>
                <SelectItem value="Mode">Mode</SelectItem>
                <SelectItem value="Maison">Maison</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Vendeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les vendeurs</SelectItem>
                <SelectItem value="TechStore Pro">TechStore Pro</SelectItem>
                <SelectItem value="Electronics Plus">Electronics Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Tous ({filteredProducts.length})</TabsTrigger>
          <TabsTrigger value="active">Actifs</TabsTrigger>
          <TabsTrigger value="pending">En Attente</TabsTrigger>
          <TabsTrigger value="reported">Signalés</TabsTrigger>
          <TabsTrigger value="featured">Vedettes</TabsTrigger>
          <TabsTrigger value="low-stock">Stock Faible</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
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
          />
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
          />
        </TabsContent>
      </Tabs>

      {/* Modal de création de produit */}
      {isCreateModalOpen && (
        <AdvancedProductModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          product={null}
        />
      )}

      {/* Modal d'édition de produit */}
      {isEditModalOpen && selectedProduct && (
        <AdvancedProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          mode="edit"
          product={selectedProduct}
        />
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
                        <span className="text-sm">{selectedProduct.vendor}</span>
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
                        {selectedProduct.salePrice > 0 && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            {formatPrice(selectedProduct.salePrice)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Stock: {selectedProduct.stock} unités</span>
                        {selectedProduct.stock <= selectedProduct.stockAlert && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
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
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={() => {
                  setIsViewModalOpen(false)
                  handleEditProduct(selectedProduct)
                }}>
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
}

function ProductList({ products, onEdit, onDelete, onStatusChange, onToggleFeatured, onView }: ProductListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactif</Badge>
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
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-semibold">
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    {getStatusBadge(product.status)}
                    {product.featured && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        Vedette
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{product.brand}</span>
                                         <span>{product.category} {'>'}{' '}{product.subcategory}</span>
                    <span>{product.vendor}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{formatPrice(product.price)}</span>
                    {product.salePrice > 0 && (
                      <span className="text-red-600 font-medium">
                        {formatPrice(product.salePrice)}
                      </span>
                    )}
                    <span>Stock: {product.stock}</span>
                    <span>Note: {product.rating}/5</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onView(product)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onToggleFeatured(product.id)}
                  className={product.featured ? 'bg-orange-50 border-orange-300 text-orange-700' : ''}
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(product.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
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
