-- ================================================================
-- MIGRATION : Trigger notification email tâches de ménage
-- Couvre : cleaning_schedule (planning) ET todos (achats/travaux)
-- À exécuter dans Supabase SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- TRIGGER 1 : Planning ménage (cleaning_schedule)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_tache_menage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payload jsonb;
BEGIN
    payload := jsonb_build_object(
        'type', 'INSERT',
        'table', 'cleaning_schedule',
        'schema', 'public',
        'record', row_to_json(NEW)::jsonb
    );

    BEGIN
        PERFORM net.http_post(
            url := 'https://fgqimtpjjhdqeyyaptoj.supabase.co/functions/v1/notify-taches',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', '3745a7fba3b63baf6dbe981f41eb71b527a87ba57e0a713ae6f86e790c47fb30'
            ),
            body := payload
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_tache ON public.cleaning_schedule;

CREATE TRIGGER trigger_notify_new_tache
    AFTER INSERT ON public.cleaning_schedule
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_tache_menage();

-- ----------------------------------------------------------------
-- TRIGGER 2 : Tâches achats/travaux (todos)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_todo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payload jsonb;
BEGIN
    -- Notifier uniquement les tâches achats et travaux (pas les todos personnels)
    IF NEW.category NOT IN ('achats', 'travaux') THEN
        RETURN NEW;
    END IF;

    payload := jsonb_build_object(
        'type', 'INSERT',
        'table', 'todos',
        'schema', 'public',
        'record', row_to_json(NEW)::jsonb
    );

    BEGIN
        PERFORM net.http_post(
            url := 'https://fgqimtpjjhdqeyyaptoj.supabase.co/functions/v1/notify-taches',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', '3745a7fba3b63baf6dbe981f41eb71b527a87ba57e0a713ae6f86e790c47fb30'
            ),
            body := payload
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_todo ON public.todos;

CREATE TRIGGER trigger_notify_new_todo
    AFTER INSERT ON public.todos
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_todo();

-- Vérification
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_new_tache', 'trigger_notify_new_todo');
