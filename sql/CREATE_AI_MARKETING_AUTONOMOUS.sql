-- ================================================================
-- IA MARKETING AUTONOME - TABLES
-- ================================================================
-- Date: 31 janvier 2026
-- Intégration au module Content IA existant
-- ================================================================

-- ================================================================
-- 1. STRATÉGIES HEBDOMADAIRES
-- ================================================================
CREATE TABLE IF NOT EXISTS cm_ai_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semaine INT NOT NULL, -- Numéro de la semaine (1-52)
    annee INT NOT NULL,
    objectif TEXT NOT NULL, -- Objectif de la semaine
    cibles TEXT[], -- Audience cibles
    themes TEXT[], -- Thèmes à aborder
    kpis JSONB, -- KPIs à atteindre
    strategie_complete TEXT, -- Stratégie détaillée générée par l'IA
    statut VARCHAR(50) DEFAULT 'actif', -- actif, terminé, archivé
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(semaine, annee)
);

-- ================================================================
-- 2. QUEUE DE CONTENU (contenus programmés)
-- ================================================================
CREATE TABLE IF NOT EXISTS cm_ai_content_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES cm_ai_strategies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- post, email, blog, newsletter
    plateforme VARCHAR(50), -- linkedin, twitter, facebook, instagram
    sujet TEXT NOT NULL,
    contenu TEXT NOT NULL,
    image_url TEXT,
    hashtags TEXT[],
    scheduled_date TIMESTAMPTZ NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente', -- en_attente, publié, échoué, annulé
    performance JSONB, -- likes, shares, comments, views après publication
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_queue_scheduled ON cm_ai_content_queue(scheduled_date);
CREATE INDEX idx_queue_statut ON cm_ai_content_queue(statut);

-- ================================================================
-- 3. HISTORIQUE DE CONTENU (mémoire de l'IA)
-- ================================================================
CREATE TABLE IF NOT EXISTS cm_ai_content_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES cm_ai_strategies(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    plateforme VARCHAR(50),
    sujet TEXT NOT NULL,
    contenu TEXT NOT NULL,
    hashtags TEXT[],
    performance JSONB, -- likes, shares, comments, impressions, engagement_rate
    score_viralite DECIMAL(5,2), -- Score 0-100 calculé
    published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_performance ON cm_ai_content_history USING gin(performance);
CREATE INDEX idx_history_viralite ON cm_ai_content_history(score_viralite DESC);

-- ================================================================
-- 4. ACTIONS PROPOSÉES PAR L'IA
-- ================================================================
CREATE TABLE IF NOT EXISTS cm_ai_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES cm_ai_strategies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- promotion, partenariat, campagne, ajustement
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    justification TEXT, -- Pourquoi l'IA propose cette action
    donnees_support JSONB, -- Data/stats qui justifient l'action
    priorite VARCHAR(20) DEFAULT 'moyenne', -- haute, moyenne, basse
    statut VARCHAR(50) DEFAULT 'proposé', -- proposé, accepté, refusé, en_cours, terminé
    resultat TEXT, -- Résultats après exécution
    created_at TIMESTAMPTZ DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_actions_statut ON cm_ai_actions(statut);
CREATE INDEX idx_actions_priorite ON cm_ai_actions(priorite);

-- ================================================================
-- 5. PROMOTIONS GÉNÉRÉES AUTOMATIQUEMENT
-- ================================================================
CREATE TABLE IF NOT EXISTS cm_ai_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES cm_ai_actions(id) ON DELETE SET NULL,
    strategy_id UUID REFERENCES cm_ai_strategies(id) ON DELETE SET NULL,
    nom TEXT NOT NULL,
    code_promo VARCHAR(50) UNIQUE,
    type_reduction VARCHAR(20), -- pourcentage, montant_fixe, essai_gratuit
    valeur_reduction DECIMAL(10,2),
    description TEXT,
    cible_audience TEXT, -- Description de la cible
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    utilisations_max INT,
    utilisations_actuelles INT DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'actif', -- actif, terminé, suspendu
    performance JSONB, -- ROI, conversions, CA généré
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_dates ON cm_ai_promotions(date_debut, date_fin);
CREATE INDEX idx_promotions_code ON cm_ai_promotions(code_promo);

-- ================================================================
-- 6. INSIGHTS & APPRENTISSAGE (pour améliorer l'IA)
-- ================================================================
CREATE TABLE IF NOT EXISTS cm_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie VARCHAR(50) NOT NULL, -- contenu, hashtag, timing, audience
    insight TEXT NOT NULL,
    donnees JSONB, -- Data qui ont permis de tirer cette conclusion
    confiance DECIMAL(5,2), -- Score de confiance 0-100
    actions_recommandees TEXT[],
    applique BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_categorie ON cm_ai_insights(categorie);
CREATE INDEX idx_insights_confiance ON cm_ai_insights(confiance DESC);

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================

-- Stratégies
ALTER TABLE cm_ai_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access strategies" ON cm_ai_strategies
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- Queue
ALTER TABLE cm_ai_content_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access queue" ON cm_ai_content_queue
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- Historique
ALTER TABLE cm_ai_content_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access history" ON cm_ai_content_history
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- Actions
ALTER TABLE cm_ai_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access actions" ON cm_ai_actions
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- Promotions
ALTER TABLE cm_ai_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access promotions" ON cm_ai_promotions
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- Insights
ALTER TABLE cm_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access insights" ON cm_ai_insights
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- ================================================================
-- COMMENTAIRE
-- ================================================================
COMMENT ON TABLE cm_ai_strategies IS 'Stratégies marketing hebdomadaires générées par l''IA';
COMMENT ON TABLE cm_ai_content_queue IS 'Queue de contenus programmés pour publication automatique';
COMMENT ON TABLE cm_ai_content_history IS 'Historique complet des contenus publiés avec performances';
COMMENT ON TABLE cm_ai_actions IS 'Actions proposées par l''IA pour améliorer les performances';
COMMENT ON TABLE cm_ai_promotions IS 'Promotions générées automatiquement par l''IA';
COMMENT ON TABLE cm_ai_insights IS 'Apprentissages et insights extraits des données';
