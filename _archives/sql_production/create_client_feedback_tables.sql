-- ==========================================
-- TABLES POUR FONCTIONNALITÉS PAGE CLIENT
-- ==========================================

-- Table pour les états des lieux signalés par les clients
CREATE TABLE IF NOT EXISTS etat_lieux (
    id SERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    photos TEXT[], -- URLs des photos
    date_signalement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    traite BOOLEAN DEFAULT FALSE,
    note_admin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_etat_lieux_reservation ON etat_lieux(reservation_id);
CREATE INDEX IF NOT EXISTS idx_etat_lieux_traite ON etat_lieux(traite);

-- Table pour les évaluations des séjours
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    note_proprete INTEGER NOT NULL CHECK (note_proprete >= 1 AND note_proprete <= 5),
    note_confort INTEGER NOT NULL CHECK (note_confort >= 1 AND note_confort <= 5),
    note_equipements INTEGER NOT NULL CHECK (note_equipements >= 1 AND note_equipements <= 5),
    note_communication INTEGER NOT NULL CHECK (note_communication >= 1 AND note_communication <= 5),
    commentaire TEXT,
    recommandation TEXT NOT NULL CHECK (recommandation IN ('oui_sans_hesiter', 'oui_probablement', 'peut_etre', 'non')),
    date_evaluation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    publie_publiquement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_reservation ON evaluations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_publie ON evaluations(publie_publiquement);

-- Table pour les retours clients (déjà créée dans le cahier des charges mais on s'assure)
CREATE TABLE IF NOT EXISTS retours_clients (
    id SERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('demande', 'retour', 'amelioration', 'probleme')),
    sujet TEXT NOT NULL,
    description TEXT NOT NULL,
    urgence TEXT DEFAULT 'normale' CHECK (urgence IN ('basse', 'normale', 'haute')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'traite', 'resolu')),
    reponse_admin TEXT,
    date_reponse TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retours_reservation ON retours_clients(reservation_id);
CREATE INDEX IF NOT EXISTS idx_retours_status ON retours_clients(status);
CREATE INDEX IF NOT EXISTS idx_retours_urgence ON retours_clients(urgence);

-- Permissions RLS
ALTER TABLE etat_lieux ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours_clients ENABLE ROW LEVEL SECURITY;

-- Politiques publiques (accès via token validé côté app)
CREATE POLICY "Allow public insert on etat_lieux"
    ON etat_lieux FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public read own etat_lieux"
    ON etat_lieux FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on evaluations"
    ON evaluations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public read own evaluations"
    ON evaluations FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on retours_clients"
    ON retours_clients FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public read own retours_clients"
    ON retours_clients FOR SELECT
    USING (true);

-- Bucket storage pour les photos d'état des lieux
-- À exécuter dans le Storage du dashboard Supabase :
-- Créer un bucket "etat-lieux" avec accès public

-- ==========================================
-- FIN DU SCRIPT
-- ==========================================
