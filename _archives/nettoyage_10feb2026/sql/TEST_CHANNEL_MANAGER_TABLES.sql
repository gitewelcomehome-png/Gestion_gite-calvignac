-- ================================================================
-- 🧪 TEST CHANNEL MANAGER - VÉRIFICATION TABLES
-- ================================================================
-- Date: 30 janvier 2026
-- Objectif: Vérifier que toutes les tables CM sont bien créées
-- ================================================================

-- 1️⃣ VÉRIFIER L'EXISTENCE DES 12 TABLES
SELECT 
  '✅ Tables créées' as statut,
  COUNT(*) as nombre_tables,
  STRING_AGG(tablename, ', ' ORDER BY tablename) as liste_tables
FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'cm_%';

-- 2️⃣ DÉTAIL DE CHAQUE TABLE (colonnes)
SELECT 
  table_name,
  COUNT(*) as nb_colonnes
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name LIKE 'cm_%'
GROUP BY table_name
ORDER BY table_name;

-- 3️⃣ VÉRIFIER LES DONNÉES DE TEST
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
SELECT 'cm_promo_usage', COUNT(*) FROM public.cm_promo_usage
UNION ALL
SELECT 'cm_revenue_tracking', COUNT(*) FROM public.cm_revenue_tracking
UNION ALL
SELECT 'cm_ai_content_queue', COUNT(*) FROM public.cm_ai_content_queue
UNION ALL
SELECT 'cm_referrals', COUNT(*) FROM public.cm_referrals
UNION ALL
SELECT 'cm_website_pages', COUNT(*) FROM public.cm_website_pages
ORDER BY table_name;

-- 4️⃣ VÉRIFIER LES PLANS TARIFAIRES INSÉRÉS
SELECT 
  code,
  nom,
  prix_mensuel,
  prix_annuel,
  nb_gites_max,
  actif,
  recommande
FROM public.cm_pricing_plans
ORDER BY display_order;

-- 5️⃣ VÉRIFIER LES PROMOTIONS INSÉRÉES
SELECT 
  code,
  nom,
  type_promotion,
  valeur,
  date_debut::date,
  date_fin::date,
  actif,
  cible
FROM public.cm_promotions
ORDER BY date_debut DESC;

-- 6️⃣ VÉRIFIER LES POLICIES RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as "Commandes autorisées"
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'cm_%'
ORDER BY tablename, policyname;

-- 7️⃣ VÉRIFIER LES INDEX CRÉÉS
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'cm_%'
ORDER BY tablename, indexname;

-- 8️⃣ VÉRIFIER LES TRIGGERS
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table LIKE 'cm_%'
ORDER BY event_object_table, trigger_name;

-- 9️⃣ RÉSUMÉ FINAL
SELECT 
  'Tables créées' as element,
  COUNT(DISTINCT table_name)::text as valeur
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name LIKE 'cm_%'
UNION ALL
SELECT 
  'Policies RLS',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'cm_%'
UNION ALL
SELECT 
  'Index créés',
  COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'cm_%'
UNION ALL
SELECT 
  'Triggers actifs',
  COUNT(*)::text
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table LIKE 'cm_%'
UNION ALL
SELECT 
  'Plans tarifaires',
  COUNT(*)::text
FROM public.cm_pricing_plans
UNION ALL
SELECT 
  'Promotions actives',
  COUNT(*)::text
FROM public.cm_promotions WHERE actif = true;

-- ================================================================
-- ✅ ATTENDU SI TOUT EST OK
-- ================================================================
-- Tables créées: 12
-- Policies RLS: ~26 (Admin + Clients pour chaque table)
-- Index créés: ~30
-- Triggers actifs: 8 (updated_at pour 8 tables)
-- Plans tarifaires: 3 (Basic, Pro, Premium)
-- Promotions actives: 2 (WINTER2026, UPGRADE20)
-- ================================================================
