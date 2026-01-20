-- ================================================================
-- CRÉATION DE TOUS LES INDEX
-- ================================================================
-- À exécuter APRÈS CREATION_SANS_INDEX.sql
-- Séparer la création des index évite les problèmes de visibilité
-- ================================================================

-- INDEX pour gites
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gites' AND table_type = 'BASE TABLE') THEN
        CREATE INDEX IF NOT EXISTS idx_gites_owner ON gites(owner_user_id);
        CREATE INDEX IF NOT EXISTS idx_gites_active ON gites(owner_user_id, is_active);
    END IF;
END $$;

-- INDEX pour reservations
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations' AND table_type = 'BASE TABLE') THEN
        CREATE INDEX IF NOT EXISTS idx_reservations_owner ON reservations(owner_user_id);
        CREATE INDEX IF NOT EXISTS idx_reservations_gite ON reservations(gite_id);
        CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
    END IF;
END $$;

-- INDEX pour cleaning_schedule
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cleaning_schedule' AND table_type = 'BASE TABLE') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'owner_user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_cleaning_owner ON cleaning_schedule(owner_user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'date') THEN
            CREATE INDEX IF NOT EXISTS idx_cleaning_date ON cleaning_schedule(date);
        END IF;
    END IF;
END $$;

-- INDEX pour charges et toutes les autres tables
DO $$ 
DECLARE
    tables_to_index TEXT[][] := ARRAY[
        ARRAY['charges', 'owner_user_id', 'idx_charges_owner'],
        ARRAY['charges', 'date', 'idx_charges_date'],
        ARRAY['demandes_horaires', 'owner_user_id', 'idx_demandes_owner'],
        ARRAY['retours_menage', 'owner_user_id', 'idx_retours_owner'],
        ARRAY['stocks_draps', 'owner_user_id', 'idx_stocks_owner'],
        ARRAY['infos_pratiques', 'owner_user_id', 'idx_infos_owner'],
        ARRAY['faq', 'owner_user_id', 'idx_faq_owner'],
        ARRAY['todos', 'owner_user_id', 'idx_todos_owner'],
        ARRAY['problemes_signales', 'owner_user_id', 'idx_problemes_owner'],
        ARRAY['simulations_fiscales', 'owner_user_id', 'idx_simulations_owner'],
        ARRAY['suivi_soldes_bancaires', 'owner_user_id', 'idx_soldes_owner'],
        ARRAY['infos_gites', 'owner_user_id', 'idx_infos_gites_owner'],
        ARRAY['client_access_tokens', 'owner_user_id', 'idx_tokens_owner'],
        ARRAY['client_access_tokens', 'token', 'idx_tokens_token'],
        ARRAY['fiche_generation_logs', 'owner_user_id', 'idx_fiche_logs_owner'],
        ARRAY['retours_clients', 'owner_user_id', 'idx_retours_clients_owner'],
        ARRAY['activites_gites', 'owner_user_id', 'idx_activites_owner'],
        ARRAY['activites_gites', 'gite_id', 'idx_activites_gite'],
        ARRAY['activites_consultations', 'activite_id', 'idx_consultations_activite'],
        ARRAY['checklist_templates', 'owner_user_id', 'idx_checklist_templates_owner'],
        ARRAY['checklist_progress', 'owner_user_id', 'idx_checklist_progress_owner'],
        ARRAY['checklist_progress', 'template_id', 'idx_checklist_progress_template'],
        ARRAY['checklists', 'owner_user_id', 'idx_checklists_owner'],
        ARRAY['historical_data', 'owner_user_id', 'idx_historical_owner'],
        ARRAY['linen_stocks', 'owner_user_id', 'idx_linen_owner'],
        ARRAY['linen_stocks', 'gite_id', 'idx_linen_gite'],
        ARRAY['evaluations_sejour', 'owner_user_id', 'idx_evaluations_owner'],
        ARRAY['evaluations_sejour', 'reservation_id', 'idx_evaluations_reservation']
    ];
    rec TEXT[];
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    FOREACH rec SLICE 1 IN ARRAY tables_to_index
    LOOP
        -- Vérifier table
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = rec[1] AND table_type = 'BASE TABLE'
        ) INTO table_exists;
        
        IF table_exists THEN
            -- Vérifier colonne
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = rec[1] AND column_name = rec[2]
            ) INTO column_exists;
            
            IF column_exists THEN
                EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(%I)', rec[3], rec[1], rec[2]);
            END IF;
        END IF;
    END LOOP;
END $$;

-- INDEX composite pour historical_data
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historical_data' AND table_type = 'BASE TABLE') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historical_data' AND column_name = 'table_name') 
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historical_data' AND column_name = 'record_id') THEN
            CREATE INDEX IF NOT EXISTS idx_historical_table ON historical_data(table_name, record_id);
        END IF;
    END IF;
END $$;

SELECT '✅ TOUS LES INDEX CRÉÉS' as status;
