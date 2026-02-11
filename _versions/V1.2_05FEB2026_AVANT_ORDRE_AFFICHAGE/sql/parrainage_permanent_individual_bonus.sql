-- =====================================================
-- AJOUTER TAUX DE BONUS INDIVIDUEL PAR FILLEUL
-- Chaque filleul garde son taux d'acquisition (5% ou 10%)
-- =====================================================

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' 
        AND column_name = 'bonus_rate_pct'
    ) THEN
        -- Ajouter la colonne pour stocker le taux individuel
        ALTER TABLE referrals 
        ADD COLUMN bonus_rate_pct DECIMAL(5,2) DEFAULT 5.0;
        
        RAISE NOTICE 'Colonne bonus_rate_pct ajoutée';
    ELSE
        RAISE NOTICE 'Colonne bonus_rate_pct existe déjà';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' 
        AND column_name = 'acquired_campaign_id'
    ) THEN
        -- Ajouter la référence à la campagne d'acquisition
        ALTER TABLE referrals 
        ADD COLUMN acquired_campaign_id UUID REFERENCES referral_campaigns(id);
        
        RAISE NOTICE 'Colonne acquired_campaign_id ajoutée';
    ELSE
        RAISE NOTICE 'Colonne acquired_campaign_id existe déjà';
    END IF;
END $$;

-- Mettre à jour les filleuls existants avec le taux standard
UPDATE referrals 
SET bonus_rate_pct = 5.0 
WHERE bonus_rate_pct IS NULL;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_referrals_bonus_rate 
ON referrals(referrer_id, status, is_currently_paying, bonus_rate_pct);

-- =====================================================
-- FONCTION : Calculer la réduction en sommant les taux individuels
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_current_discount_v2(p_user_id UUID)
RETURNS TABLE (
    discount_pct DECIMAL(5,2),
    points_earned INT,
    active_referrals INT,
    referrals_at_10pct INT,
    referrals_at_5pct INT,
    campaign_bonus_info TEXT
) AS $$
DECLARE
    v_subscription_type VARCHAR(20);
    v_discount DECIMAL(5,2) := 0;
    v_points INT := 0;
    v_active_count INT := 0;
    v_count_10pct INT := 0;
    v_count_5pct INT := 0;
    v_campaign_info TEXT := '';
