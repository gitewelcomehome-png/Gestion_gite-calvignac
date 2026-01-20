# 🎯 MAPPING DRAPS - SYNTHÈSE COMPLÈTE

**Date:** 14 janvier 2026  
**Statut:** ✅ Corrections terminées, prêt pour production

---

## 📊 Vue d'Ensemble

### Problème Initial
L'onglet draps utilisait une table `linen_stocks` qui **n'existait pas** dans la BDD, et le code ne gérait pas les UUID `owner_user_id` nécessaires pour le RLS.

### Solution Appliquée
1. ✅ Création de la table `linen_stocks` avec la bonne structure
2. ✅ Ajout des UUID `owner_user_id` dans tout le code JS
3. ✅ Ajout des filtres RLS partout
4. ✅ Amélioration de la gestion d'erreur
5. ✅ Mise à jour de la documentation

---

## 🗂️ Fichiers Modifiés

### 1. Scripts SQL Créés

#### `sql/fix_draps_table.sql` ⭐ PRINCIPAL
**À exécuter en production**

Contient :
- Suppression de l'ancienne table `stocks_draps`
- Création de `linen_stocks` avec structure correcte
- 7 colonnes de quantités (draps, housses, taies, serviettes, tapis)
- UUID `owner_user_id` obligatoire
- Contrainte UNIQUE sur `gite_id`
- RLS activé avec politique

#### `sql/verify_draps_table.sql` 
**Script de vérification**

Permet de vérifier :
- Existence de la table
- Structure des colonnes
- Contraintes et index
- Politiques RLS
- Suppression de l'ancienne table

#### `sql/RAPPORT_MAPPING_DRAPS.md`
Analyse détaillée des problèmes et solutions

---

### 2. Code JavaScript Modifié

#### `js/draps.js` - 5 fonctions corrigées

| Fonction | Corrections |
|----------|-------------|
| `chargerStocks()` | ✅ Ajout récupération user<br>✅ Filtre `.eq('owner_user_id', user.id)`<br>✅ Gestion erreur améliorée |
| `sauvegarderStocks()` | ✅ Ajout `owner_user_id: user.id`<br>✅ Vérification user connecté<br>✅ Gestion erreur améliorée |
| `analyserReservations()` | ✅ Ajout filtre RLS<br>✅ Récupération user<br>✅ Gestion erreur améliorée |
| `creerTacheStockSiNecessaire()` | ✅ Ajout `owner_user_id` dans insert<br>✅ Filtre RLS dans select |
| `simulerBesoins()` | ✅ Correction typo `supabaseClientClient`<br>✅ Ajout filtre RLS<br>✅ Gestion erreur améliorée |

---

### 3. Documentation Mise à Jour

#### `ARCHITECTURE.md`
Section `draps` remplacée par `linen_stocks` avec structure complète.

#### `SCHEMA_COMPLET_FINAL_2026.sql`
Section `TABLE 6: stocks_draps` remplacée par `TABLE 6: linen_stocks`.

---

## 🔑 Variables Mappées

### Entrées Utilisateur → BDD

| ID HTML | Variable JS | Colonne BDD | Type |
|---------|-------------|-------------|------|
| `stock-{slug}-draps-grands` | `parseInt(value)` | `draps_plats_grands` | INT |
| `stock-{slug}-draps-petits` | `parseInt(value)` | `draps_plats_petits` | INT |
| `stock-{slug}-housses-grandes` | `parseInt(value)` | `housses_couettes_grandes` | INT |
| `stock-{slug}-housses-petites` | `parseInt(value)` | `housses_couettes_petites` | INT |
| `stock-{slug}-taies` | `parseInt(value)` | `taies_oreillers` | INT |
| `stock-{slug}-serviettes` | `parseInt(value)` | `serviettes` | INT |
| `stock-{slug}-tapis` | `parseInt(value)` | `tapis_bain` | INT |

### Variables Auto-gérées

