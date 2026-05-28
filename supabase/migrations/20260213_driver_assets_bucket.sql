-- Bucket dédié aux assets livreurs

-- Crée le bucket si absent (public pour permettre getPublicUrl)
insert into storage.buckets (id, name, public)
values ('driver-assets', 'driver-assets', true)
on conflict (id) do update set public = excluded.public;

-- Politique lecture publique sur les objets du bucket
-- Note: sur Supabase, les policies s'appliquent à storage.objects.
-- Pour un bucket public, la lecture est déjà accessible via URL publique.

-- Politique écriture: seul l'utilisateur authentifié peut écrire dans son dossier drivers/<uid>/...
-- (utile si un jour tu fais un upload direct client; actuellement l'upload passe côté serveur via service role)

drop policy if exists "driver_assets_insert_own" on storage.objects;
create policy "driver_assets_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'driver-assets'
    and (name like (auth.uid()::text || '/%') or name like ('drivers/' || auth.uid()::text || '/%'))
  );

drop policy if exists "driver_assets_update_own" on storage.objects;
create policy "driver_assets_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'driver-assets'
    and (name like (auth.uid()::text || '/%') or name like ('drivers/' || auth.uid()::text || '/%'))
  )
  with check (
    bucket_id = 'driver-assets'
    and (name like (auth.uid()::text || '/%') or name like ('drivers/' || auth.uid()::text || '/%'))
  );

drop policy if exists "driver_assets_delete_own" on storage.objects;
create policy "driver_assets_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'driver-assets'
    and (name like (auth.uid()::text || '/%') or name like ('drivers/' || auth.uid()::text || '/%'))
  );
