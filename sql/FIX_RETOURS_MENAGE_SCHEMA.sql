-- ============================================================
-- FIX SCHEMA : table retours_menage
-- ============================================================
-- Problèmes :
--   1. Colonne reported_by absente  → erreur 400 à l'insertion
--   2. Colonne description NOT NULL → bloque si non fournie
-- ============================================================

-- 1. Ajouter reported_by (UUID, référence auth.users, nullable)
ALTER TABLE public.retours_menage
    ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Rendre description nullable (le JS ne l'envoie pas, les commentaires suffisent)
ALTER TABLE public.retours_menage
    ALTER COLUMN description DROP NOT NULL;

-- Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'retours_menage'
ORDER BY ordinal_position;
