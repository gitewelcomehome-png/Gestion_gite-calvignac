#!/bin/bash

# ===================================================================
# 🧪 SCRIPT DE TEST POST-DÉPLOIEMENT
# ===================================================================
# Teste automatiquement les fonctionnalités après déploiement
# Usage : ./test-deployment.sh <url-du-site>
# Exemple : ./test-deployment.sh https://gestion-gite-calvignac.vercel.app
# ===================================================================

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# URL du site
SITE_URL=${1:-"https://gestion-gite-calvignac.vercel.app"}

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🧪 TEST POST-DÉPLOIEMENT            ║${NC}"
echo -e "${BLUE}║   Gestion Gîte Calvignac              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🌐 URL testée : ${SITE_URL}${NC}"
echo ""

# Fonction de test
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "• ${name}... "
    
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "${url}")
    
    if [ "$http_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✅ OK (${http_code})${NC}"
        return 0
    else
        echo -e "${RED}❌ ERREUR (${http_code})${NC}"
        return 1
    fi
}

# Compteur d'erreurs
errors=0

echo -e "${BLUE}📋 Tests des pages principales${NC}"
echo ""

test_endpoint "Page d'accueil" "${SITE_URL}" || ((errors++))
test_endpoint "Index HTML" "${SITE_URL}/index.html" || ((errors++))

echo ""
echo -e "${BLUE}📋 Tests des ressources${NC}"
echo ""

test_endpoint "CSS principal" "${SITE_URL}/css/main.css" || ((errors++))
test_endpoint "JavaScript principal" "${SITE_URL}/js/main.js" || ((errors++))
test_endpoint "Logo" "${SITE_URL}/images/logo.png" || ((errors++))

echo ""
echo -e "${BLUE}📋 Tests des APIs${NC}"
echo ""

# Test API OpenAI (doit retourner 405 car GET non supporté)
echo -n "• API OpenAI (endpoint existe)... "
http_code=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/api/openai")
if [ "$http_code" -eq "405" ] || [ "$http_code" -eq "200" ]; then
    echo -e "${GREEN}✅ OK (${http_code})${NC}"
else
    echo -e "${RED}❌ ERREUR (${http_code})${NC}"
    ((errors++))
fi

# Test webhook Abritel (doit retourner 405 car GET non supporté)
echo -n "• Webhook Abritel (endpoint existe)... "
http_code=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/api/webhooks/abritel")
if [ "$http_code" -eq "405" ] || [ "$http_code" -eq "200" ]; then
    echo -e "${GREEN}✅ OK (${http_code})${NC}"
else
    echo -e "${RED}❌ ERREUR (${http_code})${NC}"
    ((errors++))
fi

echo ""
echo -e "${BLUE}📋 Tests des onglets${NC}"
echo ""

test_endpoint "Tab Calendrier" "${SITE_URL}/tabs/tab-calendrier.html" || ((errors++))
test_endpoint "Tab Clients" "${SITE_URL}/tabs/tab-clients.html" || ((errors++))
test_endpoint "Tab Info Gîtes" "${SITE_URL}/tabs/tab-infos-gites.html" || ((errors++))

echo ""
echo -e "${BLUE}🔒 Tests de sécurité${NC}"
echo ""

# Vérifier HTTPS
echo -n "• HTTPS activé... "
if [[ $SITE_URL == https://* ]]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ ERREUR (HTTP au lieu de HTTPS)${NC}"
    ((errors++))
fi

# Vérifier que les fichiers sensibles ne sont pas accessibles
echo -n "• Fichiers .env non accessibles... "
http_code=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/.env")
if [ "$http_code" -eq "404" ]; then
    echo -e "${GREEN}✅ OK (404)${NC}"
else
    echo -e "${RED}⚠️  ATTENTION (.env accessible: ${http_code})${NC}"
    ((errors++))
fi

echo ""
echo -e "${BLUE}📊 Test de Performance${NC}"
echo ""

# Temps de réponse
echo -n "• Temps de réponse page d'accueil... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "${SITE_URL}")
response_ms=$(echo "$response_time * 1000" | bc)
response_int=${response_ms%.*}

if [ "$response_int" -lt 1000 ]; then
    echo -e "${GREEN}✅ ${response_int}ms (Excellent)${NC}"
elif [ "$response_int" -lt 3000 ]; then
    echo -e "${YELLOW}⚠️  ${response_int}ms (Acceptable)${NC}"
else
    echo -e "${RED}❌ ${response_int}ms (Lent)${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS RÉUSSIS !${NC}"
    echo ""
    echo -e "${GREEN}🎉 Votre site est opérationnel${NC}"
    echo ""
    echo -e "${BLUE}📋 Prochaines étapes :${NC}"
    echo "  1. Tester manuellement l'IA (bouton ✨)"
    echo "  2. Vérifier la connexion Supabase"
    echo "  3. Consulter les logs Vercel"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ${errors} TEST(S) ÉCHOUÉ(S)${NC}"
    echo ""
    echo -e "${YELLOW}📋 Actions recommandées :${NC}"
    echo "  1. Vérifier les logs Vercel"
    echo "  2. Vérifier les variables d'environnement"
    echo "  3. Redéployer si nécessaire"
    echo ""
    exit 1
fi
