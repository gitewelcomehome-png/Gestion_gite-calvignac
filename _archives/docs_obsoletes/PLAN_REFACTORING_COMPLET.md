# 🔧 PLAN REFACTORING COMPLET - ÉLIMINATION HARDCODES

**Date**: 7 janvier 2026  
**Objectif**: Supprimer TOUS les hardcodes pour architecture 100% dynamique  
**Durée estimée**: 20-25 heures  

---

## ✅ CE QUI A DÉJÀ ÉTÉ FAIT

### Phase 0: Normalisation (TERMINÉ)
- ✅ Suppression de TOUS les accents (Trévoux → Trevoux)
- ✅ 100% du code source normalisé
- ✅ GitesManager créé (js/gites-manager.js)
- ✅ Méthodes ajoutées : `getCoordinates()`, `getCoordinatesByName()`, `getCoordinatesBySlug()`
- ✅ Architecture BDD propre créée (9 tables, foreign keys, RLS)
- ✅ Scripts SQL prêts (reset + seed + CRUD)

### État Actuel
- **Code JS**: Utilise encore `gite TEXT` avec noms hardcodés
- **BDD**: Ancienne structure (gite TEXT au lieu de gite_id UUID)
- **Configs**: Hardcodées dans le code (ICAL_CONFIGS, BESOINS_PAR_RESERVATION)

---

## 🎯 OBJECTIF FINAL

### Après Refactoring
- **Code JS**: Utilise `gite_id UUID` partout
- **BDD**: Nouvelle structure (gites table avec JSONB settings/ical_sources)
- **Configs**: Chargées dynamiquement depuis la BDD
- **Résultat**: Ajouter un gîte = 2 minutes SQL (au lieu de 2h code)

---

## 📋 PLAN DÉTAILLÉ PAR FICHIER

### PHASE 1: PRÉPARER GITESMANAGER (30 min)

#### ✅ Fichier: `js/gites-manager.js`
**Statut**: Partiellement fait

**Méthodes à ajouter**:
```javascript
// Récupérer settings JSONB
getSettings(giteId) {
    const gite = this.getById(giteId);
    return gite?.settings || {};
}

// Récupérer besoins draps
getLinenNeeds(giteId) {
    const settings = this.getSettings(giteId);
    return settings.linen_needs || {};
}

// Récupérer sources iCal
getIcalSources(giteId) {
    const gite = this.getById(giteId);
    return gite?.ical_sources || {};
}

// Obtenir toutes les sources iCal (tous gîtes)
getAllIcalSources() {
    const sources = {};
    this.gites.forEach(g => {
        sources[g.id] = g.ical_sources || {};
    });
    return sources;
}

// Créer un select HTML dynamique
createSelect(selectedGiteId = null, options = {}) {
    const select = document.createElement('select');
    select.className = options.className || 'gite-select';
    if (options.id) select.id = options.id;
    
    // Option vide optionnelle
    if (options.includeEmpty) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = options.emptyText || '-- Sélectionner un gîte --';
        select.appendChild(emptyOption);
    }
    
    // Options des gîtes
    this.gites.forEach(g => {
        const option = document.createElement('option');
        option.value = g.id;
        option.textContent = `${this.getIcon(g.id)} ${g.name}`;
        if (g.id === selectedGiteId) option.selected = true;
        select.appendChild(option);
    });
    
    return select;
}
```

**Tests à ajouter**:
- Vérifier que loadGites() charge depuis Supabase
- Vérifier que getSettings() retourne le JSONB
- Vérifier que getLinenNeeds() retourne les besoins draps

---

### PHASE 2: REFACTORER JS CRITIQUES (12h)

#### 1️⃣ Fichier: `js/sync-ical.js` (2h)
**Problème**: Config ICAL_CONFIGS hardcodée
**Occurrences**: 8

