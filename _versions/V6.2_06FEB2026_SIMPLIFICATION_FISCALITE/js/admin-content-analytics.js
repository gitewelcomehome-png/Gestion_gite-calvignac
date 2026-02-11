// ================================================================
// 📊 ANALYTICS BI - Dashboard de Performance
// ================================================================

console.log('📊 Module Analytics BI chargé');

let platformChart, timelineChart;

// ================================================================
// CHARGEMENT ANALYTICS
// ================================================================

window.loadAnalytics = async function() {
    const timeRange = document.getElementById('timeRange').value;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

    try {
        // Charger actions archivées avec métriques
        const { data: actions, error } = await window.supabaseClient
            .from('cm_ai_actions')
            .select('*')
            .eq('archive', true)
            .gte('date_publication', daysAgo.toISOString())
            .order('date_publication', { ascending: false });

        if (error) throw error;

        if (!actions || actions.length === 0) {
            showEmptyState();
            return;
        }

        // Calculer KPIs
        displayKPIs(actions);

        // Générer graphiques
        displayPlatformChart(actions);
        displayTimelineChart(actions);

        // Top 10 actions
        displayTopActions(actions);

        // Insights IA
        generateAIInsights(actions);

    } catch (error) {
        console.error('❌ Erreur chargement analytics:', error);
    }
}

// ================================================================
// KPIs GLOBAUX
// ================================================================

function displayKPIs(actions) {
    const totalVues = actions.reduce((sum, a) => sum + (a.metriques?.vues || 0), 0);
    const totalLeads = actions.reduce((sum, a) => sum + (a.metriques?.leads || 0), 0);
    const totalClics = actions.reduce((sum, a) => sum + (a.metriques?.clics || 0), 0);
    const totalLikes = actions.reduce((sum, a) => sum + (a.metriques?.likes || 0), 0);
    const tauxEngagement = totalVues > 0 ? ((totalLikes + (actions.reduce((sum, a) => sum + (a.metriques?.commentaires || 0), 0))) / totalVues * 100).toFixed(2) : 0;
    const coutParLead = totalLeads > 0 ? (0 / totalLeads).toFixed(2) : 0; // TODO: ajouter coût campagnes

    const kpis = [
        { icon: 'eye', label: 'Vues Totales', value: totalVues.toLocaleString(), color: '#3b82f6', bgColor: '#eff6ff' },
        { icon: 'users', label: 'Leads Générés', value: totalLeads, color: '#10b981', bgColor: '#f0fdf4' },
        { icon: 'mouse-pointer-click', label: 'Clics', value: totalClics, color: '#f59e0b', bgColor: '#fffbeb' },
        { icon: 'heart', label: 'Likes', value: totalLikes, color: '#ef4444', bgColor: '#fef2f2' },
        { icon: 'trending-up', label: 'Taux Engagement', value: `${tauxEngagement}%`, color: '#8b5cf6', bgColor: '#faf5ff' },
        { icon: 'message-circle', label: 'Actions Publiées', value: actions.length, color: '#06b6d4', bgColor: '#f0fdfa' }
    ];

    document.getElementById('kpiCards').innerHTML = kpis.map(kpi => `
        <div style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border-left: 4px solid ${kpi.color};">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="color: #64748b; font-size: 0.875rem;">${kpi.label}</span>
                <div style="width: 40px; height: 40px; background: ${kpi.bgColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${kpi.icon}" style="width: 20px; height: 20px; color: ${kpi.color};"></i>
                </div>
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${kpi.value}</div>
        </div>
    `).join('');

    lucide.createIcons();
}

// ================================================================
// GRAPHIQUE PERFORMANCE PAR PLATEFORME
// ================================================================

