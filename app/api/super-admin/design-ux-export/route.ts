import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { fetchSettingsAdmin } from '@/app/api/super-admin/_helpers/settings'

export const dynamic = 'force-dynamic'

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toCsvRows(record: Record<string, unknown>): string {
  const lines: string[] = ['key,value']
  Object.entries(record).forEach(([key, value]) => {
    const stringValue = value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value)
    const safeKey = JSON.stringify(key)
    const safeValue = JSON.stringify(stringValue)
    lines.push(`${safeKey},${safeValue}`)
  })
  return lines.join('\n')
}

/**
 * GET /api/super-admin/design-ux-export
 * Exporte la configuration Design & UX (réglages globaux) au format JSON ou CSV.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') ?? 'json').toLowerCase()

    const records = await fetchSettingsAdmin(['global'])
    const global = records.find((r) => r.scope === 'global')
    const settings = (global?.settings ?? {}) as Record<string, any>

    const siteConfig = settings?.siteConfig && typeof settings.siteConfig === 'object' ? settings.siteConfig : {}
    const designUx = settings?.designUx && typeof settings.designUx === 'object' ? settings.designUx : {}

    const animationsRaw: unknown = (designUx as any)?.animations
    const accessibilityRaw: unknown = (designUx as any)?.accessibilityFeatures

    const payload = {
      exportedAt: new Date().toISOString(),
      designUx: {
        activeThemeId: asString(designUx?.activeThemeId),
        animations: Array.isArray(animationsRaw) ? animationsRaw : [],
        accessibilityFeatures: Array.isArray(accessibilityRaw) ? accessibilityRaw : []
      },
      siteConfig: {
        primaryColor: asString(siteConfig?.primaryColor),
        secondaryColor: asString(siteConfig?.secondaryColor),
        accentColor: asString(siteConfig?.accentColor)
      }
    }

    if (format === 'csv') {
      const csv = toCsvRows({
        exportedAt: payload.exportedAt,
        activeThemeId: payload.designUx.activeThemeId,
        primaryColor: payload.siteConfig.primaryColor,
        secondaryColor: payload.siteConfig.secondaryColor,
        accentColor: payload.siteConfig.accentColor
      })

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="design-ux-export-${Date.now()}.csv"`,
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="design-ux-export-${Date.now()}.json"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('GET /api/super-admin/design-ux-export failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de l'export."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
