# SKILL — LiveOwnerUnit / Gestion_gite-calvignac
> Connaissance globale du projet pour testeur/correcteur/organisateur IA

---

## 🏠 VUE D'ENSEMBLE

**Nom** : LiveOwnerUnit — Gestion Synchronisée de Gîtes  
**URL prod** : https://www.liveownerunit.fr/app  
**Repo** : https://github.com/gitewelcomehome-png/Gestion_gite-calvignac  
**Déploiement** : Vercel (500+ deployments)  
**Version actuelle** : v6.4.0  
**Compte admin** : gite.welcomehome@gmail.com (plan QUATTRO)

### 4 Gîtes gérés
| ID | Nom | Couleur UI |
|----|-----|-----------|
| 1 | Trévoux | Bleu |
| 2 | Couzon | Rose/Rouge |
| 3 | 3ème | Vert |
| 4 | 4ème | Violet |

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack
- **Frontend** : Vanilla HTML5 / CSS3 / JavaScript ES6+ (multi-page app)
- **Backend** : Supabase (PostgreSQL + Auth + RLS + RPCs SECURITY DEFINER)
- **Déploiement** : Vercel (`vercel dev` local, `vercel --prod`)
- **Email** : Nodemailer
- **Mobile** : Expo / React Native (dossier `mobile-app/`)
- **iCal Sync** : Airbnb via iCal (js/ical-config-modern.js)

### Sécurité
- Row Level Security (RLS) Supabase sur toutes les tables
- RPCs SECURITY DEFINER pour contourner Kong/PostgREST
- Headers Vercel : X-Frame-Options SAMEORIGIN, CSP, Referrer-Policy
- Pre-commit hook anti-secrets (.githooks/)
- Rate limiting (js/rate-limiter.js)

### Dépendances principales
```json
"@supabase/supabase-js": "2.39.0"
"expo": "~51.0.0"
"nodemailer": "^6.9.8"
"react": "18.2.0" (mobile)
"react-native": "0.74.5" (mobile)
```

---

## 📁 STRUCTURE DU PROJET

```
/
├── pages/          # 35+ pages HTML (admin + client)
├── js/             # 45+ modules JavaScript
├── css/            # Styles
├── api/            # Vercel serverless (dossier functions/)
├── supabase/       # Edge functions Supabase
│   └── functions/
│       ├── confirm-commande-prestations/
│       └── notify-cleaning-planning-change/
├── sql/            # Migrations SQL
│   ├── migrations/ # Migrations nommées avec date
│   ├── securite/   # RLS et sécurité
│   ├── couzon/     # Scripts spécifiques gîte
│   └── rebuild/    # Scripts de reconstruction
├── config/         # Configuration (PROMPT_CLAUDE_BASE.md)
├── mobile-app/     # App React Native / Expo
├── assets/         # Images, icônes
├── docs/           # Documentation
├── scripts/        # Scripts utilitaires
├── tabs/           # Onglets HTML partiels
├── sql/            # Migrations base de données
├── _archives/      # Archives anciennes versions
├── _backups/       # Sauvegardes
├── _versions/      # Snapshots versions
├── CHANGELOG.md    # Historique versions
└── .github/        # Templates PR et Issues
```

---

## 📄 PAGES PRINCIPALES

### Navigation principale (app)
| Page | Fichier HTML | JS associé |
|------|-------------|-----------|
| Dashboard | app → index | js/dashboard.js |
| Réservations | pages/ | js/reservations.js |
| Tâches (Kanban) | pages/ | js/dashboard.js |
| Stats | pages/ | — |
| Prestations | pages/ | js/prestations.js |
| Draps | pages/ | js/draps.js |
| Ménage | pages/ | — |
| Fiscal | pages/ | js/fiscalite-v2.js |
| Découvrir | pages/ | js/decouvrir.js |
| Cal. & Tarifs | pages/ | js/ical-config-modern.js |
| Infos | pages/ | — |
| Communauté | pages/ | js/communaute.js |