BEGIN
    -- Type d'abonnement
    SELECT subscription_type INTO v_subscription_type
    FROM user_settings
    WHERE user_id = p_user_id;
    
    IF v_subscription_type IS NULL THEN
        v_subscription_type := 'standard';
    END IF;
    
    -- 📊 COMPTER ET SOMMER LES FILLEULS PAR TAUX
    IF v_subscription_type = 'standard' THEN
        -- Système de réduction : SOMME des taux individuels
        
        -- Compter les filleuls à 10%
        SELECT COUNT(*), COALESCE(SUM(bonus_rate_pct), 0)
        INTO v_count_10pct, v_discount
        FROM referrals
        WHERE referrer_id = p_user_id
            AND status = 'active'
            AND is_currently_paying = true
            AND bonus_rate_pct >= 10.0;
        
        -- Ajouter les filleuls à 5%
        DECLARE
            v_discount_5pct DECIMAL(5,2);
        BEGIN
            SELECT COUNT(*), COALESCE(SUM(bonus_rate_pct), 0)
            INTO v_count_5pct, v_discount_5pct
            FROM referrals
            WHERE referrer_id = p_user_id
                AND status = 'active'
                AND is_currently_paying = true
                AND bonus_rate_pct < 10.0;
            
            v_discount := v_discount + v_discount_5pct;
        END;
        
        -- Limiter à 100%
        v_discount := LEAST(v_discount, 100.0);
        
        v_active_count := v_count_10pct + v_count_5pct;
        v_points := 0;
        
        -- Message informatif
        IF v_count_10pct > 0 THEN
            v_campaign_info := v_count_10pct::TEXT || ' filleul' || 
                CASE WHEN v_count_10pct > 1 THEN 's' ELSE '' END || 
                ' à 10% (campagne)';
        END IF;
        
    ELSE
        -- Système de points (Gîtes de France)
        -- Pour l'instant, reste à 100 pts par filleul
        -- Peut être étendu plus tard si besoin
        
        SELECT COUNT(*) INTO v_active_count
        FROM referrals
        WHERE referrer_id = p_user_id
            AND status = 'active'
            AND is_currently_paying = true;
        
        v_points := v_active_count * 100;
        v_discount := 0;
    END IF;
    
    -- Retourner le résultat
    RETURN QUERY SELECT 
        v_discount,
        v_points,
        v_active_count,
        v_count_10pct,
        v_count_5pct,
        NULLIF(v_campaign_info, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION : Calculer le prix avec le nouveau système
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_subscription_price_v2(p_user_id UUID)
RETURNS TABLE (
    base_price DECIMAL(10,2),
    discount_pct DECIMAL(5,2),
    final_price DECIMAL(10,2),
    total_saved DECIMAL(10,2),
    active_referrals INT,
    referrals_10pct INT,
    referrals_5pct INT,
    bonus_info TEXT
) AS $$
DECLARE
    v_base_price DECIMAL(10,2) := 29.00;
    v_discount_pct DECIMAL(5,2);
    v_active_count INT;
    v_count_10pct INT;
    v_count_5pct INT;
    v_bonus_info TEXT;
BEGIN
    -- Récupérer la réduction actuelle
    SELECT d.discount_pct, d.active_referrals, d.referrals_at_10pct, d.referrals_at_5pct, d.campaign_bonus_info
    INTO v_discount_pct, v_active_count, v_count_10pct, v_count_5pct, v_bonus_info
    FROM get_user_current_discount_v2(p_user_id) d;
    
    -- Calculer le prix final
    RETURN QUERY SELECT 
        v_base_price,
        v_discount_pct,
        ROUND(v_base_price * (100 - v_discount_pct) / 100, 2) AS final_price,
        ROUND(v_base_price * v_discount_pct / 100, 2) AS total_saved,
        v_active_count,
        v_count_10pct,
        v_count_5pct,
        v_bonus_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION : Détecter et appliquer le bonus à l'inscription
-- À appeler lors de la création d'un filleul
-- =====================================================

CREATE OR REPLACE FUNCTION apply_referral_campaign_bonus(
    p_referrer_id UUID,
    p_referred_user_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_bonus_rate DECIMAL(5,2) := 5.0; -- Taux par défaut
    v_campaign_id UUID := NULL;
    active_campaign RECORD;
BEGIN
    -- Chercher une campagne active pour le parrain
    FOR active_campaign IN
        SELECT 
            rc.id,
            rc.discount_pct_bonus
        FROM user_campaign_participations ucp
        JOIN referral_campaigns rc ON rc.id = ucp.campaign_id
        WHERE ucp.user_id = p_referrer_id
            AND ucp.is_active = true
            AND rc.is_active = true
            AND rc.bonus_type = 'discount_multiplier'
            AND NOW() BETWEEN rc.start_date AND rc.end_date
        LIMIT 1
    LOOP
        v_bonus_rate := active_campaign.discount_pct_bonus;
        v_campaign_id := active_campaign.id;
    END LOOP;
    
    -- Mettre à jour le filleul avec son taux permanent
    UPDATE referrals
    SET bonus_rate_pct = v_bonus_rate,
        acquired_campaign_id = v_campaign_id
    WHERE referred_user_id = p_referred_user_id
        AND referrer_id = p_referrer_id;
    
    RETURN v_bonus_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER : Appliquer automatiquement le bonus
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_apply_campaign_bonus()
RETURNS TRIGGER AS $$
BEGIN
    -- Appliquer le bonus à l'inscription
    NEW.bonus_rate_pct := apply_referral_campaign_bonus(NEW.referrer_id, NEW.referred_user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_insert_referral_apply_bonus ON referrals;

CREATE TRIGGER before_insert_referral_apply_bonus
    BEFORE INSERT ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_apply_campaign_bonus();

-- =====================================================
-- TESTS
-- =====================================================

-- Afficher les filleuls avec leur taux individuel
SELECT 
    referrer_id,
    referred_user_id,
    referred_email,
    status,
    is_currently_paying,
    bonus_rate_pct,
    acquired_campaign_id,
    created_at
FROM referrals
ORDER BY referrer_id, created_at DESC;

-- =====================================================
-- MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Système de bonus individuel par filleul implémenté';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Nouvelles colonnes :';
    RAISE NOTICE '  - bonus_rate_pct : Taux permanent du filleul (5 ou 10)';
    RAISE NOTICE '  - acquired_campaign_id : Campagne active lors de l''inscription';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Fonctionnement :';
    RAISE NOTICE '  - Filleul acquis PENDANT campagne = 10%% tant qu''il paie';
    RAISE NOTICE '  - Filleul acquis HORS campagne = 5%% tant qu''il paie';
    RAISE NOTICE '  - Si filleul arrête = perte de sa contribution';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Le bonus est appliqué automatiquement à l''inscription';
    RAISE NOTICE '';
    RAISE NOTICE '📈 Calcul : SOMME des taux individuels des filleuls actifs';
    RAISE NOTICE '  Exemple : 2×5%% + 3×10%% = 40%% total';
END $$;
