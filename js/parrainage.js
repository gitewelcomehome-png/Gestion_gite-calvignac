/**
 * SYSTÈME DE PARRAINAGE LIVEOWNERUNIT
 * Gestion du programme de parrainage avec support pour 2 types d'abonnés :
 * - Abonnés classiques : réductions en %
 * - Abonnés Gîtes de France : points convertibles
 */

// Variable globale pour stocker le type d'abonné
let userSubscriptionType = 'standard'; // 'standard' ou 'gites_france'
let referralEnabled = false;

/**
 * Initialisation du système de parrainage
 */
async function initReferralSystem() {
    // console.log('🎯 Initialisation du système de parrainage');
    
    try {
        // Vérifier si le parrainage est activé
        const enabled = await checkReferralEnabled();
        
        if (!enabled) {
            document.getElementById('referral-disabled-message').style.display = 'block';
            document.getElementById('referral-content').style.display = 'none';
            return;
        }
        
        document.getElementById('referral-disabled-message').style.display = 'none';
        document.getElementById('referral-content').style.display = 'block';
        
        // Charger les données
        await loadReferralData();
        
    } catch (error) {
        console.error('❌ Erreur initialisation parrainage:', error);
        showToast('Erreur lors du chargement du parrainage', 'error');
    }
}

/**
 * Vérifier si le parrainage est activé pour l'utilisateur
 */
async function checkReferralEnabled() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        
        // Vérifier dans la configuration utilisateur
        const { data: config } = await supabase
            .from('user_settings')
            .select('referral_enabled, subscription_type')
            .eq('user_id', user.id)
            .single();
        
        if (config) {
            referralEnabled = config.referral_enabled === true;
            userSubscriptionType = config.subscription_type || 'standard';
            return referralEnabled;
        }
        
        // Par défaut, désactivé
        return false;
        
    } catch (error) {
        console.error('❌ Erreur vérification activation parrainage:', error);
        return false;
    }
}

/**
 * Charger toutes les données de parrainage
 */
async function loadReferralData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Utilisateur non connecté');
        
        // 1. Récupérer ou créer le code de parrainage
        let referralCode = await getReferralCode(user.id);
        
        if (!referralCode) {
            referralCode = await generateReferralCode();
            await saveReferralCode(user.id, referralCode);
        }
        
        // 2. Afficher le lien
        const referralLink = `${window.location.origin}/pages/login.html?ref=${referralCode}`;
        document.getElementById('referralLinkInput').value = referralLink;
        
        // 3. Générer le QR Code
        await generateQRCode(referralLink);
        
        // 4. Calculer les récompenses actuelles
        await updateCurrentRewards(user.id);
        
        // 5. Charger les statistiques
        await loadReferralStats(user.id);
        
        // 6. Charger la liste des filleuls
        await loadReferralsList(user.id);
        
        // 7. Adapter l'interface selon le type d'abonné
        adaptInterfaceForSubscriptionType();
        
        // 8. Charger les campagnes actives
        await loadActiveCampaigns(user.id);
        
        // 9. Charger les notifications (DÉSACTIVÉ - table non encore déployée en production)
        // await loadNotifications(user.id);
        
        // Initialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement données parrainage:', error);
        showToast('Erreur lors du chargement des données', 'error');
    }
}

/**
 * Générer un code de parrainage unique
 */
async function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Vérifier l'unicité
    const { data: existing } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referral_code', code)
        .single();
    
    if (existing) {
        return generateReferralCode(); // Régénérer si existe
    }
    
    return code;
}

/**
 * Récupérer le code de parrainage existant
 */
async function getReferralCode(userId) {
    const { data } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', userId)
        .limit(1)
        .single();
    
    return data?.referral_code || null;
}

/**
 * Sauvegarder le code de parrainage
 */
async function saveReferralCode(userId, code) {
    await supabase.from('referrals').insert({
        referrer_id: userId,
        referral_code: code,
        status: 'pending',
        created_at: new Date().toISOString()
    });
}

/**
 * Mettre à jour les récompenses actuelles
 */
