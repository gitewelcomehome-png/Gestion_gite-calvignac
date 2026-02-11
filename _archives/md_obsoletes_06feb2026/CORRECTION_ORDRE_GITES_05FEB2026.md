# CORRECTION : Ordre des gîtes (05 FEB 2026)

## 🎯 Problème Identifié

L'ordre personnalisé des gîtes était sauvegardé uniquement dans le **localStorage du navigateur**, ce qui causait :
- ❌ Perte de l'ordre lors du changement de navigateur
- ❌ Perte de l'ordre lors du changement d'appareil
- ❌ Réinitialisation de l'ordre lors du nettoyage du cache
- ❌ Ordre différent entre plusieurs appareils

**Comportement observé** : L'ordre se réinitialise automatiquement en ordre alphabétique

## ✅ Solution Implémentée

### 1. Ajout de la colonne `ordre_affichage` dans Supabase

**Fichier** : `/sql/add_ordre_affichage_gites.sql`

```sql
-- Ajout de la colonne
ALTER TABLE gites ADD COLUMN ordre_affichage INTEGER;

-- Initialisation avec l'ordre alphabétique actuel
WITH ordered_gites AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_user_id ORDER BY name) as row_num
    FROM gites
)
UPDATE gites g
SET ordre_affichage = og.row_num
FROM ordered_gites og
WHERE g.id = og.id;

-- Création d'un index pour les performances
CREATE INDEX idx_gites_ordre_affichage ON gites(owner_user_id, ordre_affichage);
```

### 2. Modification du GitesManager

**Fichier** : `/js/gites-manager.js`

#### Chargement des gîtes
- **Avant** : Tri par `name` + application de l'ordre localStorage
- **Après** : Tri direct par `ordre_affichage` depuis Supabase

```javascript
// Requête Supabase avec tri par ordre_affichage
.order('ordre_affichage', { ascending: true, nullsFirst: false })
.order('name', { ascending: true }); // Fallback si NULL
```

#### Sauvegarde de l'ordre
- **Avant** : `localStorage.setItem('gites_custom_order', ...)`
- **Après** : Mise à jour directe dans Supabase

```javascript
async saveCurrentOrder() {
    for (const update of updates) {
        await window.supabaseClient
            .from('gites')
            .update({ ordre_affichage: update.ordre_affichage })
            .eq('id', update.id);
    }
}
```

#### Initialisation automatique
Nouvelle fonction `initializeOrderIfNeeded()` pour assigner automatiquement un ordre aux nouveaux gîtes.

### 3. Modification de gites-crud.js

**Fonction** : `moveGiteOrder()` devient **asynchrone** car elle appelle maintenant `await gitesManager.moveGite()`.

```javascript
window.moveGiteOrder = async function(giteId, direction) {
    const success = await window.gitesManager.moveGite(giteId, direction);
    // ...
}
```

## 📋 Migration

### Étape 1 : Exécuter le script SQL
```bash
# Depuis Supabase SQL Editor
# Exécuter le contenu de sql/add_ordre_affichage_gites.sql
```

### Étape 2 : Vider le cache (optionnel)
Le système fonctionne immédiatement, mais pour nettoyer l'ancien localStorage :
```javascript
localStorage.removeItem('gites_custom_order');
```

## ✨ Avantages

- ✅ **Persistance multi-appareils** : L'ordre est synchronisé entre tous les appareils
- ✅ **Résistant au cache** : Survit au nettoyage du navigateur
- ✅ **Performances** : Index sur `ordre_affichage` pour un tri rapide
- ✅ **Initialisation automatique** : Les nouveaux gîtes reçoivent automatiquement un ordre
- ✅ **Cohérence** : Un seul ordre sauvegardé dans la base de données

## 🧪 Tests à Effectuer

1. ✅ Modifier l'ordre des gîtes dans "Gérer mes gîtes"
2. ✅ Rafraîchir la page → L'ordre est conservé
3. ✅ Se connecter depuis un autre navigateur → L'ordre est identique
4. ✅ Vider le cache → L'ordre est toujours là
5. ✅ Ajouter un nouveau gîte → Il reçoit automatiquement le dernier ordre

## 📝 Notes Techniques

### Structure de la table `gites`
```sql
-- Nouvelle colonne
ordre_affichage INTEGER  -- NULL = non défini, 1+ = ordre personnalisé
```

### Ordre de tri
1. **Primary** : `ordre_affichage ASC NULLS LAST`
2. **Secondary** : `name ASC` (si ordre_affichage est NULL)

### Impact RLS (Row Level Security)
Aucun impact : Les RLS existantes continuent de filtrer par `owner_user_id`.

## 🔄 Rollback (si nécessaire)

Si problème détecté :

```sql
-- Supprimer la colonne
ALTER TABLE gites DROP COLUMN IF EXISTS ordre_affichage;

-- Supprimer l'index
DROP INDEX IF EXISTS idx_gites_ordre_affichage;
```

Puis revenir à la version précédente du code (V6.0 ou antérieure).

---

**Date de correction** : 05 février 2026  
**Statut** : ✅ Implémenté
