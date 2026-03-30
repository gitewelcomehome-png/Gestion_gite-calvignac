-- ============================================================
-- Configuration Webhook Supabase → auto-trigger Cowork
-- Date    : 2026-03-29
-- Objectif : Déclencher /api/webhooks/supabase-error sur chaque
--            INSERT d'erreur critique dans error_logs
--
-- ATTENTION : À configurer dans Supabase Dashboard UI
--             (pas exécutable directement en SQL Editor)
--             Ce fichier sert de référence de configuration.
--
-- Supabase Dashboard → Database → Webhooks → Create new webhook
-- ============================================================

/*
CONFIGURATION DANS SUPABASE DASHBOARD :
=======================================

1. Aller dans : Database → Webhooks → "Create a new webhook"

2. Remplir :
   Name       : error-logs-cowork-trigger
   Table      : error_logs
   Events     : INSERT (uniquement)
   URL        : https://gestion-gite-calvignac.vercel.app/api/webhooks/supabase-error
                (adapter avec l'URL Vercel production)
   HTTP Method: POST

3. Headers supplémentaires (optionnel pour la signature) :
   Content-Type : application/json
   x-supabase-signature : [généré automatiquement par Supabase si secret défini]

4. Secret de signature :
   - Générer un secret fort (ex: openssl rand -hex 32)
   - Le copier dans Vercel Dashboard → Environment Variables → SUPABASE_WEBHOOK_SECRET
   - Le coller dans le champ "signing secret" de Supabase Webhook

VARIABLES D'ENV À AJOUTER DANS VERCEL DASHBOARD :
==================================================

  SUPABASE_WEBHOOK_SECRET   [obligatoire pour la sécurité]
    Valeur : secret généré ci-dessus
    
  GITHUB_TOKEN              [obligatoire pour auto-push Cowork]
    Valeur : Personal Access Token GitHub
    Scopes requis : repo (read + write)
    Créer sur : github.com → Settings → Developer settings → Tokens
    
  GITHUB_REPO               [obligatoire]
    Valeur : gitewelcomehome-png/Gestion_gite-calvignac
    
  ADMIN_ALERT_EMAIL         [recommandé]
    Valeur : gite.welcomehome@gmail.com (ou autre)
    (SMTP_HOST/USER/PASS déjà définis)

TEST DU WEBHOOK :
=================

Une fois configuré, tester avec :
  Supabase Dashboard → Database → Webhooks → [webhook] → "Send test"

Ou injecter une erreur test manuellement :
  INSERT INTO public.error_logs (error_type, error_message, source)
  VALUES ('critical', 'Test auto-trigger webhook', 'test-webhook');

→ L'endpoint /api/webhooks/supabase-error doit répondre 200
→ tmp/cowork-pending-tests.json doit apparaître sur la branche preprod
→ Un email d'alerte doit arriver sur ADMIN_ALERT_EMAIL

FILTRE APPLIQUÉ PAR L'ENDPOINT :
=================================
- Seulement error_type = 'critical'
- Seulement occurrence_count = 1 (nouvelles erreurs uniquement, pas les répétitions)
- Cela évite de spammer Cowork à chaque incrément d'une erreur déjà connue
*/

-- Vérification rapide : compter les erreurs critiques des dernières 24h
SELECT
    COUNT(*) FILTER (WHERE error_type = 'critical' AND occurrence_count = 1) AS nouvelles_critiques,
    COUNT(*) FILTER (WHERE error_type = 'critical')                            AS total_critiques,
    COUNT(*)                                                                   AS total_erreurs
FROM public.error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours';
