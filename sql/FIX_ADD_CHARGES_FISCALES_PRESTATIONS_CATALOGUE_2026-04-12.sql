-- ================================================================
-- FIX : Ajout colonne charges_fiscales dans prestations_catalogue
-- DATE : 2026-04-12
-- CAUSE : Le JS envoie charges_fiscales lors de la sauvegarde d'une
--         prestation mais la colonne n'existe pas en BDD → PGRST204
-- SOLUTION : Ajouter la colonne (idempotent)
-- ================================================================

ALTER TABLE public.prestations_catalogue
ADD COLUMN IF NOT EXISTS charges_fiscales NUMERIC(10,2) DEFAULT 0;
