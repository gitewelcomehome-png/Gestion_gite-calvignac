-- Table pour stocker les demandes d'horaires flexibles des clients
-- (arrivée anticipée / départ tardif)

CREATE TABLE IF NOT EXISTS public.demandes_horaires (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL,
    client_nom TEXT,
    client_prenom TEXT,
    gite TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('arrivee', 'depart')),
    heure_demandee TIME NOT NULL,
    heure_validee TIME,
    statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
    raison_refus TEXT,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    validated_by TEXT,
    CONSTRAINT fk_reservation 
        FOREIGN KEY (reservation_id) 
        REFERENCES reservations(id) 
        ON DELETE CASCADE
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_reservation ON demandes_horaires(reservation_id);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_statut ON demandes_horaires(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_gite ON demandes_horaires(gite);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_dates ON demandes_horaires(date_debut, date_fin);

-- Désactiver RLS pour simplifier l'accès
ALTER TABLE public.demandes_horaires DISABLE ROW LEVEL SECURITY;

-- Commentaires
COMMENT ON TABLE demandes_horaires IS 'Stocke les demandes d''horaires flexibles (arrivée/départ) des clients';
COMMENT ON COLUMN demandes_horaires.type IS 'Type de demande: arrivee ou depart';
COMMENT ON COLUMN demandes_horaires.statut IS 'Statut: en_attente, validee, refusee';
COMMENT ON COLUMN demandes_horaires.heure_validee IS 'Heure finale validée par le gestionnaire (peut différer de l''heure demandée)';
