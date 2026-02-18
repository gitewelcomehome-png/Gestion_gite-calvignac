// ================================================================
// 🤖 MODULE IA SUPPORT - Analyse & Résolution Automatique
// ================================================================

const SUPPORT_AI_ENDPOINT = '/api/support-ai';

async function requestSupportAI({ prompt, systemPrompt, model = 'gpt-4o-mini', maxTokens = 500, temperature = 0.3 }) {
    const response = await fetch(SUPPORT_AI_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt,
            systemPrompt,
            model,
            maxTokens,
            temperature,
            source: 'client-support'
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur API Support IA');
    }

    const data = await response.json();
    if (!data?.content) {
        throw new Error('Réponse IA vide');
    }

    return data.content;
}

function parseJsonFromAiResponse(rawContent) {
    let content = String(rawContent || '').trim();

    if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }

    try {
        return JSON.parse(content);
    } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON IA invalide');
        return JSON.parse(jsonMatch[0]);
    }
}

// ================================================================
// 🔍 ANALYSE TICKET & MATCHING SOLUTION
// ================================================================
async function analyzeTicketAndMatch(ticketId, sujet, description, categorie) {
    try {
        // console.log('🤖 Analyse IA du ticket...', ticketId);
        
        // 1. Récupérer toutes les solutions de la base
        const { data: solutions, error: solutionsError } = await window.supabaseClient
            .from('cm_support_solutions')
            .select('*')
            .eq('categorie', categorie)
            .order('efficacite_score', { ascending: false });
        
        if (solutionsError) throw solutionsError;
        
        if (!solutions || solutions.length === 0) {
            // console.log('📭 Aucune solution connue pour cette catégorie');
            return await startGuidedDiagnostic(ticketId, sujet, description, categorie);
        }
        
        // 2. Matching sémantique IA
        const matchResult = await findBestMatch(sujet, description, solutions);
        
        // 3. Créer diagnostic
        const { data: diagnostic, error: diagError } = await window.supabaseClient
            .from('cm_support_diagnostics')
            .insert([{
                ticket_id: ticketId,
                solution_matched_id: matchResult.solution?.id || null,
                confidence_score: matchResult.confidence,
                contexte_collecte: collectTechnicalContext()
            }])
            .select()
            .single();
        
        if (diagError) throw diagError;
        
        // 4. Décider action selon confiance
        if (matchResult.confidence >= 0.8) {
            // Auto-résolution : Confiance élevée
            // console.log('✅ Solution trouvée (confiance ' + Math.round(matchResult.confidence * 100) + '%)');
            await applyAutoSolution(ticketId, matchResult.solution, diagnostic.id);
            return {
                type: 'auto-resolved',
                solution: matchResult.solution,
                confidence: matchResult.confidence
            };
            
        } else if (matchResult.confidence >= 0.5) {
            // Proposer solutions candidates
            // console.log('💡 Solutions possibles trouvées');
            return {
                type: 'suggestions',
                solutions: matchResult.candidates,
                confidence: matchResult.confidence
            };
            
        } else {
            // Lancer diagnostic guidé
            // console.log('🔍 Lancement diagnostic guidé');
            return await startGuidedDiagnostic(ticketId, sujet, description, categorie);
        }
        
    } catch (error) {
        console.error('❌ Erreur analyse IA:', error);
        return null;
    }
}

// ================================================================
// 🎯 MATCHING SÉMANTIQUE INTELLIGENT
// ================================================================
async function findBestMatch(sujet, description, solutions) {
    try {
        // Construction prompt pour OpenAI
        const problemText = `${sujet}\n\n${description}`;
        
        const solutionsText = solutions.map((s, i) => 
            `[${i}] ${s.titre}\nProblème: ${s.description_probleme}\nSymptômes: ${s.symptomes.join(', ')}`
        ).join('\n\n');
        
        const prompt = `Tu es un système d'analyse de tickets support. Analyse le problème du client et trouve la meilleure correspondance avec les solutions connues.

PROBLÈME CLIENT:
${problemText}

SOLUTIONS CONNUES:
${solutionsText}

Réponds UNIQUEMENT en JSON avec cette structure:
{
  "best_match_index": <index ou null>,
  "confidence": <score 0-1>,
  "candidates": [<liste indices>],
  "reasoning": "<explication>"
}`;

        const aiContent = await requestSupportAI({
            prompt,
            systemPrompt: 'Tu es un expert en analyse de tickets support. Réponds uniquement en JSON valide.',
            model: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 500
        });
        const result = parseJsonFromAiResponse(aiContent);
        
        // console.log('🎯 Matching result:', result);
        
        return {
            solution: result.best_match_index !== null ? solutions[result.best_match_index] : null,
            confidence: result.confidence,
            candidates: result.candidates.map(i => solutions[i]),
            reasoning: result.reasoning
        };
        
    } catch (error) {
        console.error('❌ Erreur matching:', error);
        // Fallback: matching simple par mots-clés
        return simpleFallbackMatching(sujet, description, solutions);
    }
}

// ================================================================
// 🔄 FALLBACK MATCHING SIMPLE
// ================================================================
function simpleFallbackMatching(sujet, description, solutions) {
    const problemWords = `${sujet} ${description}`.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3);
    
    const scores = solutions.map(solution => {
        const solutionWords = `${solution.titre} ${solution.description_probleme} ${solution.symptomes.join(' ')}`
            .toLowerCase();
        
        const matches = problemWords.filter(word => solutionWords.includes(word));
        return matches.length / problemWords.length;
    });
    
    const bestIndex = scores.indexOf(Math.max(...scores));
    const confidence = scores[bestIndex];
    
    return {
        solution: confidence > 0.3 ? solutions[bestIndex] : null,
        confidence: confidence,
        candidates: solutions.filter((_, i) => scores[i] > 0.2),
        reasoning: 'Matching par mots-clés (fallback)'
    };
}

