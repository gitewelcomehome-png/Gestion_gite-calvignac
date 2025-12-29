# 🔧 Correction Colonne distance_km

## Problème Identifié
La table `activites_gites` dans Supabase n'a pas la colonne `distance_km`, ce qui cause l'erreur :
```
Could not find the 'distance_km' column of 'activites_gites' in the schema cache
```

## Solution

### Étape 1 : Exécuter le script SQL dans Supabase
1. Ouvrir Supabase → SQL Editor
2. Copier et exécuter le contenu de `sql/add_distance_column.sql`
3. Le script va :
   - Créer la colonne `distance_km` si elle n'existe pas
   - Calculer automatiquement les distances pour les données existantes
   - Créer un index pour optimiser les recherches

### Étape 2 : Vérifier que ça fonctionne
Après avoir exécuté le script SQL, tester l'ajout d'une activité :
1. Aller dans "À Découvrir"
2. Cliquer sur "➕ Ajouter une activité"
3. Remplir : nom, catégorie, adresse
4. Cliquer sur "📍 GPS" pour obtenir les coordonnées
5. Sauvegarder

L'activité sera ajoutée **dans les deux gîtes** (Trévoux et Couzon) avec :
- Les mêmes coordonnées GPS
- Une distance différente pour chaque gîte (calculée automatiquement)

## Fonctionnalités Ajoutées

### 1. Calcul Automatique de Distance
Utilise la formule de Haversine pour calculer la distance entre :
- L'activité (coordonnées GPS)
- Chaque gîte (Trévoux: 45.9406, 4.7715 / Couzon: 45.8383, 4.8286)

### 2. Ajout Simultané dans les Deux Gîtes
Quand vous ajoutez une activité, elle est automatiquement créée pour :
- **Trévoux** avec sa distance depuis Trévoux
- **Couzon** avec sa distance depuis Couzon

### 3. Affichage des Distances
Le bouton "📍 GPS" affiche maintenant :
```
✓ Coordonnées trouvées : 45.943160, 4.774786
📏 Distance Trévoux: 0.35km | Couzon: 12.8km
```

## Coordonnées des Gîtes
```javascript
const GITES_COORDS = {
    'Trévoux': { lat: 45.9406, lng: 4.7715 },
    'Couzon': { lat: 45.8383, lng: 4.8286 }
};
```

## Commits
- `1994ca4` - Adaptation colonnes base de données existantes
- `55fc54b` - Ajout automatique dans les deux gîtes avec calcul distance
- À venir - Inclusion distance_km dans l'insertion
