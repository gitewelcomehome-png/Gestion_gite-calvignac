# État Roadmap — LiveOwnerUnit
*Mis à jour : 2026-04-16*

## Niveau 0 — Corrections ✅ TERMINÉ
- FIX-003 : date_commande → created_at (desktop-owner-prestations.js) ✅
- FIX-004 : date_commande → created_at (admin-prestations.js) ✅
- FIX-005 : redirects parasites ✅

## Niveau 1 — Solidité 🔵 EN COURS
| # | Tâche | Statut |
|---|-------|--------|
| 1.1 | js/utils.js — fonctions partagées | 🔵 Instruction envoyée Copilot |
| 1.2 | Loading skeletons dashboard | ⬜ À faire |
| 1.3 | Validation formulaires | ⬜ À faire |
| 1.4 | Détection hors-ligne | ⬜ À faire |
| 1.5 | Page 404 personnalisée | ⬜ À faire |

## Niveau 2 — Intelligence sans IA ⬜ À VENIR
- Calcul trésorerie réel, taux occupation, alertes auto, Chart.js revenus

## Niveau 3 — API Anthropic ⬜ À VENIR
- Vercel Edge Functions : suggest-message, analyze-reviews, predict-revenue, chat-owner

## Niveau 4 — Vision long terme ⬜ À VENIR
- Channel Manager IA, prix dynamique, rapport fiscal auto

## Bugs actifs
| ID | Description | Issue |
|----|-------------|-------|
| BUG-004 | admin-dashboard.html → 404 | #6 |
| ANOM-001 | Trésorerie = `-` (suivi_soldes_bancaires vide 2026) | #7 |
| ANOM-002 | admin-clients.html : nb_gites_max mauvaise table | — |
