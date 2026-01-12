// ================================================================
// GESTION DES DRAPS - STOCKS ET PRÉVISIONS
// ================================================================

// 🚀 Les besoins sont maintenant stockés en BDD (gites.settings.linen_needs)
// Ce module les charge dynamiquement via GitesManager

let stocksActuels = {};
let derniereSimulation = null; // Stocke les résultats de la dernière simulation
let gites = []; // Cache des gîtes

// ================================================================
// INITIALISATION
// ================================================================

async function initDraps() {
    // Charger les gîtes
    gites = await window.gitesManager.getAll();
    
    // Initialiser stocksActuels pour chaque gîte
    gites.forEach(g => {
        stocksActuels[g.id] = {};
    });
    await chargerStocks();
    await analyserReservations();
    
    // Attacher l'événement au bouton Calculer (celui après #date-simulation)
    const dateInput = document.getElementById('date-simulation');
    if (dateInput && dateInput.nextElementSibling) {
        const btnCalculer = dateInput.nextElementSibling;
        // console.log('✅ Bouton Calculer trouvé:', btnCalculer.textContent);
        
        btnCalculer.addEventListener('click', function(e) {
            console.log('🖱️ CLIC DÉTECTÉ !');
            e.preventDefault();
            simulerBesoins();
        });
    } else {
        console.error('❌ Bouton Calculer non trouvé');
    }
}

window.initDraps = initDraps;

// ================================================================
// CHARGEMENT DES STOCKS
// ================================================================

async function chargerStocks() {
    try {
        const { data, error } = await window.supabaseClient
            .from('linen_stocks')
            .select('*');

        if (error) throw error;

        data.forEach(stock => {
            stocksActuels[stock.gite_id] = stock;
            
            // Remplir les champs (vérifier qu'ils existent)
            const gite = gites.find(g => g.id === stock.gite_id);
            if (!gite) return;
            
            const giteSlug = gite.slug;
            const fields = [
                { id: `stock-${giteSlug}-draps-grands`, value: stock.draps_plats_grands },
                { id: `stock-${giteSlug}-draps-petits`, value: stock.draps_plats_petits },
                { id: `stock-${giteSlug}-housses-grandes`, value: stock.housses_couettes_grandes },
                { id: `stock-${giteSlug}-housses-petites`, value: stock.housses_couettes_petites },
                { id: `stock-${giteSlug}-taies`, value: stock.taies_oreillers },
                { id: `stock-${giteSlug}-serviettes`, value: stock.serviettes },
                { id: `stock-${giteSlug}-tapis`, value: stock.tapis_bain }
            ];
            
            fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = field.value || 0;
                }
            });
        });
    } catch (error) {
        console.error('Erreur chargement stocks:', error);
        alert('Erreur lors du chargement des stocks');
    }
}

// ================================================================
// SAUVEGARDE DES STOCKS
// ================================================================

async function sauvegarderStocks() {
    try {
        for (const gite of gites) {
            const slug = gite.slug;
            
            const stocks = {
                gite_id: gite.id,
                draps_plats_grands: parseInt(document.getElementById(`stock-${slug}-draps-grands`)?.value) || 0,
                draps_plats_petits: parseInt(document.getElementById(`stock-${slug}-draps-petits`)?.value) || 0,
                housses_couettes_grandes: parseInt(document.getElementById(`stock-${slug}-housses-grandes`)?.value) || 0,
                housses_couettes_petites: parseInt(document.getElementById(`stock-${slug}-housses-petites`)?.value) || 0,
                taies_oreillers: parseInt(document.getElementById(`stock-${slug}-taies`)?.value) || 0,
                serviettes: parseInt(document.getElementById(`stock-${slug}-serviettes`)?.value) || 0,
                tapis_bain: parseInt(document.getElementById(`stock-${slug}-tapis`)?.value) || 0,
                updated_at: new Date().toISOString()
            };

            const { error } = await window.supabaseClient
                .from('linen_stocks')
                .upsert(stocks, { onConflict: 'gite_id' });

            if (error) throw error;
        }

        alert('✅ Stocks sauvegardés avec succès !');
        
        // Recharger et recalculer
        await chargerStocks();
        await analyserReservations();
    } catch (error) {
        console.error('Erreur sauvegarde stocks:', error);
        alert('❌ Erreur lors de la sauvegarde');
    }
}

