"use client"

import { useState, useEffect } from 'react'
import { useNotifications } from '@/components/ui/modern-notification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Star, MessageSquare, ThumbsUp, ThumbsDown, Flag, CheckCircle, XCircle, Eye, BarChart3,
  Search, Filter, Download, Upload, Play, Pause, Volume2, AlertTriangle, Shield, 
  TrendingUp, TrendingDown, Users, Calendar, Clock, Mail, Phone, MapPin, 
  Heart, Share2, Bookmark, MoreHorizontal, Settings
} from 'lucide-react'

// Interfaces pour le système d'avis et réputation
interface Review {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string
  productId: string
  productName: string
  productImage: string
  vendorId: string
  vendorName: string
  rating: number
  comment: string
  date: string
  verified: boolean
  helpful: number
  unhelpful: number
  status: 'approved' | 'pending' | 'rejected' | 'flagged'
  isVideo: boolean
  videoUrl?: string
  images?: string[]
  tags: string[]
  category: string
  sentiment: 'positive' | 'neutral' | 'negative'
  language: string
  device: string
  location: string
  response?: VendorResponse
}

interface VendorResponse {
  id: string
  vendorId: string
  vendorName: string
  content: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
  isPublic: boolean
}

interface ReviewReport {
  id: string
  reviewId: string
  reporterId: string
  reporterName: string
  reason: string
  description: string
  date: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'inappropriate' | 'spam' | 'fake' | 'harassment' | 'other'
}

interface ReviewStats {
  totalReviews: number
  averageRating: number
  totalRatings: number
  verifiedReviews: number
  pendingReviews: number
  flaggedReviews: number
  satisfactionRate: number
  responseRate: number
  videoReviews: number
  imageReviews: number
  monthlyGrowth: number
  topCategories: Array<{ name: string; count: number; rating: number }>
  ratingDistribution: Array<{ rating: number; count: number; percentage: number }>
}

