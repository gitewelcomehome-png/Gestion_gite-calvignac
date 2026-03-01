-- ================================================================
-- 🔧 AMÉLIORATION SOLUTION CALENDRIER
-- ================================================================
-- Enrichir les symptômes pour meilleur matching
-- ================================================================

-- Mettre à jour la solution existante avec plus de mots-clés
UPDATE cm_support_solutions
SET 
    symptomes = ARRAY['synchronisation', 'calendrier', 'ical', 'airbnb', 'booking', 'réservations', 'affichage', 'sync', 'synchro', 'problème', 'erreur', 'import', 'export'],
    efficacite_score = 0.90,
    updated_at = NOW()
WHERE titre = 'Erreur de synchronisation du calendrier';

-- ================================================================
-- ✅ SOLUTION ENRICHIE
-- ================================================================
-- La solution a maintenant 13 mots-clés au lieu de 7
-- Augmente les chances de matching avec les tickets
-- ================================================================
