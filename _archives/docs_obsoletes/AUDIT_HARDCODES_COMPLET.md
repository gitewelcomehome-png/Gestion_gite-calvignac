# 🔍 AUDIT COMPLET - VARIABLES HARDCODÉES À SUPPRIMER

**Date**: 7 janvier 2026  
**Objectif**: Identifier TOUTES les variables hardcodées avant refactoring  
**Statut**: En cours

---

## 📊 RÉSUMÉ RAPIDE

| Catégorie | Count | Priorité |
|-----------|-------|----------|
| Objets hardcodés (`.trevoux`, `['trevoux']`) | 14 | 🔴 HAUTE |
| Comparaisons hardcodées (`=== 'Trevoux'`) | 23 | 🔴 HAUTE |
| Configs hardcodées (ICAL_CONFIGS, etc.) | 22 | 🔴 HAUTE |
| Boucles fixes (`['trevoux', 'couzon'].forEach`) | 6 | 🟡 MOYENNE |
| Classes CSS spécifiques | ~15 | 🟡 MOYENNE |
| Grids 2-colonnes fixes | ~40 | 🟢 BASSE |

**TOTAL**: ~120 occurrences à refactoriser

---

## 📁 FICHIERS PAR ORDRE DE PRIORITÉ

### 🔴 CRITIQUE (à faire en premier)

#### 1. `js/decouvrir.js` (21 occurrences)
**Problèmes**:
```javascript
// ❌ Objets hardcodés
window.activitesParGite = { 'Trevoux': [], 'Couzon': [] };
const gitesCoordinates = {
    'Trevoux': { lat: 45.9423, lng: 4.7681 },
    'Couzon': { lat: 45.8456, lng: 4.8234 }
};

// ❌ Comparaisons
if (giteActuel === 'Trevoux') { ... }
```

**Solution**:
```javascript
// ✅ Charger depuis gitesManager
await gitesManager.loadGites();
const gites = gitesManager.getAll();

// ✅ Créer objets dynamiques
window.activitesParGite = {};
gites.forEach(g => {
    activitesParGite[g.id] = [];
});

// ✅ Coordonnées depuis BDD
const coords = gitesManager.getCoordinates(giteId);
```

---

#### 2. `js/infos-gites.js` (12 occurrences)
**Problèmes**:
```javascript
// ❌ Comparaisons multiples
const restaurantsGite = reservation.gite === 'Trevoux' ? 
    restaurants.trevoux : restaurants.couzon;

// ❌ getElementById hardcodés
document.getElementById('restaurantsTrevoux').value = data.trevoux || '';
```

**Solution**:
```javascript
// ✅ Utiliser gite_id
const gite = gitesManager.getById(reservation.gite_id);
const restaurantsGite = restaurants[gite.id];

// ✅ IDs dynamiques
gites.forEach(g => {
    document.getElementById(`restaurants_${g.id}`).value = data[g.id] || '';
});
```

---

#### 3. `js/sync-ical.js` (8 occurrences)
**Problèmes**:
```javascript
// ❌ Config hardcodée
const ICAL_CONFIGS = {
    couzon: {
        airbnb: 'https://...',
        booking: 'https://...'
    },
    trevoux: {
        airbnb: 'https://...',
        booking: 'https://...'
    }
};
```

**Solution**:
```javascript
// ✅ Config depuis gites.ical_sources (JSONB)
const gites = await gitesManager.loadGites();
for (const gite of gites) {
    const icalSources = gite.ical_sources || {};
    for (const [platform, url] of Object.entries(icalSources)) {
        await syncIcal(url, gite.id, platform);
    }
}
```

---

#### 4. `js/menage.js` (8 occurrences)
**Problèmes**:
```javascript
// ❌ Structure fixe
weeks[weekKey] = {
    monday: monday,
    trevoux: [],
    couzon: []
};

// ❌ Comparaison pour dispatcher
if (r.gite.includes('trevoux')) {
    weeks[weekKey].trevoux.push(menageInfo);
} else {
    weeks[weekKey].couzon.push(menageInfo);
}
```