window.sauvegarderStocks = sauvegarderStocks;

// ================================================================
// ANALYSE DES RÉSERVATIONS
// ================================================================

async function analyserReservations() {
    try {
        // Récupérer les réservations futures
        const today = new Date().toISOString().split('T')[0];
        const { data: reservations, error } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .gte('check_in', today)
            .order('check_in', { ascending: true });

        if (error) throw error;

        // Grouper par gîte
        const resaParGite = {};
        gites.forEach(g => {
            resaParGite[g.id] = reservations.filter(r => r.gite_id === g.id);
        });

        // Calculer combien de réservations peuvent être couvertes
        const infosCouverture = calculerReservationsCouvertes(resaParGite);
        
        // Calculer ce qu'il faut emmener dans chaque gîte (jusqu'à la date limite)
        calculerAEmmener(resaParGite, infosCouverture);
        
        // Créer tâche automatique si besoin
        await creerTacheStockSiNecessaire(resaParGite, infosCouverture);
    } catch (error) {
        console.error('Erreur analyse réservations:', error);
    }
}

function calculerReservationsCouvertes(resaParGite) {
    const container = document.getElementById('reservations-couvertes');
    let html = '';
    const infosCouverture = {};

    for (const gite of gites) {
        const stock = stocksActuels[gite.id] || {};
        const besoins = gite.settings?.linen_needs || {};
        
        // Calculer le minimum pour chaque type de linge
        const ratios = [
            Math.floor((stock.draps_plats_grands || 0) / (besoins.draps_plats_grands || 1)),
            Math.floor((stock.draps_plats_petits || 0) / (besoins.draps_plats_petits || 1)),
            Math.floor((stock.housses_couettes_grandes || 0) / (besoins.housses_couettes_grandes || 1)),
            Math.floor((stock.housses_couettes_petites || 0) / (besoins.housses_couettes_petites || 1)),
            Math.floor((stock.taies_oreillers || 0) / (besoins.taies_oreillers || 1)),
            Math.floor((stock.serviettes || 0) / (besoins.serviettes || 1)),
            Math.floor((stock.tapis_bain || 0) / (besoins.tapis_bain || 1))
        ];
        
        const nbReservations = Math.min(...ratios.filter(r => r >= 0));
        const reservations = resaParGite[gite.id];
        
        // Trouver jusqu'à quelle date on peut tenir
        let dateJusqua = null;
        let messageDate = '';
        
        if (nbReservations > 0 && reservations.length > 0) {
            const indexDerniere = Math.min(nbReservations - 1, reservations.length - 1);
            const derniereResa = reservations[indexDerniere];
            if (derniereResa && derniereResa.check_out) {
                dateJusqua = new Date(derniereResa.check_out);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                messageDate = `📅 Vous pouvez tenir jusqu'au ${dateJusqua.toLocaleDateString('fr-FR', options)}`;
            }
        }
        
        const alertClass = nbReservations >= reservations.length ? 'alert-success' : 
                          nbReservations >= Math.ceil(reservations.length / 2) ? 'alert-warning' : 
                          'alert-danger';
        
        const alertMessage = nbReservations >= reservations.length ? 
            '✅ Stock suffisant pour toutes les réservations' : 
            nbReservations === 0 ? 
            '❌ Stock épuisé - Commander immédiatement' :
            `⚠️ Stock pour ${nbReservations} réservation${nbReservations > 1 ? 's' : ''} sur ${reservations.length}`;
        
        // Stocker les infos de couverture
        infosCouverture[gite.id] = {
            nbReservationsCouvertes: nbReservations,
            totalReservations: reservations.length,
            dateLimite: dateJusqua,
            reservations: reservations,
            gite: gite
        };
        
        html += `
            <div class="stat-box">
                <h4>🏠 ${gite.name}</h4>
                <div class="value">${nbReservations} réservations</div>
                <p style="font-size: 13px; color: #666; margin-top: 5px;">
                    ${reservations.length} réservations à venir
                </p>
            </div>
            <div class="alert ${alertClass}">
                <div>${alertMessage}</div>
                ${messageDate ? `<div style="margin-top: 8px; font-weight: 600;">${messageDate}</div>` : ''}
            </div>
        `;
    }

    window.SecurityUtils.setInnerHTML(container, html);
    return infosCouverture;
}

