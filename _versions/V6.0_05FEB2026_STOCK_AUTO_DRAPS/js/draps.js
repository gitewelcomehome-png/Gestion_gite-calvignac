// ================================================================
// GESTION DES DRAPS - STOCKS ET PRÉVISIONS
// ================================================================

// 🚀 Les besoins sont maintenant stockés en BDD dans la table linen_needs

let stocksActuels = {};
let derniereSimulation = null; // Stocke les résultats de la dernière simulation
let gites = []; // Cache des gîtes
let besoinsCache = {}; // Cache des besoins par gite_id (quantités)
let besoinsMetaCache = {}; // Cache des besoins par gite_id (liste complète)

function getBesoinKeys(giteId) {
    return (besoinsMetaCache[giteId] || []).map(b => b.item_key);
}

function getBesoinLabelMap() {
    const labels = {};
    Object.values(besoinsMetaCache).forEach(list => {
        (list || []).forEach(b => {
            labels[b.item_key] = b.item_label;
        });
    });
    return labels;
}

function getAllBesoinKeys() {
    const set = new Set();
    Object.values(besoinsMetaCache).forEach(list => {
        (list || []).forEach(b => set.add(b.item_key));
    });
    return Array.from(set);
}

// ================================================================
// UTILITAIRES
// ================================================================

// Charger les besoins d'un gîte depuis la BDD
async function chargerBesoinsGite(giteId) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return {};
        
        const { data: besoins, error } = await window.supabaseClient
            .from('linen_needs')
            .select('*')
            .eq('gite_id', giteId)
            .eq('owner_user_id', user.id);
        
        if (error) throw error;
        
        // Convertir en objet { item_key: quantity }
        const result = {};
        (besoins || []).forEach(besoin => {
            result[besoin.item_key] = besoin.quantity;
        });
        
        besoinsCache[giteId] = result;
        besoinsMetaCache[giteId] = besoins || [];
        return result;
    } catch (error) {
        console.error('Erreur chargement besoins:', error);
        return {};
    }
}

// Recharger tous les besoins de tous les gîtes
async function rechargerTousLesBesoins() {
    for (const gite of gites) {
        await chargerBesoinsGite(gite.id);
    }
}

// ================================================================
// GÉNÉRATION DYNAMIQUE DU HTML
// ================================================================

async function genererHTMLBesoins() {
    const container = document.getElementById('besoins-container');
    if (!container) return;
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        
        // Charger tous les besoins depuis la table linen_needs
        const { data: besoins, error } = await window.supabaseClient
            .from('linen_needs')
            .select('*')
            .eq('owner_user_id', user.id)
            .order('is_custom', { ascending: true })
            .order('item_key', { ascending: true });
        
        if (error) throw error;
        
        const colors = [
            '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
        ];
        
        let html = '';
        for (let i = 0; i < gites.length; i++) {
            const gite = gites[i];
            const color = colors[i % colors.length];
            
            // Filtrer les besoins de ce gîte
            const besoinsGite = (besoins || []).filter(b => b.gite_id === gite.id);
            
            // Calculer le total des items
            const totalItems = besoinsGite.reduce((sum, b) => sum + (b.quantity || 0), 0);
            
            // Stocker les données dans un attribut data pour pouvoir annuler
            const dataJson = JSON.stringify(besoinsGite)
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            
            html += `
                <div class="card-neo-bordered card-neo-bordered-flex" style="border-color: ${color};" 
                     id="gite-besoins-${gite.id}" 
                     data-gite-besoins='${dataJson}'>
                    <!-- En-tête avec nom et infos -->
                    <div style="margin-bottom: 15px;">
                        <h3 class="section-subtitle">
                            🏠 ${gite.name}
                        </h3>
                        <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                            ${besoinsGite.length} types d'items • ${totalItems} pièces
                        </p>
                    </div>
                    
                    <!-- Boutons d'action sous le titre -->
                    <div id="actions-${gite.id}" style="margin-bottom: 15px;">
                        <button onclick="editerBesoins('${gite.id}')" 
                                class="btn-neo-hover" style="background: ${color}; color: white; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Éditer
                        </button>
                    </div>
                    
                    <!-- Liste des besoins -->
                    <div id="besoins-list-${gite.id}" style="display: none;">
                        <!-- Contenu masqué par défaut -->
                    </div>
                </div>
            `;
        }
        
        window.SecurityUtils.setInnerHTML(container, html);
        
    } catch (error) {
        console.error('Erreur chargement besoins:', error);
    }
}

