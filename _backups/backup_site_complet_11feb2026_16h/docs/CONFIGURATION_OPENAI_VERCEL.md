# 🚀 Configuration OpenAI dans Vercel

## 📋 Étapes de Configuration

### 1. Obtenir votre Clé API OpenAI

1. Allez sur [platform.openai.com](https://platform.openai.com/)
2. Créez un compte ou connectez-vous
3. Accédez à **API Keys** dans le menu
4. Cliquez sur **Create new secret key**
5. Donnez un nom (ex: "Gestion Gites Production")
6. **Copiez la clé** (format : `sk-proj-...` ou `sk-...`)
7. ⚠️ **Important** : Vous ne pourrez plus la voir après !

### 2. Ajouter dans Vercel

#### Via l'interface web :

1. Ouvrez votre projet sur [vercel.com](https://vercel.com)
2. Allez dans **Settings** → **Environment Variables**
3. Cliquez sur **Add New**
4. Remplissez :
   - **Name** : `OPENAI_API_KEY`
   - **Value** : `sk-proj-...` (collez votre clé)
   - **Environments** : Cochez tous (Production, Preview, Development)
5. Cliquez sur **Save**

#### Via la CLI Vercel (alternative) :

```bash
vercel env add OPENAI_API_KEY
# Collez votre clé quand demandé
# Sélectionnez tous les environnements
```

### 3. Redéployer l'Application

Pour que les changements prennent effet :

```bash
# Via CLI
vercel --prod

# Ou via l'interface Vercel
# Allez dans "Deployments" → "Redeploy"
```

---

## ✅ Vérification

Pour tester que l'API fonctionne :

1. Ouvrez votre site en production
2. Allez dans **Info Gîtes**
3. Cliquez sur un bouton **✨** à côté d'un champ
4. Entrez des mots-clés (ex: "boîte à clés code 1234")
5. Cliquez sur **Générer**

Si vous voyez un texte généré → ✅ **C'est bon !**

---

## 💰 Gestion des Coûts

### Modèle utilisé : GPT-4o-mini

- **Prix** : ~0,15€ pour 1000 générations typiques
- **Très économique** pour un usage normal

### Surveiller la consommation :

1. Allez sur [platform.openai.com/usage](https://platform.openai.com/usage)
2. Vous verrez les coûts en temps réel
3. Vous pouvez définir des limites mensuelles

### Limites recommandées :

- **Site personnel** : 5-10€/mois
- **Usage professionnel** : 20-50€/mois

---

## 🔒 Sécurité

### ✅ Bonnes pratiques :

- ✅ Clé stockée côté serveur (pas dans le code)
- ✅ Variable d'environnement Vercel (chiffrée)
- ✅ Jamais exposée au frontend
- ✅ Logs des requêtes dans Vercel Functions

### ⚠️ À NE JAMAIS FAIRE :

- ❌ Commit la clé dans Git
- ❌ Partager la clé publiquement
- ❌ Hardcoder dans le code source

---

## 🛠️ Dépannage

### "API OpenAI non configurée"

**Cause** : Variable d'environnement manquante

**Solution** :
1. Vérifiez que `OPENAI_API_KEY` existe dans Vercel
2. Vérifiez qu'elle est activée pour "Production"
3. Redéployez l'application

### "Invalid API key"

**Cause** : Clé incorrecte ou révoquée

**Solution** :
1. Générez une nouvelle clé sur OpenAI Platform
2. Mettez à jour dans Vercel
3. Redéployez

### Erreurs 429 (Rate limit)

**Cause** : Trop de requêtes

**Solution** :
1. Augmentez les limites dans OpenAI Platform
2. Ajoutez du crédit si nécessaire
3. Vérifiez qu'il n'y a pas de boucle infinie

### Erreurs 500 dans la fonction

**Cause** : Erreur serveur

**Solution** :
1. Consultez les logs dans Vercel → Functions
2. Vérifiez que l'API OpenAI est accessible
3. Testez manuellement avec `curl`

---

## 📊 Monitoring

### Logs Vercel

Pour voir les appels en temps réel :

1. Allez dans **Deployments** → Sélectionnez le dernier
2. Cliquez sur **Functions**
3. Sélectionnez `/api/openai`
4. Vous verrez tous les logs

### Logs OpenAI

Pour voir la consommation détaillée :

1. [platform.openai.com/usage](https://platform.openai.com/usage)
2. Onglet **Usage** pour les graphiques
3. Onglet **API Keys** pour gérer les clés

---

## 🔄 Mise à Jour de la Clé

Si vous devez changer la clé (compromission, rotation, etc.) :

1. Générez une nouvelle clé sur OpenAI
2. Mettez à jour dans Vercel (même nom `OPENAI_API_KEY`)
3. Redéployez
4. **Révoquez l'ancienne clé** sur OpenAI Platform

---

## 📞 Support

En cas de problème :

1. ✅ Vérifiez les logs Vercel Functions
2. ✅ Vérifiez le crédit OpenAI
3. ✅ Testez l'endpoint manuellement
4. ✅ Consultez [status.openai.com](https://status.openai.com)

---

## 🎯 Configuration Complète (Checklist)

- [ ] Compte OpenAI créé
- [ ] Clé API générée
- [ ] Variable `OPENAI_API_KEY` ajoutée dans Vercel
- [ ] Variable activée pour Production
- [ ] Application redéployée
- [ ] Test effectué depuis l'interface
- [ ] Limites de dépenses configurées sur OpenAI
- [ ] Logs vérifiés
