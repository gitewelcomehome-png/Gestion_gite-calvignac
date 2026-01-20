-- ================================================================
-- SUPPRESSION TOTALE ET RÉINITIALISATION
-- ================================================================
-- Date: 13 janvier 2026
-- ⚠️ ATTENTION: Ceci supprimera TOUTES les réservations
-- ================================================================

-- 1. Sauvegarder le nombre actuel
SELECT COUNT(*) as nb_avant_suppression FROM reservations;

-- 2. SUPPRESSION TOTALE
-- ⚠️ DÉCOMMENTER LA LIGNE CI-DESSOUS POUR TOUT SUPPRIMER
-- DELETE FROM reservations;

-- 3. Vérification
SELECT COUNT(*) as nb_apres_suppression FROM reservations;

-- 4. Vérifier la structure de la table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;
