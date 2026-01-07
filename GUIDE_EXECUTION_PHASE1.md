# 🎯 GUIDE D'EXÉCUTION PHASE 1 - INSTRUCTIONS VISUELLES

**Temps estimé** : 10 minutes  
**Difficulté** : Facile (copier-coller)

---

## 📍 ÉTAPE 1.1 - Table ORGANIZATIONS (2 min)

### 🌐 Dans votre navigateur :

```
1. Ouvrir https://app.supabase.com
2. Se connecter si nécessaire
3. Cliquer sur votre projet "Gestion_gite-calvignac"
4. Dans le menu gauche → Cliquer "SQL Editor"
5. Cliquer bouton "+ New query"
```

### 📋 Copier le script :

**Méthode 1** - Dans VSCode :
```
1. Ouvrir : sql/multi-tenant/01_create_organizations_table.sql
2. Sélectionner TOUT (Ctrl+A ou Cmd+A)
3. Copier (Ctrl+C ou Cmd+C)
```

**Méthode 2** - Depuis le terminal :
```bash
# Afficher le script complet
cat sql/multi-tenant/01_create_organizations_table.sql

# Copier manuellement tout le contenu affiché
```

### ▶️ Dans Supabase SQL Editor :

```
1. Coller le script (Ctrl+V ou Cmd+V)
2. Cliquer bouton "Run" (ou Ctrl+Enter)
3. Attendre 2-3 secondes
```

### ✅ Vérifier le résultat :

Vous devez voir :
```
✅ Success. No rows returned
```

Ou des messages en vert comme :
```
NOTICE:  table "organizations" already exists, skipping
✅ Query executed successfully
```

### ⚠️ Si erreur :

**Erreur courante** : "permission denied"
→ Vérifiez que vous êtes bien connecté comme owner du projet

**Autre erreur** : 
→ Copiez le message d'erreur et on debuggera

---

## 📍 ÉTAPE 1.2 - Table GITES (2 min)

### 📋 Copier le 2ème script :

**Dans VSCode** :
```
1. Ouvrir : sql/multi-tenant/02_create_gites_table.sql
2. Sélectionner TOUT (Ctrl+A)
3. Copier (Ctrl+C)
```

### ▶️ Dans Supabase SQL Editor :

```
1. Cliquer "+ New query" (pour un nouveau script)
2. Coller le contenu
3. Cliquer "Run"
```

### ✅ Vérifier :
```
✅ Success. No rows returned
```

---

## 📍 ÉTAPE 1.3 - Table ORGANIZATION_MEMBERS (3 min)

### 📋 Copier le 3ème script :

**Dans VSCode** :
```
1. Ouvrir : sql/multi-tenant/03_create_organization_members_table.sql
2. Sélectionner TOUT (Ctrl+A)
3. Copier (Ctrl+C)
```

### ▶️ Dans Supabase SQL Editor :

```
1. Cliquer "+ New query"
2. Coller le contenu
3. Cliquer "Run"
```

### ✅ Vérifier :
```
✅ Success. No rows returned
```

---

## 📍 ÉTAPE 1.4 - VÉRIFICATION FINALE (3 min)

### 🔍 Test de vérification :

Dans SQL Editor, **nouveau query**, copiez-collez :

```sql
-- Vérifier que les 3 tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'gites', 'organization_members')
ORDER BY table_name;
```

**Cliquez Run**

### ✅ Résultat attendu :

Vous devez voir **3 lignes** :
```
table_name
-------------------
gites
organization_members
organizations
```

### 🎊 Si vous voyez ces 3 lignes :

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║          ✅ PHASE 1 TERMINÉE AVEC SUCCÈS !                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

✅ Table "organizations" créée
✅ Table "gites" créée  
✅ Table "organization_members" créée

🎯 VOTRE SITE FONCTIONNE TOUJOURS NORMALEMENT
   → Ces tables n'ont AUCUN impact sur l'existant
   → Elles sont juste prêtes pour la suite

📊 État de migration : 20% complété
```

### 🔄 Test supplémentaire - Vérifier votre site :

```
1. Ouvrir votre site (index.html ou URL)
2. Tester les fonctionnalités principales :
   ✓ Voir les réservations
   ✓ Voir le calendrier
   ✓ Planning ménage
   
3. Tout doit fonctionner EXACTEMENT comme avant
```

---

## 🚀 PROCHAINE ÉTAPE : PHASE 2

Une fois Phase 1 OK, vous pourrez passer à :
- **Phase 2** : Ajouter les colonnes organization_id et gite_id

Mais d'abord, **confirmez que Phase 1 est OK** !

---

## 📞 EN CAS DE PROBLÈME

### Erreur SQL ?
→ Copiez le message d'erreur complet
→ Vérifiez que vous avez copié TOUT le script (du début à la fin)

### Tables non créées ?
→ Vérifiez les permissions (vous devez être owner)
→ Réessayez d'exécuter le script

### Site ne marche plus ?
→ Impossible ! Les nouvelles tables sont indépendantes
→ Mais vérifiez quand même dans le navigateur

---

## 🎯 CHECKLIST PHASE 1

```
☐ Backup Supabase fait
☐ SQL Editor ouvert
☐ Script 01 exécuté → ✅ Success
☐ Script 02 exécuté → ✅ Success  
☐ Script 03 exécuté → ✅ Success
☐ Vérification : 3 tables trouvées
☐ Site testé : fonctionne normalement
☐ ✅ PHASE 1 COMPLÈTE !
```

---

**Date** : 7 janvier 2026  
**Durée** : 10 minutes  
**Statut** : 🟢 En cours
