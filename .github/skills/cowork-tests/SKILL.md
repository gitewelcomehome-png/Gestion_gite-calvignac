---
name: cowork-tests
description: "Coopération avec Claude Cowork (browser automation) pour tests automatiques après corrections. Utiliser pour : générer des scénarios de test après chaque correction de bug ou ajout de fonctionnalité, préparer un fichier de consignes pour Claude Cowork, lire et interpréter les résultats de test retournés. Ce skill définit le protocole complet de handoff entre Copilot (corrections) et Claude Cowork (exécution browser)."
argument-hint: "Décris la correction effectuée et la page concernée"
---

# Skill — Coopération Copilot ↔ Claude Cowork

## Vue d'ensemble du protocole

```
Copilot (corrections)
    │
    ├─ génère ──► tmp/cowork-pending-tests.json
    │
Claude Cowork (browser)
    │
    ├─ lit le fichier
    ├─ exécute les tests dans le navigateur
    └─ écrit ──► tmp/cowork-results.json
    │
Copilot (interprétation)
    ├─ lit les résultats
    ├─ crée tickets si échec (via auto-ticket-system)
    └─ nettoie tmp/ après validation
```

---

## Étape 1 — Après chaque correction : générer le fichier de tests

**OBLIGATOIRE** : Après toute correction de bug ou ajout de fonctionnalité, écrire `tmp/cowork-pending-tests.json`.

### Format du fichier

```json
{
  "meta": {
    "generated_at": "2026-03-28T10:00:00Z",
    "correction_summary": "Description courte de ce qui a été corrigé",
    "files_modified": ["js/reservations.js", "tabs/tab-reservations.html"],
    "copilot_version": "Copilot Claude Sonnet 4.6"
  },
  "auth": {
    "url": "https://liveownerunit.fr/pages/login.html",
    "email_env": "TEST_EMAIL",
    "password_env": "TEST_PASSWORD",
    "wait_for": "#app-container"
  },
  "scenarios": [
    {
      "id": "test-001",
      "name": "Nom court du test",
      "page": "/app.html",
      "tab": "reservations",
      "priority": "critical",
      "steps": [
        {
          "action": "navigate",
          "url": "https://liveownerunit.fr/app.html"
        },
        {
          "action": "click",
          "selector": "[data-tab='reservations']",
          "description": "Cliquer sur l'onglet Réservations"
        },
        {
          "action": "wait",
          "selector": "#planning-container",
          "timeout": 5000
        },
        {
          "action": "assert_visible",
          "selector": "#planning-container",
          "description": "Le planning doit être visible"
        },
        {
          "action": "assert_no_console_error",
          "description": "Aucune erreur console"
        }
      ],
      "expected_result": "Le planning des réservations s'affiche sans erreur console"
    }
  ]
}
```

### Actions disponibles pour les steps

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `navigate` | `url` | Naviguer vers une URL |
| `click` | `selector` | Cliquer sur un élément |
| `fill` | `selector`, `value` | Remplir un champ |
| `select` | `selector`, `value` | Sélectionner une option |
| `wait` | `selector`, `timeout` | Attendre qu'un élément soit présent |
| `wait_ms` | `ms` | Attendre N millisecondes |
| `assert_visible` | `selector`, `description` | Vérifier qu'un élément est visible |
| `assert_hidden` | `selector`, `description` | Vérifier qu'un élément est masqué |
| `assert_text` | `selector`, `expected`, `description` | Vérifier le texte d'un élément |
| `assert_value` | `selector`, `expected`, `description` | Vérifier la valeur d'un champ |
| `assert_url_contains` | `value` | Vérifier que l'URL contient une chaîne |
| `assert_no_console_error` | `description` | Vérifier l'absence d'erreurs console |
| `assert_count` | `selector`, `min`, `max` | Vérifier le nombre d'éléments |
| `screenshot` | `name` | Prendre une capture d'écran |
| `scroll_to` | `selector` | Scroller jusqu'à un élément |
| `hover` | `selector` | Survoler un élément |
| `key_press` | `key` | Appuyer sur une touche (ex: "Enter", "Escape") |

### Niveaux de priorité

| Priorité | Quand l'utiliser |
|----------|-----------------|
| `critical` | Fonctionnalité principale touchée par la correction |
| `high` | Effets de bord probables |
| `normal` | Vérification connexe |
| `smoke` | Test rapide de non-régression |

---

## Étape 2 — Instructions pour Claude Cowork

**Claude Cowork doit lire ce fichier et reproduire exactement les étapes.**

### Consignes générales pour Claude Cowork

```
MISSION : Exécuter les tests de l'application LiveOwnerUnit 
          définis dans tmp/cowork-pending-tests.json

CONTEXTE :
- Application SaaS de gestion de gîtes
- URL de prod : https://liveownerunit.fr
- Stack : Vanilla JS/HTML/CSS + Supabase
- Documentation des pages : voir docs/DOCUMENTATION_PAGES_*.md

AVANT DE COMMENCER :
1. Lire tmp/cowork-pending-tests.json
2. S'authentifier avec les credentials du bloc "auth"
3. Exécuter chaque scénario dans l'ordre
4. Pour chaque scénario noter : PASS / FAIL + raison si FAIL
5. Écrire les résultats dans tmp/cowork-results.json

RÈGLES :
- Ne jamais créer, modifier ou supprimer de données réelles
- Si un test modifie des données, les annuler après (bouton Annuler, navigation back)
- Prendre une capture d'écran sur chaque FAIL
- Un FAIL sur un test "critical" doit stopper la suite et alerter
```

