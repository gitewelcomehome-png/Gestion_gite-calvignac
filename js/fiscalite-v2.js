// ==========================================
// 💰 MODULE FISCALITÉ LMP - VERSION 2 BIENS
// ==========================================

// ==========================================
// VARIABLES GLOBALES (doivent être déclarées en premier)
// ==========================================

// Tableaux pour les crédits et la gestion des km
let creditsPersonnels = [];
let configKm = null;
let trajetsKm = [];
let lieuxFavoris = [];

/**
 * Mettre à jour l'affichage du CA dans le bloc visuel
 */
function mettreAJourAffichageCA(valeur) {
    const caInput = document.getElementById('ca');
    const caDisplay = document.getElementById('ca-display');
    
    if (caInput) {
        caInput.value = valeur;
    }
    
    if (caDisplay) {
        const valeurNum = parseFloat(valeur) || 0;
        caDisplay.textContent = valeurNum.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' €';
    }
}

// Liste des charges par bien
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

// Compteurs pour IDs uniques des listes
let travauxCounter = 0;
let fraisDiversCounter = 0;
let produitsCounter = 0;
let creditsCounter = 0;

// Debounce pour éviter trop de calculs
let calculTempsReelTimeout = null;
let lastSavedData = null; // Pour éviter les sauvegardes en double

// ==========================================
// � RÈGLES D'AMORTISSEMENT (Législation française LMNP)
// ==========================================

const REGLES_AMORTISSEMENT = {
    // Seuil minimum pour amortir (< 600€ HT = déductible immédiatement)
    SEUIL_AMORTISSEMENT_HT: 600,
    SEUIL_AMORTISSEMENT_TTC: 720, // avec TVA 20%
    
    // Catégories et durées d'amortissement
    categories: [
        {
            id: 'informatique',
            keywords: ['ordinateur', 'portable', 'pc', 'laptop', 'tablette', 'ipad', 'macbook', 'imac', 'smartphone', 'iphone', 'android', 'mobile', 'téléphone', 'tel', 'serveur', 'nas', 'écran', 'moniteur', 'clavier', 'souris'],
            duree: 3,
            label: 'Matériel informatique'
        },
        {
            id: 'electromenager',
            keywords: ['lave-linge', 'lave-vaisselle', 'réfrigérateur', 'frigo', 'congélateur', 'four', 'micro-ondes', 'aspirateur', 'climatisation', 'clim', 'radiateur', 'chauffage'],
            duree: 5,
            label: 'Électroménager'
        },
        {
            id: 'mobilier',
            keywords: ['canapé', 'lit', 'matelas', 'armoire', 'table', 'chaise', 'meuble', 'bureau', 'étagère', 'bibliothèque', 'commode'],
            duree: 10,
            label: 'Mobilier'
        },
        {
            id: 'equipement',
            keywords: ['tv', 'télévision', 'sono', 'hifi', 'enceinte', 'projecteur'],
            duree: 5,
            label: 'Équipements audiovisuels'
        },
        {
            id: 'renovation_legere',
            keywords: ['peinture', 'parquet', 'carrelage', 'plomberie', 'électricité', 'menuiserie', 'fenêtre', 'porte', 'salle de bain', 'cuisine'],
            duree: 10,
            label: 'Rénovation/Aménagement'
        },
        {
            id: 'gros_travaux',
            keywords: ['toiture', 'charpente', 'façade', 'isolation', 'extension', 'agrandissement', 'restructuration', 'ravalement'],
            duree: 20,
            label: 'Gros travaux'
        }
    ],
    
    // Catégorie par défaut
    defaut: {
        duree: 5,
        label: 'Dépense amortissable'
    }
};

/**
 * Génère les options HTML pour le select de type d'amortissement
 * @returns {string} - Options HTML
 */
function genererOptionsTypeAmortissement() {
    let html = '<option value="">Dépense courante (non amortissable)</option>';
    REGLES_AMORTISSEMENT.categories.forEach(cat => {
        html += `<option value="${cat.id}">${cat.label} (${cat.duree} ans)</option>`;
    });
    html += `<option value="autre">Autre (${REGLES_AMORTISSEMENT.defaut.duree} ans)</option>`;
    return html;
}

/**
 * Détecte si une dépense doit être amortie et sur combien d'années
 * @param {string} description - Description de la dépense
 * @param {number} montant - Montant TTC de la dépense
 * @param {string} typeChoisi - Type choisi manuellement (optionnel)
 * @returns {Object|null} - {duree, label, anneeFin} ou null si pas d'amortissement
 */
function detecterAmortissement(description, montant, typeChoisi = null) {
    // Vérifier le seuil
    if (montant < REGLES_AMORTISSEMENT.SEUIL_AMORTISSEMENT_TTC) {
        return null;
    }
    
    const anneeActuelle = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    
    // Si un type est choisi manuellement, l'utiliser en priorité
    if (typeChoisi && typeChoisi !== '') {
        if (typeChoisi === 'autre') {
            return {
                duree: REGLES_AMORTISSEMENT.defaut.duree,
                label: REGLES_AMORTISSEMENT.defaut.label,
                anneeFin: anneeActuelle + REGLES_AMORTISSEMENT.defaut.duree - 1,
                montantAnnuel: (montant / REGLES_AMORTISSEMENT.defaut.duree).toFixed(2)
            };
        }
        
        const categorieChoisie = REGLES_AMORTISSEMENT.categories.find(c => c.id === typeChoisi);
        if (categorieChoisie) {
            return {
                duree: categorieChoisie.duree,
                label: categorieChoisie.label,
                anneeFin: anneeActuelle + categorieChoisie.duree - 1,
                montantAnnuel: (montant / categorieChoisie.duree).toFixed(2)
            };
        }
    }
    
    const descLower = description.toLowerCase();
    
    // Chercher la catégorie correspondante par mots-clés
    for (const cat of REGLES_AMORTISSEMENT.categories) {
        for (const keyword of cat.keywords) {
            if (descLower.includes(keyword)) {
                return {
                    duree: cat.duree,
                    label: cat.label,
                    anneeFin: anneeActuelle + cat.duree - 1,
                    montantAnnuel: (montant / cat.duree).toFixed(2)
                };
            }
        }
    }
    
    // Si aucune catégorie trouvée mais montant > seuil, utiliser la règle par défaut
    return {
        duree: REGLES_AMORTISSEMENT.defaut.duree,
        label: REGLES_AMORTISSEMENT.defaut.label,
        anneeFin: anneeActuelle + REGLES_AMORTISSEMENT.defaut.duree - 1,
        montantAnnuel: (montant / REGLES_AMORTISSEMENT.defaut.duree).toFixed(2)
    };
}

// ==========================================
// �🔧 CALCUL EN TEMPS RÉEL + SAUVEGARDE AUTO
// ==========================================

// Fonction helper pour afficher les messages
function afficherMessage(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Fallback sur console si showNotification n'existe pas
        const logFn = type === 'error' ? console.error : console.log;
        logFn(message);
    }
}

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
    sauvegarderDonneesFiscales(true); // true = mode silencieux
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
        
        // Calcul des charges de tous les gîtes dynamiquement
        const gites = window.GITES_DATA || [];
        let chargesBiens = 0;
        gites.forEach(gite => {
            const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            chargesBiens += calculerChargesBien(giteSlug);
        });
        
        const travaux = getTravauxListe().reduce((sum, item) => sum + item.montant, 0);
        const fraisDivers = getFraisDiversListe().reduce((sum, item) => sum + item.montant, 0);
        const produitsAccueil = getProduitsAccueilListe().reduce((sum, item) => sum + item.montant, 0);
        
        chargesBiens += travaux + fraisDivers + produitsAccueil;
        
        const ratio = calculerRatio();
        const chargesResidence = calculerChargesResidence() * ratio;
        const fraisPro = calculerFraisProfessionnels();
        const fraisVehicule = calculerFraisVehicule();
        
        const totalCharges = chargesBiens + chargesResidence + fraisPro + fraisVehicule;
        const benefice = ca - totalCharges;
        
        // ==========================================
        // CALCUL URSSAF avec TAUX CONFIGURABLES
        // ==========================================
        const annee = new Date().getFullYear();
        const config = window.TAUX_FISCAUX.getConfig(annee);
        
        // Détail des cotisations URSSAF (calculées UNIQUEMENT si bénéfice > 0)
        let indemnites = 0;
        let retraiteBase = 0;
        let retraiteCompl = 0;
        let invalidite = 0;
        let csgCrds = 0;
        let formationPro = 0;
        let allocations = 0;
        
        // Calculer cotisations uniquement si bénéfice positif
        if (benefice > 0) {
            const urssafConfig = config.URSSAF;
            
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
                const baseAF = Math.min(benefice - af.seuil_debut, af.seuil_fin - af.seuil_debut);
                const tauxAF = (baseAF / (af.seuil_fin - af.seuil_debut)) * af.taux_max;
                allocations = benefice * tauxAF;
            }
        }
        
        // TOTAL URSSAF = somme des cotisations (0.85% + 17.75% + 7% + 1.3% + 9.7% + 0.25% + AF progressif)
        let urssaf = indemnites + retraiteBase + retraiteCompl + invalidite + csgCrds + formationPro + allocations;
        
        // ⚠️ PAS DE MINIMUM pour LMP au réel (cotisations minimales = uniquement micro-entrepreneurs)
        // Note: Supprimer minimum 1200€ qui ne s'applique pas au régime réel
        
        const resteAvantIR = benefice - urssaf;
        
        // Calcul des trimestres de retraite (basé sur 600 × SMIC horaire)
        const retraite = config.RETRAITE;
        let trimestres = 0;
        if (benefice >= retraite.trimestre_4) trimestres = 4;
        else if (benefice >= retraite.trimestre_3) trimestres = 3;
        else if (benefice >= retraite.trimestre_2) trimestres = 2;
        else if (benefice >= retraite.trimestre_1) trimestres = 1;
        
        // Affichage résultats principaux
        document.getElementById('preview-benefice').textContent = benefice.toFixed(2) + ' €';
        document.getElementById('preview-urssaf').textContent = urssaf.toFixed(2) + ' €';
        document.getElementById('preview-reste').textContent = resteAvantIR.toFixed(2) + ' €';
        
        // Affichage détails URSSAF (composantes détaillées)
        document.getElementById('detail-indemnites').textContent = indemnites.toFixed(2) + ' €';
        document.getElementById('detail-retraite-base').textContent = retraiteBase.toFixed(2) + ' €';
        document.getElementById('detail-retraite-compl').textContent = retraiteCompl.toFixed(2) + ' €';
        document.getElementById('detail-invalidite').textContent = invalidite.toFixed(2) + ' €';
        document.getElementById('detail-csg-crds').textContent = csgCrds.toFixed(2) + ' €';
        document.getElementById('detail-formation-pro').textContent = formationPro.toFixed(2) + ' €';
        document.getElementById('detail-allocations').textContent = allocations.toFixed(2) + ' €';
        document.getElementById('detail-total-urssaf').textContent = urssaf.toFixed(2) + ' €';
        document.getElementById('detail-trimestres').textContent = trimestres;
        
        // Affichage total des charges (dynamique par gîte)
        gites.forEach(gite => {
            const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const el = document.getElementById(`total-charges-${giteSlug}`);
            if (el) {
                const charges = calculerChargesBien(giteSlug);
                el.textContent = charges.toFixed(2) + ' €';
            }
        });
        
        // Autres totaux
        const elChargesResidence = document.getElementById('total-charges-residence');
        if (elChargesResidence) elChargesResidence.textContent = chargesResidence.toFixed(2) + ' €';
        
        const elFraisPro = document.getElementById('total-frais-pro');
        if (elFraisPro) elFraisPro.textContent = fraisPro.toFixed(2) + ' €';
        
        const elFraisVehicule = document.getElementById('total-frais-vehicule');
        if (elFraisVehicule) elFraisVehicule.textContent = fraisVehicule.toFixed(2) + ' €';
        
        const elTravaux = document.getElementById('total-travaux');
        if (elTravaux) elTravaux.textContent = travaux.toFixed(2) + ' €';
        
        const elFraisDivers = document.getElementById('total-frais-divers');
        if (elFraisDivers) elFraisDivers.textContent = fraisDivers.toFixed(2) + ' €';
        
        const elProduitsAccueil = document.getElementById('total-produits-accueil');
        if (elProduitsAccueil) elProduitsAccueil.textContent = produitsAccueil.toFixed(2) + ' €';
        
        const elTotalCharges = document.getElementById('total-charges-annuelles');
        if (elTotalCharges) elTotalCharges.textContent = totalCharges.toFixed(2) + ' €';
        
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
                sauvegarderDonneesFiscales(true); // true = mode silencieux
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

// ==========================================
// MODAL FRAIS RÉELS IMPÔTS - SYSTÈME INDIVIDUEL PAR PERSONNE
// ==========================================

// Variables globales pour stocker les frais réels par personne
window.fraisMadameData = { option: 'forfaitaire', km: 0, cv: 5, peages: 0, montant: 0 };
window.fraisMonsieurData = { option: 'forfaitaire', km: 0, cv: 5, peages: 0, montant: 0 };
window.fraisPersonneCourante = null;

// Ouvrir la modal pour une personne spécifique
function openFraisReelsSalarieModal(personne) {
    window.fraisPersonneCourante = personne;
    const modal = document.getElementById('modal-frais-salarie');
    const titre = document.getElementById('titre-personne-modal');
    
    // Charger les données existantes
    const data = personne === 'madame' ? window.fraisMadameData : window.fraisMonsieurData;
    
    // Mettre à jour le titre
    titre.textContent = personne === 'madame' ? 'Madame' : 'Monsieur';
    
    // Restaurer les valeurs
    document.querySelector(`input[name="option_frais_salarie"][value="${data.option}"]`).checked = true;
    document.getElementById('km_salarie_modal').value = data.km || 0;
    document.getElementById('cv_salarie_modal').value = data.cv || 5;
    document.getElementById('peages_salarie_modal').value = data.peages || 0;
    
    // Afficher/masquer les champs selon l'option
    toggleOptionFraisSalarie(data.option);
    
    // Calculer et afficher le total
    calculerFraisSalarieModal();
    
    modal.style.display = 'flex';
}

// Basculer entre forfaitaire et réel
function toggleOptionFraisSalarie(option) {
    const fieldsReel = document.getElementById('fields-frais-reel-modal');
    if (option === 'reel') {
        fieldsReel.style.display = 'block';
    } else {
        fieldsReel.style.display = 'none';
    }
    calculerFraisSalarieModal();
}

// Calculer le montant des frais réels dans la modal
function calculerFraisSalarieModal() {
    const option = document.querySelector('input[name="option_frais_salarie"]:checked').value;
    const totalEl = document.getElementById('total-frais-salarie-modal');
    
    if (option === 'forfaitaire') {
        totalEl.textContent = 'Abattement de 10% appliqué automatiquement';
        return;
    }
    
    // Calcul frais réels
    const km = parseFloat(document.getElementById('km_salarie_modal').value || 0);
    const cv = parseInt(document.getElementById('cv_salarie_modal').value || 5);
    const peages = parseFloat(document.getElementById('peages_salarie_modal').value || 0);
    
    // Barème kilométrique 2026
    const bareme = {
        3: 0.529,
        4: 0.606,
        5: 0.636,
        6: 0.665,
        7: 0.697
    };
    
    const tauxKm = bareme[cv] || (cv >= 7 ? 0.697 : 0.529);
    const fraisKm = km * tauxKm;
    const total = fraisKm + peages;
    
    totalEl.textContent = `Total déductible : ${total.toFixed(2)} €`;
}

// Fermer la modal sans sauvegarder
function closeFraisReelsSalarieModal() {
    document.getElementById('modal-frais-salarie').style.display = 'none';
    window.fraisPersonneCourante = null;
}

// Valider et sauvegarder les frais de la personne
function validerFraisSalarie() {
    const personne = window.fraisPersonneCourante;
    if (!personne) return;
    
    const option = document.querySelector('input[name="option_frais_salarie"]:checked').value;
    const km = parseFloat(document.getElementById('km_salarie_modal').value || 0);
    const cv = parseInt(document.getElementById('cv_salarie_modal').value || 5);
    const peages = parseFloat(document.getElementById('peages_salarie_modal').value || 0);
    
    // Calculer le montant
    let montant = 0;
    if (option === 'reel') {
        const bareme = { 3: 0.529, 4: 0.606, 5: 0.636, 6: 0.665, 7: 0.697 };
        const tauxKm = bareme[cv] || (cv >= 7 ? 0.697 : 0.529);
        montant = (km * tauxKm) + peages;
    }
    
    // Sauvegarder dans la variable globale
    const data = { option, km, cv, peages, montant };
    if (personne === 'madame') {
        window.fraisMadameData = data;
    } else {
        window.fraisMonsieurData = data;
    }
    
    // Mettre à jour l'affichage du résumé
    const infoDiv = document.getElementById(`frais-${personne}-info`);
    if (option === 'forfaitaire') {
        infoDiv.textContent = '10% forfaitaire';
    } else {
        infoDiv.textContent = `Frais réels : ${montant.toFixed(2)} €`;
    }
    infoDiv.style.display = 'block';
    
    // Fermer la modal
    closeFraisReelsSalarieModal();
    
    // Recalculer l'IR
    calculerIR();
}

function calculerIR() {
    const salaireMadameBrut = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieurBrut = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const revenuLMP = parseFloat(document.getElementById('revenu_lmp')?.value || 0);
    const nbEnfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
    
    // Récupérer la config fiscale pour l'année en cours
    const annee = new Date().getFullYear();
    const config = window.TAUX_FISCAUX.getConfig(annee);
    
    // Récupérer les données de frais individuelles
    const fraisMadame = window.fraisMadameData || { option: 'forfaitaire', montant: 0 };
    const fraisMonsieur = window.fraisMonsieurData || { option: 'forfaitaire', montant: 0 };
    
    let abattementMadame = 0;
    let abattementMonsieur = 0;
    
    // Calcul abattement Madame
    if (fraisMadame.option === 'reel') {
        abattementMadame = fraisMadame.montant;
    } else {
        const abat = config.ABATTEMENT_SALAIRE;
        abattementMadame = salaireMadameBrut * abat.taux;
        abattementMadame = Math.max(abat.minimum, Math.min(abattementMadame, abat.maximum));
    }
    
    // Calcul abattement Monsieur
    if (fraisMonsieur.option === 'reel') {
        abattementMonsieur = fraisMonsieur.montant;
    } else {
        const abat = config.ABATTEMENT_SALAIRE;
        abattementMonsieur = salaireMonsieurBrut * abat.taux;
        abattementMonsieur = Math.max(abat.minimum, Math.min(abattementMonsieur, abat.maximum));
    }
    
    const salaireMadame = salaireMadameBrut - abattementMadame;
    const salaireMonsieur = salaireMonsieurBrut - abattementMonsieur;
    
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
    
    // Barème progressif IR (adaptatif selon l'année)
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
    
    // Restaurer l'état de la section personnelle depuis localStorage
    restaurerOptionsPersonnelles();
    
    // 🔄 Initialiser la synchronisation résidence → frais personnels
    if (typeof initSyncResidenceToFraisPerso === 'function') {
        initSyncResidenceToFraisPerso();
    }
});