function calculerAEmmener(resaParGite, infosCouverture) {
    const container = document.getElementById('a-emmener');
    let html = '';

    for (const gite of gites) {
        const infos = infosCouverture[gite.id];
        const besoins = gite.settings?.linen_needs || {};
        
        if (!infos || infos.nbReservationsCouvertes === 0 || infos.reservations.length === 0) {
            html += `<div class="stat-box">
                <h4>🏠 ${gite.name}</h4>
                <p style="color: #666; font-size: 13px;">Aucune réservation couverte par les stocks</p>
            </div>`;
            continue;
        }
        
        // Prendre toutes les réservations jusqu'à la date limite
        const nbResa = Math.min(infos.nbReservationsCouvertes, infos.reservations.length);
        const reservationsCouvertes = infos.reservations.slice(0, nbResa);
        
        const total = {
            draps_plats_grands: (besoins.draps_plats_grands || 0) * nbResa,
            draps_plats_petits: (besoins.draps_plats_petits || 0) * nbResa,
            housses_couettes_grandes: (besoins.housses_couettes_grandes || 0) * nbResa,
            housses_couettes_petites: (besoins.housses_couettes_petites || 0) * nbResa,
            taies_oreillers: (besoins.taies_oreillers || 0) * nbResa,
            serviettes: (besoins.serviettes || 0) * nbResa,
            tapis_bain: (besoins.tapis_bain || 0) * nbResa
        };
        
        const dateInfo = infos.dateLimite ? 
            ` jusqu'au ${infos.dateLimite.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : '';
        
        html += `
            <div class="stat-box">
                <h4>🏠 ${gite.name} (${nbResa} résa${dateInfo})</h4>
                <ul style="font-size: 12px; line-height: 1.8; margin-top: 8px;">
                    <li>${total.draps_plats_grands} draps plats grands</li>
                    <li>${total.draps_plats_petits} draps plats petits</li>
                    <li>${total.housses_couettes_grandes} housses couette grandes</li>
                    <li>${total.housses_couettes_petites} housses couette petites</li>
                    <li>${total.taies_oreillers} taies d'oreillers</li>
                    <li>${total.serviettes} serviettes</li>
                    <li>${total.tapis_bain} tapis de bain</li>
                </ul>
            </div>
        `;
    }

    window.SecurityUtils.setInnerHTML(container, html);
}

function afficherAEmmenerDepuisSimulation() {
    if (!derniereSimulation) return;
    
    const { resaParGite, dateLimit } = derniereSimulation;
    const container = document.getElementById('a-emmener');
    let html = '';

    ['trevoux', 'couzon'].forEach(gite => {
        const resas = resaParGite[gite];
        const besoins = BESOINS_PAR_RESERVATION[gite];
        const stock = stocksActuels[gite] || {};
        
        if (!resas || resas.length === 0) {
            html += `<div class="stat-box">
                <h4>🏠 ${gite.charAt(0).toUpperCase() + gite.slice(1)}</h4>
                <p style="color: #666; font-size: 13px;">Aucune réservation dans la simulation</p>
            </div>`;
            return;
        }
        
        const totalNecessaire = {
            draps_plats_grands: besoins.draps_plats_grands * resas.length,
            draps_plats_petits: besoins.draps_plats_petits * resas.length,
            housses_couettes_grandes: besoins.housses_couettes_grandes * resas.length,
            housses_couettes_petites: besoins.housses_couettes_petites * resas.length,
            taies_oreillers: besoins.taies_oreillers * resas.length,
            serviettes: besoins.serviettes * resas.length,
            tapis_bain: besoins.tapis_bain * resas.length
        };
        
        const aEmmener = {
            draps_plats_grands: Math.max(0, totalNecessaire.draps_plats_grands - (stock.draps_plats_grands || 0)),
            draps_plats_petits: Math.max(0, totalNecessaire.draps_plats_petits - (stock.draps_plats_petits || 0)),
            housses_couettes_grandes: Math.max(0, totalNecessaire.housses_couettes_grandes - (stock.housses_couettes_grandes || 0)),
            housses_couettes_petites: Math.max(0, totalNecessaire.housses_couettes_petites - (stock.housses_couettes_petites || 0)),
            taies_oreillers: Math.max(0, totalNecessaire.taies_oreillers - (stock.taies_oreillers || 0)),
            serviettes: Math.max(0, totalNecessaire.serviettes - (stock.serviettes || 0)),
            tapis_bain: Math.max(0, totalNecessaire.tapis_bain - (stock.tapis_bain || 0))
        };
        
        const totalAEmmener = Object.values(aEmmener).reduce((a, b) => a + b, 0);
        const dateFormatee = new Date(dateLimit).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        
        html += `
            <div class="stat-box">
                <h4>🏠 ${gite.charAt(0).toUpperCase() + gite.slice(1)}</h4>
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">
                    ${resas.length} réservations jusqu'au ${dateFormatee}
                </p>
                ${totalAEmmener > 0 ? `
                    <div class="list-items" style="text-align: left;">
                        ${aEmmener.draps_plats_grands > 0 ? `<div>• Draps plats grands: <strong>${aEmmener.draps_plats_grands}</strong></div>` : ''}
                        ${aEmmener.draps_plats_petits > 0 ? `<div>• Draps plats petits: <strong>${aEmmener.draps_plats_petits}</strong></div>` : ''}
                        ${aEmmener.housses_couettes_grandes > 0 ? `<div>• Housses couette grandes: <strong>${aEmmener.housses_couettes_grandes}</strong></div>` : ''}
                        ${aEmmener.housses_couettes_petites > 0 ? `<div>• Housses couette petites: <strong>${aEmmener.housses_couettes_petites}</strong></div>` : ''}
                        ${aEmmener.taies_oreillers > 0 ? `<div>• Taies d'oreillers: <strong>${aEmmener.taies_oreillers}</strong></div>` : ''}
                        ${aEmmener.serviettes > 0 ? `<div>• Serviettes: <strong>${aEmmener.serviettes}</strong></div>` : ''}
                        ${aEmmener.tapis_bain > 0 ? `<div>• Tapis de bain: <strong>${aEmmener.tapis_bain}</strong></div>` : ''}
                    </div>
                ` : `
                    <div style="color: #27AE60; font-weight: 600; margin-top: 10px;">✅ Stock suffisant</div>
                `}
            </div>
        `;
    });

    window.SecurityUtils.setInnerHTML(container, html);
}

