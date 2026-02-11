# 🎯 PROMPT : Correction et Amélioration Module Fiscalité LMNP

## CONTEXTE
Tu es un développeur expert en fiscalité française LMNP/LMP. Tu dois corriger et améliorer une page de gestion fiscale pour propriétaires de gîtes/locations meublées.

---

## 🔧 CORRECTIONS CRITIQUES À APPLIQUER

### 1. SYSTÈME MENSUEL/ANNUEL (ERREUR MAJEURE)

**❌ Comportement actuel INCORRECT** :
- Le toggle change juste le calcul mais garde la même valeur dans l'input
- Si user saisit "50€" en mensuel puis toggle annuel → affiche toujours "50€"
- Incohérence totale dans l'interface

**✅ Comportement CORRECT à implémenter** :

```javascript
function togglePeriodSection(giteId, champ, periode) {
  const input = document.getElementById(`${champ}_${giteId}`);
  const valeurActuelle = parseFloat(input.value) || 0;
  const periodeActuelle = input.dataset.periode || 'mensuel';
  
  // Conversion intelligente
  if (periodeActuelle === 'mensuel' && periode === 'annuel') {
    input.value = (valeurActuelle * 12).toFixed(2);
  } else if (periodeActuelle === 'annuel' && periode === 'mensuel') {
    input.value = (valeurActuelle / 12).toFixed(2);
  }
  
  // Stocker la nouvelle période
  input.dataset.periode = periode;
  
  // Mise à jour visuelle
  document.querySelector(`#btn-mensuel-${champ}-${giteId}`).classList.toggle('active', periode === 'mensuel');
  document.querySelector(`#btn-annuel-${champ}-${giteId}`).classList.toggle('active', periode === 'annuel');
  
  // Sauvegarde et recalcul
  sauvegarderDonnees();
}
```

**Structure de stockage** :
```javascript
// Chaque champ avec toggle stocke :
{
  internet_1: {
    valeur: 50,        // Valeur AFFICHÉE actuellement
    periode: 'mensuel', // Type actuel
    valeurAnnuelle: 600 // Valeur annuelle CALCULÉE (pour les calculs)
  }
}
```

**Labels dynamiques** :
```html
<!-- Le label doit changer selon le toggle -->
<label id="label-internet-1">
  Internet <span class="periode-label">(mensuel)</span>
</label>

<script>
function updateLabel(champ, giteId, periode) {
  const label = document.querySelector(`#label-${champ}-${giteId} .periode-label`);
  label.textContent = `(${periode})`;
}
</script>
```

---

### 2. CHAMPS ANNUELS STRICTS

**Les 4 champs suivants N'ONT PAS de toggle** (toujours annuels) :
- `taxe_fonciere_[giteId]`
- `cfe_[giteId]`
- `commissions_[giteId]`
- `amortissement_[giteId]`

**HTML à générer** :
```html
<div class="form-group">
  <label>Taxe foncière <span class="badge bg-info">Annuel uniquement</span></label>
  <input type="number" id="taxe_fonciere_1" placeholder="Ex: 850">
  <!-- PAS de boutons toggle -->
</div>
```

---

### 3. SEUIL AMORTISSEMENT : 600€ HT (pas 720€)

**Correction** :
```javascript
const SEUIL_AMORTISSEMENT_HT = 600;  // Seuil légal 2024
const TVA = 1.20; // TVA 20%
const SEUIL_AMORTISSEMENT_TTC = SEUIL_AMORTISSEMENT_HT * TVA; // = 720€

// Dans detecterAmortissement()
if (montantTTC >= SEUIL_AMORTISSEMENT_TTC) {
  // Amortissement obligatoire
} else {
  // Charge déductible immédiatement
}
```

**Message à afficher** :
```html
<div class="alert alert-info">
  💡 Les dépenses < 600€ HT (720€ TTC) sont déductibles immédiatement.
  Au-delà, elles doivent être amorties sur plusieurs années.
</div>
```

---

### 4. CFE : EXONÉRATION PREMIÈRE ANNÉE

**Ajouter un champ** :
```html
<div class="form-group">
  <label>CFE (Cotisation Foncière des Entreprises)</label>
  
  <div class="alert alert-warning mb-2">
    ⚠️ Première année d'activité ? Vous êtes exonéré de CFE !
    <a href="#" onclick="confirmerExonerationCFE()">Je confirme l'exonération</a>
  </div>
  
  <input type="number" id="cfe_1" placeholder="Ex: 450" data-exonere="false">
