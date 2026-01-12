-- ================================================================
-- RÉACTIVER RLS APRÈS ONBOARDING
-- ================================================================
-- À exécuter APRÈS avoir créé votre premier compte

-- Réactiver RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE '✅ RLS RÉACTIVÉ';
    RAISE NOTICE '✅ Sécurité multi-tenant restaurée';
END $$;
