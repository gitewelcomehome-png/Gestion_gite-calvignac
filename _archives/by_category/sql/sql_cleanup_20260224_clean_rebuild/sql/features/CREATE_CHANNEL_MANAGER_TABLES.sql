-- ================================================================
-- 🚀 CHANNEL MANAGER - CRÉATION TABLES BDD
-- ================================================================
-- Date création: 30 janvier 2026
-- Version: v1.0
-- Description: Tables pour l'activité Channel Manager (service B2B)
-- Tables créées: 12
-- ================================================================
-- ⚠️ IMPORTANT: À exécuter UNE SEULE FOIS sur Supabase
-- Site EN PRODUCTION - Tester avant sur environnement dev
-- ================================================================

BEGIN;

-- ================================================================
-- 🔧 EXTENSIONS REQUISES
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 📋 TABLE 1: cm_clients (Clients du Channel Manager)
-- ================================================================
-- Description: Propriétaires de gîtes utilisant le service CM
-- Relations: FK vers auth.users

CREATE TABLE IF NOT EXISTS public.cm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_entreprise TEXT,
  nom_contact TEXT NOT NULL,
  prenom_contact TEXT NOT NULL,
  email_principal TEXT NOT NULL UNIQUE,
  telephone TEXT,
  type_abonnement TEXT NOT NULL DEFAULT 'basic' CHECK (type_abonnement IN ('basic', 'pro', 'premium')),
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'resilié', 'trial')),
  date_inscription TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_fin_abonnement TIMESTAMPTZ,
  montant_mensuel DECIMAL(10,2) NOT NULL DEFAULT 0,
  nb_gites_max INTEGER NOT NULL DEFAULT 1,
  nb_gites_actuels INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_clients IS 'Clients du Channel Manager (propriétaires utilisant le service)';
COMMENT ON COLUMN public.cm_clients.type_abonnement IS 'Type abonnement: basic (1 gîte), pro (5 gîtes), premium (illimité)';
COMMENT ON COLUMN public.cm_clients.statut IS 'Statut client: actif, suspendu, resilié, trial';
COMMENT ON COLUMN public.cm_clients.nb_gites_max IS 'Nombre maximum de gîtes selon abonnement';
COMMENT ON COLUMN public.cm_clients.nb_gites_actuels IS 'Nombre de gîtes actuellement gérés';

-- Index pour performance
CREATE INDEX idx_cm_clients_user_id ON public.cm_clients(user_id);
CREATE INDEX idx_cm_clients_email ON public.cm_clients(email_principal);
CREATE INDEX idx_cm_clients_statut ON public.cm_clients(statut);
CREATE INDEX idx_cm_clients_type_abonnement ON public.cm_clients(type_abonnement);
CREATE INDEX idx_cm_clients_date_fin ON public.cm_clients(date_fin_abonnement);

-- ================================================================
-- 📋 TABLE 2: cm_subscriptions (Historique des abonnements)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
  type_abonnement TEXT NOT NULL CHECK (type_abonnement IN ('basic', 'pro', 'premium')),
  montant DECIMAL(10,2) NOT NULL,
  date_debut TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_fin TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'annulé', 'expiré', 'suspendu')),
  mode_paiement TEXT CHECK (mode_paiement IN ('carte', 'virement', 'prelevement', 'paypal', 'autre')),
  raison_annulation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_subscriptions IS 'Historique des abonnements clients';

CREATE INDEX idx_cm_subscriptions_client_id ON public.cm_subscriptions(client_id);
CREATE INDEX idx_cm_subscriptions_statut ON public.cm_subscriptions(statut);
CREATE INDEX idx_cm_subscriptions_dates ON public.cm_subscriptions(date_debut, date_fin);

-- ================================================================
-- 📋 TABLE 3: cm_invoices (Factures)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.cm_subscriptions(id),
  numero_facture TEXT NOT NULL UNIQUE,
  montant_ht DECIMAL(10,2) NOT NULL,
  tva DECIMAL(10,2) NOT NULL DEFAULT 0,
  montant_ttc DECIMAL(10,2) NOT NULL,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE NOT NULL,
  date_paiement DATE,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('payée', 'en_attente', 'en_retard', 'annulée')),
  mode_paiement TEXT CHECK (mode_paiement IN ('carte', 'virement', 'prelevement', 'paypal', 'autre')),
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_invoices IS 'Factures émises aux clients';

