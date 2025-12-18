-- Supprimer l'ancienne table si elle existe (ATTENTION: supprime les données!)
DROP TABLE IF EXISTS infos_gites CASCADE;

-- Table pour les informations pratiques des gîtes (FR + EN)
CREATE TABLE infos_gites (
    id SERIAL PRIMARY KEY,
    gite VARCHAR(50) UNIQUE NOT NULL, -- 'trevoux' ou 'couzon'
    
    -- Section 1: Base (FR)
    adresse TEXT,
    telephone TEXT,
    gps_lat TEXT,
    gps_lon TEXT,
    email TEXT,
    
    -- Section 1: Base (EN)
    adresse_en TEXT,
    telephone_en TEXT,
    email_en TEXT,
    
    -- Section 2: WiFi (FR)
    wifi_ssid TEXT,
    wifi_password TEXT,
    wifi_debit TEXT,
    wifi_localisation TEXT,
    wifi_zones TEXT,
    
    -- Section 2: WiFi (EN)
    wifi_ssid_en TEXT,
    wifi_password_en TEXT,
    wifi_debit_en TEXT,
    wifi_localisation_en TEXT,
    wifi_zones_en TEXT,
    
    -- Section 3: Arrivée (FR)
    heure_arrivee TEXT,
    arrivee_tardive TEXT,
    parking_dispo TEXT,
    parking_places TEXT,
    parking_details TEXT,
    type_acces TEXT,
    code_acces TEXT,
    instructions_cles TEXT,
    etage TEXT,
    ascenseur TEXT,
    itineraire_logement TEXT,
    premiere_visite TEXT,
    
    -- Section 3: Arrivée (EN)
    heure_arrivee_en TEXT,
    arrivee_tardive_en TEXT,
    parking_dispo_en TEXT,
    parking_places_en TEXT,
    parking_details_en TEXT,
    type_acces_en TEXT,
    code_acces_en TEXT,
    instructions_cles_en TEXT,
    etage_en TEXT,
    ascenseur_en TEXT,
    itineraire_logement_en TEXT,
    premiere_visite_en TEXT,
    
    -- Section 4: Logement (FR)
    type_chauffage TEXT,
    climatisation TEXT,
    instructions_chauffage TEXT,
    equipements_cuisine TEXT,
    instructions_four TEXT,
    instructions_plaques TEXT,
    instructions_lave_vaisselle TEXT,
    instructions_lave_linge TEXT,
    seche_linge TEXT,
    fer_repasser TEXT,
    linge_fourni TEXT,
    configuration_chambres TEXT,
    
    -- Section 4: Logement (EN)
    type_chauffage_en TEXT,
    climatisation_en TEXT,
    instructions_chauffage_en TEXT,
    equipements_cuisine_en TEXT,
    instructions_four_en TEXT,
    instructions_plaques_en TEXT,
    instructions_lave_vaisselle_en TEXT,
    instructions_lave_linge_en TEXT,
    seche_linge_en TEXT,
    fer_repasser_en TEXT,
    linge_fourni_en TEXT,
    configuration_chambres_en TEXT,
    
    -- Section 5: Déchets (FR)
    instructions_tri TEXT,
    jours_collecte TEXT,
    decheterie TEXT,
    
    -- Section 5: Déchets (EN)
    instructions_tri_en TEXT,
    jours_collecte_en TEXT,
    decheterie_en TEXT,
    
    -- Section 6: Sécurité (FR)
    detecteur_fumee TEXT,
    extincteur TEXT,
    coupure_eau TEXT,
    disjoncteur TEXT,
    consignes_urgence TEXT,
    
    -- Section 6: Sécurité (EN)
    detecteur_fumee_en TEXT,
    extincteur_en TEXT,
    coupure_eau_en TEXT,
    disjoncteur_en TEXT,
    consignes_urgence_en TEXT,
    
    -- Section 7: Départ (FR)
    heure_depart TEXT,
    depart_tardif TEXT,
    checklist_depart TEXT,
    restitution_cles TEXT,
    
    -- Section 7: Départ (EN)
    heure_depart_en TEXT,
    depart_tardif_en TEXT,
    checklist_depart_en TEXT,
    restitution_cles_en TEXT,
    
    -- Section 8: Règlement (FR)
    tabac TEXT,
    animaux TEXT,
    nb_max_personnes TEXT,
    caution TEXT,
    
    -- Section 8: Règlement (EN)
    tabac_en TEXT,
    animaux_en TEXT,
    nb_max_personnes_en TEXT,
    caution_en TEXT,
    
    date_modification TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide par gîte
CREATE INDEX IF NOT EXISTS idx_infos_gites_gite ON infos_gites(gite);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_infos_gites_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS set_infos_gites_timestamp ON infos_gites;
CREATE TRIGGER set_infos_gites_timestamp
    BEFORE UPDATE ON infos_gites
    FOR EACH ROW
    EXECUTE FUNCTION update_infos_gites_timestamp();

-- Permissions
ALTER TABLE infos_gites ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous
CREATE POLICY "Allow public read access on infos_gites"
    ON infos_gites FOR SELECT
    USING (true);

-- Politique pour permettre l'insertion/mise à jour à tous
CREATE POLICY "Allow public insert on infos_gites"
    ON infos_gites FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on infos_gites"
    ON infos_gites FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on infos_gites"
    ON infos_gites FOR DELETE
    USING (true);

-- Insérer les lignes par défaut pour les deux gîtes
INSERT INTO infos_gites (gite) VALUES ('trevoux')
ON CONFLICT (gite) DO NOTHING;

INSERT INTO infos_gites (gite) VALUES ('couzon')
ON CONFLICT (gite) DO NOTHING;
