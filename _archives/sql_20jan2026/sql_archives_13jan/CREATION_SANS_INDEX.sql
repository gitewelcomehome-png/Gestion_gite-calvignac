-- ================================================================
-- CRÉATION COMPLÈTE DE TOUTES LES TABLES - SANS INDEX
-- ================================================================
-- Date: 12 janvier 2026
-- Version sans index pour éviter les problèmes de visibilité
-- Les index seront créés dans un second script
-- ================================================================

-- ================================================================
-- OBTENIR L'UTILISATEUR PAR DÉFAUT
-- ================================================================

DO $$
DECLARE
    default_user_id UUID;
BEGIN
    SELECT id INTO default_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF default_user_id IS NULL THEN
        RAISE EXCEPTION '❌ ERREUR: Aucun utilisateur trouvé dans auth.users. Créez un compte d''abord !';
    END IF;
    
    CREATE TEMP TABLE IF NOT EXISTS temp_default_user (user_id UUID);
    DELETE FROM temp_default_user;
    INSERT INTO temp_default_user VALUES (default_user_id);
    
    RAISE NOTICE '✅ Utilisateur par défaut: %', default_user_id;
END $$;

-- ================================================================
-- TABLE 1: gites
-- ================================================================

CREATE TABLE IF NOT EXISTS gites (
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

DO $$ BEGIN RAISE NOTICE '✅ Table gites OK'; END $$;

-- ================================================================
-- TABLE 2: reservations
-- ================================================================

CREATE TABLE IF NOT EXISTS reservations (
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

DO $$ BEGIN RAISE NOTICE '✅ Table reservations OK'; END $$;

-- ================================================================
-- TABLE 3: cleaning_schedule (SANS INDEX)
-- ================================================================

CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS gite_name TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS time TIME;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT FALSE;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_by TEXT;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_id UUID;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS validated_by_company BOOLEAN DEFAULT FALSE;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_end DATE;
ALTER TABLE cleaning_schedule ADD COLUMN IF NOT EXISTS reservation_start_after DATE;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cleaning_schedule_type_check') THEN
        ALTER TABLE cleaning_schedule ADD CONSTRAINT cleaning_schedule_type_check CHECK (type IN ('checkin', 'checkout', 'inter', 'fin_de_semaine'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cleaning_schedule_reservation_id_fkey') THEN
        ALTER TABLE cleaning_schedule ADD CONSTRAINT cleaning_schedule_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cleaning_schedule_reservation_id_key') THEN
        ALTER TABLE cleaning_schedule ADD CONSTRAINT cleaning_schedule_reservation_id_key UNIQUE (reservation_id);
    END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table cleaning_schedule OK'; END $$;

-- ================================================================
-- TOUTES LES AUTRES TABLES (4-25)
-- ================================================================

CREATE TABLE IF NOT EXISTS charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    description TEXT,
    categorie TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demandes_horaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_name TEXT NOT NULL,
    date DATE NOT NULL,
    heure_preferee TIME,
    commentaire TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retours_menage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cleaning_id UUID REFERENCES cleaning_schedule(id) ON DELETE CASCADE,
    gite_name TEXT NOT NULL,
    date DATE NOT NULL,
    commentaire TEXT,
    photos JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stocks_draps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    type_linge TEXT NOT NULL,
    quantite_disponible INT DEFAULT 0,
    quantite_sale INT DEFAULT 0,
    quantite_total INT DEFAULT 0,
    derniere_maj TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS infos_pratiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    contenu TEXT NOT NULL,
    categorie TEXT,
    ordre INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    categorie TEXT,
    ordre INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    description TEXT,
    statut TEXT DEFAULT 'pending',
    priorite TEXT DEFAULT 'normale',
    echeance DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problemes_signales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    description TEXT NOT NULL,
    gravite TEXT DEFAULT 'moyenne',
    statut TEXT DEFAULT 'ouvert',
    date_signalement TIMESTAMPTZ DEFAULT NOW(),
    date_resolution TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulations_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    revenus DECIMAL(10, 2),
    charges DECIMAL(10, 2),
    resultat JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suivi_soldes_bancaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    solde DECIMAL(10, 2) NOT NULL,
    compte TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS infos_gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    wifi_name TEXT,
    wifi_password TEXT,
    code_porte TEXT,
    code_portail TEXT,
    parking_info TEXT,
    acces_description TEXT,
    consignes_speciales TEXT,
    equipements JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gite_id)
);

CREATE TABLE IF NOT EXISTS client_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fiche_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    type_fiche TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retours_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    note_globale INT CHECK (note_globale BETWEEN 1 AND 5),
    commentaire TEXT,
    points_positifs TEXT,
    points_amelioration TEXT,
    date_retour TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activites_gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    categorie TEXT,
    distance_km DECIMAL(5, 2),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    url TEXT,
    telephone TEXT,
    horaires TEXT,
    tarifs TEXT,
    photos JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activites_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activite_id UUID NOT NULL REFERENCES activites_gites(id) ON DELETE CASCADE,
    token TEXT,
    ip_address TEXT,
    consulted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('arrivee', 'depart', 'menage', 'maintenance')),
    items JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    items_completed JSONB DEFAULT '[]',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historical_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS linen_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    quantite INT NOT NULL DEFAULT 0,
    statut TEXT DEFAULT 'propre' CHECK (statut IN ('propre', 'sale', 'en_lavage')),
    derniere_modification TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluations_sejour (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    note_proprete INT CHECK (note_proprete BETWEEN 1 AND 5),
    note_equipement INT CHECK (note_equipement BETWEEN 1 AND 5),
    note_emplacement INT CHECK (note_emplacement BETWEEN 1 AND 5),
    note_communication INT CHECK (note_communication BETWEEN 1 AND 5),
    note_globale INT CHECK (note_globale BETWEEN 1 AND 5),
    commentaire TEXT,
    recommande BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN RAISE NOTICE '✅ Toutes les tables créées'; END $$;

-- ================================================================
-- MISE À JOUR DES DONNÉES EXISTANTES
-- ================================================================

DO $$
DECLARE
    default_user_id UUID;
    table_list TEXT[] := ARRAY[
        'gites', 'reservations', 'cleaning_schedule', 'charges',
        'demandes_horaires', 'retours_menage', 'stocks_draps',
        'infos_pratiques', 'faq', 'todos', 'problemes_signales',
        'simulations_fiscales', 'suivi_soldes_bancaires',
        'infos_gites', 'client_access_tokens', 'fiche_generation_logs',
        'retours_clients', 'activites_gites', 'checklist_templates',
        'checklist_progress', 'checklists', 'historical_data',
        'linen_stocks', 'evaluations_sejour'
    ];
    t_name TEXT;
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    SELECT user_id INTO default_user_id FROM temp_default_user;
    
    FOREACH t_name IN ARRAY table_list
    LOOP
        -- Vérifier si la table existe
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = t_name AND table_schema = 'public'
        ) INTO table_exists;
        
        -- Vérifier si la colonne owner_user_id existe
        IF table_exists THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = t_name AND column_name = 'owner_user_id' AND table_schema = 'public'
            ) INTO column_exists;
            
            -- Mettre à jour seulement si la table et la colonne existent
            IF column_exists THEN
                EXECUTE format('UPDATE %I SET owner_user_id = $1 WHERE owner_user_id IS NULL', t_name) USING default_user_id;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Données existantes mises à jour';
