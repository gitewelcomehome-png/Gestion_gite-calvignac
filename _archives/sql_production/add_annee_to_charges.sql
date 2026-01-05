-- =====================================================
-- AJOUT COLONNE ANNÉE DANS LA TABLE CHARGES
-- =====================================================
-- Pour filtrer les charges par année et calculer
-- les bénéfices annuels correctement
-- =====================================================

-- Ajouter la colonne année (extraite de la date)
ALTER TABLE charges 
ADD COLUMN IF NOT EXISTS annee INTEGER;

-- Remplir l'année automatiquement à partir de la colonne date (si elle existe)
-- Sinon utiliser created_at
DO $$ 
BEGIN
    -- Vérifier si la colonne 'date' existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'charges' AND column_name = 'date'
    ) THEN
        -- Utiliser la colonne 'date'
        UPDATE charges 
        SET annee = EXTRACT(YEAR FROM date::date)
        WHERE date IS NOT NULL AND annee IS NULL;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'charges' AND column_name = 'created_at'
    ) THEN
        -- Utiliser la colonne 'created_at'
        UPDATE charges 
        SET annee = EXTRACT(YEAR FROM created_at)
        WHERE created_at IS NOT NULL AND annee IS NULL;
    END IF;
END $$;

-- Définir l'année actuelle par défaut pour les nouvelles lignes
ALTER TABLE charges 
ALTER COLUMN annee SET DEFAULT EXTRACT(YEAR FROM NOW());

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_charges_annee ON charges(annee DESC);

-- Commentaire pour documentation
COMMENT ON COLUMN charges.annee IS 'Année de la charge (extrait de la date, utilisé pour filtrage)';

-- =====================================================
-- TRIGGER POUR METTRE À JOUR AUTOMATIQUEMENT L'ANNÉE
-- =====================================================

-- Créer une fonction trigger qui met à jour l'année automatiquement
CREATE OR REPLACE FUNCTION update_charge_annee()
RETURNS TRIGGER AS $$
BEGIN
    -- Essayer d'extraire l'année de la colonne 'date' si elle existe
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Vérifier si NEW a une colonne 'date'
        BEGIN
            IF NEW.date IS NOT NULL THEN
                NEW.annee := EXTRACT(YEAR FROM NEW.date::date);
                RETURN NEW;
            END IF;
        EXCEPTION
            WHEN undefined_column THEN
                -- La colonne 'date' n'existe pas, utiliser created_at
                NULL;
        END;
        
        -- Sinon utiliser created_at ou l'année actuelle
        IF NEW.created_at IS NOT NULL THEN
            NEW.annee := EXTRACT(YEAR FROM NEW.created_at);
        ELSE
            NEW.annee := EXTRACT(YEAR FROM NOW());
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_update_charge_annee ON charges;

-- Créer le trigger (exécuté avant INSERT ou UPDATE)
CREATE TRIGGER trigger_update_charge_annee
    BEFORE INSERT OR UPDATE ON charges
    FOR EACH ROW
    EXECUTE FUNCTION update_charge_annee();

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Afficher la structure de la table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'charges'
ORDER BY ordinal_position;

-- Afficher un résumé des charges par année
SELECT 
    annee, 
    COUNT(*) as nb_charges,
    SUM(montant) as total
FROM charges 
WHERE annee IS NOT NULL
GROUP BY annee 
ORDER BY annee DESC;
