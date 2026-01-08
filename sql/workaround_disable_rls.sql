-- ================================================================
-- WORKAROUND TEMPORAIRE: Désactiver RLS pour onboarding
-- ================================================================
-- À exécuter AVANT de faire l'onboarding
-- À réactiver APRÈS le premier compte créé

-- Désactiver RLS temporairement
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE gites DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE '⚠️  RLS DÉSACTIVÉ TEMPORAIREMENT';
    RAISE NOTICE '⚠️  À RÉACTIVER APRÈS PREMIER ONBOARDING';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Vous pouvez maintenant faire l''onboarding';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  APRÈS ONBOARDING, EXÉCUTER: enable_rls.sql';
END $$;
