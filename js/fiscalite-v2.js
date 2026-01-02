// ==========================================
// 💰 MODULE FISCALITÉ LMP - VERSION 2 BIENS
// ==========================================

// Compteurs pour IDs uniques des listes
let travauxCounter = 0;
let fraisDiversCounter = 0;
let produitsCounter = 0;
let creditsCounter = 0; // Nouveau compteur pour les crédits

// Debounce pour éviter trop de calculs
let calculTempsReelTimeout = null;
let lastSavedData = null; // Pour éviter les sauvegardes en double

// ==========================================
// 🔧 CALCUL EN TEMPS RÉEL + SAUVEGARDE AUTO
// ==========================================

// Fonction pour toggler les blocs collapsibles
function toggleBloc(titleElement) {
    const bloc = titleElement.closest('.fiscal-bloc');
    if (bloc) {
        bloc.classList.toggle('collapsed');
    }
}

function sauvegardeAutomatique() {
    console.log('🔄 [AUTO-SAVE] Déclenchement sauvegarde automatique');
    const ca = parseFloat(document.getElementById('ca')?.value || 0);
    if (ca === 0) {
        console.log('⚠️ [AUTO-SAVE] CA = 0, pas de sauvegarde');
        return;
    }
    sauvegarderSimulation(true); // true = mode silencieux
}

function calculerTempsReel() {
    console.log('🔵 [DEBUG] calculerTempsReel() appelée');
    clearTimeout(calculTempsReelTimeout);
    calculTempsReelTimeout = setTimeout(() => {
        console.log('⏱️ [DEBUG] Timeout terminé, début calcul...');
        const ca = parseFloat(document.getElementById('ca')?.value || 0);
        console.log('💵 [DEBUG] CA récupéré:', ca, '€');
        if (ca === 0) {
            // Réinitialiser l'affichage
            document.getElementById('preview-benefice').textContent = '0 €';
            document.getElementById('preview-urssaf').textContent = '0 €';
            document.getElementById('preview-reste').textContent = '0 €';
            document.getElementById('detail-sociales').textContent = '0 €';
            document.getElementById('detail-csg-crds').textContent = '0 €';
            document.getElementById('detail-formation-pro').textContent = '0 €';
            document.getElementById('detail-allocations').textContent = '0 €';
            document.getElementById('detail-total-urssaf').textContent = '0 €';
            document.getElementById('detail-trimestres').textContent = '0';
            return;
        }
        
        // Calcul simplifié des charges
        const chargesCouzon = calculerChargesBien('couzon');
        const chargesTrevoux = calculerChargesBien('trevoux');
        const travaux = getTravauxListe().reduce((sum, item) => sum + item.montant, 0);
        const fraisDivers = getFraisDiversListe().reduce((sum, item) => sum + item.montant, 0);
        const produitsAccueil = getProduitsAccueilListe().reduce((sum, item) => sum + item.montant, 0);
        
        console.log('💰 [CALCUL] Travaux:', travaux, '€');
        console.log('💰 [CALCUL] Frais divers:', fraisDivers, '€');
        console.log('💰 [CALCUL] Produits accueil:', produitsAccueil, '€');
        
        const chargesBiens = chargesCouzon + chargesTrevoux + travaux + fraisDivers + produitsAccueil;
        
        const ratio = calculerRatio();
        const chargesResidence = calculerChargesResidence() * ratio;
        const fraisPro = calculerFraisProfessionnels();
        const fraisVehicule = calculerFraisVehicule();
        
        const totalCharges = chargesBiens + chargesResidence + fraisPro + fraisVehicule;
        const benefice = ca - totalCharges;
        
        // Détail des cotisations URSSAF 2024
        const cotisationsSociales = benefice * 0.22; // 22%
        const csgCrds = benefice * 0.097; // 9.7%
        const formationPro = ca * 0.0025; // 0.25% du CA
        
        // Allocations familiales (progressif entre 110% et 140% du PASS)
        let allocations = 0;
        const pass2024 = 46368;
        if (benefice > pass2024 * 1.1) {
            const baseAlloc = Math.min(benefice - (pass2024 * 1.1), pass2024 * 0.3);
            const tauxAlloc = (baseAlloc / (pass2024 * 0.3)) * 0.031;
            allocations = benefice * tauxAlloc;
        }
        
        const urssaf = cotisationsSociales + csgCrds + formationPro + allocations;
        const resteAvantIR = benefice - urssaf;
        
        // Calcul des trimestres de retraite
        const smic2024 = 11873.10;
        let trimestres = 0;
        if (benefice >= smic2024 * 6) trimestres = 4;
        else if (benefice >= smic2024 * 4.5) trimestres = 3;
        else if (benefice >= smic2024 * 3) trimestres = 2;
        else if (benefice >= smic2024 * 1.5) trimestres = 1;
        
        // Affichage résultats principaux
        document.getElementById('preview-benefice').textContent = benefice.toFixed(2) + ' €';
        document.getElementById('preview-urssaf').textContent = urssaf.toFixed(2) + ' €';
        document.getElementById('preview-reste').textContent = resteAvantIR.toFixed(2) + ' €';
        
        // Affichage détails URSSAF
        document.getElementById('detail-sociales').textContent = cotisationsSociales.toFixed(2) + ' €';
        document.getElementById('detail-csg-crds').textContent = csgCrds.toFixed(2) + ' €';
        document.getElementById('detail-formation-pro').textContent = formationPro.toFixed(2) + ' €';
        document.getElementById('detail-allocations').textContent = allocations.toFixed(2) + ' €';
        document.getElementById('detail-total-urssaf').textContent = urssaf.toFixed(2) + ' €';
        document.getElementById('detail-trimestres').textContent = trimestres;
        
        // Alerte retraite
        const alerteRetraite = document.getElementById('alerte-retraite');
        if (trimestres === 0) {
            alerteRetraite.style.display = 'block';
        } else {
            alerteRetraite.style.display = 'none';
        }
        
        // Mise à jour du revenu LMP pour l'IR
        document.getElementById('revenu_lmp').value = resteAvantIR.toFixed(2);
        calculerIR();
        
        // Calculer le reste à vivre
        setTimeout(() => calculerResteAVivre(), 100);
        
    }, 500);
}

function calculerChargesBien(type) {
    return getAnnualValue(`internet_${type}`, `internet_${type}_type`) +
        getAnnualValue(`eau_${type}`, `eau_${type}_type`) +
        getAnnualValue(`electricite_${type}`, `electricite_${type}_type`) +
        getAnnualValue(`assurance_hab_${type}`, `assurance_hab_${type}_type`) +
        getAnnualValue(`assurance_emprunt_${type}`, `assurance_emprunt_${type}_type`) +
        getAnnualValue(`interets_emprunt_${type}`, `interets_emprunt_${type}_type`) +
        getAnnualValue(`menage_${type}`, `menage_${type}_type`) +
        getAnnualValue(`linge_${type}`, `linge_${type}_type`) +
        getAnnualValue(`logiciel_${type}`, `logiciel_${type}_type`) +
        getAnnualValue(`copropriete_${type}`, `copropriete_${type}_type`) +
        parseFloat(document.getElementById(`taxe_fonciere_${type}`)?.value || 0) +
        parseFloat(document.getElementById(`cfe_${type}`)?.value || 0) +
        parseFloat(document.getElementById(`commissions_${type}`)?.value || 0) +
        parseFloat(document.getElementById(`amortissement_${type}`)?.value || 0);
}

function calculerChargesResidence() {
    return getAnnualValue('interets_residence', 'interets_residence_type') +
        getAnnualValue('assurance_residence', 'assurance_residence_type') +
        getAnnualValue('electricite_residence', 'electricite_residence_type') +
        getAnnualValue('internet_residence', 'internet_residence_type') +
        getAnnualValue('eau_residence', 'eau_residence_type') +
        getAnnualValue('assurance_hab_residence', 'assurance_hab_residence_type') +
        parseFloat(document.getElementById('taxe_fonciere_residence')?.value || 0);
}

