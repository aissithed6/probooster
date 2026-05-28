"use client"

import { useState, useEffect } from 'react'
import { 
  Users, UserPlus, UserCheck, UserX, Shield, 
  Search, Filter, MoreHorizontal, Eye, Edit,
  Trash2, CheckCircle, XCircle, Clock, Star,
  Mail, Phone, MapPin, Calendar, Activity,
  Settings, Lock, Key, Plus, Download, Copy,
  Upload, Sparkles, Bell, Store, Cog, Info,
  AlertTriangle, Database, RefreshCw, MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'buyer' | 'vendor' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'verified'
  type: 'buyer' | 'vendor' | 'admin'
  joinDate: string
  lastActive: string
  totalOrders: number
  totalSpent: number
  totalEarnings: number
  rating: number
  isVerified: boolean
  has2FA: boolean
  location: string
  avatar?: string
  loyaltyPoints?: number
  bio?: string
  website?: string
  socialMedia?: {
    facebook: string
    twitter: string
    linkedin: string
    instagram: string
    whatsapp: string
  }
  preferences?: {
    language: string
    timezone: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  security?: {
    twoFactorEnabled: boolean
    loginNotifications: boolean
    sessionTimeout: number
  }
  // Nouvelles propriétés pour le filtrage avancé
  productsShared?: number
  productsReturned?: number
  reportsFiled?: number
  reportsReceived?: number
  totalSales?: number
  boostServices?: number
  promotionsUsed?: number
  shopProducts?: number
  profileCompletion?: number
  engagementScore?: number
  lastPurchaseDate?: string
  averageOrderValue?: number
  customerLifetimeValue?: number
  churnRisk?: 'low' | 'medium' | 'high'
  activityLevel?: 'very_active' | 'active' | 'moderate' | 'inactive'
  verificationDocuments?: string[]
  accountAge?: number // en jours
  loginFrequency?: number // connexions par semaine
  timeSpentOnPlatform?: number // en minutes par session
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  // États pour la sélection multiple et actions en lot
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // État pour le menu contextuel des 3 points
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // États pour la création/édition d'utilisateur
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'buyer' as User['role'],
    type: 'buyer' as User['type'],
    location: '',
    password: '',
    confirmPassword: '',
    avatar: '',
    loyaltyPoints: 0,
    bio: '',
    website: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      whatsapp: ''
    },
    preferences: {
      language: 'fr',
      timezone: 'Africa/Abidjan',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    },
    security: {
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: 30
    }
  })

  // État pour les rôles multiples
  const [selectedRoles, setSelectedRoles] = useState<Set<User['role']>>(new Set(['buyer']))
  const [customPermissions, setCustomPermissions] = useState<Set<string>>(new Set())

  // État pour la gestion des fonctionnalités par rôle
  const [roleFeatures, setRoleFeatures] = useState({
    buyer: {
      dashboard: ['overview', 'orders', 'wishlist', 'dashboard_reviews', 'settings', 'profile', 'addresses', 'payment_methods', 'user_notifications', 'preferences'],
      marketplace: ['browse', 'search', 'compare', 'favorites', 'categories', 'brands', 'deals', 'trending', 'recommendations', 'price_alerts'],
      communication: ['chat', 'support', 'communication_reviews', 'ratings', 'feedback', 'help_center', 'faq'],
      financial: ['payment_history', 'refunds', 'coupons', 'loyalty_points', 'gift_cards', 'subscriptions'],
      social: ['follow_vendors', 'share_products', 'invite_friends', 'social_login', 'community_forum']
    },
    vendor: {
      dashboard: ['overview', 'products', 'orders', 'analytics', 'earnings', 'customers', 'inventory', 'performance', 'insights', 'reports'],
      marketplace: ['manage_products', 'inventory', 'pricing', 'promotions', 'categories', 'brands', 'seo', 'marketing', 'advertising', 'partnerships'],
      communication: ['chat', 'vendor_notifications', 'support', 'customer_service', 'email_marketing', 'sms_campaigns', 'social_media', 'live_chat', 'ticket_system'],
      financial: ['payments', 'withdrawals', 'reports', 'taxes', 'invoicing', 'accounting', 'payouts', 'commissions', 'fees', 'currency_management'],
      operations: ['shipping', 'fulfillment', 'returns', 'warranty', 'quality_control', 'supplier_management', 'logistics', 'warehouse']
    },
    admin: {
      dashboard: ['overview', 'users', 'products', 'orders', 'analytics', 'system_health', 'performance', 'security', 'reports', 'insights'],
      management: ['user_management', 'product_management', 'order_management', 'vendor_management', 'category_management', 'brand_management', 'content_moderation', 'dispute_resolution'],
      system: ['settings', 'backup', 'logs', 'maintenance', 'updates', 'security', 'api_management', 'integrations', 'third_party_services', 'system_configuration'],
      financial: ['reports', 'transactions', 'refunds', 'commissions', 'payouts', 'taxes', 'audit', 'compliance', 'fraud_detection', 'risk_management'],
      analytics: ['user_analytics', 'product_analytics', 'sales_analytics', 'performance_metrics', 'kpi_dashboard', 'custom_reports', 'data_export', 'trend_analysis']
    },
    super_admin: {
      dashboard: ['overview', 'system_health', 'performance', 'security', 'global_analytics', 'user_insights', 'business_intelligence', 'real_time_monitoring', 'alerts', 'admin_notifications'],
      management: ['all_features', 'role_management', 'permission_management', 'user_management', 'product_management', 'order_management', 'vendor_management', 'admin_management', 'content_management', 'system_administration'],
      system: ['all_settings', 'database', 'api', 'integrations', 'infrastructure', 'cloud_services', 'backup_recovery', 'disaster_recovery', 'performance_tuning', 'scalability', 'security_audit', 'compliance_management'],
      financial: ['all_financial', 'audit', 'compliance', 'risk_management', 'global_financial_control', 'multi_currency', 'tax_management', 'fraud_prevention', 'financial_reporting', 'budget_management'],
      security: ['access_control', 'authentication', 'authorization', 'encryption', 'vpn_management', 'firewall_configuration', 'intrusion_detection', 'security_monitoring', 'incident_response', 'vulnerability_management'],
      development: ['code_management', 'version_control', 'deployment', 'testing', 'quality_assurance', 'documentation', 'api_development', 'third_party_integrations', 'custom_development', 'maintenance']
    }
  })

  // État pour les fonctionnalités sélectionnées pour l'utilisateur
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  // États pour la configuration des approbations
  const [approvalSettings, setApprovalSettings] = useState({
    vendorAutoApproval: false,
    adminAutoApproval: false,
    requireDocumentVerification: true,
    requirePhoneVerification: true,
    requireEmailVerification: true,
    approvalDelay: 24, // heures
    maxPendingVendors: 50
  })

  // États pour la gestion des rôles
  const [customRoles, setCustomRoles] = useState([
    {
      id: '1',
      name: 'Modérateur',
      description: 'Peut modérer le contenu et gérer les signalements',
      permissions: ['moderate_content', 'manage_reports', 'view_analytics'],
      userCount: 3,
      isActive: true,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Support Client',
      description: 'Gère le support client et les tickets',
      permissions: ['view_tickets', 'respond_tickets', 'escalate_tickets'],
      userCount: 5,
      isActive: true,
      createdAt: '2024-02-20'
    }
  ])
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  })

  // États pour le système de filtrage avancé
  const [advancedFilters, setAdvancedFilters] = useState({
    // Filtres par statistiques
    loyaltyPointsRange: { min: 0, max: 10000 },
    productsSharedRange: { min: 0, max: 1000 },
    ordersRange: { min: 0, max: 1000 },
    productsReturnedRange: { min: 0, max: 100 },
    reportsFiledRange: { min: 0, max: 50 },
    reportsReceivedRange: { min: 0, max: 50 },
    totalSalesRange: { min: 0, max: 10000000 },
    boostServicesRange: { min: 0, max: 100 },
    promotionsUsedRange: { min: 0, max: 100 },
    shopProductsRange: { min: 0, max: 1000 },
    
    // Filtres par comportement
    profileCompletionRange: { min: 0, max: 100 },
    engagementScoreRange: { min: 0, max: 100 },
    averageOrderValueRange: { min: 0, max: 1000000 },
    customerLifetimeValueRange: { min: 0, max: 10000000 },
    accountAgeRange: { min: 0, max: 3650 }, // 10 ans max
    loginFrequencyRange: { min: 0, max: 100 },
    timeSpentRange: { min: 0, max: 480 }, // 8h max
    
    // Filtres par statut et activité
    churnRisk: [] as string[],
    activityLevel: [] as string[],
    verificationStatus: [] as string[],
    
    // Filtres par dates
    joinDateRange: { start: '', end: '' },
    lastActiveRange: { start: '', end: '' },
    lastPurchaseRange: { start: '', end: '' },
    
    // Filtres combinés
    hasVerifiedDocuments: null as boolean | null,
    hasCompletedProfile: null as boolean | null,
    isHighValueCustomer: null as boolean | null,
    isEngagedUser: null as boolean | null
  })

  // Fonction utilitaire pour calculer les dates
  const getDateDaysAgo = (days: number): string => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  // Interface pour les filtres sauvegardés
  interface SavedFilter {
    id: string
    name: string
    description: string
    filters: Partial<typeof advancedFilters>
    createdAt: string
  }

  // Filtres prédéfinis
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    {
      id: '1',
      name: 'Vendeurs Actifs',
      description: 'Vendeurs avec plus de 10 produits et ventes récentes',
      filters: {
        shopProductsRange: { min: 10, max: 1000 },
        lastActiveRange: { start: getDateDaysAgo(30), end: '' }
      },
      createdAt: '2024-12-19'
    },
    {
      id: '2',
      name: 'Acheteurs VIP',
      description: 'Acheteurs avec plus de 100.000 F CFA dépensés',
      filters: {
        customerLifetimeValueRange: { min: 100000, max: 10000000 },
        loyaltyPointsRange: { min: 500, max: 10000 }
      },
      createdAt: '2024-12-19'
    },
    {
      id: '3',
      name: 'Utilisateurs à Risque',
      description: 'Utilisateurs inactifs depuis plus de 90 jours',
      filters: {
        lastActiveRange: { start: '', end: getDateDaysAgo(90) },
        activityLevel: ['inactive']
      },
      createdAt: '2024-12-19'
    },
    {
      id: '4',
      name: 'Nouveaux Inscrits',
      description: 'Utilisateurs inscrits dans les 30 derniers jours',
      filters: {
        joinDateRange: { start: getDateDaysAgo(30), end: '' }
      },
      createdAt: '2024-12-19'
    },
    {
      id: '5',
      name: 'Utilisateurs Vérifiés',
      description: 'Tous les utilisateurs avec documents vérifiés',
      filters: {
        hasVerifiedDocuments: true
      },
      createdAt: '2024-12-19'
    }
  ])

  // État pour les actions post-filtrage
  const [filteredResults, setFilteredResults] = useState<User[]>([])
  const [filteredCount, setFilteredCount] = useState(0)
  const [activeFilterName, setActiveFilterName] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showSavedFilters, setShowSavedFilters] = useState(false)

  // États pour les actions post-filtrage
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedFilteredUsers, setSelectedFilteredUsers] = useState<Set<string>>(new Set())

  // États pour les messages en masse
  const [messageTemplate, setMessageTemplate] = useState('')
  const [messageSubject, setMessageSubject] = useState('')
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'push' | 'in_app'>('email')
  const [messageTemplates, setMessageTemplates] = useState([
    {
      id: '1',
      name: 'Bienvenue Nouveaux Utilisateurs',
      subject: 'Bienvenue sur Probooster !',
      content: 'Cher(e) {name}, bienvenue sur Probooster ! Nous sommes ravis de vous compter parmi nos utilisateurs.',
      type: 'email'
    },
    {
      id: '2',
      name: 'Promotion Spéciale',
      subject: 'Offre exclusive pour vous !',
      content: 'Bonjour {name}, profitez de notre offre exclusive avec 20% de réduction sur votre prochaine commande !',
      type: 'email'
    },
    {
      id: '3',
      name: 'Rappel d\'activité',
      subject: 'Nous vous attendons !',
      content: 'Salut {name}, il y a longtemps qu\'on ne vous a pas vu ! Revenez vite sur Probooster.',
      type: 'push'
    }
  ])

  // États pour les rapports automatiques
  const [autoReports, setAutoReports] = useState([
    {
      id: '1',
      name: 'Rapport Quotidien Utilisateurs',
      description: 'Résumé quotidien des activités utilisateurs',
      schedule: 'daily',
      lastRun: '2024-12-19',
      isActive: true,
      filters: {},
      recipients: ['admin@probooster.ci']
    },
    {
      id: '2',
      name: 'Rapport Hebdomadaire Vendeurs',
      description: 'Performance des vendeurs hebdomadaire',
      schedule: 'weekly',
      lastRun: '2024-12-16',
      isActive: true,
      filters: { role: ['vendor'] },
      recipients: ['sales@probooster.ci']
    }
  ])

  // États pour les analytics et l'historique
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })
  
  const [userHistory, setUserHistory] = useState([
    {
      id: '1',
      userId: '1',
      action: 'login',
      timestamp: '2024-12-19 14:30:00',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0',
      status: 'success'
    },
    {
      id: '2',
      userId: '2',
      action: 'profile_update',
      timestamp: '2024-12-19 13:45:00',
      ipAddress: '192.168.1.101',
      userAgent: 'Firefox 121.0',
      status: 'success'
    },
    {
      id: '3',
      userId: '3',
      action: 'password_reset',
      timestamp: '2024-12-19 12:20:00',
      ipAddress: '192.168.1.102',
      userAgent: 'Safari 17.0',
      status: 'success'
    }
  ])

  useEffect(() => {
    // Gérer l'affichage de la barre d'actions en lot
    setShowBulkActions(selectedUsers.size > 0)
  }, [selectedUsers.size])

  useEffect(() => {
    // Fermer le menu d'export lors d'un clic à l'extérieur
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.export-menu-container')) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Fermer le menu des 3 points lors d'un clic à l'extérieur
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu-container')) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Simulation du chargement des utilisateurs
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '+225 01234567',
        role: 'buyer',
        status: 'active',
        type: 'buyer',
        joinDate: '2024-01-15',
        lastActive: '2024-12-19 14:30',
        totalOrders: 25,
        totalSpent: 150000,
        totalEarnings: 0,
        rating: 4.8,
        isVerified: true,
        has2FA: true,
        location: 'Abidjan, Côte d\'Ivoire',
        loyaltyPoints: 1250,
        productsShared: 45,
        productsReturned: 2,
        reportsFiled: 1,
        reportsReceived: 0,
        totalSales: 0,
        boostServices: 0,
        promotionsUsed: 8,
        shopProducts: 0,
        profileCompletion: 95,
        engagementScore: 87,
        lastPurchaseDate: '2024-12-18',
        averageOrderValue: 6000,
        customerLifetimeValue: 150000,
        churnRisk: 'low',
        activityLevel: 'very_active',
        verificationDocuments: ['cni', 'justificatif_domicile'],
        accountAge: 338,
        loginFrequency: 15,
        timeSpentOnPlatform: 45
      },
      {
        id: '2',
        name: 'TechStore Pro',
        email: 'contact@techstore.ci',
        phone: '+225 08765432',
        role: 'vendor',
        status: 'pending',
        type: 'vendor',
        joinDate: '2024-12-18',
        lastActive: '2024-12-19 10:15',
        totalOrders: 0,
        totalSpent: 0,
        totalEarnings: 0,
        rating: 0,
        isVerified: false,
        has2FA: false,
        location: 'Abidjan, Côte d\'Ivoire',
        loyaltyPoints: 0,
        productsShared: 0,
        productsReturned: 0,
        reportsFiled: 0,
        reportsReceived: 0,
        totalSales: 0,
        boostServices: 0,
        promotionsUsed: 0,
        shopProducts: 0,
        profileCompletion: 60,
        engagementScore: 25,
        lastPurchaseDate: '',
        averageOrderValue: 0,
        customerLifetimeValue: 0,
        churnRisk: 'medium',
        activityLevel: 'moderate',
        verificationDocuments: [],
        accountAge: 1,
        loginFrequency: 3,
        timeSpentOnPlatform: 20
      },
      {
        id: '3',
        name: 'Marie Konan',
        email: 'marie.konan@admin.ci',
        phone: '+225 05678901',
        role: 'admin',
        status: 'active',
        type: 'admin',
        joinDate: '2024-06-10',
        lastActive: '2024-12-19 16:45',
        totalOrders: 0,
        totalSpent: 0,
        totalEarnings: 0,
        rating: 5.0,
        isVerified: true,
        has2FA: true,
        location: 'Yamoussoukro, Côte d\'Ivoire',
        loyaltyPoints: 500,
        productsShared: 0,
        productsReturned: 0,
        reportsFiled: 0,
        reportsReceived: 0,
        totalSales: 0,
        boostServices: 0,
        promotionsUsed: 0,
        shopProducts: 0,
        profileCompletion: 100,
        engagementScore: 95,
        lastPurchaseDate: '',
        averageOrderValue: 0,
        customerLifetimeValue: 0,
        churnRisk: 'low',
        activityLevel: 'very_active',
        verificationDocuments: ['cni', 'diplome_admin'],
        accountAge: 192,
        loginFrequency: 25,
        timeSpentOnPlatform: 120
      },
      {
        id: '4',
        name: 'Digital Solutions',
        email: 'info@digitalsolutions.ci',
        phone: '+225 02345678',
        role: 'vendor',
        status: 'verified',
        type: 'vendor',
        joinDate: '2024-03-22',
        lastActive: '2024-12-19 12:20',
        totalOrders: 156,
        totalSpent: 0,
        totalEarnings: 2500000,
        rating: 4.6,
        isVerified: true,
        has2FA: true,
        location: 'Abidjan, Côte d\'Ivoire',
        loyaltyPoints: 3200,
        productsShared: 234,
        productsReturned: 12,
        reportsFiled: 3,
        reportsReceived: 2,
        totalSales: 156,
        boostServices: 15,
        promotionsUsed: 25,
        shopProducts: 89,
        profileCompletion: 98,
        engagementScore: 92,
        lastPurchaseDate: '2024-12-19',
        averageOrderValue: 16025,
        customerLifetimeValue: 2500000,
        churnRisk: 'low',
        activityLevel: 'very_active',
        verificationDocuments: ['cni', 'registre_commerce', 'justificatif_bancaire'],
        accountAge: 272,
        loginFrequency: 20,
        timeSpentOnPlatform: 90
      },
      {
        id: '5',
        name: 'Ahmadou Diallo',
        email: 'ahmadou.diallo@email.com',
        phone: '+225 09876543',
        role: 'buyer',
        status: 'inactive',
        type: 'buyer',
        joinDate: '2024-02-08',
        lastActive: '2024-11-15 09:30',
        totalOrders: 8,
        totalSpent: 45000,
        totalEarnings: 0,
        rating: 4.2,
        isVerified: false,
        has2FA: false,
        location: 'Bouaké, Côte d\'Ivoire',
        loyaltyPoints: 180,
        productsShared: 12,
        productsReturned: 1,
        reportsFiled: 0,
        reportsReceived: 0,
        totalSales: 0,
        boostServices: 0,
        promotionsUsed: 3,
        shopProducts: 0,
        profileCompletion: 70,
        engagementScore: 35,
        lastPurchaseDate: '2024-11-10',
        averageOrderValue: 5625,
        customerLifetimeValue: 45000,
        churnRisk: 'high',
        activityLevel: 'inactive',
        verificationDocuments: [],
        accountAge: 314,
        loginFrequency: 1,
        timeSpentOnPlatform: 15
      },
      {
        id: '6',
        name: 'Sarah Traoré',
        email: 'sarah.traore@email.com',
        phone: '+225 04567890',
        role: 'buyer',
        status: 'active',
        type: 'buyer',
        joinDate: '2024-08-15',
        lastActive: '2024-12-19 18:20',
        totalOrders: 67,
        totalSpent: 890000,
        totalEarnings: 0,
        rating: 4.9,
        isVerified: true,
        has2FA: true,
        location: 'San-Pédro, Côte d\'Ivoire',
        loyaltyPoints: 4450,
        productsShared: 89,
        productsReturned: 3,
        reportsFiled: 2,
        reportsReceived: 0,
        totalSales: 0,
        boostServices: 0,
        promotionsUsed: 18,
        shopProducts: 0,
        profileCompletion: 92,
        engagementScore: 89,
        lastPurchaseDate: '2024-12-19',
        averageOrderValue: 13283,
        customerLifetimeValue: 890000,
        churnRisk: 'low',
        activityLevel: 'very_active',
        verificationDocuments: ['cni', 'justificatif_domicile'],
        accountAge: 126,
        loginFrequency: 18,
        timeSpentOnPlatform: 65
      },
      {
        id: '7',
        name: 'InnovTech Solutions',
        email: 'contact@innovtech.ci',
        phone: '+225 06789012',
        role: 'vendor',
        status: 'active',
        type: 'vendor',
        joinDate: '2024-01-05',
        lastActive: '2024-12-19 15:30',
        totalOrders: 89,
        totalSpent: 0,
        totalEarnings: 1800000,
        rating: 4.7,
        isVerified: true,
        has2FA: true,
        location: 'Abidjan, Côte d\'Ivoire',
        loyaltyPoints: 2800,
        productsShared: 167,
        productsReturned: 8,
        reportsFiled: 1,
        reportsReceived: 1,
        totalSales: 89,
        boostServices: 12,
        promotionsUsed: 22,
        shopProducts: 67,
        profileCompletion: 96,
        engagementScore: 88,
        lastPurchaseDate: '2024-12-19',
        averageOrderValue: 20224,
        customerLifetimeValue: 1800000,
        churnRisk: 'low',
        activityLevel: 'active',
        verificationDocuments: ['cni', 'registre_commerce'],
        accountAge: 348,
        loginFrequency: 16,
        timeSpentOnPlatform: 75
      },
      {
        id: '8',
        name: 'Kouassi Pierre',
        email: 'kouassi.pierre@email.com',
        phone: '+225 03456789',
        role: 'buyer',
        status: 'suspended',
        type: 'buyer',
        joinDate: '2024-05-20',
        lastActive: '2024-12-10 11:45',
        totalOrders: 12,
        totalSpent: 75000,
        totalEarnings: 0,
        rating: 3.8,
        isVerified: false,
        has2FA: false,
        location: 'Korhogo, Côte d\'Ivoire',
        loyaltyPoints: 320,
        productsShared: 8,
        productsReturned: 5,
        reportsFiled: 0,
        reportsReceived: 3,
        totalSales: 0,
        boostServices: 0,
        promotionsUsed: 4,
        shopProducts: 0,
        profileCompletion: 65,
        engagementScore: 28,
        lastPurchaseDate: '2024-12-05',
        averageOrderValue: 6250,
        customerLifetimeValue: 75000,
        churnRisk: 'high',
        activityLevel: 'inactive',
        verificationDocuments: [],
        accountAge: 213,
        loginFrequency: 2,
        timeSpentOnPlatform: 25
      }
    ]

    setUsers(mockUsers)
    setFilteredUsers(mockUsers)
  }, [])

  // Filtrage des utilisateurs
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, roleFilter])

  // Fonction de filtrage avancé
  const applyAdvancedFilters = () => {
    let filtered = users

    // Filtres par statistiques
    if (advancedFilters.loyaltyPointsRange.min > 0 || advancedFilters.loyaltyPointsRange.max < 10000) {
      filtered = filtered.filter(user => 
        (user.loyaltyPoints || 0) >= advancedFilters.loyaltyPointsRange.min &&
        (user.loyaltyPoints || 0) <= advancedFilters.loyaltyPointsRange.max
      )
    }

    if (advancedFilters.productsSharedRange.min > 0 || advancedFilters.productsSharedRange.max < 1000) {
      filtered = filtered.filter(user => 
        (user.productsShared || 0) >= advancedFilters.productsSharedRange.min &&
        (user.productsShared || 0) <= advancedFilters.productsSharedRange.max
      )
    }

    if (advancedFilters.ordersRange.min > 0 || advancedFilters.ordersRange.max < 1000) {
      filtered = filtered.filter(user => 
        user.totalOrders >= advancedFilters.ordersRange.min &&
        user.totalOrders <= advancedFilters.ordersRange.max
      )
    }

    if (advancedFilters.productsReturnedRange.min > 0 || advancedFilters.productsReturnedRange.max < 100) {
      filtered = filtered.filter(user => 
        (user.productsReturned || 0) >= advancedFilters.productsReturnedRange.min &&
        (user.productsReturned || 0) <= advancedFilters.productsReturnedRange.max
      )
    }

    if (advancedFilters.reportsFiledRange.min > 0 || advancedFilters.reportsFiledRange.max < 50) {
      filtered = filtered.filter(user => 
        (user.reportsFiled || 0) >= advancedFilters.reportsFiledRange.min &&
        (user.reportsFiled || 0) <= advancedFilters.reportsFiledRange.max
      )
    }

    if (advancedFilters.reportsReceivedRange.min > 0 || advancedFilters.reportsReceivedRange.max < 50) {
      filtered = filtered.filter(user => 
        (user.reportsReceived || 0) >= advancedFilters.reportsReceivedRange.min &&
        (user.reportsReceived || 0) <= advancedFilters.reportsReceivedRange.max
      )
    }

    if (advancedFilters.totalSalesRange.min > 0 || advancedFilters.totalSalesRange.max < 10000000) {
      filtered = filtered.filter(user => 
        (user.totalSales || 0) >= advancedFilters.totalSalesRange.min &&
        (user.totalSales || 0) <= advancedFilters.totalSalesRange.max
      )
    }

    if (advancedFilters.boostServicesRange.min > 0 || advancedFilters.boostServicesRange.max < 100) {
      filtered = filtered.filter(user => 
        (user.boostServices || 0) >= advancedFilters.boostServicesRange.min &&
        (user.boostServices || 0) <= advancedFilters.boostServicesRange.max
      )
    }

    if (advancedFilters.promotionsUsedRange.min > 0 || advancedFilters.promotionsUsedRange.max < 100) {
      filtered = filtered.filter(user => 
        (user.promotionsUsed || 0) >= advancedFilters.promotionsUsedRange.min &&
        (user.promotionsUsed || 0) <= advancedFilters.promotionsUsedRange.max
      )
    }

    if (advancedFilters.shopProductsRange.min > 0 || advancedFilters.shopProductsRange.max < 1000) {
      filtered = filtered.filter(user => 
        (user.shopProducts || 0) >= advancedFilters.shopProductsRange.min &&
        (user.shopProducts || 0) <= advancedFilters.shopProductsRange.max
      )
    }

    // Filtres par comportement
    if (advancedFilters.profileCompletionRange.min > 0 || advancedFilters.profileCompletionRange.max < 100) {
      filtered = filtered.filter(user => 
        (user.profileCompletion || 0) >= advancedFilters.profileCompletionRange.min &&
        (user.profileCompletion || 0) <= advancedFilters.profileCompletionRange.max
      )
    }

    if (advancedFilters.engagementScoreRange.min > 0 || advancedFilters.engagementScoreRange.max < 100) {
      filtered = filtered.filter(user => 
        (user.engagementScore || 0) >= advancedFilters.engagementScoreRange.min &&
        (user.engagementScore || 0) <= advancedFilters.engagementScoreRange.max
      )
    }

    if (advancedFilters.averageOrderValueRange.min > 0 || advancedFilters.averageOrderValueRange.max < 1000000) {
      filtered = filtered.filter(user => 
        (user.averageOrderValue || 0) >= advancedFilters.averageOrderValueRange.min &&
        (user.averageOrderValue || 0) <= advancedFilters.averageOrderValueRange.max
      )
    }

    if (advancedFilters.customerLifetimeValueRange.min > 0 || advancedFilters.customerLifetimeValueRange.max < 10000000) {
      filtered = filtered.filter(user => 
        (user.customerLifetimeValue || 0) >= advancedFilters.customerLifetimeValueRange.min &&
        (user.customerLifetimeValue || 0) <= advancedFilters.customerLifetimeValueRange.max
      )
    }

    if (advancedFilters.accountAgeRange.min > 0 || advancedFilters.accountAgeRange.max < 3650) {
      filtered = filtered.filter(user => 
        (user.accountAge || 0) >= advancedFilters.accountAgeRange.min &&
        (user.accountAge || 0) <= advancedFilters.accountAgeRange.max
      )
    }

    if (advancedFilters.loginFrequencyRange.min > 0 || advancedFilters.loginFrequencyRange.max < 100) {
      filtered = filtered.filter(user => 
        (user.loginFrequency || 0) >= advancedFilters.loginFrequencyRange.min &&
        (user.loginFrequency || 0) <= advancedFilters.loginFrequencyRange.max
      )
    }

    if (advancedFilters.timeSpentRange.min > 0 || advancedFilters.timeSpentRange.max < 480) {
      filtered = filtered.filter(user => 
        (user.timeSpentOnPlatform || 0) >= advancedFilters.timeSpentRange.min &&
        (user.timeSpentOnPlatform || 0) <= advancedFilters.timeSpentRange.max
      )
    }

    // Filtres par statut et activité
    if (advancedFilters.churnRisk.length > 0) {
      filtered = filtered.filter(user => user.churnRisk && advancedFilters.churnRisk.includes(user.churnRisk))
    }

    if (advancedFilters.activityLevel.length > 0) {
      filtered = filtered.filter(user => user.activityLevel && advancedFilters.activityLevel.includes(user.activityLevel))
    }

    // Filtres par dates
    if (advancedFilters.joinDateRange.start) {
      filtered = filtered.filter(user => user.joinDate >= advancedFilters.joinDateRange.start)
    }
    if (advancedFilters.joinDateRange.end) {
      filtered = filtered.filter(user => user.joinDate <= advancedFilters.joinDateRange.end)
    }

    if (advancedFilters.lastActiveRange.start) {
      filtered = filtered.filter(user => user.lastActive >= advancedFilters.lastActiveRange.start)
    }
    if (advancedFilters.lastActiveRange.end) {
      filtered = filtered.filter(user => user.lastActive <= advancedFilters.lastActiveRange.end)
    }

    if (advancedFilters.lastPurchaseRange.start && advancedFilters.lastPurchaseRange.start) {
      filtered = filtered.filter(user => 
        user.lastPurchaseDate && user.lastPurchaseDate >= advancedFilters.lastPurchaseRange.start
      )
    }
    if (advancedFilters.lastPurchaseRange.end && advancedFilters.lastPurchaseRange.end) {
      filtered = filtered.filter(user => 
        user.lastPurchaseDate && user.lastPurchaseDate <= advancedFilters.lastPurchaseRange.end
      )
    }

    // Filtres combinés
    if (advancedFilters.hasVerifiedDocuments !== null) {
      filtered = filtered.filter(user => 
        advancedFilters.hasVerifiedDocuments ? 
        (user.verificationDocuments && user.verificationDocuments.length > 0) :
        (!user.verificationDocuments || user.verificationDocuments.length === 0)
      )
    }

    if (advancedFilters.hasCompletedProfile !== null) {
      filtered = filtered.filter(user => 
        advancedFilters.hasCompletedProfile ? 
        (user.profileCompletion || 0) >= 90 :
        (user.profileCompletion || 0) < 90
      )
    }

    if (advancedFilters.isHighValueCustomer !== null) {
      filtered = filtered.filter(user => 
        advancedFilters.isHighValueCustomer ? 
        (user.customerLifetimeValue || 0) >= 500000 :
        (user.customerLifetimeValue || 0) < 500000
      )
    }

    if (advancedFilters.isEngagedUser !== null) {
      filtered = filtered.filter(user => 
        advancedFilters.isEngagedUser ? 
        (user.engagementScore || 0) >= 70 :
        (user.engagementScore || 0) < 70
      )
    }

    setFilteredResults(filtered)
    setFilteredCount(filtered.length)
    setFilteredUsers(filtered)
  }

  // Appliquer un filtre prédéfini
  const applySavedFilter = (filter: SavedFilter) => {
    setAdvancedFilters({ ...advancedFilters, ...filter.filters })
    setActiveFilterName(filter.name)
    applyAdvancedFilters()
  }

  // Réinitialiser tous les filtres
  const resetAllFilters = () => {
    setAdvancedFilters({
      loyaltyPointsRange: { min: 0, max: 10000 },
      productsSharedRange: { min: 0, max: 1000 },
      ordersRange: { min: 0, max: 1000 },
      productsReturnedRange: { min: 0, max: 100 },
      reportsFiledRange: { min: 0, max: 50 },
      reportsReceivedRange: { min: 0, max: 50 },
      totalSalesRange: { min: 0, max: 10000000 },
      boostServicesRange: { min: 0, max: 100 },
      promotionsUsedRange: { min: 0, max: 100 },
      shopProductsRange: { min: 0, max: 1000 },
      profileCompletionRange: { min: 0, max: 100 },
      engagementScoreRange: { min: 0, max: 100 },
      averageOrderValueRange: { min: 0, max: 1000000 },
      customerLifetimeValueRange: { min: 0, max: 10000000 },
      accountAgeRange: { min: 0, max: 3650 },
      loginFrequencyRange: { min: 0, max: 100 },
      timeSpentRange: { min: 0, max: 480 },
      churnRisk: [],
      activityLevel: [],
      verificationStatus: [],
      joinDateRange: { start: '', end: '' },
      lastActiveRange: { start: '', end: '' },
      lastPurchaseRange: { start: '', end: '' },
      hasVerifiedDocuments: null,
      hasCompletedProfile: null,
      isHighValueCustomer: null,
      isEngagedUser: null
    })
    setActiveFilterName('')
    setFilteredResults([])
    setFilteredCount(0)
    setFilteredUsers(users)
  }

  // Fonctions pour les actions post-filtrage

  // Envoyer des messages en masse
  const sendBulkMessage = async () => {
    if (selectedFilteredUsers.size === 0) {
      alert('Veuillez sélectionner au moins un utilisateur')
      return
    }

    const selectedUsers = filteredResults.filter(user => selectedFilteredUsers.has(user.id))
    console.log(`Envoi de message à ${selectedUsers.length} utilisateurs:`, {
      subject: messageSubject,
      content: messageTemplate,
      type: messageType,
      users: selectedUsers.map(u => ({ id: u.id, name: u.name, email: u.email }))
    })

    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert(`Message envoyé avec succès à ${selectedUsers.length} utilisateurs !`)
    setShowMessageModal(false)
    setMessageSubject('')
    setMessageTemplate('')
    setSelectedFilteredUsers(new Set())
  }

  // Exporter les résultats filtrés
  const exportFilteredResults = (format: 'csv' | 'excel' | 'pdf') => {
    if (filteredResults.length === 0) {
      alert('Aucun résultat à exporter')
      return
    }

    const data = filteredResults.map(user => ({
      ID: user.id,
      Nom: user.name,
      Email: user.email,
      Téléphone: user.phone,
      Rôle: user.role,
      Statut: user.status,
      'Date d\'inscription': user.joinDate,
      'Dernière activité': user.lastActive,
      'Commandes totales': user.totalOrders,
      'Total dépensé': user.totalSpent,
      'Points fidélité': user.loyaltyPoints || 0,
      'Produits partagés': user.productsShared || 0,
      'Produits retournés': user.productsReturned || 0,
      'Signalements déposés': user.reportsFiled || 0,
      'Signalements reçus': user.reportsReceived || 0,
      'Ventes totales': user.totalSales || 0,
      'Services de boostage': user.boostServices || 0,
      'Promotions utilisées': user.promotionsUsed || 0,
      'Produits en boutique': user.shopProducts || 0,
      'Complétion profil': user.profileCompletion || 0,
      'Score d\'engagement': user.engagementScore || 0,
      'Valeur moyenne commande': user.averageOrderValue || 0,
      'Valeur client': user.customerLifetimeValue || 0,
      'Risque de churn': user.churnRisk || 'N/A',
      'Niveau d\'activité': user.activityLevel || 'N/A',
      Localisation: user.location,
      Vérifié: user.isVerified ? 'Oui' : 'Non',
      '2FA activé': user.has2FA ? 'Oui' : 'Non'
    }))

    if (format === 'csv') {
      const csvContent = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `utilisateurs_filtres_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } else if (format === 'excel') {
      // Export Excel (TSV pour simplicité)
      const tsvContent = [
        Object.keys(data[0]).join('\t'),
        ...data.map(row => Object.values(row).join('\t'))
      ].join('\n')
      
      const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `utilisateurs_filtres_${new Date().toISOString().split('T')[0]}.tsv`
      link.click()
    } else if (format === 'pdf') {
      // Export PDF (HTML pour simplicité)
      const htmlContent = `
        <html>
          <head>
            <title>Rapport Utilisateurs Filtres</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h1 { color: #ff6600; }
            </style>
          </head>
          <body>
            <h1>Rapport Utilisateurs Filtres</h1>
            <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
            <p>Nombre d'utilisateurs: ${filteredResults.length}</p>
            <table>
              <thead>
                <tr>${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${data.map(row => `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `
      
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `utilisateurs_filtres_${new Date().toISOString().split('T')[0]}.html`
      link.click()
    }
  }

  // Générer un rapport automatique
  const generateAutoReport = (report: any) => {
    console.log('Génération du rapport automatique:', report)
    
    // Simulation de génération
    setTimeout(() => {
      alert(`Rapport "${report.name}" généré avec succès et envoyé à ${report.recipients.join(', ')}`)
    }, 2000)
  }

  // Sauvegarder un nouveau filtre
  const saveNewFilter = (name: string, description: string) => {
    const newFilter = {
      id: Date.now().toString(),
      name,
      description,
      filters: { ...advancedFilters },
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    setSavedFilters([...savedFilters, newFilter])
    alert(`Filtre "${name}" sauvegardé avec succès !`)
  }

  const handleCreateUser = () => {
    console.log('Création utilisateur:', userForm)
    console.log('Fonctionnalités sélectionnées:', selectedFeatures)
    console.log('Rôles multiples:', Array.from(selectedRoles))
    console.log('Permissions personnalisées:', Array.from(customPermissions))
    
    // Créer le nouvel utilisateur avec toutes les informations
    const newUser: User = {
      id: Date.now().toString(),
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone,
      role: userForm.role,
      type: userForm.type,
      status: 'pending',
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpent: 0,
      totalEarnings: 0,
      rating: 0,
      isVerified: false,
      has2FA: userForm.security.twoFactorEnabled,
      location: userForm.location,
      avatar: userForm.avatar,
      loyaltyPoints: userForm.loyaltyPoints,
      bio: userForm.bio,
      website: userForm.website,
      socialMedia: userForm.socialMedia,
      preferences: userForm.preferences,
      security: userForm.security
    }
    
    // Ajouter l'utilisateur à la liste
    setUsers(prev => [...prev, newUser])
    
    // Réinitialiser le formulaire
    setIsCreateModalOpen(false)
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'buyer' as User['role'],
      type: 'buyer' as User['type'],
      location: '',
      password: '',
      confirmPassword: '',
      avatar: '',
      loyaltyPoints: 0,
      bio: '',
      website: '',
      socialMedia: {
        facebook: '',
        twitter: '',
        linkedin: '',
        instagram: '',
        whatsapp: ''
      },
      preferences: {
        language: 'fr',
        timezone: 'Africa/Abidjan',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      },
      security: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 30
      }
    })
    setSelectedFeatures([])
    setSelectedRoles(new Set(['buyer']))
    setCustomPermissions(new Set())
    
    // Afficher une notification de succès
    console.log('✅ Utilisateur créé avec succès:', newUser.name)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    
    // Initialiser le formulaire avec les données de l'utilisateur
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      type: user.type,
      location: user.location,
      password: '',
      confirmPassword: '',
      avatar: user.avatar || '',
      loyaltyPoints: user.loyaltyPoints || 0,
      bio: user.bio || '',
      website: user.website || '',
      socialMedia: user.socialMedia || {
        facebook: '',
        twitter: '',
        linkedin: '',
        instagram: '',
        whatsapp: ''
      },
      preferences: user.preferences || {
        language: 'fr',
        timezone: 'Africa/Abidjan',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      },
      security: user.security || {
        twoFactorEnabled: user.has2FA,
        loginNotifications: true,
        sessionTimeout: 30
      }
    })
    
    // Initialiser les rôles multiples (par défaut, le rôle principal est sélectionné)
    setSelectedRoles(new Set([user.role]))
    
    // Initialiser les fonctionnalités selon le rôle
    if (roleFeatures[user.role]) {
      const allFeatures: string[] = []
      Object.values(roleFeatures[user.role]).forEach(featureArray => {
        if (Array.isArray(featureArray)) {
          allFeatures.push(...featureArray)
        }
      })
      setSelectedFeatures(allFeatures)
    } else {
      setSelectedFeatures([])
    }
    
    // Initialiser les permissions personnalisées (vide par défaut)
    setCustomPermissions(new Set())
    
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = () => {
    if (!selectedUser) return
    
    console.log('Mise à jour utilisateur:', selectedUser.id, userForm)
    console.log('Rôles multiples:', Array.from(selectedRoles))
    console.log('Fonctionnalités sélectionnées:', selectedFeatures)
    console.log('Permissions personnalisées:', Array.from(customPermissions))
    
    // Mettre à jour l'utilisateur dans la liste
    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id 
        ? {
            ...user,
            name: userForm.name,
            email: userForm.email,
            phone: userForm.phone,
            role: userForm.role,
            type: userForm.type,
            location: userForm.location,
            avatar: userForm.avatar,
            loyaltyPoints: userForm.loyaltyPoints,
            bio: userForm.bio,
            website: userForm.website,
            socialMedia: userForm.socialMedia,
            preferences: userForm.preferences,
            security: userForm.security,
            has2FA: userForm.security.twoFactorEnabled
          }
        : user
    ))
    
    // Fermer le modal
    setIsEditModalOpen(false)
    
    // Afficher une notification de succès
    console.log('✅ Utilisateur mis à jour avec succès:', userForm.name)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(user => user.id !== userId))
    }
  }

  const handleStatusChange = (userId: string, newStatus: User['status']) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  const handleRoleChange = (userId: string, newRole: User['role']) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ))
  }

  // Fonctions pour la sélection multiple
  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
    setSelectAll(newSelected.size === filteredUsers.length)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set())
      setSelectAll(false)
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
      setSelectAll(true)
    }
  }

  const clearSelection = () => {
    setSelectedUsers(new Set())
    setSelectAll(false)
    setShowBulkActions(false)
  }

  // Actions en lot
  const handleBulkAction = (action: string) => {
    const usersToProcess = filteredUsers.filter(user => selectedUsers.has(user.id))
    
    switch (action) {
      case 'activate':
        usersToProcess.forEach(user => handleStatusChange(user.id, 'active'))
        break
      case 'deactivate':
        usersToProcess.forEach(user => handleStatusChange(user.id, 'inactive'))
        break
      case 'suspend':
        usersToProcess.forEach(user => handleStatusChange(user.id, 'suspended'))
        break
      case 'verify':
        usersToProcess.forEach(user => handleStatusChange(user.id, 'verified'))
        break
      case 'delete':
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${usersToProcess.length} utilisateur(s) ?`)) {
          usersToProcess.forEach(user => handleDeleteUser(user.id))
        }
        break
    }
    
    clearSelection()
  }

  // Fonctions d'export multi-format
  const exportToCSV = (usersToExport: User[]) => {
    try {
      const exportData = usersToExport.map(user => ({
        ID: user.id,
        Nom: user.name,
        Email: user.email,
        Téléphone: user.phone,
        Rôle: user.role === 'buyer' ? 'Acheteur' : 
              user.role === 'vendor' ? 'Vendeur' : 
              user.role === 'admin' ? 'Administrateur' : 'Super Admin',
        Statut: user.status === 'active' ? 'Actif' : 
                user.status === 'inactive' ? 'Inactif' :
                user.status === 'pending' ? 'En attente' :
                user.status === 'suspended' ? 'Suspendu' :
                user.status === 'verified' ? 'Vérifié' : 'Inconnu',
        Type: user.type === 'buyer' ? 'Acheteur' : 
              user.type === 'vendor' ? 'Vendeur' : 'Administrateur',
        'Date inscription': user.joinDate,
        'Dernière activité': user.lastActive,
        'Total commandes': user.totalOrders,
        'Total dépensé': `${user.totalSpent} F CFA`,
        'Total gains': `${user.totalEarnings} F CFA`,
        Note: `${user.rating}/5`,
        Vérifié: user.isVerified ? 'Oui' : 'Non',
        '2FA activé': user.has2FA ? 'Oui' : 'Non',
        Localisation: user.location
      }))
      
      const headers = Object.keys(exportData[0]).join(',')
      const rows = exportData.map(row => 
        Object.values(row).map(value => {
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
      
      const csvContent = [headers, ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const fileName = selectedUsers.size > 0 
        ? `utilisateurs_selectionnes_export_${new Date().toISOString().split('T')[0]}.csv`
        : `utilisateurs_export_${new Date().toISOString().split('T')[0]}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`Export CSV réussi : ${usersToExport.length} utilisateur(s) exporté(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
    }
  }

  const exportToExcel = (usersToExport: User[]) => {
    try {
      const exportData = usersToExport.map(user => ({
        ID: user.id,
        Nom: user.name,
        Email: user.email,
        Téléphone: user.phone,
        Rôle: user.role === 'buyer' ? 'Acheteur' : 
              user.role === 'vendor' ? 'Vendeur' : 
              user.role === 'admin' ? 'Administrateur' : 'Super Admin',
        Statut: user.status === 'active' ? 'Actif' : 
                user.status === 'inactive' ? 'Inactif' :
                user.status === 'pending' ? 'En attente' :
                user.status === 'suspended' ? 'Suspendu' :
                user.status === 'verified' ? 'Vérifié' : 'Inconnu',
        Type: user.type === 'buyer' ? 'Acheteur' : 
              user.type === 'vendor' ? 'Vendeur' : 'Administrateur',
        'Date inscription': user.joinDate,
        'Dernière activité': user.lastActive,
        'Total commandes': user.totalOrders,
        'Total dépensé': user.totalSpent,
        'Total gains': user.totalEarnings,
        Note: user.rating,
        Vérifié: user.isVerified ? 'Oui' : 'Non',
        '2FA activé': user.has2FA ? 'Oui' : 'Non',
        Localisation: user.location
      }))
      
      const headers = Object.keys(exportData[0]).join('\t')
      const rows = exportData.map(row => 
        Object.values(row).map(value => {
          const stringValue = String(value || '')
          if (stringValue.includes('\t') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join('\t')
      )
      
      const tsvContent = [headers, ...rows].join('\n')
      const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const fileName = selectedUsers.size > 0 
        ? `utilisateurs_selectionnes_export_${new Date().toISOString().split('T')[0]}.xls`
        : `utilisateurs_export_${new Date().toISOString().split('T')[0]}.xls`
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`Export Excel réussi : ${usersToExport.length} utilisateur(s) exporté(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
    }
  }

  const exportToPDF = (usersToExport: User[]) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Export Utilisateurs</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #ff6600; text-align: center; border-bottom: 2px solid #ff6600; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .header-info { text-align: center; margin-bottom: 20px; color: #666; }
            .user-row:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Liste des Utilisateurs</h1>
          <div class="header-info">
            <p>Date d'export : ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>Nombre d'utilisateurs : ${usersToExport.length}</p>
            ${selectedUsers.size > 0 ? `<p>Utilisateurs sélectionnés : ${selectedUsers.size}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Type</th>
                <th>Date inscription</th>
                <th>Note</th>
                <th>Vérifié</th>
              </tr>
            </thead>
            <tbody>
              ${usersToExport.map(user => `
                <tr class="user-row">
                  <td>${user.name}</td>
                  <td>${user.email}</td>
                  <td>${user.role === 'buyer' ? 'Acheteur' : 
                         user.role === 'vendor' ? 'Vendeur' : 
                         user.role === 'admin' ? 'Administrateur' : 'Super Admin'}</td>
                  <td>${user.status === 'active' ? 'Actif' : 
                         user.status === 'inactive' ? 'Inactif' :
                         user.status === 'pending' ? 'En attente' :
                         user.status === 'suspended' ? 'Suspendu' :
                         user.status === 'verified' ? 'Vérifié' : 'Inconnu'}</td>
                  <td>${user.type === 'buyer' ? 'Acheteur' : 
                         user.type === 'vendor' ? 'Vendeur' : 'Administrateur'}</td>
                  <td>${user.joinDate}</td>
                  <td>${user.rating}/5</td>
                  <td>${user.isVerified ? 'Oui' : 'Non'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `
      
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const fileName = selectedUsers.size > 0 
        ? `utilisateurs_selectionnes_export_${new Date().toISOString().split('T')[0]}.html`
        : `utilisateurs_export_${new Date().toISOString().split('T')[0]}.html`
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`Export PDF/HTML réussi : ${usersToExport.length} utilisateur(s) exporté(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
    }
  }

  const exportUsersMultiFormat = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const usersToExport = selectedUsers.size > 0 
        ? filteredUsers.filter(user => selectedUsers.has(user.id))
        : filteredUsers
      
      if (usersToExport.length === 0) {
        console.log('Aucun utilisateur à exporter')
        return
      }
      
      switch (format) {
        case 'csv': exportToCSV(usersToExport); break
        case 'excel': exportToExcel(usersToExport); break
        case 'pdf': exportToPDF(usersToExport); break
        default: exportToCSV(usersToExport)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  // Fonctions pour le menu contextuel des 3 points
  const handleMenuToggle = (userId: string) => {
    setOpenMenuId(openMenuId === userId ? null : userId)
  }

  const handleMenuAction = (userId: string, action: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    switch (action) {
      case 'duplicate':
        // Dupliquer l'utilisateur (créer une copie)
        const newUser: User = {
          ...user,
          id: Date.now().toString(),
          name: `${user.name} (Copie)`,
          email: `copie.${user.email}`,
          status: 'pending' as User['status'],
          joinDate: new Date().toISOString().split('T')[0],
          lastActive: new Date().toLocaleString('fr-FR'),
          totalOrders: 0,
          totalSpent: 0,
          totalEarnings: 0,
          rating: 0,
          isVerified: false,
          has2FA: false
        }
        setUsers([...users, newUser])
        console.log('Utilisateur dupliqué:', newUser.name)
        break
        
      case 'activate':
        handleStatusChange(userId, 'active')
        break
        
      case 'deactivate':
        handleStatusChange(userId, 'inactive')
        break
        
      case 'suspend':
        handleStatusChange(userId, 'suspended')
        break
        
      case 'verify':
        handleStatusChange(userId, 'verified')
        break
        
      case 'reset-password':
        // Simuler la réinitialisation du mot de passe
        console.log(`Réinitialisation du mot de passe pour ${user.name}`)
        break
        
      case 'send-email':
        // Ouvrir le client email
        const subject = encodeURIComponent('Message de la plateforme')
        const body = encodeURIComponent(`Bonjour ${user.name},\n\nCeci est un message de la plateforme.`)
        window.open(`mailto:${user.email}?subject=${subject}&body=${body}`)
        break
        
      case 'block':
        handleStatusChange(userId, 'suspended')
        break
        
      case 'unblock':
        handleStatusChange(userId, 'active')
        break
        
      case 'delete':
        handleDeleteUser(userId)
        break
    }
    
    setOpenMenuId(null) // Fermer le menu après l'action
  }

  // Fonctions pour la gestion des fonctionnalités
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const handleFormRoleChange = (newRole: User['role']) => {
    setUserForm(prev => ({ ...prev, role: newRole }))
    // Réinitialiser les fonctionnalités sélectionnées
    setSelectedFeatures([])
  }

  // Fonction pour gérer les rôles multiples
  const handleRoleToggle = (role: User['role']) => {
    const newRoles = new Set(selectedRoles)
    if (newRoles.has(role)) {
      newRoles.delete(role)
    } else {
      newRoles.add(role)
    }
    setSelectedRoles(newRoles)
    
    // Mettre à jour le rôle principal si nécessaire
    if (newRoles.size > 0) {
      setUserForm(prev => ({ ...prev, role: Array.from(newRoles)[0] }))
    }
    
    // Appliquer automatiquement les permissions selon les rôles
    applyRolePermissions(newRoles)
  }

  // Fonction pour appliquer automatiquement les permissions selon les rôles
  const applyRolePermissions = (roles: Set<User['role']>) => {
    const allPermissions = new Set<string>()
    
    roles.forEach(role => {
      if (roleFeatures[role]) {
        Object.values(roleFeatures[role]).forEach(featureArray => {
          if (Array.isArray(featureArray)) {
            featureArray.forEach(feature => allPermissions.add(feature))
          }
        })
      }
    })
    
    setSelectedFeatures(Array.from(allPermissions))
  }

  // Fonction pour gérer les permissions personnalisées
  const handleCustomPermissionToggle = (permission: string) => {
    const newPermissions = new Set(customPermissions)
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission)
    } else {
      newPermissions.add(permission)
    }
    setCustomPermissions(newPermissions)
  }

  // Fonction pour gérer l'upload d'avatar
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUserForm(prev => ({ ...prev, avatar: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Fonction pour générer un avatar par défaut
  const generateDefaultAvatar = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
    const colors = ['#ff6600', '#535455', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${color}"/>
        <text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">${initials}</text>
      </svg>
    `)}`
  }

  // Fonctions pour la gestion des rôles
  const handleCreateRole = () => {
    if (!roleForm.name.trim()) return
    
    const newRole = {
      id: Date.now().toString(),
      name: roleForm.name,
      description: roleForm.description,
      permissions: roleForm.permissions,
      userCount: 0,
      isActive: roleForm.isActive,
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    setCustomRoles([...customRoles, newRole])
    setRoleForm({ name: '', description: '', permissions: [], isActive: true })
    setIsRoleModalOpen(false)
    console.log('Nouveau rôle créé:', newRole)
  }

  const handleEditRole = (role: any) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive
    })
    setIsRoleModalOpen(true)
  }

  const handleUpdateRole = () => {
    if (!editingRole || !roleForm.name.trim()) return
    
    const updatedRoles = customRoles.map(role => 
      role.id === editingRole.id 
        ? { ...role, ...roleForm }
        : role
    )
    
    setCustomRoles(updatedRoles)
    setEditingRole(null)
    setRoleForm({ name: '', description: '', permissions: [], isActive: true })
    setIsRoleModalOpen(false)
    console.log('Rôle mis à jour:', editingRole.id)
  }

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      setCustomRoles(customRoles.filter(role => role.id !== roleId))
      console.log('Rôle supprimé:', roleId)
    }
  }

  const handleTransferRole = (oldRoleId: string, newRoleId: string) => {
    // Logique pour transférer les utilisateurs d'un rôle à un autre
    console.log(`Transfert des utilisateurs du rôle ${oldRoleId} vers ${newRoleId}`)
  }

  const togglePermission = (permission: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  // Fonctions pour le tri et les analytics
  const handleSort = (key: keyof User) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortedUsers = () => {
    if (!sortConfig.key) return filteredUsers
    
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]
      
      // Gérer les valeurs undefined
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1
      if (bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const getAnalyticsData = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'active').length
    const pendingUsers = users.filter(u => u.status === 'pending').length
    const suspendedUsers = users.filter(u => u.status === 'suspended').length
    
    const roleDistribution = {
      buyers: users.filter(u => u.role === 'buyer').length,
      vendors: users.filter(u => u.role === 'vendor').length,
      admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length
    }
    
    const verifiedUsers = users.filter(u => u.isVerified).length
    const twoFactorUsers = users.filter(u => u.has2FA).length
    
    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      roleDistribution,
      verifiedUsers,
      twoFactorUsers
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la gestion des utilisateurs */}
      <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#535455]/10 border border-[#ff6600]/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion Complète des Utilisateurs</h2>
            <p className="text-gray-600 mt-2">
              Création, modification, suppression et gestion des rôles et permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Créer Utilisateur
            </Button>
            <div className="relative export-menu-container">
              <Button 
                variant="outline" 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportUsersMultiFormat('csv')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 text-[#ff6600]" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        exportUsersMultiFormat('excel')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 text-[#ff6600]" />
                      Export Excel
                    </button>
                    <button
                      onClick={() => {
                        exportUsersMultiFormat('pdf')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 text-[#ff6600]" />
                      Export PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Système de filtrage avancé */}
      <Card className="border-[#ff6600]/20">
        <CardContent className="p-6">
          {/* En-tête des filtres */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#ff6600]">Filtrage Avancé des Utilisateurs</h3>
              <p className="text-sm text-gray-600">
                {activeFilterName ? `Filtre actif: ${activeFilterName}` : 'Aucun filtre actif'} • 
                {filteredCount > 0 ? ` ${filteredCount} résultat(s)` : ' Aucun résultat'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavedFilters(!showSavedFilters)}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres Sauvegardés
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Filtres Avancés
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="border-gray-400 text-gray-600 hover:bg-gray-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Filtres rapides et recherche */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="verified">Vérifié</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="buyer">Acheteur</SelectItem>
                  <SelectItem value="vendor">Vendeur</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={applyAdvancedFilters}
                size="sm"
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white px-3"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filtres prédéfinis - Menu déroulant compact */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600">Filtres rapides:</Label>
              <Select onValueChange={(value) => {
                const filter = savedFilters.find(f => f.id === value)
                if (filter) applySavedFilter(filter)
              }}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Choisir un filtre prédéfini" />
                </SelectTrigger>
                <SelectContent>
                  {savedFilters.map((filter) => (
                    <SelectItem key={filter.id} value={filter.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{filter.name}</span>
                        <span className="text-xs text-gray-500">{filter.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeFilterName && (
                <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30 text-xs">
                  {activeFilterName}
                </Badge>
              )}
            </div>
          </div>

          {/* Filtres avancés (dépliables) */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Filtres Avancés</h4>
              
              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label className="text-xs text-gray-600 mb-1">Points fidélité</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={advancedFilters.loyaltyPointsRange.min}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        loyaltyPointsRange: { ...advancedFilters.loyaltyPointsRange, min: Number(e.target.value) }
                      })}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={advancedFilters.loyaltyPointsRange.max}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        loyaltyPointsRange: { ...advancedFilters.loyaltyPointsRange, max: Number(e.target.value) }
                      })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Produits partagés</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={advancedFilters.productsSharedRange.min}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        productsSharedRange: { ...advancedFilters.productsSharedRange, min: Number(e.target.value) }
                      })}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={advancedFilters.productsSharedRange.max}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        productsSharedRange: { ...advancedFilters.productsSharedRange, max: Number(e.target.value) }
                      })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Commandes</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={advancedFilters.ordersRange.min}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        ordersRange: { ...advancedFilters.ordersRange, min: Number(e.target.value) }
                      })}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={advancedFilters.ordersRange.max}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        ordersRange: { ...advancedFilters.ordersRange, max: Number(e.target.value) }
                      })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Produits retournés</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={advancedFilters.productsReturnedRange.min}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        productsReturnedRange: { ...advancedFilters.productsReturnedRange, min: Number(e.target.value) }
                      })}
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={advancedFilters.productsReturnedRange.max}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        productsReturnedRange: { ...advancedFilters.productsReturnedRange, max: Number(e.target.value) }
                      })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Filtres par comportement */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label className="text-xs text-gray-600 mb-1">Risque de churn</Label>
                  <Select
                    value={advancedFilters.churnRisk.join(',')}
                    onValueChange={(value) => setAdvancedFilters({
                      ...advancedFilters,
                      churnRisk: value ? value.split(',') : []
                    })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="high">Élevé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Niveau d'activité</Label>
                  <Select
                    value={advancedFilters.activityLevel.join(',')}
                    onValueChange={(value) => setAdvancedFilters({
                      ...advancedFilters,
                      activityLevel: value ? value.split(',') : []
                    })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_active">Très actif</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="moderate">Modéré</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Documents vérifiés</Label>
                  <Select
                    value={advancedFilters.hasVerifiedDocuments === null ? '' : advancedFilters.hasVerifiedDocuments.toString()}
                    onValueChange={(value) => setAdvancedFilters({
                      ...advancedFilters,
                      hasVerifiedDocuments: value === '' ? null : value === 'true'
                    })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Avec documents</SelectItem>
                      <SelectItem value="false">Sans documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtres par dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-600 mb-1">Date d'inscription</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={advancedFilters.joinDateRange.start}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        joinDateRange: { ...advancedFilters.joinDateRange, start: e.target.value }
                      })}
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={advancedFilters.joinDateRange.end}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        joinDateRange: { ...advancedFilters.joinDateRange, end: e.target.value }
                      })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Dernière activité</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={advancedFilters.lastActiveRange.start}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        lastActiveRange: { ...advancedFilters.lastActiveRange, start: e.target.value }
                      })}
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={advancedFilters.lastActiveRange.end}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        lastActiveRange: { ...advancedFilters.lastActiveRange, end: e.target.value }
                      })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600 mb-1">Dernier achat</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={advancedFilters.lastPurchaseRange.start}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        lastPurchaseRange: { ...advancedFilters.lastPurchaseRange, start: e.target.value }
                      })}
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={advancedFilters.lastPurchaseRange.end}
                      onChange={(e) => setAdvancedFilters({
                        ...advancedFilters,
                        lastPurchaseRange: { ...advancedFilters.lastPurchaseRange, end: e.target.value }
                      })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtres sauvegardés (dépliables) */}
          {showSavedFilters && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">Filtres Sauvegardés</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = prompt('Nom du filtre:')
                    const description = prompt('Description du filtre:')
                    if (name && description) {
                      saveNewFilter(name, description)
                    }
                  }}
                  className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedFilters.map((filter) => (
                  <Card key={filter.id} className="border-gray-200 hover:border-[#ff6600]/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm text-gray-900 mb-1">{filter.name}</h5>
                          <p className="text-xs text-gray-600 mb-2">{filter.description}</p>
                          <p className="text-xs text-gray-500">Créé le {filter.createdAt}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applySavedFilter(filter)}
                          className="text-[#ff6600] hover:text-[#ff6600]/80 hover:bg-[#ff6600]/10"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barre d'actions post-filtrage */}
      {filteredResults.length > 0 && (
        <Card className="border-[#535455]/30 bg-[#535455]/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {filteredResults.length} utilisateur(s) trouvé(s) avec les filtres actuels
                </span>
                {activeFilterName && (
                  <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">
                    {activeFilterName}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Sélection multiple des résultats filtrés */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedFilteredUsers.size === filteredResults.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFilteredUsers(new Set(filteredResults.map(u => u.id)))
                      } else {
                        setSelectedFilteredUsers(new Set())
                      }
                    }}
                    className="rounded border-gray-300 text-[#ff6600] focus:ring-[#ff6600]"
                  />
                  <span className="text-xs text-gray-600">
                    {selectedFilteredUsers.size > 0 ? `${selectedFilteredUsers.size} sélectionné(s)` : 'Sélectionner tout'}
                  </span>
                </div>

                {/* Bouton Export */}
                <div className="relative export-menu-container">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            exportFilteredResults('csv')
                            setShowExportMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export CSV
                        </button>
                        <button
                          onClick={() => {
                            exportFilteredResults('excel')
                            setShowExportMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export Excel
                        </button>
                        <button
                          onClick={() => {
                            exportFilteredResults('pdf')
                            setShowExportMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bouton Messages en masse */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMessageModal(true)}
                  disabled={selectedFilteredUsers.size === 0}
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white disabled:opacity-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Messages ({selectedFilteredUsers.size})
                </Button>

                {/* Bouton Chat */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChatModal(true)}
                  disabled={selectedFilteredUsers.size === 0}
                  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white disabled:opacity-50"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat ({selectedFilteredUsers.size})
                </Button>

                {/* Bouton Rapports */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportModal(true)}
                  className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Rapports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre d'actions en lot */}
      {selectedUsers.size > 0 && (
        <Card className="border-[#ff6600]/30 bg-[#ff6600]/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedUsers.size} utilisateur(s) sélectionné(s)
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSelection}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Désélectionner tout
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('activate')}
                  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Activer
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('deactivate')}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Désactiver
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('suspend')}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Suspendre
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('verify')}
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Vérifier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('delete')}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Première rangée - Onglets principaux */}
        <TabsList className="grid w-full grid-cols-6 bg-[#535455]/10 border border-[#535455]/20 mb-2">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Tous ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger 
            value="buyers" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Acheteurs
          </TabsTrigger>
          <TabsTrigger 
            value="vendors" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Vendeurs
          </TabsTrigger>
          <TabsTrigger 
            value="admins" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Administrateurs
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            En Attente
          </TabsTrigger>
          <TabsTrigger 
            value="suspended" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Suspendus
          </TabsTrigger>
        </TabsList>

        {/* Deuxième rangée - Onglets de gestion */}
        <TabsList className="grid w-full grid-cols-5 bg-[#535455]/10 border border-[#535455]/20">
           <TabsTrigger 
             value="approval-settings" 
             className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
           >
             ⚙️ Configuration
           </TabsTrigger>
           <TabsTrigger 
             value="role-management" 
             className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
           >
             👑 Rôles
           </TabsTrigger>
           <TabsTrigger 
             value="analytics" 
             className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
           >
             📊 Analytics
           </TabsTrigger>
           <TabsTrigger 
             value="assistance" 
             className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
           >
             🆘 Assistance
           </TabsTrigger>
           <TabsTrigger 
             value="permissions" 
             className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
           >
             🔐 Permissions
           </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <UserList 
            users={getSortedUsers()}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            openMenuId={openMenuId}
            onMenuToggle={handleMenuToggle}
            onMenuAction={handleMenuAction}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </TabsContent>

        <TabsContent value="buyers" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.role === 'buyer')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            openMenuId={openMenuId}
            onMenuToggle={handleMenuToggle}
            onMenuAction={handleMenuAction}
          />
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.role === 'vendor')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            openMenuId={openMenuId}
            onMenuToggle={handleMenuToggle}
            onMenuAction={handleMenuAction}
          />
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.role === 'admin' || u.role === 'super_admin')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            openMenuId={openMenuId}
            onMenuToggle={handleMenuToggle}
            onMenuAction={handleMenuAction}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.status === 'pending')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            openMenuId={openMenuId}
            onMenuToggle={handleMenuToggle}
            onMenuAction={handleMenuAction}
          />
        </TabsContent>

        <TabsContent value="suspended" className="mt-6">
          <UserList 
            users={filteredUsers.filter(u => u.status === 'suspended')}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onStatusChange={handleStatusChange}
            onRoleChange={handleRoleChange}
            onView={(user) => {
              setSelectedUser(user)
              setIsViewModalOpen(true)
            }}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            openMenuId={openMenuId}
            onMenuToggle={handleMenuToggle}
            onMenuAction={handleMenuAction}
          />
                 </TabsContent>

         <TabsContent value="approval-settings" className="mt-6">
           <Card>
             <CardHeader>
               <CardTitle className="text-[#ff6600] flex items-center gap-2">
                 <Shield className="h-5 w-5" />
                 Configuration des Approbations et Validations
               </CardTitle>
               <CardDescription>
                 Gérez les paramètres d'approbation automatique et manuelle pour les nouveaux utilisateurs
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               {/* Configuration des vendeurs */}
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                 <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                   <Store className="h-5 w-5" />
                   Configuration des Vendeurs
                 </h3>
                 
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Shield className="h-4 w-4 text-[#ff6600]" />
                         <span className="text-sm font-medium">Approbation automatique</span>
                       </div>
                       <Switch
                         checked={approvalSettings.vendorAutoApproval}
                         onCheckedChange={(checked) => setApprovalSettings(prev => ({
                           ...prev,
                           vendorAutoApproval: checked
                         }))}
                       />
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Shield className="h-4 w-4 text-[#ff6600]" />
                         <span className="text-sm font-medium">Vérification des documents</span>
                       </div>
                       <Switch
                         checked={approvalSettings.requireDocumentVerification}
                         onCheckedChange={(checked) => setApprovalSettings(prev => ({
                           ...prev,
                           requireDocumentVerification: checked
                         }))}
                       />
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Shield className="h-4 w-4 text-[#ff6600]" />
                         <span className="text-sm font-medium">Vérification du téléphone</span>
                       </div>
                       <Switch
                         checked={approvalSettings.requirePhoneVerification}
                         onCheckedChange={(checked) => setApprovalSettings(prev => ({
                           ...prev,
                           requirePhoneVerification: checked
                         }))}
                       />
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     <div>
                       <Label className="text-sm font-medium">Délai d'approbation (heures)</Label>
                       <Input
                         type="number"
                         value={approvalSettings.approvalDelay}
                         onChange={(e) => setApprovalSettings(prev => ({
                           ...prev,
                           approvalDelay: parseInt(e.target.value) || 24
                         }))}
                         className="mt-1"
                         min="1"
                         max="168"
                       />
                       <p className="text-xs text-gray-500 mt-1">
                         Délai maximum avant approbation automatique
                       </p>
                     </div>
                     
                     <div>
                       <Label className="text-sm font-medium">Vendeurs en attente max</Label>
                       <Input
                         type="number"
                         value={approvalSettings.maxPendingVendors}
                         onChange={(e) => setApprovalSettings(prev => ({
                           ...prev,
                           maxPendingVendors: parseInt(e.target.value) || 50
                         }))}
                         className="mt-1"
                         min="10"
                         max="200"
                       />
                       <p className="text-xs text-gray-500 mt-1">
                         Nombre maximum de vendeurs en attente
                       </p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Configuration des administrateurs */}
               <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                 <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                   <Users className="h-5 w-5" />
                   Configuration des Administrateurs
                 </h3>
                 
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Shield className="h-4 w-4 text-[#ff6600]" />
                         <span className="text-sm font-medium">Approbation automatique</span>
                       </div>
                       <Switch
                         checked={approvalSettings.adminAutoApproval}
                         onCheckedChange={(checked) => setApprovalSettings(prev => ({
                           ...prev,
                           adminAutoApproval: checked
                         }))}
                       />
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Shield className="h-4 w-4 text-[#ff6600]" />
                         <span className="text-sm font-medium">Vérification de l'email</span>
                       </div>
                       <Switch
                         checked={approvalSettings.requireEmailVerification}
                         onCheckedChange={(checked) => setApprovalSettings(prev => ({
                           ...prev,
                           requireEmailVerification: checked
                         }))}
                       />
                     </div>
                   </div>
                   
                   <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                     <h4 className="font-medium text-purple-800 mb-2">Statistiques actuelles</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span>Vendeurs en attente:</span>
                         <span className="font-semibold text-purple-700">
                           {filteredUsers.filter(u => u.role === 'vendor' && u.status === 'pending').length}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span>Admins en attente:</span>
                         <span className="font-semibold text-purple-700">
                           {filteredUsers.filter(u => (u.role === 'admin' || u.role === 'super_admin') && u.status === 'pending').length}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Actions de configuration */}
               <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                 <Button 
                   variant="outline" 
                   onClick={() => {
                     setApprovalSettings({
                       vendorAutoApproval: false,
                       adminAutoApproval: false,
                       requireDocumentVerification: true,
                       requirePhoneVerification: true,
                       requireEmailVerification: true,
                       approvalDelay: 24,
                       maxPendingVendors: 50
                     })
                   }}
                   className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                 >
                   Réinitialiser
                 </Button>
                 <Button 
                   onClick={() => {
                     console.log('Configuration sauvegardée:', approvalSettings)
                     // Ici on pourrait sauvegarder en base de données
                   }}
                   className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                 >
                   <Shield className="h-4 w-4 mr-2" />
                   Sauvegarder la configuration
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="role-management" className="mt-6">
           <Card>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="text-[#ff6600] flex items-center gap-2">
                     <Shield className="h-5 w-5" />
                     Gestion Avancée des Rôles et Permissions
                   </CardTitle>
                   <CardDescription>
                     Créez, modifiez et gérez les rôles personnalisés avec des permissions granulaires
                   </CardDescription>
                 </div>
                 <Button 
                   onClick={() => {
                     setEditingRole(null)
                     setRoleForm({ name: '', description: '', permissions: [], isActive: true })
                     setIsRoleModalOpen(true)
                   }}
                   className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Créer un rôle
                 </Button>
               </div>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {customRoles.map((role) => (
                   <Card key={role.id} className="hover:shadow-md transition-shadow duration-200">
                     <CardHeader className="pb-3">
                       <div className="flex items-center justify-between">
                         <CardTitle className="text-lg">{role.name}</CardTitle>
                         <div className="flex items-center gap-2">
                           <Switch
                             checked={role.isActive}
                             onCheckedChange={(checked) => {
                               setCustomRoles(prev => prev.map(r => 
                                 r.id === role.id ? { ...r, isActive: checked } : r
                               ))
                             }}
                           />
                           <Badge variant={role.isActive ? "default" : "secondary"}>
                             {role.isActive ? 'Actif' : 'Inactif'}
                           </Badge>
                         </div>
                       </div>
                       <CardDescription>{role.description}</CardDescription>
                     </CardHeader>
                     <CardContent className="pt-0">
                       <div className="space-y-3">
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600">Utilisateurs:</span>
                           <span className="font-semibold">{role.userCount}</span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600">Permissions:</span>
                           <span className="font-semibold">{role.permissions.length}</span>
                         </div>
                         <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-600">Créé le:</span>
                           <span className="font-semibold">{role.createdAt}</span>
                         </div>
                         
                         <div className="pt-2 border-t border-gray-200">
                           <div className="flex items-center gap-2">
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => handleEditRole(role)}
                               className="flex-1 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                             >
                               <Edit className="h-3 w-3 mr-1" />
                               Modifier
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => handleDeleteRole(role.id)}
                               className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                             >
                               <Trash2 className="h-3 w-3 mr-1" />
                               Supprimer
                             </Button>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="analytics" className="mt-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Statistiques générales */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <Activity className="h-5 w-5" />
                   Statistiques Générales
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {(() => {
                   const analytics = getAnalyticsData()
                   return (
                     <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div className="text-center p-3 bg-blue-50 rounded-lg">
                           <div className="text-2xl font-bold text-blue-600">{analytics.totalUsers}</div>
                           <div className="text-sm text-blue-600">Total utilisateurs</div>
                         </div>
                         <div className="text-center p-3 bg-green-50 rounded-lg">
                           <div className="text-2xl font-bold text-green-600">{analytics.activeUsers}</div>
                           <div className="text-sm text-green-600">Utilisateurs actifs</div>
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="text-center p-3 bg-yellow-50 rounded-lg">
                           <div className="text-2xl font-bold text-yellow-600">{analytics.pendingUsers}</div>
                           <div className="text-sm text-yellow-600">En attente</div>
                         </div>
                         <div className="text-center p-3 bg-red-50 rounded-lg">
                           <div className="text-2xl font-bold text-red-600">{analytics.suspendedUsers}</div>
                           <div className="text-sm text-red-600">Suspendus</div>
                         </div>
                       </div>
                     </div>
                   )
                 })()}
               </CardContent>
             </Card>

             {/* Distribution des rôles */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <Users className="h-5 w-5" />
                   Distribution des Rôles
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {(() => {
                   const analytics = getAnalyticsData()
                   return (
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <span className="text-sm">Acheteurs</span>
                         <div className="flex items-center gap-2">
                           <div className="w-24 bg-gray-200 rounded-full h-2">
                             <div 
                               className="bg-[#ff6600] h-2 rounded-full" 
                               style={{ width: `${(analytics.roleDistribution.buyers / analytics.totalUsers) * 100}%` }}
                             ></div>
                           </div>
                           <span className="text-sm font-medium">{analytics.roleDistribution.buyers}</span>
                         </div>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm">Vendeurs</span>
                         <div className="flex items-center gap-2">
                           <div className="w-24 bg-gray-200 rounded-full h-2">
                             <div 
                               className="bg-[#535455] h-2 rounded-full" 
                               style={{ width: `${(analytics.roleDistribution.vendors / analytics.totalUsers) * 100}%` }}
                             ></div>
                           </div>
                           <span className="text-sm font-medium">{analytics.roleDistribution.vendors}</span>
                         </div>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-sm">Administrateurs</span>
                         <div className="flex items-center gap-2">
                           <div className="w-24 bg-gray-200 rounded-full h-2">
                             <div 
                               className="bg-purple-500 h-2 rounded-full" 
                               style={{ width: `${(analytics.roleDistribution.admins / analytics.totalUsers) * 100}%` }}
                             ></div>
                           </div>
                           <span className="text-sm font-medium">{analytics.roleDistribution.admins}</span>
                         </div>
                       </div>
                     </div>
                   )
                 })()}
               </CardContent>
             </Card>

             {/* Historique des interactions */}
             <Card className="lg:col-span-2">
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <Clock className="h-5 w-5" />
                   Historique des Interactions
                 </CardTitle>
                 <CardDescription>
                   Suivi des actions et connexions des utilisateurs
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {userHistory.map((entry) => (
                     <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center gap-4">
                         <div className="w-8 h-8 bg-[#ff6600]/20 rounded-full flex items-center justify-center">
                           <Activity className="h-4 w-4 text-[#ff6600]" />
                         </div>
                         <div>
                           <div className="font-medium text-sm">
                             {entry.action === 'login' ? 'Connexion' : 
                              entry.action === 'profile_update' ? 'Mise à jour profil' :
                              entry.action === 'password_reset' ? 'Réinitialisation mot de passe' : entry.action}
                           </div>
                           <div className="text-xs text-gray-500">
                             Utilisateur ID: {entry.userId} • {entry.ipAddress}
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm font-medium">{entry.timestamp}</div>
                         <div className="text-xs text-gray-500">{entry.userAgent}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>

         {/* Onglet Assistance */}
         <TabsContent value="assistance" className="mt-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Récupération de mot de passe */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <Key className="h-5 w-5" />
                   Récupération de Mot de Passe
                 </CardTitle>
                 <CardDescription>
                   Gestion des demandes de réinitialisation et assistance utilisateur
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                   <div className="flex items-center gap-2 mb-2">
                     <Clock className="h-4 w-4 text-yellow-600" />
                     <span className="font-medium text-yellow-800">Demandes en attente: 3</span>
                   </div>
                   <p className="text-sm text-yellow-700">3 utilisateurs ont demandé une réinitialisation de mot de passe</p>
                 </div>
                 
                 <div className="space-y-3">
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                     <div>
                       <div className="font-medium text-sm">jean.dupont@email.com</div>
                       <div className="text-xs text-gray-500">Demandé il y a 2h</div>
                     </div>
                     <Button size="sm" className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                       <Mail className="h-4 w-4 mr-2" />
                       Envoyer lien
                     </Button>
                   </div>
                   
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                     <div>
                       <div className="font-medium text-sm">contact@techstore.ci</div>
                       <div className="text-xs text-gray-500">Demandé il y a 4h</div>
                     </div>
                     <Button size="sm" className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                       <Mail className="h-4 w-4 mr-2" />
                       Envoyer lien
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Gestion des comptes */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <UserX className="h-5 w-5" />
                   Gestion des Comptes
                 </CardTitle>
                 <CardDescription>
                   Suppression, suspension et réactivation des comptes utilisateur
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                   <div className="flex items-center gap-2 mb-2">
                     <AlertTriangle className="h-4 w-4 text-red-600" />
                     <span className="font-medium text-red-800">Comptes signalés: 2</span>
                   </div>
                   <p className="text-sm text-red-700">2 comptes ont été signalés pour violation des conditions</p>
                 </div>
                 
                 <div className="space-y-3">
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                     <div>
                       <div className="font-medium text-sm">spam@example.com</div>
                       <div className="text-xs text-gray-500">Signalé pour spam</div>
                     </div>
                     <Button size="sm" variant="destructive">
                       <Trash2 className="h-4 w-4 mr-2" />
                       Supprimer
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Intégration Supabase */}
             <Card className="lg:col-span-2">
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <Database className="h-5 w-5" />
                   Intégration Supabase
                 </CardTitle>
                 <CardDescription>
                   Gestion complète des comptes via l'API Supabase
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                     <div className="text-2xl font-bold text-blue-600">1,247</div>
                     <div className="text-sm text-blue-600">Comptes actifs</div>
                   </div>
                   <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                     <div className="text-2xl font-bold text-green-600">98.5%</div>
                     <div className="text-sm text-green-600">Uptime API</div>
                   </div>
                   <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                     <div className="text-2xl font-bold text-purple-600">2.3s</div>
                     <div className="text-sm text-purple-600">Temps de réponse</div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-3">
                     <h4 className="font-medium text-gray-900">Actions rapides</h4>
                     <div className="space-y-2">
                       <Button variant="outline" className="w-full justify-start border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white">
                         <RefreshCw className="h-4 w-4 mr-2" />
                         Synchroniser avec Supabase
                       </Button>
                       <Button variant="outline" className="w-full justify-start border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white">
                         <Download className="h-4 w-4 mr-2" />
                         Exporter la base de données
                       </Button>
                       <Button variant="outline" className="w-full justify-start border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white">
                         <Settings className="h-4 w-4 mr-2" />
                         Configurer l'API
                       </Button>
                     </div>
                   </div>
                   
                   <div className="space-y-3">
                     <h4 className="font-medium text-gray-900">Statut des services</h4>
                     <div className="space-y-2">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                         <span className="text-sm">Authentification</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                         <span className="text-sm">Base de données</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                         <span className="text-sm">Stockage de fichiers</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                         <span className="text-sm">Fonctions Edge</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>

         {/* Onglet Permissions */}
         <TabsContent value="permissions" className="mt-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Gestion des permissions par utilisateur */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <Lock className="h-5 w-5" />
                   Permissions par Utilisateur
                 </CardTitle>
                 <CardDescription>
                   Attribution et gestion fine des droits d'accès individuels
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-3">
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                     <div>
                       <div className="font-medium text-sm">Jean Dupont</div>
                       <div className="text-xs text-gray-500">Acheteur • 15 permissions actives</div>
                     </div>
                     <Button size="sm" className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                       <Settings className="h-4 w-4 mr-2" />
                       Gérer
                     </Button>
                   </div>
                   
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                     <div>
                       <div className="font-medium text-sm">TechStore Pro</div>
                       <div className="text-xs text-gray-500">Vendeur • 28 permissions actives</div>
                     </div>
                     <Button size="sm" className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                       <Settings className="h-4 w-4 mr-2" />
                       Gérer
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Gestion des permissions par groupe */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <Users className="h-5 w-5" />
                   Permissions par Groupe
                 </CardTitle>
                 <CardDescription>
                   Création et gestion des groupes de permissions
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-3">
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                     <div>
                       <div className="font-medium text-sm">Vendeurs Premium</div>
                       <div className="text-xs text-gray-500">45 membres • 32 permissions</div>
                     </div>
                     <Button size="sm" className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                       <Settings className="h-4 w-4 mr-2" />
                       Gérer
                     </Button>
                   </div>
                   
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                     <div>
                       <div className="font-medium text-sm">Modérateurs</div>
                       <div className="text-xs text-gray-500">12 membres • 18 permissions</div>
                     </div>
                     <Button size="sm" className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                       <Settings className="h-4 w-4 mr-2" />
                       Gérer
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Hiérarchie des rôles */}
             <Card className="lg:col-span-2">
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <Shield className="h-5 w-5" />
                   Hiérarchie des Rôles et Permissions
                 </CardTitle>
                 <CardDescription>
                   Structure hiérarchique des rôles et cascade des permissions
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                     <div className="text-lg font-bold text-red-600 mb-2">Super Admin</div>
                     <div className="text-xs text-red-600">Toutes les permissions</div>
                     <div className="text-xs text-red-500 mt-1">Niveau 1</div>
                   </div>
                   
                   <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                     <div className="text-lg font-bold text-purple-600 mb-2">Admin</div>
                     <div className="text-xs text-purple-600">Permissions étendues</div>
                     <div className="text-xs text-purple-500 mt-1">Niveau 2</div>
                   </div>
                   
                   <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                     <div className="text-lg font-bold text-blue-600 mb-2">Vendeur</div>
                     <div className="text-xs text-blue-600">Permissions métier</div>
                     <div className="text-xs text-blue-500 mt-1">Niveau 3</div>
                   </div>
                   
                   <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                     <div className="text-lg font-bold text-green-600 mb-2">Acheteur</div>
                     <div className="text-xs text-green-600">Permissions limitées</div>
                     <div className="text-xs text-green-500 mt-1">Niveau 4</div>
                   </div>
                 </div>
                 
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h4 className="font-medium text-gray-900 mb-3">Règles de cascade</h4>
                   <div className="space-y-2 text-sm text-gray-600">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                       <span>Les permissions d'un niveau supérieur incluent celles des niveaux inférieurs</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                       <span>Les modifications de permissions se propagent automatiquement</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                       <span>Possibilité de créer des exceptions pour des cas spécifiques</span>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
       </Tabs>

      {/* Modal de création d'utilisateur ultra-moderne */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600] text-2xl">✨ Créer un nouvel utilisateur</DialogTitle>
            <p className="text-gray-600">Formulaire complet avec gestion avancée des fonctionnalités</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Section Avatar et Informations de base */}
            <div className="bg-gradient-to-r from-[#ff6600]/5 to-[#535455]/5 p-6 rounded-lg border border-[#ff6600]/20">
              <h3 className="text-lg font-semibold text-[#ff6600] mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Informations de base
              </h3>
              
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#ff6600]/30 bg-gradient-to-br from-[#ff6600]/20 to-[#535455]/20">
                    {userForm.avatar ? (
                      <img src={userForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ff6600] text-4xl font-bold">
                        {userForm.name ? userForm.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload" className="block">
                      <Button variant="outline" size="sm" className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Choisir avatar
                      </Button>
                    </label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                      onClick={() => setUserForm(prev => ({ ...prev, avatar: generateDefaultAvatar(userForm.name || 'User') }))}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Générer automatique
                    </Button>
                  </div>
                </div>

                {/* Informations principales */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Nom complet *</Label>
                    <Input
                      id="name"
                      value={userForm.name}
                      onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                      placeholder="Nom et prénom"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      placeholder="email@exemple.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Téléphone</Label>
                    <Input
                      id="phone"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      placeholder="+225 01234567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">Localisation</Label>
                    <Input
                      id="location"
                      value={userForm.location}
                      onChange={(e) => setUserForm({...userForm, location: e.target.value})}
                      placeholder="Ville, Pays"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section Rôle et Type */}
            <div className="bg-gradient-to-r from-[#535455]/5 to-[#ff6600]/5 p-6 rounded-lg border border-[#535455]/20">
              <h3 className="text-lg font-semibold text-[#535455] mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rôle et Permissions
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="role" className="text-sm font-medium">Rôle principal *</Label>
                  <Select value={userForm.role} onValueChange={handleFormRoleChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">👤 Acheteur</SelectItem>
                      <SelectItem value="vendor">🏪 Vendeur</SelectItem>
                      <SelectItem value="admin">👑 Administrateur</SelectItem>
                      <SelectItem value="super_admin">⭐ Super Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Le rôle détermine les fonctionnalités accessibles
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="type" className="text-sm font-medium">Type de compte *</Label>
                  <Select value={userForm.type} onValueChange={(value: User['type']) => setUserForm({...userForm, type: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">👤 Acheteur</SelectItem>
                      <SelectItem value="vendor">🏪 Vendeur</SelectItem>
                      <SelectItem value="admin">👑 Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Section Rôles multiples */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Rôles multiples et Permissions avancées
                </h4>
                
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">
                    Attribuez plusieurs rôles à cet utilisateur pour des permissions étendues
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {(['buyer', 'vendor', 'admin', 'super_admin'] as User['role'][]).map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded border hover:bg-blue-50">
                        <input
                          type="checkbox"
                          checked={selectedRoles.has(role)}
                          onChange={() => handleRoleToggle(role)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm capitalize">
                          {role === 'buyer' && '👤 Acheteur'}
                          {role === 'vendor' && '🏪 Vendeur'}
                          {role === 'admin' && '👑 Administrateur'}
                          {role === 'super_admin' && '⭐ Super Admin'}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Rôles actifs :</span> {selectedRoles.size} 
                      {selectedRoles.size > 0 && ` (${Array.from(selectedRoles).map(role => 
                        role === 'buyer' ? 'Acheteur' : 
                        role === 'vendor' ? 'Vendeur' : 
                        role === 'admin' ? 'Admin' : 'Super Admin'
                      ).join(', ')})`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Points de fidélité */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Points de fidélité et Récompenses
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loyaltyPoints" className="text-sm font-medium">Points de fidélité initiaux</Label>
                  <Input
                    id="loyaltyPoints"
                    type="number"
                    value={userForm.loyaltyPoints}
                    onChange={(e) => setUserForm({...userForm, loyaltyPoints: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Points bonus pour fidéliser le nouvel utilisateur
                  </p>
                </div>
                
                <div className="flex items-end">
                  <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">Bonus d'inscription :</span><br />
                      +100 points pour tout nouveau compte
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Sécurité */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Sécurité et Authentification
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    placeholder="Mot de passe sécurisé"
                    className="mt-1"
                  />
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${userForm.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={userForm.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>8 caractères minimum</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(userForm.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={/[A-Z]/.test(userForm.password) ? 'text-green-600' : 'text-gray-500'}>1 lettre majuscule</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${/\d/.test(userForm.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={/\d/.test(userForm.password) ? 'text-green-600' : 'text-gray-500'}>1 chiffre</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={userForm.confirmPassword}
                    onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})}
                    placeholder="Confirmer le mot de passe"
                    className="mt-1"
                  />
                  {userForm.password && userForm.confirmPassword && (
                    <div className="mt-2">
                      {userForm.password === userForm.confirmPassword ? (
                        <p className="text-xs text-green-600">✓ Les mots de passe correspondent</p>
                      ) : (
                        <p className="text-xs text-red-600">✗ Les mots de passe ne correspondent pas</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#ff6600]" />
                    <span className="text-sm font-medium">Authentification à deux facteurs</span>
                  </div>
                  <Switch
                    checked={userForm.security.twoFactorEnabled}
                    onCheckedChange={(checked) => setUserForm(prev => ({
                      ...prev,
                      security: { ...prev.security, twoFactorEnabled: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#ff6600]" />
                    <span className="text-sm font-medium">Notifications de connexion</span>
                  </div>
                  <Switch
                    checked={userForm.security.loginNotifications}
                    onCheckedChange={(checked) => setUserForm(prev => ({
                      ...prev,
                      security: { ...prev.security, loginNotifications: checked }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Section Gestion des fonctionnalités par rôle */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestion Granulaire des Fonctionnalités
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez précisément les fonctionnalités accessibles à cet utilisateur selon son rôle
              </p>

              <div className="space-y-4">
                {/* Dashboard */}
                <div className="border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Tableau de bord
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {roleFeatures[userForm.role]?.dashboard?.map(feature => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Marketplace */}
                {userForm.role === 'vendor' && (
                  <div className="border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Gestion de la boutique
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {roleFeatures.vendor.marketplace.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Administration */}
                {(userForm.role === 'admin' || userForm.role === 'super_admin') && (
                  <div className="border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Gestion administrative
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {roleFeatures[userForm.role]?.management?.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Système */}
                {userForm.role === 'super_admin' && (
                  <div className="border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                      <Cog className="h-4 w-4" />
                      Configuration système
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {roleFeatures.super_admin.system.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permissions personnalisées */}
                <div className="border border-purple-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Permissions personnalisées avancées
                  </h4>
                  <p className="text-sm text-purple-700 mb-3">
                    Attribuez des permissions spécifiques au-delà des rôles standards
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'api_access', 'database_admin', 'system_monitoring', 'backup_restore',
                      'user_impersonation', 'audit_logs', 'performance_tuning', 'security_config',
                      'third_party_integrations', 'custom_development', 'maintenance_mode', 'emergency_access'
                    ].map(permission => (
                      <label key={permission} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPermissions.has(permission)}
                          onChange={() => handleCustomPermissionToggle(permission)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm capitalize">{permission.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700">
                      <span className="font-semibold">Fonctionnalités par rôle :</span> {selectedFeatures.length} / {Object.values(roleFeatures[userForm.role] || {}).flat().length}
                    </p>
                    {selectedFeatures.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedFeatures.map(feature => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-purple-700">
                      <span className="font-semibold">Permissions personnalisées :</span> {customPermissions.size} / 12
                    </p>
                    {customPermissions.size > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.from(customPermissions).map(permission => (
                          <Badge key={permission} variant="outline" className="text-xs border-purple-300 text-purple-700">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-200">
                  <p className="text-xs text-purple-800">
                    <span className="font-semibold">Total des permissions :</span> {selectedFeatures.length + customPermissions.size} permissions actives
                  </p>
                </div>
              </div>
            </div>

            {/* Section Informations supplémentaires */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informations supplémentaires
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bio" className="text-sm font-medium">Biographie</Label>
                  <Textarea
                    id="bio"
                    value={userForm.bio}
                    onChange={(e) => setUserForm({...userForm, bio: e.target.value})}
                    placeholder="Parlez-nous de vous..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website" className="text-sm font-medium">Site web</Label>
                    <Input
                      id="website"
                      value={userForm.website}
                      onChange={(e) => setUserForm({...userForm, website: e.target.value})}
                      placeholder="https://votre-site.com"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={userForm.socialMedia.whatsapp}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, whatsapp: e.target.value }
                      }))}
                      placeholder="+225 01234567"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook" className="text-sm font-medium">Facebook</Label>
                    <Input
                      id="facebook"
                      value={userForm.socialMedia.facebook}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                      }))}
                      placeholder="https://facebook.com/votre-profil"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="twitter" className="text-sm font-medium">X (Twitter)</Label>
                    <Input
                      id="twitter"
                      value={userForm.socialMedia.twitter}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                      }))}
                      placeholder="https://x.com/votre-profil"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language" className="text-sm font-medium">Langue préférée</Label>
                    <Select value={userForm.preferences.language} onValueChange={(value) => setUserForm(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, language: value }
                    }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium">Fuseau horaire</Label>
                    <Select value={userForm.preferences.timezone} onValueChange={(value) => setUserForm(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, timezone: value }
                    }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Abidjan">Abidjan (GMT+0)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (GMT+1/+2)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5/-4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateUser}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white px-8 py-3 text-lg"
                disabled={!userForm.name || !userForm.email || !userForm.password || userForm.password !== userForm.confirmPassword}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Créer l'utilisateur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition d'utilisateur - Modal complet unifié */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600] text-2xl font-bold">Modifier le profil utilisateur</DialogTitle>
            <p className="text-gray-600">Modifiez toutes les informations et permissions de l'utilisateur</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Section Informations de base */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Informations de base
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium">Nom complet *</Label>
                  <Input
                    id="edit-name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    placeholder="Nom et prénom"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email" className="text-sm font-medium">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    placeholder="email@exemple.com"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="edit-phone" className="text-sm font-medium">Téléphone</Label>
                  <Input
                    id="edit-phone"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="+225 01234567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location" className="text-sm font-medium">Localisation</Label>
                  <Input
                    id="edit-location"
                    value={userForm.location}
                    onChange={(e) => setUserForm({...userForm, location: e.target.value})}
                    placeholder="Ville, Pays"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Section Avatar et Points de fidélité */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Avatar et Points de fidélité
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="edit-avatar" className="text-sm font-medium">Photo de profil</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff6600] to-[#535455] flex items-center justify-center text-white font-bold text-lg">
                      {userForm.avatar ? (
                        <img src={userForm.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        userForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        id="edit-avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 2MB</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-loyaltyPoints" className="text-sm font-medium">Points de fidélité</Label>
                  <Input
                    id="edit-loyaltyPoints"
                    type="number"
                    value={userForm.loyaltyPoints}
                    onChange={(e) => setUserForm({...userForm, loyaltyPoints: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Modifier les points de fidélité</p>
                </div>
              </div>
            </div>

            {/* Section Rôle et Type */}
            <div className="bg-gradient-to-r from-[#535455]/5 to-[#ff6600]/5 p-6 rounded-lg border border-[#535455]/20">
              <h3 className="text-lg font-semibold text-[#535455] mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rôle et Permissions
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="edit-role" className="text-sm font-medium">Rôle principal *</Label>
                  <Select value={userForm.role} onValueChange={handleFormRoleChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">👤 Acheteur</SelectItem>
                      <SelectItem value="vendor">🏪 Vendeur</SelectItem>
                      <SelectItem value="admin">👑 Administrateur</SelectItem>
                      <SelectItem value="super_admin">⭐ Super Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Le rôle détermine les fonctionnalités accessibles
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="edit-type" className="text-sm font-medium">Type de compte *</Label>
                  <Select value={userForm.type} onValueChange={(value: User['type']) => setUserForm({...userForm, type: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">👤 Acheteur</SelectItem>
                      <SelectItem value="vendor">🏪 Vendeur</SelectItem>
                      <SelectItem value="admin">👑 Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Section Rôles multiples */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Rôles multiples et Permissions avancées
                </h4>
                
                <div className="space-y-3">
                  <p className="text-sm text-blue-700">
                    Attribuez plusieurs rôles à cet utilisateur pour des permissions étendues
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {(['buyer', 'vendor', 'admin', 'super_admin'] as User['role'][]).map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded border hover:bg-blue-50">
                        <input
                          type="checkbox"
                          checked={selectedRoles.has(role)}
                          onChange={() => handleRoleToggle(role)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm capitalize">
                          {role === 'buyer' && '👤 Acheteur'}
                          {role === 'vendor' && '🏪 Vendeur'}
                          {role === 'admin' && '👑 Administrateur'}
                          {role === 'super_admin' && '⭐ Super Admin'}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Rôles actifs :</span> {selectedRoles.size} 
                      {selectedRoles.size > 0 && ` (${Array.from(selectedRoles).map(role => 
                        role === 'buyer' ? 'Acheteur' : 
                        role === 'vendor' ? 'Vendeur' : 
                        role === 'admin' ? 'Admin' : 'Super Admin'
                      ).join(', ')})`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Gestion des fonctionnalités par rôle */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestion Granulaire des Fonctionnalités
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez précisément les fonctionnalités accessibles à cet utilisateur selon son rôle
              </p>

              <div className="space-y-4">
                {/* Dashboard */}
                <div className="border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Tableau de bord
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {roleFeatures[userForm.role]?.dashboard?.map(feature => (
                      <label key={feature} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Marketplace */}
                {userForm.role === 'vendor' && (
                  <div className="border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Gestion de la boutique
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {roleFeatures.vendor.marketplace.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Administration */}
                {(userForm.role === 'admin' || userForm.role === 'super_admin') && (
                  <div className="border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Gestion administrative
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {roleFeatures[userForm.role]?.management?.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Système */}
                {userForm.role === 'super_admin' && (
                  <div className="border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                      <Cog className="h-4 w-4" />
                      Configuration système
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {roleFeatures.super_admin.system.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permissions personnalisées */}
                <div className="border border-purple-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Permissions personnalisées avancées
                  </h4>
                  <p className="text-sm text-purple-700 mb-3">
                    Attribuez des permissions spécifiques au-delà des rôles standards
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'api_access', 'database_admin', 'system_monitoring', 'backup_restore',
                      'user_impersonation', 'audit_logs', 'performance_tuning', 'security_config',
                      'third_party_integrations', 'custom_development', 'maintenance_mode', 'emergency_access'
                    ].map(permission => (
                      <label key={permission} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPermissions.has(permission)}
                          onChange={() => handleCustomPermissionToggle(permission)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-sm capitalize">{permission.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700">
                      <span className="font-semibold">Fonctionnalités par rôle :</span> {selectedFeatures.length} / {Object.values(roleFeatures[userForm.role] || {}).flat().length}
                    </p>
                    {selectedFeatures.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedFeatures.map(feature => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-purple-700">
                      <span className="font-semibold">Permissions personnalisées :</span> {customPermissions.size} / 12
                    </p>
                    {customPermissions.size > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.from(customPermissions).map(permission => (
                          <Badge key={permission} variant="outline" className="text-xs border-purple-300 text-purple-700">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-200">
                  <p className="text-xs text-purple-800">
                    <span className="font-semibold">Total des permissions :</span> {selectedFeatures.length + customPermissions.size} permissions actives
                  </p>
                </div>
              </div>
            </div>

            {/* Section Informations supplémentaires */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informations supplémentaires
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-bio" className="text-sm font-medium">Biographie</Label>
                  <Textarea
                    id="edit-bio"
                    value={userForm.bio}
                    onChange={(e) => setUserForm({...userForm, bio: e.target.value})}
                    placeholder="Parlez-nous de vous..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-website" className="text-sm font-medium">Site web</Label>
                    <Input
                      id="edit-website"
                      value={userForm.website}
                      onChange={(e) => setUserForm({...userForm, website: e.target.value})}
                      placeholder="https://votre-site.com"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-whatsapp" className="text-sm font-medium">WhatsApp</Label>
                    <Input
                      id="edit-whatsapp"
                      value={userForm.socialMedia.whatsapp}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, whatsapp: e.target.value }
                      }))}
                      placeholder="+225 01234567"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-facebook" className="text-sm font-medium">Facebook</Label>
                    <Input
                      id="edit-facebook"
                      value={userForm.socialMedia.facebook}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                      }))}
                      placeholder="https://facebook.com/votre-profil"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-twitter" className="text-sm font-medium">X (Twitter)</Label>
                    <Input
                      id="edit-twitter"
                      value={userForm.socialMedia.twitter}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                      }))}
                      placeholder="https://x.com/votre-profil"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateUser}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white px-8 py-3 text-lg"
              >
                <Edit className="h-5 w-5 mr-2" />
                Mettre à jour l'utilisateur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation d'utilisateur */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600] text-2xl font-bold">Détails de l'utilisateur</DialogTitle>
            <p className="text-gray-600">Informations complètes et statistiques détaillées</p>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* En-tête avec avatar et informations principales */}
              <div className="bg-gradient-to-r from-[#ff6600]/5 to-[#535455]/5 p-6 rounded-xl border border-[#ff6600]/20">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-[#ff6600] to-[#535455] rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      selectedUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedUser.name}</h2>
                    <p className="text-lg text-gray-600 mb-3">{selectedUser.email}</p>
                    <div className="flex gap-3 mb-4">
                      {getStatusBadge(selectedUser.status)}
                      {getRoleBadge(selectedUser.role)}
                      {selectedUser.isVerified && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Vérifié
                        </Badge>
                      )}
                      {selectedUser.has2FA && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          2FA Activé
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Inscrit le:</span>
                        <p className="font-semibold">{selectedUser.joinDate}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Dernière activité:</span>
                        <p className="font-semibold">{selectedUser.lastActive}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Téléphone:</span>
                        <p className="font-semibold">{selectedUser.phone}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Localisation:</span>
                        <p className="font-semibold">{selectedUser.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques principales */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-[#ff6600]/10 to-[#ff6600]/5 border-[#ff6600]/20">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-[#ff6600]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Store className="h-6 w-6 text-[#ff6600]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#ff6600] mb-1">
                      {selectedUser.totalOrders || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Commandes totales</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#535455]/10 to-[#535455]/5 border-[#535455]/20">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-[#535455]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-[#535455]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#535455] mb-1">
                      {selectedUser.loyaltyPoints || 0}
                    </h3>
                    <p className="text-sm text-gray-600">Points fidélité</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-600 mb-1">
                      {selectedUser.totalSpent ? selectedUser.totalSpent.toLocaleString() : '0'}
                    </h3>
                    <p className="text-sm text-gray-600">Total dépensé (F CFA)</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-600 mb-1">
                      {selectedUser.rating || 0}/5
                    </h3>
                    <p className="text-sm text-gray-600">Note moyenne</p>
                  </CardContent>
                </Card>
              </div>

              {/* Statistiques détaillées */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Statistiques produits et ventes */}
                <Card className="border-[#ff6600]/20">
                  <CardHeader className="bg-gradient-to-r from-[#ff6600]/5 to-transparent">
                    <CardTitle className="text-[#ff6600] flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Statistiques Produits & Ventes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Produits en boutique</span>
                        <span className="font-semibold text-[#ff6600]">24</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Produits partagés</span>
                        <span className="font-semibold text-[#ff6600]">156</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Total produits vendus</span>
                        <span className="font-semibold text-[#ff6600]">89</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Promotions utilisées</span>
                        <span className="font-semibold text-[#ff6600]">12</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Services de boostage</span>
                        <span className="font-semibold text-[#ff6600]">8</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Total des ventes</span>
                        <span className="font-semibold text-[#ff6600]">2.450.000 F CFA</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistiques financières */}
                <Card className="border-[#535455]/20">
                  <CardHeader className="bg-gradient-to-r from-[#535455]/5 to-transparent">
                    <CardTitle className="text-[#535455] flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Statistiques Financières
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Gains totaux</span>
                        <span className="font-semibold text-[#535455]">1.250.000 F CFA</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Commissions</span>
                        <span className="font-semibold text-[#535455]">125.000 F CFA</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Retraits effectués</span>
                        <span className="font-semibold text-[#535455]">850.000 F CFA</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Solde disponible</span>
                        <span className="font-semibold text-[#535455]">400.000 F CFA</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Taxes payées</span>
                        <span className="font-semibold text-[#535455]">45.000 F CFA</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Moyenne mensuelle</span>
                        <span className="font-semibold text-[#535455]">208.333 F CFA</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Informations personnelles et préférences */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <Card className="border-[#ff6600]/20">
                  <CardHeader className="bg-gradient-to-r from-[#ff6600]/5 to-transparent">
                    <CardTitle className="text-[#ff6600] flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Informations Personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {selectedUser.bio && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Biographie</Label>
                          <p className="text-gray-800 mt-1">{selectedUser.bio}</p>
                        </div>
                      )}
                      {selectedUser.website && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Site web</Label>
                          <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" 
                             className="text-[#ff6600] hover:underline break-all">
                            {selectedUser.website}
                          </a>
                        </div>
                      )}
                      {selectedUser.socialMedia && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600 mb-2">Réseaux sociaux</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedUser.socialMedia.facebook && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                <span className="text-gray-600">Facebook:</span>
                                <span className="font-medium">{selectedUser.socialMedia.facebook}</span>
                              </div>
                            )}
                            {selectedUser.socialMedia.twitter && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                <span className="text-gray-600">Twitter:</span>
                                <span className="font-medium">{selectedUser.socialMedia.twitter}</span>
                              </div>
                            )}
                            {selectedUser.socialMedia.instagram && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                <span className="text-gray-600">Instagram:</span>
                                <span className="font-medium">{selectedUser.socialMedia.instagram}</span>
                              </div>
                            )}
                            {selectedUser.socialMedia.linkedin && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                <span className="text-gray-600">LinkedIn:</span>
                                <span className="font-medium">{selectedUser.socialMedia.linkedin}</span>
                              </div>
                            )}
                            {selectedUser.socialMedia.whatsapp && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-gray-600">WhatsApp:</span>
                                <span className="font-medium">{selectedUser.socialMedia.whatsapp}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Préférences et sécurité */}
                <Card className="border-[#535455]/20">
                  <CardHeader className="bg-gradient-to-r from-[#535455]/5 to-transparent">
                    <CardTitle className="text-[#535455] flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Préférences & Sécurité
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {selectedUser.preferences && (
                        <>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Langue</span>
                            <span className="font-semibold">{selectedUser.preferences.language || 'Français'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Fuseau horaire</span>
                            <span className="font-semibold">{selectedUser.preferences.timezone || 'UTC+1'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Notifications email</span>
                            <span className="font-semibold">{selectedUser.preferences.notifications?.email ? 'Activées' : 'Désactivées'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Notifications SMS</span>
                            <span className="font-semibold">{selectedUser.preferences.notifications?.sms ? 'Activées' : 'Désactivées'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Notifications push</span>
                            <span className="font-semibold">{selectedUser.preferences.notifications?.push ? 'Activées' : 'Désactivées'}</span>
                          </div>
                        </>
                      )}
                      {selectedUser.security && (
                        <>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600">Authentification 2FA</span>
                              <span className="font-semibold">{selectedUser.security.twoFactorEnabled ? 'Activée' : 'Désactivée'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600">Notifications de connexion</span>
                              <span className="font-semibold">{selectedUser.security.loginNotifications ? 'Activées' : 'Désactivées'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-600">Délai de session</span>
                              <span className="font-semibold">{selectedUser.security.sessionTimeout || 30} minutes</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Historique des activités récentes */}
              <Card className="border-[#ff6600]/20">
                <CardHeader className="bg-gradient-to-r from-[#ff6600]/5 to-transparent">
                  <CardTitle className="text-[#ff6600] flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activités Récentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                      <span className="text-sm text-gray-600">Commande #12345 créée</span>
                      <span className="text-xs text-gray-400 ml-auto">Il y a 2h</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Produit "Smartphone XYZ" ajouté à la boutique</span>
                      <span className="text-xs text-gray-400 ml-auto">Il y a 1j</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Connexion depuis Dakar, Sénégal</span>
                      <span className="text-xs text-gray-400 ml-auto">Il y a 3j</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Promotion "Été 2024" activée</span>
                      <span className="text-xs text-gray-400 ml-auto">Il y a 1sem</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewModalOpen(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Fermer
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewModalOpen(false)
                    setIsEditModalOpen(true)
                  }}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier l'utilisateur
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de messages en masse */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600] text-xl font-bold">Messages en Masse</DialogTitle>
            <p className="text-gray-600">
              Envoyer un message à {selectedFilteredUsers.size} utilisateur(s) sélectionné(s)
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Type de message */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Type de message</Label>
              <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Notification Push</SelectItem>
                  <SelectItem value="in_app">Message In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Templates de messages */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Templates prédéfinis</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {messageTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="border-gray-200 hover:border-[#ff6600]/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setMessageSubject(template.subject)
                      setMessageTemplate(template.content)
                      setMessageType(template.type as any)
                    }}
                  >
                    <CardContent className="p-3">
                      <h5 className="font-medium text-sm text-gray-900 mb-1">{template.name}</h5>
                      <p className="text-xs text-gray-600">{template.subject}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sujet et contenu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="message-subject" className="text-sm font-medium mb-2 block">Sujet</Label>
                <Input
                  id="message-subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Sujet du message..."
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Type</Label>
                <Badge className={`${
                  messageType === 'email' ? 'bg-blue-100 text-blue-800' :
                  messageType === 'sms' ? 'bg-green-100 text-green-800' :
                  messageType === 'push' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {messageType === 'email' ? 'Email' :
                   messageType === 'sms' ? 'SMS' :
                   messageType === 'push' ? 'Push' : 'In-App'}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="message-content" className="text-sm font-medium mb-2 block">Contenu du message</Label>
              <Textarea
                id="message-content"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Contenu du message... Utilisez {name} pour personnaliser"
                rows={6}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Variables disponibles: {'{name}'}, {'{email}'}, {'{role}'}
              </p>
            </div>

            {/* Aperçu des destinataires */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Destinataires ({selectedFilteredUsers.size})</Label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {filteredResults
                  .filter(user => selectedFilteredUsers.has(user.id))
                  .slice(0, 10)
                  .map(user => (
                    <div key={user.id} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                      {user.name} ({user.email}) - {user.role}
                    </div>
                  ))}
                {selectedFilteredUsers.size > 10 && (
                  <div className="text-xs text-gray-500 mt-2">
                    ... et {selectedFilteredUsers.size - 10} autres utilisateurs
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowMessageModal(false)}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                Annuler
              </Button>
              <Button 
                onClick={sendBulkMessage}
                disabled={!messageSubject || !messageTemplate || selectedFilteredUsers.size === 0}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white px-8"
              >
                <Mail className="h-4 w-4 mr-2" />
                Envoyer le message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de chat intégré */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600] text-xl font-bold">Chat Intégré</DialogTitle>
            <p className="text-gray-600">
              Chat en direct avec {selectedFilteredUsers.size} utilisateur(s) sélectionné(s)
            </p>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[60vh]">
            {/* Liste des utilisateurs */}
            <div className="border-r border-gray-200 pr-4">
              <h4 className="font-medium text-gray-900 mb-3">Utilisateurs en ligne</h4>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {filteredResults
                  .filter(user => selectedFilteredUsers.has(user.id))
                  .map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-[#ff6600] to-[#535455] rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm text-gray-900">{user.name}</h5>
                        <p className="text-xs text-gray-500">{user.role}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">En ligne</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Zone de chat */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500">
                      Chat démarré - {new Date().toLocaleString('fr-FR')}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-[#ff6600] text-white px-4 py-2 rounded-lg max-w-xs">
                      <p className="text-sm">Bonjour ! Je suis l'administrateur Probooster. Comment puis-je vous aider ?</p>
                      <p className="text-xs opacity-75 mt-1">{new Date().toLocaleTimeString('fr-FR')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone de saisie */}
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message..."
                  className="flex-1"
                />
                <Button className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setShowChatModal(false)}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Fermer
            </Button>
            <Button 
              variant="outline"
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter l'historique
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de rapports automatiques */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600] text-xl font-bold">Rapports Automatiques</DialogTitle>
            <p className="text-gray-600">
              Gérer et configurer les rapports automatiques basés sur les filtres
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Rapports existants */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Rapports configurés</h4>
              <div className="space-y-3">
                {autoReports.map((report) => (
                  <Card key={report.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium text-gray-900">{report.name}</h5>
                            <Badge className={`${
                              report.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {report.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              {report.schedule === 'daily' ? 'Quotidien' : 'Hebdomadaire'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <p className="text-xs text-gray-500">
                            Dernière exécution: {report.lastRun} • Destinataires: {report.recipients.join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateAutoReport(report)}
                            className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Générer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Créer un nouveau rapport */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Créer un nouveau rapport</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Nom du rapport</Label>
                  <Input placeholder="Ex: Rapport mensuel vendeurs" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Fréquence</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Destinataires</Label>
                  <Input placeholder="email1@example.com, email2@example.com" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Format</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Description</Label>
                <Textarea 
                  placeholder="Décrivez le contenu et l'objectif de ce rapport..."
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowReportModal(false)}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                Fermer
              </Button>
              <Button 
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white px-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le rapport
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

       {/* Modal de création/édition de rôle */}
       <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle className="text-[#ff6600]">
               {editingRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
             </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4">
             <div>
               <Label htmlFor="role-name">Nom du rôle *</Label>
               <Input
                 id="role-name"
                 value={roleForm.name}
                 onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                 placeholder="Ex: Modérateur, Support Client"
                 className="mt-1"
               />
             </div>
             
             <div>
               <Label htmlFor="role-description">Description</Label>
               <Textarea
                 id="role-description"
                 value={roleForm.description}
                 onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                 placeholder="Décrivez les responsabilités de ce rôle"
                 className="mt-1"
                 rows={3}
               />
             </div>
             
             <div>
               <Label className="text-sm font-medium mb-3 block">Permissions</Label>
               <div className="grid grid-cols-2 gap-3">
                 {[
                   'view_dashboard', 'manage_users', 'manage_products', 'manage_orders',
                   'view_analytics', 'moderate_content', 'manage_reports', 'view_tickets',
                   'respond_tickets', 'escalate_tickets', 'manage_settings', 'view_logs'
                 ].map((permission) => (
                   <label key={permission} className="flex items-center gap-2 cursor-pointer">
                     <input
                       type="checkbox"
                       checked={roleForm.permissions.includes(permission)}
                       onChange={() => togglePermission(permission)}
                       className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                     />
                     <span className="text-sm capitalize">{permission.replace('_', ' ')}</span>
                   </label>
                 ))}
               </div>
             </div>
             
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Switch
                   checked={roleForm.isActive}
                   onCheckedChange={(checked) => setRoleForm({...roleForm, isActive: checked})}
                 />
                 <span className="text-sm font-medium">Rôle actif</span>
               </div>
             </div>
             
             <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
               <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                 Annuler
               </Button>
               <Button 
                 onClick={editingRole ? handleUpdateRole : handleCreateRole}
                 className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                 disabled={!roleForm.name.trim()}
               >
                 {editingRole ? 'Mettre à jour' : 'Créer le rôle'}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   )
 }

// Composant de liste des utilisateurs
interface UserListProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
  onStatusChange: (userId: string, status: User['status']) => void
  onRoleChange: (userId: string, role: User['role']) => void
  onView: (user: User) => void
  selectedUsers: Set<string>
  onSelectUser: (userId: string) => void
  openMenuId: string | null
  onMenuToggle: (userId: string) => void
  onMenuAction: (userId: string, action: string) => void
  sortConfig?: {
    key: keyof User | null
    direction: 'asc' | 'desc'
  }
  onSort?: (key: keyof User) => void
}

function UserList({ users, onEdit, onDelete, onStatusChange, onRoleChange, onView, selectedUsers, onSelectUser, openMenuId, onMenuToggle, onMenuAction, sortConfig, onSort }: UserListProps) {
  const allSelected = users.length > 0 && users.every(user => selectedUsers.has(user.id))
  const someSelected = users.some(user => selectedUsers.has(user.id))

  return (
    <div className="space-y-4">
             {/* En-tête avec sélection multiple et tri */}
       {users.length > 0 && (
         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <input
                 type="checkbox"
                 checked={allSelected}
                 ref={(input) => {
                   if (input) input.indeterminate = someSelected && !allSelected
                 }}
                 onChange={() => {
                   if (allSelected) {
                     users.forEach(user => onSelectUser(user.id))
                   } else {
                     users.forEach(user => {
                       if (!selectedUsers.has(user.id)) {
                         onSelectUser(user.id)
                       }
                     })
                   }
                 }}
                 className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
               />
               <span className="text-sm text-gray-600">
                 {allSelected ? 'Désélectionner tout' : 'Sélectionner tout'}
               </span>
             </div>
             {someSelected && (
               <span className="text-sm text-[#ff6600] font-medium">
                 {users.filter(user => selectedUsers.has(user.id)).length} sur {users.length} sélectionné(s)
               </span>
             )}
           </div>
           
           {/* Options de tri */}
           {onSort && (
             <div className="flex items-center gap-2 text-sm text-gray-600">
               <span>Trier par:</span>
               <button
                 onClick={() => onSort('name')}
                 className={`px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
                   sortConfig?.key === 'name' ? 'bg-[#ff6600]/20 text-[#ff6600]' : ''
                 }`}
               >
                 Nom {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
               </button>
               <button
                 onClick={() => onSort('joinDate')}
                 className={`px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
                   sortConfig?.key === 'joinDate' ? 'bg-[#ff6600]/20 text-[#ff6600]' : ''
                 }`}
               >
                 Date {sortConfig?.key === 'joinDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
               </button>
               <button
                 onClick={() => onSort('rating')}
                 className={`px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
                   sortConfig?.key === 'rating' ? 'bg-[#ff6600]/20 text-[#ff6600]' : ''
                 }`}
               >
                 Note {sortConfig?.key === 'rating' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
               </button>
             </div>
           )}
         </div>
       )}
      
      {users.map((user) => (
        <Card key={user.id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => onSelectUser(user.id)}
                  className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                />
                <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-[#535455] rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    {getStatusBadge(user.status)}
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{user.email}</span>
                    <span>{user.phone}</span>
                    <span>{user.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onView(user)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                  title="Voir les détails"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(user)}
                  className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(user.id)}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="relative user-menu-container">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onMenuToggle(user.id)}
                    className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                    title="Plus d'actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  
                  {/* Menu contextuel des 3 points */}
                  {openMenuId === user.id && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <div className="py-1">
                        {/* Actions communes */}
                        <button
                          onClick={() => onMenuAction(user.id, 'duplicate')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4 text-[#ff6600]" />
                          Dupliquer
                        </button>
                        
                        <button
                          onClick={() => onMenuAction(user.id, 'send-email')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4 text-[#ff6600]" />
                          Envoyer un email
                        </button>
                        
                        <button
                          onClick={() => onMenuAction(user.id, 'reset-password')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Key className="h-4 w-4 text-[#ff6600]" />
                          Réinitialiser mot de passe
                        </button>
                        
                        <div className="border-t border-gray-200 my-1"></div>
                        
                        {/* Actions de statut */}
                        {user.status !== 'active' && (
                          <button
                            onClick={() => onMenuAction(user.id, 'activate')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Activer
                          </button>
                        )}
                        
                        {user.status !== 'inactive' && (
                          <button
                            onClick={() => onMenuAction(user.id, 'deactivate')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4 text-[#535455]" />
                            Désactiver
                          </button>
                        )}
                        
                        {user.status !== 'suspended' && (
                          <button
                            onClick={() => onMenuAction(user.id, 'suspend')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <UserX className="h-4 w-4 text-red-500" />
                            Suspendre
                          </button>
                        )}
                        
                        {user.status !== 'verified' && (
                          <button
                            onClick={() => onMenuAction(user.id, 'verify')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            Vérifier
                          </button>
                        )}
                        
                        <div className="border-t border-gray-200 my-1"></div>
                        
                        {/* Actions spécifiques selon le rôle */}
                        {user.role === 'vendor' && (
                          <button
                            onClick={() => onMenuAction(user.id, 'duplicate')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Shield className="h-4 w-4 text-[#ff6600]" />
                            Approuver vendeur
                          </button>
                        )}
                        
                        {user.role === 'admin' && (
                          <button
                            onClick={() => onMenuAction(user.id, 'verify')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Shield className="h-4 w-4 text-[#ff6600]" />
                            Vérifier admin
                          </button>
                        )}
                        
                        <div className="border-t border-gray-200 my-1"></div>
                        
                        {/* Action de suppression */}
                        <button
                          onClick={() => onMenuAction(user.id, 'delete')}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          Supprimer définitivement
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {users.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-600">Aucun utilisateur ne correspond aux critères de recherche.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Fonctions utilitaires pour les badges
function getStatusBadge(status: string) {
  switch (status) {
    case 'active': return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Actif</Badge>
    case 'inactive': return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Inactif</Badge>
    case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>
    case 'suspended': return <Badge className="bg-red-100 text-red-800 border-red-200">Suspendu</Badge>
    case 'verified': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Vérifié</Badge>
    default: return <Badge variant="outline">Inconnu</Badge>
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'buyer': return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Acheteur</Badge>
    case 'vendor': return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Vendeur</Badge>
    case 'admin': return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Admin</Badge>
    case 'super_admin': return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Super Admin</Badge>
    default: return <Badge variant="outline">Inconnu</Badge>
  }
}
