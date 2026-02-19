// ================================================================
// GESTION FAQ - QUESTIONS FRÉQUENTES CLIENTS
// ================================================================

// Supabase est déjà disponible globalement via window.supabaseClient
// const supabase = window.supabaseClient; // Commentaire car peut causer un conflit

let faqData = [];
let categorieFaqActive = 'all';
let faqBackfillInProgress = false;
let faqTranslationWarningShown = false;
let faqTranslationRateLimitedShown = false;

function notifyFAQ(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    const host = document.getElementById('faqNotification') || document.body;
    if (!host) return;

    const existing = host.querySelector('.faq-inline-notification');
    if (existing) {
        existing.remove();
    }

    const div = document.createElement('div');
    div.className = 'faq-inline-notification';
    div.textContent = message;
    div.style.cssText = [
        'position:fixed',
        'bottom:24px',
        'right:24px',
        'padding:10px 14px',
        'border-radius:8px',
        'font-size:0.9rem',
        'font-weight:600',
        'z-index:10000',
        'background:#1f2937',
        'color:#fff',
        'box-shadow:0 8px 24px rgba(0,0,0,0.2)'
    ].join(';');

    if (type === 'success') div.style.background = '#16a34a';
    if (type === 'warning') div.style.background = '#d97706';
    if (type === 'error') div.style.background = '#dc2626';

    host.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ================================================================
// TRADUCTION AUTOMATIQUE FR → EN
// ================================================================

/**
 * Traduit un texte français vers l'anglais via MyMemory API
 * @param {string} text - Texte à traduire
 * @returns {Promise<string>} Texte traduit
 */
function waitFaq(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitFaqTranslationText(text, maxLength = 180, maxEncodedLength = 480) {
    const source = String(text || '').trim();
    if (!source) return [];
    if (source.length <= maxLength && encodeURIComponent(source).length <= maxEncodedLength) return [source];

    const chunks = [];
    const paragraphs = source.split(/\n+/).map((part) => part.trim()).filter(Boolean);

    for (const paragraph of paragraphs) {
        if (paragraph.length <= maxLength) {
            chunks.push(paragraph);
            continue;
        }

        const sentences = paragraph
            .split(/(?<=[.!?;:])\s+/)
            .map((part) => part.trim())
            .filter(Boolean);

        let buffer = '';

        for (const sentence of sentences) {
            if (sentence.length > maxLength) {
                if (buffer) {
                    chunks.push(buffer);
                    buffer = '';
                }

                for (let i = 0; i < sentence.length; i += maxLength) {
                    chunks.push(sentence.slice(i, i + maxLength));
                }
                continue;
            }

            const candidate = buffer ? `${buffer} ${sentence}` : sentence;
            if (candidate.length <= maxLength) {
                buffer = candidate;
            } else {
                if (buffer) chunks.push(buffer);
                buffer = sentence;
            }
        }

        if (buffer) chunks.push(buffer);
    }

    const safeChunks = [];

    for (const chunk of chunks) {
        if (encodeURIComponent(chunk).length <= maxEncodedLength) {
            safeChunks.push(chunk);
            continue;
        }

        let start = 0;
        while (start < chunk.length) {
            let end = Math.min(start + maxLength, chunk.length);
            let candidate = chunk.slice(start, end);

            while (candidate && encodeURIComponent(candidate).length > maxEncodedLength) {
                end -= 10;
                if (end <= start) {
                    end = start + 1;
                    break;
                }
                candidate = chunk.slice(start, end);
            }

            safeChunks.push(candidate);
            start = end;
        }
    }

    return safeChunks.filter(Boolean);
}

async function translateFAQToEnglish(text) {
    if (!text || text.trim() === '') return '';
    
    try {
        const attemptTranslation = async (sourceText) => {
            let lastError = null;

            for (let attempt = 0; attempt < 3; attempt += 1) {
                if (attempt > 0) {
                    await waitFaq(700 * attempt);
                }

                let response;
                try {
                    response = await Promise.race([
                        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=fr|en`),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), 6000))
                    ]);
                } catch (networkError) {
                    lastError = networkError;
                    continue;
                }

                if (response.status === 429) {
                    if (!faqTranslationRateLimitedShown) {
                        notifyFAQ('⚠️ API de traduction temporairement limitée, certains textes restent en FR', 'warning');
                        faqTranslationRateLimitedShown = true;
                    }
                    lastError = new Error('Rate limited');
                    await waitFaq(1200 * (attempt + 1));
                    continue;
                }

                const data = await response.json();
                if (data.responseStatus === 200 && data.responseData?.translatedText) {
                    return data.responseData.translatedText;
                }

                const details = String(data.responseDetails || '').toLowerCase();
                if (details.includes('query length limit exceeded')) {
                    throw new Error('Query length limit exceeded');
                }

                lastError = new Error(data.responseDetails || 'Translation unavailable');
            }

            throw lastError || new Error('Translation unavailable');
        };

        const chunks = splitFaqTranslationText(text, 180, 480);
        const translatedChunks = [];

        for (const chunk of chunks) {
            let translated = await attemptTranslation(chunk);
            if (!translated || translated.trim() === '') {
                translated = await attemptTranslation(chunk);
            }

            await waitFaq(250);

            translatedChunks.push(translated && translated.trim() !== '' ? translated : chunk);
        }

        return translatedChunks.join(' ').trim() || text;
    } catch (error) {
        if (!faqTranslationWarningShown) {
            notifyFAQ('⚠️ Traduction FAQ indisponible pour certains contenus, texte FR conservé', 'warning');
            faqTranslationWarningShown = true;
        }
        return text; // Fallback sur le texte original
    }
}

// ================================================================
// INITIALISATION
// ================================================================

async function initFAQ() {
    await chargerFAQ();
    afficherFAQ();
}

// Charger les gîtes dans le select (appelé lors de l'ouverture du modal)
async function chargerGitesOptions() {
    const select = document.getElementById('question-gite');
    if (!select) return;
    
    try {
        let gites = [];

        if (window.gitesManager) {
            // En mode Options, subscriptionManager peut être absent → éviter l'attente longue
            if (window.subscriptionManager?.currentSubscription && typeof window.gitesManager.getVisibleGites === 'function') {
                gites = await window.gitesManager.getVisibleGites();
            } else if (typeof window.gitesManager.getAll === 'function') {
                gites = await window.gitesManager.getAll();
            }
        }
        
        // Garder l'option "Tous"
        select.innerHTML = '<option value="tous">📍 Tous les gîtes</option>';
        
        // Ajouter les gîtes avec leur UUID
        gites.forEach(gite => {
            const option = document.createElement('option');
            option.value = gite.id; // UUID
            option.textContent = `🏠 ${gite.name}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.warn('⚠️ Erreur chargement gîtes pour FAQ:', error);
    }
}

// Exposer globalement pour index.html
window.initFAQ = initFAQ;

// ================================================================
// CHARGEMENT DES DONNÉES
// ================================================================

async function chargerFAQ() {
    try {
        const { data, error } = await window.supabaseClient
            .from('faq')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrichir avec les infos des gîtes
        faqData = await Promise.all((data || []).map(async (question) => {
            if (question.gite_id) {
                try {
                    const gite = await window.gitesManager.getById(question.gite_id);
                    return {
                        ...question,
                        gite_name: gite?.name,
                        gite_color: gite?.color
                    };
                } catch (err) {
                    return question;
                }
            }
            return question;
        }));
    } catch (error) {
        console.error('Erreur chargement FAQ:', error);
        faqData = [];
    }
}

// ================================================================
// AFFICHAGE
// ================================================================

function afficherFAQ() {
    const container = document.getElementById('faq-list');
    if (!container) return;

    const faqFiltrees = categorieFaqActive === 'all' 
        ? faqData 
        : faqData.filter(q => q.category === categorieFaqActive);

    if (faqFiltrees.length === 0) {
        window.SecurityUtils.setInnerHTML(container, `
            <div class="empty-state">
                <i class="fas fa-question-circle"></i>
                <p>Aucune question dans cette catégorie</p>
                <button class="btn-primary" onclick="window.ajouterQuestionFAQ()">
                    Ajouter une question
                </button>
            </div>
        `);
        return;
    }

    window.SecurityUtils.setInnerHTML(container, faqFiltrees.map(question => `
        <div class="faq-item" data-id="${question.id}">
            <div class="faq-header" data-action="toggle-faq" data-question-id="${question.id}">
                <div class="faq-question">
                    <span class="faq-badge ${question.category}">${getCategorieIcon(question.category)} ${question.category || 'Autre'}</span>
                    <h3>${question.question}</h3>
                    ${question.gite_id && question.gite_name ? `<span class="badge" style="background: ${question.gite_color}; color: white; border: 2px solid #2D3436; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; text-transform: uppercase;">🏠 ${question.gite_name}</span>` : ''}
                </div>
                <div class="faq-actions">
                    <button class="btn-icon" data-action="modifier-question" data-question-id="${question.id}" title="Modifier" style="background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                        Modifier
                    </button>
                    <button class="btn-icon" data-action="supprimer-question" data-question-id="${question.id}" title="Supprimer" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                        Supprimer
                    </button>
                    <span style="font-size: 20px; margin-left: 10px; color: #667eea;">▼</span>
                </div>
            </div>
            <div class="faq-body">
                <div class="faq-answer">${question.answer}</div>
                <div class="faq-meta">
                    <span><i class="fas fa-tag"></i> ${getCategorieIcon(question.category)} ${question.category || 'Non classé'}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${question.gite_id && question.gite_name ? `<strong style="color: ${question.gite_color}">${question.gite_name}</strong>` : 'Tous les gîtes'}</span>
                    <span><i class="fas fa-sort-numeric-down"></i> Ordre: ${question.priority || 0}</span>
                </div>
            </div>
        </div>
    `).join(''));
    
    // 🔧 Gestionnaire d'événements par délégation pour les boutons
    attachFaqEventListeners(container);
}

// Attacher les gestionnaires d'événements aux boutons FAQ
function attachFaqEventListeners(container) {
    // Supprimer l'ancien listener s'il existe
    container.removeEventListener('click', handleFaqClick);
    // Ajouter le nouveau listener
    container.addEventListener('click', handleFaqClick);
}

// Gérer les clics sur les boutons FAQ
function handleFaqClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    
    const action = target.getAttribute('data-action');
    const questionId = target.getAttribute('data-question-id');
    
    e.stopPropagation(); // Empêcher la propagation
    
    switch(action) {
        case 'modifier-question':
            window.modifierQuestion(questionId);
            break;
        case 'supprimer-question':
            window.supprimerQuestion(questionId);
            break;
        case 'toggle-faq':
            // Gérer l'ouverture/fermeture de la FAQ
            const faqItem = target.closest('.faq-item');
            if (faqItem) {
                faqItem.classList.toggle('open');
            }
            break;
    }
}

function getCategorieIcon(categorie) {
    const icons = {
        arrivee: '🔑',
        depart: '🚪',
        equipements: '🏠',
        localisation: '📍',
        tarifs: '💰',
        reglement: '📋',
        autre: 'ℹ️'
    };
    return icons[categorie] || 'ℹ️';
}

// ================================================================
// FILTRAGE ET RECHERCHE
// ================================================================

window.filtrerFAQ = function(categorie) {
    categorieFaqActive = categorie;
    
    // Mettre à jour l'UI des chips
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.category === categorie);
    });
    
    // Réinitialiser la recherche
    const searchInput = document.getElementById('faq-search');
    if (searchInput) searchInput.value = '';
    
    afficherFAQ();
};

window.rechercherFAQ = function(terme) {
    const container = document.getElementById('faq-list');
    if (!container) return;
    
    const termeNormalisé = terme.toLowerCase().trim();
    
    // Si recherche vide, afficher toutes les FAQ
    if (termeNormalisé === '') {
        afficherFAQ();
        return;
    }
    
    // Filtrer par terme de recherche
    const faqFiltrees = faqData.filter(q => {
        const questionMatch = q.question.toLowerCase().includes(termeNormalisé);
        const reponseMatch = q.answer.toLowerCase().includes(termeNormalisé);
        return questionMatch || reponseMatch;
    });
    
    // Afficher résultats
    if (faqFiltrees.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Aucun résultat trouvé pour "' + terme + '"</p>');
        return;
    }
    
    let html = '';
    faqFiltrees.forEach(q => {
        html += `
            <div class="faq-item" data-id="${q.id}">
                <div class="faq-header" data-action="toggle-faq" data-question-id="${q.id}">
                    <div class="faq-question">
                        <span class="faq-badge ${q.category}">${getCategorieIcon(q.category)} ${q.category}</span>
                        <h3>${q.question}</h3>
                        ${q.gite !== 'tous' ? `<span style="background: #e0e0e0; padding: 4px 8px; border-radius: 6px; font-size: 12px;">${q.gite}</span>` : ''}
                    </div>
                    <div class="faq-actions">
                        <button class="btn-icon" data-action="modifier-question" data-question-id="${q.id}" title="Modifier" style="background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            Modifier
                        </button>
                        <button class="btn-icon" data-action="supprimer-question" data-question-id="${q.id}" title="Supprimer" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            Supprimer
                        </button>
                        <span class="faq-toggle" style="font-size: 20px; margin-left: 10px; color: #667eea;">▼</span>
                    </div>
                </div>
                <div class="faq-body">
                    <div class="faq-answer">${q.answer}</div>
                </div>
            </div>
        `;
    });
    
    window.SecurityUtils.setInnerHTML(container, html);
};

window.filtrerFAQ = function(categorie) {
    categorieFaqActive = categorie;
    
    // Mettre à jour l'UI des chips
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.category === categorie);
    });
    
    afficherFAQ();
};

