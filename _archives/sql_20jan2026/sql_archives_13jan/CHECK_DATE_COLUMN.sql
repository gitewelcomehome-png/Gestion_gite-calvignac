-- Vérifier que la colonne date existe dans cleaning_schedule
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cleaning_schedule' AND column_name = 'date';
