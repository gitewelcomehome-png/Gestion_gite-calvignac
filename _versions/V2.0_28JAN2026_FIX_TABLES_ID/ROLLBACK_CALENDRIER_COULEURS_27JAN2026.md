# 🔄 ROLLBACK - Calendrier Couleurs & Promotions

## 📅 Date de sauvegarde : 27 janvier 2026

---

## 📦 Localisation de la sauvegarde

```
_backups/backup_27jan2026_calendrier_couleurs/
├── tab-calendrier.css      (34 Ko)
├── calendrier-tarifs.js    (79 Ko)
└── index.html              (182 Ko)
```

---

## 🎯 Modifications effectuées

### 1. **Créé** : `/css/tab-calendrier.css` (1050 lignes)
- Mode Sidebar : Liserés colorés 4px (vert/orange/violet/bleu/gris)
- Mode Apple Jour : Gradients et couleurs variées
- Mode Apple Nuit : Textes blancs avec gradients sombres
- Tableau Excel/GDF : Styles colorés pour les deux modes
- Classes : `.has-tarif`, `.tarif-high`, `.has-promo`, `.selected`, `.reserved`
- Icônes 🎁 sur les promotions (pseudo-élément ::before/::after)

### 2. **Modifié** : `/js/calendrier-tarifs.js`
- Ligne ~490-505 : Ajout détection tarif élevé (>200€) et promotions
- Ligne ~1164-1248 : Nouvelle fonction `calculateTarifSansPromo()`
- Ligne ~1393-1408 : Classes CSS dynamiques pour tableau GDF
- Ligne ~1687-1701 : Légende enrichie (5 entrées au lieu de 3)
- Suppression : ~450 lignes de styles inline (remplacées par commentaire)

### 3. **Modifié** : `/index.html`
- Ligne 185 : Ajout `<link rel="stylesheet" href="css/tab-calendrier.css?v=1.0" />`

---

## 🔧 Procédure de restauration complète

### Option 1 : Restauration automatique (recommandée)

```bash
cd /workspaces/Gestion_gite-calvignac

# Restaurer tous les fichiers
cp _backups/backup_27jan2026_calendrier_couleurs/tab-calendrier.css css/
cp _backups/backup_27jan2026_calendrier_couleurs/calendrier-tarifs.js js/
cp _backups/backup_27jan2026_calendrier_couleurs/index.html .

# Vérification
echo "✅ Restauration terminée"
ls -lh css/tab-calendrier.css js/calendrier-tarifs.js index.html
```

### Option 2 : Restauration manuelle fichier par fichier

#### Étape 1 : Restaurer le CSS
```bash
cp _backups/backup_27jan2026_calendrier_couleurs/tab-calendrier.css css/tab-calendrier.css
```

#### Étape 2 : Restaurer le JavaScript
```bash
cp _backups/backup_27jan2026_calendrier_couleurs/calendrier-tarifs.js js/calendrier-tarifs.js
```

#### Étape 3 : Restaurer index.html
```bash
cp _backups/backup_27jan2026_calendrier_couleurs/index.html index.html
```

### Option 3 : Suppression complète du système de couleurs

Si vous souhaitez **supprimer complètement** le nouveau système :

```bash
# 1. Supprimer le fichier CSS créé
rm css/tab-calendrier.css

# 2. Retirer la ligne dans index.html (ligne 185)
# Ouvrir index.html et supprimer :
# <link rel="stylesheet" href="css/tab-calendrier.css?v=1.0" />

# 3. Restaurer l'ancien JS avec styles inline
cp _backups/backup_27jan2026_calendrier_couleurs/calendrier-tarifs.js js/calendrier-tarifs.js
```

---

## 🧪 Vérification après restauration

### 1. Vérifier que les fichiers sont restaurés
```bash
ls -lh css/tab-calendrier.css js/calendrier-tarifs.js
```

### 2. Vider le cache navigateur
- **Chrome/Edge** : `Ctrl + Shift + Delete` → Vider le cache
- **Firefox** : `Ctrl + Shift + Delete` → Vider le cache
- **Safari** : `Cmd + Option + E`

### 3. Recharger la page
- **Hard refresh** : `Ctrl + F5` ou `Cmd + Shift + R`

### 4. Vérifier dans l'onglet Calendrier
- Les styles devraient être revenus à l'état précédent
- Les couleurs devraient être uniformes (vert)
- Les promotions ne devraient plus avoir d'icônes 🎁

---

## 📋 Comparaison AVANT / APRÈS

### AVANT (état actuel sauvegardé)
- ❌ Pas de CSS externe pour calendrier
- ❌ Styles inline dans JS (450+ lignes)
- ❌ Couleurs uniformes (vert uniquement)
- ❌ Pas de distinction visuelle promotions/tarifs élevés
- ❌ Tableau Excel sans couleurs variées

### APRÈS restauration
- ✅ Retour CSS externe supprimé
- ✅ Styles inline restaurés dans JS
- ✅ Couleurs variées désactivées
- ✅ Retour au système simple
- ✅ Tableau Excel uniforme

---

## ⚠️ Points d'attention

### Base de données
- ✅ **Aucune modification** de la base de données
- ✅ Les tarifs et promotions sont **intacts**
- ✅ Seul l'affichage visuel est impacté

### Fonctionnalités
- ✅ Toutes les fonctionnalités restent **opérationnelles**
- ✅ Calcul des promotions **inchangé**
- ✅ Export Excel **fonctionne normalement**

### Versions
- État sauvegardé : **27 janvier 2026 - 22h47**
- CSS version : `v=1.0`
- Fichiers : `tab-calendrier.css`, `calendrier-tarifs.js`, `index.html`

---

## 🔍 Détails techniques

### Classes CSS à supprimer si rollback
```css
.day-card.tarif-high
.day-card.has-promo
.day-card.has-promo::before
.cell-available.high-price
.cell-available.promo-price
.cell-available.promo-price::after
.legend-box.promo
.legend-box.high-tarif
```

### Fonctions JS à supprimer si rollback
```javascript
calculateTarifSansPromo()  // Ligne 1210-1248
```

### Ligne index.html à supprimer si rollback
```html
<link rel="stylesheet" href="css/tab-calendrier.css?v=1.0" />  <!-- Ligne 185 -->
```

---

## 📞 Contact

En cas de problème lors de la restauration :
1. Vérifier que les chemins sont corrects
2. S'assurer d'avoir les droits en écriture
3. Vider complètement le cache navigateur
4. Redémarrer le serveur si nécessaire

---

## 📝 Historique

| Date | Action | Fichiers | Taille backup |
|------|--------|----------|---------------|
| 27/01/2026 22:47 | Sauvegarde complète | 3 fichiers | 295 Ko |

---

**Sauvegarde créée le 27 janvier 2026 à 22h47**  
**Localisation** : `_backups/backup_27jan2026_calendrier_couleurs/`
