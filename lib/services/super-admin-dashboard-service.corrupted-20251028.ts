import { supabase } from '@/lib/supabase'

const API_BASE = '/api/super-admin'

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      credentials: 'include',
      ...init
    })

    if (!response.ok) {
      console.error(`❌ API ${path} failed with status`, response.status)
      throw new Error(`API ${path} responded with ${response.status}`)
    }

    const json = (await response.json()) as { data?: T }
    return json.data ?? ({} as T)
  } catch (error) {
    console.error(`❌ API ${path} error:`, error)
    throw error
  }
}

export type SuperAdminUserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'verified'

export interface SuperAdminRole {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  isActive: boolean
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
  userCount: number
}

export interface SuperAdminPermission {
  id: string
  code: string
  name: string
  description: string | null
  category: string | null
  metadata: Record<string, any>
}

export interface SuperAdminSupportTicket {
  id: string
  requesterId: string | null
  assignedTo: string | null
  subject: string
  description: string | null
  status: 'open' | 'in_progress' | 'waiting_user' | 'waiting_admin' | 'resolved' | 'closed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string | null
  tags: string[]
  metadata: Record<string, any>
  resolutionSummary: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SuperAdminSupportMessage {
  id: string
  ticketId: string
  authorId: string | null
  message: string
  visibility: 'public' | 'internal'
  createdAt: string
}

interface CreateSuperAdminUserInput {
  email: string
  role: SuperAdminUserSummary['role']
  type: SuperAdminUserSummary['type']
  status?: SuperAdminUserStatus
  name?: string
  phone?: string | null
  location?: string | null
  password?: string
  loyaltyPoints?: number
  isVerified?: boolean
  has2FA?: boolean
  preferences?: Record<string, any>
  security?: {
    twoFactorEnabled?: boolean
    loginNotifications?: boolean
    sessionTimeout?: number
  }

  socialMedia?: Record<string, string | undefined>
  bio?: string
  website?: string
  avatar?: string | null
}

interface UpdateSuperAdminUserInput extends Partial<CreateSuperAdminUserInput> {
  id: string
}

export interface SuperAdminOverviewStats {
  totalUsers: number
  activeUsers: number
  totalVendors: number
  pendingVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  totalPoints: number
  unreadMessages: number
  systemAlerts: number
}

const EMPTY_OVERVIEW_STATS: SuperAdminOverviewStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalVendors: 0,
  pendingVendors: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  totalPoints: 0,
  unreadMessages: 0,
  systemAlerts: 0
}

export interface SuperAdminSystemAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'resolved' | 'ignored'
  created_at: string
  updated_at: string
  action_required: boolean
  target_roles: string[]
}

export interface SuperAdminInboxMessage {
  id: string
  senderId: string | null
  recipientId: string
  from: string
  fromEmail: string
  fromRole: string
  subject: string
  message: string
  timestamp: string
  priority: 'low' | 'medium' | 'high'
  category: string
  isRead: boolean
  status: 'active' | 'archived' | 'deleted'
  parentMessageId: string | null
}

export interface SuperAdminTeamContact {
  id: string
  name: string
  email: string
  role: string
}

export interface SuperAdminActivity {
  id: string
  type: 'order' | 'alert' | 'message'
  title: string
  description: string
  timestamp: string
  priority: 'low' | 'medium' | 'high'
  status: string
}

export interface SuperAdminUserSummary {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'client' | 'vendor' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'verified'
  type: 'buyer' | 'vendor' | 'admin'
  joinDate: string
  lastActive: string | null
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
  totalEarnings: number
  rating: number | null
  isVerified: boolean
  has2FA: boolean
  location: string | null
  accountAge: number
  loginFrequency: number
  activityLevel: 'very_active' | 'active' | 'moderate' | 'inactive'
  churnRisk: 'low' | 'medium' | 'high'
  profileCompletion?: number
  engagementScore?: number
  lastPurchaseDate?: string | null
  averageOrderValue?: number | null
  customerLifetimeValue?: number
  timeSpentOnPlatform?: number | null
  productsShared?: number
}

