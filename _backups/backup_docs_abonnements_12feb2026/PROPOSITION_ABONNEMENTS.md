# 📊 PROPOSITION SYSTÈME D'ABONNEMENTS - Gestion Gîte Calvignac

## 🎯 Vue d'ensemble

Système d'abonnements multi-niveaux pour monétiser votre plateforme SaaS de gestion de gîtes.
**Pas de plan gratuit** - Modèle payant dès le départ avec 14 jours d'essai.

---

## 💰 NIVEAUX D'ABONNEMENTS (3 plans)

### 🎯 **SOLO** - 10€/mois (avec engagement) ou 15€/mois (sans engagement)
**Objectif** : Parfait pour démarrer avec 1 gîte

**Fonctionnalités incluses :**
- ✅ **Calendrier multi-plateformes** : Synchronisation Airbnb, Booking, Abritel

, etc.
- ✅ **Planning ménage automatique** : Organisation complète des nettoyages
- ✅ **Fiscalité LMNP complète** : Calculs LMNP/LMP/Micro-BIC avec comparateur
- ✅ **Fiche voyageur QR WiFi** : Fiches clients avec QR codes
- ✅ **Analytics & stats** : Taux d'occupation, CA, statistiques
- ✅ **Support email** : Réponse sous 48h ouvrées
- ✅ **Dashboard complet** : Vue d'ensemble en temps réel
- ✅ **Gestion draps/stock** : Inventaire et rotations
- ✅ **Réservations illimitées** : Pas de limite de réservations

**Limitations :**
- 1 gîte maximum
- Pas d'accès IA

**Prix :**
- 🔒 **Avec engagement 12 mois** : 10€/mois (120€/an) - **Économie 60€/an**
- ⌛ **Sans engagement** : 15€/mois (180€/an)

---

### ⭐ **DUO** - 15€/mois (avec engagement) ou 22€/mois (sans engagement)
**Objectif** : Le plus populaire - Pour développer avec 2 gîtes

**Fonctionnalités incluses :**
- ✅ **Tout Solo +**
- ✅ **2 gîtes synchronisés** : Gestion multi-propriétés
- ✅ **Vue multi-propriétés** : Dashboard consolidé
- ✅ **Équipe ménage multi-sites** : Planning centralisé
- ✅ **🤖 Aide IA** : Assistant intelligent pour vous aider dans vos tâches
- ✅ **Support email prioritaire** : Réponse sous 24h ouvrées
- ✅ **Formation vidéo** : Tutoriels complets

**Limitations :**
- 2 gîtes maximum

**Prix :**
- 🔒 **Avec engagement 12 mois** : 15€/mois (180€/an) - **Économie 84€/an**
- ⌛ **Sans engagement** : 22€/mois (264€/an)

---

### 💼 **QUATTRO** - 23€/mois (avec engagement) ou 33€/mois (sans engagement)
**Objectif** : Pour les pros avec 4 gîtes

**Fonctionnalités incluses :**
- ✅ **Tout Duo +**
- ✅ **4 gîtes synchronisés** : Gestion portfolio complet
- ✅ **🤖 Communication/Conseil IA** : Messages et conseils personnalisés envoyés par IA
- ✅ **API connexions custom** : Intégration avec vos outils
- ✅ **Tableaux de bord avancés** : Analytics poussés
- ✅ **Support VIP** : Email 4h ouvrées + RDV téléphone + WhatsApp Business
- ✅ **Formation 1h perso** : Coaching personnalisé

**Limitations :**
- 4 gîtes maximum

**Prix :**
- 🔒 **Avec engagement 12 mois** : 23€/mois (276€/an) - **Économie 120€/an**
- ⌛ **Sans engagement** : 33€/mois (396€/an)

---

## ⚠️ NOTE : PLANS GÎTES DE FRANCE

Les abonnements **Gîtes de France** sont des **accords spéciaux négociés directement** avec la plateforme.
Ils **ne sont pas affichés publiquement** sur la page tarifaire et nécessitent :
- Contact direct avec l'administrateur
- Vérification de l'adhésion Gîtes de France
- Attribution manuelle d'un plan personnalisé

