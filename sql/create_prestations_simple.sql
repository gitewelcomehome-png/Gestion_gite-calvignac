-- ==========================================
-- CRÉATION TABLES PRESTATIONS SUPPLÉMENTAIRES (VERSION SIMPLE)
-- Date: 15 février 2026
-- Version: 1.1 - Commission configurable
-- ==========================================

-- ==========================================
-- TABLE: system_config (Configuration globale)
-- ==========================================
CREATE TABLE IF NOT EXISTS system_config (
    id BIGSERIAL PRIMARY KEY,
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer config commission par défaut
INSERT INTO system_config (cle, valeur, description) 
VALUES ('commission_prestations_percent', '5', 'Pourcentage de commission sur les prestations (sans le symbole %)')
ON CONFLICT (cle) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_system_config_cle ON system_config(cle);

-- ==========================================
-- TABLE: prestations_catalogue
-- ==========================================
CREATE TABLE IF NOT EXISTS prestations_catalogue (
    id BIGSERIAL PRIMARY KEY,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Informations
    nom VARCHAR(255) NOT NULL,
    nom_en VARCHAR(255),
    description TEXT,
    description_en TEXT,
    
    -- Tarification
    prix DECIMAL(10,2) NOT NULL CHECK (prix >= 0),
    devise VARCHAR(3) DEFAULT 'EUR',
    
    -- Charges fiscales (pour calculs fiscaux propriétaire)
    charges_fiscales DECIMAL(10,2) DEFAULT 0 CHECK (charges_fiscales >= 0),
    
    -- Disponibilité
    is_active BOOLEAN DEFAULT true,
    
    -- Catégorisation
    categorie VARCHAR(100) CHECK (categorie IN ('repas', 'activite', 'menage', 'location', 'autre')),
    icone VARCHAR(50) DEFAULT '📦',
    
    -- Photo
    photo_url TEXT,
    
    -- Ordre
    ordre INTEGER DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestations_gite ON prestations_catalogue(gite_id);
CREATE INDEX IF NOT EXISTS idx_prestations_active ON prestations_catalogue(gite_id, is_active);

-- ==========================================
-- TABLE: commandes_prestations
-- ==========================================
CREATE TABLE IF NOT EXISTS commandes_prestations (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relations
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id),
    
    -- Numéro commande
    numero_commande VARCHAR(50) UNIQUE NOT NULL,
    
    -- Montants
    montant_prestations DECIMAL(10,2) NOT NULL CHECK (montant_prestations >= 0),
    montant_commission DECIMAL(10,2) NOT NULL CHECK (montant_commission >= 0),
    montant_net_owner DECIMAL(10,2) NOT NULL CHECK (montant_net_owner >= 0),
    devise VARCHAR(3) DEFAULT 'EUR',
    
    -- Statut
    statut VARCHAR(50) DEFAULT 'paid', -- 'paid', 'confirmed', 'delivered', 'cancelled'
    
    -- Paiement (bouchon)
    methode_paiement VARCHAR(50) DEFAULT 'carte', -- 'carte', 'especes', 'cheque'
    date_paiement TIMESTAMPTZ DEFAULT NOW(),
    
    -- Dates
    date_commande TIMESTAMPTZ DEFAULT NOW(),
    date_confirmation TIMESTAMPTZ,
    date_livraison TIMESTAMPTZ,
    
    -- Notes
    notes_client TEXT,
    notes_owner TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commandes_reservation ON commandes_prestations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_commandes_gite ON commandes_prestations(gite_id);
CREATE INDEX IF NOT EXISTS idx_commandes_date ON commandes_prestations(date_commande DESC);

-- ==========================================
-- TABLE: lignes_commande_prestations
-- ==========================================
CREATE TABLE IF NOT EXISTS lignes_commande_prestations (
    id BIGSERIAL PRIMARY KEY,
    
    commande_id BIGINT NOT NULL REFERENCES commandes_prestations(id) ON DELETE CASCADE,
    prestation_id BIGINT REFERENCES prestations_catalogue(id) ON DELETE SET NULL,
    
    -- Snapshot
    nom_prestation VARCHAR(255) NOT NULL,
    prix_unitaire DECIMAL(10,2) NOT NULL CHECK (prix_unitaire >= 0),
    quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
    prix_total DECIMAL(10,2) NOT NULL CHECK (prix_total >= 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lignes_commande ON lignes_commande_prestations(commande_id);

-- ==========================================
-- FONCTION: Générer numéro commande
-- ==========================================
CREATE OR REPLACE FUNCTION generer_numero_commande()
RETURNS TEXT AS $$
DECLARE
    numero TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        numero := 'CMD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 99999 + 1)::TEXT, 5, '0');
        SELECT EXISTS(SELECT 1 FROM commandes_prestations WHERE numero_commande = numero) INTO existe;
        EXIT WHEN NOT existe;
    END LOOP;
    RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VUE: Statistiques CA Prestations par gîte/mois
-- ==========================================
CREATE OR REPLACE VIEW v_ca_prestations_mensuel AS
SELECT 
    g.id AS gite_id,
    g.name AS gite_nom,
    DATE_TRUNC('month', cp.date_commande) AS mois,
    COUNT(cp.id) AS nb_commandes,
    SUM(cp.montant_prestations) AS ca_brut,
    SUM(cp.montant_commission) AS commissions,
    SUM(cp.montant_net_owner) AS ca_net,
    ROUND(AVG(cp.montant_prestations), 2) AS panier_moyen
FROM gites g
LEFT JOIN commandes_prestations cp ON g.id = cp.gite_id
WHERE cp.statut != 'cancelled'
GROUP BY g.id, g.name, DATE_TRUNC('month', cp.date_commande)
ORDER BY g.id, mois DESC;

-- ==========================================
-- VUE: Statistiques CA Prestations annuel
-- ==========================================
CREATE OR REPLACE VIEW v_ca_prestations_annuel AS
SELECT 
    g.id AS gite_id,
    g.name AS gite_nom,
    EXTRACT(YEAR FROM cp.date_commande) AS annee,
    COUNT(cp.id) AS nb_commandes,
    SUM(cp.montant_prestations) AS ca_brut,
    SUM(cp.montant_commission) AS commissions,
    SUM(cp.montant_net_owner) AS ca_net,
    ROUND(AVG(cp.montant_prestations), 2) AS panier_moyen
FROM gites g
LEFT JOIN commandes_prestations cp ON g.id = cp.gite_id
WHERE cp.statut != 'cancelled'
GROUP BY g.id, g.name, EXTRACT(YEAR FROM cp.date_commande)
ORDER BY g.id, annee DESC;

-- ==========================================
-- DONNÉES DE TEST (À ADAPTER)
-- ==========================================
-- ⚠️ IMPORTANT : Remplacer 'VOTRE-UUID-GITE' et 'VOTRE-UUID-RESERVATION' 
-- par des UUIDs valides de votre base de données avant d'exécuter

-- Exemple de commande pour récupérer un UUID de gîte :
-- SELECT id FROM gites LIMIT 1;

/*
-- Prestations exemples
INSERT INTO prestations_catalogue (gite_id, nom, nom_en, description, description_en, prix, categorie, icone, is_active) VALUES
('VOTRE-UUID-GITE'::uuid, 'Petit-déjeuner continental', 'Continental Breakfast', 
 'Pain frais, viennoiseries, confitures maison, jus de fruits', 
 'Fresh bread, pastries, homemade jams, fruit juice',
 12.00, 'repas', '🥐', true),
 
('VOTRE-UUID-GITE'::uuid, 'Ménage intermédiaire', 'Mid-stay Cleaning',
 'Ménage complet du logement en milieu de séjour',
 'Complete cleaning mid-stay',
 50.00, 'menage', '🧹', true),
 
('VOTRE-UUID-GITE'::uuid, 'Location vélo adulte', 'Adult Bike Rental',
 'VTT avec casque et antivol, par jour',
 'Mountain bike with helmet and lock, per day',
 15.00, 'location', '🚴', true),
 
('VOTRE-UUID-GITE'::uuid, 'Panier gourmand local', 'Local Gourmet Basket',
 'Produits du terroir: foie gras, vin, fromages',
 'Local products: foie gras, wine, cheeses',
 45.00, 'repas', '🧺', true);

-- Commande exemple
DO $$
DECLARE
    v_numero_commande TEXT;
    v_commande_id BIGINT;
    v_montant_brut DECIMAL(10,2) := 77.00;
    v_commission DECIMAL(10,2) := 3.85;
    v_net DECIMAL(10,2) := 73.15;
BEGIN
    v_numero_commande := generer_numero_commande();
    
    INSERT INTO commandes_prestations (
        reservation_id, gite_id, numero_commande,
        montant_prestations, montant_commission, montant_net_owner,
        statut, date_paiement, date_confirmation
    ) VALUES (
        'VOTRE-UUID-RESERVATION'::uuid, 'VOTRE-UUID-GITE'::uuid, v_numero_commande,
        v_montant_brut, v_commission, v_net,
        'delivered', NOW(), NOW()
    ) RETURNING id INTO v_commande_id;
    
    INSERT INTO lignes_commande_prestations (commande_id, prestation_id, nom_prestation, prix_unitaire, quantite, prix_total) VALUES
    (v_commande_id, 1, 'Petit-déjeuner continental', 12.00, 2, 24.00),
    (v_commande_id, 2, 'Ménage intermédiaire', 50.00, 1, 50.00),
    (v_commande_id, 3, 'Location vélo adulte', 15.00, 1, 15.00);
END $$;
*/
