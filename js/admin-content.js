// ================================================================
// 📝 CONTENT IA - GÉNÉRATION AUTOMATIQUE
// ================================================================
// Génération de posts sociaux, emails, blogs avec IA
// ================================================================

// console.log('🚀 Script admin-content.js chargé');

// ================================================================
// ÉTAT GLOBAL
// ================================================================

let currentContentType = '';
let generatedContent = '';
let currentContentId = null;
let currentUser = null;
// isCurrentUserAdmin → window.isCurrentUserAdmin (shared-config.js)

async function checkAuth() {
    try {
        if (!window.supabaseClient) {
            console.error('❌ Supabase client non initialisé');
            window.location.href = '../index.html';
            return false;
        }

        const { data: { session }, error } = await window.supabaseClient.auth.getSession();

        if (error || !session?.user) {
            window.location.href = '../index.html';
            return false;
        }

        currentUser = session.user;
        const isAdmin = await isCurrentUserAdmin(currentUser);
        if (!isAdmin) {
            alert('Accès refusé : Réservé aux administrateurs');
            window.location.href = '../index.html';
            return false;
        }

        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            userEmailEl.textContent = currentUser.email || '';
        }

        return true;
    } catch (authError) {
        console.error('❌ Erreur authentification:', authError);
        window.location.href = '../index.html';
        return false;
    }
}

// Templates prédéfinis
const TEMPLATES = {
    'promo-saisonniere': {
        type: 'post',
        subject: 'Promotion Saisonnière',
        tone: 'enthousiaste',
        keyPoints: '- Réduction spéciale\n- Offre limitée\n- Conditions avantageuses',
        cta: 'Profitez-en maintenant !'
    },
    'nouvelle-fonctionnalite': {
        type: 'email',
        subject: 'Nouvelle Fonctionnalité',
        tone: 'professionnel',
        keyPoints: '- Innovation majeure\n- Amélioration expérience\n- Bénéfices clients',
        cta: 'Découvrir la nouveauté'
    },
    'temoignage-client': {
        type: 'blog',
        subject: 'Success Story Client',
        tone: 'informatif',
        keyPoints: '- Problématique initiale\n- Solution apportée\n- Résultats obtenus',
        cta: 'Lire le témoignage complet'
    },
    'conseils-experts': {
        type: 'newsletter',
        subject: 'Conseils d\'Experts',
        tone: 'amical',
        keyPoints: '- Best practices\n- Erreurs à éviter\n- Astuces pro',
        cta: 'Appliquer ces conseils'
    }
};

// ================================================================
// INITIALISATION
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // console.log('📝 Initialisation Content IA');
    
    const isAllowed = await checkAuth();
    if (!isAllowed) {
        return;
    }
    
    lucide.createIcons();
    
    await loadContent();
    setupEventListeners();
});

function setupEventListeners() {
    document.addEventListener('click', async (event) => {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) {
            return;
        }

        const action = actionEl.dataset.action;
        const contentId = actionEl.dataset.contentId;
        if (!action || !contentId) {
            return;
        }

        switch (action) {
            case 'view-content':
                await viewContent(contentId);
                break;
            case 'edit-content':
                await editContent(contentId);
                break;
            case 'delete-content':
                await deleteContent(contentId);
                break;
            default:
                break;
        }
    });

    // Filtres
    document.getElementById('filterType').addEventListener('change', filterContent);
    document.getElementById('searchContent').addEventListener('input', filterContent);
    
    // Formulaire génération
    document.getElementById('formGenerate').addEventListener('submit', async (e) => {
        e.preventDefault();
        await generateContent();
    });
}

// ================================================================
// CHARGEMENT CONTENU
// ================================================================

async function loadContent() {
    try {
        const { data: contents, error } = await window.supabaseClient
            .from('cm_content_generated')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            if (error.code === 'PGRST116') {
                // Table n'existe pas
                console.warn('⚠️ Table cm_content_generated non créée. Exécutez CREATE_CONTENT_TABLE.sql dans Supabase.');
                renderContent([]);
                return;
            }
            throw error;
        }
        
        renderContent(contents || []);
        
    } catch (error) {
        console.error('❌ Erreur chargement contenu:', error);
        renderContent([]);
    }
}

