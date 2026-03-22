-- ============================================================
-- FIX SCHEMA : colonnes manquantes pour fiche client
-- ============================================================
-- Erreurs résolues :
--   1. cleaning_schedule    → colonnes gite (TEXT) et scheduled_date manquantes
--   2. problemes_signales   → colonnes gite, client_name, sujet, statut, telephone manquantes
--   3. prestations_catalogue → table inexistante (CREATE)
-- ============================================================

-- ============================================================
-- 1. cleaning_schedule : ajouter gite (TEXT) et scheduled_date
--    Le JS filtre par .eq('gite', nomGite) et .eq('scheduled_date', date)
--    La table actuelle a gite_id (UUID) et date (DATE)
-- ============================================================
ALTER TABLE public.cleaning_schedule
    ADD COLUMN IF NOT EXISTS gite TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- scheduled_date est une colonne GENERATED ALWAYS AS (date) STORED → pas d'UPDATE possible
-- On synchronise uniquement gite depuis gites.name
UPDATE public.cleaning_schedule cs
SET
    gite = (SELECT name FROM public.gites WHERE id = cs.gite_id LIMIT 1)
WHERE gite IS NULL;

-- ============================================================
-- 2. problemes_signales : colonnes attendues par fiche-client-app.js
-- ============================================================
ALTER TABLE public.problemes_signales
    ADD COLUMN IF NOT EXISTS gite           TEXT,
    ADD COLUMN IF NOT EXISTS client_name    TEXT,
    ADD COLUMN IF NOT EXISTS sujet          TEXT,
    ADD COLUMN IF NOT EXISTS statut         TEXT DEFAULT 'nouveau',
    ADD COLUMN IF NOT EXISTS telephone      TEXT;

-- Rendre description et gite_id nullable (le JS n'envoie que gite TEXT, pas gite_id UUID)
ALTER TABLE public.problemes_signales
    ALTER COLUMN description DROP NOT NULL;

ALTER TABLE public.problemes_signales
    ALTER COLUMN gite_id DROP NOT NULL;

-- ============================================================
-- 3. prestations_catalogue : création de la table
--    Colonnes lues dans le JS : id, gite_id, nom, nom_en, description,
--    description_en, prix, icone, photo_url, is_active, ordre, categorie
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prestations_catalogue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id         UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    nom             TEXT NOT NULL,
    nom_en          TEXT,
    description     TEXT,
    description_en  TEXT,
    prix            NUMERIC(10,2) NOT NULL DEFAULT 0,
    icone           TEXT,
    photo_url       TEXT,
    categorie       TEXT,
    is_active       BOOLEAN DEFAULT true,
    ordre           INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prestations_gite     ON public.prestations_catalogue(gite_id);
CREATE INDEX IF NOT EXISTS idx_prestations_active   ON public.prestations_catalogue(is_active);
CREATE INDEX IF NOT EXISTS idx_prestations_owner    ON public.prestations_catalogue(owner_user_id);

-- RLS : lecture publique (fiche client = lien anonyme), écriture propriétaire
ALTER TABLE public.prestations_catalogue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prestations_select_public   ON public.prestations_catalogue;
DROP POLICY IF EXISTS prestations_all_owner       ON public.prestations_catalogue;

CREATE POLICY prestations_select_public ON public.prestations_catalogue
    FOR SELECT USING (is_active = true);

CREATE POLICY prestations_all_owner ON public.prestations_catalogue
    FOR ALL USING (auth.uid() = owner_user_id);

-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT 'cleaning_schedule' AS table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cleaning_schedule'
  AND column_name IN ('gite', 'scheduled_date', 'date')
UNION ALL
SELECT 'problemes_signales', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'problemes_signales'
  AND column_name IN ('gite', 'client_name', 'sujet', 'statut', 'telephone')
UNION ALL
SELECT 'prestations_catalogue', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'prestations_catalogue'
ORDER BY table_name, column_name;
