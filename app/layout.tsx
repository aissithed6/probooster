import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AppClientProviders from "@/components/providers/app-client-providers"
import { getSupabaseAdmin } from "@/lib/supabase"

const inter = Inter({ subsets: ["latin"] })

const FALLBACK_METADATA: Metadata = {
  title: "Marketplace Innovante - La révolution du commerce en ligne",
  description:
    "Découvrez la marketplace du futur avec système de points, chat instantané et fonctionnalités sociales avancées",
  generator: 'v0.dev'
}

function resolveSafePublicPath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return null
}

function withCacheBust(url: string, updatedAt: string | null): string {
  const token = updatedAt ? encodeURIComponent(updatedAt) : String(Date.now())
  return url.includes('?') ? `${url}&v=${token}` : `${url}?v=${token}`
}

/**
 * Extrait le token Supabase côté serveur depuis les headers/cookies.
 */
async function extractSupabaseAccessTokenServer(): Promise<string | null> {
  const tryParseToken = (raw: string): string | null => {
    const candidates = [raw]
    try {
      const decoded = decodeURIComponent(raw)
      if (decoded && decoded !== raw) candidates.push(decoded)
    } catch {
      // ignore
    }

    // Cookies Supabase peuvent être encodés sous forme "base64-..."
    try {
      const value = candidates[candidates.length - 1]
      if (typeof value === 'string' && value.startsWith('base64-')) {
        const b64 = value.slice(7)
        const json = Buffer.from(b64, 'base64').toString('utf8')
        if (json) candidates.push(json)
      }
    } catch {
      // ignore
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate)
        const maybeToken = Array.isArray(parsed)
          ? parsed[0]?.access_token ?? null
          : parsed?.currentSession?.access_token ?? parsed?.access_token ?? null
        if (typeof maybeToken === 'string' && maybeToken.trim()) return maybeToken.trim()
      } catch {
        // ignore
      }
    }

    // Certains environnements stockent directement le JWT
    if (typeof raw === 'string' && raw.split('.').length === 3) {
      return raw.trim()
    }

    return null
  }

  try {
    const { headers: getHeaders, cookies: getCookies } = await import('next/headers')
    const headerStore = await Promise.resolve(getHeaders())
    const cookieStore = await Promise.resolve(getCookies())

    const bearerHeader = headerStore.get('authorization')
    if (bearerHeader?.startsWith('Bearer ')) {
      const token = bearerHeader.slice(7).trim()
      if (token) return token
    }

    const sbAccessToken = cookieStore.get('sb-access-token')?.value
    if (sbAccessToken) return sbAccessToken

    const supabaseAuthCookie = cookieStore.get('supabase-auth-token')?.value
    if (supabaseAuthCookie) {
      const token = tryParseToken(supabaseAuthCookie)
      if (token) return token
    }

    // Cookies Supabase modernes: sb-<project-ref>-auth-token (parfois chunkés: .0, .1, ...)
    try {
      const all = typeof (cookieStore as any)?.getAll === 'function' ? (cookieStore as any).getAll() : []
      const authCookies = all
        .map((c: any) => ({ name: String(c?.name ?? ''), value: typeof c?.value === 'string' ? c.value : '' }))
        .filter((c: any) => c.name.startsWith('sb-') && c.name.includes('auth-token') && c.value)

      // Regroupe les chunks: sb-xxx-auth-token.0 + .1 ...
      const groups = new Map<string, { index: number; value: string }[]>()
      for (const c of authCookies) {
        const parts = c.name.split('.')
        const baseName = parts[0]
        const idx = parts.length > 1 ? Number(parts[1]) : 0
        const arr = groups.get(baseName) ?? []
        arr.push({ index: Number.isFinite(idx) ? idx : 0, value: c.value })
        groups.set(baseName, arr)
      }

      for (const [_base, chunks] of groups) {
        const joined = chunks
          .sort((a, b) => a.index - b.index)
          .map((c) => c.value)
          .join('')
        const token = tryParseToken(joined)
        if (token) return token
      }
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }

  return null
}

/**
 * Construit une origin serveur fiable pour fetcher des routes internes.
 */
