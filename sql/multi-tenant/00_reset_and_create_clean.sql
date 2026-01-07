-- ================================================================
-- RESET COMPLET + NOUVELLE ARCHITECTURE MULTI-TENANT PROPRE
-- ================================================================
-- Date: 7 janvier 2026
-- 
-- ⚠️  ATTENTION: Ce script DROP toutes les tables et repart de zéro
-- ⚠️  TOUTES LES DONNÉES SERONT PERDUES
-- 
-- Objectif: Architecture multi-tenant propre, scalable, ZERO hardcode
-- ================================================================

-- ================================================================
-- ÉTAPE 1: SUPPRIMER TOUTES LES ANCIENNES TABLES
-- ================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '🗑️  SUPPRESSION DES ANCIENNES TABLES...';
    
    -- Désactiver RLS sur toutes les tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
    
    -- Supprimer toutes les policies
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
    
    RAISE NOTICE '✅ RLS et policies supprimés';
END $$;

-- Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS rls_access_logs CASCADE;
DROP TABLE IF EXISTS checklist_progress CASCADE;
DROP TABLE IF EXISTS checklist_templates CASCADE;
DROP TABLE IF EXISTS faq CASCADE;
DROP TABLE IF EXISTS commits_log CASCADE;
DROP TABLE IF EXISTS todos CASCADE;
DROP TABLE IF EXISTS simulations_fiscales CASCADE;
DROP TABLE IF EXISTS historical_data CASCADE;
DROP TABLE IF EXISTS client_access_tokens CASCADE;
DROP TABLE IF EXISTS activites_gites CASCADE;
DROP TABLE IF EXISTS infos_gites CASCADE;
DROP TABLE IF EXISTS infos_pratiques CASCADE;
DROP TABLE IF EXISTS retours_menage CASCADE;
DROP TABLE IF EXISTS stocks_draps CASCADE;
DROP TABLE IF EXISTS cleaning_schedule CASCADE;
DROP TABLE IF EXISTS charges CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS gites CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS get_current_user_organization_ids() CASCADE;
DROP FUNCTION IF EXISTS user_has_permission_in_org(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS has_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_roles() CASCADE;
DROP FUNCTION IF EXISTS get_default_permissions_for_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_migration() CASCADE;
DROP FUNCTION IF EXISTS verify_multi_tenant_columns() CASCADE;
DROP FUNCTION IF EXISTS verify_rls_enabled() CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ Toutes les tables supprimées';
END $$;

-- ================================================================
-- ÉTAPE 2: CRÉER LES NOUVELLES TABLES PROPRES
-- ================================================================

-- ----------------------------------------------------------------
-- TABLE: organizations (Tenant principal)
-- ----------------------------------------------------------------

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
    subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT organizations_name_check CHECK (length(name) >= 2),
    CONSTRAINT organizations_slug_check CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);

COMMENT ON TABLE organizations IS 'Tenants - Chaque client a son organization';
COMMENT ON COLUMN organizations.slug IS 'Identifiant URL-friendly unique';
COMMENT ON COLUMN organizations.subscription_status IS 'État abonnement: trial, active, suspended, cancelled';

-- ----------------------------------------------------------------
-- TABLE: gites (Propriétés gérées par organization)
-- ----------------------------------------------------------------

CREATE TABLE gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    address TEXT,
    capacity INT CHECK (capacity > 0),
    bedrooms INT CHECK (bedrooms >= 0),
    bathrooms INT CHECK (bathrooms >= 0),
    icon TEXT DEFAULT 'home',
    color TEXT DEFAULT '#667eea',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ical_sources JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, slug),
    CONSTRAINT gites_name_check CHECK (length(name) >= 2),
    CONSTRAINT gites_slug_check CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT gites_icon_check CHECK (icon IN ('home', 'house', 'building', 'castle', 'cabin', 'apartment', 'villa', 'chalet')),
    CONSTRAINT gites_color_check CHECK (color ~ '^#[0-9a-f]{6}$')
);

