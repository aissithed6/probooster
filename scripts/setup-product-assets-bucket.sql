-- Création du bucket public `product-assets`
INSERT INTO storage.buckets (id, name, public)
SELECT 'product-assets', 'product-assets', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'product-assets'
);

-- Limitation de la taille (5 Mo) et types MIME autorisés
UPDATE storage.buckets
SET file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'product-assets';

-- Politique : lecture publique du bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_assets_public_read'
  ) THEN
    CREATE POLICY product_assets_public_read
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'product-assets');
  END IF;
END $$;

-- Politique : vendeur (propriétaire) gère son propre dossier (premier segment = user/vendor id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_assets_owner_crud'
  ) THEN
    CREATE POLICY product_assets_owner_crud
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'product-assets'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'product-assets'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Supprimer l'ancienne policy basée sur le claim JWT si elle existe encore
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_assets_admin_manage'
  ) THEN
    DROP POLICY product_assets_admin_manage ON storage.objects;
  END IF;
END $$;

-- Nouvelle policy : vérifie l'appartenance à un rôle admin/super_admin via les assignations de rôles en base
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'product_assets_admin_manage_v2'
  ) THEN
    CREATE POLICY product_assets_admin_manage_v2
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'product-assets'
      AND EXISTS (
        SELECT 1
        FROM public.user_role_assignments ura
        JOIN public.roles r ON r.id = ura.role_id
        WHERE ura.user_id = auth.uid()
          AND r.slug IN ('admin', 'super_admin')
      )
    )
    WITH CHECK (
      bucket_id = 'product-assets'
      AND EXISTS (
        SELECT 1
        FROM public.user_role_assignments ura
        JOIN public.roles r ON r.id = ura.role_id
        WHERE ura.user_id = auth.uid()
          AND r.slug IN ('admin', 'super_admin')
      )
    );
  END IF;
END $$;