| Variable JS | Colonne BDD | Source |
|-------------|-------------|--------|
| `user.id` | `owner_user_id` | `auth.getUser()` |
| `gite.id` | `gite_id` | `gitesManager.getAll()` |
| `new Date().toISOString()` | `updated_at` | Date actuelle |
| - | `id` | `gen_random_uuid()` auto |
| - | `created_at` | `NOW()` auto |

---

## 🚀 Procédure de Déploiement

### Étape 1 : Vérifier l'Existant ⚠️

```sql
-- Vérifier si la table existe déjà
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('linen_stocks', 'stocks_draps');
```

### Étape 2 : Backup (si données existantes)

```sql
-- Si stocks_draps existe avec des données
CREATE TABLE backup_stocks_draps_20260114 AS 
SELECT * FROM stocks_draps;
```

### Étape 3 : Exécuter le Script Principal

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: sql/fix_draps_table.sql
```

### Étape 4 : Vérifier la Création

```sql
-- Exécuter le script de vérification
-- Fichier: sql/verify_draps_table.sql
```

### Étape 5 : Test Fonctionnel

1. Ouvrir l'onglet Draps
2. Saisir des quantités de stock
3. Cliquer sur "Sauvegarder"
4. Recharger la page
5. Vérifier que les valeurs sont conservées

### Étape 6 : Vérifier les Réservations

1. Vérifier l'affichage "Réservations Couvertes"
2. Vérifier "À Emmener dans les Gîtes"
3. Tester la simulation avec une date future

---

## ⚠️ Points d'Attention

### Avant Exécution

- [ ] **Backup effectué** si données existantes
- [ ] **Utilisateur connecté** en production pour tester
- [ ] **Gîtes configurés** avec `settings.linen_needs`

### Après Exécution

- [ ] Vérifier l'absence d'erreurs console
- [ ] Vérifier la sauvegarde/chargement
- [ ] Vérifier l'analyse des réservations
- [ ] Vérifier la création de tâches automatiques

### Si Problème

1. Consulter les logs Supabase
2. Vérifier les politiques RLS
3. Vérifier que `owner_user_id` est bien défini
4. Consulter `ERREURS_CRITIQUES.md`

---

## 📈 Impact sur le Système

### Tables Affectées

| Table | Action | Impact |
|-------|--------|--------|
| `stocks_draps` | Supprimée | ⚠️ Données perdues si existent |
| `linen_stocks` | Créée | ✅ Nouvelle structure |
| `todos` | Modifiée (insert) | ✅ UUID ajouté |

### Code Affecté

| Fichier | Lignes modifiées | Impact |
|---------|------------------|--------|
| `js/draps.js` | ~30 lignes | ✅ UUID + RLS |
| `ARCHITECTURE.md` | 5 lignes | ✅ Doc |
| `SCHEMA_COMPLET_FINAL_2026.sql` | 15 lignes | ✅ Structure |

---

## ✅ Checklist Finale

### Avant Production
- [x] Scripts SQL créés et testés
- [x] Code JS corrigé et validé
- [x] Documentation mise à jour
- [x] Pas d'erreurs de syntaxe
- [ ] Backup effectué

### Déploiement
- [ ] Script SQL exécuté en production
- [ ] Vérifications SQL passées
- [ ] Tests fonctionnels OK
- [ ] Pas d'erreurs console

### Après Déploiement
- [ ] Utilisateurs informés des changements
- [ ] Monitoring actif pendant 24h
- [ ] Rollback plan préparé

---

## 🆘 Rollback Plan

Si problème critique après déploiement :

```sql
-- 1. Supprimer linen_stocks
DROP TABLE IF EXISTS linen_stocks CASCADE;

-- 2. Restaurer backup si existait
CREATE TABLE stocks_draps AS 
SELECT * FROM backup_stocks_draps_20260114;

-- 3. Restaurer ancien code JS
git checkout HEAD~1 js/draps.js
```

---

## 📞 Support

En cas de problème :
1. Consulter `ERREURS_CRITIQUES.md`
2. Vérifier les logs Supabase
3. Vérifier les politiques RLS
4. Contacter l'équipe dev

---

**Préparé par:** GitHub Copilot  
**Validé par:** En attente  
**Date d'exécution prévue:** À définir
