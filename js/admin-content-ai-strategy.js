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
        
        // Récupérer le provider choisi
        const providerSelect = document.getElementById('aiProviderSelect');
        const useOpenAI = providerSelect ? providerSelect.value === 'openai' : false;
        const providerName = useOpenAI ? 'OpenAI GPT-4o' : 'Claude Sonnet 4.5';
        
        showToast(`🤖 Génération semaine 1 avec ${providerName}...`, 'info');
        
        // ÉTAPE 1 : Générer semaine 1 UNIQUEMENT (rapide, ~5-10s)
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-single-week',
                weekNumber: 1,
                startWeek,
                year,
                useOpenAI: useOpenAI
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
        await saveSingleWeek(week, year);
        
        // ÉTAPE 3.5 : Extraire et sauvegarder les actions proposées
        await saveActionsFromWeek(week);
        
        showToast('✅ Semaine 1 prête ! Génération 2-12 en cours...', 'success');
        
        // ÉTAPE 4 : Générer semaines 2-12 en arrière-plan
        generateRemainingWeeksBackground(startWeek, year, plan_global, useOpenAI);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

// Sauvegarder une semaine (SIMPLE: juste 1-12, IGNORE startWeek)
async function saveSingleWeek(semaine, year) {
    try {
        console.log('💾 Sauvegarde semaine', semaine.numero, '/ 12 pour année', year);
        
        const { error } = await window.supabaseClient
            .from('cm_ai_strategies')
            .upsert({
                semaine: semaine.numero, // TOUJOURS 1-12
                annee: year,
                objectif: semaine.objectif_principal || semaine.objectif || 'Objectif semaine ' + semaine.numero,
                cibles: semaine.cibles || [],
                themes: semaine.themes || [],
                kpis: semaine.kpis || {},
                strategie_complete: JSON.stringify(semaine),
                statut: semaine.numero === 1 ? 'actif' : 'planifié'
            }, { onConflict: 'semaine,annee' });
        
        if (error) {
            console.error('❌ Erreur sauvegarde semaine', semaine.numero, ':', error);
        } else {
            console.log('✅ Semaine', semaine.numero, 'sauvegardée en DB (vraie colonne semaine =', semaine.numero, ')');
        }
    } catch (err) {
        console.error('❌ Erreur saveSingleWeek:', err);
    }
}

// Sauvegarder les actions proposées d'une semaine
async function saveActionsFromWeek(week) {
    if (!week.actions || week.actions.length === 0) return;
    
    const actions = week.actions.map(action => ({
        type_contenu: action.type || 'article',
        titre: action.sujet || action.titre || 'Action semaine ' + week.numero,
        description: action.contenu_complet || action.description || 'Contenu à définir',
        statut: 'propose',
        priorite: action.priorite || 'moyenne',
        created_at: new Date().toISOString()
    }));
    
    await window.supabaseClient
        .from('cm_ai_actions')
        .insert(actions);
}

// Générer semaines 2-12 en arrière-plan (sans bloquer UI)
async function generateRemainingWeeksBackground(startWeek, year, planGlobal, useOpenAI = false) {
    for (let weekNum = 2; weekNum <= 12; weekNum++) {
        try {
            const response = await fetch('/api/content-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-single-week',
                    weekNumber: weekNum,
                    startWeek,
                    year,
                    useOpenAI: useOpenAI
                })
            });
            
            if (response.ok) {
                const { week } = await response.json();
                await saveSingleWeek(week, year);
                await saveActionsFromWeek(week);
                console.log(`✅ Semaine ${weekNum}/12 générée`);
            }
        } catch (err) {
            console.error(`❌ Erreur semaine ${weekNum}:`, err);
        }
    }
    
    showToast('✅ Plan 12 semaines complet !', 'success');
    loadCurrentStrategy();
    loadLongtermPlanFromDB(); // Recharger le plan complet depuis DB
}

// Charger le plan 12 semaines depuis la DB (après refresh page)
async function loadLongtermPlanFromDB() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        
        // Récupérer toutes les semaines 1-12 (actif OU planifié)
        const { data, error } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('annee', year)
            .in('statut', ['actif', 'planifié']) // Les deux statuts
            .gte('semaine', 1)
            .lte('semaine', 12)
            .order('semaine', { ascending: true });
        
        if (error) {
            console.error('❌ Erreur chargement plan:', error);
            return;
        }
        
        if (!data || data.length === 0) {
            console.log('ℹ️ Aucun plan sauvegardé en DB');
            return;
        }
        
        console.log(`✅ ${data.length} semaines trouvées en DB`);
        
        // Reconstituer le plan complet
        const semaines = data.map(row => {
            try {
                return JSON.parse(row.strategie_complete);
            } catch (err) {
                console.error('❌ Erreur parse semaine', row.semaine);
                return null;
            }
        }).filter(s => s !== null);
        
        if (semaines.length === 0) {
            console.log('⚠️ Aucune semaine valide après parsing');
            return;
        }
        
        const plan = {
            plan_global: {
                vision_3_mois: "Devenir référence gestion locative",
                objectifs_finaux: {
                    leads_qualifies: 250,
                    clients_signes: 35,
                    mrr_cible: "1800€"
                }
            },
            semaines: semaines
        };
        
        displayLongtermPlan(plan);
        console.log(`✅ Plan 12 semaines rechargé : ${semaines.length} semaines affichées`);
        
    } catch (error) {
        console.error('❌ Erreur rechargement plan:', error);
    }
}

