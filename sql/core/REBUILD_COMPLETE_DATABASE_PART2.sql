-- ================================================================
-- 🔄 RECONSTRUCTION COMPLÈTE BDD - PARTIE 2
-- ================================================================
-- Suite de REBUILD_COMPLETE_DATABASE.sql
-- ================================================================

BEGIN;

-- ================================================================
-- 📋 GROUPE 6: CHANNEL MANAGER / SAAS ADMIN (15 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: cm_clients
-- --------------------------------------------------------------
CREATE TABLE public.cm_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE,
    email_principal   TEXT,
    name TEXT,
    nom_contact       TEXT,
    prenom_contact    TEXT,
    company_name TEXT,
    nom_entreprise    TEXT,
    entreprise        TEXT,
    phone TEXT,
    telephone         TEXT,
    address TEXT,
    type_abonnement   TEXT DEFAULT 'basic',
    statut            TEXT DEFAULT 'trial',
    date_inscription  TIMESTAMPTZ DEFAULT now(),
    date_fin_abonnement TIMESTAMPTZ,
    montant_mensuel   NUMERIC(10,2) DEFAULT 0,
    nb_gites_actuels  INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.cm_clients(id),
    status TEXT DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    preferences JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_clients_email ON public.cm_clients(email);
CREATE INDEX idx_cm_clients_referral_code ON public.cm_clients(referral_code);
CREATE INDEX idx_cm_clients_status ON public.cm_clients(status);
CREATE INDEX idx_cm_clients_user_id ON public.cm_clients(user_id);

ALTER TABLE public.cm_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cm_clients_user_select ON public.cm_clients;
DROP POLICY IF EXISTS cm_clients_user_insert ON public.cm_clients;
DROP POLICY IF EXISTS cm_clients_user_update ON public.cm_clients;

CREATE POLICY cm_clients_user_select ON public.cm_clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cm_clients_user_insert ON public.cm_clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cm_clients_user_update ON public.cm_clients
    FOR UPDATE USING (auth.uid() = user_id);

-- --------------------------------------------------------------
-- TABLE: cm_subscriptions
-- --------------------------------------------------------------
CREATE TABLE public.cm_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    -- FK ajoutee apres creation de cm_pricing_plans (ordre des tables)
    plan_id UUID,
    status TEXT DEFAULT 'active',
    date_debut TIMESTAMPTZ,
    type_abonnement   TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    amount NUMERIC(10,2),
    currency TEXT DEFAULT 'EUR',
    billing_cycle TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_subscriptions_client ON public.cm_subscriptions(client_id);
CREATE INDEX idx_cm_subscriptions_plan ON public.cm_subscriptions(plan_id);
CREATE INDEX idx_cm_subscriptions_status ON public.cm_subscriptions(status);

-- --------------------------------------------------------------
-- TABLE: cm_invoices
-- --------------------------------------------------------------
CREATE TABLE public.cm_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.cm_subscriptions(id),
    invoice_number TEXT UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    tax NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    montant_ttc   NUMERIC(10,2),
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'draft',
    statut        TEXT,
    issued_date DATE,
    date_emission DATE,
    due_date DATE,
    paid_date DATE,
    payment_method TEXT,
    stripe_invoice_id TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_invoices_client ON public.cm_invoices(client_id);
CREATE INDEX idx_cm_invoices_subscription ON public.cm_invoices(subscription_id);
CREATE INDEX idx_cm_invoices_number ON public.cm_invoices(invoice_number);
CREATE INDEX idx_cm_invoices_status ON public.cm_invoices(status);

-- --------------------------------------------------------------
-- TABLE: cm_pricing_plans
-- --------------------------------------------------------------
CREATE TABLE public.cm_pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    price_monthly NUMERIC(10,2),
    price_yearly NUMERIC(10,2),
    features JSONB,
    limits JSONB,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_pricing_plans_slug ON public.cm_pricing_plans(slug);
CREATE INDEX idx_cm_pricing_plans_active ON public.cm_pricing_plans(is_active);

-- FK differee pour respecter l'ordre de creation
ALTER TABLE public.cm_subscriptions
    ADD CONSTRAINT cm_subscriptions_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.cm_pricing_plans(id);

-- --------------------------------------------------------------
-- TABLE: cm_promotions
-- --------------------------------------------------------------
CREATE TABLE public.cm_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    nom TEXT,
    description TEXT,
    type TEXT,
    type_promotion   TEXT,
    value NUMERIC(10,2),
    valeur           NUMERIC(10,2),
    cible            TEXT DEFAULT 'tous',
    max_uses INTEGER,
    max_utilisations INTEGER,
    uses_count INTEGER DEFAULT 0,
    nb_utilisations  INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ,
    date_debut       TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    date_fin TIMESTAMPTZ,
    applicable_plans JSONB,
    is_active BOOLEAN DEFAULT true,
    actif BOOLEAN DEFAULT true,
    segment_abonnement JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_promotions_code ON public.cm_promotions(code);
CREATE INDEX idx_cm_promotions_active ON public.cm_promotions(is_active);

-- --------------------------------------------------------------
-- TABLE: cm_promo_usage
-- --------------------------------------------------------------
CREATE TABLE public.cm_promo_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES public.cm_promotions(id) ON DELETE CASCADE,
    promo_id UUID REFERENCES public.cm_promotions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.cm_subscriptions(id),
    discount_amount NUMERIC(10,2),
    montant_reduction NUMERIC(10,2) DEFAULT 0,
    ca_genere         NUMERIC(10,2) DEFAULT 0,
    statut            TEXT DEFAULT 'actif',
    applied_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_promo_usage_promo ON public.cm_promo_usage(promotion_id);
CREATE INDEX idx_cm_promo_usage_client ON public.cm_promo_usage(client_id);
CREATE INDEX idx_cm_promo_usage_subscription ON public.cm_promo_usage(subscription_id);

-- --------------------------------------------------------------
-- TABLE: cm_support_tickets
-- --------------------------------------------------------------
CREATE TABLE public.cm_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    title TEXT,
    sujet TEXT,
    description TEXT,
    category TEXT,
    categorie TEXT,
    priority TEXT DEFAULT 'normal',
    priorite TEXT DEFAULT 'normale',
    status TEXT DEFAULT 'open',
    statut TEXT DEFAULT 'ouvert',
    csat_score NUMERIC(3,1),
    assigned_to TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    tags JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_support_tickets_client ON public.cm_support_tickets(client_id);
CREATE INDEX idx_cm_support_tickets_status ON public.cm_support_tickets(status);
CREATE INDEX idx_cm_support_tickets_priority ON public.cm_support_tickets(priority);
CREATE INDEX idx_cm_support_tickets_category ON public.cm_support_tickets(category);

-- --------------------------------------------------------------
-- TABLE: cm_support_comments
-- --------------------------------------------------------------
CREATE TABLE public.cm_support_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.cm_support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_email TEXT,
    author_role TEXT,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT false,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_support_comments_ticket ON public.cm_support_comments(ticket_id);
CREATE INDEX idx_cm_support_comments_author ON public.cm_support_comments(author_email);

-- --------------------------------------------------------------
-- TABLE: cm_activity_logs
-- --------------------------------------------------------------
CREATE TABLE public.cm_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.cm_clients(id),
    action TEXT NOT NULL,
    type_activite TEXT,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_activity_logs_client ON public.cm_activity_logs(client_id);
CREATE INDEX idx_cm_activity_logs_action ON public.cm_activity_logs(action);
CREATE INDEX idx_cm_activity_logs_date ON public.cm_activity_logs(created_at);

-- --------------------------------------------------------------
-- TABLE: cm_referrals
-- --------------------------------------------------------------
CREATE TABLE public.cm_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    referral_code TEXT,
    status TEXT DEFAULT 'pending',
    reward_amount NUMERIC(10,2),
    reward_type TEXT,
    reward_applied BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_referrals_referrer ON public.cm_referrals(referrer_id);
CREATE INDEX idx_cm_referrals_referred ON public.cm_referrals(referred_id);
CREATE INDEX idx_cm_referrals_code ON public.cm_referrals(referral_code);

-- --------------------------------------------------------------
-- TABLE: cm_revenue_tracking
-- --------------------------------------------------------------
CREATE TABLE public.cm_revenue_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    mois DATE,
    source TEXT,
    amount NUMERIC(10,2) NOT NULL,
    mrr NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    client_id UUID REFERENCES public.cm_clients(id),
    subscription_id UUID REFERENCES public.cm_subscriptions(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_revenue_date ON public.cm_revenue_tracking(date);
CREATE INDEX idx_cm_revenue_mois ON public.cm_revenue_tracking(mois);
CREATE INDEX idx_cm_revenue_source ON public.cm_revenue_tracking(source);
CREATE INDEX idx_cm_revenue_client ON public.cm_revenue_tracking(client_id);

-- Vue : cm_error_logs → alias vers error_logs (utilisé par admin-error-monitor.js)
CREATE OR REPLACE VIEW public.cm_error_logs AS
    SELECT id, user_id, error_message, error_stack, error_type, url,
           user_agent, browser, os, timestamp, severity, resolved, resolved_at, metadata
    FROM public.error_logs;

-- --------------------------------------------------------------
-- TABLE: cm_ai_content_queue
-- --------------------------------------------------------------
CREATE TABLE public.cm_ai_content_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    content_type TEXT,
    type           TEXT,
    plateforme     TEXT,
    sujet          TEXT,
    contenu        TEXT,
    scheduled_date TIMESTAMPTZ,
    statut         TEXT DEFAULT 'en_attente',
    plan_detaille  JSONB,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    input_data JSONB,
    output_content TEXT,
    model_used TEXT,
    tokens_used INTEGER,
    cost NUMERIC(10,4),
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_ai_queue_client ON public.cm_ai_content_queue(client_id);
CREATE INDEX idx_cm_ai_queue_status ON public.cm_ai_content_queue(status);
CREATE INDEX idx_cm_ai_queue_priority ON public.cm_ai_content_queue(priority);

-- --------------------------------------------------------------
-- TABLE: cm_content_generated (contenu IA sauvegardé par admin-content.js)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cm_content_generated (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID REFERENCES public.cm_clients(id) ON DELETE SET NULL,
    type        TEXT NOT NULL,
    subject     TEXT,
    content     TEXT,
    statut      TEXT DEFAULT 'brouillon',
    tone        TEXT DEFAULT 'professionnel',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cm_content_generated_type   ON public.cm_content_generated(type);
CREATE INDEX IF NOT EXISTS idx_cm_content_generated_statut ON public.cm_content_generated(statut);
CREATE INDEX IF NOT EXISTS idx_cm_content_generated_date   ON public.cm_content_generated(created_at);

ALTER TABLE public.cm_content_generated ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cm_content_admin_all ON public.cm_content_generated;
CREATE POLICY cm_content_admin_all ON public.cm_content_generated
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin', 'super_admin')
              AND is_active = true
        )
    );

-- --------------------------------------------------------------
-- TABLE: cm_ai_strategies (plan IA semaine par semaine)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cm_ai_strategies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semaine             INTEGER NOT NULL,
    annee               INTEGER NOT NULL,
    objectif            TEXT,
    cibles              JSONB,
    themes              JSONB,
    kpis                JSONB,
    strategie_complete  TEXT,
    statut              TEXT DEFAULT 'planifié',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(semaine, annee)
);

