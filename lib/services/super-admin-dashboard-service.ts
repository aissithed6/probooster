import { SuperAdminDashboardApi } from '@/lib/services/super-admin-dashboard-service.api'
import type { AdminApprovalSettings, SuperAdminSettings, VendorApprovalSettings } from '@/lib/types/super-admin-settings'
import type { SharedProduct } from '@/lib/types/shared-product'

export type SuperAdminUserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'verified'

export interface SuperAdminRole {
  id: string
  name: string
  slug: string | null
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

export interface CreateSuperAdminUserInput {
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
  secondaryRoles?: string[]
  customPermissions?: string[]
  features?: Array<{ code: string; scope: string; enabled?: boolean }>
}

export interface UpdateSuperAdminUserInput extends Partial<CreateSuperAdminUserInput> {
  id: string
}

export interface GetUsersOptions {
  limit?: number
  offset?: number
  search?: string
  status?: string
  role?: string
}

export type SuperAdminProductStatus = 'draft' | 'pending_review' | 'active' | 'inactive' | 'archived' | 'rejected'

export interface SuperAdminProductMedia {
  id: string
  path: string
  type: string
  alt: string | null
  position: number
  metadata: Record<string, any> | null
  isPrimary?: boolean
}

export interface SuperAdminProductVariation {
  id: string
  name: string | null
  sku: string | null
  price: number | null
  salePrice: number | null
  stockQuantity: number | null
  attributes: Record<string, any> | null
  metadata: Record<string, any> | null
}

export interface SuperAdminProductCategory {
  categoryId: string
  isPrimary: boolean
  category?: {
    id: string
    name: string
    slug: string | null
  }
}

export interface SuperAdminProductTag {
  tagId: string
  tag?: {
    id: string
    name: string
    slug: string | null
  }
}

export interface SuperAdminProductStatistics {
  totalViews: number
  totalSales: number
  totalRevenue: number
  averageRating: number | null
  reviewCount: number
  shareCount: number
  wishlistCount: number
  lastOrderAt: string | null
}

export interface SuperAdminProduct {
  id: string
  vendorId: string | null
  createdBy: string | null
  updatedBy: string | null
  source: 'vendor' | 'admin' | 'super_admin'
  name: string
  slug: string | null
  description: string | null
  shortDescription: string | null
  sku: string | null
  barcode: string | null
  price: number
  salePrice: number | null
  costPrice: number | null
  currency: string
  stockQuantity: number
  lowStockThreshold: number
  manageStock: boolean
  allowBackorders: boolean
  productStatus: SuperAdminProductStatus
  isFeatured: boolean
  isBundle: boolean
  isVirtual: boolean
  isDownloadable: boolean
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  shippingClass: string | null
  shippingCost: number | null
  freeShipping: boolean
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  seoSlug: string | null
  tags: string[] | null
  attributes: Record<string, any> | null
  metadata: Record<string, any> | null
  publishedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  media: SuperAdminProductMedia[]
  images: string[]
  variations: SuperAdminProductVariation[]
  categories: SuperAdminProductCategory[]
  tagsExtended: SuperAdminProductTag[]
  statistics: SuperAdminProductStatistics | null
}

export interface SuperAdminProductListOptions {
  search?: string
  status?: SuperAdminProductStatus
  vendorId?: string
  featured?: boolean
  limit?: number
  offset?: number
}

export interface ProductQueryOptions extends SuperAdminProductListOptions {}

export interface CreateSuperAdminProductInput {
  source?: 'vendor' | 'admin' | 'super_admin'
  name: string
  description?: string | null
  shortDescription?: string | null
  sku?: string | null
  barcode?: string | null
  price: number
  salePrice?: number | null
  costPrice?: number | null
  currency?: string
  stockQuantity?: number
  lowStockThreshold?: number
  manageStock?: boolean
  allowBackorders?: boolean
  productStatus?: SuperAdminProductStatus
  isFeatured?: boolean
  isBundle?: boolean
  isVirtual?: boolean
  isDownloadable?: boolean
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  shippingClass?: string | null
  shippingCost?: number | null
  freeShipping?: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  seoSlug?: string | null
  tags?: string[] | null
  attributes?: Record<string, any> | null
  productType?: 'simple' | 'variable'
  metadata?: Record<string, any> | null
  vendorId?: string | null
  publishedAt?: string | null
  archivedAt?: string | null
  categoryIds?: string[]
  tagIds?: string[]
  media?: Array<{
    path: string
    type: string
    alt?: string | null
    position?: number
    metadata?: Record<string, any>
  }>
  variations?: Array<{
    id?: string
    name?: string | null
    sku?: string | null
    price?: number | null
    salePrice?: number | null
    stockQuantity?: number | null
    attributes?: Record<string, unknown> | null
    metadata?: Record<string, unknown> | null
  }>
}

export type UpdateSuperAdminProductInput = CreateSuperAdminProductInput & { id: string }

export interface ProductBulkActionRequest {
  action: 'activate' | 'deactivate' | 'feature' | 'unfeature' | 'delete'
  productIds: string[]
}

export type DuplicateProductOverrides = Partial<
  Omit<CreateSuperAdminProductInput, 'media' | 'variations' | 'categoryIds' | 'tagIds'>
> & {
  media?: CreateSuperAdminProductInput['media']
  variations?: CreateSuperAdminProductInput['variations']
  categoryIds?: string[]
  tagIds?: string[]
}

export interface DuplicateProductInput {
  productId: string
  overrides?: DuplicateProductOverrides
}

export interface ReportProductInput {
  productId: string
  reason?: string
  status?: SuperAdminProductStatus
  metadata?: Record<string, any>
}

interface CreateSystemAlertInput {
  title: string
  message: string
  severity?: 'critical' | 'warning' | 'info'
  actionRequired?: boolean
  priority?: 'low' | 'medium' | 'high'
  targetRoles?: string[]
}

interface SendInternalMessageInput {
  senderId: string
  recipientId: string
  subject: string
  content: string
  priority?: 'low' | 'medium' | 'high'
  category?: string
  parentMessageId?: string
}

export interface SuperAdminOverviewStats {
  totalUsers: number
  activeUsers: number
  totalVendors: number
  pendingVendors: number
  totalRevenue: number
  revenueGross: number
  revenueRefunds: number
  revenueNet: number
  conversionRate: number
  totalProducts: number
  totalOrders: number
  totalPoints: number
  unreadMessages: number
  systemAlerts: number
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
  fromRole: string | null
  subject: string
  message: string
  timestamp: string
  priority: 'low' | 'medium' | 'high'
  category: string | null
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
  role: 'client' | 'vendor' | 'admin' | 'super_admin' | 'driver' | 'ops'
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
  avatar?: string | null
  bio?: string | null
  website?: string | null
  socialMedia?: Record<string, any> | null
  preferences?: Record<string, any> | null
  accountAge: number
  loginFrequency: number
  activityLevel: 'very_active' | 'active' | 'moderate' | 'inactive'
  churnRisk: 'low' | 'medium' | 'high'
  profileCompletion?: number
  engagementScore?: number
  lastPurchaseDate?: string | null
  averageOrderValue?: number | null
  customerLifetimeValue?: number | null
  timeSpentOnPlatform?: number | null
  productsShared?: number | null
  secondaryRoles?: string[]
  customPermissions?: string[]
  features?: Array<{ code: string; scope: string; enabled: boolean }>
  securitySettings?: {
    twoFactorEnabled: boolean
    loginNotifications: boolean
    sessionTimeout: number
  }
  verification?: {
    isVerified: boolean
    documents: any[]
  }
}

const EMPTY_OVERVIEW: SuperAdminOverviewStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalVendors: 0,
  pendingVendors: 0,
  totalRevenue: 0,
  revenueGross: 0,
  revenueRefunds: 0,
  revenueNet: 0,
  conversionRate: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalPoints: 0,
  unreadMessages: 0,
  systemAlerts: 0
}