</div>

<script>
function confirmerExonerationCFE() {
  const input = document.getElementById('cfe_1');
  input.value = 0;
  input.disabled = true;
  input.dataset.exonere = 'true';
  document.querySelector('.alert-warning').classList.add('d-none');
}
</script>
```

---

### 5. AMORTISSEMENT PAR COMPOSANTS

**Amélioration de la détection automatique** :

```javascript
const CATEGORIES_AMORTISSEMENT = {
  // Bien immobilier (séparation par composants)
  structure: {
    mots: ['gros œuvre', 'structure', 'fondation', 'murs porteurs'],
    duree: 50
  },
  toiture: {
    mots: ['toiture', 'toit', 'charpente', 'couverture', 'tuiles', 'ardoises'],
    duree: 25
  },
  facade: {
    mots: ['façade', 'ravalement', 'enduit extérieur', 'crépi'],
    duree: 25
  },
  menuiseries_ext: {
    mots: ['fenêtres', 'portes extérieures', 'volets', 'menuiseries'],
    duree: 25
  },
  electricite: {
    mots: ['électricité', 'électrique', 'tableau électrique', 'câblage'],
    duree: 25
  },
  plomberie: {
    mots: ['plomberie', 'tuyauterie', 'évacuation', 'arrivée d\'eau'],
    duree: 20
  },
  chauffage: {
    mots: ['chauffage', 'chaudière', 'radiateurs', 'pompe à chaleur'],
    duree: 15
  },
  agencement: {
    mots: ['agencement', 'cloisons', 'portes intérieures', 'revêtement sol'],
    duree: 10
  },
  
  // Mobilier et équipements
  mobilier: {
    mots: ['canapé', 'lit', 'matelas', 'table', 'chaise', 'armoire', 'bureau'],
    duree: 10
  },
  electromenager: {
    mots: ['lave-linge', 'lave-vaisselle', 'frigo', 'réfrigérateur', 'four', 'micro-ondes', 'congélateur'],
    duree: 7
  },
  audiovisuel: {
    mots: ['tv', 'télé', 'télévision', 'sono', 'enceinte', 'home cinema'],
    duree: 5
  },
  informatique: {
    mots: ['ordinateur', 'pc', 'laptop', 'tablette', 'smartphone', 'imprimante'],
    duree: 3
  },
  
  // Travaux
  peinture_parquet: {
    mots: ['peinture', 'parquet', 'carrelage', 'tapisserie'],
    duree: 10
  },
  isolation: {
    mots: ['isolation', 'isolant', 'laine de verre', 'laine de roche'],
    duree: 20
  },
  cuisine_sdb: {
    mots: ['cuisine équipée', 'salle de bain', 'douche', 'baignoire', 'lavabo'],
    duree: 10
  }
};

