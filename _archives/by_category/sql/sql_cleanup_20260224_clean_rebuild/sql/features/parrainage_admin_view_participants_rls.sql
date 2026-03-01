-- =====================================================
-- POLICIES RLS POUR VISUALISATION PARTICIPANTS (ADMIN)
-- Permet aux admins de voir les détails des participants
-- =====================================================

-- Policy pour permettre aux utilisateurs authentifiés de voir toutes les participations
-- (nécessaire pour l'interface admin)
DROP POLICY IF EXISTS "Authenticated users can view all participations" ON user_campaign_participations;

CREATE POLICY "Authenticated users can view all participations"
    ON user_campaign_participations FOR SELECT
    TO authenticated
    USING (true);

-- Note: Les jointures avec auth.users se font via Supabase qui gère l'accès
-- La policy ci-dessus permet de récupérer les données de user_campaign_participations
-- Supabase gère automatiquement l'accès aux métadonnées utilisateur via la jointure

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Tester la récupération des participants avec métadonnées utilisateur
SELECT 
    p.id,
    p.campaign_id,
    p.enrolled_at,
    u.email,
    u.raw_user_meta_data->>'full_name' as nom_complet
FROM user_campaign_participations p
LEFT JOIN auth.users u ON u.id = p.user_id
LIMIT 5;

-- Afficher les policies actuelles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'user_campaign_participations'
ORDER BY policyname;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Policies RLS mises à jour pour visualisation admin';
    RAISE NOTICE '';
    RAISE NOTICE '👀 Les admins peuvent maintenant voir tous les participants';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 La sécurité RLS reste active pour les autres opérations';
END $$;
