# 📱 BACKUP APPLICATION iOS - ÉTAT FONCTIONNEL

**Date de sauvegarde** : 9 février 2026 - 11:10:50  
**Status** : ✅ APPLICATION TESTÉE ET FONCTIONNELLE  
**Version** : 1.0.0

---

## ✅ ÉTAT AU MOMENT DU BACKUP

### Application fonctionnelle avec :
- ✅ Démarrage sans erreur
- ✅ Expo Router configuré correctement
- ✅ Authentification Supabase opérationnelle
- ✅ Dashboard avec KPI fonctionnel
- ✅ Navigation tabs active
- ✅ Tunnel Expo connecté
- ✅ Compilation réussie (1471 modules)

### Problèmes corrigés avant ce backup :
1. ✅ `react-native-worklets` version 0.5.1 (compatible Expo)
2. ✅ `index.ts` utilise `expo-router/entry`
3. ✅ Alias `@` configuré dans `tsconfig.json` et `babel.config.js`
4. ✅ Package `expo-symbols` installé
5. ✅ Fichier `.env` avec identifiants Supabase
6. ✅ Warning `newArchEnabled` supprimé de `app.json`

---

## 🔄 RESTAURATION

### En cas de problème, restaurer avec cette commande :

```bash
cd /workspaces/Gestion_gite-calvignac
rm -rf ios_apple_app
cp -r _backups/ios_app_backup_20260209_111050_WORKING ios_apple_app
cd ios_apple_app
npm install --legacy-peer-deps
npx expo start --clear --tunnel
```

### OU via script automatique :

```bash
cd /workspaces/Gestion_gite-calvignac
bash _backups/ios_app_backup_20260209_111050_WORKING/restore.sh
```

---

## 📦 PACKAGES INSTALLÉS

### Production dependencies :
- `expo` : ~54.0.33
- `expo-router` : ~6.0.23
- `@supabase/supabase-js` : ^2.95.3
- `react-native` : 0.81.5
- `react-native-reanimated` : ~4.1.1
- `react-native-worklets` : 0.5.1 ⚠️ VERSION CRITIQUE
- `expo-symbols` : installé

### Dev dependencies :
- `babel-preset-expo` : ^54.0.10
- `babel-plugin-module-resolver` : installé
- `@babel/core` : ^7.29.0
- `typescript` : ~5.9.2

---

## ⚙️ CONFIGURATION CRITIQUE

### 1. `.env` (OBLIGATOIRE)
```env
EXPO_PUBLIC_SUPABASE_URL=https://fgqimtpjjhdqeyyaptoj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[clé présente dans le fichier]
```

### 2. `babel.config.js`
```javascript
plugins: [
  ['module-resolver', { root: ['.'], alias: { '@': '.' } }],
  'react-native-reanimated/plugin'
]
```

### 3. `tsconfig.json`
```json
"baseUrl": ".",
"paths": { "@/*": ["./*"] }
```

### 4. `index.ts`
```typescript
import 'expo-router/entry';
```

---

## 🚀 COMMANDES DE DÉMARRAGE

### Démarrage standard :
```bash
cd /workspaces/Gestion_gite-calvignac/ios_apple_app
npx expo start --tunnel
```

### Démarrage avec nettoyage :
```bash
cd /workspaces/Gestion_gite-calvignac/ios_apple_app
rm -rf .expo .metro-cache node_modules/.cache
npx expo start --clear --tunnel
```

### En cas de port occupé :
```bash
pkill -9 -f "expo|metro"
lsof -ti:8081,8082 | xargs kill -9 2>/dev/null
npx expo start --tunnel
```

---

## 📱 STRUCTURE DE L'APPLICATION

```
ios_apple_app/
├── app/
│   ├── (auth)/
│   │   └── login.tsx          # Écran de connexion
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard principal
│   │   ├── calendar.tsx       # Calendrier
│   │   ├── cleaning.tsx       # Ménages
│   │   ├── stats.tsx          # Statistiques
│   │   └── settings.tsx       # Paramètres
│   └── _layout.tsx            # Navigation & auth
├── providers/
│   └── auth-provider.tsx      # Gestion session
├── services/
│   └── supabase.ts            # Client Supabase
├── components/                # Composants UI
├── .env                       # Variables d'environnement ⚠️
├── index.ts                   # Point d'entrée Expo Router
├── babel.config.js            # Config Babel avec alias
├── tsconfig.json              # Config TypeScript avec alias
├── app.json                   # Config Expo
└── package.json               # Dépendances
```

---

## ⚠️ FICHIERS CRITIQUES À NE PAS MODIFIER

1. **`.env`** - Supprimer ce fichier = app ne démarre pas
2. **`index.ts`** - Doit contenir `import 'expo-router/entry';`
3. **`babel.config.js`** - Alias `@` nécessaire pour imports
4. **`tsconfig.json`** - Paths nécessaires pour TypeScript
5. **`package.json`** - `react-native-worklets` DOIT être en 0.5.1

---

## 🔧 DÉPANNAGE

### Erreur "Cannot find module"
```bash
npm install --legacy-peer-deps
rm -rf .expo .metro-cache
npx expo start --clear
```

### Erreur "Port already in use"
```bash
pkill -9 -f "expo|metro"
npx expo start --tunnel
```

### Erreur "Supabase is NULL"
```bash
# Vérifier que .env existe
cat .env
# Si manquant, copier depuis ce backup
```

### Erreur version worklets
```bash
npm uninstall react-native-worklets
npm install react-native-worklets@0.5.1 --legacy-peer-deps
```

---

## 📊 TESTS DE VALIDATION

Après restauration, vérifier :

1. ✅ `npx expo start --tunnel` démarre sans erreur
2. ✅ QR code s'affiche
3. ✅ Tunnel connecté
4. ✅ Compilation réussie (1400+ modules)
5. ✅ Scan QR code → App s'ouvre dans Expo Go
6. ✅ Écran login s'affiche
7. ✅ Connexion fonctionne
8. ✅ Dashboard affiche les données

---

## 📝 NOTES IMPORTANTES

- **NE PAS** mettre à jour `react-native-worklets` au-delà de 0.5.1
- **TOUJOURS** utiliser `--legacy-peer-deps` pour npm install
- **VÉRIFIER** que `.env` existe avant de démarrer
- **NETTOYER** les caches en cas de comportement étrange
- **TUER** tous les processus expo/metro avant de redémarrer

---

**Backup créé automatiquement par Copilot**  
**Testé et validé fonctionnel le 9 février 2026**
