-- ================================================================
-- SEED DATA - DONNÉES DE TEST/PRODUCTION INITIALES
-- ================================================================
-- Date: 7 janvier 2026
-- 
-- À exécuter APRÈS 00_reset_and_create_clean.sql
-- 
-- Ce script crée:
-- 1. Votre organization "Gîtes Le Rive Droite"
-- 2. Vos 2 gîtes (Le Rive Droite + Trevoux)
-- 3. Votre compte owner
-- 4. Config iCal
-- 5. Besoins draps par gîte
-- 6. Quelques données de test optionnelles
-- ================================================================

-- ================================================================
-- ÉTAPE 1: CRÉER L'ORGANIZATION
-- ================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_gite_rive_droite_id UUID;
    v_gite_trevoux_id UUID;
    v_user_id UUID;
BEGIN
    RAISE NOTICE '🏢 CRÉATION ORGANIZATION...';
    
    -- Créer organization
    INSERT INTO organizations (
        name,
        slug,
        email,
        phone,
        subscription_status,
        subscription_plan
    ) VALUES (
        'Gîtes Le Rive Droite',
        'gites-rive-droite',
        'gite.lerivedroite@hotmail.com',
        '0744857051',
        'active',
        'basic'
    ) RETURNING id INTO v_org_id;
    
    RAISE NOTICE '✅ Organization créée: %', v_org_id;
    
    -- ================================================================
    -- ÉTAPE 2: CRÉER LES 2 GÎTES
    -- ================================================================
    
    RAISE NOTICE '🏠 CRÉATION GÎTES...';
    
    -- Gîte 1: Le Rive Droite (ex-Couzon)
    INSERT INTO gites (
        organization_id,
        name,
        slug,
        description,
        address,
        capacity,
        bedrooms,
        bathrooms,
        icon,
        color,
        latitude,
        longitude,
        ical_sources,
        settings
    ) VALUES (
        v_org_id,
        'Le Rive Droite',
        'le-rive-droite',
        'Gîte spacieux avec vue sur le fleuve',
        'Couzon-au-Mont-d''Or, France',
        7,
        3,
        2,
        'house',
        '#f093fb',
        45.8436,
        4.8364,
        jsonb_build_object(
            'airbnb', 'https://www.airbnb.fr/calendar/ical/35569364.ics?s=b8cc8c88d80b26b3cbd67e4e14d37f47',
            'booking', 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=ea3e39f7-f37f-43e6-b04f-1e18f30b0e3c',
            'abritel', 'https://www.abritel.fr/ical/ha678656.ics?s=61f16caa65be7e11cc8fcb3a16b94b23'
        ),
        jsonb_build_object(
            'linen_needs', jsonb_build_object(
                'flat_sheet_large', 4,
                'flat_sheet_small', 3,
                'duvet_cover_large', 4,
                'duvet_cover_small', 3,
                'pillowcase', 11,
                'towel', 11,
                'bath_mat', 2
            ),
            'check_in_time', '16:00',
            'check_out_time', '10:00'
        )
    ) RETURNING id INTO v_gite_rive_droite_id;
    
    RAISE NOTICE '✅ Gîte "Le Rive Droite" créé: %', v_gite_rive_droite_id;
    
    -- Gîte 2: Trevoux (ancien Trévoux, normalisé)
    INSERT INTO gites (
        organization_id,
        name,
        slug,
        description,
        address,
        capacity,
        bedrooms,
        bathrooms,
        icon,
        color,
        latitude,
        longitude,
        ical_sources,
        settings
    ) VALUES (
        v_org_id,
        'Trevoux',
        'trevoux',
        'Gîte confortable au cœur de la ville historique',
        'Trévoux, France',
        9,
        4,
        2,
        'castle',
        '#667eea',
        45.9417,
        4.7722,
        jsonb_build_object(
            'airbnb', 'https://www.airbnb.fr/calendar/ical/1081966851806668119.ics?s=ee06cc59a58cae2b3d4ee7c0aad1c0e2',
            'booking', 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=cc00b0e7-5e38-4a8c-980a-de1f0b2eebbf',
            'abritel', 'https://www.abritel.fr/ical/ha2578074.ics?s=da02c13ada0a02ec0502de9de6a8b2d0'
        ),
        jsonb_build_object(
            'linen_needs', jsonb_build_object(
                'flat_sheet_large', 6,
                'flat_sheet_small', 3,
                'duvet_cover_large', 6,
                'duvet_cover_small', 3,
                'pillowcase', 15,
                'towel', 15,
                'bath_mat', 3
            ),
            'check_in_time', '16:00',
            'check_out_time', '10:00'
        )
    ) RETURNING id INTO v_gite_trevoux_id;
    
    RAISE NOTICE '✅ Gîte "Trevoux" créé: %', v_gite_trevoux_id;
    
    -- ================================================================
    -- ÉTAPE 3: CRÉER VOTRE COMPTE OWNER
    -- ================================================================
    
    RAISE NOTICE '👤 LIAISON COMPTE UTILISATEUR...';
    
    -- Récupérer le premier utilisateur dans auth.users
    -- ⚠️  IMPORTANT: Si tu as déjà un compte Supabase, remplace par ton UUID
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO organization_members (
            organization_id,
            user_id,
            role,
            permissions,
            accepted_at
        ) VALUES (
            v_org_id,
            v_user_id,
            'owner',
            jsonb_build_object(
                'view_all', true,
                'edit_all', true,
                'delete_all', true,
                'manage_members', true,
                'manage_billing', true
            ),
            NOW()
        );
        
        RAISE NOTICE '✅ Compte owner créé pour user: %', v_user_id;
    ELSE
        RAISE WARNING '⚠️  Aucun utilisateur trouvé dans auth.users';
        RAISE NOTICE '   → Crée un compte via Supabase Auth Dashboard';
        RAISE NOTICE '   → Puis exécute manuellement:';
        RAISE NOTICE '   INSERT INTO organization_members (organization_id, user_id, role)';
        RAISE NOTICE '   VALUES (''%'', ''TON_USER_UUID'', ''owner'');', v_org_id;
    END IF;
    
    -- ================================================================
    -- ÉTAPE 4: STOCKS DRAPS INITIAUX
    -- ================================================================
    
    RAISE NOTICE '🛏️  INITIALISATION STOCKS DRAPS...';
    
    -- Stocks Le Rive Droite
    INSERT INTO linen_stocks (organization_id, gite_id, item_type, quantity, min_quantity) VALUES
    (v_org_id, v_gite_rive_droite_id, 'flat_sheet_large', 12, 4),
    (v_org_id, v_gite_rive_droite_id, 'flat_sheet_small', 9, 3),
    (v_org_id, v_gite_rive_droite_id, 'duvet_cover_large', 12, 4),
    (v_org_id, v_gite_rive_droite_id, 'duvet_cover_small', 9, 3),
    (v_org_id, v_gite_rive_droite_id, 'pillowcase', 33, 11),
    (v_org_id, v_gite_rive_droite_id, 'towel', 33, 11),
    (v_org_id, v_gite_rive_droite_id, 'bath_mat', 6, 2);
    
    -- Stocks Trevoux
    INSERT INTO linen_stocks (organization_id, gite_id, item_type, quantity, min_quantity) VALUES
    (v_org_id, v_gite_trevoux_id, 'flat_sheet_large', 18, 6),
    (v_org_id, v_gite_trevoux_id, 'flat_sheet_small', 9, 3),
    (v_org_id, v_gite_trevoux_id, 'duvet_cover_large', 18, 6),
    (v_org_id, v_gite_trevoux_id, 'duvet_cover_small', 9, 3),
    (v_org_id, v_gite_trevoux_id, 'pillowcase', 45, 15),
    (v_org_id, v_gite_trevoux_id, 'towel', 45, 15),
    (v_org_id, v_gite_trevoux_id, 'bath_mat', 9, 3);
    
    RAISE NOTICE '✅ Stocks draps initialisés (14 lignes)';
    
    -- ================================================================
    -- ÉTAPE 5: INFOS PRATIQUES EXEMPLE (OPTIONNEL)
    -- ================================================================
    
    RAISE NOTICE '📝 CRÉATION INFOS PRATIQUES...';
    
    INSERT INTO practical_info (organization_id, gite_id, info_type, title, content, icon, display_order) VALUES
    (v_org_id, NULL, 'wifi', 'Code WiFi', 'Réseau: GiteWelcome\nMot de passe: Welcome2024!', 'wifi', 1),
    (v_org_id, v_gite_rive_droite_id, 'access', 'Accès au gîte', 'Boîte à clés à gauche de la porte. Code: 1234', 'key', 2),
    (v_org_id, v_gite_trevoux_id, 'access', 'Accès au gîte', 'Clé dans le pot de fleurs à droite', 'key', 2),
    (v_org_id, NULL, 'trash', 'Poubelles', 'Collecte le mardi matin. Sortir la veille au soir.', 'trash', 5),
    (v_org_id, NULL, 'emergency', 'Urgences', 'Propriétaire: 07 44 85 70 51\nPompiers: 18\nSAMU: 15', 'phone', 10);
    
    RAISE NOTICE '✅ Infos pratiques créées (5 exemples)';
    
    -- ================================================================
    -- RÉSUMÉ FINAL
    -- ================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ SEED DATA CRÉÉ AVEC SUCCÈS';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
    RAISE NOTICE '🏢 Organization: Gîtes Le Rive Droite';
    RAISE NOTICE '   ID: %', v_org_id;
    RAISE NOTICE '   Email: gite.lerivedroite@hotmail.com';
    RAISE NOTICE '';
    RAISE NOTICE '🏠 Gîtes créés: 2';
    RAISE NOTICE '   1. Le Rive Droite (% - %)', v_gite_rive_droite_id, 'le-rive-droite';
    RAISE NOTICE '   2. Trevoux (% - %)', v_gite_trevoux_id, 'trevoux';
    RAISE NOTICE '';
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE '👤 Compte owner: %', v_user_id;
    ELSE
        RAISE NOTICE '⚠️  IMPORTANT: Lier manuellement ton user UUID';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE '🛏️  Stocks draps: 14 types configurés';
    RAISE NOTICE '📝 Infos pratiques: 5 exemples';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PROCHAINE ÉTAPE:';
    RAISE NOTICE '   1. Connecte-toi au site avec ton compte Supabase';
    RAISE NOTICE '   2. Synchronise les calendriers iCal';
    RAISE NOTICE '   3. Les réservations s''importeront automatiquement';
    RAISE NOTICE '==================================================';
    
END $$;
