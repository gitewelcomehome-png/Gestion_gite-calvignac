#!/bin/bash

# Script simple pour préparer l'exécution de la migration
# Copie le SQL et donne les instructions

SQL_FILE="sql/migrations/20260111_create_tarifs_tables.sql"
SUPABASE_URL="https://zgdjpetmnmetfkboxeyo.supabase.co"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  📋 MIGRATION TARIFS - INSTRUCTIONS                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Afficher le contenu du fichier SQL
echo "📄 Contenu du fichier SQL à exécuter:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$SQL_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Statistiques:"
echo "   • Lignes: $(wc -l < "$SQL_FILE")"
echo "   • Taille: $(du -h "$SQL_FILE" | cut -f1)"
echo "   • Tables: 3 (tarifs_base, regles_tarifaires, configuration_calendrier)"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🎯 ÉTAPES À SUIVRE                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Ouvrez: ${SUPABASE_URL}/project/_/sql"
echo ""
echo "2. Dans le SQL Editor, créez une nouvelle requête"
echo ""
echo "3. Copiez TOUT le contenu ci-dessus (de -- ======= jusqu'à END)"
echo ""
echo "4. Collez dans le SQL Editor"
echo ""
echo "5. Cliquez sur RUN (ou Ctrl+Enter)"
echo ""
echo "6. Vérifiez le message de succès dans les logs"
echo ""
echo "✅ Après exécution, rafraîchissez votre application web"
echo ""

# Essayer de copier dans le presse-papier (si xclip est disponible)
if command -v xclip &> /dev/null; then
    cat "$SQL_FILE" | xclip -selection clipboard
    echo "📋 Le SQL a été copié dans votre presse-papier !"
    echo "   Vous pouvez directement le coller (Ctrl+V) dans Supabase"
    echo ""
elif command -v pbcopy &> /dev/null; then
    cat "$SQL_FILE" | pbcopy
    echo "📋 Le SQL a été copié dans votre presse-papier !"
    echo "   Vous pouvez directement le coller (Cmd+V) dans Supabase"
    echo ""
fi

# Ouvrir le navigateur (si possible)
if command -v xdg-open &> /dev/null; then
    echo "🌐 Ouverture de Supabase SQL Editor dans votre navigateur..."
    xdg-open "${SUPABASE_URL}/project/_/sql" 2>/dev/null &
elif [ -n "$BROWSER" ]; then
    echo "🌐 Ouverture de Supabase SQL Editor dans votre navigateur..."
    "$BROWSER" "${SUPABASE_URL}/project/_/sql" 2>/dev/null &
fi

echo ""
