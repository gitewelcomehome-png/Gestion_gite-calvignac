# 🤖 Intégration IA pour Gestion Automatique des Emails

## 🎯 Objectif

Utiliser une IA (comme ChatGPT, Claude, ou Gemini) pour générer automatiquement des réponses aux emails clients simples.

## 🌟 Cas d'usage

L'IA peut gérer automatiquement :
- ✅ Questions sur les horaires d'arrivée/départ
- ✅ Demandes d'informations pratiques (parking, accès, équipements)
- ✅ Confirmations de réservation
- ✅ Questions simples sur la localisation
- ❌ **PAS** les négociations de prix (intervention humaine requise)
- ❌ **PAS** les réclamations complexes (intervention humaine requise)

## 📋 Solutions disponibles

### Option 1 : OpenAI GPT-4 (Recommandé) 💰 ~$20/mois

**Avantages :**
- API simple et puissante
- Excellent en français
- Bonne compréhension du contexte
- Pas de limite de requêtes avec abonnement

**Coût estimé :**
- API Pay-as-you-go : ~$0.01 par email traité
- Pour 100 emails/mois : ~$1
- Pour 1000 emails/mois : ~$10

**Implémentation :**

```javascript
// js/ai-email-assistant.js
const OPENAI_API_KEY = 'votre-clé-api'; // À stocker dans Supabase secrets

async function generateAIResponse(emailBody, emailSubject, reservationData) {
    const context = `
Tu es l'assistant de gestion de gîtes "Welcome Home" à Trévoux et Calvignac.

Informations sur les gîtes:
- Trévoux: Adresse, code accès, équipements...
- Calvignac: Adresse, code accès, équipements...

Réservation concernée:
${reservationData ? JSON.stringify(reservationData, null, 2) : 'Aucune réservation liée'}

Email reçu:
Sujet: ${emailSubject}
Message: ${emailBody}

Génère une réponse professionnelle, chaleureuse et en français.
Si la question nécessite une intervention humaine (prix, réclamation), indique: [INTERVENTION_HUMAINE_REQUISE]
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'Tu es un assistant professionnel pour la gestion de gîtes.' },
                { role: 'user', content: context }
            ],
            temperature: 0.7,
            max_tokens: 500
        })
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Vérifier si intervention humaine requise
    if (aiResponse.includes('[INTERVENTION_HUMAINE_REQUISE]')) {
        return {
            needsHumanReview: true,
            suggestedResponse: aiResponse.replace('[INTERVENTION_HUMAINE_REQUISE]', '').trim()
        };
    }
    
    return {
        needsHumanReview: false,
        suggestedResponse: aiResponse
    };
}

// Intégrer dans la messagerie
async function handleIncomingEmail(email) {
    // Récupérer la réservation liée si existe
    let reservationData = null;
    if (email.reservation_id) {
        const { data } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', email.reservation_id)
            .single();
        reservationData = data;
    }
    
    // Générer la réponse IA
    const aiResult = await generateAIResponse(
        email.body,
        email.subject,
        reservationData
    );
    
    if (aiResult.needsHumanReview) {
        // Créer une alerte pour l'utilisateur
        await supabase.from('todos').insert({
            category: 'reservations',
            title: `⚠️ Email nécessite votre attention`,
            description: `De: ${email.from_name}\nSujet: ${email.subject}`,
            completed: false
        });
    } else {
        // Sauvegarder la réponse suggérée
        await supabase.from('email_drafts').insert({
            email_id: email.id,
            suggested_body: aiResult.suggestedResponse,
            ai_confidence: 'high',
            status: 'pending_review'
        });
    }
}
```

### Option 2 : Claude AI (Anthropic) 🚀 Meilleur en français

**Avantages :**
- Excellent en français (meilleur que GPT-4)
- Très bon en compréhension de contexte
- Plus éthique et sûr

**Coût :**
- $0.008 par 1000 tokens (~$0.01 par email)
- Pour 100 emails/mois : ~$1

**Implémentation similaire à OpenAI :**

```javascript
async function generateClaudeResponse(emailBody, emailSubject, reservationData) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'votre-clé-api',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: `[Même contexte que GPT-4]`
            }]
        })
    });

    const data = await response.json();
    return data.content[0].text;
}
```

### Option 3 : Gemini (Google) 🆓 Gratuit jusqu'à 60 requêtes/minute

**Avantages :**
- GRATUIT pour usage modéré
- Bon en français
- Facile à intégrer

**Implémentation :**

```javascript
async function generateGeminiResponse(emailBody, emailSubject) {
    const GEMINI_API_KEY = 'votre-clé-api';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `[Contexte et email]`
                }]
            }]
        })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
