# Documentation Pages — Partie 2 : Application Client (Shell + Onglets)

> **LiveOwnerUnit** — Application SaaS de gestion de gîtes  
> Généré le 28 mars 2026 | Version 2.13.46

---

## Table des matières

- [app.html — Shell principal](#apphtml--shell-principal)
- [Onglets propriétaire](#onglets-propriétaire)
  - [tab-dashboard.html](#tab-dashboardhtml)
  - [tab-reservations.html](#tab-reservationshtml)
  - [tab-menage.html](#tab-menagehtml)
  - [tab-draps.html](#tab-drapshtml)
  - [tab-fiscalite-v2.html](#tab-fiscalite-v2html)
  - [tab-infos-gites.html](#tab-infos-giteshtml)
  - [tab-checklists.html](#tab-checklistshtml)
  - [tab-fiches-clients.html](#tab-fiches-clientshtml)
  - [tab-kanban.html](#tab-kanbanhtml)
  - [tab-parrainage.html](#tab-parrainagehtml)
  - [tab-prestations.html](#tab-prestationshtml)
  - [tab-statistiques.html](#tab-statistiqueshtml)
  - [tab-gestion.html](#tab-gestionhtml)
  - [tab-archives.html](#tab-archiveshtml)
  - [tab-decouvrir.html](#tab-decouvrirhtml)
  - [tab-faq.html](#tab-faqhtml)
  - [tab-communaute.html](#tab-communautehtml)
- [Variantes Calou](#variantes-calou)
  - [tab-dashboard-calou.html](#tab-dashboard-calouhtml)
  - [tab-menage-calou.html](#tab-menage-calouhtml)
  - [tab-draps-calou.html](#tab-draps-calouhtml)

---

## app.html — Shell principal

**Type :** Shell de l'application (SPA-like)  
**Audience :** Propriétaires de gîtes connectés  
**URL :** `/app.html`

**Objectif :** Page conteneur principale qui charge tous les modules, gère l'authentification, les thèmes, les notifications et la navigation multi-onglets. Les onglets sont injectés dynamiquement dans cette page.

**Sections UI :**
| Composant | Description |
|-----------|-------------|
| Contrôles thème (top bar) | Settings, notifications, logout |
| Navigation mobile | Menu hamburger slide-out avec overlay |
| Navigation onglets | `.icalou-modern-nav` — barre de navigation principale |
| Dropdown admin | Channel Manager, Gérer mes gîtes, Options |
| Widget notifications | Badge compteur |
| Bannière abonnement | Statut abonnement utilisateur |
| Zone alertes | Alertes critiques dashboard |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| ☰ Hamburger | `toggleMobileMenu()` | Affiche/masque navigation mobile |
| ⚙️ Settings | `showAdminMenu()` | Menu déroulant admin |
| 🔔 Notifications | `toggleNotifications()` | Ouvre panel notifications |
| Channel Manager | `window.location.href='pages/admin-channel-manager.html'` | Interface admin SaaS |
| Gérer mes gîtes | `window.showGitesManager()` | Modal gestion gîtes |
| Options | `window.location.href='pages/options.html'` | Page paramètres |
| Déconnexion | `handleLogout()` | Déconnexion utilisateur |

**Scripts chargés (dans l'ordre) :**

*Sécurité & Auth :*
- `js/error-tracker.js`
- `js/auth.js`
- `js/security-utils.js`
- `js/validation-utils.js`
- `js/error-logger.js`
- `js/rate-limiter.js`
- `js/email-confirmation-guard.js`

*Data & Config :*
- `js/utils.js`
- `js/shared-config.js`
- `js/gites-manager.js`
- `js/supabase-operations.js`
- `js/shared-utils.js`
- `js/taux-fiscaux-config.js`

*Modules Fonctionnels :*
- `js/dashboard.js`, `js/kanban.js`, `js/sync-ical-v2.js`
- `js/statistiques.js`, `js/menage.js`, `js/reservations.js`
- `js/fiscalite-v2.js`, `js/infos-gites.js`, `js/checklists.js`
- `js/fiches-clients.js`, `js/parrainage.js`, `js/draps.js`
- `js/calendrier-tarifs.js`, `js/communaute.js`

*UI & Utils :*
- `js/icons.js`, `js/notification-system.js`
- `js/ai-assistant.js`, `js/faq.js`
- `js/platform-icons.js`, `js/property-icons.js`
- `js/subscription-manager.js`

*Bibliothèques externes :*
- Chart.js (graphiques)
- SheetJS / xlsx (export Excel)
- iCal.js (synchronisation calendriers)
- Supabase (BDD)
- DOMPurify (sécurité XSS)
- Leaflet (cartes interactives)
- QRCode.js (génération QR)
- Lucide Icons (icônes)

**Fonctions JS inline clés :**
```javascript
// Thème — exécuté IMMÉDIATEMENT (avant le reste)
(function() {
    const savedTheme = localStorage.getItem('icalou-theme') || 'dark';
    const savedStyle = localStorage.getItem('icalou-style') || 'sidebar';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.className = 'theme-' + savedTheme + ' style-' + savedStyle;
})();

// Bloqueur d'erreurs extensions Chrome
window.onerror = function(msg, url, lineNo, columnNo, error) {
    if (url && url.includes('chrome-extension://')) return true;
    if (msg && (msg.includes('Unexpected token') || msg.includes('export'))) return true;
    return false;
};

// Thème dropdown admin (fiche client)
(function() {
    const ficheTheme = localStorage.getItem('ficheClientTheme') || 'cyan';
    // Set CSS vars --dropdown-bg, --dropdown-text, --dropdown-border-color
})();
```

---

## Onglets propriétaire

### tab-dashboard.html

**Type :** Onglet — Dashboard  
**Audience :** Propriétaires de gîtes  
**URL :** Chargé dans `app.html` via navigation

**Objectif :** Vue d'ensemble haute densité avec alertes temps réel, KPIs fiscaux, réservations semaine en cours, commandes prestations, todo lists et graphiques de performance.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Date actuelle, semaine en cours, bouton Actualiser |
| Alertes clients | Demandes horaires, propositions dates ménage, tickets support, problèmes urgents, retours clients (conditionnels, masqués par défaut) |
| VISION ACTIONS | Réservations semaine, commandes prestations, 4 Todo lists |
| Todo lists | Actions Réservations / Travaux / Achats & Courses / Ménages |
| VISION GLOBALE | KPI grid URSSAF/IR/CA/Bénéfices, 6 indicateurs performance, 3 graphiques mensuels |
| Comparaison CA | 2025 vs 2026 |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Actualiser | `refreshDashboard()` | Recharge toutes les données |
| ← / → Réservations | `changeDashboardReservationsPage('prev'|'next')` | Pagination planning |
| 🛒 Shopping | `openShoppingListManager()` | Modal liste de courses |
| ➕ Réservations | `addTodoItem('reservations')` | Ouvre modal nouvelle tâche |
| ➕ Travaux | `addTodoItem('travaux')` | Ouvre modal nouvelle tâche |
| ➕ Achats | `addTodoItem('achats')` | Ouvre modal nouvelle tâche |
| Répondre (alertes) | `toggleReponseWhatsapp()` | Ouvre formulaire réponse WhatsApp |

**Modal "Nouvelle Tâche" (`#addTodoModal`) :**
| Champ | Type | Requis | Note |
|-------|------|--------|------|
| Titre | text | Oui | — |
| Description | textarea | Non | — |
| Gîte concerné | select | Conditionnel | Affiché seulement pour "Travaux" |
| Tâche récurrente | checkbox | Non | Affiche les options de fréquence |
| Fréquence | select | Conditionnel | Weekly / Biweekly / Monthly |
| Jour semaine | select | Conditionnel | Si hebdomadaire |
| Jour du mois | number | Conditionnel | 1–31, si mensuel |

**Scripts chargés :**
- `dashboard.js` (v12.50)
- `fiscalite-v2.js`
- `taux-fiscaux-config.js`

**Fonctions JS inline :**
```javascript
function addTodoItem(category) {
    document.getElementById('todoCategory').value = category;
    if (category === 'travaux') {
        document.getElementById('giteSelectGroup').style.display = 'block';
    }
    document.getElementById('addTodoModal').style.display = 'block';
}
function closeAddTodoModal()
// Listener récurrence :
document.getElementById('todoRecurrent').addEventListener('change', function() {
    document.getElementById('recurrentOptions').style.display =
        this.checked ? 'block' : 'none';
});
```

---

### tab-reservations.html

**Type :** Onglet — Réservations  
**Audience :** Propriétaires de gîtes  

**Objectif :** Gestion complète des réservations avec planning hebdomadaire visuel, synchronisation iCal multi-plateforme, filtres de recherche et gestion taxes de séjour.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header card | Titre + sous-titre |
| Actions | Boutons Actualiser et Taxes Séjour, timestamp dernière sync |
| Barre de recherche | Filtrage dynamique en temps réel |
| Indicateur sync | "Synchronisation en cours..." (conditionnel) |
| Container planning | `#planning-container` — planning injecté dynamiquement par JS |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| ACTUALISER | `forceRefreshReservations()` | Recharge planning + timestamp sync |
| TAXES SÉJOUR | `openTaxesSejourModal()` | Ouvre modal configuration taxes |
| 🔍 Recherche | `filterReservations(value)` | Filtre en temps réel |

**Scripts chargés :**
- `reservations.js` (v5.6)
- `sync-ical-v2.js` (v2.5)

---

### tab-menage.html

**Type :** Onglet — Planning Ménage  
**Audience :** Propriétaires de gîtes  

**Objectif :** Gestion du planning de nettoyage — suivi par gîte, validation société ménage, propositions de changement de dates, retours femme de ménage, liens rapides vers les pages partenaires.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Titre + sous-titre |
| Actions | Règles, Validation société, Espace ménage, copie liens |
| Propositions en attente | Alerte conditionnelle (demandes de changement) |
| Planning semaines | `#menagePlanningWeeks` — grille jour/semaine |
| Indicateur sync | Statut synchronisation |
| Retours femme de ménage | Alerte info (masquée par défaut) |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| RÈGLES | `showCleaningRulesModal()` | Modal règles nettoyage |
| VOIR RÈGLES | `showRulesModal()` | Modal règles utilisateur |
| VALIDATION SOCIÉTÉ | `ouvrirPageValidation()` | `window.open()` page validation.html |
| 🔗 Copier lien société | `copierLienSociete()` | Copie URL validation dans clipboard |
| ESPACE MÉNAGE | `ouvrirPageFemmeMenage()` | `window.open()` femme-menage.html |
| 🔗 Copier lien ménage | `copierLienFemmeMenage()` | Copie URL femme de ménage |
| ACTUALISER | `forceRefreshMenage()` | Recharge planning |
| 🔍 Recherche | `filterMenage(value)` | Filtre en temps réel |

**Scripts chargés :**
- `menage.js` (v1739379600)
- `cleaning-rules.js`
- `cleaning-rules-modal.js`

---

### tab-draps.html

**Type :** Onglet — Gestion Draps  
**Audience :** Propriétaires de gîtes  

**Objectif :** Suivi des stocks de draps et linge — configuration des besoins par type de réservation, inventaire réserves, calcul de ce qu'il faut emmener aux gîtes, simulations de besoins futurs, alertes rupture.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Configuration des besoins | Grille éditable (ex: lit double = 1 drap complet) |
| Stocks en réserve | Grille scrollable horizontale avec inputs numériques |
| Réservations couvertes | Stat calculée dynamiquement |
| À emmener au gîte | Calcul par gîte avec date limite |
| Simulation besoins futurs | Date picker + calcul projection |
| Résultats simulation | Zone affichage résultats |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Sauvegarder | `sauvegarderStocks()` | Sauvegarde stocks en BDD |
| Calculer | `simulerBesoins()` | Simulation jusqu'à date choisie |
| Configurer alerte manque | `ouvrirModalAlerteDraps()` | Ouvre modal paramètres alerte |
| Enregistrer (modal) | `enregistrerParametresAlerteDraps()` | Sauvegarde config alerte |

**Modal "Alerte Draps" (`#draps-alert-modal`) :**
| Champ | Type | Options |
|-------|------|---------|
| Jour d'alerte | select | Lundi–Dimanche ou Tous les jours |
| Jours avant rupture | number | 0–30 |

**Scripts chargés :**
- `draps.js` (v3.2)

---

### tab-fiscalite-v2.html

**Type :** Onglet — Fiscalité LMNP  
**Audience :** Propriétaires de gîtes  

**Objectif :** Calculateur fiscal complet avec comparaison de 4 régimes (LMNP réel, Micro-BIC classé/non-classé, LMP), gestion des charges par gîte, frais d'exploitation, kilomètres professionnels, amortissements, et calcul IR avec reste à vivre.

**Sections (collapsibles) :**
| Bloc | Description |
|------|-------------|
| BLOC 1 — CA | Input géant CA + tableau comparatif 4 options |
| Tableau comparatif | LMNP Réel / Micro 30% / Micro 50% ⭐ / LMP Réel |
| BLOC 2 — Charges par Gîte | Injection dynamique par gîte |
| BLOC 2C — Frais Exploitation | Travaux (orange), Frais divers (vert), Produits accueil (violet) |
| BLOC 3 — Résidence Principale | Ratio pro/perso, charges mensuelles/annuelles |
| BLOC 4 — Frais Professionnels | 100% déductibles (comptable, bancaire, téléphone...) |
| BLOC 5 — Véhicule & Kilomètres | Config type/puissance + historique trajets |
| Résultats Fiscaux | Calcul final avec dégradé bleu |
| Comparaison Réel vs Micro-BIC | Dégradé violet (LMP uniquement) |
| Section Personnelle | IR, crédits d'impôt, reste à vivre (optionnel) |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Options | `afficherModalOptions()` | Modal options calculateur |
| Nouvelle Année | `creerNouvelleAnnee()` | Crée l'année fiscale suivante |
| Tester | `appliquerTestCA()` | Applique un CA de test |
| Ajouter un travail | `ajouterTravaux()` | Ajoute ligne réparation |
| Ajouter un frais | `ajouterFraisDivers()` | Ajoute frais divers |
| Ajouter un produit | `ajouterProduitAccueil()` | Ajoute produit accueil |
| Configurer véhicule | `afficherModalConfigVehicule()` | Modal configuration véhicule |
| Configurer automatisation | `afficherModalConfigKm()` | Modal automation km |
| Voir tous mes trajets | `afficherModalGestionTrajets()` | Historique trajets |
| Gérer mes lieux | `afficherModalLieuxFavoris()` | Lieux favoris |
| Ajouter un trajet | `afficherModalAjoutTrajet()` | Ajout trajet manuel |
| Exporter en Excel | `exporterTrajetsCSV()` | Export trajets CSV |

**Formulaire principal (ID `#calculateur-lmp`) :**
| Champ | Type | Description |
|-------|------|-------------|
| `#annee_simulation` | hidden | Année fiscale active |
| `#ca` | number | Chiffre d'affaires (recalcul temps réel `oninput`) |
| `#statut_fiscal` | select | LMNP / Micro / LMP → `changerStatutFiscal()` |
| Classement | select | Non classé / Classé ⭐ → `calculerTempsReel()` |
| Test CA | number | Valeur test |
| VL option | checkbox | Versement libératoire + confirmation micro-entrepreneur |
| Surface pro | number | Surface professionnelle résidence principale |
| Charges mensuelles | number | Charges résidence principale |
| Type véhicule | select | Config véhicule |
| Puissance fiscale | select | CV fiscaux |
| KM annuels | number | Kilométrage annuel |

**Scripts chargés :**
- `fiscalite-v2.js` (v1738861800)
- `taux-fiscaux-config.js` (v2.0)

**Fonctions JS inline :**
```javascript
function calculerTempsReel()     // Calcule 4 options simultanément, badge vert sur meilleure
function changerStatutFiscal()   // Affiche/masque blocs selon statut
function appliquerTestCA()       // Applique CA de test puis recalcule
```

---

### tab-infos-gites.html

**Type :** Onglet — Informations Gîtes  
**Audience :** Propriétaires de gîtes  

**Objectif :** Documentation complète des gîtes pour les clients — accès, WiFi, arrivée/départ, chauffage, équipements, tri déchets, sécurité, règlement. Support FR + EN avec traduction IA. Génération QR Code WiFi.

**Sections collapsibles (8) :**
| # | Section | Champs principaux |
|---|---------|------------------|
| 1 | Informations de base | Adresse, tél urgence, GPS auto, email |
| 2 | WiFi & Connectivité | SSID, password, QR Code, débit, zones |
| 3 | Consignes d'arrivée | Horaires, parking, accès clés, itinéraire, 1ère visite |
| 4 | Le Logement | Chauffage, cuisine, linge, chambres |
| 5 | Tri des déchets | Instructions, jours collecte, déchèterie |
| 6 | Sécurité & Urgences | Détecteur fumée, extincteur, coupures |
| 7 | Consignes de départ | Horaire, tardif, checklist, restitution clés |
| 8 | Règlement intérieur | Tabac, animaux, nb max personnes, caution |

*(Chaque section existe en version FR + EN)*

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| 📸 Photos Fiche Client | `openModalPhotosGite()` | Modal upload photos |
| ✨ IA | `improveAllTexts()` | Amélioration IA tous les champs texte |
| Sélecteur gîte | `selectGiteFromDropdown(value)` | Change gîte actif |
| Toggle FR/EN | `toggleLanguageInfos()` | Affiche/masque champs anglais |
| Effacer | `resetGiteInfosQuick()` | Efface toutes les infos |
| 🔐 Générer code | `window.generateAccessCodeForCurrentGite()` | Auto-génère code d'accès |
| Télécharger QR Code | `telechargerQRCodeWifi()` | Download QR en image |
| Imprimer QR Code | `imprimerQRCodeWifi()` | Impression QR |

**Scripts chargés :**
- `infos-gites.js` (v4.1)
- `infos-gites-photos.js` (v1.8)

**Fonctions JS inline :**
```javascript
function toggleLanguageInfos()   // Affiche/masque card sections EN
function updateQRCodeWifi()      // Génère QR WiFi (format WIFI:T:WPA;S:SSID;P:PWD;;)
function improveAllTexts()       // Appel IA pour améliorer tous les textareas
```

---

### tab-checklists.html

**Type :** Onglet — Checklists  
**Audience :** Propriétaires de gîtes  

**Objectif :** Gestion des check-lists d'entrée/sortie par gîte — items configurables, drag-and-drop pour réordonnancement, duplication entre gîtes, traduction FR↔EN automatique.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Réservations en cours | Affichage réservations actives (injection dynamique) |
| Toolbar | Sélecteurs gîte + type, boutons actions |
| Items list | Liste sortable drag-drop |
| Chaque item | Checkbox + numéro + titre + description + actions edit/delete |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| 🌍 Rétro-traduire FR→EN | `backfillTranslation()` | Traduit tous les items FR vers EN |
| 📄 Dupliquer vers ce gîte | `duplicateChecklistToOtherGite()` | Copie items vers gîte cible |
| ➕ Créer | `openChecklistCreateModal()` | Ouvre modal création item |
| ✅ Fermer et sauvegarder | `closeChecklistCreateModal(true)` | Sauvegarde + ferme modal |
| Annuler | `closeChecklistCreateModal(false)` | Ferme sans sauvegarder |

**Formulaires :**

*Toolbar :*
| Champ | Type | Description |
|-------|------|-------------|
| Gîte source | select | Gîte dont afficher les checklists |
| Type | select | Entrée / Sortie |

*Modal création (`#checklistCreateModal`) :*
| Champ | Type | Requis |
|-------|------|--------|
| Texte item | text | Oui |
| Description | textarea | Non |

**Scripts chargés :**
- `checklists.js`

---

### tab-fiches-clients.html

**Type :** Onglet — Fiches Clients  
**Audience :** Propriétaires de gîtes  

**Objectif :** Génération et gestion des fiches client interactives par réservation — tracking ouvertures, demandes d'horaires, retours clients, gestion de la configuration des gîtes et photos.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Statistiques rapides | 4 cards : Fiches générées / Ouvertures totales / Demandes horaires / Retours |
| Filtres | Gîte, statut fiche, date début, recherche client, bouton Actualiser |
| 5 sous-onglets | Liste réservations / Demandes horaires / Retours clients / Config gîtes / Config checklists |

**Sous-onglets :**
| Onglet | Badge | Description |
|--------|-------|-------------|
| Liste des réservations | — | Tableau réservations avec actions fiche |
| Demandes horaires | count | Demandes d'arrivée/départ hors horaires |
| Retours clients | count | Feedbacks reçus des clients |
| Configuration gîtes | — | Boutons Configurer par gîte |
| Configuration checklists | — | Gestion checklists par gîte |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Actualiser | `loadFichesClientList()` | Recharge liste avec filtres |
| Configurer Trevoux | `editGiteInfo('Trevoux')` | Modal édition infos Trevoux |
| Configurer Couzon | `editGiteInfo('Couzon')` | Modal édition infos Couzon |
| Générer la fiche | `confirmerGenerationFiche()` | Génère fiche pour réservation |
| Voir la fiche | `openFicheClient()` | Affiche fiche générée |
| Envoyer par WhatsApp | `sendWhatsAppFiche()` | Partage via lien WhatsApp |
| Copier URL | `copyFicheUrl()` | Copie URL dans clipboard |

**Modal Génération Fiche (`#modalGenereFiche`) :**
- Nom client (readonly, pré-rempli)
- Boutons : Générer / Annuler
- Post-génération : champ URL + actions copier/WhatsApp

**Modal Édition Gîte (`#modalEditGite`) :**
| Section | Champs |
|---------|--------|
| Accès | Code entrée, adresse, GPS, instructions FR/EN |
| WiFi | SSID, password, URL QR |
| Horaires | Heure arrivée, heure départ |
| Règlement | Texte FR/EN |
| Photos | Upload couverture, galerie, boîte à clés, parking (file inputs) |

**Scripts chargés :**
- `fiches-clients.js`
- `fiche-client.js` (v3.0, type=module)

---

### tab-kanban.html

**Type :** Onglet — Tableau Kanban  
**Audience :** Propriétaires de gîtes  

**Objectif :** Vue Kanban visuelle pour la gestion des tâches — 3 colonnes (À faire / En cours / Terminé), filtrage par catégorie, drag-and-drop entre colonnes, création rapide.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Titre + "Nouvelle tâche" + "Actualiser" |
| Filtres | Toutes / Actions Réservations / Achats / Travaux |
| Quick Add Menu | Appaert après clic filtre : 3 boutons catégorie |
| Board Kanban | 3 colonnes avec compteurs badges |
| Cartes | Bordure colorée (catégorie) + titre + description + badge récurrent + actions |

**Colonnes :**
| Colonne | Badge | Couleur |
|---------|-------|---------|
| À faire | gris | — |
| En cours | bleu | — |
| Terminé | vert | — |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| ➕ Nouvelle tâche | `showAddTaskMenu()` | Affiche menu création rapide |
| Réservations | `addKanbanTask('reservations')` | Crée tâche catégorie Réservations |
| Achats | `addKanbanTask('achats')` | Crée tâche catégorie Achats |
| Travaux | `addKanbanTask('travaux')` | Crée tâche catégorie Travaux |
| Filtres catégorie | `filterKanban(category)` | Filtre l'affichage |
| Actualiser | `refreshKanban()` | Recharge toutes les cartes |
| ✏️ Edit carte | Inline click | Ouvre éditeur tâche |
| 🗑️ Delete carte | Inline click | Confirmation + suppression |

**Scripts chargés :**
- `kanban.js` (v5.0)

**Fonctions JS inline :**
```javascript
function showAddTaskMenu()       // Toggle menu création rapide
function filterKanban(category) // Filtre cartes par catégorie
function addKanbanTask(category)// Ouvre modal création dans catégorie
function refreshKanban()        // Recharge depuis API

// Drag & Drop :
document.addEventListener('dragstart', (e) => { e.target.classList.add('is-dragging') })
document.addEventListener('dragend', (e) => { e.target.classList.remove('is-dragging') })
```

---

### tab-parrainage.html

**Type :** Onglet — Programme Parrainage  
**Audience :** Propriétaires de gîtes  

**Objectif :** Programme de parrainage — invitation de collègues propriétaires, suivi des filleuls, remises et récompenses sur abonnement.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Statut parrainage | Card discount badge + progression + jalons |
| Résumé abonnement | Décomposition tarif (Standard uniquement) |
| Campagnes actives | Promotions en cours |
| Notifications | Liste avec bouton "tout marquer comme lu" |
| Lien de parrainage | Copier + partager (Email / WhatsApp / LinkedIn / QR) |
| Statistiques | 4 stats : invitations envoyées / inscriptions / actifs / économies |
| Convertisseur points | 4 options (Gîtes de France uniquement) |
| Liste filleuls | Tableau des parrainés |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| ACTUALISER | `refreshReferralData()` | Recharge données |
| Copier lien | `copyReferralLink()` | Copie lien dans clipboard |
| Email | `shareViaEmail()` | Partage par email |
| WhatsApp | `shareViaWhatsApp()` | Partage WhatsApp |
| LinkedIn | `shareViaLinkedIn()` | Partage LinkedIn |
| Télécharger QR | `downloadQRCode()` | Download QR code |
| Tout marquer lu | `markAllNotificationsRead()` | Marque notifications lues |
| Convertir points | `convertPoints(type, points)` | Conversion (ai-credits / template / marketplace / formation) |

---

### tab-prestations.html

**Type :** Onglet — Prestations & Revenus  
**Audience :** Propriétaires de gîtes  

**Objectif :** Gestion du catalogue de services additionnels avec statistiques de revenus par période (semaine/mois/année).

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Titre + Actualiser |
| Sélecteur gîte | Dropdown gîte → affiche catalogue |
| Statistiques semaine | `#prestations-semaine` — CA semaine injected |
| Statistiques mois | `#prestations-mois` — CA mois injected |
| Statistiques année | `#prestations-annee` — CA année injected |
| Interface gestion | Masquée, révélée après sélection gîte |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| ACTUALISER | `refreshPrestationsStats()` | Recharge statistiques |
| Gestion catalogue | `afficherGestionCatalogue()` | Affiche interface de gestion |
| Retour aux stats | `retourAuxStatistiques()` | Revient aux statistiques |
| Sélecteur gîte | `onGiteSelected()` (onchange) | Change gîte actif |

---

### tab-statistiques.html

**Type :** Onglet — Statistiques  
**Audience :** Propriétaires de gîtes  

**Objectif :** Analyse des réservations, taux d'occupation, revenus et performance multi-plateformes avec données historiques configurables.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Filtre année + bouton "Gérer les données" |
| Réservations par plateforme | Airbnb, Abritel, Gîtes de France |
| Taux d'occupation par gîte | Stats par propriété |
| Statistiques avancées | Prix/nuit moyen, durée moy séjour, meilleur mois |
| Formulaire données historiques | Masqué, inputs Jan–Déc |
| Revenus & Réservations | CA avec décomposition |
| Comparaison CA mensuelle | Checkboxes années + graphique |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Filtre année | `filterStatsByYear()` | Filtre par année |
| Gérer les données | `toggleHistoricalDataForm()` | Affiche/masque formulaire historique |
| Sauvegarder | `saveHistoricalDataTotal()` | Sauvegarde données historiques |
| Charger | `loadHistoricalDataTotal()` | Charge données existantes |
| Supprimer | `deleteHistoricalDataTotal()` | Supprime données année |
| Sections ▼ | `window.toggleSlide(slideId)` | Expand/collapse sections |

**Formulaire données historiques :**
| Champ | Type | Portée |
|-------|------|--------|
| `hist_total_jan` — `hist_total_dec` | number, step=0.01 | Jan–Déc |

---

### tab-gestion.html

**Type :** Onglet — Gestion des Gîtes  
**Audience :** Propriétaires de gîtes  

**Objectif :** Onglet wrapper minimal qui charge dynamiquement l'interface de gestion des gîtes via `showGitesManager()`.

**Sections UI :** Placeholder div avec message de chargement (contenu 100% dynamique JS)

**Boutons :** Aucun visible (tout est injecté par `gites-manager.js`)

---

### tab-archives.html

**Type :** Onglet — Archives  
**Audience :** Propriétaires de gîtes  

**Objectif :** Consultation des réservations archivées et tâches terminées pour référence historique.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Réservations archivées | `#archivesSection` — injecté dynamiquement |
| Tâches archivées | `#archivedTodosSection` + bouton vider archive |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Vider les archives | `clearArchivedTodos()` | Supprime toutes les tâches archivées (rouge) |

---

### tab-decouvrir.html

**Type :** Onglet — Découvrir (Activités)  
**Audience :** Propriétaires de gîtes  

**Objectif :** Gestion d'un catalogue d'activités, restaurants et sites touristiques autour des gîtes avec carte interactive et filtres par catégorie.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Compteur activités + sélecteur gîte + bouton Ajouter |
| Filtres catégorie | 7 chips filtres |
| Toggle carte | Afficher/masquer carte Leaflet |
| Grille activités | Cards auto-fill |
| Modal ajout/édition | Formulaire complet activité |

**Filtres catégories :**
Restaurant / Café & Bar / Musée / Château / Parc / Hôtel / Attraction

**Boutons / Actions :**
| Texte / ID | Handler | Description |
|------------|---------|-------------|
| `#selectGiteDecouvrir` | `onchange` | Change gîte actif |
| `#btnAjouterActivite` | — | Ouvre modal ajout |
| `#btnToggleCarte` | — | Affiche/masque carte Leaflet |
| `#btnCalculerGPS` | — | Calcule GPS depuis adresse |
| `#btnFermerModal` | — | Ferme modal |
| Chips filtres | `data-action="filtrer-activites"` | Filtre par catégorie |
| Submit formulaire | — | Sauvegarde activité |

**Formulaire activité (modal) :**
| Champ | Type | Requis |
|-------|------|--------|
| activite_id | hidden | — |
| activite_gite_id | hidden | — |
| activite_nom | text | Oui |
| activite_categorie | select | Oui (Restaurant / Café-Bar / Musée / Château / Parc / Hôtel / Attraction) |
| activite_description | textarea | Non |
| activite_adresse | text | Non |
| activite_latitude | number | Non (readonly, auto-calculé) |
| activite_longitude | number | Non (readonly, auto-calculé) |
| activite_distance_km | number | Non (readonly, auto-calculé) |
| activite_url | url | Non |
| activite_telephone | tel | Non |
| activite_note | number | Non (0–5) |
| activite_nb_avis | number | Non |

---

### tab-faq.html

**Type :** Onglet — FAQ  
**Audience :** Propriétaires de gîtes  

**Objectif :** Système de FAQ catégorisée avec recherche plein texte, gestion admin des questions/réponses et rétro-traduction FR→EN automatique.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Boutons Ajouter question + Rétro-traduire |
| Barre de recherche | Recherche temps réel |
| Filtres catégorie | 8 chips (Tous / Arrivée / Départ / Équipements / Localisation / Tarifs / Règlement / Autre) |
| Liste FAQ | Accordéon questions/réponses |
| Modal ajout/édition | Formulaire question |

**Boutons / Actions :**
| Data-action | Handler | Description |
|-------------|---------|-------------|
| `ajouter-question` | `window.ajouterQuestionFAQ()` | Ouvre modal |
| `retro-traduire-faq` | `window.backfillFAQTranslations()` | Traduction FR→EN auto |
| `filtrer-faq` | `window.filtrerFAQ(category)` | Filtre par catégorie |
| `toggle-faq` | — | Expand/collapse item |
| `modifier-question` | `window.modifierQuestion(id)` | Édite question |
| `supprimer-question` | `window.supprimerQuestion(id)` | Supprime question |
| `fermer-modal` | `window.fermerModalQuestion()` | Ferme modal |
| `sauvegarder-question` | `window.sauvegarderQuestionFAQ()` | Sauvegarde |
| Recherche | `window.rechercherFAQ(value)` | Recherche temps réel |

**Formulaire question (modal) :**
| Champ | Type | Requis | Options |
|-------|------|--------|---------|
| question-id | hidden | — | — |
| question-categorie | select | Oui | arrivee / depart / equipements / localisation / tarifs / reglement / autre |
| question-gite | select | Oui | Tous ou gîte spécifique |
| question-titre | text | Oui | — |
| question-reponse | textarea | Oui | — |
| question-ordre | number | Non | Ordre d'affichage |

---

### tab-communaute.html

**Type :** Onglet — Communauté (Artisans)  
**Audience :** Propriétaires de gîtes  

**Objectif :** Annuaire partagé d'artisans et prestataires locaux avec système de notation, carte interactive et gestion des avis.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Compteur total artisans |
| Formulaire ajout | Card formulaire nouvelle fiche artisan |
| Carte interactive | Section Leaflet |
| Liste artisans | 2 colonnes : liste filtrée + détail sélectionné |

**Boutons / Actions :**
| ID / Handler | Description |
|-------------|-------------|
| `#communauteGeocodeBtn` | Calcule coordonnées GPS depuis adresse |
| Soumettre formulaire | Crée fiche artisan |

**Formulaire artisan :**
| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| communauteGestionnaire | text | Non | readonly |
| communauteNom | text | Oui | max=200 |
| communauteMetier | select | Oui | — |
| communauteTelephone | tel | Non | max=50 |
| communauteVille | text | Non | max=120 |
| communauteAdresse | text | Oui | max=300 |
| communauteLat | number | Oui | readonly, auto-calculé |
| communauteLng | number | Oui | readonly, auto-calculé |
| communauteDescription | textarea | Non | max=2000 |
| communauteNoteInitiale | select | Non | 1–5 étoiles ou aucune |
| communauteCommentaireInitial | textarea | Non | max=2000 |

---

## Variantes Calou

> Les variantes **Calou** (`-calou.html`) sont des versions alternatives des onglets principaux utilisant un système de design distinct ("CALOU theme") avec classes CSS `calou-*` et attributs `data-calou-icon`. Elles exposent les mêmes données mais avec une présentation différente.

### tab-dashboard-calou.html

**Différences vs tab-dashboard.html :**
- Système d'icônes `data-calou-icon` (au lieu de Lucide)
- Classes CSS `calou-card`, `calou-btn-primary`, etc.
- Sections supplémentaires : Indicateurs financiers détaillés (URSSAF, IR, CA, Bénéfices, Trésorerie)
- 2 graphiques canvas (Bénéfices + Trésorerie)
- Layout VISION ACTIONS en 2 colonnes
- Todo lists : Administratif / Maintenance / Courses (au lieu de Réservations / Travaux / Achats)

**Boutons spécifiques :**
| Handler | Description |
|---------|-------------|
| `updateFinancialIndicators()` | Actualise indicateurs financiers |
| `openAddTodoModal(category)` | Ouvre modal tâche |
| `closeAddTodoModal()` | Ferme modal |
| `closeReponseWhatsappModal()` | Ferme modal WhatsApp |

---

### tab-menage-calou.html

**Différences vs tab-menage.html :**
- Thème CALOU avec `calou-card`, `calou-btn-primary`
- Organisation par blocs hebdomadaires avec numéro de semaine et dates
- Cartes ménage avec indicateurs de statut (validé/en attente)
- Boutons de validation directe sur chaque carte
- Titre "Planifier Ménage" (vs "Planning Ménage")

---

### tab-draps-calou.html

**Différences vs tab-draps.html :**
- Thème CALOU
- Sections identiques : Configuration besoins / Stocks réserves / Analyse & prévisions / Simulation
- Mêmes fonctions : `sauvegarderStocks()`, `simulerBesoins()`
- Input date pour simulation futurs besoins

---

*Fin partie 2/3 — Application Client (17 onglets + 3 variantes Calou documentés)*
