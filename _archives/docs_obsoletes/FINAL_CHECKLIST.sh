#!/bin/bash
# Script de déploiement et vérification - Gestion Gîtes

echo "🚀 GUIDE DE FINALISATION - GESTION GÎTES CALVIGNAC"
echo "=================================================="
echo ""

# ========================================
# 1. DÉPLOIEMENT VERCEL
# ========================================
echo "✅ 1. DÉPLOIEMENT VERCEL"
echo "----------------------------------------"
echo ""
echo "   Fichiers prêts dans : vercel-deploy/"
echo "   ├─ index.html (454 Ko) ✓"
echo "   ├─ validation.html (29 Ko) ✓"
echo "   └─ vercel.json ✓"
echo ""
echo "   À faire sur votre ordinateur :"
echo "   1. Téléchargez le dossier 'vercel-deploy/' depuis VS Code"
echo "   2. Allez sur https://vercel.com/"
echo "   3. Cliquez 'Add New' → 'Upload'"
echo "   4. Glissez-déposez le dossier"
echo "   5. Votre site est en ligne ! 🎉"
echo ""

# ========================================
# 2. VALIDATION DES INTERFACES
# ========================================
echo "✅ 2. VALIDATION SYSTÈME MÉNAGES"
echo "----------------------------------------"
echo ""
echo "   ✓ Interface Société (validation.html)"
echo "     - Proposition automatique de dates"
echo "     - Détection de conflits (jour même)"
echo "     - Boutons rapides"
echo ""
echo "   ✓ Interface Propriétaire (index.html)"
echo "     - Badge de notification (onglet Planning Ménage)"
echo "     - Alerte jaune pour propositions"
echo "     - Approbation/Refus bidirectionnel"
echo ""

# ========================================
# 3. GÉOCODAGE DES ACTIVITÉS
# ========================================
echo "✅ 3. GÉOCODAGE DES ACTIVITÉS"
echo "----------------------------------------"
echo ""
echo "   ⚠️  Nota: Le script doit s'exécuter de votre ordinateur"
echo "   (Le conteneur n'a pas accès à internet)"
echo ""
echo "   À faire sur votre ordinateur :"
echo "   1. Téléchargez 'geocode_missing.js'"
echo "   2. Ouvrez un terminal"
echo "   3. Exécutez :"
echo ""
echo "      node geocode_missing.js"
echo ""
echo "   Le script va :"
echo "   - Récupérer les activités sans coordonnées"
echo "   - Géocoder automatiquement chacune"
echo "   - Mettre à jour Supabase"
echo "   - Afficher un rapport complet"
echo ""
echo "   Log généré : geocode_log.txt"
echo ""

# ========================================
# RÉSUMÉ
# ========================================
echo ""
echo "=================================================="
echo "📋 RÉSUMÉ DES TÂCHES"
echo "=================================================="
echo ""
echo "✅ Fichiers Vercel préparés"
echo "✅ Système validation ménages implémenté"
echo "✅ Script géocodage optimisé"
echo ""
echo "🎯 PROCHAINES ÉTAPES :"
echo ""
echo "1️⃣  Déployer sur Vercel (voir instructions ci-dessus)"
echo "2️⃣  Exécuter geocode_missing.js sur votre ordinateur"
echo "3️⃣  Vérifier le dashboard Supabase"
echo ""
echo "=================================================="
