// ================================================================
// 🎯 STRATÉGIE IA AUTONOME - OPTIMISÉ SANS TIMEOUT
// ================================================================
// Génération semaine par semaine pour contourner limite Vercel 60s
// ================================================================

console.log('🤖 Module Stratégie IA chargé');

// ================================================================
// NAVIGATION ONGLETS
// ================================================================

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    lucide.createIcons();
    
    if (tabName === 'strategy') {
        loadCurrentStrategy();
    } else if (tabName === 'queue') {
        loadContentQueue();
    } else if (tabName === 'actions') {
        loadAIActions();
    }
};

// ================================================================
// GÉNÉRATION PLAN 12 SEMAINES (SANS TIMEOUT)
// ================================================================

window.generateLongtermPlan = async function() {
    try {
        const now = new Date();
        const startWeek = getWeekNumber(now);
        const year = now.getFullYear();
        
        showToast('🤖 Génération semaine 1...', 'info');
        
        // ÉTAPE 1 : Générer semaine 1 UNIQUEMENT (rapide, ~5-10s)
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-single-week',
                weekNumber: 1,
                startWeek,
                year
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur génération semaine 1');
        }
        
        const { week, plan_global } = await response.json();
        
        // DEBUG: Voir ce que Claude a vraiment généré
        console.log('📊 CONTENU GÉNÉRÉ PAR CLAUDE:', JSON.stringify(week, null, 2));
        
        // Afficher semaine 1 immédiatement
        const partialPlan = {
            plan_global: plan_global || {
                vision_3_mois: "Devenir référence gestion locative",
                objectifs_finaux: {
                    leads_qualifies: 250,
                    clients_signes: 35,
                    mrr_cible: "1800€"
                }
            },
            semaines: [week]
        };
        
        displayLongtermPlan(partialPlan);
        
        // ÉTAPE 3 : Sauvegarder semaine 1
        await saveSingleWeek(week, startWeek, year);
        
        showToast('✅ Semaine 1 prête ! Génération 2-12 en cours...', 'success');
        
        // ÉTAPE 4 : Générer semaines 2-12 en arrière-plan
        generateRemainingWeeksBackground(startWeek, year, plan_global);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

// Sauvegarder une semaine
async function saveSingleWeek(semaine, startWeek, year) {
    const weekNum = startWeek + (semaine.numero - 1);
    
    await window.supabaseClient
        .from('cm_ai_strategies')
        .upsert({
            semaine: weekNum > 52 ? weekNum - 52 : weekNum,
            annee: weekNum > 52 ? year + 1 : year,
            objectif: semaine.objectif_principal || semaine.objectif,
            cibles: semaine.cibles || [],
            themes: semaine.themes || [],
            kpis: semaine.kpis || {},
            strategie_complete: JSON.stringify(semaine),
            statut: semaine.numero === 1 ? 'actif' : 'planifié'
        }, { onConflict: 'semaine,annee' });
}

// Générer semaines 2-12 en arrière-plan (sans bloquer UI)
async function generateRemainingWeeksBackground(startWeek, year, planGlobal) {
    for (let weekNum = 2; weekNum <= 12; weekNum++) {
        try {
            const response = await fetch('/api/content-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-single-week',
                    weekNumber: weekNum,
                    startWeek,
                    year
                })
            });
            
            if (response.ok) {
                const { week } = await response.json();
                await saveSingleWeek(week, startWeek, year);
                console.log(`✅ Semaine ${weekNum}/12 générée`);
            }
        } catch (err) {
            console.error(`❌ Erreur semaine ${weekNum}:`, err);
        }
    }
    
    showToast('✅ Plan 12 semaines complet !', 'success');
    loadCurrentStrategy();
}

