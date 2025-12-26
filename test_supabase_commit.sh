#!/bin/bash

# Script pour insérer le dernier commit dans Supabase via API REST
# À exécuter APRÈS avoir créé la table commits_log dans Supabase

SUPABASE_URL="https://eaclmrwczfqqxmgpbqmo.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhY2xtcndjemZxcXhtZ3BicW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjM4NDUsImV4cCI6MjA1MDUzOTg0NX0.oWnZf_T9VFUP13VGDzW4RaEdXHyYn1-vVPOVOlZeHbU"

echo "📝 =========================================="
echo "   TEST CONNEXION SUPABASE"
echo "=========================================="
echo ""

# Test 1: Vérifier si la table existe
echo "1️⃣ Test si la table commits_log existe..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  "$SUPABASE_URL/rest/v1/commits_log?limit=1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Table commits_log existe et est accessible"
    echo "   Nombre de commits: $(echo $BODY | grep -o '\[' | wc -l)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Erreur 404: La table commits_log n'existe PAS"
    echo "   👉 Va sur Supabase SQL Editor et exécute: sql/create_commits_log_table.sql"
    exit 1
else
    echo "❌ Erreur $HTTP_CODE"
    echo "   Réponse: $BODY"
    exit 1
fi

echo ""
echo "2️⃣ Récupération du dernier commit Git..."

# Récupérer les infos du dernier commit
COMMIT_REF=$(git log -1 --format=%h)
COMMIT_DATE=$(git log -1 --format=%ai)
RESUME=$(git log -1 --format=%s)
AUTHOR=$(git log -1 --format=%an)

echo "   Ref: $COMMIT_REF"
echo "   Date: $COMMIT_DATE"
echo "   Auteur: $AUTHOR"
echo "   Résumé: $RESUME"

echo ""
echo "3️⃣ Insertion dans Supabase..."

# Échapper les caractères spéciaux pour JSON
RESUME_ESCAPED=$(echo "$RESUME" | sed 's/"/\\"/g' | sed "s/'/\\'/g")

# Créer le JSON
JSON_DATA="{\"commit_ref\":\"$COMMIT_REF\",\"commit_date\":\"$COMMIT_DATE\",\"resume\":\"$RESUME_ESCAPED\",\"author\":\"$AUTHOR\"}"

# Envoyer à Supabase
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "$SUPABASE_URL/rest/v1/commits_log" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "$JSON_DATA" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Commit enregistré avec succès!"
elif [ -z "$HTTP_CODE" ]; then
    echo "⚠️  Pas de code HTTP reçu (peut-être déjà inséré)"
else
    echo "❌ Erreur $HTTP_CODE"
    echo "   Réponse: $BODY"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ TEST TERMINÉ AVEC SUCCÈS"
echo "=========================================="
echo ""
echo "Le bouton 'Dernier commit' devrait maintenant fonctionner!"
