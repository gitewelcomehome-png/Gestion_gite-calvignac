-- ================================================================
-- SCRIPT DE VÉRIFICATION POST-MIGRATION
-- ================================================================
-- Exécute ce script dans SQL Editor après avoir créé le nouveau projet
-- pour vérifier que tout est correct
-- ================================================================

-- ================================================================
-- TEST 1: Vérifier que toutes les tables existent
-- ================================================================

DO $$
DECLARE
    v_tables TEXT[] := ARRAY[
        'gites',
        'reservations',
        'charges',
        'retours_menage',
        'stocks_draps',
        'infos_pratiques'
    ];
    v_table TEXT;
    v_exists BOOLEAN;
    v_missing INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'TEST 1: VÉRIFICATION DES TABLES';
    RAISE NOTICE '==================================================';
    
    FOREACH v_table IN ARRAY v_tables LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = v_table
        ) INTO v_exists;
        
        IF v_exists THEN
            RAISE NOTICE '✅ Table % existe', v_table;
        ELSE
            RAISE NOTICE '❌ Table % MANQUANTE', v_table;
            v_missing := v_missing + 1;
        END IF;
    END LOOP;
    
    IF v_missing > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ %/% tables manquantes', v_missing, array_length(v_tables, 1);
        RAISE NOTICE '→ Réexécute le script nouveau_projet_supabase.sql';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ Toutes les tables sont créées';
    END IF;
END $$;

-- ================================================================
-- TEST 2: Vérifier les colonnes critiques de GITES
-- ================================================================

DO $$
DECLARE
    v_columns TEXT[] := ARRAY[
        'id',
        'owner_user_id',
        'name',
        'slug',
        'tarifs_calendrier',
        'regles_tarifaires',
        'display_order',
        'is_active'
    ];
    v_column TEXT;
    v_exists BOOLEAN;
    v_missing INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'TEST 2: VÉRIFICATION COLONNES GITES';
    RAISE NOTICE '==================================================';
    
    FOREACH v_column IN ARRAY v_columns LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'gites' AND column_name = v_column
        ) INTO v_exists;
        
        IF v_exists THEN
            RAISE NOTICE '✅ Colonne gites.% existe', v_column;
        ELSE
            RAISE NOTICE '❌ Colonne gites.% MANQUANTE', v_column;
            v_missing := v_missing + 1;
        END IF;
    END LOOP;
    
    IF v_missing > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ %/% colonnes manquantes', v_missing, array_length(v_columns, 1);
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ Toutes les colonnes critiques existent';
    END IF;
END $$;

-- ================================================================
-- TEST 3: Vérifier que RLS est activé
-- ================================================================

DO $$
DECLARE
    v_tables TEXT[] := ARRAY[
        'gites',
        'reservations',
        'charges',
        'retours_menage',
        'stocks_draps',
        'infos_pratiques'
    ];
    v_table TEXT;
    v_rls_enabled BOOLEAN;
    v_disabled INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'TEST 3: VÉRIFICATION RLS';
    RAISE NOTICE '==================================================';
    
    FOREACH v_table IN ARRAY v_tables LOOP
        SELECT relrowsecurity INTO v_rls_enabled
        FROM pg_class
        WHERE relname = v_table;
        
        IF v_rls_enabled THEN
            RAISE NOTICE '✅ RLS activé sur %', v_table;
        ELSE
            RAISE NOTICE '❌ RLS DÉSACTIVÉ sur %', v_table;
            v_disabled := v_disabled + 1;
        END IF;
    END LOOP;
    
    IF v_disabled > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ RLS désactivé sur % tables', v_disabled;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ RLS activé sur toutes les tables';
    END IF;
END $$;

-- ================================================================
-- TEST 4: Vérifier les policies RGPD sur GITES
-- ================================================================

DO $$
DECLARE
    v_policies TEXT[] := ARRAY[
        'rgpd_select_own_gites',
        'rgpd_insert_own_gites',
        'rgpd_update_own_gites',
        'rgpd_delete_own_gites'
    ];
    v_policy TEXT;
    v_exists BOOLEAN;
    v_missing INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'TEST 4: VÉRIFICATION POLICIES RGPD';
    RAISE NOTICE '==================================================';
    
    FOREACH v_policy IN ARRAY v_policies LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'gites' AND policyname = v_policy
        ) INTO v_exists;
        
        IF v_exists THEN
            RAISE NOTICE '✅ Policy % existe', v_policy;
        ELSE
            RAISE NOTICE '❌ Policy % MANQUANTE', v_policy;
            v_missing := v_missing + 1;
        END IF;
    END LOOP;
    
    IF v_missing > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ %/4 policies manquantes', v_missing;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ Toutes les policies RGPD sont créées';
    END IF;
END $$;

-- ================================================================
-- TEST 5: Compter les policies par table
-- ================================================================

SELECT 
    tablename,
    COUNT(*) as nb_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ================================================================
-- TEST 6: Détail des colonnes GITES (pour vérification visuelle)
-- ================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'gites'
ORDER BY ordinal_position;

-- ================================================================
-- RÉSUMÉ FINAL
-- ================================================================

DO $$
DECLARE
    v_table_count INT;
    v_gites_columns INT;
    v_rls_count INT;
    v_policies_count INT;
BEGIN
    -- Compter tables
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_name IN ('gites', 'reservations', 'charges', 'retours_menage', 'stocks_draps', 'infos_pratiques');
    
    -- Compter colonnes gites
    SELECT COUNT(*) INTO v_gites_columns
    FROM information_schema.columns
    WHERE table_name = 'gites';
    
    -- Compter tables avec RLS
    SELECT COUNT(*) INTO v_rls_count
    FROM pg_class
    WHERE relname IN ('gites', 'reservations', 'charges', 'retours_menage', 'stocks_draps', 'infos_pratiques')
    AND relrowsecurity = true;
    
    -- Compter policies sur gites
    SELECT COUNT(*) INTO v_policies_count
    FROM pg_policies
    WHERE tablename = 'gites';
    
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📊 RÉSUMÉ FINAL';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables créées:        %/6', v_table_count;
    RAISE NOTICE 'Colonnes gites:       % (attendu: 21)', v_gites_columns;
    RAISE NOTICE 'Tables avec RLS:      %/6', v_rls_count;
    RAISE NOTICE 'Policies RGPD gites:  % (attendu: 4)', v_policies_count;
    RAISE NOTICE '';
    
    IF v_table_count = 6 AND v_gites_columns >= 20 AND v_rls_count = 6 AND v_policies_count = 4 THEN
        RAISE NOTICE '✅✅✅ MIGRATION RÉUSSIE ✅✅✅';
        RAISE NOTICE '';
        RAISE NOTICE 'Ton nouveau projet est prêt !';
        RAISE NOTICE '';
        RAISE NOTICE 'Prochaines étapes:';
        RAISE NOTICE '1. Mets à jour js/shared-config.js avec les nouvelles clés';
        RAISE NOTICE '2. Connecte-toi avec: stephanecalvignac@hotmail.fr';
        RAISE NOTICE '3. Crée tes gîtes via l''interface';
    ELSE
        RAISE NOTICE '⚠️  MIGRATION INCOMPLÈTE';
        RAISE NOTICE '';
        RAISE NOTICE 'Quelque chose manque. Vérifie les tests ci-dessus.';
    END IF;
    
    RAISE NOTICE '==================================================';
END $$;
