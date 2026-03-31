/**
 * MODULE FICHES CLIENTS - Gestion admin des fiches personnalisées
 * Génération, envoi WhatsApp, gestion des demandes horaires et retours clients
 */

// ==================== VARIABLES GLOBALES ====================
let currentReservationForFiche = null;
let currentDemandeHoraire = null;
let currentGiteEdit = null;

// ==================== INITIALISATION ====================
async function initFichesClients() {
    // console.log('Initialisation du module Fiches Clients');
    
    // Validation temps réel pour formulaire édition gîte
    if (window.ValidationUtils) {
        window.ValidationUtils.attachRealtimeValidation('editAdresse', 'text', { required: true });
        window.ValidationUtils.attachRealtimeValidation('editHeureArrivee', 'hours', { required: false });
        window.ValidationUtils.attachRealtimeValidation('editHeureDepart', 'hours', { required: false });
    }
    
    // Attendre que supabaseClient soit disponible
    if (typeof window.supabaseClient === 'undefined') {
        // console.log('⏳ Attente du chargement de Supabase...');
        await new Promise(resolve => {
            const checkSupabase = setInterval(() => {
                if (typeof window.supabaseClient !== 'undefined') {
                    clearInterval(checkSupabase);
                    // console.log('✅ Supabase chargé');
                    resolve();
                }
            }, 50);
        });
    }
    
    // console.log('📊 Chargement des statistiques...');
    // Charger les statistiques
    await loadFichesStats();
    
    // console.log('📋 Chargement de la liste des réservations...');
    // Charger la liste des réservations
    await loadFichesClientList();
    
    // console.log('⏰ Chargement des demandes horaires...');
    // Charger les demandes en attente
    await loadDemandesHoraires();
    
    // console.log('💬 Chargement des retours clients...');
    // Charger les retours clients
    await loadRetoursClients();
    
    // console.log('🎯 Initialisation des sub-tabs...');
    // Initialiser les sub-tabs
    initSubTabs();
    
    // console.log('✅ Module Fiches Clients initialisé');
}

function initSubTabs() {
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const subtab = btn.dataset.subtab;
            
            // Désactiver tous les sub-tabs
            document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.sub-tab-content').forEach(content => content.classList.remove('active'));
            
            // Activer le sub-tab cliqué
            btn.classList.add('active');
            document.getElementById(`subtab-${subtab}`).classList.add('active');
            
            // Charger les données selon le sous-onglet
            if (subtab === 'config-checklists') {
                loadChecklistsConfig();
            }
        });
    });
}

// ==================== STATISTIQUES ====================
async function loadFichesStats() {
    try {
        // Nombre de fiches générées
        const { count: nbFiches, error: countError } = await window.supabaseClient
            .from('client_access_tokens')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.warn('⚠️ Impossible de compter les tokens (RLS):', countError.message);
            document.getElementById('statsNbFiches').textContent = '-';
        } else {
            document.getElementById('statsNbFiches').textContent = nbFiches || 0;
        }
        
        // Nombre total d'ouvertures
        const { data: logs } = await window.supabaseClient
            .from('fiche_generation_logs')
            .select('opened_count');
        
        const totalOuvertures = logs?.reduce((sum, log) => sum + (log.opened_count || 0), 0) || 0;
        document.getElementById('statsNbOuvertures').textContent = totalOuvertures;
        
        // ❌ Table demandes_horaires supprimée - 23/01/2026
        const nbDemandes = 0;
        
        document.getElementById('statsNbDemandesHoraires').textContent = nbDemandes || 0;
        document.getElementById('badgeDemandesEnAttente').textContent = nbDemandes || 0;
        
        // Retours clients non traités
        const { count: nbRetours } = await window.supabaseClient
            .from('retours_clients')
            .select('*', { count: 'exact', head: true })
            .in('status', ['nouveau', 'en_cours']);
        
        document.getElementById('statsNbRetours').textContent = nbRetours || 0;
        document.getElementById('badgeRetoursNonTraites').textContent = nbRetours || 0;
        
    } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
    }
}

