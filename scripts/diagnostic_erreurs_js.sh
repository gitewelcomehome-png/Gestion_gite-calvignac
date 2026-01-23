#!/bin/bash
# Script de diagnostic complet des erreurs JavaScript
# 23 Janvier 2026

echo "════════════════════════════════════════════════════════════"
echo "🔍 DIAGNOSTIC ERREURS JAVASCRIPT"
echo "════════════════════════════════════════════════════════════"
echo ""

# 1. Vérifier la syntaxe de tous les fichiers JS
echo "📝 Vérification syntaxe des fichiers JS principaux..."
errors=0

for file in js/dashboard.js js/decouvrir.js js/reservations.js js/fiscalite-v2.js js/fiches-clients.js js/fiche-client-app.js; do
    if [ -f "$file" ]; then
        if node -c "$file" 2>/dev/null; then
            echo "   ✅ $file"
        else
            echo "   ❌ $file - ERREUR DE SYNTAXE"
            ((errors++))
        fi
    else
        echo "   ⚠️  $file - FICHIER MANQUANT"
        ((errors++))
    fi
done

echo ""

# 2. Vérifier les fichiers référencés dans index.html
echo "📄 Vérification des scripts dans index.html..."
missing=0

grep -o 'src="js/[^"]*\.js' index.html | cut -d'"' -f2 | while read script; do
    if [ ! -f "$script" ]; then
        echo "   ⚠️  $script - MANQUANT"
        ((missing++))
    fi
done

if [ $missing -eq 0 ]; then
    echo "   ✅ Tous les scripts référencés existent"
fi

echo ""

# 3. Vérifier le serveur
echo "🌐 Vérification du serveur..."
if lsof -i :5504 >/dev/null 2>&1; then
    echo "   ✅ Serveur actif sur port 5504"
else
    echo "   ❌ Aucun serveur sur port 5504"
fi

echo ""

# 4. Résumé
echo "════════════════════════════════════════════════════════════"
if [ $errors -eq 0 ]; then
    echo "✅ DIAGNOSTIC: Aucune erreur de syntaxe détectée"
    echo ""
    echo "💡 Solutions pour erreur 502 Bad Gateway:"
    echo "   1. Vider le cache du navigateur (Ctrl+Shift+R)"
    echo "   2. Redémarrer le serveur de développement"
    echo "   3. Forcer le rechargement sans cache (Ctrl+F5)"
    echo "   4. Vérifier la console pour d'autres erreurs"
else
    echo "❌ DIAGNOSTIC: $errors erreur(s) détectée(s)"
    echo ""
    echo "🔧 Corriger les erreurs ci-dessus avant de continuer"
fi
echo "════════════════════════════════════════════════════════════"
