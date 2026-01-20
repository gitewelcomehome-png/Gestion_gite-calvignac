-- ================================================================
-- SCHÉMA MULTI-TENANT + RPC D'ONBOARDING
-- ================================================================
-- ➤ On garde RLS activé partout
-- ➤ Plus de trigger fragile sur auth.users
-- ➤ Une fonction RPC complete_onboarding() gère tout côté serveur
-- ================================================================

-- ================================================================
-- TABLES
-- ================================================================

-- Nettoyage si ancienne version présente
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS gites CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Organizations (tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(name) >= 2),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    email TEXT,
    phone TEXT,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_user_id);

-- Gites
CREATE TABLE IF NOT EXISTS gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 2),
    slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    icon TEXT DEFAULT 'chalet' CHECK (icon IN ('home', 'house', 'building', 'castle', 'cabin', 'apartment', 'villa', 'chalet')),
    color TEXT DEFAULT '#667eea' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    capacity INT CHECK (capacity > 0),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_gites_org ON gites(organization_id);

-- Members
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON organization_members(user_id);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    amount DECIMAL(10,2),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_org ON reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_gite ON reservations(gite_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);

-- ================================================================
-- Nettoyage éventuel de l'ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ================================================================
-- RLS (ROW LEVEL SECURITY)
-- ================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's organizations
DROP FUNCTION IF EXISTS get_user_organizations(UUID);
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS SETOF UUID AS $$
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================================
-- RPC : COMPLETE_ONBOARDING
-- ================================================================

DROP FUNCTION IF EXISTS complete_onboarding(TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION complete_onboarding(
    p_org_name TEXT,
    p_org_email TEXT DEFAULT NULL,
    p_org_phone TEXT DEFAULT NULL,
    p_gites JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_existing UUID;
    v_org_id UUID;
    v_slug_base TEXT;
    v_slug TEXT;
    v_counter INT := 0;
    v_gite JSONB;
    v_gite_name TEXT;
    v_gite_slug TEXT;
    v_capacity INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'auth_required';
    END IF;

    SELECT organization_id INTO v_existing
    FROM organization_members
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RAISE EXCEPTION 'organization_already_exists';
    END IF;

    IF p_org_name IS NULL OR length(trim(p_org_name)) < 2 THEN
        RAISE EXCEPTION 'invalid_organization_name';
    END IF;

    v_slug_base := lower(regexp_replace(trim(p_org_name), '[^a-z0-9]+', '-', 'g'));
    IF v_slug_base = '' THEN
        v_slug_base := 'organization';
    END IF;
    v_slug_base := substring(v_slug_base FROM 1 FOR 40);
    v_slug := v_slug_base;

    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) LOOP
        v_slug := v_slug_base || '-' || substring(gen_random_uuid()::text FROM 1 FOR 6);
    END LOOP;

    INSERT INTO organizations (name, slug, email, phone, owner_user_id)
    VALUES (trim(p_org_name), v_slug, nullif(trim(p_org_email), ''), nullif(trim(p_org_phone), ''), v_user_id)
    RETURNING id INTO v_org_id;

    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner');

    IF p_gites IS NOT NULL THEN
        FOR v_gite IN SELECT jsonb_array_elements(p_gites)
        LOOP
            v_gite_name := nullif(trim(coalesce(v_gite->>'name', '')), '');
            IF v_gite_name IS NULL THEN
                v_gite_name := 'Gîte ' || (v_counter + 1);
            END IF;

            v_gite_slug := lower(regexp_replace(v_gite_name, '[^a-z0-9]+', '-', 'g'));
            IF v_gite_slug = '' THEN
                v_gite_slug := 'gite';
            END IF;
            v_gite_slug := substring(v_gite_slug FROM 1 FOR 40);

            WHILE EXISTS (
                SELECT 1 FROM gites
                WHERE organization_id = v_org_id
                  AND slug = v_gite_slug
            ) LOOP
                v_gite_slug := v_gite_slug || '-' || substring(gen_random_uuid()::text FROM 1 FOR 4);
            END LOOP;

            v_capacity := NULLIF((v_gite->>'capacity')::INT, 0);
            IF v_capacity IS NULL OR v_capacity < 1 THEN
                v_capacity := 4;
            END IF;

            INSERT INTO gites (
                organization_id,
                name,
                slug,
                icon,
                color,
                capacity,
                address
            ) VALUES (
                v_org_id,
                v_gite_name,
                v_gite_slug,
                COALESCE(nullif(v_gite->>'icon', ''), 'chalet'),
                COALESCE(nullif(v_gite->>'color', ''), '#667eea'),
                v_capacity,
                NULLIF(trim(coalesce(v_gite->>'address', '')), '')
            );

            v_counter := v_counter + 1;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'organization_id', v_org_id,
        'gites_created', v_counter
    );
END;
$$;

GRANT EXECUTE ON FUNCTION complete_onboarding(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- ================================================================
-- POLICIES - ORGANIZATIONS
-- ================================================================

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT
    USING (
        id IN (SELECT get_user_organizations(auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
CREATE POLICY "Users can update their organizations" ON organizations
    FOR UPDATE
    USING (
        id IN (SELECT get_user_organizations(auth.uid()))
    );

-- ================================================================
-- POLICIES - GITES
-- ================================================================

DROP POLICY IF EXISTS "Users can view gites in their organizations" ON gites;
CREATE POLICY "Users can view gites in their organizations" ON gites
    FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

DROP POLICY IF EXISTS "Users can insert gites in their organizations" ON gites;
CREATE POLICY "Users can insert gites in their organizations" ON gites
    FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update gites in their organizations" ON gites;
CREATE POLICY "Users can update gites in their organizations" ON gites
    FOR UPDATE
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

DROP POLICY IF EXISTS "Users can delete gites in their organizations" ON gites;
CREATE POLICY "Users can delete gites in their organizations" ON gites
    FOR DELETE
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- ================================================================
-- POLICIES - MEMBERS
-- ================================================================

DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
CREATE POLICY "Users can view members of their organizations" ON organization_members
    FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- ================================================================
-- POLICIES - RESERVATIONS
-- ================================================================

DROP POLICY IF EXISTS "Users can view reservations in their organizations" ON reservations;
CREATE POLICY "Users can view reservations in their organizations" ON reservations
    FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

DROP POLICY IF EXISTS "Users can insert reservations in their organizations" ON reservations;
CREATE POLICY "Users can insert reservations in their organizations" ON reservations
    FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update reservations in their organizations" ON reservations;
CREATE POLICY "Users can update reservations in their organizations" ON reservations
    FOR UPDATE
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

DROP POLICY IF EXISTS "Users can delete reservations in their organizations" ON reservations;
CREATE POLICY "Users can delete reservations in their organizations" ON reservations
    FOR DELETE
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- ================================================================
-- VÉRIFICATION
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ SCHÉMA CRÉÉ AVEC RPC COMPLETE_ONBOARDING()';
    RAISE NOTICE '✅ Organizations, gites, members, reservations prêts';
    RAISE NOTICE '✅ RLS activé sur toutes les tables';
    RAISE NOTICE '✅ Fonction complete_onboarding() disponible pour les utilisateurs authentifiés';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PROCHAINE ÉTAPE : Appeler RPC complete_onboarding depuis le front après signUp';
END $$;
