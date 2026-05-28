"use client"

/**
 * Gestionnaire de messages éditables pour les admins
 */

import { useState, useEffect } from 'react'
import { 
  MessageSquare, Plus, Edit, Trash2, Save, X, Eye, EyeOff,
  AlertCircle, CheckCircle, Info, AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { EditableMessagesService, type EditableMessage } from '@/lib/services/editable-messages-service'

interface EditableMessagesManagerProps {
  userId: string
}

export default function EditableMessagesManager({ userId }: EditableMessagesManagerProps) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<EditableMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMessage, setEditingMessage] = useState<EditableMessage | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // États du formulaire
  const [formData, setFormData] = useState({
    message_key: '',
    title: '',
    content: '',
    message_type: 'info',
    is_active: true,
    display_locations: [] as string[]
  })

  // Emplacements disponibles
  const availableLocations = [
    { value: 'dashboard_client', label: 'Dashboard Client' },
    { value: 'dashboard_vendeur', label: 'Dashboard Vendeur' },
    { value: 'homepage', label: 'Page d\'accueil' },
    { value: 'catalog', label: 'Catalogue (liste produits)' },
    { value: 'product_page', label: 'Page Produit' },
    { value: 'cart', label: 'Panier' },
    { value: 'checkout', label: 'Paiement' },
    { value: 'wishlist', label: 'Liste de souhaits' }
  ]

  // Charger les messages
  useEffect(() => {
    loadMessages()
    
    // S'abonner aux changements
    const unsubscribe = EditableMessagesService.subscribeToAllMessages((updatedMessages) => {
      setMessages(updatedMessages)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loadMessages = async () => {
    setLoading(true)
    const data = await EditableMessagesService.getAllMessages()
    setMessages(data)
    setLoading(false)
  }

  const handleEdit = (message: EditableMessage) => {
    setEditingMessage(message)
    setFormData({
      message_key: message.message_key,
      title: message.title || '',
      content: message.content,
      message_type: message.message_type,
      is_active: message.is_active,
      display_locations: message.display_locations || []
    })
    setShowEditModal(true)
  }

  const handleCreate = () => {
    setEditingMessage(null)
    setFormData({
      message_key: '',
      title: '',
      content: '',
      message_type: 'info',
      is_active: true,
      display_locations: []
    })
    setShowCreateModal(true)
  }

  const handleSave = async () => {
    if (!formData.message_key || !formData.content) {
      toast({
        title: "Erreur",
        description: "La clé et le contenu sont obligatoires",
        variant: "destructive"
      })
      return
    }

    if (editingMessage) {
      // Mise à jour
      const result = await EditableMessagesService.updateMessage(
        editingMessage.id,
        {
          title: formData.title || null,
          content: formData.content,
          message_type: formData.message_type,
          is_active: formData.is_active,
          display_locations: formData.display_locations
        },
        userId
      )

      if (result) {
        toast({
          title: "Succès",
          description: "Message mis à jour avec succès"
        })
        setShowEditModal(false)
        loadMessages()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le message",
          variant: "destructive"
        })
      }
    } else {
      // Création
      const result = await EditableMessagesService.createMessage(
        formData.message_key,
        formData.title || null,
        formData.content,
        formData.message_type,
        formData.display_locations,
        userId
      )

      if (result) {
        toast({
          title: "Succès",
          description: "Message créé avec succès"
        })
        setShowCreateModal(false)
        loadMessages()
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer le message (la clé existe peut-être déjà)",
          variant: "destructive"
        })
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

    const result = await EditableMessagesService.deleteMessage(id)
    
    if (result) {
      toast({
        title: "Succès",
        description: "Message supprimé avec succès"
      })
      loadMessages()
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive"
      })
    }
  }

  const handleToggleActive = async (message: EditableMessage) => {
    const result = await EditableMessagesService.updateMessage(
      message.id,
      { 
        is_active: !message.is_active,
        display_locations: message.display_locations || []
      },
      userId
    )

    if (result) {
      toast({
        title: "Succès",
        description: `Message ${result.is_active ? 'activé' : 'désactivé'}`
      })
      loadMessages()
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du message",
        variant: "destructive"
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-700'
      case 'warning': return 'bg-yellow-100 text-yellow-700'
      case 'error': return 'bg-red-100 text-red-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Messages Éditables</span>
              </CardTitle>
              <CardDescription>
                Gérez les messages affichés aux utilisateurs
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Message
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Chargement...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun message
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className={`${!message.is_active ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(message.message_type)}
                          <Badge variant="outline" className={getTypeBadgeColor(message.message_type)}>
                            {message.message_type}
                          </Badge>
                          <Badge variant="outline">
                            {message.message_key}
                          </Badge>
                          {!message.is_active && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                              Désactivé
                            </Badge>
                          )}
                        </div>
                        
                        {message.title && (
                          <h4 className="font-semibold text-gray-900">
                            {message.title}
                          </h4>
                        )}
                        
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {message.content}
                        </p>
                        
                        {message.display_locations && message.display_locations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-xs text-gray-500 mr-1">Affiché sur:</span>
                            {message.display_locations.map((location) => (
                              <Badge key={location} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {availableLocations.find(l => l.value === location)?.label || location}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400">
                          Mis à jour: {new Date(message.updated_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(message)}
                          title={message.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {message.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(message)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(message.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal Édition */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Modifier le Message</DialogTitle>
            <DialogDescription>
              Modifiez le contenu du message affiché aux utilisateurs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1 max-h-[calc(90vh-110px)]">
            <div>
              <label className="text-sm font-medium text-gray-700">Clé du message</label>
              <Input
                value={formData.message_key}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Titre (optionnel)</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre du message"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Contenu *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Contenu du message"
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Utilisez des sauts de ligne pour formater le texte
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select
                value={formData.message_type}
                onValueChange={(value) => setFormData({ ...formData, message_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Emplacements d'affichage</label>
              <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                {availableLocations.map((location) => (
                  <div key={location.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-${location.value}`}
                      checked={formData.display_locations.includes(location.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            display_locations: [...formData.display_locations, location.value]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            display_locations: formData.display_locations.filter(l => l !== location.value)
                          })
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={`edit-${location.value}`} className="text-sm text-gray-700 cursor-pointer">
                      {location.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez où ce message doit être affiché
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Message actif
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Création */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Créer un Nouveau Message</DialogTitle>
            <DialogDescription>
              Créez un nouveau message personnalisé pour les utilisateurs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1 max-h-[calc(90vh-110px)]">
            <div>
              <label className="text-sm font-medium text-gray-700">Clé du message *</label>
              <Input
                value={formData.message_key}
                onChange={(e) => setFormData({ ...formData, message_key: e.target.value })}
                placeholder="ex: share_tips, welcome_message"
              />
              <p className="text-xs text-gray-500 mt-1">
                Identifiant unique (sans espaces, utilisez des underscores)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Titre (optionnel)</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre du message"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Contenu *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Contenu du message"
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select
                value={formData.message_type}
                onValueChange={(value) => setFormData({ ...formData, message_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Emplacements d'affichage</label>
              <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                {availableLocations.map((location) => (
                  <div key={location.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`create-${location.value}`}
                      checked={formData.display_locations.includes(location.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            display_locations: [...formData.display_locations, location.value]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            display_locations: formData.display_locations.filter(l => l !== location.value)
                          })
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={`create-${location.value}`} className="text-sm text-gray-700 cursor-pointer">
                      {location.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez où ce message doit être affiché
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
