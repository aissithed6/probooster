'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useChatContext } from '@/lib/chat-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  MoreHorizontal,
  Check,
  Star,
  AlertCircle,
  Settings,
  Archive,
  Send as SendIcon,
  Trash2,
  X,
  ShoppingCart,
  Coins
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const GlobalChat: React.FC = () => {
  const {
    chatSessions,
    activeChatSession,
    messages,
    messageStatuses,
    messageDeliveryStatus,
    createChatSession,
    openChatSession,
    closeChatSession,
    sendMessage,
    addProductToChat,
    addFileToChat,
    selectedMessageIds,
    toggleMessageSelection,
    selectAllMessages,
    deselectAllMessages,
    deleteSelectedMessages,
    archiveSelectedMessages,
    transferSelectedMessages,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab
  } = useChatContext()

  const { toast } = useToast()
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedTransferSeller, setSelectedTransferSeller] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock data pour les vendeurs et produits
  const mockSellers = [
    { id: '1', name: 'TechStore', avatar: '/avatars/seller1.jpg' },
    { id: '2', name: 'FashionHub', avatar: '/avatars/seller2.jpg' },
    { id: '3', name: 'HomeDecor', avatar: '/avatars/seller3.jpg' }
  ]

  const mockChatProducts = [
    {
      id: 1,
      name: 'Smartphone Galaxy S24',
      price: 899.99,
      points: 8999,
      image: '/products/phone1.jpg',
      seller: 'TechStore'
    },
    {
      id: 2,
      name: 'Laptop Gaming Pro',
      price: 1299.99,
      points: 12999,
      image: '/products/laptop1.jpg',
      seller: 'TechStore'
    }
  ]

  const handleSendMessage = () => {
    if (chatInput.trim() && activeChatSession) {
      sendMessage(chatInput.trim())
      setChatInput('')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && activeChatSession) {
      addFileToChat(file)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleProductClick = (product: any) => {
    if (activeChatSession) {
      addProductToChat(product)
    }
  }

  const handleAddToCart = (product: any) => {
    // Logique pour ajouter au panier
    toast({
      title: "Produit ajouté au panier",
      description: `${product.name} a été ajouté à votre panier`,
      variant: "default",
    })
  }

  // Composant pour les indicateurs de statut des messages
  const MessageStatusIndicator = ({ status, messageId, isUserMessage }: { 
    status: 'sending' | 'sent' | 'delivered' | 'read'
    messageId: string
    isUserMessage: boolean
  }) => {
    if (!isUserMessage) return null
    
    const getStatusIcon = () => {
      switch (status) {
        case 'sending':
          return <div className="w-1 h-3 bg-gray-300 rounded-full animate-pulse"></div>
        case 'sent':
          return <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12"></div>
        case 'delivered':
          return (
            <div className="flex items-center space-x-0.5">
              <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12"></div>
              <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12 -ml-1"></div>
            </div>
          )
        case 'read':
          return (
            <div className="flex items-center space-x-0.5">
              <div className="w-0.5 h-3 bg-green-500 rounded-full transform rotate-12"></div>
              <div className="w-0.5 h-3 bg-green-500 rounded-full transform rotate-12 -ml-1"></div>
            </div>
          )
        default:
          return null
      }
    }
    
    return (
      <div className="flex items-center justify-end mt-1">
        {getStatusIcon()}
      </div>
    )
  }

  if (!activeChatSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune conversation active
          </h3>
          <p className="text-gray-500">
            Sélectionnez une conversation pour commencer à discuter
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* En-tête du chat */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={activeChatSession.sellerAvatar} />
              <AvatarFallback>{activeChatSession.sellerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{activeChatSession.sellerName}</h3>
              <p className="text-sm text-gray-500">En ligne</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'conversations' | 'produits')} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="produits">Produits</TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="flex-1 flex flex-col">
            {/* Barre d'actions pour la sélection des messages */}
            {selectedMessageIds.length > 0 && (
              <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedMessageIds.length} message(s) sélectionné(s)
                    </span>
                    <Button variant="ghost" size="sm" onClick={deselectAllMessages}>
                      <X className="w-3 h-3 mr-2" />
                      Désélectionner tout
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => {}}>
                        <Check className="w-3 h-3 mr-2" />
                        Marquer comme lu
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {}}>
                        <X className="w-3 h-3 mr-2" />
                        Marquer comme non lu
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50">
                        <Star className="w-3 h-3 mr-2" />
                        Important
                      </Button>
                      <Button variant="outline" size="sm" className="border-red-200 hover:bg-red-50">
                        <AlertCircle className="w-3 h-3 mr-2" />
                        Urgent
                      </Button>
                      <Button variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                        <Settings className="w-3 h-3 mr-2" />
                        À régler
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={archiveSelectedMessages}>
                        <Archive className="w-3 h-3 mr-2" />
                        Archiver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowTransferModal(true)}>
                        <SendIcon className="w-3 h-3 mr-2" />
                        Transférer
                      </Button>
                    </div>
                    
                    <Button variant="destructive" size="sm" onClick={deleteSelectedMessages} className="w-full">
                      <Trash2 className="w-3 h-3 mr-2" />
                      Supprimer les messages sélectionnés
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de sélection globale */}
            <div className="p-4">
              <Button variant="outline" size="sm" onClick={selectAllMessages}>
                <Check className="w-4 h-4 mr-2" />
                Sélectionner tout
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedMessageIds.includes(message.id)}
                      onChange={() => toggleMessageSelection(message.id)}
                      className="mt-2"
                    />
                    
                    <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                      {message.type === 'text' && (
                        <div className={`p-3 rounded-lg shadow-sm ${
                          message.sender === 'user' 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-white border border-gray-200'
                        }`}>
                          <p className={`text-sm ${
                            message.sender === 'user' ? 'text-white' : 'text-gray-800'
                          }`}>
                            {message.content}
                          </p>
                          
                          {/* Badges de statut du message */}
                          {messageStatuses[message.id] && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {messageStatuses[message.id].isRead && (
                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-green-100 text-green-700 border-green-200">
                                  <Check className="w-3 h-3 mr-1" />
                                  Lu
                                </Badge>
                              )}
                              {messageStatuses[message.id].isImportant && (
                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-blue-100 text-blue-700 border-blue-200">
                                  <Star className="w-3 h-3 mr-1" />
                                  Important
                                </Badge>
                              )}
                              {messageStatuses[message.id].isUrgent && (
                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-red-100 text-red-700 border-red-200">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Urgent
                                </Badge>
                              )}
                              {messageStatuses[message.id].isToResolve && (
                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-orange-100 text-orange-700 border-orange-200">
                                  <Settings className="w-3 h-3 mr-1" />
                                  À régler
                                </Badge>
                              )}
                              {messageStatuses[message.id].isArchived && (
                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-gray-100 text-gray-700 border-gray-200">
                                  <Archive className="w-3 h-3 mr-1" />
                                  Archivé
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {message.type === 'product' && message.product && (
                        <div className={`p-3 rounded-lg shadow-sm ${
                          message.sender === 'user' 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-white border border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <img 
                              src={message.product.image} 
                              alt={message.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className={`font-medium ${
                                message.sender === 'user' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {message.product.name}
                              </h4>
                              <div className={`text-sm ${
                                message.sender === 'user' ? 'text-orange-100' : 'text-gray-600'
                              }`}>
                                <p>Prix: {message.product.price} F CFA</p>
                                <p className="flex items-center">
                                  <Coins className="w-4 h-4 mr-1" />
                                  {message.product.points} points
                                </p>
                              </div>
                              <Button
                                size="sm"
                                className="mt-2 bg-green-600 hover:bg-green-700"
                                onClick={() => handleAddToCart(message.product)}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Acheter
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {message.type === 'image' && (
                        <div className={`p-3 rounded-lg shadow-sm ${
                          message.sender === 'user' 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-white border border-gray-200'
                        }`}>
                          <img 
                            src={message.imageUrl} 
                            alt="Image"
                            className="max-w-xs rounded-lg"
                          />
                          <p className={`text-sm mt-2 ${
                            message.sender === 'user' ? 'text-white' : 'text-gray-800'
                          }`}>
                            {message.content}
                          </p>
                        </div>
                      )}

                      {message.type === 'document' && (
                        <div className={`p-3 rounded-lg shadow-sm ${
                          message.sender === 'user' 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-white border border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <Paperclip className="w-6 h-6" />
                            <div>
                              <p className={`font-medium ${
                                message.sender === 'user' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {message.fileName}
                              </p>
                              <p className={`text-sm ${
                                message.sender === 'user' ? 'text-orange-100' : 'text-gray-600'
                              }`}>
                                {(message.fileSize || 0) / 1024} KB
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timestamp et statut */}
                      <div className={`flex items-center justify-between mt-1 ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}>
                        <p className={`text-xs text-gray-500 ${
                          message.sender === 'user' ? 'text-right' : ''
                        }`}>
                          {message.timestamp}
                        </p>
                        <MessageStatusIndicator 
                          status={messageDeliveryStatus[message.id]?.status || 'sent'}
                          messageId={message.id}
                          isUserMessage={message.sender === 'user'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="produits" className="flex-1">
            <div className="p-4">
              <div className="mb-4">
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockChatProducts
                  .filter(product => 
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.seller.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((product) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                        <div className="text-sm text-gray-600 mb-3">
                          <p>Prix: {product.price} F CFA</p>
                          <p className="flex items-center">
                            <Coins className="w-4 h-4 mr-1" />
                            {product.points} points
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleProductClick(product)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contacter le vendeur
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Zone de saisie */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            
            {showAttachmentMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] z-[9999]">
                <div className="text-sm font-medium text-gray-700 mb-2">Ajouter une pièce jointe</div>
                <div className="space-y-1">
                  <button
                    onClick={triggerFileSelect}
                    className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Document</div>
                      <div className="text-xs text-gray-500 ml-12">Ajouter un fichier</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={triggerFileSelect}
                    className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Paperclip className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Image</div>
                      <div className="text-xs text-gray-500 ml-12">Ajouter une image</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2"
          >
            <Smile className="w-5 h-5" />
          </Button>

          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Tapez votre message..."
            className="flex-1"
          />

          <Button onClick={handleSendMessage} disabled={!chatInput.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Sélecteur d'emojis */}
        {showEmojiPicker && (
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="grid grid-cols-8 gap-2">
              {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setChatInput(prev => prev + emoji)
                    setShowEmojiPicker(false)
                  }}
                  className="w-8 h-8 text-xl hover:bg-gray-100 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input caché pour les fichiers */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Modal de transfert */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Transférer les messages</h3>
            <div className="space-y-3">
              {mockSellers.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => {
                    setSelectedTransferSeller(seller.id)
                    transferSelectedMessages(seller.id)
                    setShowTransferModal(false)
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{seller.name}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowTransferModal(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
