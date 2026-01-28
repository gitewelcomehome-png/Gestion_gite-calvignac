# 🎨 Migration Tab Fiscalité - Styles Sidebar & Apple

**Date:** 27 janvier 2026  
**Objectif:** Adapter l'onglet Fiscalité avec les styles Sidebar (neo-brutalism) et Apple (jour/nuit)

## 📋 Modifications effectuées

### 1. Création du fichier CSS dédié
**Fichier:** `/css/tab-fiscalite.css` (24K, 884 lignes)
- Styles de base communs
- Mode Sidebar (neo-brutalism)
- Mode Apple Jour (light)
- Mode Apple Nuit (dark)

### 2. Intégration dans index.html
**Ligne 183:**
```html
<link rel="stylesheet" href="css/tab-fiscalite.css?v=1.0" />
```

## 🎨 Différenciation Sidebar vs Apple

| Élément | Sidebar | Apple |
|---------|---------|-------|
| **Bordures** | Épaisses 3px noires | Fines 1.5-2px transparentes |
| **Ombres** | Plates 5px 5px décalées | Douces diffusées (blur) |
| **Radius** | 8px angles marqués | 18-20px très arrondi |
| **Typo** | Bold 900 uppercase | Light 500-600 elegante |
| **Couleurs** | Vives saturées | Douces transparence |

## ✅ Éléments stylisés

- `.fiscal-bloc` - Blocs collapsibles
- `.fiscal-bloc-title` - Titres sections
- `.form-group` - Formulaires
- `.exploitation-section` (orange/green/purple)
- `.btn-neo` / `.btn-neo-secondary`
- `.info-box` et variantes
- `.ca-display-block` - Affichage CA

## 📱 Responsive

Media query 768px: grilles → 1 colonne

---

*Document créé le 27 janvier 2026*
