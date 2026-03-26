-- ================================================================
-- MIGRATION : Ajout colonnes client_name et sujet dans problemes_signales
-- + Trigger notification email retour client
-- À exécuter dans Supabase SQL Editor
-- ================================================================

-- 1. Ajouter client_name si absent
ALTER TABLE public.problemes_signales
    ADD COLUMN IF NOT EXISTS client_name TEXT;

-- 2. Ajouter sujet si absent
ALTER TABLE public.problemes_signales
    ADD COLUMN IF NOT EXISTS sujet TEXT;

-- 3. Rendre owner_user_id nullable (la fiche client passe null si absent)
ALTER TABLE public.problemes_signales
    ALTER COLUMN owner_user_id DROP NOT NULL;

-- 4. Créer le trigger webhook notif retour client
CREATE OR REPLACE FUNCTION notify_new_retour_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payload jsonb;
    webhook_secret text := 'WEBHOOK_SECRET_PLACEHOLDER';
BEGIN
    payload := jsonb_build_object(
        'type', 'INSERT',
        'table', 'problemes_signales',
        'schema', 'public',
        'record', row_to_json(NEW)::jsonb || jsonb_build_object(
            '_client_name', COALESCE(NEW.client_name, '')
        )
    );

    BEGIN
        PERFORM net.http_post(
            url := 'https://fgqimtpjjhdqeyyaptoj.supabase.co/functions/v1/notify-retour-client',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', webhook_secret
            ),
            body := payload
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_retour_client ON public.problemes_signales;

CREATE TRIGGER trigger_notify_retour_client
    AFTER INSERT ON public.problemes_signales
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_retour_client();

-- Vérification
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_retour_client';
