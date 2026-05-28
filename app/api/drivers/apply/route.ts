import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '../../../../lib/supabase'

interface DriverApplyPayload {
  profile?: {
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    whatsapp?: string | null
    address?: string | null
    neighborhood?: string | null

    emergencyContactName?: string | null
    emergencyContactPhone?: string | null

    identityDocType?: string | null
    identityDocNumber?: string | null
    identityDocFrontUrl?: string | null
    identityDocBackUrl?: string | null
    selfieWithDocUrl?: string | null

    transportMode?: 'motorbike' | 'car' | 'tricycle' | 'bicycle' | 'walking' | 'other' | null
    vehicleBrand?: string | null
    vehicleModel?: string | null
    vehiclePlate?: string | null
    vehicleColor?: string | null

    zones?: unknown
    availability?: unknown
    maxDistanceKm?: number | null
  }
}

/**
 * Extrait un token Supabase depuis l'en-tête Authorization ou depuis les cookies.
 */
async function extractAccessToken(request: NextRequest): Promise<string | undefined> {
  const bearerHeader = request.headers.get('authorization') ?? undefined
  if (bearerHeader?.startsWith('Bearer ')) {
    const token = bearerHeader.slice(7).trim()
    if (token.length > 0) return token
  }

  const tokenFromCookies = request.cookies.get('sb-access-token')?.value
  if (tokenFromCookies) return tokenFromCookies

  const supabaseAuthCookie = request.cookies.get('supabase-auth-token')?.value
  if (!supabaseAuthCookie) return undefined

  const attempts = [supabaseAuthCookie]
  try {
    const decoded = decodeURIComponent(supabaseAuthCookie)
    if (decoded !== supabaseAuthCookie) attempts.push(decoded)
  } catch {
    // ignore
  }

  for (const raw of attempts) {
    try {
      const parsed = JSON.parse(raw)
      const token: unknown = parsed?.currentSession?.access_token ?? parsed?.currentAccessToken ?? parsed?.access_token
      if (typeof token === 'string' && token.length > 0) return token
    } catch {
      // ignore
    }
  }

  return undefined
}

/**
 * Résout l'utilisateur authentifié (simple présence d'un compte Supabase).
 */
async function requireAuthenticatedUser(request: NextRequest): Promise<string> {
  const supabase = getSupabaseAdmin()
  const accessToken = await extractAccessToken(request)
  if (!accessToken) {
    throw new Error('Authentification requise.')
  }

  const { data: authData, error } = await supabase.auth.getUser(accessToken)
  if (error || !authData?.user?.id) {
    throw new Error('Authentification invalide.')
  }

  return authData.user.id
}

/**
 * Soumet une demande pour devenir livreur + met à jour le profil driver.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuthenticatedUser(request)
    const supabase = getSupabaseAdmin()

    const payload = (await request.json().catch(() => ({}))) as DriverApplyPayload
    const profile = payload?.profile ?? {}

    const { data: existingPending } = await supabase
      .from('driver_applications')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingPending?.id) {
      return NextResponse.json(
        { error: 'Une demande est déjà en cours de vérification.' },
        { status: 409 }
      )
    }

    await supabase
      .from('drivers')
      .upsert(
        {
          user_id: userId,
          first_name: profile.firstName ?? null,
          last_name: profile.lastName ?? null,
          phone: profile.phone ?? null,
          whatsapp: profile.whatsapp ?? null,
          address: profile.address ?? null,
          neighborhood: profile.neighborhood ?? null,

          emergency_contact_name: profile.emergencyContactName ?? null,
          emergency_contact_phone: profile.emergencyContactPhone ?? null,

          identity_doc_type: profile.identityDocType ?? null,
          identity_doc_number: profile.identityDocNumber ?? null,
          identity_doc_front_url: profile.identityDocFrontUrl ?? null,
          identity_doc_back_url: profile.identityDocBackUrl ?? null,
          selfie_with_doc_url: profile.selfieWithDocUrl ?? null,

          transport_mode: profile.transportMode ?? null,
          vehicle_brand: profile.vehicleBrand ?? null,
          vehicle_model: profile.vehicleModel ?? null,
          vehicle_plate: profile.vehiclePlate ?? null,
          vehicle_color: profile.vehicleColor ?? null,

          zones: profile.zones ?? null,
          availability: profile.availability ?? null,
          max_distance_km: profile.maxDistanceKm ?? null,

          status: 'pending_review'
        },
        { onConflict: 'user_id' }
      )

    const { data: application, error: appError } = await supabase
      .from('driver_applications')
      .insert({
        user_id: userId,
        status: 'pending',
        payload: payload ?? {}
      })
      .select('id, status, submitted_at')
      .single()

    if (appError || !application) {
      const message = appError?.message ?? appError?.hint ?? appError?.details ?? 'Impossible de soumettre la demande.'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ data: application }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('authentification') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