CREATE INDEX IF NOT EXISTS idx_cm_ai_strategies_semaine ON public.cm_ai_strategies(semaine, annee);
CREATE INDEX IF NOT EXISTS idx_cm_ai_strategies_statut  ON public.cm_ai_strategies(statut);

ALTER TABLE public.cm_ai_strategies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cm_ai_strategies_admin_all ON public.cm_ai_strategies;
CREATE POLICY cm_ai_strategies_admin_all ON public.cm_ai_strategies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin', 'super_admin')
              AND is_active = true
        )
    );

-- --------------------------------------------------------------
-- TABLE: cm_ai_actions (actions proposées / archivées)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cm_ai_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id         UUID REFERENCES public.cm_ai_strategies(id) ON DELETE SET NULL,
    type                TEXT,
    titre               TEXT,
    description         TEXT,
    statut              TEXT DEFAULT 'propose',
    priorite            TEXT DEFAULT 'moyenne',
    date_publication    TIMESTAMPTZ,
    plateforme_publie   TEXT,
    url_publication     TEXT,
    metriques           JSONB,
    archive             BOOLEAN DEFAULT false,
    notes_performance   TEXT,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cm_ai_actions_strategy ON public.cm_ai_actions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_cm_ai_actions_statut   ON public.cm_ai_actions(statut);
