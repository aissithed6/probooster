"use client"

import { useState } from "react"
import { HelpCircle, MessageCircle, Phone, Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

export default function HeaderSupport() {
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportCategory, setSupportCategory] = useState('general')
  const [supportMessage, setSupportMessage] = useState('')
  
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatStatus, setChatStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

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

  // Fonctions pour le Support Client
  const handlePhoneSupport = () => {
    try {
      const phoneNumber = "+229 91 50 57 57"
      
      // Vérifier si l'appareil supporte les appels téléphoniques
      if (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone')) {
        // Sur mobile, lancer l'appel
        window.location.href = `tel:${phoneNumber}`
      } else {
        // Sur desktop, copier le numéro
        navigator.clipboard.writeText(phoneNumber)
        alert(`📞 Support Téléphonique\n\nNuméro: ${phoneNumber}\n\nSur mobile: Appel automatique lancé\nSur desktop: Copiez le numéro et appelez manuellement\n\nAlternatives:\n• WhatsApp: +22991505757\n• Email: support@probooster.online`)
      }
    } catch (error) {
      console.error('Erreur lors du support téléphonique:', error)
      alert('❌ Erreur lors du support téléphonique')
    }
  }

  const handleChatSupport = () => {
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

  const handleEmailSupport = () => {
    try {
      const email = 'support@probooster.online'
      const subject = encodeURIComponent('Support Client - Demande d\'assistance')
      const body = encodeURIComponent('Bonjour,\n\nJ\'ai besoin d\'assistance concernant...\n\nMerci de votre aide.\n\nCordialement,')
      
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`
      window.open(mailtoUrl)
      
      alert('📧 Email de support ouvert !\n\nRemplissez votre message et envoyez-le.')
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de l\'email:', error)
      alert('❌ Erreur lors de l\'ouverture de l\'email')
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSupportCategory(categoryId)
  }

  const handleSupportMessageSubmit = () => {
    if (!supportMessage.trim()) {
      alert('⚠️ Veuillez saisir un message pour envoyer votre demande de support.')
      return
    }
    
    try {
      // Simuler l'envoi du message
      alert('✅ Message de support envoyé !\n\nNous vous répondrons dans les plus brefs délais.')
      setSupportMessage('')
      setShowSupportModal(false)
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      alert('❌ Erreur lors de l\'envoi du message')
    }
  }

  const handleChatMessageSubmit = () => {
    if (!chatMessage.trim() || chatStatus !== 'connected') return
    
    try {
      const newMessage = {
        id: Date.now(),
        type: 'user',
        message: chatMessage,
        timestamp: new Date().toISOString(),
        sender: 'Vous'
      }
      
      setChatMessages(prev => [...prev, newMessage])
      setChatMessage('')
      
      // Simuler la réponse du support
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        const adminResponse = {
          id: Date.now() + 1,
          type: 'admin',
          message: 'Merci pour votre message ! Un agent va vous répondre dans quelques instants.',
          timestamp: new Date().toISOString(),
          sender: 'Support Probooster'
        }
        setChatMessages(prev => [...prev, adminResponse])
      }, 2000)
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message chat:', error)
      alert('❌ Erreur lors de l\'envoi du message')
    }
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Support Button */}
      <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
          >
            <HelpCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-[#ff6600]" />
              <span>Support client</span>
            </DialogTitle>
            <DialogDescription>
              Nous sommes là pour vous aider ! Choisissez votre méthode de contact préférée.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Méthodes de contact rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={handlePhoneSupport}>
                <CardContent className="p-4 text-center">
                  <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-800">Support téléphonique</h4>
                  <p className="text-sm text-gray-600">+229 91 50 57 57</p>
                  <p className="text-xs text-gray-500 mt-1">24h/24 - Réponse immédiate</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={handleChatSupport}>
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-800">Chat en ligne</h4>
                  <p className="text-sm text-gray-600">Support instantané</p>
                  <p className="text-xs text-gray-500 mt-1">Temps de réponse: &lt; 2 min</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={handleEmailSupport}>
                <CardContent className="p-4 text-center">
                  <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-800">Email</h4>
                  <p className="text-sm text-gray-600">support@probooster.online</p>
                  <p className="text-xs text-gray-500 mt-1">Réponse sous 24h</p>
                </CardContent>
              </Card>
            </div>

            {/* Formulaire de support */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Envoyer un message de support</h4>
              
              <div className="space-y-3">
                <Select value={supportCategory} onValueChange={handleCategorySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Support Général</SelectItem>
                    <SelectItem value="technical">Support Technique</SelectItem>
                    <SelectItem value="delivery">Livraisons</SelectItem>
                    <SelectItem value="payment">Paiements</SelectItem>
                    <SelectItem value="account">Compte Utilisateur</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Décrivez votre problème en détail..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="flex justify-end">
                  <Button onClick={handleSupportMessageSubmit} className="bg-[#ff6600] hover:bg-[#e55a00]">
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