function detecterAmortissement(description, montant, typeManuel = null) {
  if (montant < SEUIL_AMORTISSEMENT_TTC) {
    return {
      amortissable: false,
      duree: 0,
      montantAnnuel: montant,
      message: `💸 Déductible immédiatement (< 720€)`
    };
  }
  
  // Recherche par mots-clés
  let categorieTrouvee = null;
  const descLower = description.toLowerCase();
  
  for (const [cat, config] of Object.entries(CATEGORIES_AMORTISSEMENT)) {
    if (config.mots.some(mot => descLower.includes(mot))) {
      categorieTrouvee = { ...config, nom: cat };
      break;
    }
  }
  
  // Si pas de catégorie trouvée, proposer sélection manuelle
  if (!categorieTrouvee && !typeManuel) {
    return {
      amortissable: true,
      duree: null,
      montantAnnuel: 0,
      message: `⚠️ Catégorie non détectée - Veuillez sélectionner`,
      necessite_selection: true
    };
  }
  
  const duree = typeManuel ? typeManuel.duree : categorieTrouvee.duree;
  const montantAnnuel = montant / duree;
  const anneeDebut = new Date().getFullYear();
  const anneeFin = anneeDebut + duree - 1;
  
  return {
    amortissable: true,
    duree: duree,
    montantAnnuel: montantAnnuel,
    anneeDebut: anneeDebut,
    anneeFin: anneeFin,
    categorie: typeManuel ? typeManuel.nom : categorieTrouvee.nom,
    message: `📊 Amortissement sur ${duree} ans (${montantAnnuel.toFixed(2)}€/an jusqu'en ${anneeFin})`
  };
}
```

**Interface pour sélection manuelle** :
```html
<div class="modal" id="modal-select-amortissement">
  <div class="modal-content">
    <h3>⚠️ Sélection de la durée d'amortissement</h3>
    <p>La catégorie n'a pas pu être détectée automatiquement.</p>
    <p><strong>Description :</strong> <span id="desc-amort"></span></p>
    <p><strong>Montant :</strong> <span id="montant-amort"></span></p>
    
    <label>Choisissez la catégorie :</label>
    <select id="select-categorie-amort">
      <optgroup label="Bien immobilier">
        <option value="structure">Structure/Gros œuvre (50 ans)</option>
        <option value="toiture">Toiture (25 ans)</option>
        <option value="facade">Façade (25 ans)</option>
        <option value="menuiseries_ext">Menuiseries extérieures (25 ans)</option>
        <option value="electricite">Installation électrique (25 ans)</option>
        <option value="plomberie">Plomberie (20 ans)</option>
        <option value="chauffage">Chauffage (15 ans)</option>
        <option value="agencement">Agencement intérieur (10 ans)</option>
      </optgroup>
      <optgroup label="Mobilier & Équipements">
        <option value="mobilier">Mobilier (10 ans)</option>
        <option value="electromenager">Électroménager (7 ans)</option>
        <option value="audiovisuel">Audiovisuel (5 ans)</option>
        <option value="informatique">Informatique (3 ans)</option>
      </optgroup>
      <optgroup label="Travaux">
        <option value="peinture_parquet">Peinture/Parquet (10 ans)</option>
        <option value="isolation">Isolation (20 ans)</option>
        <option value="cuisine_sdb">Cuisine/SDB équipée (10 ans)</option>
      </optgroup>
    </select>
    
    <button onclick="validerCategorieAmortissement()">Valider</button>
  </div>
</div>
```

---

### 6. CALCUL FISCAL CORRIGÉ

**Fonction de calcul complète** :

```javascript
function calculerFiscalite() {
  const annee = anneeSelectionnee;
  const ca = parseFloat(document.getElementById('ca').value) || 0;
  
  // 1. Total charges par gîte
  let totalCharges = 0;
  
  gites.forEach(gite => {
    const chargesGite = {
      // Charges avec toggle (conversion en annuel)
      internet: calculerChargeAnnuelle('internet', gite.id),
      eau: calculerChargeAnnuelle('eau', gite.id),
      electricite: calculerChargeAnnuelle('electricite', gite.id),
      assurance_hab: calculerChargeAnnuelle('assurance_hab', gite.id),
      assurance_emprunt: calculerChargeAnnuelle('assurance_emprunt', gite.id),
      interets_emprunt: calculerChargeAnnuelle('interets_emprunt', gite.id),
      menage: calculerChargeAnnuelle('menage', gite.id),
      linge: calculerChargeAnnuelle('linge', gite.id),
      logiciel: calculerChargeAnnuelle('logiciel', gite.id),
      copropriete: calculerChargeAnnuelle('copropriete', gite.id),
      
      // Charges strictement annuelles
      taxe_fonciere: parseFloat(document.getElementById(`taxe_fonciere_${gite.id}`).value) || 0,
      cfe: parseFloat(document.getElementById(`cfe_${gite.id}`).value) || 0,
      commissions: parseFloat(document.getElementById(`commissions_${gite.id}`).value) || 0,
      amortissement_bien: parseFloat(document.getElementById(`amortissement_${gite.id}`).value) || 0
    };
    
    const totalGite = Object.values(chargesGite).reduce((sum, val) => sum + val, 0);
    totalCharges += totalGite;
  });
  
  // 2. Travaux et amortissements (UNIQUEMENT montant année en cours)
  let totalTravaux = 0;
  travaux.forEach(t => {
    if (t.amortissable) {
      // Vérifier si l'année actuelle est dans la période d'amortissement
      if (annee >= t.anneeDebut && annee <= t.anneeFin) {
        totalTravaux += t.montantAnnuel;
      }
    } else {
      // Charge immédiate uniquement l'année des travaux
      const anneeTravaux = new Date(t.date_travaux).getFullYear();
      if (annee === anneeTravaux) {
        totalTravaux += t.montant;
      }
    }
  });
  
  // 3. Frais divers (année en cours uniquement)
  let totalFraisDivers = 0;
  fraisDivers.forEach(f => {
    const anneeFrais = new Date(f.date_frais).getFullYear();
    if (annee === anneeFrais) {
      totalFraisDivers += f.montant;
    }
  });
  
  // 4. Produits d'accueil (année en cours uniquement)
  let totalProduits = 0;
  produits.forEach(p => {
    const anneeAchat = new Date(p.date_achat).getFullYear();
    if (annee === anneeAchat) {
      totalProduits += p.montant;
    }
  });
  
  // 5. Frais kilométriques (année en cours uniquement)
  let totalKm = 0;
  trajets.forEach(t => {
    const anneeTrajet = new Date(t.date_trajet).getFullYear();
    if (annee === anneeTrajet) {
      totalKm += t.montant_calcule;
    }
  });
  
  // 6. TOTAL GÉNÉRAL
  const totalChargesDeductibles = 
    totalCharges + 
    totalTravaux + 
    totalFraisDivers + 
    totalProduits + 
    totalKm;
  
  // 7. Résultat fiscal
  const beneficeBrut = ca - totalChargesDeductibles;
  
  // 8. Calcul IR selon régime
  const resultatMicroBIC = calculerMicroBIC(ca);
  const resultatReel = calculerReel(ca, totalChargesDeductibles);
  
  // Affichage
  afficherResultats({
    ca: ca,
    totalCharges: totalChargesDeductibles,
    beneficeBrut: beneficeBrut,
    microBIC: resultatMicroBIC,
    reel: resultatReel
  });
}

