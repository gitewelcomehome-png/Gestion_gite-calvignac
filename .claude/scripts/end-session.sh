#!/bin/bash
DATE=$(date '+%Y-%m-%d')
BRANCH=$(git branch --show-current)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🏁 Fin de session $DATE — $BRANCH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 COMMITS de cette session :"
git log --oneline --since="8 hours ago"
echo ""
echo "📋 Étapes finales :"
echo "  1. Édite .claude/memory/session-latest.md"
echo "  2. git add .claude/memory/ && git commit -m 'chore: update session memory'"
echo "  3. git push origin $BRANCH"
echo ""
git push origin $BRANCH 2>&1 | tail -3
echo ""
echo "✅ Push terminé. Pense à mettre à jour session-latest.md !"
