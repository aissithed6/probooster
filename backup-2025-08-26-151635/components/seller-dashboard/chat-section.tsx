"use client"

import { useState, useEffect, useRef } from 'react'
import { 
  MessageCircle, Send, Paperclip, Mic, Smile, MoreVertical,
  Search, Filter, Phone, Video, Info, Star, ShoppingCart,
  Package, Eye, Clock, CheckCircle, CheckCheck, User,
  Users, Settings, Archive, Trash2, Pin, Volume2, VolumeX,
  Camera, FileText, Image, MapPin, Calendar, DollarSign
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  type: 'text' | 'image' | 'file' | 'voice' | 'product' | 'order'
  status: 'sent' | 'delivered' | 'read'
  isSeller: boolean
  attachments?: {
    type: 'image' | 'file' | 'voice'
    url: string
    name?: string
    size?: number
    duration?: number
  }[]
  productData?: {
    id: number
    name: string
    price: number
    image: string
    stock: number
  }
  orderData?: {
    id: string
    status: string
    total: number
    items: Array<{
      id: number
      name: string
      quantity: number
      price: number
    }>
  }
}

interface ChatContact {
  id: string
  name: string
  avatar: string
  isOnline: boolean
  lastSeen: string
  unreadCount: number
  lastMessage: string
  lastMessageTime: string
  isPinned: boolean
  isArchived: boolean
  customerInfo: {
    email: string
    phone: string
    totalOrders: number
    totalSpent: number
    rating: number
    joinDate: string
  }
  quickActions: {
    canViewProfile: boolean
    canViewOrders: boolean
    canCreateOrder: boolean
    canSendPromotion: boolean
  }
}

interface ChatSectionProps {
  contacts: ChatContact[]
  onSendMessage: (contactId: string, message: ChatMessage) => void
  onMarkAsRead: (contactId: string) => void
  onArchiveContact: (contactId: string) => void
  onPinContact: (contactId: string) => void
  onViewCustomerProfile: (contactId: string) => void
  onViewCustomerOrders: (contactId: string) => void
  onCreateOrder: (contactId: string) => void
  onSendPromotion: (contactId: string) => void
}

