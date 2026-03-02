-- ================================================================
-- CONFIGURATION DATABASE WEBHOOKS — Notifications Email
-- ================================================================
-- Ce fichier configure les webhooks Supabase qui déclenchent
-- l'envoi d'emails à chaque nouvelle demande ou réservation,
-- INDÉPENDAMMENT que l'app soit ouverte ou non dans le navigateur.
--
-- Projet Supabase : fgqimtpjjhdqeyyaptoj
-- ================================================================

-- ================================================================
-- ÉTAPE 1 : Déployer les Edge Functions (Terminal)
-- ================================================================
-- Depuis la racine du projet, exécuter :
--
--   npx supabase functions deploy notify-demande --project-ref fgqimtpjjhdqeyyaptoj
--   npx supabase functions deploy notify-reservation --project-ref fgqimtpjjhdqeyyaptoj
--
-- ================================================================

-- ================================================================
-- ÉTAPE 2 : Ajouter les secrets aux Edge Functions (Terminal)
-- ================================================================
--   npx supabase secrets set RESEND_API_KEY=<votre_cle_resend> --project-ref fgqimtpjjhdqeyyaptoj
--   npx supabase secrets set RESEND_FROM_EMAIL=notifications@liveownerunit.fr --project-ref fgqimtpjjhdqeyyaptoj
--   npx supabase secrets set RESEND_FROM_NAME="Gîte Welcome Home" --project-ref fgqimtpjjhdqeyyaptoj
--   npx supabase secrets set WEBHOOK_SECRET=<chaine_aleatoire_longue> --project-ref fgqimtpjjhdqeyyaptoj
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

    BEGIN
        PERFORM net.http_post(
            url := 'https://fgqimtpjjhdqeyyaptoj.supabase.co/functions/v1/notify-demande',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', '3745a7fba3b63baf6dbe981f41eb71b527a87ba57e0a713ae6f86e790c47fb30'
            ),
            body := payload
        );
    EXCEPTION WHEN OTHERS THEN
        -- Ne pas bloquer l'INSERT si pg_net indisponible
        NULL;
    END;

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

    BEGIN
        PERFORM net.http_post(
            url := 'https://fgqimtpjjhdqeyyaptoj.supabase.co/functions/v1/notify-reservation',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', '3745a7fba3b63baf6dbe981f41eb71b527a87ba57e0a713ae6f86e790c47fb30'
            ),
            body := payload
        );
    EXCEPTION WHEN OTHERS THEN
        -- Ne pas bloquer l'INSERT si pg_net indisponible
        NULL;
    END;

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
