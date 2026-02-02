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
        const { data: errors, error } = await window.supabaseClient
            .from('v_cm_errors_unresolved')
            .select('*')
            .limit(20);
        
        if (error) throw error;
        
        displayErrors(errors || []);
        
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
    
    container.innerHTML = errors.map(err => `
        <div class="error-row ${err.error_type === 'warning' ? 'warning' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <span style="background: ${err.error_type === 'critical' ? '#ef4444' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                            ${err.error_type}
                        </span>
                        <strong>${err.source}</strong>
                    </div>
                    <div style="color: #475569; font-size: 14px; margin-bottom: 8px;">
                        ${err.message}
                    </div>
                    <div style="display: flex; gap: 20px; font-size: 13px; color: #64748b;">
                        <span>🔄 ${err.occurrences} occurrence(s)</span>
                        <span>📅 Première: ${new Date(err.first_occurrence).toLocaleDateString('fr-FR')}</span>
                        <span>⏰ Dernière: ${new Date(err.last_occurrence).toLocaleString('fr-FR')}</span>
                    </div>
                </div>
                <button class="btn btn-success" onclick="markErrorResolved('${err.error_type}', '${err.source}', '${err.message}')" style="padding: 6px 12px; font-size: 13px;">
                    <i data-lucide="check"></i>
                    Résoudre
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
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
