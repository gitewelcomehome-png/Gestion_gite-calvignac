// ================================================================
// GESTION FAQ - QUESTIONS FRÉQUENTES CLIENTS
// ================================================================

// Supabase est déjà disponible globalement via window.supabaseClient
// const supabase = window.supabaseClient; // Commentaire car peut causer un conflit

let faqData = [];
let categorieActive = 'all';

// ================================================================
// INITIALISATION
// ================================================================

async function initFAQ() {
    await chargerFAQ();
    afficherFAQ();
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
            .order('ordre', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        faqData = data || [];
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

    const faqFiltrees = categorieActive === 'all' 
        ? faqData 
        : faqData.filter(q => q.categorie === categorieActive);

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
                    <span class="faq-badge ${question.categorie}">${getCategorieIcon(question.categorie)}</span>
                    <h3>${question.question}</h3>
                    ${question.gite !== 'tous' ? `<span class="badge">${question.gite}</span>` : ''}
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
                <div class="faq-answer">${question.reponse}</div>
                <div class="faq-meta">
                    <span><i class="fas fa-eye"></i> ${question.visible ? 'Visible dans fiche client' : 'Masqué'}</span>
                    <span><i class="fas fa-sort-numeric-down"></i> Ordre: ${question.ordre}</span>
                </div>
            </div>
        </div>
    `).join(''));
}

function getCategorieIcon(categorie) {
    const icons = {
        arrivee: '🔑',
        depart: '🚪',
        autre: 'ℹ️'
    };
    return icons[categorie] || 'ℹ️';
}

// ================================================================
// FILTRAGE ET RECHERCHE
// ================================================================

window.filtrerFAQ = function(categorie) {
    categorieActive = categorie;
    
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
        const reponseMatch = q.reponse.toLowerCase().includes(termeNormalisé);
        return questionMatch || reponseMatch;
    });
    
    // Afficher résultats
    if (faqFiltrees.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; padding: 40px; color: #999;">Aucun résultat trouvé pour "' + terme + '"</p>');
        return;
    }
    
    let html = '';
    faqFiltrees.forEach(q => {
        html += `
            <div class="faq-item" data-id="${q.id}">
                <div class="faq-header" data-action="toggle-faq" data-question-id="${q.id}">
                    <div class="faq-question">
                        <span class="faq-badge ${q.categorie}">${getCategorieIcon(q.categorie)} ${q.categorie}</span>
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
                    <div class="faq-answer">${q.reponse}</div>
                </div>
            </div>
        `;
    });
    
    window.SecurityUtils.setInnerHTML(container, html);
};

window.filtrerFAQ = function(categorie) {
    categorieActive = categorie;
    
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

window.ajouterQuestionFAQ = function() {
    document.getElementById('modal-question-title').textContent = 'Ajouter une Question FAQ';
    document.getElementById('form-question-faq').reset();
    document.getElementById('question-id').value = '';
    document.getElementById('question-visible').checked = true;
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

    document.getElementById('modal-question-title').textContent = 'Modifier la Question';
    document.getElementById('question-id').value = question.id;
    document.getElementById('question-categorie').value = question.categorie;
    document.getElementById('question-gite').value = question.gite || 'tous';
    document.getElementById('question-titre').value = question.question;
    document.getElementById('question-reponse').value = question.reponse;
    document.getElementById('question-visible').checked = question.visible;
    document.getElementById('question-ordre').value = question.ordre || 0;
    
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
            showNotification('❌ Veuillez remplir tous les champs requis', 'error');
            return;
        }
    }
    
    const id = document.getElementById('question-id').value;
    const data = {
        categorie: document.getElementById('question-categorie').value,
        gite: document.getElementById('question-gite').value,
        question: document.getElementById('question-titre').value.trim(),
        reponse: document.getElementById('question-reponse').value.trim(),
        visible: document.getElementById('question-visible').checked,
        ordre: parseInt(document.getElementById('question-ordre').value) || 0
    };

    if (!data.question || !data.reponse) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    try {
        if (id) {
            // Mise à jour
            const { error } = await window.supabaseClient
                .from('faq')
                .update(data)
                .eq('id', id);

            if (error) throw error;
        } else {
            // Création
            const { error } = await window.supabaseClient
                .from('faq')
                .insert([data]);

            if (error) throw error;
        }

        fermerModalQuestion();
        await chargerFAQ();
        afficherFAQ();
    } catch (error) {
        console.error('Erreur sauvegarde FAQ:', error);
        alert('Erreur lors de la sauvegarde');
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
// EXPORT HTML POUR FICHE CLIENT
// ================================================================

window.exporterFAQHTML = function() {
    const faqVisibles = faqData.filter(q => q.visible);
    
    if (faqVisibles.length === 0) {
        alert('Aucune question visible à exporter');
        return;
    }

    // Grouper par catégorie
    const parCategorie = {};
    faqVisibles.forEach(q => {
        if (!parCategorie[q.categorie]) {
            parCategorie[q.categorie] = [];
        }
        parCategorie[q.categorie].push(q);
    });

    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FAQ - Welcome Home</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
        }
        .categorie {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .categorie-titre {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .faq-item {
            margin-bottom: 20px;
        }
        .question {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        .reponse {
            color: #555;
            padding-left: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>❓ Questions Fréquentes</h1>
        <p>Welcome Home - Gîtes Trevoux & Calvignac</p>
    </div>
`;

    const categoriesOrdre = ['arrivee', 'depart', 'equipements', 'localisation', 'tarifs', 'reglement', 'autre'];
    const categoriesTitres = {
        arrivee: '🔑 Arrivée',
        depart: '🚪 Départ',
        equipements: '🏠 Équipements',
        localisation: '📍 Localisation',
        tarifs: '💰 Tarifs',
        reglement: '📋 Règlement',
        autre: 'ℹ️ Informations Générales'
    };

    categoriesOrdre.forEach(cat => {
        if (parCategorie[cat] && parCategorie[cat].length > 0) {
            html += `
    <div class="categorie">
        <div class="categorie-titre">${categoriesTitres[cat]}</div>
`;
            parCategorie[cat].forEach(q => {
                html += `
        <div class="faq-item">
            <div class="question">❔ ${q.question}</div>
            <div class="reponse">${q.reponse}</div>
        </div>
`;
            });
            html += `    </div>\n`;
        }
    });

    html += `
    <div class="footer">
        <p>Pour toute autre question, n'hésitez pas à nous contacter !</p>
        <p><strong>Welcome Home</strong> - Votre séjour en toute sérénité</p>
    </div>
</body>
</html>
`;

    // Télécharger le fichier
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faq-welcome-home.html';
    a.click();
    URL.revokeObjectURL(url);
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
