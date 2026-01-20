# Erreurs Critiques & Solutions

> **Objectif:** Tracer les erreurs critiques rencontrées et leurs solutions pour éviter les régressions

---

## 📋 Format d'Entrée

```
### [DATE] - Titre de l'erreur

**Contexte:**
Description de la situation

**Erreur:**
Message d'erreur exact ou comportement

**Cause:**
Origine du problème

**Solution:**
Comment le problème a été résolu

**Prévention:**
Ce qu'il faut faire pour éviter que ça se reproduise

---
```

---

## 🔴 Erreurs Référencées

### [20 Janvier 2026] - Frais réels impôts : interface globale inadaptée

**Contexte:**
L'interface des frais réels pour l'impôt sur le revenu utilisait un système global avec répartition proportionnelle des km entre Madame et Monsieur. Or, le système fiscal français permet à **chaque salarié** de choisir individuellement entre :
- 10% d'abattement forfaitaire (min 472€, max 13 522€)
- OU frais réels (déplacements domicile-travail)

**Erreur:**
1. Nombre d'enfants ne se sauvegardait pas
2. Interface unique pour les deux salariés → pas de choix individuel
3. Confusion entre "frais professionnels LMP" et "frais réels IR"
4. Pas d'affichage clair du mode de déduction choisi

**Cause:**
- Mauvaise compréhension du système fiscal français
- Code pensé pour un calcul global avec répartition au prorata
- Interface HTML ne permettant pas le choix par personne

**Solution:**
Refonte complète du système de frais réels :

1. **HTML** : Bouton `⚙️ Frais` individuel à côté de chaque salaire
2. **Modal** : Une modal dédiée pour Madame ET Monsieur avec :
   - Radio button : 10% forfaitaire / frais réels
   - Champs conditionnels : km, puissance fiscale, péages
   - Calcul temps réel du montant déductible
3. **JavaScript** : 
   - Variables globales : `fraisMadameData` et `fraisMonsieurData`
   - Fonctions : `openFraisReelsSalarieModal(personne)`, `validerFraisSalarie()`, etc.
4. **Calcul IR** : Abattement appliqué individuellement par personne
5. **Sauvegarde BDD** : 2 objets JSON distincts (`frais_madame`, `frais_monsieur`)

**Fichiers modifiés:**
- `pages/tab-fiscalite-v2.html` : Suppression interface globale + ajout modal individuelle
- `js/fiscalite-v2.js` : Nouvelles fonctions + mise à jour calculerIR() + sauvegarde/chargement
- `index.html` : Cache busting v=1737331200
- Documentation : `docs/FIX_FRAIS_REELS_INDIVIDUELS.md`

**Prévention:**
- Toujours vérifier la règle fiscale avant d'implémenter une fonctionnalité
- Frais réels IR ≠ Frais professionnels LMP
- Tester avec différentes combinaisons : forfaitaire/réel, 0€, etc.

---

### [19 Janvier 2026] - Valeurs 0 non restaurées (bug falsy values)

**Contexte:**
Les charges de résidence principale étaient sauvegardées en base de données avec des valeurs à 0, mais après rechargement de la page, les champs restaient vides au lieu d'afficher "0.00".

**Erreur:**
Les champs de résidence (intérêts, assurance, électricité, etc.) restaient vides après rechargement alors que la base de données contenait bien la valeur `0`.

**Cause:**
Bug JavaScript classique avec les "falsy values". Le code utilisait l'opérateur `||` pour les valeurs par défaut :

```javascript
// ❌ ERREUR : 0 est falsy, donc remplacé par ''
interetsRes.value = details.interets_residence || '';
```

Quand `details.interets_residence` vaut `0`, l'expression `0 || ''` retourne `''` car `0` est considéré comme falsy en JavaScript.

**Solution:**
Remplacer l'opérateur `||` par un test strict `!== undefined` :

```javascript
// ✅ CORRECT : 0 n'est pas undefined, donc on garde 0
interetsRes.value = details.interets_residence !== undefined ? details.interets_residence : '';
```

Appliqué à tous les champs de résidence dans la fonction `chargerAnnee()` (lignes 1294-1337 de fiscalite-v2.js).

