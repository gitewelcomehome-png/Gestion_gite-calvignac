-- =====================================================
-- SCRIPT DE TEST POUR LE SYSTÈME DE PARRAINAGE
-- =====================================================

-- =====================================================
-- 1. ACTIVER LE PARRAINAGE POUR LE COMPTE ADMIN
-- =====================================================

-- Afficher tous les comptes disponibles
DO $$
DECLARE
    v_user RECORD;
BEGIN
    RAISE NOTICE '📋 COMPTES DISPONIBLES :';
    RAISE NOTICE '========================================';
    FOR v_user IN 
        SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10
    LOOP
        RAISE NOTICE '  - % : %', v_user.email, v_user.id;
    END LOOP;
    RAISE NOTICE '========================================';
END $$;

-- Trouver et activer le premier compte disponible (modifiable)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Option 1: Chercher par email contenant 'admin'
    SELECT id INTO v_user_id
    FROM auth.users 
    WHERE email ILIKE '%admin%'
    LIMIT 1;
    
    -- Option 2: Si pas trouvé, prendre le premier compte
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id
        FROM auth.users 
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun compte utilisateur trouvé. Créez d''abord un compte via l''application.';
    END IF;
    
    -- Créer ou mettre à jour user_settings
    INSERT INTO user_settings (user_id, referral_enabled, subscription_type)
    VALUES (v_user_id, true, 'standard')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        referral_enabled = true,
        subscription_type = 'standard';
    
    RAISE NOTICE '✅ Parrainage activé pour user_id: %', v_user_id;
END $$;

-- Vérifier l'activation
SELECT 
    u.id,
    u.email,
    COALESCE(us.referral_enabled, false) as referral_enabled,
    COALESCE(us.subscription_type, 'non configuré') as subscription_type
FROM auth.users u
LEFT JOIN user_settings us ON us.user_id = u.id
ORDER BY us.referral_enabled DESC NULLS LAST, u.created_at DESC
LIMIT 5;

-- =====================================================
-- 2. CRÉER DES FILLEULS DE TEST
-- =====================================================

-- Récupérer l'ID du compte activé
DO $$
DECLARE
    v_admin_id UUID;
    v_referral_code VARCHAR(8);
    v_filleul_id UUID;
