'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/vendor/orders/[id]/documents
 * Génère et retourne des documents de commande (texte) côté serveur.
 * Objectif: rendre le bouton "Docs" 100% opérationnel (API + contrôle d'accès).
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
      console.warn('⚠️ GET /api/vendor/orders/[id]/documents: user_profiles lookup failed:', vendorProfileError)
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
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        vendor_id,
        status,
        payment_status,
        total_amount,
        currency,
        shipping_address,
        created_at,
        updated_at,
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

    const items = Array.isArray((orderRow as any)?.order_items) ? (orderRow as any).order_items : []

    const lines = [
      `DOCUMENTS COMMANDE`,
      `ID: ${(orderRow as any)?.id ?? ''}`,
      `Numéro: ${(orderRow as any)?.order_number ?? 'N/A'}`,
      `Date: ${(orderRow as any)?.created_at ?? ''}`,
      `Statut: ${(orderRow as any)?.status ?? ''}`,
      `Paiement: ${(orderRow as any)?.payment_status ?? ''}`,
      `Client: ${(orderRow as any)?.customer_name ?? 'Client'}`,
      `Email: ${(orderRow as any)?.customer_email ?? 'N/A'}`,
      `Téléphone: ${(orderRow as any)?.customer_phone ?? 'N/A'}`,
      `Adresse: ${typeof (orderRow as any)?.shipping_address === 'string' ? (orderRow as any).shipping_address : JSON.stringify((orderRow as any)?.shipping_address ?? '')}`,
      `Total: ${(orderRow as any)?.total_amount ?? 0} ${(orderRow as any)?.currency ?? 'XOF'}`,
      '',
      `ARTICLES (${items.length})`,
      ...items.map((it: any, idx: number) => {
        const qty = Number(it?.quantity ?? 0)
        const unit = Number(it?.unit_price ?? 0)
        const total = Number(it?.total_price ?? 0)
        return `${idx + 1}. item_id=${it?.id ?? ''} product_id=${it?.product_id ?? ''} qty=${qty} unit=${unit} total=${total}`
      }),
      '',
      '---',
      '1) Facture',
      '2) Bon de livraison',
      '3) Reçu',
      '4) Conditions de vente'
    ]

    const content = lines.join('\n')
    const dateLabel = new Date().toISOString().split('T')[0]

    return NextResponse.json(
      {
        data: {
          filename: `documents_commande_${orderId}_${dateLabel}.txt`,
          mime: 'text/plain',
          content
        }
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('❌ GET /api/vendor/orders/[id]/documents failed:', err)
    const message = err instanceof Error ? err.message : 'Erreur inattendue.'
    const status = message.toLowerCase().includes('token') ? 401 : message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
