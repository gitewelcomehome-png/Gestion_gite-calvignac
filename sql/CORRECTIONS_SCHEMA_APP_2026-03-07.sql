-- ====================================================================
-- CORRECTIONS SCHEMA APP - 2026-03-07
-- ====================================================================
-- Objectif : Aligner le schéma de la nouvelle instance Supabase
--            avec les tables/colonnes attendues par le code JS
-- À exécuter : dans l'éditeur SQL de Supabase
-- ✅ SAFE TO RE-RUN : toutes les instructions sont idempotentes
-- ====================================================================
-- ORDRE D'EXÉCUTION :
--   1. ALTER TABLE (colonnes manquantes) → AVANT les vues
--   2. CREATE VIEW (après que les colonnes existent)
--   3. CREATE TABLE user_subscriptions
--   4. CREATE TABLE IF NOT EXISTS (tables manquantes)
--   5. FUNCTION stub
--   6. Vérification
-- ====================================================================

-- ============================================================
-- 1. COLONNES MANQUANTES dans tables existantes
--    (DOIT être AVANT les CREATE VIEW qui y font référence)
-- ============================================================

-- 1a. notification_preferences : colonnes attendues par notification-system.js
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'notification_preferences') THEN
        ALTER TABLE public.notification_preferences
            ADD COLUMN IF NOT EXISTS email_address TEXT DEFAULT NULL;
        ALTER TABLE public.notification_preferences
            ADD COLUMN IF NOT EXISTS notify_demandes BOOLEAN DEFAULT true;
        ALTER TABLE public.notification_preferences
            ADD COLUMN IF NOT EXISTS notify_reservations BOOLEAN DEFAULT true;
        ALTER TABLE public.notification_preferences
            ADD COLUMN IF NOT EXISTS notify_taches BOOLEAN DEFAULT true;
        ALTER TABLE public.notification_preferences
            ADD COLUMN IF NOT EXISTS email_frequency TEXT DEFAULT 'immediate';
    END IF;
END $$;

-- 1b. notifications : colonnes utilisées par la vue admin_communications
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        ALTER TABLE public.notifications
            ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;
        ALTER TABLE public.notifications
            ADD COLUMN IF NOT EXISTS titre TEXT DEFAULT NULL;
        ALTER TABLE public.notifications
            ADD COLUMN IF NOT EXISTS contenu TEXT DEFAULT NULL;
    END IF;
END $$;

-- 1c. cleaning_schedule : colonnes attendues par le code JS
--     La table REBUILD a 'date' mais le code attend 'scheduled_date'
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'cleaning_schedule') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'cleaning_schedule'
              AND column_name = 'scheduled_date'
        ) THEN
            ALTER TABLE public.cleaning_schedule
                ADD COLUMN scheduled_date DATE GENERATED ALWAYS AS (date) STORED;
        END IF;
        ALTER TABLE public.cleaning_schedule
            ADD COLUMN IF NOT EXISTS proposed_by TEXT DEFAULT NULL;
        ALTER TABLE public.cleaning_schedule
            ADD COLUMN IF NOT EXISTS reservation_end DATE DEFAULT NULL;
        ALTER TABLE public.cleaning_schedule
            ADD COLUMN IF NOT EXISTS reservation_start_after DATE DEFAULT NULL;
        ALTER TABLE public.cleaning_schedule
            ADD COLUMN IF NOT EXISTS validated_by_company BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 1d. retours_menage : colonnes manquantes
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'retours_menage') THEN
        ALTER TABLE public.retours_menage
            ADD COLUMN IF NOT EXISTS date_menage DATE DEFAULT NULL;
        ALTER TABLE public.retours_menage
            ADD COLUMN IF NOT EXISTS owner_user_id UUID DEFAULT NULL;
        ALTER TABLE public.retours_menage
            ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT false;
        ALTER TABLE public.retours_menage
            ADD COLUMN IF NOT EXISTS commentaires TEXT DEFAULT NULL;
    END IF;
