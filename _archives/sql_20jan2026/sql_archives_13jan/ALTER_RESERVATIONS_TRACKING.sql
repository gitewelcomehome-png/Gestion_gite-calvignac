-- ================================================================
-- ALTER RESERVATIONS - AJOUT COLONNES TRACKING iCal
-- ================================================================
-- Permet de gérer proprement les sync iCal sans écraser les modifs manuelles
-- ================================================================

-- 1. ical_uid : Identifiant unique du iCal (pour éviter les doublons)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS ical_uid TEXT;

-- 2. manual_override : Si TRUE, la réservation a été modifiée manuellement
--    → NE JAMAIS la modifier/supprimer automatiquement lors des syncs
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS manual_override BOOLEAN DEFAULT FALSE;

-- 3. last_seen_in_ical : Dernière fois que cette réservation était présente dans l'iCal
--    → Permet de détecter les annulations (disparue depuis > 7 jours)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS last_seen_in_ical TIMESTAMPTZ;

-- 4. Index pour optimiser les recherches par ical_uid
CREATE INDEX IF NOT EXISTS idx_reservations_ical_uid 
ON reservations(ical_uid) 
WHERE ical_uid IS NOT NULL;

-- 5. Index pour détecter les annulations rapidement
CREATE INDEX IF NOT EXISTS idx_reservations_last_seen 
ON reservations(last_seen_in_ical) 
WHERE source = 'ical' AND manual_override = FALSE;

-- ================================================================
-- COMMENTAIRES
-- ================================================================
COMMENT ON COLUMN reservations.ical_uid IS 'UID unique du événement iCal (pour éviter doublons lors des syncs)';
COMMENT ON COLUMN reservations.manual_override IS 'TRUE si modifiée manuellement → NE PAS toucher lors des syncs iCal';
COMMENT ON COLUMN reservations.last_seen_in_ical IS 'Dernière présence dans le flux iCal (pour détecter annulations)';
