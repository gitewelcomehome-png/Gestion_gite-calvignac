#!/bin/bash
# 🚀 SCRIPT DE DÉMARRAGE RAPIDE
# Exécutez ce fichier pour voir toutes les étapes

echo "=================================================="
echo "🌍 SYSTÈME COMPLET GÉOCODAGE + POIs"
echo "🏠 Gîtes de Calvignac - Trévoux & Couzon"
echo "=================================================="
echo ""

# Vérifier Node.js
echo "✅ Vérification préalable..."
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "📥 Installez-le: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js $(node --version) installé"
echo ""

# Afficher le statut des fichiers
echo "=================================================="
echo "📋 FICHIERS DISPONIBLES"
echo "=================================================="
echo ""

echo "Scripts Node.js:"
for file in geocode_missing.js search_pois.js configure_gites.js process_all.js; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MANQUANT)"
    fi
done

echo ""
echo "Fichiers SQL:"
for file in sql/create_activites_table.sql sql/example_insert_pois.sql; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MANQUANT)"
    fi
done

echo ""
echo "Documentation:"
for file in GUIDE_POIS_COMPLET.md README_SCRIPTS.md; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MANQUANT)"
    fi
done

echo ""
echo "=================================================="
echo "🚀 PRÊT À DÉMARRER?"
echo "=================================================="
echo ""
echo "OPTION 1: Mode Automatique (Recommandé)"
echo "  → Exécutez: node process_all.js"
echo "  → Durée: 15-25 minutes"
echo "  → Inclut: Géocodage + Recherche POIs + SQL"
echo ""
echo "OPTION 2: Mode Manuel"
echo "  1️⃣  node configure_gites.js (2 min)"
echo "     → Récupère les coordonnées réelles"
echo ""
echo "  2️⃣  node geocode_missing.js (5-10 min)"
echo "     → Géocoder les activités"
echo ""
echo "  3️⃣  node search_pois.js (2-5 min)"
echo "     → Chercher 100+ POIs par gîte"
echo ""
echo "OPTION 3: Lecture de la Documentation"
echo "  → Lisez: GUIDE_POIS_COMPLET.md"
echo "  → Ou: README_SCRIPTS.md"
echo ""
echo "=================================================="
echo "📊 INFORMATIONS"
echo "=================================================="
echo ""
echo "Gîtes à traiter:"
echo "  • Trévoux"
echo "  • Couzon"
echo ""
echo "Rayon de recherche: 25 km"
echo ""
echo "Catégories POIs: 23"
echo "  • Restaurants, Cafés, Hôtels"
echo "  • Musées, Châteaux, Églises"
echo "  • Parcs, Randonnée, Sports"
echo "  • Pratique (gare, pharmacie, parking)"
echo "  • Et plus..."
echo ""
echo "POIs estimés: 200-400 par gîte"
echo ""
echo "=================================================="
echo ""
echo "💡 TIP: Commencez par configure_gites.js"
echo ""
