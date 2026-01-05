-- Créer la tâche récurrente du lundi pour les réservations
-- Cette tâche apparaîtra automatiquement chaque lundi

-- Calculer le prochain lundi à partir d'aujourd'hui
-- Si aujourd'hui est lundi et qu'il n'est pas encore minuit, ce sera aujourd'hui
-- Sinon ce sera le lundi prochain

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
    '{"day_of_week": 1}'::jsonb,
    -- Date dans le passé pour être visible immédiatement
    '2026-01-05 00:00:00+00'::timestamptz,
    false,
    NULL,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Vérifier le résultat
SELECT 
    id,
    title,
    category,
    is_recurrent,
    frequency,
    frequency_detail,
    next_occurrence,
    CASE 
        WHEN next_occurrence <= CURRENT_TIMESTAMP THEN '✅ VISIBLE MAINTENANT'
        ELSE '⏳ Visible le ' || TO_CHAR(next_occurrence, 'DD/MM/YYYY')
    END as statut
FROM todos
WHERE category = 'reservations' AND is_recurrent = true;
