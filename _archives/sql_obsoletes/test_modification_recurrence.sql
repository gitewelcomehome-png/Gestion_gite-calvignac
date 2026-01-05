-- ========================================
-- NETTOYAGE ET NOUVELLE TÂCHE DE TEST
-- ========================================

-- Supprimer toutes les tâches récurrentes de test
DELETE FROM todos 
WHERE is_recurrent = true;

-- ========================================
-- CRÉER UNE NOUVELLE TÂCHE TEST VISIBLE MAINTENANT
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
    'Contrôle qualité hebdomadaire',
    'Vérifier l''état des gîtes et faire un reporting',
    'travaux',
    NULL,
    true,
    'weekly',
    '{"day_of_week": 2}'::jsonb,  -- 2 = Mardi
    '2026-01-05 00:00:00+00'::timestamptz,  -- Aujourd'hui à minuit = VISIBLE IMMÉDIATEMENT
    false,
    NULL,
    CURRENT_TIMESTAMP
);

-- ========================================
-- VÉRIFICATION : Voir la tâche créée
-- ========================================

SELECT 
    id,
    title,
    description,
    category,
    is_recurrent,
    frequency,
    frequency_detail->>'day_of_week' as jour_semaine,
    CASE 
        WHEN (frequency_detail->>'day_of_week')::int = 0 OR (frequency_detail->>'day_of_week')::int = 7 THEN 'Dimanche'
        WHEN (frequency_detail->>'day_of_week')::int = 1 THEN 'Lundi'
        WHEN (frequency_detail->>'day_of_week')::int = 2 THEN 'Mardi'
        WHEN (frequency_detail->>'day_of_week')::int = 3 THEN 'Mercredi'
        WHEN (frequency_detail->>'day_of_week')::int = 4 THEN 'Jeudi'
        WHEN (frequency_detail->>'day_of_week')::int = 5 THEN 'Vendredi'
        WHEN (frequency_detail->>'day_of_week')::int = 6 THEN 'Samedi'
    END as nom_jour,
    TO_CHAR(next_occurrence, 'DD/MM/YYYY HH24:MI:SS') as prochaine_occurrence,
    CASE 
        WHEN next_occurrence <= CURRENT_TIMESTAMP THEN '✅ VISIBLE MAINTENANT'
        ELSE '⏳ Visible le ' || TO_CHAR(next_occurrence, 'DD/MM/YYYY à HH24:MI')
    END as statut
FROM todos
WHERE is_recurrent = true
ORDER BY next_occurrence;

-- ========================================
-- TEST : Comment modifier le jour de récurrence
-- ========================================

-- Exemple 1: Changer de Mardi (2) à Vendredi (5)
-- UPDATE todos 
-- SET frequency_detail = '{"day_of_week": 5}'::jsonb,
--     next_occurrence = '2026-01-05 00:00:00+00'::timestamptz
-- WHERE title = 'Contrôle qualité hebdomadaire';

-- Exemple 2: Changer de weekly à monthly (le 1er de chaque mois)
-- UPDATE todos 
-- SET frequency = 'monthly',
--     frequency_detail = '{"day_of_month": 1}'::jsonb,
--     next_occurrence = DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
-- WHERE title = 'Contrôle qualité hebdomadaire';

-- ========================================
-- RAPPEL : Jours de la semaine
-- ========================================
-- 0 ou 7 = Dimanche
-- 1 = Lundi
-- 2 = Mardi  ← Jour actuel de la tâche test
-- 3 = Mercredi
-- 4 = Jeudi
-- 5 = Vendredi
-- 6 = Samedi
