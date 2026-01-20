-- ================================================================
-- BACKUP AVANT MIGRATION - stocks_draps
-- ================================================================
-- Date: 14 janvier 2026
-- À exécuter AVANT fix_draps_table.sql

-- 1. Vérifier le contenu de l'ancienne table
SELECT 
    COUNT(*) as nb_lignes,
    COUNT(DISTINCT gite_id) as nb_gites,
    MIN(created_at) as plus_ancienne,
    MAX(updated_at) as plus_recente
FROM stocks_draps;

-- 2. Afficher toutes les données
SELECT * FROM stocks_draps ORDER BY gite_id, type_linge;

-- 3. Créer un backup de sécurité (décommenter si nécessaire)
-- CREATE TABLE backup_stocks_draps_20260114 AS 
-- SELECT * FROM stocks_draps;

-- ================================================================
-- NOTE: Si la table contient des données importantes,
-- il faudra les migrer vers la nouvelle structure linen_stocks
-- après avoir exécuté fix_draps_table.sql
-- ================================================================
