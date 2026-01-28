# 📦 INVENTAIRE COMPLET DES CONTENANTS - Site Gestion Gîtes

## 🎯 OBJECTIF
Migrer TOUS les styles inline vers CSS pour une gestion centralisée et cohérente.

---

## 1️⃣ CONTENANTS PRINCIPAUX

### 1.1 Container / Layout
- [ ] `.container` - Conteneur principal de la page
- [ ] `.header` - En-tête de page
- [ ] `.sidebar` - Barre latérale (si utilisée)
- [ ] `.main-content` - Zone de contenu principale
- [ ] `.footer` - Pied de page

**Vérification :**
```bash
grep -rn "style=.*container\|div class=\"container\"" index.html tabs/*.html
```

---

## 2️⃣ CARTES & SECTIONS

### 2.1 Cards (Cartes)
- [ ] `.card` - Carte standard
- [ ] `.card-header` - En-tête de carte
- [ ] `.card-header-gradient` - En-tête avec dégradé
- [ ] `.card-title` - Titre de carte
- [ ] `.card-description` - Description
- [ ] `.card-icon` - Icône de carte
- [ ] `.section-card` - Carte de section

**Vérification :**
```bash
grep -rn "background:.*card\|style=.*card" js/dashboard.js js/reservations.js
```

### 2.2 Sections
- [ ] `.section` - Section générique
- [ ] `.section-title` - Titre de section
- [ ] `.section-subtitle` - Sous-titre

---

## 3️⃣ NAVIGATION & ONGLETS

### 3.1 Tabs (Onglets)
- [ ] `.tabs` - Conteneur d'onglets
- [ ] `.tab` - Onglet individuel
- [ ] `.tab.active` - Onglet actif
- [ ] `.tab-content` - Contenu d'onglet
- [ ] `.tab-content.active` - Contenu actif
- [ ] `.nav-tab` - Onglet de navigation

**Vérification :**
```bash
grep -rn "background.*tab\|style=.*tab" js/*.js
```

---

## 4️⃣ BOUTONS

### 4.1 Boutons Standards
- [ ] `.btn` - Bouton de base
- [ ] `.btn-primary` - Bouton primaire
- [ ] `.btn-secondary` - Bouton secondaire
- [ ] `.btn-success` - Bouton succès (vert)
- [ ] `.btn-danger` - Bouton danger (rouge)
- [ ] `.btn-warning` - Bouton avertissement (orange)

### 4.2 Boutons Actions
- [ ] `.btn-neo` - Bouton néo-brutalisme
- [ ] `.btn-neo-secondary` - Bouton néo secondaire
- [ ] `.btn-action` - Bouton d'action
- [ ] `.btn-valider` - Bouton valider
- [ ] `.btn-modifier` - Bouton modifier
- [ ] `.btn-supprimer` - Bouton supprimer
- [ ] `.btn-close` - Bouton fermer
- [ ] `.btn-cancel` - Bouton annuler

### 4.3 Boutons Spéciaux
- [ ] `.btn-icon` - Bouton avec icône
- [ ] `.btn-small` - Petit bouton
- [ ] `.btn-full` - Bouton pleine largeur
- [ ] `.btn-outline` - Bouton contour
- [ ] `.btn-sync` - Bouton synchronisation
- [ ] `.btn-refresh` - Bouton rafraîchir
- [ ] `.btn-toggle-period` - Toggle période

**Vérification :**
```bash
grep -rn "background.*button\|style=.*button" js/*.js index.html
```

---

## 5️⃣ MODALS & OVERLAYS

### 5.1 Modals (Fenêtres)
- [ ] `.modal` - Conteneur modal
- [ ] `.modal-overlay` - Fond sombre
- [ ] `.modal-content` - Contenu du modal
- [ ] `.modal-header` - En-tête du modal
- [ ] `.modal-body` - Corps du modal
- [ ] `.modal-footer` - Pied du modal
- [ ] `.modal-close` - Bouton fermeture

