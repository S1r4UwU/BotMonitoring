-- Script pour créer le schéma SocialGuard sur Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase

-- Créer les tables principales
CREATE TABLE IF NOT EXISTS cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  platforms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'reddit', 'youtube', 'hackernews', 'newsapi', 'mastodon', 'telegram', 'discord')),
  external_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT,
  author_handle TEXT,
  author_id TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  sentiment_score INTEGER,
  urgency_score INTEGER DEFAULT 5,
  keywords_matched TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processed', 'responded', 'ignored')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_mentions_case_id ON mentions(case_id);
CREATE INDEX IF NOT EXISTS idx_mentions_platform ON mentions(platform);
CREATE INDEX IF NOT EXISTS idx_mentions_status ON mentions(status);
CREATE INDEX IF NOT EXISTS idx_mentions_created_at ON mentions(created_at);

-- RLS (Row Level Security) - permettre tout pour l'instant
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- Policies temporaires (à ajuster selon vos besoins)
DROP POLICY IF EXISTS "Allow all operations cases" ON cases;
DROP POLICY IF EXISTS "Allow all operations mentions" ON mentions;

CREATE POLICY "Allow all operations cases" ON cases FOR ALL USING (true);
CREATE POLICY "Allow all operations mentions" ON mentions FOR ALL USING (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at sur cases
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at 
    BEFORE UPDATE ON cases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer un cas par défaut pour tester
INSERT INTO cases (name, description, keywords, platforms, status) 
VALUES (
  'Surveillance SocialGuard',
  'Monitoring par défaut des mentions SocialGuard',
  '["socialguard", "monitoring", "test"]',
  '["reddit"]',
  'active'
) ON CONFLICT DO NOTHING;

-- Vérification finale
SELECT 'Schéma créé avec succès !' as message,
       'Cas: ' || count(*) as cases_count
FROM cases;

SELECT 'Mentions: ' || count(*) as mentions_count 
FROM mentions;

-- Réponses générées (anti-harcèlement)
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mention_id UUID REFERENCES mentions(id) ON DELETE CASCADE,
  generated_text TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  response_type TEXT DEFAULT 'professional',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all operations responses" ON responses FOR ALL USING (true);

-- Corriger et élargir la contrainte platform si existante déjà
ALTER TABLE mentions DROP CONSTRAINT IF EXISTS mentions_platform_check;
ALTER TABLE mentions ADD CONSTRAINT mentions_platform_check
CHECK (platform IN ('facebook', 'instagram', 'reddit', 'youtube', 'hackernews', 'newsapi', 'mastodon', 'telegram', 'discord'));

-- Table alerts pour gestion des alertes intelligentes
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  mention_id UUID REFERENCES mentions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sentiment_drop', 'volume_spike', 'keyword_match', 'urgent')),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved', 'dismissed')),
  notified_users JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_case_id ON alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations alerts" ON alerts FOR ALL USING (true);