// ==================== LISTE DES RÉSERVATIONS ====================
async function loadFichesClientList() {
    const container = document.getElementById('listeFichesContainer');
    window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; padding: 40px;">Chargement...</p>');
    
    try {
        // Récupérer les filtres
        const filterGite = document.getElementById('filterGiteFiches')?.value || 'tous';
        const filterStatut = document.getElementById('filterStatutFiche')?.value || 'tous';
        const filterDate = document.getElementById('filterDateDebutFiches')?.value || '';
        const searchClient = document.getElementById('searchClientFiches')?.value.toLowerCase() || '';
        
        // Requête de base
        let query = window.supabaseClient
            .from('reservations')
            .select(`
                *,
                token:client_access_tokens(token, expires_at, access_count),
                retours:retours_clients(id, status)
            `)
            .order('check_in', { ascending: false });
        
        // Appliquer les filtres
        if (filterGite !== 'tous') {
            query = query.eq('gite_id', filterGite);
        }
        
        if (filterDate) {
            query = query.gte('check_in', filterDate);
        }
        
        const { data: reservations, error } = await query;
        
        if (error) throw error;
        
        // Filtrer par statut et recherche client
        let filteredReservations = reservations || [];
        
        if (filterStatut !== 'tous') {
            filteredReservations = filteredReservations.filter(resa => {
                const hasFiche = resa.token && resa.token.length > 0;
                const isExpired = hasFiche && new Date(resa.token[0].expires_at) < new Date();
                
                if (filterStatut === 'generee') return hasFiche && !isExpired;
                if (filterStatut === 'non_generee') return !hasFiche;
                if (filterStatut === 'expiree') return isExpired;
                return true;
            });
        }
        
        if (searchClient) {
            filteredReservations = filteredReservations.filter(resa => 
                (resa.client_name || '').toLowerCase().includes(searchClient)
            );
        }
        
        // Afficher les résultats
        if (filteredReservations.length === 0) {
            window.SecurityUtils.setInnerHTML(container, `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📄</div>
                    <p style="color: var(--gray-600);">Aucune réservation trouvée</p>
                </div>
            `);
            return;
        }
        
        window.SecurityUtils.setInnerHTML(container, filteredReservations.map(resa => {
            const hasFiche = resa.token && resa.token.length > 0;
            const isExpired = hasFiche && new Date(resa.token[0].expires_at) < new Date();
            const accessCount = hasFiche ? resa.token[0].access_count : 0;
            
            const demandesEnAttente = (resa.demandes || []).filter(d => d.status === 'pending').length;
            const retoursNonTraites = (resa.retours || []).filter(r => r.status !== 'resolu' && r.status !== 'archive').length;
            
            let statusClass = 'status-non-generee';
            let statusText = 'Non générée';
            
            if (isExpired) {
                statusClass = 'status-expiree';
                statusText = 'Expirée';
            } else if (hasFiche) {
                statusClass = 'status-generee';
                statusText = 'Générée';
            }
            
            return `
                <div class="fiche-card">
                    <div class="fiche-header">
                        <div class="fiche-info">
                            <h3>${resa.client_name || 'Client inconnu'}</h3>
                            <div class="fiche-dates">
                                📅 ${formatDate(resa.check_in)} → ${formatDate(resa.check_out)}
                                • 🏡 ${resa.gite_id}
                            </div>
                        </div>
                        <span class="fiche-status ${statusClass}">${statusText}</span>
                    </div>
                    
                    ${hasFiche ? `
                        <div class="fiche-indicators">
                            <div class="indicator">
                                👁️ ${accessCount} ouverture${accessCount > 1 ? 's' : ''}
                            </div>
                            ${demandesEnAttente > 0 ? `
                                <div class="indicator">
                                    ⏰ <span class="indicator-badge">${demandesEnAttente}</span> demande${demandesEnAttente > 1 ? 's' : ''} horaire
                                </div>
                            ` : ''}
                            ${retoursNonTraites > 0 ? `
                                <div class="indicator">
                                    💬 <span class="indicator-badge">${retoursNonTraites}</span> retour${retoursNonTraites > 1 ? 's' : ''} client
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="fiche-actions">
                        ${!hasFiche || isExpired ? `
                            <button class="btn btn-primary" onclick="openModalGenereFiche(${resa.id}, '${escapeHtml(resa.client_name)}')">
                                📄 Générer la fiche
                            </button>
                        ` : `
                            <button class="btn btn-success" onclick="openFicheClient('${resa.token[0].token}')">
                                👁️ Voir la fiche
                            </button>
                            <button class="btn btn-primary" data-wa-resa-id="${resa.id}" data-wa-token="${resa.token[0].token}" onclick="envoyerWhatsAppFiche(this)">
                                💬 WhatsApp
                            </button>
                        `}
                        <button class="btn btn-secondary" onclick="viewReservationDetails(${resa.id})">
                            ℹ️ Détails
                        </button>
                    </div>
                </div>
            `;
        }).join(''));
        
    } catch (error) {
        console.error('Erreur lors du chargement des fiches:', error);
        window.SecurityUtils.setInnerHTML(container, `
            <div class="error-message">
                ⚠️ Erreur lors du chargement des données
            </div>
        `);
    }
}

// ==================== GÉNÉRATION DE FICHE ====================
function openModalGenereFiche(reservationId, clientName) {
    currentReservationForFiche = reservationId;
    document.getElementById('clientNameFiche').textContent = clientName;
    document.getElementById('ficheGenereeInfo').style.display = 'none';
    document.getElementById('ficheGenerationForm').style.display = 'block';
    openModal('modalGenereFiche');
}

async function confirmerGenerationFiche() {
    try {
        // Récupérer les détails de la réservation
        const { data: reservation, error: resaError } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('id', currentReservationForFiche)
            .single();
        
        if (resaError) throw resaError;
        
        // Générer un token unique
        const token = generateSecureToken();
        
        // Calculer la date d'expiration (7 jours après la date de départ)
        const expiresAt = new Date(reservation.check_out);
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        // Enregistrer le token (avec gestion RLS)
        const { error: tokenError } = await window.supabaseClient
            .from('client_access_tokens')
            .upsert({
                reservation_id: currentReservationForFiche,
                token: token,
                expires_at: expiresAt.toISOString(),
                access_count: 0
            });
        
        if (tokenError) {
            console.warn('⚠️ Impossible de sauvegarder le token (RLS):', tokenError.message);
            // Continuer quand même
        }
        
        // Logger la génération
        const { error: logError } = await window.supabaseClient
            .from('fiche_generation_logs')
            .insert({
                reservation_id: currentReservationForFiche,
                type_generation: 'html',
                generated_by: 'admin', // À adapter avec votre système d'auth
                fiche_url: `${window.location.origin}/pages/fiche-client.html?token=${token}`,
                opened_count: 0
            });
        
        if (logError) throw logError;
        
        // Afficher le résultat
        const ficheUrl = `${window.location.origin}/pages/fiche-client.html?token=${token}`;
        document.getElementById('ficheUrlGenerated').value = ficheUrl;
        document.getElementById('ficheGenerationForm').style.display = 'none';
        document.getElementById('ficheGenereeInfo').style.display = 'block';
        
        // Mettre à jour la liste
        await loadFichesClientList();
        await loadFichesStats();
        
        showNotification('✅ Fiche générée avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la génération:', error);
        showNotification('❌ Erreur lors de la génération de la fiche', 'error');
    }
}

function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function copyFicheUrl() {
    const input = document.getElementById('ficheUrlGenerated');
    input.select();
    document.execCommand('copy');
    showNotification('📋 URL copiée dans le presse-papier', 'success');
}

function openFicheClient(token) {
    const url = `${window.location.origin}/pages/fiche-client.html?token=${token}`;
    window.open(url, '_blank');
}

// ==================== WHATSAPP - SYSTÈME RECONSTRUIT ====================
// Principe : le numéro n'est JAMAIS passé en paramètre HTML inline.
// Il est toujours récupéré fraîchement depuis Supabase au moment du clic.

function _normaliserTelephoneWhatsApp(raw) {
    if (!raw) return null;
    let digits = String(raw).replace(/[^0-9]/g, '');
    if (!digits) return null;
    // Format 00XXXXXXXXXX -> supprimer les deux zéros
    if (digits.startsWith('00')) digits = digits.slice(2);
    // Format français 0XXXXXXXXX (10 chiffres) -> 33XXXXXXXXX
    else if (digits.startsWith('0') && digits.length === 10) digits = '33' + digits.slice(1);
    // Validation longueur minimale (8 chiffres hors indicatif)
    if (digits.length < 8) return null;
    return digits;
}

async function envoyerWhatsAppFiche(btn) {
    const reservationId = parseInt(btn.getAttribute('data-wa-resa-id'), 10);
    const token = btn.getAttribute('data-wa-token');

    if (!reservationId || !token) {
        showNotification('⚠️ Données manquantes pour envoyer WhatsApp', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳...';

    try {
        // Fetch du numéro DIRECTEMENT en base — jamais depuis le HTML
        const { data: resa, error } = await window.supabaseClient
            .from('reservations')
            .select('client_phone, client_name')
            .eq('id', reservationId)
            .single();

        if (error || !resa) throw new Error('Réservation introuvable en base');

        const rawPhone = resa.client_phone;
        const waPhone = _normaliserTelephoneWhatsApp(rawPhone);

        if (!waPhone) {
            showNotification(`⚠️ Numéro invalide en base : "${rawPhone || 'vide'}". Corrigez-le dans la réservation.`, 'error');
            return;
        }

        const ficheUrl = `${window.location.origin}/pages/fiche-client.html?token=${encodeURIComponent(token)}`;
        const message = `Bonjour ${resa.client_name || ''},

Voici votre guide pour votre séjour :
${ficheUrl}

Vous y trouverez toutes les informations nécessaires (codes, horaires, activités...).

À très bientôt !`;

        const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        // Log en base
        window.supabaseClient.from('fiche_generation_logs').insert({
            reservation_id: reservationId,
            type_generation: 'whatsapp',
            generated_by: 'admin',
            fiche_url: ficheUrl
        }).catch(() => {});

    } catch (err) {
        console.error('❌ envoyerWhatsAppFiche:', err);
        showNotification('❌ Erreur envoi WhatsApp : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '💬 WhatsApp';
    }
}

// ==================== DEMANDES HORAIRES ====================
async function loadDemandesHoraires() {
    return; // ❌ Table demandes_horaires supprimée - 23/01/2026
    const container = document.getElementById('demandesHorairesContainer');
    window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; padding: 40px;">Chargement...</p>');
    
    try {
        const { data: demandes, error } = await window.supabaseClient
            .from('demandes_horaires')
            .select(`
                *,
                reservation:reservations(client_name, gite_id, check_in, check_out)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!demandes || demandes.length === 0) {
            window.SecurityUtils.setInnerHTML(container, `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">⏰</div>
                    <p style="color: var(--gray-600);">Aucune demande horaire</p>
                </div>
            `);
            return;
        }
        
        // Séparer en catégories
        const pending = demandes.filter(d => d.status === 'pending');
        const approved = demandes.filter(d => d.status === 'approved');
        const refused = demandes.filter(d => d.status === 'refused');
        
        let html = '';
        
        // En attente
        if (pending.length > 0) {
            html += '<h3 style="margin-bottom: 15px;">⏳ En attente de validation</h3>';
            html += pending.map(d => renderDemandeCard(d, 'pending')).join('');
        }
        
        // Approuvées
        if (approved.length > 0) {
            html += '<h3 style="margin: 30px 0 15px 0;">✅ Approuvées</h3>';
            html += approved.map(d => renderDemandeCard(d, 'approved')).join('');
        }
        
        // Refusées
        if (refused.length > 0) {
            html += '<h3 style="margin: 30px 0 15px 0;">❌ Refusées</h3>';
            html += refused.map(d => renderDemandeCard(d, 'refused')).join('');
        }
        
        window.SecurityUtils.setInnerHTML(container, html);
        
    } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        window.SecurityUtils.setInnerHTML(container, `<div class="error-message">⚠️ Erreur de chargement</div>`);
    }
}

function renderDemandeCard(demande, category) {
    const typeLabel = demande.type === 'arrivee_anticipee' ? '🔽 Arrivée anticipée' : '🔼 Départ tardif';
    const autoApprove = demande.automatiquement_approuvable ? '(Auto-approuvable)' : '';
    
    return `
        <div class="demande-card ${category}">
            <div style="display: flex; justify-content: between; margin-bottom: 15px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0;">${demande.reservation.client_name} - ${demande.reservation.gite_id}</h4>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        ${typeLabel} • Heure demandée: <strong>${formatTime(demande.heure_demandee)}</strong>
                        ${autoApprove}
                    </div>
                    ${demande.motif ? `
                        <div style="margin-top: 10px; padding: 10px; background: var(--gray-100); border-radius: 6px;">
                            <strong>Motif:</strong> ${escapeHtml(demande.motif)}
                        </div>
                    ` : ''}
                </div>
                <div style="text-align: right;">
                    <small style="color: var(--gray-600);">${formatDateTime(demande.created_at)}</small>
                </div>
            </div>
            
            ${category === 'pending' ? `
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-success" onclick="openModalValidation(${demande.id}, 'approve')">
                        ✅ Approuver
                    </button>
                    <button class="btn btn-danger" onclick="openModalValidation(${demande.id}, 'refuse')">
                        ❌ Refuser
                    </button>
                </div>
            ` : category === 'approved' ? `
                <div class="success-message" style="background: #d1fae5; padding: 10px; border-radius: 6px;">
                    ✅ Approuvée le ${formatDateTime(demande.validated_at)}
                </div>
            ` : `
                <div class="error-message" style="background: #fee2e2; padding: 10px; border-radius: 6px;">
                    ❌ Refusée le ${formatDateTime(demande.validated_at)}
                    ${demande.raison_refus ? `<br><strong>Raison:</strong> ${escapeHtml(demande.raison_refus)}` : ''}
                </div>
            `}
        </div>
    `;
}

function openModalValidation(demandeId, action) {
    currentDemandeHoraire = demandeId;
    
    // Charger les détails
    window.supabaseClient
        .from('demandes_horaires')
        .select(`
            *,
            reservation:reservations(client_name, gite_id, check_in, check_out, client_phone)
        `)
        .eq('id', demandeId)
        .single()
        .then(({ data: demande }) => {
            const typeLabel = demande.type === 'arrivee_anticipee' ? 'Arrivée anticipée' : 'Départ tardif';
            
            document.getElementById('titreDemande').textContent = `${typeLabel} - ${demande.reservation.client_name}`;
            
            const motifHtml = demande.motif ? `<p><strong>Motif:</strong> ${demande.motif}</p>` : '';
            const autoApprouvableHtml = demande.automatiquement_approuvable ? 
                '<p style="color: var(--success);">✅ Cette demande respecte les règles automatiques</p>' : '';
            
            window.SecurityUtils.setInnerHTML(document.getElementById('detailsDemande'), `
                <div style="background: var(--gray-100); padding: 15px; border-radius: 8px;">
                    <p><strong>Gîte:</strong> ${demande.reservation.gite}</p>
                    <p><strong>Heure demandée:</strong> ${formatTime(demande.heure_demandee)}</p>
                    ${motifHtml}
                    ${autoApprouvableHtml}
                </div>
            `);
            
            document.getElementById('actionsDemande').style.display = 'flex';
            document.getElementById('formRefus').style.display = 'none';
            
            openModal('modalDemandeHoraire');
        });
}

async function approuverDemande() {
    return; // ❌ Table demandes_horaires supprimée - 23/01/2026
    try {
        const { error } = await window.supabaseClient
            .from('demandes_horaires')
            .update({
                status: 'approved',
                validated_at: new Date().toISOString(),
                validated_by: 'admin'
            })
            .eq('id', currentDemandeHoraire);
        
        if (error) throw error;
        
        closeModal('modalDemandeHoraire');
        showNotification('✅ Demande approuvée', 'success');
        await loadDemandesHoraires();
        await loadFichesStats();
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur lors de l\'approbation', 'error');
    }
}

function showRefusForm() {
    document.getElementById('actionsDemande').style.display = 'none';
    document.getElementById('formRefus').style.display = 'block';
}

async function refuserDemande() {
    return; // ❌ Table demandes_horaires supprimée - 23/01/2026
    const raison = document.getElementById('raisonRefus').value.trim();
    
    if (!raison) {
        showNotification('⚠️ Veuillez indiquer une raison', 'error');
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('demandes_horaires')
            .update({
                status: 'refused',
                raison_refus: raison,
                validated_at: new Date().toISOString(),
                validated_by: 'admin'
            })
            .eq('id', currentDemandeHoraire);
        
        if (error) throw error;
        
        closeModal('modalDemandeHoraire');
        document.getElementById('raisonRefus').value = '';
        showNotification('❌ Demande refusée', 'success');
        await loadDemandesHoraires();
        await loadFichesStats();
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur lors du refus', 'error');
    }
}

// ==================== RETOURS CLIENTS ====================
async function loadRetoursClients() {
    const container = document.getElementById('retoursClientsContainer');
    window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; padding: 40px;">Chargement...</p>');
    
    try {
        const { data: retours, error } = await window.supabaseClient
            .from('retours_clients')
            .select(`
                *,
                reservation:reservations(client_name, gite_id, client_phone)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!retours || retours.length === 0) {
            window.SecurityUtils.setInnerHTML(container, `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">💬</div>
                    <p style="color: var(--gray-600);">Aucun retour client</p>
                </div>
            `);
            return;
        }
        
        window.SecurityUtils.setInnerHTML(container, retours.map(retour => {
            const typeEmoji = {
                'demande': '🙋',
                'retour': '💬',
                'amelioration': '💡',
                'probleme': '⚠️'
            }[retour.type];
            
            const urgenceColor = {
                'basse': 'var(--gray-600)',
                'normale': 'var(--warning)',
                'haute': 'var(--danger)'
            }[retour.urgence];
            
            return `
                <div class="retour-card ${retour.type}">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div>
                            <h4 style="margin: 0;">${typeEmoji} ${retour.sujet}</h4>
                            <div style="font-size: 0.875rem; color: var(--gray-600); margin-top: 5px;">
                                ${retour.reservation.client_name} - ${retour.reservation.gite_id}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="padding: 4px 12px; background: ${urgenceColor}; color: white; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                                ${retour.urgence.toUpperCase()}
                            </div>
                            <small style="color: var(--gray-600); display: block; margin-top: 5px;">
                                ${formatDateTime(retour.created_at)}
                            </small>
                        </div>
                    </div>
                    
                    <p style="margin: 15px 0; white-space: pre-line;">${escapeHtml(retour.description)}</p>
                    
                    ${retour.status === 'resolu' ? `
                        <div class="success-message" style="background: #d1fae5; padding: 10px; border-radius: 6px; margin-top: 15px;">
                            ✅ Résolu le ${formatDateTime(retour.traite_at)}
                            ${retour.reponse ? `<br><strong>Réponse:</strong> ${escapeHtml(retour.reponse)}` : ''}
                        </div>
                    ` : `
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button class="btn btn-success" onclick="marquerRetourResolu(${retour.id})">
                                ✅ Marquer résolu
                            </button>
                            ${retour.reservation.telephone ? `
                                <button class="btn btn-secondary" data-wa-retour-resa-id="${retour.reservation_id}" data-wa-sujet="${escapeHtml(retour.sujet)}" onclick="contactClientWhatsApp(this)">
                                    📞 Contacter
                                </button>
                            ` : ''}
                        </div>
                    `}
                </div>
            `;
        }).join(''));
        
    } catch (error) {
        console.error('Erreur lors du chargement des retours:', error);
        window.SecurityUtils.setInnerHTML(container, `<div class="error-message">⚠️ Erreur de chargement</div>`);
    }
}

async function marquerRetourResolu(retourId) {
    const reponse = prompt('Réponse (optionnelle):');
    
    try {
        const { error } = await window.supabaseClient
            .from('retours_clients')
            .update({
                status: 'resolu',
                reponse: reponse,
                traite_at: new Date().toISOString(),
                traite_par: 'admin'
            })
            .eq('id', retourId);
        
        if (error) throw error;
        
        showNotification('✅ Retour marqué comme résolu', 'success');
        await loadRetoursClients();
        await loadFichesStats();
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur', 'error');
    }
}

async function contactClientWhatsApp(btn) {
    const reservationId = parseInt(btn.getAttribute('data-wa-retour-resa-id'), 10);
    const sujet = btn.getAttribute('data-wa-sujet') || '';

    if (!reservationId) {
        showNotification('⚠️ ID réservation manquant', 'error');
        return;
    }

    btn.disabled = true;

    try {
        // Fetch du numéro DIRECTEMENT en base — jamais depuis le HTML
        const { data: resa, error } = await window.supabaseClient
            .from('reservations')
            .select('client_phone, client_name')
            .eq('id', reservationId)
            .single();

        if (error || !resa) throw new Error('Réservation introuvable');

        const waPhone = _normaliserTelephoneWhatsApp(resa.client_phone);
        if (!waPhone) {
            showNotification(`⚠️ Numéro invalide en base : "${resa.client_phone || 'vide'}". Corrigez-le dans la réservation.`, 'error');
            return;
        }

        const message = `Bonjour ${resa.client_name || ''},

Suite à votre message concernant : ${sujet}

`;
        window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank');

    } catch (err) {
        console.error('❌ contactClientWhatsApp:', err);
        showNotification('❌ Erreur : ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

// ==================== CONFIGURATION GÎTES ====================
async function editGiteInfo(gite) {
    currentGiteEdit = gite;
    document.getElementById('giteNameEdit').textContent = gite;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('infos_gites')
            .select('*')
            .eq('gite', gite)
            .single();
        
        if (error) throw error;
        
        // Remplir le formulaire - mapping vers colonnes réelles
        document.getElementById('editGiteId').value = data.id;
        document.getElementById('editCodeEntree').value = data.code_acces || data.code_porte || '';
        document.getElementById('editAdresse').value = data.adresse || '';
        document.getElementById('editLatitude').value = data.gps_lat || '';
        document.getElementById('editLongitude').value = data.gps_lon || '';
        document.getElementById('editInstructionsFr').value = data.instructions_cles || '';
        document.getElementById('editInstructionsEn').value = data.instructions_cles_en || '';
        document.getElementById('editWifiSsid').value = data.wifi_ssid || '';
        document.getElementById('editWifiPassword').value = data.wifi_password || '';
        document.getElementById('editWifiQr').value = data.wifi_qr_url || '';
        document.getElementById('editHeureArrivee').value = formatTime(data.heure_arrivee);
        document.getElementById('editHeureDepart').value = formatTime(data.heure_depart);
        document.getElementById('editHeureArriveeMin').value = formatTime(data.heure_arrivee_min);
        document.getElementById('editHeureArriveeAvecMenage').value = formatTime(data.heure_arrivee_menage);
        document.getElementById('editHeureDepartMax').value = formatTime(data.heure_depart_max);
        document.getElementById('editHeureDepartDimanche').value = formatTime(data.heure_depart_dimanche);
        document.getElementById('editReglementFr').value = data.tabac || '';
        document.getElementById('editReglementEn').value = data.tabac_en || '';
        
        openModal('modalEditGite');
        
        // Charger les photos du gîte
        if (typeof window.loadGitePhotos === 'function') {
            await window.loadGitePhotos(gite);
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur de chargement', 'error');
    }
}

async function saveGiteInfo(event) {
    event.preventDefault();
    
    // Validation avec ValidationUtils
    if (window.ValidationUtils) {
        const form = event.target;
        const rules = {
            'editAdresse': { type: 'text', required: true },
            'editWifiSsid': { type: 'text', required: false },
            'editHeureArrivee': { type: 'hours', required: false },
            'editHeureDepart': { type: 'hours', required: false }
        };
        
        const validation = window.ValidationUtils.validateForm(form, rules);
        if (!validation.valid) {
            console.warn('❌ Formulaire gîte invalide:', validation.errors);
            showNotification('❌ Veuillez corriger les erreurs', 'error');
            return false;
        }
    }
    
    const giteId = document.getElementById('editGiteId').value;
    
    const updates = {
        code_acces: document.getElementById('editCodeEntree').value,
        adresse: document.getElementById('editAdresse').value,
        gps_lat: parseFloat(document.getElementById('editLatitude').value) || null,
        gps_lon: parseFloat(document.getElementById('editLongitude').value) || null,
        instructions_cles: document.getElementById('editInstructionsFr').value,
        instructions_cles_en: document.getElementById('editInstructionsEn').value,
        wifi_ssid: document.getElementById('editWifiSsid').value,
        wifi_password: document.getElementById('editWifiPassword').value,
        wifi_qr_url: document.getElementById('editWifiQr').value || null,
        heure_arrivee: document.getElementById('editHeureArrivee').value || null,
        heure_depart: document.getElementById('editHeureDepart').value || null,
        heure_arrivee_min: document.getElementById('editHeureArriveeMin').value || null,
        heure_arrivee_menage: document.getElementById('editHeureArriveeAvecMenage').value || null,
        heure_depart_max: document.getElementById('editHeureDepartMax').value || null,
        heure_depart_dimanche: document.getElementById('editHeureDepartDimanche').value || null,
        tabac: document.getElementById('editReglementFr').value,
        tabac_en: document.getElementById('editReglementEn').value
    };
    
    try {
        const { error } = await window.supabaseClient
            .from('infos_gites')
            .update(updates)
            .eq('id', giteId);
        
        if (error) throw error;
        
        closeModal('modalEditGite');
        showNotification('✅ Configuration enregistrée', 'success');
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur lors de l\'enregistrement', 'error');
    }
    
    return false;
}

// ==================== CONFIGURATION CHECKLISTS ====================
const checklistConfigEditingState = {
    entree: null,
    sortie: null
};

async function translateChecklistConfigToEnglish(text) {
    if (!text || text.trim() === '') return '';

    try {
        const attemptTranslation = async () => {
            const response = await Promise.race([
                fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|en`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), 6000))
            ]);

            const data = await response.json();
            if (data.responseStatus === 200 && data.responseData?.translatedText) {
                return data.responseData.translatedText;
            }

            throw new Error(data.responseDetails || 'Translation unavailable');
        };

        let translated = await attemptTranslation();
        if (!translated || translated.trim() === '') {
            translated = await attemptTranslation();
        }

        return translated || text;
    } catch (error) {
        console.error('❌ Erreur traduction checklist config:', error);
        return text;
    }
}

async function loadChecklistsConfig() {
    const giteSelect = document.getElementById('selectGiteChecklist');
    if (!giteSelect) return;
    const gite = giteSelect.value;

    populateChecklistDuplicateTargetsConfig();
    
    await loadChecklistItemsConfig('entree', gite);
    await loadChecklistItemsConfig('sortie', gite);
}

function populateChecklistDuplicateTargetsConfig() {
    const sourceSelect = document.getElementById('selectGiteChecklist');
    const targetSelect = document.getElementById('selectGiteChecklistDuplicateTarget');
    if (!sourceSelect || !targetSelect) return;

    const sourceValue = sourceSelect.value;
    const options = Array.from(sourceSelect.options || []);

    targetSelect.innerHTML = '<option value="">Gîte cible (duplication)</option>';

    options
        .filter((option) => option.value !== sourceValue)
        .forEach((option) => {
            const clone = document.createElement('option');
            clone.value = option.value;
            clone.textContent = option.textContent;
            targetSelect.appendChild(clone);
        });

    targetSelect.disabled = targetSelect.options.length <= 1;
}

function getChecklistConfigFormElements(type) {
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    return {
        itemFr: document.getElementById(`checklist${capitalizedType}ItemFr`),
        itemEn: document.getElementById(`checklist${capitalizedType}ItemEn`),
        obligatoire: document.getElementById(`checklist${capitalizedType}Obligatoire`),
        saveBtn: document.getElementById(`btnChecklist${capitalizedType}Save`),
        cancelBtn: document.getElementById(`btnChecklist${capitalizedType}Cancel`)
    };
}

function setChecklistConfigFormMode(type, mode = 'create') {
    const { saveBtn, cancelBtn } = getChecklistConfigFormElements(type);

    if (saveBtn) {
        saveBtn.innerHTML = mode === 'edit'
            ? '<i data-lucide="save"></i> Modifier'
            : '<i data-lucide="plus"></i> Ajouter';
        saveBtn.classList.toggle('btn-primary', mode === 'edit');
        saveBtn.classList.toggle('btn-success', mode !== 'edit');
    }

    if (cancelBtn) {
        cancelBtn.style.display = mode === 'edit' ? '' : 'none';
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function clearChecklistConfigForm(type) {
    const { itemFr, itemEn, obligatoire } = getChecklistConfigFormElements(type);
    if (itemFr) itemFr.value = '';
    if (itemEn) itemEn.value = '';
    if (obligatoire) obligatoire.checked = false;
    checklistConfigEditingState[type] = null;
    setChecklistConfigFormMode(type, 'create');
}

function cancelChecklistEditConfig(type) {
    clearChecklistConfigForm(type);
}

async function loadChecklistItemsConfig(type, gite) {
    const containerId = type === 'entree' ? 'checklistEntreeConfig' : 'checklistSortieConfig';
    const container = document.getElementById(containerId);
    
    try {
        const { data: items, error } = await window.supabaseClient
            .from('checklists')
            .select('*')
            .eq('gite', gite)
            .eq('type', type)
            .order('ordre');
        
        if (error) throw error;
        
        window.SecurityUtils.setInnerHTML(container, (items || []).map(item => `
            <div class="checklist-item-config draggable" data-id="${item.id}">
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${item.item_fr}</div>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">${item.item_en}</div>
                    ${item.obligatoire ? '<span style="color: var(--danger); font-size: 0.75rem;">OBLIGATOIRE</span>' : ''}
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-sm btn-secondary" onclick="editChecklistItemConfig(${item.id}, '${type}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteChecklistItemConfig(${item.id}, '${type}', '${gite}')">🗑️</button>
                </div>
            </div>
        `).join(''));
        
    } catch (error) {
        console.error('Erreur:', error);
        window.SecurityUtils.setInnerHTML(container, '<p class="error-message">Erreur de chargement</p>');
    }
}

async function saveChecklistItemConfig(type) {
    const gite = document.getElementById('selectGiteChecklist').value;
    const { itemFr, itemEn, obligatoire } = getChecklistConfigFormElements(type);

    if (!itemFr || !itemEn || !obligatoire) {
        showNotification('❌ Formulaire checklist introuvable', 'error');
        return;
    }

    const itemFrValue = itemFr.value.trim();
    let itemEnValue = itemEn.value.trim();
    const obligatoireValue = !!obligatoire.checked;

    if (!itemFrValue) {
        showNotification('⚠️ Renseignez au moins le champ FR', 'warning');
        return;
    }

    let autoTranslated = false;
    if (!itemEnValue) {
        itemEnValue = await translateChecklistConfigToEnglish(itemFrValue);
        autoTranslated = true;
    }
    
    try {
        const editingId = checklistConfigEditingState[type];

        if (editingId) {
            const { error } = await window.supabaseClient
                .from('checklists')
                .update({
                    item_fr: itemFrValue,
                    item_en: itemEnValue,
                    obligatoire: obligatoireValue
                })
                .eq('id', editingId);

            if (error) throw error;
            showNotification('✅ Item modifié', 'success');
        } else {
            const { data: existing } = await window.supabaseClient
                .from('checklists')
                .select('ordre')
                .eq('gite', gite)
                .eq('type', type)
                .order('ordre', { ascending: false })
                .limit(1);

            const nextOrdre = existing && existing.length > 0 ? existing[0].ordre + 1 : 1;

            const { error } = await window.supabaseClient
                .from('checklists')
                .insert({
                    gite: gite,
                    type: type,
                    item_fr: itemFrValue,
                    item_en: itemEnValue,
                    ordre: nextOrdre,
                    obligatoire: obligatoireValue
                });

            if (error) throw error;
            showNotification('✅ Item ajouté', 'success');
        }

        clearChecklistConfigForm(type);
        await loadChecklistsConfig();

        if (autoTranslated && itemEnValue.trim().toLowerCase() === itemFrValue.trim().toLowerCase()) {
            showNotification('⚠️ Traduction EN indisponible (API), texte FR conservé', 'warning');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur', 'error');
    }
}

async function editChecklistItemConfig(itemId, type) {
    try {
        const { data: item, error } = await window.supabaseClient
            .from('checklists')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) throw error;

        const { itemFr, itemEn, obligatoire } = getChecklistConfigFormElements(type);
        if (!itemFr || !itemEn || !obligatoire) {
            showNotification('❌ Formulaire checklist introuvable', 'error');
            return;
        }

        itemFr.value = item.item_fr || '';
        itemEn.value = item.item_en || '';
        obligatoire.checked = !!item.obligatoire;

        checklistConfigEditingState[type] = itemId;
        setChecklistConfigFormMode(type, 'edit');
        itemFr.focus();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur lors de la préparation de la modification', 'error');
    }
}

async function deleteChecklistItemConfig(itemId, type) {
    try {
        const { error } = await window.supabaseClient
            .from('checklists')
            .delete()
            .eq('id', itemId);
        
        if (error) throw error;
        
        showNotification('✅ Item supprimé', 'success');

        if (checklistConfigEditingState[type] === itemId) {
            clearChecklistConfigForm(type);
        }

        await loadChecklistsConfig();
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur', 'error');
    }
}

function normalizeChecklistConfigValue(value) {
    return String(value || '').trim().toLowerCase();
}

function buildChecklistConfigSignature(itemFr, itemEn) {
    return `${normalizeChecklistConfigValue(itemFr)}||${normalizeChecklistConfigValue(itemEn)}`;
}

async function duplicateChecklistConfigToOtherGite(type) {
    const sourceSelect = document.getElementById('selectGiteChecklist');
    const targetSelect = document.getElementById('selectGiteChecklistDuplicateTarget');

    if (!sourceSelect || !targetSelect) {
        showNotification('❌ Configuration de duplication indisponible', 'error');
        return;
    }

    const sourceGite = sourceSelect.value;
    const targetGite = targetSelect.value;

    if (!sourceGite || !targetGite) {
        showNotification('⚠️ Sélectionnez un gîte cible', 'warning');
        return;
    }

    if (sourceGite === targetGite) {
        showNotification('⚠️ Le gîte cible doit être différent du gîte source', 'warning');
        return;
    }

    try {
        const { data: sourceItems, error: sourceError } = await window.supabaseClient
            .from('checklists')
            .select('item_fr, item_en, obligatoire, ordre')
            .eq('gite', sourceGite)
            .eq('type', type)
            .order('ordre', { ascending: true });

        if (sourceError) throw sourceError;

        if (!sourceItems || sourceItems.length === 0) {
            showNotification('ℹ️ Aucun item à dupliquer', 'info');
            return;
        }

        const { data: targetItems, error: targetError } = await window.supabaseClient
            .from('checklists')
            .select('item_fr, item_en, ordre')
            .eq('gite', targetGite)
            .eq('type', type);

        if (targetError) throw targetError;

        const existingSignatures = new Set(
            (targetItems || []).map((item) => buildChecklistConfigSignature(item.item_fr, item.item_en))
        );

        const toInsert = sourceItems.filter((item) => (
            !existingSignatures.has(buildChecklistConfigSignature(item.item_fr, item.item_en))
        ));

        if (toInsert.length === 0) {
            showNotification('ℹ️ Tous les items existent déjà sur le gîte cible', 'info');
            return;
        }

        const maxOrdre = (targetItems || []).reduce((max, item) => Math.max(max, Number(item.ordre || 0)), 0);
        const payload = toInsert.map((item, index) => ({
            gite: targetGite,
            type,
            item_fr: item.item_fr,
            item_en: item.item_en,
            obligatoire: !!item.obligatoire,
            ordre: maxOrdre + index + 1
        }));

        const { error: insertError } = await window.supabaseClient
            .from('checklists')
            .insert(payload);

        if (insertError) throw insertError;

        const skippedCount = sourceItems.length - toInsert.length;
        showNotification(`✅ Duplication ${type}: ${toInsert.length} ajouté(s), ${skippedCount} ignoré(s)`, 'success');
        await loadChecklistsConfig();
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur lors de la duplication', 'error');
    }
}

async function backfillChecklistConfigTranslations(type) {
    const sourceSelect = document.getElementById('selectGiteChecklist');
    if (!sourceSelect) {
        showNotification('❌ Sélecteur gîte introuvable', 'error');
        return;
    }

    const gite = sourceSelect.value;
    if (!gite || !type) {
        showNotification('⚠️ Gîte ou type manquant', 'warning');
        return;
    }

    showNotification(`🌍 Rétro-traduction ${type} en cours...`, 'info');

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    try {
        const { data: rows, error } = await window.supabaseClient
            .from('checklists')
            .select('id, item_fr, item_en')
            .eq('gite', gite)
            .eq('type', type)
            .order('ordre', { ascending: true });

        if (error) throw error;

        for (const row of (rows || [])) {
            try {
                const hasFr = !!(row.item_fr && row.item_fr.trim());
                const needsEn = hasFr && (!row.item_en || row.item_en.trim().toLowerCase() === row.item_fr.trim().toLowerCase());

                if (!needsEn) {
                    skipped += 1;
                    continue;
                }

                const translated = await translateChecklistConfigToEnglish(row.item_fr);
                const { error: updateError } = await window.supabaseClient
                    .from('checklists')
                    .update({ item_en: translated })
                    .eq('id', row.id);

                if (updateError) {
                    failed += 1;
                    continue;
                }

                updated += 1;
            } catch (innerError) {
                console.error('Erreur rétro-traduction checklists:', innerError);
                failed += 1;
            }
        }

        await loadChecklistsConfig();
        showNotification(`✅ Rétro-traduction ${type}: ${updated} maj, ${skipped} inchangé(s), ${failed} échec(s)`, failed > 0 ? 'warning' : 'success');
    } catch (error) {
        console.error('Erreur rétro-traduction checklists:', error);
        showNotification('❌ Erreur rétro-traduction des checklists', 'error');
    }
}

// ==================== UTILITAIRES ====================

function formatTime(timeString) {
    if (!timeString) return '';
    return timeString.substring(0, 5);
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function viewReservationDetails(reservationId) {
    // Implémenter selon votre système existant
    showTab('reservations');
    // Scroll vers la réservation ou ouvrir un modal
}

// Export des fonctions pour utilisation globale
window.initFichesClients = initFichesClients;
window.loadFichesClientList = loadFichesClientList;
window.openModalGenereFiche = openModalGenereFiche;
window.confirmerGenerationFiche = confirmerGenerationFiche;
window.copyFicheUrl = copyFicheUrl;
window.openFicheClient = openFicheClient;
window.envoyerWhatsAppFiche = envoyerWhatsAppFiche;
window.openModalValidation = openModalValidation;
window.approuverDemande = approuverDemande;
window.showRefusForm = showRefusForm;
window.refuserDemande = refuserDemande;
window.marquerRetourResolu = marquerRetourResolu;
window.contactClientWhatsApp = contactClientWhatsApp;
window.editGiteInfo = editGiteInfo;
window.saveGiteInfo = saveGiteInfo;
window.loadChecklistsConfig = loadChecklistsConfig;
window.addChecklistItem = saveChecklistItemConfig;
window.saveChecklistItemConfig = saveChecklistItemConfig;
window.cancelChecklistEditConfig = cancelChecklistEditConfig;
window.editChecklistItemConfig = editChecklistItemConfig;
window.deleteChecklistItemConfig = deleteChecklistItemConfig;
window.duplicateChecklistConfigToOtherGite = duplicateChecklistConfigToOtherGite;
window.backfillChecklistConfigTranslations = backfillChecklistConfigTranslations;
