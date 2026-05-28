import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '../../../../lib/supabase'
import { recordAutomationEvent } from '../../../../lib/automation-events'

type AutomationEventBody = {
  eventType: string
  entityType: string
  entityId?: string | null
  payload?: Record<string, unknown> | null
  sessionId?: string | null
  sourceUi?: string | null
  path?: string | null
  url?: string | null
}

/**
 * POST /api/client/automation-events
 * Enregistre un événement d'automatisation côté serveur (visiteurs + clients connectés).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<AutomationEventBody>

    const eventType = typeof body.eventType === 'string' ? body.eventType.trim() : ''
    const entityType = typeof body.entityType === 'string' ? body.entityType.trim() : ''
    const entityId = body.entityId == null ? null : String(body.entityId).trim()

    if (!eventType || !entityType) {
      return NextResponse.json({ error: 'eventType et entityType sont requis.' }, { status: 400 })
    }

    const actorUserId = await resolveActorUserIdBestEffort(request)

    const payload: Record<string, unknown> = {
      ...(body.payload && typeof body.payload === 'object' ? body.payload : {}),
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : null,
      sourceUi: typeof body.sourceUi === 'string' ? body.sourceUi : null,
      path: typeof body.path === 'string' ? body.path : null,
      url: typeof body.url === 'string' ? body.url : null
    }

    const insertedId = await recordAutomationEvent({
      source: 'client_automation_events_api',
      eventType,
      entityType,
      entityId: entityId || null,
      actorUserId: actorUserId || null,
      payload,
      request
    })

    if (!insertedId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'insert_failed',
          details: {
            eventType,
            entityType,
            entityId: entityId || null,
            actorUserId: actorUserId || null
          }
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ ok: true, id: insertedId }, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unexpected_error'
    return NextResponse.json({ ok: false, error: message }, { status: 200 })
  }
}

/**
 * Résout l'ID utilisateur Supabase si un token est présent (best-effort).
 */
async function resolveActorUserIdBestEffort(request: NextRequest): Promise<string | null> {
  try {
    const accessToken = await extractAccessTokenBestEffort(request)
    if (!accessToken) return null

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.getUser(accessToken)
    if (error || !data?.user?.id) return null
    return data.user.id
  } catch {
    return null
  }
}

/**
 * Extrait un access_token depuis Authorization ou cookies (best-effort).
 */
async function extractAccessTokenBestEffort(request?: NextRequest): Promise<string | undefined> {
  const asyncHeaders = request ? request.headers : await headers()
  const bearerHeader = asyncHeaders.get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) return token
  }

  const requestCookieStore = request ? request.cookies : undefined
  const tokenFromRequestCookies = readTokenFromCookieStore(requestCookieStore)
  if (tokenFromRequestCookies) return tokenFromRequestCookies

  const serverCookiesStore = await cookies()
  return readTokenFromCookieStore(serverCookiesStore)
}

function readTokenFromCookieStore(store?: {
  get: (name: string) => { value: string } | undefined
  getAll?: () => Array<{ name: string; value: string }>
} | null): string | undefined {
  if (!store) return undefined

  const direct = store.get('sb-access-token')?.value
  if (direct) return direct

  const legacy = parseSupabaseAuthCookie(store.get('supabase-auth-token')?.value)
  if (legacy) return legacy

  const all = typeof store.getAll === 'function' ? store.getAll() : []
  for (const cookie of all) {
    const name = cookie?.name ?? ''
    if (!name) continue

    if (/^sb-.*-access-token$/i.test(name) && cookie.value) {
      return cookie.value
    }

    if (/^sb-.*-auth-token$/i.test(name) && cookie.value) {
      const parsed = parseSupabaseAuthCookie(cookie.value)
      if (parsed) return parsed
    }
  }

  return undefined
}

function parseSupabaseAuthCookie(rawValue?: string): string | undefined {
  if (!rawValue) return undefined

  const attempts = [rawValue]

  try {
    const decoded = decodeURIComponent(rawValue)
    if (decoded !== rawValue) attempts.push(decoded)
  } catch {
    // ignore
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate)
      const token: unknown = parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token
      if (typeof token === 'string' && token.length > 0) return token
    } catch {
      // ignore
    }
  }

  return undefined
}
