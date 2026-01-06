# 🚀 Configuration Vercel - Phase 2 Sécurité

## Variables d'environnement à configurer

### 1. Aller dans Vercel Dashboard
- https://vercel.com/gitewelcomehome-png/gestion-gite-calvignac
- Onglet **Settings** → **Environment Variables**

### 2. Ajouter ces variables

#### VERCEL_SUPABASE_URL
- **Key:** `VERCEL_SUPABASE_URL`
- **Value:** `https://ivqiisnudabxemcxxyru.supabase.co`
- **Environment:** Production, Preview, Development (cocher les 3)

#### VERCEL_SUPABASE_KEY
- **Key:** `VERCEL_SUPABASE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4`
- **Environment:** Production, Preview, Development (cocher les 3)

### 3. Redéployer
Après avoir ajouté les variables :
```bash
git add .
git commit -m "feat: Phase 2 - Configuration sécurisée des secrets"
git push
```

Vercel redéploiera automatiquement avec les nouvelles variables.

### 4. Vérifier
- Ouvrir le site sur Vercel
- Console navigateur doit afficher : `🚀 Mode production : Variables Vercel`
- Login doit fonctionner

## 🔒 Sécurité

✅ **Fait:**
- config.local.js dans .gitignore (jamais commité)
- Clés hardcodées supprimées du code
- Variables d'environnement utilisées en production

⚠️ **À faire après:**
- Considérer la rotation des clés Supabase (elles ont été exposées dans le code)
- Utiliser `anon key` uniquement (jamais la `service_role key`)

## 📝 Pour les développeurs

Quand un nouveau développeur clone le projet :

1. Créer `config.local.js` à la racine :
```javascript
// config.local.js - NE JAMAIS COMMITER CE FICHIER
console.log('🔑 Configuration locale chargée');

window.LOCAL_CONFIG = {
    SUPABASE_URL: 'https://ivqiisnudabxemcxxyru.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4'
};
```

2. Lancer le serveur local :
```bash
python3 -m http.server 8080
```

3. Ouvrir http://localhost:8080