function calculerFraisProfessionnels() {
    return parseFloat(document.getElementById('comptable')?.value || 0) +
        parseFloat(document.getElementById('frais_bancaires')?.value || 0) +
        getAnnualValue('telephone', 'telephone_type') +
        parseFloat(document.getElementById('materiel_info')?.value || 0) +
        parseFloat(document.getElementById('rc_pro')?.value || 0) +
        parseFloat(document.getElementById('formation')?.value || 0) +
        getAnnualValue('fournitures', 'fournitures_type');
}

function calculerFraisVehicule() {
    const vehiculeOption = document.querySelector('input[name="vehicule_option"]:checked')?.value || 'bareme';
    if (vehiculeOption === 'bareme') {
        const puissance = parseInt(document.getElementById('puissance_fiscale')?.value || 5);
        const km = parseInt(document.getElementById('km_professionnels')?.value || 0);
        return calculerBaremeKilometrique(puissance, km);
    } else {
        const fraisReels = 
            getAnnualValue('carburant', 'carburant_type') +
            getAnnualValue('assurance_auto', 'assurance_auto_type') +
            parseFloat(document.getElementById('entretien_auto')?.value || 0) +
            parseFloat(document.getElementById('amortissement_auto')?.value || 0);
        const usagePro = parseInt(document.getElementById('usage_pro_pourcent')?.value || 0) / 100;
        return fraisReels * usagePro;
    }
}

// ==========================================
// 🧾 CALCUL IMPÔT SUR LE REVENU
// ==========================================

function calculerIR() {
    const salaireMadameBrut = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieurBrut = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const revenuLMP = parseFloat(document.getElementById('revenu_lmp')?.value || 0);
    const nbEnfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
    
    // Appliquer l'abattement de 10% pour frais professionnels sur les salaires
    const salaireMadame = salaireMadameBrut * 0.90; // 10% d'abattement
    const salaireMonsieur = salaireMonsieurBrut * 0.90; // 10% d'abattement
    
    // Revenu imposable total (salaires après abattement + LMP)
    const revenuTotal = salaireMadame + salaireMonsieur + revenuLMP;
    
    if (revenuTotal === 0) {
        document.getElementById('resultat-ir').style.display = 'none';
        return;
    }
    
    // Nombre de parts fiscales
    let parts = 2; // Couple
    if (nbEnfants === 1) parts += 0.5;
    else if (nbEnfants === 2) parts += 1;
    else if (nbEnfants >= 3) parts += 1 + (nbEnfants - 2);
    
    // Quotient familial
    const quotient = revenuTotal / parts;
    
    // Barème progressif 2024
    let impotQuotient = 0;
    if (quotient <= 11294) {
        impotQuotient = 0;
    } else if (quotient <= 28797) {
        impotQuotient = (quotient - 11294) * 0.11;
    } else if (quotient <= 82341) {
        impotQuotient = (28797 - 11294) * 0.11 + (quotient - 28797) * 0.30;
    } else if (quotient <= 177106) {
        impotQuotient = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (quotient - 82341) * 0.41;
    } else {
        impotQuotient = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (177106 - 82341) * 0.41 + (quotient - 177106) * 0.45;
    }
    
    const impotTotal = impotQuotient * parts;
    const resteFinalTotal = revenuTotal - impotTotal; // Reste après IR sur le revenu total
    const resteFinalLMP = revenuLMP - (impotTotal * (revenuLMP / revenuTotal)); // Part IR du LMP
    
    // Affichage
    document.getElementById('resultat-ir').style.display = 'block';
    document.getElementById('ir-revenu-total').textContent = revenuTotal.toFixed(2) + ' €';
    document.getElementById('ir-parts').textContent = parts.toFixed(1);
    document.getElementById('ir-quotient').textContent = quotient.toFixed(2) + ' €';
    document.getElementById('ir-montant').textContent = impotTotal.toFixed(2) + ' €';
    document.getElementById('ir-reste-final').textContent = resteFinalTotal.toFixed(2) + ' €';
    
    // Calculer le reste à vivre après le calcul de l'IR
    setTimeout(() => calculerResteAVivre(), 100);
}

// Attacher les événements de calcul en temps réel
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="number"], select');
    inputs.forEach(input => {
        input.addEventListener('input', calculerTempsReel);
        input.addEventListener('change', calculerTempsReel);
        // Ajouter la sauvegarde automatique sur blur pour les inputs number
        if (input.type === 'number') {
            input.addEventListener('blur', sauvegardeAutomatique);
        }
    });
});

// ==========================================
// 🔧 GESTION DES LISTES DYNAMIQUES
// ==========================================

function ajouterTravaux() {
    console.log('➕ [DEBUG] ajouterTravaux() appelée');
    const id = ++travauxCounter;
    console.log('🆔 [DEBUG] Nouveau travail ID:', id);
    const container = document.getElementById('travaux-liste');
    console.log('📦 [DEBUG] Container trouvé:', container ? 'OUI' : 'NON');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `travaux-${id}`;
    item.innerHTML = `
        <input type="text" placeholder="Description" id="travaux-desc-${id}">
        <select id="travaux-gite-${id}">
            <option value="couzon">Couzon</option>
            <option value="trevoux">Trévoux</option>
            <option value="commun">Commun</option>
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="travaux-montant-${id}">
        <button type="button" onclick="supprimerItem('travaux-${id}')">×</button>
    `;
    container.appendChild(item);
    console.log('✅ [DEBUG] Travail ID', id, 'ajouté (événements gérés par délégation)');
    // Les événements sont gérés automatiquement par la délégation sur le formulaire
}

