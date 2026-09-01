import { NextRequest, NextResponse } from 'next/server'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * CRUD des règles de fidélité (super admin).
 * Exécute les écritures avec service_role (getSupabaseAdmin) pour garantir
 * la persistance quelle que soit la configuration RLS/droits du schéma.
 */
export async function GET(_req: NextRequest) {
  try {
    await assertSuperAdmin(_req)
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('loyalty_rules')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lecture règles.'
    const status = /accès|token/i.test(message) ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await assertSuperAdmin(request)
    const body = await request.json()
    const rule = body?.rule ?? body
    if (!rule?.name || !rule?.rule_type) {
      return NextResponse.json({ error: 'Champs "name" et "rule_type" obligatoires.' }, { status: 400 })
    }
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('loyalty_rules')
      .insert({ ...rule, created_by: userId, updated_by: userId })
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur création règle.'
    const status = /accès|token/i.test(message) ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const { id, updates } = await request.json()
    if (!id || !updates) {
      return NextResponse.json({ error: 'Champs "id" et "updates" requis.' }, { status: 400 })
    }
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('loyalty_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur mise à jour règle.'
    const status = /accès|token/i.test(message) ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await assertSuperAdmin(request)
    const { id, isActive } = await request.json()
    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Champs "id" et "isActive" requis.' }, { status: 400 })
    }
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('loyalty_rules')
      .update({ is_active: isActive, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur statut règle.'
    const status = /accès|token/i.test(message) ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: "Paramètre 'id' requis." }, { status: 400 })
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('loyalty_rules').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur suppression règle.'
    const status = /accès|token/i.test(message) ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