export default function ReviewsReputation() {
  // Hook pour les notifications
  const { addNotification } = useNotifications()
  
  // États pour la gestion des avis
  const [reviews, setReviews] = useState<Review[]>([])
  const [reports, setReports] = useState<ReviewReport[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 2847,
    averageRating: 4.7,
    totalRatings: 2847,
    verifiedReviews: 2456,
    pendingReviews: 156,
    flaggedReviews: 23,
    satisfactionRate: 98.2,
    responseRate: 87.5,
    videoReviews: 89,
    imageReviews: 456,
    monthlyGrowth: 12.5,
    topCategories: [
      { name: 'Électronique', count: 892, rating: 4.8 },
      { name: 'Mode', count: 567, rating: 4.6 },
      { name: 'Maison', count: 445, rating: 4.7 },
      { name: 'Sport', count: 234, rating: 4.5 }
    ],
    ratingDistribution: [
      { rating: 5, count: 1890, percentage: 66.4 },
      { rating: 4, count: 712, percentage: 25.0 },
      { rating: 3, count: 178, percentage: 6.3 },
      { rating: 2, count: 45, percentage: 1.6 },
      { rating: 1, count: 22, percentage: 0.7 }
    ]
  })

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | 'all'>('all')

  // États pour les modals
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showModerationModal, setShowModerationModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [showModerationRulesModal, setShowModerationRulesModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [showReviewsExportModal, setShowReviewsExportModal] = useState(false)
  const [showReviewsConfigModal, setShowReviewsConfigModal] = useState(false)
  const [showResponseModerationModal, setShowResponseModerationModal] = useState(false)
  const [showVideoViewModal, setShowVideoViewModal] = useState(false)
  const [showVideoModerationModal, setShowVideoModerationModal] = useState(false)
  const [showCompleteReportModal, setShowCompleteReportModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null)
  const [selectedResponse, setSelectedResponse] = useState<any>(null)
  const [selectedVideoReview, setSelectedVideoReview] = useState<any>(null)

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [reviewsPerPage] = useState(10)

  // Chargement des données au montage
  useEffect(() => {
    loadMockData()
  }, [])

  // Fonction pour charger les données mock
  const loadMockData = () => {
    const mockReviews: Review[] = [
      {
        id: '1',
        userId: 'u1',
        userName: 'Marie L.',
        userEmail: 'marie.l@email.com',
        userAvatar: '',
        productId: 'p1',
        productName: 'iPhone 15 Pro',
        productImage: '',
        vendorId: 'v1',
        vendorName: 'TechStore Pro',
        rating: 5,
        comment: 'Excellent produit, livraison rapide ! La qualité est au rendez-vous et le service client est impeccable. Je recommande vivement !',
        date: '2024-12-19T10:30:00Z',
        verified: true,
        helpful: 12,
        unhelpful: 0,
        status: 'approved',
        isVideo: false,
        tags: ['qualité', 'livraison', 'recommandé'],
        category: 'Électronique',
        sentiment: 'positive',
        language: 'fr',
        device: 'Desktop',
        location: 'Paris, France'
      },
      {
        id: '2',
        userId: 'u2',
        userName: 'Pierre D.',
        userEmail: 'pierre.d@email.com',
        userAvatar: '',
        productId: 'p2',
        productName: 'Samsung Galaxy S24',
        productImage: '',
        vendorId: 'v2',
        vendorName: 'Electronics Plus',
        rating: 4,
        comment: 'Très bon téléphone, mais prix élevé. Les fonctionnalités sont excellentes et la batterie tient bien la charge.',
        date: '2024-12-18T15:45:00Z',
        verified: true,
        helpful: 8,
        unhelpful: 2,
        status: 'approved',
        isVideo: true,
        videoUrl: 'https://example.com/video1.mp4',
        tags: ['fonctionnalités', 'batterie', 'prix'],
        category: 'Électronique',
        sentiment: 'positive',
        language: 'fr',
        device: 'Mobile',
        location: 'Lyon, France'
      },
      {
        id: '3',
        userId: 'u3',
        userName: 'Sophie B.',
        userEmail: 'sophie.b@email.com',
        userAvatar: '',
        productId: 'p3',
        productName: 'MacBook Air M2',
        productImage: '',
        vendorId: 'v3',
        vendorName: 'Apple Premium',
        rating: 5,
        comment: 'Parfait pour le travail, très rapide et autonome. L\'écran est magnifique et le clavier est agréable à utiliser.',
        date: '2024-12-17T09:20:00Z',
        verified: false,
        helpful: 15,
        unhelpful: 1,
        status: 'pending',
        isVideo: false,
        images: ['https://example.com/image1.jpg'],
        tags: ['travail', 'rapidité', 'autonomie'],
        category: 'Électronique',
        sentiment: 'positive',
        language: 'fr',
        device: 'Desktop',
        location: 'Marseille, France'
      }
    ]

    const mockReports: ReviewReport[] = [
      {
        id: 'r1',
        reviewId: '3',
        reporterId: 'u4',
        reporterName: 'Utilisateur A',
        reason: 'Avis inapproprié',
        description: 'Le commentaire contient du langage inapproprié et des critiques non constructives.',
        date: '2024-12-19T11:00:00Z',
        status: 'pending',
        priority: 'high',
        category: 'inappropriate'
      },
      {
        id: 'r2',
        reviewId: '4',
        reporterId: 'u5',
        reporterName: 'Utilisateur B',
        reason: 'Spam',
        description: 'Avis répétitif et promotionnel, semble être du spam.',
        date: '2024-12-19T10:30:00Z',
        status: 'investigating',
        priority: 'medium',
        category: 'spam'
      }
    ]

    setReviews(mockReviews)
    setReports(mockReports)
  }

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `Il y a ${diffInMinutes} min`
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Approuvé' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'En attente' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Rejeté' },
      flagged: { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Signalé' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.text}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Faible' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Moyenne' },
      high: { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Élevée' },
      critical: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Critique' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.text}
      </Badge>
    )
  }

  // Fonction pour modérer une réponse
  const moderateResponse = (response: any) => {
    setSelectedResponse(response)
    setShowResponseModerationModal(true)
  }

  // Fonction pour approuver une réponse
  const approveResponse = (responseId: number) => {
    try {
      // Ici on pourrait mettre à jour le statut en base de données
      addNotification({
        type: 'success',
        title: 'Réponse approuvée',
        message: `La réponse a été approuvée avec succès.`
      })
      setShowResponseModerationModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'approuver la réponse.'
      })
    }
  }

  // Fonction pour rejeter une réponse
  const rejectResponse = (responseId: number, reason: string) => {
    try {
      // Ici on pourrait mettre à jour le statut en base de données
      addNotification({
        type: 'success',
        title: 'Réponse rejetée',
        message: `La réponse a été rejetée. Raison: ${reason}`
      })
      setShowResponseModerationModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de rejeter la réponse.'
      })
    }
  }

  // Fonction pour demander des modifications
  const requestModifications = (responseId: number, modifications: string) => {
    try {
      // Ici on pourrait envoyer les modifications demandées au vendeur
      addNotification({
        type: 'success',
        title: 'Modifications demandées',
        message: 'Les modifications ont été envoyées au vendeur.'
      })
      setShowResponseModerationModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'envoyer les modifications.'
      })
    }
  }

  // Fonction pour voir un avis vidéo
  const viewVideoReview = (review: any) => {
    setSelectedVideoReview(review)
    setShowVideoViewModal(true)
  }

  // Fonction pour modérer un avis vidéo
  const moderateVideoReview = (review: any) => {
    setSelectedVideoReview(review)
    setShowVideoModerationModal(true)
  }

  // Fonction pour approuver un avis vidéo
  const approveVideoReview = (reviewId: string) => {
    try {
      // Ici on pourrait mettre à jour le statut en base de données
      addNotification({
        type: 'success',
        title: 'Avis vidéo approuvé',
        message: `L'avis vidéo a été approuvé avec succès.`
      })
      setShowVideoModerationModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'approuver l\'avis vidéo.'
      })
    }
  }

  // Fonction pour rejeter un avis vidéo
  const rejectVideoReview = (reviewId: string, reason: string) => {
    try {
      // Ici on pourrait mettre à jour le statut en base de données
      addNotification({
        type: 'success',
        title: 'Avis vidéo rejeté',
        message: `L'avis vidéo a été rejeté. Raison: ${reason}`
      })
      setShowVideoModerationModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de rejeter l\'avis vidéo.'
      })
    }
  }

  // Fonction pour demander des modifications sur un avis vidéo
  const requestVideoModifications = (reviewId: string, modifications: string) => {
    try {
      // Ici on pourrait envoyer les modifications demandées à l'utilisateur
      addNotification({
        type: 'success',
        title: 'Modifications demandées',
        message: 'Les modifications ont été envoyées à l\'utilisateur.'
      })
      setShowVideoModerationModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'envoyer les modifications.'
      })
    }
  }

  // Fonction pour exporter les avis
  const exportReviews = () => {
    try {
      // Générer les données des avis
      const reviewsData = {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Super Admin',
        summary: {
          totalReviews: reviews.length,
          verifiedReviews: reviews.filter(r => r.verified).length,
          pendingReviews: reviews.filter(r => r.status === 'pending').length,
          approvedReviews: reviews.filter(r => r.status === 'approved').length,
          rejectedReviews: reviews.filter(r => r.status === 'rejected').length,
          flaggedReviews: reviews.filter(r => r.status === 'flagged').length,
          videoReviews: reviews.filter(r => r.isVideo).length,
          imageReviews: reviews.filter(r => r.images && r.images.length > 0).length,
          averageRating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
        },
        categoryBreakdown: reviews.reduce((acc, review) => {
          acc[review.category] = (acc[review.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: reviews.filter(r => r.rating === rating).length,
          percentage: ((reviews.filter(r => r.rating === rating).length / reviews.length) * 100).toFixed(1)
        })),
        detailedReviews: reviews.map(review => ({
          id: review.id,
          userName: review.userName,
          userEmail: review.userEmail,
          productName: review.productName,
          vendorName: review.vendorName,
          rating: review.rating,
          comment: review.comment,
          date: review.date,
          verified: review.verified,
          status: review.status,
          category: review.category,
          sentiment: review.sentiment,
          language: review.language,
          device: review.device,
          location: review.location,
          helpful: review.helpful,
          unhelpful: review.unhelpful,
          isVideo: review.isVideo,
          hasImages: review.images && review.images.length > 0,
          tags: review.tags.join(', '),
          hasResponse: !!review.response
        }))
      }

      // Convertir en JSON
      const jsonContent = JSON.stringify(reviewsData, null, 2)
      
      // Créer le fichier et le télécharger
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = new Date().toISOString().split('T')[0]
      link.download = `rapport-avis-${timestamp}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Créer également un fichier CSV pour les données tabulaires
      const csvHeaders = [
        'ID',
        'Utilisateur',
        'Email',
        'Produit',
        'Vendeur',
        'Note',
        'Commentaire',
        'Date',
        'Vérifié',
        'Statut',
        'Catégorie',
        'Sentiment',
        'Langue',
        'Appareil',
        'Localisation',
        'Utile',
        'Inutile',
        'Vidéo',
        'Images',
        'Tags',
        'Répondu'
      ]
      
      const csvRows = reviews.map(review => [
        review.id,
        review.userName,
        review.userEmail,
        review.productName,
        review.vendorName,
        review.rating,
        `"${review.comment.replace(/"/g, '""')}"`,
        new Date(review.date).toLocaleDateString('fr-FR'),
        review.verified ? 'Oui' : 'Non',
        review.status === 'approved' ? 'Approuvé' :
        review.status === 'pending' ? 'En attente' :
        review.status === 'rejected' ? 'Rejeté' : 'Signalé',
        review.category,
        review.sentiment === 'positive' ? 'Positif' :
        review.sentiment === 'negative' ? 'Négatif' : 'Neutre',
        review.language,
        review.device,
        review.location,
        review.helpful,
        review.unhelpful,
        review.isVideo ? 'Oui' : 'Non',
        review.images && review.images.length > 0 ? 'Oui' : 'Non',
        review.tags.join('; '),
        review.response ? 'Oui' : 'Non'
      ])
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const csvUrl = window.URL.createObjectURL(csvBlob)
      const csvLink = document.createElement('a')
      csvLink.href = csvUrl
      csvLink.download = `avis-clients-${timestamp}.csv`
      
      document.body.appendChild(csvLink)
      csvLink.click()
      document.body.removeChild(csvLink)
      window.URL.revokeObjectURL(csvUrl)

      console.log('Avis exportés avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'export des avis:', error)
    }
  }

  // Fonction pour exporter les rapports de modération
  const exportModerationReports = () => {
    try {
      // Générer les données du rapport
      const reportData = {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Super Admin',
        summary: {
          totalReports: reports.length,
          pendingReports: reports.filter(r => r.status === 'pending').length,
          resolvedReports: reports.filter(r => r.status === 'resolved').length,
          investigatingReports: reports.filter(r => r.status === 'investigating').length,
          dismissedReports: reports.filter(r => r.status === 'dismissed').length,
          criticalReports: reports.filter(r => r.priority === 'critical').length,
          averageResolutionTime: '2.3 jours'
        },
        categoryBreakdown: {
          inappropriate: reports.filter(r => r.category === 'inappropriate').length,
          spam: reports.filter(r => r.category === 'spam').length,
          fake: reports.filter(r => r.category === 'fake').length,
          harassment: reports.filter(r => r.category === 'harassment').length,
          other: reports.filter(r => r.category === 'other').length
        },
        priorityBreakdown: {
          low: reports.filter(r => r.priority === 'low').length,
          medium: reports.filter(r => r.priority === 'medium').length,
          high: reports.filter(r => r.priority === 'high').length,
          critical: reports.filter(r => r.priority === 'critical').length
        },
        trends: {
          weeklyGrowth: '+15%',
          monthlyGrowth: '-8%',
          quarterlyGrowth: '+22%'
        },
        detailedReports: reports.map(report => ({
          id: report.id,
          reviewId: report.reviewId,
          reporterName: report.reporterName,
          reason: report.reason,
          description: report.description,
          category: report.category,
          priority: report.priority,
          status: report.status,
          date: report.date
        })),
        recommendations: [
          {
            type: 'warning',
            title: 'Augmentation des signalements critiques',
            description: 'Revoir les règles de détection automatique'
          },
          {
            type: 'info',
            title: 'Temps de résolution élevé',
            description: 'Ajouter plus de modérateurs ou optimiser le processus'
          },
          {
            type: 'success',
            title: 'Bonne performance générale',
            description: 'Maintenir les règles actuelles'
          }
        ]
      }

      // Convertir en JSON
      const jsonContent = JSON.stringify(reportData, null, 2)
      
      // Créer le fichier et le télécharger
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = new Date().toISOString().split('T')[0]
      link.download = `rapport-moderation-${timestamp}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Créer également un fichier CSV pour les données tabulaires
      const csvHeaders = [
        'ID Signalement',
        'ID Avis',
        'Signalé par',
        'Raison',
        'Catégorie',
        'Priorité',
        'Statut',
        'Date',
        'Description'
      ]
      
      const csvRows = reports.map(report => [
        report.id,
        report.reviewId,
        report.reporterName,
        report.reason,
        report.category === 'inappropriate' ? 'Inapproprié' :
        report.category === 'spam' ? 'Spam' :
        report.category === 'fake' ? 'Faux avis' :
        report.category === 'harassment' ? 'Harcèlement' : 'Autre',
        report.priority === 'low' ? 'Faible' :
        report.priority === 'medium' ? 'Moyenne' :
        report.priority === 'high' ? 'Élevée' : 'Critique',
        report.status === 'pending' ? 'En attente' :
        report.status === 'investigating' ? 'En cours' :
        report.status === 'resolved' ? 'Résolu' : 'Rejeté',
        new Date(report.date).toLocaleDateString('fr-FR'),
        `"${report.description.replace(/"/g, '""')}"`
      ])
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const csvUrl = window.URL.createObjectURL(csvBlob)
      const csvLink = document.createElement('a')
      csvLink.href = csvUrl
      csvLink.download = `signalements-moderation-${timestamp}.csv`
      
      document.body.appendChild(csvLink)
      csvLink.click()
      document.body.removeChild(csvLink)
      window.URL.revokeObjectURL(csvUrl)

      console.log('Rapports de modération exportés avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'export des rapports:', error)
    }
  }

  // Fonction pour générer le rapport complet
  const generateCompleteReport = () => {
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Super Admin',
        executiveSummary: {
          overallRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          satisfactionRate: stats.satisfactionRate,
          responseRate: stats.responseRate,
          monthlyGrowth: stats.monthlyGrowth,
          keyInsights: [
            'Performance excellente avec 98.2% de satisfaction',
            'Croissance mensuelle de 12.5%',
            '87.5% de taux de réponse des vendeurs',
            'Seulement 0.8% d\'avis signalés'
          ]
        },
        detailedStatistics: {
          ratingDistribution: stats.ratingDistribution,
          categoryPerformance: stats.topCategories,
          verificationStatus: {
            verified: stats.verifiedReviews,
            unverified: stats.totalReviews - stats.verifiedReviews,
            verificationRate: ((stats.verifiedReviews / stats.totalReviews) * 100).toFixed(1)
          },
          contentTypes: {
            textOnly: stats.totalReviews - stats.videoReviews - stats.imageReviews,
            withImages: stats.imageReviews,
            withVideos: stats.videoReviews
          }
        },
        moderationMetrics: {
          totalReports: reports.length,
          reportStatus: {
            pending: reports.filter(r => r.status === 'pending').length,
            investigating: reports.filter(r => r.status === 'investigating').length,
            resolved: reports.filter(r => r.status === 'resolved').length,
            dismissed: reports.filter(r => r.status === 'dismissed').length
          },
          priorityDistribution: {
            low: reports.filter(r => r.priority === 'low').length,
            medium: reports.filter(r => r.priority === 'medium').length,
            high: reports.filter(r => r.priority === 'high').length,
            critical: reports.filter(r => r.priority === 'critical').length
          },
          averageResolutionTime: '1.8 jours',
          moderationEfficiency: '94.2%'
        },
        trends: {
          weekly: {
            newReviews: '+5.2%',
            averageRating: '+0.1',
            satisfactionRate: '+0.3%'
          },
          monthly: {
            newReviews: stats.monthlyGrowth + '%',
            averageRating: '+0.2',
            satisfactionRate: '+0.8%'
          },
          quarterly: {
            newReviews: '+18.7%',
            averageRating: '+0.4',
            satisfactionRate: '+2.1%'
          }
        },
        recommendations: [
          {
            priority: 'high',
            category: 'Performance',
            title: 'Maintenir l\'excellence',
            description: 'Continuer les bonnes pratiques actuelles',
            impact: 'Élevé'
          },
          {
            priority: 'medium',
            category: 'Modération',
            title: 'Optimiser le temps de résolution',
            description: 'Réduire le temps de traitement des signalements',
            impact: 'Moyen'
          },
          {
            priority: 'low',
            category: 'Engagement',
            title: 'Encourager les avis vidéo',
            description: 'Augmenter le pourcentage d\'avis avec contenu multimédia',
            impact: 'Faible'
          }
        ],
        riskAssessment: {
          overallRisk: 'Faible',
          riskFactors: [
            {
              factor: 'Signalements critiques',
              level: 'Faible',
              description: 'Seulement 2 signalements critiques ce mois'
            },
            {
              factor: 'Avis négatifs',
              level: 'Faible',
              description: 'Moins de 1% d\'avis négatifs'
            },
            {
              factor: 'Temps de réponse',
              level: 'Moyen',
              description: 'Peut être amélioré pour certains vendeurs'
            }
          ]
        }
      }

      // Convertir en JSON
      const jsonContent = JSON.stringify(reportData, null, 2)
      
      // Créer le fichier et le télécharger
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const timestamp = new Date().toISOString().split('T')[0]
      link.download = `rapport-complet-avis-reputation-${timestamp}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addNotification({
        type: 'success',
        title: 'Rapport généré',
        message: 'Le rapport complet a été généré et téléchargé avec succès.'
      })
    } catch (error) {
      console.error('Erreur lors de la génération du rapport complet:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de génération',
        message: 'Une erreur est survenue lors de la génération du rapport.'
      })
    }
  }

  // Filtrage des avis
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || review.category === categoryFilter
    const matchesVerified = verifiedFilter === 'all' || review.verified === verifiedFilter
    
    return matchesSearch && matchesRating && matchesStatus && matchesCategory && matchesVerified
  })

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage)
  const currentReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Avis & Réputation</h2>
            <p className="text-gray-600 mt-2">
              Gestion des avis clients, modération et analyse de la réputation
            </p>
          </div>
          <Button 
            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
            onClick={() => setShowCompleteReportModal(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Rapport Complet
          </Button>
        </div>
      </div>

      {/* Statistiques principales améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{stats.averageRating.toFixed(1)}</p>
                  <p className="text-sm text-yellow-600">Note moyenne</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-yellow-600 mb-1">+{stats.monthlyGrowth}%</div>
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalReviews.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">Avis total</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 mb-1">{stats.verifiedReviews}</div>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Flag className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.flaggedReviews}</p>
                  <p className="text-sm text-red-600">Signalements</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-red-600 mb-1">{stats.pendingReviews}</div>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.satisfactionRate}%</p>
                  <p className="text-sm text-green-600">Satisfaction</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600 mb-1">{stats.responseRate}%</div>
                <MessageSquare className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres Avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rating">Note</Label>
              <Select value={ratingFilter.toString()} onValueChange={(value) => setRatingFilter(value === 'all' ? 'all' : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes notes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes notes</SelectItem>
                  <SelectItem value="5">5 étoiles</SelectItem>
                  <SelectItem value="4">4 étoiles</SelectItem>
                  <SelectItem value="3">3 étoiles</SelectItem>
                  <SelectItem value="2">2 étoiles</SelectItem>
                  <SelectItem value="1">1 étoile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="flagged">Signalé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="Électronique">Électronique</SelectItem>
                  <SelectItem value="Mode">Mode</SelectItem>
                  <SelectItem value="Maison">Maison</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verified">Vérifié</Label>
              <Select value={verifiedFilter.toString()} onValueChange={(value) => setVerifiedFilter(value === 'all' ? 'all' : value === 'true')}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="true">Vérifiés</SelectItem>
                  <SelectItem value="false">Non vérifiés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Période</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="avis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="avis">Avis</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
          <TabsTrigger value="reponses">Réponses</TabsTrigger>
          <TabsTrigger value="video">Avis Vidéo</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="avis" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Avis Clients</CardTitle>
                  <CardDescription>
                    Gestion et visualisation de tous les avis clients ({filteredReviews.length} résultats)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReviewsExportModal(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReviewsConfigModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configuration
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentReviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {review.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{review.userName}</h4>
                            {review.verified && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Vérifié
                              </Badge>
                            )}
                            {getStatusBadge(review.status)}
                            {review.isVideo && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <Play className="h-3 w-3 mr-1" />
                                Vidéo
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {review.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(review.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {review.vendorName}
                            </span>
                          </div>

                          <div className="mb-3">
                            <h5 className="font-medium text-gray-800 mb-1">{review.productName}</h5>
                            <div className="flex items-center space-x-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                              ))}
                              <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>

                          {/* Tags et métadonnées */}
                          <div className="flex items-center gap-2 mb-3">
                            {review.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Statistiques d'engagement */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {review.helpful} utile
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsDown className="h-3 w-3" />
                              {review.unhelpful} inutile
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {review.response ? 'Répondu' : 'Non répondu'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedReview(review)
                            setShowReviewModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedReview(review)
                            setShowModerationModal(true)
                          }}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Modérer
                        </Button>
                        {review.status === 'pending' && (
                          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Affichage de {((currentPage - 1) * reviewsPerPage) + 1} à {Math.min(currentPage * reviewsPerPage, filteredReviews.length)} sur {filteredReviews.length} avis
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modération des Avis</CardTitle>
                  <CardDescription>
                    Gestion des avis signalés et modération en temps réel ({reports.length} signalements)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowModerationRulesModal(true)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Règles de Modération
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReportsModal(true)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Rapports
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-medium text-gray-900">Signalement #{report.id}</h4>
                          {getPriorityBadge(report.priority)}
                          <Badge 
                            variant={report.status === 'pending' ? 'destructive' : 
                                   report.status === 'investigating' ? 'secondary' : 
                                   report.status === 'resolved' ? 'default' : 'outline'}
                          >
                            {report.status === 'pending' ? 'En attente' : 
                             report.status === 'investigating' ? 'En cours' : 
                             report.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Signalé par</p>
                            <p className="font-medium">{report.reporterName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Date du signalement</p>
                            <p className="font-medium">{formatDate(report.date)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Raison</p>
                            <p className="font-medium text-red-600">{report.reason}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Catégorie</p>
                            <Badge variant="outline" className="text-xs">
                              {report.category === 'inappropriate' ? 'Inapproprié' :
                               report.category === 'spam' ? 'Spam' :
                               report.category === 'fake' ? 'Faux avis' :
                               report.category === 'harassment' ? 'Harcèlement' : 'Autre'}
                            </Badge>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Description détaillée</p>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic">
                            "{report.description}"
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Avis #{report.reviewId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(report.date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report)
                            setShowModerationModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Examiner
                        </Button>
                        
                        {report.status === 'pending' && (
                          <>
                            <Button size="sm" variant="secondary">
                              <Shield className="h-4 w-4 mr-1" />
                              Enquêter
                            </Button>
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Résoudre
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </>
                        )}

                        {report.status === 'investigating' && (
                          <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Finaliser
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {reports.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucun signalement en attente</p>
                    <p className="text-sm">Tous les avis sont modérés et approuvés</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reponses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Réponses aux Avis</CardTitle>
              <CardDescription>
                Gestion des réponses des vendeurs et modération
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 1, user: "Marie L.", product: "iPhone 15 Pro", response: "Merci pour votre avis positif !", date: "Il y a 1h", status: "approved" },
                  { id: 2, user: "Pierre D.", product: "Samsung Galaxy S24", response: "Nous notons votre remarque sur le prix", date: "Il y a 2h", status: "pending" },
                  { id: 3, user: "Sophie B.", product: "MacBook Air M2", response: "Ravi que le produit vous convienne !", date: "Il y a 1j", status: "approved" }
                ].map((response) => (
                  <div key={response.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{response.user}</p>
                      <p className="text-sm text-gray-600">{response.product}</p>
                      <p className="text-sm text-gray-700 mt-2 italic">"{response.response}"</p>
                      <p className="text-xs text-gray-500 mt-1">{response.date}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={response.status === 'approved' ? 'default' : 'secondary'}>
                        {response.status === 'approved' ? 'Approuvé' : 'En attente'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => moderateResponse(response)}
                      >
                        Modérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avis Vidéo</CardTitle>
              <CardDescription>
                Gestion des avis vidéo et modération du contenu multimédia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium">Avis iPhone 15 Pro</h4>
                  <p className="text-sm text-gray-600">Marie L. - Il y a 2h</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewVideoReview({
                        id: '1',
                        title: 'Avis iPhone 15 Pro',
                        userName: 'Marie L.',
                        time: 'Il y a 2h',
                        status: 'pending'
                      })}
                    >
                      Voir
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => moderateVideoReview({
                        id: '1',
                        title: 'Avis iPhone 15 Pro',
                        userName: 'Marie L.',
                        time: 'Il y a 2h',
                        status: 'pending'
                      })}
                    >
                      Modérer
                    </Button>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium">Test Samsung Galaxy S24</h4>
                  <p className="text-sm text-gray-600">Pierre D. - Il y a 1j</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewVideoReview({
                        id: '2',
                        title: 'Test Samsung Galaxy S24',
                        userName: 'Pierre D.',
                        time: 'Il y a 1j',
                        status: 'pending'
                      })}
                    >
                      Voir
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => moderateVideoReview({
                        id: '2',
                        title: 'Test Samsung Galaxy S24',
                        userName: 'Pierre D.',
                        time: 'Il y a 1j',
                        status: 'pending'
                      })}
                    >
                      Modérer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistiques" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiques détaillées */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métriques Clés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{stats.totalReviews.toLocaleString()}</div>
                    <div className="text-sm text-blue-600">Avis Total</div>
                    <div className="text-xs text-blue-500 mt-1">+{stats.monthlyGrowth}% ce mois</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{stats.satisfactionRate}%</div>
                    <div className="text-sm text-green-600">Satisfaction</div>
                    <div className="text-xs text-green-500 mt-1">+2.1% vs mois dernier</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">{stats.videoReviews}</div>
                    <div className="text-sm text-purple-600">Avis Vidéo</div>
                    <div className="text-xs text-purple-500 mt-1">+15% ce mois</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-700">{stats.responseRate}%</div>
                    <div className="text-sm text-orange-600">Taux de Réponse</div>
                    <div className="text-xs text-orange-500 mt-1">+5.2% ce mois</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Catégories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Catégories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topCategories.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-gray-600">{category.count} avis</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{category.rating.toFixed(1)}</span>
                        </div>
                        <div className="text-xs text-gray-500">Note moyenne</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Répartition des Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Répartition des Notes
              </CardTitle>
              <CardDescription>
                Distribution détaillée des évaluations clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.ratingDistribution.map((item) => (
                  <div key={item.rating} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium w-8">{item.rating}</span>
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">({item.count} avis)</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Graphiques et Tendances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Évolution Mensuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Avis</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">+{stats.monthlyGrowth}%</div>
                      <div className="text-sm text-blue-600">vs mois dernier</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Satisfaction</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">+2.1%</div>
                      <div className="text-sm text-green-600">vs mois dernier</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Engagement</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">+8.5%</div>
                      <div className="text-sm text-purple-600">vs mois dernier</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Démographie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avis vérifiés</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.verifiedReviews / stats.totalReviews * 100} className="w-20" />
                      <span className="text-sm font-medium">{Math.round(stats.verifiedReviews / stats.totalReviews * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avis avec images</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.imageReviews / stats.totalReviews * 100} className="w-20" />
                      <span className="text-sm font-medium">{Math.round(stats.imageReviews / stats.totalReviews * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avis vidéo</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.videoReviews / stats.totalReviews * 100} className="w-20" />
                      <span className="text-sm font-medium">{Math.round(stats.videoReviews / stats.totalReviews * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux de réponse</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.responseRate} className="w-20" />
                      <span className="text-sm font-medium">{stats.responseRate}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de visualisation d'avis */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de l'Avis
            </DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Informations utilisateur */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Utilisateur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                        {selectedReview.userName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">{selectedReview.userName}</h4>
                        <p className="text-gray-600">{selectedReview.userEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedReview.verified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Vérifié
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {selectedReview.location}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date de l'avis:</span>
                        <span className="font-medium">{formatDate(selectedReview.date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Appareil:</span>
                        <span className="font-medium">{selectedReview.device}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Langue:</span>
                        <span className="font-medium">{selectedReview.language}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Statut:</span>
                        {getStatusBadge(selectedReview.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations produit */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Produit Évalué</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                      {selectedReview.productImage ? (
                        <img src={selectedReview.productImage} alt={selectedReview.productName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <div className="text-2xl">📱</div>
                          <div className="text-xs">Image</div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg mb-2">{selectedReview.productName}</h4>
                      <p className="text-gray-600 mb-3">Vendeur: {selectedReview.vendorName}</p>
                      <div className="flex items-center space-x-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-5 w-5 ${i < selectedReview.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                        ))}
                        <span className="ml-2 text-lg font-medium">({selectedReview.rating}/5)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{selectedReview.category}</Badge>
                        {selectedReview.isVideo && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Play className="h-3 w-3 mr-1" />
                            Avis Vidéo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commentaire et contenu */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Commentaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 leading-relaxed text-lg italic">
                        "{selectedReview.comment}"
                      </p>
                    </div>
                    
                    {/* Tags */}
                    <div>
                      <h5 className="font-medium mb-2">Tags associés:</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedReview.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Statistiques d'engagement */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedReview.helpful}</div>
                        <div className="text-sm text-gray-600">Utile</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{selectedReview.unhelpful}</div>
                        <div className="text-sm text-gray-600">Inutile</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedReview.response ? 'Oui' : 'Non'}
                        </div>
                        <div className="text-sm text-gray-600">Répondu</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Réponse du vendeur */}
              {selectedReview.response && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Réponse du Vendeur</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-blue-800">{selectedReview.response.vendorName}</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedReview.response.status === 'approved' ? 'Approuvé' : 
                           selectedReview.response.status === 'pending' ? 'En attente' : 'Rejeté'}
                        </Badge>
                      </div>
                      <p className="text-blue-700 italic">"{selectedReview.response.content}"</p>
                      <p className="text-xs text-blue-600 mt-2">{formatDate(selectedReview.response.date)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de modération */}
      <Dialog open={showModerationModal} onOpenChange={setShowModerationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Modération d'Avis
            </DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Avis à modérer:</h4>
                <p className="text-gray-700 italic">"{selectedReview.comment}"</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">Par {selectedReview.userName}</span>
                  <span className="text-sm text-gray-600">•</span>
                  <span className="text-sm text-gray-600">{selectedReview.productName}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="action">Action de modération</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approuver l'avis</SelectItem>
                      <SelectItem value="reject">Rejeter l'avis</SelectItem>
                      <SelectItem value="flag">Marquer comme signalé</SelectItem>
                      <SelectItem value="edit">Demander une modification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Raison (optionnel)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Expliquez la raison de cette action..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="notify-user" />
                  <Label htmlFor="notify-user">Notifier l'utilisateur</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="notify-vendor" />
                  <Label htmlFor="notify-vendor">Notifier le vendeur</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowModerationModal(false)}>
                  Annuler
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Shield className="h-4 w-4 mr-2" />
                  Appliquer la Modération
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal des règles de modération */}
      <Dialog open={showModerationRulesModal} onOpenChange={setShowModerationRulesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Règles de Modération des Avis
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Règles générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Règles Générales</CardTitle>
                <CardDescription>
                  Paramètres de base pour la modération automatique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Modération automatique</Label>
                      <p className="text-xs text-gray-600">Activer la modération automatique des avis</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Filtrage des mots interdits</Label>
                      <p className="text-xs text-gray-600">Bloquer automatiquement les avis contenant des mots interdits</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Détection de spam</Label>
                      <p className="text-xs text-gray-600">Identifier et bloquer les avis spam</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Vérification de l'achat</Label>
                      <p className="text-xs text-gray-600">Exiger une preuve d'achat pour les avis</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seuils de modération */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seuils de Modération</CardTitle>
                <CardDescription>
                  Définir les seuils pour déclencher la modération
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spamThreshold">Seuil de spam (%)</Label>
                    <Input
                      id="spamThreshold"
                      type="number"
                      placeholder="80"
                      defaultValue="80"
                    />
                    <p className="text-xs text-gray-600">Pourcentage de similarité pour détecter le spam</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="flagThreshold">Seuil de signalement</Label>
                    <Input
                      id="flagThreshold"
                      type="number"
                      placeholder="3"
                      defaultValue="3"
                    />
                    <p className="text-xs text-gray-600">Nombre de signalements avant modération</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Longueur minimale</Label>
                    <Input
                      id="minLength"
                      type="number"
                      placeholder="10"
                      defaultValue="10"
                    />
                    <p className="text-xs text-gray-600">Nombre minimum de caractères</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxLength">Longueur maximale</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      placeholder="1000"
                      defaultValue="1000"
                    />
                    <p className="text-xs text-gray-600">Nombre maximum de caractères</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mots interdits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mots et Phrases Interdits</CardTitle>
                <CardDescription>
                  Gérer la liste des mots et phrases interdits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bannedWords">Mots interdits (un par ligne)</Label>
                    <Textarea
                      id="bannedWords"
                      placeholder="insulte1&#10;insulte2&#10;mot_interdit"
                      rows={6}
                      defaultValue="insulte1&#10;insulte2&#10;mot_interdit&#10;spam&#10;arnaque"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bannedPhrases">Phrases interdites (une par ligne)</Label>
                    <Textarea
                      id="bannedPhrases"
                      placeholder="Cette phrase est interdite&#10;Autre phrase interdite"
                      rows={4}
                      defaultValue="Cette phrase est interdite&#10;Autre phrase interdite&#10;Promotion non autorisée"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="caseSensitive" />
                    <Label htmlFor="caseSensitive">Sensible à la casse</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions automatiques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions Automatiques</CardTitle>
                <CardDescription>
                  Définir les actions à exécuter automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="autoAction">Action pour spam détecté</Label>
                      <Select defaultValue="flag">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flag">Marquer comme signalé</SelectItem>
                          <SelectItem value="reject">Rejeter automatiquement</SelectItem>
                          <SelectItem value="review">Demander révision</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="autoActionInappropriate">Action pour contenu inapproprié</Label>
                      <Select defaultValue="reject">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flag">Marquer comme signalé</SelectItem>
                          <SelectItem value="reject">Rejeter automatiquement</SelectItem>
                          <SelectItem value="review">Demander révision</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="autoNotify" defaultChecked />
                    <Label htmlFor="autoNotify">Notifier automatiquement l'utilisateur</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="autoLog" defaultChecked />
                    <Label htmlFor="autoLog">Enregistrer toutes les actions</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModerationRulesModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => {
                // Ici on pourrait sauvegarder les règles
                setShowModerationRulesModal(false)
              }}
            >
              <Shield className="h-4 w-4 mr-2" />
              Sauvegarder les Règles
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des rapports */}
      <Dialog open={showReportsModal} onOpenChange={setShowReportsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rapports de Modération
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
                    <div className="text-sm text-gray-600">Signalements totaux</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {reports.filter(r => r.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">En attente</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {reports.filter(r => r.status === 'resolved').length}
                    </div>
                    <div className="text-sm text-gray-600">Résolus</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {reports.filter(r => r.priority === 'critical').length}
                    </div>
                    <div className="text-sm text-gray-600">Critiques</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Répartition par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['inappropriate', 'spam', 'fake', 'harassment', 'other'].map((category) => {
                    const count = reports.filter(r => r.category === category).length
                    const percentage = reports.length > 0 ? (count / reports.length * 100).toFixed(1) : '0'
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {category === 'inappropriate' ? 'Inapproprié' :
                             category === 'spam' ? 'Spam' :
                             category === 'fake' ? 'Faux avis' :
                             category === 'harassment' ? 'Harcèlement' : 'Autre'}
                          </Badge>
                          <span className="text-sm text-gray-600">{count} signalements</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={parseFloat(percentage)} className="w-20" />
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Répartition par priorité */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition par Priorité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(['low', 'medium', 'high', 'critical'] as const).map((priority) => {
                    const count = reports.filter(r => r.priority === priority).length
                    const percentage = reports.length > 0 ? (count / reports.length * 100).toFixed(1) : '0'
                    return (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(priority)}
                          <span className="text-sm text-gray-600">{count} signalements</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={parseFloat(percentage)} className="w-20" />
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tendances temporelles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendances Temporelles</CardTitle>
                <CardDescription>
                  Évolution des signalements au fil du temps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">+15%</div>
                      <div className="text-sm text-gray-600">Cette semaine</div>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">-8%</div>
                      <div className="text-sm text-gray-600">Ce mois</div>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">+22%</div>
                      <div className="text-sm text-gray-600">Ce trimestre</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Temps moyen de résolution : <span className="font-medium">2.3 jours</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions recommandées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions Recommandées</CardTitle>
                <CardDescription>
                  Suggestions basées sur l'analyse des données
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">Augmentation des signalements critiques</p>
                      <p className="text-sm text-orange-700">Revoir les règles de détection automatique</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Temps de résolution élevé</p>
                      <p className="text-sm text-blue-700">Ajouter plus de modérateurs ou optimiser le processus</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border border-green-200 rounded-lg bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Bonne performance générale</p>
                      <p className="text-sm text-green-700">Maintenir les règles actuelles</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowReportsModal(false)}>
              Fermer
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => {
                exportModerationReports()
                setShowReportsModal(false)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter les Rapports
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'export des avis */}
      <Dialog open={showReviewsExportModal} onOpenChange={setShowReviewsExportModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exporter les Avis Clients
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* Options d'export */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options d'Export</CardTitle>
                <CardDescription>
                  Choisissez le format et les données à exporter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exportFormat">Format d'export</Label>
                      <Select defaultValue="both">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON uniquement</SelectItem>
                          <SelectItem value="csv">CSV uniquement</SelectItem>
                          <SelectItem value="both">Les deux formats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="exportFilter">Filtre d'export</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les avis</SelectItem>
                          <SelectItem value="verified">Avis vérifiés uniquement</SelectItem>
                          <SelectItem value="approved">Avis approuvés uniquement</SelectItem>
                          <SelectItem value="pending">Avis en attente uniquement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateRange">Période</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les périodes</SelectItem>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="week">Cette semaine</SelectItem>
                        <SelectItem value="month">Ce mois</SelectItem>
                        <SelectItem value="quarter">Ce trimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Résumé de l'export */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé de l'Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total des avis à exporter :</span>
                    <span className="font-medium">{filteredReviews.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avis vérifiés :</span>
                    <span className="font-medium">{filteredReviews.filter(r => r.verified).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Note moyenne :</span>
                    <span className="font-medium">
                      {filteredReviews.length > 0 
                        ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(1)
                        : '0'
                      }/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avis avec images :</span>
                    <span className="font-medium">
                      {filteredReviews.filter(r => r.images && r.images.length > 0).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avis vidéo :</span>
                    <span className="font-medium">
                      {filteredReviews.filter(r => r.isVideo).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowReviewsExportModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => {
                exportReviews()
                setShowReviewsExportModal(false)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter les Avis
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuration des avis */}
      <Dialog open={showReviewsConfigModal} onOpenChange={setShowReviewsConfigModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration des Avis Clients
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Paramètres généraux */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paramètres Généraux</CardTitle>
                <CardDescription>
                  Configuration de base pour la gestion des avis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Modération automatique</Label>
                      <p className="text-xs text-gray-600">Approuver automatiquement les avis vérifiés</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Notifications de nouveaux avis</Label>
                      <p className="text-xs text-gray-600">Alerter les modérateurs des nouveaux avis</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Vérification obligatoire</Label>
                      <p className="text-xs text-gray-600">Exiger la vérification d'achat</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Limite de caractères</Label>
                      <p className="text-xs text-gray-600">Activer la limite de caractères</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limites et seuils */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Limites et Seuils</CardTitle>
                <CardDescription>
                  Définir les limites pour les avis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Longueur minimale</Label>
                    <Input
                      id="minLength"
                      type="number"
                      placeholder="10"
                      defaultValue="10"
                    />
                    <p className="text-xs text-gray-600">Nombre minimum de caractères</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxLength">Longueur maximale</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      placeholder="1000"
                      defaultValue="1000"
                    />
                    <p className="text-xs text-gray-600">Nombre maximum de caractères</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxImages">Images maximum</Label>
                    <Input
                      id="maxImages"
                      type="number"
                      placeholder="5"
                      defaultValue="5"
                    />
                    <p className="text-xs text-gray-600">Nombre maximum d'images par avis</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxTags">Tags maximum</Label>
                    <Input
                      id="maxTags"
                      type="number"
                      placeholder="10"
                      defaultValue="10"
                    />
                    <p className="text-xs text-gray-600">Nombre maximum de tags</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Règles de modération */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Règles de Modération</CardTitle>
                <CardDescription>
                  Définir les règles pour l'approbation automatique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="autoApproveRating">Note minimum pour auto-approbation</Label>
                      <Select defaultValue="4">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 étoile</SelectItem>
                          <SelectItem value="2">2 étoiles</SelectItem>
                          <SelectItem value="3">3 étoiles</SelectItem>
                          <SelectItem value="4">4 étoiles</SelectItem>
                          <SelectItem value="5">5 étoiles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="autoApproveVerified">Auto-approbation avis vérifiés</Label>
                      <Select defaultValue="yes">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Oui</SelectItem>
                          <SelectItem value="no">Non</SelectItem>
                          <SelectItem value="conditional">Conditionnel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="autoRejectSpam" defaultChecked />
                    <Label htmlFor="autoRejectSpam">Rejeter automatiquement le spam détecté</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="autoFlagInappropriate" defaultChecked />
                    <Label htmlFor="autoFlagInappropriate">Marquer automatiquement le contenu inapproprié</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications et alertes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notifications et Alertes</CardTitle>
                <CardDescription>
                  Configuration des notifications pour les avis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="notificationEmail">Email de notification</Label>
                      <Input
                        id="notificationEmail"
                        type="email"
                        placeholder="moderation@probooster.com"
                        defaultValue="moderation@probooster.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notificationFrequency">Fréquence des notifications</Label>
                      <Select defaultValue="realtime">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Temps réel</SelectItem>
                          <SelectItem value="hourly">Toutes les heures</SelectItem>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notifyNewReviews" defaultChecked />
                    <Label htmlFor="notifyNewReviews">Notifier les nouveaux avis</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notifyFlaggedReviews" defaultChecked />
                    <Label htmlFor="notifyFlaggedReviews">Notifier les avis signalés</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notifyLowRating" defaultChecked />
                    <Label htmlFor="notifyLowRating">Notifier les notes basses (1-2 étoiles)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowReviewsConfigModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => {
                // Ici on pourrait sauvegarder la configuration
                setShowReviewsConfigModal(false)
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Sauvegarder la Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de modération des réponses */}
      <Dialog open={showResponseModerationModal} onOpenChange={setShowResponseModerationModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Modération de Réponse
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {selectedResponse && (
              <>
                {/* Informations de la réponse */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Détails de la Réponse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Utilisateur</Label>
                          <p className="text-sm text-gray-700">{selectedResponse.user}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Produit</Label>
                          <p className="text-sm text-gray-700">{selectedResponse.product}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Réponse du vendeur</Label>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm italic">"{selectedResponse.response}"</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Date</Label>
                          <p className="text-sm text-gray-700">{selectedResponse.date}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Statut actuel</Label>
                          <Badge variant={selectedResponse.status === 'approved' ? 'default' : 'secondary'}>
                            {selectedResponse.status === 'approved' ? 'Approuvé' : 'En attente'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analyse de la réponse */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analyse de la Réponse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">85%</div>
                          <div className="text-sm text-gray-600">Score de politesse</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">92%</div>
                          <div className="text-sm text-gray-600">Pertinence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">78%</div>
                          <div className="text-sm text-gray-600">Professionnalisme</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-sm font-medium">Analyse automatique</Label>
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm">
                            ✅ Réponse polie et professionnelle<br/>
                            ✅ Répond directement au commentaire du client<br/>
                            ⚠️ Pourrait être plus détaillée
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions de modération */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions de Modération</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Boutons d'action rapide */}
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveResponse(selectedResponse.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        
                        <Button 
                          variant="destructive"
                          onClick={() => rejectResponse(selectedResponse.id, 'Contenu inapproprié')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={() => requestModifications(selectedResponse.id, 'Améliorer la réponse')}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Demander Modifications
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      {/* Formulaire de rejet personnalisé */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Motif de rejet (optionnel)</Label>
                        <Textarea 
                          placeholder="Expliquez pourquoi cette réponse doit être rejetée..."
                          className="min-h-[80px]"
                        />
                      </div>
                      
                      {/* Formulaire de modifications */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Modifications suggérées (optionnel)</Label>
                        <Textarea 
                          placeholder="Décrivez les modifications à apporter à cette réponse..."
                          className="min-h-[80px]"
                        />
                      </div>
                      
                      {/* Paramètres avancés */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Options avancées</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="notifyVendor" defaultChecked />
                            <Label htmlFor="notifyVendor" className="text-sm">
                              Notifier le vendeur de la décision
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch id="addToHistory" defaultChecked />
                            <Label htmlFor="addToHistory" className="text-sm">
                              Ajouter à l'historique de modération
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch id="autoFlag" />
                            <Label htmlFor="autoFlag" className="text-sm">
                              Signaler automatiquement les réponses similaires
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowResponseModerationModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => {
                // Action finale de sauvegarde
                addNotification({
                  type: 'success',
                  title: 'Modération terminée',
                  message: 'Les actions de modération ont été appliquées.'
                })
                setShowResponseModerationModal(false)
              }}
            >
              <Shield className="h-4 w-4 mr-2" />
              Appliquer la Modération
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation d'avis vidéo */}
      <Dialog open={showVideoViewModal} onOpenChange={setShowVideoViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualisation d'Avis Vidéo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {selectedVideoReview && (
              <>
                {/* Informations de l'avis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Détails de l'Avis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Titre</Label>
                        <p className="text-sm text-gray-600">{selectedVideoReview.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Utilisateur</Label>
                        <p className="text-sm text-gray-600">{selectedVideoReview.userName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date</Label>
                        <p className="text-sm text-gray-600">{selectedVideoReview.time}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Statut</Label>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          En attente
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lecteur vidéo simulé */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contenu Vidéo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Lecteur vidéo</p>
                        <p className="text-xs text-gray-500">Cliquez pour lire l'avis vidéo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Métadonnées et statistiques */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métadonnées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Durée</Label>
                        <p className="text-sm text-gray-600">2 min 34 sec</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Qualité</Label>
                        <p className="text-sm text-gray-600">1080p HD</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Format</Label>
                        <p className="text-sm text-gray-600">MP4</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Taille</Label>
                        <p className="text-sm text-gray-600">45.2 MB</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowVideoViewModal(false)}>
              Fermer
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                moderateVideoReview(selectedVideoReview)
                setShowVideoViewModal(false)
              }}
            >
              <Shield className="h-4 w-4 mr-2" />
              Modérer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de modération d'avis vidéo */}
      <Dialog open={showVideoModerationModal} onOpenChange={setShowVideoModerationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Modération d'Avis Vidéo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {selectedVideoReview && (
              <>
                {/* Informations de l'avis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Détails de l'Avis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Titre</Label>
                        <p className="text-sm text-gray-600">{selectedVideoReview.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Utilisateur</Label>
                        <p className="text-sm text-gray-600">{selectedVideoReview.userName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date</Label>
                        <p className="text-sm text-gray-600">{selectedVideoReview.time}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Statut</Label>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          En attente
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analyse automatique */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analyse Automatique</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Score de qualité</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={85} className="flex-1" />
                          <span className="text-sm font-medium">85%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Score de pertinence</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={92} className="flex-1" />
                          <span className="text-sm font-medium">92%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Détection de contenu</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={78} className="flex-1" />
                          <span className="text-sm font-medium">78%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Qualité audio</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={88} className="flex-1" />
                          <span className="text-sm font-medium">88%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions de modération */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions de Modération</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveVideoReview(selectedVideoReview.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver l'Avis
                      </Button>
                      
                      <Button 
                        variant="destructive"
                        onClick={() => rejectVideoReview(selectedVideoReview.id, 'Contenu inapproprié')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter l'Avis
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => requestVideoModifications(selectedVideoReview.id, 'Améliorer la qualité')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Demander des Modifications
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Options avancées */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Options Avancées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch id="notifyUser" defaultChecked />
                        <Label htmlFor="notifyUser" className="text-sm">
                          Notifier l'utilisateur de la décision
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="addToModerationHistory" defaultChecked />
                        <Label htmlFor="addToModerationHistory" className="text-sm">
                          Ajouter à l'historique de modération
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="flagSimilarContent" />
                        <Label htmlFor="flagSimilarContent" className="text-sm">
                          Signaler automatiquement le contenu similaire
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowVideoModerationModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Modération terminée',
                  message: 'Les actions de modération ont été appliquées.'
                })
                setShowVideoModerationModal(false)
              }}
            >
              <Shield className="h-4 w-4 mr-2" />
              Appliquer la Modération
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal du rapport complet */}
      <Dialog open={showCompleteReportModal} onOpenChange={setShowCompleteReportModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rapport Complet - Avis & Réputation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Résumé exécutif */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résumé Exécutif</CardTitle>
                <CardDescription>
                  Vue d'ensemble des performances et indicateurs clés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-yellow-600">Note moyenne</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{stats.totalReviews.toLocaleString()}</div>
                    <div className="text-sm text-blue-600">Total avis</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{stats.satisfactionRate}%</div>
                    <div className="text-sm text-green-600">Satisfaction</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">{stats.responseRate}%</div>
                    <div className="text-sm text-purple-600">Taux réponse</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 mb-2">Insights Clés</h4>
                  <ul className="space-y-1 text-sm text-emerald-700">
                    <li>• Performance excellente avec {stats.satisfactionRate}% de satisfaction</li>
                    <li>• Croissance mensuelle de {stats.monthlyGrowth}%</li>
                    <li>• {stats.responseRate}% de taux de réponse des vendeurs</li>
                    <li>• Seulement {((stats.flaggedReviews / stats.totalReviews) * 100).toFixed(1)}% d'avis signalés</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques détaillées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiques Détaillées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Distribution des notes */}
                <div>
                  <h4 className="font-semibold mb-3">Distribution des Notes</h4>
                  <div className="space-y-2">
                    {stats.ratingDistribution.map((rating) => (
                      <div key={rating.rating} className="flex items-center gap-3">
                        <div className="w-8 text-sm font-medium">{rating.rating}★</div>
                        <Progress value={rating.percentage} className="flex-1" />
                        <div className="w-16 text-sm text-gray-600">{rating.count}</div>
                        <div className="w-16 text-sm text-gray-600">({rating.percentage}%)</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance par catégorie */}
                <div>
                  <h4 className="font-semibold mb-3">Performance par Catégorie</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.topCategories.map((category) => (
                      <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{category.count} avis</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {category.rating}★
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statut de vérification */}
                <div>
                  <h4 className="font-semibold mb-3">Statut de Vérification</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-700">{stats.verifiedReviews}</div>
                      <div className="text-sm text-green-600">Vérifiés</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-xl font-bold text-yellow-700">{stats.totalReviews - stats.verifiedReviews}</div>
                      <div className="text-sm text-yellow-600">Non vérifiés</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-700">{((stats.verifiedReviews / stats.totalReviews) * 100).toFixed(1)}%</div>
                      <div className="text-sm text-blue-600">Taux vérification</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métriques de modération */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métriques de Modération</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-700">{reports.length}</div>
                    <div className="text-sm text-red-600">Total signalements</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xl font-bold text-yellow-700">{reports.filter(r => r.status === 'pending').length}</div>
                    <div className="text-sm text-yellow-600">En attente</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-700">{reports.filter(r => r.status === 'investigating').length}</div>
                    <div className="text-sm text-blue-600">En cours</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-700">{reports.filter(r => r.status === 'resolved').length}</div>
                    <div className="text-sm text-green-600">Résolus</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Distribution par Priorité</h4>
                    <div className="space-y-2">
                      {(['low', 'medium', 'high', 'critical'] as const).map((priority) => {
                        const count = reports.filter(r => r.priority === priority).length
                        const percentage = reports.length > 0 ? ((count / reports.length) * 100).toFixed(1) : '0'
                        return (
                          <div key={priority} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{priority === 'low' ? 'Faible' : priority === 'medium' ? 'Moyenne' : priority === 'high' ? 'Élevée' : 'Critique'}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={parseFloat(percentage)} className="w-20" />
                              <span className="text-sm text-gray-600">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Efficacité de Modération</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Temps de résolution moyen</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">1.8 jours</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Efficacité globale</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">94.2%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tendances et évolutions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendances et Évolutions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Hebdomadaire</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div>Nouveaux avis: <span className="font-semibold">+5.2%</span></div>
                      <div>Note moyenne: <span className="font-semibold">+0.1</span></div>
                      <div>Satisfaction: <span className="font-semibold">+0.3%</span></div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Mensuel</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <div>Nouveaux avis: <span className="font-semibold">+{stats.monthlyGrowth}%</span></div>
                      <div>Note moyenne: <span className="font-semibold">+0.2</span></div>
                      <div>Satisfaction: <span className="font-semibold">+0.8%</span></div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Trimestriel</h4>
                    <div className="space-y-1 text-sm text-purple-700">
                      <div>Nouveaux avis: <span className="font-semibold">+18.7%</span></div>
                      <div>Note moyenne: <span className="font-semibold">+0.4</span></div>
                      <div>Satisfaction: <span className="font-semibold">+2.1%</span></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommandations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommandations Stratégiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800">Maintenir l'Excellence</h4>
                        <p className="text-sm text-green-700">Continuer les bonnes pratiques actuelles pour maintenir le niveau de satisfaction élevé.</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">Priorité: Élevée</Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">Impact: Élevé</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">Optimiser le Temps de Résolution</h4>
                        <p className="text-sm text-yellow-700">Réduire le temps de traitement des signalements pour améliorer l'efficacité de modération.</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Priorité: Moyenne</Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">Impact: Moyen</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Encourager les Avis Vidéo</h4>
                        <p className="text-sm text-blue-700">Augmenter le pourcentage d'avis avec contenu multimédia pour enrichir l'expérience utilisateur.</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">Priorité: Faible</Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">Impact: Faible</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Évaluation des risques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Évaluation des Risques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Niveau de Risque Global: FAIBLE</h4>
                    <p className="text-sm text-green-700">La plateforme présente un excellent niveau de sécurité et de qualité des avis.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h5 className="font-medium">Signalements critiques</h5>
                        <p className="text-sm text-gray-600">Seulement 2 signalements critiques ce mois</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Faible</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h5 className="font-medium">Avis négatifs</h5>
                        <p className="text-sm text-gray-600">Moins de 1% d'avis négatifs</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Faible</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h5 className="font-medium">Temps de réponse</h5>
                        <p className="text-sm text-gray-600">Peut être amélioré pour certains vendeurs</p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Moyen</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowCompleteReportModal(false)}>
              Fermer
            </Button>
            <Button 
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              onClick={() => {
                generateCompleteReport()
                setShowCompleteReportModal(false)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le Rapport
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
