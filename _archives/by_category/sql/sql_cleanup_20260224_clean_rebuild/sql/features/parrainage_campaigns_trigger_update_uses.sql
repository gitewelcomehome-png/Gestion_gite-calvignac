-- =====================================================
-- TRIGGER AUTO-UPDATE current_uses CAMPAGNES
-- Met à jour automatiquement le compteur de participants
-- =====================================================

-- Fonction pour mettre à jour current_uses
CREATE OR REPLACE FUNCTION update_campaign_uses()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrémenter current_uses quand une inscription est ajoutée
    IF (TG_OP = 'INSERT') THEN
        UPDATE referral_campaigns 
        SET current_uses = COALESCE(current_uses, 0) + 1
        WHERE id = NEW.campaign_id;
        
        RETURN NEW;
        
    -- Décrémenter current_uses quand une inscription est supprimée
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE referral_campaigns 
        SET current_uses = GREATEST(COALESCE(current_uses, 0) - 1, 0)
        WHERE id = OLD.campaign_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_update_campaign_uses ON user_campaign_participations;

-- Créer le trigger
CREATE TRIGGER trigger_update_campaign_uses
    AFTER INSERT OR DELETE ON user_campaign_participations
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_uses();

-- =====================================================
-- RECALCULER current_uses POUR LES CAMPAGNES EXISTANTES
-- =====================================================

UPDATE referral_campaigns rc
SET current_uses = (
    SELECT COUNT(*)
    FROM user_campaign_participations ucp
    WHERE ucp.campaign_id = rc.id
);

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Afficher les campagnes avec leur nombre réel de participants
SELECT 
    c.id,
    c.name,
    c.current_uses AS compteur_actuel,
    COUNT(p.id) AS participants_reels,
    CASE 
        WHEN c.current_uses = COUNT(p.id) THEN '✅ OK'
        ELSE '❌ Différence'
    END AS statut
FROM referral_campaigns c
LEFT JOIN user_campaign_participations p ON p.campaign_id = c.id
GROUP BY c.id, c.name, c.current_uses
ORDER BY c.created_at DESC;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger de mise à jour automatique créé';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Le compteur current_uses sera maintenant mis à jour automatiquement';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Vérifiez ci-dessus que les compteurs sont corrects';
END $$;