async function updateCurrentRewards(userId) {
    try {
        // Compter les filleuls actifs avec leur taux individuel
        const { data: activeReferrals } = await supabase
            .from('referrals')
            .select('id, bonus_rate_pct, acquired_campaign_id')
            .eq('referrer_id', userId)
            .eq('status', 'active')
            .eq('is_currently_paying', true);
        
        const activeCount = activeReferrals?.length || 0;
        
        // Compter par taux
        const count10pct = activeReferrals?.filter(r => r.bonus_rate_pct >= 10).length || 0;
        const count5pct = activeReferrals?.filter(r => r.bonus_rate_pct < 10).length || 0;
        
        // Calculer la réduction totale (somme des taux individuels)
        const totalDiscount = activeReferrals?.reduce((sum, r) => sum + (r.bonus_rate_pct || 5), 0) || 0;
        const discountPct = Math.min(totalDiscount, 100);
        
        // 🎁 VÉRIFIER SI LE PARRAIN EST INSCRIT À UNE CAMPAGNE ACTIVE
        const { data: activeCampaigns } = await supabase
            .from('user_campaign_participations')
            .select(`
                *,
                campaign:campaign_id (
                    id,
                    name,
                    bonus_type,
                    discount_pct_bonus,
                    is_active,
                    start_date,
                    end_date
                )
            `)
            .eq('user_id', userId)
            .eq('is_active', true);
        
        // Filtrer les campagnes discount_multiplier en cours
        const now = new Date();
        const activeDiscountCampaign = (activeCampaigns || []).find(p => {
            const campaign = p.campaign;
            if (!campaign || !campaign.is_active || campaign.bonus_type !== 'discount_multiplier') return false;
            
            const startDate = new Date(campaign.start_date);
            const endDate = new Date(campaign.end_date);
            
            return now >= startDate && now <= endDate;
        });
        
        // Mettre à jour l'affichage selon le type d'abonné
        if (userSubscriptionType === 'gites_france') {
            // Système de points (inchangé pour l'instant)
            const points = activeCount * 100;
            document.getElementById('rewardValue').textContent = points;
            document.getElementById('rewardUnit').textContent = 'pts';
            document.getElementById('rewardLabel').textContent = 'Vos points Ambassadeur';
            document.getElementById('currentPoints').textContent = points;
            document.getElementById('priceDisplay').style.display = 'none';
            document.getElementById('pointsDisplay').style.display = 'block';
            
            // Masquer le récapitulatif abonnement et l'info box (uniquement pour Standard)
            const summarySection = document.getElementById('subscriptionSummary');
            if (summarySection) {
                summarySection.style.display = 'none';
            }
            const infoPermanentBox = document.getElementById('infoPermanentBox');
            if (infoPermanentBox) {
                infoPermanentBox.style.display = 'none';
            }
            
            const remaining = 20 - activeCount;
            if (remaining > 0) {
                document.getElementById('nextMilestone').innerHTML = 
                    `➡️ Plus que <strong>${remaining}</strong> filleul${remaining > 1 ? 's' : ''} pour atteindre 2000 points !`;
            } else {
                document.getElementById('nextMilestone').innerHTML = 
                    `🎉 <strong>Maximum atteint !</strong> Vous avez 2000 points Ambassadeur !`;
            }
            
        } else {
            // Système de réduction : SOMME des taux individuels
            const basePrice = 30.00;
            const discountAmount = (basePrice * discountPct / 100);
            const newPrice = (basePrice - discountAmount).toFixed(2);
            
            document.getElementById('rewardValue').textContent = discountPct.toFixed(0);
            document.getElementById('rewardUnit').textContent = '%';
            document.getElementById('rewardLabel').textContent = 'Votre réduction actuelle';
            document.getElementById('currentPrice').textContent = `${newPrice}€`;
            document.getElementById('priceDisplay').style.display = 'block';
            document.getElementById('pointsDisplay').style.display = 'none';
            
            // 💰 AFFICHER LE RÉCAPITULATIF DÉTAILLÉ ET L'INFO BOX
            const summarySection = document.getElementById('subscriptionSummary');
            if (summarySection) {
                summarySection.style.display = 'block';
                
                // Prix de base (toujours 30€)
                // Déjà affiché en dur dans le HTML
                
                // Ligne de réduction
                const discountLineContainer = document.getElementById('discountLineContainer');
                const discountDetailLabel = document.getElementById('discountDetailLabel');
                const discountAmountValue = document.getElementById('discountAmountValue');
                
                if (discountPct > 0) {
                    discountLineContainer.style.display = 'flex';
                    discountDetailLabel.textContent = `(-${discountPct.toFixed(0)}%)`;
                    discountAmountValue.textContent = `- ${discountAmount.toFixed(2)} €`;
                } else {
                    discountLineContainer.style.display = 'none';
                }
                
                // Prix final
                document.getElementById('finalPriceValue').textContent = `${newPrice} €`;
                
                // Détail des filleuls
                const referralsDetailBox = document.getElementById('referralsDetailBox');
                const referralsDetailContent = document.getElementById('referralsDetailContent');
                
                if (activeCount > 0) {
                    referralsDetailBox.style.display = 'block';
                    
                    let detailHTML = '';
                    if (count10pct > 0) {
                        detailHTML += `
                            <div class="detail-row campaign">
                                <span>🎁 ${count10pct} filleul${count10pct > 1 ? 's' : ''} à 10% (campagne)</span>
                                <strong>${count10pct * 10}%</strong>
                            </div>
                        `;
                    }
                    if (count5pct > 0) {
                        detailHTML += `
                            <div class="detail-row">
                                <span>👤 ${count5pct} filleul${count5pct > 1 ? 's' : ''} à 5% (standard)</span>
                                <strong>${count5pct * 5}%</strong>
                            </div>
                        `;
                    }
                    
                    detailHTML += `
                        <div class="price-divider" style="margin: 0.5rem 0;"></div>
                        <div class="detail-row" style="font-weight: 700; color: #1e293b;">
                            <span>Total</span>
                            <span style="color: #10b981;">${discountPct.toFixed(0)}%</span>
                        </div>
                    `;
                    
                    referralsDetailContent.innerHTML = detailHTML;
                } else {
                    referralsDetailBox.style.display = 'none';
                }
            }
            
            // Afficher l'info box permanente
            const infoPermanentBox = document.getElementById('infoPermanentBox');
            if (infoPermanentBox) {
                infoPermanentBox.style.display = 'flex';
            }
            
            // Message de progression avec détail des filleuls
            const remaining = 20 - activeCount;
            let progressMsg = '';
            
            // Si campagne active, afficher l'encadré info
            if (activeDiscountCampaign) {
                const campaign = activeDiscountCampaign.campaign;
                progressMsg += `
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        ✅ Campagne "${campaign.name}" active !<br>
                        <span style="font-size: 0.9em; opacity: 0.95;">Les nouveaux filleuls valent ${campaign.discount_pct_bonus}% (au lieu de 5%)</span>
                    </div>
                `;
            }
            
            // Détail des filleuls par taux
            if (count10pct > 0 || count5pct > 0) {
                progressMsg += '<div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 0.9em;">';
                progressMsg += '📊 <strong>Détail de vos filleuls actifs :</strong><br>';
                if (count10pct > 0) {
                    progressMsg += `🎁 ${count10pct} filleul${count10pct > 1 ? 's' : ''} à <strong>10%</strong> (acquis en campagne)<br>`;
                }
                if (count5pct > 0) {
                    progressMsg += `👤 ${count5pct} filleul${count5pct > 1 ? 's' : ''} à <strong>5%</strong> (standard)<br>`;
                }
                progressMsg += `<strong>Total : ${discountPct}%</strong>`;
                progressMsg += '</div>';
            }
            
            // Objectif
            if (remaining > 0) {
                progressMsg += `➡️ Plus que <strong>${remaining}</strong> filleul${remaining > 1 ? 's' : ''} pour l'abonnement GRATUIT !`;
            } else {
                progressMsg += `🎉 <strong>Félicitations !</strong> Votre abonnement est GRATUIT à vie !`;
            }
            
            document.getElementById('nextMilestone').innerHTML = progressMsg;
        }
        
        // Mettre à jour la barre de progression
        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('progressFill').style.width = `${(activeCount / 20) * 100}%`;
        
    } catch (error) {
        console.error('❌ Erreur mise à jour récompenses:', error);
    }
}

