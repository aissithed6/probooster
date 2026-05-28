-- Création du bucket public `chat-uploads` (pièces jointes chat: images, documents, audio)
INSERT INTO storage.buckets (id, name, public)
SELECT 'chat-uploads', 'chat-uploads', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'chat-uploads'
);

-- Limitation de la taille (50 Mo) et types MIME autorisés
UPDATE storage.buckets
SET file_size_limit = 50 * 1024 * 1024,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'audio/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ]
WHERE id = 'chat-uploads';

-- Politique : lecture publique (bucket public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'chat_uploads_public_read'
  ) THEN
    CREATE POLICY chat_uploads_public_read
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'chat-uploads');
  END IF;
END $$;

-- Politique : upload (INSERT) pour utilisateurs authentifiés
-- Note: pour un MVP robuste, on autorise l'upload dans ce bucket pour tout utilisateur authentifié.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'chat_uploads_authenticated_insert'
  ) THEN
    CREATE POLICY chat_uploads_authenticated_insert
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'chat-uploads');
  END IF;
END $$;

-- Politique : update limité au propriétaire (owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'chat_uploads_owner_update'
  ) THEN
    CREATE POLICY chat_uploads_owner_update
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'chat-uploads' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'chat-uploads' AND owner = auth.uid());
  END IF;
END $$;

-- Politique : suppression limitée au propriétaire (owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'chat_uploads_owner_delete'
  ) THEN
    CREATE POLICY chat_uploads_owner_delete
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'chat-uploads' AND owner = auth.uid());
  END IF;
END $$;
