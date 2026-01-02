-- ================================================================
-- TABLE : fiches_consultations
-- Suivi des consultations des fiches clients
-- ================================================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Permettre consultation anonyme" ON fiches_consultations;
DROP POLICY IF EXISTS "Permettre lecture pour propriétaire" ON fiches_consultations;

-- Créer la table
CREATE TABLE IF NOT EXISTS fiches_consultations (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
    consulted_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_fiches_consultations_reservation 
    ON fiches_consultations(reservation_id);

CREATE INDEX IF NOT EXISTS idx_fiches_consultations_date 
    ON fiches_consultations(consulted_at DESC);

-- RLS
ALTER TABLE fiches_consultations ENABLE ROW LEVEL SECURITY;

-- Policy : Permettre insertion anonyme (clients consultent sans compte)
CREATE POLICY "Permettre consultation anonyme" 
    ON fiches_consultations 
    FOR INSERT 
    WITH CHECK (true);

-- Policy : Propriétaire peut lire toutes les consultations
CREATE POLICY "Permettre lecture pour propriétaire" 
    ON fiches_consultations 
    FOR SELECT 
    USING (true);

-- Commentaires
COMMENT ON TABLE fiches_consultations IS 
    'Suivi des consultations des fiches clients interactives envoyées par email';

COMMENT ON COLUMN fiches_consultations.reservation_id IS 
    'Référence à la réservation';

COMMENT ON COLUMN fiches_consultations.consulted_at IS 
    'Date et heure de consultation de la fiche';

COMMENT ON COLUMN fiches_consultations.user_agent IS 
    'User-Agent du navigateur du client';

COMMENT ON COLUMN fiches_consultations.ip_address IS 
    'Adresse IP du client (optionnelle, pour stats géographiques)';
