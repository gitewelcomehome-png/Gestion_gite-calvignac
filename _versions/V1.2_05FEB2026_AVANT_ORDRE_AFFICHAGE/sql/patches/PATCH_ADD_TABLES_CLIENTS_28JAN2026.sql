-- ============================================================================
-- PATCH : AJOUT TABLES CLIENTS - 28 JANVIER 2026
-- ============================================================================
-- RAISON : Tables supprimées par erreur le 23/01/2026
--          Fonctionnalités ACTIVES sur pages/fiche-client.html
-- TABLES : demandes_horaires + problemes_signales
-- STRUCTURE : EXACTE depuis backup_*_20260123 (état au 23/01/2026)
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE 1 : demandes_horaires
-- ============================================================================
-- Structure EXACTE du backup_demandes_horaires_20260123

CREATE TABLE IF NOT EXISTS public.demandes_horaires (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL,
    reservation_id UUID NOT NULL,
    type TEXT,
    heure_demandee TIME WITHOUT TIME ZONE,
    motif TEXT,
    statut TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT demandes_horaires_owner_user_id_fkey 
        FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT demandes_horaires_reservation_id_fkey 
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_demandes_owner ON public.demandes_horaires(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_demandes_resa ON public.demandes_horaires(reservation_id);

-- ============================================================================
-- TABLE 2 : problemes_signales  
-- ============================================================================
-- Structure EXACTE du backup_problemes_signales_20260123

CREATE TABLE IF NOT EXISTS public.problemes_signales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL,
    gite TEXT,
    gite_id UUID,
    description TEXT,
    categorie TEXT,
    priorite TEXT,
    resolu BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT problemes_signales_owner_user_id_fkey 
        FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT problemes_signales_gite_id_fkey 
        FOREIGN KEY (gite_id) REFERENCES gites(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_problemes_owner ON public.problemes_signales(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_problemes_gite_id ON public.problemes_signales(gite_id);

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

SELECT 
    'demandes_horaires' as table_name,
    COUNT(*) as nb_lignes
FROM demandes_horaires

UNION ALL

SELECT 
    'problemes_signales' as table_name,
    COUNT(*) as nb_lignes
FROM problemes_signales;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Ces structures correspondent à l'état des tables au 23/01/2026
-- Les tables ont été restaurées depuis backup_*_20260123
-- Si le code JavaScript attend d'autres colonnes (sujet, telephone, type, etc.),
-- il faudra soit:
--   1. Migrer la structure vers la version évoluée
--   2. Adapter le code JS à la structure actuelle
-- ============================================================================
