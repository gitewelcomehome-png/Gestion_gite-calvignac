// =====================================================
// GESTION ADMIN PARRAINAGE
// Interface de gestion des campagnes de parrainage
// =====================================================

let currentEditId = null;

// =====================================================
// INITIALISATION
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadGlobalStats();
        await loadCampaigns();
    } catch (error) {
        console.error('Erreur initialisation:', error);
    }
});

// =====================================================
// CHARGEMENT STATS GLOBALES
// =====================================================

async function loadGlobalStats() {
    try {
        // Nombre de campagnes actives
        const { data: activeCampaigns, error: activeError } = await window.supabaseClient
            .from('referral_campaigns')
            .select('id')
            .eq('is_active', true)
            .lte('start_date', new Date().toISOString())
            .gte('end_date', new Date().toISOString());

        if (activeError) throw activeError;

        document.getElementById('kpiActiveCampaigns').textContent = activeCampaigns?.length || 0;

        // Stats participants/filleuls/bonus
        const { data: stats, error: statsError } = await window.supabaseClient
            .from('user_campaign_participations')
            .select(`
                id,
                referrals_during_campaign,
                total_bonus_earned
            `);

        if (statsError) throw statsError;

        const totalParticipants = stats?.length || 0;
        const totalReferrals = stats?.reduce((sum, s) => sum + (s.referrals_during_campaign || 0), 0) || 0;
        const totalBonus = stats?.reduce((sum, s) => sum + (parseFloat(s.total_bonus_earned) || 0), 0) || 0;

        document.getElementById('kpiTotalParticipants').textContent = totalParticipants;
        document.getElementById('kpiTotalReferrals').textContent = totalReferrals;
        document.getElementById('kpiBonusDistributed').textContent = totalBonus.toFixed(2) + '€';

    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// =====================================================
// CHARGEMENT CAMPAGNES
// =====================================================

async function loadCampaigns() {
    try {
        const { data: campaigns, error } = await window.supabaseClient
            .from('referral_campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('campaignsContainer');

        if (!campaigns || campaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="gift" style="width: 64px; height: 64px; color: #cbd5e1;"></i>
                    <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Aucune campagne</p>
                    <p>Créez votre première campagne de parrainage pour booster l'engagement</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = campaigns.map(campaign => createCampaignCard(campaign)).join('');
        lucide.createIcons();

    } catch (error) {
        console.error('Erreur chargement campagnes:', error);
        document.getElementById('campaignsContainer').innerHTML = `
            <div class="empty-state">
                <i data-lucide="alert-circle" style="width: 64px; height: 64px; color: #ef4444;"></i>
                <p>Erreur de chargement</p>
            </div>
        `;
        lucide.createIcons();
    }
}

// =====================================================
// CRÉATION CARTE CAMPAGNE
// =====================================================

function createCampaignCard(campaign) {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    
    let status = 'expired';
    let statusText = 'Expirée';
    let statusClass = 'status-expired';
    
    if (now < startDate) {
        status = 'scheduled';
        statusText = 'Programmée';
        statusClass = 'status-scheduled';
    } else if (now >= startDate && now <= endDate && campaign.is_active) {
        if (campaign.max_uses && campaign.current_uses >= campaign.max_uses) {
            status = 'full';
            statusText = 'Complète';
            statusClass = 'status-full';
        } else {
            status = 'active';
            statusText = 'Active';
            statusClass = 'status-active';
        }
    }
    
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const occupationRate = campaign.max_uses ? 
        Math.round((campaign.current_uses / campaign.max_uses) * 100) : 0;
    
    let bonusText = '';
    switch (campaign.bonus_type) {
        case 'discount_multiplier':
            bonusText = `${campaign.discount_pct_bonus}% par filleul`;
            break;
        case 'discount_fixed':
            bonusText = `+${campaign.discount_fixed_bonus}% bonus`;
            break;
        case 'points_multiplier':
            bonusText = `x${campaign.points_multiplier} points`;
            break;
        case 'points_fixed':
            bonusText = `+${campaign.points_fixed_bonus} points`;
            break;
    }
    
    return `
        <div class="campaign-card">
            <div class="campaign-header">
                <div>
                    <div class="campaign-title">${campaign.name}</div>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 12px;">
                        ${campaign.description || 'Aucune description'}
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <span class="campaign-status ${statusClass}">
                            <i data-lucide="${status === 'active' ? 'check-circle' : 
                                           status === 'scheduled' ? 'clock' : 
                                           status === 'full' ? 'users' : 'x-circle'}" 
                               style="width: 14px; height: 14px;"></i>
                            ${statusText}
                        </span>
                        <span style="color: #64748b; font-size: 13px;">
                            <i data-lucide="tag" style="width: 14px; height: 14px;"></i>
                            ${campaign.campaign_code}
                        </span>
                        <span style="color: #64748b; font-size: 13px;">
                            <i data-lucide="gift" style="width: 14px; height: 14px;"></i>
                            ${bonusText}
                        </span>
                    </div>
                </div>
                <div>
                    <button class="btn-edit" onclick="editCampaign('${campaign.id}')">
                        <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
                        Modifier
                    </button>
                    <button class="btn-view-participants" onclick="viewParticipants('${campaign.id}', '${campaign.name.replace(/'/g, "\\'")}')">
                        <i data-lucide="users" style="width: 16px; height: 16px;"></i>
                        Voir participants
                    </button>
                    <button class="btn-delete" onclick="deleteCampaign('${campaign.id}')">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                        Supprimer
                    </button>
                </div>
            </div>
            
            <div class="campaign-stats">
                <div class="stat-item">
                    <div class="stat-label">Participants</div>
                    <div class="stat-value">${campaign.current_uses || 0}${campaign.max_uses ? ' / ' + campaign.max_uses : ''}</div>
                    ${campaign.max_uses ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${occupationRate}%"></div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">Période</div>
                    <div style="font-size: 14px; font-weight: 600; color: #1e293b;">
                        ${new Date(campaign.start_date).toLocaleDateString('fr-FR')}
                        <br>
                        ${new Date(campaign.end_date).toLocaleDateString('fr-FR')}
                    </div>
                    ${status === 'active' ? `
                        <div style="color: #64748b; font-size: 13px; margin-top: 4px;">
                            ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">Cible</div>
                    <div style="font-size: 14px; font-weight: 600; color: #1e293b;">
                        ${campaign.subscription_types?.length ? 
                            campaign.subscription_types.join(', ') : 
                            'Tous les abonnés'}
                    </div>
                    ${campaign.min_referrals > 0 ? `
                        <div style="color: #64748b; font-size: 13px;">
                            Min ${campaign.min_referrals} filleul${campaign.min_referrals > 1 ? 's' : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">État</div>
                    <div style="font-size: 14px; font-weight: 600; color: ${campaign.is_active ? '#16a34a' : '#dc2626'};">
                        ${campaign.is_active ? 'Activée' : 'Désactivée'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =====================================================
// MODAL CRÉATION/ÉDITION
// =====================================================

function openCreateModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Nouvelle Campagne';
    document.getElementById('campaignForm').reset();
    document.getElementById('bonusFields').innerHTML = '';
    document.getElementById('campaignModal').classList.add('active');
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('campaignModal').classList.remove('active');
    currentEditId = null;
}

async function editCampaign(campaignId) {
    try {
        const { data: campaign, error } = await window.supabaseClient
            .from('referral_campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (error) throw error;

        currentEditId = campaignId;
        document.getElementById('modalTitle').textContent = 'Modifier la Campagne';
        
        document.getElementById('campaignName').value = campaign.name;
        document.getElementById('campaignCode').value = campaign.campaign_code;
        document.getElementById('campaignDescription').value = campaign.description || '';
        document.getElementById('bonusType').value = campaign.bonus_type;
        
        document.getElementById('startDate').value = new Date(campaign.start_date).toISOString().slice(0, 16);
        document.getElementById('endDate').value = new Date(campaign.end_date).toISOString().slice(0, 16);
        
        document.getElementById('maxUses').value = campaign.max_uses || '';
        document.getElementById('minReferrals').value = campaign.min_referrals || 0;
        
        if (campaign.subscription_types?.length) {
            document.getElementById('subscriptionTypes').value = campaign.subscription_types[0];
        }
        
        updateBonusFields();
        
        // Remplir les champs bonus
        switch (campaign.bonus_type) {
            case 'discount_multiplier':
                document.getElementById('bonusValue').value = campaign.discount_pct_bonus;
                break;
            case 'discount_fixed':
                document.getElementById('bonusValue').value = campaign.discount_fixed_bonus;
                break;
            case 'points_multiplier':
                document.getElementById('bonusValue').value = campaign.points_multiplier;
                break;
            case 'points_fixed':
                document.getElementById('bonusValue').value = campaign.points_fixed_bonus;
                break;
        }
        
        document.getElementById('campaignModal').classList.add('active');
        lucide.createIcons();
        
    } catch (error) {
        console.error('Erreur chargement campagne:', error);
        alert('Erreur lors du chargement de la campagne');
    }
}

function updateBonusFields() {
    const bonusType = document.getElementById('bonusType').value;
    const container = document.getElementById('bonusFields');
    
    if (!bonusType) {
        container.innerHTML = '';
        return;
    }
    
    let label = '';
    let placeholder = '';
    let step = '';
    let min = '';
    
    switch (bonusType) {
        case 'discount_multiplier':
            label = 'Pourcentage de réduction par filleul (%)';
            placeholder = 'Ex: 10 pour 10% par filleul';
            step = '0.01';
            min = '0';
            break;
        case 'discount_fixed':
            label = 'Bonus de réduction fixe (%)';
            placeholder = 'Ex: 20 pour +20% fixe';
            step = '0.01';
            min = '0';
            break;
        case 'points_multiplier':
            label = 'Multiplicateur de points';
            placeholder = 'Ex: 2 pour doubler les points';
            step = '0.1';
            min = '1';
            break;
        case 'points_fixed':
            label = 'Points bonus fixes';
            placeholder = 'Ex: 500 pour +500 points';
            step = '1';
            min = '0';
            break;
    }
    
    container.innerHTML = `
        <div class="form-group">
            <label class="form-label">${label}</label>
            <input type="number" class="form-input" id="bonusValue" required 
                   placeholder="${placeholder}" step="${step}" min="${min}">
        </div>
    `;
}

// =====================================================
// SAUVEGARDE CAMPAGNE
// =====================================================

async function saveCampaign(event) {
    event.preventDefault();
    
    try {
        const bonusType = document.getElementById('bonusType').value;
        const bonusValue = parseFloat(document.getElementById('bonusValue').value);
        
        const campaignData = {
            name: document.getElementById('campaignName').value,
            campaign_code: document.getElementById('campaignCode').value.toUpperCase(),
            description: document.getElementById('campaignDescription').value,
            bonus_type: bonusType,
            start_date: new Date(document.getElementById('startDate').value).toISOString(),
            end_date: new Date(document.getElementById('endDate').value).toISOString(),
            max_uses: document.getElementById('maxUses').value ? parseInt(document.getElementById('maxUses').value) : null,
            min_referrals: parseInt(document.getElementById('minReferrals').value) || 0,
            is_active: true
        };
        
        // Ajouter le champ bonus selon le type
        switch (bonusType) {
            case 'discount_multiplier':
                campaignData.discount_pct_bonus = bonusValue;
                break;
            case 'discount_fixed':
                campaignData.discount_fixed_bonus = bonusValue;
                break;
            case 'points_multiplier':
                campaignData.points_multiplier = bonusValue;
                break;
            case 'points_fixed':
                campaignData.points_fixed_bonus = Math.round(bonusValue);
                break;
        }
        
        // Gérer subscription_types
        const subType = document.getElementById('subscriptionTypes').value;
        if (subType) {
            campaignData.subscription_types = [subType];
        }
        
        let result;
        if (currentEditId) {
            // Mise à jour
            const { data, error } = await window.supabaseClient
                .from('referral_campaigns')
                .update(campaignData)
                .eq('id', currentEditId);
                
            if (error) throw error;
            result = data;
        } else {
            // Création
            const { data, error } = await window.supabaseClient
                .from('referral_campaigns')
                .insert([campaignData]);
                
            if (error) throw error;
            result = data;
        }
        
        closeModal();
        await loadCampaigns();
        await loadGlobalStats();
        
        alert(currentEditId ? 'Campagne mise à jour !' : 'Campagne créée !');
        
    } catch (error) {
        console.error('Erreur sauvegarde campagne:', error);
        alert('Erreur : ' + error.message);
    }
}

// =====================================================
// SUPPRESSION CAMPAGNE
// =====================================================

async function deleteCampaign(campaignId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('referral_campaigns')
            .delete()
            .eq('id', campaignId);
            
        if (error) throw error;
        
        await loadCampaigns();
        await loadGlobalStats();
        
    } catch (error) {
        console.error('Erreur suppression campagne:', error);
        alert('Erreur lors de la suppression');
    }
}

// =====================================================
// FERMETURE MODAL SUR CLIC EXTÉRIEUR
// =====================================================

document.getElementById('campaignModal').addEventListener('click', (e) => {
    if (e.target.id === 'campaignModal') {
        closeModal();
    }
});

// =====================================================
// GESTION MODAL PARTICIPANTS
// =====================================================

/**
 * Afficher les participants d'une campagne
 */
async function viewParticipants(campaignId, campaignName) {
    const modal = document.getElementById('participantsModal');
    const title = document.getElementById('participantsModalTitle');
    const container = document.getElementById('participantsList');
    
    title.textContent = `Participants - ${campaignName}`;
    modal.classList.add('active');
    
    // Afficher loader
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
            <i data-lucide="loader" style="width: 32px; height: 32px; animation: spin 1s linear infinite;"></i>
            <p>Chargement des participants...</p>
        </div>
    `;
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    try {
        // Récupérer les participants avec leurs infos utilisateur
        const { data: participants, error } = await window.supabaseClient
            .from('user_campaign_participations')
            .select(`
                *,
                user:user_id (
                    id,
                    email,
                    raw_user_meta_data
                )
            `)
            .eq('campaign_id', campaignId)
            .order('enrolled_at', { ascending: false });
        
        if (error) throw error;
        
        if (!participants || participants.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #64748b;">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; opacity: 0.3;"></i>
                    <p style="margin-top: 16px;">Aucun participant pour le moment</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Afficher la liste des participants
        container.innerHTML = participants.map(p => {
            const email = p.user?.email || 'Email inconnu';
            const metadata = p.user?.raw_user_meta_data || {};
            const fullName = metadata.full_name || metadata.name || email.split('@')[0];
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const enrolledDate = new Date(p.enrolled_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="participant-item">
                    <div class="participant-avatar">${initials}</div>
                    <div class="participant-info">
                        <div class="participant-name">${fullName}</div>
                        <div class="participant-email">${email}</div>
                        <div class="participant-date">Inscrit le ${enrolledDate}</div>
                    </div>
                    ${p.is_active ? 
                        '<span style="color: #16a34a; font-size: 13px; font-weight: 600;">✓ Actif</span>' : 
                        '<span style="color: #94a3b8; font-size: 13px;">Inactif</span>'}
                </div>
            `;
        }).join('');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Erreur chargement participants:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc2626;">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px;"></i>
                <p style="margin-top: 16px;">Erreur lors du chargement des participants</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

/**
 * Fermer le modal participants
 */
function closeParticipantsModal() {
    const modal = document.getElementById('participantsModal');
    modal.classList.remove('active');
}

// Fermeture sur clic extérieur
document.getElementById('participantsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'participantsModal') {
        closeParticipantsModal();
    }
});
