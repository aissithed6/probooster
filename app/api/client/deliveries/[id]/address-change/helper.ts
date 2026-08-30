import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'
import {
  computeDeliveryPriceFromRule,
  selectBestDeliveryRule,
  type DeliveryRule
} from '@/lib/utils/delivery-rule-matcher'

export const EDITABLE_DELIVERY_STATUSES = ['pending', 'processing', 'confirmed', 'preparing'] as const

export type AddressChangePayload = {
  shippingAddress?: string | null
  shippingLat?: number | null
  shippingLng?: number | null
  zone?: string | null
  mode?: string | null
  country?: string | null
  regionDepartment?: string | null
  localDistrict?: string | null
  department?: string | null
  city?: string | null
  arrondissement?: string | null
  district?: string | null
}

export type DeliveryForAddressChange = {
  id: string
  order_id: string
  customer_id: string | null
  vendor_id: string | null
  driver_id: string | null
  status: string | null
  metadata: Record<string, unknown> | null
  orders: {
    id: string
    shipping_address?: any | null
    shipping_lat?: number | null
    shipping_lng?: number | null
    shipping_cost?: number | null
  } | null
}

export function normalizeZone(raw: unknown): 'local' | 'regional' | 'national' | 'international' {
  const v = String(raw ?? '').trim().toLowerCase()
  if (v === 'international' || v === 'national' || v === 'regional') return v
  return 'local'
}

export function normalizeMode(raw: unknown): 'standard' | 'express' {
  return String(raw ?? '').trim().toLowerCase() === 'express' ? 'express' : 'standard'
}

