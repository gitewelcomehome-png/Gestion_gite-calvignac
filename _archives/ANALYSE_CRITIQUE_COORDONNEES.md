# 🚨 RAPPORT CRITIQUE : Coordonnées Dupliquées

**Date**: 28 décembre 2025  
**Gravité**: 🔴 CRITIQUE

---

## 📊 Résumé Exécutif

Sur **875 activités** dans la base de données :
- **772 activités (88%)** ont des coordonnées dupliquées
- **118 positions problématiques** identifiées
- **Impact majeur** sur l'expérience utilisateur de la carte

---

## 🔴 Top 5 des Doublons les Plus Graves

### 1. Parc de la Tête d'Or (45.9394, 4.7728)
**43 activités** empilées au même endroit :
- Zoo du Parc de la Tête d'Or ✅ (correct)
- Parc des Oiseaux - Villars-les-Dombes ❌ (devrait être à 45.9979, 5.0296)
- Touroparc Zoo ❌ (devrait être ailleurs)
- Pharmacie de Trévoux ❌ (devrait être à Trévoux)
- + 39 autres activités avec des adresses différentes

### 2. Pont de Trévoux (45.9725, 4.7995)
**14 activités** au même endroit :
- Pont de la Saône
- Restaurant Le Pont Romain (4 doublons!)
- Bar du Pont
- Château de Trévoux
- + 8 autres

### 3. Château de Couzon (45.8280, 4.8120)
**14 activités** empilées :
- Hôtel du Château (2 doublons)
- Le Restaurant du Château (4 doublons!)
- Café du Château
- Château de Couzon
- Piscine de Couzon ❌ (mauvais lieu)
- + 5 autres

### 4. Cloître de Trévoux (45.9765, 4.8070)
**12 activités** au même point :
- Restaurant Le Cloître (4 doublons!)
- Café Historique
- Cloître de Trévoux
- Bowling Trévollien ❌ (mauvais lieu)
- + 5 autres

### 5. Autres positions avec 5-10 doublons
**+ 113 autres positions** avec 4+ activités empilées

---

## 🎯 Cause Racine

**Hypothèse principale** : Lors de l'import initial, les coordonnées ont été :
1. Géocodées par nom de lieu plutôt que par adresse complète
2. Utilisées des valeurs par défaut quand le géocodage échouait
3. Copié-collé depuis un template

**Preuve** :
- Beaucoup d'activités à Trévoux partagent les coordonnées du centre-ville
- Les restaurants au même endroit partagent souvent les mêmes coords
- Les activités sans adresse précise ont des coords génériques

---

## 📁 Fichiers Générés

### 1. Rapport Complet
**Fichier** : `_archives/RAPPORT_DOUBLONS_COORDS.txt`
- Liste exhaustive des 118 positions problématiques
- Détail de chaque doublon avec adresses
- Liens Google Maps pour vérification

### 2. CSV pour Correction
**Fichier** : `_archives/doublons_a_corriger.csv`
- 772 lignes à corriger
- Colonnes : id, nom, gite, adresse, lat actuelle, lng actuelle, nombre doublons
- Colonnes vides : latitude_correcte, longitude_correcte, statut
- **Format prêt pour import Excel/Sheets**

---

## 🛠️ Solutions Proposées

### Solution 1 : Script Automatique de Géocodage ⚡ (RECOMMANDÉ)

**Avantages** :
- Rapide (30-60 min)
- Précis (utilise Google Maps Geocoding API)
- Automatique

**Coût** : ~$5 pour 772 requêtes (Google Maps Geocoding)

**Étapes** :
1. Obtenir clé API Google Maps Geocoding
2. Exécuter `geocode_fix_bulk.js` (à créer)
3. Vérifier manuellement les 20 premiers résultats
4. Lancer la correction complète

### Solution 2 : Correction Manuelle via CSV 📝

**Avantages** :
- Précision maximale
- Pas de coût API
- Contrôle total

**Inconvénient** : Temps (15-20 heures de travail)

**Étapes** :
1. Ouvrir `doublons_a_corriger.csv` dans Excel/Sheets
2. Pour chaque ligne :
   - Rechercher l'adresse sur Google Maps
   - Copier les coordonnées
   - Remplir les colonnes latitude_correcte et longitude_correcte
3. Générer les requêtes SQL UPDATE
4. Exécuter dans Supabase

### Solution 3 : Correction Semi-Automatique 🔄

**Approche hybride** :
1. Script automatique pour les adresses claires (80%)
2. Correction manuelle pour les cas ambigus (20%)

---

## 📝 Template SQL pour Correction

```sql
-- Exemple de correction par lot
UPDATE activites_gites 
SET 
    latitude = 45.9979,
    longitude = 5.0296,
    updated_at = NOW()
WHERE nom LIKE '%Parc des Oiseaux%';

-- Vérification après correction
SELECT latitude, longitude, COUNT(*) as count
FROM activites_gites
GROUP BY latitude, longitude
HAVING COUNT(*) > 3
ORDER BY count DESC;
```

---

## ⚠️ Impact sur l'Application

### Avant Correction
- ❌ 88% des activités mal positionnées
- ❌ Carte illisible (tas de marqueurs)
- ❌ Navigation impossible
- ❌ Expérience utilisateur catastrophique
- ❌ Calcul d'itinéraire faussé

### Après Correction
- ✅ Chaque activité à sa vraie position
- ✅ Carte claire et navigable
- ✅ Itinéraires corrects
- ✅ Filtres par distance fonctionnels
- ✅ Expérience utilisateur premium

---

## 🎯 Priorité d'Action

### 🔴 URGENT (Semaine 1)
Corriger les **Top 10 doublons** (150 activités)
- Impact immédiat visible sur la carte
- Résout les cas les plus visibles

### 🟠 Important (Semaine 2-3)
Corriger les **doublons moyens** (300 activités)
- Positions avec 4-8 activités
- Amélioration progressive

### 🟡 Normal (Mois 1-2)
Corriger le **reste** (322 activités)
- Finalisation complète
- Perfection de la base de données

---

## 📞 Prochaines Étapes

1. **Décision** : Choisir la solution (auto/manuelle/hybride)
2. **Budget** : Allouer si solution automatique
3. **Planning** : Définir le calendrier de correction
4. **Validation** : Mettre en place un process de QA
5. **Prévention** : Implémenter validation à l'insertion

---

## 📎 Annexes

### Script de Diagnostic
```bash
node diagnostic_doublons.js
```

### Export CSV
```bash
node export_doublons_csv.js
```

### Vérifier une Position
```bash
# Ouvrir dans Google Maps
https://www.google.com/maps?q=45.9394,4.7728
```

---

**Contact** : GitHub Copilot  
**Dernière mise à jour** : 28 décembre 2025  
**Commit** : b7aa2b6
