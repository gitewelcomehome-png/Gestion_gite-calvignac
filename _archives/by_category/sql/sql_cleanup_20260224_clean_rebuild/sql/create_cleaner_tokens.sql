-- ============================================================
-- TABLE cleaner_tokens : Liens partageables pour femme/société de ménage
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- Fonction helper : résout l'owner_user_id depuis le header x-cleaner-token
-- Permet aux RLS policies anon de filtrer par propriétaire sans exposer les données des autres
CREATE OR REPLACE FUNCTION public.cleaner_token_owner_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT ct.owner_user_id
    FROM public.cleaner_tokens ct
    WHERE ct.token = (
        NULLIF(current_setting('request.headers', true), '')::json->>'x-cleaner-token'
    )
    LIMIT 1;
$$;

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
-- RLS anon sur les tables — filtrées par header x-cleaner-token
-- ============================================================

-- 3. gites : lecture anon filtrée par l'owner du token
DROP POLICY IF EXISTS "anon_read_gites" ON public.gites;
CREATE POLICY "anon_read_gites"
ON public.gites FOR SELECT TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

-- 4. todos : insertion anon filtrée par l'owner du token
DROP POLICY IF EXISTS "anon_insert_todos" ON public.todos;
CREATE POLICY "anon_insert_todos"
ON public.todos FOR INSERT TO anon
WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

-- 5. retours_menage : lecture + insertion + suppression filtrées par l'owner du token
DROP POLICY IF EXISTS "anon_read_retours_menage" ON public.retours_menage;
CREATE POLICY "anon_read_retours_menage"
ON public.retours_menage FOR SELECT TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

DROP POLICY IF EXISTS "anon_insert_retours_menage" ON public.retours_menage;
CREATE POLICY "anon_insert_retours_menage"
ON public.retours_menage FOR INSERT TO anon
WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

DROP POLICY IF EXISTS "anon_delete_retours_menage" ON public.retours_menage;
CREATE POLICY "anon_delete_retours_menage"
ON public.retours_menage FOR DELETE TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

-- 6. linen_needs : lecture anon filtrée par l'owner du token
DROP POLICY IF EXISTS "anon_read_linen_needs" ON public.linen_needs;
CREATE POLICY "anon_read_linen_needs"
ON public.linen_needs FOR SELECT TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

-- 7. linen_stock_items : lecture + insertion + mise à jour filtrées par l'owner du token
DROP POLICY IF EXISTS "anon_read_linen_stock_items" ON public.linen_stock_items;
CREATE POLICY "anon_read_linen_stock_items"
ON public.linen_stock_items FOR SELECT TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

DROP POLICY IF EXISTS "anon_insert_linen_stock_items" ON public.linen_stock_items;
CREATE POLICY "anon_insert_linen_stock_items"
ON public.linen_stock_items FOR INSERT TO anon
WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

DROP POLICY IF EXISTS "anon_update_linen_stock_items" ON public.linen_stock_items;
CREATE POLICY "anon_update_linen_stock_items"
ON public.linen_stock_items FOR UPDATE TO anon
USING (owner_user_id = public.cleaner_token_owner_id())
WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

-- 8. reservations : lecture anon filtrée par l'owner du token (lien ménage uniquement)
DROP POLICY IF EXISTS "anon_cleaner_read_reservations" ON public.reservations;
CREATE POLICY "anon_cleaner_read_reservations"
ON public.reservations FOR SELECT TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

-- 9. cleaning_schedule : lecture + écriture anon filtrées par l'owner du token
DROP POLICY IF EXISTS "anon_cleaner_read_cleaning_schedule" ON public.cleaning_schedule;
CREATE POLICY "anon_cleaner_read_cleaning_schedule"
ON public.cleaning_schedule FOR SELECT TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

DROP POLICY IF EXISTS "anon_insert_cleaning_schedule" ON public.cleaning_schedule;
CREATE POLICY "anon_insert_cleaning_schedule"
ON public.cleaning_schedule FOR INSERT TO anon
WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

DROP POLICY IF EXISTS "anon_update_cleaning_schedule" ON public.cleaning_schedule;
CREATE POLICY "anon_update_cleaning_schedule"
ON public.cleaning_schedule FOR UPDATE TO anon
USING (owner_user_id = public.cleaner_token_owner_id())
WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

SELECT '✅ cleaner_tokens créé + policies RLS avec filtrage par x-cleaner-token header' as status;
