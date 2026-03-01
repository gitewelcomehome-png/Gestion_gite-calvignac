// ================================================================
// 🎯 STRATÉGIE IA AUTONOME - OPTIMISÉ SANS TIMEOUT
// ================================================================
// Génération semaine par semaine pour contourner limite Vercel 60s
// ================================================================

// console.log('🤖 Module Stratégie IA chargé');

const ADMIN_FALLBACK_EMAILS = ['stephanecalvignac@hotmail.fr'];

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

async function isCurrentUserAdmin(user) {
    const configuredAdminEmails = Array.isArray(window.APP_CONFIG?.ADMIN_EMAILS)
        ? window.APP_CONFIG.ADMIN_EMAILS
        : [];
    const adminEmails = new Set(
        [...ADMIN_FALLBACK_EMAILS, ...configuredAdminEmails]
            .map(normalizeEmail)
            .filter(Boolean)
    );

    if (adminEmails.has(normalizeEmail(user?.email))) {
        return true;
    }

    try {
        const { data: rolesData, error: rolesError } = await window.supabaseClient
            .from('user_roles')
            .select('role, is_active')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .in('role', ['admin', 'super_admin'])
            .limit(1);

        return !rolesError && Array.isArray(rolesData) && rolesData.length > 0;
    } catch (rolesCheckError) {
        console.warn('⚠️ Vérification rôle admin indisponible:', rolesCheckError?.message || rolesCheckError);
        return false;
    }
}

async function checkAuth() {
    try {
        if (!window.supabaseClient) {
            window.location.href = '../index.html';
            return false;
        }

        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error || !session?.user) {
            window.location.href = '../index.html';
            return false;
        }

        const isAdmin = await isCurrentUserAdmin(session.user);
        if (!isAdmin) {
            alert('Accès refusé : Réservé aux administrateurs');
            window.location.href = '../index.html';
            return false;
        }

        return true;
    } catch (authError) {
        console.error('Erreur authentification stratégie IA:', authError);
        window.location.href = '../index.html';
        return false;
    }
}

// ================================================================
// ARCHIVAGE AUTOMATIQUE DES SEMAINES PASSÉES
// ================================================================
// NOTE: Ne pas utiliser pour l'instant - nécessite une date de fin explicite
// plutôt qu'un numéro de semaine ISO
/*
async function archiveOldWeeks() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    
    try {
        const { error } = await window.supabaseClient
            .from('cm_ai_strategies')
            .update({ statut: 'termine' })
            .eq('statut', 'actif')
            .or(`annee.lt.${currentYear},and(annee.eq.${currentYear},semaine.lt.${currentWeek})`);
        
        if (error) throw error;
        
        // console.log('✅ Semaines passées archivées automatiquement');
    } catch (error) {
        console.error('❌ Erreur archivage auto:', error);
    }
}
*/

// Obtenir le numéro de semaine (1-52)
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}


// ================================================================
// VALIDATION SEMAINE EN COURS → PASSAGE À LA SUIVANTE
// ================================================================
window.validateCurrentWeek = async function() {
    try {
        const year = new Date().getFullYear();
        
        // Trouver la semaine active
        const { data: activeWeek, error: findError } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('statut', 'actif')
            .eq('annee', year)
            .single();

        if (findError || !activeWeek) {
            showToast('❌ Aucune semaine active à valider', 'error');
            return;
        }

        const currentNum = activeWeek.semaine;
        
        // Passer la semaine actuelle en 'terminé'
        const { error: updateError } = await window.supabaseClient
            .from('cm_ai_strategies')
            .update({ statut: 'termine' })
            .eq('id', activeWeek.id);

        if (updateError) throw updateError;

        // Activer la semaine suivante
        const { error: nextError } = await window.supabaseClient
            .from('cm_ai_strategies')
            .update({ statut: 'actif' })
            .eq('semaine', currentNum + 1)
            .eq('annee', year)
            .eq('statut', 'planifié');

        if (nextError) {
            console.warn('⚠️ Pas de semaine suivante à activer');
        }

        showToast(`✅ Semaine validée ! Passage à la semaine +${currentNum}`, 'success');
        
        // Recharger l'affichage
        await loadLongtermPlanFromDB();
        if (window.refreshAIPropositions) {
            window.refreshAIPropositions();
        }
        
    } catch (error) {
        console.error('❌ Erreur validation:', error);
        showToast('❌ ' + error.message, 'error');
    }
};

