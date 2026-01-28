#!/bin/bash
# ============================================================================
# SCRIPT DE RESTAURATION - VERSION V1.1 - 28 JANVIER 2026
# ============================================================================
# Ce script restaure tous les fichiers de la version V1.1
# ============================================================================

set -e

VERSION_DIR="/workspaces/Gestion_gite-calvignac/_versions/V1.1_28JAN2026_RESTAURATION_TABLES_CLIENTS"
PROJECT_ROOT="/workspaces/Gestion_gite-calvignac"

echo "🔄 RESTAURATION DE LA VERSION V1.1 - 28 JANVIER 2026"
echo "=================================================="
echo ""

# Vérification que la sauvegarde existe
if [ ! -d "$VERSION_DIR" ]; then
    echo "❌ ERREUR : Dossier de sauvegarde introuvable !"
    echo "   Attendu : $VERSION_DIR"
    exit 1
fi

echo "✅ Dossier de sauvegarde trouvé"
echo ""

# Demande de confirmation
echo "⚠️  ATTENTION : Cette action va écraser les fichiers actuels !"
echo ""
echo "Fichiers qui seront restaurés :"
echo "  - js/dashboard.js (v4.8)"
echo "  - js/fiche-client-app.js (v2.4.9)"
echo "  - index.html"
echo "  - pages/fiche-client.html"
echo "  - tabs/tab-draps.html"
echo "  - sql/* (tous les scripts SQL)"
echo "  - docs/architecture/ERREURS_CRITIQUES.md"
echo ""
read -p "Continuer ? (oui/non) : " confirmation

if [ "$confirmation" != "oui" ]; then
    echo "❌ Restauration annulée"
    exit 0
fi

echo ""
echo "📦 Restauration en cours..."
echo ""

# Copier les fichiers JavaScript
echo "  → Restauration de js/..."
cp -f "$VERSION_DIR/js/dashboard.js" "$PROJECT_ROOT/js/"
cp -f "$VERSION_DIR/js/fiche-client-app.js" "$PROJECT_ROOT/js/"

# Copier les fichiers HTML
echo "  → Restauration de index.html"
cp -f "$VERSION_DIR/index.html" "$PROJECT_ROOT/"

echo "  → Restauration de pages/..."
cp -f "$VERSION_DIR/pages/fiche-client.html" "$PROJECT_ROOT/pages/"

echo "  → Restauration de tabs/..."
cp -f "$VERSION_DIR/tabs/tab-draps.html" "$PROJECT_ROOT/tabs/"

# Copier les scripts SQL
echo "  → Restauration de sql/..."
cp -rf "$VERSION_DIR/sql/"* "$PROJECT_ROOT/sql/"

# Copier la documentation
echo "  → Restauration de docs/..."
cp -rf "$VERSION_DIR/docs/"* "$PROJECT_ROOT/docs/"

echo ""
echo "✅ RESTAURATION TERMINÉE !"
echo ""
echo "📋 PROCHAINES ÉTAPES :"
echo ""
echo "1. Exécutez ce script SQL dans Supabase :"
echo "   sql/FIX_TABLES_ID_MANQUANTS_28JAN2026.sql"
echo ""
echo "2. Videz le cache du navigateur :"
echo "   Ctrl+Shift+R (Windows/Linux)"
echo "   Cmd+Shift+R (Mac)"
echo ""
echo "3. Vérifiez les versions chargées dans la console :"
echo "   - Dashboard : v4.8"
echo "   - Fiche Client : v2.4.9"
echo ""
echo "4. Testez les fonctionnalités :"
echo "   - Demandes d'horaires (création + validation)"
echo "   - Retours/Problèmes (création + traitement)"
echo ""
echo "=================================================="
echo "Version restaurée : V1.1_28JAN2026_RESTAURATION_TABLES_CLIENTS"
echo "Date : $(date '+%d/%m/%Y %H:%M:%S')"
echo "=================================================="