**Fichiers modifiés:**
- `js/fiscalite-v2.js` - fonction `chargerAnnee()`, restauration des 7 champs de résidence

**Prévention:**
- **TOUJOURS** utiliser `!== undefined` ou `!== null` au lieu de `||` quand la valeur `0` est valide
- Attention aux valeurs falsy en JavaScript : `0`, `''`, `false`, `null`, `undefined`, `NaN`
- Tester avec des valeurs à 0 lors des tests de sauvegarde/restauration

---

### [19 Janvier 2026] - Frais résidence principale non sauvegardés

**Contexte:**
Les utilisateurs saisissaient les charges de résidence principale (intérêts emprunt, assurance, électricité, etc.) mais après rechargement de la page, les valeurs n'étaient pas restaurées.

**Erreur:**
Les champs de résidence principale perdaient leurs valeurs après sauvegarde/rechargement.

**Cause:**
Le code JavaScript cherchait des éléments HTML avec des IDs comme `interets_residence_type`, `assurance_residence_type`, etc. pour récupérer le type (mensuel/annuel), mais **ces éléments n'existent pas dans le HTML**. 

Les champs utilisent l'attribut `data-period-type` directement sur l'input :
```html
<input type="number" id="interets_residence" data-period-type="mensuel">
```

Mais le code essayait de faire :
```javascript
// ❌ ERREUR : cet élément n'existe pas !
document.getElementById('interets_residence_type')?.value
```

Résultat : 
- Lors de la sauvegarde : le type récupéré était toujours `undefined` ou `'mensuel'` par défaut
- Lors de la restauration : tentative d'écrire dans des éléments inexistants
- La fonction `getAnnualValue()` ne trouvait pas le type et utilisait `'annuel'` par défaut, faussant les calculs

**Solution:**
1. **Modification de `getAnnualValue()`** pour lire `data-period-type` si l'élément `typeFieldId` n'existe pas :
```javascript
function getAnnualValue(fieldId, typeFieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return 0;
    
    const value = parseFloat(field.value || 0);
    
    // Essayer d'abord typeFieldId
    const typeField = document.getElementById(typeFieldId);
    let type = typeField?.value;
    
    // Sinon, utiliser data-period-type
    if (!type) {
        type = field.getAttribute('data-period-type') || 'annuel';
    }
    
    return type === 'mensuel' ? value * 12 : value;
}
```

2. **Modification de la sauvegarde** pour lire depuis `data-period-type` :
```javascript
detailsData.interets_residence_type = document.getElementById('interets_residence')?.getAttribute('data-period-type') || 'mensuel';
```

3. **Modification de la restauration** pour écrire dans `data-period-type` :
```javascript
const interetsRes = document.getElementById('interets_residence');
if (interetsRes) {
    interetsRes.value = details.interets_residence || '';
    if (details.interets_residence_type) {
        interetsRes.setAttribute('data-period-type', details.interets_residence_type);
    }
}
```

**Fichiers modifiés:**
- `js/fiscalite-v2.js` - Fonctions `getAnnualValue()`, `sauvegarderDonneesFiscales()`, `chargerDerniereSimulation()`

**Prévention:**
- Toujours vérifier que les IDs utilisés dans le JavaScript existent réellement dans le HTML
- Utiliser la console pour vérifier que `document.getElementById()` ne retourne pas `null`
- Tester le cycle complet : saisie → sauvegarde → rechargement → vérification

---

### [19 Janvier 2026] - Variable config non définie dans calculerIR()

**Contexte:**
Après l'ajout de l'option frais réels/abattement 10% pour les impôts, l'erreur `ReferenceError: config is not defined` apparaissait dans la console à la ligne 559 de fiscalite-v2.js.

**Erreur:**
```javascript
Uncaught ReferenceError: config is not defined at calculerIR (fiscalite-v2.js:559:20)
```

**Cause:**
La variable `config` était déclarée dans le bloc `else` (abattement 10%) mais utilisée plus bas dans la fonction en dehors de ce bloc pour accéder au barème IR. Quand l'option "frais réels" était cochée, le bloc else n'était pas exécuté et `config` n'était jamais définie.

**Solution:**
Déplacer la déclaration de `config` au début de la fonction `calculerIR()`, avant le test de l'option frais réels :

