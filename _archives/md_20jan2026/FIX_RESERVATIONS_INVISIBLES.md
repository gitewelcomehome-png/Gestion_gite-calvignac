# 🔍 GUIDE: Résolution du problème "Pas de réservations affichées"

## 🎯 Diagnostic du problème

Vos réservations ne s'affichent pas à cause de la **Row Level Security (RLS)** qui filtre par `owner_user_id`.

### Symptôme
- Les requêtes JavaScript retournent un tableau vide `[]`
- La console réseau montre une requête réussie mais sans données
- Pas de message d'erreur explicite

### Cause racine
Les réservations existantes dans la base de données n'ont **pas de `owner_user_id`**, donc elles sont invisibles à cause de la politique RLS :
```sql
CREATE POLICY rgpd_all_own_reservations ON reservations 
FOR ALL USING (owner_user_id = auth.uid());
```

## 📋 Étapes de résolution

### Étape 1: Diagnostic
Exécutez le script de diagnostic dans Supabase SQL Editor :
```bash
sql/diagnostic_reservations.sql
```

Cela vous montrera :
- ✅ Si la colonne `owner_user_id` existe
- ✅ Combien de réservations n'ont pas d'owner
- ✅ Quel est votre user ID
- ✅ Si RLS est activé

### Étape 2: Appliquer le fix
Exécutez le script de correction dans Supabase SQL Editor :
```bash
sql/fix_add_owner_user_id_to_reservations.sql
```

Ce script va :
1. ✅ Ajouter la colonne `owner_user_id` si elle n'existe pas
2. ✅ Assigner toutes les réservations au premier utilisateur trouvé
3. ✅ Rendre la colonne NOT NULL (si toutes les réservations ont un owner)
4. ✅ Créer un index pour optimiser les requêtes

### Étape 3: Vérification
Après avoir exécuté le fix, vérifiez que tout fonctionne :

**Dans Supabase SQL Editor :**
```sql
-- Vérifier que toutes les réservations ont un owner
SELECT COUNT(*) FROM reservations WHERE owner_user_id IS NULL;
-- Résultat attendu: 0

-- Vérifier que vous voyez vos réservations (avec RLS actif)
SELECT COUNT(*) FROM reservations;
-- Résultat attendu: nombre de vos réservations
```

**Dans votre application :**
- Actualisez la page (F5)
- Les réservations devraient maintenant s'afficher

## 🔧 Solutions alternatives

### Option A: Désactiver temporairement RLS (⚠️ pour debug uniquement)
```sql
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
```
Puis testez dans votre app. Si les réservations apparaissent, c'est bien un problème RLS.

**N'oubliez pas de réactiver** :
```sql
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
```

### Option B: Assigner manuellement à votre utilisateur
Si vous connaissez votre user ID :
```sql
-- Remplacez YOUR_USER_ID par votre UUID
UPDATE reservations 
SET owner_user_id = 'YOUR_USER_ID'
WHERE owner_user_id IS NULL;
```

### Option C: Voir votre user ID
```sql
SELECT id, email FROM auth.users;
```

## 🔍 Vérifier que le JavaScript fonctionne correctement

Le fichier [js/supabase-operations.js](../js/supabase-operations.js) fait déjà la conversion correcte entre :
- SQL : `check_in`, `check_out`, `client_name`, `gite_id`
- JavaScript : `dateDebut`, `dateFin`, `nom`, `giteId`

Donc **pas besoin de modifier le JavaScript** si le problème est RLS.

## 📝 Vérification finale

Une fois le fix appliqué, testez dans la console du navigateur :
```javascript
// Ouvrir la console (F12)
const { data, error } = await window.supabaseClient
    .from('reservations')
    .select('*');

console.log('Réservations:', data);
console.log('Erreur:', error);
```

## ✅ Checklist de résolution

- [ ] Exécuter `diagnostic_reservations.sql` dans Supabase SQL Editor
- [ ] Noter combien de réservations n'ont pas d'`owner_user_id`
- [ ] Noter votre user ID depuis `auth.users`
- [ ] Exécuter `fix_add_owner_user_id_to_reservations.sql`
- [ ] Vérifier que toutes les réservations ont maintenant un owner
- [ ] Actualiser l'application (F5)
- [ ] Vérifier que les réservations s'affichent
- [ ] (Optionnel) Vérifier dans la console JavaScript

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifier la connexion utilisateur** :
   ```javascript
   const { data } = await window.supabaseClient.auth.getUser();
   console.log('User connecté:', data.user);
   ```

2. **Vérifier les politiques RLS** :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'reservations';
   ```

3. **Tester une requête directe** :
   Dans Supabase SQL Editor, testez avec un user_id spécifique :
   ```sql
   SELECT * FROM reservations WHERE owner_user_id = 'VOTRE_USER_ID';
   ```

## 📚 Ressources

- [schema_complet_toutes_tables.sql](../sql/schema_complet_toutes_tables.sql) - Schéma complet avec RLS
- [supabase-operations.js](../js/supabase-operations.js) - Conversion des noms de colonnes
- Documentation Supabase RLS : https://supabase.com/docs/guides/auth/row-level-security
