-- ==========================================
-- AJOUT des colonnes manquantes dans infos_gites
-- ==========================================

-- Ajouter toutes les colonnes manquantes
ALTER TABLE infos_gites 
ADD COLUMN IF NOT EXISTS ascenseur TEXT,
ADD COLUMN IF NOT EXISTS ascenseur_en TEXT,
ADD COLUMN IF NOT EXISTS itineraire_logement TEXT,
ADD COLUMN IF NOT EXISTS itineraire_logement_en TEXT,
ADD COLUMN IF NOT EXISTS premiere_visite TEXT,
ADD COLUMN IF NOT EXISTS premiere_visite_en TEXT,
ADD COLUMN IF NOT EXISTS type_chauffage TEXT,
ADD COLUMN IF NOT EXISTS type_chauffage_en TEXT,
ADD COLUMN IF NOT EXISTS climatisation TEXT,
ADD COLUMN IF NOT EXISTS climatisation_en TEXT,
ADD COLUMN IF NOT EXISTS instructions_chauffage TEXT,
ADD COLUMN IF NOT EXISTS instructions_chauffage_en TEXT,
ADD COLUMN IF NOT EXISTS equipements_cuisine TEXT,
ADD COLUMN IF NOT EXISTS equipements_cuisine_en TEXT,
ADD COLUMN IF NOT EXISTS instructions_four TEXT,
ADD COLUMN IF NOT EXISTS instructions_four_en TEXT,
ADD COLUMN IF NOT EXISTS instructions_plaques TEXT,
ADD COLUMN IF NOT EXISTS instructions_plaques_en TEXT,
ADD COLUMN IF NOT EXISTS instructions_lave_vaisselle TEXT,
ADD COLUMN IF NOT EXISTS instructions_lave_vaisselle_en TEXT,
ADD COLUMN IF NOT EXISTS instructions_lave_linge TEXT,
ADD COLUMN IF NOT EXISTS instructions_lave_linge_en TEXT,
ADD COLUMN IF NOT EXISTS seche_linge TEXT,
ADD COLUMN IF NOT EXISTS seche_linge_en TEXT,
ADD COLUMN IF NOT EXISTS fer_repasser TEXT,
ADD COLUMN IF NOT EXISTS fer_repasser_en TEXT,
ADD COLUMN IF NOT EXISTS linge_fourni TEXT,
ADD COLUMN IF NOT EXISTS linge_fourni_en TEXT,
ADD COLUMN IF NOT EXISTS configuration_chambres TEXT,
ADD COLUMN IF NOT EXISTS configuration_chambres_en TEXT,
ADD COLUMN IF NOT EXISTS instructions_tri TEXT,
ADD COLUMN IF NOT EXISTS instructions_tri_en TEXT,
ADD COLUMN IF NOT EXISTS jours_collecte TEXT,
ADD COLUMN IF NOT EXISTS jours_collecte_en TEXT,
ADD COLUMN IF NOT EXISTS decheterie TEXT,
ADD COLUMN IF NOT EXISTS decheterie_en TEXT,
ADD COLUMN IF NOT EXISTS detecteur_fumee TEXT,
ADD COLUMN IF NOT EXISTS detecteur_fumee_en TEXT,
ADD COLUMN IF NOT EXISTS extincteur TEXT,
ADD COLUMN IF NOT EXISTS extincteur_en TEXT,
ADD COLUMN IF NOT EXISTS coupure_eau TEXT,
ADD COLUMN IF NOT EXISTS coupure_eau_en TEXT,
ADD COLUMN IF NOT EXISTS disjoncteur TEXT,
ADD COLUMN IF NOT EXISTS disjoncteur_en TEXT,
ADD COLUMN IF NOT EXISTS consignes_urgence TEXT,
ADD COLUMN IF NOT EXISTS consignes_urgence_en TEXT,
ADD COLUMN IF NOT EXISTS heure_depart TEXT,
ADD COLUMN IF NOT EXISTS heure_depart_en TEXT,
ADD COLUMN IF NOT EXISTS depart_tardif TEXT,
ADD COLUMN IF NOT EXISTS depart_tardif_en TEXT,
ADD COLUMN IF NOT EXISTS checklist_depart TEXT,
ADD COLUMN IF NOT EXISTS checklist_depart_en TEXT,
ADD COLUMN IF NOT EXISTS restitution_cles TEXT,
ADD COLUMN IF NOT EXISTS restitution_cles_en TEXT,
ADD COLUMN IF NOT EXISTS tabac TEXT,
ADD COLUMN IF NOT EXISTS tabac_en TEXT,
ADD COLUMN IF NOT EXISTS animaux TEXT,
ADD COLUMN IF NOT EXISTS animaux_en TEXT,
ADD COLUMN IF NOT EXISTS nb_max_personnes TEXT,
ADD COLUMN IF NOT EXISTS nb_max_personnes_en TEXT,
ADD COLUMN IF NOT EXISTS caution TEXT,
ADD COLUMN IF NOT EXISTS caution_en TEXT,
ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ;

-- Vérifier que toutes les colonnes existent
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'infos_gites' 
AND column_name NOT IN ('id', 'owner_user_id', 'gite', 'created_at')
ORDER BY column_name;
