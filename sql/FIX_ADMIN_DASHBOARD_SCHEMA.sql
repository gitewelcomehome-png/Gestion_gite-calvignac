-- ============================================================
-- FIX SCHEMA : tables admin dashboard
-- ============================================================
-- Erreurs résolues :
--   1. cm_clients          → montant_mensuel, entreprise, nb_gites_actuels manquants
--   2. cm_error_logs       → table inexistante (vue vers error_logs)
--   3. cm_revenue_tracking → mrr, mois manquants
--   4. cm_activity_logs    → type_activite manquant
--   5. cm_promotions       → nom, actif, date_fin manquants
-- ============================================================

-- ============================================================
-- 1. cm_clients : colonnes attendues par admin-dashboard.js
-- ============================================================
ALTER TABLE public.cm_clients
    ADD COLUMN IF NOT EXISTS montant_mensuel     NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nom_entreprise      TEXT,
    ADD COLUMN IF NOT EXISTS entreprise          TEXT,
    ADD COLUMN IF NOT EXISTS nb_gites_actuels    INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS date_fin_abonnement TIMESTAMPTZ;

-- Synchroniser date_fin_abonnement depuis trial_ends_at
UPDATE public.cm_clients
SET date_fin_abonnement = trial_ends_at
WHERE date_fin_abonnement IS NULL AND trial_ends_at IS NOT NULL;

-- ============================================================
-- 2. cm_error_logs : vue vers error_logs
--    Le JS lit cm_error_logs mais la table s'appelle error_logs
-- ============================================================
CREATE OR REPLACE VIEW public.cm_error_logs AS
    SELECT
        id,
        user_id,
        error_message,
        error_stack,
        error_type,
        url,
        user_agent,
        browser,
        os,
        timestamp,
        severity,
        resolved,
        resolved_at,
        metadata
    FROM public.error_logs;

-- ============================================================
-- 3. cm_revenue_tracking : mrr et mois manquants
--    Le JS filtre par .select('mrr').eq('mois', ...)
-- ============================================================
ALTER TABLE public.cm_revenue_tracking
    ADD COLUMN IF NOT EXISTS mrr  NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mois DATE;

-- Synchroniser mois depuis date pour les lignes existantes
UPDATE public.cm_revenue_tracking
SET mois = date_trunc('month', date)::DATE
WHERE mois IS NULL AND date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cm_revenue_mois ON public.cm_revenue_tracking(mois);

-- ============================================================
-- 4. cm_activity_logs : type_activite manquant
--    Le JS filtre .eq('type_activite', 'connexion') / 'sync_erreur'
-- ============================================================
ALTER TABLE public.cm_activity_logs
    ADD COLUMN IF NOT EXISTS type_activite TEXT;

-- Synchroniser type_activite depuis action pour les lignes existantes
UPDATE public.cm_activity_logs
SET type_activite = action
WHERE type_activite IS NULL;

CREATE INDEX IF NOT EXISTS idx_cm_activity_type_activite ON public.cm_activity_logs(type_activite);

-- ============================================================
-- 5. cm_promotions : nom, actif, date_fin manquants
--    Le JS lit .select('code,nom').eq('actif', true).gte('date_fin', ...)
--    La table a name, is_active, valid_until
--    Le JS utilise aussi : type_promotion, valeur, cible, date_debut,
--    max_utilisations, nb_utilisations
-- ============================================================
ALTER TABLE public.cm_promotions
    ADD COLUMN IF NOT EXISTS nom              TEXT,
    ADD COLUMN IF NOT EXISTS actif            BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS date_fin         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS type_promotion   TEXT,
    ADD COLUMN IF NOT EXISTS valeur           NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS cible            TEXT DEFAULT 'tous',
    ADD COLUMN IF NOT EXISTS date_debut       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS max_utilisations INTEGER,
    ADD COLUMN IF NOT EXISTS nb_utilisations  INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS segment_abonnement JSONB DEFAULT '[]'::jsonb;

