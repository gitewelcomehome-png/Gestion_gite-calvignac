# 🎯 KANBAN - Documentation Technique

**Date de création :** 16 février 2026  
**Version :** 1.0  
**Auteur :** Assistant IA  
**Statut :** ✅ Opérationnel et totalement synchronisé avec Dashboard

---

## 📋 Vue d'Ensemble

Le module Kanban est un système de gestion visuelle des tâches totalement synchronisé avec le Dashboard existant. Il permet de gérer les tâches avec une interface type Trello/Kanban board.

---

## 🎨 Fonctionnalités

### 1. Vue Kanban Complète
- **3 Colonnes** : À faire → En cours → Terminé
- **3 Catégories** : 
  - 🗓️ Actions Réservations (`reservations`)
  - 🛒 Achats & Courses (`achats`)
  - 🔧 Travaux & Maintenance (`travaux`)

### 2. Filtres Intelligents
- Filtrer par catégorie
- Vue "Toutes les catégories"
- Compteurs dynamiques par colonne

### 3. Gestion des Cartes
Chaque carte affiche :
- Titre de la tâche
- Description (si présente)
- Catégorie avec badge coloré
- Gîte concerné (si applicable)
- Date de création
- Badge "Récurrente" (si applicable)

### 4. Actions sur les Cartes

#### Colonne "À faire"
- ▶️ **Démarrer** : Passe la tâche en "En cours"

#### Colonne "En cours"
- ✅ **Terminer** : Marque la tâche comme terminée
- ◀️ **Retour** : Remet la tâche en "À faire"

#### Colonne "Terminé"
- 🔄 **Réactiver** : Remet la tâche en "En cours"
- 🗑️ **Supprimer** : Supprime définitivement de la base de données

---

## 🔄 Synchronisation Dashboard ↔ Kanban

### Synchronisation Bidirectionnelle Complète

#### Dashboard → Kanban
Quand vous cochez/décochez une tâche dans le Dashboard :
- ✅ La carte change instantanément de colonne dans le Kanban
- Le statut est mis à jour dans la base de données
- Les compteurs sont actualisés en temps réel

#### Kanban → Dashboard
Quand vous changez le statut d'une carte dans le Kanban :
- ✅ La tâche disparaît/apparaît du Dashboard selon son statut
- Le statut `completed` est actualisé en BDD
- Les listes de tâches du Dashboard sont rafraîchies

### Fonction Clé de Synchronisation

```javascript
// Dans kanban.js
window.toggleTodo = async function(todoId, isCompleted) {
    // Met à jour la tâche en BDD
    // Rafraîchit Dashboard ET Kanban
}

// Dans dashboard.js (existant)
// Les fonctions toggleTodo, deleteTodo interagissent avec le Kanban
```

---

## 📁 Structure des Fichiers

### 1. `/tabs/tab-kanban.html`
**Rôle :** Interface HTML du Kanban  
**Contenu :**
- Structure des 3 colonnes
- Filtres de catégories
- Styles CSS inline pour le Kanban
- Zones de conteneurs pour les cartes

### 2. `/js/kanban.js`
**Rôle :** Logique métier du Kanban  
**Fonctions principales :**

| Fonction | Description |
|----------|-------------|
| `initKanban()` | Initialise le module au chargement de l'onglet |
| `loadKanbanData()` | Charge toutes les tâches depuis Supabase |
| `refreshKanban()` | Rafraîchit l'affichage complet |
| `filterKanban(category)` | Filtre par catégorie |
| `renderKanban()` | Rend toutes les cartes dans les colonnes |
| `updateTaskStatus(taskId, newStatus)` | Change le statut d'une tâche + sync |
| `deleteTask(taskId)` | Supprime définitivement une tâche |
| `window.toggleTodo()` | Fonction exportée pour sync Dashboard |

### 3. Intégration dans `/app.html`

**Modifications apportées :**

#### a) Chargement du script (ligne ~131)
```html
<script src="js/kanban.js?v=1.0"></script>
```

#### b) Bouton de navigation (ligne ~1413)
```html
<button class="nav-tab" data-tab="kanban" data-theme="blue">
    <i data-lucide="trello" class="tab-icon"></i>
    <span class="tab-label">Kanban</span>
</button>
```

#### c) Conteneur de l'onglet (ligne ~1439)
```html
<div id="tab-kanban" class="tab-content"></div>
```

#### d) Route de chargement Desktop (ligne ~1138)
```javascript
'tab-kanban': 'tabs/tab-kanban.html' + cacheBuster,
```

#### e) Initialisation au chargement (ligne ~1206)
```javascript
if (tabId === 'tab-kanban' && typeof window.initKanban === 'function') {
    setTimeout(() => window.initKanban(), 100);
}
```

### 4. Intégration dans `/js/shared-utils.js`

**Modification de la fonction `switchTab()` (ligne ~305)**

```javascript
} else if (tabName === 'kanban' && typeof initKanban === 'function') {
    const checkKanbanReady = () => {
        if (document.querySelector('.kanban-board')) {
            initKanban();
        } else {
            setTimeout(checkKanbanReady, 50);
        }
    };
    checkKanbanReady();
}
```

**Rôle :** Réinitialise le Kanban lorsque l'utilisateur clique sur l'onglet

---

## 🗄️ Structure de la Base de Données

