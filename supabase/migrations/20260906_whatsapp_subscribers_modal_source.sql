-- Ajoute la source 'modal' (Configurer les Alertes WhatsApp depuis new-arrivals)
-- à la contrainte de vérification de whatsapp_subscribers.subscription_source.
--
-- Sans ce correctif, l'insert de synchronisation depuis
-- /api/public/client-alert-subscriptions (subscription_source = 'modal')
-- échoue silencieusement, et le numéro n'apparaît pas côté Super Admin.

alter table public.whatsapp_subscribers
  drop constraint if exists whatsapp_subscribers_subscription_source_check;

alter table public.whatsapp_subscribers
  add constraint whatsapp_subscribers_subscription_source_check
  check (subscription_source in ('footer', 'landing', 'popup', 'campaign', 'referral', 'modal'));