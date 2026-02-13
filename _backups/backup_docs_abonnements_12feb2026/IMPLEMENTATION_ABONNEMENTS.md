# 🔐 IMPLÉMENTATION SYSTÈME ABONNEMENTS - Gestion Gîte Calvignac

## 📋 Contrôle d'accès par niveau

### 🎯 NIVEAU 1 : SOLO (10€/15€) - 1 gîte

**✅ Fonctionnalités accessibles :**
- Dashboard complet
- Calendrier & Réservations (1 gîte uniquement)
- Import iCal multi-plateformes
- Planning ménage basique (1 gîte)
- Gestion draps/stock
- Fiscalité LMNP complète
- Fiches voyageurs avec QR WiFi
- Analytics & stats basiques
- Support chat 7j/7
- Export PDF

**❌ Fonctionnalités verrouillées :**
- 🔒 Vue multi-gîtes
- 🔒 **Auto-complétion IA** (infos gîtes)
- 🔒 **Tableau Gîtes de France**
- 🔒 Conseil/Communication IA
- 🔒 API access
- 🔒 Formation vidéo
- 🔒 Support prioritaire/VIP

**Support :** ✉️ Email (réponse sous 48h ouvrées, lun-ven 9h-18h)

---

### ⭐ NIVEAU 2 : DUO (15€/22€) - 2 gîtes

**✅ Nouveautés débloquées :**
- **2 gîtes maximum**
- Vue multi-propriétés consolidée
- Planning ménage multi-sites
- **🤖 Auto-complétion IA** : Aide à remplir les infos gîtes automatiquement
- **🏛️ Tableau Gîtes de France** : Exports conformes + suivi critères
- Formation vidéo complète
- Support prioritaire (réponse rapide)
- Export Excel avancé

**❌ Encore verrouillé :**
- 🔒 Conseil/Communication IA avancée
- 🔒 API connexions custom
- 🔒 Tableaux de bord avancés
- 🔒 Formation personnalisée 1h

**Support :** ✉️ Email prioritaire (réponse sous 24h ouvrées)

---

### 💼 NIVEAU 3 : QUATTRO (23€/33€) - 4 gîtes

**✅ Tout débloqué :**
- **4 gîtes maximum**
- **🤖 Conseil/Communication IA** : Messages et conseils personnalisés générés par IA
- **API connexions custom** : Intégrations tierces
- Tableaux de bord avancés personnalisables
- Formation 1h personnalisée
- Export API

**Support :** ✉️ Email VIP (4h ouvrées) + 📞 RDV téléphone + WhatsApp Business

---

## 🔐 IMPLÉMENTATION TECHNIQUE

### 1. Tables Supabase

```sql
-- Table des plans
CREATE TABLE subscriptions_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'solo', 'duo', 'quattro'
  display_name TEXT NOT NULL,
  level INTEGER NOT NULL, -- 1, 2, 3
  price_monthly DECIMAL(10,2) NOT NULL,
  price_monthly_committed DECIMAL(10,2) NOT NULL,
  max_gites INTEGER NOT NULL,
  features JSONB NOT NULL,
  stripe_price_id_monthly TEXT,
  stripe_price_id_monthly_committed TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les 3 plans
INSERT INTO subscriptions_plans (name, display_name, level, price_monthly, price_monthly_committed, max_gites, features) VALUES
('solo', 'SOLO', 1, 15.00, 10.00, 1, '{
  "dashboard": true,
  "reservations": true,
  "menage": "basic",
  "draps": true,
  "fiscalite": true,
  "fiches_clients": true,
  "statistiques": "basic",
  "multi_gites_view": false,
  "ai_autocomplete": false,
  "gdf_table": false,
  "ai_communication": false,
  "api_access": false,
  "support_level": "email",
  "formation": false,
  "export_level": "pdf"
}'::jsonb),
('duo', 'DUO', 2, 22.00, 15.00, 2, '{
  "dashboard": true,
  "reservations": true,
  "menage": "multi_sites",
  "draps": true,
  "fiscalite": true,
  "fiches_clients": true,
  "statistiques": "advanced",
  "multi_gites_view": true,
  "ai_autocomplete": true,
  "gdf_table": true,
  "ai_communication": false,
  "api_access": false,
  "support_level": "email_priority",
  "formation": "video",
  "export_level": "excel"
}'::jsonb),
('quattro', 'QUATTRO', 3, 33.00, 23.00, 4, '{
  "dashboard": true,
  "reservations": true,
  "menage": "multi_sites",
  "draps": true,
  "fiscalite": true,
  "fiches_clients": true,
  "statistiques": "advanced",
  "multi_gites_view": true,
  "ai_autocomplete": true,
  "gdf_table": true,
  "ai_communication": true,
  "api_access": true,
  "support_level": "email_vip",
  "formation": "personal_1h",
  "export_level": "api"
}'::jsonb);

-- Table des abonnements utilisateurs
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  plan_id UUID REFERENCES subscriptions_plans NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'past_due', 'canceled'
  billing_cycle TEXT NOT NULL, -- 'monthly', 'monthly_committed'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

---

### 2. JavaScript : subscription-manager.js

```javascript
// ===========================
// SUBSCRIPTION MANAGER
// ===========================

