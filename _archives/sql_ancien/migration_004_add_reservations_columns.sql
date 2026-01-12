-- =========================================
-- MIGRATION 004 : Ajout des colonnes manquantes dans reservations
-- =========================================
-- Date : 2026-01-09
-- Objectif : Ajouter toutes les colonnes métier nécessaires pour la gestion complète des réservations

-- 1. Ajout colonne plateforme (pour tracker la source de réservation)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS plateforme TEXT DEFAULT 'Autre';

-- 2. Ajout colonne montant (montant total de la réservation)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS montant DECIMAL(10,2) DEFAULT 0;

-- 3. Ajout colonne acompte (montant de l'acompte versé)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS acompte DECIMAL(10,2) DEFAULT 0;

-- 4. Ajout colonne restant (montant restant à payer)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS restant DECIMAL(10,2) DEFAULT 0;

-- 5. Ajout colonne paiement (mode de paiement)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS paiement TEXT;

-- 6. Ajout colonne provenance (origine de la réservation)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS provenance TEXT;

-- 7. Ajout colonne nb_personnes (nombre de personnes)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS nb_personnes INTEGER;

-- 8. Ajout colonne telephone (numéro de téléphone du client)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS telephone TEXT;

-- 9. Ajout colonne synced_from (URL iCal source)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS synced_from TEXT;

-- 10. Ajout colonne gite (nom du gîte en texte pour compatibilité)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS gite TEXT;

-- 11. Ajout colonne message_envoye (suivi des messages clients)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS message_envoye BOOLEAN DEFAULT FALSE;

-- 12. Créer un index sur plateforme pour les statistiques
CREATE INDEX IF NOT EXISTS idx_reservations_plateforme ON reservations(plateforme);

-- 13. Créer un index sur check_in pour les recherches par date
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON reservations(check_in);

-- 14. Créer un index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_reservations_gite_dates ON reservations(gite_id, check_in, check_out);

-- 15. Créer un trigger pour calculer automatiquement le montant restant
CREATE OR REPLACE FUNCTION calculate_restant()
RETURNS TRIGGER AS $$
BEGIN
    NEW.restant := NEW.montant - COALESCE(NEW.acompte, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_restant ON reservations;
CREATE TRIGGER trigger_calculate_restant
    BEFORE INSERT OR UPDATE OF montant, acompte ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_restant();

-- 16. Créer un trigger pour synchroniser le nom du gîte
CREATE OR REPLACE FUNCTION sync_gite_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.gite_id IS NOT NULL THEN
        SELECT name INTO NEW.gite FROM gites WHERE id = NEW.gite_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_gite_name ON reservations;
CREATE TRIGGER trigger_sync_gite_name
    BEFORE INSERT OR UPDATE OF gite_id ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION sync_gite_name();

-- =========================================
-- COMMENTAIRES DES COLONNES
-- =========================================

COMMENT ON COLUMN reservations.plateforme IS 'Source de la réservation (airbnb, booking, abritel, etc.)';
COMMENT ON COLUMN reservations.montant IS 'Montant total de la réservation en euros';
COMMENT ON COLUMN reservations.acompte IS 'Montant de l''acompte versé en euros';
COMMENT ON COLUMN reservations.restant IS 'Montant restant à payer (calculé automatiquement)';
COMMENT ON COLUMN reservations.paiement IS 'Mode de paiement (espèces, virement, cb, etc.)';
COMMENT ON COLUMN reservations.provenance IS 'Origine géographique du client';
COMMENT ON COLUMN reservations.nb_personnes IS 'Nombre de personnes pour la réservation';
COMMENT ON COLUMN reservations.telephone IS 'Numéro de téléphone du client';
COMMENT ON COLUMN reservations.synced_from IS 'URL iCal source si synchronisée automatiquement';
COMMENT ON COLUMN reservations.gite IS 'Nom du gîte (dénormalisé pour compatibilité)';
COMMENT ON COLUMN reservations.message_envoye IS 'Indique si le message de bienvenue a été envoyé';
