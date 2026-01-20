-- ================================================================
-- TABLES SUPPLÉMENTAIRES MANQUANTES
-- ================================================================
-- Ces tables sont utilisées dans le code mais absentes du schéma principal
-- À ajouter après SCHEMA_COMPLET_FINAL_2026.sql

-- ================================================================
-- TABLE: infos_gites (Informations pratiques par gîte)
-- ================================================================

CREATE TABLE IF NOT EXISTS infos_gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite TEXT NOT NULL,
    wifi_name TEXT,
    wifi_password TEXT,
    wifi_qr_code TEXT,
    code_entree TEXT,
    adresse TEXT,
    telephone TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    presentation TEXT,
    regles_maison TEXT,
    equipements JSONB DEFAULT '[]',
    numeros_urgence JSONB DEFAULT '{}',
    informations_diverses TEXT,
    premiere_visite TEXT,
    parking TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infos_gites_owner ON infos_gites(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_infos_gites_gite ON infos_gites(gite);

-- ================================================================
-- TABLE: client_access_tokens (Tokens d'accès fiches clients)
-- ================================================================

CREATE TABLE IF NOT EXISTS client_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accessed_at TIMESTAMPTZ,
    access_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tokens_owner ON client_access_tokens(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_reservation ON client_access_tokens(reservation_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON client_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_expires ON client_access_tokens(expires_at);

-- ================================================================
-- TABLE: fiche_generation_logs (Logs génération fiches)
-- ================================================================

CREATE TABLE IF NOT EXISTS fiche_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    token_id UUID REFERENCES client_access_tokens(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiche_logs_owner ON fiche_generation_logs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_fiche_logs_reservation ON fiche_generation_logs(reservation_id);
CREATE INDEX IF NOT EXISTS idx_fiche_logs_created ON fiche_generation_logs(created_at);

-- ================================================================
-- TABLE: retours_clients (Retours/feedbacks clients)
-- ================================================================

CREATE TABLE IF NOT EXISTS retours_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    note_generale INT CHECK (note_generale BETWEEN 1 AND 5),
    note_proprete INT CHECK (note_proprete BETWEEN 1 AND 5),
    note_confort INT CHECK (note_confort BETWEEN 1 AND 5),
    note_emplacement INT CHECK (note_emplacement BETWEEN 1 AND 5),
    commentaire TEXT,
    points_positifs TEXT,
    points_ameliorer TEXT,
    recommande BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retours_owner ON retours_clients(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_retours_reservation ON retours_clients(reservation_id);
CREATE INDEX IF NOT EXISTS idx_retours_note ON retours_clients(note_generale);

-- ================================================================
-- TABLE: activites_gites (Activités à découvrir)
-- ================================================================

CREATE TABLE IF NOT EXISTS activites_gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite TEXT,
    nom TEXT NOT NULL,
    categorie TEXT CHECK (categorie IN ('restaurant', 'visite', 'sport', 'culture', 'nature', 'shopping', 'sante', 'autre')),
    description TEXT,
    adresse TEXT,
    telephone TEXT,
    email TEXT,
    site_web TEXT,
    horaires TEXT,
    prix TEXT,
    distance_km DECIMAL(5, 2),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    note DECIMAL(2, 1) CHECK (note BETWEEN 0 AND 5),
    photos JSONB DEFAULT '[]',
    recommande BOOLEAN DEFAULT false,
    ordre INT DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activites_owner ON activites_gites(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_activites_gite ON activites_gites(gite);
CREATE INDEX IF NOT EXISTS idx_activites_categorie ON activites_gites(categorie);
CREATE INDEX IF NOT EXISTS idx_activites_visible ON activites_gites(visible);

-- ================================================================
-- TABLE: activites_consultations (Tracking consultations activités)
-- ================================================================

CREATE TABLE IF NOT EXISTS activites_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activite_id UUID REFERENCES activites_gites(id) ON DELETE CASCADE,
    consultation_date TIMESTAMPTZ DEFAULT NOW(),
    token TEXT
);

CREATE INDEX IF NOT EXISTS idx_consultations_activite ON activites_consultations(activite_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON activites_consultations(consultation_date);

-- ================================================================
-- TABLE: checklist_templates (Modèles de checklists)
-- ================================================================

CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite TEXT,
    nom TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('arrivee', 'depart', 'menage', 'maintenance', 'custom')),
    items JSONB NOT NULL DEFAULT '[]',
    ordre INT DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_owner ON checklist_templates(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_gite ON checklist_templates(gite);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_type ON checklist_templates(type);

-- ================================================================
-- TABLE: checklist_progress (Progression checklists)
-- ================================================================

CREATE TABLE IF NOT EXISTS checklist_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES checklist_templates(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    completed_items JSONB DEFAULT '[]',
    completed_count INT DEFAULT 0,
    total_count INT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_progress_owner ON checklist_progress(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_template ON checklist_progress(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_reservation ON checklist_progress(reservation_id);

-- ================================================================
-- TABLE: checklists (Checklists legacy - alias de checklist_templates)
-- ================================================================

CREATE TABLE IF NOT EXISTS checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite TEXT,
    nom TEXT NOT NULL,
    description TEXT,
    type TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    ordre INT DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_owner ON checklists(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklists_gite ON checklists(gite);

-- ================================================================
-- TABLE: historical_data (Données historiques charges)
-- ================================================================

CREATE TABLE IF NOT EXISTS historical_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    gite TEXT NOT NULL,
    months JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, year, gite)
);

CREATE INDEX IF NOT EXISTS idx_historical_owner ON historical_data(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_historical_year ON historical_data(year);
CREATE INDEX IF NOT EXISTS idx_historical_gite ON historical_data(gite);

-- ================================================================
-- TABLE: linen_stocks (Stocks de linge - alias de stocks_draps)
-- ================================================================

CREATE TABLE IF NOT EXISTS linen_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite TEXT NOT NULL,
    type_linge TEXT NOT NULL CHECK (type_linge IN ('drap_simple', 'drap_double', 'housse_couette', 'taie', 'serviette', 'torchon')),
    quantite INT NOT NULL DEFAULT 0,
    quantite_min INT DEFAULT 0,
    etat TEXT DEFAULT 'bon' CHECK (etat IN ('neuf', 'bon', 'usage', 'a_remplacer')),
    derniere_maj TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linen_stocks_owner ON linen_stocks(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_linen_stocks_gite ON linen_stocks(gite);
CREATE INDEX IF NOT EXISTS idx_linen_stocks_type ON linen_stocks(type_linge);

-- ================================================================
-- TABLE: evaluations_sejour (Évaluations de séjour)
-- ================================================================

CREATE TABLE IF NOT EXISTS evaluations_sejour (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    note_globale INT CHECK (note_globale BETWEEN 1 AND 5),
    note_proprete INT CHECK (note_proprete BETWEEN 1 AND 5),
    note_confort INT CHECK (note_confort BETWEEN 1 AND 5),
    note_communication INT CHECK (note_communication BETWEEN 1 AND 5),
    note_emplacement INT CHECK (note_emplacement BETWEEN 1 AND 5),
    commentaire TEXT,
    points_forts TEXT,
    points_faibles TEXT,
    recommande BOOLEAN,
    publiable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_owner ON evaluations_sejour(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_reservation ON evaluations_sejour(reservation_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_note ON evaluations_sejour(note_globale);

-- ================================================================
-- ACTIVATION ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE infos_gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiche_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites_gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE linen_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations_sejour ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLITIQUES RLS
-- ================================================================

-- infos_gites
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_infos_gites ON infos_gites;
    CREATE POLICY rgpd_all_own_infos_gites ON infos_gites 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- client_access_tokens
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_tokens ON client_access_tokens;
    CREATE POLICY rgpd_all_own_tokens ON client_access_tokens 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- fiche_generation_logs
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_logs ON fiche_generation_logs;
    CREATE POLICY rgpd_all_own_logs ON fiche_generation_logs 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- retours_clients
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_retours_clients ON retours_clients;
    CREATE POLICY rgpd_all_own_retours_clients ON retours_clients 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- activites_gites
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_activites ON activites_gites;
    CREATE POLICY rgpd_all_own_activites ON activites_gites 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- activites_consultations (pas de owner_user_id, accès via activite_id)
DO $$ BEGIN
    DROP POLICY IF EXISTS allow_all_consultations ON activites_consultations;
    CREATE POLICY allow_all_consultations ON activites_consultations 
    FOR ALL USING (true);
END $$;

-- checklist_templates
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_checklist_templates ON checklist_templates;
    CREATE POLICY rgpd_all_own_checklist_templates ON checklist_templates 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- checklist_progress
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_checklist_progress ON checklist_progress;
    CREATE POLICY rgpd_all_own_checklist_progress ON checklist_progress 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- checklists
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_checklists ON checklists;
    CREATE POLICY rgpd_all_own_checklists ON checklists 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- historical_data
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_historical ON historical_data;
    CREATE POLICY rgpd_all_own_historical ON historical_data 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- linen_stocks
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_linen ON linen_stocks;
    CREATE POLICY rgpd_all_own_linen ON linen_stocks 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- evaluations_sejour
DO $$ BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_evaluations ON evaluations_sejour;
    CREATE POLICY rgpd_all_own_evaluations ON evaluations_sejour 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- ================================================================
-- VÉRIFICATION
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TABLES SUPPLÉMENTAIRES CRÉÉES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Tables ajoutées:';
    RAISE NOTICE '   - infos_gites';
    RAISE NOTICE '   - client_access_tokens';
    RAISE NOTICE '   - fiche_generation_logs';
    RAISE NOTICE '   - retours_clients';
    RAISE NOTICE '   - activites_gites';
    RAISE NOTICE '   - activites_consultations';
    RAISE NOTICE '   - checklist_templates';
    RAISE NOTICE '   - checklist_progress';
    RAISE NOTICE '   - checklists';
    RAISE NOTICE '   - historical_data';
    RAISE NOTICE '   - linen_stocks';
    RAISE NOTICE '   - evaluations_sejour';
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS activé sur toutes les tables';
    RAISE NOTICE '========================================';
END $$;
