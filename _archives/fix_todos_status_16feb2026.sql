-- ================================================================
-- FIX: Ajouter la colonne status à la table todos
-- ================================================================
-- Date: 16 février 2026
-- Raison: Les tâches créées avant n'avaient pas de champ 'status'
--         ce qui les rendait invisibles dans le Kanban
-- ================================================================

-- Étape 1: Ajouter la colonne status si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'status'
    ) THEN
        ALTER TABLE todos 
        ADD COLUMN status TEXT;
        
        RAISE NOTICE '✅ Colonne status ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne status existe déjà';
    END IF;
END $$;

-- Étape 2: Mettre à jour toutes les tâches sans statut
UPDATE todos
SET status = 
    CASE 
        WHEN completed = true THEN 'done'
        ELSE 'todo'
    END,
    updated_at = NOW()
WHERE status IS NULL OR status = '';

-- Étape 3: Rendre la colonne NON NULL avec une valeur par défaut
ALTER TABLE todos 
ALTER COLUMN status SET DEFAULT 'todo',
ALTER COLUMN status SET NOT NULL;

-- Étape 4: Vérifier le résultat
SELECT 
    status,
    COUNT(*) as nombre_taches
FROM todos
GROUP BY status
ORDER BY status;
