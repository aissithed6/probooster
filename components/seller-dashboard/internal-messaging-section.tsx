"use client"

import { useState, useEffect } from 'react'
import { 
  Mail, Plus, Download, Bell, Clock, Star, Search, Filter, TrendingUp, 
  Eye, Check, RefreshCw, X, MoreVertical, Send, Archive, Trash2
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useNotifications } from '@/components/ui/modern-notification'

interface InternalMessage {
  id: string
  from: 'admin' | 'seller'
  subject: string
  content: string
  timestamp: string
  isRead: boolean
  priority: 'high' | 'medium' | 'low'
  category: 'support' | 'technical' | 'billing' | 'general' | 'account'
  status: 'sent' | 'delivered' | 'read' | 'archived'
}

export default function InternalMessagingSection() {
  const { addNotification } = useNotifications()
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [newMessageSubject, setNewMessageSubject] = useState('')
  const [newMessageContent, setNewMessageContent] = useState('')
  const [newMessageCategory, setNewMessageCategory] = useState('general')
  const [newMessagePriority, setNewMessagePriority] = useState('medium')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [forwardRecipient, setForwardRecipient] = useState('')
  const [forwardMessage, setForwardMessage] = useState('')
  const [isForwarding, setIsForwarding] = useState(false)
  
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([
    {
      id: 'msg-1',
      from: 'admin',
      subject: 'Bienvenue sur la marketplace !',
      content: 'Nous sommes ravis de vous accueillir sur notre plateforme. N\'hésitez pas à nous contacter pour toute question.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true,
      priority: 'low',
      category: 'general',
      status: 'read'
    },
    {
      id: 'msg-2',
      from: 'admin',
      subject: 'Votre compte a été vérifié',
      content: 'Félicitations ! Votre compte vendeur a été vérifié et approuvé. Vous pouvez maintenant commencer à vendre.',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true,
      priority: 'medium',
      category: 'account',
      status: 'read'
    },
    {
      id: 'msg-3',
      from: 'admin',
      subject: 'Nouvelle fonctionnalité disponible',
      content: 'Nous avons ajouté de nouvelles fonctionnalités pour améliorer votre expérience de vente.',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      isRead: false,
      priority: 'low',
      category: 'technical',
      status: 'delivered'
    }
  ])

  // États pour les filtres et la recherche
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Appliquer automatiquement les filtres quand ils changent
  useEffect(() => {
    // Les filtres sont appliqués automatiquement via getFilteredMessages()
    // Cette fonction est appelée à chaque rendu et filtre en temps réel
  }, [searchTerm, categoryFilter, priorityFilter, statusFilter])

  const handleSendMessage = () => {
    if (!newMessageSubject.trim() || !newMessageContent.trim()) {
      addNotification({
        type: "error",
        title: "Champs manquants",
        message: "Veuillez remplir tous les champs obligatoires",
      })
      return
    }

    setIsSendingMessage(true)

    setTimeout(() => {
      const newMessage: InternalMessage = {
        id: `msg-${Date.now()}`,
        from: 'seller',
        subject: newMessageSubject,
        content: newMessageContent,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: newMessagePriority as 'high' | 'medium' | 'low',
        category: newMessageCategory as 'support' | 'technical' | 'billing' | 'general' | 'account',
        status: 'sent'
      }

      setInternalMessages(prev => [newMessage, ...prev])
      
      setNewMessageSubject('')
      setNewMessageContent('')
      setNewMessageCategory('general')
      setNewMessagePriority('medium')
      setShowNewMessageModal(false)
      setIsSendingMessage(false)
      
      addNotification({
        type: "success",
        title: "Succès !",
        message: "Message envoyé avec succès !",
      })
    }, 1500)
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
      ['ID', 'De', 'Sujet', 'Contenu', 'Date', 'Priorité', 'Catégorie', 'Statut', 'Lu'],
      ...internalMessages.map(msg => [
        msg.id,
        msg.from === 'admin' ? 'Administration' : 'Vous',
        msg.subject,
        msg.content,
        formatDate(msg.timestamp),
        msg.priority === 'high' ? 'Haute' : msg.priority === 'medium' ? 'Moyenne' : 'Basse',
        msg.category === 'support' ? 'Support' : 
        msg.category === 'technical' ? 'Technique' :
        msg.category === 'billing' ? 'Facturation' : 'Général',
                 msg.status === 'sent' ? 'Envoyé' : 
         msg.status === 'delivered' ? 'Livré' : 
         msg.status === 'archived' ? 'Archivé' : 'Lu',
        msg.isRead ? 'Oui' : 'Non'
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
    
    addNotification({
      type: "success",
      title: "Export terminé !",
      message: "Vos messages ont été exportés avec succès",
    })
  }

  const getFilteredMessages = () => {
    return internalMessages.filter(msg => {
      const matchesSearch = searchTerm === '' || 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === 'all' || msg.category === categoryFilter
      const matchesPriority = priorityFilter === 'all' || msg.priority === priorityFilter
      const matchesStatus = statusFilter === 'all' || msg.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus
    })
  }

  // Obtenir le nombre de messages filtrés pour l'affichage en temps réel
  const filteredMessagesCount = getFilteredMessages().length

  const handleApplyFilters = () => {
    const filteredCount = getFilteredMessages().length
    addNotification({
      type: "info",
      title: "Filtres appliqués !",
      message: `${filteredCount} message(s) trouvé(s)`,
    })
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setCategoryFilter('all')
    setPriorityFilter('all')
    setStatusFilter('all')
    addNotification({
      type: "info",
      title: "Filtres réinitialisés !",
      message: "Tous les filtres ont été remis à zéro",
    })
  }

  const handleRefreshMessages = () => {
    setTimeout(() => {
      const hasNewMessages = Math.random() > 0.7
      
      if (hasNewMessages) {
        const newMessage: InternalMessage = {
          id: `msg-${Date.now()}`,
          from: 'admin',
          subject: 'Nouvelle notification système',
          content: 'Un nouveau message système a été reçu.',
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'low',
          category: 'general',
          status: 'delivered'
        }
        
        setInternalMessages(prev => [newMessage, ...prev])
        addNotification({
          type: "success",
          title: "Nouveau message !",
          message: "Un nouveau message système a été reçu !",
        })
      } else {
        addNotification({
          type: "info",
          title: "Aucun nouveau message",
          message: "Aucun nouveau message pour le moment",
        })
      }
    }, 1500)
  }

  const handleMarkAllAsRead = () => {
    setInternalMessages(prev => 
      prev.map(msg => ({ ...msg, isRead: true, status: 'read' }))
    )
    
    setTimeout(() => {
      addNotification({
        type: "success",
        title: "Messages marqués !",
        message: "Tous les messages ont été marqués comme lus !",
      })
    }, 1000)
  }

  const handleOpenMessage = (messageId: string) => {
    const message = internalMessages.find(msg => msg.id === messageId)
    if (message) {
      setSelectedMessage(message)
      setShowMessageModal(true)
      
      // Marquer le message comme lu
      setInternalMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true, status: 'read' }
            : msg
        )
      )
    }
  }

  const handleFilterMessages = () => {
    const filteredCount = getFilteredMessages().length
    addNotification({
      type: "info",
      title: "Filtrage terminé !",
      message: `${filteredCount} message(s) trouvé(s) avec les filtres sélectionnés`,
    })
  }

  const handleSortMessages = () => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const sortedMessages = [...internalMessages].sort((a, b) => {
      // Tri par priorité d'abord
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      
      // Si même priorité, tri par date (plus récent en premier)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    
    setInternalMessages(sortedMessages)
    addNotification({
      type: "success",
      title: "Messages triés !",
      message: "Vos messages ont été triés par priorité puis par date",
    })
  }

  // Fonction pour répondre à un message
  const handleReply = () => {
    if (!replyContent.trim()) {
      addNotification({
        type: "error",
        title: "Contenu manquant",
        message: "Veuillez saisir votre réponse",
      })
      return
    }

    setIsReplying(true)

    setTimeout(() => {
      const replyMessage: InternalMessage = {
        id: `msg-${Date.now()}`,
        from: 'seller',
        subject: `Re: ${selectedMessage?.subject}`,
        content: replyContent,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: selectedMessage?.priority || 'medium',
        category: selectedMessage?.category || 'general',
        status: 'sent'
      }

      setInternalMessages(prev => [replyMessage, ...prev])
      setReplyContent('')
      setShowReplyModal(false)
      setIsReplying(false)
      
      addNotification({
        type: "success",
        title: "Réponse envoyée !",
        message: "Votre réponse a été envoyée avec succès",
      })
    }, 1500)
  }

  // Fonction pour transférer un message
  const handleForward = () => {
    if (!forwardRecipient.trim() || !forwardMessage.trim()) {
      addNotification({
        type: "error",
        title: "Champs manquants",
        message: "Veuillez remplir tous les champs",
      })
      return
    }

    setIsForwarding(true)

    setTimeout(() => {
      const forwardMsg: InternalMessage = {
        id: `msg-${Date.now()}`,
        from: 'seller',
        subject: `Fwd: ${selectedMessage?.subject}`,
        content: `Message transféré à: ${forwardRecipient}\n\nMessage original:\n${selectedMessage?.content}\n\nNote: ${forwardMessage}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: selectedMessage?.priority || 'medium',
        category: selectedMessage?.category || 'general',
        status: 'sent'
      }

      setInternalMessages(prev => [forwardMsg, ...prev])
      setForwardRecipient('')
      setForwardMessage('')
      setShowForwardModal(false)
      setIsForwarding(false)
      
      addNotification({
        type: "success",
        title: "Message transféré !",
        message: "Le message a été transféré avec succès",
      })
    }, 1500)
  }

  // Fonction pour archiver un message
  const handleArchive = () => {
    if (selectedMessage) {
      setInternalMessages(prev => 
        prev.map(msg => 
          msg.id === selectedMessage.id 
            ? { ...msg, status: 'archived' as any }
            : msg
        )
      )
      
      addNotification({
        type: "success",
        title: "Message archivé !",
        message: "Le message a été archivé avec succès",
      })
      
      setShowMessageModal(false)
    }
  }

  // Fonction pour marquer comme important
  const handleMarkImportant = () => {
    if (selectedMessage) {
      setInternalMessages(prev => 
        prev.map(msg => 
          msg.id === selectedMessage.id 
            ? { ...msg, priority: 'high' as any }
            : msg
        )
      )
      
      addNotification({
        type: "success",
        title: "Priorité mise à jour !",
        message: "Le message a été marqué comme important",
      })
    }
  }

  // Fonction pour supprimer un message
  const handleDelete = () => {
    if (selectedMessage) {
      setInternalMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id))
      
      addNotification({
        type: "success",
        title: "Message supprimé !",
        message: "Le message a été supprimé avec succès",
      })
      
      setShowMessageModal(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la messagerie */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <span className="text-blue-800">Messagerie Interne</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowNewMessageModal(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Message
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
            Communiquez avec l'équipe d'administration et gérez vos messages internes
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
              <div className="text-2xl font-bold text-green-900">{internalMessages.length}</div>
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
              <div className="text-2xl font-bold text-blue-900">
                {internalMessages.filter(msg => !msg.isRead).length}
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-blue-600 mt-2">Messages en attente</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Réponse Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-900">2.3h</div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-purple-600 mt-2">Temps de réponse</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-900">4.8/5</div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-600 mt-2">Note globale</p>
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
                onClick={handleFilterMessages}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSortMessages}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trier
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Recherchez et filtrez vos messages internes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barre de recherche et filtres sur la même ligne */}
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
                    <SelectItem value="high">Haute priorité</SelectItem>
                    <SelectItem value="medium">Moyenne priorité</SelectItem>
                    <SelectItem value="low">Basse priorité</SelectItem>
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
                                         <SelectItem value="sent">Envoyé</SelectItem>
                     <SelectItem value="delivered">Livré</SelectItem>
                     <SelectItem value="read">Lu</SelectItem>
                     <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Boutons d'action des filtres */}
                         <div className="flex items-center justify-between pt-2">
               <div className="text-sm text-gray-600">
                 {filteredMessagesCount} message(s) trouvé(s)
               </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetFilters}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleApplyFilters}
                  className="border-blue-300 text-blue-700 hover:bg-blue-200"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Appliquer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Messages Internes</span>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshMessages}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
                className="border-blue-300 text-blue-700 hover:bg-blue-200"
              >
                <Check className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Gérez vos conversations avec l'équipe d'administration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getFilteredMessages().map((message) => (
              <Card key={message.id} className={`hover:shadow-md transition-shadow ${
                !message.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          message.priority === 'high' ? 'bg-red-500' :
                          message.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <Badge variant="outline" className="text-xs">
                          {message.category === 'support' ? 'Support' : 
                           message.category === 'technical' ? 'Technique' :
                           message.category === 'billing' ? 'Facturation' : 
                           message.category === 'account' ? 'Compte' : 'Général'}
                        </Badge>
                        <Badge variant={message.from === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {message.from === 'admin' ? 'Administration' : 'Vous'}
                        </Badge>
                        {!message.isRead && (
                          <Badge className="bg-blue-500 text-white text-xs animate-pulse">
                            Nouveau
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            message.priority === 'high' 
                              ? 'border-red-500 text-red-600' : 
                              message.priority === 'medium' 
                              ? 'border-yellow-500 text-yellow-600' : 
                              'border-green-500 text-green-600'
                          }`}
                        >
                          {message.priority === 'high' ? 'Haute' : 
                           message.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg">{message.subject}</h3>
                        <p className="text-gray-600 mt-1">{message.content}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(message.timestamp)}</span>
                        <span>•</span>
                        <span>Priorité: {message.priority === 'high' ? 'Haute' : 
                                         message.priority === 'medium' ? 'Moyenne' : 'Basse'}</span>
                        <span>•</span>
                                                 <span>Statut: {
                           message.status === 'sent' ? 'Envoyé' :
                           message.status === 'delivered' ? 'Livré' : 
                           message.status === 'archived' ? 'Archivé' : 'Lu'
                         }</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenMessage(message.id)}
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
            <DialogDescription>
              Envoyez un message à l'équipe d'administration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="messageContent">Contenu *</Label>
              <Textarea
                id="messageContent"
                placeholder="Tapez votre message..."
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                className="mt-1 min-h-[120px]"
                rows={6}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowNewMessageModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessageSubject.trim() || !newMessageContent.trim() || isSendingMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSendingMessage ? 'Envoi...' : 'Envoyer le Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation des messages */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Détails du Message
            </DialogTitle>
            <DialogDescription>
              Visualisation complète du message interne
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6">
              {/* En-tête du message */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedMessage.subject}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedMessage.category === 'support' ? 'Support' : 
                       selectedMessage.category === 'technical' ? 'Technique' :
                       selectedMessage.category === 'billing' ? 'Facturation' : 
                       selectedMessage.category === 'account' ? 'Compte' : 'Général'}
                    </Badge>
                    <Badge variant={selectedMessage.from === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {selectedMessage.from === 'admin' ? 'Administration' : 'Vous'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        selectedMessage.priority === 'high' ? 'border-red-500 text-red-600' : 
                        selectedMessage.priority === 'medium' ? 'border-yellow-500 text-yellow-600' : 
                        'border-green-500 text-green-600'
                      }`}
                    >
                      {selectedMessage.priority === 'high' ? 'Haute' : 
                       selectedMessage.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        selectedMessage.status === 'sent' ? 'border-blue-500 text-blue-600' :
                        selectedMessage.status === 'delivered' ? 'border-yellow-500 text-yellow-600' : 
                        'border-green-500 text-green-600'
                      }`}
                    >
                      {selectedMessage.status === 'sent' ? 'Envoyé' :
                       selectedMessage.status === 'delivered' ? 'Livré' : 'Lu'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>📅 {formatDate(selectedMessage.timestamp)}</span>
                  <span>•</span>
                  <span>👤 {selectedMessage.from === 'admin' ? 'Administration' : 'Vous'}</span>
                  <span>•</span>
                  <span>📊 Priorité: {selectedMessage.priority === 'high' ? 'Haute' : 
                                       selectedMessage.priority === 'medium' ? 'Moyenne' : 'Basse'}</span>
                  <span>•</span>
                                           <span>📋 Statut: {
                           selectedMessage.status === 'sent' ? 'Envoyé' :
                           selectedMessage.status === 'delivered' ? 'Livré' : 
                           selectedMessage.status === 'archived' ? 'Archivé' : 'Lu'
                         }</span>
                </div>
              </div>

              {/* Contenu du message */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">Contenu du message :</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>

              {/* Actions sur le message */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Message {selectedMessage.isRead ? 'lu' : 'non lu'}
                </div>
                <div className="flex items-center space-x-2">
                  {/* Bouton Répondre */}
                  {selectedMessage.from === 'admin' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowReplyModal(true)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-200"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Répondre
                    </Button>
                  )}
                  
                  {/* Bouton Transférer */}
                  <Button
                    variant="outline"
                    onClick={() => setShowForwardModal(true)}
                    className="border-purple-300 text-purple-700 hover:bg-purple-200"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Transférer
                  </Button>
                  
                  {/* Bouton Marquer Important */}
                  {selectedMessage.priority !== 'high' && (
                    <Button
                      variant="outline"
                      onClick={handleMarkImportant}
                      className="border-orange-300 text-orange-700 hover:bg-orange-200"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Important
                    </Button>
                  )}
                  
                  {/* Bouton Archiver */}
                  {selectedMessage.status !== 'archived' && (
                    <Button
                      variant="outline"
                      onClick={handleArchive}
                      className="border-gray-300 text-gray-700 hover:bg-gray-200"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archiver
                    </Button>
                  )}
                  
                  {/* Bouton Supprimer */}
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-300 text-red-700 hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                  
                  {/* Bouton Fermer */}
                  <Button
                    variant="outline"
                    onClick={() => setShowMessageModal(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de réponse */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Répondre au Message
            </DialogTitle>
            <DialogDescription>
              Répondez au message de l'administration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Message original */}
            {selectedMessage && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Message original :</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>De :</strong> {selectedMessage.from === 'admin' ? 'Administration' : 'Vous'}</p>
                  <p><strong>Sujet :</strong> {selectedMessage.subject}</p>
                  <p><strong>Contenu :</strong> {selectedMessage.content}</p>
                </div>
              </div>
            )}

            {/* Contenu de la réponse */}
            <div>
              <Label htmlFor="replyContent">Votre réponse *</Label>
              <Textarea
                id="replyContent"
                placeholder="Tapez votre réponse..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mt-1 min-h-[120px]"
                rows={6}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowReplyModal(false)
                setReplyContent('')
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              onClick={handleReply}
              disabled={!replyContent.trim() || isReplying}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isReplying ? 'Envoi...' : 'Envoyer la Réponse'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de transfert */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600" />
              Transférer le Message
            </DialogTitle>
            <DialogDescription>
              Transférez ce message à un autre destinataire
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Message original */}
            {selectedMessage && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Message à transférer :</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>De :</strong> {selectedMessage.from === 'admin' ? 'Administration' : 'Vous'}</p>
                  <p><strong>Sujet :</strong> {selectedMessage.subject}</p>
                  <p><strong>Contenu :</strong> {selectedMessage.content}</p>
                </div>
              </div>
            )}

            {/* Destinataire */}
            <div>
              <Label htmlFor="forwardRecipient">Destinataire *</Label>
              <Input
                id="forwardRecipient"
                placeholder="Nom ou email du destinataire..."
                value={forwardRecipient}
                onChange={(e) => setForwardRecipient(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Message de transfert */}
            <div>
              <Label htmlFor="forwardMessage">Note de transfert *</Label>
              <Textarea
                id="forwardMessage"
                placeholder="Ajoutez une note expliquant pourquoi vous transférez ce message..."
                value={forwardMessage}
                onChange={(e) => setForwardMessage(e.target.value)}
                className="mt-1 min-h-[100px]"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowForwardModal(false)
                setForwardRecipient('')
                setForwardMessage('')
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              onClick={handleForward}
              disabled={!forwardRecipient.trim() || !forwardMessage.trim() || isForwarding}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isForwarding ? 'Transfert...' : 'Transférer le Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
