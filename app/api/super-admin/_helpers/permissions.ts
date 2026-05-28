import { getSupabaseAdmin } from '@/lib/supabase'
import type { SuperAdminPermission } from '@/lib/services/super-admin-dashboard-service'

interface PermissionRow {
  id: string
  code: string
  name: string
  description: string | null
  category: string | null
}

/**
 * Récupère toutes les permissions disponibles côté admin.
 */
export async function fetchPermissionsAdmin(): Promise<SuperAdminPermission[]> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('permissions')
    .select('id, code, name, description, category')
    .order('code', { ascending: true })

  if (error) {
    throw new Error(`Chargement des permissions échoué: ${error.message}`)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    category: row.category,
    metadata: {}
  }))
}

/**
 * Retourne les permissions associées à un rôle spécifique.
 */
export async function fetchRolePermissionsAdmin(roleId: string): Promise<SuperAdminPermission[]> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('role_permissions')
    .select('permissions ( id, code, name, description, category )')
    .eq('role_id', roleId)

  if (error) {
    throw new Error(`Chargement des permissions du rôle échoué: ${error.message}`)
  }

  const permissions = (data ?? []).flatMap((row: any) => (row.permissions ? [row.permissions] : []))

  return permissions.map((permission: PermissionRow) => ({
    id: permission.id,
    code: permission.code,
    name: permission.name,
    description: permission.description,
    category: permission.category,
    metadata: {}
  }))
}
