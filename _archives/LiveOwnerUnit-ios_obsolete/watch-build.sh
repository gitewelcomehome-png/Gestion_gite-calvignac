#!/bin/bash

# Script de surveillance des builds EAS
# Usage: ./watch-build.sh

cd "/workspaces/Gestion_gite-calvignac/LiveOwnerUnit ios"

echo "🔄 Surveillance des builds EAS pour LiveOwnerUnit"
echo "================================================"
echo ""

while true; do
  clear
  echo "🔄 Surveillance des builds - Actualisation toutes les 30s"
  echo "Appuyez sur Ctrl+C pour arrêter"
  echo "================================================"
  echo ""
  
  # Récupère le dernier build
  eas build:list --limit 1 --non-interactive 2>/dev/null || eas build:list --limit 1
  
  echo ""
  echo "------------------------------------------------"
  echo "⏰ Dernière mise à jour: $(date '+%H:%M:%S')"
  echo "🔗 Builds en ligne: https://expo.dev/accounts/liveownerunit/projects/LiveOwnerUnit/builds"
  echo "------------------------------------------------"
  
  # Attend 30 secondes avant la prochaine vérification
  sleep 30
done
