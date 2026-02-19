/**
 * 🧹 ESPACE FEMME DE MÉNAGE
 * Interface dédiée pour la femme de ménage
 */

// Utiliser le supabase déjà configuré globalement
// (pas besoin de redéclarer)

// ================================================================
// FONCTION TOAST (NOTIFICATIONS)
// ================================================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const messageEl = document.getElementById('toastMessage');

    if (!toast || !icon || !messageEl) {
        console.warn('Toast elements not found');
        return;
    }

    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    messageEl.textContent = message;
    
    toast.style.display = 'flex';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ================================================================
// CHARGEMENT INITIAL
// ================================================================

/**
 * Peuple tous les selects de gîtes avec les données dynamiques
 */
async function peuplerSelectsGites() {
    const gites = await window.gitesManager.getVisibleGites();
    if (!gites || gites.length === 0) {
        console.error('❌ Aucun gîte trouvé pour peupler les selects');
        return;
    }
    
    // Sélecteurs à peupler
    const selectIds = [
        'tache-achats-gite',
        'tache-travaux-gite',
        'retour-gite'
    ];
    
    selectIds.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Garder l'option par défaut
        const defaultOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (defaultOption) {
            select.appendChild(defaultOption);
        }
        
        // Ajouter les gîtes
        gites.forEach(gite => {
            const option = document.createElement('option');
            option.value = gite.id;
            option.textContent = gite.name;
            select.appendChild(option);
        });
        
        // Option "Tous les gîtes" uniquement pour achats et travaux
        if (selectId !== 'retour-gite' && gites.length > 1) {
            const option = document.createElement('option');
            option.value = 'all';
            option.textContent = 'Tous les gîtes';
            select.appendChild(option);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Attendre l'initialisation de gitesManager
    if (window.gitesManager && !window.gitesManager.loaded) {
        await window.gitesManager.loadGites();
    }
    
    // Peupler les selects de gîtes dynamiquement
    await peuplerSelectsGites();
    
    await chargerInterventions();
    await chargerStocksDraps(); // Activer le chargement des stocks
    await chargerRetoursMenuge(); // Charger les retours ménage envoyés
    
    // Validation temps réel
    if (window.ValidationUtils) {
        window.ValidationUtils.attachRealtimeValidation('tache-achats-titre', 'text', { required: true });
        window.ValidationUtils.attachRealtimeValidation('tache-travaux-titre', 'text', { required: true });
        window.ValidationUtils.attachRealtimeValidation('retour-date', 'date', { required: true });
    }
    
    // Formulaires - Avec vérification de sécurité
    const formAchats = document.getElementById('form-tache-achats');
    const formTravaux = document.getElementById('form-tache-travaux');
    const formRetour = document.getElementById('form-retour-menage');
    const inputRetourDate = document.getElementById('retour-date');
    
    if (formAchats) formAchats.addEventListener('submit', creerTacheAchats);
    if (formTravaux) formTravaux.addEventListener('submit', creerTacheTravaux);
    if (formRetour) formRetour.addEventListener('submit', envoyerRetourMenage);
    if (inputRetourDate) inputRetourDate.valueAsDate = new Date();
});

// ================================================================
// INTERVENTIONS PRÉVUES
// ================================================================

