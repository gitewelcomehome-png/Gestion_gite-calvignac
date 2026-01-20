# 📌 CODE DE RÉFÉRENCE STABLE - 10 JANVIER 2026

**Commit de référence** : `7e616c4` (12 janvier 2026 - dernier commit stable avant refonte)

## ⚠️ RÈGLE ABSOLUE

**TOUJOURS se référer à ce code avant toute modification des fichiers suivants :**
- `js/sync-ical-v2.js` (import iCal)
- `js/supabase-operations.js` (chargement BDD)
- `js/reservations.js` (affichage planning)

## 📋 Versions stables extraites

### 1. FILTRE CHARGEMENT BDD (supabase-operations.js)

```javascript
}).filter(function(r) {
    // Garder toutes les réservations réelles (>= 1 nuit)
    return r.nuits >= 1;
});
```

**PRINCIPE** : Filtrage minimal. Pas de filtrage sur les noms. Juste la durée.

### 2. FILTRE AFFICHAGE (reservations.js)

```javascript
// Afficher TOUTES les réservations futures (date de fin après aujourd'hui)
const active = reservations.filter(r => {
    const dateFin = parseLocalDate(r.dateFin);
    dateFin.setHours(0, 0, 0, 0);
    return dateFin > today;
});
```

**PRINCIPE** : Afficher si `dateFin > today` (strict, pas >=)

### 3. TRI DES SEMAINES (reservations.js)

```javascript
// Obtenir toutes les semaines à afficher avec ANNÉE (basé sur la date de DÉBUT)
const allWeeks = new Set();
active.forEach(r => {
    const start = parseLocalDate(r.dateDebut);
    const year = start.getFullYear();
    const weekNum = getWeekNumber(start);
    allWeeks.add(`${year}-W${String(weekNum).padStart(2, '0')}`); // PADDING pour tri correct
});

const sortedWeeks = Array.from(allWeeks).sort((a, b) => {
    // Tri numérique : extraire année et semaine
    const [yearA, weekA] = a.split('-W').map(x => parseInt(x));
    const [yearB, weekB] = b.split('-W').map(x => parseInt(x));
    if (yearA !== yearB) return yearA - yearB;
    return weekA - weekB;
});
```

**PRINCIPE** : Tri numérique par année puis semaine. Le padding "W03" est essentiel.

## 🚫 CE QUI NE MARCHAIT PAS

### ❌ Filtrage agressif sur les noms
```javascript
// NE PAS FAIRE ÇA - Trop de faux positifs
if (nomLower.includes('block') || nomLower.includes('reserv')) return false;
```
**Raison** : Capture des vrais clients avec "Réservé" dans le nom

### ❌ Durée minimum 2 nuits
```javascript
// NE PAS FAIRE ÇA - Certains gîtes acceptent 1 nuit
if (r.nuits < 2) return false;
```
**Raison** : Règle métier trop stricte, perte de réservations valides

### ❌ Tri alphabétique
```javascript
// NE PAS FAIRE ÇA - Semaine 8 vient après 22
Array.from(allWeeks).sort((a, b) => a.localeCompare(b));
```
**Raison** : "2026-W8" > "2026-W22" alphabétiquement

## 🔄 RESTAURATION RAPIDE

```bash
# Restaurer les 3 fichiers à la version stable
cd /workspaces/Gestion_gite-calvignac
git show 7e616c4:js/sync-ical-v2.js > js/sync-ical-v2.js
git show 7e616c4:js/supabase-operations.js > js/supabase-operations.js
git show 7e616c4:js/reservations.js > js/reservations.js
```

## 📊 RÉSULTATS ATTENDUS

Avec ce code stable :
- ✅ Toutes les réservations s'affichent (≈ 50-80 selon période)
- ✅ Semaines dans l'ordre (3, 4, 8, 10, 22...)
- ✅ Pas de perte de données
- ✅ Tri chronologique correct

---

**Date de création de cette référence** : 13 janvier 2026  
**Commit actuel utilisé** : 7e616c4
