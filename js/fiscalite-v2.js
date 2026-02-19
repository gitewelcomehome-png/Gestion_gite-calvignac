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

// ==========================================
// 🔧 HELPERS UTILITAIRES
// ==========================================

/**
 * Récupère la valeur numérique d'un champ de formulaire
 * @param {string} id - ID de l'élément
 * @param {number} defaultValue - Valeur par défaut si vide
 * @returns {number}
 */
function getFieldValue(id, defaultValue = 0) {
    return parseFloat(document.getElementById(id)?.value || defaultValue);
}

function getAutresRevenusProfessionnelsFoyer() {
    const salaireMadame = getFieldValue('salaire_madame');
    const salaireMonsieur = getFieldValue('salaire_monsieur');

    const autresChampsProfessionnels = [
        'revenus_bic_autres',
        'revenus_bnc',
        'revenus_agricoles',
        'autres_revenus_professionnels'
    ];

    const autresRevenus = autresChampsProfessionnels
        .map(id => getFieldValue(id))
        .reduce((sum, value) => sum + value, 0);

    return salaireMadame + salaireMonsieur + autresRevenus;
}

// CORRECTION 1 - 2026-02-17
function calculerURSSAF(benefice, ca, statutFiscal, config) {
    const detail = {
        indemnites: 0,
        retraiteBase: 0,
        retraiteCompl: 0,
        invalidite: 0,
        csgCrds: 0,
        formationPro: 0,
        allocations: 0,
        minimumLMPApplique: false,
        exonereLMNP: false
    };

    if (benefice > 0) {
        const urssafConfig = config.URSSAF;
        detail.indemnites = benefice * urssafConfig.indemnites_journalieres.taux;
        const revenuPlafonne = Math.min(benefice, urssafConfig.retraite_base.plafond);
        detail.retraiteBase = revenuPlafonne * urssafConfig.retraite_base.taux;
        detail.retraiteCompl = benefice * urssafConfig.retraite_complementaire.taux;
        detail.invalidite = benefice * urssafConfig.invalidite_deces.taux;
        detail.csgCrds = benefice * urssafConfig.csg_crds.taux;
        const PASS = config.PASS || 46368; // PASS 2025
        detail.formationPro = PASS * urssafConfig.formation_pro.taux;
        // CFP = 0,25% du PASS (~116€ fixe/an), pas du CA — CGI art. 1601 B

        const af = urssafConfig.allocations_familiales;
        if (benefice > af.seuil_debut) {
            const baseAF = Math.min(benefice - af.seuil_debut, af.seuil_fin - af.seuil_debut);
            const tauxAF = (baseAF / (af.seuil_fin - af.seuil_debut)) * af.taux_max;
            detail.allocations = benefice * tauxAF;
        }
    }

    let urssaf = detail.indemnites + detail.retraiteBase + detail.retraiteCompl + detail.invalidite + detail.csgCrds + detail.formationPro + detail.allocations;

    const COTISATIONS_MINIMALES_LMP = config.COTISATIONS_MINIMALES.montant;
    const SEUIL_EXONERATION_LMNP = 23000;

    if (statutFiscal === 'lmnp' && ca < SEUIL_EXONERATION_LMNP) {
        urssaf = 0;
        detail.exonereLMNP = true;
        detail.indemnites = 0;
        detail.retraiteBase = 0;
        detail.retraiteCompl = 0;
        detail.invalidite = 0;
        detail.csgCrds = 0;
        detail.formationPro = 0;
        detail.allocations = 0;
    } else if (statutFiscal === 'lmp' && urssaf < COTISATIONS_MINIMALES_LMP) {
        urssaf = COTISATIONS_MINIMALES_LMP;
        detail.minimumLMPApplique = true;
    }

    return { urssaf, detail };
}

/**
 * Formate un montant en euros
 * @param {number} montant - Montant à formater
 * @returns {string}
 */
function formatCurrency(montant) {
    return montant.toFixed(2) + ' €';
}

/**
 * Parse un montant affiché (qui contient € et espaces)
 * @param {string} elementId - ID de l'élément contenant le montant
 * @returns {number}
 */
function parseDisplayedAmount(elementId) {
    return parseFloat(document.getElementById(elementId)?.textContent?.replace(/[€\s]/g, '') || 0);
}

/**
 * Récupère la config fiscale pour l'année (avec cache)
 * @returns {object}
 */
let _cachedConfig = null;
let _cachedYear = null;

function getConfig() {
    const annee = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    if (_cachedYear !== annee || !_cachedConfig) {
        _cachedConfig = window.TAUX_FISCAUX.getConfig(annee);
        _cachedYear = annee;
    }
    return _cachedConfig;
}

/**
 * Affiche plusieurs montants dans des éléments (helper générique)
 * @param {object} elementsMap - Map {elementId: valeur}
 */
function afficherDetailsFinanciers(elementsMap) {
    Object.entries(elementsMap).forEach(([elementId, valeur]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = formatCurrency(valeur);
        }
    });
}

// ==========================================
// FONCTIONS EXISTANTES
// ==========================================


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
let isCalculatingTempsReel = false; // Flag pour éviter les boucles infinies
let lastSavedData = null; // Pour éviter les sauvegardes en double

// ==========================================
// � RÈGLES D'AMORTISSEMENT (Législation française LMNP)
// ==========================================

