"use client"

import React, { useState } from 'react'
import { 
  Star, 
  ThumbsUp, 
  MessageCircle, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Reply, 
  Download, 
  User, 
  Package,
  TrendingUp,
  AlertTriangle,
  Filter,
  Search,
  MoreHorizontal,
  Calendar,
  Eye,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Types pour les avis et la réputation
interface Review {
  id: string
  customerId: string
  customerName: string
  customerAvatar: string
  productId: number
  productName: string
  productImage: string
  rating: number
  title: string
  content: string
  images: string[]
  createdAt: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  isVerified: boolean
  helpfulCount: number
  replyCount: number
  sellerReply?: {
    content: string
    createdAt: string
  }
  flags: Array<{
    id: string
    reason: string
    reporterId: string
    reporterName: string
    createdAt: string
    status: 'pending' | 'resolved' | 'dismissed'
  }>
  sentiment: 'positive' | 'negative' | 'neutral'
  impact: 'high' | 'medium' | 'low'
}

interface ReputationData {
  overallRating: number
  totalReviews: number
  ratingDistribution: {
    '5': number
    '4': number
    '3': number
    '2': number
    '1': number
  }
  averageResponseTime: number
  responseRate: number
  helpfulReviewsPercentage: number
  verifiedReviewsPercentage: number
  monthlyTrends: Array<{
    month: string
    rating: number
    reviews: number
  }>
}

interface ReviewsSectionProps {
  reviews: Review[]
  reputationData: ReputationData
  onReviewApprove: (reviewId: string) => void
  onReviewReject: (reviewId: string) => void
  onReviewReply: (reviewId: string, reply: string) => void
  onReviewFlag: (reviewId: string, reason: string) => void
  onReviewDelete: (reviewId: string) => void
  onExportReviews: () => void
  onViewCustomerProfile: (customerId: string) => void
  onViewProductDetails: (productId: number) => void
}

export default function ReviewsSection({
  reviews,
  reputationData,
  onReviewApprove,
  onReviewReject,
  onReviewReply,
  onReviewFlag,
  onReviewDelete,
  onExportReviews,
  onViewCustomerProfile,
  onViewProductDetails
}: ReviewsSectionProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('date')

  // Filtrer et trier les avis
  const filteredReviews = reviews.filter(review => {
    if (!review || !review.customerName || !review.productName || !review.content) {
      return false
    }
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus
    const matchesSearch = review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'rating':
        return b.rating - a.rating
      case 'helpful':
        return b.helpfulCount - a.helpfulCount
      default:
        return 0
    }
  })

  const handleReply = (review: Review) => {
    setSelectedReview(review)
    setReplyText('')
    setShowReplyDialog(true)
  }

  const handleSubmitReply = () => {
    if (selectedReview && replyText.trim()) {
      onReviewReply(selectedReview.id, replyText)
      setShowReplyDialog(false)
      setReplyText('')
      setSelectedReview(null)
    }
  }

  const handleFlag = (review: Review) => {
    setSelectedReview(review)
    setFlagReason('')
    setShowFlagDialog(true)
  }

  const handleSubmitFlag = () => {
    if (selectedReview && flagReason.trim()) {
      onReviewFlag(selectedReview.id, flagReason)
      setShowFlagDialog(false)
      setFlagReason('')
      setSelectedReview(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'flagged': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      case 'neutral': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Avis et Réputation</h2>
          <p className="text-gray-600">Gérez les avis clients et surveillez votre réputation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportReviews}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques de réputation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                <p className="text-2xl font-bold text-gray-900">{reputationData.overallRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total avis</p>
                <p className="text-2xl font-bold text-gray-900">{reputationData.totalReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de réponse</p>
                <p className="text-2xl font-bold text-gray-900">{reputationData.responseRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Temps de réponse</p>
                <p className="text-2xl font-bold text-gray-900">{reputationData.averageResponseTime}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution des notes */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des notes</CardTitle>
          <CardDescription>Répartition des avis par note</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(reputationData.ratingDistribution).reverse().map(([rating, count]) => {
              const percentage = (count / reputationData.totalReviews) * 100
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium text-gray-600">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <Progress value={percentage} className="flex-1" />
                  <span className="text-sm text-gray-600 w-16 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans les avis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
                <SelectItem value="flagged">Signalés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="rating">Note</SelectItem>
                <SelectItem value="helpful">Utilité</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des avis */}
      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Informations client et produit */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.customerAvatar} alt={review.customerName} />
                        <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <button
                          onClick={() => onViewCustomerProfile(review.customerId)}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {review.customerName}
                        </button>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                          {review.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Vérifié
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(review.status)}>
                        {review.status === 'approved' && 'Approuvé'}
                        {review.status === 'pending' && 'En attente'}
                        {review.status === 'rejected' && 'Rejeté'}
                        {review.status === 'flagged' && 'Signalé'}
                      </Badge>
                      <Badge className={getImpactColor(review.impact)}>
                        {review.impact === 'high' && 'Impact élevé'}
                        {review.impact === 'medium' && 'Impact moyen'}
                        {review.impact === 'low' && 'Impact faible'}
                      </Badge>
                    </div>
                  </div>

                  {/* Produit */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={review.productImage}
                      alt={review.productName}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <button
                      onClick={() => onViewProductDetails(review.productId)}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                    >
                      {review.productName}
                    </button>
                  </div>

                  {/* Note et titre */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({review.rating}/5)</span>
                    <span className={`text-sm font-medium ${getSentimentColor(review.sentiment)}`}>
                      {review.sentiment === 'positive' && 'Positif'}
                      {review.sentiment === 'negative' && 'Négatif'}
                      {review.sentiment === 'neutral' && 'Neutre'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    <p className="text-gray-700 leading-relaxed">{review.content}</p>
                  </div>

                  {/* Images du client */}
                  {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="flex space-x-2">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image || '/placeholder.jpg'}
                          alt={`Image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}

                  {/* Statistiques */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpfulCount} utile</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{review.replyCount} réponses</span>
                    </div>
                  </div>

                  {/* Réponse du vendeur */}
                  {review.sellerReply && review.sellerReply.content && (
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Réponse du vendeur</span>
                        <span className="text-xs text-blue-600">
                          {review.sellerReply.createdAt && new Date(review.sellerReply.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-blue-800 text-sm">{review.sellerReply.content}</p>
                    </div>
                  )}

                  {/* Signalements */}
                  {review.flags && Array.isArray(review.flags) && review.flags.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-900">Signalements</span>
                      </div>
                      {review.flags.map((flag) => (
                        <div key={flag.id} className="text-red-800 text-sm">
                          <span className="font-medium">{flag.reason || 'Raison non spécifiée'}</span> - {flag.reporterName || 'Anonyme'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 lg:w-48">
                  {review.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onReviewApprove(review.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReviewReject(review.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                    </>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReply(review)}
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Répondre
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFlag(review)}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Signaler
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReviewDelete(review.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aucun avis trouvé */}
      {sortedReviews.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun avis trouvé</h3>
            <p className="text-gray-500">
              {searchQuery || filterStatus !== 'all' 
                ? 'Aucun avis ne correspond à vos critères de recherche'
                : 'Vous n\'avez pas encore reçu d\'avis'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de réponse */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre à l'avis</DialogTitle>
            <DialogDescription>
              Répondez à l'avis de {selectedReview?.customerName} pour améliorer votre relation client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Tapez votre réponse..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmitReply}>
                Envoyer la réponse
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de signalement */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler l'avis</DialogTitle>
            <DialogDescription>
              Signalez cet avis pour modération
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={flagReason} onValueChange={setFlagReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inappropriate">Contenu inapproprié</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="fake">Avis faux ou trompeur</SelectItem>
                <SelectItem value="harassment">Harcèlement</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmitFlag}>
                Signaler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

