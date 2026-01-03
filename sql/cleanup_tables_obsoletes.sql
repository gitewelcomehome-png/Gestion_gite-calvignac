-- ============================================
-- NETTOYAGE DES TABLES OBSOLÈTES
-- Script pour supprimer les tables inutiles ou en doublon
-- ============================================

-- ANALYSE DES DOUBLONS DÉTECTÉS :
-- 1. client_feedback VS retours_clients (même fonction)
-- 2. fiches_consultations VS activites_consultations (confusion de nommage)
-- 3. clients_preferences (non utilisé dans le système actuel)

-- ============================================
-- AVERTISSEMENT : Vérifiez avant d'exécuter !
-- ============================================
-- Ce script va SUPPRIMER définitivement des tables et leurs données.
-- Assurez-vous qu'elles ne contiennent pas de données importantes.

-- ============================================
-- ÉTAPE 1 : Vérifier le contenu des tables
-- ============================================

-- Vérifier si client_feedback contient des données
SELECT 'client_feedback' as table_name, COUNT(*) as nombre_lignes 
FROM client_feedback;

-- Vérifier si fiches_consultations contient des données
SELECT 'fiches_consultations' as table_name, COUNT(*) as nombre_lignes 
FROM fiches_consultations;

-- Vérifier si clients_preferences contient des données
SELECT 'clients_preferences' as table_name, COUNT(*) as nombre_lignes 
FROM clients_preferences;


-- ============================================
-- ÉTAPE 2 : Migration des données (si nécessaire)
-- ============================================

-- Si client_feedback contient des données, les migrer vers retours_clients
-- DÉCOMMENTEZ ces lignes si vous avez des données à migrer :

/*
INSERT INTO retours_clients (reservation_id, type, sujet, description, urgence, status, created_at)
SELECT 
  reservation_id,
  'retour' as type,
  subject as sujet,
  feedback as description,
  CASE 
    WHEN priority = 'high' THEN 'haute'
    WHEN priority = 'low' THEN 'basse'
    ELSE 'normale'
  END as urgence,
  CASE 
    WHEN resolved = true THEN 'resolu'
    ELSE 'nouveau'
  END as status,
  created_at
FROM client_feedback
WHERE reservation_id IS NOT NULL
ON CONFLICT DO NOTHING;
*/


-- ============================================
-- ÉTAPE 3 : Suppression des tables obsolètes
-- ============================================

-- DÉCOMMENTEZ LES LIGNES CI-DESSOUS APRÈS VÉRIFICATION

-- Table obsolète : client_feedback (remplacé par retours_clients)
-- DROP TABLE IF EXISTS public.client_feedback CASCADE;

-- Table obsolète : fiches_consultations (doublon, utiliser fiche_generation_logs)
-- DROP TABLE IF EXISTS public.fiches_consultations CASCADE;

-- Table obsolète : clients_preferences (non utilisé)
-- DROP TABLE IF EXISTS public.clients_preferences CASCADE;


-- ============================================
-- RÉSUMÉ DES TABLES CONSERVÉES (Système actif)
-- ============================================

/*
✅ TABLES ESSENTIELLES À GARDER :

SYSTÈME DE RÉSERVATIONS :
- reservations (table principale)
- cleaning_schedule (planning ménage)
- todos (tâches récurrentes)
- commits_log (historique déploiements)

SYSTÈME DE FICHES CLIENTS :
- infos_gites (configuration gîtes)
- checklists (items entrée/sortie)
- checklist_validations (validations par client)
- demandes_horaires (arrivées/départs flexibles)
- retours_clients (feedbacks et problèmes)
- client_access_tokens (sécurité tokens)
- fiche_generation_logs (historique générations)
- activites_consultations (stats activités)

SYSTÈME FINANCIER :
- charges (dépenses)
- historical_data (historique CA)
- simulations_fiscalite (calculs fiscaux)
- suivi_soldes_bancaires (trésorerie)

CONTENU :
- activites_gites (activités à découvrir)
- faq (questions fréquentes)
- recurrent_actions (actions récurrentes)
*/


-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

-- Afficher la liste des tables restantes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
