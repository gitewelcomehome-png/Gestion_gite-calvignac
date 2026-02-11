# 📦 INVENTAIRE DU BACKUP iOS APP

**Date de création** : 9 février 2026 - 11:10:50  
**Taille totale** : Calculée lors de la sauvegarde  
**Nombre de fichiers** : 16,236 fichiers sources  

---

## 📁 CONTENU DU BACKUP

### Dossiers principaux :
- `app/` - Application Expo Router (auth, tabs, layouts)
- `providers/` - Auth provider
- `services/` - Supabase client
- `components/` - Composants UI réutilisables
- `assets/` - Images, polices, icônes
- `node_modules/` - Dépendances npm

### Fichiers critiques inclus :
- ✅ `.env` - Variables d'environnement Supabase
- ✅ `index.ts` - Point d'entrée Expo Router
- ✅ `app.json` - Configuration Expo
- ✅ `babel.config.js` - Configuration Babel avec alias
- ✅ `tsconfig.json` - Configuration TypeScript avec paths
- ✅ `package.json` - Dépendances et scripts
- ✅ `package-lock.json` - Versions verrouillées

---

## ✅ ÉTAT FONCTIONNEL VALIDÉ

### Tests réussis avant backup :
1. ✅ Démarrage : `npx expo start --tunnel` sans erreur
2. ✅ Compilation : 1471 modules compilés avec succès
3. ✅ Tunnel : Connexion ngrok établie
4. ✅ QR Code : Généré et scannable
5. ✅ Expo Go : Application chargée sur iPhone
6. ✅ Login : Écran de connexion affiché correctement
7. ✅ Auth : Connexion Supabase fonctionnelle
8. ✅ Dashboard : Données chargées et affichées

---

## 🔧 VERSIONS DES PACKAGES CRITIQUES

### Production :
- expo: ~54.0.33
- expo-router: ~6.0.23
- react: 19.1.0
- react-native: 0.81.5
- @supabase/supabase-js: ^2.95.3
- react-native-reanimated: ~4.1.1
- **react-native-worklets: 0.5.1** ⚠️ VERSION CRITIQUE - NE PAS CHANGER
- expo-symbols: latest (installé)

### Dev :
- babel-preset-expo: ^54.0.10
- babel-plugin-module-resolver: latest
- @babel/core: ^7.29.0
- typescript: ~5.9.2

---

## 🚀 RESTAURATION RAPIDE

### Commande simple :
```bash
bash /workspaces/Gestion_gite-calvignac/_backups/ios_app_backup_20260209_111050_WORKING/restore.sh
```

### Commande manuelle :
```bash
cd /workspaces/Gestion_gite-calvignac
pkill -9 -f "expo|metro"
rm -rf ios_apple_app
cp -r _backups/ios_app_backup_20260209_111050_WORKING ios_apple_app
cd ios_apple_app
npm install --legacy-peer-deps
npx expo start --tunnel
```

---

## 📋 CHECKSUM FICHIERS CRITIQUES

Vérifier l'intégrité avec :
```bash
cd /workspaces/Gestion_gite-calvignac/_backups/ios_app_backup_20260209_111050_WORKING
md5sum .env index.ts app.json babel.config.js tsconfig.json package.json
```

---

## ⚠️ NOTES IMPORTANTES

1. **Ce backup contient node_modules/** 
   - Avantage : Pas besoin de réinstaller (plus rapide)
   - Inconvénient : Taille plus importante
   - Solution alternative : `npm install --legacy-peer-deps` après restauration

2. **Fichier .env inclus**
   - Contient les clés Supabase
   - Ne pas partager publiquement

3. **Versions verrouillées**
   - package-lock.json garantit les mêmes versions
   - Important pour éviter les incompatibilités

---

## 🔍 VÉRIFICATION POST-RESTAURATION

Après restauration, vérifier :
```bash
# 1. Fichiers présents
ls -la .env index.ts app.json

# 2. Dépendances cohérentes
npm list react-native-worklets
# Doit afficher : react-native-worklets@0.5.1

# 3. Démarrage
npx expo start --tunnel
# Doit afficher le QR code sans erreur
```

---

## 📞 EN CAS DE PROBLÈME

Si la restauration échoue :
1. Vérifier que le dossier backup existe
2. Vérifier les permissions (chmod +x restore.sh)
3. S'assurer que node et npm sont installés
4. Consulter README_RESTAURATION.md pour le dépannage

---

**Backup validé et testé fonctionnel**  
**Conservez ce backup précieusement**  
**Il représente un état stable de l'application**
