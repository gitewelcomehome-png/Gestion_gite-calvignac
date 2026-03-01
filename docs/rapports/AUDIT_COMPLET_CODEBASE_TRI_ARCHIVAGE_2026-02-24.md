# Audit complet codebase — tri, archives, SQL rebuild

**Date :** 24/02/2026  
**Périmètre :** structure fichiers/dossiers, obsolescence, doublons, SQL rebuild, qualité de références.

---

## 1) Résumé exécutif

- ✅ Sauvegarde complète déjà réalisée avant opérations.
- ✅ Tri initial effectué avec archivage non destructif d’un lot sûr.
- ✅ Lot 2 safe partiel effectué (fichiers JS non référencés en runtime actif).
- ✅ Pack SQL de reconstruction complète créé (`sql/rebuild/`).
- ✅ Références locales actives corrigées (`MISSING_COUNT = 0` sur scan HTML actif).
- ⚠️ Plusieurs fichiers candidats obsolètes restent à traiter par lots prudents.

---

## 2) Actions réalisées

### 2.1 Archivage non destructif (lot sûr)

Dossier archive créé : `_archives/by_category/general/cleanup_20260224_154202/`

Déplacés en archive (backup/old/broken/test/demo non critiques) :
- `js/admin-content-ai-strategy-OLD.js`
- `js/dashboard-support-widget.js.broken`
- `js/dashboard.js.backup_avant_nettoyage`
- `js/reservations.js.backup`
- `js/reservations-NEW.js`
- `js/widget-ai-propositions.js`
- `js/widget-errors.js`
- `css/main-backup-v2.0.0.css`
- `pages/analyse-annonce.html`
- `pages/test-subscription-system.html`

Restauration immédiate (référencées runtime) :
- `pages/admin-clients-ameliorations-demo.html`
- `pages/dashboard-proposition.html`

### 2.2 Pack SQL rebuild créé

- `sql/rebuild/00_README_REBUILD_SITE.md`
- `sql/rebuild/01_REBUILD_SITE_ORDER.sql`
- `sql/rebuild/02_POST_REBUILD_CHECKLIST.md`

### 2.3 Archivage non destructif (lot 2 safe partiel)

Dossier archive créé : `_archives/by_category/general/cleanup_20260224_lot2_safe/`

Déplacés en archive (non référencés en runtime actif) :
- `js/calendrier-tarifs-simple.js`
- `js/calou-tab.js`
- `js/client-errors-ticket-integration.js`
- `js/custom-platform-select.js`
- `js/dashboard-communications.js`
- `js/theme-cleanup.js`
- `js/ticket-error-integration.js`

---

## 3) Incohérences / points à corriger

### 3.1 Références locales manquantes détectées (statut)

- ✅ Corrigé (`MISSING_COUNT = 0` sur scan des HTML actifs, hors `_versions` / `_archives`).

### 3.2 Doublons identifiés

- SQL doublon de nom (historique, désormais archivé) :
  - `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/migrations/create_admin_communications.sql`
  - `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/migrations/CREATE_ADMIN_COMMUNICATIONS.sql`
- JS basename dupliqué (contexte différent) :
  - `js/reservations.js`
  - `js/mobile/reservations.js`
- CSS basename dupliqué (contexte différent) :
  - `css/main.css`
  - `css/mobile/main.css`

---

## 4) Candidats obsolètes restants (après lot 2 safe)

### JS
- `js/calou-icons.js`
- `js/mobile.js`
- `js/sync-ical.js`

Archivés en lot MVP safe (24/02/2026) :
- `_archives/by_category/js/js_cleanup_20260224_mvp_safe/js/charges.js`
- `_archives/by_category/js/js_cleanup_20260224_mvp_safe/js/theme-colors.js`

### Pages
- `pages/desktop-owner-prestations.html` (à confirmer selon usage réel)
- `pages/logout.html` (vérifier si route encore utilisée)
- `pages/reset-password.html` (vérifier flux auth)

Archivés en lot MVP safe (24/02/2026) :
- `_archives/by_category/html/html_cleanup_20260224_mvp_safe/tabs/tab-calou-test.html`

---

## 5) Recommandations

1. Maintenir le contrôle des références locales actives avant chaque déploiement.
2. Traiter le solde du lot 2 (fichiers encore ambigus) en vérifiant les références JS dynamiques avant déplacement.
3. Conserver les doublons SQL `create_admin_communications` uniquement en archive (historique) et éviter leur réintroduction dans `sql/`.
4. Conserver `sql/rebuild/01_REBUILD_SITE_ORDER.sql` comme point d’entrée unique de reconstruction.

---

## 6) Statut final de cette passe

- Tri/archivage : **partiel sécurisé** (lot 1 terminé + lot 2 safe partiel)
- SQL rebuild : **terminé**
- Audit qualité/obsolescence : **terminé (avec plan de suite)**

---

## 7) Historique

- v1.0.0 (24/02/2026) : première passe complète d’audit, archivage lot 1, création pack SQL rebuild.
- v1.1.0 (24/02/2026) : corrections références locales actives + archivage lot 2 safe partiel.
- v1.2.0 (24/02/2026) : alignement des références SQL après cleanup (doublons `create_admin_communications` marqués comme historiques archivés).
- v1.3.0 (24/02/2026) : archivage JS MVP safe supplémentaire (`charges.js`, `theme-colors.js`) après vérification d’absence de références runtime actives.
- v1.4.0 (24/02/2026) : archivage HTML MVP safe (`tabs/tab-calou-test.html`) après contrôle de non-référence active (hors dépendances `node_modules`).
- v1.5.0 (24/02/2026) : passe CSS MVP safe effectuée ; aucun fichier `old/backup/test/demo` non archivé détecté hors dépendances, donc aucun archivage supplémentaire.
- v1.6.0 (24/02/2026) : passe Markdown racine MVP safe effectuée ; aucun candidat non essentiel à archiver (seul `README.md` présent et référencé).