function calculerChargeAnnuelle(champ, giteId) {
  const input = document.getElementById(`${champ}_${giteId}`);
  if (!input) return 0;
  
  const valeur = parseFloat(input.value) || 0;
  const periode = input.dataset.periode || 'mensuel';
  
  return periode === 'mensuel' ? valeur * 12 : valeur;
}

function calculerMicroBIC(ca) {
  const ABATTEMENT = 0.50; // 50%
  const baseImposable = ca * ABATTEMENT;
  
  return {
    regime: 'Micro-BIC',
    ca: ca,
    abattement: ca * (1 - ABATTEMENT),
    baseImposable: baseImposable
  };
}

function calculerReel(ca, charges) {
  const baseImposable = ca - charges;
  
  return {
    regime: 'Réel Simplifié',
    ca: ca,
    charges: charges,
    baseImposable: Math.max(0, baseImposable), // Pas de base négative (déficit)
    deficit: baseImposable < 0 ? Math.abs(baseImposable) : 0
  };
}
```

---

### 7. VALIDATION ET ALERTES INTELLIGENTES

**Ajouter des alertes contextuelles** :

```javascript
function validerDonneesFiscales() {
  const alertes = [];
  
  // Alerte 1 : Charges > CA
  if (totalCharges > ca) {
    alertes.push({
      type: 'warning',
      message: `⚠️ Vos charges (${totalCharges}€) dépassent votre CA (${ca}€). Vous êtes en déficit de ${Math.abs(ca - totalCharges)}€.`,
      action: 'Ce déficit est reportable sur 10 ans en LMNP Réel.'
    });
  }
  
  // Alerte 2 : Pas d'amortissement bien
  const amortBien = parseFloat(document.getElementById('amortissement_1').value) || 0;
  if (amortBien === 0) {
    alertes.push({
      type: 'info',
      message: `💡 Vous n'avez pas saisi d'amortissement du bien immobilier.`,
      action: 'L\'amortissement du bien peut réduire considérablement votre base imposable. <a href="#guide-amort">En savoir plus</a>'
    });
  }
  
  // Alerte 3 : Intérêts emprunt = 0 mais emprunt probable
  const interets = parseFloat(document.getElementById('interets_emprunt_1').value) || 0;
  if (interets === 0 && amortBien > 0) {
    alertes.push({
      type: 'question',
      message: `❓ Avez-vous un emprunt en cours ?`,
      action: 'Les intérêts d\'emprunt sont déductibles (pas le capital). <a href="#" onclick="afficherAideEmprunt()">Aide</a>'
    });
  }
  
  // Alerte 4 : CFE = 0 et pas marqué comme exonéré
  const cfe = document.getElementById('cfe_1');
  if (cfe.value == 0 && cfe.dataset.exonere !== 'true') {
    alertes.push({
      type: 'warning',
      message: `⚠️ CFE à 0€ : êtes-vous en première année d'activité ?`,
      action: '<a href="#" onclick="confirmerExonerationCFE()">Oui, je confirme l\'exonération</a>'
    });
  }
  
  // Alerte 5 : Aucun trajet kilométrique
  if (trajets.length === 0) {
    alertes.push({
      type: 'info',
      message: `💡 Vous n'avez déclaré aucun frais kilométrique.`,
      action: 'Déplacements pour travaux, ménage, accueil ? Ces frais sont déductibles.'
    });
  }
  
  // Affichage des alertes
  afficherAlertes(alertes);
}

