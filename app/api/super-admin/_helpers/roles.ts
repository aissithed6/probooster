import { getSupabaseAdmin } from '@/lib/supabase'
import type { SuperAdminRole } from '@/lib/services/super-admin-dashboard-service'

interface RoleRow {
  id: string
  name: string
  slug: string
  description: string | null
  is_system: boolean
  is_active: boolean
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface CreateRoleAdminInput {
  name: string
  description?: string | null
  slug?: string | null
  isActive?: boolean
  metadata?: Record<string, any>
  isSystem?: boolean
}

export type UpdateRoleAdminInput = Partial<CreateRoleAdminInput>

const ROLE_SELECT = `
  id,
  name,
  slug,
  description,
  is_system,
  is_active,
  metadata,
  created_at,
  updated_at
`

/**
 * Convertit une ligne Supabase en rôle côté domaine.
 */
const mapRoleRow = (row: RoleRow): SuperAdminRole => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  isSystem: Boolean(row.is_system),
  isActive: row.is_active ?? true,
  metadata: row.metadata ?? {},
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? row.created_at,
  userCount: 0
})

const slugify = (value: string): string => {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const resolveSlug = (payload: { name: string; slug?: string | null }): string => {
  const base = payload.slug && payload.slug.trim().length > 0 ? payload.slug : slugify(payload.name)
  if (base.length === 0) {
    return `role-${Date.now()}`
  }
  return base
}

/**
 * Récupère la liste des rôles via le client admin.
 */
export async function fetchRolesAdmin(): Promise<SuperAdminRole[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('roles')
    .select(ROLE_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Chargement des rôles échoué: ${error.message}`)
  }

  return (data ?? []).map((row) => mapRoleRow(row as RoleRow))
}

/**
 * Crée un nouveau rôle côté administrateur.
 */
export async function createRoleAdmin(payload: CreateRoleAdminInput): Promise<SuperAdminRole> {
  const supabase = getSupabaseAdmin()
  const slug = resolveSlug(payload)

  const { data, error } = await supabase
    .from('roles')
    .insert({
      name: payload.name,
      slug,
      description: payload.description ?? null,
      is_active: payload.isActive ?? true,
      is_system: payload.isSystem ?? false,
      metadata: payload.metadata ?? {}
    })
    .select(ROLE_SELECT)
    .single()

  if (error || !data) {
    throw new Error(`Création du rôle échouée: ${error?.message ?? 'erreur inconnue'}`)
  }

  return mapRoleRow(data as RoleRow)
}

/**
 * Met à jour un rôle existant et retourne sa nouvelle valeur.
 */
export async function updateRoleAdmin(roleId: string, payload: UpdateRoleAdminInput): Promise<SuperAdminRole> {
  const supabase = getSupabaseAdmin()
  const updates: Record<string, any> = {}

  if (payload.name !== undefined) updates.name = payload.name
  if (payload.description !== undefined) updates.description = payload.description ?? null
  if (payload.isActive !== undefined) updates.is_active = payload.isActive
  if (payload.metadata !== undefined) updates.metadata = payload.metadata ?? {}
  if (payload.slug !== undefined) updates.slug = resolveSlug({ name: payload.name ?? 'role', slug: payload.slug })
  if (payload.isSystem !== undefined) updates.is_system = payload.isSystem

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase.from('roles').update(updates).eq('id', roleId)
    if (updateError) {
      throw new Error(`Mise à jour du rôle échouée: ${updateError.message}`)
    }
  }

  const { data, error } = await supabase
    .from('roles')
    .select(ROLE_SELECT)
    .eq('id', roleId)
    .single()

  if (error || !data) {
    throw new Error(`Récupération du rôle échouée: ${error?.message ?? 'erreur inconnue'}`)
  }

  return mapRoleRow(data as RoleRow)
}

/**
 * Supprime un rôle et ses relations associées.
 */
export async function deleteRoleAdmin(roleId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase.from('role_permissions').delete().eq('role_id', roleId)
  await supabase.from('user_roles').delete().eq('role_id', roleId)

  const { error } = await supabase.from('roles').delete().eq('id', roleId)
  if (error) {
    throw new Error(`Suppression du rôle échouée: ${error.message}`)
  }
}

/**
 * Met à jour la liste complète des permissions d'un rôle.
 */
export async function setRolePermissionsAdmin(roleId: string, permissionCodes: string[]): Promise<string[]> {
  const supabase = getSupabaseAdmin()

  await supabase.from('role_permissions').delete().eq('role_id', roleId)

  if (!permissionCodes || permissionCodes.length === 0) {
    return []
  }

  const { data: permissions, error: fetchError } = await supabase
    .from('permissions')
    .select('id, code')
    .in('code', permissionCodes)

  if (fetchError) {
    throw new Error(`Chargement des permissions échoué: ${fetchError.message}`)
  }

  const validPermissions = (permissions ?? []).filter((permission): permission is { id: string; code: string } => Boolean(permission?.id))

  if (validPermissions.length === 0) {
    return []
  }

  const inserts = validPermissions.map((permission) => ({
    role_id: roleId,
    permission_id: permission.id
  }))

  const { error: insertError } = await supabase.from('role_permissions').insert(inserts)
  if (insertError) {
    throw new Error(`Attribution des permissions échouée: ${insertError.message}`)
  }

  return validPermissions.map((permission) => permission.code)
}