CREATE INDEX idx_cm_invoices_client_id ON public.cm_invoices(client_id);
CREATE INDEX idx_cm_invoices_numero ON public.cm_invoices(numero_facture);
CREATE INDEX idx_cm_invoices_statut ON public.cm_invoices(statut);
CREATE INDEX idx_cm_invoices_dates ON public.cm_invoices(date_emission, date_echeance);

-- ================================================================
-- 📋 TABLE 4: cm_activity_logs (Logs d'activité)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.cm_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type_activite TEXT NOT NULL CHECK (type_activite IN (
    'connexion', 'deconnexion', 'sync_ical', 'sync_erreur',
    'modification_gite', 'ajout_gite', 'suppression_gite',
    'modification_reservation', 'changement_abonnement',
    'paiement', 'ticket_support', 'autre'
  )),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_activity_logs IS 'Logs activité clients pour monitoring et analytics';
COMMENT ON COLUMN public.cm_activity_logs.details IS 'Détails JSON (ex: {gite_id, error_message, etc.})';

CREATE INDEX idx_cm_activity_logs_client_id ON public.cm_activity_logs(client_id);
CREATE INDEX idx_cm_activity_logs_type ON public.cm_activity_logs(type_activite);
CREATE INDEX idx_cm_activity_logs_created_at ON public.cm_activity_logs(created_at DESC);

-- ================================================================
-- 📋 TABLE 5: cm_support_tickets (Tickets support)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
  sujet TEXT NOT NULL,
  description TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'en_cours', 'résolu', 'fermé', 'en_attente')),
  priorite TEXT NOT NULL DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
  sentiment TEXT CHECK (sentiment IN ('positif', 'neutre', 'négatif')),
  categorie TEXT CHECK (categorie IN ('technique', 'facturation', 'fonctionnalité', 'bug', 'question', 'autre')),
  assigned_to UUID REFERENCES auth.users(id),
  temps_premiere_reponse INTEGER, -- en minutes
  temps_resolution INTEGER, -- en minutes
  csat_score INTEGER CHECK (csat_score >= 1 AND csat_score <= 5),
  csat_commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.cm_support_tickets IS 'Tickets support clients avec analytics';
COMMENT ON COLUMN public.cm_support_tickets.sentiment IS 'Analyse sentiment automatique (IA)';
COMMENT ON COLUMN public.cm_support_tickets.csat_score IS 'Score satisfaction client (1-5)';

CREATE INDEX idx_cm_support_tickets_client_id ON public.cm_support_tickets(client_id);
CREATE INDEX idx_cm_support_tickets_statut ON public.cm_support_tickets(statut);
CREATE INDEX idx_cm_support_tickets_priorite ON public.cm_support_tickets(priorite);
CREATE INDEX idx_cm_support_tickets_created_at ON public.cm_support_tickets(created_at DESC);
CREATE INDEX idx_cm_support_tickets_assigned ON public.cm_support_tickets(assigned_to);

-- ================================================================
-- 📋 TABLE 6: cm_promotions (Promotions et codes promo)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  type_promotion TEXT NOT NULL CHECK (type_promotion IN ('pourcentage', 'montant_fixe', 'mois_gratuits', 'upgrade')),
  valeur DECIMAL(10,2) NOT NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  date_debut TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_fin TIMESTAMPTZ,
  max_utilisations INTEGER,
  nb_utilisations INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  cible TEXT CHECK (cible IN ('tous', 'nouveaux', 'existants', 'churn_risk', 'vip')),
  segment_abonnement TEXT[] DEFAULT ARRAY['basic', 'pro', 'premium']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_promotions IS 'Promotions et codes promo configurables';
COMMENT ON COLUMN public.cm_promotions.conditions IS 'Conditions JSON (ex: {min_duration: 3, first_order_only: true})';
COMMENT ON COLUMN public.cm_promotions.cible IS 'Segment client ciblé';

CREATE INDEX idx_cm_promotions_code ON public.cm_promotions(code);
CREATE INDEX idx_cm_promotions_actif ON public.cm_promotions(actif);
CREATE INDEX idx_cm_promotions_dates ON public.cm_promotions(date_debut, date_fin);

