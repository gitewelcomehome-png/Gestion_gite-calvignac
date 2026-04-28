#!/bin/bash
# Lance un serveur local et ouvre les pages clés en mobile
echo "🧪 Test responsive mobile..."
PORT=5500
python3 -m http.server $PORT &
SERVER_PID=$!
sleep 1
echo ""
echo "Ouvre dans Chrome et active DevTools mode iPhone 12 :"
echo "  http://localhost:$PORT/index.html"
echo "  http://localhost:$PORT/app.html"
echo "  http://localhost:$PORT/pages/fiche-client.html?token=b638c8264ac2426bfd2ed1ade9f074113ecb40882d908de5b57fbb50a5b71533"
echo ""
echo "Ctrl+C pour arrêter le serveur."
wait $SERVER_PID
