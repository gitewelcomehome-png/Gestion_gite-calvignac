# 📧 Guide d'import des emails dans la messagerie

## 🎯 Objectif

Le module Messagerie permet de centraliser vos communications avec les clients. Ce guide explique comment rapatrier vos emails existants.

## 📋 Méthodes d'import

### Méthode 1 : Import manuel via l'interface (recommandé pour débuter)

1. **Aller dans l'onglet Messagerie**
2. **Créer manuellement les emails importants** :
   - Utiliser le bouton "Nouveau Template" pour les réponses types
   - Saisir manuellement les emails des clients si nécessaire

### Méthode 2 : Import CSV vers Supabase

Si vous avez beaucoup d'emails à importer, créez un fichier CSV :

```csv
type,from_email,from_name,to_email,to_name,subject,body,reservation_id,status,created_at
received,client@example.com,Jean Dupont,contact@welcomehome.fr,Welcome Home,Demande de réservation,Bonjour je souhaite...,123,read,2024-01-15T10:00:00Z
sent,contact@welcomehome.fr,Welcome Home,client@example.com,Jean Dupont,Re: Demande de réservation,Bonjour Jean...,123,read,2024-01-15T14:00:00Z
```

**Importer dans Supabase :**
1. Ouvrir Supabase Dashboard
2. Aller dans la table `emails`
3. Cliquer sur "Insert" > "Import data from CSV"
4. Sélectionner votre fichier CSV

### Méthode 3 : Connexion IMAP/API Gmail (avancé)

Pour synchroniser automatiquement vos emails Gmail/Outlook, vous devrez :

#### Option A : Utiliser l'API Gmail

1. **Créer un projet Google Cloud**
   - Aller sur https://console.cloud.google.com
   - Créer un nouveau projet
   - Activer l'API Gmail

2. **Créer des credentials OAuth 2.0**
   - Ajouter votre domaine autorisé
   - Télécharger le fichier credentials.json

3. **Installer un script de synchronisation** (exemple Node.js)

```javascript
// sync-gmail.js
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');

async function syncGmail() {
    const auth = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );
    
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Récupérer les messages
    const res = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
        q: 'from:client@example.com OR to:client@example.com'
    });
    
    for (const message of res.data.messages) {
        const msg = await gmail.users.messages.get({
            userId: 'me',
            id: message.id
        });
        
        // Extraire les données
        const headers = msg.data.payload.headers;
        const from = headers.find(h => h.name === 'From')?.value;
        const to = headers.find(h => h.name === 'To')?.value;
        const subject = headers.find(h => h.name === 'Subject')?.value;
        const body = msg.data.snippet;
        
        // Insérer dans Supabase
        await supabase.from('emails').insert({
            type: to.includes('welcomehome') ? 'received' : 'sent',
            from_email: from,
            to_email: to,
            subject: subject,
            body: body,
            created_at: new Date(parseInt(msg.data.internalDate)).toISOString(),
            status: 'read'
        });
    }
}

syncGmail();
```

#### Option B : Webhook Zapier/Make (plus simple)

1. **Créer un compte Zapier** (gratuit pour 100 tâches/mois)

2. **Créer un Zap :**
   - Trigger: Gmail > New Email
   - Filter: Uniquement emails clients (contient @booking.com, @airbnb.com, etc.)
   - Action: Webhooks > POST Request
     - URL: Votre fonction Supabase Edge Function
     - Payload: Données de l'email

3. **Créer une Edge Function Supabase** pour recevoir le webhook :

```typescript
// supabase/functions/import-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { from, to, subject, body, date } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { data, error } = await supabase
    .from('emails')
    .insert({
      type: to.includes('welcomehome') ? 'received' : 'sent',
      from_email: from,
      to_email: to,
      subject: subject,
      body: body,
      created_at: new Date(date).toISOString(),
      status: 'unread'
    })
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

## 🔄 Synchronisation continue

### Option simple : Transfert automatique Gmail

1. **Dans Gmail, créer un filtre :**
   - Paramètres > Filtres et adresses bloquées
   - Créer un filtre : `from:(client1@example.com OR client2@example.com)`
   - Cocher "Transférer à" → votre webhook Zapier

### Option avancée : Polling régulier

Créer un cron job qui vérifie les nouveaux emails toutes les 15 minutes :

```javascript
// Dans index.html, ajouter :
setInterval(async () => {
    // Appeler votre API de synchronisation
    await fetch('/api/sync-emails');
}, 15 * 60 * 1000); // 15 minutes
```

## 📝 Recommandation pour démarrer

**Pour commencer simplement :**

1. ✅ **Utiliser les templates pré-configurés** pour les nouvelles communications
2. ✅ **Importer manuellement** les 10-20 emails les plus importants via l'interface
3. ✅ **Copier-coller** les emails clients directement dans Supabase si besoin

**Plus tard (optionnel) :**
- 🔄 Configurer Zapier pour synchronisation automatique
- 📧 Connecter l'API Gmail pour import historique
- 🤖 Automatiser complètement avec Edge Functions

## 🎯 Focus sur l'essentiel

**La messagerie est avant tout un outil pour :**
- 📋 Gérer les templates de réponses
- ⚡ Répondre rapidement avec des messages pré-écrits
- 🔗 Lier les communications aux réservations

**Ne perdez pas de temps à importer tout votre historique !**
Concentrez-vous sur les communications futures et les templates automatiques.

## 💡 Exemple d'utilisation optimale

1. **Client envoie un email** → Vous le copiez manuellement dans Messagerie (30 secondes)
2. **Vous cliquez "Répondre"** → Choisissez un template approprié
3. **Personnalisez avec les variables** → {{client_name}}, {{gite}}, etc.
4. **Envoyez depuis votre vraie boîte email** (Gmail/Outlook)
5. **Copiez la réponse envoyée** dans Messagerie pour historique

Cette méthode manuelle est largement suffisante pour la plupart des gîtes !

## 🆘 Support

Si vous souhaitez une intégration automatique complète, cela nécessite :
- Un développeur pour configurer l'API Gmail ou Zapier
- Environ 2-4 heures de développement
- Budget estimé : 200-400€ pour une intégration professionnelle

**Pour l'instant, privilégiez l'utilisation des templates qui vous feront gagner énormément de temps ! 🚀**
