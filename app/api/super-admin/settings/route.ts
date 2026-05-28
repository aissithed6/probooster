import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { fetchSettingsAdmin, updateSettingsAdmin, type SettingsScope } from '@/app/api/super-admin/_helpers/settings'

export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const scopesParam = searchParams.get('scopes')
    const scopes = scopesParam ? (scopesParam.split(',').filter(Boolean) as SettingsScope[]) : undefined

    const settings = await fetchSettingsAdmin(scopes)
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('GET /api/super-admin/settings failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la récupération des réglages."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await assertSuperAdmin(request)
    const body = (await request.json()) as { scope?: SettingsScope; settings?: Record<string, unknown> }

    if (!body?.scope || !body.settings) {
      return NextResponse.json({ error: "Champs requis manquants (scope, settings)." }, { status: 400 })
    }

    const updated = await updateSettingsAdmin(body.scope, body.settings, userId)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/super-admin/settings failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour des réglages."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