// ================================================================
// NAVIGATION ONGLETS
// ================================================================

window.switchTab = function(tabName) {
    document.querySelectorAll('.content-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.content-tab-content').forEach(content => content.style.display = 'none');
    
    document.querySelector(`.content-tab-btn[data-tab="${tabName}"]`).classList.add('active');
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
        
        // ⚠️ VÉRIFIER SI LA SEMAINE ACTIVE EST VALIDÉE
        const { data: activeWeek, error: checkError } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('statut', 'actif')
            .eq('annee', year)
            .single();

        if (!checkError && activeWeek) {
            showToast('⚠️ Validez la semaine ' + activeWeek.semaine + ' avant de générer la suivante', 'error');
            return;
        }
        
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
        // FORCER semaine 1 en 'actif', les autres en 'planifié'
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
        } else if (semaine.numero === 1) {
            // console.log('✅ Semaine 1 ACTIVÉE automatiquement');
        }
    } catch (err) {
        console.error('❌ Erreur saveSingleWeek:', err);
    }
}

// Sauvegarder les actions proposées d'une semaine
async function saveActionsFromWeek(week) {
    if (!week.actions || week.actions.length === 0) return;
    
    const actions = week.actions.map(action => ({
        type: action.type || 'article',
        titre: action.sujet || action.titre || 'Action semaine ' + week.numero,
        description: action.contenu_complet || action.description || 'Contenu à définir',
        statut: 'propose',
        priorite: action.priorite || 'moyenne'
    }));
    
    const { error } = await window.supabaseClient
        .from('cm_ai_actions')
        .insert(actions);
    
    if (error) {
        console.error('❌ Erreur insertion actions:', error);
    }
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
                // console.log(`✅ Semaine ${weekNum}/12 générée`);
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
            // console.log('ℹ️ Aucun plan sauvegardé en DB');
            return;
        }
        
        // console.log(`✅ ${data.length} semaines trouvées en DB`);
        
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
            // console.log('⚠️ Aucune semaine valide après parsing');
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
        // console.log(`✅ Plan 12 semaines rechargé : ${semaines.length} semaines affichées`);
        
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
                <button data-action="improve-plan" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transition: all 0.3s;">
                    <span>✨</span> Améliorer le plan
                </button>
            </div>
            <p style="margin: 0 0 20px 0; font-size: 1.05rem; line-height: 1.7; color: #475569;">${plan.plan_global.vision_3_mois || plan.plan_global.vision || 'Devenir référence gestion locative'}</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                <div style="padding: 18px; background: white; border-radius: 10px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: all 0.3s;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Leads Qualifiés</div>
                    <div style="font-size: 1.9rem; font-weight: bold; color: #1e293b;">${plan.plan_global.objectifs_finaux?.leads_qualifies || '250'}</div>
                </div>
                <div style="padding: 18px; background: white; border-radius: 10px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: all 0.3s;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Clients Signés</div>
                    <div style="font-size: 1.9rem; font-weight: bold; color: #1e293b;">${plan.plan_global.objectifs_finaux?.clients_signes || '35'}</div>
                </div>
                <div style="padding: 18px; background: white; border-radius: 10px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: all 0.3s;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">MRR Cible</div>
                    <div style="font-size: 1.9rem; font-weight: bold; color: #1e293b;">${plan.plan_global.objectifs_finaux?.mrr_cible || '1800€'}</div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; gap: 20px;">
            ${plan.semaines.map(s => `
                <div style="padding: 28px; background: white; border-radius: 12px; border-left: 5px solid ${s.numero === 1 ? '#10B981' : '#667eea'}; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 20px; transition: all 0.3s;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                        <h4 style="margin: 0; font-size: 1.3rem; color: #1e293b; display: flex; align-items: center; gap: 8px;">📅 ${s.numero === 1 ? 'Semaine en cours' : 'Semaine +' + (s.numero - 1)}</h4>
                        ${s.numero === 1 ? `
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);">
                                EN COURS
                            </span>
                            <button data-action="validate-current-week" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); transition: all 0.3s;">✓ Valider & Passer à la suivante</button>
                        </div>
                        ` : `<span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);">PLANIFIÉE</span>`}
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
                                    <div style="padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 12px; border: 2px solid ${borderColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.3s;">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                            <strong style="flex: 1; font-size: 1rem; color: #1e293b;">${idx + 1}. ${action.sujet || action.titre || 'Action'}</strong>
                                            <div style="display: flex; gap: 8px;">
                                                <span style="font-size: 0.75rem; background: ${borderColor}; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 500;">${action.type}</span>
                                                <button data-action="generate-full-content" data-week-num="${s.numero}" data-action-idx="${idx}" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); transition: all 0.3s;">✨ Générer</button>
                                                <button data-action="validate-and-archive-action" data-week-num="${s.numero}" data-action-idx="${idx}" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); transition: all 0.3s;">✅ Valider</button>
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
            
            // console.log(`✅ Semaine ${strategy.numero} enrichie`);
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
        // console.log('🔍 Recherche semaine:', weekNum, 'année:', new Date().getFullYear());
        
        const { data, error } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('semaine', weekNum)
            .eq('annee', new Date().getFullYear())
            .in('statut', ['actif', 'planifié']); // IMPORTANT: filtrer sur statuts
        
        // console.log('📊 Résultat query:', data, 'erreur:', error);
        
        if (error) {
            console.error('❌ Erreur DB:', error);
            throw error;
        }
        
        if (!data || data.length === 0) {
            throw new Error(`Semaine ${weekNum} non trouvée en DB`);
        }
        
        const strategy = JSON.parse(data[0].strategie_complete);
        // console.log('📋 Stratégie chargée:', strategy);
        
        if (!strategy.actions || !strategy.actions[actionIdx]) {
            throw new Error(`Action ${actionIdx} non trouvée (total: ${strategy.actions?.length || 0})`);
        }
        
        const action = strategy.actions[actionIdx];
        // console.log('🎯 Action:', action);
        
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
                                <select id="platformPublished" style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; background: #f8fafc; transition: all 0.3s; cursor: pointer;">
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
                                <input type="datetime-local" id="publishDate" style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; background: #f8fafc; transition: all 0.3s;" value="${new Date().toISOString().slice(0, 16)}">
                            </div>
                            
                            <!-- URL -->
                            <div style="margin-bottom: 22px;">
                                <label style="display: block; margin-bottom: 10px; color: #1e293b; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">🔗 URL Publication <span style="color: #94a3b8; font-size: 0.75rem; text-transform: none;">(optionnel)</span></label>
                                <input type="url" id="publishUrl" placeholder="https://linkedin.com/posts/..." style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; background: #f8fafc; transition: all 0.3s;">
                            </div>
                            
                            <!-- Métriques Grid -->
                            <div style="margin-bottom: 22px;">
                                <label style="display: block; margin-bottom: 12px; color: #1e293b; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">📊 Métriques de Performance</label>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                                    <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #3B82F6; font-weight: 600; font-size: 0.85rem;">👁️ Vues</label>
                                            <input type="number" id="metricVues" placeholder="150" style="width: 100%; padding: 10px; border: 1px solid #DBEAFE; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #EF4444; font-weight: 600; font-size: 0.85rem;">❤️ Likes</label>
                                            <input type="number" id="metricLikes" placeholder="23" style="width: 100%; padding: 10px; border: 1px solid #FEE2E2; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #8B5CF6; font-weight: 600; font-size: 0.85rem;">💬 Commentaires</label>
                                            <input type="number" id="metricComments" placeholder="5" style="width: 100%; padding: 10px; border: 1px solid #EDE9FE; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #10B981; font-weight: 600; font-size: 0.85rem;">🔄 Partages</label>
                                            <input type="number" id="metricShares" placeholder="2" style="width: 100%; padding: 10px; border: 1px solid #D1FAE5; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #F59E0B; font-weight: 600; font-size: 0.85rem;">🖱️ Clics</label>
                                            <input type="number" id="metricClicks" placeholder="12" style="width: 100%; padding: 10px; border: 1px solid #FEF3C7; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;">
                                        </div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 2px; border-radius: 12px;">
                                        <div style="background: white; border-radius: 11px; padding: 12px;">
                                            <label style="display: block; margin-bottom: 6px; color: #059669; font-weight: 600; font-size: 0.85rem;">🎯 LEADS</label>
                                            <input type="number" id="metricLeads" placeholder="3" style="width: 100%; padding: 10px; border: 1px solid #D1FAE5; border-radius: 8px; font-size: 1.1rem; font-weight: 600; color: #1e293b;">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Notes -->
                            <div style="margin-bottom: 25px;">
                                <label style="display: block; margin-bottom: 10px; color: #1e293b; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">📝 Notes Performance</label>
                                <textarea id="performanceNotes" placeholder="Ce qui a bien fonctionné, insights, leçons apprises..." style="width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; background: #f8fafc; min-height: 100px; font-family: inherit; resize: vertical; transition: all 0.3s;"></textarea>
                            </div>
                            
                            <!-- Boutons -->
                            <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 10px; border-top: 2px solid #f1f5f9;">
                                <button data-action="close-metrics-modal" style="padding: 14px 28px; border: 2px solid #e2e8f0; background: white; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; color: #64748b; transition: all 0.3s;">✖️ Annuler</button>
                                <button data-action="save-metrics-and-archive" data-week-num="${weekNum}" data-action-idx="${actionIdx}" style="padding: 14px 28px; border: none; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); transition: all 0.3s;">✅ Valider & Archiver</button>
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
                                <button data-action="reuse-action" data-action-id="${action.id}" style="padding: 8px 15px; background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">♻️ Réutiliser</button>
                                <button data-action="duplicate-action" data-action-id="${action.id}" style="padding: 8px 15px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">📋 Dupliquer</button>
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
                    <button data-action="generate-weekly-strategy" class="btn-primary" style="background: #667eea;">
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
            document.getElementById('contentQueue').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #9CA3AF;">
                    <p>📅 Aucune publication programmée</p>
                </div>
            `;
            return;
        }
        
        // console.log('✅ Publications programmées trouvées:', data.length);
        
        const html = data.map(item => `
            <div data-action="open-action-details" data-item-id="${item.id}" style="padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong style="color: #1e293b;">${item.type} - ${item.plateforme || 'N/A'}</strong>
                    <span style="font-size: 0.85rem; color: #64748b;">📅 ${new Date(item.scheduled_date).toLocaleDateString('fr-FR')}</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; color: #475569;">${item.sujet}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span style="display: inline-block; padding: 4px 8px; background: #f1f5f9; border-radius: 4px; font-size: 0.75rem; color: #64748b;">
                        ${item.statut}
                    </span>
                    <span style="color: #667eea; font-size: 0.875rem; font-weight: 500;">
                        Générer plan détaillé →
                    </span>
                </div>
            </div>
        `).join('');
        
        document.getElementById('contentQueue').innerHTML = html;
        
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
            document.getElementById('aiActions').innerHTML = `
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
                    <button data-action="approve-action" data-action-id="${action.id}" class="btn-success" style="background: #10B981; padding: 5px 12px; border-radius: 4px; border: none; color: white; cursor: pointer;">
                        ✅ Approuver
                    </button>
                    <button data-action="reject-action" data-action-id="${action.id}" class="btn-danger" style="background: #EF4444; padding: 5px 12px; border-radius: 4px; border: none; color: white; cursor: pointer;">
                        ❌ Rejeter
                    </button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('aiActions').innerHTML = html;
        
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
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 3); // Programmer dans 3 jours
        
        const { error: insertError } = await window.supabaseClient
            .from('cm_ai_content_queue')
            .insert({
                type: action.type || 'post',
                plateforme: action.plateforme_publie || 'linkedin',
                sujet: action.titre,
                contenu: action.description,
                scheduled_date: scheduledDate.toISOString(),
                statut: 'en_attente'
            });
        
        if (insertError) throw insertError;
        
        // 3. Mettre à jour le statut de l'action
        const { error: updateError } = await window.supabaseClient
            .from('cm_ai_actions')
            .update({ statut: 'accepte' })
            .eq('id', actionId);
        
        if (updateError) throw updateError;
        
        showToast('✅ Action approuvée et programmée dans 3 jours', 'success');
        
        // Recharger UNIQUEMENT la liste des actions (pas de navigation)
        await loadAIActions();
        await loadContentQueue();
        
    } catch (error) {
        console.error('❌ Erreur approbation:', error);
        showToast('❌ Erreur: ' + error.message, 'error');
    }
};