CREATE INDEX IF NOT EXISTS idx_cm_ai_actions_archive  ON public.cm_ai_actions(archive);

ALTER TABLE public.cm_ai_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cm_ai_actions_admin_all ON public.cm_ai_actions;
CREATE POLICY cm_ai_actions_admin_all ON public.cm_ai_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin', 'super_admin')
              AND is_active = true
        )
    );

-- --------------------------------------------------------------
-- TABLE: cm_support_solutions
-- --------------------------------------------------------------
CREATE TABLE public.cm_support_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie TEXT NOT NULL,
    titre TEXT NOT NULL,
    description TEXT,
    solution TEXT NOT NULL,
    mots_cles TEXT[],
    erreur_texte TEXT,
    erreur_stack TEXT,
    contexte TEXT,
    plan_detaille JSONB,
    reussite_count INTEGER DEFAULT 0,
    echec_count INTEGER DEFAULT 0,
    score_pertinence NUMERIC(3,2),
    efficacite_score NUMERIC(3,2) DEFAULT 0,
    nb_utilisations  INTEGER DEFAULT 0,
    valide_par TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_support_solutions_categorie ON public.cm_support_solutions(categorie);
CREATE INDEX idx_cm_support_solutions_mots_cles ON public.cm_support_solutions USING GIN(mots_cles);
CREATE INDEX idx_cm_support_solutions_score ON public.cm_support_solutions(score_pertinence);