async function chargerInterventions() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const troisSemaines = new Date(today);
        troisSemaines.setDate(today.getDate() + 21);
        
        // Charger les ménages des 3 prochaines semaines
        const { data: menages, error } = await window.supabaseClient
            .from('cleaning_schedule')
            .select('*')
            .gte('scheduled_date', today.toISOString().split('T')[0])
            .lte('scheduled_date', troisSemaines.toISOString().split('T')[0])
            .order('scheduled_date', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('interventions-list');
        
        if (!menages || menages.length === 0) {
            if (window.SecurityUtils) {
                window.SecurityUtils.setInnerHTML(container, `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>Aucune intervention prévue dans les 3 prochaines semaines</p>
                    </div>
                `, { trusted: true });
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>Aucune intervention prévue dans les 3 prochaines semaines</p>
                    </div>
                `;
            }
            return;
        }

        // Regrouper par semaine puis par gîte
        const semaines = {};
        menages.forEach(menage => {
            const date = new Date(menage.scheduled_date);
            const weekStart = getStartOfWeek(date);
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!semaines[weekKey]) {
                semaines[weekKey] = {
                    debut: weekStart,
                    gites: {}
                };
            }
            
            const giteId = menage.gite_id || 'unknown';
            if (!semaines[weekKey].gites[giteId]) {
                semaines[weekKey].gites[giteId] = [];
            }
            
            semaines[weekKey].gites[giteId].push(menage);
        });

        // Générer le HTML avec colonnes par gîte
        let html = '';
        const visibleGites = await window.gitesManager.getVisibleGites();
        const visibleGiteIds = visibleGites.map(g => g.id);

        Object.keys(semaines).sort().forEach(weekKey => {
            const semaine = semaines[weekKey];
            const weekEnd = new Date(semaine.debut);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const weekNumber = getWeekNumber(semaine.debut);
            const dateDebut = semaine.debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const dateFin = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            
            // Colonnes par gîte avec gitesManager - Filtrer selon abonnement
            const allGiteIds = Object.keys(semaine.gites).sort();
            
            // Ne garder que les gîtes visibles selon l'abonnement
            const giteIds = allGiteIds.filter(id => visibleGiteIds.includes(id));
            
            // Style de centrage selon le nombre de gîtes
            let bodyStyle = '';
            if (giteIds.length === 1) {
                bodyStyle = ' style="max-width: 600px; margin: 0 auto;"';
            } else if (giteIds.length === 2) {
                bodyStyle = ' style="max-width: 1000px; margin: 0 auto;"';
            }
            
            html += `
                <div class="cleaning-week-table">
                    <div class="cleaning-week-header">
                        <div class="week-number-big">📅 Semaine ${weekNumber}</div>
                        <div class="week-dates-small">${dateDebut} - ${dateFin}</div>
                    </div>
                    <div class="cleaning-week-body"${bodyStyle}>
            `;
            
            giteIds.forEach((giteId) => {
                const menagesGite = semaine.gites[giteId];
                const gite = window.gitesManager?.getById(giteId);
                const giteName = gite?.name || 'Gîte inconnu';
                const couleur = gite?.color || '#667eea';
                const giteSlug = giteName.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                html += `
                    <div class="cleaning-column" data-gite="${giteSlug}">
                        <div class="cleaning-column-header">
                            ${giteName}
                        </div>
                `;
                
                menagesGite.forEach(menage => {
                    const date = new Date(menage.scheduled_date);
                    const dateFormatee = date.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                    });
                    
                    const validated = menage.validated_by_company;
                    const itemClass = validated ? 'cleaning-item validated' : 'cleaning-item';
                    
                    html += `
                        <div class="${itemClass}">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div style="font-size: 0.95rem; font-weight: 700; color: var(--text);">${dateFormatee}</div>
                                <div class="validation-status ${validated ? 'validated' : ''}">
                                    ${validated ? '✓' : '⏳'}
                                </div>
                            </div>
                            <div style="font-size: 0.9rem; color: #636e72; margin-bottom: 5px;">
                                ⏰ ${menage.time_of_day === 'morning' ? 'Matin (7h-12h)' : 'Après-midi (12h-17h)'}
                            </div>
                            ${menage.notes ? `<div style="margin-top: 8px; padding: 8px; background: var(--card); border-radius: 6px; font-size: 0.85rem; color: var(--text-secondary);">📝 ${menage.notes}</div>` : ''}
                        </div>
                    `;
                });
                
                html += `
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        if (window.SecurityUtils) {
            window.SecurityUtils.setInnerHTML(container, html, { trusted: true });
        } else {
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Erreur chargement interventions:', error);
        const errorContainer = document.getElementById('interventions-list');
        if (window.SecurityUtils) {
            window.SecurityUtils.setInnerHTML(errorContainer, `
                <div class="alert alert-warning">
                    ⚠️ Erreur lors du chargement des interventions
                </div>
            `, { trusted: true });
        } else {
            errorContainer.innerHTML = `
                <div class="alert alert-warning">
                    ⚠️ Erreur lors du chargement des interventions
                </div>
            `;
        }
    }
}

// Fonctions utilitaires pour le calendrier
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ================================================================
// ONGLETS
// ================================================================

function switchTaskTab(tab) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    event.target.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

function switchStockTab(gite) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    event.target.classList.add('active');
    document.getElementById(`stock-${gite}`).classList.add('active');
}

// Exporter les fonctions globalement
window.switchTaskTab = switchTaskTab;
window.switchStockTab = switchStockTab;

// ================================================================
// CRÉER DES TÂCHES
// ================================================================

async function creerTacheAchats(e) {
    e.preventDefault();
    
    // Validation avec ValidationUtils
    if (window.ValidationUtils) {
        const rules = {
            'tache-achats-titre': { type: 'text', required: true }
        };
        
        const validation = window.ValidationUtils.validateForm(e.target, rules);
        if (!validation.valid) {
            console.warn('❌ Formulaire tâche achats invalide:', validation.errors);
            return;
        }
    }
    
    const titre = document.getElementById('tache-achats-titre').value;
    const giteId = document.getElementById('tache-achats-gite').value; // UUID direct
    const description = document.getElementById('tache-achats-description').value;
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Non connecté');
        
        const { error } = await window.supabaseClient
            .from('todos')
            .insert({
                owner_user_id: user.id,
                category: 'achats',
                title: titre,
                description: description || `Signalé par la femme de ménage`,
                gite_id: giteId === 'all' ? null : giteId,
                completed: false
            });

        if (error) throw error;

        alert('✅ Tâche d\'achat créée avec succès !');
        document.getElementById('form-tache-achats').reset();
    } catch (error) {
        console.error('Erreur création tâche achats:', error);
        alert('❌ Erreur lors de la création de la tâche');
    }
}

