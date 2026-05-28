import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/super-admin/boosting-pricing-config
 * Enregistre la configuration globale des tarifs Boostage Pro (service role) après vérification du rôle super admin.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await assertSuperAdmin(request)

    const body = (await request.json().catch(() => undefined)) as any
    const config = body?.config ?? body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Configuration invalide.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const configuration = {
      id: '00000000-0000-0000-0000-000000000000',
      config_json: config,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('boosting_pricing_config' as any)
      .upsert(configuration as any, { onConflict: 'id' })

    if (error) {
      console.error('Supabase upsert error (boosting_pricing_config):', error)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde de la configuration.' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'cache-control': 'no-store'
        }
      }
    )
  } catch (error) {
    console.error('PUT /api/super-admin/boosting-pricing-config failed:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
