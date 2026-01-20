-- ==========================================
-- 🔍 VÉRIFICATION DONNÉES FISCALES 2026
-- ==========================================

-- 1. Vue d'ensemble 2026
SELECT 
    year AS année,
    gite,
    revenus AS ca,
    jsonb_array_length(COALESCE(donnees_detaillees->'travaux_liste', '[]'::jsonb)) AS nb_travaux,
    jsonb_array_length(COALESCE(donnees_detaillees->'frais_divers_liste', '[]'::jsonb)) AS nb_frais,
    jsonb_array_length(COALESCE(donnees_detaillees->'produits_accueil_liste', '[]'::jsonb)) AS nb_produits,
    (donnees_detaillees->>'benefice_imposable')::numeric AS bénéfice,
    updated_at AS dernière_modif
FROM fiscal_history
WHERE year = 2026 AND gite = 'multi';

-- 2. Détail complet des travaux 2026
SELECT 
    jsonb_pretty(donnees_detaillees->'travaux_liste') AS "📋 Travaux",
    jsonb_pretty(donnees_detaillees->'frais_divers_liste') AS "📝 Frais divers",
    jsonb_pretty(donnees_detaillees->'produits_accueil_liste') AS "🧴 Produits"
FROM fiscal_history
WHERE year = 2026 AND gite = 'multi';

-- 3. Vérifier la structure des gîtes
SELECT 
    jsonb_object_keys(donnees_detaillees->'charges_gites') AS gites_configurés
FROM fiscal_history
WHERE year = 2026 AND gite = 'multi';

-- 4. Export CSV des travaux (pour Excel)
SELECT 
    item->>'description' AS description,
    item->>'gite' AS gite,
    (item->>'montant')::numeric AS montant
FROM fiscal_history,
     jsonb_array_elements(donnees_detaillees->'travaux_liste') AS item
WHERE year = 2026 AND gite = 'multi';