---

## Étape 3 — Format des résultats (lu par Copilot)

Claude Cowork écrit `tmp/cowork-results.json` :

```json
{
  "meta": {
    "executed_at": "2026-03-28T10:15:00Z",
    "total": 3,
    "passed": 2,
    "failed": 1,
    "duration_ms": 45200
  },
  "results": [
    {
      "id": "test-001",
      "name": "Nom du test",
      "status": "PASS",
      "duration_ms": 12000,
      "steps_executed": 5,
      "notes": ""
    },
    {
      "id": "test-002",
      "name": "Nom du test en échec",
      "status": "FAIL",
      "duration_ms": 8000,
      "steps_executed": 3,
      "failed_at_step": 3,
      "error": "L'élément #planning-container n'est pas visible après 5000ms",
      "screenshot": "screenshots/test-002-fail.png",
      "console_errors": [
        "Uncaught TypeError: Cannot read property 'data' of undefined at reservations.js:142"
      ],
      "notes": "Le planning ne se charge pas"
    }
  ]
}
```

---

## Étape 4 — Interprétation des résultats par Copilot

Après execution des tests par Claude Cowork, lire `tmp/cowork-results.json` et appliquer :

```
SI tous les tests = PASS :
  → Confirmer la correction à l'utilisateur
  → Supprimer tmp/cowork-pending-tests.json et tmp/cowork-results.json
  → Log : "✅ [NomCorrection] — X/X tests passés"

SI au moins un test = FAIL sur priorité "critical" :
  → Analyser l'erreur + console_errors dans le résultat
  → Corriger le bug immédiatement
  → Régénérer tmp/cowork-pending-tests.json avec les tests FAIL uniquement
  → Demander à Claude Cowork de relancer

SI FAIL sur priorité "normal" ou "high" :
  → Analyser et décider si correction immédiate ou ticket
  → Si ticket : utiliser le système auto-ticket (window.autoTicketSystemInstance)
  → Format ticket : voir section ci-dessous
```

### Format ticket si FAIL non bloquant

```javascript
// Créer un ticket via le système existant
window.autoTicketSystemInstance?.createTicket({
  title: `[COWORK-TEST] ${result.name} — FAIL`,
  category: 'bug',
  priority: result.priority === 'critical' ? 'critique' : 'haute',
  description: `
Test automatique en échec après correction.
Étape échouée : step ${result.failed_at_step}
Erreur : ${result.error}
Console : ${result.console_errors?.join('\n') || 'aucune'}
  `.trim()
});
```

---

## Référence des sélecteurs clés par page

> Utiliser la documentation `docs/DOCUMENTATION_PAGES_*.md` pour les sélecteurs complets.
> Ce tableau couvre les éléments les plus fréquemment testés.

### Navigation principale (`app.html`)
| Élément | Sélecteur |
|---------|-----------|
| Onglet Dashboard | `[data-tab='dashboard']` |
| Onglet Réservations | `[data-tab='reservations']` |
| Onglet Ménage | `[data-tab='menage']` |
| Onglet Draps | `[data-tab='draps']` |
| Onglet Fiscalité | `[data-tab='fiscalite']` |
| Onglet Infos Gîtes | `[data-tab='infos-gites']` |
| Bouton notifications | `#notificationBtn` |

### Authentification (`pages/login.html`)
| Élément | Sélecteur |
|---------|-----------|
| Champ email | `input[name='email']` |
| Champ password | `input[name='password']` |
| Bouton connexion | `button[type='submit']` |
| Message erreur | `.alert-error` |

### Dashboard (`tabs/tab-dashboard.html`)
| Élément | Sélecteur |
|---------|-----------|
| Bouton actualiser | `button[onclick*='refreshDashboard']` |
| Container réservations semaine | `.reservations-semaine` |
| Todo list | `.todo-list` |
| KPI CA | `.kpi-ca` |

### Réservations (`tabs/tab-reservations.html`)
| Élément | Sélecteur |
|---------|-----------|
| Planning | `#planning-container` |
| Bouton actualiser | `button[onclick*='forceRefreshReservations']` |
| Recherche | `input[onchange*='filterReservations']` |
| Taxes séjour | `button[onclick*='openTaxesSejourModal']` |

### Ménage (`tabs/tab-menage.html`)
| Élément | Sélecteur |
|---------|-----------|
| Planning semaines | `#menagePlanningWeeks` |
| Bouton règles | `button[onclick*='showCleaningRulesModal']` |

---

## Checklist — Copilot avant de générer les tests

1. ✅ Identifier la page et les éléments touchés par la correction
2. ✅ Écrire au moins 1 test `critical` pour le comportement corrigé
3. ✅ Ajouter 1 test `smoke` de non-régression sur la page concernée
4. ✅ Vérifier que les sélecteurs existent bien dans la doc `DOCUMENTATION_PAGES_*.md`
5. ✅ Ne pas inclure d'étapes qui créent des données permanentes en prod

---

## Nettoyage après tests

```
tmp/cowork-pending-tests.json  → supprimer après validation
tmp/cowork-results.json        → supprimer après lecture
tmp/screenshots/               → archiver dans _archives/ ou supprimer
```

Le dossier `tmp/` doit rester **vide** entre les sessions de tests.
