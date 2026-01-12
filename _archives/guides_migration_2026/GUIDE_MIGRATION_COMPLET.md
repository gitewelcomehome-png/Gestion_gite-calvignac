# 🔄 Guide Complet : Migration vers Nouveau Projet Supabase

## ⚠️ ÉTAPE 1 : Supprimer le projet corrompu

### 1.1 Se connecter à Supabase
1. Aller sur https://supabase.com/dashboard
2. Se connecter avec votre compte

### 1.2 Identifier le projet corrompu
1. Dans la liste des projets, repérer celui utilisé actuellement
2. Vérifier l'URL dans `config.local.js` pour être sûr
3. **Note importante** : Une fois supprimé, c'est irréversible

### 1.3 Supprimer le projet
1. Cliquer sur le projet corrompu
2. Aller dans **Settings** (⚙️ en bas à gauche)
3. Scroll tout en bas → Section **"Danger Zone"** (zone rouge)
4. Cliquer sur **"Delete project"**
5. Taper le nom du projet pour confirmer
6. Cliquer sur **"I understand, delete this project"**

⏱️ **Temps nécessaire** : 30 secondes
✅ **Résultat** : Projet supprimé, cache corrompu éliminé

---

## 🆕 ÉTAPE 2 : Créer le nouveau projet

### 2.1 Nouveau projet
1. Retour au dashboard : https://supabase.com/dashboard
2. Cliquer sur **"New Project"** (bouton vert)

### 2.2 Configuration
```
Name:           gestion-gite-prod
Database Password: [CHOISIR UN MOT DE PASSE FORT - LE NOTER !]
Region:         Europe (Frankfurt) - eu-central-1
                OU closest to your location
Pricing Plan:   Free (pour test)
```

3. Cliquer sur **"Create new project"**
4. ⏱️ Attendre 2-3 minutes (provisioning...)

### 2.3 Récupérer les credentials
Une fois le projet créé :

1. Aller dans **Settings** → **API**
2. Noter quelque part :
   ```
   Project URL:     https://XXXXXXXX.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
   ```

⏱️ **Temps nécessaire** : 3-4 minutes
✅ **Résultat** : Nouveau projet opérationnel avec cache propre

---

## 🔧 ÉTAPE 3 : Mettre à jour la configuration locale

### 3.1 Ouvrir le fichier de config
```bash
code config.local.js
```

### 3.2 Remplacer les credentials
**AVANT :**
```javascript
window.SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://OLD-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...OLD...KEY...'
};
```

**APRÈS :**
```javascript
window.SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://NOUVEAU-PROJECT-ID.supabase.co',  // ← Nouveau
  SUPABASE_ANON_KEY: 'eyJ...NOUVEAU...KEY...'               // ← Nouveau
};
```

### 3.3 Sauvegarder
- **Ctrl+S** (ou Cmd+S sur Mac)
- ⚠️ **NE PAS COMMIT** config.local.js (déjà dans .gitignore)

⏱️ **Temps nécessaire** : 1 minute
✅ **Résultat** : Application configurée pour nouveau projet

---

## 📊 ÉTAPE 4 : Créer le schéma de la base de données

### 4.1 Ouvrir SQL Editor
1. Dans votre nouveau projet Supabase
2. Cliquer sur **"SQL Editor"** (icône </> à gauche)
3. Cliquer sur **"New query"**

### 4.2 Copier le schéma
1. Ouvrir dans VS Code : `sql/multi-tenant/00_reset_and_create_clean.sql`
2. **Sélectionner TOUT** : Ctrl+A (ou Cmd+A)
3. **Copier** : Ctrl+C (ou Cmd+C)

### 4.3 Exécuter le script
1. Dans Supabase SQL Editor, **coller** le script : Ctrl+V
2. Cliquer sur **"Run"** (ou F5)
3. ⏱️ Attendre 2-3 secondes
4. Vérifier le message de succès :
   ```
   ✅ BASE DE DONNÉES RÉINITIALISÉE ET RECRÉÉE
   ```