export class SuperAdminDashboardService {
  /**
   * Récupère les statistiques agrégées pour le tableau de bord super administrateur.
   */
  static async getOverviewStats(): Promise<SuperAdminOverviewStats> {
    try {
      return await SuperAdminDashboardApi.getOverview()
    } catch (error) {
      console.error('❌ getOverviewStats failed:', error)
      return { ...EMPTY_OVERVIEW }
    }
  }

  /**
   * Récupère les réglages de configuration (vendors/admins/global).
   */
  static async getSettings(): Promise<SuperAdminSettings | null> {
    try {
      const settings = await SuperAdminDashboardApi.getSettings()
      const vendor = settings.find((item: { scope: string }) => item.scope === 'vendor')?.settings as VendorApprovalSettings | undefined
      const admin = settings.find((item: { scope: string }) => item.scope === 'admin')?.settings as AdminApprovalSettings | undefined
      const global = settings.find((item: { scope: string }) => item.scope === 'global')?.settings

      if (!vendor || !admin) {
        return null
      }

      return {
        vendor,
        admin,
        global
      }
    } catch (error) {
      console.error('❌ getSettings failed:', error)
      return null
    }
  }

  /**
   * Met à jour un scope de réglages (vendor/admin/global).
   */
  static async updateSettings<T extends Record<string, unknown>>(scope: 'vendor' | 'admin' | 'global', settings: T): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.updateSettings(scope, settings)
      return true
    } catch (error) {
      console.error('❌ updateSettings failed:', error)
      return false
    }
  }

  static async getGlobalSettings(): Promise<Record<string, unknown>> {
    try {
      const settings = await SuperAdminDashboardApi.getSettings(['global'])
      const global = settings.find((item: { scope: string }) => item.scope === 'global')?.settings
      return (global && typeof global === 'object') ? (global as Record<string, unknown>) : {}
    } catch (error) {
      console.error('❌ getGlobalSettings failed:', error)
      return {}
    }
  }

  static async updateGlobalSettings(settings: Record<string, unknown>): Promise<boolean> {
    return this.updateSettings('global', settings)
  }

  /**
   * Récupère la liste des utilisateurs avec un sous-ensemble d'attributs enrichis.
   */
  static async getUsers(options: GetUsersOptions = {}): Promise<SuperAdminUserSummary[]> {
    try {
      const users = await SuperAdminDashboardApi.getUsers(options)
      return users
        .map((user) => this.normalizeUserSummary(user))
        .filter((user): user is SuperAdminUserSummary => user !== null)
    } catch (error) {
      console.error('❌ getUsers failed:', error)
      return []
    }
  }

  /**
   * Crée un nouvel utilisateur avec profil et informations sociales facultatives.
   */
  static async createUser(payload: CreateSuperAdminUserInput): Promise<SuperAdminUserSummary | null> {
    try {
      const result = await SuperAdminDashboardApi.createUser(payload)
      return this.normalizeUserSummary(result)
    } catch (error) {
      console.error('❌ createUser failed:', error)
      throw error
    }
  }

  /**
   * Met à jour un utilisateur existant ainsi que son profil associé.
   */
  static async updateUser(payload: UpdateSuperAdminUserInput): Promise<SuperAdminUserSummary | null> {
    try {
      const result = await SuperAdminDashboardApi.updateUser(payload)
      return this.normalizeUserSummary(result)
    } catch (error) {
      console.error('❌ updateUser failed:', error)
      throw error
    }
  }

  /**
   * Supprime un utilisateur ainsi que ses informations de profil.
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.deleteUser(userId)
      return true
    } catch (error) {
      console.error('❌ deleteUser failed:', error)
      return false
    }
  }

  /**
   * Met à jour le statut d'un utilisateur.
   */
  static async updateUserStatus(userId: string, status: SuperAdminUserStatus): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.updateUserStatus(userId, status)
      return true
    } catch (error) {
      console.error('❌ updateUserStatus failed:', error)
      return false
    }
  }

  /**
   * Met à jour le rôle principal d'un utilisateur.
   */
  static async updateUserRole(userId: string, newRole: SuperAdminUserSummary['role']): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.updateUserRole(userId, newRole)
      return true
    } catch (error) {
      console.error('❌ updateUserRole failed:', error)
      return false
    }
  }

  /**
   * Duplique un utilisateur en lui attribuant un nouvel identifiant et une adresse e-mail dérivée.
   */
  static async duplicateUser(userId: string): Promise<SuperAdminUserSummary | null> {
    try {
      const duplicated = await SuperAdminDashboardApi.duplicateUser(userId)
      return this.normalizeUserSummary(duplicated)
    } catch (error) {
      console.error('❌ duplicateUser failed:', error)
      return null
    }
  }

  private static normalizeUserSummary(user: SuperAdminUserSummary | null | undefined): SuperAdminUserSummary | null {
    if (!user) {
      return null
    }

    const secondaryRoles = Array.isArray(user.secondaryRoles)
      ? user.secondaryRoles.filter((role): role is string => Boolean(role && role.trim()))
      : []

    const customPermissions = Array.isArray(user.customPermissions)
      ? user.customPermissions.filter((code): code is string => Boolean(code && code.trim()))
      : []

    const features = Array.isArray(user.features)
      ? user.features
          .map((feature) => ({
            code: feature.code,
            scope: feature.scope,
            enabled: feature.enabled ?? true
          }))
          .filter((feature) => Boolean(feature.code) && Boolean(feature.scope))
      : []

    const securitySettings = user.securitySettings ?? {
      twoFactorEnabled: user.has2FA ?? false,
      loginNotifications: true,
      sessionTimeout: 30
    }

    return {
      ...user,
      secondaryRoles,
      customPermissions,
      features,
      securitySettings
    }
  }

  private static mapProduct(record: any): SuperAdminProduct {
    if (!record) {
      throw new Error('Produit invalide.')
    }

    const mediaSource: any[] = Array.isArray(record.product_media) ? [...record.product_media] : []

    const normalizedMedia: SuperAdminProductMedia[] = mediaSource
      .sort((a, b) => {
        const positionA = typeof a.position === 'number' ? a.position : 0
        const positionB = typeof b.position === 'number' ? b.position : 0
        return positionA - positionB
      })
      .map((item: any, index) => ({
        id: item.id ?? `${record.id ?? 'media'}-${index}`,
        path: item.path,
        type: item.type ?? item.media_type ?? 'image',
        alt: item.alt ?? null,
        position: typeof item.position === 'number' ? item.position : index,
        metadata: item.metadata ?? null,
        isPrimary: Boolean(item.position === 0 || index === 0)
      }))

    const media: SuperAdminProductMedia[] = normalizedMedia.length > 0
      ? normalizedMedia
      : (() => {
          const legacyImages: string[] = Array.isArray(record.images) ? record.images.filter(Boolean) : []
          const primary = record.main_image ?? legacyImages[0]

          const fallbackEntries: SuperAdminProductMedia[] = []

          if (primary) {
            fallbackEntries.push({
              id: `${record.id ?? 'media'}-primary`,
              path: primary,
              type: 'image',
              alt: record.name ?? null,
              position: 0,
              metadata: null,
              isPrimary: true
            })
          }

          legacyImages
            .filter((image) => image && image !== primary)
            .forEach((image, legacyIndex) => {
              fallbackEntries.push({
                id: `${record.id ?? 'media'}-legacy-${legacyIndex}`,
                path: image,
                type: 'image',
                alt: record.name ?? null,
                position: legacyIndex + 1,
                metadata: null,
                isPrimary: false
              })
            })

          return fallbackEntries
        })()

    const variations: SuperAdminProductVariation[] = Array.isArray(record.product_variations)
      ? record.product_variations.map((variation: any) => ({
          id: variation.id ?? crypto.randomUUID(),
          name: variation.name ?? null,
          sku: variation.sku ?? null,
          price: variation.price !== undefined && variation.price !== null ? Number(variation.price) : null,
          salePrice:
            variation.sale_price !== undefined && variation.sale_price !== null ? Number(variation.sale_price) : null,
          stockQuantity:
            variation.stock_quantity !== undefined && variation.stock_quantity !== null
              ? Number(variation.stock_quantity)
              : null,
          attributes: variation.attributes ?? null,
          metadata: variation.metadata ?? null
        }))
      : []

    const categories: SuperAdminProductCategory[] = Array.isArray(record.product_category_assignments)
      ? record.product_category_assignments.map((assignment: any) => ({
          categoryId: assignment.category_id,
          isPrimary: Boolean(assignment.is_primary),
          category: assignment.product_categories
            ? {
                id: assignment.product_categories.id,
                name: assignment.product_categories.name,
                slug: assignment.product_categories.slug ?? null
              }
            : undefined
        }))
      : []

    const tagsExtended: SuperAdminProductTag[] = Array.isArray(record.product_tag_assignments)
      ? record.product_tag_assignments.map((tagAssignment: any) => ({
          tagId: tagAssignment.tag_id,
          tag: tagAssignment.product_tags
            ? {
                id: tagAssignment.product_tags.id,
                name: tagAssignment.product_tags.name,
                slug: tagAssignment.product_tags.slug ?? null
              }
            : undefined
        }))
      : []

    const statsSource = Array.isArray(record.product_statistics)
      ? record.product_statistics[0]
      : record.product_statistics

    const statistics: SuperAdminProductStatistics | null = statsSource
      ? {
          totalViews: Number(statsSource.total_views ?? 0),
          totalSales: Number(statsSource.total_sales ?? 0),
          totalRevenue: Number(statsSource.total_revenue ?? 0),
          averageRating:
            statsSource.average_rating !== undefined && statsSource.average_rating !== null
              ? Number(statsSource.average_rating)
              : null,
          reviewCount: Number(statsSource.review_count ?? 0),
          shareCount: Number(statsSource.share_count ?? 0),
          wishlistCount: Number(statsSource.wishlist_count ?? 0),
          lastOrderAt: statsSource.last_order_at ?? null
        }
      : null

    return {
      id: record.id,
      vendorId: record.vendor_id ?? null,
      createdBy: record.created_by ?? null,
      updatedBy: record.updated_by ?? null,
      source: record.source ?? 'vendor',
      name: record.name,
      slug: record.slug ?? null,
      description: record.description ?? null,
      shortDescription: record.short_description ?? null,
      sku: record.sku ?? null,
      barcode: record.barcode ?? null,
      price: Number(record.price ?? 0),
      salePrice: record.sale_price !== undefined && record.sale_price !== null ? Number(record.sale_price) : null,
      costPrice: record.cost_price !== undefined && record.cost_price !== null ? Number(record.cost_price) : null,
      currency: record.currency ?? 'XOF',
      stockQuantity: Number(record.stock_quantity ?? 0),
      lowStockThreshold: Number(record.low_stock_threshold ?? 5),
      manageStock: Boolean(record.manage_stock ?? true),
      allowBackorders: Boolean(record.allow_backorders ?? false),
      productStatus: record.product_status ?? 'draft',
      isFeatured: Boolean(record.is_featured ?? false),
      isBundle: Boolean(record.is_bundle ?? false),
      isVirtual: Boolean(record.is_virtual ?? false),
      isDownloadable: Boolean(record.is_downloadable ?? false),
      weight: record.weight !== undefined ? record.weight : null,
      length: record.length !== undefined ? record.length : null,
      width: record.width !== undefined ? record.width : null,
      height: record.height !== undefined ? record.height : null,
      shippingClass: record.shipping_class ?? null,
      shippingCost: record.shipping_cost !== undefined && record.shipping_cost !== null ? Number(record.shipping_cost) : null,
      freeShipping: Boolean(record.free_shipping ?? false),
      seoTitle: record.seo_title ?? null,
      seoDescription: record.seo_description ?? null,
      seoKeywords: record.seo_keywords ?? null,
      seoSlug: record.seo_slug ?? null,
      tags: Array.isArray(record.tags) ? record.tags : null,
      attributes: record.attributes ?? null,
      metadata: record.metadata ?? null,
      publishedAt: record.published_at ?? null,
      archivedAt: record.archived_at ?? null,
      createdAt: record.created_at ?? new Date().toISOString(),
      updatedAt: record.updated_at ?? new Date().toISOString(),
      media,
      images: media.map((media) => media.path),
      variations,
      categories,
      tagsExtended,
      statistics
    }
  }

  /**
   * Récupère la liste des rôles disponibles.
   */
  static async getRoles(): Promise<SuperAdminRole[]> {
    try {
      const { roles } = await SuperAdminDashboardApi.getRoles(true)
      return roles
    } catch (error) {
      console.error('❌ getRoles failed:', error)
      return []
    }
  }

  /**
   * Retourne la liste des permissions déclarées côté base.
   */
  static async getPermissions(): Promise<SuperAdminPermission[]> {
    try {
      const { permissions } = await SuperAdminDashboardApi.getRoles(true)
      return permissions ?? []
    } catch (error) {
      console.error('❌ getPermissions failed:', error)
      return []
    }
  }

  /**
   * Crée un nouveau rôle personnalisé.
   */
  static async createRole(payload: { name: string; description?: string; isActive?: boolean; metadata?: Record<string, any> }): Promise<SuperAdminRole | null> {
    try {
      return await SuperAdminDashboardApi.createRole(payload)
    } catch (error) {
      console.error('❌ createRole failed:', error)
      return null
    }
  }

  /**
   * Met à jour un rôle existant.
   */
  static async updateRole(roleId: string, payload: { name?: string; description?: string; isActive?: boolean; metadata?: Record<string, any> }): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.updateRole(roleId, payload)
      return true
    } catch (error) {
      console.error('❌ updateRole failed:', error)
      return false
    }
  }

  /**
   * Supprime définitivement un rôle.
   */
  static async deleteRole(roleId: string): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.deleteRole(roleId)
      return true
    } catch (error) {
      console.error('❌ deleteRole failed:', error)
      return false
    }
  }

  /**
   * Définit la liste complète des permissions pour un rôle donné.
   */
  static async setRolePermissions(roleId: string, permissionCodes: string[]): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.setRolePermissions(roleId, permissionCodes)
      return true
    } catch (error) {
      console.error('❌ setRolePermissions failed:', error)
      return false
    }
  }

  /**
   * Associe un rôle supplémentaire à un utilisateur.
   */
  static async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.assignSecondaryRole(userId, roleId)
      return true
    } catch (error) {
      console.error('❌ assignRoleToUser failed:', error)
      return false
    }
  }

  /**
   * Retire un rôle secondaire d'un utilisateur.
   */
  static async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.removeSecondaryRole(userId, roleId)
      return true
    } catch (error) {
      console.error('❌ removeRoleFromUser failed:', error)
      return false
    }
  }

  /**
   * Retourne la liste des tickets de support.
   */
  static async getSupportTickets(limit?: number): Promise<SuperAdminSupportTicket[]> {
    try {
      return await SuperAdminDashboardApi.getSupportTickets(limit)
    } catch (error) {
      console.error('❌ getSupportTickets failed:', error)
      return []
    }
  }

  /**
   * Met à jour un ticket de support.
   */
  static async updateSupportTicket(ticketId: string, updates: Partial<Omit<SuperAdminSupportTicket, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.updateSupportTicket(ticketId, updates)
      return true
    } catch (error) {
      console.error('❌ updateSupportTicket failed:', error)
      return false
    }
  }

  /**
   * Récupère les messages d'un ticket donné.
   */
  static async getSupportTicketMessages(ticketId: string): Promise<SuperAdminSupportMessage[]> {
    try {
      return await SuperAdminDashboardApi.getSupportTicketMessages(ticketId)
    } catch (error) {
      console.error('❌ getSupportTicketMessages failed:', error)
      return []
    }
  }

  /**
   * Ajoute un message (interne par défaut) à un ticket de support.
   */
  static async addSupportTicketMessage(
    ticketId: string,
    message: string,
    visibility: 'internal' | 'public' = 'internal',
    authorId?: string | null
  ): Promise<SuperAdminSupportMessage | null> {
    try {
      const created = await SuperAdminDashboardApi.addSupportTicketMessage(ticketId, { message, visibility, authorId })
      return created
    } catch (error) {
      console.error('❌ addSupportTicketMessage failed:', error)
      return null
    }
  }

  /**
   * Récupère les alertes système en base.
   */
  static async getSystemAlerts(limit = 50): Promise<SuperAdminSystemAlert[]> {
    try {
      return await SuperAdminDashboardApi.getSystemAlerts({ limit })
    } catch (error) {
      console.error('❌ getSystemAlerts failed:', error)
      return []
    }
  }

  /**
   * Crée une nouvelle alerte système.
   */
  static async createSystemAlert(payload: CreateSystemAlertInput): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.createSystemAlert({
        title: payload.title,
        message: payload.message,
        priority: payload.priority,
        actionRequired: payload.actionRequired,
        targetRoles: payload.targetRoles
      })
      return true
    } catch (error) {
      console.error('❌ createSystemAlert failed:', error)
      return false
    }
  }

  /**
   * Marque une alerte comme résolue.
   */
  static async resolveSystemAlert(alertId: string): Promise<boolean> {
    return this.updateAlertStatus(alertId, 'resolved')
  }

  /**
   * Marque une alerte comme ignorée.
   */
  static async ignoreSystemAlert(alertId: string): Promise<boolean> {
    return this.updateAlertStatus(alertId, 'ignored')
  }

  /**
   * Escalade une alerte en augmentant sa priorité.
   */
  static async escalateSystemAlert(alertId: string): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.escalateSystemAlert(alertId)
      return true
    } catch (error) {
      console.error('❌ escalateSystemAlert failed:', error)
      return false
    }
  }

  /**
   * Marque toutes les alertes actives comme résolues.
   */
  static async resolveAllSystemAlerts(): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.resolveAllSystemAlerts()
      return true
    } catch (error) {
      console.error('❌ resolveAllSystemAlerts failed:', error)
      return false
    }
  }

  /**
   * Récupère la liste des messages internes destinés au super administrateur.
   */
  static async getInboxMessages(userId: string, limit = 50): Promise<SuperAdminInboxMessage[]> {
    try {
      return await SuperAdminDashboardApi.getInboxMessages(userId, { limit })
    } catch (error) {
      console.error('❌ getInboxMessages failed:', error)
      return []
    }
  }

  /**
   * Marque un message interne comme lu.
   */
  static async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.markMessageAsRead(messageId)
      return true
    } catch (error) {
      console.error('❌ markMessageAsRead failed:', error)
      return false
    }
  }

  /**
   * Marque tous les messages d'un utilisateur comme lus.
   */
  static async markAllMessagesAsRead(userId: string): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.markAllMessagesAsRead(userId)
      return true
    } catch (error) {
      console.error('❌ markAllMessagesAsRead failed:', error)
      return false
    }
  }

  /**
   * Met à jour le statut applicatif d'un message (archivé, supprimé...).
   */
  static async updateMessageStatus(messageId: string, status: 'active' | 'archived' | 'deleted'): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.updateMessageStatus(messageId, status)
      return true
    } catch (error) {
      console.error('❌ updateMessageStatus failed:', error)
      return false
    }
  }

  /**
   * Envoie un message interne à un destinataire identifié.
   */
  static async sendInternalMessage(payload: SendInternalMessageInput): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.sendInternalMessage({
        senderId: payload.senderId,
        recipientId: payload.recipientId,
        subject: payload.subject,
        message: payload.content,
        priority: payload.priority,
        category: payload.category,
        parentMessageId: payload.parentMessageId
      })
      return true
    } catch (error) {
      console.error('❌ sendInternalMessage failed:', error)
      return false
    }
  }

  /**
   * Récupère l'activité récente (commandes, alertes, messages).
   */
  static async getRecentActivities(limit = 20): Promise<SuperAdminActivity[]> {
    try {
      return await SuperAdminDashboardApi.getActivities(limit)
    } catch (error) {
      console.error('❌ getRecentActivities failed:', error)
      return []
    }
  }

  /**
   * Retourne la liste des contacts administrateur.
   */
  static async getAdminContacts(): Promise<SuperAdminTeamContact[]> {
    try {
      return await SuperAdminDashboardApi.getContacts()
    } catch (error) {
      console.error('❌ getAdminContacts failed:', error)
      return []
    }
  }

  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  private static enrichAttributesWithProductType(attributes: Record<string, any> | null | undefined, productType?: 'simple' | 'variable') {
    return {
      ...(attributes ?? {}),
      productType: productType ?? (attributes as any)?.productType ?? 'simple'
    }
  }

  private static sanitizeVariations(variations?: CreateSuperAdminProductInput['variations']) {
    if (!Array.isArray(variations)) return undefined

    return variations.map((variation) => {
      const { id, metadata, stockQuantity, price, salePrice, attributes, ...rest } = variation ?? {}
      const image = (variation as any)?.image

      const sanitizedId = typeof id === 'string' && this.UUID_REGEX.test(id) ? id : undefined
      const normalizedMetadata = image
        ? { ...(metadata ?? {}), image }
        : metadata ?? undefined

      return {
        ...rest,
        ...(sanitizedId ? { id: sanitizedId } : {}),
        price: price ?? null,
        salePrice: salePrice ?? null,
        stockQuantity: stockQuantity ?? null,
        attributes: attributes ?? undefined,
        metadata: normalizedMetadata
      }
    })
  }

  private static prepareCreatePayload(payload: CreateSuperAdminProductInput) {
    const { productType, variations, attributes, ...rest } = payload

    return {
      ...rest,
      attributes: this.enrichAttributesWithProductType(attributes, productType),
      variations: this.sanitizeVariations(variations)
    }
  }

  private static prepareUpdatePayload(payload: UpdateSuperAdminProductInput) {
    const { productType, variations, attributes, ...rest } = payload

    return {
      ...rest,
      attributes: this.enrichAttributesWithProductType(attributes, productType),
      variations: this.sanitizeVariations(variations)
    }
  }

  /**
   * Liste les produits avec filtres et pagination.
   */
  static async getProducts(options: ProductQueryOptions = {}): Promise<{ items: SuperAdminProduct[]; count: number }> {
    try {
      const { items, count } = await SuperAdminDashboardApi.getProducts(options)
      return {
        items: (items ?? []).map((product) => this.mapProduct(product)),
        count: count ?? 0
      }
    } catch (error) {
      console.error('❌ getProducts failed:', error)
      return { items: [], count: 0 }
    }
  }

  /**
   * Récupère un produit unique (format partagé) pour pré-remplir les formulaires d’édition avancée.
   */
  static async getProductById(productId: string): Promise<SharedProduct | null> {
    try {
      return await SuperAdminDashboardApi.getProductById(productId)
    } catch (error) {
      console.error('❌ getProductById failed:', error)
      return null
    }
  }

  /**
   * Crée un nouveau produit côté super-admin.
   */
  static async createProduct(payload: CreateSuperAdminProductInput): Promise<SuperAdminProduct | null> {
    try {
      const prepared = this.prepareCreatePayload({
        source: payload.source ?? 'super_admin',
        ...payload
      })

      const product = await SuperAdminDashboardApi.createProduct(prepared)

      return product ? this.mapProduct(product) : null
    } catch (error) {
      console.error('❌ createProduct failed:', error)
      throw error
    }
  }

  /**
   * Met à jour un produit existant.
   */
  static async updateProduct(payload: UpdateSuperAdminProductInput): Promise<SuperAdminProduct | null> {
    try {
      const prepared = this.prepareUpdatePayload(payload)

      const product = await SuperAdminDashboardApi.updateProduct(prepared)

      return product ? this.mapProduct(product) : null
    } catch (error) {
      console.error('❌ updateProduct failed:', error)
      throw error
    }
  }

  /**
   * Duplique un produit complet.
   */
  static async duplicateProduct(payload: DuplicateProductInput): Promise<SuperAdminProduct | null> {
    try {
      const product = await SuperAdminDashboardApi.duplicateProduct(payload)
      return this.mapProduct(product)
    } catch (error) {
      console.error('❌ duplicateProduct failed:', error)
      return null
    }
  }

  /**
   * Signale un produit et journalise la modération.
   */
  static async reportProduct(payload: ReportProductInput): Promise<SuperAdminProduct | null> {
    try {
      const product = await SuperAdminDashboardApi.reportProduct(payload)
      return this.mapProduct(product)
    } catch (error) {
      console.error('❌ reportProduct failed:', error)
      return null
    }
  }

  /**
   * Applique une action de masse et retourne le compteur impacté.
   */
  static async bulkProductAction(payload: ProductBulkActionRequest): Promise<number> {
    try {
      const result = await SuperAdminDashboardApi.bulkProductAction(payload)
      return result?.affected ?? 0
    } catch (error) {
      console.error('❌ bulkProductAction failed:', error)
      return 0
    }
  }

  /**
   * Supprime un produit.
   */
  static async deleteProduct(productId: string): Promise<boolean> {
    try {
      await SuperAdminDashboardApi.deleteProduct(productId)
      return true
    } catch (error) {
      console.error('❌ deleteProduct failed:', error)
      return false
    }
  }

  /**
   * Récupère les statistiques globales déjà calculées côté serveur.
   */
  static async getAnalyticsStats(): Promise<SuperAdminOverviewStats> {
    return this.getOverviewStats()
  }

  /**
   * Marque une alerte donnée avec un statut précis.
   */
  private static async updateAlertStatus(alertId: string, status: 'resolved' | 'ignored'): Promise<boolean> {
    try {
      // Le backend (table system_alerts) ne différencie pas "ignored" et "resolved".
      // On normalise côté client pour garantir une synchronisation DB/UI cohérente.
      const normalizedStatus = status === 'ignored' ? 'resolved' : status
      await SuperAdminDashboardApi.updateSystemAlertStatus(alertId, normalizedStatus)
      return true
    } catch (error) {
      console.error('❌ updateAlertStatus failed:', error)
      return false
    }
  }

}
