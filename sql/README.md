# Scripts SQL — Socle propre (rebuild)

Nettoyage effectué le 24/02/2026 pour garder uniquement un ensemble SQL utile à la reconstruction de la base.

## Exécution unique (rebuild complet)

```bash
cd /workspaces/Gestion_gite-calvignac
psql "$DATABASE_URL" -f sql/rebuild/01_REBUILD_SITE_ORDER.sql
```

## Socle conservé

- `sql/rebuild/01_REBUILD_SITE_ORDER.sql` (orchestrateur unique)
- `sql/core/REBUILD_COMPLETE_DATABASE.sql`
- `sql/core/REBUILD_COMPLETE_DATABASE_PART2.sql`
- `sql/create_km_management.sql`
- `sql/create_linen_stock_transactions.sql`
- `sql/create_auto_ticket_tables.sql`
- `sql/create_communaute_artisans.sql`
- `sql/migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql`
- `sql/migrations/ADD_GITES_TARIFICATION_FIELDS_2026-02-27.sql`
- `sql/migrations/ADD_NOTIFICATION_MENAGE_COMPANY_FIELDS_2026-03-03.sql`
- `sql/security_hardening_rls_fiche_client_token.sql`
- `sql/securite/FIX_USER_ROLES_RLS_RECURSION_2026-02-23.sql`
- `sql/securite/RLS_HARDENING_TABLES_RESTANTES_2026-02-23.sql`
- `sql/securite/fiche_client_rls_lot3_pre_backup_20260223.sql`
- `sql/securite/fiche_client_rls_lot3_postcheck_20260223.sql`
- `sql/securite/fiche_client_rls_lot3_rollback_20260223.sql`
- `sql/securite/SUIVI_HEBDO_SECURITE_ADMIN_2026-02-23.sql`

## Archives du bazar SQL

- Archive complète du surplus : `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/`
- Manifest de traçabilité : `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/MANIFEST.md`
- Archive passe MVP rebuild (réduction visibilité `sql/`) : `_archives/by_category/sql/sql_cleanup_20260224_mvp_rebuild_sql/`
- Manifest MVP : `_archives/by_category/sql/sql_cleanup_20260224_mvp_rebuild_sql/MANIFEST.md`
- Archive notifications one-shot/redondantes (03/03/2026) : `_archives/by_category/sql/sql_cleanup_20260303_notifications/`
- Manifest notifications : `_archives/by_category/sql/sql_cleanup_20260303_notifications/MANIFEST.md`

## Règles

1. Ajouter tout nouveau SQL utile dans le socle (pas de duplication de versions).
2. Si un script devient obsolète, l’archiver (ne pas laisser en vrac).
3. Utiliser l’orchestrateur rebuild comme point d’entrée unique.
