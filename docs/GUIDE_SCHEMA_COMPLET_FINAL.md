# 🎯 SCHEMA COMPLET FINAL - Guide d'Installation

## 📋 Vue d'ensemble

Ce schéma SQL a été créé après une **analyse complète de TOUT le code JavaScript** existant. Il contient :

✅ **Toutes les colonnes** utilisées dans le code  
✅ **Compatibilité totale** avec l'ancien code (colonnes legacy)  
✅ **Synchronisation automatique** entre anciennes et nouvelles colonnes  
✅ **Migration automatique** des données existantes  
✅ **Row Level Security** activé sur toutes les tables  

## 🔑 Caractéristiques principales

### Table `reservations` - Schéma hybride

Le schéma inclut **DEUX ENSEMBLES** de colonnes pour assurer la compatibilité :

#### Colonnes SQL modernes (snake_case)
- `check_in`, `check_out` → dates d'arrivée/départ
- `client_name`, `client_email`, `client_phone` → infos client
- `total_price`, `paid_amount` → finances
- `guest_count` → nombre de personnes
- `platform` → plateforme de réservation

#### Colonnes legacy (ancien code)
- `gite` → nom du gîte en texte
- `plateforme` → alias de platform
- `montant`, `acompte`, `restant` → alias finances
- `telephone` → alias client_phone
- `nb_personnes` → alias guest_count
- `message_envoye` → suivi messages clients

### Triggers automatiques

3 triggers PostgreSQL synchronisent automatiquement les données :

1. **`calculate_restant()`** : Calcule le montant restant et le statut de paiement
2. **`sync_gite_name()`** : Remplit la colonne `gite` avec le nom du gîte
3. **`sync_reservation_aliases()`** : Synchronise bidirectionnellement toutes les colonnes aliases

**Exemple** : Si vous insérez avec `total_price`, le trigger remplit automatiquement `montant`.

### Table `cleaning_schedule` - Complète

Contient **TOUTES** les colonnes nécessaires au code JavaScript :

- `reservation_id` → **CRITIQUE** pour le `onConflict` dans menage.js
- `validated_by_company` → validation entreprise
- `reservation_end` → date fin de réservation
- `reservation_start_after` → prochaine arrivée
- Contrainte **UNIQUE** sur `reservation_id` pour upsert

## 📦 Installation

### Option 1 : Nouvelle installation (recommandé)

1. **Ouvrir Supabase SQL Editor**

2. **Copier-coller le fichier entier** : [sql/SCHEMA_COMPLET_FINAL_2026.sql](../sql/SCHEMA_COMPLET_FINAL_2026.sql)

3. **Exécuter** (bouton Run)

4. **Vérifier les logs** :
   ```
   ✅ MIGRATION TERMINÉE
   📊 VÉRIFICATION FINALE
   ✅ Schéma complet installé avec succès !
   ```

5. **Actualiser votre application** (F5)

### Option 2 : Migration depuis l'ancien schéma

Si vous avez déjà des tables existantes :

1. **Créer un backup d'abord** :
   ```sql
   -- Dans Supabase SQL Editor
   -- Backup automatique est fait par Supabase
   ```

2. **Décommenter la section NETTOYAGE** dans le fichier SQL (lignes 10-23)

3. **Exécuter le script complet**

4. **Vérifier que les données sont migrées** (le script affiche un rapport)

## 🧪 Tests après installation

### Test 1 : Vérifier les réservations

```sql
-- Dans Supabase SQL Editor
SELECT 
    id,
    client_name,
    check_in,
    check_out,
    owner_user_id
FROM reservations
LIMIT 5;
```

**Résultat attendu** : Vos réservations avec un `owner_user_id` rempli.

### Test 2 : Tester la synchronisation des aliases

```sql
-- Insérer une réservation avec les NOUVELLES colonnes
INSERT INTO reservations (
    owner_user_id,
    gite_id,
    check_in,
    check_out,
    client_name,
    total_price,
    paid_amount,
    platform,
    guest_count
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM gites LIMIT 1),
    '2026-02-01',
    '2026-02-08',
    'Test Client',
    500.00,
    100.00,
    'airbnb',
    2
);

-- Vérifier que les ANCIENNES colonnes sont remplies automatiquement
SELECT 
    client_name,
    total_price, montant,  -- doivent être identiques
    paid_amount, acompte,  -- doivent être identiques
    restant,               -- doit être calculé (400.00)
    platform, plateforme,  -- doivent être identiques
    guest_count, nb_personnes  -- doivent être identiques
FROM reservations
WHERE client_name = 'Test Client';
```

**Résultat attendu** : Toutes les colonnes aliases sont identiques grâce au trigger.

### Test 3 : Vérifier cleaning_schedule

```sql
-- Vérifier la structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cleaning_schedule'
  AND column_name IN ('reservation_id', 'validated_by_company', 'reservation_end', 'reservation_start_after')
ORDER BY column_name;
```

**Résultat attendu** : Les 4 colonnes critiques existent.

### Test 4 : Vérifier la contrainte UNIQUE

```sql
SELECT 
    conname as constraint_name
FROM pg_constraint
WHERE conrelid = 'cleaning_schedule'::regclass
  AND conname = 'cleaning_schedule_reservation_id_unique';
```

**Résultat attendu** : La contrainte existe.

### Test 5 : Tester depuis l'application

1. **Actualiser** la page (F5)

2. **Vérifier** que les réservations s'affichent dans le calendrier

3. **Ouvrir** l'onglet "Ménage" → "Générer le planning"

4. **Vérifier** qu'il n'y a plus d'erreurs 400 dans la console (F12)

