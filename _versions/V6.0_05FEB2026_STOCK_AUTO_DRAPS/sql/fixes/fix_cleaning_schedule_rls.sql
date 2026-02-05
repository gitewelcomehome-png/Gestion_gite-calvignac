-- ================================================================
-- FIX FINAL - cleaning_schedule (21 janvier 2026)
-- Ajouter la colonne proposed_by manquante
-- ================================================================

-- 1) Vérifier les colonnes actuelles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cleaning_schedule'
ORDER BY ordinal_position;

-- 2) Ajouter la colonne proposed_by si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cleaning_schedule' 
        AND column_name = 'proposed_by'
    ) THEN
        ALTER TABLE cleaning_schedule 
        ADD COLUMN proposed_by TEXT CHECK (proposed_by IN ('owner', 'company'));
        
        RAISE NOTICE '✅ Colonne proposed_by ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne proposed_by existe déjà';
    END IF;
END $$;

-- 3) Vérifier que RLS est bien configuré
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

-- 4) Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS rgpd_all_own_cleaning ON cleaning_schedule;
DROP POLICY IF EXISTS cleaning_schedule_select ON cleaning_schedule;
DROP POLICY IF EXISTS cleaning_schedule_insert ON cleaning_schedule;
DROP POLICY IF EXISTS cleaning_schedule_update ON cleaning_schedule;
DROP POLICY IF EXISTS cleaning_schedule_delete ON cleaning_schedule;

-- 5) Créer des politiques séparées pour chaque opération
-- SELECT: Lire ses propres lignes
CREATE POLICY cleaning_schedule_select ON cleaning_schedule 
    FOR SELECT 
    USING (owner_user_id = auth.uid());

-- INSERT: Créer des lignes (avec owner_user_id = auth.uid())
CREATE POLICY cleaning_schedule_insert ON cleaning_schedule 
    FOR INSERT 
    WITH CHECK (owner_user_id = auth.uid());

-- UPDATE: Modifier ses propres lignes (SANS WITH CHECK pour permettre UPDATE sans owner_user_id)
CREATE POLICY cleaning_schedule_update ON cleaning_schedule 
    FOR UPDATE 
    USING (owner_user_id = auth.uid());

-- DELETE: Supprimer ses propres lignes
CREATE POLICY cleaning_schedule_delete ON cleaning_schedule 
    FOR DELETE 
    USING (owner_user_id = auth.uid());

-- 5) Activer RLS (devrait déjà l'être)
ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;

-- 6) Confirmation finale
DO $$
BEGIN
    RAISE NOTICE '✅✅✅ Correction terminée';
    RAISE NOTICE 'La colonne proposed_by est maintenant disponible';
    RAISE NOTICE 'Les boutons du planning ménage devraient fonctionner';
END $$;
