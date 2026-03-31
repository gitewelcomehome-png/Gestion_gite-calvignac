// ================================================================
// 🎫 SUPPORT CLIENT - JavaScript
// ================================================================

let currentUser = null;
let currentClient = null;
let allTickets = [];
let currentFilter = '';

// ================================================================
// 🔐 INITIALISATION
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // console.log('🎫 Initialisation Support Client');
    
    // Vérifier auth
    await checkAuth();
    
    // Charger tickets
    await loadTickets();
    
    // Setup événements
    setupEventListeners();
    
    // Initialiser icônes
    lucide.createIcons();
});

// ================================================================
// 🔐 AUTHENTIFICATION
// ================================================================
async function checkAuth() {
    try {
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error || !user) {
            window.location.href = '../index.html';
            return;
        }
        
        currentUser = user;
        document.getElementById('userEmail').textContent = user.email;
        
        // Récupérer infos client depuis cm_clients
        let { data: client, error: clientError } = await window.supabaseClient
            .from('cm_clients')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        // Si le client n'existe pas, le créer automatiquement
        if (clientError || !client) {
            // console.log('📝 Création automatique du client...');
            // console.log('User ID:', user.id);
            // console.log('User Email:', user.email);
            
            // Extraire nom/prénom de l'email si possible
            const emailParts = user.email.split('@')[0].split('.');
            const prenom = emailParts[0] || 'Prénom';
            const nom = emailParts[1] || 'Nom';
            
            const { data: newClient, error: createError } = await window.supabaseClient
                .from('cm_clients')
                .insert([{
                    user_id: user.id,
                    email_principal: user.email,
                    nom_contact: nom.charAt(0).toUpperCase() + nom.slice(1),
                    prenom_contact: prenom.charAt(0).toUpperCase() + prenom.slice(1),
                    type_abonnement: 'basic',
                    statut: 'trial',
                    date_inscription: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (createError) {
                console.error('❌ Erreur création client DÉTAILS:', createError);
                console.error('Code:', createError.code);
                console.error('Message:', createError.message);
                console.error('Details:', createError.details);
                console.error('Hint:', createError.hint);
                alert("⚠️ Erreur lors de l'initialisation de votre compte: " + createError.message + "\n\nVeuillez contacter le support.");
                return;
            }
            
            client = newClient;
            // console.log('✅ Client créé:', client.email_principal);
        }
        
        currentClient = client;
        // console.log('✅ Client authentifié:', client.email_principal);
        
    } catch (err) {
        console.error('❌ Erreur auth:', err);
        window.location.href = '../index.html';
    }
}

// ================================================================
// 📋 CHARGEMENT TICKETS
// ================================================================
async function loadTickets() {
    try {
        if (!currentClient) {
            console.error('❌ Pas de client authentifié');
            const gridContainer = document.getElementById('ticketsGrid');
            if (gridContainer) {
                gridContainer.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="alert-circle" style="width: 64px; height: 64px; color: #f59e0b;"></i>
                        <p>Initialisation de votre compte en cours...</p>
                    </div>
                `;
                lucide.createIcons();
            }
            return;
        }
        
        const gridContainer = document.getElementById('ticketsGrid');
        gridContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Chargement de vos tickets...</p></div>';
        
        // Query
        let query = window.supabaseClient
            .from('cm_support_tickets')
            .select('*')
            .eq('client_id', currentClient.id)
            .order('created_at', { ascending: false });
        
        // Filtre statut
        if (currentFilter) {
            query = query.eq('statut', currentFilter);
        }
        
        const { data: tickets, error } = await query;
        
        if (error) throw error;
        
        allTickets = tickets || [];
        
        // Update count
        document.getElementById('ticketCount').textContent = allTickets.length;
        
        // Afficher tickets
        if (allTickets.length === 0) {
            gridContainer.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox" style="width: 64px; height: 64px;"></i>
                    <p>${currentFilter ? 'Aucun ticket avec ce statut' : 'Vous n\'avez pas encore créé de ticket'}</p>
                </div>
            `;
        } else {
            // Charger notifications pour tous les tickets
            const { data: notifications } = await window.supabaseClient
                .from('cm_support_notifications')
                .select('ticket_id')
                .eq('client_id', currentClient.id)
                .eq('lu', false);
            
            const notificationTicketIds = new Set(notifications?.map(n => n.ticket_id) || []);
            
            // Générer HTML pour chaque ticket
            gridContainer.innerHTML = allTickets.map(ticket => renderTicketCard(ticket, notificationTicketIds.has(ticket.id))).join('');
        }
        
        // Réinitialiser icônes
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur chargement tickets:', error);
        document.getElementById('ticketsGrid').innerHTML = `
            <div class="empty-state">
                <p style="color: #dc2626;">Erreur lors du chargement des tickets</p>
            </div>
        `;
    }
}

function renderTicketCard(ticket, hasNewResponse = false) {
    const timeAgo = getTimeAgo(ticket.created_at);
    const categoryLabels = {
        technique: '🔧 Technique',
        facturation: '💰 Facturation',
        fonctionnalite: '✨ Fonctionnalité',
        bug: '🐛 Bug',
        autre: '❓ Autre'
    };
    
    return `
        <div class="ticket-card ${hasNewResponse ? 'has-notification' : ''}">
            <div class="ticket-card-header">
                <div class="ticket-id" onclick="openTicketDetail('${ticket.id}')">#${ticket.id.substring(0, 8)}${hasNewResponse ? ' <span class="notification-dot">🔔</span>' : ''}</div>
                <div class="ticket-badges">
                    <span class="badge priority-${ticket.priorite}">${ticket.priorite}</span>
                    <span class="badge status-${ticket.statut}">${ticket.statut.replace(/_/g, ' ')}</span>
                    <button class="btn-delete-ticket" onclick="event.stopPropagation(); deleteTicket('${ticket.id}')" title="Supprimer le ticket">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="ticket-title" onclick="openTicketDetail('${ticket.id}')">${escapeHtml(ticket.sujet)}</div>
            <div class="ticket-description" onclick="openTicketDetail('${ticket.id}')">${escapeHtml(ticket.description)}</div>
            <div class="ticket-footer" onclick="openTicketDetail('${ticket.id}')">
                <div class="ticket-category">
                    <i data-lucide="tag"></i>
                    ${categoryLabels[ticket.categorie] || ticket.categorie}
                </div>
                <div class="ticket-date">${timeAgo}</div>
            </div>
        </div>
    `;
}

// ================================================================
// 📝 CRÉATION TICKET
// ================================================================
async function createTicket(e) {
    e.preventDefault();
    
    if (!currentClient) {
        showToast('❌ Erreur d\'authentification', 'error');
        return;
    }
    
    const category = document.getElementById('ticketCategory').value;
    const priority = document.getElementById('ticketPriority').value;
    const title = document.getElementById('ticketTitle').value.trim();
    const description = document.getElementById('ticketDescription').value.trim();
    
    if (!category || !title || !description) {
        showToast('⚠️ Veuillez remplir tous les champs', 'warning');
        return;
    }
    
    try {
        // Désactiver bouton
        const submitBtn = document.querySelector('#createTicketForm button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader"></i> Création...';
        lucide.createIcons();
        
        // Insérer ticket
        const { data: ticket, error } = await window.supabaseClient
            .from('cm_support_tickets')
            .insert([{
                client_id: currentClient.id,
                sujet: title,
                description: description,
                categorie: category,
                priorite: priority,
                statut: 'ouvert'
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // console.log('✅ Ticket créé, ID:', ticket.id);
        
        // 🤖 L'ANALYSE IA SE FAIT AUTOMATIQUEMENT VIA LE TRIGGER SQL
        // Le trigger auto_respond_to_ticket() analyse et répond instantanément
        // Pas besoin d'appel JavaScript - tout est géré côté serveur
        
        showToast('✅ Ticket créé ! Notre IA analyse votre demande...', 'success');
        
        // Réinitialiser form
        document.getElementById('createTicketForm').reset();
        document.getElementById('charCount').textContent = '0';
        
        // Recharger liste
        await loadTickets();
        
        // Réactiver bouton
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send"></i> Créer le ticket';
        lucide.createIcons();
        
        // Scroll vers la liste
        document.querySelector('.tickets-list-section').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('❌ Erreur création ticket:', error);
        console.error('Détails:', error.message, error.details, error.hint);
        showToast(`❌ Erreur: ${error.message || 'Erreur lors de la création'}`, 'error');
        
        // Réactiver bouton
        const submitBtn = document.querySelector('#createTicketForm button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send"></i> Créer le ticket';
        lucide.createIcons();
    }
}

// ================================================================
// 📄 DÉTAIL TICKET
// ================================================================
async function openTicketDetail(ticketId) {
    try {
        const ticket = allTickets.find(t => t.id === ticketId);
        if (!ticket) return;
        
        // Charger les commentaires/réponses
        const { data: comments, error: commentsError } = await window.supabaseClient
            .from('cm_support_comments')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        
        if (commentsError) {
            console.error('❌ Erreur chargement commentaires:', commentsError);
        }
        
        // Marquer les notifications comme lues
        await window.supabaseClient
            .from('cm_support_notifications')
            .update({ lu: true })
            .eq('ticket_id', ticketId)
            .eq('client_id', currentClient.id);
        
        const categoryLabels = {
            technique: '🔧 Technique',
            facturation: '💰 Facturation',
            fonctionnalite: '✨ Fonctionnalité',
            bug: '🐛 Bug',
            autre: '❓ Autre'
        };
        
        const isClosedTicket = ticket.statut === 'résolu' || ticket.statut === 'ferme';
        const canRate = ticket.statut === 'résolu' && !ticket.csat_score;
        const hasNewResponse = comments && comments.length > 0 && !isClosedTicket;
        
        const content = `
            <div class="ticket-detail-header">
                <div class="ticket-detail-title">${escapeHtml(ticket.sujet)}</div>
                <div class="ticket-detail-meta">
                    <div class="meta-item">
                        <i data-lucide="hash"></i>
                        Ticket #<span class="meta-value">${ticket.id.substring(0, 8)}</span>
                    </div>
                    <div class="meta-item">
                        <i data-lucide="tag"></i>
                        <span class="meta-value">${categoryLabels[ticket.categorie]}</span>
                    </div>
                    <div class="meta-item">
                        <i data-lucide="calendar"></i>
                        <span class="meta-value">${new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div class="meta-item">
                        <span class="badge status-${ticket.statut}">${ticket.statut.replace(/_/g, ' ')}</span>
                    </div>
                    <div class="meta-item">
                        <span class="badge priority-${ticket.priorite}">${ticket.priorite}</span>
                    </div>
                </div>
            </div>
            
            ${hasNewResponse ? '<div class="new-response-badge">📬 Nouvelle réponse disponible !</div>' : ''}
            
            <div class="conversation-section">
                <div class="conversation-message client">
                    <div class="message-label">Votre demande :</div>
                    <div class="message-content">${escapeHtml(ticket.description)}</div>
                    <div class="message-time">${new Date(ticket.created_at).toLocaleString('fr-FR')}</div>
                </div>
                
                ${comments && comments.length > 0 ? `
                    ${comments.map(comment => {
                        // Utiliser author_role pour différencier
                        const isClientMessage = comment.author_role === 'client';
                        const isAI = comment.is_ai_generated;
                        
                        return `
                            <div class="conversation-message ${isClientMessage ? 'client-reply' : 'support'} ${isAI ? 'ai' : ''}">
                                <div class="message-label">
                                    ${isClientMessage ? '👤 Vous' : (isAI ? '🤖 Réponse automatique IA' : '👨‍💼 Support')}
                                </div>
                                <div class="message-content">${escapeHtml(comment.content)}</div>
                                <div class="message-time">${new Date(comment.created_at).toLocaleString('fr-FR')}</div>
                            </div>
                        `;
                    }).join('')}
                ` : `
                    <div class="no-response">
                        <i data-lucide="clock"></i>
                        <p>En attente de réponse du support...</p>
                    </div>
                `}
            </div>
            
            ${!isClosedTicket ? `
                <div class="reply-section">
                    <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #1e293b;">
                        <i data-lucide="message-circle"></i>
                        Répondre
                    </h4>
                    <form onsubmit="sendClientReply(event, '${ticket.id}')" style="display: flex; flex-direction: column; gap: 12px;">
                        <textarea 
                            id="clientReplyText"
                            placeholder="Écrivez votre message..."
                            required
                            style="min-height: 100px; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical;"
                        ></textarea>
                        <button type="submit" class="btn-primary" style="align-self: flex-end;">
                            <i data-lucide="send"></i>
                            Envoyer
                        </button>
                    </form>
                </div>
            ` : `
                <div class="reopen-section" style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="margin-bottom: 12px; color: #92400e; font-weight: 600;">✅ Ce ticket est résolu</p>
                    <button onclick="reopenTicket('${ticket.id}')" class="btn-secondary" style="background: #f59e0b; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                        <i data-lucide="rotate-ccw"></i>
                        Ré-ouvrir le ticket
                    </button>
                    <p style="margin-top: 8px; font-size: 13px; color: #78350f;">Si le problème persiste ou vous avez besoin d&apos;aide supplémentaire</p>
                </div>
            `}
            
            ${canRate ? `
                <div class="rating-section">
                    <h4>
                        <i data-lucide="star"></i>
                        Notez votre expérience
                    </h4>
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
                        Comment évaluez-vous notre support ?
                    </p>
                    <div class="rating-stars" id="ratingStars">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <div class="star" data-rating="${star}" onclick="rateTicket('${ticket.id}', ${star})">
                                <i data-lucide="star"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ticket.csat_score ? `
                <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <strong style="color: #065f46;">✅ Merci pour votre évaluation !</strong>
                    <p style="font-size: 14px; color: #047857; margin: 4px 0 0 0;">
                        Note : ${'⭐'.repeat(ticket.csat_score)}
                    </p>
                </div>
            ` : ''}
            
            ${ticket.statut === 'en_attente_client' ? `
                <div class="response-section">
                    <h3>
                        <i data-lucide="message-circle"></i>
                        Répondre au ticket
                    </h3>
                    <form class="response-form" onsubmit="respondToTicket(event, ${ticket.id})">
                        <textarea 
                            id="responseText" 
                            placeholder="Écrivez votre réponse..."
                            required
                        ></textarea>
                        <button type="submit" class="btn-primary">
                            <i data-lucide="send"></i>
                            Envoyer ma réponse
                        </button>
                    </form>
                </div>
            ` : ''}
        `;
        
        document.getElementById('ticketDetailContent').innerHTML = content;
        document.getElementById('ticketModal').classList.add('active');
        lucide.createIcons();
        
        // Recharger la liste pour mettre à jour le badge
        await loadTickets();
        
    } catch (error) {
        console.error('❌ Erreur ouverture détail:', error);
    }
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('active');
}

window.openTicketDetail = openTicketDetail;
window.closeTicketModal = closeTicketModal;

// ================================================================
// ⭐ NOTATION TICKET
// ================================================================
async function rateTicket(ticketId, rating) {
    try {
        const { error } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                csat_score: rating,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        
        if (error) throw error;
        
        showToast(`✅ Merci pour votre évaluation ! (${'⭐'.repeat(rating)})`, 'success');
        
        // Recharger
        await loadTickets();
        closeTicketModal();
        
    } catch (error) {
        console.error('❌ Erreur notation:', error);
        showToast('❌ Erreur lors de la notation', 'error');
    }
}

window.rateTicket = rateTicket;

// ================================================================
// 💬 RÉPONSE CLIENT AU TICKET
// ================================================================
async function sendClientReply(e, ticketId) {
    e.preventDefault();
    
    const textarea = document.getElementById('clientReplyText');
    const replyText = textarea.value.trim();
    
    if (!replyText) return;
    
    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader"></i> Envoi...';
        lucide.createIcons();
        
        // Insérer le commentaire du client
        const { error: commentError } = await window.supabaseClient
            .from('cm_support_comments')
            .insert({
                ticket_id: ticketId,
                user_id: currentUser.id, // ID auth.users, pas cm_clients
                content: replyText,
                is_internal: false,
                is_ai_generated: false,
                author_role: 'client'
            });
        
        if (commentError) throw commentError;
        
        // Mettre le ticket en "en_cours" si c'était "en_attente_client"
        const { error: updateError } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                statut: 'en_cours',
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .eq('statut', 'en_attente_client');
        
        if (updateError) throw updateError;
        
        showToast('✅ Votre message a été envoyé !');
        
        // Recharger le détail du ticket
        await openTicketDetail(ticketId);
        
    } catch (error) {
        console.error('❌ Erreur envoi réponse:', error);
        showToast('❌ Erreur lors de l\'envoi de votre message');
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="send"></i> Envoyer';
        lucide.createIcons();
    }
}

window.sendClientReply = sendClientReply;

// ================================================================
// � RÉ-OUVRIR TICKET
// ================================================================
async function reopenTicket(ticketId) {
    if (!confirm("Voulez-vous ré-ouvrir ce ticket ?")) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                statut: 'ouvert',
                resolved_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        
        if (error) throw error;
        
        showToast("✅ Ticket ré-ouvert ! Vous pouvez continuer la conversation.");
        
        // Recharger
        await loadTickets();
        await openTicketDetail(ticketId);
        
    } catch (error) {
        console.error('❌ Erreur ré-ouverture:', error);
        showToast("❌ Erreur lors de la ré-ouverture");
    }
}

window.reopenTicket = reopenTicket;

// ================================================================
// �💬 RÉPONSE TICKET (ANCIENNE FONCTION - CONSERVÉE)
// ================================================================
async function respondToTicket(e, ticketId) {
    e.preventDefault();
    
    const responseText = document.getElementById('responseText').value.trim();
    
    if (!responseText) {
        showToast('⚠️ Veuillez écrire une réponse', 'warning');
        return;
    }
    
    try {
        // Pour l'instant, on met juste à jour le statut
        // Plus tard, on pourra créer une table cm_ticket_messages
        const { error } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                statut: 'en_cours',
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        
        if (error) throw error;
        
        showToast('✅ Réponse envoyée !', 'success');
        
        // Recharger
        await loadTickets();
        closeTicketModal();
        
    } catch (error) {
        console.error('❌ Erreur réponse:', error);
        showToast('❌ Erreur lors de l\'envoi', 'error');
    }
}

window.respondToTicket = respondToTicket;

// ================================================================
// 🎛️ EVENT LISTENERS
// ================================================================
function setupEventListeners() {
    // Form création ticket
    const form = document.getElementById('createTicketForm');
    if (form) {
        form.addEventListener('submit', createTicket);
    }
    
    // Reset form
    const btnReset = document.getElementById('btnResetForm');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            form.reset();
            document.getElementById('charCount').textContent = '0';
        });
    }
    
    // Compteur caractères
    const descriptionField = document.getElementById('ticketDescription');
    if (descriptionField) {
        descriptionField.addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('charCount').textContent = count;
            
            if (count > 1000) {
                e.target.value = e.target.value.substring(0, 1000);
                document.getElementById('charCount').textContent = '1000';
            }
        });
    }
    
    // Filtre statut
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            loadTickets();
        });
    }
    
    // Déconnexion
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            window.location.href = '../index.html';
        });
    }
    
    // Fermer modal sur Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTicketModal();
        }
    });
}

// ================================================================
// 🍞 TOAST
// ================================================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) {
        console.warn('⚠️ Toast element not found');
        alert(message);
        return;
    }
    
    toastMessage.textContent = message;
    
    // Changer couleur selon type
    const icon = toast.querySelector('i');
    if (type === 'error') {
        toast.style.borderColor = '#ef4444';
        if (icon) icon.style.color = '#ef4444';
    } else if (type === 'warning') {
        toast.style.borderColor = '#f59e0b';
        if (icon) icon.style.color = '#f59e0b';
    } else {
        toast.style.borderColor = '#10b981';
        if (icon) icon.style.color = '#10b981';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// ================================================================
// 🛠️ UTILITAIRES
// ================================================================

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ================================================================
// 🗑️ SUPPRIMER TICKET
// ================================================================
async function deleteTicket(ticketId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.")) return;
    
    try {
        // Utiliser la fonction PostgreSQL qui gère tout avec SECURITY DEFINER
        const { data, error } = await window.supabaseClient
            .rpc('delete_ticket_with_dependencies', {
                p_ticket_id: ticketId
            });
        
        if (error) throw error;
        
        showToast('✅ Ticket supprimé avec succès', 'success');
        
        // Fermer le modal si ouvert
        closeTicketModal();
        
        // Recharger la liste
        await loadTickets();
        
    } catch (error) {
        console.error('❌ Erreur suppression ticket:', error);
        showToast('❌ Erreur lors de la suppression', 'error');
    }
}

window.deleteTicket = deleteTicket;

// console.log('✅ Module Support Client chargé');