**Changements**:
```javascript
// ❌ AVANT (lignes 55-85)
for (const [platform, url] of Object.entries(window.ICAL_CONFIGS.couzon)) {
    // ...
}
for (const [platform, url] of Object.entries(window.ICAL_CONFIGS.trevoux)) {
    // ...
}

// ✅ APRÈS
async function syncAllCalendars() {
    const gites = await gitesManager.loadGites(currentOrganizationId);
    
    let totalAdded = 0, totalSkipped = 0, totalDeleted = 0, totalErrors = 0;
    
    for (const gite of gites) {
        addMessage(`Synchronisation ${gite.name}...`, 'info');
        
        const icalSources = gite.ical_sources || {};
        
        for (const [platform, url] of Object.entries(icalSources)) {
            if (!url) continue;
            
            try {
                addMessage(`  • ${platform}...`, 'info');
                const result = await syncCalendar(gite.id, platform, url);
                totalAdded += result.added;
                totalSkipped += result.skipped;
                totalDeleted += result.deleted;
                // ...
            } catch (error) {
                totalErrors++;
                window.SYNC_ERRORS.push({ 
                    giteId: gite.id, 
                    giteName: gite.name,
                    platform, 
                    error: error.message 
                });
            }
        }
    }
}

// ✅ Modifier syncCalendar() pour accepter giteId au lieu de giteName
async function syncCalendar(giteId, platform, icalUrl) {
    const gite = gitesManager.getById(giteId);
    // ... (reste identique)
}
```

**Fonctions à modifier**:
- `syncAllCalendars()` - Boucler sur gitesManager.getAll()
- `syncCalendar(giteId, platform, url)` - Accepter giteId au lieu de nom
- Supprimer `getIcalConfigs()` et `saveIcalConfigs()` (obsolètes)

**Tests**:
- Sync avec 2 gîtes
- Sync avec gîte sans config iCal
- Erreur si URL invalide

---

#### 2️⃣ Fichier: `js/draps.js` (2h)
**Problème**: BESOINS_PAR_RESERVATION hardcodé
**Occurrences**: 8

**Changements**:
```javascript
// ❌ AVANT (lignes 6-28)
const BESOINS_PAR_RESERVATION = {
    'trevoux': {
        draps_plats_grands: 6,
        draps_plats_petits: 3,
        // ...
    },
    'couzon': {
        draps_plats_grands: 4,
        // ...
    }
};

let stocksActuels = {
    'trevoux': {},
    'couzon': {}
};

// ✅ APRÈS
let linenNeeds = {}; // Chargé dynamiquement
let stocksActuels = {}; // Initialisé dynamiquement

// Initialiser au chargement
async function initDrapsModule() {
    const gites = await gitesManager.loadGites(currentOrganizationId);
    
    // Charger besoins depuis settings
    gites.forEach(g => {
        linenNeeds[g.id] = gitesManager.getLinenNeeds(g.id);
        stocksActuels[g.id] = {};
    });
    
    await chargerStocksDraps();
    await calculerPrevisionsDraps();
}

// Appeler à l'initialisation
document.addEventListener('DOMContentLoaded', () => {
    initDrapsModule();
});
```

**Fonctions à modifier**:
- `calculerPrevisionsDraps()` - Boucler sur gitesManager.getAll()
- `chargerStocksDraps()` - Utiliser gite_id
- `afficherPrevisions()` - Générer colonnes dynamiquement
- `sauvegarderStocks(giteId)` - Accepter giteId au lieu de nom

**HTML à générer dynamiquement**:
```javascript
// Générer onglets
const tabsHtml = gites.map(g => `
    <button class="tab ${g === gites[0] ? 'active' : ''}" 
            onclick="switchStockTab('${g.id}')">
        ${gitesManager.getIcon(g.id)} ${g.name}
    </button>
`).join('');

// Générer tableaux stocks
const stocksHtml = gites.map(g => `
    <div id="stocks_${g.id}" class="stock-tab ${g === gites[0] ? 'active' : ''}">
        <!-- Tableau stocks -->
    </div>
