-- ================================================================
-- PERMISSIONS + RELOAD SCHEMA POSTGREST
-- ================================================================

-- 1. Permissions pour la fonction insert_onboarding_data
GRANT EXECUTE ON FUNCTION insert_onboarding_data(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_onboarding_data(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon;

-- 2. Permissions pour les fonctions helper RLS
GRANT EXECUTE ON FUNCTION get_current_user_organization_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT) TO authenticated;

-- 3. Forcer le reload du schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Permissions accordées';
    RAISE NOTICE '✅ Reload schéma PostgREST demandé';
    RAISE NOTICE '';
    RAISE NOTICE '⏳ Attendre 5-10 secondes puis réessayer onboarding';
END $$;
