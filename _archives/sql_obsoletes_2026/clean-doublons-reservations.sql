-- ================================================================
-- NETTOYAGE DES DOUBLONS DE RÉSERVATIONS
-- ================================================================
-- RÈGLE : Un gîte ne peut avoir qu'UNE réservation à la fois
-- Si plusieurs réservations ont les mêmes dates sur le même gîte → DOUBLON
-- ================================================================

-- 1. AFFICHER LES DOUBLONS DÉTECTÉS
WITH doublons AS (
    SELECT 
        gite_id,
        check_in,
        check_out,
        COUNT(*) as nb_doublons,
        STRING_AGG(client_name || ' (' || status || ', créée le ' || created_at::date || ')', ' | ') as reservations
    FROM reservations
    WHERE ical_uid IS NOT NULL
    GROUP BY gite_id, check_in, check_out
    HAVING COUNT(*) > 1
)
SELECT 
    g.name as gite,
    d.check_in,
    d.check_out,
    d.nb_doublons,
    d.reservations
FROM doublons d
LEFT JOIN gites g ON g.id = d.gite_id
ORDER BY d.check_in DESC;

-- ================================================================
-- 2. SUPPRIMER LES DOUBLONS (garder la meilleure)
-- ================================================================
-- RÈGLE DE SÉLECTION :
-- 1. Garder celle avec status = 'confirmed' si elle existe
-- 2. Sinon garder la plus récente (created_at)
-- ================================================================

-- DÉCOMMENTER POUR EXÉCUTER LA SUPPRESSION :
/*
WITH doublons AS (
    SELECT 
        id,
        gite_id,
        check_in,
        check_out,
        client_name,
        status,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY gite_id, check_in, check_out 
            ORDER BY 
                CASE WHEN status = 'confirmed' THEN 0 ELSE 1 END, -- confirmed en premier
                created_at DESC -- puis la plus récente
        ) as rang
    FROM reservations
    WHERE ical_uid IS NOT NULL
)
DELETE FROM reservations
WHERE id IN (
    SELECT id 
    FROM doublons 
    WHERE rang > 1  -- Supprimer toutes sauf la première (rang 1)
)
RETURNING 
    id, 
    client_name, 
    check_in, 
    check_out,
    'Doublon supprimé' as action;
*/
