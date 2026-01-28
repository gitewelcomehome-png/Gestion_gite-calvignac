# 🎨 Guide d'Utilisation - Boutons Standardisés

## 📋 Vue d'Ensemble

Tous les boutons de l'application utilisent maintenant un **système unifié** défini dans `css/icalou-modern.css`.

**📺 Démo visuelle** : Ouvrir [demo-boutons.html](demo-boutons.html) pour voir tous les boutons disponibles.

---

## ⚡ Utilisation Rapide

### Structure de base
```html
<button class="btn-action [type] [taille]">
    [icône] Texte
</button>
```

### Exemples
```html
<!-- Ajouter -->
<button class="btn-action btn-ajouter">➕ Ajouter</button>

<!-- Modifier -->
<button class="btn-action btn-modifier">✏️ Modifier</button>

<!-- Supprimer -->
<button class="btn-action btn-supprimer">🗑️ Supprimer</button>

<!-- Enregistrer -->
<button class="btn-action btn-enregistrer">💾 Enregistrer</button>

<!-- Annuler -->
<button class="btn-action btn-annuler">✖️ Annuler</button>
```

---

## 🎨 Types de Boutons Disponibles

### Actions Principales
| Classe | Couleur | Usage |
|--------|---------|-------|
| `btn-ajouter` ou `btn-add` | Vert | Créer, ajouter un élément |
| `btn-modifier` ou `btn-editer` | Bleu | Modifier, éditer |
| `btn-supprimer` ou `btn-remove` | Rouge | Supprimer, effacer |
| `btn-enregistrer` ou `btn-sauvegarder` | Violet | Sauvegarder les données |
| `btn-annuler` | Gris | Annuler une action |
| `btn-valider` ou `btn-confirmer` | Vert | Valider, confirmer |

### Boutons Spéciaux
| Classe | Couleur | Usage |
|--------|---------|-------|
| `btn-fiche-client` | Dégradé violet | Générer/ouvrir fiche client |
| `btn-actualiser` ou `btn-refresh` | Blanc/Bleu | Rafraîchir les données |
| `btn-telecharger` ou `btn-export` | Violet | Télécharger, exporter |
| `btn-imprimer` | Indigo | Imprimer un document |
| `btn-rechercher` | Cyan | Lancer une recherche |
| `btn-info` ou `btn-details` | Cyan | Afficher détails/info |

### Plus/Moins
| Classe | Couleur | Usage |
|--------|---------|-------|
| `btn-plus` | Vert | Ajouter (+) grand format |
| `btn-moins` | Orange | Retirer (-) grand format |

---

## 📏 Modificateurs de Taille

```html
<!-- Petit -->
<button class="btn-action btn-ajouter btn-sm">➕ Petit</button>

<!-- Normal (par défaut) -->
<button class="btn-action btn-ajouter">➕ Normal</button>

<!-- Grand -->
<button class="btn-action btn-ajouter btn-lg">➕ Grand</button>

<!-- Pleine largeur -->
<button class="btn-action btn-ajouter btn-full">➕ Pleine largeur</button>
```

---

## 👥 Groupes de Boutons

Pour aligner plusieurs boutons côte à côte :

```html
<div class="btn-group">
    <button class="btn-action btn-modifier">✏️ Modifier</button>
    <button class="btn-action btn-supprimer">🗑️ Supprimer</button>
    <button class="btn-action btn-info">ℹ️ Détails</button>
</div>
```

---

## 🎯 Boutons Icônes Seuls

Pour des boutons compacts avec uniquement une icône :

```html
<!-- Modifier -->
<button class="btn-icon edit">✏️</button>

<!-- Supprimer -->
<button class="btn-icon delete">🗑️</button>

<!-- Ajouter -->
<button class="btn-icon add">➕</button>

<!-- Info -->
<button class="btn-icon info">ℹ️</button>
```

---

## 💡 Exemples d'Utilisation

### 1. Actions sur une carte d'activité
```html
<div class="activity-card">
    <h3>Randonnée au Château</h3>
    <div class="btn-group">
        <button class="btn-action btn-modifier" onclick="editActivity(1)">
            ✏️ Modifier
        </button>
        <button class="btn-action btn-supprimer" onclick="deleteActivity(1)">
            🗑️ Supprimer
        </button>
    </div>
</div>
```

