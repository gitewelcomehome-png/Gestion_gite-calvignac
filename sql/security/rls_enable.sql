-- ================================================================
-- ACTIVATION ROW LEVEL SECURITY (RLS)
-- ================================================================
-- Date: 7 janvier 2026
-- Objectif: Activer RLS sur toutes les tables sensibles
-- Sécurité: Empêcher l'accès non autorisé aux données
-- ================================================================

-- Activer RLS sur toutes les tables critiques (seulement si elles existent)
DO $$ 
BEGIN
    -- Tables principales
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reservations') THEN
        ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cleaning_schedule') THEN
        ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'retours_menage') THEN
        ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stocks_draps') THEN
        ALTER TABLE stocks_draps ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'infos_gites') THEN
        ALTER TABLE infos_gites ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activites_gites') THEN
        ALTER TABLE activites_gites ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_access_tokens') THEN
        ALTER TABLE client_access_tokens ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'historical_data') THEN
        ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'simulations_fiscales') THEN
        ALTER TABLE simulations_fiscales ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'todos') THEN
        ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'commits_log') THEN
        ALTER TABLE commits_log ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faq') THEN
        ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Tables checklists (si elles existent)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checklist_templates') THEN
        ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'checklist_progress') THEN
        ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Note: Une fois RLS activé, AUCUNE requête ne passe sans policy explicite
-- Les policies doivent être créées avec rls_policies.sql
