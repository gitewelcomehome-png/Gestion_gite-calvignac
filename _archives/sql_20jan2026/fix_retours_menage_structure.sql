-- ================================================================
-- FIX STRUCTURE TABLE RETOURS_MENAGE
-- ================================================================
-- Date: 15 janvier 2026
-- Contexte: Erreur "Could not find the 'commentaires' column"

-- 1. Vérifier la structure actuelle
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'retours_menage'
ORDER BY ordinal_position;

-- 2. Supprimer les anciennes colonnes si elles existent
DO $$ 
BEGIN
    -- Supprimer etat_arrivee si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'etat_arrivee'
    ) THEN
        ALTER TABLE retours_menage DROP COLUMN etat_arrivee;
    END IF;
    
    -- Supprimer details_etat si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'details_etat'
    ) THEN
        ALTER TABLE retours_menage DROP COLUMN details_etat;
    END IF;
    
    -- Supprimer deroulement si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'deroulement'
    ) THEN
        ALTER TABLE retours_menage DROP COLUMN deroulement;
    END IF;
    
    -- Supprimer details_deroulement si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'details_deroulement'
    ) THEN
        ALTER TABLE retours_menage DROP COLUMN details_deroulement;
    END IF;
END $$;

-- 3. Ajouter les colonnes du schéma officiel si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter commentaires
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'commentaires'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN commentaires TEXT;
    END IF;
    
    -- Ajouter heure_arrivee
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'heure_arrivee'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN heure_arrivee TIME;
    END IF;
    
    -- Ajouter heure_depart
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'heure_depart'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN heure_depart TIME;
    END IF;
    
    -- Ajouter duree_minutes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'duree_minutes'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN duree_minutes INT;
    END IF;
    
    -- Ajouter produits_manquants
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'produits_manquants'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN produits_manquants JSONB DEFAULT '[]';
    END IF;
    
    -- Ajouter problemes_signales
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'problemes_signales'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN problemes_signales JSONB DEFAULT '[]';
    END IF;
    
    -- Ajouter photos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'photos'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN photos JSONB DEFAULT '[]';
    END IF;
    
    -- Ajouter owner_user_id si n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'owner_user_id'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Ajouter reported_by si n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'retours_menage' AND column_name = 'reported_by'
    ) THEN
        ALTER TABLE retours_menage ADD COLUMN reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Vérifier la structure finale
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'retours_menage'
ORDER BY ordinal_position;

-- 5. Message de confirmation
SELECT '✅ Structure de retours_menage mise à jour avec succès' AS status;