-- ================================================================
-- 📋 TABLE 7: cm_promo_usage (Utilisation des promotions)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID NOT NULL REFERENCES public.cm_promotions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.cm_subscriptions(id),
  montant_reduction DECIMAL(10,2) NOT NULL,
  ca_genere DECIMAL(10,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'appliquée' CHECK (statut IN ('appliquée', 'expiré', 'annulée')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_promo_usage IS 'Historique utilisation promotions avec ROI';

CREATE INDEX idx_cm_promo_usage_promo_id ON public.cm_promo_usage(promo_id);
CREATE INDEX idx_cm_promo_usage_client_id ON public.cm_promo_usage(client_id);
CREATE INDEX idx_cm_promo_usage_created_at ON public.cm_promo_usage(created_at DESC);

-- ================================================================
-- 📋 TABLE 8: cm_pricing_plans (Plans tarifaires)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  prix_mensuel DECIMAL(10,2) NOT NULL,
  prix_annuel DECIMAL(10,2),
  nb_gites_max INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  recommande BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_pricing_plans IS 'Plans tarifaires configurables';
COMMENT ON COLUMN public.cm_pricing_plans.features IS 'Liste features JSON ["Sync iCal", "Support 24/7"]';

CREATE INDEX idx_cm_pricing_plans_code ON public.cm_pricing_plans(code);
CREATE INDEX idx_cm_pricing_plans_actif ON public.cm_pricing_plans(actif);

-- ================================================================
-- 📋 TABLE 9: cm_revenue_tracking (Suivi revenus détaillé)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_revenue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.cm_subscriptions(id),
  mois DATE NOT NULL, -- Premier jour du mois
  mrr DECIMAL(10,2) NOT NULL DEFAULT 0,
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN (
    'new_mrr', 'expansion_mrr', 'contraction_mrr', 'churn_mrr', 'reactivation_mrr'
  )),
  montant DECIMAL(10,2) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_revenue_tracking IS 'Suivi granulaire des mouvements MRR pour BI';
COMMENT ON COLUMN public.cm_revenue_tracking.type_mouvement IS 'Type mouvement: new (nouveau), expansion (upgrade), contraction (downgrade), churn (annulation), reactivation';

CREATE INDEX idx_cm_revenue_tracking_client_id ON public.cm_revenue_tracking(client_id);
CREATE INDEX idx_cm_revenue_tracking_mois ON public.cm_revenue_tracking(mois DESC);
CREATE INDEX idx_cm_revenue_tracking_type ON public.cm_revenue_tracking(type_mouvement);

-- ================================================================
-- 📋 TABLE 10: cm_ai_content_queue (File d'attente contenu IA)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_ai_content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plateforme TEXT NOT NULL CHECK (plateforme IN ('linkedin', 'instagram', 'facebook', 'twitter', 'blog')),
  type_contenu TEXT NOT NULL CHECK (type_contenu IN ('post', 'story', 'reel', 'article', 'carousel')),
  contenu TEXT NOT NULL,
  hashtags TEXT[],
  visuels JSONB DEFAULT '[]'::jsonb,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'programmé', 'publié', 'échoué')),
  date_programmation TIMESTAMPTZ,
  date_publication TIMESTAMPTZ,
  performance JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_ai_content_queue IS 'File de publication contenu généré par IA';
COMMENT ON COLUMN public.cm_ai_content_queue.performance IS 'Métriques JSON {likes, shares, comments, reach}';

CREATE INDEX idx_cm_ai_content_queue_statut ON public.cm_ai_content_queue(statut);
CREATE INDEX idx_cm_ai_content_queue_date_prog ON public.cm_ai_content_queue(date_programmation);
CREATE INDEX idx_cm_ai_content_queue_plateforme ON public.cm_ai_content_queue(plateforme);

-- ================================================================
-- 📋 TABLE 11: cm_referrals (Programme de parrainage)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_id UUID NOT NULL REFERENCES public.cm_clients(id) ON DELETE CASCADE,
  filleul_id UUID REFERENCES public.cm_clients(id) ON DELETE SET NULL,
  code_parrainage TEXT NOT NULL UNIQUE,
  email_filleul TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'inscrit', 'converti', 'expiré')),
  date_invitation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_inscription TIMESTAMPTZ,
  date_conversion TIMESTAMPTZ,
  recompense_parrain DECIMAL(10,2),
  recompense_filleul DECIMAL(10,2),
  recompense_appliquée BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_referrals IS 'Programme de parrainage avec récompenses';

CREATE INDEX idx_cm_referrals_parrain_id ON public.cm_referrals(parrain_id);
CREATE INDEX idx_cm_referrals_code ON public.cm_referrals(code_parrainage);
CREATE INDEX idx_cm_referrals_statut ON public.cm_referrals(statut);

