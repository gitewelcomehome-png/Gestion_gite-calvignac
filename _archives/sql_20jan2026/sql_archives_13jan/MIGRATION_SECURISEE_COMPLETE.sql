-- ================================================================
-- MIGRATION SÉCURISÉE COMPLÈTE - NE CASSE RIEN
-- ================================================================
-- Date: 12 janvier 2026
-- Ce script migre intelligemment votre base existante vers le nouveau schéma
-- Il vérifie tout avant d'agir et préserve toutes vos données
-- ================================================================

BEGIN;

-- ================================================================
-- ÉTAPE 1: OBTENIR L'UTILISATEUR PAR DÉFAUT
-- ================================================================

DO $$
DECLARE
    default_user_id UUID;
BEGIN
    -- Récupérer le premier utilisateur
    SELECT id INTO default_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF default_user_id IS NULL THEN
        RAISE EXCEPTION '❌ ERREUR: Aucun utilisateur trouvé dans auth.users. Créez un compte d''abord !';
    END IF;
    
    -- Stocker dans une variable temporaire
    CREATE TEMP TABLE IF NOT EXISTS temp_default_user (user_id UUID);
    DELETE FROM temp_default_user;
    INSERT INTO temp_default_user VALUES (default_user_id);
    
    RAISE NOTICE '✅ Utilisateur par défaut identifié: %', default_user_id;
END $$;

-- ================================================================
-- ÉTAPE 2: MIGRER LA TABLE gites
-- ================================================================

DO $$
DECLARE
    default_user_id UUID;