`).join('');
```

**Tests**:
- Affichage 2 gîtes avec besoins différents
- Sauvegarder stocks pour chaque gîte
- Calcul prévisions avec N gîtes

---

#### 3️⃣ Fichier: `js/menage.js` (3h)
**Problème**: Structure weeks fixe (trevoux/couzon)
**Occurrences**: 8

**Changements**:
```javascript
// ❌ AVANT (lignes 453-458)
if (!weeks[weekKey]) {
    weeks[weekKey] = {
        monday: monday,
        trevoux: [],
        couzon: []
    };
}

if (r.gite.includes('trevoux')) {
    weeks[weekKey].trevoux.push(menageInfo);
} else {
    weeks[weekKey].couzon.push(menageInfo);
}

// ✅ APRÈS
if (!weeks[weekKey]) {
    weeks[weekKey] = {
        monday: monday,
        gitesMenages: {}
    };
    
    // Initialiser pour chaque gîte
    const gites = gitesManager.getAll();
    gites.forEach(g => {
        weeks[weekKey].gitesMenages[g.id] = [];
    });
}

// Trouver le gîte_id de la réservation
const giteId = r.gite_id || gitesManager.mapOldNameToId(r.gite);
if (giteId && weeks[weekKey].gitesMenages[giteId]) {
    weeks[weekKey].gitesMenages[giteId].push(menageInfo);
}
```

**Génération HTML dynamique** (lignes 546-566):
```javascript
// ✅ APRÈS
sortedWeeks.forEach((weekKey, index) => {
    const week = weeks[weekKey];
    const gites = gitesManager.getAll();
    
    html += `
        <div class="cleaning-week-table">
            <div class="cleaning-week-header">
                <div class="week-number-big">${weekNumber}</div>
                <div class="week-dates-small">${weekDisplay}</div>
            </div>
            <div class="cleaning-week-body" style="display: grid; grid-template-columns: repeat(${gites.length}, 1fr); gap: 10px;">
    `;
    
    // Générer une colonne par gîte
    gites.forEach(g => {
        const menages = week.gitesMenages[g.id] || [];
        html += `
            <div class="cleaning-column">
                <div class="cleaning-column-header" style="background-color: ${g.color}">
                    ${gitesManager.getIcon(g.id)} ${g.name}
                </div>
                ${menages.length > 0 ? 
                    menages.map(m => generateCleaningItemHTML(m)).join('') :
                    '<div class="cleaning-item empty">Aucun ménage prévu</div>'
                }
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
});
```

**Fonctions à modifier**:
- `generateCleaningPlanning()` - Structure weeks dynamique
- `generateCleaningItemHTML()` - Utiliser gite_id
- `exportToFemmeMenage()` - Générer CSV dynamique

**Tests**:
- Planning avec 2 gîtes (actuel)
- Planning avec 3 gîtes (ajouter un test)
- Planning avec 1 gîte (edge case)

---

#### 4️⃣ Fichier: `js/reservations.js` (1h)
**Problème**: Objets byGite hardcodés
**Occurrences**: 6

**Changements**:
```javascript
// ❌ AVANT
const byGite = {
    'trevoux': reservations.filter(r => r.gite === 'Trevoux'),
    'couzon': reservations.filter(r => r.gite === 'Couzon')
};

// ✅ APRÈS
const byGite = {};
const gites = gitesManager.getAll();

gites.forEach(g => {
    byGite[g.id] = reservations.filter(r => r.gite_id === g.id);
});