window.rejectAction = async function(actionId) {
    try {
        const { error } = await window.supabaseClient
            .from('cm_ai_actions')
            .update({ statut: 'rejete' })
            .eq('id', actionId);
        
        if (error) throw error;
        
        showToast('❌ Action rejetée', 'info');
        
        // Recharger UNIQUEMENT la liste des actions (pas de navigation)
        await loadAIActions();
    } catch (error) {
        console.error('❌ Erreur rejet:', error);
        showToast('❌ Erreur: ' + error.message, 'error');
    }
}

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
    // console.log(`[${type}] ${message}`);
}

function decodeHtmlEntities(value) {
    return String(value || '').replace(/&quot;/g, '"');
}

function setupContentAIStrategyDelegation() {
    document.addEventListener('click', async (event) => {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) {
            return;
        }

        const action = actionEl.dataset.action;
        const actionId = actionEl.dataset.actionId;

        switch (action) {
            case 'improve-plan':
                await window.improvePlan?.();
                break;
            case 'validate-current-week':
                await window.validateCurrentWeek?.();
                break;
            case 'generate-full-content':
                await window.generateFullContent?.(
                    Number(actionEl.dataset.weekNum),
                    Number(actionEl.dataset.actionIdx)
                );
                break;
            case 'validate-and-archive-action':
                await window.validateAndArchiveAction?.(
                    Number(actionEl.dataset.weekNum),
                    Number(actionEl.dataset.actionIdx)
                );
                break;
            case 'close-metrics-modal': {
                const metricsModal = document.getElementById('metricsModal');
                if (metricsModal) {
                    metricsModal.remove();
                }
                break;
            }
            case 'save-metrics-and-archive':
                await window.saveMetricsAndArchive?.(
                    Number(actionEl.dataset.weekNum),
                    Number(actionEl.dataset.actionIdx)
                );
                break;
            case 'reuse-action':
                if (actionId) {
                    await window.reuseAction?.(actionId);
                }
                break;
            case 'duplicate-action':
                if (actionId) {
                    await window.duplicateAction?.(actionId);
                }
                break;
            case 'generate-weekly-strategy':
                await window.generateWeeklyStrategy?.();
                break;
            case 'open-action-details':
                if (actionEl.dataset.itemId) {
                    await window.openActionDetails?.(actionEl.dataset.itemId);
                }
                break;
            case 'approve-action':
                if (actionId) {
                    await window.approveAction?.(actionId);
                }
                break;
            case 'reject-action':
                if (actionId) {
                    await window.rejectAction?.(actionId);
                }
                break;
            case 'close-action-modal':
                window.closeActionModal?.();
                break;
            case 'generate-action-plan': {
                const title = decodeHtmlEntities(actionEl.dataset.actionTitle);
                const content = decodeHtmlEntities(actionEl.dataset.actionContent);
                const type = actionEl.dataset.actionType;
                if (actionId && type) {
                    await window.generateActionPlan?.(actionId, title, content, type);
                }
                break;
            }
            case 'save-plan':
                await window.savePlan?.(window.currentActionId);
                break;
            default:
                break;
        }
    });
}

