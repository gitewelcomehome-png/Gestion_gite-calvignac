# 🚀 Documentation Déploiement Vercel

## 📚 Guides Disponibles

### 🎯 Pour Démarrer

| Guide | Description | Durée |
|-------|-------------|-------|
| **[DEPLOIEMENT_EXPRESS.md](DEPLOIEMENT_EXPRESS.md)** | Déploiement ultra-rapide en 5 minutes | ⚡ 5 min |
| **[GUIDE_DEPLOIEMENT_VERCEL_COMPLET.md](GUIDE_DEPLOIEMENT_VERCEL_COMPLET.md)** | Guide détaillé complet | 📖 15 min |
| **[CHECKLIST_PRE_DEPLOIEMENT.md](CHECKLIST_PRE_DEPLOIEMENT.md)** | Checklist de vérification | ✅ 10 min |
| **[CONFIGURATION_OPENAI_VERCEL.md](CONFIGURATION_OPENAI_VERCEL.md)** | Configuration OpenAI spécifique | 🤖 5 min |

---

## 🏃‍♂️ Démarrage Rapide

### Si vous n'avez jamais déployé

➡️ Suivre [DEPLOIEMENT_EXPRESS.md](DEPLOIEMENT_EXPRESS.md)

### Si vous avez déjà déployé

```bash
# Option 1 : Git push (automatique)
git add .
git commit -m "Mise à jour"
git push

# Option 2 : CLI Vercel
vercel --prod

# Option 3 : Script automatisé
./deploy.sh production
```

---

## 🔑 Variables d'Environnement Requises

| Variable | Description | Valeur |
|----------|-------------|--------|
| `SUPABASE_URL` | URL de votre projet Supabase | `https://ivqiisnudabxemcxxyru.supabase.co` |
| `SUPABASE_KEY` | Clé anon publique Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `OPENAI_API_KEY` | Clé API OpenAI pour l'IA | `sk-proj-7cOzmw...` |
| `TIMEZONE` | Fuseau horaire | `Europe/Paris` |

**⚠️ Ces variables doivent être configurées dans Vercel Dashboard**

---

## 📊 Après le Déploiement

### ✅ Tests à Effectuer

1. **Site accessible** : `https://gestion-gite-calvignac.vercel.app`
2. **Test IA** : Info Gîtes → Bouton ✨ → Générer texte
3. **Test Supabase** : Connexion + Enregistrement fiche
4. **Logs propres** : Vercel Dashboard → Functions → Aucune erreur

### 📈 Monitoring

| Service | URL | Action |
|---------|-----|--------|
| Vercel | [Dashboard](https://vercel.com/dashboard) | Vérifier déploiements et logs |
| OpenAI | [Usage](https://platform.openai.com/usage) | Surveiller consommation |
| Supabase | [Dashboard](https://supabase.com/dashboard) | Vérifier base de données |

---

## 🚨 Résolution de Problèmes

### Erreur Fréquente #1 : "OPENAI_API_KEY non configurée"

**Solution :**
```bash
vercel env add OPENAI_API_KEY
# Coller la clé
# Sélectionner All
vercel --prod
```

### Erreur Fréquente #2 : "Supabase connection failed"

**Causes possibles :**
- Mauvaise clé (utiliser "anon" pas "service_role")
- URL incorrecte
- Variable non activée pour Production

**Solution :**
1. Vérifier dans Supabase Dashboard → Settings → API
2. Mettre à jour dans Vercel
3. Redéployer

### Erreur Fréquente #3 : Timeout sur fonction

**Cause :** Requête trop longue (limite 10s gratuit)

**Solutions :**
- Réduire `maxTokens` dans les requêtes IA
- Optimiser les requêtes Supabase
- Passer à Vercel Pro (60s timeout)

---

## 🎯 Architecture Déployée

```
Production (Vercel)
│
├── Frontend (Static)
│   ├── index.html
│   ├── /css/
│   ├── /js/
│   ├── /images/
│   └── /tabs/
│
├── API Serverless (Node.js)
│   ├── /api/openai.js (IA)
│   └── /api/webhooks/abritel.js
│
└── Backend (Supabase)
    ├── PostgreSQL
    ├── Auth
    └── Storage
```

---

## 💰 Coûts Estimés

| Service | Plan | Coût Mensuel |
|---------|------|--------------|
| **Vercel** | Hobby (Gratuit) | 0€ |
| **Supabase** | Free Tier | 0€ |
| **OpenAI** | Pay-as-you-go | ~5-10€ |
| **Total** | | **~5-10€/mois** |

---

## 🔄 Workflow de Développement

### 1. Développement Local

```bash
# Modifier le code localement
# Tester avec un serveur local
python3 -m http.server 8000
```

### 2. Commit et Push

```bash
git add .
git commit -m "Description des changements"
git push origin main
```

### 3. Déploiement Automatique

✅ Vercel détecte le push et déploie automatiquement  
✅ Preview disponible pour les branches non-main  
✅ Production mis à jour sur main

### 4. Vérification

- Consulter les logs Vercel
- Tester les fonctionnalités modifiées
- Vérifier la console navigateur

---

## 🛠️ Outils Utiles

### Vercel CLI

```bash
# Installation
npm i -g vercel

# Commandes utiles
vercel                    # Déployer en preview
vercel --prod            # Déployer en production
vercel env ls            # Lister les variables
vercel logs              # Voir les logs
vercel domains           # Gérer les domaines
vercel inspect <url>     # Inspecter un déploiement
```

### Script de Déploiement

```bash
# Déploiement rapide avec script
./deploy.sh production   # Production
./deploy.sh preview      # Preview
./deploy.sh              # Preview par défaut
```

---

## 📖 Pour Aller Plus Loin

- 📚 [Documentation Vercel](https://vercel.com/docs)
- 📚 [Documentation Supabase](https://supabase.com/docs)
- 📚 [Documentation OpenAI](https://platform.openai.com/docs)
- 🎓 [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)
- 🎓 [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 Statut Actuel

| Composant | Statut | Notes |
|-----------|--------|-------|
| Configuration Vercel | ✅ | vercel.json prêt |
| API OpenAI | ✅ | Clé fournie |
| Supabase | ✅ | Configuré |
| Variables d'env | ⏳ | À configurer dans Vercel |
| Déploiement | ⏳ | Prêt à déployer |

---

**Date de création** : 29 Janvier 2026  
**Dernière mise à jour** : 29 Janvier 2026  
**Statut** : ✅ Prêt pour le déploiement
