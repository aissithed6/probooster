import { getSupabaseAdmin } from '@/lib/supabase'
import type {
  SuperAdminActivity,
  SuperAdminInboxMessage,
  SuperAdminOverviewStats,
  SuperAdminPermission,
  SuperAdminRole,
  SuperAdminSupportTicket,
  SuperAdminSystemAlert,
  SuperAdminTeamContact,
  SuperAdminUserSummary
} from '@/lib/services/super-admin-dashboard-service'

type DbUser = {
  id: string
  email: string
  role: string
  status: string | null
  account_type: string | null
  is_verified: boolean | null
  has_2fa: boolean | null
  points_balance: number | null
  last_active_at: string | null
  created_at: string
  user_profiles?: Array<{
    first_name: string | null
    last_name: string | null
    phone: string | null
    city: string | null
    country: string | null
  }> | {
    first_name: string | null
    last_name: string | null
    phone: string | null
    city: string | null
    country: string | null
  } | null
  loyalty_points?: Array<{
    points_balance: number | null
    points_earned: number | null
    points_spent: number | null
  }> | {
    points_balance: number | null
    points_earned: number | null
    points_spent: number | null
  } | null
}

const extractProfile = (
  profile: DbUser['user_profiles'] extends Array<infer P>
    ? P | null | undefined
    : DbUser['user_profiles'] extends infer P2
      ? P2 | null | undefined
      : null | undefined
): { firstName: string | null; lastName: string | null } => {
  if (!profile || typeof profile !== 'object') {
    return { firstName: null, lastName: null }
  }

  const firstName = 'first_name' in profile ? profile.first_name : null
  const lastName = 'last_name' in profile ? profile.last_name : null

  return { firstName, lastName }
}

/**
 * Récupère les statistiques agrégées du tableau de bord Super Admin côté serveur.
 */
