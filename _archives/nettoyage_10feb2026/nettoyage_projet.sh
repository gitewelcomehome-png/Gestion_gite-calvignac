#!/bin/bash
# Script de nettoyage du projet - 10 Février 2026
# Supprime les fichiers SQL de test, HTML de test, et MD temporaires

set -e

PROJECT_ROOT="/workspaces/Gestion_gite-calvignac"
ARCHIVE_DIR="$PROJECT_ROOT/_archives/nettoyage_10feb2026"

echo "🧹 Nettoyage du projet Gestion Gîte Calvignac"
echo "=============================================="

# Créer le dossier d'archive
mkdir -p "$ARCHIVE_DIR/sql"
mkdir -p "$ARCHIVE_DIR/html"
mkdir -p "$ARCHIVE_DIR/md"

echo ""
echo "📁 Archivage des fichiers SQL de test/debug..."

# Fichiers SQL de test à archiver
SQL_FILES_TO_ARCHIVE=(
    "sql/diagnostic_promotions_trevoux.sql"
    "sql/inspect_tarifs_format.sql"
    "sql/verify_and_load_tarifs.sql"
    "sql/parrainage_test_data.sql"
    "sql/verify_shopping_tables.sql"
    "sql/parrainage_campaigns_test_data.sql"
    "sql/debug_auth.sql"
    "sql/DIAGNOSTIC_IA.sql"
    "sql/DEBUG_STRUCTURE_DEMANDES_28JAN2026.sql"
    "sql/TEST_CHANNEL_MANAGER_TABLES.sql"
    "sql/TEST_CREATE_TICKET.sql"
    "sql/VERIFY_CLIENT_POLICIES.sql"
    "sql/verifier_promotions_existantes.sql"
    "sql/requetes_fiscal_history.sql"
    "sql/log_correction_07feb2026.sql"
)

for file in "${SQL_FILES_TO_ARCHIVE[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        mv "$PROJECT_ROOT/$file" "$ARCHIVE_DIR/sql/"
        echo "  ✓ Archivé: $file"
    fi
done

echo ""
echo "📄 Archivage des fichiers HTML de test hors _archives..."

# Fichier HTML de test encore à la racine
if [ -f "$PROJECT_ROOT/pages/test-auth-shopping.html" ]; then
    mv "$PROJECT_ROOT/pages/test-auth-shopping.html" "$ARCHIVE_DIR/html/"
    echo "  ✓ Archivé: pages/test-auth-shopping.html"
fi

echo ""
echo "📝 Archivage des documents MD temporaires..."

# Documents MD temporaires/obsolètes
MD_FILES_TO_ARCHIVE=(
    "CORRECTION_ERREURS_CONSOLE_06FEB2026.md"
)

for file in "${MD_FILES_TO_ARCHIVE[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        mv "$PROJECT_ROOT/$file" "$ARCHIVE_DIR/md/"
        echo "  ✓ Archivé: $file"
    fi
done

echo ""
echo "🗑️  Suppression des fichiers SQL redondants dans _archives..."

# Supprimer les SQL redondants dans _archives (déjà sauvegardés dans _backups)
if [ -d "$PROJECT_ROOT/_archives/sql_20jan2026" ]; then
    echo "  ✓ Suppression de _archives/sql_20jan2026 (sauvegardé dans _backups)"
    rm -rf "$PROJECT_ROOT/_archives/sql_20jan2026"
fi

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "📊 Résumé:"
echo "  - Fichiers SQL archivés: ${#SQL_FILES_TO_ARCHIVE[@]}"
echo "  - Fichiers HTML archivés"
echo "  - Fichiers MD archivés: ${#MD_FILES_TO_ARCHIVE[@]}"
echo ""
echo "📦 Archive créée dans: $ARCHIVE_DIR"