async function resolveServerOrigin(): Promise<string> {
  try {
    const { headers: getHeaders } = await import('next/headers')
    const headerStore = await Promise.resolve(getHeaders())
    const forwardedProto = headerStore.get('x-forwarded-proto') ?? headerStore.get('protocol') ?? 'http'
    const forwardedHost = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`
    }
  } catch {
    // ignore
  }

  const envOriginCandidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined
  ] as const

  const envOrigin = envOriginCandidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0)
  return envOrigin ?? 'http://localhost:3000'
}

/**
 * generateMetadata applique les réglages globaux (SEO + favicon) côté serveur.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('super_admin_settings')
      .select('settings, updated_at')
      .eq('scope', 'global')
      .maybeSingle()

    if (error || !data) {
      return FALLBACK_METADATA
    }

    const settings = (data as any)?.settings ?? {}
    const siteConfigRaw = (settings as any)?.siteConfig ?? {}
    const integrationConfigRaw = (settings as any)?.integrationConfig ?? {}
    const seoRaw = (integrationConfigRaw as any)?.seo ?? {}

    const faviconUrlRaw = resolveSafePublicPath(siteConfigRaw?.faviconUrl ?? siteConfigRaw?.favicon)
    const faviconUrl = faviconUrlRaw ? withCacheBust(faviconUrlRaw, (data as any)?.updated_at ?? null) : null

    const defaultTitle = (seoRaw?.title ?? seoRaw?.defaultTitle ?? '').toString().trim()
    const titleTemplate = (seoRaw?.titleTemplate ?? '').toString().trim()
    const defaultDescription = (seoRaw?.description ?? seoRaw?.defaultDescription ?? '').toString().trim()
    const keywords = (seoRaw?.keywords ?? '').toString().trim()
    const robots = (seoRaw?.robots ?? '').toString().trim()

    const metadata: Metadata = {
      ...FALLBACK_METADATA,
      ...(defaultDescription ? { description: defaultDescription } : {}),
      ...(faviconUrl
        ? {
            icons: {
              icon: faviconUrl
            }
          }
        : {}),
      ...(keywords ? { keywords } : {}),
      ...(robots
        ? {
            robots
          }
        : {})
    }

    if (defaultTitle && titleTemplate) {
      metadata.title = {
        default: defaultTitle,
        template: titleTemplate
      }
    } else if (defaultTitle) {
      metadata.title = defaultTitle
    }

    return metadata
  } catch {
    return FALLBACK_METADATA
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseAdmin = getSupabaseAdmin()

  const origin = await resolveServerOrigin()
  const accessToken = await extractSupabaseAccessTokenServer()

  let initialPublicGlobalSettings: any | null = null
  let initialPublicGlobalSettingsUpdatedAt: string | null = null
  let initialPointsConfig: { withdrawalValue?: number | null; withdrawalMinPoints?: number | null } | null = null

  try {
    const publicSettingsResponse = await fetch(`${origin}/api/public/global-settings`, {
      method: 'GET',
      cache: 'no-store',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    })
    const json = await publicSettingsResponse.json().catch(() => null)
    initialPublicGlobalSettings = json?.data ?? null
    initialPublicGlobalSettingsUpdatedAt = json?.debug?.updated_at ?? null
  } catch {
    initialPublicGlobalSettings = null
    initialPublicGlobalSettingsUpdatedAt = null
  }

  try {
    const pointsConfigResponse = await fetch(`${origin}/api/public/points-config`, {
      method: 'GET',
      cache: 'no-store'
    })
    if (pointsConfigResponse.ok) {
      const payload = (await pointsConfigResponse.json().catch(() => null)) as { data?: any | null }
      const data = payload?.data ?? null
      if (data && typeof data === 'object') {
        const withdrawalValue = Number((data as any)?.withdrawalValue)
        const withdrawalMinPoints = Number((data as any)?.withdrawalMinPoints)
        initialPointsConfig = {
          withdrawalValue: Number.isFinite(withdrawalValue) ? withdrawalValue : null,
          withdrawalMinPoints: Number.isFinite(withdrawalMinPoints) ? withdrawalMinPoints : null
        }
      }
    }
  } catch {
    initialPointsConfig = null
  }

  let initialAuthState:
    | {
        user?: any | null
        userProfile?: any | null
        loyaltyPoints?: any | null
      }
    | undefined = undefined

  if (accessToken) {
    try {
      const { data } = await supabaseAdmin.auth.getUser(accessToken)
      const authUser = data?.user ?? null

      if (authUser) {
        let resolvedRole: string = String((authUser as any)?.user_metadata?.role ?? '').trim()
        if (!resolvedRole) {
          try {
            const { data: userRow } = await supabaseAdmin
              .from('users')
              .select('role')
              .eq('id', authUser.id)
              .maybeSingle()
            const roleDb = String((userRow as any)?.role ?? '').trim()
            if (roleDb) resolvedRole = roleDb
          } catch {
            // ignore
          }
        }
        if (!resolvedRole) resolvedRole = 'client'

        const stableUser = {
          id: authUser.id,
          email: authUser.email ?? '',
          role: resolvedRole,
          created_at: (authUser as any)?.created_at ?? null,
          updated_at: (authUser as any)?.updated_at ?? (authUser as any)?.created_at ?? null
        }

        const [{ data: userProfile }, { data: loyaltyPoints }] = await Promise.all([
          supabaseAdmin.from('user_profiles').select('*').eq('user_id', authUser.id).maybeSingle(),
          supabaseAdmin
            .from('loyalty_points')
            .select('points_balance, points_spent, fcfa_value, is_frozen, freeze_reason')
            .eq('user_id', authUser.id)
            .maybeSingle()
        ])

        initialAuthState = {
          user: stableUser,
          userProfile: userProfile ?? null,
          loyaltyPoints: loyaltyPoints ?? null
        }
      }
    } catch {
      initialAuthState = undefined
    }
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AppClientProviders
          initialAuthState={initialAuthState}
          initialPublicGlobalSettings={initialPublicGlobalSettings}
          initialPublicGlobalSettingsUpdatedAt={initialPublicGlobalSettingsUpdatedAt}
          initialPointsConfig={initialPointsConfig}
        >
          {children}
        </AppClientProviders>
      </body>
    </html>
  )
}
