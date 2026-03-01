#!/bin/bash

# ===================================================================
# 🚀 SCRIPT DE DÉPLOIEMENT RAPIDE VERCEL
# ===================================================================
# Ce script facilite le déploiement sur Vercel
# Usage : ./deploy.sh [production|preview]
# ===================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 DÉPLOIEMENT VERCEL                ║${NC}"
echo -e "${BLUE}║   Gestion Gîte Calvignac              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI n'est pas installé${NC}"
    echo -e "${YELLOW}Installation automatique...${NC}"
    npm i -g vercel
    echo -e "${GREEN}✅ Vercel CLI installé${NC}"
fi

# Type de déploiement
DEPLOY_TYPE=${1:-preview}

if [ "$DEPLOY_TYPE" = "production" ] || [ "$DEPLOY_TYPE" = "prod" ]; then
    echo -e "${YELLOW}📦 Déploiement en PRODUCTION${NC}"
    DEPLOY_CMD="vercel --prod"
else
    echo -e "${YELLOW}🔍 Déploiement en PREVIEW${NC}"
    DEPLOY_CMD="vercel"
fi

echo ""

# Vérifier les modifications Git
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Modifications non commitées détectées${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Voulez-vous commiter avant de déployer ? (o/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        read -p "Message du commit : " commit_message
        git add .
        git commit -m "$commit_message"
        git push origin main
        echo -e "${GREEN}✅ Changements committés et pushés${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🚀 Lancement du déploiement...${NC}"
echo ""

# Exécuter le déploiement
eval $DEPLOY_CMD

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ DÉPLOIEMENT TERMINÉ               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Afficher les prochaines étapes
if [ "$DEPLOY_TYPE" = "production" ] || [ "$DEPLOY_TYPE" = "prod" ]; then
    echo -e "${BLUE}📋 Prochaines étapes :${NC}"
    echo ""
    echo "  1. Ouvrez votre site en production"
    echo "  2. Testez les fonctionnalités principales :"
    echo "     • Connexion utilisateur"
    echo "     • Info Gîtes + IA (bouton ✨)"
    echo "     • Calendrier et réservations"
    echo ""
    echo -e "${YELLOW}📊 Monitoring :${NC}"
    echo "  • Vercel Dashboard : https://vercel.com/dashboard"
    echo "  • OpenAI Usage : https://platform.openai.com/usage"
    echo "  • Supabase Logs : https://supabase.com/dashboard"
    echo ""
fi

echo -e "${GREEN}🎉 Tout est prêt !${NC}"
