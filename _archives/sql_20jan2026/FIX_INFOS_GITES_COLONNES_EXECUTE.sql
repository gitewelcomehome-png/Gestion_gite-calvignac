-- ================================================================
-- CRÉATION/MISE À JOUR DE LA TABLE infos_gites
-- ================================================================
-- Date: 20 janvier 2026
-- Objectif: Aligner le schéma DB avec le code JavaScript existant
-- ATTENTION: Cette table stocke les infos détaillées des gîtes
--            (différente de infos_pratiques qui est pour infos dynamiques clients)
-- ================================================================

-- Vérification: Cette table existe-t-elle déjà ?
-- Si OUI : Les ALTER TABLE s'exécuteront
-- Si NON : Il faut la créer d'abord (voir section CREATE TABLE en bas)

-- ================================================================
-- OPTION 1: SI LA TABLE EXISTE DÉJÀ - AJOUT COLONNES
-- ================================================================

-- Colonnes de base (identifiants et coordonnées)
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS gite TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS gps_lat DECIMAL(10, 8);
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS gps_lon DECIMAL(11, 8);
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS adresse_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS telephone_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS email_en TEXT;

-- Renommer wifi_name en wifi_ssid (standard WiFi) - conditionnel
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'infos_gites' 
        AND column_name = 'wifi_name'
    ) THEN
        ALTER TABLE public.infos_gites RENAME COLUMN wifi_name TO wifi_ssid;
    END IF;
END $$;

-- Colonnes WiFi additionnelles
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_ssid TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_debit TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_localisation TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_zones TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_ssid_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_password_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_debit_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_localisation_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_zones_en TEXT;

-- Colonnes Arrivée
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_arrivee TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS arrivee_tardive TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_dispo TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_places TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_details TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS type_acces TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS code_acces TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_cles TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS etage TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS ascenseur TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS itineraire_logement TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS premiere_visite TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_arrivee_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS arrivee_tardive_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_dispo_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_places_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_details_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS type_acces_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS code_acces_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_cles_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS etage_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS ascenseur_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS itineraire_logement_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS premiere_visite_en TEXT;

-- Colonnes Logement
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS type_chauffage TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS climatisation TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_chauffage TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS equipements_cuisine TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_four TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_plaques TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_vaisselle TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_linge TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS seche_linge TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS fer_repasser TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS linge_fourni TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS configuration_chambres TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS type_chauffage_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS climatisation_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_chauffage_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS equipements_cuisine_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_four_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_plaques_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_vaisselle_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_linge_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS seche_linge_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS fer_repasser_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS linge_fourni_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS configuration_chambres_en TEXT;

-- Colonnes Déchets
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_tri TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS jours_collecte TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS decheterie TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_tri_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS jours_collecte_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS decheterie_en TEXT;

-- Colonnes Sécurité
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS detecteur_fumee TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS extincteur TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS coupure_eau TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS disjoncteur TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS consignes_urgence TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS detecteur_fumee_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS extincteur_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS coupure_eau_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS disjoncteur_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS consignes_urgence_en TEXT;

-- Colonnes Départ
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_depart TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS depart_tardif TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS checklist_depart TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS restitution_cles TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_depart_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS depart_tardif_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS checklist_depart_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS restitution_cles_en TEXT;

-- Colonnes Règlement
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS tabac TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS animaux TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS nb_max_personnes TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS caution TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS tabac_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS animaux_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS nb_max_personnes_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS caution_en TEXT;

-- Colonne de tracking
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ DEFAULT NOW();

-- Supprimer les anciennes colonnes qui font doublon
-- ALTER TABLE public.infos_gites DROP COLUMN IF EXISTS code_porte;
-- ALTER TABLE public.infos_gites DROP COLUMN IF EXISTS code_portail;
-- ALTER TABLE public.infos_gites DROP COLUMN IF EXISTS parking_info;
-- ALTER TABLE public.infos_gites DROP COLUMN IF EXISTS acces_description;
-- ALTER TABLE public.infos_gites DROP COLUMN IF EXISTS consignes_speciales;

-- Commentaire: On garde code_porte et code_portail pour transition
-- Ils peuvent mapper vers code_acces si besoin

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_infos_gites_gite ON public.infos_gites(gite);
CREATE INDEX IF NOT EXISTS idx_infos_gites_gite_id ON public.infos_gites(gite_id);

-- Trigger pour auto-update de updated_at
CREATE OR REPLACE FUNCTION update_infos_gites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_infos_gites_updated_at ON public.infos_gites;
CREATE TRIGGER trigger_update_infos_gites_updated_at
    BEFORE UPDATE ON public.infos_gites
    FOR EACH ROW
    EXECUTE FUNCTION update_infos_gites_updated_at();

-- ================================================================
-- MIGRATION DES DONNÉES EXISTANTES
-- ================================================================

-- Mapper code_porte vers code_acces si code_acces est vide
UPDATE public.infos_gites 
SET code_acces = code_porte 
WHERE code_acces IS NULL AND code_porte IS NOT NULL;

-- Mapper parking_info vers parking_details si vide
UPDATE public.infos_gites 
SET parking_details = parking_info 
WHERE parking_details IS NULL AND parking_info IS NOT NULL;

