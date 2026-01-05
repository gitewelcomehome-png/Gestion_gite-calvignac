-- ============================================================================
-- TABLES POUR SIGNALEMENTS DE PROBLÈMES ET ÉVALUATIONS DE SÉJOUR
-- ============================================================================

-- Table des problèmes signalés par les clients
CREATE TABLE IF NOT EXISTS problemes_signales (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER,
    gite TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'equipement',
        'proprete',
        'chauffage',
        'eau',
        'electricite',
        'wifi',
        'nuisance',
        'securite',
        'autre'
    )),
    urgence TEXT NOT NULL CHECK (urgence IN ('faible', 'moyenne', 'haute')),
    description TEXT NOT NULL,
    telephone TEXT,
    statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'resolu', 'cloture')),
    traite_par TEXT,
    traite_le TIMESTAMPTZ,
    commentaire_admin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour retrouver rapidement les problèmes d'une réservation
CREATE INDEX IF NOT EXISTS idx_problemes_reservation ON problemes_signales(reservation_id);

-- Index pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_problemes_statut ON problemes_signales(statut);

-- Index pour filtrer par urgence
CREATE INDEX IF NOT EXISTS idx_problemes_urgence ON problemes_signales(urgence);

-- Index pour filtrer par gîte
CREATE INDEX IF NOT EXISTS idx_problemes_gite ON problemes_signales(gite);

-- ============================================================================

-- Table des évaluations de séjour
CREATE TABLE IF NOT EXISTS evaluations_sejour (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER,
    gite TEXT NOT NULL,
    
    -- Notes (1-5 étoiles)
    note_globale INTEGER NOT NULL CHECK (note_globale BETWEEN 1 AND 5),
    note_proprete INTEGER NOT NULL CHECK (note_proprete BETWEEN 1 AND 5),
    note_confort INTEGER NOT NULL CHECK (note_confort BETWEEN 1 AND 5),
    note_emplacement INTEGER NOT NULL CHECK (note_emplacement BETWEEN 1 AND 5),
    note_equipements INTEGER NOT NULL CHECK (note_equipements BETWEEN 1 AND 5),
    note_rapport_qp INTEGER NOT NULL CHECK (note_rapport_qp BETWEEN 1 AND 5),
    
    -- Commentaires
    commentaire TEXT NOT NULL,
    points_positifs TEXT,
    points_ameliorer TEXT,
    
    -- Recommandation
    recommandation TEXT NOT NULL CHECK (recommandation IN ('oui', 'peut-etre', 'non')),
    
    -- Métadonnées
    publie BOOLEAN DEFAULT FALSE,
    modere BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Empêcher plusieurs évaluations pour la même réservation
    UNIQUE(reservation_id)
);

-- Index pour retrouver rapidement les évaluations d'une réservation
CREATE INDEX IF NOT EXISTS idx_evaluations_reservation ON evaluations_sejour(reservation_id);

-- Index pour filtrer par gîte
CREATE INDEX IF NOT EXISTS idx_evaluations_gite ON evaluations_sejour(gite);

-- Index pour filtrer les évaluations publiables
CREATE INDEX IF NOT EXISTS idx_evaluations_publies ON evaluations_sejour(publie);

-- Index pour statistiques par note globale
CREATE INDEX IF NOT EXISTS idx_evaluations_note_globale ON evaluations_sejour(note_globale);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE problemes_signales IS 'Signalements de problèmes effectués par les clients pendant leur séjour';
COMMENT ON COLUMN problemes_signales.urgence IS 'Niveau d''urgence: faible, moyenne, haute';
COMMENT ON COLUMN problemes_signales.statut IS 'État de traitement: nouveau, en_cours, resolu, cloture';
COMMENT ON COLUMN problemes_signales.type IS 'Catégorie du problème';

COMMENT ON TABLE evaluations_sejour IS 'Évaluations des séjours par les clients';
COMMENT ON COLUMN evaluations_sejour.publie IS 'Afficher publiquement cette évaluation';
COMMENT ON COLUMN evaluations_sejour.modere IS 'Évaluation vérifiée par un modérateur';

-- ============================================================================
-- TRIGGER POUR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
DROP TRIGGER IF EXISTS update_problemes_updated_at ON problemes_signales;
CREATE TRIGGER update_problemes_updated_at
    BEFORE UPDATE ON problemes_signales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations_sejour;
CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations_sejour
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
