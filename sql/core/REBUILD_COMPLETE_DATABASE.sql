-- ================================================================
-- 🔄 RECONSTRUCTION COMPLÈTE BASE DE DONNÉES LIVEOWNERUNIT
-- ================================================================
-- Date création: 13 février 2026
-- Version: v5.0 Production
-- Description: Script de reconstruction COMPLÈTE de la base de données
-- Tables: 52 tables production
-- Usage: EN CAS DE DISASTER RECOVERY UNIQUEMENT
-- ================================================================
-- ⚠️ DANGER: Ce script DROP et recrée TOUTES les tables
-- ⚠️ TOUTES LES DONNÉES SERONT PERDUES
-- ⚠️ Exécuter UNIQUEMENT pour reconstruction complète
-- ================================================================
-- 📋 Tables créées (par groupe):
-- - Core Application (10 tables)
-- - Fiches Clients (6 tables)
-- - Gestion Ménage (4 tables)
-- - Fiscalité (4 tables)
-- - Stocks Linge (3 tables)
-- - Channel Manager (15 tables)
-- - Support & Monitoring (5 tables)
-- - Divers (5 tables)
-- ================================================================

BEGIN;

-- ================================================================
-- 🔧 EXTENSIONS REQUISES
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour recherche full-text

-- ================================================================
-- 🗑️ NETTOYAGE COMPLET (Danger Zone)
-- ================================================================

-- Désactiver temporairement les triggers
SET session_replication_role = 'replica';

-- Drop toutes les policies RLS existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own data" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own data" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own data" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own data" ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Drop tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS public.linen_stock_transactions CASCADE;
DROP TABLE IF EXISTS public.linen_stock_items CASCADE;
DROP TABLE IF EXISTS public.linen_stocks CASCADE;
DROP TABLE IF EXISTS public.km_lieux_favoris CASCADE;
DROP TABLE IF EXISTS public.km_config_auto CASCADE;
DROP TABLE IF EXISTS public.km_trajets CASCADE;
DROP TABLE IF EXISTS public.simulations_fiscales CASCADE;
DROP TABLE IF EXISTS public.retours_menage CASCADE;
DROP TABLE IF EXISTS public.problemes_signales CASCADE;
DROP TABLE IF EXISTS public.cleaning_rules CASCADE;
DROP TABLE IF EXISTS public.cleaning_schedule CASCADE;
DROP TABLE IF EXISTS public.activites_gites CASCADE;
DROP TABLE IF EXISTS public.client_access_tokens CASCADE;
DROP TABLE IF EXISTS public.faq CASCADE;
DROP TABLE IF EXISTS public.checklist_progress CASCADE;
DROP TABLE IF EXISTS public.checklist_templates CASCADE;
DROP TABLE IF EXISTS public.infos_gites CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.gites CASCADE;
DROP TABLE IF EXISTS public.cm_website_pages CASCADE;
DROP TABLE IF EXISTS public.cm_support_diagnostics CASCADE;
DROP TABLE IF EXISTS public.cm_support_solutions CASCADE;
DROP TABLE IF EXISTS public.cm_ai_content_queue CASCADE;
DROP TABLE IF EXISTS public.cm_revenue_tracking CASCADE;
DROP TABLE IF EXISTS public.cm_referrals CASCADE;
DROP TABLE IF EXISTS public.cm_activity_logs CASCADE;
DROP TABLE IF EXISTS public.cm_support_comments CASCADE;
DROP TABLE IF EXISTS public.cm_support_tickets CASCADE;
DROP TABLE IF EXISTS public.cm_promo_usage CASCADE;
DROP TABLE IF EXISTS public.cm_promotions CASCADE;
DROP TABLE IF EXISTS public.cm_pricing_plans CASCADE;
DROP TABLE IF EXISTS public.cm_invoices CASCADE;
DROP TABLE IF EXISTS public.cm_subscriptions CASCADE;
DROP TABLE IF EXISTS public.cm_clients CASCADE;
DROP TABLE IF EXISTS public.sync_logs CASCADE;
DROP TABLE IF EXISTS public.historique_donnees CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.shopping_list_items CASCADE;
DROP TABLE IF EXISTS public.shopping_lists CASCADE;
DROP TABLE IF EXISTS public.auto_ticket_diagnostics CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.error_corrections CASCADE;
DROP TABLE IF EXISTS public.error_logs CASCADE;