function afficherAlertes(alertes) {
  const container = document.getElementById('alertes-fiscales');
  container.innerHTML = '';
  
  alertes.forEach(alerte => {
    const div = document.createElement('div');
    div.className = `alert alert-${alerte.type}`;
    div.innerHTML = `
      <strong>${alerte.message}</strong>
      <p class="mb-0 mt-2 small">${alerte.action}</p>
    `;
    container.appendChild(div);
  });
}
```

---

### 8. GUIDE D'AIDE CONTEXTUEL

**Ajouter une sidebar d'aide** :

```html
<div class="help-sidebar">
  <button class="btn-help" onclick="toggleHelp()">
    ❓ Aide
  </button>
  
  <div id="help-content" class="help-content d-none">
    <h4>📚 Guide fiscal LMNP</h4>
    
    <div class="help-section">
      <h5>💰 Charges déductibles</h5>
      <ul>
        <li>✅ Intérêts d'emprunt (PAS le capital)</li>
        <li>✅ Assurances (habitation, PNO, emprunteur)</li>
        <li>✅ Taxe foncière</li>
        <li>✅ CFE (sauf 1ère année)</li>
        <li>✅ Travaux d'entretien/réparation</li>
        <li>✅ Charges de copropriété</li>
        <li>✅ Eau, électricité, internet (si au nom du loueur)</li>
        <li>✅ Frais de gestion, comptabilité</li>
        <li>❌ Capital de l'emprunt</li>
        <li>❌ Taxe d'habitation</li>
      </ul>
    </div>
    
    <div class="help-section" id="guide-amort">
      <h5>📊 Amortissement</h5>
      <p><strong>Qu'est-ce que l'amortissement ?</strong></p>
      <p>L'amortissement permet de déduire la dépréciation de vos biens sur plusieurs années.</p>
      
      <p><strong>Durées légales :</strong></p>
      <ul>
        <li>Bien immobilier : 20-30 ans (selon composants)</li>
        <li>Mobilier : 5-10 ans</li>
        <li>Électroménager : 5-8 ans</li>
        <li>Informatique : 3-5 ans</li>
      </ul>
      
      <p><strong>⚠️ Important :</strong></p>
      <ul>
        <li>Le terrain n'est JAMAIS amortissable</li>
        <li>Séparez le prix d'achat : terrain + construction</li>
        <li>Exemple : 200 000€ dont 40 000€ terrain → Amortir 160 000€</li>
      </ul>
    </div>
    
    <div class="help-section">
      <h5>🚗 Frais kilométriques</h5>
      <p>Barème 2024 (véhicule 7CV) : <strong>0,568 €/km</strong></p>
      <p><strong>Trajets déductibles :</strong></p>
      <ul>
        <li>Domicile → Bien (pour travaux, ménage)</li>
        <li>Déplacements pour achats (meubles, matériel)</li>
        <li>Rendez-vous fournisseurs, artisans</li>
        <li>Accueil voyageurs (si nécessaire)</li>
      </ul>
    </div>
    
    <div class="help-section">
      <h5>📞 Besoin d'aide ?</h5>
      <p>Contactez un expert-comptable spécialisé en LMNP.</p>
      <p>💡 <strong>Conseil :</strong> En Réel Simplifié, les frais de comptable (800-1500€/an) sont déductibles !</p>
    </div>
  </div>
</div>
```

---

## 🎨 AMÉLIORATIONS UX/UI

### 1. Indicateurs visuels de saisie

```html
<!-- Ajouter des badges de statut sur chaque section -->
<div class="section-header">
  <h3>📊 Charges Gîte 1</h3>
  <span class="badge bg-success" id="badge-gite-1">✓ Complété</span>
  <!-- ou -->
  <span class="badge bg-warning" id="badge-gite-1">⚠️ Incomplet (3/14)</span>
