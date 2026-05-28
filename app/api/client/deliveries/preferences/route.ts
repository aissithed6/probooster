import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer } from '@/app/api/client/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const DEFAULT_NOTIFICATION_CHANNELS = {
  email: true,
  sms: false,
  push: true,
  soundAlerts: true,
  vibrationAlerts: false,
  gpsTracking: true
} as const

const DEFAULT_PREFERENCES = {
  preferred_time_window: '9h-18h',
  contact_before_delivery: true,
  leave_at_door: false,
  require_signature: true,
  notification_channels: DEFAULT_NOTIFICATION_CHANNELS,
  metadata: {}
} as const

interface DeliveryPreferencesUpdatePayload {
  preferredTimeWindow?: string
  contactBeforeDelivery?: boolean
  leaveAtDoor?: boolean
  requireSignature?: boolean
  notificationChannels?: Partial<typeof DEFAULT_NOTIFICATION_CHANNELS>
  metadata?: Record<string, unknown>
}

/**
 * Extrait une valeur de chaîne, ou retourne null si invalide.
 */
function normalizeTextOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Extrait une configuration checkout depuis metadata.checkout si disponible.
 */
function extractCheckoutFromMetadata(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object') return null
  const checkout = (metadata as any)?.checkout
  if (!checkout || typeof checkout !== 'object') return null
  return checkout as Record<string, unknown>
}

const normalizePreferences = (row: any) => ({
  id: row.id,
  customerId: row.customer_id,
  preferredTimeWindow: row.preferred_time_window,
  contactBeforeDelivery: row.contact_before_delivery,
  leaveAtDoor: row.leave_at_door,
  requireSignature: row.require_signature,
  notificationChannels: {
    email: Boolean(row.notification_channels?.email),
    sms: Boolean(row.notification_channels?.sms),
    push: Boolean(row.notification_channels?.push),
    soundAlerts: Boolean(row.notification_channels?.soundAlerts),
    vibrationAlerts: Boolean(row.notification_channels?.vibrationAlerts),
    gpsTracking: Boolean(row.notification_channels?.gpsTracking)
  },
  metadata: row.metadata ?? {},
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

/**
 * Retourne les préférences de livraison du client connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('delivery_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur lors de la récupération des préférences de livraison:', error)
      return NextResponse.json({ error: "Impossible de récupérer les préférences de livraison." }, { status: 500 })
    }

    if (!data) {
      const { data: inserted, error: insertError } = await supabase
        .from('delivery_preferences')
        .insert({
          customer_id: customerId,
          ...DEFAULT_PREFERENCES
        })
        .select('*')
        .single()

      if (insertError || !inserted) {
        console.error('❌ Erreur lors de la création des préférences par défaut:', insertError)
        return NextResponse.json({ error: "Impossible d'initialiser les préférences de livraison." }, { status: 500 })
      }

      return NextResponse.json({ data: normalizePreferences(inserted) })
    }

    return NextResponse.json({ data: normalizePreferences(data) })
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la récupération des préférences de livraison:', error)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}

/**
 * Met à jour les préférences de livraison du client connecté.
 */
export async function PATCH(request: NextRequest) {
  try {
    const customerId = await assertCustomer(request)
    const supabase = getSupabaseAdmin()
    const payload = (await request.json()) as DeliveryPreferencesUpdatePayload

    const { data: existing, error: fetchError } = await supabase
      .from('delivery_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération actuelle des préférences:', fetchError)
      return NextResponse.json({ error: "Impossible de récupérer les préférences actuelles." }, { status: 500 })
    }

    const notificationChannels = {
      ...DEFAULT_NOTIFICATION_CHANNELS,
      ...(existing?.notification_channels ?? {}),
      ...(payload.notificationChannels ?? {})
    }

    const updateInput = {
      preferred_time_window: payload.preferredTimeWindow ?? existing?.preferred_time_window ?? DEFAULT_PREFERENCES.preferred_time_window,
      contact_before_delivery: payload.contactBeforeDelivery ?? existing?.contact_before_delivery ?? DEFAULT_PREFERENCES.contact_before_delivery,
      leave_at_door: payload.leaveAtDoor ?? existing?.leave_at_door ?? DEFAULT_PREFERENCES.leave_at_door,
      require_signature: payload.requireSignature ?? existing?.require_signature ?? DEFAULT_PREFERENCES.require_signature,
      notification_channels: notificationChannels,
      metadata: payload.metadata ?? existing?.metadata ?? DEFAULT_PREFERENCES.metadata
    }

    const checkout = extractCheckoutFromMetadata(updateInput.metadata)
    const checkoutColumns = checkout
      ? {
          checkout_zone: normalizeTextOrNull((checkout as any)?.zone),
          checkout_method: normalizeTextOrNull((checkout as any)?.method),
          checkout_aggregation: normalizeTextOrNull((checkout as any)?.aggregation),

          checkout_geo_local_district: normalizeTextOrNull((checkout as any)?.geoLocalDistrict),
          checkout_geo_department: normalizeTextOrNull((checkout as any)?.geoDepartment),
          checkout_geo_city: normalizeTextOrNull((checkout as any)?.geoCity),
          checkout_geo_arrondissement: normalizeTextOrNull((checkout as any)?.geoArrondissement),
          checkout_geo_district: normalizeTextOrNull((checkout as any)?.geoDistrict),
          checkout_geo_country: normalizeTextOrNull((checkout as any)?.geoCountry),
          checkout_geo_region_department: normalizeTextOrNull((checkout as any)?.geoRegionDepartment)
        }
      : {}

    const { data: upserted, error: upsertError } = await supabase
      .from('delivery_preferences')
      .upsert({
        customer_id: customerId,
        ...updateInput,
        ...(checkoutColumns as any)
      }, { onConflict: 'customer_id' })
      .select('*')
      .single()

    if (upsertError || !upserted) {
      console.error('❌ Erreur lors de la mise à jour des préférences de livraison:', upsertError)
      return NextResponse.json({ error: "Impossible de mettre à jour les préférences de livraison." }, { status: 500 })
    }

    return NextResponse.json({ data: normalizePreferences(upserted) })
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la mise à jour des préférences de livraison:', error)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