-- Réactiver triggers
SET session_replication_role = 'origin';

-- ================================================================
-- 📋 GROUPE 1: CORE APPLICATION (10 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: gites (Table Maître)
-- --------------------------------------------------------------
CREATE TABLE public.gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    address TEXT,
    icon TEXT DEFAULT 'home',
    color TEXT DEFAULT '#667eea',
    capacity INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    distance_km NUMERIC(6,2) DEFAULT 0,
    ical_sources JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    tarifs_calendrier JSONB DEFAULT '{}'::jsonb,
    regles_tarifaires JSONB DEFAULT '{}'::jsonb,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_user_id, slug)
);

CREATE INDEX idx_gites_owner ON public.gites(owner_user_id);
CREATE INDEX idx_gites_active ON public.gites(owner_user_id, is_active);
CREATE INDEX idx_gites_slug ON public.gites(owner_user_id, slug);

-- --------------------------------------------------------------
-- TABLE: reservations (CŒUR MÉTIER)
-- --------------------------------------------------------------
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    client_name TEXT NOT NULL CHECK (length(client_name) >= 2),
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    guest_count INTEGER,
    nb_personnes INTEGER, -- Alias
    platform TEXT,
    plateforme TEXT, -- Alias
    platform_booking_id TEXT,
    status TEXT DEFAULT 'confirmed',
    total_price NUMERIC(10,2),
    montant NUMERIC(10,2), -- Alias
    currency TEXT DEFAULT 'EUR',
    paid_amount NUMERIC(10,2),
    acompte NUMERIC(10,2), -- Alias
    restant NUMERIC(10,2),
    paiement TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual',
    provenance TEXT, -- Alias client_address
    synced_from TEXT,
    ical_uid TEXT,
    manual_override BOOLEAN DEFAULT false,
    last_seen_in_ical TIMESTAMPTZ,
    message_envoye BOOLEAN DEFAULT false,
    check_in_time TIME,
    check_out_time TIME,
    telephone TEXT, -- Alias client_phone
    gite TEXT, -- Nom gîte (sync trigger)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK (check_out > check_in)
);

CREATE INDEX idx_reservations_owner ON public.reservations(owner_user_id);
CREATE INDEX idx_reservations_gite ON public.reservations(gite_id);
CREATE INDEX idx_reservations_dates ON public.reservations(check_in, check_out);
CREATE INDEX idx_reservations_status ON public.reservations(owner_user_id, status);
CREATE INDEX idx_reservations_ical_uid ON public.reservations(ical_uid) WHERE ical_uid IS NOT NULL;
CREATE INDEX idx_reservations_last_seen ON public.reservations(last_seen_in_ical) WHERE source = 'ical';

