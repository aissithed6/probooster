"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, Clock, CheckCircle, XCircle, Eye, Target, Users, Calendar, DollarSign, Image as ImageIcon, MessageCircle } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { BoostingCampaignManager, type BoostingCampaign } from '@/lib/services/marketing-service'
import { supabase } from '@/lib/supabase'

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
  selectedPages: string[]
  startDate: string
  endDate: string
  duration: number
  autoRenewal: boolean
  cost: number
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
  superAdminApproved?: boolean
  adminApproved?: boolean
}

export default function BoostingApproval() {
  const [boostingRequests, setBoostingRequests] = useState<BoostingRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<BoostingRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addNotification } = useNotifications()
  const { confirm } = useConfirm()
  const [userRole, setUserRole] = useState<'super_admin' | 'admin' | 'vendor' | 'client' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    void loadCurrentUserRole()
    void loadRequests()
  }, [])

  const loadCurrentUserRole = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      const uid = data?.user?.id || null
      setUserId(uid)
      if (!uid) return
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', uid)
        .single()
      const role = (userRow?.role as 'super_admin' | 'admin' | 'vendor' | 'client' | undefined) || null
      setUserRole(role)
    } catch (e) {
      console.error('Erreur récupération rôle utilisateur:', e)
    }
  }

  /**
   * Désapprouve une campagne approuvée.
   */
  const handleDisapprove = async (requestId: string) => {
    const accepted = await confirm({
      title: 'Désapprouver la campagne',
      message: 'Voulez-vous désapprouver cette campagne ? Elle repassera en attente de validation.',
      confirmText: 'Désapprouver',
      cancelText: 'Annuler',
      tone: 'destructive'
    })

    if (!accepted) return

    setLoading(true)
    try {
      let success = false

      if (userRole === 'super_admin') {
        success = await BoostingCampaignManager.disapproveAsSuperAdmin(requestId)
      } else if (userRole === 'admin') {
        success = await BoostingCampaignManager.disapproveAsAdmin(requestId)
      } else {
        addNotification({
          type: 'error',
          title: 'Non autorisé',
          message: "Votre rôle ne permet pas de désapprouver cette campagne."
        })
        return
      }

      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne désapprouvée',
          message: 'La campagne a été repassée en attente.'
        })
        await loadRequests()
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'La désapprobation a échoué. Veuillez réessayer.'
        })
      }
    } catch (error) {
      console.error('Erreur désapprobation campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de désapprouver la campagne pour le moment.'
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Charge les demandes de boostage depuis Supabase et met à jour l'état local.
   */
  const loadRequests = async () => {
    setLoading(true)
    try {
      const campaigns = await BoostingCampaignManager.getAllCampaigns()

      const mappedRequests = campaigns.map((campaign: BoostingCampaign): BoostingRequest => {
        const normalizedType: BoostingRequest['type'] =
          campaign.type === 'banner' ? 'banniere' : campaign.type === 'recommendation' ? 'recommandation' : 'whatsapp'

        const normalizedStatus: BoostingRequest['status'] =
          campaign.status === 'pending'
            ? 'pending'
            : campaign.status === 'rejected'
              ? 'rejected'
              : 'approved'

        return {
          id: campaign.id,
          vendorId: campaign.vendor_id,
          vendorName: campaign.vendorName || 'Vendeur inconnu',
          vendorEmail: campaign.vendorEmail || 'Non renseigné',
          type: normalizedType,
          status: normalizedStatus,
          requestDate: campaign.created_at?.split('T')[0] || '',
          approvalDate: campaign.updated_at?.split('T')[0],
          approvedBy: normalizedStatus === 'approved' ? 'Double approbation' : undefined,
          selectedPages: campaign.target_pages || [],
          startDate: campaign.start_date ? campaign.start_date.split('T')[0] : '',
          endDate: campaign.end_date ? campaign.end_date.split('T')[0] : '',
          duration: campaign.duration || 0,
          autoRenewal: false,
          cost: campaign.total_cost || 0,
          rejectionReason: campaign.rejection_reason || undefined,
          superAdminApproved: !!campaign.super_admin_approved,
          adminApproved: !!campaign.admin_approved
        }
      })

      setBoostingRequests(mappedRequests)
    } catch (error) {
      console.error('Erreur chargement demandes boostage:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les demandes de boostage.'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-orange-600 border-orange-300">
          <Clock className="h-3 w-3 mr-1" />
          En Attente
        </Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approuve
        </Badge>
      case 'rejected':
        return <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejete
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommandation':
        return <Target className="h-4 w-4" />
      case 'banniere':
        return <ImageIcon className="h-4 w-4" />
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recommandation':
        return 'Recommandation Ciblee'
      case 'banniere':
        return 'Banniere Visuelle'
      case 'whatsapp':
        return 'WhatsApp Marketing'
      default:
        return type
    }
  }

  /**
   * Approuve une demande de boostage et recharge la liste.
   */
  const handleApprove = async (requestId: string) => {
    setLoading(true)
    try {
      let success = false
      if (userRole === 'super_admin') {
        success = await BoostingCampaignManager.approveAsSuperAdmin(requestId, userId || undefined)
      } else if (userRole === 'admin') {
        success = await BoostingCampaignManager.approveAsAdmin(requestId, userId || undefined)
      } else {
        addNotification({
          type: 'error',
          title: 'Non autorisé',
          message: "Votre rôle ne permet pas d'approuver cette campagne."
        })
        return
      }
      if (success) {
        addNotification({
          type: 'success',
          title: 'Demande approuvée',
          message: 'La demande de boostage a été approuvée avec succès.'
        })
        await loadRequests()
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: "L'approbation n'a pas abouti. Veuillez réessayer."
        })
      }
    } catch (error) {
      console.error('Erreur approbation demande:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'approuver la demande pour le moment.'
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Rejette une demande de boostage avec une raison fournie.
   */
  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      addNotification({
        type: 'error',
        title: 'Raison requise',
        message: 'Veuillez fournir une raison pour le rejet'
      })
      return
    }

    try {
      const success = await BoostingCampaignManager.rejectCampaign(requestId, rejectionReason)
      if (success) {
        setBoostingRequests(prev => prev.map(req =>
          req.id === requestId
            ? {
                ...req,
                status: 'rejected',
                rejectionReason,
                approvalDate: new Date().toISOString().split('T')[0],
                approvedBy: 'Super Admin'
              }
            : req
        ))

        addNotification({
          type: 'success',
          title: 'Demande rejetée',
          message: 'La demande de boostage a été rejetée.'
        })
        setRejectionReason('')
        setShowRejectionModal(false)
        await loadRequests()
      }
    } catch (error) {
      console.error('Erreur rejet demande:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de rejeter la demande pour le moment.'
      })
    }
  }

  const openRejectionModal = (requestId: string) => {
    const request = boostingRequests.find(req => req.id === requestId)
    if (request) {
      setSelectedRequest(request)
      setShowRejectionModal(true)
    }
  }

  const pendingRequests = boostingRequests.filter(req => req.status === 'pending')
  const approvedRequests = boostingRequests.filter(req => req.status === 'approved')
  const rejectedRequests = boostingRequests.filter(req => req.status === 'rejected')
  const hasRequests = boostingRequests.length > 0

  return (
    <div className="space-y-6">
      {/* En-tete avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Demandes de Boostage</h2>
          <p className="text-gray-600">Approuvez ou rejetez les demandes de boostage des vendeurs</p>
        </div>
        <div className="flex gap-4">
          <Card className="text-center p-4">
            <p className="text-sm text-gray-600">En Attente</p>
            <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-sm text-gray-600">Approuvees</p>
            <p className="text-2xl font-bold text-green-600">{approvedRequests.length}</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-sm text-gray-600">Rejetees</p>
            <p className="text-2xl font-bold text-red-600">{rejectedRequests.length}</p>
          </Card>
        </div>
      </div>

      {/* Gestion des états */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-600">Chargement des demandes de boostage...</p>
          </div>
        </div>
      ) : !hasRequests ? (
        <Card className="p-12 text-center border-dashed">
          <CardTitle className="text-xl mb-2">Aucune demande de boostage</CardTitle>
          <CardContent>
            <p className="text-sm text-gray-600">
              Les vendeurs n'ont pas encore soumis de demandes. Lorsque des campagnes seront créées, elles apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              En Attente
              <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              Approuvees
              <Badge variant="secondary" className="ml-1">{approvedRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              Rejetees
              <Badge variant="secondary" className="ml-1">{rejectedRequests.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Demandes en attente */}
          <TabsContent value="pending" className="space-y-6">
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
              {pendingRequests.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <CardContent>
                    <p className="text-sm text-gray-600">Aucune demande en attente actuellement.</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow w-full">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(request.type)}
                          <span className="font-medium text-gray-800">{getTypeLabel(request.type)}</span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <CardTitle className="text-lg text-gray-900">{request.vendorName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Demande le {request.requestDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{request.cost.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{request.duration} jours</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-700 pt-1">
                        <Badge variant={request.superAdminApproved ? 'default' : 'secondary'}>
                          SA: {request.superAdminApproved ? 'Oui' : 'Non'}
                        </Badge>
                        <Badge variant={request.adminApproved ? 'default' : 'secondary'}>
                          Admin: {request.adminApproved ? 'Oui' : 'Non'}
                        </Badge>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{request.selectedPages.join(', ')}</span>
                      </div>
                      
                      <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir details
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-1"
                            onClick={() => handleApprove(request.id)}
                            disabled={
                              loading ||
                              (userRole === 'super_admin' && request.superAdminApproved) ||
                              (userRole === 'admin' && request.adminApproved)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {userRole === 'super_admin' ? 'Approuver (Super Admin)' : userRole === 'admin' ? 'Approuver (Admin)' : 'Approuver'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => openRejectionModal(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Demandes approuvees */}
          <TabsContent value="approved" className="space-y-6">
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
              {approvedRequests.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <CardContent>
                    <p className="text-sm text-gray-600">Aucune demande approuvée pour le moment.</p>
                  </CardContent>
                </Card>
              ) : (
                approvedRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow w-full">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(request.type)}
                          <span className="font-medium text-gray-800">{getTypeLabel(request.type)}</span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <CardTitle className="text-lg text-gray-900">{request.vendorName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Approuvée le {request.approvalDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{request.cost.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{request.duration} jours</span>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir details
                        </Button>

                        <div className="pt-3">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleDisapprove(request.id)}
                            disabled={loading || (userRole !== 'super_admin' && userRole !== 'admin')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Désapprouver
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Demandes rejetees */}
          <TabsContent value="rejected" className="space-y-6">
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
              {rejectedRequests.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <CardContent>
                    <p className="text-sm text-gray-600">Aucune demande rejetée pour le moment.</p>
                  </CardContent>
                </Card>
              ) : (
                rejectedRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow w-full">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(request.type)}
                          <span className="font-medium text-gray-800">{getTypeLabel(request.type)}</span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <CardTitle className="text-lg text-gray-900">{request.vendorName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Rejetée le {request.approvalDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{request.cost.toLocaleString()} FCFA</span>
                      </div>
                      {request.rejectionReason && (
                        <div className="text-sm text-gray-600 bg-red-50 p-3 rounded-md border border-red-200">
                          <strong>Raison :</strong> {request.rejectionReason}
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de details */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest && getTypeIcon(selectedRequest.type)}
              Details de la demande de boostage
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Informations du vendeur */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations du Vendeur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nom du vendeur</label>
                      <p className="text-gray-900">{selectedRequest.vendorName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedRequest.vendorEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration du boostage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration du Boostage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Type de boostage</label>
                      <p className="text-gray-900">{getTypeLabel(selectedRequest.type)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Cout</label>
                      <p className="text-gray-900 font-semibold">{selectedRequest.cost.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Duree</label>
                      <p className="text-gray-900">{selectedRequest.duration} jours</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Renouvellement automatique</label>
                      <p className="text-gray-900">{selectedRequest.autoRenewal ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pages selectionnees</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedRequest.selectedPages.map((page, index) => (
                        <Badge key={index} variant="outline">{page}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date de debut</label>
                      <p className="text-gray-900">{selectedRequest.startDate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date de fin</label>
                      <p className="text-gray-900">{selectedRequest.endDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details specifiques selon le type */}
              {selectedRequest.type === 'banniere' && selectedRequest.bannerTitle && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Details de la Banniere</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Titre de la banniere</label>
                      <p className="text-gray-900">{selectedRequest.bannerTitle}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900">{selectedRequest.bannerDescription}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedRequest.type === 'whatsapp' && selectedRequest.whatsappMessage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Details WhatsApp</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Message WhatsApp</label>
                      <p className="text-gray-900">{selectedRequest.whatsappMessage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Titre</label>
                      <p className="text-gray-900">{selectedRequest.whatsappTitle}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900">{selectedRequest.whatsappDescription}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions si en attente */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    onClick={() => {
                      handleApprove(selectedRequest.id)
                      setShowDetailsModal(false)
                    }}
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
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

              {/* Actions si approuvée */}
              {selectedRequest.status === 'approved' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleDisapprove(selectedRequest.id)
                      setShowDetailsModal(false)
                    }}
                    disabled={loading || (userRole !== 'super_admin' && userRole !== 'admin')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Désapprouver
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de rejet */}
      <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande de boostage</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Raison du rejet <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Expliquez pourquoi cette demande est rejetee..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRejectionModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedRequest && handleReject(selectedRequest.id)}
                className="flex-1"
                disabled={!rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
