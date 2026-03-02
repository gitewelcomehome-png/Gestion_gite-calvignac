-- ================================================================
-- INSERT préférences notifications pour l'owner
-- À exécuter ONCE dans Supabase SQL Editor
-- ================================================================
-- user_id : 9d3a6830-6b5c-4566-ad20-179250ed5a21
-- email   : stephanecalvignac@hotmail.fr
-- ================================================================

INSERT INTO public.user_notification_preferences (
    user_id,
    email_enabled,
    email_address,
    notify_demandes,
    notify_reservations,
    notify_taches,
    email_frequency
)
VALUES (
    '9d3a6830-6b5c-4566-ad20-179250ed5a21',
    true,
    'stephanecalvignac@hotmail.fr',
    true,
    true,
    true,
    'immediate'
)
ON CONFLICT (user_id) DO UPDATE SET
    email_enabled        = true,
    email_address        = 'stephanecalvignac@hotmail.fr',
    notify_demandes      = true,
    notify_reservations  = true,
    notify_taches        = true,
    email_frequency      = 'immediate';

-- Vérification
SELECT * FROM public.user_notification_preferences
WHERE user_id = '9d3a6830-6b5c-4566-ad20-179250ed5a21';
