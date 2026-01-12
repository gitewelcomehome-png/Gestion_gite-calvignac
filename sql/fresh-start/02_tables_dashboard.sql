-- ================================================================
-- TOUTES LES TABLES MANQUANTES POUR LE DASHBOARD
-- ================================================================
-- À exécuter dans SQL Editor Supabase
-- ================================================================

-- 1. TODOS
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('reservations', 'travaux', 'achats', 'autre')),
    completed BOOLEAN DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_todos_org ON todos(organization_id);
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_all_todos" ON todos FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- 2. CLEANING SCHEDULE (Planning ménages)
CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    gite TEXT,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'pending_validation', 'refused')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cleaning_org ON cleaning_schedule(organization_id);
CREATE INDEX idx_cleaning_date ON cleaning_schedule(scheduled_date);
ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_all_cleaning" ON cleaning_schedule FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- 3. RETOURS MÉNAGE
CREATE TABLE IF NOT EXISTS retours_menage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    gite TEXT,
    date DATE NOT NULL,
    commentaire TEXT,
    validated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_retours_org ON retours_menage(organization_id);
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_all_retours" ON retours_menage FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- 4. DEMANDES HORAIRES CLIENTS
CREATE TABLE IF NOT EXISTS demandes_horaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('arrivee_anticipee', 'depart_tardif')),
    heure_demandee TIME,
    motif TEXT,
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demandes_org ON demandes_horaires(organization_id);
CREATE INDEX idx_demandes_resa ON demandes_horaires(reservation_id);
ALTER TABLE demandes_horaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_all_demandes" ON demandes_horaires FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- 5. PROBLÈMES SIGNALÉS PAR CLIENTS
CREATE TABLE IF NOT EXISTS problemes_signales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    gite TEXT,
    description TEXT NOT NULL,
    categorie TEXT,
    priorite TEXT CHECK (priorite IN ('low', 'medium', 'high')),
    resolu BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_problemes_org ON problemes_signales(organization_id);
ALTER TABLE problemes_signales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_all_problemes" ON problemes_signales FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- 6. SIMULATIONS FISCALES
CREATE TABLE IF NOT EXISTS simulations_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    revenus_totaux NUMERIC(10,2),
    charges_totales NUMERIC(10,2),
    resultat NUMERIC(10,2),
    impots_estimes NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_simul_org ON simulations_fiscales(organization_id);
CREATE INDEX idx_simul_annee ON simulations_fiscales(annee);
ALTER TABLE simulations_fiscales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_all_simulations" ON simulations_fiscales FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- 7. SUIVI SOLDES BANCAIRES
CREATE TABLE IF NOT EXISTS suivi_soldes_bancaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    mois INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
    solde NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, annee, mois)
);

CREATE INDEX idx_soldes_org ON suivi_soldes_bancaires(organization_id);
CREATE INDEX idx_soldes_date ON suivi_soldes_bancaires(annee, mois);
ALTER TABLE suivi_soldes_bancaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_all_soldes" ON suivi_soldes_bancaires FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- ================================================================
-- VÉRIFICATION
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ TOUTES LES TABLES CRÉÉES AVEC SUCCÈS';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables créées : todos, cleaning_schedule, retours_menage,';
    RAISE NOTICE '                demandes_horaires, problemes_signales,';
    RAISE NOTICE '                simulations_fiscales, suivi_soldes_bancaires';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS activé sur toutes les tables';
    RAISE NOTICE '👤 Policies configurées pour organization_members';
END $$;
