-- ================================================================
-- FIX DÉFINITIF: cleaning_schedule - Colonne DATE
-- ================================================================
-- Stratégie: Supprimer et recréer PROPREMENT les index problématiques
-- ================================================================

-- Étape 1: Supprimer tous les index sur cleaning_schedule
DROP INDEX IF EXISTS idx_cleaning_date;
DROP INDEX IF EXISTS idx_cleaning_owner;
DROP INDEX IF EXISTS idx_cleaning_schedule_date;
DROP INDEX IF EXISTS idx_cleaning_schedule_owner;

-- Étape 2: Vérifier et ajouter la colonne date si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cleaning_schedule' 
        AND column_name = 'date'
    ) THEN
        ALTER TABLE cleaning_schedule ADD COLUMN date DATE;
        RAISE NOTICE '✅ Colonne date ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne date existe déjà';
    END IF;
END $$;

-- Étape 3: Ajouter toutes les autres colonnes si nécessaires
DO $$
BEGIN
    -- gite_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'gite_name') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN gite_name TEXT;
    END IF;
    
    -- type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'type') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN type TEXT;
    END IF;
    
    -- client_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'client_name') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN client_name TEXT;
    END IF;
    
    -- time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'time') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN time TIME;
    END IF;
    
    -- notes (peut déjà exister)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'notes') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN notes TEXT;
    END IF;
    
    -- validated
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'validated') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN validated BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- validated_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'validated_by') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN validated_by TEXT;
    END IF;
    
    -- validated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'validated_at') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN validated_at TIMESTAMPTZ;
    END IF;
    
    -- reservation_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'reservation_id') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN reservation_id UUID;
    END IF;
    
    -- validated_by_company
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'validated_by_company') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN validated_by_company BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- reservation_end
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'reservation_end') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN reservation_end DATE;
    END IF;
    
    -- reservation_start_after
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'reservation_start_after') THEN
        ALTER TABLE cleaning_schedule ADD COLUMN reservation_start_after DATE;
    END IF;
    
    RAISE NOTICE '✅ Toutes les colonnes vérifiées/ajoutées';
END $$;

-- Étape 4: Attendre un peu (simulé avec pg_sleep)
SELECT pg_sleep(1);

-- Étape 5: Recréer les index proprement
CREATE INDEX IF NOT EXISTS idx_cleaning_owner ON cleaning_schedule(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_date ON cleaning_schedule(date);

-- Étape 6: Vérification finale
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'cleaning_schedule'
ORDER BY ordinal_position;

SELECT '✅ FIX TERMINÉ - Vérifiez les colonnes ci-dessus' as status;
