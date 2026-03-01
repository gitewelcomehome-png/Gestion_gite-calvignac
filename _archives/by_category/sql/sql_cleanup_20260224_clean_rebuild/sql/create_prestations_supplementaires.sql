-- ==========================================
-- CRÉATION TABLES PRESTATIONS SUPPLÉMENTAIRES
-- Date: 15 février 2026
-- ==========================================
-- Description: Tables pour la gestion des prestations supplémentaires
-- payantes proposées par les propriétaires aux voyageurs
-- Commission plateforme: 5% par transaction
-- ==========================================

-- ==========================================
-- TABLE: prestations_catalogue
-- ==========================================
-- Catalogue des prestations proposées par chaque gîte

CREATE TABLE IF NOT EXISTS prestations_catalogue (
    id BIGSERIAL PRIMARY KEY,
    gite_id INTEGER NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Informations générales
    nom VARCHAR(255) NOT NULL,
    nom_en VARCHAR(255),
    description TEXT,
    description_en TEXT,
    
    -- Tarification
    prix DECIMAL(10,2) NOT NULL CHECK (prix >= 0),
    devise VARCHAR(3) DEFAULT 'EUR',
    prix_par VARCHAR(50) CHECK (prix_par IN ('unite', 'personne', 'nuit', 'sejour')),
    
    -- Disponibilité & Stock
    is_active BOOLEAN DEFAULT true,
    stock_limite BOOLEAN DEFAULT false,
    stock_disponible INTEGER CHECK (stock_disponible IS NULL OR stock_disponible >= 0),
    
    -- Contraintes de réservation
    delai_reservation INTEGER CHECK (delai_reservation IS NULL OR delai_reservation >= 0), -- en heures
    quantite_min INTEGER DEFAULT 1 CHECK (quantite_min > 0),
    quantite_max INTEGER CHECK (quantite_max IS NULL OR quantite_max >= quantite_min),
    
    -- Catégorisation
    categorie VARCHAR(100) CHECK (categorie IN ('repas', 'activite', 'menage', 'location', 'autre')),
    icone VARCHAR(50),
    
    -- Médias
    photo_url TEXT,
    
    -- Ordre d'affichage
    ordre INTEGER DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT prestations_catalogue_unique_nom_gite UNIQUE (gite_id, nom)
);

CREATE INDEX IF NOT EXISTS idx_prestations_catalogue_gite ON prestations_catalogue(gite_id);
CREATE INDEX IF NOT EXISTS idx_prestations_catalogue_active ON prestations_catalogue(gite_id, is_active);
CREATE INDEX IF NOT EXISTS idx_prestations_catalogue_categorie ON prestations_catalogue(categorie);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_prestations_catalogue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prestations_catalogue_updated_at
    BEFORE UPDATE ON prestations_catalogue
    FOR EACH ROW
    EXECUTE FUNCTION update_prestations_catalogue_updated_at();

-- ==========================================
-- TABLE: commandes_prestations
-- ==========================================
-- Commandes de prestations passées par les clients

CREATE TABLE IF NOT EXISTS commandes_prestations (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relations
    reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    gite_id INTEGER NOT NULL REFERENCES gites(id),
    client_id INTEGER REFERENCES clients(id),
    
    -- Numéro de commande unique
    numero_commande VARCHAR(50) UNIQUE NOT NULL,
    
    -- Montants (en centimes pour éviter problèmes float)
    montant_prestations DECIMAL(10,2) NOT NULL CHECK (montant_prestations >= 0),
    montant_commission DECIMAL(10,2) NOT NULL CHECK (montant_commission >= 0),
    montant_net_owner DECIMAL(10,2) NOT NULL CHECK (montant_net_owner >= 0),
    montant_total DECIMAL(10,2) NOT NULL CHECK (montant_total >= 0),
    devise VARCHAR(3) DEFAULT 'EUR',
    
    -- Statut de la commande
    statut VARCHAR(50) DEFAULT 'pending' CHECK (
        statut IN ('pending', 'paid', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'refunded')
    ),
    
    -- Paiement Stripe
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    date_paiement TIMESTAMPTZ,
    
    -- Dates de suivi
    date_commande TIMESTAMPTZ DEFAULT NOW(),
    date_confirmation TIMESTAMPTZ,
    date_livraison TIMESTAMPTZ,
    date_annulation TIMESTAMPTZ,
    
    -- Notes
    notes_client TEXT,
    notes_owner TEXT,
    motif_annulation TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT commandes_prestations_check_commission CHECK (
        montant_commission = ROUND(montant_prestations * 0.05, 2)
    ),
    CONSTRAINT commandes_prestations_check_net CHECK (
        montant_net_owner = montant_prestations - montant_commission
    ),
    CONSTRAINT commandes_prestations_check_total CHECK (
        montant_total = montant_prestations
    )
);

