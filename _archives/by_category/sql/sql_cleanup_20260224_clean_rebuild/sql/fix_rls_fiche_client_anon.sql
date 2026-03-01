-- ============================================================
-- FIX RLS : Accès anonyme pour la page fiche-client (mobile)
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. client_access_tokens : lecture par token valide + mise à jour
DROP POLICY IF EXISTS "anon_access_via_valid_token" ON public.client_access_tokens;
CREATE POLICY "anon_access_via_valid_token"
ON public.client_access_tokens FOR SELECT TO anon
USING (expires_at > NOW());

DROP POLICY IF EXISTS "anon_update_access_count" ON public.client_access_tokens;
CREATE POLICY "anon_update_access_count"
ON public.client_access_tokens FOR UPDATE TO anon
USING (expires_at > NOW())
WITH CHECK (true);

-- 2. reservations : lecture libre (la sécurité est assurée par le token)
DROP POLICY IF EXISTS "anon_read_reservations" ON public.reservations;
CREATE POLICY "anon_read_reservations"
ON public.reservations FOR SELECT TO anon
USING (true);

-- 3. infos_gites : lecture libre
DROP POLICY IF EXISTS "anon_read_infos_gites" ON public.infos_gites;
CREATE POLICY "anon_read_infos_gites"
ON public.infos_gites FOR SELECT TO anon
USING (true);

-- 4. demandes_horaires : lecture + insertion + mise à jour par le client
DROP POLICY IF EXISTS "anon_read_demandes_horaires" ON public.demandes_horaires;
CREATE POLICY "anon_read_demandes_horaires"
ON public.demandes_horaires FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "anon_insert_demandes_horaires" ON public.demandes_horaires;
CREATE POLICY "anon_insert_demandes_horaires"
ON public.demandes_horaires FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_demandes_horaires" ON public.demandes_horaires;
CREATE POLICY "anon_update_demandes_horaires"
ON public.demandes_horaires FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

-- 5. cleaning_schedule : lecture libre
DROP POLICY IF EXISTS "anon_read_cleaning_schedule" ON public.cleaning_schedule;
CREATE POLICY "anon_read_cleaning_schedule"
ON public.cleaning_schedule FOR SELECT TO anon
USING (true);

-- 6. activites_gites : lecture libre
DROP POLICY IF EXISTS "anon_read_activites_gites" ON public.activites_gites;
CREATE POLICY "anon_read_activites_gites"
ON public.activites_gites FOR SELECT TO anon
USING (true);

-- 7. activites_consultations : insertion (log de consultation)
DROP POLICY IF EXISTS "anon_insert_activites_consultations" ON public.activites_consultations;
CREATE POLICY "anon_insert_activites_consultations"
ON public.activites_consultations FOR INSERT TO anon
WITH CHECK (true);

-- 8. retours_clients : insertion (avis client)
DROP POLICY IF EXISTS "anon_insert_retours_clients" ON public.retours_clients;
CREATE POLICY "anon_insert_retours_clients"
ON public.retours_clients FOR INSERT TO anon
WITH CHECK (true);

-- 9. faq : lecture libre
DROP POLICY IF EXISTS "anon_read_faq" ON public.faq;
CREATE POLICY "anon_read_faq"
ON public.faq FOR SELECT TO anon
USING (true);

-- 10. checklist_templates : lecture libre
DROP POLICY IF EXISTS "anon_read_checklist_templates" ON public.checklist_templates;
CREATE POLICY "anon_read_checklist_templates"
ON public.checklist_templates FOR SELECT TO anon
USING (true);

-- 11. checklist_progress : lecture + insertion + mise à jour par le client
DROP POLICY IF EXISTS "anon_read_checklist_progress" ON public.checklist_progress;
CREATE POLICY "anon_read_checklist_progress"
ON public.checklist_progress FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS "anon_insert_checklist_progress" ON public.checklist_progress;
CREATE POLICY "anon_insert_checklist_progress"
ON public.checklist_progress FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_checklist_progress" ON public.checklist_progress;
CREATE POLICY "anon_update_checklist_progress"
ON public.checklist_progress FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

-- 12. fiche_generation_logs : insertion (log)
DROP POLICY IF EXISTS "anon_insert_fiche_generation_logs" ON public.fiche_generation_logs;
CREATE POLICY "anon_insert_fiche_generation_logs"
ON public.fiche_generation_logs FOR INSERT TO anon
WITH CHECK (true);

-- 13. Colonne fiche_client_theme dans infos_gites (lu par la fiche client)
ALTER TABLE public.infos_gites 
ADD COLUMN IF NOT EXISTS fiche_client_theme TEXT DEFAULT 'cyan';

SELECT '✅ Toutes les policies anon créées avec succès' as status;
