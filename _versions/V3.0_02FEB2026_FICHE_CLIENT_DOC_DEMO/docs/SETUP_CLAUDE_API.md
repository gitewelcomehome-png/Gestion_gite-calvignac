# 🔑 Configuration Claude API - LiveOwnerUnit

## 📋 Étapes Configuration

### 1. Créer Compte Anthropic
1. Va sur **https://console.anthropic.com**
2. "Sign Up" avec email + mot de passe
3. Vérifier email

### 2. Ajouter Carte Bancaire
1. Dans console → "Billing"
2. Ajouter carte (CB française acceptée)
3. **5$ de crédit offert** au démarrage

### 3. Créer Clé API
1. Console → "API Keys"
2. "Create Key"
3. Nom : `liveownerunit-production`
4. Copier la clé : `sk-ant-api03-...` (commence toujours par `sk-ant-`)

### 4. Ajouter dans Vercel
1. Va sur **vercel.com** → Ton projet
2. Settings → Environment Variables
3. Ajouter :
   ```
   Nom : ANTHROPIC_API_KEY
   Valeur : sk-ant-api03-... (coller ta clé)
   ```
4. Redéployer (Production + Preview + Development)

### 5. Tester
Retourne sur ton site admin-content.html → Clique "Générer Plan Complet"

---

## 💰 Tarification Claude 3.5 Sonnet

| Élément | Prix |
|---------|------|
| Input tokens (lecture) | **$3 / 1M tokens** |
| Output tokens (génération) | **$15 / 1M tokens** |
| Crédit gratuit | **$5** (≈ 30-40 plans complets) |

### Estimation Coût Réel
- **1 plan 12 semaines** : ~8k tokens input + 12k output = **$0.23**
- **Usage mensuel** (1 plan/jour) : **~$7/mois**
- **Avec historique contexte** : **~$0.30/plan** → **$9/mois**

vs GPT-4 actuel : $0.50/plan → $15/mois 💸

---

## 🚀 Avantages Migration

✅ **-40% coût** vs GPT-4  
✅ **Contexte 200k tokens** (vs 128k GPT-4)  
✅ **Communication plus authentique** (moins de bullshit marketing)  
✅ **JSON plus fiable** (moins d'erreurs parsing)  
✅ **Raisonnement stratégique supérieur**  

---

## 🔧 Troubleshooting

### Erreur "API Key not configured"
→ Vérifie que `ANTHROPIC_API_KEY` est bien dans Vercel Environment Variables  
→ Redéploie après ajout variable

### Erreur "Rate limit exceeded"
→ Tu dépasses le quota gratuit ($5)  
→ Ajoute carte bancaire dans console.anthropic.com

### Réponse "Invalid JSON"
→ Normal les premières fois (IA apprend ton format)  
→ Check console.log pour voir le raw content  
→ Raffiner prompt si besoin

---

## 📊 Monitoring Utilisation

Console Anthropic → "Usage" :
- Voir tokens consommés par jour
- Coût en temps réel
- Alerte si quota dépassé

Recommandation : **Limite 50$/mois** pour éviter surprises

---

## 🎯 Prochaines Étapes

1. ✅ Créer compte Anthropic
2. ✅ Ajouter `ANTHROPIC_API_KEY` dans Vercel
3. ✅ Tester génération plan
4. 📈 Comparer qualité communication Claude vs GPT-4
5. 🔥 Scaler production contenu

---

**Support** : docs.anthropic.com/en/api
