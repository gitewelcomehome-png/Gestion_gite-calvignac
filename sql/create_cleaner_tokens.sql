-- ============================================================
-- TABLE cleaner_tokens : Liens partageables pour femme/société de ménage
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Créer la table
CREATE TABLE IF NOT EXISTS public.cleaner_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    token       TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    owner_user_id UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label       TEXT        NOT NULL DEFAULT 'Femme de ménage',
    type        TEXT        NOT NULL DEFAULT 'cleaner' CHECK (type IN ('cleaner', 'company')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index de recherche par token
CREATE INDEX IF NOT EXISTS idx_cleaner_tokens_token ON public.cleaner_tokens(token);
CREATE INDEX IF NOT EXISTS idx_cleaner_tokens_owner ON public.cleaner_tokens(owner_user_id, type);

-- 2. Activer RLS
ALTER TABLE public.cleaner_tokens ENABLE ROW LEVEL SECURITY;

-- Anon peut lire (pour valider un token depuis la page femme-menage)
DROP POLICY IF EXISTS "anon_read_cleaner_tokens" ON public.cleaner_tokens;
CREATE POLICY "anon_read_cleaner_tokens"
ON public.cleaner_tokens FOR SELECT TO anon
USING (true);

-- Le propriétaire peut tout faire sur ses tokens
DROP POLICY IF EXISTS "owner_manage_cleaner_tokens" ON public.cleaner_tokens;
CREATE POLICY "owner_manage_cleaner_tokens"
ON public.cleaner_tokens FOR ALL TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- ============================================================
-- RLS anon sur les tables nécessaires à la page femme-menage
-- ============================================================

-- 3. gites : lecture par anon (pour charger la liste des gîtes via owner_user_id du token)
DROP POLICY IF EXISTS "anon_read_gites" ON public.gites;
CREATE POLICY "anon_read_gites"
ON public.gites FOR SELECT TO anon
USING (true);

-- 4. todos : insertion par anon (la femme de ménage crée des tâches)
DROP POLICY IF EXISTS "anon_insert_todos" ON public.todos;
CREATE POLICY "anon_insert_todos"
ON public.todos FOR INSERT TO anon
WITH CHECK (true);

-- 5. retours_menage : lecture + insertion par anon
DROP POLICY IF EXISTS "anon_read_retours_menage" ON public.retours_menage;
CREATE POLICY "anon_read_retours_menage"
ON public.retours_menage FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "anon_insert_retours_menage" ON public.retours_menage;
CREATE POLICY "anon_insert_retours_menage"
ON public.retours_menage FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_retours_menage" ON public.retours_menage;
CREATE POLICY "anon_delete_retours_menage"
ON public.retours_menage FOR DELETE TO anon
USING (true);

-- 6. linen_needs : lecture anon (articles définis par le propriétaire)
DROP POLICY IF EXISTS "anon_read_linen_needs" ON public.linen_needs;
CREATE POLICY "anon_read_linen_needs"
ON public.linen_needs FOR SELECT TO anon
USING (true);

-- 7. linen_stock_items : lecture + insertion + mise à jour anon
DROP POLICY IF EXISTS "anon_read_linen_stock_items" ON public.linen_stock_items;
CREATE POLICY "anon_read_linen_stock_items"
ON public.linen_stock_items FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "anon_insert_linen_stock_items" ON public.linen_stock_items;
CREATE POLICY "anon_insert_linen_stock_items"
ON public.linen_stock_items FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_linen_stock_items" ON public.linen_stock_items;
CREATE POLICY "anon_update_linen_stock_items"
ON public.linen_stock_items FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

SELECT '✅ cleaner_tokens créé + toutes les policies anon configurées' as status;
