-- ============================================================
-- Realtime WhatsApp Pulse (Super Admin) — mise à jour automatique
-- ============================================================
-- 1) Ajoute whatsapp_subscribers à la publication supabase_realtime pour que
--    les abonnements `postgres_changes` fonctionnent côté client.
-- 2) Ajoute une politique SELECT pour les administrateurs : sans elle, le driver
--    Realtime (qui tourne avec la clé `anon` du navigateur) ne diffuse AUCUN
--    événement à cause de la RLS, et le dashboard ne se mettrait pas à jour.

-- --- 1. Activation Realtime (idempotent) ---
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'whatsapp_subscribers'
  ) then
    alter publication supabase_realtime add table public.whatsapp_subscribers;
  end if;
end $$;

-- --- 2. Policy SELECT admin (admin / super_admin) ---
drop policy if exists "whatsapp_subscribers_admin_select" on public.whatsapp_subscribers;

create policy "whatsapp_subscribers_admin_select"
on public.whatsapp_subscribers
for select
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('admin', 'super_admin')
  )
);