-- --------------------------------------------------------------
-- TABLE: cm_support_diagnostics
-- --------------------------------------------------------------
CREATE TABLE public.cm_support_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.cm_support_tickets(id),
    client_id UUID REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    symptomes TEXT NOT NULL,
    contexte JSONB,
    solution_proposee_id UUID REFERENCES public.cm_support_solutions(id),
    status TEXT DEFAULT 'propose',
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_diagnostics_ticket ON public.cm_support_diagnostics(ticket_id);
CREATE INDEX idx_cm_diagnostics_client ON public.cm_support_diagnostics(client_id);
CREATE INDEX idx_cm_diagnostics_solution ON public.cm_support_diagnostics(solution_proposee_id);

-- --------------------------------------------------------------
-- TABLE: cm_website_pages
-- --------------------------------------------------------------
CREATE TABLE public.cm_website_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    og_image TEXT,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_website_pages_slug ON public.cm_website_pages(slug);
CREATE INDEX idx_cm_website_pages_status ON public.cm_website_pages(status);

-- ================================================================
-- 📋 GROUPE 7: SUPPORT & MONITORING (5 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: error_logs
-- --------------------------------------------------------------
CREATE TABLE public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_type TEXT,
    url TEXT,
    user_agent TEXT,
    browser TEXT,
    os TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    severity TEXT DEFAULT 'medium',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX idx_error_logs_user ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp);
CREATE INDEX idx_error_logs_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);

-- --------------------------------------------------------------
-- TABLE: error_corrections
-- --------------------------------------------------------------
CREATE TABLE public.error_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_pattern TEXT NOT NULL,
    solution TEXT NOT NULL,
    guide_url TEXT,
    priority INTEGER,
    is_active BOOLEAN DEFAULT true,
    occurrences_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_error_corrections_pattern ON public.error_corrections(error_pattern);
CREATE INDEX idx_error_corrections_active ON public.error_corrections(is_active);

-- --------------------------------------------------------------
-- TABLE: notifications
-- --------------------------------------------------------------
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at);

-- --------------------------------------------------------------
-- TABLE: notification_preferences
-- --------------------------------------------------------------
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    email_address TEXT,
    email_frequency TEXT DEFAULT 'immediate',
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    notify_demandes BOOLEAN DEFAULT true,
    notify_reservations BOOLEAN DEFAULT true,
    notify_taches BOOLEAN DEFAULT true,
    notify_commandes BOOLEAN DEFAULT true,
    notification_types JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_notif_prefs_user ON public.notification_preferences(user_id);

-- Vue de compatibilité : user_notification_preferences
DROP VIEW IF EXISTS public.user_notification_preferences;
CREATE VIEW public.user_notification_preferences AS
SELECT
    id, user_id, email_enabled, email_address,
    notify_demandes, notify_reservations, notify_taches, notify_commandes,
    email_frequency, push_enabled, sms_enabled, notification_types, updated_at
FROM public.notification_preferences;

-- --------------------------------------------------------------
-- TABLE: auto_ticket_diagnostics
-- --------------------------------------------------------------
CREATE TABLE public.auto_ticket_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    error_log_id UUID REFERENCES public.error_logs(id),
    ticket_id UUID REFERENCES public.cm_support_tickets(id),
    severity TEXT,
    auto_created BOOLEAN DEFAULT true,
    diagnostic_data JSONB,
    recommended_solution TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_auto_ticket_user ON public.auto_ticket_diagnostics(user_id);
CREATE INDEX idx_auto_ticket_error_log ON public.auto_ticket_diagnostics(error_log_id);
CREATE INDEX idx_auto_ticket_ticket ON public.auto_ticket_diagnostics(ticket_id);

