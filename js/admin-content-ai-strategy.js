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
        
        // Récupérer les plateformes sélectionnées
        const platforms = [];
        ['linkedin', 'facebook', 'instagram', 'blog', 'email', 'video'].forEach(p => {
            const checkbox = document.getElementById(`platform_${p}`);
            if (checkbox && checkbox.checked) platforms.push(p);
        });
        
        if (platforms.length === 0) {
            showToast('⚠️ Sélectionnez au moins une plateforme', 'error');
            return;
        }
        
        showToast(`🤖 Génération semaine 1 avec ${providerName} (${platforms.join(', ')})...`, 'info');
        
        // ÉTAPE 1 : Générer semaine 1 UNIQUEMENT (rapide, ~5-10s)
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-single-week',
                weekNumber: 1,
                startWeek,
                year,
                useOpenAI: useOpenAI,
                platforms: platforms
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
        generateRemainingWeeksBackground(startWeek, year, plan_global, useOpenAI, platforms);
        
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
async function generateRemainingWeeksBackground(startWeek, year, planGlobal, useOpenAI = false, platforms = []) {
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
                    useOpenAI: useOpenAI,
                    platforms: platforms
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
        <div style="margin-bottom: 20px; padding: 24px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 2px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 18px;">
                <h3 style="margin: 0; font-size: 1.4rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">🎯 Vision 3 mois</h3>
                <button onclick="improvePlan()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';">
                    <span>✨</span> Améliorer le plan
                </button>
            </div>
            <p style="margin: 0 0 20px 0; font-size: 1.05rem; line-height: 1.7; color: #475569;">${plan.plan_global.vision_3_mois || plan.plan_global.vision || 'Devenir référence gestion locative'}</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                <div style="padding: 18px; background: white; border-radius: 10px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: all 0.3s;" onmouseover="this.style.borderColor='#667eea'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.15)';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.04)';">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Leads Qualifiés</div>
                    <div style="font-size: 1.9rem; font-weight: bold; color: #1e293b;">${plan.plan_global.objectifs_finaux?.leads_qualifies || '250'}</div>
                </div>
                <div style="padding: 18px; background: white; border-radius: 10px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: all 0.3s;" onmouseover="this.style.borderColor='#667eea'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.15)';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.04)';">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Clients Signés</div>
                    <div style="font-size: 1.9rem; font-weight: bold; color: #1e293b;">${plan.plan_global.objectifs_finaux?.clients_signes || '35'}</div>
                </div>
                <div style="padding: 18px; background: white; border-radius: 10px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: all 0.3s;" onmouseover="this.style.borderColor='#667eea'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.15)';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.04)';">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">MRR Cible</div>
                    <div style="font-size: 1.9rem; font-weight: bold; color: #1e293b;">${plan.plan_global.objectifs_finaux?.mrr_cible || '1800€'}</div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; gap: 20px;">
            ${plan.semaines.map(s => `
                <div style="padding: 28px; background: white; border-radius: 12px; border-left: 5px solid ${s.numero === 1 ? '#10B981' : '#667eea'}; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 20px; transition: all 0.3s;" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'; this.style.transform='translateY(0)';">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                        <h4 style="margin: 0; font-size: 1.3rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">📅 Semaine ${s.numero}</h4>
                        <span style="background: linear-gradient(135deg, ${s.numero === 1 ? '#10B981' : '#667eea'} 0%, ${s.numero === 1 ? '#059669' : '#764ba2'} 100%); color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; box-shadow: 0 2px 6px ${s.numero === 1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(102, 126, 234, 0.3)'};">
                            ${s.numero === 1 ? 'ACTIVE' : 'PLANIFIÉE'}
                        </span>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding: 18px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 10px; border-left: 3px solid #10B981;">
                        <h5 style="margin: 0 0 12px 0; font-size: 1.1rem; color: #059669; font-weight: 600;">🎯 ${s.objectif_principal || s.objectif}</h5>
                        ${s.sous_objectifs ? `
                            <ul style="margin: 10px 0; padding-left: 20px; color: #475569;">
                                ${s.sous_objectifs.map(so => `<li style="margin: 6px 0; line-height: 1.5;">${so}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                    
                    <div style="margin-bottom: 18px;">
                        <strong style="display: block; margin-bottom: 10px; color: #1e293b; font-size: 0.95rem;">👥 Cibles:</strong>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${(s.cibles || []).map(c => `<span style="background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%); color: #5b21b6; padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; border: 1px solid #c4b5fd;">${c}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 18px;">
                        <strong style="display: block; margin-bottom: 10px; color: #1e293b; font-size: 0.95rem;">🔑 Thèmes clés:</strong>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${(s.themes || []).map(t => `<span style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46; padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; border: 1px solid #6ee7b7;">${t}</span>`).join('')}
                        </div>
                    </div>
                    
                    ${s.actions && s.actions.length > 0 ? `
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
                            <strong style="display: block; margin-bottom: 12px; font-size: 1.05rem; color: #1e293b;">📋 Actions (${s.actions.length})</strong>
                            <div style="display: grid; gap: 12px;">
                                ${s.actions.map((action, idx) => {
                                    // Couleurs par plateforme
                                    const platformColors = {
                                        'post_linkedin': '#0A66C2',
                                        'post_facebook': '#1877F2',
                                        'post_instagram': '#E4405F',
                                        'article_blog': '#059669',
                                        'email_marketing': '#F59E0B',
                                        'video_youtube_tiktok': '#FF0000'
                                    };
                                    const borderColor = platformColors[action.type] || '#667eea';
                                    
                                    return `
                                    <div style="padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 12px; border: 2px solid ${borderColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.3s;" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; this.style.transform='translateY(0)';">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                            <strong style="flex: 1; font-size: 1rem; color: #1e293b;">${idx + 1}. ${action.sujet || action.titre || 'Action'}</strong>
                                            <div style="display: flex; gap: 8px;">
                                                <span style="font-size: 0.75rem; background: ${borderColor}; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 500;">${action.type}</span>
                                                <button onclick="generateFullContent(${s.numero}, ${idx})" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(16, 185, 129, 0.3)';">✨ Générer</button>
                                                <button onclick="validateAndArchiveAction(${s.numero}, ${idx})" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)';">✅ Valider</button>
                                            </div>
                                        </div>
                                        ${action.timing ? `<div style="font-size: 0.85rem; margin-bottom: 8px; color: #64748b;">⏰ ${action.timing}</div>` : ''}
                                        ${action.contenu_complet ? `<div style="font-size: 0.9rem; margin-top: 10px; line-height: 1.6; max-height: 100px; overflow: hidden; color: #475569;">${action.contenu_complet.substring(0, 200)}${action.contenu_complet.length > 200 ? '...' : ''}</div>` : ''}
                                        ${action.kpi_attendu ? `<div style="font-size: 0.85rem; margin-top: 10px; padding: 8px 12px; background: #d1fae5; border-radius: 6px; color: #065f46; font-weight: 500; border: 1px solid #6ee7b7;">📊 ${action.kpi_attendu}</div>` : ''}
                                    </div>
                                `}).join('')}
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
// VALIDATION ET ARCHIVAGE AVEC MÉTRIQUES
// ================================================================

window.validateAndArchiveAction = async function(weekNum, actionIdx) {
    try {
        // 1. Charger la stratégie
        const { data: strategies, error } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('semaine', weekNum)
            .eq('annee', new Date().getFullYear())
            .in('statut', ['actif', 'planifié']);
        
        if (error || !strategies || strategies.length === 0) {
            throw new Error(`Semaine ${weekNum} non trouvée`);
        }
        
        const strategy = JSON.parse(strategies[0].strategie_complete);
        const action = strategy.actions[actionIdx];
        
        if (!action) {
            throw new Error('Action introuvable');
        }
        
        // 2. Modal moderne pour saisir les métriques
        const html = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.2s ease;" id="metricsModal">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 3px; max-width: 650px; width: 92%; max-height: 92vh; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: slideUp 0.3s ease;">
                    <div style="background: white; border-radius: 18px; padding: 0; max-height: calc(92vh - 6px); overflow-y: auto;">
                        <!-- Header avec gradient -->
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px 30px; color: white; border-radius: 18px 18px 0 0;">
                            <h2 style="margin: 0 0 8px 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 2rem;">🎯</span>
                                Valider & Archiver
                            </h2>
                            <p style="margin: 0; opacity: 0.95; font-size: 0.95rem;"><strong>${action.sujet || action.titre}</strong></p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <!-- Plateforme -->
                            <div style="margin-bottom: 22px;">
                                <label style="display: block; margin-bottom: 10px; color: #1e293b; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">📱 Plateforme</label>
                                <select id="platformPublished" style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; background: #f8fafc; transition: all 0.3s; cursor: pointer;" onfocus="this.style.borderColor='#667eea'; this.style.background='white';" onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';">
                                    <option value="linkedin">🔗 LinkedIn</option>
                                    <option value="facebook">👍 Facebook</option>
                                    <option value="instagram">📸 Instagram</option>
                                    <option value="blog">📝 Blog</option>
                                    <option value="email">✉️ Email</option>
                                    <option value="video">🎥 Vidéo (YouTube/TikTok)</option>
                                </select>
                            </div>
                            
                            <!-- Date -->
                            <div style="margin-bottom: 22px;">
                                <label style="display: block; margin-bottom: 10px; color: #1e293b; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">📅 Date de publication</label>
                                <input type="datetime-local" id="publishDate" style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; background: #f8fafc; transition: all 0.3s;" value="${new Date().toISOString().slice(0, 16)}" onfocus="this.style.borderColor='#667eea'; this.style.background='white';" onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';">
                            </div>
                            
                            <!-- URL -->
                            <div style="margin-bottom: 22px;">
                                <label style="display: block; margin-bottom: 10px; color: #1e293b; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">🔗 URL Publication <span style="color: #94a3b8; font-size: 0.75rem; text-transform: none;">(optionnel)</span></label>
                                <input type="url" id="publishUrl" placeholder="https://linkedin.com/posts/..." style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; background: #f8fafc; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'; this.style.background='white';" onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';">
                            </div>
                            
                            <!-- Métriques Grid -->
                            <div style="margin-bottom: 22px;">
                                <label style="display: block; margin-bottom: 12px; color: #1e293b; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">📊 Métriques de Performance</label>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                                    <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #3B82F6; font-weight: 600; font-size: 0.85rem;">👁️ Vues</label>
                                            <input type="number" id="metricVues" placeholder="150" style="width: 100%; padding: 10px; border: 1px solid #DBEAFE; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;" onfocus="this.style.borderColor='#3B82F6';" onblur="this.style.borderColor='#DBEAFE';">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #EF4444; font-weight: 600; font-size: 0.85rem;">❤️ Likes</label>
                                            <input type="number" id="metricLikes" placeholder="23" style="width: 100%; padding: 10px; border: 1px solid #FEE2E2; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;" onfocus="this.style.borderColor='#EF4444';" onblur="this.style.borderColor='#FEE2E2';">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #8B5CF6; font-weight: 600; font-size: 0.85rem;">💬 Commentaires</label>
                                            <input type="number" id="metricComments" placeholder="5" style="width: 100%; padding: 10px; border: 1px solid #EDE9FE; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;" onfocus="this.style.borderColor='#8B5CF6';" onblur="this.style.borderColor='#EDE9FE';">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #10B981; font-weight: 600; font-size: 0.85rem;">🔄 Partages</label>
                                            <input type="number" id="metricShares" placeholder="2" style="width: 100%; padding: 10px; border: 1px solid #D1FAE5; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;" onfocus="this.style.borderColor='#10B981';" onblur="this.style.borderColor='#D1FAE5';">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #F59E0B; font-weight: 600; font-size: 0.85rem;">🖱️ Clics</label>
                                            <input type="number" id="metricClicks" placeholder="12" style="width: 100%; padding: 10px; border: 1px solid #FEF3C7; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;" onfocus="this.style.borderColor='#F59E0B';" onblur="this.style.borderColor='#FEF3C7';">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #059669; font-weight: 600; font-size: 0.85rem;">🎯 LEADS</label>
                                            <input type="number" id="metricLeads" placeholder="3" style="width: 100%; padding: 10px; border: 1px solid #D1FAE5; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;" onfocus="this.style.borderColor='#059669';" onblur="this.style.borderColor='#D1FAE5';">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Notes -->
                            <div style="margin-bottom: 25px;">
                                <label style="display: block; margin-bottom: 10px; color: #1e293b; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">📝 Notes Performance</label>
                                <textarea id="performanceNotes" placeholder="Ce qui a bien fonctionné, insights, leçons apprises..." style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; background: #f8fafc; min-height: 100px; font-family: inherit; resize: vertical; transition: all 0.3s;" onfocus="this.style.borderColor='#667eea'; this.style.background='white';" onblur="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc';"></textarea>
                            </div>
                            
                            <!-- Boutons -->
                            <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 10px; border-top: 2px solid #f1f5f9;">
                                <button onclick="document.getElementById('metricsModal').remove()" style="padding: 14px 28px; border: 2px solid #e2e8f0; background: white; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; color: #64748b; transition: all 0.3s;" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1';" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0';">✖️ Annuler</button>
                                <button onclick="saveMetricsAndArchive(${weekNum}, ${actionIdx})" style="padding: 14px 28px; border: none; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(16, 185, 129, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.4)';">✅ Valider & Archiver</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

window.saveMetricsAndArchive = async function(weekNum, actionIdx) {
    try {
        // Récupérer les valeurs
        const platform = document.getElementById('platformPublished').value;
        const publishDate = document.getElementById('publishDate').value;
        const publishUrl = document.getElementById('publishUrl').value;
        const vues = parseInt(document.getElementById('metricVues').value) || 0;
        const likes = parseInt(document.getElementById('metricLikes').value) || 0;
        const comments = parseInt(document.getElementById('metricComments').value) || 0;
        const shares = parseInt(document.getElementById('metricShares').value) || 0;
        const clicks = parseInt(document.getElementById('metricClicks').value) || 0;
        const leads = parseInt(document.getElementById('metricLeads').value) || 0;
        const notes = document.getElementById('performanceNotes').value;
        
        // Calculer taux engagement
        const engagement = vues > 0 ? (((likes + comments + shares) / vues) * 100).toFixed(2) + '%' : '0%';
        
        // Charger la stratégie
        const { data: strategies } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('semaine', weekNum)
            .eq('annee', new Date().getFullYear())
            .in('statut', ['actif', 'planifié']);
        
        if (!strategies || strategies.length === 0) {
            throw new Error('Stratégie non trouvée');
        }
        
        const strategy = JSON.parse(strategies[0].strategie_complete);
        const action = strategy.actions[actionIdx];
        
        // Sauvegarder dans cm_ai_actions avec métriques
        const { error } = await window.supabaseClient
            .from('cm_ai_actions')
            .insert({
                strategy_id: strategies[0].id,
                type: action.type,
                titre: action.sujet || action.titre || 'Action',
                description: action.contenu_complet || action.description || '',
                priorite: action.priorite || 'moyenne',
                statut: 'terminé',
                date_publication: publishDate,
                plateforme_publie: platform,
                url_publication: publishUrl,
                metriques: {
                    vues,
                    likes,
                    commentaires: comments,
                    partages: shares,
                    clics: clicks,
                    leads,
                    taux_engagement: engagement
                },
                archive: true,
                notes_performance: notes,
                completed_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('❌ Erreur sauvegarde:', error);
            throw error;
        }
        
        // Fermer modal
        document.getElementById('metricsModal').remove();
        
        showToast(`✅ Action archivée ! ${leads > 0 ? leads + ' leads générés 🎯' : ''}`, 'success');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

// ================================================================
// CHARGER ACTIONS ARCHIVÉES
// ================================================================

window.loadArchivedActions = async function() {
    try {
        showToast('📚 Chargement archives...', 'info');
        
        const { data: actions, error } = await window.supabaseClient
            .from('cm_ai_actions')
            .select('*')
            .eq('archive', true)
            .order('date_publication', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('❌ Erreur chargement archives:', error);
            throw error;
        }
        
        if (!actions || actions.length === 0) {
            document.getElementById('archivedActions').innerHTML = `
                <p style="text-align: center; color: #666; padding: 20px;">
                    Aucune action archivée. Validez vos actions pour les archiver !
                </p>
            `;
            return;
        }
        
        // Trier par leads puis vues
        actions.sort((a, b) => {
            const leadsA = (a.metriques?.leads || 0);
            const leadsB = (b.metriques?.leads || 0);
            if (leadsA !== leadsB) return leadsB - leadsA;
            return (b.metriques?.vues || 0) - (a.metriques?.vues || 0);
        });
        
        const html = `
            <div style="display: grid; gap: 15px;">
                ${actions.map((action, idx) => {
                    const m = action.metriques || {};
                    const isPerfomer = idx < 3; // Top 3
                    
                    return `
                        <div style="padding: 20px; background: ${isPerfomer ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : '#F9FAFB'}; border-radius: 8px; border-left: 4px solid ${isPerfomer ? '#F59E0B' : '#10B981'};">
                            ${isPerfomer ? '<div style="display: inline-block; background: #F59E0B; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; margin-bottom: 10px;">🏆 TOP PERFORMER</div>' : ''}
                            
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                <div style="flex: 1;">
                                    <h3 style="margin: 0 0 8px 0; color: #111; font-size: 1.1rem;">${action.titre}</h3>
                                    <div style="display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.85rem; color: #666;">
                                        <span style="background: white; padding: 4px 10px; border-radius: 4px;">📱 ${action.plateforme_publie}</span>
                                        <span>📅 ${new Date(action.date_publication).toLocaleDateString('fr-FR')}</span>
                                        <span style="background: ${action.priorite === 'haute' ? '#FEE2E2' : action.priorite === 'moyenne' ? '#FEF3C7' : '#D1FAE5'}; padding: 4px 10px; border-radius: 4px;">${action.priorite}</span>
                                    </div>
                                </div>
                                ${action.url_publication ? `<a href="${action.url_publication}" target="_blank" style="color: #3B82F6; text-decoration: none; padding: 8px 15px; background: white; border-radius: 6px; font-size: 0.85rem;">🔗 Voir</a>` : ''}
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 15px 0;">
                                ${m.vues ? `<div style="background: white; padding: 12px; border-radius: 6px; text-align: center;"><div style="font-size: 1.3rem; font-weight: bold; color: #3B82F6;">${m.vues.toLocaleString()}</div><div style="font-size: 0.75rem; color: #666;">👁️ Vues</div></div>` : ''}
                                ${m.likes ? `<div style="background: white; padding: 12px; border-radius: 6px; text-align: center;"><div style="font-size: 1.3rem; font-weight: bold; color: #EF4444;">${m.likes}</div><div style="font-size: 0.75rem; color: #666;">❤️ Likes</div></div>` : ''}
                                ${m.commentaires ? `<div style="background: white; padding: 12px; border-radius: 6px; text-align: center;"><div style="font-size: 1.3rem; font-weight: bold; color: #8B5CF6;">${m.commentaires}</div><div style="font-size: 0.75rem; color: #666;">💬 Comments</div></div>` : ''}
                                ${m.partages ? `<div style="background: white; padding: 12px; border-radius: 6px; text-align: center;"><div style="font-size: 1.3rem; font-weight: bold; color: #10B981;">${m.partages}</div><div style="font-size: 0.75rem; color: #666;">🔄 Partages</div></div>` : ''}
                                ${m.clics ? `<div style="background: white; padding: 12px; border-radius: 6px; text-align: center;"><div style="font-size: 1.3rem; font-weight: bold; color: #F59E0B;">${m.clics}</div><div style="font-size: 0.75rem; color: #666;">🖱️ Clics</div></div>` : ''}
                                ${m.leads ? `<div style="background: white; padding: 12px; border-radius: 6px; text-align: center;"><div style="font-size: 1.3rem; font-weight: bold; color: #059669;">${m.leads}</div><div style="font-size: 0.75rem; color: #666;">🎯 LEADS</div></div>` : ''}
                                ${m.taux_engagement ? `<div style="background: white; padding: 12px; border-radius: 6px; text-align: center;"><div style="font-size: 1.3rem; font-weight: bold; color: #6366F1;">${m.taux_engagement}</div><div style="font-size: 0.75rem; color: #666;">📈 Engagement</div></div>` : ''}
                            </div>
                            
                            ${action.notes_performance ? `
                                <div style="background: white; padding: 12px; border-radius: 6px; margin-top: 12px;">
                                    <strong style="display: block; margin-bottom: 6px; font-size: 0.85rem; color: #666;">📝 Notes:</strong>
                                    <div style="font-size: 0.9rem; color: #333; line-height: 1.5;">${action.notes_performance}</div>
                                </div>
                            ` : ''}
                            
                            <div style="margin-top: 15px; display: flex; gap: 10px;">
                                <button onclick="reuseAction('${action.id}')" style="padding: 8px 15px; background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">♻️ Réutiliser</button>
                                <button onclick="duplicateAction('${action.id}')" style="padding: 8px 15px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">📋 Dupliquer</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        document.getElementById('archivedActions').innerHTML = html;
        showToast(`✅ ${actions.length} actions chargées`, 'success');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

window.reuseAction = async function(actionId) {
    try {
        const { data: action, error } = await window.supabaseClient
            .from('cm_ai_actions')
            .select('*')
            .eq('id', actionId)
            .single();
        
        if (error) throw error;
        
        alert(`♻️ RÉUTILISER:\n\n${action.titre}\n\nPlateforme: ${action.plateforme_publie}\n\n${action.description.substring(0, 300)}...`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

window.duplicateAction = async function(actionId) {
    try {
        const { data: action, error } = await window.supabaseClient
            .from('cm_ai_actions')
            .select('*')
            .eq('id', actionId)
            .single();
        
        if (error) throw error;
        
        const { error: insertError } = await window.supabaseClient
            .from('cm_ai_actions')
            .insert({
                ...action,
                id: undefined,
                titre: action.titre + ' (Copie)',
                statut: 'proposé',
                archive: false,
                date_publication: null,
                metriques: {},
                notes_performance: null,
                created_at: new Date().toISOString()
            });
        
        if (insertError) throw insertError;
        
        showToast('✅ Action dupliquée !', 'success');
        
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
