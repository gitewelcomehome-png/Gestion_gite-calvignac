-- =====================================================
-- AJOUTS POUR GESTION COMPLÈTE DU PARRAINAGE
-- À exécuter APRÈS parrainage_system.sql
-- =====================================================

-- =====================================================
-- FONCTION : Désactiver un parrainage (arrêt paiement)
-- =====================================================

CREATE OR REPLACE FUNCTION deactivate_referral(
    p_referred_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE referrals
    SET 
        status = 'inactive',
        is_currently_paying = false
    WHERE referred_user_id = p_referred_user_id
      AND status = 'active';
    
    -- Log l'action
    RAISE NOTICE 'Parrainage désactivé pour user %', p_referred_user_id;
END;
$$;

COMMENT ON FUNCTION deactivate_referral IS 'Désactive un parrainage quand le filleul arrête de payer';

-- =====================================================
-- FONCTION : Réactiver un parrainage (reprise paiement)
-- =====================================================

CREATE OR REPLACE FUNCTION reactivate_referral(
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
        last_payment_at = NOW()
    WHERE referred_user_id = p_referred_user_id
      AND status = 'inactive';
    
    -- Log l'action
    RAISE NOTICE 'Parrainage réactivé pour user %', p_referred_user_id;
END;
$$;

COMMENT ON FUNCTION reactivate_referral IS 'Réactive un parrainage quand le filleul reprend ses paiements';

-- =====================================================
-- FONCTION : Obtenir les stats d'un parrain
-- =====================================================

CREATE OR REPLACE FUNCTION get_referrer_stats(
    p_referrer_id UUID
)
RETURNS TABLE (
    total_referrals INT,
    active_referrals INT,
    registered_referrals INT,
    pending_referrals INT,
    total_invitations INT,
    current_discount DECIMAL(5,2),
    current_points INT,
    subscription_type VARCHAR(20)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_type VARCHAR(20);
    v_active_count INT;
BEGIN
    -- Récupérer le type d'abonnement
    SELECT COALESCE(us.subscription_type, 'standard')
    INTO v_subscription_type
    FROM user_settings us
    WHERE us.user_id = p_referrer_id;
    
    -- Compter les filleuls actifs
    SELECT COUNT(*)
    INTO v_active_count
    FROM referrals r
    WHERE r.referrer_id = p_referrer_id
      AND r.status = 'active'
      AND r.is_currently_paying = true;
    
    -- Retourner les stats
    RETURN QUERY
    SELECT
        -- Total parrainages
        (SELECT COUNT(*)::INT FROM referrals WHERE referrer_id = p_referrer_id),
        
        -- Filleuls actifs
        v_active_count::INT,
        
        -- Filleuls inscrits
        (SELECT COUNT(*)::INT FROM referrals 
         WHERE referrer_id = p_referrer_id AND status IN ('active', 'inactive', 'registered')),
        
        -- En attente
        (SELECT COUNT(*)::INT FROM referrals 
         WHERE referrer_id = p_referrer_id AND status = 'pending'),
        
        -- Total invitations
        (SELECT COUNT(*)::INT FROM referral_invitations WHERE referrer_id = p_referrer_id),
        
        -- Réduction actuelle (si type standard)
        CASE 
            WHEN v_subscription_type = 'standard' 
            THEN LEAST(v_active_count * 5.0, 100.0)
            ELSE 0.0
        END,
        
        -- Points actuels (si type gites_france)
        CASE 
            WHEN v_subscription_type = 'gites_france' 
            THEN LEAST(v_active_count * 100, 2000)
            ELSE 0
        END,
        
        -- Type d'abonnement
        v_subscription_type;
END;
$$;

COMMENT ON FUNCTION get_referrer_stats IS 'Récupère toutes les statistiques d''un parrain';

-- =====================================================
-- FONCTION : Vérifier si un code de parrainage est valide
-- =====================================================

CREATE OR REPLACE FUNCTION is_referral_code_valid(
    p_referral_code VARCHAR(8)
)
RETURNS TABLE (
    is_valid BOOLEAN,
    referrer_id UUID,
    referrer_name VARCHAR(255),
    subscription_type VARCHAR(20)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE 
            WHEN r.referral_code IS NOT NULL 
            AND us.referral_enabled = true 
            THEN true 
            ELSE false 
        END as is_valid,
        r.referrer_id,
        COALESCE(u.raw_user_meta_data->>'nom', u.email) as referrer_name,
        COALESCE(us.subscription_type, 'standard') as subscription_type
    FROM referrals r
    LEFT JOIN auth.users u ON u.id = r.referrer_id
    LEFT JOIN user_settings us ON us.user_id = r.referrer_id
    WHERE r.referral_code = p_referral_code
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION is_referral_code_valid IS 'Vérifie si un code de parrainage est valide et retourne les infos du parrain';

-- =====================================================
-- FONCTION : Enregistrer une invitation (tracking)
-- =====================================================

CREATE OR REPLACE FUNCTION track_referral_invitation(
    p_referrer_id UUID,
    p_channel VARCHAR(20),
    p_recipient_email VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation_id UUID;
BEGIN
    INSERT INTO referral_invitations (
        referrer_id,
        channel,
        recipient_email,
        sent_at
    ) VALUES (
        p_referrer_id,
        p_channel,
        p_recipient_email,
        NOW()
    )
    RETURNING id INTO v_invitation_id;
    
    RETURN v_invitation_id;
END;
$$;

COMMENT ON FUNCTION track_referral_invitation IS 'Enregistre une invitation envoyée par un parrain';

-- =====================================================
-- TRIGGER : Auto-calcul des récompenses à chaque changement
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_referral_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Appeler le calcul des récompenses pour le parrain concerné
    PERFORM calculate_monthly_referral_rewards();
    
    RETURN NEW;
END;
$$;

-- Créer le trigger sur les changements de statut
DROP TRIGGER IF EXISTS trg_referral_status_change_update ON referrals;
DROP TRIGGER IF EXISTS trg_referral_status_change_insert ON referrals;

-- Trigger pour les mises à jour
CREATE TRIGGER trg_referral_status_change_update
    AFTER UPDATE OF status, is_currently_paying
    ON referrals
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status OR NEW.is_currently_paying IS DISTINCT FROM OLD.is_currently_paying)
    EXECUTE FUNCTION trigger_update_referral_rewards();

-- Trigger pour les insertions (nouveaux parrainages)
CREATE TRIGGER trg_referral_status_change_insert
    AFTER INSERT
    ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_referral_rewards();

COMMENT ON TRIGGER trg_referral_status_change_update ON referrals IS 'Recalcule automatiquement les récompenses quand un statut change';
COMMENT ON TRIGGER trg_referral_status_change_insert ON referrals IS 'Recalcule automatiquement les récompenses lors de nouveaux parrainages';

-- =====================================================
-- VUE : Vue simplifiée des parrainages actifs
-- =====================================================

CREATE OR REPLACE VIEW v_active_referrals AS
SELECT 
    r.id,
    r.referrer_id,
    r.referral_code,
    r.referred_email,
    r.referred_user_id,
    r.registered_at,
    r.first_payment_at,
    r.last_payment_at,
    COALESCE(u_referrer.raw_user_meta_data->>'nom', u_referrer.email) as referrer_name,
    COALESCE(u_referred.raw_user_meta_data->>'nom', u_referred.email) as referred_name,
    COALESCE(us.subscription_type, 'standard') as referrer_subscription_type,
    CASE 
        WHEN us.subscription_type = 'gites_france' 
        THEN 100 
        ELSE 5 
    END as reward_value,
    CASE 
        WHEN us.subscription_type = 'gites_france' 
        THEN 'points' 
        ELSE 'percent' 
    END as reward_type
FROM referrals r
LEFT JOIN auth.users u_referrer ON u_referrer.id = r.referrer_id
LEFT JOIN auth.users u_referred ON u_referred.id = r.referred_user_id
LEFT JOIN user_settings us ON us.user_id = r.referrer_id
WHERE r.status = 'active' 
  AND r.is_currently_paying = true;

COMMENT ON VIEW v_active_referrals IS 'Vue des parrainages actifs avec infos lisibles';

-- =====================================================
-- INDEX ADDITIONNELS pour performances
-- =====================================================

-- Index sur les emails pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email);

-- Index sur les dates pour requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_referrals_registered_at ON referrals(registered_at);
CREATE INDEX IF NOT EXISTS idx_referrals_first_payment_at ON referrals(first_payment_at);

-- Index composite pour les statistiques
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status_paying 
ON referrals(referrer_id, status, is_currently_paying);

-- =====================================================
-- POLITIQUE RLS : Permettre aux utilisateurs de voir 
-- les infos des filleuls qu'ils ont parrainés
-- =====================================================

CREATE POLICY "Referrers can view their referred users basic info"
    ON referrals FOR SELECT
    USING (
        auth.uid() = referrer_id 
        AND referred_user_id IS NOT NULL
    );

-- =====================================================
-- DONNÉES DE TEST (à supprimer en production)
-- =====================================================

-- Créer un code de parrainage pour test
-- INSERT INTO referrals (referrer_id, referral_code, status)
-- SELECT id, 'TEST1234', 'pending' 
-- FROM auth.users 
-- WHERE email = 'test@liveownerunit.com'
-- LIMIT 1;

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier que toutes les fonctions existent
DO $$
DECLARE
    v_functions TEXT[] := ARRAY[
        'process_referral_signup',
        'activate_referral',
        'deactivate_referral',
        'reactivate_referral',
        'get_referrer_stats',
        'is_referral_code_valid',
        'track_referral_invitation',
        'calculate_monthly_referral_rewards'
    ];
    v_func TEXT;
    v_exists BOOLEAN;
BEGIN
    FOREACH v_func IN ARRAY v_functions
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = v_func
        ) INTO v_exists;
        
        IF v_exists THEN
            RAISE NOTICE '✅ Fonction % existe', v_func;
        ELSE
            RAISE WARNING '❌ Fonction % manquante!', v_func;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- FIN DES AJOUTS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Compléments système de parrainage appliqués avec succès';
END $$;