### Pages Admin
- admin-channel-manager.html
- admin-clients.html / admin-clients-ameliorations-demo.html
- admin-communications.html
- admin-content.html / admin-content-analytics.html
- admin-emails.html
- admin-finance.html / admin-fiscal-readable-report.html
- admin-monitoring.html
- admin-parrainage.html
- admin-performance-audit.html
- admin-prestations.html / admin-prestations-stats.html
- admin-promotions.html
- admin-prompt-editor.html
- admin-scalabilite-roadmap.html
- admin-security-audit.html
- admin-support.html
- admin-surveillance-evolution.html
- admin-ticket-workflow.html

### Pages Client
- pages/fiche-client.html — fiche client publique (RPC anon)
- pages/login.html / logout.html
- pages/onboarding.html
- pages/options.html
- pages/forgot-password.html / reset-password.html
- pages/validation.html
- pages/client-support.html

---

## 🔧 MODULES JS CLÉS

| Fichier | Rôle |
|---------|------|
| auth.js | Auth Supabase, session, garde-fous erreurs |
| gites-manager.js | CRUD gîtes, couleurs, synchronisation |
| reservations.js | Gestion réservations Airbnb + manuel |
| dashboard.js | Tableau de bord, tâches, widget |
| prestations.js | Commandes prestations |
| fiscalite-v2.js | Calculs fiscaux, taxes séjour |
| ical-config-modern.js | Sync iCal Airbnb, calendrier & tarifs |
| ai-assistant.js | Assistant IA intégré |
| fiche-client.js | Fiche client publique (RPC sécurisé) |
| gites-crud.js | CRUD complet gîtes |
| gites-photos.js | Gestion photos gîtes |
| security-utils.js | Utilitaires sécurité |
| rate-limiter.js | Rate limiting requêtes |
| validation-utils.js | Validation formulaires |
| communaute.js | Communauté artisans |
| parrainage.js | Système parrainage |
| draps.js | Gestion linge/draps |
| archives.js | Archivage données |

---

## 🗄️ BASE DE DONNÉES (Supabase)

### Tables principales identifiées
- `gites` — Les 4 gîtes (Trévoux, Couzon, 3ème, 4ème)
- `reservations` — Réservations synchronisées Airbnb + manuelles
- `prestations` — Catalogue prestations disponibles
- `commandes_prestations` — Commandes clients
- `notification_preferences_owner` — Préférences notifications propriétaire
- `communaute_artisans` — Réseau artisans/prestataires

### Migrations récentes (2026)
- ADD_GITES_CATEGORIE_HEBERGEMENT (mars 2026)
- ADD_NOTIFICATION_MENAGE_COMPANY_FIELDS (mars 2026)
- RLS_ALIGN_FICHE_CLIENT_FEMME_MENAGE (mars 2026)
- RLS_HARDENING_CM_TABLES (mars 2026)
- MIGRATION_REMOVE_LOCALSTORAGE (mars 2026)

### Fonctions Supabase Edge
- `confirm-commande-prestations` — Confirmation commande
- `notify-cleaning-planning-change` — Notif changement planning ménage

---

## 🌿 STRATÉGIE VERSIONNING GIT

### Branches
| Branche | Rôle |
|---------|------|
| `main` | Production — code stable déployé |
| `develop` | Intégration — tests avant prod |
| `feature/*` | Nouvelles fonctionnalités |
| `fix/*` | Corrections bugs |
| `security/*` | Correctifs sécurité |
| `release/*` | Candidats release |

### Convention commits
```
feat:     nouvelle fonctionnalité
fix:      correction bug
chore:    maintenance (deps, config)
docs:     documentation
security: correctif sécurité
sql:      migration base de données
refactor: refactoring sans changement comportement
```

### Tags sémantiques
- v1.0.0-stable → v3.0 → v5.1.0 → v5.2.0 → v6.2.0 → **v6.4.0** (actuel)

---

## 🧪 SCHÉMAS DE TESTS

### Tests Unitaires (js/)
| Module | Test prioritaire |
|--------|----------------|
| auth.js | Login/logout, session expiry, guard |
| reservations.js | Sync iCal, création manuelle, statuts |
| fiscalite-v2.js | Calcul taxes, arrondi, edge cases |
| gites-manager.js | CRUD, couleurs, 4 gîtes |
| rate-limiter.js | Throttle, burst, reset |
| validation-utils.js | Formats email, dates, montants |

