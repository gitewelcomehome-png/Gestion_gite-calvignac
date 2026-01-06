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
    const ca = parseFloat(document.getElementById('ca')?.value || 0);
    if (ca === 0) {
        return;
    }
    sauvegarderSimulation(true); // true = mode silencieux
}

function calculerTempsReel() {
    clearTimeout(calculTempsReelTimeout);
    calculTempsReelTimeout = setTimeout(() => {
        const ca = parseFloat(document.getElementById('ca')?.value || 0);
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
        
        // Affichage total des charges
        document.getElementById('total-charges-couzon').textContent = chargesCouzon.toFixed(2) + ' €';
        document.getElementById('total-charges-trevoux').textContent = chargesTrevoux.toFixed(2) + ' €';
        document.getElementById('total-charges-residence').textContent = chargesResidence.toFixed(2) + ' €';
        document.getElementById('total-frais-pro').textContent = fraisPro.toFixed(2) + ' €';
        document.getElementById('total-frais-vehicule').textContent = fraisVehicule.toFixed(2) + ' €';
        document.getElementById('total-travaux').textContent = travaux.toFixed(2) + ' €';
        document.getElementById('total-frais-divers').textContent = fraisDivers.toFixed(2) + ' €';
        document.getElementById('total-produits-accueil').textContent = produitsAccueil.toFixed(2) + ' €';
        document.getElementById('total-charges-annuelles').textContent = totalCharges.toFixed(2) + ' €';
        
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
        
        // 💾 SAUVEGARDE AUTOMATIQUE pour les années précédentes
        const anneeSimulation = parseInt(document.getElementById('annee_simulation')?.value);
        const anneeActuelle = new Date().getFullYear();
        if (anneeSimulation && anneeSimulation < anneeActuelle) {
            console.log(`💾 Auto-sauvegarde déclenchée pour ${anneeSimulation} (année précédente)`);
            // Attendre que l'IR soit calculé (100ms) + reste à vivre (100ms) + marge (300ms)
            setTimeout(() => {
                console.log(`💾 Lecture IR depuis élément #ir-montant:`, document.getElementById('ir-montant')?.textContent);
                sauvegarderSimulation(true); // true = mode silencieux
                // Vérifier après sauvegarde
                setTimeout(() => verifierSauvegardeAnnee(anneeSimulation), 1000);
            }, 600); // Augmenté de 1000ms à 600ms (assez pour l'IR mais plus réactif)
        }
        
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
    const id = ++travauxCounter;
    const container = document.getElementById('travaux-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `travaux-${id}`;
    window.SecurityUtils.setInnerHTML(item, `
        <input type="text" placeholder="Description" id="travaux-desc-${id}">
        <select id="travaux-gite-${id}">
            <option value="couzon">Couzon</option>
            <option value="trevoux">Trévoux</option>
            <option value="commun">Commun</option>
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="travaux-montant-${id}">
        <button type="button" onclick="supprimerItem('travaux-${id}')">×</button>
    `);
    container.appendChild(item);
    // Les événements sont gérés automatiquement par la délégation sur le formulaire
}

function ajouterFraisDivers() {
    const id = ++fraisDiversCounter;
    const container = document.getElementById('frais-divers-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `frais-${id}`;
    window.SecurityUtils.setInnerHTML(item, `
        <input type="text" placeholder="Description" id="frais-desc-${id}">
        <select id="frais-gite-${id}">
            <option value="couzon">Couzon</option>
            <option value="trevoux">Trévoux</option>
            <option value="commun">Commun</option>
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="frais-montant-${id}">
        <button type="button" onclick="supprimerItem('frais-${id}')">×</button>
    `);
    container.appendChild(item);
}

function ajouterProduitAccueil() {
    const id = ++produitsCounter;
    const container = document.getElementById('produits-accueil-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `produits-${id}`;
    window.SecurityUtils.setInnerHTML(item, `
        <input type="text" placeholder="Description" id="produits-desc-${id}">
        <select id="produits-gite-${id}">
            <option value="couzon">Couzon</option>
            <option value="trevoux">Trévoux</option>
            <option value="commun">Commun</option>
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="produits-montant-${id}">
        <button type="button" onclick="supprimerItem('produits-${id}')">×</button>
    `);
    container.appendChild(item);
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
    
    // CHARGES COUZON (SANS amortissement)
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
        parseFloat(document.getElementById('commissions_couzon').value || 0);
    
    // CHARGES TRÉVOUX (SANS amortissement)
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
        parseFloat(document.getElementById('commissions_trevoux').value || 0);
    
    // LISTES (Travaux, Frais divers, Produits)
    const travaux = getTravauxListe().reduce((sum, item) => sum + item.montant, 0);
    const fraisDivers = getFraisDiversListe().reduce((sum, item) => sum + item.montant, 0);
    const produitsAccueil = getProduitsAccueilListe().reduce((sum, item) => sum + item.montant, 0);
    
    // FRAIS PROFESSIONNELS
    const fraisPro = 
        parseFloat(document.getElementById('comptable').value || 0) +
        parseFloat(document.getElementById('frais_bancaires').value || 0) +
        getAnnualValue('telephone', 'telephone_type') +
        parseFloat(document.getElementById('materiel_info').value || 0) +
        parseFloat(document.getElementById('rc_pro').value || 0) +
        parseFloat(document.getElementById('formation').value || 0) +
        getAnnualValue('fournitures', 'fournitures_type');
    
    // CRÉDIT TRÉVOUX (depuis la liste des crédits)
    const creditsListe = getCreditsList();
    const creditTrevoux = creditsListe
        .filter(c => c.nom && c.nom.toLowerCase().includes('trévoux'))
        .reduce((sum, c) => sum + (c.mensualite * 12), 0);
    
    // CALCUL FINAL : Couzon + Trévoux + Pro + Travaux + Frais Divers + Produits + Crédit Trévoux
    // EXCLURE : Résidence principale et Véhicule
    const totalCharges = chargesCouzon + chargesTrevoux + fraisPro + travaux + fraisDivers + produitsAccueil + creditTrevoux;
    
    // Garder les calculs résidence et véhicule pour affichage mais ne pas les inclure dans le total
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
        chargesResidence,
        ratio: ratio * 100,
        fraisPro,
        fraisVehicule,
        creditTrevoux,
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
    window.SecurityUtils.setInnerHTML(resultatDiv, `
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
    `);
    
    resultatDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==========================================
// � GESTION DES ANNÉES FISCALES
// ==========================================

// Charger la liste des années disponibles
async function chargerListeAnnees() {
    try {
        const { data, error } = await supabase
            .from('simulations_fiscales')
            .select('annee')
            .order('annee', { ascending: false });
        
        if (error) throw error;
        
        // Récupérer les années uniques
        const anneesUniques = [...new Set(data.map(s => s.annee))];
        
        const selector = document.getElementById('annee_selector');
        if (!selector) return;
        
        window.SecurityUtils.setInnerHTML(selector, '');
        
        // Si aucune année, créer l'année actuelle
        if (anneesUniques.length === 0) {
            const anneeActuelle = new Date().getFullYear();
            const option = document.createElement('option');
            option.value = anneeActuelle;
            option.textContent = anneeActuelle;
            selector.appendChild(option);
            document.getElementById('annee_simulation').value = anneeActuelle;
            return;
        }
        
        // Ajouter les années au sélecteur
        anneesUniques.forEach(annee => {
            const option = document.createElement('option');
            option.value = annee;
            option.textContent = annee;
            selector.appendChild(option);
        });
        
        // Sélectionner l'année la plus récente
        selector.value = anneesUniques[0];
        document.getElementById('annee_simulation').value = anneesUniques[0];
        
    } catch (error) {
        console.error('Erreur chargement liste années:', error);
    }
}

// Charger les données d'une année spécifique
async function chargerAnnee(annee) {
    try {
        const anneeActuelle = new Date().getFullYear();
        
        const { data, error } = await supabase
            .from('simulations_fiscales')
            .select('*')
            .eq('annee', parseInt(annee))
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // Aucune donnée pour cette année, créer une simulation vide
                console.log(`📅 Aucune simulation pour ${annee}, création d'une nouvelle`);
                document.getElementById('annee_simulation').value = annee;
                
                // Réinitialiser le formulaire
                nouvelleSimulation();
                
                // Calculer automatiquement le CA UNIQUEMENT pour l'année en cours
                if (parseInt(annee) === anneeActuelle) {
                    await calculerCAAutomatique();
                }
                
                return;
            }
            throw error;
        }
        
        // Mettre à jour l'année cachée
        document.getElementById('annee_simulation').value = annee;
        
        // Charger les données dans le formulaire
        chargerDonneesFormulaire(data);
        
        // Pour l'année en cours, nettoyer les listes et recalculer le CA
        if (parseInt(annee) === anneeActuelle) {
            
            // Vider les listes de travaux, frais divers et produits d'accueil
            window.SecurityUtils.setInnerHTML(document.getElementById('travaux-liste'), '');
            window.SecurityUtils.setInnerHTML(document.getElementById('frais-divers-liste'), '');
            window.SecurityUtils.setInnerHTML(document.getElementById('produits-accueil-liste'), '');
            travauxCounter = 0;
            fraisDiversCounter = 0;
            produitsCounter = 0;
            
            // Recalculer le CA depuis les réservations de cette année
            await calculerCAAutomatique();
        } else {
            // Pour les années passées, garder le CA tel quel
            console.log(`📋 Année ${annee} : conservation du CA existant`);
            
            // Vérifier les données sauvegardées
            setTimeout(() => verifierSauvegardeAnnee(annee), 500);
        }
        
        // Recalculer les indicateurs
        calculerTempsReel();
        
    } catch (error) {
        console.error('Erreur chargement année:', error);
        showToast('Erreur lors du chargement de l\'année', 'error');
    }
}

// Calculer automatiquement le CA depuis les réservations
async function calculerCAAutomatique() {
    const annee = parseInt(document.getElementById('annee_simulation').value);
    
    if (!annee) {
        showToast('Veuillez sélectionner une année', 'warning');
        return;
    }
    
    try {
        // Récupérer toutes les réservations
        const reservations = await getAllReservations();
        
        // Filtrer par année et calculer le CA
        const reservationsAnnee = reservations.filter(r => {
            const dateDebut = parseLocalDate(r.dateDebut);
            return dateDebut.getFullYear() === annee;
        });
        
        const ca = reservationsAnnee.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
        
        // Mettre à jour le champ CA
        document.getElementById('ca').value = ca.toFixed(2);
        
        // Afficher le message de confirmation
        const infoDiv = document.getElementById('ca_auto_info');
        if (infoDiv) {
            infoDiv.style.display = 'block';
            setTimeout(() => {
                infoDiv.style.display = 'none';
            }, 3000);
        }
        
        showToast(`✓ CA ${annee}: ${formatCurrency(ca)} (${reservationsAnnee.length} réservations)`, 'success');
        
        // Recalculer
        calculerTempsReel();
        
    } catch (error) {
        console.error('Erreur calcul CA automatique:', error);
        showToast('Erreur lors du calcul du CA', 'error');
    }
}

// Helper formatCurrency
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Créer une nouvelle année en copiant les frais fixes de l'année précédente
async function creerNouvelleAnnee() {
    const anneeActuelle = parseInt(document.getElementById('annee_simulation').value);
    const nouvelleAnnee = anneeActuelle + 1;
    
    // Vérifier si l'année suivante existe déjà
    const { data: existing } = await supabase
        .from('simulations_fiscales')
        .select('id')
        .eq('annee', nouvelleAnnee)
        .limit(1);
    
    if (existing && existing.length > 0) {
        showToast(`L'année ${nouvelleAnnee} existe déjà`, 'warning');
        return;
    }
    
    if (!confirm(`Créer l'année ${nouvelleAnnee} avec les frais fixes de ${anneeActuelle} ?`)) {
        return;
    }
    
    try {
        // Récupérer les données de l'année actuelle
        const { data: anneePrecedente, error: loadError } = await supabase
            .from('simulations_fiscales')
            .select('*')
            .eq('annee', anneeActuelle)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (loadError) throw loadError;
        
        // Créer les nouvelles données en copiant uniquement les frais fixes
        const nouvellesDonnees = {
            nom_simulation: `Simulation ${nouvelleAnnee}`,
            annee: nouvelleAnnee,
            chiffre_affaires: 0, // CA à 0, sera calculé automatiquement
            
            // Copier les frais fixes de Couzon
            internet_couzon: anneePrecedente.internet_couzon,
            internet_couzon_type: anneePrecedente.internet_couzon_type,
            eau_couzon: anneePrecedente.eau_couzon,
            eau_couzon_type: anneePrecedente.eau_couzon_type,
            electricite_couzon: anneePrecedente.electricite_couzon,
            electricite_couzon_type: anneePrecedente.electricite_couzon_type,
            assurance_hab_couzon: anneePrecedente.assurance_hab_couzon,
            assurance_hab_couzon_type: anneePrecedente.assurance_hab_couzon_type,
            assurance_emprunt_couzon: anneePrecedente.assurance_emprunt_couzon,
            assurance_emprunt_couzon_type: anneePrecedente.assurance_emprunt_couzon_type,
            interets_emprunt_couzon: anneePrecedente.interets_emprunt_couzon,
            interets_emprunt_couzon_type: anneePrecedente.interets_emprunt_couzon_type,
            menage_couzon: anneePrecedente.menage_couzon,
            menage_couzon_type: anneePrecedente.menage_couzon_type,
            linge_couzon: anneePrecedente.linge_couzon,
            linge_couzon_type: anneePrecedente.linge_couzon_type,
            logiciel_couzon: anneePrecedente.logiciel_couzon,
            logiciel_couzon_type: anneePrecedente.logiciel_couzon_type,
            taxe_fonciere_couzon: anneePrecedente.taxe_fonciere_couzon,
            cfe_couzon: anneePrecedente.cfe_couzon,
            commissions_couzon: anneePrecedente.commissions_couzon,
            amortissement_couzon: anneePrecedente.amortissement_couzon,
            copropriete_couzon: anneePrecedente.copropriete_couzon,
            copropriete_couzon_type: anneePrecedente.copropriete_couzon_type,
            
            // Copier les frais fixes de Trévoux
            internet_trevoux: anneePrecedente.internet_trevoux,
            internet_trevoux_type: anneePrecedente.internet_trevoux_type,
            eau_trevoux: anneePrecedente.eau_trevoux,
            eau_trevoux_type: anneePrecedente.eau_trevoux_type,
            electricite_trevoux: anneePrecedente.electricite_trevoux,
            electricite_trevoux_type: anneePrecedente.electricite_trevoux_type,
            assurance_hab_trevoux: anneePrecedente.assurance_hab_trevoux,
            assurance_hab_trevoux_type: anneePrecedente.assurance_hab_trevoux_type,
            assurance_emprunt_trevoux: anneePrecedente.assurance_emprunt_trevoux,
            assurance_emprunt_trevoux_type: anneePrecedente.assurance_emprunt_trevoux_type,
            interets_emprunt_trevoux: anneePrecedente.interets_emprunt_trevoux,
            interets_emprunt_trevoux_type: anneePrecedente.interets_emprunt_trevoux_type,
            menage_trevoux: anneePrecedente.menage_trevoux,
            menage_trevoux_type: anneePrecedente.menage_trevoux_type,
            linge_trevoux: anneePrecedente.linge_trevoux,
            linge_trevoux_type: anneePrecedente.linge_trevoux_type,
            logiciel_trevoux: anneePrecedente.logiciel_trevoux,
            logiciel_trevoux_type: anneePrecedente.logiciel_trevoux_type,
            taxe_fonciere_trevoux: anneePrecedente.taxe_fonciere_trevoux,
            cfe_trevoux: anneePrecedente.cfe_trevoux,
            commissions_trevoux: anneePrecedente.commissions_trevoux,
            amortissement_trevoux: anneePrecedente.amortissement_trevoux,
            copropriete_trevoux: anneePrecedente.copropriete_trevoux,
            copropriete_trevoux_type: anneePrecedente.copropriete_trevoux_type,
            
            // NE PAS copier: travaux_liste, frais_divers_liste, produits_accueil_liste
            travaux_liste: [],
            frais_divers_liste: [],
            produits_accueil_liste: [],
            
            // Copier résidence principale
            surface_bureau: anneePrecedente.surface_bureau,
            surface_totale: anneePrecedente.surface_totale,
            interets_residence: anneePrecedente.interets_residence,
            interets_residence_type: anneePrecedente.interets_residence_type,
            assurance_residence: anneePrecedente.assurance_residence,
            assurance_residence_type: anneePrecedente.assurance_residence_type,
            electricite_residence: anneePrecedente.electricite_residence,
            electricite_residence_type: anneePrecedente.electricite_residence_type,
            internet_residence: anneePrecedente.internet_residence,
            internet_residence_type: anneePrecedente.internet_residence_type,
            eau_residence: anneePrecedente.eau_residence,
            eau_residence_type: anneePrecedente.eau_residence_type,
            assurance_hab_residence: anneePrecedente.assurance_hab_residence,
            assurance_hab_residence_type: anneePrecedente.assurance_hab_residence_type,
            taxe_fonciere_residence: anneePrecedente.taxe_fonciere_residence,
            
            // Copier frais professionnels
            comptable: anneePrecedente.comptable,
            frais_bancaires: anneePrecedente.frais_bancaires,
            telephone: anneePrecedente.telephone,
            telephone_type: anneePrecedente.telephone_type,
            materiel_info: anneePrecedente.materiel_info,
            rc_pro: anneePrecedente.rc_pro,
            formation: anneePrecedente.formation,
            fournitures: anneePrecedente.fournitures,
            fournitures_type: anneePrecedente.fournitures_type,
            
            // Copier véhicule
            vehicule_option: anneePrecedente.vehicule_option,
            puissance_fiscale: anneePrecedente.puissance_fiscale,
            km_professionnels: anneePrecedente.km_professionnels,
            
            // Copier IR
            salaire_madame: anneePrecedente.salaire_madame,
            salaire_monsieur: anneePrecedente.salaire_monsieur,
            nombre_enfants: anneePrecedente.nombre_enfants,
            
            // Copier crédits et frais perso
            credits_liste: anneePrecedente.credits_liste || [],
            frais_perso_internet: anneePrecedente.frais_perso_internet,
            frais_perso_electricite: anneePrecedente.frais_perso_electricite,
            frais_perso_eau: anneePrecedente.frais_perso_eau,
            frais_perso_assurance: anneePrecedente.frais_perso_assurance,
            frais_perso_taxe: anneePrecedente.frais_perso_taxe,
            frais_perso_autres: anneePrecedente.frais_perso_autres
        };
        
        // Sauvegarder la nouvelle année
        const { error: insertError } = await supabase
            .from('simulations_fiscales')
            .insert(nouvellesDonnees);
        
        if (insertError) throw insertError;
        
        showToast(`✓ Année ${nouvelleAnnee} créée avec succès !`, 'success');
        
        // Recharger la liste des années et basculer sur la nouvelle
        await chargerListeAnnees();
        document.getElementById('annee_selector').value = nouvelleAnnee;
        await chargerAnnee(nouvelleAnnee);
        
    } catch (error) {
        console.error('Erreur création nouvelle année:', error);
        showToast('Erreur lors de la création de la nouvelle année', 'error');
    }
}

// Fonction helper pour charger les données dans le formulaire
function chargerDonneesFormulaire(data) {
    // Remplir le formulaire avec les données (même logique que chargerDerniereSimulation)
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
    window.SecurityUtils.setInnerHTML(document.getElementById('travaux-liste'), '');
    window.SecurityUtils.setInnerHTML(document.getElementById('frais-divers-liste'), '');
    window.SecurityUtils.setInnerHTML(document.getElementById('produits-accueil-liste'), '');
    travauxCounter = 0;
    fraisDiversCounter = 0;
    produitsCounter = 0;
    
    // Restaurer les travaux
    if (data.travaux_liste) {
        const travaux = Array.isArray(data.travaux_liste) ? data.travaux_liste : [];
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
        produits.forEach(item => {
            ajouterProduitAccueil();
            const id = produitsCounter;
            document.getElementById(`produits-desc-${id}`).value = item.description || '';
            document.getElementById(`produits-gite-${id}`).value = item.gite || 'couzon';
            document.getElementById(`produits-montant-${id}`).value = item.montant || 0;
        });
    }
    
    // Restaurer les crédits
    if (document.getElementById('credits-liste-container')) {
        window.SecurityUtils.setInnerHTML(document.getElementById('credits-liste-container'), '');
        creditsCounter = 0;
        
        if (data.credits_liste) {
            const credits = Array.isArray(data.credits_liste) ? data.credits_liste : [];
            credits.forEach(item => {
                ajouterCredit();
                const id = creditsCounter;
                document.getElementById(`credit-nom-${id}`).value = item.nom || '';
                document.getElementById(`credit-montant-${id}`).value = item.montant || 0;
            });
        }
    }
}

async function sauvegarderSimulation(silencieux = false) {
    
    let nom = 'Simulation auto';
    if (!silencieux) {
        nom = prompt('Nom de la simulation :');
        if (!nom) {
            return;
        }
    }
    
    const anneeValue = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    
    const data = {
        nom_simulation: nom,
        annee: anneeValue,
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
        frais_perso_autres: parseFloat(document.getElementById('frais_perso_autres')?.value || 0),
        
        // 💾 RÉSULTATS CALCULÉS (pour affichage dans le dashboard)
        benefice_imposable: parseFloat(document.getElementById('preview-benefice')?.textContent.replace(/[€\s]/g, '') || 0),
        cotisations_urssaf: parseFloat(document.getElementById('preview-urssaf')?.textContent.replace(/[€\s]/g, '') || 0),
        reste_avant_ir: parseFloat(document.getElementById('preview-reste')?.textContent.replace(/[€\s]/g, '') || 0),
        impot_revenu: parseFloat(document.getElementById('ir-montant')?.textContent.replace(/[€\s]/g, '') || 0),
        reste_apres_ir: parseFloat(document.getElementById('reste-vivre-final')?.textContent.replace(/[€\s]/g, '') || 0),
        trimestres_retraite: parseInt(document.getElementById('detail-trimestres')?.textContent || 0)
    };
    
    // Vérifier si les données ont changé
    const dataString = JSON.stringify(data);
    if (silencieux && dataString === lastSavedData) {
        return;
    }
    
    try {
        const { data: result, error } = await supabase
            .from('simulations_fiscales')
            .insert(data)
            .select();
        
        if (error) {
            console.error('❌ [SAVE] Erreur Supabase:', error);
            throw error;
        }
        
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
    
    try {
        const { data, error } = await supabase
            .from('simulations_fiscales')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return;
            }
            throw error;
        }
        
        if (!data) {
            return;
        }
        
        
        // Remplir le formulaire avec les données
        document.getElementById('ca').value = data.chiffre_affaires || '';
        
        // Année
        if (document.getElementById('annee_simulation')) {
            document.getElementById('annee_simulation').value = data.annee || new Date().getFullYear();
        }
        
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
        
        // Réinitialiser les conteneurs
        window.SecurityUtils.setInnerHTML(document.getElementById('travaux-liste'), '');
        window.SecurityUtils.setInnerHTML(document.getElementById('frais-divers-liste'), '');
        window.SecurityUtils.setInnerHTML(document.getElementById('produits-accueil-liste'), '');
        travauxCounter = 0;
        fraisDiversCounter = 0;
        produitsCounter = 0;
        
        // Restaurer les travaux
        if (data.travaux_liste) {
            const travaux = Array.isArray(data.travaux_liste) ? data.travaux_liste : [];
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
            // Réinitialiser le conteneur des crédits
            const creditsContainer = document.getElementById('credits-liste');
            if (creditsContainer) {
                window.SecurityUtils.setInnerHTML(creditsContainer, '');
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
        
        
        // Recalculer
        try {
            calculerRatio();
        } catch (e) {
            console.error('❌ [LOAD] Erreur calculerRatio():', e);
        }
        
        try {
            calculerTempsReel();
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
    window.SecurityUtils.setInnerHTML(document.getElementById('travaux-liste'), '');
    window.SecurityUtils.setInnerHTML(document.getElementById('frais-divers-liste'), '');
    window.SecurityUtils.setInnerHTML(document.getElementById('produits-accueil-liste'), '');
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
    
    const form = document.getElementById('calculateur-lmp');
    if (!form) {
        console.warn('⚠️ [INIT-FISCALITE] Formulaire non trouvé, nouvelle tentative dans 500ms...');
        setTimeout(initFiscalite, 500);
        return;
    }
    
    
    // NOUVELLE APPROCHE : Délégation d'événements sur le formulaire entier
    // Cela fonctionne même pour les champs ajoutés dynamiquement !
    
    // Supprimer les anciens événements s'ils existent
    form.removeEventListener('input', handleFormInput);
    form.removeEventListener('change', handleFormChange);
    form.removeEventListener('focusout', handleFormBlur);
    
    // Ajouter les nouveaux événements avec délégation
    form.addEventListener('input', handleFormInput);
    form.addEventListener('change', handleFormChange);
    form.addEventListener('focusout', handleFormBlur);
    
    
    // Charger la liste des années disponibles
    chargerListeAnnees().then(() => {
        // Charger automatiquement la dernière simulation après avoir chargé la liste
        const anneeSelectionnee = document.getElementById('annee_selector').value;
        if (anneeSelectionnee) {
            chargerAnnee(anneeSelectionnee);
        } else {
            chargerDerniereSimulation();
        }
    });
}

// Gestionnaires d'événements avec délégation
function handleFormInput(e) {
    const target = e.target;
    if (target.type === 'number' || target.tagName === 'SELECT') {
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
    window.SecurityUtils.setInnerHTML(item, `
        <input type="text" placeholder="Description du crédit" id="credit-desc-${id}">
        <input type="number" step="0.01" placeholder="Mensualité €" id="credit-mensuel-${id}">
        <input type="number" step="0.01" placeholder="Capital restant €" id="credit-capital-${id}">
        <button type="button" onclick="supprimerCredit('credit-${id}')">×</button>
    `);
    container.appendChild(item);
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
    
    // ==================== REVENUS (tout converti en MENSUEL) ====================
    // Salaires annuels convertis en mensuels
    const salaireMadameAnnuel = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieurAnnuel = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const salaireMadameMensuel = salaireMadameAnnuel / 12;
    const salaireMonsieurMensuel = salaireMonsieurAnnuel / 12;
    
    // Revenus LMP après URSSAF (avant IR) - converti en mensuel
    // On prend le "reste avant IR" du LMP uniquement (preview-reste)
    const previewResteElement = document.getElementById('preview-reste');
    const revenuLMPAnnuel = previewResteElement && previewResteElement.textContent !== '0 €' 
        ? parseFloat(previewResteElement.textContent.replace(/[^\d.-]/g, '')) 
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
    
}

// ==========================================
// 🔍 VÉRIFICATION SAUVEGARDE
// ==========================================

async function verifierSauvegardeAnnee(annee) {
    console.log(`🔍 Vérification de la sauvegarde pour l'année ${annee}...`);
    
    try {
        const { data, error } = await supabase
            .from('simulations_fiscales')
            .select('annee, cotisations_urssaf, impot_revenu, benefice_imposable, created_at')
            .eq('annee', annee)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error) {
            console.error(`❌ Erreur vérification année ${annee}:`, error);
            return;
        }
        
        if (data) {
            console.log(`✅ Données sauvegardées pour ${annee}:`, {
                'URSSAF': data.cotisations_urssaf ? `${data.cotisations_urssaf.toFixed(2)} €` : 'Non défini',
                'Impôt Revenu': data.impot_revenu ? `${data.impot_revenu.toFixed(2)} €` : 'Non défini',
                'Bénéfice imposable': data.benefice_imposable ? `${data.benefice_imposable.toFixed(2)} €` : 'Non défini',
                'Date sauvegarde': new Date(data.created_at).toLocaleString('fr-FR')
            });
        } else {
            console.warn(`⚠️ Aucune donnée trouvée pour l'année ${annee}`);
        }
    } catch (error) {
        console.error(`💥 Exception lors de la vérification:`, error);
    }
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
window.ajouterCredit = ajouterCredit;
window.supprimerCredit = supprimerCredit;
window.calculerResteAVivre = calculerResteAVivre;

// Nouvelles fonctions pour le suivi des soldes bancaires
window.genererTableauSoldes = genererTableauSoldes;
window.chargerSoldesBancaires = chargerSoldesBancaires;
window.sauvegarderSoldesBancaires = sauvegarderSoldesBancaires;
window.afficherGraphiqueSoldes = afficherGraphiqueSoldes;

// Nouvelles fonctions pour la gestion des années fiscales
window.chargerListeAnnees = chargerListeAnnees;
window.chargerAnnee = chargerAnnee;
window.calculerCAAutomatique = calculerCAAutomatique;
window.creerNouvelleAnnee = creerNouvelleAnnee;
window.verifierSauvegardeAnnee = verifierSauvegardeAnnee;

// ==========================================
// 💰 SUIVI TRÉSORERIE MENSUELLE
// ==========================================

let chartSoldes = null; // Instance du graphique Chart.js

// Générer le tableau de saisie des soldes mensuels
function genererTableauSoldes() {
    const annee = parseInt(document.getElementById('annee_tresorerie')?.value || new Date().getFullYear());
    const tbody = document.getElementById('tbody-soldes');
    if (!tbody) return;
    
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    window.SecurityUtils.setInnerHTML(tbody, '');
    
    mois.forEach((nomMois, index) => {
        const numeroMois = index + 1;
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #ddd';
        window.SecurityUtils.setInnerHTML(row, `
            <td style="padding: 10px; font-weight: 500;">${nomMois} ${annee}</td>
            <td style="padding: 10px; text-align: center;">
                <input type="number" 
                       id="solde_m${numeroMois}" 
                       class="solde-bancaire-input"
                       step="0.01" 
                       placeholder="0.00"
                       style="width: 150px; padding: 8px; border: 2px solid #ddd; border-radius: 6px; text-align: right;">
            </td>
            <td style="padding: 10px;">
                <input type="text" 
                       id="notes_m${numeroMois}" 
                       class="notes-bancaire-input"
                       placeholder="Notes optionnelles..."
                       style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
            </td>
        `);
        tbody.appendChild(row);
    });
}

// Charger les soldes bancaires depuis Supabase
async function chargerSoldesBancaires() {
    const annee = parseInt(document.getElementById('annee_tresorerie')?.value);
    
    if (!annee || annee < 2020 || annee > 2050) {
        showToast('⚠️ Veuillez saisir une année valide (2020-2050)', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('suivi_soldes_bancaires')
            .select('*')
            .eq('annee', annee)
            .order('mois', { ascending: true });
        
        if (error) throw error;
        
        // Réinitialiser le tableau
        genererTableauSoldes();
        
        // Remplir les données
        if (data && data.length > 0) {
            data.forEach(item => {
                const soldeInput = document.getElementById(`solde_m${item.mois}`);
                const notesInput = document.getElementById(`notes_m${item.mois}`);
                if (soldeInput) soldeInput.value = item.solde || '';
                if (notesInput) notesInput.value = item.notes || '';
            });
            showToast(`📥 ${data.length} mois chargés pour ${annee}`, 'success');
        } else {
            showToast(`ℹ️ Aucune donnée pour ${annee}`, 'info');
        }
        
        // Afficher le graphique
        afficherGraphiqueSoldes();
        
    } catch (error) {
        console.error('Erreur chargement soldes:', error);
        showToast('Erreur lors du chargement', 'error');
    }
}

// Sauvegarder les soldes bancaires dans Supabase
async function sauvegarderSoldesBancaires() {
    const annee = parseInt(document.getElementById('annee_tresorerie')?.value);
    
    if (!annee || annee < 2020 || annee > 2050) {
        showToast('⚠️ Veuillez saisir une année valide (2020-2050)', 'error');
        return;
    }
    
    const soldesData = [];
    
    for (let mois = 1; mois <= 12; mois++) {
        const soldeInput = document.getElementById(`solde_m${mois}`);
        const notesInput = document.getElementById(`notes_m${mois}`);
        
        if (soldeInput && soldeInput.value) {
            soldesData.push({
                annee: annee,
                mois: mois,
                solde: parseFloat(soldeInput.value) || 0,
                notes: notesInput?.value || null
            });
        }
    }
    
    if (soldesData.length === 0) {
        showToast('⚠️ Aucune donnée à sauvegarder', 'error');
        return;
    }
    
    try {
        // Upsert (insert ou update) pour chaque mois
        const { error } = await supabase
            .from('suivi_soldes_bancaires')
            .upsert(soldesData, { 
                onConflict: 'annee,mois',
                ignoreDuplicates: false 
            });
        
        if (error) throw error;
        
        showToast(`✅ ${soldesData.length} mois sauvegardés pour ${annee}`, 'success');
        
        // Actualiser le graphique
        afficherGraphiqueSoldes();
        
    } catch (error) {
        console.error('Erreur sauvegarde soldes:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

// Afficher le graphique des soldes bancaires
async function afficherGraphiqueSoldes() {
    const canvas = document.getElementById('graphique-soldes');
    if (!canvas) return;
    
    const vueGraphique = document.querySelector('input[name="vue_graphique"]:checked')?.value || 'annee';
    const annee = parseInt(document.getElementById('annee_tresorerie')?.value || new Date().getFullYear());
    
    try {
        let query = supabase
            .from('suivi_soldes_bancaires')
            .select('*')
            .order('annee', { ascending: true })
            .order('mois', { ascending: true });
        
        if (vueGraphique === 'annee') {
            query = query.eq('annee', annee);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            // Détruire le graphique existant
            if (chartSoldes) {
                chartSoldes.destroy();
                chartSoldes = null;
            }
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        // Préparer les données pour Chart.js
        const labels = [];
        const values = [];
        const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 
                          'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        if (vueGraphique === 'annee') {
            // Vue par année : afficher les 12 mois
            for (let m = 1; m <= 12; m++) {
                const item = data.find(d => d.mois === m);
                labels.push(moisNoms[m - 1]);
                values.push(item ? item.solde : null);
            }
        } else {
            // Vue générale : afficher tous les mois de toutes les années
            data.forEach(item => {
                labels.push(`${moisNoms[item.mois - 1]} ${item.annee}`);
                values.push(item.solde);
            });
        }
        
        // Détruire l'ancien graphique s'il existe
        if (chartSoldes) {
            chartSoldes.destroy();
        }
        
        // Créer le nouveau graphique
        const ctx = canvas.getContext('2d');
        chartSoldes = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Solde bancaire (€)',
                    data: values,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: vueGraphique === 'annee' ? 
                              `Évolution trésorerie ${annee}` : 
                              'Évolution trésorerie globale',
                        font: {
                            size: 18,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y !== null ? 
                                       `${context.parsed.y.toFixed(2)} €` : 
                                       'Pas de données';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-FR') + ' €';
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Erreur affichage graphique:', error);
        showToast('Erreur lors de l\'affichage du graphique', 'error');
    }
}

// Initialisation automatique au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que le contenu de l'onglet soit potentiellement chargé
    setTimeout(initFiscalite, 1000);
    
    // Initialiser l'année pour la trésorerie
    setTimeout(() => {
        const anneeInput = document.getElementById('annee_tresorerie');
        const anneeSimulInput = document.getElementById('annee_simulation');
        const currentYear = new Date().getFullYear();
        
        if (anneeInput) {
            anneeInput.value = currentYear;
            genererTableauSoldes();
            
            // Charger les données de l'année en cours
            setTimeout(() => {
                chargerSoldesBancaires();
            }, 500);
            
            // Ajouter sauvegarde automatique sur les inputs de soldes
            setTimeout(() => {
                const tbody = document.getElementById('tbody-soldes');
                if (tbody) {
                    // Délégation d'événements pour la sauvegarde auto
                    tbody.addEventListener('input', debounce(async (e) => {
                        if (e.target.classList.contains('solde-bancaire-input') || 
                            e.target.classList.contains('notes-bancaire-input')) {
                            console.log('💾 Sauvegarde auto des soldes...');
                            await sauvegarderSoldesBancairesAuto();
                        }
                    }, 1500)); // Attendre 1.5s après la dernière saisie
                }
            }, 1200);
        }
        
        if (anneeSimulInput && !anneeSimulInput.value) {
            anneeSimulInput.value = currentYear;
        }
    }, 1100);
});

// Fonction debounce pour éviter trop de sauvegardes
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sauvegarde automatique sans toast
async function sauvegarderSoldesBancairesAuto() {
    const annee = parseInt(document.getElementById('annee_tresorerie')?.value);
    
    if (!annee || annee < 2020 || annee > 2050) return;
    
    const soldesData = [];
    
    for (let mois = 1; mois <= 12; mois++) {
        const soldeInput = document.getElementById(`solde_m${mois}`);
        const notesInput = document.getElementById(`notes_m${mois}`);
        
        if (soldeInput && soldeInput.value) {
            soldesData.push({
                annee: annee,
                mois: mois,
                solde: parseFloat(soldeInput.value) || 0,
                notes: notesInput?.value || null
            });
        }
    }
    
    if (soldesData.length === 0) return;
    
    try {
        const { error } = await supabase
            .from('suivi_soldes_bancaires')
            .upsert(soldesData, { 
                onConflict: 'annee,mois',
                ignoreDuplicates: false 
            });
        
        if (error) throw error;
        
        console.log(`✅ ${soldesData.length} mois sauvegardés automatiquement`);
        
        // Actualiser le graphique
        afficherGraphiqueSoldes();
        
    } catch (error) {
        console.error('Erreur sauvegarde auto soldes:', error);
    }
}

