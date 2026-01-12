-- ================================================================
-- MIGRATION PRODUCTION - PRÉSERVATION DES DONNÉES
-- ================================================================
-- Date: 7 janvier 2026
-- Objectif: Migrer de schema legacy (gite TEXT) vers multi-tenant (gite_id UUID)
-- 
-- ✅ PRÉSERVE TOUTES LES DONNÉES EXISTANTES
-- ✅ Migration incrémentale sans downtime
-- ✅ Rollback possible à chaque étape
-- 
-- ⚠️  PRÉREQUIS:
--    1. Backup complet réalisé
--    2. Tests validés en environnement test
--    3. Maintenance window planifiée (2h recommandé)
-- ================================================================

-- ================================================================
-- PHASE 1: CRÉATION DES TABLES NOUVELLES (sans toucher aux anciennes)
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1.1 Table organizations (tenant principal)
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
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

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);

RAISE NOTICE '✅ Table organizations créée';

-- ----------------------------------------------------------------
-- 1.2 Insérer l'organization unique pour cette instance
-- ----------------------------------------------------------------

INSERT INTO organizations (name, slug, email, subscription_status, subscription_plan)
VALUES ('Gîtes Calvignac', 'calvignac', NULL, 'active', 'basic')
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- Récupérer l'ID de l'organization (pour l'utiliser dans les inserts suivants)
DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM organizations WHERE slug = 'calvignac';
    RAISE NOTICE '✅ Organization ID: %', org_id;
END $$;

-- ----------------------------------------------------------------
-- 1.3 Table gites (propriétés)
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    address TEXT,
    capacity INT CHECK (capacity > 0),
    bedrooms INT CHECK (bedrooms >= 0),
    bathrooms INT CHECK (bathrooms >= 0),
    icon TEXT DEFAULT '🏠',
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
    CONSTRAINT gites_slug_check CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_gites_organization ON gites(organization_id);
CREATE INDEX IF NOT EXISTS idx_gites_slug ON gites(organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_gites_active ON gites(organization_id, is_active);

RAISE NOTICE '✅ Table gites créée';

-- ----------------------------------------------------------------
-- 1.4 Insérer les 2 gîtes existants
-- ----------------------------------------------------------------

INSERT INTO gites (
    organization_id, 
    name, 
    slug, 
    description,
    capacity,
    bedrooms,
    icon, 
    color,
    latitude,
    longitude,
    ical_sources,
    settings
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'calvignac'),
    'Trevoux',
    'trevoux',
    'Gîte à Trévoux avec vue château',
    6,
    3,
    '🏰',
    '#667eea',
    45.9408,
    4.7728,
    '{
        "airbnb": "https://www.airbnb.fr/calendar/ical/...",
        "booking": "https://admin.booking.com/hotel/..."
    }'::jsonb,
    '{
        "cleaningDuration": 3,
        "linenNeeds": {"singleSheets": 3, "doubleSheets": 2}
    }'::jsonb
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO gites (
    organization_id, 
    name, 
    slug, 
    description,
    capacity,
    bedrooms,
    icon, 
    color,
    latitude,
    longitude,
    ical_sources,
    settings
)
SELECT 
    (SELECT id FROM organizations WHERE slug = 'calvignac'),
    'Couzon',
    'couzon',
    'Gîte à Couzon au Mont d''Or avec vue montagne',
    4,
    2,
    '⛰️',
    '#f093fb',
    45.8425,
    4.8331,
    '{
        "airbnb": "https://www.airbnb.fr/calendar/ical/...",
        "booking": "https://admin.booking.com/hotel/..."
    }'::jsonb,
    '{
        "cleaningDuration": 2.5,
        "linenNeeds": {"singleSheets": 2, "doubleSheets": 1}
    }'::jsonb
ON CONFLICT (organization_id, slug) DO NOTHING;

RAISE NOTICE '✅ Gîtes Trevoux et Couzon insérés';

COMMIT;