### Tests d'Intégration (Supabase)
| Scenario | Tables |
|----------|--------|
| Réservation Airbnb sync | reservations + gites |
| Commande prestation | commandes_prestations + reservations |
| Fiche client RPC | fiche-client (anon) |
| RLS policies | Toutes tables — accès propriétaire vs anon |

### Tests E2E (Playwright recommandé)
| Parcours | Pages |
|----------|-------|
| Login → Dashboard → Résa | login → app → réservations |
| Créer tâche Kanban | tâches |
| Commander une prestation | prestations → validation |
| Consulter fiche client | fiche-client (lien token) |
| Admin channel manager | admin-channel-manager |

---

## ⚠️ POINTS D'ATTENTION / BUGS CONNUS

1. **fiche-client** — RPC SECURITY DEFINER nécessaire (Kong/PostgREST)
2. **iCal sync** — Dépendance Airbnb, vérifier timeout
3. **IA tarifaire** — Guardrails à surveiller (prixBase ×2 max)
4. **Mobile app** — Expo v51 + React Native 0.74.5 (à maintenir)
5. **tabs/tab-fiscalite-v2.html** — Fichier modifié non commité sur main

---

## 🚀 COMMANDES UTILES

```bash
# Développement local
npm run dev          # vercel dev

# Déploiement
npm run deploy       # vercel --prod

# Git workflow
git checkout develop
git checkout -b feature/ma-feature
git push origin feature/ma-feature
# → PR vers develop → review → merge → PR develop→main → tag

# Supabase
supabase functions deploy confirm-commande-prestations
supabase functions deploy notify-cleaning-planning-change
```

---

## 📋 CHECKLIST PR / DEPLOY

- [ ] Testé en local `vercel dev`
- [ ] Testé les 4 gîtes (Trévoux, Couzon, 3ème, 4ème)
- [ ] RLS policies vérifiées
- [ ] Pas de secrets dans le code
- [ ] CHANGELOG.md mis à jour
- [ ] Version `package.json` incrémentée si besoin
- [ ] Tag git créé si release

---

## 🔍 TOUR VISUEL ADMIN — 22 mars 2026 (production https://www.liveownerunit.fr/app)

Tour complet des 21 pages admin effectué sur le site de production connecté en tant que QUATTRO.

| Page | Statut | Observations |
|------|--------|--------------|
| admin-clients.html | ✅ OK | Liste clients fonctionnelle, recherche, modals détail. Bugs "null null" (contact vide) et "0/undefined" (nb_gites_max absent de cm_clients) → **CORRIGÉS commit aff336e** |
| admin-communications.html | ✅ OK | Gestion templates email/SMS, liste des communications envoyées |
| admin-content.html | ✅ OK | Gestion contenus éditoriaux du site |
| admin-content-analytics.html | ✅ OK | Stats consultation contenus, métriques pages |
| admin-emails.html | ✅ OK | Templates emails transactionnels, prévisualisation |
| admin-error-details.html | ⚠️ BUG | **Redirige automatiquement vers admin-fiscal-readable-report.html** — JS redirect parasite dans la page |
| admin-finance.html | ✅ OK | Vue financière globale, chiffre d'affaires, métriques revenus |
| admin-fiscal-readable-report.html | ✅ OK | Rapport fiscal généré dynamiquement depuis fiscalite-v2.js et taux-fiscaux-config.js (pas de hardcoding) |
| admin-monitoring.html | ✅ OK | Monitoring système, alertes temps réel. Bug SecurityUtils.escapeHTML → sanitizeText détecté et **CORRIGÉ** (js/menage.js L934/952, js/femme-menage.js L680/691) |
| admin-parrainage.html | ✅ OK | Programme de parrainage, codes promo, suivi filleuls |
| admin-performance-audit.html | ✅ OK | Audit performance Lighthouse-style, métriques Core Web Vitals |
| admin-prestations.html | ✅ OK | Gestion des prestations/services proposés |
| admin-prestations-stats.html | ✅ OK | Statistiques consommation prestations par client |
| admin-promotions.html | ✅ OK | Gestion promotions et codes réduction |
| admin-prompt-editor.html | ✅ OK | Éditeur de prompts IA (assistant tarification, etc.) |
| admin-scalabilite-roadmap.html | ✅ OK | Roadmap technique scalabilité, jalons infrastructure |
| admin-security-audit.html | ✅ OK | Audit sécurité, RLS policies, tentatives connexion |
| admin-support.html | ✅ OK | Tickets support clients, fil de messages |
| admin-surveillance-evolution.html | ✅ OK | Suivi évolutions en cours, changelog interne |
| admin-ticket-workflow.html | ⚠️ BUG | **Redirige automatiquement vers admin-content-analytics.html** — JS redirect parasite dans la page |
| admin-channel-manager.html | ✅ OK | Gestion canaux distribution (Airbnb, Booking, etc.) |

