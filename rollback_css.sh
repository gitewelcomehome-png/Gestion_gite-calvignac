#!/bin/bash
# Script de rollback CSS - Restaure la version précédente

BACKUP_DIR="_backups/css_20260126_092333"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Erreur: Le dossier de backup $BACKUP_DIR n'existe pas"
    exit 1
fi

echo "🔄 ROLLBACK EN COURS..."
echo ""

# Sauvegarder la version actuelle avant le rollback
ROLLBACK_BACKUP="_backups/before_rollback_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ROLLBACK_BACKUP"
cp css/main.css "$ROLLBACK_BACKUP/"
cp STRUCTURE_CONTENANTS.html "$ROLLBACK_BACKUP/"
echo "✅ Version actuelle sauvegardée dans $ROLLBACK_BACKUP"

# Restaurer les fichiers
cp "$BACKUP_DIR/main.css.backup" css/main.css
echo "✅ css/main.css restauré"

cp "$BACKUP_DIR/STRUCTURE_CONTENANTS.html.backup" STRUCTURE_CONTENANTS.html
echo "✅ STRUCTURE_CONTENANTS.html restauré"

echo ""
echo "✅ ROLLBACK TERMINÉ"
echo "Fichiers restaurés depuis: $BACKUP_DIR"
echo "Version actuelle sauvegardée dans: $ROLLBACK_BACKUP (au cas où)"
