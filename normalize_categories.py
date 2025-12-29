#!/usr/bin/env python3
"""
Normalise les catégories du fichier SQL pour qu'elles correspondent
aux filtres de l'interface : Restaurant, Musée, Café, Parc, Hôtel, Bar, Santé, Alimentation
"""

import re

# Mapping des catégories
CATEGORY_MAPPING = {
    '🏛️ Site Touristique': 'Musée',
    '🎭 Culture': 'Musée',
    '🌳 Nature & Randonnée': 'Parc',
    '🍽️ Restaurant': 'Restaurant',
    '☕ Café & Bar': 'Café',
    '☕ Bar': 'Bar',
    '🏨 Hébergement': 'Hôtel',
    '💊 Santé': 'Santé',
    '🏥 Santé': 'Santé',
    '⛽ Services': 'Alimentation',  # Stations-service → Alimentation (commerce)
    '🔧 Services': 'Alimentation',  # Garages → Alimentation (commerce)
    '🛒 Commerces': 'Alimentation',
    '🥖 Boulangerie': 'Alimentation',
    '📚 Culture': 'Musée',
    '⛪ Sites': 'Musée',
    '⚽ Sport & Loisirs': 'Parc',
}

def normalize_sql_file(input_file, output_file):
    """Normalise les catégories dans le fichier SQL"""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remplacer chaque catégorie
    for old_cat, new_cat in CATEGORY_MAPPING.items():
        # Pattern: ', 'old_cat', '
        pattern = f", '{re.escape(old_cat)}', "
        replacement = f", '{new_cat}', "
        content = content.replace(pattern, replacement)
    
    # Écrire le résultat
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fichier normalisé écrit dans {output_file}")
    
    # Statistiques des catégories
    categories = {}
    for line in content.split('\n'):
        if line.startswith("('Trévoux'") or line.startswith("('Couzon'"):
            # Extraire la catégorie (3ème champ)
            match = re.search(r"', '([^']+)', '", line)
            if match:
                cat = match.group(1)
                categories[cat] = categories.get(cat, 0) + 1
    
    print("\n📊 Catégories après normalisation:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    
    total = sum(categories.values())
    print(f"\n📈 Total: {total} entrées")
    
    # Vérifier si toutes les catégories sont valides
    valid_cats = {'Restaurant', 'Musée', 'Café', 'Parc', 'Hôtel', 'Bar', 'Santé', 'Alimentation'}
    invalid = set(categories.keys()) - valid_cats
    if invalid:
        print(f"\n⚠️  Catégories non reconnues: {invalid}")
    else:
        print(f"\n✅ Toutes les catégories sont valides!")

if __name__ == '__main__':
    input_file = '/workspaces/Gestion_gite-calvignac/sql/insert_activites_verifiees_2025.sql'
    output_file = '/workspaces/Gestion_gite-calvignac/sql/insert_activites_verifiees_2025_normalized.sql'
    normalize_sql_file(input_file, output_file)
