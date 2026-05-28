import { getSupabaseAdmin } from '@/lib/supabase'

export type NotificationChannel = 'in-app' | 'email' | 'push'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface SuperAdminNotificationItem {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  userRole: string | null
  title: string
  message: string
  priority: NotificationPriority
  status: NotificationStatus
  channel: NotificationChannel
  type: string
  actionUrl: string | null
  isRead: boolean
  createdAt: string
  readAt: string | null
}

export interface SuperAdminNotificationStats {
  totalSent: number
  totalDelivered: number
  totalRead: number
  deliveryRate: number
  readRate: number
  averageDeliveryTime: number
  channelBreakdown: Record<string, number>
  priorityBreakdown: Record<string, number>
  dailyTrends: Array<{ date: string; count: number }>
  monthlyGrowth: number
}

interface UserNotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  priority: string
  action_url: string | null
  created_at: string
}

interface UserRow {
  id: string
  email: string | null
  role: string | null
}

interface UserProfileRow {
  user_id: string
  first_name: string | null
  last_name: string | null
}

const toPriority = (value: string | null): NotificationPriority => {
  switch ((value ?? '').toLowerCase()) {
    case 'urgent':
    case 'critical':
      return 'critical'
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    case 'low':
      return 'low'
    default:
      return 'medium'
  }
}

/**
 * Lit les notifications in-app depuis `user_notifications` (DB réelle).
 */
