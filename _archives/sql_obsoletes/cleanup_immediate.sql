-- ============================================
-- SUPPRESSION IMMÉDIATE DES TABLES OBSOLÈTES
-- ============================================
-- Ce script supprime directement les tables en doublon/inutiles

-- ⚠️ ATTENTION : Suppression définitive des données !
-- Exécutez ce script uniquement après vérification

-- Tables identifiées comme obsolètes :
-- 1. client_feedback → remplacé par retours_clients
-- 2. fiches_consultations → remplacé par fiche_generation_logs  
-- 3. clients_preferences → non utilisé dans le système

DROP TABLE IF EXISTS public.client_feedback CASCADE;
DROP TABLE IF EXISTS public.fiches_consultations CASCADE;
DROP TABLE IF EXISTS public.clients_preferences CASCADE;

-- Message de confirmation
SELECT 
  '✅ Nettoyage terminé' as status,
  '3 tables obsolètes supprimées' as resultat;

-- Afficher les tables restantes
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
