// ================================================================
// 🎫 MODULE SUPPORT & TICKETS - JavaScript
// ================================================================

let currentPage = 1;
const itemsPerPage = 20;
let totalTickets = 0;
let currentFilters = {
    search: '',
    status: '',
    priority: '',
    category: ''
};
let currentSort = 'created_at_desc';
let selectedTicketId = null;
let currentUser = null; // Utilisateur authentifié

// ================================================================
// 🔐 INITIALISATION
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎫 Initialisation Module Support');
    
    // Vérifier auth
    await checkAuth();
    
    // Charger données
    await loadStats();
    await loadTickets();
    await loadAnalytics();
    await loadKnowledgeBase();
    
    // Setup événements
    setupEventListeners();
    
    // Temps réel
    setupRealtime();
    
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
        
        // Stocker utilisateur
        currentUser = user;
        
        // Vérifier admin
        if (user.email !== 'stephanecalvignac@hotmail.fr') {
            alert('⛔ Accès refusé - Admin uniquement');
            window.location.href = '../index.html';
            return;
        }
        
        document.getElementById('userEmail').textContent = user.email;
        
    } catch (err) {
        console.error('❌ Erreur auth:', err);
        window.location.href = '../index.html';
    }
}

// ================================================================
// 📊 STATS RAPIDES
// ================================================================
async function loadStats() {
    try {
        // Tickets ouverts
        const { count: openCount } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('*', { count: 'exact', head: true })
            .in('statut', ['ouvert', 'en_cours']);
        
        document.getElementById('statOpen').textContent = openCount || 0;
        
        // Tickets en attente client
        const { count: pendingCount } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('statut', 'en_attente_client');
        
        document.getElementById('statPending').textContent = pendingCount || 0;
        
        // Temps moyen de réponse (en heures)
        const { data: tickets } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('created_at, updated_at')
            .in('statut', ['resolu', 'ferme'])
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (tickets && tickets.length > 0) {
            const avgHours = tickets.reduce((sum, t) => {
                const created = new Date(t.created_at);
                const updated = new Date(t.updated_at);
                const hours = (updated - created) / (1000 * 60 * 60);
                return sum + hours;
            }, 0) / tickets.length;
            
            document.getElementById('statResponseTime').textContent = `${Math.round(avgHours)}h`;
        } else {
            document.getElementById('statResponseTime').textContent = 'N/A';
        }
        
        // CSAT moyen
        const { data: csatScores } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('csat_score')
            .not('csat_score', 'is', null);
        
        if (csatScores && csatScores.length > 0) {
            const avgCSAT = csatScores.reduce((sum, t) => sum + t.csat_score, 0) / csatScores.length;
            document.getElementById('statCSAT').textContent = `${avgCSAT.toFixed(1)}/5`;
        } else {
            document.getElementById('statCSAT').textContent = 'N/A';
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
    }
}

// ================================================================
// 📋 LISTE TICKETS
// ================================================================
async function loadTickets() {
    try {
        const listContainer = document.getElementById('ticketsList');
        listContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Chargement des tickets...</p></div>';
        
        // Construire query
        let query = window.supabaseClient
            .from('cm_support_tickets')
            .select('*, cm_clients!inner(email_principal, nom_entreprise, user_id)', { count: 'exact' });
        
        // Filtres
        if (currentFilters.search) {
            query = query.or(`sujet.ilike.%${currentFilters.search}%,description.ilike.%${currentFilters.search}%`);
        }
        if (currentFilters.status) {
            query = query.eq('statut', currentFilters.status);
        }
        if (currentFilters.priority) {
            query = query.eq('priorite', currentFilters.priority);
        }
        if (currentFilters.category) {
            query = query.eq('categorie', currentFilters.category);
        }
        
        // Tri
        const [sortField, sortOrder] = currentSort.split('_');
        const ascending = sortOrder !== 'desc';
        
        // Mapper les champs de tri aux colonnes réelles
        const sortFieldMap = {
            'created': 'created_at',
            'updated': 'updated_at',
            'priority': 'priorite'
        };
        
        const actualSortField = sortFieldMap[sortField] || sortField;
        
        if (sortField === 'priority') {
            // Tri priorité : critique > haute > normale > basse
            query = query.order('priorite', { ascending });
        } else {
            query = query.order(actualSortField, { ascending });
        }
        
        // Pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
        
        const { data: tickets, error, count } = await query;
        
        if (error) throw error;
        
        totalTickets = count || 0;
        
        // Afficher résultats
        if (!tickets || tickets.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; color: #ccc;"></i>
                    <p>Aucun ticket trouvé</p>
                </div>
            `;
        } else {
            listContainer.innerHTML = tickets.map(ticket => renderTicketItem(ticket)).join('');
        }
        
        // Update count
        document.getElementById('ticketCount').textContent = `(${totalTickets})`;
        
        // Update pagination
        updatePagination();
        
        // Réinitialiser icônes
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur chargement tickets:', error);
        document.getElementById('ticketsList').innerHTML = `
            <div class="empty-state">
                <p style="color: #dc2626;">Erreur de chargement</p>
            </div>
        `;
    }
}

function renderTicketItem(ticket) {
    const sentiment = analyzeSentiment(ticket.description);
    const timeAgo = getTimeAgo(ticket.created_at);
    const clientName = ticket.cm_clients?.nom_entreprise || ticket.cm_clients?.email_principal || 'Client';
    
    return `
        <div class="ticket-item ${selectedTicketId === ticket.id ? 'active' : ''}" 
             onclick="selectTicket('${ticket.id}')"
             data-ticket-id="${ticket.id}">
            <div class="ticket-header">
                <div class="ticket-id">#${ticket.id.substring(0, 8)}</div>
                <div class="ticket-badges">
                    <span class="badge priority-${ticket.priorite}">${ticket.priorite}</span>
                    <span class="badge status-${ticket.statut}">${ticket.statut.replace('_', ' ')}</span>
                </div>
            </div>
            <div class="ticket-title">${escapeHtml(ticket.sujet)}</div>
            <div class="ticket-meta">
                <div class="ticket-client">
                    <i data-lucide="user"></i>
                    <span>${escapeHtml(clientName)}</span>
                </div>
                <div class="ticket-time">
                    <i data-lucide="clock"></i>
                    <span>${timeAgo}</span>
                </div>
                <div class="ticket-sentiment ${sentiment}">
                    <i data-lucide="${sentiment === 'positive' ? 'smile' : sentiment === 'negative' ? 'frown' : 'meh'}"></i>
                    ${sentiment}
                </div>
            </div>
        </div>
    `;
}

async function selectTicket(ticketId) {
    try {
        selectedTicketId = ticketId;
        
        // Mettre à jour UI liste
        document.querySelectorAll('.ticket-item').forEach(item => {
            item.classList.toggle('active', item.dataset.ticketId === ticketId);
        });
        
        // Charger détails ticket
        const { data: ticket, error } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('*, cm_clients!inner(email_principal, nom_entreprise, telephone)')
            .eq('id', ticketId)
            .single();
        
        if (error) throw error;
        
        // Charger commentaires/messages
        const { data: comments, error: commentsError } = await window.supabaseClient
            .from('cm_support_comments')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        
        if (commentsError) throw commentsError;
        
        // Afficher détails avec commentaires
        const detailPanel = document.getElementById('ticketDetailPanel');
        detailPanel.innerHTML = renderTicketDetail(ticket, comments || []);
        
        // Réinitialiser icônes
        lucide.createIcons();
        
        // Setup événements détail
        setupTicketDetailEvents(ticket);
        
    } catch (error) {
        console.error('❌ Erreur sélection ticket:', error);
    }
}

function renderTicketDetail(ticket, comments = []) {
    const sentiment = analyzeSentiment(ticket.description);
    const aiSuggestions = generateAISuggestions(ticket);
    
    return `
        <div class="ticket-detail-header">
            <div class="ticket-detail-title">${escapeHtml(ticket.sujet)}</div>
            <div class="ticket-detail-meta">
                <div class="meta-item">
                    <i data-lucide="hash"></i>
                    Ticket #<span class="meta-value">${ticket.id.substring(0, 8)}</span>
                </div>
                <div class="meta-item">
                    <i data-lucide="user"></i>
                    <span class="meta-value">${escapeHtml(ticket.cm_clients.nom_entreprise || ticket.cm_clients.email_principal)}</span>
                </div>
                <div class="meta-item">
                    <i data-lucide="mail"></i>
                    <span class="meta-value">${escapeHtml(ticket.cm_clients.email_principal)}</span>
                </div>
                <div class="meta-item">
                    <i data-lucide="calendar"></i>
                    <span class="meta-value">${new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="meta-item">
                    <i data-lucide="tag"></i>
                    <span class="meta-value">${ticket.categorie}</span>
                </div>
            </div>
            <div class="ticket-actions">
                <button class="btn-action" onclick="changeTicketStatus('${ticket.id}', 'en_cours')">
                    <i data-lucide="play-circle"></i>
                    Prendre en charge
                </button>
                <button class="btn-action" onclick="changeTicketStatus('${ticket.id}', 'en_attente')">
                    <i data-lucide="clock"></i>
                    En attente client
                </button>
                <button class="btn-action primary" onclick="changeTicketStatus('${ticket.id}', 'résolu')">
                    <i data-lucide="check-circle"></i>
                    Marquer résolu
                </button>
            </div>
        </div>
        
        <div class="ticket-conversation">
            <!-- Message initial client -->
            <div class="conversation-message">
                <div class="message-avatar client">${ticket.cm_clients.nom_entreprise?.charAt(0) || 'C'}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${escapeHtml(ticket.cm_clients.nom_entreprise || 'Client')}</span>
                        <span class="message-time">${getTimeAgo(ticket.created_at)}</span>
                    </div>
                    <div class="message-body">${escapeHtml(ticket.description)}</div>
                </div>
            </div>
            
            <!-- Réponses -->
            ${comments.map(comment => {
                // Utiliser author_role pour différencier
                const isClientMessage = comment.author_role === 'client';
                const isAI = comment.is_ai_generated;
                
                return `
                    <div class="conversation-message ${isClientMessage ? 'client' : (isAI ? 'ai' : 'admin')}">
                        <div class="message-avatar ${isClientMessage ? 'client' : (isAI ? 'ai' : 'admin')}">
                            ${isClientMessage ? '👤' : (isAI ? '🤖' : 'A')}
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="message-author">${isClientMessage ? 'Client' : (isAI ? 'IA Support' : 'Vous (Support)')}</span>
                                <span class="message-time">${getTimeAgo(comment.created_at)}</span>
                            </div>
                            <div class="message-body">${escapeHtml(comment.content)}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        ${aiSuggestions.length > 0 ? `
            <div class="ai-suggestions">
                <div class="ai-suggestions-header">
                    <i data-lucide="sparkles"></i>
                    <h4>💡 Réponses IA Suggérées</h4>
                </div>
                ${aiSuggestions.map((suggestion, i) => `
                    <div class="suggestion-item" onclick="useSuggestion(${i})">
                        ${suggestion}
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="reply-form">
            <textarea id="replyText" placeholder="Écrivez votre réponse..."></textarea>
            <div class="reply-actions">
                <div class="reply-options">
                    <button class="btn-reply-option" onclick="insertTemplate('greeting')">
                        <i data-lucide="smile"></i>
                        Salutation
                    </button>
                    <button class="btn-reply-option" onclick="insertTemplate('closing')">
                        <i data-lucide="check"></i>
                        Clôture
                    </button>
                    ${ticket.statut !== 'résolu' ? `
                        <button class="btn-close-ticket" onclick="closeTicket('${ticket.id}')" style="background: #10b981; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="check-circle"></i>
                            Clôturer le ticket
                        </button>
                    ` : ''}
                </div>
                <button class="btn-send-reply" onclick="sendReply('${ticket.id}')">
                    <i data-lucide="send"></i>
                    Envoyer
                </button>
            </div>
        </div>
    `;
}

function setupTicketDetailEvents(ticket) {
    // Stocker suggestions globalement pour useSuggestion()
    window.currentSuggestions = generateAISuggestions(ticket);
}

// ================================================================
// 🤖 ANALYSE SENTIMENT & IA
// ================================================================
function analyzeSentiment(text) {
    if (!text) return 'neutral';
    
    const textLower = text.toLowerCase();
    
    // Mots négatifs
    const negativeWords = ['bug', 'erreur', 'problème', 'impossible', 'ne fonctionne pas', 'urgent', 'critique', 'bloqué', 'frustré', 'déçu'];
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    
    // Mots positifs
    const positiveWords = ['merci', 'super', 'génial', 'parfait', 'excellent', 'satisfait', 'content', 'rapide'];
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    
    if (negativeCount > positiveCount + 1) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
}

function generateAISuggestions(ticket) {
    const suggestions = [];
    const category = ticket.categorie;
    const description = ticket.description?.toLowerCase() || '';
    
    // Suggestions selon catégorie
    if (category === 'technique') {
        if (description.includes('synchronisation') || description.includes('sync')) {
            suggestions.push("Bonjour, je comprends votre problème de synchronisation. Pouvez-vous vérifier que l'URL iCal est correcte et que les autorisations sont bien configurées dans votre Channel Manager ?");
        }
        if (description.includes('calendrier')) {
            suggestions.push("Merci pour votre retour. Les mises à jour du calendrier peuvent prendre jusqu'à 15 minutes. Avez-vous essayé de forcer la synchronisation ?");
        }
        suggestions.push("Je vous suggère de consulter notre documentation technique : [Lien vers doc]. Si le problème persiste, je peux programmer un appel avec notre équipe technique.");
    }
    
    if (category === 'facturation') {
        suggestions.push("Bonjour, concernant votre facture, je vais vérifier immédiatement. Pouvez-vous me préciser le numéro de facture concerné ?");
        suggestions.push("Votre prochaine facture sera générée le [date]. Vous pouvez consulter l'historique dans votre espace client > Facturation.");
    }
    
    if (category === 'fonctionnalite') {
        suggestions.push("Merci pour cette suggestion ! Nous prenons note de votre demande de fonctionnalité. Je la transmets à notre équipe produit.");
        suggestions.push("Cette fonctionnalité est prévue dans notre roadmap pour le trimestre prochain. Je vous tiendrai informé de l'avancement.");
    }
    
    // Suggestion générique si aucune spécifique
    if (suggestions.length === 0) {
        suggestions.push("Bonjour, merci d'avoir contacté le support. Je prends en charge votre demande et reviens vers vous rapidement avec une solution.");
    }
    
    return suggestions;
}

window.useSuggestion = function(index) {
    const textarea = document.getElementById('replyText');
    if (textarea && window.currentSuggestions) {
        textarea.value = window.currentSuggestions[index];
    }
};

window.insertTemplate = function(type) {
    const textarea = document.getElementById('replyText');
    if (!textarea) return;
    
    const templates = {
        greeting: "Bonjour,\n\nMerci d'avoir contacté notre support. ",
        closing: "\n\nN'hésitez pas si vous avez d'autres questions.\n\nCordialement,\nL'équipe Welcome Home"
    };
    
    const template = templates[type] || '';
    const currentValue = textarea.value;
    
    if (type === 'greeting') {
        textarea.value = template + currentValue;
    } else {
        textarea.value = currentValue + template;
    }
};

// ================================================================
// 🔒 CLÔTURE TICKET
// ================================================================
window.closeTicket = async function(ticketId) {
    if (!confirm('Voulez-vous clôturer ce ticket ?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                statut: 'résolu',
                resolved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        
        if (error) throw error;
        
        alert('✅ Ticket clôturé !');
        
        await loadTickets();
        await loadStats();
        await selectTicket(ticketId);
        
    } catch (error) {
        console.error('❌ Erreur clôture ticket:', error);
        alert('❌ Erreur lors de la clôture');
    }
};

window.sendReply = async function(ticketId) {
    const textarea = document.getElementById('replyText');
    const reply = textarea.value.trim();
    
    if (!reply) {
        alert('⚠️ Veuillez écrire une réponse');
        return;
    }
    
    try {
        // 1. Enregistrer commentaire dans cm_support_comments
        const { data: comment, error: commentError } = await window.supabaseClient
            .from('cm_support_comments')
            .insert([{
                ticket_id: ticketId,
                user_id: currentUser.id,
                content: reply,
                is_internal: false,
                is_ai_generated: false,
                author_role: 'admin'
            }])
            .select()
            .single();
        
        if (commentError) throw commentError;
        
        console.log('✅ Commentaire enregistré:', comment.id);
        
        // 2. Mettre à jour statut ticket
        const { error: ticketError } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                statut: 'en_attente',
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        
        if (ticketError) throw ticketError;
        
        alert('✅ Réponse envoyée !');
        textarea.value = '';
        
        // Recharger tickets et affichage
        await loadTickets();
        await loadStats();
        await selectTicket(ticketId); // Recharger le détail
        
    } catch (error) {
        console.error('❌ Erreur envoi réponse:', error);
        alert('❌ Erreur lors de l\'envoi: ' + error.message);
    }
};

window.changeTicketStatus = async function(ticketId, newStatus) {
    try {
        const updateData = {
            statut: newStatus,
            updated_at: new Date().toISOString()
        };
        
        // Si résolu, mettre resolved_at
        if (newStatus === 'résolu') {
            updateData.resolved_at = new Date().toISOString();
        }
        
        const { error } = await window.supabaseClient
            .from('cm_support_tickets')
            .update(updateData)
            .eq('id', ticketId);
        
        if (error) throw error;
        
        alert(`✅ Statut changé : ${newStatus}`);
        console.log('🧠 Statut changé vers:', newStatus);
        
        // Recharger
        await loadTickets();
        await selectTicket(ticketId);
        await loadStats();
        
    } catch (error) {
        console.error('❌ Erreur changement statut:', error);
        alert('❌ Erreur lors du changement de statut');
    }
};

// ================================================================
// 📊 ANALYTICS
// ================================================================
async function loadAnalytics() {
    await loadResolutionTimeChart();
    await loadCSATTrendChart();
    await loadTopProblems();
    await loadHeatmap();
}

async function loadResolutionTimeChart() {
    try {
        const { data: tickets } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('created_at, updated_at, statut')
            .in('statut', ['resolu', 'ferme'])
            .order('created_at', { ascending: false })
            .limit(100);
        
        if (!tickets || tickets.length === 0) return;
        
        // Calculer temps résolution par jour
        const dailyData = {};
        tickets.forEach(ticket => {
            const date = new Date(ticket.created_at).toLocaleDateString('fr-FR');
            const hours = (new Date(ticket.updated_at) - new Date(ticket.created_at)) / (1000 * 60 * 60);
            
            if (!dailyData[date]) {
                dailyData[date] = { sum: 0, count: 0 };
            }
            dailyData[date].sum += hours;
            dailyData[date].count += 1;
        });
        
        const labels = Object.keys(dailyData).slice(0, 10).reverse();
        const data = labels.map(date => (dailyData[date].sum / dailyData[date].count).toFixed(1));
        
        // Chart
        const ctx = document.getElementById('resolutionTimeChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Temps moyen (heures)',
                        data,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ Erreur chart résolution:', error);
    }
}

async function loadCSATTrendChart() {
    try {
        const { data: tickets } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('created_at, csat_score')
            .not('csat_score', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (!tickets || tickets.length === 0) return;
        
        // Grouper par semaine
        const weeklyData = {};
        tickets.forEach(ticket => {
            const week = getWeekNumber(new Date(ticket.created_at));
            if (!weeklyData[week]) {
                weeklyData[week] = { sum: 0, count: 0 };
            }
            weeklyData[week].sum += ticket.csat_score;
            weeklyData[week].count += 1;
        });
        
        const labels = Object.keys(weeklyData).slice(0, 8).reverse();
        const data = labels.map(week => (weeklyData[week].sum / weeklyData[week].count).toFixed(1));
        
        const ctx = document.getElementById('csatTrendChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'CSAT moyen',
                        data,
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 5
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('❌ Erreur chart CSAT:', error);
    }
}

async function loadTopProblems() {
    try {
        const { data: tickets } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('categorie')
            .order('created_at', { ascending: false })
            .limit(200);
        
        if (!tickets || tickets.length === 0) return;
        
        // Compter par catégorie
        const categoryCounts = {};
        tickets.forEach(ticket => {
            categoryCounts[ticket.categorie] = (categoryCounts[ticket.categorie] || 0) + 1;
        });
        
        // Trier et prendre top 5
        const topProblems = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const maxCount = topProblems[0]?.[1] || 1;
        
        const html = topProblems.map(([category, count], index) => {
            const percentage = (count / maxCount) * 100;
            return `
                <div class="problem-item">
                    <div class="problem-rank">${index + 1}</div>
                    <div class="problem-content">
                        <div class="problem-title">${category}</div>
                        <div class="problem-count">${count} tickets</div>
                    </div>
                    <div class="problem-bar">
                        <div class="problem-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('topProblemsList').innerHTML = html || '<p style="color: #94a3b8; text-align: center;">Aucune donnée</p>';
        
    } catch (error) {
        console.error('❌ Erreur top problèmes:', error);
    }
}

async function loadHeatmap() {
    try {
        const { data: tickets } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('created_at')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });
        
        if (!tickets || tickets.length === 0) {
            document.getElementById('heatmapContainer').innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">Aucune donnée disponible</p>';
            return;
        }
        
        // Compter par jour de la semaine
        const dayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        tickets.forEach(ticket => {
            const day = new Date(ticket.created_at).getDay();
            dayCounts[day]++;
        });
        
        const maxCount = Math.max(...Object.values(dayCounts));
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        
        const html = `
            <div class="heatmap-grid">
                ${Object.entries(dayCounts).map(([day, count]) => {
                    const level = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);
                    return `
                        <div class="heatmap-day level-${level}">
                            <div class="heatmap-day-name">${dayNames[day]}</div>
                            <div class="heatmap-day-count">${count}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        document.getElementById('heatmapContainer').innerHTML = html;
        
    } catch (error) {
        console.error('❌ Erreur heatmap:', error);
    }
}

// ================================================================
// 📚 BASE DE CONNAISSANCE
// ================================================================
async function loadKnowledgeBase() {
    try {
        // Pour l'instant, données en dur (à remplacer par vraie table si besoin)
        const articles = [
            {
                id: 1,
                title: "Comment configurer la synchronisation iCal ?",
                category: "technique",
                excerpt: "Guide complet pour configurer la synchronisation de votre calendrier avec les principales plateformes...",
                tags: ["ical", "synchronisation", "calendrier"],
                views: 342,
                date: "2026-01-15"
            },
            {
                id: 2,
                title: "Comprendre votre facture mensuelle",
                category: "facturation",
                excerpt: "Détail de tous les éléments présents sur votre facture et comment sont calculés vos frais...",
                tags: ["facturation", "abonnement", "paiement"],
                views: 189,
                date: "2026-01-20"
            },
            {
                id: 3,
                title: "Résoudre les erreurs de synchronisation",
                category: "technique",
                excerpt: "Les erreurs les plus courantes et leurs solutions : timeout, URL invalide, accès refusé...",
                tags: ["erreur", "debug", "synchronisation"],
                views: 456,
                date: "2026-01-10"
            },
            {
                id: 4,
                title: "Configurer les notifications automatiques",
                category: "fonctionnalite",
                excerpt: "Paramétrez vos alertes pour être notifié en temps réel des nouvelles réservations...",
                tags: ["notifications", "email", "alertes"],
                views: 234,
                date: "2026-01-18"
            },
            {
                id: 5,
                title: "Bug connu : Double réservation",
                category: "bug",
                excerpt: "Explication du bug de double réservation et solution temporaire en attendant le correctif...",
                tags: ["bug", "réservation", "calendrier"],
                views: 567,
                date: "2026-01-22"
            }
        ];
        
        // Update counts
        const categoryCounts = {};
        articles.forEach(article => {
            categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
        });
        
        document.getElementById('kbCountAll').textContent = articles.length;
        document.getElementById('kbCountTechnique').textContent = categoryCounts.technique || 0;
        document.getElementById('kbCountFacturation').textContent = categoryCounts.facturation || 0;
        document.getElementById('kbCountFonctionnalite').textContent = categoryCounts.fonctionnalite || 0;
        document.getElementById('kbCountBug').textContent = categoryCounts.bug || 0;
        
        // Render articles
        renderKBArticles(articles);
        
    } catch (error) {
        console.error('❌ Erreur KB:', error);
    }
}

function renderKBArticles(articles) {
    const html = articles.map(article => `
        <div class="kb-article" onclick="openKBArticle(${article.id})">
            <div class="kb-article-header">
                <div class="kb-article-title">${escapeHtml(article.title)}</div>
                <div class="kb-article-icon">
                    <i data-lucide="file-text"></i>
                </div>
            </div>
            <div class="kb-article-excerpt">${escapeHtml(article.excerpt)}</div>
            <div class="kb-article-tags">
                ${article.tags.map(tag => `<span class="kb-tag">${tag}</span>`).join('')}
            </div>
            <div class="kb-article-meta">
                <div class="kb-article-date">
                    <i data-lucide="calendar"></i>
                    ${new Date(article.date).toLocaleDateString('fr-FR')}
                </div>
                <div class="kb-article-views">
                    <i data-lucide="eye"></i>
                    ${article.views} vues
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('kbArticles').innerHTML = html;
    lucide.createIcons();
}

window.openKBArticle = function(articleId) {
    alert(`📄 Article ${articleId} - Fonctionnalité complète à venir`);
};

// ================================================================
// 🎛️ EVENT LISTENERS
// ================================================================
function setupEventListeners() {
    // Recherche
    document.getElementById('searchTickets').addEventListener('input', debounce((e) => {
        currentFilters.search = e.target.value;
        currentPage = 1;
        loadTickets();
    }, 500));
    
    // Filtres
    document.getElementById('filterStatus').addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        currentPage = 1;
        loadTickets();
    });
    
    document.getElementById('filterPriority').addEventListener('change', (e) => {
        currentFilters.priority = e.target.value;
        currentPage = 1;
        loadTickets();
    });
    
    document.getElementById('filterCategory').addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        currentPage = 1;
        loadTickets();
    });
    
    // Clear filters
    document.getElementById('btnClearFilters').addEventListener('click', () => {
        currentFilters = { search: '', status: '', priority: '', category: '' };
        document.getElementById('searchTickets').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterPriority').value = '';
        document.getElementById('filterCategory').value = '';
        currentPage = 1;
        loadTickets();
    });
    
    // Tri
    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort = e.target.value;
        loadTickets();
    });
    
    // Pagination
    document.getElementById('btnPrevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTickets();
        }
    });
    
    document.getElementById('btnNextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(totalTickets / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            loadTickets();
        }
    });
    
    // Déconnexion
    document.getElementById('btnLogout').addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = '../index.html';
    });
    
    // Modal nouvel article
    document.getElementById('btnAddArticle').addEventListener('click', () => {
        document.getElementById('articleModal').classList.add('active');
    });
    
    document.getElementById('articleModalClose').addEventListener('click', () => {
        document.getElementById('articleModal').classList.remove('active');
    });
    
    document.getElementById('btnCancelArticle').addEventListener('click', () => {
        document.getElementById('articleModal').classList.remove('active');
    });
    
    document.getElementById('articleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        alert('✅ Article enregistré ! (Fonctionnalité complète à venir)');
        document.getElementById('articleModal').classList.remove('active');
    });
    
    // KB Search
    document.getElementById('searchKB').addEventListener('input', debounce((e) => {
        // Filtrer articles selon recherche (à implémenter)
    }, 300));
    
    // KB Categories
    document.querySelectorAll('.kb-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.kb-category').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            // Filtrer articles (à implémenter)
        });
    });
}

function updatePagination() {
    const totalPages = Math.ceil(totalTickets / itemsPerPage);
    
    document.getElementById('btnPrevPage').disabled = currentPage === 1;
    document.getElementById('btnNextPage').disabled = currentPage >= totalPages;
    document.getElementById('pageInfo').textContent = `Page ${currentPage} sur ${totalPages}`;
}

// ================================================================
// ⏱️ TEMPS RÉEL
// ================================================================
function setupRealtime() {
    // Écouter nouveaux tickets
    const subscription = window.supabaseClient
        .channel('support-tickets')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'cm_support_tickets' },
            (payload) => {
                console.log('🔔 Changement ticket:', payload);
                loadTickets();
                loadStats();
            }
        )
        .subscribe();
}

// ================================================================
// 🛠️ UTILITAIRES
// ================================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
    return new Date(date).toLocaleDateString('fr-FR');
}

function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `S${weekNo}`;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

console.log('✅ Module Support chargé');
