# 🧪 Guide de Test Mobile - Quick Check

## 📱 Comment Tester

### Option 1 : Depuis votre navigateur desktop
1. Appuyez sur **F12** (ouvrir DevTools)
2. Appuyez sur **Ctrl+Shift+M** (Toggle Device Toolbar)
3. Sélectionnez **iPhone 12 Pro** ou entrez **390px** de largeur
4. Appuyez sur **Ctrl+R** pour rafraîchir
5. ✅ Le site doit être en mode mobile

### Option 2 : Sur votre téléphone
1. Ouvrez le site sur votre téléphone
2. Connectez-vous normalement
3. ✅ Le site doit automatiquement s'adapter

---

## ✅ Checklist de Vérification

### 1. Navigation (2 min)
- [ ] **Hamburger visible** (coin supérieur droit) ☰
- [ ] **Cliquer sur hamburger** → menu slide depuis la droite
- [ ] **Sélectionner un onglet** → menu se ferme
- [ ] **Overlay fonctionnel** → cliquer en dehors ferme le menu

### 2. Dashboard - Vision Globale (1 min)
- [ ] **2 boxes par ligne** (pas 1 seule)
- [ ] **Aucune marge latérale** (pleine largeur)
- [ ] **Chiffres lisibles** mais compacts
- [ ] **Pas de scroll horizontal**

### 3. Dashboard - Vision Actions (3 min)
- [ ] **Headers bleus cliquables** pour chaque section
- [ ] **5 sections présentes** :
  - [ ] 📅 Réservations
  - [ ] 🧹 Ménages  
  - [ ] 📋 Todo Réservations
  - [ ] 🔧 Todo Travaux
  - [ ] 🛒 Todo Achats
- [ ] **Cliquer sur un header** → section s'ouvre/ferme
- [ ] **Icône ▼ tourne** quand fermée (devient ◀)

### 4. Graphiques (30 sec)
- [ ] **AUCUN graphique visible** sur mobile
- [ ] Espace récupéré pour le contenu

### 5. Scroll & Performance (1 min)
- [ ] **Pas de scroll horizontal** nulle part
- [ ] **Scroll vertical fluide**
- [ ] **Pas de lag** lors du toggle des sections
- [ ] **Menu hamburger réactif** (pas de délai)

---

## 🚨 Problèmes Possibles & Solutions

### ❌ Menu hamburger invisible
**Solution** : Vider le cache et rafraîchir (Ctrl+Shift+R)

### ❌ Encore 1 box par ligne au lieu de 2
**Solution** : 
1. Vérifier largeur écran : doit être <768px
2. F12 → Console → Taper : `window.innerWidth`
3. Si >768px, réduire la largeur de la fenêtre

### ❌ Sections ne se collapsent pas
**Solution** :
1. F12 → Console → Chercher erreurs JavaScript
2. Rafraîchir la page complètement
3. Vérifier que vous êtes bien en <768px

### ❌ Graphiques encore visibles
**Solution** :
1. Ctrl+Shift+R (hard refresh)
2. Vérifier version CSS : doit être `?v=4.4`
3. F12 → Sources → css/responsive-mobile.css → vérifier chargement

### ❌ Tout est minuscule et illisible
**✅ C'est normal** : Les tailles ont été réduites pour tenir 2 boxes par ligne.  
Si vraiment trop petit, me le signaler avec capture d'écran.

---

## 📸 Ce Que Vous Devez Voir

### Sur l'écran d'accueil Dashboard :

```
┌─────────────────────────────────┐
│  👤      [≡]                    │ ← Hamburger coin droit
├─────────────────────────────────┤
│  📊 VISION GLOBALE              │
│  ┌──────────┐ ┌──────────┐     │ ← 2 boxes par ligne
│  │ Box 1    │ │ Box 2    │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │ Box 3    │ │ Box 4    │     │
│  └──────────┘ └──────────┘     │
├─────────────────────────────────┤
│  🎯 VISION ACTIONS              │
│  ┌──────────────────────────┐  │
│  │ 📅 Réservations      [▼] │  │ ← Header cliquable
│  ├──────────────────────────┤  │
│  │  Contenu réservations    │  │ ← Ouvert par défaut
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🧹 Ménages          [◀]  │  │ ← Fermé
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 📋 Todo Réservations [◀] │  │ ← Fermé
│  └──────────────────────────┘  │
│  ... etc                        │
└─────────────────────────────────┘
```

### Quand vous cliquez sur le hamburger ☰ :

```
┌─────────────────────────────────┐
│  [overlay semi-transparent]     │
│              ┌──────────────┐   │
│              │ 📊 Dashboard │   │ ← Menu depuis droite
│              ├──────────────┤   │
│              │ 📅 Réserv.   │   │
│              ├──────────────┤   │
│              │ 🧹 Ménages   │   │
│              ├──────────────┤   │
│              │ ℹ️ Infos     │   │
│              ├──────────────┤   │
│              │ 💰 Fiscalité │   │
│              └──────────────┘   │
└─────────────────────────────────┘
```

---

## ⏱️ Durée Totale du Test
**7-10 minutes** pour tout vérifier

---

## 📝 Rapport de Test

Après avoir testé, remplir :

### ✅ Fonctionnel
- [ ] Hamburger menu : OK / KO
- [ ] 2 boxes par ligne : OK / KO
- [ ] Sections collapsables : OK / KO
- [ ] Graphiques masqués : OK / KO
- [ ] Pas de scroll horizontal : OK / KO

### 📝 Remarques
```
Notez ici tout ce qui ne va pas ou qui pourrait être amélioré :

- 
- 
- 
```

### 📱 Appareil Testé
- Marque : _________________
- Modèle : _________________
- Navigateur : _____________
- Largeur écran : __________px

---

## 🚀 Si Tout est OK

**Le site est prêt pour utilisation mobile !** ✅

Prochaine étape : Optimiser les autres onglets (Réservations, Ménages, etc.)

---

## ❓ Besoin d'Aide ?

Si quelque chose ne fonctionne pas :
1. **Faire une capture d'écran** du problème
2. **Ouvrir F12 → Console** et copier les erreurs
3. **Me signaler** avec tous ces détails

Je corrigerai immédiatement ! 🔧
