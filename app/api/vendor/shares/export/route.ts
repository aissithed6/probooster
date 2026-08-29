import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { Buffer } from 'buffer'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAnalyticsEnabled } from '@/app/api/_helpers/analytics-privacy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Génère un CSV à partir d'une matrice de cellules.
 */
function toCsv(rows: Array<Array<string | number>>): string {
  const escapeCell = (value: string | number) => {
    const raw = String(value ?? '')
    const needsQuotes = raw.includes(',') || raw.includes('\n') || raw.includes('"')
    const escaped = raw.replace(/"/g, '""')
    return needsQuotes ? `"${escaped}"` : escaped
  }

  return rows.map((r) => r.map(escapeCell).join(',')).join('\n')
}

/**
 * GET /api/vendor/shares/export
 * Télécharge un ZIP contenant CSV + XLSX + PDF (source DB, côté serveur).
 * Filtres:
 * - start/end (ISO)
 * - platform
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const url = new URL(request.url)

    const start = String(url.searchParams.get('start') ?? '').trim()
    const end = String(url.searchParams.get('end') ?? '').trim()
    const platform = String(url.searchParams.get('platform') ?? '').trim().toLowerCase()

    const supabase = getSupabaseAdmin()

    const analyticsAllowed = await isAnalyticsEnabled({ supabase, userId: vendorId })
    if (!analyticsAllowed) {
      return NextResponse.json(
        { error: 'analytics_disabled' },
        { status: 403, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    let query = supabase
      .from('product_shares')
      .select('id, created_at, platform, product_id, user_id, points_earned, share_url')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (start) query = query.gte('created_at', start)
    if (end) query = query.lte('created_at', end)
    if (platform) query = query.eq('platform', platform)

    const { data: shareRows, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const shares = (shareRows ?? []) as any[]

    const header = ['Date', 'Plateforme', 'Produit', 'Client', 'Points', 'URL', 'ShareID']
    const rows: Array<Array<string | number>> = [header]

    for (const s of shares) {
      rows.push([
        String(s?.created_at ?? ''),
        String(s?.platform ?? ''),
        String(s?.product_id ?? ''),
        String(s?.user_id ?? ''),
        Number(s?.points_earned ?? 0),
        String(s?.share_url ?? ''),
        String(s?.id ?? '')
      ])
    }

    const today = new Date().toISOString().split('T')[0]
    const baseName = `Partages-Vendeur-${today}`

    // CSV
    const csv = toCsv(rows)

    // XLSX
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Partages')
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // PDF
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    doc.setFontSize(12)
    doc.text('Export Partages & Engagement (Vendeur)', 40, 40)

    autoTable(doc, {
      head: [header],
      body: rows.slice(1).map((r) => r.map((c) => String(c ?? ''))),
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [128, 90, 213] }
    })

    const pdfArrayBuffer = doc.output('arraybuffer')

    // ZIP
    const zip = new JSZip()
    zip.file(`${baseName}.csv`, csv)
    zip.file(`${baseName}.xlsx`, xlsxBuffer)
    zip.file(`${baseName}.pdf`, Buffer.from(pdfArrayBuffer))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${baseName}.zip"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