### Bugs redirect à corriger

- `admin-error-details.html` : contient un `window.location` qui redirige vers `admin-fiscal-readable-report.html`
- `admin-ticket-workflow.html` : contient un `window.location` qui redirige vers `admin-content-analytics.html`

### Observations générales

- Design cohérent dark/light mode sur toutes les pages
- Sidebar de navigation fonctionnelle, breadcrumbs présents
- Authentification Supabase RLS active, pages protégées
- `nb_gites_max` n'est PAS une colonne de `cm_clients` — il vient du plan/abonnement (join nécessaire pour affichage correct)
- Bouton "Site Web" dans sidebar : non fonctionnel (pas de navigation déclenchée)



---

## 🔍 TOUR VISUEL SITE UTILISATEUR — 22 mars 2026

### `pages/fiche-client.html` — Guide du voyageur (token-protégé)

Accès via URL : `https://www.liveownerunit.fr/pages/fiche-client.html?token=xxxx`

| Tab | Statut | Contenu observé | Notes |
|-----|--------|-----------------|-------|
| Entrée | ✅ OK | Infos d'arrivée : heure check-in, code accès, adresse. Instructions d'arrivée personnalisées. Carte de localisation. | Page d'accueil du guide voyageur |
| Pendant | ✅ OK | Règles de la maison, équipements disponibles, contacts utiles (propriétaire, urgences). | |
| Sortie | ✅ OK | Instructions départ : heure check-out, consignes ménage, remise des clés. | |
| Prestations | ✅ OK | Liste des prestations proposées par le propriétaire (services additionnels commandables). | |
| Activités | ✅ OK | Suggestions d'activités locales et touristiques autour du logement. | |
| Demandes | ✅ OK | Formulaire de demande/message du voyageur vers le propriétaire. | |
| Évaluation | ✅ OK | Formulaire d'évaluation du séjour (note, commentaire libre). | |
| FAQ | ⏭️ SKIPPÉ | Contenu dynamique — questions/réponses créées et modifiées par le propriétaire. | Non cartographié (contenu variable) |

### `app.html` — Dashboard principal propriétaire

Accès : `https://www.liveownerunit.fr/app` (auth Supabase requise)

