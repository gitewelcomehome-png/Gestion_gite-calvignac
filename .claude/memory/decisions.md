# Log des décisions architecturales

## 2026-04-16
**Décision :** Création structure .claude/ dans le repo
**Raison :** Claude Code (Codespace) a tout le contexte sans passer par Cowork
**Impact :** Moins de tokens Cowork, meilleure continuité entre sessions

## 2026-03-30
**Décision :** created_at à la place de date_commande (inexistante)
**Raison :** FIX-003/004 — colonne absente de la table prestations
**Impact :** Correction bugs desktop-owner-prestations.js et admin-prestations.js

## Conventions établies
- Toujours travailler sur preprod, merger vers main après validation Vercel
- Format instruction Copilot : Fichier / Action / Pattern / Résultat / Commit
- Fonctions utilitaires communes dans js/utils.js
- RPC Supabase préférées aux requêtes directes pour calculs complexes
