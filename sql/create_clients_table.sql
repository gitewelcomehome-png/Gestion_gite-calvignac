-- Table pour les fiches clients (FR + EN)
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    
    -- Informations de base (pas de traduction nécessaire)
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255),
    email VARCHAR(255),
    telephone VARCHAR(50),
    date_naissance DATE,
    nationalite VARCHAR(100),
    
    -- Adresse (FR)
    adresse TEXT,
    code_postal VARCHAR(20),
    ville VARCHAR(100),
    pays VARCHAR(100),
    
    -- Adresse (EN)
    adresse_en TEXT,
    code_postal_en VARCHAR(20),
    ville_en VARCHAR(100),
    pays_en VARCHAR(100),
    
    -- Préférences et notes (FR)
    preferences TEXT,
    allergies TEXT,
    demandes_speciales TEXT,
    historique_sejours TEXT,
    notes_internes TEXT,
    
    -- Préférences et notes (EN)
    preferences_en TEXT,
    allergies_en TEXT,
    demandes_speciales_en TEXT,
    historique_sejours_en TEXT,
    notes_internes_en TEXT,
    
    -- Informations supplémentaires
    langue_preferee VARCHAR(10) DEFAULT 'fr', -- 'fr' ou 'en'
    source_reservation VARCHAR(100), -- Airbnb, Booking, Direct, etc.
    statut VARCHAR(50) DEFAULT 'actif', -- actif, inactif, vip
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    derniere_reservation DATE
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);
CREATE INDEX IF NOT EXISTS idx_clients_langue ON clients(langue_preferee);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_clients_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS set_clients_timestamp ON clients;
CREATE TRIGGER set_clients_timestamp
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_timestamp();

-- Permissions
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous
CREATE POLICY "Allow public read access on clients"
    ON clients FOR SELECT
    USING (true);

-- Politique pour permettre l'insertion/mise à jour à tous
CREATE POLICY "Allow public insert on clients"
    ON clients FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on clients"
    ON clients FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on clients"
    ON clients FOR DELETE
    USING (true);
