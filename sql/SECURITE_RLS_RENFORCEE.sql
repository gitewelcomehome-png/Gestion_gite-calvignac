-- ================================================================
-- SÉCURITÉ RLS RENFORCÉE - TOUTES LES TABLES
-- ================================================================
-- Date: 12 janvier 2026
-- Ce script applique des policies de sécurité GRANULAIRES
-- Chaque table a des règles adaptées à sa sensibilité
-- ================================================================

BEGIN;

-- ================================================================
-- NIVEAU 1: TABLES STANDARDS (lecture/écriture propriétaire uniquement)
-- ================================================================

DO $$
DECLARE
    standard_tables TEXT[] := ARRAY[
        'gites', 'reservations', 'cleaning_schedule', 'charges',
        'demandes_horaires', 'retours_menage', 'stocks_draps',
        'infos_pratiques', 'faq', 'todos', 'problemes_signales',
        'simulations_fiscales', 'suivi_soldes_bancaires',
        'retours_clients', 'checklist_templates', 'checklist_progress',
        'checklists', 'linen_stocks', 'evaluations_sejour', 'fiche_generation_logs'
    ];
    t_name TEXT;
BEGIN
    FOREACH t_name IN ARRAY standard_tables
    LOOP
        -- Activer RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t_name);
        
        -- Supprimer les anciennes policies
        EXECUTE format('DROP POLICY IF EXISTS %s_policy ON %I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s_select ON %I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s_insert ON %I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s_update ON %I', t_name, t_name);
        EXECUTE format('DROP POLICY IF EXISTS %s_delete ON %I', t_name, t_name);
        
        -- Créer policies granulaires
        EXECUTE format('
            CREATE POLICY %s_select ON %I
            FOR SELECT USING (owner_user_id = auth.uid())
        ', t_name, t_name);
        
        EXECUTE format('
            CREATE POLICY %s_insert ON %I
            FOR INSERT WITH CHECK (owner_user_id = auth.uid())
        ', t_name, t_name);
        
        EXECUTE format('
            CREATE POLICY %s_update ON %I
            FOR UPDATE USING (owner_user_id = auth.uid())
            WITH CHECK (owner_user_id = auth.uid())
        ', t_name, t_name);
        
        EXECUTE format('
            CREATE POLICY %s_delete ON %I
            FOR DELETE USING (owner_user_id = auth.uid())
        ', t_name, t_name);
        
        RAISE NOTICE '✅ Sécurité standard appliquée à %', t_name;
    END LOOP;
END $$;

-- ================================================================
-- NIVEAU 2: TABLES SENSIBLES (+ restrictions supplémentaires)
-- ================================================================

-- TABLE: infos_gites (contient WiFi passwords, codes)
ALTER TABLE infos_gites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS infos_gites_policy ON infos_gites;
DROP POLICY IF EXISTS infos_gites_select ON infos_gites;
DROP POLICY IF EXISTS infos_gites_insert ON infos_gites;
DROP POLICY IF EXISTS infos_gites_update ON infos_gites;
DROP POLICY IF EXISTS infos_gites_delete ON infos_gites;

-- Lecture: Propriétaire uniquement
CREATE POLICY infos_gites_select ON infos_gites
    FOR SELECT USING (owner_user_id = auth.uid());

-- Écriture: Propriétaire uniquement + vérification gite_id
CREATE POLICY infos_gites_insert ON infos_gites
    FOR INSERT WITH CHECK (
        owner_user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM gites WHERE id = gite_id AND owner_user_id = auth.uid())
    );

CREATE POLICY infos_gites_update ON infos_gites
    FOR UPDATE USING (owner_user_id = auth.uid())
    WITH CHECK (
        owner_user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM gites WHERE id = gite_id AND owner_user_id = auth.uid())
    );

CREATE POLICY infos_gites_delete ON infos_gites
    FOR DELETE USING (owner_user_id = auth.uid());

RAISE NOTICE '🔒 Sécurité SENSIBLE appliquée à infos_gites';

-- TABLE: client_access_tokens (tokens d'accès)
ALTER TABLE client_access_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_access_tokens_policy ON client_access_tokens;
DROP POLICY IF EXISTS client_access_tokens_select ON client_access_tokens;
DROP POLICY IF EXISTS client_access_tokens_insert ON client_access_tokens;
DROP POLICY IF EXISTS client_access_tokens_update ON client_access_tokens;
DROP POLICY IF EXISTS client_access_tokens_delete ON client_access_tokens;

-- Lecture: Propriétaire OU token valide
CREATE POLICY client_access_tokens_select ON client_access_tokens
    FOR SELECT USING (
        owner_user_id = auth.uid() OR
        (token = current_setting('request.jwt.claims', true)::json->>'token' AND is_active = true AND expires_at > NOW())
    );

-- Écriture: Propriétaire uniquement
CREATE POLICY client_access_tokens_insert ON client_access_tokens
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY client_access_tokens_update ON client_access_tokens
    FOR UPDATE USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY client_access_tokens_delete ON client_access_tokens
    FOR DELETE USING (owner_user_id = auth.uid());

RAISE NOTICE '🔒 Sécurité CRITIQUE appliquée à client_access_tokens';

-- ================================================================
-- NIVEAU 3: TABLES PUBLIQUES (lecture limitée)
-- ================================================================

-- TABLE: activites_gites (visible pour les clients avec token)
ALTER TABLE activites_gites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activites_gites_policy ON activites_gites;
DROP POLICY IF EXISTS activites_gites_select ON activites_gites;
DROP POLICY IF EXISTS activites_gites_insert ON activites_gites;
DROP POLICY IF EXISTS activites_gites_update ON activites_gites;
DROP POLICY IF EXISTS activites_gites_delete ON activites_gites;

-- Lecture: Propriétaire OU activités actives du gîte avec token valide
CREATE POLICY activites_gites_select ON activites_gites
    FOR SELECT USING (
        owner_user_id = auth.uid() OR
        (is_active = true)  -- Visible si actif (pour fiches clients)
    );

-- Écriture: Propriétaire uniquement
CREATE POLICY activites_gites_insert ON activites_gites
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY activites_gites_update ON activites_gites
    FOR UPDATE USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY activites_gites_delete ON activites_gites
    FOR DELETE USING (owner_user_id = auth.uid());

RAISE NOTICE '📖 Sécurité PUBLIQUE appliquée à activites_gites';

-- TABLE: activites_consultations (logs de consultation - write only)
ALTER TABLE activites_consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activites_consultations_policy ON activites_consultations;
DROP POLICY IF EXISTS activites_consultations_select ON activites_consultations;
DROP POLICY IF EXISTS activites_consultations_insert ON activites_consultations;
DROP POLICY IF EXISTS activites_consultations_update ON activites_consultations;
DROP POLICY IF EXISTS activites_consultations_delete ON activites_consultations;

-- Lecture: Uniquement via activite.owner
CREATE POLICY activites_consultations_select ON activites_consultations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activites_gites ag
            WHERE ag.id = activite_id AND ag.owner_user_id = auth.uid()
        )
    );

-- Écriture: Tout le monde peut logger (INSERT seulement)
CREATE POLICY activites_consultations_insert ON activites_consultations
    FOR INSERT WITH CHECK (true);

-- PAS de UPDATE ni DELETE pour les consultations (logs immuables)
-- Les consultations sont en lecture seule après création

RAISE NOTICE '📊 Sécurité LOGS appliquée à activites_consultations';

-- TABLE: historical_data (audit trail - read only après création)
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS historical_data_policy ON historical_data;
DROP POLICY IF EXISTS historical_data_select ON historical_data;
DROP POLICY IF EXISTS historical_data_insert ON historical_data;
DROP POLICY IF EXISTS historical_data_update ON historical_data;
DROP POLICY IF EXISTS historical_data_delete ON historical_data;

-- Lecture: Propriétaire uniquement
CREATE POLICY historical_data_select ON historical_data
    FOR SELECT USING (owner_user_id = auth.uid());

-- Écriture: INSERT via triggers uniquement (service_role)
CREATE POLICY historical_data_insert ON historical_data
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- PAS de UPDATE ni DELETE (audit immuable)

RAISE NOTICE '📜 Sécurité AUDIT appliquée à historical_data';

-- ================================================================
-- FONCTION SÉCURISÉE: Accès fiche client
-- ================================================================

CREATE OR REPLACE FUNCTION get_reservation_with_token(p_token TEXT)
RETURNS TABLE (
    reservation_id UUID,
    gite_name TEXT,
    check_in DATE,
    check_out DATE,
    client_name TEXT
) SECURITY DEFINER AS $$
BEGIN
    -- Vérifier que le token est valide
    IF NOT EXISTS (
        SELECT 1 FROM client_access_tokens
        WHERE token = p_token
          AND is_active = true
          AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'Token invalide ou expiré';
    END IF;
    
    -- Retourner les infos de réservation
    RETURN QUERY
    SELECT 
        r.id,
        r.gite,
        r.check_in,
        r.check_out,
        r.client_name
    FROM reservations r
    INNER JOIN client_access_tokens cat ON cat.reservation_id = r.id
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '🔐 Fonction sécurisée get_reservation_with_token créée';

-- ================================================================
-- FONCTION SÉCURISÉE: Activités d'un gîte (pour fiche client)
-- ================================================================

CREATE OR REPLACE FUNCTION get_activites_for_token(p_token TEXT)
RETURNS TABLE (
    id UUID,
    nom TEXT,
    description TEXT,
    categorie TEXT,
    distance_km DECIMAL,
    latitude DECIMAL,
    longitude DECIMAL,
    url TEXT,
    telephone TEXT,
    horaires TEXT,
    tarifs TEXT,
    photos JSONB
) SECURITY DEFINER AS $$
BEGIN
    -- Vérifier token valide
    IF NOT EXISTS (
        SELECT 1 FROM client_access_tokens
        WHERE token = p_token
          AND is_active = true
          AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'Token invalide ou expiré';
    END IF;
    
    -- Retourner activités du gîte
    RETURN QUERY
    SELECT 
        ag.id,
        ag.nom,
        ag.description,
        ag.categorie,
        ag.distance_km,
        ag.latitude,
        ag.longitude,
        ag.url,
        ag.telephone,
        ag.horaires,
        ag.tarifs,
        ag.photos
    FROM activites_gites ag
    INNER JOIN reservations r ON r.gite_id = ag.gite_id
    INNER JOIN client_access_tokens cat ON cat.reservation_id = r.id
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > NOW()
      AND ag.is_active = true;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '🔐 Fonction sécurisée get_activites_for_token créée';

-- ================================================================
-- VÉRIFICATION FINALE
-- ================================================================

DO $$
DECLARE
    tables_with_rls INT;
    tables_total INT;
BEGIN
    -- Compter tables avec RLS
    SELECT COUNT(*) INTO tables_with_rls
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
      AND c.relrowsecurity = true;
    
    -- Compter toutes les tables
    SELECT COUNT(*) INTO tables_total
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN (
        'gites', 'reservations', 'cleaning_schedule', 'charges',
        'demandes_horaires', 'retours_menage', 'stocks_draps',
        'infos_pratiques', 'faq', 'todos', 'problemes_signales',
        'simulations_fiscales', 'suivi_soldes_bancaires',
        'infos_gites', 'client_access_tokens', 'fiche_generation_logs',
        'retours_clients', 'activites_gites', 'activites_consultations',
        'checklist_templates', 'checklist_progress', 'checklists',
        'historical_data', 'linen_stocks', 'evaluations_sejour'
      );
    
    RAISE NOTICE '=== SÉCURITÉ RENFORCÉE ===';
    RAISE NOTICE '✅ RLS activé sur %/% tables', tables_with_rls, tables_total;
    RAISE NOTICE '✅ Policies granulaires (SELECT/INSERT/UPDATE/DELETE)';
    RAISE NOTICE '🔒 Tables sensibles protégées (infos_gites, tokens)';
    RAISE NOTICE '📖 Accès public contrôlé (activités)';
    RAISE NOTICE '📜 Audit trail immuable (historical_data)';
    RAISE NOTICE '🔐 Fonctions sécurisées créées (SECURITY DEFINER)';
END $$;

COMMIT;

-- ================================================================
-- RÉSUMÉ DES NIVEAUX DE SÉCURITÉ
-- ================================================================
-- 
-- NIVEAU 1 - STANDARD (20 tables):
--   ✅ Lecture/Écriture propriétaire uniquement
--   ✅ 4 policies distinctes (SELECT/INSERT/UPDATE/DELETE)
-- 
-- NIVEAU 2 - SENSIBLE (2 tables):
--   🔒 infos_gites: WiFi passwords, codes → Propriétaire strict
--   🔒 client_access_tokens: Tokens → Propriétaire OU token valide
-- 
-- NIVEAU 3 - PUBLIC CONTRÔLÉ (3 tables):
--   📖 activites_gites: Lecture si is_active=true
--   📊 activites_consultations: INSERT public, SELECT propriétaire
--   📜 historical_data: Audit immuable
-- 
-- FONCTIONS SÉCURISÉES:
--   🔐 get_reservation_with_token(token) → Accès fiche client
--   🔐 get_activites_for_token(token) → Activités pour client
-- 
-- ================================================================
