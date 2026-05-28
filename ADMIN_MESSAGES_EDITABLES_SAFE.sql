-- ============================================
-- Script SQL SÉCURISÉ pour Messages Éditables
-- Gère tous les cas (création, mise à jour, etc.)
-- ============================================

-- 1. Supprimer la table si elle existe (ATTENTION: supprime les données)
-- Décommenter la ligne suivante si vous voulez repartir de zéro
-- DROP TABLE IF EXISTS editable_messages CASCADE;

-- 2. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS editable_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_key VARCHAR(100) UNIQUE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  display_locations TEXT[] DEFAULT '{}',
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ajouter la colonne display_locations si elle n'existe pas (pour mise à jour)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'editable_messages' 
    AND column_name = 'display_locations'
  ) THEN
    ALTER TABLE editable_messages ADD COLUMN display_locations TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_editable_messages_key ON editable_messages(message_key);
CREATE INDEX IF NOT EXISTS idx_editable_messages_active ON editable_messages(is_active);

-- 5. RLS
ALTER TABLE editable_messages ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can view active messages" ON editable_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON editable_messages;

-- 7. Créer les nouvelles politiques
CREATE POLICY "Anyone can view active messages" ON editable_messages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert messages" ON editable_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update messages" ON editable_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete messages" ON editable_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- 8. Insérer le message par défaut (si pas déjà présent)
INSERT INTO editable_messages (message_key, title, content, message_type, display_locations) VALUES
('share_tips', 'Gagnez Plus de Points!', 
'📱 Facebook & Instagram: 10 points par partage
🔗 Linkedin: 12 points par partage  
🐦 Twitter: 8 points par partage
💬 WhatsApp: 5 points par partage
🎁 Bonus: +20 points si quelqu''un achète via votre lien!', 
'info',
ARRAY['dashboard_client'])
ON CONFLICT (message_key) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  message_type = EXCLUDED.message_type,
  display_locations = EXCLUDED.display_locations,
  updated_at = NOW();

-- 9. Activer Realtime
DO $$
BEGIN
  -- Vérifier si la table est déjà dans la publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'editable_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE editable_messages;
  END IF;
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- VÉRIFICATION:
-- SELECT * FROM editable_messages;
