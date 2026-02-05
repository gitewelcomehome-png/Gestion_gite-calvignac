// ================================================================
// 👥 GESTION CLIENTS - Admin Interface
// ================================================================

let currentUser = null;
let allClients = [];
let currentClientId = null;

// Traduction des statuts
function getStatutLabel(statut) {
    const labels = {
        'actif': 'Actif',
        'trial': 'Essai gratuit',
        'suspendu': 'Suspendu',
        'resilié': 'Résilié'
    };
    return labels[statut] || statut;
}

// ================================================================
// 🔐 AUTHENTIFICATION
// ================================================================

async function checkAuth() {
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    
    if (error || !user) {
        window.location.href = '../index.html';
        return;
    }
    
    // Vérifier que c'est un admin
    if (user.email !== 'stephanecalvignac@hotmail.fr') {
        alert('❌ Accès réservé aux administrateurs');
        window.location.href = '../index.html';
        return;
    }
    
    currentUser = user;
    loadClients();
}

// ================================================================
// 📊 CHARGEMENT CLIENTS
// ================================================================

async function loadClients() {
    try {
        const { data: clients, error } = await window.supabaseClient
            .from('cm_clients')
            .select('*')
            .order('date_inscription', { ascending: false });
        
        if (error) throw error;
        
        allClients = clients || [];
        displayClients(allClients);
        updateStats(allClients);
        
    } catch (error) {
        console.error('❌ Erreur chargement clients:', error);
        showToast('Erreur chargement des clients', 'error');
    }
}

