"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Star, 
  Eye, 
  Edit, 
  Trash2, 
  Share2,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  Heart,
  Image as ImageIcon,
  Tag
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'
import { Tables } from '@/lib/supabase'

interface SyncedShopProductsProps {
  data: DashboardData | null
  isLoading: boolean
  onRefresh: () => void
}

export function SyncedShopProducts({ data, isLoading, onRefresh }: SyncedShopProductsProps) {
  const [selectedProduct, setSelectedProduct] = useState<Tables<'user_products'> | null>(null)

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    ) : (
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    )
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Actif' : 'Inactif'
  }

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-gray-100 text-gray-800 border-gray-200'
    
    switch (category.toLowerCase()) {
      case 'electronics':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'clothing':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'home':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'beauty':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'sports':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRatingStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
          }`}
        />
      )
    }
    return stars
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produits de Boutique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produits de Boutique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucun produit</p>
            <p className="text-sm">Commencez par ajouter vos premiers produits</p>
            <Button className="mt-4">
              <Package className="w-4 h-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeProducts = data.products.filter(p => p.is_active)
  const inactiveProducts = data.products.filter(p => !p.is_active)
  const totalRevenue = data.products.reduce((sum, p) => sum + (p.total_revenue || 0), 0)
  const totalSales = data.products.reduce((sum, p) => sum + (p.total_sales || 0), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produits de Boutique ({data.products.length})
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="h-8 px-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Résumé des statistiques */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Chiffre d'affaires</span>
            </div>
            <div className="text-lg font-bold text-blue-700 mt-1">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">Ventes totales</span>
            </div>
            <div className="text-lg font-bold text-green-700 mt-1">
              {totalSales.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filtres rapides */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="cursor-pointer">
            Tous ({data.products.length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            Actifs ({activeProducts.length})
          </Badge>
          <Badge variant="outline" className="cursor-pointer">
            Inactifs ({inactiveProducts.length})
          </Badge>
        </div>

        <div className="space-y-4">
          {data.products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex items-start gap-4">
                {/* Image du produit */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {product.description || 'Aucune description'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(product.is_active)}>
                        {getStatusIcon(product.is_active)}
                        <span className="ml-1">{getStatusText(product.is_active)}</span>
                      </Badge>
                      
                      {product.category && (
                        <Badge className={getCategoryColor(product.category)}>
                          {product.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(product.price)}
                      </div>
                      <p className="text-xs text-gray-500">Prix</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {product.stock_quantity}
                      </div>
                      <p className="text-xs text-gray-500">Stock</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {product.total_sales || 0}
                      </div>
                      <p className="text-xs text-gray-500">Ventes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {product.category || 'Non catégorisé'}
                      </span>
                      
                      {product.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <div className="flex">
                            {getRatingStars(product.rating)}
                          </div>
                          <span>({product.total_reviews || 0})</span>
                        </span>
                      )}
                      
                      <span>
                        Créé le {formatDate(product.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Logique pour voir les détails
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Logique pour éditer
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Éditer
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Logique pour partager
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Partager
                      </Button>
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {product.is_featured && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Star className="w-3 h-3" />
                          Mis en avant
                        </span>
                      )}
                      
                      {product.is_shareable && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Share2 className="w-3 h-3" />
                          Partageable
                        </span>
                      )}
                      
                      {product.total_shares > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Share2 className="w-3 h-3" />
                          {product.total_shares} partage{product.total_shares > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Gestion des produits</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Gérez vos produits, suivez leurs performances et optimisez vos ventes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
