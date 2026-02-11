-- ===================================================================
-- AJOUT COLONNE ORDRE_AFFICHAGE DANS LA TABLE GITES
-- Date: 05 FEB 2026
-- Description: Permet de sauvegarder l'ordre personnalisé des gîtes
--              dans la base de données au lieu du localStorage
-- ===================================================================

-- 1. Ajouter la colonne ordre_affichage si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'gites' 
        AND column_name = 'ordre_affichage'
    ) THEN
        ALTER TABLE gites ADD COLUMN ordre_affichage INTEGER;
        
        -- Initialiser l'ordre en fonction de l'ordre alphabétique actuel
        WITH ordered_gites AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_user_id ORDER BY name) as row_num
            FROM gites
        )
        UPDATE gites g
        SET ordre_affichage = og.row_num
        FROM ordered_gites og
        WHERE g.id = og.id;
        
        RAISE NOTICE 'Colonne ordre_affichage ajoutée et initialisée';
    ELSE
        RAISE NOTICE 'Colonne ordre_affichage existe déjà';
    END IF;
END $$;

-- 2. Créer un index pour améliorer les performances de tri
CREATE INDEX IF NOT EXISTS idx_gites_ordre_affichage 
ON gites(owner_user_id, ordre_affichage);

-- 3. Vérifier le résultat
SELECT 
    id, 
    name, 
    ordre_affichage,
    owner_user_id
FROM gites
ORDER BY owner_user_id, ordre_affichage
LIMIT 20;
