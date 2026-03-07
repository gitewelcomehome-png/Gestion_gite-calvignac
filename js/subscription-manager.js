/**
 * ===================================================================
 * SUBSCRIPTION MANAGER - GESTION DES ABONNEMENTS
 * ===================================================================
 * Date: 12 février 2026
 * Description: Gestion centralisée des abonnements utilisateurs
 *              avec contrôle d'accès par features (feature gating)
 * 
 * Plans disponibles:
 * - SOLO (level 1): 1 gîte, features de base
 * - DUO (level 2): 2 gîtes, AI autocomplete + GDF
 * - QUATTRO (level 3): 4 gîtes, toutes features + API
 * ===================================================================
 */

// ===========================
// CLASSE PRINCIPALE
// ===========================

class SubscriptionManager {
  constructor() {
    this.currentSubscription = null;
    this.features = null;
    this.level = null;
    // Promise résolue quand l'abonnement est chargé
    this._readyPromise = new Promise(resolve => { this._resolveReady = resolve; });
  }

  /**
   * Récupérer l'abonnement actif de l'utilisateur connecté
   * @returns {Object|null} Données de l'abonnement avec le plan
   */
  async loadUserSubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this._resolveReady(null);
      return null;
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscriptions_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Erreur chargement abonnement:', error);
    }
    if (!data) {
      this._resolveReady(null);
      return null;
    }

    this.currentSubscription = data;
    this.features = data.plan.features;
    this.level = data.plan.level;
    this._resolveReady(data);
    
    return data;
  }

  /**
   * Vérifier si l'utilisateur a accès à une fonctionnalité
   * @param {string} featureName - Nom de la feature (ex: 'ai_autocomplete')
   * @returns {boolean} True si accès autorisé
   */
  hasFeatureAccess(featureName) {
    if (!this.features) return false;
    const feature = this.features[featureName];
    return feature === true || (typeof feature === 'string' && feature !== 'false' && feature !== false);
  }

  /**
   * Vérifier si le plan atteint le niveau minimum requis
   * @param {number} requiredLevel - Niveau requis (1, 2, ou 3)
   * @returns {boolean} True si niveau suffisant
   */
  hasLevel(requiredLevel) {
    return this.level >= requiredLevel;
  }

  /**
   * Vérifier la limite de gîtes et l'utilisation actuelle
   * @returns {Object} { current, max, canAdd }
   */
  async checkGitesLimit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        current: 0,
        max: this.currentSubscription?.plan?.max_gites || 1,
        canAdd: false
      };
    }

    const { data: gites } = await supabase
      .from('gites')
      .select('id')
      .eq('owner_user_id', user.id);

    const currentCount = gites?.length || 0;
    const maxGites = this.currentSubscription?.plan?.max_gites || 1;

    return {
      current: currentCount,
      max: maxGites,
      canAdd: currentCount < maxGites
    };
  }

  /**
   * Obtenir le plan requis pour une feature donnée
   * @param {string} featureName - Nom de la feature
   * @returns {Object} { level, plan }
   */
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
window.subscriptionManager = subscriptionManager;

// ===========================
// CONTRÔLE D'ACCÈS UI
// ===========================
// ===========================

/**
 * Initialiser tous les contrôles d'accès sur la page
 */
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

/**
 * Contrôler l'accès aux features IA selon le plan
 */
function controlAIFeatures() {
  // Auto-complétion IA (DUO+)
  const aiAutocompleteElements = document.querySelectorAll('[data-feature="ai_autocomplete"]');
  aiAutocompleteElements.forEach(el => {
    if (subscriptionManager.hasFeatureAccess('ai_autocomplete')) {
      el.style.display = '';
      el.classList.remove('feature-locked');
      el.removeAttribute('disabled');
      el.removeAttribute('title');
    } else {
      // Masquer complètement en mode SOLO
      el.style.display = 'none';
    }
  });

  // Communication IA (QUATTRO)
  const aiCommunicationElements = document.querySelectorAll('[data-feature="ai_communication"]');
  aiCommunicationElements.forEach(el => {
    if (subscriptionManager.hasFeatureAccess('ai_communication')) {
      el.style.display = '';
      el.classList.remove('feature-locked');
      el.removeAttribute('disabled');
      el.removeAttribute('title');
    } else {
      // Masquer complètement
      el.style.display = 'none';
    }
  });
}

