// ================================================================
// 🎯 GESTION PROMOTIONS - CHANNEL MANAGER
// ================================================================
// Gestion CRUD des promotions avec tracking ROI
// ================================================================

console.log('🚀 Script admin-promotions.js chargé');

// ================================================================
// ÉTAT GLOBAL
// ================================================================

let allPromotions = [];
let currentPromoId = null;

// ================================================================
// INITIALISATION
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 Initialisation page promotions');
    
    await loadPromotions();
    await loadStats();
    setupEventListeners();
    
    lucide.createIcons();
});

// ================================================================
// CHARGEMENT DONNÉES
// ================================================================

async function loadPromotions() {
    try {
        const { data: promotions, error } = await window.supabaseClient
            .from('cm_promotions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allPromotions = promotions || [];
        renderPromotions(allPromotions);
        
        console.log('✅ Promotions chargées:', allPromotions.length);
    } catch (error) {
        console.error('❌ Erreur chargement promotions:', error);
        showToast('Erreur de chargement', 'error');
    }
}

async function loadStats() {
    try {
        const dateDebut30j = new Date();
        dateDebut30j.setDate(dateDebut30j.getDate() - 30);
        
        // Récupérer stats promotions
        const { data: promotions, error: errorPromos } = await window.supabaseClient
            .from('cm_promotions')
            .select('*');
        
        if (errorPromos) throw errorPromos;
        
        // Récupérer utilisations des 30 derniers jours
        const { data: usages, error: errorUsages } = await window.supabaseClient
            .from('cm_promo_usage')
            .select('montant_reduction, ca_genere')
            .gte('created_at', dateDebut30j.toISOString());
        
        if (errorUsages) throw errorUsages;
        
        // Calculer stats
        const promosActives = promotions.filter(p => p.actif && (!p.date_fin || new Date(p.date_fin) > new Date())).length;
        const utilisations = usages?.length || 0;
        const coutTotal = usages?.reduce((sum, u) => sum + parseFloat(u.montant_reduction || 0), 0) || 0;
        const caGenere = usages?.reduce((sum, u) => sum + parseFloat(u.ca_genere || 0), 0) || 0;
        const roi = coutTotal > 0 ? ((caGenere - coutTotal) / coutTotal * 100) : 0;
        
        // Afficher stats
        document.getElementById('kpiPromosActives').textContent = promosActives;
        document.getElementById('kpiUtilisations').textContent = utilisations;
        document.getElementById('kpiCoutTotal').textContent = formatCurrency(coutTotal);
        document.getElementById('kpiCAGenere').textContent = formatCurrency(caGenere);
        document.getElementById('kpiROI').textContent = roi.toFixed(1) + '%';
        
        // Couleur ROI
        const kpiROIEl = document.getElementById('kpiROI');
        if (roi >= 100) {
            kpiROIEl.style.color = '#4caf50';
        } else if (roi >= 0) {
            kpiROIEl.style.color = '#ff9800';
        } else {
            kpiROIEl.style.color = '#f44336';
        }
        
        console.log('✅ Stats chargées:', { promosActives, utilisations, coutTotal, caGenere, roi });
    } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
    }
}

// ================================================================
// AFFICHAGE TABLEAU
// ================================================================

