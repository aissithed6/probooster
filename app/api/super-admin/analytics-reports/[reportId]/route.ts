import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../../_helpers/auth'
import { recordAutomationEvent } from '@/lib/automation-events'

type PatchBody = {
  name?: string
  description?: string
  type?: string
  period?: string
  format?: string
  sections?: string[]
  schedule?: any
  isActive?: boolean
}

/**
 * PATCH /api/super-admin/analytics-reports/:reportId
 * Met à jour un rapport (event-sourcing via automation_events).
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ reportId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { reportId } = await context.params

    const body = (await request.json().catch(() => null)) as PatchBody | null
    if (!body) {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const payload: any = {
      reportId,
      id: reportId,
      ...(body.name != null ? { name: String(body.name) } : {}),
      ...(body.description != null ? { description: String(body.description) } : {}),
      ...(body.type != null ? { type: String(body.type) } : {}),
      ...(body.period != null ? { period: String(body.period) } : {}),
      ...(body.format != null ? { format: String(body.format) } : {}),
      ...(body.sections != null ? { sections: Array.isArray(body.sections) ? body.sections : [] } : {}),
      ...(body.schedule != null ? { schedule: body.schedule } : {}),
      ...(body.isActive != null ? { isActive: Boolean(body.isActive) } : {})
    }

    const eventId = await recordAutomationEvent({
      source: 'super-admin',
      eventType: 'analytics.report.updated',
      entityType: 'analytics_report',
      entityId: null,
      actorUserId: null,
      payload,
      request
    })

    if (!eventId) {
      return NextResponse.json({ error: "Impossible d'enregistrer la mise à jour." }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/super-admin/analytics-reports/:reportId
 * Supprime un rapport (event-sourcing via automation_events).
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ reportId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { reportId } = await context.params

    const eventId = await recordAutomationEvent({
      source: 'super-admin',
      eventType: 'analytics.report.deleted',
      entityType: 'analytics_report',
      entityId: null,
      actorUserId: null,
      payload: { reportId, id: reportId },
      request
    })

    if (!eventId) {
      return NextResponse.json({ error: "Impossible d'enregistrer la suppression." }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