```javascript
function calculerIR() {
    const salaireMadameBrut = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieurBrut = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const revenuLMP = parseFloat(document.getElementById('revenu_lmp')?.value || 0);
    const nbEnfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
    
    // Récupérer la config fiscale pour l'année en cours (DOIT être au début)
    const annee = new Date().getFullYear();
    const config = window.TAUX_FISCAUX.getConfig(annee);
    
    // Vérifier si l'option frais réels est activée
    const radioReel = document.querySelector('input[name="option_frais_reels"][value="reel"]');
    const optionReels = radioReel && radioReel.checked;
    
    // ... suite du code
}
```

**Prévention:**
- Toujours déclarer les variables utilisées dans plusieurs branches conditionnelles au niveau supérieur
- Tester toutes les branches d'un code conditionnel (option réel ET abattement 10%)
- Vérifier la portée (scope) des variables avant de les utiliser

---

### [19 Janvier 2026] - Charges résidence non prises en compte dans reste à vivre

**Contexte:**
Les charges de résidence principale (intérêts emprunt, assurance, électricité, internet, eau, assurance habitation, taxe foncière) étaient bien saisies et sauvegardées, mais elles n'apparaissaient pas dans le calcul du "Reste à vivre après crédits".

**Erreur:**
Le calcul du reste à vivre ne prenait pas en compte les charges personnelles de la résidence principale, ce qui faussait complètement l'estimation du reste à vivre réel.

**Cause:**
Dans la fonction `calculerResteAVivre()` du fichier `js/fiscalite-v2.js`, seuls les frais personnels saisis directement dans la section "Reste à vivre" étaient pris en compte. Les charges de résidence principale (qui sont partiellement déductibles fiscalement) n'étaient pas du tout intégrées dans les frais personnels.

**Solution:**
1. Calcul du ratio professionnel/personnel basé sur `surface_bureau / surface_totale`
2. Calcul de la partie personnelle : `ratioPerso = 1 - ratio`
3. Récupération de toutes les charges résidence et conversion en montant annuel
4. Application du ratio personnel : `chargesResPersonnellesMensuel = (totalChargesResAnnuel * ratioPerso) / 12`
5. Ajout aux frais personnels : `totalFraisPerso += chargesResPersonnellesMensuel`

**Fichier modifié:** `js/fiscalite-v2.js` - fonction `calculerResteAVivre()`

**Prévention:**
- Toujours vérifier que les données saisies dans une section sont bien utilisées dans les calculs liés
- Penser à la distinction entre partie professionnelle (déductible fiscalement) et partie personnelle (non déductible mais dépense réelle)

---

### [19 Janvier 2026] - Impôts sur le revenu non sauvegardés

**Contexte:**
Les utilisateurs saisissaient leurs salaires, nombre d'enfants et autres données pour le calcul de l'impôt sur le revenu, mais après rechargement de la page, toutes ces données étaient perdues.

**Erreur:**
Les données de la section "Calcul Impôt sur le Revenu (IR)" n'étaient pas sauvegardées dans la base de données.

**Cause:**
Les champs `salaire_madame`, `salaire_monsieur`, `nombre_enfants` étaient bien collectés dans `sauvegarderDonneesFiscales()` et sauvegardés dans `donnees_detaillees`, mais la fonction `chargerDerniereSimulation()` les restaurait correctement. Le problème était que les nouvelles options de frais réels (ajoutées dans cette correction) n'étaient pas sauvegardées.

**Solution:**
1. Ajout de la sauvegarde des nouvelles données dans `sauvegarderDonneesFiscales()` :
   - `option_frais_reels` (reel ou abattement)
   - `km_perso_impots`
   - `chevaux_fiscaux_impots`
   - `peages_impots`

2. Ajout de la restauration dans `chargerDerniereSimulation()` :
   - Restauration du choix radio button
   - Restauration de tous les champs
   - Appel de `toggleFraisReels()` pour afficher/masquer l'interface

**Prévention:**
- Toujours penser à ajouter la sauvegarde ET la restauration des nouveaux champs
- Tester le cycle complet : saisie → sauvegarde → rechargement → vérification

---