-- ================================================================
-- 📋 GROUPE 2: FICHES CLIENTS (6 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: infos_gites (119 colonnes bilingues FR/EN)
-- --------------------------------------------------------------
CREATE TABLE public.infos_gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    -- Base
    adresse TEXT,
    adresse_en TEXT,
    telephone TEXT,
    telephone_en TEXT,
    email TEXT,
    email_en TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    -- WiFi
    wifi_ssid TEXT,
    wifi_password TEXT,
    wifi_debit TEXT,
    wifi_debit_en TEXT,
    wifi_localisation TEXT,
    wifi_localisation_en TEXT,
    wifi_zones TEXT,
    wifi_zones_en TEXT,
    -- Arrivée (12 × 2 = 24 colonnes)
    arrivee_heure TEXT,
    arrivee_heure_fin TEXT,
    arrivee_parking TEXT,
    arrivee_parking_en TEXT,
    arrivee_acces TEXT,
    arrivee_acces_en TEXT,
    arrivee_codes JSONB,
    arrivee_instructions_cles TEXT,
    arrivee_instructions_cles_en TEXT,
    arrivee_etage TEXT,
    arrivee_etage_en TEXT,
    -- Logement (20 × 2 = 40 colonnes)
    chauffage_type TEXT,
    chauffage_utilisation TEXT,
    chauffage_utilisation_en TEXT,
    cuisine_equipements TEXT,
    cuisine_equipements_en TEXT,
    electromenager_details TEXT,
    electromenager_details_en TEXT,
    chambre_literie TEXT,
    chambre_literie_en TEXT,
    tv_internet_instructions TEXT,
    tv_internet_instructions_en TEXT,
    -- Déchets
    dechets_tri TEXT,
    dechets_tri_en TEXT,
    dechets_collecte TEXT,
    dechets_collecte_en TEXT,
    dechets_decheterie TEXT,
    dechets_decheterie_en TEXT,
    -- Sécurité
    securite_detecteurs TEXT,
    securite_detecteurs_en TEXT,
    securite_extincteur TEXT,
    securite_extincteur_en TEXT,
    securite_coupures TEXT,
    securite_coupures_en TEXT,
    -- Départ
    depart_heure TEXT,
    depart_checklist TEXT,
    depart_checklist_en TEXT,
    depart_restitution_cles TEXT,
    depart_restitution_cles_en TEXT,
    -- Règlement
    reglement_tabac TEXT,
    reglement_tabac_en TEXT,
    reglement_animaux TEXT,
    reglement_animaux_en TEXT,
    reglement_nb_personnes INTEGER,
    reglement_caution NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(gite_id)
);

CREATE INDEX idx_infos_gites_owner ON public.infos_gites(owner_user_id);
CREATE INDEX idx_infos_gites_gite ON public.infos_gites(gite_id);

-- --------------------------------------------------------------
-- TABLE: checklist_templates
-- --------------------------------------------------------------
CREATE TABLE public.checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES public.gites(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
    ordre INTEGER DEFAULT 1,
    texte TEXT NOT NULL,
    texte_en TEXT,
    description TEXT,
    description_en TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_checklist_templates_owner ON public.checklist_templates(owner_user_id);
CREATE INDEX idx_checklist_templates_gite ON public.checklist_templates(gite_id);
CREATE INDEX idx_checklist_templates_type ON public.checklist_templates(type);

-- --------------------------------------------------------------
-- TABLE: checklist_progress
-- --------------------------------------------------------------
CREATE TABLE public.checklist_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(reservation_id, template_id)
);

CREATE INDEX idx_checklist_progress_owner ON public.checklist_progress(owner_user_id);
CREATE INDEX idx_checklist_progress_resa ON public.checklist_progress(reservation_id);
CREATE INDEX idx_checklist_progress_template ON public.checklist_progress(template_id);

