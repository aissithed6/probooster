import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Normalise une valeur "string" de façon best-effort.
 */
function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

/**
 * Normalise un objet JSON.
 */
function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

/**
 * GET /api/vendor/disputes
 * Retourne les litiges (order_disputes) des commandes du vendeur authentifié.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const { data: orderRows, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (orderError) {
      console.error('❌ GET /api/vendor/disputes: orders lookup failed:', orderError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des commandes.' }, { status: 500 })
    }

    const orderIds = (orderRows ?? []).map(r => (r as any).id).filter(Boolean)
    if (orderIds.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const { data, error } = await supabase
      .from('order_disputes')
      .select('*')
      .in('order_id', orderIds)
      .order('id', { ascending: false })
      .limit(500)

    if (error) {
      console.error('❌ GET /api/vendor/disputes failed:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des litiges.' }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/vendor/disputes unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

 /**
  * POST /api/vendor/disputes
  * Crée un litige (order_disputes) pour une commande appartenant au vendeur authentifié.
  */
 export async function POST(request: NextRequest) {
   try {
     const vendorId = await assertVendor(request)
     const supabase = getSupabaseAdmin()

     const payload = (await request.json().catch(() => ({}))) as any
     const orderId = asString(payload?.orderId ?? payload?.order_id).trim()
     const type = asString(payload?.type ?? payload?.dispute_type).trim() || 'general'
     const subject = asString(payload?.subject).trim() || null
     const description = asString(payload?.description ?? payload?.message).trim() || null
     const priority = asString(payload?.priority).trim() || null
     const metadata = asObject(payload?.metadata)

     if (!orderId) {
       return NextResponse.json({ error: "L'identifiant de commande est requis." }, { status: 400 })
     }

     const { data: orderRow, error: orderErr } = await supabase
       .from('orders')
       .select('id, vendor_id')
       .eq('id', orderId)
       .maybeSingle()

     if (orderErr) {
       console.error('❌ POST /api/vendor/disputes: order lookup failed:', orderErr)
       return NextResponse.json({ error: 'Erreur lors de la vérification de la commande.' }, { status: 500 })
     }

     if (!orderRow || asString((orderRow as any)?.vendor_id) !== vendorId) {
       return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
     }

     const nowIso = new Date().toISOString()
     const insertRow: Record<string, unknown> = {
       order_id: orderId,
       type,
       subject,
       description,
       priority,
       status: 'open',
       created_at: nowIso,
       updated_at: nowIso,
       metadata
     }

     const { data, error } = await supabase
       .from('order_disputes')
       .insert(insertRow as any)
       .select('*')
       .maybeSingle()

     if (error) {
       console.error('❌ POST /api/vendor/disputes failed:', error)
       return NextResponse.json({ error: 'Erreur lors de la création du litige.' }, { status: 500 })
     }

     return NextResponse.json({ data }, { status: 201 })
   } catch (error) {
     console.error('❌ POST /api/vendor/disputes unexpected error:', error)
     const message = error instanceof Error ? error.message : 'Erreur inconnue.'
     const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
     return NextResponse.json({ error: message }, { status })
   }
 }

 /**
  * PATCH /api/vendor/disputes
  * Met à jour (résout/ferme) un litige du vendeur.
  */
 export async function PATCH(request: NextRequest) {
   try {
     const vendorId = await assertVendor(request)
     const supabase = getSupabaseAdmin()

     const payload = (await request.json().catch(() => ({}))) as any
     const disputeId = asString(payload?.id).trim()
     const nextStatus = asString(payload?.status).trim() || 'resolved'
     const resolution = asString(payload?.resolution).trim() || null

     if (!disputeId) {
       return NextResponse.json({ error: "L'identifiant du litige est requis." }, { status: 400 })
     }

     const { data: disputeRow, error: disputeErr } = await supabase
       .from('order_disputes')
       .select('id, order_id')
       .eq('id', disputeId)
       .maybeSingle()

     if (disputeErr) {
       console.error('❌ PATCH /api/vendor/disputes: dispute lookup failed:', disputeErr)
       return NextResponse.json({ error: 'Erreur lors de la récupération du litige.' }, { status: 500 })
     }

     const orderId = asString((disputeRow as any)?.order_id).trim()
     if (!orderId) {
       return NextResponse.json({ error: 'Litige introuvable.' }, { status: 404 })
     }

     const { data: orderRow, error: orderErr } = await supabase
       .from('orders')
       .select('id, vendor_id')
       .eq('id', orderId)
       .maybeSingle()

     if (orderErr) {
       console.error('❌ PATCH /api/vendor/disputes: order lookup failed:', orderErr)
       return NextResponse.json({ error: 'Erreur lors de la vérification de la commande.' }, { status: 500 })
     }

     if (!orderRow || asString((orderRow as any)?.vendor_id) !== vendorId) {
       return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
     }

     const nowIso = new Date().toISOString()
     const updateRow: Record<string, unknown> = {
       status: nextStatus,
       updated_at: nowIso
     }

     if (resolution) updateRow.resolution = resolution
     if (nextStatus.toLowerCase().includes('res') || nextStatus.toLowerCase().includes('clos')) {
       updateRow.resolved_at = nowIso
       updateRow.closed_at = nowIso
     }

     const { data, error } = await supabase
       .from('order_disputes')
       .update(updateRow as any)
       .eq('id', disputeId)
       .select('*')
       .maybeSingle()

     if (error) {
       console.error('❌ PATCH /api/vendor/disputes failed:', error)
       return NextResponse.json({ error: 'Erreur lors de la mise à jour du litige.' }, { status: 500 })
     }

     return NextResponse.json({ data }, { status: 200 })
   } catch (error) {
     console.error('❌ PATCH /api/vendor/disputes unexpected error:', error)
     const message = error instanceof Error ? error.message : 'Erreur inconnue.'
     const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
     return NextResponse.json({ error: message }, { status })
   }
 }
