import { supabase, getClientAccessToken, getClientAccessTokenSafe } from '@/lib/supabase'

const BASE_HEADERS = {
  'Content-Type': 'application/json'
} as const

let inflightToken: Promise<string | null> | null = null

/**
 * Lit un access token Supabase depuis le localStorage quand Supabase Auth ne remonte pas de session.
 * (Fallback utile en dev quand des locks navigateur provoquent des timeouts.)
 */
function readSupabaseAccessTokenFromLocalStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const storage = window.localStorage
    const keys = Object.keys(storage)

    for (const k of keys) {
      if (!k.startsWith('sb-')) continue
      const raw = storage.getItem(k)
      if (!raw) continue

      try {
        const parsed = JSON.parse(raw)
        const token = parsed?.access_token
        if (typeof token === 'string' && token.trim().length > 0) {
          return token.trim()
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return null
}

async function resolveAccessToken(): Promise<string | null> {
  const cached = getClientAccessToken()
  if (cached) return cached

  if (inflightToken) return inflightToken

  inflightToken = (async () => {
    try {
      const token = await getClientAccessTokenSafe()
      if (token) {
        return token
      }

      const refreshed = await supabase.auth.refreshSession().catch(() => null)
      return refreshed?.data?.session?.access_token ?? readSupabaseAccessTokenFromLocalStorage()
    } catch {
      return readSupabaseAccessTokenFromLocalStorage()
    } finally {
      inflightToken = null
    }
  })()

  return inflightToken
}

export class ClientAuthService {
  /**
   * Construit les en-têtes d'authentification pour les appels API client.
   */
  static async buildAuthHeaders(): Promise<HeadersInit> {
    try {
      const accessToken = await resolveAccessToken()

      if (accessToken) {
        return {
          ...BASE_HEADERS,
          Authorization: `Bearer ${accessToken}`
        }
      }
    } catch (error) {
      console.warn('Impossible de récupérer la session Supabase client:', error)
    }

    // Fallback final: localStorage (si session non remontée mais stockée)
    const fallback = readSupabaseAccessTokenFromLocalStorage()
    if (fallback) {
      return {
        ...BASE_HEADERS,
        Authorization: `Bearer ${fallback}`
      }
    }

    return { ...BASE_HEADERS }
  }
}
