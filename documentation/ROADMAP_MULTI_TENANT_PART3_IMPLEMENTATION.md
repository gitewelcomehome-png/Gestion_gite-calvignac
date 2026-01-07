# 🚀 ROADMAP MULTI-TENANT - PARTIE 3/4
# PLAN D'IMPLÉMENTATION DÉTAILLÉ

**Date**: 7 janvier 2026  
**Suite de**: PART2_ARCHITECTURE.md  
**Focus**: Roadmap concrète avec estimations

---

## 🎯 VUE D'ENSEMBLE - LES 7 PHASES

| Phase | Nom | Durée | Effort | Bloquant ? | Priority |
|-------|-----|-------|--------|------------|----------|
| **0** | Préparation | 2j | 12h | ⚠️ | Setup |
| **1** | Multi-Tenant Base | 2 sem | 60h | 🔥 | CRITICAL |
| **2** | Migration Données | 3j | 18h | 🔥 | CRITICAL |
| **3** | Onboarding | 1 sem | 30h | 🔥 | CRITICAL |
| **4** | Channel Manager | 3 sem | 90h | 💰 | HIGH |
| **5** | Booking Engine | 2 sem | 60h | 💰 | HIGH |
| **6** | Features Premium | 4 sem | 120h | 💡 | MEDIUM |
| **7** | Polish & Launch | 1 sem | 30h | ✅ | FINAL |

**TOTAL**: ~15 semaines (3,5 mois) | 420 heures

---

## 📋 PHASE 0 - PRÉPARATION (2 jours - 12h)

### Objectif
Préparer l'environnement et la stratégie

### Tasks

#### 0.1 - Documentation architecture (4h)
- [ ] Créer diagrammes Mermaid/Draw.io
- [ ] Documenter flow utilisateur complet
- [ ] Créer user stories
- [ ] Définir MVP features

#### 0.2 - Setup environnement (4h)
- [ ] Créer branche `feature/multi-tenant`
- [ ] Setup environnement dev local dédié
- [ ] Configurer Supabase project de test
- [ ] Setup tests automatisés (Playwright/Vitest)

#### 0.3 - Stratégie migration (4h)
- [ ] Analyser toutes les tables existantes
- [ ] Créer mapping ancien → nouveau schéma
- [ ] Identifier breaking changes
- [ ] Plan de rollback

**✅ Livrables**:
- Documentation complète
- Environnement dev prêt
- Plan de migration validé

---

## 🏗️ PHASE 1 - MULTI-TENANT BASE (2 semaines - 60h)

### Objectif
Infrastructure multi-tenant fonctionnelle

### 1.1 - Nouvelles tables (Jour 1-2 | 12h)

**SQL à exécuter**:
```sql
-- Ordre d'exécution:

-- 1. Table organizations
CREATE TABLE organizations (...); -- Voir PART2

-- 2. Table gites
CREATE TABLE gites (...);

-- 3. Table organization_members
CREATE TABLE organization_members (...);

-- 4. Table subscriptions (nouveau)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Stripe
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    
    -- Plan
    plan TEXT NOT NULL,
    billing_period TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    
    -- État
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    
    -- Stripe
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    stripe_payment_intent_id TEXT,
    
    -- Montants
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_remaining DECIMAL(10,2),
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    
    -- Période
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- État
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    
    -- PDF
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Helper functions RLS
-- (Voir PART2)
```

**Checklist**:
- [ ] Toutes les tables créées
- [ ] Indexes créés
- [ ] Triggers créés
- [ ] Functions RLS créées
- [ ] Contraintes validées

---

### 1.2 - Migrations tables existantes (Jour 3-4 | 16h)

**Pattern de migration**:
```sql
-- TEMPLATE à appliquer sur chaque table

-- Exemple: reservations

-- 1. Ajouter colonnes (nullable d'abord)
ALTER TABLE reservations 
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE;

-- 2. Créer indexes
CREATE INDEX idx_reservations_organization ON reservations(organization_id);
CREATE INDEX idx_reservations_gite ON reservations(gite_id);

-- 3. Créer policy RLS (avant de rendre obligatoire)
DROP POLICY IF EXISTS "tenant_isolation_reservations" ON reservations;
CREATE POLICY "tenant_isolation_reservations"
ON reservations FOR ALL TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- 4. PLUS TARD: Rendre obligatoire (après migration données)
-- ALTER TABLE reservations ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE reservations ALTER COLUMN gite_id SET NOT NULL;
```