window.toggleFAQ = function(id) {
    const item = document.querySelector(`.faq-item[data-id="${id}"]`);
    if (item) {
        item.classList.toggle('open');
    }
};

// ================================================================
// MODAL AJOUTER/MODIFIER
// ================================================================

window.ajouterQuestionFAQ = async function() {
    document.getElementById('modal-question-title').textContent = 'Ajouter une Question FAQ';
    document.getElementById('form-question-faq').reset();
    document.getElementById('question-id').value = '';
    
    // Charger les gîtes dynamiquement
    await chargerGitesOptions();
    
    document.getElementById('modal-question-faq').style.display = 'block';
    
    // Validation temps réel
    if (window.ValidationUtils) {
        window.ValidationUtils.attachRealtimeValidation('question-titre', 'text', { required: true });
        window.ValidationUtils.attachRealtimeValidation('question-reponse', 'text', { required: true });
    }
};

window.modifierQuestion = async function(id) {
    const question = faqData.find(q => q.id === id);
    if (!question) return;
    
    // Charger les gîtes dynamiquement
    await chargerGitesOptions();
    if (!question) return;

    document.getElementById('modal-question-title').textContent = 'Modifier la Question';
    document.getElementById('question-id').value = question.id;
    document.getElementById('question-categorie').value = question.category;
    document.getElementById('question-gite').value = question.gite_id || 'tous';
    document.getElementById('question-titre').value = question.question;
    document.getElementById('question-reponse').value = question.answer;
    document.getElementById('question-ordre').value = question.priority || 0;
    
    document.getElementById('modal-question-faq').style.display = 'block';
};

