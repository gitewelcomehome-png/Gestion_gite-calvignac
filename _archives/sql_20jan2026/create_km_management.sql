-- ==========================================
-- SYSTÈME DE GESTION DES KILOMÈTRES
-- Date : 19/01/2026
-- Objectif : Suivre les déplacements professionnels pour déduction fiscale
-- ==========================================

-- ==========================================
-- 1. AJOUTER COLONNE distance_km DANS gites
-- ==========================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gites' 
        AND column_name = 'distance_km'
    ) THEN
        ALTER TABLE public.gites 
        ADD COLUMN distance_km DECIMAL(6,2) DEFAULT 0;
        
        RAISE NOTICE 'Colonne distance_km ajoutée à gites';
    ELSE
        RAISE NOTICE 'Colonne distance_km existe déjà dans gites';
    END IF;
END $$;

COMMENT ON COLUMN public.gites.distance_km IS 'Distance en km depuis le domicile/base jusqu''au gîte (pour calcul trajets)';

-- ==========================================
-- 2. TABLE km_trajets - Historique des trajets
-- ==========================================

CREATE TABLE IF NOT EXISTS public.km_trajets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Date et année fiscale
    date_trajet DATE NOT NULL,
    annee_fiscale INTEGER NOT NULL,
    
    -- Détails du trajet
    motif TEXT NOT NULL, -- Ex: "Ménage entrée", "Courses Intermarché", "Maintenance"
    type_trajet TEXT NOT NULL DEFAULT 'autre', -- 'menage_entree', 'menage_sortie', 'courses', 'maintenance', 'autre'
    
    -- Lieux (NULL si départ = domicile)
    lieu_depart TEXT, -- Nom du lieu de départ (ou NULL si domicile)
    lieu_arrivee TEXT NOT NULL, -- Nom du lieu d'arrivée (gîte ou magasin)
    gite_id UUID REFERENCES public.gites(id) ON DELETE SET NULL, -- Lien vers gîte si applicable
    
    -- Distances
    distance_aller DECIMAL(6,2) NOT NULL,
    aller_retour BOOLEAN DEFAULT true,
    distance_totale DECIMAL(6,2) NOT NULL, -- Calculée automatiquement
    
    -- Automatisation
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    auto_genere BOOLEAN DEFAULT false, -- true si créé automatiquement
    
    -- Métadonnées
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_km_trajets_owner ON public.km_trajets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_km_trajets_annee ON public.km_trajets(annee_fiscale);
CREATE INDEX IF NOT EXISTS idx_km_trajets_date ON public.km_trajets(date_trajet);
CREATE INDEX IF NOT EXISTS idx_km_trajets_gite ON public.km_trajets(gite_id);
CREATE INDEX IF NOT EXISTS idx_km_trajets_reservation ON public.km_trajets(reservation_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_km_trajets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_km_trajets_updated_at ON public.km_trajets;
CREATE TRIGGER trigger_update_km_trajets_updated_at
    BEFORE UPDATE ON public.km_trajets
    FOR EACH ROW
    EXECUTE FUNCTION update_km_trajets_updated_at();

-- Commentaires
COMMENT ON TABLE public.km_trajets IS 'Historique des trajets professionnels pour déduction kilométrique';
COMMENT ON COLUMN public.km_trajets.type_trajet IS 'Type de trajet pour automatisation : menage_entree, menage_sortie, courses, maintenance, autre';
COMMENT ON COLUMN public.km_trajets.auto_genere IS 'true si le trajet a été créé automatiquement depuis une réservation';

-- ==========================================
-- 3. TABLE km_config_auto - Configuration automatisation
-- ==========================================

CREATE TABLE IF NOT EXISTS public.km_config_auto (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activation par type de trajet
    auto_menage_entree BOOLEAN DEFAULT true,
    auto_menage_sortie BOOLEAN DEFAULT true,
    auto_courses BOOLEAN DEFAULT false,
    auto_maintenance BOOLEAN DEFAULT false,
    
    -- Configuration additionnelle
    creer_trajets_par_defaut BOOLEAN DEFAULT true,
    
    -- Lieux par défaut pour automatisation
    lieu_courses_defaut TEXT, -- Ex: "Intermarché Cahors"
    distance_courses_defaut DECIMAL(6,2), -- Distance si lieu courses spécifié
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_km_config_auto_owner ON public.km_config_auto(owner_user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_km_config_auto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_km_config_auto_updated_at ON public.km_config_auto;
CREATE TRIGGER trigger_update_km_config_auto_updated_at
    BEFORE UPDATE ON public.km_config_auto
    FOR EACH ROW
    EXECUTE FUNCTION update_km_config_auto_updated_at();

-- Commentaires
COMMENT ON TABLE public.km_config_auto IS 'Configuration de l''automatisation des trajets kilométriques';
COMMENT ON COLUMN public.km_config_auto.auto_menage_entree IS 'Créer automatiquement trajet ménage jour avant arrivée';
COMMENT ON COLUMN public.km_config_auto.auto_menage_sortie IS 'Créer automatiquement trajet ménage jour de départ';

-- ==========================================
-- 4. TABLE km_lieux_favoris - Lieux fréquents (magasins)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.km_lieux_favoris (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    nom TEXT NOT NULL,
    type_lieu TEXT NOT NULL DEFAULT 'magasin', -- 'magasin', 'autre'
    distance_km DECIMAL(6,2) NOT NULL,
    adresse TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(owner_user_id, nom)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_km_lieux_favoris_owner ON public.km_lieux_favoris(owner_user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_km_lieux_favoris_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_km_lieux_favoris_updated_at ON public.km_lieux_favoris;
CREATE TRIGGER trigger_update_km_lieux_favoris_updated_at
    BEFORE UPDATE ON public.km_lieux_favoris
    FOR EACH ROW
    EXECUTE FUNCTION update_km_lieux_favoris_updated_at();

COMMENT ON TABLE public.km_lieux_favoris IS 'Lieux favoris (magasins, etc.) pour trajets kilométriques';

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Activer RLS
ALTER TABLE public.km_trajets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.km_config_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.km_lieux_favoris ENABLE ROW LEVEL SECURITY;

-- Politiques pour km_trajets
DROP POLICY IF EXISTS "Users can view own km_trajets" ON public.km_trajets;
CREATE POLICY "Users can view own km_trajets"
    ON public.km_trajets FOR SELECT
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can insert own km_trajets" ON public.km_trajets;
CREATE POLICY "Users can insert own km_trajets"
    ON public.km_trajets FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can update own km_trajets" ON public.km_trajets;
CREATE POLICY "Users can update own km_trajets"
    ON public.km_trajets FOR UPDATE
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can delete own km_trajets" ON public.km_trajets;
CREATE POLICY "Users can delete own km_trajets"
    ON public.km_trajets FOR DELETE
    USING (auth.uid() = owner_user_id);

-- Politiques pour km_config_auto
DROP POLICY IF EXISTS "Users can view own km_config_auto" ON public.km_config_auto;
CREATE POLICY "Users can view own km_config_auto"
    ON public.km_config_auto FOR SELECT
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can insert own km_config_auto" ON public.km_config_auto;
CREATE POLICY "Users can insert own km_config_auto"
    ON public.km_config_auto FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can update own km_config_auto" ON public.km_config_auto;
CREATE POLICY "Users can update own km_config_auto"
    ON public.km_config_auto FOR UPDATE
    USING (auth.uid() = owner_user_id);

-- Politiques pour km_lieux_favoris
DROP POLICY IF EXISTS "Users can view own km_lieux_favoris" ON public.km_lieux_favoris;
CREATE POLICY "Users can view own km_lieux_favoris"
    ON public.km_lieux_favoris FOR SELECT
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can insert own km_lieux_favoris" ON public.km_lieux_favoris;
CREATE POLICY "Users can insert own km_lieux_favoris"
    ON public.km_lieux_favoris FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can update own km_lieux_favoris" ON public.km_lieux_favoris;
CREATE POLICY "Users can update own km_lieux_favoris"
    ON public.km_lieux_favoris FOR UPDATE
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can delete own km_lieux_favoris" ON public.km_lieux_favoris;
CREATE POLICY "Users can delete own km_lieux_favoris"
    ON public.km_lieux_favoris FOR DELETE
    USING (auth.uid() = owner_user_id);

-- ==========================================
-- 6. VÉRIFICATIONS FINALES
-- ==========================================

-- Vérifier que toutes les tables existent
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('km_trajets', 'km_config_auto', 'km_lieux_favoris')
ORDER BY table_name;

-- Vérifier la colonne distance_km dans gites
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'gites'
AND column_name = 'distance_km';

SELECT '✅ Système de gestion des kilomètres créé avec succès !' as status;
