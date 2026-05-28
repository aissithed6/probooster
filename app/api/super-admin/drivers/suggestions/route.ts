import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertOpsOrSuperAdmin } from '../../_helpers/auth'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

type Json = null | string | number | boolean | { [key: string]: Json } | Json[]

interface DriverRow {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  neighborhood: string | null
  transport_mode: string | null
  vehicle_plate: string | null
  vehicle_color: string | null
  zones: Json
  availability: Json
  availability_slots?: Json
  is_available: boolean
  status: string
  rating: number | null
  completed_deliveries: number
  cancelled_deliveries: number
}

function matchesAvailabilitySlotsNow(value: unknown): boolean {
  if (!value) return false
  if (!Array.isArray(value)) return false
  const now = Date.now()
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const startRaw = (entry as any).start
    const endRaw = (entry as any).end
    if (typeof startRaw !== 'string' || typeof endRaw !== 'string') continue
    const start = new Date(startRaw).getTime()
    const end = new Date(endRaw).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    if (now >= start && now <= end) return true
  }
  return false
}

interface UserProfileAvatarRow {
  user_id: string
  avatar_url: string | null
}

/**
 * Détermine si un livreur est disponible maintenant selon drivers.availability.
 * Format attendu: { mon: ["08:00-18:00"], sat: ["10:00-14:00"] }
 */
function matchesAvailabilityNow(availability: unknown): boolean {
  if (!availability || typeof availability !== 'object') {
    return true
  }

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const todayKey = dayKeys[new Date().getDay()]
  const ranges = (availability as any)?.[todayKey]
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return false
  }

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (const raw of ranges) {
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    const [startRaw, endRaw] = trimmed.split('-').map((v) => v?.trim())
    if (!startRaw || !endRaw) continue

    const startMatch = startRaw.match(/^(\d{1,2}):(\d{2})$/)
    const endMatch = endRaw.match(/^(\d{1,2}):(\d{2})$/)
    if (!startMatch || !endMatch) continue

    const sh = Number(startMatch[1])
    const sm = Number(startMatch[2])
    const eh = Number(endMatch[1])
    const em = Number(endMatch[2])
    if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) continue

    const start = sh * 60 + sm
    const end = eh * 60 + em

    if (end >= start) {
      if (nowMinutes >= start && nowMinutes <= end) return true
    } else {
      // Plage qui passe minuit (ex: 22:00-02:00)
      if (nowMinutes >= start || nowMinutes <= end) return true
    }
  }

  return false
}

/**
 * Extrait un champ (ville/quartier) d'une adresse JSON (shipping_address).
 */
function extractAddressText(address: unknown, key: 'city' | 'state' | 'country' | 'neighborhood'): string {
  if (!address) return ''
  if (typeof address !== 'object') return ''

  const record = address as Record<string, unknown>

  const readKey = (obj: unknown): string => {
    if (!obj || typeof obj !== 'object') return ''
    const v = (obj as any)?.[key]
    return typeof v === 'string' ? v.trim() : ''
  }

  const direct = readKey(record)
  if (direct) return direct

  const deliveryCandidate = (record as any)?.delivery_address ?? (record as any)?.deliveryAddress ?? null
  if (typeof deliveryCandidate === 'object' && deliveryCandidate !== null) {
    const nested = readKey(deliveryCandidate)
    if (nested) return nested
  }

  const nestedCandidates = [record['address'], record['shipping'], record['location'], record['destination']]
  for (const candidate of nestedCandidates) {
    const nested = readKey(candidate)
    if (nested) return nested
  }

  return ''
}

/**
 * Détermine si un driver couvre une zone (ville/quartier) selon son profil.
 * - supporte drivers.neighborhood (texte)
 * - supporte drivers.zones (jsonb libre): array de strings ou objects { city, neighborhoods }
 */
