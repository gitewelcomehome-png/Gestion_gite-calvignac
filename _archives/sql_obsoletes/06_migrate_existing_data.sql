-- ================================================================
-- MIGRATION DONNÉES EXISTANTES vers MULTI-TENANT
-- Phase Multi-Tenant - Étape 6
-- ================================================================
-- Date: 7 janvier 2026
-- Description: Migrer toutes les données actuelles vers une 
--              organization par défaut "Gîtes Calvignac"
-- IMPORTANT: BACKUP AVANT EXÉCUTION !
-- ================================================================

-- ================================================================
-- ÉTAPE 0: BACKUP & VÉRIFICATION
-- ================================================================

-- IMPORTANT: Faire un backup complet avant d'exécuter ce script !
-- pg_dump votre_database > backup_avant_migration_$(date +%Y%m%d).sql

-- Vérifier que les tables existent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE EXCEPTION 'Table organizations n''existe pas ! Exécuter scripts 01-03 d''abord.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gites') THEN
        RAISE EXCEPTION 'Table gites n''existe pas ! Exécuter scripts 01-03 d''abord.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members') THEN
        RAISE EXCEPTION 'Table organization_members n''existe pas ! Exécuter scripts 01-03 d''abord.';
    END IF;
    
    RAISE NOTICE 'Vérifications OK - Tables multi-tenant présentes';
END $$;

-- ================================================================
-- ÉTAPE 1: CRÉER ORGANIZATION PAR DÉFAUT
-- ================================================================

-- Variables à personnaliser
DO $$
DECLARE
    v_org_id UUID;
    v_default_gite_id UUID;
    v_owner_user_id UUID := NULL;  -- À remplacer par l'UUID de votre user principal