// ================================================================
// ✅ APPLICATION AUTO-SOLUTION
// ================================================================
async function applyAutoSolution(ticketId, solution, diagnosticId) {
    try {
        // 1. Créer réponse automatique
        const reponseAuto = `Bonjour,

Nous avons automatiquement identifié votre problème et voici la solution :

## ${solution.titre}

${solution.solution}

${solution.etapes ? `
### Étapes de résolution :
${JSON.parse(solution.etapes).map((e, i) => 
    `${i + 1}. **${e.titre}**\n   ${e.description}${e.code ? `\n   \`\`\`\n   ${e.code}\n   \`\`\`` : ''}`
).join('\n\n')}
` : ''}

${solution.prevention ? `
### 💡 Pour éviter ce problème à l'avenir :
${solution.prevention}
` : ''}

⏱️ Temps de résolution estimé : ${solution.temps_resolution_estime || 15} minutes

---
Cette solution vous a-t-elle aidé ? Merci de nous faire un retour !

Cordialement,
L'équipe Support`;

        // 2. Ajouter commentaire au ticket
        const { error: commentError } = await window.supabaseClient
            .from('cm_support_comments')
            .insert([{
                ticket_id: ticketId,
                user_id: null, // Système
                is_internal: false,
                content: reponseAuto,
                is_ai_generated: true
            }]);
        
        if (commentError) throw commentError;
        
        // 3. Mettre à jour ticket
        const { error: ticketError } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                statut: 'en_attente',
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);
        
        if (ticketError) throw ticketError;
        
        // 4. Incrémenter utilisation solution
        const { error: solutionError } = await window.supabaseClient
            .from('cm_support_solutions')
            .update({
                nb_utilisations: solution.nb_utilisations + 1
            })
            .eq('id', solution.id);
        
        if (solutionError) throw solutionError;
        
        // console.log('✅ Auto-solution appliquée');
        
    } catch (error) {
        console.error('❌ Erreur application auto-solution:', error);
    }
}

// ================================================================
// 🔍 DIAGNOSTIC GUIDÉ
// ================================================================
async function startGuidedDiagnostic(ticketId, sujet, description, categorie) {
    try {
        // Générer questions contextuelles avec IA
        const questions = await generateDiagnosticQuestions(sujet, description, categorie);
        
        const { data: diagnostic, error } = await window.supabaseClient
            .from('cm_support_diagnostics')
            .insert([{
                ticket_id: ticketId,
                questions: questions,
                contexte_collecte: collectTechnicalContext()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // console.log('🔍 Diagnostic guidé démarré');
        
        return {
            type: 'guided-diagnostic',
            diagnostic: diagnostic,
            questions: questions
        };
        
    } catch (error) {
        console.error('❌ Erreur diagnostic guidé:', error);
        return null;
    }
}

// ================================================================
// ❓ GÉNÉRATION QUESTIONS DIAGNOSTIC
// ================================================================
async function generateDiagnosticQuestions(sujet, description, categorie) {
    const questionsParCategorie = {
        technique: [
            {
                id: 1,
                question: 'Quel navigateur utilisez-vous ?',
                type: 'choice',
                options: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Autre']
            },
            {
                id: 2,
                question: 'Le problème survient-il à chaque fois ?',
                type: 'choice',
                options: ['Oui, systématiquement', 'Non, parfois seulement', 'Première fois']
            },
            {
                id: 3,
                question: 'Avez-vous un message d\'erreur ? Si oui, lequel ?',
                type: 'text'
            },
            {
                id: 4,
                question: 'Quand le problème est-il apparu pour la première fois ?',
                type: 'text'
            }
        ],
        facturation: [
            {
                id: 1,
                question: 'Quel type d\'abonnement avez-vous ?',
                type: 'choice',
                options: ['Basic', 'Premium', 'Enterprise', 'Trial']
            },
            {
                id: 2,
                question: 'Date de votre dernier paiement ?',
                type: 'text'
            },
            {
                id: 3,
                question: 'Avez-vous reçu une facture ? Si oui, quel numéro ?',
                type: 'text'
            }
        ],
        bug: [
            {
                id: 1,
                question: 'Pouvez-vous reproduire le bug ? Si oui, comment ?',
                type: 'text'
            },
            {
                id: 2,
                question: 'À quelle étape le bug survient-il ?',
                type: 'text'
            },
            {
                id: 3,
                question: 'Avez-vous des captures d\'écran ?',
                type: 'choice',
                options: ['Oui, je peux les fournir', 'Non']
            }
        ]
    };
    
    return questionsParCategorie[categorie] || questionsParCategorie.technique;
}

// ================================================================
// 🖥️ COLLECTE CONTEXTE TECHNIQUE
// ================================================================
function collectTechnicalContext() {
    return {
        userAgent: navigator.userAgent,
        browser: detectBrowser(),
        os: detectOS(),
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
}

function detectOS() {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
}

// ================================================================
// 📊 EXPORT
// ================================================================
window.SupportAI = {
    analyzeTicketAndMatch,
    applyAutoSolution,
    startGuidedDiagnostic,
    collectTechnicalContext
};

// console.log('✅ Module Support IA chargé');