**Process :**
1. Client adhérent GDF me contacte
2. Validation justificatif adhésion
3. Négociation tarif spécial
4. Attribution plan custom avec features GDF activées

---

## �️ OPTION : AUTOMATISATION GÎTES DE FRANCE

**Disponibilité** : À partir du plan **DUO** (15€/mois)

**Activation** :
- Option activable dans les paramètres
- Vérification adhésion Gîtes de France (upload justificatif)
- Gratuit pour adhérents GDF ou inclus dans DUO/QUATTRO

**Fonctionnalités incluses :**
- ✅ **Badge "Gîtes de France"** sur fiches voyageurs
- ✅ **Export format Gîtes de France** : Rapports conformes au label
- ✅ **Critères qualité GDF** : Suivi des standards qualité du label
- ✅ **IA spécialisée GDF** (sur QUATTRO uniquement) : Communications adaptées
- ✅ **Templates spécifiques** : Messages pré-formatés selon standards GDF

**Process d'activation :**
1. Client active l'option dans "Paramètres > Gîtes de France"
2. Upload justificatif d'adhésion (carte adhérent, attestation)
3. Validation manuelle par admin
4. Activation des fonctionnalités GDF dans l'interface

---

## �🏗️ ARCHITECTURE TECHNIQUE

### 📋 Tables Supabase

#### **1. Table `subscriptions_plans`**
```sql
CREATE TABLE subscriptions_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'solo', 'duo', 'quattro'
  display_name TEXT NOT NULL, -- 'SOLO', 'DUO', 'QUATTRO'
  price_monthly DECIMAL(10,2) NOT NULL, -- Prix sans engagement
  price_monthly_committed DECIMAL(10,2) NOT NULL, -- Prix avec engagement 12 mois
  price_yearly DECIMAL(10,2), -- Prix annuel (12 mois)
  max_gites INTEGER DEFAULT 1,
  requires_commitment BOOLEAN DEFAULT false,
  allows_gdf_option BOOLEAN DEFAULT false, -- Permet l'option Gîtes de France
  features JSONB NOT NULL, -- Liste des features activées
  stripe_price_id_monthly TEXT,
  stripe_price_id_monthly_committed TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemple features JSONB pour SOLO :**
```json
{
  "dashboard": true,
  "reservations": true,
  "menage": true,
  "draps": true,
  "statistiques": true,
  "fiscalite": true,
  "fiches_clients": true,
  "calendrier": true,
  "multi_gites_view": false,
  "ai_assistant": false,
  "ai_communication": false,
  "api_access": false,
  "support_level": "chat",
  "formation": false
}
```

**Exemple features JSONB pour DUO :**
```json
{
  "dashboard": true,
  "reservations": true,
  "menage": true,
  "draps": true,
  "statistiques": true,
  "fiscalite": true,
  "fiches_clients": true,
  "calendrier": true,
  "multi_gites_view": true,
  "ai_assistant": true,
  "ai_communication": false,
  "api_access": false,
  "support_level": "priority",
  "formation": "video"
}
```

**Exemple features JSONB pour QUATTRO :**
```json
{
  "dashboard": true,
  "reservations": true,
  "menage": true,
  "draps": true,
  "statistiques": "advanced",
  "fiscalite": true,
  "fiches_clients": true,
  "calendrier": true,
  "multi_gites_view": true,
  "ai_assistant": true,
  "ai_communication": true,
  "api_access": true,
  "gdf_option_available": true,
  "support_level": "vip",
  "formation": "personal_1h"
}
```

#### **2. Table `user_subscriptions`**
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_id UUID REFERENCES subscriptions_plans NOT NULL,
  status TEXT NOT NULL, -- 'active', 'trialing', 'past_due', 'canceled', 'expired'
  billing_cycle TEXT NOT NULL, -- 'monthly', 'monthly_committed', 'yearly'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_ends_at TIMESTAMPTZ,
  commitment_end_date TIMESTAMPTZ, -- Date de fin d'engagement 12 mois
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
```

