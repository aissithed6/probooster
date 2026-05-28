import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Filtre une liste de destinataires en fonction des préférences notifications
 * stockées dans `user_profiles.preferences.notifications.settings`.
 *
 * Règles:
 * - Si aucune préférence n'existe pour l'utilisateur: autorisé (par défaut).
 * - Si la clé du toggle (ex: `orders`) est à `false`: bloqué.
 * - Si `user_profiles` est absent pour un user_id (profil non créé): autorisé (best-effort).
 */
export async function filterRecipientsByNotificationPreference(params: {
  supabase: SupabaseClient
  recipientUserIds: string[]
  toggleKey: 'orders' | 'points' | 'chat' | 'promotions' | 'system' | 'ai'
}): Promise<string[]> {
  const { supabase, recipientUserIds, toggleKey } = params

  const cleaned = Array.from(new Set((recipientUserIds ?? []).map((id) => String(id ?? '').trim()))).filter(Boolean)
  if (cleaned.length === 0) return []

  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('user_id, preferences')
    .in('user_id', cleaned)

  if (error) {
    // Best-effort: en cas d'erreur de lecture, on n'empêche pas la notification.
    return cleaned
  }

  const prefByUserId = new Map<string, any>()
  for (const row of profiles ?? []) {
    const uid = String((row as any)?.user_id ?? '').trim()
    if (!uid) continue
    prefByUserId.set(uid, (row as any)?.preferences)
  }

  return cleaned.filter((uid) => {
    const preferences = prefByUserId.get(uid)
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) return true

    const notifications = (preferences as any)?.notifications
    if (!notifications || typeof notifications !== 'object' || Array.isArray(notifications)) return true

    const settings = (notifications as any)?.settings
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return true

    const value = (settings as any)?.[toggleKey]
    if (typeof value === 'boolean') return value

    return true
  })
}
