-- ================================================================
-- NOUVEAU PROJET SUPABASE - SCHEMA PROPRE ET RGPD
-- ================================================================
-- Date: 11 janvier 2026
-- Architecture: Chaque utilisateur possède ses propres gîtes
-- RGPD: Chaque user voit uniquement SES données (owner_user_id)
-- ================================================================

-- ================================================================
-- TABLE: gites (Propriétés gérées par l'utilisateur)
-- ================================================================

CREATE TABLE gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations de base
    name TEXT NOT NULL CHECK (length(name) >= 2),
    slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    description TEXT,
    address TEXT,
    
    -- Apparence
    icon TEXT DEFAULT 'home' CHECK (icon IN ('home', 'house', 'building', 'castle', 'cabin', 'apartment', 'villa', 'chalet')),
    color TEXT DEFAULT '#667eea' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    
    -- Capacité
    capacity INT CHECK (capacity > 0),
    bedrooms INT CHECK (bedrooms >= 0),
    bathrooms INT CHECK (bathrooms >= 0),
    
    -- Géolocalisation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Configuration
    ical_sources JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- Tarification (NOUVEAU - pour calendrier tarifs)
    tarifs_calendrier JSONB DEFAULT '{}',
    regles_tarifaires JSONB DEFAULT '{}',
    
    -- Ordre d'affichage
    display_order INT DEFAULT 0,
    
    -- État
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(owner_user_id, slug)
);

CREATE INDEX idx_gites_owner ON gites(owner_user_id);
CREATE INDEX idx_gites_active ON gites(owner_user_id, is_active);
CREATE INDEX idx_gites_slug ON gites(owner_user_id, slug);

COMMENT ON TABLE gites IS 'Gîtes/propriétés - chaque user possède les siens';
COMMENT ON COLUMN gites.owner_user_id IS 'Propriétaire du gîte (isolation RGPD)';
COMMENT ON COLUMN gites.ical_sources IS 'URLs iCal par plateforme: {"airbnb": "https://...", "booking": "..."}';
COMMENT ON COLUMN gites.tarifs_calendrier IS 'Tarifs personnalisés par jour: {"2026-01-15": 120, ...}';
COMMENT ON COLUMN gites.regles_tarifaires IS 'Règles automatiques: saisons, jours semaine, durées';

-- ================================================================
-- TABLE: reservations (Réservations de gîtes)
-- ================================================================

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Dates
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    
    -- Client
    client_name TEXT NOT NULL CHECK (length(client_name) >= 2),
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    guest_count INT CHECK (guest_count > 0),
    
    -- Plateforme
    platform TEXT CHECK (platform IN ('airbnb', 'booking', 'abritel', 'direct', 'other')),
    platform_booking_id TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Finances
    total_price DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Métadonnées
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ical', 'api')),
    synced_from TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT reservations_dates_check CHECK (check_out > check_in)
);

