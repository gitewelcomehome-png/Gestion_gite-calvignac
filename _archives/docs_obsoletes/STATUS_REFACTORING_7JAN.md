# 🚀 STATUS REFACTORING DYNAMIQUE - 7 Janvier 2026

## 📊 Progression Globale: 40% ✅

### ✅ TERMINÉ (2/10 fichiers)

#### 1. **js/sync-ical.js** ✅ 100%
- ❌ **AVANT**: Boucles hardcodées `window.ICAL_CONFIGS.couzon` / `.trevoux`
- ✅ **APRÈS**: Boucle dynamique `gitesManager.getAll()` + `gite.ical_sources` (JSONB BDD)
- Changements:
  - `syncAllCalendars()`: Boucle `for (const gite of gites)`
  - `syncCalendar(giteId, platform, url)`: UUID au lieu de nom
  - `checkDateOverlap(giteId, ...)`: UUID au lieu de nom
  - `updateBlockedDates()`: `gite_id` au lieu de `gite`
- **Impact**: ✅ Ajout d'un 3e gîte = juste ajouter URL iCal en BDD

#### 2. **js/draps.js** ✅ 90%
- ❌ **AVANT**: `BESOINS_PAR_RESERVATION = { 'trevoux': {...}, 'couzon': {...} }` hardcodé
- ✅ **APRÈS**: `gite.settings.linen_needs` depuis JSONB BDD
- Changements:
  - Supprimé `BESOINS_PAR_RESERVATION` complètement
  - `initDraps()`: Charge `gites = gitesManager.getAll()`
  - `chargerStocks()`: Utilise `linen_stocks` table + `gite_id`
  - `sauvegarderStocks()`: Boucle dynamique sur `gites`
  - `analyserReservations()`: Groupage par `gite_id`
  - `calculerReservationsCouvertes()`: Boucle `for (const gite of gites)`
  - `simulerBesoins()`: Groupage par `gite_id`
- **Impact**: ✅ Ajout d'un 3e gîte = juste définir besoins dans settings JSONB

### ⏳ EN COURS (1/10 fichiers)

#### 3. **js/menage.js** ⏳ 0% (NEXT)
- ❌ **PROBLÈME**: `weeks[key] = { trevoux: [], couzon: [] }` structure fixe
- ❌ **PROBLÈME**: HTML hardcodé avec 2 colonnes `<div class="cleaning-column">Trevoux</div>`
- 🎯 **SOLUTION**: 
  ```javascript
  weeks[key] = {
    monday: monday,
    gitesMenages: {} // Objet dynamique par gite_id
  };
  
  // Ajouter ménage
  if (!weeks[weekKey].gitesMenages[giteId]) {
    weeks[weekKey].gitesMenages[giteId] = [];
  }
  weeks[weekKey].gitesMenages[giteId].push(menageInfo);
  
  // HTML dynamique
  html += `<div style="grid-template-columns: repeat(${gites.length}, 1fr);">`;
  gites.forEach(g => {
    html += `<div class="cleaning-column">
      <div class="cleaning-column-header" style="color: ${g.color}">${g.icon} ${g.name}</div>
      ${(week.gitesMenages[g.id] || []).map(m => generateHTML(m)).join('')}
    </div>`;
  });
  ```
- **Impact**: ✅ UI s'adapte automatiquement à N gîtes

### ❌ PAS COMMENCÉ (7/10 fichiers)

#### 4. **js/reservations.js** ❌ (1h)
- Problème: `byGite = { 'trevoux': [...], 'couzon': [...] }` hardcodé
- Solution: Générer dynamiquement avec `gites.forEach(g => { byGite[g.id] = ... })`
- Impact: Stats et filtres fonctionnent avec N gîtes

#### 5. **js/infos-gites.js** ❌ (2h)
- Problème: `document.getElementById('restaurantsTrevoux')` IDs hardcodés
- Solution: Générer formulaires dynamiquement `restaurants_${g.id}`
- Impact: Formulaire infos pratiques pour N gîtes

#### 6. **js/decouvrir.js** ❌ (2h)
- Problème: `activitesParGite = { 'Trevoux': [], 'Couzon': [] }` + `gitesCoordinates`
- Solution: `gitesManager.getCoordinates(giteId)` + init dynamique
- Impact: Carte et activités pour N gîtes