-- ================================================================
-- 📋 GROUPE 8: DIVERS (5 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: shopping_lists
-- --------------------------------------------------------------
CREATE TABLE public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES public.gites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shopping_lists_owner ON public.shopping_lists(owner_user_id);
CREATE INDEX idx_shopping_lists_gite ON public.shopping_lists(gite_id);

-- --------------------------------------------------------------
-- TABLE: shopping_list_items
-- --------------------------------------------------------------
CREATE TABLE public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit TEXT,
    category TEXT,
    is_checked BOOLEAN DEFAULT false,
    price NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shopping_items_list ON public.shopping_list_items(list_id);
CREATE INDEX idx_shopping_items_category ON public.shopping_list_items(category);
CREATE INDEX idx_shopping_items_checked ON public.shopping_list_items(is_checked);

-- --------------------------------------------------------------
-- TABLE: user_roles
-- --------------------------------------------------------------
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- --------------------------------------------------------------
-- TABLE: historique_donnees
-- --------------------------------------------------------------
CREATE TABLE public.historique_donnees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    donnees_mensuelles JSONB,
    ca_total NUMERIC(12,2),
    nb_reservations INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_user_id, annee)
);

CREATE INDEX idx_historique_owner ON public.historique_donnees(owner_user_id);
CREATE INDEX idx_historique_annee ON public.historique_donnees(annee);

-- --------------------------------------------------------------
-- TABLE: sync_logs
-- --------------------------------------------------------------
CREATE TABLE public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES public.gites(id) ON DELETE CASCADE,
    platform TEXT,
    status TEXT,
    added INTEGER DEFAULT 0,
    updated INTEGER DEFAULT 0,
    cancelled INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sync_logs_owner ON public.sync_logs(owner_user_id);
CREATE INDEX idx_sync_logs_gite ON public.sync_logs(gite_id);
CREATE INDEX idx_sync_logs_date ON public.sync_logs(synced_at);

-- ================================================================
-- 🔧 TRIGGERS & FUNCTIONS
-- ================================================================

