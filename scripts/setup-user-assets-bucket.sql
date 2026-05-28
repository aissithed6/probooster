-- Création du bucket user-assets s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
SELECT 'user-assets', 'user-assets', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'user-assets'
);

-- Limitation des types et taille via configuration (optionnel)
UPDATE storage.buckets
SET file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'user-assets';

-- Policy: upload par l'utilisateur authentifié vers son propre dossier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_can_upload_user_assets'
  ) THEN
    CREATE POLICY authenticated_can_upload_user_assets
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'user-assets'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Policy: update limité à l'auteur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_can_update_user_assets'
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
END $$;

-- Policy: suppression autorisée pour l'auteur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_can_delete_user_assets'
  ) THEN
    CREATE POLICY authenticated_can_delete_user_assets
    ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'user-assets'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;
