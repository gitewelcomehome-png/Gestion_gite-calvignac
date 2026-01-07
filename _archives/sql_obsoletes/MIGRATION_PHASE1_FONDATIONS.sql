-- ============================================================================
-- SCRIPT MIGRATION MULTI-TENANT - PHASE 1: FONDATIONS
-- ============================================================================
-- Application: Gestion Gîtes Calvignac
-- Date: 7 janvier 2026
-- Objectif: Transformer architecture single-tenant vers multi-tenant
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: CRÉER TABLES CENTRALES
-- ============================================================================

-- Table tenants (organisations/propriétaires)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  siret text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tenants_active ON tenants(active);
COMMENT ON TABLE tenants IS 'Organisations/Propriétaires de gîtes';

-- Table properties (gîtes)
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL, -- 'trevoux', 'couzon'
  address text,
  description text,
  capacity integer,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_active ON properties(active);
COMMENT ON TABLE properties IS 'Gîtes appartenant aux tenants';

-- ============================================================================
-- ÉTAPE 2: CRÉER TENANT PAR DÉFAUT
-- ============================================================================

INSERT INTO tenants (id, name, email, active) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Gîtes Calvignac', 'contact@gitescalvignac.fr', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ÉTAPE 3: CRÉER PROPERTIES PAR DÉFAUT
-- ============================================================================

INSERT INTO properties (id, tenant_id, name, slug, active) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Gîte de Trévoux', 'trevoux', true),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Gîte de Couzon', 'couzon', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ÉTAPE 4: AJOUTER COLONNES MULTI-TENANT À reservations
-- ============================================================================

-- Ajouter tenant_id et property_id
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE CASCADE;

-- Ajouter colonnes audit
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Créer index
CREATE INDEX IF NOT EXISTS idx_reservations_tenant ON reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_property ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_deleted ON reservations(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- ÉTAPE 5: MIGRER DONNÉES EXISTANTES reservations
-- ============================================================================

UPDATE reservations SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
    ELSE NULL -- À corriger manuellement
  END
WHERE tenant_id IS NULL;

-- Vérifier données non migrées
SELECT COUNT(*), gite FROM reservations WHERE property_id IS NULL GROUP BY gite;

-- ============================================================================
-- ÉTAPE 6: RENDRE tenant_id et property_id NOT NULL
-- ============================================================================

-- ATTENTION: Exécuter seulement après validation de la migration
-- ALTER TABLE reservations ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE reservations ALTER COLUMN property_id SET NOT NULL;

-- ============================================================================
-- ÉTAPE 7: AJOUTER COLONNES À TOUTES LES AUTRES TABLES
-- ============================================================================

-- cleaning_schedule
ALTER TABLE cleaning_schedule 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_cleaning_schedule_tenant ON cleaning_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_schedule_property ON cleaning_schedule(property_id);

-- stocks_draps
ALTER TABLE stocks_draps 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_stocks_draps_tenant ON stocks_draps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stocks_draps_property ON stocks_draps(property_id);

-- charges
ALTER TABLE charges 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_charges_tenant ON charges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_charges_property ON charges(property_id);

-- historical_data
ALTER TABLE historical_data 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_historical_data_tenant ON historical_data(tenant_id);

-- todos
ALTER TABLE todos 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_todos_tenant ON todos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_todos_property ON todos(property_id);

-- client_access_tokens
ALTER TABLE client_access_tokens 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_client_access_tokens_tenant ON client_access_tokens(tenant_id);

-- fiche_generation_logs
ALTER TABLE fiche_generation_logs 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_fiche_generation_logs_tenant ON fiche_generation_logs(tenant_id);

-- demandes_horaires
ALTER TABLE demandes_horaires 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_demandes_horaires_tenant ON demandes_horaires(tenant_id);

-- retours_menage
ALTER TABLE retours_menage 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_retours_menage_tenant ON retours_menage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_retours_menage_property ON retours_menage(property_id);

-- retours_clients
ALTER TABLE retours_clients 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_retours_clients_tenant ON retours_clients(tenant_id);

-- infos_gites
ALTER TABLE infos_gites 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_infos_gites_tenant ON infos_gites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_infos_gites_property ON infos_gites(property_id);

-- checklist_templates
ALTER TABLE checklist_templates 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_checklist_templates_tenant ON checklist_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_property ON checklist_templates(property_id);

-- checklist_progress
ALTER TABLE checklist_progress 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_checklist_progress_tenant ON checklist_progress(tenant_id);

-- activites_gites
ALTER TABLE activites_gites 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_activites_gites_tenant ON activites_gites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activites_gites_property ON activites_gites(property_id);

-- activites_consultations
ALTER TABLE activites_consultations 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_activites_consultations_tenant ON activites_consultations(tenant_id);

-- faq
ALTER TABLE faq 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_faq_tenant ON faq(tenant_id);

-- simulations_fiscales
ALTER TABLE simulations_fiscales 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_simulations_fiscales_tenant ON simulations_fiscales(tenant_id);

-- suivi_soldes_bancaires
ALTER TABLE suivi_soldes_bancaires 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_suivi_soldes_bancaires_tenant ON suivi_soldes_bancaires(tenant_id);

-- problemes_signales
ALTER TABLE problemes_signales 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_problemes_signales_tenant ON problemes_signales(tenant_id);

-- evaluations_sejour
ALTER TABLE evaluations_sejour 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_evaluations_sejour_tenant ON evaluations_sejour(tenant_id);

-- user_roles
ALTER TABLE user_roles 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);