function genererHTMLStocks() {
    const container = document.getElementById('stocks-container');
    if (!container) return;
    
    const colors = [
        '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
    ];
    
    let html = '';
    for (let i = 0; i < gites.length; i++) {
        const gite = gites[i];
        const slug = gite.slug;
        const color = colors[i % colors.length];
        const besoinsMeta = besoinsMetaCache[gite.id] || [];

        html += `
            <div style="background: var(--card); border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 0; flex: 1; min-width: 200px;">
                <!-- Header avec titre -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: ${color}; border-radius: 9px 9px 0 0;">
                    <h3 style="margin: 0; font-size: 1rem; color: white; font-weight: 700; text-transform: uppercase;">
                        🏠 ${gite.name}
                    </h3>
                </div>
                
                <!-- Liste des stocks -->
                <div style="padding: 15px;">
                    ${besoinsMeta.length === 0 ? `
                        <div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 10px;">
                            Aucun type de linge configuré
                        </div>
                    ` : `
                        <div style="display: grid; gap: 12px;">
                            ${besoinsMeta.map(besoin => `
                                <div>
                                    <label class="form-label-small">${besoin.item_label}</label>
                                    <input type="number" id="stock-${slug}-${besoin.item_key}" min="0" class="form-input-stock" value="0">
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    
    window.SecurityUtils.setInnerHTML(container, html);
}

// ================================================================
// SAUVEGARDE ET GESTION DE LA CONFIGURATION
// ================================================================

// Compteur pour générer des IDs uniques
let customItemCounter = 0;

function editerBesoins(giteId) {
    const container = document.getElementById(`besoins-list-${giteId}`);
    const actionsDiv = document.getElementById(`actions-${giteId}`);
    const giteDiv = document.getElementById(`gite-besoins-${giteId}`);
    
    if (!container || !actionsDiv || !giteDiv) return;
    
    const besoins = JSON.parse(
        giteDiv.getAttribute('data-gite-besoins')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
    );
    
    // Afficher le conteneur
    container.style.display = 'block';
    
    let html = '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 2px solid #dee2e6; margin-top: 15px;">';
    html += '<h4 style="margin: 0 0 15px 0; font-size: 0.9rem; color: var(--text); font-weight: 600; text-transform: uppercase;">📝 Configuration des besoins</h4>';
    html += '<div style="display: grid; gap: 10px;">';
    
    // Tous les besoins (standards + customs)
    besoins.forEach(besoin => {
        const bgColor = besoin.is_custom ? '#fff3cd' : 'white';
        const customBadge = besoin.is_custom ? '<span style="background: #f39c12; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 8px;">CUSTOM</span>' : '';
        const deleteBtn = besoin.is_custom ? `
            <button onclick="supprimerItemPersonnalise('${giteId}', '${besoin.id}')"
                    style="background: #e74c3c; color: white; border: 2px solid #2D3436; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-weight: 700; box-shadow: 2px 2px 0 #2D3436;"
                    title="Supprimer">
                <svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        ` : '';
        
        html += `
            <div style="display: grid; grid-template-columns: 2fr 100px ${besoin.is_custom ? '60px' : ''}; gap: 10px; align-items: center; background: ${bgColor}; padding: 10px; border-radius: 6px; border: 2px solid #dee2e6;" data-besoin-id="${besoin.id}">
                <div>
                    <input type="text" 
                           id="besoin-label-${giteId}-${besoin.id}" 
                           value="${besoin.item_label}"
                           style="width: 100%; padding: 8px 12px; border: 2px solid #2D3436; border-radius: 6px; font-size: 0.9rem; font-weight: 600;"
                           placeholder="Nom de l'item">
                    ${customBadge}
                </div>
                <input type="number" 
                       id="besoin-value-${giteId}-${besoin.id}" 
                       value="${besoin.quantity}"
                       min="0"
                       style="padding: 8px 12px; border: 2px solid #2D3436; border-radius: 6px; font-size: 0.9rem; text-align: center; font-weight: 700;"
                       placeholder="Qté">
                ${deleteBtn}
            </div>
        `;
    });
    
    html += '</div></div>';
    
    window.SecurityUtils.setInnerHTML(container, html);
    
    // Changer les boutons d'action
    actionsDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <button onclick="ajouterItemPersonnalise('${giteId}')" 
                    style="background: #f39c12; color: white; border: 2px solid #2D3436; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;"
                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                <svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter
            </button>
            <button onclick="sauvegarderBesoinsGite('${giteId}')" 
                    style="background: #27ae60; color: white; border: 2px solid #2D3436; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;"
                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                <svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Sauvegarder
            </button>
            <button onclick="annulerEditionBesoins('${giteId}')" 
                    style="background: var(--card); color: var(--text); border: 2px solid #2D3436; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;"
                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                <svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Annuler
            </button>
        </div>
    `;
}

function annulerEditionBesoins(giteId) {
    genererHTMLBesoins();
}

async function sauvegarderBesoinsGite(giteId) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            alert('❌ Vous devez être connecté');
            return;
        }
        
        const container = document.getElementById(`besoins-list-${giteId}`);
        if (!container) return;
        
        // Récupérer tous les items modifiés
        const items = container.querySelectorAll('[data-besoin-id]');
        const updates = [];
        
        for (const item of items) {
            const besoinId = item.getAttribute('data-besoin-id');
            const labelInput = document.getElementById(`besoin-label-${giteId}-${besoinId}`);
            const valueInput = document.getElementById(`besoin-value-${giteId}-${besoinId}`);
            
            if (labelInput && valueInput) {
                updates.push({
                    id: besoinId,
                    item_label: labelInput.value.trim(),
                    quantity: parseInt(valueInput.value) || 0
                });
            }
        }
        
        // Mettre à jour chaque besoin en BDD
        for (const update of updates) {
            const { error } = await window.supabaseClient
                .from('linen_needs')
                .update({
                    item_label: update.item_label,
                    quantity: update.quantity
                })
                .eq('id', update.id)
                .eq('owner_user_id', user.id);
            
            if (error) throw error;
        }
        
        alert('✅ Configuration sauvegardée');
        
        // Régénérer l'affichage
        await genererHTMLBesoins();
        
    } catch (error) {
        console.error('Erreur sauvegarde besoins:', error);
        alert('❌ Erreur : ' + error.message);
    }
}

