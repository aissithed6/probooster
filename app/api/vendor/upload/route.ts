import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '../_helpers/auth'
import { getSupabaseAdmin } from '../../../../lib/supabase'

/**
 * POST /api/vendor/upload
 * Upload sécurisé de documents ou d'avatar pour le vendeur.
 * - Limite 5 Mo
 * - Stockage dans bucket user-assets
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const form = await request.formData()
    const file = form.get('file')
    const type = form.get('type') || 'avatar'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 })
    }

    const maxBytes = 10 * 1024 * 1024 // 10 Mo pour les documents
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Taille maximale: 10 Mo.' }, { status: 413 })
    }

    const isAvatar = type === 'avatar'
    const extension = file.name.split('.').pop()?.toLowerCase() ?? (isAvatar ? 'jpg' : 'pdf')
    const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const bucketName = 'user-assets'
    const objectPath = isAvatar
      ? `avatars/vendors/${userId}/avatar/${uniqueId}.${extension}`
      : `documents/vendors/${userId}/${type}/${uniqueId}.${extension}`

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

    if (isAvatar) {
      // Mettre à jour l'avatar directement
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Ajouter aux documents de vérification
      const { data: current } = await supabase
        .from('user_profiles')
        .select('verification')
        .eq('user_id', userId)
        .maybeSingle()

      const verification = typeof (current as any)?.verification === 'object' ? { ...(current as any).verification } : { documents: [] }
      const documents = Array.isArray(verification.documents) ? [...verification.documents] : []
      
      documents.push({
        id: objectPath,
        type: String(type),
        name: file.name,
        status: 'pending',
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      })

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ verification: { ...verification, documents }, updated_at: new Date().toISOString() } as any)
        .eq('user_id', userId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'document_uploaded',
        entity_type: 'user',
        entity_id: userId,
        details: { 
          document_type: type,
          document_name: file.name
        }
      })
    }

    return NextResponse.json({ data: { publicUrl } }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
