-- ================================================================
-- TABLE ORGANIZATIONS - Multi-tenant base
-- Phase Multi-Tenant - Étape 1.1
-- ================================================================
-- Date: 7 janvier 2026
-- Description: Table principale représentant UN CLIENT PAYANT
--              Ex: "Gîtes Calvignac SARL", "Villa Méditerranée"
-- ================================================================

-- ================================================================
-- CRÉATION DE LA TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS organizations (
    -- Identifiants
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,  -- URL-friendly: "gites-calvignac"
    
    -- Identité de l'organisation
    name TEXT NOT NULL,  -- "Gîtes du Calvignac"
    legal_name TEXT,     -- "SARL Gîtes Calvignac" (optionnel)
    siret TEXT,          -- Numéro SIRET français (optionnel)
    
    -- Propriétaire principal
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Contact
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    
    -- Adresse
    address TEXT,
    address_complement TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'FR',
    
    -- Abonnement & Plan
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'trial' CHECK (
        subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete')
    ),
    
    -- Dates importantes
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_started_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    
    -- Stripe (billing)
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    billing_email TEXT,  -- Peut être différent de l'email principal
    
    -- Limites par plan
    max_gites INTEGER DEFAULT 1,           -- free: 1, starter: 3, pro: 10, enterprise: illimité
    max_users INTEGER DEFAULT 2,            -- free: 2, starter: 5, pro: 15, enterprise: illimité
    max_reservations_per_month INTEGER DEFAULT 50,  -- free: 50, starter: 200, pro: illimité
    max_storage_mb INTEGER DEFAULT 100,     -- free: 100MB, starter: 500MB, pro: 2GB
    
    -- Utilisation actuelle (mise à jour par triggers)
    current_gites_count INTEGER DEFAULT 0,
    current_users_count INTEGER DEFAULT 1,
    current_reservations_this_month INTEGER DEFAULT 0,
    current_storage_mb DECIMAL(10,2) DEFAULT 0,
    
    -- Features activées par plan
    features JSONB DEFAULT '{
        "channel_manager": false,
        "booking_engine": false,
        "multi_currency": false,
        "api_access": false,
        "white_label": false,
        "priority_support": false,
        "custom_domain": false
    }'::jsonb,
    
    -- Métadonnées
    settings JSONB DEFAULT '{}'::jsonb,  -- Paramètres personnalisés
    metadata JSONB DEFAULT '{}'::jsonb,  -- Données additionnelles
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    
    -- Contraintes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_slug CHECK (slug ~* '^[a-z0-9-]+$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)\.]+$')
);

-- ================================================================
-- INDEX POUR PERFORMANCES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- ================================================================
-- COMMENTAIRES
-- ================================================================

COMMENT ON TABLE organizations IS 'Table principale multi-tenant - Représente un client payant';
COMMENT ON COLUMN organizations.slug IS 'Identifiant URL-friendly unique (ex: gites-calvignac)';
COMMENT ON COLUMN organizations.plan IS 'Plan tarifaire: free, starter, pro, enterprise';
COMMENT ON COLUMN organizations.subscription_status IS 'État abonnement: trial, active, past_due, canceled, unpaid';
COMMENT ON COLUMN organizations.features IS 'Features activées selon le plan (JSON)';
COMMENT ON COLUMN organizations.current_gites_count IS 'Nombre de gîtes actuels (mis à jour par trigger)';

-- ================================================================
-- TRIGGER UPDATED_AT
-- ================================================================

CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON organizations;
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- ================================================================
-- TRIGGER VALIDATION LIMITES
-- ================================================================

CREATE OR REPLACE FUNCTION validate_organization_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier limite gîtes
    IF NEW.current_gites_count > NEW.max_gites THEN
        RAISE EXCEPTION 'Limite de gîtes atteinte pour ce plan (max: %)', NEW.max_gites;
    END IF;
    
    -- Vérifier limite utilisateurs
    IF NEW.current_users_count > NEW.max_users THEN
        RAISE EXCEPTION 'Limite d''utilisateurs atteinte pour ce plan (max: %)', NEW.max_users;
    END IF;
    
    -- Vérifier limite réservations
    IF NEW.current_reservations_this_month > NEW.max_reservations_per_month THEN
        RAISE EXCEPTION 'Limite de réservations mensuelle atteinte (max: %)', NEW.max_reservations_per_month;
    END IF;
    
    -- Vérifier limite stockage
    IF NEW.current_storage_mb > NEW.max_storage_mb THEN
        RAISE EXCEPTION 'Limite de stockage atteinte (max: %MB)', NEW.max_storage_mb;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_organization_limits ON organizations;
CREATE TRIGGER trigger_validate_organization_limits
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION validate_organization_limits();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
-- NOTE: RLS sera activé dans le script 05_create_rls_policies.sql
--       APRÈS la création de toutes les tables
--       Sinon erreur car organization_members n'existe pas encore

-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les members peuvent voir leur organization
-- DROP POLICY IF EXISTS "Members can view their organization" ON organizations;
-- CREATE POLICY "Members can view their organization" ON organizations
--     FOR SELECT
--     USING (
--         id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- Policy 2: Seuls les owners peuvent modifier leur organization
-- DROP POLICY IF EXISTS "Owners can update their organization" ON organizations;
-- CREATE POLICY "Owners can update their organization" ON organizations
--     FOR UPDATE
--     USING (
--         id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() 
--             AND role = 'owner'
--         )
--     );

-- Policy 3: Création libre (pour onboarding)
-- DROP POLICY IF EXISTS "Anyone can create organization" ON organizations;
-- CREATE POLICY "Anyone can create organization" ON organizations
--     FOR INSERT
--     WITH CHECK (true);  -- On vérifie côté application

-- ================================================================
-- DONNÉES DE TEST (à supprimer en production)
-- ================================================================

-- INSERT INTO organizations (name, slug, email, owner_user_id, plan, subscription_status)
-- VALUES (
--     'Gîtes Calvignac',
--     'gites-calvignac',
--     'contact@gitescalvignac.fr',
--     null,  -- À remplacer par UUID du propriétaire
--     'pro',
--     'active'
-- );

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
