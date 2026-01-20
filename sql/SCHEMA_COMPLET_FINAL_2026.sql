-- ================================================================
-- SCHÉMA COMPLET FINAL - TOUTES LES TABLES
-- ================================================================
-- Date: 12 janvier 2026
-- Basé sur l'analyse complète du code JavaScript existant
-- Compatible avec TOUTES les fonctions de l'application
-- ================================================================

-- ================================================================
-- NETTOYAGE (optionnel - commenter si première installation)
-- ================================================================

-- Décommenter pour réinitialiser complètement
-- DROP TABLE IF EXISTS cleaning_schedule CASCADE;
-- DROP TABLE IF EXISTS demandes_horaires CASCADE;
-- DROP TABLE IF EXISTS retours_menage CASCADE;
-- DROP TABLE IF EXISTS stocks_draps CASCADE;
-- DROP TABLE IF EXISTS reservations CASCADE;
-- DROP TABLE IF EXISTS charges CASCADE;
-- DROP TABLE IF EXISTS infos_pratiques CASCADE;
-- DROP TABLE IF EXISTS faq CASCADE;
-- DROP TABLE IF EXISTS todos CASCADE;
-- DROP TABLE IF EXISTS problemes_signales CASCADE;
-- DROP TABLE IF EXISTS simulations_fiscales CASCADE;
-- DROP TABLE IF EXISTS suivi_soldes_bancaires CASCADE;
-- DROP TABLE IF EXISTS gites CASCADE;

-- ================================================================
-- TABLE 1: gites (Propriétés)
-- ================================================================

CREATE TABLE IF NOT EXISTS gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 2),
    slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    description TEXT,
    address TEXT,
    icon TEXT DEFAULT 'home' CHECK (icon IN ('home', 'house', 'building', 'castle', 'cabin', 'apartment', 'villa', 'chalet')),
    color TEXT DEFAULT '#667eea' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    capacity INT CHECK (capacity > 0),
    bedrooms INT CHECK (bedrooms >= 0),
    bathrooms INT CHECK (bathrooms >= 0),
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

