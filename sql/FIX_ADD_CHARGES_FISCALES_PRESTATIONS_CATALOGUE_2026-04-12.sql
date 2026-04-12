-- ================================================================
-- FIX : charges_fiscales + RLS owner sur prestations_catalogue
-- DATE : 2026-04-12
-- CAUSE 1 : Colonne charges_fiscales absente → PGRST204
-- CAUSE 2 : Politique RLS owner absente ou mal créée → 403/42501
--           (CREATE POLICY sans IF NOT EXISTS peut échouer silencieusement
--            dans un DO block si la policy existait déjà)
-- SOLUTION : ADD COLUMN idempotent + DROP/RECREATE policies proprement
-- ================================================================

-- 1. Ajouter la colonne charges_fiscales si elle n'existe pas
ALTER TABLE public.prestations_catalogue
ADD COLUMN IF NOT EXISTS charges_fiscales NUMERIC(10,2) DEFAULT 0;

-- 2. Recréer les politiques RLS owner proprement
DROP POLICY IF EXISTS gc_owner_manage_prestations              ON public.prestations_catalogue;
DROP POLICY IF EXISTS gc_admin_manage_prestations_only         ON public.prestations_catalogue;
DROP POLICY IF EXISTS gc_admin_manage_prestations_fallback     ON public.prestations_catalogue;

-- Politique owner : accès complet via ownership du gîte
CREATE POLICY gc_owner_manage_prestations
    ON public.prestations_catalogue
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.gites g
            WHERE g.id = prestations_catalogue.gite_id
              AND (g.owner_user_id = auth.uid() OR public.gc_is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gites g
            WHERE g.id = prestations_catalogue.gite_id
              AND (g.owner_user_id = auth.uid() OR public.gc_is_admin())
        )
    );