CREATE INDEX IF NOT EXISTS idx_commandes_prestations_reservation ON commandes_prestations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_commandes_prestations_gite ON commandes_prestations(gite_id);
CREATE INDEX IF NOT EXISTS idx_commandes_prestations_client ON commandes_prestations(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_prestations_statut ON commandes_prestations(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_prestations_date ON commandes_prestations(date_commande DESC);
CREATE INDEX IF NOT EXISTS idx_commandes_prestations_numero ON commandes_prestations(numero_commande);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_commandes_prestations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_commandes_prestations_updated_at
    BEFORE UPDATE ON commandes_prestations
    FOR EACH ROW
    EXECUTE FUNCTION update_commandes_prestations_updated_at();

-- ==========================================
-- TABLE: lignes_commande_prestations
-- ==========================================
-- Détail des prestations dans chaque commande

CREATE TABLE IF NOT EXISTS lignes_commande_prestations (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relations
    commande_id BIGINT NOT NULL REFERENCES commandes_prestations(id) ON DELETE CASCADE,
    prestation_id BIGINT REFERENCES prestations_catalogue(id) ON DELETE SET NULL,
    
    -- Snapshot des infos prestation au moment de la commande
    nom_prestation VARCHAR(255) NOT NULL,
    description TEXT,
    prix_unitaire DECIMAL(10,2) NOT NULL CHECK (prix_unitaire >= 0),
    quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
    prix_total DECIMAL(10,2) NOT NULL CHECK (prix_total >= 0),
    
    -- Notes spécifiques
    notes TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT lignes_commande_prestations_check_total CHECK (
        prix_total = prix_unitaire * quantite
    )
);

CREATE INDEX IF NOT EXISTS idx_lignes_commande_prestations_commande ON lignes_commande_prestations(commande_id);
CREATE INDEX IF NOT EXISTS idx_lignes_commande_prestations_prestation ON lignes_commande_prestations(prestation_id);

-- ==========================================
-- TABLE: transactions_commissions
-- ==========================================
-- Suivi des commissions et virements

CREATE TABLE IF NOT EXISTS transactions_commissions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relations
    commande_id BIGINT NOT NULL REFERENCES commandes_prestations(id) ON DELETE CASCADE,
    gite_id INTEGER NOT NULL REFERENCES gites(id),
    
    -- Montants
    montant_total DECIMAL(10,2) NOT NULL CHECK (montant_total >= 0),
    montant_commission DECIMAL(10,2) NOT NULL CHECK (montant_commission >= 0),
    montant_proprietaire DECIMAL(10,2) NOT NULL CHECK (montant_proprietaire >= 0),
    devise VARCHAR(3) DEFAULT 'EUR',
    
    -- Stripe transfer
    stripe_transfer_id VARCHAR(255), -- ID du virement au propriétaire
    stripe_application_fee_id VARCHAR(255), -- ID de la commission retenue
    
    -- Statut
    statut VARCHAR(50) DEFAULT 'pending' CHECK (
        statut IN ('pending', 'transferred', 'failed')
    ),
    
    -- Dates
    date_transaction TIMESTAMPTZ DEFAULT NOW(),
    date_virement TIMESTAMPTZ,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT transactions_commissions_check_commission CHECK (
        montant_commission = ROUND(montant_total * 0.05, 2)
    ),
    CONSTRAINT transactions_commissions_check_proprietaire CHECK (
        montant_proprietaire = montant_total - montant_commission
    )
);

CREATE INDEX IF NOT EXISTS idx_transactions_commissions_commande ON transactions_commissions(commande_id);
CREATE INDEX IF NOT EXISTS idx_transactions_commissions_gite ON transactions_commissions(gite_id);
CREATE INDEX IF NOT EXISTS idx_transactions_commissions_statut ON transactions_commissions(statut);
CREATE INDEX IF NOT EXISTS idx_transactions_commissions_date ON transactions_commissions(date_transaction DESC);

-- ==========================================
-- FONCTION: Générer numéro de commande
-- ==========================================

CREATE OR REPLACE FUNCTION generer_numero_commande()
RETURNS TEXT AS $$
DECLARE
    numero TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        -- Format: CMD-YYYYMMDD-XXXXX
        numero := 'CMD-' || 
                  TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                  LPAD(FLOOR(RANDOM() * 99999 + 1)::TEXT, 5, '0');
        
        -- Vérifier si le numéro existe déjà
        SELECT EXISTS(
            SELECT 1 FROM commandes_prestations 
            WHERE numero_commande = numero
        ) INTO existe;
        
        EXIT WHEN NOT existe;
    END LOOP;
    
    RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- FONCTION: Calculer montants commande
-- ==========================================

CREATE OR REPLACE FUNCTION calculer_montants_commande(
    p_montant_prestations DECIMAL
)
RETURNS TABLE (
    montant_prestations DECIMAL,
    montant_commission DECIMAL,
    montant_net_owner DECIMAL,
    montant_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p_montant_prestations,
        ROUND(p_montant_prestations * 0.05, 2) AS montant_commission,
        ROUND(p_montant_prestations * 0.95, 2) AS montant_net_owner,
        p_montant_prestations AS montant_total;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================

-- Activer RLS sur toutes les tables
ALTER TABLE prestations_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes_prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_commande_prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_commissions ENABLE ROW LEVEL SECURITY;

-- POLICIES: prestations_catalogue
-- Les clients peuvent voir les prestations actives de leur gîte
CREATE POLICY "Clients can view active prestations"
ON prestations_catalogue FOR SELECT
USING (
    is_active = true 
    AND gite_id IN (
        SELECT gite_id FROM reservations 
        WHERE id IN (
            SELECT reservation_id FROM fiche_client_tokens 
            WHERE token = current_setting('request.jwt.claim.token', true)::TEXT
        )
    )
);

-- Les propriétaires peuvent tout faire sur leurs prestations
CREATE POLICY "Owners can manage their prestations"
ON prestations_catalogue FOR ALL
USING (
    gite_id IN (
        SELECT id FROM gites 
        WHERE owner_id = auth.uid()
    )
);

-- POLICIES: commandes_prestations
-- Les clients peuvent voir leurs propres commandes
CREATE POLICY "Clients can view own orders"
ON commandes_prestations FOR SELECT
USING (
    reservation_id IN (
        SELECT id FROM reservations 
        WHERE id IN (
            SELECT reservation_id FROM fiche_client_tokens 
            WHERE token = current_setting('request.jwt.claim.token', true)::TEXT
        )
    )
);

-- Les clients peuvent créer des commandes pour leur réservation
CREATE POLICY "Clients can create orders"
ON commandes_prestations FOR INSERT
WITH CHECK (
    reservation_id IN (
        SELECT id FROM reservations 
        WHERE id IN (
            SELECT reservation_id FROM fiche_client_tokens 
            WHERE token = current_setting('request.jwt.claim.token', true)::TEXT
        )
    )
);

-- Les propriétaires peuvent voir et modifier les commandes de leurs gîtes
CREATE POLICY "Owners can manage gite orders"
ON commandes_prestations FOR ALL
USING (
    gite_id IN (
        SELECT id FROM gites 
        WHERE owner_id = auth.uid()
    )
);

-- POLICIES: lignes_commande_prestations
-- Les utilisateurs peuvent voir les lignes de leurs commandes
CREATE POLICY "Users can view order lines"
ON lignes_commande_prestations FOR SELECT
USING (
    commande_id IN (
        SELECT id FROM commandes_prestations 
        WHERE reservation_id IN (
            SELECT id FROM reservations 
            WHERE id IN (
                SELECT reservation_id FROM fiche_client_tokens 
                WHERE token = current_setting('request.jwt.claim.token', true)::TEXT
            )
        )
        OR gite_id IN (
            SELECT id FROM gites 
            WHERE owner_id = auth.uid()
        )
    )
);

-- Les clients peuvent créer des lignes pour leurs commandes
CREATE POLICY "Clients can create order lines"
ON lignes_commande_prestations FOR INSERT
WITH CHECK (
    commande_id IN (
        SELECT id FROM commandes_prestations 
        WHERE reservation_id IN (
            SELECT id FROM reservations 
            WHERE id IN (
                SELECT reservation_id FROM fiche_client_tokens 
                WHERE token = current_setting('request.jwt.claim.token', true)::TEXT
            )
        )
    )
);

-- POLICIES: transactions_commissions
-- Seuls les admins et propriétaires peuvent voir les transactions
CREATE POLICY "Owners can view their transactions"
ON transactions_commissions FOR SELECT
USING (
    gite_id IN (
        SELECT id FROM gites 
        WHERE owner_id = auth.uid()
    )
);

-- ==========================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ==========================================

-- Exemple: Prestations pour un gîte de test
/*
INSERT INTO prestations_catalogue (
    gite_id, nom, nom_en, description, description_en, 
    prix, prix_par, categorie, icone, is_active
) VALUES
(1, 'Petit-déjeuner continental', 'Continental Breakfast', 
'Pain frais, viennoiseries, confitures maison, jus de fruits, café/thé', 
'Fresh bread, pastries, homemade jams, fruit juice, coffee/tea',
12.00, 'personne', 'repas', '🥐', true),

(1, 'Ménage intermédiaire', 'Mid-stay Cleaning',
'Ménage complet du logement en milieu de séjour',
'Complete cleaning of the accommodation mid-stay',
50.00, 'unite', 'menage', '🧹', true),

(1, 'Location vélo adulte', 'Adult Bike Rental',
'VTT adulte avec casque et antivol',
'Adult mountain bike with helmet and lock',
15.00, 'nuit', 'location', '🚴', true),

(1, 'Panier gourmand local', 'Local Gourmet Basket',
'Produits du terroir: foie gras, vin, fromages, confitures',
'Local products: foie gras, wine, cheeses, jams',
45.00, 'unite', 'repas', '🧺', true);
*/

-- ==========================================
-- VÉRIFICATIONS
-- ==========================================

-- Vérifier les tables créées
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%prestation%'
ORDER BY table_name;

-- Vérifier les indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE '%prestation%'
ORDER BY tablename, indexname;

-- Vérifier les policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename LIKE '%prestation%'
ORDER BY tablename, policyname;