async function creerTacheTravaux(e) {
    e.preventDefault();
    
    // Validation avec ValidationUtils
    if (window.ValidationUtils) {
        const rules = {
            'tache-travaux-titre': { type: 'text', required: true }
        };
        
        const validation = window.ValidationUtils.validateForm(e.target, rules);
        if (!validation.valid) {
            console.warn('❌ Formulaire tâche travaux invalide:', validation.errors);
            return;
        }
    }
    
    const titre = document.getElementById('tache-travaux-titre').value;
    const giteId = document.getElementById('tache-travaux-gite').value; // UUID direct
    const priorite = document.getElementById('tache-travaux-priorite').value;
    const description = document.getElementById('tache-travaux-description').value;
    
    const titreComplet = priorite === 'urgente' ? `🚨 URGENT: ${titre}` : titre;
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Non connecté');
        
        const { error } = await window.supabaseClient
            .from('todos')
            .insert({
                owner_user_id: user.id,
                category: 'travaux',
                title: titreComplet,
                description: `${description}\n\n📍 Signalé par la femme de ménage`,
                gite_id: giteId === 'all' ? null : giteId,
                completed: false
            });

        if (error) throw error;

        alert('✅ Tâche de travaux créée avec succès !');
        document.getElementById('form-tache-travaux').reset();
    } catch (error) {
        console.error('Erreur création tâche travaux:', error);
        alert('❌ Erreur lors de la création de la tâche');
    }
}

// ================================================================
// STOCKS DE DRAPS
// ================================================================

let besoinsParGite = {};
let stocksParGite = {};

