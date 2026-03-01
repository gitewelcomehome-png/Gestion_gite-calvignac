# Rebuild SQL complet du site

Ce dossier fournit **l’ordre unique** pour reconstruire la base applicative.

## Exécution (psql)

```bash
cd /workspaces/Gestion_gite-calvignac
psql "$DATABASE_URL" -f sql/rebuild/01_REBUILD_SITE_ORDER.sql
```

## Contenu

1. `01_REBUILD_SITE_ORDER.sql` : reconstruction complète + hardening + checks
2. `02_POST_REBUILD_CHECKLIST.md` : validations post-exécution

## Sources utilisées

- `sql/core/REBUILD_COMPLETE_DATABASE.sql`
- `sql/core/REBUILD_COMPLETE_DATABASE_PART2.sql`
- `sql/create_km_management.sql`
- `sql/create_linen_stock_transactions.sql`
- `sql/create_auto_ticket_tables.sql`
- `sql/migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql`
- `sql/security_hardening_rls_fiche_client_token.sql`
- `sql/securite/FIX_USER_ROLES_RLS_RECURSION_2026-02-23.sql`
- `sql/securite/RLS_HARDENING_TABLES_RESTANTES_2026-02-23.sql`
- `sql/securite/fiche_client_rls_lot3_postcheck_20260223.sql`
- `sql/securite/SUIVI_HEBDO_SECURITE_ADMIN_2026-02-23.sql`

## Notes

- Script orienté **reconstruction complète** (destructif sur la base cible).
- À utiliser sur nouvelle instance, préprod, ou cas catastrophe validé.
- Ne jamais exécuter en prod sans backup validé.
