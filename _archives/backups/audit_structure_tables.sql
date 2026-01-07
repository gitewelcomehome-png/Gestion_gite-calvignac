-- ================================================================
-- AUDIT STRUCTURE TABLES PRODUCTION
-- ================================================================
-- Objectif: Voir les colonnes existantes avant migration
-- ================================================================

-- Voir toutes les colonnes de la table reservations
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

-- Voir toutes les colonnes de la table cleaning_schedule
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cleaning_schedule'
ORDER BY ordinal_position;

-- Voir un échantillon de données reservations (5 lignes)
SELECT * FROM reservations LIMIT 5;

-- Voir un échantillon de données cleaning_schedule (5 lignes)
SELECT * FROM cleaning_schedule LIMIT 5;
