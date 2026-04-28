#!/bin/bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 Audit rapide $(date '+%Y-%m-%d %H:%M')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Fichiers JS modifiés (7 jours) :"
find js/ pages/ -name "*.js" -mtime -7 2>/dev/null | sort
echo ""
echo "⚠️  TODO/FIXME dans le code :"
grep -rn "TODO\|FIXME\|HACK" js/ pages/ --include="*.js" | head -15
echo ""
echo "📏 Taille fichiers JS principaux :"
wc -l js/*.js 2>/dev/null | sort -rn | head -10
echo ""
echo "✅ Audit terminé. Audit complet : debug-liveownerunit skill Cowork"
