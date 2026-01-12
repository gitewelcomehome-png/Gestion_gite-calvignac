# 🛡️ MIGRATION SÉCURISÉE - GUIDE COMPLET

## 📋 Vue d'ensemble

Ce guide explique comment migrer votre base de données **SANS RIEN CASSER** en 3 étapes simples et sécurisées.

---

## 🎯 ÉTAPE 1 : DIAGNOSTIC (OBLIGATOIRE)

Avant toute chose, **vérifiez l'état actuel** de votre base :

### 1.1 Ouvrir Supabase SQL Editor
- Allez sur votre projet Supabase
- Cliquez sur **SQL Editor** dans le menu de gauche

### 1.2 Exécuter le diagnostic
```sql
-- Copiez/collez le contenu de ce fichier :
sql/DIAGNOSTIC_COMPLET.sql
```

### 1.3 Analyser les résultats
Le diagnostic vous dira :
- ✅ **Quelles tables existent** déjà
- ✅ **Quelles colonnes sont présentes** (notamment `owner_user_id`)
- ✅ **Combien de données** vous avez dans chaque table
- ✅ **Quel utilisateur** sera utilisé comme propriétaire

**📸 SCREENSHOT:** Faites une capture d'écran des résultats !

---

## 🎯 ÉTAPE 2 : MIGRATION SÉCURISÉE

Une fois le diagnostic fait, lancez la migration :

### 2.1 Exécuter la migration
```sql
-- Copiez/collez le contenu de ce fichier :
sql/MIGRATION_SECURISEE_COMPLETE.sql
```

### 2.2 Ce que fait ce script (EN SÉCURITÉ)

#### ✅ VÉRIFICATIONS AUTOMATIQUES
- ❓ La table existe ? → Ajoute juste les colonnes manquantes
- ❓ La colonne existe déjà ? → Ne touche à rien
- ❓ Des données existent ? → Les migre automatiquement
- ❓ Pas de données ? → Crée la structure complète

#### ✅ ACTIONS RÉALISÉES
1. **Identifie votre utilisateur** dans `auth.users`
2. **Migre `gites`** : ajoute `owner_user_id` + colonnes manquantes
3. **Migre `reservations`** : ajoute 30+ colonnes (modernes + legacy)
4. **Migre `cleaning_schedule`** : ajoute 4 colonnes critiques + contrainte UNIQUE
5. **Migre les autres tables** : ajoute `owner_user_id` partout
6. **Crée 3 triggers** : synchronisation automatique des colonnes
7. **Active RLS** : sécurise toutes les tables
8. **Vérifie tout** : affiche un rapport final

#### 🛡️ GARANTIES DE SÉCURITÉ
- ✅ **Transaction BEGIN/COMMIT** : tout ou rien
- ✅ **Vérification avant action** : jamais d'écrasement
- ✅ **Conservation des données** : 100% préservées
- ✅ **Rapport détaillé** : vous savez ce qui a été fait

### 2.3 Lire les messages
Le script affiche des messages comme :
```
✅ Utilisateur par défaut identifié: abc-123-xyz
✅ Table gites créée
✅ Colonne owner_user_id ajoutée à reservations
✅ Colonnes manquantes ajoutées à cleaning_schedule
✅ Trigger calculate_restant créé
✅ RLS activé sur reservations
=== VÉRIFICATION FINALE ===
✅ Réservations: 42
✅ Gîtes: 3
✅ Table reservations a bien owner_user_id
=== MIGRATION TERMINÉE ===
```

---

## 🎯 ÉTAPE 3 : TABLES SUPPLÉMENTAIRES (Optionnel)

Si vous utilisez les fonctionnalités avancées (fiches clients, activités, checklists), exécutez :

```sql
-- Copiez/collez le contenu de ce fichier :
sql/TABLES_SUPPLEMENTAIRES.sql
```

Cela ajoute 12 tables supplémentaires :
- `infos_gites` : Codes WiFi, accès, parking
- `client_access_tokens` : Accès sécurisés fiches clients
- `activites_gites` : Recommandations touristiques
- `checklist_templates` / `checklist_progress` : Gestion des tâches
- Et 7 autres tables...

---

## 🎯 ÉTAPE 4 : RAFRAÎCHIR L'APPLICATION

Une fois la migration terminée :

1. **Ouvrir votre application** dans le navigateur
2. **Appuyer sur F5** (ou Ctrl+R / Cmd+R)
3. **Vérifier que tout fonctionne** :
   - ✅ Les réservations s'affichent
   - ✅ Le planning ménage fonctionne
   - ✅ Pas d'erreurs 400 ou 404
   - ✅ Toutes les fonctionnalités opérationnelles

---

## 📊 COMPARAISON DES SCRIPTS

| Script | Usage | Sécurité | Données préservées |
|--------|-------|----------|-------------------|
| `fix_add_owner_user_id_to_reservations.sql` | ⚠️ Ancien (1 table) | ✅ Oui | ✅ Oui |
| `MIGRATION_SECURISEE_COMPLETE.sql` | ✅ **RECOMMANDÉ** | ✅✅✅ Maximum | ✅✅✅ 100% |
| `SCHEMA_COMPLET_FINAL_2026.sql` | ⚠️ Installation propre uniquement | ❌ Non si données | ❌ Écrase tout |

---

## ❓ FAQ

### Q: J'ai déjà exécuté `fix_add_owner_user_id_to_reservations.sql`, dois-je relancer ?
**R:** Oui ! Le nouveau script migre **toutes les tables**, pas seulement `reservations`.

### Q: Est-ce que je vais perdre mes données ?
**R:** **NON**. Le script vérifie tout et ne touche que ce qui manque.

### Q: Combien de temps ça prend ?
**R:** 10-30 secondes selon la taille de votre base.

### Q: Que faire si j'ai une erreur ?
**R:** 
1. La transaction est annulée (ROLLBACK automatique)
2. Rien n'a changé dans votre base
3. Copiez l'erreur et demandez de l'aide

### Q: Puis-je relancer le script plusieurs fois ?
**R:** **OUI**. Il est idempotent (ne casse rien si déjà fait).

### Q: Dois-je faire une sauvegarde avant ?
**R:** Ce serait bien, mais le script est ultra-sécurisé avec `BEGIN/COMMIT`.

---

## 🚀 RÉSUMÉ ULTRA-RAPIDE

```bash
# 1. Diagnostic (voir l'état actuel)
Exécuter: sql/DIAGNOSTIC_COMPLET.sql

# 2. Migration (mettre à jour en sécurité)
Exécuter: sql/MIGRATION_SECURISEE_COMPLETE.sql

# 3. Tables avancées (optionnel)
Exécuter: sql/TABLES_SUPPLEMENTAIRES.sql

# 4. Rafraîchir l'app
F5 dans le navigateur
```

**Temps total : 2 minutes**

---

## ✅ CHECKLIST POST-MIGRATION

- [ ] Le diagnostic s'est bien exécuté
- [ ] La migration affiche "MIGRATION TERMINÉE"
- [ ] Aucune erreur rouge dans Supabase
- [ ] L'application affiche les réservations
- [ ] Le planning ménage fonctionne
- [ ] Pas d'erreurs 400/404 dans la console F12

---

## 📞 BESOIN D'AIDE ?

Si quelque chose ne va pas :
1. **Copiez le message d'erreur** exact
2. **Faites un screenshot** du SQL Editor
3. **Partagez le résultat** du diagnostic
4. Demandez de l'aide avec ces 3 éléments

---

**🎉 Bonne migration !**
