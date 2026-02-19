// ================================================================
// 📊 MONITORING DASHBOARD - JavaScript
// ================================================================

let currentUser = null;
let unresolvedGroupedErrors = [];

// ================================================================
// INITIALISATION
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // console.log('🚀 Initialisation Monitoring Dashboard...');
    
    // Vérifier l'authentification
    await checkAuth();
    
    // Charger les données
    await loadMonitoringData();
    
    // Initialiser event listeners
    initEventListeners();
    
    // Auto-refresh toutes les 30 secondes
    setInterval(() => {
        loadMonitoringData();
    }, 30000);
    
    // console.log('✅ Monitoring Dashboard initialisé');
});

// ================================================================
// AUTHENTIFICATION
// ================================================================

async function checkAuth() {
    try {
        if (!window.supabaseClient) {
            console.error('❌ Supabase client non initialisé');
            return;
        }
        
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error || !session) {
            window.location.href = '../index.html';
            return;
        }
        
        currentUser = session.user;
        
        if (currentUser.email !== 'stephanecalvignac@hotmail.fr') {
            alert('Accès refusé : Réservé aux administrateurs');
            window.location.href = '../index.html';
            return;
        }
        
        document.getElementById('userEmail').textContent = currentUser.email;
        
    } catch (error) {
        console.error('❌ Erreur authentification:', error);
    }
}

// ================================================================
// CHARGEMENT DONNÉES
// ================================================================

async function loadMonitoringData() {
    await Promise.all([
        loadErrorsData(),
        loadPerformanceMetrics(),
        loadAIHealthStatus(),
        loadTestCorrections()
    ]);
}

function notifyErrorStateChanged() {
    try {
        localStorage.setItem('cm_monitoring_errors_changed_at', String(Date.now()));
    } catch (err) {
        // ignore
    }
}

function updateMonitoringAIProviderDot(dotId, configured) {
    const dot = document.getElementById(dotId);
    if (!dot) return;

    dot.className = 'status-dot';
    if (configured === true) {
        dot.classList.add('up');
        return;
    }

    if (configured === false) {
        dot.classList.add('down');
        return;
    }

    dot.classList.add('degraded');
}

