// ================================================================
// 🎯 STRATÉGIE IA AUTONOME
// ================================================================
// Extension admin-content.js pour stratégie hebdomadaire automatique
// ================================================================

console.log('🤖 Module Stratégie IA chargé');

// ================================================================
// NAVIGATION ONGLETS
// ================================================================

window.switchTab = function(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    lucide.createIcons();
    
    // Charger les données selon l'onglet
    if (tabName === 'strategy') {
        loadCurrentStrategy();
    } else if (tabName === 'queue') {
        loadContentQueue();
    } else if (tabName === 'actions') {
        loadAIActions();
    }
};

// ================================================================
// GÉNÉRATION STRATÉGIE
// ================================================================

// Générer plan stratégique (semaine par semaine)
window.generateLongtermPlan = async function() {
    try {
        const now = new Date();
        const startWeek = getWeekNumber(now);
        const year = now.getFullYear();
        
        showToast('🤖 Génération semaine 1...', 'info');
        
        // GÉNÉRER SEMAINE 1 EN PRIORITÉ
        const response1 = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-single-week',
                weekNumber: 1,
                startWeek,
                year
            })
        });
        
        if (!response1.ok) {
            throw new Error('Erreur génération semaine 1');
        }
        
        const { week: week1, plan_global } = await response1.json();
        
        // AFFICHER IMMÉDIATEMENT SEMAINE 1
        const partialPlan = {
            plan_global: plan_global || { vision_3_mois: "Plan en cours de génération...", objectifs_finaux: {} },
            semaines: [week1]
        };
        
        displayLongtermPlan(partialPlan);
        loadCurrentStrategy();
        
        // Sauvegarder semaine 1
        await saveSingleWeek(week1, startWeek, year);
        
        showToast('✅ Semaine 1 prête ! Génération 2-12 en arrière-plan...', 'success');
        
        // GÉNÉRER LES 11 AUTRES SEMAINES EN ARRIÈRE-PLAN
        generateRemainingWeeksInBackground(startWeek, year, plan_global);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        
        const loaderEl = document.getElementById('longtermPlan');
        
        loaderEl.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #FEF2F2; border-radius: 8px; border: 1px solid #FCA5A5;">
                <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                <h3 style="color: #DC2626; margin-bottom: 10px;">Erreur de génération</h3>
                <p style="color: #7F1D1D; margin-bottom: 10px;">${error.message}</p>
                <button onclick="generateLongtermPlan()" class="btn-primary" style="background: #667eea; margin-top: 10px;">
                    <i data-lucide="refresh-cw"></i>
                    Réessayer
                </button>
            </div>
        `;
        showToast('❌ ' + error.message, 'error');
        lucide.createIcons();
    }
};

// Sauvegarder une semaine individuelle
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

// Générer les 11 autres semaines en arrière-plan
async function generateRemainingWeeksInBackground(startWeek, year, planGlobal) {
    const allWeeks = [];
    
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
                allWeeks.push(week);
                
                // Sauvegarder immédiatement
                await saveSingleWeek(week, startWeek, year);
                
                console.log(`✅ Semaine ${weekNum} générée et sauvegardée`);
                
                // Mettre à jour l'affichage progressivement
                updatePlanDisplay(week);
            }
        } catch (err) {
            console.error(`❌ Erreur semaine ${weekNum}:`, err);
        }
    }
    
    showToast('✅ Plan 12 semaines complet !', 'success');
    loadCurrentStrategy();
}

// Mettre à jour l'affichage avec une nouvelle semaine
function updatePlanDisplay(newWeek) {
    // Trouver le conteneur et ajouter la nouvelle semaine
    const container = document.querySelector('#longtermPlan > div');
    if (container) {
        const weekHtml = `
            <div style="padding: 15px; background: rgba(255,255,255,0.15); border-radius: 8px; border-left: 4px solid #10B981; margin-top: 10px;">
                <strong style="font-size: 1.1rem;">Semaine ${newWeek.numero}</strong>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">${newWeek.objectif_principal || newWeek.objectif}</p>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', weekHtml);
    }
}
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        
        const loaderEl = document.getElementById('longtermPlan');
        
        if (error.name === 'AbortError') {
            // Timeout - Afficher message avec option retry
            loaderEl.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #FEF2F2; border-radius: 8px; border: 1px solid #FCA5A5;">
                    <div style="font-size: 48px; margin-bottom: 15px;">⏱️</div>
                    <h3 style="color: #DC2626; margin-bottom: 10px;">Timeout - L'IA prend trop de temps</h3>
                    <p style="color: #7F1D1D; margin-bottom: 20px;">La génération dépasse 60 secondes. Vercel limite les réponses.</p>
                    <button onclick="generateLongtermPlan()" class="btn-primary" style="background: #667eea;">
                        <i data-lucide="refresh-cw"></i>
                        Réessayer
                    </button>
                    <p style="margin-top: 15px; font-size: 0.85rem; color: #9CA3AF;">💡 Le plan peut être sauvegardé partiellement en base</p>
                </div>
            `;
            showToast('⏱️ Timeout - L\'IA prend trop de temps. Réessayez.', 'error');
        } else {
            // Autre erreur
            loaderEl.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #FEF2F2; border-radius: 8px; border: 1px solid #FCA5A5;">
                    <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                    <h3 style="color: #DC2626; margin-bottom: 10px;">Erreur de génération</h3>
                    <p style="color: #7F1D1D; margin-bottom: 10px;">${error.message}</p>
                    <button onclick="generateLongtermPlan()" class="btn-primary" style="background: #667eea; margin-top: 10px;">
                        <i data-lucide="refresh-cw"></i>
                        Réessayer
                    </button>
                </div>
            `;
            showToast('❌ ' + error.message, 'error');
        }
        
        lucide.createIcons();
    }
};

