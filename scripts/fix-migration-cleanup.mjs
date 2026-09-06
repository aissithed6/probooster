import fs from 'fs';

let c = fs.readFileSync('supabase/migrations/20260905_whatsapp_subscribers.sql', 'utf8');

const oldHeader = `-- WhatsApp Pulse: Abonnés newsletter WhatsApp (support international)
-- Objectif: Storer les abonnés avec leurs intérêts, pays détecté, et métadonnées

-- =====================================================
-- 1) Table whatsapp_subscribers
-- =====================================================`;

const newHeader = `-- WhatsApp Pulse: Abonnés newsletter WhatsApp (support international)
-- Objectif: Storer les abonnés avec leurs intérêts, pays détecté, et métadonnées

-- =====================================================
-- Nettoyage (suppression des anciens objets si existent)
-- =====================================================
drop function if exists public.get_whatsapp_subscribers_stats();
drop function if exists public.upsert_whatsapp_subscriber(text,text,text,text,text[],text,jsonb);
drop table if exists public.whatsapp_subscribers cascade;

-- =====================================================
-- 1) Table whatsapp_subscribers
-- =====================================================`;

c = c.replace(oldHeader, newHeader);
fs.writeFileSync('supabase/migrations/20260905_whatsapp_subscribers.sql', c);
console.log('Migration updated with cleanup');