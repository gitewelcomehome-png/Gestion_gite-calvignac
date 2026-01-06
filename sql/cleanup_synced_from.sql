-- 🧹 VIDAGE COMPLET TABLE RÉSERVATIONS TRÉVOUX
-- Suppression totale pour repartir à zéro

-- ==========================================
-- 1. VOIR CE QUI VA ÊTRE SUPPRIMÉ
-- ==========================================
SELECT 
    date_debut,
    date_fin,
    nom_client as client,
    synced_from,
    plateforme
FROM reservations 
WHERE gite = 'Trévoux'
  AND date_fin >= '2026-01-01'
ORDER BY date_debut;

-- ==========================================
-- 2. SUPPRIMER TOUTES LES RÉSERVATIONS TRÉVOUX 2026+
-- ==========================================
DELETE FROM reservations 
WHERE gite = 'Trévoux'
  AND date_fin >= '2026-01-01';

-- ==========================================
-- 3. VÉRIFICATION (doit être vide)
-- ==========================================
SELECT COUNT(*) as "Réservations restantes"
FROM reservations 
WHERE gite = 'Trévoux'
  AND date_fin >= '2026-01-01';

-- ==========================================
-- 📝 APRÈS CE NETTOYAGE :
-- ==========================================
-- 1. Allez dans l'application
-- 2. Cliquez sur 🔄 Forcer la synchronisation
-- 3. Les réservations seront réimportées proprement :
--    - Airbnb → syncedFrom = 'airbnb'
--    - Abritel → syncedFrom = 'abritel'
--    - Gîtes de France → syncedFrom = 'gitesDeFrance'
-- 4. Plus de conflits ni de doublons !