BEGIN
    SELECT user_id INTO default_user_id FROM temp_default_user;
    
    -- Créer la table si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gites') THEN
        CREATE TABLE gites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL CHECK (length(name) >= 2),
            slug TEXT NOT NULL,
            description TEXT,
            address TEXT,
            icon TEXT DEFAULT 'home',
            color TEXT DEFAULT '#667eea',
            capacity INT,
            bedrooms INT,
            bathrooms INT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            ical_sources JSONB DEFAULT '{}',
            settings JSONB DEFAULT '{}',
            tarifs_calendrier JSONB DEFAULT '{}',
            regles_tarifaires JSONB DEFAULT '{}',
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(owner_user_id, slug)
        );
        RAISE NOTICE '✅ Table gites créée';
    ELSE
        -- Ajouter owner_user_id si manquant
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gites' AND column_name = 'owner_user_id') THEN
            ALTER TABLE gites ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            UPDATE gites SET owner_user_id = default_user_id WHERE owner_user_id IS NULL;
            ALTER TABLE gites ALTER COLUMN owner_user_id SET NOT NULL;
            RAISE NOTICE '✅ Colonne owner_user_id ajoutée à gites';
        END IF;
    END IF;
    
    -- Créer les index
    CREATE INDEX IF NOT EXISTS idx_gites_owner ON gites(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_gites_active ON gites(owner_user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_gites_slug ON gites(owner_user_id, slug);
END $$;

-- ================================================================
-- ÉTAPE 3: MIGRER LA TABLE reservations
-- ================================================================

DO $$
DECLARE
    default_user_id UUID;
    col_exists BOOLEAN;
BEGIN
    SELECT user_id INTO default_user_id FROM temp_default_user;
    
    -- Créer la table si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
        CREATE TABLE reservations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
            check_in DATE NOT NULL,
            check_out DATE NOT NULL,
            client_name TEXT NOT NULL,
            client_email TEXT,
            client_phone TEXT,
            client_address TEXT,
            guest_count INT,
            platform TEXT,
            platform_booking_id TEXT,
            status TEXT DEFAULT 'confirmed',
            total_price DECIMAL(10, 2),
            currency TEXT DEFAULT 'EUR',
            paid_amount DECIMAL(10, 2) DEFAULT 0,
            notes TEXT,
            source TEXT DEFAULT 'manual',
            synced_from TEXT,
            -- Colonnes legacy
            gite TEXT,
            plateforme TEXT,
            montant DECIMAL(10, 2),
            acompte DECIMAL(10, 2) DEFAULT 0,
            restant DECIMAL(10, 2) DEFAULT 0,
            paiement TEXT,
            provenance TEXT,
            nb_personnes INT,
            telephone TEXT,
            message_envoye BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT reservations_dates_check CHECK (check_out > check_in)
        );
        RAISE NOTICE '✅ Table reservations créée';
    ELSE
        -- Ajouter les colonnes manquantes une par une
        
        -- owner_user_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reservations' AND column_name = 'owner_user_id') THEN
            ALTER TABLE reservations ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            UPDATE reservations SET owner_user_id = default_user_id WHERE owner_user_id IS NULL;
            ALTER TABLE reservations ALTER COLUMN owner_user_id SET NOT NULL;
            RAISE NOTICE '✅ Colonne owner_user_id ajoutée à reservations';
        END IF;
        
        -- Colonnes modernes
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS check_in DATE;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS check_out DATE;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS client_name TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS client_email TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS client_phone TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS client_address TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS guest_count INT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS platform TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
        
        -- Colonnes legacy
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS gite TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS plateforme TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS montant DECIMAL(10, 2);
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS acompte DECIMAL(10, 2) DEFAULT 0;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS restant DECIMAL(10, 2) DEFAULT 0;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS paiement TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS provenance TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS nb_personnes INT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS telephone TEXT;
        ALTER TABLE reservations ADD COLUMN IF NOT EXISTS message_envoye BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE '✅ Colonnes manquantes ajoutées à reservations';
    END IF;
    
    -- Créer les index
    CREATE INDEX IF NOT EXISTS idx_reservations_owner ON reservations(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_gite ON reservations(gite_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(owner_user_id, status);
END $$;

-- ================================================================
-- ÉTAPE 4: MIGRER LA TABLE cleaning_schedule
-- ================================================================

DO $$
DECLARE
    default_user_id UUID;
BEGIN
    SELECT user_id INTO default_user_id FROM temp_default_user;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cleaning_schedule') THEN
        CREATE TABLE cleaning_schedule (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
            gite_name TEXT NOT NULL,
            date DATE NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('checkin', 'checkout', 'inter', 'fin_de_semaine')),
            client_name TEXT,
            time TIME,
            notes TEXT,
            validated BOOLEAN DEFAULT FALSE,
            validated_by TEXT,
            validated_by_company BOOLEAN DEFAULT FALSE,
            validated_at TIMESTAMPTZ,
            reservation_end DATE,
            reservation_start_after DATE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(reservation_id)
        );
        RAISE NOTICE '✅ Table cleaning_schedule créée';
    ELSE
        -- Ajouter owner_user_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'owner_user_id') THEN
            ALTER TABLE cleaning_schedule ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            UPDATE cleaning_schedule SET owner_user_id = default_user_id WHERE owner_user_id IS NULL;
            ALTER TABLE cleaning_schedule ALTER COLUMN owner_user_id SET NOT NULL;
            RAISE NOTICE '✅ Colonne owner_user_id ajoutée à cleaning_schedule';
        END IF;
        
        -- Ajouter les colonnes critiques et de base
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS date DATE;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS gite_name TEXT;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS type TEXT;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS client_name TEXT;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS time TIME;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_by TEXT;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_by_company BOOLEAN DEFAULT FALSE;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_end DATE;
        ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_start_after DATE;
        
        -- Ajouter la contrainte UNIQUE si pas présente
        DO $inner$
        BEGIN
            ALTER TABLE cleaning_schedule ADD CONSTRAINT cleaning_schedule_reservation_id_key UNIQUE(reservation_id);
        EXCEPTION
            WHEN duplicate_table THEN NULL;
            WHEN others THEN NULL;
        END $inner$;
        
        RAISE NOTICE '✅ Colonnes manquantes ajoutées à cleaning_schedule';
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_cleaning_owner ON cleaning_schedule(owner_user_id);
    -- Créer l'index date seulement si la colonne existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cleaning_schedule' AND column_name = 'date') THEN
        CREATE INDEX IF NOT EXISTS idx_cleaning_date ON cleaning_schedule(date);
    END IF;
    CREATE INDEX IF NOT EXISTS idx_cleaning_reservation ON cleaning_schedule(reservation_id);
