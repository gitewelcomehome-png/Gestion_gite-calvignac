-- ================================================================
-- COMMUNAUTÉ : Annuaire partagé artisans / experts
-- À exécuter dans Supabase SQL Editor
-- ================================================================

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.community_artisans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_gite_id UUID NULL REFERENCES public.gites(id) ON DELETE SET NULL,
    nom VARCHAR(200) NOT NULL,
    metier VARCHAR(200) NOT NULL,
    telephone VARCHAR(50),
    adresse VARCHAR(300),
    ville VARCHAR(120),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_artisans
    ADD COLUMN IF NOT EXISTS adresse VARCHAR(300);

CREATE TABLE IF NOT EXISTS public.community_artisan_notes (
    id BIGSERIAL PRIMARY KEY,
    artisan_id UUID NOT NULL REFERENCES public.community_artisans(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT community_artisan_notes_unique_vote UNIQUE (artisan_id, owner_user_id)
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_community_artisans_created_at ON public.community_artisans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_artisans_owner ON public.community_artisans(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_community_artisans_creator_gite ON public.community_artisans(creator_gite_id);
CREATE INDEX IF NOT EXISTS idx_community_artisans_geo ON public.community_artisans(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_community_artisan_notes_artisan ON public.community_artisan_notes(artisan_id);
CREATE INDEX IF NOT EXISTS idx_community_artisan_notes_owner ON public.community_artisan_notes(owner_user_id);

-- 3) Trigger updated_at
CREATE OR REPLACE FUNCTION public.gc_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_artisans_updated_at ON public.community_artisans;
CREATE TRIGGER trg_community_artisans_updated_at
    BEFORE UPDATE ON public.community_artisans
    FOR EACH ROW
    EXECUTE FUNCTION public.gc_touch_updated_at();

DROP TRIGGER IF EXISTS trg_community_artisan_notes_updated_at ON public.community_artisan_notes;
CREATE TRIGGER trg_community_artisan_notes_updated_at
    BEFORE UPDATE ON public.community_artisan_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.gc_touch_updated_at();

-- 4) RLS
ALTER TABLE public.community_artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_artisan_notes ENABLE ROW LEVEL SECURITY;

-- Nettoyage idempotent
DROP POLICY IF EXISTS community_artisans_select_all_authenticated ON public.community_artisans;
DROP POLICY IF EXISTS community_artisans_insert_own ON public.community_artisans;
DROP POLICY IF EXISTS community_artisans_update_own ON public.community_artisans;
DROP POLICY IF EXISTS community_artisans_delete_own ON public.community_artisans;

DROP POLICY IF EXISTS community_artisan_notes_select_all_authenticated ON public.community_artisan_notes;
DROP POLICY IF EXISTS community_artisan_notes_insert_own ON public.community_artisan_notes;
DROP POLICY IF EXISTS community_artisan_notes_update_own ON public.community_artisan_notes;
DROP POLICY IF EXISTS community_artisan_notes_delete_own ON public.community_artisan_notes;

-- Artisans visibles à toute la communauté (utilisateurs connectés)
CREATE POLICY community_artisans_select_all_authenticated
ON public.community_artisans
FOR SELECT
TO authenticated
USING (true);

-- Création/modification/suppression: auteur uniquement
CREATE POLICY community_artisans_insert_own
ON public.community_artisans
FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY community_artisans_update_own
ON public.community_artisans
FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY community_artisans_delete_own
ON public.community_artisans
FOR DELETE
TO authenticated
USING (owner_user_id = auth.uid());

-- Notes visibles à toute la communauté
CREATE POLICY community_artisan_notes_select_all_authenticated
ON public.community_artisan_notes
FOR SELECT
TO authenticated
USING (true);

-- Un vote par gîte/propriétaire (contrainte unique + upsert côté front)
CREATE POLICY community_artisan_notes_insert_own
ON public.community_artisan_notes
FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY community_artisan_notes_update_own
ON public.community_artisan_notes
FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY community_artisan_notes_delete_own
ON public.community_artisan_notes
FOR DELETE
TO authenticated
USING (owner_user_id = auth.uid());

-- 5) Vérifications rapides
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('community_artisans', 'community_artisan_notes');

SELECT policyname, tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('community_artisans', 'community_artisan_notes')
ORDER BY tablename, policyname;