</div>

<script>
function updateBadgeSection(giteId) {
  const totalChamps = 14;
  const champsRemplis = compterChampsRemplis(giteId);
  const badge = document.getElementById(`badge-gite-${giteId}`);
  
  if (champsRemplis === totalChamps) {
    badge.className = 'badge bg-success';
    badge.textContent = '✓ Complété';
  } else if (champsRemplis === 0) {
    badge.className = 'badge bg-secondary';
    badge.textContent = '⚠️ Non rempli';
  } else {
    badge.className = 'badge bg-warning';
    badge.textContent = `⚠️ Incomplet (${champsRemplis}/${totalChamps})`;
  }
}
</script>
```

### 2. Autocomplétion intelligente

```javascript
// Pour les adresses de trajets kilométriques
function setupAutocomplete() {
  const input = document.getElementById('lieu_depart');
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'fr' }
  });
  
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    input.value = place.formatted_address;
  });
}
```

### 3. Sauvegarde visuelle

```javascript
// Afficher un indicateur de sauvegarde
function sauvegarderDonnees() {
  // Afficher loader
  document.getElementById('save-indicator').innerHTML = '💾 Sauvegarde...';
  document.getElementById('save-indicator').className = 'badge bg-info';
  
  // ... logique de sauvegarde ...
  
  // Succès
  setTimeout(() => {
    document.getElementById('save-indicator').innerHTML = '✓ Sauvegardé';
    document.getElementById('save-indicator').className = 'badge bg-success';
  }, 500);
}
```

---

## 🚀 NOUVELLES FONCTIONNALITÉS À AJOUTER

### 1. Export PDF récapitulatif

```javascript
function exporterPDF() {
  const doc = new jsPDF();
  
  // En-tête
  doc.setFontSize(20);
  doc.text('Récapitulatif Fiscal LMNP', 20, 20);
  doc.setFontSize(12);
  doc.text(`Année : ${anneeSelectionnee}`, 20, 30);
  
  // CA
  doc.text(`Chiffre d'affaires : ${ca.toFixed(2)} €`, 20, 45);
  
  // Charges par catégorie
  let y = 60;
  doc.setFontSize(14);
  doc.text('Charges déductibles :', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  categoriesCharges.forEach(cat => {
    doc.text(`${cat.nom} : ${cat.total.toFixed(2)} €`, 25, y);
    y += 7;
  });
  
  // Total charges
  y += 10;
  doc.setFontSize(12);
  doc.text(`TOTAL CHARGES : ${totalCharges.toFixed(2)} €`, 20, y);
  
  // Résultat
  y += 15;
  doc.setFontSize(14);
  doc.text(`Bénéfice : ${benefice.toFixed(2)} €`, 20, y);
  
  // Comparaison régimes
  y += 20;
  doc.text('Comparaison fiscale :', 20, y);
  y += 10;
  doc.setFontSize(10);
  doc.text(`Micro-BIC : Base imposable ${microBIC.base.toFixed(2)} €`, 25, y);
  y += 7;
  doc.text(`Réel Simplifié : Base imposable ${reel.base.toFixed(2)} €`, 25, y);
  y += 7;
  doc.text(`ÉCONOMIE : ${(microBIC.base - reel.base).toFixed(2)} €`, 25, y);
  
  // Téléchargement
  doc.save(`Fiscalite_LMNP_${anneeSelectionnee}.pdf`);
}
```

### 2. Comparaison N vs N-1

```html
<div class="card">
  <div class="card-header">
    <h4>📊 Évolution vs année précédente</h4>
  </div>
  <div class="card-body">
    <table class="table">
      <thead>
        <tr>
          <th></th>
          <th>2024</th>
          <th>2025</th>
          <th>Évolution</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CA</td>
          <td>10 450 €</td>
          <td>12 701 €</td>
          <td class="text-success">+21.5% ↗️</td>
        </tr>
        <tr>
          <td>Charges</td>
          <td>8 200 €</td>
          <td>9 200 €</td>
          <td class="text-warning">+12.2% ↗️</td>
        </tr>
        <tr>
          <td>Bénéfice</td>
          <td>2 250 €</td>
          <td>3 501 €</td>
          <td class="text-success">+55.6% ↗️</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 3. Simulation pluriannuelle

```javascript
function simulerProjeteion(nbAnnees) {
  const projections = [];
  
  for (let i = 1; i <= nbAnnees; i++) {
    const anneeProj = anneeSelectionnee + i;
    
    // Hypothèses (modifiables par l'utilisateur)
    const tauxCroissanceCA = 0.05; // +5%/an
    const tauxCroissanceCharges = 0.03; // +3%/an
    
    const caProj = ca * Math.pow(1 + tauxCroissanceCA, i);
    const chargesProj = totalCharges * Math.pow(1 + tauxCroissanceCharges, i);
    const beneficeProj = caProj - chargesProj;
    
    projections.push({
      annee: anneeProj,
      ca: caProj,
      charges: chargesProj,
      benefice: beneficeProj
    });
  }
  
  afficherGraphiqueProjection(projections);
}
```

---

## 🎯 RÉCAPITULATIF DES MODIFICATIONS

### CORRECTIONS CRITIQUES ✅
1. ✅ Toggle mensuel/annuel : conversion intelligente des valeurs
2. ✅ Labels dynamiques selon période
3. ✅ Seuil amortissement : 600€ HT
4. ✅ CFE : gestion exonération 1ère année
5. ✅ Amortissement par composants
6. ✅ Calcul fiscal corrigé (charges annuelles + amortissements année en cours)

### AMÉLIORATIONS UX ✨
7. ✨ Validation et alertes intelligentes
8. ✨ Guide d'aide contextuel
9. ✨ Badges de progression par section
10. ✨ Autocomplétion adresses
11. ✨ Indicateurs de sauvegarde

### NOUVELLES FONCTIONNALITÉS 🚀
12. 🚀 Export PDF
13. 🚀 Comparaison N vs N-1
14. 🚀 Simulation pluriannuelle
15. 🚀 Graphiques d'évolution

---

## 📋 CHECKLIST DE DÉVELOPPEMENT

```
[ ] 1. Corriger toggle mensuel/annuel avec conversion
[ ] 2. Ajouter labels dynamiques
[ ] 3. Corriger seuil amortissement (600€ HT)
[ ] 4. Ajouter gestion CFE exonération
[ ] 5. Améliorer détection catégories amortissement
[ ] 6. Ajouter modal sélection catégorie manuelle
[ ] 7. Corriger calcul fiscal (charges annuelles)
[ ] 8. Ajouter fonction calculerChargeAnnuelle()
[ ] 9. Ajouter validation et alertes
[ ] 10. Créer sidebar d'aide
[ ] 11. Ajouter badges progression
[ ] 12. Implémenter autocomplétion adresses
[ ] 13. Améliorer indicateur sauvegarde
[ ] 14. Créer fonction export PDF
[ ] 15. Ajouter comparaison N vs N-1
[ ] 16. Créer simulation pluriannuelle
[ ] 17. Tests complets
[ ] 18. Documentation utilisateur
```

---

## 🧪 TESTS À RÉALISER

### Test 1 : Toggle mensuel/annuel
```
1. Saisir 50€ en mensuel pour Internet
2. Cliquer "Annuel"
3. ✅ Vérifier : input affiche "600€"
4. Cliquer "Mensuel"
5. ✅ Vérifier : input affiche "50€"
6. ✅ Vérifier : calcul utilise toujours 600€
```

### Test 2 : Amortissement automatique
```
1. Ajouter travaux : "Toiture" - 15 000€
2. ✅ Vérifier : détection 25 ans
3. ✅ Vérifier : badge "600€/an jusqu'en 2050"
4. ✅ Vérifier : année N : 600€ dans charges
5. ✅ Vérifier : année N+1 : 600€ dans charges
```

### Test 3 : Validation fiscale
```
1. Saisir CA : 10 000€
2. Saisir charges : 12 000€
3. ✅ Vérifier : alerte déficit
4. Ne pas saisir amortissement bien
5. ✅ Vérifier : alerte suggestion amortissement
```

### Test 4 : Export PDF
```
1. Remplir toutes les données
2. Cliquer "Exporter PDF"
3. ✅ Vérifier : téléchargement PDF
4. ✅ Vérifier : données correctes dans PDF
```

---

**FIN DU PROMPT - Bonne chance ! 🚀**
