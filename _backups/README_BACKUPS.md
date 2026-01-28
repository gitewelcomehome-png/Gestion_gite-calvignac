# 📦 Gestion des Backups - Site Gîte Calvignac

## 🎯 Politique de sauvegarde

### Backup unique centralisé
Ce dossier contient **UN SEUL backup complet** du site, mis à jour régulièrement.
- ✅ Remplace systématiquement l'ancien backup
- ✅ Fichier unique : `backup_complete_CURRENT.tar.gz`
- ✅ Documentation : `RESTORE_backup_complete_CURRENT.md`

### Commande de sauvegarde standardisée
```bash
cd /workspaces/Gestion_gite-calvignac
rm -f _backups/backup_complete_CURRENT.tar.gz
tar -czf "_backups/backup_complete_CURRENT.tar.gz" \
  --exclude='_backups' \
  --exclude='_archives' \
  --exclude='node_modules' \
  --exclude='.git' .
echo "✅ Backup centralisé mis à jour : $(date)"
```

## 📂 Contenu exclu des backups
- `_backups/` - Éviter récursion
- `_archives/` - Fichiers historiques non essentiels
- `node_modules/` - Dépendances réinstallables
- `.git/` - Historique git séparé

## 🔄 Restauration rapide

### Restauration complète
```bash
cd /workspaces/Gestion_gite-calvignac
tar -xzf _backups/backup_complete_CURRENT.tar.gz -C /tmp/restore
rm -rf css/ js/ tabs/ pages/ *.html *.md
cp -r /tmp/restore/* .
rm -rf /tmp/restore
```

### Restauration sélective
```bash
# CSS uniquement
tar -xzf _backups/backup_complete_CURRENT.tar.gz -C /tmp/restore css/
cp -r /tmp/restore/css/* css/

# JS uniquement
tar -xzf _backups/backup_complete_CURRENT.tar.gz -C /tmp/restore js/
cp -r /tmp/restore/js/* js/

# Tab spécifique
tar -xzf _backups/backup_complete_CURRENT.tar.gz -C /tmp/restore tabs/tab-menage.html
cp /tmp/restore/tabs/tab-menage.html tabs/

rm -rf /tmp/restore
```

## 📚 Fichiers de migration (archivés)
Les fichiers de migration et tests sont archivés dans `_archives/migrations/` :
- `MIGRATION_LOT_*.md` - Documentation des lots de migration CSS
- `test-lot-*.html` - Pages de test pour chaque lot

## 🚫 Ne PAS créer
- ❌ Backups multiples datés
- ❌ Backups CSS isolés
- ❌ Dossiers de backup temporaires

## ✅ Workflow recommandé

### Avant modification importante
```bash
cd /workspaces/Gestion_gite-calvignac
./scripts/backup-site.sh  # Si script existe
# OU commande manuelle ci-dessus
```

### Après modification validée
```bash
# Mettre à jour le backup centralisé
rm -f _backups/backup_complete_CURRENT.tar.gz
tar -czf "_backups/backup_complete_CURRENT.tar.gz" \
  --exclude='_backups' --exclude='_archives' \
  --exclude='node_modules' --exclude='.git' .
```

### En cas de problème
```bash
# Restaurer le dernier backup validé
cd /workspaces/Gestion_gite-calvignac
tar -xzf _backups/backup_complete_CURRENT.tar.gz -C .
# Vider cache navigateur : Ctrl+Shift+R
```

## 📝 Historique
- **27 janvier 2026** : Mise en place backup centralisé
- **Nettopage effectué** : Suppression 20+ fichiers CSS et dossiers obsolètes
- **Migration archivée** : Lots 01-09 + tests déplacés vers `_archives/migrations/`
