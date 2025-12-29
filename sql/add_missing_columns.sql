-- =====================================================
-- AJOUT DES COLONNES MANQUANTES À LA TABLE activites_gites
-- =====================================================

-- Ajouter la colonne 'categorie' (alias de 'type')
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS categorie VARCHAR(100);

-- Ajouter la colonne 'description'
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Ajouter la colonne 'distance' (alias de 'distance_km')  
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS distance DECIMAL(5, 2);

-- Ajouter la colonne 'telephone' (alias de 'phone')
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);

-- Ajouter la colonne 'note' (rating)
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS note DECIMAL(2, 1);

-- Ajouter la colonne 'avis' (nombre d'avis)
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS avis INTEGER;

-- Ajouter la colonne 'prix' (gamme de prix)
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS prix VARCHAR(20);

-- Ajouter la colonne 'google_maps_link'
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS google_maps_link VARCHAR(500);

-- =====================================================
-- SYNCHRONISER LES DONNÉES ENTRE COLONNES ALIAS
-- =====================================================

-- Copier 'type' vers 'categorie' si categorie est vide
UPDATE activites_gites 
SET categorie = type 
WHERE categorie IS NULL AND type IS NOT NULL;

-- Copier 'distance_km' vers 'distance' si distance est vide
UPDATE activites_gites 
SET distance = distance_km 
WHERE distance IS NULL AND distance_km IS NOT NULL;

-- Copier 'phone' vers 'telephone' si telephone est vide
UPDATE activites_gites 
SET telephone = phone 
WHERE telephone IS NULL AND phone IS NOT NULL;

-- =====================================================
-- INDEX POUR OPTIMISATION
-- =====================================================

-- Index sur categorie
CREATE INDEX IF NOT EXISTS idx_activites_categorie 
    ON activites_gites(categorie);

-- Index sur note
CREATE INDEX IF NOT EXISTS idx_activites_note 
    ON activites_gites(note DESC);

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Afficher la structure finale
\d activites_gites
