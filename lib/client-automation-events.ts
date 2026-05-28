export type ClientAutomationEventInput = {
  eventType: string
  entityType: string
  entityId?: string | null
  payload?: Record<string, unknown> | null
  sourceUi?: string | null
  path?: string | null
  url?: string | null
  dedupeKey?: string | null
  dedupeTtlMs?: number | null
}

const SESSION_ID_STORAGE_KEY = 'pb_session_id'
const DEDUPE_PREFIX = 'pb_auto_event:'

/**
 * Retourne un sessionId persistant (visiteur), stocké en localStorage.
 */
export function getOrCreateAutomationSessionId(): string {
  if (typeof window === 'undefined') return ''

  try {
    const existing = window.localStorage.getItem(SESSION_ID_STORAGE_KEY)
    if (typeof existing === 'string' && existing.trim().length > 0) {
      return existing.trim()
    }

    const next = createUuidLike()
    window.localStorage.setItem(SESSION_ID_STORAGE_KEY, next)
    return next
  } catch {
    return ''
  }
}

/**
 * Enregistre un événement d'automatisation côté client via l'API serveur.
 * Best-effort: ignore toute erreur réseau.
 */
export async function trackAutomationEvent(input: ClientAutomationEventInput): Promise<void> {
  if (typeof window === 'undefined') return

  const eventType = String(input.eventType ?? '').trim()
  const entityType = String(input.entityType ?? '').trim()
  const entityId = input.entityId == null ? null : String(input.entityId).trim()
  if (!eventType || !entityType) return

  const sessionId = getOrCreateAutomationSessionId()

  const path = input.path ?? window.location.pathname
  const url = input.url ?? window.location.href

  const dedupeKey = String(input.dedupeKey ?? '').trim()
  const ttl = typeof input.dedupeTtlMs === 'number' ? input.dedupeTtlMs : null
  if (dedupeKey && ttl && ttl > 0) {
    if (isWithinDedupeWindow(dedupeKey, ttl)) {
      return
    }
    markDedupe(dedupeKey)
  }

  try {
    const resp = await fetch('/api/client/automation-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify({
        eventType,
        entityType,
        entityId,
        sessionId: sessionId || null,
        sourceUi: input.sourceUi ?? null,
        path,
        url,
        payload: input.payload ?? null
      })
    }).catch(() => null)

    if (resp && resp.ok) {
      const json = await resp.json().catch(() => null)
      if (json && typeof json === 'object' && (json as any).ok === false) {
        console.warn('[AutomationEvents] track failed:', json)
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Dédoublonne les événements de type "view" (ou autre) dans la même session.
 */
export function buildViewDedupeKey(params: {
  eventType: string
  entityType: string
  entityId?: string | null
  path?: string | null
}): string {
  const eventType = String(params.eventType ?? '').trim()
  const entityType = String(params.entityType ?? '').trim()
  const entityId = params.entityId == null ? '' : String(params.entityId).trim()
  const path = params.path == null ? '' : String(params.path).trim()
  return `${DEDUPE_PREFIX}${eventType}:${entityType}:${entityId}:${path}`
}

function markDedupe(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(key, String(Date.now()))
  } catch {
    // ignore
  }
}

function isWithinDedupeWindow(key: string, ttlMs: number): boolean {
  try {
    if (typeof window === 'undefined') return false
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return false
    const t = Number(raw)
    if (!Number.isFinite(t)) return false
    return Date.now() - t <= ttlMs
  } catch {
    return false
  }
}

function createUuidLike(): string {
  try {
    const cryptoAny = (globalThis as any).crypto
    if (cryptoAny?.randomUUID) {
      return String(cryptoAny.randomUUID())
    }
  } catch {
    // ignore
  }

  const rand = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  return `${rand()}${rand()}-${rand()}-${rand()}-${rand()}-${rand()}${rand()}${rand()}`
}
