import { getSupabaseAdmin } from '../../../../lib/supabase'
import type {
  CreateSuperAdminUserInput,
  GetUsersOptions,
  SuperAdminUserStatus,
  SuperAdminUserSummary,
  UpdateSuperAdminUserInput
} from '../../../../lib/services/super-admin-dashboard-service'

type DbProfileRecord = {
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  phone: string | null
  city: string | null
  country: string | null
  bio: string | null
  website: string | null
  social_media: Record<string, unknown> | null
  preferences: Record<string, unknown> | null
  short_code: string | null
}

const matchesUserFilters = (user: SuperAdminUserSummary, options: { search?: string; role?: string; status?: string }) => {
  const wantedSearch = String(options.search ?? '').trim().toLowerCase()
  const wantedRole = normalizeRoleValue(options.role)
  const wantedStatus = normalizeRoleValue(options.status)

  if (wantedSearch) {
    const email = String(user.email ?? '').toLowerCase()
    const name = String(user.name ?? '').toLowerCase()
    if (!email.includes(wantedSearch) && !name.includes(wantedSearch)) {
      return false
    }
  }

  if (wantedRole && wantedRole !== 'all') {
    if (normalizeRoleValue(user.role) !== wantedRole) {
      return false
    }
  }

  if (wantedStatus && wantedStatus !== 'all') {
    if (normalizeRoleValue(user.status) !== wantedStatus) {
      return false
    }
  }

  return true
}

const listAuthUsersWithFilters = async (
  supabase: SupabaseAdminClient,
  options: { limit: number; offset: number; search?: string; role?: string; status?: string }
): Promise<SuperAdminUserSummary[]> => {
  const perPage = 1000
  const maxPages = 50
  const wantedStart = Math.max(options.offset, 0)
  const wantedEndExclusive = wantedStart + Math.max(options.limit, 1)

  const results: SuperAdminUserSummary[] = []
  let seenMatching = 0

  for (let page = 1; page <= maxPages; page += 1) {
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ page, perPage })
    if (authError) {
      throw new Error(`Impossible de lister les utilisateurs Auth: ${authError.message}`)
    }

    const chunk = authData?.users ?? []
    if (chunk.length === 0) break

    for (const raw of chunk) {
      const mapped = mapAuthUserToSummary(raw)
      if (!mapped.id || !mapped.email) continue
      if (!matchesUserFilters(mapped, options)) continue

      if (seenMatching >= wantedStart && results.length < Math.max(options.limit, 1)) {
        results.push(mapped)
      }
      seenMatching += 1

      if (seenMatching >= wantedEndExclusive && results.length >= Math.max(options.limit, 1)) {
        return results
      }
    }

    if (chunk.length < perPage) break
  }

  return results
}

const loadUserSummaryById = async (supabase: SupabaseAdminClient, userId: string): Promise<SuperAdminUserSummary> => {
  const [baseResult, profileResult, roleAssignmentsResult, permissionsResult, featuresResult, securityResult] = await Promise.all([
    supabase
      .from('users')
      .select('id,email,role,status,account_type,points_balance,is_verified,has_2fa,last_active_at,created_at,updated_at')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_profiles')
      .select('first_name,last_name,avatar_url,phone,city,country,bio,website,social_media,preferences,short_code')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('user_role_assignments')
      .select('role_id,assignment_source,assignment_order,roles(id,slug,name)')
      .eq('user_id', userId),
    supabase.from('user_custom_permissions').select('permission_code').eq('user_id', userId),
    supabase.from('user_features').select('feature_code,scope,enabled').eq('user_id', userId),
    supabase
      .from('user_security_settings')
      .select('two_factor_enabled,login_notifications,session_timeout')
      .eq('user_id', userId)
      .maybeSingle()
  ])

  if (baseResult.error || !baseResult.data) {
    throw new Error(`Impossible de charger l'utilisateur ${userId}: ${baseResult.error?.message ?? 'introuvable'}`)
  }

  if (profileResult.error) {
    console.warn(`⚠️ Chargement du profil utilisateur ${userId} échoué:`, profileResult.error)
  }
  if (roleAssignmentsResult.error) {
    console.warn(`⚠️ Chargement des rôles utilisateur ${userId} échoué:`, roleAssignmentsResult.error)
  }
  if (permissionsResult.error) {
    console.warn(`⚠️ Chargement des permissions utilisateur ${userId} échoué:`, permissionsResult.error)
  }
  if (featuresResult.error) {
    console.warn(`⚠️ Chargement des fonctionnalités utilisateur ${userId} échoué:`, featuresResult.error)
  }
  if (securityResult.error) {
    console.warn(`⚠️ Chargement des réglages de sécurité utilisateur ${userId} échoué:`, securityResult.error)
  }

  const record: DbUserRecord = {
    ...(baseResult.data as DbUserRecord),
    user_profiles: profileResult.data ? [profileResult.data as DbProfileRecord] : [],
    user_role_assignments: roleAssignmentsResult.data ?? [],
    user_custom_permissions: permissionsResult.data ?? [],
    user_features: featuresResult.data ?? [],
    user_security_settings: securityResult.data ? [securityResult.data as DbSecuritySettingsRecord] : []
  }

  return mapUserToSummary(record)
}