CREATE INDEX idx_gites_organization ON gites(organization_id);
CREATE INDEX idx_gites_slug ON gites(organization_id, slug);
CREATE INDEX idx_gites_active ON gites(organization_id, is_active);

COMMENT ON TABLE gites IS 'Propriétés/gîtes gérés par chaque organization';
COMMENT ON COLUMN gites.ical_sources IS 'Config iCal par plateforme: {"airbnb": "https://...", "booking": "..."}';
COMMENT ON COLUMN gites.settings IS 'Config spécifique: besoins draps, horaires, etc.';

-- ----------------------------------------------------------------
-- TABLE: organization_members (Utilisateurs + rôles)
-- ----------------------------------------------------------------

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'housekeeper', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);

COMMENT ON TABLE organization_members IS 'Relie users aux organizations avec rôles et permissions';
COMMENT ON COLUMN organization_members.role IS 'owner > admin > manager > housekeeper > viewer';
COMMENT ON COLUMN organization_members.permissions IS 'Permissions granulaires par membre';

-- ----------------------------------------------------------------
-- TABLE: reservations (Réservations de gîtes)
-- ----------------------------------------------------------------

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Dates
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    
    -- Client
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    guest_count INT CHECK (guest_count > 0),
    
    -- Booking
    platform TEXT CHECK (platform IN ('airbnb', 'booking', 'abritel', 'direct', 'other')),
    platform_booking_id TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Finances
    total_price DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ical', 'api')),
    synced_from TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT reservations_dates_check CHECK (check_out > check_in),
    CONSTRAINT reservations_client_check CHECK (length(client_name) >= 2)
);

CREATE INDEX idx_reservations_org ON reservations(organization_id);
CREATE INDEX idx_reservations_gite ON reservations(gite_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reservations_status ON reservations(organization_id, status);
CREATE INDEX idx_reservations_platform ON reservations(platform);

COMMENT ON TABLE reservations IS 'Réservations de gîtes (toutes sources)';
COMMENT ON COLUMN reservations.source IS 'manual: saisie manuelle, ical: sync calendrier, api: API externe';
COMMENT ON COLUMN reservations.synced_from IS 'Plateforme source si ical/api';

-- ----------------------------------------------------------------
-- TABLE: cleaning_schedule (Planning ménage)
-- ----------------------------------------------------------------

CREATE TABLE cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    reservation_id UUID UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
    
    scheduled_date DATE NOT NULL,
    time_slot TEXT DEFAULT 'afternoon' CHECK (time_slot IN ('morning', 'afternoon', 'evening', 'flexible')),
    week_number TEXT,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'in_progress', 'completed', 'cancelled')),
    validated_by_company BOOLEAN DEFAULT false,
    proposed_date DATE,
    
    assigned_to UUID REFERENCES auth.users(id),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_cleaning_org ON cleaning_schedule(organization_id);
CREATE INDEX idx_cleaning_gite ON cleaning_schedule(gite_id);
CREATE INDEX idx_cleaning_date ON cleaning_schedule(scheduled_date);
CREATE INDEX idx_cleaning_status ON cleaning_schedule(organization_id, status);
CREATE INDEX idx_cleaning_assigned ON cleaning_schedule(assigned_to);

COMMENT ON TABLE cleaning_schedule IS 'Planning des ménages (1 par réservation)';
COMMENT ON COLUMN cleaning_schedule.week_number IS 'Numéro semaine pour affichage (S1, S2...)';

-- ----------------------------------------------------------------
-- TABLE: cleaning_reports (Retours ménage)
-- ----------------------------------------------------------------

CREATE TABLE cleaning_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    cleaning_schedule_id UUID REFERENCES cleaning_schedule(id) ON DELETE SET NULL,
    
    cleaning_date DATE NOT NULL,
    reported_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Checklist
    tasks_completed JSONB DEFAULT '[]',
    issues_found JSONB DEFAULT '[]',
    
    -- Approvisionnement
    supplies_needed JSONB DEFAULT '[]',
    urgent_repairs JSONB DEFAULT '[]',
    
    -- Temps
    duration_minutes INT CHECK (duration_minutes > 0),
    
    notes TEXT,
    photos JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cleaning_reports_org ON cleaning_reports(organization_id);