// Stats par gîte
gites.forEach(g => {
    const giteName = g.name;
    const count = byGite[g.id].length;
    console.log(`${giteName}: ${count} réservations`);
});
```

**Fonctions à modifier**:
- `afficherStatistiquesReservations()` - Générer stats dynamiquement
- `filtrerReservations()` - Utiliser gite_id
- Tous les filtres dropdown - Générer options dynamiquement

**Tests**:
- Filtrer par gîte
- Stats avec N gîtes
- Export CSV avec colonnes dynamiques

---

#### 5️⃣ Fichier: `js/infos-gites.js` (2h)
**Problème**: IDs hardcodés (restaurantsTrevoux, etc.)
**Occurrences**: 12

**Changements**:
```javascript
// ❌ AVANT
const restaurantsGite = reservation.gite === 'Trevoux' ? 
    restaurants.trevoux : restaurants.couzon;

document.getElementById('restaurantsTrevoux').value = data.trevoux || '';
document.getElementById('restaurantsCouzon').value = data.couzon || '';

// ✅ APRÈS
const gite = gitesManager.getById(reservation.gite_id);
const restaurantsGite = restaurants[gite.id];

// Générer inputs dynamiquement
const gites = gitesManager.getAll();
gites.forEach(g => {
    const input = document.getElementById(`restaurants_${g.id}`);
    if (input) {
        input.value = data[g.id] || '';
    }
});
```

**HTML à générer** (dans loadTab si c'est dans tabs/):
```javascript
// Générer formulaire dynamique
const form = gites.map(g => `
    <div class="gite-section" style="border-left: 4px solid ${g.color}">
        <h3>${gitesManager.getIcon(g.id)} ${g.name}</h3>
        <textarea id="restaurants_${g.id}" rows="5"></textarea>
        <textarea id="activites_${g.id}" rows="5"></textarea>
    </div>
`).join('');
```

**Fonctions à modifier**:
- `chargerInfosGites()` - Utiliser gite_id
- `sauvegarderInfosGites()` - Boucler sur gites
- `genererFicheClient()` - Récupérer infos par gite_id

**Tests**:
- Sauvegarder infos pour N gîtes
- Générer fiche client avec bon gîte
- Formulaire s'adapte au nombre de gîtes

---

### PHASE 3: REFACTORER JS SECONDAIRES (4h)

#### 6️⃣ Fichier: `js/decouvrir.js` (2h)
**Problème**: activitesParGite et gitesCoordinates hardcodés
**Occurrences**: 21

**Changements**:
```javascript
// ❌ AVANT (lignes 15-22)
window.activitesParGite = { 'Trevoux': [], 'Couzon': [] };
const gitesCoordinates = {
    'Trevoux': { lat: 45.9423, lng: 4.7681 },
    'Couzon': { lat: 45.8456, lng: 4.8234 }
};

// ✅ APRÈS
async function initDecouvrirModule() {
    await gitesManager.loadGites(currentOrganizationId);
    
    // Initialiser structure dynamique
    window.activitesParGite = {};
    gitesManager.getAll().forEach(g => {
        activitesParGite[g.id] = [];
    });
    
    await chargerActivites();
    await initGoogleMap();
}

// Coordonnées depuis gitesManager
function initGoogleMap() {
    const giteInput = document.getElementById('decouvrir_gite');
    const giteId = giteInput ? giteInput.value : gitesManager.getAll()[0].id;
    
    const centerCoords = gitesManager.getCoordinates(giteId) || { lat: 45.94, lng: 4.77 };
    
    googleMap = new google.maps.Map(document.getElementById('googleMap'), {
        center: centerCoords,
        zoom: 13,
        // ...
    });
}
```

**Fonctions à modifier**:
- `initGoogleMap()` - Utiliser getCoordinates()
- `chargerActivites()` - Grouper par gite_id
- `afficherActivites()` - Générer filtres dynamiquement
- Tous les filtres gîtes - Utiliser gitesManager.createSelect()

**Tests**:
- Carte centrée sur bon gîte
- Filtrer activités par gîte
- Ajouter activité à N gîtes

---

#### 7️⃣ Fichier: `js/dashboard.js` (1h)
**Problème**: Couleurs hardcodées
**Occurrences**: 3

**Changements**:
```javascript
// ❌ AVANT
const color = gite === 'Trevoux' ? '#667eea' : '#f093fb';