-- Fonction: Calculer restant automatiquement
CREATE OR REPLACE FUNCTION trigger_calculate_restant()
RETURNS TRIGGER AS $$
BEGIN
    NEW.restant := COALESCE(NEW.montant, NEW.total_price, 0) - COALESCE(NEW.acompte, NEW.paid_amount, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_restant_reservations
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_restant();

-- Fonction: Sync nom gîte dans réservation
CREATE OR REPLACE FUNCTION trigger_sync_gite_name()
RETURNS TRIGGER AS $$
BEGIN
    SELECT name INTO NEW.gite FROM public.gites WHERE id = NEW.gite_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_gite_name_reservations
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_gite_name();

-- Fonction: Sync alias réservations
CREATE OR REPLACE FUNCTION trigger_sync_aliases_reservations()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync alias
    NEW.nb_personnes := COALESCE(NEW.guest_count, NEW.nb_personnes);
    NEW.plateforme := COALESCE(NEW.platform, NEW.plateforme);
    NEW.montant := COALESCE(NEW.total_price, NEW.montant);
    NEW.acompte := COALESCE(NEW.paid_amount, NEW.acompte);
    NEW.telephone := COALESCE(NEW.client_phone, NEW.telephone);
    NEW.provenance := COALESCE(NEW.client_address, NEW.provenance);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_aliases_reservations_before
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_aliases_reservations();

-- Fonction: Update uses_count promotions
CREATE OR REPLACE FUNCTION trigger_update_promo_uses()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.cm_promotions
    SET uses_count = uses_count + 1
    WHERE id = NEW.promotion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promo_uses_after_insert
    AFTER INSERT ON public.cm_promo_usage
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_promo_uses();

-- ================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infos_gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites_gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retours_menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problemes_signales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.km_trajets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.km_config_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.km_lieux_favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linen_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linen_stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linen_stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historique_donnees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Policies Standards (SELECT, INSERT, UPDATE, DELETE)
-- Appliquées à toutes les tables avec owner_user_id

DO $$
DECLARE
    tbl TEXT;
    has_owner_col BOOLEAN;
    has_user_col BOOLEAN;
    access_predicate TEXT;
    tables_with_owner TEXT[] := ARRAY[
        'gites', 'reservations', 'infos_gites', 'checklist_templates', 
        'checklist_progress', 'faq', 'client_access_tokens', 'activites_gites',
        'cleaning_schedule', 'retours_menage', 'problemes_signales',
        'simulations_fiscales', 'km_trajets', 'km_config_auto', 'km_lieux_favoris',
        'linen_stocks', 'linen_stock_items', 'linen_stock_transactions',
        'shopping_lists', 'user_roles', 'historique_donnees', 'sync_logs',
        'notifications', 'notification_preferences', 'error_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_with_owner
    LOOP
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = tbl
              AND column_name = 'owner_user_id'
        ) INTO has_owner_col;

        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = tbl
              AND column_name = 'user_id'
        ) INTO has_user_col;

        IF has_owner_col AND has_user_col THEN
            access_predicate := '(auth.uid() = owner_user_id OR auth.uid() = user_id)';
        ELSIF has_owner_col THEN
            access_predicate := '(auth.uid() = owner_user_id)';
        ELSIF has_user_col THEN
            access_predicate := '(auth.uid() = user_id)';
        ELSE
            RAISE NOTICE 'Skip policies for %.%: no owner_user_id/user_id column', 'public', tbl;
            CONTINUE;
        END IF;

        -- SELECT
        EXECUTE format('
            CREATE POLICY "Users can view own %I"
            ON public.%I FOR SELECT
            USING %s;
        ', tbl, tbl, access_predicate);
        
        -- INSERT
        EXECUTE format('
            CREATE POLICY "Users can insert own %I"
            ON public.%I FOR INSERT
            WITH CHECK %s;
        ', tbl, tbl, access_predicate);
        
        -- UPDATE
        EXECUTE format('
            CREATE POLICY "Users can update own %I"
            ON public.%I FOR UPDATE
            USING %s;
        ', tbl, tbl, access_predicate);
        
        -- DELETE
        EXECUTE format('
            CREATE POLICY "Users can delete own %I"
            ON public.%I FOR DELETE
            USING %s;
        ', tbl, tbl, access_predicate);
    END LOOP;
END $$;

-- Policies spéciales pour shopping_list_items
CREATE POLICY "Users can view shopping items"
ON public.shopping_list_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.shopping_lists
        WHERE id = shopping_list_items.list_id
        AND owner_user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage shopping items"
ON public.shopping_list_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.shopping_lists
        WHERE id = shopping_list_items.list_id
        AND owner_user_id = auth.uid()
    )
);

-- ================================================================
-- � TABLES SUPPORT / PARRAINAGE
-- ================================================================

-- --------------------------------------------------------------
-- TABLE: user_settings (config utilisateur + parrainage)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
    id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type       TEXT,
    draps_alert_weekday     INTEGER DEFAULT NULL,
    draps_alert_days_before INTEGER DEFAULT 3,
    fiscalite_options_perso BOOLEAN DEFAULT false,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_owner_all" ON public.user_settings;
CREATE POLICY "user_settings_owner_all" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);

-- --------------------------------------------------------------
-- TABLE: referrals (parrainage utilisateurs)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code       TEXT,
    status              TEXT DEFAULT 'pending',
    is_currently_paying BOOLEAN DEFAULT false,
    bonus_rate_pct      NUMERIC(5,2) DEFAULT 5,
    registered_at       TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status   ON public.referrals(status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_owner_select ON public.referrals;
CREATE POLICY referrals_owner_select ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);

-- --------------------------------------------------------------
-- TABLE: referral_campaigns (campagnes de parrainage admin)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_campaigns (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 TEXT NOT NULL,
    campaign_code        TEXT UNIQUE NOT NULL,
    description          TEXT,
    bonus_type           TEXT NOT NULL,
    discount_pct_bonus   NUMERIC(5,2),
    discount_fixed_bonus NUMERIC(5,2),
    points_multiplier    NUMERIC(5,2),
    points_fixed_bonus   INTEGER,
    start_date           TIMESTAMPTZ NOT NULL,
    end_date             TIMESTAMPTZ NOT NULL,
    is_active            BOOLEAN DEFAULT true,
    max_uses             INTEGER,
    current_uses         INTEGER DEFAULT 0,
    min_referrals        INTEGER DEFAULT 0,
    subscription_types   TEXT[],
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active ON public.referral_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_dates  ON public.referral_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_code   ON public.referral_campaigns(campaign_code);

ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_campaigns_admin_all ON public.referral_campaigns;
CREATE POLICY referral_campaigns_admin_all ON public.referral_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin', 'super_admin')
              AND is_active = true
        )
    );