export function toOptionalNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const n = Number(raw.trim().replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function jsonError(message: string, statusCode: number) {
  return NextResponse.json({ error: message }, { status: statusCode })
}

/**
 * Charge la config livraison (règles) depuis super_admin_settings.
 */
export async function fetchDeliveryRules(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<DeliveryRule[]> {
  try {
    const { data } = await supabase
      .from('super_admin_settings')
      .select('settings')
      .eq('scope', 'global')
      .maybeSingle()

    const settings = (data as any)?.settings ?? {}
    const config = settings.deliveryConfig ?? {}
    const rules = settings.deliveryRules ?? config.deliveryRules
    return Array.isArray(rules) ? (rules as DeliveryRule[]) : []
  } catch {
    return []
  }
}

/**
 * Calcule le coût de livraison pour une destination donnée à partir des règles admin.
 */
export function computeShippingCost(
  rules: DeliveryRule[],
  payload: AddressChangePayload,
  quantity = 1,
  weightKg: number | null = null
): number | null {
  const zone = normalizeZone(payload.zone)
  const mode = normalizeMode(payload.mode)

  const geo =
    zone === 'international'
      ? { country: payload.country ?? null }
      : zone === 'regional'
        ? { regionDepartment: payload.regionDepartment ?? payload.department ?? null }
        : zone === 'national'
          ? {
              department: payload.department ?? null,
              city: payload.city ?? null,
              arrondissement: payload.arrondissement ?? null,
              district: payload.district ?? null
            }
          : { localDistrict: payload.localDistrict ?? null }

  const rule = selectBestDeliveryRule(rules, { mode, zone, geo: geo as any, quantity, weightKg })
  if (!rule) return null
  return Math.ceil(computeDeliveryPriceFromRule(rule, { orderUnits: 1, itemUnits: quantity, weightKg }))
}

/**
 * Vérifie le paiement FeexPay d'un supplément (mode mock ou live).
 */
export async function verifyFeexpayPayment(reference: string, expectedAmount: number): Promise<{ paid: boolean; error?: string }> {
  const mode = (process.env.FEEXPAY_MODE ?? 'mock').toLowerCase()

  if (mode === 'mock') return { paid: true }

  const apiKey = process.env.FEEXPAY_API_KEY
  if (!apiKey) return { paid: false, error: 'FeexPay non configuré (FEEXPAY_API_KEY manquant).' }

  try {
    const upstream = await fetch(
      `https://api.feexpay.me/api/transactions/public/single/status/${encodeURIComponent(reference)}`,
      { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` } }
    )
    const json: any = await upstream.json().catch(() => null)
    const status = String(json?.status ?? json?.data?.status ?? '').toLowerCase()
    const amount = Number(json?.amount ?? json?.data?.amount ?? NaN)

    if (!upstream.ok) return { paid: false, error: 'Vérification FeexPay échouée.' }
    if (!['successful', 'completed', 'paid', 'success'].includes(status)) {
      return { paid: false, error: `Paiement non confirmé (statut: ${status || 'inconnu'}).` }
    }
    if (Number.isFinite(amount) && amount + 0.01 < expectedAmount) {
      return { paid: false, error: 'Montant payé insuffisant.' }
    }
    return { paid: true }
  } catch (error) {
    return { paid: false, error: error instanceof Error ? error.message : 'Erreur vérification paiement.' }
  }
}

/**
 * Charge une livraison appartenant au client et vérifie qu'elle est modifiable.
 */
export async function loadEditableDelivery(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  deliveryId: string,
  customerId: string
): Promise<{ delivery: DeliveryForAddressChange | null; error?: string; statusCode?: number }> {
  const { data: delivery, error } = await supabase
    .from('deliveries')
    .select(
      `id, order_id, customer_id, vendor_id, driver_id, status, metadata,
       orders:orders!deliveries_order_id_fkey (id, shipping_address, shipping_lat, shipping_lng, shipping_cost)`
    )
    .eq('id', deliveryId)
    .eq('customer_id', customerId)
    .maybeSingle()

  if (error) return { delivery: null, error: error.message, statusCode: 500 }
  if (!delivery) return { delivery: null, error: 'Livraison introuvable.', statusCode: 404 }

  const status = String((delivery as any).status ?? '').toLowerCase()
  if (!(EDITABLE_DELIVERY_STATUSES as readonly string[]).includes(status)) {
    return {
      delivery: null,
      error: `La livraison ne peut plus être modifiée (statut actuel: ${status || 'inconnu'}).`,
      statusCode: 409
    }
  }

  return { delivery: delivery as unknown as DeliveryForAddressChange }
}

/**
 * Valide et normalise le payload de changement d'adresse.
 */
export function parseAddressChangePayload(body: any): { payload: AddressChangePayload; error?: string } {
  const lat = toOptionalNumber(body?.shippingLat)
  const lng = toOptionalNumber(body?.shippingLng)
  const address = typeof body?.shippingAddress === 'string' ? body.shippingAddress.trim() : ''

  // 0/0 invalide explicitement (océan) — protection
  if (lat !== null && lng !== null && lat === 0 && lng === 0) {
    return { payload: {}, error: 'Coordonnées GPS invalides (0,0).' }
  }
  if ((lat === null) !== (lng === null)) {
    return { payload: {}, error: 'Coordonnées GPS incomplètes (lat et lng requis).' }
  }
  if (!address && lat === null) {
    return { payload: {}, error: 'Adresse ou coordonnées GPS requises.' }
  }
  if (lat !== null && (Math.abs(lat) > 90 || Math.abs(lng as number) > 180)) {
    return { payload: {}, error: 'Coordonnées GPS hors limites.' }
  }

  return {
    payload: {
      shippingAddress: address || null,
      shippingLat: lat,
      shippingLng: lng,
      zone: normalizeZone(body?.zone),
      mode: normalizeMode(body?.mode),
      country: typeof body?.country === 'string' ? body.country.trim() : null,
      regionDepartment: typeof body?.regionDepartment === 'string' ? body.regionDepartment.trim() : null,
      localDistrict: typeof body?.localDistrict === 'string' ? body.localDistrict.trim() : null,
      department: typeof body?.department === 'string' ? body.department.trim() : null,
      city: typeof body?.city === 'string' ? body.city.trim() : null,
      arrondissement: typeof body?.arrondissement === 'string' ? body.arrondissement.trim() : null,
      district: typeof body?.district === 'string' ? body.district.trim() : null
    }
  }
}
