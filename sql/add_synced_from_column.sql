-- ============================================================================
-- AJOUT COLONNE synced_from POUR TRAÇABILITÉ iCAL
-- ============================================================================

-- Ajouter la colonne synced_from si elle n'existe pas déjà
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS synced_from TEXT;

-- Commentaire
COMMENT ON COLUMN reservations.synced_from IS 'Source de synchronisation iCal (Airbnb, Abritel, Gîtes de France, etc.)';

-- Mise à jour des données existantes en fonction du champ 'plateforme'
UPDATE reservations 
SET synced_from = 'Airbnb'
WHERE synced_from IS NULL 
  AND (plateforme ILIKE '%airbnb%');

UPDATE reservations 
SET synced_from = 'Abritel'
WHERE synced_from IS NULL 
  AND (plateforme ILIKE '%abritel%' OR plateforme ILIKE '%homelidays%');

UPDATE reservations 
SET synced_from = 'Gîtes de France (centrale)'
WHERE synced_from IS NULL 
  AND plateforme ILIKE '%gîtes de france%';

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_reservations_synced_from ON reservations(synced_from);
