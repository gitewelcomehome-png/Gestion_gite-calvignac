# Archive CSS - 25 janvier 2026

## 📦 Contenu de l'Archive

Cette archive contient **tous les fichiers CSS** avant la consolidation unique.

### Fichiers Archivés

| Fichier | Taille | Usage Avant Archive |
|---------|--------|---------------------|
| **upstay-unique.css** | 31K | CSS principal de index.html - **BASE DE CONSOLIDATION** |
| **icalou-modern.css** | 36K | Thèmes iCalou modernes |
| **flat-outline.css** | 23K | Style flat pour pages login/logout |
| **themes-override.css** | 19K | Surcharges de thèmes |
| **fiscalite-neo.css** | 19K | Styles spécifiques fiscalité |
| **main-inline.css** | 19K | Styles inline historiques |
| **themes-icalou.css** | 15K | Thèmes iCalou originaux |
| **gites-form.css** | 12K | Formulaires gîtes |
| **remplissage-auto.css** | 5.5K | Auto-fill réservations |
| **icons.css** | 3.2K | Icônes personnalisées |
| **header-colonne.css** | 1.4K | Header en colonne |
| **themes-preload.css** | 500B | Pre-loading thèmes |

### 📊 Total
- **13 fichiers CSS** (+ 1 backup)
- **~228 Ko** de CSS au total

## 🎯 Objectif de la Consolidation

**Créer UN SEUL fichier CSS** : `main.css`

### Stratégie
1. **Base** : upstay-unique.css (déjà bien structuré)
2. **Fusion** : Intégrer les éléments essentiels des autres CSS
3. **Élimination** : Supprimer les doublons et styles obsolètes
4. **Organisation** : Structure claire par sections

### Résultat Attendu
- ✅ Un seul CSS pour toute l'application
- ✅ Taille réduite (objectif < 40Ko)
- ✅ Performance améliorée
- ✅ Maintenance simplifiée

## ⚠️ Important

Cette archive permet un **rollback complet** en cas de problème.

Pour restaurer :
```bash
cp -r _archives/css_20260125/* css/
```

---

**Date d'archivage :** 25 janvier 2026 19:40  
**Archivé par :** Copilot  
**Raison :** Consolidation CSS unique
