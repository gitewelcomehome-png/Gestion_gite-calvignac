-- ================================================================
-- CONFIGURATION DATABASE WEBHOOKS — Notifications Email
-- ================================================================
-- Ce fichier configure les webhooks Supabase qui déclenchent
-- l'envoi d'emails à chaque nouvelle demande ou réservation,
-- INDÉPENDAMMENT que l'app soit ouverte ou non dans le navigateur.
--
-- Projet Supabase : ivqiisnudabxemcxxyru
-- ================================================================

-- ================================================================
-- ÉTAPE 1 : Déployer les Edge Functions (Terminal)
-- ================================================================
-- Depuis la racine du projet, exécuter :
--
--   npx supabase functions deploy notify-demande --project-ref ivqiisnudabxemcxxyru
--   npx supabase functions deploy notify-reservation --project-ref ivqiisnudabxemcxxyru
--
-- ================================================================

-- ================================================================
-- ÉTAPE 2 : Ajouter les secrets aux Edge Functions (Terminal)
-- ================================================================
--   npx supabase secrets set RESEND_API_KEY=<votre_cle_resend> --project-ref ivqiisnudabxemcxxyru
--   npx supabase secrets set RESEND_FROM_EMAIL=notifications@liveownerunit.fr --project-ref ivqiisnudabxemcxxyru
--   npx supabase secrets set RESEND_FROM_NAME="Gîte Welcome Home" --project-ref ivqiisnudabxemcxxyru
--   npx supabase secrets set WEBHOOK_SECRET=<chaine_aleatoire_longue> --project-ref ivqiisnudabxemcxxyru
--   # Générer un secret : openssl rand -hex 32
-- ================================================================

-- ================================================================
-- ÉTAPE 3 : Créer les Database Webhooks (SQL ci-dessous)
-- ================================================================
-- Ces triggers appellent les Edge Functions à chaque INSERT.
-- SUPABASE_URL et SERVICE_ROLE_KEY sont injectées automatiquement
-- dans les Edge Functions (variables d'environnement Supabase internes).
-- ================================================================

-- Extension pg_net nécessaire (activée par défaut dans Supabase)
-- Vérification :
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- ----------------------------------------------------------------
-- IMPORTANT : Configurer le secret webhook dans Postgres
-- Remplacer <meme_secret_que_WEBHOOK_SECRET> par la valeur choisie
-- ----------------------------------------------------------------
ALTER DATABASE postgres SET app.webhook_secret = '<meme_secret_que_WEBHOOK_SECRET>';

-- ----------------------------------------------------------------
-- WEBHOOK 1 : Nouvelle demande d'horaire
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_demande_horaire()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payload jsonb;
BEGIN
    payload := jsonb_build_object(
        'type', 'INSERT',
        'table', 'demandes_horaires',
        'schema', 'public',
        'record', row_to_json(NEW)::jsonb
    );

    PERFORM net.http_post(
        url := 'https://ivqiisnudabxemcxxyru.supabase.co/functions/v1/notify-demande',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', current_setting('app.webhook_secret', true)
        ),
        body := payload::text
    );

    RETURN NEW;
END;
$$;

-- Supprimer le trigger existant si besoin
DROP TRIGGER IF EXISTS trigger_notify_new_demande ON public.demandes_horaires;

-- Créer le trigger
CREATE TRIGGER trigger_notify_new_demande
    AFTER INSERT ON public.demandes_horaires
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_demande_horaire();

-- ----------------------------------------------------------------
-- WEBHOOK 2 : Nouvelle réservation
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payload jsonb;
BEGIN
    payload := jsonb_build_object(
        'type', 'INSERT',
        'table', 'reservations',
        'schema', 'public',
        'record', row_to_json(NEW)::jsonb
    );

    PERFORM net.http_post(
        url := 'https://ivqiisnudabxemcxxyru.supabase.co/functions/v1/notify-reservation',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', current_setting('app.webhook_secret', true)
        ),
        body := payload::text
    );

    RETURN NEW;
END;
$$;

-- Supprimer le trigger existant si besoin
DROP TRIGGER IF EXISTS trigger_notify_new_reservation ON public.reservations;

-- Créer le trigger
CREATE TRIGGER trigger_notify_new_reservation
    AFTER INSERT ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_reservation();

-- ================================================================
-- VÉRIFICATION
-- ================================================================
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_new_demande', 'trigger_notify_new_reservation');