class SubscriptionManager {
  constructor() {
    this.currentSubscription = null;
    this.features = null;
    this.level = null;
  }

  // Récupérer l'abonnement actif
  async loadUserSubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscriptions_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.error('Erreur chargement abonnement:', error);
      return null;
    }

    this.currentSubscription = data;
    this.features = data.plan.features;
    this.level = data.plan.level;
    
    return data;
  }

  // Vérifier l'accès à une fonctionnalité
  hasFeatureAccess(featureName) {
    if (!this.features) return false;
    const feature = this.features[featureName];
    return feature === true || (typeof feature === 'string' && feature !== 'false' && feature !== false);
  }

  // Vérifier le niveau minimum requis
  hasLevel(requiredLevel) {
    return this.level >= requiredLevel;
  }

  // Vérifier limite de gîtes
  async checkGitesLimit() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: gites } = await supabase
      .from('gites')
      .select('id')
      .eq('user_id', user.id);

    const currentCount = gites?.length || 0;
    const maxGites = this.currentSubscription.plan.max_gites;

    return {
      current: currentCount,
      max: maxGites,
      canAdd: currentCount < maxGites
    };
  }

  // Obtenir le nom du plan requis pour une feature
  getRequiredPlanForFeature(featureName) {
    const featureRequirements = {
      'ai_autocomplete': { level: 2, plan: 'DUO' },
      'gdf_table': { level: 2, plan: 'DUO' },
      'ai_communication': { level: 3, plan: 'QUATTRO' },
      'api_access': { level: 3, plan: 'QUATTRO' },
      'multi_gites_view': { level: 2, plan: 'DUO' }
    };

    return featureRequirements[featureName] || { level: 1, plan: 'SOLO' };
  }
}

// Instance globale
const subscriptionManager = new SubscriptionManager();

// ===========================
// CONTRÔLE D'ACCÈS UI
// ===========================

async function initializeFeatureGates() {
  await subscriptionManager.loadUserSubscription();
  
  // Contrôler les boutons IA
  controlAIFeatures();
  
  // Contrôler l'accès au tableau GDF
  controlGDFTable();
  
  // Contrôler l'ajout de gîtes
  controlGitesLimit();
  
  // Afficher bandeau abonnement
  displaySubscriptionBanner();
}

