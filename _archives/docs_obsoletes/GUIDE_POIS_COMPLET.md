# 🌍 GUIDE COMPLET: GÉOCODAGE + POIs (25 km)

## 📊 Vue d'ensemble

Ce projet va:
1. ✅ **Géocoder les activités existantes** (sans coordonnées)
2. ✅ **Chercher 100+ Points d'Intérêt (POIs)** dans un rayon de 25 km autour de chaque gîte
3. ✅ **Générer une requête SQL** prête à injecter dans Supabase

---

## 🎯 Types de POIs Recherchés

Le script recherche automatiquement:

| Catégorie | Exemples |
|-----------|----------|
| **Restauration** | Restaurants, Cafés, Bars |
| **Hébergement** | Hôtels, Camps |
| **Culture** | Musées, Monuments, Châteaux, Églises |
| **Nature** | Parcs, Randonnée, Piscines, Picnic |
| **Sports** | VTT, Ski, Vélo, Sports center |
| **Pratique** | Supermarché, Pharmacie, Gare, Parking |
| **Attractions** | Attractions touristiques |

**Total**: 23 catégories, 50+ tags OSM

---

## 🚀 EXÉCUTION

### Sur Votre Ordinateur (Obligatoire - Le conteneur n'a pas d'accès internet)

#### Prérequis
```bash
# Vérifiez que Node.js est installé
node --version
# Doit afficher v12+ ou v14+
```

#### Étape 1: Téléchargez les fichiers

Depuis VS Code:
- Téléchargez ces 3 fichiers du projet:
  - `geocode_missing.js`
  - `search_pois.js`
  - `configure_gites.js`
  - `process_all.js`
- Créez un dossier `gites-process/` sur votre ordinateur
- Placez les 4 fichiers dans ce dossier

#### Étape 2: Configurez les gîtes (2 min)

```bash
# Terminal
cd gites-process/
node configure_gites.js
```

**Cela va:**
- Se connecter à Supabase
- Récupérer les vraies coordonnées des gîtes
- Mettre à jour `search_pois.js` automatiquement
- Afficher les stats des activités actuelles

**Résultat attendu:**
```
🏠 CONFIGURATION DES GÎTES
...
🔗 Connexion Supabase...
✅ 2 gîtes récupérés

📊 Récupération des statistiques activités...
✅ 45 activités trouvées

📈 Activités par gîte:
   • trevoux: 23 total, 18 avec coordonnées (78%)
   • couzon: 22 total, 15 avec coordonnées (68%)

✏️  Mise à jour de search_pois.js...
✅ search_pois.js mis à jour

🗺️  Gîtes configurés:
   • trevoux: (45.9731, 4.8008)
   • couzon: (45.8245, 4.8156)

✅ CONFIGURATION PRÊTE
```

#### Étape 3: Exécutez le processus complet (10-15 min)

```bash
node process_all.js
```

**Cela va:**
1. Exécuter `geocode_missing.js`
   - Géocoder les activités sans coordonnées
   - ~1.1 secondes par activité

2. Exécuter `search_pois.js`
   - Chercher 100+ POIs par gîte
   - ~2 secondes d'attente entre les requêtes (limites API)
   - Total: 4-6 secondes par gîte

**Résultat attendu:**
```
🌍 DÉBUT PROCESSUS COMPLET GÉOCODAGE + POIs
======================================================================

📍 ÉTAPE 1: Géocodage des activités existantes
----------------------------------------------------------------------
🔍 Récupération des activités...
✅ Connexion Supabase OK
📊 Total activités: 45
✅ Avec coordonnées: 38 (84%)
❌ Sans coordonnées: 7 (16%)
🌍 Début du géocodage...
⏳ (1/7) Parachute...
   ✅ 45.8245, 4.8356
...
✅ Géocodage des activités terminé

📍 ÉTAPE 2: Recherche des Points d'Intérêt
----------------------------------------------------------------------
🔍 Recherche POIs autour de trevoux...
✅ Trouvé 234 POIs pour trevoux
🔍 Recherche POIs autour de couzon...
✅ Trouvé 267 POIs pour couzon

✅ Recherche POIs terminée
📊 Total POIs trouvés: 501

📍 Par gîte:
   • trevoux: 234
   • couzon: 267

🏷️  Par type:
   • Restaurant: 58
   • Café/Bar: 42
   • Attraction: 38
   • Parc: 31
   ...
```

#### Étape 4: Vérifiez les logs

```bash
# Logs détaillés
cat geocode_log.txt
cat poi_search_log.txt
cat geocode_complete_log.txt
```

#### Étape 5: Examinez le SQL généré

