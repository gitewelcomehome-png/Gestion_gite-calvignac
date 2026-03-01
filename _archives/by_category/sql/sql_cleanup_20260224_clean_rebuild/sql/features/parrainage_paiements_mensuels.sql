-- =====================================================
-- TABLE POUR TRACKER LES PAIEMENTS MENSUELS DES FILLEULS
-- =====================================================

-- Cette table permet de :
-- 1. Historiser chaque paiement mensuel d'un filleul
-- 2. Détecter automatiquement les arrêts de paiement
-- 3. Calculer précisément les récompenses du parrain

CREATE TABLE IF NOT EXISTS referral_monthly_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Lien avec le parrainage
    referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL,
    referrer_id UUID NOT NULL,
    
    -- Informations du paiement
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'succeeded' CHECK (payment_status IN ('succeeded', 'failed', 'refunded', 'pending')),
    
    -- Tracking externe (Stripe, etc.)
    external_payment_id VARCHAR(255), -- ID du paiement Stripe
    payment_method VARCHAR(50), -- card, sepa, etc.
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index pour performances
    CONSTRAINT unique_referral_payment UNIQUE(referral_id, payment_date)
);

CREATE INDEX idx_referral_payments_user ON referral_monthly_payments(referred_user_id);
CREATE INDEX idx_referral_payments_referrer ON referral_monthly_payments(referrer_id);
CREATE INDEX idx_referral_payments_date ON referral_monthly_payments(payment_date);
CREATE INDEX idx_referral_payments_status ON referral_monthly_payments(payment_status);

COMMENT ON TABLE referral_monthly_payments IS 'Historique des paiements mensuels des filleuls pour calcul précis des récompenses';

-- =====================================================
-- FONCTION : Enregistrer un paiement mensuel
-- =====================================================

