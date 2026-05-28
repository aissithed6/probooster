import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * PUT /api/marketing/promotions/[id]
 * Met à jour une promotion existante. Retourne 200 + { data } ou 500 en cas d'erreur.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const awaitedParams = await Promise.resolve(params)
    const id = awaitedParams?.id
    if (!id) {
      return NextResponse.json({ error: 'Identifiant de promotion manquant.' }, { status: 400 })
    }

    const updates = await request.json().catch(() => null)
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée fournie pour la mise à jour.' }, { status: 400 })
    }

    (updates as any).updated_at = new Date().toISOString()

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PUT /marketing/promotions/[id] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('PUT /marketing/promotions/[id] failed:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}

/**
 * DELETE /api/marketing/promotions/[id]
 * Supprime une promotion. Retourne 200 + { success: true } ou 500 en cas d'erreur.
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const awaitedParams = await Promise.resolve(params)
    const id = awaitedParams?.id
    if (!id) {
      return NextResponse.json({ error: 'Identifiant de promotion manquant.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('promotions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DELETE /marketing/promotions/[id] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('DELETE /marketing/promotions/[id] failed:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
