-- Schema de base de données pour Bot Monitoring Réseaux Sociaux
-- Conçu pour Supabase Free Tier avec optimisation des coûts

-- Extension UUID pour les clés primaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (intégrée avec Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des cas de monitoring
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    keywords JSONB NOT NULL DEFAULT '[]', -- Mots-clés à surveiller
    platforms JSONB NOT NULL DEFAULT '[]', -- Plateformes surveillées
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des permissions par cas
CREATE TABLE IF NOT EXISTS public.case_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_level TEXT DEFAULT 'viewer' CHECK (permission_level IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(case_id, user_id)
);

-- Table des mentions trouvées
CREATE TABLE IF NOT EXISTS public.mentions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'reddit')),
    external_id TEXT NOT NULL, -- ID de la mention sur la plateforme
    content TEXT NOT NULL,
    author_name TEXT,
    author_handle TEXT,
    author_id TEXT,
    url TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    sentiment_score INTEGER, -- -5 à +5
    urgency_score INTEGER DEFAULT 5, -- 1 à 10
    keywords_matched JSONB DEFAULT '[]',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processed', 'responded', 'ignored')),
    metadata JSONB DEFAULT '{}', -- Données supplémentaires de la plateforme
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des réponses générées/envoyées
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mention_id UUID REFERENCES public.mentions(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    response_type TEXT DEFAULT 'manual' CHECK (response_type IN ('auto', 'semi_auto', 'manual')),
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    platform_response_id TEXT, -- ID de réponse sur la plateforme
    generated_by_ai BOOLEAN DEFAULT FALSE,
    reviewed_by_user UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des templates de réponse
CREATE TABLE IF NOT EXISTS public.response_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT, -- 'positive', 'negative', 'neutral', 'crisis'
    variables JSONB DEFAULT '[]', -- Variables à remplacer dans le template
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    mention_id UUID REFERENCES public.mentions(id),
    type TEXT NOT NULL CHECK (type IN ('sentiment_drop', 'volume_spike', 'crisis', 'keyword_match')),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved', 'false_positive')),
    notified_users JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Table des configurations des intégrations
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    config JSONB NOT NULL, -- Configuration spécifique à la plateforme
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMPTZ,
    rate_limit_reset TIMESTAMPTZ,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(case_id, platform)
);

-- Table des métriques et analytics
CREATE TABLE IF NOT EXISTS public.metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    platform TEXT NOT NULL,
    mention_count INTEGER DEFAULT 0,
    positive_mentions INTEGER DEFAULT 0,
    negative_mentions INTEGER DEFAULT 0,
    neutral_mentions INTEGER DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    avg_sentiment DECIMAL(3,2),
    top_keywords JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(case_id, date, platform)
);

-- Indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_mentions_case_id ON public.mentions(case_id);
CREATE INDEX IF NOT EXISTS idx_mentions_platform ON public.mentions(platform);
CREATE INDEX IF NOT EXISTS idx_mentions_published_at ON public.mentions(published_at);
CREATE INDEX IF NOT EXISTS idx_mentions_status ON public.mentions(status);
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment_score ON public.mentions(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_mentions_case_published ON public.mentions(case_id, published_at);

CREATE INDEX IF NOT EXISTS idx_cases_owner_id ON public.cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);

CREATE INDEX IF NOT EXISTS idx_responses_mention_id ON public.responses(mention_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON public.responses(status);

CREATE INDEX IF NOT EXISTS idx_alerts_case_id ON public.alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);

CREATE INDEX IF NOT EXISTS idx_metrics_case_date ON public.metrics(case_id, date);
CREATE INDEX IF NOT EXISTS idx_metrics_platform_date ON public.metrics(platform, date);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les profils
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politiques RLS pour les cas
CREATE POLICY "Users can view cases they own or have access to" ON public.cases
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.case_permissions 
            WHERE case_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create cases" ON public.cases
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Case owners can update their cases" ON public.cases
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Case owners can delete their cases" ON public.cases
    FOR DELETE USING (owner_id = auth.uid());

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.responses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.response_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
