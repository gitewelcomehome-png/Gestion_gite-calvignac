# 🚀 GUIDE D'EXÉCUTION - Phase 1 Sécurité

**Phase** : 1.1 - 1.3 (RLS + Authentification)  
**Durée estimée** : 2-3 heures pour l'exécution  
**Objectif** : Score 3/10 → 5/10

---

## ⚠️ AVANT DE COMMENCER

### Prérequis
- ✅ Branche `production/v5-stable` créée (point de restauration)
- ✅ Actuellement sur branche `security/phase1-rls-auth`
- ✅ Accès à Supabase Dashboard (SQL Editor)
- ✅ Accès admin à la base de données

### Sauvegardes
```bash
# Vérifier la branche de sauvegarde
git branch -a | grep production/v5-stable

# En cas de problème, revenir à v5
git checkout production/v5-stable
```

---

## 📋 ÉTAPES D'EXÉCUTION

### ÉTAPE 1: Diagnostic initial (5 min)

**Via Supabase Dashboard → SQL Editor**

```sql
-- Copier-coller le contenu de:
sql/security/00_diagnostic_rls.sql

-- Exécuter (F5 ou Run)
-- Noter les résultats:
-- - Nombre de tables sans RLS: ___
-- - Tables critiques non protégées: ___
```

**📝 Résultats attendus:**
- Liste de 15+ tables
- Probablement 0 tables avec RLS activé
- 8+ tables critiques identifiées

---

### ÉTAPE 2: Créer les politiques temporaires (10 min)

**⚠️ IMPORTANT: À faire AVANT d'activer RLS**

**Via Supabase Dashboard → SQL Editor**

```sql
-- Copier-coller le contenu de:
sql/security/02_policies_temp_authenticated.sql

-- Exécuter (F5)
```

**✅ Validation:**
```sql
-- Vérifier que les politiques sont créées
SELECT COUNT(*) FROM pg_policies 
WHERE policyname LIKE 'Temp:%';

-- Résultat attendu: 15+ politiques
```

---

### ÉTAPE 3: Activer RLS sur toutes les tables (10 min)

**Via Supabase Dashboard → SQL Editor**

```sql
-- Copier-coller le contenu de:
sql/security/01_enable_rls_all_tables.sql

-- Exécuter (F5)
```

**✅ Validation:**
```sql
-- Toutes les tables doivent avoir RLS activé
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Si 0, il y a un problème !
```

**🚨 Si ça ne fonctionne pas:**
```sql
-- Rollback: Désactiver RLS
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
-- Répéter pour chaque table
```

---

### ÉTAPE 4: Créer la table user_roles (5 min)

**Via Supabase Dashboard → SQL Editor**

```sql
-- Copier-coller le contenu de:
sql/security/03_create_user_roles_table.sql

-- Exécuter (F5)
```

**✅ Validation:**
```sql
-- Vérifier que la table existe
SELECT * FROM user_roles LIMIT 1;

-- Tester les fonctions
SELECT has_role('owner');
```

---

### ÉTAPE 5: Créer le premier utilisateur (10 min)

**Via Supabase Dashboard → Authentication → Users**

1. Cliquer sur "Add user" → "Create new user"
2. Email: `votre-email@example.com`
3. Password: `[mot de passe sécurisé]`
4. Auto Confirm User: ✅ (cocher)
5. Cliquer "Create user"
6. **Noter l'UUID de l'utilisateur créé**

**Puis via SQL Editor:**

```sql
-- Remplacer UUID_ICI par l'UUID copié ci-dessus
INSERT INTO user_roles (user_id, role)
VALUES (
    'UUID_ICI',  -- REMPLACER PAR VOTRE UUID
    'owner'
);

-- Vérifier
SELECT 
    u.email,
    ur.role
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id;
```

**📝 Exemple:**
```sql
-- Si votre UUID est: abc123def-456-789...
INSERT INTO user_roles (user_id, role)
VALUES (
    'abc123def-456-789-ghi-jkl012mno345',
    'owner'
);
```

---

### ÉTAPE 6: Tester l'authentification (15 min)

**1. Ouvrir login.html dans le navigateur**

```
http://localhost:5000/login.html
ou
https://votre-projet.vercel.app/login.html
```

**2. Se connecter avec:**
- Email: celui créé à l'étape 5
- Password: celui créé à l'étape 5

**✅ Comportement attendu:**
- ✅ Message "Connexion réussie"
- ✅ Redirection vers index.html
- ✅ Pas d'erreur dans la console

**❌ Si échec:**
- Vérifier les identifiants
- F12 → Console → Chercher les erreurs
- Vérifier que RLS est activé
- Vérifier que les politiques existent

**3. Tester l'accès direct sans login**

```
# Ouvrir en navigation privée
http://localhost:5000/index.html
```

**✅ Comportement attendu:**
- ✅ Redirection automatique vers /login.html
- ✅ Impossible d'accéder sans authentification

---

### ÉTAPE 7: Affiner les politiques RLS (20 min)

**⚠️ À faire SEULEMENT si l'authentification fonctionne**

**Via Supabase Dashboard → SQL Editor**

```sql
-- Copier-coller le contenu de:
sql/security/04_policies_by_role.sql

-- Exécuter (F5)
```