-- --------------------------------------------------------------
-- TABLE: user_campaign_participations (participants aux campagnes)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_campaign_participations (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id               UUID NOT NULL REFERENCES public.referral_campaigns(id) ON DELETE CASCADE,
    user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referrals_during_campaign INTEGER DEFAULT 0,
    total_bonus_earned        NUMERIC(10,2) DEFAULT 0,
    enrolled_at               TIMESTAMPTZ DEFAULT now(),
    created_at                TIMESTAMPTZ DEFAULT now(),
    UNIQUE(campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ucp_campaign ON public.user_campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ucp_user     ON public.user_campaign_participations(user_id);

ALTER TABLE public.user_campaign_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ucp_owner_select ON public.user_campaign_participations;
CREATE POLICY ucp_owner_select ON public.user_campaign_participations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS ucp_admin_all ON public.user_campaign_participations;
CREATE POLICY ucp_admin_all ON public.user_campaign_participations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin', 'super_admin')
              AND is_active = true
        )
    );

-- ================================================================
-- 📊 VUES UTILES (Optionnel)
-- ================================================================

-- Vue: Réservations avec détails gîte
CREATE OR REPLACE VIEW reservations_details AS
SELECT 
    r.*,
    g.name as gite_name,
    g.color as gite_color,
    g.icon as gite_icon,
    g.address as gite_address
FROM public.reservations r
LEFT JOIN public.gites g ON r.gite_id = g.id;

-- Vue: Stats par gîte
CREATE OR REPLACE VIEW stats_par_gite AS
SELECT 
    g.id,
    g.name,
    g.owner_user_id,
    COUNT(r.id) as nb_reservations,
    SUM(r.total_price) as ca_total,
    AVG(r.total_price) as prix_moyen
FROM public.gites g
LEFT JOIN public.reservations r ON g.id = r.gite_id
    AND r.status = 'confirmed'
GROUP BY g.id, g.name, g.owner_user_id;

-- ================================================================
-- ✅ VALIDATION FINALE
-- ================================================================

-- ==============================================================================
-- RPCs FICHE CLIENT (SECURITY DEFINER) — 17 mars 2026
-- Contournement Kong qui ne transmet pas les headers custom à PostgREST
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_reservation_by_client_token(p_token text)
RETURNS SETOF public.reservations LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT r.* FROM public.reservations r
    INNER JOIN public.client_access_tokens cat ON cat.reservation_id = r.id
    WHERE cat.token = p_token AND cat.is_active = true AND cat.expires_at > now() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_reservation_by_client_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reservation_by_client_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_client_token_data(p_token text)
