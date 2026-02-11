-- ============================================================================
-- RLS POLICIES POUR DEMANDES_HORAIRES
-- ============================================================================
-- Sans ces policies, les requêtes Supabase sont bloquées !

BEGIN;

-- 1. Activer RLS sur la table
ALTER TABLE public.demandes_horaires ENABLE ROW LEVEL SECURITY;

-- 2. Policy SELECT: Propriétaires peuvent voir leurs propres demandes
CREATE POLICY "Les propriétaires peuvent voir leurs demandes"
    ON public.demandes_horaires
    FOR SELECT
    USING (auth.uid() = owner_user_id);

-- 3. Policy INSERT: Propriétaires peuvent créer leurs demandes  
CREATE POLICY "Les propriétaires peuvent créer des demandes"
    ON public.demandes_horaires
    FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

-- 4. Policy UPDATE: Propriétaires peuvent modifier leurs demandes
CREATE POLICY "Les propriétaires peuvent modifier leurs demandes"
    ON public.demandes_horaires
    FOR UPDATE
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

-- 5. Policy DELETE: Propriétaires peuvent supprimer leurs demandes (optionnel)
CREATE POLICY "Les propriétaires peuvent supprimer leurs demandes"
    ON public.demandes_horaires
    FOR DELETE
    USING (auth.uid() = owner_user_id);

COMMIT;

-- Vérification
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'demandes_horaires'
ORDER BY policyname;
