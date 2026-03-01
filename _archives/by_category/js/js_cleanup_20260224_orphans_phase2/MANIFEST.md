# Manifest — js_cleanup_20260224_orphans_phase2

Date: 2026-02-24  
Type: Archivage JS orphelins (scan références HTML actives)

## Fichiers déplacés
- `js/calou-icons.js` → `_archives/by_category/js/js_cleanup_20260224_orphans_phase2/calou-icons.js`
- `js/mobile.js` → `_archives/by_category/js/js_cleanup_20260224_orphans_phase2/mobile.js`
- `js/sync-ical.js` → `_archives/by_category/js/js_cleanup_20260224_orphans_phase2/sync-ical.js`

## Justification
- Non référencés par les HTML actifs du périmètre runtime courant.
- `sync-ical-v2.js` est la version active chargée par `app.html`.

## Risque
- Faible (aucune référence active détectée au moment du déplacement).

## Rollback
- Déplacer les 3 fichiers vers `js/` si une dépendance runtime non détectée apparaît.
