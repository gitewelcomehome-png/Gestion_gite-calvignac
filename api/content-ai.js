// ================================================================
// 🤖 API GÉNÉRATION CONTENU IA
// ================================================================
// Intégration OpenAI GPT-4, Claude, DALL-E 3
// ================================================================

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, type, subject, tone, keyPoints, cta, length, model } = req.body;

    // ================================================================
    // GÉNÉRATION DE TEXTE
    // ================================================================
    if (action === 'generate-text') {
      
      // Contexte LiveOwnerUnit pour tout le contenu
      const brandContext = `CONTEXTE ENTREPRISE - LiveOwnerUnit ("Gestion Synchronisée")
- Plateforme SaaS de gestion locative pour propriétaires de gîtes/meublés
- Fonctionnalités : Calendrier synchronisé multi-plateformes, channel manager automatisé, dashboard analytics
- Créé par un loueur de tourisme professionnel qui connaît le métier et les besoins réels des propriétaires
- Cible : Propriétaires de gîtes et meublés touristiques cherchant à automatiser leur gestion
- Couleurs : Cyan (#06b6d4), Bleu (#2563eb), Violet (#764ba2)
- Ton : Direct, orienté données, rassurant, sans jargon technique
- Différenciation : Synchronisation temps réel vs concurrents (retard 24h), conçu par un professionnel du secteur

`;
      
      // Construire le prompt selon le type de contenu
      const prompts = {
        'post': `${brandContext}Tu es l'expert marketing de LiveOwnerUnit. Crée un post ${tone} sur le sujet : "${subject}".
Points clés à inclure : ${keyPoints || 'N/A'}
Call-to-action : ${cta || 'N/A'}
Longueur : ${length === 'court' ? '100-150 mots' : length === 'moyen' ? '150-300 mots' : '300-500 mots'}
Format : Texte optimisé pour réseaux sociaux avec emojis pertinents. Mentionne LiveOwnerUnit et ses bénéfices.`,
        
        'email': `${brandContext}Tu es l'expert email marketing de LiveOwnerUnit. Rédige un email ${tone} sur : "${subject}".
Points clés : ${keyPoints || 'N/A'}
Call-to-action : ${cta || 'N/A'}
Longueur : ${length === 'court' ? 'Concis (150 mots max)' : length === 'moyen' ? 'Standard (150-300 mots)' : 'Détaillé (300-500 mots)'}
Structure : Objet accrocheur + corps du message personnalisé + CTA clair vers LiveOwnerUnit.`,
        
        'blog': `${brandContext}Tu es l'expert SEO de LiveOwnerUnit. Écris un article de blog ${tone} sur : "${subject}".
Points clés : ${keyPoints || 'N/A'}
Call-to-action : ${cta || 'N/A'}
Longueur : ${length === 'court' ? '300-500 mots' : length === 'moyen' ? '500-800 mots' : '800-1200 mots'}
Structure : Titre H1 optimisé SEO + introduction engageante + sections H2 + étude de cas LiveOwnerUnit + conclusion avec CTA.`,
        
        'newsletter': `${brandContext}Tu es l'expert newsletters de LiveOwnerUnit. Crée une newsletter ${tone} sur : "${subject}".
Points clés : ${keyPoints || 'N/A'}
Call-to-action : ${cta || 'N/A'}
Longueur : ${length === 'court' ? '200-300 mots' : length === 'moyen' ? '300-500 mots' : '500-800 mots'}
Format : Sections claires + stats/témoignages LiveOwnerUnit + visuels suggérés + CTA engageant.`
      };

      const prompt = prompts[type] || prompts['post'];

      // Choix du modèle (GPT-4 ou Claude)
      const selectedModel = model || 'gpt-4';

      let content = '';

      if (selectedModel.startsWith('gpt')) {
        // ========== OPENAI GPT-4 ==========
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        
        if (!OPENAI_API_KEY) {
          return res.status(500).json({ 
            error: 'OpenAI API key not configured. Add OPENAI_API_KEY to environment variables.' 
          });
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: 'system',
                content: 'Tu es un expert en création de contenu marketing multicanal. Tu crées du contenu engageant, optimisé et adapté à chaque plateforme.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.8,
            max_tokens: length === 'long' ? 1500 : length === 'moyen' ? 800 : 400
          })
        });

        if (!openaiResponse.ok) {
          const error = await openaiResponse.json();
          throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await openaiResponse.json();
        content = data.choices[0].message.content;

      } else if (selectedModel.startsWith('claude')) {
        // ========== ANTHROPIC CLAUDE ==========
        const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
        
        if (!ANTHROPIC_API_KEY) {
          return res.status(500).json({ 
            error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to environment variables.' 
          });
        }

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: selectedModel,
            max_tokens: length === 'long' ? 1500 : length === 'moyen' ? 800 : 400,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        if (!claudeResponse.ok) {
          const error = await claudeResponse.json();
          throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await claudeResponse.json();
        content = data.content[0].text;
      }

      return res.status(200).json({
        success: true,
        content: content,
        model: selectedModel,
        words: content.split(/\s+/).length,
        chars: content.length
      });
    }

    // ================================================================
    // GÉNÉRATION D'IMAGE (Stability AI + DALL-E 3)
    // ================================================================
    if (action === 'generate-image') {
      const { prompt, style, size, provider = 'stability' } = req.body;

      // Contexte LiveOwnerUnit pour toutes les images
      const contextPrompt = `Context: LiveOwnerUnit is a SaaS platform for vacation rental management with synchronized calendars and channel manager. Built by a professional vacation rental owner who understands the real needs of the industry. Brand colors: cyan (#06b6d4), blue (#2563eb), violet (#764ba2). Modern, professional, tech-focused aesthetic. 

Image description: ${prompt}`;

      // Style mapping amélioré
      const stylePrompts = {
        'realistic': 'photorealistic, high quality, professional photography, 4k, detailed, sharp focus',
        'artistic': 'artistic illustration, creative, vibrant colors, digital art, trending on artstation',
        'minimal': 'minimalist design, clean, simple, modern, flat design, professional',
        'vintage': 'vintage style, retro aesthetic, nostalgic, old photograph, film grain'
      };

      const enhancedPrompt = `${contextPrompt}. ${stylePrompts[style] || stylePrompts['realistic']}`;

      // ===== STABILITY AI (Stable Diffusion XL) - PAR DÉFAUT =====
      if (provider === 'stability') {
        const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        
        if (!STABILITY_API_KEY) {
          return res.status(400).json({ 
            success: false,
            error: 'Stability AI API key not configured. Add STABILITY_API_KEY in Vercel environment variables or switch to DALL-E.' 
          });
        }

        // Traduire le prompt en anglais si nécessaire (Stability AI = anglais uniquement)
        let translatedPrompt = enhancedPrompt;
        if (OPENAI_API_KEY) {
          try {
            const translateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                  { role: 'system', content: 'Translate the following image description to English. Keep it concise and descriptive for image generation. Return ONLY the translation, nothing else.' },
                  { role: 'user', content: enhancedPrompt }
                ],
                temperature: 0.3,
                max_tokens: 200
              })
            });
            
            if (translateResponse.ok) {
              const translateData = await translateResponse.json();
              translatedPrompt = translateData.choices[0].message.content.trim();
            }
          } catch (e) {
            // Si traduction échoue, utiliser le prompt original
            console.log('Translation failed, using original prompt:', e.message);
          }
        }

        // Dimensions mapping
        const sizeMap = {
          '1024x1024': { width: 1024, height: 1024 },
          '1792x1024': { width: 1792, height: 1024 },
          '1024x1792': { width: 1024, height: 1792 }
        };

        const dimensions = sizeMap[size] || { width: 1024, height: 1024 };

        const stabilityResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STABILITY_API_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            text_prompts: [
              { text: translatedPrompt, weight: 1 },
              { text: 'blurry, bad quality, distorted, ugly, low resolution, text, watermark', weight: -1 }
            ],
            cfg_scale: 7,
            height: dimensions.height,
            width: dimensions.width,
            samples: 1,
            steps: 30
          })
        });

        if (!stabilityResponse.ok) {
          const error = await stabilityResponse.json();
          throw new Error(`Stability AI error: ${error.message || 'Unknown error'}`);
        }

        const data = await stabilityResponse.json();

        return res.status(200).json({
          success: true,
          imageBase64: data.artifacts[0].base64,
          provider: 'Stability AI'
        });
      }

      // ===== DALL-E 3 (fallback si demandé) =====
      if (provider === 'dalle') {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        
        if (!OPENAI_API_KEY) {
          return res.status(400).json({ 
            success: false,
            error: 'OpenAI API key not configured for DALL-E. Add OPENAI_API_KEY in Vercel environment variables.' 
          });
        }

        const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: enhancedPrompt,
            n: 1,
            size: size || '1024x1024',
            quality: 'hd'
          })
        });

        if (!dalleResponse.ok) {
          const error = await dalleResponse.json();
          throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await dalleResponse.json();

        return res.status(200).json({
          success: true,
          imageUrl: data.data[0].url,
          revisedPrompt: data.data[0].revised_prompt,
          provider: 'DALL-E 3'
        });
      }

      return res.status(400).json({
        error: 'Invalid provider. Use "stability", "gemini" or "dalle".'
      });
    }

    // ================================================================
    // OPTIMISATION SEO
    // ================================================================
    if (action === 'optimize-seo') {
      const { content } = req.body;

      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key not configured.' 
        });
      }

      const seoResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert SEO. Analyse le contenu et suggère des améliorations : mots-clés, meta description, structure, lisibilité.'
            },
            {
              role: 'user',
              content: `Analyse ce contenu et donne des recommandations SEO concrètes :\n\n${content}`
            }
          ],
          temperature: 0.5,
          max_tokens: 800
        })
      });

      if (!seoResponse.ok) {
        const error = await seoResponse.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await seoResponse.json();

      return res.status(200).json({
        success: true,
        recommendations: data.choices[0].message.content
      });
    }

    // ================================================================
    // GÉNÉRATION PLAN STRATÉGIQUE LONG TERME (12 SEMAINES)
    // ================================================================
    if (action === 'generate-longterm-plan') {
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key not configured' 
        });
      }

      const { startWeek, year } = req.body;

      const planPrompt = `Tu es le stratège marketing senior de LiveOwnerUnit, plateforme SaaS de gestion locative.

MISSION : Créer un PLAN STRATÉGIQUE sur 12 SEMAINES (3 mois).

PHASES :
- SEMAINES 1-3 : DÉMARRAGE (Notoriété + Acquisition)
- SEMAINES 4-8 : CROISSANCE (Engagement + Conversion)
- SEMAINES 9-12 : STABILISATION (Fidélisation + Optimisation)

Pour CHAQUE semaine, définis :
1. OBJECTIF PRINCIPAL
2. CIBLES PRIORITAIRES (propriétaires gîtes, agences, multipropriétaires)
3. THÈMES (saisonnalité, problèmes, solutions)
4. ACTIONS CONCRÈTES (posts, emails, promotions)
5. KPIs (impressions, leads, conversions)

CONTRAINTES :
- Progression cohérente semaine après semaine
- Adaptation saisonnalité (hiver/printemps/été)
- Créé par un vrai loueur professionnel (pas de bullshit)
- Focus : Synchronisation temps réel, automatisation

FORMAT RÉPONSE (JSON) :
{
  "plan_global": {
    "vision": "Vision 3 mois",
    "objectifs_finaux": {
      "notoriete": "X impressions",
      "engagement": "X%",
      "leads": "X leads qualifiés",
      "conversions": "X clients"
    }
  },
  "semaines": [
    {
      "numero": 1,
      "phase": "DÉMARRAGE",
      "objectif": "Lancer présence LinkedIn + Premiers contenus",
      "cibles": ["Propriétaires 1-2 gîtes"],
      "themes": ["Problèmes réservations multiples", "Synchronisation calendriers"],
      "actions": [
        {
          "type": "post",
          "plateforme": "linkedin",
          "sujet": "Les 3 erreurs fatales en gestion locative",
          "angle": "Expérience terrain",
          "priorite": "haute"
        },
        {
          "type": "promotion",
          "titre": "Offre lancement -30%",
          "cible": "Early adopters",
          "duree": "1 semaine"
        }
      ],
      "kpis": {"impressions": 2000, "engagement": 2, "leads": 5},
      "hashtags": ["#gestionlocative", "#gite", "#calendrier"]
    }
  ]
}

Génère les 12 semaines complètes. Réponds UNIQUEMENT avec le JSON.`;

      const planResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en stratégie marketing digital long terme pour SaaS B2B. Tu fournis des plans détaillés et actionnables.'
            },
            {
              role: 'user',
              content: planPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!planResponse.ok) {
        const error = await planResponse.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const planData = await planResponse.json();
      const planContent = planData.choices[0].message.content;

      let cleanJSON = planContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsedPlan = JSON.parse(cleanJSON);
        return res.status(200).json({
          success: true,
          plan: parsedPlan
        });
      } catch (parseError) {
        return res.status(200).json({
          success: true,
          plan: { raw: cleanJSON }
        });
      }
    }

    // ================================================================
    // GÉNÉRATION STRATÉGIE HEBDOMADAIRE
    // ================================================================
    if (action === 'generate-weekly-strategy') {
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key not configured' 
        });
      }

      const { weekNumber, year, history } = req.body;

      const strategyPrompt = `Tu es le stratège marketing senior de LiveOwnerUnit, plateforme SaaS de gestion locative.

CONTEXTE :
- Semaine ${weekNumber}/${year}
- Historique récent : ${history ? JSON.stringify(history).substring(0, 500) : 'Nouveau démarrage'}

MISSION : Créer une stratégie marketing complète pour cette semaine.

ANALYSE À FOURNIR :
1. OBJECTIF PRINCIPAL (SMART) : 1 objectif clair et mesurable
2. CIBLES PRIORITAIRES : 2-3 segments d'audience à viser
3. THÈMES À EXPLOITER : 3-4 thèmes de contenu (actualité, saisonnalité, pain points)
4. KPIs À ATTEINDRE : Métriques précises (impressions, engagement, conversions)
5. ANGLES D'ATTAQUE : Comment se démarquer cette semaine
6. CONTENUS SUGGÉRÉS : 5-7 idées de posts/articles avec plateforme recommandée
7. HASHTAGS STRATÉGIQUES : 10 hashtags pertinents (#location #gestion #vacances etc.)
8. MEILLEURS HORAIRES : Quand publier (jour + heure) pour maximiser reach

CONTRAINTES :
- Rester authentique, créé par un vrai loueur professionnel
- Aucun chiffre mensonger ou promesse exagérée
- Focus : Synchronisation temps réel, automatisation, gain de temps
- Ton : Direct, data-driven, pragmatique

FORMAT DE RÉPONSE (JSON) :
{
  "objectif": "...",
  "cibles": ["...", "..."],
  "themes": ["...", "...", "..."],
  "kpis": {
    "impressions": 5000,
    "engagement_rate": 3.5,
    "leads": 10
  },
  "angles": ["...", "..."],
  "contenus": [
    {
      "type": "post",
      "plateforme": "linkedin",
      "sujet": "...",
      "angle": "...",
      "heure_ideale": "Mardi 14h"
    }
  ],
  "hashtags": ["#location", "#gestion", ...],
  "timing_optimal": { "linkedin": "Mar/Jeu 9h-14h", "facebook": "Mer/Ven 12h-20h" }
}

Réponds UNIQUEMENT avec le JSON, sans texte avant/après.`;

      const strategyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en stratégie marketing digital pour le SaaS B2B. Tu fournis des stratégies actionnables et mesurables.'
            },
            {
              role: 'user',
              content: strategyPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!strategyResponse.ok) {
        const error = await strategyResponse.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const strategyData = await strategyResponse.json();
      const strategyContent = strategyData.choices[0].message.content;

      // Nettoyer le JSON (enlever markdown)
      let cleanJSON = strategyContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsedStrategy = JSON.parse(cleanJSON);
        return res.status(200).json({
          success: true,
          strategy: parsedStrategy
        });
      } catch (parseError) {
        // Si parsing échoue, retourner le texte brut
        return res.status(200).json({
          success: true,
          strategy: { raw: cleanJSON }
        });
      }
    }

    // ================================================================
    // GÉNÉRATION CONTENU AUTO (basé sur stratégie)
    // ================================================================
    if (action === 'generate-content-from-strategy') {
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenAI API key not configured' 
        });
      }

      const { contentIdea, history, strategy } = req.body;

      const contentPrompt = `Tu es le content creator de LiveOwnerUnit.

CONTEXTE STRATÉGIQUE :
${JSON.stringify(strategy, null, 2)}

CONTENU À CRÉER :
- Type: ${contentIdea.type}
- Plateforme: ${contentIdea.plateforme}
- Sujet: ${contentIdea.sujet}
- Angle: ${contentIdea.angle}

HISTORIQUE RÉCENT (pour cohérence) :
${history ? JSON.stringify(history).substring(0, 500) : 'N/A'}

MISSION : Créer un contenu engageant qui :
1. Suit la stratégie de la semaine
2. Reste cohérent avec les contenus précédents
3. Utilise les hashtags stratégiques
4. Optimisé pour la viralité (hooks, storytelling, CTA clair)

FORMAT RÉPONSE (JSON) :
{
  "contenu": "Texte complet du post/email/article",
  "hashtags": ["#location", "#gestion", ...],
  "cta": "Call-to-action",
  "image_prompt": "Prompt pour générer l'image associée",
  "best_time": "Meilleur moment pour publier"
}

Réponds UNIQUEMENT avec le JSON.`;

      const contentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en création de contenu viral pour les réseaux sociaux B2B.'
            },
            {
              role: 'user',
              content: contentPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        })
      });

      if (!contentResponse.ok) {
        const error = await contentResponse.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const contentData = await contentResponse.json();
      const contentText = contentData.choices[0].message.content;

      let cleanJSON = contentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsedContent = JSON.parse(cleanJSON);
        return res.status(200).json({
          success: true,
          content: parsedContent
        });
      } catch (parseError) {
        return res.status(200).json({
          success: true,
          content: { raw: cleanJSON }
        });
      }
    }

    return res.status(400).json({ error: 'Invalid action. Use: generate-text, generate-image, optimize-seo, generate-weekly-strategy, or generate-content-from-strategy' });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
}
