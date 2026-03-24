-- ==================================================================================
-- ADD GITES CATEGORIE_HEBERGEMENT - 24/03/2026
-- Objectif: Ajouter la colonne categorie_hebergement à la table gites
-- Valeurs: 'gite' (défaut) | 'chambre_hotes'
-- ==================================================================================

BEGIN;

ALTER TABLE IF EXISTS public.gites
    ADD COLUMN IF NOT EXISTS categorie_hebergement VARCHAR(40) DEFAULT 'gite';

COMMIT;