-- Synchroniser depuis les colonnes existantes
UPDATE public.cm_promotions SET
    nom              = COALESCE(nom,              name),
    actif            = COALESCE(actif,            is_active),
    date_fin         = COALESCE(date_fin,         valid_until),
    type_promotion   = COALESCE(type_promotion,   type),
    valeur           = COALESCE(valeur,           value),
    date_debut       = COALESCE(date_debut,       valid_from),
    max_utilisations = COALESCE(max_utilisations, max_uses),
    nb_utilisations  = COALESCE(nb_utilisations,  uses_count)
WHERE nom IS NULL OR actif IS NULL OR type_promotion IS NULL;

-- ============================================================
-- 6. cm_support_tickets : csat_score manquant
--    Le JS lit .select('csat_score').eq('statut', 'résolu')
-- ============================================================
ALTER TABLE public.cm_support_tickets
    ADD COLUMN IF NOT EXISTS csat_score NUMERIC(3,1);

-- ============================================================
-- 7. cm_promo_usage : promo_id alias de promotion_id
--    Le JS fait .select('...', { foreignTable: 'promo_id' })
--    La table a promotion_id mais pas promo_id
-- ============================================================
ALTER TABLE public.cm_promo_usage
    ADD COLUMN IF NOT EXISTS promo_id UUID REFERENCES public.cm_promotions(id) ON DELETE CASCADE;

-- Synchroniser promo_id depuis promotion_id
UPDATE public.cm_promo_usage
SET promo_id = promotion_id
WHERE promo_id IS NULL AND promotion_id IS NOT NULL;

-- ============================================================
-- 8. cm_subscriptions : date_debut manquant
--    Le JS trie par .order('date_debut', ...)
--    La table a current_period_start
-- ============================================================
ALTER TABLE public.cm_subscriptions
    ADD COLUMN IF NOT EXISTS date_debut TIMESTAMPTZ;

UPDATE public.cm_subscriptions
SET date_debut = COALESCE(current_period_start, created_at)
WHERE date_debut IS NULL;

-- ============================================================
-- 9. referrals : registered_at manquant
--    Le JS trie par .order('registered_at', ...)
-- ============================================================
ALTER TABLE public.referrals
    ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT now();

UPDATE public.referrals
SET registered_at = created_at
WHERE registered_at IS NULL;

-- ============================================================
-- 10. cm_support_comments : is_ai_generated et user_id manquants
--     Le JS envoie user_id et is_ai_generated lors de l'insertion d'une réponse IA
--     author_email n'est pas envoyé par le JS → rendre nullable
-- ============================================================
ALTER TABLE public.cm_support_comments
    ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cm_support_comments
    ALTER COLUMN author_email DROP NOT NULL;

