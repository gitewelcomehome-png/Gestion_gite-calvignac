/**
 * 🎯 MODULE GESTION DES RÈGLES DE MÉNAGE
 * Gestion des règles configurables pour la planification des ménages
 */

// Fonction pour obtenir le client Supabase
function getSupabaseClient() {
    return window.supabaseClient || window.supabase;
}

// ==========================================
// 📋 CHARGEMENT ET AFFICHAGE DES RÈGLES
// ==========================================

/**
 * Charge et affiche les règles de ménage
 */
async function loadCleaningRules() {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client non disponible');
        }

        const { data: rules, error } = await client
            .from('cleaning_rules')
            .select('*')
            .order('priority', { ascending: true });

        if (error) throw error;

        displayCleaningRules(rules || []);
    } catch (error) {
        console.error('❌ Erreur chargement règles:', error);
        showToast('Erreur lors du chargement des règles', 'error');
    }
}

/**
 * Affiche les règles dans l'interface
 */
function displayCleaningRules(rules) {
    const container = document.getElementById('cleaning-rules-list');
    if (!container) return;

    if (rules.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Aucune règle configurée</p>';
        return;
    }

    let html = '';
    rules.forEach(rule => {
        const statusBadge = rule.is_enabled 
            ? '<span style="background: #55efc4; color: #2D3436; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; border: 2px solid #2D3436;">✓ Activée</span>'
            : '<span style="background: #dfe6e9; color: #636e72; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; border: 2px solid #636e72;">○ Désactivée</span>';

        html += `
            <div style="background: white; border: 2px solid #2D3436; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 4px 4px 0 #2D3436;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span style="background: #ffeaa7; color: #2D3436; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: 1px solid #2D3436;">Priorité ${rule.priority}</span>
                            ${statusBadge}
                        </div>
                        <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; color: #2D3436; font-weight: 700;">${rule.rule_name}</h3>
                        <p style="margin: 0; font-size: 0.9rem; color: #636e72; line-height: 1.5;">${rule.description}</p>
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 15px;">
                        <button class="toggle-rule-btn" data-rule-id="${rule.id}" data-enabled="${rule.is_enabled}"
                                style="background: ${rule.is_enabled ? '#fab1a0' : '#55efc4'}; color: #2D3436; border: 2px solid #2D3436; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 2px 2px 0 #2D3436; transition: all 0.2s;"
                                onmouseover="this.style.transform='translate(-1px, -1px)'; this.style.boxShadow='3px 3px 0 #2D3436'"
                                onmouseout="this.style.transform=''; this.style.boxShadow='2px 2px 0 #2D3436'">
                            ${rule.is_enabled ? '○ Désactiver' : '✓ Activer'}
                        </button>
                        <button class="edit-rule-btn" data-rule-id="${rule.id}"
                                style="background: #74b9ff; color: white; border: 2px solid #2D3436; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-weight: 600; font-size: 0.85rem; box-shadow: 2px 2px 0 #2D3436; transition: all 0.2s;"
                                onmouseover="this.style.transform='translate(-1px, -1px)'; this.style.boxShadow='3px 3px 0 #2D3436'"
                                onmouseout="this.style.transform=''; this.style.boxShadow='2px 2px 0 #2D3436'">
                            ✏️ Modifier
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    if (window.SecurityUtils) {
        window.SecurityUtils.setInnerHTML(container, html, { trusted: true });
    } else {
        container.innerHTML = html;
    }

    // Attacher les événements après l'injection du HTML
    attachRuleButtonEvents();
}

/**
 * Attache les événements aux boutons des règles
 */
function attachRuleButtonEvents() {
    // Boutons toggle
    document.querySelectorAll('.toggle-rule-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ruleId = this.getAttribute('data-rule-id');
            const isEnabled = this.getAttribute('data-enabled') === 'true';
            toggleRuleStatus(ruleId, !isEnabled);
        });
    });

    // Boutons edit
    document.querySelectorAll('.edit-rule-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ruleId = this.getAttribute('data-rule-id');
            openEditRuleModal(ruleId);
        });
    });
}

// ==========================================
// 🔄 ACTIVATION/DÉSACTIVATION RÈGLES
// ==========================================

/**
 * Active ou désactive une règle
 */
async function toggleRuleStatus(ruleId, newStatus) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client non disponible');
        }

        const { error } = await client
            .from('cleaning_rules')
            .update({ is_enabled: newStatus })
            .eq('id', ruleId);

        if (error) throw error;

        showToast(newStatus ? '✓ Règle activée' : '○ Règle désactivée', 'success');
        await loadCleaningRules();
    } catch (error) {
        console.error('❌ Erreur toggle règle:', error);
        showToast('Erreur lors de la modification', 'error');
    }
}

// ==========================================
// ✏️ MODIFICATION DES RÈGLES
// ==========================================

/**
 * Ouvre le modal d'édition d'une règle
 */
async function openEditRuleModal(ruleId) {
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client non disponible');
        }

        const { data: rule, error } = await client
            .from('cleaning_rules')
            .select('*')
            .eq('id', ruleId)
            .single();

        if (error) throw error;

        // Créer le modal
        const modal = document.createElement('div');
        modal.id = 'edit-rule-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
        
        modal.innerHTML = `
            <div style="background: white; border: 3px solid #2D3436; border-radius: 16px; box-shadow: 8px 8px 0 #2D3436; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 1.5rem; color: #2D3436; font-weight: 700;">✏️ Modifier la règle</h2>
                    <button onclick="closeEditRuleModal()" style="background: #ff7675; color: white; border: 2px solid #2D3436; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.2rem; box-shadow: 2px 2px 0 #2D3436;">✕</button>
                </div>
                
                <form id="edit-rule-form" onsubmit="saveRule(event, '${rule.id}'); return false;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2D3436;">Nom de la règle</label>
                        <input type="text" id="rule-name" value="${rule.rule_name}" required
                               style="width: 100%; padding: 12px; border: 2px solid #2D3436; border-radius: 8px; font-size: 1rem; box-shadow: 2px 2px 0 #2D3436;">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2D3436;">Description</label>
                        <textarea id="rule-description" rows="3" required
                                  style="width: 100%; padding: 12px; border: 2px solid #2D3436; border-radius: 8px; font-size: 1rem; resize: vertical; box-shadow: 2px 2px 0 #2D3436;">${rule.description}</textarea>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2D3436;">Priorité (plus petit = plus prioritaire)</label>
                        <input type="number" id="rule-priority" value="${rule.priority}" min="0" required
                               style="width: 100%; padding: 12px; border: 2px solid #2D3436; border-radius: 8px; font-size: 1rem; box-shadow: 2px 2px 0 #2D3436;">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="rule-enabled" ${rule.is_enabled ? 'checked' : ''}
                                   style="width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-weight: 600; color: #2D3436;">Règle activée</span>
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
                        <button type="button" onclick="closeEditRuleModal()"
                                style="background: #dfe6e9; color: #2D3436; border: 2px solid #2D3436; border-radius: 8px; padding: 12px 24px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 3px 3px 0 #2D3436;">
                            Annuler
                        </button>
                        <button type="submit"
                                style="background: #55efc4; color: #2D3436; border: 2px solid #2D3436; border-radius: 8px; padding: 12px 24px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 3px 3px 0 #2D3436;">
                            💾 Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('❌ Erreur ouverture modal:', error);
        showToast('Erreur lors de l\'ouverture du modal', 'error');
    }
}

/**
 * Ferme le modal d'édition
 */
function closeEditRuleModal() {
    const modal = document.getElementById('edit-rule-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Sauvegarde les modifications d'une règle
 */
async function saveRule(event, ruleId) {
    event.preventDefault();
    
    const name = document.getElementById('rule-name').value.trim();
    const description = document.getElementById('rule-description').value.trim();
    const priority = parseInt(document.getElementById('rule-priority').value);
    const enabled = document.getElementById('rule-enabled').checked;
    
    try {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client non disponible');
        }

        const { error } = await client
            .from('cleaning_rules')
            .update({
                rule_name: name,
                description: description,
                priority: priority,
                is_enabled: enabled
            })
            .eq('id', ruleId);

        if (error) throw error;

        showToast('✓ Règle modifiée avec succès', 'success');
        closeEditRuleModal();
        await loadCleaningRules();
    } catch (error) {
        console.error('❌ Erreur sauvegarde règle:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

// ==========================================
// 📖 RÉCUPÉRATION DES RÈGLES ACTIVES
// ==========================================

/**
 * Récupère les règles actives pour le calcul des ménages
 */
async function getActiveCleaningRules() {
    try {
        const client = getSupabaseClient();
        if (!client) {
            console.warn('Supabase client non disponible');
            return [];
        }

        const { data: rules, error } = await client
            .from('cleaning_rules')
            .select('*')
            .eq('is_enabled', true)
            .order('priority', { ascending: true });

        if (error) throw error;
        
        return rules || [];
    } catch (error) {
        console.error('❌ Erreur récupération règles actives:', error);
        return [];
    }
}

// Exporter les fonctions
window.loadCleaningRules = loadCleaningRules;
window.toggleRuleStatus = toggleRuleStatus;
window.openEditRuleModal = openEditRuleModal;
window.closeEditRuleModal = closeEditRuleModal;
window.saveRule = saveRule;
window.getActiveCleaningRules = getActiveCleaningRules;
