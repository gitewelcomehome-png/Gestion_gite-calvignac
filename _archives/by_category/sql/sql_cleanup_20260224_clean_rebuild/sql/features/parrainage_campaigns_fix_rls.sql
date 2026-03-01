-- =====================================================
-- CORRECTION POLICIES RLS POUR CAMPAGNES PARRAINAGE
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON referral_campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON referral_campaigns;

-- Recréer les policies pour referral_campaigns avec les bonnes permissions
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

-- Vérifier les policies pour user_campaign_participations
DROP POLICY IF EXISTS "Users can view their participations" ON user_campaign_participations;
DROP POLICY IF EXISTS "Users can insert their participations" ON user_campaign_participations;
DROP POLICY IF EXISTS "Users can update their participations" ON user_campaign_participations;

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
-- VÉRIFICATION
-- =====================================================

-- Lister toutes les policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('referral_campaigns', 'user_campaign_participations')
ORDER BY tablename, policyname;

-- =====================================================
-- MESSAGE FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Policies RLS mises à jour';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Permissions accordées :';
    RAISE NOTICE '  - Tous les utilisateurs authentifiés peuvent gérer les campagnes';
    RAISE NOTICE '  - Les utilisateurs peuvent gérer leurs propres participations';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Testez maintenant la création de campagne dans l''interface admin';
    RAISE NOTICE '';
END $$;