// Afficher le plan long terme
function displayLongtermPlan(plan) {
    const html = `
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; font-size: 1.2rem;">🎯 Vision 3 mois</h3>
            <p style="margin: 0; opacity: 0.95;">${plan.plan_global.vision}</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 15px;">
                <div><strong>Notoriété</strong><br>${plan.plan_global.objectifs_finaux.notoriete}</div>
                <div><strong>Engagement</strong><br>${plan.plan_global.objectifs_finaux.engagement}</div>
                <div><strong>Leads</strong><br>${plan.plan_global.objectifs_finaux.leads}</div>
                <div><strong>Conversions</strong><br>${plan.plan_global.objectifs_finaux.conversions}</div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
            ${plan.semaines.map(s => `
                <div style="padding: 15px; background: rgba(255,255,255,0.15); border-radius: 8px; border-left: 4px solid ${
                    s.phase === 'DÉMARRAGE' ? '#10B981' : s.phase === 'CROISSANCE' ? '#F59E0B' : '#3B82F6'
                };">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <strong style="font-size: 1.1rem;">Semaine ${s.numero}</strong>
                        <span style="font-size: 0.85rem; opacity: 0.9;">${s.phase}</span>
                    </div>
                    <p style="margin: 0 0 10px 0; font-size: 0.95rem; opacity: 0.95;">${s.objectif}</p>
                    <div style="font-size: 0.85rem; opacity: 0.9;">
                        <div>📊 ${s.kpis?.leads || 0} leads</div>
                        <div>👁️ ${s.kpis?.impressions || 0} impressions</div>
                        <div>📝 ${s.actions?.length || 0} actions</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('longtermPlan').innerHTML = html;
}

// Générer actions proposées depuis le plan
async function generateActionsFromPlan(plan) {
    try {
        const actions = [];
        plan.semaines.forEach(semaine => {
            semaine.actions?.forEach(action => {
                if (action.type === 'promotion') {
                    actions.push({
                        type: 'promotion',
                        titre: action.titre,
                        description: action.sujet || 'Promotion planifiée',
                        justification: `Prévu plan S${semaine.numero} (${semaine.phase})`,
                        priorite: action.priorite || 'moyenne',
                        statut: 'proposé'
                    });
                }
            });
        });
        if (actions.length > 0) {
            await window.supabaseClient.from('cm_ai_actions').insert(actions);
        }
    } catch (error) {
        console.error('❌ Erreur actions:', error);
    }
}

