# 🚀 Guide Complet de Déploiement sur Vercel

## 📋 Prérequis

- ✅ Compte GitHub avec le repo `Gestion_gite-calvignac`
- ✅ Compte Vercel (gratuit) : [vercel.com](https://vercel.com)
- ✅ Compte Supabase configuré
- ✅ Compte OpenAI avec clé API

---

## 🎯 Étape 1 : Préparer le Projet

### 1.1 Vérifier les fichiers de configuration

Vérifiez que ces fichiers existent (✅ ils sont déjà présents) :

- [x] `vercel.json` - Configuration Vercel
- [x] `package.json` - Dépendances Node.js
- [x] `.env.example` - Modèle des variables d'environnement
- [x] `api/openai.js` - API serverless pour OpenAI
- [x] `api/webhooks/abritel.js` - Webhooks Abritel

### 1.2 Mettre à jour vercel.json

Le fichier `vercel.json` est déjà configuré correctement :

```json
{
  "version": 2,
  "name": "gestion-gite-calvignac",
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/webhooks/abritel",
      "dest": "/api/webhooks/abritel.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

---

## 🌐 Étape 2 : Déployer sur Vercel

### Option A : Via l'Interface Web (Recommandé pour la 1ère fois)

#### 2.1 Connexion et Import

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **Sign Up** ou **Log in**
3. Choisissez **Continue with GitHub**
4. Autorisez Vercel à accéder à vos repos

#### 2.2 Importer le Projet

1. Cliquez sur **Add New...** → **Project**
2. Trouvez `gitewelcomehome-png/Gestion_gite-calvignac`
3. Cliquez sur **Import**

#### 2.3 Configuration du Projet

**Framework Preset** : `Other` (pas de framework)

**Root Directory** : `.` (racine)

**Build Command** : (laisser vide)

**Output Directory** : (laisser vide)

**Install Command** : `npm install`

#### 2.4 Variables d'Environnement (IMPORTANT)

Avant de déployer, cliquez sur **Environment Variables** et ajoutez :

| Name | Value | Environments |
|------|-------|--------------|
| `SUPABASE_URL` | `https://ivqiisnudabxemcxxyru.supabase.co` | All |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | All |
| `OPENAI_API_KEY` | `sk-proj-7cOzmwkrVrq_ynXTpVXcXv7bKyDmy78...` | All |
| `TIMEZONE` | `Europe/Paris` | All |

> **⚠️ CRITIQUE** : Utilisez **votre vraie clé OpenAI** fournie précédemment

#### 2.5 Déployer

1. Cliquez sur **Deploy**
2. Attendez ~2 minutes
3. Cliquez sur **Visit** quand c'est terminé ✅

---

### Option B : Via CLI (Pour les déploiements suivants)

#### 2.1 Installer Vercel CLI

```bash
npm i -g vercel
```

#### 2.2 Login

```bash
vercel login
```

Suivez les instructions (vérification par email).

#### 2.3 Premier Déploiement

```bash
cd /workspaces/Gestion_gite-calvignac
vercel
```

Répondez aux questions :
```
? Set up and deploy "~/Gestion_gite-calvignac"? [Y/n] y
? Which scope do you want to deploy to? [Votre compte]
? Link to existing project? [N/y] n
? What's your project's name? gestion-gite-calvignac
? In which directory is your code located? ./
```

#### 2.4 Ajouter les Variables d'Environnement

```bash
# Supabase URL
vercel env add SUPABASE_URL
# Coller : https://ivqiisnudabxemcxxyru.supabase.co
# Sélectionner : Production, Preview, Development

# Supabase Key (clé anon publique)
vercel env add SUPABASE_KEY
# Coller la clé anon complète
# Sélectionner : Production, Preview, Development

# OpenAI API Key
vercel env add OPENAI_API_KEY
# Coller : sk-proj-7cOzmwkrVrq_ynXTpVXcXv7bKyDmy78...
# Sélectionner : Production, Preview, Development

# Timezone
vercel env add TIMEZONE
# Coller : Europe/Paris
# Sélectionner : Production, Preview, Development
```

#### 2.5 Déployer en Production

```bash
vercel --prod
```

---

## ✅ Étape 3 : Vérification

### 3.1 Tester le Site

1. Ouvrez l'URL fournie (ex: `https://gestion-gite-calvignac.vercel.app`)
2. Vérifiez que la page d'accueil s'affiche
3. Testez la connexion (si vous avez un compte)

### 3.2 Tester l'API OpenAI

1. Allez dans **Info Gîtes**
2. Cliquez sur un bouton **✨** (étoile magique)
3. Entrez des mots-clés : `boîte à clés code 1234`
4. Cliquez sur **Générer**
5. ✅ Un texte structuré doit apparaître

### 3.3 Tester Supabase

1. Essayez de vous connecter
2. Créez/modifiez une fiche gîte
3. Vérifiez que les données s'enregistrent

### 3.4 Vérifier les Logs

Sur Vercel :
1. Allez dans **Deployments** → dernier déploiement
2. Cliquez sur **Functions**
3. Sélectionnez `/api/openai`
4. Vous devez voir les logs des requêtes

---

## 🔧 Étape 4 : Configuration Domaine (Optionnel)

### 4.1 Domaine Personnalisé

Si vous avez un domaine (ex: `gites-calvignac.fr`) :

1. Allez dans **Settings** → **Domains**
2. Cliquez sur **Add**
3. Entrez votre domaine
4. Suivez les instructions DNS

### 4.2 Configuration DNS

Chez votre registrar (OVH, Gandi, etc.) :

**Type A** :
```
@ → 76.76.21.21
```

**Type CNAME** :
```
www → cname.vercel-dns.com
```

---

## 📊 Étape 5 : Monitoring

### 5.1 Vérifier les Performances

- **Analytics** : Dashboard Vercel
- **Logs** : Functions → Logs en temps réel
- **Erreurs** : Onglet **Issues**

### 5.2 Monitoring OpenAI

- Allez sur [platform.openai.com/usage](https://platform.openai.com/usage)
- Consultez la consommation
- Définissez une limite mensuelle (ex: 10€/mois)

### 5.3 Monitoring Supabase

- Dashboard Supabase → **Database** → **Logs**
- Vérifiez les requêtes SQL
- Consultez l'utilisation de la base

---

## 🔄 Déploiements Suivants

### Workflow Automatique (Git Push)

1. Faites vos modifications localement
2. Commit :
```bash
git add .
git commit -m "Description des changements"
```
3. Push :
```bash
git push origin main
```
4. ✅ Vercel déploie automatiquement !

### Déploiement Manuel

```bash
vercel --prod
```

---

## 🚨 Dépannage

### Erreur : "OPENAI_API_KEY is not defined"

**Solution** :
```bash
vercel env add OPENAI_API_KEY
# Recoller la clé
vercel --prod
```

### Erreur : "Supabase connection failed"

**Cause** : Variable `SUPABASE_URL` ou `SUPABASE_KEY` incorrecte

**Solution** :
1. Vérifiez sur Supabase Dashboard → Settings → API
2. Mettez à jour dans Vercel :
```bash
vercel env rm SUPABASE_URL
vercel env add SUPABASE_URL
```

### Site ne se charge pas

1. Vérifiez les logs : Vercel → Functions → Logs
2. Vérifiez la console navigateur (F12)
3. Testez l'URL de l'API : `https://votre-site.vercel.app/api/openai`

### Fonction Timeout

**Cause** : Fonction prend trop de temps (>10s gratuit, >60s Pro)

**Solution** :
- Optimiser les requêtes
- Passer à Vercel Pro si nécessaire

---

## 💰 Coûts Estimés

### Vercel
- **Gratuit** : 
  - 100 GB bandwidth/mois
  - 100 heures functions/mois
  - Domaine `.vercel.app` inclus
- **Pro (20$/mois)** :
  - 1 TB bandwidth
  - 1000 heures functions
  - Domaines personnalisés illimités

### OpenAI
- **GPT-4o-mini** : ~0,15€ pour 1000 générations
- **Budget recommandé** : 5-10€/mois pour usage normal

### Supabase
- **Gratuit** :
  - 500 MB base de données
  - 2 GB transfert/mois
  - 50 000 requêtes/mois
- Largement suffisant pour votre usage

---

## 📞 Support

### Ressources

- 📚 [Docs Vercel](https://vercel.com/docs)
- 📚 [Docs Supabase](https://supabase.com/docs)
- 📚 [Docs OpenAI](https://platform.openai.com/docs)

### Problèmes ?

1. ✅ Consultez les logs Vercel
2. ✅ Vérifiez les variables d'environnement
3. ✅ Testez chaque service individuellement
4. ✅ Consultez [status.vercel.com](https://status.vercel.com)

---

## ✅ Checklist Finale

- [ ] Compte Vercel créé
- [ ] Projet importé depuis GitHub
- [ ] Variables d'environnement configurées :
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `TIMEZONE`
- [ ] Premier déploiement réussi
- [ ] Site accessible via URL Vercel
- [ ] Test IA fonctionnel (bouton ✨)
- [ ] Test Supabase fonctionnel (connexion)
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Auto-deploy configuré (Git push)
- [ ] Monitoring OpenAI activé
- [ ] Limites de dépenses définies

---

## 🎉 Résultat Final

Votre site sera disponible sur :
- **URL Vercel** : `https://gestion-gite-calvignac.vercel.app`
- **Domaine custom** (si configuré) : `https://votre-domaine.fr`

Avec :
- ✅ Déploiement automatique à chaque push Git
- ✅ HTTPS activé automatiquement
- ✅ CDN mondial (performances optimales)
- ✅ API OpenAI sécurisée côté serveur
- ✅ Supabase configuré et fonctionnel
- ✅ Webhooks Abritel prêts
- ✅ Zero downtime lors des déploiements

---

**Date de création** : 29 Janvier 2026  
**Auteur** : Assistant IA  
**Version** : 1.0