```

## 🔧 Implémentation dans votre application

### Étape 1 : Créer une table pour les brouillons IA

```sql
-- sql/create_email_drafts_table.sql
CREATE TABLE IF NOT EXISTS email_drafts (
    id BIGSERIAL PRIMARY KEY,
    email_id BIGINT REFERENCES emails(id),
    suggested_subject TEXT,
    suggested_body TEXT,
    ai_provider VARCHAR(20), -- 'openai', 'claude', 'gemini'
    ai_confidence VARCHAR(20), -- 'high', 'medium', 'low'
    status VARCHAR(20) DEFAULT 'pending_review', -- 'pending_review', 'approved', 'rejected', 'modified'
    human_modified_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_drafts_status ON email_drafts(status);
CREATE INDEX IF NOT EXISTS idx_email_drafts_email ON email_drafts(email_id);
```

### Étape 2 : Ajouter un bouton "Générer réponse IA" dans l'interface

```javascript
// Dans js/messagerie.js, ajouter à la fonction displayEmails:

html += `
    <div style="display: flex; gap: 8px; align-items: center;">
        <button onclick="generateAIResponseForEmail(${email.id})" 
                class="btn" 
                style="background: #9B59B6; color: white; padding: 6px 12px; border: none; border-radius: 6px; font-size: 0.85rem;">
            🤖 Réponse IA
        </button>
        ${email.type === 'received' ? '<button onclick="replyToEmail(event, ' + email.id + ')">↩️ Répondre</button>' : ''}
    </div>
`;
```

### Étape 3 : Créer la fonction de génération

```javascript
// js/ai-email-assistant.js (nouveau fichier)

async function generateAIResponseForEmail(emailId) {
    // Afficher un loader
    showLoader('Génération de la réponse IA...');
    
    try {
        // Récupérer l'email
        const { data: email } = await supabase
            .from('emails')
            .select('*')
            .eq('id', emailId)
            .single();
        
        // Récupérer les infos réservation si liée
        let reservationData = null;
        if (email.reservation_id) {
            const { data } = await supabase
                .from('reservations')
                .select('*')
                .eq('id', email.reservation_id)
                .single();
            reservationData = data;
        }
        
        // Appeler l'API IA (choisir votre provider)
        const aiResponse = await generateGeminiResponse(email.body, email.subject, reservationData);
        
        // Sauvegarder le brouillon
        const { data: draft } = await supabase
            .from('email_drafts')
            .insert({
                email_id: emailId,
                suggested_body: aiResponse,
                ai_provider: 'gemini',
                ai_confidence: 'medium',
                status: 'pending_review'
            })
            .select()
            .single();
        
        // Afficher le brouillon dans un modal pour validation
        showDraftModal(draft, email);
        
    } catch (error) {
        console.error('Erreur génération IA:', error);
        alert('❌ Erreur lors de la génération de la réponse IA');
    } finally {
        hideLoader();
    }
}

function showDraftModal(draft, originalEmail) {
    const modal = document.getElementById('draftModal');
    document.getElementById('draftSubject').value = `Re: ${originalEmail.subject}`;
    document.getElementById('draftBody').value = draft.suggested_body;
    document.getElementById('draftId').value = draft.id;
    modal.style.display = 'flex';
}
```

### Étape 4 : Ajouter l'interface de validation

```html
<!-- Dans tabs/tab-messagerie.html -->

<!-- Modal Brouillon IA -->
<div id="draftModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
    <div style="background: white; padding: 32px; border-radius: 12px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h3 style="margin: 0;">🤖 Réponse générée par IA</h3>
            <button onclick="closeDraftModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">✕</button>
        </div>
        
        <div style="background: #E8F5E9; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <strong>💡 Conseil :</strong> Vérifiez et personnalisez la réponse avant envoi !
        </div>
        
        <input type="hidden" id="draftId">
        
        <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Sujet</label>
            <input type="text" id="draftSubject" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        
        <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Message</label>
            <textarea id="draftBody" rows="12" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; resize: vertical;"></textarea>
        </div>
        
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button onclick="rejectDraft()" class="btn" style="background: #E74C3C; color: white; padding: 10px 20px; border: none; border-radius: 6px;">❌ Rejeter</button>
            <button onclick="modifyDraft()" class="btn" style="background: #F39C12; color: white; padding: 10px 20px; border: none; border-radius: 6px;">✏️ Modifier</button>
            <button onclick="approveDraft()" class="btn" style="background: #27AE60; color: white; padding: 10px 20px; border: none; border-radius: 6px;">✅ Approuver & Envoyer</button>
        </div>
    </div>
</div>
```

## 💰 Comparatif des coûts

| Provider | Coût pour 100 emails/mois | Coût pour 1000 emails/mois | Qualité FR |
|----------|---------------------------|----------------------------|------------|
| **Gemini** (Google) | GRATUIT | GRATUIT (jusqu'à 1800/mois) | ⭐⭐⭐ |
| **Claude** (Anthropic) | ~$1 | ~$10 | ⭐⭐⭐⭐⭐ |
| **GPT-4** (OpenAI) | ~$1 | ~$10 | ⭐⭐⭐⭐ |

## 🎯 Recommandation

### Pour démarrer : **Gemini (Gratuit)** ✅
- Configuration la plus simple
- Gratuit jusqu'à 60 requêtes/minute
- Largement suffisant pour un gîte

### Pour professionnaliser : **Claude** 🚀
- Meilleur en français
- Très bon contexte de conversation
- ~$1-2/mois pour usage normal

## 📝 Guide d'installation rapide

### 1. Obtenir une clé API Gemini (GRATUIT)

1. Aller sur https://makersuite.google.com/app/apikey
2. Créer une clé API
3. Copier la clé

### 2. Stocker la clé dans Supabase (sécurisé)

```sql
-- Dans Supabase SQL Editor
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (key, value) VALUES ('gemini_api_key', 'VOTRE_CLÉ_ICI');
```

### 3. Ajouter le script dans index.html

```html
<script src="js/ai-email-assistant.js"></script>
```

### 4. Tester !

1. Aller dans Messagerie
2. Cliquer sur un email reçu
3. Cliquer "🤖 Réponse IA"
4. Vérifier et envoyer !

## ⚠️ Points d'attention

- **Toujours relire** : L'IA peut faire des erreurs
- **Données sensibles** : Ne jamais partager de mots de passe/codes d'accès sensibles
- **Limites** : L'IA ne remplace pas l'humain pour les cas complexes
- **RGPD** : Les données envoyées aux APIs IA sortent de l'UE (sauf si hébergement spécifique)

## 🆘 Besoin d'aide ?

Si vous souhaitez que j'implémente cette fonctionnalité complète, cela nécessite :
- Création du système de brouillons
- Intégration API Gemini (gratuit)
- Interface de validation
- Tests

**Temps estimé : 3-4 heures de développement**
**Coût : GRATUIT si vous utilisez Gemini**

Voulez-vous que je crée les fichiers complets ? 🚀
