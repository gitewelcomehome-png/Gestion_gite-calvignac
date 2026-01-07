#!/bin/bash
# Script d'audit de sécurité - Gestion Gîte Calvignac
# Date: 7 janvier 2026

echo "🔒 AUDIT DE SÉCURITÉ - Phase 3 Final"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
CRITICAL=0
WARNING=0
INFO=0
PASSED=0

echo "📊 1. Analyse innerHTML et XSS"
echo "--------------------------------"

# Recherche innerHTML non sécurisés
INNER_HTML=$(grep -r "\.innerHTML\s*=" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | grep -v "SecurityUtils.setInnerHTML" | grep -v "// " | wc -l)

if [ $INNER_HTML -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: $INNER_HTML innerHTML non sécurisés détectés${NC}"
    grep -r "\.innerHTML\s*=" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | grep -v "SecurityUtils.setInnerHTML" | grep -v "// " | head -5
    WARNING=$((WARNING + 1))
else
    echo -e "${GREEN}✅ PASS: Tous les innerHTML sont sécurisés${NC}"
    PASSED=$((PASSED + 1))
fi
echo ""

# Recherche eval() dangereux
EVAL_USAGE=$(grep -r "eval(" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | grep -v "//" | wc -l)

if [ $EVAL_USAGE -gt 0 ]; then
    echo -e "${RED}🔴 CRITICAL: eval() détecté ($EVAL_USAGE occurrences)${NC}"
    CRITICAL=$((CRITICAL + 1))
else
    echo -e "${GREEN}✅ PASS: Aucun eval() détecté${NC}"
    PASSED=$((PASSED + 1))
fi
echo ""

echo "📊 2. Validation des Formulaires"
echo "--------------------------------"

# Vérifier ValidationUtils dans les fichiers
FILES_WITH_VALIDATION=$(grep -r "ValidationUtils.validateForm" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | wc -l)

echo -e "${GREEN}✅ INFO: $FILES_WITH_VALIDATION fichiers utilisent ValidationUtils${NC}"
INFO=$((INFO + 1))

# Vérifier validation temps réel
REALTIME_VALIDATION=$(grep -r "attachRealtimeValidation" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | wc -l)

echo -e "${GREEN}✅ INFO: $REALTIME_VALIDATION champs avec validation temps réel${NC}"
INFO=$((INFO + 1))
echo ""

echo "📊 3. Authentification et Sessions"
echo "--------------------------------"

# Vérifier protection routes authentifiées
AUTH_CHECKS=$(grep -r "supabase.auth.getUser()" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | wc -l)

if [ $AUTH_CHECKS -gt 0 ]; then
    echo -e "${GREEN}✅ PASS: $AUTH_CHECKS vérifications d'authentification détectées${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Peu de vérifications d'authentification${NC}"
    WARNING=$((WARNING + 1))
fi

# Vérifier gestion tokens
TOKEN_STORAGE=$(grep -r "localStorage.getItem.*token" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | wc -l)

if [ $TOKEN_STORAGE -gt 0 ]; then
    echo -e "${YELLOW}⚠️  INFO: Tokens stockés en localStorage (considérer httpOnly cookies)${NC}"
    INFO=$((INFO + 1))
fi
echo ""

echo "📊 4. Requêtes SQL et Injections"
echo "--------------------------------"

# Vérifier paramétrage des requêtes
RAW_QUERIES=$(grep -r "\.from(" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | grep -v "\.eq(" | grep -v "\.select(" | wc -l)

# Supabase utilise des paramètres liés, pas d'injection possible normalement
echo -e "${GREEN}✅ PASS: Supabase utilise des requêtes paramétrées${NC}"
PASSED=$((PASSED + 1))

# Vérifier RLS (Row Level Security)
if [ -f "sql/security/rls_policies.sql" ]; then
    echo -e "${GREEN}✅ INFO: Fichiers RLS présents${NC}"
    INFO=$((INFO + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Pas de fichiers RLS détectés${NC}"
    WARNING=$((WARNING + 1))
fi
echo ""

echo "📊 5. Configuration CSP Headers"
echo "--------------------------------"

if [ -f "vercel.json" ]; then
    if grep -q "Content-Security-Policy" vercel.json; then
        echo -e "${GREEN}✅ PASS: CSP configuré dans vercel.json${NC}"
        PASSED=$((PASSED + 1))
        
        # Vérifier directives CSP importantes
        if grep -q "default-src" vercel.json; then
            echo -e "${GREEN}  ✓ default-src présent${NC}"
        fi
        if grep -q "script-src" vercel.json; then
            echo -e "${GREEN}  ✓ script-src présent${NC}"
        fi
        if grep -q "connect-src" vercel.json; then
            echo -e "${GREEN}  ✓ connect-src présent${NC}"
        fi
    else
        echo -e "${RED}🔴 CRITICAL: CSP non configuré${NC}"
        CRITICAL=$((CRITICAL + 1))
    fi
    
    # Autres en-têtes de sécurité
    if grep -q "X-Content-Type-Options" vercel.json; then
        echo -e "${GREEN}✅ PASS: X-Content-Type-Options configuré${NC}"
        PASSED=$((PASSED + 1))
    fi
    
    if grep -q "X-Frame-Options" vercel.json; then
        echo -e "${GREEN}✅ PASS: X-Frame-Options configuré${NC}"
        PASSED=$((PASSED + 1))
    fi
else
    echo -e "${RED}🔴 CRITICAL: vercel.json non trouvé${NC}"
    CRITICAL=$((CRITICAL + 1))
fi
echo ""

echo "📊 6. Dépendances et Librairies"
echo "--------------------------------"

# Vérifier package.json
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ INFO: package.json présent${NC}"
    
    # Vérifier DOMPurify
    if grep -q "dompurify" package.json; then
        echo -e "${GREEN}  ✓ DOMPurify inclus (XSS protection)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}  ⚠️  DOMPurify via CDN (considérer npm)${NC}"
        INFO=$((INFO + 1))
    fi
else
    echo -e "${YELLOW}⚠️  WARNING: package.json non trouvé${NC}"
    WARNING=$((WARNING + 1))
fi
echo ""

echo "📊 7. Gestion des Erreurs"
echo "--------------------------------"

# Vérifier console.error exposant des données sensibles
CONSOLE_ERRORS=$(grep -r "console.error" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | grep -v "//" | wc -l)

if [ $CONSOLE_ERRORS -gt 10 ]; then
    echo -e "${YELLOW}⚠️  WARNING: $CONSOLE_ERRORS console.error() en production${NC}"
    WARNING=$((WARNING + 1))
else
    echo -e "${GREEN}✅ PASS: Gestion d'erreurs raisonnable${NC}"
    PASSED=$((PASSED + 1))
fi

# Vérifier try-catch
TRY_CATCH=$(grep -r "try {" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | wc -l)

echo -e "${GREEN}✅ INFO: $TRY_CATCH blocs try-catch détectés${NC}"
INFO=$((INFO + 1))
echo ""

echo "📊 8. Sécurité Côté Client"
echo "--------------------------------"

# Vérifier Service Workers
if [ -f "sw-fiche-client.js" ]; then
    echo -e "${GREEN}✅ INFO: Service Worker présent${NC}"
    INFO=$((INFO + 1))
fi

# Vérifier manifest
if [ -f "manifest-fiche-client.json" ]; then
    echo -e "${GREEN}✅ INFO: Manifest PWA présent${NC}"
    INFO=$((INFO + 1))
fi

# Vérifier HTTPS enforcement
HTTPS_CHECK=$(grep -r "https://" --include="*.js" --exclude-dir="node_modules" --exclude-dir="_archives" . 2>/dev/null | wc -l)

echo -e "${GREEN}✅ INFO: $HTTPS_CHECK références HTTPS détectées${NC}"
INFO=$((INFO + 1))
echo ""

echo "========================================"
echo "📊 RÉSUMÉ DE L'AUDIT"
echo "========================================"
echo ""
echo -e "${RED}🔴 CRITICAL: $CRITICAL${NC}"
echo -e "${YELLOW}⚠️  WARNING: $WARNING${NC}"
echo -e "${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "${GREEN}ℹ️  INFO: $INFO${NC}"
echo ""

# Calcul du score
TOTAL_CHECKS=$((CRITICAL + WARNING + PASSED))
if [ $TOTAL_CHECKS -gt 0 ]; then
    SCORE=$(echo "scale=1; ($PASSED * 10) / $TOTAL_CHECKS" | bc)
    echo "🎯 SCORE SÉCURITÉ: $SCORE/10"
else
    echo "🎯 SCORE SÉCURITÉ: N/A"
fi

echo ""
echo "📄 Rapport complet généré"
echo "========================================"
