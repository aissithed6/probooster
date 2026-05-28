'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/vendor/invoices/[id]
 * Génère une "facture" PDF simple pour une commande, avec contrôle d'accès vendeur.
 * Objectif: permettre un téléchargement PDF par commande depuis la section CA.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const vendorUserId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const params = 'params' in context ? await (context as any).params : (context as any)
    const orderId = typeof params?.id === 'string' ? params.id : ''

    if (!orderId) {
      return NextResponse.json({ error: 'Identifiant commande manquant.' }, { status: 400 })
    }

    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', vendorUserId)
      .maybeSingle()

    if (vendorProfileError) {
      console.warn('⚠️ GET /api/vendor/invoices/[id]: user_profiles lookup failed:', vendorProfileError)
    }

    const vendorIds = [vendorUserId]
    const profileId = (vendorProfile as any)?.id
    if (typeof profileId === 'string' && profileId.length > 0 && profileId !== vendorUserId) {
      vendorIds.push(profileId)
    }

    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        vendor_id,
        payment_status,
        total_amount,
        currency,
        created_at,
        shipping_address,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price
        )
      `
      )
      .eq('id', orderId)
      .maybeSingle()

    if (orderErr || !orderRow) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    const orderVendorId = String((orderRow as any)?.vendor_id ?? '')
    if (!vendorIds.includes(orderVendorId)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const marginX = 50
    let y = 790

    const drawText = (text: string, size = 12, bold = false) => {
      page.drawText(text, {
        x: marginX,
        y,
        size,
        font: bold ? fontBold : font,
        color: rgb(0.1, 0.1, 0.1)
      })
      y -= size + 6
    }

    const orderNumber = String((orderRow as any)?.order_number ?? orderId)
    const currency = String((orderRow as any)?.currency ?? 'XOF')
    const totalAmount = Number((orderRow as any)?.total_amount ?? 0)

    drawText('FACTURE', 20, true)
    drawText(`Commande: ${orderNumber}`, 12, true)
    drawText(`ID: ${orderId}`)
    drawText(`Date: ${String((orderRow as any)?.created_at ?? '')}`)
    drawText(`Paiement: ${String((orderRow as any)?.payment_status ?? '')}`)

    y -= 10
    drawText('Client', 14, true)
    drawText(`Nom: ${String((orderRow as any)?.customer_name ?? 'Client')}`)
    drawText(`Email: ${String((orderRow as any)?.customer_email ?? 'N/A')}`)
    drawText(`Téléphone: ${String((orderRow as any)?.customer_phone ?? 'N/A')}`)

    y -= 10
    drawText('Articles', 14, true)

    const items = Array.isArray((orderRow as any)?.order_items) ? (orderRow as any).order_items : []
    for (const it of items.slice(0, 30)) {
      const qty = Number((it as any)?.quantity ?? 0)
      const unit = Number((it as any)?.unit_price ?? 0)
      const total = Number((it as any)?.total_price ?? 0)
      drawText(`- product_id=${String((it as any)?.product_id ?? '')} qty=${qty} unit=${unit} total=${total}`)
    }

    y -= 10
    drawText(`TOTAL: ${totalAmount} ${currency}`, 16, true)

    const pdfBytes = await pdfDoc.save()
    const dateLabel = new Date().toISOString().split('T')[0]

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="facture_${orderNumber}_${dateLabel}.pdf"`,
        'cache-control': 'no-store'
      }
    })
  } catch (err) {
    console.error('❌ GET /api/vendor/invoices/[id] failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('token') ? 401 : message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
