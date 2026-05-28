"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Target,
  Users,
  Calendar,
  DollarSign,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react'
import { useNotifications } from '@/components/ui/modern-notification'

// Interface pour les demandes de boostage
interface BoostingRequest {
  id: string
  vendorId: string
  vendorName: string
  vendorEmail: string
  type: 'recommandation' | 'banniere' | 'whatsapp'
  status: 'pending' | 'approved' | 'rejected'
  requestDate: string
  approvalDate?: string
  approvedBy?: string
  rejectionReason?: string
  
  // Détails du boostage
  selectedPages: string[]
  startDate: string
  endDate: string
  duration: number
  autoRenewal: boolean
  cost: number
  
  // Détails spécifiques
  bannerImage?: File
  bannerTitle?: string
  bannerDescription?: string
  
  targetCount?: number
  targetCountry?: string
  targetAge?: string
  targetProfession?: string
  whatsappImage?: File
  whatsappMessage?: string
  whatsappTitle?: string
  whatsappDescription?: string
  whatsappLink?: string
  senderWhatsapp?: string
}

export default function BoostingApproval() {
  const { addNotification } = useNotifications()
  const [boostingRequests, setBoostingRequests] = useState<BoostingRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<BoostingRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionModal, setShowRejectionModal] = useState(false)

  // Données simulées
  useEffect(() => {
    const mockRequests: BoostingRequest[] = [
      {
        id: '1',
        vendorId: 'vendor1',
        vendorName: 'TechStore Plus',
        vendorEmail: 'techstore@example.com',
        type: 'recommandation',
        status: 'pending',
        requestDate: '2024-01-15T10:30:00Z',
        selectedPages: ['Page d\'accueil', 'Page produit', 'Meilleures ventes'],
        startDate: '2024-01-20',
        endDate: '2024-01-27',
        duration: 7,
        autoRenewal: false,
        cost: 87500
      },
      {
        id: '2',
        vendorId: 'vendor2',
        vendorName: 'Fashion Boutique',
        vendorEmail: 'fashion@example.com',
        type: 'banniere',
        status: 'pending',
        requestDate: '2024-01-15T11:15:00Z',
        selectedPages: ['Page d\'accueil', 'Page nouvelles arrivées'],
        startDate: '2024-01-18',
        endDate: '2024-01-25',
        duration: 7,
        autoRenewal: true,
        cost: 56000,
        bannerTitle: 'Collection Été 2024',
        bannerDescription: 'Découvrez nos nouvelles tendances avec des réductions jusqu\'à 50%'
      },
      {
        id: '3',
        vendorId: 'vendor3',
        vendorName: 'Electronics Pro',
        vendorEmail: 'electronics@example.com',
        type: 'whatsapp',
        status: 'pending',
        requestDate: '2024-01-15T12:00:00Z',
        selectedPages: ['WhatsApp'],
        startDate: '2024-01-19',
        endDate: '2024-01-26',
        duration: 7,
        autoRenewal: false,
        cost: 500,
        targetCount: 1000,
        targetCountry: 'Côte d\'Ivoire',
        targetAge: '18-35',
        targetProfession: 'Toutes',
        whatsappMessage: 'Bonjour ! Découvrez nos produits électroniques avec des prix imbattables !',
        whatsappTitle: 'Électroniques à Prix Réduits',
        whatsappDescription: 'Smartphones, ordinateurs et accessoires avec garantie',
        senderWhatsapp: '+225 01234567'
      }
    ]
    
    setBoostingRequests(mockRequests)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">En Attente</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Approuvé</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommandation':
        return <Target className="h-5 w-5 text-blue-600" />
      case 'banniere':
        return <ImageIcon className="h-5 w-5 text-green-600" />
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5 text-purple-600" />
      default:
        return <Zap className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recommandation':
        return 'Recommandation Ciblée'
      case 'banniere':
        return 'Bannière Visuelle'
      case 'whatsapp':
        return 'WhatsApp Marketing'
      default:
        return type
    }
  }

  const handleApprove = (requestId: string) => {
    setBoostingRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'approved' as const, 
              approvalDate: new Date().toISOString(),
              approvedBy: 'Administrateur'
            }
          : req
      )
    )
    
    addNotification({
      type: 'success',
      title: 'Boostage approuvé',
      message: 'La demande de boostage a été approuvée avec succès'
    })
  }

  const handleReject = (requestId: string) => {
    if (!rejectionReason.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez fournir une raison de rejet'
      })
      return
    }

    setBoostingRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'rejected' as const, 
              rejectionReason: rejectionReason,
              approvalDate: new Date().toISOString(),
              approvedBy: 'Administrateur'
            }
          : req
      )
    )
    
    setRejectionReason('')
    setShowRejectionModal(false)
    
    addNotification({
      type: 'success',
      title: 'Boostage rejeté',
      message: 'La demande de boostage a été rejetée'
    })
  }

  const openRejectionModal = (requestId: string) => {
    setSelectedRequest(boostingRequests.find(r => r.id === requestId) || null)
    setShowRejectionModal(true)
  }

  const pendingRequests = boostingRequests.filter(r => r.status === 'pending')
  const approvedRequests = boostingRequests.filter(r => r.status === 'approved')
  const rejectedRequests = boostingRequests.filter(r => r.status === 'rejected')

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Demandes de Boostage</h1>
          <p className="text-gray-600 mt-2">Approuvez ou rejetez les demandes de boostage des vendeurs</p>
        </div>
        
        {/* Statistiques rapides */}
        <div className="flex space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
            <div className="text-sm text-gray-600">Approuvées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
            <div className="text-sm text-gray-600">Rejetées</div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>En Attente</span>
            <Badge variant="secondary">{pendingRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Approuvées</span>
            <Badge variant="secondary">{approvedRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center space-x-2">
            <XCircle className="h-4 w-4" />
            <span>Rejetées</span>
            <Badge variant="secondary">{rejectedRequests.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Onglet En Attente */}
        <TabsContent value="pending" className="space-y-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande en attente</h3>
                <p className="text-gray-600">Toutes les demandes de boostage ont été traitées</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(request.type)}
                        <CardTitle className="text-lg">{getTypeLabel(request.type)}</CardTitle>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{request.vendorName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Demandé le {new Date(request.requestDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{request.cost.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Détails rapides */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Durée:</span>
                        <span className="ml-2 font-medium">{request.duration} jours</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Début:</span>
                        <span className="ml-2 font-medium">{new Date(request.startDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowDetailsModal(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openRejectionModal(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Onglet Approuvées */}
        <TabsContent value="approved" className="space-y-6">
          {approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande approuvée</h3>
                <p className="text-gray-600">Les demandes approuvées apparaîtront ici</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {approvedRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(request.type)}
                        <CardTitle className="text-lg">{getTypeLabel(request.type)}</CardTitle>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{request.vendorName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Approuvé le {request.approvalDate && new Date(request.approvalDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowDetailsModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Onglet Rejetées */}
        <TabsContent value="rejected" className="space-y-6">
          {rejectedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande rejetée</h3>
                <p className="text-gray-600">Les demandes rejetées apparaîtront ici</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {rejectedRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(request.type)}
                        <CardTitle className="text-lg">{getTypeLabel(request.type)}</CardTitle>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{request.vendorName}</span>
                      </div>
                      {request.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <span className="text-red-800 font-medium">Raison:</span> {request.rejectionReason}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowDetailsModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de détails */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest && getTypeIcon(selectedRequest.type)}
              <span>Détails de la demande de boostage</span>
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur la demande de boostage
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Informations du vendeur */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Informations du vendeur</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nom:</span>
                    <span className="ml-2 font-medium">{selectedRequest.vendorName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{selectedRequest.vendorEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date de demande:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedRequest.requestDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Statut:</span>
                    <span className="ml-2">{getStatusBadge(selectedRequest.status)}</span>
                  </div>
                </div>
              </div>

              {/* Détails du boostage */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Configuration du boostage</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Type:</span>
                    <span className="ml-2 font-medium">{getTypeLabel(selectedRequest.type)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Coût total:</span>
                    <span className="ml-2 font-medium">{selectedRequest.cost.toLocaleString()} FCFA</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Durée:</span>
                    <span className="ml-2 font-medium">{selectedRequest.duration} jours</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Renouvellement auto:</span>
                    <span className="ml-2 font-medium">{selectedRequest.autoRenewal ? 'Oui' : 'Non'}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Date de début:</span>
                    <span className="ml-2 font-medium">{new Date(selectedRequest.startDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Date de fin:</span>
                    <span className="ml-2 font-medium">{new Date(selectedRequest.endDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Pages sélectionnées */}
                {selectedRequest.selectedPages && selectedRequest.selectedPages.length > 0 && (
                  <div className="mt-4">
                    <span className="text-blue-600 text-sm">Pages sélectionnées:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRequest.selectedPages.map((page, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {page}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Détails spécifiques selon le type */}
              {selectedRequest.type === 'banniere' && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-3">Configuration de la bannière</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-green-600">Titre:</span>
                      <span className="ml-2 font-medium">{selectedRequest.bannerTitle}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Description:</span>
                      <span className="ml-2 font-medium">{selectedRequest.bannerDescription}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.type === 'whatsapp' && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-3">Configuration WhatsApp</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-purple-600">Nombre de cibles:</span>
                      <span className="ml-2 font-medium">{selectedRequest.targetCount}</span>
                    </div>
                    <div>
                      <span className="text-purple-600">Pays cible:</span>
                      <span className="ml-2 font-medium">{selectedRequest.targetCountry}</span>
                    </div>
                    <div>
                      <span className="text-purple-600">Âge cible:</span>
                      <span className="ml-2 font-medium">{selectedRequest.targetAge}</span>
                    </div>
                    <div>
                      <span className="text-purple-600">Profession cible:</span>
                      <span className="ml-2 font-medium">{selectedRequest.targetProfession}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-purple-600 text-sm">Message:</span>
                    <p className="mt-2 p-3 bg-white rounded border text-sm">{selectedRequest.whatsappMessage}</p>
                  </div>
                </div>
              )}

              {/* Actions si en attente */}
              {selectedRequest.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(selectedRequest.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDetailsModal(false)
                      openRejectionModal(selectedRequest.id)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de rejet */}
      <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>
              Veuillez fournir une raison pour le rejet de cette demande de boostage
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raison du rejet *</label>
              <textarea
                className="w-full mt-2 p-3 border rounded-md"
                rows={4}
                placeholder="Ex: Budget insuffisant, dates non disponibles..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowRejectionModal(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedRequest && handleReject(selectedRequest.id)}
                disabled={!rejectionReason.trim()}
              >
                Rejeter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
