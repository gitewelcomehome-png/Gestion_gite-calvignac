// ==========================================
// 💰 MODULE FISCALITÉ LMP - VERSION 2 BIENS
// ==========================================

// Compteurs pour IDs uniques des listes
let travauxCounter = 0;
let fraisDiversCounter = 0;
let produitsCounter = 0;

// Debounce pour éviter trop de calculs
let calculTempsReelTimeout = null;

// ==========================================
// 🔧 CALCUL EN TEMPS RÉEL
// ==========================================

// Fonction pour toggler les blocs collapsibles
function toggleBloc(titleElement) {
    const bloc = titleElement.closest('.fiscal-bloc');
    if (bloc) {
        bloc.classList.toggle('collapsed');
    }
}

function calculerTempsReel() {
    clearTimeout(calculTempsReelTimeout);
    calculTempsReelTimeout = setTimeout(() => {
        const ca = parseFloat(document.getElementById('ca')?.value || 0);
        if (ca === 0) return;
        
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
        
        // Cotisations URSSAF
        const urssaf = benefice * 0.367 + ca * 0.0025; // Simplifié
        const resteAvantIR = benefice - urssaf;
        
        // Affichage
        document.getElementById('estimation-urssaf').style.display = 'block';
        document.getElementById('preview-benefice').textContent = benefice.toFixed(2) + ' €';
        document.getElementById('preview-urssaf').textContent = urssaf.toFixed(2) + ' €';
        document.getElementById('preview-reste').textContent = resteAvantIR.toFixed(2) + ' €';
        
        // Alerte retraite
        const alerteRetraite = document.getElementById('alerte-retraite');
        if (benefice < 7046) {
            alerteRetraite.style.display = 'block';
        } else {
            alerteRetraite.style.display = 'none';
        }
        
        // Mise à jour du revenu LMP pour l'IR
        document.getElementById('revenu_lmp').value = resteAvantIR.toFixed(2);
        calculerIR();
        
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
    const salaireMadame = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieur = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const revenuLMP = parseFloat(document.getElementById('revenu_lmp')?.value || 0);
    const nbEnfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
    
    // Revenu imposable total
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
}

// Attacher les événements de calcul en temps réel
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="number"], select');
    inputs.forEach(input => {
        input.addEventListener('input', calculerTempsReel);
        input.addEventListener('change', calculerTempsReel);
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
}

function supprimerItem(itemId) {
    const item = document.getElementById(itemId);
    if (item) item.remove();
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
    const surfaceBureau = parseFloat(document.getElementById('surface_bureau').value || 0);
    const surfaceTotale = parseFloat(document.getElementById('surface_totale').value || 0);
    
    if (surfaceTotale === 0) {
        document.getElementById('ratio-display').textContent = 'Ratio : 0%';
        return 0;
    }
    
    if (surfaceBureau > surfaceTotale) {
        showToast('⚠️ La surface du bureau ne peut pas dépasser la surface totale', 'error');
        return 0;
    }
    
    const ratio = (surfaceBureau / surfaceTotale) * 100;
    document.getElementById('ratio-display').textContent = `Ratio : ${ratio.toFixed(2)}%`;
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

async function sauvegarderSimulation() {
    const nom = prompt('Nom de la simulation :');
    if (!nom) return;
    
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
        
        // Listes
        travaux_liste: JSON.stringify(getTravauxListe()),
        frais_divers_liste: JSON.stringify(getFraisDiversListe()),
        produits_accueil_liste: JSON.stringify(getProduitsAccueilListe()),
        
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
        vehicule_option: document.querySelector('input[name="vehicule_option"]:checked').value,
        puissance_fiscale: parseInt(document.getElementById('puissance_fiscale').value || 5),
        km_professionnels: parseInt(document.getElementById('km_professionnels').value || 0),
        carburant: parseFloat(document.getElementById('carburant').value || 0),
        carburant_type: document.getElementById('carburant_type').value,
        assurance_auto: parseFloat(document.getElementById('assurance_auto').value || 0),
        assurance_auto_type: document.getElementById('assurance_auto_type').value,
        entretien_auto: parseFloat(document.getElementById('entretien_auto').value || 0),
        amortissement_auto: parseFloat(document.getElementById('amortissement_auto').value || 0),
        usage_pro_pourcent: parseInt(document.getElementById('usage_pro_pourcent').value || 0),
        
        // IR
        salaire_madame: parseFloat(document.getElementById('salaire_madame').value || 0),
        salaire_monsieur: parseFloat(document.getElementById('salaire_monsieur').value || 0),
        nombre_enfants: parseInt(document.getElementById('nombre_enfants').value || 0)
    };
    
    try {
        const { error } = await supabase
            .from('simulations_fiscales')
            .insert(data);
        
        if (error) throw error;
        showToast('✓ Simulation sauvegardée', 'success');
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

async function chargerDerniereSimulation() {
    showToast('Fonction de chargement en cours de développement', 'info');
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
window.toggleVehiculeOption = toggleVehiculeOption;
window.sauvegarderSimulation = sauvegarderSimulation;
window.chargerDerniereSimulation = chargerDerniereSimulation;
window.nouvelleSimulation = nouvelleSimulation;
window.exporterPDF = exporterPDF;

