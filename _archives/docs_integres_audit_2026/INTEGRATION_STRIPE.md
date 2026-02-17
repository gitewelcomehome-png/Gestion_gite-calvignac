# 💳 Intégration Stripe pour les Abonnements

## 🎯 Vue d'ensemble

Système de gestion des abonnements avec 3 plans : **SOLO**, **DUO**, **QUATTRO**

### Plans disponibles

| Plan | Prix | Gîtes max | Fonctionnalités |
|------|------|-----------|----------------|
| 🌱 SOLO | 19€/mois | 1 | Calendrier, ménage, fiches clients |
| 🏘️ DUO | 39€/mois | 2 | SOLO + stats, fiscal, sync iCal |
| 🏆 QUATTRO | 69€/mois | 4 | DUO + exports, API, support premium |

## 📋 Architecture Stripe

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (options.html)              │
│  - Affichage des plans                                  │
│  - Boutons upgrade/downgrade                            │
│  - Historique de facturation                            │
└─────────────────────┬───────────────────────────────────┘
                      │ Clic "Upgrade"
                      ▼
┌─────────────────────────────────────────────────────────┐
│          Supabase Edge Function                         │
│          /stripe/create-checkout                        │
│  - Création session Checkout Stripe                     │
│  - Gestion upgrade/downgrade                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               Stripe Checkout Page                      │
│  - Formulaire de paiement sécurisé                      │
│  - Gestion 3D Secure (SCA)                              │
│  - Validation carte bancaire                            │
└─────────────────────┬───────────────────────────────────┘
                      │ Paiement réussi
                      ▼
┌─────────────────────────────────────────────────────────┐
│          Stripe Webhook                                 │
│          → Edge Function /stripe/webhook                │
│  - Mise à jour user_subscriptions                       │
│  - Changement status (active/canceled/past_due)         │
│  - Envoi email de confirmation                          │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Étapes d'intégration

### 1. Configuration Stripe

```bash
# Créer un compte Stripe : https://dashboard.stripe.com/register

# Installer Stripe CLI (optionnel, pour tests locaux)
brew install stripe/stripe-cli/stripe
stripe login

# Créer les produits et prix dans Stripe Dashboard
```

**Produits à créer dans Stripe :**

1. **Plan SOLO**
   - Prix : 19€/mois
   - billing_scheme : `per_unit`
   - recurring : `month`
   - metadata : `{plan_id: "solo", level: 1, max_gites: 1}`

2. **Plan DUO**
   - Prix : 39€/mois
   - billing_scheme : `per_unit`
   - recurring : `month`
   - metadata : `{plan_id: "duo", level: 2, max_gites: 2}`

3. **Plan QUATTRO**
   - Prix : 69€/mois
   - billing_scheme : `per_unit`
   - recurring : `month`
   - metadata : `{plan_id: "quattro", level: 3, max_gites: 4}`

### 2. Variables d'environnement Supabase

Ajouter dans Supabase Dashboard → Project Settings → Edge Functions → Secrets :

```env
STRIPE_SECRET_KEY=sk_live_xxx (production) ou sk_test_xxx (test)
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_SOLO=price_xxx
STRIPE_PRICE_DUO=price_xxx
STRIPE_PRICE_QUATTRO=price_xxx
```

### 3. Créer les Edge Functions

#### A. Fonction `create-checkout`

```typescript
// supabase/functions/stripe-create-checkout/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const { userId, targetPlan } = await req.json()
    
    // Récupérer l'utilisateur depuis Supabase
    const { data: user } = await supabaseClient.auth.admin.getUserById(userId)
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }
    
    // Déterminer le prix Stripe selon le plan
    const priceIds = {
      solo: Deno.env.get('STRIPE_PRICE_SOLO'),
      duo: Deno.env.get('STRIPE_PRICE_DUO'),
      quattro: Deno.env.get('STRIPE_PRICE_QUATTRO'),
    }
    
    const priceId = priceIds[targetPlan]
    
    // Créer ou récupérer le customer Stripe
    let customerId = user.user_metadata?.stripe_customer_id
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: userId,
        },
      })
      customerId = customer.id
      
      // Sauvegarder le customer ID dans Supabase
      await supabaseClient.auth.admin.updateUserById(userId, {
        user_metadata: { stripe_customer_id: customerId }
      })
    }
    
    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/pages/options.html?success=true`,
      cancel_url: `${req.headers.get('origin')}/pages/options.html?canceled=true`,
      metadata: {
        user_id: userId,
        plan_id: targetPlan,
      },
    })
    
    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

