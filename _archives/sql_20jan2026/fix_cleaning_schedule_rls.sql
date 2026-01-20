-- =====================================================
-- FIX RLS POUR CLEANING_SCHEDULE
-- Correction erreur 403 Forbidden sur INSERT
-- =====================================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS rgpd_all_own_cleaning ON cleaning_schedule;

-- Créer la nouvelle politique avec WITH CHECK
CREATE POLICY rgpd_all_own_cleaning ON cleaning_schedule 
FOR ALL 
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- Vérification
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'cleaning_schedule';
