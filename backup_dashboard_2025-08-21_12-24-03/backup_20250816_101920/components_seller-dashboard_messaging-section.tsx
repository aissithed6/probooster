"use client"

import { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, Send, Paperclip, Mic, Phone, Video, 
  Search, Star, Pin, AlertCircle, CheckCircle, Clock,
  BarChart3, Share, Download, Smile, Archive,
  Volume2, File, Mail, MapPin, ShoppingCart, Zap, 
  Settings, Bell, Eye, X
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  isRead: boolean
  type: 'text' | 'image' | 'file' | 'voice'
  attachments?: Array<{
    id: string
    name: string
    type: 'image' | 'file' | 'voice'
    url: string
    size?: string
  }>
}

interface Conversation {
  id: string
  name: string
  isOnline: boolean
  lastMessage: string
  unreadCount: number
  isPinned: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'active' | 'archived' | 'blocked'
  lastActivity: Date
  tags: string[]
  customerInfo: {
    email: string
    phone: string
    location: string
    totalOrders: number
    totalSpent: number
  }
}

export default function MessagingSection() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const conversationsData: Conversation[] = [
    {
      id: 'conv1',
      name: 'Jean Dupont',
      isOnline: true,
      lastMessage: 'Bonjour, j\'ai une question sur ma commande #12345',
      unreadCount: 2,
      isPinned: true,
      priority: 'high',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 5),
      tags: ['client fidèle', 'commandes fréquentes'],
      customerInfo: {
        email: 'jean.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        location: 'Paris, France',
        totalOrders: 15,
        totalSpent: 1250.00
      }
    },
    {
      id: 'conv2',
      name: 'Marie Martin',
      isOnline: false,
      lastMessage: 'Votre commande a été expédiée aujourd\'hui',
      unreadCount: 0,
      isPinned: false,
      priority: 'medium',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 30),
      tags: ['nouveau client'],
      customerInfo: {
        email: 'marie.martin@email.com',
        phone: '+33 6 98 76 54 32',
        location: 'Lyon, France',
        totalOrders: 3,
        totalSpent: 89.50
      }
    },
    {
      id: 'conv3',
      name: 'Pierre Dubois',
      isOnline: true,
      lastMessage: 'Merci pour le service client exceptionnel !',
      unreadCount: 1,
      isPinned: false,
      priority: 'low',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 2),
      tags: ['client satisfait'],
      customerInfo: {
        email: 'pierre.dubois@email.com',
        phone: '+33 6 45 67 89 01',
        location: 'Marseille, France',
        totalOrders: 8,
        totalSpent: 456.75
      }
    },
    {
      id: 'conv4',
      name: 'Sophie Bernard',
      isOnline: false,
      lastMessage: 'Quand sera disponible le produit X ?',
      unreadCount: 3,
      isPinned: true,
      priority: 'urgent',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 15),
      tags: ['demande urgente', 'produit populaire'],
      customerInfo: {
        email: 'sophie.bernard@email.com',
        phone: '+33 6 23 45 67 89',
        location: 'Toulouse, France',
        totalOrders: 12,
        totalSpent: 789.25
      }
    },
    {
      id: 'conv5',
      name: 'Lucas Moreau',
      isOnline: true,
      lastMessage: 'Je souhaite annuler ma commande #12346',
      unreadCount: 0,
      isPinned: false,
      priority: 'high',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 1),
      tags: ['annulation'],
      customerInfo: {
        email: 'lucas.moreau@email.com',
        phone: '+33 6 78 90 12 34',
        location: 'Nantes, France',
        totalOrders: 5,
        totalSpent: 234.00
      }
    }
  ]

  const chatStats = {
    totalConversations: 156,
    activeConversations: 23,
    averageResponseTime: 2.3,
    customerSatisfaction: 4.8,
    totalMessages: 1247,
    responseRate: 98.5,
    averageResolutionTime: 4.2
  }

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const newNotification = {
      id: Date.now().toString(),
      title,
      message,
      type
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 5000)
  }

  const sendMessage = (content: string, type: 'text' | 'image' | 'file' | 'voice' = 'text', attachments?: any[]) => {
    if (!content.trim() && !attachments?.length) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'vendor',
      content,
      timestamp: new Date(),
      isRead: false,
      type,
      attachments
    }

    setMessages(prev => [...prev, newMessage])
    showNotification('Message envoyé', 'Votre message a été envoyé avec succès', 'success')
    
    // Simulation de réponse automatique
    setTimeout(() => {
      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'customer',
        content: type === 'text' ? 'Merci pour votre réponse rapide !' : 'Fichier reçu, merci !',
        timestamp: new Date(),
        isRead: false,
        type: 'text'
      }
      setMessages(prev => [...prev, replyMessage])
    }, 2000)
  }

  const handleSendMessage = () => {
    const messageInput = document.getElementById('message-input') as HTMLTextAreaElement
    if (messageInput && messageInput.value.trim()) {
      sendMessage(messageInput.value)
      messageInput.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const fileType = file.type.startsWith('image/') ? 'image' : 'file'
      
      const attachment = {
        id: Date.now().toString(),
        name: file.name,
        type: fileType,
        url: URL.createObjectURL(file),
        size: `${(file.size / 1024).toFixed(1)} KB`
      }
      
      sendMessage(`Fichier: ${file.name}`, fileType, [attachment])
    }
  }

  const startVoiceCall = () => {
    showNotification('Appel vocal', 'Appel vocal en cours de connexion...', 'info')
  }

  const startVideoCall = () => {
    showNotification('Appel vidéo', 'Appel vidéo en cours de connexion...', 'info')
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      showNotification('Enregistrement', 'Enregistrement vocal en cours...', 'info')
      setTimeout(() => {
        setIsRecording(false)
        const voiceMessage: Message = {
          id: Date.now().toString(),
          senderId: 'vendor',
          content: 'Message vocal',
          timestamp: new Date(),
          isRead: false,
          type: 'voice',
          attachments: [{
            id: Date.now().toString(),
            name: 'Message vocal',
            type: 'voice',
            url: '#',
            size: '15 KB'
          }]
        }
        setMessages(prev => [...prev, voiceMessage])
        showNotification('Message vocal', 'Message vocal envoyé', 'success')
      }, 3000)
    }
  }

  const shareConversation = (conversation: Conversation) => {
    const shareText = `Conversation avec ${conversation.name} - ${conversation.lastMessage}`
    if (navigator.share) {
      navigator.share({
        title: 'Conversation',
        text: shareText
      })
    } else {
      navigator.clipboard.writeText(shareText)
      showNotification('Conversation partagée', 'Lien copié dans le presse-papiers', 'success')
    }
  }

  const exportConversation = (conversation: Conversation) => {
    const exportData = {
      conversation: conversation,
      messages: messages
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `conversation_${conversation.id}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    showNotification('Export réussi', 'Conversation exportée au format JSON', 'success')
  }

  const pinConversation = (conversation: Conversation) => {
    conversation.isPinned = !conversation.isPinned
    showNotification(
      conversation.isPinned ? 'Conversation épinglée' : 'Conversation désépinglée',
      conversation.isPinned ? 'La conversation est maintenant épinglée' : 'La conversation n\'est plus épinglée',
      'success'
    )
  }

  const archiveConversation = (conversation: Conversation) => {
    conversation.status = 'archived'
    showNotification('Conversation archivée', 'La conversation a été archivée', 'success')
  }

  const filteredConversations = conversationsData.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'urgent' && conv.priority === 'urgent') ||
                      (activeTab === 'unread' && conv.unreadCount > 0) ||
                      (activeTab === 'pinned' && conv.isPinned)
    
    return matchesSearch && matchesTab && conv.status === 'active'
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedConversation) {
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: 'customer',
          content: 'Bonjour, j\'ai une question sur ma commande #12345',
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          isRead: true,
          type: 'text'
        },
        {
          id: '2',
          senderId: 'vendor',
          content: 'Bonjour ! Je vais vérifier le statut de votre commande.',
          timestamp: new Date(Date.now() - 1000 * 60 * 8),
          isRead: true,
          type: 'text'
        },
        {
          id: '3',
          senderId: 'customer',
          content: 'Parfait, merci beaucoup !',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          isRead: true,
          type: 'text'
        }
      ]
      setMessages(mockMessages)
    }
  }, [selectedConversation])

  return (
    <div className="space-y-6">
      {/* Statistiques améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Conversations actives</p>
                <p className="text-2xl font-bold text-blue-900">{chatStats.activeConversations}</p>
                <p className="text-xs text-blue-600">+12% ce mois</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Temps de réponse</p>
                <p className="text-2xl font-bold text-green-900">{chatStats.averageResponseTime}min</p>
                <p className="text-xs text-green-600">Objectif: 2min</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Total conversations</p>
                <p className="text-2xl font-bold text-orange-900">{chatStats.totalConversations}</p>
                <p className="text-xs text-orange-600">+8% ce mois</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Satisfaction</p>
                <p className="text-2xl font-bold text-purple-900">{chatStats.customerSatisfaction}/5</p>
                <p className="text-xs text-purple-600">+0.2 ce mois</p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface de messagerie complète */}
      <div className="flex h-[calc(100vh-400px)] bg-white rounded-lg border shadow-sm overflow-hidden">
        {/* Sidebar des conversations améliorée */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Messagerie</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShowQuickActions(true)}>
                  <Zap className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAnalytics(true)}>
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher des conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all" className="text-xs">Toutes</TabsTrigger>
                <TabsTrigger value="urgent" className="text-xs">Urgentes</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">Non lues</TabsTrigger>
                <TabsTrigger value="pinned" className="text-xs">Épinglées</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {conversation.name.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {conversation.isPinned && <Pin className="w-3 h-3 text-yellow-500" />}
                        {conversation.priority === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                        {conversation.priority === 'high' && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Important</Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {conversation.lastActivity.toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {conversation.tags.slice(0, 1).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de chat complète */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* En-tête de conversation */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                        {selectedConversation.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-2 -right-2 w-5 h-5 rounded-full border-3 border-white ${
                        selectedConversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {selectedConversation.name}
                      </h3>
                      <p className="text-base text-gray-500">
                        {selectedConversation.isOnline ? 'En ligne' : 'Hors ligne'} • 
                        {selectedConversation.customerInfo.totalOrders} commandes • 
                        {selectedConversation.customerInfo.totalSpent.toFixed(2)} € dépensés
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startVoiceCall}
                      className="text-green-600 border-green-300 hover:bg-green-50 px-4 py-2"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startVideoCall}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 px-4 py-2"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Vidéo
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareConversation(selectedConversation)}
                      className="px-4 py-2"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Partager
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConversation(selectedConversation)}
                      className="px-4 py-2"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pinConversation(selectedConversation)}
                      className={`px-4 py-2 ${selectedConversation.isPinned ? 'text-yellow-600 border-yellow-300 bg-yellow-50' : ''}`}
                    >
                      <Pin className="w-4 h-4 mr-2" />
                      Épingler
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => archiveConversation(selectedConversation)}
                      className="px-4 py-2"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archiver
                    </Button>
                  </div>
                </div>

                {/* Informations client détaillées */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedConversation.customerInfo.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedConversation.customerInfo.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedConversation.customerInfo.location}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedConversation.customerInfo.totalOrders} commandes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone des messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50 min-h-[800px]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'vendor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-6 py-5 rounded-xl ${
                      message.senderId === 'vendor'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {message.type === 'text' && (
                        <p className="text-base leading-relaxed">{message.content}</p>
                      )}
                      
                      {message.type === 'image' && message.attachments && (
                        <div className="space-y-4">
                          <p className="text-base leading-relaxed">{message.content}</p>
                          <div className="relative">
                            <img 
                              src={message.attachments[0].url} 
                              alt="Image" 
                              className="rounded-lg max-w-full"
                            />
                          </div>
                        </div>
                      )}
                      
                      {message.type === 'file' && message.attachments && (
                        <div className="space-y-4">
                          <p className="text-base leading-relaxed">{message.content}</p>
                          <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
                            <File className="w-5 h-5" />
                            <span className="text-sm font-medium">{message.attachments[0].name}</span>
                            <span className="text-xs text-gray-500">({message.attachments[0].size})</span>
                          </div>
                        </div>
                      )}
                      
                      {message.type === 'voice' && message.attachments && (
                        <div className="space-y-4">
                          <p className="text-base leading-relaxed">{message.content}</p>
                          <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
                            <Volume2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Message vocal</span>
                            <span className="text-xs text-gray-500">({message.attachments[0].size})</span>
                          </div>
                        </div>
                      )}
                      
                      <p className={`text-xs mt-4 ${
                        message.senderId === 'vendor' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Zone de saisie de message */}
              <div className="bg-white border-t border-gray-200 p-8">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <Textarea
                      id="message-input"
                      placeholder="Tapez votre message..."
                      className="min-h-[100px] max-h-48 resize-none text-base p-5 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl"
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-600 hover:text-blue-600 px-4 py-3 h-14 w-14 rounded-xl"
                    >
                      <Paperclip className="w-6 h-6" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleRecording}
                      className={`px-4 py-3 h-14 w-14 rounded-xl ${
                        isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'text-gray-600 hover:text-red-600'
                      }`}
                    >
                      <Mic className="w-6 h-6" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:text-yellow-600 px-4 py-3 h-14 w-14 rounded-xl"
                    >
                      <Smile className="w-6 h-6" />
                    </Button>
                    
                    <Button
                      onClick={handleSendMessage}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 h-14 rounded-xl font-medium"
                    >
                      <Send className="w-6 h-6 mr-2" />
                      Envoyer
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Bienvenue dans votre messagerie
                </h3>
                <p className="text-gray-500 mb-4">
                  Sélectionnez une conversation pour commencer à discuter
                </p>
                <div className="text-sm text-gray-400">
                  <p>• Gérez vos conversations avec les clients</p>
                  <p>• Répondez rapidement aux demandes</p>
                  <p>• Suivez l'historique des échanges</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Dialog open={showQuickActions} onOpenChange={setShowQuickActions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Actions Rapides</DialogTitle>
            <DialogDescription>Accédez rapidement aux fonctionnalités essentielles</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <MessageSquare className="w-6 h-6" />
                <span>Nouvelle conversation</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <BarChart3 className="w-6 h-6" />
                <span>Rapport du jour</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Bell className="w-6 h-6" />
                <span>Notifications</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Settings className="w-6 h-6" />
                <span>Paramètres</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Download className="w-6 h-6" />
                <span>Exporter données</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Eye className="w-6 h-6" />
                <span>Aide</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paramètres de la Messagerie</DialogTitle>
            <DialogDescription>Personnalisez votre expérience de messagerie</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications push</Label>
                <p className="text-sm text-gray-500">Recevoir des notifications pour les nouveaux messages</p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound">Sons de notification</Label>
                <p className="text-sm text-gray-500">Jouer un son pour les nouveaux messages</p>
              </div>
              <Switch id="sound" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-reply">Réponse automatique</Label>
                <p className="text-sm text-gray-500">Activer les réponses automatiques hors ligne</p>
              </div>
              <Switch id="auto-reply" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Analytics de la Messagerie</DialogTitle>
            <DialogDescription>Statistiques détaillées de vos conversations</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{chatStats.totalConversations}</div>
                  <div className="text-sm text-gray-600">Total conversations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{chatStats.averageResponseTime}min</div>
                  <div className="text-sm text-gray-600">Temps de réponse</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{chatStats.customerSatisfaction}/5</div>
                  <div className="text-sm text-gray-600">Satisfaction client</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{chatStats.activeConversations}</div>
                  <div className="text-sm text-gray-600">Conversations actives</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{chatStats.totalMessages}</div>
                  <div className="text-sm text-gray-600">Total messages</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{chatStats.responseRate}%</div>
                  <div className="text-sm text-gray-600">Taux de réponse</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-rose-600">{chatStats.averageResolutionTime}h</div>
                  <div className="text-sm text-gray-600">Temps de résolution</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4
              ${notification.type === 'success' ? 'border-l-green-500' : ''}
              ${notification.type === 'error' ? 'border-l-red-500' : ''}
              ${notification.type === 'warning' ? 'border-l-yellow-500' : ''}
              ${notification.type === 'info' ? 'border-l-blue-500' : ''}
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}