END $$;

-- 1e. cm_support_tickets.priorite (alias de priority pour compatibilité frontend)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'cm_support_tickets') THEN
        ALTER TABLE public.cm_support_tickets
            ADD COLUMN IF NOT EXISTS priorite TEXT DEFAULT NULL;
        UPDATE public.cm_support_tickets
            SET priorite = priority
            WHERE priorite IS NULL AND priority IS NOT NULL;
    END IF;
END $$;

-- 1f. linen_needs.item_label (si la table existe déjà sans cette colonne)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'linen_needs') THEN
        ALTER TABLE public.linen_needs
            ADD COLUMN IF NOT EXISTS item_label TEXT DEFAULT NULL;
    END IF;
END $$;

-- 1g. gites : colonnes manquantes
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'gites') THEN
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS regles_tarifs JSONB DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
        -- Colonnes adresse détaillée (attendues par gites-crud.js)
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS city TEXT DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS postal_code TEXT DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'France';
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS department TEXT DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS region TEXT DEFAULT NULL;
        -- Caractéristiques du logement
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS surface_m2 NUMERIC(7,2) DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS beds INTEGER DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS type_hebergement TEXT DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS label_classement TEXT DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS situation TEXT DEFAULT NULL;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS cuisine_niveau TEXT DEFAULT NULL;
        -- Tarifs de base
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS price_per_night NUMERIC(10,2) DEFAULT NULL;
        -- Équipements et accessibilité
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS animaux_acceptes BOOLEAN DEFAULT false;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS access_pmr BOOLEAN DEFAULT false;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS parking BOOLEAN DEFAULT false;
        -- Plateformes de diffusion
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS platform_airbnb BOOLEAN DEFAULT false;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS platform_booking BOOLEAN DEFAULT false;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS platform_abritel BOOLEAN DEFAULT false;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS platform_gdf BOOLEAN DEFAULT false;
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS platform_direct BOOLEAN DEFAULT false;
        -- ical_urls : alias de ical_sources (attendu par gites-crud.js)
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS ical_urls JSONB DEFAULT '[]'::jsonb;
        -- Règles tarifaires
        ALTER TABLE public.gites
            ADD COLUMN IF NOT EXISTS regles_tarifs JSONB DEFAULT NULL;
    END IF;
END $$;

-- ============================================================
-- 2. VUES ALIAS
--    (colonnes nécessaires existent maintenant grâce à la section 1)
-- ============================================================

-- 2a. user_notification_preferences → notification_preferences
DROP VIEW IF EXISTS public.user_notification_preferences;
CREATE VIEW public.user_notification_preferences AS
SELECT
    id,
    user_id,
    email_enabled,
    email_address,
    notify_demandes,
    notify_reservations,
    notify_taches,
    notify_commandes,
    email_frequency,
    push_enabled,
    sms_enabled,
    notification_types,
    updated_at
FROM public.notification_preferences;

-- 2b. admin_communications → notifications
DROP VIEW IF EXISTS public.admin_communications;
CREATE VIEW public.admin_communications AS
SELECT
    id,
    titre AS title,
    contenu AS message,
    type,
    created_at,
    created_at AS date_debut,
    expires_at AS date_fin,
    metadata
FROM public.notifications;

-- 2c. subscriptions_plans → cm_pricing_plans (seulement si la table existe)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'cm_pricing_plans') THEN
        DROP VIEW IF EXISTS public.subscriptions_plans;
        CREATE VIEW public.subscriptions_plans AS
        SELECT * FROM public.cm_pricing_plans;
    END IF;
END $$;

-- ============================================================
-- 3. TABLE user_subscriptions
--    (liaison auth.users car cm_subscriptions ne lie pas auth.users)
-- ============================================================