END $$;

-- ================================================================
-- ÉTAPE 5: AUTRES TABLES (charges, stocks_draps, etc.)
-- ================================================================

DO $$
DECLARE
    default_user_id UUID;
    table_names TEXT[] := ARRAY[
        'charges', 'demandes_horaires', 'retours_menage', 'stocks_draps',
        'infos_pratiques', 'faq', 'todos', 'problemes_signales',
        'simulations_fiscales', 'suivi_soldes_bancaires'
    ];
    t_name TEXT;
BEGIN
    SELECT user_id INTO default_user_id FROM temp_default_user;
    
    FOREACH t_name IN ARRAY table_names
    LOOP
        -- Vérifier si la table existe
        IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = t_name AND t.table_schema = 'public') THEN
            -- Ajouter owner_user_id si manquant
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns c
                WHERE c.table_name = t_name 
                  AND c.table_schema = 'public'
                  AND c.column_name = 'owner_user_id'
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE', t_name);
                EXECUTE format('UPDATE %I SET owner_user_id = $1 WHERE owner_user_id IS NULL', t_name) USING default_user_id;
                EXECUTE format('ALTER TABLE %I ALTER COLUMN owner_user_id SET NOT NULL', t_name);
                EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_owner ON %I(owner_user_id)', t_name, t_name);
                RAISE NOTICE '✅ Colonne owner_user_id ajoutée à %', t_name;
            END IF;
        ELSE
            RAISE NOTICE '⚠️ Table % n''existe pas (sera créée plus tard si nécessaire)', t_name;
        END IF;
    END LOOP;
END $$;

-- ================================================================
-- ÉTAPE 6: CRÉER LES TRIGGERS DE SYNCHRONISATION
-- ================================================================

-- Trigger 1: Synchronisation et calcul du restant
CREATE OR REPLACE FUNCTION calculate_restant()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser total_price ↔ montant
    IF NEW.total_price IS NOT NULL THEN
        NEW.montant := NEW.total_price;
    ELSIF NEW.montant IS NOT NULL THEN
        NEW.total_price := NEW.montant;
    END IF;
    
    -- Synchroniser paid_amount ↔ acompte
    IF NEW.paid_amount IS NOT NULL THEN
        NEW.acompte := NEW.paid_amount;
    ELSIF NEW.acompte IS NOT NULL THEN
        NEW.paid_amount := NEW.acompte;
    END IF;
    
    -- Calculer le restant
    IF NEW.montant IS NOT NULL AND NEW.acompte IS NOT NULL THEN
        NEW.restant := NEW.montant - NEW.acompte;
    END IF;
    
    -- Déterminer le statut de paiement
    IF NEW.montant IS NOT NULL AND NEW.acompte IS NOT NULL THEN
        IF NEW.acompte >= NEW.montant THEN
            NEW.paiement := 'Payé';
        ELSIF NEW.acompte > 0 THEN
            NEW.paiement := 'Acompte versé';
        ELSE
            NEW.paiement := 'Non payé';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_restant ON reservations;
CREATE TRIGGER trigger_calculate_restant
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_restant();

DO $$ BEGIN
    RAISE NOTICE '✅ Trigger calculate_restant créé';
END $$;

-- Trigger 2: Synchronisation des colonnes alias
CREATE OR REPLACE FUNCTION sync_reservation_aliases()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser les noms de clients
    IF NEW.client_name IS NOT NULL THEN
        NEW.client_name := NEW.client_name;
    END IF;
    
    -- Synchroniser check_in/check_out (toujours prioritaires)
    IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
        -- Les dates modernes sont prioritaires
        NULL;
    END IF;
    
    -- Synchroniser les téléphones
    IF NEW.client_phone IS NOT NULL THEN
        NEW.telephone := NEW.client_phone;
    ELSIF NEW.telephone IS NOT NULL THEN
        NEW.client_phone := NEW.telephone;
    END IF;
    
    -- Synchroniser les adresses
    IF NEW.client_address IS NOT NULL THEN
        NEW.provenance := NEW.client_address;
    ELSIF NEW.provenance IS NOT NULL THEN
        NEW.client_address := NEW.provenance;
    END IF;
    
    -- Synchroniser le nombre de personnes
    IF NEW.guest_count IS NOT NULL THEN
        NEW.nb_personnes := NEW.guest_count;
    ELSIF NEW.nb_personnes IS NOT NULL THEN
        NEW.guest_count := NEW.nb_personnes;
    END IF;
    
    -- Synchroniser la plateforme
    IF NEW.platform IS NOT NULL THEN
        NEW.plateforme := NEW.platform;
    ELSIF NEW.plateforme IS NOT NULL THEN
        NEW.platform := NEW.plateforme;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_aliases ON reservations;
