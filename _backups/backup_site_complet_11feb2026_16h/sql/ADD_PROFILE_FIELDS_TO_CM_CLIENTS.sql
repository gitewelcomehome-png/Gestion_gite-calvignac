-- =====================================================
-- AJOUT CHAMPS PROFIL DANS cm_clients
-- Date: 04 FEV 2026
-- Ajoute les colonnes manquantes pour le profil utilisateur
-- Ces champs sont maintenant collectés lors de l'onboarding
-- =====================================================

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE public.cm_clients
ADD COLUMN IF NOT EXISTS adresse TEXT,
ADD COLUMN IF NOT EXISTS code_postal TEXT,
ADD COLUMN IF NOT EXISTS ville TEXT,
ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'France',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Ajouter les commentaires
COMMENT ON COLUMN public.cm_clients.adresse IS 'Adresse complète du client (collectée lors onboarding)';
COMMENT ON COLUMN public.cm_clients.code_postal IS 'Code postal (collecté lors onboarding)';
COMMENT ON COLUMN public.cm_clients.ville IS 'Ville (collectée lors onboarding)';
COMMENT ON COLUMN public.cm_clients.pays IS 'Pays (par défaut: France, collecté lors onboarding)';
COMMENT ON COLUMN public.cm_clients.onboarding_completed IS 'Onboarding terminé = toutes infos obligatoires remplies';

-- Vérifier la structure mise à jour
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cm_clients' 
  AND column_name IN ('adresse', 'code_postal', 'ville', 'pays', 'onboarding_completed')
ORDER BY column_name;