-- Supprimer l'objet existant quel que soit son type (vue ou table)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views
               WHERE table_schema = 'public' AND table_name = 'user_subscriptions') THEN
        DROP VIEW public.user_subscriptions;
    END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID DEFAULT NULL,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- FK plan_id → cm_pricing_plans conditionnelle
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'cm_pricing_plans') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_schema = 'public'
              AND table_name = 'user_subscriptions'
              AND constraint_name = 'user_subscriptions_plan_id_fkey'
        ) THEN
            ALTER TABLE public.user_subscriptions
                ADD CONSTRAINT user_subscriptions_plan_id_fkey
                FOREIGN KEY (plan_id) REFERENCES public.cm_pricing_plans(id);
        END IF;
    END IF;
END $$;

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_subscriptions_owner_all" ON public.user_subscriptions;
CREATE POLICY "user_subscriptions_owner_all" ON public.user_subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user
    ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
    ON public.user_subscriptions(status);

-- ============================================================
-- 4. TABLES MANQUANTES
-- ============================================================

-- todos (Kanban)
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES public.gites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'todo',
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_owner_all" ON public.todos;
CREATE POLICY "todos_owner_all" ON public.todos
    FOR ALL
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_todos_owner ON public.todos(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_todos_gite ON public.todos(gite_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON public.todos(status, completed);

-- commandes_prestations
CREATE TABLE IF NOT EXISTS public.commandes_prestations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES public.gites(id),
    numero_commande TEXT,
    montant_prestations DECIMAL(10,2) DEFAULT 0,
    montant_commission DECIMAL(10,2) DEFAULT 0,
    montant_net_owner DECIMAL(10,2) DEFAULT 0,
    statut TEXT DEFAULT 'pending',
    notes_client TEXT,
    notes_owner TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.commandes_prestations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commandes_prestations_owner_all" ON public.commandes_prestations;
CREATE POLICY "commandes_prestations_owner_all" ON public.commandes_prestations
    FOR ALL
    USING (
        reservation_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.reservations r
            JOIN public.gites g ON g.id = r.gite_id
            WHERE r.id = commandes_prestations.reservation_id
              AND g.owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        reservation_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.reservations r
            JOIN public.gites g ON g.id = r.gite_id
            WHERE r.id = commandes_prestations.reservation_id
              AND g.owner_user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_commandes_prestations_resa
    ON public.commandes_prestations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_commandes_prestations_gite
    ON public.commandes_prestations(gite_id);
CREATE INDEX IF NOT EXISTS idx_commandes_prestations_statut
    ON public.commandes_prestations(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_prestations_created
    ON public.commandes_prestations(created_at DESC);

-- lignes_commande_prestations
CREATE TABLE IF NOT EXISTS public.lignes_commande_prestations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    commande_id UUID REFERENCES public.commandes_prestations(id) ON DELETE CASCADE,
    nom_prestation TEXT NOT NULL,
    quantite INTEGER DEFAULT 1,
    prix_unitaire DECIMAL(10,2) DEFAULT 0,
    prix_total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lignes_commande_prestations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lignes_commande_owner_all" ON public.lignes_commande_prestations;
CREATE POLICY "lignes_commande_owner_all" ON public.lignes_commande_prestations
    FOR ALL
    USING (
        commande_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.commandes_prestations cp
            JOIN public.reservations r ON r.id = cp.reservation_id
            JOIN public.gites g ON g.id = r.gite_id
            WHERE cp.id = lignes_commande_prestations.commande_id
              AND g.owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        commande_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.commandes_prestations cp
            JOIN public.reservations r ON r.id = cp.reservation_id
            JOIN public.gites g ON g.id = r.gite_id
            WHERE cp.id = lignes_commande_prestations.commande_id
              AND g.owner_user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_lignes_commande_prestations_commande
    ON public.lignes_commande_prestations(commande_id);

-- linen_needs (besoins en linge par gîte)
CREATE TABLE IF NOT EXISTS public.linen_needs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    item_label TEXT,
    quantity INTEGER DEFAULT 0,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, gite_id, item_key)
);

ALTER TABLE public.linen_needs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "linen_needs_owner_all" ON public.linen_needs;
CREATE POLICY "linen_needs_owner_all" ON public.linen_needs
    FOR ALL
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_linen_needs_owner ON public.linen_needs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_linen_needs_gite ON public.linen_needs(gite_id);

-- user_settings (config utilisateur)
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    draps_alert_weekday INTEGER DEFAULT NULL,
    draps_alert_days_before INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_owner_all" ON public.user_settings;
CREATE POLICY "user_settings_owner_all" ON public.user_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);

-- fiscalite_amortissements (lignes d'amortissement pluriannuelles)
CREATE TABLE IF NOT EXISTS public.fiscalite_amortissements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    type TEXT NOT NULL,                    -- 'travaux' | 'frais'
    description TEXT,
    gite TEXT,
    montant NUMERIC(12,2) DEFAULT 0,
    amortissement_origine JSONB,          -- {annee_origine, duree, montant_total}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fiscalite_amortissements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fiscalite_amortissements_owner_all" ON public.fiscalite_amortissements;
CREATE POLICY "fiscalite_amortissements_owner_all" ON public.fiscalite_amortissements
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fiscalite_amort_user_annee
    ON public.fiscalite_amortissements(user_id, annee);
CREATE INDEX IF NOT EXISTS idx_fiscalite_amort_annee
    ON public.fiscalite_amortissements(annee);

-- fiscal_history (simulations fiscales)
CREATE TABLE IF NOT EXISTS public.fiscal_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    gite TEXT NOT NULL DEFAULT 'multi',
    revenus NUMERIC(12,2) DEFAULT 0,
    charges NUMERIC(12,2) DEFAULT 0,
    resultat NUMERIC(12,2) DEFAULT 0,
    regime TEXT,
    donnees_detaillees JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (owner_user_id, year, gite)
);

-- Ajout des colonnes manquantes si la table existe déjà sans elles
ALTER TABLE public.fiscal_history ADD COLUMN IF NOT EXISTS gite TEXT NOT NULL DEFAULT 'multi';
ALTER TABLE public.fiscal_history ADD COLUMN IF NOT EXISTS revenus NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.fiscal_history ADD COLUMN IF NOT EXISTS charges NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.fiscal_history ADD COLUMN IF NOT EXISTS resultat NUMERIC(12,2) DEFAULT 0;

-- Contrainte unique (idempotent via DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fiscal_history_owner_year_gite_key'
          AND conrelid = 'public.fiscal_history'::regclass
    ) THEN
        ALTER TABLE public.fiscal_history
            ADD CONSTRAINT fiscal_history_owner_year_gite_key
            UNIQUE (owner_user_id, year, gite);
    END IF;
END $$;

ALTER TABLE public.fiscal_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fiscal_history_owner_all" ON public.fiscal_history;
CREATE POLICY "fiscal_history_owner_all" ON public.fiscal_history
    FOR ALL
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_fiscal_history_owner_year
    ON public.fiscal_history(owner_user_id, year);

-- fiscalite_amortissements (amortissements comptables par année)
CREATE TABLE IF NOT EXISTS public.fiscalite_amortissements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    type TEXT NOT NULL,                    -- 'travaux' | 'frais' | 'produits'
    description TEXT,
    gite TEXT,
    montant NUMERIC(12,2) DEFAULT 0,
    amortissement_origine JSONB DEFAULT NULL,  -- {annee_origine, duree, montant_total}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fiscalite_amortissements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fiscalite_amortissements_owner_all" ON public.fiscalite_amortissements;
CREATE POLICY "fiscalite_amortissements_owner_all" ON public.fiscalite_amortissements
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fiscalite_amortissements_user_annee
    ON public.fiscalite_amortissements(user_id, annee);
CREATE INDEX IF NOT EXISTS idx_fiscalite_amortissements_type
    ON public.fiscalite_amortissements(type);

-- suivi_soldes_bancaires (trésorerie mensuelle)
CREATE TABLE IF NOT EXISTS public.suivi_soldes_bancaires (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    mois INTEGER NOT NULL,
    solde NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, annee, mois),
    CONSTRAINT suivi_soldes_mois_check CHECK (mois >= 1 AND mois <= 12)
);

ALTER TABLE public.suivi_soldes_bancaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suivi_soldes_owner_all" ON public.suivi_soldes_bancaires;
CREATE POLICY "suivi_soldes_owner_all" ON public.suivi_soldes_bancaires
    FOR ALL
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_suivi_soldes_owner_annee
    ON public.suivi_soldes_bancaires(owner_user_id, annee);

-- demandes_horaires (demandes des clients via fiche-client)
CREATE TABLE IF NOT EXISTS public.demandes_horaires (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    type TEXT,
    heure_demandee TIME WITHOUT TIME ZONE,
    motif TEXT,
    statut TEXT DEFAULT 'en_attente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.demandes_horaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demandes_horaires_owner_select" ON public.demandes_horaires;
DROP POLICY IF EXISTS "demandes_horaires_anon_insert" ON public.demandes_horaires;
DROP POLICY IF EXISTS "demandes_horaires_owner_update" ON public.demandes_horaires;
CREATE POLICY "demandes_horaires_owner_select" ON public.demandes_horaires
    FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "demandes_horaires_anon_insert" ON public.demandes_horaires
    FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "demandes_horaires_owner_update" ON public.demandes_horaires
    FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_demandes_horaires_owner ON public.demandes_horaires(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_resa ON public.demandes_horaires(reservation_id);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_statut ON public.demandes_horaires(statut);

-- historical_data (historique données génériques)
CREATE TABLE IF NOT EXISTS public.historical_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.historical_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historical_data_authenticated_select" ON public.historical_data;
CREATE POLICY "historical_data_authenticated_select" ON public.historical_data
    FOR SELECT USING (
        owner_user_id IS NULL OR auth.uid() = owner_user_id
    );

DROP POLICY IF EXISTS "historical_data_owner_all" ON public.historical_data;
CREATE POLICY "historical_data_owner_all" ON public.historical_data
    FOR ALL USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_historical_data_table_name
    ON public.historical_data(table_name, changed_at DESC);

-- ============================================================
-- 5. FONCTION upsert_error_log (STUB)
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_error_log(
    p_error_type TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_stack_trace TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_user_email TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_error_log(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;

-- ============================================================
-- 6. VÉRIFICATION FINALE
-- ============================================================
SELECT table_name, table_type AS type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'user_notification_preferences', 'user_subscriptions', 'admin_communications',
    'subscriptions_plans',
    'todos', 'commandes_prestations', 'lignes_commande_prestations',
    'linen_needs', 'user_settings', 'fiscal_history',
    'suivi_soldes_bancaires', 'demandes_horaires', 'historical_data'
  )
ORDER BY table_name;

SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'notification_preferences' AND column_name IN ('email_address','notify_demandes','email_frequency'))
    OR (table_name = 'cleaning_schedule' AND column_name IN ('scheduled_date','proposed_by','reservation_end'))
    OR (table_name = 'linen_needs' AND column_name = 'item_label')
    OR (table_name = 'notifications' AND column_name IN ('expires_at','titre','contenu'))
    OR (table_name = 'gites' AND column_name = 'regles_tarifs')
  )
ORDER BY table_name, column_name;

-- ============================================================
-- 7. RECHARGEMENT DU CACHE POSTGREST
--    Force PostgREST à prendre en compte les nouveaux schémas
-- ============================================================
NOTIFY pgrst, 'reload schema';
