-- ================================================================
-- FIX : Colonnes manquantes dans cm_clients
-- Date : 2026-03-24
-- Contexte : Ces colonnes sont attendues par tout le JS (onboarding,
--            admin-clients, admin-dashboard, subscription-manager…)
--            mais n'ont pas été ajoutées lors de la création initiale.
-- ================================================================
-- ⚠️ À exécuter UNE SEULE FOIS dans le Supabase SQL Editor
-- ================================================================

ALTER TABLE public.cm_clients
    ADD COLUMN IF NOT EXISTS adresse          TEXT,
    ADD COLUMN IF NOT EXISTS code_postal      TEXT,
    ADD COLUMN IF NOT EXISTS ville            TEXT,
    ADD COLUMN IF NOT EXISTS pays             TEXT DEFAULT 'France',
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS trial_ends_at    TIMESTAMPTZ;

-- Index utile pour les recherches par ville
CREATE INDEX IF NOT EXISTS idx_cm_clients_ville ON public.cm_clients(ville);

-- ----------------------------------------------------------------
-- Vérification : toutes les colonnes attendues par le JS
-- ----------------------------------------------------------------
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'cm_clients'
ORDER BY ordinal_position;
