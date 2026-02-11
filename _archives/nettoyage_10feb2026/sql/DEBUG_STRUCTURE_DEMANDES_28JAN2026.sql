-- ============================================================================
-- DEBUG : Vérifier la structure de demandes_horaires
-- ============================================================================
-- Exécuter dans l'éditeur SQL Supabase pour voir les colonnes

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'demandes_horaires'
ORDER BY ordinal_position;

-- Voir les données actuelles
SELECT * FROM demandes_horaires LIMIT 10;

-- Vérifier si une colonne id existe
SELECT 
    COUNT(*) as total_colonnes,
    STRING_AGG(column_name, ', ') as liste_colonnes
FROM information_schema.columns
WHERE table_name = 'demandes_horaires';
