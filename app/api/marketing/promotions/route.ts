import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

/**
 * GET /api/marketing/promotions
 * Liste les promotions (filtres: vendorId, status, activeOnly, productId, categoryId). Retourne 200 + [] en cas d'erreur.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    let vendorId = url.searchParams.get('vendorId')
    const status = url.searchParams.get('status')
    const activeOnly = url.searchParams.get('activeOnly') === 'true'
    const productId = url.searchParams.get('productId')
    const categoryId = url.searchParams.get('categoryId')

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
      // Un vendeur ne peut lire que ses propres promotions.
      vendorId = vendorUserId
    }

    const supabaseAdmin = getSupabaseAdmin()

    /**
     * Applique les filtres communs (status, activeOnly, product/category).
     */
    const applyFilters = (query: any) => {
      let q = query

      if (status) q = q.eq('status', status)

      if (activeOnly) {
        const nowIso = new Date().toISOString()
        q = q.eq('status', 'active').lte('start_date', nowIso).gte('end_date', nowIso)
      }

      if (productId) q = q.filter('applicable_products', 'cs', JSON.stringify([productId]))
      if (categoryId) q = q.filter('applicable_categories', 'cs', JSON.stringify([categoryId]))

      return q
    }

    // Filtre vendeur : on évite les erreurs PostgREST `.or(...)` en faisant deux requêtes puis fusion.
    if (vendorId) {
      const [createdRes, targetedRes] = await Promise.all([
        applyFilters(
          supabaseAdmin
            .from('promotions')
            .select('*')
            .eq('created_by', vendorId)
        ).order('created_at', { ascending: false }),
        applyFilters(
          supabaseAdmin
            .from('promotions')
            .select('*')
            .filter('applicable_vendors', 'cs', JSON.stringify([vendorId]))
        ).order('created_at', { ascending: false })
      ])

      if (createdRes.error) {
        console.error('GET /marketing/promotions (created_by) error:', createdRes.error)
      }
      if (targetedRes.error) {
        console.error('GET /marketing/promotions (applicable_vendors) error:', targetedRes.error)
      }

      const merged = [...(createdRes.data ?? []), ...(targetedRes.data ?? [])]
      const byId = new Map<string, any>()
      for (const item of merged) {
        if (item?.id) byId.set(item.id, item)
      }

      const unique = Array.from(byId.values())
      unique.sort((a, b) => {
        const at = typeof a?.created_at === 'string' ? new Date(a.created_at).getTime() : 0
        const bt = typeof b?.created_at === 'string' ? new Date(b.created_at).getTime() : 0
        return bt - at
      })

      return NextResponse.json(unique, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    const { data, error } = await applyFilters(
      supabaseAdmin
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false })
    )

    if (error) {
      console.error('GET /marketing/promotions error:', error)
      return NextResponse.json([], {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    return NextResponse.json(data ?? [], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('GET /marketing/promotions failed:', error)
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}

/**
 * POST /api/marketing/promotions
 * Crée une promotion (super admin ou vendeur). Valeurs par défaut et validation minimale.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const required = ['name', 'type', 'discount_type', 'discount_value', 'start_date', 'end_date']
    for (const f of required) {
      if (body[f] === undefined || body[f] === null || body[f] === '') {
        return NextResponse.json({ error: `Champ requis manquant: ${f}` }, { status: 400 })
      }
    }

    const nowIso = new Date().toISOString()

    const payload = {
      name: body.name,
      code: body.code ?? null,
      description: body.description ?? null,
      type: body.type, // 'coupon' | 'discount' | 'flash_sale' | 'bundle'
      status: body.status ?? 'draft',
      start_date: body.start_date,
      end_date: body.end_date,
      discount_type: body.discount_type, // 'percentage' | 'fixed' | 'free_shipping'
      discount_value: Number(body.discount_value) || 0,
      min_order_amount: body.min_order_amount ?? null,
      max_discount: body.max_discount ?? null,
      usage_limit: body.usage_limit ?? null,
      usage_limit_per_user: body.usage_limit_per_user ?? 1,
      used_count: body.used_count ?? 0,
      target_audience: Array.isArray(body.target_audience) ? body.target_audience : [],
      applicable_products: Array.isArray(body.applicable_products) ? body.applicable_products : [],
      applicable_categories: Array.isArray(body.applicable_categories) ? body.applicable_categories : [],
      applicable_vendors: Array.isArray(body.applicable_vendors) ? body.applicable_vendors : [],
      is_auto_apply: !!body.is_auto_apply,
      created_by: body.created_by ?? null,
      created_at: nowIso,
      updated_at: nowIso
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('POST /marketing/promotions error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('POST /marketing/promotions failed:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
