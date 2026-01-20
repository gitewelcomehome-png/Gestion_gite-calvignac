-- ================================================================
-- MIGRATION: Ajouter colonnes manquantes aux tables existantes
-- ================================================================
-- Date: 11 janvier 2026
-- À exécuter APRÈS nouveau_projet_supabase.sql
-- ================================================================

-- RETOURS_MENAGE: Ajouter colonnes de compatibilité
ALTER TABLE retours_menage ADD COLUMN IF NOT EXISTS gite TEXT;
ALTER TABLE retours_menage ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE retours_menage ADD COLUMN IF NOT EXISTS commentaire TEXT;
ALTER TABLE retours_menage ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT false;

-- STOCKS_DRAPS: Ajouter colonnes compatibles linen_stocks
ALTER TABLE stocks_draps ADD COLUMN IF NOT EXISTS draps_plats_grands INT DEFAULT 0;
ALTER TABLE stocks_draps ADD COLUMN IF NOT EXISTS draps_plats_petits INT DEFAULT 0;
ALTER TABLE stocks_draps ADD COLUMN IF NOT EXISTS housses_couettes_grandes INT DEFAULT 0;
ALTER TABLE stocks_draps ADD COLUMN IF NOT EXISTS housses_couettes_petites INT DEFAULT 0;
ALTER TABLE stocks_draps ADD COLUMN IF NOT EXISTS taies_oreillers INT DEFAULT 0;
ALTER TABLE stocks_draps ADD COLUMN IF NOT EXISTS serviettes INT DEFAULT 0;
ALTER TABLE stocks_draps ADD COLUMN IF NOT EXISTS tapis_bain INT DEFAULT 0;

-- Créer index manquant
CREATE INDEX IF NOT EXISTS idx_retours_menage_validated ON retours_menage(validated);

-- Créer la vue linen_stocks pour compatibilité
CREATE OR REPLACE VIEW linen_stocks AS
SELECT 
    id,
    owner_user_id AS organization_id,
    gite_id,
    draps_plats_grands,
    draps_plats_petits,
    housses_couettes_grandes,
    housses_couettes_petites,
    taies_oreillers,
    serviettes,
    tapis_bain,
    updated_at
FROM stocks_draps;

DO $$
BEGIN
    RAISE NOTICE '✅ Colonnes manquantes ajoutées avec succès';
END $$;