function matchesZone(driver: DriverRow, city: string, neighborhood: string): boolean {
  const normCity = city.toLowerCase()
  const normNeighborhood = neighborhood.toLowerCase()

  const driverNeighborhood = (driver.neighborhood ?? '').toLowerCase()
  if (normNeighborhood && driverNeighborhood && driverNeighborhood.includes(normNeighborhood)) {
    return true
  }

  const zones = driver.zones
  if (!zones) {
    return normCity.length === 0
  }

  if (Array.isArray(zones)) {
    for (const entry of zones) {
      if (typeof entry === 'string') {
        const v = entry.toLowerCase()
        if (normNeighborhood && v.includes(normNeighborhood)) return true
        if (normCity && v.includes(normCity)) return true
        continue
      }

      if (entry && typeof entry === 'object') {
        const zCity = typeof (entry as any).city === 'string' ? (entry as any).city.toLowerCase() : ''
        if (normCity && zCity && zCity !== normCity) {
          continue
        }

        const neighborhoods = (entry as any).neighborhoods
        if (Array.isArray(neighborhoods) && normNeighborhood) {
          const hit = neighborhoods.some((n: any) => typeof n === 'string' && n.toLowerCase().includes(normNeighborhood))
          if (hit) return true
        }

        if (normCity && zCity === normCity) {
          return true
        }
      }
    }
  }

  return normCity.length === 0
}

/**
 * Suggère des livreurs disponibles pour une commande, en se basant sur orders.shipping_address.
 */
export async function GET(request: NextRequest) {
  try {
    await assertOpsOrSuperAdmin(request)
    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requis.' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, shipping_address')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      const message = orderError.message ?? orderError.hint ?? orderError.details ?? 'Impossible de charger la commande.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    const address = (order as any).shipping_address
    const city = extractAddressText(address, 'city')
    const neighborhood = extractAddressText(address, 'neighborhood')

    const shouldFilterZone = Boolean(city.trim().length > 0 || neighborhood.trim().length > 0)

    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select(
        'id,user_id,first_name,last_name,phone,whatsapp,address,neighborhood,transport_mode,vehicle_plate,vehicle_color,zones,availability,availability_slots,is_available,status,rating,completed_deliveries,cancelled_deliveries'
      )
      .in('status', ['approved', 'active', 'draft', 'pending'])
      .eq('is_available', true)
      .limit(500)

    if (driversError) {
      const message = driversError.message ?? driversError.hint ?? driversError.details ?? 'Impossible de charger les livreurs.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const list = (drivers ?? []) as DriverRow[]
    const afterZone = shouldFilterZone ? list.filter((driver) => matchesZone(driver, city, neighborhood)) : list
    const filtered = afterZone
      .filter((driver) => {
        const slots = (driver as any).availability_slots
        if (Array.isArray(slots) && slots.length > 0) {
          return matchesAvailabilitySlotsNow(slots)
        }
        return matchesAvailabilityNow(driver.availability)
      })
      .sort((a, b) => {
        const ar = a.rating ?? 0
        const br = b.rating ?? 0
        if (br !== ar) return br - ar
        return (b.completed_deliveries ?? 0) - (a.completed_deliveries ?? 0)
      })
      .slice(0, 50)

    const userIds = filtered.map((driver) => driver.user_id).filter(Boolean)
    let avatarByUserId = new Map<string, string | null>()

    if (userIds.length > 0) {
      const { data: avatars, error: avatarsError } = await supabase
        .from('user_profiles')
        .select('user_id, avatar_url')
        .in('user_id', userIds)

      if (!avatarsError && avatars) {
        avatarByUserId = new Map((avatars as UserProfileAvatarRow[]).map((row) => [row.user_id, row.avatar_url]))
      }
    }

    const enriched = filtered.map((driver) => ({
      ...driver,
      avatar_url: avatarByUserId.get(driver.user_id) ?? null
    }))

    return NextResponse.json({
      data: enriched,
      meta: {
        city: city || null,
        neighborhood: neighborhood || null,
        shouldFilterZone,
        counts: {
          total: list.length,
          afterZone: afterZone.length,
          suggested: filtered.length
        }
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