// ✅ APRÈS
const giteObj = gitesManager.getById(giteId);
const color = giteObj?.color || '#667eea';
```

**Fonctions à modifier**:
- `afficherReservationsRecentes()` - Utiliser gite.color
- `genererGraphiques()` - Datasets dynamiques
- Toutes les références couleurs

**Tests**:
- Dashboard avec N gîtes
- Couleurs correctes partout

---

#### 8️⃣ Fichier: `js/widget-horaires-clients.js` (30min)
**Problème**: Couleurs switch hardcodé
**Occurrences**: 2

**Changements**: Identiques à dashboard.js

---

#### 9️⃣ Fichier: `js/statistiques.js` (30min)
**Problème**: Commentaires hardcodés
**Occurrences**: 1

**Changements**: Supprimer ou généraliser commentaires

---

### PHASE 4: SUPPRIMER CONFIGS HARDCODÉES (2h)

#### 🗑️ Fichier: `js/shared-config.js`
**Action**: Supprimer GITES_COORDS complètement

```javascript
// ❌ SUPPRIMER
const GITES_COORDS = {
    'Trevoux': { lat: 45.9417, lng: 4.7722 },
    'Couzon': { lat: 45.8436, lng: 4.8364 }
};

// ✅ Utiliser gitesManager.getCoordinates() partout
```

---

#### 🗑️ Fichier: `index.html`
**Action**: Supprimer ICAL_CONFIGS du <script>

```javascript
// ❌ SUPPRIMER (lignes ~50-80)
window.ICAL_CONFIGS = {
    couzon: {
        airbnb: '...',
        booking: '...',
        abritel: '...'
    },
    trevoux: {
        airbnb: '...',
        booking: '...',
        abritel: '...'
    }
};

