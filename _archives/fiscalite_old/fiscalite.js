// ==========================================
// 💰 MODULE FISCALITÉ LMP
// ==========================================
// Calcul des charges déductibles et du bénéfice imposable

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
    
    // CHARGES BIEN LOUÉ (100%)
    const chargesBien = 
        getAnnualValue('internet_bien', 'internet_bien_type') +
        getAnnualValue('eau_bien', 'eau_bien_type') +
        getAnnualValue('electricite_bien', 'electricite_bien_type') +
        getAnnualValue('assurance_hab_bien', 'assurance_hab_bien_type') +
        getAnnualValue('assurance_emprunt_bien', 'assurance_emprunt_bien_type') +
        getAnnualValue('interets_emprunt_bien', 'interets_emprunt_bien_type') +
        getAnnualValue('menage', 'menage_type') +
        getAnnualValue('linge', 'linge_type') +
        getAnnualValue('travaux', 'travaux_type') +
        getAnnualValue('frais_divers', 'frais_divers_type') +
        getAnnualValue('logiciel', 'logiciel_type') +
        getAnnualValue('produits_accueil', 'produits_accueil_type') +
        getAnnualValue('copropriete', 'copropriete_type') +
        parseFloat(document.getElementById('taxe_fonciere').value || 0) +
        parseFloat(document.getElementById('cfe').value || 0) +
        parseFloat(document.getElementById('commissions').value || 0) +
        parseFloat(document.getElementById('amortissement').value || 0);
    
    // CHARGES RÉSIDENCE (prorata)
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
    
    // FRAIS PROFESSIONNELS (100%)
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
        const usagePro = parseFloat(document.getElementById('usage_pro_pourcent').value || 0) / 100;
        fraisVehicule = (
            getAnnualValue('carburant', 'carburant_type') +
            getAnnualValue('assurance_auto', 'assurance_auto_type') +
            parseFloat(document.getElementById('entretien_auto').value || 0) +
            parseFloat(document.getElementById('amortissement_auto').value || 0)
        ) * usagePro;
    }
    
    // TOTAUX
    const totalCharges = chargesBien + chargesResidence + fraisPro + fraisVehicule;
    const benefice = ca - totalCharges;
    
    // COTISATIONS URSSAF (sur le bénéfice)
    const cotisations = {
        maladie: 0, // Exonération jusqu'à 44 820 €
        indemnites: benefice * 0.0085,
        retraiteBase: benefice * 0.1775,
        retraiteCompl: benefice * 0.07,
        invalidite: benefice * 0.013,
        allocations: 0, // Exonération jusqu'à 44 820 €
        csgCrds: benefice * 0.097,
        formationPro: ca * 0.0025
    };
    
    const totalCotisations = Object.values(cotisations).reduce((a, b) => a + b, 0);
    const resteAvantIR = benefice - totalCotisations;
    
    // Trimestres retraite (1 trimestre = 1 690,50 € en 2024)
    const trimestres = Math.min(4, Math.floor(benefice / 1690.50));
    
    // AFFICHAGE DES RÉSULTATS
    afficherResultats({
        ca,
        chargesBien,
        chargesResidence,
        fraisPro,
        fraisVehicule,
        totalCharges,
        benefice,
        cotisations,
        totalCotisations,
        resteAvantIR,
        trimestres,
        ratio: ratio * 100
    });
}

// ==========================================
// 📊 AFFICHAGE DES RÉSULTATS
// ==========================================

