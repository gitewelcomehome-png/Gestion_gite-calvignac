-- ============================================================
-- FIX SCHEMA : cm_clients, user_settings, referrals
-- ============================================================
-- Erreurs résolues :
--   1. cm_clients        → colonnes user_id, email_principal, nom_contact,
--                          prenom_contact, type_abonnement, statut, date_inscription manquantes
--   2. user_settings     → colonne subscription_type manquante
--   3. referrals         → table inexistante (CREATE)
-- ============================================================

-- ============================================================
-- 1. cm_clients : colonnes attendues par options.html
--    Le JS filtre par .eq('user_id', user.id)
--    et insère user_id, email_principal, nom_contact, prenom_contact,
--    type_abonnement, statut, date_inscription
-- ============================================================
ALTER TABLE public.cm_clients
    ADD COLUMN IF NOT EXISTS user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS email_principal   TEXT,
    ADD COLUMN IF NOT EXISTS nom_contact       TEXT,
    ADD COLUMN IF NOT EXISTS prenom_contact    TEXT,
    ADD COLUMN IF NOT EXISTS type_abonnement   TEXT DEFAULT 'basic',
    ADD COLUMN IF NOT EXISTS statut            TEXT DEFAULT 'trial',
    ADD COLUMN IF NOT EXISTS date_inscription  TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS telephone         TEXT;

-- email est NOT NULL dans le schéma original mais le JS n'envoie que email_principal
ALTER TABLE public.cm_clients ALTER COLUMN email DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cm_clients_user_id ON public.cm_clients(user_id);

-- RLS : autoriser les utilisateurs à lire et créer leur propre ligne cm_clients
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

-- ============================================================
-- 2. user_settings : ajouter subscription_type
--    Le JS lit .select('subscription_type').eq('user_id', userId)
--    pour vérifier si type = 'gites_france' (parrainage)
-- ============================================================
ALTER TABLE public.user_settings
    ADD COLUMN IF NOT EXISTS subscription_type TEXT;

-- ============================================================
-- 3. referrals : table attendue par options.html
--    Le JS lit .eq('referrer_id', userId).eq('status', 'active')
--    .eq('is_currently_paying', true) et sélectionne bonus_rate_pct
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code       TEXT,
    status              TEXT DEFAULT 'pending',
    is_currently_paying BOOLEAN DEFAULT false,
    bonus_rate_pct      NUMERIC(5,2) DEFAULT 5,
    created_at          TIMESTAMPTZ DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status   ON public.referrals(status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_owner_select ON public.referrals;
CREATE POLICY referrals_owner_select ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);

-- ============================================================
-- 4. cm_support_tickets : colonnes attendues par options.html
--    Le JS insère sujet, categorie, priorite, statut
--    La table a title, category, priority, status
-- ============================================================
ALTER TABLE public.cm_support_tickets
    ADD COLUMN IF NOT EXISTS sujet      TEXT,
    ADD COLUMN IF NOT EXISTS categorie  TEXT,
    ADD COLUMN IF NOT EXISTS priorite   TEXT DEFAULT 'normale',
    ADD COLUMN IF NOT EXISTS statut     TEXT DEFAULT 'ouvert';

-- title est NOT NULL mais le JS n'envoie que sujet
ALTER TABLE public.cm_support_tickets ALTER COLUMN title DROP NOT NULL;

-- RLS : autoriser les utilisateurs à lire/créer leurs propres tickets
ALTER TABLE public.cm_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cm_support_tickets_user_select ON public.cm_support_tickets;
DROP POLICY IF EXISTS cm_support_tickets_user_insert ON public.cm_support_tickets;

CREATE POLICY cm_support_tickets_user_select ON public.cm_support_tickets
    FOR SELECT USING (
        client_id IN (SELECT id FROM public.cm_clients WHERE user_id = auth.uid())
    );

CREATE POLICY cm_support_tickets_user_insert ON public.cm_support_tickets
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM public.cm_clients WHERE user_id = auth.uid())
    );

-- ============================================================
-- 5. user_roles : colonne is_active manquante
--    Le JS filtre par .eq('is_active', true)
-- ============================================================
ALTER TABLE public.user_roles
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Mettre à jour les lignes existantes
UPDATE public.user_roles SET is_active = true WHERE is_active IS NULL;

-- ============================================================
-- 6. cm_promo_usage : colonnes montant_reduction et ca_genere manquantes
--    Le JS lit .select('montant_reduction, ca_genere')
-- ============================================================
ALTER TABLE public.cm_promo_usage
    ADD COLUMN IF NOT EXISTS montant_reduction NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ca_genere         NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS statut            TEXT DEFAULT 'actif';

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
  AND column_name IN ('user_id', 'email_principal', 'nom_contact', 'prenom_contact', 'type_abonnement', 'statut', 'date_inscription')
UNION ALL
SELECT 'user_settings', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_settings'
  AND column_name = 'subscription_type'
UNION ALL
SELECT 'referrals', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'referrals'
ORDER BY table_name, column_name;
