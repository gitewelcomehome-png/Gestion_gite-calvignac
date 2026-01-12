#!/bin/bash

# Script pour appliquer la migration sur Supabase
# Usage: ./apply-migration.sh

set -e

MIGRATION_FILE="sql/migrations/20260108_add_gites_columns.sql"

echo "🔧 Application de la migration : $MIGRATION_FILE"
echo ""

# Lire les variables d'environnement
if [ -f "config.local.js" ]; then
    echo "📖 Lecture de config.local.js..."
    SUPABASE_URL=$(grep "supabaseUrl:" config.local.js | sed "s/.*supabaseUrl: '\(.*\)'.*/\1/")
    SUPABASE_KEY=$(grep "supabaseAnonKey:" config.local.js | sed "s/.*supabaseAnonKey: '\(.*\)'.*/\1/")
fi

echo "🌐 Supabase URL: $SUPABASE_URL"
echo ""
echo "📝 Contenu de la migration:"
cat "$MIGRATION_FILE"
echo ""
echo "================================================"
echo ""
echo "⚠️  Cette migration doit être exécutée dans le SQL Editor de Supabase"
echo "   👉 https://supabase.com/dashboard/project/zgdjpetmnmetfkboxeyo/sql"
echo ""
echo "📋 Copie le SQL ci-dessus et exécute-le dans le SQL Editor"
echo ""