/**
 * Retrouve un utilisateur Auth par email (fallback si create/invite retourne "already registered").
 */
async function findAuthUserIdByEmail(supabase: SupabaseAdminClient, email: string): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase()

  let page = 1
  const perPage = 1000

  for (let i = 0; i < 10; i++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`Impossible de lister les utilisateurs Auth: ${error.message}`)
    }

    const users = data?.users ?? []
    const match = users.find((u) => (u.email ?? '').toLowerCase() === normalizedEmail)
    if (match?.id) {
      return match.id
    }

    if (users.length < perPage) {
      break
    }
    page += 1
  }

  return null
}

type DbRoleAssignmentRecord = {
  role_id: string
  assignment_source: string | null
  assignment_order: number | null
  roles?:
    | {
        id: string
        slug: string | null
        name: string | null
      }
    | Array<{
        id: string
        slug: string | null
        name: string | null
      }>
    | null
}

type DbCustomPermissionRecord = {
  permission_code: string
}

type DbFeatureRecord = {
  feature_code: string
  scope: string | null
  enabled: boolean | null
}

type DbSecuritySettingsRecord = {
  two_factor_enabled: boolean | null
  login_notifications: boolean | null
  session_timeout: number | null
}

type DbUserRecord = {
  id: string
  email: string
  role: string | null
  status: string | null
  account_type: string | null
  points_balance: number | null
  is_verified: boolean | null
  has_2fa: boolean | null
  created_at: string | null
  updated_at: string | null
  last_active_at: string | null
  suspended_at: string | null
  deactivated_at: string | null
  deleted_at: string | null
  user_profiles?: DbProfileRecord[] | DbProfileRecord | null
  user_role_assignments?: DbRoleAssignmentRecord[] | DbRoleAssignmentRecord | null
  user_custom_permissions?: DbCustomPermissionRecord[] | DbCustomPermissionRecord | null
  user_features?: DbFeatureRecord[] | DbFeatureRecord | null
  user_security_settings?: DbSecuritySettingsRecord[] | DbSecuritySettingsRecord | null
}

type FetchUsersAdminOptions = GetUsersOptions & {
  limit?: number
  offset?: number
}

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500
const DEFAULT_PROFILE_COUNTRY = "Bénin"
const FALLBACK_LAST_NAME = ''

/** Normalise un rôle/statut/valeur de filtre pour comparaison côté serveur. */
function normalizeRoleValue(value?: unknown): string {
  if (!value) return ''
  return String(value).toLowerCase().replace(/-/g, '_').trim()
}

const deriveRoleFromAuthUser = (authUser: any): SuperAdminUserSummary['role'] => {
  const metaCandidates = [
    authUser?.app_metadata?.role,
    authUser?.user_metadata?.role,
    authUser?.user_metadata?.account_type,
    authUser?.user_metadata?.primary_role,
    ...(Array.isArray(authUser?.app_metadata?.roles) ? authUser.app_metadata.roles : [])
  ]
    .map((item) => normalizeRoleValue(item))
    .filter(Boolean)

  const role = metaCandidates.find((candidate) => candidate.length > 0) ?? ''

  if (role === 'super_admin') return 'super_admin'
  if (role === 'admin') return 'admin'
  if (role === 'vendor') return 'vendor'
  if (role === 'client') return 'client'
  if (role === 'driver') return 'driver'
  if (role === 'ops') return 'ops'
  return 'client'
}

const mapAuthUserToSummary = (authUser: any): SuperAdminUserSummary => {
  const email = String(authUser?.email ?? '').trim()
  const id = String(authUser?.id ?? '').trim()
  const role = deriveRoleFromAuthUser(authUser)
  const statusRaw = normalizeRoleValue(authUser?.user_metadata?.status ?? authUser?.app_metadata?.status)

  const derived = deriveFallbackNames(email)

  return {
    id,
    name: email ? derived.firstName : 'Utilisateur',
    email,
    phone: null,
    role,
    status: (statusRaw as any) || 'active',
    type: role === 'vendor' ? 'vendor' : role === 'client' ? 'buyer' : 'admin',
    joinDate: String(authUser?.created_at ?? new Date().toISOString()),
    lastActive: null,
    loyaltyPoints: 0,
    totalOrders: 0,
    totalSpent: 0,
    totalEarnings: 0,
    rating: null,
    isVerified: Boolean(authUser?.email_confirmed_at),
    has2FA: false,
    location: null,
    avatar: null,
    bio: null,
    website: null,
    socialMedia: null,
    preferences: null,
    accountAge: 0,
    loginFrequency: 0,
    activityLevel: 'inactive',
    churnRisk: 'medium',
    profileCompletion: 0,
    engagementScore: 0,
    lastPurchaseDate: null,
    averageOrderValue: null,
    customerLifetimeValue: 0,
    timeSpentOnPlatform: null,
    productsShared: 0,
    secondaryRoles: [],
    customPermissions: [],
    features: [],
    securitySettings: {
      twoFactorEnabled: false,
      loginNotifications: true,
      sessionTimeout: 30
    }
  }
}

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>

