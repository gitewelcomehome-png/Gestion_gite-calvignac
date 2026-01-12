# Plan de Migration vers Nouveau Projet Supabase

## Problème
Le cache PostgREST du projet actuel est corrompu et ne se synchronise plus avec le vrai schéma de la base de données.

## Solution : Migration vers nouveau projet

### Étape 1 : Créer nouveau projet Supabase
1. Dashboard Supabase → "New Project"
2. Nom : "Gestion_gite_PROD"
3. Région : Même que l'actuel
4. Database password : Secure

### Étape 2 : Exécuter le schéma propre
1. SQL Editor du NOUVEAU projet
2. Exécuter `sql/multi-tenant/00_reset_and_create_clean.sql`
3. Vérifier : `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

### Étape 3 : Tester l'onboarding
1. Copier nouvelle URL + anon_key dans `config.local.js`
2. Tester onboarding complet
3. Vérifier que les inserts fonctionnent sans erreur PGRST204

### Étape 4 : Migration des données (si existantes)
Si tu as des données dans l'ancien projet :
```sql
-- Export depuis ancien projet
pg_dump --data-only --table=organizations,gites,organization_members > data.sql

-- Import dans nouveau projet
psql < data.sql
```

### Étape 5 : Mise à jour config production
1. `config.local.js` → nouvelles clés
2. `.env` (si existe) → nouvelles clés
3. Vercel/Netlify env vars → nouvelles clés

## Pourquoi c'est nécessaire ?
- Le cache PostgREST stocke le schéma dans un layer intermédiaire
- Quand on modifie les tables plusieurs fois, le cache peut se désynchroniser
- NOTIFY + Restart ne suffisent pas si la corruption est profonde
- Un nouveau projet = cache vierge = garantie de fonctionnement

## Alternative (plus complexe)
Contacter le support Supabase pour forcer la régénération complète du cache PostgREST de ton projet actuel. Mais ça peut prendre plusieurs jours.

## Recommandation
Pour la production, **toujours utiliser un nouveau projet Supabase** propre, et n'exécuter le script de création qu'UNE SEULE FOIS au tout début.
