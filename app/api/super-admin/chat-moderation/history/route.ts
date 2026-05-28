import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Retourne l'historique des sanctions (mute/ban) et avertissements pour un utilisateur.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Paramètre userId requis.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const [{ data: sanctions, error: sanctionsError }, { data: warnings, error: warningsError }] = await Promise.all([
      supabase
        .from('chat_user_sanctions')
        .select('id,user_id,sanction_type,reason,expires_at,created_by,created_at,revoked_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('chat_user_warnings')
        .select('id,user_id,chat_id,warning_message,created_by,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
    ])

    if (sanctionsError) {
      throw sanctionsError
    }

    if (warningsError) {
      throw warningsError
    }

    return NextResponse.json({
      data: {
        sanctions: sanctions ?? [],
        warnings: warnings ?? []
      }
    })
  } catch (error) {
    console.error('GET /api/super-admin/chat-moderation/history failed:', error)
    return NextResponse.json({ error: "Erreur lors du chargement de l'historique." }, { status: 500 })
  }
}
