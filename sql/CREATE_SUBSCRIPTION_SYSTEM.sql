-- =====================================================
-- SYSTÈME D'ABONNEMENTS - CRÉATION COMPLÈTE
-- Date: 12 février 2026
-- Description: Tables pour gérer les plans d'abonnement (Solo/Duo/Quattro)
--              et les souscriptions utilisateurs avec feature gating
-- =====================================================

-- =====================================================
-- TABLE 1: subscriptions_plans
-- Plans d'abonnement avec features JSONB
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'solo', 'duo', 'quattro'
  display_name TEXT NOT NULL,
  level INTEGER NOT NULL, -- 1=SOLO, 2=DUO, 3=QUATTRO
  price_monthly DECIMAL(10,2) NOT NULL, -- Prix sans engagement
  price_monthly_committed DECIMAL(10,2) NOT NULL, -- Prix avec engagement
  max_gites INTEGER NOT NULL,
  features JSONB NOT NULL, -- Toutes les features disponibles pour ce plan
  stripe_price_id_monthly TEXT, -- ID prix Stripe sans engagement
  stripe_price_id_monthly_committed TEXT, -- ID prix Stripe avec engagement
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commentaires explicatifs
COMMENT ON TABLE subscriptions_plans IS 'Plans d''abonnement disponibles (Solo/Duo/Quattro)';
COMMENT ON COLUMN subscriptions_plans.level IS 'Niveau hierarchique du plan (1=Solo, 2=Duo, 3=Quattro)';
COMMENT ON COLUMN subscriptions_plans.features IS 'Fonctionnalités disponibles en JSONB pour contrôle d''accès granulaire';

-- =====================================================
-- INSERTION DES 3 PLANS
-- =====================================================

-- Plan SOLO (1 gîte, features de base)
INSERT INTO subscriptions_plans (name, display_name, level, price_monthly, price_monthly_committed, max_gites, features) VALUES
('solo', 'SOLO', 1, 15.00, 10.00, 1, '{
  "dashboard": true,
  "reservations": true,
  "menage": "basic",
  "draps": true,
  "fiscalite": true,
  "fiches_clients": true,
  "statistiques": "basic",
  "multi_gites_view": false,
  "ai_autocomplete": false,
  "gdf_table": false,
  "ai_communication": false,
  "api_access": false,
  "support_level": "email",
  "formation": false,
  "export_level": "pdf"
}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  level = EXCLUDED.level,
  price_monthly = EXCLUDED.price_monthly,
  price_monthly_committed = EXCLUDED.price_monthly_committed,
  max_gites = EXCLUDED.max_gites,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Plan DUO (2 gîtes, AI autocomplete + GDF)
INSERT INTO subscriptions_plans (name, display_name, level, price_monthly, price_monthly_committed, max_gites, features) VALUES
('duo', 'DUO', 2, 22.00, 15.00, 2, '{
  "dashboard": true,
  "reservations": true,
  "menage": "multi_sites",
  "draps": true,
  "fiscalite": true,
  "fiches_clients": true,
  "statistiques": "advanced",
  "multi_gites_view": true,
  "ai_autocomplete": true,
  "gdf_table": true,
  "ai_communication": false,
  "api_access": false,
  "support_level": "email_priority",
  "formation": "video",
  "export_level": "excel"
}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  level = EXCLUDED.level,
  price_monthly = EXCLUDED.price_monthly,
  price_monthly_committed = EXCLUDED.price_monthly_committed,
  max_gites = EXCLUDED.max_gites,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Plan QUATTRO (4 gîtes, toutes les features)
INSERT INTO subscriptions_plans (name, display_name, level, price_monthly, price_monthly_committed, max_gites, features) VALUES
('quattro', 'QUATTRO', 3, 33.00, 23.00, 4, '{
  "dashboard": true,
  "reservations": true,
  "menage": "multi_sites",
  "draps": true,
  "fiscalite": true,
  "fiches_clients": true,
  "statistiques": "advanced",
  "multi_gites_view": true,
  "ai_autocomplete": true,
  "gdf_table": true,
  "ai_communication": true,
  "api_access": true,
  "support_level": "email_vip",
  "formation": "personal_1h",
  "export_level": "api"
}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  level = EXCLUDED.level,
  price_monthly = EXCLUDED.price_monthly,
  price_monthly_committed = EXCLUDED.price_monthly_committed,
  max_gites = EXCLUDED.max_gites,
  features = EXCLUDED.features,
  updated_at = NOW();

-- =====================================================
-- TABLE 2: user_subscriptions
-- Abonnements actifs des utilisateurs
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_id UUID REFERENCES subscriptions_plans NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'past_due', 'canceled', 'incomplete'
  billing_cycle TEXT NOT NULL, -- 'monthly', 'monthly_committed'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_subscription UNIQUE (user_id)
);

-- Commentaires
COMMENT ON TABLE user_subscriptions IS 'Abonnements actifs des utilisateurs avec liens Stripe';
COMMENT ON COLUMN user_subscriptions.status IS 'Statut: active, trialing, past_due, canceled, incomplete';
COMMENT ON COLUMN user_subscriptions.billing_cycle IS 'monthly (sans engagement) ou monthly_committed (avec engagement)';

-- =====================================================
-- TABLE 3: subscription_usage
-- Suivi de l'utilisation (nombre de gîtes, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions,
  gites_count INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_usage_per_user UNIQUE (user_id)
);

COMMENT ON TABLE subscription_usage IS 'Suivi de l''utilisation pour enforcer les limites';
COMMENT ON COLUMN subscription_usage.gites_count IS 'Nombre de gîtes actuellement créés par l''utilisateur';

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Plans: lecture publique
ALTER TABLE subscriptions_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans visible par tous" ON subscriptions_plans FOR SELECT USING (is_active = true);

-- Abonnements: chaque user voit le sien
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Usage: chaque user voit le sien
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON subscription_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON subscription_usage FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INDEX POUR PERFORMANCES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plans_level ON subscriptions_plans(level);

-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_plans_updated_at BEFORE UPDATE ON subscriptions_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at BEFORE UPDATE ON subscription_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VÉRIFICATIONS & TESTS
-- =====================================================

-- Vérifier les 3 plans insérés
SELECT 
  name, 
  display_name, 
  level, 
  price_monthly, 
  price_monthly_committed, 
  max_gites,
  features->>'ai_autocomplete' as ai_autocomplete,
  features->>'gdf_table' as gdf_table,
  features->>'support_level' as support_level
FROM subscriptions_plans 
ORDER BY level;

-- Compter les tables créées
SELECT 
  'subscriptions_plans' as table_name, COUNT(*) as record_count FROM subscriptions_plans
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL
SELECT 'subscription_usage', COUNT(*) FROM subscription_usage;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