/**
 * Charger les statistiques
 */
async function loadReferralStats(userId) {
    try {
        // Invitations envoyées
        const { data: invitations } = await supabase
            .from('referral_invitations')
            .select('id')
            .eq('referrer_id', userId);
        
        document.getElementById('invitationsSent').textContent = invitations?.length || 0;
        
        // Inscriptions totales
        const { data: registrations } = await supabase
            .from('referrals')
            .select('id')
            .eq('referrer_id', userId)
            .neq('status', 'pending');
        
        document.getElementById('registrations').textContent = registrations?.length || 0;
        
        // Filleuls actifs
        const { data: actives } = await supabase
            .from('referrals')
            .select('id')
            .eq('referrer_id', userId)
            .eq('status', 'active')
            .eq('is_currently_paying', true);
        
        document.getElementById('activeReferrals').textContent = actives?.length || 0;
        
        // Économies ou points totaux selon le type
        if (userSubscriptionType === 'gites_france') {
            const totalPoints = (actives?.length || 0) * 100;
            document.getElementById('totalSaved').textContent = `${totalPoints} pts`;
            document.getElementById('savingsLabel').textContent = 'Points cumulés';
            document.getElementById('savingsIcon').innerHTML = '<i data-lucide="gem"></i>';
        } else {
            const { data: rewards } = await supabase
                .from('referral_rewards')
                .select('total_saved')
                .eq('user_id', userId);
            
            const totalSaved = rewards?.reduce((sum, r) => sum + parseFloat(r.total_saved || 0), 0) || 0;
            document.getElementById('totalSaved').textContent = `${totalSaved.toFixed(2)}€`;
            document.getElementById('savingsLabel').textContent = 'Économies totales';
            document.getElementById('savingsIcon').innerHTML = '<i data-lucide="piggy-bank"></i>';
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement statistiques:', error);
    }
}

/**
 * Charger la liste des filleuls
 */
async function loadReferralsList(userId) {
    try {
        const { data: referrals } = await supabase
            .from('referrals')
            .select(`
                id,
                referred_email,
                status,
                registered_at,
                last_payment_at,
                is_currently_paying,
                bonus_rate_pct,
                acquired_campaign_id
            `)
            .eq('referrer_id', userId)
            .neq('status', 'pending')
            .order('registered_at', { ascending: false });
        
        const listContainer = document.getElementById('referralsList');
        listContainer.innerHTML = '';
        
        if (!referrals || referrals.length === 0) {
            listContainer.innerHTML = `
                <div class="no-referrals">
                    <i data-lucide="users" style="width: 48px; height: 48px; opacity: 0.3;"></i>
                    <p>Vous n'avez pas encore de filleuls</p>
                    <p style="font-size: 0.875rem; opacity: 0.8;">Partagez votre lien pour commencer !</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        referrals.forEach(ref => {
            const isActive = ref.status === 'active' && ref.is_currently_paying;
            const name = ref.referred_email.split('@')[0];
            const bonusRate = ref.bonus_rate_pct || 5;
            
            // Afficher le taux individuel du filleul
            const rewardText = userSubscriptionType === 'gites_france' 
                ? (isActive ? '100 pts' : '0 pts')
                : (isActive ? `-${bonusRate}%` : '0%');
            
            // Badge spécial pour les filleuls à 10%
            const campaignBadge = bonusRate >= 10 ? 
                '<span class="campaign-acquisition-badge" title="Acquis pendant une campagne">🎁 Campagne</span>' : '';
            
            const card = document.createElement('div');
            card.className = `referral-item ${isActive ? 'active' : 'inactive'}`;
            
            card.innerHTML = `
                <div class="referral-item-status">
                    ${isActive ? '✅' : '❌'}
                </div>
                <div class="referral-item-content">
                    <div class="referral-item-header">
                        <strong class="referral-name">${name}</strong>
                        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <span class="referral-badge ${isActive ? 'badge-active' : 'badge-inactive'}">
                                ${isActive ? 'Actif' : 'Inactif'}
                            </span>
                            ${campaignBadge}
                        </div>
                    </div>
                    <div class="referral-item-details">
                        <small class="detail-item">
                            <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                            Inscrit le ${new Date(ref.registered_at).toLocaleDateString('fr-FR')}
                        </small>
                        ${ref.last_payment_at ? `
                            <small class="detail-item">
                                <i data-lucide="credit-card" style="width: 14px; height: 14px;"></i>
                                Dernier paiement : ${new Date(ref.last_payment_at).toLocaleDateString('fr-FR')}
                            </small>
                        ` : ''}
                    </div>
                </div>
                <div class="referral-item-reward">
                    <span class="reward-value ${isActive ? 'active' : ''}" ${bonusRate >= 10 ? 'style="color: #10b981; font-weight: 700;"' : ''}>
                        ${rewardText}
                    </span>
                </div>
            `;
            
            listContainer.appendChild(card);
        });
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement liste filleuls:', error);
    }
}

/**
 * Adapter l'interface selon le type d'abonnement
 */
function adaptInterfaceForSubscriptionType() {
    if (userSubscriptionType === 'gites_france') {
        // Afficher la section convertisseur de points
        document.getElementById('pointsConverterSection').style.display = 'block';
    } else {
        // Masquer pour les abonnés classiques
        document.getElementById('pointsConverterSection').style.display = 'none';
    }
}

/**
 * Générer le QR Code
 */
async function generateQRCode(link) {
    try {
        const canvas = document.getElementById('qrCodeCanvas');
        if (!canvas) return;
        
        // Vider le canvas existant
        canvas.innerHTML = '';
        
        // Utiliser QRCode.js (qrcodejs library)
        if (typeof QRCode !== 'undefined') {
            new QRCode(canvas, {
                text: link,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            console.warn('⚠️ Bibliothèque QRCode non chargée');
        }
    } catch (error) {
        console.error('❌ Erreur génération QR Code:', error);
    }
}

/**
 * Copier le lien de parrainage
 */
function copyReferralLink() {
    const input = document.getElementById('referralLinkInput');
    input.select();
    input.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(input.value).then(() => {
        showToast('Lien copié dans le presse-papier !', 'success');
        
        // Animation du bouton
        const btn = event.target.closest('.copy-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check"></i>';
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 2000);
        
        // Tracker l'action
        trackInvitation('copy');
    });
}

/**
 * Partager par Email
 */
function shareViaEmail() {
    const link = document.getElementById('referralLinkInput').value;
    
    const subject = encodeURIComponent('Rejoignez LiveOwnerUnit - Gestion de gîtes simplifiée');
    const body = encodeURIComponent(
`Bonjour,

Je vous recommande LiveOwnerUnit, une plateforme professionnelle pour gérer vos locations saisonnières.

Fonctionnalités :
- Synchronisation Airbnb, Booking, Gîtes de France
- Gestion fiscale LMNP/LMP
- Fiches clients interactives
- Planning ménage automatisé

Inscrivez-vous via ce lien :
${link}

Cordialement`
    );
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    trackInvitation('email');
}

/**
 * Partager par WhatsApp
 */
function shareViaWhatsApp() {
    const link = document.getElementById('referralLinkInput').value;
    
    const text = encodeURIComponent(
`Salut ! 👋

Je te recommande LiveOwnerUnit pour gérer tes gîtes.

Super plateforme : synchro auto, gestion fiscale, fiches clients...

Inscris-toi :
${link}`
    );
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
    trackInvitation('whatsapp');
}

/**
 * Partager par LinkedIn
 */
function shareViaLinkedIn() {
    const link = document.getElementById('referralLinkInput').value;
    const url = encodeURIComponent(link);
    
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    trackInvitation('linkedin');
}

/**
 * Télécharger le QR Code
 */
function downloadQRCode() {
    const container = document.getElementById('qrCodeCanvas');
    // qrcodejs crée un canvas à l'intérieur du div
    const canvas = container.querySelector('canvas');
    
    if (!canvas) {
        showToast('QR Code non généré', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'qr-code-parrainage-liveownerunit.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showToast('QR Code téléchargé !', 'success');
}

/**
 * Tracker une invitation
 */
async function trackInvitation(channel) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await supabase.from('referral_invitations').insert({
            referrer_id: user.id,
            channel: channel,
            sent_at: new Date().toISOString()
        });
        
        // Recharger les stats
        await loadReferralStats(user.id);
        
    } catch (error) {
        console.error('❌ Erreur tracking invitation:', error);
    }
}

/**
 * Convertir des points (uniquement pour Gîtes de France)
 */
async function convertPoints(rewardType, cost) {
    if (userSubscriptionType !== 'gites_france') {
        showToast('Cette fonctionnalité est réservée aux membres Gîtes de France', 'error');
        return;
    }
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Récupérer les points actuels
        const { data: activeReferrals } = await supabase
            .from('referrals')
            .select('id')
            .eq('referrer_id', user.id)
            .eq('status', 'active')
            .eq('is_currently_paying', true);
        
        const currentPoints = (activeReferrals?.length || 0) * 100;
        
        if (currentPoints < cost) {
            showToast(`Vous n'avez pas assez de points (${currentPoints}/${cost})`, 'error');
            return;
        }
        
        // Confirmer la conversion
        const confirmed = confirm(`Confirmer la conversion de ${cost} points pour cette récompense ?`);
        if (!confirmed) return;
        
        // Enregistrer la conversion
        await supabase.from('referral_point_conversions').insert({
            user_id: user.id,
            reward_type: rewardType,
            points_cost: cost,
            converted_at: new Date().toISOString()
        });
        
        showToast('Points convertis avec succès !', 'success');
        
        // TODO: Appliquer la récompense selon le type
        // (crédits IA, template, bon marketplace, formation)
        
    } catch (error) {
        console.error('❌ Erreur conversion points:', error);
        showToast('Erreur lors de la conversion', 'error');
    }
}

/**
 * Charger les campagnes promotionnelles actives
 */
async function loadActiveCampaigns(userId) {
    try {
        const section = document.getElementById('activeCampaignsSection');
        const container = document.getElementById('campaignsList');
        if (!container) return;
        
        // Récupérer les campagnes actives
        const { data: campaigns, error } = await supabase
            .from('referral_campaigns')
            .select('*')
            .eq('is_active', true)
            .gte('end_date', new Date().toISOString())
            .order('end_date', { ascending: true });
        
        if (error) throw error;
        
        if (!campaigns || campaigns.length === 0) {
            // Masquer la section si pas de campagnes
            if (section) section.style.display = 'none';
            return;
        }
        
        // Afficher la section si des campagnes existent
        if (section) section.style.display = 'block';
        
        // Vérifier les inscriptions existantes
        const { data: enrollments } = await supabase
            .from('user_campaign_participations')
            .select('campaign_id')
            .eq('user_id', userId);
        
        const enrolledIds = new Set(enrollments?.map(e => e.campaign_id) || []);
        
        // Afficher chaque campagne
        container.innerHTML = campaigns.map(campaign => {
            const isEnrolled = enrolledIds.has(campaign.id);
            const endDate = new Date(campaign.end_date);
            const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
            
            // Déterminer le badge bonus
            let bonusBadge = '';
            if (campaign.discount_pct_bonus) {
                bonusBadge = `<span class="bonus-badge">${campaign.discount_pct_bonus}% par filleul</span>`;
            } else if (campaign.discount_fixed_bonus) {
                bonusBadge = `<span class="bonus-badge">+${campaign.discount_fixed_bonus}% Bonus</span>`;
            } else if (campaign.points_multiplier) {
                bonusBadge = `<span class="bonus-badge">x${campaign.points_multiplier} Points</span>`;
            } else if (campaign.points_fixed_bonus) {
                bonusBadge = `<span class="bonus-badge">+${campaign.points_fixed_bonus} Points</span>`;
            }
            
            // Icône selon le type
            const icon = campaign.is_featured ? '⭐' : '🎁';
            
            return `
                <div class="campaign-card ${campaign.is_featured ? 'featured' : ''}">
                    <div class="campaign-header">
                        <h4>${icon} ${campaign.name}</h4>
                        ${bonusBadge}
                    </div>
                    <p class="campaign-description">${campaign.description || ''}</p>
                    <div class="campaign-footer">
                        <div class="campaign-expiry">
                            <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                            <span>Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}</span>
                        </div>
                        ${isEnrolled 
                            ? '<span class="enrolled-badge">✓ Inscrit</span>'
                            : `<button class="btn-enroll" onclick="enrollInCampaign('${campaign.id}')">
                                S'inscrire
                               </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
        
        // Réinitialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement campagnes:', error);
    }
}

/**
 * S'inscrire à une campagne
 */
async function enrollInCampaign(campaignId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Vérifier si déjà inscrit
        const { data: existing } = await supabase
            .from('user_campaign_participations')
            .select('id')
            .eq('user_id', user.id)
            .eq('campaign_id', campaignId)
            .single();
        
        if (existing) {
            showToast('Vous êtes déjà inscrit à cette campagne', 'info');
            return;
        }
        
        // Inscrire l'utilisateur
        const { error } = await supabase
            .from('user_campaign_participations')
            .insert({
                user_id: user.id,
                campaign_id: campaignId,
                enrolled_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        showToast('✅ Inscription confirmée !', 'success');
        
        // Recharger les campagnes
        await loadActiveCampaigns(user.id);
        
    } catch (error) {
        console.error('❌ Erreur inscription campagne:', error);
        showToast('Erreur lors de l\'inscription', 'error');
    }
}

/**
 * Charger les notifications
 */
async function loadNotifications(userId) {
    try {
        const container = document.getElementById('notificationsList');
        const badge = document.getElementById('notifBadge');
        
        if (!container) return;
        
        // Récupérer les notifications non lues
        const { data: notifications, error } = await supabase
            .from('referral_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        const unreadCount = notifications?.filter(n => !n.read_at).length || 0;
        
        // Mettre à jour le badge
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        if (!notifications || notifications.length === 0) {
            container.innerHTML = '<div class="no-notifications">Aucune notification</div>';
            return;
        }
        
        // Afficher les notifications
        container.innerHTML = notifications.map(notif => {
            const date = new Date(notif.created_at);
            const timeAgo = getTimeAgo(date);
            
            // Icône selon le type
            let icon = '🔔';
            if (notif.type === 'new_campaign' || notif.type === 'campaign_expiring') icon = '🎁';
            if (notif.type === 'new_referral') icon = '👤';
            if (notif.type === 'referral_active') icon = '✅';
            if (notif.type === 'milestone_reached') icon = '🎉';
            
            return `
                <div class="notification-item ${!notif.read_at ? 'unread' : ''}" 
                     data-id="${notif.id}"
                     onclick="markNotificationAsRead('${notif.id}')">
                    <div class="notification-icon">${icon}</div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-message">${notif.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    ${!notif.read_at ? '<div class="unread-dot"></div>' : ''}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        // Table referral_notifications pas encore créée en production - ignorer silencieusement
        if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('in the schema cache')) {
            // Table inexistante - c'est normal, fonctionnalité non encore déployée
            return;
        }
        console.error('❌ Erreur chargement notifications:', error);
    }
}

/**
 * Marquer une notification comme lue
 */
async function markNotificationAsRead(notificationId) {
    try {
        const { error } = await supabase
            .from('referral_notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId)
            .is('read_at', null);
        
        if (error) throw error;
        
        // Mettre à jour l'affichage
        const notifElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notifElement) {
            notifElement.classList.remove('unread');
            const dot = notifElement.querySelector('.unread-dot');
            if (dot) dot.remove();
        }
        
        // Mettre à jour le badge
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: unreadNotifs } = await supabase
                .from('referral_notifications')
                .select('id')
                .eq('user_id', user.id)
                .is('read_at', null);
            
            const badge = document.getElementById('notifBadge');
            if (badge) {
                const count = unreadNotifs?.length || 0;
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
        
    } catch (error) {
        // Table referral_notifications pas encore créée en production - ignorer silencieusement
        if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('in the schema cache')) return;
        console.error('❌ Erreur mise à jour notification:', error);
    }
}

/**
 * Marquer toutes les notifications comme lues
 */
async function markAllNotificationsRead() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { error } = await supabase
            .from('referral_notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .is('read_at', null);
        
        if (error) throw error;
        
        showToast('Toutes les notifications ont été marquées comme lues', 'success');
        
        // Recharger les notifications
        await loadNotifications(user.id);
        
    } catch (error) {
        // Table referral_notifications pas encore créée en production - ignorer silencieusement
        if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('in the schema cache')) return;
        console.error('❌ Erreur marquage notifications:', error);
        showToast('Erreur lors du marquage', 'error');
    }
}

/**
 * Formater le temps écoulé (ex: "Il y a 2 heures")
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Rafraîchir les données
 */
async function refreshReferralData() {
    showToast('Actualisation en cours...', 'info');
    await initReferralSystem();
    showToast('Données actualisées !', 'success');
}

// L'initialisation est maintenant gérée automatiquement par switchTab() dans shared-utils.js
// Plus besoin d'écouter DOMContentLoaded ici
