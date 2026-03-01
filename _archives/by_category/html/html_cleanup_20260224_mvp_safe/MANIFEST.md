# Manifest archive HTML — MVP safe

Date: 2026-02-24
Objectif: archiver uniquement les pages HTML de test/demo sans référence runtime active.

## Élément déplacé

- tabs/tab-calou-test.html

## Méthode de sécurité

- Sélection via motif test/demo/old/backup
- Vérification de non-référence active (hors `_archives`, `_versions`, `_backups`, `docs`)
- Exclusion explicite des chemins `node_modules`
