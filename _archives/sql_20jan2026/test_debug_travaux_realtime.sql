-- ==========================================
-- 🧪 TEST DEBUG FISCAL 2026 - TEMPS RÉEL
-- ==========================================

-- 🔍 REQUÊTE 1 : Vue instantanée des travaux 2026
SELECT 
    '🕐 ' || to_char(NOW(), 'HH24:MI:SS') AS horodatage,
    year AS année,
    jsonb_array_length(COALESCE(donnees_detaillees->'travaux_liste', '[]'::jsonb)) AS nb_travaux,
    donnees_detaillees->'travaux_liste' AS travaux_brut,
    to_char(updated_at, 'HH24:MI:SS') AS derniere_modif
FROM fiscal_history
WHERE year = 2026 AND gite = 'multi';

-- 🔍 REQUÊTE 2 : Détail formaté des travaux
SELECT 
    jsonb_array_elements(donnees_detaillees->'travaux_liste')->>'description' AS description,
    jsonb_array_elements(donnees_detaillees->'travaux_liste')->>'gite' AS gite,
    (jsonb_array_elements(donnees_detaillees->'travaux_liste')->>'montant')::numeric AS montant
FROM fiscal_history
WHERE year = 2026 AND gite = 'multi'
  AND jsonb_array_length(donnees_detaillees->'travaux_liste') > 0;

-- 🔍 REQUÊTE 3 : Historique des modifications (dernières 5 minutes)
SELECT 
    to_char(updated_at, 'HH24:MI:SS') AS heure,
    jsonb_array_length(COALESCE(donnees_detaillees->'travaux_liste', '[]'::jsonb)) AS nb_travaux,
    donnees_detaillees->'travaux_liste' AS travaux
FROM fiscal_history
WHERE year = 2026 
  AND gite = 'multi'
  AND updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;

-- 🔍 REQUÊTE 4 : Dump complet JSONB
SELECT jsonb_pretty(donnees_detaillees) AS "📋 Données complètes"
FROM fiscal_history
WHERE year = 2026 AND gite = 'multi';
