'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Bug, X, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * Panneau de debug pour diagnostiquer les problèmes du chat
 */
export const ChatDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [chatContextStatus, setChatContextStatus] = useState<string>('Vérification...')

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testChatEvent = () => {
    addLog('🔍 Test du bouton chat...')
    
    try {
      // Vérifier si window est disponible
      if (typeof window === 'undefined') {
        addLog('❌ Window non disponible (SSR)')
        return
      }

      // Vérifier si CustomEvent est disponible
      if (typeof CustomEvent === 'undefined') {
        addLog('❌ CustomEvent non disponible')
        return
      }

      // Créer l'événement de test
      const event = new CustomEvent('openGlobalChat', {
        detail: {
          sellerId: 'test-seller-123',
          sellerName: 'Vendeur Test',
          sellerAvatar: '/placeholder-user.jpg',
          product: {
            id: 'test-product-123',
            name: 'Produit Test',
            price: 99.99,
            image: '/placeholder-product.jpg',
            seller: 'Vendeur Test'
          }
        }
      })
      
      addLog('📡 Événement créé avec succès')
      
      // Vérifier si l'événement a les bonnes propriétés
      addLog(`📋 Détails de l'événement: ${JSON.stringify(event.detail, null, 2)}`)
      
      // Déclencher l'événement
      window.dispatchEvent(event)
      
      addLog('✅ Événement déclenché !')
      
      // Vérifier si l'événement a été écouté
      setTimeout(() => {
        addLog('⏰ Vérification après 1 seconde...')
        // Ici on pourrait vérifier si le chat s'est ouvert
      }, 1000)
      
    } catch (error) {
      addLog(`❌ Erreur lors du test: ${error}`)
    }
  }

  const testProductCardChat = () => {
    addLog('🛍️ Test du bouton chat carte produit...')
    
    // Simuler un clic sur le bouton chat d'une carte produit
    const event = new CustomEvent('openGlobalChat', {
      detail: {
        sellerId: 'seller-123',
        sellerName: 'Vendeur Probooster',
        sellerAvatar: '/placeholder-user.jpg',
        product: {
          id: '123',
          name: 'iPhone 15 Pro',
          price: 1299.99,
          image: '/placeholder-product.jpg',
          seller: 'Vendeur Probooster'
        }
      }
    })
    
    window.dispatchEvent(event)
    addLog('✅ Événement carte produit déclenché !')
  }

  const testModalChat = () => {
    addLog('📱 Test du bouton chat modal produit...')
    
    // Simuler un clic sur le bouton chat du modal
    const event = new CustomEvent('openGlobalChat', {
      detail: {
        sellerId: 'seller-456',
        sellerName: 'Vendeur Premium',
        sellerAvatar: '/placeholder-user.jpg',
        product: {
          id: '456',
          name: 'MacBook Pro M3',
          price: 2499.99,
          image: '/placeholder-product.jpg',
          seller: 'Vendeur Premium'
        }
      }
    })
    
    window.dispatchEvent(event)
    addLog('✅ Événement modal produit déclenché !')
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    // Vérifier le statut du contexte de chat
    const checkChatContext = () => {
      try {
        if (typeof window !== 'undefined') {
          // Vérifier si le contexte est disponible
          if (window.React) {
            setChatContextStatus('✅ Contexte React disponible')
          } else {
            setChatContextStatus('❌ Contexte React non disponible')
          }
        }
      } catch (error) {
        setChatContextStatus(`❌ Erreur: ${error}`)
      }
    }

    checkChatContext()
  }, [])

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
          size="sm"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug Chat
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl">
      {/* En-tête */}
      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-t-lg">
        <h3 className="font-semibold text-gray-800">Debug Chat</h3>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Statut du contexte */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {chatContextStatus.includes('✅') ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-gray-700">{chatContextStatus}</span>
        </div>
      </div>

      {/* Boutons de test */}
      <div className="p-3 border-b border-gray-200 space-y-2">
        <Button
          onClick={testChatEvent}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Test Chat Général
        </Button>
        
        <Button
          onClick={testProductCardChat}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Test Carte Produit
        </Button>
        
        <Button
          onClick={testModalChat}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white"
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Test Modal Produit
        </Button>
      </div>

      {/* Logs */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-700">Logs</h4>
          <Button
            onClick={clearLogs}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Effacer
          </Button>
        </div>
        
        <div className="max-h-48 overflow-y-auto bg-gray-50 rounded p-2 text-xs font-mono">
          {logs.length === 0 ? (
            <p className="text-gray-500">Aucun log pour le moment...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 text-gray-700">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