window.fermerModalQuestion = function() {
    document.getElementById('modal-question-faq').style.display = 'none';
};

window.sauvegarderQuestionFAQ = async function() {
    // Validation avec ValidationUtils
    if (window.ValidationUtils) {
        const form = document.getElementById('form-question-faq');
        const rules = {
            'question-titre': { type: 'text', required: true },
            'question-reponse': { type: 'text', required: true }
        };
        
        const validation = window.ValidationUtils.validateForm(form, rules);
        if (!validation.valid) {
            console.warn('❌ Formulaire FAQ invalide:', validation.errors);
            notifyFAQ('❌ Veuillez remplir tous les champs requis', 'error');
            return;
        }
    }
    
    const id = document.getElementById('question-id').value;
    const giteValue = document.getElementById('question-gite').value;
    
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        alert('Vous devez être connecté pour effectuer cette action');
        return;
    }
    
    const data = {
        owner_user_id: user.id,
        category: document.getElementById('question-categorie').value,
        gite_id: (giteValue && giteValue !== 'tous') ? giteValue : null,
        question: document.getElementById('question-titre').value.trim(),
        answer: document.getElementById('question-reponse').value.trim(),
        priority: parseInt(document.getElementById('question-ordre').value) || 0
    };

    if (!data.question || !data.answer) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    try {
        // 🌍 TRADUCTION AUTOMATIQUE FR → EN
        // console.log('🌍 Traduction automatique de la FAQ en anglais...');
        const [questionEn, answerEn] = await Promise.all([
            translateFAQToEnglish(data.question),
            translateFAQToEnglish(data.answer)
        ]);

        const isQuestionTranslated = questionEn && questionEn.trim().toLowerCase() !== data.question.trim().toLowerCase();
        const isAnswerTranslated = answerEn && answerEn.trim().toLowerCase() !== data.answer.trim().toLowerCase();
        
        // Ajouter les traductions au data
        data.question_en = questionEn;
        data.answer_en = answerEn;
        
        // console.log('✅ Traduction FAQ terminée:', { questionEn, answerEn });

        if (id) {
            // Mise à jour
            const { error } = await window.supabaseClient
                .from('faq')
                .update(data)
                .eq('id', id);

            if (error) throw error;
            // console.log('✅ FAQ mise à jour avec traduction EN');
        } else {
            // Création
            const { error } = await window.supabaseClient
                .from('faq')
                .insert([data]);

            if (error) throw error;
            // console.log('✅ FAQ créée avec traduction EN');
        }

        if (!isQuestionTranslated || !isAnswerTranslated) {
            notifyFAQ('⚠️ FAQ créée mais traduction EN indisponible (API), texte FR conservé', 'warning');
        }

        fermerModalQuestion();
        await chargerFAQ();
        afficherFAQ();
    } catch (error) {
        if (error?.code === '42P01' || error?.code === '42703' || error?.code === 'PGRST204') {
            console.warn('⚠️ Erreur structure FAQ:', error.message || error);
        } else {
            console.error('Erreur sauvegarde FAQ:', error);
        }
        alert('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    }
};

window.backfillFAQTranslations = async function() {
    if (faqBackfillInProgress) {
        notifyFAQ('⏳ Rétro-traduction FAQ déjà en cours', 'warning');
        return;
    }

    faqBackfillInProgress = true;
    notifyFAQ('🌍 Rétro-traduction FAQ démarrée...', 'info');

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    try {
        const { data: rows, error } = await window.supabaseClient
            .from('faq')
            .select('id, question, answer, question_en, answer_en')
            .order('created_at', { ascending: false });

        if (error) throw error;

        for (const row of (rows || [])) {
            try {
                const needsQuestion = !row.question_en || row.question_en.trim().toLowerCase() === (row.question || '').trim().toLowerCase();
                const needsAnswer = !row.answer_en || row.answer_en.trim().toLowerCase() === (row.answer || '').trim().toLowerCase();

                if (!needsQuestion && !needsAnswer) {
                    skipped += 1;
                    continue;
                }

                const payload = {};
                if (needsQuestion && row.question) {
                    payload.question_en = await translateFAQToEnglish(row.question);
                }
                if (needsAnswer && row.answer) {
                    payload.answer_en = await translateFAQToEnglish(row.answer);
                }

                if (Object.keys(payload).length === 0) {
                    skipped += 1;
                    continue;
                }

                const { error: updateError } = await window.supabaseClient
                    .from('faq')
                    .update(payload)
                    .eq('id', row.id);

                if (updateError) {
                    failed += 1;
                    continue;
                }

                updated += 1;
            } catch (innerError) {
                console.error('Erreur rétro-traduction FAQ ligne:', innerError);
                failed += 1;
            }
        }

        await chargerFAQ();
        afficherFAQ();

        notifyFAQ(`✅ FAQ rétro-traduite: ${updated} maj, ${skipped} inchangée(s), ${failed} échec(s)`, failed > 0 ? 'warning' : 'success');
    } catch (error) {
        console.error('Erreur rétro-traduction FAQ:', error);
        notifyFAQ('❌ Erreur pendant la rétro-traduction FAQ', 'error');
    } finally {
        faqBackfillInProgress = false;
    }
};

window.supprimerQuestion = async function(id) {
    if (!confirm('Supprimer cette question ?')) return;

    try {
        const { error } = await window.supabaseClient
            .from('faq')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await chargerFAQ();
        afficherFAQ();
    } catch (error) {
        console.error('Erreur suppression FAQ:', error);
        alert('Erreur lors de la suppression');
    }
};

// ================================================================
// RÉCUPÉRER LA FAQ POUR UN GÎTE (utilisé dans fiche-client.js)
// ================================================================

async function getFAQPourGite(gite) {
    await chargerFAQ();
    return faqData.filter(q => q.visible && (q.gite === 'tous' || q.gite === gite));
}

// Exposer la fonction globalement si besoin
window.getFAQPourGite = getFAQPourGite;