CREATE INDEX IF NOT EXISTS idx_gites_owner ON gites(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_gites_active ON gites(owner_user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gites_slug ON gites(owner_user_id, slug);

-- ================================================================
-- TABLE 2: reservations (SCHÉMA COMPLET AVEC TOUTES LES COLONNES)
-- ================================================================

CREATE TABLE IF NOT EXISTS reservations (
    -- Colonnes principales
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Dates (noms SQL snake_case)
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    
    -- Informations client (noms SQL snake_case)
    client_name TEXT NOT NULL CHECK (length(client_name) >= 2),
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    
    -- Détails réservation
    guest_count INT CHECK (guest_count > 0),
    platform TEXT CHECK (platform IN ('airbnb', 'booking', 'abritel', 'direct', 'other')),
    platform_booking_id TEXT,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Finances (noms SQL snake_case)
    total_price DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Métadonnées
    notes TEXT,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ical', 'api')),
    synced_from TEXT,
    
    -- Colonnes legacy pour compatibilité avec ancien code
    gite TEXT,  -- Nom du gîte en texte (dénormalisé)
    plateforme TEXT,  -- Alias de platform
    montant DECIMAL(10, 2),  -- Alias de total_price
    acompte DECIMAL(10, 2) DEFAULT 0,  -- Alias de paid_amount
    restant DECIMAL(10, 2) DEFAULT 0,  -- Montant restant calculé
    paiement TEXT,  -- Statut de paiement
    provenance TEXT,  -- Alias de client_address
    nb_personnes INT,  -- Alias de guest_count
    telephone TEXT,  -- Alias de client_phone
    message_envoye BOOLEAN DEFAULT FALSE,  -- Suivi envoi message client
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT reservations_dates_check CHECK (check_out > check_in)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_reservations_owner ON reservations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_gite ON reservations(gite_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_platform ON reservations(platform);
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON reservations(check_in);
CREATE INDEX IF NOT EXISTS idx_reservations_gite_dates ON reservations(gite_id, check_in, check_out);

-- ================================================================
-- TRIGGERS POUR SYNCHRONISATION AUTOMATIQUE
-- ================================================================

-- Trigger 1: Calculer automatiquement le montant restant
CREATE OR REPLACE FUNCTION calculate_restant()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser les colonnes aliases
    IF NEW.total_price IS NOT NULL THEN
        NEW.montant := NEW.total_price;
    END IF;
    IF NEW.paid_amount IS NOT NULL THEN
        NEW.acompte := NEW.paid_amount;
    END IF;
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
            NEW.paiement := 'En attente';
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

-- Trigger 2: Synchroniser le nom du gîte (dénormalisé pour compatibilité)
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
    BEFORE INSERT OR UPDATE OF gite_id ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION sync_gite_name();

-- Trigger 3: Synchroniser les colonnes aliases bidirectionnellement
CREATE OR REPLACE FUNCTION sync_reservation_aliases()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync platform <-> plateforme
    IF NEW.platform IS NOT NULL AND NEW.plateforme IS NULL THEN
        NEW.plateforme := NEW.platform;
    ELSIF NEW.plateforme IS NOT NULL AND NEW.platform IS NULL THEN
        NEW.platform := NEW.plateforme;
    END IF;
    
    -- Sync total_price <-> montant
    IF NEW.total_price IS NOT NULL AND NEW.montant IS NULL THEN
        NEW.montant := NEW.total_price;
    ELSIF NEW.montant IS NOT NULL AND NEW.total_price IS NULL THEN
        NEW.total_price := NEW.montant;
    END IF;
    
    -- Sync paid_amount <-> acompte
    IF NEW.paid_amount IS NOT NULL AND NEW.acompte IS NULL THEN
        NEW.acompte := NEW.paid_amount;
    ELSIF NEW.acompte IS NOT NULL AND NEW.paid_amount IS NULL THEN
        NEW.paid_amount := NEW.acompte;
    END IF;
    
    -- Sync client_address <-> provenance
    IF NEW.client_address IS NOT NULL AND NEW.provenance IS NULL THEN
        NEW.provenance := NEW.client_address;
    ELSIF NEW.provenance IS NOT NULL AND NEW.client_address IS NULL THEN
        NEW.client_address := NEW.provenance;
    END IF;
    
    -- Sync guest_count <-> nb_personnes
    IF NEW.guest_count IS NOT NULL AND NEW.nb_personnes IS NULL THEN
        NEW.nb_personnes := NEW.guest_count;
    ELSIF NEW.nb_personnes IS NOT NULL AND NEW.guest_count IS NULL THEN
        NEW.guest_count := NEW.nb_personnes;
    END IF;
    
    -- Sync client_phone <-> telephone
    IF NEW.client_phone IS NOT NULL AND NEW.telephone IS NULL THEN
        NEW.telephone := NEW.client_phone;
    ELSIF NEW.telephone IS NOT NULL AND NEW.client_phone IS NULL THEN
        NEW.client_phone := NEW.telephone;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_aliases ON reservations;
CREATE TRIGGER trigger_sync_aliases
    BEFORE INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION sync_reservation_aliases();

-- ================================================================
-- TABLE 3: cleaning_schedule (AVEC TOUTES LES COLONNES NÉCESSAIRES)
-- ================================================================

CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Lien avec la réservation (COLONNE CRITIQUE)
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Informations sur le ménage
    gite TEXT,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'pending_validation', 'refused')),
    
    -- Colonnes nécessaires pour le code JS (menage.js)
    validated_by_company BOOLEAN DEFAULT FALSE,
    reservation_end DATE,
    reservation_start_after DATE,
    
    -- Métadonnées
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte UNIQUE pour on_conflict dans JS
    CONSTRAINT cleaning_schedule_reservation_id_unique UNIQUE(reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_cleaning_owner ON cleaning_schedule(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_date ON cleaning_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_status ON cleaning_schedule(status);
CREATE INDEX IF NOT EXISTS idx_cleaning_gite ON cleaning_schedule(gite_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_reservation ON cleaning_schedule(reservation_id);

-- ================================================================
-- TABLE 4: charges (Dépenses)
-- ================================================================

CREATE TABLE IF NOT EXISTS charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE SET NULL,
    charge_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'EUR',
    category TEXT NOT NULL CHECK (category IN (
        'utilities', 'maintenance', 'supplies', 'insurance',
        'taxes', 'fees', 'cleaning', 'marketing', 'other'
    )),
    subcategory TEXT,
    description TEXT NOT NULL,
    supplier TEXT,
    invoice_number TEXT,
    payment_method TEXT CHECK (payment_method IN ('card', 'cash', 'check', 'transfer', 'other')),
    is_deductible BOOLEAN DEFAULT true,
    attachments JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_charges_owner ON charges(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_charges_gite ON charges(gite_id);
CREATE INDEX IF NOT EXISTS idx_charges_date ON charges(charge_date);
CREATE INDEX IF NOT EXISTS idx_charges_category ON charges(category);

-- ================================================================
-- TABLE 5: retours_menage (Retours femme de ménage)
-- ================================================================

CREATE TABLE IF NOT EXISTS retours_menage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    date_menage DATE NOT NULL,
    heure_arrivee TIME,
    heure_depart TIME,
    duree_minutes INT,
    commentaires TEXT,
    produits_manquants JSONB DEFAULT '[]',
    problemes_signales JSONB DEFAULT '[]',
    photos JSONB DEFAULT '[]',
    validated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retours_owner ON retours_menage(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_retours_gite ON retours_menage(gite_id);
CREATE INDEX IF NOT EXISTS idx_retours_date ON retours_menage(date_menage);

-- ================================================================
-- TABLE 6: linen_stocks (Gestion draps et linge)
-- ================================================================

CREATE TABLE IF NOT EXISTS linen_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Colonnes pour chaque type de linge (correspondant au code JS)
    draps_plats_grands INT DEFAULT 0 CHECK (draps_plats_grands >= 0),
    draps_plats_petits INT DEFAULT 0 CHECK (draps_plats_petits >= 0),
    housses_couettes_grandes INT DEFAULT 0 CHECK (housses_couettes_grandes >= 0),
    housses_couettes_petites INT DEFAULT 0 CHECK (housses_couettes_petites >= 0),
    taies_oreillers INT DEFAULT 0 CHECK (taies_oreillers >= 0),
    serviettes INT DEFAULT 0 CHECK (serviettes >= 0),
    tapis_bain INT DEFAULT 0 CHECK (tapis_bain >= 0),
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte UNIQUE pour on_conflict dans JS (upsert par gite_id)
    CONSTRAINT linen_stocks_gite_id_unique UNIQUE(gite_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_linen_stocks_owner ON linen_stocks(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_linen_stocks_gite ON linen_stocks(gite_id);

-- ================================================================
-- TABLE 7: infos_pratiques (Informations clients)
-- ================================================================

CREATE TABLE IF NOT EXISTS infos_pratiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('wifi', 'access', 'emergency', 'services', 'rules', 'equipment', 'other')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    icon TEXT,
    priority INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_infos_owner ON infos_pratiques(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_infos_gite ON infos_pratiques(gite_id);
CREATE INDEX IF NOT EXISTS idx_infos_category ON infos_pratiques(category);

-- ================================================================
-- TABLE 8: faq (Questions fréquentes)
-- ================================================================

CREATE TABLE IF NOT EXISTS faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    priority INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faq_owner ON faq(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_faq_gite ON faq(gite_id);
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);

-- ================================================================
-- TABLE 9: todos (Liste de tâches)
-- ================================================================

CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    category TEXT,
    title TEXT NOT NULL,
    description TEXT,
    gite TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    completed BOOLEAN DEFAULT false,
    is_recurrent BOOLEAN DEFAULT false,
    frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    frequency_detail JSONB,
    next_occurrence TIMESTAMPTZ,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todos_owner ON todos(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_todos_gite ON todos(gite_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_next_occurrence ON todos(next_occurrence);

-- ================================================================
-- TABLE 10: demandes_horaires (Demandes horaires clients)
-- ================================================================

CREATE TABLE IF NOT EXISTS demandes_horaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('arrivee_anticipee', 'depart_tardif')),
    heure_demandee TIME,
    heure_accordee TIME,
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'accepte', 'refuse')),
    motif TEXT,
    reponse TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demandes_owner ON demandes_horaires(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_demandes_reservation ON demandes_horaires(reservation_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes_horaires(statut);

-- ================================================================
-- TABLE 11: problemes_signales (Problèmes signalés)
-- ================================================================

CREATE TABLE IF NOT EXISTS problemes_signales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    sujet TEXT NOT NULL,
    description TEXT NOT NULL,
    gravite TEXT DEFAULT 'moyen' CHECK (gravite IN ('faible', 'moyen', 'eleve', 'urgent')),
    statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'resolu', 'ignore')),
    photos JSONB DEFAULT '[]',
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problemes_owner ON problemes_signales(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_problemes_gite ON problemes_signales(gite_id);
CREATE INDEX IF NOT EXISTS idx_problemes_statut ON problemes_signales(statut);
CREATE INDEX IF NOT EXISTS idx_problemes_gravite ON problemes_signales(gravite);

-- ================================================================
-- TABLE 12: simulations_fiscales (Simulations fiscalité)
-- ================================================================

CREATE TABLE IF NOT EXISTS simulations_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    regime TEXT CHECK (regime IN ('reel', 'micro_bic', 'lmnp')),
    revenus_total DECIMAL(12, 2),
    charges_total DECIMAL(12, 2),
    amortissements DECIMAL(12, 2),
    resultat_imposable DECIMAL(12, 2),
    impot_estime DECIMAL(12, 2),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulations_owner ON simulations_fiscales(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_annee ON simulations_fiscales(annee);

-- ================================================================
-- TABLE 13: suivi_soldes_bancaires (Suivi soldes bancaires)
-- ================================================================

CREATE TABLE IF NOT EXISTS suivi_soldes_bancaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    date_releve DATE NOT NULL,
    solde DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soldes_owner ON suivi_soldes_bancaires(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_soldes_gite ON suivi_soldes_bancaires(gite_id);
CREATE INDEX IF NOT EXISTS idx_soldes_date ON suivi_soldes_bancaires(date_releve);

-- ================================================================
-- TABLE 14: historical_data (Historique des modifications)
-- ================================================================

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

CREATE INDEX IF NOT EXISTS idx_historical_owner ON historical_data(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_historical_table ON historical_data(table_name, record_id);

-- ================================================================
-- TABLE: CHECKLIST_TEMPLATES
-- ================================================================
-- Templates de checklist pour les entrées/sorties par gîte
-- Permet de définir les points à vérifier lors des arrivées/départs

CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
    ordre INTEGER NOT NULL DEFAULT 1,
    texte TEXT NOT NULL,
    description TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_owner ON checklist_templates(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_gite ON checklist_templates(gite_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_type ON checklist_templates(type);

-- ================================================================
-- TABLE: CHECKLIST_PROGRESS
-- ================================================================
-- Progression des checklists par réservation
-- Permet de suivre quels items ont été validés pour chaque réservation

CREATE TABLE IF NOT EXISTS checklist_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reservation_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_progress_owner ON checklist_progress(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_resa ON checklist_progress(reservation_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_template ON checklist_progress(template_id);

-- ================================================================
-- ACTIVATION ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks_draps ENABLE ROW LEVEL SECURITY;
ALTER TABLE infos_pratiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_horaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE problemes_signales ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE suivi_soldes_bancaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLITIQUES RLS - ISOLATION PAR USER
-- ================================================================

-- GITES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_gites ON gites;
    CREATE POLICY rgpd_all_own_gites ON gites 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- RESERVATIONS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_reservations ON reservations;
    CREATE POLICY rgpd_all_own_reservations ON reservations 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- CLEANING_SCHEDULE
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_cleaning ON cleaning_schedule;
    CREATE POLICY rgpd_all_own_cleaning ON cleaning_schedule 
    FOR ALL 
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());
END $$;

-- CHARGES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_charges ON charges;
    CREATE POLICY rgpd_all_own_charges ON charges 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- RETOURS_MENAGE
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_retours ON retours_menage;
    CREATE POLICY rgpd_all_own_retours ON retours_menage 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- STOCKS_DRAPS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_stocks ON stocks_draps;
    CREATE POLICY rgpd_all_own_stocks ON stocks_draps 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- INFOS_PRATIQUES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_infos ON infos_pratiques;
    CREATE POLICY rgpd_all_own_infos ON infos_pratiques 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- FAQ
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_faq ON faq;
    CREATE POLICY rgpd_all_own_faq ON faq 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- TODOS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_todos ON todos;
    CREATE POLICY rgpd_all_own_todos ON todos 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- DEMANDES_HORAIRES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_demandes ON demandes_horaires;
    CREATE POLICY rgpd_all_own_demandes ON demandes_horaires 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- PROBLEMES_SIGNALES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_problemes ON problemes_signales;
    CREATE POLICY rgpd_all_own_problemes ON problemes_signales 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- SIMULATIONS_FISCALES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_simulations ON simulations_fiscales;
    CREATE POLICY rgpd_all_own_simulations ON simulations_fiscales 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- SUIVI_SOLDES_BANCAIRES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_soldes ON suivi_soldes_bancaires;
    CREATE POLICY rgpd_all_own_soldes ON suivi_soldes_bancaires 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- HISTORICAL_DATA
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_historical ON historical_data;
    CREATE POLICY rgpd_all_own_historical ON historical_data 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- CHECKLIST_TEMPLATES
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_checklist_templates ON checklist_templates;
    CREATE POLICY rgpd_all_own_checklist_templates ON checklist_templates 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- CHECKLIST_PROGRESS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_checklist_progress ON checklist_progress;
    CREATE POLICY rgpd_all_own_checklist_progress ON checklist_progress 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

-- ================================================================
-- MIGRATION DES DONNÉES EXISTANTES
-- ================================================================

DO $$ 
DECLARE
    default_user_id UUID;
    reservations_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔄 MIGRATION DES DONNÉES EXISTANTES';
    RAISE NOTICE '========================================';
    
    -- Récupérer le premier utilisateur
    SELECT id INTO default_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF default_user_id IS NULL THEN
        RAISE WARNING '⚠️  Aucun utilisateur trouvé - migration impossible';
        RAISE NOTICE '📝 Créez un utilisateur dans Supabase Auth, puis relancez ce script';
        RETURN;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '👤 Utilisateur trouvé: %', default_user_id;
    RAISE NOTICE '';
    
    -- Migrer les réservations sans owner
    SELECT COUNT(*) INTO reservations_count 
    FROM reservations WHERE owner_user_id IS NULL;
    
    IF reservations_count > 0 THEN
        UPDATE reservations 
        SET owner_user_id = default_user_id 
        WHERE owner_user_id IS NULL;
        
        RAISE NOTICE '✅ % réservations migrées', reservations_count;
    ELSE
        RAISE NOTICE 'ℹ️  Toutes les réservations ont déjà un owner';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION TERMINÉE';
    RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- VÉRIFICATION FINALE
-- ================================================================

DO $$ 
DECLARE
    tables_count INTEGER;
    reservations_count INTEGER;
    cleaning_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 VÉRIFICATION FINALE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    SELECT COUNT(*) INTO tables_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('gites', 'reservations', 'cleaning_schedule', 'charges');
    
    RAISE NOTICE '📦 Tables créées: %/4 principales', tables_count;
    
    SELECT COUNT(*) INTO reservations_count FROM reservations;
    RAISE NOTICE '📅 Réservations: %', reservations_count;
    
    SELECT COUNT(*) INTO cleaning_count FROM cleaning_schedule;
    RAISE NOTICE '🧹 Planning ménage: %', cleaning_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Schéma complet installé avec succès !';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Prochaines étapes:';
    RAISE NOTICE '   1. Actualisez votre application (F5)';
    RAISE NOTICE '   2. Les réservations devraient être visibles';
    RAISE NOTICE '   3. Le planning de ménage devrait fonctionner';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
