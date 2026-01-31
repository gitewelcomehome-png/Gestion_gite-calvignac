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
      
      // Construire le prompt selon le type de contenu
      const prompts = {
        'post': `Tu es un expert en social media. Crée un post ${tone} sur le sujet : "${subject}".
Points clés à inclure : ${keyPoints || 'N/A'}
Call-to-action : ${cta || 'N/A'}
Longueur : ${length === 'court' ? '100-150 mots' : length === 'moyen' ? '150-300 mots' : '300-500 mots'}
Format : Texte optimisé pour réseaux sociaux avec emojis pertinents.`,
        
        'email': `Tu es un expert en email marketing. Rédige un email ${tone} sur : "${subject}".
Points clés : ${keyPoints || 'N/A'}
Call-to-action : ${cta || 'N/A'}
Longueur : ${length === 'court' ? 'Concis (150 mots max)' : length === 'moyen' ? 'Standard (150-300 mots)' : 'Détaillé (300-500 mots)'}
Structure : Objet accrocheur + corps du message + CTA clair.`,
        
        'blog': `Tu es un expert en rédaction SEO. Écris un article de blog ${tone} sur : "${subject}".
Points clés : ${keyPoints || 'N/A'}
Call-to-action : ${cta || 'N/A'}
Longueur : ${length === 'court' ? '300-500 mots' : length === 'moyen' ? '500-800 mots' : '800-1200 mots'}
Structure : Titre H1 + introduction + sections H2 + conclusion.`,
        
        'newsletter': `Tu es un expert en newsletters. Crée une newsletter ${tone} sur : "${subject}".
Points clés : ${keyPoints || 'N/A'}
Call-to-action : ${cta || 'N/A'}
Longueur : ${length === 'court' ? '200-300 mots' : length === 'moyen' ? '300-500 mots' : '500-800 mots'}
Format : Sections claires + visuels suggérés + CTA engageant.`
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

      // Style mapping amélioré
      const stylePrompts = {
        'realistic': 'photorealistic, high quality, professional photography, 4k, detailed, sharp focus',
        'artistic': 'artistic illustration, creative, vibrant colors, digital art, trending on artstation',
        'minimal': 'minimalist design, clean, simple, modern, flat design, professional',
        'vintage': 'vintage style, retro aesthetic, nostalgic, old photograph, film grain'
      };

      const enhancedPrompt = `${prompt}. ${stylePrompts[style] || stylePrompts['realistic']}`;

      // ===== STABILITY AI (Stable Diffusion XL) - PAR DÉFAUT =====
      if (provider === 'stability') {
        const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
        
        if (!STABILITY_API_KEY) {
          return res.status(400).json({ 
            success: false,
            error: 'Stability AI API key not configured. Add STABILITY_API_KEY in Vercel environment variables or switch to DALL-E.' 
          });
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
              { text: enhancedPrompt, weight: 1 },
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
        error: 'Invalid provider. Use "stability" or "dalle".'
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

    return res.status(400).json({ error: 'Invalid action. Use: generate-text, generate-image, or optimize-seo' });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
}
