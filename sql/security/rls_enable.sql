-- ================================================================
-- ACTIVATION ROW LEVEL SECURITY (RLS)
-- ================================================================
-- Date: 7 janvier 2026
-- Objectif: Activer RLS sur toutes les tables sensibles
-- Sécurité: Empêcher l'accès non autorisé aux données
-- ================================================================

-- Activer RLS sur toutes les tables critiques
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks_draps ENABLE ROW LEVEL SECURITY;
ALTER TABLE infos_gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites_gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_questions ENABLE ROW LEVEL SECURITY;

-- Note: Une fois RLS activé, AUCUNE requête ne passe sans policy explicite
-- Les policies doivent être créées avec rls_policies.sql
