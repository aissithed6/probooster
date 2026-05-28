import type { SupabaseClient } from '@supabase/supabase-js'

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function resolveBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return null
}

/**
 * Détermine si la collecte/consultation des analytics est autorisée pour un utilisateur.
 * Règles:
 * - Priorité à `super_admin_settings.settings.privacyPolicy.analyticsEnabled.forceValue` (si défini)
 * - Sinon: `user_profiles.preferences.privacy.analyticsEnabled` (fallback true par défaut)
 */
export async function isAnalyticsEnabled(params: { supabase: SupabaseClient; userId: string }): Promise<boolean> {
  const { supabase, userId } = params

  let policyForce: boolean | null = null
  try {
    const { data: settingsRow } = await supabase
      .from('super_admin_settings')
      .select('settings')
      .eq('scope', 'global')
      .maybeSingle()

    const settings = asObject((settingsRow as any)?.settings)
    const privacyPolicy = asObject((settings as any)?.privacyPolicy)
    const analyticsRule = asObject((privacyPolicy as any)?.analyticsEnabled)
    policyForce = resolveBoolean((analyticsRule as any)?.forceValue)
  } catch {
    // noop
  }

  if (typeof policyForce === 'boolean') {
    return policyForce
  }

  try {
    const { data: profileRow } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle()

    const prefs = asObject((profileRow as any)?.preferences)
    const privacy = asObject((prefs as any)?.privacy)
    const userValue = resolveBoolean((privacy as any)?.analyticsEnabled)
    return userValue !== null ? userValue : true
  } catch {
    return true
  }
}