export default function ChatSection({
  contacts,
  onSendMessage,
  onMarkAsRead,
  onArchiveContact,
  onPinContact,
  onViewCustomerProfile,
  onViewCustomerOrders,
  onCreateOrder,
  onSendPromotion
}: ChatSectionProps) {
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simuler des messages pour le contact sélectionné
  useEffect(() => {
    if (selectedContact) {
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          senderId: selectedContact.id,
          senderName: selectedContact.name,
          senderAvatar: selectedContact.avatar,
          content: 'Bonjour ! J\'ai une question sur votre produit iPhone 15 Pro Max.',
          timestamp: '2024-01-20T10:30:00Z',
          type: 'text',
          status: 'read',
          isSeller: false
        },
        {
          id: '2',
          senderId: 'seller',
          senderName: 'Vendeur Pro',
          senderAvatar: '/placeholder-user.jpg',
          content: 'Bonjour ! Je suis ravi de vous aider. Que souhaitez-vous savoir sur l\'iPhone 15 Pro Max ?',
          timestamp: '2024-01-20T10:32:00Z',
          type: 'text',
          status: 'read',
          isSeller: true
        },
        {
          id: '3',
          senderId: selectedContact.id,
          senderName: selectedContact.name,
          senderAvatar: selectedContact.avatar,
          content: 'Est-ce qu\'il est disponible en stock ?',
          timestamp: '2024-01-20T10:35:00Z',
          type: 'text',
          status: 'read',
          isSeller: false
        },
        {
          id: '4',
          senderId: 'seller',
          senderName: 'Vendeur Pro',
          senderAvatar: '/placeholder-user.jpg',
          content: '',
          timestamp: '2024-01-20T10:36:00Z',
          type: 'product',
          status: 'read',
          isSeller: true,
          productData: {
            id: 1,
            name: 'iPhone 15 Pro Max - 256GB',
            price: 850000,
            image: '/placeholder.jpg',
            stock: 15
          }
        },
        {
          id: '5',
          senderId: 'seller',
          senderName: 'Vendeur Pro',
          senderAvatar: '/placeholder-user.jpg',
          content: 'Oui, il est disponible ! 15 unités en stock. Voulez-vous que je vous aide à passer commande ?',
          timestamp: '2024-01-20T10:37:00Z',
          type: 'text',
          status: 'delivered',
          isSeller: true
        }
      ]
      setMessages(mockMessages)
      onMarkAsRead(selectedContact.id)
    }
  }, [selectedContact, onMarkAsRead])

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      case 'read':
        return <CheckCheck className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedContact) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'seller',
        senderName: 'Vendeur Pro',
        senderAvatar: '/placeholder-user.jpg',
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sent',
        isSeller: true
      }
      
      setMessages(prev => [...prev, message])
      onSendMessage(selectedContact.id, message)
      setNewMessage('')
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && selectedContact) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'seller',
        senderName: 'Vendeur Pro',
        senderAvatar: '/placeholder-user.jpg',
        content: `Fichier: ${file.name}`,
        timestamp: new Date().toISOString(),
        type: 'file',
        status: 'sent',
        isSeller: true,
        attachments: [{
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size
        }]
      }
      
      setMessages(prev => [...prev, message])
      onSendMessage(selectedContact.id, message)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'online' && contact.isOnline) ||
                         (statusFilter === 'unread' && contact.unreadCount > 0)
    return matchesSearch && matchesStatus
  })

  const pinnedContacts = filteredContacts.filter(c => c.isPinned)
  const regularContacts = filteredContacts.filter(c => !c.isPinned)

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg border shadow-sm">
      {/* Liste des contacts */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* En-tête */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Recherche et filtres */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les contacts</SelectItem>
                <SelectItem value="online">En ligne</SelectItem>
                <SelectItem value="unread">Non lus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des contacts */}
        <div className="flex-1 overflow-y-auto">
          {/* Contacts épinglés */}
          {pinnedContacts.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                Épinglés
              </div>
              {pinnedContacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContact?.id === contact.id}
                  onClick={() => setSelectedContact(contact)}
                />
              ))}
            </div>
          )}

          {/* Contacts réguliers */}
          <div>
            {pinnedContacts.length > 0 && (
              <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                Tous les contacts
              </div>
            )}
            {regularContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                isSelected={selectedContact?.id === contact.id}
                onClick={() => setSelectedContact(contact)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* En-tête du chat */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedContact.avatar} />
                      <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      selectedContact.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedContact.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedContact.isOnline ? 'En ligne' : `Vu ${formatDate(selectedContact.lastSeen)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowContactInfo(true)}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowQuickActions(true)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.isSeller}
                  />
                ))}
                {isTyping && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span>{selectedContact.name} tape...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="min-h-[40px] max-h-32 resize-none pr-20"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Menu des pièces jointes */}
              {showAttachmentMenu && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center space-y-1"
                    >
                      <Image className="w-5 h-5" />
                      <span className="text-xs">Image</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center space-y-1"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-xs">Document</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex flex-col items-center space-y-1"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-xs">Caméra</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex flex-col items-center space-y-1"
                    >
                      <MapPin className="w-5 h-5" />
                      <span className="text-xs">Localisation</span>
                    </Button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez un contact
              </h3>
              <p className="text-gray-500">
                Choisissez un contact pour commencer une conversation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'informations du contact */}
      <Dialog open={showContactInfo} onOpenChange={setShowContactInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Informations du client</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedContact.avatar} />
                  <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedContact.name}</h3>
                  <p className="text-sm text-gray-500">{selectedContact.customerInfo.email}</p>
                  <p className="text-sm text-gray-500">{selectedContact.customerInfo.phone}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedContact.customerInfo.totalOrders}
                  </div>
                  <div className="text-sm text-gray-500">Commandes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedContact.customerInfo.totalSpent.toLocaleString()} F CFA
                  </div>
                  <div className="text-sm text-gray-500">Total dépensé</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm">{selectedContact.customerInfo.rating}/5</span>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Client depuis {formatDate(selectedContact.customerInfo.joinDate)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal des actions rapides */}
      <Dialog open={showQuickActions} onOpenChange={setShowQuickActions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Actions rapides</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onViewCustomerProfile(selectedContact.id)
                  setShowQuickActions(false)
                }}
              >
                <User className="w-4 h-4 mr-2" />
                Voir le profil client
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onViewCustomerOrders(selectedContact.id)
                  setShowQuickActions(false)
                }}
              >
                <Package className="w-4 h-4 mr-2" />
                Voir les commandes
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onCreateOrder(selectedContact.id)
                  setShowQuickActions(false)
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Créer une commande
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onSendPromotion(selectedContact.id)
                  setShowQuickActions(false)
                }}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Envoyer une promotion
              </Button>
              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onPinContact(selectedContact.id)
                  setShowQuickActions(false)
                }}
              >
                <Pin className="w-4 h-4 mr-2" />
                {selectedContact.isPinned ? 'Désépingler' : 'Épingler'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onArchiveContact(selectedContact.id)
                  setShowQuickActions(false)
                }}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archiver
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant pour un contact dans la liste
function ContactItem({ 
  contact, 
  isSelected, 
  onClick 
}: { 
  contact: ChatContact
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <div
      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-orange-50 border-r-2 border-orange-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarImage src={contact.avatar} />
            <AvatarFallback>{contact.name[0]}</AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
            contact.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium truncate">{contact.name}</h4>
            <div className="flex items-center space-x-1">
              {contact.isPinned && <Pin className="w-3 h-3 text-orange-500" />}
              {contact.unreadCount > 0 && (
                <Badge className="bg-orange-500 text-white text-xs">
                  {contact.unreadCount}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
          <p className="text-xs text-gray-400">
            {new Date(contact.lastMessageTime).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

// Composant pour une bulle de message
function MessageBubble({ 
  message, 
  isOwnMessage 
}: { 
  message: ChatMessage
  isOwnMessage: boolean 
}) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      case 'read':
        return <CheckCheck className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-1">
            <Avatar className="w-6 h-6">
              <AvatarImage src={message.senderAvatar} />
              <AvatarFallback>{message.senderName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500">{message.senderName}</span>
          </div>
        )}
        
        <div className={`rounded-lg p-3 ${
          isOwnMessage 
            ? 'bg-green-500 text-white' 
            : 'bg-white text-gray-900 border border-gray-200'
        }`}>
          {message.type === 'product' && message.productData && (
            <div className="mb-2 p-3 bg-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <img 
                  src={message.productData.image} 
                  alt={message.productData.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{message.productData.name}</h4>
                  <p className="text-sm text-gray-600">
                    {message.productData.price.toLocaleString()} F CFA
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {message.productData.stock} unités
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {message.type === 'order' && message.orderData && (
            <div className="mb-2 p-3 bg-gray-100 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Commande {message.orderData.id}</h4>
                  <Badge className="text-xs">{message.orderData.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Total: {message.orderData.total.toLocaleString()} F CFA
                </p>
                <p className="text-xs text-gray-500">
                  {message.orderData.items.length} article(s)
                </p>
              </div>
            </div>
          )}
          
          {message.content && (
            <p className="text-sm">{message.content}</p>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="p-2 bg-gray-100 rounded">
                  {attachment.type === 'image' ? (
                    <img 
                      src={attachment.url} 
                      alt="Attachment"
                      className="max-w-full rounded"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className={`flex items-center justify-end space-x-1 mt-1 ${
            isOwnMessage ? 'text-green-100' : 'text-gray-400'
          }`}>
            <span className="text-xs">{formatTime(message.timestamp)}</span>
            {isOwnMessage && getStatusIcon(message.status)}
          </div>
        </div>
      </div>
    </div>
  )
}

