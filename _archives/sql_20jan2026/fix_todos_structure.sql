-- Ajouter la colonne completed_at à la table todos
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Vérification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'todos' 
AND table_schema = 'public'
ORDER BY ordinal_position;