END $$;

-- ================================================================
-- TRIGGERS DE SYNCHRONISATION
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_restant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_price IS NOT NULL THEN NEW.montant := NEW.total_price;
    ELSIF NEW.montant IS NOT NULL THEN NEW.total_price := NEW.montant; END IF;
    
    IF NEW.paid_amount IS NOT NULL THEN NEW.acompte := NEW.paid_amount;
    ELSIF NEW.acompte IS NOT NULL THEN NEW.paid_amount := NEW.acompte; END IF;
    
    IF NEW.montant IS NOT NULL AND NEW.acompte IS NOT NULL THEN
        NEW.restant := NEW.montant - NEW.acompte;
    END IF;
    
    IF NEW.montant IS NOT NULL AND NEW.acompte IS NOT NULL THEN
        IF NEW.acompte >= NEW.montant THEN NEW.paiement := 'Payé';
        ELSIF NEW.acompte > 0 THEN NEW.paiement := 'Acompte versé';
        ELSE NEW.paiement := 'Non payé'; END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_restant ON reservations;
CREATE TRIGGER trigger_calculate_restant BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION calculate_restant();

CREATE OR REPLACE FUNCTION sync_reservation_aliases()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_phone IS NOT NULL THEN NEW.telephone := NEW.client_phone;
    ELSIF NEW.telephone IS NOT NULL THEN NEW.client_phone := NEW.telephone; END IF;
    
    IF NEW.client_address IS NOT NULL THEN NEW.provenance := NEW.client_address;
    ELSIF NEW.provenance IS NOT NULL THEN NEW.client_address := NEW.provenance; END IF;
    
    IF NEW.guest_count IS NOT NULL THEN NEW.nb_personnes := NEW.guest_count;
    ELSIF NEW.nb_personnes IS NOT NULL THEN NEW.guest_count := NEW.nb_personnes; END IF;
    
    IF NEW.platform IS NOT NULL THEN NEW.plateforme := NEW.platform;
    ELSIF NEW.plateforme IS NOT NULL THEN NEW.platform := NEW.plateforme; END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_aliases ON reservations;