const REGLES_AMORTISSEMENT = {
    // Décret n°2022-1609 du 26/12/2022 — applicable depuis le 01/01/2023
    // Seuil minimum pour amortir (< 500€ HT = déductible immédiatement)
    SEUIL_AMORTISSEMENT_HT: 500,
    // Seuil 500€ TTC — LMNP/LMP exonérés TVA (CGI art. 261 D) donc TTC=HT
    SEUIL_AMORTISSEMENT_TTC: 500,
    
    // Catégories et durées d'amortissement par composants (selon CGI art 39 C)
    categories: [
        // 🏗️ Structure et gros œuvre (50 ans)
        {
            id: 'structure',
            keywords: ['fondation', 'dalle', 'mur porteur', 'structure', 'ossature', 'gros œuvre', 'gros oeuvre'],
            duree: 50,
            label: 'Structure / Gros œuvre'
        },
        // 🏠 Toiture et charpente (25 ans)
        {
            id: 'toiture',
            keywords: ['toiture', 'couverture', 'charpente', 'zinguerie', 'gouttière', 'tuile', 'ardoise', 'velux', 'lucarne'],
            duree: 25,
            label: 'Toiture et charpente'
        },
        // 🎨 Façades et étanchéité (25 ans)
        {
            id: 'facade',
            keywords: ['façade', 'ravalement', 'crépi', 'enduit', 'isolation extérieure', 'ite', 'bardage', 'étanchéité'],
            duree: 25,
            label: 'Façade et étanchéité'
        },
        // 🔥 Installations techniques (15-20 ans)
        {
            id: 'chauffage',
            keywords: ['chaudière', 'pompe à chaleur', 'pac', 'climatisation', 'clim', 'radiateur', 'chauffage', 'ballon eau chaude', 'cumulus'],
            duree: 15,
            label: 'Chauffage / Climatisation'
        },
        {
            id: 'plomberie',
            keywords: ['plomberie', 'tuyauterie', 'canalisation', 'sanitaire', 'robinetterie', 'évacuation', 'assainissement'],
            duree: 20,
            label: 'Plomberie et sanitaires'
        },
        {
            id: 'electricite',
            keywords: ['électricité', 'électrique', 'tableau électrique', 'câblage', 'installation électrique', 'disjoncteur'],
            duree: 20,
            label: 'Installation électrique'
        },
        // 🚪 Menuiseries (15-20 ans)
        {
            id: 'menuiseries',
            keywords: ['fenêtre', 'porte', 'volet', 'baie vitrée', 'porte-fenêtre', 'menuiserie', 'double vitrage', 'pvc', 'alu', 'aluminium'],
            duree: 20,
            label: 'Menuiseries extérieures'
        },
        // 🛁 Aménagements intérieurs (10-15 ans)
        {
            id: 'cuisine',
            keywords: ['cuisine équipée', 'kitchenette', 'plan de travail', 'hotte', 'évier'],
            duree: 10,
            label: 'Cuisine équipée'
        },
        {
            id: 'salle_bain',
            keywords: ['salle de bain', 'douche', 'baignoire', 'lavabo', 'meuble vasque', 'paroi douche'],
            duree: 15,
            label: 'Salle de bain'
        },
        {
            id: 'sol',
            keywords: ['parquet', 'carrelage', 'sol', 'revêtement sol', 'plancher'],
            duree: 15,
            label: 'Revêtements de sols'
        },
        // 🛋️ Mobilier et équipements (5-10 ans)
        {
            id: 'mobilier',
            keywords: ['canapé', 'lit', 'matelas', 'sommier', 'armoire', 'table', 'chaise', 'meuble', 'bureau', 'étagère', 'bibliothèque', 'commode', 'dressing'],
            duree: 10,
            label: 'Mobilier'
        },
        {
            id: 'electromenager',
            keywords: ['lave-linge', 'lave-vaisselle', 'réfrigérateur', 'frigo', 'congélateur', 'four', 'micro-ondes', 'aspirateur', 'machine à laver', 'sèche-linge'],
            duree: 7,
            label: 'Électroménager'
        },
        {
            id: 'equipement_audiovisuel',
            keywords: ['tv', 'télévision', 'télé', 'écran', 'home cinéma', 'sono', 'hifi', 'enceinte', 'barre de son', 'projecteur'],
            duree: 5,
            label: 'Équipements audiovisuels'
        },
        // 💻 Informatique (3 ans)
        {
            id: 'informatique',
            keywords: ['ordinateur', 'portable', 'pc', 'laptop', 'tablette', 'ipad', 'macbook', 'imac', 'smartphone', 'iphone', 'android', 'mobile', 'téléphone', 'tel', 'serveur', 'nas', 'moniteur', 'clavier', 'souris', 'imprimante', 'scanner'],
            duree: 3,
            label: 'Matériel informatique'
        },
        // 🎨 Décoration et petits équipements (5 ans)
        {
            id: 'decoration',
            keywords: ['décoration', 'linge de maison', 'rideau', 'store', 'lampe', 'luminaire', 'tapis', 'tableau', 'miroir'],
            duree: 5,
            label: 'Décoration et linge'
        }
    ],
    
    // Catégorie par défaut si aucune détection
    defaut: {
        duree: 10,
        label: 'Dépense amortissable (durée standard)'
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
    if (montant < REGLES_AMORTISSEMENT.SEUIL_AMORTISSEMENT_TTC) {
        return null;
    }
    
    const anneeActuelle = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    
    // Si un type est choisi manuellement, l'utiliser en priorité
    if (typeChoisi && typeChoisi !== '') {
        if (typeChoisi === 'autre') {
            return {
                type: REGLES_AMORTISSEMENT.defaut.label,
                duree: REGLES_AMORTISSEMENT.defaut.duree,
                label: REGLES_AMORTISSEMENT.defaut.label,
                anneeFin: anneeActuelle + REGLES_AMORTISSEMENT.defaut.duree - 1,
                montantAnnuel: (montant / REGLES_AMORTISSEMENT.defaut.duree).toFixed(2)
            };
        }
        
        const categorieChoisie = REGLES_AMORTISSEMENT.categories.find(c => c.id === typeChoisi);
        if (categorieChoisie) {
            return {
                type: categorieChoisie.label,
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
                    type: cat.label,
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
        type: REGLES_AMORTISSEMENT.defaut.label,
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

/**
 * Calcule les amortissements pour l'année en cours uniquement
 * @returns {Object} {montantAnnuel, details: [{description, montant, duree, debut, fin}]}
 */
function calculerAmortissementsAnneeCourante() {
    const anneeSimulation = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    let montantTotal = 0;
    const details = [];
    
    // Fonction helper pour traiter une liste d'items
    function traiterListe(items, type) {
        items.forEach(item => {
            // Ignorer les dépenses courantes (type_amortissement vide)
            if (!item.type_amortissement || item.type_amortissement === '') {
                return;
            }
            
            // Déterminer la durée d'amortissement
            const infoAmort = detecterAmortissement(item.description, item.montant, item.type_amortissement);
            if (!infoAmort) {
                return; // Montant trop faible ou erreur
            }
            
            // Calculer l'amortissement annuel
            const montantAnnuel = parseFloat(infoAmort.montantAnnuel);
            const anneeDebut = anneeSimulation; // On suppose que tous les travaux sont de l'année en cours
            const anneeFin = parseInt(infoAmort.anneeFin);
            
            // Vérifier si l'amortissement concerne l'année de simulation
            if (anneeSimulation >= anneeDebut && anneeSimulation <= anneeFin) {
                montantTotal += montantAnnuel;
                details.push({
                    description: item.description,
                    montant: montantAnnuel,
                    montantAnnuel: montantAnnuel,
                    type: infoAmort.type,
                    duree: infoAmort.duree,
                    debut: anneeDebut,
                    fin: anneeFin
                });
            }
        });
    }
    
    // Traiter tous les types de dépenses amortissables
    traiterListe(getTravauxListe(), 'travaux');
    traiterListe(getFraisDiversListe(), 'frais');
    traiterListe(getProduitsAccueilListe(), 'produits');
    
    return {
        montantAnnuel: montantTotal,
        details: details
    };
}

/**
 * Calcule et affiche le tableau comparatif des 4 options fiscales
 */
function calculerTableauComparatif() {
    const ca = getFieldValue('ca');
    if (ca === 0) {
        return;
    }
    
    // LOI 2025/2026 - Utiliser la config centralisée
    const annee = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    const config = window.TAUX_FISCAUX.getConfig(annee);
    const PLAFOND_MICRO_NON_CLASSE = config.MICRO_BIC.plafond_non_classe;
    const PLAFOND_MICRO_CLASSE = config.MICRO_BIC.plafond_classe;
    const ABATTEMENT_NON_CLASSE = config.MICRO_BIC.abattement_non_classe;
    const ABATTEMENT_CLASSE = config.MICRO_BIC.abattement_classe;
    const TAUX_COTIS_MICRO_NON_CLASSE = config.MICRO_BIC.taux_cotis_non_classe;
    const TAUX_COTIS_MICRO_CLASSE = config.MICRO_BIC.taux_cotis_classe;
    const COTISATIONS_MINIMALES_LMP = config.COTISATIONS_MINIMALES.montant;
    const TAUX_VL_CLASSE = config.MICRO_BIC.taux_vl_classe;
    const TAUX_VL_NON_CLASSE = config.MICRO_BIC.taux_vl_non_classe;
    
    // Détecter le classement sélectionné
    const classement = document.getElementById('classement_meuble')?.value || 'non_classe';
    const estClasse = classement === 'classe';
    
    // Versement libératoire : disponible UNIQUEMENT pour Micro-BIC
    const PLAFOND_MICRO = estClasse ? PLAFOND_MICRO_CLASSE : PLAFOND_MICRO_NON_CLASSE;
    const estEligibleMicroBIC = ca > 0 && ca <= PLAFOND_MICRO;
    const statutActuelSelect = document.getElementById('statut_fiscal')?.value || 'lmnp';
    const estStatutMicro = statutActuelSelect === 'micro';
    
    const blocVL = document.getElementById('bloc-versement-liberatoire');
    const checkboxVL = document.getElementById('option_versement_liberatoire');
    const messageVL = document.getElementById('vl-eligibilite-message');
    
    // Afficher le bloc UNIQUEMENT si statut Micro-BIC ET CA dans les plafonds
    if (blocVL) {
        if (estStatutMicro && estEligibleMicroBIC) {
            blocVL.style.display = 'block';
            if (messageVL) {
                messageVL.innerHTML = '💡 <strong>Option micro-entrepreneurs</strong> : Taux forfaitaire sur le CA (1% ou 1,7%) au lieu de l\'IR progressif';
                messageVL.style.color = '#2ecc71';
            }
        } else {
            blocVL.style.display = 'none';
        }
    }
    
    if (checkboxVL) {
        checkboxVL.disabled = !(estStatutMicro && estEligibleMicroBIC);
        if (!(estStatutMicro && estEligibleMicroBIC)) {
            checkboxVL.checked = false;
        }
    }
    
    const optionVL = checkboxVL?.checked || false;
    const utiliserVL = optionVL && estStatutMicro && estEligibleMicroBIC;
    
    // Données communes
    const salaireMadame = getFieldValue('salaire_madame');
    const salaireMonsieur = getFieldValue('salaire_monsieur');
    const nombreEnfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
    const nombreParts = 2 + (nombreEnfants * 0.5);
    const revenusSalaries = salaireMadame + salaireMonsieur;
    const autresRevenusProfessionnels = getAutresRevenusProfessionnelsFoyer();
    
    const bareme = config.BAREME_IR;
    
    // Fonction helper pour calculer l'IR
    function calculerIR(revenusGlobaux, nombreParts) {
        const quotientFamilial = revenusGlobaux / nombreParts;
        let impotParPart = 0;
        let tranchePrecedente = 0;
        
        for (let i = 0; i < bareme.length; i++) {
            const tranche = bareme[i];
            const montantDansTranche = Math.max(0, Math.min(quotientFamilial, tranche.max) - tranchePrecedente);
            
            if (montantDansTranche > 0) {
                impotParPart += montantDansTranche * tranche.taux;
            }
            
            tranchePrecedente = tranche.max;
            if (quotientFamilial <= tranche.max) break;
        }
        
        return impotParPart * nombreParts;
    }
    
    // Vérifier critères LMP
    const beneficeReel = parseDisplayedAmount('preview-benefice');
    const resteAvantIRReelAffiche = parseDisplayedAmount('preview-reste');
    
    // CORRECTION 1 - 2026-02-17
    const urssafLMNP = calculerURSSAF(beneficeReel, ca, 'lmnp', config).urssaf;
    
    const beneficeLMNP = beneficeReel;
    const revenuLMNPRetenuIR = Math.max(0, beneficeLMNP);
    const deficitLMNPReportable = beneficeLMNP < 0 ? Math.abs(beneficeLMNP) : 0;
    const resteAvantIRReel = beneficeReel - urssafLMNP;
    const revenusGlobauxReel = revenusSalaries + revenuLMNPRetenuIR;
    
    // Vérifier le statut actuel pour forcer LMP si nécessaire
    const forceLMP = statutActuelSelect === 'lmp';
    
    // Critères LMP légaux
    const autresRevenusProFoyer = getAutresRevenusProfessionnelsFoyer();
    const critereCA_LMP = ca > 23000;
    const critereRecettesSupAutres = ca > autresRevenusProFoyer;
    
    // LMP disponible si critères légaux remplis (ou statut forcé manuellement)
    const peutEtreLMP = forceLMP || (critereCA_LMP && critereRecettesSupAutres);
    
    const options = [];
    
    // ==========================================
    // OPTION 1 : LMNP Réel
    // ==========================================
    // Vérifier si LMP obligatoire (règle légale)
    const lmpObligatoire = critereCA_LMP && critereRecettesSupAutres;
    
    const irTotalLMNPReel = calculerIR(revenusGlobauxReel, nombreParts);
    const partLocationLMNPReel = revenusGlobauxReel > 0 ? revenuLMNPRetenuIR / revenusGlobauxReel : 0;
    const irImpactLocation = irTotalLMNPReel * partLocationLMNPReel;
    const irPartLMNPReel = Math.max(0, irImpactLocation);
    const totalLMNPReel = urssafLMNP + irPartLMNPReel;
    
    document.getElementById('urssaf-lmnp-reel').textContent = urssafLMNP.toFixed(0) + ' €';
    document.getElementById('ir-lmnp-reel').textContent = irPartLMNPReel.toFixed(0) + ' €';
    document.getElementById('total-lmnp-reel').textContent = totalLMNPReel.toFixed(0) + ' €';
    
    // Si LMP obligatoire, griser LMNP
    const desactiveLMNP = document.getElementById('desactive-lmnp-reel');
    const conditionsLMNP = document.getElementById('conditions-lmnp-reel');
    
    // TOUJOURS afficher les conditions
    const caLMNPOk = ca <= 23000;
    const partLMNPOk = !critereRecettesSupAutres;
    
    // Message selon situation
    if (lmpObligatoire) {
        // LMP obligatoire : les 2 critères sont dépassés
        conditionsLMNP.innerHTML = `
            <div style="color: #dc3545; font-weight: 600;">• CA > 23 000€</div>
            <div style="color: #dc3545; font-weight: 600;">• Recettes locatives > autres revenus professionnels</div>
            <div style="color: #dc3545; font-weight: 600;">→ LMP obligatoire</div>
        `;
    } else if (ca < 23000) {
        // CA < 23k : exonération cotisations
        conditionsLMNP.innerHTML = `
            <div style="color: #28a745; font-weight: 600;">• CA < 23 000€</div>
            <div style="color: #28a745; font-weight: 600;">→ Exonération cotisations sociales</div>
        `;
    } else {
        // CA > 23k mais < 50% : URSSAF obligatoire
        conditionsLMNP.innerHTML = `
            <div style="color: #ffc107; font-weight: 600;">• CA > 23 000€</div>
            <div style="color: #28a745; font-weight: 600;">• Recettes locatives ≤ autres revenus professionnels</div>
            <div style="color: #ffc107; font-weight: 600;">→ URSSAF obligatoire (LMNP OK)</div>
        `;
    }

    if (deficitLMNPReportable > 0) {
        conditionsLMNP.innerHTML += `<div style="margin-top: 4px; color: #fd7e14; font-weight: 700;">Déficit LMNP reportable (CGI art. 156 I) : ${deficitLMNPReportable.toFixed(0)} € — imputable sur bénéfices LMNP sur 10 ans</div>`;
    }
    
    if (lmpObligatoire) {
        desactiveLMNP.style.display = 'block';
    } else {
        desactiveLMNP.style.display = 'none';
        options.push({ nom: 'LMNP Réel', total: totalLMNPReel, id: 'option-lmnp-reel', badge: 'badge-lmnp-reel' });
    }
    
    // ==========================================
    // ==========================================
    // OPTION 2 : LMNP Micro-BIC Non Classé (30%)
    // ==========================================
    const desactiveMicroNonClasse = document.getElementById('desactive-micro-non-classe');
    const conditionsMicroNonClasse = document.getElementById('conditions-micro-non-classe');
    
    // TOUJOURS afficher la condition
    const caMicro30Ok = ca <= PLAFOND_MICRO_NON_CLASSE;
    const SEUIL_URSSAF = 23000;
    
    // Si classé est sélectionné, griser cette option
    if (estClasse) {
        conditionsMicroNonClasse.innerHTML = `<div style="color: #dc3545; font-weight: 600;">⭐ Meublé classé sélectionné</div>`;
        desactiveMicroNonClasse.style.display = 'block';
        document.getElementById('total-micro-non-classe').textContent = 'N/A';
    } else {
        // Non classé sélectionné : toujours afficher
        const messageUrssaf = ca < SEUIL_URSSAF 
            ? '<div style="color: #28a745; font-weight: 500; font-size: 0.6rem;">✅ Pas de cotisations URSSAF</div>' 
            : '<div style="color: #6c757d; font-weight: 500; font-size: 0.6rem;">(URSSAF: 21,2% du CA)</div>';
        
        conditionsMicroNonClasse.innerHTML = `
            <div style="color: ${caMicro30Ok ? '#28a745' : '#dc3545'}; font-weight: 600;">• CA ${caMicro30Ok ? '≤' : '>'} 15 000€</div>
            ${messageUrssaf}
        `;
        
        if (caMicro30Ok) {
            const abattement30 = Math.max(ca * ABATTEMENT_NON_CLASSE, 305);
            const beneficeMicro30 = ca - abattement30;
            // ✅ URSSAF = 0 si CA < 23 000€
            const cotisMicro30 = ca >= SEUIL_URSSAF ? ca * TAUX_COTIS_MICRO_NON_CLASSE : 0;
            const resteAvantIRMicro30 = beneficeMicro30 - cotisMicro30;
            const revenusGlobauxMicro30 = revenusSalaries + resteAvantIRMicro30;
            
            // IR ou Versement Libératoire
            let irPartMicro30;
            const labelIRMicro30 = document.getElementById('label-ir-micro-non-classe');
            
            if (utiliserVL) {
                // Versement libératoire 1,7%
                irPartMicro30 = ca * TAUX_VL_NON_CLASSE;
                if (labelIRMicro30) labelIRMicro30.textContent = 'VL 1,7%:';
            } else {
                // IR classique
                const irTotalMicro30 = calculerIR(revenusGlobauxMicro30, nombreParts);
                const partLocationMicro30 = revenusGlobauxMicro30 > 0 ? resteAvantIRMicro30 / revenusGlobauxMicro30 : 0;
                irPartMicro30 = irTotalMicro30 * partLocationMicro30;
                if (labelIRMicro30) labelIRMicro30.textContent = 'IR:';
            }
            
            const totalMicro30 = cotisMicro30 + irPartMicro30;
            
            document.getElementById('cotis-micro-non-classe').textContent = cotisMicro30.toFixed(0) + ' €';
            document.getElementById('ir-micro-non-classe').textContent = irPartMicro30.toFixed(0) + ' €';
            document.getElementById('total-micro-non-classe').textContent = totalMicro30.toFixed(0) + ' €';
            desactiveMicroNonClasse.style.display = 'none';
            
            options.push({ nom: 'Micro-BIC 30%', total: totalMicro30, id: 'option-micro-non-classe', badge: 'badge-micro-non-classe' });
        } else {
            desactiveMicroNonClasse.style.display = 'block';
            document.getElementById('total-micro-non-classe').textContent = 'N/A';
        }
    }
    
    // ==========================================
    // OPTION 3 : LMNP Micro-BIC Classé (50%)
    // ==========================================
    const desactiveMicroClasse = document.getElementById('desactive-micro-classe');
    const conditionsMicroClasse = document.getElementById('conditions-micro-classe');
    
    // TOUJOURS afficher la condition
    const caMicro50Ok = ca <= PLAFOND_MICRO_CLASSE;
    
    // Si non classé est sélectionné, griser cette option
    if (!estClasse) {
        conditionsMicroClasse.innerHTML = `<div style="color: #dc3545; font-weight: 600;">Non classé sélectionné</div>`;
        desactiveMicroClasse.style.display = 'block';
        document.getElementById('total-micro-classe').textContent = 'N/A';
    } else {
        // Classé sélectionné : toujours afficher
        const messageUrssafClasse = ca < SEUIL_URSSAF 
            ? '<div style="color: #28a745; font-weight: 500; font-size: 0.6rem;">✅ Pas de cotisations URSSAF</div>' 
            : '<div style="color: #6c757d; font-weight: 500; font-size: 0.6rem;">(URSSAF: 6% du CA ⭐)</div>';
        
        conditionsMicroClasse.innerHTML = `
            <div style="color: ${caMicro50Ok ? '#28a745' : '#dc3545'}; font-weight: 600;">• CA ${caMicro50Ok ? '≤' : '>'} 77 700€</div>
            ${messageUrssafClasse}
        `;
        
        if (caMicro50Ok) {
            const abattement50 = Math.max(ca * ABATTEMENT_CLASSE, 305);
            const beneficeMicro50 = ca - abattement50;
            // ✅ URSSAF = 0 si CA < 23 000€
            const cotisMicro50 = ca >= SEUIL_URSSAF ? ca * TAUX_COTIS_MICRO_CLASSE : 0;
            const resteAvantIRMicro50 = beneficeMicro50 - cotisMicro50;
            const revenusGlobauxMicro50 = revenusSalaries + resteAvantIRMicro50;
            
            // IR ou Versement Libératoire
            let irPartMicro50;
            const labelIRMicro50 = document.getElementById('label-ir-micro-classe');
            
            if (utiliserVL) {
                // Versement libératoire 1%
                irPartMicro50 = ca * TAUX_VL_CLASSE;
                if (labelIRMicro50) labelIRMicro50.textContent = 'VL 1%:';
            } else {
                // IR classique
                const irTotalMicro50 = calculerIR(revenusGlobauxMicro50, nombreParts);
                const partLocationMicro50 = revenusGlobauxMicro50 > 0 ? resteAvantIRMicro50 / revenusGlobauxMicro50 : 0;
                irPartMicro50 = irTotalMicro50 * partLocationMicro50;
                if (labelIRMicro50) labelIRMicro50.textContent = 'IR:';
            }
            
            const totalMicro50 = cotisMicro50 + irPartMicro50;
            
            document.getElementById('cotis-micro-classe').textContent = cotisMicro50.toFixed(0) + ' €';
            document.getElementById('ir-micro-classe').textContent = irPartMicro50.toFixed(0) + ' €';
            document.getElementById('total-micro-classe').textContent = totalMicro50.toFixed(0) + ' €';
            desactiveMicroClasse.style.display = 'none';
            
            options.push({ nom: 'Micro-BIC 50%', total: totalMicro50, id: 'option-micro-classe', badge: 'badge-micro-classe' });
        } else {
            desactiveMicroClasse.style.display = 'block';
            document.getElementById('total-micro-classe').textContent = 'N/A';
        }
    }
    
    // ==========================================
    // OPTION 4 : LMP Réel
    // ==========================================
    const desactiveLMP = document.getElementById('desactive-lmp-reel');
    const conditionsLMP = document.getElementById('conditions-lmp-reel');
    
    // TOUJOURS afficher les conditions
    const caLMPOk = ca > 23000;
    const partLMPOk = critereRecettesSupAutres;
    conditionsLMP.innerHTML = `
        <div style="color: ${caLMPOk ? '#28a745' : '#dc3545'}; font-weight: 600;">• CA ${caLMPOk ? '>' : '≤'} 23 000€</div>
        <div style="color: ${partLMPOk ? '#28a745' : '#dc3545'}; font-weight: 600;">• Recettes locatives ${partLMPOk ? '>' : '≤'} autres revenus professionnels</div>
    `;
    
    if (peutEtreLMP) {
        // CORRECTION 1 - 2026-02-17
        const urssafLMP = calculerURSSAF(beneficeReel, ca, 'lmp', config).urssaf;
        const resteAvantIRLMP = beneficeReel - urssafLMP;

        // CORRECTION 2 - 2026-02-17
        // Déficit LMP imputable au revenu global du foyer (plancher à 0)
        const abat = config.ABATTEMENT_SALAIRE;
        const abattementSalairesLMP = Math.max(
            abat.minimum,
            Math.min(revenusSalaries * abat.taux, abat.maximum)
        );
        const baseSalairesImposable = Math.max(0, revenusSalaries - abattementSalairesLMP);
        const irFoyerSansLMP = calculerIR(baseSalairesImposable, nombreParts);
        const baseAvecLMP = resteAvantIRLMP < 0
            ? Math.max(0, baseSalairesImposable + resteAvantIRLMP)
            : (baseSalairesImposable + resteAvantIRLMP);
        const irFoyerAvecLMP = calculerIR(baseAvecLMP, nombreParts);
        let irImpactLMP = irFoyerAvecLMP - irFoyerSansLMP;
        if (!Number.isFinite(irImpactLMP)) irImpactLMP = 0;

        const totalLMP = urssafLMP + irImpactLMP;
        const totalLMPSafe = Number.isFinite(totalLMP) ? totalLMP : urssafLMP;
        
        document.getElementById('ssi-lmp-reel').textContent = urssafLMP.toFixed(0) + ' €';
        document.getElementById('ir-lmp-reel').textContent = `${irImpactLMP > 0 ? '+' : ''}${irImpactLMP.toFixed(0)} €`;
        document.getElementById('total-lmp-reel').textContent = totalLMPSafe.toFixed(0) + ' €';

        if (resteAvantIRLMP < 0 && irImpactLMP < 0) {
            conditionsLMP.innerHTML += `<div style="margin-top: 4px; color: #28a745; font-weight: 700;">🟢 Déficit déductible</div>`;
        }

        desactiveLMP.style.display = 'none';
        
        options.push({ nom: 'LMP Réel', total: totalLMPSafe, id: 'option-lmp-reel', badge: 'badge-lmp-reel' });
    } else {
        desactiveLMP.style.display = 'block';
        document.getElementById('total-lmp-reel').textContent = 'N/A';
    }
    
    // ==========================================
    // METTRE EN ÉVIDENCE LA MEILLEURE OPTION
    // ==========================================
    // Masquer tous les badges
    ['badge-lmnp-reel', 'badge-micro-non-classe', 'badge-micro-classe', 'badge-lmp-reel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Reset bordures et hover
    ['option-lmnp-reel', 'option-micro-non-classe', 'option-micro-classe', 'option-lmp-reel'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.border = '3px solid var(--border-color)';
            el.style.transform = 'none';
            el.style.boxShadow = 'none';
        }
    });
    
    if (options.length > 0) {
        // Trouver la meilleure option
        const meilleure = options.reduce((min, opt) => opt.total < min.total ? opt : min);
        
        // Afficher le badge
        const badgeEl = document.getElementById(meilleure.badge);
        if (badgeEl) badgeEl.style.display = 'block';
        
        // Bordure cyan + effet
        const optionEl = document.getElementById(meilleure.id);
        if (optionEl) {
            optionEl.style.border = '3px solid #00C2CB';
            optionEl.style.transform = 'scale(1.02)';
            optionEl.style.boxShadow = '0 4px 12px rgba(0, 194, 203, 0.3)';
        }
        
        // Message
        const economieMax = Math.max(...options.map(o => o.total)) - meilleure.total;
        const meilleureOption = document.getElementById('meilleure-option');
        meilleureOption.innerHTML = `🏆 <strong>${meilleure.nom}</strong> est la meilleure option (économie jusqu'à ${economieMax.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €/an)`;
        meilleureOption.style.background = '#d4edda';
        meilleureOption.style.border = '2px solid #28a745';
        meilleureOption.style.borderLeft = '5px solid #28a745';
        meilleureOption.style.color = '#155724';
    }
}

/**
 * Compare le régime réel et le micro-BIC pour déterminer le plus intéressant
 * Prend en compte URSSAF + IR pour les 2 régimes
 */
function comparerReelVsMicroBIC() {
    const statutFiscal = document.getElementById('statut_fiscal')?.value || 'lmnp';
    const blocComparaison = document.getElementById('comparaison-reel-micro');
    
    // Afficher uniquement en LMNP
    if (statutFiscal !== 'lmnp') {
        blocComparaison.style.display = 'none';
        return;
    }
    
    const ca = parseFloat(document.getElementById('ca')?.value || 0);
    if (ca === 0) {
        blocComparaison.style.display = 'none';
        return;
    }
    
    // LOI 2025/2026 - Nouveaux plafonds et abattements
    const classement = document.getElementById('classement_meuble')?.value || 'non_classe';
    const PLAFOND_MICRO = classement === 'classe' ? 77700 : 15000; // Classé: 77,7k | Non classé: 15k
    const TAUX_ABATTEMENT_MICRO = classement === 'classe' ? 0.50 : 0.30; // Classé: 50% | Non classé: 30%
    const ABATTEMENT_MIN_MICRO = 305; // Minimum 305€
    const TAUX_COTIS_MICRO = classement === 'classe' ? 0.06 : 0.212; // Classé: 6% | Non classé: 21,2%
    
    // Mettre à jour l'info du taux d'abattement affiché
    const tauxInfo = document.getElementById('taux-abattement-info');
    if (tauxInfo) {
        tauxInfo.textContent = classement === 'classe' ? '50%' : '30%';
    }
    
    // Si CA > plafond micro, masquer la comparaison
    if (ca > PLAFOND_MICRO) {
        blocComparaison.style.display = 'none';
        return;
    }
    
    blocComparaison.style.display = 'block';
    
    // ==========================================
    // CALCUL RÉGIME RÉEL (déjà calculé)
    // ==========================================
    const urssafReel = parseFloat(document.getElementById('preview-urssaf')?.textContent?.replace(/[\u20ac\s]/g, '') || 0);
    const beneficeReel = parseFloat(document.getElementById('preview-benefice')?.textContent?.replace(/[\u20ac\s]/g, '') || 0);
    
    // Récupérer l'IR actuel et calculer la part imputable à la location
    const salaireMadame = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieur = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const resteAvantIR = parseFloat(document.getElementById('preview-reste')?.textContent?.replace(/[\u20ac\s]/g, '') || 0);
    
    const revenusSalaries = salaireMadame + salaireMonsieur;
    const revenusGlobauxReel = revenusSalaries + resteAvantIR;
    const partLocationReel = revenusGlobauxReel > 0 ? resteAvantIR / revenusGlobauxReel : 0;
    
    // Calculer l'IR pour le réel (on utilise la fonction existante)
    const irTotalReel = parseFloat(document.getElementById('ir-montant')?.textContent?.replace(/[\u20ac\s]/g, '') || 0);
    const irPartLocationReel = irTotalReel * partLocationReel;
    
    const coutTotalReel = urssafReel + irPartLocationReel;
    
    // ==========================================
    // CALCUL RÉGIME MICRO-BIC
    // ==========================================
    const abattementMicro = Math.max(ca * TAUX_ABATTEMENT_MICRO, ABATTEMENT_MIN_MICRO);
    const beneficeMicro = ca - abattementMicro; // Revenu imposable
    const cotisationsMicro = ca >= 23000 ? ca * TAUX_COTIS_MICRO : 0;
    const resteAvantIRMicro = beneficeMicro - cotisationsMicro;
    
    // Calculer l'IR avec le micro-BIC
    const revenusGlobauxMicro = revenusSalaries + resteAvantIRMicro;
    const partLocationMicro = revenusGlobauxMicro > 0 ? resteAvantIRMicro / revenusGlobauxMicro : 0;
    
    // Calculer l'IR pour le micro (même méthode que le réel)
    const nombreEnfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
    const nombreParts = 2 + (nombreEnfants * 0.5);
    const quotientFamilialMicro = revenusGlobauxMicro / nombreParts;
    
    // CORRECTION 3 - 2026-02-17
    // Utiliser le barème IR de l'année simulée
    const annee = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    const config = window.TAUX_FISCAUX.getConfig(annee);
    const bareme = config.BAREME_IR;
    
    let impotParPartMicro = 0;
    let tranchePrecedente = 0;
    
    for (let i = 0; i < bareme.length; i++) {
        const tranche = bareme[i];
        const montantDansTranche = Math.max(0, Math.min(quotientFamilialMicro, tranche.max) - tranchePrecedente);
        
        if (montantDansTranche > 0) {
            impotParPartMicro += montantDansTranche * tranche.taux;
        }
        
        tranchePrecedente = tranche.max;
        if (quotientFamilialMicro <= tranche.max) break;
    }
    
    const irTotalMicro = impotParPartMicro * nombreParts;
    const irPartLocationMicro = irTotalMicro * partLocationMicro;
    
    const coutTotalMicro = cotisationsMicro + irPartLocationMicro;
    
    // ==========================================
    // AFFICHAGE COMPARAISON
    // ==========================================
    document.getElementById('comp-reel-urssaf').textContent = urssafReel.toFixed(2) + ' €';
    document.getElementById('comp-reel-ir').textContent = irPartLocationReel.toFixed(2) + ' €';
    document.getElementById('comp-reel-total').textContent = coutTotalReel.toFixed(2) + ' €';
    
    document.getElementById('comp-micro-cotis').textContent = cotisationsMicro === 0
        ? '0 € (exonéré CA < 23 000 €)'
        : cotisationsMicro.toFixed(2) + ' €';
    document.getElementById('comp-micro-ir').textContent = irPartLocationMicro.toFixed(2) + ' €';
    document.getElementById('comp-micro-total').textContent = coutTotalMicro.toFixed(2) + ' €';
    
    // Recommandation
    const recommandation = document.getElementById('comp-recommandation');
    const economie = Math.abs(coutTotalReel - coutTotalMicro);
    
    if (coutTotalReel < coutTotalMicro) {
        recommandation.innerHTML = `✅ <strong>RÉEL PLUS INTÉRESSANT</strong> : Économie de ${economie.toFixed(2)} €/an (URSSAF + IR)`;
        recommandation.style.background = 'rgba(52, 152, 219, 0.4)';
    } else if (coutTotalMicro < coutTotalReel) {
        recommandation.innerHTML = `✅ <strong>MICRO-BIC PLUS INTÉRESSANT</strong> : Économie de ${economie.toFixed(2)} €/an (cotisations + IR)`;
        recommandation.style.background = 'rgba(46, 204, 113, 0.4)';
    } else {
        recommandation.innerHTML = `⚖️ <strong>ÉQUIVALENT</strong> : Coût identique pour les 2 régimes`;
        recommandation.style.background = 'rgba(255, 255, 255, 0.2)';
    }
}

/**
 * Change le statut fiscal (LMNP/LMP) et adapte les calculs
 */
function changerStatutFiscal() {
    const statut = document.getElementById('statut_fiscal').value;
    const statutUpperCase = statut.toUpperCase();
    
    // ✅ Afficher le bloc classement UNIQUEMENT pour Micro-BIC
    const blocClassement = document.getElementById('bloc-classement');
    if (blocClassement) {
        blocClassement.style.display = statut === 'micro' ? 'flex' : 'none';
    }
    
    // Mettre à jour l'interface
    document.getElementById('statut-fiscal-title').textContent = statutUpperCase;
    document.getElementById('statut-fiscal-badge').textContent = statutUpperCase;
    
    // Adapter la couleur du badge
    const badge = document.getElementById('statut-fiscal-badge');
    if (statut === 'lmp') {
        badge.style.background = '#e67e22';
    } else if (statut === 'micro') {
        badge.style.background = '#3498db';
    } else {
        badge.style.background = '#2ecc71';
    }
    
    // Adapter la note explicative
    const noteLabel = document.getElementById('statut-fiscal-note-label');
    const noteText = document.getElementById('statut-fiscal-note-text');
    
    if (statut === 'lmp') {
        noteLabel.textContent = 'Régime LMP au réel';
        const anneeSimulation = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
        const config = window.TAUX_FISCAUX.getConfig(anneeSimulation);
        noteText.textContent = `Les cotisations sont calculées sur le bénéfice imposable avec cotisations minimales SSI (~${config.COTISATIONS_MINIMALES.montant}€/an même si bénéfice nul).`;
    } else if (statut === 'micro') {
        noteLabel.textContent = 'Régime Micro-BIC';
        noteText.textContent = 'Abattement forfaitaire de 30% (non classé) ou 50% (classé ⭐). Pas de cotisations si CA < 23k€. Option versement libératoire disponible.';
    } else {
        noteLabel.textContent = 'Régime LMNP au réel';
        noteText.textContent = 'Les cotisations sont calculées uniquement sur le bénéfice imposable. Pas de cotisations minimales en LMNP.';
    }
    
    // Recalculer avec le nouveau statut
    calculerTempsReel();
    calculerTableauComparatif();
    verifierSeuilsStatut();
}

/**
 * Ajuste automatiquement le statut fiscal selon les critères LMP
 * CRITÈRES LMP : recettes locatives > 23k€ ET > autres revenus professionnels du foyer
 * @param {number} ca - Chiffre d'affaires (recettes de location)
 * @param {number} benefice - Bénéfice (pour recalcul URSSAF si changement)
 * @param {number} urssafActuel - URSSAF actuel
 */
function ajusterStatutFiscalAutomatique(ca, benefice, urssafActuel) {
    const statut = document.getElementById('statut_fiscal').value;
    
    if (ca === 0) return;
    
    const SEUIL_CA_LMNP = 23000;
    
    const recettesLocation = ca; // CA de la location meublée

    const autresRevenusProfessionnels = getAutresRevenusProfessionnelsFoyer();

    // CRITÈRES LMP : CA > 23k€ ET recettes location > autres revenus professionnels
    const critereCA = ca > SEUIL_CA_LMNP;
    const criterePart = recettesLocation > autresRevenusProfessionnels;
    const doitEtreLMP = critereCA && criterePart;
    
    // Si en LMNP mais doit être LMP, forcer le changement
    if (statut === 'lmnp' && doitEtreLMP) {
        document.getElementById('statut_fiscal').value = 'lmp';
        
        // Mettre à jour le badge immédiatement
        const badge = document.getElementById('statut-fiscal-badge');
        if (badge) {
            badge.textContent = 'LMP';
            badge.style.background = '#e74c3c';
        }
        
        // Recalculer URSSAF en mode LMP (cotisations minimales 1200€)
        const annee = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
        const config = window.TAUX_FISCAUX.getConfig(annee);

        const { urssaf: urssafNew } = calculerURSSAF(benefice, ca, 'lmp', config);
        
        const resteAvantIRNew = benefice - urssafNew;
        
        // Mettre à jour l'affichage
        document.getElementById('preview-urssaf').textContent = urssafNew.toFixed(2) + ' €';
        document.getElementById('preview-reste').textContent = resteAvantIRNew.toFixed(2) + ' €';
        document.getElementById('detail-total-urssaf').textContent = urssafNew.toFixed(2) + ' €';
        
        // Forcer la mise à jour du badge et des messages
        setTimeout(() => {
            verifierSeuilsStatut();
            comparerReelVsMicroBIC();
            calculerTableauComparatif();
        }, 50);
    }
}

/**
 * Vérifie si les seuils LMNP sont dépassés et adapte le select statut
 * Utilise EXACTEMENT la même logique que le tableau comparatif
 * Ne touche PAS au statut Micro-BIC (choix manuel)
 */
function verifierSeuilsStatut() {
    const ca = parseFloat(document.getElementById('ca')?.value || 0);
    const statut = document.getElementById('statut_fiscal').value;
    const alerteDiv = document.getElementById('alerte-seuil-statut');
    const alerteMessage = document.getElementById('alerte-seuil-message');
    
    const selectStatut = document.getElementById('statut_fiscal');
    const optionLMNP = selectStatut?.querySelector('option[value="lmnp"]');
    const optionMicro = selectStatut?.querySelector('option[value="micro"]');
    const optionLMP = selectStatut?.querySelector('option[value="lmp"]');
    
    // Si CA = 0, réinitialiser
    if (ca === 0) {
        alerteDiv.style.display = 'none';
        if (optionLMNP) {
            optionLMNP.disabled = false;
            optionLMNP.textContent = 'LMNP';
        }
        if (optionMicro) {
            optionMicro.disabled = false;
            optionMicro.textContent = 'Micro-BIC';
        }
        if (optionLMP) {
            optionLMP.disabled = true;
            optionLMP.textContent = 'LMP (critères non remplis)';
        }
        return;
    }
    
    // Récupérer les données (MÊME LOGIQUE que calculerTableauComparatif)
    const salaireMadame = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieur = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const revenusSalaries = salaireMadame + salaireMonsieur;
    const autresRevenusProfessionnels = getAutresRevenusProfessionnelsFoyer();
    
    const beneficeReel = parseFloat(document.getElementById('preview-benefice')?.textContent?.replace(/[€\s]/g, '') || 0);
    const urssafReel = parseFloat(document.getElementById('preview-urssaf')?.textContent?.replace(/[€\s]/g, '') || 0);
    const resteAvantIRReel = parseFloat(document.getElementById('preview-reste')?.textContent?.replace(/[€\s]/g, '') || 0);
    
    // CRITÈRES IDENTIQUES AU TABLEAU COMPARATIF
    const recettesSupAutresRevenus = ca > autresRevenusProfessionnels;
    
    // LMP OBLIGATOIRE (grise LMNP dans le tableau)
    const lmpObligatoire = ca > 23000 && recettesSupAutresRevenus;
    
    // PEUT ÊTRE LMP (active LMP dans le tableau)
    const critereCA_LMP = ca > 23000;
    const criterePart_LMP = recettesSupAutresRevenus;
    const forceLMP = statut === 'lmp';
    const peutEtreLMP = forceLMP || (critereCA_LMP && criterePart_LMP);
    
    // ADAPTER LE SELECT SELON LES MÊMES RÈGLES QUE LE TABLEAU
    // Micro-BIC : toujours accessible jusqu'à 77 700€, mais force le classement si > 15 000€
    const PLAFOND_MICRO_NON_CLASSE = 15000;
    const PLAFOND_MICRO_CLASSE = 77700;
    const selectClassement = document.getElementById('classement_meuble');
    const estClasse = selectClassement?.value === 'classe';
    
    // 🔄 FORÇAGE AUTOMATIQUE DU CLASSEMENT si CA > 15 000€
    if (ca > PLAFOND_MICRO_NON_CLASSE && ca <= PLAFOND_MICRO_CLASSE && !estClasse) {
        // Forcer automatiquement "Classé ⭐"
        if (selectClassement) {
            selectClassement.value = 'classe';
            // Les calculs suivants (calculerTableauComparatif) utiliseront automatiquement la nouvelle valeur
        }
    }
    
    // 🔒 Verrouiller le select classement selon le CA
    if (selectClassement) {
        const optionNonClasse = selectClassement.querySelector('option[value="non_classe"]');
        const optionClasse = selectClassement.querySelector('option[value="classe"]');
        
        if (ca > PLAFOND_MICRO_NON_CLASSE && ca <= PLAFOND_MICRO_CLASSE) {
            // Désactiver "Non classé" si CA > 15 000€
            if (optionNonClasse) {
                optionNonClasse.disabled = true;
                optionNonClasse.textContent = 'Non classé (⛔ CA > 15 000 €)';
            }
            if (optionClasse) {
                optionClasse.disabled = false;
                optionClasse.textContent = 'Classé ⭐';
            }
        } else {
            // Réactiver les deux options si CA ≤ 15 000€
            if (optionNonClasse) {
                optionNonClasse.disabled = false;
                optionNonClasse.textContent = 'Non classé';
            }
            if (optionClasse) {
                optionClasse.disabled = false;
                optionClasse.textContent = 'Classé ⭐';
            }
        }
    }
    
    // Micro-BIC désactivé UNIQUEMENT si CA > 77 700€ (plafond classé)
    if (optionMicro) {
        if (ca > PLAFOND_MICRO_CLASSE) {
            optionMicro.disabled = true;
            optionMicro.textContent = `Micro-BIC (⛔ CA > ${PLAFOND_MICRO_CLASSE.toLocaleString('fr-FR')} €)`;
        } else {
            optionMicro.disabled = false;
            if (ca > PLAFOND_MICRO_NON_CLASSE && ca <= PLAFOND_MICRO_CLASSE) {
                optionMicro.textContent = 'Micro-BIC (⭐ classé requis)';
            } else {
                optionMicro.textContent = 'Micro-BIC';
            }
        }
    }
    
    // LMNP : désactivé si LMP obligatoire (CA > 23k ET recettes > 50%)
    if (optionLMNP) {
        if (lmpObligatoire) {
            optionLMNP.disabled = true;
            optionLMNP.textContent = 'LMNP (⛔ LMP obligatoire)';
        } else {
            optionLMNP.disabled = false;
            optionLMNP.textContent = 'LMNP';
        }
    }
    
    // LMP : TOUJOURS disponible (choix anticipé possible)
    if (optionLMP) {
        optionLMP.disabled = false;
        optionLMP.textContent = 'LMP';
    }
    
    // FORÇAGE AUTOMATIQUE DU STATUT
    // Si Micro-BIC sélectionné mais CA > 77 700€ (plafond absolu) → basculer automatiquement
    if (statut === 'micro' && ca > PLAFOND_MICRO_CLASSE) {
        if (lmpObligatoire) {
            selectStatut.value = 'lmp';
        } else {
            selectStatut.value = 'lmnp';
        }
        changerStatutFiscal();
    }
    
    // Si LMNP sélectionné mais LMP obligatoire → basculer automatiquement
    if (statut === 'lmnp' && lmpObligatoire) {
        selectStatut.value = 'lmp';
        changerStatutFiscal();
    }
    
    // Afficher les alertes
    if (statut === 'micro') {
        // Afficher alerte spécifique pour Micro-BIC si classement forcé
        if (ca > PLAFOND_MICRO_NON_CLASSE && ca <= PLAFOND_MICRO_CLASSE) {
            alerteDiv.style.display = 'block';
            alerteDiv.style.background = '#fff3cd';
            alerteDiv.style.borderLeft = '4px solid #ffc107';
            alerteMessage.innerHTML = `⚠️ <strong>Classement ⭐ obligatoire</strong> : CA (${ca.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €) > 15 000 € → Passage automatique en meublé classé (plafond 77 700 €)`;
        } else if (ca <= PLAFOND_MICRO_NON_CLASSE) {
            alerteDiv.style.display = 'block';
            alerteDiv.style.background = '#d4edda';
            alerteDiv.style.borderLeft = '4px solid #28a745';
            alerteMessage.innerHTML = `✅ <strong>Statut Micro-BIC valide</strong> : CA ≤ ${PLAFOND_MICRO_NON_CLASSE.toLocaleString('fr-FR')} € → Choix libre du classement`;
        } else {
            alerteDiv.style.display = 'none';
        }
    } else if (lmpObligatoire) {
        alerteDiv.style.display = 'block';
        alerteDiv.style.background = '#f8d7da';
        alerteDiv.style.borderLeft = '4px solid #dc3545';
        // CORRECTION 5 - 2026-02-17
        alerteMessage.innerHTML = `⚠️ <strong>Passage automatique en statut LMP</strong><br>
            • CA (${ca.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €) > 23 000 €<br>
            • Recettes locatives (${ca.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €) > autres revenus professionnels (${autresRevenusProfessionnels.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €)<br>
            → <strong>Affiliation SSI obligatoire (Sécurité Sociale des Indépendants)</strong>
            <span title="Depuis la décision du Conseil constitutionnel du 8 octobre 2021, l'inscription au RCS n'est plus une condition du statut LMP." style="margin-left: 6px; cursor: help;">ℹ️</span>`;
    } else if (statut === 'lmnp' && ca < 23000) {
        alerteDiv.style.display = 'block';
        alerteDiv.style.background = '#d4edda';
        alerteDiv.style.borderLeft = '4px solid #28a745';
        alerteMessage.innerHTML = `✅ <strong>Statut LMNP valide</strong> : CA < 23 000 € → Pas de cotisations sociales`;
    } else if (statut === 'lmnp' && ca >= 23000) {
        alerteDiv.style.display = 'block';
        alerteDiv.style.background = '#d4edda';
        alerteDiv.style.borderLeft = '4px solid #28a745';
        alerteMessage.innerHTML = `✅ <strong>Statut LMNP maintenu</strong> : Recettes locatives (${ca.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €) ≤ autres revenus professionnels (${autresRevenusProfessionnels.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €)`;
    } else if (statut === 'lmp' && peutEtreLMP) {
        alerteDiv.style.display = 'block';
        alerteDiv.style.background = '#d4edda';
        alerteDiv.style.borderLeft = '4px solid #28a745';
        alerteMessage.innerHTML = `✅ <strong>Statut LMP valide</strong> : CA > 23 000 € et recettes locatives > autres revenus professionnels du foyer`;
    } else {
        alerteDiv.style.display = 'none';
    }
}

function sauvegardeAutomatique() {
    // Ne pas sauvegarder pendant un toggle de période
    if (isTogglingPeriod) {
        return;
    }
    
    const ca = parseFloat(document.getElementById('ca')?.value || 0);
    if (ca === 0) {
        return;
    }
    sauvegarderDonneesFiscales(true); // true = mode silencieux
}

function calculerTempsReel() {
    if (isCalculatingTempsReel) {
        return;
    }
    
    clearTimeout(calculTempsReelTimeout);
    calculTempsReelTimeout = setTimeout(async () => {
        isCalculatingTempsReel = true;
        const ca = parseFloat(document.getElementById('ca')?.value || 0);
        if (ca === 0) {
            // Réinitialiser l'affichage (avec vérification null)
            const previewBenefice = document.getElementById('preview-benefice');
            const previewUrssaf = document.getElementById('preview-urssaf');
            const previewReste = document.getElementById('preview-reste');
            const detailSociales = document.getElementById('detail-sociales');
            const detailCsgCrds = document.getElementById('detail-csg-crds');
            const detailFormationPro = document.getElementById('detail-formation-pro');
            const detailAllocations = document.getElementById('detail-allocations');
            const detailTotalUrssaf = document.getElementById('detail-total-urssaf');
            const detailTrimestres = document.getElementById('detail-trimestres');
            
            if (previewBenefice) previewBenefice.textContent = '0 €';
            if (previewUrssaf) previewUrssaf.textContent = '0 €';
            if (previewReste) previewReste.textContent = '0 €';
            if (detailSociales) detailSociales.textContent = '0 €';
            if (detailCsgCrds) detailCsgCrds.textContent = '0 €';
            if (detailFormationPro) detailFormationPro.textContent = '0 €';
            if (detailAllocations) detailAllocations.textContent = '0 €';
            if (detailTotalUrssaf) detailTotalUrssaf.textContent = '0 €';
            if (detailTrimestres) detailTrimestres.textContent = '0';
            
            isCalculatingTempsReel = false;
            return;
        }
        
        // ✅ FISCALITÉ : Charger TOUS les gîtes (pas seulement ceux visibles selon l'abonnement)
        const gites = await window.gitesManager.getAll();
        let chargesBiens = 0;
        gites.forEach(gite => {
            const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            chargesBiens += calculerChargesBien(giteSlug);
        });
        
        // ⚠️ CORRECTION 6 : Séparer charges immédiates et amortissements
        // 1. Charges immédiates (< 600€ HT ou type_amortissement vide)
        const chargesImmediates = [
            ...getTravauxListe().filter(item => !item.type_amortissement || item.type_amortissement === ''),
            ...getFraisDiversListe().filter(item => !item.type_amortissement || item.type_amortissement === ''),
            ...getProduitsAccueilListe().filter(item => !item.type_amortissement || item.type_amortissement === '')
        ].reduce((sum, item) => sum + item.montant, 0);
        
        // 2. Amortissements de l'année en cours uniquement
        const amortissements = calculerAmortissementsAnneeCourante();
        
        // Total charges du bien = charges fixes + charges immédiates + amortissements année en cours
        chargesBiens += chargesImmediates + amortissements.montantAnnuel;
        
        const ratio = calculerRatio();
        const chargesResidence = calculerChargesResidence() * ratio;
        const fraisPro = calculerFraisProfessionnels();
        const fraisVehicule = calculerFraisVehicule();

        // ⚠️ ALIGNEMENT CALCUL PRINCIPAL:
        // Bénéfice imposable = CA - (Charges biens + Frais pro + Crédits immobiliers)
        // Les charges résidence principale et frais véhicule restent affichés à titre indicatif,
        // mais ne sont pas inclus dans le total déductible fiscal.
        const creditsListe = getCreditsListe();
        const totalCredits = creditsListe.reduce((sum, c) => sum + (c.mensualite * 12), 0);

        const totalCharges = chargesBiens + fraisPro + totalCredits;
        const benefice = ca - totalCharges;
        
        // ==========================================
        // CALCUL URSSAF avec TAUX CONFIGURABLES
        // ==========================================
        const annee = new Date().getFullYear();
        const config = window.TAUX_FISCAUX.getConfig(annee);
        
        const statutFiscal = document.getElementById('statut_fiscal')?.value || 'lmnp';
        // CORRECTION 1 - 2026-02-17
        const urssafResult = calculerURSSAF(benefice, ca, statutFiscal, config);
        const urssaf = urssafResult.urssaf;
        const indemnites = urssafResult.detail.indemnites;
        const retraiteBase = urssafResult.detail.retraiteBase;
        const retraiteCompl = urssafResult.detail.retraiteCompl;
        const invalidite = urssafResult.detail.invalidite;
        const csgCrds = urssafResult.detail.csgCrds;
        const formationPro = urssafResult.detail.formationPro;
        const allocations = urssafResult.detail.allocations;
        
        const resteAvantIR = benefice - urssaf;
        
        // VÉRIFIER ET AJUSTER LE STATUT FISCAL APRÈS CALCUL (utilise le CA, pas le bénéfice)
        ajusterStatutFiscalAutomatique(ca, benefice, urssaf);
        
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
        
        // Vérifier les seuils de statut fiscal (LMNP/LMP)
        verifierSeuilsStatut();
        
        // Comparaison Réel vs Micro-BIC (uniquement en LMNP)
        comparerReelVsMicroBIC();
        
        // Tableau comparatif des 4 options
        calculerTableauComparatif();
        
        // Calculer le reste à vivre
        setTimeout(() => {
            calculerResteAVivre();
            isCalculatingTempsReel = false; // Réinitialiser le flag
        }, 100);
        
        // 💾 SAUVEGARDE AUTOMATIQUE pour les années précédentes
        const anneeSimulation = parseInt(document.getElementById('annee_simulation')?.value);
        const anneeActuelle = new Date().getFullYear();
        if (anneeSimulation && anneeSimulation < anneeActuelle) {
            setTimeout(() => {
                sauvegarderDonneesFiscales(true);
                setTimeout(() => verifierSauvegardeAnnee(anneeSimulation), 1000);
            }, 600);
        }
        
    }, 500);
}

function calculerChargesBien(type) {
    // console.log(`  🔧 calculerChargesBien('${type}') appelée`);
    const internet = getAnnualValue(`internet_${type}`, `internet_${type}_type`);
    const eau = getAnnualValue(`eau_${type}`, `eau_${type}_type`);
    const electricite = getAnnualValue(`electricite_${type}`, `electricite_${type}_type`);
    const assuranceHab = getAnnualValue(`assurance_hab_${type}`, `assurance_hab_${type}_type`);
    const assuranceEmprunt = getAnnualValue(`assurance_emprunt_${type}`, `assurance_emprunt_${type}_type`);
    const interetsEmprunt = getAnnualValue(`interets_emprunt_${type}`, `interets_emprunt_${type}_type`);
    const menage = getAnnualValue(`menage_${type}`, `menage_${type}_type`);
    const linge = getAnnualValue(`linge_${type}`, `linge_${type}_type`);
    const logiciel = getAnnualValue(`logiciel_${type}`, `logiciel_${type}_type`);
    const copropriete = getAnnualValue(`copropriete_${type}`, `copropriete_${type}_type`);
    const taxeFonciere = parseFloat(document.getElementById(`taxe_fonciere_${type}`)?.value || 0);
    const cfe = parseFloat(document.getElementById(`cfe_${type}`)?.value || 0);
    const commissions = parseFloat(document.getElementById(`commissions_${type}`)?.value || 0);
    const amortissementImmobilier = parseFloat(document.getElementById(`amortissement_${type}`)?.value || 0);
    
    const total = internet + eau + electricite + assuranceHab + assuranceEmprunt + interetsEmprunt + 
           menage + linge + logiciel + copropriete + taxeFonciere + cfe + commissions + amortissementImmobilier;
    
    // console.log(`    Détail ${type}:`, {
    //     internet, eau, electricite, assuranceHab, assuranceEmprunt, interetsEmprunt,
    //     menage, linge, logiciel, copropriete, taxeFonciere, cfe, commissions, 
    //     amortissementImmobilier, total
    // });
    
    return total;
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

// ========================================
// 💰 CALCUL GLOBAL DES CHARGES PAR GÎTE
// Fonction exportée pour dashboard.js et statistiques.js
// ========================================

/**
 * Calcule les charges totales SANS AMORTISSEMENT par gîte et globales
 * MÉTHODE SIMPLE : Total charges - Amortissements immobiliers
 * @param {Object} simFiscale - Simulation fiscale (ou null pour utiliser les champs actuels)
 * @param {Array} gitesData - Liste des gîtes (ou null pour utiliser window.GITES_DATA)
 * @returns {Object} { parGite: {giteId: montant}, gitesTotales: montant, globales: montant, total: montant }
 */
window.calculerChargesParGiteSansAmortissement = async function(simFiscale = null, gitesData = null) {
    // console.log('🔧 calculerChargesParGiteSansAmortissement appelée (MÉTHODE DOM)');
    // console.log('🔧 simFiscale:', simFiscale ? 'Présente' : 'Absente');
    
    const gites = gitesData || window.GITES_DATA || await window.gitesManager.getVisibleGites();
    // console.log('🔧 Nombre de gîtes:', gites.length);
    
    // ✅ ÉTAPE 1 : Récupérer le TOTAL CHARGES depuis le DOM (élément affiché)
    const totalChargesElement = document.getElementById('total-charges-annuelles');
    let totalChargesAvecAmort = 0;
    
    if (totalChargesElement && totalChargesElement.textContent) {
        // Parser le texte "88496.21 €" -> 88496.21
        const textValue = totalChargesElement.textContent.replace(/[€\s]/g, '').replace(',', '.');
        totalChargesAvecAmort = parseFloat(textValue) || 0;
        // console.log('📥 Total charges (depuis DOM #total-charges-annuelles):', totalChargesAvecAmort.toFixed(2), '€');
    } else if (simFiscale) {
        // Fallback : lire depuis la BDD
        const isFiscalHistory = simFiscale && simFiscale.donnees_detaillees;
        const details = isFiscalHistory ? simFiscale.donnees_detaillees : simFiscale;
        totalChargesAvecAmort = parseFloat(details.charges_total || 0);
        // console.log('📥 Total charges (depuis BDD):', totalChargesAvecAmort.toFixed(2), '€');
    }
    
    // ✅ ÉTAPE 2 : Calculer le total des AMORTISSEMENTS IMMOBILIERS uniquement
    let totalAmortissements = 0;
    
    for (const gite of gites) {
        // ⚠️ TOUJOURS recalculer le slug depuis le nom pour cohérence avec les IDs HTML
        const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        let amortGite = 0;
        
        // Lire depuis le DOM en priorité
        const inputAmort = document.getElementById(`amortissement_${giteSlug}`);
        if (inputAmort && inputAmort.value) {
            amortGite = parseFloat(inputAmort.value || 0);
            // console.log(`  🔍 DOM trouvé pour ${gite.name} (${giteSlug}): ${amortGite}€`);
        } else {
            // console.log(`  ⚠️ DOM introuvable: #amortissement_${giteSlug}`);
            // Fallback : lire depuis la BDD
            const isFiscalHistory = simFiscale && simFiscale.donnees_detaillees;
            const details = isFiscalHistory ? simFiscale.donnees_detaillees : simFiscale;
            
            if (isFiscalHistory && details.charges_gites && details.charges_gites[giteSlug]) {
                amortGite = parseFloat(details.charges_gites[giteSlug].amortissement || 0);
                // console.log(`  📥 BDD charges_gites[${giteSlug}]: ${amortGite}€`);
            } else {
                amortGite = parseFloat(simFiscale[`amortissement_${giteSlug}`] || 0);
                // console.log(`  📥 BDD simFiscale[amortissement_${giteSlug}]: ${amortGite}€`);
            }
        }
        
        totalAmortissements += amortGite;
        // console.log(`  🏠 ${gite.name}: amortissement = ${amortGite.toFixed(2)}€`);
    }
    
    // console.log('🏗️ Total amortissements immobiliers:', totalAmortissements.toFixed(2), '€');
    
    // ✅ ÉTAPE 3 : CHARGES SANS AMORTISSEMENT = Total - Amortissements
    const chargesSansAmort = totalChargesAvecAmort - totalAmortissements;
    
    // console.log('💰 TOTAL CHARGES AVEC amortissements:', totalChargesAvecAmort.toFixed(2), '€');
    // console.log('💰 TOTAL CHARGES SANS amortissements:', chargesSansAmort.toFixed(2), '€');
    
    // Retour simplifié (pour compatibilité avec l'existant)
    return {
        parGite: {}, // Non utilisé dans cette version simplifiée
        gitesTotales: chargesSansAmort,
        globales: 0, // Déjà inclus dans le total
        total: chargesSansAmort
    };
};

// ===========================
// FONCTION DÉTAIL DES CHARGES
// ===========================
function afficherDetailCharges(chargesBiens, amortissements, fraisPro, fraisVehicule, chargesResidence, totalCharges) {
    // 1. Charges par gîte (incluant amortissements et charges immédiates liés à chaque bien)
    const gitesListe = document.getElementById('charges-gites-liste');
    if (gitesListe) {
        gitesListe.innerHTML = '';
        const gites = window.GITES_DATA || [];
        
        gites.forEach(gite => {
            const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Charges fixes du bien (SANS l'amortissement immobilier qui sera affiché dans la section dédiée)
            const chargesFixesGite = calculerChargesBien(giteSlug);
            const amortissementImmobilierGite = parseFloat(document.getElementById(`amortissement_${giteSlug}`)?.value || 0);
            const chargesSansAmortImmo = chargesFixesGite - amortissementImmobilierGite;
            
            // Charges immédiates du bien (travaux/frais/produits < 600€ liés à ce gîte)
            const chargesImmediatesGite = [
                ...getTravauxListe().filter(item => 
                    (!item.type_amortissement || item.type_amortissement === '') && 
                    item.gite_slug === giteSlug
                ),
                ...getFraisDiversListe().filter(item => 
                    (!item.type_amortissement || item.type_amortissement === '') && 
                    item.gite_slug === giteSlug
                ),
                ...getProduitsAccueilListe().filter(item => 
                    (!item.type_amortissement || item.type_amortissement === '') && 
                    item.gite_slug === giteSlug
                )
            ].reduce((sum, item) => sum + item.montant, 0);
            
            // Total gîte = charges fixes (sans amort immo) + charges immédiates
            // Les amortissements (immo + travaux) sont affichés dans une section dédiée
            const totalGite = chargesSansAmortImmo + chargesImmediatesGite;
            
            const div = document.createElement('div');
            div.className = 'info-box';
            div.style.cssText = 'display: flex; justify-content: space-between; padding: 12px;';
            div.innerHTML = `
                <span>${gite.name} (hors amortissements)</span>
                <strong style="color: #00C2CB;">${totalGite.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</strong>
            `;
            gitesListe.appendChild(div);
        });
    }
    
    // 2. Amortissements détaillés (immobiliers + travaux)
    const amortissementsListe = document.getElementById('amortissements-liste');
    if (amortissementsListe) {
        amortissementsListe.innerHTML = '';
        
        // A. Amortissements immobiliers (champs annuels par bien)
        const gites = window.GITES_DATA || [];
        let totalAmortImmobilier = 0;
        
        const divImmobilier = document.createElement('div');
        divImmobilier.innerHTML = '<h5 style="margin: 10px 0 5px; color: #666; font-size: 0.9rem;">🏠 Amortissements immobiliers</h5>';
        amortissementsListe.appendChild(divImmobilier);
        
        gites.forEach(gite => {
            const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const amortImmo = parseFloat(document.getElementById(`amortissement_${giteSlug}`)?.value || 0);
            
            if (amortImmo > 0) {
                totalAmortImmobilier += amortImmo;
                const div = document.createElement('div');
                div.className = 'info-box';
                div.style.cssText = 'display: flex; justify-content: space-between; padding: 12px; margin-left: 15px;';
                div.innerHTML = `
                    <span>${gite.name} (immobilier)</span>
                    <strong style="color: #00C2CB;">${amortImmo.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</strong>
                `;
                amortissementsListe.appendChild(div);
            }
        });
        
        // B. Amortissements travaux/mobilier (liste dynamique)
        if (amortissements.details && amortissements.details.length > 0) {
            const divTravaux = document.createElement('div');
            divTravaux.innerHTML = '<h5 style="margin: 20px 0 5px; color: #666; font-size: 0.9rem;">🔧 Amortissements travaux & mobilier</h5>';
            amortissementsListe.appendChild(divTravaux);
            
            amortissements.details.forEach(item => {
                const div = document.createElement('div');
                div.className = 'info-box';
                div.style.cssText = 'display: flex; justify-content: space-between; padding: 12px; margin-left: 15px;';
                div.innerHTML = `
                    <span>${item.description} (${item.type})</span>
                    <strong style="color: #00C2CB;">${item.montantAnnuel.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</strong>
                `;
                amortissementsListe.appendChild(div);
            });
        }
        
        // Total des amortissements
        const totalAmortissements = totalAmortImmobilier + (amortissements.montantAnnuel || 0);
        const totalDiv = document.createElement('div');
        totalDiv.className = 'card';
        totalDiv.style.cssText = 'background: #f0f9ff; padding: 12px; margin-top: 15px; border-left: 4px solid #00C2CB;';
        totalDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">TOTAL amortissements (immobilier + travaux)</span>
                <strong style="font-size: 1.2rem; color: #00C2CB;">${totalAmortissements.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</strong>
            </div>
        `;
        amortissementsListe.appendChild(totalDiv);
    }
    
    // 3. Frais professionnels
    const fraisProTotal = document.getElementById('detail-frais-pro-total');
    if (fraisProTotal) {
        fraisProTotal.textContent = `${fraisPro.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`;
    }
    
    // 4. Frais véhicule
    const fraisVehiculeTotal = document.getElementById('detail-frais-vehicule-total');
    if (fraisVehiculeTotal) {
        fraisVehiculeTotal.textContent = `${fraisVehicule.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`;
    }
    
    // 5. Charges résidence
    const chargesResidenceTotal = document.getElementById('detail-charges-residence-total');
    if (chargesResidenceTotal) {
        chargesResidenceTotal.textContent = `${chargesResidence.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`;
    }
    
    // 6. Total général
    const totalChargesElem = document.getElementById('detail-total-charges');
    if (totalChargesElem) {
        totalChargesElem.textContent = `${totalCharges.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`;
    }
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
    
    // CORRECTION 3 - 2026-02-17
    // Récupérer la config fiscale pour l'année simulée
    const annee = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
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
    
    // CORRECTION 2 - 2026-02-17
    // Imputation du déficit LMP sur le revenu global (plancher à 0)
    const salairesImposables = salaireMadame + salaireMonsieur;
    const revenuTotal = revenuLMP < 0
        ? Math.max(0, salairesImposables + revenuLMP)
        : (salairesImposables + revenuLMP);
    
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
    const resteFinalLMP = revenuTotal > 0
        ? (revenuLMP - (impotTotal * (revenuLMP / revenuTotal)))
        : revenuLMP;
    
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
    // CORRECTION 3 - 2026-02-17
    const annee = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
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
    
    // Année et config
    const annee = parseInt(document.getElementById('annee_simulation')?.value || new Date().getFullYear());
    const config = window.TAUX_FISCAUX.getConfig(annee);
    
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
    const creditsListe = getCreditsListe();
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
    
    // CORRECTION 1 - 2026-02-17
    const statutFiscal = document.getElementById('statut_fiscal')?.value || 'lmnp';
    const urssafResult = calculerURSSAF(benefice, ca, statutFiscal, config);
    const cotisations = {
        indemnites: urssafResult.detail.indemnites,
        retraiteBase: urssafResult.detail.retraiteBase,
        retraiteCompl: urssafResult.detail.retraiteCompl,
        invalidite: urssafResult.detail.invalidite,
        csgCrds: urssafResult.detail.csgCrds,
        formationPro: urssafResult.detail.formationPro,
        allocations: urssafResult.detail.allocations
    };

    const totalCotisations = urssafResult.urssaf;
    
    const resteAvantIR = benefice - totalCotisations;
    
    // TRIMESTRES RETRAITE (1 trimestre = 600 SMIC horaire)
    const smicHoraire = config.SMIC_HORAIRE || 11.88;
    const trimestres = Math.min(4, Math.floor(benefice / (600 * smicHoraire)));
    
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
        
        // Ajouter toujours les années 2024, 2025 et 2026 si elles n'existent pas
        const anneeActuelle = new Date().getFullYear();
        const anneesAGarantir = [2024, 2025, 2026, anneeActuelle];
        
        anneesAGarantir.forEach(annee => {
            if (!anneesUniques.includes(annee)) {
                anneesUniques.push(annee);
            }
        });
        
        // Trier par ordre décroissant
        anneesUniques.sort((a, b) => b - a);
        
        const selector = document.getElementById('annee_selector');
        if (!selector) return;
        
        window.SecurityUtils.setInnerHTML(selector, '');
        
        // Si aucune année, créer l'année actuelle
        if (anneesUniques.length === 0) {
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
    const anneeActuelle = new Date().getFullYear();
    
    try {
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
            document.getElementById('annee_simulation').value = annee;
            
            // Si pas l'année en cours, pré-remplir avec les données de l'année en cours
            if (parseInt(annee) !== anneeActuelle) {
                // Charger les données de l'année en cours pour pré-remplissage
                const { data: dataAnneeCourante } = await window.supabaseClient
                    .from('fiscal_history')
                    .select('*')
                    .eq('year', anneeActuelle)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (dataAnneeCourante && dataAnneeCourante.donnees_detaillees) {
                    // Pré-remplir avec les frais de l'année en cours
                    const detailsCourante = dataAnneeCourante.donnees_detaillees;
                    
                    // Véhicule
                    const vehiculeTypeEl = document.getElementById('vehicule_type');
                    const puissanceFiscaleEl = document.getElementById('puissance_fiscale');
                    if (vehiculeTypeEl && detailsCourante.vehicule_type) vehiculeTypeEl.value = detailsCourante.vehicule_type;
                    if (puissanceFiscaleEl && detailsCourante.puissance_fiscale) puissanceFiscaleEl.value = detailsCourante.puissance_fiscale;
                    if (detailsCourante.km_professionnels) document.getElementById('km_professionnels').value = detailsCourante.km_professionnels;
                    togglePuissanceField();
                    
                    // Charges des gîtes
                    if (window.GITES_DATA && detailsCourante.charges_gites) {
                        window.GITES_DATA.forEach(gite => {
                            const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const giteCharges = detailsCourante.charges_gites[slug];
                            
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
                    if (detailsCourante.surface_bureau !== undefined) document.getElementById('surface_bureau').value = detailsCourante.surface_bureau;
                    if (detailsCourante.surface_totale !== undefined) document.getElementById('surface_totale').value = detailsCourante.surface_totale;
                    
                    const interetsRes = document.getElementById('interets_residence');
                    if (interetsRes && detailsCourante.interets_residence !== undefined) {
                        interetsRes.value = detailsCourante.interets_residence;
                        if (detailsCourante.interets_residence_type) interetsRes.setAttribute('data-period-type', detailsCourante.interets_residence_type);
                    }
                    
                    const assuranceRes = document.getElementById('assurance_residence');
                    if (assuranceRes && detailsCourante.assurance_residence !== undefined) {
                        assuranceRes.value = detailsCourante.assurance_residence;
                        if (detailsCourante.assurance_residence_type) assuranceRes.setAttribute('data-period-type', detailsCourante.assurance_residence_type);
                    }
                    
                    const taxeFonciereRes = document.getElementById('taxe_fonciere_residence');
                    if (taxeFonciereRes && detailsCourante.taxe_fonciere_residence !== undefined) {
                        taxeFonciereRes.value = detailsCourante.taxe_fonciere_residence;
                        if (detailsCourante.taxe_fonciere_residence_type) taxeFonciereRes.setAttribute('data-period-type', detailsCourante.taxe_fonciere_residence_type);
                    }
                    
                    const chargesCoprioRes = document.getElementById('charges_coprio_residence');
                    if (chargesCoprioRes && detailsCourante.charges_coprio_residence !== undefined) {
                        chargesCoprioRes.value = detailsCourante.charges_coprio_residence;
                        if (detailsCourante.charges_coprio_residence_type) chargesCoprioRes.setAttribute('data-period-type', detailsCourante.charges_coprio_residence_type);
                    }
                    
                    // Frais professionnels
                    if (detailsCourante.frais_telephonie) document.getElementById('frais_telephonie').value = detailsCourante.frais_telephonie;
                    if (detailsCourante.frais_comptabilite) document.getElementById('frais_comptabilite').value = detailsCourante.frais_comptabilite;
                    if (detailsCourante.frais_bancaires) document.getElementById('frais_bancaires').value = detailsCourante.frais_bancaires;
                    if (detailsCourante.frais_papeterie) document.getElementById('frais_papeterie').value = detailsCourante.frais_papeterie;
                    
                    showToast(`Frais pré-remplis depuis ${anneeActuelle}`, 'info');
                }
            } else {
                // Année en cours : valeurs par défaut
                nouvelleSimulation();
                
                const vehiculeTypeEl = document.getElementById('vehicule_type');
                const puissanceFiscaleEl = document.getElementById('puissance_fiscale');
                if (vehiculeTypeEl) vehiculeTypeEl.value = 'thermique';
                if (puissanceFiscaleEl) puissanceFiscaleEl.value = 5;
                togglePuissanceField();
            }
            
            // Calculer automatiquement le CA (utilisera année courante si pas de données pour l'année demandée)
            await calculerCAAutomatique(parseInt(annee));
            
            return;
        }
        
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
        
        // Statut fiscal LMNP/LMP
        if (details.statut_fiscal) {
            document.getElementById('statut_fiscal').value = details.statut_fiscal;
            changerStatutFiscal(); // Mettre à jour l'interface
        }
        
        // Classement meublé
        if (details.classement_meuble) {
            document.getElementById('classement_meuble').value = details.classement_meuble;
        }
        
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
                        return;
                    }
                    
                    descEl.value = item.description || '';
                    mensuelEl.value = item.mensuel || 0;
                    capitalEl.value = item.capital || 0;
                    
                    // Mettre en readonly après restauration
                    toggleEdit(`credit-${id}`);
                });
            }
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
            await calculerCAAutomatique(parseInt(annee));
        } else {
            // Pour les années passées, garder le CA tel quel
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
async function calculerCAAutomatique(anneeParam = null) {
    const annee = anneeParam || parseInt(document.getElementById('annee_simulation').value);
    
    if (!annee) {
        showToast('Veuillez sélectionner une année', 'warning');
        return;
    }
    
    try {
        const anneeActuelle = new Date().getFullYear();
        const reservations = await getAllReservations();
        
        // Filtrer par année demandée
        const reservationsAnnee = reservations.filter(r => {
            const dateDebut = parseLocalDate(r.dateDebut);
            return dateDebut.getFullYear() === annee;
        });
        
        let ca = 0;
        let messageSource = '';
        
        // Si aucune réservation pour l'année demandée, utiliser l'année en cours comme référence
        if (reservationsAnnee.length === 0 && annee !== anneeActuelle) {
            const reservationsAnneeCourante = reservations.filter(r => {
                const dateDebut = parseLocalDate(r.dateDebut);
                return dateDebut.getFullYear() === anneeActuelle;
            });
            
            if (reservationsAnneeCourante.length > 0) {
                ca = reservationsAnneeCourante.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
                messageSource = `basé sur ${anneeActuelle} (${reservationsAnneeCourante.length} réservations)`;
            } else {
                showToast(`Aucune donnée de CA disponible pour ${annee}`, 'warning');
                return;
            }
        } else {
            ca = reservationsAnnee.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
            messageSource = `${reservationsAnnee.length} réservations`;
        }
        
        // Mettre à jour le champ CA
        if (ca > 0) {
            mettreAJourAffichageCA(ca.toFixed(2));
            showToast(`✓ CA ${annee}: ${formatCurrency(ca)} (${messageSource})`, 'success');
            calculerTempsReel();
        }
        
    } catch (error) {
        console.error('Erreur calcul CA automatique:', error);
        showToast('Erreur lors du calcul du CA', 'error');
    }
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
    
    // CORRECTION 4 - 2026-02-17
    // Priorité à la valeur affichée (source unique alignée avec calculerTempsReel)
    let totalChargesCalcul = parseDisplayedAmount('total-charges-annuelles');

    // Fallback si le DOM n'est pas prêt : recalcul aligné sans charges résidence/véhicule
    if (!Number.isFinite(totalChargesCalcul) || totalChargesCalcul <= 0) {
        totalChargesCalcul = 0;

        if (window.GITES_DATA && window.GITES_DATA.length > 0) {
            window.GITES_DATA.forEach(gite => {
                const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                totalChargesCalcul += calculerChargesBien(giteSlug);
            });
        }

        const chargesImmediates = [
            ...getTravauxListe().filter(item => !item.type_amortissement || item.type_amortissement === ''),
            ...getFraisDiversListe().filter(item => !item.type_amortissement || item.type_amortissement === ''),
            ...getProduitsAccueilListe().filter(item => !item.type_amortissement || item.type_amortissement === '')
        ].reduce((sum, item) => sum + item.montant, 0);

        const amortissements = calculerAmortissementsAnneeCourante();
        const totalCredits = getCreditsListe().reduce((sum, c) => sum + (c.mensualite * 12), 0);

        totalChargesCalcul += chargesImmediates + amortissements.montantAnnuel + calculerFraisProfessionnels() + totalCredits;
    }
    
    // console.log('💾 Total charges calculé pour sauvegarde:', totalChargesCalcul.toFixed(2), '€');
    
    // 🏢 MULTI-TENANT: Collecter toutes les données dans "donnees_detaillees" JSONB
    const detailsData = {
        regime: 'reel',
        gite: 'multi', // Info stockée dans JSONB
        chiffre_affaires: parseFloat(document.getElementById('ca')?.value || 0),
        revenus_total: parseFloat(document.getElementById('ca')?.value || 0),
        charges_total: totalChargesCalcul, // ✅ CALCULÉ DYNAMIQUEMENT
        resultat_imposable: parseFloat(document.getElementById('preview-benefice')?.textContent?.replace(/[€\s]/g, '') || 0),
        impot_estime: parseFloat(document.getElementById('ir-montant')?.textContent?.replace(/[€\s]/g, '') || 0)
    };
    
    // Collecter dynamiquement les charges de chaque gîte
    const chargesGites = {};
    if (window.GITES_DATA && window.GITES_DATA.length > 0) {
        window.GITES_DATA.forEach(gite => {
            // ⚠️ TOUJOURS recalculer le slug pour cohérence
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
    
    // Statut fiscal LMNP/LMP
    detailsData.statut_fiscal = document.getElementById('statut_fiscal')?.value || 'lmnp';
    
    // Classement meublé (classé/non classé)
    detailsData.classement_meuble = document.getElementById('classement_meuble')?.value || 'non_classe';
    
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
    // console.log('🔄 [LOAD-START] Début chargement données fiscales...');
    
    try {
        // Récupérer l'année sélectionnée ou l'année en cours
        const anneeSelectionnee = document.getElementById('annee_simulation')?.value || new Date().getFullYear();
        
        // console.log(`📅 [LOAD] Chargement pour année: ${anneeSelectionnee}`);
        
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
            // console.log(`ℹ️ [LOAD-EMPTY] Aucune donnée fiscale pour ${anneeSelectionnee}`);
            return;
        }
        
        // console.log(`✅ Données fiscales ${anneeSelectionnee} chargées:`, {
        //     ca: data.revenus,
        //     nb_travaux: data.donnees_detaillees?.travaux_liste?.length || 0,
        //     derniere_modif: data.updated_at
        // });
        
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
            // console.log(`🔄 Restauration de ${travaux.length} travaux:`, travaux);
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
                
                // console.log(`✅ Travail ${index + 1} restauré:`, {
                //     id,
                //     description: item.description,
                //     type: item.type_amortissement,
                //     gite: item.gite,
                //     montant: item.montant
                // });
                
                // Mettre en readonly après restauration
                toggleEdit(`travaux-${id}`);
            });
        } else {
            // console.log('ℹ️ Aucun travail à restaurer');
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

    // Récupérer les gîtes visibles depuis gitesManager
    let gites = [];
    if (window.gitesManager) {
        try {
            gites = await window.gitesManager.getVisibleGites();
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
            <span class="toggle-icon">▼</span> <svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Charges des gîtes (100% déductibles)
        </h3>
        <div class="bloc-content">
            <!-- Toggle Mensuel/Annuel pour toutes les charges des gîtes -->
            <div class="period-toggle-container">
                <label style="font-weight: 600; margin: 0;">Périodicité des charges :</label>
                <button type="button" class="btn-toggle-period active" data-period="mensuel" data-section="gites" onclick="(function(e){e.stopPropagation(); togglePeriodSection('gites', 'mensuel');})(event)">Mensuel</button>
                <button type="button" class="btn-toggle-period" data-period="annuel" data-section="gites" onclick="(function(e){e.stopPropagation(); togglePeriodSection('gites', 'annuel');})(event)">Annuel</button>
            </div>`;
    
    gites.forEach((gite, index) => {
        const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const giteColor = gite.color || '#667eea';
        
        // Ajouter un séparateur entre les gîtes (sauf pour le premier)
        if (index > 0) {
            html += `<div class="gite-spacing"></div>`;
        }
        
        html += `
            <div class="gite-charges-block" data-gite="${giteSlug}">
                <h4 class="gite-charges-header">
                    <span class="gite-charges-icon"><svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                    ${gite.name}
                </h4>
                <div class="fiscal-grid">`;
        
        chargesFields.forEach(field => {
            const fieldId = `${field.id}_${giteSlug}`;
            
            // Ajouter /mois pour les champs avec toggle, rien pour les champs annuels
            const labelSuffix = field.hasType ? ' /mois' : '';
            
            html += `
                <div class="form-group">
                    <label>${field.label}${labelSuffix}</label>
                    <input type="number" id="${fieldId}" step="0.01" placeholder="0.00" ${field.hasType ? 'data-period-type="mensuel"' : ''}>
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

    // Récupérer les gîtes visibles depuis gitesManager
    let gites = window.GITES_DATA || [];
    if (gites.length === 0 && window.gitesManager) {
        try {
            gites = await window.gitesManager.getVisibleGites();
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
    const form = document.getElementById('calculateur-lmp');
    if (!form) {
        setTimeout(initFiscalite, 500);
        return;
    }
    
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
    
    // Empêcher la soumission du formulaire avec Entrée (qui déclencherait le premier bouton trouvé)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Empêcher la touche Entrée de déclencher des boutons dans le formulaire
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            // Déplacer le focus au champ suivant au lieu de soumettre
            const inputs = Array.from(form.querySelectorAll('input[type="number"], input[type="text"], select'));
            const currentIndex = inputs.indexOf(e.target);
            if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
            return false;
        }
    });
    
    // Ajouter la délégation pour les blocs collapsibles (au niveau du document pour être sûr)
    document.removeEventListener('click', handleToggleBloc);
    document.addEventListener('click', handleToggleBloc);
    
    
    // Charger la liste des années disponibles
    chargerListeAnnees().then(async () => {
        // Charger automatiquement la dernière simulation après avoir chargé la liste
        const anneeSelectionnee = document.getElementById('annee_selector').value;
        if (anneeSelectionnee) {
            await chargerAnnee(anneeSelectionnee);
        } else {
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
            <button type="button" class="btn-delete" onclick="supprimerCreditDOM('credit-${id}')">×</button>
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

function supprimerCreditDOM(itemId) {
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
window.changerStatutFiscal = changerStatutFiscal;
window.verifierSeuilsStatut = verifierSeuilsStatut;
window.comparerReelVsMicroBIC = comparerReelVsMicroBIC;
window.calculerTableauComparatif = calculerTableauComparatif;

// Nouvelles fonctions pour frais réels individuels par personne
window.openFraisReelsSalarieModal = openFraisReelsSalarieModal;
window.closeFraisReelsSalarieModal = closeFraisReelsSalarieModal;
window.fermerFraisSalarieModal = closeFraisReelsSalarieModal; // Alias
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
                            // console.log('💾 Sauvegarde auto des soldes...');
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
    return; // ❌ Table suivi_soldes_bancaires supprimée - 23/01/2026
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
        
        // console.log(`✅ ${soldesData.length} mois sauvegardés automatiquement`);
        
        // Actualiser le graphique
        afficherGraphiqueSoldes();
        
    } catch (error) {
        console.error('Erreur sauvegarde auto soldes:', error);
    }
}

// ==========================================
// GESTION TOGGLE PÉRIODE (MENSUEL/ANNUEL)
// ==========================================

// Flag global pour désactiver temporairement la sauvegarde automatique pendant le toggle
let isTogglingPeriod = false;

function togglePeriodSection(section, period) {
    // console.log(`🔄 Toggle période section ${section}: ${period}`);
    
    // Activer le flag pour éviter les sauvegardes automatiques pendant la conversion
    isTogglingPeriod = true;
    
    // Récupérer la période actuelle (avant le changement)
    const currentButton = document.querySelector(`[data-section="${section}"].active`);
    const periodePrecedente = currentButton?.dataset.period || 'mensuel';
    
    // Ne rien faire si on clique sur le bouton déjà actif
    if (periodePrecedente === period) {
        isTogglingPeriod = false;
        return;
    }
    
    // Mettre à jour les boutons actifs
    const buttons = document.querySelectorAll(`[data-section="${section}"]`);
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    
    // Identifier tous les inputs concernés par cette section
    let inputsSelectors = [];
    if (section === 'gites') {
        // Charges des gîtes
        const gites = window.GITES_DATA || [];
        gites.forEach(gite => {
            const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            inputsSelectors.push(
                `#internet_${giteSlug}`,
                `#eau_${giteSlug}`,
                `#electricite_${giteSlug}`,
                `#assurance_hab_${giteSlug}`,
                `#assurance_emprunt_${giteSlug}`,
                `#interets_emprunt_${giteSlug}`,
                `#menage_${giteSlug}`,
                `#linge_${giteSlug}`,
                `#logiciel_${giteSlug}`,
                `#copropriete_${giteSlug}`
            );
        });
    } else if (section === 'residence') {
        // Charges de la résidence principale
        inputsSelectors = [
            '#interets_residence',
            '#assurance_residence',
            '#electricite_residence',
            '#internet_residence',
            '#eau_residence',
            '#assurance_hab_residence'
        ];
    } else if (section === 'frais-pro') {
        // Frais professionnels
        inputsSelectors = [
            '#telephone',
            '#fournitures'
        ];
    } else if (section === 'vehicule-reels') {
        // Frais véhicule réels
        inputsSelectors = [
            '#carburant',
            '#assurance_auto'
        ];
    }
    
    // Convertir les valeurs affichées dans les inputs
    inputsSelectors.forEach(selector => {
        const input = document.querySelector(selector);
        if (!input) return;
        
        const valeurActuelle = parseFloat(input.value || 0);
        if (valeurActuelle === 0) return; // Ne rien faire pour les valeurs vides ou nulles
        
        let nouvelleValeur;
        if (periodePrecedente === 'mensuel' && period === 'annuel') {
            // Passer de mensuel à annuel : multiplier par 12
            nouvelleValeur = valeurActuelle * 12;
        } else if (periodePrecedente === 'annuel' && period === 'mensuel') {
            // Passer d'annuel à mensuel : diviser par 12
            nouvelleValeur = valeurActuelle / 12;
        } else {
            nouvelleValeur = valeurActuelle;
        }
        
        // Arrondir à 2 décimales
        nouvelleValeur = Math.round(nouvelleValeur * 100) / 100;
        
        // Mettre à jour l'input avec la nouvelle valeur
        input.value = nouvelleValeur;
        
        // Mettre à jour l'attribut data-period-type pour que getAnnualValue() sache comment traiter la valeur
        input.setAttribute('data-period-type', period);
    
    // Réactiver la sauvegarde automatique après un court délai
    setTimeout(() => {
        isTogglingPeriod = false;
    }, 1000);
    });
    
    // Mettre à jour les labels dynamiquement
    updatePeriodLabels(section, period);
    
    // Recalculer avec les nouvelles valeurs affichées
    calculerTempsReel();
}

window.togglePeriodSection = togglePeriodSection;

// Fonction pour mettre à jour les labels selon la période
function updatePeriodLabels(section, period) {
    const labelText = period === 'mensuel' ? 'mensuel' : 'annuel';
    const suffix = period === 'mensuel' ? '/mois' : '/an';
    
    if (section === 'residence') {
        // Pour la résidence, mettre à jour les <span class="period-label">
        const periodLabels = [
            'interets_residence',
            'assurance_residence',
            'electricite_residence',
            'internet_residence',
            'eau_residence',
            'assurance_hab_residence'
        ];
        
        periodLabels.forEach(fieldId => {
            const span = document.querySelector(`span.period-label[data-target="${fieldId}"]`);
            if (span) {
                span.textContent = labelText;
            }
        });
    } else if (section === 'gites') {
        // Pour les gîtes, mettre à jour les labels dans les form-group générés dynamiquement
        const gites = window.GITES_DATA || [];
        gites.forEach(gite => {
            const giteSlug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const fieldsWithToggle = [
                'internet', 'eau', 'electricite', 'assurance_hab', 
                'assurance_emprunt', 'interets_emprunt', 'menage', 
                'linge', 'logiciel', 'copropriete'
            ];
            
            fieldsWithToggle.forEach(fieldBase => {
                const input = document.getElementById(`${fieldBase}_${giteSlug}`);
                if (input) {
                    const formGroup = input.closest('.form-group');
                    if (formGroup) {
                        const label = formGroup.querySelector('label');
                        if (label) {
                            // Retirer l'ancien suffix et ajouter le nouveau
                            let text = label.textContent.replace(/\s*\/mois|\s*\/an/g, '');
                            label.textContent = `${text} ${suffix}`;
                        }
                    }
                }
            });
        });
    } else if (section === 'frais-pro' || section === 'frais_pro') {
        // Pour les frais pro avec toggle (si implémenté)
        // Note: actuellement ils utilisent des <select>, donc cette partie est pour future évolution
    } else if (section === 'vehicule-reels') {
        // Pour les frais véhicule réels (si toggle implémenté)
    }
}

window.updatePeriodLabels = updatePeriodLabels;

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
            
            // console.log(`✅ [AMORTISSEMENT] ${lignesFutures.length} lignes créées pour années futures`);
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
            // console.log(`📋 [AMORTISSEMENT] ${data.length} lignes d'amortissement chargées pour ${annee}`);
            
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
            window.SecurityUtils.setInnerHTML(containerModal, '<p style="color: var(--text-secondary); font-style: italic;">Aucun gîte configuré</p>');
            return;
        }
        
        const html = gites.map(g => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--card); border-radius: 6px; border: 1px solid #e0e0e0;">
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
                    <span style="color: var(--text-secondary);">km</span>
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
            'menage_entree': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
            'menage_sortie': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
            'courses': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
            'maintenance': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
            'autre': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
        };
        
        return `
            <div class="liste-item fiscalite-grid-5cols">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">${new Date(t.date_trajet).toLocaleDateString('fr-FR')}</span>
                <div>
                    <div style="font-weight: 600;">${typeIcons[t.type_trajet] || typeIcons.autre} ${t.motif}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${t.lieu_depart || 'Domicile'} → ${t.lieu_arrivee}</div>
                    ${t.auto_genere ? '<span style="font-size: 0.75rem; padding: 2px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px;">Auto</span>' : ''}
                </div>
                <span style="text-align: right; font-weight: 600;">${t.distance_aller.toFixed(1)} km ${t.aller_retour ? 'A/R' : 'aller'}</span>
                <span style="text-align: right; font-weight: 700; color: #27ae60;">${t.distance_totale.toFixed(1)} km</span>
                <div style="display: flex; gap: 5px; justify-content: flex-end;">
                    ${!t.auto_genere ? `
                        <button onclick="supprimerTrajet('${t.id}')" class="btn-icon" title="Supprimer">
                            <svg style="width:14px;height:14px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
        'menage_entree': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
        'menage_sortie': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
        'courses': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
        'maintenance': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        'autre': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
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
                            <div class="fiscalite-grid-5cols-compact">
                                <span style="color: var(--text-secondary); font-size: 0.85rem;">${new Date(t.date_trajet).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                <div>
                                    <div style="font-weight: 600; font-size: 0.9rem;">${typeIcons[t.type_trajet] || typeIcons.autre} ${t.motif}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${t.lieu_depart || 'Domicile'} → ${t.lieu_arrivee}</div>
                                    ${t.auto_genere ? '<span style="font-size: 0.7rem; padding: 2px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px; margin-top: 3px; display: inline-block;">Auto</span>' : ''}
                                </div>
                                <span style="text-align: right; font-size: 0.85rem; color: var(--text-secondary);">${t.distance_aller.toFixed(1)} km ${t.aller_retour ? 'A/R' : ''}</span>
                                <span style="text-align: right; font-weight: 700; color: #27ae60; font-size: 0.95rem;">${t.distance_totale.toFixed(1)} km</span>
                                <div style="text-align: right;">
                                    ${!t.auto_genere ? `
                                        <button onclick="supprimerTrajet('${t.id}')" class="btn-icon" style="background: #ff4444; color: white; padding: 5px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                            <svg style="width:12px;height:12px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
        'menage_entree': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
        'menage_sortie': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
        'courses': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
        'maintenance': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        'autre': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    };
    
    const html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0; text-transform: capitalize;"><svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${nomMois}</h4>
            <button onclick="masquerTrajetsMois()" style="padding: 6px 12px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer;">
                <svg style="width:12px;height:12px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Fermer
            </button>
        </div>
        ${trajetsMois.map(t => `
            <div class="liste-item" style="display: grid; grid-template-columns: 100px 1fr 120px 120px 80px; gap: 10px; align-items: center; padding: 10px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px;">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">${new Date(t.date_trajet).toLocaleDateString('fr-FR')}</span>
                <div>
                    <div style="font-weight: 600;">${typeIcons[t.type_trajet] || typeIcons.autre} ${t.motif}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${t.lieu_depart || 'Domicile'} → ${t.lieu_arrivee}</div>
                    ${t.auto_genere ? '<span style="font-size: 0.75rem; padding: 2px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px; margin-top: 4px; display: inline-block;">Auto</span>' : ''}
                </div>
                <span style="text-align: right; font-weight: 600;">${t.distance_aller.toFixed(1)} km ${t.aller_retour ? 'A/R' : 'aller'}</span>
                <span style="text-align: right; font-weight: 700; color: #27ae60;">${t.distance_totale.toFixed(1)} km</span>
                <div style="text-align: right;">
                    ${!t.auto_genere ? `
                        <button onclick="supprimerTrajet('${t.id}')" class="btn-icon" style="background: #ff4444; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">
                            <svg style="width:12px;height:12px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    ` : '<span style="font-size: 0.8rem; color: var(--text-secondary);">—</span>'}
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
        window.SecurityUtils.setInnerHTML(container, '<p style="color: var(--text-secondary); font-style: italic; text-align: center; padding: 20px;">Aucun trajet enregistré pour l\'instant</p>');
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
    try {
        // Vérifier que KmManager est disponible
        if (!window.KmManager || typeof window.KmManager.calculerTotalKm !== 'function') {
            console.warn('⚠️ KmManager non disponible');
            return;
        }
        
        // Vérifier que trajetsAnnee existe
        if (!trajetsAnnee) {
            trajetsAnnee = [];
        }
        
        const totalKm = window.KmManager.calculerTotalKm(trajetsAnnee);
        const vehiculeType = document.getElementById('vehicule_type')?.value || 'thermique';
        const puissance = parseInt(document.getElementById('puissance_fiscale')?.value || 5);
        const montant = window.KmManager.calculerMontantDeductible(totalKm, puissance, vehiculeType);
        
        const kmInput = document.getElementById('km_professionnels');
        const montantInput = document.getElementById('montant_frais_km');
        
        if (kmInput) kmInput.value = Math.round(totalKm);
        if (montantInput) montantInput.value = montant.toFixed(2);
        
        // Afficher/masquer le champ puissance
        togglePuissanceField();
        
        calculerTempsReel();
    } catch (error) {
        console.error('❌ Erreur calcul frais km:', error);
        // Ne pas bloquer l'interface
    }
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
            // console.log('🔧 Recréation des optgroup manquants...');
            
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
    // console.log('🚗 [TRAJET] Début soumission...');
    
    try {
        // Vérifier que KmManager existe
        if (!window.KmManager) {
            throw new Error('KmManager non chargé - Vérifier que km-manager.js est bien chargé');
        }
        
        const form = event.target;
        const destination = document.getElementById('trajet-destination').value;
        
        // console.log('🚗 [TRAJET] Destination:', destination);
        
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
        
        // console.log('🚗 [TRAJET] Données:', trajetData);
        
        const result = await window.KmManager.ajouterTrajet(trajetData);
        // console.log('✅ [TRAJET] Trajet ajouté:', result);
        
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
        
        // Regénérer tous les trajets de l'année courante
        const anneeActuelle = KmManager.getCurrentYear();
        afficherMessage('⏳ Régénération des trajets en cours...', 'info');
        
        const result = await KmManager.regenererTrajetsAutoAnnee(anneeActuelle);
        
        // Recharger l'affichage
        trajetsAnnee = await KmManager.chargerTrajets(anneeActuelle);
        afficherResumeMensuel();  // 🔄 REFRESH AFFICHAGE + TOTAUX
        await calculerFraisKm(anneeActuelle);
        
        let message = `✅ Configuration enregistrée - ${result.created} trajets générés pour ${result.reservations} réservations`;
        
        if (result.gitesSkipped && result.gitesSkipped.length > 0) {
            message += `\n\n⚠️ Attention: ${result.gitesSkipped.length} gîte(s) sans distance configurée:\n${result.gitesSkipped.join(', ')}\n\nVeuillez configurer la distance dans "Gérer mes lieux"`;
        }
        
        afficherMessage(message, result.gitesSkipped && result.gitesSkipped.length > 0 ? 'warning' : 'success');
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
        window.SecurityUtils.setInnerHTML(container, '<p style="color: var(--text-secondary); font-style: italic; text-align: center; padding: 20px;">Aucun lieu enregistré</p>');
        return;
    }
    
    const html = lieux.map(l => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--card); border-radius: 6px; border: 1px solid #e0e0e0;">
            <div>
                <div style="font-weight: 600;">${l.nom}</div>
                ${l.adresse ? `<div style="font-size: 0.85rem; color: var(--text-secondary);">${l.adresse}</div>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: #27ae60;">${l.distance_km} km</span>
                <button onclick="supprimerLieuFavori('${l.id}')" class="btn-icon" title="Supprimer">
                    <svg style="width:14px;height:14px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
            <p style="color: var(--text-secondary); font-style: italic; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                Aucun crédit enregistré. Cliquez sur "Ajouter un crédit" pour commencer.
            </p>
        `);
        calculerTotalCredits();
        return;
    }
    
    const html = creditsPersonnels.map(credit => `
        <div style="display: grid; grid-template-columns: 1fr 150px 60px; gap: 10px; align-items: center; padding: 12px; background: var(--card); border-radius: 8px; border: 2px solid #e0e0e0;">
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
                <span style="color: var(--text-secondary); font-size: 0.9rem;">€/mois</span>
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
    
    // ⚠️ CORRECTION : Ne pas appeler calculerTempsReel() ici pour éviter la boucle infinie
    // Le reste à vivre sera recalculé automatiquement via calculerTempsReel() → calculerResteAVivre()
    
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
    
    // Mettre à jour l'affichage du dashboard (section IR)
    if (typeof window.updateFinancialIndicators === 'function') {
        window.updateFinancialIndicators();
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
    return; // ❌ Table suivi_soldes_bancaires supprimée - 23/01/2026
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
                    <td colspan="3" style="padding: 30px; text-align: center; color: var(--text-secondary);">
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
                            <svg style="width:14px;height:14px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
    return; // ❌ Table suivi_soldes_bancaires supprimée - 23/01/2026
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
    return; // ❌ Table suivi_soldes_bancaires supprimée - 23/01/2026
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
    // console.log('🐛 ========== DEBUG RÉSIDENCE ==========');
    
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
    
    // console.log('📋 Valeurs actuelles des champs:');
    fields.forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (el) {
            const value = el.value;
            const type = el.getAttribute('data-period-type');
            // console.log(`  ${fieldId}:`, {value, type});
        } else {
            // console.log(`  ${fieldId}: ❌ ELEMENT NON TROUVÉ`);
        }
    });
    
    // 2. Tester la fonction getAnnualValue
    // console.log('\n💰 Test getAnnualValue:');
    fields.forEach(fieldId => {
        try {
            const annual = getAnnualValue(fieldId, fieldId + '_type');
            // console.log(`  ${fieldId} annualisé:`, annual);
        } catch (error) {
            // console.log(`  ${fieldId}: ❌ ERREUR`, error.message);
        }
    });
    
    // 3. Simuler une sauvegarde
    // console.log('\n💾 Test collecte données:');
    try {
        const testData = {};
        fields.forEach(fieldId => {
            const el = document.getElementById(fieldId);
            if (el) {
                testData[fieldId] = parseFloat(el.value || 0);
                testData[fieldId + '_type'] = el.getAttribute('data-period-type') || 'mensuel';
            }
        });
        // console.log('Données qui seraient sauvegardées:', testData);
    } catch (error) {
        console.error('❌ Erreur collecte:', error);
    }
    
    // 4. Vérifier la dernière simulation sauvegardée
    // console.log('\n📂 Dernière simulation en base:');
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
                // console.log('Résidence dans la base:');
                fields.forEach(fieldId => {
                    // console.log(`  ${fieldId}:`, details[fieldId], `(type: ${details[fieldId + '_type']})`);
                });
            } else {
                // console.log('❌ Aucune simulation trouvée');
            }
        });
    
    // console.log('🐛 ========== FIN DEBUG ==========');
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
    
    // Synchronisation résidence → frais personnels activée
}

// Exposer globalement
window.syncResidenceToFraisPerso = syncResidenceToFraisPerso;
window.initSyncResidenceToFraisPerso = initSyncResidenceToFraisPerso;

// ==========================================
// FIN GESTION SECTION PERSONNELLE
// ==========================================

// ==========================================
// MODALE GESTION TRAJETS
// ==========================================

/**
 * Afficher la modale de gestion de tous les trajets
 */
async function afficherModalGestionTrajets() {
    const modal = document.getElementById('modal-gestion-trajets');
    if (!modal) return;
    
    modal.style.display = 'flex';
    await chargerListeTousTrajets();
}

function fermerModalGestionTrajets() {
    const modal = document.getElementById('modal-gestion-trajets');
    if (modal) modal.style.display = 'none';
}

/**
 * Charger et afficher tous les trajets groupés par mois
 */
async function chargerListeTousTrajets() {
    const container = document.getElementById('liste-tous-trajets');
    if (!container) return;
    
    if (trajetsAnnee.length === 0) {
        window.SecurityUtils.setInnerHTML(container, `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <p>Aucun trajet enregistré pour l'instant</p>
            </div>
        `);
        return;
    }
    
    const parMois = KmManager.grouperParMois(trajetsAnnee);
    
    const typeIcons = {
        'menage_entree': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
        'menage_sortie': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
        'courses': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
        'maintenance': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        'autre': '<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    };
    
    const html = parMois.map(m => {
        const [annee, mois] = m.mois.split('-');
        const nomMois = new Date(annee, parseInt(mois) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        return `
            <div style="margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 15px; border-radius: 8px 8px 0 0;">
                    <div style="font-size: 1.05rem; font-weight: 600; text-transform: capitalize;">${nomMois}</div>
                    <div style="font-size: 0.85rem; opacity: 0.9;">${m.trajets.length} trajet${m.trajets.length > 1 ? 's' : ''} • ${m.totalKm.toFixed(0)} km</div>
                </div>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 0 0 8px 8px; border: 2px solid #e0e0e0; border-top: none;">
                    ${m.trajets.map(t => `
                        <div style="display: grid; grid-template-columns: 90px 1fr 100px 100px 90px; gap: 10px; align-items: center; padding: 12px; background: var(--card); border-radius: 6px; margin-bottom: 8px; border: 1px solid #e0e0e0;">
                            <span style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 500;">${new Date(t.date_trajet).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                            <div>
                                <div style="font-weight: 600; font-size: 0.9rem;">${typeIcons[t.type_trajet] || typeIcons.autre} ${t.motif}</div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">${t.lieu_depart || 'Domicile'} → ${t.lieu_arrivee}</div>
                                ${t.auto_genere ? '<span style="font-size: 0.7rem; padding: 2px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px; margin-top: 3px; display: inline-block;">Auto</span>' : ''}
                            </div>
                            <span style="text-align: right; font-size: 0.85rem; color: var(--text-secondary);">${t.distance_aller.toFixed(1)} km ${t.aller_retour ? 'A/R' : ''}</span>
                            <span style="text-align: right; font-weight: 700; color: #27ae60; font-size: 0.95rem;">${t.distance_totale.toFixed(1)} km</span>
                            <div style="display: flex; gap: 6px; justify-content: flex-end;">
                                ${!t.auto_genere ? `
                                    <button onclick="ouvrirModalModifierTrajet('${t.id}')" class="btn-icon" title="Modifier" style="padding: 6px 10px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                        <svg style="width:12px;height:12px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                                    </button>
                                ` : ''}
                                <button onclick="confirmerSuppressionTrajet('${t.id}', ${t.auto_genere})" class="btn-icon" title="Supprimer" style="padding: 6px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                    <svg style="width:12px;height:12px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    window.SecurityUtils.setInnerHTML(container, html);
}

/**
 * Ouvrir la modale de modification d'un trajet
 */
function ouvrirModalModifierTrajet(trajetId) {
    const trajet = trajetsAnnee.find(t => t.id === trajetId);
    if (!trajet) return;
    
    // Remplir le formulaire
    document.getElementById('modifier-trajet-id').value = trajet.id;
    document.getElementById('modifier-trajet-date').value = trajet.date_trajet;
    document.getElementById('modifier-trajet-motif').value = trajet.motif;
    document.getElementById('modifier-trajet-destination').value = trajet.lieu_arrivee;
    document.getElementById('modifier-trajet-distance').value = trajet.distance_aller;
    document.getElementById('modifier-trajet-aller-retour').checked = trajet.aller_retour;
    
    calculerDistanceTotaleModif();
    
    // Afficher la modale
    document.getElementById('modal-modifier-trajet').style.display = 'flex';
}

function fermerModalModifierTrajet() {
    document.getElementById('modal-modifier-trajet').style.display = 'none';
}

/**
 * Calculer la distance totale lors de la modification
 */
function calculerDistanceTotaleModif() {
    const distanceAller = parseFloat(document.getElementById('modifier-trajet-distance').value) || 0;
    const allerRetour = document.getElementById('modifier-trajet-aller-retour').checked;
    const distanceTotale = allerRetour ? distanceAller * 2 : distanceAller;
    
    document.getElementById('modifier-distance-totale').textContent = `${distanceTotale.toFixed(1)} km`;
}

/**
 * Sauvegarder les modifications du trajet
 */
async function sauvegarderModificationTrajet(event) {
    event.preventDefault();
    
    try {
        const trajetId = document.getElementById('modifier-trajet-id').value;
        const distanceAller = parseFloat(document.getElementById('modifier-trajet-distance').value);
        const allerRetour = document.getElementById('modifier-trajet-aller-retour').checked;
        
        const updates = {
            date_trajet: document.getElementById('modifier-trajet-date').value,
            motif: document.getElementById('modifier-trajet-motif').value,
            lieu_arrivee: document.getElementById('modifier-trajet-destination').value,
            distance_aller: distanceAller,
            aller_retour: allerRetour,
            distance_totale: allerRetour ? distanceAller * 2 : distanceAller
        };
        
        await KmManager.modifierTrajet(trajetId, updates);
        
        // Recharger les données
        const anneeActuelle = KmManager.getCurrentYear();
        trajetsAnnee = await KmManager.chargerTrajets(anneeActuelle);
        afficherResumeMensuel();
        await calculerFraisKm(anneeActuelle);
        
        // Rafraîchir la liste dans la modale
        await chargerListeTousTrajets();
        
        fermerModalModifierTrajet();
        afficherMessage('✅ Trajet modifié avec succès', 'success');
    } catch (error) {
        console.error('Erreur modification trajet:', error);
        afficherMessage('❌ Erreur lors de la modification', 'error');
    }
}

/**
 * Confirmer la suppression d'un trajet
 */
async function confirmerSuppressionTrajet(trajetId, isAuto) {
    const message = isAuto 
        ? 'Ce trajet est généré automatiquement. Si vous le supprimez, il pourrait être recréé lors de la prochaine régénération. Confirmer la suppression ?'
        : 'Êtes-vous sûr de vouloir supprimer ce trajet ?';
    
    if (!confirm(message)) return;
    
    try {
        await KmManager.supprimerTrajet(trajetId);
        
        // Recharger les données
        const anneeActuelle = KmManager.getCurrentYear();
        trajetsAnnee = await KmManager.chargerTrajets(anneeActuelle);
        afficherResumeMensuel();
        await calculerFraisKm(anneeActuelle);
        
        // Rafraîchir la liste dans la modale
        await chargerListeTousTrajets();
        
        afficherMessage('✅ Trajet supprimé', 'success');
    } catch (error) {
        console.error('Erreur suppression trajet:', error);
        afficherMessage('❌ Erreur lors de la suppression', 'error');
    }
}

// Exposer les fonctions globalement
window.afficherModalGestionTrajets = afficherModalGestionTrajets;
window.fermerModalGestionTrajets = fermerModalGestionTrajets;
window.ouvrirModalModifierTrajet = ouvrirModalModifierTrajet;
window.fermerModalModifierTrajet = fermerModalModifierTrajet;
window.calculerDistanceTotaleModif = calculerDistanceTotaleModif;
window.sauvegarderModificationTrajet = sauvegarderModificationTrajet;
window.confirmerSuppressionTrajet = confirmerSuppressionTrajet;

// ==========================================
// FIN MODALE GESTION TRAJETS
// ==========================================

// ==========================================
// FONCTION TEST CA - Mode test sans écraser le CA réel
// ==========================================
function appliquerTestCA() {
    const input = document.getElementById('test-ca-input');
    const caTest = parseFloat(input.value.trim());
    
    if (!caTest || isNaN(caTest) || caTest < 0) {
        alert('⚠️ Saisissez un montant de CA valide');
        return;
    }
    
    // Sauvegarder le CA réel actuel
    const caInput = document.getElementById('ca');
    const caReel = caInput.value;
    
    // Appliquer temporairement le CA de test
    caInput.value = caTest;
    
    // Recalculer avec le CA de test
    calculerTempsReel();
    
    // Afficher le badge MODE TEST sur la carte CA
    const badgeTest = document.getElementById('badge-mode-test');
    if (badgeTest) {
        badgeTest.style.display = 'block';
    }
    
    // Ajouter le bouton "Restaurer CA réel" s'il n'existe pas
    let btnRestaurer = document.getElementById('btn-restaurer-ca');
    
    if (!btnRestaurer) {
        btnRestaurer = document.createElement('button');
        btnRestaurer.id = 'btn-restaurer-ca';
        btnRestaurer.className = 'btn-neo-secondary';
        btnRestaurer.style.cssText = 'margin-left: 8px; font-size: 0.85rem; padding: 6px 12px; background: #ff6b6b; color: white; border: 1px solid #ff6b6b;';
        btnRestaurer.innerHTML = '<i data-lucide="x-circle" style="width: 16px; height: 16px;"></i> Restaurer CA réel';
        btnRestaurer.onclick = function() {
            document.getElementById('ca').value = caReel;
            calculerTempsReel();
            
            // Masquer le badge MODE TEST
            const badge = document.getElementById('badge-mode-test');
            if (badge) {
                badge.style.display = 'none';
            }
            
            btnRestaurer.remove();
            input.value = '';
            // console.log('✅ CA réel restauré');
        };
        
        input.parentElement.appendChild(btnRestaurer);
        
        // Réinitialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Sauvegarder le CA réel dans l'attribut data pour le bouton restaurer
    btnRestaurer.dataset.caReel = caReel;
    
    // Reset de l'input test
    input.value = '';
}

// Exposer la fonction globalement
window.appliquerTestCA = appliquerTestCA;
