"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { 
  Users, UserPlus, UserCheck, UserX, Shield, 
  Search, Filter, MoreHorizontal, Eye, Edit,
  Trash2, Clock, Star, Bell, Info, Loader2,
  Mail, Phone, MapPin, Calendar, Activity,
  Settings, Lock, Key, Plus, Download, Copy,
  Upload, Sparkles, Store, Cog,
  AlertTriangle, Database, RefreshCw, MessageCircle, CheckCircle, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  SuperAdminDashboardService,
  type SuperAdminActivity,
  type SuperAdminOverviewStats,
  type SuperAdminPermission,
  type SuperAdminRole,
  type SuperAdminSupportMessage,
  type SuperAdminSupportTicket,
  type SuperAdminUserSummary,
  type CreateSuperAdminUserInput,
  type UpdateSuperAdminUserInput
} from '@/lib/services/super-admin-dashboard-service'
import type { SuperAdminSettings } from '@/lib/types/super-admin-settings'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/modern-notification'
import { useMoney } from '@/lib/hooks/use-money'

/**
 * Crée un état de filtres avancés avec les valeurs par défaut.
 */
const createDefaultAdvancedFilters = () => ({
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
  churnRisk: [] as string[],
  activityLevel: [] as string[],
  verificationStatus: [] as string[],
  joinDateRange: { start: '', end: '' },
  lastActiveRange: { start: '', end: '' },
  lastPurchaseRange: { start: '', end: '' },
  hasVerifiedDocuments: null as boolean | null,
  hasCompletedProfile: null as boolean | null,
  isHighValueCustomer: null as boolean | null,
  isEngagedUser: null as boolean | null
})

type AdvancedFiltersState = ReturnType<typeof createDefaultAdvancedFilters>

/**
 * Clone en profondeur l'état des filtres avancés.
 */
const cloneAdvancedFilters = (filters: AdvancedFiltersState): AdvancedFiltersState => {
  if (typeof structuredClone === 'function') {
    return structuredClone(filters)
  }

  if (!filters) {
    return createDefaultAdvancedFilters()
  }

  return JSON.parse(JSON.stringify(filters)) as AdvancedFiltersState
}

function getAccountTypeBadge(type: string) {
  switch (type) {
    case 'buyer':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Type : Acheteur</Badge>
    case 'vendor':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Type : Vendeur</Badge>
    case 'admin':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Type : Admin</Badge>
    default:
      return <Badge variant="outline">Type inconnu</Badge>
  }
}

interface SavedFilter {
  id: string
  name: string
  description: string
  filters: AdvancedFiltersState
  createdAt: string
}

const STORAGE_KEY_SAVED_FILTERS = 'super_admin_saved_filters'
const STORAGE_KEY_ADVANCED_FILTERS = 'super_admin_advanced_filters'

const loadFiltersFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch (error) {
    console.warn(`Impossible de lire ${key} depuis localStorage:`, error)
    return fallback
  }
}

const saveFiltersToStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Impossible de sauvegarder ${key} dans localStorage:`, error)
  }
}

/**
 * Fusionne des overrides dans un état de filtres avancés.
 */
const mergeAdvancedFilters = (
  base: AdvancedFiltersState,
  overrides?: Partial<AdvancedFiltersState>
): AdvancedFiltersState => {
  const result = cloneAdvancedFilters(base)

  if (!overrides) {
    return result
  }

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      return
    }

    const filterKey = key as keyof AdvancedFiltersState

    if (Array.isArray(value)) {
      result[filterKey] = value as AdvancedFiltersState[typeof filterKey]
    } else if (value !== null && typeof value === 'object') {
      result[filterKey] = {
        ...(result[filterKey] as Record<string, unknown>),
        ...(value as Record<string, unknown>)
      } as AdvancedFiltersState[typeof filterKey]
    } else {
      result[filterKey] = value as AdvancedFiltersState[typeof filterKey]
    }
  })

  return result
}

type ExtendedUser = SuperAdminUserSummary & {
  avatar?: string
  bio?: string
  website?: string
  socialMedia?: {
    facebook?: string
    twitter?: string
    linkedin?: string
    instagram?: string
    whatsapp?: string
  }

  preferences?: {
    language?: string
    timezone?: string
    notifications?: {
      email?: boolean
      sms?: boolean
      push?: boolean
    }
  }

  security?: {
    twoFactorEnabled?: boolean
    loginNotifications?: boolean
    sessionTimeout?: number
  }
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
  verificationDocuments?: string[]
  timeSpentOnPlatform?: number
}

type User = ExtendedUser
type ManagementRole = SuperAdminUserSummary['role']

interface ManagedRole {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isActive: boolean
  createdAt: string
}

type ApprovalSettingsState = {
  vendorAutoApproval: boolean
  adminAutoApproval: boolean
  requireDocumentVerification: boolean
  requirePhoneVerification: boolean
  requireEmailVerification: boolean
  approvalDelay: number
  maxPendingVendors: number
}

const DEFAULT_APPROVAL_SETTINGS: ApprovalSettingsState = {
  vendorAutoApproval: false,
  adminAutoApproval: false,
  requireDocumentVerification: true,
  requirePhoneVerification: true,
  requireEmailVerification: true,
  approvalDelay: 24,
  maxPendingVendors: 50
}

type UserManagementProps = {
  prefetchedUsers?: SuperAdminUserSummary[]
}

export default function UserManagement({ prefetchedUsers }: UserManagementProps) {
  const { user, session } = useAuth()
  const { addNotification } = useNotifications()
  const { formatMoney } = useMoney()
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([])
  const usersRef = useRef<ExtendedUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    usersRef.current = users
  }, [users])

  const userCounts = useMemo(() => {
    const counts = {
      total: filteredUsers.length,
      buyers: 0,
      vendors: 0,
      admins: 0,
      pending: 0,
      suspended: 0
    }

    filteredUsers.forEach((user) => {
      if (user.role === 'client') {
        counts.buyers += 1
      }
      if (user.role === 'vendor') {
        counts.vendors += 1
      }
      if (user.role === 'admin' || user.role === 'super_admin') {
        counts.admins += 1
      }

      if (user.status === 'pending') {
        counts.pending += 1
      }
      if (user.status === 'suspended') {
        counts.suspended += 1
      }
    })

    return counts
  }, [filteredUsers])

  const [actionLoading, setActionLoading] = useState(false)
  const { sendPasswordReset } = useAuth()
  const [actionError, setActionError] = useState<string | null>(null)
  const lastActionErrorRef = useRef<string | null>(null)
  const lastErrorToastEmittedRef = useRef<boolean>(false)

  /**
   * Transforme toute erreur remontée lors d'une action en message utilisateur clair dans le modal.
   */
  const resolveActionErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const rawMessage = error.message?.trim() ?? ''
      const normalizedMessage = rawMessage.replace(/^Création utilisateur échouée:\s*/i, '').replace(/^Requête\s+POST\s+\/users\s+échouée\s*\(status\s*\d+\)\.?$/i, '')
      const lowerMessage = normalizedMessage.toLowerCase()

      // Détections supplémentaires pour email déjà existant (unique_violation / 409 / messages communs)
      const anyErr = error as any
      if (typeof anyErr?.code === 'string' && anyErr.code === '23505') {
        return "Un compte avec cet e-mail existe déjà. Veuillez en saisir un autre."
      }
      if (typeof anyErr?.status === 'number' && anyErr.status === 409) {
        return "Un compte avec cet e-mail existe déjà. Veuillez en saisir un autre."
      }
      if ((lowerMessage.includes('unique') || lowerMessage.includes('duplicate') || lowerMessage.includes('déjà') || lowerMessage.includes('already')) && lowerMessage.includes('email')) {
        return "Un compte avec cet e-mail existe déjà. Veuillez en saisir un autre."
      }

      if (lowerMessage.includes('duplicate key') && lowerMessage.includes('users_email_key')) {
        return "Un compte avec cet e-mail existe déjà. Veuillez en saisir un autre."
      }

      if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
        return 'Le mot de passe fourni est trop faible. Utilisez au moins 8 caractères, une majuscule et un chiffre.'
      }

      if (normalizedMessage) {
        return normalizedMessage
      }
    }

    return "Une erreur inattendue s'est produite. Veuillez réessayer."
  }

  const runWithLoader = async <T,>(operation: () => Promise<T>, options?: { successMessage?: string; successTitle?: string }): Promise<T | null> => {
    if (actionLoading) {
      return null
    }

    setActionLoading(true)

    try {
      const result = await operation()

      if (options?.successMessage) {
        addNotification({
          type: 'success',
          title: options.successTitle ?? 'Succès',
          message: options.successMessage
        })
      }

      return result
    } catch (error) {
      console.error('Erreur lors de l\'opération super admin:', error)
      const message = resolveActionErrorMessage(error)
      lastActionErrorRef.current = message
      setActionError(message)
      lastErrorToastEmittedRef.current = true
      addNotification({ type: 'error', title: 'Erreur', message })
      return null
    } finally {
      setActionLoading(false)
      // Réinitialiser le flag après un court délai pour laisser les handlers lire son état
      setTimeout(() => { lastErrorToastEmittedRef.current = false }, 0)
    }
  }
  
  // États pour la sélection multiple et actions en lot
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showTopExportMenu, setShowTopExportMenu] = useState(false)
  const [showFilteredExportMenu, setShowFilteredExportMenu] = useState(false)
  const [showBulkExportMenu, setShowBulkExportMenu] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  
  // État pour le menu contextuel des 3 points
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  /**
   * Normalise une liste d'utilisateurs Super Admin pour la consommation UI (valeurs par défaut, structures imbriquées).
   */
  const normalizeUsersForUi = useCallback((data: SuperAdminUserSummary[]): ExtendedUser[] => {
    return (Array.isArray(data) ? data : []).map((user) => ({
      ...user,
      avatar: user.avatar ?? undefined,
      socialMedia: {
        facebook: user.socialMedia?.facebook ?? '',
        twitter: user.socialMedia?.twitter ?? '',
        linkedin: user.socialMedia?.linkedin ?? '',
        instagram: user.socialMedia?.instagram ?? '',
        whatsapp: user.socialMedia?.whatsapp ?? ''
      },
      preferences: {
        language: (user.preferences as Record<string, any> | undefined)?.language ?? 'fr',
        timezone: (user.preferences as Record<string, any> | undefined)?.timezone ?? 'Africa/Abidjan',
        notifications: {
          email: Boolean((user.preferences as any)?.notifications?.email ?? true),
          sms: Boolean((user.preferences as any)?.notifications?.sms ?? true),
          push: Boolean((user.preferences as any)?.notifications?.push ?? true)
        }
      },
      security: {
        twoFactorEnabled: user.securitySettings?.twoFactorEnabled ?? user.has2FA ?? false,
        loginNotifications: user.securitySettings?.loginNotifications ?? true,
        sessionTimeout: user.securitySettings?.sessionTimeout ?? 30
      },
      secondaryRoles: Array.isArray(user.secondaryRoles) ? user.secondaryRoles : [],
      customPermissions: Array.isArray(user.customPermissions) ? user.customPermissions : [],
      features: Array.isArray(user.features)
        ? user.features.map((feature) => ({
            code: feature.code,
            scope: feature.scope,
            enabled: feature.enabled ?? true
          }))
        : []
    }))
  }, [])

  // États pour la création/édition d'utilisateur
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'client' as SuperAdminUserSummary['role'],
    type: 'buyer' as SuperAdminUserSummary['type'],
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
  const [selectedRoles, setSelectedRoles] = useState<Set<ManagementRole>>(new Set(['client']))
  const [customPermissions, setCustomPermissions] = useState<Set<string>>(new Set())

  // État pour la gestion des fonctionnalités par rôle
  const [roleFeatures, setRoleFeatures] = useState({
    client: {
      dashboard: ['overview', 'orders', 'wishlist', 'dashboard_reviews', 'settings', 'profile', 'addresses', 'payment_methods', 'user_notifications', 'preferences'],
      marketplace: ['browse', 'search', 'compare', 'favorites', 'categories', 'brands', 'deals', 'trending', 'recommendations', 'price_alerts'],
      communication: ['chat', 'support', 'communication_reviews', 'ratings', 'feedback', 'help_center', 'faq'],
      financial: ['payment_history', 'refunds', 'coupons', 'loyalty_points', 'gift_cards', 'subscriptions'],
      social: ['follow_vendors', 'share_products', 'invite_friends', 'social_login', 'community_forum']
    },
    vendor: {
      dashboard: ['overview', 'products', 'orders', 'analytics', 'earnings', 'customers', 'inventory_overview', 'performance', 'insights', 'reports_dashboard'],
      marketplace: ['manage_products', 'inventory_management', 'pricing', 'promotions', 'categories', 'brands', 'seo', 'marketing', 'advertising', 'partnerships'],
      communication: ['chat', 'vendor_notifications', 'support', 'customer_service', 'email_marketing', 'sms_campaigns', 'social_media', 'live_chat', 'ticket_system'],
      financial: ['payments', 'withdrawals', 'reports', 'taxes', 'invoicing', 'accounting', 'payouts', 'commissions', 'fees', 'currency_management'],
      operations: ['shipping', 'fulfillment', 'returns', 'warranty', 'quality_control', 'supplier_management', 'logistics', 'warehouse']
    },
    admin: {
      dashboard: ['overview', 'users', 'products', 'orders', 'analytics', 'system_health', 'performance', 'security', 'reports', 'insights'],
      management: ['user_management', 'product_management', 'order_management', 'vendor_management', 'category_management', 'brand_management', 'content_moderation', 'dispute_resolution'],
      system: ['settings', 'backup', 'logs', 'maintenance', 'updates', 'security', 'api_management', 'integrations', 'third_party_services', 'system_configuration'],
      financial: ['reports_financial', 'transactions', 'refunds', 'commissions', 'payouts', 'taxes', 'audit', 'compliance', 'fraud_detection', 'risk_management_financial'],
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

  const [approvalSettings, setApprovalSettings] = useState<ApprovalSettingsState>(DEFAULT_APPROVAL_SETTINGS)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    setSettingsError(null)
    try {
      const settings = await SuperAdminDashboardService.getSettings()
      if (!settings) {
        return
      }
      const vendorDefaults = DEFAULT_APPROVAL_SETTINGS
      const vendor = settings.vendor ?? {}
      const admin = settings.admin ?? {}
      setApprovalSettings({
        vendorAutoApproval: typeof vendor.autoApproval === 'boolean' ? vendor.autoApproval : vendorDefaults.vendorAutoApproval,
        adminAutoApproval: typeof admin.autoApproval === 'boolean' ? admin.autoApproval : vendorDefaults.adminAutoApproval,
        requireDocumentVerification: typeof vendor.requireDocumentVerification === 'boolean' ? vendor.requireDocumentVerification : vendorDefaults.requireDocumentVerification,
        requirePhoneVerification: typeof vendor.requirePhoneVerification === 'boolean' ? vendor.requirePhoneVerification : vendorDefaults.requirePhoneVerification,
        requireEmailVerification: typeof admin.requireEmailVerification === 'boolean' ? admin.requireEmailVerification : vendorDefaults.requireEmailVerification,
        approvalDelay: typeof vendor.approvalDelayHours === 'number' ? vendor.approvalDelayHours : vendorDefaults.approvalDelay,
        maxPendingVendors: typeof vendor.maxPendingVendors === 'number' ? vendor.maxPendingVendors : vendorDefaults.maxPendingVendors
      })
    } catch (error) {
      console.error('❌ loadSettings failed:', error)
      setSettingsError("Impossible de charger les réglages d'approbation.")
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Ne charge la configuration qu'à l'ouverture de l'onglet Configuration.
    if (activeTab !== 'approval-settings') return
    void loadSettings()
  }, [activeTab, loadSettings])

  const handleSaveSettings = useCallback(async () => {
    const result = await runWithLoader(async () => {
      const vendorPayload = {
        autoApproval: approvalSettings.vendorAutoApproval,
        requireDocumentVerification: approvalSettings.requireDocumentVerification,
        requirePhoneVerification: approvalSettings.requirePhoneVerification,
        approvalDelayHours: approvalSettings.approvalDelay,
        maxPendingVendors: approvalSettings.maxPendingVendors
      }
      const adminPayload = {
        autoApproval: approvalSettings.adminAutoApproval,
        requireEmailVerification: approvalSettings.requireEmailVerification
      }
      const vendorResult = await SuperAdminDashboardService.updateSettings('vendor', vendorPayload)
      const adminResult = await SuperAdminDashboardService.updateSettings('admin', adminPayload)
      if (!vendorResult || !adminResult) {
        throw new Error('Synchronisation des réglages échouée')
      }
      return true
    }, {
      successTitle: 'Réglages sauvegardés',
      successMessage: 'Les paramètres d\'approbation ont été mis à jour avec succès.'
    })

    return result
  }, [approvalSettings, runWithLoader])

  // États pour la gestion des rôles
  const [customRoles, setCustomRoles] = useState<ManagedRole[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<SuperAdminPermission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  })

  // États pour les tickets d'assistance
  const [supportTickets, setSupportTickets] = useState<SuperAdminSupportTicket[]>([])
  const [supportLoading, setSupportLoading] = useState(false)
  const [supportError, setSupportError] = useState<string | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [ticketMessages, setTicketMessages] = useState<Record<string, SuperAdminSupportMessage[]>>({})
  const [ticketMessageLoading, setTicketMessageLoading] = useState<string | null>(null)
  const [ticketMessageContent, setTicketMessageContent] = useState('')

  /**
   * Prépare une liste courte d'utilisateurs pour la carte "Permissions par utilisateur".
   */
  const topUsersForPermissions = useMemo(() => users.slice(0, 4), [users])

  /**
   * Trie les rôles personnalisés pour l'affichage de la hiérarchie des rôles.
   */
  const roleHierarchy = useMemo(() => {
    return [...customRoles].sort((a, b) => b.userCount - a.userCount)
  }, [customRoles])

  /**
   * Formate un entier pour l'affichage dans les cartes de synthèse.
   */
  const formatCount = (value: number | undefined) => (typeof value === 'number' ? value.toLocaleString('fr-FR') : '0')

  // États pour le système de filtrage avancé
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>(() =>
    loadFiltersFromStorage(STORAGE_KEY_ADVANCED_FILTERS, createDefaultAdvancedFilters())
  )
  // Fonction utilitaire pour calculer les dates
  const getDateDaysAgo = (days: number): string => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  // Filtres prédéfinis
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() =>
    loadFiltersFromStorage(STORAGE_KEY_SAVED_FILTERS, [])
  )

  const [autoReports, setAutoReports] = useState([
    // ...
    {
      id: 'daily-users',
      name: 'Rapport quotidien des utilisateurs',
      description: 'Synthèse des nouveaux inscrits et des utilisateurs actifs',
      schedule: 'daily' as 'daily' | 'weekly',
      lastRun: 'Jamais exécuté',
      recipients: ['admin@probooster.com'],
      isActive: false
    },
    {
      id: 'weekly-vendors',
      name: 'Rapport hebdomadaire vendeurs',
      description: 'Performance des vendeurs et points de fidélité utilisés',
      schedule: 'weekly' as 'daily' | 'weekly',
      lastRun: 'Jamais exécuté',
      recipients: ['admin@probooster.com'],
      isActive: false
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

  // États pour les analytics et l'historique
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

  const [overviewStats, setOverviewStats] = useState<SuperAdminOverviewStats | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const [recentActivities, setRecentActivities] = useState<SuperAdminActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)

  useEffect(() => {
    // Charge les métriques analytics uniquement pour l'onglet Analytics
    if (activeTab !== 'analytics') return
    let active = true

    const fetchOverviewStats = async () => {
      setAnalyticsLoading(true)
      setAnalyticsError(null)

      try {
        const stats = await SuperAdminDashboardService.getOverviewStats()
        if (active) {
          setOverviewStats(stats)
        }
      } catch (error) {
        console.error('❌ Impossible de charger les statistiques analytics:', error)
        if (active) {
          setAnalyticsError("Impossible de charger les analytics Super Admin pour le moment.")
          setOverviewStats(null)
        }
      } finally {
        if (active) {
          setAnalyticsLoading(false)
        }
      }
    }

    fetchOverviewStats()

    return () => {
      active = false
    }
  }, [activeTab])

  useEffect(() => {
    // Charge les activités récentes uniquement pour l'onglet Analytics
    if (activeTab !== 'analytics') return
    let active = true

    const fetchActivities = async () => {
      setActivitiesLoading(true)
      setActivitiesError(null)

      try {
        const activities = await SuperAdminDashboardService.getRecentActivities(30)
        if (active) {
          setRecentActivities(activities)
        }
      } catch (error) {
        console.error('❌ Impossible de charger les activités récentes:', error)
        if (active) {
          setActivitiesError('Impossible de récupérer les activités récentes pour le moment.')
          setRecentActivities([])
        }
      } finally {
        if (active) {
          setActivitiesLoading(false)
        }
      }
    }

    fetchActivities()

    return () => {
      active = false
    }
  }, [activeTab])

  useEffect(() => {
    // Gérer l'affichage de la barre d'actions en lot
    setShowBulkActions(selectedUsers.size > 0)
  }, [selectedUsers.size])

  useEffect(() => {
    const handleExportClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.export-menu-container')) {
        setShowTopExportMenu(false)
        setShowFilteredExportMenu(false)
        setShowBulkExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleExportClickOutside)
    return () => document.removeEventListener('mousedown', handleExportClickOutside)
  }, [])

  useEffect(() => {
    const handleMenuClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu-container')) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleMenuClickOutside)
    return () => document.removeEventListener('mousedown', handleMenuClickOutside)
  }, [])

  /**
   * Charge la liste des utilisateurs.
   * @param options Permet de désactiver le spinner lorsqu'on fait un refresh en arrière-plan.
   */
  const loadUsers = useCallback(async (options?: { showSpinner?: boolean }) => {
    const showSpinner = options?.showSpinner ?? true
    if (showSpinner) {
      setIsLoading(true)
    }
    setLoadError(null)

    try {
      const data = await SuperAdminDashboardService.getUsers({ limit: 200 })

      const extended = normalizeUsersForUi(data)
      setUsers(extended)
      setFilteredUsers(extended)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs super admin:', error)
      if (!usersRef.current || usersRef.current.length === 0) {
        setLoadError("Impossible de charger les utilisateurs. Veuillez réessayer plus tard.")
        setUsers([])
        setFilteredUsers([])
      }
    } finally {
      if (showSpinner) {
        setIsLoading(false)
      }
    }
  }, [normalizeUsersForUi])

  useEffect(() => {
    const seeded = Array.isArray(prefetchedUsers) && prefetchedUsers.length > 0

    if (seeded) {
      const extended = normalizeUsersForUi(prefetchedUsers)
      setUsers(extended)
      setFilteredUsers(extended)
    }

    // Si on a du préchargé, on fait un refresh silencieux en arrière-plan.
    // Sinon on charge normalement avec spinner.
    if (seeded) {
      setTimeout(() => {
        void loadUsers({ showSpinner: false })
      }, 0)
    } else {
      void loadUsers({ showSpinner: true })
    }
  }, [loadUsers, normalizeUsersForUi, prefetchedUsers])

  const loadRoles = useCallback(async () => {
    setRolesLoading(true)
    setRolesError(null)

    try {
      const [roles, perms] = await Promise.all([
        SuperAdminDashboardService.getRoles(),
        SuperAdminDashboardService.getPermissions()
      ])

      setPermissions(perms ?? [])

      const mapped: ManagedRole[] = (roles ?? []).map((role: SuperAdminRole) => ({
        id: role.id,
        name: role.name,
        description: role.description ?? '',
        permissions: [],
        userCount: role.userCount,
        isActive: role.isActive,
        createdAt: role.createdAt
      }))

      setCustomRoles(mapped)
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error)
      setRolesError("Impossible de charger les rôles Supabase.")
      setCustomRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [])

  useEffect(() => {
    // Ne charge les rôles/permissions que si l'utilisateur ouvre les onglets concernés.
    if (activeTab !== 'role-management' && activeTab !== 'permissions') return
    void loadRoles()
  }, [activeTab, loadRoles])

  const loadSupportTickets = useCallback(async () => {
    setSupportLoading(true)
    setSupportError(null)

    try {
      const tickets = await SuperAdminDashboardService.getSupportTickets()
      setSupportTickets(tickets ?? [])
    } catch (error) {
      console.error('Erreur lors du chargement des tickets support:', error)
      setSupportError("Impossible de charger les tickets d'assistance.")
      setSupportTickets([])
    } finally {
      setSupportLoading(false)
    }
  }, [])

  /**
   * Charge les messages d'un ticket depuis l'API et met à jour l'état local.
   * @param ticketId Identifiant du ticket à charger
   */
  const fetchTicketMessages = useCallback(async (ticketId: string) => {
    setTicketMessageLoading(ticketId)
    try {
      const messages = await SuperAdminDashboardService.getSupportTicketMessages(ticketId)
      setTicketMessages((prev) => ({ ...prev, [ticketId]: messages ?? [] }))
    } catch (error) {
      console.error('Erreur lors du chargement des messages du ticket:', error)
      setSupportError("Impossible de charger les messages du ticket sélectionné.")
      setTicketMessages((prev) => ({ ...prev, [ticketId]: [] }))
    } finally {
      setTicketMessageLoading(null)
    }
  }, [])

  /**
   * Ajoute un message interne au ticket et met à jour l'état local.
   * @param ticketId Identifiant du ticket cible
   */
  const handleAddTicketMessage = async (ticketId: string) => {
    const content = ticketMessageContent.trim()
    if (!content) return

    setTicketMessageLoading(ticketId)
    try {
      const created = await SuperAdminDashboardService.addSupportTicketMessage(ticketId, content, 'internal')
      if (created) {
        setTicketMessages((prev) => ({
          ...prev,
          [ticketId]: [ ...(prev[ticketId] ?? []), created ]
        }))
        setTicketMessageContent('')
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du message du ticket:", error)
      setSupportError("Impossible d'ajouter le message au ticket.")
    } finally {
      setTicketMessageLoading(null)
    }
  }

  useEffect(() => {
    // Ne charge l'assistance que lorsqu'on ouvre l'onglet Assistance.
    if (activeTab !== 'assistance') return
    void loadSupportTickets()
  }, [activeTab, loadSupportTickets])

  // Filtrage des utilisateurs
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone ?? '').includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
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
      filtered = filtered.filter(user => {
        if (user.productsShared === undefined || user.productsShared === null) return false
        return user.productsShared >= advancedFilters.productsSharedRange.min &&
          user.productsShared <= advancedFilters.productsSharedRange.max
      })
    }

    if (advancedFilters.ordersRange.min > 0 || advancedFilters.ordersRange.max < 1000) {
      filtered = filtered.filter(user => 
        user.totalOrders >= advancedFilters.ordersRange.min &&
        user.totalOrders <= advancedFilters.ordersRange.max
      )
    }

    if (advancedFilters.productsReturnedRange.min > 0 || advancedFilters.productsReturnedRange.max < 100) {
      filtered = filtered.filter(user => {
        if (user.productsReturned === undefined || user.productsReturned === null) return false
        return user.productsReturned >= advancedFilters.productsReturnedRange.min &&
          user.productsReturned <= advancedFilters.productsReturnedRange.max
      })
    }

    if (advancedFilters.reportsFiledRange.min > 0 || advancedFilters.reportsFiledRange.max < 50) {
      filtered = filtered.filter(user => {
        if (user.reportsFiled === undefined || user.reportsFiled === null) return false
        return user.reportsFiled >= advancedFilters.reportsFiledRange.min &&
          user.reportsFiled <= advancedFilters.reportsFiledRange.max
      })
    }

    if (advancedFilters.reportsReceivedRange.min > 0 || advancedFilters.reportsReceivedRange.max < 50) {
      filtered = filtered.filter(user => {
        if (user.reportsReceived === undefined || user.reportsReceived === null) return false
        return user.reportsReceived >= advancedFilters.reportsReceivedRange.min &&
          user.reportsReceived <= advancedFilters.reportsReceivedRange.max
      })
    }

    if (advancedFilters.totalSalesRange.min > 0 || advancedFilters.totalSalesRange.max < 10000000) {
      filtered = filtered.filter(user => {
        if (user.totalSales === undefined || user.totalSales === null) return false
        return user.totalSales >= advancedFilters.totalSalesRange.min &&
          user.totalSales <= advancedFilters.totalSalesRange.max
      })
    }

    if (advancedFilters.boostServicesRange.min > 0 || advancedFilters.boostServicesRange.max < 100) {
      filtered = filtered.filter(user => {
        if (user.boostServices === undefined || user.boostServices === null) return false
        return user.boostServices >= advancedFilters.boostServicesRange.min &&
          user.boostServices <= advancedFilters.boostServicesRange.max
      })
    }

    if (advancedFilters.promotionsUsedRange.min > 0 || advancedFilters.promotionsUsedRange.max < 100) {
      filtered = filtered.filter(user => {
        if (user.promotionsUsed === undefined || user.promotionsUsed === null) return false
        return user.promotionsUsed >= advancedFilters.promotionsUsedRange.min &&
          user.promotionsUsed <= advancedFilters.promotionsUsedRange.max
      })
    }

    if (advancedFilters.shopProductsRange.min > 0 || advancedFilters.shopProductsRange.max < 1000) {
      filtered = filtered.filter(user => {
        if (user.shopProducts === undefined || user.shopProducts === null) return false
        return user.shopProducts >= advancedFilters.shopProductsRange.min &&
          user.shopProducts <= advancedFilters.shopProductsRange.max
      })
    }

    // Filtres par comportement
    if (advancedFilters.profileCompletionRange.min > 0 || advancedFilters.profileCompletionRange.max < 100) {
      filtered = filtered.filter(user => {
        if (user.profileCompletion === undefined || user.profileCompletion === null) return false
        return user.profileCompletion >= advancedFilters.profileCompletionRange.min &&
          user.profileCompletion <= advancedFilters.profileCompletionRange.max
      })
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
    const synced = mergeAdvancedFilters(createDefaultAdvancedFilters(), filter.filters)
    setAdvancedFilters(synced)
    setActiveFilterName(filter.name)
    applyAdvancedFilters()
  }

  // Réinitialiser tous les filtres
  const resetAllFilters = () => {
    const defaults = createDefaultAdvancedFilters()
    setAdvancedFilters(defaults)
    saveFiltersToStorage(STORAGE_KEY_ADVANCED_FILTERS, defaults)
    setActiveFilterName('')
    setSearchTerm('')
    setStatusFilter('all')
    setRoleFilter('all')
    setSelectedFilteredUsers(new Set())
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

    const data = filteredResults.map((user) => ({
      ID: user.id,
      Nom: user.name,
      Email: user.email,
      Téléphone: user.phone ?? '',
      Rôle: user.role,
      Statut: user.status,
      "Date d'inscription": user.joinDate,
      "Dernière activité": user.lastActive ?? '',
      "Commandes totales": user.totalOrders,
      "Total dépensé": user.totalSpent,
      'Points fidélité': user.loyaltyPoints ?? '',
      'Produits partagés': user.productsShared ?? '',
      'Produits retournés': user.productsReturned ?? '',
      'Signalements déposés': user.reportsFiled ?? '',
      'Signalements reçus': user.reportsReceived ?? '',
      'Ventes totales': user.totalSales ?? '',
      'Services de boostage': user.boostServices ?? '',
      'Promotions utilisées': user.promotionsUsed ?? '',
      'Produits en boutique': user.shopProducts ?? '',
      'Complétion profil': user.profileCompletion ?? '',
      "Score d'engagement": user.engagementScore ?? '',
      'Valeur moyenne commande': user.averageOrderValue ?? '',
      'Valeur client': user.customerLifetimeValue ?? '',
      'Risque de churn': user.churnRisk ?? 'N/A',
      "Niveau d'activité": user.activityLevel ?? 'N/A',
      Localisation: user.location ?? '',
      Vérifié: user.isVerified ? 'Oui' : 'Non',
      '2FA activé': user.has2FA ? 'Oui' : 'Non'
    }))

    if (format === 'csv') {
      try {
        const headers = Object.keys(data[0]).join(',')
        const rows = data.map((row) =>
          Object.values(row)
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(',')
        )

        const csvContent = [headers, ...rows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        const fileName = `utilisateurs_filtres_${new Date().toISOString().split('T')[0]}.csv`

        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        console.log(`Export CSV réussi : ${filteredResults.length} utilisateur(s) filtré(s)`)
      } catch (error) {
        console.error('Erreur lors de l\'export CSV:', error)
      }
      return
    }

    if (format === 'excel') {
      try {
        const headers = Object.keys(data[0]).join('\t')
        const rows = data.map((row) =>
          Object.values(row)
            .map((value) => {
              const stringValue = String(value ?? '')
              if (stringValue.includes('\t') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`
              }
              return stringValue
            })
            .join('\t')
        )

        const tsvContent = [headers, ...rows].join('\n')
        const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        const fileName = `utilisateurs_filtres_${new Date().toISOString().split('T')[0]}.xls`

        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        console.log(`Export Excel réussi : ${filteredResults.length} utilisateur(s) filtré(s)`)
      } catch (error) {
        console.error('Erreur lors de l\'export Excel:', error)
      }
      return
    }

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
          <h1>Rapport Utilisateurs Filtrés</h1>
          <p>Généré le: ${new Date().toLocaleString('fr-FR')}</p>
          <p>Nombre d'utilisateurs: ${filteredResults.length}</p>
          <table>
            <thead>
              <tr>${Object.keys(data[0]).map((key) => `<th>${key}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) =>
                    `<tr>${Object.values(row)
                      .map((value) => `<td>${value}</td>`)
                      .join('')}</tr>`
                )
                .join('')}
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
    const newFilterState = cloneAdvancedFilters(advancedFilters)
    const newFilter = {
      id: Date.now().toString(),
      name,
      description,
      filters: mergeAdvancedFilters(createDefaultAdvancedFilters(), newFilterState),
      createdAt: new Date().toISOString().split('T')[0]
    }

    setSavedFilters(prev => {
      const next = [...prev, newFilter]
      saveFiltersToStorage(STORAGE_KEY_SAVED_FILTERS, next)
      return next
    })
    alert(`Filtre "${name}" sauvegardé avec succès !`)
  }

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'client',
      type: 'buyer',
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
    setSelectedRoles(new Set(['client']))
    setCustomPermissions(new Set())
  }

  const refreshUsers = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const data = await SuperAdminDashboardService.getUsers({ limit: 200 })

      const extended: ExtendedUser[] = data.map((user) => ({
        ...user,
        avatar: user.avatar ?? undefined,
        socialMedia: {
          facebook: (user.socialMedia as Record<string, any> | undefined)?.facebook ?? '',
          twitter: (user.socialMedia as Record<string, any> | undefined)?.twitter ?? '',
          linkedin: (user.socialMedia as Record<string, any> | undefined)?.linkedin ?? '',
          instagram: (user.socialMedia as Record<string, any> | undefined)?.instagram ?? '',
          whatsapp: (user.socialMedia as Record<string, any> | undefined)?.whatsapp ?? ''
        },
        preferences: {
          language: (user.preferences as Record<string, any> | undefined)?.language ?? 'fr',
          timezone: (user.preferences as Record<string, any> | undefined)?.timezone ?? 'Africa/Abidjan',
          notifications: {
            email: Boolean((user.preferences as any)?.notifications?.email ?? true),
            sms: Boolean((user.preferences as any)?.notifications?.sms ?? true),
            push: Boolean((user.preferences as any)?.notifications?.push ?? true)
          }
        },
        security: {
          twoFactorEnabled: user.securitySettings?.twoFactorEnabled ?? user.has2FA ?? false,
          loginNotifications: user.securitySettings?.loginNotifications ?? true,
          sessionTimeout: user.securitySettings?.sessionTimeout ?? 30
        },
        secondaryRoles: Array.isArray(user.secondaryRoles) ? user.secondaryRoles : [],
        customPermissions: Array.isArray(user.customPermissions) ? user.customPermissions : [],
        features: Array.isArray(user.features)
          ? user.features.map((feature) => ({
              code: feature.code,
              scope: feature.scope,
              enabled: feature.enabled ?? true
            }))
          : []
      }))
      setUsers(extended)
      setFilteredUsers(extended)
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des utilisateurs:', error)
      setLoadError("Impossible de rafraîchir les utilisateurs. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCreateUser = async () => {
    if (actionLoading) {
      return
    }

    setActionError(null)
    const created = await runWithLoader(async () => {
      const payload: CreateSuperAdminUserInput = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        secondaryRoles: Array.from(selectedRoles).filter((role) => role !== userForm.role),
        customPermissions: Array.from(customPermissions),
        features: selectedFeatures.map((code) => ({ code, scope: userForm.role, enabled: true })),
        type: userForm.type,
        location: userForm.location,
        password: userForm.password || undefined,
        loyaltyPoints: userForm.loyaltyPoints,
        isVerified: userForm.security.twoFactorEnabled,
        has2FA: userForm.security.twoFactorEnabled,
        preferences: userForm.preferences,
        security: userForm.security,
        socialMedia: userForm.socialMedia,
        bio: userForm.bio,
        website: userForm.website,
        avatar: userForm.avatar
      }

      const response = await SuperAdminDashboardService.createUser(payload)
      if (!response || (response as any)?.error) {
        const msg = (response as any)?.error?.message || 'Création utilisateur échouée'
        throw new Error(msg)
      }
      return response
    })

    if (!created) {
      const causeMsg = lastActionErrorRef.current || actionError
      if (causeMsg) {
        addNotification({
          type: 'error',
          title: "Cause de l'échec",
          message: causeMsg
        })
        lastActionErrorRef.current = null
      }
      addNotification({
        type: 'error',
        title: 'Création échouée',
        message: "La création de l'utilisateur a échoué."
      })
      return
    }

    // Forcer le nom exact sans suffixe/branding non désiré
    try {
      if (created.id && created.name !== userForm.name) {
        await SuperAdminDashboardService.updateUser({ id: created.id, name: userForm.name })
      }
    } catch (e) {
      console.warn('Impossible de forcer le nom exact après création.', e)
    }

    await refreshUsers()
    setIsCreateModalOpen(false)
    setActionError(null)
    resetUserForm()
    addNotification({
      type: 'success',
      title: 'Utilisateur créé',
      message: `${userForm.name || created.email || 'Compte'} a été ajouté avec succès.`
    })
    console.log('✅ Utilisateur créé via Supabase:', created.name)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)

    // Initialiser le formulaire avec les données de l'utilisateur

    const preferences = user.preferences ?? {
      language: 'fr',
      timezone: 'Africa/Abidjan',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    }

    const security = user.securitySettings ?? {
      twoFactorEnabled: user.has2FA ?? false,
      loginNotifications: true,
      sessionTimeout: 30
    }

    setUserForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone ?? '',
      role: user.role,
      type: user.type,
      location: user.location ?? '',
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
      preferences,
      security
    })

    const secondaryRoles = Array.isArray(user.secondaryRoles) ? user.secondaryRoles : []
    setSelectedRoles(new Set([user.role, ...secondaryRoles]))

    const features = Array.isArray(user.features) ? user.features : []
    setSelectedFeatures(features.map((feature) => feature.code))

    const permissions = Array.isArray(user.customPermissions) ? user.customPermissions : []
    setCustomPermissions(new Set(permissions))
    
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    const updated = await runWithLoader(async () => {
      const response = await SuperAdminDashboardService.updateUser({
        id: selectedUser.id,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        secondaryRoles: Array.from(selectedRoles).filter((role) => role !== userForm.role),
        customPermissions: Array.from(customPermissions),
        features: selectedFeatures.map((code) => ({ code, scope: userForm.role, enabled: true })),
        type: userForm.type,
        location: userForm.location,
        loyaltyPoints: userForm.loyaltyPoints,
        isVerified: userForm.security.twoFactorEnabled,
        has2FA: userForm.security.twoFactorEnabled,
        preferences: userForm.preferences,
        security: userForm.security,
        socialMedia: userForm.socialMedia,
        bio: userForm.bio,
        website: userForm.website,
        avatar: userForm.avatar
      })
      if (!response || (response as any)?.error) {
        const msg = (response as any)?.error?.message || 'Mise à jour utilisateur échouée'
        throw new Error(msg)
      }
      return response
    })

    if (!updated) {
      const causeMsg = lastActionErrorRef.current || actionError
      if (causeMsg) {
        addNotification({
          type: 'error',
          title: "Cause de l'échec",
          message: causeMsg
        })
        lastActionErrorRef.current = null
      }
      addNotification({
        type: 'error',
        title: 'Mise à jour échouée',
        message: "La mise à jour de l'utilisateur a échoué."
      })
      return
    }

    await refreshUsers()
    setIsEditModalOpen(false)
    console.log('✅ Utilisateur mis à jour via Supabase:', updated.name)
  }

  // Gestion centralisée de la confirmation moderne
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    resolve?: (result: boolean) => void
  }>({ open: false, title: 'Confirmation', message: '', confirmText: 'Confirmer', cancelText: 'Annuler' })

  const openConfirm = (message: string, options?: { title?: string; confirmText?: string; cancelText?: string }) => {
    return new Promise<boolean>((resolve) => {
      setConfirmDialog({
        open: true,
        title: options?.title ?? 'Confirmation',
        message,
        confirmText: options?.confirmText ?? 'Confirmer',
        cancelText: options?.cancelText ?? 'Annuler',
        resolve
      })
    })
  }

  const resolveConfirm = (result: boolean) => {
    setConfirmDialog((prev) => {
      const resolver = prev.resolve
      // Ferme le dialog avant de résoudre pour garder l'UI fluide
      setTimeout(() => resolver?.(result), 0)
      return { ...prev, open: false, resolve: undefined }
    })
  }

  /**
   * Gère la fermeture du modal de confirmation (click outside / escape).
   * Évite les boucles de rendu en ne déclenchant la résolution que si le dialog était ouvert.
   */
  const handleConfirmOpenChange = useCallback((open: boolean) => {
    if (open) return
    setConfirmDialog((prev) => {
      if (!prev.open) {
        return prev
      }
      const resolver = prev.resolve
      setTimeout(() => resolver?.(false), 0)
      return { ...prev, open: false, resolve: undefined }
    })
  }, [])

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await openConfirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')
    if (!confirmed) return

    const success = await runWithLoader(async () => {
      const response = await SuperAdminDashboardService.deleteUser(userId)
      if (!response) {
        throw new Error('Suppression utilisateur échouée')
      }
      return response
    })

    if (!success) {
      return
    }

    await refreshUsers()
    addNotification({
      type: 'success',
      title: 'Utilisateur supprimé',
      message: 'Le compte a été supprimé avec succès.'
    })
    console.log('🗑️ Utilisateur supprimé via Supabase:', userId)
  }

  const handleStatusChange = async (userId: string, newStatus: User['status']) => {
    const success = await runWithLoader(async () => {
      const response = await SuperAdminDashboardService.updateUserStatus(userId, newStatus)
      if (!response) {
        throw new Error('Mise à jour statut échouée')
      }
      return response
    })

    if (!success) {
      return
    }

    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  /**
   * Approuve un vendeur: passe son statut à 'verified' côté API puis met à jour l'état local.
   */
  const handleApproveVendor = async (userId: string) => {
    const success = await runWithLoader(async () => {
      const response = await SuperAdminDashboardService.updateUserStatus(userId, 'verified')
      if (!response) {
        throw new Error('Approbation vendeur échouée')
      }
      return response
    }, {
      successTitle: 'Vendeur approuvé',
      successMessage: "Le vendeur a été approuvé."
    })

    if (!success) {
      return
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'verified' } : u))
  }

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    const success = await runWithLoader(async () => {
      const response = await SuperAdminDashboardService.updateUserRole(userId, newRole)
      if (!response) {
        throw new Error('Mise à jour rôle échouée')
      }
      return response
    })

    if (!success) {
      return
    }

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
  const handleBulkAction = async (action: string) => {
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
      case 'delete': {
        const confirmed = await openConfirm(`Êtes-vous sûr de vouloir supprimer ${usersToProcess.length} utilisateur(s) ?`)
        if (confirmed) {
          usersToProcess.forEach(user => handleDeleteUser(user.id))
        }
        break
      }
    }
    
    clearSelection()
  }

  // Fonctions d'export multi-format
  const exportToCSV = (usersToExport: User[]) => {
    try {
      const exportData = usersToExport.map((user) => ({
        ID: user.id,
        Nom: user.name,
        Email: user.email,
        Téléphone: user.phone ?? '',
        Rôle:
          user.role === 'client'
            ? 'Acheteur'
            : user.role === 'vendor'
            ? 'Vendeur'
            : user.role === 'driver'
            ? 'Livreur'
            : user.role === 'ops'
            ? 'Service commandes & livraisons'
            : user.role === 'admin'
            ? 'Administrateur'
            : 'Super Admin',
        Statut:
          user.status === 'active'
            ? 'Actif'
            : user.status === 'inactive'
            ? 'Inactif'
            : user.status === 'pending'
            ? 'En attente'
            : user.status === 'suspended'
            ? 'Suspendu'
            : user.status === 'verified'
            ? 'Vérifié'
            : 'Inconnu',
        Type:
          user.type === 'buyer'
            ? 'Acheteur'
            : user.type === 'vendor'
            ? 'Vendeur'
            : 'Administrateur',
        'Date inscription': user.joinDate,
        'Dernière activité': user.lastActive ?? '',
        'Total commandes': user.totalOrders,
        'Total dépensé': formatMoney(Number(user.totalSpent ?? 0)),
        'Total gains': formatMoney(Number(user.totalEarnings ?? 0)),
        Note: `${user.rating}/5`,
        Vérifié: user.isVerified ? 'Oui' : 'Non',
        '2FA activé': user.has2FA ? 'Oui' : 'Non',
        Localisation: user.location ?? ''
      }))

      const headers = Object.keys(exportData[0]).join(',')
      const rows = exportData.map((row) =>
        Object.values(row)
          .map((value) => {
            const stringValue = String(value)
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(',')
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

  /**
   * Exporte les utilisateurs au format Excel (.xls) sans dépendance externe.
   * Implémentation basée sur un tableau HTML encapsulé avec le type MIME Excel.
   * Remarque: Excel ouvre correctement ce format. Pour un vrai .xlsx, prévoir la lib 'xlsx'.
   */
  const exportToExcel = (usersToExport: User[]) => {
    try {
      if (usersToExport.length === 0) {
        console.log('Aucun utilisateur à exporter (Excel)')
        return
      }

      const headers = [
        'ID', 'Nom', 'Email', 'Téléphone', 'Statut', 'Rôle', 'Type', 'Date inscription',
        'Dernière activité', 'Total commandes', 'Total dépensé', 'Total gains',
        'Note', 'Vérifié', '2FA activé', 'Localisation'
      ]

      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')

      const rowsHtml = usersToExport.map((user) => {
        const cells = [
          user.id,
          user.name ?? '',
          user.email ?? '',
          user.phone ?? '',
          user.status ?? '',
          (user.role === 'client' ? 'Acheteur' : user.role === 'vendor' ? 'Vendeur' : 'Administrateur'),
          user.type ?? '',
          user.joinDate ?? '',
          user.lastActive ?? '',
          String(user.totalOrders ?? ''),
          formatMoney(Number(user.totalSpent ?? 0)),
          formatMoney(Number(user.totalEarnings ?? 0)),
          `${user.rating ?? 0}/5`,
          user.isVerified ? 'Oui' : 'Non',
          user.has2FA ? 'Oui' : 'Non',
          user.location ?? ''
        ]
          .map((v) => `<td>${escapeHtml(String(v))}</td>`) 
          .join('')

        return `<tr>${cells}</tr>`
      }).join('')

      const headerHtml = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
      const table = `
        <table border="1">
          <thead>${headerHtml}</thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>${table}</body></html>`
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' })

      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      const fileName = selectedUsers.size > 0
        ? `utilisateurs_selectionnes_export_${new Date().toISOString().split('T')[0]}.xls`
        : `utilisateurs_export_${new Date().toISOString().split('T')[0]}.xls`

      link.href = url
      link.download = fileName
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

  /**
   * Exporte les utilisateurs filtrés ou sélectionnés dans le format demandé.
   */
  const exportUsersMultiFormat = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const usersToExport = selectedUsers.size > 0
        ? filteredUsers.filter((user) => selectedUsers.has(user.id))
        : filteredUsers

      if (usersToExport.length === 0) {
        console.log('Aucun utilisateur à exporter')
        return
      }

      switch (format) {
        case 'csv':
          exportToCSV(usersToExport)
          break
        case 'excel':
          exportToExcel(usersToExport)
          break
        case 'pdf':
          exportToPDF(usersToExport)
          break
        default:
          exportToCSV(usersToExport)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  /**
   * Exporte uniquement les utilisateurs sélectionnés, peu importe l'état global.
   */
  const exportSelectedUsersMultiFormat = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const usersToExport = filteredUsers.filter((user) => selectedUsers.has(user.id))
      if (usersToExport.length === 0) {
        console.log('Aucun utilisateur sélectionné à exporter')
        return
      }
      switch (format) {
        case 'csv':
          exportToCSV(usersToExport)
          break
        case 'excel':
          exportToExcel(usersToExport)
          break
        case 'pdf':
          exportToPDF(usersToExport)
          break
        default:
          exportToCSV(usersToExport)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export de la sélection:', error)
    }
  }

  /**
   * Exporte toujours l'ensemble des utilisateurs filtrés, en ignorant toute sélection active.
   */
  const exportAllFilteredUsersMultiFormat = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const usersToExport = filteredUsers
      if (usersToExport.length === 0) {
        console.log('Aucun utilisateur filtré à exporter')
        return
      }
      switch (format) {
        case 'csv':
          exportToCSV(usersToExport)
          break
        case 'excel':
          exportToExcel(usersToExport)
          break
        case 'pdf':
          exportToPDF(usersToExport)
          break
        default:
          exportToCSV(usersToExport)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export des résultats filtrés:', error)
    }
  }

  /**
   * Ouvre ou ferme le menu contextuel associé à un utilisateur.
   */
  const handleMenuToggle = (userId: string) => {
    setOpenMenuId((current) => (current === userId ? null : userId))
  }

  /**
   * Duplique un utilisateur côté API puis met à jour la liste locale.
   */
  const handleDuplicateUser = async (source: User) => {
    const confirmed = await openConfirm(
      `Êtes-vous sûr de vouloir dupliquer le compte "${source.name}" ?`,
      { title: 'Confirmer la duplication', confirmText: 'Dupliquer', cancelText: 'Annuler' }
    )
    if (!confirmed) return

    const duplicated = await runWithLoader(async () => {
      const result = await SuperAdminDashboardService.duplicateUser(source.id)
      if (!result) {
        throw new Error('Duplication utilisateur échouée')
      }
      return result
    }, {
      successTitle: 'Utilisateur dupliqué',
      successMessage: `${source.name} copié avec succès.`
    })

    if (!duplicated) {
      return
    }

    await refreshUsers()
  }

  /**
   * Envoie un lien de réinitialisation de mot de passe pour l'utilisateur ciblé.
   * Utilise AuthContext.sendPasswordReset sur l'adresse e-mail de l'utilisateur.
   */
  const handleSendPasswordResetLink = async (userId: string) => {
    const target = users.find((u) => u.id === userId)
    if (!target?.email) {
      addNotification({
        type: 'error',
        title: 'E-mail introuvable',
        message: "Adresse e-mail manquante pour cet utilisateur."
      })
      return
    }

    await runWithLoader(async () => {
      const { error } = await sendPasswordReset(target.email)
      if (error) {
        throw new Error(error.message || 'Envoi du lien de réinitialisation échoué')
      }
      return true
    }, {
      successTitle: 'Lien de réinitialisation envoyé',
      successMessage: `Un e-mail a été envoyé à ${target.email}.`
    })
  }

  /**
   * Exécute l'action choisie dans le menu contextuel (duplication, statut, email, etc.).
   */
  const handleMenuAction = (userId: string, action: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) {
      return
    }

    switch (action) {
      case 'duplicate': {
        void handleDuplicateUser(user)
        break
      }
      case 'activate':
        void handleStatusChange(userId, 'active')
        break
      case 'deactivate':
        void handleStatusChange(userId, 'inactive')
        break
      case 'suspend':
        void handleStatusChange(userId, 'suspended')
        break
      case 'verify':
        void handleStatusChange(userId, 'verified')
        break
      case 'reset-password':
        void handleSendPasswordResetLink(userId)
        break
      case 'send-email': {
        const subject = encodeURIComponent('Message de la plateforme')
        const body = encodeURIComponent(`Bonjour ${user.name},\n\nCeci est un message de la plateforme.`)
        window.open(`mailto:${user.email}?subject=${subject}&body=${body}`)
        break
      }
      case 'block':
        void handleStatusChange(userId, 'suspended')
        break
      case 'unblock':
        void handleStatusChange(userId, 'active')
        break
      case 'approve-vendor':
        void handleApproveVendor(userId)
        break
      case 'delete':
        void handleDeleteUser(userId)
        break
      default:
        console.warn(`Action de menu inconnue: ${action}`)
    }

    setOpenMenuId(null)
  }

  /**
   * Active/désactive une fonctionnalité pour l'utilisateur en cours d'édition.
   */
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    )
  }

  /**
   * Met à jour le rôle principal du formulaire et réinitialise les fonctionnalités sélectionnées.
   */
  const handleFormRoleChange = (newRole: User['role']) => {
    setUserForm((prev) => {
      const nextType: User['type'] =
        newRole === 'vendor'
          ? 'vendor'
          : newRole === 'admin' || newRole === 'super_admin' || newRole === 'driver' || newRole === 'ops'
          ? 'admin'
          : 'buyer'

      return {
        ...prev,
        role: newRole,
        type: nextType
      }
    })

    setSelectedRoles((prev) => {
      const next = new Set(prev)
      next.add(newRole)
      return next
    })
    setSelectedFeatures([])
  }

  /**
   * Ajoute ou retire un rôle secondaire dans la sélection multiple.
   */
  const handleRoleToggle = (role: User['role']) => {
    const updatedRoles = new Set(selectedRoles)
    if (updatedRoles.has(role)) {
      updatedRoles.delete(role)
    } else {
      updatedRoles.add(role)
    }
    setSelectedRoles(updatedRoles)

    if (updatedRoles.size > 0) {
      setUserForm((prev) => ({ ...prev, role: Array.from(updatedRoles)[0] }))
    }

    applyRolePermissions(updatedRoles)
  }

  /**
   * Applique automatiquement les permissions liées aux rôles sélectionnés.
   */
  const applyRolePermissions = useCallback(
    (roles: Set<User['role']>) => {
      const permissionsSet = new Set<string>()
      roles.forEach((role) => {
        const groups = roleFeatures[role]
        if (!groups) {
          return
        }
        Object.values(groups).forEach((features) => {
          if (Array.isArray(features)) {
            features.forEach((feature) => permissionsSet.add(feature))
          }
        })
      })
      setSelectedFeatures(Array.from(permissionsSet))
    },
    [roleFeatures]
  )

  /**
   * Active/désactive une permission personnalisée pour l'utilisateur.
   */
  const handleCustomPermissionToggle = (permission: string) => {
    const updated = new Set(customPermissions)
    if (updated.has(permission)) {
      updated.delete(permission)
    } else {
      updated.add(permission)
    }
    setCustomPermissions(updated)
  }

  /**
   * Téléverse un avatar et l'enregistre dans le formulaire.
   */
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setUserForm((prev) => ({ ...prev, avatar: (e.target?.result as string) ?? prev.avatar }))
    }
    reader.readAsDataURL(file)
  }

  /**
   * Déclenche le sélecteur de fichiers pour l'avatar.
   */
  const handleAvatarButtonClick = () => {
    avatarInputRef.current?.click()
  }

  /**
   * Génère un avatar par défaut basé sur les initiales.
   */
  const generateDefaultAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2)

    const palette = ['#ff6600', '#535455', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    const color = palette[Math.floor(Math.random() * palette.length)]

    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
        <rect width="128" height="128" rx="16" fill="${color}" />
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
          font-family="Inter, Arial" font-size="48" fill="#ffffff">
          ${initials || 'U'}
        </text>
      </svg>
    `)}`
  }

  /**
   * Crée un rôle personnalisé localement (mock) en attendant la persistance backend.
   */
  const handleCreateRole = () => {
    if (!roleForm.name.trim()) {
      return
    }

    const newRole: ManagedRole = {
      id: Date.now().toString(),
      name: roleForm.name.trim(),
      description: roleForm.description.trim(),
      permissions: roleForm.permissions,
      userCount: 0,
      isActive: roleForm.isActive,
      createdAt: new Date().toISOString().split('T')[0]
    }

    setCustomRoles((prev) => [...prev, newRole])
    setRoleForm({ name: '', description: '', permissions: [], isActive: true })
    setIsRoleModalOpen(false)
    console.log('🆕 Rôle créé (mock):', newRole)
  }

  /**
   * Pré-remplit le formulaire pour éditer un rôle existant.
   */
  const handleEditRole = (role: ManagedRole) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive
    })
    setIsRoleModalOpen(true)
  }

  /**
   * Applique les modifications du formulaire sur le rôle sélectionné.
   */
  const handleUpdateRole = () => {
    if (!editingRole || !roleForm.name.trim()) {
      return
    }

    setCustomRoles((prev) =>
      prev.map((role) =>
        role.id === editingRole.id
          ? {
              ...role,
              name: roleForm.name.trim(),
              description: roleForm.description.trim(),
              permissions: roleForm.permissions,
              isActive: roleForm.isActive
            }
          : role
      )
    )

    console.log('✏️ Rôle mis à jour (mock):', editingRole.id)
    setEditingRole(null)
    setRoleForm({ name: '', description: '', permissions: [], isActive: true })
    setIsRoleModalOpen(false)
  }

  /**
   * Supprime le rôle donné (mock, sans backend).
   */
  const handleDeleteRole = async (roleId: string) => {
    const confirmed = await openConfirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')
    if (!confirmed) return

    setCustomRoles((prev) => prev.filter((role) => role.id !== roleId))
    console.log('🗑️ Rôle supprimé (mock):', roleId)
  }

  /**
   * Ajoute ou retire une permission du formulaire de rôle.
   */
  const togglePermission = (permission: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((value) => value !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const handleAssignRoleToUser = async (userId: string, roleId: string) => {
    const success = await runWithLoader(async () => {
      const response = await SuperAdminDashboardService.assignRoleToUser(userId, roleId)
      if (!response) {
        throw new Error('Assignation rôle utilisaiteur échouée')
      }
      return response
    })

    if (!success) {
      return
    }

    console.log(`Rôle ${roleId} assigné à l'utilisateur ${userId}`)
  }

  const handleRemoveRoleFromUser = async (userId: string, roleId: string) => {
    const success = await runWithLoader(async () => {
      const response = await SuperAdminDashboardService.removeRoleFromUser(userId, roleId)
      if (!response) {
        throw new Error('Retrait rôle utilisateur échoué')
      }
      return response
    })

    if (!success) {
      return
    }

    console.log(`Rôle ${roleId} retiré de l'utilisateur ${userId}`)
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
      buyers: users.filter(u => u.role === 'client').length,
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
      <Dialog open={confirmDialog.open} onOpenChange={handleConfirmOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => resolveConfirm(false)}>
              {confirmDialog.cancelText}
            </Button>
            <Button className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white" onClick={() => resolveConfirm(true)}>
              {confirmDialog.confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTopExportMenu(!showTopExportMenu)}
                      className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter (tous les filtrés)
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Exporter tous les utilisateurs filtrés (CSV, Excel, PDF)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {showTopExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportAllFilteredUsersMultiFormat('csv')
                        setShowTopExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 text-[#ff6600]" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        exportAllFilteredUsersMultiFormat('excel')
                        setShowTopExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 text-[#ff6600]" />
                      Export Excel
                    </button>
                    <button
                      onClick={() => {
                        exportAllFilteredUsersMultiFormat('pdf')
                        setShowTopExportMenu(false)
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
                  <SelectItem value="client">Acheteur</SelectItem>
                  <SelectItem value="vendor">Vendeur</SelectItem>
                  <SelectItem value="driver">Livreur</SelectItem>
                  <SelectItem value="ops">Service commandes & livraisons</SelectItem>
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
                  type="button"
                  variant="outline"
                  size="sm"
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFilteredExportMenu(!showFilteredExportMenu)}
                          className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exporter (résultats)
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Exporter les résultats affichés (CSV, Excel, PDF)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {showFilteredExportMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            exportFilteredResults('csv')
                            setShowFilteredExportMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export CSV
                        </button>
                        <button
                          onClick={() => {
                            exportFilteredResults('excel')
                            setShowFilteredExportMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export Excel
                        </button>
                        <button
                          onClick={() => {
                            exportFilteredResults('pdf')
                            setShowFilteredExportMenu(false)
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
                {/* Export de la sélection */}
                <div className="relative export-menu-container">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkExportMenu(!showBulkExportMenu)}
                          className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Exporter (sélection)
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Exporter uniquement les utilisateurs sélectionnés (CSV, Excel, PDF)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {showBulkExportMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            exportSelectedUsersMultiFormat('csv')
                            setShowBulkExportMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export CSV
                        </button>
                        <button
                          onClick={() => {
                            exportSelectedUsersMultiFormat('excel')
                            setShowBulkExportMenu(false)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export Excel
                        </button>
                        <button
                          onClick={() => {
                            exportSelectedUsersMultiFormat('pdf')
                            setShowBulkExportMenu(false)
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
            Tous ({userCounts.total})
          </TabsTrigger>
          <TabsTrigger 
            value="buyers" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Acheteurs ({userCounts.buyers})
          </TabsTrigger>
          <TabsTrigger 
            value="vendors" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Vendeurs ({userCounts.vendors})
          </TabsTrigger>
          <TabsTrigger 
            value="admins" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Administrateurs ({userCounts.admins})
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            En Attente ({userCounts.pending})
          </TabsTrigger>
          <TabsTrigger 
            value="suspended" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Suspendus ({userCounts.suspended})
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
            users={filteredUsers.filter(u => u.role === 'client')}
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
                     setApprovalSettings(DEFAULT_APPROVAL_SETTINGS)
                   }}
                   className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                 >
                   Réinitialiser
                 </Button>
                 <Button 
                   onClick={() => {
                     void handleSaveSettings()
                   }}
                   className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                   disabled={settingsLoading}
                 >
                   {settingsLoading ? 'Sauvegarde...' : 'Sauvegarder les réglages'}
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

         <TabsContent value="permissions" className="mt-6">
          <Card className="border-[#535455]/20 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-[#ff6600]">Gestion des Permissions et Rôles</CardTitle>
              <CardDescription>
                Créez des rôles personnalisés, gérez leurs permissions et assignez-les aux utilisateurs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Rôles personnalisés</h3>
                    <Button size="sm" onClick={() => setIsRoleModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Nouveau rôle
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {rolesLoading && (
                      <div className="text-sm text-gray-500">Chargement des rôles depuis Supabase…</div>
                    )}
                    {rolesError && (
                      <div className="text-sm text-red-600">{rolesError}</div>
                    )}
                    {customRoles.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                        Aucun rôle personnalisé pour le moment.
                      </div>
                    ) : (
                      customRoles.map((role) => (
                        <div key={role.id} className={`border rounded-lg p-4 ${selectedRoleId === role.id ? 'border-[#ff6600] bg-[#ff6600]/5' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <button
                                type="button"
                                className="text-left"
                                onClick={() => {
                                  setSelectedRoleId(role.id)
                                  setRoleForm(prev => ({ ...prev, permissions: role.permissions }))
                                }}
                              >
                                <h4 className="text-base font-semibold text-gray-900">{role.name}</h4>
                                <p className="text-sm text-gray-500">{role.description || 'Aucune description'}</p>
                              </button>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="secondary" className="bg-[#ff6600]/10 text-[#ff6600]">
                                  {role.userCount} utilisateur(s)
                                </Badge>
                                <Badge variant={role.isActive ? 'default' : 'secondary'} className={role.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}>
                                  {role.isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="outline" onClick={() => handleEditRole(role)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" onClick={() => handleDeleteRole(role.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs uppercase text-gray-500 mb-2">Permissions</p>
                            <div className="flex flex-wrap gap-2">
                              {role.permissions.length === 0 ? (
                                <Badge variant="outline" className="text-gray-500 border-gray-300">
                                  Aucune permission configurée
                                </Badge>
                              ) : (
                                role.permissions.map((permission) => (
                                  <Badge key={permission} variant="outline" className="border-[#ff6600] text-[#ff6600]">
                                    {permission}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Assignations & Permissions</h3>
                    <Button size="sm" variant="outline">
                      <Shield className="h-4 w-4 mr-1" /> Rôles par défaut
                    </Button>
                  </div>
                  {selectedRoleId ? (
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Permissions disponibles</h4>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                          {permissions.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucune permission récupérée.</p>
                          ) : (
                            permissions.map((permission) => {
                              const isChecked = roleForm.permissions.includes(permission.code)
                              return (
                                <label
                                  key={permission.id}
                                  className="flex items-start gap-3 border border-gray-200 rounded-lg p-3 hover:border-[#ff6600]/60"
                                >
                                  <Switch
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      togglePermission(permission.code)
                                    }}
                                  />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{permission.name}</p>
                                    <p className="text-xs text-gray-500">{permission.description || 'Pas de description'}</p>
                                    {permission.category && (
                                      <Badge variant="outline" className="mt-2 border-[#535455]/40 text-[#535455]">
                                        {permission.category}
                                      </Badge>
                                    )}
                                  </div>
                                </label>
                              )
                            })
                          )}
                        </div>
                        <Button
                          onClick={() => {
                            setCustomRoles(prev => prev.map(role =>
                              role.id === selectedRoleId
                                ? { ...role, permissions: roleForm.permissions }
                                : role
                            ))
                            void handlePersistRolePermissions(selectedRoleId, roleForm.permissions)
                          }}
                          className="mt-4 bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                        >
                          Appliquer les permissions
                        </Button>
                      </div>
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-800 mb-2">Assignation rapide à un utilisateur</p>
                        <p className="text-sm text-gray-500 mb-3">
                          Entrez l'identifiant utilisateur et appliquez ce rôle supplémentaire.
                        </p>
                        <div className="flex flex-col md:flex-row gap-3">
                          <Input
                            placeholder="ID utilisateur"
                            value={roleAssignmentUserId}
                            onChange={(e) => setRoleAssignmentUserId(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (!roleAssignmentUserId.trim()) return
                                void handleAssignRoleToUser(roleAssignmentUserId.trim(), selectedRoleId)
                              }}
                            >
                              Assigner
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (!roleAssignmentUserId.trim()) return
                                void handleRemoveRoleFromUser(roleAssignmentUserId.trim(), selectedRoleId)
                              }}
                            >
                              Retirer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-600 bg-gray-50">
                      <p className="font-medium text-gray-800 mb-2">Sélectionnez un rôle pour gérer ses permissions :</p>
                      <p className="mb-2">1. Cliquez sur un rôle personnalisé dans la liste de gauche.</p>
                      <p className="mb-2">2. Activez ou désactivez les permissions souhaitées.</p>
                      <p>3. Appliquez les changements pour synchroniser avec Supabase.</p>
                    </div>
                  )}
                </div>
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
                  {analyticsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des métriques Supabase…
                    </div>
                  ) : analyticsError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Analytics</AlertTitle>
                      <AlertDescription>{analyticsError}</AlertDescription>
                    </Alert>
                  ) : overviewStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{overviewStats.totalUsers}</div>
                          <div className="text-sm text-blue-600">Total utilisateurs</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{overviewStats.activeUsers}</div>
                          <div className="text-sm text-green-600">Utilisateurs actifs</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{overviewStats.pendingVendors}</div>
                          <div className="text-sm text-yellow-600">Vendeurs en attente</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{overviewStats.systemAlerts}</div>
                          <div className="text-sm text-red-600">Alertes système</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Aucune donnée analytics disponible.</div>
                  )}
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
                  {overviewStats ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Utilisateurs totaux</span>
                        <span className="text-sm font-medium">{overviewStats.totalUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Vendeurs actifs</span>
                        <span className="text-sm font-medium">{overviewStats.totalVendors}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Messages non lus</span>
                        <span className="text-sm font-medium">{overviewStats.unreadMessages}</span>
                      </div>
                    </div>
                  ) : analyticsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Préparation des données…
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Aucune donnée role/activité disponible.</div>
                  )}
                </CardContent>
              </Card>

             {/* Historique des interactions */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-[#ff6600] flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Activités Récentes
                  </CardTitle>
                  <CardDescription>
                    Flux agrégé des événements utilisateurs Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des activités…
                    </div>
                  ) : activitiesError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Activités</AlertTitle>
                      <AlertDescription>{activitiesError}</AlertDescription>
                    </Alert>
                  ) : recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-[#ff6600]/20 rounded-full flex items-center justify-center">
                              <Activity className="h-4 w-4 text-[#ff6600]" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{activity.title}</div>
                              <div className="text-xs text-gray-500">{activity.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{new Date(activity.timestamp).toLocaleString('fr-FR')}</div>
                            <div className="text-xs text-gray-500">Priorité : {activity.priority}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Aucune activité récente.</div>
                  )}
                </CardContent>
              </Card>
           </div>
         </TabsContent>

         <TabsContent value="assistance" className="mt-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Messages et suivi */}
             <Card className="lg:col-span-2">
               <CardHeader>
                 <CardTitle className="text-[#ff6600] flex items-center gap-2">
                   <MessageCircle className="h-5 w-5" />
                   Historique des Tickets
                 </CardTitle>
                 <CardDescription>
                   Consultez les messages internes et mettez à jour le suivi des tickets sélectionnés.
                 </CardDescription>
               </CardHeader>
               <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                 <div className="space-y-3">
                   <h4 className="font-medium text-gray-900">Tickets</h4>
                   <div className="max-h-72 overflow-y-auto pr-2 space-y-2">
                     {supportLoading && (
                       <div className="flex items-center gap-2 text-sm text-gray-500">
                         <Loader2 className="h-4 w-4 animate-spin" />
                         Chargement des tickets…
                       </div>
                     )}

                     {supportTickets.map(ticket => (
                       <button
                         key={ticket.id}
                         type="button"
                         className={`w-full text-left border rounded-lg p-3 ${selectedTicketId === ticket.id ? 'border-[#ff6600] bg-[#ff6600]/10' : 'border-gray-200 hover:border-[#ff6600]/60'}`}
                         onClick={() => {
                           setSelectedTicketId(ticket.id)
                           void fetchTicketMessages(ticket.id)
                         }}
                       >
                         <div className="text-sm font-semibold text-gray-800">{ticket.subject}</div>
                         <div className="text-xs text-gray-500">Statut: {ticket.status} • Priorité {ticket.priority}</div>
                       </button>
                     ))}

                     {!supportLoading && supportTickets.length === 0 && (
                       <div className="text-sm text-gray-500">
                         Aucun ticket à afficher.
                       </div>
                     )}
                   </div>
                 </div>

                 <div className="lg:col-span-2 space-y-4">
                   {selectedTicketId ? (
                     <>
                       <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[200px] flex flex-col gap-3">
                         <h4 className="text-sm font-semibold text-gray-700">Messages internes</h4>
                         {ticketMessageLoading === selectedTicketId ? (
                           <div className="flex items-center gap-2 text-sm text-gray-500">
                             <Loader2 className="h-4 w-4 animate-spin" />
                             Chargement des messages…
                           </div>
                         ) : (
                           <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                             {(ticketMessages[selectedTicketId] ?? []).map(message => (
                               <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                 <div className="text-xs text-gray-500 mb-1">
                                   {new Date(message.createdAt).toLocaleString('fr-FR')}
                                 </div>
                                 <p className="text-sm text-gray-700">{message.message}</p>
                               </div>
                             ))}

                             {(ticketMessages[selectedTicketId] ?? []).length === 0 && (
                               <div className="text-sm text-gray-500">
                                 Aucun message pour ce ticket.
                               </div>
                             )}
                           </div>
                         )}
                       </div>

                       <div className="flex flex-col gap-3">
                         <Textarea
                           placeholder="Ajouter un message interne..."
                           value={ticketMessageContent}
                           onChange={(event) => setTicketMessageContent(event.target.value)}
                         />
                         <div className="flex gap-2 justify-end">
                           <Button
                             variant="outline"
                             onClick={() => setTicketMessageContent('')}
                           >
                             Annuler
                           </Button>
                           <Button
                             className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                             onClick={() => selectedTicketId && handleAddTicketMessage(selectedTicketId)}
                           >
                             Ajouter une note
                           </Button>
                         </div>
                       </div>
                     </>
                   ) : (
                     <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-600 bg-white">
                       Sélectionnez un ticket pour afficher son historique et ajouter des messages internes.
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>

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
                     <span className="font-medium text-yellow-800">
                       Demandes en attente: {supportTickets.filter(ticket => ticket.category === 'password_reset' && ticket.status !== 'resolved' && ticket.status !== 'closed').length}
                     </span>
                   </div>
                   <p className="text-sm text-yellow-700">
                     {supportTickets.filter(ticket => ticket.category === 'password_reset').length} utilisateurs ont demandé une réinitialisation de mot de passe
                   </p>
                 </div>

                 {supportError && (
                   <Alert variant="destructive">
                     <AlertTitle>Assistance</AlertTitle>
                     <AlertDescription>{supportError}</AlertDescription>
                   </Alert>
                 )}

                 {supportLoading ? (
                   <div className="flex items-center gap-2 text-sm text-gray-500">
                     <Loader2 className="h-4 w-4 animate-spin" />
                     Chargement des demandes de réinitialisation…
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {supportTickets.filter(ticket => ticket.category === 'password_reset').slice(0, 3).map(ticket => (
                       <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                         <div>
                           <div className="font-medium text-sm">{ticket.subject}</div>
                           <div className="text-xs text-gray-500">
                             Ticket #{ticket.id} • Priorité {ticket.priority}
                           </div>
                         </div>
                         <Button
                           size="sm"
                           className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                           onClick={() => handleSendPasswordResetLink(ticket)}
                         >
                           <Mail className="h-4 w-4 mr-2" />
                           Envoyer lien
                         </Button>
                       </div>
                     ))}

                     {supportTickets.filter(ticket => ticket.category === 'password_reset').length === 0 && (
                       <div className="text-sm text-gray-500">
                         Aucune demande de réinitialisation pour le moment.
                       </div>
                     )}
                   </div>
                 )}
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
                     <span className="font-medium text-red-800">
                       Comptes signalés: {supportTickets.filter(ticket => ticket.category === 'account_violation' && ticket.status !== 'resolved').length}
                     </span>
                   </div>
                   <p className="text-sm text-red-700">
                     {supportTickets.filter(ticket => ticket.category === 'account_violation').length} tickets liés à des violations de compte
                   </p>
                 </div>

                 {supportLoading ? (
                   <div className="flex items-center gap-2 text-sm text-gray-500">
                     <Loader2 className="h-4 w-4 animate-spin" />
                     Chargement des tickets de modération…
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {supportTickets.filter(ticket => ticket.category === 'account_violation').slice(0, 3).map(ticket => (
                       <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                         <div>
                           <div className="font-medium text-sm">{ticket.subject}</div>
                           <div className="text-xs text-gray-500">
                             Statut: {ticket.status}
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                           >
                             Examiner
                           </Button>
                           <Button
                             size="sm"
                             variant="destructive"
                             onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                           >
                             <Trash2 className="h-4 w-4 mr-1" />
                             Résoudre
                           </Button>
                         </div>
                       </div>
                     ))}

                     {supportTickets.filter(ticket => ticket.category === 'account_violation').length === 0 && (
                       <div className="text-sm text-gray-500">
                         Aucun ticket de violation de compte à traiter.
                       </div>
                     )}
                   </div>
                 )}
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
                {analyticsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Récupération des métriques Supabase…
                  </div>
                ) : analyticsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Indicateurs indisponibles</AlertTitle>
                    <AlertDescription>{analyticsError}</AlertDescription>
                  </Alert>
                ) : !overviewStats ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    Aucune statistique disponible pour l’instant.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white border border-[#ff6600]/20 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500">Comptes totaux</div>
                        <div className="text-3xl font-bold text-[#ff6600]">{formatCount(overviewStats.totalUsers)}</div>
                      </div>
                      <div className="text-center p-4 bg-white border border-[#ff6600]/20 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500">Utilisateurs actifs</div>
                        <div className="text-3xl font-bold text-[#ff6600]">{formatCount(overviewStats.activeUsers)}</div>
                      </div>
                      <div className="text-center p-4 bg-white border border-[#ff6600]/20 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-500">Commandes totales</div>
                        <div className="text-3xl font-bold text-[#ff6600]">{formatCount(overviewStats.totalOrders)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Actions rapides</h4>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                            onClick={() => void loadUsers()}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rafraîchir les utilisateurs
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                            onClick={() => void loadSupportTickets()}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Mettre à jour les tickets
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                            onClick={() => void loadRoles()}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Synchroniser les rôles
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Indicateurs de santé</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm">Alertes système actives</span>
                            <Badge variant={overviewStats.systemAlerts > 0 ? 'destructive' : 'outline'}>
                              {overviewStats.systemAlerts}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm">Messages non lus</span>
                            <Badge>{overviewStats.unreadMessages}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm">Vendeurs en attente</span>
                            <Badge variant={overviewStats.pendingVendors > 0 ? 'default' : 'outline'}>
                              {overviewStats.pendingVendors}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des utilisateurs…
                  </div>
                ) : loadError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Chargement impossible</AlertTitle>
                    <AlertDescription>{loadError}</AlertDescription>
                  </Alert>
                ) : topUsersForPermissions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    Aucun utilisateur disponible pour le moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topUsersForPermissions.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="capitalize">{user.role.replace('_', ' ')}</span>
                            {getStatusBadge(user.status)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                          onClick={() => handleEditUser(user)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gérer
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
                {rolesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des rôles…
                  </div>
                ) : rolesError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Chargement impossible</AlertTitle>
                    <AlertDescription>{rolesError}</AlertDescription>
                  </Alert>
                ) : customRoles.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    Aucun rôle personnalisé pour le moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customRoles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{role.name}</div>
                          <div className="text-xs text-gray-500">{role.userCount} membre{role.userCount > 1 ? 's' : ''}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={role.isActive ? 'default' : 'secondary'}>
                            {role.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Button
                            size="sm"
                            className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                            onClick={() => handleEditRole(role)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                {rolesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Construction de la hiérarchie…
                  </div>
                ) : roleHierarchy.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    Aucune donnée de rôle disponible pour établir une hiérarchie.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {roleHierarchy.map((role, index) => (
                        <div key={role.id} className="text-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div className="text-lg font-bold text-gray-800 mb-2">{role.name}</div>
                          <div className="text-xs text-gray-500">{role.userCount} utilisateur{role.userCount > 1 ? 's' : ''}</div>
                          <div className="text-xs text-gray-400 mt-1">Niveau {index + 1}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Règles de cascade</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                          <span>Les rôles sont triés par nombre d’utilisateurs rattachés.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                          <span>Mettre à jour un rôle impacte immédiatement ses membres.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#ff6600] rounded-full"></div>
                          <span>Utilisez le bouton Configurer pour ajuster permissions et membres.</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
            <DialogDescription className="text-gray-600">Formulaire complet avec gestion avancée des fonctionnalités</DialogDescription>
          </DialogHeader>

          {actionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Erreur lors de la création</AlertTitle>
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

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
                    ) : selectedUser?.avatar ? (
                      <img src={selectedUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
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
                      ref={avatarInputRef}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                      onClick={handleAvatarButtonClick}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir avatar
                    </Button>
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
                      <SelectItem value="client">👤 Acheteur</SelectItem>
                      <SelectItem value="vendor">🏪 Vendeur</SelectItem>
                      <SelectItem value="driver">🚚 Livreur</SelectItem>
                      <SelectItem value="ops">🧭 Service commandes & livraisons</SelectItem>
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
                    {(['client', 'vendor', 'driver', 'ops', 'admin', 'super_admin'] as User['role'][]).map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded border hover:bg-blue-50">
                        <input
                          type="checkbox"
                          checked={selectedRoles.has(role)}
                          onChange={() => handleRoleToggle(role)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm capitalize">
                          {role === 'client' && '👤 Acheteur'}
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
                        role === 'client' ? 'Acheteur' : 
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
                    {roleFeatures[userForm.role]?.dashboard?.map((feature, index) => (
                      <label key={`create-dashboard-${feature}-${index}`} className="flex items-center gap-2 cursor-pointer">
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
                      {roleFeatures.vendor.marketplace.map((feature, index) => (
                        <label key={`create-vendor-marketplace-${feature}-${index}`} className="flex items-center gap-2 cursor-pointer">
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
                      {roleFeatures[userForm.role]?.management?.map((feature, index) => (
                        <label key={`edit-management-${feature}-${index}`} className="flex items-center gap-2 cursor-pointer">
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
                      {roleFeatures.super_admin.system.map((feature, index) => (
                        <label key={`edit-system-${feature}-${index}`} className="flex items-center gap-2 cursor-pointer">
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
                        {selectedFeatures.map((feature, index) => (
                          <Badge key={`selected-feature-${feature}-${index}`} variant="secondary" className="text-xs">
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
                disabled={
                  actionLoading ||
                  !userForm.name ||
                  !userForm.email ||
                  !userForm.password ||
                  userForm.password !== userForm.confirmPassword
                }
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
            <DialogDescription className="text-gray-600">Modifiez toutes les informations et permissions de l'utilisateur</DialogDescription>
          </DialogHeader>
          {actionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Erreur lors de la mise à jour</AlertTitle>
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
          
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
                      ) : selectedUser?.avatar ? (
                        <img src={selectedUser.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
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
                      <SelectItem value="client">👤 Acheteur</SelectItem>
                      <SelectItem value="vendor">🏪 Vendeur</SelectItem>
                      <SelectItem value="driver">🚚 Livreur</SelectItem>
                      <SelectItem value="ops">🧭 Service commandes & livraisons</SelectItem>
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
                        role === 'client' ? 'Acheteur' : 
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
                    {roleFeatures[userForm.role]?.dashboard?.map((feature, index) => (
                      <label key={`create-dashboard-${feature}-${index}`} className="flex items-center gap-2 cursor-pointer">
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
                      {roleFeatures.vendor.marketplace.map((feature, index) => (
                        <label key={`create-vendor-marketplace-${feature}-${index}`} className="flex items-center gap-2 cursor-pointer">
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
                      {roleFeatures[userForm.role]?.management?.map((feature, index) => (
                        <label key={`create-management-${feature}-${index}`} className="flex items-center gap-2 cursor-pointer">
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
                      {roleFeatures.super_admin.system.map((feature, index) => (
                        <label key={`create-system-${feature}-${index}`} className="flex items-center gap-2 cursor-pointer">
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
                        {selectedFeatures.map((feature, index) => (
                          <Badge key={`selected-feature-${feature}-${index}`} variant="secondary" className="text-xs">
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
            <DialogDescription className="text-gray-600">Informations complètes et statistiques détaillées</DialogDescription>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Statistiques produits et ventes */}
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
            <DialogDescription className="text-gray-600">
              Envoyer un message à {selectedFilteredUsers.size} utilisateur(s) sélectionné(s)
            </DialogDescription>
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
            <DialogDescription className="text-gray-600">
              Chat en direct avec {selectedFilteredUsers.size} utilisateur(s) sélectionné(s)
            </DialogDescription>
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
            <DialogDescription className="text-gray-600">
              Gérer et configurer les rapports automatiques basés sur les filtres
            </DialogDescription>
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
           <DialogDescription className="text-gray-600">
             Configurez les permissions et l'état du rôle personnalisé
           </DialogDescription>
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
                <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-[#535455] rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    {getStatusBadge(user.status)}
                    {getRoleBadge(user.role)}
                    {getAccountTypeBadge(user.type)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
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
                            onClick={() => onMenuAction(user.id, 'approve-vendor')}
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
    case 'client':
    case 'buyer':
      return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Acheteur</Badge>
    case 'vendor':
      return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Vendeur</Badge>
    case 'driver':
      return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Livreur</Badge>
    case 'ops':
      return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Service commandes & livraisons</Badge>
    case 'admin':
      return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Admin</Badge>
    case 'super_admin':
      return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Super Admin</Badge>
    default:
      return <Badge variant="outline">Inconnu</Badge>
  }
}
