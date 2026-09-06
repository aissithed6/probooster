-- ============================================================
-- Realtime WhatsApp Pulse — accès public (anon / authenticated)
-- ============================================================
-- La page /new-arrivals (Calendrier des Événements) est publique : le
-- navigateur utilise la clé anon de Supabase. Le driver Realtime
-- (postgres_changes) n'envoie des événements à un client que s'il
-- possède une politique SELECT sur la table concernée.
--
-- Sans cette politique, aucun abonnement Realtime anonyme ne peut être
-- établi et le modal Calendrier des Événements ne se synchronise pas
-- en temps réel lorsqu'un visiteur s'inscrit via le modal
-- "Configurer les Alertes WhatsApp".
--
-- Restriction: seulement les abonnés avec status = 'active'.
--   - Ce sont les seuls comptabilisés dans people_registered (API site-events).
--   - Le payload du Realtime n'est utilisé qu'en déclencheur (refetch via
--     l'API publique site-events qui utilise le service_role côté serveur),
--     il n'est jamais affiché à l'utilisateur.

create policy "whatsapp_subscribers_anonymous_realtime_select"
on public.whatsapp_subscribers
for select
using (
  auth.role() in ('anon', 'authenticated')
  and status = 'active'
);