export class SuperAdminDashboardService {
  /**
   * Calcule les statistiques agrégées nécessaires aux panneaux Analytics.
   */
  static async getAnalyticsStats(): Promise<SuperAdminOverviewStats> {
    return this.getOverviewStats()
  }

  /**
   * Récupère les statistiques globales agrégées pour le tableau de bord super admin.
   */
  static async getOverviewStats(): Promise<SuperAdminOverviewStats> {
    try {
      return await fetchJson<SuperAdminOverviewStats>('/overview')
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques super admin:', error)
      return EMPTY_OVERVIEW_STATS
    }
  }

      return null
    }

    return createdUser
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la création utilisateur:', error)
    return null
  }
}

/**
 * Retourne la liste des rôles disponibles côté base.
 */
static async getRoles(): Promise<SuperAdminRole[]> {
  try {
    return await fetchJson<SuperAdminRole[]>('/roles')
  } catch (error) {
    console.error('❌ Erreur lors du chargement des rôles super admin:', error)
    return null
  }
}

/**
 * Crée un nouveau rôle personnalisable.
 */
static async createRole(payload: { name: string; description?: string; isActive?: boolean; metadata?: Record<string, any> }): Promise<SuperAdminRole | null> {
  try {
    const { data: createdRole, error: roleError } = await fetchJson<SuperAdminRole>('/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (roleError) {
      console.error('⚠️ Impossible de créer le rôle:', roleError)
      return null
    }

    return createdRole
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la création de rôle:', error)
    return null
  }
}

/**
 * Récupère toutes les permissions disponibles.
 */
static async getPermissions(): Promise<SuperAdminPermission[]> {
  try {
    return await fetchJson<SuperAdminPermission[]>('/permissions')
  } catch (error) {
    console.error('❌ Erreur lors du chargement des permissions:', error)
    return null
  }
}

/**
 * Assigne un rôle additionnel à un utilisateur.
 */
static async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
  try {
    const { error } = await fetchJson('/users/roles', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId }),
    })

    if (error) {
      console.error('⚠️ Impossible d'assigner le rôle à l'utilisateur:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Erreur inattendue lors de l'assignation du rôle utilisateur:', error)
    return false
  }
}

/**
 * Récupère les tickets d'assistance pour le super admin.
 */
static async getSupportTickets(): Promise<SuperAdminSupportTicket[]> {
  try {
    return await fetchJson<SuperAdminSupportTicket[]>('/support-tickets')
  } catch (error) {
    console.error('❌ Erreur lors du chargement des tickets support:', error)
    return null
  }
}

/**
 * Met à jour les métadonnées d'un ticket d'assistance.
 */
static async updateSupportTicket(ticketId: string, updates: Partial<Omit<SuperAdminSupportTicket, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
  try {
    const { error } = await fetchJson(`/support-tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })

    if (error) {
      console.error('⚠️ Impossible de mettre à jour le ticket support:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la mise à jour du ticket support:', error)
    return false
  }
}

/**
 * Récupère les alertes système récentes avec fallback en cas d'échec.
 */
static async getSystemAlerts(limit = 50): Promise<SuperAdminSystemAlert[]> {
  try {
    if (!ticketId) {
      return []
    }

    return await fetchJson<SuperAdminSystemAlert[]>(`/alerts?limit=${limit}`)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des alertes système:', error)
    return []
  }
  /**
   * Récupère la liste des contacts internes (autres administrateurs) disponibles.
   */
  static async getAdminContacts(): Promise<SuperAdminTeamContact[]> {
    try {
      return await fetchJson<SuperAdminTeamContact[]>('/contacts')
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la récupération des contacts administrateurs:', error)
      return []
    }
  }

  // --- Méthodes internes --------------------------------------------------

  // Les méthodes privées supprimées (agrégats) sont désormais gérées côté serveur via les API routes.
}
