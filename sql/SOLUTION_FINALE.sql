-- ================================================================
-- SOLUTION FINALE : Création manuelle du premier compte
-- ================================================================
-- 1. Créer ton compte via Supabase Dashboard → Authentication → Add User
--    OU faire Step 1 de onboarding (juste email/password)
-- 2. Récupérer ton USER_ID ci-dessous
-- 3. Modifier les valeurs
-- 4. Exécuter ce script
-- 5. Te connecter directement sur index.html
-- ================================================================

-- ⚠️ REMPLACE CES VALEURS ⚠️
DO $$
DECLARE
    v_user_id UUID := 'TON-USER-ID-ICI'; -- Remplace par ton user_id
    v_org_name TEXT := 'Mon Entreprise';
    v_org_email TEXT := 'contact@monentreprise.fr';
    v_org_phone TEXT := '+33 6 12 34 56 78';
    v_org_id UUID;
    v_gite1_id UUID;
    v_gite2_id UUID;
BEGIN
    -- 1. Créer organization
    INSERT INTO organizations (id, name, slug, email, phone)
    VALUES (
        gen_random_uuid(),
        v_org_name,
        lower(regexp_replace(v_org_name, '[^a-z0-9]+', '-', 'gi')) || '-' || substr(md5(random()::text), 1, 6),
        v_org_email,
        v_org_phone
    )
    RETURNING id INTO v_org_id;
    
    RAISE NOTICE '✅ Organization créée: %', v_org_id;
    
    -- 2. Créer gîte 1
    INSERT INTO gites (
        id, organization_id, name, slug, 
        icon, color, capacity, address,
        is_active
    ) VALUES (
        gen_random_uuid(),
        v_org_id,
        'Gîte du Lac',
        'gite-du-lac-' || substr(md5(random()::text), 1, 6),
        'chalet',
        '#667eea',
        6,
        '123 Route du Lac, 12345 Village',
        true
    )
    RETURNING id INTO v_gite1_id;
    
    RAISE NOTICE '✅ Gîte 1 créé: %', v_gite1_id;
    
    -- 3. Créer gîte 2
    INSERT INTO gites (
        id, organization_id, name, slug,
        icon, color, capacity, address,
        is_active
    ) VALUES (
        gen_random_uuid(),
        v_org_id,
        'Chalet Montagne',
        'chalet-montagne-' || substr(md5(random()::text), 1, 6),
        'cabin',
        '#48bb78',
        8,
        '456 Chemin des Sommets, 67890 Station',
        true
    )
    RETURNING id INTO v_gite2_id;
    
    RAISE NOTICE '✅ Gîte 2 créé: %', v_gite2_id;
    
    -- 4. Créer member (owner)
    INSERT INTO organization_members (
        id, organization_id, user_id, role
    ) VALUES (
        gen_random_uuid(),
        v_org_id,
        v_user_id,
        'owner'
    );
    
    RAISE NOTICE '✅ Member créé (owner)';
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅✅✅ SETUP TERMINÉ ✅✅✅';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Organization: % (%)', v_org_name, v_org_id;
    RAISE NOTICE '🏠 Gîte 1: Gîte du Lac';
    RAISE NOTICE '🏠 Gîte 2: Chalet Montagne';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PROCHAINE ÉTAPE:';
    RAISE NOTICE '   1. Va sur login.html';
    RAISE NOTICE '   2. Connecte-toi avec ton email/password';
    RAISE NOTICE '   3. Accède au dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Pense à exécuter workaround_enable_rls.sql après';
    RAISE NOTICE '';
    
END $$;
