import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProd = process.env.NODE_ENV === 'production'

  const superAdminSectionBySlug: Record<string, string> = {
    utilisateurs: 'users',
    produits: 'products',
    commandes: 'orders',
    livraisons: 'deliveries',
    finances: 'financial',
    marketing: 'marketing',
    fidelite: 'loyalty',
    partages: 'shares-engagement',
    messagerie: 'messaging',
    avis: 'reviews',
    notifications: 'notifications',
    configuration: 'settings',
    automatisation: 'automation',
    analyses: 'analytics',
    design: 'design',
    'messages-conseils': 'messages-conseils'
  }

  const sellerTabBySlug: Record<string, string> = {
    produits: 'products',
    commandes: 'orders',
    livraisons: 'deliveries',
    'chiffre-affaires': 'revenue',
    'demandes-paiement': 'payment-requests',
    classements: 'rankings',
    chat: 'chat',
    messagerie: 'messaging',
    notifications: 'notifications',
    partages: 'shares',
    marketing: 'marketing',
    points: 'points',
    avis: 'reviews',
    analyses: 'analytics',
    parametres: 'settings',
    profil: 'profile',
    'test-devises': 'currency-test'
  }

  if (pathname.startsWith('/super-admin-dashboard/')) {
    const slug = pathname.replace('/super-admin-dashboard/', '').split('/')[0]
    const section = slug ? superAdminSectionBySlug[slug] : null
    if (section) {
      const url = request.nextUrl.clone()
      url.pathname = '/super-admin-dashboard'
      url.searchParams.set('section', section)
      return NextResponse.rewrite(url)
    }
  }

  if (pathname.startsWith('/seller-dashboard/')) {
    const slug = pathname.replace('/seller-dashboard/', '').split('/')[0]
    const tab = slug ? sellerTabBySlug[slug] : null
    if (tab) {
      const url = request.nextUrl.clone()
      url.pathname = '/seller-dashboard'
      url.searchParams.set('tab', tab)
      return NextResponse.rewrite(url)
    }
  }

  const isTestRoute =
    pathname === '/test' ||
    pathname.startsWith('/test/') ||
    pathname.startsWith('/test-') ||
    pathname.startsWith('/demo-')

  if (isProd && isTestRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/_not-found'
    return NextResponse.rewrite(url)
  }

  const response = NextResponse.next()

  const tryParseAccessToken = (raw: string): string | null => {
    const candidates: string[] = [raw]
    try {
      const decoded = decodeURIComponent(raw)
      if (decoded && decoded !== raw) candidates.push(decoded)
    } catch {
      // ignore
    }

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
        const maybe = Array.isArray(parsed)
          ? parsed[0]?.access_token ?? null
          : parsed?.currentSession?.access_token ?? parsed?.access_token ?? null
        if (typeof maybe === 'string' && maybe.trim()) return maybe.trim()
      } catch {
        // ignore
      }
    }

    if (raw.split('.').length === 3 && raw.trim()) {
      return raw.trim()
    }

    return null
  }

  // Si déjà présent, on ne touche pas.
  const existing = request.cookies.get('sb-access-token')?.value
  if (existing && existing.trim()) {
    return response
  }

  // Reconstruit sb-*-auth-token (souvent chunké: .0/.1/...) puis extrait access_token.
  const allCookies = request.cookies.getAll()
  const authCookies = allCookies
    .map((c) => ({ name: String(c?.name ?? ''), value: String(c?.value ?? '') }))
    .filter((c) => c.name.startsWith('sb-') && c.name.includes('auth-token') && c.value)

  const groups = new Map<string, { index: number; value: string }[]>()
  for (const c of authCookies) {
    const parts = c.name.split('.')
    const baseName = parts[0]
    const idx = parts.length > 1 ? Number(parts[1]) : 0
    const arr = groups.get(baseName) ?? []
    arr.push({ index: Number.isFinite(idx) ? idx : 0, value: c.value })
    groups.set(baseName, arr)
  }

  let accessToken: string | null = null
  for (const [_base, chunks] of groups) {
    const joined = chunks
      .sort((a, b) => a.index - b.index)
      .map((c) => c.value)
      .join('')
    accessToken = tryParseAccessToken(joined)
    if (accessToken) break
  }

  if (accessToken) {
    const isHttps = request.nextUrl.protocol === 'https:'
    response.cookies.set('sb-access-token', accessToken, {
      path: '/',
      sameSite: 'lax',
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 7
    })
  }

  return response
}

export const config = {
  matcher: ['/(.*)'],
}