function displayPlatformChart(actions) {
    const platforms = {};
    
    actions.forEach(action => {
        const platform = action.plateforme_publie || 'Autre';
        if (!platforms[platform]) {
            platforms[platform] = { vues: 0, leads: 0, engagement: 0 };
        }
        platforms[platform].vues += action.metriques?.vues || 0;
        platforms[platform].leads += action.metriques?.leads || 0;
        platforms[platform].engagement += (action.metriques?.likes || 0) + (action.metriques?.commentaires || 0);
    });

    const labels = Object.keys(platforms);
    const colors = {
        'linkedin': '#0A66C2',
        'facebook': '#1877F2',
        'instagram': '#E4405F',
        'video': '#FF0000',
        'email': '#F59E0B',
        'blog': '#059669'
    };

    if (platformChart) platformChart.destroy();

    const ctx = document.getElementById('platformChart').getContext('2d');
    platformChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Vues',
                    data: labels.map(l => platforms[l].vues),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderRadius: 6
                },
                {
                    label: 'Leads',
                    data: labels.map(l => platforms[l].leads),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 6
                },
                {
                    label: 'Engagement',
                    data: labels.map(l => platforms[l].engagement),
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ================================================================
// GRAPHIQUE ÉVOLUTION TEMPORELLE
// ================================================================

function displayTimelineChart(actions) {
    // Grouper par date
    const timeline = {};
    
    actions.forEach(action => {
        const date = new Date(action.date_publication).toLocaleDateString('fr-FR');
        if (!timeline[date]) {
            timeline[date] = { vues: 0, leads: 0 };
        }
        timeline[date].vues += action.metriques?.vues || 0;
        timeline[date].leads += action.metriques?.leads || 0;
    });

    const dates = Object.keys(timeline).sort();

    if (timelineChart) timelineChart.destroy();

    const ctx = document.getElementById('timelineChart').getContext('2d');
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Vues',
                    data: dates.map(d => timeline[d].vues),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Leads',
                    data: dates.map(d => timeline[d].leads),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ================================================================
// TOP 10 ACTIONS
// ================================================================

function displayTopActions(actions) {
    const sorted = actions
        .sort((a, b) => ((b.metriques?.leads || 0) * 10 + (b.metriques?.vues || 0)) - ((a.metriques?.leads || 0) * 10 + (a.metriques?.vues || 0)))
        .slice(0, 10);

    document.getElementById('topActionsTable').innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
                    <th style="padding: 12px; color: #64748b; font-weight: 600;">Titre</th>
                    <th style="padding: 12px; color: #64748b; font-weight: 600;">Plateforme</th>
                    <th style="padding: 12px; color: #64748b; font-weight: 600;">Vues</th>
                    <th style="padding: 12px; color: #64748b; font-weight: 600;">Leads</th>
                    <th style="padding: 12px; color: #64748b; font-weight: 600;">Engagement</th>
                    <th style="padding: 12px; color: #64748b; font-weight: 600;">Date</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map((action, idx) => {
                    const engagement = (action.metriques?.likes || 0) + (action.metriques?.commentaires || 0) + (action.metriques?.partages || 0);
                    return `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 12px;">
                                <span style="background: #fbbf24; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 8px;">#${idx + 1}</span>
                                ${action.titre}
                            </td>
                            <td style="padding: 12px;">${action.plateforme_publie || '-'}</td>
                            <td style="padding: 12px; font-weight: 600;">${action.metriques?.vues || 0}</td>
                            <td style="padding: 12px; font-weight: 600; color: #10b981;">${action.metriques?.leads || 0}</td>
                            <td style="padding: 12px;">${engagement}</td>
                            <td style="padding: 12px; color: #64748b; font-size: 0.875rem;">${new Date(action.date_publication).toLocaleDateString('fr-FR')}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// ================================================================
// INSIGHTS IA
// ================================================================

function generateAIInsights(actions) {
    const totalLeads = actions.reduce((sum, a) => sum + (a.metriques?.leads || 0), 0);
    const avgLeadsPerAction = (totalLeads / actions.length).toFixed(1);
    
    // Meilleure plateforme
    const platformLeads = {};
    actions.forEach(a => {
        const p = a.plateforme_publie || 'Autre';
        platformLeads[p] = (platformLeads[p] || 0) + (a.metriques?.leads || 0);
    });
    const bestPlatform = Object.keys(platformLeads).reduce((a, b) => platformLeads[a] > platformLeads[b] ? a : b);

    // Type de contenu performant
    const typePerformance = {};
    actions.forEach(a => {
        const type = a.type || 'autre';
        if (!typePerformance[type]) typePerformance[type] = { count: 0, leads: 0 };
        typePerformance[type].count++;
        typePerformance[type].leads += a.metriques?.leads || 0;
    });

    const insights = [
        `✅ **${actions.length} actions** publiées ont généré **${totalLeads} leads** (moyenne: ${avgLeadsPerAction} leads/action)`,
        `🏆 **${bestPlatform}** est votre plateforme la plus performante avec **${platformLeads[bestPlatform]} leads**`,
        `📈 Le taux d'engagement moyen est de **${(actions.reduce((sum, a) => sum + ((a.metriques?.likes || 0) + (a.metriques?.commentaires || 0)) / (a.metriques?.vues || 1), 0) / actions.length * 100).toFixed(2)}%**`,
        `💡 **Recommandation**: Concentrez vos efforts sur ${bestPlatform} et dupliquez les formats qui génèrent le plus de leads`
    ];

    document.getElementById('aiInsights').innerHTML = insights.map(i => `
        <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; margin-bottom: 10px; font-size: 0.95rem;">
            ${i}
        </div>
    `).join('');
}

// ================================================================
// EMPTY STATE
// ================================================================

function showEmptyState() {
    document.getElementById('kpiCards').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; background: white; border-radius: 12px;">
            <i data-lucide="bar-chart-3" style="width: 64px; height: 64px; color: #cbd5e1; margin-bottom: 16px;"></i>
            <p style="color: #64748b; margin: 0;">Aucune donnée disponible pour la période sélectionnée.</p>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 0.875rem;">Publiez et validez des actions pour voir les analytics.</p>
        </div>
    `;
    lucide.createIcons();
}

// ================================================================
// INIT
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
});
