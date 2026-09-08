import { supabase } from '@/lib/supabase'

export interface RoleDefinition {
  id: string
  role_code: string
  role_name: string
  description: string
  is_system: boolean
  is_active: boolean
  sections: string[]
  features: string[]
  created_at: string
  updated_at: string
}

export interface UserRoleAssignment {
  id: string
  user_id: string
  role_code: string
  assigned_by: string | null
  assigned_at: string
  is_active: boolean
}

export interface CreateRoleInput {
  role_code: string
  role_name: string
  description?: string
  sections?: string[]
  features?: string[]
  is_active?: boolean
}

export interface UpdateRoleInput {
  role_name?: string
  description?: string
  sections?: string[]
  features?: string[]
  is_active?: boolean
}

export const ALL_SECTIONS = [
  { id: 'overview', label: 'Vue d\'ensemble' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'products', label: 'Produits' },
  { id: 'orders', label: 'Commandes' },
  { id: 'deliveries', label: 'Livraisons' },
  { id: 'financial', label: 'Finances' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'loyalty', label: 'Fidélité' },
  { id: 'shares-engagement', label: 'Partages' },
  { id: 'messaging', label: 'Messagerie' },
  { id: 'reviews', label: 'Avis' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings', label: 'Configuration' },
  { id: 'automation', label: 'Automatisation' },
  { id: 'analytics', label: 'Analyses' },
  { id: 'design', label: 'Design' },
  { id: 'messages-conseils', label: 'Messages Conseils' },
  { id: 'support-videos', label: 'Vidéos Support' },
  { id: 'seller-applications', label: 'Candidatures Vendeurs' }
]

export const ALL_FEATURES = [
  'all_features',
  'view_users', 'edit_users', 'delete_users', 'create_users',
  'view_products', 'edit_products', 'delete_products', 'create_products',
  'view_orders', 'edit_orders', 'cancel_orders', 'refund_orders',
  'view_deliveries', 'assign_deliveries', 'track_deliveries', 'update_delivery_status', 'manage_drivers',
  'view_financial', 'view_reports', 'manage_payouts', 'export_reports',
  'view_marketing', 'create_promotions', 'edit_promotions', 'delete_promotions',
  'view_loyalty', 'manage_points',
  'view_shares', 'view_engagement',
  'send_messages', 'view_notifications', 'send_notifications',
  'view_reviews', 'respond_reviews',
  'view_analytics',
  'view_transactions', 'view_user_transactions'
]

class RoleService {
  async getAllRoles(): Promise<RoleDefinition[]> {
    const { data, error } = await supabase
      .from('role_definitions')
      .select('*')
      .order('role_name')
    if (error) throw error
    return data || []
  }

  async getRoleByCode(roleCode: string): Promise<RoleDefinition | null> {
    const { data, error } = await supabase
      .from('role_definitions')
      .select('*')
      .eq('role_code', roleCode)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createRole(input: CreateRoleInput): Promise<RoleDefinition> {
    const { data, error } = await supabase
      .from('role_definitions')
      .insert({
        role_code: input.role_code,
        role_name: input.role_name,
        description: input.description || '',
        sections: input.sections || [],
        features: input.features || [],
        is_active: input.is_active !== false
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateRole(roleCode: string, input: UpdateRoleInput): Promise<RoleDefinition> {
    const { data, error } = await supabase
      .from('role_definitions')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('role_code', roleCode)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async deleteRole(roleCode: string): Promise<void> {
    const { error } = await supabase
      .from('role_definitions')
      .delete()
      .eq('role_code', roleCode)
      .eq('is_system', false)
    if (error) throw error
  }

  async getUserRoles(userId: string): Promise<UserRoleAssignment[]> {
    const { data, error } = await supabase
      .from('user_role_code_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    if (error) throw error
    return data || []
  }

  async assignRoleToUser(userId: string, roleCode: string): Promise<UserRoleAssignment> {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('user_role_code_assignments')
      .upsert({
        user_id: userId,
        role_code: roleCode,
        assigned_by: user?.id || null,
        is_active: true
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async removeRoleFromUser(userId: string, roleCode: string): Promise<void> {
    const { error } = await supabase
      .from('user_role_code_assignments')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('role_code', roleCode)
    if (error) throw error
  }

  async getUserEffectiveSections(userId: string): Promise<string[]> {
    const roles = await this.getUserRoles(userId)
    const sections = new Set<string>()
    for (const role of roles) {
      const roleDef = await this.getRoleByCode(role.role_code)
      if (roleDef && roleDef.is_active) {
        roleDef.sections.forEach(s => sections.add(s))
      }
    }
    return Array.from(sections)
  }

  async getUserEffectiveFeatures(userId: string): Promise<string[]> {
    const roles = await this.getUserRoles(userId)
    const features = new Set<string>()
    for (const role of roles) {
      const roleDef = await this.getRoleByCode(role.role_code)
      if (roleDef && roleDef.is_active) {
        roleDef.features.forEach(f => features.add(f))
      }
    }
    return Array.from(features)
  }

  canAccessSection(userSections: string[], section: string): boolean {
    return userSections.includes('all_features') || userSections.includes(section)
  }

  canUseFeature(userFeatures: string[], feature: string): boolean {
    return userFeatures.includes('all_features') || userFeatures.includes(feature)
  }
}

export const roleService = new RoleService()
export default roleService
