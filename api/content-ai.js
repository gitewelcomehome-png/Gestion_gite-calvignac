// ================================================================
// 🤖 API GÉNÉRATION CONTENU IA
// ================================================================
// Intégration OpenAI GPT-4, Claude, DALL-E 3
// ================================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getOriginFromRequest(req) {
  const origin = req.headers.origin || req.headers.referer || '';
  if (!origin) return null;

  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins() {
  const raw = String(
    process.env.CONTENT_AI_ALLOWED_ORIGINS
    || process.env.CORS_ALLOWED_ORIGINS
    || process.env.SUPPORT_AI_ALLOWED_ORIGINS
    || ''
  ).trim();

  if (!raw) {
    return new Set([
      'https://liveownerunit.fr',
      'https://www.liveownerunit.fr',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ]);
  }

  return new Set(
    raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function shouldEnforceOrigin() {
  return String(process.env.CONTENT_AI_ENFORCE_ALLOWED_ORIGINS || 'true').trim().toLowerCase() === 'true';
}

function setCorsHeaders(req, res, allowedOrigin) {
  const requestOrigin = getOriginFromRequest(req);
  const originToSet = requestOrigin && allowedOrigin && requestOrigin === allowedOrigin
    ? requestOrigin
    : allowedOrigin || 'null';

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', originToSet);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = getOriginFromRequest(req);
  const isAllowed = requestOrigin ? allowedOrigins.has(requestOrigin) : false;
  const enforceOrigin = shouldEnforceOrigin();

  setCorsHeaders(req, res, (isAllowed || !enforceOrigin) ? requestOrigin : null);
  res.setHeader('X-Origin-Validation', isAllowed ? 'allowed' : 'not-listed');
  res.setHeader('X-Origin-Enforcement', enforceOrigin ? 'enforce' : 'monitor');

  if (req.method === 'OPTIONS') {
    if (enforceOrigin && !isAllowed) {
      return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
    }
    return res.status(200).end();
  }

  if (enforceOrigin && !isAllowed) {
    return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, type, subject, tone, keyPoints, cta, length, model } = req.body;

    // DEBUG: Log des variables d'environnement
    // console.log('🔍 DEBUG ENV:', {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      action: action
    });

    // ================================================================
    // GESTION PROMPT (GET/SAVE)
    // ================================================================
    if (action === 'get-prompt') {
      try {
        const configPath = path.join(process.cwd(), 'config', 'PROMPT_CLAUDE_BASE.md');
        const prompt = fs.readFileSync(configPath, 'utf-8');
        return res.json({ success: true, prompt });
      } catch (error) {
        return res.status(500).json({ success: false, error: 'Prompt file not found' });
      }
    }

    if (action === 'save-prompt') {
      const { prompt, version, notes } = req.body;
      
      try {
        // Sauvegarder dans fichier
        const configPath = path.join(process.cwd(), 'config', 'PROMPT_CLAUDE_BASE.md');
        fs.writeFileSync(configPath, prompt, 'utf-8');
        
        // Sauvegarder version dans DB
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        );
        
        await supabase.from('cm_ai_prompt_versions').insert({
          version,
          prompt_system: prompt,
          prompt_user_template: prompt,
          notes,
          valide_par: 'stephanecalvignac@hotmail.fr',
          statut: 'actif',
          date_activation: new Date().toISOString()
        });
        
        return res.json({ success: true, message: 'Prompt saved and deployed' });
      } catch (error) {
        console.error('Save prompt error:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // ================================================================
    // PROPOSITIONS QUOTIDIENNES IA
    // ================================================================
    if (action === 'generate-daily-propositions') {
      // console.log('🚀 Génération propositions quotidiennes...');
      
      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      
      if (!ANTHROPIC_API_KEY) {
        console.error('❌ Anthropic API key manquante');
        return res.status(500).json({ 
          error: 'Anthropic API key not configured' 
        });
      }

      // console.log('✅ Anthropic API key présente');
      // console.log('🔑 API Key format:', {
        length: ANTHROPIC_API_KEY.length,
        starts: ANTHROPIC_API_KEY.substring(0, 7),
        valid_format: ANTHROPIC_API_KEY.startsWith('sk-ant-')
      });

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables Supabase manquantes:', { 
          hasUrl: !!supabaseUrl, 
          hasKey: !!supabaseKey 
        });
        return res.status(500).json({ 
          error: 'Supabase configuration missing',
          details: {
            supabaseUrl: !!supabaseUrl,
            supabaseKey: !!supabaseKey
          }
        });
      }

      // console.log('✅ Variables Supabase présentes');

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Récupérer la stratégie active
      const { data: activeStrategy } = await supabase
        .from('cm_ai_strategies')
        .select('*')
        .eq('statut', 'actif')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const dayOfWeek = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
      const date = new Date().toLocaleDateString('fr-FR');

      const prompt = `Tu es Claude, stratège marketing de LiveOwnerUnit.

📅 AUJOURD'HUI : ${dayOfWeek} ${date}

${activeStrategy ? `STRATÉGIE ACTIVE :
- Objectif : ${activeStrategy.objectif}
- Cibles : ${activeStrategy.cibles?.join(', ')}
- Thèmes : ${activeStrategy.themes?.join(', ')}
` : 'Pas de stratégie active'}

MISSION : Génère 3-5 PROPOSITIONS CONCRÈTES pour aujourd'hui.

Pour chaque proposition, définis :
{
  "id": "unique_id",
  "type": "post|email|promotion|video",
  "titre": "Titre accrocheur",
  "apercu": "Description courte 1 phrase",
  "contenu_complet": "Contenu prêt-à-poster",
  "potentiel": "Élevé|Moyen|Faible",
  "timing": "Ce matin|Cet après-midi|Ce soir",
  "justification": "Pourquoi cette proposition aujourd'hui",
  "hashtags": ["#gite", "#locationvacances"]
}

CONTRAINTES :
- Basé sur stratégie active ou actualité secteur
- Contenu PRÊT À PUBLIER (pas juste idée)
- Adapté au jour/moment (lundi matin ≠ vendredi soir)
- Respecte principes éthiques (pas de mensonge)

Réponds UNIQUEMENT avec :
{
  "propositions": [...]
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4000,
          temperature: 0.8,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('❌ Claude API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        });
        return res.status(500).json({ 
          error: 'Claude API error',
          details: {
            status: response.status,
            message: errorBody
          }
        });
      }

      // console.log('✅ Réponse Claude reçue');

      const result = await response.json();
      const content = result.content[0].text;
      const cleanJSON = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJSON);

      return res.json({ 
        success: true, 
        propositions: parsed.propositions,
        generated_at: new Date().toISOString()
      });
    }

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
            model: selectedModel === 'claude-sonnet-4-5' ? 'claude-sonnet-4-5-20250929' : 
                   selectedModel === 'claude-opus-4-5' ? 'claude-opus-4-5-20251101' :
                   selectedModel === 'claude-3-opus' ? 'claude-3-opus-20240229' :
                   selectedModel === 'claude-3-sonnet' ? 'claude-3-sonnet-20240229' :
                   selectedModel,
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
            // console.log('Translation failed, using original prompt:', e.message);
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
    // GÉNÉRATION UNE SEULE SEMAINE (OPTIMISÉ RAPIDE)
    // ================================================================
    if (action === 'generate-single-week') {
      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      const useOpenAI = req.body.useOpenAI || !ANTHROPIC_API_KEY; // Fallback si pas de Claude

      const { weekNumber, startWeek, year, platforms = ['linkedin', 'facebook', 'instagram', 'video'] } = req.body;
      
      // Mapping types de contenu par plateforme
      const platformTypes = {
        linkedin: 'post_linkedin',
        facebook: 'post_facebook', 
        instagram: 'post_instagram',
        blog: 'article_blog',
        email: 'email_marketing',
        video: 'video_youtube_tiktok'
      };
      
      const allowedTypes = platforms.map(p => platformTypes[p]).filter(Boolean);
      const platformsText = platforms.map(p => {
        const names = {
          linkedin: 'LinkedIn',
          facebook: 'Facebook',
          instagram: 'Instagram', 
          blog: 'Blog/SEO',
          email: 'Email Marketing',
          video: 'Vidéo (YouTube/TikTok)'
        };
        return names[p];
      }).join(', ');

      const weekPrompt = `Tu es un expert marketing SaaS spécialisé dans la gestion locative courte durée (gîtes, chambres d'hôtes).

# CONTEXTE
LiveOwnerUnit est un SaaS qui aide les propriétaires à gérer leurs locations (calendriers, réservations, iCal sync).
Cible : Propriétaires de 1-5 gîtes qui perdent du temps avec les calendriers et les doublons.

# MISSION
Génère un plan ULTRA-DÉTAILLÉ pour la semaine ${weekNumber} d'une campagne marketing 12 semaines.

# PLATEFORMES AUTORISÉES
Tu dois UNIQUEMENT créer des actions pour ces plateformes : ${platformsText}
Types de contenu autorisés : ${allowedTypes.join(', ')}

# PRINCIPES ABSOLUS
- Parler COMME un propriétaire de gîtes (pas comme un vendeur)
- Chaque affirmation = preuve concrète
- Zéro buzzword ("révolutionnaire", "disruptif", etc.)
- Problèmes réels uniquement
- Storytelling authentique
- NE PAS générer de contenu pour des plateformes non demandées

# FORMAT JSON ATTENDU
{
  "plan_global": ${weekNumber === 1 ? `{
    "vision_3_mois": "Devenir la référence des propriétaires 1-5 gîtes pour la synchronisation calendrier",
    "objectifs_finaux": {
      "leads_qualifies": 250,
      "clients_signes": 35,
      "mrr_cible": "1800€",
      "impressions_totales": 80000,
      "taux_conversion": "14%"
    }
  }` : 'null'},
  "week": {
    "numero": ${weekNumber},
    "objectif_principal": "Objectif SMART précis de cette semaine",
    "sous_objectifs": [
      "Sous-objectif mesurable 1",
      "Sous-objectif mesurable 2"
    ],
    "cibles": [
      "Propriétaires 1-3 gîtes ruraux (pain: oublis réservations)",
      "Propriétaires multi-plateformes (pain: calendriers désynchronisés)"
    ],
    "themes": [
      "Pain point concret et précis 1",
      "Pain point concret et précis 2",
      "Pain point concret et précis 3"
    ],
    "actions": [
      ${platforms.includes('linkedin') ? `{
        "type": "post_linkedin",
        "priorite": "haute",
        "timing": "Lundi 9h",
        "sujet": "Titre accrocheur qui interpelle sur un pain point",
        "angle": "Storytelling personnel ou cas concret",
        "contenu_complet": "Post LinkedIn de 150-200 mots PRÊT À PUBLIER avec hook, développement, CTA. Parler comme un propriétaire, pas comme un commercial.",
        "hashtags": ["#GestionLocative", "#Airbnb", "#BookingCom"],
        "cta": "Call-to-action précis",
        "kpi_attendu": "50 impressions, 3 commentaires"
      },` : ''}
      ${platforms.includes('facebook') ? `{
        "type": "post_facebook",
        "priorite": "moyenne",
        "timing": "Mardi 14h",
        "sujet": "Titre engageant pour Facebook",
        "contenu_complet": "Post Facebook 100-150 mots avec storytelling, visuel suggéré",
        "hashtags": ["#GestionLocative", "#Airbnb"],
        "cta": "CTA précis",
        "kpi_attendu": "40 réactions, 5 partages"
      },` : ''}
      ${platforms.includes('instagram') ? `{
        "type": "post_instagram",
        "priorite": "moyenne",
        "timing": "Mercredi 18h",
        "sujet": "Caption Instagram percutante",
        "contenu_complet": "Caption 80-120 mots + description visuel suggéré",
        "hashtags": ["#gestionlocative", "#airbnb", "#gite"],
        "cta": "CTA dans bio",
        "kpi_attendu": "60 likes, 3 commentaires"
      },` : ''}
      ${platforms.includes('email') ? `{
        "type": "email_marketing",
        "priorite": "moyenne",
        "timing": "Mercredi 10h",
        "sujet": "Objet email percutant",
        "audience": "Segment précis (ex: inscrits non convertis)",
        "contenu_complet": "Email de 100-150 mots PRÊT avec hook, valeur, CTA",
        "cta": "Lien action précise",
        "kpi_attendu": "30% ouverture, 8% clic"
      },` : ''}
      ${platforms.includes('blog') ? `{
        "type": "article_blog",
        "priorite": "basse",
        "timing": "Vendredi",
        "sujet": "Titre SEO + pain point",
        "mots_cles": ["synchronisation calendrier airbnb", "éviter double réservation"],
        "structure": {
          "intro": "2-3 phrases qui posent le problème",
          "points_cles": [
            "Point 1 : Explication + exemple concret",
            "Point 2 : Explication + exemple concret",
            "Point 3 : Explication + solution"
          ],
          "conclusion": "Récap + CTA soft"
        },
        "longueur": "600-800 mots",
        "kpi_attendu": "100 vues, 2 leads"
      },` : ''}
      ${platforms.includes('video') ? `{
        "type": "video_youtube_tiktok",
        "priorite": "moyenne",
        "timing": "Jeudi",
        "sujet": "Titre vidéo accrocheur",
        "script": "Script 60-90 secondes avec hook, démonstration, CTA",
        "format": "Court format vertical (TikTok/Reels) ou YouTube",
        "kpi_attendu": "200 vues, 10 likes"
      }` : ''}
    ],
    "kpis": {
      "leads": {
        "cible": 20,
        "sources": {
          "linkedin": 8,
          "email": 6,
          "blog": 4,
          "organique": 2
        }
      },
      "impressions": {
        "cible": 6000,
        "par_canal": {
          "linkedin": 3000,
          "email": 1500,
          "blog": 1500
        }
      },
      "engagement": {
        "commentaires": 10,
        "partages": 3,
        "taux_ouverture_email": "30%"
      },
      "conversions": {
        "inscriptions": 15,
        "demos_reservees": 2,
        "essais_gratuits": 3
      }
    },
    "risques": [
      "Risque 1 et plan mitigation",
      "Risque 2 et plan mitigation"
    ],
    "apprentissages_semaine_precedente": ${weekNumber > 1 ? '"Ce qui a marché/pas marché semaine précédente"' : 'null'}
  }
}

IMPORTANT :
- Les contenus doivent être PRÊTS À PUBLIER (pas de placeholder)
- Parler avec authenticité de propriétaire
- KPIs réalistes et mesurables
- Actions concrètes avec timing précis

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

      // ================================================================
      // CHOIX DU PROVIDER : OpenAI ou Claude
      // ================================================================
      let response, data, content;

      if (useOpenAI) {
        // console.log('🤖 Utilisation OpenAI GPT-4o');
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{
              role: 'system',
              content: 'Tu es un expert marketing SaaS. Réponds UNIQUEMENT en JSON valide, sans markdown.'
            }, {
              role: 'user',
              content: weekPrompt
            }],
            max_tokens: 4000,
            temperature: 0.8
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
        }

        data = await response.json();
        content = data.choices[0].message.content;

      } else {
        // console.log('🤖 Utilisation Claude Sonnet 4.5');
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4000,
            temperature: 0.8,
            messages: [{
              role: 'user',
              content: weekPrompt
            }]
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
        }

        data = await response.json();
        content = data.content[0].text;
      }
      
      // LOG BRUT pour debug
      // console.log('🔍 RÉPONSE BRUTE CLAUDE:', content.substring(0, 500));
      
      let cleanJSON = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsed = JSON.parse(cleanJSON);
        return res.status(200).json({
          success: true,
          week: parsed.week,
          plan_global: parsed.plan_global,
          tokens_used: data.usage
        });
      } catch (parseError) {
        console.error('❌ ERREUR PARSING JSON:', parseError.message);
        console.error('📄 CONTENU QUI A ÉCHOUÉ:', cleanJSON.substring(0, 1000));
        
        // Tenter de sauver ce qu'on peut
        return res.status(500).json({
          error: 'Erreur parsing réponse Claude',
          parse_error: parseError.message,
          raw_content: content.substring(0, 500),
          success: false
        });
      }
    }

    // ================================================================
    // ================================================================
    // GÉNÉRATION ACTIONS BUSINESS STRATÉGIQUES
    // ================================================================
    if (action === 'generate-business-actions') {
        const apiKey = req.body.useOpenAI ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
        const provider = req.body.useOpenAI ? 'OpenAI' : 'Claude';
        
        if (!apiKey) {
            return res.status(500).json({ error: `${provider} API key not configured` });
        }

        const prompt = `Tu es un expert en marketing SaaS pour LiveOwnerUnit, une solution de gestion de réservations pour propriétaires de gîtes.

**Génère 5 actions business stratégiques** pour améliorer les performances commerciales, différentes des publications social media classiques :

Types d'actions attendues :
- **Promotions** : Offres limitées, réductions, packages, cashback
- **Partenariats** : Collaborations avec influenceurs, plateformes, organisations
- **Optimisations** : Amélioration site web, tunnel de conversion, pricing
- **Campagnes spéciales** : Webinaires, challenges, concours
- **Techniques commerciales** : Cold email, retargeting, referral program

Pour chaque action, fournis :
- type (promotion/partenariat/optimisation/campagne/technique)
- titre (accrocheur et précis)
- description (détaillée, actionnable, 2-3 phrases)
- justification (pourquoi cette action maintenant ? données à l'appui)
- priorite (haute/moyenne/basse)

Format JSON strict :
\`\`\`json
{
  "actions": [
    {
      "type": "promotion",
      "titre": "Offre Black Friday : -30% sur l'abonnement annuel",
      "description": "Lancer une promotion Black Friday avec -30% sur l'abonnement annuel, valable du 25 au 30 novembre. Communiquer via email, réseaux sociaux et bannière site web.",
      "justification": "Période d'achat forte, concurrence active, opportunité de booster les conversions annuelles qui ont un meilleur LTV.",
      "priorite": "haute"
    }
  ]
}
\`\`\`

Fournis **uniquement le JSON**, sans texte avant/après.`;

        let actions;

        if (req.body.useOpenAI) {
            // OpenAI
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;
            const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
            actions = parsed.actions;

        } else {
            // Claude
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4000,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            const data = await response.json();
            const content = data.content[0].text;
            const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
            actions = parsed.actions;
        }

        return res.json({ success: true, actions });
    }

    // ================================================================
    // GÉNÉRATION PLAN D'ACTION DÉTAILLÉ
    // ================================================================
    if (action === 'generate-action-plan') {
        try {
            const apiKey = req.body.useOpenAI ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
            const provider = req.body.useOpenAI ? 'OpenAI' : 'Claude';
            
            if (!apiKey) {
                console.error(`❌ ${provider} API key not configured`);
                return res.status(500).json({ error: `${provider} API key non configurée` });
            }

            const { titre, description, type, customInstructions = '' } = req.body;
            
            if (!titre || !description || !type) {
                return res.status(400).json({ error: 'Paramètres manquants: titre, description, type requis' });
            }

            const customSection = customInstructions ? `

**CONSIGNES SPÉCIFIQUES DU CLIENT :**
${customInstructions}

⚠️ RESPECTE ABSOLUMENT ces consignes dans ton plan d'action !` : '';

            const prompt = `Tu es un expert en marketing et exécution stratégique pour LiveOwnerUnit.

**Action business à planifier :**
Type: ${type}
Titre: ${titre}
Description: ${description}${customSection}

**Ta mission :** Créer un plan d'action détaillé, étape par étape, pour exécuter cette action avec succès.

**Fournis un plan structuré avec :**
- 5-8 étapes concrètes et actionnables
- Pour chaque étape :
  * Titre clair
  * Description détaillée (2-3 phrases)
  * Ressources nécessaires (budget, outils, personnes)
  * Durée estimée
- Métriques de succès à tracker

Format JSON strict :
\`\`\`json
{
  "etapes": [
    {
      "titre": "Définir l'offre et les conditions",
      "description": "Déterminer précisément le pourcentage de réduction, la durée de validité, les conditions d'éligibilité et les limites (nouveaux clients uniquement, nombre limité, etc.)",
      "ressources": "Équipe marketing + validation direction",
      "duree": "2-3 jours"
    }
  ],
  "metriques_succes": "Nombre de conversions, taux d'utilisation du code promo, CA généré, nombre de nouveaux clients acquis"
}
\`\`\`

Fournis **uniquement le JSON**, sans texte avant/après.`;

            let plan;

            if (req.body.useOpenAI) {
                // OpenAI avec timeout
                // console.log('🤖 Appel OpenAI GPT-4o...');
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
                
                try {
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o',
                            messages: [{ role: 'user', content: prompt }],
                            temperature: 0.7,
                            max_tokens: 2000
                        }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
                        console.error('❌ OpenAI Error:', errorMsg);
                        throw new Error(`OpenAI: ${errorMsg}`);
                    }

                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;
                    
                    if (!content) {
                        throw new Error('OpenAI: Réponse vide');
                    }
                    
                    // console.log('✅ Réponse OpenAI reçue, parsing JSON...');
                    plan = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
                    
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    if (fetchError.name === 'AbortError') {
                        throw new Error('OpenAI: Timeout (> 25s)');
                    }
                    throw fetchError;
                }

            } else {
                // Claude
                // console.log('🤖 Appel Claude Sonnet...');
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 4000,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
                    console.error('❌ Claude Error:', errorMsg);
                    throw new Error(`Claude: ${errorMsg}`);
                }

                const data = await response.json();
                const content = data.content?.[0]?.text;
                
                if (!content) {
                    throw new Error('Claude: Réponse vide');
                }
                
                // console.log('✅ Réponse Claude reçue, parsing JSON...');
                plan = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
            }

            if (!plan.etapes || !Array.isArray(plan.etapes)) {
                throw new Error('Format de plan invalide: etapes manquant');
            }

            // console.log(`✅ Plan généré avec ${plan.etapes.length} étapes`);
            return res.json({ success: true, plan });
            
        } catch (error) {
            console.error('❌ Erreur génération plan:', error.message);
            return res.status(500).json({ 
                error: error.message || 'Erreur lors de la génération du plan'
            });
        }
    }

    // ================================================================
    // GÉNÉRATION PLAN STRATÉGIQUE LONG TERME (12 SEMAINES EN 3 PHASES)
    // ================================================================
    if (action === 'generate-longterm-plan') {
      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      
      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ 
          error: 'Anthropic API key not configured. Get it at console.anthropic.com' 
        });
      }

      const { startWeek, year, phase = 1 } = req.body; // phase: 1, 2 ou 3

      // Récupérer le prompt validé depuis la config
      let promptConfig = '';
      try {
        const configPath = path.join(process.cwd(), 'config', 'PROMPT_CLAUDE_BASE.md');
        promptConfig = fs.readFileSync(configPath, 'utf-8');
        // console.log('✅ Configuration prompt chargée depuis config/PROMPT_CLAUDE_BASE.md');
      } catch (err) {
        // console.log('⚠️ Fichier config prompt non trouvé, utilisation prompt par défaut');
      }

      // Récupérer règles éthiques depuis DB
      let reglesEthiques = '';
      try {
        const { data: regles } = await supabase
          .from('cm_ai_ethique_regles')
          .select('*')
          .eq('actif', true)
          .order('severite', { ascending: false });
        
        if (regles && regles.length > 0) {
          reglesEthiques = `\n\n⚖️ RÈGLES ÉTHIQUES ACTIVES (RESPECT ABSOLU) :\n${regles.map(r => 
            `${r.categorie.toUpperCase()} [${r.severite}] : ${r.regle}${r.exemples_mauvais?.length ? `\n   ❌ Exemples interdits : ${r.exemples_mauvais.join(', ')}` : ''}`
          ).join('\n\n')}`;
        }
      } catch (err) {
        // console.log('⚠️ Règles éthiques non chargées (table peut-être pas créée)');
      }

      // Récupérer l'historique des actions archivées avec métriques
      let contextHistory = '';
      try {
        const { data: archived } = await supabase
          .from('cm_ai_actions')
          .select('titre, type, metriques, plateforme_publie, notes_performance')
          .eq('archive', true)
          .not('metriques', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (archived && archived.length > 0) {
          // Calculer les meilleures actions par leads
          const sorted = archived.sort((a, b) => (b.metriques?.leads || 0) - (a.metriques?.leads || 0));
          const topPerformers = sorted.slice(0, 10);
          
          contextHistory = `\n\n📊 APPRENTISSAGE DES SEMAINES PASSÉES (10 meilleures actions) :
${topPerformers.map(a => {
  const m = a.metriques || {};
  return `✅ ${a.type} - "${a.titre}" [${a.plateforme_publie || 'N/A'}]
   → Vues: ${m.vues || 0} | Leads: ${m.leads || 0} | Engagement: ${(m.likes || 0) + (m.commentaires || 0)}
   ${a.notes_performance ? `💡 Note: ${a.notes_performance}` : ''}`;
}).join('\n\n')}

🎯 INSIGHTS À APPLIQUER :
- Plateforme la plus performante: ${getMostPerformingPlatform(archived)}
- Type de contenu le plus efficace: ${getMostPerformingType(archived)}
- Moyenne leads/action: ${(archived.reduce((sum, a) => sum + (a.metriques?.leads || 0), 0) / archived.length).toFixed(1)}
- Taux engagement moyen: ${(archived.reduce((sum, a) => {
  const m = a.metriques || {};
  return sum + ((m.likes || 0) + (m.commentaires || 0)) / (m.vues || 1);
}, 0) / archived.length * 100).toFixed(2)}%

⚠️ ADAPTE la nouvelle stratégie en fonction de ces performances réelles !`;
        }
      } catch (err) {
        // console.log('⚠️ Pas d\'historique disponible (normal si première utilisation):', err.message);
      }

      // Récupérer feedback précédents pour apprentissage
      let feedbackLearning = '';
      try {
        const { data: feedback } = await supabase
          .from('cm_ai_content_feedback')
          .select('type_feedback, raison, mots_problematiques, score_qualite')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (feedback && feedback.length > 0) {
          const rejets = feedback.filter(f => f.type_feedback === 'rejete' || f.type_feedback === 'signale_mensonge');
          if (rejets.length > 0) {
            feedbackLearning = `\n\n🚫 APPRENTISSAGE : Contenus rejetés précédemment (NE PAS RÉPÉTER) :\n${rejets.map(f => 
              `- Raison : ${f.raison}${f.mots_problematiques?.length ? `\n  Mots à éviter : ${f.mots_problematiques.join(', ')}` : ''}`
            ).join('\n')}`;
          }
        }
      } catch (err) {
        // console.log('⚠️ Feedback non chargé');
      }

      const planPrompt = `🎯 RÔLE : Directeur Marketing Growth de LiveOwnerUnit - SaaS Gestion Locative Premium

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 CONTEXTE PRODUIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 Produit : LiveOwnerUnit
💎 Promesse : Synchronisation TEMPS RÉEL multi-calendriers (Booking.com, Airbnb, VRBO, Google Calendar)
🎯 USP : ZÉRO double-booking garanti, Dashboard unifié, Automatisation complète
👤 Créateur : Loueur professionnel 15 ans d'expérience dans le Lot (CRÉDIBILITÉ TERRAIN)
🎖️ Positionnement : Solution PREMIUM vs concurrence gadget/gratuite
💰 Cible Prix : 29-49€/mois (valeur perçue : économise 2000-5000€/an en erreurs)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MARCHÉ CIBLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Segment 1 (70%) : Propriétaires 1-4 gîtes/locations saisonnières
   Pain points : Double-bookings fréquents, jonglage entre 5 plateformes, perte CA
   Pouvoir achat : Moyen-élevé (rentabilité gîte 15-40k€/an)

👥 Segment 2 (20%) : Petites agences immobilières 5-15 biens
   Pain points : Gestion manuelle calendriers, erreurs coûteuses, équipe débordée

👥 Segment 3 (10%) : Multipropriétaires 5+ locations
   Pain points : Scaling impossible sans outil, besoin dashboard pro

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 MISSION : PLAN STRATÉGIQUE 12 SEMAINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 PHASE 1 - DÉMARRAGE (Semaines 1-3)
Objectifs :
- Établir AUTORITÉ sur LinkedIn + Groupes Facebook gîtes
- 20 leads qualifiés
- 10k impressions/semaine
- 2-3 premiers clients (proof of concept)

Stratégies prioritaires :
✅ Storytelling BRUTAL problèmes vécus (double-bookings qui coûtent 2400€)
✅ Démonstrations vidéo 30s (synchronisation temps réel en action)
✅ Posts "J'ai testé tous les outils, voici pourquoi ils sont nuls"
✅ Ciblage hyper-précis : Groupes FB "Gestion gîtes", "Locations saisonnières France"

KPIs Critiques :
- Impressions : 2k → 10k progression
- Taux engagement : 2% → 5%
- Leads : 0 → 20
- Conversions : 0 → 3 clients
- Coût acquisition : 0€ (organique pur)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 PHASE 2 - CROISSANCE (Semaines 4-8)
Objectifs :
- Scaler 50 leads/semaine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 GÉNÉRATION : Phase ${phase}/3 (4 semaines)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${phase === 1 ? `
📅 PHASE 1 - DÉMARRAGE (Semaines 1-4)
Objectifs :
- Établir présence LinkedIn/Facebook Loueurs
- Premiers 5-10 leads qualifiés
- Valider message/problématique produit
- Créer premières 2-3 conversions gratuites BETA

Stratégies :
✅ Posts "pain points" loueurs (double-booking, perte CA, chronophage)
✅ Landing page simple + lead magnet (PDF checklist, calculateur ROI)
✅ Programme BETA gratuit (10 loueurs test, échange testimonial + feedback)
✅ DM outreach ciblé (groupes FB loueurs Lot/Dordogne/Cévennes)
✅ Storytelling fondateur : "Pourquoi j'ai créé LiveOwnerUnit après avoir perdu 2400€"

KPIs :
- Reach : 3000-5000 impressions
- Engagement : 2-3% taux
- Leads : 10 minimum
- Conversions BETA : 2-3 loueurs
- CAC : 0€ (acquisition organique)
` : phase === 2 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 PHASE 2 - CROISSANCE (Semaines 5-8)
Objectifs :
- Convertir BETA → payants (objectif 50% soit 1-2 premiers clients MRR)
- Scaler acquisition (20-30 leads/semaine)
- Automatiser email nurturing
- Partenariats offices tourisme Lot/Dordogne
- 15-20 clients actifs

Stratégies :
✅ Cas clients CONCRETS (ROI mesurable, temps gagné)
✅ Webinaires "Gestion locative 2026 : ce qui marche VRAIMENT"
✅ Promotions saisonnières (pré-haute-saison été)
✅ Retargeting LinkedIn Ads (budget 500€/mois si CAC < 150€)
✅ Programme ambassadeurs (clients = affiliés 20% commission)

KPIs :
- Leads : 20 → 200 cumulés
- Conversions : 3 → 20 clients
- Taux conversion : 5% → 10%
- MRR : 300€ → 1000€
- CAC : < 150€/client
` : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 PHASE 3 - STABILISATION (Semaines 9-12)
Objectifs :
- Pipeline acquisition AUTOMATISÉ 80%
- 30-40 clients actifs
- Churn < 3%/mois
- Upsell fonctionnalités premium

Stratégies :
✅ Contenu SEO (blog + vidéos YouTube)
✅ Programme affiliation loueurs
✅ Témoignages vidéo clients (avant/après)
✅ Optimisation A/B landing pages
✅ Email automation avancée (triggers comportementaux)

KPIs :
- MRR : 1000€ → 1800€
- LTV : +30%
- Churn : < 3%
- NPS : > 60
- ROI Marketing : > 300%
`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CONTRAINTES IMPÉRATIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TON COMMUNICATION : Tu ES un loueur qui parle à des loueurs
   ❌ INTERDIT : "révolutionnaire", "disruptif", "game-changer", bullshit startup
   ✅ OBLIGATOIRE : Ton direct, problèmes réels, chiffres concrets, crédibilité terrain

2. STORYTELLING : Chaque contenu = histoire vécue
   Exemple : "Samedi 3h du mat, un client m'appelle furieux. Double-booking. -2400€. J'ai créé LiveOwnerUnit."

3. PREUVES SOCIALES : Chiffres mesurables uniquement
   ❌ "Augmentez vos revenus"  
   ✅ "+2400€/an économisés en moyenne (clients 2025)"

4. SAISONNALITÉ : Adapter urgence selon période
   - Janv-Mars : Anticipation haute saison
   - Avril-Juin : URGENCE maximale (bookings été)
   - Juillet-Sept : Gestion crise / stabilité
   - Oct-Déc : Bilan année / prépa 2027

5. APPELS À L'ACTION : Toujours LOW-FRICTION
   ❌ "Abonnez-vous maintenant"  
   ✅ "Testez 14 jours gratuit, annulez en 1 clic"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ FORMAT RÉPONSE SIMPLIFIÉ (JSON STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "plan_global": {
    "vision_3_mois": "Devenir référence gestion locative",
    "objectifs_finaux": {
      "leads_qualifies": 250,
      "clients_signes": 35,
      "mrr_cible": "1800€"
    }
  },
  "phase": ${phase},
  "semaines": [
    {
      "numero": ${(phase - 1) * 4 + 1},
      "objectif_principal": "Description courte objectif semaine",
      "cibles": ["Propriétaires 1-3 gîtes", "Loueurs débutants"],
      "themes": ["Pain point 1", "Pain point 2"],
      "actions": [
        {
          "type": "post_linkedin",
          "sujet": "Titre court accrocheur",
          "contenu_court": "3-4 lignes maximum texte prêt à poster"
        },
        {
          "type": "email_lead_magnet",
          "sujet": "Titre email",
          "lead_magnet": "PDF checklist ou calculateur"
        }
      ],
      "kpis": {
        "leads": {"cible": 10},
        "impressions": {"cible": 3000}
      }
    }
    // GÉNÉRER 3 AUTRES SEMAINES (${(phase - 1) * 4 + 2}, ${(phase - 1) * 4 + 3}, ${(phase - 1) * 4 + 4})
  ]
}
      ],
      "actions": [
        {
          "type": "post_linkedin",
          "sujet": "2400€ perdus en 2023 à cause d'un double-booking. Voici ce que j'ai construit.",
          "contenu_preview": "Samedi 14 juillet, 3h du matin. Mon téléphone sonne. \"Stéphane, il y a quelqu'un dans NOTRE gîte !\" 😱\n\nDouble-booking. Ma faute. J'avais oublié de bloquer Booking après une résa Airbnb.\n\nRésultat :\n❌ 2 familles furieuses\n❌ Remboursement intégral : -1200€ x2\n❌ Avis 1★ sur Booking\n❌ 6 mois pour réparer ma réputation\n\nCe jour-là, j'ai décidé de créer LiveOwnerUnit.\n\nPlus jamais ça. 👇",
          "format": "Carrousel 5 slides",
          "visuels": ["Screenshot calendrier bordélique", "Graphique perte CA", "Interface LiveOwnerUnit clean"],
          "call_to_action": "Commentez : quel est votre pire cauchemar en gestion locative ?",
          "heure_ideale": "Mardi 9h",
          "hashtags": ["#gestionlocative", "#gite", "#airbnb", "#booking"],
          "budget": "0€",
          "kpi_cible": "500 impressions, 25 engagements, 5 leads"
        },
        {
          "type": "post_facebook_groupes",
          "sujet": "Astuce : Comment je gère 3 gîtes sans JAMAIS de double-booking",
          "groupes_cibles": ["Gestion gîtes et chambres d'hôtes", "Locations saisonnières propriétaires"],
          "contenu_preview": "Salut à tous ! 👋\n\nProprio de 3 gîtes dans le Lot depuis 15 ans. Je vois souvent passer des galères de double-bookings ici.\n\nVoici mon système (gratuit à partager) :\n1. ✅ Calendrier maître unique\n2. ✅ Synchronisation AUTO toutes les 5 min\n3. ✅ Alertes si conflit détecté\n\nJ'ai automatisé tout ça avec un outil que j'ai créé. Si ça vous intéresse, je partage en MP (pas de spam promis).",
          "ton": "Entraide communautaire, pas vendeur",
          "call_to_action": "Répondez si vous galérez avec les calendriers",
          "budget": "0€",
          "kpi_cible": "50 vues, 10 commentaires, 3 DMs"
        },
        {
          "type": "promotion",
          "nom": "Offre Pionniers -40%",
          "code_promo": "PIONEER40",
          "valeur_reduction": 40,
          "type_reduction": "pourcentage",
          "cible": "20 premiers early adopters",
          "justification": "Créer urgence + obtenir ambassadeurs enthousiastes + feedback produit",
          "duree_jours": 10,
          "conditions": "Engagement 3 mois minimum",
          "budget": "0€ (manque à gagner : ~400€, compensé par testimonials)"
        },
        {
          "type": "email_sequence",
          "nom": "Nurturing Problème Double-Booking",
          "trigger": "Lead télécharge PDF comparatif",
          "nb_emails": 5,
          "timing": ["J0", "J+2", "J+5", "J+8", "J+12"],
          "sujets": [
            "Votre PDF + 1 astuce que 90% des loueurs ignorent",
            "Combien vous COÛTENT vraiment les doubles-bookings ?",
            "[Vidéo 2min] Comment LiveOwnerUnit évite ce cauchemar",
            "3 clients racontent leur pire galère (avant LOUnit)",
            "Offre spéciale -40% expire dans 48h ⏰"
          ],
          "kpi_cible": "Taux ouverture 35%, clics 15%, conversion 10%"
        }
      ],
      "kpis": {
        "impressions": {"cible": 3000, "min_acceptable": 1500},
        "engagement_taux": {"cible": 2.5, "min_acceptable": 1.5},
        "leads": {"cible": 10, "min_acceptable": 5},
        "conversions": {"cible": 1, "min_acceptable": 0},
        "cout_par_lead": {"max_acceptable": "0€"},
        "temps_investi": "8h/semaine"  
      },
      "apprentissages_a_mesurer": [
        "Quel pain point génère le plus d'engagement ? (double-booking vs chronophage vs perte CA)",
        "LinkedIn ou Facebook meilleur canal ?",
        "Taux conversion landing page réel",
        "Objections principales prospects (prix ? complexité ? confiance ?)"
      ]
    }
    // GÉNÉRER 3 AUTRES SEMAINES (${(phase - 1) * 4 + 2}, ${(phase - 1) * 4 + 3}, ${(phase - 1) * 4 + 4})
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ RÈGLES GÉNÉRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 4 semaines COURTES (pas de détails excessifs)
- 3-4 actions max par semaine
- Contenus: Titre + 2-3 lignes (pas de pavés)
- KPIs: 2-3 chiffres clés seulement
- JSON uniquement, aucun texte avant/après

Réponds AVEC LE JSON COMPLET.${reglesEthiques}`;

      const planResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 8000,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: planPrompt
          }]
        })
      });

      if (!planResponse.ok) {
        const error = await planResponse.json();
        throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
      }

      const planData = await planResponse.json();
      // Claude renvoie dans content[0].text, pas choices[0].message.content
      const planContent = planData.content[0].text;

      let cleanJSON = planContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsedPlan = JSON.parse(cleanJSON);
        return res.status(200).json({
          success: true,
          plan: parsedPlan,
          provider: 'Claude 3.5 Sonnet',
          tokens_used: planData.usage
        });
      } catch (parseError) {
        return res.status(200).json({
          success: true,
          plan: { raw: cleanJSON },
          error: 'JSON parsing failed, returning raw content'
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
        console.error('❌ JSON parse error:', parseError);
        return res.status(500).json({ error: 'Invalid JSON from OpenAI', raw: cleanJSON });
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ================================================================
// HELPERS POUR ANALYTICS
// ================================================================

function getMostPerformingPlatform(actions) {
  const platformLeads = {};
  actions.forEach(a => {
    const p = a.plateforme_publie || 'Autre';
    platformLeads[p] = (platformLeads[p] || 0) + (a.metriques?.leads || 0);
  });
  return Object.keys(platformLeads).reduce((a, b) => platformLeads[a] > platformLeads[b] ? a : b, 'N/A');
}

function getMostPerformingType(actions) {
  const typeLeads = {};
  actions.forEach(a => {
    const t = a.type || 'autre';
    typeLeads[t] = (typeLeads[t] || 0) + (a.metriques?.leads || 0);
  });
  return Object.keys(typeLeads).reduce((a, b) => typeLeads[a] > typeLeads[b] ? a : b, 'N/A');
}