**Tables à migrer** (ordre):
1. ✅ reservations
2. ✅ cleaning_schedule
3. ✅ stocks_draps
4. ✅ retours_menage
5. ✅ charges
6. ✅ todos
7. ✅ commits_log
8. ✅ activites_gites
9. ✅ infos_gites
10. ✅ client_access_tokens
11. ✅ historical_data
12. ✅ simulations_fiscales
13. ✅ faq
14. ✅ checklist_templates
15. ✅ checklist_progress

**Script automatique**:
```sql
-- Script pour automatiser les migrations
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'reservations', 'cleaning_schedule', 'stocks_draps', 
        'retours_menage', 'charges', 'todos', 'commits_log',
        'activites_gites', 'infos_gites', 'client_access_tokens',
        'historical_data', 'simulations_fiscales', 'faq',
        'checklist_templates', 'checklist_progress'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables LOOP
        -- Ajouter organization_id
        EXECUTE format('
            ALTER TABLE %I 
            ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
        ', table_name);
        
        -- Créer index
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%I_organization 
            ON %I(organization_id)
        ', table_name, table_name);
        
        -- Créer policy
        EXECUTE format('
            DROP POLICY IF EXISTS "tenant_isolation_%I" ON %I;
            CREATE POLICY "tenant_isolation_%I"
            ON %I FOR ALL TO authenticated
            USING (organization_id = public.get_user_organization_id())
            WITH CHECK (organization_id = public.get_user_organization_id())
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;
```

---

### 1.3 - RLS policies (Jour 5-6 | 16h)

**Fichier**: `sql/multi-tenant/rls_policies_v2.sql`

```sql
-- ================================================================
-- RLS POLICIES MULTI-TENANT
-- ================================================================

-- 1. Organizations (read only own)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_organization" ON organizations;
CREATE POLICY "users_read_own_organization"
ON organizations FOR SELECT TO authenticated
USING (
    id = public.get_user_organization_id()
    OR owner_user_id = auth.uid()
);

DROP POLICY IF EXISTS "users_update_own_organization" ON organizations;
CREATE POLICY "users_update_own_organization"
ON organizations FOR UPDATE TO authenticated
USING (
    id = public.get_user_organization_id()
    AND EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- 2. Gites
ALTER TABLE gites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_gites" ON gites;
CREATE POLICY "tenant_isolation_gites"
ON gites FOR ALL TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- 3. Organization Members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read_own_organization" ON organization_members;
CREATE POLICY "members_read_own_organization"
ON organization_members FOR SELECT TO authenticated
USING (
    organization_id = public.get_user_organization_id()
    OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "admins_manage_members" ON organization_members;
CREATE POLICY "admins_manage_members"
ON organization_members FOR ALL TO authenticated
USING (
    organization_id = public.get_user_organization_id()
    AND EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
);

-- 4-16. Toutes les autres tables (pattern identique)
-- Voir script automatique ci-dessus
```

**Validation**:
```sql
-- Test isolation entre tenants
-- Créer 2 organizations de test
-- Créer 2 users dans chaque
-- Vérifier qu'ils ne voient que leurs données
```

---

### 1.4 - Context globaux JavaScript (Jour 7-8 | 16h)

**Fichier**: `js/tenant-context.js`

```javascript
/**
 * TENANT CONTEXT MANAGER
 * Gère le contexte multi-tenant côté client
 */

class TenantContext {
    constructor() {
        this.organizationId = null;
        this.currentGiteId = null;
        this.userRole = null;
        this.permissions = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Récupérer l'organization de l'utilisateur
            const { data, error } = await window.supabaseClient
                .from('organization_members')
                .select(`
                    organization_id,
                    role,
                    permissions,
                    gites_access,
                    organizations (
                        id,
                        name,
                        slug,
                        plan,
                        features,
                        max_gites,
                        current_gites_count
                    )
                `)
                .eq('user_id', (await window.supabaseClient.auth.getUser()).data.user.id)
                .eq('is_active', true)
                .single();

            if (error) throw error;

            this.organizationId = data.organization_id;
            this.userRole = data.role;
            this.permissions = data.permissions;
            this.organization = data.organizations;
            
            // Charger la liste des gîtes
            await this.loadGites();
            
            // Charger le gîte sélectionné (localStorage)
            const savedGiteId = localStorage.getItem('selectedGiteId');
            if (savedGiteId && this.gites.find(g => g.id === savedGiteId)) {
                this.currentGiteId = savedGiteId;
            } else if (this.gites.length > 0) {
                this.currentGiteId = this.gites[0].id;
            }
            
            this.initialized = true;
            this.triggerEvent('context-loaded');
            
        } catch (error) {
            console.error('Erreur init tenant context:', error);
            throw error;
        }
    }

    async loadGites() {
        const { data, error } = await window.supabaseClient
            .from('gites')
            .select('*')
            .eq('organization_id', this.organizationId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        this.gites = data || [];
    }

    async switchGite(giteId) {
        if (!this.gites.find(g => g.id === giteId)) {
            throw new Error('Gîte introuvable ou accès refusé');
        }
        
        this.currentGiteId = giteId;
        localStorage.setItem('selectedGiteId', giteId);
        this.triggerEvent('gite-changed', { giteId });
    }

    getCurrentGite() {
        return this.gites.find(g => g.id === this.currentGiteId);
    }

    hasPermission(resource, action) {
        if (this.userRole === 'owner') return true;
        if (this.userRole === 'admin') return true;
        
        return this.permissions[resource]?.[action] === true;
    }

    canAccessGite(giteId) {
        if (this.userRole === 'owner' || this.userRole === 'admin') return true;
        if (this.gites_access.length === 0) return true;
        return this.gites_access.includes(giteId);
    }

    triggerEvent(eventName, data = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
}

// Instance globale
window.TenantContext = new TenantContext();
```

