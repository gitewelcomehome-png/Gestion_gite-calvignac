#!/bin/bash

# Script de restauration automatique du backup du 11 Février 2026

echo "🔄 Restauration du backup du 11 Février 2026 16h..."
echo ""

# Vérifier qu'on est bien dans le dossier du projet
if [ ! -f "package.json" ]; then
    echo "❌ Erreur : Vous devez exécuter ce script depuis la racine du projet"
    exit 1
fi

# Créer un backup de l'état actuel avant restauration
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
echo "📦 Création d'un backup de l'état actuel : avant_restauration_$BACKUP_DATE"
mkdir -p "_backups/avant_restauration_$BACKUP_DATE"
cp index.html app.html vercel.json robots.txt sitemap.xml package.json "_backups/avant_restauration_$BACKUP_DATE/"
cp -r css js images assets api pages tabs "_backups/avant_restauration_$BACKUP_DATE/"

echo "✅ Backup actuel créé"
echo ""

# Restaurer les fichiers
echo "🔧 Restauration des fichiers principaux..."
cp _backups/backup_site_complet_11feb2026_16h/index.html .
cp _backups/backup_site_complet_11feb2026_16h/app.html .
cp _backups/backup_site_complet_11feb2026_16h/vercel.json .
cp _backups/backup_site_complet_11feb2026_16h/robots.txt .
cp _backups/backup_site_complet_11feb2026_16h/sitemap.xml .
cp _backups/backup_site_complet_11feb2026_16h/package.json .

echo "✅ Fichiers principaux restaurés"
echo ""

echo "🔧 Restauration des dossiers..."
cp -r _backups/backup_site_complet_11feb2026_16h/css ./
cp -r _backups/backup_site_complet_11feb2026_16h/js ./
cp -r _backups/backup_site_complet_11feb2026_16h/images ./
cp -r _backups/backup_site_complet_11feb2026_16h/assets ./
cp -r _backups/backup_site_complet_11feb2026_16h/pages ./
cp -r _backups/backup_site_complet_11feb2026_16h/tabs ./

echo "✅ Dossiers restaurés"
echo ""

echo "🎉 Restauration terminée !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Vérifiez les fichiers restaurés"
echo "2. Testez en local si besoin"
echo "3. Commitez et déployez :"
echo "   git add -A"
echo "   git commit -m 'Restauration backup 11feb2026_16h'"
echo "   git push origin main"
echo ""
echo "⚠️  Un backup de l'état précédent a été créé dans :"
echo "   _backups/avant_restauration_$BACKUP_DATE/"
