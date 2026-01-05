// ================================================================
// GESTION DES DRAPS - STOCKS ET PRÉVISIONS
// ================================================================

const BESOINS_PAR_RESERVATION = {
    'trévoux': {
        draps_plats_grands: 6,
        draps_plats_petits: 3,
        housses_couettes_grandes: 6,
        housses_couettes_petites: 3,
        taies_oreillers: 15,
        serviettes: 15,
        tapis_bain: 3
    },
    'couzon': {
        draps_plats_grands: 4,
        draps_plats_petits: 3,
        housses_couettes_grandes: 4,
        housses_couettes_petites: 3,
        taies_oreillers: 11,
        serviettes: 11,
        tapis_bain: 2
    }
};

let stocksActuels = {
    'trévoux': {},
    'couzon': {}
};

// ================================================================
// INITIALISATION
// ================================================================

async function initDraps() {
    await chargerStocks();
    await analyserReservations();
}

window.initDraps = initDraps;

// ================================================================
// CHARGEMENT DES STOCKS
// ================================================================

async function chargerStocks() {
    try {
        const { data, error } = await window.supabase
            .from('stocks_draps')
            .select('*');

        if (error) throw error;

        data.forEach(stock => {
            stocksActuels[stock.gite] = stock;
            
            // Remplir les champs (vérifier qu'ils existent)
            // Normaliser le nom (retirer les accents pour les IDs HTML)
            const giteSlug = stock.gite.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
        const stocksTrevoux = {
            gite: 'trévoux',
            draps_plats_grands: parseInt(document.getElementById('stock-trevoux-draps-grands').value) || 0,
            draps_plats_petits: parseInt(document.getElementById('stock-trevoux-draps-petits').value) || 0,
            housses_couettes_grandes: parseInt(document.getElementById('stock-trevoux-housses-grandes').value) || 0,
            housses_couettes_petites: parseInt(document.getElementById('stock-trevoux-housses-petites').value) || 0,
            taies_oreillers: parseInt(document.getElementById('stock-trevoux-taies').value) || 0,
            serviettes: parseInt(document.getElementById('stock-trevoux-serviettes').value) || 0,
            tapis_bain: parseInt(document.getElementById('stock-trevoux-tapis').value) || 0,
            updated_at: new Date().toISOString()
        };

        const stocksCouzon = {
            gite: 'couzon',
            draps_plats_grands: parseInt(document.getElementById('stock-couzon-draps-grands').value) || 0,
            draps_plats_petits: parseInt(document.getElementById('stock-couzon-draps-petits').value) || 0,
            housses_couettes_grandes: parseInt(document.getElementById('stock-couzon-housses-grandes').value) || 0,
            housses_couettes_petites: parseInt(document.getElementById('stock-couzon-housses-petites').value) || 0,
            taies_oreillers: parseInt(document.getElementById('stock-couzon-taies').value) || 0,
            serviettes: parseInt(document.getElementById('stock-couzon-serviettes').value) || 0,
            tapis_bain: parseInt(document.getElementById('stock-couzon-tapis').value) || 0,
            updated_at: new Date().toISOString()
        };

        // Upsert pour Trévoux
        const { error: errorT } = await window.supabase
            .from('stocks_draps')
            .upsert(stocksTrevoux, { onConflict: 'gite' });

        if (errorT) throw errorT;

        // Upsert pour Couzon
        const { error: errorC } = await window.supabase
            .from('stocks_draps')
            .upsert(stocksCouzon, { onConflict: 'gite' });

        if (errorC) throw errorC;

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
        const { data: reservations, error } = await window.supabase
            .from('reservations')
            .select('*')
            .gte('date_debut', today)
            .order('date_debut', { ascending: true });

        if (error) throw error;

        // Normaliser les noms de gîtes
        const resaParGite = {
            'trévoux': reservations.filter(r => r.gite && r.gite.toLowerCase().includes('trévoux')),
            'couzon': reservations.filter(r => r.gite && r.gite.toLowerCase().includes('couzon'))
        };

        // Calculer combien de réservations peuvent être couvertes
        calculerReservationsCouvertes(resaParGite);
        
        // Calculer ce qu'il faut emmener dans chaque gîte
        calculerAEmmener(resaParGite);
    } catch (error) {
        console.error('Erreur analyse réservations:', error);
    }
}

function calculerReservationsCouvertes(resaParGite) {
    const container = document.getElementById('reservations-couvertes');
    let html = '';

    ['trévoux', 'couzon'].forEach(gite => {
        const stock = stocksActuels[gite] || {};
        const besoins = BESOINS_PAR_RESERVATION[gite];
        
        // Calculer le minimum pour chaque type de linge
        const ratios = [
            Math.floor((stock.draps_plats_grands || 0) / besoins.draps_plats_grands),
            Math.floor((stock.draps_plats_petits || 0) / besoins.draps_plats_petits),
            Math.floor((stock.housses_couettes_grandes || 0) / besoins.housses_couettes_grandes),
            Math.floor((stock.housses_couettes_petites || 0) / besoins.housses_couettes_petites),
            Math.floor((stock.taies_oreillers || 0) / besoins.taies_oreillers),
            Math.floor((stock.serviettes || 0) / besoins.serviettes),
            Math.floor((stock.tapis_bain || 0) / besoins.tapis_bain)
        ];
        
        const nbReservations = Math.min(...ratios.filter(r => r >= 0));
        const nbResa = resaParGite[gite].length;
        
        const alertClass = nbReservations >= nbResa ? 'alert-success' : 
                          nbReservations >= Math.ceil(nbResa / 2) ? 'alert-warning' : 
                          'alert-danger';
        
        html += `
            <div class="stat-box">
                <h4>🏠 ${gite.charAt(0).toUpperCase() + gite.slice(1)}</h4>
                <div class="value">${nbReservations} réservations</div>
                <p style="font-size: 13px; color: #666; margin-top: 5px;">
                    ${nbResa} réservations à venir
                </p>
            </div>
            <div class="alert ${alertClass}">
                ${nbReservations >= nbResa ? '✅ Stock suffisant' : 
                  nbReservations >= Math.ceil(nbResa / 2) ? '⚠️ Stock limite' : 
                  '❌ Stock insuffisant - Commander rapidement'}
            </div>
        `;
    });

    container.innerHTML = html;
}

function calculerAEmmener(resaParGite) {
    const container = document.getElementById('a-emmener');
    let html = '';

    ['trévoux', 'couzon'].forEach(gite => {
        const prochaines = resaParGite[gite].slice(0, 3); // 3 prochaines réservations
        const besoins = BESOINS_PAR_RESERVATION[gite];
        
        if (prochaines.length === 0) {
            html += `<div class="stat-box">
                <h4>🏠 ${gite.charAt(0).toUpperCase() + gite.slice(1)}</h4>
                <p style="color: #666; font-size: 13px;">Aucune réservation à venir</p>
            </div>`;
            return;
        }
        
        const total = {
            draps_plats_grands: besoins.draps_plats_grands * prochaines.length,
            draps_plats_petits: besoins.draps_plats_petits * prochaines.length,
            housses_couettes_grandes: besoins.housses_couettes_grandes * prochaines.length,
            housses_couettes_petites: besoins.housses_couettes_petites * prochaines.length,
            taies_oreillers: besoins.taies_oreillers * prochaines.length,
            serviettes: besoins.serviettes * prochaines.length,
            tapis_bain: besoins.tapis_bain * prochaines.length
        };
        
        html += `
            <div class="stat-box">
                <h4>🏠 ${gite.charAt(0).toUpperCase() + gite.slice(1)} (${prochaines.length} prochaines résa)</h4>
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
    });

    container.innerHTML = html;
}

// ================================================================
// SIMULATION DES BESOINS FUTURS
// ================================================================

async function simulerBesoins() {
    const dateLimit = document.getElementById('date-simulation').value;
    if (!dateLimit) {
        alert('⚠️ Veuillez sélectionner une date');
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const { data: reservations, error } = await window.supabase
            .from('reservations')
            .select('*')
            .gte('date_debut', today)
            .lte('date_debut', dateLimit)
            .order('date_debut', { ascending: true });

        if (error) throw error;

        // Grouper par gîte
        const resaParGite = {
            'trévoux': reservations.filter(r => r.gite && r.gite.toLowerCase().includes('trévoux')),
            'couzon': reservations.filter(r => r.gite && r.gite.toLowerCase().includes('couzon'))
        };

        afficherResultatsSimulation(resaParGite, dateLimit);
    } catch (error) {
        console.error('Erreur simulation:', error);
        alert('❌ Erreur lors de la simulation');
    }
}

window.simulerBesoins = simulerBesoins;

function afficherResultatsSimulation(resaParGite, dateLimit) {
    const container = document.getElementById('resultats-simulation');
    let html = `<h3 style="margin-bottom: 15px;">Besoins jusqu'au ${new Date(dateLimit).toLocaleDateString('fr-FR')}</h3>`;

    ['trévoux', 'couzon'].forEach(gite => {
        const resas = resaParGite[gite];
        const besoins = BESOINS_PAR_RESERVATION[gite];
        const stock = stocksActuels[gite] || {};
        
        const totalNecessaire = {
            draps_plats_grands: besoins.draps_plats_grands * resas.length,
            draps_plats_petits: besoins.draps_plats_petits * resas.length,
            housses_couettes_grandes: besoins.housses_couettes_grandes * resas.length,
            housses_couettes_petites: besoins.housses_couettes_petites * resas.length,
            taies_oreillers: besoins.taies_oreillers * resas.length,
            serviettes: besoins.serviettes * resas.length,
            tapis_bain: besoins.tapis_bain * resas.length
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
                <h4 style="color: #667eea; margin-bottom: 10px;">🏠 ${gite.charAt(0).toUpperCase() + gite.slice(1)}</h4>
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
    });

    container.innerHTML = html;
}