// Init au chargement
document.addEventListener('DOMContentLoaded', async () => {
    const isAllowed = await checkAuth();
    if (!isAllowed) {
        return;
    }

    // Note: archiveOldWeeks() désactivé - utilise semaine ISO au lieu de 1-12
    // await archiveOldWeeks();
    
    loadCurrentStrategy();
    loadLongtermPlanFromDB(); // Recharger le plan 12 semaines
    
    // Charger actions uniquement si l'élément existe
    if (document.getElementById('aiActions')) {
        loadAIActions();
    }

    setupContentAIStrategyDelegation();
});

// ================================================================
// GÉNÉRATION D'ACTIONS BUSINESS STRATÉGIQUES
// ================================================================

window.generateBusinessActions = async function() {
    try {
        showToast('🤖 Génération d\'actions business en cours...', 'info');
        
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-business-actions'
            })
        });
        
        if (!response.ok) throw new Error('Erreur API');
        
        const { actions } = await response.json();
        
        // Sauvegarder dans cm_ai_actions
        const { error } = await window.supabaseClient
            .from('cm_ai_actions')
            .insert(actions.map(a => ({
                type: a.type,
                titre: a.titre,
                description: a.description,
                justification: a.justification,
                priorite: a.priorite || 'moyenne',
                statut: 'propose'
            })));
        
        if (error) throw error;
        
        showToast('✅ Actions business générées !', 'success');
        await loadAIActions();
        
    } catch (error) {
        console.error('❌ Erreur génération actions:', error);
        showToast('❌ Erreur lors de la génération', 'error');
    }
}

