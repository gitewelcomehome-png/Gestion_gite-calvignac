-- ================================================================
-- AJOUT COLONNES MULTI-TENANT aux tables existantes
-- Phase Multi-Tenant - Étape 2
-- ================================================================
-- Date: 7 janvier 2026
-- Description: Ajouter organization_id et gite_id à toutes les tables
--              IMPORTANT: À exécuter APRÈS 01, 02, 03
-- ================================================================

-- ================================================================
-- NOTES IMPORTANTES
-- ================================================================
-- Ce script doit être exécuté dans l'ordre suivant:
-- 1. Créer organizations (01)
-- 2. Créer gites (02)
-- 3. Créer organization_members (03)
-- 4. PUIS ce script (04)
-- 5. Migration données (06)
-- 6. RLS policies (05) - EN DERNIER

-- ================================================================
-- TABLE: reservations
-- ================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        -- Ajouter organization_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reservations' AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE reservations 
            ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne organization_id ajoutée à reservations';
        END IF;
        
        -- Ajouter gite_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reservations' AND column_name = 'gite_id'
        ) THEN
            ALTER TABLE reservations 
            ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne gite_id ajoutée à reservations';
        END IF;
        
        -- Index pour performances
        CREATE INDEX IF NOT EXISTS idx_reservations_organization ON reservations(organization_id);
        CREATE INDEX IF NOT EXISTS idx_reservations_gite ON reservations(gite_id);
        
        COMMENT ON COLUMN reservations.organization_id IS 'Organization propriétaire de la réservation';
        COMMENT ON COLUMN reservations.gite_id IS 'Gîte concerné par la réservation';
    ELSE
        RAISE NOTICE 'Table reservations n''existe pas - ignorée';
    END IF;
END $$;

-- ================================================================
-- TABLE: charges
-- ================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'charges') THEN
        -- Ajouter organization_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'charges' AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE charges 
            ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne organization_id ajoutée à charges';
        END IF;
        
        -- Ajouter gite_id (optionnel - une charge peut être globale à l'org)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'charges' AND column_name = 'gite_id'
        ) THEN
            ALTER TABLE charges 
            ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Colonne gite_id ajoutée à charges';
        END IF;
        
        -- Index pour performances
        CREATE INDEX IF NOT EXISTS idx_charges_organization ON charges(organization_id);
        CREATE INDEX IF NOT EXISTS idx_charges_gite ON charges(gite_id);
        CREATE INDEX IF NOT EXISTS idx_charges_org_date ON charges(organization_id, date);
        
        COMMENT ON COLUMN charges.organization_id IS 'Organization propriétaire de la charge';
        COMMENT ON COLUMN charges.gite_id IS 'Gîte concerné (NULL = charge globale organization)';
    ELSE
        RAISE NOTICE 'Table charges n''existe pas - ignorée';
    END IF;
END $$;

-- ================================================================
-- TABLE: retours_menage
-- ================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'retours_menage') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'retours_menage' AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE retours_menage 
            ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne organization_id ajoutée à retours_menage';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'retours_menage' AND column_name = 'gite_id'
        ) THEN
            ALTER TABLE retours_menage 
            ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne gite_id ajoutée à retours_menage';
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_retours_menage_organization ON retours_menage(organization_id);
        CREATE INDEX IF NOT EXISTS idx_retours_menage_gite ON retours_menage(gite_id);
        CREATE INDEX IF NOT EXISTS idx_retours_menage_org_date ON retours_menage(organization_id, date_menage);
        
        COMMENT ON COLUMN retours_menage.organization_id IS 'Organization propriétaire';
        COMMENT ON COLUMN retours_menage.gite_id IS 'Gîte nettoyé';
    ELSE
        RAISE NOTICE 'Table retours_menage n''existe pas - ignorée';
    END IF;
END $$;

-- ================================================================
-- TABLE: stocks_draps
-- ================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stocks_draps') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'stocks_draps' AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE stocks_draps 
            ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne organization_id ajoutée à stocks_draps';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'stocks_draps' AND column_name = 'gite_id'
        ) THEN
            ALTER TABLE stocks_draps 
            ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne gite_id ajoutée à stocks_draps';
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_stocks_draps_organization ON stocks_draps(organization_id);
        CREATE INDEX IF NOT EXISTS idx_stocks_draps_gite ON stocks_draps(gite_id);
        
        COMMENT ON COLUMN stocks_draps.organization_id IS 'Organization propriétaire';
        COMMENT ON COLUMN stocks_draps.gite_id IS 'Gîte concerné';
    ELSE
        RAISE NOTICE 'Table stocks_draps n''existe pas - ignorée';
    END IF;
END $$;

