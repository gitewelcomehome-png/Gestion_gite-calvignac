-- ==================================================================================
-- ADD GITES TARIFICATION FIELDS - 27/02/2026
-- Objectif: Ajouter les champs nécessaires au module Intelligence Tarifaire LOU
-- ==================================================================================

BEGIN;

ALTER TABLE IF EXISTS public.gites
    ADD COLUMN IF NOT EXISTS beds INTEGER,
    ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
    ADD COLUMN IF NOT EXISTS surface_m2 NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS type_hebergement VARCHAR(80),
    ADD COLUMN IF NOT EXISTS label_classement VARCHAR(80),
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS region VARCHAR(100),
    ADD COLUMN IF NOT EXISTS environment TEXT,
    ADD COLUMN IF NOT EXISTS situation TEXT,
    ADD COLUMN IF NOT EXISTS cuisine_niveau VARCHAR(40),
    ADD COLUMN IF NOT EXISTS animaux_acceptes BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS access_pmr BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS platform_airbnb BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS platform_booking BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS platform_abritel BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS platform_gdf BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS platform_direct BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS public.gites
    DROP CONSTRAINT IF EXISTS gites_beds_check,
    DROP CONSTRAINT IF EXISTS gites_bathrooms_check,
    DROP CONSTRAINT IF EXISTS gites_surface_m2_check;

ALTER TABLE IF EXISTS public.gites
    ADD CONSTRAINT gites_beds_check CHECK (beds IS NULL OR beds >= 0),
    ADD CONSTRAINT gites_bathrooms_check CHECK (bathrooms IS NULL OR bathrooms >= 0),
    ADD CONSTRAINT gites_surface_m2_check CHECK (surface_m2 IS NULL OR surface_m2 >= 0);

UPDATE public.gites
SET
    beds = COALESCE(beds, NULLIF(settings->'pricing_profile'->>'beds', '')::INTEGER),
    bathrooms = COALESCE(bathrooms, NULLIF(settings->'pricing_profile'->>'bathrooms', '')::INTEGER),
    surface_m2 = COALESCE(surface_m2, NULLIF(settings->'pricing_profile'->>'surface_m2', '')::NUMERIC),
    type_hebergement = COALESCE(type_hebergement, NULLIF(settings->'pricing_profile'->>'type_hebergement', '')),
    label_classement = COALESCE(label_classement, NULLIF(settings->'pricing_profile'->>'label_classement', '')),
    department = COALESCE(department, NULLIF(settings->'pricing_profile'->>'department', '')),
    region = COALESCE(region, NULLIF(settings->'pricing_profile'->>'region', '')),
    environment = COALESCE(environment, NULLIF(settings->'pricing_profile'->>'environment', '')),
    situation = COALESCE(situation, NULLIF(settings->'pricing_profile'->>'situation', '')),
    cuisine_niveau = COALESCE(cuisine_niveau, NULLIF(settings->'pricing_profile'->>'cuisine_niveau', '')),
    animaux_acceptes = COALESCE(animaux_acceptes, (settings->'accessibility'->>'animaux_acceptes')::BOOLEAN, false),
    access_pmr = COALESCE(access_pmr, (settings->'accessibility'->>'pmr')::BOOLEAN, false),
    parking = COALESCE(parking, (settings->'accessibility'->>'parking')::BOOLEAN, false),
    platform_airbnb = COALESCE(platform_airbnb, (settings->'platforms_active'->>'airbnb')::BOOLEAN, false),
    platform_booking = COALESCE(platform_booking, (settings->'platforms_active'->>'booking')::BOOLEAN, false),
    platform_abritel = COALESCE(platform_abritel, (settings->'platforms_active'->>'abritel')::BOOLEAN, false),
    platform_gdf = COALESCE(platform_gdf, (settings->'platforms_active'->>'gdf')::BOOLEAN, false),
    platform_direct = COALESCE(platform_direct, (settings->'platforms_active'->>'direct')::BOOLEAN, false)
WHERE settings IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gites_region ON public.gites(region);
CREATE INDEX IF NOT EXISTS idx_gites_type_hebergement ON public.gites(type_hebergement);
CREATE INDEX IF NOT EXISTS idx_gites_label_classement ON public.gites(label_classement);

COMMIT;

-- Post-check
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gites'
  AND column_name IN (
      'beds', 'bathrooms', 'surface_m2', 'type_hebergement', 'label_classement',
      'department', 'region', 'environment', 'situation', 'cuisine_niveau',
      'animaux_acceptes', 'access_pmr', 'parking',
      'platform_airbnb', 'platform_booking', 'platform_abritel', 'platform_gdf', 'platform_direct'
  )
ORDER BY column_name;