-- ============================================================
-- 11. cm_support_solutions : efficacite_score et nb_utilisations manquants
--     Le JS trie par .order('efficacite_score').order('nb_utilisations')
--     La table a score_pertinence et reussite_count
-- ============================================================
ALTER TABLE public.cm_support_solutions
    ADD COLUMN IF NOT EXISTS efficacite_score NUMERIC(3,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nb_utilisations  INTEGER DEFAULT 0;

-- Synchroniser depuis les colonnes existantes
UPDATE public.cm_support_solutions
SET
    efficacite_score = COALESCE(efficacite_score, score_pertinence),
    nb_utilisations  = COALESCE(nb_utilisations, reussite_count)
WHERE efficacite_score IS NULL OR nb_utilisations IS NULL;

-- ============================================================
-- 12. referral_campaigns : table inexistante
--     Le JS admin-parrainage.js requête cette table (404)
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_referral_campaigns_active   ON public.referral_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_dates    ON public.referral_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_code     ON public.referral_campaigns(campaign_code);

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

-- ============================================================
-- 13. user_campaign_participations : table inexistante
--     Le JS admin-parrainage.js requête cette table pour les stats
-- ============================================================
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

-- ============================================================
-- 14. cm_invoices : montant_ttc, statut, date_emission manquants
--     Le JS lit montant_ttc/statut/date_emission
--     La table a total/status/issued_date
-- ============================================================
ALTER TABLE public.cm_invoices
    ADD COLUMN IF NOT EXISTS montant_ttc    NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS statut         TEXT,
    ADD COLUMN IF NOT EXISTS date_emission  DATE;

UPDATE public.cm_invoices SET
    montant_ttc   = COALESCE(montant_ttc,   total),
    statut        = COALESCE(statut,        status),
    date_emission = COALESCE(date_emission, issued_date)
WHERE montant_ttc IS NULL OR statut IS NULL OR date_emission IS NULL;

CREATE INDEX IF NOT EXISTS idx_cm_invoices_statut        ON public.cm_invoices(statut);
CREATE INDEX IF NOT EXISTS idx_cm_invoices_date_emission ON public.cm_invoices(date_emission);

-- ============================================================
-- 15. cm_subscriptions : type_abonnement manquant
--     Le JS joint cm_subscriptions et lit type_abonnement
--     La table a billing_cycle
-- ============================================================
ALTER TABLE public.cm_subscriptions
    ADD COLUMN IF NOT EXISTS type_abonnement TEXT;

UPDATE public.cm_subscriptions
SET type_abonnement = COALESCE(type_abonnement, billing_cycle)
WHERE type_abonnement IS NULL;

-- ============================================================
-- 16. cm_content_generated : table inexistante
--     Le JS admin-content.js requête cette table (404)
--     Colonnes utilisées : type, subject, content, statut, tone
-- ============================================================
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

-- ============================================================
-- 16b. cm_ai_content_queue : colonnes manquantes
--      Le JS utilise type, plateforme, sujet, contenu,
--      scheduled_date, statut — la table a content_type/status en anglais
-- ============================================================
ALTER TABLE public.cm_ai_content_queue
    ADD COLUMN IF NOT EXISTS type           TEXT,
    ADD COLUMN IF NOT EXISTS plateforme     TEXT,
    ADD COLUMN IF NOT EXISTS sujet          TEXT,
    ADD COLUMN IF NOT EXISTS contenu        TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS statut         TEXT DEFAULT 'en_attente',
    ADD COLUMN IF NOT EXISTS plan_detaille  JSONB;

-- Synchroniser depuis colonnes existantes
UPDATE public.cm_ai_content_queue SET
    type   = COALESCE(type,   content_type),
    statut = COALESCE(statut, status)
WHERE type IS NULL OR statut IS NULL;

CREATE INDEX IF NOT EXISTS idx_cm_ai_queue_statut         ON public.cm_ai_content_queue(statut);
CREATE INDEX IF NOT EXISTS idx_cm_ai_queue_scheduled_date ON public.cm_ai_content_queue(scheduled_date);

-- ============================================================
-- 17. cm_ai_strategies : table inexistante
--     admin-content-ai-strategy.js gère le plan IA semaine par semaine
-- ============================================================
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

-- ============================================================
-- 18. cm_ai_actions : table inexistante
--     admin-content-ai-strategy.js stocke les actions proposées/archivées
-- ============================================================
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

-- ============================================================
-- FORCER LE RECHARGEMENT DU CACHE POSTGREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT 'cm_clients' AS table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cm_clients'
  AND column_name IN ('montant_mensuel', 'entreprise', 'nb_gites_actuels', 'nom_entreprise')
UNION ALL
SELECT 'cm_revenue_tracking', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cm_revenue_tracking'
  AND column_name IN ('mrr', 'mois')
UNION ALL
SELECT 'cm_activity_logs', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cm_activity_logs'
  AND column_name = 'type_activite'
UNION ALL
SELECT 'cm_promotions', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cm_promotions'
  AND column_name IN ('nom', 'actif', 'date_fin')
UNION ALL
SELECT 'cm_error_logs (vue)', view_definition::TEXT AS column_name, 'VIEW' AS data_type
FROM information_schema.views
WHERE table_schema = 'public' AND table_name = 'cm_error_logs'
ORDER BY table_name, column_name;
