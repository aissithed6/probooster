'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, MessageCircle, X, Star, MapPin, ShoppingBag, Clock, Filter, TrendingUp } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context'

interface GlobalSearchWithChatProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  showFilters?: boolean
}

interface SearchResult {
  id: string
  type: 'product' | 'seller' | 'category' | 'brand'
  name: string
  description: string
  image?: string
  price?: string
  rating?: number
  location?: string
  isOnline?: boolean
  totalProducts?: number
  responseTime?: string
  specialty?: string
  category?: string
  brand?: string
  inStock?: boolean
  discount?: number
}

export const GlobalSearchWithChat: React.FC<GlobalSearchWithChatProps> = ({
  placeholder = "Rechercher des produits, vendeurs, catégories...",
  className = "",
  onSearch,
  showFilters = true
}) => {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const { createChatSession, openChatSession } = useChatContext()

  // Filtres disponibles
  const availableFilters = [
    { id: 'products', label: 'Produits', icon: ShoppingBag },
    { id: 'sellers', label: 'Vendeurs', icon: MessageCircle },
    { id: 'categories', label: 'Catégories', icon: Filter },
    { id: 'brands', label: 'Marques', icon: Star }
  ]

  // Simuler des résultats de recherche
  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true)
      
      // Simuler un délai de recherche
      setTimeout(() => {
        const mockResults: SearchResult[] = [
          // Vendeurs
          {
            id: 'seller-1',
            type: 'seller',
            name: 'TechStore Pro',
            description: 'Vendeur spécialisé en électronique et informatique',
            image: '/vendor-avatar.png',
            rating: 4.8,
            location: 'Abomey-Calavi, Bénin',
            isOnline: true,
            totalProducts: 156,
            responseTime: '2-4h',
            specialty: 'Électronique & Informatique'
          },
          {
            id: 'seller-2',
            type: 'seller',
            name: 'Fashion World',
            description: 'Boutique de mode et accessoires tendance',
            image: '/vendor-avatar.png',
            rating: 4.6,
            location: 'Cotonou, Bénin',
            isOnline: true,
            totalProducts: 89,
            responseTime: '1-3h',
            specialty: 'Mode & Accessoires'
          },
          // Produits
          {
            id: 'product-1',
            type: 'product',
            name: 'Laptop Gaming Ultra Pro',
            description: 'Ordinateur portable gaming haute performance avec RTX 4060',
            image: '/product-image.png',
            price: '450 000 F CFA',
            rating: 4.9,
            category: 'Électronique',
            brand: 'GamingTech',
            inStock: true,
            discount: 15
          },
          {
            id: 'product-2',
            type: 'product',
            name: 'Smartphone Galaxy S24',
            description: 'Smartphone Android dernier cri avec IA intégrée',
            image: '/product-image.png',
            price: '280 000 F CFA',
            rating: 4.7,
            category: 'Électronique',
            brand: 'Samsung',
            inStock: true,
            discount: 0
          },
          // Catégories
          {
            id: 'category-1',
            type: 'category',
            name: 'Électronique & Informatique',
            description: 'Ordinateurs, smartphones, accessoires et plus',
            image: '/category-image.png',
            totalProducts: 1247
          },
          {
            id: 'category-2',
            type: 'category',
            name: 'Mode & Accessoires',
            description: 'Vêtements, chaussures, bijoux et accessoires',
            image: '/category-image.png',
            totalProducts: 892
          }
        ]

        // Filtrer selon les filtres actifs
        let filteredResults = mockResults
        if (activeFilters.length > 0) {
          filteredResults = mockResults.filter(result => 
            activeFilters.includes(result.type)
          )
        }

        // Filtrer selon la recherche
        filteredResults = filteredResults.filter(result =>
          result.name.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase()) ||
          (result.specialty && result.specialty.toLowerCase().includes(query.toLowerCase())) ||
          (result.category && result.category.toLowerCase().includes(query.toLowerCase())) ||
          (result.brand && result.brand.toLowerCase().includes(query.toLowerCase()))
        )

        setSearchResults(filteredResults)
        setShowResults(true)
        setIsLoading(false)
      }, 500)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [query, activeFilters])

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query)
    }
    setShowResults(false)
  }

  const handleStartChat = (sellerId: string, sellerName: string) => {
    const sessionId = createChatSession(sellerId, sellerName, '/vendor-avatar.png')
    openChatSession(sessionId)
    setShowResults(false)
    setQuery('')
  }

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'seller':
        return <MessageCircle className="w-4 h-4 text-orange-600" />
      case 'product':
        return <ShoppingBag className="w-4 h-4 text-blue-600" />
      case 'category':
        return <Filter className="w-4 h-4 text-green-600" />
      case 'brand':
        return <Star className="w-4 h-4 text-purple-600" />
      default:
        return <Search className="w-4 h-4 text-gray-600" />
    }
  }

  const getResultBadgeColor = (type: string) => {
    switch (type) {
      case 'seller':
        return 'bg-orange-100 text-orange-800'
      case 'product':
        return 'bg-blue-100 text-blue-800'
      case 'category':
        return 'bg-green-100 text-green-800'
      case 'brand':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Barre de recherche principale */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-4 py-3 bg-white border-gray-200 focus:border-orange-300 focus:ring-orange-200 transition-all duration-200 text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {availableFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilters.includes(filter.id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(filter.id)}
              className={`text-xs ${
                activeFilters.includes(filter.id)
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <filter.icon className="w-3 h-3 mr-1" />
              {filter.label}
            </Button>
          ))}
        </div>
      )}

      {/* Résultats de recherche */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                {isLoading ? 'Recherche en cours...' : `${searchResults.length} résultat(s) trouvé(s)`}
              </h4>
              {activeFilters.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Filtres:</span>
                  {activeFilters.map(filterId => (
                    <Badge key={filterId} variant="secondary" className="text-xs">
                      {availableFilters.find(f => f.id === filterId)?.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Recherche en cours...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucun résultat trouvé</p>
              <p className="text-gray-400 text-xs mt-1">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {searchResults.map((result) => (
                <div key={result.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start space-x-3">
                    {/* Icône du type */}
                    <div className="flex-shrink-0 mt-1">
                      {getResultIcon(result.type)}
                    </div>

                    {/* Contenu principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-gray-900 text-sm">{result.name}</h5>
                          <Badge className={`text-xs ${getResultBadgeColor(result.type)}`}>
                            {result.type === 'seller' ? 'Vendeur' : 
                             result.type === 'product' ? 'Produit' : 
                             result.type === 'category' ? 'Catégorie' : 'Marque'}
                          </Badge>
                        </div>
                        {result.rating && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span>{result.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                      
                      {/* Informations spécifiques selon le type */}
                      {result.type === 'seller' && (
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{result.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ShoppingBag className="w-3 h-3" />
                            <span>{result.totalProducts} produits</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{result.responseTime}</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${
                            result.isOnline ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              result.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span>{result.isOnline ? 'En ligne' : 'Hors ligne'}</span>
                          </div>
                        </div>
                      )}
                      
                      {result.type === 'product' && (
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="font-medium text-orange-600">{result.price}</span>
                          {result.discount > 0 && (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                              -{result.discount}%
                            </Badge>
                          )}
                          <span>{result.category}</span>
                          <span>{result.brand}</span>
                          <span className={`${result.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {result.inStock ? 'En stock' : 'Rupture'}
                          </span>
                        </div>
                      )}
                      
                      {result.type === 'category' && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{result.totalProducts} produits disponibles</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      {result.type === 'seller' ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartChat(result.id, result.name)}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                      ) : result.type === 'product' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartChat('seller-id', 'Vendeur du produit')}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Demander
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          Voir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
