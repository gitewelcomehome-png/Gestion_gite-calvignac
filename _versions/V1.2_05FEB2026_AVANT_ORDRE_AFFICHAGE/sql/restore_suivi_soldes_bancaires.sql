-- =====================================================
-- RESTAURATION TABLE suivi_soldes_bancaires
-- Date: 03 FEV 2026
-- Renomme la table backup pour la rendre utilisable
-- =====================================================

-- 1. Renommer la table backup
ALTER TABLE public.backup_suivi_soldes_bancaires_20260123 
RENAME TO suivi_soldes_bancaires;

-- 2. Vérifier la structure
COMMENT ON TABLE public.suivi_soldes_bancaires IS 'Suivi mensuel de la trésorerie - Restauré le 03/02/2026';

-- 3. Créer l'index si nécessaire
CREATE INDEX IF NOT EXISTS idx_suivi_soldes_annee_mois 
ON public.suivi_soldes_bancaires(annee, mois);

CREATE INDEX IF NOT EXISTS idx_suivi_soldes_owner 
ON public.suivi_soldes_bancaires(owner_user_id);

-- 4. Vérifier les données
SELECT COUNT(*) as total_records, 
       MIN(annee) as annee_min, 
       MAX(annee) as annee_max
FROM public.suivi_soldes_bancaires;