async function chargerStocksDraps() {
    try {
        const gites = await window.gitesManager.getVisibleGites();
        if (!gites || gites.length === 0) {
            console.error('❌ Aucun gîte pour charger les stocks');
            return;
        }

        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Non connecté');

        const { data: besoins, error: besoinsError } = await window.supabaseClient
            .from('linen_needs')
            .select('gite_id, item_key, item_label')
            .eq('owner_user_id', user.id);

        if (besoinsError) throw besoinsError;

        const { data: stocks, error: stocksError } = await window.supabaseClient
            .from('linen_stock_items')
            .select('gite_id, item_key, quantity')
            .eq('owner_user_id', user.id);

        if (stocksError) throw stocksError;

        besoinsParGite = {};
        (besoins || []).forEach(b => {
            if (!besoinsParGite[b.gite_id]) besoinsParGite[b.gite_id] = [];
            besoinsParGite[b.gite_id].push(b);
        });

        stocksParGite = {};
        (stocks || []).forEach(s => {
            if (!stocksParGite[s.gite_id]) stocksParGite[s.gite_id] = {};
            stocksParGite[s.gite_id][s.item_key] = s.quantity || 0;
        });

        // Cibler spécifiquement la section des stocks
        const stocksSection = document.getElementById('section-stocks-draps');
        if (!stocksSection) {
            console.error('❌ Section stocks-draps non trouvée');
            return;
        }
        
        const tabsContainer = stocksSection.querySelector('.tabs');
        if (!tabsContainer) {
            console.error('❌ Conteneur tabs non trouvé dans section stocks');
            return;
        }

        // Vider et reconstruire les tabs
        tabsContainer.innerHTML = '';
        
        // Créer un tab pour chaque gîte
        gites.forEach((gite, index) => {
            const button = document.createElement('button');
            button.className = 'tab' + (index === 0 ? ' active' : '');
            button.textContent = `🏠 ${gite.name}`;
            button.onclick = () => switchStockTab(gite.id);
            tabsContainer.appendChild(button);
        });

        // Supprimer les anciens contenus de tabs
        stocksSection.querySelectorAll('.tab-content').forEach(el => el.remove());

        // Créer les grilles pour chaque gîte
        gites.forEach((gite, index) => {
            const stockGite = stocksParGite[gite.id] || {};
            const besoinsGite = besoinsParGite[gite.id] || [];
            
            const tabContent = document.createElement('div');
            tabContent.id = `stock-${gite.id}`;
            tabContent.className = 'tab-content' + (index === 0 ? ' active' : '');
            
            const grid = document.createElement('div');
            grid.className = 'stock-grid';
            grid.id = `stock-grid-${gite.id}`;
            
            const button = document.createElement('button');
            button.className = 'btn btn-success';
            button.style.marginTop = '20px';
            button.textContent = `💾 Sauvegarder ${gite.name}`;
            button.onclick = () => sauvegarderStocks(gite.id);
            
            tabContent.appendChild(grid);
            tabContent.appendChild(button);
            stocksSection.appendChild(tabContent);
            
            // Afficher la grille
            afficherGrilleStock(gite.id, stockGite, besoinsGite);
        });
    } catch (error) {
        console.error('Erreur chargement stocks:', error);
    }
}

function afficherGrilleStock(giteId, stocks, besoinsGite) {
    const container = document.getElementById(`stock-grid-${giteId}`);
    if (!container) return;
    
    let html = '';

    (besoinsGite || []).forEach(article => {
        const valeur = stocks[article.item_key] || 0;
        html += `
            <div class="stock-item">
                <label for="${giteId}-${article.item_key}">${article.item_label}</label>
                <input 
                    type="number" 
                    id="${giteId}-${article.item_key}" 
                    value="${valeur}"
                    min="0"
                >
            </div>
        `;
    });

    if (window.SecurityUtils) {
        window.SecurityUtils.setInnerHTML(container, html, { trusted: true });
    } else {
        container.innerHTML = html;
    }
}

async function sauvegarderStocks(giteId) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Non connecté');
        
        const besoinsGite = besoinsParGite[giteId] || [];
        const items = besoinsGite.map(article => {
            const input = document.getElementById(`${giteId}-${article.item_key}`);
            return {
                owner_user_id: user.id,
                gite_id: giteId,
                item_key: article.item_key,
                quantity: parseInt(input?.value) || 0,
                updated_at: new Date().toISOString()
            };
        });

        const { error } = await window.supabaseClient
            .from('linen_stock_items')
            .upsert(items, {
                onConflict: 'gite_id,item_key'
            });

        if (error) throw error;

        alert('✅ Stocks enregistrés avec succès !');
    } catch (error) {
        console.error('Erreur sauvegarde stocks:', error);
        alert('❌ Erreur lors de la sauvegarde des stocks');
    }
}

