// ================================================================
// 📱 API PUBLICATION RÉSEAUX SOCIAUX
// ================================================================
// Intégration Meta Business Suite, LinkedIn, X (Twitter)
// ================================================================

export default async function handler(req, res) {
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
    const { action, platform, content, imageUrl, accessToken } = req.body;

    // ================================================================
    // PUBLICATION FACEBOOK/INSTAGRAM (Meta Business Suite)
    // ================================================================
    if (action === 'publish' && (platform === 'facebook' || platform === 'instagram')) {
      
      const pageId = process.env.META_PAGE_ID;
      const token = accessToken || process.env.META_ACCESS_TOKEN;

      if (!pageId || !token) {
        return res.status(500).json({
          error: 'Meta credentials not configured. Add META_PAGE_ID and META_ACCESS_TOKEN to environment variables.'
        });
      }

      // Publication sur Facebook Page
      if (platform === 'facebook') {
        const fbUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
        
        const payload = {
          message: content,
          access_token: token
        };

        if (imageUrl) {
          payload.link = imageUrl;
        }

        const fbResponse = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!fbResponse.ok) {
          const error = await fbResponse.json();
          throw new Error(`Facebook API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await fbResponse.json();

        return res.status(200).json({
          success: true,
          platform: 'facebook',
          postId: data.id,
          url: `https://facebook.com/${data.id}`
        });
      }

      // Publication sur Instagram Business Account
      if (platform === 'instagram') {
        const igAccountId = process.env.META_IG_ACCOUNT_ID;

        if (!igAccountId) {
          return res.status(500).json({
            error: 'Instagram Account ID not configured. Add META_IG_ACCOUNT_ID.'
          });
        }

        // Étape 1: Créer le conteneur média
        const containerUrl = `https://graph.facebook.com/v18.0/${igAccountId}/media`;
        
        const containerPayload = {
          image_url: imageUrl,
          caption: content,
          access_token: token
        };

        const containerResponse = await fetch(containerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(containerPayload)
        });

        if (!containerResponse.ok) {
          const error = await containerResponse.json();
          throw new Error(`Instagram container error: ${error.error?.message}`);
        }

        const containerData = await containerResponse.json();
        const creationId = containerData.id;

        // Étape 2: Publier le conteneur
        const publishUrl = `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`;
        
        const publishResponse = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: token
          })
        });

        if (!publishResponse.ok) {
          const error = await publishResponse.json();
          throw new Error(`Instagram publish error: ${error.error?.message}`);
        }

        const publishData = await publishResponse.json();

        return res.status(200).json({
          success: true,
          platform: 'instagram',
          postId: publishData.id,
          url: `https://instagram.com/p/${publishData.id}`
        });
      }
    }

    // ================================================================
    // PUBLICATION LINKEDIN
    // ================================================================
    if (action === 'publish' && platform === 'linkedin') {
      
      const personUrn = process.env.LINKEDIN_PERSON_URN; // Format: urn:li:person:XXXXX
      const token = accessToken || process.env.LINKEDIN_ACCESS_TOKEN;

      if (!personUrn || !token) {
        return res.status(500).json({
          error: 'LinkedIn credentials not configured. Add LINKEDIN_PERSON_URN and LINKEDIN_ACCESS_TOKEN.'
        });
      }

      const linkedinUrl = 'https://api.linkedin.com/v2/ugcPosts';

      const payload = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Si image fournie, upload via Media API (processus complexe)
      // Pour simplifier, on poste du texte uniquement ici

      const linkedinResponse = await fetch(linkedinUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(payload)
      });

      if (!linkedinResponse.ok) {
        const error = await linkedinResponse.json();
        throw new Error(`LinkedIn API error: ${error.message || 'Unknown error'}`);
      }

      const data = await linkedinResponse.json();

      return res.status(200).json({
        success: true,
        platform: 'linkedin',
        postId: data.id,
        url: `https://linkedin.com/feed/update/${data.id}`
      });
    }

    // ================================================================
    // PUBLICATION X (TWITTER)
    // ================================================================
    if (action === 'publish' && platform === 'twitter') {
      
      const bearerToken = accessToken || process.env.TWITTER_BEARER_TOKEN;

      if (!bearerToken) {
        return res.status(500).json({
          error: 'Twitter/X credentials not configured. Add TWITTER_BEARER_TOKEN.'
        });
      }

      const twitterUrl = 'https://api.twitter.com/2/tweets';

      const payload = {
        text: content
      };

      const twitterResponse = await fetch(twitterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!twitterResponse.ok) {
        const error = await twitterResponse.json();
        throw new Error(`Twitter API error: ${error.title || 'Unknown error'}`);
      }

      const data = await twitterResponse.json();

      return res.status(200).json({
        success: true,
        platform: 'twitter',
        tweetId: data.data.id,
        url: `https://twitter.com/i/web/status/${data.data.id}`
      });
    }

    // ================================================================
    // OBTENIR TOKEN D'ACCÈS
    // ================================================================
    if (action === 'get-auth-url') {
      const { platform } = req.body;

      const authUrls = {
        facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.APP_URL}/callback/facebook&scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish`,
        
        linkedin: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.APP_URL}/callback/linkedin&scope=w_member_social`,
        
        twitter: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${process.env.APP_URL}/callback/twitter&scope=tweet.read%20tweet.write%20users.read&code_challenge=challenge&code_challenge_method=plain`
      };

      return res.status(200).json({
        success: true,
        authUrl: authUrls[platform] || null
      });
    }

    return res.status(400).json({ 
      error: 'Invalid action or platform. Supported: facebook, instagram, linkedin, twitter' 
    });

  } catch (error) {
    console.error('❌ Social API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
}
