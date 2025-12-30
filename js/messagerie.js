// ==========================================
// 📧 GESTION DES EMAILS ET TEMPLATES
// ==========================================

function switchMessagerieTab(tab) {
    // Mettre à jour les boutons
    const emailBtn = document.getElementById('tabEmails');
    const templatesBtn = document.getElementById('tabTemplates');
    
    if (emailBtn) {
        emailBtn.style.background = tab === 'emails' ? '#3498DB' : 'white';
        emailBtn.style.color = tab === 'emails' ? 'white' : '#666';
    }
    if (templatesBtn) {
        templatesBtn.style.background = tab === 'templates' ? '#3498DB' : 'white';
        templatesBtn.style.color = tab === 'templates' ? 'white' : '#666';
    }
    
    // Afficher la section correspondante
    const emailsSection = document.getElementById('emailsSection');
    const templatesSection = document.getElementById('templatesSection');
    
    if (emailsSection) emailsSection.style.display = tab === 'emails' ? 'block' : 'none';
    if (templatesSection) templatesSection.style.display = tab === 'templates' ? 'block' : 'none';
    
    // Charger les données
    if (tab === 'emails') {
        loadEmails();
    } else {
        loadTemplates();
    }
}

async function loadEmails() {
    const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) {
        console.error('Erreur chargement emails:', error);
        return;
    }
    
    displayEmails(data || []);
    updateEmailStats(data || []);
}

function displayEmails(emails) {
    const container = document.getElementById('emailsContainer');
    if (!container) return;
    
    if (emails.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucun email</p>';
        return;
    }
    
    const statusIcons = {
        'unread': '📬',
        'read': '📭',
        'replied': '✅',
        'archived': '📦'
    };
    
    const statusColors = {
        'unread': '#E74C3C',
        'read': '#95A5A6',
        'replied': '#27AE60',
        'archived': '#BDC3C7'
    };
    
    let html = '';
    emails.forEach(email => {
        const icon = statusIcons[email.status] || '📧';
        const color = statusColors[email.status] || '#999';
        const isUnread = email.status === 'unread';
        const date = formatDateFromObj(new Date(email.created_at));
        
        html += `
            <div onclick="openEmail(${email.id})" style="
                border: 1px solid ${isUnread ? '#3498DB' : '#ddd'}; 
                padding: 16px; 
                margin-bottom: 8px; 
                border-radius: 8px; 
                background: ${isUnread ? '#EBF5FB' : 'white'}; 
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="font-size: 1.5rem;">${icon}</span>
                            <strong style="font-weight: ${isUnread ? 'bold' : 'normal'};">${email.subject || '(Sans objet)'}</strong>
                        </div>
                        <div style="font-size: 0.9rem; color: #666;">
                            <strong>De:</strong> ${email.from_name || email.from_email}
                        </div>
                        ${email.to_name ? `<div style="font-size: 0.9rem; color: #666;"><strong>À:</strong> ${email.to_name}</div>` : ''}
                        <div style="font-size: 0.85rem; color: #999; margin-top: 4px;">
                            ${date}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; background: ${color}; color: white;">
                            ${email.status === 'unread' ? 'Non lu' : email.status === 'read' ? 'Lu' : email.status === 'replied' ? 'Répondu' : 'Archivé'}
                        </span>
                        ${email.type === 'received' ? '<button onclick="replyToEmail(event, ' + email.id + ')" class="btn" style="background: #3498DB; color: white; padding: 6px 12px; border: none; border-radius: 6px; font-size: 0.85rem;">↩️ Répondre</button>' : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateEmailStats(emails) {
    const unreadCount = emails.filter(e => e.status === 'unread').length;
    const repliedCount = emails.filter(e => e.status === 'replied').length;
    const totalCount = emails.length;
    
    const statsContainer = document.getElementById('emailStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div style="display: flex; gap: 16px; padding: 16px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: #E74C3C;">${unreadCount}</div>
                    <div style="font-size: 0.9rem; color: #666;">Non lus</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: #27AE60;">${repliedCount}</div>
                    <div style="font-size: 0.9rem; color: #666;">Répondus</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: #3498DB;">${totalCount}</div>
                    <div style="font-size: 0.9rem; color: #666;">Total</div>
                </div>
            </div>
        `;
    }
}

async function openEmail(emailId) {
    const { data: email, error } = await supabase
        .from('emails')
        .select('*')
        .eq('id', emailId)
        .single();
    
    if (error || !email) {
        console.error('Erreur chargement email:', error);
        return;
    }
    
    // Marquer comme lu
    if (email.status === 'unread') {
        await supabase
            .from('emails')
            .update({ status: 'read', read_at: new Date().toISOString() })
            .eq('id', emailId);
    }
    
    // Afficher le modal
    const modal = document.getElementById('emailModal');
    if (!modal) return;
    
    document.getElementById('emailModalSubject').textContent = email.subject || '(Sans objet)';
    document.getElementById('emailModalFrom').textContent = email.from_name || email.from_email;
    document.getElementById('emailModalDate').textContent = formatDateFromObj(new Date(email.created_at));
    document.getElementById('emailModalBody').innerHTML = email.html_body || email.body.replace(/\n/g, '<br>');
    
    modal.style.display = 'flex';
    
    // Recharger la liste
    loadEmails();
}

function closeEmailModal() {
    const modal = document.getElementById('emailModal');
    if (modal) modal.style.display = 'none';
}

function replyToEmail(event, emailId) {
    event.stopPropagation(); // Empêcher l'ouverture de l'email
    
    // Afficher le formulaire de réponse
    const modal = document.getElementById('replyModal');
    if (!modal) return;
    
    modal.dataset.replyToId = emailId;
    modal.style.display = 'flex';
    
    // Charger les templates
    loadTemplatesForReply();
}

function closeReplyModal() {
    const modal = document.getElementById('replyModal');
    if (modal) modal.style.display = 'none';
}

async function loadTemplatesForReply() {
    const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });
    
    if (error) {
        console.error('Erreur chargement templates:', error);
        return;
    }
    
    const select = document.getElementById('templateSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Choisir un template --</option>';
    (data || []).forEach(template => {
        select.innerHTML += `<option value="${template.id}">${template.name} (${template.category})</option>`;
    });
}

