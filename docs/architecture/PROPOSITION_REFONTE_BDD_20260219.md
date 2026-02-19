# Proposition refonte BDD (sans changement immédiat)

## Contexte
- Site en production, clients réels.
- Objectif: simplifier et accélérer la BDD sans casser l’existant.
- Contraintes: **zéro migration exécutée** dans ce lot.

## Constats (usage code)
Tables les plus sollicitées côté code:
- `reservations`, `gites`, `cleaning_schedule`, `todos`
- `cm_support_tickets`, `cm_error_logs`, `cm_clients`
- `checklist_templates`, `fiscal_history`, `demandes_horaires`

Constat structurel:
- Domaines métier mélangés (opérationnel gîtes + support SaaS + marketing IA) dans une même surface de schéma.
- Coexistence d’anciennes et nouvelles tables/fonctions (ex: `checklists` vs `checklist_templates`, variantes `reservations`/`reservations-NEW` côté JS historique).

## Cible de refonte (compatibilité d’abord)

### 1) Découpage logique par domaine (sans rename immédiat)
- Domaine **core_owner**: `gites`, `reservations`, `cleaning_schedule`, `linen_*`, `faq`, `infos_gites`.
- Domaine **ops_support**: `cm_support_*`, `cm_error_*`, `admin_communications`.
- Domaine **business_growth**: `cm_promotions`, `referrals`, `user_subscriptions`, `cm_invoices`.

### 2) Contrats de lecture stables via vues
Créer des vues de compatibilité (phase future):
- `v_reservations_active`
- `v_todos_open`
- `v_support_tickets_open`
- `v_cleaning_next_30d`

But: isoler les pages front des futures évolutions de tables.

### 3) Normalisation des conventions
- Clés: `id UUID`, `owner_user_id UUID`, `gite_id UUID`, timestamps homogènes.
- États: standardiser `status/statut` sur des enums cohérents.
- JSON: limiter les champs JSON non indexés sur flux critiques.

### 4) Performance
- Index composites cibles (phase migration future):
  - `reservations(owner_user_id, gite_id, date_arrivee, date_depart)`
  - `cleaning_schedule(owner_user_id, date_menage)`
  - `todos(owner_user_id, statut, due_date)`
  - `cm_support_tickets(client_id, status, created_at)`
- Requêtes dashboard: basculer progressivement sur vues matérialisées/agrégats journaliers.

### 5) Plan de migration sans casse (proposé)
1. **Inventaire SQL réel**: mapper chaque requête front/API → table/colonnes.
2. **Vues de compatibilité**: introduire des vues sans toucher les écrans.
3. **Dual-write contrôlé** (si nécessaire): écrire ancien+nouv. schéma derrière fonctions SQL.
4. **Bascules écran par écran** avec feature flags.
5. **Décommission** après 2 cycles sans incidents.

## Quick wins (sans migration)
- Geler la création de nouvelles tables hors domaines ci-dessus.
- Ajouter une matrice de dépendances table ↔ fichiers JS/API.
- Prioriser les endpoints/dashboard qui sur-sollicitent `reservations` et `cm_support_tickets`.

## Risques à maîtriser
- Régressions RLS si migration hâtive.
- Endpoints admin/support impactés par renommages prématurés.
- Duplication métier entre anciennes et nouvelles structures si dual-write non borné.

## Décision de ce lot
- ✅ Analyse terminée.
- ✅ Aucun changement de schéma ni migration exécutée.
- ✅ Proposition prête pour lot suivant (design + migration dry-run).