// ================================================================
// MODALE PLAN D'ACTION DÉTAILLÉ
// ================================================================

window.openActionDetails = async function(actionId) {
    try {
        // Récupérer les détails depuis cm_ai_content_queue
        const { data: action, error } = await window.supabaseClient
            .from('cm_ai_content_queue')
            .select('*')
            .eq('id', actionId)
            .single();
        
        if (error) throw error;
        
        // Créer la modale
        const modal = document.createElement('div');
        modal.id = 'actionDetailsModal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 16px 16px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${action.sujet}</h2>
                            <p style="margin: 0; opacity: 0.9;">${action.type} - ${action.plateforme || 'N/A'}</p>
                        </div>
                        <button data-action="close-action-modal" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 1.2rem;">✕</button>
                    </div>
                </div>
                
                <div style="padding: 2rem;">
                    <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 1rem 0; color: #1e293b;">📋 Description</h3>
                        <p style="margin: 0; color: #475569; line-height: 1.6;">${action.contenu}</p>
                    </div>
                    
                    <div style="background: #eff6ff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0; color: #1e293b;">🎯 Plan d'Action Détaillé</h3>
                            <span id="planStatus" style="font-size: 0.875rem; color: #64748b;">Non généré</span>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 500; font-size: 0.9rem;">
                                💬 Consignes personnalisées (optionnel)
                            </label>
                            <textarea id="customInstructions" placeholder="Ex: Focus sur le budget limité, priorité aux canaux gratuits, durée max 2 semaines..." style="width: 100%; min-height: 80px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 0.9rem; resize: vertical;"></textarea>
                        </div>
                        
                        <div id="planContent" style="color: #475569; line-height: 1.6;">
                            <p style="text-align: center; padding: 2rem; color: #94a3b8;">
                                Cliquez sur "Générer Plan d'Action" pour obtenir un plan étape par étape détaillé
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button data-action="generate-action-plan" data-action-id="${action.id}" data-action-title="${action.sujet.replace(/"/g, '&quot;')}" data-action-content="${action.contenu.replace(/"/g, '&quot;')}" data-action-type="${action.type}" style="flex: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(102,126,234,0.3); transition: all 0.3s;">
                            🤖 Générer Plan d'Action Détaillé
                        </button>
                        <button data-action="close-action-modal" style="background: #e2e8f0; color: #475569; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('❌ Erreur ouverture action:', error);
        showToast('❌ Erreur: ' + error.message, 'error');
    }
}

