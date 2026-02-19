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
        this.apiAvailable = null;
        this.apiUnavailableReason = '';
        this.lastAvailabilityCheckAt = 0;
        this.maxFieldsPerBatch = 6;
        this.maxCharsPerField = 1800;
        this.stylePresets = {
            utility: 'Priorité utilité immédiate: infos actionnables, phrases claires, zéro blabla.',
            premium: 'Priorité expérience premium: ton haut de gamme, fluide, accueillant et rassurant.',
            ultra_clear: 'Priorité ultra clarté: phrases courtes, structure explicite, lecture très rapide.'
        };
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

    async checkApiAvailability(force = false) {
        const now = Date.now();
        if (!force && this.apiAvailable !== null && (now - this.lastAvailabilityCheckAt) < 60000) {
            return this.apiAvailable;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}?health=1`, {
                method: 'GET',
                cache: 'no-store'
            });

            if (!response.ok) {
                this.apiAvailable = false;
                this.apiUnavailableReason = 'Service IA temporairement indisponible';
                this.lastAvailabilityCheckAt = now;
                return false;
            }

            const data = await response.json().catch(() => ({}));
            this.apiAvailable = Boolean(data.available);
            this.apiUnavailableReason = this.apiAvailable
                ? ''
                : 'API OpenAI non configurée. Ajoute OPENAI_API_KEY sur Vercel.';
            this.lastAvailabilityCheckAt = now;
            return this.apiAvailable;
        } catch (error) {
            this.apiAvailable = false;
            this.apiUnavailableReason = 'Impossible de joindre le service IA';
            this.lastAvailabilityCheckAt = now;
            return false;
        }
    }

    getAvailabilityMessage() {
        return this.apiUnavailableReason || 'Service IA indisponible';
    }

    sanitizeFieldContent(content) {
        const normalized = String(content || '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\t/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        if (normalized.length <= this.maxCharsPerField) {
            return normalized;
        }

        return `${normalized.slice(0, this.maxCharsPerField)}…`;
    }

    getFieldHint(field) {
        const key = `${field.id} ${field.label}`.toLowerCase();

        if (key.includes('cle') || key.includes('badge') || key.includes('code')) {
            return 'Rédige des étapes claires et actionnables, sans perdre les codes ni l’ordre des actions.';
        }
        if (key.includes('linge') || key.includes('drap') || key.includes('serviette')) {
            return 'Structure en paragraphe pratique: ce qui est fourni, quantité/qualité, et ce que le client doit prévoir.';
        }
        if (key.includes('equip') || key.includes('cuisine') || key.includes('materiel')) {
            return 'Valorise les équipements avec phrases complètes et utiles pour le séjour.';
        }
        if (key.includes('parking') || key.includes('arrivee') || key.includes('depart')) {
            return 'Donne des consignes logistiques très claires (où aller, quoi faire, dans quel ordre).';
        }

        return 'Améliore la clarté, la fluidité et le ton, sans ajouter d’informations inventées.';
    }

    getStylePresetInstruction(stylePreset) {
        return this.stylePresets[stylePreset] || this.stylePresets.utility;
    }

    buildBatchPrompt(fields, tone, stylePreset = 'utility') {
        const toneDescriptions = {
            professional: 'un ton professionnel et formel',
            warm: 'un ton chaleureux et accueillant',
            concise: 'un style concis et direct',
            descriptive: 'un style détaillé et descriptif'
        };

        const fieldsList = fields.map((f, i) => {
            const safeContent = this.sanitizeFieldContent(f.content)
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, ' ');

            return `${i + 1}. [id=${f.id}] [label=${f.label}] [hint=${this.getFieldHint(f)}]\nTexte: "${safeContent}"`;
        }).join('\n\n');

        return `Tu dois reformuler les textes suivants avec ${toneDescriptions[tone] || toneDescriptions.warm}.
    Style cible : ${this.getStylePresetInstruction(stylePreset)}

RÈGLES STRICTES :
- Ne jamais inventer d'informations
- Conserver tous les faits (codes, horaires, noms, adresses, chiffres)
- Corriger orthographe/grammaire
- Rendre le texte clair, utile et agréable à lire
- Pour les consignes, privilégier des phrases actionnables et ordonnées

TEXTES :
${fieldsList}

Réponds UNIQUEMENT en JSON valide au format :
{
  "fields": [
    { "index": 1, "improved": "texte reformulé" }
  ]
}`;
    }

    parseImprovementResponse(response) {
        let cleanResponse = String(response || '').trim();

        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\n?/g, '').replace(/```\n?$/g, '');
        }

        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanResponse = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanResponse);
        if (!parsed.fields || !Array.isArray(parsed.fields)) {
            throw new Error('La propriété "fields" est manquante ou invalide');
        }

        return parsed.fields;
    }

    /**
     * Méthode conservée pour compatibilité mais non utilisée
     */
    setApiKey(key) {
        // console.log('ℹ️ L\'API est maintenant gérée côté serveur');
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

        const available = await this.checkApiAvailability();
        if (!available) {
            throw new Error(this.getAvailabilityMessage());
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
                const error = await response.json().catch(() => ({}));
                if (error.code === 'OPENAI_NOT_CONFIGURED') {
                    this.apiAvailable = false;
                    this.apiUnavailableReason = 'API OpenAI non configurée. Ajoute OPENAI_API_KEY sur Vercel.';
                }
                throw new Error(error.error || 'Erreur lors de l\'appel à l\'API');
            }

            const data = await response.json();
            const content = data.content?.trim();

            if (!content) {
                throw new Error('Aucun contenu généré');
            }

            return content;

        } catch (error) {
            if ((error?.message || '').includes('non configurée')) {
                console.warn('⚠️ IA indisponible: configuration OpenAI manquante');
            } else {
                console.error('❌ Erreur génération IA:', error);
            }
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

function isAIConfigMissingError(error) {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('openai') && (message.includes('non configurée') || message.includes('not configured'));
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

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Mode de rendu</label>
                <select id="aiSingleStylePreset" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem;">
                    <option value="utility" selected>⚡ Ultra utile (recommandé)</option>
                    <option value="premium">✨ Premium hospitalité</option>
                    <option value="ultra_clear">🧼 Ultra clair et direct</option>
                </select>
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
        const stylePreset = document.getElementById('aiSingleStylePreset')?.value || 'utility';
        if (!keywords) {
            alert('❌ Veuillez entrer des mots-clés');
            return;
        }

        const btn = document.getElementById('btnGenerateAI');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span style="font-size: 1.2rem;">⏳</span> Génération...';

        try {
            const apiReady = await assistant.checkApiAvailability();
            if (!apiReady) {
                throw new Error(assistant.getAvailabilityMessage());
            }

            let generatedText;

            switch (fieldType) {
                case 'keys':
                    generatedText = await assistant.generateKeyInstructions(`${keywords}\n\nStyle souhaité: ${assistant.getStylePresetInstruction(stylePreset)}`);
                    break;
                case 'linen':
                    generatedText = await assistant.generateLinenDescription(`${keywords}\n\nStyle souhaité: ${assistant.getStylePresetInstruction(stylePreset)}`);
                    break;
                case 'equipment':
                    generatedText = await assistant.generateEquipmentDescription(`${keywords}\n\nStyle souhaité: ${assistant.getStylePresetInstruction(stylePreset)}`);
                    break;
                case 'instructions':
                    generatedText = await assistant.generateInstructions(`${keywords}\n\nStyle souhaité: ${assistant.getStylePresetInstruction(stylePreset)}`);
                    break;
                default:
                    generatedText = await assistant.generateContent(`Génère un texte professionnel pour un gîte à partir de : "${keywords}".\n\nStyle souhaité: ${assistant.getStylePresetInstruction(stylePreset)}`);
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
            if (isAIConfigMissingError(error)) {
                console.warn('⚠️ IA indisponible: OPENAI_API_KEY manquante sur Vercel');
                if (window.showNotification) {
                    window.showNotification('⚠️ IA indisponible : ajoute OPENAI_API_KEY sur Vercel', 'warning');
                }
            } else {
                console.error('❌ Erreur génération:', error);
            }
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
    
    // Vérifier qu'un gîte est sélectionné
    const currentGite = window.currentGiteInfos || 'Trévoux';
    // console.log('🏠 Amélioration IA pour le gîte:', currentGite);
    
    // Récupérer TOUS les champs input et textarea du formulaire
    // SAUF ceux de type contact, téléphone, email, adresse, GPS, numéros
    const form = document.getElementById('infosGiteForm');
    if (!form) {
        alert('❌ Formulaire introuvable');
        return;
    }

    const excludedIds = [
        'infos_adresse',
        'infos_telephone',
        'infos_telephoneEN',
        'infos_gpsLat',
        'infos_gpsLon',
        'infos_email',
        'infos_numeroSiren',
        'infos_numeroRegistreCommerce'
    ];

    const fieldsToImprove = [];
    
    // Récupérer tous les inputs et textareas
    const allInputs = form.querySelectorAll('input[type="text"], textarea');
    allInputs.forEach(input => {
        if (!excludedIds.includes(input.id) && input.id && input.value.trim().length > 0) {
            // Trouver le label associé
            const label = form.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() || 
                          input.previousElementSibling?.textContent?.trim() || 
                          input.id;
            
            fieldsToImprove.push({
                id: input.id,
                label: label.replace('*', '').trim(),
                content: input.value.trim()
            });
        }
    });

    if (fieldsToImprove.length === 0) {
        alert('Aucun champ texte à améliorer. Veuillez d\'abord remplir quelques champs.');
        return;
    }

    // console.log(`📊 ${fieldsToImprove.length} champs trouvés pour le gîte ${currentGite}`);

    // Afficher modal de progression
    showImprovementModal(fieldsToImprove, tone, currentGite);
}

/**
 * Modal de sélection du ton et progression
 */
function showImprovementModal(fields, defaultTone, giteName) {
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
                L'IA va reformuler <strong>${fields.length} champ(s)</strong> pour le gîte <strong style="color: #3498db;">${giteName}</strong>.
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

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #34495e;">
                    Mode IA :
                </label>
                <select id="stylePresetSelector" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                ">
                    <option value="utility" selected>⚡ Ultra utile (terrain)</option>
                    <option value="premium">✨ Premium hospitalité</option>
                    <option value="ultra_clear">🧼 Ultra clair (lecture rapide)</option>
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

            <div style="margin-top: 14px; font-size: 0.85rem; color: #7f8c8d;">
                💡 Après amélioration, un bouton permettra de restaurer la version précédente.
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Gestion des événements
    document.getElementById('btnStartImprovement').onclick = async () => {
        const selectedTone = document.getElementById('toneSelector').value;
        const selectedStylePreset = document.getElementById('stylePresetSelector')?.value || 'utility';
        await processAllFields(fields, selectedTone, modal, selectedStylePreset);
    };

    document.getElementById('btnCancelImprovement').onclick = () => modal.remove();
}

/**
 * Traiter tous les champs en un seul appel API
 */
async function processAllFields(fields, tone, modal, stylePreset = 'utility') {
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
        const apiReady = await assistant.checkApiAvailability();
        if (!apiReady) {
            throw new Error(assistant.getAvailabilityMessage());
        }

        const totalBatches = Math.ceil(fields.length / assistant.maxFieldsPerBatch);
        let processedBatches = 0;
        let failedBatches = 0;
        const allImprovements = [];

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
            const start = batchIndex * assistant.maxFieldsPerBatch;
            const batch = fields.slice(start, start + assistant.maxFieldsPerBatch);

            progressText.textContent = `Génération IA lot ${batchIndex + 1}/${totalBatches}...`;
            progressBar.style.width = `${30 + Math.round((batchIndex / Math.max(totalBatches, 1)) * 50)}%`;

            try {
                const prompt = assistant.buildBatchPrompt(batch, tone, stylePreset);
                const estimatedTokens = Math.max(1200, batch.length * 220);
                const response = await assistant.generateContent(prompt, estimatedTokens);
                const improvedFields = assistant.parseImprovementResponse(response);

                improvedFields.forEach((improved) => {
                    const localField = batch[Number(improved.index) - 1];
                    if (!localField || !improved?.improved) return;
                    allImprovements.push({
                        id: localField.id,
                        improved: String(improved.improved).trim()
                    });
                });

                processedBatches += 1;
            } catch (batchError) {
                failedBatches += 1;
                console.warn(`⚠️ Lot IA ${batchIndex + 1} non traité:`, batchError?.message || batchError);
            }
        }

        if (allImprovements.length === 0) {
            throw new Error('Aucun lot IA n\'a pu être traité. Réessaie dans quelques secondes.');
        }

        progressText.textContent = 'Application des modifications...';
        progressBar.style.width = '90%';

        const backup = [];
        let updatedCount = 0;

        allImprovements.forEach((item) => {
            const element = document.getElementById(item.id);
            if (!element) return;

            backup.push({ id: item.id, value: element.value });
            element.value = item.improved;

            element.style.transition = 'background-color 0.3s';
            element.style.backgroundColor = '#ffebee';
            element.style.borderColor = '#e74c3c';

            const removeRedBackground = () => {
                element.style.backgroundColor = '';
                element.style.borderColor = '';
                element.removeEventListener('focus', removeRedBackground);
                element.removeEventListener('click', removeRedBackground);
            };

            element.addEventListener('focus', removeRedBackground);
            element.addEventListener('click', removeRedBackground);

            updatedCount += 1;
        });

        window.__aiLastImprovementBackup = backup;

        progressBar.style.width = '100%';
        progressText.textContent = `✅ ${updatedCount} champ(s) amélioré(s) (${processedBatches} lot(s) OK${failedBatches > 0 ? `, ${failedBatches} lot(s) en échec` : ''})`;
        progressText.style.color = '#27ae60';
        progressText.style.fontWeight = '600';

        if (window.showNotification) {
            window.showNotification('✅ IA appliquée. Vous pouvez annuler via restoreLastAIImprovement()', 'success');
        }

        const btnCancel = document.getElementById('btnCancelImprovement');
        if (btnCancel) {
            btnCancel.textContent = 'Fermer';
        }

        btnStart.disabled = false;
        btnStart.style.opacity = '1';
        btnStart.textContent = '↩️ Restaurer la version précédente';
        btnStart.onclick = () => {
            window.restoreLastAIImprovement();
            modal.remove();
        };

    } catch (error) {
        if (isAIConfigMissingError(error)) {
            console.warn('⚠️ IA indisponible: OPENAI_API_KEY manquante sur Vercel');
            if (window.showNotification) {
                window.showNotification('⚠️ IA indisponible : ajoute OPENAI_API_KEY sur Vercel', 'warning');
            }
        } else {
            console.error('❌ Erreur amélioration:', error);
        }
        progressText.textContent = `❌ Erreur : ${error.message}`;
        progressText.style.color = '#e74c3c';
        btnStart.disabled = false;
        btnStart.style.opacity = '1';
    }
}

window.restoreLastAIImprovement = function() {
    const backup = window.__aiLastImprovementBackup;
    if (!Array.isArray(backup) || backup.length === 0) {
        if (window.showNotification) {
            window.showNotification('ℹ️ Aucune amélioration IA à restaurer', 'info');
        }
        return;
    }

    backup.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
            element.value = item.value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    if (window.showNotification) {
        window.showNotification(`↩️ ${backup.length} champ(s) restauré(s)`, 'success');
    }

    window.__aiLastImprovementBackup = [];
};

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.AIAssistant = AIAssistant;
window.aiAssistant = new AIAssistant();
window.showAIAssistantModal = showAIAssistantModal;
window.improveAllTexts = improveAllTexts;

// console.log('✅ AI Assistant chargé - improveAllTexts disponible:', typeof window.improveAllTexts);
