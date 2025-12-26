# 🚀 INSTRUCTIONS DE DÉPLOIEMENT VERCEL

## ✅ Prérequis Complétés
- ✅ Fichiers HTML validés
- ✅ vercel.json configuré
- ✅ Dossier `vercel-deploy/` créé avec tous les fichiers

## 📁 Structure Déploiement
```
vercel-deploy/
├── index.html (454 Ko)        ← App principale
├── validation.html (29 Ko)    ← Validation ménages
└── vercel.json                ← Configuration
```

---

## 🔐 OPTION 1 : Déployer via Terminal (Recommandé)

### Étape 1 : Authentification Vercel
```bash
cd /workspaces/Gestion_gite-calvignac/vercel-deploy
vercel login
```
Cela ouvrira un navigateur pour vous connecter à Vercel.

### Étape 2 : Déploiement
```bash
# Déployer en production
vercel --prod
```

### Résultat
- URL de votre site en production
- Accès automatique à votre dashboard Vercel

---

## 🌐 OPTION 2 : Drag & Drop sur Vercel.com (Plus simple)

### Étape 1
1. Allez à https://vercel.com/
2. Connectez-vous à votre compte

### Étape 2
1. Cliquez **"Add New"** → **"Project"**
2. Sélectionnez **"Deploy from Git"** OU **"Upload from local"**

### Étape 3 : Upload local
1. Cliquez **"Upload"**
2. Glissez-déposez le dossier **`vercel-deploy/`**
3. Attendez 30-60 secondes

### Résultat
- Site en ligne automatiquement
- URL fournie

---

## 🔗 URL ACTUELLE
https://gestion-gites-dashboard.vercel.app/

**Si vous avez un projet Vercel existant**, lier le référentiel :
```bash
cd vercel-deploy
vercel link
vercel --prod
```

---

## ✨ Vérification Post-Déploiement

### Checklist
- [ ] Titre s'affiche : "🔧 GESTION GÎTES - VERSION CORRIGÉE 17 DÉC"
- [ ] Console F12 : Aucune erreur
- [ ] Page validation.html accessible
- [ ] Supabase connexion OK (check le dashboard)

### URL de test
```
https://[votre-url].vercel.app/validation.html
```

---

## 🆘 Dépannage

**Erreur "404 Not Found"**
- Vérifiez que vercel.json est présent
- Vérifiez que index.html est nommé exactement "index.html"

**Erreur connexion Supabase**
- Vérifiez vos clés dans index.html
- Console F12 > Network > cherchez erreurs d'API

**Site en blanc**
- Videz le cache (Ctrl+Shift+Del)
- Testez en mode navigation privée

---

## 📊 Statut Actuel
- **index.html**: ✅ 454 Ko, titre correct
- **validation.html**: ✅ 29 Ko, interface ménages OK
- **vercel.json**: ✅ Configuration cleanUrls active
- **Dossier déploiement**: ✅ Prêt à déployer

**Prochaine étape** : `vercel --prod` depuis `/vercel-deploy/`
