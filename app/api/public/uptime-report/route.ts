import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { recordAutomationEvent } from '@/lib/automation-events'

type UptimeReportPayload = {
  checkedUrl: string
  status: 'up' | 'down'
  latencyMs: number | null
  checkedAtIso?: string
  error?: string | null
}

function getTokenFromRequest(request: NextRequest): string {
  const auth = request.headers.get('authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice('bearer '.length).trim()
  }
  return String(request.headers.get('x-uptime-token') ?? '').trim()
}

/**
 * POST /api/public/uptime-report
 * Endpoint public mais sécurisé par token (env: UPTIME_REPORT_TOKEN).
 * Utilisé par GitHub Actions pour enregistrer les checks d'uptime.
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

    const body = (await request.json().catch(() => null)) as Partial<UptimeReportPayload> | null
    if (!body) {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const checkedUrl = String(body.checkedUrl ?? '').trim()
    const status = String(body.status ?? '').trim()
    const latencyMsRaw = body.latencyMs
    const checkedAtIso = String(body.checkedAtIso ?? new Date().toISOString())

    if (!checkedUrl) {
      return NextResponse.json({ error: 'checkedUrl requis.' }, { status: 400 })
    }
    if (status !== 'up' && status !== 'down') {
      return NextResponse.json({ error: 'status doit être up ou down.' }, { status: 400 })
    }

    const latencyMs =
      typeof latencyMsRaw === 'number' && Number.isFinite(latencyMsRaw) && latencyMsRaw >= 0 ? latencyMsRaw : null

    const eventId = await recordAutomationEvent({
      source: 'github-actions',
      eventType: 'uptime.check',
      entityType: 'system',
      entityId: null,
      actorUserId: null,
      payload: {
        checkedUrl,
        status,
        latencyMs,
        checkedAtIso,
        error: body.error ?? null
      },
      request
    })

    return NextResponse.json(
      {
        ok: true,
        eventId
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