// Contrôler les features IA
function controlAIFeatures() {
  // Auto-complétion IA (DUO+)
  const aiAutocompleteElements = document.querySelectorAll('[data-feature="ai_autocomplete"]');
  aiAutocompleteElements.forEach(el => {
    if (subscriptionManager.hasFeatureAccess('ai_autocomplete')) {
      el.classList.remove('feature-locked');
      el.removeAttribute('disabled');
    } else {
      el.classList.add('feature-locked');
      el.setAttribute('disabled', 'true');
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showUpgradeModal('ai_autocomplete');
      });
    }
  });

  // Communication IA (QUATTRO)
  const aiCommunicationElements = document.querySelectorAll('[data-feature="ai_communication"]');
  aiCommunicationElements.forEach(el => {
    if (subscriptionManager.hasFeatureAccess('ai_communication')) {
      el.classList.remove('feature-locked');
      el.removeAttribute('disabled');
    } else {
      el.classList.add('feature-locked');
      el.setAttribute('disabled', 'true');
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showUpgradeModal('ai_communication');
      });
    }
  });
}

// Contrôler l'accès au tableau Gîtes de France
function controlGDFTable() {
  const gdfElements = document.querySelectorAll('[data-feature="gdf_table"]');
  
  gdfElements.forEach(el => {
    if (subscriptionManager.hasFeatureAccess('gdf_table')) {
      el.classList.remove('feature-locked');
      el.style.display = 'block';
    } else {
      el.classList.add('feature-locked');
      el.style.display = 'none';
      
      // Créer un placeholder avec CTA upgrade
      const placeholder = document.createElement('div');
      placeholder.className = 'gdf-locked-placeholder';
      placeholder.innerHTML = `
        <div class="locked-feature-banner">
          <span class="lock-icon">🔒</span>
          <div>
            <strong>Tableau Gîtes de France</strong>
            <p>Disponible à partir du plan DUO (15€/mois)</p>
          </div>
          <button class="btn-upgrade" onclick="showUpgradeModal('gdf_table')">
            Voir les plans
          </button>
        </div>
      `;
      el.parentNode.insertBefore(placeholder, el);
    }
  });
}

// Contrôler l'ajout de gîtes
async function controlGitesLimit() {
  const addGiteButtons = document.querySelectorAll('[data-action="add-gite"]');
  const limits = await subscriptionManager.checkGitesLimit();
  
  addGiteButtons.forEach(btn => {
    if (!limits.canAdd) {
      btn.classList.add('disabled');
      btn.setAttribute('disabled', 'true');
      btn.onclick = (e) => {
        e.preventDefault();
        showGiteLimitModal(limits);
      };
    }
  });

  // Afficher compteur
  const limitCounters = document.querySelectorAll('[data-display="gites-limit"]');
  limitCounters.forEach(counter => {
    counter.textContent = `${limits.current}/${limits.max} gîtes utilisés`;
    if (limits.current >= limits.max) {
      counter.classList.add('limit-reached');
    }
  });
}

// Afficher bandeau abonnement
function displaySubscriptionBanner() {
  const sub = subscriptionManager.currentSubscription;
  if (!sub) return;

  const banner = document.getElementById('subscription-banner');
  if (!banner) return;

  const plan = sub.plan;
  banner.innerHTML = `
    <div class="subscription-info">
      <span class="plan-badge plan-${plan.name}">${plan.display_name}</span>
      <span class="gites-count">${plan.max_gites} gîte(s)</span>
      <button class="btn-manage" onclick="openBillingPortal()">⚙️ Gérer</button>
    </div>
  `;
}

// ===========================
// MODALS
// ===========================

