-- ========================================
-- NETTOYAGE DES TÂCHES RÉCURRENTES EXISTANTES
-- ========================================

-- Supprimer toutes les tâches récurrentes de test
DELETE FROM todos 
WHERE is_recurrent = true 
  AND (title LIKE '%TEST%' OR title LIKE '%Vérifier réservations%');

-- ========================================
-- CRÉER UNE TÂCHE DE TEST VISIBLE IMMÉDIATEMENT
-- ========================================

INSERT INTO todos (
    title, 
    description, 
    category, 
    gite, 
    is_recurrent, 
    frequency, 
    frequency_detail, 
    next_occurrence, 
    completed, 
    archived_at,
    created_at
)
VALUES (
    'Vérifier réservations de la semaine',
    'Contrôler les paiements et envoyer les fiches clients',
    'reservations',
    NULL,
    true,
    'weekly',
    '{"day_of_week": 1}'::jsonb,  -- 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi, 0 ou 7=Dimanche
    '2026-01-05 00:00:00+00'::timestamptz,  -- Aujourd'hui à minuit = VISIBLE IMMÉDIATEMENT
    false,
    NULL,
    CURRENT_TIMESTAMP
);

-- ========================================
-- VÉRIFICATION : Afficher toutes les tâches récurrentes
-- ========================================

SELECT 
    id,
    title,
    category,
    is_recurrent,
    frequency,
    frequency_detail->>'day_of_week' as jour_semaine,
    TO_CHAR(next_occurrence, 'DD/MM/YYYY HH24:MI:SS TZ') as prochaine_occurrence,
    CASE 
        WHEN next_occurrence <= CURRENT_TIMESTAMP THEN '✅ VISIBLE MAINTENANT'
        ELSE '⏳ Visible le ' || TO_CHAR(next_occurrence, 'DD/MM/YYYY à HH24:MI')
    END as statut,
    TO_CHAR(CURRENT_TIMESTAMP, 'DD/MM/YYYY HH24:MI:SS TZ') as heure_serveur
FROM todos
WHERE is_recurrent = true
ORDER BY next_occurrence;

-- ========================================
-- LÉGENDE DES JOURS DE LA SEMAINE
-- ========================================
-- 0 ou 7 = Dimanche
-- 1 = Lundi
-- 2 = Mardi
-- 3 = Mercredi
-- 4 = Jeudi
-- 5 = Vendredi
-- 6 = Samedi

-- ========================================
-- EXEMPLES POUR MODIFIER LE JOUR DE RÉCURRENCE
-- ========================================

-- Pour changer le jour (ex: passer au mardi) :
-- UPDATE todos 
-- SET frequency_detail = '{"day_of_week": 2}'::jsonb
-- WHERE title = 'Vérifier réservations de la semaine';

-- Pour forcer la visibilité immédiate d'une tâche :
-- UPDATE todos 
-- SET next_occurrence = DATE_TRUNC('day', CURRENT_TIMESTAMP)
-- WHERE is_recurrent = true;