-- ============================================================================
-- ÉTAPE 8: MIGRER DONNÉES EXISTANTES (CASCADE)
-- ============================================================================

-- Propager tenant_id depuis reservations vers tables liées
UPDATE cleaning_schedule cs SET 
  tenant_id = r.tenant_id,
  property_id = r.property_id
FROM reservations r 
WHERE cs.reservation_id = r.id AND cs.tenant_id IS NULL;

UPDATE client_access_tokens cat SET 
  tenant_id = r.tenant_id
FROM reservations r 
WHERE cat.reservation_id = r.id AND cat.tenant_id IS NULL;

UPDATE fiche_generation_logs fgl SET 
  tenant_id = r.tenant_id
FROM reservations r 
WHERE fgl.reservation_id = r.id AND fgl.tenant_id IS NULL;

UPDATE checklist_progress cp SET 
  tenant_id = r.tenant_id
FROM reservations r 
WHERE cp.reservation_id = r.id AND cp.tenant_id IS NULL;

UPDATE demandes_horaires dh SET 
  tenant_id = r.tenant_id
FROM reservations r 
WHERE dh.reservation_id = r.id AND dh.tenant_id IS NULL;

UPDATE problemes_signales ps SET 
  tenant_id = r.tenant_id
FROM reservations r 
WHERE ps.reservation_id = r.id AND ps.tenant_id IS NULL;

UPDATE retours_clients rc SET 
  tenant_id = r.tenant_id
FROM reservations r 
WHERE rc.reservation_id = r.id AND rc.tenant_id IS NULL;

UPDATE evaluations_sejour es SET 
  tenant_id = r.tenant_id
FROM reservations r 
WHERE es.reservation_id = r.id AND es.tenant_id IS NULL;

UPDATE activites_consultations ac SET 
  tenant_id = r.tenant_id
FROM reservations r 
WHERE ac.reservation_id = r.id AND ac.tenant_id IS NULL;

-- Migrer tables avec colonne 'gite' text
UPDATE stocks_draps SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
  END
WHERE tenant_id IS NULL;

UPDATE infos_gites SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
  END
WHERE tenant_id IS NULL;

UPDATE activites_gites SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
  END
WHERE tenant_id IS NULL;

UPDATE retours_menage SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
  END
WHERE tenant_id IS NULL;

UPDATE checklist_templates SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
  END
WHERE tenant_id IS NULL;

-- Migrer tables indépendantes
UPDATE charges SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
    ELSE NULL -- Charges communes
  END
WHERE tenant_id IS NULL;

UPDATE historical_data SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
    WHEN LOWER(gite) = 'total' THEN NULL -- Données agrégées
  END
WHERE tenant_id IS NULL;

UPDATE todos SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid,
  property_id = CASE 
    WHEN LOWER(gite) LIKE '%trevoux%' THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN LOWER(gite) LIKE '%couzon%' THEN '00000000-0000-0000-0000-000000000003'::uuid
    ELSE NULL -- Tâches communes
  END
WHERE tenant_id IS NULL;

UPDATE faq SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;

UPDATE simulations_fiscales SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;

UPDATE suivi_soldes_bancaires SET 
  tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE tenant_id IS NULL;

-- ============================================================================
-- ÉTAPE 9: FONCTIONS HELPERS
-- ============================================================================

-- Fonction pour obtenir tenant_id depuis JWT
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::uuid;
END;
$$;

-- Fonction pour obtenir user_id depuis JWT
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

-- ============================================================================
-- ÉTAPE 10: TRIGGERS POUR AUDIT AUTO
-- ============================================================================

-- Fonction générique pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer trigger sur tables avec updated_at
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('tenants', 'properties')
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- ============================================================================
-- ÉTAPE 11: VÉRIFICATIONS POST-MIGRATION
-- ============================================================================

-- Vérifier que toutes les données ont un tenant_id
SELECT 'reservations' as table_name, COUNT(*) as rows_without_tenant 
FROM reservations WHERE tenant_id IS NULL
UNION ALL
SELECT 'cleaning_schedule', COUNT(*) FROM cleaning_schedule WHERE tenant_id IS NULL
UNION ALL
SELECT 'stocks_draps', COUNT(*) FROM stocks_draps WHERE tenant_id IS NULL
UNION ALL
SELECT 'charges', COUNT(*) FROM charges WHERE tenant_id IS NULL
UNION ALL
SELECT 'todos', COUNT(*) FROM todos WHERE tenant_id IS NULL;

-- ============================================================================
-- FIN PHASE 1
-- ============================================================================
-- PROCHAINE ÉTAPE: Activer RLS (voir script MIGRATION_PHASE2_RLS.sql)
-- ============================================================================