/**
 * Contrôler l'accès au tableau Gîtes de France
 */
function controlGDFTable() {
  const gdfElements = document.querySelectorAll('[data-feature="gdf_table"]');
  
  gdfElements.forEach(el => {
    if (subscriptionManager.hasFeatureAccess('gdf_table')) {
      el.style.display = '';
      el.classList.remove('feature-locked');
    } else {
      // Masquer complètement en mode SOLO
      el.style.display = 'none';
    }
  });
}

/**
 * Contrôler l'ajout de gîtes selon la limite du plan
 */
async function controlGitesLimit() {
  const addGiteButtons = document.querySelectorAll('[data-action="add-gite"]');
  let limits;

  try {
    limits = await subscriptionManager.checkGitesLimit();
  } catch (error) {
    console.error('Erreur contrôle limite gîtes:', error);
    return;
  }
  
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

/**
 * Afficher le bandeau d'abonnement en haut de page
 */
function displaySubscriptionBanner() {
  const sub = subscriptionManager.currentSubscription;
  if (!sub) return;

  const banner = document.getElementById('subscription-banner');
  if (!banner) return;

  const plan = sub.plan;
  banner.innerHTML = `<span class="plan-badge plan-${plan.name}">${plan.display_name}</span>`;
}

// ===========================
// MODALS
// ===========================

/**
 * Afficher modal d'upgrade pour débloquer une feature
 * @param {string} featureName - Feature à débloquer
 */
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

/**
 * Afficher modal limite de gîtes atteinte
 * @param {Object} limits - { current, max, canAdd }
 */
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

/**
 * Obtenir les bénéfices HTML d'un plan selon son niveau
 * @param {number} level - 1, 2, ou 3
 * @returns {string} HTML list items
 */
function getBenefitsForPlan(level) {
  const benefits = {
    2: [
      '<li>✅ Gestion de 2 gîtes</li>',
      '<li>✅ Auto-complétion IA des infos gîtes</li>',
      '<li>✅ Tableau Gîtes de France</li>',
      '<li>✅ Vue multi-propriétés</li>',
      '<li>✅ Support prioritaire (24h)</li>'
    ],
    3: [
      '<li>✅ Gestion de 4 gîtes</li>',
      '<li>✅ Conseil/Communication IA</li>',
      '<li>✅ Accès API</li>',
      '<li>✅ Tableaux de bord avancés</li>',
      '<li>✅ Support VIP (4h + RDV téléphone)</li>',
      '<li>✅ Formation personnalisée 1h</li>'
    ]
  };

  return (benefits[level] || []).join('');
}

/**
 * Obtenir le prix pour un niveau donné
 * @param {number} level
 * @returns {string} Prix formaté
 */
function getPriceForLevel(level) {
  const prices = { 1: '10€/mois', 2: '15€/mois', 3: '23€/mois' };
  return prices[level] || '10€/mois';
}

/**
 * Obtenir le plan suivant pour upgrade
 * @param {number} currentLevel
 * @returns {Object|null} { name, gites, priceDiff }
 */
function getNextPlan(currentLevel) {
  const plans = {
    1: { name: 'DUO', gites: 2, priceDiff: 5 },
    2: { name: 'QUATTRO', gites: 4, priceDiff: 8 },
    3: null
  };
  return plans[currentLevel];
}

/**
 * Modal générique avec titre, contenu et boutons
 * @param {Object} config - { title, content, buttons }
 */
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

/**
 * Fermer toutes les modals actives
 */
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
    document.body.classList.remove('modal-open');
  }
}

/**
 * Ouvrir le portail de facturation Stripe (à implémenter)
 */
async function openBillingPortal() {
  // TODO: Implémenter après configuration Stripe
  console.log('Ouverture portail factures Stripe...');
  alert('Portail de facturation à venir - Phase Stripe');
}

// ===========================
// INITIALISATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  initializeFeatureGates();
});

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SubscriptionManager, subscriptionManager };
}
