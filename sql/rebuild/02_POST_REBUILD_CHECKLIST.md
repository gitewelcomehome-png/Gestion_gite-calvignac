# Checklist post-rebuild

## Validation SQL

- [ ] `REBUILD_COMPLETE_DATABASE.sql` exécuté sans erreur
- [ ] `REBUILD_COMPLETE_DATABASE_PART2.sql` exécuté sans erreur
- [ ] `security_hardening_rls_fiche_client_token.sql` exécuté
- [ ] `FIX_USER_ROLES_RLS_RECURSION_2026-02-23.sql` exécuté
- [ ] `RLS_HARDENING_TABLES_RESTANTES_2026-02-23.sql` exécuté
- [ ] `fiche_client_rls_lot3_postcheck_20260223.sql` retourne des contrôles OK
- [ ] `SUIVI_HEBDO_SECURITE_ADMIN_2026-02-23.sql` retourne KPI attendus

## Validation applicative

- [ ] Connexion owner/admin OK
- [ ] Dashboard owner OK
- [ ] Dashboard admin OK
- [ ] Fiche client token OK
- [ ] Support/admin communications OK
- [ ] Synchronisation iCal OK

## Validation sécurité minimale

- [ ] Pas de récursion RLS `user_roles` (42P17)
- [ ] Pas de policy anon permissive critique
- [ ] Tables critiques en RLS + FORCE RLS

## Référence

- Architecture: `docs/ARCHITECTURE.md`
- Historique incidents: `docs/architecture/ERREURS_CRITIQUES.md`
