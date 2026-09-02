import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { recordAutomationEvent } from '@/lib/automation-events'
import { getSupabaseAdmin } from '@/lib/supabase'

function getTokenFromRequest(request: NextRequest): string {
  const auth = request.headers.get('authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice('bearer '.length).trim()
  }
  return String(request.headers.get('x-uptime-token') ?? '').trim()
}

/**
 * Additionne récursivement la taille (bytes) des objets de tous les buckets Storage.
 * Ne lève jamais : renvoie 0 en cas d'erreur.
 */
async function readStorageUsedBytes(): Promise<{ bytes: number; ok: boolean }> {
  const supabase = getSupabaseAdmin()
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets || buckets.length === 0) return { bytes: 0, ok: true }

    let total = 0
    const listRecursive = async (bucket: string, prefix: string, depth: number): Promise<void> => {
      if (depth > 4) return
      const { data, error } = await supabase.storage.from(bucket).list(prefix || '', { limit: 1000 })
      if (error) return
      await Promise.all(
        (data ?? []).map(async (item) => {
          if (item.id != null && typeof item.metadata?.size === 'number') {
            total += item.metadata.size
          } else {
            await listRecursive(bucket, item.name, depth + 1)
          }
        })
      )
    }

    await Promise.all(buckets.map((b) => listRecursive(b.name, '', 0)))
    return { bytes: total, ok: true }
  } catch {
    return { bytes: 0, ok: false }
  }
}

/**
 * Lit le nombre de connexions actives à la base via la RPC `exec` (guarded) :
 * SELECT count(*) FROM pg_stat_activity. Renvoie null si indisponible.
 */
async function readActiveConnections(): Promise<number | null> {
  const supabase = getSupabaseAdmin()
  try {
    const { data } = await supabase.rpc('exec', { sql: "select count(*) as n from pg_stat_activity" })
    if (data == null) return null
    // exec peut renvoyer un JSON/tableau/objet selon l'implémentation.
    if (Array.isArray(data)) {
      const first = data[0] as any
      const n = Number(first?.n ?? first?.count ?? 0)
      return Number.isFinite(n) ? n : null
    }
    if (typeof data === 'object') {
      const n = Number((data as any)?.n ?? (data as any)?.count ?? 0)
      return Number.isFinite(n) ? n : null
    }
    return null
  } catch {
    return null
  }
}

/**
 * POST /api/public/system-metrics
 * Endpoint public mais sécurisé par token (même UPTIME_REPORT_TOKEN que l'uptime),
 * appelé périodiquement par GitHub Actions. Capture de vraies métriques système
 * (connexions DB actives, espace de stockage utilisé) et les persiste dans
 * `automation_events` (event_type: system.metric).
 */
export async function POST(request: NextRequest) {
  try {
    const expected = String(process.env.UPTIME_REPORT_TOKEN ?? '').trim()
    if (!expected) {
      return NextResponse.json({ error: 'UPTIME_REPORT_TOKEN manquant côté serveur.' }, { status: 500 })
    }
    const provided = getTokenFromRequest(request)
    if (!provided || provided !== expected) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
    }

    const [connections, storage] = await Promise.all([readActiveConnections(), readStorageUsedBytes()])

    await recordAutomationEvent({
      source: 'github-actions',
      eventType: 'system.metric',
      entityType: 'system',
      entityId: null,
      actorUserId: null,
      payload: {
        activeConnections: connections,
        storageUsedBytes: storage.bytes,
        storageReadOk: storage.ok,
        checkedAtIso: new Date().toISOString()
      },
      request
    })

    return NextResponse.json(
      {
        ok: true,
        data: {
          activeConnections: connections,
          storageUsedBytes: storage.bytes
        }
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}