### 4.4 ⚠️ IMPORTANT
**NE JAMAIS ré-exécuter ce script !**
- Si vous devez modifier le schéma plus tard → créer un nouveau script de migration
- Réexécuter = risque de corrompre le cache à nouveau

⏱️ **Temps nécessaire** : 2 minutes
✅ **Résultat** : 9 tables créées, 36 index, fonctions RPC, cache synchronisé

---

## 🧪 ÉTAPE 5 : Vérifier que tout fonctionne

### 5.1 Vérifier les tables
Dans Supabase SQL Editor, nouvelle query :

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Résultat attendu :**
```
cleaning_reports
cleaning_schedule
expenses
gites
linen_stocks
organization_members
organizations
practical_info
reservations
```

### 5.2 Vérifier la fonction
```sql
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname = 'insert_onboarding_data';
```

**Résultat attendu :**
```
insert_onboarding_data | 6
```

⏱️ **Temps nécessaire** : 1 minute
✅ **Résultat** : Base de données opérationnelle et complète

---

## 🎯 ÉTAPE 6 : Tester l'onboarding complet

### 6.1 Vider le cache navigateur
1. Ouvrir l'application : http://localhost:8000/onboarding.html
2. **Hard refresh** : Ctrl+Shift+R (ou Cmd+Shift+R)
3. Ouvrir la console : F12
4. Vérifier le message : `✅ Client Supabase initialisé avec succès`

### 6.2 Étape 1 : Créer le compte
```
Email:              test@example.com
Mot de passe:       Test123456!
Confirmer:          Test123456!
```
- Cliquer sur **"Continuer"**
- Console doit afficher : `✅ Compte créé avec succès`

### 6.3 Étape 2 : Organisation
```
Nom:                Mon Entreprise Test
Email:              contact@test.fr
Téléphone:          +33 6 12 34 56 78
```
- Cliquer sur **"Continuer"**
- Console doit afficher : `✅ Organisation créée`

### 6.4 Étape 3 : Ajouter des gîtes

**Gîte 1 :**
```
Nom:                Gîte du Lac
Icône:              [Choisir "chalet" dans la grille]
Couleur:            [Choisir bleu]
Capacité:           6
Adresse:            123 Route du Lac, 46170 Calvignac
```
- Cliquer sur **"Ajouter un gîte"**

**Gîte 2 :**
```
Nom:                Chalet Montagne
Icône:              [Choisir "cabin"]
Couleur:            [Choisir vert]
Capacité:           8
Adresse:            456 Chemin de la Forêt, 46170 Calvignac
```
- Cliquer sur **"Terminer la configuration"**

### 6.5 Étape 4 : Succès
- Message de succès doit s'afficher
- Redirection automatique vers le dashboard après 2 secondes

⏱️ **Temps nécessaire** : 4 minutes
✅ **Résultat** : Onboarding complet, données en base

---

## ✅ ÉTAPE 7 : Vérifier les données créées

### 7.1 Vérifier l'organisation
Dans Supabase SQL Editor :

```sql
SELECT id, name, slug, email, phone 
FROM organizations;
```

**Résultat attendu :**
```
id: [UUID]
name: Mon Entreprise Test
slug: mon-entreprise-test-XXXXXX (avec 6 caractères aléatoires)
email: contact@test.fr
phone: +33 6 12 34 56 78
```

### 7.2 Vérifier les gîtes
```sql
SELECT id, name, icon, color, capacity, address 
FROM gites;
```

**Résultat attendu :** 2 lignes
```
1. Gîte du Lac     | chalet | #... | 6 | 123 Route du Lac...
2. Chalet Montagne | cabin  | #... | 8 | 456 Chemin...
```

### 7.3 Vérifier le membre
```sql
SELECT 
    om.role,
    o.name as organization_name,
    u.email as user_email
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id;
```

**Résultat attendu :**
```
role: owner
organization_name: Mon Entreprise Test
user_email: test@example.com
```

