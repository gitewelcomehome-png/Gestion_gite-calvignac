-- Table pour stocker les simulations fiscales LMP
CREATE TABLE IF NOT EXISTS simulations_fiscales (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Chiffre d'affaires
    chiffre_affaires DECIMAL(10,2) NOT NULL,
    
    -- Charges bien loué
    internet_bien DECIMAL(10,2) DEFAULT 0,
    internet_bien_type VARCHAR(10) DEFAULT 'mensuel',
    eau_bien DECIMAL(10,2) DEFAULT 0,
    eau_bien_type VARCHAR(10) DEFAULT 'mensuel',
    electricite_bien DECIMAL(10,2) DEFAULT 0,
    electricite_bien_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_hab_bien DECIMAL(10,2) DEFAULT 0,
    assurance_hab_bien_type VARCHAR(10) DEFAULT 'mensuel',
    assurance_emprunt_bien DECIMAL(10,2) DEFAULT 0,
    assurance_emprunt_bien_type VARCHAR(10) DEFAULT 'mensuel',
    interets_emprunt_bien DECIMAL(10,2) DEFAULT 0,
    interets_emprunt_bien_type VARCHAR(10) DEFAULT 'mensuel',
    menage DECIMAL(10,2) DEFAULT 0,
    menage_type VARCHAR(10) DEFAULT 'mensuel',
    linge DECIMAL(10,2) DEFAULT 0,
    linge_type VARCHAR(10) DEFAULT 'mensuel',
    travaux DECIMAL(10,2) DEFAULT 0,
    travaux_type VARCHAR(10) DEFAULT 'mensuel',
    frais_divers DECIMAL(10,2) DEFAULT 0,
    frais_divers_type VARCHAR(10) DEFAULT 'mensuel',
    logiciel DECIMAL(10,2) DEFAULT 0,
    logiciel_type VARCHAR(10) DEFAULT 'mensuel',
    taxe_fonciere DECIMAL(10,2) DEFAULT 0,
    cfe DECIMAL(10,2) DEFAULT 0,
    commissions DECIMAL(10,2) DEFAULT 0,
    amortissement DECIMAL(10,2) DEFAULT 0,
    copropriete DECIMAL(10,2) DEFAULT 0,
    copropriete_type VARCHAR(10) DEFAULT 'mensuel',
    produits_accueil DECIMAL(10,2) DEFAULT 0,
    produits_accueil_type VARCHAR(10) DEFAULT 'mensuel',
    
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