### Table : `todos`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `owner_user_id` | UUID | Propriétaire de la tâche |
| `gite_id` | UUID | Gîte concerné (nullable) |
| `category` | TEXT | `'reservations'`, `'achats'`, `'travaux'` |
| `title` | TEXT | Titre de la tâche |
| `description` | TEXT | Description détaillée |
| `status` | TEXT | `'todo'`, `'in_progress'`, `'done'`, `'cancelled'` |
| `priority` | TEXT | `'low'`, `'medium'`, `'high'`, `'urgent'` |
| `completed` | BOOLEAN | Indicateur de complétion |
| `is_recurrent` | BOOLEAN | Tâche récurrente |
| `frequency` | TEXT | `'weekly'`, `'biweekly'`, `'monthly'` |
| `frequency_detail` | JSONB | Détails de la récurrence |
| `next_occurrence` | TIMESTAMPTZ | Prochaine occurrence |
| `due_date` | DATE | Date d'échéance |
| `completed_at` | TIMESTAMPTZ | Date de complétion |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de dernière modification |

---

## 🎨 Design & Thème

### Couleurs par Catégorie

| Catégorie | Couleur | Code |
|-----------|---------|------|
| Réservations | Bleu | `#3498db` |
| Achats & Courses | Orange | `#e67e22` |
| Travaux & Maintenance | Rouge | `#e74c3c` |

### Couleurs par Statut (Colonnes)

| Statut | Couleur | Code |
|--------|---------|------|
| À faire | Gris | `#95a5a6` |
| En cours | Bleu | `#3498db` |
| Terminé | Vert | `#27ae60` |

### Responsive
- Design adaptatif desktop/mobile
- Colonnes empilées sur petits écrans
- Filtres en colonne sur mobile

---

## 🔒 Sécurité & Validation

### Utilisation de SecurityUtils
Toutes les données affichées passent par `window.SecurityUtils.sanitizeText()` pour éviter les injections XSS.

### Row Level Security (RLS)
Les tâches sont filtrées par `owner_user_id` automatiquement par Supabase RLS.

---

## 📱 Utilisation

### Pour l'Utilisateur

1. **Accéder au Kanban** : Cliquer sur l'onglet "Kanban" dans la navigation
2. **Filtrer** : Utiliser les boutons de catégorie en haut
3. **Déplacer une tâche** : Utiliser les boutons sur chaque carte
4. **Supprimer** : Depuis la colonne "Terminé", cliquer sur le bouton 🗑️

### Workflow Recommandé

```
📝 Créer tâche depuis Dashboard
    ↓
⏳ Apparaît dans "À faire" (Kanban)
    ↓
▶️ Cliquer "Démarrer"
    ↓
🔄 Tâche en "En cours" (visible Dashboard + Kanban)
    ↓
✅ Cliquer "Terminer" ou cocher dans Dashboard
    ↓
✔️ Tâche dans "Terminé" (masquée du Dashboard)
    ↓
🗑️ Supprimer définitivement si besoin
```

---

## 🚀 Améliorations Futures (Optionnelles)

### Phase 2 - Drag & Drop
- Déplacer les cartes par glisser-déposer entre colonnes
- Bibliothèque : SortableJS ou drag-drop natif HTML5

### Phase 3 - Édition Inline
- Modifier titre/description directement depuis la carte
- Modal d'édition complète

### Phase 4 - Récurrence Avancée
- Activer la gestion de récurrence hebdomadaire (colonnes BDD déjà présentes)
- Auto-création des tâches récurrentes

### Phase 5 - Couleurs Personnalisées
- Permettre à l'utilisateur de choisir les couleurs des catégories
- Stockage dans `user_preferences` table

---

## 🐛 Debugging & Maintenance

### Logs Console
Le module affiche des logs préfixés :
- `🎯` : Initialisation
- `✅` : Succès
- `❌` : Erreurs
- `🔄` : Rafraîchissements

### Vérifications Importantes

1. **La table `todos` existe bien** en BDD
2. **Les RLS sont activés** sur cette table
3. **Les icônes Lucide se chargent** (`lucide.createIcons()`)
4. **SecurityUtils est disponible** (protection XSS)

### Commandes Utiles

```javascript
// Console Browser - Vérifier l'état
console.log(KanbanState);

// Rafraîchir manuellement
refreshKanban();

// Vérifier synchronisation
window.toggleTodo('uuid-de-tache', true);
```

---

## ✅ Checklist de Validation

- [x] Fichier HTML créé (`tabs/tab-kanban.html`)
- [x] Fichier JS créé et fonctionnel (`js/kanban.js`)
- [x] Script chargé dans `app.html`
- [x] Bouton de navigation ajouté
- [x] Conteneur `<div id="tab-kanban">` ajouté
- [x] Route de chargement configurée
- [x] Initialisation au chargement de l'onglet
- [x] Initialisation au clic sur l'onglet (switchTab)
- [x] Synchronisation Dashboard → Kanban
- [x] Synchronisation Kanban → Dashboard
- [x] Filtres par catégorie
- [x] Compteurs dynamiques
- [x] Actions sur cartes (démarrer, terminer, supprimer)
- [x] Design responsive
- [x] Protection XSS (SecurityUtils)
- [x] Aucune erreur console

---

## 📞 Support

En cas de problème :

1. **Vérifier la console** pour les erreurs JavaScript
2. **Vérifier que la table `todos` existe** en BDD
3. **S'assurer que SecurityUtils est chargé** avant kanban.js
4. **Recharger la page** avec cache vidé (Ctrl+Shift+R)

---

**Fin de documentation technique Kanban v1.0**