CREATE INDEX idx_reservations_owner ON reservations(owner_user_id);
CREATE INDEX idx_reservations_gite ON reservations(gite_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reservations_status ON reservations(owner_user_id, status);

COMMENT ON TABLE reservations IS 'Réservations de gîtes (toutes sources)';
COMMENT ON COLUMN reservations.source IS 'manual: saisie manuelle, ical: sync calendrier, api: API externe';

-- ================================================================
-- TABLE: charges (Dépenses/charges)
-- ================================================================

CREATE TABLE charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE SET NULL,
    
    -- Date et montant
    charge_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'EUR',
    
    -- Catégorie
    category TEXT NOT NULL CHECK (category IN (
        'utilities', 'maintenance', 'supplies', 'insurance',
        'taxes', 'fees', 'cleaning', 'marketing', 'other'
    )),
    subcategory TEXT,
    
    -- Détails
    description TEXT NOT NULL,
    supplier TEXT,
    invoice_number TEXT,
    payment_method TEXT CHECK (payment_method IN ('card', 'cash', 'check', 'transfer', 'other')),
    
    -- Fiscalité
    is_deductible BOOLEAN DEFAULT true,
    
    -- Attachements
    attachments JSONB DEFAULT '[]',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_charges_owner ON charges(owner_user_id);
CREATE INDEX idx_charges_gite ON charges(gite_id);
CREATE INDEX idx_charges_date ON charges(charge_date);
CREATE INDEX idx_charges_category ON charges(owner_user_id, category);

COMMENT ON TABLE charges IS 'Charges et dépenses (globales ou par gîte)';
COMMENT ON COLUMN charges.gite_id IS 'NULL = charge globale (pas liée à un gîte spécifique)';

-- ================================================================
-- TABLE: retours_menage (Rapports de ménage)
-- ================================================================

CREATE TABLE retours_menage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Date et responsable
    date_menage DATE NOT NULL,
    reported_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Checklist et problèmes
    tasks_completed JSONB DEFAULT '[]',
    issues_found JSONB DEFAULT '[]',
    
    -- Approvisionnement
    supplies_needed JSONB DEFAULT '[]',
    urgent_repairs JSONB DEFAULT '[]',
    
    -- Temps passé
    duration_minutes INT CHECK (duration_minutes > 0),
    
    -- Notes et photos
    notes TEXT,
    photos JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_retours_menage_owner ON retours_menage(owner_user_id);
CREATE INDEX idx_retours_menage_gite ON retours_menage(gite_id);
CREATE INDEX idx_retours_menage_date ON retours_menage(date_menage);

COMMENT ON TABLE retours_menage IS 'Rapports de ménage effectués';

-- ================================================================
-- TABLE: stocks_draps (Stocks de linge)
-- ================================================================

CREATE TABLE stocks_draps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Type d'article
    item_type TEXT NOT NULL CHECK (item_type IN (
        'flat_sheet_large', 'flat_sheet_small',
        'duvet_cover_large', 'duvet_cover_small',
        'pillowcase', 'towel', 'bath_mat',
        'tablecloth', 'tea_towel', 'other'
    )),
    
    -- Quantités
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INT CHECK (min_quantity >= 0),
    
    -- Dernier inventaire
    last_inventory_date DATE,
    last_inventory_by UUID REFERENCES auth.users(id),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(owner_user_id, gite_id, item_type)
);

CREATE INDEX idx_stocks_draps_owner ON stocks_draps(owner_user_id);
CREATE INDEX idx_stocks_draps_gite ON stocks_draps(gite_id);
CREATE INDEX idx_stocks_draps_low ON stocks_draps(gite_id) WHERE quantity <= min_quantity;

COMMENT ON TABLE stocks_draps IS 'Stocks de draps et linge par gîte';

-- ================================================================
-- TABLE: infos_pratiques (Informations pratiques pour guests)
-- ================================================================

CREATE TABLE infos_pratiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Type et contenu
    info_type TEXT NOT NULL CHECK (info_type IN (
        'access', 'wifi', 'heating', 'appliances', 'trash',
        'parking', 'restaurants', 'activities', 'emergency', 'other'
    )),
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    icon TEXT,
    
    -- Ordre et visibilité
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'fr' CHECK (language ~ '^[a-z]{2}$'),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_infos_pratiques_owner ON infos_pratiques(owner_user_id);
CREATE INDEX idx_infos_pratiques_gite ON infos_pratiques(gite_id);
CREATE INDEX idx_infos_pratiques_type ON infos_pratiques(info_type);
CREATE INDEX idx_infos_pratiques_display ON infos_pratiques(gite_id, display_order) WHERE is_active = true;

COMMENT ON TABLE infos_pratiques IS 'Informations pratiques pour les locataires';
COMMENT ON COLUMN infos_pratiques.gite_id IS 'NULL = info globale (pour tous les gîtes du user)';

-- ================================================================
-- ACTIVATION RLS (Row Level Security)
-- ================================================================

ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks_draps ENABLE ROW LEVEL SECURITY;
ALTER TABLE infos_pratiques ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLICIES RLS - ISOLATION RGPD PAR USER
-- ================================================================

