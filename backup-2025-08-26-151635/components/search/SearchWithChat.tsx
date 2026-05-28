'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MessageCircle, X } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context'

interface SearchWithChatProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

export const SearchWithChat: React.FC<SearchWithChatProps> = ({
  placeholder = "Rechercher des produits, vendeurs...",
  className = "",
  onSearch
}) => {
  const [query, setQuery] = useState('')
  const [showChatSuggestions, setShowChatSuggestions] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const { createChatSession, openChatSession } = useChatContext()

  // Simuler des résultats de recherche
  useEffect(() => {
    if (query.trim()) {
      // Simuler des résultats de recherche
      const mockResults = [
        {
          id: 'seller-1',
          type: 'seller',
          name: 'TechStore Pro',
          description: 'Vendeur spécialisé en électronique',
          rating: 4.8,
          isOnline: true
        },
        {
          id: 'product-1',
          type: 'product',
          name: 'Laptop Gaming Ultra',
          description: 'Ordinateur portable gaming haute performance',
          price: '450 000 F CFA',
          seller: 'TechStore Pro'
        }
      ]
      setSearchResults(mockResults)
      setShowChatSuggestions(true)
    } else {
      setSearchResults([])
      setShowChatSuggestions(false)
    }
  }, [query])

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query)
    }
    setShowChatSuggestions(false)
  }

  const handleStartChat = (sellerId: string, sellerName: string) => {
    const sessionId = createChatSession(sellerId, sellerName, '/vendor-avatar.png')
    openChatSession(sessionId)
    setShowChatSuggestions(false)
    setQuery('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-4 py-2 bg-white border-gray-200 focus:border-orange-300 focus:ring-orange-200 transition-all duration-200"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Suggestions de recherche avec chat */}
      {showChatSuggestions && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-900">Résultats de recherche</h4>
          </div>
          
          <div className="divide-y divide-gray-100">
            {searchResults.map((result) => (
              <div key={result.id} className="p-3 hover:bg-gray-50 transition-colors duration-200">
                {result.type === 'seller' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-orange-700">
                          {result.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{result.name}</h5>
                        <p className="text-sm text-gray-600">{result.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">★ {result.rating}</span>
                          <span className={`text-xs ${result.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                            {result.isOnline ? 'En ligne' : 'Hors ligne'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartChat(result.id, result.name)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">P</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{result.name}</h5>
                        <p className="text-sm text-gray-600">{result.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {result.price} • Vendeur: {result.seller}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartChat('seller-id', result.seller)}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Demander
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