CREATE INDEX idx_cleaning_reports_gite ON cleaning_reports(gite_id);
CREATE INDEX idx_cleaning_reports_date ON cleaning_reports(cleaning_date);
CREATE INDEX idx_cleaning_reports_reporter ON cleaning_reports(reported_by);

COMMENT ON TABLE cleaning_reports IS 'Retours après chaque ménage';
COMMENT ON COLUMN cleaning_reports.tasks_completed IS 'Liste tâches effectuées';
COMMENT ON COLUMN cleaning_reports.issues_found IS 'Problèmes détectés';

-- ----------------------------------------------------------------
-- TABLE: linen_stocks (Stocks draps/linge)
-- ----------------------------------------------------------------

CREATE TABLE linen_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    item_type TEXT NOT NULL CHECK (item_type IN (
        'flat_sheet_large', 'flat_sheet_small',
        'duvet_cover_large', 'duvet_cover_small',
        'pillowcase', 'towel', 'bath_mat',
        'tablecloth', 'tea_towel', 'other'
    )),
    
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INT CHECK (min_quantity >= 0),
    
    last_inventory_date DATE,
    last_inventory_by UUID REFERENCES auth.users(id),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, gite_id, item_type)
);

CREATE INDEX idx_linen_stocks_org ON linen_stocks(organization_id);
CREATE INDEX idx_linen_stocks_gite ON linen_stocks(gite_id);
CREATE INDEX idx_linen_stocks_low ON linen_stocks(gite_id) WHERE quantity <= min_quantity;

COMMENT ON TABLE linen_stocks IS 'Stocks de draps et linge par gîte';
COMMENT ON COLUMN linen_stocks.item_type IS 'Type article normalisé (anglais, sans accent)';

-- ----------------------------------------------------------------
-- TABLE: expenses (Charges/dépenses)
-- ----------------------------------------------------------------

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE SET NULL,
    
    expense_date DATE NOT NULL,
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

