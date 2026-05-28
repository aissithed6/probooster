import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

/**
 * Crée (ou met à jour) le bucket Supabase Storage pour les uploads de chat.
 * - Bucket: chat-uploads (par défaut)
 * - Public: true (recommandé pour que les URLs publiques fonctionnent directement)
 *
 * Prérequis:
 * - NEXT_PUBLIC_SUPABASE_URL dans .env.local
 * - SUPABASE_SERVICE_ROLE_KEY dans .env.local
 */

const bucketName = (process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET || 'chat-uploads').trim()
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim()

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL manquant (dans .env.local)')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant (dans .env.local)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function main() {
  console.log(`▶ Setup bucket Storage: ${bucketName}`)

  // 1) Vérifier si le bucket existe
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('❌ Impossible de lister les buckets:', listError)
    process.exit(1)
  }

  const exists = Array.isArray(buckets) && buckets.some((b) => String(b?.name ?? '') === bucketName)

  // 2) Créer ou mettre à jour
  if (!exists) {
    console.log(`ℹ Bucket "${bucketName}" absent. Création...`)
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    })

    if (error) {
      console.error('❌ Échec création bucket:', error)
      process.exit(1)
    }

    console.log('✅ Bucket créé:', data)
  } else {
    console.log(`ℹ Bucket "${bucketName}" existe déjà. Mise à jour en public...`)
    const { data, error } = await supabase.storage.updateBucket(bucketName, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024
    })

    if (error) {
      console.error('❌ Échec update bucket:', error)
      process.exit(1)
    }

    console.log('✅ Bucket mis à jour:', data)
  }

  // 3) Vérification URL publique
  const testPath = 'chat/_healthcheck.txt'
  const { error: uploadError } = await supabase.storage.from(bucketName).upload(testPath, new Blob(['ok'], { type: 'text/plain' }), {
    upsert: true,
    contentType: 'text/plain'
  })

  if (uploadError) {
    console.error('⚠ Upload test échoué (policies?):', uploadError)
  } else {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(testPath)
    console.log('✅ URL publique exemple:', data?.publicUrl)
  }

  console.log('✅ Setup terminé.')
}

main().catch((err) => {
  console.error('❌ Erreur script:', err)
  process.exit(1)
})
