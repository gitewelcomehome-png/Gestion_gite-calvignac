# Fix : Frais Réels Individuels par Salarié

**Date** : 20 janvier 2026  
**Version** : v=1737331200

## 📋 Problème Résolu

### Problèmes Identifiés
1. ❌ Nombre d'enfants ne se sauvegardait pas
2. ❌ Interface frais réels globale pas adaptée au système fiscal français
3. ❌ Confusion entre frais professionnels LMP et frais réels IR
4. ❌ Pas de choix individuel entre 10% forfaitaire et frais réels par personne

### Clarification Fiscale
- **Frais réels IR** = déplacements domicile-travail pour salariés
- Chaque salarié (Madame/Monsieur) peut choisir INDIVIDUELLEMENT :
  - 10% d'abattement forfaitaire (min 472€, max 13 522€)
  - OU frais réels basés sur km × barème CV + péages

## ✅ Solution Implémentée

### 1. Interface HTML
- ✅ Bouton `⚙️ Frais` à côté de chaque champ salaire
- ✅ Modal individuelle pour Madame ET Monsieur
- ✅ Choix clair : radio button 10% forfaitaire / frais réels
- ✅ Champs conditionnels : km, puissance fiscale, péages
- ✅ Affichage du résumé sous chaque salaire

**Fichier modifié** : `pages/tab-fiscalite-v2.html`

```html
<!-- Exemple structure -->
<button onclick="openFraisReelsSalarieModal('madame')">⚙️ Frais</button>
<div id="frais-madame-info" style="display: none;"></div>
```

### 2. JavaScript - Nouvelles Fonctions

**Fichier modifié** : `js/fiscalite-v2.js`

#### Variables Globales
```javascript
window.fraisMadameData = { option: 'forfaitaire', km: 0, cv: 5, peages: 0, montant: 0 };
window.fraisMonsieurData = { option: 'forfaitaire', km: 0, cv: 5, peages: 0, montant: 0 };
```

#### Fonctions Créées
1. `openFraisReelsSalarieModal(personne)` : Ouvrir modal pour Madame ou Monsieur
2. `toggleOptionFraisSalarie(option)` : Afficher/masquer champs frais réels
3. `calculerFraisSalarieModal()` : Calcul en temps réel du montant déductible
4. `closeFraisReelsSalarieModal()` : Fermer sans sauvegarder
5. `validerFraisSalarie()` : Sauvegarder et recalculer IR

#### Fonction calculerIR() Mise à Jour
```javascript
// Avant : calcul global avec répartition proportionnelle
// Après : calcul individuel par personne

// Calcul abattement Madame
if (fraisMadame.option === 'reel') {
    abattementMadame = fraisMadame.montant;
} else {
    // 10% avec min 472€ et max 13 522€
    abattementMadame = salaireMadameBrut * 0.10;
    abattementMadame = Math.max(472, Math.min(abattementMadame, 13522));
}

// Idem pour Monsieur
```

### 3. Sauvegarde et Chargement

#### Sauvegarde
```javascript
detailsData.frais_madame = window.fraisMadameData;
detailsData.frais_monsieur = window.fraisMonsieurData;
```

Structure JSON sauvegardée :
```json
{
  "frais_madame": {
    "option": "forfaitaire|reel",
    "km": 0,
    "cv": 5,
    "peages": 0,
    "montant": 0
  },
  "frais_monsieur": { ... }
}
```

#### Chargement
- ✅ Restauration dans `chargerAnnee()`
- ✅ Restauration dans `chargerDerniereSimulation()`
- ✅ Affichage automatique du résumé sous chaque salaire

### 4. Barème Kilométrique 2026

| CV | Taux €/km |
|----|-----------|
| 3  | 0.529     |
| 4  | 0.606     |
| 5  | 0.636     |
| 6  | 0.665     |
| 7+ | 0.697     |

Formule : `montant = (km × taux) + péages`

## 🔧 Fichiers Modifiés

1. **pages/tab-fiscalite-v2.html**
   - Ajout boutons ⚙️ Frais individuels
   - Suppression ancienne interface globale
   - Ajout modal-frais-salarie

2. **js/fiscalite-v2.js**
   - Suppression anciennes fonctions (openFraisReelsModal, etc.)
   - Ajout nouvelles fonctions individuelles
   - Mise à jour calculerIR()
   - Mise à jour sauvegarderDonneesFiscales()
   - Mise à jour chargerAnnee() et chargerDerniereSimulation()
   - Export des nouvelles fonctions dans window