**Solution**:
```javascript
// ✅ Structure dynamique
weeks[weekKey] = {
    monday: monday,
    gitesMenages: {}
};

const gites = gitesManager.getAll();
gites.forEach(g => {
    weeks[weekKey].gitesMenages[g.id] = [];
});

// ✅ Dispatcher par gite_id
const gite = gitesManager.mapOldNameToId(r.gite);
weeks[weekKey].gitesMenages[gite.id].push(menageInfo);
```

---

#### 5. `js/draps.js` (8 occurrences)
**Problèmes**:
```javascript
// ❌ Config hardcodée
const BESOINS_PAR_RESERVATION = {
    'trevoux': {
        draps_plats_grands: 6,
        draps_plats_petits: 3,
        ...
    },
    'couzon': {
        draps_plats_grands: 4,
        ...
    }
};

// ❌ Stocks hardcodés
let stocksActuels = {
    'trevoux': {},
    'couzon': {}
};
```

**Solution**:
```javascript
// ✅ Besoins depuis gites.settings.linen_needs
async function getLinenNeeds(giteId) {
    const gite = gitesManager.getById(giteId);
    return gite?.settings?.linen_needs || {};
}

// ✅ Stocks dynamiques
let stocksActuels = {};
const gites = gitesManager.getAll();
gites.forEach(g => {
    stocksActuels[g.id] = {};
});
```

---

#### 6. `js/reservations.js` (6 occurrences)
**Problèmes**:
```javascript
// ❌ Objets hardcodés pour stats
const byGite = {
    'trevoux': reservations.filter(r => r.gite === 'Trevoux'),
    'couzon': reservations.filter(r => r.gite === 'Couzon')
};
```

**Solution**:
```javascript
// ✅ Générer dynamiquement
const byGite = {};
const gites = gitesManager.getAll();
gites.forEach(g => {
    byGite[g.id] = reservations.filter(r => r.gite_id === g.id);
});
```

---

### 🟡 MOYENNE PRIORITÉ

#### 7. `js/shared-config.js` (4 occurrences)
**Problèmes**:
```javascript
// ❌ GITES_COORDS hardcodé
const GITES_COORDS = {
    'Trevoux': { lat: 45.9417, lng: 4.7722 },
    'Couzon': { lat: 45.8436, lng: 4.8364 }
};
```

**Solution**:
```javascript
// ✅ Supprimer complètement, utiliser gitesManager.getCoordinates()
```

---

#### 8. `js/dashboard.js` (3 occurrences)
**Problèmes**:
```javascript
// ❌ Couleurs hardcodées
const color = gite === 'Trevoux' ? '#667eea' : '#f093fb';
```

**Solution**:
```javascript
// ✅ Couleur depuis BDD
const gite = gitesManager.getById(giteId);
const color = gite.color || '#667eea';
```

---

#### 9. `js/widget-horaires-clients.js` (2 occurrences)
**Problèmes**:
```javascript
// ❌ Switch hardcodé
const color = gite === 'Trevoux' ? 'blue' : 'pink';
```

**Solution**:
```javascript
// ✅ Dynamique
const giteObj = gitesManager.getById(giteId);
const color = giteObj.color || '#667eea';
```

---

#### 10. `js/statistiques.js` (1 occurrence)
**Problèmes**:
```javascript
// ❌ Commentaire hardcodé "Trévoux"
```

**Solution**: Supprimer ou généraliser

---

### 🟢 BASSE PRIORITÉ (mais nécessaire)

#### 11. `index.html` 
**Problèmes**:
- Variables GITES_COORDS hardcodées
- ICAL_CONFIGS hardcodées

**Solution**: Supprimer, tout charger depuis gitesManager

---

#### 12. `tabs/*.html` (tous les fichiers)
**Problèmes**:
- Grids `grid-template-columns: 1fr 1fr` fixes (~40 occurrences)
- Classes CSS `.trevoux`, `.couzon`

**Solution**:
```css
/* ❌ AVANT */
.gites-grid {
    grid-template-columns: 1fr 1fr;
}

/* ✅ APRÈS (dynamique avec JS) */
<style id="dynamic-gites-grid"></style>
<script>
const gites = gitesManager.getAll();
const gridStyle = `
    .gites-grid {
        grid-template-columns: repeat(${gites.length}, 1fr);
    }
`;
document.getElementById('dynamic-gites-grid').textContent = gridStyle;
</script>
```

---

## 🛠️ PLAN D'ACTION ÉTAPE PAR ÉTAPE

