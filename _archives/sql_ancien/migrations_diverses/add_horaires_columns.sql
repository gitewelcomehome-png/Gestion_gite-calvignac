-- Ajout des colonnes pour les horaires d'arrivée et départ
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS check_in_time TIME,
ADD COLUMN IF NOT EXISTS check_out_time TIME;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reservations_check_in_time ON reservations(check_in_time);
CREATE INDEX IF NOT EXISTS idx_reservations_check_out_time ON reservations(check_out_time);

-- Commentaires
COMMENT ON COLUMN reservations.check_in_time IS 'Heure d''arrivée validée par le propriétaire';
COMMENT ON COLUMN reservations.check_out_time IS 'Heure de départ validée par le propriétaire';