function renderPromotions(promotions) {
    const tbody = document.getElementById('tbodyPromotions');
    
    if (!promotions || promotions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 10px;"></i>
                    <br>Aucune promotion trouvée
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }
    
    tbody.innerHTML = promotions.map(promo => {
        const now = new Date();
        const dateFin = promo.date_fin ? new Date(promo.date_fin) : null;
        const isExpired = dateFin && dateFin < now;
        const isActive = promo.actif && !isExpired;
        
        const statutHTML = isExpired 
            ? '<span class="badge badge-secondary">Expirée</span>'
            : isActive 
                ? '<span class="badge badge-success">Active</span>'
                : '<span class="badge badge-warning">Inactive</span>';
        
        const typeLabel = {
            'pourcentage': '% Réduction',
            'montant_fixe': '€ Fixe',
            'mois_gratuits': 'Mois gratuits',
            'upgrade': 'Upgrade'
        }[promo.type_promotion] || promo.type_promotion;
        
        const valeurFormatted = promo.type_promotion === 'pourcentage' 
            ? promo.valeur + '%'
            : promo.type_promotion === 'montant_fixe'
                ? formatCurrency(promo.valeur)
                : promo.valeur + ' mois';
        
        const cibleLabel = {
            'tous': 'Tous',
            'nouveaux': 'Nouveaux',
            'existants': 'Existants',
            'churn_risk': 'Churn risk',
            'vip': 'VIP'
        }[promo.cible] || promo.cible;
        
        const dateDebutStr = new Date(promo.date_debut).toLocaleDateString('fr-FR');
        const dateFinStr = dateFin ? dateFin.toLocaleDateString('fr-FR') : 'Illimitée';
        
        const utilisations = promo.max_utilisations 
            ? `${promo.nb_utilisations} / ${promo.max_utilisations}`
            : promo.nb_utilisations;
        
        return `
            <tr>
                <td><strong>${promo.code}</strong></td>
                <td>${promo.nom}</td>
                <td><span class="badge badge-info">${typeLabel}</span></td>
                <td><strong>${valeurFormatted}</strong></td>
                <td>${cibleLabel}</td>
                <td>
                    <small>${dateDebutStr}</small><br>
                    <small>→ ${dateFinStr}</small>
                </td>
                <td>${utilisations}</td>
                <td>
                    <button class="btn-icon" onclick="showPromoStats('${promo.id}')" title="Voir stats">
                        <i data-lucide="bar-chart"></i>
                    </button>
                </td>
                <td>${statutHTML}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="editPromotion('${promo.id}')" title="Modifier">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="btn-icon" onclick="togglePromoStatus('${promo.id}', ${!promo.actif})" 
                                title="${promo.actif ? 'Désactiver' : 'Activer'}">
                            <i data-lucide="${promo.actif ? 'toggle-right' : 'toggle-left'}"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="deletePromotion('${promo.id}')" title="Supprimer">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    lucide.createIcons();
}

// ================================================================
// FILTRES
// ================================================================

function setupEventListeners() {
    // Bouton nouvelle promo
    document.getElementById('btnNewPromo').addEventListener('click', openNewPromoModal);
    
    // Fermeture modales
    document.getElementById('btnCloseModalPromo').addEventListener('click', closeModal);
    document.getElementById('btnCancelPromo').addEventListener('click', closeModal);
    document.getElementById('btnCloseModalStats').addEventListener('click', closeModalStats);
    
    // Formulaire
    document.getElementById('formPromo').addEventListener('submit', savePromotion);
    
    // Changement type promo (ajuster hint valeur)
    document.getElementById('promoType').addEventListener('change', (e) => {
        const hint = document.getElementById('promoValeurHint');
        const input = document.getElementById('promoValeur');
        
        switch(e.target.value) {
            case 'pourcentage':
                hint.textContent = 'Ex: 20 pour 20%';
                input.placeholder = '20';
                break;
            case 'montant_fixe':
                hint.textContent = 'Ex: 50 pour 50€';
                input.placeholder = '50';
                break;
            case 'mois_gratuits':
                hint.textContent = 'Ex: 1 pour 1 mois gratuit';
                input.placeholder = '1';
                break;
            case 'upgrade':
                hint.textContent = 'Durée en mois';
                input.placeholder = '3';
                break;
        }
    });
    
    // Filtres
    document.getElementById('filterStatut').addEventListener('change', applyFilters);
    document.getElementById('filterType').addEventListener('change', applyFilters);
    document.getElementById('searchPromo').addEventListener('input', applyFilters);
}

function applyFilters() {
    const statutFilter = document.getElementById('filterStatut').value;
    const typeFilter = document.getElementById('filterType').value;
    const searchTerm = document.getElementById('searchPromo').value.toLowerCase();
    
    const now = new Date();
    
    let filtered = allPromotions.filter(promo => {
        // Filtre statut
        if (statutFilter) {
            const dateFin = promo.date_fin ? new Date(promo.date_fin) : null;
            const isExpired = dateFin && dateFin < now;
            
            if (statutFilter === 'actif' && (!promo.actif || isExpired)) return false;
            if (statutFilter === 'inactif' && (promo.actif || isExpired)) return false;
            if (statutFilter === 'expiré' && !isExpired) return false;
        }
        
        // Filtre type
        if (typeFilter && promo.type_promotion !== typeFilter) return false;
        
        // Recherche
        if (searchTerm) {
            const searchableText = `${promo.code} ${promo.nom} ${promo.description || ''}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        return true;
    });
    
    renderPromotions(filtered);
}