**Intégration dans auth.js**:
```javascript
// Dans auth.js, après authentification réussie:
async onAuthSuccess() {
    // ... code existant ...
    
    // Initialiser le contexte tenant
    try {
        await window.TenantContext.init();
        console.log('✅ Tenant context loaded:', window.TenantContext.organizationId);
    } catch (error) {
        console.error('❌ Erreur tenant context:', error);
        // Rediriger vers onboarding si pas d'organization
        if (error.message.includes('organization not found')) {
            window.location.href = '/onboarding.html';
            return;
        }
    }
    
    // ... suite code existant ...
}
```

---

### 1.5 - UI Sélecteur de gîtes (Jour 9-10 | 16h)

**Composant**: `js/components/gite-selector.js`

```javascript
/**
 * COMPOSANT SÉLECTEUR DE GÎTE
 * Affiche le sélecteur en haut de page
 */

class GiteSelector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
        this.setupListeners();
    }

    render() {
        const gites = window.TenantContext.gites;
        const currentGite = window.TenantContext.getCurrentGite();
        
        const html = `
            <div class="gite-selector-wrapper">
                <label for="gite-select">
                    <i class="fas fa-home"></i>
                    Gîte :
                </label>
                <select id="gite-select" class="gite-select">
                    <option value="all">📊 Tous les gîtes</option>
                    ${gites.map(g => `
                        <option value="${g.id}" ${g.id === currentGite?.id ? 'selected' : ''}>
                            🏠 ${g.name}
                        </option>
                    `).join('')}
                </select>
                
                ${window.TenantContext.hasPermission('settings', 'write') ? `
                    <button id="manage-gites-btn" class="btn-secondary">
                        <i class="fas fa-cog"></i>
                        Gérer
                    </button>
                ` : ''}
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    setupListeners() {
        const select = document.getElementById('gite-select');
        select?.addEventListener('change', async (e) => {
            const giteId = e.target.value;
            if (giteId === 'all') {
                window.TenantContext.currentGiteId = null;
                localStorage.removeItem('selectedGiteId');
            } else {
                await window.TenantContext.switchGite(giteId);
            }
            
            // Recharger les données de la page
            if (typeof window.refreshCurrentTab === 'function') {
                await window.refreshCurrentTab();
            }
        });

        document.getElementById('manage-gites-btn')?.addEventListener('click', () => {
            window.location.href = '/settings/gites.html';
        });
    }
}

// Auto-init si élément présent
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gite-selector-container')) {
        window.giteSelector = new GiteSelector('gite-selector-container');
    }
});
```

**CSS**: `css/gite-selector.css`
```css
.gite-selector-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #e0e0e0;
    position: sticky;
    top: 0;
    z-index: 100;
}

.gite-select {
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    min-width: 200px;
    cursor: pointer;
}

.gite-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

**Intégration dans index.html**:
```html
<!-- En haut du body, juste après le header -->
<div id="gite-selector-container"></div>
```

---

## ✅ PHASE 1 - CHECKLIST FINALE

- [ ] Tables créées et migrées
- [ ] RLS policies actives
- [ ] Helper functions testées
- [ ] TenantContext fonctionnel
- [ ] Sélecteur de gîte affiché
- [ ] Tests isolation passés
- [ ] Documentation à jour

**🎯 Résultat**: Infrastructure multi-tenant complète et isolée

---

## 📝 CONCLUSION PARTIE 3

**Phases 2-7 dans PART4_FEATURES.md**

---

**📄 SUITE**: `ROADMAP_MULTI_TENANT_PART4_FEATURES.md`
