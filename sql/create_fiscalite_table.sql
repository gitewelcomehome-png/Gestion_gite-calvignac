-- Table pour stocker les simulations fiscales LMP
CREATE TABLE IF NOT EXISTS simulations_fiscales (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Chiffre d'affaires
    chiffre_affaires DECIMAL(10,2) NOT NULL,
    
    -- Charges COUZON
    internet_couzon DECIMAL(10,2) DEFAULT 0,
    internet_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    eau_couzon DECIMAL(10,2) DEFAULT 0,
    eau_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    electricite_couzon DECIMAL(10,2) DEFAULT 0,
    electricite_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_hab_couzon DECIMAL(10,2) DEFAULT 0,
    assurance_hab_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_emprunt_couzon DECIMAL(10,2) DEFAULT 0,
    assurance_emprunt_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    interets_emprunt_couzon DECIMAL(10,2) DEFAULT 0,
    interets_emprunt_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    menage_couzon DECIMAL(10,2) DEFAULT 0,
    menage_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    linge_couzon DECIMAL(10,2) DEFAULT 0,
    linge_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    logiciel_couzon DECIMAL(10,2) DEFAULT 0,
    logiciel_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    taxe_fonciere_couzon DECIMAL(10,2) DEFAULT 0,
    cfe_couzon DECIMAL(10,2) DEFAULT 0,
    commissions_couzon DECIMAL(10,2) DEFAULT 0,
    amortissement_couzon DECIMAL(10,2) DEFAULT 0,
    copropriete_couzon DECIMAL(10,2) DEFAULT 0,
    copropriete_couzon_type VARCHAR(10) DEFAULT 'mensuel',
    
    -- Charges TRÉVOUX
    internet_trevoux DECIMAL(10,2) DEFAULT 0,
    internet_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    eau_trevoux DECIMAL(10,2) DEFAULT 0,
    eau_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    electricite_trevoux DECIMAL(10,2) DEFAULT 0,
    electricite_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_hab_trevoux DECIMAL(10,2) DEFAULT 0,
    assurance_hab_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_emprunt_trevoux DECIMAL(10,2) DEFAULT 0,
    assurance_emprunt_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    interets_emprunt_trevoux DECIMAL(10,2) DEFAULT 0,
    interets_emprunt_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    menage_trevoux DECIMAL(10,2) DEFAULT 0,
    menage_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    linge_trevoux DECIMAL(10,2) DEFAULT 0,
    linge_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    logiciel_trevoux DECIMAL(10,2) DEFAULT 0,
    logiciel_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    taxe_fonciere_trevoux DECIMAL(10,2) DEFAULT 0,
    cfe_trevoux DECIMAL(10,2) DEFAULT 0,
    commissions_trevoux DECIMAL(10,2) DEFAULT 0,
    amortissement_trevoux DECIMAL(10,2) DEFAULT 0,
    copropriete_trevoux DECIMAL(10,2) DEFAULT 0,
    copropriete_trevoux_type VARCHAR(10) DEFAULT 'mensuel',
    
    -- Listes d'items (stockées en JSONB)
    travaux_liste JSONB DEFAULT '[]'::jsonb,
    frais_divers_liste JSONB DEFAULT '[]'::jsonb,
    produits_accueil_liste JSONB DEFAULT '[]'::jsonb,
    
    -- Résidence principale (bureau)
    surface_bureau DECIMAL(10,2) DEFAULT 0,
    surface_totale DECIMAL(10,2) DEFAULT 0,
    interets_residence DECIMAL(10,2) DEFAULT 0,
    interets_residence_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_residence DECIMAL(10,2) DEFAULT 0,
    assurance_residence_type VARCHAR(10) DEFAULT 'mensuel',
    electricite_residence DECIMAL(10,2) DEFAULT 0,
    electricite_residence_type VARCHAR(10) DEFAULT 'mensuel',
    internet_residence DECIMAL(10,2) DEFAULT 0,
    internet_residence_type VARCHAR(10) DEFAULT 'mensuel',
    eau_residence DECIMAL(10,2) DEFAULT 0,
    eau_residence_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_hab_residence DECIMAL(10,2) DEFAULT 0,
    assurance_hab_residence_type VARCHAR(10) DEFAULT 'mensuel',
    taxe_fonciere_residence DECIMAL(10,2) DEFAULT 0,
    
    -- Frais professionnels
    comptable DECIMAL(10,2) DEFAULT 0,
    frais_bancaires DECIMAL(10,2) DEFAULT 0,
    telephone DECIMAL(10,2) DEFAULT 0,
    telephone_type VARCHAR(10) DEFAULT 'mensuel',
    materiel_info DECIMAL(10,2) DEFAULT 0,
    rc_pro DECIMAL(10,2) DEFAULT 0,
    formation DECIMAL(10,2) DEFAULT 0,
    fournitures DECIMAL(10,2) DEFAULT 0,
    fournitures_type VARCHAR(10) DEFAULT 'mensuel',
    
    -- Véhicule
    vehicule_option VARCHAR(20) DEFAULT 'bareme',
    puissance_fiscale INTEGER DEFAULT 5,
    km_professionnels INTEGER DEFAULT 0,
    carburant DECIMAL(10,2) DEFAULT 0,
    carburant_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_auto DECIMAL(10,2) DEFAULT 0,
    assurance_auto_type VARCHAR(10) DEFAULT 'mensuel',
    entretien_auto DECIMAL(10,2) DEFAULT 0,
    amortissement_auto DECIMAL(10,2) DEFAULT 0,
    usage_pro_pourcent INTEGER DEFAULT 0,
    
    -- Résultats calculés
    total_charges DECIMAL(10,2),
    benefice_imposable DECIMAL(10,2),
    cotisations_urssaf DECIMAL(10,2),
    reste_avant_ir DECIMAL(10,2),
    trimestres_retraite INTEGER,
    
    -- Métadonnées
    nom_simulation VARCHAR(255),
    notes TEXT
);

-- Index pour accélérer les recherches
CREATE INDEX idx_simulations_created_at ON simulations_fiscales(created_at DESC);