**Vérification :**
```bash
grep -rn "modal.*background\|style=.*modal" js/*.js
```

---

## 6️⃣ FORMULAIRES

### 6.1 Inputs & Controls
- [ ] `input[type="text"]` - Champ texte
- [ ] `input[type="email"]` - Champ email
- [ ] `input[type="number"]` - Champ nombre
- [ ] `input[type="date"]` - Champ date
- [ ] `input[type="checkbox"]` - Case à cocher
- [ ] `input[type="radio"]` - Bouton radio
- [ ] `select` - Liste déroulante
- [ ] `textarea` - Zone de texte

### 6.2 Form Groups
- [ ] `.form-group` - Groupe de formulaire
- [ ] `.form-label` - Label de champ
- [ ] `.form-control` - Contrôle de formulaire
- [ ] `.form-error` - Message d'erreur
- [ ] `.form-help` - Texte d'aide

**Vérification :**
```bash
grep -rn "input.*style=\|select.*style=" index.html tabs/*.html
```

---

## 7️⃣ CALENDRIER & DATES

### 7.1 Calendar Components
- [ ] `.calendar` - Conteneur calendrier
- [ ] `.calendar-header` - En-tête calendrier
- [ ] `.calendar-grid` - Grille du calendrier
- [ ] `.day-card` - Carte de jour
- [ ] `.day-card-mobile` - Carte jour mobile
- [ ] `.day-header` - En-tête de jour
- [ ] `.week-card` - Carte semaine
- [ ] `.month-selector` - Sélecteur de mois

**Vérification :**
```bash
grep -rn "day-card.*background\|calendar.*style=" js/calendrier-tarifs.js
```

---

## 8️⃣ RÉSERVATIONS & PLANNING

### 8.1 Reservation Cards
- [ ] `.reservation-card` - Carte réservation
- [ ] `.reservation-item` - Item de réservation
- [ ] `.reservation-header` - En-tête réservation
- [ ] `.reservation-status` - Statut réservation
- [ ] `.week-overview` - Vue hebdomadaire
- [ ] `.booking-card` - Carte de réservation

**Vérification :**
```bash
grep -rn "reservation.*background\|week.*style=" js/dashboard.js js/reservations.js
```

---

## 9️⃣ STATISTIQUES & DONNÉES

### 9.1 Stats Cards
- [ ] `.stat-card` - Carte statistique
- [ ] `.stat-value` - Valeur stat
- [ ] `.stat-label` - Label stat
- [ ] `.stat-icon` - Icône stat
- [ ] `.chart-container` - Conteneur graphique
- [ ] `.metric-card` - Carte métrique

**Vérification :**
```bash
grep -rn "stat.*background\|chart.*style=" js/statistiques.js js/dashboard.js
```

---

## 🔟 LISTES & ITEMS

### 10.1 Todo Lists
- [ ] `.todo-list` - Liste de tâches
- [ ] `.todo-item` - Item de tâche
- [ ] `.todo-item.completed` - Tâche complétée
- [ ] `.todo-checkbox` - Case à cocher

### 10.2 Generic Lists
- [ ] `.list` - Liste générique
- [ ] `.list-item` - Item de liste
- [ ] `.list-header` - En-tête de liste

**Vérification :**
```bash
grep -rn "todo.*background\|list-item.*style=" js/dashboard.js
```

---

## 1️⃣1️⃣ STOCKS & INVENTAIRE

### 11.1 Stock Components
- [ ] `.stock-card` - Carte stock
- [ ] `.stock-item` - Item de stock
- [ ] `.stock-value` - Valeur stock
- [ ] `.stock-indicator` - Indicateur

**Vérification :**
```bash
grep -rn "stock.*background" js/draps.js js/menage.js
```

---

## 1️⃣2️⃣ TABLEAUX

