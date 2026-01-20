-- ================================================================
-- DONNÉES INITIALES POUR ÉVITER LES 406
-- ================================================================
-- Insère des simulations fiscales à zéro pour toutes les organisations
-- ================================================================

DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM organizations LOOP
        -- Simulation 2026
        INSERT INTO simulations_fiscales (organization_id, annee, revenus_totaux, charges_totales, resultat, impots_estimes)
        VALUES (org_record.id, 2026, 0, 0, 0, 0)
        ON CONFLICT DO NOTHING;
        
        -- Simulation 2025
        INSERT INTO simulations_fiscales (organization_id, annee, revenus_totaux, charges_totales, resultat, impots_estimes)
        VALUES (org_record.id, 2025, 0, 0, 0, 0)
        ON CONFLICT DO NOTHING;
        
        -- Solde bancaire janvier 2026
        INSERT INTO suivi_soldes_bancaires (organization_id, annee, mois, solde)
        VALUES (org_record.id, 2026, 1, 0)
        ON CONFLICT (organization_id, annee, mois) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '✅ Données initiales créées pour % organisations', (SELECT COUNT(*) FROM organizations);
    RAISE NOTICE '📊 Simulations fiscales 2025 et 2026 à zéro';
    RAISE NOTICE '💰 Solde bancaire janvier 2026 à zéro';
END $$;