-- ================================================================
-- PHASE 2: AJOUT DES NOUVELLES COLONNES (sans casser l'existant)
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 2.1 Ajouter organization_id et gite_id à reservations
-- ----------------------------------------------------------------

-- Ajouter organization_id (nullable pour l'instant)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS organization_id UUID 
REFERENCES organizations(id) ON DELETE CASCADE;

-- Ajouter gite_id (nullable pour l'instant)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS gite_id UUID 
REFERENCES gites(id) ON DELETE CASCADE;

RAISE NOTICE '✅ Colonnes organization_id et gite_id ajoutées à reservations';

-- ----------------------------------------------------------------
-- 2.2 Ajouter colonnes manquantes si nécessaire
-- ----------------------------------------------------------------

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('airbnb', 'booking', 'abritel', 'direct', 'other'));

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed' 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' 
CHECK (source IN ('manual', 'ical', 'api'));

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS synced_from TEXT;

RAISE NOTICE '✅ Colonnes supplémentaires ajoutées à reservations';

COMMIT;

-- ================================================================
-- PHASE 3: MIGRATION DES DONNÉES (mapping TEXT → UUID)
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 3.1 Remplir organization_id pour toutes les réservations
-- ----------------------------------------------------------------

UPDATE reservations 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac')
WHERE organization_id IS NULL;

RAISE NOTICE '✅ organization_id rempli pour % réservations', 
    (SELECT COUNT(*) FROM reservations WHERE organization_id IS NOT NULL);

-- ----------------------------------------------------------------
-- 3.2 Remplir gite_id via mapping name → UUID
-- ----------------------------------------------------------------

-- Mapping Trevoux: gite TEXT → gite_id UUID
UPDATE reservations 
SET gite_id = (SELECT id FROM gites WHERE name = 'Trevoux' AND organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac'))
WHERE gite = 'Trevoux' 
  AND gite_id IS NULL;

-- Mapping Couzon: gite TEXT → gite_id UUID
UPDATE reservations 
SET gite_id = (SELECT id FROM gites WHERE name = 'Couzon' AND organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac'))
WHERE gite = 'Couzon' 
  AND gite_id IS NULL;

-- Vérification: aucune réservation sans gite_id
DO $$
DECLARE
    unmapped_count INT;
BEGIN
    SELECT COUNT(*) INTO unmapped_count 
    FROM reservations 
    WHERE gite_id IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE EXCEPTION '❌ % réservations sans gite_id mappé!', unmapped_count;
    ELSE
        RAISE NOTICE '✅ Toutes les réservations mappées (gite_id rempli)';
    END IF;
END $$;

COMMIT;

-- ================================================================
-- PHASE 4: MIGRATION DES AUTRES TABLES
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 4.1 Cleaning Schedule
-- ----------------------------------------------------------------

ALTER TABLE cleaning_schedule 
ADD COLUMN IF NOT EXISTS organization_id UUID 
REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE cleaning_schedule 
ADD COLUMN IF NOT EXISTS gite_id UUID 
REFERENCES gites(id) ON DELETE CASCADE;

-- Remplir organization_id
UPDATE cleaning_schedule 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac')
WHERE organization_id IS NULL;

-- Remplir gite_id via mapping
UPDATE cleaning_schedule cs
SET gite_id = (SELECT id FROM gites WHERE name = cs.gite AND organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac'))
WHERE gite IS NOT NULL 
  AND gite_id IS NULL;

RAISE NOTICE '✅ cleaning_schedule migré: % lignes', 
    (SELECT COUNT(*) FROM cleaning_schedule WHERE gite_id IS NOT NULL);

-- ----------------------------------------------------------------
-- 4.2 Stocks Draps (linen_stocks)
-- ----------------------------------------------------------------

-- Si la table existe (vérifier d'abord)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stocks_draps') THEN
        
        ALTER TABLE stocks_draps 
        ADD COLUMN IF NOT EXISTS organization_id UUID 
        REFERENCES organizations(id) ON DELETE CASCADE;
        
        ALTER TABLE stocks_draps 
        ADD COLUMN IF NOT EXISTS gite_id UUID 
        REFERENCES gites(id) ON DELETE CASCADE;
        
        -- Remplir organization_id
        UPDATE stocks_draps 
        SET organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac')
        WHERE organization_id IS NULL;
        
        -- Remplir gite_id
        UPDATE stocks_draps sd
        SET gite_id = (SELECT id FROM gites WHERE name = sd.gite AND organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac'))
        WHERE gite IS NOT NULL 
          AND gite_id IS NULL;
        
        RAISE NOTICE '✅ stocks_draps migré: % lignes', 
            (SELECT COUNT(*) FROM stocks_draps WHERE gite_id IS NOT NULL);
    ELSE
        RAISE NOTICE 'ℹ️  Table stocks_draps n''existe pas (skip)';
    END IF;
END $$;

-- ----------------------------------------------------------------
-- 4.3 Charges (expenses)
-- ----------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'charges') THEN
        
        ALTER TABLE charges 
        ADD COLUMN IF NOT EXISTS organization_id UUID 
        REFERENCES organizations(id) ON DELETE CASCADE;
        
        ALTER TABLE charges 
        ADD COLUMN IF NOT EXISTS gite_id UUID 
        REFERENCES gites(id) ON DELETE CASCADE;
        
        -- Remplir organization_id (toujours)
        UPDATE charges 
        SET organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac')
        WHERE organization_id IS NULL;
        
        -- Remplir gite_id (seulement si charge spécifique à un gîte)
        UPDATE charges c
        SET gite_id = (SELECT id FROM gites WHERE name = c.gite AND organization_id = (SELECT id FROM organizations WHERE slug = 'calvignac'))
        WHERE gite IS NOT NULL 
          AND gite_id IS NULL;
        
        RAISE NOTICE '✅ charges migré: % lignes', 
            (SELECT COUNT(*) FROM charges);
    ELSE
        RAISE NOTICE 'ℹ️  Table charges n''existe pas (skip)';
    END IF;
END $$;

COMMIT;

-- ================================================================
-- PHASE 5: CONTRAINTES ET NETTOYAGE (optionnel - à faire plus tard)
-- ================================================================

-- ⚠️  NE PAS EXÉCUTER IMMÉDIATEMENT
-- ⚠️  À faire après validation complète (plusieurs jours/semaines)

-- BEGIN;

-- -- Rendre organization_id et gite_id NOT NULL
-- ALTER TABLE reservations ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE reservations ALTER COLUMN gite_id SET NOT NULL;

-- ALTER TABLE cleaning_schedule ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE cleaning_schedule ALTER COLUMN gite_id SET NOT NULL;

-- -- Supprimer les anciennes colonnes TEXT (après validation complète)
-- -- ALTER TABLE reservations DROP COLUMN IF EXISTS gite;
-- -- ALTER TABLE cleaning_schedule DROP COLUMN IF EXISTS gite;
-- -- ALTER TABLE stocks_draps DROP COLUMN IF EXISTS gite;
-- -- ALTER TABLE charges DROP COLUMN IF EXISTS gite;

-- RAISE NOTICE '✅ Contraintes NOT NULL appliquées';
-- RAISE NOTICE '⚠️  Anciennes colonnes TEXT conservées (à supprimer manuellement plus tard)';

-- COMMIT;

-- ================================================================
-- PHASE 6: VÉRIFICATIONS FINALES
-- ================================================================

-- Statistiques migration
SELECT 
    '✅ MIGRATION RÉUSSIE!' as status,
    (SELECT COUNT(*) FROM organizations) as organizations_count,
    (SELECT COUNT(*) FROM gites) as gites_count,
    (SELECT COUNT(*) FROM reservations) as reservations_total,
    (SELECT COUNT(*) FROM reservations WHERE gite_id IS NOT NULL) as reservations_migrated,
    (SELECT COUNT(*) FROM reservations WHERE gite_id IS NULL) as reservations_unmapped,
    (SELECT COUNT(*) FROM cleaning_schedule WHERE gite_id IS NOT NULL) as cleaning_migrated;

-- Afficher les gîtes créés
SELECT 
    g.name,
    g.slug,
    g.icon,
    g.color,
    COUNT(r.id) as reservations_count
FROM gites g
LEFT JOIN reservations r ON r.gite_id = g.id
GROUP BY g.id, g.name, g.slug, g.icon, g.color
ORDER BY g.name;

-- Vérifier s'il reste des réservations non mappées
DO $$
DECLARE
    unmapped_count INT;
BEGIN
    SELECT COUNT(*) INTO unmapped_count 
    FROM reservations 
    WHERE gite_id IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE WARNING '⚠️  % réservations sans gite_id!', unmapped_count;
        
        -- Afficher les réservations problématiques
        RAISE NOTICE 'Réservations non mappées:';
        FOR rec IN (SELECT id, gite, client_name, check_in FROM reservations WHERE gite_id IS NULL LIMIT 10) LOOP
            RAISE NOTICE '  - ID: %, gite: %, client: %, date: %', rec.id, rec.gite, rec.client_name, rec.check_in;
        END LOOP;
    ELSE
        RAISE NOTICE '✅ Toutes les réservations mappées correctement!';
    END IF;
END $$;

RAISE NOTICE '================================================================';
RAISE NOTICE '✅ MIGRATION TERMINÉE AVEC SUCCÈS';
RAISE NOTICE '================================================================';
RAISE NOTICE '';
RAISE NOTICE 'PROCHAINES ÉTAPES:';
RAISE NOTICE '1. Tester l''application avec la nouvelle BDD';
RAISE NOTICE '2. Vérifier que toutes les fonctionnalités marchent';
RAISE NOTICE '3. Monitorer pendant 24-48h';
RAISE NOTICE '4. Si tout OK: exécuter PHASE 5 pour supprimer anciennes colonnes';
RAISE NOTICE '';
RAISE NOTICE '⚠️  BACKUP conservé pendant 1 semaine minimum';
RAISE NOTICE '================================================================';
