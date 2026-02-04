# 🚀 Déploiement Assistant IA - Guide Rapide

## ✅ Checklist de Déploiement

### Étape 1 : Créer un compte OpenAI
- [ ] Aller sur [platform.openai.com](https://platform.openai.com)
- [ ] Créer un compte ou se connecter
- [ ] Ajouter un moyen de paiement

### Étape 2 : Générer une clé API
- [ ] Aller dans **API Keys**
- [ ] Cliquer sur **Create new secret key**
- [ ] Nommer la clé : "Gestion Gites Production"
- [ ] **COPIER LA CLÉ** (vous ne pourrez plus la voir !)
- [ ] Format : `sk-proj-...` ou `sk-...`

### Étape 3 : Configurer Vercel
- [ ] Ouvrir [vercel.com](https://vercel.com)
- [ ] Sélectionner votre projet
- [ ] Aller dans **Settings**
- [ ] Aller dans **Environment Variables**
- [ ] Cliquer sur **Add New**

**Configuration :**
```
Name: OPENAI_API_KEY
Value: sk-proj-... (coller votre clé)
Environments: ✅ Production ✅ Preview ✅ Development
```

- [ ] Cliquer sur **Save**

### Étape 4 : Redéployer
- [ ] Aller dans **Deployments**
- [ ] Cliquer sur le dernier déploiement
- [ ] Cliquer sur les 3 points `⋯`
- [ ] Cliquer sur **Redeploy**
- [ ] Attendre la fin du déploiement (~1 minute)

### Étape 5 : Tester
- [ ] Ouvrir votre site en production
- [ ] Se connecter
- [ ] Aller dans **Infos Gîtes**
- [ ] Cliquer sur un bouton **✨**
- [ ] Entrer des mots-clés : `boîte à clés code 1234`
- [ ] Cliquer sur **Générer**
- [ ] Vérifier que le texte est généré ✅

---

## 💰 Configurer les Limites de Coût

### Sur OpenAI Platform :

1. Aller sur [platform.openai.com/settings/limits](https://platform.openai.com/settings/limits)
2. **Hard limit** (arrêt automatique) : 20-50€/mois
3. **Soft limit** (notification) : 10€/mois
4. **Notification email** : ✅ Activer

---

## 📊 Monitoring

### Surveiller les coûts
- [Usage Dashboard](https://platform.openai.com/usage)
- Mettre une alerte email à 10€

### Surveiller l'API
- Vercel Dashboard → Functions → `/api/openai`
- Vérifier les logs d'erreurs

---

## 🔒 Sécurité Post-Déploiement

### Restreindre le CORS (Recommandé)

Éditer `/api/openai.js` ligne 11 :

```javascript
// AVANT (permissif)
res.setHeader('Access-Control-Allow-Origin', '*');

// APRÈS (sécurisé - remplacer par votre domaine)
res.setHeader('Access-Control-Allow-Origin', 'https://votredomaine.com');
```

### Activer Rate Limiting (Optionnel)

Ajouter dans `/api/openai.js` :

```javascript
// Au début du fichier
const rateLimits = new Map();

// Dans la fonction handler, avant try/catch
const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
const now = Date.now();
const userLimits = rateLimits.get(ip) || { count: 0, resetTime: now + 60000 };

if (now > userLimits.resetTime) {
    userLimits.count = 0;
    userLimits.resetTime = now + 60000;
}

if (userLimits.count >= 10) { // 10 requêtes/minute
    return res.status(429).json({ error: 'Trop de requêtes, réessayez dans 1 minute' });
}

userLimits.count++;
rateLimits.set(ip, userLimits);
```

---

## ❓ Dépannage

### "API OpenAI non configurée"

**Cause** : Variable d'environnement manquante

**Solution** :
1. Vérifier que `OPENAI_API_KEY` existe dans Vercel
2. Vérifier qu'elle est cochée pour "Production"
3. Redéployer l'application

### "Invalid API key"

**Cause** : Clé incorrecte ou révoquée

**Solution** :
1. Générer une nouvelle clé sur OpenAI
2. Mettre à jour dans Vercel
3. Redéployer

### "Rate limit exceeded"

**Cause** : Trop de requêtes vers OpenAI

**Solution** :
1. Augmenter les limites dans OpenAI Platform
2. Ajouter du crédit
3. Implémenter du rate limiting (voir ci-dessus)

### "Function timeout"

**Cause** : OpenAI prend trop de temps à répondre

**Solution** :
1. Augmenter le timeout dans `vercel.json` :

```json
{
  "functions": {
    "api/openai.js": {
      "maxDuration": 30
    }
  }
}
```

---

## 📞 Support

En cas de problème persistant :

1. ✅ Vérifier les logs Vercel Functions
2. ✅ Vérifier le crédit OpenAI restant
3. ✅ Tester manuellement avec curl (voir README_AI_ARCHITECTURE.md)
4. ✅ Consulter [status.openai.com](https://status.openai.com)

---

## 🎯 Résumé

Une fois configuré :
- ✅ Aucune configuration utilisateur nécessaire
- ✅ Assistant IA disponible pour tous
- ✅ Vous contrôlez les coûts
- ✅ Sécurisé et centralisé

**Budget estimé** : 5-20€/mois selon usage

---

Bon déploiement ! 🚀