function displayClients(clients) {
    const tbody = document.getElementById('clientsTableBody');
    
    if (!clients || clients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i data-lucide="users" style="width: 64px; height: 64px;"></i>
                    <p>Aucun client trouvé</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }
    
    tbody.innerHTML = clients.map(client => `
        <tr onclick="openClientModal('${client.id}')">
            <td>
                <div style="font-weight: 600;">${client.prenom_contact} ${client.nom_contact}</div>
            </td>
            <td>${client.email_principal}</td>
            <td>${client.nom_entreprise || '-'}</td>
            <td><span class="badge badge-${client.type_abonnement}">${client.type_abonnement}</span></td>
            <td><span class="badge badge-${client.statut}">${getStatutLabel(client.statut)}</span></td>
            <td style="font-weight: 600;">${client.montant_mensuel}€</td>
            <td>${client.nb_gites_actuels} / ${client.nb_gites_max}</td>
            <td>${new Date(client.date_inscription).toLocaleDateString('fr-FR')}</td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

function updateStats(clients) {
    const total = clients.length;
    const actifs = clients.filter(c => c.statut === 'actif').length;
    const trials = clients.filter(c => c.statut === 'trial').length;
    
    document.getElementById('totalClients').textContent = total;
    document.getElementById('activeClients').textContent = actifs;
    document.getElementById('trialClients').textContent = trials;
}

// ================================================================
// 🔍 RECHERCHE ET FILTRES
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const filterStatut = document.getElementById('filterStatut');
    const filterAbonnement = document.getElementById('filterAbonnement');
    
    searchInput?.addEventListener('input', filterClients);
    filterStatut?.addEventListener('change', filterClients);
    filterAbonnement?.addEventListener('change', filterClients);
    
    checkAuth();
});

function filterClients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statutFilter = document.getElementById('filterStatut').value;
    const abonnementFilter = document.getElementById('filterAbonnement').value;
    
    let filtered = allClients;
    
    // Recherche texte
    if (searchTerm) {
        filtered = filtered.filter(client => 
            client.nom_contact.toLowerCase().includes(searchTerm) ||
            client.prenom_contact.toLowerCase().includes(searchTerm) ||
            client.email_principal.toLowerCase().includes(searchTerm) ||
            (client.nom_entreprise && client.nom_entreprise.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filtre statut
    if (statutFilter) {
        filtered = filtered.filter(client => client.statut === statutFilter);
    }
    
    // Filtre abonnement
    if (abonnementFilter) {
        filtered = filtered.filter(client => client.type_abonnement === abonnementFilter);
    }
    
    displayClients(filtered);
}

// ================================================================
// 📋 MODAL FICHE CLIENT
// ================================================================

async function openClientModal(clientId) {
    currentClientId = clientId;
    const modal = document.getElementById('clientModal');
    modal.style.display = 'block';
    
    // Charger les données du client
    await loadClientDetails(clientId);
}

function closeClientModal() {
    const modal = document.getElementById('clientModal');
    modal.style.display = 'none';
    currentClientId = null;
}

async function loadClientDetails(clientId) {
    try {
        // Données client
        const { data: client, error: clientError } = await window.supabaseClient
            .from('cm_clients')
            .select('*')
            .eq('id', clientId)
            .single();
        
        if (clientError) throw clientError;
        
        // Mettre à jour header
        document.getElementById('modalClientName').textContent = 
            `${client.prenom_contact} ${client.nom_contact}`;
        document.getElementById('modalClientEmail').textContent = client.email_principal;
        
        // Tab Informations
        displayClientInfos(client);
        
        // Charger les autres données en parallèle
        loadAbonnements(clientId);
        loadPromotions(clientId);
        loadParrainage(clientId);
        loadActivite(clientId);
        
    } catch (error) {
        console.error('❌ Erreur chargement client:', error);
        showToast('Erreur chargement des détails', 'error');
    }
}

async function displayClientInfos(client) {
    const container = document.getElementById('clientInfoGrid');
    
    // Compter les gîtes réels
    const { data: gites } = await window.supabaseClient
        .from('gites')
        .select('id')
        .eq('owner_user_id', client.user_id);
    
    const nbGitesReels = gites?.length || 0;
    
    container.innerHTML = `
        <div class="info-card">
            <label><i data-lucide="user" style="width: 14px; height: 14px;"></i> Contact</label>
            <div class="value">${client.prenom_contact} ${client.nom_contact}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="mail" style="width: 14px; height: 14px;"></i> Email</label>
            <div class="value">${client.email_principal}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="phone" style="width: 14px; height: 14px;"></i> Téléphone</label>
            <div class="value">${client.telephone || 'Non renseigné'}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="building" style="width: 14px; height: 14px;"></i> Entreprise</label>
            <div class="value">${client.nom_entreprise || 'Non renseigné'}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> Adresse</label>
            <div class="value">${client.adresse || 'Non renseignée'}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="map" style="width: 14px; height: 14px;"></i> Ville</label>
            <div class="value">${client.code_postal || ''} ${client.ville || 'Non renseigné'}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="globe" style="width: 14px; height: 14px;"></i> Pays</label>
            <div class="value">${client.pays || 'France'}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="package" style="width: 14px; height: 14px;"></i> Abonnement</label>
            <div class="value">
                <span class="badge badge-${client.type_abonnement}">${client.type_abonnement.toUpperCase()}</span>
            </div>
        </div>
        <div class="info-card">
            <label><i data-lucide="activity" style="width: 14px; height: 14px;"></i> Statut</label>
            <div class="value">
                <span class="badge badge-${client.statut}">${getStatutLabel(client.statut)}</span>
            </div>
        </div>
        <div class="info-card">
            <label><i data-lucide="trending-up" style="width: 14px; height: 14px;"></i> MRR</label>
            <div class="value">${client.montant_mensuel}€ / mois</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="home" style="width: 14px; height: 14px;"></i> Gîtes gérés</label>
            <div class="value">${nbGitesReels} gîte${nbGitesReels > 1 ? 's' : ''}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="calendar" style="width: 14px; height: 14px;"></i> Date inscription</label>
            <div class="value">${new Date(client.date_inscription).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="clock" style="width: 14px; height: 14px;"></i> Fin abonnement</label>
            <div class="value">${client.date_fin_abonnement ? 
                new Date(client.date_fin_abonnement).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) : 'Indéterminé'}</div>
        </div>
        <div class="info-card">
            <label><i data-lucide="key" style="width: 14px; height: 14px;"></i> User ID</label>
            <div class="value" style="font-size: 12px; word-break: break-all;">${client.user_id}</div>
        </div>
        ${client.notes ? `
        <div class="info-card">
            <label><i data-lucide="file-text" style="width: 14px; height: 14px;"></i> Notes</label>
            <div class="value">${client.notes}</div>
        </div>
        ` : ''}
    `;
    
    lucide.createIcons();
}

async function loadAbonnements(clientId) {
    try {
        const { data: abonnements, error } = await window.supabaseClient
            .from('cm_subscriptions')
            .select('*')
            .eq('client_id', clientId)
            .order('date_debut', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('abonnementsContent');
        
        if (!abonnements || abonnements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="credit-card"></i>
                    <p>Aucun historique d'abonnement</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        container.innerHTML = `
            <div class="timeline">
                ${abonnements.map(sub => `
                    <div class="timeline-item">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 5px;">
                                    <span class="badge badge-${sub.type_abonnement}">${sub.type_abonnement}</span>
                                    <span class="badge badge-${sub.statut}">${sub.statut}</span>
                                </div>
                                <div style="color: #64748b; font-size: 14px;">
                                    ${new Date(sub.date_debut).toLocaleDateString('fr-FR')} 
                                    ${sub.date_fin ? '→ ' + new Date(sub.date_fin).toLocaleDateString('fr-FR') : '→ Actif'}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 700; font-size: 18px;">${sub.montant}€</div>
                                <div style="color: #64748b; font-size: 12px;">${sub.mode_paiement || 'N/A'}</div>
                            </div>
                        </div>
                        ${sub.raison_annulation ? `
                            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #dc2626; font-size: 13px;">
                                ⚠️ ${sub.raison_annulation}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur chargement abonnements:', error);
    }
}

async function loadPromotions(clientId) {
    try {
        const { data: promos, error } = await window.supabaseClient
            .from('cm_promo_usage')
            .select(`
                *,
                promo:promo_id (*)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('promotionsContent');
        
        if (!promos || promos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="tag"></i>
                    <p>Aucune promotion utilisée</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        container.innerHTML = promos.map(usage => `
            <div class="promo-card">
                <div class="promo-header">
                    <div>
                        <div style="font-weight: 600; font-size: 16px; margin-bottom: 5px;">
                            ${usage.promo.nom}
                        </div>
                        <div style="color: #64748b; font-size: 13px;">
                            Code: <strong>${usage.promo.code}</strong>
                        </div>
                    </div>
                    <span class="badge badge-${usage.statut}">${usage.statut}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div>
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 3px;">Réduction</div>
                        <div style="font-weight: 600; color: #16a34a;">-${usage.montant_reduction}€</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 3px;">CA Généré</div>
                        <div style="font-weight: 600;">${usage.ca_genere}€</div>
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                    📅 ${new Date(usage.created_at).toLocaleDateString('fr-FR')}
                </div>
            </div>
        `).join('');
        
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur chargement promotions:', error);
    }
}

async function loadParrainage(clientId) {
    try {
        // Parrainages en tant que parrain
        const { data: referrals, error: refError } = await window.supabaseClient
            .from('referrals')
            .select('*')
            .eq('referrer_id', clientId)
            .order('registered_at', { ascending: false });
        
        if (refError) throw refError;
        
        const container = document.getElementById('parrainageContent');
        
        // Récupérer les paramètres de parrainage
        const { data: settings } = await supabase
            .from('user_settings')
            .select('referral_enabled, subscription_type')
            .eq('user_id', clientId)
            .single();
        
        const referralEnabled = settings?.referral_enabled || false;
        const subscriptionType = settings?.subscription_type || 'standard';
        
        // Stats parrainage
        const total = referrals?.length || 0;
        const actifs = referrals?.filter(r => r.status === 'active' && r.is_currently_paying).length || 0;
        const enAttente = referrals?.filter(r => r.status === 'registered').length || 0;
        
        // Calculer les récompenses selon le type
        let rewardDisplay = '';
        if (subscriptionType === 'gites_france') {
            const points = actifs * 100;
            rewardDisplay = `${points} points`;
        } else {
            const discount = Math.min(actifs * 5, 100);
            rewardDisplay = `-${discount}%`;
        }
        
        container.innerHTML = `
            <!-- Configuration Parrainage -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="settings" style="width: 20px; height: 20px;"></i>
                    Configuration du parrainage
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; font-size: 13px; margin-bottom: 5px; opacity: 0.9;">
                            Statut du programme
                        </label>
                        <select id="referralEnabledSelect" 
                                onchange="updateReferralSettings('${clientId}', 'enabled', this.value)"
                                style="width: 100%; padding: 10px; border-radius: 6px; border: none; font-size: 14px;">
                            <option value="false" ${!referralEnabled ? 'selected' : ''}>❌ Désactivé</option>
                            <option value="true" ${referralEnabled ? 'selected' : ''}>✅ Activé</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 13px; margin-bottom: 5px; opacity: 0.9;">
                            Type d'abonnement
                        </label>
                        <select id="subscriptionTypeSelect" 
                                onchange="updateReferralSettings('${clientId}', 'type', this.value)"
                                style="width: 100%; padding: 10px; border-radius: 6px; border: none; font-size: 14px;">
                            <option value="standard" ${subscriptionType === 'standard' ? 'selected' : ''}>💵 Standard (réductions %)</option>
                            <option value="gites_france" ${subscriptionType === 'gites_france' ? 'selected' : ''}>🏆 Gîtes de France (points)</option>
                        </select>
                    </div>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.15); padding: 12px; border-radius: 8px; font-size: 13px;">
                    ${subscriptionType === 'gites_france' ? `
                        <strong>Mode Points :</strong> 100 points par filleul actif (max 2000 pts)<br>
                        Convertibles en crédits IA, templates, services marketplace, formations...
                    ` : `
                        <strong>Mode Réduction :</strong> -5% par filleul actif (max -100%)<br>
                        Appliqué directement sur l'abonnement mensuel
                    `}
                </div>
            </div>
            
            <!-- Stats parrainage -->
            <div class="referral-stats">
                <div class="stat-box">
                    <div class="number">${total}</div>
                    <div class="label">Parrainages total</div>
                </div>
                <div class="stat-box">
                    <div class="number">${actifs}</div>
                    <div class="label">Filleuls actifs</div>
                </div>
                <div class="stat-box">
                    <div class="number">${enAttente}</div>
                    <div class="label">En attente</div>
                </div>
                <div class="stat-box" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                    <div class="number">${rewardDisplay}</div>
                    <div class="label">Récompense actuelle</div>
                </div>
            </div>
            
            ${!referrals || referrals.length === 0 ? `
                <div class="empty-state" style="text-align: center; padding: 40px; color: #64748b;">
                    <i data-lucide="users" style="width: 48px; height: 48px; margin: 0 auto 15px; opacity: 0.3;"></i>
                    <p style="margin: 0; font-size: 15px;">Aucun filleul pour le moment</p>
                    <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.8;">
                        ${referralEnabled ? 'Le client peut partager son lien dès maintenant' : 'Activez le programme pour permettre au client de parrainer'}
                    </p>
                </div>
            ` : `
                <h3 style="margin: 25px 0 15px 0;">Filleuls parrainés</h3>
                <div class="timeline">
                    ${referrals.map(ref => {
                        const isActive = ref.status === 'active' && ref.is_currently_paying;
                        const statusLabels = {
                            'pending': 'En attente',
                            'registered': 'Inscrit',
                            'active': 'Actif',
                            'inactive': 'Inactif'
                        };
                        
                        let rewardText = '';
                        if (subscriptionType === 'gites_france') {
                            rewardText = isActive ? '+100 pts' : '0 pts';
                        } else {
                            rewardText = isActive ? '-5%' : '0%';
                        }
                        
                        return `
                        <div class="timeline-item" style="border-left: 3px solid ${isActive ? '#10b981' : '#e2e8f0'};">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <div style="font-weight: 600; font-size: 15px;">
                                        ${ref.referred_email}
                                    </div>
                                    <div style="color: #64748b; font-size: 13px; margin-top: 5px;">
                                        ${isActive ? '✅' : '❌'} ${statusLabels[ref.status] || ref.status}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 600; font-size: 16px; color: ${isActive ? '#10b981' : '#94a3b8'};">
                                        ${rewardText}
                                    </div>
                                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
                                        ${ref.registered_at ? new Date(ref.registered_at).toLocaleDateString('fr-FR') : 'Non inscrit'}
                                    </div>
                                </div>
                            </div>
                            ${ref.last_payment_at ? `
                                <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                                    💳 Dernier paiement : ${new Date(ref.last_payment_at).toLocaleDateString('fr-FR')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                    }).join('')}
                </div>
            `}
        `;
        
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur chargement parrainage:', error);
        const container = document.getElementById('parrainageContent');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin: 0 auto 15px;"></i>
                <p>Erreur lors du chargement des données de parrainage</p>
            </div>
        `;
        lucide.createIcons();
    }
}

/**
 * Mettre à jour les paramètres de parrainage
 */
async function updateReferralSettings(clientId, setting, value) {
    try {
        let updateData = {};
        
        if (setting === 'enabled') {
            updateData.referral_enabled = value === 'true';
        } else if (setting === 'type') {
            updateData.subscription_type = value;
        }
        
        // Vérifier si un enregistrement existe
        const { data: existing } = await supabase
            .from('user_settings')
            .select('id')
            .eq('user_id', clientId)
            .single();
        
        if (existing) {
            // Update
            const { error } = await supabase
                .from('user_settings')
                .update(updateData)
                .eq('user_id', clientId);
            
            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase
                .from('user_settings')
                .insert({
                    user_id: clientId,
                    ...updateData
                });
            
            if (error) throw error;
        }
        
        // Feedback visuel
        const select = event.target;
        const originalBg = select.style.background;
        select.style.background = '#10b981';
        setTimeout(() => {
            select.style.background = originalBg;
            // Recharger l'onglet
            loadParrainage(clientId);
        }, 500);
        
    } catch (error) {
        console.error('❌ Erreur mise à jour paramètres parrainage:', error);
        alert('Erreur lors de la mise à jour des paramètres');
    }
}

async function loadActivite(clientId) {
    try {
        const { data: activities, error } = await window.supabaseClient
            .from('cm_activity_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        const container = document.getElementById('activiteContent');
        
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="activity"></i>
                    <p>Aucune activité récente</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        container.innerHTML = `
            <div class="timeline">
                ${activities.map(activity => `
                    <div class="timeline-item">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <div style="font-weight: 600;">${activity.type_activite}</div>
                                ${activity.details && Object.keys(activity.details).length > 0 ? `
                                    <div style="color: #64748b; font-size: 13px; margin-top: 5px;">
                                        ${JSON.stringify(activity.details)}
                                    </div>
                                ` : ''}
                            </div>
                            <div style="font-size: 12px; color: #64748b;">
                                ${new Date(activity.created_at).toLocaleString('fr-FR')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur chargement activité:', error);
    }
}

// ================================================================
// 🎯 ACTIONS CLIENT
// ================================================================

async function sendPasswordResetEmail() {
    if (!currentClientId) return;
    
    try {
        const client = allClients.find(c => c.id === currentClientId);
        if (!client) throw new Error('Client non trouvé');
        
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(
            client.email_principal,
            {
                redirectTo: `${window.location.origin}/pages/reset-password.html`
            }
        );
        
        if (error) throw error;
        
        showToast(`✅ Email envoyé à ${client.email_principal}`, 'success');
        
        // Logger l'activité
        await window.supabaseClient
            .from('cm_activity_logs')
            .insert({
                client_id: currentClientId,
                user_id: currentUser.id,
                type_activite: 'autre',
                details: { action: 'password_reset_sent', by_admin: true }
            });
        
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        showToast('❌ Erreur envoi de l\'email', 'error');
    }
}

function editClient() {
    showToast('⚠️ Fonctionnalité à implémenter', 'warning');
}

async function suspendClient() {
    if (!currentClientId) return;
    
    const client = allClients.find(c => c.id === currentClientId);
    if (!client) return;
    
    const confirm = window.confirm(
        `Êtes-vous sûr de vouloir ${client.statut === 'suspendu' ? 'réactiver' : 'suspendre'} ce client ?`
    );
    
    if (!confirm) return;
    
    try {
        const newStatut = client.statut === 'suspendu' ? 'actif' : 'suspendu';
        
        const { error } = await window.supabaseClient
            .from('cm_clients')
            .update({ statut: newStatut })
            .eq('id', currentClientId);
        
        if (error) throw error;
        
        showToast(`✅ Client ${newStatut}`, 'success');
        
        // Recharger les données
        await loadClients();
        await loadClientDetails(currentClientId);
        
    } catch (error) {
        console.error('❌ Erreur modification statut:', error);
        showToast('❌ Erreur modification du statut', 'error');
    }
}

// ================================================================
// 🎨 NAVIGATION TABS
// ================================================================

function switchClientTab(tabName) {
    // Désactiver tous les tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer le tab sélectionné
    event.target.closest('.tab').classList.add('active');
    document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
    
    lucide.createIcons();
}

// ================================================================
// 🎨 UTILITAIRES
// ================================================================

function showToast(message, type = 'info') {
    const colors = {
        success: '#16a34a',
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#667eea'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s;
        font-weight: 600;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fermer modal en cliquant sur l'overlay
document.addEventListener('click', (e) => {
    if (e.target.id === 'clientModal') {
        closeClientModal();
    }
});
