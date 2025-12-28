#!/bin/bash

# Script pour créer la table commits_log dans Supabase via API SQL

SUPABASE_URL="https://eaclmrwczfqqxmgpbqmo.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhY2xtcndjemZxcXhtZ3BicW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjM4NDUsImV4cCI6MjA1MDUzOTg0NX0.oWnZf_T9VFUP13VGDzW4RaEdXHyYn1-vVPOVOlZeHbU"

echo "🔧 Création de la table commits_log dans Supabase..."
echo ""

# SQL pour créer la table
SQL_QUERY="CREATE TABLE IF NOT EXISTS commits_log (
    id SERIAL PRIMARY KEY,
    commit_ref VARCHAR(40) NOT NULL,
    commit_date TIMESTAMP NOT NULL DEFAULT NOW(),
    resume TEXT NOT NULL,
    author VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commits_log_date ON commits_log(commit_date DESC);"

# Essayer de créer via l'API Database (si disponible)
echo "Tentative de création via API Database..."
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$SQL_QUERY\"}" 2>&1)

echo "Réponse: $RESPONSE"
echo ""
echo "⚠️  Note: La création de table via API nécessite des permissions spéciales"
echo "📋 SOLUTION MANUELLE:"
echo ""
echo "1. Va sur https://supabase.com/dashboard/project/eaclmrwczfqqxmgpbqmo"
echo "2. Clique sur 'SQL Editor' dans le menu de gauche"
echo "3. Clique sur 'New Query'"
echo "4. Copie-colle ce SQL:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
CREATE TABLE IF NOT EXISTS commits_log (
    id SERIAL PRIMARY KEY,
    commit_ref VARCHAR(40) NOT NULL,
    commit_date TIMESTAMP NOT NULL DEFAULT NOW(),
    resume TEXT NOT NULL,
    author VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commits_log_date ON commits_log(commit_date DESC);

-- Insérer le dernier commit
INSERT INTO commits_log (commit_ref, commit_date, resume, author) 
VALUES ('c2560b3', '2025-12-26 20:04:53', '🔧 Fix: Scripts logging commits + table SQL mise à jour', 'gitewelcomehome-png');
EOF
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "5. Clique sur 'Run' (ou Ctrl+Enter)"
echo "6. Reviens tester avec: ./test_supabase_commit.sh"
