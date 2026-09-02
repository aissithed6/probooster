import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '../../../_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

import { PDFDocument, StandardFonts } from 'pdf-lib'

export const runtime = 'nodejs'

type ExportFormat = 'csv' | 'pdf'

type ExportPayload = {
  exportType?: 'all' | 'sales' | 'users'
  format?: ExportFormat
  period?: string | null
  startDate?: string | null
  endDate?: string | null
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function toCsvRow(values: Array<string | number | null | undefined>): string {
  const escaped = values.map((v) => {
    const raw = v == null ? '' : String(v)
    const safe = raw.replace(/"/g, '""')
    return `"${safe}"`
  })
  return `${escaped.join(',')}\n`
}

/**
 * GET /api/super-admin/analytics-exports/:exportId/download
 * Regénère et renvoie le fichier (CSV ou PDF) à partir du payload stocké dans automation_events.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ exportId: string }> }) {
  try {
    await assertSuperAdmin(request)
    const { exportId } = await context.params

    const supabase = getSupabaseAdmin()

    const { data: row, error } = await supabase
      .from('automation_events')
      .select('id, payload, created_at')
      .eq('id', exportId)
      .eq('event_type', 'analytics.export.created')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!row) {
      return NextResponse.json({ error: 'Export introuvable.' }, { status: 404 })
    }

    const payload = (row as any)?.payload as ExportPayload | undefined
    const format = (payload?.format ?? 'csv') as ExportFormat

    // On exporte les données d'advanced-analytics (mêmes sources DB) via un appel HTTP interne.
    const url = new URL(request.url)
    const origin = `${url.protocol}//${url.host}`

    const cookieHeader = request.headers.get('cookie') ?? ''

    const periodKey = typeof payload?.period === 'string' && payload.period ? payload.period : '30d'
    let analyticsUrl = `${origin}/api/super-admin/advanced-analytics?period=${encodeURIComponent(periodKey)}`
    if (periodKey === 'custom') {
      if (payload?.startDate) analyticsUrl += `&start=${encodeURIComponent(payload.startDate)}`
      if (payload?.endDate) analyticsUrl += `&end=${encodeURIComponent(payload.endDate)}`
    }
    const analyticsRes = await fetch(analyticsUrl, {
      method: 'GET',
      headers: {
        authorization: request.headers.get('authorization') ?? '',
        ...(cookieHeader ? { cookie: cookieHeader } : {})
      },
      cache: 'no-store'
    })

    const analyticsJson = await analyticsRes.json().catch(() => null)
    if (!analyticsRes.ok) {
      const msg = (analyticsJson as any)?.error ? String((analyticsJson as any).error) : 'Impossible de générer le fichier.'
      return NextResponse.json({ error: msg }, { status: analyticsRes.status })
    }

    const analytics = (analyticsJson as any)?.data ?? null
    if (!analytics) {
      return NextResponse.json({ error: 'Réponse analytics invalide.' }, { status: 500 })
    }

    const createdAt = String((row as any)?.created_at ?? new Date().toISOString())
    const exportType = String((payload as any)?.exportType ?? 'all')

    const baseName = sanitizeFilename(`analytics-${exportType}-${createdAt}`)

    if (format === 'csv') {
      let csv = ''
      csv += toCsvRow(['Section', 'Clé', 'Valeur'])
      csv += toCsvRow(['kpis', 'revenue', analytics?.kpis?.revenue])
      csv += toCsvRow(['kpis', 'ordersCount', analytics?.kpis?.ordersCount])
      csv += toCsvRow(['kpis', 'activeUsers', analytics?.kpis?.activeUsers])
      csv += toCsvRow(['visits', 'pageViews', analytics?.visits?.pageViews])
      csv += toCsvRow(['visits', 'conversionRate', analytics?.visits?.conversionRate])
      csv += toCsvRow(['reviews', 'averageRating', analytics?.reviews?.averageRating])
      csv += toCsvRow(['uptime', 'availabilityPercent', analytics?.uptime?.availabilityPercent])
      csv += toCsvRow(['uptime', 'avgLatencyMs', analytics?.uptime?.avgLatencyMs])

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseName}.csv"`
        }
      })
    }

    // PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const lines: string[] = [
      'Export Analytics (Super Admin)',
      `Période: ${String(analytics?.period?.key ?? periodKey)}`,
      '',
      `Revenus: ${String(analytics?.kpis?.revenue ?? '--')}`,
      `Commandes: ${String(analytics?.kpis?.ordersCount ?? '--')}`,
      `Utilisateurs actifs: ${String(analytics?.kpis?.activeUsers ?? '--')}`,
      `Vues: ${String(analytics?.visits?.pageViews ?? '--')}`,
      `Conversion: ${String(analytics?.visits?.conversionRate ?? '--')}%`,
      `Note moyenne: ${String(analytics?.reviews?.averageRating ?? '--')}/5`,
      `Disponibilité: ${typeof analytics?.uptime?.availabilityPercent === 'number' ? analytics.uptime.availabilityPercent.toFixed(1) : '--'}%`,
      `Latence: ${analytics?.uptime?.avgLatencyMs != null ? String(analytics.uptime.avgLatencyMs) + 'ms' : '--'}`
    ]

    let y = 800
    for (const line of lines) {
      page.drawText(line, { x: 50, y, size: 12, font })
      y -= 18
    }

    const bytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${baseName}.pdf"`
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