async function ajouterItemPersonnalise(giteId) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            alert('❌ Vous devez être connecté');
            return;
        }
        
        // Créer un nouvel item en BDD
        customItemCounter++;
        const newItemKey = `custom_item_${Date.now()}_${customItemCounter}`;
        
        const { data: newItem, error } = await window.supabaseClient
            .from('linen_needs')
            .insert({
                owner_user_id: user.id,
                gite_id: giteId,
                item_key: newItemKey,
                item_label: 'Nouvel item',
                quantity: 0,
                is_custom: true
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // Ajouter visuellement
        const container = document.getElementById(`besoins-list-${giteId}`);
        if (!container) return;
        
        const div = document.createElement('div');
        div.setAttribute('data-besoin-id', newItem.id);
        div.style.display = 'grid';
        div.style.gridTemplateColumns = '1fr auto auto';
        div.style.gap = '8px';
        div.style.alignItems = 'center';
        
        div.innerHTML = `
            <input type="text" 
                   id="besoin-label-${giteId}-${newItem.id}" 
                   value="Nouvel item"
                   style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; background: #fff9e6;"
                   placeholder="Nom de l'item">
            <input type="number" 
                   id="besoin-value-${giteId}-${newItem.id}" 
                   value="0"
                   min="0"
                   style="width: 80px; padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; text-align: center; background: #fff9e6;"
                   placeholder="Qté">
            <button onclick="supprimerItemPersonnalise('${giteId}', '${newItem.id}')"
                    style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; width: 30px; display: flex; align-items: center; justify-content: center;"
                    title="Supprimer">
                <svg style="width:14px;height:14px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;
        
        const gridContainer = container.querySelector('[style*="display: grid"]');
        if (gridContainer) {
            gridContainer.appendChild(div);
        } else {
            container.appendChild(div);
        }
        
        // Focus sur le champ nom
        document.getElementById(`besoin-label-${giteId}-${newItem.id}`).focus();

        // Rafraîchir les caches et les stocks
        await chargerBesoinsGite(giteId);
        genererHTMLStocks();
        await chargerStocks();
        
    } catch (error) {
        console.error('Erreur ajout item:', error);
        alert('❌ Erreur : ' + error.message);
    }
}

async function supprimerItemPersonnalise(giteId, besoinId) {
    if (!confirm('Supprimer cet item personnalisé ?')) return;
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            alert('❌ Vous devez être connecté');
            return;
        }
        
        // Récupérer l'item_key avant suppression
        const { data: besoin, error: besoinError } = await window.supabaseClient
            .from('linen_needs')
            .select('item_key')
            .eq('id', besoinId)
            .eq('owner_user_id', user.id)
            .single();

        if (besoinError) throw besoinError;

        // Supprimer le besoin
        const { error } = await window.supabaseClient
            .from('linen_needs')
            .delete()
            .eq('id', besoinId)
            .eq('owner_user_id', user.id);

        if (error) throw error;

        // Supprimer le stock associé
        if (besoin?.item_key) {
            await window.supabaseClient
                .from('linen_stock_items')
                .delete()
                .eq('owner_user_id', user.id)
                .eq('gite_id', giteId)
                .eq('item_key', besoin.item_key);
        }
        
        // Supprimer visuellement
        const container = document.getElementById(`besoins-list-${giteId}`);
        if (container) {
            const item = container.querySelector(`[data-besoin-id="${besoinId}"]`);
            if (item) item.remove();
        }

        // Rafraîchir les caches et les stocks
        await chargerBesoinsGite(giteId);
        genererHTMLStocks();
        await chargerStocks();
        
    } catch (error) {
        console.error('Erreur suppression item:', error);
        alert('❌ Erreur : ' + error.message);
    }
}

// ================================================================
// INITIALISATION
// ================================================================

async function initialiserBesoinsStandards() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        
        // Items standards à créer pour chaque gîte s'ils n'existent pas
        const itemsStandards = [
            { key: 'draps_plats_grands', label: 'Draps plats grands', quantity: 0 },
            { key: 'draps_plats_petits', label: 'Draps plats petits', quantity: 0 },
            { key: 'housses_couettes_grandes', label: 'Housses de couette grandes', quantity: 0 },
            { key: 'housses_couettes_petites', label: 'Housses de couette petites', quantity: 0 },
            { key: 'taies_oreillers', label: 'Taies d\'oreillers', quantity: 0 },
            { key: 'serviettes', label: 'Serviettes', quantity: 0 },
            { key: 'tapis_bain', label: 'Tapis de bain', quantity: 0 }
        ];
        
        for (const gite of gites) {
            // Vérifier si le gîte a déjà des besoins configurés
            const { data: existing, error: checkError } = await window.supabaseClient
                .from('linen_needs')
                .select('item_key')
                .eq('gite_id', gite.id)
                .eq('owner_user_id', user.id);
            
            if (checkError) {
                console.error('Erreur vérification besoins:', checkError);
                continue;
            }
            
            // Créer les items standards manquants
            const existingKeys = (existing || []).map(item => item.item_key);
            const toCreate = itemsStandards.filter(item => !existingKeys.includes(item.key));
            
            if (toCreate.length > 0) {
                const inserts = toCreate.map(item => ({
                    owner_user_id: user.id,
                    gite_id: gite.id,
                    item_key: item.key,
                    item_label: item.label,
                    quantity: item.quantity,
                    is_custom: false
                }));
                
                const { error: insertError } = await window.supabaseClient
                    .from('linen_needs')
                    .insert(inserts);
                
                if (insertError) {
                    console.error('Erreur création besoins standards:', insertError);
                }
            }
        }
    } catch (error) {
        console.error('Erreur initialisation besoins standards:', error);
    }
}

// ================================================================
// DÉCRÉMENTATION AUTOMATIQUE DU STOCK APRÈS SORTIE
// ================================================================

async function decrementerStockReservationsTerminees() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;
        
        const aujourdhui = new Date().toISOString().split('T')[0];
        
        // Récupérer uniquement les réservations qui partent AUJOURD'HUI
        const { data: reservationsTerminees, error: errorResa } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('owner_user_id', user.id)
            .eq('check_out', aujourdhui)
            .order('check_out', { ascending: true });
        
        if (errorResa) {
            console.error('Erreur récupération réservations terminées:', errorResa);
            return;
        }
        
        if (!reservationsTerminees || reservationsTerminees.length === 0) {
            console.log('✅ Aucune réservation terminée à traiter');
            return;
        }
        
        // Récupérer les réservations déjà traitées
        const { data: dejaTraitees, error: errorTransac } = await window.supabaseClient
            .from('linen_stock_transactions')
            .select('reservation_id')
            .eq('owner_user_id', user.id);
        
        // Si la table n'existe pas encore, ignorer et continuer (première exécution)
        if (errorTransac) {
            console.warn('⚠️ Table linen_stock_transactions non trouvée. Exécutez le fichier SQL: sql/create_linen_stock_transactions.sql');
            return;
        }
        
        const idsTraites = new Set((dejaTraitees || []).map(t => t.reservation_id));
        
        // Filtrer les réservations non encore traitées
        const aTraiter = reservationsTerminees.filter(r => !idsTraites.has(r.id));
        
        if (aTraiter.length === 0) {
            console.log('✅ Toutes les réservations terminées ont déjà été traitées');
            return;
        }
        
        console.log(`📉 ${aTraiter.length} réservation(s) à traiter pour décrémentation du stock`);
        
        // Préparer les données pour la modal
        const modifications = [];
        
        // Traiter chaque réservation
        for (const reservation of aTraiter) {
            const giteId = reservation.gite_id;
            const gite = gites.find(g => g.id === giteId);
            const besoins = besoinsCache[giteId] || {};
            const keys = getBesoinKeys(giteId);
            const labels = getBesoinLabelMap();
            
            if (keys.length === 0) continue;
            
            const stockAvant = {};
            const stockApres = {};
            
            // Décrémenter le stock pour chaque item
            for (const key of keys) {
                const quantite = besoins[key] || 0;
                if (quantite <= 0) continue;
                
                // Récupérer le stock actuel
                const { data: stockActuel } = await window.supabaseClient
                    .from('linen_stock_items')
                    .select('quantity')
                    .eq('owner_user_id', user.id)
                    .eq('gite_id', giteId)
                    .eq('item_key', key)
                    .single();
                
                const quantiteActuelle = stockActuel?.quantity || 0;
                stockAvant[key] = quantiteActuelle;
                
                const nouvelleQuantite = Math.max(0, quantiteActuelle - quantite);
                stockApres[key] = nouvelleQuantite;
                
                // Mettre à jour le stock (upsert)
                await window.supabaseClient
                    .from('linen_stock_items')
                    .upsert({
                        owner_user_id: user.id,
                        gite_id: giteId,
                        item_key: key,
                        quantity: nouvelleQuantite
                    }, {
                        onConflict: 'owner_user_id,gite_id,item_key'
                    });
            }
            
            // Ajouter aux modifications
            modifications.push({
                giteName: gite?.name || 'Gîte inconnu',
                reservationId: reservation.id,
                checkOut: reservation.check_out,
                stockAvant,
                stockApres,
                keys,
                labels
            });
            
            // Marquer la réservation comme traitée
            await window.supabaseClient
                .from('linen_stock_transactions')
                .insert({
                    owner_user_id: user.id,
                    reservation_id: reservation.id,
                    gite_id: giteId
                });
            
            console.log(`✅ Stock décrémenté pour réservation ${reservation.id}`);
        }
        
        // Afficher la modal récapitulative si des modifications ont été faites
        if (modifications.length > 0) {
            afficherModalDecrementationStock(modifications);
        }
        
        console.log('✅ Décrémentation du stock terminée');
        
    } catch (error) {
        console.error('Erreur décrémentation stock:', error);
    }
}

// ================================================================
// MODAL DE VISUALISATION DÉCRÉMENTATION STOCK
// ================================================================

function afficherModalDecrementationStock(modifications) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    let html = `
        <div style="background: var(--card); border-radius: 16px; max-width: 800px; max-height: 90vh; overflow-y: auto; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="background: #f5576c; color: white; padding: 20px 30px; border-radius: 16px 16px 0 0; position: sticky; top: 0; z-index: 1;">
                <h2 style="margin: 0; font-size: 1.3rem; font-weight: 700;">📉 Décrémentation automatique du stock</h2>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">Départs du jour traités</p>
            </div>
            <div style="padding: 30px;">
    `;
    
    modifications.forEach((modif, index) => {
        const dateFormatee = new Date(modif.checkOut).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        
        html += `
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: ${index < modifications.length - 1 ? '20px' : '0'}; border: 2px solid #e0e0e0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #f5576c; font-size: 1.1rem; font-weight: 700;">🏠 ${modif.giteName}</h3>
                    <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">Départ: ${dateFormatee}</span>
                </div>
                
                <div style="display: grid; gap: 10px;">
        `;
        
        modif.keys.forEach(key => {
            const avant = modif.stockAvant[key] || 0;
            const apres = modif.stockApres[key] || 0;
            const difference = avant - apres;
            
            if (difference > 0) {
                html += `
                    <div style="display: grid; grid-template-columns: 1fr auto auto auto; gap: 15px; align-items: center; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
                        <div style="font-weight: 600; color: var(--text);">${modif.labels[key] || key}</div>
                        <div style="text-align: center; padding: 5px 12px; background: #e3f2fd; border-radius: 6px; font-weight: 600; color: #1976d2; font-size: 0.9rem;">
                            Avant: ${avant}
                        </div>
                        <div style="text-align: center; color: #f5576c; font-weight: 700; font-size: 1.1rem;">
                            -${difference}
                        </div>
                        <div style="text-align: center; padding: 5px 12px; background: #fff3cd; border-radius: 6px; font-weight: 600; color: #856404; font-size: 0.9rem;">
                            Après: ${apres}
                        </div>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div style="background: #f8f9fa; padding: 20px 30px; border-radius: 0 0 16px 16px; display: flex; justify-content: flex-end; border-top: 2px solid #e0e0e0;">
                <button onclick="this.closest('.modal').remove()" style="background: #667eea; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                    Fermer
                </button>
            </div>
        </div>
    `;
    
    modal.className = 'modal';
    modal.innerHTML = html;
    
    // Fermer en cliquant sur le fond
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

async function initDraps() {
    // Charger les gîtes
    gites = await window.gitesManager.getAll();
    
    // Initialiser les besoins standards si nécessaire
    await initialiserBesoinsStandards();
    
    // Générer le HTML dynamiquement
    await genererHTMLBesoins();
    
    // Initialiser stocksActuels pour chaque gîte
    gites.forEach(g => {
        stocksActuels[g.id] = {};
    });
    
    // Charger les besoins de tous les gîtes
    await rechargerTousLesBesoins();
    
    // Générer les stocks après chargement des besoins
    genererHTMLStocks();
    
    await chargerStocks();
    
    // Décrémenter automatiquement le stock pour les réservations terminées
    await decrementerStockReservationsTerminees();
    
    // Recharger les stocks après décrémentation
    await chargerStocks();
    
    await analyserReservations();
    
    // Initialiser le select des gîtes pour "À emmener"
    initialiserSelectGites();
    
    // Attacher l'événement au bouton Calculer (celui après #date-simulation)
    const dateInput = document.getElementById('date-simulation');
    if (dateInput && dateInput.nextElementSibling) {
        const btnCalculer = dateInput.nextElementSibling;
        
        btnCalculer.addEventListener('click', function(e) {
            e.preventDefault();
            simulerBesoins();
        });
    }
}

window.initDraps = initDraps;

// ================================================================
// CHARGEMENT DES STOCKS
// ================================================================

async function chargerStocks() {
    try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Utilisateur non connecté');

        // Charger les stocks dynamiques avec filtre RLS
        const { data, error } = await window.supabaseClient
            .from('linen_stock_items')
            .select('gite_id, item_key, quantity')
            .eq('owner_user_id', user.id);

        if (error) {
            // Si erreur réseau au chargement initial, ignorer silencieusement
            if (error.message?.includes('Failed to fetch')) {
                return; // Pas encore prêt
            }
            console.error('Erreur Supabase chargerStocks:', error);
            throw new Error(`Erreur chargement stocks: ${error.message}`);
        }

        (data || []).forEach(item => {
            if (!stocksActuels[item.gite_id]) {
                stocksActuels[item.gite_id] = {};
            }
            stocksActuels[item.gite_id][item.item_key] = item.quantity || 0;
        });

        // Remplir les champs selon les besoins configurés
        gites.forEach(gite => {
            const giteSlug = gite.slug;
            const besoinsMeta = besoinsMetaCache[gite.id] || [];
            besoinsMeta.forEach(besoin => {
                const element = document.getElementById(`stock-${giteSlug}-${besoin.item_key}`);
                if (element) {
                    element.value = stocksActuels[gite.id]?.[besoin.item_key] || 0;
                }
            });
        });
    } catch (error) {
        // Ignorer les erreurs de fetch initial (Supabase pas encore prêt)
        if (!error.message?.includes('Failed to fetch')) {
            console.error('Erreur chargement stocks:', error);
            alert(`❌ Erreur lors du chargement des stocks: ${error.message}`);
        }
    }
}

// ================================================================
// SAUVEGARDE DES STOCKS
// ================================================================

async function sauvegarderStocks() {
    try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Utilisateur non connecté');

        for (const gite of gites) {
            const slug = gite.slug;
            const besoinsMeta = besoinsMetaCache[gite.id] || [];

            if (besoinsMeta.length === 0) continue;

            const stockItems = besoinsMeta.map(besoin => ({
                owner_user_id: user.id,
                gite_id: gite.id,
                item_key: besoin.item_key,
                quantity: parseInt(document.getElementById(`stock-${slug}-${besoin.item_key}`)?.value) || 0,
                updated_at: new Date().toISOString()
            }));

            const { error } = await window.supabaseClient
                .from('linen_stock_items')
                .upsert(stockItems, { onConflict: 'gite_id,item_key' });

            if (error) {
                console.error('Erreur Supabase sauvegarderStocks:', error);
                throw new Error(`Erreur sauvegarde stocks: ${error.message}`);
            }
        }

        alert('✅ Stocks sauvegardés avec succès !');
        
        // Recharger et recalculer
        await chargerStocks();
        await analyserReservations();
    } catch (error) {
        console.error('Erreur sauvegarde stocks:', error);
        alert(`❌ Erreur lors de la sauvegarde: ${error.message}`);
    }
}

window.sauvegarderStocks = sauvegarderStocks;

// ================================================================
// ANALYSE DES RÉSERVATIONS
// ================================================================

async function analyserReservations() {
    try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Utilisateur non connecté');

        // Récupérer les réservations futures avec filtre RLS
        const today = new Date().toISOString().split('T')[0];
        const { data: reservations, error } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('owner_user_id', user.id)
            .gte('check_in', today)
            .order('check_in', { ascending: true });

        if (error) {
            console.error('Erreur Supabase analyserReservations:', error);
            throw new Error(`Erreur analyse réservations: ${error.message}`);
        }

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
        // Ne pas afficher d'alert ici pour ne pas gêner l'utilisateur au chargement
    }
}

function calculerReservationsCouvertes(resaParGite) {
    const container = document.getElementById('reservations-couvertes');
    let html = '';
    const infosCouverture = {};
    
    const colors = [
        '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
    ];

    for (let i = 0; i < gites.length; i++) {
        const gite = gites[i];
        const color = colors[i % colors.length];
        const stock = stocksActuels[gite.id] || {};
        const besoins = besoinsCache[gite.id] || {};
        const keys = getBesoinKeys(gite.id);
        
        // ✅ Déclarer reservations AVANT de l'utiliser
        const reservations = resaParGite[gite.id] || [];

        let nbReservations = 0;
        if (keys.length > 0) {
            const ratios = keys.map(key => {
                const needQty = besoins[key] || 0;
                if (needQty <= 0) return Infinity;
                return Math.floor((stock[key] || 0) / needQty);
            });

            const minRatio = Math.min(...ratios);
            nbReservations = Number.isFinite(minRatio) ? minRatio : reservations.length;
        }
        
        // Trouver jusqu'à quelle date on peut tenir
        let dateJusqua = null;
        let messageDate = '';
        
        if (nbReservations > 0 && reservations.length > 0) {
            const indexDerniere = Math.min(nbReservations - 1, reservations.length - 1);
            const derniereResa = reservations[indexDerniere];
            if (derniereResa && derniereResa.check_out) {
                dateJusqua = new Date(derniereResa.check_out);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                messageDate = `📅 ${dateJusqua.toLocaleDateString('fr-FR', options)}`;
            }
        }
        
        const isSuccess = nbReservations >= reservations.length && keys.length > 0;
        const isWarning = nbReservations >= Math.ceil(reservations.length / 2) && keys.length > 0;
        const isDanger = keys.length === 0 || nbReservations === 0;
        
        const statusBg = isSuccess ? '#d4edda' : isWarning ? '#fff3cd' : '#f8d7da';
        const statusText = isSuccess ? '#155724' : isWarning ? '#856404' : '#721c24';
        const statusIcon = isSuccess ? '✅' : isDanger ? '❌' : '⚠️';
        const statusMsg = keys.length === 0 ?
            'Configurer besoins' :
            (isSuccess ?
                'Stock suffisant' :
                (isDanger ? 'Stock insuffisant' : `${nbReservations}/${reservations.length} résa`));
        
        // Stocker les infos de couverture
        infosCouverture[gite.id] = {
            nbReservationsCouvertes: nbReservations,
            totalReservations: reservations.length,
            dateLimite: dateJusqua,
            reservations: reservations,
            gite: gite
        };
        
        html += `
            <div style="background: var(--card); border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 15px; flex: 1; min-width: 180px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${color}; border-radius: 8px; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 0.95rem; color: white; font-weight: 700; text-transform: uppercase;">
                        🏠 ${gite.name}
                    </h4>
                </div>
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--text);">${nbReservations}</div>
                    <div class="text-muted-small">
                        sur ${reservations.length} réservation${reservations.length > 1 ? 's' : ''}
                    </div>
                </div>
                <div style="background: ${statusBg}; border: 2px solid ${color}; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 0.85rem; font-weight: 600; color: ${statusText};">
                        ${statusIcon} ${statusMsg}
                    </div>
                    ${messageDate ? `<div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">${messageDate}</div>` : ''}
                </div>
            </div>
        `;
    }

    const containerCouverture = document.getElementById('reservations-couvertes');
    if (containerCouverture) {
        window.SecurityUtils.setInnerHTML(containerCouverture, html);
    }
    return infosCouverture;
}

function calculerAEmmener(resaParGite, infosCouverture) {
    const container = document.getElementById('a-emmener');
    if (!container) return;
    
    // Ne plus afficher automatiquement tous les gîtes
    // L'utilisateur doit sélectionner un gîte et une date
    const html = `
        <div style="background: var(--card); border: 2px dashed var(--calou-border); border-radius: 12px; padding: 2rem; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">📦</div>
            <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">
                Sélectionnez un gîte et une date pour calculer ce qu'il faut emmener
            </p>
        </div>
    `;
    
    window.SecurityUtils.setInnerHTML(container, html);
}

// ================================================================
// NOUVEAU CALCUL : CE QU'IL FAUT EMMENER (MANQUE RÉEL)
// ================================================================

let giteSelectionne = null;

function initialiserSelectGites() {
    const container = document.getElementById('boutons-gites-emmener');
    if (!container) return;
    
    container.innerHTML = '';
    
    const colors = [
        '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
    ];
    
    // Créer un bouton pour chaque gîte
    gites.forEach((gite, index) => {
        const color = colors[index % colors.length];
        const btn = document.createElement('button');
        btn.textContent = gite.name;
        btn.setAttribute('data-gite-id', gite.id);
        btn.style.cssText = `
            padding: 0.5rem 1rem;
            border: 2px solid ${color};
            background: var(--card);
            color: ${color};
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s;
        `;
        
        btn.addEventListener('click', function() {
            // Désélectionner tous les boutons
            container.querySelectorAll('button').forEach(b => {
                const btnColor = b.style.borderColor;
                b.style.background = 'var(--card)';
                b.style.color = btnColor;
            });
            
            // Sélectionner ce bouton
            btn.style.background = color;
            btn.style.color = 'white';
            giteSelectionne = gite.id;
            
            // Calculer automatiquement
            calculerManquePourGite();
        });
        
        container.appendChild(btn);
    });
    
    // Définir la date par défaut à +1 mois
    const dateInput = document.getElementById('date-limite-emmener');
    if (dateInput) {
        const dateDefaut = new Date();
        dateDefaut.setMonth(dateDefaut.getMonth() + 1);
        dateInput.valueAsDate = dateDefaut;
        
        // Recalculer si on change la date et qu'un gîte est sélectionné
        dateInput.addEventListener('change', function() {
            if (giteSelectionne) {
                calculerManquePourGite();
            }
        });
    }
}

async function calculerManquePourGite() {
    const dateInput = document.getElementById('date-limite-emmener');
    const container = document.getElementById('a-emmener');
    
    if (!dateInput || !container) return;
    
    const giteId = giteSelectionne;
    const dateLimite = dateInput.value;
    
    if (!giteId) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">👆 Sélectionnez un gîte ci-dessus</p>';
        return;
    }
    
    if (!dateLimite) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">📅 Veuillez sélectionner une date limite</p>';
        return;
    }
    
    // Récupérer le gîte
    const gite = gites.find(g => g.id === giteId);
    if (!gite) return;
    
    // Date d'aujourd'hui au format ISO
    const aujourdhui = new Date().toISOString().split('T')[0];
    
    // Récupérer les réservations qui SE TERMINENT entre AUJOURD'HUI et la date limite
    // Car c'est au check-out qu'on doit changer les draps
    try {
        const { data: reservations, error } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('gite_id', giteId)
            .gte('check_out', aujourdhui)
            .lte('check_out', dateLimite)
            .order('check_out', { ascending: true });
        
        if (error) throw error;
        
        const nbReservations = reservations?.length || 0;
        const besoins = besoinsCache[giteId] || {};
        const stock = stocksActuels[giteId] || {};
        const keys = getBesoinKeys(giteId);
        const labels = getBesoinLabelMap();
        
        if (keys.length === 0) {
            container.innerHTML = `
                <div style="background: var(--card); border: 3px solid #667eea; border-radius: 12px; padding: 2rem; text-align: center;">
                    <p style="color: var(--text-secondary);">⚙️ Veuillez d'abord configurer les besoins standards pour ${gite.name}</p>
                </div>
            `;
            return;
        }
        
        if (nbReservations === 0) {
            container.innerHTML = `
                <div style="background: var(--card); border: 3px solid #27AE60; border-radius: 12px; padding: 2rem; text-align: center;">
                    <h4 style="color: #27AE60; margin: 0 0 0.5rem 0;">✅ Aucune réservation</h4>
                    <p style="color: var(--text-secondary); margin: 0;">Pas de linge à emmener pour ${gite.name} jusqu'au ${new Date(dateLimite).toLocaleDateString('fr-FR')}</p>
                </div>
            `;
            return;
        }
        
        // CALCUL SIMPLE : 
        // Nombre de réservations = nombre de check-out avant la date
        // Chaque check-out = 1 changement de draps nécessaire
        const besoinsTotal = {};
        const manque = {};
        let totalManque = 0;
        
        keys.forEach(key => {
            // Besoin total = besoin unitaire × nombre de réservations (sorties)
            besoinsTotal[key] = (besoins[key] || 0) * nbReservations;
            // Ce qui manque = ce qu'il faut - ce qu'on a en stock
            manque[key] = Math.max(0, besoinsTotal[key] - (stock[key] || 0));
            totalManque += manque[key];
        });
        
        const dateFormatee = new Date(dateLimite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        
        if (totalManque === 0) {
            container.innerHTML = `
                <div style="background: var(--card); border: 3px solid #27AE60; border-radius: 12px; padding: 2rem; text-align: center;">
                    <h4 style="color: #27AE60; margin: 0 0 0.5rem 0;">✅ Stock suffisant</h4>
                    <p style="color: var(--text-secondary); margin: 0;">Aucun linge à emmener pour ${gite.name}</p>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">${nbReservations} réservation${nbReservations > 1 ? 's' : ''} jusqu'au ${dateFormatee}</p>
                </div>
            `;
            return;
        }
        
        // Afficher ce qui manque
        let html = `
            <div style="background: var(--card); border: 3px solid #f5576c; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f5576c; border-radius: 8px; margin-bottom: 1rem;">
                    <h4 style="margin: 0; font-size: 1rem; color: white; font-weight: 700; text-transform: uppercase;">
                        🏠 ${gite.name}
                    </h4>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--text);">${nbReservations} réservation${nbReservations > 1 ? 's' : ''}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">jusqu'au ${dateFormatee}</div>
                </div>
                
                <div style="background: #fff3cd; border: 2px solid #f5576c; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h5 style="margin: 0 0 0.75rem 0; color: #856404; font-size: 0.95rem; font-weight: 700;">
                        📦 À emmener au gîte :
                    </h5>
                    <ul style="font-size: 0.875rem; line-height: 1.8; margin: 0; padding-left: 1.5rem; color: var(--text);">
        `;
        
        keys.forEach(key => {
            if (manque[key] > 0) {
                html += `<li><strong>${manque[key]}</strong> ${(labels[key] || key).toLowerCase()}</li>`;
            }
        });
        
        html += `
                    </ul>
                </div>
                
                <div style="background: #e3f2fd; border-radius: 8px; padding: 1rem; font-size: 0.8rem;">
                    <div style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>Détail du calcul :</strong></div>
        `;
        
        keys.forEach(key => {
            if (manque[key] > 0) {
                const besoinUnitaire = besoins[key] || 0;
                html += `
                    <div style="margin-bottom: 0.5rem; color: var(--text-secondary);">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${(labels[key] || key)} :</div>
                        <div style="padding-left: 1rem; font-size: 0.75rem;">
                            ${besoinUnitaire} par réservation × ${nbReservations} réservation${nbReservations > 1 ? 's' : ''} = ${besoinsTotal[key]} nécessaire<br>
                            ${besoinsTotal[key]} nécessaire - ${stock[key] || 0} en stock = <strong style="color: #f5576c;">${manque[key]} manquant</strong>
                        </div>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
        
        window.SecurityUtils.setInnerHTML(container, html);
        
    } catch (error) {
        console.error('Erreur calcul manque:', error);
        container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">❌ Erreur lors du calcul</p>';
    }
}

