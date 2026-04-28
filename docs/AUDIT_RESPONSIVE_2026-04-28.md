# Audit Responsive — Gestion Gîte Calvignac
**Date :** 28 avril 2026  
**Branche :** preprod  
**Périmètre :** css/, pages/, app.html, *.html racine

---

## 1. Fichiers avec media queries

### CSS (18 fichiers)
| Fichier | Présence `@media` |
|---|---|
| css/main.css | ✅ |
| css/mobile-fix.css | ✅ (MOB-005) |
| css/mobile/main.css | ✅ |
| css/tab-reservations.css | ✅ |
| css/tab-menage.css | ✅ |
| css/tab-calendrier.css | ✅ |
| css/tab-fiscalite.css | ✅ |
| css/tab-communaute.css | ✅ |
| css/tab-statistiques.css | ✅ |
| css/gite-form-modern.css | ✅ |
| css/admin-support.css | ✅ |
| css/admin-dashboard.css | ✅ |
| css/admin-finance.css | ✅ |
| css/admin-promotions.css | ✅ |
| css/client-support.css | ✅ |
| css/notifications.css | ✅ |
| css/subscription-styles.css | ✅ |
| css/tab-reservations.css | ✅ |

### Pages HTML (avec media queries internes)
`pages/fiche-client.html`, `pages/femme-menage.html`, `pages/onboarding.html`, `pages/options.html`, `pages/validation.html`, `pages/admin-channel-manager.html`, `pages/admin-ticket-workflow.html`, `pages/admin-performance-audit.html`, `pages/admin-security-audit.html`, `pages/admin-fiscal-readable-report.html`, `pages/admin-surveillance-evolution.html`, `pages/dashboard-proposition.html`, `pages/desktop-owner-prestations.html`, `app.html`, `commercial.html`, `index.html`

---

## 2. Breakpoints utilisés dans le projet

| Occurrences | Breakpoint | Statut |
|---|---|---|
| **38** | `max-width: 768px` | ✅ Standard mobile |
| **12** | `max-width: 480px` | ✅ Standard petit mobile |
| **6** | `max-width: 1200px` | ℹ️ Tablette/desktop |
| **5** | `max-width: 1024px` | ℹ️ Tablette |
| **3** | `max-width: 980px` | ⚠️ Non standard |
| **2** | `max-width: 900px` | ⚠️ Non standard |
| **1** | `max-width: 860px` | ⚠️ Non standard |
| **1** | `max-width: 640px` | ⚠️ Non standard |
| **1** | `max-width: 600px` | ⚠️ Non standard (proche de 480) |
| **1** | `max-width: 375px` | ⚠️ iPhone SE — utile mais ponctuel |

### Breakpoints standards à adopter
```
768px  → Mobile (smartphones, portrait)
480px  → Petit mobile (iPhone SE, Android compact)
1024px → Tablette (optionnel, si besoin)
```
> Éliminer progressivement 860px, 900px, 980px au profit de 768px ou 1024px.

---

## 3. Pages SANS breakpoint mobile (26 pages)

### Pages prioritaires — accès utilisateur réel

| Page | Audiences | Inputs | Priorité |
|---|---|---|---|
| `pages/login.html` | Tous les propriétaires | 2 | 🔴 CRITIQUE |
| `pages/forgot-password.html` | Tous les propriétaires | 1 | 🔴 CRITIQUE |
| `pages/reset-password.html` | Tous les propriétaires | 2 | 🔴 CRITIQUE |
| `pages/client-support.html` | Voyageurs/propriétaires | 5 | 🔴 CRITIQUE |
| `pages/admin-channel-manager.html` | Admin SaaS | 0 | 🟡 HAUTE |

### Pages admin — usage desktop probable (medium)

| Page | Audiences |
|---|---|
| `pages/admin-support.html` | Admin |
| `pages/admin-communications.html` | Admin |
| `pages/admin-emails.html` | Admin |
| `pages/admin-finance.html` | Admin |
| `pages/admin-monitoring.html` | Admin |
| `pages/admin-promotions.html` | Admin |
| `pages/admin-clients.html` | Admin |
| `pages/admin-prestations-stats.html` | Admin |
| `pages/admin-prompt-editor.html` | Admin |
| `pages/admin-content-analytics.html` | Admin |
| `pages/admin-error-details.html` | Admin |
| `pages/admin-scalabilite-roadmap.html` | Admin |
| `pages/admin-security-audit.html` | Admin |
| `pages/admin-surveillance-evolution.html` | Admin |
| `pages/admin-ticket-workflow.html` | Admin |
| `pages/admin-fiscal-readable-report.html` | Admin |
| `pages/admin-performance-audit.html` | Admin |

### Pages à faible criticité

| Page | Raison |
|---|---|
| `pages/conformite-rgpd-securite.html` | Page légale, lecture seule |
| `pages/dashboard-proposition.html` | Démo/proposition |
| `pages/test-fixes.html` | Page de test |
| `pages/logout.html` | Redirect simple |

---

## 4. Corrections déjà appliquées (session du 28/04/2026)

| ID | Fichier | Description | Commit |
|---|---|---|---|
| MOB-001 | pages/fiche-client.html | Bottom-nav scrollable horizontal | 67ed4eb |
| MOB-002 | css/tab-calendrier.css | Calendrier 7 colonnes au lieu de 4 | 238d1ad |
| MOB-003 | pages/fiche-client.html | Header compact (min-height 140px/110px) | fe43aef |
| MOB-004 | app.html | Hamburger 44px, badge QUATTRO masqué | d6a383c |
| MOB-005 | css/mobile-fix.css (nouveau) | Inputs 16px anti-zoom iOS (31 pages) | 0f8b412 |
| MOB-006 | pages/fiche-client.html | Suppression scroll horizontal 2129px | a3648af |
| MOB-008 | pages/fiche-client.html | Fade mask-image sur tab-navigation | efc9f69 |

---

## 5. Plan de correction recommandé

### Sprint 1 — Pages critiques accès utilisateur
1. `pages/login.html` — media query 768px + formulaire centré
2. `pages/forgot-password.html` — même traitement
3. `pages/reset-password.html` — même traitement
4. `pages/client-support.html` — responsive complet (5 inputs, viewport voyageur)

### Sprint 2 — Admin channel manager
5. `pages/admin-channel-manager.html` — responsive tableau de bord

### Sprint 3 — Clean-up breakpoints
6. Harmoniser les breakpoints non standard (860px, 900px, 980px) → 768px ou 1024px

### Sprint 4 — Pages admin (si accès mobile demandé)
7. Admin pages restantes selon besoin métier

---

## 6. Note sur la couverture `mobile-fix.css`

`css/mobile-fix.css` (MOB-005) injecte `font-size: 16px !important` sur tous les inputs/textarea/select dans un `@media (max-width:768px)`.  
Il est chargé via `<link>` dans les 31 pages HTML contenant des inputs.  
Pages **ne chargeant pas** `main.css` et donc dépendant du `<link>` direct : `pages/client-support.html`, `pages/fiche-client.html`, et la majorité des pages admin.