BEGIN
    -- Vérifier si l'organization existe déjà
    SELECT id INTO v_org_id 
    FROM organizations 
    WHERE slug = 'gites-calvignac';
    
    -- Si elle n'existe pas, la créer
    IF v_org_id IS NULL THEN
        INSERT INTO organizations (
            name,
            slug,
            email,
            phone,
            address,
            city,
            postal_code,
            country,
            plan,
            subscription_status,
            owner_user_id,
            max_gites,
            max_users,
            max_reservations_per_month,
            features
        )
        VALUES (
            'Gîtes Le Rive Droite',
            'gites-rive-droite',
            'gite.lerivedroite@hotmail.com',
            '0744857051',
            '2531 route de Gardelit',
            'Relevant',
            '01990',
            'FR',
            'pro',                         -- Plan PRO pour fonctionnalités complètes
            'active',
            v_owner_user_id,
            10,                            -- Max 10 gîtes (modifiable)
            15,                            -- Max 15 users
            999999,                        -- Réservations illimitées
            '{
                "channel_manager": true,
                "booking_engine": true,
                "multi_currency": true,
                "api_access": true,
                "white_label": false,
                "priority_support": true,
                "custom_domain": false
            }'::jsonb
        )
        RETURNING id INTO v_org_id;
        
        RAISE NOTICE 'Organization créée: % (ID: %)', 'Gîtes Le Rive Droite', v_org_id;
    ELSE
        RAISE NOTICE 'Organization existe déjà: %', v_org_id;
    END IF;
    
    -- Stocker l'ID dans une variable accessible
    -- (utiliser une table temporaire pour passer l'ID entre blocs)
    CREATE TEMP TABLE IF NOT EXISTS migration_context (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    
    INSERT INTO migration_context (key, value)
    VALUES ('default_org_id', v_org_id::TEXT)
    ON CONFLICT (key) DO UPDATE SET value = v_org_id::TEXT;
    
END $$;

-- ================================================================
-- ÉTAPE 2: CRÉER GÎTE PAR DÉFAUT
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_gite_id UUID;
BEGIN
    -- Récupérer l'organization_id
    SELECT value::UUID INTO v_org_id 
    FROM migration_context 
    WHERE key = 'default_org_id';
    
    -- Vérifier si le gîte existe
    SELECT id INTO v_gite_id 
    FROM gites 
    WHERE organization_id = v_org_id 
    AND slug = 'le-rive-droite';
    
    -- Si pas de gîte, les créer
    IF v_gite_id IS NULL THEN
        -- GÎTE 1: Le Rive Droite
        INSERT INTO gites (
            organization_id,
            slug,
            name,
            description,
            property_type,
            max_capacity,
            bedrooms,
            bathrooms,
            address,
            city,
            postal_code,
            country,
            default_price_per_night,
            cleaning_fee,
            deposit_amount,
            is_active,
            is_published
        )
        VALUES (
            v_org_id,
            'le-rive-droite',
            'Le Rive Droite',
            'Gîte Le Rive Droite',
            'gite',
            6,                             -- À ajuster selon capacité réelle
            2,                             -- À ajuster
            1,                             -- À ajuster
            '2531 route de Gardelit',
            'Relevant',
            '01990',
            'FR',
            100.00,                        -- Prix par défaut - à ajuster
            50.00,                         -- Frais ménage - à ajuster
            300.00,                        -- Caution - à ajuster
            true,
            true
        )
        RETURNING id INTO v_gite_id;
        
        RAISE NOTICE 'Gîte créé: % (ID: %)', 'Le Rive Droite', v_gite_id;
        
        -- Stocker l'ID du premier gîte
        INSERT INTO migration_context (key, value)
        VALUES ('default_gite_id', v_gite_id::TEXT)
        ON CONFLICT (key) DO UPDATE SET value = v_gite_id::TEXT;
        
        -- GÎTE 2: Trevoux
        INSERT INTO gites (
            organization_id,
            slug,
            name,
            description,
            property_type,
            max_capacity,
            bedrooms,
            bathrooms,
            address,
            city,
            postal_code,
            country,
            default_price_per_night,
            cleaning_fee,
            deposit_amount,
            is_active,
            is_published
        )
        VALUES (
            v_org_id,
            'trevoux',
            'Trevoux',
            'Gîte Trevoux',
            'gite',
            6,                             -- À ajuster selon capacité réelle
            2,                             -- À ajuster
            1,                             -- À ajuster
            '2531 route de Gardelit',
            'Relevant',
            '01990',
            'FR',
            100.00,                        -- Prix par défaut - à ajuster
            50.00,                         -- Frais ménage - à ajuster
            300.00,                        -- Caution - à ajuster
            true,
            true
        );
        
        RAISE NOTICE 'Gîte créé: %', 'Trevoux';
    ELSE
        RAISE NOTICE 'Gîte existe déjà: %', v_gite_id;
    END IF;
    
    -- Stocker l'ID du gîte
    INSERT INTO migration_context (key, value)
    VALUES ('default_gite_id', v_gite_id::TEXT)
    ON CONFLICT (key) DO UPDATE SET value = v_gite_id::TEXT;
    
END $$;

-- ================================================================
-- ÉTAPE 3: MIGRER LES USERS (user_roles → organization_members)
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_migrated_count INTEGER := 0;
BEGIN
    SELECT value::UUID INTO v_org_id 
    FROM migration_context 
    WHERE key = 'default_org_id';
    
    -- Vérifier si table user_roles existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        
        -- Migrer les users avec mapping des rôles
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            is_active,
            invited_at,
            invitation_accepted_at
        )
        SELECT 
            v_org_id,
            ur.user_id,
            CASE ur.role
                WHEN 'owner' THEN 'owner'
                WHEN 'admin' THEN 'admin'
                WHEN 'cleaner' THEN 'housekeeping'
                ELSE 'viewer'
            END,
            true,
            COALESCE(ur.created_at, NOW()),
            COALESCE(ur.created_at, NOW())
        FROM user_roles ur
        WHERE NOT EXISTS (
            -- Éviter les doublons
            SELECT 1 FROM organization_members om
            WHERE om.user_id = ur.user_id
            AND om.organization_id = v_org_id
        );
        
        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migré % users vers organization_members', v_migrated_count;
        
    ELSE
        RAISE NOTICE 'Table user_roles n''existe pas - migration users ignorée';
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 4: MIGRER LES RÉSERVATIONS
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_gite_id UUID;
    v_migrated_count INTEGER := 0;
BEGIN
    SELECT value::UUID INTO v_org_id FROM migration_context WHERE key = 'default_org_id';
    SELECT value::UUID INTO v_gite_id FROM migration_context WHERE key = 'default_gite_id';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        
        -- Mettre à jour les réservations sans organization_id
        UPDATE reservations
        SET 
            organization_id = v_org_id,
            gite_id = v_gite_id
        WHERE organization_id IS NULL;
        
        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migré % réservations', v_migrated_count;
        
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 5: MIGRER LES CHARGES
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_gite_id UUID;
    v_migrated_count INTEGER := 0;
BEGIN
    SELECT value::UUID INTO v_org_id FROM migration_context WHERE key = 'default_org_id';
    SELECT value::UUID INTO v_gite_id FROM migration_context WHERE key = 'default_gite_id';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'charges') THEN
        
        UPDATE charges
        SET 
            organization_id = v_org_id,
            gite_id = v_gite_id  -- Peut être NULL pour charges globales
        WHERE organization_id IS NULL;
        
        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migré % charges', v_migrated_count;
        
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 6: MIGRER LES RETOURS MÉNAGE
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_gite_id UUID;
    v_migrated_count INTEGER := 0;
