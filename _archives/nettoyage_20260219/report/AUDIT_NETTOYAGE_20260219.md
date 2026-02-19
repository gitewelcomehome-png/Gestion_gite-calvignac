# Audit Nettoyage - 19/02/2026

## Portée
- Objectif: nettoyage sûr sans impact production.
- Contraintes appliquées: aucune modification `index.html`, aucune modification BDD, archivage uniquement de fichiers non référencés.

## Actions réalisées

### 1) Archivage MD racine non référencés
Fichiers déplacés vers `_archives/nettoyage_20260219/md/`:
- `IDEES_AMELIORATION_FICHE_CLIENTS.md`
- `RESPONSIVE_SUMMARY.md`

### 2) Vérification SQL racine
- `check-cancelled-status.sql` **non archivé** (conservé) car référencé dans `docs/ARCHITECTURE.md`.
- Recommandation: soit le laisser en racine, soit le déplacer vers `sql/` dans un lot dédié avec mise à jour documentaire.

### 3) Détection JS déclassés (non référencés par `app.html`, `pages/**/*.html`, `tabs/**/*.html`)
Comptage:
- JS référencés: **79**
- JS présents: **97**
- Candidats non référencés: **19**

Liste des candidats:
- `js/admin-content-ai-strategy-OLD.js`
- `js/admin-content-analytics.js` *(utilisé par `pages/admin-content-analytics.html`)*
- `js/calendrier-tarifs-simple.js`
- `js/calou-icons.js` *(mentionné dans `tabs/tab-calou-test.html`)*
- `js/calou-tab.js`
- `js/charges.js`
- `js/client-errors-ticket-integration.js`
- `js/custom-platform-select.js`
- `js/dashboard-communications.js`
- `js/mobile.js` *(mention documentation interne)*
- `js/mobile/init.js` *(chargé dynamiquement dans `app.html`)*
- `js/mobile/reservations.js`
- `js/reservations-NEW.js`
- `js/sync-ical.js` *(mention commentaire dans `app.html`)*
- `js/theme-cleanup.js`
- `js/theme-colors.js`
- `js/ticket-error-integration.js`
- `js/widget-ai-propositions.js`
- `js/widget-errors.js`

## Recommandation d’archivage JS en lot 2 (faible risque)
Archivable immédiatement (aucune référence trouvée dans `app.html`, `pages/`, `tabs/`, `js/`, `api/`, `config/`, `scripts/`):
- `js/admin-content-ai-strategy-OLD.js`
- `js/calendrier-tarifs-simple.js`
- `js/calou-tab.js`
- `js/charges.js`
- `js/client-errors-ticket-integration.js`
- `js/custom-platform-select.js`
- `js/dashboard-communications.js`
- `js/reservations-NEW.js`
- `js/theme-cleanup.js`
- `js/theme-colors.js`
- `js/ticket-error-integration.js`
- `js/widget-ai-propositions.js`
- `js/widget-errors.js`
- `js/mobile/reservations.js`

À conserver pour l’instant:
- `js/mobile/init.js`
- `js/admin-content-analytics.js`
- `js/calou-icons.js`
- `js/mobile.js`
- `js/sync-ical.js`

## Rollback rapide
- Les fichiers MD archivés sont restaurables via:
  - `mv _archives/nettoyage_20260219/md/<fichier> ./`
