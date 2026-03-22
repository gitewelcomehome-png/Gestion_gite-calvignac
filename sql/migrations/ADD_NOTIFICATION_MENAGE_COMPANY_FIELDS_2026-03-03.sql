-- ================================================================
-- AJOUT PRÉFÉRENCES NOTIFICATION SOCIÉTÉ DE MÉNAGE
-- Date: 2026-03-03
-- ================================================================
-- Objectif:
-- - Ajouter l'option d'activation des emails de modification auto du planning ménage
-- - Ajouter l'email de destination de la société de ménage
-- ================================================================

DO $$
BEGIN
    -- Current canonical table in rebuild scripts.
    IF to_regclass('public.notification_preferences') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.notification_preferences
                    ADD COLUMN IF NOT EXISTS notify_menage_modifications boolean NOT NULL DEFAULT false';
        EXECUTE 'ALTER TABLE public.notification_preferences
                    ADD COLUMN IF NOT EXISTS menage_company_email text';

        EXECUTE 'COMMENT ON COLUMN public.notification_preferences.notify_menage_modifications
                    IS ''Active les emails vers la societe de menage lors des replanifications automatiques de planning.''' ;
        EXECUTE 'COMMENT ON COLUMN public.notification_preferences.menage_company_email
                    IS ''Adresse email de la societe de menage pour recevoir les notifications de planning auto.''' ;
    END IF;

    -- Backward compatibility with older schema name.
    IF to_regclass('public.user_notification_preferences') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.user_notification_preferences
                    ADD COLUMN IF NOT EXISTS notify_menage_modifications boolean NOT NULL DEFAULT false';
        EXECUTE 'ALTER TABLE public.user_notification_preferences
                    ADD COLUMN IF NOT EXISTS menage_company_email text';

        EXECUTE 'COMMENT ON COLUMN public.user_notification_preferences.notify_menage_modifications
                    IS ''Active les emails vers la societe de menage lors des replanifications automatiques de planning.''' ;
        EXECUTE 'COMMENT ON COLUMN public.user_notification_preferences.menage_company_email
                    IS ''Adresse email de la societe de menage pour recevoir les notifications de planning auto.''' ;
    END IF;
END $$;