**✅ Validation:**
```sql
-- Vérifier les nouvelles politiques
SELECT 
    tablename,
    COUNT(*) as nb_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Chaque table doit avoir 1-3 politiques
```

---

### ÉTAPE 8: Tests fonctionnels (30 min)

**Avec compte Owner (créé à l'étape 5):**

1. **Dashboard** → ✅ Doit afficher les données
2. **Réservations** → ✅ Voir et ajouter des réservations
3. **Charges** → ✅ Voir et ajouter des charges
4. **Ménage** → ✅ Voir les retours ménage
5. **Fiches clients** → ✅ Accès complet

**Vérifier les erreurs:**
```javascript
// F12 → Console
// Ne doit PAS voir:
// - "row-level security policy"
// - "permission denied"
// - "authentication required"
```

---

### ÉTAPE 9: Créer un compte Cleaner (OPTIONNEL)

**Via Supabase Dashboard → Authentication → Users**

1. Créer un utilisateur: `femme.menage@example.com`
2. Noter l'UUID

```sql
-- Assigner le rôle cleaner
INSERT INTO user_roles (user_id, role)
VALUES (
    'UUID_FEMME_MENAGE',
    'cleaner'
);
```

**Tester avec ce compte:**
- ✅ Peut voir femme-menage.html
- ✅ Peut créer des retours ménage
- ❌ Ne peut PAS voir les charges
- ❌ Ne peut PAS voir la fiscalité

---

## 🎯 CHECKLIST FINALE

### SQL
- [ ] 00_diagnostic_rls.sql exécuté
- [ ] 02_policies_temp_authenticated.sql exécuté
- [ ] 01_enable_rls_all_tables.sql exécuté
- [ ] 03_create_user_roles_table.sql exécuté
- [ ] 04_policies_by_role.sql exécuté

### Authentification
- [ ] Utilisateur owner créé dans Supabase Auth
- [ ] Rôle owner assigné dans user_roles
- [ ] login.html fonctionne
- [ ] Connexion réussie
- [ ] Redirection vers index.html

### Tests
- [ ] index.html redirige vers login si non authentifié
- [ ] Dashboard s'affiche après connexion
- [ ] Toutes les fonctionnalités accessibles (owner)
- [ ] Pas d'erreur RLS dans la console
- [ ] Bouton déconnexion fonctionne

### Sécurité
- [ ] Toutes les tables ont RLS activé
- [ ] Politiques RLS en place
- [ ] Accès anonyme bloqué
- [ ] Rôles fonctionnent correctement

---

## 🚨 EN CAS DE PROBLÈME

### L'application ne fonctionne plus

```sql
-- ROLLBACK D'URGENCE: Désactiver RLS temporairement
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE charges DISABLE ROW LEVEL SECURITY;
ALTER TABLE retours_menage DISABLE ROW LEVEL SECURITY;
ALTER TABLE fiches_clients DISABLE ROW LEVEL SECURITY;
-- Répéter pour toutes les tables critiques
```

### Impossible de se connecter

1. Vérifier dans Supabase Dashboard → Authentication
   - L'utilisateur existe ?
   - Email confirmé ?

2. Vérifier dans SQL Editor:
```sql
-- L'utilisateur a un rôle ?
SELECT * FROM user_roles WHERE user_id = 'VOTRE_UUID';
```

3. Réinitialiser le mot de passe:
   - Dashboard → Authentication → Users
   - Cliquer sur l'utilisateur
   - "Send password recovery"

### Erreurs "permission denied"

```sql
-- Vérifier les politiques
SELECT * FROM pg_policies 
WHERE tablename = 'TABLE_EN_ERREUR';

-- Réactiver les politiques temporaires si besoin
DROP POLICY IF EXISTS "Owner et Admin - Accès complet" ON reservations;
CREATE POLICY "Temp: Auth complet" ON reservations
    FOR ALL USING (auth.uid() IS NOT NULL);
```

### Restaurer la version stable

```bash
# Revenir à la v5
git checkout production/v5-stable

# Ou créer une branche hotfix
git checkout -b hotfix/rollback-phase1 production/v5-stable
git push -u origin hotfix/rollback-phase1

# Redéployer sur Vercel
vercel --prod
```

---

## 📊 RÉSULTAT ATTENDU

### Avant Phase 1
- ❌ Aucune authentification
- ❌ RLS désactivé
- ❌ Accès public aux données
- **Score: 3/10**

### Après Phase 1
- ✅ Authentification obligatoire
- ✅ RLS activé partout
- ✅ Politiques par rôle
- ✅ Accès restreint
- **Score: 5/10**

---

## 🎯 PROCHAINE ÉTAPE

**Phase 2: Protection des secrets** (3-5 jours)
- Migrer les clés API vers variables d'environnement
- Créer .env.local
- Configurer Vercel env vars
- Régénérer les clés Supabase

---

**Durée totale Phase 1** : ~2-3 heures d'exécution + tests  
**Temps de développement** : ✅ Déjà fait (scripts prêts)  
**Commit** : En cours sur branche `security/phase1-rls-auth`

**Besoin d'aide ?** Relire le [PLAN_COMMERCIALISATION.md](documentation/PLAN_COMMERCIALISATION.md)
