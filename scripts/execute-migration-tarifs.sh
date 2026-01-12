#!/bin/bash

# Script d'exécution de la migration SQL pour les tables de tarifs
# Date: 11 janvier 2026

SUPABASE_URL="https://zgdjpetmnmetfkboxeyo.supabase.co"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"
SQL_FILE="sql/migrations/20260111_create_tarifs_tables.sql"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 EXÉCUTION MIGRATION TARIFS                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que le fichier SQL existe
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Fichier SQL introuvable: $SQL_FILE"
    exit 1
fi

echo "📄 Fichier SQL: $SQL_FILE"
echo "🌐 Supabase URL: $SUPABASE_URL"
echo ""

# Lire le contenu du fichier SQL
SQL_CONTENT=$(cat "$SQL_FILE")

# Note: Pour exécuter via l'API Supabase, il faut la clé service (pas la clé anon)
# Cette clé se trouve dans: Supabase Dashboard → Settings → API → service_role key

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "⚠️  La variable SUPABASE_SERVICE_KEY n'est pas définie"
    echo ""
    echo "📋 INSTRUCTIONS:"
    echo "   1. Ouvrez Supabase Dashboard"
    echo "   2. Allez dans Settings → API"
    echo "   3. Copiez la 'service_role' key (secret)"
    echo "   4. Exécutez:"
    echo "      export SUPABASE_SERVICE_KEY='votre_clé_ici'"
    echo "      bash $0"
    echo ""
    echo "📌 OU utilisez directement le SQL Editor dans Supabase Dashboard"
    exit 1
fi

echo "🔑 Clé service détectée"
echo "⏳ Exécution de la migration..."
echo ""

# Exécuter via l'API Supabase
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Migration exécutée avec succès !"
    echo ""
    echo "📊 Tables créées:"
    echo "   • tarifs_base"
    echo "   • regles_tarifaires"
    echo "   • configuration_calendrier"
    echo ""
    echo "🎉 Le calendrier de tarification est maintenant opérationnel !"
else
    echo "❌ Erreur lors de l'exécution (HTTP $HTTP_CODE)"
    echo ""
    echo "📋 Réponse:"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    echo ""
    echo "💡 Solution alternative:"
    echo "   Copiez le contenu de $SQL_FILE"
    echo "   et exécutez-le dans Supabase Dashboard → SQL Editor"
fi
