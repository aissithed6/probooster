"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Send, Users, Phone, Mail, Clock, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HeaderChat() {
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatStatus, setChatStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [isClient, setIsClient] = useState(false)

  // Fonction utilitaire pour localStorage sécurisé
  const safeLocalStorage = {
    getItem: (key: string, defaultValue: string = '') => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key) || defaultValue
      }
      return defaultValue
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
      }
    }
  }

  // Initialisation
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleChatOpen = () => {
    setShowChatModal(true)
    setChatStatus('connecting')
    
    // Simuler la connexion au chat
    setTimeout(() => {
      setChatStatus('connected')
      
      setChatMessages([
        {
          id: Date.now(),
          type: 'admin',
          message: '👋 Bonjour ! Je suis l\'équipe support de Probooster. Comment puis-je vous aider aujourd\'hui ?',
          timestamp: new Date().toISOString(),
          sender: 'Support Probooster'
        }
      ])
    }, 1500)
  }

  const handleChatMessageSubmit = () => {
    if (!chatMessage.trim()) {
      alert('⚠️ Veuillez saisir un message pour démarrer le chat.')
      return
    }

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatMessage,
      timestamp: new Date().toISOString(),
      sender: 'Vous'
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatMessage('')
    setIsTyping(true)

    // Simuler la réponse de l'administrateur
    setTimeout(() => {
      setIsTyping(false)
      
      const adminResponse = {
        id: Date.now() + 1,
        type: 'admin',
        message: `Merci pour votre message "${userMessage.message}". Un agent de notre équipe va vous répondre dans les plus brefs délais. En attendant, pouvez-vous me donner plus de détails sur votre problème ?`,
        timestamp: new Date().toISOString(),
        sender: 'Support Probooster'
      }

      setChatMessages(prev => [...prev, adminResponse])

      // Sauvegarder la conversation pour l'administrateur
      const chatSession = {
        id: Date.now(),
        messages: [...chatMessages, userMessage, adminResponse],
        startTime: new Date().toISOString(),
        status: 'En cours',
        userAgent: navigator.userAgent,
        userId: 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase()
      }

      const existingSessions = JSON.parse(safeLocalStorage.getItem('adminChatSessions', '[]'))
      existingSessions.push(chatSession)
      safeLocalStorage.setItem('adminChatSessions', JSON.stringify(existingSessions))
    }, 2000)
  }

  const handleQuickResponse = (response: string) => {
    setChatMessage(response)
    setTimeout(() => handleChatMessageSubmit(), 100)
  }

  const quickResponses = [
    "J'ai un problème avec ma commande",
    "Comment suivre ma livraison ?",
    "Je veux annuler ma commande",
    "Problème de paiement",
    "Autre question"
  ]

  if (!isClient) {
    return null
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Chat Button */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
            onClick={handleChatOpen}
          >
            <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <span>Chat Support</span>
              <div className={`ml-auto w-2 h-2 rounded-full ${
                chatStatus === 'connected' ? 'bg-green-500' :
                chatStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
            </DialogTitle>
            <DialogDescription>
              {chatStatus === 'connected' ? 'Connecté - Un agent vous répondra' :
               chatStatus === 'connecting' ? 'Connexion en cours...' :
               'Déconnecté'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col space-y-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-[#ff6600] text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <div className="text-xs opacity-75 mb-1">{message.sender}</div>
                    <div>{message.message}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border border-gray-200 px-3 py-2 rounded-lg">
                    <div className="text-xs opacity-75 mb-1">Support Probooster</div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Réponses rapides */}
            {chatStatus === 'connected' && chatMessages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Réponses rapides :</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickResponses.map((response, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickResponse(response)}
                      className="text-xs"
                    >
                      {response}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Tapez votre message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatMessageSubmit()}
                disabled={chatStatus !== 'connected'}
              />
              <Button 
                onClick={handleChatMessageSubmit}
                disabled={chatStatus !== 'connected' || !chatMessage.trim()}
                className="bg-[#ff6600] hover:bg-[#e55a00]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Informations de support */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-3 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+229 91 50 57 57</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@probooster.online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>24h/24</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