-- Mapper acces_description vers instructions_cles si vide
UPDATE public.infos_gites 
SET instructions_cles = acces_description 
WHERE instructions_cles IS NULL AND acces_description IS NOT NULL;

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Afficher le schéma final
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'infos_gites'
ORDER BY ordinal_position;

-- ================================================================
-- OPTION 2: SI LA TABLE N'EXISTE PAS - CRÉATION COMPLÈTE
-- ================================================================
-- Décommenter cette section si la table n'existe pas encore

/*
CREATE TABLE public.infos_gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    gite TEXT,  -- Nom du gîte en texte (dénormalisé pour compatibilité)
    
    -- Coordonnées de base
    adresse TEXT,
    telephone TEXT,
    gps_lat DECIMAL(10, 8),
    gps_lon DECIMAL(11, 8),
    email TEXT,
    adresse_en TEXT,
    telephone_en TEXT,
    email_en TEXT,
    
    -- WiFi
    wifi_ssid TEXT,  -- Ancien: wifi_name
    wifi_password TEXT,
    wifi_debit TEXT,
    wifi_localisation TEXT,
    wifi_zones TEXT,
    wifi_ssid_en TEXT,
    wifi_password_en TEXT,
    wifi_debit_en TEXT,
    wifi_localisation_en TEXT,
    wifi_zones_en TEXT,
    
    -- Accès et codes
    code_porte TEXT,  -- Pour rétrocompatibilité
    code_portail TEXT,  -- Pour rétrocompatibilité
    code_acces TEXT,  -- Unifié
    parking_info TEXT,  -- Pour rétrocompatibilité
    acces_description TEXT,  -- Pour rétrocompatibilité
    consignes_speciales TEXT,  -- Pour rétrocompatibilité
    
    -- Arrivée
    heure_arrivee TEXT,
    arrivee_tardive TEXT,
    parking_dispo TEXT,
    parking_places TEXT,
    parking_details TEXT,
    type_acces TEXT,
    instructions_cles TEXT,
    etage TEXT,
    ascenseur TEXT,
    itineraire_logement TEXT,
    premiere_visite TEXT,
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
    
    -- Logement
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
    
    -- Déchets
    instructions_tri TEXT,
    jours_collecte TEXT,
    decheterie TEXT,
    instructions_tri_en TEXT,
    jours_collecte_en TEXT,
    decheterie_en TEXT,
    
    -- Sécurité
    detecteur_fumee TEXT,
    extincteur TEXT,
    coupure_eau TEXT,
    disjoncteur TEXT,
    consignes_urgence TEXT,
    detecteur_fumee_en TEXT,
    extincteur_en TEXT,
    coupure_eau_en TEXT,
    disjoncteur_en TEXT,
    consignes_urgence_en TEXT,
    
    -- Départ
    heure_depart TEXT,
    depart_tardif TEXT,
    checklist_depart TEXT,
    restitution_cles TEXT,
    heure_depart_en TEXT,
    depart_tardif_en TEXT,
    checklist_depart_en TEXT,
    restitution_cles_en TEXT,
    
    -- Règlement
    tabac TEXT,
    animaux TEXT,
    nb_max_personnes TEXT,
    caution TEXT,
    tabac_en TEXT,
    animaux_en TEXT,
    nb_max_personnes_en TEXT,
    caution_en TEXT,
    
    -- Equipements (JSONB pour flexibilité)
    equipements JSONB DEFAULT '{}',
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    date_modification TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT infos_gites_gite_id_key UNIQUE(gite_id)
);

-- Index
CREATE INDEX idx_infos_gites_owner ON public.infos_gites(owner_user_id);
CREATE INDEX idx_infos_gites_gite_id ON public.infos_gites(gite_id);
CREATE INDEX idx_infos_gites_gite ON public.infos_gites(gite);

-- Trigger pour auto-update
CREATE OR REPLACE FUNCTION update_infos_gites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_infos_gites_updated_at
    BEFORE UPDATE ON public.infos_gites
    FOR EACH ROW
    EXECUTE FUNCTION update_infos_gites_updated_at();

-- Trigger pour synchro nom gîte
CREATE OR REPLACE FUNCTION sync_infos_gites_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.gite_id IS NOT NULL THEN
        SELECT name INTO NEW.gite FROM gites WHERE id = NEW.gite_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_infos_gites_name
    BEFORE INSERT OR UPDATE OF gite_id ON public.infos_gites
    FOR EACH ROW
    EXECUTE FUNCTION sync_infos_gites_name();

-- RLS
ALTER TABLE public.infos_gites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own infos_gites" ON public.infos_gites;
CREATE POLICY "Users can view their own infos_gites"
    ON public.infos_gites FOR SELECT
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can insert their own infos_gites" ON public.infos_gites;
CREATE POLICY "Users can insert their own infos_gites"
    ON public.infos_gites FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can update their own infos_gites" ON public.infos_gites;
CREATE POLICY "Users can update their own infos_gites"
    ON public.infos_gites FOR UPDATE
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can delete their own infos_gites" ON public.infos_gites;
CREATE POLICY "Users can delete their own infos_gites"
    ON public.infos_gites FOR DELETE
    USING (auth.uid() = owner_user_id);
*/
