---
name: deploy-vercel
description: 'Déploiement sécurisé sur Vercel pour le projet Gestion Gîte Calvignac (site en production avec clients réels). Utiliser pour : préparer un déploiement, vérifier avant de pusher, faire un rollback, valider après déploiement, débloquer un échec de build. Checklist pré-deploy, variables d'environnement, RLS Supabase, routes API.'
argument-hint: 'Décris ce que tu veux déployer ou le problème rencontré (ex: déploiement d'une nouvelle feature, rollback urgent, build qui échoue)'
---

# Deploy Vercel — Gestion Gîte Calvignac

> Site en **production avec clients réels**. Chaque déploiement doit être précédé d'une checklist complète.

---

## Workflow de Déploiement

### Étape 1 — Checklist Pré-Deploy

Avant tout `git push` ou déploiement manuel, vérifier :

**Code**
- [ ] Zéro `console.log` de debug laissé
- [ ] Zéro erreur/warning dans les fichiers modifiés
- [ ] Les `try/catch` sont bien en place sur les appels async
- [ ] Pas de clé API ou secret hardcodé dans le code

**Variables d'environnement**
- [ ] Toutes les variables nécessaires sont déclarées dans le dashboard Vercel
- [ ] Le fichier `.env.local` est bien dans `.gitignore` (ne jamais commiter)
- [ ] Vérifier que les nouvelles variables sont ajoutées dans Vercel avant le deploy

**Base de données**
- [ ] Les migrations SQL nécessaires ont été exécutées sur Supabase prod
- [ ] Les nouvelles tables/colonnes ont leurs politiques RLS configurées
- [ ] Les RPCs/fonctions Supabase utilisées par le code existent bien en prod

**Routes API**
- [ ] Les nouveaux endpoints `/api/*.js` ont été testés localement (`vercel dev`)
- [ ] Les headers CORS sont corrects si l'endpoint est appelé cross-origin
- [ ] Les variables d'env utilisées dans les API existent dans Vercel

### Étape 2 — Déployer

```bash
# Déploiement production
vercel --prod

# Ou via git (si auto-deploy configuré)
git push origin main
```

### Étape 3 — Validation Post-Deploy

Après déploiement, vérifier dans l'ordre :
1. **Build logs** — Pas d'erreur dans les logs Vercel
2. **Page principale** — `app.html` charge sans erreur console
3. **Auth** — Connexion/déconnexion fonctionnelle
4. **Fonctionnalité modifiée** — Tester le cas nominal
5. **API touchées** — Vérifier les endpoints modifiés via l'onglet réseau

---

## Rollback d'Urgence

Si un déploiement casse quelque chose en production :

```bash
# Lister les deployments récents
vercel ls

# Promouvoir un deployment précédent en production
vercel promote <deployment-url>
```

Ou via le dashboard Vercel : **Deployments → sélectionner un deploy antérieur → "Promote to Production"**

---

## Variables d'Environnement Connues

Consulter `.env.example` pour la liste complète. Les variables critiques :
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ZOHO_*` (mail)

---

## Débloquer un Build en Échec

1. Lire le message d'erreur exact dans les logs Vercel
2. Si erreur de dépendance Node : vérifier `package.json` et `engines.node`
3. Si erreur d'import : vérifier que le fichier existe et que le chemin est correct
4. Si timeout API : vérifier la limite Vercel (10s par défaut, 60s max sur Pro)
5. Ne jamais merger un fix hasty — comprendre l'erreur avant de corriger