| Tab | Statut | Contenu observé | Notes |
|-----|--------|-----------------|-------|
| Dashboard | ✅ OK | Vue synthétique : KPIs (taux d'occupation, revenus, prochaine résa), calendrier mini, alertes. | Onglet par défaut à l'ouverture |
| Résa | ✅ OK | Liste des réservations avec filtres (période, statut). Bouton "Nouvelle résa". CRUD complet. | |
| Tâches | ✅ OK | Gestionnaire de tâches : liste, priorités, statuts (à faire / en cours / fait). | |
| Stats | ✅ OK | Statistiques : graphiques revenus, taux d'occupation, comparaisons annuelles. | |
| Prestations | ✅ OK | Catalogue prestations du gîte, gestion des commandes voyageurs. | |
| Draps | ✅ OK | Gestion rotations de linge : lots, lavages, suivis. | |
| Ménage | ✅ OK | Planning ménage : passages programmés, statuts, affectation femme de ménage. | |
| Fiscal | ✅ OK | Suivi fiscal : déclarations, revenus imposables, export comptable. | |
| Découvrir | ✅ OK | Contenu activités locales à afficher dans la fiche voyageur. | |
| Cal. & Tarifs | ✅ OK | Calendrier disponibilité et grille tarifaire (par période, nuit min, etc.). | |
| Infos | ✅ OK | Informations logement : description, équipements, photos, règles maison. | |
| Communauté | ✅ OK | Espace communautaire propriétaires (forum / entraide). | |

### Pages standalone utilisateur

| Page | Statut | Contenu observé | Notes |
|------|--------|-----------------|-------|
| `login.html` | ✅ OK | Formulaire email/mdp + lien "Mot de passe oublié". Logo LiveOwnerUnit. | Redirige vers `/app` si déjà authentifié |
| `pages/forgot-password.html` | ✅ OK | Saisie email → envoi lien de réinitialisation. Design épuré. | Accessible sans auth |
| `pages/reset-password.html` | ⚠️ ÉTAT ERREUR | "Ce lien de réinitialisation est invalide ou a déjà été utilisé" | Comportement attendu sans `?token=` valide — pas un vrai bug |
| `pages/onboarding.html` | ✅ OK | Tunnel onboarding nouveau propriétaire : création profil gîte, étapes guidées. | Accessible sans auth |
| `pages/options.html` | ✅ OK | Paramètres compte : nom gîte, adresse (Gite Welcomehome, 46160 Calvignac), abonnement. | Données réelles affichées |
| `pages/validation.html` | ✅ OK | Interface société de ménage : confirmation/modification des passages nettoyage programmés. | Portail tiers prestataire |
| `pages/client-support.html` | ✅ OK | Page support : FAQ, formulaire de contact, liens documentation. | |
| `pages/conformite-rgpd-securite.html` | ✅ OK | RGPD & sécurité : politique données, cookies, droits utilisateurs. | |
| `pages/dashboard-proposition.html` | ⚠️ DONNÉE MANQUANTE | Dashboard complet affiché. KPI "Trésorerie actuelle" = `-` (tiret). | Champ non renseigné ou non configuré |
| `pages/desktop-owner-prestations.html` | 🔴 BUG SQL | "📦 Prestations & Revenus Supplémentaires". KPIs à 0. Section "Revenus Mensuels" : erreur rouge. | **BUG** : `column commandes_prestations.date_commande does not exist` |
| `pages/femme-menage.html` | ✅ OK | Portail femme de ménage : planning, passages, statuts interventions. | Documenté session précédente |

### Bugs découverts — Site utilisateur

- **`desktop-owner-prestations.html` — BUG SQL** : Table "Revenus Mensuels" affiche `Erreur: column commandes_prestations.date_commande does not exist`. La requête Supabase référence une colonne `date_commande` absente du schéma réel. À corriger dans le JS correspondant.
- **`dashboard-proposition.html`** : `Trésorerie actuelle` affiche `-`. Champ probablement non configuré dans les données du compte de test.
- **`reset-password.html`** : Affiche un état d'erreur sans `?token=` valide — comportement attendu, non bloquant.

### Observations générales — Site utilisateur

- Toutes les pages auth-protégées redirigent correctement vers `login.html` si non connecté
- `login.html` redirige automatiquement vers `/app` si déjà authentifié (auth guard OK)
- Design cohérent avec la partie admin : dark/light mode, navigation fluide
- Pages standalone (onboarding, reset-password, forgot-password) accessibles sans authentification
- La fiche client (`fiche-client.html`) nécessite un token valide dans l'URL
- `pages/femme-menage.html` et `pages/validation.html` sont des portails tiers (pas login Supabase classique)


---

## 🔍 TOUR VISUEL SITE UTILISATEUR — 22 mars 2026

### `pages/fiche-client.html` — Guide du voyageur (token-protégé)

Accès via URL : `https://www.liveownerunit.fr/pages/fiche-client.html?token=xxxx`

| Tab | Statut | Contenu observé | Notes |
|-----|--------|-----------------|-------|
| Entrée | ✅ OK | Infos d'arrivée : heure check-in, code accès, adresse. Instructions d'arrivée personnalisées. Carte de localisation. | Page d'accueil du guide voyageur |
| Pendant | ✅ OK | Règles de la maison, équipements disponibles, contacts utiles (propriétaire, urgences). | |
| Sortie | ✅ OK | Instructions départ : heure check-out, consignes ménage, remise des clés. | |
| Prestations | ✅ OK | Liste des prestations proposées par le propriétaire (services additionnels commandables). | |
| Activités | ✅ OK | Suggestions d'activités locales et touristiques autour du logement. | |
| Demandes | ✅ OK | Formulaire de demande/message du voyageur vers le propriétaire. | |
| Évaluation | ✅ OK | Formulaire d'évaluation du séjour (note, commentaire libre). | |
| FAQ | ⏭️ SKIPPÉ | Contenu dynamique — questions/réponses créées et modifiées par le propriétaire. | Non cartographié (contenu variable) |

### `app.html` — Dashboard principal propriétaire

Accès : `https://www.liveownerunit.fr/app` (auth Supabase requise)

| Tab | Statut | Contenu observé | Notes |
|-----|--------|-----------------|-------|
| Dashboard | ✅ OK | Vue synthétique : KPIs (taux d'occupation, revenus, prochaine résa), calendrier mini, alertes. | Onglet par défaut à l'ouverture |
| Résa | ✅ OK | Liste des réservations avec filtres (période, statut). Bouton "Nouvelle résa". CRUD complet. | |
| Tâches | ✅ OK | Gestionnaire de tâches : liste, priorités, statuts (à faire / en cours / fait). | |
| Stats | ✅ OK | Statistiques : graphiques revenus, taux d'occupation, comparaisons annuelles. | |
| Prestations | ✅ OK | Catalogue prestations du gîte, gestion des commandes voyageurs. | |
| Draps | ✅ OK | Gestion rotations de linge : lots, lavages, suivis. | |
| Ménage | ✅ OK | Planning ménage : passages programmés, statuts, affectation femme de ménage. | |
| Fiscal | ✅ OK | Suivi fiscal : déclarations, revenus imposables, export comptable. | |
| Découvrir | ✅ OK | Contenu activités locales à afficher dans la fiche voyageur. | |
| Cal. & Tarifs | ✅ OK | Calendrier disponibilité et grille tarifaire (par période, nuit min, etc.). | |
| Infos | ✅ OK | Informations logement : description, équipements, photos, règles maison. | |
| Communauté | ✅ OK | Espace communautaire propriétaires (forum / entraide). | |

### Pages standalone utilisateur

| Page | Statut | Contenu observé | Notes |
|------|--------|-----------------|-------|
| `login.html` | ✅ OK | Formulaire email/mdp + lien "Mot de passe oublié". Logo LiveOwnerUnit. | Redirige vers `/app` si déjà authentifié |
| `pages/forgot-password.html` | ✅ OK | Saisie email → envoi lien de réinitialisation. Design épuré. | Accessible sans auth |
| `pages/reset-password.html` | ⚠️ ÉTAT ERREUR | "Ce lien de réinitialisation est invalide ou a déjà été utilisé" | Comportement attendu sans `?token=` valide — pas un vrai bug |
| `pages/onboarding.html` | ✅ OK | Tunnel onboarding nouveau propriétaire : création profil gîte, étapes guidées. | Accessible sans auth |
| `pages/options.html` | ✅ OK | Paramètres compte : nom gîte, adresse (Gite Welcomehome, 46160 Calvignac), abonnement. | Données réelles affichées |
| `pages/validation.html` | ✅ OK | Interface société de ménage : confirmation/modification des passages nettoyage programmés. | Portail tiers prestataire |
| `pages/client-support.html` | ✅ OK | Page support : FAQ, formulaire de contact, liens documentation. | |
| `pages/conformite-rgpd-securite.html` | ✅ OK | RGPD & sécurité : politique données, cookies, droits utilisateurs. | |
| `pages/dashboard-proposition.html` | ⚠️ DONNÉE MANQUANTE | Dashboard complet affiché. KPI "Trésorerie actuelle" = `-` (tiret). | Champ non renseigné ou non configuré |
| `pages/desktop-owner-prestations.html` | 🔴 BUG SQL | "📦 Prestations & Revenus Supplémentaires". KPIs à 0. Section "Revenus Mensuels" : erreur rouge. | **BUG** : `column commandes_prestations.date_commande does not exist` |
| `pages/femme-menage.html` | ✅ OK | Portail femme de ménage : planning, passages, statuts interventions. | Documenté session précédente |

### Bugs découverts — Site utilisateur

- **`desktop-owner-prestations.html` — BUG SQL** : Table "Revenus Mensuels" affiche `Erreur: column commandes_prestations.date_commande does not exist`. La requête Supabase référence une colonne `date_commande` absente du schéma réel. À corriger dans le JS correspondant.
- **`dashboard-proposition.html`** : `Trésorerie actuelle` affiche `-`. Champ probablement non configuré dans les données du compte de test.
- **`reset-password.html`** : Affiche un état d'erreur sans `?token=` valide — comportement attendu, non bloquant.

### Observations générales — Site utilisateur

- Toutes les pages auth-protégées redirigent correctement vers `login.html` si non connecté
- `login.html` redirige automatiquement vers `/app` si déjà authentifié (auth guard OK)
- Design cohérent avec la partie admin : dark/light mode, navigation fluide
- Pages standalone (onboarding, reset-password, forgot-password) accessibles sans authentification
- La fiche client (`fiche-client.html`) nécessite un token valide dans l'URL
- `pages/femme-menage.html` et `pages/validation.html` sont des portails tiers (pas login Supabase classique)

## Audit automatise -- 23 mars 2026

### Resume
- Pages testees : 8 (index.html, login, onboarding, reset-password, cgu-cgv, privacy, legal, support)
- Elements interactifs cartographies : 8 liens nav, 6 toggles prix, 3 CTA tarifs, 4 liens footer, 3 liens blog, 1 formulaire onboarding
- Bugs trouves : 2 (1 critique, 1 majeur)
- Corrections appliquees : 1 (BUG-004)
- Issues GitHub creees : 1 (#5)

### Pages testees
| Page | Statut | Notes |
|------|--------|-------|
| index.html (accueil) | OK | BUG-004 corrige dans cette session |
| pages/login.html | OK | Redirige vers /app si session active |
| pages/onboarding.html | OK | Formulaire creation compte fonctionnel |
| pages/reset-password.html | OK | Message erreur attendu sans token |
| cgu-cgv.html | ANOM | Pas de header/footer site, statut provisoire |
| privacy.html | ANOM | Pas de header/footer site, champs a completer |
| legal.html | ANOM | Pas de header/footer site |
| pages/support.html | BUG | 404 NOT_FOUND -- issue #5 creee |

### BUG-004 -- CORRIGE
- Page : index.html section Tarifs
- Symptome : Toggle Avec/Sans engagement ne met pas a jour le prix affiche
- Cause : Aucun event listener JS sur les .price-option (CSS present mais JS absent)
- Fix : Bloc script avec addEventListener DOMContentLoaded injecte avant </body>
- Commit : fc3d1bc

### BUG-005 -- OUVERT
- Page : pages/support.html
- Symptome : 404 NOT_FOUND sur Vercel
- Cause : Fichier jamais cree
- Issue GitHub : #5
- Fix suggere : Creer pages/support.html avec formulaire contact

### Anomalies detectees
- ANOM-003 : Pages legales (CGU, Privacy, Legal) sans navigation coherente avec le site
- ANOM-004 : Section Blog -- liens Lire les articles et Voir les videos pointent sur #blog (meme page), pas de vrai contenu
- ANOM-005 : Voir la demo et App mobile pointent vers app.html (login), pas de page dediee

### Corrections appliquees
- fc3d1bc : fix toggle prix Avec/Sans engagement index.html (26 insertions)

### Issues creees
- #5 : support.html Page 404 -- fichier manquant

