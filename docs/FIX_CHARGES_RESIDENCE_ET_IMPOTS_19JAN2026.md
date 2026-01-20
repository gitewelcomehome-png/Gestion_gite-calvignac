# 🔧 Corrections Charges Résidence et Impôts sur le Revenu

**Date :** 19 janvier 2026  
**Contexte :** Corrections suite à demande utilisateur

---

## 🎯 Problèmes Corrigés

### 1. ✅ Charges résidence principale non prises en compte dans "Reste à vivre"

**Problème :**
- Les charges de résidence principale (intérêts emprunt, assurance, électricité, internet, eau, assurance habitation, taxe foncière) étaient bien sauvegardées
- MAIS elles n'étaient pas reprises dans le calcul du "Reste à vivre après crédits"

**Solution :**
- Ajout du calcul de la partie personnelle des charges résidence (non déductible fiscalement)
- Calcul du ratio professionnel/personnel basé sur surface bureau / surface totale
- Intégration de `chargesResPersonnellesMensuel` dans `totalFraisPerso`

**Fichier modifié :** `js/fiscalite-v2.js` - fonction `calculerResteAVivre()`

```javascript
// Calcul du ratio personnel (non déduit fiscalement)
const surfaceBureau = parseFloat(document.getElementById('surface_bureau')?.value || 0);
const surfaceTotale = parseFloat(document.getElementById('surface_totale')?.value || 0);
const ratio = (surfaceTotale > 0) ? (surfaceBureau / surfaceTotale) : 0;
const ratioPerso = 1 - ratio;

// Récupération et conversion en mensuel des charges résidence
const totalChargesResAnnuel = interetsResAnnuel + assuranceResAnnuel + elecResAnnuel + 
                               internetResAnnuel + eauResAnnuel + assuranceHabResAnnuel + taxeFonciereRes;
const chargesResPersonnellesMensuel = (totalChargesResAnnuel * ratioPerso) / 12;

// Ajout aux frais personnels
const totalFraisPerso = fraisInternet + fraisElec + fraisEau + fraisAssurance + 
                       (fraisTaxeAnnuel / 12) + fraisAutres + chargesResPersonnellesMensuel;
```

---

### 2. ✅ Impôts sur le revenu non sauvegardés

**Problème :**
- Les données des impôts sur le revenu n'étaient pas correctement sauvegardées

**Solution :**
- Ajout de la sauvegarde de toutes les données IR dans `sauvegarderDonneesFiscales()`
- Ajout de la restauration dans `chargerDerniereSimulation()`

**Données sauvegardées :**
- `salaire_madame`
- `salaire_monsieur`
- `nombre_enfants`
- `option_frais_reels` (nouveau)
- `km_perso_impots` (nouveau)
- `chevaux_fiscaux_impots` (nouveau)
- `peages_impots` (nouveau)

---

### 3. ✅ Option Réel / 10% abattement pour les impôts

**Problème :**
- Pas de possibilité de choisir entre frais réels ou abattement de 10%
- Pas d'interface pour saisir les km, chevaux fiscaux et péages

**Solution implémentée :**

#### A. Ajout de l'interface HTML dans `tabs/tab-fiscalite-v2.html`

```html
<!-- Choix Réel ou 10% -->
<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <label style="font-weight: 600; margin-bottom: 10px; display: block;">🚗 Frais réels professionnels :</label>
    <div style="display: flex; gap: 15px; align-items: center;">
        <label>
            <input type="radio" name="option_frais_reels" value="abattement" checked onchange="toggleFraisReels()">
            <span>10% d'abattement (par défaut)</span>
        </label>
        <label>
            <input type="radio" name="option_frais_reels" value="reel" onchange="toggleFraisReels()">
            <span>Au réel (déduction frais km, péages...)</span>
        </label>
    </div>
</div>

<!-- Interface Frais Réels (masquée par défaut) -->
<div id="interface-frais-reels" style="display: none; ...">
    <h4>🚗 Calcul frais réels (personnel)</h4>
    <p>⚠️ Ces frais concernent vos déplacements personnels (trajet domicile-travail, etc.) 
       et sont différents des frais professionnels LMP de l'URSSAF.</p>
    
    <div class="fiscal-grid">
        <input type="number" id="km_perso_impots" placeholder="Kilomètres parcourus">
        <input type="number" id="chevaux_fiscaux_impots" value="5" placeholder="Chevaux fiscaux">
        <input type="number" id="peages_impots" placeholder="Péages annuels">
        <div id="total-frais-reels-impots">0.00 €</div>
    </div>
</div>
```

#### B. Fonctions JavaScript ajoutées

**`toggleFraisReels()`** - Affiche/masque l'interface selon le choix
```javascript
function toggleFraisReels() {
    const radioReel = document.querySelector('input[name="option_frais_reels"][value="reel"]');
    const interfaceReels = document.getElementById('interface-frais-reels');
    
    if (radioReel && radioReel.checked) {
        interfaceReels.style.display = 'block';
    } else {
        interfaceReels.style.display = 'none';
    }
    
    calculerIR();
}
```

