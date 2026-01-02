-- =====================================================
-- AJOUT COLONNE ANNÉE DANS LA TABLE CHARGES
-- =====================================================
-- Pour filtrer les charges par année et calculer
-- les bénéfices annuels correctement
-- =====================================================

-- Ajouter la colonne année (extraite de la date)
ALTER TABLE charges 
ADD COLUMN IF NOT EXISTS annee INTEGER;

-- Remplir l'année automatiquement à partir de la date existante
UPDATE charges 
SET annee = EXTRACT(YEAR FROM date::date)
WHERE date IS NOT NULL AND annee IS NULL;

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
    -- Si la date est fournie, extraire l'année
    IF NEW.date IS NOT NULL THEN
        NEW.annee = EXTRACT(YEAR FROM NEW.date::date);
    ELSE
        -- Sinon utiliser l'année actuelle
        NEW.annee = EXTRACT(YEAR FROM NOW());
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

-- Afficher un résumé des charges par année
SELECT 
    annee, 
    COUNT(*) as nb_charges,
    SUM(montant) as total
FROM charges 
WHERE annee IS NOT NULL
GROUP BY annee 
ORDER BY annee DESC;
