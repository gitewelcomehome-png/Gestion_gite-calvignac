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
                <div style="background: white; border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 20px; flex: 1; min-width: 200px; transition: all 0.2s;" 
                     id="gite-besoins-${gite.id}" 
                     data-gite-besoins='${dataJson}'>
                    <!-- En-tête avec nom et infos -->
                    <div style="margin-bottom: 15px;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: #2D3436; font-weight: 700; text-transform: uppercase;">
                            🏠 ${gite.name}
                        </h3>
                        <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #666;">
                            ${besoinsGite.length} types d'items • ${totalItems} pièces
                        </p>
                    </div>
                    
                    <!-- Boutons d'action sous le titre -->
                    <div id="actions-${gite.id}" style="margin-bottom: 15px;">
                        <button onclick="editerBesoins('${gite.id}')" 
                                style="background: ${color}; color: white; border: 2px solid #2D3436; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s; width: 100%;"
                                onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                                onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                            ✏️ Éditer
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
            <div style="background: white; border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 0; flex: 1; min-width: 200px;">
                <!-- Header avec titre -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: ${color}; border-radius: 9px 9px 0 0;">
                    <h3 style="margin: 0; font-size: 1rem; color: white; font-weight: 700; text-transform: uppercase;">
                        🏠 ${gite.name}
                    </h3>
                </div>
                
                <!-- Liste des stocks -->
                <div style="padding: 15px;">
                    ${besoinsMeta.length === 0 ? `
                        <div style="text-align: center; color: #666; font-size: 0.85rem; padding: 10px;">
                            Aucun type de linge configuré
                        </div>
                    ` : `
                        <div style="display: grid; gap: 12px;">
                            ${besoinsMeta.map(besoin => `
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2D3436; font-size: 0.8rem;">${besoin.item_label}</label>
                                    <input type="number" id="stock-${slug}-${besoin.item_key}" min="0" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700; text-align: center; font-size: 0.95rem;" value="0">
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
    html += '<h4 style="margin: 0 0 15px 0; font-size: 0.9rem; color: #2D3436; font-weight: 600; text-transform: uppercase;">📝 Configuration des besoins</h4>';
    html += '<div style="display: grid; gap: 10px;">';
    
    // Tous les besoins (standards + customs)
    besoins.forEach(besoin => {
        const bgColor = besoin.is_custom ? '#fff3cd' : 'white';
        const customBadge = besoin.is_custom ? '<span style="background: #f39c12; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 8px;">CUSTOM</span>' : '';
        const deleteBtn = besoin.is_custom ? `
            <button onclick="supprimerItemPersonnalise('${giteId}', '${besoin.id}')"
                    style="background: #e74c3c; color: white; border: 2px solid #2D3436; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-weight: 700; box-shadow: 2px 2px 0 #2D3436;"
                    title="Supprimer">
                🗑️
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
                    style="background: #f39c12; color: white; border: 2px solid #2D3436; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s; width: 100%;"
                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                ➕ Ajouter
            </button>
            <button onclick="sauvegarderBesoinsGite('${giteId}')" 
                    style="background: #27ae60; color: white; border: 2px solid #2D3436; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s; width: 100%;"
                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                💾 Sauvegarder
            </button>
            <button onclick="annulerEditionBesoins('${giteId}')" 
                    style="background: white; color: #2D3436; border: 2px solid #2D3436; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s; width: 100%;"
                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                ✖️ Annuler
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
                    style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; width: 30px;"
                    title="Supprimer">
                ✕
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
    await analyserReservations();
    
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
            <div style="background: white; border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 15px; flex: 1; min-width: 180px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${color}; border-radius: 8px; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 0.95rem; color: white; font-weight: 700; text-transform: uppercase;">
                        🏠 ${gite.name}
                    </h4>
                </div>
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 2rem; font-weight: 700; color: #2D3436;">${nbReservations}</div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">
                        sur ${reservations.length} réservation${reservations.length > 1 ? 's' : ''}
                    </div>
                </div>
                <div style="background: ${statusBg}; border: 2px solid ${color}; border-radius: 8px; padding: 10px; text-align: center;">
                    <div style="font-size: 0.85rem; font-weight: 600; color: ${statusText};">
                        ${statusIcon} ${statusMsg}
                    </div>
                    ${messageDate ? `<div style="margin-top: 8px; font-size: 0.75rem; color: #666; font-weight: 600;">${messageDate}</div>` : ''}
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
    let html = '';
    
    const colors = [
        '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
    ];

    for (let i = 0; i < gites.length; i++) {
        const gite = gites[i];
        const color = colors[i % colors.length];
        const infos = infosCouverture[gite.id];
        const besoins = besoinsCache[gite.id] || {};
        const keys = getBesoinKeys(gite.id);
        const labels = getBesoinLabelMap();
        
        if (!infos || infos.nbReservationsCouvertes === 0 || infos.reservations.length === 0 || keys.length === 0) {
            html += `
                <div style="background: white; border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 15px; flex: 1; min-width: 180px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${color}; border-radius: 8px; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 0.95rem; color: white; font-weight: 700; text-transform: uppercase;">
                            🏠 ${gite.name}
                        </h4>
                    </div>
                    <p style="color: #666; font-size: 0.85rem; text-align: center; padding: 20px 0;">
                        ${keys.length === 0 ? 'Configurer les besoins' : 'Aucune réservation couverte'}
                    </p>
                </div>
            `;
            continue;
        }
        
        // Prendre toutes les réservations jusqu'à la date limite
        const nbResa = Math.min(infos.nbReservationsCouvertes, infos.reservations.length);
        const reservationsCouvertes = infos.reservations.slice(0, nbResa);
        
        const total = {};
        keys.forEach(key => {
            total[key] = (besoins[key] || 0) * nbResa;
        });
        
        const dateInfo = infos.dateLimite ? 
            ` jusqu'au ${infos.dateLimite.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : '';
        
        html += `
            <div style="background: white; border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 15px; flex: 1; min-width: 200px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${color}; border-radius: 8px; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 0.9rem; color: white; font-weight: 700; text-transform: uppercase;">
                        🏠 ${gite.name}
                    </h4>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 10px; margin-bottom: 10px; text-align: center;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: #2D3436;">${nbResa} réservation${nbResa > 1 ? 's' : ''}</div>
                    <div style="font-size: 0.75rem; color: #666; margin-top: 3px;">${dateInfo}</div>
                </div>
                <ul style="font-size: 0.8rem; line-height: 1.6; margin: 0; padding-left: 20px; color: #2D3436;">
                    ${keys.map(key => `<li><strong>${total[key] || 0}</strong> ${(labels[key] || key).toLowerCase()}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    const containerEmmener = document.getElementById('a-emmener');
    if (containerEmmener) {
        window.SecurityUtils.setInnerHTML(containerEmmener, html);
    }
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
        
        const { data: reservations, error } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('owner_user_id', user.id)
            .gte('check_in', today)
            .lte('check_in', dateLimit)
            .order('check_in', { ascending: true });

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
    
    const colors = [
        '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
    ];
    
    // Calculer les totaux globaux tous gîtes confondus
    const labels = getBesoinLabelMap();
    const itemsStandard = getAllBesoinKeys();
    
    const totauxGlobaux = {};
    
    itemsStandard.forEach(key => {
        totauxGlobaux[key] = { necessaire: 0, stock: 0, aCommander: 0 };
    });
    
    // Calculer pour chaque gîte et agréger
    let totalReservations = 0;
    let html = '';
    
    for (let i = 0; i < gites.length; i++) {
        const gite = gites[i];
        const color = colors[i % colors.length];
        const resas = resaParGite[gite.id] || [];
        totalReservations += resas.length;
        const besoins = besoinsCache[gite.id] || {};
        const stock = stocksActuels[gite.id] || {};
        
        const detailsParType = {};
        let totalACommander = 0;
        
        itemsStandard.forEach(key => {
            const necessaire = (besoins[key] || 0) * resas.length;
            const stockActuel = stock[key] || 0;
            const aCommander = Math.max(0, necessaire - stockActuel);
            
            detailsParType[key] = { necessaire, stock: stockActuel, aCommander };
            totalACommander += aCommander;
            
            totauxGlobaux[key].necessaire += necessaire;
            totauxGlobaux[key].stock += stockActuel;
            totauxGlobaux[key].aCommander += aCommander;
        });
        
        const statusBg = totalACommander === 0 ? '#d4edda' : '#fff3cd';
        const statusText = totalACommander === 0 ? '#155724' : '#856404';
        const statusIcon = totalACommander === 0 ? '✅' : '⚠️';
        const statusMsg = totalACommander === 0 ? 'Stock suffisant' : `${totalACommander} à commander`;
        
        html += `
            <div style="background: white; border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 15px; flex: 1; min-width: 220px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${color}; border-radius: 8px; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 0.95rem; color: white; font-weight: 700; text-transform: uppercase;">
                        🏠 ${gite.name}
                    </h4>
                </div>
                <div style="text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 1.8rem; font-weight: 700; color: #2D3436;">${resas.length}</div>
                    <div style="font-size: 0.75rem; color: #666; margin-top: 3px;">réservation${resas.length > 1 ? 's' : ''}</div>
                </div>
                <div style="background: ${statusBg}; border: 2px solid ${color}; border-radius: 8px; padding: 10px; text-align: center; margin-bottom: 10px;">
                    <div style="font-size: 0.85rem; font-weight: 600; color: ${statusText};">
                        ${statusIcon} ${statusMsg}
                    </div>
                </div>
                ${totalACommander > 0 ? `
                    <ul style="font-size: 0.75rem; line-height: 1.5; margin: 0; padding-left: 20px; color: #2D3436;">
                        ${itemsStandard.map(key => 
                            detailsParType[key].aCommander > 0 ? 
                            `<li><strong>${detailsParType[key].aCommander}</strong> ${(labels[key] || key).toLowerCase()}</li>` : ''
                        ).join('')}
                    </ul>
                ` : ''}
            </div>
        `;
    }
    
    const totalArticlesACommander = Object.values(totauxGlobaux)
        .reduce((sum, item) => sum + item.aCommander, 0);
    
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
                <p style="color: #666; font-size: 13px;">Aucune réservation dans la simulation</p>
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
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">
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