// ✅ Configs maintenant dans gites.ical_sources (JSONB BDD)
```

---

### PHASE 5: CSS ET HTML DYNAMIQUES (4h)

#### 🎨 Grids 2-Colonnes Fixes
**Fichiers impactés**: `tabs/*.html`, `index.html`, CSS inline
**Occurrences**: ~40

**Solution globale**:
```html
<!-- Dans <head> de chaque page -->
<style id="dynamic-gites-styles"></style>

<script>
// Générer CSS dynamique après chargement gîtes
async function applyDynamicStyles() {
    await gitesManager.loadGites();
    const gitesCount = gitesManager.getAll().length;
    
    const styles = `
        .gites-grid {
            display: grid;
            grid-template-columns: repeat(${gitesCount}, 1fr);
            gap: 20px;
        }
        
        .cleaning-week-body {
            display: grid;
            grid-template-columns: repeat(${gitesCount}, 1fr);
            gap: 10px;
        }
        
        /* Responsive: max 3 colonnes sur mobile */
        @media (max-width: 768px) {
            .gites-grid,
            .cleaning-week-body {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.getElementById('dynamic-gites-styles').textContent = styles;
}

// Appeler au chargement
applyDynamicStyles();
</script>
```

---

#### 🏷️ Classes CSS Spécifiques
**Problème**: `.trevoux`, `.couzon` hardcodés

**Solution**:
```css
/* ❌ AVANT */
.gite-header.trevoux { background: #667eea; }
.gite-header.couzon { background: #f093fb; }

/* ✅ APRÈS (attribut data) */
.gite-header[data-gite-id] {
    /* Style par défaut */
}
```

```javascript
// Appliquer couleur dynamiquement
const header = document.querySelector('.gite-header');
const gite = gitesManager.getById(giteId);
header.setAttribute('data-gite-id', giteId);
header.style.backgroundColor = gite.color;
```

---

### PHASE 6: MIGRATION BDD (1h)

#### Ordre d'exécution:
1. ✅ Code JS 100% refactoré et testé avec ancienne BDD
2. Exécuter `00_reset_and_create_clean.sql` (reset complet)
3. Exécuter `01_seed_data.sql` (créer organization + 2 gîtes)
4. Re-sync calendriers iCal
5. Tests complets production

---

## 📊 RÉCAPITULATIF PAR PHASE

| Phase | Durée | Tâches | Priorité |
|-------|-------|--------|----------|
| **1. GitesManager** | 30min | Ajouter méthodes | 🔴 HAUTE |
| **2. JS Critiques** | 12h | 5 fichiers | 🔴 HAUTE |
| **3. JS Secondaires** | 4h | 4 fichiers | 🟡 MOYENNE |
| **4. Supprimer Configs** | 2h | 2 fichiers | 🟡 MOYENNE |
| **5. CSS/HTML Dynamiques** | 4h | Tous templates | 🟢 BASSE |
| **6. Migration BDD** | 1h | Exécuter SQL | 🔴 HAUTE |

**TOTAL**: ~23.5 heures

---

## ✅ CHECKLIST VALIDATION

Avant de considérer le refactoring terminé:

### Code
- [ ] Aucune référence à "Trevoux" ou "Couzon" (sauf mapOldNameToId temporaire)
- [ ] Aucun objet avec clés hardcodées
- [ ] Aucune comparaison `=== 'nom_gite'`
- [ ] Aucune boucle `['gite1', 'gite2'].forEach()`
- [ ] Toutes les configs viennent de la BDD (JSONB)
- [ ] GitesManager utilisé partout

### UI
- [ ] Grids s'adaptent au nombre de gîtes
- [ ] Couleurs dynamiques depuis BDD
- [ ] Formulaires générés dynamiquement
- [ ] Onglets créés dynamiquement

### Fonctionnel
- [ ] Sync iCal fonctionne avec N gîtes
- [ ] Planning ménage affiche N colonnes
- [ ] Stocks draps fonctionnent pour N gîtes
- [ ] Dashboard supporte N gîtes
- [ ] Réservations filtrables par N gîtes

### Tests
- [ ] Tester avec 2 gîtes (situation actuelle)
- [ ] Ajouter un 3ème gîte test → tout fonctionne
- [ ] Archiver un gîte → disparaît de l'UI
- [ ] Re-activer un gîte → réapparaît

### Migration
- [ ] Reset BDD exécuté
- [ ] Seed data créé
- [ ] Calendriers re-synchronisés
- [ ] Toutes les fonctionnalités testées en production

---

## 🚀 ORDRE D'EXÉCUTION

### Jour 1 (8h)
1. ✅ Phase 1: GitesManager (30min)
2. ✅ sync-ical.js (2h)
3. ✅ draps.js (2h)
4. ✅ menage.js (3h)
5. Commit + push

### Jour 2 (6h)
6. ✅ reservations.js (1h)
7. ✅ infos-gites.js (2h)
8. ✅ decouvrir.js (2h)
9. ✅ dashboard.js (1h)
10. Commit + push

### Jour 3 (5h)
11. ✅ widget-horaires-clients.js (30min)
12. ✅ statistiques.js (30min)
13. ✅ Supprimer configs hardcodées (2h)
14. ✅ CSS/HTML dynamiques (2h)
15. Commit + push

### Jour 4 (2h)
16. ✅ Tests complets avec ancienne BDD
17. ✅ Migration BDD (reset + seed)
18. ✅ Tests production
19. Commit + push + deploy

**TOTAL**: 21 heures sur 4 jours

---

## 🎯 STATUT ACTUEL

- [x] Audit complet terminé
- [x] Plan détaillé créé
- [ ] GitesManager amélioré
- [ ] Refactoring JS en cours
- [ ] Tests en cours
- [ ] Migration BDD à faire

**PRÊT À COMMENCER LE REFACTORING ! 🚀**
