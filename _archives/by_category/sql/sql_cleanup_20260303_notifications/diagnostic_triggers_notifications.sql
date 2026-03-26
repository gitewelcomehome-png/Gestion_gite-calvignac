-- ================================================================
-- DIAGNOSTIC : Vérifier les triggers de notifications
-- À exécuter dans Supabase SQL Editor
-- ================================================================

-- 1. Vérifier que les triggers existent
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
    'trigger_notify_new_demande',
    'trigger_notify_new_reservation'
);

-- 2. Vérifier que pg_net est actif
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_net';

-- 3. Tester pg_net directement (appel manuel)
SELECT net.http_post(
    url := 'https://fgqimtpjjhdqeyyaptoj.supabase.co/functions/v1/notify-demande',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'WEBHOOK_SECRET_PLACEHOLDER'
    ),
    body := '{"type":"INSERT","table":"demandes_horaires","record":{"id":"test-trigger-direct","owner_user_id":"9d3a6830-6b5c-4566-ad20-179250ed5a21","reservation_id":"test","type":"arrivee","heure_demandee":"15:00","motif":"Test trigger direct depuis SQL","statut":"en_attente","created_at":"2026-03-02T22:00:00Z"}}'::text
);

-- 4. Vérifier le résultat de la requête pg_net (attendre 2-3 secondes puis exécuter)
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;