const USER_SELECT = `
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
        updated_at,
        suspended_at,
        deactivated_at,
        deleted_at,
        user_profiles(
          first_name,
          last_name,
          avatar_url,
          phone,
          city,
          country,
          bio,
          website,
          social_media,
          preferences,
          verification,
          short_code
        ),
        user_role_assignments!user_role_assignments_user_id_fkey(
          role_id,
          assignment_source,
          assignment_order,
          roles (
            id,
            slug,
            name
          )
        ),
        user_custom_permissions!user_custom_permissions_user_id_fkey(
          permission_code
        ),
        user_features!user_features_user_id_fkey(feature_code,feature_scope,enabled),
        user_security_settings(
          two_factor_enabled,
          login_notifications,
          session_timeout
        )
      `

const FALLBACK_USER_SELECT = `
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
        updated_at
      `

/**
 * Découpe un nom complet en prénom et nom.
 */
const splitFullName = (fullName?: string | null): { firstName: string | null; lastName: string | null } => {
  if (!fullName) {
    return { firstName: null, lastName: null }
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: null, lastName: null }
  }

  const [firstName, ...rest] = parts
  const lastName = rest.length > 0 ? rest.join(' ') : null
  return { firstName: firstName ?? null, lastName }
}

/**
 * Génère des valeurs par défaut pour prénom/nom à partir d'une adresse e-mail.
 */
const deriveFallbackNames = (email?: string | null) => {
  if (!email) {
    return { firstName: 'Utilisateur', lastName: FALLBACK_LAST_NAME }
  }

  const [localPart] = email.split('@')
  const sanitized = localPart?.replace(/[^a-zA-Z]/g, ' ').trim() ?? ''
  if (!sanitized) {
    return { firstName: 'Utilisateur', lastName: FALLBACK_LAST_NAME }
  }

  const parts = sanitized.split(/\s+/).filter(Boolean)
  const firstName = parts[0] ?? 'Utilisateur'
  const lastName = parts.slice(1).join(' ') || FALLBACK_LAST_NAME
  return { firstName, lastName }
}

/**
 * Normalise une chaîne optionnelle pour l'insertion base (trim et conversion en null si vide).
 */
const normalizeOptionalString = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Construit un short code à partir de prénom/nom.
 */
const buildShortCode = (firstName?: string | null, lastName?: string | null) => {
  const firstInitial = firstName?.charAt(0) ?? 'P'
  const lastInitial = lastName?.charAt(0) ?? 'B'
  return `${firstInitial}${lastInitial}`.toUpperCase()
}

type ProfileSyncPayload = {
  name?: string
  email?: string
  phone?: string | null
  location?: string | null
  avatar?: string | null
  bio?: string | null
  website?: string | null
  socialMedia?: Record<string, unknown> | null
  preferences?: Record<string, unknown> | null
}

/**
 * Crée ou met à jour le profil utilisateur associé dans Supabase.
 */
const syncUserProfile = async (supabase: SupabaseAdminClient, userId: string, payload: ProfileSyncPayload) => {
  const { data: existingProfileRaw, error: profileFetchError } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, country, short_code')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileFetchError) {
    throw new Error(`Impossible de récupérer le profil utilisateur: ${profileFetchError.message}`)
  }

  const existingProfile = (existingProfileRaw ?? null) as (Pick<DbProfileRecord, 'first_name' | 'last_name' | 'country' | 'short_code'> | null)

  const cleanedNameInput = payload.name ? payload.name.replace(/probooster/ig, '').replace(/\s+/g, ' ').trim() : payload.name
  const { firstName, lastName } = splitFullName(cleanedNameInput)
  const normalizedPhone = normalizeOptionalString(payload.phone ?? undefined)
  const normalizedCity = normalizeOptionalString(payload.location ?? undefined)
  const normalizedAvatar = normalizeOptionalString(payload.avatar ?? undefined)

  const optionalFields: Record<string, unknown> = {}
  if (normalizedPhone !== undefined) optionalFields.phone = normalizedPhone
  if (normalizedCity !== undefined) optionalFields.city = normalizedCity
  if (normalizedAvatar !== undefined) optionalFields.avatar_url = normalizedAvatar
  if (payload.bio !== undefined) optionalFields.bio = payload.bio ?? null
  if (payload.website !== undefined) optionalFields.website = payload.website ?? null
  if (payload.socialMedia !== undefined) optionalFields.social_media = payload.socialMedia ?? null
  if (payload.preferences !== undefined) optionalFields.preferences = payload.preferences ?? null

  if (existingProfile) {
    const updates: Record<string, unknown> = { ...optionalFields }
    if (firstName) updates.first_name = firstName
    if (lastName) updates.last_name = lastName

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase.from('user_profiles').update(updates).eq('user_id', userId)
      if (updateError) {
        throw new Error(`Mise à jour du profil échouée: ${updateError.message}`)
      }
    }

    return
  }

  const fallbackNames = deriveFallbackNames(payload.email)
  const insertFirstName = firstName ?? fallbackNames.firstName
  const insertLastName = lastName ?? fallbackNames.lastName
  const shortCode = buildShortCode(insertFirstName, insertLastName)

  const insertPayload = {
    user_id: userId,
    first_name: insertFirstName,
    last_name: insertLastName,
    phone: (optionalFields.phone as string | null | undefined) ?? null,
    city: (optionalFields.city as string | null | undefined) ?? null,
    country: existingProfileRaw?.country ?? DEFAULT_PROFILE_COUNTRY,
    postal_code: null,
    bio: (optionalFields.bio as string | null | undefined) ?? null,
    website: (optionalFields.website as string | null | undefined) ?? null,
    social_media: optionalFields.social_media ?? null,
    preferences: optionalFields.preferences ?? null,
    avatar_url: (optionalFields.avatar_url as string | null | undefined) ?? null,
    short_code: existingProfileRaw?.short_code ?? shortCode
  }

  const { error: insertError } = await supabase.from('user_profiles').insert(insertPayload)
  if (insertError) {
    throw new Error(`Création du profil échouée: ${insertError.message}`)
  }
}

