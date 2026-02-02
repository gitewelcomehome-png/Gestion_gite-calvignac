# 🚀 Guide Déploiement Vercel - Webhook Abritel

## 📋 Prérequis

- ✅ Compte Vercel (gratuit) : https://vercel.com/signup
- ✅ Compte GitHub connecté à Vercel
- ✅ Repository GitHub actuel : `Gestion_gite-calvignac`

---

## 🎯 Étape 1 : Préparer les Fichiers (✅ DÉJÀ FAIT)

Les fichiers suivants ont été créés :
- ✅ `api/webhooks/abritel.js` - Endpoint webhook
- ✅ `vercel.json` - Configuration Vercel
- ✅ `package.json` - Dépendances Node.js
- ✅ `.vercelignore` - Fichiers à ignorer

---

## 🔧 Étape 2 : Installer Vercel CLI

### Option A : Via NPM (Recommandé)
```bash
npm install -g vercel
```

### Option B : Via le Terminal (si NPM pas dispo)
```bash
curl -sf https://vercel.com/install | sh
```

### Vérifier l'installation
```bash
vercel --version
```

---

## 🔐 Étape 3 : Se Connecter à Vercel

```bash
vercel login
```

**Choisissez** : GitHub (recommandé)
**Autorisez** : L'accès au repository

---

## 📦 Étape 4 : Configurer les Variables d'Environnement

### Sur le Dashboard Vercel

1. **Allez sur** : https://vercel.com/dashboard
2. **Cliquez sur** : Votre projet (ou créez-le)
3. **Allez dans** : Settings → Environment Variables
4. **Ajoutez** :

```env
SUPABASE_URL = https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY = votre_service_role_key_supabase
ABRITEL_WEBHOOK_SECRET = [sera fourni par Expedia après inscription]
```

### Comment Trouver vos Credentials Supabase ?

1. **Allez sur** : https://supabase.com/dashboard
2. **Sélectionnez** : Votre projet
3. **Allez dans** : Settings → API
4. **Copiez** :
   - **URL** : Project URL
   - **Key** : `service_role` (secret) ⚠️ PAS la `anon` key

---

## 🚀 Étape 5 : Déployer sur Vercel

### Option A : Via CLI (Recommandé)

```bash
# Depuis le dossier du projet
cd /workspaces/Gestion_gite-calvignac

# Premier déploiement
vercel

# Suivre les instructions :
# - Set up and deploy? → Yes
# - Which scope? → [Votre compte]
# - Link to existing project? → No (première fois)
# - Project name? → gestion-gite-calvignac
# - In which directory? → ./ (racine)
# - Want to override settings? → No

# Déploiement production
vercel --prod
```

### Option B : Via GitHub (Automatique)

1. **Pushez vos fichiers** sur GitHub
```bash
git add .
git commit -m "Add Vercel webhook endpoint for Abritel"
git push origin main
```

2. **Sur Vercel Dashboard** :
   - Cliquez sur **"New Project"**
   - **Import** : Sélectionnez `Gestion_gite-calvignac`
   - **Configure** : Laissez les paramètres par défaut
   - **Add Environment Variables** : (voir étape 4)
   - **Deploy** : Cliquez sur Deploy

---

## 🔗 Étape 6 : Récupérer Votre URL

Après déploiement, vous obtenez :

```
✅ Deployment URL : https://gestion-gite-calvignac.vercel.app
✅ Webhook URL : https://gestion-gite-calvignac.vercel.app/api/webhooks/abritel
```

**Copiez cette URL** - Vous en aurez besoin pour configurer Abritel !

---

## 🧪 Étape 7 : Tester le Webhook

### Test Local
```bash
curl -X POST https://gestion-gite-calvignac.vercel.app/api/webhooks/abritel \
  -H "Content-Type: application/json" \
  -d '{"event_type":"ping","message":"test"}'
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Webhook actif"
}
```

### Voir les Logs

**Sur Vercel Dashboard** :
- Allez dans : Deployments → [Votre déploiement] → Functions
- Cliquez sur : `api/webhooks/abritel`
- **Logs en temps réel** s'affichent

---

## 🔒 Étape 8 : Sécuriser (Après Config Abritel)

Une fois que vous avez configuré le webhook sur Expedia, ils vous fourniront un **Webhook Secret**.

**Ajoutez-le** dans Vercel :
```
ABRITEL_WEBHOOK_SECRET = secret_fourni_par_expedia
```

Le code vérifiera automatiquement la signature des webhooks.

---

## 📊 Étape 9 : Monitoring

### Logs Vercel
```bash
vercel logs gestion-gite-calvignac --follow
```

### Dashboard Vercel
- **Deployments** : Historique déploiements
- **Analytics** : Trafic et performances
- **Functions** : Logs des webhooks

### Supabase Logs
- Vérifier les insertions dans table `reservations`
- Logs SQL en temps réel

---

## 🎯 Résumé : Votre Checklist

- [ ] Vercel CLI installé
- [ ] Connecté à Vercel (`vercel login`)
- [ ] Variables d'environnement configurées
- [ ] Déployé sur Vercel (`vercel --prod`)
- [ ] URL webhook récupérée : `https://....vercel.app/api/webhooks/abritel`
- [ ] Test ping réussi
- [ ] Logs accessibles

---

## 🔗 Votre URL Finale

**Format** :
```
https://gestion-gite-calvignac-[random].vercel.app/api/webhooks/abritel
```

Ou avec domaine custom (optionnel) :
```
https://api.welcomehome.fr/webhooks/abritel
```

---

## 🆘 Problèmes Courants

### Erreur "Module not found: @supabase/supabase-js"
```bash
# Installer les dépendances
npm install
# Redéployer
vercel --prod
```

### Erreur "Environment variable not found"
- Vérifier les variables dans Vercel Dashboard
- Format exact : `SUPABASE_URL` (sensible à la casse)
- Redéployer après ajout

### Erreur 500 sur webhook
- Vérifier les logs Vercel
- Vérifier connexion Supabase
- Tester les credentials manuellement

---

## 📞 Support

**Vercel** : https://vercel.com/support
**Documentation** : https://vercel.com/docs

---

**Prochaine étape** : Configurer cette URL dans le Developer Hub Expedia ! 🎯