function afficherResultats(data) {
    const html = `
        <div class="resultat-ligne">
            <span>Chiffre d'affaires :</span>
            <strong>${data.ca.toFixed(2)} €</strong>
        </div>
        
        <div class="resultat-section">
            <h4>💶 CHARGES DÉDUCTIBLES</h4>
            <div class="resultat-ligne">
                <span>• Charges du bien loué :</span>
                <span>${data.chargesBien.toFixed(2)} €</span>
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
                <span>• Maladie-maternité (0%) :</span>
                <span>0 €</span>
            </div>
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
                <span>• Allocations familiales (0%) :</span>
                <span>0 €</span>
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
            <div style="font-size: 1.2rem; font-weight: 600;">
                ⚠️ Trimestres retraite validés : ${data.trimestres} / 4
            </div>
            <div style="font-size: 0.9rem; margin-top: 5px;">
                (Il faut 6 762 € de bénéfice pour valider 4 trimestres en 2024)
            </div>
        </div>
    `;
    
    document.getElementById('resultats-content').innerHTML = html;
    document.getElementById('resultats-fiscalite').style.display = 'block';
    document.getElementById('resultats-fiscalite').scrollIntoView({ behavior: 'smooth' });
    
    showToast('✓ Calcul effectué avec succès', 'success');
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
        
        // Charges bien loué
        internet_bien: parseFloat(document.getElementById('internet_bien').value || 0),
        internet_bien_type: document.getElementById('internet_bien_type').value,
        eau_bien: parseFloat(document.getElementById('eau_bien').value || 0),
        eau_bien_type: document.getElementById('eau_bien_type').value,
        electricite_bien: parseFloat(document.getElementById('electricite_bien').value || 0),
        electricite_bien_type: document.getElementById('electricite_bien_type').value,
        assurance_hab_bien: parseFloat(document.getElementById('assurance_hab_bien').value || 0),
        assurance_hab_bien_type: document.getElementById('assurance_hab_bien_type').value,
        assurance_emprunt_bien: parseFloat(document.getElementById('assurance_emprunt_bien').value || 0),
        assurance_emprunt_bien_type: document.getElementById('assurance_emprunt_bien_type').value,
        interets_emprunt_bien: parseFloat(document.getElementById('interets_emprunt_bien').value || 0),
        interets_emprunt_bien_type: document.getElementById('interets_emprunt_bien_type').value,
        menage: parseFloat(document.getElementById('menage').value || 0),
        menage_type: document.getElementById('menage_type').value,
        linge: parseFloat(document.getElementById('linge').value || 0),
        linge_type: document.getElementById('linge_type').value,
        travaux: parseFloat(document.getElementById('travaux').value || 0),
        travaux_type: document.getElementById('travaux_type').value,
        frais_divers: parseFloat(document.getElementById('frais_divers').value || 0),
        frais_divers_type: document.getElementById('frais_divers_type').value,
        logiciel: parseFloat(document.getElementById('logiciel').value || 0),
        logiciel_type: document.getElementById('logiciel_type').value,
        taxe_fonciere: parseFloat(document.getElementById('taxe_fonciere').value || 0),
        cfe: parseFloat(document.getElementById('cfe').value || 0),
        commissions: parseFloat(document.getElementById('commissions').value || 0),
        amortissement: parseFloat(document.getElementById('amortissement').value || 0),
        copropriete: parseFloat(document.getElementById('copropriete').value || 0),
        copropriete_type: document.getElementById('copropriete_type').value,
        produits_accueil: parseFloat(document.getElementById('produits_accueil').value || 0),
        produits_accueil_type: document.getElementById('produits_accueil_type').value,
        
        // Résidence principale
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
        usage_pro_pourcent: parseInt(document.getElementById('usage_pro_pourcent').value || 0)
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
    try {
        const { data, error } = await supabase
            .from('simulations_fiscales')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            showToast('Aucune simulation trouvée', 'info');
            return;
        }
        
        const sim = data[0];
        
        // CA
        document.getElementById('ca').value = sim.chiffre_affaires || 0;
        
        // Charges bien loué
        document.getElementById('internet_bien').value = sim.internet_bien || 0;
        document.getElementById('internet_bien_type').value = sim.internet_bien_type || 'mensuel';
        document.getElementById('eau_bien').value = sim.eau_bien || 0;
        document.getElementById('eau_bien_type').value = sim.eau_bien_type || 'mensuel';
        document.getElementById('electricite_bien').value = sim.electricite_bien || 0;
        document.getElementById('electricite_bien_type').value = sim.electricite_bien_type || 'mensuel';
        document.getElementById('assurance_hab_bien').value = sim.assurance_hab_bien || 0;
        document.getElementById('assurance_hab_bien_type').value = sim.assurance_hab_bien_type || 'mensuel';
        document.getElementById('assurance_emprunt_bien').value = sim.assurance_emprunt_bien || 0;
        document.getElementById('assurance_emprunt_bien_type').value = sim.assurance_emprunt_bien_type || 'mensuel';
        document.getElementById('interets_emprunt_bien').value = sim.interets_emprunt_bien || 0;
        document.getElementById('interets_emprunt_bien_type').value = sim.interets_emprunt_bien_type || 'mensuel';
        document.getElementById('menage').value = sim.menage || 0;
        document.getElementById('menage_type').value = sim.menage_type || 'mensuel';
        document.getElementById('linge').value = sim.linge || 0;
        document.getElementById('linge_type').value = sim.linge_type || 'mensuel';
        document.getElementById('travaux').value = sim.travaux || 0;
        document.getElementById('travaux_type').value = sim.travaux_type || 'mensuel';
        document.getElementById('frais_divers').value = sim.frais_divers || 0;
        document.getElementById('frais_divers_type').value = sim.frais_divers_type || 'mensuel';
        document.getElementById('logiciel').value = sim.logiciel || 0;
        document.getElementById('logiciel_type').value = sim.logiciel_type || 'mensuel';
        document.getElementById('taxe_fonciere').value = sim.taxe_fonciere || 0;
        document.getElementById('cfe').value = sim.cfe || 0;
        document.getElementById('commissions').value = sim.commissions || 0;
        document.getElementById('amortissement').value = sim.amortissement || 0;
        document.getElementById('copropriete').value = sim.copropriete || 0;
        document.getElementById('copropriete_type').value = sim.copropriete_type || 'mensuel';
        document.getElementById('produits_accueil').value = sim.produits_accueil || 0;
        document.getElementById('produits_accueil_type').value = sim.produits_accueil_type || 'mensuel';
        
        // Résidence principale
        document.getElementById('surface_bureau').value = sim.surface_bureau || 0;
        document.getElementById('surface_totale').value = sim.surface_totale || 0;
        document.getElementById('interets_residence').value = sim.interets_residence || 0;
        document.getElementById('interets_residence_type').value = sim.interets_residence_type || 'mensuel';
        document.getElementById('assurance_residence').value = sim.assurance_residence || 0;
        document.getElementById('assurance_residence_type').value = sim.assurance_residence_type || 'mensuel';
        document.getElementById('electricite_residence').value = sim.electricite_residence || 0;
        document.getElementById('electricite_residence_type').value = sim.electricite_residence_type || 'mensuel';
        document.getElementById('internet_residence').value = sim.internet_residence || 0;
        document.getElementById('internet_residence_type').value = sim.internet_residence_type || 'mensuel';
        document.getElementById('eau_residence').value = sim.eau_residence || 0;
        document.getElementById('eau_residence_type').value = sim.eau_residence_type || 'mensuel';
        document.getElementById('assurance_hab_residence').value = sim.assurance_hab_residence || 0;
        document.getElementById('assurance_hab_residence_type').value = sim.assurance_hab_residence_type || 'mensuel';
        document.getElementById('taxe_fonciere_residence').value = sim.taxe_fonciere_residence || 0;
        
        // Frais professionnels
        document.getElementById('comptable').value = sim.comptable || 0;
        document.getElementById('frais_bancaires').value = sim.frais_bancaires || 0;
        document.getElementById('telephone').value = sim.telephone || 0;
        document.getElementById('telephone_type').value = sim.telephone_type || 'mensuel';
        document.getElementById('materiel_info').value = sim.materiel_info || 0;
        document.getElementById('rc_pro').value = sim.rc_pro || 0;
        document.getElementById('formation').value = sim.formation || 0;
        document.getElementById('fournitures').value = sim.fournitures || 0;
        document.getElementById('fournitures_type').value = sim.fournitures_type || 'mensuel';
        
        // Véhicule
        const vehiculeOption = sim.vehicule_option || 'bareme';
        document.querySelector(`input[name="vehicule_option"][value="${vehiculeOption}"]`).checked = true;
        toggleVehiculeOption();
        document.getElementById('puissance_fiscale').value = sim.puissance_fiscale || 5;
        document.getElementById('km_professionnels').value = sim.km_professionnels || 0;
        document.getElementById('carburant').value = sim.carburant || 0;
        document.getElementById('carburant_type').value = sim.carburant_type || 'mensuel';
        document.getElementById('assurance_auto').value = sim.assurance_auto || 0;
        document.getElementById('assurance_auto_type').value = sim.assurance_auto_type || 'mensuel';
        document.getElementById('entretien_auto').value = sim.entretien_auto || 0;
        document.getElementById('amortissement_auto').value = sim.amortissement_auto || 0;
        document.getElementById('usage_pro_pourcent').value = sim.usage_pro_pourcent || 0;
        
        calculerRatio();
        showToast(`✓ Simulation "${sim.nom_simulation}" chargée`, 'success');
    } catch (error) {
        console.error('Erreur chargement:', error);
        showToast('Erreur lors du chargement', 'error');
    }
}

function nouvelleSimulation() {
    document.getElementById('calculateur-lmp').reset();
    document.getElementById('resultats-fiscalite').style.display = 'none';
    calculerRatio();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 📄 EXPORT PDF
// ==========================================

function exporterPDF() {
    showToast('Fonction PDF en cours de développement', 'info');
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.calculerFiscalite = calculerFiscalite;
window.calculerRatio = calculerRatio;
window.toggleVehiculeOption = toggleVehiculeOption;
window.sauvegarderSimulation = sauvegarderSimulation;
window.chargerDerniereSimulation = chargerDerniereSimulation;
window.nouvelleSimulation = nouvelleSimulation;
window.exporterPDF = exporterPDF;