#### B. Fonction `webhook`

```typescript
// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
  
  // Gérer les événements
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      
      // Récupérer la subscription
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      
      // Mettre à jour Supabase
      const { error } = await supabaseClient
        .from('user_subscriptions')
        .upsert({
          user_id: session.metadata.user_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          plan_id: session.metadata.plan_id,
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
        })
      
      if (error) console.error('Error updating subscription:', error)
      break
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      
      await supabaseClient
        .from('user_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
      
      break
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      await supabaseClient
        .from('user_subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      
      break
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      
      // Enregistrer la facture dans la BDD (optionnel)
      // Envoyer email de confirmation (optionnel)
      
      break
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      
      // Envoyer email d'alerte paiement échoué
      
      break
    }
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 4. Déployer les Edge Functions

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref YOUR_PROJECT_REF

# Déployer les fonctions
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-webhook
```

### 5. Configurer le Webhook Stripe

1. Aller dans Stripe Dashboard → Developers → Webhooks
2. Ajouter un endpoint : `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Sélectionner les événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copier le signing secret et l'ajouter dans Supabase Edge Functions secrets

### 6. Mettre à jour le Frontend

Remplacer dans `pages/options.html` le `alert()` temporaire par :

```javascript
async function handleSubscriptionAction(targetPlan) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        alert('⚠️ Vous devez être connecté');
        return;
    }
    
    // ... validation du plan ...
    
    try {
        // Appeler l'Edge Function
        const response = await fetch(
            'https://YOUR_PROJECT.supabase.co/functions/v1/stripe-create-checkout',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.supabaseClient.auth.session().access_token}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    targetPlan: targetPlan,
                }),
            }
        );
        
        const { url, error } = await response.json();
        
        if (error) throw new Error(error);
        
        // Rediriger vers Stripe Checkout
        window.location.href = url;
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('⚠️ Une erreur est survenue. Veuillez réessayer.');
    }
}
```

## 📊 Schéma de la BDD

Les tables `user_subscriptions` et `subscriptions_plans` existent déjà. Vérifier les colonnes :

```sql
-- user_subscriptions
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub 
ON user_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer 
ON user_subscriptions(stripe_customer_id);
```

## 🧪 Tests

### Mode Test Stripe

1. Utiliser les clés de test (`sk_test_xxx`)
2. Cartes de test :
   - **Succès** : `4242 4242 4242 4242`
   - **Échec** : `4000 0000 0000 0002`
   - **3D Secure** : `4000 0025 0000 3155`
3. CVV : n'importe quel 3 chiffres
4. Date : n'importe quelle date future

### Tester les webhooks localement

```bash
# Installer Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Dans un autre terminal
stripe trigger checkout.session.completed
```

## 🚀 Mise en production

1. ✅ Vérifier que les 3 plans sont créés dans Stripe (mode Live)
2. ✅ Copier les `price_id` live dans les secrets Supabase
3. ✅ Configurer le webhook avec l'URL de production
4. ✅ Tester avec une vraie carte (puis annuler immédiatement)
5. ✅ Vérifier les logs Stripe et Supabase

## 💡 Fonctionnalités futures

- [ ] Customer Portal Stripe (gérer soi-même son abonnement)
- [ ] Essai gratuit 14 jours
- [ ] Codes promo / coupons
- [ ] Abonnement annuel (-20%)
- [ ] Facturation en équipe (plusieurs utilisateurs)
- [ ] Analytics Stripe (MRR, churn, LTV)

## 📚 Ressources

- [Stripe Docs - Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Docs - Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe API Reference](https://stripe.com/docs/api)