window.closeActionModal = function() {
    const modal = document.getElementById('actionDetailsModal');
    if (modal) modal.remove();
}

window.generateActionPlan = async function(actionId, titre, description, type) {
    try {
        const customInstructions = document.getElementById('customInstructions')?.value || '';
        
        document.getElementById('planStatus').textContent = '⏳ Génération en cours...';
        document.getElementById('planContent').innerHTML = '<p style="text-align: center; padding: 2rem; color: #94a3b8;">⏳ L\'IA génère votre plan d\'action détaillé...</p>';
        
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-action-plan',
                titre: titre,
                description: description,
                type: type,
                customInstructions: customInstructions,
                useOpenAI: true
            })
        });
        
        if (!response.ok) {
            let errorMsg = 'Erreur API';
            try {
                // Lire le texte brut d'abord
                const responseText = await response.text();
                // Essayer de parser en JSON
                try {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.error || errorMsg;
                } catch {
                    // Si pas JSON, utiliser le texte brut
                    errorMsg = responseText || `Erreur ${response.status}`;
                }
                console.error('❌ Erreur serveur:', errorMsg);
            } catch (e) {
                errorMsg = `Erreur ${response.status}`;
                console.error('❌ Impossible de lire la réponse:', e);
            }
            throw new Error(errorMsg);
        }
        
        const { plan } = await response.json();
        
        // Afficher le plan
        document.getElementById('planStatus').innerHTML = '<span style="color: #10b981;">✅ Plan généré</span>';
        document.getElementById('planContent').innerHTML = `
            <div style="background: white; border-radius: 8px; padding: 1.5rem;">
                ${plan.etapes.map((etape, idx) => `
                    <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: start; gap: 1rem;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">
                                ${idx + 1}
                            </div>
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 0.5rem 0; color: #1e293b; font-size: 1rem;">${etape.titre}</h4>
                                <p style="margin: 0 0 0.75rem 0; color: #64748b; font-size: 0.9rem;">${etape.description}</p>
                                ${etape.ressources ? `
                                    <div style="background: #f8fafc; border-radius: 6px; padding: 0.75rem; font-size: 0.875rem;">
                                        <strong style="color: #475569;">📦 Ressources nécessaires:</strong><br>
                                        <span style="color: #64748b;">${etape.ressources}</span>
                                    </div>
                                ` : ''}
                                ${etape.duree ? `
                                    <div style="margin-top: 0.5rem; color: #64748b; font-size: 0.875rem;">
                                        ⏱️ Durée estimée: <strong>${etape.duree}</strong>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                ${plan.metriques_succes ? `
                    <div style="background: #f0fdf4; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #166534;">📊 Métriques de succès</h4>
                        <p style="margin: 0; color: #15803d; font-size: 0.9rem;">${plan.metriques_succes}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        showToast('✅ Plan d\'action généré !', 'success');
        
        // Afficher bouton sauvegarder
        window.currentPlan = plan;
        const saveBtnHtml = `<button id="savePlanBtn" data-action="save-plan" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; margin-top: 1rem;">💾 Sauvegarder ce Plan</button>`;
        document.getElementById('planContent').insertAdjacentHTML('afterend', saveBtnHtml);
        
    } catch (error) {
        console.error('❌ Erreur génération plan:', error);
        document.getElementById('planStatus').innerHTML = '<span style="color: #ef4444;">❌ Erreur</span>';
        document.getElementById('planContent').innerHTML = '<p style="text-align: center; padding: 2rem; color: #ef4444;">❌ Erreur lors de la génération</p>';
        showToast('❌ Erreur: ' + error.message, 'error');
    }
}