BEGIN
    SELECT value::UUID INTO v_org_id FROM migration_context WHERE key = 'default_org_id';
    SELECT value::UUID INTO v_gite_id FROM migration_context WHERE key = 'default_gite_id';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'retours_menage') THEN
        
        UPDATE retours_menage
        SET 
            organization_id = v_org_id,
            gite_id = v_gite_id
        WHERE organization_id IS NULL;
        
        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migré % retours ménage', v_migrated_count;
        
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 7: MIGRER LES STOCKS DRAPS
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_gite_id UUID;
    v_migrated_count INTEGER := 0;
BEGIN
    SELECT value::UUID INTO v_org_id FROM migration_context WHERE key = 'default_org_id';
    SELECT value::UUID INTO v_gite_id FROM migration_context WHERE key = 'default_gite_id';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stocks_draps') THEN
        
        UPDATE stocks_draps
        SET 
            organization_id = v_org_id,
            gite_id = v_gite_id
        WHERE organization_id IS NULL;
        
        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migré % stocks draps', v_migrated_count;
        
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 8: MIGRER INFOS PRATIQUES (si existe)
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_gite_id UUID;
    v_migrated_count INTEGER := 0;
BEGIN
    SELECT value::UUID INTO v_org_id FROM migration_context WHERE key = 'default_org_id';
    SELECT value::UUID INTO v_gite_id FROM migration_context WHERE key = 'default_gite_id';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'infos_pratiques') THEN
        
        UPDATE infos_pratiques
        SET 
            organization_id = v_org_id,
            gite_id = v_gite_id
        WHERE organization_id IS NULL;
        
        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migré % infos pratiques', v_migrated_count;
        
    END IF;
END $$;

-- ================================================================
-- ÉTAPE 9: RENDRE LES COLONNES NOT NULL (sécurité)
-- ================================================================

-- ATTENTION: Ne décommenter qu'après avoir vérifié que TOUTES les données sont migrées

/*
DO $$
BEGIN
    -- Réservations
    IF EXISTS (SELECT 1 FROM reservations WHERE organization_id IS NULL) THEN
        RAISE EXCEPTION 'Des réservations sans organization_id existent encore !';
    ELSE
        ALTER TABLE reservations ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE reservations ALTER COLUMN gite_id SET NOT NULL;
        RAISE NOTICE 'Colonnes reservations → NOT NULL';
    END IF;
    
    -- Charges
    IF EXISTS (SELECT 1 FROM charges WHERE organization_id IS NULL) THEN
        RAISE EXCEPTION 'Des charges sans organization_id existent encore !';
    ELSE
        ALTER TABLE charges ALTER COLUMN organization_id SET NOT NULL;
        -- gite_id peut être NULL (charge globale)
        RAISE NOTICE 'Colonnes charges → NOT NULL';
    END IF;
    
    -- Retours ménage
    IF EXISTS (SELECT 1 FROM retours_menage WHERE organization_id IS NULL) THEN
        RAISE EXCEPTION 'Des retours ménage sans organization_id existent encore !';
    ELSE
        ALTER TABLE retours_menage ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE retours_menage ALTER COLUMN gite_id SET NOT NULL;
        RAISE NOTICE 'Colonnes retours_menage → NOT NULL';
    END IF;
    
    -- Stocks draps
    IF EXISTS (SELECT 1 FROM stocks_draps WHERE organization_id IS NULL) THEN
        RAISE EXCEPTION 'Des stocks draps sans organization_id existent encore !';
    ELSE
        ALTER TABLE stocks_draps ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE stocks_draps ALTER COLUMN gite_id SET NOT NULL;
        RAISE NOTICE 'Colonnes stocks_draps → NOT NULL';
    END IF;
    
END $$;
*/

