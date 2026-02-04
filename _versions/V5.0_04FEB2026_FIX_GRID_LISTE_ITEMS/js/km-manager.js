// ==========================================
// 🚗 GESTION DES KILOMÈTRES PROFESSIONNELS
// Module pour suivi des trajets et calcul déductions fiscales
// ==========================================

const KmManager = (function() {
    'use strict';

    let currentYear = new Date().getFullYear();
    let configAuto = null;

    // ==========================================
    // 📊 CHARGEMENT DES DONNÉES
    // ==========================================

    /**
     * Charger la configuration d'automatisation
     */
    async function chargerConfigAuto() {
        try {
            const { data: user } = await supabaseClient.auth.getUser();
            if (!user?.user?.id) throw new Error('Non authentifié');

            const { data, error } = await supabaseClient
                .from('km_config_auto')
                .select('*')
                .eq('owner_user_id', user.user.id)
                .single();

            // Ignorer si table n'existe pas encore (406)
            if (error && error.code === '42P01') {
                console.warn('Table km_config_auto non créée - Exécuter sql/create_km_management.sql');
                return null;
            }
            
            if (error && error.code !== 'PGRST116') throw error;

            // Si pas de config, créer une config par défaut
            if (!data) {
                const { data: newConfig, error: insertError } = await supabaseClient
                    .from('km_config_auto')
                    .insert({
                        owner_user_id: user.user.id,
                        auto_menage_entree: true,
                        auto_menage_sortie: true,
                        auto_courses: false,
                        auto_maintenance: false,
                        creer_trajets_par_defaut: true
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                configAuto = newConfig;
            } else {
                configAuto = data;
            }

            return configAuto;
        } catch (error) {
            console.error('Erreur chargement config auto km:', error);
            return null;
        }
    }

    /**
     * Charger les trajets d'une année
     */
    async function chargerTrajets(annee) {
        try {
            const { data: user } = await supabaseClient.auth.getUser();
            if (!user?.user?.id) throw new Error('Non authentifié');

            const { data, error } = await supabaseClient
                .from('km_trajets')
                .select(`
                    *,
                    gites (
                        name,
                        distance_km
                    )
                `)
                .eq('owner_user_id', user.user.id)
                .eq('annee_fiscale', annee)
                .order('date_trajet', { ascending: false });

            // Ignorer si table n'existe pas encore
            if (error && error.code === '42P01') {
                console.warn('Table km_trajets non créée - Exécuter sql/create_km_management.sql');
                return [];
            }
            
            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Erreur chargement trajets:', error);
            return [];
        }
    }

    /**
     * Charger les lieux favoris (magasins)
     */
    async function chargerLieuxFavoris() {
        try {
            const { data: user } = await supabaseClient.auth.getUser();
            if (!user?.user?.id) throw new Error('Non authentifié');

            const { data, error } = await supabaseClient
                .from('km_lieux_favoris')
                .select('*')
                .eq('owner_user_id', user.user.id)
                .order('nom');

            // Ignorer si table n'existe pas encore
            if (error && error.code === '42P01') {
                console.warn('Table km_lieux_favoris non créée - Exécuter sql/create_km_management.sql');
                return [];
            }
            
            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Erreur chargement lieux favoris:', error);
            return [];
        }
    }

    // ==========================================
    // ✏️ GESTION DES TRAJETS
    // ==========================================

    /**
     * Ajouter un trajet manuel
     */
    async function ajouterTrajet(trajetData) {
        try {
            console.log('🚗 [KM-MANAGER] Début ajout trajet...');
            
            const { data: user } = await supabaseClient.auth.getUser();
            if (!user?.user?.id) {
                throw new Error('Non authentifié');
            }
            
            console.log('🚗 [KM-MANAGER] User OK:', user.user.id);

            // Calculer distance totale
            const distanceTotale = trajetData.aller_retour 
                ? trajetData.distance_aller * 2 
                : trajetData.distance_aller;

            const trajet = {
                owner_user_id: user.user.id,
                date_trajet: trajetData.date_trajet,
                annee_fiscale: new Date(trajetData.date_trajet).getFullYear(),
                motif: trajetData.motif,
                type_trajet: trajetData.type_trajet || 'autre',
                lieu_depart: trajetData.lieu_depart || null,
                lieu_arrivee: trajetData.lieu_arrivee,
                gite_id: trajetData.gite_id || null,
                distance_aller: trajetData.distance_aller,
                aller_retour: trajetData.aller_retour,
                distance_totale: distanceTotale,
                reservation_id: trajetData.reservation_id || null,
                auto_genere: false,
                notes: trajetData.notes || null
            };
            
            console.log('🚗 [KM-MANAGER] Trajet à insérer:', trajet);

            const { data, error } = await supabaseClient
                .from('km_trajets')
                .insert(trajet)
                .select()
                .single();

            if (error) {
                console.error('❌ [KM-MANAGER] Erreur Supabase:', error);
                throw error;
            }
            
            console.log('✅ [KM-MANAGER] Trajet inséré:', data);

            return data;
        } catch (error) {
            console.error('❌ [KM-MANAGER] Erreur ajout trajet:', error);
            throw error;
        }
    }

    /**
     * Modifier un trajet existant
     */
    async function modifierTrajet(trajetId, updates) {
        try {
            // Recalculer distance totale si nécessaire
            if (updates.distance_aller !== undefined || updates.aller_retour !== undefined) {
                const distance = updates.distance_aller || 0;
                const ar = updates.aller_retour !== undefined ? updates.aller_retour : true;
                updates.distance_totale = ar ? distance * 2 : distance;
            }

            const { data, error } = await supabaseClient
                .from('km_trajets')
                .update(updates)
                .eq('id', trajetId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Erreur modification trajet:', error);
            throw error;
        }
    }

    /**
     * Supprimer un trajet
     */
    async function supprimerTrajet(trajetId) {
        try {
            const { error } = await supabaseClient
                .from('km_trajets')
                .delete()
                .eq('id', trajetId);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Erreur suppression trajet:', error);
            throw error;
        }
    }

    // ==========================================
    // 🤖 AUTOMATISATION
    // ==========================================

    /**
     * Créer trajets automatiques pour une réservation
     */
    async function creerTrajetsAutoReservation(reservation) {
        try {
            if (!configAuto) {
                await chargerConfigAuto();
            }

            if (!configAuto || !configAuto.creer_trajets_par_defaut) {
                return { created: 0, trajets: [] };
            }

            const { data: user } = await supabaseClient.auth.getUser();
            if (!user?.user?.id) throw new Error('Non authentifié');

            // Récupérer les infos du gîte
            const { data: gite, error: giteError } = await supabaseClient
                .from('gites')
                .select('name, distance_km')
                .eq('id', reservation.gite_id)
                .single();

            if (giteError) throw giteError;

            if (!gite.distance_km || gite.distance_km === 0) {
                console.warn('Distance non configurée pour le gîte:', gite.name);
                return { created: 0, trajets: [] };
            }

            const trajetsACreer = [];

            // Trajet ménage entrée (jour avant arrivée)
            if (configAuto.auto_menage_entree) {
                // Support des deux formats : check_in/check_out (Supabase) et date_arrivee/date_depart (legacy)
                const dateArrivee = reservation.check_in || reservation.date_arrivee;
                const dateEntree = new Date(dateArrivee);
                dateEntree.setDate(dateEntree.getDate() - 1);

                trajetsACreer.push({
                    owner_user_id: user.user.id,
                    date_trajet: dateEntree.toISOString().split('T')[0],
                    annee_fiscale: dateEntree.getFullYear(),
                    motif: `Ménage entrée - ${gite.name}`,
                    type_trajet: 'menage_entree',
                    lieu_depart: null,
                    lieu_arrivee: gite.name,
                    gite_id: reservation.gite_id,
                    distance_aller: gite.distance_km,
                    aller_retour: true,
                    distance_totale: gite.distance_km * 2,
                    reservation_id: reservation.id,
                    auto_genere: true
                });
            }

            // Trajet ménage sortie (jour de départ)
            if (configAuto.auto_menage_sortie) {
                // Support des deux formats
                const dateDepart = reservation.check_out || reservation.date_depart;
                const dateSortie = new Date(dateDepart);

                trajetsACreer.push({
                    owner_user_id: user.user.id,
                    date_trajet: dateSortie.toISOString().split('T')[0],
                    annee_fiscale: dateSortie.getFullYear(),
                    motif: `Ménage sortie - ${gite.name}`,
                    type_trajet: 'menage_sortie',
                    lieu_depart: null,
                    lieu_arrivee: gite.name,
                    gite_id: reservation.gite_id,
                    distance_aller: gite.distance_km,
                    aller_retour: true,
                    distance_totale: gite.distance_km * 2,
                    reservation_id: reservation.id,
                    auto_genere: true
                });
            }

            if (trajetsACreer.length === 0) {
                return { created: 0, trajets: [] };
            }

            const { data, error } = await supabaseClient
                .from('km_trajets')
                .insert(trajetsACreer)
                .select();

            if (error) throw error;

            return { created: data.length, trajets: data };
        } catch (error) {
            console.error('Erreur création trajets auto:', error);
            return { created: 0, trajets: [], error: error.message };
        }
    }

    /**
     * Supprimer trajets auto liés à une réservation
     */
    async function supprimerTrajetsAutoReservation(reservationId) {
        try {
            const { error } = await supabaseClient
                .from('km_trajets')
                .delete()
                .eq('reservation_id', reservationId)
                .eq('auto_genere', true);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Erreur suppression trajets auto:', error);
            return false;
        }
    }

    /**
     * Sauvegarder la configuration d'automatisation
     */
    async function sauvegarderConfigAuto(config) {
        try {
            const { data: user } = await supabaseClient.auth.getUser();
            if (!user?.user?.id) throw new Error('Non authentifié');

            const { data, error } = await supabaseClient
                .from('km_config_auto')
                .update(config)
                .eq('owner_user_id', user.user.id)
                .select()
                .single();

            if (error) throw error;

            configAuto = data;
            return data;
        } catch (error) {
            console.error('Erreur sauvegarde config auto:', error);
            throw error;
        }
    }

    /**
     * Regénérer tous les trajets automatiques pour une année
     * Utilisé après modification de la config pour appliquer aux réservations existantes
     */
    async function regenererTrajetsAutoAnnee(annee) {
        try {
            const { data: user } = await supabaseClient.auth.getUser();
            if (!user?.user?.id) throw new Error('Non authentifié');

            // 1. Récupérer toutes les réservations de l'année
            const debutAnnee = `${annee}-01-01`;
            const finAnnee = `${annee}-12-31`;

            const { data: reservations, error: resaError } = await supabaseClient
                .from('reservations')
                .select('id, gite_id, check_in, check_out')
                .gte('check_in', debutAnnee)
                .lte('check_in', finAnnee)
                .eq('owner_user_id', user.user.id)
                .order('check_in', { ascending: true });

            if (resaError) throw resaError;

            if (!reservations || reservations.length === 0) {
                console.log(`Aucune réservation pour ${annee}`);
                return { 
                    deleted: 0, 
                    created: 0, 
                    reservations: 0 
                };
            }

            // 2. Supprimer tous les trajets auto-générés de l'année
            const { error: deleteError } = await supabaseClient
                .from('km_trajets')
                .delete()
                .eq('owner_user_id', user.user.id)
                .eq('annee_fiscale', annee)
                .eq('auto_genere', true);

            if (deleteError) throw deleteError;

            // 3. Recréer les trajets pour chaque réservation selon la config actuelle
            let totalCreated = 0;
            const gitesSkipped = new Set();
            
            for (const reservation of reservations) {
                const result = await creerTrajetsAutoReservation(reservation);
                totalCreated += result.created || 0;
                
                // Suivre les gîtes ignorés (distance non configurée)
                if (result.created === 0 && result.error) {
                    const { data: gite } = await supabaseClient
                        .from('gites')
                        .select('name')
                        .eq('id', reservation.gite_id)
                        .single();
                    if (gite) gitesSkipped.add(gite.name);
                }
            }

            console.log(`✅ Régénération ${annee}: ${reservations.length} réservations, ${totalCreated} trajets créés`);
            if (gitesSkipped.size > 0) {
                console.warn('⚠️ Gîtes ignorés (distance non configurée):', Array.from(gitesSkipped));
            }

            return {
                deleted: true,
                created: totalCreated,
                reservations: reservations.length,
                gitesSkipped: Array.from(gitesSkipped)
            };

        } catch (error) {
            console.error('Erreur régénération trajets auto:', error);
            throw error;
        }
    }

    // ==========================================
    // 📍 GESTION DES LIEUX FAVORIS
    // ==========================================

    /**
     * Ajouter un lieu favori
     */
    async function ajouterLieuFavori(lieu) {
        try {
            const { data: user } = await supabaseClient.auth.getUser();
            if (!user?.user?.id) throw new Error('Non authentifié');

            const { data, error } = await supabaseClient
                .from('km_lieux_favoris')
                .insert({
                    owner_user_id: user.user.id,
                    nom: lieu.nom,
                    type_lieu: lieu.type_lieu || 'magasin',
                    distance_km: lieu.distance_km,
                    adresse: lieu.adresse || null
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Erreur ajout lieu favori:', error);
            throw error;
        }
    }

    /**
     * Modifier un lieu favori
     */
    async function modifierLieuFavori(lieuId, updates) {
        try {
            const { data, error } = await supabaseClient
                .from('km_lieux_favoris')
                .update(updates)
                .eq('id', lieuId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Erreur modification lieu favori:', error);
            throw error;
        }
    }

    /**
     * Supprimer un lieu favori
     */
    async function supprimerLieuFavori(lieuId) {
        try {
            const { error } = await supabaseClient
                .from('km_lieux_favoris')
                .delete()
                .eq('id', lieuId);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Erreur suppression lieu favori:', error);
            throw error;
        }
    }

    // ==========================================
    // 📊 CALCULS & STATISTIQUES
    // ==========================================

    /**
     * Calculer le total de km pour une année
     */
    function calculerTotalKm(trajets) {
        return trajets.reduce((total, trajet) => {
            return total + (parseFloat(trajet.distance_totale) || 0);
        }, 0);
    }

    /**
     * Calculer le montant déductible selon barème kilométrique 2024
     * @param {number} totalKm - Distance totale en kilomètres
     * @param {number} puissanceFiscale - Puissance en CV (3-7)
     * @param {string} vehiculeType - Type de véhicule: 'thermique' ou 'electrique'
     * @returns {number} Montant déductible en euros
     */
    function calculerMontantDeductible(totalKm, puissanceFiscale = 5, vehiculeType = 'thermique') {
        // Barème 2024 pour véhicules ÉLECTRIQUES (unique, pas de distinction par puissance)
        if (vehiculeType === 'electrique') {
            if (totalKm <= 5000) {
                return totalKm * 0.679;
            } else if (totalKm <= 20000) {
                return (totalKm * 0.379) + 1500;
            } else {
                return totalKm * 0.454;
            }
        }

        // Barème 2024 pour véhicules THERMIQUES (essence/diesel)
        const puissance = parseInt(puissanceFiscale);
        
        if (totalKm <= 5000) {
            // Tranche 0-5000 km
            const tarifs = { 3: 0.529, 4: 0.606, 5: 0.636, 6: 0.665, 7: 0.697 };
            const tarifParKm = tarifs[puissance] || 0.636;
            return totalKm * tarifParKm;
        } else if (totalKm <= 20000) {
            // Tranche 5001-20000 km (formule: d × taux + forfait)
            const tarifs = { 
                3: { taux: 0.316, forfait: 1065 },
                4: { taux: 0.340, forfait: 1330 },
                5: { taux: 0.357, forfait: 1395 },
                6: { taux: 0.374, forfait: 1457 },
                7: { taux: 0.394, forfait: 1515 }
            };
            const config = tarifs[puissance] || { taux: 0.357, forfait: 1395 };
            return (totalKm * config.taux) + config.forfait;
        } else {
            // Plus de 20000 km
            const tarifs = { 3: 0.370, 4: 0.407, 5: 0.427, 6: 0.447, 7: 0.470 };
            const tarifParKm = tarifs[puissance] || 0.427;
            return totalKm * tarifParKm;
        }
    }

    /**
     * Grouper trajets par mois
     */
    function grouperParMois(trajets) {
        const parMois = {};
        
        trajets.forEach(trajet => {
            const date = new Date(trajet.date_trajet);
            const mois = date.getMonth() + 1; // 1-12
            const key = `${date.getFullYear()}-${String(mois).padStart(2, '0')}`;
            
            if (!parMois[key]) {
                parMois[key] = {
                    mois: key,
                    trajets: [],
                    totalKm: 0
                };
            }
            
            parMois[key].trajets.push(trajet);
            parMois[key].totalKm += parseFloat(trajet.distance_totale) || 0;
        });
        
        // Trier par ordre chronologique (Janvier → Décembre)
        return Object.values(parMois).sort((a, b) => a.mois.localeCompare(b.mois));
    }

    // ==========================================
    // 📥 EXPORT
    // ==========================================

    /**
     * Exporter les trajets en CSV pour Excel
     */
    function exporterCSV(trajets, annee) {
        // Informations de l'export
        const dateExport = new Date().toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Récupérer les infos véhicule
        const vehiculeType = document.getElementById('vehicule_type')?.value || 'thermique';
        const puissance = document.getElementById('puissance_fiscale')?.value || '5';
        const typeVehiculeLabel = vehiculeType === 'electrique' ? 'Électrique' : `Thermique ${puissance} CV`;
        
        // Calculer les totaux
        const totalKm = calculerTotalKm(trajets);
        const montantDeductible = calculerMontantDeductible(totalKm, parseInt(puissance), vehiculeType);
        const nbTrajets = trajets.length;
        const nbTrajetsAuto = trajets.filter(t => t.auto_genere).length;
        const nbTrajetsManuel = nbTrajets - nbTrajetsAuto;
        
        // Grouper par mois
        const parMois = grouperParMois(trajets);
        
        // En-tête du document
        const header = [
            ['REGISTRE DES TRAJETS PROFESSIONNELS - ANNÉE ' + annee],
            [''],
            ['Généré le:', dateExport],
            ['Type de véhicule:', typeVehiculeLabel],
            [''],
            ['SYNTHÈSE ANNUELLE'],
            ['Nombre total de trajets:', nbTrajets],
            ['Trajets automatiques:', nbTrajetsAuto],
            ['Trajets manuels:', nbTrajetsManuel],
            ['Distance totale:', totalKm.toFixed(2) + ' km'],
            ['Montant déductible:', montantDeductible.toFixed(2) + ' €'],
            [''],
            ['']
        ];
        
        // Résumé par mois
        const resumeMois = [
            ['RÉSUMÉ MENSUEL'],
            ['Mois', 'Nombre de trajets', 'Distance (km)', 'Montant déductible (€)']
        ];
        
        parMois.forEach(m => {
            const [year, month] = m.mois.split('-');
            const nomMois = new Date(year, parseInt(month) - 1).toLocaleDateString('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
            });
            const montantMois = calculerMontantDeductible(m.totalKm, parseInt(puissance), vehiculeType);
            
            resumeMois.push([
                nomMois,
                m.trajets.length,
                m.totalKm.toFixed(2),
                montantMois.toFixed(2)
            ]);
        });
        
        resumeMois.push(['', '', '', '']);
        resumeMois.push(['TOTAL ANNÉE', nbTrajets, totalKm.toFixed(2), montantDeductible.toFixed(2)]);
        resumeMois.push(['', '', '', '']);
        resumeMois.push(['']);
        
        // Détail des trajets
        const detailTrajets = [
            ['DÉTAIL DES TRAJETS'],
            ['Date', 'Motif', 'Type', 'Départ', 'Arrivée', 'Distance aller (km)', 'Aller-retour', 'Distance totale (km)', 'Origine', 'Notes']
        ];
        
        // Trier par date
        const trajetsTries = [...trajets].sort((a, b) => new Date(a.date_trajet) - new Date(b.date_trajet));
        
        trajetsTries.forEach(t => {
            const dateFormatee = new Date(t.date_trajet + 'T12:00:00').toLocaleDateString('fr-FR');
            const origine = t.auto_genere ? 'Automatique' : 'Manuel';
            
            detailTrajets.push([
                dateFormatee,
                t.motif || '-',
                t.type_trajet || '-',
                t.lieu_depart || 'Domicile',
                t.lieu_arrivee || '-',
                t.distance_aller.toFixed(2),
                t.aller_retour ? 'Oui' : 'Non',
                t.distance_totale.toFixed(2),
                origine,
                t.notes || ''
            ]);
        });
        
        // Ligne de total dans le détail
        detailTrajets.push(['', '', '', '', '', '', 'TOTAL', totalKm.toFixed(2), '', '']);
        detailTrajets.push(['']);
        detailTrajets.push(['']);
        
        // Informations légales
        const footer = [
            ['INFORMATIONS LÉGALES'],
            ['Ce document constitue un justificatif fiscal des frais de déplacement professionnels.'],
            ['Les montants sont calculés selon le barème kilométrique fiscal en vigueur.'],
            ['Conservation obligatoire : 6 ans minimum à compter de la date de déclaration fiscale.']
        ];
        
        // Assemblage final
        const allRows = [
            ...header,
            ...resumeMois,
            ...detailTrajets,
            ...footer
        ];
        
        // Conversion en CSV avec séparateur point-virgule pour Excel français
        const csvContent = allRows
            .map(row => row.map(cell => {
                // Échapper les guillemets et encapsuler
                const cellStr = String(cell).replace(/"/g, '""');
                return `"${cellStr}"`;
            }).join(';'))
            .join('\n');

        // Téléchargement avec BOM UTF-8 pour Excel
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Trajets_Professionnels_${annee}_${new Date().getTime()}.csv`;
        link.click();
        
        // Message de confirmation
        if (window.showToast) {
            window.showToast(`Export réussi : ${nbTrajets} trajets, ${totalKm.toFixed(0)} km`, 'success');
        }
    }

    // ==========================================
    // 🔄 API PUBLIQUE
    // ==========================================

    return {
        // Chargement
        chargerConfigAuto,
        chargerTrajets,
        chargerLieuxFavoris,
        
        // Gestion trajets
        ajouterTrajet,
        modifierTrajet,
        supprimerTrajet,
        
        // Automatisation
        creerTrajetsAutoReservation,
        supprimerTrajetsAutoReservation,
        sauvegarderConfigAuto,
        regenererTrajetsAutoAnnee,
        
        // Lieux favoris
        ajouterLieuFavori,
        modifierLieuFavori,
        supprimerLieuFavori,
        
        // Calculs
        calculerTotalKm,
        calculerMontantDeductible,
        grouperParMois,
        
        // Export
        exporterCSV,
        
        // Getters
        getConfigAuto: () => configAuto,
        getCurrentYear: () => currentYear,
        setCurrentYear: (year) => { currentYear = year; }
    };
})();

// Export global
window.KmManager = KmManager;