### [19 Janvier 2026] - Absence d'option frais réels pour les impôts

**Contexte:**
Les utilisateurs ne pouvaient pas choisir entre l'abattement de 10% (option par défaut) et la déduction des frais réels pour le calcul de l'impôt sur le revenu. Cette option est pourtant importante car elle peut être plus avantageuse selon les situations (notamment pour ceux qui font beaucoup de kilomètres).

**Erreur:**
Pas d'interface pour :
1. Choisir entre abattement 10% ou frais réels
2. Saisir les km parcourus, chevaux fiscaux et péages (si option réel)
3. Différencier les frais personnels (impôts) des frais professionnels (URSSAF)

**Cause:**
Fonctionnalité non implémentée initialement.

**Solution:**
1. **Interface HTML** (`tabs/tab-fiscalite-v2.html`) :
   - Ajout de radio buttons pour choisir entre "10% d'abattement" et "Au réel"
   - Ajout d'une div `interface-frais-reels` (masquée par défaut) contenant :
     - Champ km parcourus (personnel/an)
     - Champ chevaux fiscaux
     - Champ péages annuels
     - Affichage du total calculé

2. **Fonctions JavaScript** (`js/fiscalite-v2.js`) :
   - `toggleFraisReels()` : Affiche/masque l'interface selon le choix
   - `calculerFraisReelsImpots()` : Calcule les frais réels selon le barème fiscal 2026
   - Modification de `calculerIR()` pour utiliser les frais réels ou l'abattement selon le choix

3. **Barème fiscal appliqué** :
   - ≤ 3 CV : 0.529 €/km
   - 4 CV : 0.606 €/km
   - 5 CV : 0.636 €/km
   - 6 CV : 0.665 €/km
   - ≥ 7 CV : 0.697 €/km
   - + Péages

**Distinction importante:**
- **URSSAF** : Frais professionnels LMP (trajets pour les gîtes)
- **IMPÔTS** : Frais personnels (trajet domicile-travail salarié)

**Prévention:**
- Toujours proposer les options fiscales légales aux utilisateurs
- Bien différencier les frais professionnels (URSSAF) et personnels (Impôts)
- Documenter clairement la différence pour éviter la confusion

---

### [13 Janvier 2026] - Initialisation du fichier

**Note:** Ce fichier sera alimenté au fur et à mesure des erreurs critiques rencontrées.

---

### [13 Janvier 2026] - IDs UUID non quotés dans onclick causant SyntaxError

**Contexte:**
Les boutons Modifier/Supprimer/Fiche Client dans reservations.js et dashboard.js ne fonctionnaient pas. Erreur console : "Uncaught SyntaxError: Invalid or unexpected token (at (index):1:28)"

**Erreur:**
```javascript
onclick="aperçuFicheClient(${r.id})"
// Génère: aperçuFicheClient(feb33125-130a-4299-b9fd-1ea17784fc73)
// ❌ UUID interprété comme du code JavaScript invalide (tirets = opérateurs de soustraction)
```

**Cause:**
Les UUID contiennent des tirets (-) qui sont interprétés comme des opérateurs de soustraction en JavaScript quand ils ne sont pas entre guillemets. Sans guillemets, le navigateur essaie d'évaluer `feb33125-130a-4299-b9fd-1ea17784fc73` comme une expression mathématique invalide.

**Solution:**
Ajouter des guillemets simples autour des IDs dans tous les onclick :
```javascript
onclick="aperçuFicheClient('${r.id}')"
// Génère: aperçuFicheClient('feb33125-130a-4299-b9fd-1ea17784fc73')
// ✅ UUID passé comme string valide
```

**Fichiers modifiés:**
- `js/reservations.js` lignes 104-106, 481, 486-488
- `js/dashboard.js` lignes 404, 409

**Prévention:**
- **TOUJOURS** mettre des guillemets simples autour des variables UUID/ID dans les attributs onclick HTML
- Vérifier systématiquement tous les onclick lors de création de nouveaux boutons d'action
- Pattern à utiliser : `onclick="maFonction('${variable}')"`
- Pattern à éviter : `onclick="maFonction(${variable})"`

---

<!-- NOUVELLES ERREURS À AJOUTER CI-DESSOUS -->
