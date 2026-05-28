-- Ajout de la colonne is_important à la table user_messages
-- Objectif: permettre l'action "Marquer important" via un menu 3 points, synchronisé DB.

BEGIN;

ALTER TABLE public.user_messages
ADD COLUMN IF NOT EXISTS is_important boolean;

UPDATE public.user_messages
SET is_important = false
WHERE is_important IS NULL;

ALTER TABLE public.user_messages
ALTER COLUMN is_important SET DEFAULT false;

ALTER TABLE public.user_messages
ALTER COLUMN is_important SET NOT NULL;

CREATE INDEX IF NOT EXISTS user_messages_is_important_idx
ON public.user_messages (is_important);

COMMIT;
