# Manifest archive JS — MVP safe

Date: 2026-02-24
Objectif: archiver uniquement les JS sans référence runtime active vérifiée.

## Éléments déplacés

- js/charges.js
- js/theme-colors.js

## Méthode de sécurité

Vérification par recherche de références actives (hors `_archives`, `_versions`, `_backups`, `docs`) avant déplacement.
