-- ================================================================
-- ORCHESTRATEUR REBUILD COMPLET SITE (v2.0 CLEAN)
-- ================================================================
-- Usage:
--   psql "$DATABASE_URL" -f sql/rebuild/01_REBUILD_SITE_ORDER.sql
-- ================================================================

\echo ''
\echo '=== [1/4] REBUILD CORE DATABASE ==='
\i ../core/REBUILD_COMPLETE_DATABASE.sql
\i ../core/REBUILD_COMPLETE_DATABASE_PART2.sql

\echo ''
\echo '=== [2/4] MODULES APPLICATIFS ESSENTIELS ==='
\i ../create_km_management.sql
\i ../create_linen_stock_transactions.sql
\i ../create_auto_ticket_tables.sql
\i ../create_communaute_artisans.sql
\i ../migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql
\i ../migrations/ADD_GITES_TARIFICATION_FIELDS_2026-02-27.sql
\i ../migrations/ADD_NOTIFICATION_MENAGE_COMPANY_FIELDS_2026-03-03.sql

\echo ''
\echo '=== [3/4] HARDENING SECURITE/RLS ==='
\i ../security_hardening_rls_fiche_client_token.sql
\i ../securite/FIX_USER_ROLES_RLS_RECURSION_2026-02-23.sql
\i ../securite/RLS_HARDENING_TABLES_RESTANTES_2026-02-23.sql
\i ../securite/RLS_HARDENING_CM_TABLES_2026-03-06.sql

\echo ''
\echo '=== [4/4] CHECKS POST-REBUILD ==='
\i ../securite/fiche_client_rls_lot3_postcheck_20260223.sql
\i ../securite/SUIVI_HEBDO_SECURITE_ADMIN_2026-02-23.sql

\echo ''
\echo '=== REBUILD COMPLET TERMINE ==='
\echo 'Valider ensuite la checklist: sql/rebuild/02_POST_REBUILD_CHECKLIST.md'
