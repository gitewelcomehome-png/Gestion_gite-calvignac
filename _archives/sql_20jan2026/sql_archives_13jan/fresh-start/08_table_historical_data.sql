-- ================================================================
-- TABLE HISTORICAL_DATA (Données historiques éditables)
-- ================================================================
-- Table pour saisir manuellement les stats des années passées
-- Reliée à organizations (relation forte)
-- ================================================================

CREATE TABLE IF NOT EXISTS historical_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year INT NOT NULL,
    total_revenue NUMERIC(10,2) DEFAULT 0,
    total_reservations INT DEFAULT 0,
    average_rate NUMERIC(10,2) DEFAULT 0,
    occupancy_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, year)
);

CREATE INDEX idx_historical_org ON historical_data(organization_id);
CREATE INDEX idx_historical_year ON historical_data(year);

ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_all_historical" ON historical_data FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- ================================================================
-- DONNÉES INITIALES (années passées à remplir manuellement)
-- ================================================================

DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM organizations LOOP
        -- Créer des lignes vides pour 2023, 2024, 2025
        -- L'utilisateur pourra les remplir dans Statistiques
        INSERT INTO historical_data (organization_id, year, total_revenue, total_reservations, average_rate, occupancy_rate)
        VALUES 
            (org_record.id, 2023, 0, 0, 0, 0),
            (org_record.id, 2024, 0, 0, 0, 0),
            (org_record.id, 2025, 0, 0, 0, 0)
        ON CONFLICT (organization_id, year) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '✅ Table historical_data créée';
    RAISE NOTICE '📊 Années 2023-2025 prêtes à être remplies';
    RAISE NOTICE '🔗 Reliée à organizations (FK avec CASCADE)';
END $$;
