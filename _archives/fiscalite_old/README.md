# Archives - Anciennes versions Fiscalité/Charges

**Date d'archivage :** 1er janvier 2025

## Fichiers archivés

### 1. `tab-fiscalite.html` (23.9 KB)
- Ancienne version du calculateur fiscal LMP
- Remplacée par `tab-fiscalite-v2.html`
- Raison : Passage à version avec support 2 propriétés (Couzon + Trévoux)

### 2. `fiscalite.js` (26.6 KB)
- Ancien moteur de calcul fiscal
- Remplacé par `fiscalite-v2.js`
- Raison : Refonte complète pour dual properties + listes dynamiques

### 3. `tab-charges.html` (7 KB)
- Ancienne page "Charges et rentabilité"
- Complètement remplacée par le calculateur fiscal LMP
- Raison : L'onglet "Charges" est devenu "Fiscalité LMP" avec calculateur complet

## Version actuelle

### Fichiers actifs
- **tabs/tab-fiscalite-v2.html** (37 KB) - Interface complète avec blocs collapsibles
- **js/fiscalite-v2.js** (38 KB) - Moteur de calcul avec URSSAF + IR 2024
- **sql/create_fiscalite_table.sql** - Schéma BDD avec JSONB

### Fonctionnalités ajoutées
- ✅ Support 2 propriétés (Couzon + Trévoux)
- ✅ Listes dynamiques (travaux, frais divers, produits)
- ✅ Calcul URSSAF en temps réel
- ✅ Alerte seuil retraite (7046€)
- ✅ Calculateur IR avec barème progressif 2024
- ✅ Interface collapsible (10 sections réductibles)
- ✅ Section IR repositionnée à la fin

## Restauration

Si besoin de récupérer une ancienne version :
```bash
cp _archives/fiscalite_old/[fichier] [destination]
```

**⚠️ Attention :** Les anciennes versions ne sont plus compatibles avec le schéma BDD actuel.