// ==========================================
// 🔧 GESTION DES LISTES DYNAMIQUES
// ==========================================

// Générer les options de gîtes dynamiquement
function genererOptionsGites() {
    let options = '';
    if (window.GITES_DATA && window.GITES_DATA.length > 0) {
        window.GITES_DATA.forEach(gite => {
            const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            options += `<option value="${slug}">${gite.name}</option>`;
        });
    }
    options += '<option value="commun">Commun</option>';
    return options;
}

function ajouterTravaux() {
    const id = ++travauxCounter;
    const container = document.getElementById('travaux-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `travaux-${id}`;
    window.SecurityUtils.setInnerHTML(item, `
        <input type="text" placeholder="Description" id="travaux-desc-${id}" oninput="verifierAmortissement('travaux', ${id})">
        <select id="travaux-type-${id}" onchange="verifierAmortissement('travaux', ${id})" title="Type d'amortissement">
            ${genererOptionsTypeAmortissement()}
        </select>
        <select id="travaux-gite-${id}">
            ${genererOptionsGites()}
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="travaux-montant-${id}" oninput="verifierAmortissement('travaux', ${id})">
        <div class="item-actions">
            <button type="button" class="btn-edit" onclick="toggleEdit('travaux-${id}')" title="Valider">✓</button>
            <button type="button" class="btn-delete" onclick="supprimerItem('travaux-${id}')">×</button>
        </div>
        <div id="travaux-amortissement-${id}" class="amortissement-info" style="display: none;"></div>
    `);
    container.appendChild(item);
    // Mettre le focus sur le premier champ
    const btnEdit = item.querySelector('.btn-edit');
    if (btnEdit) {
        btnEdit.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
    }
    document.getElementById(`travaux-desc-${id}`).focus();
}

function ajouterFraisDivers() {
    const id = ++fraisDiversCounter;
    const container = document.getElementById('frais-divers-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `frais-${id}`;
    window.SecurityUtils.setInnerHTML(item, `
        <input type="text" placeholder="Description" id="frais-desc-${id}" oninput="verifierAmortissement('frais', ${id})">
        <select id="frais-type-${id}" onchange="verifierAmortissement('frais', ${id})" title="Type d'amortissement">
            ${genererOptionsTypeAmortissement()}
        </select>
        <select id="frais-gite-${id}">
            ${genererOptionsGites()}
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="frais-montant-${id}" oninput="verifierAmortissement('frais', ${id})">
        <div class="item-actions">
            <button type="button" class="btn-edit" onclick="toggleEdit('frais-${id}')" title="Valider">✓</button>
            <button type="button" class="btn-delete" onclick="supprimerItem('frais-${id}')">×</button>
        </div>
        <div id="frais-amortissement-${id}" class="amortissement-info" style="display: none;"></div>
    `);
    container.appendChild(item);
    // Mettre le focus sur le premier champ
    const btnEdit = item.querySelector('.btn-edit');
    if (btnEdit) {
        btnEdit.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
    }
    document.getElementById(`frais-desc-${id}`).focus();
}

function ajouterProduitAccueil() {
    const id = ++produitsCounter;
    const container = document.getElementById('produits-accueil-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `produits-${id}`;
    window.SecurityUtils.setInnerHTML(item, `
        <input type="text" placeholder="Description" id="produits-desc-${id}" oninput="verifierAmortissement('produits', ${id})">
        <select id="produits-type-${id}" onchange="verifierAmortissement('produits', ${id})" title="Type d'amortissement">
            ${genererOptionsTypeAmortissement()}
        </select>
        <select id="produits-gite-${id}">
            ${genererOptionsGites()}
        </select>
        <input type="number" step="0.01" placeholder="Montant €" id="produits-montant-${id}" oninput="verifierAmortissement('produits', ${id})">
        <div class="item-actions">
            <button type="button" class="btn-edit" onclick="toggleEdit('produits-${id}')" title="Valider">✓</button>
            <button type="button" class="btn-delete" onclick="supprimerItem('produits-${id}')">×</button>
        </div>
        <div id="produits-amortissement-${id}" class="amortissement-info" style="display: none;"></div>
    `);
    container.appendChild(item);
    // Mettre le focus sur le premier champ
    const btnEdit = item.querySelector('.btn-edit');
    if (btnEdit) {
        btnEdit.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
    }
    document.getElementById(`produits-desc-${id}`).focus();
    // Ajouter les événements pour la sauvegarde automatique
    const inputs = item.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('blur', sauvegardeAutomatique);
    });
}

function toggleEdit(itemId) {
    const item = document.getElementById(itemId);
    if (!item) return;
    
    const inputs = item.querySelectorAll('input');
    const select = item.querySelector('select');
    const btnEdit = item.querySelector('.btn-edit');
    
    const isReadonly = inputs[0].hasAttribute('readonly');
    
    if (isReadonly) {
        // Activer l'édition
        inputs.forEach(input => input.removeAttribute('readonly'));
        if (select) select.removeAttribute('disabled');
        btnEdit.textContent = '✓';
        btnEdit.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
        btnEdit.title = 'Valider';
        inputs[0].focus();
    } else {
        // Désactiver l'édition
        const desc = inputs[0]?.value || '';
        const gite = select?.value || '';
        const montant = parseFloat(inputs[1]?.value) || 0;
        
        inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
        if (select) select.setAttribute('disabled', 'disabled');
        btnEdit.textContent = '✏️';
        btnEdit.style.background = '';
        btnEdit.title = 'Modifier';
        
        // Vérifier si c'est une dépense amortissable et créer les lignes futures
        const type = itemId.startsWith('travaux-') ? 'travaux' : 
                     (itemId.startsWith('frais-') ? 'frais' : 
                     (itemId.startsWith('produits-') ? 'produits' : null));
        if (type) {
            const id = itemId.split('-')[1];
            const infoEl = document.getElementById(`${type}-amortissement-${id}`);
            
            if (infoEl && infoEl.dataset.amortissement) {
                const amortissement = JSON.parse(infoEl.dataset.amortissement);
                const data = {
                    description: desc,
                    gite: gite,
                    montant: montant
                };
                
                // Créer les lignes d'amortissement pour les années futures
                creerLignesAmortissementFutures(type, data, amortissement);
            }
        }
        
        // Sauvegarder en mode silencieux pour éviter le double toast
        sauvegarderDonneesFiscales(true);
    }
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
            const typeEl = document.getElementById(`travaux-type-${i}`);
            const item = {
                description: desc.value,
                gite: document.getElementById(`travaux-gite-${i}`).value,
                montant: parseFloat(document.getElementById(`travaux-montant-${i}`).value || 0),
                type_amortissement: typeEl ? typeEl.value : ''
            };
            items.push(item);
        }
    }
    return items;
}

