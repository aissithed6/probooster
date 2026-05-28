import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertDriver } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'

/**
 * POST /api/driver/avatar
 * Upload sécurisé de la photo de profil (avatar) du livreur.
 * - Limite 3 Mo
 * - Stockage dans bucket driver-assets
 * - Met à jour public.user_profiles.avatar_url
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertDriver(request)
    const supabase = getSupabaseAdmin()

    const form = await request.formData()
    const file = form.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 })
    }

    const maxBytes = 3 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Taille maximale: 3 Mo.' }, { status: 413 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Type de fichier invalide (image requise).' }, { status: 400 })
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const bucketName = 'driver-assets'
    const objectPath = `drivers/${userId}/avatar/${uniqueId}.${extension}`

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(objectPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(bucketName).getPublicUrl(objectPath)

    if (!publicUrl) {
      return NextResponse.json({ error: "Impossible d'obtenir l'URL publique." }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: { publicUrl } }, { status: 201 })
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