// Exposer les fonctions globalement
window.calculerManquePourGite = calculerManquePourGite;
window.initialiserSelectGites = initialiserSelectGites;

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
        
        // Utiliser les gîtes dynamiques au lieu de hardcoding
        for (const gite of gites) {
            const infos = infosCouverture[gite.id];
            
            // Vérifier si on va manquer de stock dans une semaine
            if (infos && infos.dateLimite && infos.dateLimite <= uneSemaneFuture) {
                // Calculer les besoins pour les 3 prochaines semaines
                const reservations3Semaines = resaParGite[gite.id]?.filter(r => {
                    const dateDebut = new Date(r.check_in);
                    return dateDebut >= today && dateDebut <= troisSemainesFuture;
                }) || [];
                
                if (reservations3Semaines.length > 0) {
                    const besoins = besoinsCache[gite.id] || {};
                    const stock = stocksActuels[gite.id] || {};
                    const keys = getBesoinKeys(gite.id);
                    const labels = getBesoinLabelMap();

                    if (keys.length === 0) {
                        continue;
                    }
                    
                    // Calculer ce qu'il faut commander
                    const necessaire = {};
                    const aCommander = {};
                    keys.forEach(key => {
                        necessaire[key] = (besoins[key] || 0) * reservations3Semaines.length;
                        aCommander[key] = Math.max(0, necessaire[key] - (stock[key] || 0));
                    });
                    
                    // Construire le détail de la commande
                    const details = [];
                    keys.forEach(key => {
                        if (aCommander[key] > 0) {
                            details.push(`${aCommander[key]} ${(labels[key] || key).toLowerCase()}`);
                        }
                    });
                    
                    if (details.length > 0) {
                        const dateFormatee = troisSemainesFuture.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
                        
                        const description = `⚠️ Stock insuffisant pour les 3 prochaines semaines (jusqu'au ${dateFormatee}).\n\n🛒 À commander :\n${details.map(d => `• ${d}`).join('\n')}\n\nℹ️ ${reservations3Semaines.length} réservation(s) prévue(s) pour ${gite.name}.`;
                        
                        // Vérifier si une tâche similaire existe déjà (non complétée, créée récemment)
                        const deuxJoursAvant = new Date(today);
                        deuxJoursAvant.setDate(deuxJoursAvant.getDate() - 2);
                        
                        const { data: { user } } = await window.supabaseClient.auth.getUser();
                        if (!user) throw new Error('Utilisateur non connecté');
                        
                        const { data: tachesExistantes, error: errorTodos } = await window.supabaseClient
                            .from('todos')
                            .select('*')
                            .eq('owner_user_id', user.id)
                            .eq('category', 'achats')
                            .eq('gite_id', gite.id)
                            .eq('completed', false)
                            .ilike('title', '%Commander draps%')
                            .gte('created_at', deuxJoursAvant.toISOString());
                        
                        // Si la table n'existe pas, ignorer silencieusement (pas d'erreur console)
                        if (errorTodos) {
                            if (errorTodos?.code === '42P01' || errorTodos?.code === 'PGRST204') {
                                // Table inexistante - normal, on ignore
                                return;
                            }
                            console.warn('⚠️ Erreur table todos:', errorTodos.message);
                            return;
                        }
                        
                        // Créer la tâche seulement si elle n'existe pas déjà
                        if (!tachesExistantes || tachesExistantes.length === 0) {
                            const { error: insertError } = await window.supabaseClient
                                .from('todos')
                                .insert({
                                    owner_user_id: user.id,
                                    gite_id: gite.id,
                                    category: 'achats',
                                    title: `🛏️ Commander draps pour ${gite.name}`,
                                    description: description,
                                    completed: false
                                });
                            
                            if (insertError) {
                                console.warn('⚠️ Erreur insertion todo (table peut-être inexistante)');
                            }
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
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Utilisateur non connecté');

        const today = new Date().toISOString().split('T')[0];
        console.log('📊 Requête Supabase de', today, 'à', dateLimit);
        
        // Compter les réservations qui SE TERMINENT (check_out) dans la période
        // Car c'est au check-out qu'on doit changer les draps
        const { data: reservations, error } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('owner_user_id', user.id)
            .gte('check_out', today)
            .lte('check_out', dateLimit)
            .order('check_out', { ascending: true });

        if (error) {
            console.error('Erreur Supabase simulerBesoins:', error);
            throw new Error(`Erreur simulation: ${error.message}`);
        }
        
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
    
    // Calculer les totaux globaux tous gîtes confondus
    const labels = getBesoinLabelMap();
    const itemsStandard = getAllBesoinKeys();
    
    const totauxGlobaux = {};
    
    itemsStandard.forEach(key => {
        totauxGlobaux[key] = { necessaire: 0, stock: 0, aCommander: 0 };
    });
    
    // Calculer pour chaque gîte et agréger
    let totalReservations = 0;
    
    for (const gite of gites) {
        const resas = resaParGite[gite.id] || [];
        totalReservations += resas.length;
        const besoins = besoinsCache[gite.id] || {};
        const stock = stocksActuels[gite.id] || {};
        
        itemsStandard.forEach(key => {
            const necessaire = (besoins[key] || 0) * resas.length;
            const stockActuel = stock[key] || 0;
            const aCommander = Math.max(0, necessaire - stockActuel);
            
            totauxGlobaux[key].necessaire += necessaire;
            totauxGlobaux[key].stock += stockActuel;
            totauxGlobaux[key].aCommander += aCommander;
        });
    }
    
    const totalArticlesACommander = Object.values(totauxGlobaux)
        .reduce((sum, item) => sum + item.aCommander, 0);
    
    const dateFormatee = new Date(dateLimit).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Afficher uniquement le résumé global
    const statusBg = totalArticlesACommander === 0 ? '#d4edda' : '#fff3cd';
    const statusText = totalArticlesACommander === 0 ? '#155724' : '#856404';
    const statusIcon = totalArticlesACommander === 0 ? '✅' : '⚠️';
    const statusMsg = totalArticlesACommander === 0 ? 'Stock suffisant pour toute la période' : `${totalArticlesACommander} articles à commander`;
    
    let html = `
        <div style="background: var(--card); border: 3px solid #E67E22; border-radius: 16px; box-shadow: 4px 4px 0 #2D3436; padding: 2rem; max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 2.5rem; font-weight: 700; color: var(--text); margin-bottom: 0.5rem;">${totalReservations}</div>
                <div style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 0.5rem;">réservation${totalReservations > 1 ? 's' : ''} totale${totalReservations > 1 ? 's' : ''}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">jusqu'au ${dateFormatee}</div>
            </div>
            
            <div style="background: ${statusBg}; border: 3px solid #E67E22; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; text-align: center;">
                <div style="font-size: 1.1rem; font-weight: 700; color: ${statusText};">
                    ${statusIcon} ${statusMsg}
                </div>
            </div>
    `;
    
    if (totalArticlesACommander > 0) {
        html += `
            <div style="background: #f8f9fa; border-radius: 12px; padding: 1.5rem;">
                <h4 style="margin: 0 0 1rem 0; color: var(--text); font-size: 1.1rem; font-weight: 700;">📦 Besoins totaux sur la période :</h4>
                <div style="display: grid; gap: 0.75rem;">
        `;
        
        itemsStandard.forEach(key => {
            if (totauxGlobaux[key].aCommander > 0) {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 8px; border: 2px solid #e0e0e0;">
                        <span style="font-weight: 600; color: var(--text);">${labels[key] || key}</span>
                        <div style="text-align: right; font-size: 0.875rem; color: var(--text-secondary);">
                            <div><strong style="color: #E67E22; font-size: 1.1rem;">${totauxGlobaux[key].aCommander}</strong> à commander</div>
                            <div style="font-size: 0.75rem; margin-top: 0.25rem;">${totauxGlobaux[key].necessaire} nécessaire - ${totauxGlobaux[key].stock} en stock</div>
                        </div>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="background: #e8f5e9; border-radius: 12px; padding: 2rem; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <div style="font-size: 1.2rem; font-weight: 700; color: #2e7d32; margin-bottom: 0.5rem;">Excellent !</div>
                <div style="color: var(--text-secondary);">Vous avez suffisamment de stock pour couvrir toutes les réservations de la période.</div>
            </div>
        `;
    }
    
    html += `</div>`;
    
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
        const besoins = besoinsCache[gite.id] || {};
        const stock = stocksActuels[gite.id] || {};
        
        if (!resas || resas.length === 0) {
            html += `<div class="stat-box">
                <h4>🏠 ${gite.name}</h4>
                <p style="color: var(--text-secondary); font-size: 13px;">Aucune réservation dans la simulation</p>
            </div>`;
            return;
        }
        
        // Calculer pour chaque type de linge (dynamique)
        const itemsStandard = getBesoinKeys(gite.id);
        
        const totalNecessaire = {};
        const aEmmener = {};
        
        itemsStandard.forEach(key => {
            totalNecessaire[key] = (besoins[key] || 0) * resas.length;
            aEmmener[key] = Math.max(0, totalNecessaire[key] - (stock[key] || 0));
        });
        
        const totalAEmmener = Object.values(aEmmener).reduce((a, b) => a + b, 0);
        const dateFormatee = new Date(dateLimit).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const keys = getBesoinKeys(gite.id);
        const labels = getBesoinLabelMap();

        html += `
            <div class="stat-box">
                <h4>🏠 ${gite.name}</h4>
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 10px;">
                    ${resas.length} réservations jusqu'au ${dateFormatee}
                </p>
                ${totalAEmmener > 0 ? `
                    <div class="list-items" style="text-align: left;">
                        ${keys.map(key =>
                            aEmmener[key] > 0 ? `<div>• ${(labels[key] || key)}: <strong>${aEmmener[key]}</strong></div>` : ''
                        ).join('')}
                    </div>
                ` : `
                    <div style="color: #27AE60; font-weight: 600; margin-top: 10px;">✅ Stock suffisant</div>
                `}
            </div>
        `;
    }

    window.SecurityUtils.setInnerHTML(container, html);
}