-- ================================================================
-- 📋 TABLE 12: cm_website_pages (Pages site web CMS)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  titre TEXT NOT NULL,
  contenu JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'publié', 'archivé')),
  template TEXT NOT NULL DEFAULT 'default',
  version INTEGER NOT NULL DEFAULT 1,
  ab_test_actif BOOLEAN NOT NULL DEFAULT FALSE,
  ab_variante_a JSONB,
  ab_variante_b JSONB,
  ab_traffic_split INTEGER DEFAULT 50 CHECK (ab_traffic_split >= 0 AND ab_traffic_split <= 100),
  analytics JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_website_pages IS 'Pages site web avec CMS no-code et A/B testing';
COMMENT ON COLUMN public.cm_website_pages.contenu IS 'Structure JSON page (blocks, sections, components)';
COMMENT ON COLUMN public.cm_website_pages.analytics IS 'Métriques JSON {views, conversions, bounce_rate}';

CREATE INDEX idx_cm_website_pages_slug ON public.cm_website_pages(slug);
CREATE INDEX idx_cm_website_pages_statut ON public.cm_website_pages(statut);
CREATE INDEX idx_cm_website_pages_published_at ON public.cm_website_pages(published_at DESC);

-- ================================================================
-- 🔄 TRIGGERS UPDATED_AT
-- ================================================================

-- Fonction trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application triggers
CREATE TRIGGER update_cm_clients_updated_at BEFORE UPDATE ON public.cm_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cm_subscriptions_updated_at BEFORE UPDATE ON public.cm_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cm_invoices_updated_at BEFORE UPDATE ON public.cm_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cm_support_tickets_updated_at BEFORE UPDATE ON public.cm_support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cm_promotions_updated_at BEFORE UPDATE ON public.cm_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cm_pricing_plans_updated_at BEFORE UPDATE ON public.cm_pricing_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cm_ai_content_queue_updated_at BEFORE UPDATE ON public.cm_ai_content_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cm_website_pages_updated_at BEFORE UPDATE ON public.cm_website_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.cm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_promo_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_ai_content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_website_pages ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 🛡️ POLICIES RLS - ADMIN (stephanecalvignac@hotmail.fr)
-- ================================================================
-- L'admin voit et modifie tout

-- cm_clients
DROP POLICY IF EXISTS "Admin full access cm_clients" ON public.cm_clients;
CREATE POLICY "Admin full access cm_clients" ON public.cm_clients
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_subscriptions
DROP POLICY IF EXISTS "Admin full access cm_subscriptions" ON public.cm_subscriptions;
CREATE POLICY "Admin full access cm_subscriptions" ON public.cm_subscriptions
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_invoices
DROP POLICY IF EXISTS "Admin full access cm_invoices" ON public.cm_invoices;
CREATE POLICY "Admin full access cm_invoices" ON public.cm_invoices
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_activity_logs
DROP POLICY IF EXISTS "Admin full access cm_activity_logs" ON public.cm_activity_logs;
CREATE POLICY "Admin full access cm_activity_logs" ON public.cm_activity_logs
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_support_tickets
DROP POLICY IF EXISTS "Admin full access cm_support_tickets" ON public.cm_support_tickets;
CREATE POLICY "Admin full access cm_support_tickets" ON public.cm_support_tickets
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_promotions
DROP POLICY IF EXISTS "Admin full access cm_promotions" ON public.cm_promotions;
CREATE POLICY "Admin full access cm_promotions" ON public.cm_promotions
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_promo_usage
DROP POLICY IF EXISTS "Admin full access cm_promo_usage" ON public.cm_promo_usage;
CREATE POLICY "Admin full access cm_promo_usage" ON public.cm_promo_usage
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_pricing_plans (lecture publique pour site web, admin seul modifie)
DROP POLICY IF EXISTS "Public read pricing plans" ON public.cm_pricing_plans;
CREATE POLICY "Public read pricing plans" ON public.cm_pricing_plans
  FOR SELECT USING (actif = true);