RETURNS TABLE (token_id uuid, reservation_id uuid, owner_user_id uuid, expires_at timestamptz, is_active boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT cat.id, cat.reservation_id, cat.owner_user_id, cat.expires_at, cat.is_active
    FROM public.client_access_tokens cat
    WHERE cat.token = p_token AND cat.is_active = true AND cat.expires_at > now() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_client_token_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_token_data(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_gite_info_by_client_token(p_token text)
RETURNS SETOF public.infos_gites LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
    SELECT ig.* FROM public.infos_gites ig
    INNER JOIN public.reservations r ON lower(ig.gite) = lower(r.gite)
    INNER JOIN public.client_access_tokens cat ON cat.reservation_id = r.id
    WHERE cat.token = p_token AND cat.is_active = true AND cat.expires_at > now() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_gite_info_by_client_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gite_info_by_client_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.upsert_demande_horaire_by_token(
    p_token text, p_type text, p_heure text, p_motif text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_reservation_id uuid; v_owner_user_id uuid; v_existing_id uuid; v_result_id uuid;
BEGIN
    SELECT cat.reservation_id, cat.owner_user_id INTO v_reservation_id, v_owner_user_id
    FROM public.client_access_tokens cat
    WHERE cat.token = p_token AND cat.is_active = true AND cat.expires_at > now() LIMIT 1;
    IF v_reservation_id IS NULL THEN RAISE EXCEPTION 'Token invalide ou expiré'; END IF;
    SELECT id INTO v_existing_id FROM public.demandes_horaires
    WHERE reservation_id = v_reservation_id AND type = p_type AND statut = 'en_attente' LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
        UPDATE public.demandes_horaires SET heure_demandee = p_heure, motif = p_motif, updated_at = now() WHERE id = v_existing_id;
        RETURN v_existing_id;
    ELSE
        INSERT INTO public.demandes_horaires (owner_user_id, reservation_id, type, heure_demandee, motif, statut)
        VALUES (v_owner_user_id, v_reservation_id, p_type, p_heure, p_motif, 'en_attente') RETURNING id INTO v_result_id;
        RETURN v_result_id;
    END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_demande_horaire_by_token(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_demande_horaire_by_token(text,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.upsert_checklist_progress_by_token(
    p_token text, p_template_id uuid, p_completed boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reservation_id uuid;
BEGIN
    SELECT cat.reservation_id INTO v_reservation_id FROM public.client_access_tokens cat
    WHERE cat.token = p_token AND cat.is_active = true AND cat.expires_at > now() LIMIT 1;
    IF v_reservation_id IS NULL THEN RAISE EXCEPTION 'Token invalide ou expiré'; END IF;
    INSERT INTO public.checklist_progress (reservation_id, template_id, completed, completed_at)
    VALUES (v_reservation_id, p_template_id, p_completed, CASE WHEN p_completed THEN now() ELSE NULL END)
    ON CONFLICT (reservation_id, template_id) DO UPDATE SET
        completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at, updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_checklist_progress_by_token(text,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_checklist_progress_by_token(text,uuid,boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.insert_retour_client_by_token(
    p_token text, p_type text, p_sujet text, p_description text, p_urgence text DEFAULT 'normale'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reservation_id uuid;
BEGIN
    SELECT cat.reservation_id INTO v_reservation_id FROM public.client_access_tokens cat
    WHERE cat.token = p_token AND cat.is_active = true AND cat.expires_at > now() LIMIT 1;
    IF v_reservation_id IS NULL THEN RAISE EXCEPTION 'Token invalide ou expiré'; END IF;
    INSERT INTO public.retours_clients (reservation_id, type, sujet, description, urgence)
    VALUES (v_reservation_id, p_type, p_sujet, p_description, p_urgence);
END;
$$;
REVOKE ALL ON FUNCTION public.insert_retour_client_by_token(text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_retour_client_by_token(text,text,text,text,text) TO anon, authenticated;

-- Policies anon READ pour les tables de contenu fiche client
DO $$
BEGIN
    DROP POLICY IF EXISTS anon_read_infos_gites ON public.infos_gites;
    CREATE POLICY anon_read_infos_gites ON public.infos_gites FOR SELECT TO anon USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$
BEGIN
    DROP POLICY IF EXISTS anon_read_activites_gites ON public.activites_gites;
    CREATE POLICY anon_read_activites_gites ON public.activites_gites FOR SELECT TO anon USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$
BEGIN
    DROP POLICY IF EXISTS anon_read_faq ON public.faq;
    CREATE POLICY anon_read_faq ON public.faq FOR SELECT TO anon USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$
BEGIN
    DROP POLICY IF EXISTS anon_read_cleaning_schedule_client ON public.cleaning_schedule;
    CREATE POLICY anon_read_cleaning_schedule_client ON public.cleaning_schedule FOR SELECT TO anon USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$
BEGIN
    DROP POLICY IF EXISTS anon_read_checklist_templates ON public.checklist_templates;
    CREATE POLICY anon_read_checklist_templates ON public.checklist_templates FOR SELECT TO anon USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$
BEGIN
    DROP POLICY IF EXISTS anon_read_checklist_progress ON public.checklist_progress;
    CREATE POLICY anon_read_checklist_progress ON public.checklist_progress FOR SELECT TO anon USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$
BEGIN
    DROP POLICY IF EXISTS anon_read_demandes_horaires_client ON public.demandes_horaires;
    CREATE POLICY anon_read_demandes_horaires_client ON public.demandes_horaires FOR SELECT TO anon USING (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ================================================================
-- ✅ VALIDATION FINALE
-- ================================================================

-- Vérifier que toutes les tables sont créées
DO $$
DECLARE
    -- Baseline actuelle de cette phase (avant modules additionnels du rebuild orchestrateur)
    expected_tables INTEGER := 49;
    actual_tables INTEGER;
BEGIN
    SELECT COUNT(*) INTO actual_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    IF actual_tables < expected_tables THEN
        RAISE EXCEPTION 'Erreur: Seulement % tables créées sur % attendues', actual_tables, expected_tables;
    ELSE
        RAISE NOTICE '✅ SUCCESS: % tables créées avec succès', actual_tables;
    END IF;
END $$;

COMMIT;

-- ================================================================
-- 🎉 RECONSTRUCTION COMPLÈTE TERMINÉE
-- ================================================================
-- Base de données LiveOwnerUnit v5.0 reconstituée
-- 49 tables créées dans ce lot (le rebuild orchestrateur ajoute les modules restants)
-- Indexes, Triggers, Functions, RLS activés
-- Durée estimée: ~30 secondes
-- ================================================================