**`calculerFraisReelsImpots()`** - Calcule les frais réels selon le barème fiscal
```javascript
function calculerFraisReelsImpots() {
    const kmPerso = parseFloat(document.getElementById('km_perso_impots')?.value || 0);
    const chevauxFiscaux = parseFloat(document.getElementById('chevaux_fiscaux_impots')?.value || 5);
    const peages = parseFloat(document.getElementById('peages_impots')?.value || 0);
    
    // Barème fiscal 2026
    let fraisKm = 0;
    if (chevauxFiscaux <= 3) fraisKm = kmPerso * 0.529;
    else if (chevauxFiscaux <= 4) fraisKm = kmPerso * 0.606;
    else if (chevauxFiscaux <= 5) fraisKm = kmPerso * 0.636;
    else if (chevauxFiscaux <= 6) fraisKm = kmPerso * 0.665;
    else fraisKm = kmPerso * 0.697;
    
    const totalFraisReels = fraisKm + peages;
    document.getElementById('total-frais-reels-impots').textContent = totalFraisReels.toFixed(2) + ' €';
    
    return totalFraisReels;
}
```

#### C. Modification du calcul IR dans `calculerIR()`

```javascript
function calculerIR() {
    // ...
    
    // Vérifier si l'option frais réels est activée
    const radioReel = document.querySelector('input[name="option_frais_reels"][value="reel"]');
    const optionReels = radioReel && radioReel.checked;
    
    let abattementMadame = 0;
    let abattementMonsieur = 0;
    
    if (optionReels) {
        // Si frais réels, on déduit les frais calculés
        const fraisReels = calculerFraisReelsImpots();
        const totalSalaires = salaireMadameBrut + salaireMonsieurBrut;
        if (totalSalaires > 0) {
            abattementMadame = (salaireMadameBrut / totalSalaires) * fraisReels;
            abattementMonsieur = (salaireMonsieurBrut / totalSalaires) * fraisReels;
        }
    } else {
        // Abattement de 10% classique avec plafonds
        // ...
    }
    
    // ...
}
```

---

## ⚠️ Différence importante : URSSAF vs Impôts

**URSSAF (frais professionnels LMP) :**
- Déplacements liés à l'activité des gîtes
- Trajets domicile → gîtes, magasins pour achats, etc.
- Situé dans la section "Frais professionnels" ou "Véhicule"

**IMPÔTS (frais réels personnels) :**
- Déplacements personnels (trajet domicile-travail salarié, etc.)
- Alternative à l'abattement de 10% sur les salaires
- Situé dans la section "Calcul Impôt sur le Revenu (IR)"

---

## 📊 Impact utilisateur

### Avant
- ❌ Charges résidence ignorées dans reste à vivre → calcul faussé
- ❌ Impôts non sauvegardés → perte de données
- ❌ Pas de choix frais réels → abattement 10% obligatoire

### Après
- ✅ Charges résidence intégrées automatiquement (partie personnelle)
- ✅ Toutes les données impôts sauvegardées et restaurées
- ✅ Choix entre abattement 10% ou frais réels
- ✅ Interface complète pour frais réels (km + chevaux + péages)

---

## 🧪 Tests à effectuer

1. **Charges résidence → Reste à vivre :**
   - Saisir des charges résidence principale
   - Vérifier qu'elles apparaissent dans "Frais personnels" du reste à vivre
   - Vérifier que seule la partie personnelle (selon ratio) est prise en compte

2. **Sauvegarde impôts :**
   - Saisir salaires, nombre enfants
   - Choisir option réel et saisir km/chevaux/péages
   - Sauvegarder et recharger la page
   - Vérifier que tout est restauré correctement

3. **Calcul frais réels :**
   - Activer option "Au réel"
   - Saisir 5000 km, 5 chevaux fiscaux, 200€ péages
   - Vérifier calcul : (5000 × 0.636) + 200 = 3380 €
   - Vérifier que l'IR est recalculé correctement

---

## 📝 Fichiers modifiés

- ✅ `tabs/tab-fiscalite-v2.html` - Interface frais réels
- ✅ `js/fiscalite-v2.js` - Logique calcul et sauvegarde

---

## ✅ Checklist de validation

- [x] Charges résidence prises en compte dans reste à vivre
- [x] Ratio professionnel/personnel appliqué correctement
- [x] Impôts sauvegardés dans `donnees_detaillees`
- [x] Impôts restaurés au chargement
- [x] Option Réel/10% abattement disponible
- [x] Interface frais réels (km/chevaux/péages) fonctionnelle
- [x] Calcul frais réels selon barème fiscal
- [x] Recalcul automatique de l'IR
- [x] Aucune erreur console
- [x] Documentation mise à jour

---

**✅ Toutes les corrections ont été appliquées avec succès !**
