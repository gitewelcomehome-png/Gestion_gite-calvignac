# 🚀 Guide Rapide : Migration Mobile

## 📋 Checklist pour créer un onglet mobile

### Étape 1 : Créer le fichier HTML mobile
```bash
# Exemple pour l'onglet réservations
cp tabs/tab-reservations.html tabs/mobile/reservations.html
```

### Étape 2 : Optimiser le HTML mobile
Éditer `tabs/mobile/reservations.html` :

✅ **À faire :**
- Passer en layout 1 colonne
- Réduire padding (15px max)
- Simplifier les cartes (pas de détails superflus)
- Boutons plus gros (min 44x44px)
- Textes plus gros (0.9rem minimum)
- Masquer éléments non essentiels

❌ **À éviter :**
- Grilles multi-colonnes complexes
- Hover effects (remplacer par active)
- Popups/modals trop grandes
- Graphiques complexes

### Étape 3 : Ajouter dans index.html

```javascript
// Dans le bloc tabFiles
'tab-reservations': isMobile ? 'tabs/mobile/reservations.html' : 'tabs/tab-reservations.html',
```

### Étape 4 : (Optionnel) CSS spécifique

Si besoin de styles spécifiques pour cet onglet :
```bash
# Créer le fichier CSS
touch css/mobile/reservations.css
```

Puis ajouter dans `tabs/mobile/reservations.html` :
```html
<style>
    @import url('/css/mobile/reservations.css');
</style>
```

### Étape 5 : Tester

1. F12 → Toggle device toolbar
2. Choisir iPhone/Samsung
3. Recharger la page (Cmd+R / Ctrl+R)
4. Vérifier que l'onglet mobile charge bien
5. Tester tactile et scrolling

---

## 📝 Template de Base Mobile

Copier ce template pour créer un nouvel onglet mobile :

```html
<div class="tab-container mobile-[NOM_ONGLET]">
    <!-- En-tête compact -->
    <div class="card" style="background: white; border: 2px solid #2D3436; padding: 15px; margin-bottom: 15px; box-shadow: 2px 2px 0 #2D3436; border-radius: 12px;">
        <h2 style="margin: 0; font-size: 1.1rem; color: #2D3436; font-weight: 700; text-align: center;">
            [ICONE] [TITRE]
        </h2>
    </div>

    <!-- Contenu principal en 1 colonne -->
    <div style="display: flex; flex-direction: column; gap: 15px;">
        
        <!-- Section 1 -->
        <div class="card" style="padding: 15px; border: 2px solid #2D3436; border-radius: 12px;">
            <h3 style="font-size: 1rem; margin: 0 0 10px 0;">Section 1</h3>
            <!-- Contenu -->
        </div>

        <!-- Section 2 -->
        <div class="card" style="padding: 15px; border: 2px solid #2D3436; border-radius: 12px;">
            <h3 style="font-size: 1rem; margin: 0 0 10px 0;">Section 2</h3>
            <!-- Contenu -->
        </div>

    </div>

    <!-- Boutons action en bas -->
    <div style="position: sticky; bottom: 0; background: white; padding: 15px; border-top: 2px solid #2D3436; margin-top: 20px;">
        <button style="width: 100%; padding: 12px; font-size: 1rem; background: #667eea; color: white; border: 2px solid #2D3436; border-radius: 8px; cursor: pointer; font-weight: 700;">
            [ACTION PRINCIPALE]
        </button>
    </div>
</div>
```

---

## 🎯 Priorités de Migration

Ordre recommandé pour migrer les onglets :

1. ✅ **Dashboard** → Déjà fait
2. 🔲 **Réservations** → Page la plus utilisée
3. 🔲 **Ménage** → Important pour femme de ménage
4. 🔲 **Fiches Clients** → Consultation fréquente
5. 🔲 **Gestion** → Modification rapides
6. 🔲 **Draps** → Suivi linge
7. 🔲 **Archives** → Moins prioritaire
8. 🔲 **Statistiques** → Peut attendre (graphiques complexes)
9. 🔲 **Charges** → Desktop preferred (saisie complexe)
10. 🔲 **Infos Gîtes** → Consultation rare

---

## ⚡ Raccourcis Utiles

### Copier structure depuis desktop
```bash
cp tabs/tab-NOM.html tabs/mobile/NOM.html
```

### Voir différences
```bash
git diff tabs/tab-NOM.html tabs/mobile/NOM.html
```

### Tester taille fichier
```bash
ls -lh tabs/mobile/*.html
```

### Compter lignes
```bash
wc -l tabs/mobile/*.html
```

---

## 📐 Règles de Design Mobile

### Espacements
- Padding cartes : **15px** max
- Margin entre cartes : **15px**
- Gap dans grilles : **10px**

### Typographie
- H2 : **1.1rem** à **1.2rem**
- H3 : **1rem**
- Texte : **0.9rem** à **1rem**
- Inputs : **16px** minimum (évite zoom iOS)

### Boutons
- Hauteur min : **44px**
- Largeur min : **44px**
- Font-size : **0.9rem** à **1rem**
- Border-radius : **8px**

### Couleurs
Garder la palette desktop :
- Primary : `#667eea`
- Success : `#27AE60`
- Warning : `#F39C12`
- Danger : `#ff7675`
- Info : `#74b9ff`

---

## 🐛 Problèmes Fréquents

### Onglet ne charge pas
→ Vérifier le chemin dans `index.html`
→ Vérifier que le fichier existe dans `tabs/mobile/`

### CSS ne s'applique pas
→ Vérifier import dans `css/mobile/main.css`
→ Forcer rechargement cache

### Boutons trop petits
→ Ajouter `min-height: 44px; min-width: 44px;`

### Texte trop petit
→ Minimum `font-size: 0.9rem` (jamais en dessous)

### Zoom automatique iOS sur input
→ Mettre `font-size: 16px !important;` sur inputs

---

## ✅ Validation Avant Commit

Avant de commiter un nouvel onglet mobile :

- [ ] Fichier dans `tabs/mobile/[NOM].html`
- [ ] Référencé dans `index.html`
- [ ] Layout 1 colonne
- [ ] Boutons min 44x44px
- [ ] Font-size >= 16px sur inputs
- [ ] Testé sur DevTools mobile
- [ ] Pas d'erreurs console
- [ ] Scrolling fluide
- [ ] Desktop non affecté

---

## 📚 Ressources

- **Documentation complète** : `docs/README_MOBILE_DESKTOP_SEPARE.md`
- **README tabs mobile** : `tabs/mobile/README.md`
- **README CSS mobile** : `css/mobile/README.md`
- **Archive ancienne tentative** : `_archives/mobile_responsive_20jan2026/`