function ajouterFraisDivers() {
    const id = ++fraisDiversCounter;
    const container = document.getElementById('frais-divers-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `frais-${id}`;
    item.innerHTML = `
        <input type="text" placeholder="Description" id="frais-desc-${id}">
        <select id="frais-gite-${id}">
            <option value="couzon">Couzon</option>
            <option value="trevoux">Trévoux</option>
            <option value="commun">Commun</option>
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="frais-montant-${id}">
        <button type="button" onclick="supprimerItem('frais-${id}')">×</button>
    `;
    container.appendChild(item);
    console.log('✅ [DEBUG] Frais ID', id, 'ajouté (événements gérés par délégation)');
}

function ajouterProduitAccueil() {
    const id = ++produitsCounter;
    const container = document.getElementById('produits-accueil-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `produits-${id}`;
    item.innerHTML = `
        <input type="text" placeholder="Description" id="produits-desc-${id}">
        <select id="produits-gite-${id}">
            <option value="couzon">Couzon</option>
            <option value="trevoux">Trévoux</option>
            <option value="commun">Commun</option>
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="produits-montant-${id}">
        <button type="button" onclick="supprimerItem('produits-${id}')">×</button>
    `;
    container.appendChild(item);
    console.log('✅ [DEBUG] Produit ID', id, 'ajouté (événements gérés par délégation)');
}

function supprimerItem(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
        item.remove();
        // Recalculer après suppression
        calculerTempsReel();
        sauvegardeAutomatique();
    }
}

// Récupérer les données des listes
function getTravauxListe() {
    const items = [];
    for (let i = 1; i <= travauxCounter; i++) {
        const desc = document.getElementById(`travaux-desc-${i}`);
        if (desc) {
            items.push({
                description: desc.value,
                gite: document.getElementById(`travaux-gite-${i}`).value,
                montant: parseFloat(document.getElementById(`travaux-montant-${i}`).value || 0)
            });
        }
    }
    console.log('📋 [GET] Travaux récupérés:', items.length, 'items, total:', items.reduce((s,i)=>s+i.montant,0), '€');
    return items;
}

function getFraisDiversListe() {
    const items = [];
    for (let i = 1; i <= fraisDiversCounter; i++) {
        const desc = document.getElementById(`frais-desc-${i}`);
        if (desc) {
            items.push({
                description: desc.value,
                gite: document.getElementById(`frais-gite-${i}`).value,
                montant: parseFloat(document.getElementById(`frais-montant-${i}`).value || 0)
            });
        }
    }
    console.log('📋 [GET] Frais divers récupérés:', items.length, 'items, total:', items.reduce((s,i)=>s+i.montant,0), '€');
    return items;
}

function getProduitsAccueilListe() {
    const items = [];
    for (let i = 1; i <= produitsCounter; i++) {
        const desc = document.getElementById(`produits-desc-${i}`);
        if (desc) {
            items.push({
                description: desc.value,
                gite: document.getElementById(`produits-gite-${i}`).value,
                montant: parseFloat(document.getElementById(`produits-montant-${i}`).value || 0)
            });
        }
    }
    console.log('📋 [GET] Produits accueil récupérés:', items.length, 'items, total:', items.reduce((s,i)=>s+i.montant,0), '€');
    return items;
}

// ==========================================
// 🔧 UTILITAIRES
// ==========================================

function getAnnualValue(fieldId, typeFieldId) {
    const value = parseFloat(document.getElementById(fieldId)?.value || 0);
    const type = document.getElementById(typeFieldId)?.value || 'annuel';
    return type === 'mensuel' ? value * 12 : value;
}

function calculerRatio() {
    const surfaceBureau = parseFloat(document.getElementById('surface_bureau')?.value || 0);
    const surfaceTotale = parseFloat(document.getElementById('surface_totale')?.value || 0);
    
    const ratioDisplay = document.getElementById('ratio-display');
    
    if (surfaceTotale === 0) {
        if (ratioDisplay) ratioDisplay.textContent = 'Ratio : 0%';
        return 0;
    }
    
    if (surfaceBureau > surfaceTotale) {
        if (typeof showToast === 'function') {
            showToast('⚠️ La surface du bureau ne peut pas dépasser la surface totale', 'error');
        }
        return 0;
    }
    
    const ratio = (surfaceBureau / surfaceTotale) * 100;
    if (ratioDisplay) ratioDisplay.textContent = `Ratio : ${ratio.toFixed(2)}%`;
    return ratio / 100;
}

function toggleVehiculeOption() {
    const option = document.querySelector('input[name="vehicule_option"]:checked').value;
    document.getElementById('vehicule-bareme').style.display = option === 'bareme' ? 'grid' : 'none';
    document.getElementById('vehicule-reel').style.display = option === 'reel' ? 'grid' : 'none';
}

// ==========================================
// 📊 BARÈME KILOMÉTRIQUE 2024
// ==========================================

function calculerBaremeKilometrique(puissance, km) {
    const baremes = {
        3: [
            { max: 5000, formule: (d) => d * 0.529 },
            { max: 20000, formule: (d) => d * 0.316 + 1065 },
            { max: Infinity, formule: (d) => d * 0.370 }
        ],
        4: [
            { max: 5000, formule: (d) => d * 0.606 },
            { max: 20000, formule: (d) => d * 0.340 + 1330 },
            { max: Infinity, formule: (d) => d * 0.407 }
        ],
        5: [
            { max: 5000, formule: (d) => d * 0.636 },
            { max: 20000, formule: (d) => d * 0.357 + 1395 },
            { max: Infinity, formule: (d) => d * 0.427 }
        ],
        6: [
            { max: 5000, formule: (d) => d * 0.665 },
            { max: 20000, formule: (d) => d * 0.374 + 1457 },
            { max: Infinity, formule: (d) => d * 0.447 }
        ],
        7: [
            { max: 5000, formule: (d) => d * 0.697 },
            { max: 20000, formule: (d) => d * 0.394 + 1515 },
            { max: Infinity, formule: (d) => d * 0.470 }
        ]
    };
    
    const tranche = baremes[puissance].find(t => km <= t.max);
    return tranche ? tranche.formule(km) : 0;
}

// ==========================================
// 🧮 CALCUL PRINCIPAL
// ==========================================

function calculerFiscalite(event) {
    event.preventDefault();
    
    // Chiffre d'affaires
    const ca = parseFloat(document.getElementById('ca').value || 0);
    
    if (ca === 0) {
        showToast('⚠️ Veuillez saisir un chiffre d\'affaires', 'error');
        return;
    }
    
    // CHARGES COUZON
    const chargesCouzon = 
        getAnnualValue('internet_couzon', 'internet_couzon_type') +
        getAnnualValue('eau_couzon', 'eau_couzon_type') +
        getAnnualValue('electricite_couzon', 'electricite_couzon_type') +
        getAnnualValue('assurance_hab_couzon', 'assurance_hab_couzon_type') +
        getAnnualValue('assurance_emprunt_couzon', 'assurance_emprunt_couzon_type') +
        getAnnualValue('interets_emprunt_couzon', 'interets_emprunt_couzon_type') +
        getAnnualValue('menage_couzon', 'menage_couzon_type') +
        getAnnualValue('linge_couzon', 'linge_couzon_type') +
        getAnnualValue('logiciel_couzon', 'logiciel_couzon_type') +
        getAnnualValue('copropriete_couzon', 'copropriete_couzon_type') +
        parseFloat(document.getElementById('taxe_fonciere_couzon').value || 0) +
        parseFloat(document.getElementById('cfe_couzon').value || 0) +
        parseFloat(document.getElementById('commissions_couzon').value || 0) +
        parseFloat(document.getElementById('amortissement_couzon').value || 0);
    
    // CHARGES TRÉVOUX
    const chargesTrevoux = 
        getAnnualValue('internet_trevoux', 'internet_trevoux_type') +
        getAnnualValue('eau_trevoux', 'eau_trevoux_type') +
        getAnnualValue('electricite_trevoux', 'electricite_trevoux_type') +
        getAnnualValue('assurance_hab_trevoux', 'assurance_hab_trevoux_type') +
        getAnnualValue('assurance_emprunt_trevoux', 'assurance_emprunt_trevoux_type') +
        getAnnualValue('interets_emprunt_trevoux', 'interets_emprunt_trevoux_type') +
        getAnnualValue('menage_trevoux', 'menage_trevoux_type') +
        getAnnualValue('linge_trevoux', 'linge_trevoux_type') +
        getAnnualValue('logiciel_trevoux', 'logiciel_trevoux_type') +
        getAnnualValue('copropriete_trevoux', 'copropriete_trevoux_type') +
        parseFloat(document.getElementById('taxe_fonciere_trevoux').value || 0) +
        parseFloat(document.getElementById('cfe_trevoux').value || 0) +
        parseFloat(document.getElementById('commissions_trevoux').value || 0) +
        parseFloat(document.getElementById('amortissement_trevoux').value || 0);
    
    // LISTES (Travaux, Frais divers, Produits)
    const travaux = getTravauxListe().reduce((sum, item) => sum + item.montant, 0);
    const fraisDivers = getFraisDiversListe().reduce((sum, item) => sum + item.montant, 0);
    const produitsAccueil = getProduitsAccueilListe().reduce((sum, item) => sum + item.montant, 0);
    
    const chargesBiens = chargesCouzon + chargesTrevoux + travaux + fraisDivers + produitsAccueil;
    
    // CHARGES RÉSIDENCE (avec prorata)
    const ratio = calculerRatio();
    const chargesResidence = (
        getAnnualValue('interets_residence', 'interets_residence_type') +
        getAnnualValue('assurance_residence', 'assurance_residence_type') +
        getAnnualValue('electricite_residence', 'electricite_residence_type') +
        getAnnualValue('internet_residence', 'internet_residence_type') +
        getAnnualValue('eau_residence', 'eau_residence_type') +
        getAnnualValue('assurance_hab_residence', 'assurance_hab_residence_type') +
        parseFloat(document.getElementById('taxe_fonciere_residence').value || 0)
    ) * ratio;
    
    // FRAIS PROFESSIONNELS
    const fraisPro = 
        parseFloat(document.getElementById('comptable').value || 0) +
        parseFloat(document.getElementById('frais_bancaires').value || 0) +
        getAnnualValue('telephone', 'telephone_type') +
        parseFloat(document.getElementById('materiel_info').value || 0) +
        parseFloat(document.getElementById('rc_pro').value || 0) +
        parseFloat(document.getElementById('formation').value || 0) +
        getAnnualValue('fournitures', 'fournitures_type');
    
    // VÉHICULE
    let fraisVehicule = 0;
    const vehiculeOption = document.querySelector('input[name="vehicule_option"]:checked').value;
    
    if (vehiculeOption === 'bareme') {
        const puissance = parseInt(document.getElementById('puissance_fiscale').value || 5);
        const km = parseInt(document.getElementById('km_professionnels').value || 0);
        fraisVehicule = calculerBaremeKilometrique(puissance, km);
    } else {
        const fraisReels = 
            getAnnualValue('carburant', 'carburant_type') +
            getAnnualValue('assurance_auto', 'assurance_auto_type') +
            parseFloat(document.getElementById('entretien_auto').value || 0) +
            parseFloat(document.getElementById('amortissement_auto').value || 0);
        const usagePro = parseInt(document.getElementById('usage_pro_pourcent').value || 0) / 100;
        fraisVehicule = fraisReels * usagePro;
    }
    
    // CALCUL FINAL
    const totalCharges = chargesBiens + chargesResidence + fraisPro + fraisVehicule;
    const benefice = ca - totalCharges;
    
    // COTISATIONS URSSAF
    const cotisations = {
        indemnites: benefice * 0.0085,
        retraiteBase: benefice * 0.1775,
        retraiteCompl: benefice * 0.07,
        invalidite: benefice * 0.013,
        csgCrds: benefice * 0.097,
        formationPro: ca * 0.0025
    };
    
    const totalCotisations = Object.values(cotisations).reduce((sum, val) => sum + val, 0);
    const resteAvantIR = benefice - totalCotisations;
    
    // TRIMESTRES RETRAITE (1 trimestre = 600 SMIC horaire)
    const trimestres = Math.min(4, Math.floor(benefice / (600 * 11.65)));
    
    // AFFICHER LES RÉSULTATS
    afficherResultats({
        ca,
        chargesCouzon,
        chargesTrevoux,
        travaux,
        fraisDivers,
        produitsAccueil,
        chargesBiens,
        chargesResidence,
        ratio: ratio * 100,
        fraisPro,
        fraisVehicule,
        totalCharges,
        benefice,
        cotisations,
        totalCotisations,
        resteAvantIR,
        trimestres
    });
}

// ==========================================
// 📊 AFFICHAGE DES RÉSULTATS
// ==========================================

function afficherResultats(data) {
    const resultatDiv = document.getElementById('resultats-fiscalite');
    resultatDiv.style.display = 'block';
    resultatDiv.innerHTML = `
        <div id="resultats-content" style="background: linear-gradient(135deg, var(--primary) 0%, #2980b9 100%); color: white; padding: 25px; border-radius: 15px;">
            <h3 style="text-align: center; font-size: 1.8rem; margin-bottom: 20px;">📊 RÉSULTATS FISCAUX LMP</h3>
            
            <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-size: 0.9rem; opacity: 0.9;">CHIFFRE D'AFFAIRES</div>
                <strong style="font-size: 2rem;">${data.ca.toFixed(2)} €</strong>
            </div>
            
            <div class="resultat-section">
                <h4>💶 CHARGES DÉDUCTIBLES</h4>
                <div class="resultat-ligne">
                    <span>• Charges Couzon :</span>
                    <span>${data.chargesCouzon.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Charges Trévoux :</span>
                    <span>${data.chargesTrevoux.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Travaux/Réparations :</span>
                    <span>${data.travaux.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Frais divers :</span>
                    <span>${data.fraisDivers.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Produits d'accueil :</span>
                    <span>${data.produitsAccueil.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Charges résidence (prorata ${data.ratio.toFixed(2)}%) :</span>
                    <span>${data.chargesResidence.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Frais professionnels :</span>
                    <span>${data.fraisPro.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Véhicule :</span>
                    <span>${data.fraisVehicule.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne total">
                    <span>TOTAL CHARGES DÉDUCTIBLES :</span>
                    <strong>${data.totalCharges.toFixed(2)} €</strong>
                </div>
            </div>
            
            <div class="resultat-ligne total" style="font-size: 1.5rem; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                <span>BÉNÉFICE IMPOSABLE :</span>
                <strong>${data.benefice.toFixed(2)} €</strong>
            </div>
            
            <div class="resultat-section">
                <h4>💰 ESTIMATION COTISATIONS URSSAF</h4>
                <div class="resultat-ligne">
                    <span>• Indemnités journalières (0,85%) :</span>
                    <span>${data.cotisations.indemnites.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Retraite de base (17,75%) :</span>
                    <span>${data.cotisations.retraiteBase.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Retraite complémentaire (7%) :</span>
                    <span>${data.cotisations.retraiteCompl.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Invalidité-décès (1,30%) :</span>
                    <span>${data.cotisations.invalidite.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• CSG-CRDS (9,70%) :</span>
                    <span>${data.cotisations.csgCrds.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Formation pro (0,25% du CA) :</span>
                    <span>${data.cotisations.formationPro.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne total">
                    <span>TOTAL COTISATIONS URSSAF :</span>
                    <strong>${data.totalCotisations.toFixed(2)} €/an</strong>
                </div>
                <div style="text-align: center; font-size: 0.9rem; margin-top: 5px;">
                    (soit ${(data.totalCotisations / 12).toFixed(2)} €/mois)
                </div>
            </div>
            
            <div class="resultat-ligne total" style="font-size: 1.4rem; background: rgba(39, 174, 96, 0.3); padding: 15px; border-radius: 8px;">
                <span>💵 RESTE AVANT IMPÔT SUR LE REVENU :</span>
                <strong>${data.resteAvantIR.toFixed(2)} €</strong>
            </div>
            
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center;">
                <div style="font-size: 1.2rem; font-weight: 600;">👴 TRIMESTRES DE RETRAITE VALIDÉS</div>
                <div style="font-size: 2rem; font-weight: 700; margin-top: 10px;">${data.trimestres} / 4</div>
                <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 5px;">
                    (basé sur le bénéfice imposable / 600 SMIC horaire)
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
                <button onclick="sauvegarderSimulation()" class="btn btn-primary" style="margin-right: 10px;">💾 Sauvegarder</button>
                <button onclick="exporterPDF()" class="btn btn-secondary">📄 Exporter PDF</button>
            </div>
        </div>
    `;
    
    resultatDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==========================================
// 💾 SAUVEGARDE / CHARGEMENT
// ==========================================

async function sauvegarderSimulation(silencieux = false) {
    console.log('💾 [SAVE] Début sauvegarderSimulation(), silencieux =', silencieux);
    
    let nom = 'Simulation auto';
    if (!silencieux) {
        nom = prompt('Nom de la simulation :');
        if (!nom) {
            console.log('❌ [SAVE] Sauvegarde annulée par utilisateur');
            return;
        }
    }
    
    console.log('📝 [SAVE] Collecte des données pour:', nom);
    const data = {
        nom_simulation: nom,
        chiffre_affaires: parseFloat(document.getElementById('ca').value || 0),
        
        // Couzon
        internet_couzon: parseFloat(document.getElementById('internet_couzon').value || 0),
        internet_couzon_type: document.getElementById('internet_couzon_type').value,
        eau_couzon: parseFloat(document.getElementById('eau_couzon').value || 0),
        eau_couzon_type: document.getElementById('eau_couzon_type').value,
        electricite_couzon: parseFloat(document.getElementById('electricite_couzon').value || 0),
        electricite_couzon_type: document.getElementById('electricite_couzon_type').value,
        assurance_hab_couzon: parseFloat(document.getElementById('assurance_hab_couzon').value || 0),
        assurance_hab_couzon_type: document.getElementById('assurance_hab_couzon_type').value,
        assurance_emprunt_couzon: parseFloat(document.getElementById('assurance_emprunt_couzon').value || 0),
        assurance_emprunt_couzon_type: document.getElementById('assurance_emprunt_couzon_type').value,
        interets_emprunt_couzon: parseFloat(document.getElementById('interets_emprunt_couzon').value || 0),
        interets_emprunt_couzon_type: document.getElementById('interets_emprunt_couzon_type').value,
        menage_couzon: parseFloat(document.getElementById('menage_couzon').value || 0),
        menage_couzon_type: document.getElementById('menage_couzon_type').value,
        linge_couzon: parseFloat(document.getElementById('linge_couzon').value || 0),
        linge_couzon_type: document.getElementById('linge_couzon_type').value,
        logiciel_couzon: parseFloat(document.getElementById('logiciel_couzon').value || 0),
        logiciel_couzon_type: document.getElementById('logiciel_couzon_type').value,
        taxe_fonciere_couzon: parseFloat(document.getElementById('taxe_fonciere_couzon').value || 0),
        cfe_couzon: parseFloat(document.getElementById('cfe_couzon').value || 0),
        commissions_couzon: parseFloat(document.getElementById('commissions_couzon').value || 0),
        amortissement_couzon: parseFloat(document.getElementById('amortissement_couzon').value || 0),
        copropriete_couzon: parseFloat(document.getElementById('copropriete_couzon').value || 0),
        copropriete_couzon_type: document.getElementById('copropriete_couzon_type').value,
        
        // Trévoux
        internet_trevoux: parseFloat(document.getElementById('internet_trevoux').value || 0),
        internet_trevoux_type: document.getElementById('internet_trevoux_type').value,
        eau_trevoux: parseFloat(document.getElementById('eau_trevoux').value || 0),
        eau_trevoux_type: document.getElementById('eau_trevoux_type').value,
        electricite_trevoux: parseFloat(document.getElementById('electricite_trevoux').value || 0),
        electricite_trevoux_type: document.getElementById('electricite_trevoux_type').value,
        assurance_hab_trevoux: parseFloat(document.getElementById('assurance_hab_trevoux').value || 0),
        assurance_hab_trevoux_type: document.getElementById('assurance_hab_trevoux_type').value,
        assurance_emprunt_trevoux: parseFloat(document.getElementById('assurance_emprunt_trevoux').value || 0),
        assurance_emprunt_trevoux_type: document.getElementById('assurance_emprunt_trevoux_type').value,
        interets_emprunt_trevoux: parseFloat(document.getElementById('interets_emprunt_trevoux').value || 0),
        interets_emprunt_trevoux_type: document.getElementById('interets_emprunt_trevoux_type').value,
        menage_trevoux: parseFloat(document.getElementById('menage_trevoux').value || 0),
        menage_trevoux_type: document.getElementById('menage_trevoux_type').value,
        linge_trevoux: parseFloat(document.getElementById('linge_trevoux').value || 0),
        linge_trevoux_type: document.getElementById('linge_trevoux_type').value,
        logiciel_trevoux: parseFloat(document.getElementById('logiciel_trevoux').value || 0),
        logiciel_trevoux_type: document.getElementById('logiciel_trevoux_type').value,
        taxe_fonciere_trevoux: parseFloat(document.getElementById('taxe_fonciere_trevoux').value || 0),
        cfe_trevoux: parseFloat(document.getElementById('cfe_trevoux').value || 0),
        commissions_trevoux: parseFloat(document.getElementById('commissions_trevoux').value || 0),
        amortissement_trevoux: parseFloat(document.getElementById('amortissement_trevoux').value || 0),
        copropriete_trevoux: parseFloat(document.getElementById('copropriete_trevoux').value || 0),
        copropriete_trevoux_type: document.getElementById('copropriete_trevoux_type').value,
        
        // Listes (envoyer en tant qu'objets, pas de JSON.stringify pour JSONB)
        travaux_liste: getTravauxListe(),
        frais_divers_liste: getFraisDiversListe(),
        produits_accueil_liste: getProduitsAccueilListe(),
        
        // Résidence
        surface_bureau: parseFloat(document.getElementById('surface_bureau').value || 0),
        surface_totale: parseFloat(document.getElementById('surface_totale').value || 0),
        interets_residence: parseFloat(document.getElementById('interets_residence').value || 0),
        interets_residence_type: document.getElementById('interets_residence_type').value,
        assurance_residence: parseFloat(document.getElementById('assurance_residence').value || 0),
        assurance_residence_type: document.getElementById('assurance_residence_type').value,
        electricite_residence: parseFloat(document.getElementById('electricite_residence').value || 0),
        electricite_residence_type: document.getElementById('electricite_residence_type').value,
        internet_residence: parseFloat(document.getElementById('internet_residence').value || 0),
        internet_residence_type: document.getElementById('internet_residence_type').value,
        eau_residence: parseFloat(document.getElementById('eau_residence').value || 0),
        eau_residence_type: document.getElementById('eau_residence_type').value,
        assurance_hab_residence: parseFloat(document.getElementById('assurance_hab_residence').value || 0),
        assurance_hab_residence_type: document.getElementById('assurance_hab_residence_type').value,
        taxe_fonciere_residence: parseFloat(document.getElementById('taxe_fonciere_residence').value || 0),
        
        // Frais professionnels
        comptable: parseFloat(document.getElementById('comptable').value || 0),
        frais_bancaires: parseFloat(document.getElementById('frais_bancaires').value || 0),
        telephone: parseFloat(document.getElementById('telephone').value || 0),
        telephone_type: document.getElementById('telephone_type').value,
        materiel_info: parseFloat(document.getElementById('materiel_info').value || 0),
        rc_pro: parseFloat(document.getElementById('rc_pro').value || 0),
        formation: parseFloat(document.getElementById('formation').value || 0),
        fournitures: parseFloat(document.getElementById('fournitures').value || 0),
        fournitures_type: document.getElementById('fournitures_type').value,
        
        // Véhicule
        vehicule_option: 'bareme', // Toujours barème kilométrique (frais réels supprimés)
        puissance_fiscale: parseInt(document.getElementById('puissance_fiscale').value || 5),
        km_professionnels: parseInt(document.getElementById('km_professionnels').value || 0),
        carburant: 0, // Non utilisé en mode barème
        carburant_type: 'mensuel',
        assurance_auto: 0, // Non utilisé en mode barème
        assurance_auto_type: 'mensuel',
        entretien_auto: 0, // Non utilisé en mode barème
        amortissement_auto: 0, // Non utilisé en mode barème
        usage_pro_pourcent: 0, // Non utilisé en mode barème
        
        // IR
        salaire_madame: parseFloat(document.getElementById('salaire_madame').value || 0),
        salaire_monsieur: parseFloat(document.getElementById('salaire_monsieur').value || 0),
        nombre_enfants: parseInt(document.getElementById('nombre_enfants').value || 0),
        
        // Reste à vivre - Crédits
        credits_liste: getCreditsListe(),
        
        // Reste à vivre - Frais personnels mensuels
        frais_perso_internet: parseFloat(document.getElementById('frais_perso_internet')?.value || 0),
        frais_perso_electricite: parseFloat(document.getElementById('frais_perso_electricite')?.value || 0),
        frais_perso_eau: parseFloat(document.getElementById('frais_perso_eau')?.value || 0),
        frais_perso_assurance: parseFloat(document.getElementById('frais_perso_assurance')?.value || 0),
        frais_perso_taxe: parseFloat(document.getElementById('frais_perso_taxe')?.value || 0),
        frais_perso_autres: parseFloat(document.getElementById('frais_perso_autres')?.value || 0)
    };
    
    // Vérifier si les données ont changé
    const dataString = JSON.stringify(data);
    if (silencieux && dataString === lastSavedData) {
        console.log('⏭️ [SAVE] Données identiques, sauvegarde ignorée');
        return;
    }
    
    console.log('📤 [SAVE] Envoi vers Supabase...', data);
    try {
        const { data: result, error } = await supabase
            .from('simulations_fiscales')
            .insert(data)
            .select();
        
        if (error) {
            console.error('❌ [SAVE] Erreur Supabase:', error);
            throw error;
        }
        
        console.log('✅ [SAVE] Succès! ID:', result[0]?.id);
        lastSavedData = dataString;
        
        if (!silencieux) {
            showToast('✓ Simulation sauvegardée', 'success');
        }
    } catch (error) {
        console.error('💥 [SAVE] Exception:', error);
        if (!silencieux) {
            showToast('Erreur lors de la sauvegarde', 'error');
        }
    }
}

async function chargerDerniereSimulation() {
    console.log('📥 [LOAD] Chargement de la dernière simulation...');
    
    try {
        const { data, error } = await supabase
            .from('simulations_fiscales')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                console.log('ℹ️ [LOAD] Aucune simulation trouvée');
                return;
            }
            throw error;
        }
        
        if (!data) {
            console.log('ℹ️ [LOAD] Aucune simulation trouvée');
            return;
        }
        
        console.log('✅ [LOAD] Simulation trouvée, ID:', data.id, 'Date:', data.created_at);
        
        // Remplir le formulaire avec les données
        document.getElementById('ca').value = data.chiffre_affaires || '';
        
        // Couzon
        document.getElementById('internet_couzon').value = data.internet_couzon || '';
        document.getElementById('internet_couzon_type').value = data.internet_couzon_type || 'mensuel';
        document.getElementById('eau_couzon').value = data.eau_couzon || '';
        document.getElementById('eau_couzon_type').value = data.eau_couzon_type || 'mensuel';
        document.getElementById('electricite_couzon').value = data.electricite_couzon || '';
        document.getElementById('electricite_couzon_type').value = data.electricite_couzon_type || 'mensuel';
        document.getElementById('assurance_hab_couzon').value = data.assurance_hab_couzon || '';
        document.getElementById('assurance_hab_couzon_type').value = data.assurance_hab_couzon_type || 'mensuel';
        document.getElementById('assurance_emprunt_couzon').value = data.assurance_emprunt_couzon || '';
        document.getElementById('assurance_emprunt_couzon_type').value = data.assurance_emprunt_couzon_type || 'mensuel';
        document.getElementById('interets_emprunt_couzon').value = data.interets_emprunt_couzon || '';
        document.getElementById('interets_emprunt_couzon_type').value = data.interets_emprunt_couzon_type || 'mensuel';
        document.getElementById('menage_couzon').value = data.menage_couzon || '';
        document.getElementById('menage_couzon_type').value = data.menage_couzon_type || 'mensuel';
        document.getElementById('linge_couzon').value = data.linge_couzon || '';
        document.getElementById('linge_couzon_type').value = data.linge_couzon_type || 'mensuel';
        document.getElementById('logiciel_couzon').value = data.logiciel_couzon || '';
        document.getElementById('logiciel_couzon_type').value = data.logiciel_couzon_type || 'mensuel';
        document.getElementById('taxe_fonciere_couzon').value = data.taxe_fonciere_couzon || '';
        document.getElementById('cfe_couzon').value = data.cfe_couzon || '';
        document.getElementById('commissions_couzon').value = data.commissions_couzon || '';
        document.getElementById('amortissement_couzon').value = data.amortissement_couzon || '';
        document.getElementById('copropriete_couzon').value = data.copropriete_couzon || '';
        document.getElementById('copropriete_couzon_type').value = data.copropriete_couzon_type || 'mensuel';
        
        // Trévoux
        document.getElementById('internet_trevoux').value = data.internet_trevoux || '';
        document.getElementById('internet_trevoux_type').value = data.internet_trevoux_type || 'mensuel';
        document.getElementById('eau_trevoux').value = data.eau_trevoux || '';
        document.getElementById('eau_trevoux_type').value = data.eau_trevoux_type || 'mensuel';
        document.getElementById('electricite_trevoux').value = data.electricite_trevoux || '';
        document.getElementById('electricite_trevoux_type').value = data.electricite_trevoux_type || 'mensuel';
        document.getElementById('assurance_hab_trevoux').value = data.assurance_hab_trevoux || '';
        document.getElementById('assurance_hab_trevoux_type').value = data.assurance_hab_trevoux_type || 'mensuel';
        document.getElementById('assurance_emprunt_trevoux').value = data.assurance_emprunt_trevoux || '';
        document.getElementById('assurance_emprunt_trevoux_type').value = data.assurance_emprunt_trevoux_type || 'mensuel';
        document.getElementById('interets_emprunt_trevoux').value = data.interets_emprunt_trevoux || '';
        document.getElementById('interets_emprunt_trevoux_type').value = data.interets_emprunt_trevoux_type || 'mensuel';
        document.getElementById('menage_trevoux').value = data.menage_trevoux || '';
        document.getElementById('menage_trevoux_type').value = data.menage_trevoux_type || 'mensuel';
        document.getElementById('linge_trevoux').value = data.linge_trevoux || '';
        document.getElementById('linge_trevoux_type').value = data.linge_trevoux_type || 'mensuel';
        document.getElementById('logiciel_trevoux').value = data.logiciel_trevoux || '';
        document.getElementById('logiciel_trevoux_type').value = data.logiciel_trevoux_type || 'mensuel';
        document.getElementById('taxe_fonciere_trevoux').value = data.taxe_fonciere_trevoux || '';
        document.getElementById('cfe_trevoux').value = data.cfe_trevoux || '';
        document.getElementById('commissions_trevoux').value = data.commissions_trevoux || '';
        document.getElementById('amortissement_trevoux').value = data.amortissement_trevoux || '';
        document.getElementById('copropriete_trevoux').value = data.copropriete_trevoux || '';
        document.getElementById('copropriete_trevoux_type').value = data.copropriete_trevoux_type || 'mensuel';
        
        // Résidence principale
        document.getElementById('surface_bureau').value = data.surface_bureau || '';
        document.getElementById('surface_totale').value = data.surface_totale || '';
        document.getElementById('interets_residence').value = data.interets_residence || '';
        document.getElementById('interets_residence_type').value = data.interets_residence_type || 'mensuel';
        document.getElementById('assurance_residence').value = data.assurance_residence || '';
        document.getElementById('assurance_residence_type').value = data.assurance_residence_type || 'mensuel';
        document.getElementById('electricite_residence').value = data.electricite_residence || '';
        document.getElementById('electricite_residence_type').value = data.electricite_residence_type || 'mensuel';
        document.getElementById('internet_residence').value = data.internet_residence || '';
        document.getElementById('internet_residence_type').value = data.internet_residence_type || 'mensuel';
        document.getElementById('eau_residence').value = data.eau_residence || '';
        document.getElementById('eau_residence_type').value = data.eau_residence_type || 'mensuel';
        document.getElementById('assurance_hab_residence').value = data.assurance_hab_residence || '';
        document.getElementById('assurance_hab_residence_type').value = data.assurance_hab_residence_type || 'mensuel';
        document.getElementById('taxe_fonciere_residence').value = data.taxe_fonciere_residence || '';
        
        // Frais professionnels
        document.getElementById('comptable').value = data.comptable || '';
        document.getElementById('frais_bancaires').value = data.frais_bancaires || '';
        document.getElementById('telephone').value = data.telephone || '';
        document.getElementById('telephone_type').value = data.telephone_type || 'mensuel';
        document.getElementById('materiel_info').value = data.materiel_info || '';
        document.getElementById('rc_pro').value = data.rc_pro || '';
        document.getElementById('formation').value = data.formation || '';
        document.getElementById('fournitures').value = data.fournitures || '';
        document.getElementById('fournitures_type').value = data.fournitures_type || 'mensuel';
        
        // Véhicule
        document.getElementById('puissance_fiscale').value = data.puissance_fiscale || 5;
        document.getElementById('km_professionnels').value = data.km_professionnels || '';
        
        // IR
        document.getElementById('salaire_madame').value = data.salaire_madame || '';
        document.getElementById('salaire_monsieur').value = data.salaire_monsieur || '';
        document.getElementById('nombre_enfants').value = data.nombre_enfants || 0;
        
        // Reste à vivre - Frais personnels
        if (document.getElementById('frais_perso_internet')) {
            document.getElementById('frais_perso_internet').value = data.frais_perso_internet || '';
        }
        if (document.getElementById('frais_perso_electricite')) {
            document.getElementById('frais_perso_electricite').value = data.frais_perso_electricite || '';
        }
        if (document.getElementById('frais_perso_eau')) {
            document.getElementById('frais_perso_eau').value = data.frais_perso_eau || '';
        }
        if (document.getElementById('frais_perso_assurance')) {
            document.getElementById('frais_perso_assurance').value = data.frais_perso_assurance || '';
        }
        if (document.getElementById('frais_perso_taxe')) {
            document.getElementById('frais_perso_taxe').value = data.frais_perso_taxe || '';
        }
        if (document.getElementById('frais_perso_autres')) {
            document.getElementById('frais_perso_autres').value = data.frais_perso_autres || '';
        }
        
        // Restaurer les listes dynamiques
        console.log('🔄 [LOAD] Restauration des listes dynamiques...');
        
        // Réinitialiser les conteneurs
        document.getElementById('travaux-liste').innerHTML = '';
        document.getElementById('frais-divers-liste').innerHTML = '';
        document.getElementById('produits-accueil-liste').innerHTML = '';
        travauxCounter = 0;
        fraisDiversCounter = 0;
        produitsCounter = 0;
        
        // Restaurer les travaux
        if (data.travaux_liste) {
            const travaux = Array.isArray(data.travaux_liste) ? data.travaux_liste : [];
            console.log('📋 [LOAD] Travaux trouvés:', travaux.length);
            travaux.forEach(item => {
                ajouterTravaux();
                const id = travauxCounter;
                document.getElementById(`travaux-desc-${id}`).value = item.description || '';
                document.getElementById(`travaux-gite-${id}`).value = item.gite || 'couzon';
                document.getElementById(`travaux-montant-${id}`).value = item.montant || 0;
            });
        }
        
        // Restaurer les frais divers
        if (data.frais_divers_liste) {
            const frais = Array.isArray(data.frais_divers_liste) ? data.frais_divers_liste : [];
            console.log('📋 [LOAD] Frais divers trouvés:', frais.length);
            frais.forEach(item => {
                ajouterFraisDivers();
                const id = fraisDiversCounter;
                document.getElementById(`frais-desc-${id}`).value = item.description || '';
                document.getElementById(`frais-gite-${id}`).value = item.gite || 'couzon';
                document.getElementById(`frais-montant-${id}`).value = item.montant || 0;
            });
        }
        
        // Restaurer les produits d'accueil
        if (data.produits_accueil_liste) {
            const produits = Array.isArray(data.produits_accueil_liste) ? data.produits_accueil_liste : [];
            console.log('📋 [LOAD] Produits d\'accueil trouvés:', produits.length);
            produits.forEach(item => {
                ajouterProduitAccueil();
                const id = produitsCounter;
                document.getElementById(`produits-desc-${id}`).value = item.description || '';
                document.getElementById(`produits-gite-${id}`).value = item.gite || 'couzon';
                document.getElementById(`produits-montant-${id}`).value = item.montant || 0;
            });
        }
        
        // Restaurer les crédits (reste à vivre)
        if (data.credits_liste) {
            const credits = Array.isArray(data.credits_liste) ? data.credits_liste : [];
            console.log('📋 [LOAD] Crédits trouvés:', credits.length);
            // Réinitialiser le conteneur des crédits
            const creditsContainer = document.getElementById('credits-liste');
            if (creditsContainer) {
                creditsContainer.innerHTML = '';
                creditsCounter = 0;
                credits.forEach(item => {
                    ajouterCredit();
                    const id = creditsCounter;
                    document.getElementById(`credit-desc-${id}`).value = item.description || '';
                    document.getElementById(`credit-mensuel-${id}`).value = item.mensuel || 0;
                    document.getElementById(`credit-capital-${id}`).value = item.capital || 0;
                });
            }
        }
        
        console.log('✅ [LOAD] Formulaire rempli, recalcul...');
        
        // Recalculer
        try {
            console.log('🔢 [LOAD] Appel calculerRatio()...');
            calculerRatio();
            console.log('✅ [LOAD] calculerRatio() terminé');
        } catch (e) {
            console.error('❌ [LOAD] Erreur calculerRatio():', e);
        }
        
        try {
            console.log('⏱️ [LOAD] Appel calculerTempsReel()...');
            calculerTempsReel();
            console.log('✅ [LOAD] calculerTempsReel() terminé');
        } catch (e) {
            console.error('❌ [LOAD] Erreur calculerTempsReel():', e);
        }
        
        showToast('📥 Dernière simulation chargée', 'success');
        
    } catch (error) {
        console.error('💥 [LOAD] Erreur:', error);
    }
}

