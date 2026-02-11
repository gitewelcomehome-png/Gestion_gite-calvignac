# 📋 Instructions d'Exécution des Scripts SQL

## 🎯 Objectif
Créer la table `cm_error_corrections` pour tracer les corrections appliquées aux erreurs du système de monitoring.

## ⚠️ ORDRE D'EXÉCUTION IMPORTANT

### 1️⃣ Créer la table cm_error_corrections
**Fichier:** `create_error_corrections_table.sql`

Exécuter ce script **EN PREMIER** dans Supabase SQL Editor :

```sql
-- Copier-coller tout le contenu de create_error_corrections_table.sql
```

✅ **Vérification:**
- Message: "✅ Table cm_error_corrections créée avec succès"
- Vérifier dans Supabase: Table Editor → cm_error_corrections existe

### 2️⃣ Enregistrer les corrections
**Fichier:** `log_correction_07feb2026.sql`

Une fois la table créée, exécuter ce script :

```sql
-- Copier-coller tout le contenu de log_correction_07feb2026.sql
```

✅ **Vérification:**
- Message: "✅ 4 occurrences corrigées dans 2 fichiers"
- Vérifier dans Supabase: cm_error_corrections contient 2 lignes

## 📊 Structure de la Table

### cm_error_corrections
```sql
- id (UUID) - Identifiant unique
- error_id (UUID) - Référence à cm_error_logs(id)
- file_path (TEXT) - Chemin du fichier corrigé
- old_code (TEXT) - Code avant correction
- new_code (TEXT) - Code après correction
- description (TEXT) - Description de la correction
- applied_at (TIMESTAMPTZ) - Date d'application
- applied_by (UUID) - Utilisateur ayant appliqué
- validated (BOOLEAN) - Si testée et validée
- validated_at (TIMESTAMPTZ) - Date de validation
- created_at (TIMESTAMPTZ) - Date de création
- updated_at (TIMESTAMPTZ) - Date de mise à jour
```

### Relations
- `error_id` → `cm_error_logs.id` (CASCADE)
- `applied_by` → `auth.users.id`

### Index
- `error_id` - Recherche par erreur
- `applied_at` - Recherche par date
- `validated` - Recherche par statut de validation
- `file_path` - Recherche par fichier

## 🔐 Sécurité (RLS)

Seuls les administrateurs (`stephanecalvignac@hotmail.fr`) peuvent :
- ✅ Voir les corrections
- ✅ Insérer des corrections
- ✅ Modifier les corrections

## 🧪 Test dans l'Interface

Après l'exécution des scripts :

1. Ouvrir **pages/admin-monitoring.html**
2. Scroller jusqu'à "Tests de Corrections"
3. Vous devriez voir 2 corrections :
   - js/menage.js (2 occurrences)
   - js/femme-menage.js (2 occurrences)
4. Cliquer sur "▶️ Tester" pour vérifier
5. Cliquer sur "✅ Valider" pour confirmer

## ❌ Dépannage

### Erreur: "table not found"
➡️ Vous n'avez pas exécuté `create_error_corrections_table.sql`
**Solution:** Exécuter le script 1️⃣ en premier

### Erreur: "relation does not exist"
➡️ La table `cm_error_logs` n'existe pas
**Solution:** Vérifier que le système de monitoring est bien configuré

### Erreur: "foreign key constraint"
➡️ L'ID d'erreur n'existe pas dans cm_error_logs
**Solution:** Vérifier que l'erreur existe dans cm_error_logs ou mettre error_id à NULL

### Erreur: "permission denied"
➡️ Vous n'êtes pas connecté en tant qu'admin
**Solution:** Se connecter avec `stephanecalvignac@hotmail.fr`

## 📝 Notes Importantes

- ⚠️ Les corrections plus anciennes que 24h ne s'affichent pas dans l'interface
- ✅ Elles restent dans la base de données pour traçabilité
- 🔄 Le monitoring 24h continue même si non visible
- 📊 Les stats historiques restent accessibles via SQL

## 🔗 Fichiers Liés

- **SQL:**
  - `create_error_corrections_table.sql` - Création de la table
  - `log_correction_07feb2026.sql` - Enregistrement des corrections

- **JavaScript:**
  - `js/admin-monitoring.js` - Logique de chargement et validation
  
- **HTML:**
  - `pages/admin-monitoring.html` - Interface utilisateur

- **Documentation:**
  - `docs/INTEGRATION_TESTS_MONITORING_07FEB2026.md` - Guide complet

## ✅ Checklist

- [ ] Script 1 exécuté : `create_error_corrections_table.sql`
- [ ] Table visible dans Supabase Table Editor
- [ ] Script 2 exécuté : `log_correction_07feb2026.sql`
- [ ] 2 lignes présentes dans cm_error_corrections
- [ ] Interface monitoring accessible
- [ ] Section "Tests de Corrections" affiche les données
- [ ] Boutons de test fonctionnels
- [ ] Validation fonctionne correctement

---

**Date:** 07/02/2026  
**Version:** 1.0  
**Statut:** Production Ready ✅
