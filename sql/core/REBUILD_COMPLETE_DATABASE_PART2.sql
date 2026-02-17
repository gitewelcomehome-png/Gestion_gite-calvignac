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
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    company_name TEXT,
    phone TEXT,
    address TEXT,
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

-- --------------------------------------------------------------
-- TABLE: cm_subscriptions
-- --------------------------------------------------------------
CREATE TABLE public.cm_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.cm_pricing_plans(id),
    status TEXT DEFAULT 'active',
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
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'draft',
    issued_date DATE,
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

-- --------------------------------------------------------------
-- TABLE: cm_promotions
-- --------------------------------------------------------------
CREATE TABLE public.cm_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    description TEXT,
    type TEXT,
    value NUMERIC(10,2),
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    applicable_plans JSONB,
    is_active BOOLEAN DEFAULT true,
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
    client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.cm_subscriptions(id),
    discount_amount NUMERIC(10,2),
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
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'open',
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
    author_email TEXT NOT NULL,
    author_role TEXT,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
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
    source TEXT,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    client_id UUID REFERENCES public.cm_clients(id),
    subscription_id UUID REFERENCES public.cm_subscriptions(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_revenue_date ON public.cm_revenue_tracking(date);
CREATE INDEX idx_cm_revenue_source ON public.cm_revenue_tracking(source);
CREATE INDEX idx_cm_revenue_client ON public.cm_revenue_tracking(client_id);

-- --------------------------------------------------------------
-- TABLE: cm_ai_content_queue
-- --------------------------------------------------------------
CREATE TABLE public.cm_ai_content_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.cm_clients(id) ON DELETE CASCADE,
    content_type TEXT,
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
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    notification_types JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_notif_prefs_user ON public.notification_preferences(user_id);

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
        -- SELECT
        EXECUTE format('
            CREATE POLICY "Users can view own %I"
            ON public.%I FOR SELECT
            USING (auth.uid() = owner_user_id OR auth.uid() = user_id);
        ', tbl, tbl);
        
        -- INSERT
        EXECUTE format('
            CREATE POLICY "Users can insert own %I"
            ON public.%I FOR INSERT
            WITH CHECK (auth.uid() = owner_user_id OR auth.uid() = user_id);
        ', tbl, tbl);
        
        -- UPDATE
        EXECUTE format('
            CREATE POLICY "Users can update own %I"
            ON public.%I FOR UPDATE
            USING (auth.uid() = owner_user_id OR auth.uid() = user_id);
        ', tbl, tbl);
        
        -- DELETE
        EXECUTE format('
            CREATE POLICY "Users can delete own %I"
            ON public.%I FOR DELETE
            USING (auth.uid() = owner_user_id OR auth.uid() = user_id);
        ', tbl, tbl);
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

-- Vérifier que toutes les tables sont créées
DO $$
DECLARE
    expected_tables INTEGER := 52;
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
-- 52 tables production créées
-- Indexes, Triggers, Functions, RLS activés
-- Durée estimée: ~30 secondes
-- ================================================================
