-- Table pour les messages éditables par les admins
CREATE TABLE IF NOT EXISTS editable_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_key VARCHAR(100) UNIQUE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  display_locations TEXT[] DEFAULT '{}', -- Où afficher le message (ex: ['dashboard_client', 'dashboard_vendeur', 'homepage'])
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_editable_messages_key ON editable_messages(message_key);
CREATE INDEX IF NOT EXISTS idx_editable_messages_active ON editable_messages(is_active);

-- RLS
ALTER TABLE editable_messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Anyone can view active messages" ON editable_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON editable_messages;

-- Tout le monde peut lire les messages actifs
CREATE POLICY "Anyone can view active messages" ON editable_messages
  FOR SELECT USING (is_active = true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can manage messages" ON editable_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Insérer le message par défaut pour les conseils de partage
INSERT INTO editable_messages (message_key, title, content, message_type, display_locations) VALUES
('share_tips', 'Gagnez Plus de Points!', 
'📱 Facebook & Instagram: 10 points par partage
🔗 Linkedin: 12 points par partage  
🐦 Twitter: 8 points par partage
💬 WhatsApp: 5 points par partage
🎁 Bonus: +20 points si quelqu''un achète via votre lien!', 
'info',
ARRAY['dashboard_client'])
ON CONFLICT (message_key) DO NOTHING;

-- Activer Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE editable_messages;