function showUpgradeModal(featureName) {
  const required = subscriptionManager.getRequiredPlanForFeature(featureName);
  const currentPlan = subscriptionManager.currentSubscription?.plan?.display_name || 'SOLO';
  
  const featureLabels = {
    'ai_autocomplete': 'Auto-complétion IA',
    'gdf_table': 'Tableau Gîtes de France',
    'ai_communication': 'Conseil/Communication IA',
    'api_access': 'Accès API',
    'multi_gites_view': 'Vue multi-gîtes'
  };

  const featureLabel = featureLabels[featureName] || 'Cette fonctionnalité';

  showModal({
    title: '🔒 Fonctionnalité Premium',
    content: `
      <div class="upgrade-modal-content">
        <p><strong>${featureLabel}</strong> est disponible à partir du plan <strong>${required.plan}</strong>.</p>
        <p class="current-plan">Vous êtes actuellement sur le plan <strong>${currentPlan}</strong>.</p>
        <div class="plan-benefits">
          <h4>Avec le plan ${required.plan}, vous débloquez :</h4>
          <ul>
            ${getBenefitsForPlan(required.level)}
          </ul>
        </div>
        <div class="price-info">
          À partir de <strong>${getPriceForLevel(required.level)}</strong>
        </div>
      </div>
    `,
    buttons: [
      {
        label: 'Voir les plans',
        class: 'btn-primary',
        action: () => window.location.href = '/#pricing'
      },
      {
        label: 'Plus tard',
        class: 'btn-outline',
        action: () => closeModal()
      }
    ]
  });
}

function showGiteLimitModal(limits) {
  const currentPlan = subscriptionManager.currentSubscription?.plan?.display_name || 'SOLO';
  const nextPlan = getNextPlan(subscriptionManager.level);

  showModal({
    title: '📊 Limite de gîtes atteinte',
    content: `
      <div class="limit-modal-content">
        <p>Vous avez atteint la limite de <strong>${limits.max} gîte(s)</strong> avec votre plan <strong>${currentPlan}</strong>.</p>
        
        ${nextPlan ? `
          <div class="upgrade-suggestion">
            <p>Passez au plan <strong>${nextPlan.name}</strong> pour gérer jusqu'à <strong>${nextPlan.gites} gîtes</strong>.</p>
            <div class="price-diff">
              Pour seulement <strong>+${nextPlan.priceDiff}€/mois</strong> de plus !
            </div>
          </div>
        ` : `
          <p>Vous êtes sur le plan le plus élevé. Contactez-nous pour des besoins spécifiques.</p>
        `}
      </div>
    `,
    buttons: [
      {
        label: nextPlan ? `Passer à ${nextPlan.name}` : 'Nous contacter',
        class: 'btn-primary',
        action: () => window.location.href = nextPlan ? '/#pricing' : '/contact'
      },
      {
        label: 'Annuler',
        class: 'btn-outline',
        action: () => closeModal()
      }
    ]
  });
}

// ===========================
// HELPERS
// ===========================

function getBenefitsForPlan(level) {
  const benefits = {
    2: [
      '<li>✅ Gestion de 2 gîtes</li>',
      '<li>✅ Auto-complétion IA des infos gîtes</li>',
      '<li>✅ Tableau Gîtes de France</li>',
      '<li>✅ Vue multi-propriétés</li>',
      '<li>✅ Support prioritaire</li>'
    ],
    3: [
      '<li>✅ Gestion de 4 gîtes</li>',
      '<li>✅ Conseil/Communication IA</li>',
      '<li>✅ Accès API</li>',
      '<li>✅ Tableaux de bord avancés</li>',
      '<li>✅ Support VIP téléphone</li>',
      '<li>✅ Formation personnalisée 1h</li>'
    ]
  };

  return (benefits[level] || []).join('');
}

function getPriceForLevel(level) {
  const prices = { 1: '10€/mois', 2: '15€/mois', 3: '23€/mois' };
  return prices[level] || '10€/mois';
}

function getNextPlan(currentLevel) {
  const plans = {
    1: { name: 'DUO', gites: 2, priceDiff: 5 },
    2: { name: 'QUATTRO', gites: 4, priceDiff: 8 },
    3: null
  };
  return plans[currentLevel];
}

