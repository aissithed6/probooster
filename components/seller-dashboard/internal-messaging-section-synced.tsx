"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Mail, Plus, Download, Bell, Clock, Star, Search, Filter, TrendingUp, 
  Eye, Check, RefreshCw, X, MoreVertical, Send, Archive, Trash2, Reply
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useInternalMessaging } from '@/contexts/InternalMessagingContext'
import { useAuth } from '@/contexts/AuthContext'
import { InternalMessagingService } from '@/lib/services/internal-messaging-service'

export default function InternalMessagingSectionSynced() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const {
    messages,
    receivedMessages,
    unreadCount,
    isLoading,
    isSyncing,
    sendMessage,
    replyToMessage,
    markAsRead,
    markAllAsRead,
    archiveMessage,
    deleteMessage,
    toggleImportant,
    updateMessage,
    filterByCategory,
    filterByPriority,
    filterByStatus,
    getParticipantInfo,
    refreshMessages
  } = useInternalMessaging()

  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [newMessageSubject, setNewMessageSubject] = useState('')
  const [newMessageContent, setNewMessageContent] = useState('')
  const [newMessageCategory, setNewMessageCategory] = useState('general')
  const [newMessagePriority, setNewMessagePriority] = useState('normal')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const [adminRecipients, setAdminRecipients] = useState<{ adminId: string | null; superAdminId: string | null } | null>(null)
  const [adminTarget, setAdminTarget] = useState<'super_admin' | 'admin'>('super_admin')
  
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editSubject, setEditSubject] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('general')
  const [editPriority, setEditPriority] = useState('normal')
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [senderInfo, setSenderInfo] = useState<any>(null)

  /**
   * Supporte la redirection depuis une liste (ex: SyncedMessagesList) via paramètres d'URL.
   * Ne modifie pas la logique de messagerie: on se contente d'ouvrir le message existant.
   */
  useEffect(() => {
    const messageId = String(searchParams?.get('messageId') ?? '').trim()
    if (!messageId) return
    const action = String(searchParams?.get('action') ?? '').trim().toLowerCase()

    const source = Array.isArray(messages) && messages.length ? messages : receivedMessages
    const match = Array.isArray(source) ? source.find((m: any) => String(m?.id) === messageId) : null
    if (!match) return

    setSelectedMessage(match)
    setShowEditModal(false)

    if (action === 'reply' && String(match?.recipient_id ?? '') === String(user?.id ?? '')) {
      setShowMessageModal(false)
      setShowReplyModal(true)
      return
    }

    setShowReplyModal(false)
    setShowMessageModal(true)
  }, [messages, receivedMessages, searchParams, user?.id])

  useEffect(() => {
    if (!showNewMessageModal) return
    void (async () => {
      const recipients = await InternalMessagingService.getAdminRecipients()
      if (recipients) {
        setAdminRecipients({ adminId: recipients.adminId, superAdminId: recipients.superAdminId })
      }
    })()
  }, [showNewMessageModal])

  // Charger les infos de l'expéditeur quand un message est sélectionné
  useEffect(() => {
    if (selectedMessage) {
      loadSenderInfo(selectedMessage.sender_id)
      // Marquer comme lu si c'est un message reçu
      if (selectedMessage.recipient_id === user?.id && !selectedMessage.is_read) {
        markAsRead(selectedMessage.id)
      }
    }
  }, [selectedMessage])

  const loadSenderInfo = async (senderId: string) => {
    const info = await getParticipantInfo(senderId)
    setSenderInfo(info)
  }

  const handleSendMessage = async () => {
    if (!newMessageSubject.trim() || !newMessageContent.trim()) {
      return
    }

    setIsSendingMessage(true)

    const recipients = adminRecipients ?? (await InternalMessagingService.getAdminRecipients())
    const targetId = adminTarget === 'admin' ? recipients?.adminId : recipients?.superAdminId
    const fallbackId = recipients?.recipientId
    const adminId = String(targetId ?? fallbackId ?? '').trim()

    if (!adminId) {
      setIsSendingMessage(false)
      return
    }

    const success = await sendMessage(
      adminId,
      newMessageSubject,
      newMessageContent,
      {
        priority: newMessagePriority as any,
        category: newMessageCategory as any,
        type: 'internal'
      }
    )

    if (success) {
      setNewMessageSubject('')
      setNewMessageContent('')
      setNewMessageCategory('general')
      setNewMessagePriority('normal')
      setShowNewMessageModal(false)
    }

    setIsSendingMessage(false)
  }

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return

    setIsReplying(true)

    const success = await replyToMessage(selectedMessage.id, replyContent)

    if (success) {
      setReplyContent('')
      setShowReplyModal(false)
      setShowMessageModal(false)
    }

    setIsReplying(false)
  }

  /**
   * Ouvre le modal d'édition d'un message (uniquement expéditeur).
   */
  const handleOpenEdit = (message: any) => {
    if (!message) return
    setSelectedMessage(message)
    setEditSubject(String(message.subject ?? ''))
    setEditContent(String(message.content ?? ''))
    setEditCategory(String(message.category ?? 'general'))
    setEditPriority(String(message.priority ?? 'normal'))
    setShowEditModal(true)
  }

  /**
   * Sauvegarde l'édition du message (sync DB).
   */
  const handleUpdateMessage = async () => {
    if (!selectedMessage) return
    if (!editSubject.trim() || !editContent.trim()) return

    setIsUpdatingMessage(true)
    const ok = await updateMessage({
      messageId: selectedMessage.id,
      subject: editSubject,
      content: editContent,
      category: editCategory,
      priority: editPriority
    })

    if (ok) {
      await refreshMessages()
      setShowEditModal(false)
    }

    setIsUpdatingMessage(false)
  }

  /**
   * Copie le contenu du message dans le presse-papiers.
   */
  const handleCopyContent = async (message: any) => {
    try {
      const text = String(message?.content ?? '')
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.warn('Copie impossible:', error)
    }
  }

  const handleArchive = async () => {
    if (selectedMessage) {
      await archiveMessage(selectedMessage.id)
      setShowMessageModal(false)
    }
  }

  const handleDelete = async () => {
    if (selectedMessage && confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      await deleteMessage(selectedMessage.id)
      setShowMessageModal(false)
    }
  }

  const handleOpenMessage = (message: any) => {
    setSelectedMessage(message)
    setShowMessageModal(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`
    if (diffDays < 365) return `Il y a ${Math.ceil(diffDays / 30)} mois`
    return date.toLocaleDateString('fr-FR')
  }

  const handleExportMessages = () => {
    const csvContent = [
      ['ID', 'De', 'Sujet', 'Contenu', 'Date', 'Priorité', 'Statut', 'Lu'],
      ...filteredMessages.map(msg => [
        msg.id,
        msg.sender_id === user?.id ? 'Vous' : 'Administration',
        msg.subject,
        msg.content,
        formatDate(msg.created_at),
        msg.priority,
        msg.status,
        msg.is_read ? 'Oui' : 'Non'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Messages-Internes-${new Date().toISOString().split('T')[0]}.csv`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Filtrer les messages
  const safeMessages = Array.isArray(messages) ? messages : []
  const sentMessagesCount = safeMessages.filter(m => m?.sender_id === user?.id).length
  const importantMessagesCount = safeMessages.filter(m => Boolean(m.is_important)).length

  const filteredMessages = receivedMessages
    .filter(msg => {
      const matchesSearch = searchTerm === '' || 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === 'all' ||
        String(msg.category ?? '').toLowerCase() === String(categoryFilter).toLowerCase()
      const matchesPriority = priorityFilter === 'all' || msg.priority === priorityFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'unread' && !msg.is_read) ||
        (statusFilter === 'read' && msg.is_read) ||
        msg.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus
    })

  return (
    <div className="space-y-6">
      {/* Indicateur de synchronisation */}
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Synchronisation...</span>
        </div>
      )}

      {/* En-tête de la messagerie */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <span className="text-blue-800">Messagerie Interne</span>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowNewMessageModal(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau message
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportMessages}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Communiquez avec l'équipe d'administration - Synchronisé en temps réel
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistiques de la messagerie */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Messages Reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-900">{receivedMessages.length}</div>
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">Total des messages</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Non Lus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-900">{unreadCount}</div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-blue-600 mt-2">Messages en attente</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Messages Envoyés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-900">{sentMessagesCount}</div>
              <Send className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-purple-600 mt-2">Vers l'administration</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Importants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-900">{importantMessagesCount}</div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-600 mt-2">Messages marqués importants</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtres et Recherche</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshMessages}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                <Check className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Recherchez et filtrez vos messages internes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
              {/* Barre de recherche */}
              <div className="relative">
                <Label className="text-sm font-medium mb-2 block">Recherche</Label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="🔍 Rechercher dans vos messages..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filtre Catégorie */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Catégorie</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="account">Compte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtre Priorité */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Priorité</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtre Statut */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="unread">Non lu</SelectItem>
                    <SelectItem value="read">Lu</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600">
                {filteredMessages.length} message(s) trouvé(s)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages Internes</CardTitle>
          <CardDescription>Gérez vos conversations avec l'équipe d'administration</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="text-gray-500 mt-2">Chargement des messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun message trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <Card key={message.id} className={`hover:shadow-md transition-shadow ${
                  !message.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            message.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
                            message.priority === 'high' ? 'bg-red-500' :
                            message.priority === 'normal' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          {Boolean(message.is_important) && <Star className="w-4 h-4 text-yellow-500" />}
                          <Badge variant="outline" className="text-xs">
                            {message.category === 'support' ? 'Support' : 
                             message.category === 'technical' ? 'Technique' :
                             message.category === 'billing' ? 'Facturation' : 
                             message.category === 'account' ? 'Compte' : 'Général'}
                          </Badge>
                          <Badge variant={message.sender_id === user?.id ? 'secondary' : 'default'} className="text-xs">
                            {message.sender_id === user?.id ? 'Vous' : 'Administration'}
                          </Badge>
                          {!message.is_read && message.recipient_id === user?.id && (
                            <Badge className="bg-blue-500 text-white text-xs animate-pulse">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg">{message.subject}</h3>
                          <p className="text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDate(message.created_at)}</span>
                          <span>•</span>
                          <span>Priorité: {
                            message.priority === 'urgent' ? 'Urgente' :
                            message.priority === 'high' ? 'Haute' : 
                            message.priority === 'normal' ? 'Normale' : 'Basse'
                          }</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-200">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(message)}
                              disabled={message.sender_id !== user?.id}
                            >
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMessage(message)
                                setShowReplyModal(true)
                              }}
                              disabled={message.sender_id === user?.id}
                            >
                              Répondre
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleImportant(message.id, !Boolean(message.is_important))}>
                              {message.is_important ? 'Retirer important' : 'Marquer important'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => archiveMessage(message.id)}>Archiver</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyContent(message)}>Copier le contenu</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
                                  void deleteMessage(message.id)
                                }
                              }}
                            >
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenMessage(message)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-200"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ouvrir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de nouveau message */}
      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Nouveau Message Interne
            </DialogTitle>
            <DialogDescription>Envoyez un message à l'équipe d'administration</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="adminTarget">Destinataire</Label>
              <Select value={adminTarget} onValueChange={(value: any) => setAdminTarget(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin" disabled={!adminRecipients?.superAdminId}>
                    Super Admin
                  </SelectItem>
                  <SelectItem value="admin" disabled={!adminRecipients?.adminId}>
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="messageSubject">Sujet *</Label>
              <Input
                id="messageSubject"
                placeholder="Entrez le sujet de votre message..."
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="messageCategory">Catégorie</Label>
                <Select value={newMessageCategory} onValueChange={setNewMessageCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="account">Compte utilisateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="messagePriority">Priorité</Label>
                <Select value={newMessagePriority} onValueChange={setNewMessagePriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="messageContent">Contenu *</Label>
              <Textarea
                id="messageContent"
                placeholder="Entrez le contenu de votre message..."
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                className="mt-1 min-h-[150px]"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewMessageModal(false)} disabled={isSendingMessage}>
                Annuler
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !newMessageSubject.trim() || !newMessageContent.trim()}
                className="bg-[#ff6600] hover:bg-[#e65c00]"
              >
                {isSendingMessage ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de modification de message */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le message</DialogTitle>
            <DialogDescription>Modifiez votre message et synchronisez la mise à jour en base.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editSubject">Sujet *</Label>
              <Input
                id="editSubject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCategory">Catégorie</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="account">Compte utilisateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editPriority">Priorité</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="editContent">Contenu *</Label>
              <Textarea
                id="editContent"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="mt-1 min-h-[150px]"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isUpdatingMessage}>
                Annuler
              </Button>
              <Button
                onClick={handleUpdateMessage}
                disabled={isUpdatingMessage || !editSubject.trim() || !editContent.trim()}
                className="bg-[#ff6600] hover:bg-[#e65c00]"
              >
                {isUpdatingMessage ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation de message */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedMessage?.subject}</span>
              <div className="flex items-center space-x-2">
                {selectedMessage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(selectedMessage)}
                        disabled={selectedMessage.sender_id !== user?.id}
                      >
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setShowReplyModal(true)
                          setShowMessageModal(false)
                        }}
                        disabled={selectedMessage.sender_id === user?.id}
                      >
                        Répondre
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleImportant(selectedMessage.id, !Boolean(selectedMessage.is_important))}
                      >
                        {selectedMessage.is_important ? 'Retirer important' : 'Marquer important'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleArchive}>Archiver</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyContent(selectedMessage)}>Copier le contenu</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete}>Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyModal(true)
                    setShowMessageModal(false)
                  }}
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Répondre
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                >
                  <Archive className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">
                    {senderInfo?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{senderInfo?.name || 'Administration'}</p>
                  <p className="text-sm text-gray-500">{formatDate(selectedMessage.created_at)}</p>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              
              <div className="flex items-center space-x-2 pt-3 border-t">
                <Badge variant="outline">
                  {selectedMessage.category}
                </Badge>
                <Badge variant="outline">
                  Priorité: {selectedMessage.priority}
                </Badge>
                <Badge variant={selectedMessage.is_read ? 'secondary' : 'default'}>
                  {selectedMessage.is_read ? 'Lu' : 'Non lu'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de réponse */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Répondre au message</DialogTitle>
            <DialogDescription>
              Re: {selectedMessage?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="replyContent">Votre réponse</Label>
              <Textarea
                id="replyContent"
                placeholder="Entrez votre réponse..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mt-1 min-h-[150px]"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowReplyModal(false)}
                disabled={isReplying}
              >
                Annuler
              </Button>
              <Button
                onClick={handleReply}
                disabled={isReplying || !replyContent.trim()}
                className="bg-[#ff6600] hover:bg-[#e65c00]"
              >
                {isReplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer la réponse
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