BEGIN
    -- Récupérer l'ID du compte avec parrainage activé
    SELECT us.user_id INTO v_admin_id
    FROM user_settings us
    WHERE us.referral_enabled = true
    ORDER BY us.updated_at DESC
    LIMIT 1;
    
    -- Si pas trouvé, prendre le premier compte
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id
        FROM auth.users
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Aucun compte trouvé. Créez d''abord un compte.';
    END IF;
    
    -- Générer un code de parrainage si pas existant
    SELECT referral_code INTO v_referral_code
    FROM referrals
    WHERE referrer_id = v_admin_id
    LIMIT 1;
    
    IF v_referral_code IS NULL THEN
        v_referral_code := UPPER(SUBSTRING(MD5(v_admin_id::TEXT || NOW()::TEXT) FROM 1 FOR 8));
    END IF;
    
    RAISE NOTICE 'Admin ID: %', v_admin_id;
    RAISE NOTICE 'Code de parrainage: %', v_referral_code;
    
    -- =====================================================
    -- FILLEUL 1 : Actif et payant (génère une réduction)
    -- =====================================================
    INSERT INTO referrals (
        referrer_id,
        referral_code,
        referred_email,
        referred_user_id,
        status,
        is_currently_paying,
        registered_at,
        first_payment_at,
        last_payment_at
    ) VALUES (
        v_admin_id,
        v_referral_code,
        'filleul1-test@example.com',
        NULL, -- Pas de vrai compte utilisateur
        'active',
        true,
        NOW() - INTERVAL '2 months',
        NOW() - INTERVAL '2 months',
        NOW() - INTERVAL '1 day'
    )
    ON CONFLICT DO NOTHING;
    
    -- =====================================================
    -- FILLEUL 2 : Actif et payant
    -- =====================================================
    INSERT INTO referrals (
        referrer_id,
        referral_code,
        referred_email,
        referred_user_id,
        status,
        is_currently_paying,
        registered_at,
        first_payment_at,
        last_payment_at
    ) VALUES (
        v_admin_id,
        v_referral_code,
        'filleul2-test@example.com',
        NULL,
        'active',
        true,
        NOW() - INTERVAL '1 month',
        NOW() - INTERVAL '1 month',
        NOW() - INTERVAL '2 days'
    )
    ON CONFLICT DO NOTHING;
    
    -- =====================================================
    -- FILLEUL 3 : Inscrit mais pas encore payé
    -- =====================================================
    INSERT INTO referrals (
        referrer_id,
        referral_code,
        referred_email,
        referred_user_id,
        status,
        is_currently_paying,
        registered_at,
        first_payment_at,
        last_payment_at
    ) VALUES (
        v_admin_id,
        v_referral_code,
        'filleul3-test@example.com',
        NULL,
        'registered',
        false,
        NOW() - INTERVAL '5 days',
        NULL,
        NULL
    )
    ON CONFLICT DO NOTHING;
    
    -- =====================================================
    -- FILLEUL 4 : Était actif, a arrêté de payer
    -- =====================================================
    INSERT INTO referrals (
        referrer_id,
        referral_code,
        referred_email,
        referred_user_id,
        status,
        is_currently_paying,
        registered_at,
        first_payment_at,
        last_payment_at
    ) VALUES (
        v_admin_id,
        v_referral_code,
        'filleul4-test@example.com',
        NULL,
        'inactive',
        false,
        NOW() - INTERVAL '6 months',
        NOW() - INTERVAL '6 months',
        NOW() - INTERVAL '3 months' -- Dernier paiement il y a 3 mois
    )
    ON CONFLICT DO NOTHING;
    
    -- =====================================================
    -- FILLEUL 5 : En attente (a cliqué sur le lien)
    -- =====================================================
    INSERT INTO referrals (
        referrer_id,
        referral_code,
        referred_email,
        referred_user_id,
        status,
        is_currently_paying,
        registered_at,
        first_payment_at,
        last_payment_at
    ) VALUES (
        v_admin_id,
        v_referral_code,
        'filleul5-test@example.com',
        NULL,
        'pending',
        false,
        NULL,
        NULL,
        NULL
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ 5 filleuls de test créés';
END $$;

-- =====================================================
-- 3. CRÉER DES INVITATIONS DE TEST
-- =====================================================

DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Récupérer l'ID du compte avec parrainage activé
    SELECT us.user_id INTO v_admin_id
    FROM user_settings us
    WHERE us.referral_enabled = true
    ORDER BY us.updated_at DESC
    LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id
        FROM auth.users
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    -- Invitations par email
    INSERT INTO referral_invitations (referrer_id, channel, recipient_email, sent_at)
    VALUES 
        (v_admin_id, 'email', 'test1@example.com', NOW() - INTERVAL '10 days'),
        (v_admin_id, 'email', 'test2@example.com', NOW() - INTERVAL '8 days'),
        (v_admin_id, 'email', 'test3@example.com', NOW() - INTERVAL '6 days');
    
    -- Invitations WhatsApp
    INSERT INTO referral_invitations (referrer_id, channel, sent_at)
    VALUES 
        (v_admin_id, 'whatsapp', NOW() - INTERVAL '5 days'),
        (v_admin_id, 'whatsapp', NOW() - INTERVAL '3 days');
    
    -- Invitations LinkedIn
    INSERT INTO referral_invitations (referrer_id, channel, sent_at)
    VALUES 
        (v_admin_id, 'linkedin', NOW() - INTERVAL '4 days'),
        (v_admin_id, 'linkedin', NOW() - INTERVAL '2 days');
    
    -- Lien copié
    INSERT INTO referral_invitations (referrer_id, channel, sent_at)
    VALUES 
        (v_admin_id, 'copy', NOW() - INTERVAL '1 day');
    
    RAISE NOTICE '✅ Invitations de test créées';
END $$;

-- =====================================================
-- 4. CALCULER LES RÉCOMPENSES
-- =====================================================

SELECT calculate_monthly_referral_rewards();

-- =====================================================
-- 5. VÉRIFIER LES RÉSULTATS
-- =====================================================

-- Stats du parrain
DO $$
DECLARE
    v_admin_id UUID;
    v_stats RECORD;
BEGIN
    -- Récupérer l'ID du compte avec parrainage activé
    SELECT us.user_id INTO v_admin_id
    FROM user_settings us
    WHERE us.referral_enabled = true
    ORDER BY us.updated_at DESC
    LIMIT 1;
    
    SELECT * INTO v_stats
    FROM get_referrer_stats(v_admin_id);
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE '📊 STATISTIQUES DU PARRAIN';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Total filleuls: %', v_stats.total_referrals;
    RAISE NOTICE 'Filleuls actifs: %', v_stats.active_referrals;
    RAISE NOTICE 'Filleuls inscrits: %', v_stats.registered_referrals;
    RAISE NOTICE 'En attente: %', v_stats.pending_referrals;
    RAISE NOTICE 'Total invitations: %', v_stats.total_invitations;
    RAISE NOTICE '-------------------------------------------';
    
    IF v_stats.subscription_type = 'standard' THEN
        RAISE NOTICE '💰 Réduction actuelle: %% %', v_stats.current_discount;
        RAISE NOTICE '📈 Progression: % / 20 filleuls actifs', v_stats.active_referrals;
    ELSE
        RAISE NOTICE '🎁 Points actuels: %', v_stats.current_points;
        RAISE NOTICE '📈 Progression: % / 20 filleuls actifs', v_stats.active_referrals;
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;

-- Liste des filleuls
SELECT 
    r.referred_email as "Email Filleul",
    r.status as "Statut",
    r.is_currently_paying as "Paie Actuellement",
    r.registered_at as "Date Inscription",
    r.first_payment_at as "Premier Paiement",
    r.last_payment_at as "Dernier Paiement",
    CASE 
        WHEN r.status = 'active' AND r.is_currently_paying THEN '✅ Génère récompense'
        WHEN r.status = 'registered' THEN '⏳ En attente 1er paiement'
        WHEN r.status = 'inactive' THEN '❌ Arrêté de payer'
        ELSE '⏸️ Pas encore inscrit'
    END as "Impact"
FROM referrals r
WHERE r.referrer_id = (
    SELECT us.user_id FROM user_settings us
    WHERE us.referral_enabled = true
    ORDER BY us.updated_at DESC
    LIMIT 1
)
ORDER BY r.created_at DESC;

-- Historique des récompenses
SELECT 
    rr.month as "Mois",
    rr.active_referrals_count as "Filleuls Actifs",
    rr.discount_pct as "Réduction %",
    rr.points_earned as "Points Gagnés",
    rr.total_saved as "Montant Économisé"
FROM referral_rewards rr
WHERE rr.user_id = (
    SELECT us.user_id FROM user_settings us
    WHERE us.referral_enabled = true
    ORDER BY us.updated_at DESC
    LIMIT 1
)
ORDER BY rr.month DESC
LIMIT 12;

-- =====================================================
-- MESSAGE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ================================';
    RAISE NOTICE '✅ DONNÉES DE TEST CRÉÉES';
    RAISE NOTICE '✅ ================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Résumé :';
    RAISE NOTICE '  - 2 filleuls actifs et payants (génèrent réduction)';
    RAISE NOTICE '  - 1 filleul inscrit (attend 1er paiement)';
    RAISE NOTICE '  - 1 filleul inactif (a arrêté de payer)';
    RAISE NOTICE '  - 1 filleul en attente (pas encore inscrit)';
    RAISE NOTICE '  - 8 invitations envoyées';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Prochaines étapes :';
    RAISE NOTICE '  1. Connectez-vous avec votre compte admin';
    RAISE NOTICE '  2. Cliquez sur l''onglet "Parrainage"';
    RAISE NOTICE '  3. Vous devriez voir : 2/20 filleuls actifs';
    RAISE NOTICE '  4. Réduction : 10%% (2 x 5%%)';
    RAISE NOTICE '';
END $$;