export async function fetchSuperAdminNotifications(options: {
  q?: string
  status?: 'all' | 'read' | 'unread'
  priority?: 'all' | NotificationPriority
  limit?: number
  offset?: number
} = {}): Promise<{ items: SuperAdminNotificationItem[]; count: number }> {
  const supabase = getSupabaseAdmin()

  const limit = typeof options.limit === 'number' ? Math.max(1, Math.min(options.limit, 200)) : 50
  const offset = typeof options.offset === 'number' ? Math.max(0, options.offset) : 0
  const q = (options.q ?? '').trim()

  let query = supabase
    .from('user_notifications')
    .select('id,user_id,type,title,message,is_read,priority,action_url,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q.length > 0) {
    query = query.or(`title.ilike.%${q}%,message.ilike.%${q}%`)
  }

  if (options.status === 'read') {
    query = query.eq('is_read', true)
  }
  if (options.status === 'unread') {
    query = query.eq('is_read', false)
  }

  if (options.priority && options.priority !== 'all') {
    // `user_notifications.priority` accepte (low|normal|high|urgent). On mappe.
    if (options.priority === 'low') query = query.eq('priority', 'low')
    if (options.priority === 'medium') query = query.eq('priority', 'normal')
    if (options.priority === 'high') query = query.eq('priority', 'high')
    if (options.priority === 'critical') query = query.eq('priority', 'urgent')
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Chargement des notifications échoué: ${error.message}`)
  }

  const rows = (data ?? []) as UserNotificationRow[]
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)))

  const userById = new Map<string, UserRow>()
  const profileByUserId = new Map<string, UserProfileRow>()
  if (userIds.length > 0) {
    const { data: usersData } = await supabase.from('users').select('id,email,role').in('id', userIds)
    ;(usersData ?? []).forEach((u: any) => {
      if (u?.id) userById.set(String(u.id), { id: String(u.id), email: u.email ?? null, role: u.role ?? null })
    })

    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('user_id,first_name,last_name')
      .in('user_id', userIds)
    ;(profilesData ?? []).forEach((p: any) => {
      if (p?.user_id) {
        profileByUserId.set(String(p.user_id), {
          user_id: String(p.user_id),
          first_name: p.first_name ?? null,
          last_name: p.last_name ?? null
        })
      }
    })
  }

  const items: SuperAdminNotificationItem[] = rows.map((row) => {
    const user = userById.get(row.user_id)
    const profile = profileByUserId.get(row.user_id)
    const composedName = [profile?.first_name, profile?.last_name].map((v) => (v ? String(v).trim() : '')).filter(Boolean).join(' ')
    return {
      id: row.id,
      userId: row.user_id,
      userName: composedName ? composedName : null,
      userEmail: user?.email ?? null,
      userRole: user?.role ?? null,
      title: row.title,
      message: row.message,
      priority: toPriority(row.priority ?? null),
      status: row.is_read ? 'read' : 'delivered',
      channel: 'in-app',
      type: row.type,
      actionUrl: row.action_url ?? null,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
      readAt: row.is_read ? row.created_at : null
    }
  })

  return { items, count: count ?? items.length }
}

/**
 * Calcule des stats basées sur `user_notifications`.
 * NB: en Phase 1, `delivered` est assimilé à "créée" (in-app).
 */
export async function fetchSuperAdminNotificationStats(days = 14): Promise<SuperAdminNotificationStats> {
  const supabase = getSupabaseAdmin()

  const now = new Date()
  const since = new Date(now.getTime() - Math.max(1, days) * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('user_notifications')
    .select('id,created_at,is_read,priority')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) {
    // Table existante mais erreur SQL (ou RLS). Pour super-admin on utilise service role donc OK.
    throw new Error(`Chargement des stats notifications échoué: ${error.message}`)
  }

  const rows = (data ?? []) as Array<{ id: string; created_at: string; is_read: boolean; priority: string | null }>

  const totalSent = rows.length
  const totalDelivered = rows.length
  const totalRead = rows.filter((r) => Boolean(r.is_read)).length

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
  const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0

  const channelBreakdown = { 'in-app': totalSent, email: 0, push: 0 }

  const priorityBreakdown: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 }
  for (const r of rows) {
    const p = toPriority(r.priority)
    priorityBreakdown[p] = (priorityBreakdown[p] ?? 0) + 1
  }

  const countsByDay = new Map<string, number>()
  for (const r of rows) {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1)
  }

  const dailyTrends = Array.from(countsByDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  // Pas de tracking réel de délai en Phase 1 (in-app).
  const averageDeliveryTime = 0
  const monthlyGrowth = 0

  return {
    totalSent,
    totalDelivered,
    totalRead,
    deliveryRate,
    readRate,
    averageDeliveryTime,
    channelBreakdown,
    priorityBreakdown,
    dailyTrends,
    monthlyGrowth
  }
}

/**
 * Crée une notification in-app pour un ou plusieurs utilisateurs.
 */
export async function createInAppNotificationsAdmin(payload: {
  userIds: string[]
  title: string
  message: string
  type?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string | null
}): Promise<number> {
  const supabase = getSupabaseAdmin()

  const userIds = Array.isArray(payload.userIds) ? payload.userIds.map(String).filter(Boolean) : []
  if (userIds.length === 0) {
    throw new Error('Aucun destinataire (userIds) fourni.')
  }

  const nowIso = new Date().toISOString()
  const rows = userIds.map((userId) => ({
    user_id: userId,
    type: payload.type ?? 'system',
    title: payload.title,
    message: payload.message,
    is_read: false,
    priority: payload.priority ?? 'normal',
    action_url: payload.actionUrl ?? null,
    created_at: nowIso
  }))

  const { error } = await supabase.from('user_notifications').insert(rows)
  if (error) {
    throw new Error(`Création notification échouée: ${error.message}`)
  }

  return userIds.length
}

/**
 * Marque une notification in-app comme lue.
 */
export async function markInAppNotificationReadAdmin(notificationId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('user_notifications').update({ is_read: true }).eq('id', notificationId)
  if (error) {
    throw new Error(`Mise à jour notification échouée: ${error.message}`)
  }
}

/**
 * Supprime une notification in-app.
 */
export async function deleteInAppNotificationAdmin(notificationId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('user_notifications').delete().eq('id', notificationId)
  if (error) {
    throw new Error(`Suppression notification échouée: ${error.message}`)
  }
}