window.generateWeeklyStrategy = async function() {
    try {
        const now = new Date();
        const weekNumber = getWeekNumber(now);
        const year = now.getFullYear();
        
        showToast('🤖 L\'IA génère votre stratégie...', 'info');
        
        // Récupérer l'historique récent
        const { data: history } = await window.supabaseClient
            .from('cm_ai_content_history')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(10);
        
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-weekly-strategy',
                weekNumber,
                year,
                history
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur génération stratégie');
        }
        
        const { strategy } = await response.json();
        
        // Sauvegarder dans la base
        const { data: saved, error } = await window.supabaseClient
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
            }, { onConflict: 'semaine,annee' })
            .select()
            .single();
        
        if (error) throw error;
        
        showToast('✅ Stratégie générée avec succès !', 'success');
        displayStrategy(saved);
        
        // Générer automatiquement la queue de contenus
        try {
            await generateContentQueue(saved.id, strategy);
        } catch (queueError) {
            console.error('❌ Erreur queue:', queueError);
            showToast('⚠️ Stratégie OK mais erreur queue: ' + queueError.message, 'warning');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

// Afficher la stratégie
function displayStrategy(strategyData) {
    const strategy = JSON.parse(strategyData.strategie_complete);
    
    const html = `
        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 1.5rem;">📍 Semaine ${strategyData.semaine}/${strategyData.annee}</h3>
            <p style="margin: 0; font-size: 1.1rem; opacity: 0.9;">${strategy.objectif}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="padding: 15px; background: #F3F4F6; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #374151;">🎯 Cibles</h4>
                <ul style="margin: 0; padding-left: 20px; color: #6B7280;">
                    ${strategy.cibles.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
            
            <div style="padding: 15px; background: #F3F4F6; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #374151;">💡 Thèmes</h4>
                <ul style="margin: 0; padding-left: 20px; color: #6B7280;">
                    ${strategy.themes.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
            
            <div style="padding: 15px; background: #F3F4F6; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0; color: #374151;">📊 KPIs</h4>
                <ul style="margin: 0; padding-left: 20px; color: #6B7280;">
                    <li>Impressions : ${strategy.kpis.impressions || 'N/A'}</li>
                    <li>Engagement : ${strategy.kpis.engagement_rate || 'N/A'}%</li>
                    <li>Leads : ${strategy.kpis.leads || 'N/A'}</li>
                </ul>
            </div>
        </div>
        
        <div style="padding: 15px; background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 4px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #92400E;">🔥 Angles d'attaque</h4>
            <ul style="margin: 0; padding-left: 20px; color: #78350F;">
                ${strategy.angles.map(a => `<li>${a}</li>`).join('')}
            </ul>
        </div>
        
        <div style="padding: 15px; background: #F9FAFB; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; color: #374151;">📝 Contenus suggérés (${strategy.contenus.length})</h4>
            <div style="display: grid; gap: 10px;">
                ${strategy.contenus.map((c, i) => `
                    <div style="padding: 12px; background: white; border: 1px solid #E5E7EB; border-radius: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong style="color: #06b6d4;">${c.plateforme.toUpperCase()}</strong> - ${c.sujet}
                                <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #6B7280;">${c.angle}</p>
                                <small style="color: #9CA3AF;">⏰ ${c.heure_ideale || 'À définir'}</small>
                            </div>
                            <button class="btn-secondary" onclick="generateFromIdea(${i}, '${strategyData.id}')" style="font-size: 0.85rem;">
                                Générer
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="margin-top: 15px; padding: 15px; background: #EFF6FF; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #1E40AF;">🏷️ Hashtags stratégiques</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${strategy.hashtags.map(h => `<span style="padding: 4px 12px; background: #DBEAFE; color: #1E40AF; border-radius: 20px; font-size: 0.9rem;">${h}</span>`).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('currentStrategy').innerHTML = html;
}

// Charger la stratégie actuelle
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
        
        if (data) {
            displayStrategy(data);
        }
    } catch (error) {
        console.error('Erreur chargement stratégie:', error);
    }
}

// ================================================================
// GÉNÉRATION QUEUE CONTENUS
// ================================================================