CREATE TRIGGER trigger_sync_aliases BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION sync_reservation_aliases();

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
CREATE TRIGGER trigger_sync_gite_name BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION sync_gite_name();

DO $$ BEGIN RAISE NOTICE '✅ Triggers créés'; END $$;

-- ================================================================
-- ACTIVER RLS SUR TOUTES LES TABLES
-- ================================================================

DO $$
DECLARE
    table_list TEXT[] := ARRAY[
        'gites', 'reservations', 'cleaning_schedule', 'charges',
        'demandes_horaires', 'retours_menage', 'stocks_draps',
        'infos_pratiques', 'faq', 'todos', 'problemes_signales',
        'simulations_fiscales', 'suivi_soldes_bancaires',
        'infos_gites', 'client_access_tokens', 'fiche_generation_logs',
        'retours_clients', 'activites_gites', 'checklist_templates',
        'checklist_progress', 'checklists', 'historical_data',
        'linen_stocks', 'evaluations_sejour'
    ];
    t_name TEXT;
    is_table BOOLEAN;
BEGIN
    FOREACH t_name IN ARRAY table_list
    LOOP
        -- Vérifier si c'est une TABLE (pas une vue)
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = t_name AND table_schema = 'public' AND table_type = 'BASE TABLE'
        ) INTO is_table;
        
        IF is_table THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t_name);
            EXECUTE format('DROP POLICY IF EXISTS %s_policy ON %I', t_name, t_name);
            EXECUTE format('
                CREATE POLICY %s_policy ON %I
                FOR ALL USING (owner_user_id = auth.uid())
                WITH CHECK (owner_user_id = auth.uid())
            ', t_name, t_name);
        END IF;
    END LOOP;
    
    -- Policy spéciale pour activites_consultations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'activites_consultations' AND table_schema = 'public' AND table_type = 'BASE TABLE'
    ) INTO is_table;
    
    IF is_table THEN
        ALTER TABLE activites_consultations ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS activites_consultations_policy ON activites_consultations;
        CREATE POLICY activites_consultations_policy ON activites_consultations FOR ALL USING (true);
    END IF;
    
    RAISE NOTICE '✅ RLS activé sur toutes les tables';
END $$;

DROP TABLE IF EXISTS temp_default_user;

DO $$ BEGIN RAISE NOTICE '✅✅✅ TERMINÉ - Exécutez maintenant CREATION_INDEX.sql'; END $$;
