import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { recordAutomationEvent } from '@/lib/automation-events'

type ReportSchedule = {
  enabled: boolean
  frequency: string
  time: string
  recipients: string[]
}

type ReportConfigPayload = {
  id: string
  name: string
  description: string
  type: string
  period: string
  format: string
  sections: string[]
  schedule?: ReportSchedule
  isActive: boolean
}

/**
 * GET /api/super-admin/analytics-reports
 * Liste les rapports (persistés via automation_events, approche event-sourcing).
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 200), 1), 500)

    const { data, error } = await supabase
      .from('automation_events')
      .select('id, event_type, payload, created_at')
      .in('event_type', ['analytics.report.created', 'analytics.report.updated', 'analytics.report.deleted'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const byReportId = new Map<string, { config: ReportConfigPayload; deleted: boolean; updatedAt: string }>()

    // On reconstitue l'état final en parcourant du plus récent au plus ancien.
    for (const row of data ?? []) {
      const eventType = String((row as any)?.event_type ?? '')
      const payload = ((row as any)?.payload ?? {}) as any
      const reportId = String(payload?.reportId ?? payload?.id ?? '')
      if (!reportId) continue

      if (byReportId.has(reportId)) continue

      if (eventType === 'analytics.report.deleted') {
        byReportId.set(reportId, {
          config: {
            id: reportId,
            name: String(payload?.name ?? ''),
            description: String(payload?.description ?? ''),
            type: String(payload?.type ?? ''),
            period: String(payload?.period ?? ''),
            format: String(payload?.format ?? ''),
            sections: Array.isArray(payload?.sections) ? payload.sections : [],
            schedule: payload?.schedule,
            isActive: false
          },
          deleted: true,
          updatedAt: String((row as any)?.created_at ?? new Date().toISOString())
        })
        continue
      }

      if (eventType === 'analytics.report.updated' || eventType === 'analytics.report.created') {
        const config: ReportConfigPayload = {
          id: reportId,
          name: String(payload?.name ?? ''),
          description: String(payload?.description ?? ''),
          type: String(payload?.type ?? ''),
          period: String(payload?.period ?? ''),
          format: String(payload?.format ?? ''),
          sections: Array.isArray(payload?.sections) ? payload.sections : [],
          schedule: payload?.schedule,
          isActive: Boolean(payload?.isActive ?? true)
        }

        byReportId.set(reportId, {
          config,
          deleted: false,
          updatedAt: String((row as any)?.created_at ?? new Date().toISOString())
        })
      }
    }

    const reports = Array.from(byReportId.values())
      .filter((x) => !x.deleted)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .map((x) => x.config)

    return NextResponse.json({ data: reports }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/super-admin/analytics-reports
 * Crée un rapport (configuration) dans l'historique.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = (await request.json().catch(() => null)) as Partial<ReportConfigPayload> | null
    if (!body) {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const reportId = String(body.id ?? Date.now().toString())
    const payload: any = {
      reportId,
      id: reportId,
      name: String(body.name ?? ''),
      description: String(body.description ?? ''),
      type: String(body.type ?? 'sales'),
      period: String(body.period ?? '30d'),
      format: String(body.format ?? 'pdf'),
      sections: Array.isArray(body.sections) ? body.sections : [],
      schedule: body.schedule ?? undefined,
      isActive: Boolean(body.isActive ?? true)
    }

    if (!payload.name) {
      return NextResponse.json({ error: 'name requis.' }, { status: 400 })
    }

    const eventId = await recordAutomationEvent({
      source: 'super-admin',
      eventType: 'analytics.report.created',
      entityType: 'analytics_report',
      entityId: null,
      actorUserId: null,
      payload,
      request
    })

    if (!eventId) {
      return NextResponse.json({ error: "Impossible d'enregistrer le rapport." }, { status: 500 })
    }

    return NextResponse.json({ data: payload }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