function nouvelleSimulation() {
    document.getElementById('calculateur-lmp').reset();
    document.getElementById('travaux-liste').innerHTML = '';
    document.getElementById('frais-divers-liste').innerHTML = '';
    document.getElementById('produits-accueil-liste').innerHTML = '';
    document.getElementById('resultats-fiscalite').style.display = 'none';
    travauxCounter = 0;
    fraisDiversCounter = 0;
    produitsCounter = 0;
    calculerRatio();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exporterPDF() {
    showToast('Fonction PDF en cours de développement', 'info');
}

// ==========================================
// 🚀 INITIALISATION
// ==========================================

function initFiscalite() {
    console.log('🚀 [INIT-FISCALITE] Début initialisation module fiscalité');
    
    const form = document.getElementById('calculateur-lmp');
    if (!form) {
        console.warn('⚠️ [INIT-FISCALITE] Formulaire non trouvé, nouvelle tentative dans 500ms...');
        setTimeout(initFiscalite, 500);
        return;
    }
    
    console.log('✅ [INIT-FISCALITE] Formulaire trouvé');
    
    // NOUVELLE APPROCHE : Délégation d'événements sur le formulaire entier
    // Cela fonctionne même pour les champs ajoutés dynamiquement !
    console.log('🎯 [INIT-FISCALITE] Installation de la délégation d\'événements...');
    
    // Supprimer les anciens événements s'ils existent
    form.removeEventListener('input', handleFormInput);
    form.removeEventListener('change', handleFormChange);
    form.removeEventListener('focusout', handleFormBlur);
    
    // Ajouter les nouveaux événements avec délégation
    form.addEventListener('input', handleFormInput);
    form.addEventListener('change', handleFormChange);
    form.addEventListener('focusout', handleFormBlur);
    
    console.log('✅ [INIT-FISCALITE] Délégation d\'événements installée');
    
    // Charger automatiquement la dernière simulation
    setTimeout(() => {
        console.log('📥 [INIT-FISCALITE] Chargement de la dernière simulation...');
        chargerDerniereSimulation();
    }, 100);
}

// Gestionnaires d'événements avec délégation
function handleFormInput(e) {
    const target = e.target;
    if (target.type === 'number' || target.tagName === 'SELECT') {
        console.log(`⌨️ [EVENT] Input sur ${target.id || target.name || 'champ'}`);
        calculerTempsReel();
        
        // Si c'est un champ de la section reste à vivre, recalculer immédiatement
        if (target.id && (target.id.startsWith('frais_perso_') || target.id.startsWith('credit_'))) {
            setTimeout(() => calculerResteAVivre(), 100);
        }
    }
}

function handleFormChange(e) {
    const target = e.target;
    if (target.type === 'number' || target.tagName === 'SELECT') {
        console.log(`🔄 [EVENT] Change sur ${target.id || target.name || 'champ'}`);
        calculerTempsReel();
        
        // Si c'est un champ de la section reste à vivre, recalculer immédiatement
        if (target.id && (target.id.startsWith('frais_perso_') || target.id.startsWith('credit_'))) {
            setTimeout(() => calculerResteAVivre(), 100);
        }
    }
}

function handleFormBlur(e) {
    const target = e.target;
    if (target.type === 'number') {
        console.log(`👋 [EVENT] Blur sur ${target.id || target.name || 'champ'}`);
        sauvegardeAutomatique();
    }
}

// ==========================================
// 💰 GESTION DU RESTE À VIVRE
// ==========================================

function ajouterCredit() {
    const id = ++creditsCounter;
    const container = document.getElementById('credits-liste');
    const item = document.createElement('div');
    item.className = 'credit-item';
    item.id = `credit-${id}`;
    item.innerHTML = `
        <input type="text" placeholder="Description du crédit" id="credit-desc-${id}">
        <input type="number" step="0.01" placeholder="Mensualité €" id="credit-mensuel-${id}">
        <input type="number" step="0.01" placeholder="Capital restant €" id="credit-capital-${id}">
        <button type="button" onclick="supprimerCredit('credit-${id}')">×</button>
    `;
    container.appendChild(item);
    console.log('✅ [DEBUG] Crédit ID', id, 'ajouté');
    calculerResteAVivre();
}

function supprimerCredit(itemId) {
    const item = document.getElementById(itemId);
    if (item) {
        item.remove();
        calculerResteAVivre();
    }
}

function getCreditsListe() {
    const items = [];
    for (let i = 1; i <= creditsCounter; i++) {
        const desc = document.getElementById(`credit-desc-${i}`);
        if (desc) {
            items.push({
                description: desc.value,
                mensuel: parseFloat(document.getElementById(`credit-mensuel-${i}`).value || 0),
                capital: parseFloat(document.getElementById(`credit-capital-${i}`).value || 0)
            });
        }
    }
    return items;
}

function calculerResteAVivre() {
    console.log('💰 [RAV] Calcul du reste à vivre...');
    
    // ==================== REVENUS (tout converti en MENSUEL) ====================
    // Salaires annuels convertis en mensuels
    const salaireMadameAnnuel = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieurAnnuel = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const salaireMadameMensuel = salaireMadameAnnuel / 12;
    const salaireMonsieurMensuel = salaireMonsieurAnnuel / 12;
    
    // Revenus LMP après IR (on prend le reste final de l'IR, divisé par 12 pour mensualiser)
    const resteFinalIRElement = document.getElementById('ir-reste-final');
    const revenuLMPAnnuel = resteFinalIRElement && resteFinalIRElement.textContent !== '0 €' 
        ? parseFloat(resteFinalIRElement.textContent.replace(/[^\d.-]/g, '')) 
        : 0;
    const revenuLMPMensuel = revenuLMPAnnuel / 12;
    
    // Frais kilométriques (barème annuel converti en mensuel - c'est une économie réelle)
    const kmPro = parseInt(document.getElementById('km_professionnels')?.value || 0);
    const puissance = parseInt(document.getElementById('puissance_fiscale')?.value || 5);
    const fraisKmAnnuel = calculerBaremeKilometrique(puissance, kmPro);
    const fraisKmMensuel = fraisKmAnnuel / 12;
    
    // Amortissements réintégrés (annuels convertis en mensuels - ce n'est pas une sortie d'argent réelle)
    const amortCouzon = parseFloat(document.getElementById('amortissement_couzon')?.value || 0);
    const amortTrevoux = parseFloat(document.getElementById('amortissement_trevoux')?.value || 0);
    const amortAuto = parseFloat(document.getElementById('amortissement_auto')?.value || 0);
    const amortissementsMensuel = (amortCouzon + amortTrevoux + amortAuto) / 12;
    
    const totalRevenus = salaireMadameMensuel + salaireMonsieurMensuel + revenuLMPMensuel + fraisKmMensuel + amortissementsMensuel;
    
    // ==================== DÉPENSES ====================
    // Crédits
    const credits = getCreditsListe();
    const totalCredits = credits.reduce((sum, c) => sum + c.mensuel, 0);
    const totalCapital = credits.reduce((sum, c) => sum + c.capital, 0);
    
    // Frais personnels mensuels
    const fraisInternet = parseFloat(document.getElementById('frais_perso_internet')?.value || 0);
    const fraisElec = parseFloat(document.getElementById('frais_perso_electricite')?.value || 0);
    const fraisEau = parseFloat(document.getElementById('frais_perso_eau')?.value || 0);
    const fraisAssurance = parseFloat(document.getElementById('frais_perso_assurance')?.value || 0);
    const fraisTaxeAnnuel = parseFloat(document.getElementById('frais_perso_taxe')?.value || 0);
    const fraisAutres = parseFloat(document.getElementById('frais_perso_autres')?.value || 0);
    
    const totalFraisPerso = fraisInternet + fraisElec + fraisEau + fraisAssurance + (fraisTaxeAnnuel / 12) + fraisAutres;
    
    const totalDepenses = totalCredits + totalFraisPerso;
    
    // ==================== RESTE À VIVRE ====================
    const resteAVivre = totalRevenus - totalDepenses;
    
    // ==================== AFFICHAGE (tout en MENSUEL) ====================
    document.getElementById('rav-salaire-madame').textContent = salaireMadameMensuel.toFixed(2) + ' €';
    document.getElementById('rav-salaire-monsieur').textContent = salaireMonsieurMensuel.toFixed(2) + ' €';
    document.getElementById('rav-lmp').textContent = revenuLMPMensuel.toFixed(2) + ' €';
    document.getElementById('rav-kms').textContent = fraisKmMensuel.toFixed(2) + ' €';
    document.getElementById('rav-amortissements').textContent = amortissementsMensuel.toFixed(2) + ' €';
    document.getElementById('rav-total-revenus').textContent = totalRevenus.toFixed(2) + ' €';
    
    document.getElementById('rav-credits').textContent = totalCredits.toFixed(2) + ' €';
    document.getElementById('rav-frais-perso').textContent = totalFraisPerso.toFixed(2) + ' €';
    document.getElementById('rav-total-depenses').textContent = totalDepenses.toFixed(2) + ' €';
    
    document.getElementById('rav-final').textContent = resteAVivre.toFixed(2) + ' €';
    document.getElementById('rav-capital-total').textContent = `Capital restant dû total : ${totalCapital.toFixed(2)} €`;
    
    // Couleur selon le résultat
    const ravFinalElement = document.getElementById('rav-final');
    if (resteAVivre < 0) {
        ravFinalElement.style.color = '#e74c3c';
    } else if (resteAVivre < 1000) {
        ravFinalElement.style.color = '#f39c12';
    } else {
        ravFinalElement.style.color = '#2ecc71';
    }
    
    console.log('✅ [RAV] Reste à vivre calculé:', resteAVivre.toFixed(2), '€');
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.ajouterTravaux = ajouterTravaux;
window.ajouterFraisDivers = ajouterFraisDivers;
window.ajouterProduitAccueil = ajouterProduitAccueil;
window.supprimerItem = supprimerItem;
window.calculerFiscalite = calculerFiscalite;
window.calculerRatio = calculerRatio;
window.calculerIR = calculerIR;
window.toggleBloc = toggleBloc;
window.sauvegarderSimulation = sauvegarderSimulation;
window.chargerDerniereSimulation = chargerDerniereSimulation;
window.nouvelleSimulation = nouvelleSimulation;
window.exporterPDF = exporterPDF;
window.calculerTempsReel = calculerTempsReel;
window.initFiscalite = initFiscalite;
window.ajouterCredit = ajouterCredit; // Nouvelle fonction
window.supprimerCredit = supprimerCredit; // Nouvelle fonction
window.calculerResteAVivre = calculerResteAVivre; // Nouvelle fonction

// Initialisation automatique au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 [INIT] DOMContentLoaded - Tentative d\'initialisation...');
    // Attendre que le contenu de l'onglet soit potentiellement chargé
    setTimeout(initFiscalite, 1000);
});