### 2. Modal de formulaire
```html
<div class="modal">
    <h2>Ajouter une activité</h2>
    <form>
        <!-- Champs du formulaire -->
    </form>
    <div class="btn-group" style="margin-top: 20px;">
        <button class="btn-action btn-annuler" onclick="closeModal()">
            ✖️ Annuler
        </button>
        <button class="btn-action btn-enregistrer" onclick="saveActivity()">
            💾 Enregistrer
        </button>
    </div>
</div>
```

### 3. Header de section avec actions
```html
<div class="section-header">
    <div>
        <h2 class="section-title">📋 Réservations</h2>
    </div>
    <div class="btn-group">
        <button class="btn-action btn-actualiser" onclick="refreshReservations()">
            🔄 Actualiser
        </button>
        <button class="btn-action btn-ajouter" onclick="addReservation()">
            ➕ Nouvelle réservation
        </button>
    </div>
</div>
```

### 4. Liste avec actions en ligne
```html
<div class="item-list">
    <div class="item">
        <span>Activité #1</span>
        <button class="btn-icon edit" onclick="edit(1)">✏️</button>
        <button class="btn-icon delete" onclick="remove(1)">🗑️</button>
    </div>
</div>
```

### 5. Bouton fiche client (pleine largeur)
```html
<button class="btn-action btn-fiche-client btn-full" onclick="generateFicheClient()">
    📋 Générer Fiche Client
</button>
```

---

## 🚀 Migration des Anciens Boutons

### Avant (style inline)
```html
<button style="background: #10b981; color: white; padding: 10px 20px; border-radius: 8px;">
    Ajouter
</button>
```

### Après (classe CSS)
```html
<button class="btn-action btn-ajouter">
    ➕ Ajouter
</button>
```

---

## ✅ Checklist de Migration

Lors de la migration d'un fichier HTML/JS :

1. [ ] Repérer tous les `<button>` avec styles inline
2. [ ] Identifier le type d'action (ajouter, modifier, supprimer, etc.)
3. [ ] Remplacer par `btn-action` + classe appropriée
4. [ ] Ajouter modificateur de taille si nécessaire (`.btn-sm`, `.btn-lg`, `.btn-full`)
5. [ ] Utiliser `.btn-group` si plusieurs boutons côte à côte
6. [ ] Tester visuellement après migration

---

## 🎨 Personnalisation

### Surcharge de couleur (cas spécifique au gîte)
Si vous devez utiliser une couleur de gîte, ajoutez le style inline **uniquement** pour la couleur :

```html
<button class="btn-action btn-ajouter" style="background: ${giteColor};">
    ➕ Ajouter
</button>
```

⚠️ **Important** : Seules les couleurs spécifiques aux gîtes peuvent être inline. Tout le reste doit être en classe CSS.

---

## 📚 Référence Complète

| Classe | Couleur | Hex | Usage |
|--------|---------|-----|-------|
| `btn-ajouter` | Vert | #10b981 | Actions positives |
| `btn-modifier` | Bleu | #3b82f6 | Édition |
| `btn-supprimer` | Rouge | #ef4444 | Suppression |
| `btn-enregistrer` | Violet | #8b5cf6 | Sauvegarde |
| `btn-annuler` | Gris | #64748b | Annulation |
| `btn-valider` | Vert | #10b981 | Validation |
| `btn-fiche-client` | Dégradé | #667eea → #764ba2 | Fiche client |
| `btn-actualiser` | Blanc/Bleu | #667eea | Rafraîchir |
| `btn-plus` | Vert | #10b981 | Ajout rapide |
| `btn-moins` | Orange | #f59e0b | Retrait rapide |
| `btn-info` | Cyan | #06b6d4 | Informations |
| `btn-telecharger` | Violet | #8b5cf6 | Export |
| `btn-imprimer` | Indigo | #6366f1 | Impression |
| `btn-rechercher` | Cyan | #06b6d4 | Recherche |

---

## 🔗 Liens Utiles

- **Démo visuelle** : [demo-boutons.html](demo-boutons.html)
- **CSS source** : [css/icalou-modern.css](css/icalou-modern.css)
- **Documentation migration** : [_MIGRATION_CSS_CENTRALISEE.md](_MIGRATION_CSS_CENTRALISEE.md)

---

**Date de création** : 24 janvier 2026  
**Dernière mise à jour** : 24 janvier 2026
