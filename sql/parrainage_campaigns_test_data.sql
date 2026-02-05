-- =====================================================
-- DONNÉES DE TEST POUR LES CAMPAGNES DE PARRAINAGE
-- =====================================================

-- Campagne 1 : Double Bonus (Active)
INSERT INTO referral_campaigns (
    name,
    description,
    campaign_code,
    bonus_type,
    discount_pct_bonus,
    start_date,
    end_date,
    is_active,
    is_featured,
    max_uses,
    min_referrals,
    subscription_types
) VALUES (
    'Double Bonus Février 2026',
    'Doublez vos réductions ! Obtenez 10% au lieu de 5% par filleul actif pendant tout le mois de février.',
    'DOUBLE2026',
    'discount_multiplier',
    10.00,
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '25 days',
    true,
    true,
    100,
    0,
    NULL
);

-- Campagne 2 : Boost de démarrage (Active)
INSERT INTO referral_campaigns (
    name,
    description,
    campaign_code,
    bonus_type,
    discount_fixed_bonus,
    start_date,
    end_date,
    is_active,
    is_featured,
    max_uses,
    min_referrals,
    subscription_types
) VALUES (
    'Boost de démarrage',
    'Obtenez 20% de réduction supplémentaire dès le premier filleul actif !',
    'BOOST20',
    'discount_fixed',
    20.00,
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '27 days',
    true,
    true,
    50,
    1,
    ARRAY['standard']
);

-- Campagne 3 : Super Points (Programmée)
INSERT INTO referral_campaigns (
    name,
    description,
    campaign_code,
    bonus_type,
    points_multiplier,
    start_date,
    end_date,
    is_active,
    is_featured,
    min_referrals,
    subscription_types
) VALUES (
    'Super Points Mars',
    'Triplez vos points ! Gagnez 300 points au lieu de 100 par filleul actif.',
    'SUPER3X',
    'points_multiplier',
    3.0,
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '35 days',
    true,
    false,
    0,
    ARRAY['gites_france']
);

-- Campagne 4 : Bonus 500 Points (Expirée)
INSERT INTO referral_campaigns (
    name,
    description,
    campaign_code,
    bonus_type,
    points_fixed_bonus,
    start_date,
    end_date,
    is_active,
    is_featured,
    max_uses,
    current_uses
) VALUES (
    'Bonus 500 Points',
    'Recevez 500 points bonus à chaque nouveau filleul actif !',
    'BONUS500',
    'points_fixed',
    500,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    false,
    false,
    200,
    156
);

-- Campagne 5 : VIP Premium (Active mais complète)
INSERT INTO referral_campaigns (
    name,
    description,
    campaign_code,
    bonus_type,
    discount_fixed_bonus,
    start_date,
    end_date,
    is_active,
    max_uses,
    current_uses,
    min_referrals,
    subscription_types
) VALUES (
    'VIP Premium',
    'Réservé aux meilleurs parrains : 30% de réduction bonus si vous avez déjà 5 filleuls actifs',
    'VIP30',
    'discount_fixed',
    30.00,
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '20 days',
    true,
    20,
    20,
    5,
    ARRAY['standard']
);

-- =====================================================
-- VÉRIFICATION DES CAMPAGNES CRÉÉES
-- =====================================================

SELECT 
    name as "Campagne",
    campaign_code as "Code",
    bonus_type as "Type Bonus",
    COALESCE(discount_pct_bonus::TEXT, 
             discount_fixed_bonus::TEXT, 
             points_multiplier::TEXT, 
             points_fixed_bonus::TEXT) as "Valeur",
    start_date::DATE as "Début",
    end_date::DATE as "Fin",
    CASE
        WHEN NOW() < start_date THEN '🔵 Programmée'
        WHEN NOW() > end_date THEN '⚫ Expirée'
        WHEN max_uses IS NOT NULL AND current_uses >= max_uses THEN '🟡 Complète'
        WHEN is_active THEN '🟢 Active'
        ELSE '🔴 Inactive'
    END as "Statut",
    COALESCE(current_uses, 0) as "Participants",
    max_uses as "Max"
FROM referral_campaigns
ORDER BY 
    CASE 
        WHEN NOW() BETWEEN start_date AND end_date AND is_active THEN 1
        WHEN NOW() < start_date THEN 2
        ELSE 3
    END,
    start_date DESC;

-- =====================================================
-- MESSAGE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ===================================';
    RAISE NOTICE '✅ CAMPAGNES DE TEST CRÉÉES';
    RAISE NOTICE '✅ ===================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 5 campagnes créées :';
    RAISE NOTICE '  🟢 Double Bonus Février (active)';
    RAISE NOTICE '  🟢 Boost de démarrage (active)';
    RAISE NOTICE '  🔵 Super Points Mars (programmée)';
    RAISE NOTICE '  ⚫ Bonus 500 Points (expirée)';
    RAISE NOTICE '  🟡 VIP Premium (complète)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Accédez à l''interface :';
    RAISE NOTICE '  admin-channel-manager.html > Onglet "Parrainage"';
    RAISE NOTICE '  ou directement : pages/admin-parrainage.html';
    RAISE NOTICE '';
END $$;
