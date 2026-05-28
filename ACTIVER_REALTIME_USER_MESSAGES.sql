-- Activer Realtime pour la table user_messages
ALTER PUBLICATION supabase_realtime ADD TABLE user_messages;

-- Vérifier que Realtime est activé
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'user_messages';
