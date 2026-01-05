-- ============================================================================
-- MISE À JOUR : Ajouter les nouveaux types à la table problemes_signales
-- ============================================================================

-- Supprimer l'ancienne contrainte CHECK sur le type
ALTER TABLE problemes_signales 
DROP CONSTRAINT IF EXISTS problemes_signales_type_check;

-- Ajouter la nouvelle contrainte avec tous les types
ALTER TABLE problemes_signales 
ADD CONSTRAINT problemes_signales_type_check 
CHECK (type IN (
    -- Types techniques (anciens)
    'equipement',
    'proprete',
    'chauffage',
    'eau',
    'electricite',
    'wifi',
    'nuisance',
    'securite',
    'autre',
    -- Nouveaux types génériques
    'demande',
    'retour',
    'amelioration',
    'probleme'
));

-- Vérifier la modification
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'problemes_signales_type_check';
