-- ==================================================================================
-- Migration : ajout colonne is_test_data sur activites_partenaires
-- But : distinguer les activités de test (visibles uniquement en preprod)
--       des activités réelles (visibles en prod)
-- Impact JS : chargerActivitesPartenaires() filtre is_test_data=false en prod
-- Date : 2026-04-22
-- ==================================================================================

BEGIN;

-- Ajout de la colonne (sans impact sur les données existantes)
ALTER TABLE public.activites_partenaires
    ADD COLUMN IF NOT EXISTS is_test_data boolean NOT NULL DEFAULT false;

-- Marquer les 10 activités du seed LOT 1 comme données de test
-- (identifiées par le nom exact utilisé dans le seed)
UPDATE public.activites_partenaires
SET is_test_data = true
WHERE nom IN (
    'Grotte du Pech Merle',
    'Château de Cénevières',
    'Descente en canoë sur le Lot',
    'Grottes de Lacave',
    'Location vélo – Véloroute du Lot',
    'Dégustation Malbec – Cave Château La Reyne',
    'Escalade – Falaises de Calvignac',
    'Table d''hôtes Le Médiéval',
    'Visite Moulin de Cransac',
    'Randonnée guidée GR36 – Boucle des Causses'
);

COMMIT;

-- Vérification post-migration
-- SELECT nom, is_test_data FROM public.activites_partenaires ORDER BY is_test_data DESC, nom;
