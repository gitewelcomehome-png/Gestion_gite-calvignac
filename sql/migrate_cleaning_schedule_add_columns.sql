-- ============================================================
-- MIGRATION : ajout colonnes manquantes sur cleaning_schedule
-- Date : 2026-03-26
-- Contexte : la table existante n'a pas les colonnes utilisées
--            par validation.html (société de ménage)
-- ============================================================

-- Colonne scheduled_date (alias de date, renommée dans le code)
ALTER TABLE public.cleaning_schedule
    ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Synchroniser scheduled_date depuis date si des lignes existent déjà
UPDATE public.cleaning_schedule
SET scheduled_date = date
WHERE scheduled_date IS NULL AND date IS NOT NULL;

-- Créneau horaire : morning / afternoon
ALTER TABLE public.cleaning_schedule
    ADD COLUMN IF NOT EXISTS time_of_day TEXT
        CHECK (time_of_day IN ('morning', 'afternoon'));

-- Validation par la société
ALTER TABLE public.cleaning_schedule
    ADD COLUMN IF NOT EXISTS validated_by_company BOOLEAN DEFAULT false;

-- Qui a proposé ce ménage : 'company' ou 'owner'
ALTER TABLE public.cleaning_schedule
    ADD COLUMN IF NOT EXISTS proposed_by TEXT
        CHECK (proposed_by IN ('company', 'owner'));

-- Date de fin de réservation (dénormalisée pour affichage rapide)
ALTER TABLE public.cleaning_schedule
    ADD COLUMN IF NOT EXISTS reservation_end DATE;

-- Vérification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'cleaning_schedule'
ORDER BY ordinal_position;