const syncPrimaryRoleAssignment = async (supabase: SupabaseAdminClient, userId: string, primaryRole?: string | null) => {
  const { error: deleteError } = await supabase
    .from('user_role_assignments')
    .delete()
    .eq('user_id', userId)
    .eq('assignment_source', 'primary')

  if (deleteError) {
    throw new Error(`Nettoyage du rôle principal échoué: ${deleteError.message}`)
  }

  const sanitizedRole = primaryRole?.trim()
  if (!sanitizedRole) {
    return
  }

  const { data: roleRecord, error: roleFetchError, status: roleFetchStatus } = await supabase
    .from('roles')
    .select('id, slug, name')
    .or(`slug.eq.${sanitizedRole},name.eq.${sanitizedRole}`)
    .maybeSingle()

  if (roleFetchError && roleFetchStatus !== 406) {
    throw new Error(`Récupération du rôle principal échouée: ${roleFetchError.message}`)
  }

  const roleId = roleRecord?.id
  if (!roleId) {
    console.warn(`Rôle principal introuvable pour "${sanitizedRole}" – assignation ignorée.`)
    return
  }

  const { error: insertError } = await supabase.from('user_role_assignments').insert({
    user_id: userId,
    role_id: roleId,
    assignment_source: 'primary',
    assignment_order: 0
  })

  if (insertError) {
    throw new Error(`Assignation du rôle principal échouée: ${insertError.message}`)
  }
}

