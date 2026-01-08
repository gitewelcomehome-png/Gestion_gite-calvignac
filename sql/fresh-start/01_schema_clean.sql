-- ================================================================
-- SCHEMA MULTI-TENANT PROPRE - ONBOARDING FONCTIONNEL
-- ================================================================
-- À exécuter UNE SEULE FOIS sur un projet Supabase neuf
-- ================================================================

-- ================================================================
-- TABLES
-- ================================================================

-- Organizations (tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(name) >= 2),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Gites
CREATE TABLE gites (
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

CREATE INDEX idx_gites_org ON gites(organization_id);

-- Members
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_members_org ON organization_members(organization_id);
CREATE INDEX idx_members_user ON organization_members(user_id);

-- Reservations
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (check_out > check_in)
);

CREATE INDEX idx_reservations_org ON reservations(organization_id);
CREATE INDEX idx_reservations_gite ON reservations(gite_id);

-- ================================================================
-- FONCTION HELPER
-- ================================================================

CREATE OR REPLACE FUNCTION get_user_orgs()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- RLS ACTIVATION
-- ================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLICIES - SIMPLE ET FONCTIONNEL
-- ================================================================

-- ORGANIZATIONS
CREATE POLICY "anyone_insert_org" ON organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "members_select_org" ON organizations FOR SELECT TO authenticated USING (id IN (SELECT get_user_orgs()));
CREATE POLICY "owners_update_org" ON organizations FOR UPDATE TO authenticated USING (id IN (SELECT get_user_orgs()));

-- GITES
CREATE POLICY "anyone_insert_gite" ON gites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "members_select_gites" ON gites FOR SELECT TO authenticated USING (organization_id IN (SELECT get_user_orgs()));
CREATE POLICY "members_update_gites" ON gites FOR UPDATE TO authenticated USING (organization_id IN (SELECT get_user_orgs()));

-- ORGANIZATION_MEMBERS
CREATE POLICY "self_insert_member" ON organization_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "members_select_members" ON organization_members FOR SELECT TO authenticated USING (organization_id IN (SELECT get_user_orgs()));

-- RESERVATIONS
CREATE POLICY "members_all_reservations" ON reservations FOR ALL TO authenticated USING (organization_id IN (SELECT get_user_orgs()));

-- ================================================================
-- VALIDATION
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ SCHEMA CRÉÉ AVEC SUCCÈS';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables : organizations, gites, organization_members, reservations';
    RAISE NOTICE 'RLS activé avec policies pour onboarding';
    RAISE NOTICE '';
    RAISE NOTICE 'ATTENDRE 30 SECONDES puis tester onboarding';
END $$;
