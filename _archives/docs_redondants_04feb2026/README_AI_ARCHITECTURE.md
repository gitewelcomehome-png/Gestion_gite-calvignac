# 🤖 Assistant IA - Architecture Centralisée

## 🎯 Vue d'ensemble

L'Assistant IA utilise une **architecture centralisée** :
- ✅ **Votre clé API** OpenAI est stockée côté serveur (Vercel)
- ✅ **Vous payez** pour tous les utilisateurs
- ✅ **Aucune configuration** nécessaire pour les utilisateurs
- ✅ **Sécurisé** - La clé n'est jamais exposée au frontend

---

## 📁 Fichiers

### `/api/openai.js`
Fonction serverless Vercel qui :
- Reçoit les demandes du frontend
- Appelle OpenAI avec votre clé (stockée en env)
- Retourne le contenu généré

### `/js/ai-assistant.js`
Module frontend qui :
- Affiche les boutons ✨ dans l'interface
- Collecte les mots-clés de l'utilisateur
- Appelle `/api/openai` (pas OpenAI directement)
- Insère le contenu généré dans les champs

### `/.env.example`
Template des variables d'environnement nécessaires.

### `/docs/CONFIGURATION_OPENAI_VERCEL.md`
Guide détaillé de configuration pour le propriétaire.

---

## 🚀 Configuration Rapide

### 1. Obtenir votre clé OpenAI
```bash
# 1. Allez sur https://platform.openai.com/api-keys
# 2. Créez une nouvelle clé secrète
# 3. Copiez-la (sk-proj-...)
```

### 2. Ajouter dans Vercel
```bash
# Via CLI
vercel env add OPENAI_API_KEY

# Ou via Dashboard Vercel:
# Settings → Environment Variables → Add
# Name: OPENAI_API_KEY
# Value: sk-proj-...
# Environments: Production + Preview + Development
```

### 3. Redéployer
```bash
vercel --prod
```

---

## 💰 Coûts

- **Modèle** : GPT-4o-mini
- **Estimation** : ~0,15€ pour 1000 générations
- **Budget recommandé** : 5-20€/mois selon usage

Surveillez : [platform.openai.com/usage](https://platform.openai.com/usage)

---

## 🔒 Sécurité

### ✅ Architecture sécurisée
- Clé API stockée côté serveur (Vercel Environment Variables)
- Jamais exposée au frontend
- Chiffrée au repos
- Accessible uniquement par la fonction serverless

### 🛡️ Protection recommandée
- Définir des limites de dépenses sur OpenAI
- Monitorer les logs Vercel Functions
- Ajouter rate limiting si nécessaire
- Restreindre CORS en production (modifier `/api/openai.js`)

---

## 🧪 Test Local

### 1. Créer `.env.local`
```bash
cp .env.example .env.local
# Éditer .env.local et ajouter votre clé OpenAI
```

### 2. Lancer Vercel Dev
```bash
vercel dev
```

### 3. Tester l'API
```bash
curl -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Décris une boîte à clés avec le code 1234", "maxTokens": 200}'
```

---

## 📊 Monitoring

### Logs Vercel
```
Dashboard Vercel → Functions → /api/openai
```

### Usage OpenAI
```
https://platform.openai.com/usage
```

### Métriques à surveiller
- Nombre d'appels/jour
- Coût moyen/appel
- Taux d'erreur
- Temps de réponse

---

## 🆘 Dépannage

### "API OpenAI non configurée"
→ Variable `OPENAI_API_KEY` manquante dans Vercel

### "Invalid API key"
→ Clé incorrecte ou révoquée, générer une nouvelle

### Erreurs 429 (Rate limit)
→ Trop de requêtes, augmenter les limites OpenAI

### Erreurs 500
→ Vérifier les logs dans Vercel Functions

---

## 📚 Documentation Complète

Consultez [CONFIGURATION_OPENAI_VERCEL.md](./docs/CONFIGURATION_OPENAI_VERCEL.md) pour le guide détaillé.
