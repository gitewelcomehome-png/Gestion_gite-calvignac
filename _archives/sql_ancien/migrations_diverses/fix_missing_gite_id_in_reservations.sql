-- ================================================================
-- FIX: Remplir gite_id manquant dans reservations
-- ================================================================
-- Certaines réservations peuvent avoir gite (nom texte) mais pas gite_id (UUID)
-- Ce script met à jour les gite_id en se basant sur le nom du gîte

-- 1. Vérifier combien de réservations ont gite mais pas gite_id
SELECT 
    COUNT(*) as total_sans_gite_id,
    gite
FROM reservations 
WHERE gite_id IS NULL AND gite IS NOT NULL
GROUP BY gite;

-- 2. Mettre à jour les gite_id pour Trévoux
UPDATE reservations
SET gite_id = (SELECT id FROM gites WHERE name = 'Trévoux' LIMIT 1)
WHERE gite_id IS NULL 
  AND (gite ILIKE '%trévoux%' OR gite ILIKE '%trevoux%');

-- 3. Mettre à jour les gite_id pour Le 3ème
UPDATE reservations
SET gite_id = (SELECT id FROM gites WHERE name = 'Le 3ème' LIMIT 1)
WHERE gite_id IS NULL 
  AND (gite ILIKE '%3ème%' OR gite ILIKE '%3eme%' OR gite = '3ème');

-- 4. Vérifier le résultat
SELECT 
    COUNT(*) as total_sans_gite_id,
    gite
FROM reservations 
WHERE gite_id IS NULL AND gite IS NOT NULL
GROUP BY gite;

-- 5. Afficher les réservations avec leurs gite_id
SELECT 
    r.id,
    r.gite as nom_texte,
    r.gite_id,
    g.name as nom_depuis_gites,
    r.check_in,
    r.check_out,
    r.client_name
FROM reservations r
LEFT JOIN gites g ON r.gite_id = g.id
ORDER BY r.check_in DESC
LIMIT 20;