## 📊 Structure complète des tables

### Tables principales

| Table | Description | Colonnes critiques |
|-------|-------------|-------------------|
| `gites` | Propriétés | `owner_user_id`, `name`, `slug` |
| `reservations` | Réservations | `owner_user_id`, `gite_id`, `check_in`, `check_out` + aliases |
| `cleaning_schedule` | Planning ménage | `reservation_id`, `owner_user_id`, `scheduled_date` |
| `charges` | Dépenses | `owner_user_id`, `gite_id`, `amount`, `category` |

### Tables secondaires

| Table | Description |
|-------|-------------|
| `retours_menage` | Retours femme de ménage |
| `stocks_draps` | Gestion draps et linge |
| `infos_pratiques` | Informations clients |
| `faq` | Questions fréquentes |
| `todos` | Liste de tâches |
| `demandes_horaires` | Demandes horaires clients |
| `problemes_signales` | Problèmes signalés |
| `simulations_fiscales` | Simulations fiscalité |
| `suivi_soldes_bancaires` | Suivi soldes bancaires |

## 🔒 Sécurité (RLS)

Toutes les tables ont Row Level Security activé avec une politique simple :

```sql
CREATE POLICY rgpd_all_own_[table] ON [table]
FOR ALL USING (owner_user_id = auth.uid());
```

**Résultat** : Chaque utilisateur ne voit que ses propres données.

## 🔄 Compatibilité avec le code existant

### Le code JavaScript n'a PAS BESOIN d'être modifié

✅ [js/supabase-operations.js](../js/supabase-operations.js) convertit automatiquement snake_case ↔ camelCase  
✅ Les triggers SQL synchronisent les colonnes aliases  
✅ Les anciennes et nouvelles colonnes coexistent  

### Exemple de compatibilité

**Code JS existant** (ne change pas) :
```javascript
const reservation = {
    dateDebut: '2026-02-01',    // → converti en check_in
    dateFin: '2026-02-08',       // → converti en check_out
    nom: 'Client Test',          // → converti en client_name
    montant: 500,                // → converti en total_price
    acompte: 100                 // → converti en paid_amount
};
await addReservation(reservation);
```

**SQL (nouveau schéma)** :
- Les données arrivent en `check_in`, `check_out`, `client_name`, etc.
- Les triggers remplissent automatiquement `dateDebut`, `dateFin`, `nom`, etc.
- **Les deux formats sont disponibles simultanément !**

## 🆘 Résolution de problèmes

### Erreur : "table already exists"

**Solution** : Décommentez la section NETTOYAGE dans le SQL (lignes 10-23) pour supprimer les anciennes tables.

### Erreur : "no rows returned"

**Cause** : Aucun utilisateur dans `auth.users`.

**Solution** :
1. Créez un utilisateur dans Supabase Auth (Authentication > Users > Add user)
2. Relancez le script SQL

### Les réservations ne s'affichent toujours pas

**Vérification 1** : Utilisateur connecté ?
```javascript
const { data } = await window.supabaseClient.auth.getUser();
console.log('User:', data.user);
```

**Vérification 2** : RLS actif ?
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'reservations';
```

**Vérification 3** : Réservations ont un owner ?
```sql
SELECT COUNT(*), COUNT(owner_user_id) 
FROM reservations;
```

### Erreur 400 sur cleaning_schedule persiste

**Vérification** : Contrainte UNIQUE existe ?
```sql
SELECT conname FROM pg_constraint 
WHERE conrelid = 'cleaning_schedule'::regclass;
```

Si absente, exécuter manuellement :
```sql
ALTER TABLE cleaning_schedule 
ADD CONSTRAINT cleaning_schedule_reservation_id_unique UNIQUE(reservation_id);
```

## 📝 Notes importantes

### Colonnes dénormalisées

La colonne `gite` (TEXT) dans `reservations` est **dénormalisée** pour compatibilité :
- Elle est remplie automatiquement par trigger depuis `gites.name`
- ⚠️ Ne la modifiez pas manuellement
- Utilisez toujours `gite_id` pour les relations

### Performance

Les index sont créés sur toutes les colonnes fréquemment interrogées :
- `owner_user_id` (filtrage RLS)
- `check_in`, `check_out` (recherches par date)
- `gite_id` (filtres par gîte)
- `platform`, `status` (filtres et stats)

## ✅ Checklist finale

Après installation, vérifiez :

- [ ] Script SQL exécuté sans erreur
- [ ] Message "✅ Schéma complet installé avec succès !"
- [ ] Application actualisée (F5)
- [ ] Réservations visibles dans le calendrier
- [ ] Onglet "Ménage" accessible
- [ ] Génération planning ménage fonctionne
- [ ] Aucune erreur 400 dans la console (F12)
- [ ] Tests SQL ci-dessus passent

**Si tous les points sont cochés** : 🎉 **Installation réussie !**

## 📚 Fichiers créés

1. ✅ [sql/SCHEMA_COMPLET_FINAL_2026.sql](../sql/SCHEMA_COMPLET_FINAL_2026.sql) - Schéma SQL complet
2. ✅ Ce fichier - Guide d'installation

## 🔗 Fichiers connexes

- [docs/AUDIT_SYSTEME_RESERVATIONS.md](AUDIT_SYSTEME_RESERVATIONS.md) - Audit complet du système
- [sql/MIGRATION_FIX_RESERVATIONS_COMPLET.sql](../sql/MIGRATION_FIX_RESERVATIONS_COMPLET.sql) - Migration simple (ancien fichier)
- [sql/diagnostic_reservations.sql](../sql/diagnostic_reservations.sql) - Script de diagnostic