// Modal générique
function showModal({ title, content, buttons }) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        ${buttons.map(btn => `
          <button class="${btn.class}" onclick="(${btn.action.toString()})()">${btn.label}</button>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.classList.add('modal-open');
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
    document.body.classList.remove('modal-open');
  }
}

// ===========================
// INITIALISATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  initializeFeatureGates();
});
```

---

### 3. CSS : subscription-styles.css

```css
/* ===========================
   FEATURE GATES
   =========================== */

.feature-locked {
  opacity: 0.5;
  cursor: not-allowed;
  position: relative;
}

.feature-locked::after {
  content: '🔒';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  pointer-events: none;
}

/* Bandeau fonctionnalité verrouillée */
.locked-feature-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  margin: 20px 0;
}

.locked-feature-banner .lock-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.locked-feature-banner strong {
  color: #2d3748;
  display: block;
  margin-bottom: 4px;
}

.locked-feature-banner p {
  color: #718096;
  margin: 0;
  font-size: 14px;
}

.locked-feature-banner .btn-upgrade {
  margin-left: auto;
  padding: 10px 20px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.locked-feature-banner .btn-upgrade:hover {
  background: #3182ce;
}

/* Bandeau abonnement */
#subscription-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.subscription-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plan-solo { background: #48bb78; }
.plan-duo { background: #ed8936; }
.plan-quattro { background: #9f7aea; }

.gites-count {
  color: rgba(255,255,255,0.9);
  font-size: 14px;
}

.btn-manage {
  margin-left: auto;
  padding: 6px 16px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-manage:hover {
  background: rgba(255,255,255,0.3);
}

/* Compteur limite gîtes */
[data-display="gites-limit"] {
  font-size: 14px;
  color: #718096;
  padding: 8px 12px;
  background: #f7fafc;
  border-radius: 6px;
  display: inline-block;
}

[data-display="gites-limit"].limit-reached {
  background: #fed7d7;
  color: #742a2a;
  font-weight: 600;
}

/* ===========================
   MODALS
   =========================== */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  animation: slideUp 0.3s;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #2d3748;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #a0aec0;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f7fafc;
  color: #2d3748;
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Contenu modal upgrade */
.upgrade-modal-content p {
  margin: 0 0 16px;
  color: #4a5568;
  font-size: 15px;
}

.current-plan {
  color: #718096;
  font-size: 14px;
}

.plan-benefits {
  margin: 24px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.plan-benefits h4 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #2d3748;
}

.plan-benefits ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.plan-benefits li {
  padding: 6px 0;
  color: #4a5568;
  font-size: 14px;
}

.price-info {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-size: 18px;
}

.price-info strong {
  font-size: 24px;
  font-weight: 700;
}

/* Contenu modal limite */
.limit-modal-content p {
  margin: 0 0 16px;
  color: #4a5568;
  font-size: 15px;
}

.upgrade-suggestion {
  margin: 24px 0;
  padding: 20px;
  background: #f0fff4;
  border: 2px solid #9ae6b4;
  border-radius: 8px;
}

.upgrade-suggestion p {
  margin-bottom: 12px;
}

.price-diff {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  font-size: 18px;
  color: #38a169;
  font-weight: 600;
}

/* Boutons */
.btn-primary {
  padding: 12px 24px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-outline {
  padding: 12px 24px;
  background: transparent;
  color: #4a5568;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

body.modal-open {
  overflow: hidden;
}
```

---

### 4. HTML : Marquage des features

Dans vos fichiers HTML, marquez les éléments contrôlés :

```html
<!-- Auto-complétion IA (DUO+) -->
<button data-feature="ai_autocomplete" class="btn-ai">
  🤖 Auto-compléter avec l'IA
</button>

<!-- Tableau Gîtes de France (DUO+) -->
<div data-feature="gdf_table" class="gdf-section">
  <!-- Contenu tableau GDF -->
</div>

<!-- Communication IA (QUATTRO) -->
<button data-feature="ai_communication" class="btn-ai-comm">
  🤖 Générer message IA
</button>

<!-- Ajout de gîte -->
<button data-action="add-gite" class="btn-add-gite">
  ➕ Ajouter un gîte
</button>

<!-- Compteur limites -->
<span data-display="gites-limit"></span>

<!-- Bandeau abonnement -->
<div id="subscription-banner"></div>
```

---

## 📋 CHECKLIST IMPLÉMENTATION

### Phase 1 : Base de données (2h)
- [ ] Créer table `subscriptions_plans`
- [ ] Insérer les 3 plans avec features JSONB
- [ ] Créer table `user_subscriptions`
- [ ] Créer RLS policies
- [ ] Créer indexes
- [ ] Tester requêtes

### Phase 2 : Backend JavaScript (4h)
- [ ] Créer `subscription-manager.js`
- [ ] Implémenter classe SubscriptionManager
- [ ] Créer fonctions de contrôle d'accès
- [ ] Implémenter modals upgrade/limite
- [ ] Tester toutes les fonctions

### Phase 3 : Frontend Intégration (5h)
- [ ] Ajouter attributs `[data-feature]` dans HTML
- [ ] Ajouter `subscription-styles.css`
- [ ] Initialiser au chargement de la page
- [ ] Tester chaque feature lockée
- [ ] Vérifier les modals

### Phase 4 : Stripe Integration (4h)
- [ ] Configurer products Stripe
- [ ] Créer API checkout
- [ ] Gérer webhooks
- [ ] Tester paiements

### Phase 5 : Tests & Polish (3h)
- [ ] Tester tous les scénarios upgrade
- [ ] Vérifier limites gîtes
- [ ] Polir les modals
- [ ] Documentation admin

**Total : 18h**

---

## 💬 CHAT SUPPORT (OPTIONNEL - À IMPLÉMENTER)

### Recommandation : Crisp Chat

**Pourquoi Crisp ?**
- ✅ Gratuit jusqu'à 2 agents
- ✅ Interface moderne et professionnelle
- ✅ Widget customisable
- ✅ Notifications temps réel (desktop + mobile)
- ✅ Multi-agents avec attribution
- ✅ Historique conversations
- ✅ Déclencheurs automatiques
- ✅ SDK JavaScript simple

**Installation Crisp (15min) :**

1. Créer compte sur [crisp.chat](https://crisp.chat)
2. Récupérer le Website ID
3. Ajouter le script dans votre `index.html` et `app.html` :

```html
<!-- Crisp Chat Widget -->
<script type="text/javascript">
  window.$crisp = [];
  window.CRISP_WEBSITE_ID = "VOTRE_WEBSITE_ID";
  (function() {
    d = document;
    s = d.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = 1;
    d.getElementsByTagName("head")[0].appendChild(s);
  })();
</script>
```

4. Personnaliser selon l'abonnement :

```javascript
// Identifier l'utilisateur avec son plan
const subscription = await subscriptionManager.loadUserSubscription();
$crisp.push(["set", "user:email", [user.email]]);
$crisp.push(["set", "user:nickname", [user.name]]);
$crisp.push(["set", "session:data", [[
  ["plan", subscription.plan.display_name],
  ["level", subscription.plan.level]
]]]);

// Désactiver pour SOLO (optionnel)
if (subscription.plan.level < 2) {
  $crisp.push(["do", "chat:hide"]);
}
```

**Alternatives :**
- **Tawk.to** : Gratuit, moins moderne mais fonctionnel
- **Intercom** : Payant (~74€/mois), très professionnel, riche en features
- **Widget custom** : Avec Supabase Realtime + notifications push

**Temps d'implémentation estimé : 2-3h** (avec personnalisation par plan)

---

## ⚠️ PLAN GÎTES DE FRANCE

Les plans Gîtes de France sont des **accords négociés avec la fédération Gîtes de France**.
La fédération propose l'outil à tous ses adhérents avec un tarif préférentiel.

**Process :**
1. Négociation avec la fédération Gîtes de France (tarif global)
2. Les adhérents GDF accèdent au plan spécial
3. Validation adhésion + attribution automatique
4. Features GDF activées (badge, exports, IA spécialisée)

**Support :** ✉️ Email VIP dédié GDF (4h ouvrées) + 📞 RDV avec expert GDF + WhatsApp Business

---

Prêt à démarrer l'implémentation ? 🚀
