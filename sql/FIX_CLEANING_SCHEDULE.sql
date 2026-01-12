-- ================================================================
-- FIX CLEANING_SCHEDULE - Script simple et direct
-- ================================================================
-- Exécutez ce script SEUL, AVANT le script complet
-- ================================================================

-- Étape 1: Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Étape 2: Ajouter chaque colonne individuellement
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS gite_name TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS time TIME;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_by TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_id UUID;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_by_company BOOLEAN DEFAULT FALSE;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_end DATE;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_start_after DATE;

-- Étape 3: Vérifier les colonnes ajoutées
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cleaning_schedule' 
ORDER BY ordinal_position;