#### **3. Table `subscription_usage`** (tracking)
```sql
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  period_month DATE NOT NULL, -- Premier jour du mois
  gites_count INTEGER DEFAULT 0,
  reservations_count INTEGER DEFAULT 0,
  ai_assistant_calls INTEGER DEFAULT 0,
  ai_communication_calls INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **4. Table `gites_de_france_options`** (pour option GDF)
```sql
CREATE TABLE gites_de_france_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  verification_status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'expired'
  document_url TEXT, -- URL du justificatif uploadé
  membership_number TEXT, -- Numéro d'adhérent GDF
  expiration_date DATE, -- Date d'expiration de l'adhésion
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users, -- Admin qui a vérifié
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE gites_de_france_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own GDF option" ON gites_de_france_options FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own GDF option" ON gites_de_france_options FOR UPDATE USING (auth.uid() = user_id);
```

---

## 🔐 CONTRÔLE D'ACCÈS

### JavaScript Helper : `subscription-manager.js`

```javascript
// Récupérer l'abonnement actif de l'utilisateur
async function getUserSubscription(userId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscriptions_plans(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  return data;
}

// Vérifier l'accès à une fonctionnalité
function hasFeatureAccess(subscription, featureName) {
  if (!subscription?.plan?.features) return false;
  const feature = subscription.plan.features[featureName];
  return feature === true || (typeof feature === 'string' && feature !== 'false');
}

// Vérifier les limites de gîtes (principale limite)
function checkGitesLimit(subscription, currentGitesCount) {
  const maxGites = subscription.plan.max_gites;
  if (maxGites === null) return true; // Illimité (plan GDF)
  return currentGitesCount < maxGites;
}

// Vérifier accès aux features IA
function hasAIAccess(subscription, aiType = 'assistant') {
  if (aiType === 'assistant') {
    return subscription.plan.features.ai_assistant === true;
  } else if (aiType === 'communication') {
    return subscription.plan.features.ai_communication !== false;
  }
  return false;
}

// Obtenir le niveau de support
function getSupportLevel(subscription) {
  return subscription.plan.features.support_level || 'chat';
}
```

### Contrôle UI

```javascript
// Contrôler l'ajout de gîtes selon le plan
async function checkCanAddGite(userId) {
  const subscription = await getUserSubscription(userId);
  const { data: gites } = await supabase
    .from('gites')
    .select('id')
    .eq('user_id', userId);
  
  const currentCount = gites?.length || 0;
  const maxGites = subscription.plan.max_gites;
  
  if (maxGites !== null && currentCount >= maxGites) {
    showUpgradeModal({
      currentPlan: subscription.plan.name,
      gitesCount: currentCount,
      maxGites: maxGites
    });
    return false;
  }
  
  return true;
}

// Afficher bandeau discret selon le plan
function displaySubscriptionBanner(subscription) {
  const bannerEl = document.getElementById('subscription-banner');
  const plan = subscription.plan;
  const gitesText = plan.max_gites === null ? '∞ gîtes' : `${plan.max_gites} gîte(s)`;
  
  bannerEl.innerHTML = `
    <div class="subscription-info">
      Plan <strong>${plan.display_name}</strong> - ${gitesText}
      <button onclick="showBillingPortal()">⚙️ Gérer</button>
    </div>
  `;
}

// Contrôler l'accès aux features IA
function initializeAIFeatures(subscription) {
  const aiAssistantBtn = document.getElementById('ai-assistant-btn');
  const aiCommunicationBtn = document.getElementById('ai-communication-btn');
  
  // Aide IA (disponible sur DUO et supérieur)
  if (subscription.plan.features.ai_assistant) {
    aiAssistantBtn.classList.remove('locked');
  } else {
    aiAssistantBtn.classList.add('locked');
    aiAssistantBtn.onclick = () => showUpgradeModal({feature: 'ai_assistant', requiredPlan: 'DUO'});
  }
  
  // Communication/Conseil IA (disponible sur QUATTRO et GDF)
  if (subscription.plan.features.ai_communication) {
    aiCommunicationBtn.classList.remove('locked');
  } else {
    aiCommunicationBtn.classList.add('locked');
    aiCommunicationBtn.onclick = () => showUpgradeModal({feature: 'ai_communication', requiredPlan: 'QUATTRO'});
  }
}
```

---

## 💳 INTÉGRATION PAIEMENT : STRIPE

### Configuration Stripe

1. **Products Stripe** :
   - Solo : 3 prix
     * 15€/mois (sans engagement)
     * 10€/mois (avec engagement 12 mois)
     * 120€/an (paiement annuel)
   - Duo : 3 prix + mention "🤖 Avec Aide IA"
     * 22€/mois (sans engagement)
     * 15€/mois (avec engagement 12 mois)
     * 180€/an (paiement annuel)
   - Quattro : 3 prix + mention "🤖 Avec Communication IA"
     * 33€/mois (sans engagement)
     * 23€/mois (avec engagement 12 mois)
     * 276€/an (paiement annuel)
   - Gîtes de France : 3 prix + mention "🏛️ Tarif adhérent"
     * 27€/mois (sans engagement)
     * 18€/mois (avec engagement 12 mois)
     * 216€/an (paiement annuel)

2. **Webhooks** :
   - `checkout.session.completed` → Activer l'abonnement
   - `invoice.paid` → Renouvellement réussi
   - `invoice.payment_failed` → Suspendre l'accès (grace period 7 jours)
   - `customer.subscription.deleted` → Suspendre compte
   - `customer.subscription.updated` → Mettre à jour le plan (upgrade/downgrade)

### Fichier `stripe-handler.js`

```javascript
// Créer une session Checkout Stripe
async function createCheckoutSession(planId, billingCycle = 'monthly_committed') {
  const { data: plan } = await supabase
    .from('subscriptions_plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  let priceId;
  if (billingCycle === 'yearly') {
    priceId = plan.stripe_price_id_yearly;
  } else if (billingCycle === 'monthly_committed') {
    priceId = plan.stripe_price_id_monthly_committed;
  } else {
    priceId = plan.stripe_price_id_monthly;
  }
  
  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      billingCycle,
      userId: user.id,
      successUrl: window.location.origin + '/success',
      cancelUrl: window.location.origin + '/pricing'
    })
  });
  
  const { sessionId } = await response.json();
  stripe.redirectToCheckout({ sessionId });
}
```

---

## 🎨 UI/UX PROPOSÉE

### 1. **Bandeau d'abonnement (discret)**
Afficher dans le menu ou footer :
```html
<div class="subscription-banner subscription-solo">
  Plan <strong>SOLO</strong> - 1/1 gîte utilisé
  <button class="btn-manage">⚙️ Gérer mon abonnement</button>
