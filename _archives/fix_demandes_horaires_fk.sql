-- ============================================================================
-- FIX: Foreign Key demandes_horaires → reservations
-- ============================================================================
-- Erreur: "Could not find a relationship between 'demandes_horaires' and 'reservations'"

BEGIN;

-- 1. Vérifier si la foreign key existe
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as foreign_table
FROM pg_constraint
WHERE conname = 'demandes_horaires_reservation_id_fkey';

-- 2. Supprimer la contrainte si elle existe (pour recréer proprement)
ALTER TABLE public.demandes_horaires 
    DROP CONSTRAINT IF EXISTS demandes_horaires_reservation_id_fkey;

-- 3. Recréer la contrainte foreign key
ALTER TABLE public.demandes_horaires
    ADD CONSTRAINT demandes_horaires_reservation_id_fkey 
    FOREIGN KEY (reservation_id) 
    REFERENCES public.reservations(id) 
    ON DELETE CASCADE;

-- 4. Vérifier que la contrainte est bien créée
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='demandes_horaires';

COMMIT;

-- 5. IMPORTANT: Rafraîchir le cache du schéma Supabase
-- Exécuter cette commande après le commit:
NOTIFY pgrst, 'reload schema';
