# LiveOwnerUnit — Contexte Claude Code

> Lis ce fichier avant toute action. Il remplace tout briefing verbal.

## Projet
App web gestion gîte pour Stéphane (liveownerunit.fr).
Stack : Vanilla JS ES6 + Supabase + Vercel.
Repo : gitewelcomehome-png/Gestion_gite-calvignac

## Architecture
| Couche | Détail |
|--------|--------|
| Frontend | js/, pages/ — SPA vanilla JS |
| Backend | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Hosting | Vercel (auto-deploy GitHub) |
| Branches | main=prod · preprod=staging (TOUJOURS travailler sur preprod) |

## Règle fondamentale — 3 agents
```
STÉPHANE (décisionnaire)
    ↓
CLAUDE CODE (toi — analyse, diagnostique, rédige)
    ↓ instructions courtes (3-6 lignes max)
COPILOT (panel droit — code, commits, push)
```
**Claude Code ne modifie JAMAIS le code. Il instruit Copilot.**

## Démarrage de session
```bash
bash .claude/scripts/start-session.sh
```

## Économie de tokens
- Lire .claude/memory/session-latest.md pour reprendre où on s'est arrêté
- Lire .claude/memory/roadmap-state.md pour l'état roadmap
- 1 screenshot max par diagnostic, utiliser les logs

## Stack Supabase — patterns clés
- Auth : supabase.auth.getSession() → user.id
- Tables : gites, reservations, taches, prestations_catalogue, cm_clients
- RLS actif partout — vérifier owner_user_id = auth.uid()
- RPC : get_fiscal_data(), get_dashboard_stats(), get_prestations_owner()

## Fichiers clés
| Fichier | Rôle |
|---------|------|
| js/utils.js | Fonctions partagées (showError, formatCurrency, showToast) |
| js/app.js | Entry point SPA, routing |
| js/supabase.js | Client Supabase singleton |
| .claude/memory/ | État sessions et roadmap |
| .claude/templates/ | Templates réutilisables |

## Format instruction Copilot (TOUJOURS ce format)
```
Fichier : `js/nom.js` ligne ~XX
Action : [1 phrase]
Pattern : [avant/après]
Résultat : [comportement cible]
Commit : "fix: description"
```

## Bugs actifs
- BUG-004 : admin-dashboard.html → 404 (Issue #6)
- ANOM-001 : Trésorerie = `-` (suivi_soldes_bancaires vide 2026, Issue #7)
- ANOM-002 : admin-clients.html nb_gites_max mauvaise table

## Roadmap rapide
- ✅ Niveau 0 — Corrections
- 🔵 Niveau 1 — Solidité (EN COURS → roadmap-state.md)
- ⬜ Niveau 2 — Intelligence sans IA
- ⬜ Niveau 3 — API Anthropic
- ⬜ Niveau 4 — Vision long terme