const syncSecondaryRoles = async (supabase: SupabaseAdminClient, userId: string, roleSlugs?: string[]) => {
  if (roleSlugs === undefined) {
    return
  }

  const sanitizedSlugs = Array.from(new Set((roleSlugs ?? []).map((slug) => slug?.trim()).filter(Boolean))) as string[]

  const { error: deleteError } = await supabase
    .from('user_role_assignments')
    .delete()
    .eq('user_id', userId)
    .eq('assignment_source', 'secondary')

  if (deleteError) {
    throw new Error(`Nettoyage des rôles secondaires échoué: ${deleteError.message}`)
  }

  if (sanitizedSlugs.length === 0) {
    return
  }

  const { data: availableRoles, error: rolesError, status: rolesStatus } = await supabase
    .from('roles')
    .select('id, slug')
    .in('slug', sanitizedSlugs)

  if (rolesError && rolesStatus !== 406) {
    throw new Error(`Récupération des rôles secondaires échouée: ${rolesError.message}`)
  }

  const slugToId = new Map<string, string>()
  for (const role of availableRoles ?? []) {
    if (role?.slug && role?.id) {
      slugToId.set(role.slug, role.id)
    }
  }

  const inserts = sanitizedSlugs
    .map((slug, index) => {
      const roleId = slugToId.get(slug)
      if (!roleId) {
        console.warn(`Rôle secondaire introuvable pour le slug "${slug}" – ignoré.`)
        return null
      }
      return {
        user_id: userId,
        role_id: roleId,
        assignment_source: 'secondary',
        assignment_order: index
      }
    })
    .filter((entry): entry is { user_id: string; role_id: string; assignment_source: string; assignment_order: number } => Boolean(entry))

  if (inserts.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from('user_role_assignments').insert(inserts)
  if (insertError) {
    throw new Error(`Insertion des rôles secondaires échouée: ${insertError.message}`)
  }
}

const syncCustomPermissions = async (supabase: SupabaseAdminClient, userId: string, permissionCodes?: string[]) => {
  if (permissionCodes === undefined) {
    return
  }

  const uniqueCodes = Array.from(new Set((permissionCodes ?? []).map((code) => code?.trim()).filter(Boolean))) as string[]

  const { error: deleteError } = await supabase.from('user_custom_permissions').delete().eq('user_id', userId)
  if (deleteError) {
    throw new Error(`Nettoyage des permissions personnalisées échoué: ${deleteError.message}`)
  }

  if (uniqueCodes.length === 0) {
    return
  }

  const inserts = uniqueCodes.map((code) => ({
    user_id: userId,
    permission_code: code
  }))

  const { error: insertError } = await supabase.from('user_custom_permissions').insert(inserts)
  if (insertError) {
    throw new Error(`Insertion des permissions personnalisées échouée: ${insertError.message}`)
  }
}

type FeaturePayload = { code: string; scope: string; enabled?: boolean }

const syncUserFeatures = async (supabase: SupabaseAdminClient, userId: string, features?: FeaturePayload[]) => {
  if (features === undefined) {
    return
  }

  const { error: deleteError } = await supabase.from('user_features').delete().eq('user_id', userId)
  if (deleteError) {
    throw new Error(`Nettoyage des fonctionnalités utilisateur échoué: ${deleteError.message}`)
  }

  if (!features || features.length === 0) {
    return
  }

  const inserts = features
    .map((feature) => {
      const code = feature.code?.trim()
      const scope = feature.scope?.trim()
      if (!code || !scope) {
        return null
      }
      return {
        user_id: userId,
        feature_code: code,
        scope,
        enabled: feature.enabled ?? true
      }
    })
    .filter((entry): entry is { user_id: string; feature_code: string; scope: string; enabled: boolean } => Boolean(entry))

  if (inserts.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from('user_features').insert(inserts)
  if (insertError) {
    throw new Error(`Insertion des fonctionnalités utilisateur échouée: ${insertError.message}`)
  }
}

const syncUserSecuritySettings = async (
  supabase: SupabaseAdminClient,
  userId: string,
  security?: { twoFactorEnabled?: boolean; loginNotifications?: boolean; sessionTimeout?: number }
) => {
  if (!security) {
    return
  }

  const payload = {
    user_id: userId,
    two_factor_enabled: security.twoFactorEnabled ?? false,
    login_notifications: security.loginNotifications ?? true,
    session_timeout: security.sessionTimeout ?? 30,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_security_settings')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    throw new Error(`Synchronisation des réglages de sécurité échouée: ${error.message}`)
  }
}

const buildFullName = (firstName: string | null | undefined, lastName: string | null | undefined): string | null => {
  const safeFirst = firstName?.trim() ?? ''
  const safeLast = lastName?.trim() ?? ''
  const combined = [safeFirst, safeLast].filter(Boolean).join(' ').trim()
  return combined.length > 0 ? combined : null
}

const mapUserToSummary = (user: DbUserRecord): SuperAdminUserSummary => {
  const profile = Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles ?? null
  const fullName = profile ? buildFullName(profile.first_name, profile.last_name) : null
  const joinDate = user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString()
  const accountAge = Math.max(0, Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24)))
  const displayName = fullName?.trim() ? fullName : user.email
  const lastActive = user.last_active_at ?? null
  const type = (user.account_type ?? 'buyer') as SuperAdminUserSummary['type']
  const status = (user.status ?? 'pending') as SuperAdminUserStatus
  const role = (user.role ?? 'client') as SuperAdminUserSummary['role']
  const loyaltyPoints = Number(user.points_balance ?? 0)
  const roleAssignments = Array.isArray(user.user_role_assignments)
    ? user.user_role_assignments
    : user.user_role_assignments
      ? [user.user_role_assignments]
      : []
  const secondaryRoles = roleAssignments
    .filter((assignment) => assignment.assignment_source === 'secondary')
    .sort((a, b) => (a.assignment_order ?? 0) - (b.assignment_order ?? 0))
    .map((assignment) => {
      const roleMeta = Array.isArray(assignment.roles)
        ? assignment.roles[0]
        : assignment.roles ?? null
      return roleMeta?.slug ?? roleMeta?.name ?? assignment.role_id
    })
    .filter((value): value is string => Boolean(value))

  const customPermissions = Array.isArray(user.user_custom_permissions)
    ? user.user_custom_permissions
    : user.user_custom_permissions
      ? [user.user_custom_permissions]
      : []
  const permissionCodes = customPermissions.map((permission) => permission.permission_code).filter(Boolean)

  const featureRecords = Array.isArray(user.user_features)
    ? user.user_features
    : user.user_features
      ? [user.user_features]
      : []
  const features = featureRecords
    .map((feature) => {
      const scopeValue = (feature as any)?.scope ?? (feature as any)?.feature_scope ?? null
      const codeValue = feature.feature_code
      if (!codeValue || !scopeValue) {
        return null
      }
      return {
        code: codeValue,
        scope: scopeValue,
        enabled: feature.enabled ?? true
      }
    })
    .filter((feature): feature is { code: string; scope: string; enabled: boolean } => Boolean(feature))

  const securityRecord = Array.isArray(user.user_security_settings)
    ? user.user_security_settings[0]
    : user.user_security_settings ?? null

  const securitySettings = securityRecord
    ? {
        twoFactorEnabled: Boolean(securityRecord.two_factor_enabled ?? user.has_2fa ?? false),
        loginNotifications: Boolean(securityRecord.login_notifications ?? true),
        sessionTimeout: Number(securityRecord.session_timeout ?? 30)
      }
    : {
        twoFactorEnabled: Boolean(user.has_2fa ?? false),
        loginNotifications: true,
        sessionTimeout: 30
      }

  return {
    id: user.id,
    name: displayName,
    email: user.email,
    phone: profile?.phone ?? null,
    role,
    status,
    type,
    joinDate,
    lastActive,
    loyaltyPoints,
    totalOrders: 0,
    totalSpent: 0,
    totalEarnings: 0,
    rating: null,
    isVerified: Boolean(user.is_verified),
    has2FA: Boolean(user.has_2fa),
    location: profile?.city ?? null,
    avatar: profile?.avatar_url ?? null,
    bio: profile?.bio ?? null,
    website: profile?.website ?? null,
    socialMedia: (profile?.social_media as Record<string, unknown> | null) ?? null,
    preferences: (profile?.preferences as Record<string, unknown> | null) ?? null,
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
    productsShared: 0,
    secondaryRoles,
    customPermissions: permissionCodes,
    features,
    securitySettings
  }
}