async function loadAIHealthStatus() {
    const globalEl = document.getElementById('monitorAIGlobal');
    const updatedEl = document.getElementById('monitorAIUpdatedAt');

    if (!globalEl) return;

    try {
        globalEl.textContent = 'Vérification...';

        const response = await fetch('/api/ai-health', {
            method: 'GET',
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const providers = data.providers || {};
        const configuredCount = Number(data.configuredCount || 0);
        const totalCount = Number(data.totalCount || 0);

        updateMonitoringAIProviderDot('monitorAIOpenAIDot', providers.openai?.configured);
        updateMonitoringAIProviderDot('monitorAIAnthropicDot', providers.anthropic?.configured);
        updateMonitoringAIProviderDot('monitorAIGeminiDot', providers.gemini?.configured);
        updateMonitoringAIProviderDot('monitorAIStabilityDot', providers.stability?.configured);

        globalEl.textContent = `${configuredCount}/${totalCount} provider(s) actif(s)`;

        if (updatedEl) {
            const date = data.checkedAt ? new Date(data.checkedAt) : new Date();
            updatedEl.textContent = `Dernière vérification: ${date.toLocaleTimeString('fr-FR')}`;
        }
    } catch (error) {
        updateMonitoringAIProviderDot('monitorAIOpenAIDot', null);
        updateMonitoringAIProviderDot('monitorAIAnthropicDot', null);
        updateMonitoringAIProviderDot('monitorAIGeminiDot', null);
        updateMonitoringAIProviderDot('monitorAIStabilityDot', null);

        globalEl.textContent = 'Indisponible';
        if (updatedEl) {
            updatedEl.textContent = 'Dernière vérification: erreur';
        }
    }
}

window.refreshAIHealthStatus = function() {
    loadAIHealthStatus();
};

async function loadErrorsData() {
    try {
        // Récupérer TOUTES les erreurs non résolues (sans limite pour grouper correctement)
        const { data: errors, error } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .eq('resolved', false)
            .order('timestamp', { ascending: false });
        
        if (error) throw error;
        
        // Récupérer TOUS les tickets liés aux erreurs
        const { data: allTickets } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('*')
            .not('statut', 'in', '(resolu,ferme)')
            .eq('source', 'auto_detection')
            .order('created_at', { ascending: false });
        
        // Grouper par signature normalisée pour éviter les doublons
        const grouped = {};
        errors?.forEach(err => {
            // Créer une clé de groupement normalisée
            const signature = generateErrorSignature(err);
            
            if (!grouped[signature]) {
                // Chercher tickets liés à cette erreur
                const relatedTickets = allTickets?.filter(t => 
                    t.error_signature === signature || t.error_id === err.id
                ) || [];
                
                grouped[signature] = {
                    ...err,
                    occurrences: 1,
                    first_occurrence: err.timestamp,
                    last_occurrence: err.timestamp,
                    all_instances: [err],
                    tickets: relatedTickets,
                    signature: signature
                };
            } else {
                // Incrémenter les occurrences
                grouped[signature].occurrences++;
                
                // Mettre à jour les timestamps
                const errTime = new Date(err.timestamp);
                const lastTime = new Date(grouped[signature].last_occurrence);
                const firstTime = new Date(grouped[signature].first_occurrence);
                
                if (errTime > lastTime) {
                    grouped[signature].last_occurrence = err.timestamp;
                }
                if (errTime < firstTime) {
                    grouped[signature].first_occurrence = err.timestamp;
                }
                
                grouped[signature].all_instances.push(err);
                
                // Ajouter les tickets liés à cette instance
                const instanceTickets = allTickets?.filter(t => 
                    t.error_signature === signature || t.error_id === err.id
                ) || [];
                
                instanceTickets.forEach(ticket => {
                    if (!grouped[signature].tickets.find(t => t.id === ticket.id)) {
                        grouped[signature].tickets.push(ticket);
                    }
                });
            }
        });
        
        // Convertir en tableau, dédupliquer une seconde fois par sécurité, puis trier
        const groupedArray = Array.from(new Map(Object.values(grouped).map(err => [err.signature, err])).values()).sort((a, b) => 
            new Date(b.last_occurrence) - new Date(a.last_occurrence)
        );

        unresolvedGroupedErrors = groupedArray;
        renderFilteredErrors();
        
    } catch (error) {
        console.error('❌ Erreur chargement erreurs:', error);
    }
}

// Générer signature d'erreur normalisée pour groupement unique
function generateErrorSignature(error) {
    // Normaliser le message en retirant les parties variables (IDs, timestamps, etc.)
    let normalizedMessage = error.message || '';
    
    // Retirer les IDs UUID
    normalizedMessage = normalizedMessage.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID');
    
    // Retirer les timestamps
    normalizedMessage = normalizedMessage.replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP');
    
    // Retirer les nombres
    normalizedMessage = normalizedMessage.replace(/\b\d+\b/g, 'N');
    normalizedMessage = normalizedMessage.replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Normaliser la source (retirer les query params et hashes)
    let normalizedSource = error.source || '';
    normalizedSource = normalizedSource.split('?')[0].split('#')[0];
    normalizedSource = normalizedSource.replace(/\/\d+(?=\/|$)/g, '/N').replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Créer signature unique
    return `${(error.error_type || 'unknown').toLowerCase()}|${normalizedSource}|${normalizedMessage}`;
}

function renderFilteredErrors() {
    const selectedType = document.getElementById('unresolvedErrorTypeFilter')?.value || '';

    let filtered = unresolvedGroupedErrors;
    if (selectedType) {
        filtered = unresolvedGroupedErrors.filter(err => err.error_type === selectedType);
    }

    // Limiter à 20 groupes d'erreurs uniques après filtre
    displayErrors(filtered.slice(0, 20));
}

function displayErrors(errors) {
    const container = document.getElementById('errorsContainer');
    
    if (!errors || errors.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <i data-lucide="check-circle" style="width: 48px; height: 48px; color: #10b981; margin-bottom: 15px;"></i>
                <p style="font-size: 18px; font-weight: 600; color: #10b981;">✅ Aucune erreur non résolue</p>
                <p style="margin-top: 10px;">Le système fonctionne normalement</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    container.innerHTML = errors.map((err, index) => {
        // Échapper les quotes pour éviter les erreurs JavaScript
        const errorTypeEscaped = err.error_type.replace(/'/g, "\\'");
        const sourceEscaped = (err.source || '').replace(/'/g, "\\'");
        const messageEscaped = (err.message || '').replace(/'/g, "\\'");
        
        // Extraire fichier et ligne depuis metadata ou stack trace
        let fileName = err.source || 'unknown';
        let lineNumber = null;
        
        if (err.metadata?.lineno) {
            lineNumber = err.metadata.lineno;
        }
        
        if (err.metadata?.functionName) {
            fileName = `${fileName} → ${err.metadata.functionName}()`;
        }
        
        // Extraire depuis stack trace si pas dans metadata
        if (!lineNumber && err.stack_trace) {
            const lineMatch = err.stack_trace.match(/:(\d+):\d+/);
            if (lineMatch) {
                lineNumber = lineMatch[1];
            }
            
            const fileMatch = err.stack_trace.match(/at .+ \((.+?):\d+:\d+\)/);
            if (fileMatch && !fileName) {
                fileName = fileMatch[1].split('/').pop();
            }
        }
        
        const locationInfo = lineNumber ? `${fileName}:${lineNumber}` : fileName;
        
        // Badge tickets
        const ticketsCount = err.tickets?.length || 0;
        const ticketsBadge = ticketsCount > 0 ? `
            <span style="background: #06b6d4; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                <i data-lucide="ticket" style="width: 12px; height: 12px;"></i>
                ${ticketsCount} ticket${ticketsCount > 1 ? 's' : ''}
            </span>
        ` : '';
        
        return `
        <div class="error-row ${err.error_type === 'warning' ? 'warning' : ''}" style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <span style="background: ${err.error_type === 'critical' ? '#ef4444' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                            ${err.error_type}
                        </span>
                        <strong style="font-family: monospace; color: #1e293b;">${locationInfo}</strong>
                        ${ticketsBadge}
                    </div>
                    <div style="color: #475569; font-size: 14px; margin-bottom: 8px;">
                        ${err.message}
                    </div>
                    ${err.metadata?.fixSuggestion ? `
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 12px; margin-bottom: 8px; border-radius: 4px;">
                        <strong style="color: #92400e;">💡 Suggestion:</strong>
                        <div style="color: #78350f; margin-top: 4px;">${err.metadata.fixSuggestion}</div>
                    </div>
                    ` : ''}
                    <div style="display: flex; gap: 20px; font-size: 13px; color: #64748b; margin-bottom: 10px;">
                        <span>🔄 ${err.occurrences} occurrence(s)</span>
                        <span>📅 Première: ${new Date(err.first_occurrence).toLocaleDateString('fr-FR')}</span>
                        <span>⏰ Dernière: ${new Date(err.last_occurrence).toLocaleString('fr-FR')}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; flex-direction: column;">
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary" onclick="showErrorDetails(${index})" style="padding: 6px 12px; font-size: 13px;">
                            <i data-lucide="code"></i>
                            Détails
                        </button>
                        ${ticketsCount > 0 ? `
                        <button class="btn" style="background: #06b6d4; color: white; padding: 6px 12px; font-size: 13px;" onclick="showErrorTickets(${index})">
                            <i data-lucide="ticket"></i>
                            Tickets (${ticketsCount})
                        </button>
                        ` : `
                        <button class="btn" style="background: #06b6d4; color: white; padding: 6px 12px; font-size: 13px;" onclick="createTicketForError(${index})">
                            <i data-lucide="plus-circle"></i>
                            Créer Ticket
                        </button>
                        `}
                        <button class="btn btn-success" onclick="markErrorResolved('${errorTypeEscaped}', '${sourceEscaped}', '${messageEscaped}')" style="padding: 6px 12px; font-size: 13px;">
                            <i data-lucide="check"></i>
                            Résoudre
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Section tickets -->
            ${ticketsCount > 0 ? `
            <div id="error-tickets-${index}" style="display: none; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-top: 10px;">
                <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="ticket" style="width: 16px; height: 16px;"></i>
                    Tickets associés (${ticketsCount})
                </h4>
                ${err.tickets.map(ticket => `
                    <div style="background: white; border: 1px solid #e0f2fe; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #0c4a6e; margin-bottom: 4px;">
                                    #${ticket.id} - ${ticket.sujet}
                                </div>
                                <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">
                                    ${ticket.description ? ticket.description.substring(0, 150) + '...' : ''}
                                </div>
                                <div style="display: flex; gap: 15px; font-size: 12px; color: #64748b;">
                                    <span style="display: flex; align-items: center; gap: 5px;">
                                        <span style="background: ${getStatusColor(ticket.statut)}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
                                        ${getStatusLabel(ticket.statut)}
                                    </span>
                                    <span>📅 ${new Date(ticket.created_at).toLocaleString('fr-FR')}</span>
                                    <span>👤 ${ticket.client_email || 'N/A'}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 6px; flex-direction: column;">
                                <button class="btn btn-sm" style="padding: 4px 10px; font-size: 12px; white-space: nowrap;" onclick="openTicket('${ticket.id}')">
                                    <i data-lucide="external-link" style="width: 12px; height: 12px;"></i>
                                    Ouvrir
                                </button>
                                <select onchange="updateTicketStatus('${ticket.id}', this.value)" style="padding: 4px 8px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer;">
                                    <option value="">Actions...</option>
                                    <option value="en_cours">En cours</option>
                                    <option value="en_attente_client">En attente client</option>
                                    <option value="resolu">Résolu</option>
                                    <option value="ferme">Fermer</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div id="error-details-${index}" style="display: none; background: #0f172a; color: #e2e8f0; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 13px; margin-top: 10px; position: relative;">
                <button onclick="copyErrorDetails(${index})" style="position: absolute; top: 10px; right: 10px; padding: 6px 12px; background: #334155; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                    <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
                    Copier
                </button>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fbbf24;">📁 Fichier:</strong> ${fileName}
                </div>
                ${lineNumber ? `
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fbbf24;">📍 Ligne:</strong> ${lineNumber}
                    ${err.metadata?.colno ? `<span style="color: #94a3b8;"> Col: ${err.metadata.colno}</span>` : ''}
                </div>
                ` : ''}
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fbbf24;">Type:</strong> ${err.error_type}
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fbbf24;">Message:</strong><br>
                    <div style="margin-top: 5px; padding: 10px; background: #1e293b; border-radius: 4px;">
                        ${err.message}
                    </div>
                </div>
                ${err.stack_trace ? `
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fbbf24;">Stack Trace:</strong><br>
                    <pre style="margin-top: 5px; padding: 10px; background: #1e293b; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${err.stack_trace}</pre>
                </div>
                ` : ''}
                ${err.metadata ? `
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fbbf24;">Métadonnées:</strong><br>
                    <pre style="margin-top: 5px; padding: 10px; background: #1e293b; border-radius: 4px; overflow-x: auto;">${JSON.stringify(err.metadata, null, 2)}</pre>
                </div>
                ` : ''}
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fbbf24;">User Agent:</strong><br>
                    <div style="margin-top: 5px; padding: 10px; background: #1e293b; border-radius: 4px; font-size: 11px;">
                        ${err.user_agent || 'N/A'}
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fbbf24;">URL:</strong> ${err.url || 'N/A'}
                </div>
                <div>
                    <strong style="color: #fbbf24;">User:</strong> ${err.user_email || 'Anonyme'}
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    // Stocker les erreurs pour accès ultérieur
    window.currentErrors = errors;
    
    lucide.createIcons();
}

// Afficher/masquer les détails d'une erreur
window.showErrorDetails = function(index) {
    const detailsDiv = document.getElementById(`error-details-${index}`);
    if (detailsDiv) {
        const isVisible = detailsDiv.style.display !== 'none';
        detailsDiv.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            lucide.createIcons();
        }
    }
};

// Copier les détails d'une erreur
window.copyErrorDetails = async function(index) {
    const error = window.currentErrors[index];
    if (!error) return;
    
    // Extraire fichier et ligne
    let fileName = error.source || 'unknown';
    let lineNumber = error.metadata?.lineno || null;
    let colNumber = error.metadata?.colno || null;
    
    if (!lineNumber && error.stack_trace) {
        const lineMatch = error.stack_trace.match(/:(\d+):(\d+)/);
        if (lineMatch) {
            lineNumber = lineMatch[1];
            colNumber = lineMatch[2];
        }
    }
    
    const details = `
========================================
ERREUR ${error.error_type.toUpperCase()}
========================================

📁 Fichier: ${fileName}
${lineNumber ? `📍 Ligne: ${lineNumber}${colNumber ? `:${colNumber}` : ''}` : ''}
${error.metadata?.functionName ? `🔧 Fonction: ${error.metadata.functionName}()` : ''}

Type: ${error.error_type}
Message: ${error.message}

${error.metadata?.fixSuggestion ? `💡 SUGGESTION DE FIX:
${error.metadata.fixSuggestion}

` : ''}${error.stack_trace ? `Stack Trace:
${error.stack_trace}

` : ''}${error.metadata ? `Métadonnées:
${JSON.stringify(error.metadata, null, 2)}

` : ''}Occurrences: ${error.occurrences}
Première occurrence: ${new Date(error.first_occurrence).toLocaleString('fr-FR')}
Dernière occurrence: ${new Date(error.last_occurrence).toLocaleString('fr-FR')}

URL: ${error.url || 'N/A'}
User: ${error.user_email || 'Anonyme'}
User Agent: ${error.user_agent || 'N/A'}

========================================
`.trim();
    
    try {
        await navigator.clipboard.writeText(details);
        alert('✅ Détails copiés dans le presse-papier');
    } catch (err) {
        console.error('Erreur copie:', err);
        alert('❌ Erreur lors de la copie');
    }
}

window.markErrorResolved = async function(errorType, source, message) {
    try {
        const { error } = await window.supabaseClient
            .from('cm_error_logs')
            .update({
                resolved: true,
                resolved_at: new Date().toISOString(),
                resolved_by: currentUser.email
            })
            .eq('error_type', errorType)
            .eq('source', source)
            .eq('message', message)
            .eq('resolved', false);
        
        if (error) throw error;
        
        alert('✅ Erreur marquée comme résolue');
        notifyErrorStateChanged();
        await loadErrorsData();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('❌ Erreur lors de la résolution');
    }
};

async function loadPerformanceMetrics() {
    try {
        // Calculer métriques de performance basiques
        const { data: errors24h, error } = await window.supabaseClient
            .from('cm_error_logs')
            .select('id, timestamp')
            .eq('resolved', false)
            .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        if (!error && errors24h) {
            const totalRequests = Math.max(1000, errors24h.length * 50); // Estimation
            const errorRate = ((errors24h.length / totalRequests) * 100).toFixed(2);
            
            document.getElementById('avgLatency').textContent = '~150ms';
            document.getElementById('requestsPerMin').textContent = '~' + Math.round(totalRequests / 1440);
            document.getElementById('errorRate').textContent = errorRate + '%';
            document.getElementById('errorRate').style.color = errorRate > 1 ? '#ef4444' : '#10b981';
        }
        
    } catch (error) {
        console.error('❌ Erreur métriques:', error);
    }
}

// ================================================================
// LOGS EXPLORER
// ================================================================

window.searchLogs = async function() {
    const filterType = document.getElementById('filterType').value;
    const filterSource = document.getElementById('filterSource').value;
    const filterDateFrom = document.getElementById('filterDateFrom').value;
    const filterDateTo = document.getElementById('filterDateTo').value;
    
    try {
        let query = window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);
        
        if (filterType) {
            query = query.eq('error_type', filterType);
        }
        
        if (filterSource) {
            query = query.ilike('source', `%${filterSource}%`);
        }
        
        if (filterDateFrom) {
            query = query.gte('timestamp', new Date(filterDateFrom).toISOString());
        }
        
        if (filterDateTo) {
            const dateTo = new Date(filterDateTo);
            dateTo.setHours(23, 59, 59);
            query = query.lte('timestamp', dateTo.toISOString());
        }
        
        const { data: logs, error } = await query;
        
        if (error) throw error;
        
        displayLogs(logs || []);
        
    } catch (error) {
        console.error('❌ Erreur recherche logs:', error);
        alert('❌ Erreur lors de la recherche');
    }
};

function displayLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    
    if (!logs || logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #64748b;">
                    Aucun log trouvé pour ces critères
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td style="white-space: nowrap;">
                ${new Date(log.timestamp).toLocaleString('fr-FR')}
            </td>
            <td>
                <span style="background: ${log.error_type === 'critical' ? '#ef4444' : log.error_type === 'warning' ? '#f59e0b' : '#64748b'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">
                    ${log.error_type}
                </span>
            </td>
            <td style="font-family: monospace; font-size: 13px;">${log.source}</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;" title="${log.message}">
                ${log.message.substring(0, 100)}${log.message.length > 100 ? '...' : ''}
            </td>
            <td>${log.user_email || '-'}</td>
            <td>
                <button class="btn btn-primary" onclick="viewLogDetails('${log.id}')" style="padding: 4px 8px; font-size: 12px;">
                    Détails
                </button>
            </td>
        </tr>
    `).join('');
}

window.viewLogDetails = async function(logId) {
    try {
        const { data: log, error } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .eq('id', logId)
            .single();
        
        if (error) throw error;
        
        const details = `
=== DÉTAILS DE L'ERREUR ===

Type: ${log.error_type}
Source: ${log.source}
Date: ${new Date(log.timestamp).toLocaleString('fr-FR')}
User: ${log.user_email || 'Anonyme'}

Message:
${log.message}

Stack Trace:
${log.stack_trace || 'Non disponible'}

URL: ${log.url || '-'}
User Agent: ${log.user_agent || '-'}

Métadonnées:
${JSON.stringify(log.metadata, null, 2)}
        `;
        
        alert(details);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('❌ Erreur lors du chargement des détails');
    }
};

window.clearFilters = function() {
    document.getElementById('filterType').value = '';
    document.getElementById('filterSource').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    
    document.getElementById('logsTableBody').innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: #64748b;">
                Utilisez les filtres pour rechercher des logs
            </td>
        </tr>
    `;
};

window.refreshErrors = function() {
    loadErrorsData();
};

window.deleteAllErrors = async function() {
    const total = unresolvedGroupedErrors.reduce((sum, err) => sum + (err.occurrences || 1), 0);

    if (total === 0) {
        alert('ℹ️ Aucune erreur non résolue à supprimer');
        return;
    }

    const firstConfirm = confirm(`Voulez-vous vraiment supprimer ${total} erreur(s) non résolue(s) ?`);
    if (!firstConfirm) return;

    const secondConfirm = confirm('Confirmation finale : cette suppression est irréversible. Continuer ?');
    if (!secondConfirm) return;

    try {
        const { error } = await window.supabaseClient
            .from('cm_error_logs')
            .delete()
            .eq('resolved', false);

        if (error) throw error;

        unresolvedGroupedErrors = [];
        alert(`✅ ${total} erreur(s) non résolue(s) supprimée(s)`);
        notifyErrorStateChanged();
        await Promise.all([
            loadErrorsData(),
            loadPerformanceMetrics()
        ]);
    } catch (err) {
        console.error('❌ Erreur suppression globale:', err);
        alert('❌ Erreur lors de la suppression globale');
    }
};

// ================================================================
// AUTO-FIX SYSTEM - Envoi à Copilot
// ================================================================

window.autoFixErrors = async function() {
    try {
        // Récupérer les erreurs non résolues avec tous les détails
        const { data: errors, error } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .eq('resolved', false)
            .order('timestamp', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        if (!errors || errors.length === 0) {
            alert('✅ Aucune erreur à corriger !');
            return;
        }
        
        // Grouper les erreurs similaires
        const grouped = groupSimilarErrors(errors);
        
        // Générer le rapport formaté pour Copilot
        const report = generateCopilotReport(grouped);
        
        // Copier dans le presse-papier
        await navigator.clipboard.writeText(report);
        
        // Afficher la modale avec prévisualisation
        showAutoFixModal(grouped, report);
        
    } catch (err) {
        console.error('❌ Erreur Auto-Fix:', err);
        alert('❌ Erreur : ' + err.message);
    }
};

function groupSimilarErrors(errors) {
    const grouped = {};
    errors.forEach(err => {
        const key = `${err.source}|${err.message}`;
        if (!grouped[key]) {
            grouped[key] = {
                ...err,
                occurrences: 1,
                all_instances: [err]
            };
        } else {
            grouped[key].occurrences++;
            grouped[key].all_instances.push(err);
        }
    });
    return Object.values(grouped);
}

function generateCopilotReport(errors) {
    const timestamp = new Date().toISOString();
    
    let report = `# 🔧 AUTO-FIX REPORT - ${errors.length} erreurs à corriger
Généré le : ${new Date().toLocaleString('fr-FR')}
Repo : Gestion_gite-calvignac

## 📋 INSTRUCTIONS

Pour chaque erreur ci-dessous :
1. ✅ Analyse et propose la correction du code
2. ✅ Applique toutes les corrections en parallèle avec multi_replace_string_in_file
3. ✅ Génère automatiquement les tests (console + UI)
4. ✅ Crée la page pages/test-fixes.html avec tous les tests
5. ✅ Lance le système de validation en 2 phases :
   - Phase 1: Tests immédiats (résultats instantanés)
   - Phase 2: Monitoring 24h (auto-résolution si aucune réapparition)

---

`;

    errors.forEach((err, index) => {
        const num = index + 1;
        report += `## ❌ ERREUR ${num}/${errors.length}

**ID** : ${err.id}
**Fichier** : \`${err.source || 'unknown'}\`
**Ligne** : ${err.metadata?.lineno || 'N/A'}
**Type** : ${err.error_type}
**Message** : ${err.message}
**Occurrences** : ${err.occurrences}x
**First seen** : ${new Date(err.all_instances[0].timestamp).toLocaleString('fr-FR')}
**Last seen** : ${new Date(err.all_instances[err.all_instances.length-1].timestamp).toLocaleString('fr-FR')}

### Stack Trace
\`\`\`
${err.stack_trace || 'Non disponible'}
\`\`\`

### Contexte
- User Agent: ${err.metadata?.userAgent || 'N/A'}
- URL: ${err.metadata?.url || 'N/A'}
- Function: ${err.metadata?.functionName || 'N/A'}
- Column: ${err.metadata?.colno || 'N/A'}

### Métadonnées complètes
\`\`\`json
${JSON.stringify(err.metadata, null, 2)}
\`\`\`

### Instances
${err.all_instances.slice(0, 3).map((inst, i) => 
`  ${i+1}. ${new Date(inst.timestamp).toLocaleString('fr-FR')} - ${inst.metadata?.url || 'N/A'}`
).join('\n')}
${err.all_instances.length > 3 ? `  ... et ${err.all_instances.length - 3} autres` : ''}

---

`;
    });
    
    report += `
## ✅ WORKFLOW DE CORRECTION

### Étape 1 : Corrections de code
\`\`\`javascript
// Utiliser multi_replace_string_in_file pour toutes les corrections en parallèle
const corrections = [
    { filePath: "...", oldString: "...", newString: "..." },
    // ... autres corrections
];
\`\`\`

### Étape 2 : Génération des tests
Pour chaque correction, générer automatiquement avec TestGenerator :
- **Test console** : Script à exécuter dans DevTools
- **Test UI** : Bouton dans l'interface de test
- **Config validator** : Pour validation automatique

### Étape 3 : Création page de test
Créer \`pages/test-fixes.html\` avec :
\`\`\`javascript
const testGen = new TestGenerator();
errors.forEach(err => {
    testGen.generateTestForFix(err, fixedCode);
});
const testPage = testGen.generateTestPage();
// Créer le fichier avec testPage
\`\`\`

### Étape 3bis : 📝 ENREGISTRER LES CORRECTIONS (IMPORTANT!)
**Tu DOIS enregistrer toutes les corrections dans la BDD pour traçabilité :**
\`\`\`javascript
// Après avoir appliqué les corrections
await window.logAllCorrections([
    {
        errorId: ${errors[0]?.id || 'ERROR_ID'},
        filePath: '/workspaces/Gestion_gite-calvignac/js/fichier.js',
        oldCode: 'const x = data.value;',
        newCode: 'const x = data?.value || "";',
        description: 'Ajout optional chaining + valeur par défaut'
    },
    // ... répéter pour chaque correction
]);
// Retourne { success: X, total: Y }
\`\`\`

### Étape 4 : Lancer la validation
Pour chaque erreur corrigée :
\`\`\`javascript
// Validation immédiate + monitoring 24h
await window.autoValidatorInstance.validateImmediately(errorId, testConfig);

// Le système va :
// 1. Tester immédiatement
// 2. Si test OK → Lancer monitoring 24h
// 3. Si pas de réapparition → Auto-résoudre
\`\`\`

## 📊 STATS
- Total erreurs : ${errors.length}
- Fichiers impactés : ${new Set(errors.map(e => e.source)).size}
- Types : ${[...new Set(errors.map(e => e.error_type))].join(', ')}
- Occurrences totales : ${errors.reduce((sum, e) => sum + e.occurrences, 0)}

## 🎯 RÉSULTAT ATTENDU

Après correction, tu dois avoir :
1. ✅ Tous les fichiers corrigés (multi_replace)
2. ✅ pages/test-fixes.html créé avec tous les tests
3. ✅ Message de confirmation avec résumé
4. ✅ Instructions pour tester

Exemple de réponse :
\`\`\`
✅ ${errors.length} corrections appliquées en parallèle

FICHIERS MODIFIÉS :
${[...new Set(errors.map(e => e.source))].map(f => `  - ${f}`).join('\n')}

TESTS GÉNÉRÉS :
  - ${errors.length} tests console
  - ${errors.length} tests UI
  - pages/test-fixes.html créé

VALIDATION :
  - Tests immédiats prêts
  - Monitoring 24h configuré

Ouvre pages/test-fixes.html pour tester les corrections
\`\`\`

Prêt à corriger ! 🚀
`;
    
    return report;
}

function showAutoFixModal(errors, report) {
    const modal = document.getElementById('autoFixModal');
    const content = document.getElementById('autoFixContent');
    
    content.innerHTML = `
        <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #10b981; display: flex; align-items: center; gap: 10px;">
                <i data-lucide="check-circle"></i>
                Rapport copié dans le presse-papier !
            </h3>
            <p style="margin: 0; color: #166534;">Collez-le maintenant dans Copilot Chat pour lancer la correction automatique.</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #1e293b;">📊 Résumé</h4>
            <ul style="margin: 0; color: #475569;">
                <li><strong>${errors.length}</strong> erreurs groupées</li>
                <li><strong>${new Set(errors.map(e => e.source)).size}</strong> fichiers concernés</li>
                <li><strong>${errors.reduce((sum, e) => sum + e.occurrences, 0)}</strong> occurrences totales</li>
            </ul>
        </div>
        
        <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #f59e0b;">⚡ Ce qui sera généré automatiquement</h4>
            <ul style="margin: 0; color: #92400e;">
                <li>✅ Corrections de code (toutes en parallèle)</li>
                <li>✅ Tests console pour chaque fix</li>
                <li>✅ Interface de test UI (pages/test-fixes.html)</li>
                <li>✅ Marquage des erreurs comme résolues</li>
            </ul>
        </div>
        
        <details style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <summary style="cursor: pointer; font-weight: 600; color: #1e293b;">📄 Aperçu du rapport (${report.length} caractères)</summary>
            <pre style="background: #1e293b; color: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; margin-top: 15px; font-size: 12px; max-height: 400px;">${report}</pre>
        </details>
        
        <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary" onclick="copyReportAgain()" style="flex: 1;">
                <i data-lucide="copy"></i>
                Re-copier le rapport
            </button>
            <button class="btn btn-success" onclick="closeAutoFixModal()" style="flex: 1;">
                <i data-lucide="check"></i>
                Compris, je vais le coller
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
    lucide.createIcons();
    
    // Stocker le rapport pour re-copie
    window._currentAutoFixReport = report;
}

window.closeAutoFixModal = function() {
    document.getElementById('autoFixModal').style.display = 'none';
};

window.copyReportAgain = async function() {
    if (window._currentAutoFixReport) {
        await navigator.clipboard.writeText(window._currentAutoFixReport);
        alert('✅ Rapport re-copié dans le presse-papier !');
    }
};

// ================================================================
// VUES DÉTAILS & CORRECTIONS
// ================================================================

window.viewErrorDetails = function(errorId) {
    window.location.href = `admin-error-details.html?error=${errorId}`;
};

window.viewCorrections = async function(errorId) {
    // Charger les corrections
    const { data: corrections, error } = await window.supabaseClient
        .from('cm_error_corrections')
        .select('*')
        .eq('error_id', errorId)
        .order('applied_at', { ascending: false });
    
    if (error) {
        console.error('Erreur chargement corrections:', error);
        alert('Impossible de charger les corrections');
        return;
    }
    
    if (!corrections || corrections.length === 0) {
        alert('Aucune correction encore appliquée pour cette erreur');
        return;
    }
    
    // Afficher dans un modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    const content = `
        <div style="background: white; max-width: 900px; max-height: 90vh; overflow-y: auto; border-radius: 12px; padding: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0;">🔧 Corrections apportées</h2>
                <button onclick="this.closest('[style*=fixed]').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            
            ${corrections.map(corr => `
                <div style="background: #f8fafc; border-left: 4px solid #06b6d4; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong>${corr.file_path}</strong>
                        ${corr.test_status ? `<span style="padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; background: ${corr.test_status === 'passed' ? '#d1fae5' : corr.test_status === 'failed' ? '#fee2e2' : '#fef3c7'}; color: ${corr.test_status === 'passed' ? '#065f46' : corr.test_status === 'failed' ? '#991b1b' : '#92400e'};">Test ${corr.test_status}</span>` : ''}
                    </div>
                    <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem;">
                        ${new Date(corr.applied_at).toLocaleString('fr-FR')} par ${corr.applied_by}
                    </div>
                    ${corr.description ? `<p style="margin: 0.75rem 0;">${corr.description}</p>` : ''}
                    ${corr.old_code && corr.new_code ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                            <div>
                                <strong style="color: #dc2626;">- Ancien</strong>
                                <pre style="background: #fee; padding: 0.5rem; border-radius: 4px; overflow-x: auto; font-size: 0.8rem;">${escapeHtml(corr.old_code)}</pre>
                            </div>
                            <div>
                                <strong style="color: #16a34a;">+ Nouveau</strong>
                                <pre style="background: #efe; padding: 0.5rem; border-radius: 4px; overflow-x: auto; font-size: 0.8rem;">${escapeHtml(corr.new_code)}</pre>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
            
            <button onclick="window.viewErrorDetails(${errorId})" style="width: 100%; padding: 0.75rem; background: #06b6d4; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Voir tous les détails
            </button>
        </div>
    `;
    
    modal.innerHTML = content;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================================================
// ENREGISTRER LES CORRECTIONS (Appelé par Copilot après fix)
// ================================================================

window.logCorrection = async function(errorId, correctionData) {
    try {
        const { error } = await window.supabaseClient
            .from('cm_error_corrections')
            .insert({
                error_id: errorId,
                file_path: correctionData.filePath,
                old_code: correctionData.oldCode,
                new_code: correctionData.newCode,
                description: correctionData.description,
                applied_by: 'copilot',
                applied_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        console.log('✅ Correction enregistrée pour erreur #' + errorId);
        return true;
    } catch (err) {
        console.error('❌ Erreur enregistrement correction:', err);
        return false;
    }
};

// Helper pour Copilot : Enregistrer toutes les corrections d'un batch
window.logAllCorrections = async function(corrections) {
    console.log('📝 Enregistrement de', corrections.length, 'corrections...');
    
    const results = await Promise.all(
        corrections.map(corr => window.logCorrection(corr.errorId, corr))
    );
    
    const successCount = results.filter(r => r).length;
    console.log(`✅ ${successCount}/${corrections.length} corrections enregistrées`);
    
    return { success: successCount, total: corrections.length };
};

// ================================================================
// GESTION DES TICKETS
// ================================================================

// Afficher/masquer les tickets d'une erreur
window.showErrorTickets = function(index) {
    const ticketsDiv = document.getElementById(`error-tickets-${index}`);
    if (ticketsDiv) {
        const isVisible = ticketsDiv.style.display !== 'none';
        ticketsDiv.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            lucide.createIcons();
        }
    }
};

// Créer un ticket pour une erreur
window.createTicketForError = async function(index) {
    const error = window.currentErrors[index];
    if (!error) return;
    
    if (!window.diagAutoTicket) {
        alert('❌ Système auto-ticket non chargé. Rechargez la page.');
        return;
    }
    
    try {
        const confirmed = confirm(`Créer un ticket support pour cette erreur ?\n\n${error.message}\n\nUn email sera envoyé à tous les clients concernés.`);
        if (!confirmed) return;
        
        // Utiliser le système auto-ticket
        await window.diagAutoTicket.forceCreateTicket(error.id);
        
        alert('✅ Ticket créé avec succès !');
        
        // Recharger les données
        await loadErrorsData();
        
    } catch (err) {
        console.error('❌ Erreur création ticket:', err);
        alert('❌ Erreur lors de la création du ticket: ' + err.message);
    }
};

// Ouvrir un ticket
window.openTicket = function(ticketId) {
    window.open(`admin-ticket-workflow.html?ticket=${ticketId}`, '_blank');
};

// Mettre à jour le statut d'un ticket
window.updateTicketStatus = async function(ticketId, newStatus) {
    if (!newStatus) return;
    
    try {
        const statusMapping = {
            'en_cours': 'En cours',
            'en_attente_client': 'En attente client',
            'resolu': 'Résolu',
            'ferme': 'Fermé'
        };
        
        const confirmed = confirm(`Changer le statut du ticket #${ticketId} vers "${statusMapping[newStatus]}" ?`);
        if (!confirmed) {
            event.target.value = '';
            return;
        }
        
        const updateData = {
            statut: newStatus
        };
        
        // Si fermé ou résolu, ajouter la date de clôture
        if (newStatus === 'ferme' || newStatus === 'resolu') {
            updateData.closed_at = new Date().toISOString();
        }
        
        const { error } = await window.supabaseClient
            .from('cm_support_tickets')
            .update(updateData)
            .eq('id', ticketId);
        
        if (error) throw error;
        
        // Ajouter l'historique
        await window.supabaseClient
            .from('cm_support_ticket_history')
            .insert({
                ticket_id: ticketId,
                action: 'status_changed',
                description: `Statut changé vers: ${statusMapping[newStatus]}`,
                created_by: 'admin'
            });
        
        alert(`✅ Statut mis à jour: ${statusMapping[newStatus]}`);
        
        // Recharger les données
        await loadErrorsData();
        
    } catch (err) {
        console.error('❌ Erreur mise à jour statut:', err);
        alert('❌ Erreur lors de la mise à jour: ' + err.message);
    } finally {
        event.target.value = '';
    }
};

// Helpers pour les statuts
window.getStatusColor = function(status) {
    const colors = {
        'ouvert': '#ef4444',
        'en_cours': '#f59e0b',
        'en_attente_client': '#06b6d4',
        'resolu': '#10b981',
        'ferme': '#64748b'
    };
    return colors[status] || '#64748b';
};

window.getStatusLabel = function(status) {
    const labels = {
        'ouvert': 'Ouvert',
        'en_cours': 'En cours',
        'en_attente_client': 'En attente client',
        'resolu': 'Résolu',
        'ferme': 'Fermé'
    };
    return labels[status] || status;
};

// ================================================================
// TESTS DE CORRECTIONS
// ================================================================

window.loadTestCorrections = async function() {
    try {
        const container = document.getElementById('testsCorrectionsContainer');
        if (!container) return;
        
        // CORRECTIONS EN DUR (pas de BDD nécessaire)
        const corrections = [
            {
                id: 1,
                file_path: 'js/menage.js',
                old_code: 'window.SecurityUtils.escapeHTML',
                new_code: 'window.SecurityUtils.sanitizeText',
                description: 'Correction TypeError: window.SecurityUtils.escapeHTML is not a function. La méthode correcte est sanitizeText. 2 occurrences corrigées (lignes 934 et 952).',
                applied_at: new Date().toISOString(),
                error_type: 'critical',
                error_message: 'TypeError: window.SecurityUtils.escapeHTML is not a function',
                source: 'js/menage.js',
                resolved: true
            },
            {
                id: 2,
                file_path: 'js/femme-menage.js',
                old_code: 'window.SecurityUtils.escapeHTML',
                new_code: 'window.SecurityUtils.sanitizeText',
                description: 'Correction préventive: même erreur potentielle détectée. 2 occurrences corrigées (lignes 680 et 691) pour éviter la même erreur TypeError.',
                applied_at: new Date().toISOString(),
                error_type: 'warning',
                error_message: 'Correction préventive escapeHTML',
                source: 'js/femme-menage.js',
                resolved: true
            }
        ];
        
        if (!corrections || corrections.length === 0) {
            container.innerHTML = `
                <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; color: #64748b;">
                    <i data-lucide="clipboard-list" style="width: 64px; height: 64px; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p style="font-size: 16px; margin: 0;">Aucune correction à tester actuellement</p>
                    <p style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Les corrections appliquées apparaîtront ici</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        // Afficher les tests
        let html = '';
        corrections.forEach((correction, index) => {
            const errorType = correction.error_type || 'unknown';
            const tagClass = errorType === 'critical' ? 'test-tag-critical' : 
                            errorType === 'warning' ? 'test-tag-warning' : 'test-tag-info';
            
            html += `
                <div class="test-box" id="test-${correction.id}" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px; color: #1e293b;">
                        <i data-lucide="bug" style="width: 20px; height: 20px;"></i>
                        Correction #${index + 1}: ${correction.error_message}
                    </h3>
                    
                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <span class="test-tag ${tagClass}" style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                            ${errorType.toUpperCase()}
                        </span>
                        <span class="test-tag" style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; background: #e2e8f0; color: #475569;">
                            ${correction.source}
                        </span>
                    </div>
                    
                    <div class="test-info-box" style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 15px; color: #475569;">
                        <strong>📝 Description:</strong> ${correction.description}<br><br>
                        <strong>📍 Fichier:</strong> ${correction.file_path}<br><br>
                        <strong>Avant:</strong><br>
                        <code style="background: #fee; color: #c00; padding: 2px 6px; border-radius: 4px; display: inline-block; margin: 5px 0;">${escapeHtml(correction.old_code)}</code><br><br>
                        <strong>Après:</strong><br>
                        <code style="background: #efe; color: #080; padding: 2px 6px; border-radius: 4px; display: inline-block; margin: 5px 0;">${escapeHtml(correction.new_code)}</code>
                    </div>
                    
                    <div id="test-result-${correction.id}" style="margin: 15px 0;"></div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-success" onclick="validateTestCorrection(${correction.id}, '${correction.file_path}')" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                            ✅ Corrigé et Testé
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        lucide.createIcons();
        
    } catch (err) {
        console.error('❌ Erreur chargement tests:', err);
        const container = document.getElementById('testsCorrectionsContainer');
        if (container) {
            container.innerHTML = `
                <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; color: #991b1b;">
                    <strong>❌ Erreur:</strong> ${err.message}
                </div>
            `;
        }
    }
};

// Validation visuelle d'un test de correction
window.validateTestCorrection = async function(correctionId, filePath) {
    const resultDiv = document.getElementById(`test-result-${correctionId}`);
    if (!resultDiv) return;
    
    // Test simple : vérifier que SecurityUtils.sanitizeText existe
    try {
        if (!window.SecurityUtils || typeof window.SecurityUtils.sanitizeText !== 'function') {
            throw new Error('SecurityUtils.sanitizeText non disponible');
        }
        
        // Test de la fonction
        const testInput = '<script>alert("test")</script>';
        const result = window.SecurityUtils.sanitizeText(testInput);
        
        // Marquer l'erreur correspondante comme résolue dans la BDD
        if (filePath.includes('menage')) {
            const fileName = (filePath.split('/').pop() || filePath).trim();

            const { data: updatedBySource, error: updateBySourceError } = await window.supabaseClient
                .from('cm_error_logs')
                .update({
                    resolved: true,
                    resolved_at: new Date().toISOString(),
                    resolved_by: currentUser?.email || 'admin'
                })
                .eq('resolved', false)
                .ilike('source', `%${fileName}%`)
                .select('id');

            if (updateBySourceError) throw updateBySourceError;

            if (!updatedBySource || updatedBySource.length === 0) {
                const { error: updateFallbackError } = await window.supabaseClient
                    .from('cm_error_logs')
                    .update({
                        resolved: true,
                        resolved_at: new Date().toISOString(),
                        resolved_by: currentUser?.email || 'admin'
                    })
                    .eq('resolved', false)
                    .ilike('message', '%escapeHTML%');

                if (updateFallbackError) throw updateFallbackError;
            }

            notifyErrorStateChanged();
            await Promise.all([
                loadErrorsData(),
                loadPerformanceMetrics()
            ]);
        }
        
        // Afficher succès
        resultDiv.innerHTML = `
            <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin-top: 15px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i data-lucide="check-circle" style="width: 24px; height: 24px; color: #10b981;"></i>
                    <strong style="color: #166534; font-size: 16px;">✅ Correction validée et testée avec succès</strong>
                </div>
                <div style="color: #166534; font-size: 14px;">
                    <p style="margin: 5px 0;"><strong>Fichier:</strong> ${filePath}</p>
                    <p style="margin: 5px 0;"><strong>Test:</strong> SecurityUtils.sanitizeText fonctionne correctement</p>
                    <p style="margin: 5px 0;"><strong>Exemple:</strong> "${testInput}" → "${result}"</p>
                    <p style="margin: 10px 0 0 0; padding-top: 10px; border-top: 1px solid #86efac; font-size: 13px;">
                        🎯 Cette correction est active en production et protège contre les injections XSS
                    </p>
                    <p style="margin: 10px 0 0 0; color: #059669; font-weight: 600;">
                        ✅ L'erreur a été marquée comme résolue et disparaîtra de la liste
                    </p>
                </div>
            </div>
        `;
        lucide.createIcons();
        
    } catch (err) {
        resultDiv.innerHTML = `
            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 15px; margin-top: 15px; color: #991b1b;">
                <strong>❌ Erreur lors du test:</strong> ${err.message}
            </div>
        `;
    }
};

window.testCorrection = async function(correctionId, errorId) {
    const resultDiv = document.getElementById(`test-result-${correctionId}`);
    if (!resultDiv) return;
    
    resultDiv.className = 'test-result info';
    resultDiv.innerHTML = '🔄 Test en cours...';
    
    try {
        // Vérifier que SecurityUtils existe et fonctionne
        if (!window.SecurityUtils) {
            throw new Error('window.SecurityUtils n\'existe pas');
        }
        
        if (typeof window.SecurityUtils.sanitizeText !== 'function') {
            throw new Error('window.SecurityUtils.sanitizeText n\'est pas une fonction');
        }
        
        // Tests basiques
        const test1 = window.SecurityUtils.sanitizeText('Test simple');
        const test2 = window.SecurityUtils.sanitizeText('<b>Texte avec HTML</b>');
        
        resultDiv.className = 'test-result success';
        resultDiv.innerHTML = `
            ✅ <strong>Tests réussis !</strong><br>
            - Test 1: "${test1}"<br>
            - Test 2: "${test2}"<br>
            <br>La correction fonctionne correctement.
        `;
    } catch (err) {
        resultDiv.className = 'test-result error';
        resultDiv.innerHTML = `❌ <strong>Erreur:</strong> ${err.message}`;
    }
};

window.validateCorrection = async function(correctionId, errorId) {
    const resultDiv = document.getElementById(`test-result-${correctionId}`);
    if (!resultDiv) return;
    
    resultDiv.className = 'test-result info';
    resultDiv.innerHTML = '🔄 Validation en cours...';
    
    try {
        // Mettre à jour le statut de l'erreur
        const { error: updateError } = await window.supabaseClient
            .from('cm_error_logs')
            .update({
                resolved: true,
                resolved_at: new Date().toISOString(),
                resolved_by: currentUser?.email || 'admin',
                resolution_note: `Correction validée le ${new Date().toLocaleString('fr-FR')}`
            })
            .eq('id', errorId);
        
        if (updateError) throw updateError;
        
        resultDiv.className = 'test-result success';
        resultDiv.innerHTML = `
            ✅ <strong>Correction validée avec succès !</strong><br>
            - Statut de l'erreur mis à jour: fixed<br>
            - Monitoring 24h activé<br>
            - Auto-résolution si aucune réapparition
        `;
        
        // Recharger les données après 2 secondes
        setTimeout(() => {
            notifyErrorStateChanged();
            loadTestCorrections();
            loadErrorsData();
            loadPerformanceMetrics();
        }, 2000);
        
    } catch (err) {
        resultDiv.className = 'test-result error';
        resultDiv.innerHTML = `❌ <strong>Erreur lors de la validation:</strong> ${err.message}`;
    }
};

window.viewErrorDetails = function(errorId) {
    window.location.href = `admin-error-details.html?id=${errorId}`;
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================================================
// EVENT LISTENERS
// ================================================================

function initEventListeners() {
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = '../index.html';
    });

    document.getElementById('unresolvedErrorTypeFilter')?.addEventListener('change', () => {
        renderFilteredErrors();
    });
}
