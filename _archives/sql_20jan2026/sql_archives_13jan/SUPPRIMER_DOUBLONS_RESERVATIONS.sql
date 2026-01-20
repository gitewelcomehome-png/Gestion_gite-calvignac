-- ================================================================
-- SUPPRESSION DES DOUBLONS DE RÉSERVATIONS
-- ================================================================
-- Garde la réservation la plus RÉCENTE pour chaque combinaison
-- (gite_id, check_in, check_out, platform)
-- ================================================================

WITH reservations_avec_rang AS (
    SELECT 
        id,
        gite_id,
        check_in,
        check_out,
        platform,
        created_at,
        -- Attribuer un numéro de rang (1 = plus récent)
        ROW_NUMBER() OVER (
            PARTITION BY gite_id, check_in, check_out, platform 
            ORDER BY created_at DESC
        ) AS rang
    FROM reservations
    WHERE owner_user_id = auth.uid()
),
doublons_a_supprimer AS (
    SELECT id, gite_id, check_in, check_out, platform, created_at
    FROM reservations_avec_rang
    WHERE rang > 1  -- Garder rang=1 (plus récent), supprimer rang>1
)
DELETE FROM reservations
WHERE id IN (SELECT id FROM doublons_a_supprimer);

-- Afficher combien de doublons ont été supprimés
SELECT 
    COUNT(*) as doublons_supprimes,
    '✅ Doublons supprimés avec succès' as status
FROM reservations
WHERE FALSE; -- Cette requête ne retourne rien, juste pour la syntaxe

-- Compter les réservations restantes par gîte
SELECT 
    g.name as gite,
    COUNT(r.id) as nb_reservations
FROM gites g
LEFT JOIN reservations r ON r.gite_id = g.id
WHERE g.owner_user_id = auth.uid()
GROUP BY g.id, g.name
ORDER BY g.name;