// Afficher le plan
function displayLongtermPlan(plan) {
    const html = `
        <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3)); border-radius: 12px; border-left: 5px solid #667eea;">
            <h3 style="margin: 0 0 15px 0; font-size: 1.4rem; color: #fff;">🎯 Vision 3 mois</h3>
            <p style="margin: 0 0 20px 0; font-size: 1.1rem; line-height: 1.6;">${plan.plan_global.vision_3_mois || plan.plan_global.vision || 'Devenir référence gestion locative'}</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                <div style="padding: 15px; background: rgba(255,255,255,0.15); border-radius: 8px;">
                    <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 5px;">Leads Qualifiés</div>
                    <div style="font-size: 1.8rem; font-weight: bold;">${plan.plan_global.objectifs_finaux?.leads_qualifies || '250'}</div>
                </div>
                <div style="padding: 15px; background: rgba(255,255,255,0.15); border-radius: 8px;">
                    <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 5px;">Clients Signés</div>
                    <div style="font-size: 1.8rem; font-weight: bold;">${plan.plan_global.objectifs_finaux?.clients_signes || '35'}</div>
                </div>
                <div style="padding: 15px; background: rgba(255,255,255,0.15); border-radius: 8px;">
                    <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 5px;">MRR Cible</div>
                    <div style="font-size: 1.8rem; font-weight: bold;">${plan.plan_global.objectifs_finaux?.mrr_cible || '1800€'}</div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; gap: 20px;">
            ${plan.semaines.map(s => `
                <div style="padding: 25px; background: rgba(255,255,255,0.1); border-radius: 12px; border-left: 5px solid ${s.numero === 1 ? '#10B981' : '#667eea'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; font-size: 1.3rem;">📅 Semaine ${s.numero}</h4>
                        <span style="background: ${s.numero === 1 ? '#10B981' : '#667eea'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">
                            ${s.numero === 1 ? 'ACTIVE' : 'PLANIFIÉE'}
                        </span>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h5 style="margin: 0 0 10px 0; font-size: 1.1rem; color: #10B981;">🎯 ${s.objectif_principal || s.objectif}</h5>
                        ${s.sous_objectifs ? `
                            <ul style="margin: 10px 0; padding-left: 20px; opacity: 0.9;">
                                ${s.sous_objectifs.map(so => `<li style="margin: 5px 0;">${so}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="display: block; margin-bottom: 8px; opacity: 0.9;">👥 Cibles:</strong>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${(s.cibles || []).map(c => `<span style="background: rgba(102,126,234,0.3); padding: 6px 12px; border-radius: 6px; font-size: 0.9rem;">${c}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <strong style="display: block; margin-bottom: 8px; opacity: 0.9;">🔑 Thèmes clés:</strong>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${(s.themes || []).map(t => `<span style="background: rgba(16,185,129,0.3); padding: 6px 12px; border-radius: 6px; font-size: 0.9rem;">${t}</span>`).join('')}
                        </div>
                    </div>
                    
                    ${s.actions && s.actions.length > 0 ? `
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                            <strong style="display: block; margin-bottom: 12px; font-size: 1.05rem;">📋 Actions (${s.actions.length})</strong>
                            <div style="display: grid; gap: 12px;">
                                ${s.actions.map((action, idx) => `
                                    <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid ${action.priorite === 'haute' ? '#EF4444' : action.priorite === 'moyenne' ? '#F59E0B' : '#10B981'};">
                                        <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
                                            <strong style="flex: 1;">${idx + 1}. ${action.sujet || action.titre || 'Action'}</strong>
                                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">${action.type}</span>
                                        </div>
                                        ${action.timing ? `<div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 5px;">⏰ ${action.timing}</div>` : ''}
                                        ${action.contenu_complet ? `<div style="font-size: 0.9rem; margin-top: 8px; opacity: 0.9; line-height: 1.5; max-height: 100px; overflow: hidden;">${action.contenu_complet.substring(0, 200)}${action.contenu_complet.length > 200 ? '...' : ''}</div>` : ''}
                                        ${action.kpi_attendu ? `<div style="font-size: 0.8rem; margin-top: 8px; color: #10B981;">📊 ${action.kpi_attendu}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${s.kpis ? `
                        <div style="margin-top: 20px; padding: 15px; background: rgba(16,185,129,0.1); border-radius: 8px;">
                            <strong style="display: block; margin-bottom: 10px;">📊 KPIs</strong>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 0.9rem;">
                                ${s.kpis.leads ? `<div><strong>${s.kpis.leads.cible}</strong> leads ciblés</div>` : ''}
                                ${s.kpis.impressions ? `<div><strong>${s.kpis.impressions.cible}</strong> impressions</div>` : ''}
                                ${s.kpis.conversions ? `<div><strong>${s.kpis.conversions.inscriptions || 0}</strong> inscriptions</div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('longtermPlan').innerHTML = html;
}

// ================================================================
// STRATÉGIE HEBDOMADAIRE
// ================================================================

window.generateWeeklyStrategy = async function() {
    try {
        const now = new Date();
        const weekNumber = getWeekNumber(now);
        const year = now.getFullYear();
        
        showToast('🤖 Génération stratégie semaine...', 'info');
        
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-weekly-strategy',
                weekNumber,
                year
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur API');
        }
        
        const { strategy } = await response.json();
        
        await window.supabaseClient
            .from('cm_ai_strategies')
            .upsert({
                semaine: weekNumber,
                annee: year,
                objectif: strategy.objectif,
                cibles: strategy.cibles,
                themes: strategy.themes,
                kpis: strategy.kpis,
                strategie_complete: JSON.stringify(strategy),
                statut: 'actif'
            }, { onConflict: 'semaine,annee' });
        
        showToast('✅ Stratégie générée !', 'success');
        loadCurrentStrategy();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

// Charger stratégie actuelle
async function loadCurrentStrategy() {
    try {
        const now = new Date();
        const weekNumber = getWeekNumber(now);
        const year = now.getFullYear();
        
        const { data, error } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('semaine', weekNumber)
            .eq('annee', year)
            .eq('statut', 'actif')
            .single();
        
        if (error || !data) {
            document.getElementById('currentStrategy').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #9CA3AF;">
                    <p style="margin-bottom: 15px;">📋 Aucune stratégie active cette semaine</p>
                    <button onclick="generateWeeklyStrategy()" class="btn-primary" style="background: #667eea;">
                        <i data-lucide="sparkles"></i>
                        Générer Stratégie
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        const strategy = JSON.parse(data.strategie_complete);
        
        const html = `
            <div style="padding: 20px; background: rgba(255,255,255,0.15); border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; font-size: 1.2rem;">🎯 ${strategy.objectif}</h3>
                
                <div style="margin-bottom: 15px;">
                    <strong style="display: block; margin-bottom: 5px;">Cibles:</strong>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${strategy.cibles.map(c => `<span style="background: rgba(102,126,234,0.2); padding: 4px 10px; border-radius: 4px;">${c}</span>`).join('')}
                    </div>
                </div>
                
                <div>
                    <strong style="display: block; margin-bottom: 5px;">Thèmes clés:</strong>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${strategy.themes.map(t => `<span style="background: rgba(16,185,129,0.2); padding: 4px 10px; border-radius: 4px;">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('currentStrategy').innerHTML = html;
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
    }
}

// ================================================================
// PUBLICATIONS PROGRAMMÉES
// ================================================================

async function loadContentQueue() {
    try {
        const { data, error } = await window.supabaseClient
            .from('cm_ai_content_queue')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            document.getElementById('queueList').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #9CA3AF;">
                    <p>📅 Aucune publication programmée</p>
                </div>
            `;
            return;
        }
        
        const html = data.map(item => `
            <div style="padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong>${item.type_contenu}</strong>
                    <span style="font-size: 0.85rem; color: #9CA3AF;">${new Date(item.date_publication).toLocaleDateString('fr-FR')}</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">${item.sujet}</p>
            </div>
        `).join('');
        
        document.getElementById('queueList').innerHTML = html;
        
    } catch (error) {
        console.error('❌ Erreur chargement queue:', error);
    }
}

// ================================================================
// ACTIONS PROPOSÉES
// ================================================================

async function loadAIActions() {
    try {
        const { data, error } = await window.supabaseClient
            .from('cm_ai_actions')
            .select('*')
            .eq('statut', 'propose')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            document.getElementById('actionsList').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #9CA3AF;">
                    <p>💡 Aucune action proposée</p>
                </div>
            `;
            return;
        }
        
        const html = data.map(action => `
            <div style="padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px;">
                <strong style="display: block; margin-bottom: 5px;">${action.titre}</strong>
                <p style="margin: 8px 0; font-size: 0.9rem; opacity: 0.9;">${action.description}</p>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="approveAction('${action.id}')" class="btn-success" style="background: #10B981; padding: 5px 12px; border-radius: 4px; border: none; color: white; cursor: pointer;">
                        ✅ Approuver
                    </button>
                    <button onclick="rejectAction('${action.id}')" class="btn-danger" style="background: #EF4444; padding: 5px 12px; border-radius: 4px; border: none; color: white; cursor: pointer;">
                        ❌ Rejeter
                    </button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('actionsList').innerHTML = html;
        
    } catch (error) {
        console.error('❌ Erreur chargement actions:', error);
    }
}

window.approveAction = async function(actionId) {
    try {
        // 1. Récupérer les détails de l'action
        const { data: action, error: fetchError } = await window.supabaseClient
            .from('cm_ai_actions')
            .select('*')
            .eq('id', actionId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // 2. Sauvegarder dans la file de contenu (cm_ai_content_queue)
        const { error: insertError } = await window.supabaseClient
            .from('cm_ai_content_queue')
            .insert({
                type_contenu: action.type_contenu || 'article',
                sujet: action.titre,
                contenu: action.description,
                statut: 'approuve',
                created_at: new Date().toISOString()
            });
        
        if (insertError) throw insertError;
        
        // 3. Mettre à jour le statut de l'action
        const { error: updateError } = await window.supabaseClient
            .from('cm_ai_actions')
            .update({ statut: 'approuve' })
            .eq('id', actionId);
        
        if (updateError) throw updateError;
        
        showToast('✅ Action approuvée et ajoutée à la file de contenu', 'success');
        
        // Recharger SANS changer d'onglet
        await loadAIActions();
        await loadContentQueue();
        
    } catch (error) {
        console.error('❌ Erreur approbation:', error);
        showToast('❌ Erreur lors de l\'approbation', 'error');
    }
};

window.rejectAction = async function(actionId) {
    try {
        await window.supabaseClient
            .from('cm_ai_actions')
            .update({ statut: 'rejete' })
            .eq('id', actionId);
        
        showToast('❌ Action rejetée', 'info');
        loadAIActions();
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
};

// ================================================================
// UTILITAIRES
// ================================================================

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function showToast(message, type) {
    console.log(`[${type}] ${message}`);
}

// Init au chargement
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentStrategy();
});
