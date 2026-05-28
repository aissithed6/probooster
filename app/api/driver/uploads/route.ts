import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertDriver } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'

/**
 * POST /api/driver/uploads
 * Upload sécurisé (serveur) pour les assets du profil livreur.
 * - Limite 3 Mo
 * - Retourne une URL publique
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertDriver(request)

    const form = await request.formData()
    const file = form.get('file')
    const category = String(form.get('category') ?? '')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 })
    }

    if (category !== 'identity' && category !== 'vehicle') {
      return NextResponse.json({ error: 'Catégorie invalide.' }, { status: 400 })
    }

    const maxBytes = 3 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Taille maximale: 3 Mo.' }, { status: 413 })
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const bucketName = 'driver-assets'
    const objectPath = `drivers/${userId}/${category}/${uniqueId}.${extension}`

    const supabase = getSupabaseAdmin()
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
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

    return NextResponse.json({ data: { publicUrl, path: objectPath } }, { status: 201 })
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