function renderContent(contents) {
    const tbody = document.getElementById('tbodyContent');
    
    if (!contents || contents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #9CA3AF;">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; margin: 0 auto 10px;"></i>
                    <p>Aucun contenu généré. Cliquez sur un bouton ci-dessus pour commencer !</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }
    
    tbody.innerHTML = contents.map(content => {
        const typeLabel = getTypeLabel(content.type);
        const typeBadge = getTypeBadge(content.type);
        const statutBadge = getStatutBadge(content.statut);
        
        return `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                    ${new Date(content.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                    ${typeBadge}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                    <strong>${content.subject}</strong>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                    ${statutBadge}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
                    ${getPerformanceHTML(content)}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">
                    <button data-action="view-content" data-content-id="${content.id}" class="btn-icon" title="Voir">
                        <i data-lucide="eye"></i>
                    </button>
                    <button data-action="edit-content" data-content-id="${content.id}" class="btn-icon" title="Éditer">
                        <i data-lucide="edit"></i>
                    </button>
                    <button data-action="delete-content" data-content-id="${content.id}" class="btn-icon" title="Supprimer">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    lucide.createIcons();
}

// ================================================================
// FILTRAGE
// ================================================================

function filterContent() {
    const typeFilter = document.getElementById('filterType').value;
    const searchTerm = document.getElementById('searchContent').value.toLowerCase();
    
    const rows = document.querySelectorAll('#tbodyContent tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 1) return; // Skip empty state
        
        const type = cells[1].textContent.trim();
        const subject = cells[2].textContent.toLowerCase();
        
        const matchType = !typeFilter || type.includes(typeFilter);
        const matchSearch = !searchTerm || subject.includes(searchTerm);
        
        row.style.display = (matchType && matchSearch) ? '' : 'none';
    });
}

// ================================================================
// MODALS
// ================================================================

function showGenerateModal(type) {
    currentContentType = type;
    
    const modal = document.getElementById('modalGenerate');
    const title = document.getElementById('modalTitle');
    
    const titles = {
        'post': 'Générer un Post Social',
        'email': 'Générer un Email Marketing',
        'blog': 'Générer un Article de Blog',
        'newsletter': 'Générer une Newsletter'
    };
    
    title.textContent = titles[type] || 'Générer du Contenu';
    document.getElementById('contentType').value = type;
    
    // Reset form
    document.getElementById('formGenerate').reset();
    
    modal.style.display = 'flex';
    lucide.createIcons();
}

function closeGenerateModal() {
    document.getElementById('modalGenerate').style.display = 'none';
}

function closePreviewModal() {
    document.getElementById('modalPreview').style.display = 'none';
}

// ================================================================
// TEMPLATES
// ================================================================

function useTemplate(templateKey) {
    const template = TEMPLATES[templateKey];
    if (!template) return;
    
    showGenerateModal(template.type);
    
    // Pré-remplir avec le template
    setTimeout(() => {
        document.getElementById('contentSubject').value = template.subject;
        document.getElementById('contentTone').value = template.tone;
        document.getElementById('contentKeyPoints').value = template.keyPoints;
        document.getElementById('contentCTA').value = template.cta;
    }, 100);
}

// ================================================================
// GÉNÉRATION CONTENU
// ================================================================

async function generateContent() {
    try {
        const type = document.getElementById('contentType').value;
        const subject = document.getElementById('contentSubject').value;
        const tone = document.getElementById('contentTone').value;
        const keyPoints = document.getElementById('contentKeyPoints').value;
        const cta = document.getElementById('contentCTA').value;
        const length = document.getElementById('contentLength').value;
        const model = document.getElementById('aiModel')?.value || 'gpt-4';
        
        // Afficher loader
        showToast('🤖 Génération en cours avec ' + model.toUpperCase() + '...', 'info');
        
        // Vérifier si API disponible (déployé sur Vercel uniquement)
        const isVercelDeployed = window.location.hostname.includes('vercel.app');
        
        let content = '';
        
        if (isVercelDeployed) {
            // ========== MODE PRODUCTION : API RÉELLE ==========
            const response = await fetch('/api/content-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'generate-text',
                    type: type,
                    subject: subject,
                    tone: tone,
                    keyPoints: keyPoints,
                    cta: cta,
                    length: length,
                    model: model
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur API');
            }
            
            const data = await response.json();
            content = data.content;
            
        } else {
            // ========== MODE LOCAL : SIMULATION ==========
            // console.log('⚠️ Mode simulation - Déployez sur Vercel pour utiliser les vraies APIs IA');
            content = simulateAIGeneration(type, subject, tone, keyPoints, cta, length);
        }
        
        generatedContent = content;
        
        // Fermer modal génération
        closeGenerateModal();
        
        // Ouvrir modal prévisualisation
        showPreview(generatedContent);
        
        showToast('✅ Contenu généré avec succès !', 'success');
        
    } catch (error) {
        console.error('❌ Erreur génération:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

function simulateAIGeneration(type, subject, tone, keyPoints, cta, length) {
    // Simulation simple - en production, appeler API IA
    
    const intros = {
        'professionnel': `Chers clients,\n\nNous sommes ravis de vous présenter : ${subject}.`,
        'amical': `Salut ! 👋\n\nOn a quelque chose de génial à partager avec vous : ${subject} !`,
        'enthousiaste': `🎉 SUPER NOUVELLE ! 🎉\n\n${subject} arrive et c'est incroyable !`,
        'informatif': `Bonjour,\n\nVoici ce qu'il faut savoir sur ${subject} :`,
        'urgent': `⚠️ IMPORTANT ⚠️\n\n${subject} - Action requise !`
    };
    
    let content = intros[tone] || intros['professionnel'];
    content += '\n\n';
    
    if (keyPoints) {
        content += 'Points clés :\n' + keyPoints + '\n\n';
    }
    
    // Ajouter contenu selon longueur
    if (length === 'court') {
        content += `En résumé, ${subject.toLowerCase()} représente une opportunité unique pour vous.\n\n`;
    } else if (length === 'moyen') {
        content += `Cette initiative s'inscrit dans notre volonté constante d'améliorer votre expérience. Nous avons travaillé dur pour vous offrir le meilleur, et nous sommes convaincus que ${subject.toLowerCase()} répondra à vos attentes.\n\n`;
    } else {
        content += `Cette initiative s'inscrit dans notre volonté constante d'améliorer votre expérience et de vous proposer des solutions toujours plus performantes. Après plusieurs mois de développement et d'écoute de vos retours, nous avons conçu ${subject.toLowerCase()} pour répondre précisément à vos besoins.\n\nNos équipes ont mis tout leur savoir-faire au service de ce projet, et nous sommes fiers du résultat obtenu. Chaque détail a été pensé pour vous faciliter la vie et vous permettre de gagner en efficacité.\n\n`;
    }
    
    if (cta) {
        content += `${cta}\n\n`;
    }
    
    // Signature selon type
    const signatures = {
        'post': '✨ L\'équipe',
        'email': 'Cordialement,\nL\'équipe Channel Manager',
        'blog': '---\nPublié par l\'équipe Channel Manager',
        'newsletter': 'À bientôt ! 💌\nL\'équipe'
    };
    
    content += signatures[type] || signatures['email'];
    
    return content;
}

function showPreview(content) {
    const modal = document.getElementById('modalPreview');
    const previewDiv = document.getElementById('previewContent');
    
    previewDiv.textContent = content;
    
    // Calculer statistiques
    const words = content.split(/\s+/).length;
    const chars = content.length;
    const readTime = Math.ceil(words / 200); // 200 mots/min
    
    document.getElementById('statWords').textContent = words;
    document.getElementById('statChars').textContent = chars;
    document.getElementById('statReadTime').textContent = readTime + ' min';
    
    modal.style.display = 'flex';
    lucide.createIcons();
}

// ================================================================
// ACTIONS CONTENU
// ================================================================

async function saveContent() {
    try {
        const subject = document.getElementById('contentSubject').value;
        const type = currentContentType;
        
        const { data, error } = await window.supabaseClient
            .from('cm_content_generated')
            .insert({
                type: type,
                subject: subject,
                content: generatedContent,
                statut: 'brouillon',
                tone: document.getElementById('contentTone').value,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        showToast('Contenu enregistré avec succès', 'success');
        closePreviewModal();
        await loadContent();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

async function regenerateContent() {
    await generateContent();
}

function copyContent() {
    const content = document.getElementById('previewContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
        showToast('Contenu copié dans le presse-papier', 'success');
    });
}

async function viewContent(id) {
    try {
        const { data: content, error } = await window.supabaseClient
            .from('cm_content_generated')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        generatedContent = content.content;
        currentContentId = id;
        showPreview(content.content);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

async function editContent(id) {
    try {
        const { data: content, error } = await window.supabaseClient
            .from('cm_content_generated')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Pré-remplir le formulaire
        showGenerateModal(content.type);
        
        setTimeout(() => {
            document.getElementById('contentSubject').value = content.subject;
            document.getElementById('contentTone').value = content.tone || 'professionnel';
        }, 100);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

async function deleteContent(id) {
    if (!confirm('Supprimer ce contenu ?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('cm_content_generated')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('Contenu supprimé', 'success');
        await loadContent();
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// ================================================================
// UTILITAIRES
// ================================================================

function getTypeLabel(type) {
    const labels = {
        'post': 'Post Social',
        'email': 'Email',
        'blog': 'Blog',
        'newsletter': 'Newsletter'
    };
    return labels[type] || type;
}

function getTypeBadge(type) {
    const badges = {
        'post': '<span class="badge badge-info">Post</span>',
        'email': '<span class="badge badge-primary">Email</span>',
        'blog': '<span class="badge badge-success">Blog</span>',
        'newsletter': '<span class="badge badge-warning">Newsletter</span>'
    };
    return badges[type] || `<span class="badge">${type}</span>`;
}

function getStatutBadge(statut) {
    const badges = {
        'brouillon': '<span class="badge" style="background: #E5E7EB; color: #374151;">Brouillon</span>',
        'publie': '<span class="badge badge-success">Publié</span>',
        'planifie': '<span class="badge badge-warning">Planifié</span>'
    };
    return badges[statut] || statut;
}

function getPerformanceHTML(content) {
    if (content.statut === 'brouillon') {
        return '<span style="color: #9CA3AF; font-size: 0.85rem;">-</span>';
    }
    
    const views = content.views || Math.floor(Math.random() * 500);
    const clicks = content.clicks || Math.floor(Math.random() * 50);
    
    return `
        <div style="font-size: 0.85rem;">
            <div>👁️ ${views} vues</div>
            <div>👆 ${clicks} clics</div>
        </div>
    `;
}

// showToast — défini dans js/utils.js (chargé avant ce fichier)

// Export fonctions globales
window.showGenerateModal = showGenerateModal;
window.closeGenerateModal = closeGenerateModal;
window.closePreviewModal = closePreviewModal;
window.useTemplate = useTemplate;
window.regenerateContent = regenerateContent;
window.copyContent = copyContent;
window.saveContent = saveContent;
window.viewContent = viewContent;
window.editContent = editContent;
window.deleteContent = deleteContent;

// ================================================================
// GÉNÉRATION VISUEL DALL-E 3
// ================================================================

let currentGeneratedImage = null;

function showImageGenerator() {
    document.getElementById('modalImage').style.display = 'flex';
    lucide.createIcons();
}

function closeImageModal() {
    document.getElementById('modalImage').style.display = 'none';
    document.getElementById('imageResult').style.display = 'none';
}

document.getElementById('formImage')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await generateImage();
});

async function generateImage() {
    try {
        const prompt = document.getElementById('imagePrompt').value;
        const style = document.getElementById('imageStyle').value;
        const size = document.getElementById('imageSize').value;
        const provider = document.getElementById('imageProvider').value;
        
        const providerName = provider === 'stability' ? 'Stability AI' : 'DALL-E 3';
        showToast(`🎨 Génération avec ${providerName}...`, 'info');
        
        // Vérifier si API disponible (Vercel uniquement)
        const isVercelDeployed = window.location.hostname.includes('vercel.app');
        
        if (!isVercelDeployed) {
            // Mode simulation - afficher une image placeholder
            // console.log('⚠️ Mode simulation - Image placeholder affichée');
            currentGeneratedImage = 'https://via.placeholder.com/1024x1024/667eea/ffffff?text=Image+Simulee';
            document.getElementById('generatedImage').src = currentGeneratedImage;
            document.getElementById('imageResult').style.display = 'block';
            showToast('⚠️ Mode simulation - Déployez sur Vercel pour vraies images', 'info');
            return;
        }
        
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-image',
                prompt: prompt,
                style: style,
                size: size,
                provider: provider
            })
        });

        const data = await response.json();

        // Afficher le message d'erreur détaillé
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Erreur génération image');
        }

        // Stability AI renvoie base64, DALL-E renvoie URL
        if (data.imageBase64) {
            currentGeneratedImage = `data:image/png;base64,${data.imageBase64}`;
        } else if (data.imageUrl) {
            currentGeneratedImage = data.imageUrl;
        }
        
        document.getElementById('generatedImage').src = currentGeneratedImage;
        document.getElementById('imageResult').style.display = 'block';
        showToast(`✅ Image générée avec ${providerName} !`, 'success');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

function generateVisual() {
    // Pré-remplir avec le sujet du contenu généré
    const subject = document.getElementById('contentSubject')?.value || '';
    showImageGenerator();
    setTimeout(() => {
        document.getElementById('imagePrompt').value = subject;
    }, 100);
}

function downloadImage() {
    if (!currentGeneratedImage) return;
    
    const link = document.createElement('a');
    link.href = currentGeneratedImage;
    link.download = 'visuel-' + Date.now() + '.png';
    link.click();
    
    showToast('✅ Image téléchargée', 'success');
}

function useImageInContent() {
    // Sauvegarder l'image avec le contenu
    closeImageModal();
    showToast('✅ Image ajoutée au contenu', 'success');
}

// ================================================================
// CONNEXION RÉSEAUX SOCIAUX
// ================================================================

function showSocialConnect() {
    document.getElementById('modalSocial').style.display = 'flex';
    lucide.createIcons();
}

function closeSocialModal() {
    document.getElementById('modalSocial').style.display = 'none';
}

async function connectSocial(platform) {
    try {
        const response = await fetch('/api/social-publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-auth-url',
                platform: platform
            })
        });
        
        if (!response.ok) throw new Error('Erreur connexion');
        
        const data = await response.json();
        
        if (data.authUrl) {
            // Ouvrir popup OAuth
            window.open(data.authUrl, 'social-auth', 'width=600,height=700');
            showToast(`🔐 Connectez-vous à ${platform}`, 'info');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ Erreur de connexion', 'error');
    }
}

// ================================================================
// PUBLICATION SUR RÉSEAUX SOCIAUX
// ================================================================

function showPublishModal() {
    document.getElementById('modalPublish').style.display = 'flex';
    lucide.createIcons();
}

function closePublishModal() {
    document.getElementById('modalPublish').style.display = 'none';
}

async function publishToSocial() {
    try {
        const checkboxes = document.querySelectorAll('input[name="platform"]:checked');
        const platforms = Array.from(checkboxes).map(cb => cb.value);
        
        if (platforms.length === 0) {
            showToast('⚠️ Sélectionnez au moins une plateforme', 'error');
            return;
        }
        
        showToast('📤 Publication en cours...', 'info');
        
        const promises = platforms.map(async (platform) => {
            const response = await fetch('/api/social-publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'publish',
                    platform: platform,
                    content: generatedContent,
                    imageUrl: currentGeneratedImage
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`${platform}: ${error.error}`);
            }
            
            return await response.json();
        });
        
        const results = await Promise.allSettled(promises);
        
        const successes = results.filter(r => r.status === 'fulfilled').length;
        const failures = results.filter(r => r.status === 'rejected').length;
        
        if (successes > 0) {
            showToast(`✅ Publié sur ${successes} plateforme(s) !`, 'success');
        }
        
        if (failures > 0) {
            showToast(`⚠️ ${failures} erreur(s) de publication`, 'error');
        }
        
        closePublishModal();
        closePreviewModal();
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showToast('❌ Erreur de publication', 'error');
    }
}

// Export nouvelles fonctions
window.showImageGenerator = showImageGenerator;
window.closeImageModal = closeImageModal;
window.generateVisual = generateVisual;
window.downloadImage = downloadImage;
window.useImageInContent = useImageInContent;
window.showSocialConnect = showSocialConnect;
window.closeSocialModal = closeSocialModal;
window.connectSocial = connectSocial;
window.showPublishModal = showPublishModal;
window.closePublishModal = closePublishModal;
window.publishToSocial = publishToSocial;
