# 🧩 MODULES JAVASCRIPT - Gestion Gîte Calvignac

> **Date** : 23 janvier 2026  
> **Total** : 42+ fichiers JavaScript  
> **Organisation** : Modules singleton + Event handlers exportés vers `window`  
> **Pattern** : Vanilla JS sans framework, ES6+

---

## 📋 TABLE DES MATIÈRES

1. [Modules Configuration et Sécurité](#modules-configuration)
2. [Modules Métier Principaux](#modules-metier)
3. [Modules Fiches Clients](#modules-fiches)
4. [Modules Femme de Ménage](#modules-menage)
5. [Modules Utilitaires](#modules-utilitaires)
6. [Patterns et Conventions](#patterns)
7. [Récapitulatif](#recapitulatif)

---

<a name="modules-configuration"></a>
## 📁 MODULES DE CONFIGURATION ET SÉCURITÉ

### 1. **shared-config.js** - Configuration Centrale Supabase

**Rôle** : Configuration unique Supabase chargée dans toutes les pages

**Variables exportées** :
```javascript
window.LOCAL_CONFIG = {
    SUPABASE_URL: "https://[PROJECT].supabase.co",
    SUPABASE_KEY: "[ANON_KEY]"
}
```

**Utilisé par** : TOUS les modules

**⚠️ Sécurité** : Clé anonyme Supabase (publique), RLS protection côté serveur

---

### 2. **auth.js** - Gestionnaire d'Authentification (AuthManager)

**Rôle** : Singleton centralisant toute l'authentification Supabase

**Classe principale** : `AuthManager`

**Méthodes** :
- `init()` : Initialise client Supabase
- `checkAuthState()` : Vérifie session active
- `requireAuth()` : Protège une page (redirect si non auth)
- `login(email, password)` : Connexion email/password
- `logout()` : Déconnexion
- `signup(email, password, metadata)` : Inscription
- `getCurrentUser()` : Récupère user connecté
- `getSession()` : Récupère session active

**Export** :
```javascript
window.authManager = AuthManager;
```

**Pages utilisant** : TOUTES (sauf login.html, logout.html)

**Pattern d'utilisation** :
```javascript
// Protéger une page
await authManager.requireAuth();

// Récupérer user
const user = await authManager.getCurrentUser();
```

---

### 3. **security-utils.js** - Utilitaires Sécurité

**Rôle** : Protection XSS, validation entrées, sanitization

**Fonctions exportées** :
- `sanitizeHTML(html)` : Nettoie HTML (via DOMPurify)
- `sanitizeInput(str)` : Échappe caractères spéciaux
- `validateEmail(email)` : Validation email
- `validatePhone(phone)` : Validation téléphone français
- `escapeForAttribute(str)` : Échappe pour attributs HTML

**Dépendances** : DOMPurify (CDN)

**Export** :
```javascript
window.securityUtils = { sanitizeHTML, sanitizeInput, ... }
```

**Utilisé par** : Tous les formulaires, affichages dynamiques

---

### 4. **validation-utils.js** - Validation Formulaires

**Rôle** : Règles de validation réutilisables

**Fonctions** :
- `validateRequired(value, fieldName)` : Champ obligatoire
- `validateDate(date, fieldName)` : Format date valide
- `validateNumber(num, min, max, fieldName)` : Nombre dans range
- `validateURL(url)` : URL valide
- `showValidationError(element, message)` : Affiche erreur
- `clearValidationErrors(form)` : Efface erreurs

**Export** :
```javascript
window.validationUtils = { validateRequired, ... }
```

---

### 5. **error-logger.js** - Système de Logs Erreurs

**Rôle** : Capture et enregistre erreurs JavaScript

**Fonctions** :
- `logError(error, context)` : Log erreur console + optionnel BDD
- `setupGlobalErrorHandler()` : Capture erreurs globales
- `logToSupabase(errorData)` : Enregistre dans table `error_logs` (si existe)

**Export** :
```javascript
window.errorLogger = { logError, setupGlobalErrorHandler }
```

**Initialisation** : Automatique dans index.html

---

### 6. **rate-limiter.js** - Limitation Appels API

**Rôle** : Éviter spam API (MyMemory traduction, Nominatim géocodage)

**Fonctions** :
- `canMakeRequest(key, maxRequests, timeWindow)` : Vérifie si autorisé
- `recordRequest(key)` : Enregistre requête
- `getRemainingRequests(key)` : Requêtes restantes

**Export** :
```javascript
window.rateLimiter = { canMakeRequest, recordRequest }
```

**Utilisé par** : infos-gites.js (traduction), init-validation.js (géocodage)

---

<a name="modules-metier"></a>
## 📁 MODULES MÉTIER PRINCIPAUX

### 7. **gites-manager.js** - Gestionnaire Multi-Gîtes (SINGLETON)

**Rôle** : Module central de gestion des gîtes (CRUD + cache)

**Singleton** : `window.gitesManager`

**Méthodes** :
- `getAll()` : Liste tous les gîtes du user
- `getById(giteId)` : Récupère 1 gîte par ID
- `create(giteData)` : Crée nouveau gîte
- `update(giteId, data)` : Met à jour gîte
- `delete(giteId)` : Supprime gîte
- `getCurrentGite()` : Gîte actuellement sélectionné
- `setCurrentGite(giteId)` : Change gîte actif
- `clearCache()` : Vide cache local

**Cache** : Stocke résultats en mémoire pour perf

**Utilisé par** : TOUS les modules métier (réservations, ménage, draps, etc.)

**Pattern d'utilisation** :
```javascript
const gites = await window.gitesManager.getAll();
const gite = await window.gitesManager.getById(giteId);
```

---

### 8. **dashboard.js** - Logique Tableau de Bord

**Rôle** : Orchestre l'affichage du dashboard (stats, cartes, indicateurs)

**Fichier** : `/js/dashboard.js` (2627 lignes)

**Fonctions principales** :
- `initDashboard()` : Initialisation complète dashboard
- `loadDashboardData()` : Charge toutes les données
- `updateStatisticsCards()` : Met à jour cartes statistiques
- `updateReservationsProchaines()` : Affiche réservations à venir
- `updateMenagesAVenir()` : Planning ménages
- `updateFinancialIndicators()` : Indicateurs financiers (revenus, charges, URSSAF)
- `calculateOccupancyRate(giteId, year)` : Taux d'occupation
- `calculateRevenue(giteId, year)` : Revenus annuels

**Cartes dashboard** :
- Statistiques globales (nb réservations, taux occup, revenus)
- Réservations prochaines (7 jours)
- Ménages à planifier
- Indicateurs financiers (avec minimum URSSAF 1200€)

**⚠️ Fonctions désactivées** (tables supprimées 23/01/2026) :
- `updateDemandesClients()` : Demandes horaires clients (SUPPRIMÉ)
- `updateProblemesClients()` : Problèmes signalés (SUPPRIMÉ)

**Export** :
```javascript
window.initDashboard = initDashboard;
window.updateStatisticsCards = updateStatisticsCards;
```

---

### 9. **reservations.js** - Gestion Réservations

**Rôle** : CRUD complet réservations + import iCal

**Fichier** : `/js/reservations.js`

**Fonctions** :
- `initReservations()` : Init onglet réservations
- `loadReservations(giteId)` : Charge réservations d'un gîte
- `addReservation(data)` : Crée nouvelle réservation
- `updateReservation(id, data)` : Modifie réservation
- `deleteReservation(id)` : Supprime réservation
- `checkConflicts(giteId, dateDebut, dateFin, excludeId)` : Détecte conflits dates
- `openEditModal(reservationId)` : Ouvre modal édition
- `filterReservations(filters)` : Filtre par statut/plateforme/dates

**Statuts réservations** :
- `confirmed` : Confirmée
- `pending` : En attente
- `cancelled` : Annulée
- `BLOCKED` : Période bloquée (pas de résa)

**Plateformes supportées** :
- Airbnb, Booking.com, Abritel, Direct, Autre

**Validation** :
- ⚠️ **RÈGLE CRITIQUE** : 1 seule réservation par gîte à la fois
- Aucune résa ne peut démarrer le même jour qu'une autre
- En cas de conflit : garder la plus courte en durée

**Export** :
```javascript
window.initReservations = initReservations;
window.addReservation = addReservation;
window.deleteReservation = deleteReservation;
```

---

### 10. **sync-ical-v2.js** - Synchronisation iCal

**Rôle** : Import calendriers iCal depuis plateformes (Airbnb, Booking, etc.)

**Fichier** : `/js/sync-ical-v2.js`

**Dépendance** : ical.js (CDN)

**Fonctions** :
- `syncAllCalendars()` : Synchronise tous les gîtes
- `syncGiteCalendar(giteId)` : Sync 1 gîte
- `parseIcalData(icalData)` : Parse fichier iCal
- `importReservations(events, giteId)` : Importe réservations
- `detectConflicts(events, existingResas)` : Détecte conflits
- `resolveConflict(newResa, existingResa)` : Résout conflit (garde + courte)

**Pattern d'import** :
1. Fetch URL iCal du gîte
2. Parse avec ical.js
3. Extrait événements (VEVENT)
4. Convertit en format réservations
5. Détecte conflits avec existantes
6. Importe ou met à jour

**⚠️ Gestion conflits** :
- Si chevauchement : garde réservation la plus courte
- Supprime ou annule l'autre
- Log dans console

**Export** :
```javascript
window.syncAllCalendars = syncAllCalendars;
```

---

### 11. **menage.js** - Planning Ménage Automatique

**Rôle** : Calcul automatique des dates/horaires de ménage selon règles métier

**Fichier** : `/js/menage.js`

**Table BDD** : `cleaning_schedule`

**Fonctions** :
- `afficherPlanningParSemaine()` : Affiche planning par semaines ⭐ FONCTION PRINCIPALE
- `calculerMenages(reservations)` : Calcule ménages selon règles
- `proposerDateMenage(resa, regles)` : Propose date/heure selon règles
- `validerMenage(menageId)` : Valide proposition
- `refuserMenage(menageId)` : Refuse proposition
- `modifierMenage(menageId, newDate, newHour)` : Modifie date/heure

**Règles métier** (via `cleaning_rules`) :
1. **Enchainement** : Si résa J à J+3, ménage entre les 2
2. **Dimanche** : Éviter ménages le dimanche
3. **Samedi** : Préférer samedi si possible
4. **Jours fériés** : Éviter jours fériés
5. **Mercredi/Jeudi** : Éviter milieu semaine
6. **Horaires préférés** : Matin (10h) ou après-midi (14h)

**Statuts** :
- `pending` : En attente validation entreprise
- `pending_validation` : Proposition femme ménage
- `validated` : Validé
- `refused` : Refusé

**Export** :
```javascript
window.afficherPlanningParSemaine = afficherPlanningParSemaine;
window.validerMenage = validerMenage;
window.refuserMenage = refuserMenage;
```

**⚠️ IMPORTANT** : Toutes fonctions onclick doivent être exportées dans `window` (cf. CORRECTION_MENAGE_21JAN2026.md)

---

### 12. **cleaning-rules.js** - Gestion Règles Ménage

**Rôle** : Interface configuration règles ménage personnalisables

**Fichier** : `/js/cleaning-rules.js`

**Table BDD** : `cleaning_rules`

**Fonctions** :
- `loadCleaningRules()` : Charge règles depuis BDD
- `toggleRule(ruleCode)` : Active/désactive règle
- `updateRulePriority(ruleCode, priority)` : Change priorité
- `saveRulesConfig()` : Sauvegarde config

**9 règles par défaut** :
- `avoid_sunday` : Éviter dimanche
- `prefer_saturday` : Préférer samedi
- `avoid_holidays` : Éviter jours fériés
- `avoid_mid_week` : Éviter mercredi/jeudi
- `enchainement_same_day` : Ménage entre 2 résas
- `morning_preferred` : Préférer matin (10h)
- `afternoon_fallback` : Après-midi si matin impossible
- `min_2h_between` : Minimum 2h entre ménages
- `max_4_per_day` : Maximum 4 ménages/jour

**Config JSONB** : Paramètres personnalisables par règle

**Voir guide** : [GUIDE_REGLES_MENAGE.md](docs/GUIDE_REGLES_MENAGE.md)

---

### 13. **draps.js** - Gestion Linge et Stocks

**Rôle** : Suivi stocks linge + besoins par réservation

**Fichier** : `/js/draps.js`

**Tables BDD** : `linen_stocks`, `linen_stock_items`, `linen_needs`

**Fonctions** :
- `initDraps()` : Init onglet draps
- `loadStocks(giteId)` : Charge stocks actuels
- `loadBesoins(giteId)` : Charge besoins configurés
- `calculerBesoinsReservation(resa)` : Calcule linge nécessaire
- `simulerCouverture()` : Simule réservations couvertes avec stock actuel
- `sauvegarderStocks()` : Sauvegarde stocks
- `editerBesoins(giteId)` : Édite besoins par défaut
- `ajouterItemCustom()` : Ajoute type linge personnalisé

**Types linge par défaut** :
- Draps plats grands/petits
- Housses couettes grandes/petites
- Taies oreillers
- Serviettes
- Tapis bain

**⭐ Stocks dynamiques** : `linen_stock_items` permet types personnalisés

**Simulation** :
- Calcule combien de réservations couvertes avec stock actuel
- Propose quantités à emmener pour X prochaines résas
- Alerte si stock insuffisant

**Export** :
```javascript
window.initDraps = initDraps;
window.sauvegarderStocks = sauvegarderStocks;
```

---

### 14. **fiscalite-v2.js** - Fiscalité LMNP Multi-Gîtes

**Rôle** : Simulations fiscales Location Meublée Non Professionnelle

**Fichier** : `/js/fiscalite-v2.js` (5364 lignes) - LE PLUS GROS MODULE

**Tables BDD** : `simulations_fiscales`, `fiscal_history`, `charges`, `fiscalite_amortissements`

**Fonctions principales** :
- `calculerFiscalite(annee, giteIds)` : Calcul complet multi-gîtes
- `calculerCharges(annee, giteIds)` : Somme charges déductibles
- `calculerAmortissements(annee)` : Amortissements linéaires
- `calculerCotisationsURSSAF(benefice)` : Cotisations sociales
- `calculerImpotRevenu(revenuImposable)` : IR avec barème progressif
- `calculerTrimestresRetraite(benefice)` : Validation trimestres
- `sauvegarderSimulation(data)` : Enregistre simulation
- `exporterPDF()` : Génère rapport PDF

**Taux fiscaux** : Voir `taux-fiscaux-config.js`

**Composants calculés** :
1. **Revenus locatifs** : Somme réservations année N
2. **Charges déductibles** : EDF, eau, internet, travaux, assurance, etc.
3. **Amortissements** : Bâtiment (3% / 33 ans), Mobilier (10% / 10 ans)
4. **Bénéfice** : Revenus - Charges - Amortissements
5. **URSSAF** : Indemnités (0.85%), Retraite (17.75% + 7%), Invalidité (1.3%), CSG-CRDS (9.7%), Formation (0.25%), Alloc familiales (0-3.1%)
6. **Impôt Revenu** : Barème progressif 2024/2025
7. **Trimestres retraite** : Selon seuils SMIC

**⚠️ URSSAF minimum** : 1 200 € / an (cotisations minimales légales)

**Export** :
```javascript
window.calculerFiscalite = calculerFiscalite;
window.sauvegarderSimulation = sauvegarderSimulation;
```

**Voir doc** : [CORRECTIONS_AUDIT_FISCAL_19JAN2026.md](docs/CORRECTIONS_AUDIT_FISCAL_19JAN2026.md)

---

### 15. **taux-fiscaux-config.js** - Configuration Taux Fiscaux

**Rôle** : Configuration centralisée taux fiscaux annuels

**Fichier** : `/js/taux-fiscaux-config.js`

**Singleton** : `window.TAUX_FISCAUX`

**Méthodes** :
- `getConfig(annee)` : Récupère config année N
- `getCurrentYear()` : Année en cours

**Taux gérés** :
- **URSSAF** : Tous taux détaillés (2024, 2025, +futures)
- **Barème IR** : Tranches impôt revenu
- **Barème kilométrique** : Par puissance fiscale et distance
- **PASS** : Plafond Sécurité Sociale (46 368 € en 2024/2025)
- **Abattements** : Salaires, retraites
- **SMIC** : Horaire et mensuel

**Usage** :
```javascript
const config = window.TAUX_FISCAUX.getConfig(2025);
const urssaf = config.URSSAF;
const indemnites = benefice * urssaf.indemnites_journalieres.taux;
```

**Maintenance** : Copier section année N-1, mettre à jour taux janvier/février

---

### 16. **km-manager.js** - Gestion Kilomètres Professionnels

**Rôle** : Suivi trajets professionnels + calcul barème kilométrique

**Fichier** : `/js/km-manager.js`

**Tables BDD** : `km_trajets`, `km_lieux_favoris`, `km_config_auto`

**Singleton** : `window.KmManager`

**Fonctions** :
- `ajouterTrajet(data)` : Enregistre nouveau trajet
- `calculerIndemnites(distance, puissanceFiscale, annee)` : Calcul selon barème
- `getTrajetsAnnee(annee)` : Liste trajets année N
- `ajouterLieuFavori(nom, adresse)` : Lieu récurrent
- `getLieuxFavoris()` : Liste lieux favoris
- `calculerTotalAnnuel(annee)` : Total indemnités année N

**Barème kilométrique** :
- Tranches : 0-5000 km, 5001-20000 km, 20000+ km
- Par puissance fiscale : 3-4 CV, 5-7 CV, 8+ CV
- Formules : d × taux ou (d × coef) + fixe

**Export** :
```javascript
window.KmManager = KmManager;
```

---

### 17. **charges.js** - Gestion Charges Déductibles

**Rôle** : Saisie charges déductibles fiscalement

**Fichier** : `/js/charges.js`

**Table BDD** : `charges`

**Catégories** :
- EDF / Eau / Gaz
- Internet / Téléphone
- Assurance
- Travaux / Réparations
- Fournitures
- Taxe foncière
- Charges copropriété
- Autres

**Fonctions** :
- `ajouterCharge(data)` : Ajoute charge
- `modifierCharge(id, data)` : Modifie charge
- `supprimerCharge(id)` : Supprime charge
- `getChargesAnnee(annee, giteIds)` : Charges année N
- `calculerTotalCharges(annee, giteIds)` : Total déductible

**Export** :
```javascript
window.ajouterCharge = ajouterCharge;
window.getChargesAnnee = getChargesAnnee;
```

---

### 18. **calendrier-tarifs.js** - Calendrier avec Tarifs

**Rôle** : Calendrier visuel avec tarifs journaliers + promotions

**Fichier** : `/js/calendrier-tarifs.js` (2308 lignes)

**Fonctions** :
- `renderCalendrierTarifsTab()` : Affiche onglet complet
- `renderCalendrierTarifs()` : Affiche calendrier mois
- `openTarifModal(dateStr)` : Édite tarif journée
- `saveTarifFromModal()` : Sauvegarde tarif
- `calculerPrixWithPromos(date, prixBase)` : Applique promotions
- `renderCalendrierReservations()` : Vue réservations
- `exportCalendrierComplet()` : Export Excel
- `toggleTableauGDF()` : Affiche grille dates/forfaits

**Règles tarification** :
- Prix base par jour
- Périodes spéciales (vacances, événements)
- Promotions : % réduction ou prix fixe
- Durée min séjour
- Week-end obligatoire ou non

**Modes affichage** :
1. **Calendrier tarifs** : Vue mensuelle avec prix/jour
2. **Calendrier réservations** : Vue réservations (overlay)
3. **Grille dates/forfaits** : Tableau prix par durée

**Export** :
```javascript
window.renderCalendrierTarifsTab = renderCalendrierTarifsTab;
window.openTarifModal = openTarifModal;
window.exportCalendrierComplet = exportCalendrierComplet;
```

---

### 19. **remplissage-auto-tarifs.js** - Remplissage Automatique Tarifs

**Rôle** : Assistant remplissage tarifs selon profil (standard, premium, eco)

**Fichier** : `/js/remplissage-auto-tarifs.js`

**Fonctions** :
- `ouvrirModalRemplissageAuto()` : Ouvre assistant
- `appliquerProfilTarif(profil, params)` : Applique profil sélectionné
- `genererTarifsPersonnalises(params)` : Génère tarifs custom

**Profils** :
- **Standard** : Prix moyens marché
- **Premium** : Tarifs élevés (+30%)
- **Éco** : Tarifs bas (-20%)
- **Personnalisé** : Paramètres manuels

**Paramètres** :
- Prix base nuit
- % haute saison
- % basse saison
- Durée min séjour
- Réduction long séjour

**Export** :
```javascript
window.ouvrirModalRemplissageAuto = ouvrirModalRemplissageAuto;
```

---

<a name="modules-fiches"></a>
## 📁 MODULES FICHES CLIENTS

### 20. **infos-gites.js** - Informations Gîtes Détaillées

**Rôle** : Gestion complète infos gîtes pour génération fiches clients bilingues

**Fichier** : `/js/infos-gites.js` (2267 lignes) - 2ÈME PLUS GROS MODULE

**Table BDD** : `infos_gites` (119 colonnes bilingues)

**8 sections** :
1. **Base** : Adresse, téléphone, GPS, email
2. **WiFi** : SSID, password, débit, QR code
3. **Arrivée** : Heure, parking, accès, codes, clés
4. **Logement** : Chauffage, cuisine, équipements
5. **Déchets** : Tri, collecte, déchèterie
6. **Sécurité** : Détecteurs, extincteur, urgences
7. **Départ** : Heure, checklist, restitution clés
8. **Règlement** : Tabac, animaux, nb personnes, caution

**Fonctions principales** :
- `selectGiteInfos(giteNom)` : Change gîte actif
- `loadInfosGiteFromSupabase(giteId)` : Charge infos BDD
- `saveInfosGiteToSupabase()` : Sauvegarde infos
- `toggleLanguageInfos()` : Switch FR/EN
- `translateAllFields()` : Traduit tous champs vides EN
- `attachAutoTranslation()` : Traduction auto lors saisie
- `updateQRCodeWifi()` : Génère QR code WiFi
- `geocodeAddress()` : Géocode adresse via Nominatim
- `genererPageClient()` : Génère fiche-client.html

**Traduction automatique** :
- API MyMemory (10 000 requêtes/jour)
- Traduction FR→EN lors saisie champ FR
- Rate limiting (1 req/sec)
- Batch translation : traduit tous champs EN vides

**QR Code WiFi** :
- Génération automatique QR code pour connexion WiFi
- Téléchargement PNG
- Impression directe

**Géocodage** :
- OpenStreetMap Nominatim
- Coordonnées GPS depuis adresse
- Rate limiting (1 req/sec)

**Export** :
```javascript
window.selectGiteInfos = selectGiteInfos;
window.saveInfosGiteToSupabase = saveInfosGiteToSupabase;
window.toggleLanguageInfos = toggleLanguageInfos;
window.updateQRCodeWifi = updateQRCodeWifi;
```

**Voir doc** : [DIAGNOSTIC_TRADUCTION_AUTO.md](DIAGNOSTIC_TRADUCTION_AUTO.md)

---

### 21. **checklists.js** - Checklists Entrée/Sortie (Bilingue)

**Rôle** : Gestion checklists check-in/check-out avec traduction auto

**Fichier** : `/js/checklists.js`

**Table BDD** : `checklist_templates` (colonnes `texte` / `texte_en`, `description` / `description_en`)

**Fonctions** :
- `loadChecklistTemplates(giteId, type)` : Charge templates
- `addChecklistItem(data)` : Ajoute item
- `editChecklistItem(itemId)` : Édite item
- `deleteChecklistItem(itemId)` : Supprime item
- `toggleItemEnabled(itemId)` : Active/désactive item
- `reorderItems(newOrder)` : Réordonne items (drag & drop)

**Types** :
- `entree` : Check-in (arrivée client)
- `sortie` : Check-out (départ client)

**Traduction automatique** :
- API MyMemory
- Champs `_en` générés automatiquement lors création/modification
- Utilisé dans fiches clients bilingues

**Affichage** :
- Backend : Liste éditable avec filtres gîte/type
- Fiche client : Liste items cochables avec switch FR/EN

**Export** :
```javascript
window.loadChecklistTemplates = loadChecklistTemplates;
window.addChecklistItem = addChecklistItem;
```

**Voir migration** : [sql/ADD_CHECKLIST_TRANSLATIONS.sql](sql/ADD_CHECKLIST_TRANSLATIONS.sql)

---

### 22. **faq.js** - Questions Fréquentes (Bilingue)

**Rôle** : FAQ clients avec traduction automatique

**Fichier** : `/js/faq.js`

**Table BDD** : `faq` (colonnes `question` / `question_en`, `reponse` / `reponse_en`)

**Fonctions** :
- `loadFAQ(giteId)` : Charge FAQ
- `addFAQItem(data)` : Ajoute question
- `editFAQItem(itemId)` : Édite question
- `deleteFAQItem(itemId)` : Supprime question
- `toggleFAQEnabled(itemId)` : Active/désactive
- `reorderFAQ(newOrder)` : Réordonne (drag & drop)

**Catégories** :
- Arrivée
- Logement
- Équipements
- Départ
- Urgences
- Autre

**Traduction automatique** : Identique checklists (MyMemory)

**Affichage** :
- Backend : Liste éditable accordéon
- Fiche client : Accordéon interactif avec switch FR/EN

**Export** :
```javascript
window.loadFAQ = loadFAQ;
window.addFAQItem = addFAQItem;
```

---

### 23. **decouvrir.js** - Activités Touristiques

**Rôle** : Module "À Découvrir" - Activités/POIs avec carte

**Fichier** : `/js/decouvrir.js` (refonte 20/01/2026)

**Table BDD** : `activites_gites`

**Fonctions** :
- `initModuleDecouvrir()` : Init module
- `chargerActivitesGite(giteId)` : Charge activités
- `afficherActivites(activites)` : Affiche grille cartes
- `filtrerParCategorie(categorie)` : Filtre par catégorie
- `ouvrirModalActivite(activiteId)` : Ouvre modal création/édition
- `sauvegarderActivite()` : Sauvegarde activité
- `supprimerActivite(id)` : Supprime activité
- `toggleCarte()` : Affiche/masque carte
- `initLeafletMap()` : Initialise carte OpenStreetMap

**9 catégories** :
- Restaurants
- Activités de plein air
- Culture
- Shopping
- Santé
- Services
- Loisirs
- Nature
- Événements

**Carte interactive** :
- Leaflet + OpenStreetMap
- Markers avec icônes par catégorie
- Popup au clic : nom, catégorie, distance
- Calcul distance depuis gîte (km)

**Interface moderne** :
- Grille de cartes responsive
- Filtres par catégorie (pastilles colorées)
- Icônes Font Awesome
- Animations hover

**Export PDF** : Génération guide activités PDF (feature planifiée)

**Export** :
```javascript
window.initModuleDecouvrir = initModuleDecouvrir;
window.chargerActivitesGite = chargerActivitesGite;
```

**Voir refonte** : [docs/REFONTE_DECOUVRIR_20JAN2026.md](docs/REFONTE_DECOUVRIR_20JAN2026.md)

---

### 24. **fiche-client-app.js** - Application Fiche Client (PWA)

**Rôle** : Application client bilingue offline (PWA)

**Fichier** : `/js/fiche-client-app.js` (2799 lignes) - 3ÈME PLUS GROS MODULE

**Page** : `/pages/fiche-client.html`

**Fonctionnalités** :
- **Bilingue** : Switch FR/EN instantané
- **PWA** : Installable, fonctionne offline
- **Sections** :
  1. En-tête : Nom gîte, adresse, coordonnées
  2. WiFi : SSID, password, QR code
  3. Arrivée : Heure, codes, parking, accès
  4. Logement : Équipements, chauffage, cuisine
  5. Déchets : Tri, collecte
  6. Sécurité : Détecteurs, urgences
  7. Départ : Heure, checklist
  8. Règlement : Tabac, animaux, caution
  9. FAQ : Questions fréquentes
  10. À Découvrir : Activités touristiques

**Fonctions principales** :
- `initFicheClient()` : Init application
- `loadFicheData(token)` : Charge données depuis token
- `switchLanguage(lang)` : Change langue FR/EN
- `renderInfosSection(data, lang)` : Affiche section infos
- `renderFAQSection(items, lang)` : Affiche FAQ
- `renderChecklistSection(items, lang)` : Affiche checklist
- `renderActivitesSection(activites, lang)` : Affiche activités

**Token système** :
- URL : `fiche-client.html?token=xxx`
- Token BDD : Table `client_access_tokens`
- Sécurité : Token unique, expiration optionnelle

**Service Worker** : `sw-fiche-client.js` (cache assets, offline)

**Manifest** : `manifest-fiche-client.json` (PWA config)

**Export** :
```javascript
window.initFicheClient = initFicheClient;
window.switchLanguage = switchLanguage;
```

**Voir audit** : [AUDIT_RESPONSIVE_MOBILE.md](docs/AUDIT_RESPONSIVE_MOBILE.md)

---

### 25. **fiches-clients.js** - Gestion Tokens Fiches Clients

**Rôle** : Génération/gestion tokens accès fiches clients

**Fichier** : `/js/fiches-clients.js`

**Table BDD** : `client_access_tokens`

**Fonctions** :
- `generateToken(reservationId, expiresAt)` : Génère token unique
- `getTokenURL(token)` : Construit URL complète
- `revokeToken(token)` : Révoque token
- `listTokens(giteId)` : Liste tokens actifs

**Workflow** :
1. Propriétaire génère token pour réservation
2. Partage URL via WhatsApp/Email/SMS
3. Client accède fiche sans authentification
4. Token peut expirer ou être révoqué

**⚠️ Fonctions désactivées** (tables supprimées 23/01/2026) :
- `getDemandesHoraires()` : Demandes clients (SUPPRIMÉ)

**Export** :
```javascript
window.generateToken = generateToken;
window.getTokenURL = getTokenURL;
```

---

<a name="modules-menage"></a>
## 📁 MODULES FEMME DE MÉNAGE

### 26. **femme-menage.js** - Interface Femme de Ménage

**Rôle** : Interface consultation planning + propositions modifications

**Fichier** : `/js/femme-menage.js`

**Page** : `/pages/femme-menage.html`

**Fonctions** :
- `chargerPlanningSemaine()` : Charge planning semaine
- `afficherPlanning(menages)` : Affiche cartes ménages
- `proposerModification(menageId)` : Propose nouvelle date/heure
- `annulerProposition(menageId)` : Annule proposition
- `consulterHistorique()` : Historique ménages validés/refusés

**Workflow** :
1. Femme ménage consulte planning semaine
2. Voit ménages `pending` ou `validated`
3. Peut proposer modification (statut → `pending_validation`)
4. Entreprise valide ou refuse
5. Historique complet accessible

**Interface** :
- Cartes colorées par gîte
- Indicateurs visuels statut
- Formulaire proposition simple
- Export PDF planning (optionnel)

**⚠️ Fonctions désactivées** (tables supprimées 23/01/2026) :
- `ajouterRetourMenage()` : Retours après ménage (SUPPRIMÉ)

**Export** :
```javascript
window.chargerPlanningSemaine = chargerPlanningSemaine;
window.proposerModification = proposerModification;
```

---

<a name="modules-utilitaires"></a>
## 📁 MODULES UTILITAIRES

### 27. **statistiques.js** - Statistiques et Graphiques

**Rôle** : Graphiques Chart.js (revenus, occupation, plateformes)

**Fichier** : `/js/statistiques.js`

**Dépendance** : Chart.js (CDN)

**Graphiques** :
- **Revenus mensuels** : Bar chart par mois
- **Taux d'occupation** : Line chart annuel
- **Répartition plateformes** : Pie chart (Airbnb, Booking, Direct)
- **Évolution réservations** : Line chart nb résas/mois

**Fonctions** :
- `updateAllCharts(giteId, year)` : Met à jour tous graphiques
- `updateRevenueChart(data)` : Graphique revenus
- `updateOccupancyChart(data)` : Graphique occupation
- `updatePlatformChart(data)` : Graphique plateformes
- `filterStatsByYear(year)` : Filtre par année
- `updatePlatformCounters(reservations)` : Compteurs plateformes

**Export** :
```javascript
window.updateAllCharts = updateAllCharts;
window.filterStatsByYear = filterStatsByYear;
```

---

### 28. **archives.js** - Gestion Archives

**Rôle** : Archivage réservations anciennes (conservation historique)

**Fichier** : `/js/archives.js`

**Fonctions** :
- `archiverReservations(year)` : Archive résas année N
- `consulterArchives(year)` : Consulte archives
- `restaurerReservation(id)` : Restaure depuis archives

**Table BDD** : `reservations` (colonne `archived` boolean)

**Utilité** : Nettoyer vue principale sans perdre historique

---

### 29. **gites-crud.js** - CRUD Gîtes

**Rôle** : Interface création/modification/suppression gîtes

**Fichier** : `/js/gites-crud.js`

**Fonctions** :
- `openCreateGiteModal()` : Ouvre modal création
- `openEditGiteModal(giteId)` : Ouvre modal édition
- `saveGite(data)` : Crée ou modifie gîte
- `deleteGite(giteId)` : Supprime gîte (avec confirmations)
- `validateGiteForm(data)` : Validation formulaire

**Champs gîte** :
- Nom
- Adresse complète
- Capacité (nb personnes)
- Nb chambres
- Surface (m²)
- URL iCal (sync calendrier)
- Couleur (pour affichages)

**Sécurité** : Suppression nécessite confirmation + vérif pas de résa active

---

### 30. **shared-utils.js** - Utilitaires Partagés

**Rôle** : Fonctions utilitaires réutilisables

**Fichier** : `/js/shared-utils.js`

**Fonctions** :
- `formatDate(date, format)` : Formatage dates
- `formatCurrency(amount)` : Formatage monétaire (€)
- `calculateDaysBetween(date1, date2)` : Calcul jours entre 2 dates
- `showToast(message, type)` : Notification toast
- `debounce(func, delay)` : Debounce function calls
- `throttle(func, limit)` : Throttle function calls
- `capitalizeFirst(str)` : Capitalise 1ère lettre
- `slugify(str)` : Convertit en slug URL

**Export** :
```javascript
window.sharedUtils = { formatDate, formatCurrency, ... }
```

---

### 31. **icons.js** - Icônes Personnalisées

**Rôle** : SVG icons inline pour plateformes/propriétés

**Fichier** : `/js/icons.js`

**Export** :
```javascript
window.ICONS = {
    airbnb: '<svg>...</svg>',
    booking: '<svg>...</svg>',
    abritel: '<svg>...</svg>',
    ...
}
```

**Utilisé par** : Tous affichages réservations, stats

---

### 32. **platform-icons.js** - Icônes Plateformes

**Rôle** : Icônes spécifiques plateformes réservation

**Fichier** : `/js/platform-icons.js`

**Similaire** : icons.js (possiblement doublon à nettoyer)

---

### 33. **property-icons.js** - Icônes Propriétés

**Rôle** : Icônes équipements logement (WiFi, parking, cuisine, etc.)

**Fichier** : `/js/property-icons.js`

**Export** :
```javascript
window.PROPERTY_ICONS = {
    wifi: '<svg>...</svg>',
    parking: '<svg>...</svg>',
    kitchen: '<svg>...</svg>',
    ...
}
```

---

### 34. **custom-platform-select.js** - Select Plateformes Custom

**Rôle** : Dropdown personnalisé pour sélection plateforme avec icônes

**Fichier** : `/js/custom-platform-select.js`

**Export** :
```javascript
window.CustomPlatformSelect = {
    init: function(selectElement) { ... },
    getValue: function() { ... }
}
```

**Utilisé dans** : Formulaires ajout/édition réservations

---

### 35. **init-validation.js** - Validation Initialisation

**Rôle** : Validation spécifique formulaire infos pratiques

**Fichier** : `/js/init-validation.js`

**Fonctions** :
- `standardizeFrenchPhone(phone)` : Normalise tél français
- `initValidationInfosPratiques()` : Attache validateurs

**Export** :
```javascript
window.initValidationInfosPratiques = initValidationInfosPratiques;
```

---

### 36. **widget-horaires-clients.js** - Widget Horaires

**Rôle** : Widget affichage horaires arrivée/départ (fiche client)

**Fichier** : `/js/widget-horaires-clients.js`

**Fonctions** :
- `renderHorairesWidget(horaires)` : Affiche widget
- `formatHoraire(heure)` : Formate heure (14h00)

**Utilisé dans** : fiche-client-app.js

---

### 37. **fiche-activites-map.js** - Carte Activités Fiche Client

**Rôle** : Carte Leaflet pour activités dans fiche client

**Fichier** : `/js/fiche-activites-map.js`

**Fonctions** :
- `initActivitesMap(activites, giteCoords)` : Init carte
- `addActivityMarker(activite)` : Ajoute marker activité

**Utilisé dans** : fiche-client-app.js (section À Découvrir)

---

### 38. **fiche-client.js** - Logique Fiche Client (Backend)

**Rôle** : Logique backend génération fiches (différent de fiche-client-app.js)

**Fichier** : `/js/fiche-client.js`

**Fonctions** :
- `genererFicheClientHTML(reservationId)` : Génère HTML complet
- `envoyerFicheParEmail(email, ficheHTML)` : Envoie par email
- `telechargerFichePDF(reservationId)` : Télécharge PDF

**Note** : À différencier de `fiche-client-app.js` (application client)

---

### 39. **cleaning-rules-modal.js** - Modal Règles Ménage

**Rôle** : Interface modale configuration règles ménage

**Fichier** : `/js/cleaning-rules-modal.js`

**Fonctions** :
- `openCleaningRulesModal()` : Ouvre modal
- `closeCleaningRulesModal()` : Ferme modal
- `saveRulesFromModal()` : Sauvegarde règles

**Utilisé dans** : tab-menage.html (bouton "⚙️ Configurer règles")

---

### 40. **mobile.js** - Adaptations Mobile

**Rôle** : Scripts spécifiques version mobile responsive

**Fichier** : `/js/mobile.js`

**Fonctions** :
- `initMobileNav()` : Navigation mobile (hamburger)
- `adjustForMobile()` : Ajustements layout mobile
- `detectMobileDevice()` : Détecte device mobile

**Dossier mobile** : `/js/mobile/` (scripts additionnels)

---

### 41. **supabase-operations.js** - Opérations Supabase Génériques

**Rôle** : Helpers génériques requêtes Supabase

**Fichier** : `/js/supabase-operations.js`

**Fonctions** :
- `insert(table, data)` : Insert générique
- `update(table, id, data)` : Update générique
- `delete(table, id)` : Delete générique
- `select(table, filters)` : Select avec filtres

**Export** :
```javascript
window.supabaseOps = { insert, update, delete, select }
```

**Pattern** : Abstraction requêtes Supabase pour réutilisation

---

### 42. **calendrier-tarifs-simple.js** - Calendrier Tarifs Simplifié

**Rôle** : Version simplifiée calendrier tarifs (possiblement obsolète)

**Fichier** : `/js/calendrier-tarifs-simple.js`

**Note** : Vérifier si utilisé ou à archiver (doublon avec calendrier-tarifs.js)

---

## 📁 FICHIERS BACKUP (À NETTOYER)

### Fichiers backup identifiés :
- `dashboard.js.backup_avant_nettoyage` : Backup dashboard avant nettoyage 23/01/2026
- `reservations.js.backup` : Backup réservations (date inconnue)

**Action recommandée** : Archiver dans `_archives/js_obsoletes/`

---

<a name="patterns"></a>
## 🔄 PATTERNS ET CONVENTIONS

### Pattern Singleton
Modules principaux exposés comme singletons :
```javascript
window.gitesManager = { ... }
window.authManager = { ... }
window.KmManager = { ... }
```

### Export Fonctions onclick
Toutes fonctions utilisées dans `onclick=""` doivent être exportées :
```javascript
window.nomFonction = nomFonction;
```

### Gestion Erreurs
```javascript
try {
    // Code métier
} catch (error) {
    console.error('[Module]', error);
    window.errorLogger?.logError(error, { context: 'nomFonction' });
    showToast('❌ Erreur: ' + error.message, 'error');
}
```

### Rate Limiting APIs Externes
```javascript
if (!window.rateLimiter.canMakeRequest('myMemoryAPI', 10, 1000)) {
    showToast('⚠️ Trop de requêtes, patientez...', 'warning');
    return;
}
window.rateLimiter.recordRequest('myMemoryAPI');
// Appel API
```

### Cache Local
Modules principaux utilisent cache mémoire :
```javascript
let cache = null;
async function getData() {
    if (cache) return cache;
    cache = await fetchFromDB();
    return cache;
}
```

### Notification Utilisateur
```javascript
function showToast(message, type = 'info') {
    // type: 'success', 'error', 'warning', 'info'
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
```

---

<a name="recapitulatif"></a>
## 📊 RÉCAPITULATIF MODULES

### Par Nombre de Lignes

**Top 10 plus gros** :
1. **fiscalite-v2.js** : 5364 lignes
2. **fiche-client-app.js** : 2799 lignes
3. **dashboard.js** : 2627 lignes
4. **calendrier-tarifs.js** : 2308 lignes
5. **infos-gites.js** : 2267 lignes
6. **reservations.js** : ~1500 lignes (estimation)
7. **menage.js** : ~1200 lignes (estimation)
8. **fiches-clients.js** : ~982 lignes
9. **km-manager.js** : ~812 lignes
10. **decouvrir.js** : ~770 lignes

### Par Catégorie

**Configuration/Sécurité** (6 modules) :
- shared-config.js
- auth.js
- security-utils.js
- validation-utils.js
- error-logger.js
- rate-limiter.js

**Métier principaux** (13 modules) :
- gites-manager.js
- dashboard.js
- reservations.js
- sync-ical-v2.js
- menage.js
- cleaning-rules.js
- draps.js
- fiscalite-v2.js
- taux-fiscaux-config.js
- km-manager.js
- charges.js
- calendrier-tarifs.js
- remplissage-auto-tarifs.js

**Fiches clients** (5 modules) :
- infos-gites.js
- checklists.js
- faq.js
- decouvrir.js
- fiche-client-app.js
- fiches-clients.js

**Femme de ménage** (1 module) :
- femme-menage.js

**Utilitaires** (14 modules) :
- statistiques.js
- archives.js
- gites-crud.js
- shared-utils.js
- icons.js
- platform-icons.js
- property-icons.js
- custom-platform-select.js
- init-validation.js
- widget-horaires-clients.js
- fiche-activites-map.js
- fiche-client.js
- cleaning-rules-modal.js
- mobile.js
- supabase-operations.js

**Obsolètes/Backup** (3 fichiers) :
- calendrier-tarifs-simple.js
- dashboard.js.backup_avant_nettoyage
- reservations.js.backup

### Dépendances Externes

**APIs** :
- **Supabase** : Auth + Database (TOUTES les pages)
- **MyMemory Translation** : infos-gites.js, checklists.js, faq.js
- **OpenStreetMap Nominatim** : infos-gites.js (géocodage)

**CDN Libraries** :
- **@supabase/supabase-js** : Client Supabase
- **DOMPurify** : XSS protection (security-utils.js)
- **Chart.js** : Graphiques (statistiques.js)
- **ical.js** : Parsing iCal (sync-ical-v2.js)
- **Leaflet** : Cartes OpenStreetMap (decouvrir.js, fiche-activites-map.js)
- **xlsx.js** : Export Excel (calendrier-tarifs.js)

**Fontes & Icons** :
- **Font Awesome 6** : Icônes (toutes les pages)
- **Google Fonts** : Typographie

---

## ✅ ACTIONS RECOMMANDÉES

### Nettoyage Urgent
1. ✅ **Archiver backups** : Déplacer `.backup` vers `_archives/js_obsoletes/`
2. ⚠️ **Vérifier doublons** : 
   - `icons.js` vs `platform-icons.js` (possiblement redondants)
   - `calendrier-tarifs.js` vs `calendrier-tarifs-simple.js` (simple = obsolète ?)
   - `fiche-client.js` vs `fiche-client-app.js` (clarifier rôles)

### Documentation Code
1. Ajouter JSDoc comments sur fonctions publiques
2. Documenter paramètres et retours
3. Ajouter exemples d'usage dans commentaires

### Optimisations
1. **Lazy loading** : Charger modules uniquement quand onglet activé
2. **Code splitting** : Séparer fiscalite-v2.js (5364 lignes) en sous-modules
3. **Bundle minification** : Minifier JS pour production

### Tests
1. Tests unitaires modules singletons (gitesManager, authManager)
2. Tests intégration API Supabase
3. Tests E2E parcours utilisateur complets

---

**✅ Documentation complète des 42 modules JavaScript terminée !**

*Suite : ÉTAPE 6/6 - Système de versioning et tag Git*
