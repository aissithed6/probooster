import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type SanctionType = 'mute' | 'ban'

type CreateSanctionBody = {
  userId?: string
  sanctionType?: SanctionType
  reason?: string | null
  // Si null/undefined -> sanction sans expiration (ban définitif ou mute illimité)
  expiresAt?: string | null
}

type RevokeSanctionBody = {
  sanctionId?: string
}

/**
 * Gestion des sanctions chat (mute/ban) côté Super Admin.
 */
export async function POST(request: NextRequest) {
  try {
    const superAdminId = await assertSuperAdmin(request)
    const body = (await request.json()) as CreateSanctionBody

    if (!body?.userId || !body?.sanctionType) {
      return NextResponse.json({ error: 'Champs requis manquants (userId, sanctionType).' }, { status: 400 })
    }

    if (body.sanctionType !== 'mute' && body.sanctionType !== 'ban') {
      return NextResponse.json({ error: 'sanctionType invalide.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase.from('chat_user_sanctions').insert({
      user_id: body.userId,
      sanction_type: body.sanctionType,
      reason: body.reason ?? null,
      expires_at: body.expiresAt ?? null,
      created_by: superAdminId
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/chat-moderation/sanctions failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la sanction.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const body = (await request.json()) as RevokeSanctionBody

    if (!body?.sanctionId) {
      return NextResponse.json({ error: 'sanctionId requis.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('chat_user_sanctions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', body.sanctionId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/super-admin/chat-moderation/sanctions failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la révocation de la sanction.' }, { status: 500 })
  }
}