-- GITES: Chaque user voit uniquement SES gîtes
CREATE POLICY rgpd_select_own_gites ON gites
FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_insert_own_gites ON gites
FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY rgpd_update_own_gites ON gites
FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_delete_own_gites ON gites
FOR DELETE USING (owner_user_id = auth.uid());

-- RESERVATIONS: Isolation par owner_user_id
CREATE POLICY rgpd_select_own_reservations ON reservations
FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_insert_own_reservations ON reservations
FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY rgpd_update_own_reservations ON reservations
FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_delete_own_reservations ON reservations
FOR DELETE USING (owner_user_id = auth.uid());

-- CHARGES: Isolation par owner_user_id
CREATE POLICY rgpd_select_own_charges ON charges
FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_insert_own_charges ON charges
FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY rgpd_update_own_charges ON charges
FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_delete_own_charges ON charges
FOR DELETE USING (owner_user_id = auth.uid());

-- RETOURS_MENAGE: Isolation par owner_user_id
CREATE POLICY rgpd_select_own_retours_menage ON retours_menage
FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_insert_own_retours_menage ON retours_menage
FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY rgpd_update_own_retours_menage ON retours_menage
FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_delete_own_retours_menage ON retours_menage
FOR DELETE USING (owner_user_id = auth.uid());

-- STOCKS_DRAPS: Isolation par owner_user_id
CREATE POLICY rgpd_select_own_stocks_draps ON stocks_draps
FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_insert_own_stocks_draps ON stocks_draps
FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY rgpd_update_own_stocks_draps ON stocks_draps
FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_delete_own_stocks_draps ON stocks_draps
FOR DELETE USING (owner_user_id = auth.uid());

-- INFOS_PRATIQUES: Isolation par owner_user_id
CREATE POLICY rgpd_select_own_infos_pratiques ON infos_pratiques
FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_insert_own_infos_pratiques ON infos_pratiques
FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY rgpd_update_own_infos_pratiques ON infos_pratiques
FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY rgpd_delete_own_infos_pratiques ON infos_pratiques
FOR DELETE USING (owner_user_id = auth.uid());

-- ================================================================
-- FONCTION: Créer gîte (pour contourner cache PostgREST si besoin)
-- ================================================================

CREATE OR REPLACE FUNCTION create_gite(
    p_name TEXT,
    p_slug TEXT,
    p_icon TEXT DEFAULT 'home',
    p_color TEXT DEFAULT '#667eea',
    p_capacity INT DEFAULT 4,
    p_address TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_gite_id UUID;
BEGIN
    INSERT INTO gites (owner_user_id, name, slug, icon, color, capacity, address)
    VALUES (auth.uid(), p_name, p_slug, p_icon, p_color, p_capacity, p_address)
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
    RAISE NOTICE '✅ BASE DE DONNÉES CRÉÉE - ARCHITECTURE RGPD';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLES CRÉÉES (6):';
    RAISE NOTICE '  1. gites (propriétés)';
    RAISE NOTICE '  2. reservations (réservations)';
    RAISE NOTICE '  3. charges (dépenses)';
    RAISE NOTICE '  4. retours_menage (rapports ménage)';
    RAISE NOTICE '  5. stocks_draps (stocks linge)';
    RAISE NOTICE '  6. infos_pratiques (guides guests)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 RLS ACTIVÉ + POLICIES RGPD';
    RAISE NOTICE '   Chaque user voit uniquement SES données';
    RAISE NOTICE '   Isolation: owner_user_id = auth.uid()';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 COLONNES SPÉCIALES GITES:';
    RAISE NOTICE '   - tarifs_calendrier (JSONB)';
    RAISE NOTICE '   - regles_tarifaires (JSONB)';
    RAISE NOTICE '   - display_order (INT)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ PRÊT À UTILISER !';
    RAISE NOTICE '   → Connecte-toi avec ton email: stephanecalvignac@hotmail.fr';
    RAISE NOTICE '   → Crée tes gîtes via l''interface';
    RAISE NOTICE '==================================================';
END $$;

-- Forcer reload PostgREST
NOTIFY pgrst, 'reload schema';