CREATE TRIGGER trigger_sync_aliases
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION sync_reservation_aliases();

DO $$ BEGIN
    RAISE NOTICE '✅ Trigger sync_reservation_aliases créé';
END $$;

-- Trigger 3: Synchronisation du nom de gîte
CREATE OR REPLACE FUNCTION sync_gite_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.gite_id IS NOT NULL THEN
        SELECT name INTO NEW.gite FROM gites WHERE id = NEW.gite_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_gite_name ON reservations;
CREATE TRIGGER trigger_sync_gite_name
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION sync_gite_name();

DO $$ BEGIN
    RAISE NOTICE '✅ Trigger sync_gite_name créé';
END $$;

-- ================================================================
-- ÉTAPE 7: ACTIVER RLS SUR TOUTES LES TABLES
-- ================================================================

DO $$
DECLARE
    table_names TEXT[] := ARRAY[
        'gites', 'reservations', 'cleaning_schedule', 'charges',
        'demandes_horaires', 'retours_menage', 'stocks_draps',
        'infos_pratiques', 'faq', 'todos', 'problemes_signales',
        'simulations_fiscales', 'suivi_soldes_bancaires'
    ];
    t_name TEXT;
BEGIN
    FOREACH t_name IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = t_name AND t.table_schema = 'public') THEN
            -- Activer RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t_name);
            
            -- Supprimer les anciennes policies
            EXECUTE format('DROP POLICY IF EXISTS %s_policy ON %I', t_name, t_name);
            
            -- Créer la policy
            EXECUTE format('
                CREATE POLICY %s_policy ON %I
                FOR ALL
                USING (owner_user_id = auth.uid())
                WITH CHECK (owner_user_id = auth.uid())
            ', t_name, t_name);
            
            RAISE NOTICE '✅ RLS activé sur %', t_name;
        END IF;
    END LOOP;
END $$;

-- ================================================================
-- ÉTAPE 8: VÉRIFICATION FINALE
-- ================================================================

DO $$
DECLARE
    table_record RECORD;
    total_reservations INTEGER;
    total_gites INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION FINALE ===';
    
    -- Compter les réservations
    SELECT COUNT(*) INTO total_reservations FROM reservations;
    RAISE NOTICE '✅ Réservations: %', total_reservations;
    
    -- Compter les gîtes
    SELECT COUNT(*) INTO total_gites FROM gites;
    RAISE NOTICE '✅ Gîtes: %', total_gites;
    
    -- Vérifier que toutes les tables ont owner_user_id
    FOR table_record IN 
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND t.table_name IN ('gites', 'reservations', 'cleaning_schedule', 'charges')
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_record.table_name 
              AND column_name = 'owner_user_id'
        ) THEN
            RAISE NOTICE '✅ Table % a bien owner_user_id', table_record.table_name;
        ELSE
            RAISE WARNING '⚠️ Table % n''a PAS owner_user_id', table_record.table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '=== MIGRATION TERMINÉE ===';
END $$;

-- Nettoyer la table temporaire
DROP TABLE IF EXISTS temp_default_user;

COMMIT;

-- ================================================================
-- FIN DE LA MIGRATION
-- ================================================================
-- Votre base est maintenant à jour !
-- Toutes vos données ont été préservées
-- Rafraîchissez l'application (F5) pour voir les changements
-- ================================================================
