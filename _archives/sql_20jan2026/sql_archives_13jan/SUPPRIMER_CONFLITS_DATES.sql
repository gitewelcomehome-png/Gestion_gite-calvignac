-- ================================================================
-- SUPPRESSION DES RÉSERVATIONS EN CONFLIT (MÊME DATE/GÎTE)
-- ================================================================
-- Date: 13 janvier 2026
-- Règle: Un gîte ne peut avoir qu'UNE réservation à la fois
-- Si 2 réservations sur même période/gîte → garder la plus courte
-- ================================================================

-- 1. IDENTIFIER LES CONFLITS (même gîte, dates qui se chevauchent)
WITH conflits AS (
    SELECT 
        r1.id as id1,
        r1.check_in as debut1,
        r1.check_out as fin1,
        r1.check_out::date - r1.check_in::date as duree1,
        r1.client_name as client1,
        r2.id as id2,
        r2.check_in as debut2,
        r2.check_out as fin2,
        r2.check_out::date - r2.check_in::date as duree2,
        r2.client_name as client2,
        r1.gite_id
    FROM reservations r1
    JOIN reservations r2 ON 
        r1.gite_id = r2.gite_id 
        AND r1.id < r2.id  -- Éviter les doublons (comparaison dans un seul sens)
        AND (
            -- Chevauchement de dates OU même date de début
            r1.check_in = r2.check_in OR
            (r1.check_in < r2.check_out AND r1.check_out > r2.check_in)
        )
)
SELECT 
    id1,
    debut1,
    fin1,
    duree1 as jours1,
    client1,
    id2,
    debut2,
    fin2,
    duree2 as jours2,
    client2,
    CASE 
        WHEN duree1 < duree2 THEN 'GARDER id1, SUPPRIMER id2'
        WHEN duree2 < duree1 THEN 'GARDER id2, SUPPRIMER id1'
        ELSE 'CONFLIT - durées égales, vérifier manuellement'
    END as action_recommandee
FROM conflits
ORDER BY debut1;

-- 2. COMPTER LES CONFLITS
WITH conflits AS (
    SELECT 
        r1.id as id1,
        r2.id as id2,
        r1.check_out::date - r1.check_in::date as duree1,
        r2.check_out::date - r2.check_in::date as duree2
    FROM reservations r1
    JOIN reservations r2 ON 
        r1.gite_id = r2.gite_id 
        AND r1.id < r2.id
        AND (
            r1.check_in = r2.check_in OR
            (r1.check_in < r2.check_out AND r1.check_out > r2.check_in)
        )
)
SELECT COUNT(*) as nb_paires_en_conflit FROM conflits;

-- 3. SUPPRESSION AUTOMATIQUE (garder la plus courte)
-- ⚠️ DÉCOMMENTER LES LIGNES CI-DESSOUS POUR EXÉCUTER
/*
WITH conflits AS (
    SELECT 
        r1.id as id1,
        r2.id as id2,
        r1.check_out::date - r1.check_in::date as duree1,
        r2.check_out::date - r2.check_in::date as duree2
    FROM reservations r1
    JOIN reservations r2 ON 
        r1.gite_id = r2.gite_id 
        AND r1.id < r2.id
        AND (
            r1.check_in = r2.check_in OR
            (r1.check_in < r2.check_out AND r1.check_out > r2.check_in)
        )
),
ids_to_delete AS (
    SELECT 
        CASE 
            WHEN duree1 < duree2 THEN id2  -- Supprimer la plus longue
            WHEN duree2 < duree1 THEN id1
            ELSE id2  -- Si égales, supprimer arbitrairement id2
        END as id_a_supprimer
    FROM conflits
)
DELETE FROM reservations WHERE id IN (SELECT id_a_supprimer FROM ids_to_delete);
*/

-- 4. VÉRIFICATION POST-SUPPRESSION
-- SELECT COUNT(*) as nb_reservations_restantes FROM reservations;