/**
 * Récupère la liste des utilisateurs côté serveur avec filtrage étendu.
 */
export async function fetchUsersAdmin(options: FetchUsersAdminOptions = {}): Promise<SuperAdminUserSummary[]> {
  const {
    limit = DEFAULT_LIMIT,
    offset = 0,
    search,
    status,
    role
  } = options

  const supabase = getSupabaseAdmin()

  const boundedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT)
  const start = Math.max(offset, 0)
  const end = start + boundedLimit - 1

  const sanitizedSearch = search ? search.replace(/%/g, '').trim() : ''

  let query = supabase
    .from('users')
    .select(USER_SELECT)
    .order('created_at', { ascending: false })

  if (sanitizedSearch) {
    query = query.ilike('email', `%${sanitizedSearch}%`)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  if (start > 0) {
    query = query.range(start, end)
  } else {
    query = query.limit(boundedLimit)
  }

  const { data, error } = await query

  if (!error && (data ?? []).length <= 1) {
    try {
      const fallback = await listAuthUsersWithFilters(supabase, {
        limit: boundedLimit,
        offset: start,
        search: sanitizedSearch || undefined,
        role,
        status
      })

      if (fallback.length > (data ?? []).length) {
        return fallback
      }
    } catch (fallbackError) {
      console.warn('⚠️ fetchUsersAdmin: fallback Auth users échoué.', fallbackError)
    }
  }

  if (error) {
    console.warn('⚠️ fetchUsersAdmin: échec du select étendu, bascule vers un select minimal.', error)

    let fallbackQuery = supabase
      .from('users')
      .select(FALLBACK_USER_SELECT)
      .order('created_at', { ascending: false })

    if (sanitizedSearch) {
      fallbackQuery = fallbackQuery.ilike('email', `%${sanitizedSearch}%`)
    }

    if (status && status !== 'all') {
      fallbackQuery = fallbackQuery.eq('status', status)
    }

    if (role && role !== 'all') {
      fallbackQuery = fallbackQuery.eq('role', role)
    }

    if (start > 0) {
      fallbackQuery = fallbackQuery.range(start, end)
    } else {
      fallbackQuery = fallbackQuery.limit(boundedLimit)
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery

    if (fallbackError) {
      throw new Error(`Impossible de récupérer les utilisateurs (fallback): ${fallbackError.message}`)
    }

    return (fallbackData ?? []).map((row) => mapUserToSummary(row as DbUserRecord))
  }

  return (data ?? []).map((row) => mapUserToSummary(row as unknown as DbUserRecord))
}

/**
 * Crée un nouvel utilisateur via le client administrateur.
 */
export async function createUserAdmin(payload: CreateSuperAdminUserInput): Promise<SuperAdminUserSummary> {
  const supabase = getSupabaseAdmin()

  const security = payload.security ?? {}

  const insertPayload = {
    email: payload.email,
    role: payload.role,
    status: payload.status ?? 'pending',
    account_type: payload.type ?? 'buyer',
    points_balance: payload.loyaltyPoints ?? 0,
    is_verified: payload.isVerified ?? false,
    has_2fa: payload.has2FA ?? security.twoFactorEnabled ?? false
  }

  const {
    data: existingUser,
    error: existingUserError,
    status: existingUserStatus
  } = await supabase
    .from('users')
    .select('id, created_at')
    .eq('email', payload.email)
    .maybeSingle()

  if (existingUserError && existingUserStatus !== 406) {
    throw new Error(`Création utilisateur échouée: ${existingUserError.message}`)
  }

  let userId: string | null = null

  // 1) Créer (ou retrouver) le compte Supabase Auth.
  //    On doit absolument utiliser l'id Auth comme clé primaire dans public.users,
  //    sinon l'utilisateur ne pourra pas se connecter.
  let authUserId: string | null = null

  if (payload.password) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true
    })

    if (authError) {
      authUserId = await findAuthUserIdByEmail(supabase, payload.email)
      if (!authUserId) {
        throw new Error(`Création utilisateur échouée (Auth): ${authError.message}`)
      }
    } else {
      authUserId = authData.user?.id ?? null
    }
  } else {
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(payload.email)
    if (inviteError) {
      authUserId = await findAuthUserIdByEmail(supabase, payload.email)
      if (!authUserId) {
        throw new Error(`Création utilisateur échouée (Auth invitation): ${inviteError.message}`)
      }
    } else {
      authUserId = await findAuthUserIdByEmail(supabase, payload.email)
      if (!authUserId) {
        throw new Error('Création utilisateur échouée (Auth): utilisateur introuvable après invitation')
      }
    }
  }

  if (existingUser?.id) {
    if (existingUser.id !== authUserId) {
      throw new Error(
        `Création utilisateur échouée: un enregistrement public.users existe déjà pour ${payload.email} mais l'id ne correspond pas à Supabase Auth. ` +
          `Supprimez ce compte côté DB puis recréez-le, ou migrez ses données vers l'id Auth (${authUserId}).`
      )
    }

    const createdAtMs = existingUser.created_at ? Date.parse(existingUser.created_at) : null
    const isRecentDuplicate = createdAtMs !== null && Math.abs(Date.now() - createdAtMs) <= 2 * 60 * 1000

    if (!isRecentDuplicate) {
      throw new Error('Création utilisateur échouée: duplicate key value violates unique constraint "users_email_key"')
    }

    const { error: existingUpdateError } = await supabase.from('users').update(insertPayload).eq('id', existingUser.id)
    if (existingUpdateError) {
      throw new Error(`Création utilisateur échouée: ${existingUpdateError.message}`)
    }

    userId = existingUser.id
  }

  if (!userId) {
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .insert({ id: authUserId, ...insertPayload })
      .select('id')
      .single()

    if (userError || !userRow) {
      throw new Error(`Création utilisateur échouée: ${userError?.message ?? 'erreur inconnue'}`)
    }

    userId = userRow.id
  }

  const resolvedUserId: string = userId as string

  await syncUserProfile(supabase, resolvedUserId, {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    location: payload.location ?? null,
    avatar: payload.avatar ?? null,
    bio: payload.bio ?? null,
    website: payload.website ?? null,
    socialMedia: payload.socialMedia ?? null,
    preferences: payload.preferences ?? null
  })

  await syncPrimaryRoleAssignment(supabase, resolvedUserId, payload.role)
  await syncSecondaryRoles(supabase, resolvedUserId, payload.secondaryRoles)
  await syncCustomPermissions(supabase, resolvedUserId, payload.customPermissions)
  await syncUserFeatures(supabase, resolvedUserId, payload.features)
  await syncUserSecuritySettings(supabase, resolvedUserId, payload.security)

  return loadUserSummaryById(supabase, resolvedUserId)
}

