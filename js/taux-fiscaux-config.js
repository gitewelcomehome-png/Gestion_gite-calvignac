// ==========================================
// 📊 CONFIGURATION DES TAUX FISCAUX
// ==========================================
// Système paramétrable pour gérer les taux URSSAF et fiscaux
// Source: URSSAF Indépendants + impots.gouv.fr
// Dernière mise à jour: 19 janvier 2026

/**
 * IMPORTANT: Ces taux sont indicatifs et doivent être vérifiés annuellement
 * auprès de l'URSSAF et de votre expert-comptable.
 * 
 * Pour mettre à jour: modifier uniquement les valeurs dans TAUX_ANNEES
 */

const TAUX_FISCAUX = {
    // ==========================================
    // TAUX PAR ANNÉE
    // ==========================================
    TAUX_ANNEES: {
        // ⚠️ À mettre à jour chaque année en février : PASS, BAREME_IR, SMIC
        2024: {
            // PASS (Plafond Annuel Sécurité Sociale)
            PASS: 46368,
            SMIC_HORAIRE: 11.65,
            
            // COTISATIONS URSSAF (LMP/TNS au réel)
            URSSAF: {
                // Maladie-Maternité (exonération totale si revenu < 110% PASS)
                maladie: {
                    taux: 0, // 0% si < 46368 × 1.1 = 51004.80€
                    seuil_exoneration: 46368 * 1.1,
                    description: "Maladie-Maternité (exonéré si < 110% PASS)"
                },
                
                // Indemnités journalières
                indemnites_journalieres: {
                    taux: 0.0085, // 0.85%
                    base: 'revenu',
                    description: "Indemnités journalières"
                },
                
                // Retraite de base (plafonné à 1 PASS)
                retraite_base: {
                    taux: 0.1775, // 17.75%
                    plafond: 46368,
                    base: 'revenu',
                    description: "Retraite de base"
                },
                
                // Retraite complémentaire
                retraite_complementaire: {
                    taux: 0.07, // 7%
                    base: 'revenu',
                    description: "Retraite complémentaire"
                },
                
                // Invalidité-Décès
                invalidite_deces: {
                    taux: 0.013, // 1.30%
                    base: 'revenu',
                    description: "Invalidité-Décès"
                },
                
                // CSG-CRDS
                csg_crds: {
                    taux: 0.097, // 9.70%
                    base: 'revenu',
                    description: "CSG-CRDS"
                },
                
                // Allocations familiales (progressif selon revenu)
                allocations_familiales: {
                    seuil_debut: 46368 * 1.1,    // 110% PASS = 51004.80€
                    seuil_fin: 46368 * 1.4,       // 140% PASS = 64915.20€
                    taux_max: 0.031,              // 3.1%
                    description: "Allocations familiales (progressif 0% à 3.1%)"
                },
                
                // Formation professionnelle
                formation_pro: {
                    taux: 0.0025, // 0.25%
                    base: 'ca',
                    description: "Formation professionnelle"
                }
            },
            
            // COTISATIONS MINIMALES (LMP au réel)
            COTISATIONS_MINIMALES: {
                applicable: true, // Cotisations minimales SSI obligatoires
                montant: 1200, // Minimum légal même si bénéfice nul
                description: "Cotisations minimales SSI pour LMP au réel (~1200-1500€/an)"
            },
            
            // RÉGIME MICRO-BIC (Loi 2025/2026)
            MICRO_BIC: {
                plafond_non_classe: 15000, // Meublé tourisme NON classé
                plafond_classe: 77700, // Meublé tourisme CLASSÉ ⭐
                abattement_non_classe: 0.30, // 30%
                abattement_classe: 0.50, // 50%
                taux_cotis_non_classe: 0.212, // 21.2%
                taux_cotis_classe: 0.06, // 6%
                taux_vl_non_classe: 0.017, // 1.7% versement libératoire
                taux_vl_classe: 0.01, // 1% versement libératoire
                description: "Plafonds et taux Micro-BIC meublés de tourisme"
            },
            
            // TRIMESTRES RETRAITE
            RETRAITE: {
                smic_horaire: 11.65, // SMIC horaire 2024
                heures_par_trimestre: 600,
                trimestre_1: 11.65 * 600,      // 6 990 €
                trimestre_2: 11.65 * 600 * 2,  // 13 980 €
                trimestre_3: 11.65 * 600 * 3,  // 20 970 €
                trimestre_4: 11.65 * 600 * 4   // 27 960 €
            },
            
            // BARÈME IMPÔT SUR LE REVENU
            BAREME_IR: [
                { max: 11294, taux: 0 },
                { max: 28797, taux: 0.11 },
                { max: 82341, taux: 0.30 },
                { max: 177106, taux: 0.41 },
                { max: Infinity, taux: 0.45 }
            ],
            
            // ABATTEMENT SALAIRES
            ABATTEMENT_SALAIRE: {
                taux: 0.10, // 10%
                minimum: 472,
                maximum: 13522
            },

            PRELEVEMENTS_SOCIAUX: {
                patrimoine_bic_meuble: 0.172
            },
            
            // BARÈME KILOMÉTRIQUE (selon puissance fiscale)
            BAREME_KM: {
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
            }
        },
        
        // ⚠️ À mettre à jour chaque année en février : PASS, BAREME_IR, SMIC
        2025: {
            // PASS 2025
            PASS: 47100,
            SMIC_HORAIRE: 11.88,
            
            // COTISATIONS URSSAF 2025 (identiques 2024 - vérifier février 2025)
            URSSAF: {
                maladie: {
                    taux: 0,
                    seuil_exoneration: 46368 * 1.1,
                    description: "Maladie-Maternité (exonéré si < 110% PASS)"
                },
                indemnites_journalieres: {
                    taux: 0.0085,
                    base: 'revenu',
                    description: "Indemnités journalières"
                },
                retraite_base: {
                    taux: 0.1775,
                    plafond: 46368,
                    base: 'revenu',
                    description: "Retraite de base"
                },
                retraite_complementaire: {
                    taux: 0.07,
                    base: 'revenu',
                    description: "Retraite complémentaire"
                },
                invalidite_deces: {
                    taux: 0.013,
                    base: 'revenu',
                    description: "Invalidité-Décès"
                },
                csg_crds: {
                    taux: 0.097,
                    base: 'revenu',
                    description: "CSG-CRDS"
                },
                allocations_familiales: {
                    seuil_debut: 46368 * 1.1,
                    seuil_fin: 46368 * 1.4,
                    taux_max: 0.031,
                    description: "Allocations familiales (progressif 0% à 3.1%)"
                },
                formation_pro: {
                    taux: 0.0025,
                    base: 'ca',
                    description: "Formation professionnelle"
                }
            },
            
            COTISATIONS_MINIMALES: {
                applicable: true,
                montant: 1200,
                description: "Cotisations minimales SSI pour LMP au réel (~1200-1500€/an)"
            },
            
            // RÉGIME MICRO-BIC 2025
            MICRO_BIC: {
                plafond_non_classe: 15000,
                plafond_classe: 77700,
                abattement_non_classe: 0.30,
                abattement_classe: 0.50,
                taux_cotis_non_classe: 0.212,
                taux_cotis_classe: 0.06,
                taux_vl_non_classe: 0.017,
                taux_vl_classe: 0.01,
                description: "Plafonds et taux Micro-BIC meublés de tourisme"
            },
            
            // TRIMESTRES RETRAITE 2025
            RETRAITE: {
                smic_horaire: 11.88, // SMIC 2025 (estimé - à vérifier)
                heures_par_trimestre: 600,
                trimestre_1: 11.88 * 600,      // 7 128 €
                trimestre_2: 11.88 * 600 * 2,  // 14 256 €
                trimestre_3: 11.88 * 600 * 3,  // 21 384 €
                trimestre_4: 11.88 * 600 * 4   // 28 512 €
            },
            
            // BARÈME IR 2025 (LFI 2025, +1,8%)
            BAREME_IR: [
                { max: 11497, taux: 0 },
                { max: 29315, taux: 0.11 },
                { max: 83823, taux: 0.30 },
                { max: 180294, taux: 0.41 },
                { max: Infinity, taux: 0.45 }
            ],
            
            ABATTEMENT_SALAIRE: {
                taux: 0.10,
                minimum: 472,
                maximum: 13522
            },

            PRELEVEMENTS_SOCIAUX: {
                // LFSS 2026: applicable aux revenus du patrimoine imposés au titre de 2025
                patrimoine_bic_meuble: 0.186
            },
            

        },

        // ⚠️ À mettre à jour chaque année en février : PASS, BAREME_IR, SMIC
        2026: {
            // PASS 2026 = 48 060 € — décret du 20 décembre 2025
            PASS: 48060,
            SMIC_HORAIRE: 11.88, // à mettre à jour selon revalorisation janvier 2026
            // Source: LFI 2026, revalorisation +0,9%, adoptée par 49-3 le 21 janvier 2026
            BAREME_IR: [
                { max: 11600, taux: 0 },
                { max: 29579, taux: 0.11 },
                { max: 84577, taux: 0.30 },
                { max: 181917, taux: 0.41 },
                { max: Infinity, taux: 0.45 }
            ],

            ABATTEMENT_SALAIRE: {
                taux: 0.10,
                minimum: 509,
                maximum: 14556
            },

            ABATTEMENT_PENSION: {
                taux: 0.10,
                minimum: 454,
                maximum: 4439
            },

            QUOTIENT_FAMILIAL: {
                plafond_demi_part: 1807
            },

            DECOTE: {
                celibataire: {
                    montant: 897,
                    seuil: 1982
                },
                couple: {
                    montant: 1483,
                    seuil: 3277
                },
                taux_reduction: 0.4525
            },

            PRELEVEMENTS_SOCIAUX: {
                patrimoine_bic_meuble: 0.186
            }
        }
    },
    
    // ==========================================
    // FONCTIONS UTILITAIRES
    // ==========================================
    
    /**
     * Récupérer la configuration pour une année donnée
     */
    getConfig: function(annee) {
        const base2024 = this.TAUX_ANNEES[2024] || {};
        const base2025 = this.TAUX_ANNEES[2025] || base2024;
        const yearConfig = this.TAUX_ANNEES[annee];

        const buildConfig = (baseConfig, overrideConfig = {}) => ({
            ...baseConfig,
            ...overrideConfig,
            URSSAF: {
                ...(baseConfig.URSSAF || {}),
                ...(overrideConfig.URSSAF || {})
            },
            COTISATIONS_MINIMALES: {
                ...(baseConfig.COTISATIONS_MINIMALES || {}),
                ...(overrideConfig.COTISATIONS_MINIMALES || {})
            },
            MICRO_BIC: {
                ...(baseConfig.MICRO_BIC || {}),
                ...(overrideConfig.MICRO_BIC || {})
            },
            RETRAITE: {
                ...(baseConfig.RETRAITE || {}),
                ...(overrideConfig.RETRAITE || {})
            },
            ABATTEMENT_SALAIRE: {
                ...(baseConfig.ABATTEMENT_SALAIRE || {}),
                ...(overrideConfig.ABATTEMENT_SALAIRE || {})
            },
            ABATTEMENT_PENSION: {
                ...(baseConfig.ABATTEMENT_PENSION || {}),
                ...(overrideConfig.ABATTEMENT_PENSION || {})
            },
            QUOTIENT_FAMILIAL: {
                ...(baseConfig.QUOTIENT_FAMILIAL || {}),
                ...(overrideConfig.QUOTIENT_FAMILIAL || {})
            },
            DECOTE: {
                ...(baseConfig.DECOTE || {}),
                ...(overrideConfig.DECOTE || {})
            },
            PRELEVEMENTS_SOCIAUX: {
                ...(baseConfig.PRELEVEMENTS_SOCIAUX || {}),
                ...(overrideConfig.PRELEVEMENTS_SOCIAUX || {})
            },
            BAREME_IR: overrideConfig.BAREME_IR || baseConfig.BAREME_IR,
            // Le barème KM 2025 est identique à 2024 (décret BOFiP du 3 avril 2025).
            // Si le barème change une année donnée, l'ajouter explicitement dans TAUX_ANNEES[année].BAREME_KM.
            BAREME_KM: overrideConfig.BAREME_KM || baseConfig.BAREME_KM || this.TAUX_ANNEES[2024]?.BAREME_KM
        });

        let config;
        if (yearConfig) {
            const base = annee === 2026 ? base2025 : base2024;
            config = buildConfig(base, yearConfig);
        } else if (annee === 2026) {
            config = buildConfig(base2025, this.TAUX_ANNEES[2026] || {});
        } else {
            config = buildConfig(base2024, {});
        }

        if (!config.PASS) config.PASS = 46368;
        if (!config.SMIC_HORAIRE) config.SMIC_HORAIRE = config.RETRAITE?.smic_horaire || 11.88;

        return config;
    },
    
    /**
     * Calculer les cotisations URSSAF pour une année
     */
    calculerURSSAF: function(annee, benefice, ca) {
        const config = this.getConfig(annee);
        const urssaf = config.URSSAF;
        
        let total = 0;
        const details = {};
        
        // Maladie-Maternité (exonération si < seuil)
        if (benefice > urssaf.maladie.seuil_exoneration) {
            details.maladie = benefice * urssaf.maladie.taux;
            total += details.maladie;
        } else {
            details.maladie = 0;
        }
        
        // Indemnités journalières
        details.indemnites_journalieres = benefice * urssaf.indemnites_journalieres.taux;
        total += details.indemnites_journalieres;
        
        // Retraite de base (plafonné)
        const revenuPlafonne = Math.min(benefice, urssaf.retraite_base.plafond);
        details.retraite_base = revenuPlafonne * urssaf.retraite_base.taux;
        total += details.retraite_base;
        
        // Retraite complémentaire
        details.retraite_complementaire = benefice * urssaf.retraite_complementaire.taux;
        total += details.retraite_complementaire;
        
        // Invalidité-Décès
        details.invalidite_deces = benefice * urssaf.invalidite_deces.taux;
        total += details.invalidite_deces;
        
        // CSG-CRDS
        details.csg_crds = benefice * urssaf.csg_crds.taux;
        total += details.csg_crds;
        
        // Allocations familiales (progressif)
        const af = urssaf.allocations_familiales;
        if (benefice > af.seuil_debut) {
            const baseAF = Math.min(benefice - af.seuil_debut, af.seuil_fin - af.seuil_debut);
            const tauxAF = (baseAF / (af.seuil_fin - af.seuil_debut)) * af.taux_max;
            details.allocations_familiales = benefice * tauxAF;
            total += details.allocations_familiales;
        } else {
            details.allocations_familiales = 0;
        }
        
        // Formation professionnelle (CFP = 0,25% du PASS)
        const PASS = config.PASS || 46368;
        details.formation_pro = PASS * urssaf.formation_pro.taux;
        total += details.formation_pro;
        
        // Appliquer minimum si applicable
        if (config.COTISATIONS_MINIMALES.applicable && total < config.COTISATIONS_MINIMALES.montant) {
            total = config.COTISATIONS_MINIMALES.montant;
            details._minimum_applique = true;
        }
        
        return { total, details };
    },
    
    /**
     * Calculer les trimestres de retraite validés
     */
    calculerTrimestres: function(annee, benefice) {
        const config = this.getConfig(annee);
        const retraite = config.RETRAITE;
        
        if (benefice >= retraite.trimestre_4) return 4;
        if (benefice >= retraite.trimestre_3) return 3;
        if (benefice >= retraite.trimestre_2) return 2;
        if (benefice >= retraite.trimestre_1) return 1;
        return 0;
    },
    
    /**
     * Calculer l'impôt sur le revenu
     */
    calculerIR: function(annee, revenuImposable, nbParts) {
        const config = this.getConfig(annee);
        const bareme = config.BAREME_IR;
        const quotient = revenuImposable / nbParts;
        
        let impotQuotient = 0;
        let tranchePrecedente = 0;
        
        for (const tranche of bareme) {
            if (quotient <= tranchePrecedente) break;
            
            const baseImposable = Math.min(quotient, tranche.max) - tranchePrecedente;
            impotQuotient += baseImposable * tranche.taux;
            
            tranchePrecedente = tranche.max;
            if (quotient <= tranche.max) break;
        }
        
        let impot = impotQuotient * nbParts;

        // Plafonnement quotient familial (base couple = 2 parts dans ce simulateur)
        const plafondParDemiPart = Number(config?.QUOTIENT_FAMILIAL?.plafond_demi_part);
        const demiPartsSupplementaires = Math.max(0, (nbParts - 2) * 2);
        if (Number.isFinite(plafondParDemiPart) && demiPartsSupplementaires > 0) {
            const quotientBase = revenuImposable / 2;
            let impotBaseParPart = 0;
            let trancheBase = 0;

            for (const tranche of bareme) {
                if (quotientBase <= trancheBase) break;

                const baseImposable = Math.min(quotientBase, tranche.max) - trancheBase;
                impotBaseParPart += baseImposable * tranche.taux;

                trancheBase = tranche.max;
                if (quotientBase <= tranche.max) break;
            }

            const impotBase = impotBaseParPart * 2;
            const avantage = Math.max(0, impotBase - impot);
            const plafondGlobal = demiPartsSupplementaires * plafondParDemiPart;
            if (avantage > plafondGlobal) {
                impot = Math.max(0, impotBase - plafondGlobal);
            }
        }

        // Décote
        const decote = config?.DECOTE || {};
        const estCouple = nbParts >= 2;
        const decoteMontant = Number(estCouple ? decote?.couple?.montant : decote?.celibataire?.montant);
        const decoteSeuil = Number(estCouple ? decote?.couple?.seuil : decote?.celibataire?.seuil);
        const decoteTaux = Number(decote?.taux_reduction);

        if (Number.isFinite(decoteMontant) && Number.isFinite(decoteSeuil) && Number.isFinite(decoteTaux) && impot <= decoteSeuil) {
            const montantDecote = Math.max(0, decoteMontant - (decoteTaux * impot));
            impot = Math.max(0, impot - montantDecote);
        }

        return impot;
    },
    
    /**
     * Calculer les frais kilométriques
     */
    calculerBaremeKM: function(annee, puissance, kilometres) {
        const config = this.getConfig(annee);
        const bareme = config.BAREME_KM[puissance] || config.BAREME_KM[5];
        
        const tranche = bareme.find(t => kilometres <= t.max);
        return tranche ? tranche.formule(kilometres) : 0;
    },
    
    /**
     * Appliquer l'abattement sur les salaires
     */
    appliquerAbattementSalaire: function(annee, salaireBrut) {
        const config = this.getConfig(annee);
        const abat = config.ABATTEMENT_SALAIRE;
        
        const abattement = Math.max(
            abat.minimum,
            Math.min(salaireBrut * abat.taux, abat.maximum)
        );
        
        return salaireBrut - abattement;
    }
};

// Export global
window.TAUX_FISCAUX = TAUX_FISCAUX;
