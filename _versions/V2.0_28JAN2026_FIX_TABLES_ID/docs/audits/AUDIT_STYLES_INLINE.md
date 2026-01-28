# 🎨 AUDIT COMPLET - Styles Inline à Migrer vers CSS

*Date: 26 janvier 2026*

## 📊 Vue d'ensemble

Suite à l'intégration des LOT 1-9, il reste de nombreux **styles inline** dans le code JavaScript qui génèrent du HTML dynamiquement. Ces styles doivent être migrés vers des classes CSS réutilisables.

---

## 🎯 Fichiers Critiques Identifiés

### 1. **js/menage.js** (Priorité 🔴 HAUTE)

**Lignes 565-650 : `afficherPlanningParSemaine()`**
- Grid dynamique selon nombre de gîtes
- Colonnes de gîtes avec headers colorés
- Cards de ménage avec hover

**Styles inline trouvés :**
```html
<!-- Grid container -->
<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; width: 100%; min-width: 0; padding: 20px; box-sizing: border-box;">

<!-- Colonne de gîte -->
<div style="display: flex; flex-direction: column; min-width: 0; flex: 1; overflow: hidden;" data-gite-color="#667eea">
    
    <!-- Header coloré -->
    <div style="padding: 12px 20px; background: #667eea; border-radius: 12px 12px 0 0; margin-bottom: 0; border: 1px solid var(--icalou-border); border-bottom: none; box-shadow: var(--icalou-shadow);">
        <div style="font-size: 0.8rem; margin-bottom: 2px; color: white; font-weight: 600;">🏠 Trévoux</div>
        <div style="font-size: 1rem; margin-bottom: 2px; color: white; font-weight: 700; text-transform: uppercase;">Semaine 5</div>
        <div style="font-size: 0.8rem; opacity: 0.95; color: white;">26 janv. - 01 févr.</div>
    </div>
    
    <!-- Body -->
    <div style="background: white; border: 1px solid var(--icalou-border); border-top: none; border-radius: 0 0 12px 12px; padding: 20px; min-height: 120px; box-shadow: var(--icalou-shadow);">
        ...
    </div>
</div>
```

**Lignes 690-790 : `generateMenageCardHTML()`**
```html
<!-- Card de ménage avec hover -->
<div style="background: white; margin-bottom: 15px; padding: 15px; border: 1px solid var(--icalou-border); border-radius: 12px; box-shadow: var(--icalou-shadow-hover); transition: all 0.2s; background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-color: #27ae60;" 
     onmouseover="this.style.transform='translateY(-2px)'" 
     onmouseout="this.style.transform=''">
    
    <!-- Badge de statut -->
    <div style="width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; border: 1px solid var(--icalou-border); box-shadow: var(--icalou-shadow); background: #55efc4; color: #2D3436;">
        ✓
    </div>
    
    <!-- Formulaire inline -->
    <input type="date" style="flex: 1; min-width: 120px; padding: 6px 8px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.85rem;">
    <select style="padding: 6px 8px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.85rem;">
    <button style="padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; background: #27ae60; color: white; font-size: 0.85rem;">
</div>
```

---

### 2. **js/draps.js** (Priorité 🟠 MOYENNE)

**Lignes 118-172 : Cards avec bordures colorées**
```html
<div style="background: white; border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 20px; flex: 1; min-width: 200px; transition: all 0.2s;">

<button onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'" 
        onmouseout="this.style.transform='translate(0, 0)'; this.style.boxShadow='2px 2px 0 #2D3436'" 
        style="background: white; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436;">
```

---

### 3. **js/decouvrir.js** (Priorité 🟠 MOYENNE)

**Lignes 188-244 : Cards activités**
```html
<div class="card-activite" 
     style="background: white; border: 3px solid #2D3436; border-radius: 12px; padding: 20px; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s; cursor: pointer;" 
     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='5px 5px 0 #2D3436'" 
     onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
```

---

### 4. **js/fiscalite-v2.js** (Priorité 🟡 BASSE)

**Lignes 3656-3723 : Grids de listes**
```html
<div style="display: grid; grid-template-columns: 100px 1fr 120px 120px 80px; align-items: center;">
<div style="display: grid; grid-template-columns: 90px 1fr 110px 110px 60px; gap: 10px; align-items: center;">
```

---

### 5. **tabs/tab-dashboard.html** (Priorité 🟠 MOYENNE)

