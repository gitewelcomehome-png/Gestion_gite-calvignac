# 🔄 GUIDE COMPLET - ONBOARDING FONCTIONNEL

## ⚠️ IMPORTANT : Suivre dans l'ordre

---

## ÉTAPE 1 : Supprimer le projet Supabase actuel

1. Va sur https://supabase.com/dashboard
2. Clique sur ton projet `gestion-gite-prod`
3. **Settings** (⚙️) → Scroll en bas → **"Danger Zone"** (rouge)
4. **"Delete project"** → Tape le nom → Confirme

✅ **Résultat** : Projet corrompu supprimé

---

## ÉTAPE 2 : Créer UN NOUVEAU projet

1. Dashboard → **"New Project"**
2. Configuration :
   ```
   Name:     gestion-gite-prod-v2
   Password: [MOT DE PASSE FORT - LE NOTER]
   Region:   Europe (Frankfurt) - eu-central-1
   ```
3. **"Create new project"**
4. ⏱️ **Attendre 2-3 minutes** (provisioning)

✅ **Résultat** : Projet neuf, cache propre

---

## ÉTAPE 3 : Récupérer les credentials

1. **Settings** → **API**
2. Noter :
   ```
   Project URL:     https://XXXXX.supabase.co
   anon public key: eyJ...
   ```

---

## ÉTAPE 4 : Mettre à jour config.local.js

```javascript
window.LOCAL_CONFIG = {
    SUPABASE_URL: 'https://NOUVEAU-ID.supabase.co',  // ← ICI
    SUPABASE_KEY: 'eyJ...NOUVELLE...KEY...'           // ← ICI
};
```

**Sauvegarder** : Ctrl+S

---

## ÉTAPE 5 : Exécuter le nouveau schéma

1. **SQL Editor** → **"New query"**
2. **Copier TOUT le fichier** : `sql/fresh-start/01_schema_clean.sql`
3. **Coller** et **"Run"**
4. Vérifier le message : `✅ SCHEMA CRÉÉ AVEC SUCCÈS`
5. ⏱️ **ATTENDRE 30 SECONDES** (cache PostgREST)

✅ **Résultat** : 4 tables + RLS + Policies opérationnels

---

## ÉTAPE 6 : Tester l'onboarding

1. Ouvrir : http://localhost:8000/onboarding.html
2. **Hard refresh** : `Ctrl+Shift+R` (ou `Cmd+Shift+R`)
3. **Console** : F12
4. Vérifier : `✅ Client Supabase initialisé`

### Étape 1 - Créer compte
```
Email:         test@example.com
Mot de passe:  Test123456!
Confirmer:     Test123456!
```
→ Cliquer **"Continuer"**
→ Console doit afficher : `✅ Compte créé`

### Étape 2 - Organization
```
Nom:           Mon Entreprise Test
Email:         contact@test.fr
Téléphone:     +33 6 12 34 56 78
```
→ Cliquer **"Continuer"**

### Étape 3 - Ajouter gîtes

**Gîte 1:**
```
Nom:           Gîte du Lac
Icône:         [Choisir "chalet"]
Couleur:       [Bleu]
Capacité:      6
Adresse:       123 Route du Lac, 46170 Calvignac
```
→ **"Ajouter un gîte"**

**Gîte 2:**
```
Nom:           Chalet Montagne  
Icône:         [Choisir "cabin"]
Couleur:       [Vert]
Capacité:      8
Adresse:       456 Chemin de la Forêt
```
→ **"Terminer la configuration"**

### Étape 4 - Succès
- Message de succès ✅
- Redirection auto après 2s

---

## ÉTAPE 7 : Vérifier les données

Dans Supabase **SQL Editor**, copier-coller : `sql/fresh-start/02_test_data.sql`

**Résultat attendu :**
- ✅ 1 organization
- ✅ 2 gîtes
- ✅ 1 member (role='owner')
- ✅ RLS enabled sur toutes les tables

---

## ✅ CHECKLIST FINALE

- [ ] Ancien projet supprimé
- [ ] Nouveau projet créé
- [ ] Credentials mis à jour dans config.local.js
- [ ] Schéma exécuté (01_schema_clean.sql)
- [ ] Attendu 30 secondes
- [ ] Onboarding testé : Compte créé
- [ ] Onboarding testé : Organization créée
- [ ] Onboarding testé : 2 gîtes ajoutés
- [ ] Onboarding testé : Redirection dashboard
- [ ] Vérification SQL : Toutes les données présentes
- [ ] Console : Aucune erreur

---

## 🐛 SI PROBLÈME

### Erreur "Could not find X column"
→ **ATTENDRE 1 MINUTE** puis réessayer (cache PostgREST)

### Erreur "duplicate key value violates unique constraint"
→ Rechanger d'email de test (l'ancien est déjà pris)

### Erreur "new row violates check constraint"
→ Vérifier que les champs obligatoires sont remplis

### Autre erreur
→ Copier-coller l'erreur COMPLÈTE de la console + dire à quelle étape

---

## 📊 LOGS CONSOLE ATTENDUS

```
✅ Client Supabase initialisé
✅ Compte créé avec succès
🚀 Étape 1: Création organization...
✅ Organization créée: [UUID]
🚀 Étape 2: Création gîtes...
✅ 2 gîte(s) créé(s)
🚀 Étape 3: Création membership...
✅ Membership créé
🎉 ONBOARDING TERMINÉ AVEC SUCCÈS!
```

---

## ⏱️ TEMPS TOTAL ESTIMÉ

| Étape | Durée |
|-------|-------|
| Supprimer projet | 30s |
| Créer nouveau | 3 min |
| Update config | 1 min |
| Exécuter SQL | 1 min |
| Attendre | 30s |
| Tester onboarding | 3 min |
| Vérifier | 1 min |
| **TOTAL** | **10 minutes** |

---

## 🎯 APRÈS LE SUCCÈS

1. Tester un **2ème compte** pour vérifier l'isolation
2. Vérifier que le **dashboard** affiche les gîtes
3. **Commit** : `git add -A && git commit -m "✅ Onboarding fonctionnel validé"`
4. **JAMAIS ré-exécuter le schéma SQL** sur ce projet

---

## 💪 CETTE FOIS ÇA VA MARCHER

- Schéma ultra-simplifié
- Policies permissives pour onboarding
- Pas de RPC, pas de cache issues
- Code JavaScript clair avec logs
- Projet neuf = aucune corruption

**PRÊT ? On y va ! 🚀**
