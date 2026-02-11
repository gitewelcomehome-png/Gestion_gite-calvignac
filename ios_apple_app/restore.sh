#!/bin/bash
# Script de restauration automatique de l'application iOS
# Créé le 9 février 2026 - Backup fonctionnel testé

set -e  # Arrêter en cas d'erreur

echo "🔄 RESTAURATION DE L'APPLICATION iOS"
echo "======================================"
echo ""

# Variables
BACKUP_DIR="/workspaces/Gestion_gite-calvignac/_backups/ios_app_backup_20260209_111050_WORKING"
APP_DIR="/workspaces/Gestion_gite-calvignac/ios_apple_app"

# Confirmation
echo "⚠️  Cette action va :"
echo "   1. Arrêter tous les processus Expo en cours"
echo "   2. Supprimer le dossier ios_apple_app actuel"
echo "   3. Restaurer la version du backup du 9 février 2026"
echo ""
read -p "Continuer ? (o/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "❌ Restauration annulée"
    exit 1
fi

echo ""
echo "📋 Étape 1/5 : Arrêt des processus Expo..."
pkill -9 -f "expo|metro" 2>/dev/null || true
lsof -ti:8081,8082 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ Processus arrêtés"

echo ""
echo "📋 Étape 2/5 : Suppression de l'application actuelle..."
if [ -d "$APP_DIR" ]; then
    rm -rf "$APP_DIR"
    echo "✅ Application actuelle supprimée"
else
    echo "ℹ️  Dossier ios_apple_app n'existe pas"
fi

echo ""
echo "📋 Étape 3/5 : Copie du backup..."
cp -r "$BACKUP_DIR" "$APP_DIR"
echo "✅ Backup restauré"

echo ""
echo "📋 Étape 4/5 : Vérification des fichiers critiques..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "❌ ERREUR : Fichier .env manquant !"
    exit 1
fi
if [ ! -f "$APP_DIR/index.ts" ]; then
    echo "❌ ERREUR : Fichier index.ts manquant !"
    exit 1
fi
echo "✅ Fichiers critiques présents"

echo ""
echo "📋 Étape 5/5 : Installation des dépendances..."
cd "$APP_DIR"
npm install --legacy-peer-deps
echo "✅ Dépendances installées"

echo ""
echo "🎉 RESTAURATION TERMINÉE AVEC SUCCÈS !"
echo "======================================"
echo ""
echo "Pour démarrer l'application :"
echo "  cd $APP_DIR"
echo "  npx expo start --tunnel"
echo ""
echo "En cas de problème, nettoyer les caches :"
echo "  rm -rf .expo .metro-cache node_modules/.cache"
echo "  npx expo start --clear --tunnel"
echo ""
