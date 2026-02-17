-- =====================================================
-- SYSTÈME DE PARRAINAGE LIVEOWNERUNIT
-- Support pour 2 types d'abonnés :
-- 1. Standard : réductions en % (5% par filleul actif, max 100%)
-- 2. Gîtes de France : points convertibles (100 pts par filleul actif)
-- =====================================================

-- Table principale des parrainages
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(8) UNIQUE NOT NULL,
    referred_email VARCHAR(255),
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'active', 'inactive')),
    registered_at TIMESTAMPTZ,
    first_payment_at TIMESTAMPTZ,
    last_payment_at TIMESTAMPTZ,
    is_currently_paying BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Métadonnées
    utm_source VARCHAR(50),
    utm_medium VARCHAR(50),
    utm_campaign VARCHAR(100)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_active ON referrals(referrer_id, status, is_currently_paying);

-- RLS : Chaque utilisateur peut voir ses propres parrainages
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "System can update referrals"
    ON referrals FOR UPDATE
    USING (true);

-- =====================================================
-- TABLE DES INVITATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS referral_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel VARCHAR(20) CHECK (channel IN ('email', 'whatsapp', 'linkedin', 'facebook', 'copy', 'qr', 'other')),
    recipient_email VARCHAR(255),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_referrer ON referral_invitations(referrer_id);

ALTER TABLE referral_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invitations"
    ON referral_invitations FOR SELECT
    USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create invitations"
    ON referral_invitations FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- =====================================================
-- TABLE DES RÉCOMPENSES
-- =====================================================

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    active_referrals_count INT DEFAULT 0,
    discount_pct DECIMAL(5,2) DEFAULT 0,
    points_earned INT DEFAULT 0,
    total_saved DECIMAL(10,2) DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_rewards_user_month ON referral_rewards(user_id, month);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
    ON referral_rewards FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- TABLE DES CONVERSIONS DE POINTS (Gîtes de France)
-- =====================================================

CREATE TABLE IF NOT EXISTS referral_point_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) CHECK (reward_type IN ('ai-credits', 'template', 'marketplace', 'formation', 'badge', 'other')),
    points_cost INT NOT NULL,
    reward_details JSONB,
    converted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_conversions_user ON referral_point_conversions(user_id);

ALTER TABLE referral_point_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversions"
    ON referral_point_conversions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversions"
    ON referral_point_conversions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TABLE DES PARAMÈTRES UTILISATEUR
-- =====================================================

-- Ajouter les colonnes nécessaires à user_settings (ou créer la table si n'existe pas)
DO $$ 
BEGIN
    -- Créer la table si elle n'existe pas
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_settings') THEN
        CREATE TABLE user_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id)
        );
        
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own settings"
            ON user_settings FOR SELECT
            USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own settings"
            ON user_settings FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    -- Ajouter les colonnes pour le parrainage
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'referral_enabled') THEN
        ALTER TABLE user_settings ADD COLUMN referral_enabled BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'subscription_type') THEN
        ALTER TABLE user_settings ADD COLUMN subscription_type VARCHAR(20) DEFAULT 'standard' CHECK (subscription_type IN ('standard', 'gites_france'));
    END IF;
END $$;

-- =====================================================
-- FONCTION : Calculer les récompenses mensuelles
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_monthly_referral_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    active_count INT;
    discount_amount DECIMAL(5,2);
    points_amount INT;
    saved_amount DECIMAL(10,2);
    base_price DECIMAL(10,2) := 30.00;
    subscription_type_val VARCHAR(20);
BEGIN
    -- Pour chaque utilisateur ayant des parrainages
    FOR rec IN 
        SELECT DISTINCT referrer_id 
        FROM referrals 
        WHERE status IN ('active', 'inactive')
    LOOP
        -- Récupérer le type d'abonnement
        SELECT subscription_type INTO subscription_type_val
        FROM user_settings
        WHERE user_id = rec.referrer_id;
        
        IF subscription_type_val IS NULL THEN
            subscription_type_val := 'standard';
        END IF;
        
        -- Compter les filleuls actifs
        SELECT COUNT(*) INTO active_count
        FROM referrals
        WHERE referrer_id = rec.referrer_id
          AND status = 'active'
          AND is_currently_paying = true;
        
        -- Calculer selon le type d'abonnement
        IF subscription_type_val = 'gites_france' THEN
            -- Système de points
            points_amount := LEAST(active_count * 100, 2000);
            discount_amount := 0;
            saved_amount := 0;
        ELSE
            -- Système de réduction classique
            discount_amount := LEAST(active_count * 5.0, 100.0);
            saved_amount := base_price * discount_amount / 100;
            points_amount := 0;
        END IF;
        
        -- Insérer ou mettre à jour les récompenses du mois
        INSERT INTO referral_rewards (
            user_id,
            month,
            active_referrals_count,
            discount_pct,
            points_earned,
            total_saved,
            calculated_at
        ) VALUES (
            rec.referrer_id,
            date_trunc('month', CURRENT_DATE),
            active_count,
            discount_amount,
            points_amount,
            saved_amount,
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
$$;

-- =====================================================
-- FONCTION : Traiter une nouvelle inscription par parrainage
-- =====================================================

CREATE OR REPLACE FUNCTION process_referral_signup(
    p_referral_code VARCHAR(8),
    p_referred_email VARCHAR(255),
    p_referred_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referrer_id UUID;
    v_result JSONB;
BEGIN
    -- Trouver le parrainage
    SELECT referrer_id INTO v_referrer_id
    FROM referrals
    WHERE referral_code = p_referral_code
    LIMIT 1;
    
    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Code de parrainage invalide'
        );
    END IF;
    
    -- Mettre à jour le parrainage
    UPDATE referrals
    SET 
        referred_email = p_referred_email,
        referred_user_id = p_referred_user_id,
        status = 'registered',
        registered_at = NOW()
    WHERE referral_code = p_referral_code;
    
    RETURN jsonb_build_object(
        'success', true,
        'referrer_id', v_referrer_id
    );
END;
$$;

-- =====================================================
-- FONCTION : Activer un parrainage après premier paiement
-- =====================================================

CREATE OR REPLACE FUNCTION activate_referral(
    p_referred_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE referrals
    SET 
        status = 'active',
        is_currently_paying = true,
        first_payment_at = NOW(),
        last_payment_at = NOW()
    WHERE referred_user_id = p_referred_user_id
      AND status = 'registered';
END;
$$;

-- =====================================================
-- COMMENTAIRES DE DOCUMENTATION
-- =====================================================

COMMENT ON TABLE referrals IS 'Système de parrainage : tracking des parrains et filleuls';
COMMENT ON TABLE referral_invitations IS 'Invitations envoyées par les parrains';
COMMENT ON TABLE referral_rewards IS 'Récompenses mensuelles calculées pour chaque parrain';
COMMENT ON TABLE referral_point_conversions IS 'Conversions de points pour membres Gîtes de France';

COMMENT ON COLUMN user_settings.referral_enabled IS 'Programme de parrainage activé pour cet utilisateur (contrôlé par admin)';
COMMENT ON COLUMN user_settings.subscription_type IS 'Type abonnement : standard (réductions %) ou gites_france (points)';

-- =====================================================
-- DONNÉES DE TEST (à supprimer en production)
-- =====================================================

-- INSERT INTO user_settings (user_id, referral_enabled, subscription_type)
-- SELECT id, true, 'standard' FROM auth.users LIMIT 1;