// ================================================================
// MODAL GESTION PROMOTION
// ================================================================

function openNewPromoModal() {
    currentPromoId = null;
    document.getElementById('modalPromoTitle').innerHTML = '<i data-lucide="tag"></i> Nouvelle Promotion';
    document.getElementById('formPromo').reset();
    document.getElementById('promoActif').checked = true;
    
    // Date début = maintenant
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('promoDateDebut').value = now.toISOString().slice(0, 16);
    
    document.getElementById('modalPromo').style.display = 'flex';
    lucide.createIcons();
}

async function editPromotion(promoId) {
    currentPromoId = promoId;
    
    const promo = allPromotions.find(p => p.id === promoId);
    if (!promo) return;
    
    document.getElementById('modalPromoTitle').innerHTML = '<i data-lucide="edit-2"></i> Modifier Promotion';
    
    // Remplir formulaire
    document.getElementById('promoId').value = promo.id;
    document.getElementById('promoCode').value = promo.code;
    document.getElementById('promoNom').value = promo.nom;
    document.getElementById('promoDescription').value = promo.description || '';
    document.getElementById('promoType').value = promo.type_promotion;
    document.getElementById('promoValeur').value = promo.valeur;
    document.getElementById('promoCible').value = promo.cible || 'tous';
    
    // Segments
    const segments = promo.segment_abonnement || ['basic', 'pro', 'premium'];
    document.getElementById('segmentBasic').checked = segments.includes('basic');
    document.getElementById('segmentPro').checked = segments.includes('pro');
    document.getElementById('segmentPremium').checked = segments.includes('premium');
    
    // Dates
    const dateDebut = new Date(promo.date_debut);
    dateDebut.setMinutes(dateDebut.getMinutes() - dateDebut.getTimezoneOffset());
    document.getElementById('promoDateDebut').value = dateDebut.toISOString().slice(0, 16);
    
    if (promo.date_fin) {
        const dateFin = new Date(promo.date_fin);
        dateFin.setMinutes(dateFin.getMinutes() - dateFin.getTimezoneOffset());
        document.getElementById('promoDateFin').value = dateFin.toISOString().slice(0, 16);
    }
    
    document.getElementById('promoMaxUtilisations').value = promo.max_utilisations || '';
    document.getElementById('promoActif').checked = promo.actif;
    
    document.getElementById('modalPromo').style.display = 'flex';
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('modalPromo').style.display = 'none';
    currentPromoId = null;
}

async function savePromotion(e) {
    e.preventDefault();
    
    try {
        // Récupérer segments sélectionnés
        const segments = [];
        if (document.getElementById('segmentBasic').checked) segments.push('basic');
        if (document.getElementById('segmentPro').checked) segments.push('pro');
        if (document.getElementById('segmentPremium').checked) segments.push('premium');
        
        const promoData = {
            code: document.getElementById('promoCode').value.toUpperCase(),
            nom: document.getElementById('promoNom').value,
            description: document.getElementById('promoDescription').value || null,
            type_promotion: document.getElementById('promoType').value,
            valeur: parseFloat(document.getElementById('promoValeur').value),
            cible: document.getElementById('promoCible').value,
            segment_abonnement: segments,
            date_debut: document.getElementById('promoDateDebut').value,
            date_fin: document.getElementById('promoDateFin').value || null,
            max_utilisations: document.getElementById('promoMaxUtilisations').value 
                ? parseInt(document.getElementById('promoMaxUtilisations').value) 
                : null,
            actif: document.getElementById('promoActif').checked
        };
        
        let result;
        
        if (currentPromoId) {
            // Mise à jour
            result = await window.supabaseClient
                .from('cm_promotions')
                .update(promoData)
                .eq('id', currentPromoId);
        } else {
            // Création
            result = await window.supabaseClient
                .from('cm_promotions')
                .insert([promoData]);
        }
        
        if (result.error) throw result.error;
        
        showToast(currentPromoId ? 'Promotion modifiée' : 'Promotion créée', 'success');
        closeModal();
        await loadPromotions();
        await loadStats();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        showToast('Erreur: ' + error.message, 'error');
    }
}