// Afficher le plan
function displayLongtermPlan(plan) {
    const html = `
        <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3)); border-radius: 12px; border-left: 5px solid #667eea;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 1.4rem; color: #fff;">🎯 Vision 3 mois</h3>
                <button onclick="improvePlan()" style="background: white; color: #667eea; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                    <span>✨</span> Améliorer le plan
                </button>
            </div>
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
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                            <strong style="flex: 1;">${idx + 1}. ${action.sujet || action.titre || 'Action'}</strong>
                                            <div style="display: flex; gap: 5px;">
                                                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">${action.type}</span>
                                                <button onclick="generateFullContent(${s.numero}, ${idx})" style="background: #10B981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">✨ Générer</button>
                                            </div>
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
// AMÉLIORATION & GÉNÉRATION CONTENU
// ================================================================

// Améliorer le plan complet avec OpenAI
window.improvePlan = async function() {
    if (!confirm('Voulez-vous améliorer le plan avec plus d\'actions sur multiple plateformes ?')) return;
    
    showToast('🤖 OpenAI enrichit votre plan...', 'info');
    
    try {
        const { data: semaines } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('annee', new Date().getFullYear())
            .eq('statut', 'actif')
            .order('semaine', { ascending: true });
        
        if (!semaines || semaines.length === 0) throw new Error('Aucun plan à améliorer');
        
        for (const sem of semaines) {
            const strategy = JSON.parse(sem.strategie_complete);
            
            const prompt = `Enrichis cette semaine marketing avec 5-10 actions CONCRÈTES sur MULTIPLES plateformes (LinkedIn, Facebook, Instagram, Blog, Email, Vidéo).

Semaine ${strategy.numero}: ${strategy.objectif_principal || strategy.objectif}

Ajoute des actions avec:
- Contenu prêt à publier
- Suggestion visuel précise
- Hashtags
- Timing optimal

JSON uniquement:
{"actions_enrichies":[{"type":"post_linkedin","plateforme":"LinkedIn","sujet":"...","contenu_complet":"...","visuel_suggestion":"Photo calendrier synchronisé","hashtags":["#tag"],"timing":"Lundi 9h","priorite":"haute","kpi_attendu":"50 vues"}]}`;

            const response = await fetch('/api/openai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, maxTokens: 3000 })
            });
            
            if (!response.ok) continue;
            
            const { content } = await response.json();
            const cleanJSON = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const improved = JSON.parse(cleanJSON);
            
            strategy.actions = [...(strategy.actions || []), ...improved.actions_enrichies];
            
            await window.supabaseClient
                .from('cm_ai_strategies')
                .update({ strategie_complete: JSON.stringify(strategy) })
                .eq('id', sem.id);
            
            console.log(`✅ Semaine ${strategy.numero} enrichie`);
        }
        
        showToast('✅ Plan enrichi !', 'success');
        await loadLongtermPlanFromDB();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

// Générer contenu complet pour une action
window.generateFullContent = async function(weekNum, actionIdx) {
    showToast('🤖 Génération contenu...', 'info');
    
    try {
        console.log('🔍 Recherche semaine:', weekNum, 'année:', new Date().getFullYear());
        
        const { data, error } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('semaine', weekNum)
            .eq('annee', new Date().getFullYear())
            .in('statut', ['actif', 'planifié']); // IMPORTANT: filtrer sur statuts
        
        console.log('📊 Résultat query:', data, 'erreur:', error);
        
        if (error) {
            console.error('❌ Erreur DB:', error);
            throw error;
        }
        
        if (!data || data.length === 0) {
            throw new Error(`Semaine ${weekNum} non trouvée en DB`);
        }
        
        const strategy = JSON.parse(data[0].strategie_complete);
        console.log('📋 Stratégie chargée:', strategy);
        
        if (!strategy.actions || !strategy.actions[actionIdx]) {
            throw new Error(`Action ${actionIdx} non trouvée (total: ${strategy.actions?.length || 0})`);
        }
        
        const action = strategy.actions[actionIdx];
        console.log('🎯 Action:', action);
        
        const prompt = `Génère contenu PRÊT À PUBLIER:

Type: ${action.type}
Sujet: ${action.sujet || action.titre}

JSON:
{"titre":"...","contenu":"... (${action.type === 'article_blog' ? '800' : '250'} mots)","visuels":["suggestion 1","suggestion 2"],"hashtags":["#tag1"],"cta":"..."}`;

        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, maxTokens: 2000 })
        });
        
        if (!response.ok) throw new Error('Erreur API OpenAI');
        
        const { content } = await response.json();
        const cleanJSON = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const generated = JSON.parse(cleanJSON);
        
        alert(`✅ Contenu généré!\n\n${generated.titre}\n\n${generated.contenu.substring(0, 200)}...\n\nVisuels: ${generated.visuels.join(', ')}`);
        
        showToast('✅ Contenu prêt !', 'success');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

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
        
        showToast('✅ Action approuvée et ajoutée à la file', 'success');
        
        // Recharger UNIQUEMENT la liste des actions (pas de navigation)
        await loadAIActions();
        
    } catch (error) {
        console.error('❌ Erreur approbation:', error);
        showToast('❌ Erreur: ' + error.message, 'error');
    }
};

window.rejectAction = async function(actionId) {
    try {
        await window.supabaseClient
            .from('cm_ai_actions')
            .update({ statut: 'rejete' })
            .eq('id', actionId);
        
        showToast('❌ Action rejetée', 'info');
        
        // Recharger UNIQUEMENT la liste des actions (pas de navigation)
        await loadAIActions();
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ Erreur: ' + error.message, 'error');
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
    loadLongtermPlanFromDB(); // Recharger le plan 12 semaines
    
    // Charger actions uniquement si l'élément existe
    if (document.getElementById('actionsList')) {
        loadAIActions();
    }
});
