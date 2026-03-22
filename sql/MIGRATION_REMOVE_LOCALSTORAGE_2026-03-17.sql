-- ==============================================================================
-- MIGRATION : Suppression localStorage → BDD
-- Date: 17 mars 2026
--
-- Contexte: Migration des préférences utilisateur stockées en localStorage
-- vers la table user_settings (persistance BDD).
--
-- Changements:
--   1) user_settings.fiscalite_options_perso BOOLEAN : toggle options perso fiscalité
--   2) notification_preferences.notify_commandes BOOLEAN : notif nouvelle commande
--      + recréation vue user_notification_preferences avec la nouvelle colonne
-- ==============================================================================

-- 1) Ajouter la colonne fiscalite_options_perso
ALTER TABLE public.user_settings
    ADD COLUMN IF NOT EXISTS fiscalite_options_perso BOOLEAN DEFAULT false;

-- 2) Ajouter notify_commandes sur la TABLE réelle (pas la vue)
--    user_notification_preferences est une vue sur notification_preferences
ALTER TABLE public.notification_preferences
    ADD COLUMN IF NOT EXISTS notify_commandes BOOLEAN DEFAULT true;

-- 3) Recréer la vue pour exposer la nouvelle colonne
DROP VIEW IF EXISTS public.user_notification_preferences;
CREATE VIEW public.user_notification_preferences AS
SELECT
    id,
    user_id,
    email_enabled,
    email_address,
    notify_demandes,
    notify_reservations,
    notify_taches,
    notify_commandes,
    email_frequency,
    push_enabled,
    sms_enabled,
    notification_types,
    updated_at
FROM public.notification_preferences;

-- Vérification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notification_preferences'
  AND column_name IN ('notify_commandes', 'notify_demandes', 'notify_taches')
ORDER BY column_name;
