-- Vérification ultra-simple des colonnes de cleaning_schedule
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'cleaning_schedule'
ORDER BY ordinal_position;