</div>
```

Quand limite atteinte :
```html
<div class="subscription-banner subscription-limit">
  ⚠️ Limite atteinte (1/1 gîte) - <a href="#upgrade">Passer à DUO pour 2 gîtes</a>
</div>
```

### 2. **Modal limite atteinte**
Quand l'utilisateur tente d'ajouter un gîte au-delà de sa limite :
```
┌──────────────────────────────────────┐
│  📊 Limite de gîtes atteinte         │
│                                      │
│  Vous avez atteint la limite de      │
│  1 gîte avec votre plan SOLO.        │
│                                      │
│  Passez à DUO pour gérer 2 gîtes     │
│  pour seulement 5€/mois de plus !    │
│                                      │
│  [Upgrade vers DUO] [Plus tard]      │
└──────────────────────────────────────┘
```

### 3. **Boutons d'accès IA**

Dans le dashboard ou menu :
```html
<!-- Aide IA (DUO et supérieur) -->
<button id="ai-assistant-btn" class="btn-ai">
  🤖 Aide IA
  <span class="badge-new">NOUVEAU</span>
</button>

<!-- Communication/Conseil IA (QUATTRO et GDF) -->
<button id="ai-communication-btn" class="btn-ai">
  🤖 Communication IA
  <span class="badge-pro">PRO</span>