export async function fetchOverviewStats(
  userId?: string,
  options?: { debug?: boolean }
): Promise<SuperAdminOverviewStats & { _debug?: any }> {
  const supabase = getSupabaseAdmin()

  try {
    const now = new Date()
    const from12Months = new Date(now)
    from12Months.setMonth(from12Months.getMonth() - 12)
    const from12MonthsIso = from12Months.toISOString()

    const safeCount = (value: unknown): number => {
      const n = Number(value)
      return Number.isFinite(n) && n >= 0 ? n : 0
    }

    const safeSum = (value: unknown): number => {
      const n = Number(value)
      return Number.isFinite(n) ? n : 0
    }

    const pickAggregateValue = (row: any, keys: string[]): unknown => {
      if (!row || typeof row !== 'object') return null
      for (const key of keys) {
        if (key in row) return (row as any)[key]
      }
      return null
    }

    const unwrapAggregateRow = (result: any): any => {
      if (!result) return null
      const data = (result as any)?.data
      if (Array.isArray(data)) return data[0] ?? null
      return (data as any)?.[0] ?? data ?? null
    }

    const hasPgError = (result: any): boolean => Boolean((result as any)?.error)

    const sumFromAggregateRow = (row: any, baseName: string): number => {
      return safeSum(
        pickAggregateValue(row, [
          baseName,
          `${baseName}_sum`,
          'sum',
          `${baseName}.sum`
        ])
      )
    }

    const debugEnabled = Boolean(options?.debug)
    const debug: any = debugEnabled
      ? {
          sums: {},
          counts: {},
          meta: {
            from12MonthsIso
          }
        }
      : null

    /** Calcule un total par pagination (best-effort) pour une table, avec fallback pagination si nécessaire. */
    const safeSumTable = async (params: {
      table: string
      sumSelect: string
      valueKey: string
      countSelect?: string
      filters?: (query: any) => any
      pageSelect?: string
      dateColumns?: string[]
      fromIso?: string
    }): Promise<number> => {
      const applyBaseFilters = (query: any) => (typeof params.filters === 'function' ? params.filters(query) : query)

      const applyDateFilter = (query: any, column?: string) => {
        if (!params.fromIso || !column) return query
        return query.gte(column, params.fromIso)
      }

      const buildQuery = (dateColumn?: string) => {
        const base = applyBaseFilters(supabase.from(params.table as any))
        return applyDateFilter(base, dateColumn)
      }

      const tryWithDateColumn = async (dateColumn?: string): Promise<number | null> => {
        try {
          const countRes = await buildQuery(dateColumn).select(params.countSelect ?? 'id', { count: 'exact', head: true })
          const totalRows = safeCount((countRes as any)?.count)
          if (debugEnabled) {
            debug.sums[params.table] = {
              ...(debug.sums[params.table] ?? {}),
              dateColumn: dateColumn ?? null,
              aggOk: null,
              aggError: null,
              countOk: !(countRes as any)?.error,
              countError: (countRes as any)?.error ?? null,
              totalRows
            }
          }
          if (totalRows <= 0) return 0
          if (totalRows > 20000) return 0

          const pageSize = 5000
          let offset = 0
          let sum = 0
          const pageSelect = params.pageSelect ?? params.valueKey

          while (offset < totalRows) {
            const page = await buildQuery(dateColumn)
              .select(pageSelect)
              .range(offset, Math.min(offset + pageSize - 1, totalRows - 1))

            if ((page as any)?.error) {
              if (debugEnabled) {
                debug.sums[params.table] = {
                  ...(debug.sums[params.table] ?? {}),
                  dateColumn: dateColumn ?? null,
                  pageOk: false,
                  pageError: (page as any)?.error ?? null,
                  offset
                }
              }
              break
            }
            const rows = Array.isArray((page as any)?.data) ? (page as any).data : []
            for (const r of rows) {
              sum += safeSum((r as any)?.[params.valueKey])
            }
            offset += pageSize
          }

          if (debugEnabled) {
            debug.sums[params.table] = {
              ...(debug.sums[params.table] ?? {}),
              dateColumn: dateColumn ?? null,
              pageOk: true,
              pageError: null,
              sum
            }
          }

          return Math.max(0, sum)
        } catch {
          return null
        }
      }

      const candidates = Array.isArray(params.dateColumns) && params.dateColumns.length > 0 ? params.dateColumns : [undefined as any]
      for (const col of candidates) {
        const res = await tryWithDateColumn(col)
        if (typeof res === 'number') {
          if (res > 0) return res
          // si 0, on continue pour essayer une autre colonne de date (au cas où)
          // mais on garde le 0 comme fallback si toutes échouent.
        }
      }

      // Dernier fallback: aucune colonne date reconnue / erreurs.
      const res = await tryWithDateColumn(undefined)
      return typeof res === 'number' ? Math.max(0, res) : 0
    }

    const [
      usersCount,
      vendorsCount,
      pendingVendorsCount,
      alertsCount,
      productsCount,
      ordersInProgressCount,
      financeTxGrossSum,
      financeRefundsSum,
      legacyUsersPointsSum,
      unreadMessagesCount
    ] = await Promise.all([
      // Utilisateurs
      supabase.from('users').select('id', { count: 'exact', head: true }),
      // Vendeurs total
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'vendor'),
      // Vendeurs en attente d'approbation (règle utilisée dans l'UI: role=vendor + status=pending)
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'vendor').eq('status', 'pending'),
      // Alertes système
      // On cible d'abord le statut utilisé côté UI (status='active') puis fallback sur is_active.
      supabase.from('system_alerts' as any).select('id', { count: 'exact', head: true }).eq('status', 'active'),
      // Produits
      supabase.from('user_products').select('id', { count: 'exact', head: true }),
      // Commandes en cours (statuts non terminaux + paiement non annulé)
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', '(cancelled,returned)')
        .not('payment_status', 'in', '(failed,refunded,cancelled)'),
      // Ventes brutes (finance): somme des transactions payées sur 12 mois.
      safeSumTable({
        table: 'finance_transactions',
        sumSelect: 'gross_amount.sum()' as any,
        valueKey: 'gross_amount',
        pageSelect: 'gross_amount',
        fromIso: from12MonthsIso,
        dateColumns: ['occurred_at', 'paid_at', 'created_at', 'transaction_date']
      }),
      // Remboursements (finance): somme des remboursements résolus sur 12 mois.
      safeSumTable({
        table: 'finance_refunds',
        sumSelect: 'amount.sum()' as any,
        valueKey: 'amount',
        pageSelect: 'amount',
        filters: (q) => q.eq('status', 'resolved'),
        fromIso: from12MonthsIso,
        dateColumns: ['resolved_at', 'processed_at', 'occurred_at', 'created_at', 'opened_at', 'updated_at']
      }),
      // Fallback legacy: certaines bases stockent encore les points directement dans users.points_balance.
      // Le compteur de points dans l'en-tête applique déjà un fallback similaire (voir ClientPointsService).
      supabase.from('users').select('points_balance.sum()'),
      // Messages non lus destinés au super admin.
      // Note: on se base sur l'userId résolu via assertSuperAdmin() (utilisateur courant).
      userId
        ? supabase
            .from('user_messages')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', userId)
            .eq('is_read', false)
            .neq('status', 'deleted')
        : Promise.resolve({ count: 0 } as any)
    ])

    const totalUsers = safeCount(usersCount.count)
    const totalVendors = safeCount(vendorsCount.count)
    const pendingVendors = safeCount(pendingVendorsCount.count)

    if (debugEnabled) {
      debug.counts = {
        users: { ok: !(usersCount as any)?.error, error: (usersCount as any)?.error ?? null, count: (usersCount as any)?.count ?? null },
        vendors: { ok: !(vendorsCount as any)?.error, error: (vendorsCount as any)?.error ?? null, count: (vendorsCount as any)?.count ?? null },
        pendingVendors: {
          ok: !(pendingVendorsCount as any)?.error,
          error: (pendingVendorsCount as any)?.error ?? null,
          count: (pendingVendorsCount as any)?.count ?? null
        },
        alerts: { ok: !(alertsCount as any)?.error, error: (alertsCount as any)?.error ?? null, count: (alertsCount as any)?.count ?? null },
        products: { ok: !(productsCount as any)?.error, error: (productsCount as any)?.error ?? null, count: (productsCount as any)?.count ?? null },
        ordersInProgress: {
          ok: !(ordersInProgressCount as any)?.error,
          error: (ordersInProgressCount as any)?.error ?? null,
          count: (ordersInProgressCount as any)?.count ?? null
        },
        unreadMessages: {
          ok: !(unreadMessagesCount as any)?.error,
          error: (unreadMessagesCount as any)?.error ?? null,
          count: (unreadMessagesCount as any)?.count ?? null
        }
      }
      debug.ordersPaidAgg = { ok: null, error: null, data: null }
    }
    let systemAlerts = safeCount(alertsCount.count)
    if (systemAlerts === 0) {
      try {
        const fallbackActive = await supabase
          .from('system_alerts' as any)
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
        systemAlerts = safeCount((fallbackActive as any)?.count)
      } catch {
        systemAlerts = 0
      }
    }
    const totalProducts = safeCount(productsCount.count)
    const totalOrders = safeCount(ordersInProgressCount.count)

    // CA total legacy (orders) sans agrégats PostgREST: pagination + somme côté serveur.
    const safeSumPaidOrders = async (): Promise<number> => {
      try {
        const countRes = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'completed')

        const totalRows = safeCount((countRes as any)?.count)
        if (totalRows <= 0) return 0
        if (totalRows > 20000) return 0

        const pageSize = 5000
        let offset = 0
        let sum = 0

        while (offset < totalRows) {
          const page = await supabase
            .from('orders')
            .select('final_total,total_amount')
            .eq('payment_status', 'completed')
            .range(offset, Math.min(offset + pageSize - 1, totalRows - 1))

          if ((page as any)?.error) {
            if (debugEnabled) {
              debug.ordersPaidAgg = {
                ok: false,
                error: (page as any)?.error ?? null,
                data: null
              }
            }
            break
          }

          const rows = Array.isArray((page as any)?.data) ? (page as any).data : []
          for (const r of rows) {
            const v = (r as any)?.final_total ?? (r as any)?.total_amount
            sum += safeSum(v)
          }

          offset += pageSize
        }

        if (debugEnabled) {
          debug.ordersPaidAgg = { ok: true, error: null, data: { totalRows, sum } }
        }
        return Math.max(0, sum)
      } catch (e) {
        if (debugEnabled) {
          debug.ordersPaidAgg = { ok: false, error: (e as any)?.message ?? String(e), data: null }
        }
        return 0
      }
    }

    const legacyOrdersRevenue = await safeSumPaidOrders()

    const grossRevenue = Math.max(0, safeSum(financeTxGrossSum))
    const refundsRevenue = Math.max(0, safeSum(financeRefundsSum))
    const netRevenue = Math.max(0, grossRevenue - refundsRevenue)

    // Compat: totalRevenue historique = CA net (si on a des données finance), sinon fallback orders.
    const totalRevenue = grossRevenue > 0 || refundsRevenue > 0 ? netRevenue : legacyOrdersRevenue

    // Points en circulation (aligné sur l'app):
    // 1) loyalty_points.points_balance (+ frozen_points si la colonne existe)
    // 2) loyalty_members.total_points (si le système fidélité est basé sur loyalty_members)
    // 3) users.points_balance (legacy)
    // 4) user_points.points (legacy)
    let totalFromLoyalty = 0
    try {
      // Tentative complète (avec frozen_points)
      const loyaltyAgg = await supabase.from('loyalty_points').select('points_balance.sum(),frozen_points.sum()')
      if (!hasPgError(loyaltyAgg)) {
        const row = unwrapAggregateRow(loyaltyAgg)
        const bal = sumFromAggregateRow(row, 'points_balance')
        const frozen = sumFromAggregateRow(row, 'frozen_points')
        totalFromLoyalty = Math.max(0, bal + frozen)
      } else {
        // Fallback si colonne frozen_points ou table non dispo
        const loyaltyAggMinimal = await supabase.from('loyalty_points').select('points_balance.sum()')
        if (!hasPgError(loyaltyAggMinimal)) {
          const row = unwrapAggregateRow(loyaltyAggMinimal)
          totalFromLoyalty = Math.max(0, sumFromAggregateRow(row, 'points_balance'))
        }
      }
    } catch {
      totalFromLoyalty = 0
    }

    let totalFromMembers = 0
    if (totalFromLoyalty === 0) {
      try {
        const membersAgg = await supabase.from('loyalty_members').select('total_points.sum()')
        if (!hasPgError(membersAgg)) {
          const row = unwrapAggregateRow(membersAgg)
          totalFromMembers = Math.max(0, sumFromAggregateRow(row, 'total_points'))
        }
      } catch {
        totalFromMembers = 0
      }
    }

    // Fallback ultra fiable: si les agrégats renvoient 0 alors que la table contient des lignes,
    // on calcule le total par pagination (points_balance + frozen_points si disponible).
    if (totalFromLoyalty === 0) {
      try {
        const countRes = await supabase.from('loyalty_points').select('user_id', { count: 'exact', head: true })
        const totalRows = safeCount(countRes.count)
        // Seuil de sécurité: évite de charger une table énorme.
        // Ajustable si nécessaire, mais couvre largement la plupart des bases e-commerce.
        if (totalRows > 0 && totalRows <= 20000) {
          const pageSize = 5000
          let offset = 0
          let sum = 0
          while (offset < totalRows) {
            const page = await supabase
              .from('loyalty_points')
              .select('points_balance,frozen_points')
              .range(offset, Math.min(offset + pageSize - 1, totalRows - 1))

            if ((page as any)?.error) {
              // Si frozen_points n'existe pas, on retente sans.
              const pageMinimal = await supabase
                .from('loyalty_points')
                .select('points_balance')
                .range(offset, Math.min(offset + pageSize - 1, totalRows - 1))

              if ((pageMinimal as any)?.error) {
                break
              }

              const rows = Array.isArray((pageMinimal as any)?.data) ? (pageMinimal as any).data : []
              for (const r of rows) {
                sum += safeSum((r as any)?.points_balance)
              }
            } else {
              const rows = Array.isArray((page as any)?.data) ? (page as any).data : []
              for (const r of rows) {
                sum += safeSum((r as any)?.points_balance) + safeSum((r as any)?.frozen_points)
              }
            }

            offset += pageSize
          }

          if (sum > 0) {
            totalFromLoyalty = Math.max(0, sum)
          }
        }
      } catch {
        // ignore
      }
    }

    const legacyRow = Array.isArray((legacyUsersPointsSum as any)?.data)
      ? (legacyUsersPointsSum as any).data[0]
      : (legacyUsersPointsSum as any)?.data?.[0]
    const legacySum = safeSum(pickAggregateValue(legacyRow, ['points_balance', 'points_balance_sum', 'sum', 'points_balance.sum']))

    let legacyUserPointsSum = 0
    try {
      const legacyUserPointsTableSum = await supabase.from('user_points').select('points.sum()')
      if (!(legacyUserPointsTableSum as any)?.error) {
        const legacyUserPointsRow = unwrapAggregateRow(legacyUserPointsTableSum)
        legacyUserPointsSum = sumFromAggregateRow(legacyUserPointsRow, 'points')
      }
    } catch {
      legacyUserPointsSum = 0
    }

    // Alignement: loyalty_points -> loyalty_members -> users.points_balance -> user_points.points.
    const totalPoints =
      totalFromLoyalty > 0
        ? totalFromLoyalty
        : totalFromMembers > 0
          ? totalFromMembers
        : legacySum > 0
          ? Math.max(0, legacySum)
          : Math.max(0, legacyUserPointsSum)

    const payload: SuperAdminOverviewStats & { _debug?: any } = {
      totalUsers,
      activeUsers: totalUsers,
      totalVendors,
      pendingVendors,
      totalRevenue,
      revenueGross: grossRevenue > 0 || refundsRevenue > 0 ? grossRevenue : legacyOrdersRevenue,
      revenueRefunds: grossRevenue > 0 || refundsRevenue > 0 ? refundsRevenue : 0,
      revenueNet: totalRevenue,
      conversionRate: 0,
      totalProducts,
      totalOrders,
      totalPoints,
      unreadMessages: safeCount((unreadMessagesCount as any)?.count),
      systemAlerts
    }

    if (debugEnabled) {
      payload._debug = debug
    }

    return payload
  } catch (error) {
    console.error('❌ fetchOverviewStats failed:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0,
      revenueGross: 0,
      revenueRefunds: 0,
      revenueNet: 0,
      totalVendors: 0,
      pendingVendors: 0,
      conversionRate: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalPoints: 0,
      unreadMessages: 0,
      systemAlerts: 0
    }
  }
}

