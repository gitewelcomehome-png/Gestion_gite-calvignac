#!/bin/bash

# Script d'insertion du dernier commit dans Supabase via API REST
# Plus fiable que le client Node.js dans un environnement dev container

SUPABASE_URL="https://eaclmrwczfqqxmgpbqmo.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhY2xtcndjemZxcXhtZ3BicW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjM4NDUsImV4cCI6MjA1MDUzOTg0NX0.oWnZf_T9VFUP13VGDzW4RaEdXHyYn1-vVPOVOlZeHbU"

# Récupérer les infos du dernier commit
COMMIT_REF=$(git log -1 --format=%h)
COMMIT_DATE=$(git log -1 --format=%ai)
RESUME=$(git log -1 --format=%s)
AUTHOR=$(git log -1 --format=%an)

echo "📝 Enregistrement du commit dans Supabase..."
echo "  Ref: $COMMIT_REF"
echo "  Date: $COMMIT_DATE"
echo "  Auteur: $AUTHOR"
echo "  Résumé: $RESUME"

# Échapper les caractères spéciaux pour JSON
RESUME_ESCAPED=$(echo "$RESUME" | sed 's/"/\\"/g' | sed "s/'/\\'/g")

# Créer le JSON
JSON_DATA=$(cat <<EOF
{
  "commit_ref": "$COMMIT_REF",
  "commit_date": "$COMMIT_DATE",
  "resume": "$RESUME_ESCAPED",
  "author": "$AUTHOR"
}
EOF
)

# Envoyer à Supabase via API REST
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/commits_log" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "$JSON_DATA")

if [ $? -eq 0 ]; then
    echo "✅ Commit enregistré dans Supabase"
    exit 0
else
    echo "❌ Erreur lors de l'enregistrement"
    echo "$RESPONSE"
    exit 1
fi
