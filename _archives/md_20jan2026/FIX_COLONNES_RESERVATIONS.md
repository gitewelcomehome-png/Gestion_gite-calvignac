# 🔧 CORRECTIFS APPLIQUÉS - Colonnes Réservations

**Date**: 12 janvier 2026  
**Problème**: Erreur `column reservations.date_debut does not exist`  
**Cause**: Incohérence entre le schéma SQL (colonnes `check_in`, `check_out`, `client_name`, etc.) et le code JavaScript (colonnes `date_debut`, `date_fin`, `nom_client`, etc.)

---

## ✅ Fichiers Corrigés

### 1. **js/supabase-operations.js** 
Mise à jour complète des opérations CRUD sur `reservations`:

| Ancien nom | Nouveau nom |
|------------|-------------|
| `date_debut` / `date_fin` | `check_in` / `check_out` |
| `gite` (string) | `gite_id` (UUID) |
| `nom_client` | `client_name` |
| `telephone` | `client_phone` |
| `nb_personnes` | `guest_count` |
| `plateforme` | `platform` |
| `montant` | `total_price` |
| `acompte` / `restant` | `paid_amount` |

**Fonctions modifiées**:
- `addReservation()`: Ajout de `owner_user_id`, mapping complet des colonnes
- `getAllReservations()`: Changement du `order` et mapping inverse (DB → JS)
- `updateReservation()`: Support des deux formats pour rétro-compatibilité

### 2. **js/checklists.js**
- Requêtes: `date_debut` → `check_in`, `date_fin` → `check_out`
- Filtres temporels mis à jour
- Affichage: `nom_client` → `client_name`, `gite` → `gite_id`

### 3. **js/fiches-clients.js**
- Requête principale: colonnes mises à jour dans `.select()`
- Relations: `demandes_horaires` et `retours_clients` avec nouveaux noms
- Filtres: `date_debut` → `check_in`, `gite` → `gite_id`
- Affichage: tous les champs client mis à jour
- Fonctions `renderDemandeCard()` et widgets

### 4. **js/widget-horaires-clients.js**
- Support des deux formats: `check_in || date_debut` pour rétro-compatibilité
- Affichage: `client_name` et `gite_id`

### 5. **js/sync-ical.js**
- Format d'insertion: ajout de `giteId` en plus de `gite`
- Nom client: `nomClient` ajouté pour compatibilité
- Logs de suppression: gestion des deux formats

---

## 🗄️ Scripts SQL Créés

### **sql/fix_add_owner_user_id_to_reservations.sql**
Script intelligent qui:
1. ✅ Vérifie si `owner_user_id` existe
2. ✅ Ajoute la colonne si manquante
3. ✅ Remplit automatiquement avec l'utilisateur actuel
4. ✅ Définit NOT NULL si toutes les lignes sont remplies
5. ✅ Ajoute l'index `idx_reservations_owner`

**À EXÉCUTER** dans Supabase SQL Editor avant de tester l'application.

---

## 🎯 Rétro-compatibilité

Les fichiers suivants **gèrent déjà les deux formats** et n'ont PAS besoin de modification:
- `js/fiche-client.js` : `reservation.dateFin || reservation.date_fin`
- `js/menage.js` : `r.dateDebut || r.date_debut`
- `js/dashboard.js` : Affichage uniquement, pas de requête directe

---

## 🚀 Prochaines Étapes

### Étape 1: Exécuter le script SQL
```sql
-- Dans Supabase > SQL Editor
-- Exécuter: sql/fix_add_owner_user_id_to_reservations.sql
```

### Étape 2: Vérifier le schéma
Assurez-vous que votre table `reservations` a bien:
- ✅ `check_in DATE NOT NULL`
- ✅ `check_out DATE NOT NULL`
- ✅ `client_name TEXT NOT NULL`
- ✅ `gite_id UUID NOT NULL REFERENCES gites(id)`
- ✅ `owner_user_id UUID NOT NULL REFERENCES auth.users(id)`
- ✅ `platform TEXT`
- ✅ `total_price DECIMAL(10,2)`
- ✅ `paid_amount DECIMAL(10,2)`
- ✅ `guest_count INT`
- ✅ `client_phone TEXT`
- ✅ `client_email TEXT`

### Étape 3: Tester l'application
1. Recharger l'application (Ctrl+F5)
2. Aller dans l'onglet **Réservations**
3. Vérifier que les réservations se chargent
4. Tester l'ajout d'une nouvelle réservation
5. Tester la synchronisation iCal

### Étape 4: Vérifier les données existantes
Si vous avez des réservations avec l'ancien format dans la DB:
```sql
-- Migration des données (si nécessaire)
-- ⚠️ NE PAS EXÉCUTER si vos colonnes sont déjà correctes
ALTER TABLE reservations 
  RENAME COLUMN date_debut TO check_in,
  RENAME COLUMN date_fin TO check_out,
  RENAME COLUMN nom_client TO client_name;
```

---

## ⚠️ Problèmes Possibles

### Si l'erreur persiste après correction:

**1. Cache navigateur**
```bash
Ctrl + Shift + R (Firefox/Chrome)
Cmd + Shift + R (Mac)
```

**2. Cache Supabase**
Le code invalide automatiquement le cache via `window.invalidateCache('reservations')`

**3. Schéma non synchronisé**
Vérifier dans Supabase > Table Editor que les colonnes correspondent au schéma attendu

**4. RLS (Row Level Security)**
Si RLS est activé, les politiques doivent utiliser `owner_user_id`:
```sql
-- Politique exemple
CREATE POLICY "Users can view own reservations"
ON reservations FOR SELECT
USING (owner_user_id = auth.uid());
```

---

## 📝 Notes Techniques

### Format de dates
- **SQL**: `DATE` (format ISO: `YYYY-MM-DD`)
- **JavaScript**: Conversion automatique via `formatDateForSupabase()`

### UUIDs vs Strings
- Avant: `gite` était un string (nom du gîte)
- Après: `gite_id` est un UUID (référence à `gites.id`)
- Le code JS convertit automatiquement pour affichage

### Owner User ID
- **Obligatoire** pour RLS (Row Level Security)
- **Auto-rempli** à l'insertion via `auth.getUser()`
- **Multi-tenant ready** pour futures fonctionnalités

---

## ✨ Améliorations Apportées

1. **Conformité au schéma moderne**: Alignement avec le schéma SQL officiel
2. **Sécurité renforcée**: Support de `owner_user_id` pour RLS
3. **Rétro-compatibilité**: Gestion des deux formats dans certains fichiers
4. **Code plus propre**: Mapping explicite entre formats DB et JS
5. **Meilleure maintenabilité**: Centralisation dans `supabase-operations.js`
