-- =====================================================
-- SYSTÈME DE NOTIFICATIONS PARRAINAGE
-- Gestion des notifications in-app et emails automatiques
-- =====================================================

-- Table des notifications
CREATE TABLE IF NOT EXISTS referral_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'new_campaign',
        'campaign_expiring',
        'new_referral',
        'referral_active',
        'milestone_reached',
        'campaign_enrolled',
        'reward_earned'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Données contextuelles
    related_campaign_id UUID REFERENCES referral_campaigns(id),
    related_referral_id UUID REFERENCES referrals(id),
    metadata JSONB,
    
    -- Statut
    is_read BOOLEAN DEFAULT false,
    is_sent_email BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON referral_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON referral_notifications(created_at);

-- RLS
ALTER TABLE referral_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
    ON referral_notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
    ON referral_notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FONCTION : Créer une notification
-- =====================================================

CREATE OR REPLACE FUNCTION create_referral_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_related_campaign_id UUID DEFAULT NULL,
    p_related_referral_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO referral_notifications (
        user_id,
        type,
        title,
        message,
        related_campaign_id,
        related_referral_id,
        metadata
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_related_campaign_id,
        p_related_referral_id,
        p_metadata
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION : Marquer comme lu
-- =====================================================

CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE referral_notifications
    SET is_read = true,
        read_at = NOW()
    WHERE id = p_notification_id
        AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION : Obtenir notifications non lues
-- =====================================================

CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM referral_notifications
    WHERE user_id = p_user_id
        AND is_read = false
        AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER : Nouvelle campagne créée
-- =====================================================

CREATE OR REPLACE FUNCTION notify_new_campaign()
RETURNS TRIGGER AS $$
BEGIN
    -- Notifier tous les utilisateurs avec parrainage activé
    INSERT INTO referral_notifications (user_id, type, title, message, related_campaign_id)
    SELECT 
        us.user_id,
        'new_campaign',
        '🎉 Nouvelle campagne de parrainage !',
        'Nouvelle promotion : ' || NEW.name || ' - ' || NEW.description,
        NEW.id
    FROM user_settings us
    WHERE us.referral_enabled = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_campaign ON referral_campaigns;
CREATE TRIGGER trigger_new_campaign
    AFTER INSERT ON referral_campaigns
    FOR EACH ROW
    WHEN (NEW.is_active = true AND NEW.is_featured = true)
    EXECUTE FUNCTION notify_new_campaign();

-- =====================================================
-- TRIGGER : Nouveau filleul inscrit
-- =====================================================

CREATE OR REPLACE FUNCTION notify_new_referral()
RETURNS TRIGGER AS $$
BEGIN
    -- Notifier le parrain
    INSERT INTO referral_notifications (
        user_id,
        type,
        title,
        message,
        related_referral_id,
        metadata
    ) VALUES (
        NEW.referrer_id,
        'new_referral',
        '👥 Nouveau filleul inscrit !',
        COALESCE(NEW.referred_email, 'Un nouveau filleul') || ' a utilisé votre code de parrainage.',
        NEW.id,
        json_build_object('email', NEW.referred_email)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_referral ON referrals;
CREATE TRIGGER trigger_new_referral
    AFTER INSERT ON referrals
    FOR EACH ROW
    WHEN (NEW.status = 'registered')
    EXECUTE FUNCTION notify_new_referral();

-- =====================================================
-- TRIGGER : Filleul devient actif (premier paiement)
-- =====================================================

CREATE OR REPLACE FUNCTION notify_referral_active()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_type VARCHAR(20);
    v_bonus_message TEXT;
BEGIN
    -- Récupérer le type d'abonnement du parrain
    SELECT subscription_type INTO v_referrer_type
    FROM user_settings
    WHERE user_id = NEW.referrer_id;
    
    -- Message selon le type
    IF v_referrer_type = 'standard' THEN
        v_bonus_message := 'Vous gagnez +5% de réduction !';
    ELSE
        v_bonus_message := 'Vous gagnez +100 points !';
    END IF;
    
    -- Notifier le parrain
    INSERT INTO referral_notifications (
        user_id,
        type,
        title,
        message,
        related_referral_id,
        metadata
    ) VALUES (
        NEW.referrer_id,
        'referral_active',
        '💰 Filleul actif !',
        COALESCE(NEW.referred_email, 'Votre filleul') || ' a effectué son premier paiement. ' || v_bonus_message,
        NEW.id,
        json_build_object(
            'email', NEW.referred_email,
            'subscription_type', v_referrer_type
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_referral_active ON referrals;
CREATE TRIGGER trigger_referral_active
    AFTER UPDATE ON referrals
    FOR EACH ROW
    WHEN (OLD.status != 'active' AND NEW.status = 'active' AND NEW.is_currently_paying = true)
    EXECUTE FUNCTION notify_referral_active();

-- =====================================================
-- TRIGGER : Palier atteint
-- =====================================================

CREATE OR REPLACE FUNCTION notify_milestone_reached()
RETURNS TRIGGER AS $$
DECLARE
    v_active_count INT;
    v_subscription_type VARCHAR(20);
    v_reward_message TEXT;
BEGIN
    -- Compter les filleuls actifs
    SELECT COUNT(*) INTO v_active_count
    FROM referrals
    WHERE referrer_id = NEW.user_id
        AND status = 'active'
        AND is_currently_paying = true;
    
    -- Récupérer le type d'abonnement
    SELECT subscription_type INTO v_subscription_type
    FROM user_settings
    WHERE user_id = NEW.user_id;
    
    -- Vérifier les paliers (5, 10, 15, 20)
    IF v_active_count IN (5, 10, 15, 20) THEN
        IF v_subscription_type = 'standard' THEN
            v_reward_message := 'Vous avez maintenant ' || (v_active_count * 5)::TEXT || '% de réduction !';
        ELSE
            v_reward_message := 'Vous avez accumulé ' || (v_active_count * 100)::TEXT || ' points !';
        END IF;
        
        INSERT INTO referral_notifications (
            user_id,
            type,
            title,
            message,
            metadata
        ) VALUES (
            NEW.user_id,
            'milestone_reached',
            '🎯 Palier atteint !',
            'Félicitations ! Vous avez ' || v_active_count::TEXT || ' filleuls actifs. ' || v_reward_message,
            json_build_object(
                'active_count', v_active_count,
                'subscription_type', v_subscription_type
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_milestone_reached ON referral_rewards;
CREATE TRIGGER trigger_milestone_reached
    AFTER INSERT OR UPDATE ON referral_rewards
    FOR EACH ROW
    EXECUTE FUNCTION notify_milestone_reached();

-- =====================================================
-- FONCTION : Notifier campagnes qui expirent bientôt
-- (À appeler via CRON quotidien)
-- =====================================================

CREATE OR REPLACE FUNCTION notify_expiring_campaigns()
RETURNS void AS $$
BEGIN
    -- Notifier pour les campagnes qui expirent dans 3 jours
    INSERT INTO referral_notifications (user_id, type, title, message, related_campaign_id)
    SELECT 
        ucp.user_id,
        'campaign_expiring',
        '⏰ Campagne en fin bientôt !',
        'La campagne "' || rc.name || '" se termine dans ' || 
        EXTRACT(DAY FROM rc.end_date - NOW())::TEXT || ' jours.',
        rc.id
    FROM user_campaign_participations ucp
    JOIN referral_campaigns rc ON rc.id = ucp.campaign_id
    WHERE rc.is_active = true
        AND ucp.is_active = true
        AND rc.end_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
        AND NOT EXISTS (
            SELECT 1 FROM referral_notifications rn
            WHERE rn.user_id = ucp.user_id
                AND rn.related_campaign_id = rc.id
                AND rn.type = 'campaign_expiring'
                AND rn.created_at > NOW() - INTERVAL '2 days'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MESSAGE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Système de notifications créé';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Table créée :';
    RAISE NOTICE '  - referral_notifications : Notifications utilisateurs';
    RAISE NOTICE '';
    RAISE NOTICE '🔔 Triggers actifs :';
    RAISE NOTICE '  - Nouvelle campagne featured';
    RAISE NOTICE '  - Nouveau filleul inscrit';
    RAISE NOTICE '  - Filleul devient actif';
    RAISE NOTICE '  - Palier atteint (5, 10, 15, 20)';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ CRON à configurer :';
    RAISE NOTICE '  - notify_expiring_campaigns() : quotidien';
    RAISE NOTICE '';
END $$;