// ================================================================
// ACTIONS PROMOTIONS
// ================================================================

async function togglePromoStatus(promoId, newStatus) {
    try {
        const { error } = await window.supabaseClient
            .from('cm_promotions')
            .update({ actif: newStatus })
            .eq('id', promoId);
        
        if (error) throw error;
        
        showToast(newStatus ? 'Promotion activée' : 'Promotion désactivée', 'success');
        await loadPromotions();
        await loadStats();
        
    } catch (error) {
        console.error('❌ Erreur changement statut:', error);
        showToast('Erreur', 'error');
    }
}

async function deletePromotion(promoId) {
    if (!confirm('Supprimer cette promotion ? Cette action est irréversible.')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('cm_promotions')
            .delete()
            .eq('id', promoId);
        
        if (error) throw error;
        
        showToast('Promotion supprimée', 'success');
        await loadPromotions();
        await loadStats();
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        showToast('Erreur: ' + error.message, 'error');
    }
}

// ================================================================
// MODAL STATISTIQUES
// ================================================================

async function showPromoStats(promoId) {
    try {
        const promo = allPromotions.find(p => p.id === promoId);
        if (!promo) return;
        
        document.getElementById('modalStatsTitle').innerHTML = 
            `<i data-lucide="bar-chart"></i> Stats: ${promo.code}`;
        
        // Récupérer utilisations
        const { data: usages, error } = await window.supabaseClient
            .from('cm_promo_usage')
            .select(`
                *,
                cm_clients!inner(nom_contact, prenom_contact),
                cm_subscriptions(type_abonnement)
            `)
            .eq('promo_id', promoId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Calculer stats
        const nbUtilisations = usages?.length || 0;
        const coutTotal = usages?.reduce((sum, u) => sum + parseFloat(u.montant_reduction || 0), 0) || 0;
        const caGenere = usages?.reduce((sum, u) => sum + parseFloat(u.ca_genere || 0), 0) || 0;
        const roi = coutTotal > 0 ? ((caGenere - coutTotal) / coutTotal * 100) : 0;
        
        // Afficher stats
        document.getElementById('statUtilisations').textContent = nbUtilisations;
        document.getElementById('statCout').textContent = formatCurrency(coutTotal);
        document.getElementById('statCA').textContent = formatCurrency(caGenere);
        document.getElementById('statROI').textContent = roi.toFixed(1) + '%';
        
        // Tableau utilisations
        const tbody = document.getElementById('tbodyStatsUsage');
        
        if (!usages || usages.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #999;">
                        Aucune utilisation pour le moment
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = usages.map(usage => `
                <tr>
                    <td>${new Date(usage.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>${usage.cm_clients.prenom_contact} ${usage.cm_clients.nom_contact}</td>
                    <td><span class="badge badge-info">${usage.cm_subscriptions?.type_abonnement || 'N/A'}</span></td>
                    <td><span style="color: #f44336;">-${formatCurrency(usage.montant_reduction)}</span></td>
                    <td><span style="color: #4caf50;">+${formatCurrency(usage.ca_genere)}</span></td>
                </tr>
            `).join('');
        }
        
        document.getElementById('modalStats').style.display = 'flex';
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
        showToast('Erreur chargement stats', 'error');
    }
}

function closeModalStats() {
    document.getElementById('modalStats').style.display = 'none';
}

// ================================================================
// UTILITAIRES
// ================================================================

function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

function showToast(message, type = 'info') {
    // Implémentation simple toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Rendre fonctions globales
window.editPromotion = editPromotion;
window.togglePromoStatus = togglePromoStatus;
window.deletePromotion = deletePromotion;
window.showPromoStats = showPromoStats;