/**
 * Met à jour un utilisateur existant via Supabase admin.
 */
export async function updateUserAdmin(payload: UpdateSuperAdminUserInput): Promise<SuperAdminUserSummary> {
  const { id, ...updates } = payload
  const supabase = getSupabaseAdmin()

  const userUpdates: Record<string, any> = {
    email: updates.email,
    role: updates.role,
    status: updates.status,
    account_type: updates.type,
    points_balance: updates.loyaltyPoints,
    is_verified: updates.isVerified,
    has_2fa: updates.has2FA
  }

  Object.keys(userUpdates).forEach((key) => {
    if (userUpdates[key] === undefined) {
      delete userUpdates[key]
    }
  })

  if (Object.keys(userUpdates).length > 0) {
    const { error: updateError } = await supabase.from('users').update(userUpdates).eq('id', id)
    if (updateError) {
      throw new Error(`Mise à jour utilisateur échouée: ${updateError.message}`)
    }
  }

  await syncUserProfile(supabase, id, {
    name: updates.name,
    email: updates.email,
    phone: updates.phone ?? null,
    location: updates.location ?? null,
    avatar: updates.avatar ?? null,
    bio: updates.bio ?? null,
    website: updates.website ?? null,
    socialMedia: updates.socialMedia ?? null,
    preferences: updates.preferences ?? null
  })

  if (updates.role !== undefined) {
    await syncPrimaryRoleAssignment(supabase, id, updates.role)
  }

  if (updates.secondaryRoles !== undefined) {
    await syncSecondaryRoles(supabase, id, updates.secondaryRoles)
  }

  if (updates.customPermissions !== undefined) {
    await syncCustomPermissions(supabase, id, updates.customPermissions)
  }

  if (updates.features !== undefined) {
    await syncUserFeatures(supabase, id, updates.features)
  }

  if (updates.security !== undefined) {
    await syncUserSecuritySettings(supabase, id, updates.security)
  }

  return loadUserSummaryById(supabase, id)
}

