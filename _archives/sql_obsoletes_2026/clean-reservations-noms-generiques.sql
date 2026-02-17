-- ================================================================
-- NETTOYAGE DES RÉSERVATIONS AVEC NOMS GÉNÉRIQUES
-- ================================================================
-- OBJECTIF : Supprimer toutes les réservations iCal qui n'ont pas
-- été personnalisées avec un vrai nom de client (Reserved, BOOKED, etc.)
-- ================================================================

-- ================================================================
-- 1. PREVIEW : AFFICHER LES RÉSERVATIONS À SUPPRIMER
-- ================================================================
SELECT 
    r.id,
    g.name as gite,
    r.client_name,
    r.check_in,
    r.check_out,
    r.status,
    r.synced_from,
    r.manual_override,
    r.created_at,
    CASE 
        WHEN r.client_name LIKE 'Reserved%' THEN '🔴 Nom générique: Reserved'
        WHEN r.client_name = 'BOOKED' THEN '🔴 Nom générique: BOOKED'
        WHEN r.client_name LIKE '%Client Airbnb%' THEN '🔴 Nom générique: Client Airbnb'
        WHEN r.client_name LIKE 'Reserved - %' THEN '🔴 Nom générique: Reserved - Prénom'
        ELSE '⚠️ Autre'
    END as raison_suppression
FROM reservations r
LEFT JOIN gites g ON g.id = r.gite_id
WHERE 
    r.ical_uid IS NOT NULL  -- Seulement les réservations iCal
    AND r.manual_override = FALSE  -- Ne pas toucher aux réservations protégées
    AND (
        -- Noms génériques à cibler
        r.client_name LIKE 'Reserved%'
        OR r.client_name = 'BOOKED'
        OR r.client_name LIKE '%Client Airbnb%'
        OR r.client_name LIKE 'Reserved - %'
    )
ORDER BY r.check_in DESC;

-- ================================================================
-- 2. COMPTER LE NOMBRE DE RÉSERVATIONS À SUPPRIMER
-- ================================================================
SELECT 
    COUNT(*) as total_a_supprimer,
    COUNT(DISTINCT gite_id) as gites_concernes,
    MIN(check_in) as plus_ancienne,
    MAX(check_in) as plus_recente
FROM reservations
WHERE 
    ical_uid IS NOT NULL
    AND manual_override = FALSE
    AND (
        client_name LIKE 'Reserved%'
        OR client_name = 'BOOKED'
        OR client_name LIKE '%Client Airbnb%'
        OR client_name LIKE 'Reserved - %'
    );

-- ================================================================
-- 3. RÉPARTITION PAR TYPE DE NOM GÉNÉRIQUE
-- ================================================================
SELECT 
    CASE 
        WHEN client_name LIKE 'Reserved - %' THEN 'Reserved - Prénom'
        WHEN client_name LIKE 'Reserved%' THEN 'Reserved (sans prénom)'
        WHEN client_name = 'BOOKED' THEN 'BOOKED'
        WHEN client_name LIKE '%Client Airbnb%' THEN 'Client Airbnb'
        ELSE 'Autre'
    END as type_nom,
    COUNT(*) as nombre,
    STRING_AGG(DISTINCT g.name, ', ') as gites_concernes
FROM reservations r
LEFT JOIN gites g ON g.id = r.gite_id
WHERE 
    ical_uid IS NOT NULL
    AND manual_override = FALSE
    AND (
        client_name LIKE 'Reserved%'
        OR client_name = 'BOOKED'
        OR client_name LIKE '%Client Airbnb%'
        OR client_name LIKE 'Reserved - %'
    )
GROUP BY type_nom
ORDER BY nombre DESC;

-- ================================================================
-- 4. ⚠️ SUPPRESSION - DÉCOMMENTER POUR EXÉCUTER
-- ================================================================
-- ATTENTION : Cette action est IRRÉVERSIBLE !
-- Vérifiez bien les résultats des requêtes ci-dessus avant de lancer

/*
DELETE FROM reservations
WHERE 
    ical_uid IS NOT NULL
    AND manual_override = FALSE
    AND (
        client_name LIKE 'Reserved%'
        OR client_name = 'BOOKED'
        OR client_name LIKE '%Client Airbnb%'
        OR client_name LIKE 'Reserved - %'
    )
RETURNING 
    id, 
    client_name, 
    check_in, 
    check_out,
    synced_from,
    '✅ Supprimée' as statut;
*/

-- ================================================================
-- 5. ALTERNATIVE : Marquer comme "cancelled" au lieu de supprimer
-- ================================================================
-- Si vous préférez garder un historique, marquer comme cancelled :

/*
UPDATE reservations
SET 
    status = 'cancelled',
    notes = 'Annulée automatiquement (nom générique non personnalisé)'
WHERE 
    ical_uid IS NOT NULL
    AND manual_override = FALSE
    AND status != 'cancelled'  -- Ne pas re-traiter les déjà cancelled
    AND (
        client_name LIKE 'Reserved%'
        OR client_name = 'BOOKED'
        OR client_name LIKE '%Client Airbnb%'
        OR client_name LIKE 'Reserved - %'
    )
RETURNING 
    id, 
    client_name, 
    check_in, 
    check_out,
    '✅ Marquée comme cancelled' as statut;
*/
