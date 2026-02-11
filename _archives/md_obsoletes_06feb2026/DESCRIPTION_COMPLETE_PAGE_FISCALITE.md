# 📋 DESCRIPTION COMPLÈTE - PAGE FISCALITÉ
*Document de vérification exhaustif - Généré le 05 février 2026*

---

## 📌 VUE D'ENSEMBLE

La page fiscalité est un **calculateur fiscal complet** permettant de :
- Gérer plusieurs années fiscales avec sauvegarde automatique
- Calculer les charges et le bénéfice imposable
- Comparer 4 régimes fiscaux (LMNP Réel, Micro-BIC 30%, Micro-BIC 50%, LMP Réel)
- Gérer les amortissements intelligents
- Calculer l'URSSAF et l'IR (Impôt sur le Revenu)
- Suivre les kilomètres professionnels
- Calculer le reste à vivre
- Gérer la trésorerie mensuelle

**Fichiers concernés :**
- HTML : `tabs/tab-fiscalite-v2.html` (1414 lignes)
- JavaScript : `js/fiscalite-v2.js` (6696 lignes)
- CSS : `css/tab-fiscalite.css` (1661 lignes)

---

## 🏗️ ARCHITECTURE GÉNÉRALE

### Structure en blocs collapsibles
Chaque section est repliable avec l'icône ▼ :
```javascript
// Fonction toggleBloc(titleElement)
// Permet de replier/déplier chaque section
```

### Sauvegarde automatique
- Déclenchée sur `input`, `change`, et `blur`
- Utilise un **debounce de 500ms** pour éviter la surcharge
- Sauvegarde dans **Supabase** (table `fiscalite_simulations`)
- Flag `isCalculatingTempsReel` pour éviter les boucles infinies

---

## 📊 SECTION 1 : HEADER & GESTION DES ANNÉES

### Affichage
```html
<h2>Fiscalité <span id="statut-fiscal-title">LMNP</span></h2>
```
- Titre dynamique qui affiche le statut fiscal actuel (LMNP, Micro-BIC, LMP)

### Sélecteur d'année
```html
<select id="annee_selector" onchange="chargerAnnee(this.value)">
```
**Logique :**
- Années disponibles générées dynamiquement depuis 2024 jusqu'à l'année actuelle +1
- Chargement automatique des données sauvegardées pour l'année sélectionnée
- Fonction `chargerAnnee(annee)` récupère les données depuis Supabase

### Bouton "Nouvelle Année"
```html
<button onclick="creerNouvelleAnnee()">
```
**Logique :**
- Crée l'année suivante (année actuelle + 1)
- Initialise un nouveau formulaire vierge
- Sauvegarde immédiate dans la base

### Indicateurs
```html
<div class="info-box">
  <span>CA calculé automatiquement | Sauvegarde automatique activée</span>
</div>
```

---

## 💰 SECTION 2 : CHIFFRE D'AFFAIRES & TABLEAU COMPARATIF

### 2.1 Chiffre d'Affaires (CA)

#### Affichage
```html
<input type="number" id="ca" value="0" step="0.01" 
       oninput="calculerTempsReel()">
```

#### Calcul automatique du CA
**Source :** Réservations validées dans l'année sélectionnée
```javascript
// Fonction calculerCAAutomatique()
// Somme des montants_total de toutes les réservations de l'année
// Statut: 'valide' uniquement
// Table: reservations
```

#### Badge MODE TEST
```html
<div id="badge-mode-test" style="display: none;">
  🧪 MODE TEST
</div>
```
**Logique :**
- S'affiche si l'utilisateur entre manuellement un CA différent du CA calculé
- Permet de tester des scénarios fiscaux
- Bouton "Tester" avec input `test-ca-input`

### 2.2 Tableau Comparatif des 4 Options Fiscales

#### Contrôles disponibles

**Sélecteur de statut fiscal :**
```html
<select id="statut_fiscal" onchange="changerStatutFiscal()">
  <option value="lmnp">LMNP</option>
  <option value="micro">Micro-BIC</option>
  <option value="lmp">LMP</option>
</select>
```

**Sélecteur de classement :**
```html
<select id="classement_meuble" onchange="calculerTempsReel()">
  <option value="non_classe">Non classé</option>
  <option value="classe">Classé ⭐</option>
</select>
```
- Affiché uniquement si statut = "micro"
- Impact sur les plafonds et abattements

**Champ de test CA :**
```html
<input type="number" id="test-ca-input" placeholder="🧪 CA de test">
<button onclick="appliquerTestCA()">Tester</button>
```

#### Option Versement Libératoire (VL)

```html
<div id="bloc-versement-liberatoire" style="display: none;">
  <input type="checkbox" id="option_versement_liberatoire">
  <span>Versement libératoire de l'IR (1% ou 1,7%)</span>
</div>
```

**Conditions d'affichage :**
- Affiché UNIQUEMENT si :
  - Statut = "micro" (Micro-BIC)
  - CA dans les plafonds Micro-BIC (≤ 15 000€ non classé OU ≤ 77 700€ classé)

**Taux applicables :**
- **1%** du CA pour meublé classé ⭐
- **1,7%** du CA pour meublé non classé

**Conditions d'éligibilité réelles** (non vérifiées dans l'appli) :
- RFR (Revenu Fiscal de Référence) N-2 < 29 315€ par part
- Option à exercer avant le 1er octobre N-1

#### LES 4 OPTIONS FISCALES COMPARÉES

##### 📌 OPTION 1 : LMNP RÉEL

**Card :** `#option-lmnp-reel`

**Calculs :**
```javascript
// URSSAF : calculé via calculerTempsReel()
const urssafReel = cotisations URSSAF (voir détail section URSSAF)

// IR : calculé via quotient familial
const irPartLMNPReel = IR total × (reste avant IR location / revenus globaux)

// TOTAL
const totalLMNPReel = urssafReel + irPartLMNPReel
```

**Affichage détaillé :**
```html
<div id="total-lmnp-reel">0 €</div>
<div id="urssaf-lmnp-reel">0 €</div>
<div id="ir-lmnp-reel">0 €</div>
```

**Conditions d'activation :**
```html
<div id="conditions-lmnp-reel">
```
- ✅ CA < 23 000€ : **Exonération totale URSSAF**
- ⚠️ CA ≥ 23 000€ ET recettes ≤ 50% revenus : **URSSAF obligatoire mais LMNP OK**
- ❌ CA > 23 000€ ET recettes > 50% revenus : **LMP obligatoire** (carte grisée)

**Badge :** `#badge-lmnp-reel` - Affiché si meilleure option

---

##### 📌 OPTION 2 : MICRO-BIC 30% (Non classé)

**Card :** `#option-micro-non-classe`

**Plafonds et taux :**
```javascript
const PLAFOND_MICRO_NON_CLASSE = 15000; // LOI 2025/2026
const ABATTEMENT_NON_CLASSE = 0.30; // 30%
const TAUX_COTIS_MICRO_NON_CLASSE = 0.212; // 21,2%
```

**Calculs :**
```javascript
// Bénéfice imposable
const abattement30 = Math.max(ca * 0.30, 305); // Min 305€
const beneficeMicro30 = ca - abattement30;

// URSSAF (0 si CA < 23 000€)
const cotisMicro30 = ca >= 23000 ? ca * 0.212 : 0;

// Reste avant IR
const resteAvantIR = beneficeMicro30 - cotisMicro30;

// IR (classique OU versement libératoire)
if (versementLiberatoire) {
  irPartMicro30 = ca * 0.017; // 1,7%
} else {
  irPartMicro30 = IR_total × (resteAvantIR / revenus_globaux);
}

// TOTAL
const totalMicro30 = cotisMicro30 + irPartMicro30;
```

**Conditions d'affichage :**
- ❌ Grisée si classement = "classe" sélectionné
- ✅ Affichée si classement = "non_classe"
- Condition CA : `ca <= 15000`

**Badge :** `#badge-micro-non-classe`

---

##### 📌 OPTION 3 : MICRO-BIC 50% ⭐ (Classé)

**Card :** `#option-micro-classe`

**Plafonds et taux :**
```javascript
const PLAFOND_MICRO_CLASSE = 77700; // LOI 2025/2026
const ABATTEMENT_CLASSE = 0.50; // 50%
const TAUX_COTIS_MICRO_CLASSE = 0.06; // 6%
```

**Calculs :**
```javascript
// Bénéfice imposable
const abattement50 = Math.max(ca * 0.50, 305);
const beneficeMicro50 = ca - abattement50;

// URSSAF (0 si CA < 23 000€)
const cotisMicro50 = ca >= 23000 ? ca * 0.06 : 0;

// Reste avant IR
const resteAvantIR = beneficeMicro50 - cotisMicro50;

// IR (classique OU versement libératoire)
if (versementLiberatoire) {
  irPartMicro50 = ca * 0.01; // 1%
} else {
  irPartMicro50 = IR_total × (resteAvantIR / revenus_globaux);
}

// TOTAL
const totalMicro50 = cotisMicro50 + irPartMicro50;
```

**Conditions d'affichage :**
- ❌ Grisée si classement = "non_classe" sélectionné
- ✅ Affichée si classement = "classe"
- Condition CA : `ca <= 77700`

**Badge :** `#badge-micro-classe`

---

##### 📌 OPTION 4 : LMP RÉEL

**Card :** `#option-lmp-reel`

