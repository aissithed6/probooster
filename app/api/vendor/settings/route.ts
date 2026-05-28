'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type VendorDashboardSettings = {
  notifications?: Record<string, unknown>
  ai?: Record<string, unknown>
}

type VendorSettingsPayload = {
  vendorDashboard?: VendorDashboardSettings
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

/**
 * GET /api/vendor/settings
 * Retourne des réglages vendeur persistés dans user_profiles.preferences.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', vendorId)
      .maybeSingle()

    if (error) {
      console.error('❌ GET /api/vendor/settings failed:', error)
      return NextResponse.json({ error: 'Impossible de charger les réglages.' }, { status: 500 })
    }

    const prefs = asObject((data as any)?.preferences)
    const vendorDashboard = asObject(prefs.vendor_dashboard)

    return NextResponse.json(
      {
        data: {
          vendorDashboard: {
            notifications: asObject(vendorDashboard.notifications),
            ai: asObject(vendorDashboard.ai)
          }
        }
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('❌ GET /api/vendor/settings unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * PUT /api/vendor/settings
 * Met à jour les réglages vendeur (merge) dans user_profiles.preferences.vendor_dashboard.
 */
export async function PUT(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const body = (await request.json().catch(() => ({}))) as VendorSettingsPayload
    const incomingVendorDashboard = asObject(body?.vendorDashboard)

    const { data: current, error: currentErr } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', vendorId)
      .maybeSingle()

    if (currentErr) {
      console.error('❌ PUT /api/vendor/settings: load current preferences failed:', currentErr)
      return NextResponse.json({ error: 'Impossible de charger les réglages existants.' }, { status: 500 })
    }

    const currentPrefs = asObject((current as any)?.preferences)
    const currentVendorDashboard = asObject(currentPrefs.vendor_dashboard)

    const nextVendorDashboard: VendorDashboardSettings = {
      ...currentVendorDashboard,
      ...incomingVendorDashboard,
      notifications: {
        ...asObject(currentVendorDashboard.notifications),
        ...asObject(incomingVendorDashboard.notifications)
      },
      ai: {
        ...asObject(currentVendorDashboard.ai),
        ...asObject(incomingVendorDashboard.ai)
      }
    }

    const nextPrefs = {
      ...currentPrefs,
      vendor_dashboard: nextVendorDashboard
    }

    const { data: updated, error: updateErr } = await supabase
      .from('user_profiles')
      .update({ preferences: nextPrefs, updated_at: new Date().toISOString() } as any)
      .eq('user_id', vendorId)
      .select('preferences')
      .maybeSingle()

    if (updateErr) {
      console.error('❌ PUT /api/vendor/settings: update failed:', updateErr)
      return NextResponse.json({ error: 'Impossible de sauvegarder les réglages.' }, { status: 500 })
    }

    const prefs = asObject((updated as any)?.preferences)
    const vendorDashboard = asObject(prefs.vendor_dashboard)

    return NextResponse.json(
      {
        data: {
          vendorDashboard: {
            notifications: asObject(vendorDashboard.notifications),
            ai: asObject(vendorDashboard.ai)
          }
        }
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('❌ PUT /api/vendor/settings unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