// SAUVEG PLAN + VALIDATION + SUPPRESSION
window.savePlan = async function(actionId) {
    const { error } = await window.supabaseClient.from('cm_ai_content_queue').update({ plan_detaille: window.currentPlan }).eq('id', actionId);
    if (error) { alert('❌ Erreur'); return; }
    alert('✅ Plan sauvegardé!'); document.getElementById('savePlanBtn').textContent = '✓ Sauvegardé'; document.getElementById('savePlanBtn').disabled = true; loadContentQueue();
};
window.validateAction = async function(actionId) {
    const { error } = await window.supabaseClient.from('cm_ai_content_queue').update({ statut: 'publié' }).eq('id', actionId);
    if (error) { alert('❌ Erreur'); return; }
    alert('✅ Validé!'); loadContentQueue();
};
window.deleteAction = async function(actionId) {
    const { error } = await window.supabaseClient.from('cm_ai_content_queue').delete().eq('id', actionId);
    if (error) { alert('❌ Erreur'); return; }
    alert('✅ Supprimé'); loadContentQueue();
};
function formatPlanDisplay(plan) {
    return plan.etapes.map((e, i) => `<div style="background: white; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid #667eea;"><div style="display: flex; gap: 0.75rem; margin-bottom: 0.5rem;"><span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">${i + 1}</span><h4 style="margin: 0; color: #1e293b;">${e.titre}</h4></div><p style="margin: 0.5rem 0 0.5rem 2.5rem; color: #475569;">${e.description}</p><div style="margin-left: 2.5rem; margin-top: 0.75rem; display: flex; gap: 1rem;"><span style="color: #64748b; font-size: 0.875rem;">📦 ${e.ressources}</span><span style="color: #64748b; font-size: 0.875rem;">⏱️ ${e.duree}</span></div></div>`).join('') + `<div style="background: #d1fae5; border-radius: 8px; padding: 1rem;"><div style="font-weight: 600; color: #065f46;">📊 Métriques</div><p style="margin: 0; color: #047857;">${plan.metriques_succes}</p></div>`;
}

