# 🔍 AUDIT MULTI-TENANT - Refactoring Complet

**Date:** 7 janvier 2026  
**Objectif:** Rendre l'application 100% dynamique pour supporter X gîtes (actuellement codée en dur pour 2)

---

## ❌ PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **GRILLES CSS FIXES (2 colonnes)**
**Impact:** TRÈS ÉLEVÉ - Affichage cassé avec 3+ gîtes

**Fichiers touchés:**
- `index.html` : `.week-content-grid { grid-template-columns: 1fr 1fr !important; }`
- `validation.html` : `.gite-columns { grid-template-columns: 1fr 1fr; }`
- `js/reservations.js` : grille 2 colonnes en dur
- `js/infos-gites.js` : affichage 2 gîtes

**Solution:** Générer dynamiquement `repeat(${nbGites}, 1fr)`

---

### 2. **NOMS DE GÎTES EN DUR**
**Impact:** CRITIQUE - Comparaisons qui cassent avec nouveaux gîtes

**100+ occurrences dans:**
- `index.html` : "Trévoux & Couzon", classes `.trevoux`, `.couzon`
- `validation.html` : headers "🏡 Trévoux", "⛰️ Couzon"
- `js/infos-gites.js` : `if (reservation.gite === 'Trévoux')`
- `js/widget-horaires-clients.js` : couleurs par nom
- `js/sync-ical.js` : filtres par nom
- `js/decouvrir.js` : comparaisons nom gîte
- `js/faq.js` : badges gîtes

**Solution:** Utiliser `gite_id` + `gitesManager.getById()`

---

### 3. **ICÔNES/COULEURS CODÉES EN DUR**
**Impact:** MOYEN - Mauvaise UX avec nouveaux gîtes

**Exemples:**
- `🏡 Trévoux` (icône fixe)
- `⛰️ Couzon` (icône fixe)
- `#667eea` (violet Trévoux)
- `#f093fb` (rose Couzon)

**Solution:** `gitesManager.getIcon(giteId)` et `gitesManager.getColor(giteId)`

---

### 4. **CONFIGURATION ICAL FIXE**
**Impact:** CRITIQUE - Impossible d'ajouter sources iCal pour nouveaux gîtes

**Code actuel:**
```javascript
configs = {
    couzon: { airbnb: '', abritel: '', gitesDeFrance: '' },
    trevoux: { airbnb: '', abritel: '', gitesDeFrance: '' }
}
```

**Solution:** Stocker dans table `gites.ical_config` JSONB

---

### 5. **STOCKS DRAPS CONTRAINTS**
**Impact:** ÉLEVÉ - Impossible d'ajouter gîtes

**SQL actuel:**
```sql
gite TEXT NOT NULL CHECK (gite IN ('trévoux', 'couzon'))
```

**Solution:** Foreign key sur `gites.id` (déjà prévu avec migration)

---

### 6. **FORMULAIRES AVEC SÉLECTEURS FIXES**
**Impact:** MOYEN

**Exemples:**
- Radio buttons Trévoux/Couzon en dur
- Dropdowns avec 2 options fixes
- Champs ID `#icalAirbnbTrevoux`, `#icalAirbnbCouzon`

**Solution:** Générer dynamiquement avec `gitesManager.createSelect()`

---

### 7. **STATISTIQUES PAR GÎTE**
**Impact:** ÉLEVÉ - Graphiques cassés avec 3+ gîtes

**Code actuel:**
- Graphiques avec 2 datasets fixes
- `statTrevouxEl`, `statCouzonEl` (IDs en dur)
- Légendes fixes

**Solution:** Boucle dynamique sur `gitesManager.getAll()`

---

### 8. **FILTRES DE RÉSERVATIONS**
**Impact:** CRITIQUE - Ne montre que 2 gîtes

**Code actuel:**
```javascript
const reservationsTrevoux = reservations.filter(r => r.gite === 'Trévoux');
const reservationsCouzon = reservations.filter(r => r.gite === 'Couzon');
```

**Solution:** 
```javascript
const reservationsByGite = new Map();
gitesManager.getAll().forEach(gite => {
    reservationsByGite.set(gite.id, reservations.filter(r => r.gite_id === gite.id));
});
```

---

### 9. **PAGES DE MÉNAGE/VALIDATION**
**Impact:** TRÈS ÉLEVÉ

