-- ================================================================
-- DONNÉES INITIALES POUR ÉVITER LES ERREURS 406
-- ================================================================
-- Insère des données par défaut dans les tables fiscales
-- pour éviter les erreurs 406 (Not Acceptable) quand les tables sont vides
-- ================================================================

-- Récupérer l'organization_id de l'utilisateur connecté
-- REMPLACE <YOUR_ORG_ID> par ton organization_id réel

-- Pour trouver ton organization_id, exécute d'abord:
-- SELECT id, name FROM organizations;

-- Puis remplace <YOUR_ORG_ID> ci-dessous et exécute:

-- 1. Simulation fiscale par défaut pour 2026
INSERT INTO simulations_fiscales (organization_id, annee, revenus_totaux, charges_totales, resultat, impots_estimes)
VALUES ('<YOUR_ORG_ID>', 2026, 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- 2. Simulation fiscale par défaut pour 2025
INSERT INTO simulations_fiscales (organization_id, annee, revenus_totaux, charges_totales, resultat, impots_estimes)
VALUES ('<YOUR_ORG_ID>', 2025, 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- 3. Solde bancaire par défaut pour janvier 2026
INSERT INTO suivi_soldes_bancaires (organization_id, annee, mois, solde)
VALUES ('<YOUR_ORG_ID>', 2026, 1, 0)
ON CONFLICT (organization_id, annee, mois) DO NOTHING;

-- ================================================================
-- ALTERNATIVE: Script automatique
-- ================================================================
-- Si tu veux insérer automatiquement pour TOUTES les organisations:

/*
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM organizations LOOP
        -- Simulations 2026 et 2025
        INSERT INTO simulations_fiscales (organization_id, annee, revenus_totaux, charges_totales, resultat, impots_estimes)
        VALUES (org_record.id, 2026, 0, 0, 0, 0)
        ON CONFLICT DO NOTHING;
        
        INSERT INTO simulations_fiscales (organization_id, annee, revenus_totaux, charges_totales, resultat, impots_estimes)
        VALUES (org_record.id, 2025, 0, 0, 0, 0)
        ON CONFLICT DO NOTHING;
        
        -- Solde janvier 2026
        INSERT INTO suivi_soldes_bancaires (organization_id, annee, mois, solde)
        VALUES (org_record.id, 2026, 1, 0)
        ON CONFLICT (organization_id, annee, mois) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '✅ Données initiales créées pour % organisations', (SELECT COUNT(*) FROM organizations);
END $$;
*/