-- ================================================================
-- TABLE: infos_pratiques (si existe)
-- ================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'infos_pratiques') THEN
        -- Ajouter organization_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'infos_pratiques' AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE infos_pratiques 
            ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne organization_id ajoutée à infos_pratiques';
        END IF;
        
        -- Ajouter gite_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'infos_pratiques' AND column_name = 'gite_id'
        ) THEN
            ALTER TABLE infos_pratiques 
            ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne gite_id ajoutée à infos_pratiques';
        END IF;
        
        -- Index
        CREATE INDEX IF NOT EXISTS idx_infos_pratiques_organization ON infos_pratiques(organization_id);
        CREATE INDEX IF NOT EXISTS idx_infos_pratiques_gite ON infos_pratiques(gite_id);
        
        COMMENT ON COLUMN infos_pratiques.organization_id IS 'Organization propriétaire';
        COMMENT ON COLUMN infos_pratiques.gite_id IS 'Gîte concerné';
    ELSE
        RAISE NOTICE 'Table infos_pratiques n''existe pas - ignorée';
    END IF;
END $$;

-- ================================================================
-- TABLE: user_roles (remplacer par organization_members)
-- ================================================================

-- ATTENTION: user_roles est remplacée par organization_members
-- Migration à prévoir dans le script 06_migrate_existing_data.sql

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        RAISE NOTICE 'Table user_roles existe - Migration à prévoir vers organization_members';
        
        -- Ajouter organization_id temporairement pour la migration
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_roles' AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE user_roles 
            ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Colonne organization_id ajoutée temporairement à user_roles';
        END IF;
    END IF;
END $$;

-- ================================================================
-- AUTRES TABLES (à compléter selon votre schéma)
-- ================================================================

-- Template pour ajouter d'autres tables:
/*
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nom_table') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'nom_table' AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE nom_table 
            ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
            ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_nom_table_organization ON nom_table(organization_id);
            CREATE INDEX IF NOT EXISTS idx_nom_table_gite ON nom_table(gite_id);
            
            RAISE NOTICE 'Colonnes ajoutées à nom_table';
        END IF;
    END IF;
END $$;
*/

-- ================================================================
-- TRIGGER: Incrémenter compteur réservations par mois
-- ================================================================

CREATE OR REPLACE FUNCTION increment_monthly_reservations()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrémenter le compteur de l'organization
    UPDATE organizations 
    SET current_reservations_this_month = current_reservations_this_month + 1
    WHERE id = NEW.organization_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur reservations si la table existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        DROP TRIGGER IF EXISTS trigger_increment_monthly_reservations ON reservations;
        CREATE TRIGGER trigger_increment_monthly_reservations
            AFTER INSERT ON reservations
            FOR EACH ROW
            EXECUTE FUNCTION increment_monthly_reservations();
        
        RAISE NOTICE 'Trigger compteur réservations créé';
    END IF;
END $$;

-- ================================================================
-- FONCTION: Reset compteur mensuel réservations
-- ================================================================

-- À exécuter via CRON tous les 1er du mois
CREATE OR REPLACE FUNCTION reset_monthly_reservation_counters()
RETURNS void AS $$
BEGIN
    UPDATE organizations
    SET current_reservations_this_month = 0
    WHERE current_reservations_this_month > 0;
    
    RAISE NOTICE 'Compteurs réservations mensuels réinitialisés';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- VERIFICATION POST-MIGRATION
-- ================================================================

-- Fonction pour vérifier que toutes les colonnes sont ajoutées
CREATE OR REPLACE FUNCTION verify_multi_tenant_columns()
RETURNS TABLE (
    table_name TEXT,
    has_organization_id BOOLEAN,
    has_gite_id BOOLEAN,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        EXISTS(
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_name = t.table_name 
            AND c.column_name = 'organization_id'
        ) as has_organization_id,
        EXISTS(
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_name = t.table_name 
            AND c.column_name = 'gite_id'
        ) as has_gite_id,
        CASE 
            WHEN EXISTS(
                SELECT 1 FROM information_schema.columns c 
                WHERE c.table_name = t.table_name 
                AND c.column_name = 'organization_id'
            ) THEN '✅ OK'
            ELSE '❌ MANQUANT'
        END as status
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN (
        'reservations', 
        'charges', 
        'retours_menage', 
        'stocks_draps', 
        'infos_pratiques'
    );
END;
$$ LANGUAGE plpgsql;

-- Lancer la vérification
-- SELECT * FROM verify_multi_tenant_columns();

-- ================================================================
-- RÉSUMÉ DES CHANGEMENTS
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'COLONNES MULTI-TENANT AJOUTÉES';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ reservations → organization_id, gite_id';
    RAISE NOTICE '✅ charges → organization_id, gite_id';
    RAISE NOTICE '✅ retours_menage → organization_id, gite_id';
    RAISE NOTICE '✅ stocks_draps → organization_id, gite_id';
    RAISE NOTICE '✅ infos_pratiques → organization_id, gite_id (si existe)';
    RAISE NOTICE '';
    RAISE NOTICE 'PROCHAINE ÉTAPE:';
    RAISE NOTICE '→ Exécuter 05_create_rls_policies.sql';
    RAISE NOTICE '→ Exécuter 06_migrate_existing_data.sql';
    RAISE NOTICE '';
    RAISE NOTICE 'VÉRIFICATION:';
    RAISE NOTICE '→ SELECT * FROM verify_multi_tenant_columns();';
    RAISE NOTICE '==================================================';
END $$;

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
