# 🚀 GUIDE RAPIDE - Application iOS LiveOwnerUnit

## 📍 Dossier actif
```
/workspaces/Gestion_gite-calvignac/ios_apple_app/
```

## ⚡ Commandes essentielles

### Démarrer le serveur Expo
```bash
cd /workspaces/Gestion_gite-calvignac/ios_apple_app
npm install --legacy-peer-deps  # Si node_modules manquant
npx expo start --tunnel
```

### Si problème de dépendances
```bash
npm install --legacy-peer-deps
```

### Relancer avec cache vidé
```bash
npx expo start --tunnel --clear
```

## 📱 Tester sur iPhone

1. **Installer Expo Go** depuis App Store (gratuit)
2. **Scanner le QR code** affiché dans le terminal avec :
   - App Appareil Photo iOS → Cliquer sur notification
   - OU directement dans Expo Go → Onglet "Scan QR code"
3. **Se connecter** avec vos identifiants web

## 📂 Fichiers importants

### Configuration
- `.env` : Variables Supabase (URL + clé anonyme)
- `package.json` : Dépendances npm

### Authentification
- `app/(auth)/login.tsx` : Écran de connexion ✅ texte visible
- `providers/auth-provider.tsx` : Gestion session
- `app/_layout.tsx` : Navigation automatique

### Dashboard
- `app/(tabs)/index.tsx` : Dashboard principal ✅ owner_user_id filtré
- `services/supabase.ts` : Connexion base de données

### À implémenter
- `app/(tabs)/calendar.tsx` : Calendrier 🚧
- `app/(tabs)/cleaning.tsx` : Ménages 🚧
- `app/(tabs)/stats.tsx` : Statistiques 🚧
- `app/(tabs)/settings.tsx` : Paramètres 🚧

## 🔧 Variables d'environnement

Le fichier `.env` contient :
```
EXPO_PUBLIC_SUPABASE_URL=https://fgqimtpjjhdqeyyaptoj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[votre-clé]
```

## 🔑 Sécurité

Toutes les requêtes incluent automatiquement :
```typescript
.eq('owner_user_id', user.id)
```

Les politiques RLS Supabase vérifient : `owner_user_id = auth.uid()`

## 📖 Documentation complète

**Consultez [SUIVI_APPLICATION.md](ios_apple_app/SUIVI_APPLICATION.md)** pour :
- Architecture complète
- Historique des modifications
- Fonctionnalités implémentées
- Roadmap
- Guide de débogage

## ✅ Statut actuel

**Version** : 1.0.0  
**Date** : 9 février 2026  
**Statut** : ✅ PRODUCTION

**Fonctionnel** :
- ✅ Authentification email/mot de passe
- ✅ Dashboard avec KPI (réservations, gîtes)
- ✅ Liste prochaines réservations
- ✅ Pull-to-refresh
- ✅ Logs de debug

**À venir** :
- 🚧 Calendrier des réservations
- 🚧 Planning ménages
- 🚧 Statistiques détaillées
- 🚧 Paramètres utilisateur

## 🐛 Problèmes courants

### "Cannot find module babel-preset-expo"
```bash
npm install --legacy-peer-deps
```

### Pas de QR code visible
Le serveur doit tourner en **tunnel mode** pour être accessible depuis iPhone :
```bash
npx expo start --tunnel
```

### Pas de données dans l'app
- Vérifier connexion avec vos identifiants web
- Vérifier logs terminal : `owner_user_id` doit être présent
- Vérifier connexion internet

### Cache corrompu
```bash
npx expo start --clear
```

## 📊 Logs de debug

Les logs s'affichent en temps réel dans le terminal :
```
 LOG  🔍 Config chargée:
 LOG  ✅ Supabase client créé
 LOG  👤 Utilisateur: xxx email@example.com
 LOG  ✅ Stats mises à jour: {"reservations": 5, "gites": 2}
```

## 🔄 Restart complet

Si rien ne fonctionne :
```bash
cd /workspaces/Gestion_gite-calvignac/ios_apple_app
rm -rf node_modules .expo
npm install --legacy-peer-deps
npx expo start --tunnel --clear
```

---

**Dernière mise à jour** : 9 février 2026