</button>
```

Si verrouillé :
```html
<button class="btn-ai locked" onclick="showUpgradeModal('ai_assistant')">
  🔒 Aide IA
  <span class="badge-locked">DUO requis</span>
</button>
```

### 4. **Page commerciale (existante)**
La page commerciale existe déjà dans [index.html](index.html) ! Il faut juste :
- Ajouter un 4ème plan "Gîtes de France"
- Ajouter badges "🤖 Avec IA" sur DUO et QUATTRO
- Lien "Gérer mon abonnement" pour users connectés
- Bouton "Changer de plan" visible dans le dashboard
- Portal Stripe pour gérer facturation/annulation

**Points importants UI :**
- Toggle "Avec engagement" / "Sans engagement" bien visible ✅ (déjà fait)
- Mise en avant de l'économie annuelle ✅ (déjà fait)
- Badge "Le plus populaire" sur DUO ✅ (déjà fait)
- Essai 14 jours bien visible ✅ (déjà fait)

---

## 📊 TABLEAU COMPARATIF FEATURES

| Fonctionnalité          | SOLO | DUO | QUATTRO |
|-------------------------|------|-----|---------
| **Gîtes**               | **1** | **2** | **4** |
| **Prix avec engagement**    | **10€/mois** | **15€/mois** | **23€/mois** |
| Prix sans engagement    | 15€/mois | 22€/mois | 33€/mois |
| Économie annuelle       | 60€/an | 84€/an | 120€/an |
| **FONCTIONNALITÉS** | | | | |
| Dashboard complet       | ✅ | ✅ | ✅ |
| Calendrier multi-plateformes | ✅ | ✅ | ✅ |
| Réservations illimitées | ✅ | ✅ | ✅ |
| Planning ménage auto    | ✅ | ✅ Multi-sites | ✅ Multi-sites |
| Gestion draps/stock     | ✅ | ✅ | ✅ |
| Fiscalité LMNP complète | ✅ | ✅ | ✅ |
| Fiches voyageur QR WiFi | ✅ | ✅ | ✅ |
| Analytics & stats       | ✅ | ✅ | ✅ Avancés |
| Vue multi-propriétés    | ❌ | ✅ | ✅ |
| **🤖 Aide IA**          | ❌ | ✅ | ✅ |
| **🤖 Communication/Conseil IA** | ❌ | ❌ | ✅ |
| **🏛️ Tableau Gîtes de France** | ❌ | ✅ | ✅ |
| API connexions custom   | ❌ | ❌ | ✅ |
| Formation               | ❌ | 📹 Vidéo | 👤 1h perso |
| Support                 | ✉️ Email 48h | ✉️ Email 24h | ✉️ 4h + 📞 RDV |
| **Essai gratuit**       | **✅ 14 jours** | **✅ 14 jours** | **✅ 14 jours** |

---

## 📞 SUPPORT & FORMATIONS

### Support par niveau

| Niveau | Canal | Délai réponse | Horaires |
|--------|-------|---------------|----------|
| **SOLO** | ✉️ Email | 48h ouvrées | Lun-Ven 9h-18h |
| **DUO** | ✉️ Email prioritaire | 24h ouvrées | Lun-Ven 9h-18h |
| **QUATTRO** | ✉️ Email VIP + 📞 RDV + WhatsApp | 4h ouvrées | Lun-Ven 9h-18h |
| **GDF** | ✉️ Email VIP GDF + 📞 RDV + WhatsApp | 4h ouvrées | Lun-Ven 9h-18h |

### Formations par niveau

| Niveau | Type | Contenu |
|--------|------|---------|
| **SOLO** | ❌ Aucune | Documentation écrite uniquement |
| **DUO** | 📹 Vidéos | Bibliothèque complète de tutoriels |
| **QUATTRO** | 👤 1h personnalisée | Session 1-à-1 + accès vidéos |
| **GDF** | 👤 1h GDF personnalisée | Expert spécialisé GDF + vidéos |

### 💬 Chat en ligne (À IMPLÉMENTER)

**Recommandation : Crisp Chat**
- Gratuit jusqu'à 2 agents
- Widget moderne et responsive
- Notifications temps réel
- Multi-agents et historique

**Proposition d'accès :**
- **SOLO** : ❌ Pas de chat OU chat avec réponse lente (hors heures = lendemain)
- **DUO** : 💬 Chat avec réponse sous 2h ouvrées
- **QUATTRO** : 💬 Chat prioritaire sous 30min ouvrées
- **GDF** : 💬 Chat ultra-prioritaire sous 30min

**Alternatives :**
- Tawk.to (gratuit, moins moderne)
- Intercom (payant ~74€/mois, très pro)
- Widget custom avec Supabase Realtime

---

## 🚀 PLAN D'IMPLÉMENTATION

### **Phase 1 : Base de données** (2h)
1. Créer les tables `subscriptions_plans`, `user_subscriptions`, `subscription_usage`
2. Créer table `gites_de_france_options` pour l'option GDF
3. Insérer les 3 plans (Solo, Duo, Quattro) avec leurs features
4. Créer les RLS policies
5. Attribuer plan SOLO à l'admin (vous) pour test

### **Phase 2 : Backend Stripe** (4h)
1. Configuration Stripe (Products + Prices pour chaque plan et cycle)
   - Solo : 3 prix (15€/mois, 10€/mois engagé, 120€/an)
   - Duo : 3 prix + mention "🤖 Avec Aide IA + Option GDF"
   - Quattro : 3 prix + mention "🤖 Avec Communication IA + Option GDF"
2. Créer API `/api/create-checkout`
3. Créer API `/api/gdf-option/request` pour demander activation GDF
4. Créer API `/api/gdf-option/verify` (admin) pour valider adhérent
5. Gérer webhooks Stripe (`/api/webhooks/stripe`)
6. Fonction Edge Supabase pour sync subscription

### **Phase 3 : Frontend Core** (4h)
1. Créer `subscription-manager.js`
2. Limiter le nombre de gîtes selon le plan
3. Bandeau abonnement en header (discret)
4. Modal upgrade quand limite atteinte
5. Intégrer boutons d'accès IA (DUO : Aide IA, QUATTRO : Communication IA)
6. Section "Paramètres > Option Gîtes de France" avec upload justificatif

### **Phase 4 : Page Pricing** (3h)
1. Ajouter badges "🤖 Avec IA" sur DUO et QUATTRO
2. Ajouter mention "🏛️ Option Gîtes de France disponible" sur DUO et QUATTRO
3. Intégration Stripe Checkout
4. Encart "Vous êtes adhérent Gîtes de France ? Option disponible dès le plan DUO"
5. Animations & polish

### **Phase 5 : Gestion abonnement** (4h)
1. Page "Mon abonnement" dans paramètres
2. Section "Option Gîtes de France" avec statut vérification
3. Annulation/changement de plan
4. Portal client Stripe
5. Facturation & historique
6. Interface admin pour vérifier demandes GDF (approval/reject)

### **Phase 6 : Tests & Polish** (3h)
1. Tests flows complets
2. Gestion cas d'erreur
3. Emails transactionnels
4. Documentation utilisateur

**Total estimé : 22h de développement**

---

## 💡 RECOMMANDATIONS

### ✅ À faire
1. **Période d'essai** : 14 jours gratuits DÉJÀ prévu sur la page commerciale ✅
2. **Remise annuelle** : Déjà en place (économies de 60€ à 120€/an selon plan) ✅
3. **Option avec/sans engagement** : DÉJÀ en place, bien mettre en avant l'économie ✅
4. **Option Gîtes de France** : Gratuite pour adhérents GDF, validation manuelle
5. **Partenariat Gîtes de France** : Contacter la fédération pour accord officiel (optionnel)
6. **Coupons** : Système de codes promo pour affiliés/partenaires
6. **Analytics** : Tracker conversions et churn rate
7. **Communications IA** : Développer des templates adaptés aux standards Gîtes de France

### ⚠️ Points d'attention
1. **Pas de clients actuels** : Lancement direct avec système d'abonnement
2. **Facturation** : TVA française (20%) à gérer avec Stripe Tax
3. **RGPD** : Mentions légales + conservation données si annulation
4. **Vérification GDF** : Process de validation manuel avant automatisation
5. **Engagement 12 mois** : Bien expliquer les conditions de résiliation anticipée
6. **IA Features** : S'assurer que les fonctionnalités IA existent avant de les vendre
7. **Chat support** : Implémenter Crisp ou Tawk.to pour chat en ligne (recommandé)

---

## ❓ QUESTIONS À VALIDER

1. ✅ **Tarification** : Tarifs existants de la page commerciale utilisés
2. ✅ **Pas de plan gratuit** : Conformément à votre demande
3. ✅ **Limite gîtes** : 1/2/4/illimité (GDF)
4. ✅ **Fiscalité** : Incluse dès SOLO (bon argument de vente)
5. ✅ **Trial** : 14 jours déjà prévu sur page commerciale
6. ✅ **Aide IA** : Niveau DUO et supérieur
7. ✅ **Communication/Conseil IA** : Niveau QUATTRO uniquement
8. ✅ **Option Gîtes de France** : Disponible dès DUO, activation sur demande
9. **Option GDF gratuite ou payante** : Gratuite pour adhérents GDF validés ?
10. **Vérification GDF** : Upload justificatif manuel (carte adhérent, attestation)
11. **IA Communication** : Cette fonctionnalité existe déjà ou à développer ?
12. **Stripe** : C'est le bon choix pour la France, confirmer ?

---

## 📈 PRÉVISIONS BUSINESS

**Hypothèses** :
- 70% des utilisateurs choisissent l'engagement 12 mois (économie)
- 50% Solo, 30% Duo, 15% Quattro, 5% GDF (répartition estimée)

**Scénario conservateur** (100 utilisateurs payants après 1 an) :
- 50 SOLO : 35 engagés (10€) + 15 mensuels (15€) = **575€/mois**
- 35 DUO : 24 engagés (15€) + 11 mensuels (22€) = **602€/mois**
- 15 QUATTRO : 10 engagés (23€) + 5 mensuels (33€) = **395€/mois**
**Total MRR : 1 572€/mois = 18 864€/an**
(+ 5-10% ont l'option GDF activée)

**Scénario réaliste** (250 utilisateurs payants après 2 ans) :
- 130 SOLO : 91 engagés (10€) + 39 mensuels (15€) = **1 495€/mois**
- 85 DUO : 59 engagés (15€) + 26 mensuels (22€) = **1 457€/mois**
- 35 QUATTRO : 24 engagés (23€) + 11 mensuels (33€) = **915€/mois**
**Total MRR : 3 867€/mois = 46 404€/an**
(+ 10-15% ont l'option GDF activée)

**Scénario optimiste** (500 utilisateurs payants après 3 ans) :
- 260 SOLO : 182 engagés (10€) + 78 mensuels (15€) = **2 990€/mois**
- 170 DUO : 119 engagés (15€) + 51 mensuels (22€) = **2 907€/mois**
- 70 QUATTRO : 49 engagés (23€) + 21 mensuels (33€) = **1 820€/mois**
**Total MRR : 7 717€/mois = 92 604€/an**
(+ 15-20% ont l'option GDF activée)

---

## 🎯 PROCHAINES ÉTAPES

1. **Valider** cette proposition avec vos ajustements
2. **Clarifier** les features IA existantes vs à développer
3. **Créer** compte Stripe et configurer les 4 produits
4. **Démarrer** Phase 1 : Base de données

Prêt à démarrer l'implémentation ? 🚀
