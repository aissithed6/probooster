import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { recordAutomationEvent } from '@/lib/automation-events'

type ExportFormat = 'csv' | 'pdf'

type CreateExportBody = {
  exportType: 'all' | 'sales' | 'users'
  format: ExportFormat
  period?: string
  startDate?: string
  endDate?: string
  includeCharts?: boolean
  includeRawData?: boolean
}

type ExportHistoryItem = {
  id: string
  type: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  downloadUrl?: string
  fileSize?: string
}

function labelForExportType(exportType: CreateExportBody['exportType']): string {
  if (exportType === 'sales') return 'Rapport ventes'
  if (exportType === 'users') return 'Analytics utilisateurs'
  return 'Données complètes'
}

/**
 * GET /api/super-admin/analytics-exports
 * Retourne l'historique des exports (persisté via automation_events).
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 30), 1), 200)

    const { data, error } = await supabase
      .from('automation_events')
      .select('id, payload, created_at')
      .eq('event_type', 'analytics.export.created')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items: ExportHistoryItem[] = (data ?? []).map((row: any) => {
      const payload = (row?.payload ?? {}) as any
      const exportType = String(payload?.exportType ?? 'all')
      const format = String(payload?.format ?? 'csv').toUpperCase()
      const fileSize = payload?.fileSize ? String(payload.fileSize) : undefined

      return {
        id: String(row.id),
        type: labelForExportType(exportType as any),
        format,
        status: 'completed',
        createdAt: String(row.created_at ?? new Date().toISOString()),
        downloadUrl: `/api/super-admin/analytics-exports/${String(row.id)}/download`,
        fileSize
      }
    })

    return NextResponse.json({ data: items }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/super-admin/analytics-exports
 * Crée un export et l'enregistre dans l'historique.
 * Remarque: le téléchargement du fichier se fait ensuite via /:id/download.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const body = (await request.json().catch(() => null)) as CreateExportBody | null
    if (!body) {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const exportType = body.exportType ?? 'all'
    const format = body.format ?? 'csv'

    if (exportType !== 'all' && exportType !== 'sales' && exportType !== 'users') {
      return NextResponse.json({ error: 'exportType invalide.' }, { status: 400 })
    }

    if (format !== 'csv' && format !== 'pdf') {
      return NextResponse.json({ error: 'format invalide.' }, { status: 400 })
    }

    const eventId = await recordAutomationEvent({
      source: 'super-admin',
      eventType: 'analytics.export.created',
      entityType: 'analytics_export',
      entityId: null,
      actorUserId: null,
      payload: {
        exportType,
        format,
        period: body.period ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        includeCharts: Boolean(body.includeCharts ?? true),
        includeRawData: Boolean(body.includeRawData ?? false)
      },
      request
    })

    if (!eventId) {
      return NextResponse.json({ error: "Impossible d'enregistrer l'export." }, { status: 500 })
    }

    const item: ExportHistoryItem = {
      id: eventId,
      type: labelForExportType(exportType),
      format: format.toUpperCase(),
      status: 'completed',
      createdAt: new Date().toISOString(),
      downloadUrl: `/api/super-admin/analytics-exports/${eventId}/download`
    }

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