async function applyTemplate() {
    const select = document.getElementById('templateSelect');
    const templateId = select.value;
    
    if (!templateId) return;
    
    const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();
    
    if (error || !template) {
        console.error('Erreur chargement template:', error);
        return;
    }
    
    document.getElementById('replySubject').value = template.subject;
    document.getElementById('replyBody').value = template.body;
    
    // Afficher les variables disponibles
    if (template.variables) {
        alert('Variables disponibles:\n' + Object.entries(template.variables).map(([key, desc]) => `{{${key}}} = ${desc}`).join('\n'));
    }
}

async function sendReply() {
    const modal = document.getElementById('replyModal');
    const replyToId = modal.dataset.replyToId;
    const subject = document.getElementById('replySubject').value;
    const body = document.getElementById('replyBody').value;
    
    if (!subject || !body) {
        alert('⚠️ Veuillez remplir le sujet et le message');
        return;
    }
    
    // Récupérer l'email original
    const { data: originalEmail } = await supabase
        .from('emails')
        .select('*')
        .eq('id', replyToId)
        .single();
    
    if (!originalEmail) return;
    
    // Créer la réponse
    const { error: insertError } = await supabase
        .from('emails')
        .insert({
            type: 'sent',
            from_email: 'contact@welcomehome.fr', // À adapter
            from_name: 'Welcome Home',
            to_email: originalEmail.from_email,
            to_name: originalEmail.from_name,
            subject: subject,
            body: body,
            replied_to_id: replyToId,
            status: 'read',
            reservation_id: originalEmail.reservation_id
        });
    
    if (insertError) {
        console.error('Erreur envoi réponse:', insertError);
        alert('❌ Erreur lors de l\'envoi');
        return;
    }
    
    // Marquer l'original comme répondu
    await supabase
        .from('emails')
        .update({ status: 'replied', replied_at: new Date().toISOString() })
        .eq('id', replyToId);
    
    alert('✅ Réponse envoyée !');
    closeReplyModal();
    loadEmails();
}

// ==========================================
// 📝 GESTION DES TEMPLATES
// ==========================================

async function loadTemplates() {
    const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true });
    
    if (error) {
        console.error('Erreur chargement templates:', error);
        return;
    }
    
    displayTemplates(data || []);
}

function displayTemplates(templates) {
    const container = document.getElementById('templatesContainer');
    if (!container) return;
    
    if (templates.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucun template</p>';
        return;
    }
    
    // Grouper par catégorie
    const byCategory = {};
    templates.forEach(t => {
        if (!byCategory[t.category]) byCategory[t.category] = [];
        byCategory[t.category].push(t);
    });
    
    let html = '';
    Object.entries(byCategory).forEach(([category, temps]) => {
        html += `<h3 style="margin-top: 24px; color: #2c3e50; text-transform: capitalize;">${category}</h3>`;
        
        temps.forEach(template => {
            const activeColor = template.is_active ? '#27AE60' : '#95A5A6';
            
            html += `
                <div style="border: 1px solid #ddd; padding: 16px; margin-bottom: 12px; border-radius: 8px; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <strong>${template.name}</strong>
                                <span style="padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; background: ${activeColor}; color: white;">
                                    ${template.is_active ? 'Actif' : 'Inactif'}
                                </span>
                                <span style="color: #999; font-size: 0.85rem;">📊 Utilisé ${template.usage_count || 0} fois</span>
                            </div>
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 4px;">
                                <strong>Sujet:</strong> ${template.subject}
                            </div>
                            <details style="margin-top: 8px;">
                                <summary style="cursor: pointer; color: #3498DB;">Voir le contenu</summary>
                                <pre style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-top: 8px; white-space: pre-wrap; font-size: 0.85rem;">${template.body}</pre>
                            </details>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="editTemplate(${template.id})" class="btn" style="background: #3498DB; color: white; padding: 6px 12px; border: none; border-radius: 6px; font-size: 0.85rem;">✏️</button>
                            <button onclick="deleteTemplate(${template.id})" class="btn" style="background: #E74C3C; color: white; padding: 6px 12px; border: none; border-radius: 6px; font-size: 0.85rem;">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });
    });
    
    container.innerHTML = html;
}

async function addTemplate() {
    const name = prompt('Nom du template:');
    if (!name) return;
    
    const category = prompt('Catégorie (reservation/information/reclamation/post_sejour):');
    if (!category) return;
    
    const subject = prompt('Sujet du message:');
    if (!subject) return;
    
    const body = prompt('Contenu du message (utilisez {{variable}} pour les variables):');
    if (!body) return;
    
    const { error } = await supabase
        .from('email_templates')
        .insert({
            name,
            category,
            subject,
            body,
            is_active: true
        });
    
    if (error) {
        console.error('Erreur création template:', error);
        alert('❌ Erreur lors de la création');
        return;
    }
    
    alert('✅ Template créé !');
    loadTemplates();
}

async function editTemplate(id) {
    alert('⚠️ Fonctionnalité d\'édition à venir');
    // TODO: Implémenter un formulaire d'édition
}

async function deleteTemplate(id) {
    if (!confirm('Supprimer ce template ?')) return;
    
    const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Erreur suppression:', error);
        return;
    }
    
    alert('✅ Template supprimé');
    loadTemplates();
}
