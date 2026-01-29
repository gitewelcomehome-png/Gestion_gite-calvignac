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

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.AIAssistant = AIAssistant;
window.aiAssistant = new AIAssistant();
window.showAIAssistantModal = showAIAssistantModal;
