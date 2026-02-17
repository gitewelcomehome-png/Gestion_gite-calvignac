-- ================================================================
-- 🔧 FIX POLITIQUES RLS - cm_error_corrections
-- Date: 07/02/2026
-- Problème: Accès refusé (403) car auth.users non accessible
-- Solution: Lecture publique, écriture admin uniquement
-- ================================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admins can view all corrections" ON cm_error_corrections;
DROP POLICY IF EXISTS "Admins can insert corrections" ON cm_error_corrections;
DROP POLICY IF EXISTS "Admins can update corrections" ON cm_error_corrections;

-- NOUVELLE POLITIQUE: Lecture publique (pour monitoring)
-- Les corrections sont des informations non sensibles, juste pour affichage
CREATE POLICY "Public can view corrections"
    ON cm_error_corrections FOR SELECT
    USING (true);

-- NOUVELLE POLITIQUE: Écriture admin uniquement
-- Utilisation d'auth.email() au lieu de jointure sur auth.users
CREATE POLICY "Admin can insert corrections"
    ON cm_error_corrections FOR INSERT
    WITH CHECK (
        auth.email() = 'stephanecalvignac@hotmail.fr'
    );

CREATE POLICY "Admin can update corrections"
    ON cm_error_corrections FOR UPDATE
    USING (
        auth.email() = 'stephanecalvignac@hotmail.fr'
    );

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Politiques RLS corrigées pour cm_error_corrections';
    RAISE NOTICE '✅ Lecture: publique (pour monitoring)';
    RAISE NOTICE '✅ Écriture: admin uniquement (stephanecalvignac@hotmail.fr)';
END $$;