DROP POLICY IF EXISTS "Admin full access cm_pricing_plans" ON public.cm_pricing_plans;
CREATE POLICY "Admin full access cm_pricing_plans" ON public.cm_pricing_plans
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_revenue_tracking
DROP POLICY IF EXISTS "Admin full access cm_revenue_tracking" ON public.cm_revenue_tracking;
CREATE POLICY "Admin full access cm_revenue_tracking" ON public.cm_revenue_tracking
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_ai_content_queue
DROP POLICY IF EXISTS "Admin full access cm_ai_content_queue" ON public.cm_ai_content_queue;
CREATE POLICY "Admin full access cm_ai_content_queue" ON public.cm_ai_content_queue
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_referrals
DROP POLICY IF EXISTS "Admin full access cm_referrals" ON public.cm_referrals;
CREATE POLICY "Admin full access cm_referrals" ON public.cm_referrals
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- cm_website_pages (lecture publique pages publiées, admin seul modifie)
DROP POLICY IF EXISTS "Public read published pages" ON public.cm_website_pages;
CREATE POLICY "Public read published pages" ON public.cm_website_pages
  FOR SELECT USING (statut = 'publié');

DROP POLICY IF EXISTS "Admin full access cm_website_pages" ON public.cm_website_pages;
CREATE POLICY "Admin full access cm_website_pages" ON public.cm_website_pages
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'stephanecalvignac@hotmail.fr'
  );

-- ================================================================
-- 🛡️ POLICIES RLS - CLIENTS
-- ================================================================
-- Les clients voient uniquement leurs propres données

-- cm_clients (lecture seule de ses propres infos)
DROP POLICY IF EXISTS "Clients read own data" ON public.cm_clients;
CREATE POLICY "Clients read own data" ON public.cm_clients
  FOR SELECT USING (user_id = auth.uid());

-- cm_subscriptions (lecture seule)
DROP POLICY IF EXISTS "Clients read own subscriptions" ON public.cm_subscriptions;
CREATE POLICY "Clients read own subscriptions" ON public.cm_subscriptions
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.cm_clients WHERE user_id = auth.uid())
  );

-- cm_invoices (lecture seule)
DROP POLICY IF EXISTS "Clients read own invoices" ON public.cm_invoices;
CREATE POLICY "Clients read own invoices" ON public.cm_invoices
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.cm_clients WHERE user_id = auth.uid())
  );

-- cm_activity_logs (lecture seule de ses propres logs)
DROP POLICY IF EXISTS "Clients read own logs" ON public.cm_activity_logs;
CREATE POLICY "Clients read own logs" ON public.cm_activity_logs
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.cm_clients WHERE user_id = auth.uid())
  );

-- cm_support_tickets (lecture et création)
DROP POLICY IF EXISTS "Clients manage own tickets" ON public.cm_support_tickets;
CREATE POLICY "Clients manage own tickets" ON public.cm_support_tickets
  FOR ALL USING (
    client_id IN (SELECT id FROM public.cm_clients WHERE user_id = auth.uid())
  );

-- cm_promo_usage (lecture seule)
DROP POLICY IF EXISTS "Clients read own promo usage" ON public.cm_promo_usage;
CREATE POLICY "Clients read own promo usage" ON public.cm_promo_usage
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.cm_clients WHERE user_id = auth.uid())
  );

-- cm_referrals (gestion de ses parrainages)
DROP POLICY IF EXISTS "Clients manage own referrals" ON public.cm_referrals;
CREATE POLICY "Clients manage own referrals" ON public.cm_referrals
  FOR ALL USING (
    parrain_id IN (SELECT id FROM public.cm_clients WHERE user_id = auth.uid())
  );

-- ================================================================
-- 📊 DONNÉES DE TEST
-- ================================================================

-- Plans tarifaires (REQUIS - Aucune FK externe)
INSERT INTO public.cm_pricing_plans (code, nom, description, prix_mensuel, prix_annuel, nb_gites_max, features, actif, display_order, recommande) VALUES
  ('basic', 'Basic', 'Parfait pour démarrer', 29.00, 290.00, 1, 
   '["1 gîte", "Synchronisation iCal", "Calendrier simple", "Support email"]'::jsonb, 
   true, 1, false),
  ('pro', 'Pro', 'Pour les pros', 79.00, 790.00, 5, 
   '["5 gîtes", "Sync iCal illimitée", "Planning ménages", "Statistiques avancées", "Support prioritaire", "Export données"]'::jsonb, 
   true, 2, true),
  ('premium', 'Premium', 'Solution complète', 149.00, 1490.00, 999, 
   '["Gîtes illimités", "Tout Pro inclus", "API accès", "Support 24/7", "Formation personnalisée", "Channel Manager avancé"]'::jsonb, 
   true, 3, false);