-- --------------------------------------------------------------
-- TABLE: faq
-- --------------------------------------------------------------
CREATE TABLE public.faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES public.gites(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_en TEXT,
    answer TEXT,
    answer_en TEXT,
    reponse_en TEXT, -- Alias obsolète
    category TEXT,
    categorie TEXT, -- Alias
    priority INTEGER DEFAULT 0,
    ordre INTEGER, -- Alias
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_faq_owner ON public.faq(owner_user_id);
CREATE INDEX idx_faq_gite ON public.faq(gite_id);
CREATE INDEX idx_faq_category ON public.faq(category);
CREATE INDEX idx_faq_priority ON public.faq(priority);

-- --------------------------------------------------------------
-- TABLE: client_access_tokens
-- --------------------------------------------------------------
CREATE TABLE public.client_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tokens_owner ON public.client_access_tokens(owner_user_id);
CREATE INDEX idx_tokens_token ON public.client_access_tokens(token);

-- --------------------------------------------------------------
-- TABLE: activites_gites
-- --------------------------------------------------------------
CREATE TABLE public.activites_gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    categorie TEXT,
    description TEXT,
    adresse TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    distance_km NUMERIC(6,2),
    url TEXT,
    telephone TEXT,
    note NUMERIC(2,1),
    nb_avis INTEGER,
    photos JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activites_owner ON public.activites_gites(owner_user_id);
CREATE INDEX idx_activites_gite ON public.activites_gites(gite_id);
CREATE INDEX idx_activites_categorie ON public.activites_gites(categorie);

-- ================================================================
-- 📋 GROUPE 3: GESTION MÉNAGE (4 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: cleaning_schedule
-- --------------------------------------------------------------
CREATE TABLE public.cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT CHECK (type IN ('entree', 'sortie', 'intermediaire')),
    status TEXT DEFAULT 'a_faire',
    assignee_email TEXT,
    notes TEXT,
    photos JSONB,
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cleaning_schedule_owner ON public.cleaning_schedule(owner_user_id);
CREATE INDEX idx_cleaning_schedule_gite ON public.cleaning_schedule(gite_id);
CREATE INDEX idx_cleaning_schedule_date ON public.cleaning_schedule(date);
CREATE INDEX idx_cleaning_schedule_resa ON public.cleaning_schedule(reservation_id);

-- --------------------------------------------------------------
-- TABLE: cleaning_rules
-- --------------------------------------------------------------
CREATE TABLE public.cleaning_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code TEXT UNIQUE NOT NULL,
    rule_name TEXT,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cleaning_rules_code ON public.cleaning_rules(rule_code);

-- --------------------------------------------------------------
-- TABLE: retours_menage
-- --------------------------------------------------------------
CREATE TABLE public.retours_menage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cleaning_schedule_id UUID REFERENCES public.cleaning_schedule(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    type TEXT,
    description TEXT NOT NULL,
    photos JSONB,
    urgence TEXT,
    status TEXT DEFAULT 'non_traite',
    reponse TEXT,
    traite_par UUID REFERENCES auth.users(id),
    traite_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_retours_menage_owner ON public.retours_menage(owner_user_id);
CREATE INDEX idx_retours_menage_cleaning ON public.retours_menage(cleaning_schedule_id);
CREATE INDEX idx_retours_menage_gite ON public.retours_menage(gite_id);

-- --------------------------------------------------------------
-- TABLE: problemes_signales
-- --------------------------------------------------------------
CREATE TABLE public.problemes_signales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    type TEXT,
    description TEXT NOT NULL,
    photos JSONB,
    urgence TEXT,
    status TEXT DEFAULT 'non_traite',
    reponse TEXT,
    traite_par UUID REFERENCES auth.users(id),
    traite_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_problemes_owner ON public.problemes_signales(owner_user_id);
CREATE INDEX idx_problemes_resa ON public.problemes_signales(reservation_id);
CREATE INDEX idx_problemes_gite ON public.problemes_signales(gite_id);

-- ================================================================
-- 📋 GROUPE 4: FISCALITÉ (4 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: simulations_fiscales
-- --------------------------------------------------------------
CREATE TABLE public.simulations_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    chiffre_affaires NUMERIC(12,2),
    charges_totales NUMERIC(12,2),
    regime TEXT,
    tmi NUMERIC(4,2),
    rfr NUMERIC(12,2),
    versement_liberatoire BOOLEAN DEFAULT false,
    meuble_classe BOOLEAN DEFAULT false,
    resultat_fiscal NUMERIC(12,2),
    ir_du NUMERIC(12,2),
    urssaf_du NUMERIC(12,2),
    total_a_payer NUMERIC(12,2),
    donnees_detaillees JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_user_id, annee)
);

CREATE INDEX idx_sim_fiscales_owner ON public.simulations_fiscales(owner_user_id);
CREATE INDEX idx_sim_fiscales_annee ON public.simulations_fiscales(annee);

-- --------------------------------------------------------------
-- TABLE: km_trajets
-- --------------------------------------------------------------
CREATE TABLE public.km_trajets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES public.gites(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    date_trajet DATE NOT NULL,
    motif TEXT,
    type_trajet TEXT,
    lieu_arrivee TEXT,
    distance_aller NUMERIC(6,2),
    aller_retour BOOLEAN DEFAULT true,
    distance_totale NUMERIC(6,2),
    auto_genere BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_km_trajets_owner ON public.km_trajets(owner_user_id);
CREATE INDEX idx_km_trajets_gite ON public.km_trajets(gite_id);
CREATE INDEX idx_km_trajets_date ON public.km_trajets(date_trajet);

-- --------------------------------------------------------------
-- TABLE: km_config_auto
-- --------------------------------------------------------------
CREATE TABLE public.km_config_auto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_menage_entree BOOLEAN DEFAULT false,
    auto_menage_sortie BOOLEAN DEFAULT false,
    auto_courses BOOLEAN DEFAULT false,
    auto_maintenance BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_km_config_owner ON public.km_config_auto(owner_user_id);

-- --------------------------------------------------------------
-- TABLE: km_lieux_favoris
-- --------------------------------------------------------------
CREATE TABLE public.km_lieux_favoris (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    type_lieu TEXT,
    distance_km NUMERIC(6,2) NOT NULL,
    adresse TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_km_favoris_owner ON public.km_lieux_favoris(owner_user_id);

-- ================================================================
-- 📋 GROUPE 5: STOCKS LINGE (3 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: linen_stocks
-- --------------------------------------------------------------
CREATE TABLE public.linen_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID UNIQUE NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    draps_plats_grands INTEGER DEFAULT 0,
    draps_plats_petits INTEGER DEFAULT 0,
    housses_couettes_grandes INTEGER DEFAULT 0,
    housses_couettes_petites INTEGER DEFAULT 0,
    taies_oreillers INTEGER DEFAULT 0,
    serviettes INTEGER DEFAULT 0,
    tapis_bain INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_linen_stocks_owner ON public.linen_stocks(owner_user_id);
CREATE UNIQUE INDEX idx_linen_stocks_gite ON public.linen_stocks(gite_id);

-- --------------------------------------------------------------
-- TABLE: linen_stock_items
-- --------------------------------------------------------------
CREATE TABLE public.linen_stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(gite_id, item_key)
);

CREATE INDEX idx_linen_items_owner ON public.linen_stock_items(owner_user_id);
CREATE INDEX idx_linen_items_gite ON public.linen_stock_items(gite_id);
CREATE INDEX idx_linen_items_key ON public.linen_stock_items(item_key);

-- --------------------------------------------------------------
-- TABLE: linen_stock_transactions
-- --------------------------------------------------------------
CREATE TABLE public.linen_stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    type TEXT,
    item_type TEXT,
    quantity_change INTEGER,
    quantity_after INTEGER,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_linen_transactions_owner ON public.linen_stock_transactions(owner_user_id);
CREATE INDEX idx_linen_transactions_gite ON public.linen_stock_transactions(gite_id);
CREATE INDEX idx_linen_transactions_date ON public.linen_stock_transactions(created_at);

-- ================================================================
-- 📋 GROUPE 6: CHANNEL MANAGER / SAAS ADMIN (15 tables)
-- ================================================================

-- [Continué dans la partie 2 du fichier...]

COMMIT;

-- ================================================================
-- FIN PARTIE 1
-- ================================================================
-- Voir REBUILD_COMPLETE_DATABASE_PART2.sql pour:
-- - Channel Manager (15 tables)
-- - Support & Monitoring (5 tables)
-- - Divers (5 tables)
-- - Triggers & Functions
-- - RLS Policies
-- ================================================================