-- ================================================================
-- ÉTAPE 10: VÉRIFICATION POST-MIGRATION
-- ================================================================

-- Fonction de vérification complète
CREATE OR REPLACE FUNCTION verify_migration()
RETURNS TABLE (
    table_name TEXT,
    total_rows BIGINT,
    migrated_rows BIGINT,
    null_org_rows BIGINT,
    status TEXT
) AS $$
BEGIN
    -- Réservations
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'reservations') THEN
        RETURN QUERY SELECT 
            'reservations'::TEXT,
            COUNT(*)::BIGINT,
            COUNT(*) FILTER (WHERE organization_id IS NOT NULL)::BIGINT,
            COUNT(*) FILTER (WHERE organization_id IS NULL)::BIGINT,
            CASE 
                WHEN COUNT(*) FILTER (WHERE organization_id IS NULL) = 0 THEN '✅ OK'
                ELSE '❌ INCOMPLET'
            END::TEXT
        FROM reservations;
    END IF;
    
    -- Charges
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'charges') THEN
        RETURN QUERY SELECT 
            'charges'::TEXT,
            COUNT(*)::BIGINT,
            COUNT(*) FILTER (WHERE organization_id IS NOT NULL)::BIGINT,
            COUNT(*) FILTER (WHERE organization_id IS NULL)::BIGINT,
            CASE 
                WHEN COUNT(*) FILTER (WHERE organization_id IS NULL) = 0 THEN '✅ OK'
                ELSE '❌ INCOMPLET'
            END::TEXT
        FROM charges;
    END IF;
    
    -- Retours ménage
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'retours_menage') THEN
        RETURN QUERY SELECT 
            'retours_menage'::TEXT,
            COUNT(*)::BIGINT,
            COUNT(*) FILTER (WHERE organization_id IS NOT NULL)::BIGINT,
            COUNT(*) FILTER (WHERE organization_id IS NULL)::BIGINT,
            CASE 
                WHEN COUNT(*) FILTER (WHERE organization_id IS NULL) = 0 THEN '✅ OK'
                ELSE '❌ INCOMPLET'
            END::TEXT
        FROM retours_menage;
    END IF;
    
    -- Stocks draps
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = 'stocks_draps') THEN
        RETURN QUERY SELECT 
            'stocks_draps'::TEXT,
            COUNT(*)::BIGINT,
            COUNT(*) FILTER (WHERE organization_id IS NOT NULL)::BIGINT,
            COUNT(*) FILTER (WHERE organization_id IS NULL)::BIGINT,
            CASE 
                WHEN COUNT(*) FILTER (WHERE organization_id IS NULL) = 0 THEN '✅ OK'
                ELSE '❌ INCOMPLET'
            END::TEXT
        FROM stocks_draps;
    END IF;
    
END;
$$ LANGUAGE plpgsql;

-- Lancer la vérification
SELECT * FROM verify_migration();

-- ================================================================
-- RÉSUMÉ MIGRATION
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_gite_id UUID;
BEGIN
    SELECT value::UUID INTO v_org_id FROM migration_context WHERE key = 'default_org_id';
    SELECT value::UUID INTO v_gite_id FROM migration_context WHERE key = 'default_gite_id';
    
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'MIGRATION MULTI-TENANT TERMINÉE';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Organization créée: %', v_org_id;
    RAISE NOTICE 'Gîte créé: %', v_gite_id;
    RAISE NOTICE '';
    RAISE NOTICE 'VÉRIFICATION:';
    RAISE NOTICE '→ SELECT * FROM verify_migration();';
    RAISE NOTICE '';
    RAISE NOTICE 'PROCHAINES ÉTAPES:';
    RAISE NOTICE '1. Vérifier que toutes les données sont migrées';
    RAISE NOTICE '2. Décommenter ÉTAPE 9 pour rendre colonnes NOT NULL';
    RAISE NOTICE '3. Exécuter 05_create_rls_policies.sql si pas déjà fait';
    RAISE NOTICE '4. Tester l''application avec un user';
    RAISE NOTICE '==================================================';
    
    -- Cleanup
    DROP TABLE IF EXISTS migration_context;
END $$;

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
