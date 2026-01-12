-- ================================================================
-- SCHEMA COMPLET - TOUTES LES TABLES DU PROJET
-- ================================================================
-- Date: 11 janvier 2026
-- Architecture: owner_user_id (pas d'organization)
-- RGPD: Isolation par owner_user_id = auth.uid()
-- ================================================================

-- ================================================================
-- TABLE 1: gites (Propriétés)
-- ================================================================

CREATE TABLE IF NOT EXISTS gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 2),
    slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    description TEXT,
    address TEXT,
    icon TEXT DEFAULT 'home' CHECK (icon IN ('home', 'house', 'building', 'castle', 'cabin', 'apartment', 'villa', 'chalet')),
    color TEXT DEFAULT '#667eea' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    capacity INT CHECK (capacity > 0),
    bedrooms INT CHECK (bedrooms >= 0),
    bathrooms INT CHECK (bathrooms >= 0),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ical_sources JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    tarifs_calendrier JSONB DEFAULT '{}',
    regles_tarifaires JSONB DEFAULT '{}',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_gites_owner ON gites(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_gites_active ON gites(owner_user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gites_slug ON gites(owner_user_id, slug);

-- ================================================================
-- TABLE 2: reservations
-- ================================================================

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    client_name TEXT NOT NULL CHECK (length(client_name) >= 2),
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    guest_count INT CHECK (guest_count > 0),
    platform TEXT CHECK (platform IN ('airbnb', 'booking', 'abritel', 'direct', 'other')),
    platform_booking_id TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_price DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ical', 'api')),
    synced_from TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT reservations_dates_check CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_reservations_owner ON reservations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_gite ON reservations(gite_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(owner_user_id, status);

-- ================================================================
-- TABLE 3: charges (Dépenses)
-- ================================================================

CREATE TABLE IF NOT EXISTS charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE SET NULL,
    charge_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'EUR',
    category TEXT NOT NULL CHECK (category IN (
        'utilities', 'maintenance', 'supplies', 'insurance',
        'taxes', 'fees', 'cleaning', 'marketing', 'other'
    )),
    subcategory TEXT,
    description TEXT NOT NULL,
    supplier TEXT,
    invoice_number TEXT,
    payment_method TEXT CHECK (payment_method IN ('card', 'cash', 'check', 'transfer', 'other')),
    is_deductible BOOLEAN DEFAULT true,
    attachments JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charges_owner ON charges(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_charges_gite ON charges(gite_id);
CREATE INDEX IF NOT EXISTS idx_charges_date ON charges(charge_date);
CREATE INDEX IF NOT EXISTS idx_charges_category ON charges(owner_user_id, category);

-- ================================================================
-- TABLE 4: retours_menage (Rapports ménage)
-- ================================================================

CREATE TABLE IF NOT EXISTS retours_menage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    gite TEXT, -- Nom du gîte (redondant mais utilisé par l'interface)
    date_menage DATE NOT NULL,
    date DATE, -- Alias pour compatibilité
    reported_by UUID NOT NULL REFERENCES auth.users(id),
    tasks_completed JSONB DEFAULT '[]',
    issues_found JSONB DEFAULT '[]',
    supplies_needed JSONB DEFAULT '[]',
    urgent_repairs JSONB DEFAULT '[]',
    duration_minutes INT CHECK (duration_minutes > 0),
    notes TEXT,
    commentaire TEXT, -- Alias pour compatibilité
    photos JSONB DEFAULT '[]',
    validated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retours_menage_owner ON retours_menage(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_retours_menage_gite ON retours_menage(gite_id);
CREATE INDEX IF NOT EXISTS idx_retours_menage_date ON retours_menage(date_menage);
CREATE INDEX IF NOT EXISTS idx_retours_menage_validated ON retours_menage(validated);

-- ================================================================
-- TABLE 5: stocks_draps / linen_stocks (Stocks de linge)
-- ================================================================

CREATE TABLE IF NOT EXISTS stocks_draps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN (
        'flat_sheet_large', 'flat_sheet_small',
        'duvet_cover_large', 'duvet_cover_small',
        'pillowcase', 'towel', 'bath_mat',
        'tablecloth', 'tea_towel', 'other'
    )),
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INT CHECK (min_quantity >= 0),
    -- Colonnes compatibles avec linen_stocks
    draps_plats_grands INT DEFAULT 0,
    draps_plats_petits INT DEFAULT 0,
    housses_couettes_grandes INT DEFAULT 0,
    housses_couettes_petites INT DEFAULT 0,
    taies_oreillers INT DEFAULT 0,
    serviettes INT DEFAULT 0,
    tapis_bain INT DEFAULT 0,
    last_inventory_date DATE,
    last_inventory_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, gite_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_stocks_draps_owner ON stocks_draps(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stocks_draps_gite ON stocks_draps(gite_id);
CREATE INDEX IF NOT EXISTS idx_stocks_draps_low ON stocks_draps(gite_id) WHERE quantity <= min_quantity;

-- Créer une vue linen_stocks pour compatibilité
CREATE OR REPLACE VIEW linen_stocks AS
SELECT 
    id,
    owner_user_id AS organization_id,
    gite_id,
    draps_plats_grands,
    draps_plats_petits,
    housses_couettes_grandes,
    housses_couettes_petites,
    taies_oreillers,
    serviettes,
    tapis_bain,
    updated_at
FROM stocks_draps
WHERE item_type = 'flat_sheet_large'; -- Vue par défaut

-- ================================================================
-- TABLE 6: infos_pratiques (Informations pratiques)
-- ================================================================

CREATE TABLE IF NOT EXISTS infos_pratiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    info_type TEXT NOT NULL CHECK (info_type IN (
        'access', 'wifi', 'heating', 'appliances', 'trash',
        'parking', 'restaurants', 'activities', 'emergency', 'other'
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    icon TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'fr' CHECK (language ~ '^[a-z]{2}$'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infos_pratiques_owner ON infos_pratiques(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_infos_pratiques_gite ON infos_pratiques(gite_id);
CREATE INDEX IF NOT EXISTS idx_infos_pratiques_type ON infos_pratiques(info_type);
CREATE INDEX IF NOT EXISTS idx_infos_pratiques_display ON infos_pratiques(gite_id, display_order) WHERE is_active = true;

-- ================================================================
-- TABLE 7: faq (Questions fréquentes)
-- ================================================================

CREATE TABLE IF NOT EXISTS faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    categorie TEXT,
    ordre INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faq_owner ON faq(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_faq_gite ON faq(gite_id);
CREATE INDEX IF NOT EXISTS idx_faq_ordre ON faq(ordre);
CREATE INDEX IF NOT EXISTS idx_faq_categorie ON faq(categorie);

-- ================================================================
-- TABLE 8: todos (Tâches à faire)
-- ================================================================

CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('reservations', 'travaux', 'achats', 'autre')),
    completed BOOLEAN DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todos_owner ON todos(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);

-- ================================================================
-- TABLE 9: cleaning_schedule (Planning ménages)
-- ================================================================

CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite TEXT,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'pending_validation', 'refused')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cleaning_owner ON cleaning_schedule(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_date ON cleaning_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_status ON cleaning_schedule(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_gite ON cleaning_schedule(gite_id);

-- ================================================================
-- TABLE 10: demandes_horaires (Demandes horaires clients)
-- ================================================================

CREATE TABLE IF NOT EXISTS demandes_horaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('arrivee_anticipee', 'depart_tardif')),
    heure_demandee TIME,
    motif TEXT,
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demandes_owner ON demandes_horaires(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_demandes_resa ON demandes_horaires(reservation_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes_horaires(statut);

-- ================================================================
-- TABLE 11: problemes_signales (Problèmes signalés)
-- ================================================================

CREATE TABLE IF NOT EXISTS problemes_signales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite TEXT,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    categorie TEXT,
    priorite TEXT CHECK (priorite IN ('low', 'medium', 'high')),
    resolu BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problemes_owner ON problemes_signales(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_problemes_gite ON problemes_signales(gite_id);
CREATE INDEX IF NOT EXISTS idx_problemes_resolu ON problemes_signales(resolu);

-- ================================================================
-- TABLE 12: simulations_fiscales (Simulations fiscales)
-- ================================================================

CREATE TABLE IF NOT EXISTS simulations_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    revenus_totaux NUMERIC(10,2),
    charges_totales NUMERIC(10,2),
    resultat NUMERIC(10,2),
    impots_estimes NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simul_owner ON simulations_fiscales(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_simul_annee ON simulations_fiscales(annee);

-- ================================================================
-- TABLE 13: suivi_soldes_bancaires (Suivi soldes bancaires)
-- ================================================================

CREATE TABLE IF NOT EXISTS suivi_soldes_bancaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    mois INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
    solde NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, annee, mois)
);

CREATE INDEX IF NOT EXISTS idx_soldes_owner ON suivi_soldes_bancaires(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_soldes_annee ON suivi_soldes_bancaires(annee);

-- ================================================================
-- ACTIVATION RLS (Row Level Security)
-- ================================================================

ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks_draps ENABLE ROW LEVEL SECURITY;
ALTER TABLE infos_pratiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_horaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE problemes_signales ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE suivi_soldes_bancaires ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLICIES RLS - ISOLATION RGPD PAR USER
-- ================================================================

-- GITES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gites' AND policyname = 'rgpd_select_own_gites') THEN
        CREATE POLICY rgpd_select_own_gites ON gites FOR SELECT USING (owner_user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gites' AND policyname = 'rgpd_insert_own_gites') THEN
        CREATE POLICY rgpd_insert_own_gites ON gites FOR INSERT WITH CHECK (owner_user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gites' AND policyname = 'rgpd_update_own_gites') THEN
        CREATE POLICY rgpd_update_own_gites ON gites FOR UPDATE USING (owner_user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gites' AND policyname = 'rgpd_delete_own_gites') THEN
        CREATE POLICY rgpd_delete_own_gites ON gites FOR DELETE USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- RESERVATIONS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reservations' AND policyname = 'rgpd_all_own_reservations') THEN
        CREATE POLICY rgpd_all_own_reservations ON reservations FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- CHARGES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'charges' AND policyname = 'rgpd_all_own_charges') THEN
        CREATE POLICY rgpd_all_own_charges ON charges FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- RETOURS_MENAGE
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retours_menage' AND policyname = 'rgpd_all_own_retours_menage') THEN
        CREATE POLICY rgpd_all_own_retours_menage ON retours_menage FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- STOCKS_DRAPS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stocks_draps' AND policyname = 'rgpd_all_own_stocks_draps') THEN
        CREATE POLICY rgpd_all_own_stocks_draps ON stocks_draps FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- INFOS_PRATIQUES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'infos_pratiques' AND policyname = 'rgpd_all_own_infos_pratiques') THEN
        CREATE POLICY rgpd_all_own_infos_pratiques ON infos_pratiques FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- FAQ
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faq' AND policyname = 'rgpd_all_own_faq') THEN
        CREATE POLICY rgpd_all_own_faq ON faq FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- TODOS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'todos' AND policyname = 'rgpd_all_own_todos') THEN
        CREATE POLICY rgpd_all_own_todos ON todos FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- CLEANING_SCHEDULE
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cleaning_schedule' AND policyname = 'rgpd_all_own_cleaning_schedule') THEN
        CREATE POLICY rgpd_all_own_cleaning_schedule ON cleaning_schedule FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- DEMANDES_HORAIRES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'demandes_horaires' AND policyname = 'rgpd_all_own_demandes_horaires') THEN
        CREATE POLICY rgpd_all_own_demandes_horaires ON demandes_horaires FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- PROBLEMES_SIGNALES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'problemes_signales' AND policyname = 'rgpd_all_own_problemes_signales') THEN
        CREATE POLICY rgpd_all_own_problemes_signales ON problemes_signales FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- SIMULATIONS_FISCALES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'simulations_fiscales' AND policyname = 'rgpd_all_own_simulations_fiscales') THEN
        CREATE POLICY rgpd_all_own_simulations_fiscales ON simulations_fiscales FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- SUIVI_SOLDES_BANCAIRES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suivi_soldes_bancaires' AND policyname = 'rgpd_all_own_suivi_soldes_bancaires') THEN
        CREATE POLICY rgpd_all_own_suivi_soldes_bancaires ON suivi_soldes_bancaires FOR ALL USING (owner_user_id = auth.uid());
    END IF;
END $$;

-- ================================================================
-- FONCTION: Créer gîte
-- ================================================================

CREATE OR REPLACE FUNCTION create_gite(
    p_name TEXT,
    p_slug TEXT,
    p_color TEXT DEFAULT '#667eea',
    p_emoji TEXT DEFAULT 'house-simple',
    p_capacity INT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_ical_urls JSONB DEFAULT '[]'
)
RETURNS JSONB AS $$
DECLARE
    v_gite_id UUID;
BEGIN
    INSERT INTO gites (
        owner_user_id, 
        name, 
        slug, 
        icon, 
        color, 
        capacity, 
        address,
        ical_sources
    )
    VALUES (
        auth.uid(), 
        p_name, 
        p_slug, 
        p_emoji, 
        p_color, 
        p_capacity, 
        p_location,
        CASE 
            WHEN p_ical_urls IS NOT NULL AND jsonb_array_length(p_ical_urls) > 0 
            THEN jsonb_build_object('urls', p_ical_urls)
            ELSE '{}'::jsonb
        END
    )
    RETURNING id INTO v_gite_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'gite_id', v_gite_id,
        'message', 'Gîte créé avec succès'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_gite TO authenticated;

-- ================================================================
-- RÉSUMÉ
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ BASE DE DONNÉES COMPLÈTE CRÉÉE';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLES CRÉÉES (13):';
    RAISE NOTICE '  1. gites (propriétés)';
    RAISE NOTICE '  2. reservations (réservations)';
    RAISE NOTICE '  3. charges (dépenses)';
    RAISE NOTICE '  4. retours_menage (rapports ménage)';
    RAISE NOTICE '  5. stocks_draps (stocks linge)';
    RAISE NOTICE '  6. infos_pratiques (guides guests)';
    RAISE NOTICE '  7. faq (questions fréquentes)';
    RAISE NOTICE '  8. todos (tâches)';
    RAISE NOTICE '  9. cleaning_schedule (planning ménage)';
    RAISE NOTICE ' 10. demandes_horaires (demandes clients)';
    RAISE NOTICE ' 11. problemes_signales (problèmes)';
    RAISE NOTICE ' 12. simulations_fiscales (fiscalité)';
    RAISE NOTICE ' 13. suivi_soldes_bancaires (comptabilité)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 RLS ACTIVÉ + POLICIES RGPD';
    RAISE NOTICE '   Chaque user voit uniquement SES données';
    RAISE NOTICE '   Isolation: owner_user_id = auth.uid()';
    RAISE NOTICE '';
    RAISE NOTICE '✅ PRÊT À UTILISER !';
    RAISE NOTICE '==================================================';
END $$;

-- Forcer reload PostgREST
NOTIFY pgrst, 'reload schema';
