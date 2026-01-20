// ================================================================
// GESTION DES DRAPS - STOCKS ET PRÉVISIONS
// ================================================================

// 🚀 Les besoins sont maintenant stockés en BDD dans la table linen_needs

let stocksActuels = {};
let derniereSimulation = null; // Stocke les résultats de la dernière simulation
let gites = []; // Cache des gîtes
let besoinsCache = {}; // Cache des besoins par gite_id

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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <h3 style="margin: 0; font-size: 1.1rem; color: #2D3436; font-weight: 700; text-transform: uppercase;">
                                🏠 ${gite.name}
                            </h3>
                            <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #666;">
                                ${besoinsGite.length} types d'items • ${totalItems} pièces
                            </p>
                        </div>
                        <div id="actions-${gite.id}">
                            <button onclick="editerBesoins('${gite.id}')" 
                                    style="background: ${color}; color: white; border: 2px solid #2D3436; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s;"
                                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                                ✏️ Éditer
                            </button>
                        </div>
                    </div>
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
                    <div style="display: grid; gap: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2D3436; font-size: 0.8rem;">Draps plats grands</label>
                            <input type="number" id="stock-${slug}-draps-grands" min="0" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700; text-align: center; font-size: 0.95rem;" value="0">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2D3436; font-size: 0.8rem;">Draps plats petits</label>
                            <input type="number" id="stock-${slug}-draps-petits" min="0" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700; text-align: center; font-size: 0.95rem;" value="0">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2D3436; font-size: 0.8rem;">Housses couette grandes</label>
                            <input type="number" id="stock-${slug}-housses-grandes" min="0" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700; text-align: center; font-size: 0.95rem;" value="0">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2D3436; font-size: 0.8rem;">Housses couette petites</label>
                            <input type="number" id="stock-${slug}-housses-petites" min="0" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700; text-align: center; font-size: 0.95rem;" value="0">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2D3436; font-size: 0.8rem;">Taies d'oreillers</label>
                            <input type="number" id="stock-${slug}-taies" min="0" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700; text-align: center; font-size: 0.95rem;" value="0">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2D3436; font-size: 0.8rem;">Serviettes</label>
                            <input type="number" id="stock-${slug}-serviettes" min="0" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700; text-align: center; font-size: 0.95rem;" value="0">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2D3436; font-size: 0.8rem;">Tapis de bain</label>
                            <input type="number" id="stock-${slug}-tapis" min="0" style="width: 100%; padding: 8px 10px; border: 2px solid #dee2e6; border-radius: 6px; font-weight: 700; text-align: center; font-size: 0.95rem;" value="0">
                        </div>
                    </div>
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
        <div style="display: flex; gap: 8px;">
            <button onclick="ajouterItemPersonnalise('${giteId}')" 
                    style="background: #f39c12; color: white; border: 2px solid #2D3436; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s;"
                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                ➕ Ajouter
            </button>
            <button onclick="sauvegarderBesoinsGite('${giteId}')" 
                    style="background: #27ae60; color: white; border: 2px solid #2D3436; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s;"
                    onmouseover="this.style.transform='translate(-2px, -2px)'; this.style.boxShadow='5px 5px 0 #2D3436'"
                    onmouseout="this.style.transform=''; this.style.boxShadow='3px 3px 0 #2D3436'">
                💾 Sauvegarder
            </button>
            <button onclick="annulerEditionBesoins('${giteId}')" 
                    style="background: white; color: #2D3436; border: 2px solid #2D3436; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 3px 3px 0 #2D3436; transition: all 0.2s;"
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
        
        // Supprimer de la BDD
        const { error } = await window.supabaseClient
            .from('linen_needs')
            .delete()
            .eq('id', besoinId)
            .eq('owner_user_id', user.id);
        
        if (error) throw error;
        
        // Supprimer visuellement
        const container = document.getElementById(`besoins-list-${giteId}`);
        if (container) {
            const item = container.querySelector(`[data-besoin-id="${besoinId}"]`);
            if (item) item.remove();
        }
        
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
    genererHTMLStocks();
    
    // Initialiser stocksActuels pour chaque gîte
    gites.forEach(g => {
        stocksActuels[g.id] = {};
    });
    
    // Charger les besoins de tous les gîtes
    await rechargerTousLesBesoins();
    
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

        // Charger les stocks avec filtre RLS
        const { data, error } = await window.supabaseClient
            .from('linen_stocks')
            .select('*')
            .eq('owner_user_id', user.id);

        if (error) {
            // Si erreur réseau au chargement initial, ignorer silencieusement
            if (error.message?.includes('Failed to fetch')) {
                return; // Pas encore prêt
            }
            console.error('Erreur Supabase chargerStocks:', error);
            throw new Error(`Erreur chargement stocks: ${error.message}`);
        }

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
            
            const stocks = {
                owner_user_id: user.id,
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
                messageDate = `📅 ${dateJusqua.toLocaleDateString('fr-FR', options)}`;
            }
        }
        
        const isSuccess = nbReservations >= reservations.length;
        const isWarning = nbReservations >= Math.ceil(reservations.length / 2);
        const isDanger = nbReservations === 0;
        
        const statusBg = isSuccess ? '#d4edda' : isWarning ? '#fff3cd' : '#f8d7da';
        const statusText = isSuccess ? '#155724' : isWarning ? '#856404' : '#721c24';
        const statusIcon = isSuccess ? '✅' : isDanger ? '❌' : '⚠️';
        const statusMsg = isSuccess ? 
            'Stock suffisant' : 
            isDanger ? 
            'Stock épuisé' :
            `${nbReservations}/${reservations.length} résa`;
        
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

    window.SecurityUtils.setInnerHTML(container, html);
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
        const besoins = gite.settings?.linen_needs || {};
        
        if (!infos || infos.nbReservationsCouvertes === 0 || infos.reservations.length === 0) {
            html += `
                <div style="background: white; border: 3px solid ${color}; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; padding: 15px; flex: 1; min-width: 180px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${color}; border-radius: 8px; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 0.95rem; color: white; font-weight: 700; text-transform: uppercase;">
                            🏠 ${gite.name}
                        </h4>
                    </div>
                    <p style="color: #666; font-size: 0.85rem; text-align: center; padding: 20px 0;">Aucune réservation couverte</p>
                </div>
            `;
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
                    <li><strong>${total.draps_plats_grands}</strong> draps plats grands</li>
                    <li><strong>${total.draps_plats_petits}</strong> draps plats petits</li>
                    <li><strong>${total.housses_couettes_grandes}</strong> housses couette grandes</li>
                    <li><strong>${total.housses_couettes_petites}</strong> housses couette petites</li>
                    <li><strong>${total.taies_oreillers}</strong> taies d'oreillers</li>
                    <li><strong>${total.serviettes}</strong> serviettes</li>
                    <li><strong>${total.tapis_bain}</strong> tapis de bain</li>
                </ul>
            </div>
        `;
    }

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
                    const besoins = gite.settings?.linen_needs || {};
                    const stock = stocksActuels[gite.id] || {};
                    
                    // Calculer ce qu'il faut commander
                    const necessaire = {
                        draps_plats_grands: (besoins.draps_plats_grands || 0) * reservations3Semaines.length,
                        draps_plats_petits: (besoins.draps_plats_petits || 0) * reservations3Semaines.length,
                        housses_couettes_grandes: (besoins.housses_couettes_grandes || 0) * reservations3Semaines.length,
                        housses_couettes_petites: (besoins.housses_couettes_petites || 0) * reservations3Semaines.length,
                        taies_oreillers: (besoins.taies_oreillers || 0) * reservations3Semaines.length,
                        serviettes: (besoins.serviettes || 0) * reservations3Semaines.length,
                        tapis_bain: (besoins.tapis_bain || 0) * reservations3Semaines.length
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
                        const dateFormatee = troisSemainesFuture.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
                        
                        const description = `⚠️ Stock insuffisant pour les 3 prochaines semaines (jusqu'au ${dateFormatee}).\n\n🛒 À commander :\n${details.map(d => `• ${d}`).join('\n')}\n\nℹ️ ${reservations3Semaines.length} réservation(s) prévue(s) pour ${gite.name}.`;
                        
                        // Vérifier si une tâche similaire existe déjà (non complétée, créée récemment)
                        const deuxJoursAvant = new Date(today);
                        deuxJoursAvant.setDate(deuxJoursAvant.getDate() - 2);
                        
                        const { data: { user } } = await window.supabaseClient.auth.getUser();
                        if (!user) throw new Error('Utilisateur non connecté');
                        
                        const { data: tachesExistantes } = await window.supabaseClient
                            .from('todos')
                            .select('*')
                            .eq('owner_user_id', user.id)
                            .eq('category', 'achats')
                            .eq('gite', gite.name)
                            .eq('completed', false)
                            .ilike('title', '%Commander draps%')
                            .gte('created_at', deuxJoursAvant.toISOString());
                        
                        // Créer la tâche seulement si elle n'existe pas déjà
                        if (!tachesExistantes || tachesExistantes.length === 0) {
                            await window.supabaseClient
                                .from('todos')
                                .insert({
                                    owner_user_id: user.id,
                                    category: 'achats',
                                    title: `🛏️ Commander draps pour ${gite.name}`,
                                    description: description,
                                    gite: gite.name,
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
    const itemsStandard = [
        'draps_plats_grands',
        'draps_plats_petits', 
        'housses_couettes_grandes',
        'housses_couettes_petites',
        'taies_oreillers',
        'serviettes',
        'tapis_bain'
    ];
    
    const labels = {
        draps_plats_grands: 'Draps plats grands',
        draps_plats_petits: 'Draps plats petits',
        housses_couettes_grandes: 'Housses couette grandes',
        housses_couettes_petites: 'Housses couette petites',
        taies_oreillers: 'Taies d\'oreillers',
        serviettes: 'Serviettes',
        tapis_bain: 'Tapis de bain'
    };
    
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
                            `<li><strong>${detailsParType[key].aCommander}</strong> ${labels[key].toLowerCase()}</li>` : ''
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
        
        // Calculer pour chaque type de linge
        const itemsStandard = [
            'draps_plats_grands',
            'draps_plats_petits',
            'housses_couettes_grandes',
            'housses_couettes_petites',
            'taies_oreillers',
            'serviettes',
            'tapis_bain'
        ];
        
        const totalNecessaire = {};
        const aEmmener = {};
        
        itemsStandard.forEach(key => {
            totalNecessaire[key] = (besoins[key] || 0) * resas.length;
            aEmmener[key] = Math.max(0, totalNecessaire[key] - (stock[key] || 0));
        });
        
        const totalAEmmener = Object.values(aEmmener).reduce((a, b) => a + b, 0);
        const dateFormatee = new Date(dateLimit).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        
        html += `
            <div class="stat-box">
                <h4>🏠 ${gite.name}</h4>
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
