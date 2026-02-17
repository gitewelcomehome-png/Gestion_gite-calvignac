-- ================================================================
-- TABLE VERSIONING PROMPT CLAUDE
-- ================================================================
-- Permet de tracker l'évolution du prompt et performances associées
-- ================================================================

CREATE TABLE IF NOT EXISTS cm_ai_prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL UNIQUE,
    prompt_system TEXT NOT NULL, -- Prompt système complet
    prompt_user_template TEXT NOT NULL, -- Template dynamique
    principes_ethiques JSONB, -- Règles éthiques version
    mots_blacklist TEXT[], -- Mots/expressions interdites
    performances JSONB, -- Stats après utilisation
    notes TEXT, -- Pourquoi ce changement
    valide_par VARCHAR(255), -- Email validateur
    statut VARCHAR(50) DEFAULT 'test', -- test, actif, archive
    date_activation TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_prompt_version ON cm_ai_prompt_versions(version);
CREATE INDEX idx_prompt_statut ON cm_ai_prompt_versions(statut);

-- RLS
ALTER TABLE cm_ai_prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access prompt versions" ON cm_ai_prompt_versions
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- Commentaire
COMMENT ON TABLE cm_ai_prompt_versions IS 'Historique et versioning des prompts Claude avec performances associées';

-- ================================================================
-- TABLE FEEDBACK CONTENU
-- ================================================================
-- Stocke tes retours sur chaque contenu généré pour apprentissage
-- ================================================================

CREATE TABLE IF NOT EXISTS cm_ai_content_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID, -- ID du contenu (queue ou history)
    type_feedback VARCHAR(50) NOT NULL, -- approuve, rejete, modifie, signale_mensonge
    raison TEXT, -- Pourquoi ce feedback
    modifications_demandees TEXT, -- Ce qu'il faut changer
    respect_principes BOOLEAN DEFAULT true, -- Respecte éthique ?
    mots_problematiques TEXT[], -- Mots à blacklister
    score_qualite INT CHECK (score_qualite BETWEEN 1 AND 5),
    prompt_version VARCHAR(20), -- Version prompt utilisée
    created_by VARCHAR(255) DEFAULT 'stephanecalvignac@hotmail.fr',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_feedback_type ON cm_ai_content_feedback(type_feedback);
CREATE INDEX idx_feedback_respect ON cm_ai_content_feedback(respect_principes);
CREATE INDEX idx_feedback_prompt ON cm_ai_content_feedback(prompt_version);

-- RLS
ALTER TABLE cm_ai_content_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access feedback" ON cm_ai_content_feedback
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- Commentaire
COMMENT ON TABLE cm_ai_content_feedback IS 'Feedback utilisateur sur contenus générés pour améliorer Claude';

-- ================================================================
-- TABLE RÈGLES ÉTHIQUES
-- ================================================================
-- Configuration des interdictions et obligations
-- ================================================================

CREATE TABLE IF NOT EXISTS cm_ai_ethique_regles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie VARCHAR(50) NOT NULL, -- interdiction, obligation, recommandation
    regle TEXT NOT NULL,
    exemples_bons TEXT[],
    exemples_mauvais TEXT[],
    severite VARCHAR(20) DEFAULT 'haute', -- haute, moyenne, basse
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ethique_categorie ON cm_ai_ethique_regles(categorie);
CREATE INDEX idx_ethique_actif ON cm_ai_ethique_regles(actif);

-- RLS
ALTER TABLE cm_ai_ethique_regles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access ethique" ON cm_ai_ethique_regles
    FOR ALL USING (auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr');

-- Insertion règles de base
INSERT INTO cm_ai_ethique_regles (categorie, regle, exemples_mauvais, severite) VALUES
('interdiction', 'AUCUN mensonge sur fonctionnalités produit', ARRAY['Synchronise 50 plateformes (si faux)', 'IA ultra-puissante (si simple automation)'], 'haute'),
('interdiction', 'AUCUNE fausse promesse de résultats', ARRAY['Garantie 10x votre CA', 'Devenez riche en 30 jours'], 'haute'),
('interdiction', 'AUCUN chiffre inventé sans source', ARRAY['95% de nos clients satisfaits (si pas de sondage)', '10k utilisateurs (si faux)'], 'haute'),
('interdiction', 'AUCUN buzzword bullshit', ARRAY['révolutionnaire', 'disruptif', 'game-changer', 'innovant'], 'moyenne'),
('obligation', 'Authenticité : parler comme un loueur', ARRAY['En tant qu''expert...', 'Notre solution corporate...'], 'haute'),
('obligation', 'Chaque affirmation = preuve ou source', ARRAY['On est les meilleurs (sans preuve)', 'Tout le monde utilise notre outil (inventé)'], 'haute'),
('recommandation', 'Storytelling avec histoire vécue', ARRAY[]::TEXT[], 'moyenne');

-- Commentaire
COMMENT ON TABLE cm_ai_ethique_regles IS 'Règles éthiques configurables pour génération contenu Claude';
