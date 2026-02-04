# 🔐 Configuration API - Channel Manager

## Variables d'Environnement Requises

Ajoutez ces variables dans **Vercel** ou votre fichier `.env` :

### 🤖 OpenAI (GPT-4 + DALL-E 3)
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxx
```
👉 Obtenez votre clé : https://platform.openai.com/api-keys

### 🧠 Anthropic Claude (Optionnel)
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
```
👉 Obtenez votre clé : https://console.anthropic.com/

### 📘 Meta Business Suite (Facebook + Instagram)
```bash
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_ACCESS_TOKEN=your-long-lived-token
META_PAGE_ID=your-page-id
META_IG_ACCOUNT_ID=your-instagram-business-id
```
👉 Configuration : https://developers.facebook.com/apps/

**Étapes :**
1. Créer une app Facebook
2. Activer Instagram Basic Display + Instagram Content Publishing
3. Obtenir un Page Access Token (long-lived)
4. Lier votre compte Instagram Business à votre Page Facebook

### 💼 LinkedIn API
```bash
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_ACCESS_TOKEN=your-access-token
LINKEDIN_PERSON_URN=urn:li:person:XXXXX
```
👉 Configuration : https://www.linkedin.com/developers/apps

**Scopes requis :** `w_member_social`, `r_basicprofile`

### 🐦 X (Twitter) API
```bash
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
TWITTER_BEARER_TOKEN=your-bearer-token
```
👉 Configuration : https://developer.twitter.com/

**Scopes requis :** `tweet.read`, `tweet.write`, `users.read`

### 🌐 URL de l'Application
```bash
APP_URL=https://your-domain.vercel.app
```

---

## 🚀 Déploiement sur Vercel

### 1. Ajouter les Variables
```bash
vercel env add OPENAI_API_KEY
# Entrer la clé quand demandé

vercel env add META_ACCESS_TOKEN
# etc...
```

### 2. Redéployer
```bash
vercel --prod
```

---

## 🧪 Tester en Local

Créer `.env.local` :
```bash
OPENAI_API_KEY=sk-proj-xxx
META_ACCESS_TOKEN=xxx
# etc...
```

Lancer :
```bash
vercel dev
```

---

## 📊 Coûts Estimés

| Service | Coût Moyen | Notes |
|---------|------------|-------|
| **GPT-4** | ~$0.03 / 1K tokens | ~$0.10 par génération |
| **DALL-E 3** | $0.04 par image HD | Qualité professionnelle |
| **Claude Opus** | ~$0.015 / 1K tokens | Alternative GPT-4 |
| **Meta API** | Gratuit | Jusqu'à 200 req/h |
| **LinkedIn API** | Gratuit | Limites standards |
| **Twitter API** | Gratuit (Basic) | 1500 posts/mois |

**💡 Budget mensuel estimé (100 générations) : ~$15-20**

---

## ✅ Vérifier la Configuration

Ouvrir la console navigateur après génération :
- ✅ Logs "OpenAI API success" → OK
- ❌ "API key not configured" → Manque variable Vercel
- ❌ "401 Unauthorized" → Clé invalide

---

## 🔒 Sécurité

- ✅ Clés API **UNIQUEMENT** côté serveur (Vercel Functions)
- ✅ Jamais dans le code frontend
- ✅ CORS restreint en production (`APP_URL` uniquement)
- ✅ Rate limiting sur les APIs

---

## 📞 Support

**Problème de configuration ?**
- Vérifier les variables dans Vercel Dashboard
- Tester en mode `vercel dev` localement
- Consulter logs : `vercel logs --follow`
