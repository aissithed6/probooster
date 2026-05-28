import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'
import { Client as PgClient } from 'pg'

/**
 * Vérifie la présence des variables d'environnement indispensables.
 */
function assertEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`)
  }
  return value
}

/**
 * Crée le bucket `user-assets` s'il n'existe pas encore.
 */
async function ensureBucket(supabaseUrl: string, serviceRoleKey: string) {
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const bucketName = 'user-assets'

  const { data: existing, error: getError } = await supabase.storage.getBucket(bucketName)

  if (getError && getError.message !== 'The resource was not found') {
    throw getError
  }

  if (existing) {
    console.log(`✅ Bucket "${bucketName}" déjà présent.`)
    return
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: `${5 * 1024 * 1024}`,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  })

  if (createError) {
    throw createError
  }

  console.log(`✅ Bucket "${bucketName}" créé et configuré en mode public.`)
}

/**
 * Crée les politiques RLS nécessaires sur storage.objects pour le bucket.
 */
async function ensurePolicies(pgConnectionString: string) {
  const pgClient = new PgClient({ connectionString: pgConnectionString })
  await pgClient.connect()

  try {
    await pgClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE polname = 'authenticated_can_upload_user_assets'
        ) THEN
          CREATE POLICY authenticated_can_upload_user_assets
          ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (
            bucket_id = 'user-assets'
            AND auth.uid()::text = (storage.foldername(name))[1]
          );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE polname = 'authenticated_can_update_user_assets'
        ) THEN
          CREATE POLICY authenticated_can_update_user_assets
          ON storage.objects
          FOR UPDATE TO authenticated
          USING (
            bucket_id = 'user-assets'
            AND auth.uid()::text = (storage.foldername(name))[1]
          )
          WITH CHECK (
            bucket_id = 'user-assets'
            AND auth.uid()::text = (storage.foldername(name))[1]
          );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE polname = 'authenticated_can_delete_user_assets'
        ) THEN
          CREATE POLICY authenticated_can_delete_user_assets
          ON storage.objects
          FOR DELETE TO authenticated
          USING (
            bucket_id = 'user-assets'
            AND auth.uid()::text = (storage.foldername(name))[1]
          );
        END IF;
      END
      $$;
    `)

    console.log('✅ Politiques RLS vérifiées/créées pour le bucket user-assets.')
  } finally {
    await pgClient.end()
  }
}

/**
 * Lance le processus complet : bucket + politiques.
 */
async function main() {
  const supabaseUrl = assertEnv('SUPABASE_URL')
  const serviceRoleKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY')
  const pgConnectionString = assertEnv('SUPABASE_DB_URL')

  await ensureBucket(supabaseUrl, serviceRoleKey)
  await ensurePolicies(pgConnectionString)

  console.log('✅ Configuration du bucket user-assets terminée !')
}

main().catch((error) => {
  console.error('❌ Échec de la configuration du bucket user-assets:', error)
  process.exit(1)
})
