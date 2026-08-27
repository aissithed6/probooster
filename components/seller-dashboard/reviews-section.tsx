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
  productId: string
  productName: string
  productImage: string
  category?: string
  subcategory?: string
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
  onReviewReject: (reviewId: string, reason?: string) => void
  onReviewReply: (reviewId: string, reply: string) => void
  onReviewFlag: (reviewId: string, reason: string) => void
  onReviewDelete: (reviewId: string) => void
  onExportReviews: () => void
  onViewCustomerProfile: (customerId: string) => void
  onViewProductDetails: (productId: string) => void
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
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterVerified, setFilterVerified] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('date')

  /**
   * Calcule la date de début à partir du filtre période.
   */
  const getPeriodStartDate = (period: string): Date | null => {
    const now = new Date()
    if (period === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    if (period === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    if (period === '90d') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    return null
  }

  /**
   * Exporte un rapport JSON basé sur les avis filtrés (données réelles).
   */
  const exportFilteredReport = (items: Review[]) => {
    const report = {
      generatedAt: new Date().toISOString(),
      scope: 'vendor',
      filters: {
        searchQuery,
        filterStatus,
        filterRating,
        filterCategory,
        filterVerified,
        filterPeriod,
        sortBy
      },
      summary: {
        totalReviews: items.length,
        averageRating: items.length ? Number((items.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / items.length).toFixed(2)) : 0,
        flaggedCount: items.reduce((acc, r) => acc + (Array.isArray(r.flags) ? r.flags.length : 0), 0),
        satisfactionPercent: items.length
          ? Number(((items.filter((r) => (Number(r.rating) || 0) >= 4).length / items.length) * 100).toFixed(1))
          : 0
      },
      items: items.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        productName: r.productName,
        category: r.category ?? '',
        subcategory: r.subcategory ?? '',
        rating: r.rating,
        status: r.status,
        isVerified: r.isVerified,
        createdAt: r.createdAt,
        content: r.content,
        flags: r.flags
      }))
    }

    const json = JSON.stringify(report, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const timestamp = new Date().toISOString().split('T')[0]
    link.download = `rapport-avis-vendeur-${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Filtrer et trier les avis
  const filteredReviews = reviews.filter(review => {
    if (!review || !review.customerName || !review.productName || !review.content) {
      return false
    }

    const matchesStatus = filterStatus === 'all' || review.status === filterStatus

    const matchesRating = (() => {
      if (filterRating === 'all') return true
      const raw = Number(filterRating)
      if (!Number.isFinite(raw)) return true
      return Number(review.rating) === raw
    })()

    const matchesCategory = (() => {
      if (filterCategory === 'all') return true
      return String(review.category ?? '') === filterCategory
    })()

    const matchesVerified = (() => {
      if (filterVerified === 'all') return true
      if (filterVerified === 'verified') return Boolean(review.isVerified)
      if (filterVerified === 'unverified') return !Boolean(review.isVerified)
      return true
    })()

    const matchesPeriod = (() => {
      const start = getPeriodStartDate(filterPeriod)
      if (!start) return true
      const created = new Date(review.createdAt)
      if (Number.isNaN(created.getTime())) return true
      return created.getTime() >= start.getTime()
    })()

    const matchesSearch = review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesRating && matchesCategory && matchesVerified && matchesPeriod && matchesSearch
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

  const handleReject = (review: Review) => {
    setSelectedReview(review)
    setRejectReason('')
    setShowRejectDialog(true)
  }

  const handleSubmitReject = () => {
    if (selectedReview) {
      onReviewReject(selectedReview.id, rejectReason.trim() || undefined)
      setShowRejectDialog(false)
      setRejectReason('')
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
          <Button
            variant="outline"
            onClick={() => {
              exportFilteredReport(sortedReviews)
              onExportReviews()
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Rapport Complet
          </Button>
        </div>
      </div>

      {/* Onglets : Avis sur les produits / Avis sur le vendeur */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products">Avis sur les produits</TabsTrigger>
          <TabsTrigger value="vendor">Avis sur le vendeur</TabsTrigger>
        </TabsList>

        {/* ================= Avis sur les produits ================= */}
        <TabsContent value="products" className="space-y-6">
      {/* Cartes (calculées sur données filtrées) */}
      {(() => {
        const items = filteredReviews
        const total = items.length
        const avg = total ? items.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total : 0
        const flagged = items.reduce((acc, r) => acc + (Array.isArray(r.flags) ? r.flags.length : 0), 0)
        const satisfaction = total ? (items.filter((r) => (Number(r.rating) || 0) >= 4).length / total) * 100 : 0

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                    <p className="text-2xl font-bold text-gray-900">{avg.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avis total</p>
                    <p className="text-2xl font-bold text-gray-900">{total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Flag className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Signalements</p>
                    <p className="text-2xl font-bold text-gray-900">{flagged}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">{satisfaction.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })()}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Note" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                  <SelectItem value="flagged">Signalés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {Array.from(new Set(reviews.map((r) => String(r?.category ?? '')).filter((c) => c.length > 0)))
                    .sort((a, b) => a.localeCompare(b))
                    .map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={filterVerified} onValueChange={setFilterVerified}>
                <SelectTrigger>
                  <SelectValue placeholder="Vérifié" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="verified">Vérifiés</SelectItem>
                  <SelectItem value="unverified">Non vérifiés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="rating">Note</SelectItem>
                  <SelectItem value="helpful">Utilité</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  {(review.status === 'pending' || review.status === 'flagged') && (
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
                        onClick={() => handleReject(review)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                    </>
                  )}

                  {review.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(review)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Masquer
                    </Button>
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

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'avis</DialogTitle>
            <DialogDescription>
              L’avis ne sera plus visible publiquement. Vous pouvez indiquer une raison (optionnelle).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motif du rejet (optionnel)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleSubmitReject}>
                Confirmer le rejet
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
      </TabsContent>
      </Tabs>
    </div>
  )
}