**Lignes 206+ : Cards dashboard**
```html
<div class="card" style="background: white; border: 3px solid #2D3436; box-shadow: 4px 4px 0 #2D3436; border-radius: 12px; padding: 20px;">
```

---

## 🎨 Classes CSS à Créer

### A. **Grids Dynamiques**
```css
/* Grid 1 colonne centrée (1 gîte) */
.menage-grid-1 {
    display: flex;
    justify-content: center;
    max-width: 800px;
    margin: 0 auto;
}

/* Grid 2 colonnes (2 gîtes) */
.menage-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    width: 100%;
    min-width: 0;
    padding: 20px;
    box-sizing: border-box;
}

/* Grid 3 colonnes (3 gîtes) */
.menage-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
    min-width: 0;
    padding: 20px;
    box-sizing: border-box;
}

/* Grid 4+ colonnes (4+ gîtes) */
.menage-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    width: 100%;
    min-width: 0;
    padding: 20px;
    box-sizing: border-box;
}
```

### B. **Colonnes de Gîtes**
```css
/* Colonne de gîte */
.gite-column {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    border-radius: 12px;
}

/* Colonne unique (1 gîte) */
.gite-column-single {
    width: 100%;
    max-width: 800px;
}

/* Header de colonne (partie colorée) - background via inline */
.gite-column-header {
    padding: 12px 20px;
    border-radius: 12px 12px 0 0;
    margin-bottom: 0;
    border: 1px solid var(--icalou-border);
    border-bottom: none;
    box-shadow: var(--icalou-shadow);
}

.gite-column-header-title {
    font-size: 0.8rem;
    margin-bottom: 2px;
    color: white;
    font-weight: 600;
}

.gite-column-header-week {
    font-size: 1rem;
    margin-bottom: 2px;
    color: white;
    font-weight: 700;
    text-transform: uppercase;
}

.gite-column-header-dates {
    font-size: 0.8rem;
    opacity: 0.95;
    color: white;
}

/* Body de colonne */
.gite-column-body {
    background: white;
    border: 1px solid var(--icalou-border);
    border-top: none;
    border-radius: 0 0 12px 12px;
    padding: 20px;
    min-height: 120px;
    box-shadow: var(--icalou-shadow);
}

.gite-column-body-empty {
    text-align: center;
    color: #95a5a6;
    font-style: italic;
    padding: 20px;
}
```

### C. **Cards de Ménage**
```css
/* Card de ménage de base */
.menage-card {
    background: white;
    margin-bottom: 15px;
    padding: 15px;
    border: 1px solid var(--icalou-border);
    border-radius: 12px;
    box-shadow: var(--icalou-shadow-hover);
    transition: all 0.2s;
}

.menage-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--icalou-shadow-hover);
}

/* Card validée (gradient vert) */
.menage-card-validated {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    border-color: #27ae60;
}

/* Header de card */
.menage-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.menage-card-date {
    font-size: 0.95rem;
    font-weight: 700;
    color: #2D3436;
}

/* Badge de statut circulaire */
.menage-status-badge {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 700;
    border: 1px solid var(--icalou-border);
    box-shadow: var(--icalou-shadow);
    color: #2D3436;
}

.menage-status-badge-validated {
    background: #55efc4;
}

.menage-status-badge-pending {
    background: #ffeaa7;
}

/* Infos de ménage */
.menage-card-time {
    font-size: 0.9rem;
    color: #636e72;
    margin-bottom: 5px;
}

.menage-card-info {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 3px;
}

/* Formulaire d'édition */
.menage-edit-form {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ddd;
}

.menage-edit-inputs {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
}

/* Inputs spécifiques ménage */
.menage-input-date {
    flex: 1;
    min-width: 120px;
    padding: 6px 8px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 0.85rem;
}

.menage-input-time {
    padding: 6px 8px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 0.85rem;
}

.menage-btn-save {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    background: #27ae60;
    color: white;
    font-size: 0.85rem;
}

/* Alert proposition société */
.menage-company-proposal {
    background: #fff3cd;
    padding: 12px;
    margin: 10px 0;
    border: 1px solid #f39c12;
    border-radius: 8px;
    box-shadow: var(--icalou-shadow);
}

.menage-company-proposal-title {
    font-weight: 700;
    color: #856404;
    margin-bottom: 5px;
}

.menage-company-proposal-info {
    font-size: 0.9rem;
    color: #856404;
}

.menage-company-buttons {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}

.menage-btn-accept {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    background: #27ae60;
    color: white;
    font-size: 0.9rem;
}

.menage-btn-refuse {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    background: #e74c3c;
    color: white;
    font-size: 0.9rem;
}
```

