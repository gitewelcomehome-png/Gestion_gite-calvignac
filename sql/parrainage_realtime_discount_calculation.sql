-- =====================================================
-- FONCTION : Calculer la réduction en temps réel avec bonus campagne
-- Applique automatiquement le bon taux selon les campagnes actives
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_current_discount(p_user_id UUID)
RETURNS TABLE (
    discount_pct DECIMAL(5,2),
    points_earned INT,
    active_referrals INT,
    campaign_name TEXT,
    campaign_bonus TEXT
) AS $$
DECLARE
    v_active_count INT;
    v_subscription_type VARCHAR(20);
    v_discount DECIMAL(5,2) := 0;
    v_points INT := 0;
    v_discount_per_referral DECIMAL(5,2) := 5.0; -- Base: 5% par filleul
    v_campaign_active BOOLEAN := FALSE;
    v_campaign_name TEXT := '';
    v_campaign_bonus TEXT := '';
    active_campaign RECORD;
BEGIN
    -- Compter les filleuls actifs
    SELECT COUNT(*) INTO v_active_count
    FROM referrals
    WHERE referrer_id = p_user_id
        AND status = 'active'
        AND is_currently_paying = true;
    
    -- Type d'abonnement
    SELECT subscription_type INTO v_subscription_type
    FROM user_settings
    WHERE user_id = p_user_id;
    
    IF v_subscription_type IS NULL THEN
        v_subscription_type := 'standard';
    END IF;
    
    -- 🎁 VÉRIFIER LES CAMPAGNES ACTIVES
    FOR active_campaign IN
        SELECT 
            rc.name,
            rc.bonus_type,
            rc.discount_pct_bonus,
            rc.discount_fixed_bonus,
            rc.points_multiplier,
            rc.points_fixed_bonus
        FROM user_campaign_participations ucp
        JOIN referral_campaigns rc ON rc.id = ucp.campaign_id
        WHERE ucp.user_id = p_user_id
            AND ucp.is_active = true
            AND rc.is_active = true
            AND NOW() BETWEEN rc.start_date AND rc.end_date
        LIMIT 1 -- Prendre la première campagne active
    LOOP
        v_campaign_active := TRUE;
        v_campaign_name := active_campaign.name;
        
        -- Appliquer le bonus selon le type
        CASE active_campaign.bonus_type
            WHEN 'discount_multiplier' THEN
                -- Ex: 10% au lieu de 5% par filleul
                v_discount_per_referral := active_campaign.discount_pct_bonus;
                v_campaign_bonus := active_campaign.discount_pct_bonus::TEXT || '% par filleul (au lieu de 5%)';
                
            WHEN 'discount_fixed' THEN
                -- Ex: +20% bonus fixe
                v_campaign_bonus := '+' || active_campaign.discount_fixed_bonus::TEXT || '% bonus';
                
            WHEN 'points_multiplier' THEN
                -- Ex: x3 points
                v_campaign_bonus := 'x' || active_campaign.points_multiplier::TEXT || ' points';
                
            WHEN 'points_fixed' THEN
                -- Ex: +500 points
                v_campaign_bonus := '+' || active_campaign.points_fixed_bonus::TEXT || ' points';
        END CASE;
    END LOOP;
    
    -- 📊 CALCULER LA RÉDUCTION/POINTS SELON LE TYPE
    IF v_subscription_type = 'standard' THEN
        -- Système de réduction
        v_discount := LEAST(v_active_count * v_discount_per_referral, 100.0);
        
        -- Ajouter bonus fixe si applicable
        FOR active_campaign IN
            SELECT rc.discount_fixed_bonus
            FROM user_campaign_participations ucp
            JOIN referral_campaigns rc ON rc.id = ucp.campaign_id
            WHERE ucp.user_id = p_user_id
                AND ucp.is_active = true
                AND rc.is_active = true
                AND rc.bonus_type = 'discount_fixed'
                AND NOW() BETWEEN rc.start_date AND rc.end_date
        LOOP
            v_discount := LEAST(v_discount + active_campaign.discount_fixed_bonus, 100.0);
        END LOOP;
        
        v_points := 0;
        
    ELSE
        -- Système de points (Gîtes de France)
        v_points := v_active_count * 100; -- Base: 100 points par filleul
        
        -- Appliquer multiplicateur si applicable
        FOR active_campaign IN
            SELECT rc.points_multiplier
            FROM user_campaign_participations ucp
            JOIN referral_campaigns rc ON rc.id = ucp.campaign_id
            WHERE ucp.user_id = p_user_id
                AND ucp.is_active = true
                AND rc.is_active = true
                AND rc.bonus_type = 'points_multiplier'
                AND NOW() BETWEEN rc.start_date AND rc.end_date
        LOOP
            v_points := (v_active_count * 100 * active_campaign.points_multiplier)::INT;
        END LOOP;
        
        -- Ajouter points fixes si applicable
        FOR active_campaign IN
            SELECT rc.points_fixed_bonus
            FROM user_campaign_participations ucp
            JOIN referral_campaigns rc ON rc.id = ucp.campaign_id
            WHERE ucp.user_id = p_user_id
                AND ucp.is_active = true
                AND rc.is_active = true
                AND rc.bonus_type = 'points_fixed'
                AND NOW() BETWEEN rc.start_date AND rc.end_date
        LOOP
            v_points := v_points + active_campaign.points_fixed_bonus;
        END LOOP;
        
        v_discount := 0;
    END IF;
    
    -- Retourner le résultat
    RETURN QUERY SELECT 
        v_discount,
        v_points,
        v_active_count,
        NULLIF(v_campaign_name, ''),
        NULLIF(v_campaign_bonus, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION : Calculer le prix après réduction
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_subscription_price(p_user_id UUID)
RETURNS TABLE (
    base_price DECIMAL(10,2),
    discount_pct DECIMAL(5,2),
    final_price DECIMAL(10,2),
    total_saved DECIMAL(10,2),
    campaign_info TEXT
) AS $$
DECLARE
    v_base_price DECIMAL(10,2) := 29.00; -- Prix de base
    v_discount_pct DECIMAL(5,2);
    v_campaign_name TEXT;
    v_campaign_bonus TEXT;
BEGIN
    -- Récupérer la réduction actuelle
    SELECT d.discount_pct, d.campaign_name, d.campaign_bonus
    INTO v_discount_pct, v_campaign_name, v_campaign_bonus
    FROM get_user_current_discount(p_user_id) d;
    
    -- Calculer le prix final
    RETURN QUERY SELECT 
        v_base_price,
        v_discount_pct,
        ROUND(v_base_price * (100 - v_discount_pct) / 100, 2) AS final_price,
        ROUND(v_base_price * v_discount_pct / 100, 2) AS total_saved,
        CASE 
            WHEN v_campaign_name IS NOT NULL THEN 
                '🎁 ' || v_campaign_name || ' : ' || v_campaign_bonus
            ELSE NULL
        END AS campaign_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTS
-- =====================================================

-- Test avec votre user_id (remplacez par votre vrai ID)
-- SELECT * FROM get_user_current_discount('VOTRE_USER_ID');
-- SELECT * FROM get_user_subscription_price('VOTRE_USER_ID');

-- =====================================================
-- MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Fonctions de calcul temps réel créées';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Fonctions disponibles :';
    RAISE NOTICE '  - get_user_current_discount(user_id) : Calcul réduction/points avec bonus';
    RAISE NOTICE '  - get_user_subscription_price(user_id) : Prix abonnement après réduction';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Le système applique maintenant:';
    RAISE NOTICE '  - 10%% par filleul pendant "Double Bonus Février 2026"';
    RAISE NOTICE '  - 5%% par filleul en temps normal';
    RAISE NOTICE '  - Vérification automatique des dates de campagne';
    RAISE NOTICE '';
    RAISE NOTICE '⏰ Après la fin de la campagne, retour automatique au taux normal';
END $$;