CREATE OR REPLACE FUNCTION record_referral_payment(
    p_referred_user_id UUID,
    p_amount DECIMAL(10,2),
    p_external_payment_id VARCHAR(255) DEFAULT NULL,
    p_payment_method VARCHAR(50) DEFAULT 'card'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral_id UUID;
    v_referrer_id UUID;
    v_payment_id UUID;
    v_referral_status VARCHAR(20);
BEGIN
    -- Récupérer les infos du parrainage
    SELECT id, referrer_id, status
    INTO v_referral_id, v_referrer_id, v_referral_status
    FROM referrals
    WHERE referred_user_id = p_referred_user_id
    LIMIT 1;
    
    -- Si pas de parrainage, ne rien faire
    IF v_referral_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Enregistrer le paiement
    INSERT INTO referral_monthly_payments (
        referral_id,
        referred_user_id,
        referrer_id,
        payment_date,
        amount,
        payment_status,
        external_payment_id,
        payment_method
    ) VALUES (
        v_referral_id,
        p_referred_user_id,
        v_referrer_id,
        CURRENT_DATE,
        p_amount,
        'succeeded',
        p_external_payment_id,
        p_payment_method
    )
    ON CONFLICT (referral_id, payment_date) 
    DO UPDATE SET
        amount = EXCLUDED.amount,
        payment_status = 'succeeded',
        updated_at = NOW()
    RETURNING id INTO v_payment_id;
    
    -- Mettre à jour le parrainage
    UPDATE referrals
    SET 
        is_currently_paying = true,
        last_payment_at = NOW(),
        -- Si c'est le premier paiement et statut = registered
        status = CASE 
            WHEN v_referral_status = 'registered' THEN 'active'
            WHEN v_referral_status = 'inactive' THEN 'active'
            ELSE status
        END,
        first_payment_at = CASE 
            WHEN first_payment_at IS NULL THEN NOW()
            ELSE first_payment_at
        END
    WHERE id = v_referral_id;
    
    RAISE NOTICE '✅ Paiement enregistré pour filleul % (parrainage %)', p_referred_user_id, v_referral_id;
    
    RETURN v_payment_id;
END;
$$;

COMMENT ON FUNCTION record_referral_payment IS 'Enregistre un paiement mensuel d''un filleul et met à jour son statut de parrainage';

-- =====================================================
-- FONCTION : Détecter les arrêts de paiement
-- =====================================================

CREATE OR REPLACE FUNCTION detect_payment_failures()
RETURNS TABLE (
    referral_id UUID,
    referred_user_id UUID,
    referred_email VARCHAR(255),
    last_payment_date DATE,
    days_since_last_payment INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Filleuls qui n'ont pas payé depuis 35 jours (avec marge)
    RETURN QUERY
    SELECT 
        r.id,
        r.referred_user_id,
        r.referred_email,
        r.last_payment_at::DATE,
        EXTRACT(DAY FROM NOW() - r.last_payment_at)::INT
    FROM referrals r
    WHERE r.status = 'active'
      AND r.is_currently_paying = true
      AND r.last_payment_at < NOW() - INTERVAL '35 days';
END;
$$;

COMMENT ON FUNCTION detect_payment_failures IS 'Détecte les filleuls qui n''ont pas payé depuis plus de 35 jours';

-- =====================================================
-- FONCTION : Désactiver automatiquement les filleuls non-payants
-- =====================================================

CREATE OR REPLACE FUNCTION auto_deactivate_non_paying_referrals()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT := 0;
    v_referral RECORD;
BEGIN
    -- Pour chaque filleul qui n'a pas payé depuis 35 jours
    FOR v_referral IN 
        SELECT * FROM detect_payment_failures()
    LOOP
        -- Désactiver le parrainage
        UPDATE referrals
        SET 
            status = 'inactive',
            is_currently_paying = false
        WHERE id = v_referral.referral_id;
        
        v_count := v_count + 1;
        
        RAISE NOTICE '⚠️ Parrainage % désactivé : pas de paiement depuis % jours', 
            v_referral.referred_email, 
            v_referral.days_since_last_payment;
    END LOOP;
    
    IF v_count > 0 THEN
        -- Recalculer les récompenses
        PERFORM calculate_monthly_referral_rewards();
    END IF;
    
    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION auto_deactivate_non_paying_referrals IS 'Désactive automatiquement les parrainages des filleuls qui n''ont pas payé depuis 35 jours';

-- =====================================================
-- FONCTION : Statistiques de paiement d'un parrain
-- =====================================================

CREATE OR REPLACE FUNCTION get_referrer_payment_stats(
    p_referrer_id UUID,
    p_months INT DEFAULT 12
)
RETURNS TABLE (
    month DATE,
    total_payments INT,
    successful_payments INT,
    failed_payments INT,
    total_amount DECIMAL(10,2),
    active_referrals_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('month', rmp.payment_date)::DATE as month,
        COUNT(*)::INT as total_payments,
        COUNT(*) FILTER (WHERE rmp.payment_status = 'succeeded')::INT as successful_payments,
        COUNT(*) FILTER (WHERE rmp.payment_status = 'failed')::INT as failed_payments,
        SUM(rmp.amount) FILTER (WHERE rmp.payment_status = 'succeeded') as total_amount,
        COUNT(DISTINCT rmp.referred_user_id)::INT as active_referrals_count
    FROM referral_monthly_payments rmp
    WHERE rmp.referrer_id = p_referrer_id
      AND rmp.payment_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
    GROUP BY DATE_TRUNC('month', rmp.payment_date)
    ORDER BY month DESC;
END;
$$;

COMMENT ON FUNCTION get_referrer_payment_stats IS 'Statistiques de paiement mensuelles pour un parrain';

-- =====================================================
-- VUE : Vue d'ensemble des paiements actifs
-- =====================================================

CREATE OR REPLACE VIEW v_referral_payments_overview AS
SELECT 
    r.referrer_id,
    COALESCE(u_referrer.raw_user_meta_data->>'nom', u_referrer.email) as referrer_name,
    r.referred_user_id,
    r.referred_email,
    r.status,
    r.is_currently_paying,
    r.last_payment_at,
    COUNT(rmp.id) as total_payments_count,
    SUM(rmp.amount) FILTER (WHERE rmp.payment_status = 'succeeded') as total_paid_amount,
    MAX(rmp.payment_date) as last_successful_payment_date,
    EXTRACT(DAY FROM NOW() - MAX(rmp.payment_date))::INT as days_since_last_payment
FROM referrals r
LEFT JOIN referral_monthly_payments rmp ON rmp.referral_id = r.id
LEFT JOIN auth.users u_referrer ON u_referrer.id = r.referrer_id
WHERE r.status IN ('active', 'inactive')
GROUP BY r.id, r.referrer_id, u_referrer.raw_user_meta_data, u_referrer.email, 
         r.referred_user_id, r.referred_email, r.status, r.is_currently_paying, r.last_payment_at;

COMMENT ON VIEW v_referral_payments_overview IS 'Vue d''ensemble des paiements des filleuls';

-- =====================================================
-- TRIGGER : Mettre à jour last_payment_at automatiquement
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_last_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.payment_status = 'succeeded' THEN
        UPDATE referrals
        SET 
            last_payment_at = NOW(),
            is_currently_paying = true,
            status = CASE 
                WHEN status IN ('registered', 'inactive') THEN 'active'
                ELSE status
            END
        WHERE id = NEW.referral_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_last_payment ON referral_monthly_payments;

CREATE TRIGGER trg_update_last_payment
    AFTER INSERT OR UPDATE OF payment_status
    ON referral_monthly_payments
    FOR EACH ROW
    WHEN (NEW.payment_status = 'succeeded')
    EXECUTE FUNCTION trigger_update_last_payment();

COMMENT ON TRIGGER trg_update_last_payment ON referral_monthly_payments IS 'Met à jour automatiquement last_payment_at du parrainage';

-- =====================================================
-- POLITIQUE RLS
-- =====================================================

ALTER TABLE referral_monthly_payments ENABLE ROW LEVEL SECURITY;

-- Les parrains peuvent voir les paiements de leurs filleuls
CREATE POLICY "Referrers can view their referred users payments"
    ON referral_monthly_payments FOR SELECT
    USING (referrer_id = auth.uid());

-- =====================================================
-- EXEMPLE D'UTILISATION
-- =====================================================

-- Enregistrer un paiement pour un filleul
-- SELECT record_referral_payment(
--     '<UUID_FILLEUL>', 
--     29.90, 
--     'pi_stripe_12345', 
--     'card'
-- );

-- Détecter les arrêts de paiement
-- SELECT * FROM detect_payment_failures();

-- Désactiver automatiquement les non-payants
-- SELECT auto_deactivate_non_paying_referrals();

-- Statistiques de paiement d'un parrain
-- SELECT * FROM get_referrer_payment_stats('<UUID_PARRAIN>');

-- =====================================================
-- SCRIPT À EXÉCUTER MENSUELLEMENT (CRON)
-- =====================================================

-- Ce script devrait être exécuté automatiquement chaque jour
-- pour détecter et désactiver les filleuls qui n'ont pas payé

/*
-- Créer un job cron Supabase :
SELECT cron.schedule(
    'auto-deactivate-non-paying-referrals',
    '0 3 * * *', -- Tous les jours à 3h du matin
    $$SELECT auto_deactivate_non_paying_referrals();$$
);
*/

-- =====================================================
-- VÉRIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Table referral_monthly_payments créée';
    RAISE NOTICE '✅ Fonction record_referral_payment créée';
    RAISE NOTICE '✅ Fonction detect_payment_failures créée';
    RAISE NOTICE '✅ Fonction auto_deactivate_non_paying_referrals créée';
    RAISE NOTICE '✅ Fonction get_referrer_payment_stats créée';
    RAISE NOTICE '✅ Vue v_referral_payments_overview créée';
    RAISE NOTICE '✅ Trigger de mise à jour automatique créé';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ INTÉGRATION REQUISE :';
    RAISE NOTICE '   - Appeler record_referral_payment() après chaque paiement Stripe';
    RAISE NOTICE '   - Configurer le cron job pour auto_deactivate_non_paying_referrals()';
END $$;