/**
 * Récupère et assemble les activités récentes (commandes, alertes, messages).
 */
export async function fetchRecentActivities(limit = 20): Promise<SuperAdminActivity[]> {
  const supabase = getSupabaseAdmin()

  try {
    const [ordersResult, alertsResult, messagesResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('system_alerts' as any)
        .select('id, title, severity, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('user_messages')
        .select('id, subject, content, priority, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
    ])

    const formatAmount = (value: unknown): string => {
      const numeric = Number(value)
      if (Number.isNaN(numeric)) {
        return 'Montant indisponible'
      }
      return `${numeric.toLocaleString('fr-FR')} FCFA`
    }

    const orderActivities: SuperAdminActivity[] = (ordersResult.data ?? []).map((order: any) => ({
      id: `order-${order.id}`,
      type: 'order',
      title: `Commande ${order.order_number ?? order.id}`,
      description: `Montant : ${formatAmount(order.total_amount)}`,
      timestamp: order.created_at ?? new Date().toISOString(),
      priority: 'medium',
      status: order.status ?? 'pending'
    }))

    const alertActivities: SuperAdminActivity[] = (alertsResult.data ?? []).map((alert: any) => ({
      id: `alert-${alert.id}`,
      type: 'alert',
      title: alert.title ?? 'Alerte système',
      description: `Gravité : ${alert.severity ?? 'info'}`,
      timestamp: alert.created_at ?? new Date().toISOString(),
      priority: alert.severity === 'critical' ? 'high' : alert.severity === 'warning' ? 'medium' : 'low',
      status: alert.is_active ? 'active' : 'resolved'
    }))

    const messageActivities: SuperAdminActivity[] = (messagesResult.data ?? []).map((message: any) => ({
      id: `message-${message.id}`,
      type: 'message',
      title: message.subject ?? 'Message interne',
      description: message.content ? String(message.content).slice(0, 140) : 'Message reçu',
      timestamp: message.created_at ?? new Date().toISOString(),
      priority:
        message.priority === 'high' || message.priority === 'urgent'
          ? 'high'
          : message.priority === 'low'
            ? 'low'
            : 'medium',
      status: message.status ?? 'active'
    }))

    return [...orderActivities, ...alertActivities, ...messageActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('❌ fetchRecentActivities failed:', error)
    return []
  }
}

/**
 * Récupère un ensemble d'utilisateurs enrichis pour la gestion Super Admin.
 */
export async function fetchUsers(limit = 50): Promise<SuperAdminUserSummary[]> {
  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
          id,
          email,
          role,
          status,
          account_type,
          is_verified,
          has_2fa,
          points_balance,
          last_active_at,
          created_at,
          user_profiles(first_name,last_name,phone,city,country),
          loyalty_points(points_balance,points_earned,points_spent)
        `
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('⚠️ fetchUsers failed:', error)
      return []
    }

    const users = (data ?? []) as DbUser[]

    return users.map<SuperAdminUserSummary>((user) => {
      const profileData = Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles
      const loyaltyData = Array.isArray(user.loyalty_points) ? user.loyalty_points[0] : user.loyalty_points

      const { firstName, lastName } = extractProfile(profileData)
      const name = [firstName, lastName].filter(Boolean).join(' ').trim()

      const joinDate = user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString()
      const accountAge = Math.max(0, Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24)))

      return {
        id: user.id,
        name: name || user.email,
        email: user.email,
        phone: profileData?.phone ?? null,
        role: (user.role as SuperAdminUserSummary['role']) ?? 'client',
        status: (user.status as SuperAdminUserSummary['status']) ?? 'pending',
        type: (user.account_type as SuperAdminUserSummary['type']) ?? 'buyer',
        joinDate,
        lastActive: user.last_active_at,
        loyaltyPoints: Number(user.points_balance ?? loyaltyData?.points_balance ?? 0),
        totalOrders: 0,
        totalSpent: 0,
        totalEarnings: 0,
        rating: null,
        isVerified: Boolean(user.is_verified),
        has2FA: Boolean(user.has_2fa),
        location: [profileData?.city, profileData?.country].filter(Boolean).join(', ') || null,
        accountAge,
        loginFrequency: 0,
        activityLevel: 'inactive',
        churnRisk: 'medium',
        profileCompletion: 0,
        engagementScore: 0,
        lastPurchaseDate: null,
        averageOrderValue: null,
        customerLifetimeValue: 0,
        timeSpentOnPlatform: null,
        productsShared: 0
      }
    })
  } catch (error) {
    console.error('❌ fetchUsers failed:', error)
    return []
  }
}

/**
 * Charge la liste des rôles disponibles via le client administrateur.
 */
export async function fetchRoles(): Promise<SuperAdminRole[]> {
  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id,name,slug,description,is_system,is_active,metadata,created_at,updated_at,user_role_assignments(id)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('⚠️ fetchRoles failed:', error)
      return []
    }

    return (data ?? []).map((role: any) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: Boolean(role.is_system),
      isActive: Boolean(role.is_active),
      metadata: role.metadata ?? {},
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      userCount: Array.isArray(role.user_role_assignments) ? role.user_role_assignments.length : 0
    }))
  } catch (error) {
    console.error('❌ fetchRoles failed:', error)
    return []
  }
}

/**
 * Charge la liste des permissions disponibles.
 */
export async function fetchPermissions(): Promise<SuperAdminPermission[]> {
  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('id,code,name,description,category,metadata')
      .order('code', { ascending: true })

    if (error) {
      console.error('⚠️ fetchPermissions failed:', error)
      return []
    }

    return (data ?? []).map((permission: any) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      description: permission.description,
      category: permission.category,
      metadata: permission.metadata ?? {}
    }))
  } catch (error) {
    console.error('❌ fetchPermissions failed:', error)
    return []
  }
}

/**
 * Récupère les tickets de support pour la supervision.
 */
export async function fetchSupportTickets(): Promise<SuperAdminSupportTicket[]> {
  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('⚠️ fetchSupportTickets failed:', error)
      return []
    }

    return (data ?? []).map((ticket: any) => ({
      id: ticket.id,
      requesterId: ticket.requester_id ?? null,
      assignedTo: ticket.assigned_to ?? null,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      tags: ticket.tags ?? [],
      metadata: ticket.metadata ?? {},
      resolutionSummary: ticket.resolution_summary ?? null,
      resolvedAt: ticket.resolved_at ?? null,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at
    }))
  } catch (error) {
    console.error('❌ fetchSupportTickets failed:', error)
    return []
  }
}

/**
 * Récupère les alertes système récentes.
 */
export async function fetchSystemAlerts(limit = 100): Promise<SuperAdminSystemAlert[]> {
  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('system_alerts' as any)
      .select('id,type,title,message,priority,status,created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('⚠️ fetchSystemAlerts: fallback empty list (table indisponible).', error)
      return []
    }

    return data ?? []
  } catch (error) {
    console.error('❌ fetchSystemAlerts failed:', error)
    return []
  }
}

/**
 * Récupère les messages internes d'un destinataire Super Admin.
 */
export async function fetchInboxMessages(recipientId: string, limit = 50): Promise<SuperAdminInboxMessage[]> {
  const supabase = getSupabaseAdmin()

  if (!recipientId) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('user_messages')
      .select('id,sender_id,recipient_id,subject,content,type,priority,status,is_read,parent_message_id,created_at')
      .eq('recipient_id', recipientId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('⚠️ fetchInboxMessages failed:', error)
      return []
    }

    const messages = data ?? []
    const senderIds = Array.from(new Set(messages.map((msg) => msg.sender_id).filter(Boolean))) as string[]

    let senderMap: Record<string, { email: string; role: string; name: string }> = {}

    if (senderIds.length > 0) {
      const { data: senders, error: sendersError } = await supabase
        .from('users')
        .select('id,email,role,user_profiles(first_name,last_name)')
        .in('id', senderIds)

      if (sendersError) {
        console.error('⚠️ fetchInboxMessages failed to load senders:', sendersError)
      } else if (senders) {
        senderMap = senders.reduce<Record<string, { email: string; role: string; name: string }>>((acc, sender: any) => {
          const profile = sender.user_profiles?.[0] ?? sender.user_profiles
          const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
          acc[sender.id] = {
            email: sender.email,
            role: sender.role,
            name: name || sender.email
          }
          return acc
        }, {})
      }
    }

    return messages.map<SuperAdminInboxMessage>((message) => {
      const senderInfo = message.sender_id ? senderMap[message.sender_id] : undefined

      const mappedPriority: SuperAdminInboxMessage['priority'] =
        message.priority === 'high' || message.priority === 'urgent'
          ? 'high'
          : message.priority === 'normal'
            ? 'medium'
            : 'low'

      return {
        id: String(message.id),
        senderId: message.sender_id ?? null,
        recipientId: message.recipient_id ?? recipientId,
        from: senderInfo?.name ?? 'Utilisateur inconnu',
        fromEmail: senderInfo?.email ?? 'inconnu',
        fromRole: senderInfo?.role ?? 'client',
        subject: message.subject ?? '(Sans objet)',
        message: message.content ?? '',
        timestamp: message.created_at ?? new Date().toISOString(),
        priority: mappedPriority,
        category: message.type ?? 'general',
        isRead: Boolean(message.is_read),
        status: (message.status as SuperAdminInboxMessage['status']) ?? 'active',
        parentMessageId: message.parent_message_id ?? null
      }
    })
  } catch (error) {
    console.error('❌ fetchInboxMessages failed:', error)
    return []
  }
}

/**
 * Récupère la liste des contacts administrateurs disponibles.
 */
export async function fetchAdminContacts(): Promise<SuperAdminTeamContact[]> {
  const supabase = getSupabaseAdmin()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,email,role,user_profiles(first_name,last_name)')
      .in('role', ['admin'])
      .order('email')

    if (error) {
      console.error('⚠️ fetchAdminContacts failed:', error)
      return []
    }

    return (data ?? []).map((user: any) => {
      const profile = user.user_profiles?.[0] ?? user.user_profiles
      const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: name || user.email
      }
    })
  } catch (error) {
    console.error('❌ fetchAdminContacts failed:', error)
    return []
  }
}
