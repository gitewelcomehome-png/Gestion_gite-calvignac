-- ================================================================
-- GESTION DES KILOMETRES PROFESSIONNELS
-- Tables: km_config_auto, km_trajets, km_lieux_favoris
-- ================================================================

CREATE TABLE IF NOT EXISTS public.km_config_auto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_menage_entree BOOLEAN NOT NULL DEFAULT true,
    auto_menage_sortie BOOLEAN NOT NULL DEFAULT true,
    auto_courses BOOLEAN NOT NULL DEFAULT false,
    auto_maintenance BOOLEAN NOT NULL DEFAULT false,
    creer_trajets_par_defaut BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT km_config_auto_owner_unique UNIQUE (owner_user_id)
);

CREATE TABLE IF NOT EXISTS public.km_trajets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date_trajet DATE NOT NULL,
    annee_fiscale INTEGER NOT NULL,
    motif TEXT NOT NULL,
    type_trajet TEXT NOT NULL DEFAULT 'autre',
    lieu_depart TEXT,
    lieu_arrivee TEXT,
    gite_id UUID REFERENCES public.gites(id) ON DELETE SET NULL,
    distance_aller NUMERIC(10,2) NOT NULL,
    aller_retour BOOLEAN NOT NULL DEFAULT true,
    distance_totale NUMERIC(10,2) NOT NULL,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    auto_genere BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT km_trajets_distance_aller_ck CHECK (distance_aller >= 0),
    CONSTRAINT km_trajets_distance_totale_ck CHECK (distance_totale >= 0)
);

CREATE TABLE IF NOT EXISTS public.km_lieux_favoris (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    type_lieu TEXT NOT NULL DEFAULT 'magasin',
    distance_km NUMERIC(10,2) NOT NULL,
    adresse TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT km_lieux_favoris_distance_ck CHECK (distance_km >= 0)
);

-- Ensure compatibility when km_trajets already exists with an older schema.
ALTER TABLE IF EXISTS public.km_trajets
    ADD COLUMN IF NOT EXISTS annee_fiscale INTEGER;

CREATE INDEX IF NOT EXISTS idx_km_config_auto_owner ON public.km_config_auto(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_km_trajets_owner_year_date ON public.km_trajets(owner_user_id, annee_fiscale, date_trajet DESC);
CREATE INDEX IF NOT EXISTS idx_km_trajets_gite ON public.km_trajets(gite_id);
CREATE INDEX IF NOT EXISTS idx_km_trajets_reservation ON public.km_trajets(reservation_id);
CREATE INDEX IF NOT EXISTS idx_km_lieux_favoris_owner_nom ON public.km_lieux_favoris(owner_user_id, nom);

ALTER TABLE public.km_config_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.km_trajets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.km_lieux_favoris ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own km config" ON public.km_config_auto;
DROP POLICY IF EXISTS "Users can insert own km config" ON public.km_config_auto;
DROP POLICY IF EXISTS "Users can update own km config" ON public.km_config_auto;

CREATE POLICY "Users can view own km config"
    ON public.km_config_auto FOR SELECT
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own km config"
    ON public.km_config_auto FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own km config"
    ON public.km_config_auto FOR UPDATE
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can view own km trajets" ON public.km_trajets;
DROP POLICY IF EXISTS "Users can insert own km trajets" ON public.km_trajets;
DROP POLICY IF EXISTS "Users can update own km trajets" ON public.km_trajets;
DROP POLICY IF EXISTS "Users can delete own km trajets" ON public.km_trajets;

CREATE POLICY "Users can view own km trajets"
    ON public.km_trajets FOR SELECT
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own km trajets"
    ON public.km_trajets FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own km trajets"
    ON public.km_trajets FOR UPDATE
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own km trajets"
    ON public.km_trajets FOR DELETE
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can view own km lieux" ON public.km_lieux_favoris;
DROP POLICY IF EXISTS "Users can insert own km lieux" ON public.km_lieux_favoris;
DROP POLICY IF EXISTS "Users can update own km lieux" ON public.km_lieux_favoris;
DROP POLICY IF EXISTS "Users can delete own km lieux" ON public.km_lieux_favoris;

CREATE POLICY "Users can view own km lieux"
    ON public.km_lieux_favoris FOR SELECT
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own km lieux"
    ON public.km_lieux_favoris FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own km lieux"
    ON public.km_lieux_favoris FOR UPDATE
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own km lieux"
    ON public.km_lieux_favoris FOR DELETE
    USING (auth.uid() = owner_user_id);
