-- MIGRATION : 20260827010000_enable_realtime_finance_payment_requests.sql
--
-- Rôle : temps réel des demandes de paiement vendeur.
-- Le client vendeur (seller-dashboard) s'abonne aux postgres_changes sur
-- finance_payment_requests : dès que le Super Admin approuve/rejette une
-- demande, le dashboard vendeur se rafraîchit instantanément (sans refresh).
--
-- Idempotent : peut être ré-exécuté sans risque.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'finance_payment_requests'
  ) then
    alter publication supabase_realtime add table public.finance_payment_requests;
  end if;
end $$;

-- Rappel : le Realtime n'envoie un événement qu'au client autorisé par une
-- politique SELECT (RLS) — déjà en place via 20260325_finance_payment_requests.sql
-- (« Vendor can read own payment requests »). Chaque vendeur ne reçoit donc que
-- les événements de SES demandes ; le Super Admin (bypass RLS / policy admin)
-- reçoit les siennes selon sa politique.
