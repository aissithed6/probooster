-- Ajout de la colonne attachments à la table user_messages
-- Objectif: stocker les URLs publiques des pièces jointes (upload Supabase Storage) pour les messages internes.
-- Recommandation: utiliser un jsonb (tableau de strings) pour rester flexible.

BEGIN;

ALTER TABLE public.user_messages
ADD COLUMN IF NOT EXISTS attachments jsonb;

UPDATE public.user_messages
SET attachments = '[]'::jsonb
WHERE attachments IS NULL;

ALTER TABLE public.user_messages
ALTER COLUMN attachments SET DEFAULT '[]'::jsonb;

ALTER TABLE public.user_messages
ALTER COLUMN attachments SET NOT NULL;

CREATE INDEX IF NOT EXISTS user_messages_attachments_gin_idx
ON public.user_messages
USING gin (attachments);

COMMIT;