```bash
# Afficher les premières lignes
head -50 sql/insert_activites.sql

# Voir le nombre total de lignes
wc -l sql/insert_activites.sql
```

---

## 📝 INJECTION DANS SUPABASE

### Étape 1: Préparez la table (Une seule fois)

Si la table `activites_gites` n'existe pas, exécutez d'abord:

```sql
-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS activites_gites (
    id SERIAL PRIMARY KEY,
    gite VARCHAR(100) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    adresse TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_km DECIMAL(5, 2),
    website VARCHAR(500),
    phone VARCHAR(50),
    opening_hours TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexer les colonnes importantes
CREATE INDEX IF NOT EXISTS idx_activites_gite ON activites_gites(gite);
CREATE INDEX IF NOT EXISTS idx_activites_type ON activites_gites(type);
CREATE INDEX IF NOT EXISTS idx_activites_coords ON activites_gites(latitude, longitude);
```

### Étape 2: Injectez le SQL

1. **Allez sur** https://app.supabase.com/
2. **Sélectionnez votre projet**
3. **Allez dans** SQL Editor
4. **Cliquez** "New Query"
5. **Copiez** le contenu complet de `sql/insert_activites.sql`
6. **Collez** dans l'éditeur
7. **Cliquez** "Run"

**Résultat attendu:**
```
SUCCESS: 501 rows inserted
```

### Étape 3: Vérifiez l'injection

```sql
-- Compter les POIs par gîte
SELECT gite, COUNT(*) as total, COUNT(DISTINCT type) as types
FROM activites_gites
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY gite;

-- Exemples de POIs
SELECT gite, nom, type, distance_km
FROM activites_gites
WHERE type = 'Restaurant'
ORDER BY distance_km
LIMIT 10;

-- Vérifier les coordonnées
SELECT COUNT(*) as with_coords
FROM activites_gites
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

---

## 🗺️ INTÉGRATION À VOTRE APP

Les POIs s'affichent automatiquement dans l'onglet "Activités" de votre site:
- 🗺️ Épingles sur la carte
- 🔍 Filtre par type
- 📍 Distance depuis le gîte
- 🌐 Liens website/phone si disponibles

---

## 🐛 DÉPANNAGE

### "getaddrinfo ENOTFOUND"
→ Vous êtes dans le conteneur
→ Exécutez sur votre ordinateur avec `node configure_gites.js`

### "403 Forbidden" sur Supabase
→ Vérifiez vos RLS policies
→ Les table doit avoir:
```sql
ALTER TABLE activites_gites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_select" ON activites_gites FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON activites_gites FOR INSERT WITH CHECK (true);
```

### "Timeout Overpass API"
→ L'API Overpass peut être chargée
→ Relancez simplement: `node search_pois.js`
→ Les POIs déjà trouvés seront conservés

### Certaines coordonnées manquantes
→ C'est normal pour certains gîtes
→ Remplissez-les manuellement dans Supabase

---

## 📊 RÉSULTATS TYPIQUES

Pour une région comme Auvergne-Rhône-Alpes:

| Type | Nombre | Distance moyenne |
|------|--------|------------------|
| Restaurant | 45-60 | 8 km |
| Café/Bar | 35-50 | 6 km |
| Attraction | 30-45 | 12 km |
| Parc | 25-40 | 5 km |
| Hôtel | 15-25 | 10 km |
| Musée | 10-20 | 15 km |
| Randonnée | 8-15 | 8 km |
| Autre | 50-100+ | Variables |

**Total**: 200-400 POIs par gîte

---

## 💡 CONSEILS

1. **Planifiez le temps**
   - Configuration: 2 minutes
   - Géocodage: 10-15 min (dépend du nombre d'activités)
   - Recherche POIs: 30 secondes à 2 minutes
   - Injection SQL: 2-3 minutes

2. **Vérifiez la qualité**
   - Inspectez les logs pour les erreurs
   - Vérifiez les POIs sur la carte
   - Testez les filtres

3. **Optimisations futures**
   - Ajouter plus de catégories
   - Augmenter le rayon (35 km?)
   - Filtrer par étoiles/ratings

---

## 📞 SUPPORT

**Si vous avez des erreurs:**

1. Vérifiez votre **connexion internet**
2. Vérifiez les **logs** (cat *.txt)
3. Vérifiez votre **clé Supabase** dans le code
4. Relancez le script
5. Consultez la **documentation Overpass**: https://wiki.openstreetmap.org/wiki/Overpass_API

---

## ✨ C'EST PRÊT!

Vous avez maintenant:
- ✅ Un système de géocodage complet
- ✅ 200-400 POIs par gîte
- ✅ Une base de données riche
- ✅ Une carte interactive sur votre site

🎉 **Amusez-vous avec votre app!**