⏱️ **Temps nécessaire** : 2 minutes
✅ **Résultat** : Toutes les données correctement insérées

---

## 🎉 ÉTAPE 8 : Tester le dashboard

### 8.1 Accéder au dashboard
- L'URL doit être : http://localhost:8000/index.html
- Vous devez voir :
  - Les 2 gîtes avec leurs **icônes SVG**
  - Leurs noms, capacités, adresses
  - Aucune erreur dans la console

### 8.2 Test de déconnexion/reconnexion
1. Ouvrir la console (F12)
2. Taper : `await window.supabaseClient.auth.signOut()`
3. Aller sur : http://localhost:8000/login.html
4. Se connecter avec :
   ```
   Email:        test@example.com
   Mot de passe: Test123456!
   ```
5. Vérifier que vous êtes redirigé vers le dashboard

⏱️ **Temps nécessaire** : 2 minutes
✅ **Résultat** : Application entièrement fonctionnelle

---

## 📋 CHECKLIST FINALE

Cocher chaque élément une fois vérifié :

- [ ] Ancien projet Supabase supprimé
- [ ] Nouveau projet créé
- [ ] Credentials copiés et enregistrés
- [ ] config.local.js mis à jour
- [ ] Schéma SQL exécuté (1 seule fois)
- [ ] 9 tables créées (vérifiées)
- [ ] Fonction insert_onboarding_data existe
- [ ] Onboarding Step 1 : Compte créé
- [ ] Onboarding Step 2 : Organisation créée
- [ ] Onboarding Step 3 : 2 gîtes ajoutés
- [ ] Onboarding Step 4 : Redirection dashboard
- [ ] SQL : 1 organisation en base
- [ ] SQL : 2 gîtes en base
- [ ] SQL : 1 membre avec role='owner'
- [ ] Dashboard affiche les gîtes avec icônes SVG
- [ ] Aucune erreur dans la console
- [ ] Login/logout fonctionne

---

## ⚠️ SI UN PROBLÈME SURVIENT

### Problème : Erreur PGRST204 (cache)
**Solution** : Attendre 5 minutes après création du schéma, réessayer

### Problème : Credentials invalides
**Solution** : Vérifier dans Supabase Settings → API que URL et anon key sont corrects

### Problème : Fonction non trouvée
**Solution** : Ré-exécuter UNIQUEMENT cette partie du script :
```sql
-- Lignes 457-485 de 00_reset_and_create_clean.sql
CREATE OR REPLACE FUNCTION insert_onboarding_data(...)
GRANT EXECUTE ON FUNCTION insert_onboarding_data TO authenticated;
```

### Problème : RLS bloque l'accès
**Solution temporaire** :
```sql
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE gites DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
```
(Réactiver après tests)

---

## 🚀 TEMPS TOTAL ESTIMÉ

| Étape | Durée |
|-------|-------|
| 1. Supprimer ancien projet | 30 sec |
| 2. Créer nouveau projet | 3-4 min |
| 3. Mettre à jour config | 1 min |
| 4. Exécuter schéma SQL | 2 min |
| 5. Vérifications SQL | 1 min |
| 6. Test onboarding complet | 4 min |
| 7. Vérifier données | 2 min |
| 8. Test dashboard | 2 min |
| **TOTAL** | **15-16 minutes** |

---

## ✅ SUCCÈS ATTENDU

Si tout fonctionne :
- ✅ Onboarding complet sans erreur
- ✅ Toutes les données en base
- ✅ Dashboard affiche correctement les gîtes avec icônes SVG
- ✅ Console sans erreur
- ✅ Application prête pour multi-tenant

---

## 📝 APRÈS LE SUCCÈS

1. **Activer RLS** (sécurité) :
   ```sql
   ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
   ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
   ```

2. **Tester multi-tenant** : Créer un 2ème compte, vérifier l'isolation

3. **Déploiement production** : Configurer variables d'environnement avec nouveaux credentials

4. **Documentation** : Noter quelque part vos nouveaux credentials de manière sécurisée
