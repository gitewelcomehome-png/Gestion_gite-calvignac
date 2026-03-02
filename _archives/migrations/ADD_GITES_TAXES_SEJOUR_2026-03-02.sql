-- ==================================================================================
-- ADD GITES TAXES SEJOUR FIELDS - 02/03/2026
-- Objectif: Stocker le tarif taxe de séjour et les plateformes prélevant la taxe
--           directement sur le gîte (pas de nouvelle table)
-- ==================================================================================

BEGIN;

ALTER TABLE IF EXISTS public.gites
    ADD COLUMN IF NOT EXISTS taxe_sejour_tarif NUMERIC(6,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS taxe_sejour_plateformes JSONB DEFAULT '[]'::jsonb;

COMMIT;
