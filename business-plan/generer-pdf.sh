#!/bin/bash
# Script rapide de génération PDF

echo "🚀 Génération du Business Plan PDF..."
echo ""

cd "$(dirname "$0")"

# Vérifier si playwright est installé
if ! python3 -c "import playwright" 2>/dev/null; then
    echo "⚠️  Playwright n'est pas installé. Installation..."
    pip3 install playwright
    playwright install chromium
    echo ""
fi

# Générer le PDF
python3 generate_pdf_playwright.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PDF généré avec succès!"
    echo "📁 Fichier: Business_Plan_Channel_Manager_GdF.pdf"
    
    # Proposer d'ouvrir
    if command -v xdg-open &> /dev/null; then
        read -p "Voulez-vous ouvrir le PDF ? (o/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[OoYy]$ ]]; then
            xdg-open "Business_Plan_Channel_Manager_GdF.pdf"
        fi
    fi
else
    echo ""
    echo "❌ Erreur lors de la génération"
    exit 1
fi
