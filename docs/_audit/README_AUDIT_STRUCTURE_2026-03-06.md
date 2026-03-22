# Audit Structure Complet - 2026-03-06

Objectif: verifier exhaustivement les references table/colonnes du code actif contre le schema SQL canonique et contre l'export colle.

## Sources auditees

- Code actif: `js/`, `pages/`, `tabs/`, `api/`, `supabase/functions/`
- Schema canonique: `sql/rebuild/01_REBUILD_SITE_ORDER.sql` et fichiers inclus
- Export colle: `docs/EXPORT_SUPABASE_VALIDATION.md` section JSON

## Rapports generes

- `docs/_audit/active_code_table_mismatch.json`
- `docs/_audit/active_code_column_mismatch.json`
- `docs/_audit/runtime_vs_export_coverage.json`

## Resultat global

- Le code actif reference plus de tables que le schema canonique rebuild (modele hybride legacy + nouveau).
- L'export colle couvre la majorite des tables runtime hors-canonique.
- Certaines differences de colonnes existent (souvent alias legacy), a valider avant import final.

## Points de vigilance majeurs

- La table runtime `user_notification_preferences` est utilisee dans le code et les fonctions edge, alors que le schema canonique rebuild contient `notification_preferences`.
- Plusieurs champs utilises dans le code sont des alias legacy (`gites`, `date_fin`, `statut`, etc.) et doivent etre mappes si la table cible n'a que les noms canoniques.
- Les tables manquantes deja identifiees dans `docs/EXPORT_SUPABASE_VALIDATION.md` restent a traiter selon criticite.

## Limite technique

Audit statique heuristique: detecte les references explicites (from/select/insert/update) mais pas 100% des constructions dynamiques de requetes.
# Audit Structure Complet - 2026-03-06

Objectif: verifier exhaustivement les references table/colonnes du code actif contre le schema SQL canonique et contre l'export colle.

## Sources auditees

- Code actif: `js/`, `pages/`, `tabs/`, `api/`, `supabase/functions/`
- Schema canonique: `sql/rebuild/01_REBUILD_SITE_ORDER.sql` et fichiers inclus
- Export colle: `docs/EXPORT_SUPABASE_VALIDATION.md` section JSON

## Rapports generes

- `docs/_audit/active_code_table_mismatch.json`
- `docs/_audit/active_code_column_mismatch.json`
- `docs/_audit/runtime_vs_export_coverage.json`

## Resultat global

- Le code actif reference plus de tables que le schema canonique rebuild (modele hybride legacy + nouveau).
- L'export colle couvre la majorite des tables runtime hors-canonique.
- Certaines differences de colonnes existent (souvent alias legacy), a valider avant import final.

## Points de vigilance majeurs

- La table runtime `user_notification_preferences` est utilisee dans le code et les fonctions edge, alors que le schema canonique rebuild contient `notification_preferences`.
- Plusieurs champs utilises dans le code sont des alias legacy (`gites`, `date_fin`, `statut`, etc.) et doivent etre mappes si la table cible n'a que les noms canoniques.
- Les tables manquantes deja identifiees dans `docs/EXPORT_SUPABASE_VALIDATION.md` restent a traiter selon criticite.

## Limite technique

Audit statique heuristique: detecte les references explicites (from/select/insert/update) mais pas 100% des constructions dynamiques de requetes.
