#!/usr/bin/env python3
"""
Script de nettoyage des références aux tables obsolètes dans le code JavaScript
Date: 23 Janvier 2026
Tables concernées: retours_menage, demandes_horaires, problemes_signales, suivi_soldes_bancaires
"""

import re
import os

# Liste des fichiers à nettoyer
fichiers_a_nettoyer = [
    'js/dashboard.js',
    'js/widget-horaires-clients.js',
    'js/fiches-clients.js',
    'js/fiscalite-v2.js'
]

# Tables à rechercher
tables_obsoletes = [
    'retours_menage',
    'demandes_horaires',
    'problemes_signales',
    'suivi_soldes_bancaires'
]

def nettoyer_fichier(filepath):
    """Nettoie un fichier JS en commentant les appels aux tables obsolètes"""
    print(f"\n📝 Traitement de {filepath}...")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            contenu = f.read()
        
        contenu_original = contenu
        modifications = 0
        
        # Pattern pour capturer les appels aux tables
        for table in tables_obsoletes:
            # Pattern 1: from('table_name')
            pattern1 = rf"\.from\('{table}'\)"
            if re.search(pattern1, contenu):
                print(f"   ✓ Trouvé .from('{table}')")
                modifications += len(re.findall(pattern1, contenu))
            
            # Pattern 2: console.error avec mention de la table
            pattern2 = rf"console\.error\([^)]*{table}[^)]*\)"
            if re.search(pattern2, contenu):
                print(f"   ✓ Trouvé console.error mentionnant '{table}'")
        
        # Compter les catch blocks qui loggent ces erreurs
        catches_obsoletes = re.findall(r"console\.error\('❌ Erreur (chargement|update|traitement) (demandes|problèmes|retours|soldes)", contenu)
        
        print(f"\n   📊 Statistiques:")
        print(f"      - {modifications} appels directs aux tables obsolètes")
        print(f"      - {len(catches_obsoletes)} blocs catch liés")
        
        # Ne pas modifier le fichier, juste reporter
        return modifications
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return 0

def main():
    print("=" * 70)
    print("🧹 NETTOYAGE DES RÉFÉRENCES AUX TABLES OBSOLÈTES")
    print("=" * 70)
    
    total_modifications = 0
    
    for fichier in fichiers_a_nettoyer:
        filepath = f"/workspaces/Gestion_gite-calvignac/{fichier}"
        if os.path.exists(filepath):
            mods = nettoyer_fichier(filepath)
            total_modifications += mods
        else:
            print(f"\n⚠️  {fichier} introuvable")
    
    print("\n" + "=" * 70)
    print(f"✅ Analyse terminée : {total_modifications} références trouvées au total")
    print("=" * 70)
    print("\n💡 Pour effectuer le nettoyage complet, utiliser:")
    print("   - Commentage manuel des fonctions obsolètes")
    print("   - Suppression des appels dans updateDashboard*() et init()")
    print("   - Vérification console 0 erreur 404")

if __name__ == "__main__":
    main()
