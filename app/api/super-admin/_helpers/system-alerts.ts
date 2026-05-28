import { getSupabaseAdmin } from '@/lib/supabase'
import type { SuperAdminSystemAlert } from '@/lib/services/super-admin-dashboard-service'

export interface CreateSystemAlertAdminInput {
  title: string
  message: string
  severity?: SuperAdminSystemAlert['type']
  priority?: SuperAdminSystemAlert['priority']
  status?: SuperAdminSystemAlert['status']
  actionRequired?: boolean
  targetRoles?: string[]
}

export type UpdateSystemAlertStatus = SuperAdminSystemAlert['status']

interface SystemAlertRow {
  id: string
  title: string
  message: string
  severity: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
  action_required: boolean | null
  target_roles: unknown
}

const toAlertStatus = (isActive: boolean | null): SuperAdminSystemAlert['status'] => (isActive ? 'active' : 'resolved')

const severityToPriority = (severity: string | null): SuperAdminSystemAlert['priority'] => {
  switch (severity) {
    case 'critical':
      return 'high'
    case 'warning':
      return 'medium'
    case 'info':
    default:
      return 'low'
  }
}

const priorityToSeverity = (priority: SuperAdminSystemAlert['priority']): SuperAdminSystemAlert['type'] => {
  switch (priority) {
    case 'high':
      return 'critical'
    case 'medium':
      return 'warning'
    case 'low':
    default:
      return 'info'
  }
}

const ensureStringArray = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as string[]
  }
  return []
}

const mapSystemAlertRow = (row: SystemAlertRow): SuperAdminSystemAlert => ({
  id: row.id,
  type: ((row.severity as SuperAdminSystemAlert['type']) ?? 'info'),
  title: row.title,
  message: row.message,
  priority: severityToPriority(row.severity),
  status: toAlertStatus(row.is_active ?? true),
  created_at: row.created_at,
  updated_at: row.updated_at,
  action_required: Boolean(row.action_required),
  target_roles: ensureStringArray(row.target_roles)
})

/**
 * Récupère les alertes système en base avec filtres facultatifs.
 */
export async function fetchSystemAlertsAdmin(options: {
  limit?: number
  status?: SuperAdminSystemAlert['status']
  priority?: SuperAdminSystemAlert['priority']
} = {}): Promise<SuperAdminSystemAlert[]> {
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('system_alerts' as any)
    .select('id,title,message,severity,is_active,created_at,updated_at,action_required,target_roles')
    .order('created_at', { ascending: false })

  if (options.status) {
    query = query.eq('is_active', options.status === 'active')
  }

  if (options.priority) {
    query = query.eq('severity', priorityToSeverity(options.priority))
  }

  if (typeof options.limit === 'number' && Number.isFinite(options.limit)) {
    query = query.limit(Math.max(1, options.limit))
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Chargement des alertes échoué: ${error.message}`)
  }

  return (data ?? []).map((row) => mapSystemAlertRow(row as SystemAlertRow))
}

/**
 * Crée une alerte système à partir du client Supabase admin.
 */
export async function createSystemAlertAdmin(payload: CreateSystemAlertAdminInput): Promise<SuperAdminSystemAlert> {
  const supabase = getSupabaseAdmin()

  const resolvedSeverity = payload.severity ?? (payload.priority ? priorityToSeverity(payload.priority) : 'info')

  const insertPayload = {
    title: payload.title,
    message: payload.message,
    severity: resolvedSeverity,
    is_active: payload.status ? payload.status === 'active' : true,
    action_required: payload.actionRequired ?? false,
    target_roles: payload.targetRoles ?? [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('system_alerts' as any)
    .insert(insertPayload)
    .select('id,title,message,severity,is_active,created_at,updated_at,action_required,target_roles')
    .single()

  if (error || !data) {
    throw new Error(`Création de l'alerte échouée: ${error?.message ?? 'erreur inconnue'}`)
  }

  return mapSystemAlertRow(data as SystemAlertRow)
}

/**
 * Met à jour le statut d'une alerte système.
 */
export async function updateSystemAlertStatusAdmin(alertId: string, status: UpdateSystemAlertStatus): Promise<SuperAdminSystemAlert> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('system_alerts' as any)
    .update({ is_active: status === 'active', updated_at: new Date().toISOString() })
    .eq('id', alertId)
    .select('id,title,message,severity,is_active,created_at,updated_at,action_required,target_roles')
    .single()

  if (error || !data) {
    throw new Error(`Mise à jour du statut échouée: ${error?.message ?? 'erreur inconnue'}`)
  }

  return mapSystemAlertRow(data as SystemAlertRow)
}

/**
 * Augmente la priorité d'une alerte (escalade) et retourne sa nouvelle valeur.
 */
export async function escalateSystemAlertAdmin(alertId: string): Promise<SuperAdminSystemAlert> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('system_alerts' as any)
    .select('id,title,message,severity,is_active,created_at,updated_at,action_required,target_roles')
    .eq('id', alertId)
    .single()

  if (error || !data) {
    throw new Error(`Alerte introuvable: ${error?.message ?? 'erreur inconnue'}`)
  }

  const current = mapSystemAlertRow(data as SystemAlertRow)
  const nextSeverityOrder: Record<SuperAdminSystemAlert['type'], SuperAdminSystemAlert['type']> = {
    info: 'warning',
    warning: 'critical',
    critical: 'critical'
  }

  const nextSeverity = nextSeverityOrder[current.type]

  const { data: updated, error: updateError } = await supabase
    .from('system_alerts' as any)
    .update({ severity: nextSeverity, updated_at: new Date().toISOString() })
    .eq('id', alertId)
    .select('id,title,message,severity,is_active,created_at,updated_at,action_required,target_roles')
    .single()

  if (updateError || !updated) {
    throw new Error(`Escalade de l'alerte échouée: ${updateError?.message ?? 'erreur inconnue'}`)
  }

  return mapSystemAlertRow(updated as SystemAlertRow)
}

/**
 * Supprime définitivement une alerte système.
 */
export async function deleteSystemAlertAdmin(alertId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('system_alerts' as any).delete().eq('id', alertId)

  if (error) {
    throw new Error(`Suppression de l'alerte échouée: ${error.message}`)
  }
}

/**
 * Marque l'ensemble des alertes actives comme résolues.
 */
export async function resolveAllSystemAlertsAdmin(): Promise<number> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('system_alerts' as any)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('is_active', true)
    .select('id')

  if (error) {
    throw new Error(`Résolution des alertes actives échouée: ${error.message}`)
  }

  return Array.isArray(data) ? data.length : 0
}
