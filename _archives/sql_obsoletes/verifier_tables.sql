-- =====================================================
-- VÉRIFICATION TABLES ET COLONNES
-- =====================================================
-- Copie/colle ce script dans Supabase SQL Editor
-- pour vérifier que toutes les tables et colonnes existent
-- =====================================================

-- 1. Vérifier si la table suivi_soldes_bancaires existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'suivi_soldes_bancaires'
) as "Table suivi_soldes_bancaires existe";

-- 2. Lister toutes les colonnes de suivi_soldes_bancaires
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'suivi_soldes_bancaires'
ORDER BY ordinal_position;

-- 3. Vérifier les colonnes de simulations_fiscales
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'simulations_fiscales' 
AND column_name IN ('annee', 'credits_liste', 'frais_perso_internet', 'frais_perso_electricite', 'frais_perso_eau', 'frais_perso_assurance', 'frais_perso_taxe', 'frais_perso_autres')
ORDER BY column_name;

-- 4. Compter les lignes dans suivi_soldes_bancaires
SELECT COUNT(*) as "Nombre de soldes enregistrés" FROM suivi_soldes_bancaires;