-- Promotions actives (REQUIS - Aucune FK externe)
INSERT INTO public.cm_promotions (code, nom, description, type_promotion, valeur, date_debut, date_fin, max_utilisations, actif, cible)
VALUES
  ('WINTER2026', 'Promo Hiver 2026', '2 mois offerts pour tout abonnement annuel', 'mois_gratuits', 2, 
   NOW() - INTERVAL '10 days', NOW() + INTERVAL '50 days', 100, true, 'nouveaux'),
  
  ('UPGRADE20', 'Upgrade -20%', '20% de réduction sur upgrade Pro ou Premium', 'pourcentage', 20, 
   NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 50, true, 'existants');

-- ================================================================
-- 🧪 DONNÉES DE TEST CLIENTS (OPTIONNEL - Commenté par défaut)
-- ================================================================
-- ⚠️ Les INSERT ci-dessous nécessitent des user_id EXISTANTS dans auth.users
-- Pour les activer, remplacez les UUID par de vrais user_id de votre BDD
-- ================================================================

/*
-- 5 Clients fictifs de test
-- ⚠️ REMPLACER les gen_random_uuid() par de vrais UUID de auth.users !
INSERT INTO public.cm_clients (user_id, nom_entreprise, nom_contact, prenom_contact, email_principal, telephone, type_abonnement, statut, montant_mensuel, nb_gites_max, nb_gites_actuels, notes) VALUES
  -- Client 1 - Pro actif
  ('REMPLACER_PAR_VRAI_UUID_1', 'Gîtes du Terroir SARL', 'Dupont', 'Marie', 'marie.dupont@gitesterroir.fr', '0612345678', 
   'pro', 'actif', 79.00, 5, 3, 'Cliente fidèle depuis 6 mois'),
  
  -- Client 2 - Premium actif
  ('REMPLACER_PAR_VRAI_UUID_2', 'Welcome Properties', 'Martin', 'Jean', 'j.martin@welcomeproperties.com', '0687654321', 
   'premium', 'actif', 149.00, 999, 12, 'Top client - 12 gîtes gérés'),
  
  -- Client 3 - Basic trial
  ('REMPLACER_PAR_VRAI_UUID_3', NULL, 'Leroy', 'Sophie', 'sophie.leroy@gmail.com', '0634567890', 
   'basic', 'trial', 0.00, 1, 1, 'En période d''essai - 14j restants'),
  
  -- Client 4 - Pro suspendu
  ('REMPLACER_PAR_VRAI_UUID_4', 'Locations Soleil', 'Bernard', 'Luc', 'luc.bernard@locationssoleil.fr', '0698765432', 
   'pro', 'suspendu', 79.00, 5, 2, 'Suspendu - Facture impayée'),
  
  -- Client 5 - Basic actif
  ('REMPLACER_PAR_VRAI_UUID_5', NULL, 'Petit', 'Claire', 'claire.petit@outlook.fr', '0656789012', 
   'basic', 'actif', 29.00, 1, 1, 'Nouveau client - inscrit il y a 2 semaines');

-- Abonnements pour clients
INSERT INTO public.cm_subscriptions (client_id, type_abonnement, montant, date_debut, date_fin, statut, mode_paiement)
SELECT 
  id, 
  type_abonnement, 
  montant_mensuel,
  date_inscription,
  date_inscription + INTERVAL '1 year',
  CASE WHEN statut = 'actif' OR statut = 'trial' THEN 'actif' ELSE 'suspendu' END,
  'carte'
FROM public.cm_clients;

-- Factures pour clients actifs/suspendus (pas pour trial)
INSERT INTO public.cm_invoices (client_id, subscription_id, numero_facture, montant_ht, tva, montant_ttc, date_emission, date_echeance, statut, mode_paiement)
SELECT 
  c.id,
  s.id,
  'FAC-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD((ROW_NUMBER() OVER())::TEXT, 4, '0'),
  c.montant_mensuel,
  c.montant_mensuel * 0.20,
  c.montant_mensuel * 1.20,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  CASE WHEN c.statut = 'suspendu' THEN 'en_retard' ELSE 'payée' END,
  'carte'
FROM public.cm_clients c
JOIN public.cm_subscriptions s ON s.client_id = c.id
WHERE c.statut != 'trial';

-- Logs d'activité récents
INSERT INTO public.cm_activity_logs (client_id, user_id, type_activite, details, ip_address)
SELECT 
  c.id,
  c.user_id,
  (ARRAY['connexion', 'sync_ical', 'modification_gite'])[1 + floor(random() * 3)::int],
  jsonb_build_object('timestamp', NOW(), 'success', true),
  '192.168.1.' || floor(random() * 255)::text
FROM public.cm_clients c
CROSS JOIN generate_series(1, 5);

-- Tickets support
INSERT INTO public.cm_support_tickets (client_id, sujet, description, statut, priorite, categorie, sentiment)
VALUES
  ((SELECT id FROM public.cm_clients WHERE email_principal = 'marie.dupont@gitesterroir.fr' LIMIT 1),
   'Problème synchronisation Airbnb', 
   'Les réservations Airbnb ne se synchronisent plus depuis hier soir. Pouvez-vous vérifier ?',
   'en_cours', 'haute', 'technique', 'négatif'),
  
  ((SELECT id FROM public.cm_clients WHERE email_principal = 'j.martin@welcomeproperties.com' LIMIT 1),
   'Question sur facturation', 
   'Je souhaite avoir des détails sur ma dernière facture. Merci !',
   'résolu', 'normale', 'facturation', 'neutre'),
  
  ((SELECT id FROM public.cm_clients WHERE email_principal = 'sophie.leroy@gmail.com' LIMIT 1),
   'Comment ajouter un 2ème gîte ?', 
   'Bonjour, je souhaiterais ajouter un second gîte. Dois-je upgrader mon abonnement ?',
   'ouvert', 'normale', 'question', 'positif');

-- Tracking MRR
INSERT INTO public.cm_revenue_tracking (client_id, subscription_id, mois, mrr, type_mouvement, montant)
SELECT 
  c.id,
  s.id,
  DATE_TRUNC('month', CURRENT_DATE),
  c.montant_mensuel,
  'new_mrr',
  c.montant_mensuel
FROM public.cm_clients c
JOIN public.cm_subscriptions s ON s.client_id = c.id
WHERE c.statut = 'actif' AND c.type_abonnement != 'trial';
*/