/**
 * Supprime définitivement un utilisateur et ses relations directes.
 */
export async function deleteUserAdmin(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase.from('user_profiles').delete().eq('user_id', userId)
  await supabase.from('user_social_media').delete().eq('user_id', userId)
  await supabase.from('user_roles').delete().eq('user_id', userId)

  const { error } = await supabase.from('users').delete().eq('id', userId)

  if (error) {
    throw new Error(`Suppression utilisateur échouée: ${error.message}`)
  }
}

/**
 * Met à jour le statut principal d'un utilisateur.
 */
export async function updateUserStatusAdmin(userId: string, status: SuperAdminUserStatus): Promise<void> {
  const supabase = getSupabaseAdmin()
  
  // Update user status
  const { error } = await supabase.from('users').update({ 
    status,
    is_verified: status === 'verified' ? true : undefined
  }).eq('id', userId)
  
  if (error) {
    throw new Error(`Mise à jour du statut échouée: ${error.message}`)
  }

  // If status is verified, also update verification info in profile
  if (status === 'verified') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('verification')
      .eq('user_id', userId)
      .maybeSingle()

    if (profile) {
      const verification = typeof (profile as any).verification === 'object' ? { ...(profile as any).verification } : { documents: [] }
      const documents = Array.isArray(verification.documents) 
        ? verification.documents.map((doc: any) => ({ ...doc, status: 'approved' }))
        : []
      
      await supabase.from('user_profiles').update({
        verification: { ...verification, isVerified: true, documents },
        updated_at: new Date().toISOString()
      } as any).eq('user_id', userId)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'user_verified_by_admin',
      entity_type: 'user',
      entity_id: userId,
      details: { status: 'verified' }
    })
  }
}

/**
 * Met à jour le rôle primaire d'un utilisateur.
 */
export async function updateUserRoleAdmin(userId: string, role: SuperAdminUserSummary['role']): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) {
    throw new Error(`Mise à jour du rôle échouée: ${error.message}`)
  }
}

/**
 * Crée un duplicata d'un utilisateur en générant une nouvelle adresse e-mail.
 */
export async function duplicateUserAdmin(userId: string): Promise<SuperAdminUserSummary> {
  const supabase = getSupabaseAdmin()

  const { data: original, error: fetchError } = await supabase
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
        updated_at,
        suspended_at,
        deactivated_at,
        deleted_at
      `
    )
    .eq('id', userId)
    .single()

  if (fetchError || !original) {
    throw new Error(`Utilisateur source introuvable: ${fetchError?.message ?? 'erreur inconnue'}`)
  }

  const originalUser = original as DbUserRecord
  const baseEmail = originalUser.email
  const [localPart, domain] = baseEmail.split('@')
  const suffix = Math.random().toString(36).slice(2, 8)
  const duplicateEmail = `${localPart}+copy-${suffix}@${domain ?? 'example.com'}`

  const { data: duplicated, error: duplicateError } = await supabase
    .from('users')
    .insert({
      email: duplicateEmail,
      role: originalUser.role,
      status: 'pending',
      account_type: originalUser.account_type ?? 'buyer',
      points_balance: 0,
      is_verified: false,
      has_2fa: false
    })
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
        password_reset_required,
        last_active_at,
        created_at,
        updated_at,
        suspended_at,
        deactivated_at,
        deleted_at
      `
    )
    .single()

  if (duplicateError || !duplicated) {
    throw new Error(`Duplication utilisateur échouée: ${duplicateError?.message ?? 'erreur inconnue'}`)
  }

  try {
    const sourceSummary = await loadUserSummaryById(supabase, originalUser.id)
    const baseName = sourceSummary.name ?? originalUser.email
    const sanitizedBaseName = (baseName ?? '').replace(/probooster/ig, '').replace(/\s+/g, ' ').trim() || originalUser.email
    await syncUserProfile(supabase, (duplicated as any).id ?? (duplicated as DbUserRecord).id, {
      name: `Dupli ${sanitizedBaseName}`,
      email: duplicateEmail
    })
  } catch (e) {
    console.warn('duplicateUserAdmin: impossible de définir le nom de la copie.', e)
  }

  return loadUserSummaryById(supabase, (duplicated as DbUserRecord).id)
}

/**
 * Associe un rôle secondaire à un utilisateur.
 */
export async function assignRoleToUserAdmin(userId: string, roleId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role_id: roleId })
  if (error) {
    throw new Error(`Assignation du rôle échouée: ${error.message}`)
  }
}

/**
 * Retire un rôle secondaire d'un utilisateur.
 */
export async function removeRoleFromUserAdmin(userId: string, roleId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('user_roles').delete().match({ user_id: userId, role_id: roleId })
  if (error) {
    throw new Error(`Retrait du rôle échoué: ${error.message}`)
  }
}