async function generateContentQueue(strategyId, strategy) {
    try {
        showToast('🤖 Génération de la queue de contenus...', 'info');
        
        console.log('📋 Génération queue pour', strategy.contenus.length, 'contenus');
        
        const contentPromises = strategy.contenus.map(async (idea, index) => {
            try {
                console.log(`📝 Contenu ${index + 1}:`, idea.sujet);
                
                // Récupérer l'historique pour cohérence
                const { data: history } = await window.supabaseClient
                    .from('cm_ai_content_history')
                    .select('*')
                    .eq('plateforme', idea.plateforme)
                    .order('published_at', { ascending: false })
                    .limit(3);
                
                // Générer le contenu
                const response = await fetch('/api/content-ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'generate-content-from-strategy',
                        contentIdea: idea,
                        history: history || [],
                        strategy
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Erreur API:', errorText);
                    throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
                }
                
                const result = await response.json();
                console.log('✅ Contenu généré:', result);
                
                const content = result.content;
                
                // Calculer la date de publication (étaler sur 7 jours)
                const scheduledDate = new Date();
                scheduledDate.setDate(scheduledDate.getDate() + index);
                
                // Parser l'heure (gère "14h", "Mardi 14h", etc.)
                let hour = 14; // Défaut
                if (idea.heure_ideale) {
                    const match = idea.heure_ideale.match(/(\d+)h/);
                    if (match) {
                        hour = parseInt(match[1]);
                        if (hour < 0 || hour > 23) hour = 14;
                    }
                }
                scheduledDate.setHours(hour, 0, 0, 0);
                
                // Insérer dans la queue
                const { data, error } = await window.supabaseClient
                    .from('cm_ai_content_queue')
                    .insert({
                        strategy_id: strategyId,
                        type: idea.type,
                        plateforme: idea.plateforme,
                        sujet: idea.sujet,
                        contenu: content.contenu || 'Contenu généré',
                        image_url: null,
                        hashtags: content.hashtags || strategy.hashtags?.slice(0, 5) || [],
                        scheduled_date: scheduledDate.toISOString(),
                        statut: 'en_attente'
                    })
                    .select();
                
                if (error) {
                    console.error('❌ Erreur insert:', error);
                    throw error;
                }
                
                console.log('✅ Inséré dans queue:', data);
                return data;
                
            } catch (itemError) {
                console.error(`❌ Erreur contenu ${index + 1}:`, itemError);
                throw itemError;
            }
        });
        
        const results = await Promise.allSettled(contentPromises);
        const successes = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;
        
        console.log(`📊 Résultats: ${successes} succès, ${failures} échecs`);
        
        if (successes > 0) {
            showToast(`✅ ${successes} contenu(s) créé(s) !`, 'success');
            loadContentQueue();
        }
        
        if (failures > 0) {
            showToast(`⚠️ ${failures} erreur(s)`, 'warning');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ Erreur génération queue', 'error');
    }
}

// Charger la queue de contenus
async function loadContentQueue() {
    try {
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const { data, error } = await window.supabaseClient
            .from('cm_ai_content_queue')
            .select('*')
            .gte('scheduled_date', now.toISOString())
            .lte('scheduled_date', in7Days.toISOString())
            .order('scheduled_date', { ascending: true });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            document.getElementById('contentQueue').innerHTML = `
                <p style="text-align: center; color: #9CA3AF; padding: 40px;">
                    <i data-lucide="calendar" style="width: 48px; height: 48px; margin: 0 auto 10px;"></i><br>
                    Aucun contenu programmé. L'IA créera automatiquement des publications basées sur votre stratégie.
                </p>
            `;
            return;
        }
        
        const html = `
            <div style="display: grid; gap: 15px;">
                ${data.map(item => {
                    const date = new Date(item.scheduled_date);
                    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    
                    return `
                        <div style="padding: 15px; background: white; border: 1px solid #E5E7EB; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                        <span style="padding: 4px 12px; background: #06b6d4; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">
                                            ${item.plateforme}
                                        </span>
                                        <span style="color: #6B7280; font-size: 0.9rem;">
                                            📅 ${dateStr} à ${timeStr}
                                        </span>
                                        <span style="padding: 4px 12px; background: ${item.statut === 'publié' ? '#10B981' : '#F59E0B'}; color: white; border-radius: 20px; font-size: 0.85rem;">
                                            ${item.statut === 'publié' ? '✅ Publié' : '⏳ En attente'}
                                        </span>
                                    </div>
                                    <h4 style="margin: 0 0 8px 0; color: #111827;">${item.sujet}</h4>
                                    <p style="margin: 0; color: #6B7280; font-size: 0.95rem; line-height: 1.5;">
                                        ${item.contenu.substring(0, 150)}${item.contenu.length > 150 ? '...' : ''}
                                    </p>
                                    ${item.hashtags && item.hashtags.length > 0 ? `
                                        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
                                            ${item.hashtags.slice(0, 5).map(h => `<span style="padding: 2px 8px; background: #EFF6FF; color: #2563EB; border-radius: 12px; font-size: 0.8rem;">${h}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="display: flex; gap: 8px; margin-left: 15px;">
                                    <button class="btn-secondary" onclick="editQueueItem('${item.id}')" style="font-size: 0.85rem;">
                                        Modifier
                                    </button>
                                    ${item.statut === 'en_attente' ? `
                                        <button class="btn-primary" onclick="publishQueueItem('${item.id}')" style="font-size: 0.85rem;">
                                            Publier
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        document.getElementById('contentQueue').innerHTML = html;
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
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
            .in('statut', ['proposé', 'accepté', 'en_cours'])
            .order('priorite', { ascending: false })
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            document.getElementById('aiActions').innerHTML = `
                <p style="text-align: center; color: #9CA3AF; padding: 40px;">
                    <i data-lucide="zap" style="width: 48px; height: 48px; margin: 0 auto 10px;"></i><br>
                    Aucune action proposée pour le moment.
                </p>
            `;
            return;
        }
        
        const html = `
            <div style="display: grid; gap: 15px;">
                ${data.map(action => {
                    const priorityColor = action.priorite === 'haute' ? '#EF4444' : action.priorite === 'moyenne' ? '#F59E0B' : '#10B981';
                    const statusColor = action.statut === 'accepté' ? '#10B981' : action.statut === 'en_cours' ? '#3B82F6' : '#6B7280';
                    
                    return `
                        <div style="padding: 15px; background: white; border: 1px solid #E5E7EB; border-left: 4px solid ${priorityColor}; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                        <span style="padding: 4px 12px; background: ${priorityColor}; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">
                                            ${action.priorite.toUpperCase()}
                                        </span>
                                        <span style="padding: 4px 12px; background: ${statusColor}; color: white; border-radius: 20px; font-size: 0.85rem;">
                                            ${action.statut}
                                        </span>
                                        <span style="color: #9CA3AF; font-size: 0.85rem;">
                                            ${action.type}
                                        </span>
                                    </div>
                                    <h4 style="margin: 0 0 8px 0; color: #111827;">${action.titre}</h4>
                                    <p style="margin: 0 0 10px 0; color: #6B7280; line-height: 1.5;">${action.description}</p>
                                    ${action.justification ? `
                                        <p style="margin: 0; padding: 10px; background: #F3F4F6; border-radius: 6px; color: #374151; font-size: 0.9rem;">
                                            💡 ${action.justification}
                                        </p>
                                    ` : ''}
                                </div>
                                ${action.statut === 'proposé' ? `
                                    <div style="display: flex; gap: 8px; margin-left: 15px;">
                                        <button class="btn-secondary" onclick="rejectAction('${action.id}')" style="font-size: 0.85rem;">
                                            Refuser
                                        </button>
                                        <button class="btn-primary" onclick="acceptAction('${action.id}')" style="font-size: 0.85rem;">
                                            Accepter
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        document.getElementById('aiActions').innerHTML = html;
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// Accepter/Refuser une action
window.acceptAction = async function(actionId) {
    try {
        const { error } = await window.supabaseClient
            .from('cm_ai_actions')
            .update({ statut: 'accepté', decided_at: new Date().toISOString() })
            .eq('id', actionId);
        
        if (error) throw error;
        
        showToast('✅ Action acceptée !', 'success');
        loadAIActions();
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ Erreur', 'error');
    }
};

window.rejectAction = async function(actionId) {
    try {
        const { error } = await window.supabaseClient
            .from('cm_ai_actions')
            .update({ statut: 'refusé', decided_at: new Date().toISOString() })
            .eq('id', actionId);
        
        if (error) throw error;
        
        showToast('✅ Action refusée', 'success');
        loadAIActions();
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ Erreur', 'error');
    }
};

// ================================================================
// UTILITAIRES
// ================================================================

// Générer un contenu à partir d'une idée de stratégie
window.generateFromIdea = async function(ideaIndex, strategyId) {
    try {
        showToast('🤖 Génération du contenu...', 'info');
        
        // Récupérer la stratégie
        const { data: strategyData, error: stratError } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('id', strategyId)
            .single();
        
        if (stratError) throw stratError;
        
        const strategy = JSON.parse(strategyData.strategie_complete);
        const idea = strategy.contenus[ideaIndex];
        
        // Récupérer l'historique
        const { data: history } = await window.supabaseClient
            .from('cm_ai_content_history')
            .select('*')
            .eq('plateforme', idea.plateforme)
            .order('published_at', { ascending: false })
            .limit(3);
        
        // Générer le contenu
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-content-from-strategy',
                contentIdea: idea,
                history,
                strategy
            })
        });
        
        if (!response.ok) throw new Error('Erreur génération');
        
        const { content } = await response.json();
        
        showToast('✅ Contenu généré !', 'success');
        
        // Afficher dans une modal ou rediriger vers l'onglet génération
        alert(`Contenu généré :\n\n${content.contenu}\n\nHashtags: ${content.hashtags?.join(' ') || 'N/A'}`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}