COMMIT;

-- ================================================================
-- ✅ VÉRIFICATIONS POST-INSTALLATION
-- ================================================================

-- Compter les tables créées
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'cm_%'
ORDER BY tablename;

-- Afficher les données de test
SELECT 'cm_pricing_plans' as table_name, COUNT(*) as count FROM public.cm_pricing_plans
UNION ALL
SELECT 'cm_promotions', COUNT(*) FROM public.cm_promotions
UNION ALL
SELECT 'cm_clients', COUNT(*) FROM public.cm_clients
UNION ALL
SELECT 'cm_subscriptions', COUNT(*) FROM public.cm_subscriptions
UNION ALL
SELECT 'cm_invoices', COUNT(*) FROM public.cm_invoices
UNION ALL
SELECT 'cm_activity_logs', COUNT(*) FROM public.cm_activity_logs
UNION ALL
SELECT 'cm_support_tickets', COUNT(*) FROM public.cm_support_tickets
UNION ALL
SELECT 'cm_revenue_tracking', COUNT(*) FROM public.cm_revenue_tracking;

-- ================================================================
-- 📝 NOTES POST-INSTALLATION
-- ================================================================
-- 
-- ✅ Tables créées : 12
-- ✅ RLS activé : Toutes les tables
-- ✅ Policies : Admin + Clients
-- ✅ Triggers : updated_at automatiques
-- ✅ Index : Optimisation requêtes
-- ✅ Données test : Plans tarifaires + Promotions actives
-- ⚠️ Données clients : Commentées (nécessitent de vrais user_id)
-- 
-- 🔐 Accès Admin : stephanecalvignac@hotmail.fr
-- 
-- 📊 Tables créées :
--   1. cm_clients (clients Channel Manager)
--   2. cm_subscriptions (abonnements)
--   3. cm_invoices (factures)
--   4. cm_activity_logs (logs activité)
--   5. cm_support_tickets (tickets support)
--   6. cm_promotions (codes promo)
--   7. cm_promo_usage (utilisation promos)
--   8. cm_pricing_plans (plans tarifaires)
--   9. cm_revenue_tracking (tracking revenus)
--   10. cm_ai_content_queue (contenu IA)
--   11. cm_referrals (parrainage)
--   12. cm_website_pages (CMS)
-- 
-- ================================================================