3. **index.html**
   - Cache busting : `v=1737331200`

## ✨ Fonctionnalités

### Expérience Utilisateur

1. **Madame déclare son salaire :**
   - Clique sur `⚙️ Frais` à côté de son salaire
   - Choisit : 10% forfaitaire OU frais réels
   - Si frais réels : saisit km, puissance fiscale, péages
   - Voit le montant calculé en temps réel
   - Valide → résumé affiché sous son salaire

2. **Monsieur déclare son salaire :**
   - Processus identique, indépendant de Madame
   - Peut choisir une option différente

3. **Calcul IR :**
   - Abattement appliqué individuellement
   - Revenu imposable = salaire brut - abattement individuel
   - Calcul barème progressif sur revenu total après abattements

### Cas d'Usage

**Exemple 1 : Les deux choisissent 10%**
- Madame : 30 000€ brut → abattement 3 000€ (10%)
- Monsieur : 35 000€ brut → abattement 3 500€ (10%)

**Exemple 2 : Mix forfaitaire/réel**
- Madame : 30 000€ brut → forfaitaire 3 000€
- Monsieur : 35 000€ brut → frais réels 150 km/jour × 210 jours = 31 500 km × 0.636€ + 500€ péages = 20 554€ + 500€ = 21 054€

**Exemple 3 : Les deux en frais réels**
- Madame : petits trajets → frais réels 2 500€
- Monsieur : longs trajets → frais réels 18 000€

## 🐛 Bugs Corrigés

1. ✅ Nombre d'enfants ne se sauvegardait pas
   - Déjà corrigé par le fix !== undefined (voir ERREURS_CRITIQUES.md)

2. ✅ Ancien système de frais réels global supprimé
   - Évite confusion avec frais professionnels LMP

3. ✅ Interface plus claire et conforme au système fiscal français

## 🚨 Points d'Attention

### Validation
- ❗ Tester avec valeurs 0 (déjà géré par !== undefined)
- ❗ Tester sauvegarde/chargement des deux personnes
- ❗ Vérifier calcul IR avec différentes combinaisons
- ❗ Vérifier affichage résumé après rechargement page

### Performance
- ✅ Aucun impact : calcul simple en JavaScript
- ✅ Sauvegarde : 2 objets JSON en plus (négligeable)

### Sécurité
- ✅ Pas d'injection possible : valeurs numériques typées
- ✅ Validation côté client avant sauvegarde
- ✅ Barème en dur dans le code (pas modifiable par utilisateur)

## 📚 Documentation Associée

- **ERREURS_CRITIQUES.md** : Bug falsy values (0 || '' returns '')
- **ARCHITECTURE.md** : Structure table fiscal_history
- **GUIDE_COMPLET.md** : Guide utilisateur fiscalité

## 🎯 Tests à Effectuer

### Checklist de Validation
- [ ] Ouvrir modal Madame → saisir frais réels → valider → vérifier résumé
- [ ] Ouvrir modal Monsieur → choisir 10% forfaitaire → valider → vérifier résumé
- [ ] Sauvegarder → recharger page → vérifier données restaurées
- [ ] Tester avec salaire 0 pour une personne
- [ ] Tester avec 3 enfants (parts fiscales)
- [ ] Vérifier calcul IR avec différentes combinaisons
- [ ] Tester annulation modal (ne doit rien sauvegarder)
- [ ] Vérifier console : 0 erreur tolérée

### Scénarios Critiques
1. **Madame uniquement** : salaire Monsieur = 0
2. **Frais réels > salaire** : montant déductible plafonné ?
3. **Changement d'option** : basculer de forfaitaire à réel et vice-versa

## 💡 Améliorations Futures

1. 🔮 Tooltip explicatif sur choix 10% vs frais réels
2. 🔮 Calculateur d'aide : "km domicile-travail × jours travaillés"
3. 🔮 Alerte si frais réels < 10% forfaitaire (moins avantageux)
4. 🔮 Historique des choix par année
5. 🔮 Export PDF avec détail des frais réels

## 🔗 Références Légales

- BOFiP : Frais de déplacement domicile-travail
- Barème kilométrique 2026 : applicable jusqu'au 31/12/2026
- Abattement forfaitaire 10% : min 472€, max 13 522€ par personne
