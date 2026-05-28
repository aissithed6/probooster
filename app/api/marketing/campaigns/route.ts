import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * GET /api/marketing/campaigns
 * Liste les campagnes avec filtres optionnels (vendorId, status)
 * Retourne 200 avec [] en cas d'erreur pour ne pas casser l'UI.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    let vendorId = url.searchParams.get('vendorId')
    const status = url.searchParams.get('status')

    /**
     * Sécurité: lecture réservée au vendeur authentifié (sur ses propres données)
     * ou au super-admin/admin.
     */
    let isAdmin = false
    let vendorUserId: string | null = null
    try {
      await assertSuperAdmin(request)
      isAdmin = true
    } catch {
      vendorUserId = await assertVendor(request)
    }

    if (!isAdmin) {
      vendorId = vendorUserId
    }

    const supabaseAdmin = getSupabaseAdmin()

    let query = supabaseAdmin
      .from('boosting_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (vendorId) query = query.eq('vendor_id', vendorId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
      console.error('GET /marketing/campaigns error:', error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data ?? [], { status: 200 })
  } catch (error) {
    console.error('GET /marketing/campaigns failed:', error)
    return NextResponse.json([], { status: 200 })
  }
}

/**
 * POST /api/marketing/campaigns
 * Crée une campagne. Par défaut, les campagnes vendeur sont 'pending'.
 * Si created_by_role === 'super_admin', la campagne est auto-approuvée et activée.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const {
      vendor_id,
      product_id = null,
      service_id,
      type,
      total_cost = 0,
      target_pages = [],
      duration = null,
      created_by = null,
      created_by_role = null
    } = body

    if (!vendor_id || !service_id || !type) {
      return NextResponse.json({ error: 'Champs requis manquants (vendor_id, service_id, type).' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()

    // Règle d’auto-approbation super admin
    const isSuperAdmin = created_by_role === 'super_admin'
    const base = {
      vendor_id,
      product_id,
      service_id,
      type,
      status: isSuperAdmin ? 'active' : 'pending',
      start_date: isSuperAdmin ? nowIso : null,
      end_date: null,
      target_pages,
      duration,
      total_cost,
      payment_status: 'pending',
      payment_id: null,
      payment_method: null,
      rejection_reason: null,
      created_at: nowIso,
      updated_at: nowIso,
      created_by,
      created_by_role,
      super_admin_approved: isSuperAdmin,
      admin_approved: isSuperAdmin,
      approved_by_super_admin: isSuperAdmin ? created_by : null,
      approved_by_admin: isSuperAdmin ? created_by : null,
      approved_at: isSuperAdmin ? nowIso : null
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('boosting_campaigns')
      .insert(base)
      .select()
      .single()

    if (error) {
      console.error('POST /marketing/campaigns error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('POST /marketing/campaigns failed:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
