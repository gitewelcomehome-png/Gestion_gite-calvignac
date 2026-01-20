-- ==========================================
-- 🔍 VÉRIFICATION DONNÉES FISCALES ANNUELLES
-- ==========================================

-- 1. Voir toutes les données fiscales par année avec travaux
SELECT 
    id,
    year AS annee,
    gite,
    revenus AS ca,
    donnees_detaillees->'travaux_liste' AS travaux,
    jsonb_array_length(donnees_detaillees->'travaux_liste') AS nb_travaux,
    created_at,
    updated_at
FROM fiscal_history
ORDER BY year DESC, updated_at DESC;

-- 2. Détail des travaux pour 2026
SELECT 
    id,
    year AS annee,
    gite,
    revenus AS ca,
    jsonb_pretty(donnees_detaillees->'travaux_liste') AS travaux_detail,
    jsonb_pretty(donnees_detaillees->'frais_divers_liste') AS frais_divers_detail,
    created_at,
    updated_at
FROM fiscal_history
WHERE year = 2026
  AND gite = 'multi'
ORDER BY updated_at DESC
LIMIT 1;

-- 3. Vérifier qu'il n'y a qu'UNE entrée par année
SELECT 
    year,
    gite,
    COUNT(*) AS nb_enregistrements,
    MAX(updated_at) AS derniere_modif
FROM fiscal_history
GROUP BY year, gite
ORDER BY year DESC;

-- 4. Voir TOUTES les données fiscales 2026
SELECT 
    year,
    gite,
    revenus,
    donnees_detaillees
FROM fiscal_history
WHERE year = 2026
  AND gite = 'multi'
ORDER BY updated_at DESC
LIMIT 1;

-- 5. NETTOYER les doublons si nécessaire (DANGER: à utiliser avec précaution)
-- DELETE FROM fiscal_history
-- WHERE id NOT IN (
--     SELECT DISTINCT ON (owner_user_id, year, gite) id
--     FROM fiscal_history
--     ORDER BY owner_user_id, year, gite, updated_at DESC
-- );
