# 🚀 RESTAURATION RAPIDE iOS APP

## ⚡ Une seule commande

```bash
bash /workspaces/Gestion_gite-calvignac/_backups/ios_app_backup_20260209_111050_WORKING/restore.sh
```

## 📱 Ou démarrage classique

```bash
cd /workspaces/Gestion_gite-calvignac/ios_apple_app
npx expo start --tunnel
```

## 🔄 En cas de bug

```bash
cd /workspaces/Gestion_gite-calvignac/ios_apple_app
rm -rf .expo .metro-cache node_modules/.cache
npx expo start --clear --tunnel
```

## ❌ Si ça ne démarre toujours pas

```bash
# ROLLBACK COMPLET
bash /workspaces/Gestion_gite-calvignac/_backups/ios_app_backup_20260209_111050_WORKING/restore.sh
```

---

**Backup validé le 9 février 2026**  
**Application testée et fonctionnelle**