#### 7. **js/dashboard.js** ❌ (30min)
- Problème: `color = gite === 'Trevoux' ? '#667eea' : '#f093fb'`
- Solution: `gite.color` depuis BDD
- Impact: Couleurs dynamiques

#### 8. **js/widget-horaires-clients.js** ❌ (30min)
- Problème: Même comparaisons de couleurs
- Solution: `gite.color`
- Impact: Widget adapté

#### 9. **js/statistiques.js** ❌ (30min)
- Problème: Commentaires hardcodés
- Solution: Généraliser
- Impact: Stats génériques

#### 10. **js/shared-config.js** ❌ (15min)
- Problème: `GITES_COORDS = { 'Trevoux': {...}, 'Couzon': {...} }`
- Solution: **SUPPRIMER COMPLÈTEMENT** le fichier ou vider
- Impact: Forcer l'utilisation de gitesManager partout

---

## 📋 TODO IMMÉDIAT (Ce Soir)

### Étape 1: Finir menage.js (1h)
```bash
# Refactoriser structure weeks + HTML dynamique
# Tester affichage avec 2 gîtes actuels
```

### Étape 2: Refactoriser les 3 moyens (2h)
```bash
# reservations.js - Stats dynamiques
# infos-gites.js - Formulaires dynamiques  
# decouvrir.js - Carte + activités dynamiques
```

### Étape 3: Finir les petits (1h)
```bash
# dashboard.js - Couleurs
# widget-horaires-clients.js - Couleurs
# statistiques.js - Généraliser
# shared-config.js - SUPPRIMER
```

### Étape 4: Tests (30min)
```bash
# Tester chaque page modifiée
# Vérifier console pour erreurs
# Tester avec données actuelles (2 gîtes)
```

---

## 🎯 APRÈS CE SOIR (si pas fini)

### Plan B: Migration BDD en mode PARTIEL
Si tous les fichiers ne sont PAS refactorisés ce soir:

1. **Option 1: Migrer avec MAPPING** (Recommandé)
   - Créer nouvelle BDD avec UUID
   - Garder colonnes temporaires `gite_old TEXT`
   - Mapper ancien 'Trevoux'/'Couzon' → nouveaux UUID
   - Code non refactorisé continue de marcher
   - Supprimer mapping après refactoring complet

2. **Option 2: Finir refactoring AVANT migration**
   - Plus safe mais prend + temps
   - Tout refactorer d'abord
   - Tester avec ancienne BDD
   - Migrer d'un coup quand 100% prêt

---

## 🚀 OBJECTIF FINAL

**Avant migration BDD:**
- ✅ 10/10 fichiers JS refactorisés
- ✅ Toutes les fonctions testées
- ✅ Aucune erreur console
- ✅ UI fonctionne avec 2 gîtes actuels

**Après migration BDD:**
- ✅ Nouvelle structure 9 tables
- ✅ UUID partout
- ✅ Configs en JSONB
- ✅ RLS activé
- ✅ Test ajout 3e gîte en 2 minutes

---

## 📈 Temps Estimé Restant

| Tâche | Temps | Status |
|-------|-------|--------|
| menage.js | 1h | ⏳ NEXT |
| reservations.js | 1h | ❌ |
| infos-gites.js | 2h | ❌ |
| decouvrir.js | 2h | ❌ |
| dashboard.js | 30min | ❌ |
| widgets/stats/config | 1h | ❌ |
| Tests finaux | 30min | ❌ |
| **TOTAL** | **8h** | **25% fait** |

---

## 💡 Commandes Utiles

```bash
# Vérifier hardcodes restants
grep -rn "trevoux\|couzon" js/*.js --color=always

# Compter occurrences
grep -rc "trevoux" js/*.js | grep -v ":0"

# Tester une page
python -m http.server 8000
# Ouvrir http://localhost:8000/index.html

# Commit rapide
git add -A && git commit -m "🚀 Refactoring [nom_fichier]" && git push
```

---

## 🎉 Ce qui MARCHE Déjà

✅ **GitesManager** (8 méthodes dynamiques)
✅ **sync-ical.js** (Import réservations dynamique)
✅ **draps.js** (Gestion stocks dynamique)
✅ **Architecture BDD** (9 tables propres SQL prêt)
✅ **Documentation** (PLAN + AUDIT complets)

**On est sur la bonne voie ! 🚀**

---

*Dernière MAJ: 7 janvier 2026 - 23h30*
*Prochaine session: Terminer menage.js + 3 fichiers moyens*