### D. **Cards Neo-Brutalism (draps, decouvrir, dashboard)**
```css
/* Card Neo avec bordure colorée */
.card-neo-bordered {
    background: white;
    border: 3px solid var(--stroke, #2D3436);
    border-radius: 12px;
    box-shadow: 4px 4px 0 var(--stroke, #2D3436);
    padding: 20px;
    transition: all 0.2s;
}

.card-neo-bordered:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--stroke, #2D3436);
}

/* Avec couleur dynamique */
.card-neo-blue {
    border-color: #667eea;
    box-shadow: 4px 4px 0 #2D3436;
}

.card-neo-red {
    border-color: #f5576c;
    box-shadow: 4px 4px 0 #2D3436;
}

.card-neo-green {
    border-color: #27AE60;
    box-shadow: 4px 4px 0 #2D3436;
}
```

### E. **Grids Fiscalité**
```css
/* Grid liste avec colonnes fixes */
.fiscalite-grid-5cols {
    display: grid;
    grid-template-columns: 100px 1fr 120px 120px 80px;
    align-items: center;
}

.fiscalite-grid-5cols-compact {
    display: grid;
    grid-template-columns: 90px 1fr 110px 110px 60px;
    gap: 10px;
    align-items: center;
    padding: 10px;
    background: white;
    border-radius: 6px;
    margin-bottom: 6px;
    border: 1px solid #e0e0e0;
}
```

---

## 📝 Plan de Migration

### Phase 1 : Créer les classes CSS ✅
1. Ajouter toutes les classes ci-dessus dans `css/main.css`
2. Les placer dans une nouvelle section `/* PLANNING MÉNAGE & GÎTES */`
3. Créer backup avant modification

### Phase 2 : Migrer js/menage.js 🔴
1. Remplacer les grids dynamiques par classes `.menage-grid-{1|2|3|4}`
2. Remplacer `.gite-column` et ses sous-éléments
3. Remplacer les cards de ménage par `.menage-card`
4. Supprimer les `onmouseover`/`onmouseout` (CSS :hover)
5. Garder uniquement `data-gite-color` et `style="background: ${color}"` pour les headers

### Phase 3 : Migrer js/draps.js 🟠
1. Remplacer par `.card-neo-bordered`
2. Supprimer hover inline

### Phase 4 : Migrer js/decouvrir.js 🟠
1. Même chose avec `.card-neo-bordered`

### Phase 5 : Migrer js/fiscalite-v2.js 🟡
1. Remplacer par `.fiscalite-grid-5cols`

### Phase 6 : Migrer tabs/tab-dashboard.html 🟠
1. Remplacer inline par classes existantes du LOT 07

---

## ⚠️ Points d'Attention

### À GARDER en inline :
- `background: ${color}` pour les headers de gîtes (couleurs dynamiques)
- `border-left: 4px solid ${color}` via `data-gite-color` (géré par JS)
- Couleurs spécifiques dans les grids fiscalité (si dynamiques)

### À SUPPRIMER complètement :
- **Tous** les `onmouseover`/`onmouseout` → Remplacer par `:hover` CSS
- Tous les styles de layout (grid, flex, gap, padding) → Classes
- Tous les styles de bordures/ombres → Classes
- Tous les styles typographiques répétés → Classes

---

## 📊 Estimation Impact

- **Fichiers à modifier :** 6
- **Lignes CSS à ajouter :** ~350
- **Lignes JS à modifier :** ~200
- **Temps estimé :** 3-4 heures
- **Risque :** 🟠 Moyen (beaucoup de tests nécessaires)

---

## ✅ Checklist Validation

Après migration, vérifier :

- [ ] Onglet Ménage : Planning s'affiche correctement pour 1, 2, 3, 4 gîtes
- [ ] Onglet Ménage : Cards hover fonctionne
- [ ] Onglet Ménage : Badges de statut affichés
- [ ] Onglet Ménage : Formulaires inline fonctionnels
- [ ] Onglet Draps : Cards avec bordures colorées
- [ ] Onglet Découvrir : Cards activités hover
- [ ] Onglet Fiscalité : Grids de listes
- [ ] Dashboard : Cards s'affichent correctement
- [ ] Mobile : Tout reste responsive
- [ ] **Aucune erreur console**

---

## 🎯 Prochaine Étape

**Commencer par la Phase 1 :** Créer toutes les classes CSS dans `main.css`