CREATE INDEX idx_expenses_org ON expenses(organization_id);
CREATE INDEX idx_expenses_gite ON expenses(gite_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(organization_id, category);

COMMENT ON TABLE expenses IS 'Charges et dépenses (globales ou par gîte)';
COMMENT ON COLUMN expenses.gite_id IS 'NULL = charge globale organization';

-- ----------------------------------------------------------------
-- TABLE: practical_info (Infos pratiques pour guests)
-- ----------------------------------------------------------------

CREATE TABLE practical_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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

CREATE INDEX idx_practical_info_org ON practical_info(organization_id);
CREATE INDEX idx_practical_info_gite ON practical_info(gite_id);
CREATE INDEX idx_practical_info_type ON practical_info(info_type);
CREATE INDEX idx_practical_info_display ON practical_info(gite_id, display_order) WHERE is_active = true;

COMMENT ON TABLE practical_info IS 'Informations pratiques pour guests (guides)';
COMMENT ON COLUMN practical_info.gite_id IS 'NULL = info globale pour toute l''organization';

-- ================================================================
-- ÉTAPE 3: FONCTIONS HELPER RLS
-- ================================================================

-- Obtenir les organization_ids de l'utilisateur actuel
CREATE OR REPLACE FUNCTION get_current_user_organization_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier si user a une permission dans une organization
CREATE OR REPLACE FUNCTION user_has_permission(
    p_organization_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_permissions JSONB;
BEGIN
    -- Récupérer rôle et permissions
    SELECT role, permissions INTO v_role, v_permissions
    FROM organization_members
    WHERE organization_id = p_organization_id
    AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- owner et admin ont toutes les permissions
    IF v_role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier permission spécifique
    RETURN COALESCE((v_permissions->>p_permission)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- ÉTAPE 4: ACTIVER RLS SUR TOUTES LES TABLES
-- ================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE linen_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE practical_info ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- ÉTAPE 5: POLICIES RLS (Isolation multi-tenant)
-- ================================================================

-- ORGANIZATIONS --
CREATE POLICY "Users see their organizations"
ON organizations FOR SELECT
USING (id IN (SELECT * FROM get_current_user_organization_ids()));

CREATE POLICY "Owners update their organization"
ON organizations FOR UPDATE
USING (
    id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- GITES --
CREATE POLICY "Members see organization gites"
ON gites FOR SELECT
USING (organization_id IN (SELECT * FROM get_current_user_organization_ids()));

CREATE POLICY "Admins manage gites"
ON gites FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- ORGANIZATION_MEMBERS --
CREATE POLICY "Members see organization members"
ON organization_members FOR SELECT
USING (organization_id IN (SELECT * FROM get_current_user_organization_ids()));

CREATE POLICY "Admins manage members"
ON organization_members FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- RESERVATIONS --
CREATE POLICY "Members see organization reservations"
ON reservations FOR SELECT
USING (organization_id IN (SELECT * FROM get_current_user_organization_ids()));

CREATE POLICY "Managers manage reservations"
ON reservations FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
);

-- CLEANING_SCHEDULE --
CREATE POLICY "Members see cleaning schedule"
ON cleaning_schedule FOR SELECT
USING (organization_id IN (SELECT * FROM get_current_user_organization_ids()));

CREATE POLICY "Housekeepers manage their cleanings"
ON cleaning_schedule FOR ALL
USING (
    organization_id IN (SELECT * FROM get_current_user_organization_ids())
    AND (
        role IN ('owner', 'admin', 'manager') FROM organization_members
        WHERE organization_id = cleaning_schedule.organization_id
        AND user_id = auth.uid()
        OR assigned_to = auth.uid()
    )
);

-- CLEANING_REPORTS --
CREATE POLICY "Members see cleaning reports"
ON cleaning_reports FOR SELECT
USING (organization_id IN (SELECT * FROM get_current_user_organization_ids()));

CREATE POLICY "Housekeepers create reports"
ON cleaning_reports FOR INSERT
WITH CHECK (
    organization_id IN (SELECT * FROM get_current_user_organization_ids())
    AND reported_by = auth.uid()
);

CREATE POLICY "Reporters update their reports"
ON cleaning_reports FOR UPDATE
USING (reported_by = auth.uid());

-- LINEN_STOCKS --
CREATE POLICY "Members manage linen stocks"
ON linen_stocks FOR ALL
USING (organization_id IN (SELECT * FROM get_current_user_organization_ids()));

-- EXPENSES --
CREATE POLICY "Members see expenses"
ON expenses FOR SELECT
USING (organization_id IN (SELECT * FROM get_current_user_organization_ids()));

CREATE POLICY "Admins manage expenses"
ON expenses FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
);

-- PRACTICAL_INFO --
CREATE POLICY "Everyone reads practical info"
ON practical_info FOR SELECT
USING (true);

CREATE POLICY "Admins manage practical info"
ON practical_info FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- ================================================================
-- RÉSUMÉ
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ BASE DE DONNÉES RÉINITIALISÉE ET RECRÉÉE';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLES CRÉÉES (9):';
    RAISE NOTICE '  1. organizations (tenants)';
    RAISE NOTICE '  2. gites (propriétés)';
    RAISE NOTICE '  3. organization_members (users + roles)';
    RAISE NOTICE '  4. reservations (bookings)';
    RAISE NOTICE '  5. cleaning_schedule (planning ménage)';
    RAISE NOTICE '  6. cleaning_reports (retours ménage)';
    RAISE NOTICE '  7. linen_stocks (stocks draps)';
    RAISE NOTICE '  8. expenses (charges/dépenses)';
    RAISE NOTICE '  9. practical_info (infos pratiques)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 RLS + POLICIES ACTIVÉS';
    RAISE NOTICE '   Isolation multi-tenant complète';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PROCHAINE ÉTAPE:';
    RAISE NOTICE '   → Exécuter 01_seed_data.sql';
    RAISE NOTICE '   → Créer votre organization + gîtes';
    RAISE NOTICE '==================================================';
END $$;
