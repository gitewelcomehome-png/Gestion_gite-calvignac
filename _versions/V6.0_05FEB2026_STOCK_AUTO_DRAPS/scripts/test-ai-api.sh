#!/bin/bash

# ==========================================
# 🧪 Script de Test - API OpenAI
# ==========================================

echo "🧪 Test de l'API OpenAI..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si l'environnement local existe
if [ -f ".env.local" ]; then
    echo "✅ Fichier .env.local trouvé"
else
    echo "⚠️  Fichier .env.local non trouvé"
    echo "   Créez-le avec: cp .env.example .env.local"
    echo "   Puis ajoutez votre OPENAI_API_KEY"
    exit 1
fi

echo ""
echo "🚀 Démarrage du serveur Vercel Dev..."
echo "   (Ctrl+C pour arrêter après le test)"
echo ""

# Démarrer vercel dev en arrière-plan
vercel dev --listen 3000 &
VERCEL_PID=$!

# Attendre que le serveur démarre
sleep 5

echo ""
echo "📡 Test de l'endpoint /api/openai..."
echo ""

# Faire une requête de test
RESPONSE=$(curl -s -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Écris une phrase sur les gîtes de Calvignac", "maxTokens": 50}')

# Vérifier la réponse
if echo "$RESPONSE" | grep -q "content"; then
    echo -e "${GREEN}✅ API fonctionne !${NC}"
    echo ""
    echo "📝 Réponse:"
    echo "$RESPONSE" | python3 -m json.tool
else
    echo -e "${RED}❌ Erreur API${NC}"
    echo ""
    echo "📝 Réponse brute:"
    echo "$RESPONSE"
fi

echo ""
echo "🛑 Arrêt du serveur..."
kill $VERCEL_PID 2>/dev/null

echo ""
echo "✅ Test terminé"