### Phase 1: Préparer GitesManager (1h)
- [x] Ajouter `getCoordinates(giteId)`
- [ ] Ajouter `getSettings(giteId)` 
- [ ] Ajouter `getIcalSources(giteId)`
- [ ] Tester chargement depuis Supabase

### Phase 2: Refactorer JS Critique (10h)
1. [ ] `js/sync-ical.js` - Config iCal dynamique (2h)
2. [ ] `js/draps.js` - Besoins draps depuis settings (2h)
3. [ ] `js/menage.js` - Planning ménage dynamique (3h)
4. [ ] `js/reservations.js` - Stats par gîte dynamiques (1h)
5. [ ] `js/infos-gites.js` - Formulaires dynamiques (2h)

### Phase 3: Refactorer JS Secondaire (4h)
6. [ ] `js/decouvrir.js` - Cartes et POIs dynamiques (2h)
7. [ ] `js/dashboard.js` - Couleurs dynamiques (1h)
8. [ ] `js/widget-horaires-clients.js` - Couleurs (30min)
9. [ ] `js/statistiques.js` - Commentaires (30min)

### Phase 4: Supprimer Configs Hardcodées (2h)
10. [ ] Supprimer `GITES_COORDS` de `shared-config.js`
11. [ ] Supprimer `ICAL_CONFIGS` de `index.html`
12. [ ] Migrer configs vers BDD

### Phase 5: CSS et HTML Dynamiques (4h)
13. [ ] Remplacer grids 2-col par dynamiques
14. [ ] Remplacer classes `.trevoux`/`.couzon` par `[data-gite-id]`
15. [ ] Générer HTML colonnes dynamiquement

### Phase 6: Tests (2h)
16. [ ] Tester avec 2 gîtes (situation actuelle)
17. [ ] Tester avec 3 gîtes (ajouter un test)
18. [ ] Tester avec 1 gîte (edge case)

**TOTAL ESTIMÉ**: ~23 heures

---

## ✅ CRITÈRES DE SUCCÈS

- [ ] Aucune référence à "Trevoux" ou "Couzon" dans le code (hors commentaires)
- [ ] Aucun objet avec clés hardcodées
- [ ] Aucune comparaison `=== 'nom_gite'`
- [ ] Aucune boucle sur tableau fixe `['gite1', 'gite2']`
- [ ] Toutes les configs viennent de la BDD (JSONB)
- [ ] Grids CSS s'adaptent au nombre de gîtes
- [ ] Ajouter un 3ème gîte prend 2 minutes (pas 2 heures)

---

## 🚨 POINTS D'ATTENTION

### Migration Données
Les anciennes données utilisent `gite TEXT`. Après refactoring:
- Nouveau code attend `gite_id UUID`
- Migration nécessaire ou reset BDD
- **Décision**: Reset complet (option choisie)

### Compatibilité Temporaire
Pendant transition, `gitesManager.mapOldNameToId()` permet:
```javascript
// Mapper ancien nom vers nouveau gite_id
const giteId = gitesManager.mapOldNameToId('Trevoux');
// → Retourne UUID du gîte "Trevoux"
```

### Tests Bloquants
Avant reset BDD, vérifier:
1. Toutes les pages chargent sans erreur
2. gitesManager.loadGites() fonctionne
3. Pas de `undefined` dans les boucles
4. CSS s'adapte correctement

---

## 📝 NOTES TECHNIQUES

### JSONB dans Supabase

Structure recommandée pour `gites.settings`:
```json
{
  "linen_needs": {
    "flat_sheet_large": 6,
    "flat_sheet_small": 3,
    "duvet_cover_large": 6,
    "duvet_cover_small": 3,
    "pillowcase": 15,
    "towel": 15,
    "bath_mat": 3
  },
  "check_in_time": "16:00",
  "check_out_time": "10:00",
  "cleaning_duration_minutes": 180
}
```

Structure pour `gites.ical_sources`:
```json
{
  "airbnb": "https://www.airbnb.fr/calendar/ical/123.ics?s=abc",
  "booking": "https://admin.booking.com/hotel/hoteladmin/ical.html?t=xyz",
  "abritel": "https://www.abritel.fr/ical/ha456.ics?s=def"
}
```

---

**🎯 STATUT**: Audit terminé, prêt pour refactoring