// Fonction globale pour switcher entre les tabs
window.switchStockTab = function(giteId) {
    // Désactiver tous les tabs et contenus
    document.querySelectorAll('.tabs .tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer le tab cliqué
    event.target.classList.add('active');
    
    // Activer le contenu correspondant
    const content = document.getElementById(`stock-${giteId}`);
    if (content) content.classList.add('active');
};

// ================================================================
// RETOUR APRÈS MÉNAGE
// ================================================================

/**
 * Charge et affiche les retours ménage envoyés
 */
async function chargerRetoursMenuge() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Non connecté');

        // Charger les retours des 30 derniers jours
        const dateDebut = new Date();
        dateDebut.setDate(dateDebut.getDate() - 30);

        const { data: retours, error } = await window.supabaseClient
            .from('retours_menage')
            .select(`
                *,
                gites:gite_id(name)
            `)
            .eq('owner_user_id', user.id)
            .gte('date_menage', dateDebut.toISOString().split('T')[0])
            .order('date_menage', { ascending: false });

        if (error) {
            console.error('Erreur chargement retours:', error);
            throw error;
        }

        const container = document.getElementById('retours-list');
        
        if (!retours || retours.length === 0) {
            if (window.SecurityUtils) {
                window.SecurityUtils.setInnerHTML(container, `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>Aucun retour envoyé ces 30 derniers jours</p>
                    </div>
                `, { trusted: true });
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <p>Aucun retour envoyé ces 30 derniers jours</p>
                    </div>
                `;
            }
            return;
        }

        // Construire l'affichage des retours
        let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        
        retours.forEach(retour => {
            const giteName = retour.gites?.name || 'Gîte inconnu';
            const dateFormatted = new Date(retour.date_menage).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
            const statusClass = retour.validated ? 'status-validated' : 'status-pending';
            const statusText = retour.validated ? '✅ Validé' : '⏳ En attente';
            
            html += `
                <div style="border: 2px solid #2D3436; border-radius: 12px; padding: 20px; background: white; box-shadow: 2px 2px 0 #2D3436;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <div class="intervention-gite" style="font-weight: 800; color: #2D3436; font-size: 1.1rem; margin-bottom: 5px;">
                                🏠 ${window.SecurityUtils ? window.SecurityUtils.sanitizeText(giteName) : giteName}
                            </div>
                            <div class="intervention-date" style="color: #636e72; font-weight: 600;">
                                📅 ${dateFormatted}
                            </div>
                        </div>
                        <span class="intervention-status ${statusClass}">${statusText}</span>
                    </div>
                    ${retour.commentaires ? `
                        <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #667eea;">
                            <div style="font-size: 0.85rem; font-weight: 600; color: #636e72; margin-bottom: 5px;">📝 Commentaires :</div>
                            <div style="white-space: pre-wrap; font-size: 0.95rem; color: #2D3436;">${window.SecurityUtils ? window.SecurityUtils.sanitizeText(retour.commentaires) : retour.commentaires}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        if (window.SecurityUtils) {
            window.SecurityUtils.setInnerHTML(container, html, { trusted: true });
        } else {
            container.innerHTML = html;
        }

    } catch (error) {
        console.error('Erreur chargement retours ménage:', error);
        const container = document.getElementById('retours-list');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Erreur lors du chargement des retours</p>
                </div>
            `;
        }
    }
}

async function envoyerRetourMenage(e) {
    e.preventDefault();
    
    // Validation avec ValidationUtils
    if (window.ValidationUtils) {
        const rules = {
            'retour-date': { type: 'date', required: true }
        };
        
        const validation = window.ValidationUtils.validateForm(e.target, rules);
        if (!validation.valid) {
            console.warn('❌ Formulaire retour ménage invalide:', validation.errors);
            return;
        }
    }
    
    const giteId = document.getElementById('retour-gite').value; // UUID direct
    const date = document.getElementById('retour-date').value;
    const etatArrivee = document.getElementById('retour-etat-arrivee')?.value;
    const detailsEtat = document.getElementById('retour-details-etat')?.value;
    const deroulement = document.getElementById('retour-deroulement')?.value;
    const detailsDeroulement = document.getElementById('retour-details-deroulement')?.value;
    
    // Construire les commentaires depuis les champs du formulaire
    let commentaires = '';
    if (etatArrivee) commentaires += `État à l'arrivée: ${etatArrivee}\n`;
    if (detailsEtat) commentaires += `Détails état: ${detailsEtat}\n`;
    if (deroulement) commentaires += `Déroulement: ${deroulement}\n`;
    if (detailsDeroulement) commentaires += `Détails déroulement: ${detailsDeroulement}`;
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Non connecté');
        
        const { error } = await window.supabaseClient
            .from('retours_menage')
            .insert({
                owner_user_id: user.id,
                reported_by: user.id,
                gite_id: giteId,
                date_menage: date,
                commentaires: commentaires.trim() || null,
                validated: false
            });

        if (error) throw error;

        showToast('✅ Retour envoyé avec succès ! Le propriétaire sera notifié.', 'success');
        document.getElementById('form-retour-menage').reset();
        document.getElementById('retour-date').valueAsDate = new Date();
        
        // Recharger la liste des retours
        await chargerRetoursMenuge();
    } catch (error) {
        console.error('Erreur envoi retour:', error);
        showToast('❌ Erreur lors de l\'envoi du retour', 'error');
    }
}