### 12.1 Tables
- [ ] `table` - Tableau
- [ ] `thead` - En-tête tableau
- [ ] `tbody` - Corps tableau
- [ ] `tr` - Ligne
- [ ] `th` - Cellule en-tête
- [ ] `td` - Cellule données
- [ ] `.table-responsive` - Tableau responsive

**Vérification :**
```bash
grep -rn "table.*style=\|tr.*background" tabs/*.html
```

---

## 1️⃣3️⃣ ALERTES & NOTIFICATIONS

### 13.1 Alerts
- [ ] `.alert` - Alerte générique
- [ ] `.alert-info` - Alerte info (bleu)
- [ ] `.alert-success` - Alerte succès (vert)
- [ ] `.alert-warning` - Alerte avertissement (orange)
- [ ] `.alert-danger` - Alerte danger (rouge)
- [ ] `.notification` - Notification

**Vérification :**
```bash
grep -rn "alert.*background\|notification.*style=" js/*.js
```

---

## 1️⃣4️⃣ BADGES & LABELS

### 14.1 Badges
- [ ] `.badge` - Badge générique
- [ ] `.badge-primary` - Badge primaire
- [ ] `.badge-success` - Badge succès
- [ ] `.badge-danger` - Badge danger
- [ ] `.badge-warning` - Badge avertissement
- [ ] `.status-badge` - Badge de statut

**Vérification :**
```bash
grep -rn "badge.*background" js/*.js
```

---

## 1️⃣5️⃣ GRILLES & LAYOUTS

### 15.1 Grid Systems
- [ ] `.grid` - Grille générique
- [ ] `.grid-2` - Grille 2 colonnes
- [ ] `.grid-3` - Grille 3 colonnes
- [ ] `.grid-4` - Grille 4 colonnes
- [ ] `.flex` - Container flex
- [ ] `.flex-center` - Flex centré

---

## 1️⃣6️⃣ CONTRÔLES THÈME

### 16.1 Theme Controls
- [ ] `.theme-controls` - Conteneur contrôles
- [ ] `.ctrl-btn` - Bouton contrôle
- [ ] `.ctrl-btn.active` - Bouton actif
- [ ] `.ctrl-separator` - Séparateur

**Vérification :**
```bash
grep -rn "ctrl-btn\|theme-control" index.html css/main.css
```

---

## 📋 COMMANDES DE VÉRIFICATION GLOBALES

### Trouver tous les styles inline
```bash
grep -rn 'style="' index.html tabs/*.html pages/*.html | wc -l
```

### Trouver backgrounds hardcodés dans JS
```bash
grep -rn "background.*#\|background.*rgb" js/*.js | wc -l
```

### Trouver couleurs hardcodées dans JS
```bash
grep -rn "color.*#\|color.*rgb" js/*.js | wc -l
```

---

## 🎯 PLAN D'ACTION

### Phase 1 : Audit (FAIT)
- [x] Inventaire complet des contenants
- [x] Liste de vérification

### Phase 2 : Migration Progressive
1. **Contenants principaux** (container, card, modal)
2. **Boutons** (tous les .btn-*)
3. **Formulaires** (inputs, selects)
4. **Calendrier** (day-card, week-card)
5. **Réservations** (reservation-item)
6. **Stats & Listes** (stat-card, todo-item)
7. **Tableaux** (table, tr, td)
8. **Alertes & Badges** (alert, badge)

### Phase 3 : Validation
- [ ] Test mode JOUR
- [ ] Test mode NUIT
- [ ] Test APPLE style
- [ ] Test SIDEBAR style
- [ ] Test responsive mobile

---

## ✅ CHECKLIST PAR CONTENANT

Pour chaque contenant, vérifier :
- [ ] Pas de `style=` inline dans HTML
- [ ] Pas de `background: #xxx` dans JS strings
- [ ] Utilise `var(--xxx)` ou `THEME_COLORS.xxx`
- [ ] Fonctionne en JOUR et NUIT
- [ ] Responsive sur mobile

---

**Prêt à commencer la migration contenant par contenant !**