function getFraisDiversListe() {
    const items = [];
    for (let i = 1; i <= fraisDiversCounter; i++) {
        const desc = document.getElementById(`frais-desc-${i}`);
        if (desc) {
            const typeEl = document.getElementById(`frais-type-${i}`);
            items.push({
                description: desc.value,
                gite: document.getElementById(`frais-gite-${i}`).value,
                montant: parseFloat(document.getElementById(`frais-montant-${i}`).value || 0),
                type_amortissement: typeEl ? typeEl.value : ''
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
            const typeEl = document.getElementById(`produits-type-${i}`);
            items.push({
                description: desc.value,
                gite: document.getElementById(`produits-gite-${i}`).value,
                montant: parseFloat(document.getElementById(`produits-montant-${i}`).value || 0),
                type_amortissement: typeEl ? typeEl.value : ''
            });
        }
    }
    return items;
}

// ==========================================
// 🔧 UTILITAIRES
// ==========================================

function getAnnualValue(fieldId, typeFieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return 0;
    
    const value = parseFloat(field.value || 0);
    
    // Essayer d'abord de récupérer le type depuis l'élément typeFieldId
    const typeField = document.getElementById(typeFieldId);
    let type = typeField?.value;
    
    // Si pas trouvé, utiliser data-period-type de l'input lui-même
    if (!type) {
        type = field.getAttribute('data-period-type') || 'annuel';
    }
    
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
// 📊 BARÈME KILOMÉTRIQUE (adaptatif selon l'année)
// ==========================================

function calculerBaremeKilometrique(puissance, km) {
    const annee = new Date().getFullYear();
    const config = window.TAUX_FISCAUX.getConfig(annee);
    const baremes = config.BAREME_KM;
    
    // Si puissance non trouvée, utiliser 5 CV par défaut
    const bareme = baremes[puissance] || baremes[5];
    if (!bareme) return 0;
    
    const tranche = bareme.find(t => km <= t.max);
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
    
    // CHARGES PAR GÎTE (dynamique)
    const gites = window.GITES_DATA || [];
    let chargesBiens = 0;
    const chargesParGite = {};
    
    gites.forEach(gite => {
        const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const charges = calculerChargesBien(giteSlug);
        chargesParGite[gite.name] = charges;
        chargesBiens += charges;
    });
    
    // LISTES (Travaux, Frais divers, Produits)
    const travaux = getTravauxListe().reduce((sum, item) => sum + item.montant, 0);
    const fraisDivers = getFraisDiversListe().reduce((sum, item) => sum + item.montant, 0);
    const produitsAccueil = getProduitsAccueilListe().reduce((sum, item) => sum + item.montant, 0);
    
    chargesBiens += travaux + fraisDivers + produitsAccueil;
    
    // FRAIS PROFESSIONNELS
    const fraisPro = 
        parseFloat(document.getElementById('comptable').value || 0) +
        parseFloat(document.getElementById('frais_bancaires').value || 0) +
        getAnnualValue('telephone', 'telephone_type') +
        parseFloat(document.getElementById('materiel_info').value || 0) +
        parseFloat(document.getElementById('rc_pro').value || 0) +
        parseFloat(document.getElementById('formation').value || 0) +
        getAnnualValue('fournitures', 'fournitures_type');
    
    // CRÉDIT (depuis la liste des crédits)
    const creditsListe = getCreditsList();
    const totalCredits = creditsListe.reduce((sum, c) => sum + (c.mensualite * 12), 0);
    
    // CALCUL FINAL : Biens + Pro + Crédits
    const totalCharges = chargesBiens + fraisPro + totalCredits;
    
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
    
    let totalCotisations = 0;
    
    // Calculer cotisations uniquement si bénéfice positif
    if (benefice > 0) {
        totalCotisations = Object.values(cotisations).reduce((sum, val) => sum + val, 0);
    }
    
    // ⚠️ MINIMUM URSSAF : 1200€ par an (cotisations minimales légales obligatoires)
    // Même si bénéfice négatif ou nul, minimum de 1200€ à payer
    if (totalCotisations < 1200) {
        totalCotisations = 1200;
    }
    
    const resteAvantIR = benefice - totalCotisations;
    
    // TRIMESTRES RETRAITE (1 trimestre = 600 SMIC horaire)
    const trimestres = Math.min(4, Math.floor(benefice / (600 * 11.65)));
    
    // AFFICHER LES RÉSULTATS
    afficherResultats({
        ca,
        chargesParGite,
        travaux,
        fraisDivers,
        produitsAccueil,
        fraisPro,
        totalCredits,
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
                ${Object.keys(data.chargesParGite).map(giteName => `
                <div class="resultat-ligne">
                    <span>• Charges ${giteName} :</span>
                    <span>${data.chargesParGite[giteName].toFixed(2)} €</span>
                </div>
                `).join('')}
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
                    <span>• Frais professionnels :</span>
                    <span>${data.fraisPro.toFixed(2)} €</span>
                </div>
                <div class="resultat-ligne">
                    <span>• Crédits immobiliers :</span>
                    <span>${data.totalCredits.toFixed(2)} €</span>
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
                ${data.totalCotisations === 1200 ? `
                <div style="background: rgba(52, 152, 219, 0.3); padding: 10px; border-radius: 4px; font-size: 0.85rem; margin-top: 10px; border-left: 3px solid #3498db;">
                    💡 <strong>Minimum légal appliqué :</strong> Les cotisations ne peuvent être inférieures à 1 200 € par an.
                </div>
                ` : ''}
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
                <button onclick="sauvegarderDonneesFiscales()" class="btn btn-primary" style="margin-right: 10px;">💾 Sauvegarder</button>
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
        const { data, error } = await window.supabaseClient
            .from('fiscal_history')
            .select('year')
            .order('year', { ascending: false });
        
        if (error) throw error;
        
        // Récupérer les années uniques
        const anneesUniques = [...new Set(data.map(s => s.year))];
        
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
    console.log(`🔄 [LOAD-ANNEE] Chargement année ${annee}...`);
    try {
        const anneeActuelle = new Date().getFullYear();
        
        // Stocker l'année sélectionnée globalement
        window.anneeSelectionnee = parseInt(annee);
        
        const { data, error } = await window.supabaseClient
            .from('fiscal_history')
            .select('*')
            .eq('year', parseInt(annee))
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (error) {
            console.error(`❌ [LOAD-ANNEE-ERROR] Erreur chargement données fiscales ${annee}:`, error);
            return;
        }
        
        if (!data) {
            // Aucune donnée pour cette année, créer une nouvelle entrée vide
            console.log(`📅 [LOAD-ANNEE-EMPTY] Aucune donnée pour ${annee}, création d'une nouvelle année`);
            document.getElementById('annee_simulation').value = annee;
            
            // Réinitialiser le formulaire
            nouvelleSimulation();
            
            // Véhicule : Restaurer les valeurs par défaut
            const vehiculeTypeEl = document.getElementById('vehicule_type');
            const puissanceFiscaleEl = document.getElementById('puissance_fiscale');
            if (vehiculeTypeEl) vehiculeTypeEl.value = 'thermique';
            if (puissanceFiscaleEl) puissanceFiscaleEl.value = 5;
            togglePuissanceField();
            
            // Calculer automatiquement le CA UNIQUEMENT pour l'année en cours
            if (parseInt(annee) === anneeActuelle) {
                await calculerCAAutomatique();
            }
            
            return;
        }
        
        console.log(`✅ [LOAD-ANNEE-OK] Données trouvées pour ${annee}:`, {
            ca: data.revenus,
            nb_travaux: data.donnees_detaillees?.travaux_liste?.length || 0,
            updated_at: data.updated_at
        });
        
        // Mettre à jour l'année cachée
        document.getElementById('annee_simulation').value = annee;
        
        // Charger les données depuis donnees_detaillees JSONB
        const details = data.donnees_detaillees || {};
        
        // ✅ RESTAURER VÉHICULE EN PREMIER pour éviter que sauvegardeAutomatique() écrase avec valeurs par défaut
        const vehiculeTypeEl = document.getElementById('vehicule_type');
        const puissanceFiscaleEl = document.getElementById('puissance_fiscale');
        if (vehiculeTypeEl && details.vehicule_type) vehiculeTypeEl.value = details.vehicule_type;
        if (puissanceFiscaleEl && details.puissance_fiscale) puissanceFiscaleEl.value = details.puissance_fiscale;
        if (details.km_professionnels) document.getElementById('km_professionnels').value = details.km_professionnels;
        if (details.montant_frais_km) document.getElementById('montant_frais_km').value = details.montant_frais_km;
        togglePuissanceField();
        
        // Remplir le formulaire
        try {
        document.getElementById('ca').value = details.chiffre_affaires || data.revenus || '';
        mettreAJourAffichageCA(details.chiffre_affaires || data.revenus || 0);
        
        // Charger les charges des gîtes dynamiquement
        if (window.GITES_DATA && details.charges_gites) {
            window.GITES_DATA.forEach(gite => {
                const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const giteCharges = details.charges_gites[slug];
                
                if (giteCharges) {
                    chargesFields.forEach(field => {
                        const valueId = `${field.id}_${slug}`;
                        
                        const valueEl = document.getElementById(valueId);
                        
                        if (valueEl && giteCharges[field.id] !== undefined) {
                            valueEl.value = giteCharges[field.id] || '';
                        }
                    });
                }
            });
        }
        
        // Charger aussi tous les autres champs (résidence, frais pro, véhicule, IR, etc.)
        if (details.surface_bureau !== undefined) document.getElementById('surface_bureau').value = details.surface_bureau !== undefined ? details.surface_bureau : '';
        if (details.surface_totale !== undefined) document.getElementById('surface_totale').value = details.surface_totale !== undefined ? details.surface_totale : '';
        
        // Restaurer les charges de résidence principale
        const interetsRes = document.getElementById('interets_residence');
        if (interetsRes) {
            interetsRes.value = details.interets_residence !== undefined ? details.interets_residence : '';
            if (details.interets_residence_type) interetsRes.setAttribute('data-period-type', details.interets_residence_type);
        }
        
        const assuranceRes = document.getElementById('assurance_residence');
        if (assuranceRes) {
            assuranceRes.value = details.assurance_residence !== undefined ? details.assurance_residence : '';
            if (details.assurance_residence_type) assuranceRes.setAttribute('data-period-type', details.assurance_residence_type);
        }
        
        const elecRes = document.getElementById('electricite_residence');
        if (elecRes) {
            elecRes.value = details.electricite_residence !== undefined ? details.electricite_residence : '';
            if (details.electricite_residence_type) elecRes.setAttribute('data-period-type', details.electricite_residence_type);
        }
        
        const internetRes = document.getElementById('internet_residence');
        if (internetRes) {
            internetRes.value = details.internet_residence !== undefined ? details.internet_residence : '';
            if (details.internet_residence_type) internetRes.setAttribute('data-period-type', details.internet_residence_type);
        }
        
        const eauRes = document.getElementById('eau_residence');
        if (eauRes) {
            eauRes.value = details.eau_residence !== undefined ? details.eau_residence : '';
            if (details.eau_residence_type) eauRes.setAttribute('data-period-type', details.eau_residence_type);
        }
        
        const assuranceHabRes = document.getElementById('assurance_hab_residence');
        if (assuranceHabRes) {
            assuranceHabRes.value = details.assurance_hab_residence !== undefined ? details.assurance_hab_residence : '';
            if (details.assurance_hab_residence_type) assuranceHabRes.setAttribute('data-period-type', details.assurance_hab_residence_type);
        }
        
        if (details.taxe_fonciere_residence !== undefined) document.getElementById('taxe_fonciere_residence').value = details.taxe_fonciere_residence;
        
        // Frais professionnels
        if (details.comptable !== undefined) document.getElementById('comptable').value = details.comptable !== undefined ? details.comptable : '';
        if (details.frais_bancaires !== undefined) document.getElementById('frais_bancaires').value = details.frais_bancaires !== undefined ? details.frais_bancaires : '';
        if (details.telephone !== undefined) document.getElementById('telephone').value = details.telephone !== undefined ? details.telephone : '';
        if (details.telephone_type) document.getElementById('telephone_type').value = details.telephone_type || 'mensuel';
        if (details.materiel_info !== undefined) document.getElementById('materiel_info').value = details.materiel_info !== undefined ? details.materiel_info : '';
        if (details.rc_pro !== undefined) document.getElementById('rc_pro').value = details.rc_pro !== undefined ? details.rc_pro : '';
        if (details.formation !== undefined) document.getElementById('formation').value = details.formation !== undefined ? details.formation : '';
        if (details.fournitures !== undefined) document.getElementById('fournitures').value = details.fournitures !== undefined ? details.fournitures : '';
        if (details.fournitures_type) document.getElementById('fournitures_type').value = details.fournitures_type || 'mensuel';
        
        // IR (Impôts sur le Revenu)
        if (details.salaire_madame !== undefined) document.getElementById('salaire_madame').value = details.salaire_madame !== undefined ? details.salaire_madame : '';
        if (details.salaire_monsieur !== undefined) document.getElementById('salaire_monsieur').value = details.salaire_monsieur !== undefined ? details.salaire_monsieur : '';
        if (details.nombre_enfants !== undefined) document.getElementById('nombre_enfants').value = details.nombre_enfants !== undefined ? details.nombre_enfants : 0;
        
        // Restaurer les frais réels individuels par personne
        if (details.frais_madame) {
            window.fraisMadameData = details.frais_madame;
            const infoMadame = document.getElementById('frais-madame-info');
            if (infoMadame && details.frais_madame.option) {
                if (details.frais_madame.option === 'forfaitaire') {
                    infoMadame.textContent = '10% forfaitaire';
                } else {
                    infoMadame.textContent = `Frais réels : ${details.frais_madame.montant?.toFixed(2) || 0} €`;
                }
                infoMadame.style.display = 'block';
            }
        }
        
        if (details.frais_monsieur) {
            window.fraisMonsieurData = details.frais_monsieur;
            const infoMonsieur = document.getElementById('frais-monsieur-info');
            if (infoMonsieur && details.frais_monsieur.option) {
                if (details.frais_monsieur.option === 'forfaitaire') {
                    infoMonsieur.textContent = '10% forfaitaire';
                } else {
                    infoMonsieur.textContent = `Frais réels : ${details.frais_monsieur.montant?.toFixed(2) || 0} €`;
                }
                infoMonsieur.style.display = 'block';
            }
        }
        
        // 🔄 RESTAURER LES LISTES DYNAMIQUES (travaux, frais, produits)
        
        // Réinitialiser les conteneurs
        window.SecurityUtils.setInnerHTML(document.getElementById('travaux-liste'), '');
        window.SecurityUtils.setInnerHTML(document.getElementById('frais-divers-liste'), '');
        window.SecurityUtils.setInnerHTML(document.getElementById('produits-accueil-liste'), '');
        travauxCounter = 0;
        fraisDiversCounter = 0;
        produitsCounter = 0;
        
        // Restaurer les travaux
        if (details.travaux_liste) {
            const travaux = Array.isArray(details.travaux_liste) ? details.travaux_liste : [];
            travaux.forEach((item, index) => {
                ajouterTravaux();
                const id = travauxCounter;
                const descEl = document.getElementById(`travaux-desc-${id}`);
                const typeEl = document.getElementById(`travaux-type-${id}`);
                const giteEl = document.getElementById(`travaux-gite-${id}`);
                const montantEl = document.getElementById(`travaux-montant-${id}`);
                
                if (!descEl || !giteEl || !montantEl) {
                    console.error(`❌ Éléments non trouvés pour travaux-${id}`);
                    return;
                }
                
                descEl.value = item.description || '';
                if (typeEl && item.type_amortissement) {
                    typeEl.value = item.type_amortissement;
                }
                giteEl.value = item.gite || 'commun';
                montantEl.value = item.montant || 0;
                
                // Mettre en readonly après restauration
                toggleEdit(`travaux-${id}`);
            });
        }
        
        // Restaurer les frais divers
        if (details.frais_divers_liste) {
            const frais = Array.isArray(details.frais_divers_liste) ? details.frais_divers_liste : [];
            frais.forEach(item => {
                ajouterFraisDivers();
                const id = fraisDiversCounter;
                document.getElementById(`frais-desc-${id}`).value = item.description || '';
                const typeEl = document.getElementById(`frais-type-${id}`);
                if (typeEl && item.type_amortissement) {
                    typeEl.value = item.type_amortissement;
                }
                document.getElementById(`frais-gite-${id}`).value = item.gite || 'commun';
                document.getElementById(`frais-montant-${id}`).value = item.montant || 0;
                // Mettre en readonly après restauration
                toggleEdit(`frais-${id}`);
            });
        }
        
        // Restaurer les produits d'accueil
        if (details.produits_accueil_liste) {
            const produits = Array.isArray(details.produits_accueil_liste) ? details.produits_accueil_liste : [];
            produits.forEach(item => {
                ajouterProduitAccueil();
                const id = produitsCounter;
                document.getElementById(`produits-desc-${id}`).value = item.description || '';
                const typeEl = document.getElementById(`produits-type-${id}`);
                if (typeEl && item.type_amortissement) {
                    typeEl.value = item.type_amortissement;
                }
                document.getElementById(`produits-gite-${id}`).value = item.gite || 'commun';
                document.getElementById(`produits-montant-${id}`).value = item.montant || 0;
                // Mettre en readonly après restauration
                toggleEdit(`produits-${id}`);
            });
        }
        
        // Restaurer les crédits (reste à vivre)
        if (details.credits_liste) {
            const credits = Array.isArray(details.credits_liste) ? details.credits_liste : [];
            console.log(`🔄 [LOAD-RESTORE] Restauration de ${credits.length} crédits immobiliers`);
            // Réinitialiser le conteneur des crédits
            const creditsContainer = document.getElementById('credits-liste');
            if (creditsContainer) {
                window.SecurityUtils.setInnerHTML(creditsContainer, '');
                creditsCounter = 0;
                credits.forEach((item, index) => {
                    ajouterCredit();
                    const id = creditsCounter;
                    const descEl = document.getElementById(`credit-desc-${id}`);
                    const mensuelEl = document.getElementById(`credit-mensuel-${id}`);
                    const capitalEl = document.getElementById(`credit-capital-${id}`);
                    
                    if (!descEl || !mensuelEl || !capitalEl) {
                        console.error(`❌ Éléments non trouvés pour credit-${id}`);
                        return;
                    }
                    
                    descEl.value = item.description || '';
                    mensuelEl.value = item.mensuel || 0;
                    capitalEl.value = item.capital || 0;
                    
                    console.log(`✅ [LOAD-RESTORE] Crédit ${index + 1} restauré:`, {
                        id,
                        description: item.description,
                        mensuel: item.mensuel,
                        capital: item.capital
                    });
                    
                    // Mettre en readonly après restauration
                    toggleEdit(`credit-${id}`);
                });
            }
        } else {
            console.log('ℹ️ [LOAD-RESTORE] Aucun crédit à restaurer');
        }
        
        // Restaurer les crédits personnels (nouveau système)
        if (details.credits_personnels) {
            chargerCreditsPersonnels(details);
        }
        
        } catch (loadError) {
            console.error('❌ [LOAD-ANNEE] Erreur durant la restauration:', loadError);
            console.error('Stack:', loadError.stack);
        }
        
        // Pour l'année en cours, recalculer le CA depuis les réservations
        if (parseInt(annee) === anneeActuelle) {
            console.log(`📊 [LOAD-ANNEE] Recalcul du CA pour ${annee} depuis les réservations`);
            await calculerCAAutomatique();
        } else {
            // Pour les années passées, garder le CA tel quel
            console.log(`📋 [LOAD-ANNEE] Année ${annee} : conservation du CA existant`);
            
            // Vérifier les données sauvegardées
            setTimeout(() => verifierSauvegardeAnnee(annee), 500);
        }
        
        // Recalculer les indicateurs
        calculerTempsReel();
        
        // Charger les amortiissements automatiques pour cette année
        await chargerAmortissementsAnnee(annee);
        
        // Charger les kilomètres de cette année
        await initKilometres(parseInt(annee));
        
        // Restaurer l'état des options personnelles après le chargement complet
        setTimeout(() => restaurerOptionsPersonnelles(), 100);
        
        // 🔄 Synchroniser résidence → frais personnels après chargement
        setTimeout(() => {
            if (typeof syncResidenceToFraisPerso === 'function') {
                syncResidenceToFraisPerso();
            }
        }, 150);
        
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
        
        // Mettre à jour le champ CA et son affichage
        mettreAJourAffichageCA(ca.toFixed(2));
        
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
    const { data: existing } = await window.supabaseClient
        .from('fiscal_history')
        .select('id')
        .eq('year', nouvelleAnnee)
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
        const { data: anneePrecedente, error: loadError } = await window.supabaseClient
            .from('fiscal_history')
            .select('*')
            .eq('year', anneeActuelle)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (loadError) {
            console.error('❌ Erreur chargement année précédente:', loadError);
            return;
        }
        
        if (!anneePrecedente) {
            showToast('Aucune simulation trouvée pour l\'année en cours', 'error');
            return;
        }
        
        const prevDetails = anneePrecedente.donnees_detaillees || {};
        
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Utilisateur non connecté');
        
        // Créer les nouvelles données - structure table fiscal_history
        const nouvellesDonnees = {
            owner_user_id: user.id,  // 🔒 OBLIGATOIRE pour RLS
            year: nouvelleAnnee,
            gite: 'multi',
            revenus: 0,
            charges: 0,
            resultat: 0,
            donnees_detaillees: {
                regime: prevDetails.regime || 'reel',
                gite: 'multi',
                chiffre_affaires: 0,
                revenus_total: 0,
                charges_total: 0,
                resultat_imposable: 0,
                impot_estime: 0,
                
                // 🏢 Copier les charges des gîtes dynamiquement
                charges_gites: prevDetails.charges_gites || {},
                
                // NE PAS copier: travaux_liste, frais_divers_liste, produits_accueil_liste
                travaux_liste: [],
                frais_divers_liste: [],
                produits_accueil_liste: [],
                
                // Copier résidence principale
                surface_bureau: prevDetails.surface_bureau,
                surface_totale: prevDetails.surface_totale,
                interets_residence: prevDetails.interets_residence,
                interets_residence_type: prevDetails.interets_residence_type,
                assurance_residence: prevDetails.assurance_residence,
                assurance_residence_type: prevDetails.assurance_residence_type,
                electricite_residence: prevDetails.electricite_residence,
                electricite_residence_type: prevDetails.electricite_residence_type,
                internet_residence: prevDetails.internet_residence,
                internet_residence_type: prevDetails.internet_residence_type,
                eau_residence: prevDetails.eau_residence,
                eau_residence_type: prevDetails.eau_residence_type,
                assurance_hab_residence: prevDetails.assurance_hab_residence,
                assurance_hab_residence_type: prevDetails.assurance_hab_residence_type,
                taxe_fonciere_residence: prevDetails.taxe_fonciere_residence,
                
                // Copier frais professionnels
                comptable: prevDetails.comptable,
                frais_bancaires: prevDetails.frais_bancaires,
                telephone: prevDetails.telephone,
                telephone_type: prevDetails.telephone_type,
                materiel_info: prevDetails.materiel_info,
                rc_pro: prevDetails.rc_pro,
                formation: prevDetails.formation,
                fournitures: prevDetails.fournitures,
                fournitures_type: prevDetails.fournitures_type,
                
                // Copier véhicule
                vehicule_option: prevDetails.vehicule_option,
                puissance_fiscale: prevDetails.puissance_fiscale,
                km_professionnels: prevDetails.km_professionnels,
                
                // Copier IR
                salaire_madame: prevDetails.salaire_madame,
                salaire_monsieur: prevDetails.salaire_monsieur,
                nombre_enfants: prevDetails.nombre_enfants,
                
                // Copier crédits et frais perso
                credits_liste: prevDetails.credits_liste || [],
                frais_perso_internet: prevDetails.frais_perso_internet,
                frais_perso_electricite: prevDetails.frais_perso_electricite,
                frais_perso_eau: prevDetails.frais_perso_eau,
                frais_perso_assurance: prevDetails.frais_perso_assurance,
                frais_perso_taxe: prevDetails.frais_perso_taxe,
                frais_perso_autres: prevDetails.frais_perso_autres
            }
        };
        
        // Sauvegarder la nouvelle année
        const { error: insertError } = await window.supabaseClient
            .from('fiscal_history')
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

// ==========================================
// 💾 SAUVEGARDE ET CHARGEMENT
// ==========================================

async function sauvegarderDonneesFiscales(silencieux = false) {
    
    const anneeValue = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        showToast('Vous devez être connecté', 'error');
        return;
    }
    
    // 🏢 Structure table RÉELLE en production: fiscal_history
    const data = {
        owner_user_id: user.id,  // 🔒 OBLIGATOIRE pour RLS
        year: anneeValue,
        gite: 'multi',
        revenus: parseFloat(document.getElementById('ca')?.value || 0),
        charges: 0, // Sera calculé
        resultat: 0, // Sera calculé
        donnees_detaillees: {} // JSONB - VRAIE colonne
    };
    
    // 🏢 MULTI-TENANT: Collecter toutes les données dans "donnees_detaillees" JSONB
    const detailsData = {
        regime: 'reel',
        gite: 'multi', // Info stockée dans JSONB
        chiffre_affaires: parseFloat(document.getElementById('ca')?.value || 0),
        revenus_total: parseFloat(document.getElementById('ca')?.value || 0),
        charges_total: 0, // Sera calculé
        resultat_imposable: parseFloat(document.getElementById('preview-benefice')?.textContent?.replace(/[€\s]/g, '') || 0),
        impot_estime: parseFloat(document.getElementById('ir-montant')?.textContent?.replace(/[€\s]/g, '') || 0)
    };
    
    // Collecter dynamiquement les charges de chaque gîte
    const chargesGites = {};
    if (window.GITES_DATA && window.GITES_DATA.length > 0) {
        window.GITES_DATA.forEach(gite => {
            const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            chargesGites[slug] = {};
            
            chargesFields.forEach(field => {
                const valueId = `${field.id}_${slug}`;
                
                const valueEl = document.getElementById(valueId);
                
                if (valueEl) {
                    chargesGites[slug][field.id] = parseFloat(valueEl.value || 0);
                }
            });
        });
    }
    
    detailsData.charges_gites = chargesGites;
    
    // Compléter avec les autres données (listes, résidence, etc.)
    detailsData.travaux_liste = getTravauxListe();
    detailsData.frais_divers_liste = getFraisDiversListe();
    detailsData.produits_accueil_liste = getProduitsAccueilListe();
    
    // Résidence
    detailsData.surface_bureau = parseFloat(document.getElementById('surface_bureau')?.value || 0);
    detailsData.surface_totale = parseFloat(document.getElementById('surface_totale')?.value || 0);
    detailsData.interets_residence = parseFloat(document.getElementById('interets_residence')?.value || 0);
    detailsData.interets_residence_type = document.getElementById('interets_residence')?.getAttribute('data-period-type') || 'mensuel';
    detailsData.assurance_residence = parseFloat(document.getElementById('assurance_residence')?.value || 0);
    detailsData.assurance_residence_type = document.getElementById('assurance_residence')?.getAttribute('data-period-type') || 'mensuel';
    detailsData.electricite_residence = parseFloat(document.getElementById('electricite_residence')?.value || 0);
    detailsData.electricite_residence_type = document.getElementById('electricite_residence')?.getAttribute('data-period-type') || 'mensuel';
    detailsData.internet_residence = parseFloat(document.getElementById('internet_residence')?.value || 0);
    detailsData.internet_residence_type = document.getElementById('internet_residence')?.getAttribute('data-period-type') || 'mensuel';
    detailsData.eau_residence = parseFloat(document.getElementById('eau_residence')?.value || 0);
    detailsData.eau_residence_type = document.getElementById('eau_residence')?.getAttribute('data-period-type') || 'mensuel';
    detailsData.assurance_hab_residence = parseFloat(document.getElementById('assurance_hab_residence')?.value || 0);
    detailsData.assurance_hab_residence_type = document.getElementById('assurance_hab_residence')?.getAttribute('data-period-type') || 'mensuel';
    detailsData.taxe_fonciere_residence = parseFloat(document.getElementById('taxe_fonciere_residence')?.value || 0);
    
    // Frais professionnels
    detailsData.comptable = parseFloat(document.getElementById('comptable')?.value || 0);
    detailsData.frais_bancaires = parseFloat(document.getElementById('frais_bancaires')?.value || 0);
    detailsData.telephone = parseFloat(document.getElementById('telephone')?.value || 0);
    detailsData.telephone_type = document.getElementById('telephone_type')?.value || 'mensuel';
    detailsData.materiel_info = parseFloat(document.getElementById('materiel_info')?.value || 0);
    detailsData.rc_pro = parseFloat(document.getElementById('rc_pro')?.value || 0);
    detailsData.formation = parseFloat(document.getElementById('formation')?.value || 0);
    detailsData.fournitures = parseFloat(document.getElementById('fournitures')?.value || 0);
    detailsData.fournitures_type = document.getElementById('fournitures_type')?.value || 'mensuel';
    
    // Véhicule
    detailsData.vehicule_option = 'bareme';
    const vehiculeTypeEl = document.getElementById('vehicule_type');
    const puissanceFiscaleEl = document.getElementById('puissance_fiscale');
    detailsData.vehicule_type = vehiculeTypeEl?.value || 'thermique';
    detailsData.puissance_fiscale = parseInt(puissanceFiscaleEl?.value || 5);
    detailsData.km_professionnels = parseInt(document.getElementById('km_professionnels')?.value || 0);
    detailsData.montant_frais_km = parseFloat(document.getElementById('montant_frais_km')?.value || 0);
    
    detailsData.carburant = 0;
    detailsData.carburant_type = 'mensuel';
    detailsData.assurance_auto = 0;
    detailsData.assurance_auto_type = 'mensuel';
    detailsData.entretien_auto = 0;
    detailsData.amortissement_auto = 0;
    detailsData.usage_pro_pourcent = 0;
    
    // IR
    detailsData.salaire_madame = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    detailsData.salaire_monsieur = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    detailsData.nombre_enfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
    
    // Frais réels impôts - Données individuelles par personne
    detailsData.frais_madame = window.fraisMadameData || { option: 'forfaitaire', km: 0, cv: 5, peages: 0, montant: 0 };
    detailsData.frais_monsieur = window.fraisMonsieurData || { option: 'forfaitaire', km: 0, cv: 5, peages: 0, montant: 0 };
    
    // Reste à vivre - Crédits
    detailsData.credits_liste = getCreditsListe();
    
    // Crédits personnels (nouveau système)
    detailsData.credits_personnels = getCreditsPersonnels();
    
    // Reste à vivre - Frais personnels mensuels
    detailsData.frais_perso_internet = parseFloat(document.getElementById('frais_perso_internet')?.value || 0);
    detailsData.frais_perso_electricite = parseFloat(document.getElementById('frais_perso_electricite')?.value || 0);
    detailsData.frais_perso_eau = parseFloat(document.getElementById('frais_perso_eau')?.value || 0);
    detailsData.frais_perso_assurance = parseFloat(document.getElementById('frais_perso_assurance')?.value || 0);
    detailsData.frais_perso_taxe = parseFloat(document.getElementById('frais_perso_taxe')?.value || 0);
    detailsData.frais_perso_autres = parseFloat(document.getElementById('frais_perso_autres')?.value || 0);
    
    // 💾 RÉSULTATS CALCULÉS (pour affichage dans le dashboard)
    detailsData.benefice_imposable = parseFloat(document.getElementById('preview-benefice')?.textContent?.replace(/[€\s]/g, '') || 0);
    detailsData.cotisations_urssaf = parseFloat(document.getElementById('preview-urssaf')?.textContent?.replace(/[€\s]/g, '') || 0);
    detailsData.reste_avant_ir = parseFloat(document.getElementById('preview-reste')?.textContent?.replace(/[€\s]/g, '') || 0);
    detailsData.impot_revenu = parseFloat(document.getElementById('ir-montant')?.textContent?.replace(/[€\s]/g, '') || 0);
    detailsData.reste_apres_ir = parseFloat(document.getElementById('reste-vivre-final')?.textContent?.replace(/[€\s]/g, '') || 0);
    detailsData.trimestres_retraite = parseInt(document.getElementById('detail-trimestres')?.textContent || 0);
    
    // Stocker toutes les données dans la colonne JSONB "donnees_detaillees"
    data.donnees_detaillees = detailsData;
    
    // Vérifier si les données ont changé
    const dataString = JSON.stringify(data);
    
    if (silencieux && dataString === lastSavedData) {
        return;
    }
    
    try {
        const { data: result, error } = await window.supabaseClient
            .from('fiscal_history')
            .upsert(data, { 
                onConflict: 'owner_user_id,year,gite',  // Clé unique
                ignoreDuplicates: false  // Remplacer si existe
            })
            .select();
        
        if (error) {
            console.error('❌ [SAVE-ERROR] Erreur Supabase:', error);
            throw error;
        }
        
        lastSavedData = dataString;
        
        if (!silencieux) {
            showToast('✓ Données fiscales sauvegardées', 'success');
        }
    } catch (error) {
        console.error('💥 [SAVE-EXCEPTION]:', error);
        if (!silencieux) {
            showToast('Erreur lors de la sauvegarde', 'error');
        }
    }
}

async function chargerDerniereSimulation() {
    console.log('🔄 [LOAD-START] Début chargement données fiscales...');
    
    try {
        // Récupérer l'année sélectionnée ou l'année en cours
        const anneeSelectionnee = document.getElementById('annee_simulation')?.value || new Date().getFullYear();
        
        console.log(`📅 [LOAD] Chargement pour année: ${anneeSelectionnee}`);
        
        const { data, error } = await window.supabaseClient
            .from('fiscal_history')
            .select('*')
            .eq('year', anneeSelectionnee)
            .eq('gite', 'multi')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (error) {
            console.error('❌ [LOAD-ERROR] Erreur chargement données fiscales:', error);
            return;
        }
        
        if (!data) {
            console.log(`ℹ️ [LOAD-EMPTY] Aucune donnée fiscale pour ${anneeSelectionnee}`);
            return;
        }
        
        console.log(`✅ Données fiscales ${anneeSelectionnee} chargées:`, {
            ca: data.revenus,
            nb_travaux: data.donnees_detaillees?.travaux_liste?.length || 0,
            derniere_modif: data.updated_at
        });
        
        // Remplir le formulaire avec les données depuis JSONB "donnees_detaillees"
        const details = data.donnees_detaillees || {};
        
        document.getElementById('ca').value = details.chiffre_affaires || data.revenus || '';
        mettreAJourAffichageCA(details.chiffre_affaires || data.revenus || 0);
        
        // Année
        if (document.getElementById('annee_simulation')) {
            document.getElementById('annee_simulation').value = data.year || new Date().getFullYear();
        }
        
        // 🏢 MULTI-TENANT: Charger dynamiquement les charges de chaque gîte depuis JSONB
        if (window.GITES_DATA && window.GITES_DATA.length > 0 && details.charges_gites) {
            window.GITES_DATA.forEach(gite => {
                const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const giteCharges = details.charges_gites[slug];
                
                if (giteCharges) {
                    chargesFields.forEach(field => {
                        const valueId = `${field.id}_${slug}`;
                        
                        const valueEl = document.getElementById(valueId);
                        
                        if (valueEl && giteCharges[field.id] !== undefined) {
                            valueEl.value = giteCharges[field.id] || '';
                        }
                    });
                }
            });
        }
        
        // Résidence principale
        document.getElementById('surface_bureau').value = details.surface_bureau !== undefined ? details.surface_bureau : '';
        document.getElementById('surface_totale').value = details.surface_totale !== undefined ? details.surface_totale : '';
        
        const interetsRes = document.getElementById('interets_residence');
        if (interetsRes) {
            interetsRes.value = details.interets_residence !== undefined ? details.interets_residence : '';
            if (details.interets_residence_type) interetsRes.setAttribute('data-period-type', details.interets_residence_type);
        }
        
        const assuranceRes = document.getElementById('assurance_residence');
        if (assuranceRes) {
            assuranceRes.value = details.assurance_residence !== undefined ? details.assurance_residence : '';
            if (details.assurance_residence_type) assuranceRes.setAttribute('data-period-type', details.assurance_residence_type);
        }
        
        const elecRes = document.getElementById('electricite_residence');
        if (elecRes) {
            elecRes.value = details.electricite_residence !== undefined ? details.electricite_residence : '';
            if (details.electricite_residence_type) elecRes.setAttribute('data-period-type', details.electricite_residence_type);
        }
        
        const internetRes = document.getElementById('internet_residence');
        if (internetRes) {
            internetRes.value = details.internet_residence !== undefined ? details.internet_residence : '';
            if (details.internet_residence_type) internetRes.setAttribute('data-period-type', details.internet_residence_type);
        }
        
        const eauRes = document.getElementById('eau_residence');
        if (eauRes) {
            eauRes.value = details.eau_residence !== undefined ? details.eau_residence : '';
            if (details.eau_residence_type) eauRes.setAttribute('data-period-type', details.eau_residence_type);
        }
        
        const assuranceHabRes = document.getElementById('assurance_hab_residence');
        if (assuranceHabRes) {
            assuranceHabRes.value = details.assurance_hab_residence !== undefined ? details.assurance_hab_residence : '';
            if (details.assurance_hab_residence_type) assuranceHabRes.setAttribute('data-period-type', details.assurance_hab_residence_type);
        }
        
        document.getElementById('taxe_fonciere_residence').value = details.taxe_fonciere_residence !== undefined ? details.taxe_fonciere_residence : '';
        
        // Frais professionnels
        document.getElementById('comptable').value = details.comptable !== undefined ? details.comptable : '';
        document.getElementById('frais_bancaires').value = details.frais_bancaires !== undefined ? details.frais_bancaires : '';
        document.getElementById('telephone').value = details.telephone !== undefined ? details.telephone : '';
        document.getElementById('telephone_type').value = details.telephone_type || 'mensuel';
        document.getElementById('materiel_info').value = details.materiel_info !== undefined ? details.materiel_info : '';
        document.getElementById('rc_pro').value = details.rc_pro !== undefined ? details.rc_pro : '';
        document.getElementById('formation').value = details.formation !== undefined ? details.formation : '';
        document.getElementById('fournitures').value = details.fournitures !== undefined ? details.fournitures : '';
        document.getElementById('fournitures_type').value = details.fournitures_type || 'mensuel';
        
        // Véhicule déjà restauré au début - NE PAS restaurer ici pour éviter boucle
        
        // Masquer/afficher le champ puissance selon le type de véhicule (déjà fait au début)
        // togglePuissanceField(); 
        
        // IR
        document.getElementById('salaire_madame').value = details.salaire_madame !== undefined ? details.salaire_madame : '';
        document.getElementById('salaire_monsieur').value = details.salaire_monsieur !== undefined ? details.salaire_monsieur : '';
        document.getElementById('nombre_enfants').value = details.nombre_enfants !== undefined ? details.nombre_enfants : 0;
        
        // Restaurer les frais réels individuels par personne
        if (details.frais_madame) {
            window.fraisMadameData = details.frais_madame;
            const infoMadame = document.getElementById('frais-madame-info');
            if (infoMadame && details.frais_madame.option) {
                if (details.frais_madame.option === 'forfaitaire') {
                    infoMadame.textContent = '10% forfaitaire';
                } else {
                    infoMadame.textContent = `Frais réels : ${details.frais_madame.montant?.toFixed(2) || 0} €`;
                }
                infoMadame.style.display = 'block';
            }
        }
        
        if (details.frais_monsieur) {
            window.fraisMonsieurData = details.frais_monsieur;
            const infoMonsieur = document.getElementById('frais-monsieur-info');
            if (infoMonsieur && details.frais_monsieur.option) {
                if (details.frais_monsieur.option === 'forfaitaire') {
                    infoMonsieur.textContent = '10% forfaitaire';
                } else {
                    infoMonsieur.textContent = `Frais réels : ${details.frais_monsieur.montant?.toFixed(2) || 0} €`;
                }
                infoMonsieur.style.display = 'block';
            }
        }
        
        // Reste à vivre - Frais personnels
        if (document.getElementById('frais_perso_internet')) {
            document.getElementById('frais_perso_internet').value = details.frais_perso_internet || '';
        }
        if (document.getElementById('frais_perso_electricite')) {
            document.getElementById('frais_perso_electricite').value = details.frais_perso_electricite || '';
        }
        if (document.getElementById('frais_perso_eau')) {
            document.getElementById('frais_perso_eau').value = details.frais_perso_eau || '';
        }
        if (document.getElementById('frais_perso_assurance')) {
            document.getElementById('frais_perso_assurance').value = details.frais_perso_assurance || '';
        }
        if (document.getElementById('frais_perso_taxe')) {
            document.getElementById('frais_perso_taxe').value = details.frais_perso_taxe || '';
        }
        if (document.getElementById('frais_perso_autres')) {
            document.getElementById('frais_perso_autres').value = details.frais_perso_autres || '';
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
        if (details.travaux_liste) {
            const travaux = Array.isArray(details.travaux_liste) ? details.travaux_liste : [];
            console.log(`🔄 Restauration de ${travaux.length} travaux:`, travaux);
            travaux.forEach((item, index) => {
                ajouterTravaux();
                const id = travauxCounter;
                const descEl = document.getElementById(`travaux-desc-${id}`);
                const typeEl = document.getElementById(`travaux-type-${id}`);
                const giteEl = document.getElementById(`travaux-gite-${id}`);
                const montantEl = document.getElementById(`travaux-montant-${id}`);
                
                if (!descEl || !giteEl || !montantEl) {
                    console.error(`❌ Éléments non trouvés pour travaux-${id}`);
                    return;
                }
                
                descEl.value = item.description || '';
                if (typeEl && item.type_amortissement) {
                    typeEl.value = item.type_amortissement;
                }
                giteEl.value = item.gite || 'commun';
                montantEl.value = item.montant || 0;
                
                console.log(`✅ Travail ${index + 1} restauré:`, {
                    id,
                    description: item.description,
                    type: item.type_amortissement,
                    gite: item.gite,
                    montant: item.montant
                });
                
                // Mettre en readonly après restauration
                toggleEdit(`travaux-${id}`);
            });
        } else {
            console.log('ℹ️ Aucun travail à restaurer');
        }
        
        // Restaurer les frais divers
        if (details.frais_divers_liste) {
            const frais = Array.isArray(details.frais_divers_liste) ? details.frais_divers_liste : [];
            frais.forEach(item => {
                ajouterFraisDivers();
                const id = fraisDiversCounter;
                document.getElementById(`frais-desc-${id}`).value = item.description || '';
                const typeEl = document.getElementById(`frais-type-${id}`);
                if (typeEl && item.type_amortissement) {
                    typeEl.value = item.type_amortissement;
                }
                document.getElementById(`frais-gite-${id}`).value = item.gite || 'commun';
                document.getElementById(`frais-montant-${id}`).value = item.montant || 0;
                // Mettre en readonly après restauration
                toggleEdit(`frais-${id}`);
            });
        }
        
        // Restaurer les produits d'accueil
        if (details.produits_accueil_liste) {
            const produits = Array.isArray(details.produits_accueil_liste) ? details.produits_accueil_liste : [];
            produits.forEach(item => {
                ajouterProduitAccueil();
                const id = produitsCounter;
                document.getElementById(`produits-desc-${id}`).value = item.description || '';
                const typeEl = document.getElementById(`produits-type-${id}`);
                if (typeEl && item.type_amortissement) {
                    typeEl.value = item.type_amortissement;
                }
                document.getElementById(`produits-gite-${id}`).value = item.gite || 'commun';
                document.getElementById(`produits-montant-${id}`).value = item.montant || 0;
                // Mettre en readonly après restauration
                toggleEdit(`produits-${id}`);
            });
        }
        
        // Restaurer les crédits (reste à vivre)
        if (details.credits_liste) {
            const credits = Array.isArray(details.credits_liste) ? details.credits_liste : [];
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
    const resultatsEl = document.getElementById('resultats-fiscalite');
    if (resultatsEl) {
        resultatsEl.style.display = 'none';
    }
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

// Générer dynamiquement les blocs de charges par gîte
async function genererBlocsChargesGites() {
    const container = document.getElementById('gites-charges-container');
    if (!container) return;

    // Récupérer les gîtes depuis gitesManager
    let gites = [];
    if (window.gitesManager) {
        try {
            gites = await window.gitesManager.getAll();
        } catch (error) {
            console.error('❌ Erreur chargement gîtes:', error);
        }
    }
    
    if (gites.length === 0) {
        container.innerHTML = '<div class="info-box">⚠️ Aucun gîte configuré. Veuillez ajouter des gîtes dans la configuration.</div>';
        return;
    }

    // Créer UN SEUL bloc déroulant englobant pour tous les gîtes
    let html = `
    <div class="fiscal-bloc collapsible collapsed">
        <h3 class="fiscal-bloc-title">
            <span class="toggle-icon">▼</span> 🏠 Charges des gîtes (100% déductibles)
        </h3>
        <div class="bloc-content">
            <!-- Toggle Mensuel/Annuel pour toutes les charges des gîtes -->
            <div style="margin-bottom: 20px; padding: 12px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; gap: 15px;">
                <label style="font-weight: 600; margin: 0;">Périodicité des charges :</label>
                <button type="button" class="btn-toggle-period active" data-period="mensuel" data-section="gites" onclick="(function(e){e.stopPropagation(); togglePeriodSection('gites', 'mensuel');})(event)">Mensuel</button>
                <button type="button" class="btn-toggle-period" data-period="annuel" data-section="gites" onclick="(function(e){e.stopPropagation(); togglePeriodSection('gites', 'annuel');})(event)">Annuel</button>
            </div>`;
    
    gites.forEach((gite, index) => {
        const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const giteColor = gite.color || '#667eea';
        
        // Ajouter un séparateur entre les gîtes (sauf pour le premier)
        if (index > 0) {
            html += `<div style="margin: 30px 0;"></div>`;
        }
        
        html += `
            <div style="border: 3px solid ${giteColor}; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, ${giteColor}08 0%, ${giteColor}15 100%); box-shadow: 0 4px 12px ${giteColor}30;">
                <h4 style="color: ${giteColor}; margin: 0 0 20px 0; font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                    <span style="background: ${giteColor}; color: white; width: 35px; height: 35px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📍</span>
                    ${gite.name}
                </h4>
                <div class="fiscal-grid">`;
        
        chargesFields.forEach(field => {
            const fieldId = `${field.id}_${giteSlug}`;
            
            html += `
                <div class="form-group">
                    <label>${field.label}</label>
                    <input type="number" id="${fieldId}" step="0.01" placeholder="0.00">
                </div>`;
        });
        
        html += `
                </div>
            </div>`;
    });
    
    html += `
        </div>
    </div>`;
    
    window.SecurityUtils.setInnerHTML(container, html);
    
    // Stocker les gîtes pour utilisation ultérieure
    window.GITES_DATA = gites;
}

// Générer dynamiquement le récapitulatif des charges
async function genererRecapitulatifCharges() {
    const container = document.getElementById('total-charges-container');
    if (!container) return;

    // Récupérer les gîtes depuis gitesManager
    let gites = window.GITES_DATA || [];
    if (gites.length === 0 && window.gitesManager) {
        try {
            gites = await window.gitesManager.getAll();
            window.GITES_DATA = gites;
        } catch (error) {
            console.error('❌ Erreur chargement gîtes:', error);
        }
    }

    let html = '';
    
    // Ajouter dynamiquement les charges de chaque gîte
    gites.forEach(gite => {
        const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        html += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span>Charges ${gite.name}</span>
            <strong id="total-charges-${giteSlug}">0 €</strong>
        </div>`;
    });
    
    // Ajouter les autres lignes fixes
    html += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span>Charges Résidence (proratisées)</span>
            <strong id="total-charges-residence">0 €</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span>Frais Professionnels</span>
            <strong id="total-frais-pro">0 €</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span>Frais Véhicule</span>
            <strong id="total-frais-vehicule">0 €</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span>Travaux</span>
            <strong id="total-travaux">0 €</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span>Frais Divers</span>
            <strong id="total-frais-divers">0 €</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span>Produits d'accueil</span>
            <strong id="total-produits-accueil">0 €</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 4px; font-weight: 700; margin-top: 10px; font-size: 1.1rem;">
            <span>TOTAL CHARGES</span>
            <strong id="total-charges-annuelles">0 €</strong>
        </div>`;
    
    window.SecurityUtils.setInnerHTML(container, html);
}

async function initFiscalite() {
    console.log('🚀 [INIT] initFiscalite() appelée');
    
    const form = document.getElementById('calculateur-lmp');
    if (!form) {
        console.warn('⚠️ [INIT-FISCALITE] Formulaire non trouvé, nouvelle tentative dans 500ms...');
        setTimeout(initFiscalite, 500);
        return;
    }
    
    console.log('✅ [INIT] Formulaire trouvé');
    
    // Générer les blocs de charges par gîte (async)
    await genererBlocsChargesGites();
    
    // Générer le récapitulatif des charges (async)
    await genererRecapitulatifCharges();
    
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
    
    // Ajouter la délégation pour les blocs collapsibles (au niveau du document pour être sûr)
    document.removeEventListener('click', handleToggleBloc);
    document.addEventListener('click', handleToggleBloc);
    
    
    // Charger la liste des années disponibles
    console.log('📋 [INIT] Chargement liste des années...');
    chargerListeAnnees().then(async () => {
        // Charger automatiquement la dernière simulation après avoir chargé la liste
        const anneeSelectionnee = document.getElementById('annee_selector').value;
        console.log(`📅 [INIT] Année sélectionnée dans selector: "${anneeSelectionnee}"`);
        if (anneeSelectionnee) {
            console.log(`➡️ [INIT] Appel chargerAnnee(${anneeSelectionnee})`);
            await chargerAnnee(anneeSelectionnee);
        } else {
            console.log('➡️ [INIT] Appel chargerDerniereSimulation()');
            await chargerDerniereSimulation();
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

// Délégation d'événements pour les blocs collapsibles
function handleToggleBloc(e) {
    const target = e.target;
    // Vérifier si on a cliqué sur un titre de bloc ou un élément à l'intérieur
    const titleElement = target.closest('.fiscal-bloc-title');
    if (titleElement) {
        e.preventDefault();
        e.stopPropagation();
        toggleBloc(titleElement);
    }
}

// ==========================================
// 💰 GESTION DU RESTE À VIVRE
// ==========================================

function ajouterCredit() {
    const id = ++creditsCounter;
    const container = document.getElementById('credits-liste');
    const item = document.createElement('div');
    item.className = 'liste-item';
    item.id = `credit-${id}`;
    window.SecurityUtils.setInnerHTML(item, `
        <input type="text" placeholder="Description du crédit" id="credit-desc-${id}" readonly>
        <input type="number" step="0.01" placeholder="Mensualité €" id="credit-mensuel-${id}" readonly>
        <input type="number" step="0.01" placeholder="Capital restant €" id="credit-capital-${id}" readonly>
        <div class="item-actions">
            <button type="button" class="btn-edit" onclick="toggleEdit('credit-${id}')" title="Modifier">✏️</button>
            <button type="button" class="btn-delete" onclick="supprimerCredit('credit-${id}')">×</button>
        </div>
    `);
    container.appendChild(item);
    calculerResteAVivre();
    // Ajouter les événements pour la sauvegarde automatique
    const inputs = item.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('blur', sauvegardeAutomatique);
    });
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
    // 🏢 MULTI-TENANT: Calculer dynamiquement les amortissements de tous les gîtes
    let totalAmortissementsGites = 0;
    if (window.GITES_DATA && window.GITES_DATA.length > 0) {
        window.GITES_DATA.forEach(gite => {
            const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const amortEl = document.getElementById(`amortissement_${slug}`);
            if (amortEl) {
                totalAmortissementsGites += parseFloat(amortEl.value || 0);
            }
        });
    }
    const amortAuto = parseFloat(document.getElementById('amortissement_auto')?.value || 0);
    const amortissementsMensuel = (totalAmortissementsGites + amortAuto) / 12;
    
    const totalRevenus = salaireMadameMensuel + salaireMonsieurMensuel + revenuLMPMensuel + fraisKmMensuel + amortissementsMensuel;
    
    // ==================== DÉPENSES ====================
    // Crédits immobiliers (ancien système)
    const credits = getCreditsListe();
    const totalCreditsImmobiliers = credits.reduce((sum, c) => sum + c.mensuel, 0);
    const totalCapital = credits.reduce((sum, c) => sum + c.capital, 0);
    
    // Crédits personnels (nouveau système)
    const totalCreditsPersonnels = calculerTotalCredits();
    
    // Total tous les crédits
    const totalCredits = totalCreditsImmobiliers + totalCreditsPersonnels;
    
    // Frais personnels mensuels (saisis dans la section Reste à vivre)
    const fraisInternet = parseFloat(document.getElementById('frais_perso_internet')?.value || 0);
    const fraisElec = parseFloat(document.getElementById('frais_perso_electricite')?.value || 0);
    const fraisEau = parseFloat(document.getElementById('frais_perso_eau')?.value || 0);
    const fraisAssurance = parseFloat(document.getElementById('frais_perso_assurance')?.value || 0);
    const fraisTaxeAnnuel = parseFloat(document.getElementById('frais_perso_taxe')?.value || 0);
    const fraisAutres = parseFloat(document.getElementById('frais_perso_autres')?.value || 0);
    
    // AJOUTER les charges de résidence principale (partie non déductible fiscalement)
    // Ces charges sont à 100% personnelles car seule la partie professionnelle est déduite fiscalement
    const surfaceBureau = parseFloat(document.getElementById('surface_bureau')?.value || 0);
    const surfaceTotale = parseFloat(document.getElementById('surface_totale')?.value || 0);
    const ratio = (surfaceTotale > 0) ? (surfaceBureau / surfaceTotale) : 0;
    const ratioPerso = 1 - ratio; // Partie personnelle (non déduite)
    
    // Récupérer les charges résidence et convertir en mensuel
    const interetsResAnnuel = getAnnualValue('interets_residence', 'interets_residence');
    const assuranceResAnnuel = getAnnualValue('assurance_residence', 'assurance_residence');
    const elecResAnnuel = getAnnualValue('electricite_residence', 'electricite_residence');
    const internetResAnnuel = getAnnualValue('internet_residence', 'internet_residence');
    const eauResAnnuel = getAnnualValue('eau_residence', 'eau_residence');
    const assuranceHabResAnnuel = getAnnualValue('assurance_hab_residence', 'assurance_hab_residence');
    const taxeFonciereRes = parseFloat(document.getElementById('taxe_fonciere_residence')?.value || 0);
    
    const totalChargesResAnnuel = interetsResAnnuel + assuranceResAnnuel + elecResAnnuel + 
                                   internetResAnnuel + eauResAnnuel + assuranceHabResAnnuel + taxeFonciereRes;
    const chargesResPersonnellesMensuel = (totalChargesResAnnuel * ratioPerso) / 12;
    
    const totalFraisPerso = fraisInternet + fraisElec + fraisEau + fraisAssurance + 
                           (fraisTaxeAnnuel / 12) + fraisAutres + chargesResPersonnellesMensuel;
    
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
        const { data, error } = await window.supabaseClient
            .from('fiscal_history')
            .select('year, donnees_detaillees, created_at')
            .eq('year', annee)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
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
window.afficherMessage = afficherMessage;
window.toggleBloc = toggleBloc;
window.sauvegarderDonneesFiscales = sauvegarderDonneesFiscales;
window.sauvegarderSimulation = sauvegarderDonneesFiscales; // Alias pour compatibilité
window.chargerDerniereSimulation = chargerDerniereSimulation;
window.nouvelleSimulation = nouvelleSimulation;
window.exporterPDF = exporterPDF;
window.calculerTempsReel = calculerTempsReel;
window.initFiscalite = initFiscalite;
window.ajouterCredit = ajouterCredit;
window.supprimerCredit = supprimerCredit;
window.calculerResteAVivre = calculerResteAVivre;
window.togglePuissanceField = togglePuissanceField;
window.calculerFraisKm = calculerFraisKm;

// Nouvelles fonctions pour frais réels individuels par personne
window.openFraisReelsSalarieModal = openFraisReelsSalarieModal;
window.closeFraisReelsSalarieModal = closeFraisReelsSalarieModal;
window.toggleOptionFraisSalarie = toggleOptionFraisSalarie;
window.calculerFraisSalarieModal = calculerFraisSalarieModal;
window.validerFraisSalarie = validerFraisSalarie;

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
        const { data, error } = await window.supabaseClient
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
        const { error } = await window.supabaseClient
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
        let query = window.supabaseClient
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
    // LAZY LOAD: charger uniquement quand l'utilisateur clique sur l'onglet
    const fiscaliteTab = document.querySelector('[data-tab="fiscalite"]');
    if (fiscaliteTab) {
        let fiscaliteInitialized = false;
        fiscaliteTab.addEventListener('click', () => {
            if (!fiscaliteInitialized) {
                setTimeout(initFiscalite, 100);
                fiscaliteInitialized = true;
            }
        });
    }
    
    // Initialiser l'année pour la trésorerie (léger, pas de requête DB)
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
        const { error } = await window.supabaseClient
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

// ==========================================
// GESTION TOGGLE PÉRIODE (MENSUEL/ANNUEL)
// ==========================================

function togglePeriodSection(section, period) {
    console.log(`🔄 Toggle période section ${section}: ${period}`);
    
    // Mettre à jour les boutons de cette section
    const buttons = document.querySelectorAll(`[data-section="${section}"]`);
    let currentPeriod = 'mensuel'; // période par défaut
    
    buttons.forEach(btn => {
        if (btn.classList.contains('active')) {
            currentPeriod = btn.dataset.period;
        }
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Si on ne change pas de période, ne rien faire
    if (currentPeriod === period) {
        return;
    }
    
    // Mettre à jour tous les inputs de cette section avec conversion automatique
    const sectionElement = buttons[0].closest('.bloc-content');
    if (!sectionElement) return;
    
    if (section === 'gites') {
        // Pour les charges des gîtes : convertir directement tous les inputs number
        const inputs = sectionElement.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            if (input && input.value && input.value !== '') {
                const currentValue = parseFloat(input.value) || 0;
                let newValue;
                
                if (currentPeriod === 'mensuel' && period === 'annuel') {
                    // Mensuel → Annuel : multiplier par 12
                    newValue = currentValue * 12;
                } else if (currentPeriod === 'annuel' && period === 'mensuel') {
                    // Annuel → Mensuel : diviser par 12
                    newValue = currentValue / 12;
                } else {
                    newValue = currentValue;
                }
                
                input.value = newValue.toFixed(2);
            }
        });
    } else if (section === 'frais_pro') {
        // Pour les frais professionnels : convertir directement les valeurs des inputs
        // Liste des champs de frais professionnels (sans telephone et fournitures qui ont leurs propres selects)
        const fraisProFields = ['comptable', 'frais_bancaires', 'materiel_info', 'rc_pro', 'formation'];
        
        fraisProFields.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input && input.value && input.value !== '') {
                const currentValue = parseFloat(input.value) || 0;
                let newValue;
                
                if (currentPeriod === 'mensuel' && period === 'annuel') {
                    // Mensuel → Annuel : multiplier par 12
                    newValue = currentValue * 12;
                } else if (currentPeriod === 'annuel' && period === 'mensuel') {
                    // Annuel → Mensuel : diviser par 12
                    newValue = currentValue / 12;
                } else {
                    newValue = currentValue;
                }
                
                input.value = newValue.toFixed(2);
            }
        });
        
        // Gérer aussi telephone et fournitures qui ont leurs propres selects
        ['telephone', 'fournitures'].forEach(fieldId => {
            const typeSelect = document.getElementById(`${fieldId}_type`);
            const input = document.getElementById(fieldId);
            
            if (typeSelect && input && input.value && input.value !== '') {
                const oldPeriod = typeSelect.value;
                if (oldPeriod !== period) {
                    const currentValue = parseFloat(input.value) || 0;
                    let newValue;
                    
                    if (oldPeriod === 'mensuel' && period === 'annuel') {
                        newValue = currentValue * 12;
                    } else if (oldPeriod === 'annuel' && period === 'mensuel') {
                        newValue = currentValue / 12;
                    } else {
                        newValue = currentValue;
                    }
                    
                    input.value = newValue.toFixed(2);
                    typeSelect.value = period;
                }
            }
        });
    }
    
    // Déclencher une sauvegarde automatique
    sauvegardeAutomatique();
}

window.togglePeriodSection = togglePeriodSection;

// ==========================================
// 📊 GESTION DES AMORTISSEMENTS
// ==========================================

/**
 * Vérifie si une dépense doit être amortie et affiche le message
 * @param {string} type - 'travaux' ou 'frais'
 * @param {number} id - ID de la ligne
 */
function verifierAmortissement(type, id) {
    const descEl = document.getElementById(`${type}-desc-${id}`);
    const typeEl = document.getElementById(`${type}-type-${id}`);
    const montantEl = document.getElementById(`${type}-montant-${id}`);
    const infoEl = document.getElementById(`${type}-amortissement-${id}`);
    
    if (!descEl || !montantEl || !infoEl) return;
    
    const description = descEl.value;
    const typeChoisi = typeEl ? typeEl.value : null;
    const montant = parseFloat(montantEl.value) || 0;
    
    // Vérifier si amortissement nécessaire
    const amortissement = detecterAmortissement(description, montant, typeChoisi);
    
    if (amortissement) {
        // Afficher le message d'amortissement
        window.SecurityUtils.setInnerHTML(infoEl, `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%); border-left: 4px solid #ff9800; border-radius: 4px; margin-top: 8px; font-size: 0.9rem;">
                <span style="font-size: 1.2rem;">⏳</span>
                <span style="flex: 1;">
                    <strong>${amortissement.label}</strong> - Amortissable sur <strong>${amortissement.duree} ans</strong> jusqu'en <strong>${amortissement.anneeFin}</strong>
                    <br>
                    <span style="font-size: 0.85rem; color: #856404;">💶 ${amortissement.montantAnnuel}€/an • Création automatique des lignes futures</span>
                </span>
            </div>
        `);
        infoEl.style.display = 'block';
        
        // Stocker les infos d'amortissement dans l'élément
        infoEl.dataset.amortissement = JSON.stringify(amortissement);
    } else {
        // Cacher le message si pas d'amortissement
        infoEl.style.display = 'none';
        delete infoEl.dataset.amortissement;
    }
}

/**
 * Crée automatiquement les lignes d'amortissement pour les années futures
 * @param {string} type - 'travaux' ou 'frais'
 * @param {Object} data - Données de la dépense
 * @param {Object} amortissement - Infos d'amortissement
 */
async function creerLignesAmortissementFutures(type, data, amortissement) {
    const anneeActuelle = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        console.error('❌ [AMORTISSEMENT] Utilisateur non connecté');
        return;
    }
    
    // Préparer les données pour les années futures
    const lignesFutures = [];
    for (let annee = anneeActuelle + 1; annee <= amortissement.anneeFin; annee++) {
        lignesFutures.push({
            annee: annee,
            type: type,
            description: `${data.description} (amortissement ${annee - anneeActuelle}/${amortissement.duree})`,
            gite: data.gite,
            montant: parseFloat(amortissement.montantAnnuel),
            user_id: user.id,
            amortissement_origine: {
                annee_origine: anneeActuelle,
                duree: amortissement.duree,
                montant_total: data.montant
            }
        });
    }
    
    // Sauvegarder les lignes futures dans Supabase
    if (lignesFutures.length > 0) {
        try {
            const { data: result, error } = await window.supabaseClient
                .from('fiscalite_amortissements')
                .insert(lignesFutures);
            
            if (error) throw error;
            
            console.log(`✅ [AMORTISSEMENT] ${lignesFutures.length} lignes créées pour années futures`);
            showToast(`✅ Amortissement créé : ${lignesFutures.length} lignes sur les années ${anneeActuelle + 1}-${amortissement.anneeFin}`, 'success');
        } catch (error) {
            console.error('❌ [AMORTISSEMENT] Erreur création lignes futures:', error);
            showToast('⚠️ Erreur lors de la création des amortissements futurs', 'error');
        }
    }
}

/**
 * Charge les amortissements de l'année en cours au chargement de la page
 */
async function chargerAmortissementsAnnee(annee) {
    try {
        const { data, error } = await window.supabaseClient
            .from('fiscalite_amortissements')
            .select('*')
            .eq('annee', annee);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log(`📋 [AMORTISSEMENT] ${data.length} lignes d'amortissement chargées pour ${annee}`);
            
            // Ajouter les lignes d'amortissement dans les listes correspondantes
            data.forEach(ligne => {
                if (ligne.type === 'travaux') {
                    ajouterTravaux();
                    const id = travauxCounter;
                    document.getElementById(`travaux-desc-${id}`).value = ligne.description;
                    document.getElementById(`travaux-gite-${id}`).value = ligne.gite;
                    document.getElementById(`travaux-montant-${id}`).value = ligne.montant;
                    
                    // Marquer comme amortissement (readonly)
                    const item = document.getElementById(`travaux-${id}`);
                    if (item) {
                        const inputs = item.querySelectorAll('input');
                        const select = item.querySelector('select');
                        inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
                        if (select) select.setAttribute('disabled', 'disabled');
                        
                        // Afficher le badge amortissement
                        const infoEl = document.getElementById(`travaux-amortissement-${id}`);
                        if (infoEl && ligne.amortissement_origine) {
                            const anneeActuelle = ligne.amortissement_origine.annee_origine + ligne.amortissement_origine.duree - 1;
                            window.SecurityUtils.setInnerHTML(infoEl, `
                                <div style="padding: 8px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px; margin-top: 8px; font-size: 0.85rem;">
                                    <span style="font-size: 1.1rem;">📊</span> Amortissement issu de ${ligne.amortissement_origine.annee_origine} (${ligne.montant}€/an sur ${ligne.amortissement_origine.duree} ans)
                                </div>
                            `);
                            infoEl.style.display = 'block';
                        }
                    }
                } else if (ligne.type === 'frais') {
                    ajouterFraisDivers();
                    const id = fraisDiversCounter;
                    document.getElementById(`frais-desc-${id}`).value = ligne.description;
                    document.getElementById(`frais-gite-${id}`).value = ligne.gite;
                    document.getElementById(`frais-montant-${id}`).value = ligne.montant;
                    
                    // Marquer comme amortissement (readonly)
                    const item = document.getElementById(`frais-${id}`);
                    if (item) {
                        const inputs = item.querySelectorAll('input');
                        const select = item.querySelector('select');
                        inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
                        if (select) select.setAttribute('disabled', 'disabled');
                        
                        // Afficher le badge amortissement
                        const infoEl = document.getElementById(`frais-amortissement-${id}`);
                        if (infoEl && ligne.amortissement_origine) {
                            window.SecurityUtils.setInnerHTML(infoEl, `
                                <div style="padding: 8px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px; margin-top: 8px; font-size: 0.85rem;">
                                    <span style="font-size: 1.1rem;">📊</span> Amortissement issu de ${ligne.amortissement_origine.annee_origine} (${ligne.montant}€/an sur ${ligne.amortissement_origine.duree} ans)
                                </div>
                            `);
                            infoEl.style.display = 'block';
                        }
                    }
                } else if (ligne.type === 'produits') {
                    ajouterProduitAccueil();
                    const id = produitsCounter;
                    document.getElementById(`produits-desc-${id}`).value = ligne.description;
                    document.getElementById(`produits-gite-${id}`).value = ligne.gite;
                    document.getElementById(`produits-montant-${id}`).value = ligne.montant;
                    
                    // Marquer comme amortissement (readonly)
                    const item = document.getElementById(`produits-${id}`);
                    if (item) {
                        const inputs = item.querySelectorAll('input');
                        const select = item.querySelector('select');
                        inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
                        if (select) select.setAttribute('disabled', 'disabled');
                        
                        // Afficher le badge amortissement
                        const infoEl = document.getElementById(`produits-amortissement-${id}`);
                        if (infoEl && ligne.amortissement_origine) {
                            window.SecurityUtils.setInnerHTML(infoEl, `
                                <div style="padding: 8px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px; margin-top: 8px; font-size: 0.85rem;">
                                    <span style="font-size: 1.1rem;">📊</span> Amortissement issu de ${ligne.amortissement_origine.annee_origine} (${ligne.montant}€/an sur ${ligne.amortissement_origine.duree} ans)
                                </div>
                            `);
                            infoEl.style.display = 'block';
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ [AMORTISSEMENT] Erreur chargement:', error);
    }
}

window.verifierAmortissement = verifierAmortissement;
window.creerLignesAmortissementFutures = creerLignesAmortissementFutures;
window.chargerAmortissementsAnnee = chargerAmortissementsAnnee;
// ==========================================
// 🚗 GESTION DES KILOMÈTRES PROFESSIONNELS
// ==========================================

let trajetsAnnee = [];
// configKm et lieuxFavoris sont déclarés au début du fichier

/**
 * Initialiser la section kilomètres
 */
async function initKilometres(annee) {
    try {
        await KmManager.chargerConfigAuto();
        configKm = KmManager.getConfigAuto();
        
        // Si pas de config, afficher message d'installation
        if (!configKm) {
            afficherMessageInstallationKm();
            return;
        }
        
        await rafraichirKilometres(annee);
        await chargerDistancesGites();
        
        afficherStatusConfigKm();
    } catch (error) {
        console.error('Erreur init kilomètres:', error);
    }
}

/**
 * Afficher message d'installation si tables non créées
 */
function afficherMessageInstallationKm() {
    const container = document.getElementById('km-config-status');
    if (!container) return;
    
    window.SecurityUtils.setInnerHTML(container, `
        <div style="grid-column: 1 / -1; padding: 20px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px;">
                Tables kilomètres non créées
            </div>
            <div style="font-size: 0.9rem; opacity: 0.95; margin-bottom: 15px;">
                Veuillez exécuter le script SQL suivant dans Supabase :
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px; font-family: monospace; font-size: 0.85rem;">
                sql/create_km_management.sql
            </div>
        </div>
    `);
}

/**
 * Rafraîchir les données de kilomètres
 */
async function rafraichirKilometres(annee) {
    try {
        trajetsAnnee = await KmManager.chargerTrajets(annee);
        lieuxFavoris = await KmManager.chargerLieuxFavoris();
        
        afficherListeTrajets();
        afficherResumeMensuel();
        calculerFraisKm();
        afficherResumeVehicule(); // Afficher le résumé du véhicule
    } catch (error) {
        console.error('Erreur rafraîchissement km:', error);
    }
}

/**
 * Afficher le status de la configuration
 */
function afficherStatusConfigKm() {
    const container = document.getElementById('km-config-status');
    if (!container || !configKm) return;
    
    const status = [
        { label: 'Ménage entrée', actif: configKm.auto_menage_entree },
        { label: 'Ménage sortie', actif: configKm.auto_menage_sortie },
        { label: 'Courses', actif: configKm.auto_courses },
        { label: 'Maintenance', actif: configKm.auto_maintenance }
    ];
    
    const html = status.map(s => `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">${s.actif ? '✅' : '❌'}</span>
            <span>${s.label}</span>
        </div>
    `).join('');
    
    window.SecurityUtils.setInnerHTML(container, html);
}

/**
 * Charger et afficher les distances des gîtes
 */
async function chargerDistancesGites() {
    try {
        // Chercher les deux containers (ancien dans la page + nouveau dans le modal)
        const containerPage = document.getElementById('km-distances-gites');
        const containerModal = document.getElementById('liste-distances-gites');
        
        if (!containerModal) return; // Le modal est prioritaire maintenant
        
        const { data: gites, error } = await supabaseClient
            .from('gites')
            .select('id, name, distance_km')
            .eq('owner_user_id', (await supabaseClient.auth.getUser()).data.user.id)
            .order('name');
        
        if (error) throw error;
        
        if (!gites || gites.length === 0) {
            window.SecurityUtils.setInnerHTML(containerModal, '<p style="color: #999; font-style: italic;">Aucun gîte configuré</p>');
            return;
        }
        
        const html = gites.map(g => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                <span style="font-weight: 600;">${g.name}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input 
                        type="number" 
                        value="${g.distance_km || 0}" 
                        step="0.1" 
                        min="0"
                        onchange="sauvegarderDistanceGite('${g.id}', this.value)"
                        style="width: 80px; padding: 5px 8px; border: 2px solid #2D3436; border-radius: 6px; font-weight: 600;"
                    >
                    <span style="color: #666;">km</span>
                </div>
            </div>
        `).join('');
        
        // Mettre à jour le modal (prioritaire)
        window.SecurityUtils.setInnerHTML(containerModal, html);
    } catch (error) {
        console.error('Erreur chargement distances gîtes:', error);
    }
}

/**
 * Sauvegarder la distance d'un gîte
 */
async function sauvegarderDistanceGite(giteId, distance) {
    try {
        const { error } = await supabaseClient
            .from('gites')
            .update({ distance_km: parseFloat(distance) })
            .eq('id', giteId);
        
        if (error) throw error;
        
        afficherMessage('✅ Distance enregistrée', 'success');
    } catch (error) {
        console.error('Erreur sauvegarde distance:', error);
        afficherMessage('❌ Erreur sauvegarde distance', 'error');
    }
}

/**
 * Afficher la liste des trajets
 */
function afficherListeTrajets() {
    const container = document.getElementById('km-liste-trajets');
    if (!container) return;
    
    if (trajetsAnnee.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    const html = trajetsAnnee.map(t => {
        const typeIcons = {
            'menage_entree': '🧹',
            'menage_sortie': '🧹',
            'courses': '🛒',
            'maintenance': '🔧',
            'autre': '📍'
        };
        
        return `
            <div class="liste-item" style="display: grid; grid-template-columns: 100px 1fr 120px 120px 80px; align-items: center;">
                <span style="color: #666; font-size: 0.9rem;">${new Date(t.date_trajet).toLocaleDateString('fr-FR')}</span>
                <div>
                    <div style="font-weight: 600;">${typeIcons[t.type_trajet] || '📍'} ${t.motif}</div>
                    <div style="font-size: 0.85rem; color: #666;">${t.lieu_depart || 'Domicile'} → ${t.lieu_arrivee}</div>
                    ${t.auto_genere ? '<span style="font-size: 0.75rem; padding: 2px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px;">Auto</span>' : ''}
                </div>
                <span style="text-align: right; font-weight: 600;">${t.distance_aller.toFixed(1)} km ${t.aller_retour ? 'A/R' : 'aller'}</span>
                <span style="text-align: right; font-weight: 700; color: #27ae60;">${t.distance_totale.toFixed(1)} km</span>
                <div style="display: flex; gap: 5px; justify-content: flex-end;">
                    ${!t.auto_genere ? `
                        <button onclick="supprimerTrajet('${t.id}')" class="btn-icon" title="Supprimer">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    window.SecurityUtils.setInnerHTML(container, html);
}

/**
 * Afficher TOUS les trajets groupés par mois
 */
function afficherTousTrajets() {
    const container = document.getElementById('km-liste-trajets');
    if (!container) return;
    
    if (trajetsAnnee.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    // Grouper par mois
    const parMois = KmManager.grouperParMois(trajetsAnnee);
    
    const typeIcons = {
        'menage_entree': '🧹',
        'menage_sortie': '🧹',
        'courses': '🛒',
        'maintenance': '🔧',
        'autre': '📍'
    };
    
    const html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px solid #667eea;">
            <h4 style="margin: 0;">📅 Tous les trajets ${anneeSelectionnee}</h4>
            <button onclick="masquerTrajetsMois()" style="padding: 8px 16px; background: #e0e0e0; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                ✕ Fermer
            </button>
        </div>
        ${parMois.map(m => {
            const [annee, mois] = m.mois.split('-');
            const nomMois = new Date(annee, parseInt(mois) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            
            return `
                <div style="margin-bottom: 25px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 1rem; font-weight: 600; text-transform: capitalize;">${nomMois}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">${m.trajets.length} trajet${m.trajets.length > 1 ? 's' : ''} • ${m.totalKm.toFixed(0)} km</div>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 0 0 8px 8px; border: 2px solid #e0e0e0; border-top: none;">
                        ${m.trajets.map(t => `
                            <div style="display: grid; grid-template-columns: 90px 1fr 110px 110px 60px; gap: 10px; align-items: center; padding: 10px; background: white; border-radius: 6px; margin-bottom: 6px; border: 1px solid #e0e0e0;">
                                <span style="color: #666; font-size: 0.85rem;">${new Date(t.date_trajet).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                <div>
                                    <div style="font-weight: 600; font-size: 0.9rem;">${typeIcons[t.type_trajet] || '📍'} ${t.motif}</div>
                                    <div style="font-size: 0.8rem; color: #666;">${t.lieu_depart || 'Domicile'} → ${t.lieu_arrivee}</div>
                                    ${t.auto_genere ? '<span style="font-size: 0.7rem; padding: 2px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px; margin-top: 3px; display: inline-block;">Auto</span>' : ''}
                                </div>
                                <span style="text-align: right; font-size: 0.85rem; color: #666;">${t.distance_aller.toFixed(1)} km ${t.aller_retour ? 'A/R' : ''}</span>
                                <span style="text-align: right; font-weight: 700; color: #27ae60; font-size: 0.95rem;">${t.distance_totale.toFixed(1)} km</span>
                                <div style="text-align: right;">
                                    ${!t.auto_genere ? `
                                        <button onclick="supprimerTrajet('${t.id}')" class="btn-icon" style="background: #ff4444; color: white; padding: 5px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                            🗑️
                                        </button>
                                    ` : '<span style="font-size: 0.75rem; color: #bbb;">—</span>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('')}
    `;
    
    window.SecurityUtils.setInnerHTML(container, html);
    container.style.display = 'block';
    
    // Scroller vers la liste
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Afficher les trajets d'un mois spécifique
 */
function afficherTrajetsMois(moisStr) {
    const container = document.getElementById('km-liste-trajets');
    if (!container) return;
    
    // Filtrer les trajets du mois
    const trajetsMois = trajetsAnnee.filter(t => {
        const dateMois = new Date(t.date_trajet).toISOString().substring(0, 7); // YYYY-MM
        return dateMois === moisStr;
    });
    
    if (trajetsMois.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    const [annee, mois] = moisStr.split('-');
    const nomMois = new Date(annee, parseInt(mois) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    const typeIcons = {
        'menage_entree': '🧹',
        'menage_sortie': '🧹',
        'courses': '🛒',
        'maintenance': '🔧',
        'autre': '📍'
    };
    
    const html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0; text-transform: capitalize;">📅 ${nomMois}</h4>
            <button onclick="masquerTrajetsMois()" style="padding: 6px 12px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">
                ✕ Fermer
            </button>
        </div>
        ${trajetsMois.map(t => `
            <div class="liste-item" style="display: grid; grid-template-columns: 100px 1fr 120px 120px 80px; gap: 10px; align-items: center; padding: 10px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px;">
                <span style="color: #666; font-size: 0.9rem;">${new Date(t.date_trajet).toLocaleDateString('fr-FR')}</span>
                <div>
                    <div style="font-weight: 600;">${typeIcons[t.type_trajet] || '📍'} ${t.motif}</div>
                    <div style="font-size: 0.85rem; color: #666;">${t.lieu_depart || 'Domicile'} → ${t.lieu_arrivee}</div>
                    ${t.auto_genere ? '<span style="font-size: 0.75rem; padding: 2px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px; margin-top: 4px; display: inline-block;">Auto</span>' : ''}
                </div>
                <span style="text-align: right; font-weight: 600;">${t.distance_aller.toFixed(1)} km ${t.aller_retour ? 'A/R' : 'aller'}</span>
                <span style="text-align: right; font-weight: 700; color: #27ae60;">${t.distance_totale.toFixed(1)} km</span>
                <div style="text-align: right;">
                    ${!t.auto_genere ? `
                        <button onclick="supprimerTrajet('${t.id}')" class="btn-icon" style="background: #ff4444; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                            🗑️
                        </button>
                    ` : '<span style="font-size: 0.8rem; color: #999;">—</span>'}
                </div>
            </div>
        `).join('')}
    `;
    
    window.SecurityUtils.setInnerHTML(container, html);
    container.style.display = 'grid';
    
    // Scroller vers la liste
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Masquer la liste des trajets
 */
function masquerTrajetsMois() {
    const container = document.getElementById('km-liste-trajets');
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Afficher le résumé mensuel avec bouton Voir
 */
function afficherResumeMensuel() {
    const container = document.getElementById('km-resume-mensuel');
    const resumeAnnuel = document.getElementById('km-resume-annuel');
    
    if (!container) return;
    
    const parMois = KmManager.grouperParMois(trajetsAnnee);
    
    // Calculer le total annuel
    const totalAnnuelKm = parMois.reduce((sum, m) => sum + m.totalKm, 0);
    const totalTrajets = parMois.reduce((sum, m) => sum + m.trajets.length, 0);
    const vehiculeType = document.getElementById('vehicule_type')?.value || 'thermique';
    const puissance = parseInt(document.getElementById('puissance_fiscale')?.value || 5);
    const montantTotal = KmManager.calculerMontantDeductible(totalAnnuelKm, puissance, vehiculeType);
    
    // Mettre à jour le résumé annuel
    if (resumeAnnuel) {
        const kmTotalEl = document.getElementById('km-total-annuel');
        const nbTrajetsEl = document.getElementById('km-nombre-trajets');
        const montantTotalEl = document.getElementById('km-montant-total');
        
        if (kmTotalEl) kmTotalEl.textContent = `${totalAnnuelKm.toFixed(0)} km`;
        if (nbTrajetsEl) nbTrajetsEl.textContent = totalTrajets;
        if (montantTotalEl) montantTotalEl.textContent = `${montantTotal.toFixed(2)} €`;
        
        // Afficher/masquer selon données
        resumeAnnuel.style.display = totalTrajets > 0 ? 'block' : 'none';
    }
    
    if (parMois.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="color: #999; font-style: italic; text-align: center; padding: 20px;">Aucun trajet enregistré pour l\'instant</p>');
        return;
    }
    
    const html = parMois.map(m => {
        const [annee, mois] = m.mois.split('-');
        const nomMois = new Date(annee, parseInt(mois) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        return `
            <div style="padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 0.85rem; opacity: 0.9; text-transform: capitalize; font-weight: 500;">${nomMois}</div>
                <div style="font-size: 1.5rem; font-weight: 700; margin: 8px 0;">${m.totalKm.toFixed(0)} km</div>
                <div style="font-size: 0.85rem; opacity: 0.9;">${m.trajets.length} trajet${m.trajets.length > 1 ? 's' : ''}</div>
            </div>
        `;
    }).join('');
    
    window.SecurityUtils.setInnerHTML(container, html);
    
    // Mettre à jour automatiquement les champs fiscalité
    calculerFraisKm();
}

/**
 * Toggle le champ puissance fiscale selon le type de véhicule
 */
function togglePuissanceField() {
    const vehiculeType = document.getElementById('vehicule_type')?.value || 'thermique';
    const puissanceGroup = document.getElementById('puissance-group');
    
    if (puissanceGroup) {
        // Masquer pour électrique (barème unique), afficher pour thermique
        puissanceGroup.style.display = vehiculeType === 'electrique' ? 'none' : 'block';
    }
}

/**
 * Calculer les frais kilométriques
 */
function calculerFraisKm() {
    const totalKm = KmManager.calculerTotalKm(trajetsAnnee);
    const vehiculeType = document.getElementById('vehicule_type')?.value || 'thermique';
    const puissance = parseInt(document.getElementById('puissance_fiscale')?.value || 5);
    const montant = KmManager.calculerMontantDeductible(totalKm, puissance, vehiculeType);
    
    const kmInput = document.getElementById('km_professionnels');
    const montantInput = document.getElementById('montant_frais_km');
    
    if (kmInput) kmInput.value = Math.round(totalKm);
    if (montantInput) montantInput.value = montant.toFixed(2);
    
    // Afficher/masquer le champ puissance
    togglePuissanceField();
    
    calculerTempsReel();
}

/**
 * Modal : Ajouter un trajet
 */
async function afficherModalAjoutTrajet() {
    try {
        const modal = document.getElementById('modal-ajout-trajet');
        if (!modal) {
            console.error('❌ Modal non trouvé - le tab n\'est pas chargé');
            showToast('Veuillez d\'abord ouvrir l\'onglet Fiscalité', 'warning');
            return;
        }
        
        // Afficher le modal d'abord
        modal.style.display = 'flex';
        
        // Réinitialiser le formulaire
        document.getElementById('form-ajout-trajet').reset();
        document.getElementById('trajet-date').valueAsDate = new Date();
        document.getElementById('trajet-depart').value = 'Domicile';
        document.getElementById('trajet-aller-retour').checked = true;
        document.getElementById('trajet-destination-autre-group').style.display = 'none';
        
        // Remplir les options de destination (recrée les optgroup si nécessaire)
        await remplirOptionsDestination();
    } catch (error) {
        console.error('❌ [MODAL] Erreur ouverture modal:', error);
        showToast('Erreur ouverture modal trajet', 'error');
    }
}

function fermerModalTrajet() {
    const modal = document.getElementById('modal-ajout-trajet');
    if (modal) modal.style.display = 'none';
}

/**
 * Remplir les options de destination
 */
async function remplirOptionsDestination() {
    try {
        // Vérifier que le select existe (sinon le tab n'est pas chargé)
        const selectDestination = document.getElementById('trajet-destination');
        if (!selectDestination) {
            console.error('❌ Select trajet-destination non trouvé - tab non chargé');
            return;
        }
        
        // 🔧 RECRÉER les optgroup s'ils ont été supprimés par SecurityUtils
        let optgroupGites = selectDestination.querySelector('#optgroup-gites-trajet');
        let optgroupLieux = selectDestination.querySelector('#optgroup-lieux-trajet');
        
        if (!optgroupGites || !optgroupLieux) {
            console.log('🔧 Recréation des optgroup manquants...');
            
            // Récupérer l'option "autre" si elle existe
            const optionAutre = selectDestination.querySelector('option[value="autre"]');
            
            // Reconstruire le select
            selectDestination.innerHTML = '<option value="">-- Choisir --</option>';
            
            // Créer optgroup gîtes
            optgroupGites = document.createElement('optgroup');
            optgroupGites.id = 'optgroup-gites-trajet';
            optgroupGites.label = 'Gîtes';
            selectDestination.appendChild(optgroupGites);
            
            // Créer optgroup lieux
            optgroupLieux = document.createElement('optgroup');
            optgroupLieux.id = 'optgroup-lieux-trajet';
            optgroupLieux.label = 'Lieux favoris';
            selectDestination.appendChild(optgroupLieux);
            
            // Remettre l'option "autre"
            if (optionAutre) {
                selectDestination.appendChild(optionAutre.cloneNode(true));
            } else {
                const newOptionAutre = document.createElement('option');
                newOptionAutre.value = 'autre';
                newOptionAutre.textContent = '🖊️ Autre (saisir manuellement)';
                selectDestination.appendChild(newOptionAutre);
            }
        }
        
        // Charger les gîtes
        const { data: gites } = await supabaseClient
            .from('gites')
            .select('id, name, distance_km')
            .eq('owner_user_id', (await supabaseClient.auth.getUser()).data.user.id)
            .order('name');
        
        if (gites && gites.length > 0) {
            const htmlGites = gites.map(g => 
                `<option value="gite-${g.id}" data-distance="${g.distance_km || 0}">${g.name} (${g.distance_km || 0} km)</option>`
            ).join('');
            window.SecurityUtils.setInnerHTML(optgroupGites, htmlGites);
        } else {
            window.SecurityUtils.setInnerHTML(optgroupGites, '<option disabled>Aucun gîte</option>');
        }
        
        // Charger les lieux favoris
        const lieuxFav = await KmManager.chargerLieuxFavoris();
        
        if (lieuxFav && lieuxFav.length > 0) {
            const htmlLieux = lieuxFav.map(l => 
                `<option value="lieu-${l.id}" data-distance="${l.distance_km}">${l.nom} (${l.distance_km} km)</option>`
            ).join('');
            window.SecurityUtils.setInnerHTML(optgroupLieux, htmlLieux);
        } else {
            window.SecurityUtils.setInnerHTML(optgroupLieux, '<option disabled>⚠️ Aucun lieu favori</option>');
        }
    } catch (error) {
        console.error('Erreur remplissage destinations:', error);
    }
}

function updateMotifTrajet() {
    const type = document.getElementById('trajet-type').value;
    const motifInput = document.getElementById('trajet-motif');
    
    const motifs = {
        'menage_entree': 'Ménage entrée',
        'menage_sortie': 'Ménage sortie',
        'courses': 'Courses',
        'maintenance': 'Maintenance',
        'autre': ''
    };
    
    if (motifs[type]) {
        motifInput.value = motifs[type];
    }
}

function updateDistanceTrajet() {
    const select = document.getElementById('trajet-destination');
    const option = select.options[select.selectedIndex];
    const distanceInput = document.getElementById('trajet-distance');
    const autreGroup = document.getElementById('trajet-destination-autre-group');
    
    if (select.value === 'autre') {
        autreGroup.style.display = 'block';
        distanceInput.value = '';
    } else {
        autreGroup.style.display = 'none';
        const distance = option.getAttribute('data-distance');
        if (distance) {
            distanceInput.value = distance;
            calculerDistanceTotaleTrajet();
        }
    }
}

// Event listener pour calcul distance totale
document.addEventListener('DOMContentLoaded', () => {
    const distanceInput = document.getElementById('trajet-distance');
    const arCheckbox = document.getElementById('trajet-aller-retour');
    
    if (distanceInput) distanceInput.addEventListener('input', calculerDistanceTotaleTrajet);
    if (arCheckbox) arCheckbox.addEventListener('change', calculerDistanceTotaleTrajet);
});

function calculerDistanceTotaleTrajet() {
    const distance = parseFloat(document.getElementById('trajet-distance')?.value || 0);
    const ar = document.getElementById('trajet-aller-retour')?.checked || false;
    const totale = ar ? distance * 2 : distance;
    
    const totaleInput = document.getElementById('trajet-distance-totale');
    if (totaleInput) totaleInput.value = totale.toFixed(1);
}

/**
 * Soumettre le formulaire de trajet
 */
async function soumettreTrajet(event) {
    event.preventDefault();
    console.log('🚗 [TRAJET] Début soumission...');
    
    try {
        // Vérifier que KmManager existe
        if (!window.KmManager) {
            throw new Error('KmManager non chargé - Vérifier que km-manager.js est bien chargé');
        }
        
        const form = event.target;
        const destination = document.getElementById('trajet-destination').value;
        
        console.log('🚗 [TRAJET] Destination:', destination);
        
        let giteId = null;
        let lieuArrivee = '';
        
        if (destination.startsWith('gite-')) {
            giteId = destination.replace('gite-', '');
            const select = document.getElementById('trajet-destination');
            lieuArrivee = select.options[select.selectedIndex].text.split(' (')[0];
        } else if (destination === 'autre') {
            lieuArrivee = document.getElementById('trajet-destination-autre').value;
        } else {
            const select = document.getElementById('trajet-destination');
            lieuArrivee = select.options[select.selectedIndex].text.split(' (')[0];
        }
        
        const trajetData = {
            date_trajet: document.getElementById('trajet-date').value,
            motif: document.getElementById('trajet-motif').value,
            type_trajet: document.getElementById('trajet-type').value,
            lieu_depart: document.getElementById('trajet-depart').value === 'Domicile' ? null : document.getElementById('trajet-depart').value,
            lieu_arrivee: lieuArrivee,
            gite_id: giteId,
            distance_aller: parseFloat(document.getElementById('trajet-distance').value),
            aller_retour: document.getElementById('trajet-aller-retour').checked,
            notes: document.getElementById('trajet-notes').value || null
        };
        
        console.log('🚗 [TRAJET] Données:', trajetData);
        
        const result = await window.KmManager.ajouterTrajet(trajetData);
        console.log('✅ [TRAJET] Trajet ajouté:', result);
        
        fermerModalTrajet();
        await rafraichirKilometres(window.anneeSelectionnee || new Date().getFullYear());
        showToast('✅ Trajet enregistré', 'success');
    } catch (error) {
        console.error('❌ [TRAJET] Erreur détaillée:', error);
        console.error('❌ [TRAJET] Message:', error.message);
        console.error('❌ [TRAJET] Stack:', error.stack);
        showToast(`❌ Erreur: ${error.message}`, 'error');
    }
}

/**
 * Supprimer un trajet
 */
async function supprimerTrajet(trajetId) {
    if (!confirm('Supprimer ce trajet ?')) return;
    
    try {
        await KmManager.supprimerTrajet(trajetId);
        await rafraichirKilometres(window.anneeSelectionnee || new Date().getFullYear());
        afficherMessage('✅ Trajet supprimé', 'success');
    } catch (error) {
        console.error('Erreur suppression trajet:', error);
        afficherMessage('❌ Erreur suppression', 'error');
    }
}

/**
 * Modal : Configuration automatisation
 */
async function afficherModalConfigKm() {
    const modal = document.getElementById('modal-config-km');
    if (!modal) return;
    
    if (!configKm) {
        configKm = await KmManager.chargerConfigAuto();
    }
    
    if (configKm) {
        document.getElementById('config-auto-menage-entree').checked = configKm.auto_menage_entree;
        document.getElementById('config-auto-menage-sortie').checked = configKm.auto_menage_sortie;
        document.getElementById('config-auto-courses').checked = configKm.auto_courses;
        document.getElementById('config-auto-maintenance').checked = configKm.auto_maintenance;
    }
    
    modal.style.display = 'flex';
}

function fermerModalConfigKm() {
    const modal = document.getElementById('modal-config-km');
    if (modal) modal.style.display = 'none';
}

async function sauvegarderConfigKm(event) {
    event.preventDefault();
    
    try {
        const config = {
            auto_menage_entree: document.getElementById('config-auto-menage-entree').checked,
            auto_menage_sortie: document.getElementById('config-auto-menage-sortie').checked,
            auto_courses: document.getElementById('config-auto-courses').checked,
            auto_maintenance: document.getElementById('config-auto-maintenance').checked
        };
        
        await KmManager.sauvegarderConfigAuto(config);
        configKm = KmManager.getConfigAuto();
        
        fermerModalConfigKm();
        afficherStatusConfigKm();
        afficherMessage('✅ Configuration enregistrée', 'success');
    } catch (error) {
        console.error('Erreur sauvegarde config:', error);
        afficherMessage('❌ Erreur sauvegarde', 'error');
    }
}

/**
 * Modal : Lieux favoris
 */
async function afficherModalLieuxFavoris() {
    const modal = document.getElementById('modal-lieux-favoris');
    if (!modal) return;
    
    await chargerDistancesGites();
    await afficherListeLieuxFavoris();
    
    modal.style.display = 'flex';
}

function fermerModalLieuxFavoris() {
    const modal = document.getElementById('modal-lieux-favoris');
    if (modal) modal.style.display = 'none';
}

async function afficherListeLieuxFavoris() {
    const container = document.getElementById('liste-lieux-favoris');
    if (!container) return;
    
    const lieux = await KmManager.chargerLieuxFavoris();
    
    if (lieux.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="color: #999; font-style: italic; text-align: center; padding: 20px;">Aucun lieu enregistré</p>');
        return;
    }
    
    const html = lieux.map(l => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
            <div>
                <div style="font-weight: 600;">${l.nom}</div>
                ${l.adresse ? `<div style="font-size: 0.85rem; color: #666;">${l.adresse}</div>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: #27ae60;">${l.distance_km} km</span>
                <button onclick="supprimerLieuFavori('${l.id}')" class="btn-icon" title="Supprimer">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
    
    window.SecurityUtils.setInnerHTML(container, html);
}

function afficherFormulaireNouveauLieu() {
    document.getElementById('form-nouveau-lieu').style.display = 'block';
    document.getElementById('nouveau-lieu-nom').value = '';
    document.getElementById('nouveau-lieu-distance').value = '';
    document.getElementById('nouveau-lieu-adresse').value = '';
}

function annulerNouveauLieu() {
    document.getElementById('form-nouveau-lieu').style.display = 'none';
}

async function enregistrerNouveauLieu() {
    try {
        const nom = document.getElementById('nouveau-lieu-nom').value.trim();
        const distance = parseFloat(document.getElementById('nouveau-lieu-distance').value);
        const adresse = document.getElementById('nouveau-lieu-adresse').value.trim();
        
        if (!nom || !distance) {
            afficherMessage('❌ Nom et distance requis', 'error');
            return;
        }
        
        await KmManager.ajouterLieuFavori({
            nom,
            distance_km: distance,
            adresse: adresse || null
        });
        
        annulerNouveauLieu();
        await afficherListeLieuxFavoris();
        // Pas besoin de recharger ici, ça sera fait à l'ouverture du modal trajet
        afficherMessage('✅ Lieu ajouté', 'success');
    } catch (error) {
        console.error('Erreur ajout lieu:', error);
        afficherMessage('❌ Erreur ajout lieu', 'error');
    }
}

async function supprimerLieuFavori(lieuId) {
    if (!confirm('Supprimer ce lieu ?')) return;
    
    try {
        await KmManager.supprimerLieuFavori(lieuId);
        await afficherListeLieuxFavoris();
        // Pas besoin de recharger ici, ça sera fait à l'ouverture du modal trajet
        afficherMessage('✅ Lieu supprimé', 'success');
    } catch (error) {
        console.error('Erreur suppression lieu:', error);
        afficherMessage('❌ Erreur suppression', 'error');
    }
}

/**
 * Export CSV
 */
function exporterTrajetsCSV() {
    const annee = window.anneeSelectionnee || new Date().getFullYear();
    KmManager.exporterCSV(trajetsAnnee, annee);
}

// Exports globaux
window.initKilometres = initKilometres;
window.rafraichirKilometres = rafraichirKilometres;
window.calculerFraisKm = calculerFraisKm;
window.sauvegarderDistanceGite = sauvegarderDistanceGite;
window.afficherModalAjoutTrajet = afficherModalAjoutTrajet;
window.fermerModalTrajet = fermerModalTrajet;
window.soumettreTrajet = soumettreTrajet;
window.supprimerTrajet = supprimerTrajet;
window.updateMotifTrajet = updateMotifTrajet;
window.updateDistanceTrajet = updateDistanceTrajet;
window.afficherModalConfigKm = afficherModalConfigKm;
window.fermerModalConfigKm = fermerModalConfigKm;
window.sauvegarderConfigKm = sauvegarderConfigKm;
window.afficherModalLieuxFavoris = afficherModalLieuxFavoris;
window.fermerModalLieuxFavoris = fermerModalLieuxFavoris;
window.afficherFormulaireNouveauLieu = afficherFormulaireNouveauLieu;
window.annulerNouveauLieu = annulerNouveauLieu;
window.enregistrerNouveauLieu = enregistrerNouveauLieu;
window.supprimerLieuFavori = supprimerLieuFavori;
window.exporterTrajetsCSV = exporterTrajetsCSV;
window.afficherModalConfigVehicule = afficherModalConfigVehicule;
window.fermerModalConfigVehicule = fermerModalConfigVehicule;
window.enregistrerConfigVehicule = enregistrerConfigVehicule;
window.togglePuissanceFieldModal = togglePuissanceFieldModal;
// Crédits personnels
window.ajouterLigneCredit = ajouterLigneCredit;
window.supprimerCredit = supprimerCredit;
window.mettreAJourCredit = mettreAJourCredit;


// ==========================================
// 📌 GESTION MODAL CONFIGURATION VÉHICULE
// ==========================================

/**
 * Afficher le modal de configuration véhicule
 */
function afficherModalConfigVehicule() {
    const modal = document.getElementById('modal-config-vehicule');
    if (!modal) return;
    
    // Charger les valeurs actuelles depuis les champs cachés
    const vehiculeType = document.getElementById('vehicule_type')?.value || 'thermique';
    const puissanceFiscale = document.getElementById('puissance_fiscale')?.value || '5';
    
    document.getElementById('modal-vehicule-type').value = vehiculeType;
    document.getElementById('modal-puissance-fiscale').value = puissanceFiscale;
    
    togglePuissanceFieldModal();
    mettreAJourAperçuVehicule();
    
    modal.style.display = 'flex';
}

/**
 * Fermer le modal véhicule
 */
function fermerModalConfigVehicule() {
    const modal = document.getElementById('modal-config-vehicule');
    if (modal) modal.style.display = 'none';
}

/**
 * Toggle champ puissance dans le modal
 */
function togglePuissanceFieldModal() {
    const vehiculeType = document.getElementById('modal-vehicule-type')?.value || 'thermique';
    const puissanceGroup = document.getElementById('modal-puissance-group');
    
    if (puissanceGroup) {
        puissanceGroup.style.display = vehiculeType === 'electrique' ? 'none' : 'block';
    }
    
    mettreAJourAperçuVehicule();
}

/**
 * Mettre à jour l'aperçu dans le modal
 */
function mettreAJourAperçuVehicule() {
    const vehiculeType = document.getElementById('modal-vehicule-type')?.value || 'thermique';
    const puissance = parseInt(document.getElementById('modal-puissance-fiscale')?.value || 5);
    const totalKm = KmManager.calculerTotalKm(trajetsAnnee);
    const montant = KmManager.calculerMontantDeductible(totalKm, puissance, vehiculeType);
    
    document.getElementById('modal-km-total').textContent = `${Math.round(totalKm)} km`;
    document.getElementById('modal-montant-deductible').textContent = `${montant.toFixed(2)} €`;
}

/**
 * Enregistrer la configuration véhicule
 */
function enregistrerConfigVehicule() {
    const vehiculeType = document.getElementById('modal-vehicule-type').value;
    const puissanceFiscale = document.getElementById('modal-puissance-fiscale').value;
    
    // Mettre à jour les champs cachés
    if (document.getElementById('vehicule_type')) {
        document.getElementById('vehicule_type').value = vehiculeType;
    }
    if (document.getElementById('puissance_fiscale')) {
        document.getElementById('puissance_fiscale').value = puissanceFiscale;
    }
    
    // Recalculer et sauvegarder
    calculerFraisKm();
    sauvegardeAutomatique();
    
    // Mettre à jour le résumé
    afficherResumeVehicule();
    
    fermerModalConfigVehicule();
    afficherMessage('✅ Véhicule enregistré', 'success');
}

/**
 * Afficher le résumé du véhicule
 */
function afficherResumeVehicule() {
    const container = document.getElementById('vehicule-resume');
    if (!container) return;
    
    const vehiculeType = document.getElementById('vehicule_type')?.value || 'thermique';
    const puissance = document.getElementById('puissance_fiscale')?.value || '5';
    const totalKm = KmManager.calculerTotalKm(trajetsAnnee);
    const montant = KmManager.calculerMontantDeductible(totalKm, parseInt(puissance), vehiculeType);
    
    const typeLabel = vehiculeType === 'electrique' 
        ? '<span style="display: inline-flex; align-items: center; gap: 4px;">⚡ Électrique</span>' 
        : `<span style="display: inline-flex; align-items: center; gap: 4px;">🛢️ Thermique ${puissance} CV</span>`;
    
    if (totalKm === 0) {
        window.SecurityUtils.setInnerHTML(container, '<span style="color: #90a4ae; font-size: 0.9rem;">Aucun trajet enregistré</span>');
        return;
    }
    
    const html = `
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <span style="font-weight: 600; color: #37474f;">${typeLabel}</span>
            <span style="color: #90a4ae;">•</span>
            <span style="font-weight: 500; color: #546e7a;">${Math.round(totalKm)} km</span>
            <span style="color: #90a4ae;">•</span>
            <span style="font-weight: 700; color: #2e7d32; font-size: 1.05rem;">${montant.toFixed(2)} €</span>
        </div>
    `;
    
    window.SecurityUtils.setInnerHTML(container, html);
}

// ==========================================
// ==========================================
// GESTION DES CRÉDITS PERSONNELS
// ==========================================

/**
 * Ajouter une ligne de crédit
 */
function ajouterLigneCredit() {
    const nouveauCredit = {
        id: Date.now().toString(),
        intitule: '',
        montant_mensuel: 0
    };
    
    creditsPersonnels.push(nouveauCredit);
    afficherListeCredits();
}

/**
 * Supprimer un crédit
 */
function supprimerCredit(id) {
    if (!confirm('Supprimer ce crédit ?')) return;
    
    creditsPersonnels = creditsPersonnels.filter(c => c.id !== id);
    afficherListeCredits();
    calculerTotalCredits();
    sauvegardeAutomatique();
}

/**
 * Afficher la liste des crédits
 */
function afficherListeCredits() {
    const container = document.getElementById('liste-credits-personnels');
    if (!container) return;
    
    if (creditsPersonnels.length === 0) {
        window.SecurityUtils.setInnerHTML(container, `
            <p style="color: #999; font-style: italic; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                Aucun crédit enregistré. Cliquez sur "Ajouter un crédit" pour commencer.
            </p>
        `);
        calculerTotalCredits();
        return;
    }
    
    const html = creditsPersonnels.map(credit => `
        <div style="display: grid; grid-template-columns: 1fr 150px 60px; gap: 10px; align-items: center; padding: 12px; background: white; border-radius: 8px; border: 2px solid #e0e0e0;">
            <input 
                type="text" 
                value="${credit.intitule}" 
                onchange="mettreAJourCredit('${credit.id}', 'intitule', this.value)"
                placeholder="Ex: Crédit immobilier, Prêt auto..."
                style="padding: 8px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.95rem;"
            >
            <div style="display: flex; align-items: center; gap: 5px;">
                <input 
                    type="number" 
                    value="${credit.montant_mensuel}" 
                    onchange="mettreAJourCredit('${credit.id}', 'montant_mensuel', parseFloat(this.value))"
                    step="0.01" 
                    min="0"
                    placeholder="0.00"
                    style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 6px; font-weight: 600; text-align: right;"
                >
                <span style="color: #666; font-size: 0.9rem;">€/mois</span>
            </div>
            <button 
                onclick="supprimerCredit('${credit.id}')" 
                class="btn-icon"
                title="Supprimer"
                style="background: #fff; border: 2px solid #e0e0e0; border-radius: 6px; padding: 8px; cursor: pointer; font-size: 1.2rem; transition: all 0.2s;"
            >
                🗑️
            </button>
        </div>
    `).join('');
    
    window.SecurityUtils.setInnerHTML(container, html);
    calculerTotalCredits();
}

/**
 * Mettre à jour un crédit
 */
function mettreAJourCredit(id, champ, valeur) {
    const credit = creditsPersonnels.find(c => c.id === id);
    if (credit) {
        credit[champ] = valeur;
        calculerTotalCredits();
        sauvegardeAutomatique();
    }
}

/**
 * Calculer le total des crédits
 */
function calculerTotalCredits() {
    const total = creditsPersonnels.reduce((sum, c) => sum + (parseFloat(c.montant_mensuel) || 0), 0);
    
    // Afficher dans le bloc crédits
    const display = document.getElementById('total-credits-display');
    if (display) {
        display.textContent = `${total.toFixed(2)} €`;
    }
    
    // Mettre à jour dans le reste à vivre
    calculerTempsReel();
    
    return total;
}

/**
 * Charger les crédits depuis les données sauvegardées
 */
function chargerCreditsPersonnels(details) {
    if (details && details.credits_personnels) {
        creditsPersonnels = details.credits_personnels;
    } else {
        creditsPersonnels = [];
    }
    afficherListeCredits();
}

/**
 * Obtenir les crédits pour la sauvegarde
 */
function getCreditsPersonnels() {
    return creditsPersonnels;
}

// ==========================================
// FIN GESTION DES CRÉDITS PERSONNELS
// ==========================================

// ==========================================
// GESTION SECTION PERSONNELLE (toggle)
// ==========================================

/**
 * Afficher la modal des options personnelles
 */
function afficherModalOptions() {
    const modal = document.getElementById('modal-options');
    if (!modal) return;
    
    // Vérifier l'état actuel de la section
    const section = document.getElementById('section-personnelle');
    const checkbox = document.getElementById('checkbox-activer-perso');
    
    if (section && checkbox) {
        // Charger depuis localStorage
        const saved = localStorage.getItem('fiscalite_options_perso');
        if (saved !== null) {
            checkbox.checked = saved === 'true';
        } else {
            checkbox.checked = section.style.display === 'block';
        }
    }
    
    modal.style.display = 'flex';
}

/**
 * Fermer la modal des options
 */
function fermerModalOptions() {
    const modal = document.getElementById('modal-options');
    if (modal) modal.style.display = 'none';
}

/**
 * Toggle les options personnelles depuis la checkbox
 */
function toggleOptionsPersonnelles() {
    const checkbox = document.getElementById('checkbox-activer-perso');
    const section = document.getElementById('section-personnelle');
    
    if (!checkbox || !section) return;
    
    if (checkbox.checked) {
        section.style.display = 'block';
        localStorage.setItem('fiscalite_options_perso', 'true');
    } else {
        section.style.display = 'none';
        localStorage.setItem('fiscalite_options_perso', 'false');
    }
}

/**
 * Restaurer l'état des options personnelles depuis localStorage
 */
function restaurerOptionsPersonnelles() {
    const saved = localStorage.getItem('fiscalite_options_perso');
    const section = document.getElementById('section-personnelle');
    const checkbox = document.getElementById('checkbox-activer-perso');
    
    if (!section) return;
    
    if (saved === 'true') {
        section.style.display = 'block';
        if (checkbox) checkbox.checked = true;
    } else {
        // Par défaut ou si 'false' : masquer
        section.style.display = 'none';
        if (checkbox) checkbox.checked = false;
    }
}

/**
 * Legacy function - redirige vers la modal
 */
function toggleSectionPersonnelle() {
    afficherModalOptions();
}

// Exporter globalement
window.afficherModalOptions = afficherModalOptions;
window.fermerModalOptions = fermerModalOptions;
window.toggleOptionsPersonnelles = toggleOptionsPersonnelles;
window.toggleSectionPersonnelle = toggleSectionPersonnelle;
window.restaurerOptionsPersonnelles = restaurerOptionsPersonnelles;

// ==========================================
// GESTION TRÉSORERIE SIMPLIFIÉE
// ==========================================

/**
 * Afficher modal ajout solde
 */
function afficherModalAjoutSolde() {
    const modal = document.getElementById('modal-ajout-solde');
    if (!modal) return;
    
    // Réinitialiser le formulaire
    document.getElementById('modal-solde-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-solde-montant').value = '';
    
    modal.style.display = 'flex';
}

/**
 * Fermer modal ajout solde
 */
function fermerModalAjoutSolde() {
    const modal = document.getElementById('modal-ajout-solde');
    if (modal) modal.style.display = 'none';
}

/**
 * Enregistrer un nouveau solde
 */
async function enregistrerSolde() {
    const date = document.getElementById('modal-solde-date').value;
    const montant = parseFloat(document.getElementById('modal-solde-montant').value);
    
    if (!date) {
        afficherMessage('⚠️ Veuillez saisir une date', 'error');
        return;
    }
    
    if (isNaN(montant)) {
        afficherMessage('⚠️ Veuillez saisir un montant valide', 'error');
        return;
    }
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            afficherMessage('❌ Vous devez être connecté', 'error');
            return;
        }
        
        // Extraire année et mois de la date
        const dateObj = new Date(date);
        const annee = dateObj.getFullYear();
        const mois = dateObj.getMonth() + 1;
        
        const { error } = await window.supabaseClient
            .from('suivi_soldes_bancaires')
            .insert({
                owner_user_id: user.id,
                annee: annee,
                mois: mois,
                solde: montant
            });
        
        if (error) throw error;
        
        afficherMessage('✅ Solde enregistré', 'success');
        fermerModalAjoutSolde();
        
        // Si le dashboard est ouvert, mettre à jour
        if (typeof window.chargerGraphiqueTresorerie === 'function') {
            window.chargerGraphiqueTresorerie();
        }
        
    } catch (error) {
        console.error('Erreur enregistrement solde:', error);
        afficherMessage('❌ Erreur lors de l\'enregistrement', 'error');
    }
}

/**
 * Afficher modal historique des soldes
 */
async function afficherHistoriqueSoldes() {
    const modal = document.getElementById('modal-historique-soldes');
    if (!modal) return;
    
    // Générer les années disponibles
    const selectAnnee = document.getElementById('modal-historique-annee');
    if (selectAnnee) {
        const anneeActuelle = new Date().getFullYear();
        let optionsHTML = '<option value="">Toutes les années</option>';
        for (let i = anneeActuelle; i >= anneeActuelle - 5; i--) {
            optionsHTML += `<option value="${i}">${i}</option>`;
        }
        window.SecurityUtils.setInnerHTML(selectAnnee, optionsHTML);
    }
    
    modal.style.display = 'flex';
    await chargerHistoriqueSoldes();
}

/**
 * Fermer modal historique
 */
function fermerModalHistoriqueSoldes() {
    const modal = document.getElementById('modal-historique-soldes');
    if (modal) modal.style.display = 'none';
}

/**
 * Charger l'historique des soldes
 */
async function chargerHistoriqueSoldes() {
    const tbody = document.getElementById('tbody-historique-soldes');
    if (!tbody) return;
    
    const anneeFiltre = document.getElementById('modal-historique-annee')?.value;
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        
        let query = window.supabaseClient
            .from('suivi_soldes_bancaires')
            .select('*')
            .eq('owner_user_id', user.id);
        
        if (anneeFiltre) {
            query = query.eq('annee', parseInt(anneeFiltre));
        }
        
        // Ordre par année DESC puis mois DESC
        query = query.order('annee', { ascending: false }).order('mois', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            window.SecurityUtils.setInnerHTML(tbody, `
                <tr>
                    <td colspan="3" style="padding: 30px; text-align: center; color: #999;">
                        Aucun solde enregistré
                    </td>
                </tr>
            `);
            return;
        }
        
        const html = data.map(solde => {
            // Reconstruire une date à partir de annee/mois
            const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            const dateFormatee = `${moisNoms[solde.mois - 1]} ${solde.annee}`;
            
            return `
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px;">${dateFormatee}</td>
                    <td style="padding: 12px; text-align: right; font-weight: 600; color: ${solde.solde >= 0 ? '#27ae60' : '#e74c3c'};">
                        ${solde.solde.toFixed(2)} €
                    </td>
                    <td style="padding: 12px; text-align: center;">
                        <button onclick="supprimerSolde('${solde.id}')" class="btn-icon" title="Supprimer" style="background: #fff; border: 2px solid #e0e0e0; border-radius: 6px; padding: 6px 10px; cursor: pointer;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        window.SecurityUtils.setInnerHTML(tbody, html);
        
    } catch (error) {
        console.error('Erreur chargement historique:', error);
        window.SecurityUtils.setInnerHTML(tbody, `
            <tr>
                <td colspan="3" style="padding: 20px; text-align: center; color: #e74c3c;">
                    ❌ Erreur de chargement
                </td>
            </tr>
        `);
    }
}

/**
 * Supprimer un solde
 */
async function supprimerSolde(id) {
    if (!confirm('Supprimer ce solde ?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('suivi_soldes_bancaires')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        afficherMessage('✅ Solde supprimé', 'success');
        await chargerHistoriqueSoldes();
        
        // Mettre à jour le dashboard si ouvert
        if (typeof window.chargerGraphiqueTresorerie === 'function') {
            window.chargerGraphiqueTresorerie();
        }
        
    } catch (error) {
        console.error('Erreur suppression:', error);
        afficherMessage('❌ Erreur lors de la suppression', 'error');
    }
}

/**
 * Exporter soldes en CSV
 */
async function exporterSoldesCSV() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        
        const { data, error } = await window.supabaseClient
            .from('suivi_soldes_bancaires')
            .select('*')
            .eq('owner_user_id', user.id)
            .order('annee', { ascending: true })
            .order('mois', { ascending: true });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            afficherMessage('⚠️ Aucune donnée à exporter', 'error');
            return;
        }
        
        // Créer le CSV
        let csv = 'Année,Mois,Solde (€)\n';
        data.forEach(solde => {
            csv += `"${solde.annee}","${solde.mois}","${solde.solde}"\n`;
        });
        
        // Télécharger
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `soldes_bancaires_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        afficherMessage('✅ Export réalisé', 'success');
        
    } catch (error) {
        console.error('Erreur export:', error);
        afficherMessage('❌ Erreur lors de l\'export', 'error');
    }
}

// Exporter globalement
window.afficherModalAjoutSolde = afficherModalAjoutSolde;
window.fermerModalAjoutSolde = fermerModalAjoutSolde;
window.enregistrerSolde = enregistrerSolde;
window.afficherHistoriqueSoldes = afficherHistoriqueSoldes;
window.fermerModalHistoriqueSoldes = fermerModalHistoriqueSoldes;
window.chargerHistoriqueSoldes = chargerHistoriqueSoldes;
window.supprimerSolde = supprimerSolde;
window.exporterSoldesCSV = exporterSoldesCSV;

// ==========================================
// FONCTION DEBUG TEMPORAIRE
// ==========================================

function debugResidence() {
    console.log('🐛 ========== DEBUG RÉSIDENCE ==========');
    
    // 1. Vérifier les inputs HTML
    const fields = [
        'interets_residence',
        'assurance_residence', 
        'electricite_residence',
        'internet_residence',
        'eau_residence',
        'assurance_hab_residence',
        'taxe_fonciere_residence'
    ];
    
    console.log('📋 Valeurs actuelles des champs:');
    fields.forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (el) {
            const value = el.value;
            const type = el.getAttribute('data-period-type');
            console.log(`  ${fieldId}:`, {value, type});
        } else {
            console.log(`  ${fieldId}: ❌ ELEMENT NON TROUVÉ`);
        }
    });
    
    // 2. Tester la fonction getAnnualValue
    console.log('\n💰 Test getAnnualValue:');
    fields.forEach(fieldId => {
        try {
            const annual = getAnnualValue(fieldId, fieldId + '_type');
            console.log(`  ${fieldId} annualisé:`, annual);
        } catch (error) {
            console.log(`  ${fieldId}: ❌ ERREUR`, error.message);
        }
    });
    
    // 3. Simuler une sauvegarde
    console.log('\n💾 Test collecte données:');
    try {
        const testData = {};
        fields.forEach(fieldId => {
            const el = document.getElementById(fieldId);
            if (el) {
                testData[fieldId] = parseFloat(el.value || 0);
                testData[fieldId + '_type'] = el.getAttribute('data-period-type') || 'mensuel';
            }
        });
        console.log('Données qui seraient sauvegardées:', testData);
    } catch (error) {
        console.error('❌ Erreur collecte:', error);
    }
    
    // 4. Vérifier la dernière simulation sauvegardée
    console.log('\n📂 Dernière simulation en base:');
    supabaseClient
        .from('fiscal_history')
        .select('donnees_detaillees')
        .eq('year', window.anneeSelectionnee || new Date().getFullYear())
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data, error }) => {
            if (error) {
                console.error('❌ Erreur lecture:', error);
            } else if (data && data[0]) {
                const details = data[0].donnees_detaillees;
                console.log('Résidence dans la base:');
                fields.forEach(fieldId => {
                    console.log(`  ${fieldId}:`, details[fieldId], `(type: ${details[fieldId + '_type']})`);
                });
            } else {
                console.log('❌ Aucune simulation trouvée');
            }
        });
    
    console.log('🐛 ========== FIN DEBUG ==========');
    alert('🐛 Debug terminé - Voir la console (F12)');
}

window.debugResidence = debugResidence;

// ==========================================
// 🔄 SYNCHRONISATION CHARGES → FRAIS PERSONNELS
// ==========================================

/**
 * Synchronise automatiquement les valeurs des charges résidence 
 * vers les champs frais personnels correspondants
 */
function syncResidenceToFraisPerso() {
    // Mapping: champ résidence → champ frais personnel
    const mapping = {
        'internet_residence': 'frais_perso_internet',
        'electricite_residence': 'frais_perso_electricite',
        'eau_residence': 'frais_perso_eau',
        'assurance_hab_residence': 'frais_perso_assurance',
        'taxe_fonciere_residence': 'frais_perso_taxe'
    };
    
    Object.entries(mapping).forEach(([sourceId, targetId]) => {
        const sourceEl = document.getElementById(sourceId);
        const targetEl = document.getElementById(targetId);
        
        if (sourceEl && targetEl) {
            // Récupérer la valeur et le type (mensuel/annuel)
            const value = parseFloat(sourceEl.value || 0);
            const periodType = sourceEl.getAttribute('data-period-type') || 'mensuel';
            
            // Convertir en mensuel si nécessaire
            let valueMensuel = value;
            if (periodType === 'annuel' && sourceId !== 'taxe_fonciere_residence') {
                valueMensuel = value / 12;
            }
            // Pour taxe foncière, garder en annuel (le champ frais_perso_taxe est en annuel)
            
            // Synchroniser
            targetEl.value = valueMensuel > 0 ? valueMensuel.toFixed(2) : '';
        }
    });
    
    // Recalculer le reste à vivre après synchronisation
    if (typeof calculerResteAVivre === 'function') {
        calculerResteAVivre();
    }
}

/**
 * Attache les écouteurs d'événements sur les champs résidence
 * pour synchronisation automatique
 */
function initSyncResidenceToFraisPerso() {
    const fieldsToWatch = [
        'internet_residence',
        'electricite_residence',
        'eau_residence',
        'assurance_hab_residence',
        'taxe_fonciere_residence'
    ];
    
    fieldsToWatch.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Synchroniser à chaque modification
            field.addEventListener('input', syncResidenceToFraisPerso);
            field.addEventListener('change', syncResidenceToFraisPerso);
        }
    });
    
    console.log('✅ Synchronisation résidence → frais personnels activée');
}

// Exposer globalement
window.syncResidenceToFraisPerso = syncResidenceToFraisPerso;
window.initSyncResidenceToFraisPerso = initSyncResidenceToFraisPerso;

// ==========================================
// FIN GESTION SECTION PERSONNELLE
// ==========================================
