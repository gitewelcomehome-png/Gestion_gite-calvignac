/**
 * ============================================================================
 * AI ASSISTANT - Génération automatique de contenu pour formulaires
 * ============================================================================
 * 
 * Utilise l'API OpenAI pour générer automatiquement du contenu descriptif
 * à partir de quelques mots-clés fournis par l'utilisateur.
 * 
 * Date : 28 Janvier 2026
 * ============================================================================
 */

class AIAssistant {
    constructor() {
        this.apiEndpoint = '/api/openai';
        this.model = 'gpt-4o-mini'; // Modèle économique et rapide
        this.isGenerating = false;
        this.tones = {
            professional: 'professionnel et formel',
            warm: 'chaleureux et accueillant',
            concise: 'concis et direct',
            descriptive: 'détaillé et descriptif'
        };
        this.currentTone = 'warm'; // Ton par défaut
    }

    /**
     * L'API est toujours disponible (gérée côté serveur)
     */
    hasApiKey() {
        return true;
    }

    /**
     * Méthode conservée pour compatibilité mais non utilisée
     */
    setApiKey(key) {
        console.log('ℹ️ L\'API est maintenant gérée côté serveur');
    }

    /**
     * Afficher modal informatif (l'API est gérée côté serveur)
     */
    showApiKeyModal() {
        const existingModal = document.getElementById('aiApiKeyModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'aiApiKeyModal';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        window.SecurityUtils.setInnerHTML(modal, `
            <div style="background: var(--card); border-radius: 16px; padding: 30px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">🤖</div>
                    <h2 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 1.4rem;">Assistant IA</h2>
                    <p style="color: #7f8c8d; margin: 0; font-size: 0.95rem;">✅ Configuration automatique</p>
                </div>
                
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px; color: #155724;">
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">✨</div>
                    <strong>L'IA est prête à l'emploi !</strong>
                    <p style="margin: 10px 0 0 0; font-size: 0.9rem;">
                        Aucune configuration nécessaire de votre part.<br>
                        Cliquez simplement sur les boutons ✨ à côté des champs de formulaire.
                    </p>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 0.85rem; color: #495057;">
                    <strong>💡 Comment ça marche :</strong><br>
                    • Entrez quelques mots-clés (ex: "boîte à clés code 1234")<br>
                    • L'IA génère un texte complet et structuré<br>
                    • Vous pouvez modifier le résultat à votre guise<br>
                    • Coût : environ 0,15€ pour 1000 générations
                </div>
                
                <button id="btnCancelApiKey" 
                            style="width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                        J'ai compris
                    </button>
            </div>
        `);

        document.body.appendChild(modal);

        document.getElementById('btnCancelApiKey').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    /**
     * Générer du contenu via l'API serveur (qui appelle OpenAI)
     */
    async generateContent(prompt, maxTokens = 500) {
        if (this.isGenerating) {
            throw new Error('Une génération est déjà en cours...');
        }

        this.isGenerating = true;

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    maxTokens: maxTokens,
                    model: this.model
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de l\'appel à l\'API');
            }

            const data = await response.json();
            const content = data.content?.trim();

            if (!content) {
                throw new Error('Aucun contenu généré');
            }

            return content;

        } catch (error) {
            console.error('❌ Erreur génération IA:', error);
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Générer instructions détaillées pour récupérer les clés
     */
    async generateKeyInstructions(keywords) {
        const prompt = `Génère des instructions détaillées et numérotées pour récupérer les clés d'un gîte à partir de ces indications : "${keywords}".

Utilise un format clair avec des étapes numérotées (1. 2. 3...).
Sois précis sur les emplacements et les actions à effectuer.
Maximum 8 étapes.`;

        return await this.generateContent(prompt, 400);
    }

    /**
     * Générer description du linge fourni
     */
    async generateLinenDescription(keywords) {
        const prompt = `Génère une description complète du linge de maison fourni dans un gîte à partir de ces indications : "${keywords}".

Format avec des tirets (-)
Inclure : draps, serviettes, torchons
Préciser si les lits sont faits
Sois concis et professionnel.`;

        return await this.generateContent(prompt, 300);
    }

    /**
     * Générer description d'équipements
     */
    async generateEquipmentDescription(keywords) {
        const prompt = `Génère une description des équipements disponibles dans un gîte à partir de ces mots-clés : "${keywords}".

Format avec des tirets (-)
Liste les équipements de manière claire
Précise les emplacements si pertinent
Maximum 10 lignes.`;

        return await this.generateContent(prompt, 350);
    }

    /**
     * Générer consignes (tri, urgence, etc.)
     */
    async generateInstructions(keywords) {
        const prompt = `Génère des consignes claires pour un gîte à partir de ces indications : "${keywords}".

Format avec des étapes numérotées ou des tirets
Sois précis et concis
Ton professionnel mais accueillant.`;

        return await this.generateContent(prompt, 300);
    }
}

/**
 * Afficher le modal d'assistant IA avec champ de saisie
 */
function showAIAssistantModal(targetFieldId, fieldType = 'general') {
    const assistant = window.aiAssistant || new AIAssistant();

    if (!assistant.hasApiKey()) {
        assistant.showApiKeyModal();
        return;
    }

    const existingModal = document.getElementById('aiAssistantModal');
    if (existingModal) existingModal.remove();

    const fieldLabels = {
        'keys': 'Instructions pour récupérer les clés',
        'linen': 'Description du linge fourni',
        'equipment': 'Description des équipements',
        'instructions': 'Consignes et instructions',
        'general': 'Contenu personnalisé'
    };

    const placeholders = {
        'keys': 'Ex: boîte à clés code 1234 devant la porte',
        'linen': 'Ex: draps, serviettes, torchons fournis',
        'equipment': 'Ex: lave-vaisselle, four, micro-ondes, cafetière',
        'instructions': 'Ex: tri des déchets, règlement intérieur',
        'general': 'Décrivez ce que vous voulez générer...'
    };

    const modal = document.createElement('div');
    modal.id = 'aiAssistantModal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    window.SecurityUtils.setInnerHTML(modal, `
        <div style="background: var(--card); border-radius: 16px; padding: 30px; max-width: 550px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">✨</div>
                <h2 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 1.4rem;">Assistant IA</h2>
                <p style="color: #7f8c8d; margin: 0; font-size: 0.95rem;">${fieldLabels[fieldType]}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Mots-clés / Indications</label>
                <textarea id="aiKeywordsInput" 
                          style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; resize: vertical; font-family: inherit;"
                          rows="3"
                          placeholder="${placeholders[fieldType]}"></textarea>
                <small style="color: #7f8c8d; font-size: 0.85rem; display: block; margin-top: 6px;">
                    💡 Entrez quelques mots-clés, l'IA va générer un texte complet
                </small>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="btnGenerateAI" 
                        style="flex: 1; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">✨</span> Générer
                </button>
                <button id="btnCancelAI" 
                        style="padding: 14px 20px; background: #f5f5f5; color: #2c3e50; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                    Annuler
                </button>
            </div>
        </div>
    `);

    document.body.appendChild(modal);

    // Événements
    document.getElementById('btnGenerateAI').onclick = async () => {
        const keywords = document.getElementById('aiKeywordsInput').value.trim();
        if (!keywords) {
            alert('❌ Veuillez entrer des mots-clés');
            return;
        }

        const btn = document.getElementById('btnGenerateAI');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span style="font-size: 1.2rem;">⏳</span> Génération...';

        try {
            let generatedText;

            switch (fieldType) {
                case 'keys':
                    generatedText = await assistant.generateKeyInstructions(keywords);
                    break;
                case 'linen':
                    generatedText = await assistant.generateLinenDescription(keywords);
                    break;
                case 'equipment':
                    generatedText = await assistant.generateEquipmentDescription(keywords);
                    break;
                case 'instructions':
                    generatedText = await assistant.generateInstructions(keywords);
                    break;
                default:
                    generatedText = await assistant.generateContent(`Génère un texte professionnel pour un gîte à partir de : "${keywords}".`);
            }

            // Remplir le champ cible
            const targetField = document.getElementById(targetFieldId);
            if (targetField) {
                targetField.value = generatedText;
                // Déclencher l'événement input pour les listeners
                targetField.dispatchEvent(new Event('input', { bubbles: true }));
            }

            if (window.showToast) {
                window.showToast('✅ Texte généré avec succès !', 'success');
            }

            modal.remove();

        } catch (error) {
            console.error('❌ Erreur génération:', error);
            alert('❌ Erreur : ' + error.message);
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    document.getElementById('btnCancelAI').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    // Focus sur le champ
    setTimeout(() => {
        document.getElementById('aiKeywordsInput').focus();
    }, 100);
}

/**
 * Améliorer tous les textes du formulaire en un seul appel
 */
async function improveAllTexts(tone = 'warm') {
    const assistant = window.aiAssistant;
    
    // Liste des champs à améliorer
    const fieldsToImprove = [
        { id: 'infos_instructionsCles', label: 'Instructions récupération clés' },
        { id: 'infos_lingeFourni', label: 'Linge fourni' },
        { id: 'infos_instructionsLaveLinge', label: 'Instructions lave-linge' },
        { id: 'infos_configurationChambres', label: 'Configuration chambres' },
        { id: 'infos_instructionsCheminee', label: 'Instructions cheminée' },
        { id: 'infos_instructionsChauffage', label: 'Instructions chauffage' },
        { id: 'infos_instructionsPoubelles', label: 'Instructions poubelles' },
        { id: 'infos_itineraireLogement', label: 'Itinéraire logement' },
        { id: 'infos_premiereVisite', label: 'Première visite' },
        { id: 'infos_coupureEau', label: 'Coupure d'eau' }
    ];

    // Récupérer les champs avec contenu
    const fieldsWithContent = fieldsToImprove
        .map(field => ({
            ...field,
            content: document.getElementById(field.id)?.value?.trim() || ''
        }))
        .filter(field => field.content.length > 0);

    if (fieldsWithContent.length === 0) {
        alert('Aucun champ texte à améliorer. Veuillez d\'abord remplir quelques champs.');
        return;
    }

    // Afficher modal de progression
    showImprovementModal(fieldsWithContent, tone);
}

/**
 * Modal de sélection du ton et progression
 */
function showImprovementModal(fields, defaultTone) {
    const modal = document.createElement('div');
    modal.id = 'aiImprovementModal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 1.5rem;">
                ✨ Amélioration automatique des textes
            </h3>

            <p style="margin-bottom: 20px; color: #7f8c8d;">
                L'IA va reformuler <strong>${fields.length} champ(s)</strong> pour les rendre plus professionnels.
            </p>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #34495e;">
                    Choisissez le ton :
                </label>
                <select id="toneSelector" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                ">
                    <option value="warm" selected>🏡 Chaleureux et accueillant</option>
                    <option value="professional">💼 Professionnel et formel</option>
                    <option value="concise">⚡ Concis et direct</option>
                    <option value="descriptive">📝 Détaillé et descriptif</option>
                </select>
            </div>

            <div id="progressContainer" style="display: none; margin: 20px 0;">
                <div style="
                    background: #ecf0f1;
                    height: 8px;
                    border-radius: 4px;
                    overflow: hidden;
                ">
                    <div id="progressBar" style="
                        background: linear-gradient(90deg, #3498db, #2ecc71);
                        height: 100%;
                        width: 0%;
                        transition: width 0.3s;
                    "></div>
                </div>
                <p id="progressText" style="margin-top: 10px; text-align: center; color: #7f8c8d; font-size: 0.9rem;">
                    Préparation...
                </p>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="btnStartImprovement" style="
                    flex: 1;
                    padding: 14px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    ✨ Améliorer tous les textes
                </button>
                <button id="btnCancelImprovement" style="
                    padding: 14px 24px;
                    background: #ecf0f1;
                    color: #7f8c8d;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                ">
                    Annuler
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Gestion des événements
    document.getElementById('btnStartImprovement').onclick = async () => {
        const selectedTone = document.getElementById('toneSelector').value;
        await processAllFields(fields, selectedTone, modal);
    };

    document.getElementById('btnCancelImprovement').onclick = () => modal.remove();
}

/**
 * Traiter tous les champs en un seul appel API
 */
async function processAllFields(fields, tone, modal) {
    const assistant = window.aiAssistant;
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const btnStart = document.getElementById('btnStartImprovement');

    // Afficher la progression
    progressContainer.style.display = 'block';
    btnStart.disabled = true;
    btnStart.style.opacity = '0.5';
    progressText.textContent = 'Envoi de la requête à l\'IA...';
    progressBar.style.width = '30%';

    try {
        // Préparer le prompt avec tous les champs
        const fieldsList = fields.map((f, i) => 
            `${i + 1}. **${f.label}** :\n${f.content}`
        ).join('\n\n');

        const toneDescriptions = {
            professional: 'un ton professionnel et formel',
            warm: 'un ton chaleureux et accueillant',
            concise: 'un style concis et direct',
            descriptive: 'un style détaillé et descriptif'
        };

        const prompt = `Tu dois reformuler les textes suivants avec ${toneDescriptions[tone]}.

RÈGLES IMPORTANTES :
- NE PAS inventer d'informations
- SEULEMENT reformuler ce qui est écrit
- Garder TOUS les détails (codes, horaires, noms, etc.)
- Améliorer la clarté et la structure
- Corriger l'orthographe et la grammaire
- Rester fidèle au contenu original

TEXTES À REFORMULER :

${fieldsList}

Réponds UNIQUEMENT en JSON avec ce format exact :
{
  "fields": [
    { "index": 1, "improved": "texte reformulé" },
    { "index": 2, "improved": "texte reformulé" }
  ]
}`;

        progressText.textContent = 'Génération des textes améliorés...';
        progressBar.style.width = '60%';

        // Appel API
        const response = await assistant.generateContent(prompt, 2000);
        
        progressText.textContent = 'Application des modifications...';
        progressBar.style.width = '90%';

        // Parser la réponse JSON
        let improvedFields;
        try {
            // Nettoyer la réponse si elle contient des balises de code
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            }
            const parsed = JSON.parse(cleanResponse);
            improvedFields = parsed.fields;
        } catch (e) {
            console.error('Erreur parsing JSON:', e);
            throw new Error('Format de réponse invalide de l\'IA');
        }

        // Appliquer les textes améliorés aux champs
        let updatedCount = 0;
        improvedFields.forEach(improved => {
            const field = fields[improved.index - 1];
            if (field && improved.improved) {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = improved.improved;
                    // Animation visuelle
                    element.style.transition = 'background-color 0.5s';
                    element.style.backgroundColor = '#d4edda';
                    setTimeout(() => {
                        element.style.backgroundColor = '';
                    }, 2000);
                    updatedCount++;
                }
            }
        });

        progressBar.style.width = '100%';
        progressText.textContent = `✅ ${updatedCount} champ(s) amélioré(s) avec succès !`;
        progressText.style.color = '#27ae60';
        progressText.style.fontWeight = '600';

        // Fermer après 2 secondes
        setTimeout(() => {
            modal.remove();
        }, 2000);

    } catch (error) {
        console.error('❌ Erreur amélioration:', error);
        progressText.textContent = `❌ Erreur : ${error.message}`;
        progressText.style.color = '#e74c3c';
        btnStart.disabled = false;
        btnStart.style.opacity = '1';
    }
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.AIAssistant = AIAssistant;
window.aiAssistant = new AIAssistant();
window.showAIAssistantModal = showAIAssistantModal;
window.improveAllTexts = improveAllTexts;
