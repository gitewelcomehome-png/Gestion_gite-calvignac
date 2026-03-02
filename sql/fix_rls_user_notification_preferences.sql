-- ================================================================
-- FIX RLS : user_notification_preferences
-- ================================================================
-- Permet aux utilisateurs authentifiés de lire/écrire leurs propres préférences
-- ================================================================

-- Activer RLS (si pas déjà fait)
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- SELECT : chaque user voit uniquement ses propres prefs
DROP POLICY IF EXISTS "auth_select_own_notification_prefs" ON public.user_notification_preferences;
CREATE POLICY "auth_select_own_notification_prefs"
ON public.user_notification_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT : chaque user peut créer ses prefs
DROP POLICY IF EXISTS "auth_insert_own_notification_prefs" ON public.user_notification_preferences;
CREATE POLICY "auth_insert_own_notification_prefs"
ON public.user_notification_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE : chaque user peut modifier ses prefs
DROP POLICY IF EXISTS "auth_update_own_notification_prefs" ON public.user_notification_preferences;
CREATE POLICY "auth_update_own_notification_prefs"
ON public.user_notification_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Vérification
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_notification_preferences';
