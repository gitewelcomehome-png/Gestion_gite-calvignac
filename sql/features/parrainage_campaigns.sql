-- =====================================================
-- SYSTÈME DE CAMPAGNES PROMO PARRAINAGE
-- Permet de créer des promotions temporaires avec :
-- - Taux bonifié (ex: 10% au lieu de 5%)
-- - Points bonus
-- - Période limitée
-- - Conditions d'activation
-- =====================================================

-- Table des campagnes de parrainage
CREATE TABLE IF NOT EXISTS referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Type de bonus
    bonus_type VARCHAR(20) NOT NULL CHECK (bonus_type IN ('discount_multiplier', 'discount_fixed', 'points_multiplier', 'points_fixed')),
    
    -- Valeurs selon le type
    discount_pct_bonus DECIMAL(5,2), -- % bonus par filleul (ex: 10 au lieu de 5)
    discount_fixed_bonus DECIMAL(5,2), -- % fixe bonus (ex: +20% en plus)
    points_multiplier DECIMAL(5,2), -- Multiplicateur de points (ex: 2x)
    points_fixed_bonus INT, -- Points bonus fixes (ex: +500 pts)
    
    -- Période de validité
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    -- Conditions
    min_referrals INT DEFAULT 0, -- Minimum de filleuls pour bénéficier
    max_uses INT, -- Nombre max d'utilisateurs pouvant bénéficier
    current_uses INT DEFAULT 0, -- Compteur d'utilisations
    
    -- Public cible
    subscription_types VARCHAR(50)[], -- ['standard', 'gites_france'] ou NULL = tous
    new_users_only BOOLEAN DEFAULT false, -- Réservé aux nouveaux parrains
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- Mise en avant
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Contraintes
    CONSTRAINT valid_dates CHECK (end_date > start_date),
    CONSTRAINT valid_bonus CHECK (
        (bonus_type = 'discount_multiplier' AND discount_pct_bonus IS NOT NULL) OR
        (bonus_type = 'discount_fixed' AND discount_fixed_bonus IS NOT NULL) OR
        (bonus_type = 'points_multiplier' AND points_multiplier IS NOT NULL) OR
        (bonus_type = 'points_fixed' AND points_fixed_bonus IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_campaigns_active ON referral_campaigns(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON referral_campaigns(start_date, end_date);

-- Table d'association : qui bénéficie de quelle campagne
CREATE TABLE IF NOT EXISTS user_campaign_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES referral_campaigns(id) ON DELETE CASCADE,
    
    -- Statut
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Stats
    referrals_during_campaign INT DEFAULT 0,
    total_bonus_earned DECIMAL(10,2) DEFAULT 0,
    total_points_earned INT DEFAULT 0,
    
    UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_participations_user ON user_campaign_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_campaign ON user_campaign_participations(campaign_id);

-- RLS
ALTER TABLE referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_campaign_participations ENABLE ROW LEVEL SECURITY;

-- Policies pour referral_campaigns
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON referral_campaigns;

CREATE POLICY "Authenticated users can view campaigns"
    ON referral_campaigns FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
    ON referral_campaigns FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
    ON referral_campaigns FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaigns"
    ON referral_campaigns FOR DELETE
    TO authenticated
    USING (true);

-- Policies pour user_campaign_participations
DROP POLICY IF EXISTS "Users can view their participations" ON user_campaign_participations;

CREATE POLICY "Users can view their participations"
    ON user_campaign_participations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their participations"
    ON user_campaign_participations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participations"
    ON user_campaign_participations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FONCTION : Obtenir les campagnes actives pour un utilisateur
-- =====================================================

CREATE OR REPLACE FUNCTION get_active_campaigns_for_user(p_user_id UUID)
RETURNS TABLE (
    campaign_id UUID,
    name VARCHAR(255),
    description TEXT,
    campaign_code VARCHAR(50),
    bonus_type VARCHAR(20),
    discount_pct_bonus DECIMAL(5,2),
    discount_fixed_bonus DECIMAL(5,2),
    points_multiplier DECIMAL(5,2),
    points_fixed_bonus INT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_enrolled BOOLEAN,
    can_enroll BOOLEAN,
    days_remaining INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.id,
        rc.name,
        rc.description,
        rc.campaign_code,
        rc.bonus_type,
        rc.discount_pct_bonus,
        rc.discount_fixed_bonus,
        rc.points_multiplier,
        rc.points_fixed_bonus,
        rc.start_date,
        rc.end_date,
        (ucp.user_id IS NOT NULL) as is_enrolled,
        (
            rc.is_active AND 
            NOW() BETWEEN rc.start_date AND rc.end_date AND
            (rc.max_uses IS NULL OR rc.current_uses < rc.max_uses) AND
            (ucp.user_id IS NULL)
        ) as can_enroll,
        EXTRACT(DAY FROM rc.end_date - NOW())::INT as days_remaining
    FROM referral_campaigns rc
    LEFT JOIN user_campaign_participations ucp 
        ON ucp.campaign_id = rc.id AND ucp.user_id = p_user_id
    LEFT JOIN user_settings us ON us.user_id = p_user_id
    WHERE 
        rc.is_active = true 
        AND NOW() BETWEEN rc.start_date AND rc.end_date
        AND (
            rc.subscription_types IS NULL 
            OR us.subscription_type = ANY(rc.subscription_types)
        )
    ORDER BY rc.is_featured DESC, rc.end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION : Inscrire un utilisateur à une campagne
-- =====================================================

CREATE OR REPLACE FUNCTION enroll_in_campaign(
    p_user_id UUID,
    p_campaign_code VARCHAR(50)
)
RETURNS JSON AS $$
DECLARE
    v_campaign_id UUID;
    v_can_enroll BOOLEAN;
    v_max_uses INT;
    v_current_uses INT;
BEGIN
    -- Vérifier que la campagne existe et est active
    SELECT id, max_uses, current_uses
    INTO v_campaign_id, v_max_uses, v_current_uses
    FROM referral_campaigns
    WHERE campaign_code = p_campaign_code
        AND is_active = true
        AND NOW() BETWEEN start_date AND end_date;
    
    IF v_campaign_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Campagne introuvable ou expirée'
        );
    END IF;
    
    -- Vérifier la limite d'utilisations
    IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Campagne complète'
        );
    END IF;
    
    -- Vérifier que l'utilisateur n'est pas déjà inscrit
    IF EXISTS (
        SELECT 1 FROM user_campaign_participations
        WHERE user_id = p_user_id AND campaign_id = v_campaign_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Vous êtes déjà inscrit à cette campagne'
        );
    END IF;
    
    -- Inscription
    INSERT INTO user_campaign_participations (user_id, campaign_id)
    VALUES (p_user_id, v_campaign_id);
    
    -- Incrémenter le compteur
    UPDATE referral_campaigns
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = v_campaign_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Inscription réussie !',
        'campaign_id', v_campaign_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION MODIFIÉE : Calculer les récompenses avec campagnes
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_monthly_referral_rewards_with_campaigns()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    active_count INT;
    subscription_type_val VARCHAR(20);
    discount DECIMAL(5,2);
    points INT;
    base_monthly_price DECIMAL(10,2) := 29.00;
    total_saved DECIMAL(10,2);
    current_month DATE := DATE_TRUNC('month', NOW());
    
    -- Variables campagnes
    campaign_bonus DECIMAL(5,2) := 0;
    campaign_points INT := 0;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT r.referrer_id 
        FROM referrals r
        WHERE r.status = 'active' AND r.is_currently_paying = true
    LOOP
        -- Compter les filleuls actifs
        SELECT COUNT(*) INTO active_count
        FROM referrals
        WHERE referrer_id = user_record.referrer_id
            AND status = 'active'
            AND is_currently_paying = true;
        
        -- Type d'abonnement
        SELECT subscription_type INTO subscription_type_val
        FROM user_settings
        WHERE user_id = user_record.referrer_id;
        
        IF subscription_type_val IS NULL THEN
            subscription_type_val := 'standard';
        END IF;
        
        -- Calculer base
        IF subscription_type_val = 'standard' THEN
            discount := LEAST(active_count * 5, 100);
            points := 0;
        ELSE
            discount := 0;
            points := active_count * 100;
        END IF;
        
        -- APPLIQUER LES BONUS DE CAMPAGNES ACTIVES
        FOR user_record IN 
            SELECT 
                rc.bonus_type,
                rc.discount_pct_bonus,
                rc.discount_fixed_bonus,
                rc.points_multiplier,
                rc.points_fixed_bonus
            FROM user_campaign_participations ucp
            JOIN referral_campaigns rc ON rc.id = ucp.campaign_id
            WHERE ucp.user_id = user_record.referrer_id
                AND ucp.is_active = true
                AND rc.is_active = true
                AND NOW() BETWEEN rc.start_date AND rc.end_date
        LOOP
            CASE user_record.bonus_type
                WHEN 'discount_multiplier' THEN
                    discount := LEAST(active_count * user_record.discount_pct_bonus, 100);
                WHEN 'discount_fixed' THEN
                    campaign_bonus := user_record.discount_fixed_bonus;
                    discount := LEAST(discount + campaign_bonus, 100);
                WHEN 'points_multiplier' THEN
                    points := points * user_record.points_multiplier;
                WHEN 'points_fixed' THEN
                    campaign_points := user_record.points_fixed_bonus;
                    points := points + campaign_points;
            END CASE;
        END LOOP;
        
        total_saved := base_monthly_price * (discount / 100);
        
        -- Insérer ou mettre à jour
        INSERT INTO referral_rewards (
            user_id,
            month,
            active_referrals_count,
            discount_pct,
            points_earned,
            total_saved,
            calculated_at
        ) VALUES (
            user_record.referrer_id,
            current_month,
            active_count,
            discount,
            points,
            total_saved,
            NOW()
        )
        ON CONFLICT (user_id, month)
        DO UPDATE SET
            active_referrals_count = EXCLUDED.active_referrals_count,
            discount_pct = EXCLUDED.discount_pct,
            points_earned = EXCLUDED.points_earned,
            total_saved = EXCLUDED.total_saved,
            calculated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION : Stats admin des campagnes
-- =====================================================

CREATE OR REPLACE FUNCTION get_campaign_stats(p_campaign_id UUID)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'campaign_id', rc.id,
        'name', rc.name,
        'total_participants', rc.current_uses,
        'max_uses', rc.max_uses,
        'occupation_rate', 
            CASE 
                WHEN rc.max_uses IS NOT NULL AND rc.max_uses > 0 
                THEN ROUND((rc.current_uses::DECIMAL / rc.max_uses * 100), 2)
                ELSE NULL
            END,
        'total_referrals_generated', (
            SELECT COALESCE(SUM(referrals_during_campaign), 0)
            FROM user_campaign_participations
            WHERE campaign_id = rc.id
        ),
        'total_bonus_distributed', (
            SELECT COALESCE(SUM(total_bonus_earned), 0)
            FROM user_campaign_participations
            WHERE campaign_id = rc.id
        ),
        'days_remaining', EXTRACT(DAY FROM rc.end_date - NOW()),
        'is_active', rc.is_active AND NOW() BETWEEN rc.start_date AND rc.end_date
    ) INTO v_stats
    FROM referral_campaigns rc
    WHERE rc.id = p_campaign_id;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER : Désactiver automatiquement les campagnes expirées
-- =====================================================

CREATE OR REPLACE FUNCTION auto_deactivate_expired_campaigns()
RETURNS void AS $$
BEGIN
    UPDATE referral_campaigns
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true 
        AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MESSAGE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Système de campagnes promo parrainage créé';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables créées :';
    RAISE NOTICE '  - referral_campaigns : Campagnes de promotion';
    RAISE NOTICE '  - user_campaign_participations : Inscriptions utilisateurs';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Fonctions créées :';
    RAISE NOTICE '  - get_active_campaigns_for_user(user_id) : Campagnes disponibles';
    RAISE NOTICE '  - enroll_in_campaign(user_id, code) : Inscription campagne';
    RAISE NOTICE '  - calculate_monthly_referral_rewards_with_campaigns() : Calcul avec bonus';
    RAISE NOTICE '  - get_campaign_stats(campaign_id) : Stats admin';
    RAISE NOTICE '';
END $$;
