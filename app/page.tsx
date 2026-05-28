import { headers } from 'next/headers'

import HomePageClient from './HomePageClient'



export const dynamic = 'force-dynamic'

async function getOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (!host) return 'http://localhost:3000'
  return `${proto}://${host}`
}

async function fetchInitialProducts(): Promise<any[]> {
  try {
    const origin = await getOrigin()
    const resp = await fetch(`${origin}/api/public/products/popular?limit=12`, {
      method: 'GET',
      cache: 'no-store'
    }).catch(() => null)

    const json = await resp?.json().catch(() => null)
    const items = Array.isArray(json?.data?.items) ? json.data.items : []
    return items
  } catch {
    return []
  }
}

/**
 * Page d'accueil.
 * IMPORTANT: on rend la partie qui utilise useSearchParams() sous Suspense pour éviter l'erreur de prerender Next.js.
 */
export default async function HomePage() {
  const initialProducts = await fetchInitialProducts()
  return <HomePageClient initialProducts={initialProducts} />
}
