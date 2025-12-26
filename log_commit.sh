#!/bin/bash
# Script pour enregistrer automatiquement un commit dans Supabase
# Usage: ./log_commit.sh "Message du commit"

# Récupérer les informations du dernier commit
COMMIT_REF=$(git log -1 --pretty=format:"%h")
COMMIT_MSG="$1"

# Si pas de message fourni, utiliser le message du commit
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG=$(git log -1 --pretty=format:"%s")
fi

echo "📝 Enregistrement du commit dans Supabase..."
echo "   Ref: $COMMIT_REF"
echo "   Message: $COMMIT_MSG"

# Enregistrer dans Supabase
node insert_commit_log.js "$COMMIT_REF" "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    echo "✅ Commit enregistré avec succès !"
else
    echo "❌ Erreur lors de l'enregistrement"
    exit 1
fi