// ================================================================
// CRÉATION AUTOMATIQUE DE TÂCHE SI STOCK FAIBLE
// ================================================================

async function creerTacheStockSiNecessaire(resaParGite, infosCouverture) {
    try {
        const today = new Date();
        const uneSemaneFuture = new Date(today);
        uneSemaneFuture.setDate(uneSemaneFuture.getDate() + 7);
        
        const troisSemainesFuture = new Date(today);
        troisSemainesFuture.setDate(troisSemainesFuture.getDate() + 21);
        
        for (const gite of ['trevoux', 'couzon']) {
            const infos = infosCouverture[gite];
            
            // Vérifier si on va manquer de stock dans une semaine
            if (infos && infos.dateLimite && infos.dateLimite <= uneSemaneFuture) {
                // Calculer les besoins pour les 3 prochaines semaines
                const reservations3Semaines = resaParGite[gite].filter(r => {
                    const dateDebut = new Date(r.check_in);
                    return dateDebut >= today && dateDebut <= troisSemainesFuture;
                });
                
                if (reservations3Semaines.length > 0) {
                    const besoins = BESOINS_PAR_RESERVATION[gite];
                    const stock = stocksActuels[gite] || {};
                    
                    // Calculer ce qu'il faut commander
                    const necessaire = {
                        draps_plats_grands: besoins.draps_plats_grands * reservations3Semaines.length,
                        draps_plats_petits: besoins.draps_plats_petits * reservations3Semaines.length,
                        housses_couettes_grandes: besoins.housses_couettes_grandes * reservations3Semaines.length,
                        housses_couettes_petites: besoins.housses_couettes_petites * reservations3Semaines.length,
                        taies_oreillers: besoins.taies_oreillers * reservations3Semaines.length,
                        serviettes: besoins.serviettes * reservations3Semaines.length,
                        tapis_bain: besoins.tapis_bain * reservations3Semaines.length
                    };
                    
                    const aCommander = {
                        draps_plats_grands: Math.max(0, necessaire.draps_plats_grands - (stock.draps_plats_grands || 0)),
                        draps_plats_petits: Math.max(0, necessaire.draps_plats_petits - (stock.draps_plats_petits || 0)),
                        housses_couettes_grandes: Math.max(0, necessaire.housses_couettes_grandes - (stock.housses_couettes_grandes || 0)),
                        housses_couettes_petites: Math.max(0, necessaire.housses_couettes_petites - (stock.housses_couettes_petites || 0)),
                        taies_oreillers: Math.max(0, necessaire.taies_oreillers - (stock.taies_oreillers || 0)),
                        serviettes: Math.max(0, necessaire.serviettes - (stock.serviettes || 0)),
                        tapis_bain: Math.max(0, necessaire.tapis_bain - (stock.tapis_bain || 0))
                    };
                    
                    // Construire le détail de la commande
                    const details = [];
                    if (aCommander.draps_plats_grands > 0) details.push(`${aCommander.draps_plats_grands} draps plats grands`);
                    if (aCommander.draps_plats_petits > 0) details.push(`${aCommander.draps_plats_petits} draps plats petits`);
                    if (aCommander.housses_couettes_grandes > 0) details.push(`${aCommander.housses_couettes_grandes} housses couette grandes`);
                    if (aCommander.housses_couettes_petites > 0) details.push(`${aCommander.housses_couettes_petites} housses couette petites`);
                    if (aCommander.taies_oreillers > 0) details.push(`${aCommander.taies_oreillers} taies d'oreillers`);
                    if (aCommander.serviettes > 0) details.push(`${aCommander.serviettes} serviettes`);
                    if (aCommander.tapis_bain > 0) details.push(`${aCommander.tapis_bain} tapis de bain`);
                    
                    if (details.length > 0) {
                        const giteCapitalized = gite.charAt(0).toUpperCase() + gite.slice(1);
                        const dateFormatee = troisSemainesFuture.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
                        
                        const description = `⚠️ Stock insuffisant pour les 3 prochaines semaines (jusqu'au ${dateFormatee}).\n\n🛒 À commander :\n${details.map(d => `• ${d}`).join('\n')}\n\nℹ️ ${reservations3Semaines.length} réservation(s) prévue(s) pour ${giteCapitalized}.`;
                        
                        // Vérifier si une tâche similaire existe déjà (non complétée, créée récemment)
                        const deuxJoursAvant = new Date(today);
                        deuxJoursAvant.setDate(deuxJoursAvant.getDate() - 2);
                        
                        const { data: tachesExistantes } = await window.supabaseClient
                            .from('todos')
                            .select('*')
                            .eq('category', 'achats')
                            .eq('gite', giteCapitalized)
                            .eq('completed', false)
                            .ilike('title', '%Commander draps%')
                            .gte('created_at', deuxJoursAvant.toISOString());
                        
                        // Créer la tâche seulement si elle n'existe pas déjà
                        if (!tachesExistantes || tachesExistantes.length === 0) {
                            await window.supabaseClient
                                .from('todos')
                                .insert({
                                    category: 'achats',
                                    title: `🛏️ Commander draps pour ${giteCapitalized}`,
                                    description: description,
                                    gite: giteCapitalized,
                                    completed: false
                                });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erreur création tâche automatique:', error);
        // Ne pas bloquer l'affichage en cas d'erreur
    }
}

// ================================================================
// SIMULATION DES BESOINS FUTURS
// ================================================================

async function simulerBesoins() {
    console.log('🔮 simulerBesoins() appelée');
    const dateLimit = document.getElementById('date-simulation').value;
    console.log('📅 Date limite:', dateLimit);
    
    if (!dateLimit) {
        alert('⚠️ Veuillez sélectionner une date');
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        console.log('📊 Requête Supabase de', today, 'à', dateLimit);
        
        const { data: reservations, error } = await window.supabaseClientClient
            .from('reservations')
            .select('*')
            .gte('check_in', today)
            .lte('check_in', dateLimit)
            .order('check_in', { ascending: true });

        if (error) throw error;
        
        console.log('✅ Réservations récupérées:', reservations?.length);

        // Grouper par gîte (UUID)
        const resaParGite = {};
        gites.forEach(g => {
            resaParGite[g.id] = reservations.filter(r => r.gite_id === g.id);
        });

        afficherResultatsSimulation(resaParGite, dateLimit);
        
        // Sauvegarder la simulation et mettre à jour "À Emmener"
        derniereSimulation = { resaParGite, dateLimit };
        afficherAEmmenerDepuisSimulation();
    } catch (error) {
        console.error('❌ Erreur simulation:', error);
        alert('❌ Erreur lors de la simulation: ' + error.message);
    }
}

window.simulerBesoins = simulerBesoins;

function afficherResultatsSimulation(resaParGite, dateLimit) {
    const container = document.getElementById('resultats-simulation');
    let html = `<h3 style="margin-bottom: 15px;">Besoins jusqu'au ${new Date(dateLimit).toLocaleDateString('fr-FR')}</h3>`;

    for (const gite of gites) {
        const resas = resaParGite[gite.id] || [];
        const besoins = gite.settings?.linen_needs || {};
        const stock = stocksActuels[gite.id] || {};
        
        const totalNecessaire = {
            draps_plats_grands: (besoins.draps_plats_grands || 0) * resas.length,
            draps_plats_petits: (besoins.draps_plats_petits || 0) * resas.length,
            housses_couettes_grandes: (besoins.housses_couettes_grandes || 0) * resas.length,
            housses_couettes_petites: (besoins.housses_couettes_petites || 0) * resas.length,
            taies_oreillers: (besoins.taies_oreillers || 0) * resas.length,
            serviettes: (besoins.serviettes || 0) * resas.length,
            tapis_bain: (besoins.tapis_bain || 0) * resas.length
        };
        
        const aCommander = {
            draps_plats_grands: Math.max(0, totalNecessaire.draps_plats_grands - (stock.draps_plats_grands || 0)),
            draps_plats_petits: Math.max(0, totalNecessaire.draps_plats_petits - (stock.draps_plats_petits || 0)),
            housses_couettes_grandes: Math.max(0, totalNecessaire.housses_couettes_grandes - (stock.housses_couettes_grandes || 0)),
            housses_couettes_petites: Math.max(0, totalNecessaire.housses_couettes_petites - (stock.housses_couettes_petites || 0)),
            taies_oreillers: Math.max(0, totalNecessaire.taies_oreillers - (stock.taies_oreillers || 0)),
            serviettes: Math.max(0, totalNecessaire.serviettes - (stock.serviettes || 0)),
            tapis_bain: Math.max(0, totalNecessaire.tapis_bain - (stock.tapis_bain || 0))
        };
        
        const totalACommander = Object.values(aCommander).reduce((a, b) => a + b, 0);
        
        html += `
            <div class="card" style="margin-bottom: 15px;">
                <h4 style="color: ${gite.color}; margin-bottom: 10px;">🏠 ${gite.name}</h4>
                <p style="font-size: 14px; color: #666; margin-bottom: 15px;">${resas.length} réservations</p>
                
                ${totalACommander > 0 ? `
                    <div class="alert alert-warning" style="margin-bottom: 15px;">
                        ⚠️ Il manque ${totalACommander} articles à commander
                    </div>
                    
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Article</th>
                                    <th>Nécessaire</th>
                                    <th>Stock</th>
                                    <th>À commander</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Draps plats grands</td>
                                    <td>${totalNecessaire.draps_plats_grands}</td>
                                    <td>${stock.draps_plats_grands || 0}</td>
                                    <td>${aCommander.draps_plats_grands > 0 ? `<span class="badge-manque">${aCommander.draps_plats_grands}</span>` : `<span class="badge-ok">OK</span>`}</td>
                                </tr>
                                <tr>
                                    <td>Draps plats petits</td>
                                    <td>${totalNecessaire.draps_plats_petits}</td>
                                    <td>${stock.draps_plats_petits || 0}</td>
                                    <td>${aCommander.draps_plats_petits > 0 ? `<span class="badge-manque">${aCommander.draps_plats_petits}</span>` : `<span class="badge-ok">OK</span>`}</td>
                                </tr>
                                <tr>
                                    <td>Housses couette grandes</td>
                                    <td>${totalNecessaire.housses_couettes_grandes}</td>
                                    <td>${stock.housses_couettes_grandes || 0}</td>
                                    <td>${aCommander.housses_couettes_grandes > 0 ? `<span class="badge-manque">${aCommander.housses_couettes_grandes}</span>` : `<span class="badge-ok">OK</span>`}</td>
                                </tr>
                                <tr>
                                    <td>Housses couette petites</td>
                                    <td>${totalNecessaire.housses_couettes_petites}</td>
                                    <td>${stock.housses_couettes_petites || 0}</td>
                                    <td>${aCommander.housses_couettes_petites > 0 ? `<span class="badge-manque">${aCommander.housses_couettes_petites}</span>` : `<span class="badge-ok">OK</span>`}</td>
                                </tr>
                                <tr>
                                    <td>Taies d'oreillers</td>
                                    <td>${totalNecessaire.taies_oreillers}</td>
                                    <td>${stock.taies_oreillers || 0}</td>
                                    <td>${aCommander.taies_oreillers > 0 ? `<span class="badge-manque">${aCommander.taies_oreillers}</span>` : `<span class="badge-ok">OK</span>`}</td>
                                </tr>
                                <tr>
                                    <td>Serviettes</td>
                                    <td>${totalNecessaire.serviettes}</td>
                                    <td>${stock.serviettes || 0}</td>
                                    <td>${aCommander.serviettes > 0 ? `<span class="badge-manque">${aCommander.serviettes}</span>` : `<span class="badge-ok">OK</span>`}</td>
                                </tr>
                                <tr>
                                    <td>Tapis de bain</td>
                                    <td>${totalNecessaire.tapis_bain}</td>
                                    <td>${stock.tapis_bain || 0}</td>
                                    <td>${aCommander.tapis_bain > 0 ? `<span class="badge-manque">${aCommander.tapis_bain}</span>` : `<span class="badge-ok">OK</span>`}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="alert alert-success">
                        ✅ Stock suffisant pour toutes les réservations
                    </div>
                `}
            </div>
        `;
    }

    window.SecurityUtils.setInnerHTML(container, html);
}

// ================================================================
// AFFICHAGE "À EMMENER" DEPUIS SIMULATION
// ================================================================

function afficherAEmmenerDepuisSimulation() {
    if (!derniereSimulation) return;
    
    const { resaParGite, dateLimit } = derniereSimulation;
    const container = document.getElementById('a-emmener');
    let html = '';

    for (const gite of gites) {
        const resas = resaParGite[gite.id] || [];
        const besoins = gite.settings?.linen_needs || {};
        const stock = stocksActuels[gite.id] || {};
        
        if (!resas || resas.length === 0) {
            html += `<div class="stat-box">
                <h4>🏠 ${gite.charAt(0).toUpperCase() + gite.slice(1)}</h4>
                <p style="color: #666; font-size: 13px;">Aucune réservation dans la simulation</p>
            </div>`;
            return;
        }
        
        const totalNecessaire = {
            draps_plats_grands: besoins.draps_plats_grands * resas.length,
            draps_plats_petits: besoins.draps_plats_petits * resas.length,
            housses_couettes_grandes: besoins.housses_couettes_grandes * resas.length,
            housses_couettes_petites: besoins.housses_couettes_petites * resas.length,
            taies_oreillers: besoins.taies_oreillers * resas.length,
            serviettes: besoins.serviettes * resas.length,
            tapis_bain: besoins.tapis_bain * resas.length
        };
        
        const aEmmener = {
            draps_plats_grands: Math.max(0, totalNecessaire.draps_plats_grands - (stock.draps_plats_grands || 0)),
            draps_plats_petits: Math.max(0, totalNecessaire.draps_plats_petits - (stock.draps_plats_petits || 0)),
            housses_couettes_grandes: Math.max(0, totalNecessaire.housses_couettes_grandes - (stock.housses_couettes_grandes || 0)),
            housses_couettes_petites: Math.max(0, totalNecessaire.housses_couettes_petites - (stock.housses_couettes_petites || 0)),
            taies_oreillers: Math.max(0, totalNecessaire.taies_oreillers - (stock.taies_oreillers || 0)),
            serviettes: Math.max(0, totalNecessaire.serviettes - (stock.serviettes || 0)),
            tapis_bain: Math.max(0, totalNecessaire.tapis_bain - (stock.tapis_bain || 0))
        };
        
        const totalAEmmener = Object.values(aEmmener).reduce((a, b) => a + b, 0);
        const dateFormatee = new Date(dateLimit).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        
        html += `
            <div class="stat-box">
                <h4>🏠 ${gite.charAt(0).toUpperCase() + gite.slice(1)}</h4>
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">
                    ${resas.length} réservations jusqu'au ${dateFormatee}
                </p>
                ${totalAEmmener > 0 ? `
                    <div class="list-items" style="text-align: left;">
                        ${aEmmener.draps_plats_grands > 0 ? `<div>• Draps plats grands: <strong>${aEmmener.draps_plats_grands}</strong></div>` : ''}
                        ${aEmmener.draps_plats_petits > 0 ? `<div>• Draps plats petits: <strong>${aEmmener.draps_plats_petits}</strong></div>` : ''}
                        ${aEmmener.housses_couettes_grandes > 0 ? `<div>• Housses couette grandes: <strong>${aEmmener.housses_couettes_grandes}</strong></div>` : ''}
                        ${aEmmener.housses_couettes_petites > 0 ? `<div>• Housses couette petites: <strong>${aEmmener.housses_couettes_petites}</strong></div>` : ''}
                        ${aEmmener.taies_oreillers > 0 ? `<div>• Taies d'oreillers: <strong>${aEmmener.taies_oreillers}</strong></div>` : ''}
                        ${aEmmener.serviettes > 0 ? `<div>• Serviettes: <strong>${aEmmener.serviettes}</strong></div>` : ''}
                        ${aEmmener.tapis_bain > 0 ? `<div>• Tapis de bain: <strong>${aEmmener.tapis_bain}</strong></div>` : ''}
                    </div>
                ` : `
                    <div style="color: #27AE60; font-weight: 600; margin-top: 10px;">✅ Stock suffisant</div>
                `}
            </div>
        `;
    }

    window.SecurityUtils.setInnerHTML(container, html);
}
