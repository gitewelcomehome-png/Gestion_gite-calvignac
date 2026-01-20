-- ================================================================
-- FIX RLS FISCAL_HISTORY - Row Level Security
-- ================================================================
-- Date: 15 janvier 2026
-- Problème: INSERT bloqué par politique RLS
-- ================================================================

-- Activer RLS sur la table
ALTER TABLE fiscal_history ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Voir uniquement ses propres données
DROP POLICY IF EXISTS "Users can view their own fiscal history" ON fiscal_history;
CREATE POLICY "Users can view their own fiscal history"
ON fiscal_history FOR SELECT
TO authenticated
USING (auth.uid() = owner_user_id);

-- Politique INSERT: Créer ses propres données
DROP POLICY IF EXISTS "Users can insert their own fiscal history" ON fiscal_history;
CREATE POLICY "Users can insert their own fiscal history"
ON fiscal_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

-- Politique UPDATE: Modifier ses propres données
DROP POLICY IF EXISTS "Users can update their own fiscal history" ON fiscal_history;
CREATE POLICY "Users can update their own fiscal history"
ON fiscal_history FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Politique DELETE: Supprimer ses propres données
DROP POLICY IF EXISTS "Users can delete their own fiscal history" ON fiscal_history;
CREATE POLICY "Users can delete their own fiscal history"
ON fiscal_history FOR DELETE
TO authenticated
USING (auth.uid() = owner_user_id);

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
WHERE tablename = 'fiscal_history';