**Critères LMP :**
```javascript
const critereCA_LMP = ca > 23000;
const criterePart_LMP = (recettes location / revenus globaux) > 50%;
const peutEtreLMP = critereCA_LMP && criterePart_LMP;
```

**Calculs :**
```javascript
// URSSAF : cotisations minimales garanties
const COTISATIONS_MINIMALES_LMP = 1200;
const urssafLMP = Math.max(urssafCalculé, 1200);

// Reste avant IR
const resteAvantIR = benefice - urssafLMP;

// IR
const irPartLMP = IR_total × (resteAvantIR / revenus_globaux);

// TOTAL
const totalLMP = urssafLMP + irPartLMP;
```

**Conditions d'affichage :**
```html
<div id="conditions-lmp-reel">
  • CA > 23 000€
  • Recettes > 50% revenus
</div>
```
- ✅ Vert si les 2 conditions remplies
- ❌ Rouge si l'une des conditions non remplie (carte grisée)

**Badge :** `#badge-lmp-reel`

---

#### Détermination de la meilleure option

**Algorithme :**
```javascript
// 1. Masquer tous les badges
// 2. Reset bordures et hover
// 3. Filtrer les options actives (non grisées)
// 4. Trouver le total le plus bas
const meilleure = options.reduce((min, opt) => 
  opt.total < min.total ? opt : min
);

// 5. Afficher le badge "✓ MEILLEUR"
badgeEl.style.display = 'block';

// 6. Bordure cyan + effet scale
optionEl.style.border = '3px solid #00C2CB';
optionEl.style.transform = 'scale(1.02)';

// 7. Message d'économie
const economieMax = Math.max(...totaux) - meilleure.total;
`🏆 ${meilleure.nom} est la meilleure option 
(économie jusqu'à ${economieMax}€/an)`
```

**Affichage :**
```html
<div id="meilleure-option" class="info-box">
  💡 Calculez pour voir la meilleure option
</div>
```
- Fond vert si résultat disponible
- Bordure gauche verte épaisse

---

## 🏠 SECTION 3 : CHARGES PAR GÎTE

### Génération dynamique

**Source des gîtes :**
```javascript
window.GITES_DATA // Chargé depuis Supabase (table: gites_users)
```

**Container :**
```html
<div id="gites-charges-container">
  <!-- Généré dynamiquement pour chaque gîte -->
</div>
```

### Structure par gîte

Chaque gîte a son propre bloc avec :

#### Toggle Mensuel/Annuel
```html
<div class="period-toggle-container">
  <button data-period="mensuel" onclick="togglePeriodSection('{giteSlug}', 'mensuel')">
    Mensuel
  </button>
  <button data-period="annuel" onclick="togglePeriodSection('{giteSlug}', 'annuel')">
    Annuel
  </button>
</div>
```

**Logique :**
- Par défaut : **Mensuel** (active)
- Affecte tous les champs avec `hasType: true`
- Conversion automatique : `valeur × 12` ou `valeur / 12`

#### Champs de charges

**Liste des champs :**
```javascript
const chargesFields = [
  { id: 'internet', label: 'Internet', hasType: true },
  { id: 'eau', label: 'Eau', hasType: true },
  { id: 'electricite', label: 'Électricité', hasType: true },
  { id: 'assurance_hab', label: 'Assurance habitation', hasType: true },
  { id: 'assurance_emprunt', label: 'Assurance emprunteur', hasType: true },
  { id: 'interets_emprunt', label: 'Intérêts emprunt', hasType: true },
  { id: 'menage', label: 'Ménage/Entretien', hasType: true },
  { id: 'linge', label: 'Linge (draps, serviettes)', hasType: true },
  { id: 'logiciel', label: 'Logiciel de gestion', hasType: true },
  { id: 'copropriete', label: 'Charges de copropriété', hasType: true },
  { id: 'taxe_fonciere', label: 'Taxe foncière (annuel)', hasType: false },
  { id: 'cfe', label: 'CFE (annuel)', hasType: false },
  { id: 'commissions', label: 'Commissions plateformes (annuel)', hasType: false },
  { id: 'amortissement', label: 'Amortissement du bien (annuel)', hasType: false }
];
```

**Génération HTML :**
```html
<!-- Exemple pour Internet -->
<div class="form-group">
  <label>Internet</label>
  <input type="number" 
         id="internet_{giteSlug}" 
         data-period-type="mensuel"
         step="0.01" 
         placeholder="0.00">
  <span class="period-label">mensuel</span>
</div>
```

**Calcul du total par gîte :**
```javascript
function calculerChargesBien(giteSlug) {
  // Charges avec période (converties en annuel)
  const internet = getAnnualValue(`internet_${giteSlug}`, `internet_${giteSlug}_type`);
  const eau = getAnnualValue(`eau_${giteSlug}`, `eau_${giteSlug}_type`);
  // ... etc
  
  // Charges annuelles fixes
  const taxeFonciere = parseFloat(document.getElementById(`taxe_fonciere_${giteSlug}`)?.value || 0);
  const cfe = parseFloat(document.getElementById(`cfe_${giteSlug}`)?.value || 0);
  // ... etc
  
  return internet + eau + electricite + ... + taxeFonciere + cfe + ...;
}
```

**Fonction helper :**
```javascript
function getAnnualValue(fieldId, typeFieldId) {
  const value = parseFloat(document.getElementById(fieldId)?.value || 0);
  const type = document.getElementById(typeFieldId)?.value || 'annuel';
  
  return type === 'mensuel' ? value * 12 : value;
}
```

---

## 🔧 SECTION 4 : FRAIS D'EXPLOITATIONS

### Structure

```html
<div class="fiscal-bloc collapsible collapsed">
  <h3>FRAIS D'EXPLOITATIONS</h3>
  <div class="bloc-content">
```

**3 sous-sections :**
1. **Travaux/Réparations** (orange)
2. **Frais divers** (vert)
3. **Produits d'accueil** (violet)

### 4.1 Travaux/Réparations

#### Bouton d'ajout
```html
<button onclick="ajouterTravaux()" class="btn-orange">
  ➕ Ajouter un travail
</button>
```

#### Structure d'une ligne
```html
<div class="liste-item" id="travaux-{id}">
  <input type="text" id="travaux-desc-{id}" placeholder="Description">
  <select id="travaux-type-{id}" onchange="verifierAmortissement()">
    <!-- Options d'amortissement -->
  </select>
  <select id="travaux-gite-{id}">
    <!-- Options de gîtes -->
  </select>
  <input type="number" id="travaux-montant-{id}" placeholder="Montant">
  <button onclick="supprimerItem('travaux', {id})">🗑️</button>
</div>
```

#### Système d'amortissement

**Règle de base :**
```javascript
const SEUIL_AMORTISSEMENT_HT = 600; // < 600€ = dépense courante
```

**Catégories d'amortissement :**
```javascript
const REGLES_AMORTISSEMENT = {
  categories: [
    // Structure et gros œuvre : 50 ans
    { id: 'structure', keywords: ['fondation', 'dalle', 'mur porteur', ...], duree: 50 },
    
    // Toiture et charpente : 25 ans
    { id: 'toiture', keywords: ['toiture', 'couverture', 'charpente', ...], duree: 25 },
    
    // Façades et étanchéité : 25 ans
    { id: 'facade', keywords: ['façade', 'ravalement', 'crépi', ...], duree: 25 },
    
    // Installations techniques : 15-20 ans
    { id: 'chauffage', keywords: ['chaudière', 'pompe à chaleur', 'pac', ...], duree: 15 },
    { id: 'plomberie', keywords: ['plomberie', 'tuyauterie', ...], duree: 20 },
    { id: 'electricite', keywords: ['électricité', 'tableau électrique', ...], duree: 20 },
    
    // Menuiseries : 15-20 ans
    { id: 'menuiseries', keywords: ['fenêtre', 'porte', 'volet', ...], duree: 20 },
    
    // Aménagements intérieurs : 10-15 ans
    { id: 'cuisine', keywords: ['cuisine équipée', 'kitchenette', ...], duree: 10 },
    { id: 'salle_bain', keywords: ['salle de bain', 'douche', ...], duree: 15 },
    { id: 'sol', keywords: ['parquet', 'carrelage', ...], duree: 15 },
    
    // Mobilier et équipements : 5-10 ans
    { id: 'mobilier', keywords: ['canapé', 'lit', 'matelas', ...], duree: 10 },
    { id: 'electromenager', keywords: ['lave-linge', 'lave-vaisselle', ...], duree: 7 },
    { id: 'equipement_audiovisuel', keywords: ['tv', 'télévision', ...], duree: 5 },
    
    // Informatique : 3 ans
    { id: 'informatique', keywords: ['ordinateur', 'portable', 'pc', ...], duree: 3 },
    
    // Décoration : 5 ans
    { id: 'decoration', keywords: ['décoration', 'linge de maison', ...], duree: 5 }
  ],
  
  defaut: { duree: 10, label: 'Dépense amortissable (durée standard)' }
};
```

**Détection automatique :**
```javascript
function detecterAmortissement(description, montant, typeChoisi) {
  // 1. Vérifier le seuil
  if (montant < 600) return null; // Dépense courante
  
  // 2. Si type choisi manuellement, l'utiliser
  if (typeChoisi && typeChoisi !== '') {
    // Retourner la catégorie correspondante
  }
  
  // 3. Sinon, détecter par mots-clés
  const descLower = description.toLowerCase();
  for (const cat of REGLES_AMORTISSEMENT.categories) {
    for (const keyword of cat.keywords) {
      if (descLower.includes(keyword)) {
        return {
          type: cat.label,
          duree: cat.duree,
          anneeFin: anneeActuelle + cat.duree - 1,
          montantAnnuel: (montant / cat.duree).toFixed(2)
        };
      }
    }
  }
  
  // 4. Défaut si aucune catégorie trouvée
  return { ...REGLES_AMORTISSEMENT.defaut };
}
```

**Génération des options :**
```javascript
function genererOptionsTypeAmortissement() {
  let html = '<option value="">Dépense courante (non amortissable)</option>';
  
  REGLES_AMORTISSEMENT.categories.forEach(cat => {
    html += `<option value="${cat.id}">${cat.label} (${cat.duree} ans)</option>`;
  });
  
  html += `<option value="autre">Autre (10 ans)</option>`;
  
  return html;
}
```

**Calcul amortissement année courante :**
```javascript
function calculerAmortissementsAnneeCourante() {
  const anneeSimulation = parseInt(document.getElementById('annee_simulation')?.value);
  let montantTotal = 0;
  const details = [];
  
  // Parcourir travaux, frais divers, produits d'accueil
  function traiterListe(items, type) {
    items.forEach(item => {
      // Ignorer dépenses courantes
      if (!item.type_amortissement || item.type_amortissement === '') return;
      
      const infoAmort = detecterAmortissement(
        item.description, 
        item.montant, 
        item.type_amortissement
      );
      
      if (!infoAmort) return;
      
      const montantAnnuel = parseFloat(infoAmort.montantAnnuel);
      const anneeDebut = anneeSimulation;
      const anneeFin = parseInt(infoAmort.anneeFin);
      
      // Vérifier si l'année est dans la période
      if (anneeSimulation >= anneeDebut && anneeSimulation <= anneeFin) {
        montantTotal += montantAnnuel;
        details.push({
          description: item.description,
          montantAnnuel: montantAnnuel,
          type: infoAmort.type,
          duree: infoAmort.duree,
          debut: anneeDebut,
          fin: anneeFin
        });
      }
    });
  }
  
  traiterListe(getTravauxListe(), 'travaux');
  traiterListe(getFraisDiversListe(), 'frais');
  traiterListe(getProduitsAccueilListe(), 'produits');
  
  return { montantAnnuel: montantTotal, details: details };
}
```

### 4.2 Frais divers

Même structure que Travaux, avec :
```html
<button onclick="ajouterFraisDivers()" class="btn-green">
  ➕ Ajouter un frais
</button>
```

### 4.3 Produits d'accueil

Même structure, avec :
```html
<button onclick="ajouterProduitAccueil()" class="btn-purple">
  ➕ Ajouter un produit
</button>
```

---

## 🏡 SECTION 5 : CHARGES RÉSIDENCE PRINCIPALE (Bureau)

### Ratio professionnel

```html
<div class="form-group">
  <label>Surface bureau (m²)</label>
  <input type="number" id="surface_bureau" step="0.01" 
         onchange="calculerRatio()">
</div>

<div class="form-group">
  <label>Surface totale logement (m²)</label>
  <input type="number" id="surface_totale" step="0.01" 
         onchange="calculerRatio()">
</div>

<div id="ratio-display">
  Ratio : 0%
</div>
```

**Calcul :**
```javascript
function calculerRatio() {
  const bureau = parseFloat(document.getElementById('surface_bureau')?.value || 0);
  const total = parseFloat(document.getElementById('surface_totale')?.value || 0);
  
  const ratio = total > 0 ? (bureau / total) * 100 : 0;
  
  document.getElementById('ratio-display').textContent = 
    `Ratio : ${ratio.toFixed(1)}%`;
}
```

### Charges déductibles au prorata

**Toggle Mensuel/Annuel :**
```html
<div class="period-toggle-container">
  <button data-section="residence" onclick="togglePeriodSection('residence', 'mensuel')">
    Mensuel
  </button>
  <button data-section="residence" onclick="togglePeriodSection('residence', 'annuel')">
    Annuel
  </button>
</div>
```

**Champs :**
- Intérêts emprunt résidence (mensuel/annuel)
- Assurance emprunteur résidence (mensuel/annuel)
- Électricité résidence (mensuel/annuel)
- Internet résidence (mensuel/annuel)
- Eau résidence (mensuel/annuel)
- Assurance habitation résidence (mensuel/annuel)
- Taxe foncière résidence (annuel uniquement)

**Calcul :**
```javascript
function calculerChargesResidence() {
  const charges = 
    getAnnualValue('interets_residence', 'interets_residence_type') +
    getAnnualValue('assurance_residence', 'assurance_residence_type') +
    getAnnualValue('electricite_residence', 'electricite_residence_type') +
    getAnnualValue('internet_residence', 'internet_residence_type') +
    getAnnualValue('eau_residence', 'eau_residence_type') +
    getAnnualValue('assurance_hab_residence', 'assurance_hab_residence_type') +
    parseFloat(document.getElementById('taxe_fonciere_residence')?.value || 0);
  
  // Appliquer le ratio professionnel
  const ratio = calculerRatio() / 100;
  return charges * ratio;
}
```

---

## 💼 SECTION 6 : FRAIS PROFESSIONNELS (100% déductibles)

### Toggle Mensuel/Annuel
```html
<div class="period-toggle-container">
  <button data-section="frais_pro" 
          onclick="togglePeriodSection('frais_pro', 'mensuel')">
    Mensuel
  </button>
  <button data-section="frais_pro" 
          onclick="togglePeriodSection('frais_pro', 'annuel')">
    Annuel
  </button>
</div>
```

### Champs

**Annuels uniquement :**
- Comptable
- Frais bancaires
- Matériel informatique
- RC Professionnelle
- Formation

**Avec sélecteur individuel :**
```html
<!-- Téléphone -->
<div class="input-with-select">
  <select id="telephone_type">
    <option value="mensuel">Mensuel</option>
    <option value="annuel">Annuel</option>
  </select>
  <input type="number" id="telephone" step="0.01">
</div>

<!-- Fournitures -->
<div class="input-with-select">
  <select id="fournitures_type">
    <option value="mensuel">Mensuel</option>
    <option value="annuel">Annuel</option>
  </select>
  <input type="number" id="fournitures" step="0.01">
</div>
```

**Calcul :**
```javascript
function calculerFraisProfessionnels() {
  return 
    parseFloat(document.getElementById('comptable')?.value || 0) +
    parseFloat(document.getElementById('frais_bancaires')?.value || 0) +
    getAnnualValue('telephone', 'telephone_type') +
    parseFloat(document.getElementById('materiel_info')?.value || 0) +
    parseFloat(document.getElementById('rc_pro')?.value || 0) +
    parseFloat(document.getElementById('formation')?.value || 0) +
    getAnnualValue('fournitures', 'fournitures_type');
}
```

---

## 🚗 SECTION 7 : FRAIS DE VÉHICULE & KILOMÈTRES PROFESSIONNELS

### Champs cachés (compatibilité)
```html
<input type="hidden" id="vehicule_type" value="thermique">
<input type="hidden" id="puissance_fiscale" value="5">
<input type="hidden" id="km_professionnels" value="0">
<input type="hidden" id="montant_frais_km" value="0">
```

### 7.1 Configuration du véhicule

**Card :**
```html
<div class="info-box-gradient blue">
  <h4>Mon véhicule</h4>
  <div id="vehicule-resume">
    <!-- Résumé dynamique -->
  </div>
  <button onclick="afficherModalConfigVehicule()">
    <i data-lucide="settings"></i> Configurer mon véhicule
  </button>
</div>
```

**Modal de configuration :**
```javascript
// Variables globales
window.configVehicule = {
  type: 'thermique', // 'thermique', 'electrique', 'hybride'
  puissance: 5,      // CV (3 à 7+)
  marque: '',
  modele: '',
  annee: null
};
```

**Types de véhicule :**
- **Thermique** : Barème kilométrique classique
- **Électrique** : Barème majoré (+20%)
- **Hybride** : Barème intermédiaire (+10%)

### 7.2 Configuration automatisation

**Card :**
```html
<div class="auto-card">
  <h4>Automatisation</h4>
  <p>Générer vos trajets automatiquement</p>
  <button onclick="afficherModalConfigKm()">
    Configurer l'automatisation
  </button>
</div>
```

**Modal de configuration :**
```javascript
window.configKm = {
  enabled: false,
  periodicite: 'mensuel', // 'mensuel', 'hebdomadaire'
  nombreTrajets: 4,        // Par mois/semaine
  distanceAR: 50,          // km aller-retour
  lieuDepart: '',
  lieuArrivee: '',
  dateDebut: null
};
```

**Génération automatique :**
```javascript
function genererTrajetsAutomatiques() {
  if (!configKm.enabled) return;
  
  const anneeSimulation = parseInt(document.getElementById('annee_simulation')?.value);
  
  for (let mois = 1; mois <= 12; mois++) {
    const nombreTrajets = configKm.nombreTrajets;
    
    for (let i = 0; i < nombreTrajets; i++) {
      const date = new Date(anneeSimulation, mois - 1, i * 7 + 1);
      
      trajetsKm.push({
        id: Date.now() + i,
        date: date.toISOString().split('T')[0],
        depart: configKm.lieuDepart,
        arrivee: configKm.lieuArrivee,
        distance: configKm.distanceAR,
        montant: calculerMontantKm(configKm.distanceAR),
        auto: true // Généré automatiquement
      });
    }
  }
  
  sauvegarderTrajets();
  afficherResumeTrajets();
}
```

### 7.3 Résumé annuel

```html
<div id="km-resume-annuel" class="info-box-gradient green">
  <div id="km-total-annuel">0 km</div>
  <div id="km-nombre-trajets">0</div>
  <div id="km-montant-total">0,00 €</div>
</div>
```

**Calcul :**
```javascript
function calculerResumeTrajets() {
  let totalKm = 0;
  let totalMontant = 0;
  let nombreTrajets = trajetsKm.length;
  
  trajetsKm.forEach(trajet => {
    totalKm += trajet.distance;
    totalMontant += trajet.montant;
  });
  
  return { totalKm, nombreTrajets, totalMontant };
}
```

### 7.4 Barème kilométrique

**Tableau officiel 2026 :**
```javascript
const BAREME_KM = {
  thermique: {
    3: { // 3 CV
      tranche1: { max: 5000, taux: 0.529 },
      tranche2: { max: 20000, taux: 0.316, fixe: 1065 },
      tranche3: { taux: 0.370 }
    },
    4: {
      tranche1: { max: 5000, taux: 0.606 },
      tranche2: { max: 20000, taux: 0.340, fixe: 1330 },
      tranche3: { taux: 0.407 }
    },
    5: {
      tranche1: { max: 5000, taux: 0.636 },
      tranche2: { max: 20000, taux: 0.357, fixe: 1395 },
      tranche3: { taux: 0.427 }
    },
    6: {
      tranche1: { max: 5000, taux: 0.665 },
      tranche2: { max: 20000, taux: 0.374, fixe: 1457 },
      tranche3: { taux: 0.447 }
    },
    7: {
      tranche1: { max: 5000, taux: 0.697 },
      tranche2: { max: 20000, taux: 0.394, fixe: 1515 },
      tranche3: { taux: 0.470 }
    }
  },
  electrique: { /* Valeurs majorées de 20% */ },
  hybride: { /* Valeurs majorées de 10% */ }
};
```

**Fonction de calcul :**
```javascript
function calculerBaremeKilometrique(puissance, km) {
  const type = window.configVehicule?.type || 'thermique';
  const bareme = BAREME_KM[type][puissance];
  
  if (!bareme) return 0;
  
  let montant = 0;
  
  if (km <= bareme.tranche1.max) {
    montant = km * bareme.tranche1.taux;
  } else if (km <= bareme.tranche2.max) {
    montant = (km * bareme.tranche2.taux) + bareme.tranche2.fixe;
  } else {
    montant = km * bareme.tranche3.taux;
  }
  
  return montant;
}
```

### 7.5 Gestion des lieux favoris

**Modal :**
```html
<button onclick="afficherModalLieuxFavoris()">
  <i data-lucide="map-pin"></i> Gérer mes lieux
</button>
```

**Structure :**
```javascript
window.lieuxFavoris = [
  {
    id: 1,
    nom: 'Domicile',
    adresse: '123 rue...',
    type: 'domicile', // 'domicile', 'gite', 'autre'
    favori: true
  },
  // ...
];
```

### 7.6 Ajout manuel de trajets

**Modal :**
```html
<button onclick="afficherModalAjoutTrajet()">
  <i data-lucide="plus"></i> Ajouter un trajet
</button>
```

**Formulaire :**
```html
<form id="form-ajout-trajet">
  <input type="date" id="trajet-date" required>
  <select id="trajet-depart">
    <option value="">Sélectionner...</option>
    <!-- Lieux favoris -->
  </select>
  <select id="trajet-arrivee">
    <option value="">Sélectionner...</option>
    <!-- Lieux favoris -->
  </select>
  <input type="number" id="trajet-distance" placeholder="Distance (km)">
  <textarea id="trajet-notes" placeholder="Notes (optionnel)"></textarea>
</form>
```

**Calcul automatique de distance :**
```javascript
// Utilise l'API Google Maps Distance Matrix
function calculerDistanceTrajet(lieuDepart, lieuArrivee) {
  // Si lieux favoris avec coordonnées
  if (lieuDepart.lat && lieuArrivee.lat) {
    // API call
    return distance;
  }
  
  // Sinon, saisie manuelle obligatoire
}
```

### 7.7 Export CSV

**Bouton :**
```html
<button onclick="exporterTrajetsCSV()">
  <i data-lucide="download"></i> Exporter en Excel
</button>
```

**Format CSV :**
```csv
Date,Départ,Arrivée,Distance (km),Montant (€),Notes
2026-01-15,Domicile,Gîte 1,45,28.62,Contrôle ménage
2026-01-20,Gîte 1,Domicile,45,28.62,
...
```

---

## 📊 SECTION 8 : RÉSULTATS FISCAUX

### Affichage principal

```html
<div class="fiscal-bloc" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
  <h3>
    RÉSULTATS FISCAUX 
    <span id="statut-fiscal-badge">LMNP</span>
  </h3>
  <div class="bloc-content">
```

### 8.1 Indicateurs clés

**3 grandes valeurs :**
```html
<div id="preview-benefice">0 €</div> <!-- Bénéfice imposable -->
<div id="preview-urssaf">0 €</div>    <!-- Cotisations URSSAF -->
<div id="preview-reste">0 €</div>     <!-- Reste avant IR -->
```

### 8.2 Détails URSSAF

**Composantes détaillées :**
```html
<div id="detail-indemnites">0 €</div>        <!-- 0.85% -->
<div id="detail-retraite-base">0 €</div>     <!-- 17.75% plafonné -->
<div id="detail-retraite-compl">0 €</div>    <!-- 7% -->
<div id="detail-invalidite">0 €</div>        <!-- 1.3% -->
<div id="detail-csg-crds">0 €</div>          <!-- 9.7% -->
<div id="detail-formation-pro">0 €</div>     <!-- 0.25% du CA -->
<div id="detail-allocations">0 €</div>       <!-- 0% à 3.1% progressif -->
<div id="detail-total-urssaf">0 €</div>
<div id="detail-trimestres">0</div>          <!-- Trimestres validés -->
```

### 8.3 Calcul URSSAF détaillé

**Configuration annuelle :**
```javascript
window.TAUX_FISCAUX = {
  2026: {
    PASS: 47100, // Plafond Annuel Sécurité Sociale
    
    URSSAF: {
      indemnites_journalieres: { taux: 0.0085 }, // 0.85%
      
      retraite_base: { 
        taux: 0.1775,           // 17.75%
        plafond: 47100          // 1 PASS
      },
      
      retraite_complementaire: { taux: 0.07 },   // 7%
      
      invalidite_deces: { taux: 0.013 },         // 1.3%
      
      csg_crds: { taux: 0.097 },                 // 9.7%
      
      formation_pro: { taux: 0.0025 },           // 0.25% du CA
      
      allocations_familiales: {
        seuil_debut: 51810,    // 110% PASS
        seuil_fin: 65940,      // 140% PASS
        taux_max: 0.031        // 3.1% max
      }
    },
    
    RETRAITE: {
      trimestre_1: 7046,  // 600 × SMIC horaire
      trimestre_2: 14092,
      trimestre_3: 21138,
      trimestre_4: 28184
    }
  }
};
```

**Fonction de calcul :**
```javascript
function calculerURSSAF(benefice, ca) {
  const annee = new Date().getFullYear();
  const config = window.TAUX_FISCAUX.getConfig(annee);
  const urssafConfig = config.URSSAF;
  
  let indemnites = 0;
  let retraiteBase = 0;
  let retraiteCompl = 0;
  let invalidite = 0;
  let csgCrds = 0;
  let formationPro = 0;
  let allocations = 0;
  
  if (benefice > 0) {
    // Indemnités journalières: 0.85%
    indemnites = benefice * urssafConfig.indemnites_journalieres.taux;
    
    // Retraite de base: 17.75% (plafonné à 1 PASS)
    const revenuPlafonne = Math.min(benefice, urssafConfig.retraite_base.plafond);
    retraiteBase = revenuPlafonne * urssafConfig.retraite_base.taux;
    
    // Retraite complémentaire: 7%
    retraiteCompl = benefice * urssafConfig.retraite_complementaire.taux;
    
    // Invalidité-Décès: 1.3%
    invalidite = benefice * urssafConfig.invalidite_deces.taux;
    
    // CSG-CRDS: 9.7%
    csgCrds = benefice * urssafConfig.csg_crds.taux;
    
    // Formation professionnelle: 0.25% du CA
    formationPro = ca * urssafConfig.formation_pro.taux;
    
    // Allocations familiales (progressif 110%-140% PASS)
    const af = urssafConfig.allocations_familiales;
    if (benefice > af.seuil_debut) {
      const baseAF = Math.min(
        benefice - af.seuil_debut, 
        af.seuil_fin - af.seuil_debut
      );
      const tauxAF = (baseAF / (af.seuil_fin - af.seuil_debut)) * af.taux_max;
      allocations = benefice * tauxAF;
    }
  }
  
  // TOTAL URSSAF
  let urssaf = indemnites + retraiteBase + retraiteCompl + 
               invalidite + csgCrds + formationPro + allocations;
  
  // ⚠️ RÈGLES SPÉCIFIQUES selon statut
  const statutFiscal = document.getElementById('statut_fiscal')?.value || 'lmnp';
  const COTISATIONS_MINIMALES_LMP = 1200;
  const SEUIL_EXONERATION_LMNP = 23000;
  
  if (statutFiscal === 'lmnp' && ca < SEUIL_EXONERATION_LMNP) {
    // ✅ LMNP : Exonération totale si CA < 23 000€
    urssaf = 0;
  } else if (statutFiscal === 'lmp' && urssaf < COTISATIONS_MINIMALES_LMP) {
    // ⚠️ LMP : Cotisations minimales garanties
    urssaf = COTISATIONS_MINIMALES_LMP;
  }
  
  return {
    total: urssaf,
    detail: {
      indemnites,
      retraiteBase,
      retraiteCompl,
      invalidite,
      csgCrds,
      formationPro,
      allocations
    }
  };
}
```

### 8.4 Validation des trimestres de retraite

**Seuils 2026 :**
```javascript
const RETRAITE = {
  trimestre_1: 7046,  // 600 × SMIC horaire (12,41€)
  trimestre_2: 14092, // 1 200 × SMIC
  trimestre_3: 21138, // 1 800 × SMIC
  trimestre_4: 28184  // 2 400 × SMIC
};
```

**Calcul :**
```javascript
let trimestres = 0;
if (benefice >= RETRAITE.trimestre_4) trimestres = 4;
else if (benefice >= RETRAITE.trimestre_3) trimestres = 3;
else if (benefice >= RETRAITE.trimestre_2) trimestres = 2;
else if (benefice >= RETRAITE.trimestre_1) trimestres = 1;

document.getElementById('detail-trimestres').textContent = trimestres;
```

**Alerte :**
```html
<div id="alerte-retraite" style="display: none;">
  ⚠️ ATTENTION : Bénéfice en dessous de 7 046 € 
  - Trimestres de retraite non validés !
</div>
```
Affichée si `trimestres === 0`

### 8.5 Note explicative selon statut

```html
<div id="note-statut-fiscal">
  <strong>
    <span id="statut-fiscal-note-label">Régime LMNP au réel</span> :
  </strong>
  <span id="statut-fiscal-note-text">
    Les cotisations sont calculées uniquement sur le bénéfice imposable. 
    Pas de cotisations minimales en LMNP.
  </span>
  Les taux sont mis à jour automatiquement selon l'année en cours.
</div>
```

**Messages selon statut :**
- **LMNP** : "Cotisations calculées uniquement sur le bénéfice. Pas de minimales."
- **LMP** : "Cotisations SSI obligatoires. Minimum garanti : 1 200€/an."
- **Micro-BIC** : "Cotisations calculées sur le CA avec abattement forfaitaire."

---

## 📈 SECTION 9 : COMPARAISON RÉEL vs MICRO-BIC

**Affichage :** Uniquement en statut LMNP et si CA ≤ plafond Micro-BIC

```html
<div id="comparaison-reel-micro" style="display: none;">
```

### Structure

**3 colonnes :**
1. **Labels** (vide)
2. **RÉEL** (bleu)
3. **MICRO-BIC** (vert)

### Calculs

#### Pour le RÉEL
```javascript
const urssafReel = /* calculé section 8 */;
const beneficeReel = /* calculé section 8 */;
const resteAvantIR = /* calculé section 8 */;

// Calculer l'IR avec revenus globaux
const revenusSalaries = salaireMadame + salaireMonsieur;
const revenusGlobaux = revenusSalaries + resteAvantIR;
const partLocation = resteAvantIR / revenusGlobaux;

const irTotal = calculerIR(revenusGlobaux, nombreParts);
const irPartLocation = irTotal * partLocation;

const coutTotalReel = urssafReel + irPartLocation;
```

#### Pour le MICRO-BIC
```javascript
 const classement = document.getElementById('classement_meuble')?.value;
const TAUX_ABATTEMENT = classement === 'classe' ? 0.50 : 0.30;
const TAUX_COTIS = classement === 'classe' ? 0.06 : 0.212;

// Bénéfice imposable
const abattement = Math.max(ca * TAUX_ABATTEMENT, 305);
const beneficeMicro = ca - abattement;

// Cotisations (0 si CA < 23 000€)
const cotisMicro = ca >= 23000 ? ca * TAUX_COTIS : 0;

// Reste avant IR
const resteAvantIRMicro = beneficeMicro - cotisMicro;

// IR
const revenusGlobauxMicro = revenusSalaries + resteAvantIRMicro;
const partLocationMicro = resteAvantIRMicro / revenusGlobauxMicro;
const irTotalMicro = calculerIR(revenusGlobauxMicro, nombreParts);
const irPartMicro = irTotalMicro * partLocationMicro;

const coutTotalMicro = cotisMicro + irPartMicro;
```

### Affichage résultat

```html
<div id="comp-reel-total">0 €</div>
<div id="comp-reel-urssaf">0 €</div>
<div id="comp-reel-ir">0 €</div>

<div id="comp-micro-total">0 €</div>
<div id="comp-micro-cotis">0 €</div>
<div id="comp-micro-ir">0 €</div>

<div id="comp-recommandation">
  <!-- Meilleure option -->
</div>
```

**Recommandation :**
```javascript
if (coutTotalReel < coutTotalMicro) {
  recommandation = `✅ Le RÉGIME RÉEL est plus avantageux 
                    (économie de ${(coutTotalMicro - coutTotalReel).toFixed(0)}€)`;
} else {
  recommandation = `✅ Le MICRO-BIC est plus avantageux 
                    (économie de ${(coutTotalReel - coutTotalMicro).toFixed(0)}€)`;
}
```

---

## 👤 SECTION 10 : SECTION PERSONNELLE (Optionnelle)

**Activation :**
```javascript
// Checkbox dans les options
<input type="checkbox" id="option-section-personnelle" 
       onchange="toggleSectionPersonnelle()">
```

**Contenu :**
```html
<div id="section-personnelle" style="display: none;">
```

### 10.1 Calcul Impôt sur le Revenu (IR)

#### Revenus salariaux

**Madame :**
```html
<div class="form-group">
  <label>Salaire annuel Madame (€)</label>
  <input type="number" id="salaire_madame" 
         oninput="calculerIR(); verifierSeuilsStatut();">
  <button onclick="openFraisReelsSalarieModal('madame')">
    <i data-lucide="settings"></i> Frais
  </button>
  <div id="frais-madame-info" class="frais-info-box">
    <strong>Déduction :</strong> 
    <span id="frais-madame-montant">0 €</span>
  </div>
</div>
```

**Monsieur :**
```html
<div class="form-group">
  <label>Salaire annuel Monsieur (€)</label>
  <input type="number" id="salaire_monsieur" 
         oninput="calculerIR(); verifierSeuilsStatut();">
  <button onclick="openFraisReelsSalarieModal('monsieur')">
    <i data-lucide="settings"></i> Frais
  </button>
  <div id="frais-monsieur-info" class="frais-info-box">
    <strong>Déduction :</strong> 
    <span id="frais-monsieur-montant">0 €</span>
  </div>
</div>
```

#### Modal Frais Réels Salariés

**Variables globales :**
```javascript
window.fraisMadameData = { 
  option: 'forfaitaire', // 'forfaitaire' ou 'reel'
  km: 0, 
  cv: 5, 
  peages: 0, 
  montant: 0 
};

window.fraisMonsieurData = { 
  option: 'forfaitaire', 
  km: 0, 
  cv: 5, 
  peages: 0, 
  montant: 0 
};
```

**Modal :**
```html
<div id="modal-frais-salarie">
  <h3>Frais professionnels - <span id="titre-personne-modal"></span></h3>
  
  <input type="radio" name="option_frais_salarie" value="forfaitaire" checked
         onchange="toggleOptionFraisSalarie('forfaitaire')">
  <label>Abattement forfaitaire 10%</label>
  
  <input type="radio" name="option_frais_salarie" value="reel"
         onchange="toggleOptionFraisSalarie('reel')">
  <label>Frais réels</label>
  
  <div id="fields-frais-reel-modal" style="display: none;">
    <label>Kilomètres domicile-travail (annuel)</label>
    <input type="number" id="km_salarie_modal">
    
    <label>Puissance fiscale (CV)</label>
    <select id="cv_salarie_modal">
      <option value="3">3 CV</option>
      <option value="4">4 CV</option>
      <option value="5" selected>5 CV</option>
      <option value="6">6 CV</option>
      <option value="7">7 CV et +</option>
    </select>
    
    <label>Péages (€)</label>
    <input type="number" id="peages_salarie_modal">
  </div>
  
  <div id="total-frais-salarie-modal">
    Abattement de 10% appliqué automatiquement
  </div>
  
  <button onclick="validerFraisSalarie()">Valider</button>
  <button onclick="closeFraisReelsSalarieModal()">Annuler</button>
</div>
```

**Calcul :**
```javascript
function calculerFraisSalarieModal() {
  const option = document.querySelector('input[name="option_frais_salarie"]:checked').value;
  
  if (option === 'forfaitaire') {
    return 'Abattement de 10% appliqué automatiquement';
  }
  
  // Frais réels
  const km = parseFloat(document.getElementById('km_salarie_modal').value || 0);
  const cv = parseInt(document.getElementById('cv_salarie_modal').value || 5);
  const peages = parseFloat(document.getElementById('peages_salarie_modal').value || 0);
  
  // Barème kilométrique salarié 2026
  const bareme = {
    3: 0.529,
    4: 0.606,
    5: 0.636,
    6: 0.665,
    7: 0.697
  };
  
  const tauxKm = bareme[cv] || 0.529;
  const fraisKm = km * tauxKm;
  const total = fraisKm + peages;
  
  return `Total déductible : ${total.toFixed(2)} €`;
}
```

#### Revenu LMP (auto-calculé)

```html
<div class="form-group">
  <label>Revenu LMP (calculé automatiquement)</label>
  <input type="number" id="revenu_lmp" readonly 
         class="input-readonly-green">
</div>
```
**Valeur :** `benefice - urssaf` (reste avant IR)

#### Nombre d'enfants

```html
<select id="nombre_enfants" onchange="calculerIR()">
  <option value="0">0</option>
  <option value="1">1</option>
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
  <option value="5">5+</option>
</select>
```

#### Calcul de l'IR

**Configuration :**
```javascript
window.TAUX_FISCAUX = {
  2026: {
    ABATTEMENT_SALARIE: {
      taux: 0.10,      // 10%
      minimum: 472,    // Min 472€
      maximum: 13509   // Max 13 509€
    },
    
    BAREME_IR: [
      { max: 11294, taux: 0 },       // 0%
      { max: 28797, taux: 0.11 },    // 11%
      { max: 82341, taux: 0.30 },    // 30%
      { max: 177106, taux: 0.41 },   // 41%
      { max: Infinity, taux: 0.45 }  // 45%
    ]
  }
};
```

**Fonction :**
```javascript
function calculerIR() {
  // 1. Récupérer les revenus
  const salaireMadameBrut = parseFloat(document.getElementById('salaire_madame')?.value || 0);
  const salaireMonsieurBrut = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
  const revenuLMP = parseFloat(document.getElementById('revenu_lmp')?.value || 0);
  const nbEnfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
  
  // 2. Abattements salaires (10% ou frais réels)
  const fraisMadame = window.fraisMadameData || { option: 'forfaitaire', montant: 0 };
  const fraisMonsieur = window.fraisMonsieurData || { option: 'forfaitaire', montant: 0 };
  
  const config = window.TAUX_FISCAUX.getConfig(2026);
  const abat = config.ABATTEMENT_SALARIE;
  
  let abattementMadame = 0;
  if (fraisMadame.option === 'reel') {
    abattementMadame = fraisMadame.montant;
  } else {
    abattementMadame = salaireMadameBrut * abat.taux;
    abattementMadame = Math.max(abat.minimum, Math.min(abattementMadame, abat.maximum));
  }
  
  let abattementMonsieur = 0;
  if (fraisMonsieur.option === 'reel') {
    abattementMonsieur = fraisMonsieur.montant;
  } else {
    abattementMonsieur = salaireMonsieurBrut * abat.taux;
    abattementMonsieur = Math.max(abat.minimum, Math.min(abattementMonsieur, abat.maximum));
  }
  
  const salaireMadame = salaireMadameBrut - abattementMadame;
  const salaireMonsieur = salaireMonsieurBrut - abattementMonsieur;
  
  // 3. Revenu imposable total
  const revenuTotal = salaireMadame + salaireMonsieur + revenuLMP;
  
  if (revenuTotal === 0) {
    document.getElementById('resultat-ir').style.display = 'none';
    return;
  }
  
  // 4. Nombre de parts fiscales
  let parts = 2; // Couple
  if (nbEnfants === 1) parts += 0.5;
  else if (nbEnfants === 2) parts += 1;
  else if (nbEnfants >= 3) parts += 1 + (nbEnfants - 2);
  
  // 5. Quotient familial
  const quotient = revenuTotal / parts;
  
  // 6. Barème progressif
  const bareme = config.BAREME_IR;
  let impotQuotient = 0;
  let tranchePrecedente = 0;
  
  for (const tranche of bareme) {
    if (quotient <= tranchePrecedente) break;
    
    const baseImposable = Math.min(quotient, tranche.max) - tranchePrecedente;
    impotQuotient += baseImposable * tranche.taux;
    
    tranchePrecedente = tranche.max;
    if (quotient <= tranche.max) break;
  }
  
  // 7. Impôt total
  const impotTotal = impotQuotient * parts;
  const resteFinalTotal = revenuTotal - impotTotal;
  
  // 8. Affichage
  document.getElementById('resultat-ir').style.display = 'block';
  document.getElementById('ir-revenu-total').textContent = revenuTotal.toFixed(2) + ' €';
  document.getElementById('ir-parts').textContent = parts.toFixed(1);
  document.getElementById('ir-quotient').textContent = quotient.toFixed(2) + ' €';
  document.getElementById('ir-montant').textContent = impotTotal.toFixed(2) + ' €';
  document.getElementById('ir-reste-final').textContent = resteFinalTotal.toFixed(2) + ' €';
  
  // 9. Déclencher calcul reste à vivre
  setTimeout(() => calculerResteAVivre(), 100);
}
```

#### Résultat IR

```html
<div id="resultat-ir" style="display: none;">
  <div>Revenu imposable total : <strong id="ir-revenu-total">0 €</strong></div>
  <div>Nombre de parts fiscales : <strong id="ir-parts">0</strong></div>
  <div>Quotient familial : <strong id="ir-quotient">0 €</strong></div>
  <div>IMPÔT SUR LE REVENU : <strong id="ir-montant">0 €</strong></div>
  <div>RESTE APRÈS IR : <strong id="ir-reste-final">0 €</strong></div>
</div>
```

### 10.2 Crédits personnels

#### Bouton d'ajout
```html
<button onclick="ajouterLigneCredit()">
  ➕ Ajouter un crédit
</button>
```

#### Structure d'une ligne
```html
<div class="liste-item" id="credit-{id}">
  <input type="text" id="credit-nom-{id}" placeholder="Nom du crédit">
  <input type="number" id="credit-montant-{id}" placeholder="Mensualité">
  <input type="number" id="credit-duree-{id}" placeholder="Durée (mois)">
  <input type="number" id="credit-capital-{id}" placeholder="Capital restant dû">
  <button onclick="supprimerCredit({id})">🗑️</button>
</div>
```

#### Calcul total
```javascript
function calculerTotalCredits() {
  let total = 0;
  
  creditsPersonnels.forEach(credit => {
    total += credit.montant;
  });
  
  document.getElementById('total-credits-display').textContent = 
    total.toFixed(2) + ' €';
  
  return total;
}
```

### 10.3 Total Charges Annuelles

**Récapitulatif de toutes les charges :**
```html
<div id="total-charges-container">
  <!-- Généré dynamiquement -->
</div>
```

**Affichage :**
```javascript
function afficherDetailCharges(chargesBiens, amortissements, ...) {
  // 1. Charges par gîte
  gites.forEach(gite => {
    const chargesGite = calculerChargesBien(gite.slug);
    // Affichage
  });
  
  // 2. Amortissements
  // - Immobiliers (champs annuels)
  // - Travaux/mobilier (listes dynamiques)
  
  // 3. Frais professionnels
  
  // 4. Frais véhicule
  
  // 5. Charges résidence (prorata)
  
  // 6. Total général
}
```

### 10.4 Reste à vivre

#### Frais personnels mensuels

```html
<div class="info-box blue-border">
  <h4>Frais personnels mensuels (maison)</h4>
  <input type="number" id="frais_perso_internet" placeholder="Internet">
  <input type="number" id="frais_perso_electricite" placeholder="Électricité">
  <input type="number" id="frais_perso_eau" placeholder="Eau">
  <input type="number" id="frais_perso_assurance" placeholder="Assurance">
  <input type="number" id="frais_perso_taxe" placeholder="Taxe foncière (€/an)">
  <input type="number" id="frais_perso_autres" placeholder="Autres">
</div>
```

#### Calcul du reste à vivre

**REVENUS MENSUELS :**
```javascript
// Salaires (nets)
const salaireMadameMensuel = salaireMadameAnnuel / 12;
const salaireMonsieurMensuel = salaireMonsieurAnnuel / 12;

// Revenus LMP (après IR, mensualisés)
const revenusLMPMensuels = (benefice - urssaf - irPartLocation) / 12;

// Économie frais kilométriques
const economieKmMensuelle = montantFraisKm / 12;

// Amortissements réintégrés (non décaissés)
const amortissementsMensuels = totalAmortissements / 12;

const totalRevenusMensuels = 
  salaireMadameMensuel +
  salaireMonsieurMensuel +
  revenusLMPMensuels +
  economieKmMensuelle +
  amortissementsMensuels;
```

**DÉPENSES MENSUELLES :**
```javascript
// Crédits personnels
const totalCreditsMensuels = calculerTotalCredits();

// Frais personnels
const fraisPersoMensuels = 
  parseFloat(document.getElementById('frais_perso_internet')?.value || 0) +
  parseFloat(document.getElementById('frais_perso_electricite')?.value || 0) +
  parseFloat(document.getElementById('frais_perso_eau')?.value || 0) +
  parseFloat(document.getElementById('frais_perso_assurance')?.value || 0) +
  (parseFloat(document.getElementById('frais_perso_taxe')?.value || 0) / 12) +
  parseFloat(document.getElementById('frais_perso_autres')?.value || 0);

const totalDepensesMensuelles = totalCreditsMensuels + fraisPersoMensuels;
```

**RESTE À VIVRE :**
```javascript
const resteAVivre = totalRevenusMensuels - totalDepensesMensuelles;

document.getElementById('rav-final').textContent = 
  resteAVivre.toFixed(2) + ' €';
```

#### Affichage détaillé

```html
<!-- REVENUS -->
<div id="rav-salaire-madame">0 €</div>
<div id="rav-salaire-monsieur">0 €</div>
<div id="rav-lmp">0 €</div>
<div id="rav-kms">0 €</div>
<div id="rav-amortissements">0 €</div>
<div id="rav-total-revenus">0 €</div>

<!-- DÉPENSES -->
<div id="rav-credits">0 €</div>
<div id="rav-frais-perso">0 €</div>
<div id="rav-total-depenses">0 €</div>

<!-- RÉSULTAT -->
<div id="rav-final">0 €</div>
<div id="rav-capital-total">Capital restant dû total : 0 €</div>
```

### 10.5 Suivi Trésorerie Mensuelle

**Bouton :**
```html
<button onclick="afficherModalAjoutSolde()">
  <i data-lucide="plus"></i> Ajouter un solde
</button>
```

**Modal :**
```html
<div id="modal-ajout-solde">
  <h3>Ajouter un solde bancaire</h3>
  <input type="date" id="solde-date" required>
  <input type="number" id="solde-montant" placeholder="Montant (€)" required>
  <textarea id="solde-notes" placeholder="Notes (optionnel)"></textarea>
  <button onclick="validerSolde()">Valider</button>
  <button onclick="closeModalSolde()">Annuler</button>
</div>
```

**Structure de données :**
```javascript
window.soldesBancaires = [
  {
    id: 1,
    date: '2026-01-31',
    montant: 15000,
    notes: 'Fin janvier'
  },
  // ...
];
```

**Sauvegarde :**
```javascript
// Table Supabase: fiscalite_soldes
// Colonnes: user_id, annee, date, montant, notes
```

---

## 💾 SYSTÈME DE SAUVEGARDE

### Déclencheurs

**Events :**
- `input` sur tous les champs `<input type="number">`
- `change` sur tous les `<select>`
- `blur` sur tous les champs numériques

**Debounce :**
```javascript
let calculTempsReelTimeout = null;

function calculerTempsReel() {
  if (calculTempsReelTimeout) {
    clearTimeout(calculTempsReelTimeout);
  }
  
  calculTempsReelTimeout = setTimeout(() => {
    // Calculs...
    // Puis sauvegarde
    sauvegarderDonneesFiscales(true);
  }, 500); // 500ms
}
```

### Fonction de sauvegarde

```javascript
async function sauvegarderDonneesFiscales(silent = false) {
  const annee = parseInt(document.getElementById('annee_simulation')?.value);
  const userId = await getUserId();
  
  // Construire l'objet de données
  const data = {
    user_id: userId,
    annee: annee,
    ca: parseFloat(document.getElementById('ca')?.value || 0),
    statut_fiscal: document.getElementById('statut_fiscal')?.value,
    classement_meuble: document.getElementById('classement_meuble')?.value,
    
    // Charges par gîte
    charges_gites: {},
    
    // Frais d'exploitations
    travaux: getTravauxListe(),
    frais_divers: getFraisDiversListe(),
    produits_accueil: getProduitsAccueilListe(),
    
    // Résidence
    surface_bureau: parseFloat(document.getElementById('surface_bureau')?.value || 0),
    surface_totale: parseFloat(document.getElementById('surface_totale')?.value || 0),
    charges_residence: {},
    
    // Frais professionnels
    frais_pro: {},
    
    // Véhicule
    config_vehicule: window.configVehicule,
    config_km: window.configKm,
    trajets_km: trajetsKm,
    lieux_favoris: lieuxFavoris,
    
    // Section personnelle (si activée)
    salaire_madame: parseFloat(document.getElementById('salaire_madame')?.value || 0),
    salaire_monsieur: parseFloat(document.getElementById('salaire_monsieur')?.value || 0),
    frais_madame: window.fraisMadameData,
    frais_monsieur: window.fraisMonsieurData,
    nombre_enfants: parseInt(document.getElementById('nombre_enfants')?.value || 0),
    credits_personnels: creditsPersonnels,
    frais_perso: {},
    
    // Métadonnées
    date_modification: new Date().toISOString()
  };
  
  // Remplir charges_gites
  const gites = window.GITES_DATA || [];
  gites.forEach(gite => {
    const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    data.charges_gites[slug] = {
      internet: parseFloat(document.getElementById(`internet_${slug}`)?.value || 0),
      internet_type: document.getElementById(`internet_${slug}_type`)?.value || 'mensuel',
      // ... tous les autres champs
    };
  });
  
  // Upsert dans Supabase
  const { error } = await supabase
    .from('fiscalite_simulations')
    .upsert({
      user_id: userId,
      annee: annee,
      data: data
    }, {
      onConflict: 'user_id,annee'
    });
  
  if (error) {
    if (!silent) {
      afficherMessage('Erreur de sauvegarde', 'error');
    }
  } else {
    if (!silent) {
      afficherMessage('✅ Données sauvegardées', 'success');
    }
  }
}
```

### Chargement des données

```javascript
async function chargerAnnee(annee) {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('fiscalite_simulations')
    .select('*')
    .eq('user_id', userId)
    .eq('annee', annee)
    .single();
  
  if (error || !data) {
    // Initialiser année vierge
    return;
  }
  
  // Restaurer tous les champs
  const fiscalData = data.data;
  
  // CA
  document.getElementById('ca').value = fiscalData.ca || 0;
  
  // Statut
  document.getElementById('statut_fiscal').value = fiscalData.statut_fiscal || 'lmnp';
  
  // Classement
  document.getElementById('classement_meuble').value = fiscalData.classement_meuble || 'non_classe';
  
  // Charges par gîte
  Object.keys(fiscalData.charges_gites || {}).forEach(slug => {
    const charges = fiscalData.charges_gites[slug];
    Object.keys(charges).forEach(key => {
      const el = document.getElementById(`${key}_${slug}`);
      if (el) el.value = charges[key];
    });
  });
  
  // Travaux, frais, produits
  restaurerListeDynamique('travaux', fiscalData.travaux || []);
  restaurerListeDynamique('frais_divers', fiscalData.frais_divers || []);
  restaurerListeDynamique('produits_accueil', fiscalData.produits_accueil || []);
  
  // Véhicule
  window.configVehicule = fiscalData.config_vehicule || {};
  window.configKm = fiscalData.config_km || {};
  trajetsKm = fiscalData.trajets_km || [];
  lieuxFavoris = fiscalData.lieux_favoris || [];
  
  // Section personnelle
  if (fiscalData.salaire_madame) {
    document.getElementById('salaire_madame').value = fiscalData.salaire_madame;
  }
  // ... etc
  
  // Recalculer tout
  calculerTempsReel();
}
```

---

## 🎨 STYLES & MODES D'AFFICHAGE

### Modes disponibles

**1. Mode Sidebar (Neo-Brutalism)**
```css
html.style-sidebar .fiscal-bloc {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-left: 5px solid #00C2CB;
  border-radius: 8px;
}
```

**2. Mode Apple (Doux et épuré)**
```css
html.style-apple .fiscal-bloc {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
```

### Classes utilitaires

**Cards :**
```css
.card {
  background: var(--card);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid var(--border-color);
}
```

**Info boxes :**
```css
.info-box {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 12px;
  border-radius: 4px;
}

.info-box.green {
  background: #e8f5e9;
  border-left-color: #4caf50;
}
```

**Badges :**
```css
.badge-option {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #2ecc71;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}
```

---

## 🔧 FONCTIONS UTILITAIRES CLÉS

### Fonctions de lecture

```javascript
// Lire les travaux
function getTravauxListe() {
  const items = [];
  document.querySelectorAll('#travaux-liste .liste-item').forEach(item => {
    const id = item.id.replace('travaux-', '');
    items.push({
      description: document.getElementById(`travaux-desc-${id}`)?.value || '',
      type_amortissement: document.getElementById(`travaux-type-${id}`)?.value || '',
      gite_slug: document.getElementById(`travaux-gite-${id}`)?.value || '',
      montant: parseFloat(document.getElementById(`travaux-montant-${id}`)?.value || 0)
    });
  });
  return items;
}

// Idem pour getFraisDiversListe() et getProduitsAccueilListe()
```

### Conversion annuelle

```javascript
function getAnnualValue(fieldId, typeFieldId) {
  const value = parseFloat(document.getElementById(fieldId)?.value || 0);
  
  // Si pas de type, considérer comme annuel
  if (!typeFieldId) return value;
  
  const type = document.getElementById(typeFieldId)?.value || 'annuel';
  return type === 'mensuel' ? value * 12 : value;
}
```

### Toggle périodicité

```javascript
function togglePeriodSection(section, period) {
  // Activer le bouton sélectionné
  document.querySelectorAll(`[data-section="${section}"]`).forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-section="${section}"][data-period="${period}"]`)
    .classList.add('active');
  
  // Mettre à jour tous les champs de la section
  document.querySelectorAll(`[data-period-type]`).forEach(input => {
    if (input.closest(`[data-section="${section}"]`)) {
      input.dataset.periodType = period;
      
      // Mettre à jour le label
      const label = document.querySelector(`[data-target="${input.id}"]`);
      if (label) {
        label.textContent = period;
      }
    }
  });
  
  // Recalculer
  calculerTempsReel();
}
```

### Vérification statut automatique

```javascript
function ajusterStatutFiscalAutomatique(ca, benefice, urssaf) {
  const statutActuel = document.getElementById('statut_fiscal')?.value;
  const statutBadgeTitle = document.getElementById('statut-fiscal-title');
  const statutBadge = document.getElementById('statut-fiscal-badge');
  
  // Calculer les critères LMP
  const salaireMadame = parseFloat(document.getElementById('salaire_madame')?.value || 0);
  const salaireMonsieur = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
  const resteAvantIR = benefice - urssaf;
  const revenusGlobaux = salaireMadame + salaireMonsieur + resteAvantIR;
  const partRecettes = revenusGlobaux > 0 ? (resteAvantIR / revenusGlobaux) * 100 : 0;
  
  const critereCA_LMP = ca > 23000;
  const criterePart_LMP = partRecettes > 50;
  
  // Si les 2 critères LMP sont remplis ET statut != LMP, proposer le changement
  if (critereCA_LMP && criterePart_LMP && statutActuel !== 'lmp') {
    // Alerte automatique (sans forcer)
    const alerteStatut = document.getElementById('alerte-seuil-statut');
    const alerteMessage = document.getElementById('alerte-seuil-message');
    
    alerteStatut.style.display = 'block';
    alerteMessage.innerHTML = `
      Vous remplissez les critères du statut <strong>LMP</strong> 
      (CA > 23 000€ ET recettes > 50% revenus globaux). 
      Changez votre statut fiscal pour bénéficier des avantages LMP.
    `;
  }
  
  // Mise à jour des badges affichés
  if (statutBadgeTitle) statutBadgeTitle.textContent = statutActuel.toUpperCase();
  if (statutBadge) statutBadge.textContent = statutActuel.toUpperCase();
}
```

---

## 📊 TABLES SUPABASE

### fiscalite_simulations
```sql
CREATE TABLE fiscalite_simulations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  data JSONB NOT NULL,
  date_creation TIMESTAMP DEFAULT NOW(),
  date_modification TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, annee)
);
```

### fiscalite_trajets_km
```sql
CREATE TABLE fiscalite_trajets_km (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  date DATE NOT NULL,
  depart TEXT,
  arrivee TEXT,
  distance DECIMAL(10,2),
  montant DECIMAL(10,2),
  notes TEXT,
  auto_genere BOOLEAN DEFAULT false,
  date_creation TIMESTAMP DEFAULT NOW()
);
```

### fiscalite_lieux_favoris
```sql
CREATE TABLE fiscalite_lieux_favoris (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  adresse TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  type TEXT, -- 'domicile', 'gite', 'autre'
  favori BOOLEAN DEFAULT false,
  date_creation TIMESTAMP DEFAULT NOW()
);
```

### fiscalite_soldes
```sql
CREATE TABLE fiscalite_soldes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  date DATE NOT NULL,
  montant DECIMAL(12,2),
  notes TEXT,
  date_creation TIMESTAMP DEFAULT NOW()
);
```

---

## ⚠️ POINTS D'ATTENTION & BUGS CONNUS

### 1. Boucles infinies calculTempsReel
**Problème :** Le flag `isCalculatingTempsReel` évite les boucles infinies lors du calcul en chaîne.

**Solution actuelle :**
```javascript
let isCalculatingTempsReel = false;

function calculerTempsReel() {
  if (isCalculatingTempsReel) return;
  
  isCalculatingTempsReel = true;
  
  // ... calculs
  
  setTimeout(() => {
    isCalculatingTempsReel = false;
  }, 100);
}
```

### 2. Sauvegarde en double
**Problème :** Certains events déclenchent plusieurs sauvegardes.

**Solution :** Variable `lastSavedData` + comparaison JSON avant sauvegarde :
```javascript
let lastSavedData = null;

function sauvegarderDonneesFiscales(silent = false) {
  const currentData = JSON.stringify(construireObjetDonnees());
  
  if (currentData === lastSavedData) {
    return; // Pas de changement, pas de sauvegarde
  }
  
  lastSavedData = currentData;
  // ... sauvegarde Supabase
}
```

### 3. Amortissements non pris en compte
**Problème :** Les amortissements doivent être calculés uniquement pour l'année courante.

**Solution :** Fonction `calculerAmortissementsAnneeCourante()` qui filtre par année de simulation.

### 4. Toggle Mensuel/Annuel - État non sauvegardé
**Problème :** L'état du toggle (mensuel/annuel) n'était pas sauvegardé.

**Solution :** Sauvegarder le type dans chaque champ `{champ}_type` :
```javascript
// Sauvegarde
charges_gites[slug] = {
  internet: value,
  internet_type: 'mensuel' // ou 'annuel'
};

// Restauration
document.getElementById(`internet_${slug}_type`).value = 'mensuel';
togglePeriodSection(slug, 'mensuel');
```

### 5. CA calculé vs CA manuel
**Problème :** Conflit entre CA calculé automatiquement et CA saisi manuellement pour les tests.

**Solution :** Badge "MODE TEST" affiché si CA ≠ CA calculé.

---

## 🎯 LOGIQUES MÉTIER IMPORTANTES

### 1. Seuils LMNP/LMP

**Règles 2026 :**
- **CA < 23 000€** : Exonération URSSAF totale (LMNP)
- **CA ≥ 23 000€ ET recettes ≤ 50% revenus** : URSSAF obligatoire mais LMNP OK
- **CA > 23 000€ ET recettes > 50% revenus** : **LMP obligatoire**

### 2. Micro-BIC : Nouveaux plafonds 2025/2026

**LOI en vigueur :**
- **Non classé** : Plafond 15 000€ | Abattement 30%
- **Classé ⭐** : Plafond 77 700€ | Abattement 50%

**Exonération URSSAF :**
- Toujours 0€ si CA < 23 000€
- Si CA ≥ 23 000€ :
  - Non classé : 21,2% du CA
  - Classé ⭐ : 6% du CA

### 3. Versement Libératoire

**Conditions strictes :**
- Uniquement en **Micro-BIC**
- CA dans les plafonds
- Taux : 1% (classé) ou 1,7% (non classé)
- RFR N-2 < 29 315€/part (non vérifié dans l'app)

### 4. Amortissements intelligents

**Seuil légal :** 600€ HT
- **< 600€** : Dépense courante (déductible immédiatement)
- **≥ 600€** : Amortissement obligatoire

**Durées selon catégories :**
- Structure : 50 ans
- Toiture : 25 ans
- Chauffage : 15 ans
- Mobilier : 10 ans
- Électroménager : 7 ans
- Informatique : 3 ans

### 5. Trimestres de retraite

**Seuils 2026 (600 × SMIC) :**
- 1 trimestre : 7 046€
- 2 trimestres : 14 092€
- 3 trimestres : 21 138€
- 4 trimestres : 28 184€

---

## 📝 RÉSUMÉ DES CALCULS

### Flux de calcul complet

```
1. CA (auto ou manuel)
   ↓
2. Charges par gîte (mensuelles → annuelles)
   ↓
3. Frais d'exploitations (travaux, frais, produits)
   ↓
4. Détection amortissements (≥ 600€)
   ↓
5. Charges résidence (prorata surface)
   ↓
6. Frais professionnels
   ↓
7. Frais véhicule / Kilomètres
   ↓
8. TOTAL CHARGES
   ↓
9. BÉNÉFICE = CA - CHARGES
   ↓
10. URSSAF (selon statut et CA)
    ↓
11. RESTE AVANT IR = BÉNÉFICE - URSSAF
    ↓
12. IR (barème progressif + quotient familial)
    ↓
13. RESTE APRÈS IR
    ↓
14. Tableau comparatif 4 options
    ↓
15. Comparaison Réel vs Micro-BIC
    ↓
16. Reste à vivre (revenus - crédits - frais perso)
```

---

## 🎬 CONCLUSION

La page fiscalité est un **outil complet et automatisé** permettant :

✅ **Gestion multi-années** avec sauvegarde automatique  
✅ **Calcul intelligent des amortissements** (législation française)  
✅ **Comparaison de 4 régimes fiscaux** en temps réel  
✅ **Suivi des kilomètres professionnels** avec automatisation  
✅ **Calcul URSSAF détaillé** (7 composantes + allocations progressives)  
✅ **Calcul IR** avec barème progressif 2026  
✅ **Reste à vivre** incluant revenus, crédits et frais personnels  
✅ **Seuils automatiques LMNP/LMP** selon la législation 2026  
✅ **Versement libératoire** pour Micro-BIC (1% ou 1,7%)  
✅ **Validation trimestres retraite**  
✅ **Export CSV** des trajets kilométriques  

**Technologies :**
- **Frontend** : HTML5, Vanilla JavaScript (6696 lignes)
- **Backend** : Supabase (PostgreSQL + JSONB)
- **Sauvegarde** : Automatique avec debounce 500ms
- **UI** : CSS adaptatif (modes Sidebar et Apple)

---

**Document créé pour vérification complète de la page fiscalité**  
*Toutes les logiques, formules et calculs sont détaillés ci-dessus.*
