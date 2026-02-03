// ================================================================
// 📊 MONITORING DASHBOARD - JavaScript
// ================================================================

let currentUser = null;

// ================================================================
// INITIALISATION
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation Monitoring Dashboard...');
    
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
    
    console.log('✅ Monitoring Dashboard initialisé');
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
        loadPerformanceMetrics()
    ]);
}

async function loadErrorsData() {
    try {
        // Récupérer les erreurs non résolues avec tous les détails
        const { data: errors, error } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .eq('resolved', false)
            .order('timestamp', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        // Grouper par type/source/message pour avoir l'agrégation
        const grouped = {};
        errors?.forEach(err => {
            const key = `${err.error_type}|${err.source}|${err.message}`;
            if (!grouped[key]) {
                grouped[key] = {
                    ...err,
                    occurrences: 1,
                    first_occurrence: err.timestamp,
                    last_occurrence: err.timestamp,
                    all_instances: [err]
                };
            } else {
                grouped[key].occurrences++;
                if (new Date(err.timestamp) > new Date(grouped[key].last_occurrence)) {
                    grouped[key].last_occurrence = err.timestamp;
                }
                if (new Date(err.timestamp) < new Date(grouped[key].first_occurrence)) {
                    grouped[key].first_occurrence = err.timestamp;
                }
                grouped[key].all_instances.push(err);
            }
        });
        
        const groupedArray = Object.values(grouped);
        displayErrors(groupedArray);
        
    } catch (error) {
        console.error('❌ Erreur chargement erreurs:', error);
    }
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
        
        return `
        <div class="error-row ${err.error_type === 'warning' ? 'warning' : ''}" style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <span style="background: ${err.error_type === 'critical' ? '#ef4444' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                            ${err.error_type}
                        </span>
                        <strong style="font-family: monospace; color: #1e293b;">${locationInfo}</strong>
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
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary" onclick="showErrorDetails(${index})" style="padding: 6px 12px; font-size: 13px;">
                        <i data-lucide="code"></i>
                        Détails
                    </button>
                    <button class="btn btn-success" onclick="markErrorResolved('${errorTypeEscaped}', '${sourceEscaped}', '${messageEscaped}')" style="padding: 6px 12px; font-size: 13px;">
                        <i data-lucide="check"></i>
                        Résoudre
                    </button>
                </div>
            </div>
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

// ================================================================
// EVENT LISTENERS
// ================================================================

function initEventListeners() {
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = '../index.html';
    });
}
