'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertDriver } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'

type Json = null | string | number | boolean | { [key: string]: Json } | Json[]

interface DriverProfileRow {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  neighborhood: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  identity_doc_type: string | null
  identity_doc_number: string | null
  identity_doc_front_url: string | null
  identity_doc_back_url: string | null
  selfie_with_doc_url: string | null
  transport_mode: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_plate: string | null
  vehicle_color: string | null
  vehicle_photos: Json
  zones: Json
  availability: Json
  availability_slots?: Json
  is_available: boolean
  max_distance_km: number | null
  status: string
  rating: number | null
  completed_deliveries: number
  cancelled_deliveries: number
  created_at: string
  updated_at: string
}

/**
 * Normalise une ligne drivers en payload front stable.
 */
function normalizeDriverProfile(row: DriverProfileRow) {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    address: row.address,
    neighborhood: row.neighborhood,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    identityDocType: row.identity_doc_type,
    identityDocNumber: row.identity_doc_number,
    identityDocFrontUrl: row.identity_doc_front_url,
    identityDocBackUrl: row.identity_doc_back_url,
    selfieWithDocUrl: row.selfie_with_doc_url,
    transportMode: row.transport_mode,
    vehicleBrand: row.vehicle_brand,
    vehicleModel: row.vehicle_model,
    vehiclePlate: row.vehicle_plate,
    vehicleColor: row.vehicle_color,
    vehiclePhotos: row.vehicle_photos ?? null,
    zones: row.zones ?? null,
    availability: row.availability ?? null,
    availabilitySlots: row.availability_slots ?? [],
    isAvailable: Boolean(row.is_available),
    maxDistanceKm: row.max_distance_km,
    status: row.status,
    rating: row.rating,
    completedDeliveries: row.completed_deliveries,
    cancelledDeliveries: row.cancelled_deliveries,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Construit un update object Supabase pour la table drivers.
 */
function buildDriverProfileUpdates(body: any): Record<string, unknown> {
  const updates: Record<string, unknown> = {}

  const setIfString = (key: string, value: unknown) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      updates[key] = trimmed.length > 0 ? trimmed : null
    } else if (value === null) {
      updates[key] = null
    }
  }

  setIfString('first_name', body?.firstName)
  setIfString('last_name', body?.lastName)
  setIfString('phone', body?.phone)
  setIfString('whatsapp', body?.whatsapp)
  setIfString('address', body?.address)
  setIfString('neighborhood', body?.neighborhood)
  setIfString('emergency_contact_name', body?.emergencyContactName)
  setIfString('emergency_contact_phone', body?.emergencyContactPhone)

  setIfString('identity_doc_type', body?.identityDocType)
  setIfString('identity_doc_number', body?.identityDocNumber)
  setIfString('identity_doc_front_url', body?.identityDocFrontUrl)
  setIfString('identity_doc_back_url', body?.identityDocBackUrl)
  setIfString('selfie_with_doc_url', body?.selfieWithDocUrl)

  setIfString('transport_mode', body?.transportMode)
  setIfString('vehicle_brand', body?.vehicleBrand)
  setIfString('vehicle_model', body?.vehicleModel)
  setIfString('vehicle_plate', body?.vehiclePlate)
  setIfString('vehicle_color', body?.vehicleColor)

  if (typeof body?.maxDistanceKm === 'number') {
    updates.max_distance_km = Number.isFinite(body.maxDistanceKm) ? body.maxDistanceKm : null
  } else if (body?.maxDistanceKm === null) {
    updates.max_distance_km = null
  }

  if (typeof body?.isAvailable === 'boolean') {
    updates.is_available = body.isAvailable
  }

  if (body?.zones !== undefined) {
    updates.zones = body.zones
  }

  if (body?.availabilitySlots !== undefined) {
    updates.availability_slots = body.availabilitySlots
  }

  if (body?.vehiclePhotos !== undefined) {
    updates.vehicle_photos = body.vehiclePhotos
  }

  return updates
}

/**
 * GET /api/driver/profile — Retourne le profil drivers pour le livreur connecté.
 * Crée une ligne minimale si elle n'existe pas encore.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await assertDriver(request)
    const supabase = getSupabaseAdmin()

    const { data: existing, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ data: normalizeDriverProfile(existing as DriverProfileRow) })
    }

    const { data: created, error: createError } = await supabase
      .from('drivers')
      .upsert({ user_id: userId, status: 'draft', is_available: false }, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (createError || !created) {
      return NextResponse.json({ error: createError?.message ?? 'Impossible de créer le profil livreur.' }, { status: 500 })
    }

    return NextResponse.json({ data: normalizeDriverProfile(created as DriverProfileRow) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status =
      lower.includes('token supabase manquant') ||
      lower.includes('utilisateur introuvable') ||
      lower.includes('token invalide')
        ? 401
        : lower.includes('accès réservé aux livreurs')
          ? 403
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * PUT /api/driver/profile — Met à jour le profil drivers du livreur connecté.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await assertDriver(request)
    const supabase = getSupabaseAdmin()

    const body = await request.json().catch(() => ({}))
    const updates = buildDriverProfileUpdates(body)

    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Impossible de mettre à jour le profil.' }, { status: 500 })
    }

    return NextResponse.json({ data: normalizeDriverProfile(data as DriverProfileRow) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const lower = message.toLowerCase()
    const status =
      lower.includes('token supabase manquant') ||
      lower.includes('utilisateur introuvable') ||
      lower.includes('token invalide')
        ? 401
        : lower.includes('accès réservé aux livreurs')
          ? 403
          : 500
    return NextResponse.json({ error: message }, { status })
  }
}