**validation.html:**
- Structure HTML avec 2 colonnes fixes
- Headers "Trévoux" / "Couzon" en dur
- Classes CSS `.trevoux`, `.couzon`

**Solution:** Générer HTML dynamiquement

---

### 10. **SYSTÈME DE CHARGES**
**Impact:** MOYEN

**Actuellement:**
- Champ `gite` TEXT libre
- Pas de validation

**Solution:** Utiliser `gite_id` UUID + foreign key

---

## ✅ PLAN DE REFACTORING

### **Phase 1: Infrastructure (FAIT)**
- [x] Créer `js/gites-manager.js`
- [ ] Inclure dans tous les HTML
- [ ] Initialiser au chargement

### **Phase 2: Refactoring Base de Données**
1. Mettre à jour tous les noms de colonnes `gite` TEXT → `gite_id` UUID
2. Supprimer contraintes CHECK sur noms
3. Migrer données: mapper anciens noms → gite_id

### **Phase 3: Refactoring JavaScript (15 fichiers)**

**Priorité 1 (Critique):**
1. `js/reservations.js` - Affichage réservations
2. `js/menage.js` - Système de ménage
3. `validation.html` - Page validation ménage
4. `index.html` - Dashboard principal

**Priorité 2 (Important):**
5. `js/sync-ical.js` - Synchronisation
6. `js/infos-gites.js` - Infos pratiques
7. `js/widget-horaires-clients.js` - Widget horaires
8. `js/decouvrir.js` - Activités/restaurants

**Priorité 3 (Moyen):**
9. `js/statistiques.js` - Graphiques
10. `js/charges.js` - Gestion charges
11. `js/faq.js` - FAQ
12. `js/draps.js` - Stocks draps

### **Phase 4: CSS Dynamique**
- Générer classes CSS dynamiquement
- Supprimer `.trevoux`, `.couzon`
- Variables CSS par gîte

### **Phase 5: Configuration**
- Déplacer config iCal dans base de données
- Interface d'administration gîtes
- Paramètres couleurs/icônes

---

## 🎯 TÂCHES DÉTAILLÉES

### Tâche 1: Corriger la base de données
```sql
-- Dans Supabase
UPDATE reservations SET gite = 'Le Rive Droite' WHERE gite IN ('Couzon', 'couzon');
UPDATE reservations SET gite = 'Trévoux' WHERE gite IN ('trevoux', 'Tréoux');
```

### Tâche 2: Inclure gites-manager.js partout
Ajouter dans tous les HTML **AVANT** les autres scripts:
```html
<script src="/js/gites-manager.js"></script>
```

### Tâche 3: Initialiser au chargement
```javascript
// Dans chaque page
document.addEventListener('DOMContentLoaded', async () => {
    await gitesManager.loadGites(currentOrganizationId);
    // ... reste du code
});
```

---

## 📝 MÉTHODE DE REFACTORING

**Pour chaque fichier JS:**

1. **Chercher:** `'Trévoux'`, `'Couzon'`, `'trevoux'`, `'couzon'`
2. **Remplacer:**
   - `r.gite === 'Trévoux'` → `r.gite_id === trevouxGite.id`
   - Ou mieux: boucler sur `gitesManager.getAll()`
3. **Refactorer structure:**
   - Arrays/objets fixes → Maps dynamiques
   - Grilles CSS fixes → calcul dynamique
4. **Tester:** Ajouter 3e gîte test, vérifier affichage

---

## 🚨 RISQUES & PRÉCAUTIONS

1. **Backup obligatoire** avant modification SQL
2. **Tester chaque phase** séparément
3. **Garder ancienne colonne `gite`** temporairement (fallback)
4. **Déploiement progressif:** localhost → staging → production

---

## 📊 ESTIMATION

- **Analyse:** 2h ✅ (fait)
- **Phase 2 (SQL):** 1h
- **Phase 3 (JS):** 8-10h
- **Phase 4 (CSS):** 2h
- **Phase 5 (Config):** 2h
- **Tests:** 3h

**Total:** ~18-20h de développement

---

## 🎉 BÉNÉFICES ATTENDUS

✅ **Scalabilité:** Ajouter des gîtes en 2 clics  
✅ **Maintenabilité:** Moins de code en dur  
✅ **Flexibilité:** Personnalisation par gîte  
✅ **Multi-tenant ready:** Base pour SaaS  
✅ **Professionnalisme:** Code propre et moderne  
