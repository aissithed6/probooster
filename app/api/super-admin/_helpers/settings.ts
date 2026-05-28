import { getSupabaseAdmin } from '@/lib/supabase'

export type SettingsScope = 'global' | 'vendor' | 'admin'

type SupabaseSettingsRow = {
  scope: SettingsScope
  settings: Record<string, unknown> | null
}

export interface SuperAdminSettingsRecord {
  scope: SettingsScope
  settings: Record<string, unknown>
}

export async function fetchSettingsAdmin(scopes?: SettingsScope[]): Promise<SuperAdminSettingsRecord[]> {
  const supabase = getSupabaseAdmin()

  let query = supabase.from('super_admin_settings').select('scope, settings')

  if (scopes && scopes.length > 0) {
    query = query.in('scope', scopes)
  }

  const { data, error } = await query.returns<SupabaseSettingsRow[]>()

  if (error) {
    throw new Error(`Impossible de récupérer les réglages: ${error.message}`)
  }

  return (data ?? []).map<SuperAdminSettingsRecord>((row) => ({
    scope: row.scope,
    settings: row.settings ?? {}
  }))
}

export async function updateSettingsAdmin(
  scope: SettingsScope,
  settings: Record<string, unknown>,
  updatedBy?: string
): Promise<SuperAdminSettingsRecord> {
  const supabase = getSupabaseAdmin()

  const payload = {
    settings,
    ...(updatedBy ? { updated_by: updatedBy } : {})
  }

  const { data, error } = await supabase
    .from('super_admin_settings')
    .upsert({ scope, ...payload }, { onConflict: 'scope' })
    .select('scope, settings')
    .eq('scope', scope)
    .single()
    .returns<SupabaseSettingsRow>()

  if (error || !data) {
    throw new Error(`Impossible de mettre à jour les réglages: ${error?.message ?? 'erreur inconnue'}`)
  }

  return {
    scope: data.scope,
    settings: data.settings ?? {}
  }
}
